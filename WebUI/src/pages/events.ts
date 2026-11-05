import { createGrid, GridOptions, ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot, sendCommand } from "../api";
import { t, agLocale } from "../i18n";
import { mountSortControl } from "../sortctl";
import { show as showMenu } from "../menu";

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
  autoSizeStrategy: { type: 'fitGridWidth' },
  defaultColDef: { sortable: false, resizable: true },
  getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  getRowId: (p) => String(p.data.__i),
  onCellContextMenu: (e) => {
    const row = e.data as { pid: number; remote: string; domain: string } | undefined;
    if (!row) return;
    (e.event as MouseEvent | undefined)?.preventDefault();
    const items = [];
    if (row.remote || row.domain) {
      items.push({ label: t("ctx.ev.dns"), action: () => sendCommand("runDnsCheckForTarget", { remoteIp: row.remote, domain: row.domain }) });
    }
    if (row.pid > 0) {
      items.push({ label: t("ctx.ev.view"), action: () => sendCommand("select", { pid: row.pid }) });
      items.push({ label: t("ctx.ev.filter"), action: () => sendCommand("filterEventsByPid", { pid: row.pid }) });
    }
    if (items.length) items.push({ label: "", sep: true });
    if (row.remote) items.push({ label: t("ctx.ev.copyRemote"), action: () => navigator.clipboard.writeText(row.remote) });
    if (row.domain) items.push({ label: t("ctx.ev.copyDomain"), action: () => navigator.clipboard.writeText(row.domain) });
    const ev = e.event as MouseEvent | undefined;
    showMenu(ev?.clientX ?? 0, ev?.clientY ?? 0, items);
  },
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="card" style="padding: 10px 14px; display:flex; align-items:center; gap:10px;">
      <span id="ev-filter" class="hint" style="margin:0;"></span>
      <div style="flex:1;"></div>
      <button class="btn" id="ev-clear-filter" style="display:none;">${t("ev.reset")}</button>
    </div>
    <div class="grid-toolbar" id="ev-grid-toolbar">
      <div class="page-head">
        <h1>${t("ev.title")}</h1>
        <div class="sub">${t("ev.sub")}</div>
      </div>
    </div>
        <div class="ag-theme-nw" id="ev-grid" style="height: calc(100vh - 250px);"></div>`;
  rootEl = root;
  api = createGrid(document.getElementById("ev-grid")!, gridOptions);
  const toolbar = document.getElementById("ev-grid-toolbar") as HTMLElement;
  mountSortControl(toolbar, api, [
    { key: "__i", label: t("ev.col.time") },
    { key: "Process", label: t("ev.col.process") },
    { key: "BytesText", label: t("ev.col.bytes") },
  ], "__i", "desc");
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
