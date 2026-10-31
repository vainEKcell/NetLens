param([string]$OutFile = "S:\ZWorker\NetWatch\verify\page.png")
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type -Namespace Win32 -Name Native -MemberDefinition '
[DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
$p = Get-Process NetWatch | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
$hwnd = $p.MainWindowHandle
# TOPMOST (SWP_NOMOVE|SWP_NOSIZE = 0x3)
[Win32.Native]::SetWindowPos($hwnd, [IntPtr](-1), 0,0,0,0, 0x3) | Out-Null
[Win32.Native]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 700
$root = [System.Windows.Automation.AutomationElement]::RootElement
$cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $p.Id)
$win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
$r = $win.Current.BoundingRectangle
$bmp = New-Object System.Drawing.Bitmap([int]$r.Width, [int]$r.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen([int]$r.X, [int]$r.Y, 0, 0, $bmp.Size)
$bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
# 取消置顶 (HWND_NOTOPMOST = -2)
[Win32.Native]::SetWindowPos($hwnd, [IntPtr](-2), 0,0,0,0, 0x3) | Out-Null
Write-Output "saved"
