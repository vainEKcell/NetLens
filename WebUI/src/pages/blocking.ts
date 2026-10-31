import { createGrid, GridOptions, ColDef, GridApi, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Snapshot, sendCommand } from "../api";

ModuleRegistry.registerModules([AllCommunityModule]);

let appsApi: GridApi | null = null;
let rootEl: HTMLElement | null = null;
let selectedPath = "";

const cols: ColDef[] = [
  { headerName: "程序", field: "DisplayName", width: 240 },
  { headerName: "路径", field: "Path", flex: 1.4,
    cellRenderer: (p: { value: string }) => {
      const s = document.createElement("span");
      s.textContent = p.value;
      s.style.fontFamily = "var(--mono)";
      s.style.fontSize = "11.5px";
      s.style.color = "var(--dim)";
      return s;
    } },
  { headerName: "规则", field: "RulesText", width: 90, type: "rightAligned" },
];

const gridOptions: GridOptions = {
  columnDefs: cols,
  rowData: [],
  defaultColDef: { sortable: true, resizable: true },
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
      <h1>拦截名单</h1>
      <div class="sub">防火墙按程序拦截（Windows 防火墙规则，可在系统防火墙或此处解除）</div>
    </div>
    <div class="card" style="padding: 10px 14px; display:flex; gap:10px; align-items:center;">
      <button class="btn" id="bl-unblock" disabled>解除选中程序的拦截</button>
      <button class="btn" id="bl-refresh">刷新名单</button>
      <span class="hint" style="margin:0;">在总览右键的处置也会写入此处；规则名带 NetWatch 前缀便于识别</span>
    </div>
    <div class="ag-theme-nw" id="bl-grid" style="height: calc(100vh - 380px);"></div>
    <div class="card" style="margin-top:12px;">
      <h2>允许名单（用户信任，优先于引擎判定）</h2>
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
    ? s.blocking.trusted.map((t) => `
        <div class="trusted-row">
          <span>${escapeHtml(t.DisplayName)}</span>
          <button class="btn" data-key="${escapeHtml(t.Key)}">移出</button>
        </div>`).join("")
    : "暂无允许名单项——在总览选中进程后使用「允许联网」加入";
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
