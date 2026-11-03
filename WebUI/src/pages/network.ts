import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";
import { t, agLocale } from "../i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

let adaptersApi: GridApi | null = null;
let historyApi: GridApi | null = null;
let rootEl: HTMLElement | null = null;

const adapterCols: ColDef[] = [
  { headerName: t("net.col.adapter"), headerValueGetter: () => t("net.col.adapter"), field: "Name", width: 180 },
  { headerName: t("net.col.status"), headerValueGetter: () => t("net.col.status"), field: "Status", width: 76,
    cellClass: (p) => (p.value === "up" ? "text-green" : "text-dim"),
    valueFormatter: (p) => (p.value === "up" ? t("net.up") : t("net.down")) },
  { headerName: t("net.col.ips"), headerValueGetter: () => t("net.col.ips"), field: "IpsText", flex: 1.2,
    cellRenderer: monoCell },
  { headerName: t("net.col.gw"), headerValueGetter: () => t("net.col.gw"), field: "GwText", flex: 0.8, cellRenderer: monoCell },
  { headerName: t("net.col.dns"), headerValueGetter: () => t("net.col.dns"), field: "DnsText", flex: 1.2, cellRenderer: monoCell },
];

const historyCols: ColDef[] = [
  { headerName: t("net.col.time"), headerValueGetter: () => t("net.col.time"), field: "TimeText", width: 130 },
  { headerName: t("net.col.what"), headerValueGetter: () => t("net.col.what"), field: "WhatText", width: 170,
    cellClass: (p) => (p.data?.Serious ? "risk-low" : "") },
  { headerName: t("net.col.old"), headerValueGetter: () => t("net.col.old"), field: "OldText", flex: 1, cellRenderer: monoCell },
  { headerName: t("net.col.new"), headerValueGetter: () => t("net.col.new"), field: "NewText", flex: 1, cellRenderer: monoCell },
];

// 语言无关原始值 → 当前语言文本（与 C# FormatValue 同规则）
function fmtValue(whatKey: string, raw: string): string {
  if (whatKey === "cfg.what.proxy" || whatKey === "cfg.what.winhttp") {
    if (raw === "off" || raw === "direct" || raw === "") return t("cfg.proxyOff");
    if (raw.startsWith("on:")) return t("cfg.proxyOn", raw.slice(3));
    return raw;
  }
  if (whatKey === "cfg.what.hosts") return t("cfg.entriesCount", raw);
  return raw === "" ? t("cfg.none") : raw;
}

function monoCell(p: { value: string }): HTMLElement {
  const s = document.createElement("span");
  s.textContent = p.value ?? "";
  s.style.fontFamily = "var(--mono)";
  s.style.fontSize = "11.5px";
  s.style.color = "var(--dim)";
  return s;
}

const adaptersOptions: GridOptions = {
  columnDefs: adapterCols,
  rowData: [],
  autoSizeStrategy: { type: 'fitGridWidth' },
  defaultColDef: { sortable: false, resizable: true },
  getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.Name),
};

const historyOptions: GridOptions = {
  columnDefs: historyCols,
  rowData: [],
  defaultColDef: { sortable: false, resizable: true },
  getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  rowClassRules: { "risk-low": (p) => p.data?.Serious },
  getRowId: (p) => String(p.data.__i),
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("net.title")}</h1>
      <div class="sub">${t("net.sub")}</div>
    </div>
    <div class="ag-theme-nw" id="net-adapter-grid" style="height: 200px;"></div>
    <div class="card" style="margin-top:12px;">
      <h2>${t("net.history")}</h2>
      <div class="ag-theme-nw" id="net-history-grid" style="height: calc(100vh - 420px);"></div>
    </div>`;
  rootEl = root;
  adaptersApi = createGrid(document.getElementById("net-adapter-grid")!, adaptersOptions);
  historyApi = createGrid(document.getElementById("net-history-grid")!, historyOptions);
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  adaptersApi?.setGridOption("rowData", s.network.adapters as unknown as Record<string, unknown>[]);
  // WhatKey+raw → 按当前语言渲染（语言切换后历史条目跟随）
  historyApi?.setGridOption("rowData", s.network.configHistory.map((c, i) => ({
    __i: i, TimeText: c.TimeText, Serious: c.Serious,
    WhatText: t(c.WhatKey), OldText: fmtValue(c.WhatKey, c.OldRaw), NewText: fmtValue(c.WhatKey, c.NewRaw),
  })) as unknown as Record<string, unknown>[]);
}
