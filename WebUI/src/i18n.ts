// 界面语言：zh / en 字典（auto 按 navigator.language 解析）；AG Grid 同步切换
export type Lang = "zh" | "en";

const zh: Record<string, string> = {
  // 导航
  "nav.overview": "总览", "nav.destinations": "目的地排行", "nav.dns": "DNS 安全",
  "nav.ports": "监听端口", "nav.events": "事件流", "nav.blocking": "拦截名单",
  "nav.network": "网络配置", "nav.netcheck": "网络体检", "nav.settings": "设置",
  // 顶栏
  "tb.up": "总上传", "tb.down": "总下载", "tb.session": "会话累计",
  "tb.pause": "暂停监控", "tb.resume": "恢复监控",
  // 总览
  "ov.title": "总览", "ov.sub": "每进程实时流量 · 点击行查看详情与处置",
  "ov.col.pid": "PID", "ov.col.name": "进程", "ov.col.risk": "风险",
  "ov.col.down": "↓ 速度", "ov.col.up": "↑ 速度", "ov.col.downTotal": "↓ 累计",
  "ov.col.upTotal": "↑ 累计", "ov.col.conns": "连接",
  "ov.detail.empty": "点击左侧进程行<br/>查看详情、判定与处置",
  "ov.detail.title": "进程详情", "ov.detail.verdict": "判定与证据",
  "ov.detail.services": "承载服务", "ov.detail.conns": "当前连接",
  "ov.detail.path": "路径", "ov.detail.vendor": "厂商", "ov.detail.signature": "签名",
  "ov.detail.noVerdict": "暂无判定记录", "ov.detail.noConns": "无活动连接",
  "ov.detail.noServices": "无", "ov.detail.kill": "结束进程",
  "ov.risk.0": "正常", "ov.risk.1": "提示", "ov.risk.2": "关注", "ov.risk.3": "可疑",
  "ov.vd.0": "正常", "ov.vd.1": "提示（详见下方依据）", "ov.vd.2": "关注（建议核查路径与厂商）", "ov.vd.3": "可疑（建议处置）",
  "ov.weight": "权重", "ov.basis": "依据",
  // DNS
  "dns.title": "DNS 安全", "dns.sub": "解析流为被动监听（零流量）；DNS 体检为主动交叉验证，仅在点击按钮时联网",
  "dns.servers": "DNS 服务器（变更会告警）", "dns.proxy": "系统代理 / WinHTTP",
  "dns.stream": "实时 DNS 解析流（最近 200 条）",
  "dns.col.time": "时间", "dns.col.process": "进程", "dns.col.domain": "域名",
  "dns.col.ips": "解析结果", "dns.col.note": "提示",
  "dns.doh": "DNS 体检 — 主动交叉验证", "dns.doh.auto": "自动（国内优先，失败换源）",
  "dns.doh.hint": "「自动」按国内优先顺序逐源尝试；开启代理后可选择海外参考源获得与直连一致的对照结果。",
  "dns.doh.run": "开始体检", "dns.col.local": "本机解析", "dns.col.ref": "参考源解析",
  "dns.col.verdict": "结论",
  // 体检
  "nc.title": "网络体检", "nc.sub": "NAT 类型探测、网关与公网延迟测量、带宽测试一键完成，全程约半分钟",
  "nc.run": "开始网络体检", "nc.note": "检测仅在点击按钮时产生网络流量，平时不占用带宽。",
  "nc.nat": "NAT 类型", "nc.external": "外部地址",
  "nc.speed": "带宽测试", "nc.down": "下行", "nc.up": "上行（参考）",
  "nc.speed.hint": "自动选择节点拉流采样，剔除 TCP 慢启动阶段后计算平均与峰值并估算宽带档位；测速走直连、不经过代理。",
  "nc.ping": "延迟 / 抖动 / 丢包",
  "nc.ping.hint": "网关是路由器，反映内网状况；两个公共 DNS 是公网参考点。看「平均」即可：网关接近 0 属正常，公网约 20~40 ms 属正常。",
  "nc.ping.target": "目标", "nc.ping.avg": "平均", "nc.ping.jitter": "抖动",
  "nc.ping.loss": "丢包率", "nc.ping.p95": "P95 延迟", "nc.ping.quality": "质量",
  "nc.analysis": "综合分析", "nc.link": "连接方式", "nc.linkspeed": "链路速率",
  "nc.wifi": "Wi-Fi 信号", "nc.ssid": "网络名称", "nc.mtu": "路径 MTU",
  "nc.conclusion": "体检结果", "nc.peak": "会话峰值",
  // 事件流
  "ev.title": "事件流", "ev.sub": "连接、传输、DNS 与拦截事件的统一时间线（内存保留最近 65536 条）",
  "ev.filter.hint": "右键事件行可按类型或进程筛选",
  "ev.filter.active": "筛选生效：{0}", "ev.reset": "重置筛选",
  "ev.col.time": "时间", "ev.col.kind": "类型", "ev.col.process": "进程",
  "ev.col.detail": "目标 / 内容", "ev.col.bytes": "数据量",
  // 目的地
  "dst.title": "目的地排行", "dst.sub": "按远端地址聚合的会话累计流量（域名优先显示）",
  "dst.col.display": "目的地", "dst.col.scope": "范围", "dst.col.up": "↑ 累计",
  "dst.col.down": "↓ 累计", "dst.col.last": "最近活动", "dst.col.processes": "涉及进程",
  // 端口
  "port.title": "监听端口", "port.sub": "本机监听端口与对外暴露面（所有地址 = 可被局域网/公网访问）",
  "port.col.proto": "协议", "port.col.port": "端口", "port.col.bind": "绑定地址",
  "port.col.bindText": "暴露面", "port.col.pid": "PID", "port.col.process": "进程",
  // 拦截
  "bl.title": "拦截名单", "bl.sub": "防火墙按程序拦截（Windows 防火墙规则，可在系统防火墙或此处解除）",
  "bl.unblock": "解除选中程序的拦截", "bl.refresh": "刷新名单",
  "bl.hint": "在总览右键的处置也会写入此处；规则名带 NetWatch 前缀便于识别",
  "bl.col.app": "程序", "bl.col.path": "路径", "bl.col.rules": "规则",
  "bl.trusted": "允许名单（用户信任，优先于引擎判定）",
  "bl.trusted.empty": "暂无允许名单项——在总览选中进程后使用「允许联网」加入",
  "bl.remove": "移出",
  // 网络配置
  "net.title": "网络配置", "net.sub": "DNS / 代理 / hosts 的变更检测（零流量），变更即告警",
  "net.col.adapter": "网卡", "net.col.status": "状态", "net.col.ips": "IP 地址",
  "net.col.gw": "网关", "net.col.dns": "DNS",
  "net.col.time": "时间", "net.col.what": "项目", "net.col.old": "旧值", "net.col.new": "新值",
  "net.history": "配置变更历史", "net.up": "已连接", "net.down": "断开",
  // 设置
  "set.title": "设置", "set.sub": "语言 / 主题 / 数据保留（即改即存）",
  "set.appearance": "外观", "set.lang": "界面语言", "set.theme": "主题",
  "set.lang.hint": "语言影响服务层产出的文本（NAT 判定、告警等）与界面。",
  "set.theme.auto": "跟随系统", "set.theme.dark": "深色", "set.theme.light": "浅色",
  "set.lang.auto": "跟随系统", "set.lang.zh": "中文", "set.lang.en": "English",
  "set.data": "数据与隐私", "set.baseline": "行为基线", "set.evidence": "证据流",
  "set.cap": "证据容量", "set.baselinePause": "基线学习", "set.baselinePause.hint": "暂停（证据流照常）",
  "set.cleanup": "立即清理过期数据", "set.audit": "启用防火墙拦截审计",
  "set.b30": "保留 30 天", "set.b90": "保留 90 天", "set.b365": "保留 365 天", "set.b0": "不限",
  "set.e3": "保留 3 天", "set.e7": "保留 7 天", "set.e30": "保留 30 天",
  "set.c128": "128 MB", "set.c512": "512 MB", "set.c2048": "2 GB",
  "set.overview": "总览显示", "set.loopback": "回环流量", "set.loopback.hint": "显示回环 (127.x)",
  "set.search": "搜索", "set.search.ph": "按进程名/路径过滤总览",
  "set.events": "事件流", "set.export": "导出事件流 (CSV)", "set.clear": "清空事件流",
  "set.clear.hint": "导出用系统另存为对话框；清空仅影响界面视图，磁盘证据流不受影响。",
  "set.retention30": "30 天", "set.retention90": "90 天", "set.retention365": "365 天",
  // 占位
  "ph.title": "此页将在后续版本迁移到新界面",
  "ph.sub": "功能当前仍可通过启动 NetWatch 时不加 --spike 参数使用完整 WPF 界面",
  // AG Grid
  "ag.noRows": "暂无数据", "ag.loading": "加载中…",
};

