param([string]$NavName = "总览", [string]$OutFile = "S:\ZWorker\NetWatch\verify\alpha-overview.png")
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type -Namespace Win32 -Name Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
$p = Get-Process NetWatch | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[Win32.Native]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 600
$root = [System.Windows.Automation.AutomationElement]::RootElement
$cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $p.Id)
$win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
$c1 = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $NavName)
$el = $win.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $c1)
if ($el) {
    try { ($el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)).Invoke() } catch {
        # web 内容可能无 InvokePattern，尝试点击其中心坐标
        $r2 = $el.Current.BoundingRectangle
        Add-Type -Namespace W -Name M -MemberDefinition '[DllImport("user32.dll")] public static extern void SetCursorPos(int x,int y);[DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,UIntPtr e);'
        [W.M]::SetCursorPos([int]($r2.X+$r2.Width/2), [int]($r2.Y+$r2.Height/2))
        [W.M]::mouse_event(2,0,0,0,[UIntPtr]::Zero); [W.M]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
    }
    Start-Sleep -Milliseconds 900
}
$r = $win.Current.BoundingRectangle
$bmp = New-Object System.Drawing.Bitmap([int]$r.Width, [int]$r.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen([int]$r.X, [int]$r.Y, 0, 0, $bmp.Size)
$bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "saved"
