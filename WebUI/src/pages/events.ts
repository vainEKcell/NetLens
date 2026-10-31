import { createGrid, GridOptions, ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot, sendCommand } from "../api";
import { t, agLocale } from "../i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

let api: GridApi | null = null;
type GridApi = ReturnType<typeof createGrid>;
let rootEl: HTMLElement | null = null;

const kindClass = (kind: string) => {
  if (kind.includes("拦截")) return "risk-high";
  if (kind.includes("告警") || kind.includes("提示")) return "risk-low";
  if (kind.includes("大额")) return "st-fair";
  return "text-dim";
};

const cols: ColDef[] = [
  { headerName: t("ev.col.time"), headerValueGetter: () => t("ev.col.time"), field: "time", width: 76 },
  { headerName: t("ev.col.kind"), headerValueGetter: () => t("ev.col.kind"), field: "kind", width: 108,
    cellClass: (p) => kindClass(String(p.value)) },
  { headerName: t("ev.col.process"), headerValueGetter: () => t("ev.col.process"), field: "process", width: 168 },
  { headerName: t("ev.col.detail"), headerValueGetter: () => t("ev.col.detail"), field: "detail", flex: 1.4,
    cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "11.5px";
      return s;
    } },
  { headerName: t("ev.col.bytes"), headerValueGetter: () => t("ev.col.bytes"), field: "bytes", width: 92, type: "rightAligned",
    valueFormatter: (p) => (p.value ? String(p.value) : "") },
];

const gridOptions: GridOptions = {
  columnDefs: cols,
  rowData: [],
  defaultColDef: { sortable: false, resizable: true },
  localeText: agLocale(),
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.__i),
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("ev.title")}</h1>
      <div class="sub">${t("ev.sub")}</div>
    </div>
    <div class="card" style="padding: 10px 14px; display:flex; align-items:center; gap:10px;">
      <span id="ev-filter" class="hint" style="margin:0;"></span>
      <div style="flex:1;"></div>
      <button class="btn" id="ev-clear-filter" style="display:none;">${t("ev.reset")}</button>
    </div>
    <div class="ag-theme-nw" id="ev-grid" style="height: calc(100vh - 250px);"></div>`;
  rootEl = root;
  api = createGrid(document.getElementById("ev-grid")!, gridOptions);
  (document.getElementById("ev-clear-filter") as HTMLButtonElement).onclick = () =>
    sendCommand("filterEventsByPid", { pid: 0 });
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  const fe = document.getElementById("ev-filter")!;
  const show = s.events.filterVisible;
  fe.textContent = show ? t("ev.filter.active", s.events.filterText) : t("ev.filter.hint");
  (document.getElementById("ev-clear-filter") as HTMLButtonElement).style.display = show ? "" : "none";
  api?.setGridOption("rowData", s.events.items.map((r, i) => ({ ...r, __i: i })));
}
