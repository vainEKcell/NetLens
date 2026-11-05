// 使用指南：完整功能手册（双语），侧栏「使用指南」页承载
import { t, getLang } from "../i18n";

type Section = {
  h: string;
  paras?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
  code?: string;
};

const ZH: Section[] = [
  {
    h: "快速上手",
    paras: [
      "顶栏从左到右：logo（兼导航收放按钮，快捷键 Ctrl+B）、品牌名、暂停监控、搜索框与过滤项、实时指标与流量曲线。右侧数字变长时向左扩展，曲线位置固定不变。",
      "本应用以管理员权限运行：读取 Windows 内核网络事件（ETW）与 DNS-Client 提供程序、改写系统防火墙——启动时的 UAC 提示即为此。程序自身零联网：没有遥测、不查 IP 归属地；仅有的两处对外请求都由您主动点击触发（设置里的「DNS 体检」、详情里的「浏览器查询文件情报」）。",
    ],
  },
  {
    h: "总览",
    paras: [
      "每进程的实时速率与累计流量，1 秒刷新。点击任意一行打开右侧详情覆盖层；在行上右键呼出处置菜单。",
      "详情覆盖层包含：可执行文件路径、厂商与描述、数字签名（状态与签发者）、父进程、首次出现时间、完整命令行、软件身份与 SHA256、风险原因与判定证据、承载服务、实时连接、最近 DNS 解析，以及处置按钮组。",
    ],
    list: [
      "右键菜单：打开任务管理器 / 结束进程 / 打开所在文件夹 / 禁止联网 / 在详情中查看 / 复制 PID。",
      "排序：表格右上角的排序控件（列名 + 方向），表头本身不参与排序以保持列宽稳定。",
      "顶栏过滤：隐藏回环（127.x 本机进程间通信）、仅看可疑（只显示未知及以上判定）；搜索框按进程名、路径、PID 过滤。",
    ],
  },
  {
    h: "判定分级",
    paras: [
      "判定由证据引擎给出，每条结论在详情面板中附证据、依据与误报说明。判定只是揭示网络痕迹的提示，不是确诊；最终判断请结合路径与厂商自行做出。",
    ],
    table: {
      head: ["档位", "含义", "典型触发"],
      rows: [
        ["正常", "签名有效、路径正常、无任何可疑证据", "知名厂商软件，运行于 Program Files / Windows 目录"],
        ["未知", "信息不足，暂无法归类", "无签名的新程序、证据为零但路径可疑"],
        ["值得关注", "存在可疑证据", "无签名或签名不受信且位于临时目录；上传远大于下载且总量可观；短时间新进程大量外发"],
        ["高风险", "多项强证据叠加", "伪装系统进程名（如非系统目录下的 svchost）、签名无效等强证据与其它证据并存"],
      ],
    },
    list: [
      "证据类型（供参考）：伪装系统进程名（强）、签名无效（强）、签名不受信（中）、无签名且位于可疑目录（中）、无签名（弱）、签名有效但位于可疑目录（弱）、上传比例异常（中）、新进程突发上传（视路径定性）。",
      "可疑目录：Temp、LocalAppData\\Temp、Downloads、ProgramData、Roaming——恶意软件常用落点，但正规安装包解压也会经过，请结合误报说明判断。",
      "加入信任名单的进程判定直接为正常（用户信任优先于引擎）。",
    ],
  },
  {
    h: "处置详解",
    list: [
      "禁止联网：写入 Windows 防火墙出站规则（规则名带 NetLens Block 前缀，便于识别），立即生效且随时可解除；被拦截的程序集中在「拦截名单」页管理。",
      "结束进程：直接终止该进程；若是系统关键进程会由系统拒绝，无副作用。",
      "信任名单：以可执行文件身份为键，加入后该身份的所有进程判定为正常，可在「拦截名单」页撤销。",
      "打开所在文件夹 / 打开任务管理器：跳转核对来源与资源占用。",
    ],
  },
  {
    h: "目的地排行",
    paras: ["远端 IP 与域名的流量排行——本机正在与哪些服务器通信、各自占多少上传下载，按总量排序，帮助识别异常远端。"],
  },
  {
    h: "DNS 安全",
    paras: [
      "被动记录每个进程的 DNS 解析流（零额外流量），实时表格展示进程、域名与解析结果。",
      "三层劫持检测：公网域名解析到内网地址、有程序绕过系统 DNS 自行发查询、hosts 或代理设置被篡改——命中即提示。",
      "「DNS 体检」：拿公共 DoH 对比系统解析结果，主动交叉验证是否被劫持（此为唯一的主动联网功能之一，仅在您点击时执行）。",
    ],
  },
  {
    h: "监听端口",
    paras: ["本机正在对外监听的端口清单（TCP/UDP），并归因到监听进程——排查不明服务与后门的入口。"],
  },
  {
    h: "事件流",
    paras: ["连接建立、断开与单次大额传输的实时流水；支持导出 CSV 留档。行数很大时使用顶栏过滤与搜索缩小范围。"],
  },
  {
    h: "拦截名单",
    paras: ["被「禁止联网」的程序集中管理：显示拦截规则与状态，选中后可解除恢复联网；也可以在此撤销对程序的信任。"],
  },
  {
    h: "网络配置",
    paras: ["网卡、网关、DNS、代理的当前状态；检测到配置变更（如 DNS 被改、新网卡上线）时记入「配置变更历史」，便于回溯网络问题。"],
  },
  {
    h: "网络体检",
    paras: [
      "一键出权威数字：NAT 类型（基于 RFC 5780 的精确判定，而非仅行为推测）、带宽档位（下载实测推算，含余量说明）、DNS 解析与代理体检。",
      "测速下载真实数据、上传走公共端点——这是两处主动联网的另一处，仅在您点击体检时执行。",
    ],
  },
  {
    h: "系统托盘与关闭行为",
    list: [
      "最小化窗口即隐藏到系统托盘；托盘左键恢复界面，右键菜单提供显示主界面与退出。",
      "关闭窗口时的行为可在设置中选择：每次询问 / 直接退出 / 最小化到托盘；也可在弹窗中勾选「记住我的选择」。",
    ],
  },
  {
    h: "设置",
    list: [
      "界面语言：跟随系统 / 中文 / English（服务层产出的文本同步切换）。",
      "主题：跟随系统 / 深色 / 浅色。",
      "关闭窗口时：见上节。",
      "数据保留：行为基线（默认 90 天）、证据流（默认 7 天）、证据容量硬顶（默认 512 MB）；可立即清理过期数据。",
      "基线学习：可暂停（证据流照常），隐私敏感场景使用。",
    ],
  },
  {
    h: "数据与隐私",
    paras: [
      "所有数据存于本机 %LOCALAPPDATA%\\NetLens：settings.json（设置）、baseline.db（行为基线）、evidence\\（证据流）。卸载或手动删除即彻底清除。",
      "判定与基线全部在本地计算，本页所述的两处主动联网（DNS 体检、带宽测速）是仅有的对外请求。",
    ],
  },
  {
    h: "快捷键",
    table: {
      head: ["快捷键", "作用"],
      rows: [["Ctrl + B", "收起 / 展开左侧导航"]],
    },
  },
];

