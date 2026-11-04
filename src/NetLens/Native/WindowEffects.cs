using System.Runtime.InteropServices;
using System.Windows.Interop;
using System.Windows.Media.Imaging;

namespace NetLens.Native;

/// Win11 DWM 窗口外观：无边框窗口恢复系统圆角（WindowStyle=None 后系统不再自动圆角）。
/// Win10 无此属性（返回错误码），静默降级为直角。
public static class WindowEffects
{
    private const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
    private const int DWMWA_BORDER_COLOR = 34;
    private const int DWMWCP_ROUND = 2;              // 圆角
    private const int DWMWA_COLOR_NONE = unchecked((int)0xFFFFFFFE); // 不画 1px 系统边框

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

    /// 句柄就绪后调用（OnSourceInitialized）。圆角 + 去系统边框线，与深色 UI 融合。
    /// 注意：Win11 的窗口投影与圆角视觉绑定合成，无法用公开 API 单独去除
    /// （DWMWA_NCRENDERING_POLICY 实测不影响它）；浅色主题下窗口右/下沿的投影即此系统行为。
    public static void ApplyRoundedCorners(System.Windows.Window w)
    {
        try
        {
            var helper = new WindowInteropHelper(w);
            if (helper.Handle == IntPtr.Zero) return;
            int pref = DWMWCP_ROUND;
            DwmSetWindowAttribute(helper.Handle, DWMWA_WINDOW_CORNER_PREFERENCE, ref pref, sizeof(int));
            int none = DWMWA_COLOR_NONE;
            DwmSetWindowAttribute(helper.Handle, DWMWA_BORDER_COLOR, ref none, sizeof(int));
        }
        catch { /* 非 Win11：保持直角 */ }
    }

    /// 窗口图标：显式取 ICO 中 ≤64px 的最大帧，高 DPI 标题栏/任务栏不再依赖系统从小帧缩放。
    public static void SetWindowIcon(System.Windows.Window w)
    {
        try
        {
            var decoder = BitmapDecoder.Create(new Uri("pack://application:,,,/Assets/app.ico"),
                BitmapCreateOptions.None, BitmapCacheOption.OnLoad);
            var frame = decoder.Frames
                .Where(f => f.PixelWidth <= 64)
                .OrderByDescending(f => f.PixelWidth)
                .FirstOrDefault() ?? decoder.Frames.OrderByDescending(f => f.PixelWidth).First();
            w.Icon = frame;
        }
        catch
        {
            // 图标加载失败时保持 exe 内嵌图标兜底
        }
    }
}
