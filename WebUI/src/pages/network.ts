import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot } from "../api";

ModuleRegistry.registerModules([AllCommunityModule]);

let adaptersApi: GridApi | null = null;
let historyApi: GridApi | null = null;
let rootEl: HTMLElement | null = null;

const adapterCols: ColDef[] = [
  { headerName: "网卡", field: "Name", width: 180 },
  { headerName: "状态", field: "Status", width: 76,
    cellClass: (p) => (p.value === "up" ? "text-green" : "text-dim"),
    valueFormatter: (p) => (p.value === "up" ? "已连接" : "断开") },
  { headerName: "IP 地址", field: "IpsText", flex: 1.2,
    cellRenderer: monoCell },
  { headerName: "网关", field: "GwText", flex: 0.8, cellRenderer: monoCell },
  { headerName: "DNS", field: "DnsText", flex: 1.2, cellRenderer: monoCell },
];

const historyCols: ColDef[] = [
  { headerName: "时间", field: "TimeText", width: 130 },
  { headerName: "项目", field: "What", width: 150 },
  { headerName: "旧值", field: "Old", flex: 1, cellRenderer: monoCell },
  { headerName: "新值", field: "New", flex: 1, cellRenderer: monoCell },
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
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.Name),
};

const historyOptions: GridOptions = {
  columnDefs: historyCols,
  rowData: [],
  defaultColDef: { sortable: false, resizable: true },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  rowClassRules: { "risk-low": (p) => p.data?.Serious },
  getRowId: (p) => String(p.data.__i),
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>网络配置</h1>
      <div class="sub">DNS / 代理 / hosts 的变更检测（零流量），变更即告警</div>
    </div>
    <div class="ag-theme-nw" id="net-adapter-grid" style="height: 200px;"></div>
    <div class="card" style="margin-top:12px;">
      <h2>配置变更历史</h2>
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
