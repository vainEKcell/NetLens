using System.IO;
using System.Threading;
using System.Windows;
using NetLens.Services;
using NetLens.ViewModels;

namespace NetLens;

public partial class App : Application
{
    private static Mutex? _mutex;
    private static TrayIconService? _tray;
    private static bool _errorDialogUp;

    /// 托盘“退出”发出的明确退出请求：CloseGuard 放行，不再弹询问窗
    public static bool ForceExitRequested { get; private set; }

    /// 托盘菜单“退出”：设置标志后关闭主窗口（走统一关闭链路）
    public static void RequestExit()
    {
        ForceExitRequested = true;
        (Current.MainWindow as Window)?.Close();
    }

    protected override void OnStartup(StartupEventArgs e)
    {
        // 品牌更名（NetWatch→NetLens）：一次性迁移旧数据目录（设置/基线/证据），保证用户数据延续
        MigrateLegacyDataDir();

        _mutex = new Mutex(true, "NetLens_SingleInstance", out var fresh);
        if (!fresh)
        {
            MessageBox.Show(L10n.T("msg.alreadyRunning"), "NetLens",
                MessageBoxButton.OK, MessageBoxImage.Information);
            Shutdown();
            return;
        }

        // 语言与主题在 MainWindow 加载前应用，避免闪烁
        var settings = AppSettings.Load();
        L10n.Apply(settings.Language);
        ThemeService.Apply(settings.Theme);

        DispatcherUnhandledException += (_, args) =>
        {
            Log.Error("UI 未处理异常（含内层链）", Flatten(args.Exception));
            if (!_errorDialogUp) // 防重入：异常高频复发时不连续弹框（每次弹框排队等关闭后再弹）
            {
                _errorDialogUp = true;
                try
                {
                    MessageBox.Show(
                        L10n.T("msg.uiError", args.Exception.Message, Log.FilePath),
                        "NetLens", MessageBoxButton.OK, MessageBoxImage.Error);
                }
                finally { _errorDialogUp = false; }
            }
            args.Handled = true;
        };
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
            Log.Error("AppDomain 未处理异常", Flatten(args.ExceptionObject as Exception));
        TaskScheduler.UnobservedTaskException += (_, args) =>
            Log.Error("Task 未观察异常", Flatten(args.Exception));

        // 默认启动 alpha WebView2 新界面；--spike:page 直达指定页；--classic 进入 classic WPF 界面
        var vm = new MainViewModel();
        var spikeArg = e.Args.FirstOrDefault(a => a.StartsWith("--spike", StringComparison.Ordinal));
        var classicArg = e.Args.Any(a => a.Equals("--classic", StringComparison.OrdinalIgnoreCase));
        var wantTopmost = e.Args.Any(a => a.Equals("--spike:topmost", StringComparison.OrdinalIgnoreCase));
        Window main;
        if (classicArg)
        {
            main = new MainWindow(vm);
        }
        else
        {
            var page = spikeArg != null && spikeArg.Length > 7 ? spikeArg[8..] : "overview";
            main = new SpikeWindow(vm, page, wantTopmost);
        }
        MainWindow = main;
        main.Show();

        // 托盘为 App 层常驻：无论 classic 还是 WebView2 窗口，托盘行为一致
        _tray = new TrayIconService(main);

        base.OnStartup(e);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _tray?.Dispose();
        base.OnExit(e);
    }

    private static Exception? Flatten(Exception? ex)
    {
        // 返回最内层异常，日志里才能看到真实原因
        while (ex?.InnerException != null) ex = ex.InnerException;
        return ex;
    }

    /// NetWatch → NetLens 更名：旧数据目录整体迁移（设置/基线/证据全部延续）
    private static void MigrateLegacyDataDir()
    {
        try
        {
            var root = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var oldDir = Path.Combine(root, "NetWatch");
            var newDir = Path.Combine(root, "NetLens");
            if (!Directory.Exists(oldDir) || Directory.Exists(newDir)) return;
            Directory.Move(oldDir, newDir);
        }
        catch { /* 迁移失败不阻断启动（新目录会重新初始化） */ }
    }
}
