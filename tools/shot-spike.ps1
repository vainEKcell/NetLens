param()
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace Win32 -Name Native -MemberDefinition '
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'
$p = Get-Process NetLens | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[Win32.Native]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
[Win32.Native]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 800
Add-Type -AssemblyName System.Windows.Forms
$r = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap(1280, 800)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen([int]($r.Width-1280)/2, [int]($r.Height-800)/2, 0, 0, $bmp.Size)
$bmp.Save("S:\ZWorker\NetLens\verify\spike-shot.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "saved"
