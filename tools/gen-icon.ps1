# NetLens 应用图标生成器（管线版）：Assets\app.ico + WebUI\public\brand.png + shell 缓存刷新 + exe 内嵌自检
# 设计 v14 —— 中心对称双棱镜（蝶形）+ 辉光线条：
#   左右两个线框三角顶点相对；一条水平光路自左端圆点贯穿双棱镜至右端圆点
#   （双向流量在 NetLens 中心交汇、分解）；中心竖直谱线上下对称。
#   v14 质感升级：每条主线下叠一层同形宽幅辉光（低透明度冷白），顶点与端点带辉光圈，
#   整体呈"黑底发光棱镜"的绚丽观感；线条主体仍为纯白等粗。
# 清晰度升级：全部尺寸按 4x 超采样绘制（1024 画布→256 等），高质量降采样，
#   边缘亚像素平滑度显著高于直接绘制。
# 管线：ICO(16~256 全帧) → brand.png 同步 → SHChangeNotify 刷新 shell 图标缓存
#   → （build 后再跑一次本脚本 -VerifyOnly 可提取 exe 内嵌图标核对）。
param([switch]$VerifyOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Join-Path $PSScriptRoot '..'
$outFile = Join-Path $root 'src\NetLens\Assets\app.ico'
$brandFile = Join-Path $root 'WebUI\public\brand.png'
$exeFile = Join-Path $root 'src\NetLens\bin\Debug\net10.0-windows\NetLens.exe'
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

# 单条线段：先辉光层（宽幅低透明冷白）再主线（纯白）
function Draw-GlowLine([System.Drawing.Graphics]$g, [float]$x1, [float]$y1, [float]$x2, [float]$y2, [float]$w, [System.Drawing.Color]$main, [System.Drawing.Color]$glow) {
    $gPen = New-Object System.Drawing.Pen ($glow), ([float]($w * 2.0))
    $gPen.StartCap = 'Round'; $gPen.EndCap = 'Round'
    $g.DrawLine($gPen, $x1, $y1, $x2, $y2)
    $gPen.Dispose()
    $mPen = New-Object System.Drawing.Pen ($main), $w
    $mPen.StartCap = 'Round'; $mPen.EndCap = 'Round'
    $g.DrawLine($mPen, $x1, $y1, $x2, $y2)
    $mPen.Dispose()
}

# 圆点：辉光圈 + 实心
function Draw-GlowDot([System.Drawing.Graphics]$g, [float]$cx, [float]$cy, [float]$r, [System.Drawing.Color]$main, [System.Drawing.Color]$glow) {
    $gb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($glow.A, $glow.R, $glow.G, $glow.B))
    $g.FillEllipse($gb, $cx - $r * 1.9, $cy - $r * 1.9, $r * 3.8, $r * 3.8)
    $gb.Dispose()
    $mb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($main.A, $main.R, $main.G, $main.B))
    $g.FillEllipse($mb, $cx - $r, $cy - $r, $r * 2, $r * 2)
    $mb.Dispose()
}

