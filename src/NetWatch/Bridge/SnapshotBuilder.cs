using System.Text.Json;
using NetWatch.Models;
using NetWatch.Services;
using NetWatch.ViewModels;

namespace NetWatch.Bridge;

/// 每秒一次的全页快照：与 WPF 绑定层平行，是 WebUI 的唯一数据出口。
/// 从 MainViewModel 的公开成员与服务层取数（0.2 时 MainViewModel 绑定层退役，本类改从服务层直取）。
public sealed class SnapshotBuilder
{
    private readonly RateAggregator _agg;
    private readonly ProcessTracker _tracker;
    private readonly MainViewModel _vm;
    private int _selectedPid = -1;

    public SnapshotBuilder(RateAggregator agg, ProcessTracker tracker, MainViewModel vm)
    {
        _agg = agg;
        _tracker = tracker;
        _vm = vm;
    }

    public void SelectPid(int pid) => _selectedPid = pid;

    public string BuildSnapshotJson()
    {
        double up = 0, down = 0, upAll = 0, downAll = 0;
        var rows = new List<object>();
        foreach (var (pid, s) in _agg.Stats)
        {
            up += s.UpSpeed;
            down += s.DownSpeed;
            upAll += s.UpTotal;
            downAll += s.DownTotal;
            rows.Add(new
            {
                pid,
                name = _tracker.Get(pid).Name,
                down = Math.Round(s.DownSpeed, 0),
                up = Math.Round(s.UpSpeed, 0),
                downTotal = s.DownTotal,
                upTotal = s.UpTotal,
                conns = _vm.ConnectionsOf(pid).Count,
                risk = _vm.GetVerdictFor(pid)?.RiskByte ?? 0,
            });
        }

        var payload = new
        {
            type = "snapshot",
            paused = _vm.Paused,
            totals = new { up = Math.Round(up, 0), down = Math.Round(down, 0), upAll, downAll },
            overview = BuildOverview(),
            detail = BuildDetail(),
            dns = BuildDns(),
            netcheck = BuildNetCheck(),
            events = BuildEvents(),
            destinations = _vm.Destinations.Select(d => new { d.Display, d.Scope, d.UpText, d.DownText, d.LastText, d.ProcessesText }).ToArray(),
            ports = _vm.Ports.Select(p => new { p.ProtoText, p.Port, p.Bind, p.BindText, p.Pid, p.Process }).ToArray(),
            blocking = new
            {
                apps = _vm.BlockedApps.Select(b => new { b.DisplayName, b.Path, b.RulesText }).ToArray(),
                trusted = _vm.TrustedApps.Select(t => new { t.Key, t.DisplayName }).ToArray(),
            },
            network = new
            {
                adapters = _vm.Adapters.Select(a => new { a.Name, a.Status, a.IpsText, a.GwText, a.DnsText }).ToArray(),
                configHistory = _vm.ConfigHistory.Select(c => new { c.TimeText, c.What, c.Old, c.New, c.Serious }).ToArray(),
            },
            settings = new
            {
                language = _vm.Settings.Language,
                theme = _vm.Settings.Theme,
                baselineDays = _vm.Settings.BaselineRetentionDays,
                evidenceDays = _vm.Settings.EvidenceRetentionDays,
                evidenceCap = _vm.Settings.EvidenceMaxSizeMB,
                baselinePaused = _vm.Settings.BaselinePaused,
                storageInfo = _vm.StorageInfo,
                auditEnabled = AuditOn(),
                hideLoopback = _vm.HideLoopback,
                onlyFlagged = _vm.OnlyFlagged,
                searchText = _vm.SearchText,
            },
        };
        return JsonSerializer.Serialize(payload);
    }

    private object BuildOverview()
    {
        double up = 0, down = 0;
        var rows = new List<object>();
        foreach (var (pid, s) in _agg.Stats)
        {
            up += s.UpSpeed;
            down += s.DownSpeed;
            rows.Add(new
            {
                pid,
                name = _tracker.Get(pid).Name,
                down = Math.Round(s.DownSpeed, 0),
                up = Math.Round(s.UpSpeed, 0),
                downTotal = s.DownTotal,
                upTotal = s.UpTotal,
                conns = _vm.ConnectionsOf(pid).Count,
                risk = _vm.GetVerdictFor(pid)?.RiskByte ?? 0,
            });
        }
        return new { rows, selectedPid = _selectedPid };
    }

