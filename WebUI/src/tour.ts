// 分页交互教程：每个功能页一组气泡步骤（聚光真实控件），完成后返回「使用指南」；
// 首次启动仅一条 logo 小提示（非模态）。教程引擎支持步骤进入/离开动作（如自动打开详情、弹出右键菜单演示）。
import { t } from "./i18n";
import { hide as hideContextMenu } from "./menu";

type TourStep = {
  selector?: string;   // 聚光目标（缺省仅气泡）
  colId?: string;      // AG Grid 列聚光模式：竖条框住整列（表头至表尾）
  titleKey: string;
  textKey: string;
  onEnter?: () => void; // 进入步骤动作（如打开详情覆盖层、弹出右键菜单演示）
  onExit?: () => void;  // 离开步骤动作
};

const PAGE_TOURS: Record<string, TourStep[]> = {
  overview: [
    { selector: "#page-overview .ag-root-wrapper", titleKey: "tour.ov.table", textKey: "tour.ov.table.text" },
    { selector: ".ag-header-cell[col-id='risk']", colId: "risk", titleKey: "tour.ov.verdict", textKey: "tour.ov.verdict.text" },
    {
      selector: ".nw-context-menu", titleKey: "tour.ov.menu", textKey: "tour.ov.menu.text",
      onEnter: () => document.querySelector("#page-overview .ag-row")?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 500, clientY: 320 })),
      onExit: () => hideContextMenu(),
    },
    {
      selector: "#detail-overlay", titleKey: "tour.ov.detail", textKey: "tour.ov.detail.text",
      onEnter: () => document.querySelector<HTMLElement>("#page-overview .ag-row")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
      onExit: () => (document.getElementById("detail-overlay") as HTMLElement)?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    },
  ],
  destinations: [
    { selector: "#page-destinations .ag-root-wrapper", titleKey: "tour.dest.table", textKey: "tour.dest.table.text" },
  ],
  dns: [
    { selector: "#page-dns .card", titleKey: "tour.dns.check", textKey: "tour.dns.check.text" },
    { selector: "#page-dns .ag-root-wrapper", titleKey: "tour.dns.stream", textKey: "tour.dns.stream.text" },
  ],
  ports: [
    { selector: "#page-ports .ag-root-wrapper", titleKey: "tour.ports.table", textKey: "tour.ports.table.text" },
  ],
  events: [
    { selector: "#page-events .ag-root-wrapper", titleKey: "tour.events.table", textKey: "tour.events.table.text" },
  ],
  blocking: [
    { selector: "#page-blocking .ag-root-wrapper", titleKey: "tour.blocking.list", textKey: "tour.blocking.list.text" },
  ],
  network: [
    { selector: "#page-network .card", titleKey: "tour.net.state", textKey: "tour.net.state.text" },
    { selector: "#page-network .ag-root-wrapper", titleKey: "tour.net.history", textKey: "tour.net.history.text" },
  ],
  netcheck: [
    { selector: "#page-netcheck .card", titleKey: "tour.nc.run", textKey: "tour.nc.run.text" },
  ],
};

const TIP_KEY = "nl-tip-logo";

export function logoTipDone(): boolean {
  try { return localStorage.getItem(TIP_KEY) === "1"; } catch { return true; }
}

function markTipDone(): void {
  try { localStorage.setItem(TIP_KEY, "1"); } catch { /* 忽略 */ }
}

export function maybeShowLogoTip(): void {
  if (logoTipDone()) return;
  window.setTimeout(showLogoTip, 1600);
}

let tipEl: HTMLDivElement | null = null;

function dismissTip(): void {
  markTipDone();
  tipEl?.remove();
  tipEl = null;
}

function showLogoTip(): void {
  if (logoTipDone() || tipEl) return;
  const anchor = document.getElementById("nav-toggle");
  if (!anchor) return;

  tipEl = document.createElement("div");
  tipEl.className = "logo-tip";
  tipEl.innerHTML = `
    <div class="logo-tip-text">${t("tour.logo.tip")}</div>
    <button class="logo-tip-close" title="知道了">✕</button>`;
  document.body.appendChild(tipEl);

  const r = anchor.getBoundingClientRect();
  const el = tipEl;
  el.style.left = `${Math.max(10, r.left - 4)}px`;
  el.style.top = `${r.bottom + 10}px`;

  const close = () => dismissTip();
  el.querySelector(".logo-tip-close")!.addEventListener("click", close);
  anchor.addEventListener("click", close, { once: true });
  window.setTimeout(close, 10000);
}

// ---------- 分页教程引擎 ----------
let root: HTMLDivElement | null = null;
let pageId = "";
let stepIndex = 0;

export function startPageTour(id: string): boolean {
  const group = PAGE_TOURS[id];
  if (!group || group.length === 0) return false;
  pageId = id;
  stepIndex = 0;
  if (location.hash !== `#/${id}`) location.hash = `#/${id}`; // 切到目标真实页面
  render();
  return true;
}

function closeTour(): void {
  const cur = PAGE_TOURS[pageId];
  const step = cur?.[stepIndex];
  try { step?.onExit?.(); } catch { /* 演示动作失败不阻断 */ }
  root?.remove();
  root = null;
  location.hash = "#/guide"; // 完成后返回使用指南
}