const EN: Section[] = [
  {
    h: "Quick start",
    paras: [
      "Top bar, left to right: the logo (doubles as the navigation toggle, Ctrl+B), the brand name, Pause monitoring, the search field with filters, live metrics and the traffic chart. When values grow the numbers expand leftward while the chart stays put.",
      "The app runs elevated: it reads Windows kernel network events (ETW) and the DNS-Client provider, and writes Windows Firewall rules — that is what the UAC prompt is for. The app itself makes zero network connections: no telemetry, no IP geolocation; the only two outbound requests are user-triggered (DNS check in settings, and “query file intel in browser” in the detail panel).",
    ],
  },
  {
    h: "Overview",
    paras: [
      "Per-process live rates and totals, refreshed every second. Click a row to open the detail overlay; right-click a row for the action menu.",
      "The detail overlay shows: executable path, vendor and description, digital signature (state and issuer), parent process, first seen, full command line, software identity with SHA256, risk reasons and verdict evidence, hosting services, live connections, recent DNS — plus the action button group.",
    ],
    list: [
      "Context menu: Open Task Manager / End process / Open folder / Block network access / Inspect in details / Copy PID.",
      "Sorting: the sort control at the table's top-right (column + direction); headers do not sort so column widths stay stable.",
      "Top-bar filters: Hide loopback (127.x inter-process traffic), Only flagged (unknown verdicts and above); search filters by name, path, or PID.",
    ],
  },
  {
    h: "Verdict tiers",
    paras: [
      "Verdicts come from an evidence engine; every conclusion in the detail panel carries its evidence, basis and a false-positive note. A verdict is a hint about network traces, not a diagnosis — judge with the path and vendor in mind.",
    ],
    table: {
      head: ["Tier", "Meaning", "Typical triggers"],
      rows: [
        ["Normal", "Valid signature, normal path, no suspicious evidence", "Known vendor software under Program Files / Windows"],
        ["Unknown", "Not enough information to classify", "Unsigned new program; no evidence but the path is questionable"],
        ["Notable", "Suspicious evidence present", "Unsigned or untrusted signature in a temp-like directory; uploads far exceeding downloads; a brand-new process sending a burst"],
        ["High risk", "Multiple strong pieces of evidence", "Masqueraded system process name (e.g. svchost outside the system dir) or an invalid signature combined with other evidence"],
      ],
    },
    list: [
      "Evidence types (reference): masqueraded system name (strong), invalid signature (strong), untrusted signature (medium), unsigned in a suspicious directory (medium), unsigned (weak), valid signature in a suspicious directory (weak), abnormal upload ratio (medium), upload burst from a new process (weight depends on path).",
      "Suspicious directories: Temp, LocalAppData\\Temp, Downloads, ProgramData, Roaming — common malware drop points, but legitimate installers pass through too; read the false-positive notes.",
      "Processes on the trusted list are always Normal (user trust overrides the engine).",
    ],
  },
  {
    h: "Actions explained",
    list: [
      "Block network access: writes a Windows Firewall outbound rule (rules carry a “NetLens Block” prefix), effective immediately and reversible; blocked programs are managed on the Blocking list page.",
      "End process: terminates the process; the system refuses termination of critical system processes, so it is safe.",
      "Trusted list: keyed by file identity; every process of that identity is judged Normal, revocable on the Blocking list page.",
      "Open folder / Open Task Manager: verify the origin and resource usage.",
    ],
  },
  {
    h: "Destinations",
    paras: ["Traffic ranking by remote IP and domain — which servers this machine talks to and how much each takes, sorted by totals to surface unusual remotes."],
  },
  {
    h: "DNS security",
    paras: [
      "Passively records each process's DNS lookups (zero extra traffic) in a live table of process, domain and answer.",
      "Three-layer hijack detection: public domains resolving to private addresses, programs bypassing the system DNS, tampered hosts or proxy settings — flagged on hit.",
      "“DNS check”: cross-checks system answers against public DoH resolvers (one of the two outbound features, runs only when you click).",
    ],
  },
  {
    h: "Listening ports",
    paras: ["Ports currently listening on this machine (TCP/UDP), attributed to the owning process — the entry point for investigating unknown services and backdoors."],
  },
  {
    h: "Event stream",
    paras: ["A live feed of connections, disconnections and single large transfers; export to CSV for records. Use the top-bar filters and search when the feed grows large."],
  },
  {
    h: "Blocking list",
    paras: ["Central management for programs blocked via “block network access”: shows the rules and their state, unblocking restores connectivity; trusted entries can also be revoked here."],
  },
  {
    h: "Network configuration",
    paras: ["Current state of adapters, gateways, DNS and proxy; detected changes (DNS altered, new adapter up) are logged into the change history for tracing network issues."],
  },
  {
    h: "Network check-up",
    paras: [
      "One click, authoritative numbers: NAT type (precise RFC 5780 mapping behavior, not a behavior guess), bandwidth tier (measured download with headroom notes), DNS and proxy checks.",
      "The download test fetches real data and the upload test uses a public endpoint — the other outbound feature, runs only when you click.",
    ],
  },
  {
    h: "System tray and close behavior",
    list: [
      "Minimizing hides the window to the tray; left-click restores, right-click offers Show main window and Exit.",
      "Choose what closing the window does in Settings: ask every time / exit / minimize to tray; the prompt can remember your choice.",
    ],
  },
  {
    h: "Settings",
    list: [
      "Language: follow system / 中文 / English (service-produced text switches too).",
      "Theme: follow system / dark / light.",
      "Close behavior: see the tray section above.",
      "Data retention: behavior baseline (90 days by default), evidence stream (7 days), evidence cap (512 MB); expired data can be cleaned immediately.",
      "Baseline learning: can be paused (evidence stream keeps running) for privacy-sensitive sessions.",
    ],
  },
  {
    h: "Data and privacy",
    paras: [
      "Everything lives in %LOCALAPPDATA%\\NetLens: settings.json (settings), baseline.db (behavior baseline), evidence\\ (evidence stream). Uninstalling or deleting the folder removes everything.",
      "Verdicts and baselines are computed locally; the two user-triggered outbound features above are the only external requests.",
    ],
  },
  {
    h: "Shortcut",
    table: {
      head: ["Shortcut", "Action"],
      rows: [["Ctrl + B", "Collapse / expand the navigation"]],
    },
  },
];

export function render(root: HTMLElement): void {
  const sections = getLang() === "en" ? EN : ZH;
  const html = sections.map((s) => {
    const body = [
      (s.paras ?? []).map((p) => `<p>${p}</p>`).join(""),
      (s.list ?? []).length ? `<ul>${(s.list ?? []).map((li) => `<li>${li}</li>`).join("")}</ul>` : "",
      s.table
        ? `<table class="guide-table"><thead><tr>${s.table.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${s.table.rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        : "",
    ].join("");
    return `<div class="card guide-sec"><h2>${s.h}</h2>${body}</div>`;
  }).join("");

  root.innerHTML = `
    <div class="page-head">
      <h1>${t("guide.title")}</h1>
      <div class="sub">${t("guide.sub")}</div>
    </div>
    <div class="guide-wrap">${html}</div>`;
}
export function onSnapshot(): void { /* 手册为静态内容，快照无需处理 */ }
