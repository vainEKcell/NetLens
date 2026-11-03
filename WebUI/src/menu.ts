// WebUI 右键菜单：基础处置项（任务管理器 / 结束 / 文件夹 / 拦截 / 复制）
import { sendCommand } from "./api";

export interface MenuItem {
  label: string;
  action?: () => void;
  danger?: boolean;
  sep?: boolean;
}

let menuEl: HTMLDivElement | null = null;

function ensure(): HTMLDivElement {
  if (!menuEl) {
    menuEl = document.createElement("div");
    menuEl.id = "nw-context-menu";
    document.body.appendChild(menuEl);
    document.addEventListener("click", () => hide());
    document.addEventListener("scroll", () => hide(), true);
    window.addEventListener("blur", () => hide());
  }
  return menuEl;
}

export function hide(): void {
  menuEl?.classList.remove("open");
}

/// 系统性修复：浏览器原生右键菜单（刷新/另存为/打印/检查）覆盖自定义菜单。
/// 全局接管 contextmenu：目标在表格数据区（.ag-row / [data-ctx]）内时阻止原生菜单；
/// 输入框等可编辑元素放行原生菜单。
export function initContextGuard(): void {
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable]")) return; // 可编辑区放行
    if (target.closest(".ag-row, [data-ctx]")) e.preventDefault();    // 数据区由各表自己弹自定义菜单
  });
}

export function show(x: number, y: number, items: MenuItem[]): void {
  const el = ensure();
  el.innerHTML = items
    .map((it) =>
      it.sep
        ? `<div class="ctx-sep"></div>`
        : `<div class="ctx-item${it.danger ? " danger" : ""}" data-i="${items.indexOf(it)}">${it.label}</div>`,
    )
    .join("");
  el.classList.add("open");
  const w = el.offsetWidth || 180;
  const h = el.offsetHeight || 100;
  el.style.left = `${Math.min(x, window.innerWidth - w - 6)}px`;
  el.style.top = `${Math.min(y, window.innerHeight - h - 6)}px`;
  el.querySelectorAll<HTMLElement>(".ctx-item").forEach((node) => {
    const idx = parseInt(node.dataset.i ?? "-1", 10);
    const it = items[idx];
    if (it?.action) node.addEventListener("click", () => it.action!());
  });
}
