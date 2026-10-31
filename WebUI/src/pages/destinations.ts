import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";

ModuleRegistry.registerModules([AllCommunityModule]);

let api: GridApi | null = null;
let rootEl: HTMLElement | null = null;

const cols: ColDef[] = [
  { headerName: "目的地", field: "Display", flex: 1.6, minWidth: 180,
    cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "12px";
      return s;
    } },
  { headerName: "范围", field: "Scope", width: 84, cellClass: "text-dim" },
  { headerName: "↑ 累计", field: "UpText", width: 110, type: "rightAligned", cellClass: "text-green" },
  { headerName: "↓ 累计", field: "DownText", width: 110, type: "rightAligned", cellClass: "text-blue" },
  { headerName: "最近活动", field: "LastText", width: 100, type: "rightAligned", cellClass: "text-dim" },
  { headerName: "涉及进程", field: "ProcessesText", flex: 1.2, cellClass: "text-dim" },
];

const gridOptions: GridOptions = {
  columnDefs: cols,
  rowData: [],
  defaultColDef: { sortable: true, resizable: true },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.Display),
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>目的地排行</h1>
      <div class="sub">按远端地址聚合的会话累计流量（域名优先显示）</div>
    </div>
    <div class="ag-theme-nw" id="dst-grid" style="height: calc(100vh - 210px);"></div>`;
  rootEl = root;
  api = createGrid(document.getElementById("dst-grid")!, gridOptions);
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  api?.setGridOption("rowData", s.destinations as unknown as Record<string, unknown>[]);
}