# 基准 256 几何；$S 为实际绘制画布边长（= 256*ss 超采样倍数），所有坐标乘 ss，线宽乘 ss*boost
# $simple=$true：小尺寸简化构图（仅双三角 + 主光路 + 两端圆点）
function Draw-Prism([System.Drawing.Graphics]$g, [float]$ss, [float]$boost, [bool]$simple) {
    $g.SmoothingMode = 'AntiAlias'
    $g.PixelOffsetMode = 'HighQuality'

    $mainC = [System.Drawing.Color]::FromArgb(250, 244, 248, 255)
    $glowC = [System.Drawing.Color]::FromArgb(36, 190, 214, 255)     # 冷白辉光（极淡蓝，光感）
    $rayMain = [System.Drawing.Color]::FromArgb(210, 244, 248, 255)
    $lw = [float](8.0 * $ss * $boost)                                  # 统一线宽 = 三角描边
    $cy = 132.0 * $ss

    # ---- 1. 背景：近黑圆角方 ----
    $m = 8 * $ss; $side = 240 * $ss; $rad = 56 * $ss
    $bgPath = New-RoundedRectPath $m $m $side $side $rad
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 7, 8, 12))
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose(); $bgPath.Dispose()

    # ---- 2. 双三角（蝶形）：顶点相对，中心留 14px 间隙；三边各带辉光 ----
    foreach ($sd in @('L', 'R')) {
        if ($sd -eq 'L') {
            $pts = @(@(52, 92), @(52, 172), @(121, 132))
        } else {
            $pts = @(@(204, 92), @(204, 172), @(135, 132))
        }
        # 辉光层：同形三角整体描一次宽幅
        $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $gp.AddLine([single]($pts[0][0] * $ss), [single]($pts[0][1] * $ss), [single]($pts[1][0] * $ss), [single]($pts[1][1] * $ss))
        $gp.AddLine([single]($pts[1][0] * $ss), [single]($pts[1][1] * $ss), [single]($pts[2][0] * $ss), [single]($pts[2][1] * $ss))
        $gp.CloseFigure()
        $gPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($glowC.A, $glowC.R, $glowC.G, $glowC.B)), ([float]($lw * 2.0))
        $gPen.LineJoin = 'Round'
        $g.DrawPath($gPen, $gp)
        $gPen.Dispose()
        # 主线层
        $mPen = New-Object System.Drawing.Pen ($mainC), $lw
        $mPen.StartCap = 'Round'; $mPen.EndCap = 'Round'; $mPen.LineJoin = 'Round'
        $g.DrawPath($mPen, $gp)
        $mPen.Dispose()
        $gp.Dispose()
    }

    # ---- 3. 水平主光路：左端圆点 → 贯穿双棱镜 → 右端圆点 ----
    Draw-GlowLine $g (24 * $ss) $cy (232 * $ss) $cy $lw $mainC $glowC
    Draw-GlowDot $g (24 * $ss) $cy ([float](7.5 * $ss * $boost)) $mainC $glowC
    Draw-GlowDot $g (232 * $ss) $cy ([float](7.5 * $ss * $boost)) $mainC $glowC

    # ---- 4. 中心竖直谱线：上下对称（色散意象） ----
    if (-not $simple) {
        $rayGlow = [System.Drawing.Color]::FromArgb(30, 190, 214, 255)
        Draw-GlowLine $g (128 * $ss) (132 * $ss - 55 * $ss) (128 * $ss) (132 * $ss + 55 * $ss) ([float]($lw * 0.86)) $rayMain $rayGlow
    }
}

# ---- 多档输出：4x 超采样绘制 → 高质量降采样 ----
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
$SS = 4   # 超采样倍数
$pngs = @()
foreach ($sz in $sizes) {
    $big = $sz.px * $SS
    $bmp = New-Object System.Drawing.Bitmap $big, $big
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    Draw-Prism $g ([float]($big / 256.0)) ([float]$sz.boost) ($sz.px -le 48)
    $g.Dispose()
    # 降采样回目标尺寸
    $final = New-Object System.Drawing.Bitmap $sz.px, $sz.px
    $fg = [System.Drawing.Graphics]::FromImage($final)
    $fg.InterpolationMode = 'HighQualityBicubic'
    $fg.SmoothingMode = 'AntiAlias'
    $fg.PixelOffsetMode = 'HighQuality'
    $fg.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0, 0, $sz.px, $sz.px))
    $fg.Dispose()
    $bmp.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $final.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngs += , @{ Size = $sz.px; Data = $ms.ToArray() }
    if ($sz.px -eq 256) { $final.Save((Join-Path $root 'verify\icon-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png) }
    $final.Dispose()
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

# ---- brand.png 同步 + 小尺寸实拍条 ----
Copy-Item (Join-Path $root 'verify\icon-preview.png') $brandFile -Force
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
$strip.Save((Join-Path $root 'verify\icon-small-strip.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$strip.Dispose()

# ---- 管线：SHChangeNotify 刷新 shell 图标缓存（资源管理器/任务栏固定图标来源） ----
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class ShellNotify {
    [DllImport("shell32.dll")]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
"@
[ShellNotify]::SHChangeNotify(0x08000000, 0x0000, [IntPtr]::Zero, [IntPtr]::Zero)  # SHCNE_ASSOCCHANGED：全局刷新图标关联缓存

# ---- exe 内嵌图标自检（build 后跑 -VerifyOnly 可单独执行核对） ----
if (Test-Path $exeFile) {
    try {
        $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($exeFile)
        $bmp = $ico.ToBitmap()
        $bmp.Save((Join-Path $root 'verify\diag-exe-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output ("exe-embedded-icon: " + $bmp.Width + "x" + $bmp.Height + " -> verify\diag-exe-icon.png")
        $bmp.Dispose()
    } catch { Write-Output ("exe icon extract failed: " + $_.Exception.Message) }
} else {
    Write-Output "exe not found (build first), skip embedded check"
}

Write-Output "ICO written: $outFile"
Write-Output "brand.png synced; shell icon cache refreshed"
