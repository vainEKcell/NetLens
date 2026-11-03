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

# ---- 2. 偏心点：深处（更小更暗，透视消失点） ----
$px = 86.0; $py = 170.0
$pr = 10.0
$haloPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$haloPath.AddEllipse([single]($px - 30), [single]($py - 30), 60, 60)
$haloBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $haloPath
$haloBrush.CenterColor = [System.Drawing.Color]::FromArgb(170, 77, 141, 255)
$haloBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 77, 141, 255))
$g.FillPath($haloBrush, $haloPath)
$ring = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 235, 244, 255)), 3
$g.DrawEllipse($ring, [single]($px - $pr), [single]($py - $pr), $pr * 2, $pr * 2)

# ---- 3. 放射白线：从点朝观察者射来——每线分三段由细渐粗（透视=越近越粗） ----
$rays = @(
    @{ a = -80; len = 88 },
    @{ a = -64; len = 118 },
    @{ a = -49; len = 96 },
    @{ a = -34; len = 148 },
    @{ a = -20; len = 126 },
    @{ a = -8;  len = 168 }
)
$white = [System.Drawing.Color]::FromArgb(255, 235, 244, 255)
foreach ($r in $rays) {
    $rad = $r.a * [System.Math]::PI / 180.0
    $dx = [System.Math]::Cos($rad)
    $dy = [System.Math]::Sin($rad)
    $inner = $pr + 8
    $segN = 3
    $w0 = 2.0; $w1 = 4.8
    for ($seg = 0; $seg -lt $segN; $seg++) {
        $t0 = $seg / $segN
        $t1 = ($seg + 1) / $segN
        $wid = [single]($w0 + ($w1 - $w0) * ($seg + 0.5) / $segN)
        $pen = New-Object System.Drawing.Pen ($white), $wid
        $pen.StartCap = 'Flat'; $pen.EndCap = 'Flat'
        $x1 = [single]($px + $dx * ($inner + $r.len * $t0))
        $y1 = [single]($py + $dy * ($inner + $r.len * $t0))
        $x2 = [single]($px + $dx * ($inner + $r.len * $t1))
        $y2 = [single]($py + $dy * ($inner + $r.len * $t1))
        $g.DrawLine($pen, $x1, $y1, $x2, $y2)
        $pen.Dispose()
    }
    $tipR = 5.0
    $tip = New-Object System.Drawing.SolidBrush ($white)
    $tipX = [single]($px + $dx * ($inner + $r.len))
    $tipY = [single]($py + $dy * ($inner + $r.len))
    $g.FillEllipse($tip, $tipX - $tipR, $tipY - $tipR, $tipR * 2, $tipR * 2)
    $tip.Dispose()
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
