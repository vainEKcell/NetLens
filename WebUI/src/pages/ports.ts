import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";
import { t, agLocale } from "../i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

let api: GridApi | null = null;
let rootEl: HTMLElement | null = null;

const cols: ColDef[] = [
  { headerName: t("port.col.proto"), headerValueGetter: () => t("port.col.proto"), field: "ProtoText", width: 70 },
  { headerName: t("port.col.port"), headerValueGetter: () => t("port.col.port"), field: "Port", width: 84, type: "rightAligned",
    cellClass: "text-blue", sort: "asc" },
  { headerName: t("port.col.bind"), headerValueGetter: () => t("port.col.bind"), field: "Bind", width: 160,
    cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "12px";
      return s;
    } },
  { headerName: t("port.col.bindText"), headerValueGetter: () => t("port.col.bindText"), field: "BindText", width: 116,
    cellClass: (p) => (String(p.value).includes("所有") || String(p.value).includes("任意") ? "risk-low" : "text-dim") },
  { headerName: t("port.col.pid"), headerValueGetter: () => t("port.col.pid"), field: "Pid", width: 80, type: "rightAligned" },
  { headerName: t("port.col.process"), headerValueGetter: () => t("port.col.process"), field: "Process", flex: 1 },
];

const gridOptions: GridOptions = {
  columnDefs: cols,
  rowData: [],
  defaultColDef: { sortable: true, resizable: true },
  getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => `${p.data.ProtoText}-${p.data.Port}-${p.data.Pid}`,
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("port.title")}</h1>
      <div class="sub">${t("port.sub")}</div>
    </div>
    <div class="ag-theme-nw" id="port-grid" style="height: calc(100vh - 210px);"></div>`;
  rootEl = root;
  api = createGrid(document.getElementById("port-grid")!, gridOptions);
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  api?.setGridOption("rowData", s.ports as unknown as Record<string, unknown>[]);
}
