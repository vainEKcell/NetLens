using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace NetLens.Services;

/// 应用内更新：GitHub Releases 检查 / 下载 / 安装。
/// 安全约束：仅 https；主机白名单逐跳校验（含重定向）；下载目录与文件名固定（无用户输入拼接）；
/// 体积上限 512MB；安装器文件名白名单校验（防路径拼接）。
/// 版本比较从 tag 与资产名提取三段数字（兼容 NetLens_v0.1.5 格式）。
public static class UpdateService
{
    private const string RepoApiUrl = "https://api.github.com/repos/vainEKcell/NetWatch/releases/latest";
    private const string ReleasesPageUrl = "https://github.com/vainEKcell/NetWatch/releases";
    private const string RepoHomeUrl = "https://github.com/vainEKcell/NetWatch";
    private static readonly string[] AllowedHosts =
        { "api.github.com", "github.com", "objects.githubusercontent.com" };
    private const long MaxAssetBytes = 512L * 1024 * 1024;
    private const string Channel = "-alpha"; // alpha 分支渠道后缀

    private static readonly Regex AssetNamePattern =
        new(@"^NetLens-Setup-[A-Za-z0-9.\-]{1,80}\.exe$", RegexOptions.Compiled);

    public sealed class UpdateState
    {
        public string Phase { get; set; } = "idle";      // idle/checking/available/upToDate/downloading/ready/error
        public string CurrentVersion { get; set; } = "";
        public string LatestVersion { get; set; } = "";
        public string Notes { get; set; } = "";
        public string Error { get; set; } = "";
        public long AssetSize { get; set; }
        public int Progress { get; set; }                 // 0-100（下载进度）
        public string PublishedAt { get; set; } = "";
    }

    public static UpdateState Current { get; } = new();

    public static string CurrentVersionText
    {
        get
        {
            var v = Assembly.GetEntryAssembly()?.GetName().Version;
            return (v is null ? "0.1.5" : $"{v.Major}.{v.Minor}.{v.Build}") + Channel;
        }
    }

    private static string DownloadDir =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NetLens", "update");
    private static string InstallerPath => Path.Combine(DownloadDir, InstallerFileName);
    private static string InstallerFileName { get; set; } = "NetLens-Setup.exe";

    private static readonly HttpClient Http = CreateClient();
    private static int _busy;

    private static HttpClient CreateClient()
    {
        var handler = new HttpClientHandler
        {
            AllowAutoRedirect = false, // 手动跟随重定向，逐跳校验主机白名单
        };
        var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(30) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd("NetLens-Update/1.0");
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        return client;
    }

    private static void SetPhase(string phase)
    {
        Current.Phase = phase;
    }

    private static void SetError(string message)
    {
        Current.Phase = "error";
        Current.Error = message;
        Log.Error("UpdateService：" + message);
    }

    // ---- 主机白名单逐跳校验 ----
    private static void ValidateResponse(HttpResponseMessage resp)
    {
        var uri = resp.RequestMessage?.RequestUri
                  ?? throw new InvalidOperationException("响应缺少请求地址");
        if (uri.Scheme != Uri.UriSchemeHttps) throw new InvalidOperationException("非 https 响应");
        if (!AllowedHosts.Contains(uri.Host, StringComparer.OrdinalIgnoreCase))
            throw new InvalidOperationException("非白名单主机：" + uri.Host);
    }

    private static async Task<HttpResponseMessage> GetFollowingRedirectsAsync(
        string url, HttpCompletionOption option, CancellationToken ct)
    {
        var current = url;
        for (var hop = 0; hop < 5; hop++)
        {
            var resp = await Http.GetAsync(current, option, ct);
            ValidateResponse(resp);
            if ((int)resp.StatusCode is 301 or 302 or 303 or 307 or 308)
            {
                var loc = resp.Headers.Location?.ToString()
                          ?? throw new InvalidOperationException("重定向缺少 Location");
                resp.Dispose();
                current = new Uri(new Uri(current), loc).ToString();
                continue;
            }
            return resp;
        }
        throw new InvalidOperationException("重定向次数超限");
    }

    // ---- 版本比较：从 tag 中提取三段数字（兼容 v0.1.5 / NetLens_v0.1.5 / 0.1.5-alpha 等格式）----
    private static (int Major, int Minor, int Patch) ParseVersion(string tag)
    {
        var m = Regex.Match(tag, @"(\d+)\.(\d+)\.(\d+)");
        return m.Success
            ? (int.Parse(m.Groups[1].Value), int.Parse(m.Groups[2].Value), int.Parse(m.Groups[3].Value))
            : (0, 0, 0);
    }

    private static bool IsNewerThanCurrent(string tag, string stamp, string seenStamp)
    {
        var cur = ParseVersion(CurrentVersionText);
        var rel = ParseVersion(tag);
        if (rel.Major != cur.Major) return rel.Major > cur.Major;
        if (rel.Minor != cur.Minor) return rel.Minor > cur.Minor;
        if (rel.Patch != cur.Patch) return rel.Patch > cur.Patch;
        return !string.IsNullOrEmpty(stamp) && stamp != seenStamp;
    }

