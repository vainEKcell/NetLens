using System.Windows;

namespace NetLens.Services;

/// 主窗口关闭拦截的共享逻辑：MainWindow 与 SpikeWindow 共用同一套关闭行为。
/// 窗口端只需在 OnClosing 调用 Intercept，返回 true 时把事件 Cancel。
public static class CloseGuard
{
    // 一次性放行标记（用户在询问窗选了“退出”但未勾选记住时，本次关闭直接放行）
    private const string ForceCloseTag = "force-close";

    /// 返回 true = 已处理（本次应 Cancel 关闭）；false = 放行关闭。
    public static bool Intercept(Window owner, AppSettings settings)
    {
        if (App.ForceExitRequested) return false;          // 托盘“退出”：明确退出
        if (Equals(owner.Tag, ForceCloseTag)) return false; // 询问窗已放行本次关闭

        switch (settings.CloseAction)
        {
            case "tray":
                MinimizeToTray(owner);
                return true;

            case "ask":
                var dlg = new ClosePromptWindow { Owner = owner };
                dlg.ShowDialog();
                switch (dlg.Result)
                {
                    case ClosePromptWindow.PromptResult.Exit:
                        if (dlg.RememberChoice)
                        {
                            settings.CloseAction = "exit";
                            settings.Save();
                        }
                        owner.Tag = ForceCloseTag;
                        return false; // 放行关闭
                    case ClosePromptWindow.PromptResult.ToTray:
                        if (dlg.RememberChoice)
                        {
                            settings.CloseAction = "tray";
                            settings.Save();
                        }
                        MinimizeToTray(owner);
                        return true;
                    default:
                        return true; // 取消：留在当前状态
                }

            default:
                return false; // "exit"：直接退出
        }
    }

    /// 最小化到托盘：隐藏窗口（托盘图标由 TrayIconService 常驻提供恢复入口）
    public static void MinimizeToTray(Window w)
    {
        w.WindowState = WindowState.Normal;
        w.Hide();
    }
}
