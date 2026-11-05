// 分页交互教程引擎：气泡/聚光/遮罩 DOM 常驻，切步只更新内容与位置——
// 聚光框与气泡以 CSS 过渡平滑滑向新目标（无重建跳变），步骤文案见 tour-data.ts。
import { t, getLang } from "./i18n";
import { TOUR_GROUPS, TourStep } from "./tour-data";
import { hide as hideContextMenu } from "./menu";

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
  tipEl.style.left = `${Math.max(10, r.left - 4)}px`;
  tipEl.style.top = `${r.bottom + 10}px`;

  const close = () => dismissTip();
  tipEl.querySelector(".logo-tip-close")!.addEventListener("click", close);
  anchor.addEventListener("click", close, { once: true });
  window.setTimeout(close, 10000);
}

// ---------- 分页教程引擎 ----------
let root: HTMLDivElement | null = null;
let spot: HTMLElement | null = null;
let card: HTMLElement | null = null;
let cardText: HTMLElement | null = null;
let cardNav: HTMLElement | null = null;
let pageId = "";
let stepIndex = 0;

const masksOf = () => Array.from(root?.querySelectorAll<HTMLElement>(".tour-mask") ?? []);

export function startPageTour(id: string): boolean {
  const group = TOUR_GROUPS[id];
  if (!group || group.length === 0) return false;
  pageId = id;
  stepIndex = 0;
  markTipDone(); // 教程启动时收起 logo 小提示，避免两者并存
  document.querySelector(".logo-tip")?.remove();
  if (location.hash !== `#/${id}`) location.hash = `#/${id}`; // 切到目标真实页面
  ensureDom();
  renderStep();
  return true;
}

function closeTour(): void {
  const step = TOUR_GROUPS[pageId]?.[stepIndex];
  try { step?.onExit?.(); } catch { /* 演示动作失败不阻断 */ }
  root?.remove();
  root = spot = card = cardText = cardNav = null;
  location.hash = "#/guide"; // 完成后返回使用指南
}

function ensureDom(): void {
  if (root) return;
  root = document.createElement("div");
  root.id = "tour-root";
  root.innerHTML = `
    <div class="tour-backdrop"></div>
    <div class="tour-mask" data-m="top"></div>
    <div class="tour-mask" data-m="left"></div>
    <div class="tour-mask" data-m="right"></div>
    <div class="tour-mask" data-m="bottom"></div>
    <div class="tour-spot"></div>
    <div class="tour-card" style="visibility:hidden">
      <div class="tour-title"></div>
      <div class="tour-text"></div>
      <div class="tour-nav"></div>
    </div>`;
  document.body.appendChild(root);
  spot = root.querySelector(".tour-spot");
  card = root.querySelector(".tour-card");
  cardText = card!.querySelector(".tour-text");
  cardNav = card!.querySelector(".tour-nav");
  // 挡点击：backdrop 覆盖全屏；教程期间下层不可交互（点遮罩/暗区=收起）
  root.querySelector(".tour-backdrop")!.addEventListener("click", closeTour);
}

function lang(v: { zh: string; en: string }): string {
  return getLang() === "en" ? v.en : v.zh;
}

function renderStep(): void {
  if (!root || !card || !cardText || !cardNav) return;
  const group = TOUR_GROUPS[pageId];
  if (!group) { closeTour(); return; }
  const step = group[stepIndex];
  const last = stepIndex === group.length - 1;

  // 内容更新（容器常驻，无重建跳变）
  (card.querySelector(".tour-title") as HTMLElement).textContent = lang(step.title);
  cardText.innerHTML = lang(step.text);
  cardNav.innerHTML = `
    <span class="tour-step-no">${t("tour.stepno").replace("{0}", String(stepIndex + 1)).replace("{1}", String(group.length))}</span>
    ${stepIndex > 0 ? `<button class="btn" id="tour-prev">${t("tour.prev")}</button>` : ""}
    <button class="btn primary" id="tour-next">${last ? t("tour.finishBtn") : t("tour.next")}</button>`;
  cardNav.querySelector("#tour-next")!.addEventListener("click", () => {
    if (last) { closeTour(); return; }
    try { step.onExit?.(); } catch { /* 忽略 */ }
    stepIndex += 1;
    renderStep();
  });
  cardNav.querySelector("#tour-prev")?.addEventListener("click", () => {
    try { step.onExit?.(); } catch { /* 忽略 */ }
    stepIndex -= 1;
    renderStep();
  });

  // 卡片轻脉动（内容切换的呼吸感）
  card.animate([{ opacity: 0.45 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });

  // 切页（如需）
  if (location.hash !== `#/${step.page}`) location.hash = `#/${step.page}`;

  // 聚光定位：先立即一次，再两次校准（等切页/表格渲染）
  placeSpot(step);
  window.setTimeout(() => placeSpot(step), 60);
  window.setTimeout(() => placeSpot(step), 350);
}

function placeSpot(step: TourStep): void {
  if (!spot || !card) return;
  const masks = masksOf();
  if (card.style.visibility !== "visible") card.style.visibility = "visible"; // 与位置设置同帧，无闪现

  const target = document.querySelector(step.selector ?? "");
  let rect: DOMRect | null = null;
  if (step.colId && target) {
    const hr = target.getBoundingClientRect();
    const viewport = document.querySelector(".ag-body-viewport");
    const bottom = viewport ? viewport.getBoundingClientRect().bottom : hr.bottom;
    rect = new DOMRect(hr.left, hr.top, hr.width, Math.max(hr.height, bottom - hr.top));
  } else if (target) {
    rect = target.getBoundingClientRect();
  }

  if (!rect) {
    const fallback = document.querySelector(".page-head");
    if (fallback) { positionSpot(rect = fallback.getBoundingClientRect(), card, masks); return; }
    spot.style.display = "none";
    masks.forEach(m => { m.style.display = "none"; });
    return;
  }
  spot.style.display = "";
  positionSpot(rect, card, masks);
}

function positionSpot(rect: DOMRect, card: HTMLElement, masks: HTMLElement[]): void {
  const pad = 6;
  const W = window.innerWidth, H = window.innerHeight;
  const l = Math.max(0, rect.left - pad), tp = Math.max(0, rect.top - pad);
  const r = Math.min(W, rect.right + pad), b = Math.min(H, rect.bottom + pad);

  spot!.style.left = `${l}px`; spot!.style.top = `${tp}px`;
  spot!.style.width = `${r - l}px`; spot!.style.height = `${b - tp}px`;

  const byKey = (k: string) => masks.find(m => m.dataset.m === k)!;
  const set = (m: HTMLElement, left: number, top: number, width: number, height: number) => {
    m.style.display = ""; m.style.left = `${left}px`; m.style.top = `${top}px`;
    m.style.width = `${Math.max(0, width)}px`; m.style.height = `${Math.max(0, height)}px`;
  };
  set(byKey("top"), 0, 0, W, tp);
  set(byKey("left"), 0, tp, l, b - tp);
  set(byKey("right"), r, tp, W - r, b - tp);
  set(byKey("bottom"), 0, b, W, H - b);

  // 气泡：目标下方优先，空间不足放上方，仍不足贴视口下缘
  const bh = card.offsetHeight || 160;
  if (b + 12 + bh < H - 12) card.style.top = `${b + 12}px`;
  else if (tp - 12 - bh > 12) card.style.top = `${tp - 12 - bh}px`;
  else card.style.top = `${Math.min(H - bh - 12, b + 12)}px`;
  card.style.left = `${Math.max(12, Math.min(l, W - (card.offsetWidth || 372) - 12))}px`;
}
