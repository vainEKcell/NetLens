import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";

ModuleRegistry.registerModules([AllCommunityModule]);

let api: GridApi | null = null;
let rootEl: HTMLElement | null = null;

const cols: ColDef[] = [
  { headerName: "协议", field: "ProtoText", width: 70 },
  { headerName: "端口", field: "Port", width: 84, type: "rightAligned",
    cellClass: "text-blue", sort: "asc" },
  { headerName: "绑定地址", field: "Bind", width: 160,
    cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "12px";
      return s;
    } },
  { headerName: "暴露面", field: "BindText", width: 116,
    cellClass: (p) => (String(p.value).includes("所有") || String(p.value).includes("任意") ? "risk-low" : "text-dim") },
  { headerName: "PID", field: "Pid", width: 80, type: "rightAligned" },
  { headerName: "进程", field: "Process", flex: 1 },
];

const gridOptions: GridOptions = {
  columnDefs: cols,
  rowData: [],
  defaultColDef: { sortable: true, resizable: true },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => `${p.data.ProtoText}-${p.data.Port}-${p.data.Pid}`,
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>监听端口</h1>
      <div class="sub">本机监听端口与对外暴露面（所有地址 = 可被局域网/公网访问）</div>
    </div>
    <div class="ag-theme-nw" id="port-grid" style="height: calc(100vh - 210px);"></div>`;
  rootEl = root;
  api = createGrid(document.getElementById("port-grid")!, gridOptions);
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  api?.setGridOption("rowData", s.ports as unknown as Record<string, unknown>[]);
}
