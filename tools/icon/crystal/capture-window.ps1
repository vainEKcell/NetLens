# 窗口内容截图：PrintWindow（PW_RENDERFULLCONTENT）——不受遮挡与 z-order 影响
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinP {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
$proc = Get-Process NetLens -ErrorAction Stop | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $proc) { throw 'no NetLens window' }
$hwnd = $proc.MainWindowHandle

$rect = New-Object WinP+RECT
[WinP]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$wd = $rect.Right - $rect.Left; $ht = $rect.Bottom - $rect.Top
Write-Host "window rect: $($rect.Left),$($rect.Top) ${wd}x${ht}"

$bmp = New-Object System.Drawing.Bitmap($wd, $ht)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
# PW_RENDERFULLCONTENT = 2：包含 WebView2/DirectX 合成内容
[WinP]::PrintWindow($hwnd, $hdc, 2) | Out-Null
$g.ReleaseHdc($hdc)
$g.Dispose()
$bmp.Save('S:\ZWorker\NetWatch\verify\logo-final\verify-window.png')
$bmp.Dispose()
Write-Host 'window capture saved (PrintWindow)'
