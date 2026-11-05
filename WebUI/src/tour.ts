// 首次启动使用教程：分步气泡 + 聚光高亮 + 自动切页；完成/跳过后 localStorage 记忆，设置页可重放
import { t } from "./i18n";

type TourStep = {
  page?: string;        // 需要切换到的页面（缺省为当前页）
  selector?: string;    // 聚光目标（缺省为整屏卡片式步骤）
  titleKey: string;
  textKey: string;
};

const TOUR: TourStep[] = [
  { titleKey: "tour.welcome", textKey: "tour.welcome.text" },
  { page: "overview", selector: "#nav-toggle", titleKey: "tour.logo", textKey: "tour.logo.text" },
  { page: "overview", selector: "#btn-pause", titleKey: "tour.pause", textKey: "tour.pause.text" },
  { page: "overview", selector: ".tb-left", titleKey: "tour.filters", textKey: "tour.filters.text" },
  { page: "overview", selector: "#spark", titleKey: "tour.metrics", textKey: "tour.metrics.text" },
  { page: "overview", selector: "#page-overview .ag-root-wrapper", titleKey: "tour.grid", textKey: "tour.grid.text" },
  { page: "overview", selector: "#page-overview .ag-root-wrapper", titleKey: "tour.verdict", textKey: "tour.verdict.text" },
  { page: "destinations", selector: "#page-destinations .page-head", titleKey: "tour.destinations", textKey: "tour.destinations.text" },
  { page: "dns", selector: "#page-dns .page-head", titleKey: "tour.dns", textKey: "tour.dns.text" },
  { page: "ports", selector: "#page-ports .page-head", titleKey: "tour.ports", textKey: "tour.ports.text" },
  { page: "events", selector: "#page-events .page-head", titleKey: "tour.events", textKey: "tour.events.text" },
  { page: "blocking", selector: "#page-blocking .page-head", titleKey: "tour.blocking", textKey: "tour.blocking.text" },
  { page: "network", selector: "#page-network .page-head", titleKey: "tour.network", textKey: "tour.network.text" },
  { page: "netcheck", selector: "#page-netcheck .page-head", titleKey: "tour.netcheck", textKey: "tour.netcheck.text" },
  { titleKey: "tour.finish", textKey: "tour.finish.text" },
];

const TOUR_KEY = "nl-tour-done";

export function tourDone(): boolean {
  try { return localStorage.getItem(TOUR_KEY) === "1"; } catch { return true; }
}

export function markTourDone(): void {
  try { localStorage.setItem(TOUR_KEY, "1"); } catch { /* 隐私模式等：忽略 */ }
}

export function replayTour(): void {
  try { localStorage.removeItem(TOUR_KEY); } catch { /* 忽略 */ }
  startTour();
}

export function maybeAutoTour(): void {
  if (tourDone()) return;
  window.setTimeout(startTour, 1500); // 等首份快照渲染完，表格有数据再开场
}

let root: HTMLDivElement | null = null;
let stepIndex = 0;

function ensureRoot(): HTMLDivElement {
  if (root) return root;
  root = document.createElement("div");
  root.id = "tour-root";
  document.body.appendChild(root);
  return root;
}

/** 定位聚光框与气泡；card 步（无 selector）显示居中卡 */
function render(): void {
  const el = ensureRoot();
  const step = TOUR[stepIndex];
  const last = stepIndex === TOUR.length - 1;
  const total = TOUR.length;

  const bubbles = `
    <div class="tour-card">
      <div class="tour-title">${t(step.titleKey)}</div>
      <div class="tour-text">${t(step.textKey)}</div>
      <div class="tour-nav">
        <span class="tour-step-no">${t("tour.stepno").replace("{0}", String(stepIndex + 1)).replace("{1}", String(total))}</span>
        <button class="btn" id="tour-skip">${t("tour.skip")}</button>
        ${stepIndex > 0 ? `<button class="btn" id="tour-prev">${t("tour.prev")}</button>` : ""}
        <button class="btn primary" id="tour-next">${last ? t("tour.finishBtn") : t("tour.next")}</button>
      </div>
    </div>`;

  if (!step.selector || !step.page) {
    // 卡片式步骤：无遮罩聚光，仅居中卡
    if (step.page) location.hash = `#/${step.page}`;
    el.innerHTML = `<div class="tour-backdrop">${bubbles}</div>`;
  } else {
    if (location.hash !== `#/${step.page}`) location.hash = `#/${step.page}`;
    el.innerHTML = `<div class="tour-spot"></div><div class="tour-backdrop">${bubbles}</div>`;
  }

  // 事件
  el.querySelector("#tour-skip")!.addEventListener("click", () => { markTourDone(); close(); });
  el.querySelector("#tour-next")!.addEventListener("click", () => {
    if (last) { markTourDone(); close(); return; }
    stepIndex += 1; render();
  });
  const prev = el.querySelector("#tour-prev");
  prev?.addEventListener("click", () => { stepIndex -= 1; render(); });

  // 聚光定位（切页/布局后下一帧量尺寸）
  if (step.selector) {
    requestAnimationFrame(() => { placeSpot(step.selector!); });
    // 字体/表格晚渲染的二次校准
    window.setTimeout(() => placeSpot(step.selector!), 260);
  }
}

function placeSpot(selector: string): void {
  const spot = root?.querySelector<HTMLElement>(".tour-spot");
  if (!spot) return;
  const target = document.querySelector(selector);
  const el = ensureRoot();
  const card = el.querySelector<HTMLElement>(".tour-card");
  if (!target || !card) {
    // 目标缺失：退化为整页标题聚光，再缺失则隐藏聚光只留气泡
    const fallback = document.querySelector(".page-head");
    if (fallback && card) { spot.style.display = ""; positionAt(spot, card, fallback.getBoundingClientRect()); return; }
    spot.style.display = "none";
    if (card) { card.style.position = "fixed"; card.style.left = "50%"; card.style.top = "50%"; card.style.transform = "translate(-50%, -50%)"; }
    return;
  }
  spot.style.display = "";
  positionAt(spot, card, target.getBoundingClientRect());
}

function positionAt(spot: HTMLElement, card: HTMLElement, rect: DOMRect): void {
  const pad = 6;
  spot.style.left = `${rect.left - pad}px`;
  spot.style.top = `${rect.top - pad}px`;
  spot.style.width = `${rect.width + pad * 2}px`;
  spot.style.height = `${rect.height + pad * 2}px`;

  // 气泡：目标下方优先，空间不足放上方，仍不足放视口下缘
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

function close(): void {
  root?.remove();
  root = null;
}

export function startTour(): void {
  stepIndex = 0;
  render();
}
