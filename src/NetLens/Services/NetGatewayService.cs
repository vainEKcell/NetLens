using System.Net;
using NetLens.Models;
using NetLens.Native;

namespace NetLens.Services;

public sealed record GatewayResult(
    string Gateway,        // 选中用于体检的网关
    string AdapterName,    // 该网关所属网卡
    bool FromPhysical,     // 是否物理内网网关（RFC1918）
    string? VpnSkipped,    // 被跳过的可疑 VPN 网关（非 RFC1918），供提示
    string[] AllCandidates);

/// 体检网关探测（大修版）：
/// 1) 收集所有已连接网卡的 IPv4 网关候选，过滤无效值（0.0.0.0/网络地址(.0)/广播(.255)/链路本地/组播）
/// 2) 用 GetBestRoute(公网探测点) 拿实际出口网关
/// 3) RFC1918 物理内网网关优先（VPN TUN 的 26.x/10.x 虚拟段不参与"局域网质量"测量）
/// 4) 全部无效时回退到实际出口网关
public static class NetGatewayService
{
    public static GatewayResult? Detect(IEnumerable<AdapterInfo> adapters)
    {
        var candidates = adapters
            .Where(a => a.Status == AdapterStatus.Connected)
            .SelectMany(a => a.Gateways.Select(g => (Gateway: g, Adapter: a.Name)))
            .Where(x => IsValidGateway(x.Gateway))
            .GroupBy(x => x.Gateway)
            .Select(g => (Gateway: g.Key, Adapter: g.First().Adapter))
            .ToList();

        if (candidates.Count == 0) return null;

        string? bestHop = null;
        try
        {
            var best = RouteTable.GetBestRoute(IPAddress.Parse("223.5.5.5"));
            if (best != null)
            {
                var hopStr = best.Value.NextHop.ToString();
                if (candidates.Any(c => c.Gateway == hopStr)) bestHop = hopStr;
                else if (IsValidGateway(hopStr)) bestHop = hopStr;
            }
        }
        catch { /* 路由表查询失败时退回候选优先级 */ }

        var physical = candidates.Where(c => IsPrivateRfc1918(c.Gateway)).ToList();
        var nonPhysical = candidates.Where(c => !IsPrivateRfc1918(c.Gateway)).ToList();

        // 选择：物理网关优先（与实际出口一致者优先），否则实际出口，否则任意物理，否则任意
        (string Gateway, string Adapter)? pick =
            bestHop != null ? physical.FirstOrDefault(c => c.Gateway == bestHop) : null;
        pick ??= bestHop != null ? candidates.FirstOrDefault(c => c.Gateway == bestHop) : null;
        pick ??= physical.FirstOrDefault();
        pick ??= candidates.FirstOrDefault();
        if (pick == null) return null;

        var vpnSkipped = nonPhysical.Count > 0 && IsPrivateRfc1918(pick.Value.Gateway)
            ? string.Join(", ", nonPhysical.Select(c => c.Gateway))
            : null;

        return new GatewayResult(pick.Value.Gateway, pick.Value.Adapter, IsPrivateRfc1918(pick.Value.Gateway), vpnSkipped,
            candidates.Select(c => c.Gateway).ToArray());
    }

    /// 结构合法的网关：排除 0.0.0.0、网络地址(x.y.z.0)、广播(x.y.z.255)、链路本地、回环、组播
    public static bool IsValidGateway(string g)
    {
        if (!IPAddress.TryParse(g, out var ip)) return false;
        if (ip.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork) return false;
        if (Util.IsLoopbackIp(ip) || Util.IsLanIp(ip) && g.StartsWith("169.254")) return false;
        var b = ip.GetAddressBytes();
        if (b[0] == 0 || b[0] >= 224) return false;         // 默认/组播
        if (b[3] == 0 || b[3] == 255) return false;         // 网络地址/广播（26.0.0.0 属此类）
        return true;
    }

    private static bool IsPrivateRfc1918(string g)
    {
        if (!IPAddress.TryParse(g, out var ip)) return false;
        var b = ip.GetAddressBytes();
        return b[0] == 10
            || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
            || (b[0] == 192 && b[1] == 168);
    }
}
