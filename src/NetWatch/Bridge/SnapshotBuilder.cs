using System.Text.Json;
using NetWatch.Models;
using NetWatch.Services;
using NetWatch.ViewModels;

namespace NetWatch.Bridge;

/// 每秒一次的全页快照（spike 阶段仅总览表）：从聚合器/追踪器直接取数，
/// 与 WPF 绑定层（MainViewModel）平行，是未来 WebUI 的唯一数据出口。
public sealed class SnapshotBuilder
{
    private readonly RateAggregator _agg;
    private readonly ProcessTracker _tracker;
    private readonly MainViewModel _vm; // spike 阶段复用其判定缓存与隐藏回环开关；0.2 由服务层替代

    public SnapshotBuilder(RateAggregator agg, ProcessTracker tracker, MainViewModel vm)
    {
        _agg = agg;
        _tracker = tracker;
        _vm = vm;
    }

    public string BuildOverviewJson()
    {
        double up = 0, down = 0;
        var rows = new List<object>();
        foreach (var (pid, s) in _agg.Stats)
        {
            up += s.UpSpeed;
            down += s.DownSpeed;
            var name = _tracker.Get(pid).Name;
            var verdict = _vm.GetVerdictFor(pid);
            rows.Add(new
            {
                pid,
                name,
                down = Math.Round(s.DownSpeed, 0),
                up = Math.Round(s.UpSpeed, 0),
                downTotal = s.DownTotal,
                upTotal = s.UpTotal,
                conns = _vm.ConnectionsOf(pid).Count,
                risk = verdict?.RiskByte ?? 0,
            });
        }
        var payload = new
        {
            type = "snapshot",
            tick = Environment.TickCount64,
            totals = new { up = Math.Round(up, 0), down = Math.Round(down, 0) },
            rows,
        };
        return JsonSerializer.Serialize(payload);
    }
}
