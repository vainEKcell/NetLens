using System.Windows.Threading;
using Microsoft.Web.WebView2.Core;
using NetWatch.Services;

namespace NetWatch.Bridge;

/// C# ⇄ WebUI 的唯一通道：C# 每秒推送快照，前端发命令（JSON 消息，双端各此一处）。
public sealed class UiBridge
{
    private readonly SnapshotBuilder _snapshots;
    private readonly Action _onPause;
    private readonly Action _onResume;
    private CoreWebView2? _web;
    private DispatcherTimer? _push;

    public UiBridge(SnapshotBuilder snapshots, Action onPause, Action onResume)
    {
        _snapshots = snapshots;
        _onPause = onPause;
        _onResume = onResume;
    }

    /// WebView2 就绪后调用：开始每秒推送
    public void Attach(CoreWebView2 web)
    {
        _web = web;
        web.WebMessageReceived += OnMessage;
        _push = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _push.Tick += (_, _) =>
        {
            try { _web.PostWebMessageAsJson(_snapshots.BuildOverviewJson()); }
            catch { /* 页面导航中推送失败忽略，下秒重试 */ }
        };
        _push.Start();
    }

    private void OnMessage(object? s, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            var json = e.WebMessageAsJson;
            if (json.Contains("\"pause\"")) { _onPause(); _web?.PostWebMessageAsJson("""{"type":"ack","name":"pause"}"""); }
            else if (json.Contains("\"resume\"")) { _onResume(); _web?.PostWebMessageAsJson("""{"type":"ack","name":"resume"}"""); }
        }
        catch (Exception ex) { Log.Error("UiBridge 命令处理失败", ex); }
    }

    public void Detach()
    {
        _push?.Stop();
        if (_web != null) _web.WebMessageReceived -= OnMessage;
        _web = null;
    }
}
