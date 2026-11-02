using System.Collections.Concurrent;
using System.IO;
using System.Net.NetworkInformation;
using System.Text;
using Microsoft.Win32;
using NetWatch.Models;
using NetWatch.Native;

namespace NetWatch.Services;

/// 网卡连接状态：结构化常量，避免服务层产出中文 UI 字面量被上层比较
public static class AdapterStatus
{
    public const string Connected = "up";
    public const string Disconnected = "down";
}

public sealed record AdapterInfo(string Name, string Status, string[] Ips, string[] Gateways, string[] Dns);
public sealed record HostEntry(string Ip, string[] Hosts);
public sealed record NetConfigSnapshot(
    AdapterInfo[] Adapters,
    string ProxyRaw,     // 语言无关原始值："on:<server>" / "off"
    string WinHttpRaw,   // "direct" / "<proxy>"
    IReadOnlyList<HostEntry> Hosts,
    DateTime HostsModified,
    string[] AllDns,
    bool Ready = true);  // false = 初始占位快照（不参与变更对比）

/// 配置层 DNS 劫持监控：DNS 服务器 / 系统代理 / WinHTTP 代理 / hosts 文件的变更检测（零流量）
public sealed class NetConfigService : IDisposable
{
    public static readonly string HostsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.System),
        "drivers", "etc", "hosts");

    private readonly Timer _timer;
    private NetConfigSnapshot? _last;
    private string _lastHostsHash = "";

    // ===== 原始值 → 当前语言展示文本（MVM/旧 UI 用；WebUI 由前端按键渲染） =====
    public static string FormatValue(string whatKey, string raw)
    {
        if (whatKey == "cfg.what.proxy" || whatKey == "cfg.what.winhttp")
        {
            if (raw == "off" || raw == "direct" || raw.Length == 0) return L10n.T("cfg.proxyOff");
            if (raw.StartsWith("on:", StringComparison.Ordinal)) return L10n.T("cfg.proxyOn", raw[3..]);
            return raw;
        }
        if (whatKey == "cfg.what.hosts")
            return L10n.T("cfg.entriesCount", raw);
        return raw.Length == 0 ? L10n.T("cfg.none") : raw;
    }

    public static string FmtDns(string[] xs) => xs.Length == 0 ? L10n.T("cfg.none") : string.Join(", ", xs);

    /// UI 消费：配置变更事件
    public ConcurrentQueue<ConfigChange> Changes { get; } = new();
    /// 当前快照（UI 每 tick 读取）
    public volatile NetConfigSnapshot Snapshot = EmptySnapshot();

    public NetConfigService()
    {
        _timer = new Timer(_ => SafePoll(), null, 500, 10_000);
    }

    private void SafePoll()
    {
        try { Poll(); } catch (Exception ex) { Log.Error("网络配置轮询失败", ex); }
    }

    private void Poll()
    {
        var adapters = new List<AdapterInfo>();
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces()
                     .Where(n => n.NetworkInterfaceType != NetworkInterfaceType.Loopback))
        {
            try
            {
                var ipProps = nic.GetIPProperties();
                adapters.Add(new AdapterInfo(
                    nic.Name,
                    nic.OperationalStatus == OperationalStatus.Up ? AdapterStatus.Connected : AdapterStatus.Disconnected,
                    ipProps.UnicastAddresses.Select(a => a.Address.ToString()).ToArray(),
                    ipProps.GatewayAddresses.Select(g => g.Address.ToString()).ToArray(),
                    ipProps.DnsAddresses.Select(d => d.ToString()).ToArray()));
            }
            catch { }
        }

        var allDns = adapters.Where(a => a.Status == AdapterStatus.Connected)
                             .SelectMany(a => a.Dns)
                             .Distinct(StringComparer.OrdinalIgnoreCase)
                             .ToArray();

        var (proxyRaw, _) = ReadWinInetProxy();
        var wh = NativeMethods.GetWinHttpProxy();
        // 读取失败（Proxy == "?"）按直连展示，避免出现 "On: ?" 乱值
        var winHttpRaw = !wh.Direct || wh.Proxy == "?" ? "direct" : "on:" + wh.Proxy;
        var hosts = ReadHosts(out var hostsModified);
        var hostsHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
            Encoding.UTF8.GetBytes(string.Join("|", hosts.Select(h => h.Ip + ":" + string.Join(",", h.Hosts))))));

        var snap = new NetConfigSnapshot(adapters.ToArray(), proxyRaw, winHttpRaw, hosts, hostsModified, allDns);
        var old = Interlocked.Exchange(ref Snapshot, snap);
        _last = snap;

        // 首轮（含"读取中"占位）为基线，不产生变更——否则会出现 Old=读取中 的假记录
        if (old == null || !old.Ready) return;

        var dnsChanged = !new HashSet<string>(old.AllDns, StringComparer.OrdinalIgnoreCase).SetEquals(allDns);
        if (dnsChanged)
            Changes.Enqueue(new ConfigChange(DateTime.UtcNow, "cfg.what.dns",
                string.Join(", ", old.AllDns), string.Join(", ", allDns), true));

        if (old.ProxyRaw != proxyRaw)
            Changes.Enqueue(new ConfigChange(DateTime.UtcNow, "cfg.what.proxy",
                old.ProxyRaw, proxyRaw, true));

        if (old.WinHttpRaw != winHttpRaw)
            Changes.Enqueue(new ConfigChange(DateTime.UtcNow, "cfg.what.winhttp",
                old.WinHttpRaw, winHttpRaw, false));

        if (hostsHash != _lastHostsHash)
        {
            if (_lastHostsHash.Length > 0)
                Changes.Enqueue(new ConfigChange(DateTime.UtcNow, "cfg.what.hosts",
                    old.Hosts.Count.ToString(), hosts.Count.ToString(), true));
            _lastHostsHash = hostsHash;
        }
    }

    /// 返回语言无关原始值："on:<server>" / "off"
    private (string Raw, string? AutoConfig) ReadWinInetProxy()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Internet Settings");
            if (key == null) return ("off", null);
            int enable = key.GetValue("ProxyEnable") is int v ? v : 0;
            string? server = key.GetValue("ProxyServer") as string;
            string? pac = key.GetValue("AutoConfigURL") as string;
            var raw = enable == 1 && !string.IsNullOrEmpty(server) ? "on:" + server : "off";
            return (raw, pac);
        }
        catch { return ("off", null); }
    }

    private List<HostEntry> ReadHosts(out DateTime modified)
    {
        modified = default;
        try
        {
            if (!File.Exists(HostsPath)) return new List<HostEntry>();
            modified = File.GetLastWriteTime(HostsPath);
            var map = new List<HostEntry>();
            foreach (var raw in File.ReadAllLines(HostsPath))
            {
                var line = raw.Trim();
                if (line.Length == 0 || line.StartsWith('#')) continue;
                int comment = line.IndexOf('#');
                if (comment >= 0) line = line[..comment].Trim();
                var parts = line.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2) continue;
                map.Add(new HostEntry(parts[0], parts[1..]));
            }
            return map;
        }
        catch { return new List<HostEntry>(); }
    }

    private static NetConfigSnapshot EmptySnapshot() =>
        new(Array.Empty<AdapterInfo>(), "off", "direct", Array.Empty<HostEntry>(), default, Array.Empty<string>(), Ready: false);

    public void Dispose() => _timer.Dispose();
}
