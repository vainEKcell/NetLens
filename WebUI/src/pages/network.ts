import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";
import { t, agLocale } from "../i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

let adaptersApi: GridApi | null = null;
let historyApi: GridApi | null = null;
let rootEl: HTMLElement | null = null;

const adapterCols: ColDef[] = [
  { headerName: t("net.col.adapter"), field: "Name", width: 180 },
  { headerName: t("net.col.status"), field: "Status", width: 76,
    cellClass: (p) => (p.value === "up" ? "text-green" : "text-dim"),
    valueFormatter: (p) => (p.value === "up" ? t("net.up") : t("net.down")) },
  { headerName: t("net.col.ips"), field: "IpsText", flex: 1.2,
    cellRenderer: monoCell },
  { headerName: t("net.col.gw"), field: "GwText", flex: 0.8, cellRenderer: monoCell },
  { headerName: t("net.col.dns"), field: "DnsText", flex: 1.2, cellRenderer: monoCell },
];

const historyCols: ColDef[] = [
  { headerName: t("net.col.time"), field: "TimeText", width: 130 },
  { headerName: t("net.col.what"), field: "What", width: 150 },
  { headerName: t("net.col.old"), field: "Old", flex: 1, cellRenderer: monoCell },
  { headerName: t("net.col.new"), field: "New", flex: 1, cellRenderer: monoCell },
];

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
  defaultColDef: { sortable: false, resizable: true },
  localeText: agLocale(),
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.Name),
};

const historyOptions: GridOptions = {
  columnDefs: historyCols,
  rowData: [],
  defaultColDef: { sortable: false, resizable: true },
  localeText: agLocale(),
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
  historyApi?.setGridOption("rowData", s.network.configHistory.map((c, i) => ({ ...c, __i: i })) as unknown as Record<string, unknown>[]);
}
