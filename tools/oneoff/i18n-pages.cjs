// 一次性迁移脚本：把页面字面量替换为 i18n t() 调用（wave 3）
const fs = require("fs");
const base = "S:/ZWorker/NetWatch/WebUI/src/pages/";

function apply(file, pairs, importLine) {
  let t = fs.readFileSync(base + file, "utf8");
  let miss = 0;
  for (const [old, neu] of pairs) {
    if (!t.includes(old)) { console.log("MISS", file, JSON.stringify(old.slice(0, 48))); miss++; continue; }
    t = t.split(old).join(neu);
  }
  if (importLine && !t.includes('from "../i18n"')) {
    const idx = t.indexOf("import ");
    t = t.slice(0, idx) + importLine + "\n" + t.slice(idx);
  }
  fs.writeFileSync(base + file, t);
  console.log("done", file, miss ? `(${miss} missed)` : "");
}

// ---------- overview ----------
apply("overview.ts", [
  ['import { Snapshot, OverviewRow, fmtSpeed, fmtBytes, riskNames, riskClass, sendCommand } from "../api";',
   'import { Snapshot, OverviewRow, fmtSpeed, fmtBytes, riskClass, sendCommand } from "../api";\nimport { t, agLocale } from "../i18n";'],
  ['{ headerName: "PID", field: "pid", width: 84 },', '{ headerName: t("ov.col.pid"), field: "pid", width: 84 },'],
  ['{ headerName: "进程", field: "name", flex: 1.7, minWidth: 130, cellRenderer: nameCell },', '{ headerName: t("ov.col.name"), field: "name", flex: 1.7, minWidth: 130, cellRenderer: nameCell },'],
  ['valueFormatter: (p) => riskNames[p.value as number] ?? "" },', 'valueFormatter: (p) => t(`ov.risk.${p.value}`) },'],
  ['{ headerName: "↓ 速度", field: "down", width: 104, type: "rightAligned",', '{ headerName: t("ov.col.down"), field: "down", width: 104, type: "rightAligned",'],
  ['{ headerName: "↑ 速度", field: "up", width: 104, type: "rightAligned",', '{ headerName: t("ov.col.up"), field: "up", width: 104, type: "rightAligned",'],
  ['{ headerName: "↓ 累计", field: "downTotal", width: 100, type: "rightAligned",', '{ headerName: t("ov.col.downTotal"), field: "downTotal", width: 100, type: "rightAligned",'],
  ['{ headerName: "↑ 累计", field: "upTotal", width: 100, type: "rightAligned",', '{ headerName: t("ov.col.upTotal"), field: "upTotal", width: 100, type: "rightAligned",'],
  ['{ headerName: "连接", field: "conns", width: 76, type: "rightAligned" },', '{ headerName: t("ov.col.conns"), field: "conns", width: 76, type: "rightAligned" },'],
  ['  defaultColDef: { sortable: true, resizable: true },\n  rowSelection:', '  defaultColDef: { sortable: true, resizable: true },\n  localeText: agLocale(),\n  rowSelection:'],
  ['<h1>总览</h1>', '<h1>${t("ov.title")}</h1>'],
  ['每进程实时流量 · 点击行查看详情与处置', '${t("ov.sub")}'],
  ['点击左侧进程行<br/>查看详情、判定与处置', '${t("ov.detail.empty")}'],
  ['<h2>进程详情</h2>', '<h2>${t("ov.detail.title")}</h2>'],
  ['<h2>判定与证据</h2>', '<h2>${t("ov.detail.verdict")}</h2>'],
  ['<span class="k">路径</span>', '<span class="k">${t("ov.detail.path")}</span>'],
  ['<span class="k">厂商</span>', '<span class="k">${t("ov.detail.vendor")}</span>'],
  ['<span class="k">签名</span>', '<span class="k">${t("ov.detail.signature")}</span>'],
  ['暂无判定记录', '${t("ov.detail.noVerdict")}'],
  ['<h2>承载服务（${d.services.length}）</h2>', '<h2>${t("ov.detail.services")}（${d.services.length}）</h2>'],
  [': "无"}</div>', ': t("ov.detail.noServices")}</div>'],
  ['<h2>当前连接（${d.conns.length}）</h2>', '<h2>${t("ov.detail.conns")}（${d.conns.length}）</h2>'],
  [': `<div class="basis">无活动连接</div>`}', ': `<div class="basis">${t("ov.detail.noConns")}</div>`}'],
  ['<button class="btn" id="d-kill">结束进程</button>', '<button class="btn" id="d-kill">${t("ov.detail.kill")}</button>'],
  ['return ["正常", "提示（详见下方依据）", "关注（建议核查路径与厂商）", "可疑（建议处置）"][risk] ?? "";', 'return t(`ov.vd.${risk}`);'],
  ['（权重 ${e.Weight}）', '（${t("ov.weight")} ${e.Weight}）'],
  ['依据：${escapeHtml(e.Basis)}', '${t("ov.basis")}：${escapeHtml(e.Basis)}'],
], 'import { t, agLocale } from "../i18n";');

