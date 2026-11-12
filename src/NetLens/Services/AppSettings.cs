using System.IO;
using System.Text.Json;

namespace NetLens.Services;

/// 应用设置（%LOCALAPPDATA%\NetLens\settings.json）
public sealed class AppSettings
{
    /// 行为基线保留天数（0 = 不限）
    public int BaselineRetentionDays { get; set; } = 90;
    /// 原始证据流保留天数（0 = 不限）
    public int EvidenceRetentionDays { get; set; } = 7;
    /// 证据目录容量硬顶（MB），超出按最旧删除
    public int EvidenceMaxSizeMB { get; set; } = 512;
    /// 隐私模式：暂停基线学习（证据流照常）
    public bool BaselinePaused { get; set; }

    /// 界面语言：auto（跟随系统）/ zh / en
    public string Language { get; set; } = "auto";

    /// 界面主题：auto（跟随系统）/ dark / light
    public string Theme { get; set; } = "auto";

    /// 关闭主窗口时的行为：ask（每次询问）/ exit（直接退出）/ tray（最小化到系统托盘）
    public string CloseAction { get; set; } = "ask";

    /// 用户允许名单（SoftwareIdentity 键）。处置层：用户的信任决定优先于引擎判定。
    public List<string> TrustedIdentityKeys { get; set; } = new();
    /// 允许名单的展示名（键 → 名称）
    public Dictionary<string, string> TrustedIdentityNames { get; set; } = new();

    /// 已确认过的发布时间戳（热修复版本号不变的约定下，以此判定同版本的新发布）
    public string SeenReleaseStamp { get; set; } = "";

    public static string Dir { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NetLens");
    public static string SettingsPath { get; } = Path.Combine(Dir, "settings.json");
    public static string DbPath { get; } = Path.Combine(Dir, "baseline.db");
    public static string EvidenceDir { get; } = Path.Combine(Dir, "evidence");

    public static AppSettings Load()
    {
        try
        {
            if (File.Exists(SettingsPath))
                return JsonSerializer.Deserialize<AppSettings>(File.ReadAllText(SettingsPath)) ?? new AppSettings();
        }
        catch (Exception ex) { Log.Error("读取设置失败，使用默认值", ex); }
        return new AppSettings();
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(Dir);
            File.WriteAllText(SettingsPath, JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true }));
        }
        catch (Exception ex) { Log.Error("保存设置失败", ex); }
    }
}
