using System.Security.Cryptography;
using NetWatch.Services;

namespace NetWatch.Models;

public enum IdentityKind : byte { Unknown, SystemReserved, Packaged, Signed, PathOnly, Unresolved }

/// 跨会话稳定的“软件身份”——行为基线的记账主体。
/// 取法：打包应用用 PFN；有签名用 证书主体CN+产品名（证书指纹只作属性，换发不断身份）；未签名用路径哈希。
public sealed class SoftwareIdentity
{
    public required string Key { get; init; }
    public IdentityKind Kind { get; set; } = IdentityKind.Unresolved;
    public string DisplayName { get; set; } = "";
    public string? CertSubject { get; set; }
    public string? CertThumbprint { get; set; }
    public HashSet<string> Paths { get; } = new(StringComparer.OrdinalIgnoreCase);
    public HashSet<string> FileHashes { get; } = new(StringComparer.OrdinalIgnoreCase); // P2 填充：身份漂移检测
    public DateTime FirstSeenUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenUtc { get; set; } = DateTime.UtcNow;
}

/// 会话内进程实例（实时视图主体）
public sealed class ProcessInstance
{
    public int Pid { get; set; }
    public string IdentityKey { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Path { get; set; }
    public string? CommandLine { get; set; }
    public int? ParentPid { get; set; }
    public DateTime? StartTimeUtc { get; set; }
    public DateTime? ExitTimeUtc { get; set; }
}

/// Windows 服务实体（键=服务名，跨会话稳定；svchost 归因的解药）
public sealed class ServiceEntity
{
    public required string Name { get; init; }
    public string DisplayName { get; set; } = "";
    public HashSet<int> Pids { get; } = new();
}

/// 目的地实体：域名优先作稳定键，IP 集合作属性（IP 会因 DHCP/CDN 老化）
public sealed class DestinationEntity
{
    public required string Key { get; init; }      // "d:example.com" 或 "ip:1.2.3.4"
    public string? Domain { get; set; }
    public HashSet<string> Ips { get; } = new(StringComparer.OrdinalIgnoreCase);
    public DateTime FirstSeenUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenUtc { get; set; } = DateTime.UtcNow;
}

/// 统一事件记录——EventStore 的行，证据链的最小单元
public sealed record EventRecord
{
    public long Seq { get; init; }
    public DateTime TimeUtc { get; init; }
    public EventKind Kind { get; init; }
    public int Pid { get; init; }
    public string? IdentityKey { get; set; }
    public string? RemoteIp { get; init; }
    public int RemotePort { get; init; }
    public NetProto Proto { get; init; }
    public long Bytes { get; init; }
    public string? Domain { get; set; }
    public string? Text { get; set; }
    public RiskLevel Level { get; set; }

    public static string KindText(EventKind k) => k switch
    {
        EventKind.NewConn => L10n.T("kind.newConn"),
        EventKind.Closed => L10n.T("kind.closed"),
        EventKind.LargeTransfer => L10n.T("kind.largeTransfer"),
        EventKind.DnsResolve => L10n.T("kind.dns"),
        EventKind.ConfigChange => L10n.T("kind.config"),
        EventKind.Alert => L10n.T("kind.alertRecord"),
        EventKind.ProcessStart => L10n.T("kind.procStart"),
        EventKind.ProcessStop => L10n.T("kind.procStop"),
        _ => L10n.T("kind.system"),
    };
}

public static class IdentityUtil
{
    public static string ShortHash(string s)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(s));
        return Convert.ToHexString(bytes)[..16];
    }
}