// ---------- dns ----------
apply("dns.ts", [
  ['<h1>DNS 安全</h1>', '<h1>${t("dns.title")}</h1>'],
  ['解析流为被动监听（零流量）；DNS 体检为主动交叉验证，仅在点击按钮时联网', '${t("dns.sub")}'],
  ['<h2>DNS 服务器（变更会告警）</h2>', '<h2>${t("dns.servers")}</h2>'],
  ['<h2>系统代理 / WinHTTP</h2>', '<h2>${t("dns.proxy")}</h2>'],
  ['<h2>实时 DNS 解析流（最近 200 条）</h2>', '<h2>${t("dns.stream")}</h2>'],
  ['{ headerName: "时间", field: "time", width: 76 },', '{ headerName: t("dns.col.time"), field: "time", width: 76 },'],
  ['{ headerName: "进程", field: "process", width: 150 },', '{ headerName: t("dns.col.process"), field: "process", width: 150 },'],
  ['{ headerName: "域名", field: "domain", flex: 1.2, cellRenderer:', '{ headerName: t("dns.col.domain"), field: "domain", flex: 1.2, cellRenderer:'],
  ['{ headerName: "解析结果", field: "ips", flex: 1.2, cellClass: "text-dim" },', '{ headerName: t("dns.col.ips"), field: "ips", flex: 1.2, cellClass: "text-dim" },'],
  ['{ headerName: "提示", field: "alertText", flex: 1.3,', '{ headerName: t("dns.col.note"), field: "alertText", flex: 1.3,'],
  ['<h2>DNS 体检 — 主动交叉验证</h2>', '<h2>${t("dns.doh")}</h2>'],
  ['<button class="btn primary" id="doh-run">开始体检</button>', '<button class="btn primary" id="doh-run">${t("dns.doh.run")}</button>'],
  ['「自动」按国内优先顺序逐源尝试；开启代理后可选择海外参考源获得与直连一致的对照结果。', '${t("dns.doh.hint")}'],
  ['{ headerName: "域名", field: "Domain", width: 170 },', '{ headerName: t("dns.col.domain"), field: "Domain", width: 170 },'],
  ['{ headerName: "本机解析", field: "LocalIps", flex: 1.1 },', '{ headerName: t("dns.col.local"), field: "LocalIps", flex: 1.1 },'],
  ['{ headerName: "参考源解析", field: "RefIps", flex: 1.1, cellClass: "text-dim" },', '{ headerName: t("dns.col.ref"), field: "RefIps", flex: 1.1, cellClass: "text-dim" },'],
  ['{ headerName: "结论", field: "Verdict", flex: 1,', '{ headerName: t("dns.col.verdict"), field: "Verdict", flex: 1,'],
  ['{ i: -1, label: "自动（国内优先，失败换源）", group: "" },', '{ i: -1, label: t("dns.doh.auto"), group: "" },'],
  ['{ i: 0, label: "阿里公共 DNS（223.5.5.5）", group: "国内源" },', '{ i: 0, label: "AliDNS 223.5.5.5", group: "cn" },'],
  ['{ i: 1, label: "DNSPod（doh.pub）", group: "国内源" },', '{ i: 1, label: "DNSPod doh.pub", group: "cn" },'],
  ['{ i: 2, label: "DNSPod（120.53.53.53）", group: "国内源" },', '{ i: 2, label: "DNSPod 120.53.53.53", group: "cn" },'],
  ['{ i: 3, label: "阿里公共 DNS（223.6.6.6）", group: "国内源" },', '{ i: 3, label: "AliDNS 223.6.6.6", group: "cn" },'],
  ['{ i: 4, label: "Cloudflare（1.1.1.1）", group: "海外源" },', '{ i: 4, label: "Cloudflare 1.1.1.1", group: "global" },'],
  ['{ i: 5, label: "Google Public DNS", group: "海外源" },', '{ i: 5, label: "Google Public DNS", group: "global" },'],
  ['{ i: 6, label: "Quad9（9.9.9.9）", group: "海外源" },', '{ i: 6, label: "Quad9 9.9.9.9", group: "global" },'],
  ['      og.label = s.group;', '      og.label = s.group === "cn" ? (lang() === "zh" ? "国内源" : "China sources") : (lang() === "zh" ? "海外源" : "Global sources");'],
  ['import { Snapshot } from "../api";', 'import { Snapshot } from "../api";\nimport { t, agLocale, lang } from "../i18n";'],
  ['    defaultColDef: { sortable: false, resizable: true },\n    suppressCellFocus: true, getRowId: (p) => String(p.data.__i),',
   '    defaultColDef: { sortable: false, resizable: true },\n    localeText: agLocale(),\n    suppressCellFocus: true, getRowId: (p) => String(p.data.__i),'],
  ['    defaultColDef: { sortable: false, resizable: true },\n    suppressCellFocus: true,\n  } as GridOptions);',
   '    defaultColDef: { sortable: false, resizable: true },\n    localeText: agLocale(),\n    suppressCellFocus: true,\n  } as GridOptions);'],
], 'import { t, agLocale, lang } from "../i18n";');

