using System.IO;
using System.Threading;
using System.Windows;
using NetLens.Services;
using NetLens.ViewModels;

namespace NetLens;

public partial class App : Application
{
    private static Mutex? _mutex;

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
            MessageBox.Show(
                L10n.T("msg.uiError", args.Exception.Message, Log.FilePath),
                "NetLens", MessageBoxButton.OK, MessageBoxImage.Error);
            args.Handled = true;
        };
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
            Log.Error("AppDomain 未处理异常", Flatten(args.ExceptionObject as Exception));
        TaskScheduler.UnobservedTaskException += (_, args) =>
            Log.Error("Task 未观察异常", Flatten(args.Exception));

        // --spike[:page]：打开 WebView2 穿刺窗口（与默认 WPF UI 共享同一个 MainViewModel）
        var vm = new MainViewModel();
        var spikeArg = e.Args.FirstOrDefault(a => a.StartsWith("--spike", StringComparison.Ordinal));
        Window main = spikeArg != null
            ? new SpikeWindow(vm, spikeArg.Length > 7 ? spikeArg[8..] : "")
            : new MainWindow(vm);
        MainWindow = main;
        main.Show();

        base.OnStartup(e);
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
