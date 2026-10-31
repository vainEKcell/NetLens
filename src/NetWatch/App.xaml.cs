using System.Threading;
using System.Windows;
using NetWatch.Services;
using NetWatch.ViewModels;

namespace NetWatch;

public partial class App : Application
{
    private static Mutex? _mutex;

    protected override void OnStartup(StartupEventArgs e)
    {
        _mutex = new Mutex(true, "NetWatch_SingleInstance", out var fresh);
        if (!fresh)
        {
            MessageBox.Show(L10n.T("msg.alreadyRunning"), "NetWatch",
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
                "NetWatch", MessageBoxButton.OK, MessageBoxImage.Error);
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
}
