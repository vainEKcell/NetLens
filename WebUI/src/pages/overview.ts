import { createGrid, GridOptions, ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot, OverviewRow, fmtSpeed, fmtBytes, riskClass, sendCommand } from "../api";
import { t, agLocale } from "../i18n";
import "./../styles.css";

ModuleRegistry.registerModules([AllCommunityModule]);

let api: GridApi | null = null;
type GridApi = ReturnType<typeof createGrid>;
let selectedPidEl: HTMLElement;
let detailBody: HTMLElement;

const columnDefs: ColDef[] = [
  { headerName: t("ov.col.pid"), headerValueGetter: () => t("ov.col.pid"), field: "pid", width: 84 },
  { headerName: t("ov.col.name"), headerValueGetter: () => t("ov.col.name"), field: "name", flex: 1.7, minWidth: 130, cellRenderer: nameCell },
  { headerName: t("ov.col.risk"), headerValueGetter: () => t("ov.col.risk"), field: "risk", width: 86,
    cellClass: (p) => riskClass[p.value as number] ?? "",
    valueFormatter: (p) => t(`ov.risk.${p.value}`) },
  { headerName: t("ov.col.down"), headerValueGetter: () => t("ov.col.down"), field: "down", width: 104, type: "rightAligned",
    valueFormatter: (p) => fmtSpeed(p.value as number), cellClass: "text-blue", sort: "desc" },
  { headerName: t("ov.col.up"), headerValueGetter: () => t("ov.col.up"), field: "up", width: 104, type: "rightAligned",
    valueFormatter: (p) => fmtSpeed(p.value as number), cellClass: "text-green" },
  { headerName: t("ov.col.downTotal"), headerValueGetter: () => t("ov.col.downTotal"), field: "downTotal", width: 100, type: "rightAligned",
    valueFormatter: (p) => fmtBytes(p.value as number) },
  { headerName: t("ov.col.upTotal"), headerValueGetter: () => t("ov.col.upTotal"), field: "upTotal", width: 100, type: "rightAligned",
    valueFormatter: (p) => fmtBytes(p.value as number) },
  { headerName: t("ov.col.conns"), headerValueGetter: () => t("ov.col.conns"), field: "conns", width: 76, type: "rightAligned" },
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
  getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
  rowSelection: { mode: "singleRow", checkboxes: false },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.pid),
  onRowClicked: (e) => {
    const row = e.data as OverviewRow | undefined;
    if (row) sendCommand("select", { pid: row.pid });
  },
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("ov.title")}</h1>
      <div class="sub">${t("ov.sub")}</div>
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
  detailBody.innerHTML = `<div class="empty">${t("ov.detail.empty")}</div>`;
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
          <div>${escapeHtml(e.Statement)}${e.Weight ? ` <span class="basis">（${t("ov.weight")} ${e.Weight}）</span>` : ""}</div>
          ${e.Basis ? `<div class="basis">${t("ov.basis")}：${escapeHtml(e.Basis)}</div>` : ""}
        </div>`).join("")
    : `<div class="basis">${t("ov.detail.noVerdict")}</div>`;

  detailBody.innerHTML = `
    <h2>${t("ov.detail.title")}</h2>
    <div class="big" style="margin-bottom: 6px;">${escapeHtml(d.name)} <span class="unit">PID ${d.pid}</span></div>
    ${v ? `<div class="st-${verdictClass(v.riskByte)}" style="margin-bottom: 8px;">${verdictText(v.riskByte)}</div>` : ""}
    <div class="kv" style="margin-bottom: 10px;">
      <span class="k">${t("ov.detail.path")}</span><span class="v path">${escapeHtml(d.path ?? "—")}</span>
      <span class="k">${t("ov.detail.vendor")}</span><span class="v">${escapeHtml(d.vendor ?? "—")}</span>
      <span class="k">${t("ov.detail.signature")}</span><span class="v">${escapeHtml(sigText)}</span>
    </div>
    <h2>${t("ov.detail.verdict")}</h2>
    ${evHtml}
    <h2>${t("ov.detail.services")}（${d.services.length}）</h2>
    <div class="basis" style="font-size:11.5px; line-height:1.6;">${d.services.length
      ? escapeHtml(d.services.map((x) => x.displayName || x.name).join("、"))
      : t("ov.detail.noServices")}</div>
    <h2>${t("ov.detail.conns")}（${d.conns.length}）</h2>
    ${d.conns.length
      ? d.conns.map((c) => `<div class="conn">[${c.Proto}] ${escapeHtml(c.Remote)} · ${escapeHtml(c.State)}</div>`).join("")
      : `<div class="basis">${t("ov.detail.noConns")}</div>`}
    <div style="display:flex; gap:8px; margin-top: 12px;">
      <button class="btn" id="d-kill">${t("ov.detail.kill")}</button>
    </div>`;
  (detailBody.querySelector("#d-kill") as HTMLButtonElement).onclick = () => sendCommand("kill", { pid: d.pid });
}

function verdictText(risk: number): string {
  return t(`ov.vd.${risk}`);
}
function verdictClass(risk: number): string {
  return ["excellent", "fair", "fair", "poor"][risk] ?? "";
}

function escapeHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
