# NetLens 应用图标生成：Assets\app.ico
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

# ---- 1. 背景：深空对角渐变圆角方（左上电蓝微光 → 右下深空） ----
$bgPath = New-RoundedRectPath 8 8 240 240 56
$bgRect = New-Object System.Drawing.Rectangle 0, 0, 256, 256
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.Color]::FromArgb(255, 22, 34, 58),
    [System.Drawing.Color]::FromArgb(255, 7, 10, 18),
    [System.Drawing.Drawing2D.LinearGradientMode]::BackwardDiagonal)
$g.FillPath($bgBrush, $bgPath)
$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 64, 86, 130)), 3
$g.DrawPath($borderPen, $bgPath)

# ---- 2. 透镜镜圈：电蓝→青渐变粗描边圆环 ----
$cx = 128.0; $cy = 126.0
$ringR = 74.0
$ringRect = New-Object System.Drawing.Rectangle ([int]($cx - $ringR)), ([int]($cy - $ringR)), ([int]($ringR * 2)), ([int]($ringR * 2))
$ringBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $ringRect,
    [System.Drawing.Color]::FromArgb(255, 77, 141, 255),
    [System.Drawing.Color]::FromArgb(255, 80, 214, 220),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
$ringPen = New-Object System.Drawing.Pen ($ringBrush), 13
$g.DrawEllipse($ringPen, $ringRect)

# ---- 3. 圈内网络图谱：三节点 + 连线（进程流量关系） ----
$nodeR = 7.5
$nodes = @(
    @{ x = 128; y = 84 },
    @{ x = 92;  y = 146 },
    @{ x = 164; y = 146 }
)
$linkPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 120, 180, 255)), 3.5
$g.DrawLine($linkPen, [single]$nodes[0].x, [single]$nodes[0].y, [single]$nodes[1].x, [single]$nodes[1].y)
$g.DrawLine($linkPen, [single]$nodes[0].x, [single]$nodes[0].y, [single]$nodes[2].x, [single]$nodes[2].y)
$g.DrawLine($linkPen, [single]$nodes[1].x, [single]$nodes[1].y, [single]$nodes[2].x, [single]$nodes[2].y)
$nodeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 190, 235, 255))
foreach ($n in $nodes) {
    $g.FillEllipse($nodeBrush, [single]($n.x - $nodeR), [single]($n.y - $nodeR), $nodeR * 2, $nodeR * 2)
}

# ---- 4. 镜片质感：左上弧形高光 + 中心光斑 ----
$hlPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 235, 245, 255)), 5
$g.DrawArc($hlPen, ([int]($cx - $ringR + 16)), ([int]($cy - $ringR + 16)), ([int]($ringR * 2 - 32)), ([int]($ringR * 2 - 32)), 130, 80)
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse([single]($cx - 14), [single]($cy - 20), 28, 28)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $glowPath
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(90, 220, 240, 255)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 220, 240, 255))
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
