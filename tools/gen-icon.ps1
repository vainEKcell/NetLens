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

# v15：纯线条星芒（无封闭图形），中心对称，射线切割背景
#   水平光轴：两端圆点 + 贯穿直线（入射轴）
#   竖直谱线：延长为上下射线（用户点名的中线）
#   分解扇：从中心向右上/左下两个对角各散出两条射线（棱镜"分解"意象，180° 对称）
function Draw-Mark([System.Drawing.Graphics]$g, [float]$ss, [float]$boost) {
    $g.SmoothingMode = 'AntiAlias'
    $g.PixelOffsetMode = 'HighQuality'

    $mainC = [System.Drawing.Color]::FromArgb(250, 244, 248, 255)
    $rayMain = [System.Drawing.Color]::FromArgb(214, 244, 248, 255)
    $glowC = [System.Drawing.Color]::FromArgb(36, 190, 214, 255)
    $lw = [float](8.0 * $ss * $boost)
    $cy = 132.0 * $ss
    $cx = 128.0 * $ss

    # ---- 1. 背景：近黑圆角方 ----
    $m = 8 * $ss; $side = 240 * $ss; $rad = 56 * $ss
    $bgPath = New-RoundedRectPath $m $m $side $side $rad
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 7, 8, 12))
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose(); $bgPath.Dispose()

    # ---- 2. 分解扇：右上两条 + 左下两条（180° 对称） ----
    foreach ($ang in @(-25.0, -55.0, 155.0, 125.0)) {
        $rad2 = $ang * [System.Math]::PI / 180.0
        $len = $(if ([System.Math]::Abs($ang) -eq 25 -or [System.Math]::Abs($ang) -eq 155) { 118 } else { 95 })
        $ex = $cx + [System.Math]::Cos($rad2) * $len * $ss
        $ey = $cy + [System.Math]::Sin($rad2) * $len * $ss
        Draw-GlowLine $g $cx $cy ([float]$ex) ([float]$ey) ([float]($lw * 0.9)) $rayMain $glowC
    }

    # ---- 3. 竖直谱线：上下延长为射线（切割背景） ----
    Draw-GlowLine $g $cx (132 * $ss - 92 * $ss) $cx (132 * $ss + 92 * $ss) ([float]($lw * 0.9)) $rayMain $glowC

    # ---- 3b. 棱镜镜片：左上→右下对角贯穿线（-45° 镜面，与光轴交汇产生折射叙事） ----
    $d = 100 * $ss
    Draw-GlowLine $g ($cx - $d) ($cy - $d) ($cx + $d) ($cy + $d) ([float]($lw * 0.9)) $mainC $glowC

    # ---- 4. 水平光轴：贯穿直线 + 两端圆点 ----
    Draw-GlowLine $g (24 * $ss) $cy (232 * $ss) $cy $lw $mainC $glowC
    Draw-GlowDot $g (24 * $ss) $cy ([float](7.5 * $ss * $boost)) $mainC $glowC
    Draw-GlowDot $g (232 * $ss) $cy ([float](7.5 * $ss * $boost)) $mainC $glowC
}

# ---- 多档输出：单源渲染（1024 超采样母版一张），所有帧从母版降采样 ----
#   保证任务栏 32/48 帧与应用内 256 版观感完全一致（此前各帧独立加粗绘制导致两边不一致）
$sizes = @(256, 128, 64, 48, 32, 24, 20, 16)
$SS = 4
$pngs = @()
$master = New-Object System.Drawing.Bitmap (256 * $SS), (256 * $SS)
$mg = [System.Drawing.Graphics]::FromImage($master)
Draw-Mark $mg ([float](256 * $SS / 256.0)) 1.0
$mg.Dispose()
foreach ($sz in $sizes) {
    $final = New-Object System.Drawing.Bitmap $sz, $sz
    $fg = [System.Drawing.Graphics]::FromImage($final)
    $fg.InterpolationMode = 'HighQualityBicubic'
    $fg.SmoothingMode = 'AntiAlias'
    $fg.PixelOffsetMode = 'HighQuality'
    $fg.DrawImage($master, (New-Object System.Drawing.Rectangle 0, 0, $sz, $sz))
    $fg.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $final.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngs += , @{ Size = $sz; Data = $ms.ToArray() }
    if ($sz -eq 256) { $final.Save((Join-Path $root 'verify\icon-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png) }
    $final.Dispose()
}
$master.Dispose()

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

# ---- brand.png 同步 + 前端 dist 重建（管线关键：应用加载的是 dist，不重建则置顶栏 logo 不更新） ----
Copy-Item (Join-Path $root 'verify\icon-preview.png') $brandFile -Force
Push-Location (Join-Path $root 'WebUI')
& cmd /c "npm run build 2>&1" | Select-Object -Last 1
Pop-Location
if (-not (Test-Path (Join-Path $root 'WebUI\dist\brand.png'))) { throw "dist build failed - brand.png missing" }
Copy-Item (Join-Path $root 'WebUI\dist\brand.png') (Join-Path $root 'verify\diag-dist-brand.png') -Force
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