// ---------- netcheck ----------
apply("netcheck.ts", [
  ['import { Snapshot } from "../api";\nimport { sendCommand } from "../api";', 'import { Snapshot } from "../api";\nimport { sendCommand } from "../api";\nimport { t } from "../i18n";'],
  ['<h1>网络体检</h1>', '<h1>${t("nc.title")}</h1>'],
  ['NAT 类型探测、网关与公网延迟测量、带宽测试一键完成，全程约半分钟', '${t("nc.sub")}'],
  ['<button class="btn primary" id="nc-run">开始网络体检</button>', '<button class="btn primary" id="nc-run">${t("nc.run")}</button>'],
  ['检测仅在点击按钮时产生网络流量，平时不占用带宽。', '${t("nc.note")}'],
  ['<h2>NAT 类型</h2>', '<h2>${t("nc.nat")}</h2>'],
  ['<span class="k">外部地址</span>', '<span class="k">${t("nc.external")}</span>'],
  ['<h2>带宽测试</h2>', '<h2>${t("nc.speed")}</h2>'],
  ['<div class="hint" style="margin:0;">下行</div>', '<div class="hint" style="margin:0;">${t("nc.down")}</div>'],
  ['<div class="hint" style="margin:0;">上行（参考）</div>', '<div class="hint" style="margin:0;">${t("nc.up")}</div>'],
  ['自动选择节点拉流采样，剔除 TCP 慢启动阶段后计算平均与峰值并估算宽带档位；测速走直连、不经过代理。', '${t("nc.speed.hint")}'],
  ['<h2>延迟 / 抖动 / 丢包</h2>', '<h2>${t("nc.ping")}</h2>'],
  ['网关是路由器，反映内网状况；两个公共 DNS 是公网参考点。看「平均」即可：网关接近 0 属正常，公网约 20~40 ms 属正常。', '${t("nc.ping.hint")}'],
  ['<span>目标</span>', '<span>${t("nc.ping.target")}</span>'],
  ['<span class="r">平均</span>', '<span class="r">${t("nc.ping.avg")}</span>'],
  ['<span class="r">抖动</span>', '<span class="r">${t("nc.ping.jitter")}</span>'],
  ['<span class="r">丢包率</span>', '<span class="r">${t("nc.ping.loss")}</span>'],
  ['<span class="r">P95 延迟</span>', '<span class="r">${t("nc.ping.p95")}</span>'],
  ['<span class="r">质量</span>', '<span class="r">${t("nc.ping.quality")}</span>'],
  ['<h2>综合分析</h2>', '<h2>${t("nc.analysis")}</h2>'],
  ['<span class="k">连接方式</span>', '<span class="k">${t("nc.link")}</span>'],
  ['<span class="k">链路速率</span>', '<span class="k">${t("nc.linkspeed")}</span>'],
  ['<span class="k">Wi-Fi 信号</span>', '<span class="k">${t("nc.wifi")}</span>'],
  ['<span class="k">网络名称</span>', '<span class="k">${t("nc.ssid")}</span>'],
  ['<span class="k">路径 MTU</span>', '<span class="k">${t("nc.mtu")}</span>'],
  ['<h2>体检结果</h2>', '<h2>${t("nc.conclusion")}</h2>'],
  ['const stClass = (t: string) =>\n  /优秀|良好|正常/.test(t) ? "st-good" : /一般|参考/.test(t) ? "st-fair" : /较差|不足|可疑/.test(t) ? "st-poor" : "";\n', ''],
  ['          <span class="r ${stClass(p.QualityText)}">${escapeHtml(p.QualityText)}</span>', '          <span class="r ${p.QualityClass}">${escapeHtml(p.QualityText)}</span>'],
  ['      <span class="${stClass(x.Verdict)}">${escapeHtml(x.Verdict)}</span>', '      <span class="${x.Class}">${escapeHtml(x.Verdict)}</span>'],
  ['  verdictEl.className = `big ${stClass(n.verdict)}`;', '  verdictEl.className = `big ${n.verdictClass}`;'],
], 'import { t } from "../i18n";');

