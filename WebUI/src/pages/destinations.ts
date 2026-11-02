import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";
import { t, agLocale } from "../i18n";
import { mountSortControl } from "../sortctl";

ModuleRegistry.registerModules([AllCommunityModule]);

let api: GridApi | null = null;
let rootEl: HTMLElement | null = null;

const cols: ColDef[] = [
  { headerName: t("dst.col.display"), headerValueGetter: () => t("dst.col.display"), field: "Display", flex: 1.6, minWidth: 180,
    cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "12px";
      return s;
    } },
  { headerName: t("dst.col.scope"), headerValueGetter: () => t("dst.col.scope"), field: "Scope", width: 84, cellClass: "text-dim" },
  { headerName: t("dst.col.up"), headerValueGetter: () => t("dst.col.up"), field: "UpText", width: 110, type: "rightAligned", cellClass: "text-green" },
  { headerName: t("dst.col.down"), headerValueGetter: () => t("dst.col.down"), field: "DownText", width: 110, type: "rightAligned", cellClass: "text-blue" },
  { headerName: t("dst.col.last"), headerValueGetter: () => t("dst.col.last"), field: "LastText", width: 100, type: "rightAligned", cellClass: "text-dim" },
  { headerName: t("dst.col.processes"), headerValueGetter: () => t("dst.col.processes"), field: "ProcessesText", flex: 1.2, cellClass: "text-dim" },
  { headerName: "", colId: "fill", flex: 1, minWidth: 24, sortable: false, suppressMovable: true, cellRenderer: () => "" },
];

const gridOptions: GridOptions = {
  columnDefs: cols,
  rowData: [],
  defaultColDef: { sortable: true, resizable: true },
  getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.Display),
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="grid-toolbar" id="dst-grid-toolbar">
      <div class="page-head">
        <h1>${t("dst.title")}</h1>
        <div class="sub">${t("dst.sub")}</div>
      </div>
    </div>
        <div class="ag-theme-nw" id="dst-grid" style="height: calc(100vh - 210px);"></div>`;
  rootEl = root;
  api = createGrid(document.getElementById("dst-grid")!, gridOptions);
  const toolbar = document.getElementById("dst-grid-toolbar") as HTMLElement;
  mountSortControl(toolbar, api, [
    { key: "DownBytes", label: t("dst.col.down") },
    { key: "UpBytes", label: t("dst.col.up") },
    { key: "Display", label: t("dst.col.display") },
  ], "DownBytes", "desc");
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  api?.setGridOption("rowData", s.destinations as unknown as Record<string, unknown>[]);
}
