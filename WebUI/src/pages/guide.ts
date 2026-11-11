// 使用指南：子标签式手册——每个功能页一个子标签（简述 + 概念解释 + 「开始本页教程」），
// 教程跳转到真实页面走该页专属气泡步骤，完成后自动返回本页。概念性内容（基线/证据/保留）单独成节。
import { t, getLang } from "../i18n";
import { startPageTour } from "../tour";

type Tab = {
  id: string;            // 对应 PAGE_TOURS 键；privacy 为纯图文
  titleKey: string;
};

const TABS: Tab[] = [
  { id: "overview", titleKey: "nav.overview" },
  { id: "destinations", titleKey: "nav.destinations" },
  { id: "dns", titleKey: "nav.dns" },
  { id: "ports", titleKey: "nav.ports" },
  { id: "events", titleKey: "nav.events" },
  { id: "blocking", titleKey: "nav.blocking" },
  { id: "network", titleKey: "nav.network" },
  { id: "netcheck", titleKey: "nav.netcheck" },
  { id: "privacy", titleKey: "guide.privacy" },
];

type Content = { paras?: string[]; list?: string[]; concepts?: { term: string; expl: string }[]; tour?: boolean };

const ZH: Record<string, Content> = {
  overview: {
    paras: ["总览是应用的主战场：每个进程的实时上传/下载速率与累计流量，1 秒刷新。点击任意一行，右侧滑出该进程的详情覆盖层（路径、签名、父进程、命令行、风险原因、处置按钮一应俱全）；在行上右键呼出处置菜单。"],
    concepts: [
      { term: "判定四档", expl: "正常 = 签名有效且无可疑证据；未知 = 信息不足暂无法归类；值得关注 = 存在可疑证据（如无签名且在临时目录、上传异常偏大）；高风险 = 多项强证据叠加（如伪装系统进程名、签名无效）。判定是提示不是确诊，每条结论在详情面板附证据与误报说明。" },
      { term: "右键菜单", expl: "打开任务管理器 / 结束进程 / 打开所在文件夹 / 禁止联网（写入系统防火墙，随时可解除）/ 在详情中查看 / 复制 PID。" },
      { term: "顶栏过滤", expl: "「隐藏回环」过滤 127.x 本机进程间通信；「仅看可疑」只显示未知及以上判定；搜索框按进程名、路径、PID 过滤。" },
    ],
    tour: true,
  },
  destinations: {
    paras: ["远端 IP 与域名的流量排行——本机正在与哪些服务器通信、各自占多少上传下载，按总量排序。识别“从没见过的远端”从这里开始。"],
    tour: true,
  },
  dns: {
    paras: ["被动记录每个进程的 DNS 解析流（零额外流量），并做三层劫持检测：公网域名解析到内网地址、有程序绕过系统 DNS 自行发查询、hosts 或代理设置被篡改——命中即提示。"],
    concepts: [
      { term: "DNS 体检", expl: "拿公共 DoH（加密 DNS）重新解析同一批域名，与系统解析结果对比——不一致即可能被劫持。属主动联网功能，只在您点击时执行。" },
    ],
    tour: true,
  },
  ports: {
    paras: ["本机正在对外监听的端口清单（TCP/UDP），并归因到监听它的进程。发现不认识的端口与进程组合时，这里是排查后门与不明服务的入口。"],
    tour: true,
  },
  events: {
    paras: ["连接建立、断开与单次大额传输的实时流水，支持导出 CSV 留档分析。数据量大时用顶栏过滤与搜索缩小范围。"],
    tour: true,
  },
  blocking: {
    paras: ["被「禁止联网」的程序集中在这里：显示防火墙拦截规则与状态，选中即可解除恢复联网；对程序的信任（允许名单）也在这里撤销。"],
    tour: true,
  },
  network: {
    paras: ["网卡、网关、DNS、代理的当前状态；检测到配置变更（DNS 被改、新网卡上线、代理开关）时自动记入「配置变更历史」，网络出问题可以从这里回溯。"],
    tour: true,
  },
  netcheck: {
    paras: ["一键网络体检：NAT 类型（RFC 5780 精确判定，而非行为推测）、带宽档位（下载实测推算并给出余量说明）、DNS 与代理体检。"],
    concepts: [
      { term: "NAT 类型", expl: "家庭路由器把内网地址转换成公网地址的方式。类型越严格（如 C），外部主动连入越困难，对游戏联机/P2P 有影响。NAT 由路由器决定，通常固定，与节点无关。" },
    ],
    tour: true,
  },
  privacy: {
    paras: ["NetLens 的所有数据只存在本机 %LOCALAPPDATA%\\NetLens，卸载或删除该目录即彻底清除。程序自身零联网、零遥测；所有对外请求均由您主动点击触发：DNS 体检（DoH 比对）、网络体检（NAT 探测与带宽测速）、右键的文件情报查询（VirusTotal）、设置里的检查更新。"],
    concepts: [
      { term: "行为基线", expl: "NetLens 会持续记住每个程序“平时都连过哪些服务器”。之后某个程序一旦出现新的联网行为，就能一眼认出这是“新面孔”——这份数据库就是行为基线，默认保留 90 天。" },
      { term: "证据流", expl: "每一条“值得关注/高风险”判定背后都有一份原始记录：哪个进程、何时、连了哪里、证据是什么——供您复核判断，默认保留 7 天。" },
      { term: "数据保留", expl: "基线与证据到保留期后自动清理，容量接近硬顶时按最旧优先删除；也可以在设置里随时手动清理，或调短保留期。" },
    ],
  },
};