// ---------- events ----------
apply("events.ts", [
  ['<h1>事件流</h1>', '<h1>${t("ev.title")}</h1>'],
  ['连接、传输、DNS 与拦截事件的统一时间线（内存保留最近 65536 条）', '${t("ev.sub")}'],
  ['<button class="btn" id="ev-clear-filter" style="display:none;">重置筛选</button>', '<button class="btn" id="ev-clear-filter" style="display:none;">${t("ev.reset")}</button>'],
  ['{ headerName: "时间", field: "time", width: 76 },', '{ headerName: t("ev.col.time"), field: "time", width: 76 },'],
  ['{ headerName: "类型", field: "kind", width: 108,', '{ headerName: t("ev.col.kind"), field: "kind", width: 108,'],
  ['{ headerName: "进程", field: "process", width: 168 },', '{ headerName: t("ev.col.process"), field: "process", width: 168 },'],
  ['{ headerName: "目标 / 内容", field: "detail", flex: 1.4,', '{ headerName: t("ev.col.detail"), field: "detail", flex: 1.4,'],
  ['{ headerName: "数据量", field: "bytes", width: 92, type: "rightAligned",', '{ headerName: t("ev.col.bytes"), field: "bytes", width: 92, type: "rightAligned",'],
  ['  defaultColDef: { sortable: false, resizable: true },\n  suppressCellFocus: true,\n  cellFlashDuration: 0,', '  defaultColDef: { sortable: false, resizable: true },\n  localeText: agLocale(),\n  suppressCellFocus: true,\n  cellFlashDuration: 0,'],
  ['fe.textContent = show ? `筛选生效：${s.events.filterText}（右键行可按类型/进程筛选）` : "右键事件行可按类型或进程筛选";',
   'fe.textContent = show ? t("ev.filter.active", s.events.filterText) : t("ev.filter.hint");'],
  ['import { Snapshot, sendCommand } from "../api";', 'import { Snapshot, sendCommand } from "../api";\nimport { t, agLocale } from "../i18n";'],
], 'import { t, agLocale } from "../i18n";');

