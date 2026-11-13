using System.ComponentModel;
using System.IO;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media.Imaging;
using Microsoft.Web.WebView2.Core;
using NetLens.Bridge;
using NetLens.Native;
using NetLens.Services;
using NetLens.ViewModels;

namespace NetLens;

/// spike 竖切：WebView2 宿主 + UiBridge，验证提权稳定性/每秒推送/大表虚拟滚动。
/// 通过 --spike 启动参数进入，默认启动路径不受影响。
public partial class SpikeWindow : Window
{
    private readonly UiBridge _bridge;
    private readonly MainViewModel _vm;

    public SpikeWindow(MainViewModel vm, string initialPage = "", bool topmost = false)
    {
        InitializeComponent();
        _vm = vm;
        var snapshots = new SnapshotBuilder(vm.Agg, vm.Tracker, vm);
        _bridge = new UiBridge(snapshots, vm);
        _initialPage = initialPage;
        if (topmost) Topmost = true; // 截图/演示模式：置顶避免被覆盖
        // WebView2 初始化/渲染间隙显示主题底色而非默认白/纯黑（深浅主题初始化时同步覆盖）
        Web.DefaultBackgroundColor = System.Drawing.Color.FromArgb(0x0A, 0x0C, 0x12);
        LoadCaptionIcon();
        WindowEffects.SetWindowIcon(this);
        ApplyCaptionTheme(ThemeService.CurrentEffective);
        ThemeService.ThemeApplied += OnThemeChanged;
        Loaded += async (_, _) => await InitWeb();
        IsVisibleChanged += OnVisibleChanged; // 显示路径统一兜底（见 OnVisibleChanged 注释）
        Closed += (_, _) => { ThemeService.ThemeApplied -= OnThemeChanged; _bridge.Detach(); };
    }

    /// 标题栏跟随深浅主题（设置切换或系统 auto 校准时触发）
    private void OnThemeChanged(string effective) => ApplyCaptionTheme(effective);

    private void ApplyCaptionTheme(string effective)
    {
        bool light = effective == "light";
        Resources["CapFg"] = new System.Windows.Media.SolidColorBrush(
            light ? System.Windows.Media.Color.FromRgb(0x3A, 0x42, 0x50)
                  : System.Windows.Media.Color.FromRgb(0xB9, 0xC1, 0xD1));
        Resources["CapHover"] = new System.Windows.Media.SolidColorBrush(
            light ? System.Windows.Media.Color.FromRgb(0xD5, 0xDC, 0xE8)
                  : System.Windows.Media.Color.FromRgb(0x1B, 0x21, 0x30));
        var bar = light
            ? System.Windows.Media.Color.FromRgb(0xE9, 0xED, 0xF5)
            : System.Windows.Media.Color.FromRgb(0x0A, 0x0C, 0x12);
        CaptionBar.Background = new System.Windows.Media.SolidColorBrush(bar);
        Background = CaptionBar.Background;
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        WindowEffects.ApplyRoundedCorners(this); // 无边框窗口恢复 Win11 圆角
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
        if (WindowState == WindowState.Minimized)
        {
            // 最小化行为可选：tray=缩入系统托盘（窗口隐藏，由托盘恢复）；taskbar=最小化到任务栏（图标保留）
            if (_vm.Settings.MinimizeAction == "taskbar") return;
            Hide();
            return;
        }
        // 从最小化还原（任务栏模式）：最小化期间 Chrome 合成同样挂起，恢复时强制重绘防黑屏
        if (WindowState == WindowState.Normal || WindowState == WindowState.Maximized)
        {
            foreach (var delay in new[] { 150, 600 })
                Dispatcher.BeginInvoke(new Action(async () =>
                {
                    await Task.Delay(delay);
                    if (IsVisible) PokeRender();
                }), System.Windows.Threading.DispatcherPriority.Background);
        }
    }

    /// 窗口显示（含启动首显）后延迟强制重绘：Hide/Show 往返（最小化进托盘、关闭进托盘、
    /// 外部 ShowWindow 还原等一切显示路径）后 WebView2 偶发不重绘、内容停留于挂起帧即全黑——
    /// 两时点各触发一次重排（幂等），等渲染进程从挂起中恢复。
    private void OnVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
    {
        if (e.NewValue is not true) return;
        foreach (var delay in new[] { 150, 600 })
            Dispatcher.BeginInvoke(new Action(async () =>
            {
                await Task.Delay(delay);
                if (IsVisible) PokeRender();
            }), System.Windows.Threading.DispatcherPriority.Background);
    }

