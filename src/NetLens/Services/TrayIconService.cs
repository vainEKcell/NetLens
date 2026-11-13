using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using Hardcodet.Wpf.TaskbarNotification;

namespace NetLens.Services;

/// App 层共享托盘图标：主窗口（classic WPF / WebView2 spike）都挂同一份。
/// 左键恢复主界面，右键菜单提供显示/退出；窗口隐藏到托盘后由此恢复。
public sealed class TrayIconService : IDisposable
{
    private readonly TaskbarIcon _tray = new();
    private readonly Window _owner;

    public TrayIconService(Window owner)
    {
        _owner = owner;
        try
        {
            // BitmapDecoder 显式取 ICO 最大帧，避免默认取 16px 帧在高 DPI 下发虚
            var decoder = BitmapDecoder.Create(new Uri("pack://application:,,,/Assets/app.ico"),
                BitmapCreateOptions.None, BitmapCacheOption.OnLoad);
            _tray.IconSource = decoder.Frames.OrderByDescending(f => f.PixelWidth).First();
        }
        catch (Exception ex)
        {
            Log.Error("托盘图标加载失败，使用空图标兜底", ex);
        }
        _tray.ToolTipText = "NetLens";
        _tray.TrayLeftMouseUp += (_, _) => ShowMainWindow();

        var menu = new ContextMenu();
        var show = new MenuItem { Header = L10n.T("tray.show") };
        show.Click += (_, _) => ShowMainWindow();
        var exit = new MenuItem { Header = L10n.T("tray.exit") };
        exit.Click += (_, _) => App.RequestExit();
        menu.Items.Add(show);
        menu.Items.Add(exit);
        _tray.ContextMenu = menu;
    }

    public void ShowMainWindow()
    {
        _owner.Show();
        _owner.WindowState = WindowState.Normal;
        _owner.Activate();
        // 托盘 Hide/Show 往返后 WebView2 偶发不重绘（内容黑屏）：强制触发一次重排
        if (_owner is SpikeWindow sp) sp.PokeRender();
    }

    public void Dispose() => _tray.Dispose();
}
