import { createGrid, GridOptions, ColDef } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { fmtSpeed, fmtBytes, onSnapshot, sendCommand, Snapshot } from "./api";
import "./styles.css";

ModuleRegistry.registerModules([AllCommunityModule]);

const riskNames = ["", "提示", "关注", "可疑"];
const riskClass = ["", "risk-low", "risk-medium", "risk-high"];

const columnDefs: ColDef[] = [
  { headerName: "PID", field: "pid", width: 90 },
  { headerName: "进程", field: "name", flex: 1.6, minWidth: 140 },
  {
    headerName: "风险", field: "risk", width: 90,
    cellClass: (p) => riskClass[p.value as number] ?? "",
    valueFormatter: (p) => riskNames[p.value as number] ?? "",
  },
  { headerName: "↓ 速度", field: "down", width: 110, type: "rightAligned",
    valueFormatter: (p) => fmtSpeed(p.value as number) },
  { headerName: "↑ 速度", field: "up", width: 110, type: "rightAligned",
    valueFormatter: (p) => fmtSpeed(p.value as number) },
  { headerName: "↓ 累计", field: "downTotal", width: 110, type: "rightAligned",
    valueFormatter: (p) => fmtBytes(p.value as number) },
  { headerName: "↑ 累计", field: "upTotal", width: 110, type: "rightAligned",
    valueFormatter: (p) => fmtBytes(p.value as number) },
  { headerName: "连接", field: "conns", width: 80, type: "rightAligned" },
];

const gridOptions: GridOptions = {
  columnDefs,
  rowData: [],
  defaultColDef: { sortable: true, resizable: true },
  rowSelection: { mode: "singleRow" },
  suppressCellFocus: true,
  getRowId: (p) => String(p.data.pid),
};

const gridApi = createGrid(document.getElementById("grid")!, gridOptions);

let paused = false;
document.getElementById("btnPause")!.addEventListener("click", () => {
  paused = !paused;
  (document.getElementById("btnPause") as HTMLButtonElement).textContent =
    paused ? "恢复监控" : "暂停监控";
  sendCommand(paused ? "pause" : "resume");
});

onSnapshot((s: Snapshot) => {
  document.getElementById("totals")!.textContent =
    `↑ ${fmtSpeed(s.totals.up)}　↓ ${fmtSpeed(s.totals.down)}`;
  gridApi.setGridOption("rowData", s.rows);
});
