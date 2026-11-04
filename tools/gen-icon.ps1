# NetLens 应用图标生成：Assets\app.ico
# 设计 v11 —— 棱镜（prism）主题的等粗线条版（v10 用户反馈修订）：
#   三角棱镜顺时针倾斜 12°（打破"播放键指向右"的箭头感，纯棱镜截面）；
#   全部线条统一等粗（= 三角描边 8px 基准），扁平线条语言；
#   出射光束全白、无末端节点（v10 的彩色色散与端点按反馈去除），亮度分层表达"分解后渐弱"；
#   三条光路（入射 / 棱内折射 / 出射扇）等宽不同亮度：亮 → 暗 → 亮。
# 输出 256/48/32/16 四档：小尺寸不缩放，按尺寸独立绘制并加粗描边。
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outFile = Join-Path $PSScriptRoot '..\src\NetLens\Assets\app.ico'
New-Item -ItemType Directory -Force -Path (Split-Path $outFile) | Out-Null

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

# 点绕中心顺时针旋转（屏幕坐标 y 向下，θ>0 即视觉顺时针）
function Rotate-Point([float]$x, [float]$y, [float]$cx, [float]$cy, [float]$deg) {
    $rad = $deg * [System.Math]::PI / 180.0
    $c = [System.Math]::Cos($rad); $s = [System.Math]::Sin($rad)
    $dx = $x - $cx; $dy = $y - $cy
    return @{ x = [single]($cx + $dx * $c - $dy * $s); y = [single]($cy + $dx * $s + $dy * $c) }
}

# 画布基准 256，所有几何在基准坐标系中定义，绘制时按 scale 缩放、线宽按 boost 加粗
# $simple=$true 时使用小尺寸简化构图：三角占满画布主体，出射仅三条光束
function Draw-Prism([System.Drawing.Graphics]$g, [float]$scale, [float]$boost, [bool]$simple) {
    $g.SmoothingMode = 'AntiAlias'
    $g.PixelOffsetMode = 'HighQuality'

    # ---- 1. 背景：近黑圆角方 ----
    $m = 8 * $scale; $side = 240 * $scale; $rad = 56 * $scale
    $bgPath = New-RoundedRectPath $m $m $side $side $rad
    $g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 7, 8, 12)), $bgPath)
    $bgPath.Dispose()

    $white = [System.Drawing.Color]::FromArgb(248, 240, 246, 255)
    $lineW = [float](8.0 * $scale * $boost)   # 全图统一线宽 = 三角描边

    # ---- 2. 三角棱镜：原始几何（顶点朝右），绕自身中心倾斜 12°（顶点偏向右上，与出射方向一致） ----
    if ($simple) {
        $ax = 62; $ay = 84; $bx = 62; $by = 204; $cx = 163; $cy = 144
    } else {
        $ax = 64; $ay = 108; $bx = 64; $by = 192; $cx = 137; $cy = 150
    }
    $gx = ($ax + $bx + $cx) / 3.0; $gy = ($ay + $by + $cy) / 3.0
    $t = Rotate-Point $ax $ay $gx $gy (-12.0)
    $b = Rotate-Point $bx $by $gx $gy (-12.0)
    $c = Rotate-Point $cx $cy $gx $gy (-12.0)
    $mid = Rotate-Point $ax ((($ay + $by) / 2.0)) $gx $gy (-12.0)   # 左面（入射面）中点

    $triPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $triPen = New-Object System.Drawing.Pen ($white), $lineW
    $triPen.StartCap = 'Round'; $triPen.EndCap = 'Round'
    $triPen.LineJoin = 'Round'
    $triPath.AddLine([single]($t.x * $scale), [single]($t.y * $scale), [single]($b.x * $scale), [single]($b.y * $scale))
    $triPath.AddLine([single]($b.x * $scale), [single]($b.y * $scale), [single]($c.x * $scale), [single]($c.y * $scale))
    $triPath.CloseFigure()
    $g.DrawPath($triPen, $triPath)
    $triPath.Dispose(); $triPen.Dispose()

    # ---- 3. 入射光束：左缘起点圆点 → 倾斜后左面中点（水平打入） ----
    $inStartX = 24; if ($simple) { $inStartX = 16 }
    $inDotR = [float](7.5 * $scale * $boost)
    $inDot = New-Object System.Drawing.SolidBrush ($white)
    $g.FillEllipse($inDot, [single]($inStartX * $scale - $inDotR), [single]($mid.y * $scale - $inDotR), $inDotR * 2, $inDotR * 2)
    $inDot.Dispose()
    $inPen = New-Object System.Drawing.Pen ($white), $lineW
    $inPen.StartCap = 'Round'; $inPen.EndCap = 'Round'
    $g.DrawLine($inPen, [single]($inStartX * $scale), [single]($mid.y * $scale), [single]($mid.x * $scale), [single]($mid.y * $scale))
    $inPen.Dispose()

    # ---- 4. 穿棱折射线：入射点 → 右顶点（棱镜内部，暗一档；等宽；小尺寸省略） ----
    if (-not $simple) {
        $refCol = [System.Drawing.Color]::FromArgb(140, 240, 246, 255)
        $refPen = New-Object System.Drawing.Pen ($refCol), $lineW
        $refPen.StartCap = 'Round'; $refPen.EndCap = 'Round'
        $g.DrawLine($refPen, [single]($mid.x * $scale), [single]($mid.y * $scale), [single]($c.x * $scale), [single]($c.y * $scale))
        $refPen.Dispose()
    }

    # ---- 5. 出射光束：从右顶点向右上扇形散开 ----
    # v11 反馈落实：全白、统一等粗（= 三角描边）、无末端节点；亮度分层表达分解后渐弱
    $ray1 = [System.Drawing.Color]::FromArgb(248, 240, 246, 255)
    $ray2 = [System.Drawing.Color]::FromArgb(225, 240, 246, 255)
    $ray3 = [System.Drawing.Color]::FromArgb(198, 240, 246, 255)
    if ($simple) {
        $outRays = @(
            @{ a = -25; len = 106; c = $ray1 },
            @{ a = -45; len = 92;  c = $ray2 },
            @{ a = -65; len = 66;  c = $ray3 }
        )
    } else {
        $outRays = @(
            @{ a = -18; len = 106; c = $ray1 },
            @{ a = -32; len = 118; c = $ray1 },
            @{ a = -46; len = 106; c = $ray2 },
            @{ a = -60; len = 90;  c = $ray2 },
            @{ a = -74; len = 68;  c = $ray3 }
        )
    }
    foreach ($r in $outRays) {
        $rad2 = $r.a * [System.Math]::PI / 180.0
        $dx = [System.Math]::Cos($rad2); $dy = [System.Math]::Sin($rad2)
        $pen = New-Object System.Drawing.Pen ($r.c), $lineW
        $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
        $ex = ($c.x + $dx * $r.len) * $scale; $ey = ($c.y + $dy * $r.len) * $scale
        $g.DrawLine($pen, [single]($c.x * $scale), [single]($c.y * $scale), [single]$ex, [single]$ey)
        $pen.Dispose()
    }
}

