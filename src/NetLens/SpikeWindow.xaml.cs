using System.ComponentModel;
using System.IO;
using System.Windows;
using System.Windows.Media.Imaging;
using Microsoft.Web.WebView2.Core;
using NetLens.Bridge;
using NetLens.Services;
using NetLens.ViewModels;

namespace NetLens;

/// spike 竖切：WebView2 宿主 + UiBridge，验证提权稳定性/每秒推送/大表虚拟滚动。
/// 通过 --spike 启动参数进入，默认启动路径不受影响。
public partial class SpikeWindow : Window
{
    private readonly UiBridge _bridge;
    private readonly MainViewModel _vm;

    public SpikeWindow(MainViewModel vm, string initialPage = "")
    {
        InitializeComponent();
        _vm = vm;
        var snapshots = new SnapshotBuilder(vm.Agg, vm.Tracker, vm);
        _bridge = new UiBridge(snapshots, vm);
        _initialPage = initialPage;
        LoadCaptionIcon();
        Loaded += async (_, _) => await InitWeb();
        Closed += (_, _) => _bridge.Detach();
    }

    private readonly string _initialPage;

    /// 标题栏图标：显式取 ICO 最大帧（22px 显示），比系统 caption 16px 更饱满
    private void LoadCaptionIcon()
    {
        try
        {
            var decoder = BitmapDecoder.Create(new Uri("pack://application:,,,/Assets/app.ico"),
                BitmapCreateOptions.None, BitmapCacheOption.OnLoad);
            CaptionIcon.Source = decoder.Frames.OrderByDescending(f => f.PixelWidth).First();
        }
        catch (Exception ex)
        {
            Log.Error("标题栏图标加载失败", ex);
        }
    }

    // ---------- 窗口控制（自绘 caption） ----------

    private void OnMin(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

    private void OnMax(object sender, RoutedEventArgs e)
        => WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void OnClose(object sender, RoutedEventArgs e) => Close();

    protected override void OnClosing(CancelEventArgs e)
    {
        // 统一关闭行为：ask 弹询问窗 / tray 隐藏到托盘 / exit 直接退出
        if (CloseGuard.Intercept(this, _vm.Settings)) e.Cancel = true;
        base.OnClosing(e);
    }

    protected override void OnStateChanged(EventArgs e)
    {
        base.OnStateChanged(e);
        if (WindowState == WindowState.Minimized) Hide(); // 最小化进托盘，由托盘恢复
    }

    private async Task InitWeb()
    {
        // 提权进程的 userDataFolder 显式指到用户目录，避免写入 Program Files
        var dataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NetLens", "WebView2");
        var env = await CoreWebView2Environment.CreateAsync(
            userDataFolder: dataDir,
            options: new CoreWebView2EnvironmentOptions { AdditionalBrowserArguments = "--disable-features=msSmartScreenProtection" });
        await Web.EnsureCoreWebView2Async(env);

        // dist 目录映射为 https://app.local，离线加载前端产物
        var dist = Path.Combine(AppContext.BaseDirectory, "WebUI");
        Web.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "app.local", dist, CoreWebView2HostResourceAccessKind.Allow);
        Web.CoreWebView2.NavigationCompleted += (_, _) => _bridge.Attach(Web.CoreWebView2);
        Web.Source = new Uri("https://app.local/index.html#/" + _initialPage);
    }
}
