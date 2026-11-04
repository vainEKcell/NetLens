# NetLens 应用图标生成：Assets\app.ico
# 设计 v10 —— 棱镜（prism）主题，NetLens 名字本义的表达：
#   棱镜把一束白光分解为光谱，正如 NetLens 把混杂的流量分解为清晰的每进程视图。
#   构图：线框三角棱镜 + 左侧入射光束（起点圆点）+ 穿棱折射线 + 向右上扇形散开的出射光束。
#   语言：黑底、点与线为主、全图克制留白；出射扇带极淡蓝青色散（棱镜的本质意象，
#   与应用内 accent 双色呼应），主光路保持白色。
# 输出 256/48/32/16 四档：小尺寸不缩放，按尺寸独立绘制并加粗描边，保证小图可辨。
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

# 画布基准 256，所有几何在基准坐标系中定义，绘制时按 scale 缩放、线宽按 boost 加粗
# $simple=$true 时使用小尺寸简化构图：三角占满画布主体，出射仅三条粗光束，无末节点
function Draw-Prism([System.Drawing.Graphics]$g, [float]$scale, [float]$boost, [bool]$simple) {
    $g.SmoothingMode = 'AntiAlias'
    $g.PixelOffsetMode = 'HighQuality'

    # ---- 1. 背景：近黑圆角方 ----
    $m = 8 * $scale; $side = 240 * $scale; $rad = 56 * $scale
    $bgPath = New-RoundedRectPath $m $m $side $side $rad
    $g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 7, 8, 12)), $bgPath)
    $bgPath.Dispose()

    $white = [System.Drawing.Color]::FromArgb(248, 240, 246, 255)

    # ---- 2. 三角棱镜：顶点朝右（光线左进右上出） ----
    if ($simple) {
        $ax = 62; $ay = 84; $bx = 62; $by = 204; $cx = 163; $cy = 144
        $midY = 144
    } else {
        $ax = 64; $ay = 108; $bx = 64; $by = 192; $cx = 137; $cy = 150
        $midY = 150
    }
    $triPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $triW = [float](8.0 * $scale * $boost)
    $triPen = New-Object System.Drawing.Pen ($white), $triW
    $triPen.StartCap = 'Round'; $triPen.EndCap = 'Round'
    $triPen.LineJoin = 'Round'
    $triPath.AddLine([single]($ax * $scale), [single]($ay * $scale), [single]($bx * $scale), [single]($by * $scale))
    $triPath.AddLine([single]($bx * $scale), [single]($by * $scale), [single]($cx * $scale), [single]($cy * $scale))
    $triPath.CloseFigure()
    $g.DrawPath($triPen, $triPath)
    $triPath.Dispose(); $triPen.Dispose()

    # ---- 3. 入射光束：左缘起点圆点 → 棱镜左面中点 ----
    $inStartX = 24; if ($simple) { $inStartX = 16 }
    $inDotR = [float](7.5 * $scale * $boost)
    $inDot = New-Object System.Drawing.SolidBrush ($white)
    $g.FillEllipse($inDot, [single]($inStartX * $scale - $inDotR), [single]($midY * $scale - $inDotR), $inDotR * 2, $inDotR * 2)
    $inDot.Dispose()
    $inW = [float](6.5 * $scale * $boost)
    $inPen = New-Object System.Drawing.Pen ($white), $inW
    $inPen.StartCap = 'Round'; $inPen.EndCap = 'Round'
    $g.DrawLine($inPen, [single]($inStartX * $scale), [single]($midY * $scale), [single]($ax * $scale), [single]($midY * $scale))
    $inPen.Dispose()

    # ---- 4. 穿棱折射线：入射点 → 右顶点（棱镜内部，暗一档；小尺寸省略） ----
    if (-not $simple) {
        $refW = [float](3.6 * $scale * $boost)
        $refCol = [System.Drawing.Color]::FromArgb(150, 240, 246, 255)
        $refPen = New-Object System.Drawing.Pen ($refCol), $refW
        $refPen.StartCap = 'Round'; $refPen.EndCap = 'Round'
        $g.DrawLine($refPen, [single]($ax * $scale), [single]($midY * $scale), [single]($cx * $scale), [single]($cy * $scale))
        $refPen.Dispose()
    }

    # ---- 5. 出射光束：从右顶点向右上扇形散开（色散，极淡蓝青系） ----
    # 宽度沿长度递减（彗尾）；全部预检终点边距（距画布缘 ≥ 12px）
    $disp1 = [System.Drawing.Color]::FromArgb(245, 228, 236, 255)   # 近白偏冷
    $disp2 = [System.Drawing.Color]::FromArgb(232, 168, 210, 255)   # 淡蓝
    $disp3 = [System.Drawing.Color]::FromArgb(215, 128, 226, 232)   # 淡青
    if ($simple) {
        $outRays = @(
            @{ a = -25; len = 106; w = 6.0; c = $disp1 },
            @{ a = -45; len = 92;  w = 5.0; c = $disp2 },
            @{ a = -65; len = 66;  w = 4.2; c = $disp3 }
        )
    } else {
        $outRays = @(
            @{ a = -18; len = 106; w = 5.6; c = $disp1 },
            @{ a = -32; len = 116; w = 5.0; c = $disp2 },
            @{ a = -46; len = 106; w = 4.4; c = $disp2 },
            @{ a = -60; len = 90;  w = 3.8; c = $disp3 },
            @{ a = -74; len = 68;  w = 3.2; c = $disp3 }
        )
    }
    foreach ($r in $outRays) {
        $rad2 = $r.a * [System.Math]::PI / 180.0
        $dx = [System.Math]::Cos($rad2); $dy = [System.Math]::Sin($rad2)
        $segN = 3
        for ($seg = 0; $seg -lt $segN; $seg++) {
            $t0 = $seg / $segN; $t1 = ($seg + 1) / $segN
            $w0 = [float]($r.w * $scale * $boost * (1.0 - 0.5 * $t0))
            $pen = New-Object System.Drawing.Pen ($r.c), $w0
            $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
            $sx = $cx + $dx * ($r.len * $t0); $sy = $cy + $dy * ($r.len * $t0)
            $ex = $cx + $dx * ($r.len * $t1); $ey = $cy + $dy * ($r.len * $t1)
            $g.DrawLine($pen, [single]($sx * $scale), [single]($sy * $scale), [single]($ex * $scale), [single]($ey * $scale))
            $pen.Dispose()
        }
        # 长线末端小节点（连接意象；仅完整构图）
        if (-not $simple -and $r.len -ge 96) {
            $tipR = [float](3.6 * $scale * $boost)
            $tipX = ($cx + $dx * ($r.len + 5)) * $scale; $tipY = ($cy + $dy * ($r.len + 5)) * $scale
            $tip = New-Object System.Drawing.SolidBrush ($r.c)
            $g.FillEllipse($tip, [single]($tipX - $tipR), [single]($tipY - $tipR), $tipR * 2, $tipR * 2)
            $tip.Dispose()
        }
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
