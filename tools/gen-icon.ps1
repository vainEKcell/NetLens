﻿# NetLens 应用图标生成：Assets\app.ico
# 设计（贴合品牌内核「透镜·看清每进程流量」）：
#   深空圆角方底 + 电蓝→青渐变圆环（透镜镜圈）+ 圈内三节点网络连线（进程流量图谱）
#   + 镜片高光。元素少线条粗，16px 缩小仍可辨。256px 绘制，输出 256/48/32/16 四档。
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

# ---- 1. 背景：深空对角渐变圆角方 ----
$bgPath = New-RoundedRectPath 8 8 240 240 56
$bgRect = New-Object System.Drawing.Rectangle 0, 0, 256, 256
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.Color]::FromArgb(255, 20, 30, 52),
    [System.Drawing.Color]::FromArgb(255, 6, 9, 16),
    [System.Drawing.Drawing2D.LinearGradientMode]::BackwardDiagonal)
$g.FillPath($bgBrush, $bgPath)
$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 60, 80, 124)), 3
$g.DrawPath($borderPen, $bgPath)

$cx = 128.0; $cy = 128.0

# ---- 2. 外细环（品牌环，低饱和） ----
$outerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(200, 92, 132, 200)), 4
$g.DrawEllipse($outerPen, [single]($cx - 108), [single]($cy - 108), 216, 216)

# ---- 3. 光圈六叶：扇叶渐变（电蓝↔青交替），绕中心旋转排布 ----
$leafOuter = 88.0
$leafInner = 30.0
for ($i = 0; $i -lt 6; $i++) {
    $rot = $i * 60
    $state = $g.Save()
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform($rot)
    $leafRect = New-Object System.Drawing.Rectangle ([int](-$leafOuter)), ([int](-$leafOuter)), ([int]($leafOuter * 2)), ([int]($leafOuter * 2))
    $c1 = if ($i % 2 -eq 0) { [System.Drawing.Color]::FromArgb(255, 77, 141, 255) } else { [System.Drawing.Color]::FromArgb(255, 80, 200, 220) }
    $c2 = if ($i % 2 -eq 0) { [System.Drawing.Color]::FromArgb(255, 55, 100, 205) } else { [System.Drawing.Color]::FromArgb(255, 40, 145, 180) }
    $leafBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $leafRect, $c1, $c2, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillPie($leafBrush, [int](-$leafOuter), [int](-$leafOuter), [int]($leafOuter * 2), [int]($leafOuter * 2), 6, 48)
    $g.Restore($state)
}
$leafEdgePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(150, 200, 225, 255)), 2
for ($i = 0; $i -lt 6; $i++) {
    $rot = $i * 60
    $state = $g.Save()
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform($rot)
    $g.DrawPie($leafEdgePen, [int](-$leafOuter), [int](-$leafOuter), [int]($leafOuter * 2), [int]($leafOuter * 2), 6, 48)
    $g.Restore($state)
}

# ---- 4. 中心孔：深色圆 + 发光环（光圈孔） ----
$holeR = 26.0
$holeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 8, 12, 20))
$g.FillEllipse($holeBrush, [single]($cx - $holeR), [single]($cy - $holeR), $holeR * 2, $holeR * 2)
$holeRing = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(220, 140, 190, 255)), 3.5
$g.DrawEllipse($holeRing, [single]($cx - $holeR), [single]($cy - $holeR), $holeR * 2, $holeR * 2)
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse([single]($cx - $holeR - 10), [single]($cy - $holeR - 10), ($holeR + 10) * 2, ($holeR + 10) * 2)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $glowPath
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(110, 120, 180, 255))
$g.FillPath($glowBrush, $glowPath)


# ---- 5. 多尺寸输出（256/48/32/16） ----
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

Write-Output "图标已生成: $outFile（256/48/32/16 四档）"
# 预览图（人工验收用）
$bmp.Save((Join-Path $PSScriptRoot '..\verify\icon-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
