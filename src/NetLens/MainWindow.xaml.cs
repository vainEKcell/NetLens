using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using NetLens.Services;
using NetLens.ViewModels;

namespace NetLens;

public partial class MainWindow : Window
{
    private readonly MainViewModel _vm;

    private FrameworkElement[]? _pages;

    public MainWindow(MainViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        DataContext = _vm;
        _vm.ChartPush += (u, d) => Chart.Push(u, d);
        _vm.NavigateToEventsRequested += () => Nav.SelectedIndex = 4; // 事件流（网络体检移至网络配置之后）
        _vm.NavigateToOverviewRequested += () => Nav.SelectedIndex = 0;
        _vm.NavigateToDnsRequested += () => Nav.SelectedIndex = 2;
        _pages = new FrameworkElement[]
        {
            // 与 Nav 项顺序一致：总览/目的地/DNS/端口/事件/拦截/网络配置/网络体检/设置
            PageOverview, PageDestinations, PageDns, PagePorts,
            PageEvents, PageBlocking, PageNetwork, PageNetCheck, PageSettings,
        };
    }

    private void OnNavChanged(object sender, SelectionChangedEventArgs e)
    {
        if (_pages == null || Nav.SelectedItem == null) return;
        for (int i = 0; i < _pages.Length; i++)
            _pages[i].Visibility = i == Nav.SelectedIndex ? Visibility.Visible : Visibility.Collapsed;
    }

    protected override void OnClosing(CancelEventArgs e)
    {
        if (CloseGuard.Intercept(this, _vm.Settings)) e.Cancel = true;
        base.OnClosing(e);
    }

    protected override void OnStateChanged(EventArgs e)
    {
        base.OnStateChanged(e);
        if (WindowState == WindowState.Minimized) Hide();
    }

    protected override void OnClosed(EventArgs e)
    {
        _vm?.Dispose();
        base.OnClosed(e);
    }

    private void OnSearchChanged(object sender, TextChangedEventArgs e)
    {
        if (SearchHint == null) return; // XAML 解析期触发时元素可能未就绪
        SearchHint.Visibility = SearchBox.Text.Length == 0 ? Visibility.Visible : Visibility.Collapsed;
    }

    private void OnProcessSort(object sender, DataGridSortingEventArgs e)
    {
        e.Handled = true;
        bool desc = _vm.ApplySort(e.Column.SortMemberPath ?? "");
        // 维护列头三角指示：先清所有列，再设置当前列方向
        foreach (var c in ProcessGrid.Columns) c.SortDirection = null;
        e.Column.SortDirection = desc
            ? System.ComponentModel.ListSortDirection.Descending
            : System.ComponentModel.ListSortDirection.Ascending;
    }

    private void OnBannerClick(object sender, System.Windows.Input.MouseButtonEventArgs e)
        => _vm.OnlyFlagged = true;

    private void OnDohProviderChanged(object sender, RoutedEventArgs e)
    {
        if (_vm == null) return; // XAML 解析期 IsChecked=True 就会触发，此时 _vm 尚未创建
        if (RbAli.IsChecked == true) _vm.DohProviderIndex = 0;
        else if (RbPod.IsChecked == true) _vm.DohProviderIndex = 1;
        else if (RbCf.IsChecked == true) _vm.DohProviderIndex = 2;
    }

    // ---------- 右键菜单（P2 调查联动） ----------

    private void OnCmRelatedEvents(object sender, RoutedEventArgs e) => _vm.ShowRelatedEventsForSelection();
    private void OnCmCopyDetails(object sender, RoutedEventArgs e) => _vm.CopyDetails();
    private void OnCmOpenFolder(object sender, RoutedEventArgs e) => _vm.OpenProcessFolder();
    private void OnCmQueryIntel(object sender, RoutedEventArgs e) => _ = _vm.QuerySelectedFileIntelAsync();
    private void OnCmBlock(object sender, RoutedEventArgs e) => _vm.BlockSelected();
    private void OnCmUnblock(object sender, RoutedEventArgs e) => _vm.UnblockSelectedRow();