function render(): void {
  const group = PAGE_TOURS[pageId];
  if (!group) { closeTour(); return; }
  const step = group[stepIndex];
  const last = stepIndex === group.length - 1;
  const total = group.length;

  const el = ensureRoot();
  try { step.onEnter?.(); } catch { /* 演示动作失败不阻断 */ }

  const bubbles = `
    <div class="tour-card" style="visibility:hidden">
      <div class="tour-title">${t(step.titleKey)}</div>
      <div class="tour-text">${t(step.textKey)}</div>
      <div class="tour-nav">
        <span class="tour-step-no">${t("tour.stepno").replace("{0}", String(stepIndex + 1)).replace("{1}", String(total))}</span>
        ${stepIndex > 0 ? `<button class="btn" id="tour-prev">${t("tour.prev")}</button>` : ""}
        <button class="btn primary" id="tour-next">${last ? t("tour.finishBtn") : t("tour.next")}</button>
      </div>
    </div>`;

  if (!step.selector) {
    el.innerHTML = `<div class="tour-backdrop">${bubbles}</div>`;
  } else {
    el.innerHTML = `<div class="tour-backdrop"></div><div class="tour-mask" data-m="top"></div><div class="tour-mask" data-m="left"></div><div class="tour-mask" data-m="right"></div><div class="tour-mask" data-m="bottom"></div><div class="tour-spot"></div>${bubbles}`;
  }

  el.querySelector("#tour-next")!.addEventListener("click", () => {
    if (last) { closeTour(); return; }
    try { step.onExit?.(); } catch { /* 忽略 */ }
    stepIndex += 1; render();
  });
  el.querySelector("#tour-prev")?.addEventListener("click", () => {
    try { step.onExit?.(); } catch { /* 忽略 */ }
    stepIndex -= 1; render();
  });
  // 教程中点遮罩空白不退出（避免误触中断演示动作）；Esc 由 closeTour 兜底
  el.querySelector("#tour-root, .tour-backdrop")?.addEventListener("click", (e) => {
    if (e.target === el.querySelector(".tour-backdrop")) { closeTour(); }
  });

  if (step.selector) {
    // 切页竞态加固：hashchange/navigate 完成前后各校准一次，AG Grid 晚初始化也有兜底
    window.setTimeout(() => placeSpot(step), 60);
    window.setTimeout(() => placeSpot(step), 350);
  }
}

function placeSpot(step: TourStep): void {
  const spot = root?.querySelector<HTMLElement>(".tour-spot");
  if (!spot) return;
  const masks = root?.querySelectorAll<HTMLElement>(".tour-mask");
  const card = ensureRoot().querySelector<HTMLElement>(".tour-card");
  if (card) card.style.visibility = "visible"; // 与位置设置同帧完成，不会闪现默认位置

  // AG Grid 列聚光模式：竖条框住整列（列头顶至表格底部）
  let rect: DOMRect | null = null;
  const target = document.querySelector(step.selector ?? "");
  if (step.colId && target) {
    const hr = target.getBoundingClientRect();
    const viewport = document.querySelector(".ag-body-viewport");
    const bottom = viewport ? viewport.getBoundingClientRect().bottom : hr.bottom;
    rect = new DOMRect(hr.left, hr.top, hr.width, Math.max(hr.height, bottom - hr.top));
  } else if (target) {
    rect = target.getBoundingClientRect();
  }

  if (!rect || !card) {
    const fallback = document.querySelector(".page-head");
    if (fallback && card) { spot.style.display = ""; positionAt(spot, card, fallback.getBoundingClientRect(), masks); return; }
    spot.style.display = "none";
    masks?.forEach(m => { m.style.display = "none"; });
    if (card) { card.style.position = "fixed"; card.style.left = "50%"; card.style.top = "50%"; card.style.transform = "translate(-50%, -50%)"; }
    return;
  }
  spot.style.display = "";
  positionAt(spot, card, rect, masks);
}

function positionAt(spot: HTMLElement, card: HTMLElement, rect: DOMRect, masks?: NodeListOf<HTMLElement>): void {
  const pad = 6;
  spot.style.left = `${rect.left - pad}px`;
  spot.style.top = `${rect.top - pad}px`;
  spot.style.width = `${rect.width + pad * 2}px`;
  spot.style.height = `${rect.height + pad * 2}px`;

  if (masks && masks.length === 4) {
    const W = window.innerWidth, H = window.innerHeight;
    const l = Math.max(0, rect.left - pad), tp = Math.max(0, rect.top - pad);
    const r = Math.min(W, rect.right + pad), b = Math.min(H, rect.bottom + pad);
    const set = (m: HTMLElement, left: number, top: number, width: number, height: number) => {
      m.style.display = "";
      m.style.left = `${left}px`; m.style.top = `${top}px`;
      m.style.width = `${Math.max(0, width)}px`; m.style.height = `${Math.max(0, height)}px`;
    };
    const byKey = (k: string) => Array.from(masks).find(m => m.dataset.m === k)!;
    set(byKey("top"), 0, 0, W, tp);
    set(byKey("left"), 0, tp, l, b - tp);
    set(byKey("right"), r, tp, W - r, b - tp);
    set(byKey("bottom"), 0, b, W, H - b);
  }

  const bh = card.offsetHeight || 160;
  const below = rect.bottom + pad + 12 + bh;
  if (below < window.innerHeight - 12) {
    card.style.top = `${rect.bottom + pad + 12}px`;
  } else if (rect.top - pad - 12 - bh > 12) {
    card.style.top = `${rect.top - pad - 12 - bh}px`;
  } else {
    card.style.top = `${Math.min(window.innerHeight - bh - 12, rect.bottom + 12)}px`;
  }
  const bx = Math.max(12, Math.min(rect.left, window.innerWidth - (card.offsetWidth || 360) - 12));
  card.style.left = `${bx}px`;
  card.style.transform = "none";
}

function ensureRoot(): HTMLDivElement {
  if (root) return root;
  root = document.createElement("div");
  root.id = "tour-root";
  document.body.appendChild(root);
  return root;
}
