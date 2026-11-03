# NetLens 应用图标生成：Assets\app.ico
# 设计 v4（贴合品牌内核「网络节点 · 连接」）：
#   纯黑圆角方底 + 左下偏心发光点 + 扁平放射细线向斜右上发散（点线结合、长度透视聚拢感）
#   元素仅点与线，无面。256px 绘制，输出 256/48/32/16 四档。
# 用法: powershell -ExecutionPolicy Bypass -File tools\gen-icon.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outFile = Join-Path $PSScriptRoot '..\src\NetLens\Assets\app.ico'
New-Item -ItemType Directory -Force -Path (Split-Path $outFile) | Out-Null

$S = 256
$bmp = New-Object System.Drawing.Bitmap $S, $S
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.PixelOffsetMode = 'HighQuality'

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

# ---- 1. 背景：纯黑圆角方 ----
$bgPath = New-RoundedRectPath 8 8 240 240 56
$g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 8, 9, 12)), $bgPath)

# ---- 2. 偏心发光点：左下约 1/3 处，歪斜不居中 ----
$px = 86.0; $py = 170.0
$pr = 13.0
$haloPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$haloPath.AddEllipse([single]($px - 34), [single]($py - 34), 68, 68)
$haloBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $haloPath
$haloBrush.CenterColor = [System.Drawing.Color]::FromArgb(150, 77, 141, 255)
$haloBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 77, 141, 255))
$g.FillPath($haloBrush, $haloPath)
$core = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 235, 244, 255))
$g.FillEllipse($core, [single]($px - $pr), [single]($py - $pr), $pr * 2, $pr * 2)

# ---- 3. 放射细线：从点向斜右上发散（扇形扩张 + 长度透视），末端带小点 ----
$rays = @(
    @{ a = -80; len = 88;  c = [System.Drawing.Color]::FromArgb(255, 120, 175, 255) },
    @{ a = -64; len = 118; c = [System.Drawing.Color]::FromArgb(255, 235, 244, 255) },
    @{ a = -49; len = 96;  c = [System.Drawing.Color]::FromArgb(255, 80, 214, 220) },
    @{ a = -34; len = 148; c = [System.Drawing.Color]::FromArgb(255, 235, 244, 255) },
    @{ a = -20; len = 126; c = [System.Drawing.Color]::FromArgb(255, 120, 175, 255) },
    @{ a = -8;  len = 168; c = [System.Drawing.Color]::FromArgb(255, 235, 244, 255) }
)
foreach ($r in $rays) {
    $rad = $r.a * [System.Math]::PI / 180.0
    $dx = [System.Math]::Cos($rad)
    $dy = [System.Math]::Sin($rad)
    $inner = $pr + 10
    $x1 = [single]($px + $dx * $inner)
    $y1 = [single]($py + $dy * $inner)
    $x2 = [single]($px + $dx * ($inner + $r.len))
    $y2 = [single]($py + $dy * ($inner + $r.len))
    $pen = New-Object System.Drawing.Pen ($r.c), 4.5
    $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
    $tipR = 4.5
    $tip = New-Object System.Drawing.SolidBrush ($r.c)
    $g.FillEllipse($tip, [single]($x2 - $tipR), [single]($y2 - $tipR), $tipR * 2, $tipR * 2)
    $tip.Dispose(); $pen.Dispose()
}

# ---- 4. 多尺寸输出（256/48/32/16） ----
$sizes = @(256, 48, 32, 16)
$pngs = @()
foreach ($sz in $sizes) {
    if ($sz -eq 256) { $src = $bmp } else {
        $src = New-Object System.Drawing.Bitmap $sz, $sz
        $gs = [System.Drawing.Graphics]::FromImage($src)
        $gs.InterpolationMode = 'HighQualityBicubic'
        $gs.DrawImage($bmp, 0, 0, $sz, $sz)
        $gs.Dispose()
    }
    $ms = New-Object System.IO.MemoryStream
    $src.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngs += , @{ Size = $sz; Data = $ms.ToArray() }
    if ($sz -ne 256) { $src.Dispose() }
}

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

# 预览图（人工验收用）
$bmp.Save((Join-Path $PSScriptRoot '..\verify\icon-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "ICO written: $outFile"
