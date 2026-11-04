# NetLens 应用图标生成：Assets\app.ico
# 设计 v9 —— 意图的程序化艺术实现：
#   偏心点 = 深空中的信号源（左下，歪斜）
#   放射渐细线（tapered rays）= 从信号源射出的连接束，向右上方形成动势
#   手法：每条线分四段宽度递减（彗尾渐细），长度按「右上倾向」加权——
#   右上方向的线更长更亮，反方向短而淡，整体构成对角动势。留白呼吸。
# 输出 256/48/32/16 四档 ICO。
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
$g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 7, 8, 12)), $bgPath)

# ---- 2. 信号源：左下偏心点（极淡白光晕 + 白心） ----
$px = 80.0; $py = 176.0
$pr = 12.0
$haloPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$haloPath.AddEllipse([single]($px - 40), [single]($py - 40), 80, 80)
$haloBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $haloPath
$haloBrush.CenterColor = [System.Drawing.Color]::FromArgb(110, 214, 228, 255)
$haloBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 214, 228, 255))
$g.FillPath($haloBrush, $haloPath)
$core = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 240, 246, 255))
$g.FillEllipse($core, [single]($px - $pr), [single]($py - $pr), $pr * 2, $pr * 2)

# ---- 3. 渐细放射线（tapered rays） ----
# 每条线：角度（度，-90=正上，0=正右）+ 长度 + 起始宽度
# 右上象限（-15..-85）密集且长 = 动势方向；其余方向少量短线 = 平衡构图
# 颜色全部白色系（用户明确要求线统一白色），层次靠透明度与粗细表达
$rayBright = [System.Drawing.Color]::FromArgb(248, 240, 246, 255)
$rayMid    = [System.Drawing.Color]::FromArgb(210, 240, 246, 255)
$rayDim    = [System.Drawing.Color]::FromArgb(165, 240, 246, 255)
$rays = @(
    @{ a = -84; len = 140; w = 5.0; c = $rayBright },
    @{ a = -68; len = 148; w = 5.0; c = $rayBright },
    @{ a = -52; len = 138; w = 4.6; c = $rayBright },
    @{ a = -38; len = 145; w = 4.6; c = $rayMid },
    @{ a = -25; len = 112; w = 4.0; c = $rayMid },
    @{ a = -12; len = 92;  w = 3.6; c = $rayBright },
    @{ a = 8;   len = 62;  w = 3.0; c = $rayMid },
    @{ a = 32;  len = 46;  w = 2.6; c = $rayBright },
    @{ a = 118; len = 50;  w = 2.6; c = $rayMid },
    @{ a = 148; len = 38;  w = 2.2; c = $rayDim },
    @{ a = 178; len = 28;  w = 2.0; c = $rayDim }
)
foreach ($r in $rays) {
    $rad = $r.a * [System.Math]::PI / 180.0
    $dx = [System.Math]::Cos($rad)
    $dy = [System.Math]::Sin($rad)
    $inner = $pr + 6
    # 四段渐细：彗尾（宽 → 细）
    $segN = 4
    for ($seg = 0; $seg -lt $segN; $seg++) {
        $t0 = $seg / $segN
        $t1 = ($seg + 1) / $segN
        $wid = [single]($r.w * (1.0 - 0.72 * $t0))
        $pen = New-Object System.Drawing.Pen ($r.c), $wid
        $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
        $x1 = [single]($px + $dx * ($inner + $r.len * $t0))
        $y1 = [single]($py + $dy * ($inner + $r.len * $t0))
        $x2 = [single]($px + $dx * ($inner + $r.len * $t1))
        $y2 = [single]($py + $dy * ($inner + $r.len * $t1))
        $g.DrawLine($pen, $x1, $y1, $x2, $y2)
        $pen.Dispose()
    }
    # 末端小节点（连接意象）：仅长线（len > 90）配点
    if ($r.len -gt 90) {
        $tipR = [single](3.2 * $r.w / 5.0)
        $tipX = [single]($px + $dx * ($inner + $r.len + 4))
        $tipY = [single]($py + $dy * ($inner + $r.len + 4))
        $tip = New-Object System.Drawing.SolidBrush ($r.c)
        $g.FillEllipse($tip, $tipX - $tipR, $tipY - $tipR, $tipR * 2, $tipR * 2)
        $tip.Dispose()
    }
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
