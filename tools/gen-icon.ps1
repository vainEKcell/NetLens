# NetLens 应用图标生成：Assets\app.ico
# 设计 v13 —— 中心对称双棱镜（logo 兼作收放按钮、会旋转，故取 180° 旋转对称构图）：
#   左右两个线框三角顶点相对（蝶形）；一条水平光路自左端圆点贯穿双棱镜至右端圆点
#   ——双向流量在 NetLens 中心交汇、分解；中心间隙向上/向下对称谱出两条色散线。
#   全部线条等粗（= 三角描边 8px 基准），扁平点线语言，黑底。
# 输出 16~256 全帧位：小尺寸不缩放，按尺寸独立绘制并加粗描边。
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
# v13：中心对称双棱镜（蝶形）——logo 兼作收放按钮会旋转，图形绕中心转 180° 与自身重合
#   左右两个线框三角顶点相对；一条水平光路自左端圆点贯穿双棱镜至右端圆点
#   （双向流量在 NetLens 中心交汇分解）；中心间隙向上/向下对称谱出两条色散线。
# $simple=$true 时使用小尺寸简化构图：仅双三角 + 主光路 + 两端圆点
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
    $cy = 132.0                                # 光路水平线（构图垂直中心）

    # ---- 2. 双三角（蝶形）：顶点相对，中心留 14px 间隙 ----
    # 左三角：竖边 (52,92)-(52,172)，顶点 (121,132)；右三角为中心对称镜像
    $triPen = New-Object System.Drawing.Pen ($white), $lineW
    $triPen.StartCap = 'Round'; $triPen.EndCap = 'Round'
    $triPen.LineJoin = 'Round'
    foreach ($side in @('L', 'R')) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        if ($side -eq 'L') {
            $path.AddLine([single](52 * $scale), [single](92 * $scale), [single](52 * $scale), [single](172 * $scale))
            $path.AddLine([single](52 * $scale), [single](172 * $scale), [single](121 * $scale), [single]($cy * $scale))
        } else {
            $path.AddLine([single](204 * $scale), [single](92 * $scale), [single](204 * $scale), [single](172 * $scale))
            $path.AddLine([single](204 * $scale), [single](172 * $scale), [single](135 * $scale), [single]($cy * $scale))
        }
        $path.CloseFigure()
        $g.DrawPath($triPen, $path)
        $path.Dispose()
    }
    $triPen.Dispose()

    # ---- 3. 水平主光路：左端圆点 → 贯穿双棱镜 → 右端圆点（双向对流的交汇线） ----
    $dotR = [float](7.5 * $scale * $boost)
    $dot = New-Object System.Drawing.SolidBrush ($white)
    $g.FillEllipse($dot, [single](24 * $scale - $dotR), [single]($cy * $scale - $dotR), $dotR * 2, $dotR * 2)
    $g.FillEllipse($dot, [single](232 * $scale - $dotR), [single]($cy * $scale - $dotR), $dotR * 2, $dotR * 2)
    $dot.Dispose()
    $mainPen = New-Object System.Drawing.Pen ($white), $lineW
    $mainPen.StartCap = 'Round'; $mainPen.EndCap = 'Round'
    $g.DrawLine($mainPen, [single](24 * $scale), [single]($cy * $scale), [single](232 * $scale), [single]($cy * $scale))
    $mainPen.Dispose()

    # ---- 4. 中心谱线：自双顶点间隙沿竖直对称向上/向下谱出（色散意象，180° 对称） ----
    if (-not $simple) {
        $rayCol = [System.Drawing.Color]::FromArgb(205, 240, 246, 255)
        $rayPen = New-Object System.Drawing.Pen ($rayCol), $lineW
        $rayPen.StartCap = 'Round'; $rayPen.EndCap = 'Round'
        foreach ($ang in @(-90.0, 90.0)) {
            $rad2 = $ang * [System.Math]::PI / 180.0
            $len = 55
            $ex = (128 + [System.Math]::Cos($rad2) * $len) * $scale
            $ey = ($cy + [System.Math]::Sin($rad2) * $len) * $scale
            $g.DrawLine($rayPen, [single](128 * $scale), [single]($cy * $scale), [single]$ex, [single]$ey)
        }
        $rayPen.Dispose()
    }
}

# ---- 多尺寸输出：各自独立绘制（小尺寸加粗描边），不做整图缩放 ----
# 帧覆盖 16~256 全档（含 20/24 高 DPI 任务栏档与 64/128 大图标档），避免高分辨率显示取帧糊
$sizes = @(
    @{ px = 256; boost = 1.0 },
    @{ px = 128; boost = 1.15 },
    @{ px = 64;  boost = 1.3 },
    @{ px = 48;  boost = 1.7 },
    @{ px = 32;  boost = 2.2 },
    @{ px = 24;  boost = 2.5 },
    @{ px = 20;  boost = 2.8 },
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
