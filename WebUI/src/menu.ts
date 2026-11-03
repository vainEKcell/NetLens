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