const en: Record<string, string> = {
  "nav.overview": "Overview", "nav.destinations": "Destinations", "nav.dns": "DNS Security",
  "nav.ports": "Listening Ports", "nav.events": "Event Stream", "nav.blocking": "Blocklist",
  "nav.network": "Network Config", "nav.netcheck": "Network Check", "nav.settings": "Settings",
  "tb.up": "Upload", "tb.down": "Download", "tb.session": "Session totals",
  "tb.pause": "Pause monitoring", "tb.resume": "Resume monitoring",
  "ov.title": "Overview", "ov.sub": "Real-time per-process traffic · click a row for details and actions",
  "ov.col.pid": "PID", "ov.col.name": "Process", "ov.col.risk": "Risk",
  "ov.col.down": "↓ Speed", "ov.col.up": "↑ Speed", "ov.col.downTotal": "↓ Total",
  "ov.col.upTotal": "↑ Total", "ov.col.conns": "Conns",
  "ov.detail.empty": "Click a process row<br/>to view details, verdict and actions",
  "ov.detail.title": "Process details", "ov.detail.verdict": "Verdict & evidence",
  "ov.detail.services": "Hosted services", "ov.detail.conns": "Active connections",
  "ov.detail.path": "Path", "ov.detail.vendor": "Vendor", "ov.detail.signature": "Signature",
  "ov.detail.noVerdict": "No verdict recorded yet", "ov.detail.noConns": "No active connections",
  "ov.detail.noServices": "None", "ov.detail.kill": "End process",
  "ov.risk.0": "Normal", "ov.risk.1": "Notice", "ov.risk.2": "Watch", "ov.risk.3": "Suspicious",
  "ov.vd.0": "Normal", "ov.vd.1": "Notice (see evidence below)", "ov.vd.2": "Watch (verify path and vendor)", "ov.vd.3": "Suspicious (action advised)",
  "ov.weight": "weight", "ov.basis": "Basis",
  "dns.title": "DNS Security", "dns.sub": "The stream is passive listening (zero traffic); the DNS check is active cross-validation and only uses the network on demand",
  "dns.servers": "DNS servers (changes raise alerts)", "dns.proxy": "System proxy / WinHTTP",
  "dns.stream": "Live DNS resolution stream (last 200)",
  "dns.col.time": "Time", "dns.col.process": "Process", "dns.col.domain": "Domain",
  "dns.col.ips": "Resolved", "dns.col.note": "Note",
  "dns.doh": "DNS check — active cross-validation", "dns.doh.auto": "Automatic (CN first, failover)",
  "dns.doh.hint": "Automatic tries CN sources in order; behind a proxy, pick an overseas reference source for an apples-to-apples comparison.",
  "dns.doh.run": "Run check", "dns.col.local": "Local resolution", "dns.col.ref": "Reference resolution",
  "dns.col.verdict": "Verdict",
  "nc.title": "Network Check", "nc.sub": "NAT probe, gateway and public pings, and a bandwidth test in one click; about half a minute",
  "nc.run": "Start network check", "nc.note": "The check only uses the network while it runs.",
  "nc.nat": "NAT type", "nc.external": "External address",
  "nc.speed": "Bandwidth test", "nc.down": "Download", "nc.up": "Upload (reference)",
  "nc.speed.hint": "Samples real data from an auto-selected node, skips TCP slow-start, computes average and peak and estimates your broadband tier; runs over a direct connection, bypassing proxies.",
  "nc.ping": "Latency / jitter / loss",
  "nc.ping.hint": "The gateway is your router (LAN view); the two public DNS entries are public reference points. Look at the average: near 0 ms for the gateway and roughly 20–40 ms for public targets is normal.",
  "nc.ping.target": "Target", "nc.ping.avg": "Avg", "nc.ping.jitter": "Jitter",
  "nc.ping.loss": "Loss", "nc.ping.p95": "P95 latency", "nc.ping.quality": "Quality",
  "nc.analysis": "Network analysis", "nc.link": "Connection", "nc.linkspeed": "Link speed",
  "nc.wifi": "Wi-Fi signal", "nc.ssid": "Network (SSID)", "nc.mtu": "Path MTU",
  "nc.conclusion": "Results", "nc.peak": "Session peaks",
  "ev.title": "Event Stream", "ev.sub": "Unified timeline of connections, transfers, DNS and firewall-block events (last 65,536 in memory)",
  "ev.filter.hint": "Right-click a row to filter by type or process",
  "ev.filter.active": "Filter active: {0}", "ev.reset": "Reset filter",
  "ev.col.time": "Time", "ev.col.kind": "Type", "ev.col.process": "Process",
  "ev.col.detail": "Target / content", "ev.col.bytes": "Bytes",
  "dst.title": "Destinations", "dst.sub": "Session totals aggregated by remote address (domain names preferred)",
  "dst.col.display": "Destination", "dst.col.scope": "Scope", "dst.col.up": "↑ Total",
  "dst.col.down": "↓ Total", "dst.col.last": "Last seen", "dst.col.processes": "Processes",
  "port.title": "Listening Ports", "port.sub": "Local listening ports and exposure (all addresses = reachable from LAN/internet)",
  "port.col.proto": "Proto", "port.col.port": "Port", "port.col.bind": "Bind address",
  "port.col.bindText": "Exposure", "port.col.pid": "PID", "port.col.process": "Process",
  "bl.title": "Blocklist", "bl.sub": "Per-program firewall blocking (Windows firewall rules; removable here or in Windows)",
  "bl.unblock": "Unblock selected program", "bl.refresh": "Refresh list",
  "bl.hint": "Actions from the Overview right-click menu also land here; rules carry a NetWatch prefix for identification",
  "bl.col.app": "Program", "bl.col.path": "Path", "bl.col.rules": "Rules",
  "bl.trusted": "Allowed list (user-trusted, overrides engine verdicts)",
  "bl.trusted.empty": "Nothing allowed yet — select a process in Overview and use \"Allow\"",
  "bl.remove": "Remove",
  "net.title": "Network Config", "net.sub": "Change detection for DNS / proxy / hosts (zero traffic); changes raise alerts",
  "net.col.adapter": "Adapter", "net.col.status": "Status", "net.col.ips": "IP addresses",
  "net.col.gw": "Gateway", "net.col.dns": "DNS",
  "net.col.time": "Time", "net.col.what": "Item", "net.col.old": "Old", "net.col.new": "New",
  "net.history": "Configuration change history", "net.up": "Connected", "net.down": "Down",
  "set.title": "Settings", "set.sub": "Language / theme / data retention (applied instantly)",
  "set.appearance": "Appearance", "set.lang": "Language", "set.theme": "Theme",
  "set.lang.hint": "Language affects service-produced text (NAT verdicts, alerts) and the UI.",
  "set.theme.auto": "Follow system", "set.theme.dark": "Dark", "set.theme.light": "Light",
  "set.lang.auto": "Follow system", "set.lang.zh": "中文", "set.lang.en": "English",
  "set.data": "Data & privacy", "set.baseline": "Behavior baseline", "set.evidence": "Evidence stream",
  "set.cap": "Evidence cap", "set.baselinePause": "Baseline learning", "set.baselinePause.hint": "Pause (evidence stream keeps running)",
  "set.cleanup": "Clean up expired data now", "set.audit": "Enable firewall block auditing",
  "set.b30": "Keep 30 days", "set.b90": "Keep 90 days", "set.b365": "Keep 365 days", "set.b0": "Unlimited",
  "set.e3": "Keep 3 days", "set.e7": "Keep 7 days", "set.e30": "Keep 30 days",
  "set.c128": "128 MB", "set.c512": "512 MB", "set.c2048": "2 GB",
  "set.overview": "Overview display", "set.loopback": "Loopback traffic", "set.loopback.hint": "Show loopback (127.x)",
  "set.search": "Search", "set.search.ph": "Filter overview by process name/path",
  "set.events": "Event stream", "set.export": "Export events (CSV)", "set.clear": "Clear event stream",
  "set.clear.hint": "Export uses the system save dialog; clearing only affects the view, on-disk evidence is untouched.",
  "set.retention30": "30 days", "set.retention90": "90 days", "set.retention365": "365 days",
  "ph.title": "This page will move to the new UI in a later release",
  "ph.sub": "Without the --spike argument NetWatch still offers the full WPF interface",
  "ag.noRows": "No data", "ag.loading": "Loading…",
};

