# NetLens 应用图标生成：Assets\app.ico
# 设计 v6（用户定稿方向：完整 360° 放射、偏心、扁平白线、无 3D）：
#   纯黑圆角方底 + 偏左放射中心 + 12 条全向扁平白辐条（长短节奏）+ 中心白点。
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

# ---- 2. 放射中心：偏左（非画布中心），完整 360° 放射 ----
$cx = 98.0; $cy = 128.0

# 中心圆点（实心白）
$coreR = 10.0
$core = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 235, 244, 255))
$g.FillEllipse($core, [single]($cx - $coreR), [single]($cy - $coreR), $coreR * 2, $coreR * 2)

# ---- 3. 12 条全向放射线：扁平等宽、长短节奏 ----
$innerR = 20.0
$rays = 12
for ($i = 0; $i -lt $rays; $i++) {
    $ang = $i * (360.0 / $rays) - 90      # 从正上方开始
    $rad = $ang * [System.Math]::PI / 180.0
    Write-Output ("dbg i={0} ang={1} rad={2:N4} rays={3}" -f $i, $ang, $rad, $rays)
    $len = 62.0 + ($(if ($i % 2 -eq 0) { 26 } else { 0 }))   # 长短节奏
    $x1 = [single]($cx + [System.Math]::Cos($rad) * $innerR)
    $y1 = [single]($cy + [System.Math]::Sin($rad) * $innerR)
    $x2 = [single]($cx + [System.Math]::Cos($rad) * ($innerR + $len))
    $y2 = [single]($cy + [System.Math]::Sin($rad) * ($innerR + $len))
    $penW = [single]4.5
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 235, 244, 255)), $penW
    $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
    Write-Output ("ray {0}: ({1:N1},{2:N1}) -> ({3:N1},{4:N1})" -f $i, $x1, $y1, $x2, $y2)
    $pen.Dispose()
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