    /// 选中进程的详情卡（路径/厂商/签名/服务/连接/判定）
    private object? BuildDetail()
    {
        if (_selectedPid <= 0) return null;
        var info = _tracker.Get(_selectedPid);
        if (info.Name.StartsWith("PID ", StringComparison.Ordinal) && _agg.Stats.All(kv => kv.Key != _selectedPid))
            return null; // 进程已退出
        var verdict = _vm.GetVerdictFor(_selectedPid);
        return new
        {
            pid = _selectedPid,
            name = info.Name,
            path = info.Path,
            vendor = info.Company,
            signature = info.SignatureSubject ?? info.Signature.ToString(),
            services = _vm.Entities.ServicesOf(_selectedPid).Select(s => new { s.Name, s.DisplayName }).ToArray(),
            conns = _vm.ConnectionsOf(_selectedPid).Take(20).Select(c => new
            {
                c.Remote,
                c.Local,
                Proto = c.Proto.ToString(),
                c.State,
            }).ToArray(),
            verdict = verdict == null ? null : new
            {
                status = verdict.Status.ToString(),
                riskByte = verdict.RiskByte,
                evidence = verdict.Evidence.Select(e => new { e.Statement, e.Basis, e.Caveat, e.Weight }).ToArray(),
            },
        };
    }

    private object BuildDns()
    {
        var snap = _vm.Config.Snapshot;
        var stream = _vm.DnsStream.TakeLast(200).Select(d => new
        {
            time = d.TimeText,
            process = d.Process,
            domain = d.Domain,
            ips = d.Ips,
            alert = d.IsAlert,
            alertText = d.AlertText,
        });
        var doh = new
        {
            running = _vm.DohRunning,
            status = _vm.DohStatusText,
            providerIndex = _vm.DohProviderIndex,
            probes = _vm.DohProbeDomains,
            results = _vm.DohResults.Select(r => new { r.Domain, r.LocalIps, r.RefIps, r.Verdict, r.RiskByte }).ToArray(),
        };
        return new
        {
            servers = _vm.DnsServersText,
            proxy = _vm.ProxyText,
            winhttp = _vm.WinHttpText,
            hosts = _vm.HostsText,
            stream,
            doh,
        };
    }

    private object BuildNetCheck()
    {
        return new
        {
            running = _vm.CheckRunning,
            progress = _vm.CheckProgressText,
            nat = _vm.NatText,
            natExternal = _vm.NatExternal,
            natDetail = _vm.NatDetailText,
            linkType = _vm.LinkTypeText,
            linkSpeed = _vm.LinkSpeedText,
            wifiSignal = _vm.WifiSignalText,
            ssid = _vm.WifiSsidText,
            mtu = _vm.MtuText,
            pings = _vm.PingRows.Select(p => new
            {
                p.Target,
                p.TargetIp,
                p.AvgText,
                p.JitterText,
                p.LossText,
                p.P95Text,
                p.QualityText,
            }).ToArray(),
            speed = new
            {
                down = _vm.SpeedDownText,
                up = _vm.SpeedUpText,
                tier = _vm.SpeedTierText,
                node = _vm.SpeedNodeText,
                progress = _vm.SpeedProgressText,
            },
            scenarios = _vm.ScenarioRows.Select(s => new { s.Name, s.Verdict }).ToArray(),
            peak = _vm.PeakText,
            verdict = _vm.CheckVerdictText,
            advices = _vm.CheckAdvices.ToArray(),
        };
    }

    private static bool AuditOn()
    {
        var (success, failure) = FirewallAuditWatcher.QueryAuditState();
        return success || failure;
    }

    private object BuildEvents()
    {
        var items = _vm.Events.TakeLast(200).Select(e => new
        {
            time = e.TimeText,
            kind = e.KindText,
            kindBrush = e.KindBrush.ToString(),
            process = e.Process,
            detail = e.Detail,
            bytes = e.BytesText,
            pid = e.Pid,
            remote = e.RemoteIp,
            domain = e.Domain,
        });
        return new
        {
            filterText = _vm.EventsFilterText,
            filterVisible = _vm.EventsFilterVisible,
            items,
        };
    }
}