# ---- 多尺寸输出：各自独立绘制（小尺寸加粗描边），不做整图缩放 ----
$sizes = @(
    @{ px = 256; boost = 1.0 },
    @{ px = 48;  boost = 1.7 },
    @{ px = 32;  boost = 2.2 },
    @{ px = 16;  boost = 3.0 }
)
$pngs = @()
$bmp256 = $null
foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $sz.px, $sz.px
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    Draw-Prism $g ([float]($sz.px / 256.0)) ([float]$sz.boost) ($sz.px -le 48)
    $g.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngs += , @{ Size = $sz.px; Data = $ms.ToArray() }
    if ($sz.px -eq 256) { $bmp256 = $bmp } else { $bmp.Dispose() }
}

# ---- ICO 打包（PNG-in-ICO） ----
$fs = [System.IO.File]::Create($outFile)
$bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$pngs.Count)
$offset = 6 + 16 * $pngs.Count
foreach ($e in $pngs) {
    $szByte = if ($e.Size -eq 256) { 0 } else { $e.Size }
    $bw.Write([byte]$szByte); $bw.Write([byte]$szByte)
    $bw.Write([byte]0); $bw.Write([byte]0)
    $bw.Write([uint16]1); $bw.Write([uint16]32)
    $bw.Write([uint32]$e.Data.Length); $bw.Write([uint32]$offset)
    $offset += $e.Data.Length
}
foreach ($e in $pngs) { $bw.Write($e.Data) }
$bw.Close(); $fs.Close()

# 预览：256 主图 + 小尺寸实拍拼图（人工验收小图可辨性）
$bmp256.Save((Join-Path $PSScriptRoot '..\verify\icon-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$strip = New-Object System.Drawing.Bitmap 360, 80
$gs = [System.Drawing.Graphics]::FromImage($strip)
$gs.Clear([System.Drawing.Color]::FromArgb(255, 40, 40, 46))
$gs.InterpolationMode = 'NearestNeighbor'
$x = 8
foreach ($px in @(48, 32, 16)) {
    $frame = $pngs | Where-Object { $_.Size -eq $px } | Select-Object -First 1
    $img = [System.Drawing.Image]::FromStream((New-Object System.IO.MemoryStream (,$frame.Data)))
    $gs.DrawImage($img, $x, 16, $px, $px)
    $img.Dispose()
    $x += $px + 18
}
$gs.Dispose()
$strip.Save((Join-Path $PSScriptRoot '..\verify\icon-small-strip.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$strip.Dispose()
$bmp256.Dispose()
Write-Output "ICO written: $outFile"
