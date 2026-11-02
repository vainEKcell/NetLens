import { createGrid, GridOptions, ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";
import { t, agLocale, lang } from "../i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

let streamApi: GridApi | null = null;
let dohApi: GridApi | null = null;
type GridApi = ReturnType<typeof createGrid>;

const streamCols: ColDef[] = [
  { headerName: t("dns.col.time"), headerValueGetter: () => t("dns.col.time"), field: "time", width: 76 },
  { headerName: t("dns.col.process"), headerValueGetter: () => t("dns.col.process"), field: "process", width: 150 },
  { headerName: t("dns.col.domain"), headerValueGetter: () => t("dns.col.domain"), field: "domain", flex: 1.2, cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "12px";
      return s;
    } },
  { headerName: t("dns.col.ips"), headerValueGetter: () => t("dns.col.ips"), field: "ips", flex: 1.2, cellClass: "text-dim" },
  { headerName: t("dns.col.note"), headerValueGetter: () => t("dns.col.note"), field: "alertText", flex: 1.3,
    cellClass: (p) => (p.value ? "risk-low" : "text-dim"),
    valueFormatter: (p) => (p.value ? String(p.value) : "—") },
];

const dohCols: ColDef[] = [
  { headerName: t("dns.col.domain"), headerValueGetter: () => t("dns.col.domain"), field: "Domain", width: 170 },
  { headerName: t("dns.col.local"), headerValueGetter: () => t("dns.col.local"), field: "LocalIps", flex: 1.1 },
  { headerName: t("dns.col.ref"), headerValueGetter: () => t("dns.col.ref"), field: "RefIps", flex: 1.1, cellClass: "text-dim" },
  { headerName: t("dns.col.verdict"), headerValueGetter: () => t("dns.col.verdict"), field: "Verdict", flex: 1,
    cellClass: (p) => verdictClassByRisk(p.data?.RiskByte ?? 0) },
];

function verdictClassByRisk(r: number): string {
  return ["st-good", "st-fair", "risk-low", "risk-high"][r] ?? "";
}

