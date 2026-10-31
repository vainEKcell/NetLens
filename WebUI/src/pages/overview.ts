import { createGrid, GridOptions, ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot, OverviewRow, fmtSpeed, fmtBytes, riskNames, riskClass, sendCommand } from "../api";
import "./../styles.css";

ModuleRegistry.registerModules([AllCommunityModule]);

let api: GridApi | null = null;
type GridApi = ReturnType<typeof createGrid>;
let selectedPidEl: HTMLElement;
let detailBody: HTMLElement;

const columnDefs: ColDef[] = [
  { headerName: "PID", field: "pid", width: 84 },
  { headerName: "进程", field: "name", flex: 1.7, minWidth: 130, cellRenderer: nameCell },
  { headerName: "风险", field: "risk", width: 86,
    cellClass: (p) => riskClass[p.value as number] ?? "",
    valueFormatter: (p) => riskNames[p.value as number] ?? "" },
  { headerName: "↓ 速度", field: "down", width: 104, type: "rightAligned",
    valueFormatter: (p) => fmtSpeed(p.value as number), cellClass: "text-blue", sort: "desc" },
  { headerName: "↑ 速度", field: "up", width: 104, type: "rightAligned",
    valueFormatter: (p) => fmtSpeed(p.value as number), cellClass: "text-green" },
  { headerName: "↓ 累计", field: "downTotal", width: 100, type: "rightAligned",
    valueFormatter: (p) => fmtBytes(p.value as number) },
  { headerName: "↑ 累计", field: "upTotal", width: 100, type: "rightAligned",
    valueFormatter: (p) => fmtBytes(p.value as number) },
  { headerName: "连接", field: "conns", width: 76, type: "rightAligned" },
];

function nameCell(params: { value: string; data?: OverviewRow }): HTMLElement {
  const span = document.createElement("span");
  span.textContent = params.value;
  if (params.data && params.data.risk >= 2) span.style.fontWeight = "600";
  return span;
}

const gridOptions: GridOptions = {
  columnDefs,
  rowData: [],
  defaultColDef: { sortable: true, resizable: true },
  rowSelection: { mode: "singleRow", checkboxes: false },
  suppressCellFocus: true,
  getRowId: (p) => String(p.data.pid),
  onRowClicked: (e) => {
    const row = e.data as OverviewRow | undefined;
    if (row) sendCommand("select", { pid: row.pid });
  },
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>总览</h1>
      <div class="sub">每进程实时流量 · 点击行查看详情与处置</div>
    </div>
    <div id="overview-wrap">
      <div class="ag-theme-nw" id="ov-grid" style="height: calc(100vh - 210px);"></div>
      <div class="card" id="detail-panel"></div>
    </div>`;
  api = createGrid(document.getElementById("ov-grid")!, gridOptions);
  detailBody = document.getElementById("detail-panel")!;
  selectedPidEl = detailBody;
  renderDetailEmpty();
}

function renderDetailEmpty(): void {
  detailBody.innerHTML = `<div class="empty">点击左侧进程行<br/>查看详情、判定与处置</div>`;
}

export function onSnapshot(s: Snapshot): void {
  if (!api) return;
  api.setGridOption("rowData", s.overview.rows);
  renderDetail(s);
}

function renderDetail(s: Snapshot): void {
  const d = s.detail;
  if (!d) {
    if (selectedPidEl && detailBody.childElementCount <= 1) renderDetailEmpty();
    return;
  }
  const sigText = d.signature ?? "未检测";
  const v = d.verdict;
  const evHtml = v && v.evidence.length
    ? v.evidence.map((e) => `
        <div class="evidence-item">
          <div>${escapeHtml(e.Statement)}${e.Weight ? ` <span class="basis">（权重 ${e.Weight}）</span>` : ""}</div>
          ${e.Basis ? `<div class="basis">依据：${escapeHtml(e.Basis)}</div>` : ""}
        </div>`).join("")
    : `<div class="basis">暂无判定记录</div>`;

  detailBody.innerHTML = `
    <h2>进程详情</h2>
    <div class="big" style="margin-bottom: 6px;">${escapeHtml(d.name)} <span class="unit">PID ${d.pid}</span></div>
    ${v ? `<div class="st-${verdictClass(v.riskByte)}" style="margin-bottom: 8px;">${verdictText(v.riskByte)}</div>` : ""}
    <div class="kv" style="margin-bottom: 10px;">
      <span class="k">路径</span><span class="v path">${escapeHtml(d.path ?? "—")}</span>
      <span class="k">厂商</span><span class="v">${escapeHtml(d.vendor ?? "—")}</span>
      <span class="k">签名</span><span class="v">${escapeHtml(sigText)}</span>
    </div>
    <h2>判定与证据</h2>
    ${evHtml}
    <h2>承载服务（${d.services.length}）</h2>
    <div class="basis" style="font-size:11.5px; line-height:1.6;">${d.services.length
      ? escapeHtml(d.services.map((x) => x.displayName || x.name).join("、"))
      : "无"}</div>
    <h2>当前连接（${d.conns.length}）</h2>
    ${d.conns.length
      ? d.conns.map((c) => `<div class="conn">[${c.Proto}] ${escapeHtml(c.Remote)} · ${escapeHtml(c.State)}</div>`).join("")
      : `<div class="basis">无活动连接</div>`}
    <div style="display:flex; gap:8px; margin-top: 12px;">
      <button class="btn" id="d-kill">结束进程</button>
    </div>`;
  (detailBody.querySelector("#d-kill") as HTMLButtonElement).onclick = () => sendCommand("kill", { pid: d.pid });
}

function verdictText(risk: number): string {
  return ["正常", "提示（详见下方依据）", "关注（建议核查路径与厂商）", "可疑（建议处置）"][risk] ?? "";
}
function verdictClass(risk: number): string {
  return ["excellent", "fair", "fair", "poor"][risk] ?? "";
}

function escapeHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