// ---------- destinations ----------
apply("destinations.ts", [
  ['<h1>目的地排行</h1>', '<h1>${t("dst.title")}</h1>'],
  ['按远端地址聚合的会话累计流量（域名优先显示）', '${t("dst.sub")}'],
  ['{ headerName: "目的地", field: "Display", flex: 1.6, minWidth: 180,', '{ headerName: t("dst.col.display"), field: "Display", flex: 1.6, minWidth: 180,'],
  ['{ headerName: "范围", field: "Scope", width: 84, cellClass: "text-dim" },', '{ headerName: t("dst.col.scope"), field: "Scope", width: 84, cellClass: "text-dim" },'],
  ['{ headerName: "↑ 累计", field: "UpText", width: 110, type: "rightAligned", cellClass: "text-green" },', '{ headerName: t("dst.col.up"), field: "UpText", width: 110, type: "rightAligned", cellClass: "text-green" },'],
  ['{ headerName: "↓ 累计", field: "DownText", width: 110, type: "rightAligned", cellClass: "text-blue" },', '{ headerName: t("dst.col.down"), field: "DownText", width: 110, type: "rightAligned", cellClass: "text-blue" },'],
  ['{ headerName: "最近活动", field: "LastText", width: 100, type: "rightAligned", cellClass: "text-dim" },', '{ headerName: t("dst.col.last"), field: "LastText", width: 100, type: "rightAligned", cellClass: "text-dim" },'],
  ['{ headerName: "涉及进程", field: "ProcessesText", flex: 1.2, cellClass: "text-dim" },', '{ headerName: t("dst.col.processes"), field: "ProcessesText", flex: 1.2, cellClass: "text-dim" },'],
  ['  defaultColDef: { sortable: true, resizable: true },\n  suppressCellFocus: true,\n  cellFlashDuration: 0,', '  defaultColDef: { sortable: true, resizable: true },\n  localeText: agLocale(),\n  suppressCellFocus: true,\n  cellFlashDuration: 0,'],
  ['import { Snapshot } from "../api";', 'import { Snapshot } from "../api";\nimport { t, agLocale } from "../i18n";'],
], 'import { t, agLocale } from "../i18n";');

// ---------- ports ----------
apply("ports.ts", [
  ['<h1>监听端口</h1>', '<h1>${t("port.title")}</h1>'],
  ['本机监听端口与对外暴露面（所有地址 = 可被局域网/公网访问）', '${t("port.sub")}'],
  ['{ headerName: "协议", field: "ProtoText", width: 70 },', '{ headerName: t("port.col.proto"), field: "ProtoText", width: 70 },'],
  ['{ headerName: "端口", field: "Port", width: 84, type: "rightAligned",', '{ headerName: t("port.col.port"), field: "Port", width: 84, type: "rightAligned",'],
  ['{ headerName: "绑定地址", field: "Bind", width: 160,', '{ headerName: t("port.col.bind"), field: "Bind", width: 160,'],
  ['{ headerName: "暴露面", field: "BindText", width: 116,', '{ headerName: t("port.col.bindText"), field: "BindText", width: 116,'],
  ['{ headerName: "PID", field: "Pid", width: 80, type: "rightAligned" },', '{ headerName: t("port.col.pid"), field: "Pid", width: 80, type: "rightAligned" },'],
  ['{ headerName: "进程", field: "Process", flex: 1 },', '{ headerName: t("port.col.process"), field: "Process", flex: 1 },'],
  ['  defaultColDef: { sortable: true, resizable: true },\n  suppressCellFocus: true,\n  cellFlashDuration: 0,', '  defaultColDef: { sortable: true, resizable: true },\n  localeText: agLocale(),\n  suppressCellFocus: true,\n  cellFlashDuration: 0,'],
  ['import { Snapshot } from "../api";', 'import { Snapshot } from "../api";\nimport { t, agLocale } from "../i18n";'],
], 'import { t, agLocale } from "../i18n";');

// ---------- blocking ----------
apply("blocking.ts", [
  ['<h1>拦截名单</h1>', '<h1>${t("bl.title")}</h1>'],
  ['防火墙按程序拦截（Windows 防火墙规则，可在系统防火墙或此处解除）', '${t("bl.sub")}'],
  ['<button class="btn" id="bl-unblock" disabled>解除选中程序的拦截</button>', '<button class="btn" id="bl-unblock" disabled>${t("bl.unblock")}</button>'],
  ['<button class="btn" id="bl-refresh">刷新名单</button>', '<button class="btn" id="bl-refresh">${t("bl.refresh")}</button>'],
  ['<span class="hint" style="margin:0;">在总览右键的处置也会写入此处；规则名带 NetWatch 前缀便于识别</span>', '<span class="hint" style="margin:0;">${t("bl.hint")}</span>'],
  ['{ headerName: "程序", field: "DisplayName", width: 240 },', '{ headerName: t("bl.col.app"), field: "DisplayName", width: 240 },'],
  ['{ headerName: "路径", field: "Path", flex: 1.4,', '{ headerName: t("bl.col.path"), field: "Path", flex: 1.4,'],
  ['{ headerName: "规则", field: "RulesText", width: 90, type: "rightAligned" },', '{ headerName: t("bl.col.rules"), field: "RulesText", width: 90, type: "rightAligned" },'],
  ['<h2>允许名单（用户信任，优先于引擎判定）</h2>', '<h2>${t("bl.trusted")}</h2>'],
  [': "暂无允许名单项——在总览选中进程后使用「允许联网」加入",', ': t("bl.trusted.empty"),'],
  ['<button class="btn" data-key="${escapeHtml(t.Key)}">移出</button>', '<button class="btn" data-key="${escapeHtml(t.Key)}">${t("bl.remove")}</button>'],
  ['  defaultColDef: { sortable: true, resizable: true },\n  suppressCellFocus: true,\n  cellFlashDuration: 0,', '  defaultColDef: { sortable: true, resizable: true },\n  localeText: agLocale(),\n  suppressCellFocus: true,\n  cellFlashDuration: 0,'],
  ['import { Snapshot, sendCommand } from "../api";', 'import { Snapshot, sendCommand } from "../api";\nimport { t, agLocale } from "../i18n";'],
], 'import { t, agLocale } from "../i18n";');

