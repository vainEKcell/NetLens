# 图标接入验证：提权启动 → TOPMOST 置顶 → 窗口截图 + 全屏截图（任务栏）
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$exe = 'S:\ZWorker\NetWatch\src\NetLens\bin\Debug\net10.0-windows\NetLens.exe'
Start-Process -FilePath $exe -Verb RunAs -ArgumentList '--spike:page=settings'
Start-Sleep -Seconds 7

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int X, int Y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$proc = Get-Process NetLens -ErrorAction Stop | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $proc) { throw 'no NetLens process with a main window' }
$hwnd = $proc.MainWindowHandle
[Win]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 400
# TOPMOST + 移到 (50,50)，保持尺寸（SWP_NOSIZE=0x1）
[Win]::SetWindowPos($hwnd, [IntPtr](-1), 50, 50, 0, 0, 0x1) | Out-Null
Start-Sleep -Milliseconds 400

$rect = New-Object Win+RECT
[Win]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$wd = $rect.Right - $rect.Left; $ht = $rect.Bottom - $rect.Top
Write-Host "window rect: $($rect.Left),$($rect.Top) ${wd}x${ht}"

# 窗口截图
$bmp = New-Object System.Drawing.Bitmap($wd, $ht)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size($wd, $ht)))
$g.Dispose()
$bmp.Save('S:\ZWorker\NetWatch\verify\logo-final\verify-window.png')
$bmp.Dispose()

# 全屏截图（任务栏图标）
$sw = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width
$sh = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height
$bmp2 = New-Object System.Drawing.Bitmap($sw, $sh)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size($sw, $sh)))
$g2.Dispose()
$bmp2.Save('S:\ZWorker\NetWatch\verify\logo-final\verify-fullscreen.png')
$bmp2.Dispose()
Write-Host 'screenshots saved'