    private void OnCmFilterEventPid(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: EventRowVM ev } && ev.Pid > 0)
            _vm.FilterEventsByPid(ev.Pid);
    }

    private void OnCmFilterEventKind(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: EventRowVM ev })
            _vm.FilterEventsByKind(ev.KindText);
    }

    // ---------- 事件流 / DNS 流右键动作 ----------

    // ---------- 右键菜单：让动作作用于"右键的那一行"而不是"上次选中的行" ----------

    private static DataGridRow? FindRowUnder(DependencyObject? start)
    {
        while (start != null && start is not DataGridRow)
            start = start is Visual or System.Windows.Media.Media3D.Visual3D
                ? VisualTreeHelper.GetParent(start)
                : LogicalTreeHelper.GetParent(start);
        return start as DataGridRow;
    }

    private void GridContextMenuOpening(object sender, ContextMenuEventArgs e)
    {
        if (sender is not DataGrid dg) return;
        var row = FindRowUnder(e.OriginalSource as DependencyObject);
        if (row?.Item != null)
        {
            dg.SelectedItem = row.Item;
            row.IsSelected = true;
        }
    }

    private void OpenDetailFor(DataGrid dg)
    {
        var pid = dg.SelectedItem switch
        {
            ProcessRowVM p => p.Pid,
            EventRowVM ev when ev.Pid > 0 => ev.Pid,
            DnsRowVM d when d.Pid > 0 => d.Pid,
            _ => (int?)null,
        };
        if (pid == null) return;
        var note = dg.SelectedItem switch
        {
            EventRowVM ev => $"{ev.TimeText} {ev.KindText} · {ev.Detail}",
            DnsRowVM d => $"{d.TimeText} DNS 解析 · {d.Domain} → {d.Ips}",
            _ => null,
        };
        var win = new DetailWindow(_vm, pid.Value, note) { Owner = this };
        win.Show();
    }

    private void OnCmProcDetailOpen(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid dg)
            OpenDetailFor(dg);
    }

    private void OnCmEventRelated(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: EventRowVM ev } && ev.Pid > 0)
            _vm.SelectProcessByPid(ev.Pid);
    }

    private void OnCmEventProcDetail(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: EventRowVM ev } && ev.Pid > 0)
            _vm.SelectProcessByPid(ev.Pid);
    }

    private void OnCmEventCopyTarget(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: EventRowVM ev })
        {
            try { Clipboard.SetText(ev.RemoteIp ?? ev.Detail ?? ""); } catch { }
        }
    }

    private void OnCmEventCheckDomain(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: EventRowVM ev })
            _vm.RunDnsCheckForTarget(ev.RemoteIp, ev.Domain);
    }

    private void OnCmResetFilter(object sender, RoutedEventArgs e) => _vm.ClearEventsFilter();

    private void OnCmDnsProcDetail(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: DnsRowVM d } && d.Pid > 0)
            _vm.SelectProcessByPid(d.Pid);
    }

    private void OnCmDnsCheckDomain(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: DnsRowVM d })
            _vm.RunDnsCheckForTarget(null, d.Domain);
    }

    private void OnCmDnsCopyDomain(object sender, RoutedEventArgs e)
    {
        if ((sender as System.Windows.Controls.ContextMenu)?.PlacementTarget is DataGrid { SelectedItem: DnsRowVM d })
        {
            try { Clipboard.SetText(d.Domain); } catch { }
        }
    }

    // ---------- 数据与隐私设置（P3） ----------

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        // 按已保存设置回填下拉框（XAML 解析期的默认选中已被 _vm==null 守卫忽略）
        SetCombo(CbLanguage, _vm.Settings.Language);
        SetCombo(CbTheme, _vm.Settings.Theme);
        SetCombo(CbBaselineDays, _vm.Settings.BaselineRetentionDays);
        SetCombo(CbEvidenceDays, _vm.Settings.EvidenceRetentionDays);
        SetCombo(CbEvidenceCap, _vm.Settings.EvidenceMaxSizeMB);
        ChkPauseBaseline.IsChecked = _vm.Settings.BaselinePaused;
    }

    private static void SetCombo(System.Windows.Controls.ComboBox cb, int tag)
    {
        foreach (ComboBoxItem item in cb.Items)
            if (item.Tag is string s && int.TryParse(s, out var v) && v == tag)
            { cb.SelectedItem = item; return; }
    }

    private static void SetCombo(System.Windows.Controls.ComboBox cb, string tag)
    {
        foreach (ComboBoxItem item in cb.Items)
            if (item.Tag is string s && s == tag)
            { cb.SelectedItem = item; return; }
    }

    private void OnBaselineDaysChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        if (_vm == null) return;
        if ((sender as ComboBox)?.SelectedItem is ComboBoxItem it && it.Tag is string s && int.TryParse(s, out var d))
            _vm.SetBaselineRetention(d);
    }

    private void OnEvidenceDaysChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        if (_vm == null) return;
        if ((sender as ComboBox)?.SelectedItem is ComboBoxItem it && it.Tag is string s && int.TryParse(s, out var d))
            _vm.SetEvidenceRetention(d);
    }

    private void OnEvidenceCapChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        if (_vm == null) return;
        if ((sender as ComboBox)?.SelectedItem is ComboBoxItem it && it.Tag is string s && int.TryParse(s, out var v))
            _vm.SetEvidenceCap(v);
    }

    private void OnPauseBaselineChanged(object sender, RoutedEventArgs e)
    {
        if (_vm == null) return;
        _vm.SetBaselinePaused(ChkPauseBaseline.IsChecked == true);
    }

    private void OnCleanupNow(object sender, RoutedEventArgs e) => _vm.RunRetentionCleanup(manual: true);

    private void OnEnableAudit(object sender, RoutedEventArgs e) => _vm.EnableFirewallAudit();

    private void OnLanguageChanged(object sender, SelectionChangedEventArgs e)
    {
        if (_vm == null) return; // XAML 解析期默认选中会触发
        if ((sender as ComboBox)?.SelectedItem is ComboBoxItem it && it.Tag is string s)
            _vm.Language = s;
    }

    private void OnThemeChanged(object sender, SelectionChangedEventArgs e)
    {
        if (_vm == null) return;
        if ((sender as ComboBox)?.SelectedItem is ComboBoxItem it && it.Tag is string s)
            _vm.Theme = s;
    }
}
