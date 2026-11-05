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

/// 系统性修复：浏览器原生右键菜单（刷新/另存为/打印/检查）在桌面应用语境无实际用途，
/// 全局接管 contextmenu：可编辑元素（输入框等）放行原生菜单以保留粘贴/剪切；
/// 表格数据区由各表自己弹自定义处置菜单；其余区域一律静默阻止（不弹任何菜单）。
export function initContextGuard(): void {
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable]")) return; // 可编辑区放行
    e.preventDefault();                                               // 其余区域静默
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
