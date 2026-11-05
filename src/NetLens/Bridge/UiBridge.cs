using System.Text.Json;
using System.Windows.Threading;
using Microsoft.Web.WebView2.Core;
using NetLens.Services;
using NetLens.ViewModels;

namespace NetLens.Bridge;

/// C# ⇄ WebUI 的唯一通道：每秒推送快照，接收前端命令（JSON 消息，双端各此一处）。
public sealed class UiBridge
{
    private readonly SnapshotBuilder _snapshots;
    private readonly MainViewModel _vm;
    private CoreWebView2? _web;
    private DispatcherTimer? _push;

    public UiBridge(SnapshotBuilder snapshots, MainViewModel vm)
    {
        _snapshots = snapshots;
        _vm = vm;
    }

    /// WebView2 就绪后调用：开始每秒推送
    public void Attach(CoreWebView2 web)
    {
        _web = web;
        web.WebMessageReceived += OnMessage;
        _push = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _push.Tick += (_, _) =>
        {
            try { _web.PostWebMessageAsJson(_snapshots.BuildSnapshotJson()); }
            catch { /* 页面导航中推送失败忽略，下秒重试 */ }
        };
        _push.Start();
    }

    private void OnMessage(object? s, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            var name = root.TryGetProperty("name", out var n) ? n.GetString() : null;
            switch (name)
            {
                case "select":
                    var pid = root.GetProperty("pid").GetInt32();
                    _snapshots.SelectPid(pid);
                    _vm.SelectProcessByPid(pid);
                    break;
                case "kill":
                    _vm.KillPid(root.GetProperty("pid").GetInt32());
                    break;
                case "block":
                {
                    var bpid = root.GetProperty("pid").GetInt32();
                    _vm.SelectProcessByPid(bpid);
                    _vm.BlockSelected();
                    break;
                }
                case "toggleTrust":
                {
                    var tpid = root.GetProperty("pid").GetInt32();
                    _vm.SelectProcessByPid(tpid);
                    _vm.ToggleTrustForSelection();
                    break;
                }
                case "openTaskmgr":
                {
                    var tm = root.GetProperty("pid").GetInt32();
                    _vm.SelectProcessByPid(tm);
                    _vm.OpenTaskManager();
                    break;
                }
                case "openFolder":
                {
                    var ofd = root.GetProperty("pid").GetInt32();
                    _vm.SelectProcessByPid(ofd);
                    _vm.OpenProcessFolder();
                    break;
                }
                case "pause":
                    if (!_vm.Paused) _vm.TogglePause();
                    break;
                case "resume":
                    if (_vm.Paused) _vm.TogglePause();
                    break;
                case "runNetCheck":
                    _ = _vm.RunNetworkCheckAsync();
                    break;
                case "runDoh":
                    _ = _vm.RunDnsCheck();
                    break;
                case "openHosts":
                    _vm.OpenHostsFile();
                    break;
                case "setDohProvider":
                    _vm.DohProviderIndex = root.GetProperty("index").GetInt32();
                    break;
                case "setDohProbes":
                    _vm.DohProbeDomains = root.GetProperty("domains").GetString() ?? _vm.DohProbeDomains;
                    break;
                case "filterEventsByPid":
                    var fpid = root.GetProperty("pid").GetInt32();
                    if (fpid > 0) _vm.FilterEventsByPid(fpid);
                    else _vm.ClearEventsFilter();
                    break;
                case "runDnsCheckForTarget":
                    _vm.RunDnsCheckForTarget(
                        root.TryGetProperty("remoteIp", out var rip) ? rip.GetString() : null,
                        root.TryGetProperty("domain", out var dom) ? dom.GetString() : null);
                    break;
                case "unblockApp":
                    _vm.UnblockAppByPath(root.GetProperty("path").GetString());
                    _vm.RefreshBlocked();
                    break;
                case "refreshBlocked":
                    _vm.RefreshBlocked();
                    break;
                case "removeTrusted":
                    _vm.RemoveTrustedKey(root.GetProperty("key").GetString() ?? "");
                    break;
                case "clearEvents":
                    _vm.Events.Clear();
                    break;
                case "exportEvents":
                    _vm.ExportEvents();
                    break;
                case "cleanupNow":
                    _vm.RunRetentionCleanup(manual: true);
                    break;
                case "enableAudit":
                    _vm.EnableFirewallAudit();
                    break;
                case "setLanguage":
                    _vm.Settings.Language = root.GetProperty("value").GetString() ?? _vm.Settings.Language;
                    _vm.Settings.Save();
                    L10n.Apply(_vm.Settings.Language);
                    break;
                case "setTheme":
                    _vm.Settings.Theme = root.GetProperty("value").GetString() ?? _vm.Settings.Theme;
                    _vm.Settings.Save();
                    ThemeService.Apply(_vm.Settings.Theme);
                    break;
                case "setCloseAction":
                    _vm.Settings.CloseAction = root.GetProperty("value").GetString() ?? _vm.Settings.CloseAction;
                    _vm.Settings.Save();
                    break;
                case "setBaselineDays":
                    _vm.SetBaselineRetention(root.GetProperty("value").GetInt32());
                    break;
                case "setEvidenceDays":
                    _vm.SetEvidenceRetention(root.GetProperty("value").GetInt32());
                    break;
                case "setEvidenceCap":
                    _vm.SetEvidenceCap(root.GetProperty("value").GetInt32());
                    break;
                case "setBaselinePaused":
                    _vm.SetBaselinePaused(root.GetProperty("value").GetBoolean());
                    break;
                case "setHideLoopback":
                    _vm.HideLoopback = root.GetProperty("value").GetBoolean();
                    break;
                case "setOnlyFlagged":
                    _vm.OnlyFlagged = root.GetProperty("value").GetBoolean();
                    break;
                case "setSearch":
                    _vm.SearchText = root.GetProperty("value").GetString() ?? "";
                    break;
                default:
                    Log.Error($"UiBridge 未知命令：{name}");
                    break;
            }
        }
        catch (Exception ex)
        {
            Log.Error("UiBridge 命令处理失败", ex);
        }
    }

    public void Detach()
    {
        _push?.Stop();
        if (_web != null) _web.WebMessageReceived -= OnMessage;
        _web = null;
    }
}