    // ---- 检查更新 ----
    public static async Task CheckAsync(AppSettings settings)
    {
        if (Interlocked.CompareExchange(ref _busy, 1, 0) != 0) return;
        try
        {
            SetPhase("checking");
            Current.Error = "";
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
            using var resp = await GetFollowingRedirectsAsync(RepoApiUrl, HttpCompletionOption.ResponseContentRead, cts.Token);
            resp.EnsureSuccessStatusCode();
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(cts.Token));
            var root = doc.RootElement;

            var tag = root.GetProperty("tag_name").GetString() ?? "";
            var notes = root.GetProperty("body").GetString() ?? "";
            var published = root.TryGetProperty("published_at", out var pa) ? pa.GetString() ?? "" : "";

            string? assetUrl = null;
            long assetSize = 0;
            var assetStamp = published;
            foreach (var asset in root.GetProperty("assets").EnumerateArray())
            {
                var name = asset.GetProperty("name").GetString() ?? "";
                if (!AssetNamePattern.IsMatch(name)) continue;
                assetUrl = asset.GetProperty("browser_download_url").GetString() ?? "";
                assetSize = asset.GetProperty("size").GetInt64();
                if (asset.TryGetProperty("updated_at", out var ua)) assetStamp = ua.GetString() ?? assetStamp;
                InstallerFileName = name;
                break;
            }
            if (assetUrl is null || assetSize is 0 or > MaxAssetBytes)
            {
                SetPhase("error");
                Current.Error = "发布页没有可用的安装包";
                return;
            }

            var ver = ParseVersion(tag);
            Current.LatestVersion = $"{ver.Major}.{ver.Minor}.{ver.Patch}";
            Current.Notes = notes;
            Current.PublishedAt = published;
            Current.AssetSize = assetSize;
            Current.Error = "";

            if (assetUrl.StartsWith("https://github.com/", StringComparison.OrdinalIgnoreCase) is false)
                throw new InvalidOperationException("安装包地址非预期主机");

            AssetUrl = assetUrl;
            SetPhase(IsNewerThanCurrent(tag, assetStamp, settings.SeenReleaseStamp) ? "available" : "upToDate");
        }
        catch (Exception ex)
        {
            SetError("无法连接 GitHub：" + ex.Message);
        }
        finally
        {
            Interlocked.Exchange(ref _busy, 0);
        }
    }

    private static string? AssetUrl { get; set; }

    // ---- 下载安装包（流式 + 进度）----
    public static async Task DownloadAsync(AppSettings settings)
    {
        if (Interlocked.CompareExchange(ref _busy, 1, 0) != 0) return;
        try
        {
            if (Current.Phase is not ("available" or "error" or "ready") || string.IsNullOrEmpty(AssetUrl))
            {
                SetPhase("error");
                Current.Error = "没有可下载的更新";
                return;
            }
            SetPhase("downloading");
            Current.Progress = 0;
            Directory.CreateDirectory(DownloadDir);

            using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(15));
            using var resp = await GetFollowingRedirectsAsync(AssetUrl, HttpCompletionOption.ResponseHeadersRead, cts.Token);
            resp.EnsureSuccessStatusCode();
            var total = resp.Content.Headers.ContentLength ?? Current.AssetSize;

            await using var http = await resp.Content.ReadAsStreamAsync(cts.Token);
            await using var file = new FileStream(InstallerPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true);
            var buffer = new byte[81920];
            long read = 0;
            int n;
            while ((n = await http.ReadAsync(buffer, cts.Token)) > 0)
            {
                await file.WriteAsync(buffer.AsMemory(0, n), cts.Token);
                read += n;
                var pct = total > 0 ? (int)(100 * read / total) : 0;
                if (pct != Current.Progress) { Current.Progress = Math.Min(99, pct); }
            }
            if (read > MaxAssetBytes) throw new InvalidOperationException("下载体积超过上限");
            Current.Progress = 100;
            settings.SeenReleaseStamp = Current.PublishedAt;
            settings.Save();
            SetPhase("ready");
        }
        catch (Exception ex)
        {
            SetPhase("error");
            Current.Error = "下载失败：" + ex.Message;
        }
        finally
        {
            Interlocked.Exchange(ref _busy, 0);
        }
    }

    // ---- 启动安装器（应用随后退出，让位覆盖安装；用户数据在 %LOCALAPPDATA%\NetLens 不受影响）----
    public static void LaunchInstaller()
    {
        if (Current.Phase != "ready" || !File.Exists(InstallerPath)) return;
        ProcessRunner.ShellOpen(InstallerPath);
        System.Windows.Application.Current.Shutdown();
    }

    // ---- 打开发布页 / 仓库主页 ----
    public static void OpenInBrowser(string which)
    {
        var url = which switch
        {
            "releases" => ReleasesPageUrl,
            "repo" => RepoHomeUrl,
            _ => ReleasesPageUrl,
        };
        if (!AllowedHosts.Contains(new Uri(url).Host, StringComparer.OrdinalIgnoreCase)) return;
        ProcessRunner.ShellOpen(url);
    }
}
