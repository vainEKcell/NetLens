import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot, sendCommand } from "../api";
import { t, agLocale } from "../i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

let appsApi: GridApi | null = null;
let rootEl: HTMLElement | null = null;
let selectedPath = "";

const cols: ColDef[] = [
  { headerName: t("bl.col.app"), headerValueGetter: () => t("bl.col.app"), field: "DisplayName", width: 240 },
  { headerName: t("bl.col.path"), headerValueGetter: () => t("bl.col.path"), field: "Path", flex: 1.4,
    cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "11.5px";
      s.style.color = "var(--dim)";
      return s;
    } },
  { headerName: t("bl.col.rules"), headerValueGetter: () => t("bl.col.rules"), field: "RulesText", width: 90, type: "rightAligned" },
];

const gridOptions: GridOptions = {
  columnDefs: cols,
  rowData: [],
  autoSizeStrategy: { type: 'fitGridWidth' },
  defaultColDef: { sortable: true, resizable: true },
  getLocaleText: (p: { key: string; defaultValue: string }) => { const l = agLocale(); return l[p.key] ?? p.defaultValue; },
  suppressCellFocus: true,
  cellFlashDuration: 0,
  cellFadeDuration: 0,
  rowSelection: { mode: "singleRow" },
  onSelectionChanged: (e) => {
    const sel = e.api.getSelectedRows()[0];
    selectedPath = sel?.Path ?? "";
    const btn = document.getElementById("bl-unblock") as HTMLButtonElement | null;
    if (btn) btn.disabled = !selectedPath;
  },
};

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("bl.title")}</h1>
      <div class="sub">${t("bl.sub")}</div>
    </div>
    <div class="card" style="padding: 10px 14px; display:flex; gap:10px; align-items:center;">
      <button class="btn" id="bl-unblock" disabled>${t("bl.unblock")}</button>
      <button class="btn" id="bl-refresh">${t("bl.refresh")}</button>
      <span class="hint" style="margin:0;">${t("bl.hint")}</span>
    </div>
    <div class="ag-theme-nw" id="bl-grid" style="height: calc(100vh - 380px);"></div>
    <div class="card" style="margin-top:12px;">
      <h2>${t("bl.trusted")}</h2>
      <div id="trusted-list" class="hint"></div>
    </div>`;
  rootEl = root;
  appsApi = createGrid(document.getElementById("bl-grid")!, gridOptions);
  (document.getElementById("bl-unblock") as HTMLButtonElement).onclick = () =>
    selectedPath && sendCommand("unblockApp", { path: selectedPath });
  (document.getElementById("bl-refresh") as HTMLButtonElement).onclick = () => sendCommand("refreshBlocked");
}

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  appsApi?.setGridOption("rowData", s.blocking.apps as unknown as Record<string, unknown>[]);
  const tl = document.getElementById("trusted-list")!;
  const html = s.blocking.trusted.length
    ? s.blocking.trusted.map((item) => `
        <div class="trusted-row">
          <span>${escapeHtml(item.DisplayName)}</span>
          <button class="btn" data-key="${escapeHtml(item.Key)}">${t("bl.remove")}</button>
        </div>`).join("")
    : t("bl.trusted.empty");
  if (tl.innerHTML !== html) {
    tl.innerHTML = html;
    tl.querySelectorAll("button[data-key]").forEach((b) =>
      b.addEventListener("click", () => sendCommand("removeTrusted", { key: (b as HTMLElement).dataset.key })));
  }
}

function escapeHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
