import { createGrid, GridOptions, ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";
import { t, agLocale, lang } from "../i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

let streamApi: GridApi | null = null;
let dohApi: GridApi | null = null;
type GridApi = ReturnType<typeof createGrid>;

const streamCols: ColDef[] = [
  { headerName: t("dns.col.time"), field: "time", width: 76 },
  { headerName: t("dns.col.process"), field: "process", width: 150 },
  { headerName: t("dns.col.domain"), field: "domain", flex: 1.2, cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "12px";
      return s;
    } },
  { headerName: t("dns.col.ips"), field: "ips", flex: 1.2, cellClass: "text-dim" },
  { headerName: t("dns.col.note"), field: "alertText", flex: 1.3,
    cellClass: (p) => (p.value ? "risk-low" : "text-dim"),
    valueFormatter: (p) => (p.value ? String(p.value) : "—") },
];

const dohCols: ColDef[] = [
  { headerName: t("dns.col.domain"), field: "Domain", width: 170 },
  { headerName: t("dns.col.local"), field: "LocalIps", flex: 1.1 },
  { headerName: t("dns.col.ref"), field: "RefIps", flex: 1.1, cellClass: "text-dim" },
  { headerName: t("dns.col.verdict"), field: "Verdict", flex: 1,
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
      <div class="card"><h2>${t("dns.servers")}</h2><div class="kv"><span class="v" id="dns-servers" style="font-size:12px;">读取中…</span></div></div>
      <div class="card"><h2>${t("dns.proxy")}</h2><div class="kv"><span class="v" id="dns-proxy" style="font-size:12px;">读取中…</span></div></div>
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
    localeText: agLocale(),
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
  (document.getElementById("dns-servers")!).textContent = s.dns.servers;
  (document.getElementById("dns-proxy")!).textContent = `${s.dns.proxy}　|　${s.dns.winhttp}`;
  const hostsEl = document.getElementById("dns-proxy");
  if (hostsEl && s.dns.hosts) hostsEl.title = s.dns.hosts;

  streamApi?.setGridOption("rowData", s.dns.stream.map((r, i) => ({ ...r, __i: i })));
  dohApi?.setGridOption("rowData", s.dns.doh.results);

  const statusEl = document.getElementById("doh-status")!;
  if (statusEl.textContent !== s.dns.doh.status) statusEl.textContent = s.dns.doh.status;
  const probesEl = document.getElementById("doh-probes") as HTMLInputElement;
  if (document.activeElement !== probesEl && probesEl.value !== s.dns.doh.probes) probesEl.value = s.dns.doh.probes;
  const runBtn = document.getElementById("doh-run") as HTMLButtonElement;
  runBtn.disabled = s.dns.doh.running;
}
