using System.Diagnostics;
using System.Windows.Automation;

namespace NetLens.Services;

/// 打开任务管理器并尽力定位到目标进程行（UIA 自动选中）。
/// 任务管理器无定位用的命令行参数，只能借 UI Automation 选中行；任何失败都静默退化为普通打开。
public static class TaskManagerLauncher
{
    public static void OpenAndLocate(int pid)
    {
        string name = "";
        int tmId = 0;
        try
        {
            // 先启动任务管理器（目标进程已退出时也保证普通打开），再尝试取进程名用于定位
            var tm = Process.Start(new ProcessStartInfo("taskmgr.exe") { UseShellExecute = true });
            if (tm == null) return;
            tmId = tm.Id;
            try { name = Process.GetProcessById(pid).ProcessName; } catch { return; }
        }
        catch (Exception ex)
        {
            Log.Error("打开任务管理器失败", ex);
            return;
        }
        if (string.IsNullOrEmpty(name)) return;

        _ = Task.Run(async () =>
        {
            try
            {
                // 等任务管理器主窗口就绪（首次启动可能较慢，最多 ~6s）
                AutomationElement? win = null;
                for (int i = 0; i < 20 && win == null; i++)
                {
                    await Task.Delay(300);
                    win = AutomationElement.RootElement.FindFirst(TreeScope.Children,
                        new PropertyCondition(AutomationElement.ProcessIdProperty, tmId));
                }
                if (win == null) return;
                await Task.Delay(800); // 等进程列表填充

                // 确保位于“进程”页（双语尝试；未命中也继续——部分版本默认即进程页）
                foreach (var tabName in new[] { "进程", "Processes" })
                {
                    var tab = win.FindFirst(TreeScope.Descendants,
                        new PropertyCondition(AutomationElement.NameProperty, tabName));
                    if (tab != null && tab.TryGetCurrentPattern(SelectionItemPattern.Pattern, out var tabSel))
                    {
                        ((SelectionItemPattern)tabSel).Select();
                        break;
                    }
                }
                await Task.Delay(600);

                // 按进程名匹配行：优先 SelectionItem，退回 Invoke
                var rows = win.FindAll(TreeScope.Descendants, Condition.TrueCondition);
                foreach (AutomationElement el in rows)
                {
                    var n = el.Current.Name;
                    if (string.IsNullOrEmpty(n) || !n.Contains(name, StringComparison.OrdinalIgnoreCase)) continue;
                    if (el.TryGetCurrentPattern(SelectionItemPattern.Pattern, out var sel))
                    {
                        ((SelectionItemPattern)sel).Select();
                        return;
                    }
                    if (el.TryGetCurrentPattern(InvokePattern.Pattern, out var inv))
                    {
                        ((InvokePattern)inv).Invoke();
                        return;
                    }
                }
                Log.Error("任务管理器定位未命中", new Exception(name)); // 写日志不弹窗：定位是尽力而为
            }
            catch (Exception ex)
            {
                Log.Error("任务管理器定位异常", ex);
            }
        });
    }
}