// ---------- network ----------
apply("network.ts", [
  ['<h1>网络配置</h1>', '<h1>${t("net.title")}</h1>'],
  ['DNS / 代理 / hosts 的变更检测（零流量），变更即告警', '${t("net.sub")}'],
  ['<h2>配置变更历史</h2>', '<h2>${t("net.history")}</h2>'],
  ['{ headerName: "网卡", field: "Name", width: 180 },', '{ headerName: t("net.col.adapter"), field: "Name", width: 180 },'],
  ['{ headerName: "状态", field: "Status", width: 76,', '{ headerName: t("net.col.status"), field: "Status", width: 76,'],
  ['{ headerName: "IP 地址", field: "IpsText", flex: 1.2,', '{ headerName: t("net.col.ips"), field: "IpsText", flex: 1.2,'],
  ['{ headerName: "网关", field: "GwText", flex: 0.8, cellRenderer: monoCell },', '{ headerName: t("net.col.gw"), field: "GwText", flex: 0.8, cellRenderer: monoCell },'],
  ['{ headerName: "DNS", field: "DnsText", flex: 1.2, cellRenderer: monoCell },', '{ headerName: t("net.col.dns"), field: "DnsText", flex: 1.2, cellRenderer: monoCell },'],
  ['{ headerName: "时间", field: "TimeText", width: 130 },', '{ headerName: t("net.col.time"), field: "TimeText", width: 130 },'],
  ['{ headerName: "项目", field: "What", width: 150 },', '{ headerName: t("net.col.what"), field: "What", width: 150 },'],
  ['{ headerName: "旧值", field: "Old", flex: 1, cellRenderer: monoCell },', '{ headerName: t("net.col.old"), field: "Old", flex: 1, cellRenderer: monoCell },'],
  ['{ headerName: "新值", field: "New", flex: 1, cellRenderer: monoCell },', '{ headerName: t("net.col.new"), field: "New", flex: 1, cellRenderer: monoCell },'],
  ["    valueFormatter: (p) => (p.value === \"up\" ? \"已连接\" : \"断开\") },", "    valueFormatter: (p) => (p.value === \"up\" ? t(\"net.up\") : t(\"net.down\")) },"],
  ['  defaultColDef: { sortable: false, resizable: true },\n  suppressCellFocus: true,\n  cellFlashDuration: 0,', '  defaultColDef: { sortable: false, resizable: true },\n  localeText: agLocale(),\n  suppressCellFocus: true,\n  cellFlashDuration: 0,'],
  ['import { Snapshot } from "../api";', 'import { Snapshot } from "../api";\nimport { t, agLocale } from "../i18n";'],
], 'import { t, agLocale } from "../i18n";');

