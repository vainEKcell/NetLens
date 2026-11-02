using System.Net;
using System.Runtime.InteropServices;

namespace NetWatch.Native;

/// Windows 路由表查询（iphlpapi）：取到指定目的地址的真实最佳路由（出口网关 + 出接口）。
/// 用于网络体检的网关探测——多网卡/VPN 环境下 FirstOrDefault(第一个网关) 会误选
/// 虚拟网关（如 26.0.0.0 这类网络地址，根本不可 ping），必须按实际路由选择。
public static class RouteTable
{
    [StructLayout(LayoutKind.Sequential)]
    private struct MIB_IPFORWARDROW
    {
        public uint dwForwardDest;
        public uint dwForwardMask;
        public uint dwForwardPolicy;
        public uint dwForwardNextHop;
        public uint dwForwardIfIndex;
        public uint dwForwardType;
        public uint dwForwardProto;
        public uint dwForwardAge;
        public uint dwForwardNextHopAS;
        public int dwForwardMetric1;
        public int dwForwardMetric2;
        public int dwForwardMetric3;
        public int dwForwardMetric4;
        public int dwForwardMetric5;
    }

    [DllImport("iphlpapi.dll", SetLastError = true)]
    private static extern uint GetBestRoute(uint dwDestAddr, uint dwSourceAddr, ref MIB_IPFORWARDROW pBestRoute);

    private static uint ToUint(IPAddress ip)
    {
        var b = ip.GetAddressBytes();
        return (uint)(b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24));
    }

    private static IPAddress ToIp(uint v) => new(new[] { (byte)v, (byte)(v >> 8), (byte)(v >> 16), (byte)(v >> 24) });

    /// 到 dest 的最佳路由：返回（下一跳网关， 出接口索引）。失败返回 null。
    public static (IPAddress NextHop, uint IfIndex)? GetBestRoute(IPAddress dest)
    {
        var row = new MIB_IPFORWARDROW();
        var ret = GetBestRoute(ToUint(dest), 0, ref row);
        if (ret != 0) return null;
        var hop = ToIp(row.dwForwardNextHop);
        if (hop.Equals(IPAddress.Any) || hop.Equals(IPAddress.None)) return null; // On-link 无网关
        return (hop, row.dwForwardIfIndex);
    }
}
