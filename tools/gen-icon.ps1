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

# ---- 2. 有机放射：偏左中心，粗圆头白线、非对称角度与长度（手绘示意复刻） ----
$cx = 84.0; $cy = 132.0
$innerR = 10.0
# 手绘示意复刻：角度（度）+ 长度 + 线宽——右上密集多长线，其余方向少量短线
$rays = @(
    @{ a = -78;  len = 96;  w = 10 },   # 右上（最长）
    @{ a = -62;  len = 118; w = 10 },   # 右上（最长）
    @{ a = -46;  len = 108; w = 10 },   # 右上
    @{ a = -31;  len = 96;  w = 10 },   # 右上
    @{ a = -16;  len = 86;  w = 10 },   # 右
    @{ a = 6;    len = 96;  w = 10 },   # 右下（最长）
    @{ a = 22;   len = 74;  w = 10 },   # 右下
    @{ a = 44;   len = 62;  w = 10 },   # 下
    @{ a = 112;  len = 52;  w = 10 },   # 左下（短）
    @{ a = 148;  len = 48;  w = 10 },   # 左（短）
    @{ a = -148; len = 46;  w = 10 },   # 左上（短）
    @{ a = -118; len = 44;  w = 10 }    # 上（短）
)
foreach ($r in $rays) {
    $rad = $r.a * [System.Math]::PI / 180.0
    $dx = [System.Math]::Cos($rad)
    $dy = [System.Math]::Sin($rad)
    $x1 = [single]($cx + $dx * $innerR)
    $y1 = [single]($cy + $dy * $innerR)
    $x2 = [single]($cx + $dx * ($innerR + $r.len))
    $y2 = [single]($cy + $dy * ($innerR + $r.len))
    $w = [single]$r.w
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 228, 232, 240)), $w
    $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
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
