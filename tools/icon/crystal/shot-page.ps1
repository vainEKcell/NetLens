# 单页窗口截图：PrintWindow（仅窗口内容，无背景）；先终止旧实例再带参启动
param(
    [string]$Page = "overview",
    [string]$Out = "S:\ZWorker\NetWatch\assets\screenshots\overview.png"
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinS {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
Stop-Process -Name NetLens -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Process -FilePath 'S:\ZWorker\NetWatch\src\NetLens\bin\Debug\net10.0-windows\NetLens.exe' -Verb RunAs -ArgumentList "--spike:$Page"
Start-Sleep -Seconds 14

$proc = Get-Process NetLens -ErrorAction Stop | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $proc) { throw 'no NetLens window' }
$hwnd = $proc.MainWindowHandle

$rect = New-Object WinS+RECT
[WinS]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$wd = $rect.Right - $rect.Left; $ht = $rect.Bottom - $rect.Top
Write-Host "window rect: $($rect.Left),$($rect.Top) ${wd}x${ht}"

$bmp = New-Object System.Drawing.Bitmap($wd, $ht)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
[WinS]::PrintWindow($hwnd, $hdc, 2) | Out-Null
$g.ReleaseHdc($hdc)
$g.Dispose()
$bmp.Save($Out)
$bmp.Dispose()
Write-Host "saved: $Out"
