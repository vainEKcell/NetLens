// 全局主题化 tooltip：元素带 data-tip 属性即生效（替代原生 title 的方形浅色气泡）
let el: HTMLDivElement | null = null;

function ensure(): HTMLDivElement {
  if (!el) {
    el = document.createElement("div");
    el.className = "nw-tooltip";
    document.body.appendChild(el);
  }
  return el;
}

export function initTooltip(): void {
  document.addEventListener("mouseover", (e) => {
    const target = (e.target as HTMLElement).closest("[data-tip]") as HTMLElement | null;
    if (!target) return;
    const tip = ensure();
    tip.textContent = target.dataset.tip ?? "";
    tip.classList.add("show");
  });
  document.addEventListener("mousemove", (e) => {
    if (!el || !el.classList.contains("show")) return;
    const pad = 14;
    const x = Math.min(e.clientX + pad, window.innerWidth - el.offsetWidth - 8);
    const y = e.clientY + 18;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  });
  document.addEventListener("mouseout", (e) => {
    if ((e.target as HTMLElement).closest?.("[data-tip]")) el?.classList.remove("show");
  });
}
