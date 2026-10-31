using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using NetWatch.Bridge;
using NetWatch.Services;
using NetWatch.ViewModels;

namespace NetWatch;

/// spike 竖切：WebView2 宿主 + UiBridge，验证提权稳定性/每秒推送/大表虚拟滚动。
/// 通过 --spike 启动参数进入，默认启动路径不受影响。
public partial class SpikeWindow : Window
{
    private readonly UiBridge _bridge;

    public SpikeWindow(MainViewModel vm)
    {
        InitializeComponent();
        var snapshots = new SnapshotBuilder(vm.Agg, vm.Tracker, vm);
        // spike 阶段经 TogglePause 控制启停；0.2 由桥直接命令服务层
        _bridge = new UiBridge(snapshots,
            () => { if (!vm.Paused) vm.TogglePause(); },
            () => { if (vm.Paused) vm.TogglePause(); });
        Loaded += async (_, _) => await InitWeb();
        Closed += (_, _) => _bridge.Detach();
    }

    private async Task InitWeb()
    {
        // 提权进程的 userDataFolder 显式指到用户目录，避免写入 Program Files
        var dataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NetWatch", "WebView2");
        var env = await CoreWebView2Environment.CreateAsync(
            userDataFolder: dataDir,
            options: new CoreWebView2EnvironmentOptions { AdditionalBrowserArguments = "--disable-features=msSmartScreenProtection" });
        await Web.EnsureCoreWebView2Async(env);

        // dist 目录映射为 https://app.local，离线加载前端产物
        var dist = Path.Combine(AppContext.BaseDirectory, "WebUI");
        Web.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "app.local", dist, CoreWebView2HostResourceAccessKind.Allow);
        Web.CoreWebView2.NavigationCompleted += (_, _) => _bridge.Attach(Web.CoreWebView2);
        Web.CoreWebView2.OpenDevToolsWindow();
        Web.Source = new Uri("https://app.local/index.html");
    }
}