const dicts: Record<Lang, Record<string, string>> = { zh, en };
let current: Lang = "zh";

export function setLang(lang: string): void {
  current = lang === "en" || (lang === "auto" && !navigator.language.startsWith("zh")) ? "en" : "zh";
}

export function lang(): Lang {
  return current;
}

export function t(key: string, ...args: (string | number)[]): string {
  let v = dicts[current][key] ?? dicts.zh[key] ?? key;
  args.forEach((a, i) => { v = v.replace(`{${i}}`, String(a)); });
  return v;
}

/// AG Grid 内置文案（noRowsToShow 等）——中文界面不出现英文覆盖层
export function agLocale(): Record<string, string> {
  return current === "zh"
    ? {
        noRowsToShow: "暂无数据", loadingOoo: "加载中…", loadingError: "加载出错",
        filterOoo: "筛选", searchOoo: "搜索", blanks: "(空)",
        equals: "等于", notEqual: "不等于", contains: "包含", notContains: "不包含",
        startsWith: "开头是", endsWith: "结尾是", andCondition: "并且", orCondition: "或者",
        selectAll: "(全选)", pinColumn: "固定列", autosizeThisColumn: "自适应此列",
        autosizeAllColumns: "自适应全部列", resetColumns: "重置列",
      }
    : {};
}