// ---------- settings ----------
apply("settings.ts", [
  ['<h1>设置</h1>', '<h1>${t("set.title")}</h1>'],
  ['语言 / 主题 / 数据保留（即改即存）', '${t("set.sub")}'],
  ['<h2>外观</h2>', '<h2>${t("set.appearance")}</h2>'],
  ['<span class="k">界面语言</span>', '<span class="k">${t("set.lang")}</span>'],
  ['<span class="k">主题</span>', '<span class="k">${t("set.theme")}</span>'],
  ['<option value="auto">跟随系统</option>\n              <option value="zh">中文</option>\n              <option value="en">English</option>',
   '<option value="auto">${t("set.lang.auto")}</option>\n              <option value="zh">${t("set.lang.zh")}</option>\n              <option value="en">${t("set.lang.en")}</option>'],
  ['<option value="auto">跟随系统</option>\n              <option value="dark">深色</option>\n              <option value="light">浅色</option>',
   '<option value="auto">${t("set.theme.auto")}</option>\n              <option value="dark">${t("set.theme.dark")}</option>\n              <option value="light">${t("set.theme.light")}</option>'],
  ['语言影响服务层产出的文本（NAT 判定、告警等）；界面文字的英文翻译将在 beta 版补齐。', '${t("set.lang.hint")}'],
  ['<h2>数据与隐私</h2>', '<h2>${t("set.data")}</h2>'],
  ['<span class="k">行为基线</span>', '<span class="k">${t("set.baseline")}</span>'],
  ['<span class="k">证据流</span>', '<span class="k">${t("set.evidence")}</span>'],
  ['<span class="k">证据容量</span>', '<span class="k">${t("set.cap")}</span>'],
  ['<span class="k">基线学习</span>', '<span class="k">${t("set.baselinePause")}</span>'],
  ['暂停（证据流照常）', '${t("set.baselinePause.hint")}'],
  ['<button class="btn" id="set-cleanup">立即清理过期数据</button>', '<button class="btn" id="set-cleanup">${t("set.cleanup")}</button>'],
  ['<button class="btn" id="set-audit" style="display:none;">启用防火墙拦截审计</button>', '<button class="btn" id="set-audit" style="display:none;">${t("set.audit")}</button>'],
  ['<option value="30">保留 30 天</option>', '<option value="30">${t("set.b30")}</option>'],
  ['<option value="90">保留 90 天</option>', '<option value="90">${t("set.b90")}</option>'],
  ['<option value="365">保留 365 天</option>', '<option value="365">${t("set.b365")}</option>'],
  ['<option value="0">不限</option>', '<option value="0">${t("set.b0")}</option>'],
  ['<option value="3">保留 3 天</option>', '<option value="3">${t("set.e3")}</option>'],
  ['<option value="7">保留 7 天</option>', '<option value="7">${t("set.e7")}</option>'],
  ['<option value="30">保留 30 天</option>', '<option value="30">${t("set.e30")}</option>'],
  ['<option value="128">128 MB</option>', '<option value="128">${t("set.c128")}</option>'],
  ['<option value="512">512 MB</option>', '<option value="512">${t("set.c512")}</option>'],
  ['<option value="2048">2 GB</option>', '<option value="2048">${t("set.c2048")}</option>'],
  ['<h2>总览显示</h2>', '<h2>${t("set.overview")}</h2>'],
  ['<span class="k">回环流量</span>', '<span class="k">${t("set.loopback")}</span>'],
  ['显示回环 (127.x)', '${t("set.loopback.hint")}'],
  ['<span class="k">搜索</span>', '<span class="k">${t("set.search")}</span>'],
  ['placeholder="按进程名/路径过滤总览"', 'placeholder="${t("set.search.ph")}"'],
  ['<h2>事件流</h2>', '<h2>${t("set.events")}</h2>'],
  ['<button class="btn" id="set-export">导出事件流 (CSV)</button>', '<button class="btn" id="set-export">${t("set.export")}</button>'],
  ['<button class="btn" id="set-clearev">清空事件流</button>', '<button class="btn" id="set-clearev">${t("set.clear")}</button>'],
  ['导出用系统另存为对话框；清空仅影响界面视图，磁盘证据流不受影响。', '${t("set.clear.hint")}'],
  ['import { Snapshot, sendCommand } from "../api";', 'import { Snapshot, sendCommand } from "../api";\nimport { t } from "../i18n";'],
], 'import { t } from "../i18n";');

// ---------- placeholder ----------
apply("placeholder.ts", [
  ['<div>此页将在 0.1.5 beta 中迁移到新界面</div>', '<div>${t("ph.title")}</div>'],
  ['功能当前仍可通过启动 NetWatch 时不加 --spike 参数使用完整 WPF 界面', '${t("ph.sub")}'],
  ['import { Snapshot, sendCommand } from "../api";', 'import { Snapshot, sendCommand } from "../api";\nimport { t } from "../i18n";'],
], 'import { t } from "../i18n";');

console.log("ALL DONE");