const EN: Record<string, Content> = {
  overview: {
    paras: ["Overview is where the app lives: per-process live upload/download rates and totals, refreshed every second. Click any row to slide out the detail overlay (path, signature, parent, command line, risk reasons, actions); right-click a row for the action menu."],
    concepts: [
      { term: "Four verdict tiers", expl: "Normal = valid signature, no suspicious evidence. Unknown = not enough information. Notable = suspicious evidence present (unsigned in a temp dir, abnormally large uploads). High risk = multiple strong signals (masqueraded system name, invalid signature). Verdicts are hints, not diagnoses — every one carries evidence and a false-positive note in the detail panel." },
      { term: "Context menu", expl: "Open Task Manager / End process / Open folder / Block network access (a Windows Firewall rule, reversible) / Inspect in details / Copy PID." },
      { term: "Top-bar filters", expl: "“Hide loopback” filters 127.x inter-process traffic; “Only flagged” shows unknown and above; search filters by name, path, PID." },
    ],
    tour: true,
  },
  destinations: {
    paras: ["Traffic ranking by remote IP and domain — which servers this machine talks to and how much each takes, sorted by totals. Unfamiliar remotes surface here first."],
    tour: true,
  },
  dns: {
    paras: ["Passively records every process's DNS lookups (zero extra traffic) and runs three-layer hijack detection: public domains resolving to private addresses, programs bypassing the system DNS, tampered hosts or proxy settings."],
    concepts: [
      { term: "DNS check", expl: "Re-resolves the same domains via public DoH (encrypted DNS) and compares with the system's answers — mismatches suggest hijacking. A user-triggered outbound feature, runs only when you click." },
    ],
    tour: true,
  },
  ports: {
    paras: ["Ports currently listening on this machine (TCP/UDP) attributed to their owning process — the entry point for investigating unknown services and backdoors."],
    tour: true,
  },
  events: {
    paras: ["A live feed of connections, disconnections and single large transfers, with CSV export. When the feed grows large, narrow it with the top-bar filters and search."],
    tour: true,
  },
  blocking: {
    paras: ["Programs blocked via “block network access” are managed here: firewall rules and their state, unblocking restores connectivity; trusted entries are revoked here too."],
    tour: true,
  },
  network: {
    paras: ["Current state of adapters, gateways, DNS and proxy; changes (DNS altered, new adapter up, proxy toggled) are logged into the change history for tracing network issues."],
    tour: true,
  },
  netcheck: {
    paras: ["One-click network check-up: NAT type (precise RFC 5780 determination), bandwidth tier (measured download with headroom notes), DNS and proxy checks."],
    concepts: [
      { term: "NAT type", expl: "How your router translates private addresses to public ones. The stricter the type (like C), the harder for outsiders to connect in — it affects game matchmaking and P2P. NAT is decided by the router, usually fixed, and unrelated to nodes." },
    ],
    tour: true,
  },
  privacy: {
    paras: ["All NetLens data lives in %LOCALAPPDATA%\\NetLens on this machine; uninstalling or deleting that folder removes everything. The app has zero telemetry and no background traffic — every outbound request is user-triggered: DNS check (DoH), network check-up (STUN and speed test), file-intel lookup (VirusTotal), and the in-app update check."],
    concepts: [
      { term: "Behavior baseline", expl: "NetLens keeps remembering which servers each process normally talks to; when a process suddenly does something new, it is recognized as a new face. That memory is the baseline, kept for 90 days by default." },
      { term: "Evidence stream", expl: "Every “Notable/High risk” verdict carries a raw record — which process, when, where it connected, and what the evidence was — for your own review. Kept 7 days by default." },
      { term: "Data retention", expl: "Baselines and evidence are cleaned automatically when past retention; the largest-oldest are trimmed near the cap. You can also clean immediately or shorten retention in Settings." },
    ],
  },
};

export function render(root: HTMLElement): void {
  const content = getLang() === "en" ? EN : ZH;

  const tabs = TABS.map((tab, i) => `
    <button class="guide-tab${i === 0 ? " active" : ""}" data-tab="${tab.id}">${t(tab.titleKey)}</button>`).join("");

  const panels = TABS.map((tab, i) => {
    const c = content[tab.id] ?? { paras: [] };
    const concepts = (c.concepts ?? []).map((k) =>
      `<div class="guide-concept"><div class="guide-term">${k.term}</div><div class="guide-expl">${k.expl}</div></div>`).join("");
    const tourBtn = c.tour
      ? `<button class="btn primary guide-tour" data-tour="${tab.id}">${t("guide.trytour")}</button>`
      : "";
    return `<div class="guide-panel${i === 0 ? " active" : ""}" data-panel="${tab.id}">
      ${(c.paras ?? []).map((p) => `<p class="guide-p">${p}</p>`).join("")}
      ${concepts ? `<div class="guide-concepts">${concepts}</div>` : ""}
      ${tourBtn}
    </div>`;
  }).join("");

  root.innerHTML = `
    <div class="page-head">
      <h1>${t("guide.title")}</h1>
      <div class="sub">${t("guide.sub")}</div>
    </div>
    <div class="guide-tabs">${tabs}</div>
    <div class="guide-panels">${panels}</div>`;

  // 子标签切换
  root.querySelectorAll<HTMLElement>(".guide-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      root!.querySelectorAll(".guide-tab").forEach((b) => b.classList.toggle("active", b === btn));
      const id = btn.dataset.tab!;
      root!.querySelectorAll<HTMLElement>(".guide-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === id));
    });
  });
  // 本页教程
  root.querySelectorAll<HTMLElement>(".guide-tour").forEach((btn) => {
    btn.addEventListener("click", () => { startPageTour(btn.dataset.tour!); });
  });
}
export function onSnapshot(): void { /* 手册为静态内容 */ }
