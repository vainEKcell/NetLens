using System.Text.Json;
using System.Windows.Threading;
using Microsoft.Web.WebView2.Core;
using NetWatch.Services;
using NetWatch.ViewModels;

namespace NetWatch.Bridge;

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
