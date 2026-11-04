using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using NetLens.Services;

namespace NetLens;

/// 关闭确认窗：退出程序 / 最小化到托盘，可勾选“记住选择”。
public partial class ClosePromptWindow : Window
{
    public enum PromptResult { Cancel, Exit, ToTray }

    /// 用户选择（ShowDialog 结束后读取）
    public PromptResult Result { get; private set; } = PromptResult.Cancel;

    /// 是否勾选了“记住我的选择”
    public bool RememberChoice => Remember.IsChecked == true;

    public ClosePromptWindow()
    {
        InitializeComponent();

        TitleText.Text = L10n.T("cdlg.title");
        AskText.Text = L10n.T("cdlg.ask");
        BtnTray.Content = L10n.T("cdlg.tray");
        BtnExit.Content = L10n.T("cdlg.exit");

        try
        {
            // 显式取 ICO 最大帧，避免默认取 16px 帧在高 DPI下发虚
            var decoder = BitmapDecoder.Create(new Uri("pack://application:,,,/Assets/app.ico"),
                BitmapCreateOptions.None, BitmapCacheOption.OnLoad);
            AppIcon.Source = decoder.Frames.OrderByDescending(f => f.PixelWidth).First();
        }
        catch { /* 图标加载失败不影响询问流程 */ }

        // 无边框窗口拖拽
        Root.MouseLeftButtonDown += (_, _) => DragMove();
    }

    private void OnTray(object sender, RoutedEventArgs e)
    {
        Result = PromptResult.ToTray;
        Close();
    }

    private void OnExit(object sender, RoutedEventArgs e)
    {
        Result = PromptResult.Exit;
        Close();
    }

    private void OnCancel(object sender, RoutedEventArgs e)
    {
        Result = PromptResult.Cancel;
        Close();
    }
}
