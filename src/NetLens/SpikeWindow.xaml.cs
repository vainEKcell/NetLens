using System.IO;
using System.Windows;
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

    public SpikeWindow(MainViewModel vm, string initialPage = "")
    {
        InitializeComponent();
        var snapshots = new SnapshotBuilder(vm.Agg, vm.Tracker, vm);
        _bridge = new UiBridge(snapshots, vm);
        _initialPage = initialPage;
        Loaded += async (_, _) => await InitWeb();
        Closed += (_, _) => _bridge.Detach();
    }

    private readonly string _initialPage;

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