    private async Task InitWeb()
    {
        try
        {
            // 提权进程的 userDataFolder 显式指到用户目录，避免写入 Program Files
            var dataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NetLens", "WebView2");
            var env = await CoreWebView2Environment.CreateAsync(
                userDataFolder: dataDir,
                options: new CoreWebView2EnvironmentOptions
                {
                    // 禁用窗口遮挡检测：窗口隐藏（托盘）期间 Chrome 合成器会暂停输出，
                    // 恢复显示时偶发不恢复导致黑屏（WebView2 已知问题）；与 SmartScreen 禁用项合并为同一开关
                    AdditionalBrowserArguments = "--disable-features=msSmartScreenProtection,CalculateNativeWinOcclusion"
                });
            await Web.EnsureCoreWebView2Async(env);

            // dist 目录映射为 https://app.local，离线加载前端产物
            var dist = Path.Combine(AppContext.BaseDirectory, "WebUI");
            Web.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "app.local", dist, CoreWebView2HostResourceAccessKind.Allow);
            Web.CoreWebView2.NavigationCompleted += OnNavigationCompleted;
            Web.CoreWebView2.ProcessFailed += OnProcessFailed;
            Web.Source = new Uri("https://app.local/index.html#/" + _initialPage);
        }
        catch (Exception ex)
        {
            // 初始化失败（userDataFolder 被锁/运行时异常等）不再静默黑窗：遮罩层显示原因
            Log.Error("WebView2 初始化失败", ex);
            ShowVeil("界面组件初始化失败：" + ex.Message);
        }
    }

    private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        _bridge.Attach(Web.CoreWebView2);
        if (e.IsSuccess)
        {
            // 宽限一次布局帧再收遮罩，避免首帧绘制前闪底色
            Dispatcher.BeginInvoke(new Action(async () =>
            {
                await Task.Delay(400);
                LoadVeil.Visibility = Visibility.Collapsed;
            }), System.Windows.Threading.DispatcherPriority.Background);
        }
        else
        {
            ShowVeil("界面加载失败：" + e.WebErrorStatus);
        }
    }

    private void OnProcessFailed(object? sender, CoreWebView2ProcessFailedEventArgs e)
    {
        // 渲染进程等崩溃会黑屏不自愈：显示恢复提示并整页重载（重载完成触发 NavigationCompleted 收遮罩）
        Log.Error($"WebView2 进程异常：{e.ProcessFailedKind} / {e.Reason}", null);
        Dispatcher.Invoke(() =>
        {
            ShowVeil("界面进程异常，正在恢复…");
            try { Web.CoreWebView2?.Reload(); }
            catch { try { Web.Source = new Uri("https://app.local/index.html#/overview"); } catch { /* 放弃恢复，遮罩保留 */ } }
        });
    }

    private void ShowVeil(string message)
    {
        VeilText.Text = message;
        VeilText.Foreground = new System.Windows.Media.SolidColorBrush(
            System.Windows.Media.Color.FromRgb(0xD9, 0x8A, 0x7A));
        LoadVeil.Visibility = Visibility.Visible;
    }

    /// Hide/Show 往返（托盘恢复）后 WebView2 偶发不重绘（组合内容停留于挂起帧）；
    /// 先做控件可见性往返（同步到浏览器控制器的 IsVisible，通知渲染恢复输出），
    /// 再强制一次实际布局变化触发 Chrome 子窗口重排，最后恢复原边距。
    public void PokeRender()
    {
        Dispatcher.Invoke(() =>
        {
            if (Web.CoreWebView2 != null)
            {
                Web.Visibility = Visibility.Hidden;
                Web.Visibility = Visibility.Visible;
            }
            Web.InvalidateVisual();
            var m = Web.Margin;
            Web.Margin = new Thickness(m.Left, m.Top, m.Right, m.Bottom - 1);
            Web.UpdateLayout();
            Web.Margin = m;
        });
    }
}
