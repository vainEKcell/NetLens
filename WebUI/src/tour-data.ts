// 分页教程数据：每个功能页一组详尽步骤（聚光真实子区域 + 深度文案）。
// 文案双语内联（不走 i18n 键，便于长文维护）；<b> 标签用于气泡内强调。
export type TourStep = {
  page: string;
  selector?: string;   // 聚光目标（缺省仅气泡）
  colId?: string;      // AG Grid 列聚光模式
  centered?: boolean;  // 居中介绍板块：无聚光框、全屏遮罩、气泡居中（用于开场）
  follow?: boolean;    // 逐帧跟踪聚光目标（异步滑入的详情覆盖层等，防"框比面板慢"）
  title: { zh: string; en: string };
  text: { zh: string; en: string };
  onEnter?: () => void;
  onExit?: () => void;
};

const copy = (pid: string) => () => navigator.clipboard.writeText(pid);

export const TOUR_GROUPS: Record<string, TourStep[]> = {
  // ================= 新手总教程（首次启动自动开始；轻量覆盖基础使用） =================
  intro: [
    {
      page: "overview", centered: true,
      title: { zh: "欢迎使用 NetLens", en: "Welcome to NetLens" },
      text: {
        zh: "<b>NetLens</b> 是一个进程级网络监控分析台，回答一个问题——「我的电脑正在和谁通信」：每个进程的上传 / 下载实时可见；可疑行为给出判定与证据；DNS 劫持、对外监听、网络配置异常一目了然；禁止联网等处置一键直达系统层。<br><br>接下来几步认识基础操作，随时可以点「完成」跳过；之后可随时在「使用指南」重放本教程。",
        en: "<b>NetLens</b> is a per-process network monitoring workbench answering one question — “who is my computer talking to?”: live per-process upload / download; suspicious behavior with verdicts and evidence; DNS hijacking, listening ports, and network config anomalies at a glance; one-click system-level actions like blocking.<br><br>A few quick steps next — feel free to finish anytime; replay this tour from the User Guide.",
      },
    },
    {
      page: "overview", selector: "#nav-toggle",
      title: { zh: "收放导航", en: "Collapse or expand the sidebar" },
      text: {
        zh: "点击左上角<b>晶石按钮</b>收起或展开侧边导航，图标会随之旋转一格；快捷键 <b>Ctrl+B</b> 同效。收起后侧栏只留图标，内容区更宽。",
        en: "Click the <b>crystal button</b> (top-left) to collapse or expand the sidebar — the icon rotates one notch; <b>Ctrl+B</b> does the same. Collapsed, the sidebar shows icons only and the content gets wider.",
      },
    },
    {
      page: "overview", selector: "#sidebar",
      title: { zh: "动态菜单", en: "The navigation menu" },
      text: {
        zh: "侧栏是<b>动态菜单</b>：总览看进程流量；流量去向看远端服务器排行；DNS 安全查劫持；监听端口看对外服务；事件流是实时流水；拦截名单管理防火墙规则；网络配置 / 网络体检查网络本身；设置调整语言与主题；使用指南是详细手册。",
        en: "The sidebar is the <b>navigation menu</b>: Overview for per-process traffic; Traffic for remote rankings; DNS Security for hijack detection; Ports for listening services; Events for the live stream; Blocking for firewall rules; Network / Net check for the network itself; Settings for language and theme; the User Guide is the full manual.",
      },
    },
    {
      page: "settings", selector: "#page-settings .card",
      title: { zh: "设置：语言、主题与更新", en: "Settings: language, theme, updates" },
      text: {
        zh: "语言（中/英）、主题（深/浅/跟随系统）、关闭与最小化行为都在设置里，即改即存。底部「<b>关于与更新</b>」可检查新版本并应用内下载安装。",
        en: "Language (zh/en), theme (dark/light/system), close and minimize behavior — all in Settings, applied instantly. “<b>About & updates</b>” at the bottom checks for new versions and installs in-app.",
      },
    },
    {
      page: "guide", selector: "#page-guide .page-head",
      title: { zh: "遇到不懂？随时来指南", en: "Need details? Open the guide" },
      text: {
        zh: "使用指南有<b>每个页面的专属教程</b>（像刚才那样的逐步演示）与概念讲解（判定分级、NAT 类型、DNS 劫持等）。新手引导到此结束，祝使用顺利。",
        en: "The User Guide has a <b>dedicated tour for every page</b> (step-by-step like this one) plus concept notes (verdict tiers, NAT types, DNS hijacking). That's it for the basics — enjoy!",
      },
    },
  ],

  // ================= 总览 =================
  overview: [
    {
      page: "overview", selector: ".tb-left",
      title: { zh: "顶栏：过滤与搜索", en: "Top bar: filters and search" },
      text: {
        zh: "「<b>隐藏回环</b>」过滤 127.x 的本机进程间通信——这类流量在总览里占比大但对外无意义；「<b>仅看可疑</b>」只保留未知及以上判定的进程；搜索框实时按进程名、路径与 PID 过滤。三者可叠加使用。",
        en: "“<b>Hide loopback</b>” filters 127.x inter-process traffic — large in volume but meaningless externally; “<b>Only flagged</b>” keeps unknown verdicts and above; the search box live-filters by process name, path, or PID. All three stack.",
      },
    },
    {
      page: "overview", selector: "#spark",
      title: { zh: "实时指标与流量曲线", en: "Live metrics and chart" },
      text: {
        zh: "右上角是全局总上传 / 总下载的<b>实时速率</b>与<b>会话累计</b>（本次运行以来的总量，↑ 下载 ↓ 上传并列）；曲线是最近数分钟的流量走势。数字变长时向左扩展，曲线位置恒定。",
        en: "Top right: live total upload / download rates and <b>session totals</b> (since this run); the chart traces the last few minutes. Numbers grow leftward; the chart stays put.",
      },
    },
    {
      page: "overview", selector: ".ag-header-cell[col-id='pid']", colId: "pid",
      title: { zh: "进程行与左键", en: "Process rows and left click" },
      text: {
        zh: "每一行是一个进程的实时视图（PID、进程名、风险、速率、累计、连接数）。<b>左键点击任意行</b>——右侧滑出该进程的详情覆盖层（路径、签名、风险原因、处置按钮）。左键只是“查看”，不会对进程产生任何影响。",
        en: "Each row is a live view of one process (PID, name, risk, rates, totals, connections). <b>Left-click any row</b> — the detail overlay slides out on the right (path, signature, risk reasons, actions). Left click only “views”; it never affects the process.",
      },
    },
    {
      page: "overview", selector: ".ag-header-cell[col-id='risk']", colId: "risk",
      title: { zh: "判定分级（风险列）", en: "Verdict tiers (Risk column)" },
      text: {
        zh: "「风险」列由本地证据引擎计算，四档：<b>正常</b>（签名有效且无可疑证据）、<b>未知</b>（信息不足暂无法归类）、<b>值得关注</b>（存在可疑证据，如无签名且在临时目录、上传异常偏大）、<b>高风险</b>（强证据叠加，如伪装系统进程名、签名无效）。判定是提示不是确诊——每条结论在详情面板附<b>证据、依据与误报说明</b>。",
        en: "The Risk column is computed by a local evidence engine, four tiers: <b>Normal</b> (valid signature, no suspicious evidence), <b>Unknown</b> (not enough information), <b>Notable</b> (suspicious evidence, e.g. unsigned in a temp dir, abnormally large uploads), <b>High risk</b> (stacked strong signals like masqueraded system names, invalid signatures). Verdicts are hints, not diagnoses — each carries <b>evidence, basis and false-positive notes</b> in the detail panel.",
      },
    },
    {
      page: "overview", selector: ".nw-context-menu", colId: "risk",
      title: { zh: "右键处置菜单", en: "Right-click action menu" },
      text: {
        zh: "在任意行上<b>右键</b>呼出处置菜单：打开任务管理器（自动定位并选中该进程）、结束进程、打开所在文件夹、<b>禁止联网</b>（写入 Windows 防火墙出站规则，规则名带 NetLens Block 前缀，随时可在拦截名单解除）、在详情中查看、复制 PID。所有处置都在系统层面生效、可追溯。",
        en: "<b>Right-click</b> any row for the action menu: Open Task Manager (auto-locates the row), End process, Open folder, <b>Block network access</b> (a Windows Firewall outbound rule, NetLens Block prefix, reversible on the Blocking page), Inspect in details, Copy PID. All actions act at the system level and are traceable.",
      },
      onEnter: () => document.querySelector("#page-overview .ag-row")?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 560, clientY: 340 })),
      onExit: () => document.querySelector(".nw-context-menu")?.classList.remove("open"),
    },
    {
      page: "overview", selector: "#detail-overlay", follow: true,
      title: { zh: "详情覆盖层", en: "Detail overlay" },
      text: {
        zh: "详情覆盖层汇总该进程的一切：路径、厂商与描述、数字签名、父进程、首次出现、完整命令行、软件身份与 SHA256、风险原因与判定证据、承载服务、实时连接、最近 DNS；底部是处置按钮组（结束进程 / 禁止联网 / 信任 / 打开文件夹）。面板为<b>模态</b>：点暗区、✕ 或 Esc 收起；打开时点其他行会先收起再开新详情。",
        en: "The overlay aggregates everything about the process: path, vendor, signature, parent, first seen, full command line, software identity and SHA256, risk reasons and evidence, services, live connections, recent DNS; actions at the bottom (End / Block / Trust / Open folder). The panel is <b>modal</b>: dim area, ✕ or Esc closes it; clicking another row collapses first, then opens the new one.",
      },
      onEnter: () => document.querySelector("#page-overview .ag-row")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
      onExit: () => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    },
  ],

  // ================= 流量去向 =================
  destinations: [
    {
      page: "destinations", selector: "#page-destinations .ag-root-wrapper",
      title: { zh: "流量去向：远端聚合视图", en: "Traffic: remote aggregation" },
      text: {
        zh: "按<b>远端地址</b>聚合的会话累计流量——本机正在与哪些服务器通信、各自占多少上传下载，按总量排序。<b>域名优先显示</b>：有域名时显示域名（来自被动 DNS 学习），没有时显示裸 IP。",
        en: "Session totals aggregated by <b>remote address</b> — which servers this machine talks to and how much each takes, sorted by totals. <b>Domains preferred</b>: a domain is shown when passive DNS learning knows one, otherwise the bare IP.",
      },
    },
    {
      page: "destinations", selector: "#page-destinations .ag-root-wrapper",
      title: { zh: "使用建议", en: "How to use it" },
      text: {
        zh: "识别<b>陌生远端</b>的入口：看到不认识的服务器，先复制地址到威胁情报平台查询，再回到总览找到对应进程做处置。此页是只读视图，不提供操作——处置入口在总览的右键与详情面板。",
        en: "The entry point for <b>unfamiliar remotes</b>: copy an unknown server's address to a threat-intel service, then go back to Overview to find and handle the owning process. This page is read-only — actions live in Overview's context menu and detail panel.",
      },
    },
  ],

  // ================= DNS 安全 =================
  dns: [
    {
      page: "dns", selector: "#page-dns .card",
      title: { zh: "三层劫持检测", en: "Three-layer hijack detection" },
      text: {
        zh: "检测自动运行、<b>完全被动（零额外流量）</b>：① 公网域名解析到<b>内网地址</b>（典型劫持特征）；② 有进程<b>绕过系统 DNS</b> 自行发查询；③ <b>hosts 或代理</b>被篡改。命中即在此提示，并附触发进程。",
        en: "Runs automatically, <b>fully passive (zero extra traffic)</b>: ① public domains resolving to <b>private addresses</b> (classic hijack); ② processes <b>bypassing the system DNS</b>; ③ tampered <b>hosts or proxy</b>. Hits are flagged here with the triggering process.",
      },
    },
    {
      page: "dns", selector: "#dns-servers",
      title: { zh: "DNS 与代理现状", en: "DNS and proxy state" },
      text: {
        zh: "当前系统 DNS 服务器、系统代理与 WinHTTP 代理——排查「DNS 被改」「代理被挂」类问题的第一入口。这里与「网络配置」页联动监控。",
        en: "Current system DNS servers, system proxy and WinHTTP proxy — the first stop for “my DNS got changed” / “a proxy appeared” investigations, monitored together with the Network page.",
      },
    },
    {
      page: "dns", selector: "#doh-run",
      title: { zh: "DNS 体检（主动交叉验证）", en: "DNS check (active cross-verification)" },
      text: {
        zh: "选择公共 DoH 提供商后点击按钮：用<b>加密 DNS</b> 重新解析近期查询过的域名，与系统解析结果<b>逐条对比</b>——不一致即可能被劫持，结果表列出每条差异。<b>这是仅有的两处主动联网之一</b>，只在您点击时执行。",
        en: "Pick a public DoH provider and click: recent domains are re-resolved via <b>encrypted DNS</b> and <b>compared row by row</b> with the system's answers — mismatches suggest hijacking, listed per domain. <b>One of the only two outbound features</b>, runs only when you click.",
      },
    },
    {
      page: "dns", selector: "#dns-stream",
      title: { zh: "实时解析流", en: "Live resolution stream" },
      text: {
        zh: "每个进程的 DNS 解析实时流水（最近 200 条）：哪个进程查询了什么域名、得到什么结果。这是<b>被动监听</b>记录——零额外流量，也是判定「解析到内网」类问题的原始依据。",
        en: "A live feed of every process's DNS lookups (last 200): which process queried which domain and what it got. Purely <b>passive recording</b> — zero extra traffic, and the raw basis for “resolved to a private address” findings.",
      },
    },
  ],

  // ================= 监听端口 =================
  ports: [
    {
      page: "ports", selector: "#page-ports .ag-root-wrapper",
      title: { zh: "对外监听端口", en: "Listening ports" },
      text: {
        zh: "本机正在对外监听的端口：协议（TCP/UDP）、端口号、绑定地址与<b>监听进程</b>。对外提供服务的端口必然出现在这里——排查后门与不明服务的入口。",
        en: "Ports currently listening on this machine: protocol (TCP/UDP), port, binding address and the <b>owning process</b>. Any port serving externally must appear here — the entry point for backdoor and unknown-service hunts.",
      },
    },
    {
      page: "ports", selector: "#page-ports .ag-root-wrapper",
      title: { zh: "排查思路", en: "How to triage" },
      text: {
        zh: "<b>0.0.0.0</b> 绑定表示对全部网卡开放（外部可达），<b>127.0.0.1</b> 仅本机可达。不认识的端口：看进程列归因 → 结合总览详情的路径与签名判断 → 必要时在总览右键处置。",
        en: "<b>0.0.0.0</b> binds all interfaces (externally reachable), <b>127.0.0.1</b> is local-only. Unknown port: check the owning process → cross-check path and signature in Overview → act via Overview's context menu if needed.",
      },
    },
  ],

  // ================= 事件流 =================
  events: [
    {
      page: "events", selector: "#page-events .ag-root-wrapper",
      title: { zh: "实时事件流", en: "Live event stream" },
      text: {
        zh: "实时流水记录四类事件：<b>连接建立</b>、<b>连接断开</b>、<b>单次大额传输</b>（证据引擎阈值触发）、<b>防火墙拦截</b>。类型列着色区分；每条附进程、远端与字节数。",
        en: "A live feed of four event kinds: <b>connections</b>, <b>disconnections</b>, <b>single large transfers</b> (evidence-engine thresholds), and <b>firewall blocks</b>. Types are color-coded; each entry carries process, remote and bytes.",
      },
    },
    {
      page: "events", selector: "#page-events .ag-root-wrapper",
      title: { zh: "右键操作", en: "Right-click actions" },
      text: {
        zh: "在任意事件行上<b>右键</b>：对该地址发起 <b>DNS 体检</b>（跳转 DNS 安全页自动对比）、在总览中查看该进程、只看此进程的事件、复制远端地址或域名。事件流是“事后追溯”的主入口。",
        en: "<b>Right-click</b> any event row: run a <b>DNS check</b> on the target (jumps to DNS Security and compares), inspect the process in Overview, filter the stream to this process, copy the remote or domain. The stream is the main “after the fact” entry point.",
      },
      onEnter: () => document.querySelector("#page-events .ag-row")?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 620, clientY: 380 })),
      onExit: () => document.querySelector(".nw-context-menu")?.classList.remove("open"),
    },
    {
      page: "events", selector: "#page-events .ag-root-wrapper",
      title: { zh: "导出与重置", en: "Export and reset" },
      text: {
        zh: "顶部的「重置过滤」清除按进程过滤的状态。完整事件流的 <b>CSV 导出</b>在「设置 → 数据与隐私」——导出当前视图留档分析。清空按钮只清空界面视图，<b>不影响证据流</b>。",
        en: "The top “Reset filter” clears per-process filtering. The full stream's <b>CSV export</b> lives in “Settings → Data & privacy” — it exports the current view for records. Clearing the view does <b>not</b> touch the evidence stream.",
      },
    },
  ],

  // ================= 拦截名单 =================
  blocking: [
    {
      page: "blocking", selector: "#page-blocking .ag-root-wrapper",
      title: { zh: "拦截规则管理", en: "Blocking rules" },
      text: {
        zh: "被「禁止联网」的程序集中在此：每条对应一条 <b>Windows 防火墙出站规则</b>（规则名带 <b>NetLens Block</b> 前缀，便于识别与审计），显示拦截状态。处置的入口在总览右键，管理的入口在这里。",
        en: "Programs blocked via “block network access” are collected here: one <b>Windows Firewall outbound rule</b> each (NetLens Block prefix for identification) with its state. Actions originate in Overview; management lives here.",
      },
    },
    {
      page: "blocking", selector: "#page-blocking .ag-root-wrapper",
      title: { zh: "解除与信任", en: "Unblock and trust" },
      text: {
        zh: "选中条目<b>解除拦截</b>——删除对应防火墙规则、立即恢复联网。对程序的<b>信任</b>（允许名单）也在这里撤销：撤销后该进程的判定恢复由引擎计算（不再强制正常）。",
        en: "Select an entry and <b>unblock</b> — the firewall rule is deleted and connectivity restored instantly. The program's <b>trust</b> (allow list) is revoked here too: its verdict returns to engine-computed instead of forced Normal.",
      },
    },
  ],

  // ================= 网络配置 =================
  network: [
    {
      page: "network", selector: "#page-network .card",
      title: { zh: "网卡与网关", en: "Adapters and gateways" },
      text: {
        zh: "每张网卡的连接状态、IP、网关与 DNS。<b>网关探测基于 GetBestRoute 取实际出口</b>，并优先物理网卡——VPN 虚拟网卡会被识别并标注，避免把虚拟网关当作真实出口（这是修过的真实缺陷）。",
        en: "Per-adapter link state, IPs, gateway and DNS. <b>Gateway detection uses GetBestRoute for the real exit</b> and prefers physical adapters — VPN virtual adapters are detected and labeled (a real fixed defect).",
      },
    },
    {
      page: "network", selector: "#page-network .card",
      title: { zh: "代理监控", en: "Proxy monitoring" },
      text: {
        zh: "系统代理与 WinHTTP 代理的状态——<b>代理被篡改</b>是常见的流量劫持手法之一。这里与「DNS 安全」页联动：代理变化在两处都会被记录。",
        en: "System proxy and WinHTTP proxy state — <b>proxy tampering</b> is a common traffic-hijack technique. Monitored together with the DNS Security page: proxy changes are recorded in both.",
      },
    },
    {
      page: "network", selector: "#page-network .ag-root-wrapper",
      title: { zh: "配置变更历史", en: "Configuration change history" },
      text: {
        zh: "检测到的每一次配置变更都记录：<b>何时</b>、<b>改了什么</b>、旧值与新值（DNS 被改、新网卡上线、代理开关等）。网络突然异常时回溯这里，往往能定位原因。",
        en: "Every detected change is logged: <b>when</b>, <b>what</b>, old and new values (DNS altered, new adapter up, proxy toggled). When the network suddenly misbehaves, this history usually reveals the cause.",
      },
    },
  ],

  // ================= 网络体检 =================
  netcheck: [
    {
      page: "netcheck", selector: "#page-netcheck .card",
      title: { zh: "一键体检", en: "One-click check-up" },
      text: {
        zh: "点击开始后依次执行：<b>NAT 类型</b>（RFC 5780 精确判定 A/B/C/D，而非行为推测）、<b>带宽档位</b>（下载真实数据推算，附余量说明）、<b>DNS 体检</b>与代理检查。全程一键，结果都写在页面里。",
        en: "Click and it runs in sequence: <b>NAT type</b> (precise RFC 5780 A/B/C/D, not a behavior guess), <b>bandwidth tier</b> (real download with headroom notes), <b>DNS check</b> and proxy check. One click; results are written on the page.",
      },
    },
    {
      page: "netcheck", selector: "#page-netcheck .card",
      title: { zh: "NAT 类型是什么", en: "What NAT type means" },
      text: {
        zh: "NAT 类型反映路由器转换地址的严格程度：<b>A</b> 最开放（外部可直接连入）→ <b>B</b> → <b>C</b> 较严格（仅出站，外部无法主动连入）→ <b>D</b>。影响游戏联机、P2P 与语音。<b>NAT 由路由器决定、通常固定，与节点无关</b>。",
        en: "NAT type reflects how strictly your router translates addresses: <b>A</b> most open (direct inbound possible) → <b>B</b> → <b>C</b> stricter (outbound only) → <b>D</b>. It affects gaming, P2P and voice. <b>NAT is decided by the router, usually fixed, unrelated to nodes</b>.",
      },
    },
    {
      page: "netcheck", selector: "#page-netcheck .card",
      title: { zh: "主动联网提醒", en: "Outbound notice" },
      text: {
        zh: "带宽测速与 DNS 体检是<b>仅有的两处主动联网</b>——只在您点击时执行，产生的流量计入系统。除此之外 NetLens 不发起任何对外连接。",
        en: "The bandwidth test and DNS check are the <b>only two outbound features</b> — they run only when you click, and their traffic counts. Apart from these, NetLens initiates no external connections.",
      },
    },
  ],
};