let rootEl: HTMLElement | null = null;

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("dns.title")}</h1>
      <div class="sub">${t("dns.sub")}</div>
    </div>
    <div class="grid2">
      <div class="card"><h2>${t("dns.servers")}</h2><div id="dns-servers" class="chip-list"></div></div>
      <div class="card"><h2>${t("dns.proxy")}</h2>
        <div class="kv" style="grid-template-columns: 1fr; gap: 6px;">
          <div><span class="k">${t("dns.sysproxy")}</span>
            <div class="v" id="dns-proxy" style="font-family: var(--mono); font-size: 12px; margin-top: 2px; word-break: break-all;">—</div></div>
          <div><span class="k">${t("dns.winhttp")}</span>
            <div class="v" id="dns-winhttp" style="font-family: var(--mono); font-size: 12px; margin-top: 2px; word-break: break-all;">—</div></div>
        </div>
      </div>
    </div>
    <div class="card">
      <h2>${t("dns.stream")}</h2>
      <div class="ag-theme-nw" id="dns-stream" style="height: 300px;"></div>
    </div>
    <div class="card">
      <h2>${t("dns.doh")}</h2>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
        <select id="doh-provider" style="min-width: 220px;"></select>
        <input type="text" id="doh-probes" style="flex:1; min-width: 260px;" />
        <button class="btn primary" id="doh-run">${t("dns.doh.run")}</button>
      </div>
      <div class="hint">${t("dns.doh.hint")}</div>
      <div class="hint" id="doh-status" style="margin-top:6px;">—</div>
      <div class="ag-theme-nw" id="doh-grid" style="height: 220px; margin-top: 8px;"></div>
    </div>`;
  rootEl = root;
  streamApi = createGrid(document.getElementById("dns-stream")!, {
    columnDefs: streamCols, rowData: [],
    defaultColDef: { sortable: false, resizable: true },
    suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0, getRowId: (p) => String(p.data.__i),
  } as GridOptions);
  dohApi = createGrid(document.getElementById("doh-grid")!, {
    columnDefs: dohCols, rowData: [],
    defaultColDef: { sortable: false, resizable: true },
    getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
    suppressCellFocus: true,
  } as GridOptions);

  const sel = document.getElementById("doh-provider") as HTMLSelectElement;
  const sources: { i: number; label: string; group: string }[] = [
    { i: -1, label: t("dns.doh.auto"), group: "" },
    { i: 0, label: "AliDNS 223.5.5.5", group: "cn" },
    { i: 1, label: "DNSPod doh.pub", group: "cn" },
    { i: 2, label: "DNSPod 120.53.53.53", group: "cn" },
    { i: 3, label: "AliDNS 223.6.6.6", group: "cn" },
    { i: 4, label: "Cloudflare 1.1.1.1", group: "global" },
    { i: 5, label: "Google Public DNS", group: "global" },
    { i: 6, label: "Quad9 9.9.9.9", group: "global" },
  ];
  let lastGroup = "";
  sources.forEach((s) => {
    if (s.group && s.group !== lastGroup) {
      const og = document.createElement("optgroup");
      og.label = s.group === "cn" ? (lang() === "zh" ? "国内源" : "China sources") : (lang() === "zh" ? "海外源" : "Global sources");
      og.id = `g-${s.group}`;
      sel.appendChild(og);
      lastGroup = s.group;
    }
    const opt = document.createElement("option");
    opt.value = String(s.i);
    opt.textContent = s.label;
    (s.group ? sel.querySelector(`#g-${s.group}`) : sel)!.appendChild(opt);
  });
  sel.value = "-1";
  sel.onchange = () => {
    const idx = parseInt(sel.value, 10);
    window.__dohProvider = idx;
  };

  (document.getElementById("doh-run") as HTMLButtonElement).onclick = () => {
    const probes = (document.getElementById("doh-probes") as HTMLInputElement).value;
    if (window.__dohProvider !== undefined) {
      // 先同步 provider（setDohProvider 走独立命令）
      // C# 侧 DohProviderIndex 由两次命令依序应用
    }
    import("../api").then(({ sendCommand }) => {
      sendCommand("setDohProvider", { index: window.__dohProvider ?? -1 });
      sendCommand("setDohProbes", { domains: probes });
      sendCommand("runDoh");
    });
  };
}

declare global {
  interface Window { __dohProvider?: number; }
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  // DNS 服务器：逐个 chip 渲染，长地址不挤压
  const chips = document.getElementById("dns-servers")!;
  const list = (s.dns.servers as unknown as string[]) ?? [];
  const chipHtml = list.length
    ? list.map((ip) => `<span class="ip-chip">${escapeHtml(ip)}</span>`).join("")
    : `<span class="text-dim">—</span>`;
  if (chips.innerHTML !== chipHtml) chips.innerHTML = chipHtml;

  const proxyEl = document.getElementById("dns-proxy")!;
  if (proxyEl.textContent !== s.dns.proxy) proxyEl.textContent = s.dns.proxy;
  const winEl = document.getElementById("dns-winhttp")!;
  if (winEl.textContent !== s.dns.winhttp) winEl.textContent = s.dns.winhttp;

  streamApi?.setGridOption("rowData", s.dns.stream.map((r, i) => ({ ...r, __i: i })));
  dohApi?.setGridOption("rowData", s.dns.doh.results);

  const statusEl = document.getElementById("doh-status")!;
  if (statusEl.textContent !== s.dns.doh.status) statusEl.textContent = s.dns.doh.status;
  const probesEl = document.getElementById("doh-probes") as HTMLInputElement;
  if (document.activeElement !== probesEl && probesEl.value !== s.dns.doh.probes) probesEl.value = s.dns.doh.probes;
  const runBtn = document.getElementById("doh-run") as HTMLButtonElement;
  runBtn.disabled = s.dns.doh.running;
}

function escapeHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
