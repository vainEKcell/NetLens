import { initBridge, onSnapshot, sendCommand, fmtSpeed, fmtBytes, Snapshot } from "./api";

// 全局错误兜底：未捕获异常/拒绝在页面顶部显示错误条——前端异常不再表现为"空内容黑屏"且原因可见（点击关闭）
function showFatalBanner(msg: string): void {
  let bar = document.getElementById("fatal-banner");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "fatal-banner";
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:99999;background:#7a2718;color:#ffd9d0;" +
      "font:12px/1.6 Consolas,monospace;padding:6px 12px;white-space:pre-wrap;word-break:break-all;cursor:pointer;";
    bar.addEventListener("click", () => bar?.remove());
    document.body.appendChild(bar);
  }
  bar.textContent += (bar.textContent ? "\n" : "") + msg;
}
window.addEventListener("error", (e) =>
  showFatalBanner("JS 错误: " + ((e.error && e.error.stack) || e.message)));
window.addEventListener("unhandledrejection", (e) =>
  showFatalBanner("Promise 拒绝: " + String((e as PromiseRejectionEvent).reason)));
import { initSpark, pushPoint } from "./chart";
import { initTooltip } from "./tooltip";
import { initContextGuard } from "./menu";
import { t, setLang, agLocale } from "./i18n";
import * as overview from "./pages/overview";
import * as destinations from "./pages/destinations";
import * as dns from "./pages/dns";
import * as ports from "./pages/ports";
import * as events from "./pages/events";
import * as guide from "./pages/guide";
import { maybeShowLogoTip, startPageTour } from "./tour";
import * as blocking from "./pages/blocking";
import * as network from "./pages/network";
import * as netcheck from "./pages/netcheck";
import * as settings from "./pages/settings";

type PageModule = { render(root: HTMLElement): void; onSnapshot(s: Snapshot): void };
const pageModules: Record<string, PageModule> = {
  overview, destinations, dns, ports, events, blocking, network, netcheck, settings, guide,
};

// 16px 线性图标（stroke: currentColor，与文字同色）
const ICONS: Record<string, string> = {
  overview: '<rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1"/><rect x="9" y="9" width="5.5" height="5.5" rx="1"/>',
  destinations: '<circle cx="8" cy="8" r="6.2"/><circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2"/>',
  dns: '<path d="M8 1.5l5.5 2.2v3.1c0 3.2-2.3 6-5.5 7.2-3.2-1.2-5.5-4-5.5-7.2V3.7L8 1.5z"/>',
  ports: '<rect x="1.5" y="5.5" width="4.5" height="5" rx="1"/><rect x="10" y="5.5" width="4.5" height="5" rx="1"/><path d="M6 8h4"/>',
  events: '<path d="M2 3.5h12M2 8h12M2 12.5h8"/>',
  blocking: '<circle cx="8" cy="8" r="6.2"/><path d="M3.7 3.7l8.6 8.6"/>',
  network: '<rect x="1.5" y="1.5" width="13" height="9" rx="1.5"/><path d="M5.5 13h5M8 10.5V13"/>',
  netcheck: '<path d="M1.5 9.5l3-3 2.5 2.5 4-5 3.5 3.5"/><path d="M1.5 13h13"/>',
  settings: '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2.2M8 12.3v2.2M1.5 8h2.2M12.3 8h2.2M3.4 3.4l1.6 1.6M11 11l1.6 1.6M12.6 3.4L11 5M5 11l-1.6 1.6"/>',
  guide: '<path d="M2.5 2.5h4.2c.7 0 1.3.6 1.3 1.3v9.7c0-.7-.6-1.3-1.3-1.3H2.5z"/><path d="M13.5 2.5H9.3c-.7 0-1.3.6-1.3 1.3v9.7c0-.7.6-1.3 1.3-1.3h4.2z"/>',
};

const NAV: { id: string; titleKey: string }[] = [
  { id: "overview",     titleKey: "nav.overview" },
  { id: "destinations", titleKey: "nav.destinations" },
  { id: "dns",          titleKey: "nav.dns" },
  { id: "ports",        titleKey: "nav.ports" },
  { id: "events",       titleKey: "nav.events" },
  { id: "blocking",     titleKey: "nav.blocking" },
  { id: "network",      titleKey: "nav.network" },
  { id: "netcheck",     titleKey: "nav.netcheck" },
  { id: "settings",     titleKey: "nav.settings" },
  { id: "guide",        titleKey: "nav.guide" },
];

// ===== 布局 =====
const nav = document.getElementById("nav")!;
NAV.forEach((item, index) => {
  const el = document.createElement("div");
  el.className = "nav-item";
  el.dataset.page = item.id;
  el.style.setProperty("--i", String(index)); // 交错动画延迟由数据驱动，新增项自动继承
  el.innerHTML = `<svg class="nav-ico" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[item.id] ?? ""}</svg><span>${t(item.titleKey)}</span>`;
  el.addEventListener("click", () => {
    navFocus = null; // 点击落定：清除悬停态，navigate 后其余标签全部缩回基准，仅选中项满宽
    location.hash = `#/${item.id}`;
  });
  nav.appendChild(el);
});

const content = document.getElementById("content")!;
let currentPage = "";

function navigate(force = false): void {
  const raw = location.hash.replace(/^#\//, "");
  const id = raw.split("?")[0] || "overview";
  if (raw.includes("autostart=1")) (window as unknown as { __autostartNetCheck?: boolean }).__autostartNetCheck = true;
  const item = NAV.find((n) => n.id === id) ?? NAV[0];
  if (item.id === currentPage && !force) return;
  currentPage = item.id;

  document.querySelectorAll(".nav-item").forEach((el) =>
    el.classList.toggle("active", (el as HTMLElement).dataset.page === item.id));
  updateNavWidths();

  content.innerHTML = "";
  const pageEl = document.createElement("div");
  pageEl.className = "page active";
  pageEl.id = `page-${item.id}`;
  content.appendChild(pageEl);
  pageModules[item.id].render(pageEl);
}

window.addEventListener("hashchange", () => navigate());

// ===== 顶栏 =====
const upEl = document.getElementById("tb-up")!;
const downEl = document.getElementById("tb-down")!;
const sessionEl = document.getElementById("tb-session")!;
const pauseBtn = document.getElementById("btn-pause") as HTMLButtonElement;
const loopbackCb = document.getElementById("tb-loopback") as HTMLInputElement;
const flaggedCb = document.getElementById("tb-flagged") as HTMLInputElement;
const searchEl = document.getElementById("tb-search") as HTMLInputElement;

let paused = false;
function setPaused(v: boolean): void {
  paused = v;
  pauseBtn.title = paused ? t("tb.resume") : t("tb.pause");
  pauseBtn.classList.toggle("paused", paused);
  const label = document.getElementById("pause-label");
  if (label) label.textContent = paused ? t("tb.resume") : t("tb.pause");
}

pauseBtn.addEventListener("click", () => sendCommand(paused ? "resume" : "pause"));
loopbackCb.addEventListener("change", () => sendCommand("setHideLoopback", { value: loopbackCb.checked }));
flaggedCb.addEventListener("change", () => sendCommand("setOnlyFlagged", { value: flaggedCb.checked }));
let searchTimer = 0;
searchEl.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  const v = searchEl.value;
  searchTimer = window.setTimeout(() => sendCommand("setSearch", { value: v }), 300);
});

// ===== 语言：设置值 auto=按系统语言；切换后重建当前页（列头/按钮/说明全走 t()） =====
let lastLangSetting = "";
function applyLanguage(setting: string): void {
  if (setting === lastLangSetting) return;
  lastLangSetting = setting;
  setLang(setting);
  document.documentElement.lang = t("nav.overview") === "Overview" ? "en" : "zh-CN";
  // 侧栏文案同步
  NAV.forEach((item) => {
    const el = nav.querySelector(`[data-page="${item.id}"]`) as HTMLElement | null;
    if (el) (el.querySelector("span") as HTMLElement).textContent = t(item.titleKey);
  });
  updateNavWidths();
  // 顶栏标签
  const lblUp = document.getElementById("lbl-up");
  const lblDown = document.getElementById("lbl-down");
  const lblSession = document.getElementById("lbl-session");
  if (lblUp) lblUp.textContent = t("tb.up");
  if (lblDown) lblDown.textContent = t("tb.down");
  if (lblSession) lblSession.textContent = t("tb.session");
  const loopLbl = document.getElementById("tb-loopback-label");
  const flagLbl = document.getElementById("tb-flagged-label");
  if (loopLbl) loopLbl.textContent = t("tb.hideLoopback");
  if (flagLbl) flagLbl.textContent = t("tb.onlyFlagged");
  searchEl.placeholder = t("tb.searchPh");
  setPaused(paused);
  navigate(true);
}

// ===== 主题：CSS data-theme；auto=matchMedia =====
const darkMedia = window.matchMedia("(prefers-color-scheme: light)");
function applyTheme(theme: string): void {
  const effective = theme === "auto" ? (darkMedia.matches ? "light" : "dark") : theme;
  document.documentElement.dataset.theme = effective;
}
let lastThemeSetting = "";
darkMedia.addEventListener("change", () => {
  if (lastThemeSetting === "auto") applyTheme(darkMedia.matches ? "light" : "dark");
});

// ===== 侧栏收放（顶部 « 按钮切换）+ 书签梯度宽度（转轮效果） =====
const sidebar = document.getElementById("sidebar")!;
const navToggle = document.getElementById("nav-toggle") as HTMLButtonElement;

// 以选中（或悬停）项为焦点：书签宽度从焦点向两侧**等差递减**——
// 焦点满宽 192，相邻层 170，2 层即落回基准 148（每层差 22px，层间差值均匀且明显）；
// 距焦点 ≥3 的项保持基准宽 148，完全不受影响。
const NAV_BASE = 148.0;   // 基准宽（远离焦点的正常书签）
const NAV_FOCUS = 192.0;  // 焦点满宽
const NAV_REACH = 2;      // 影响半径（层）
let navFocus: HTMLElement | null = null;

function navItems(): HTMLElement[] {
  return Array.from(nav.querySelectorAll<HTMLElement>(".nav-item"));
}

function updateNavWidths(): void {
  const items = navItems();
  if (sidebar.classList.contains("collapsed")) {
    items.forEach((it) => {
      it.style.width = ""; // 收起态交回 CSS（图标满宽书签）
      it.style.removeProperty("--nd");
    });
    return;
  }
  const hi = navFocus ? items.indexOf(navFocus) : -1;
  const ai = items.findIndex((it) => it.classList.contains("active"));
  items.forEach((it, i) => {
    // 选中态（无悬停）：只保留选中项满宽，其余全部落回基准——点击后"收拢落定"；
    // 悬停态：悬停项临时满宽，其余按悬停焦点等差梯度；选中项在悬停期间恒满宽不被挤压
    let w = NAV_BASE;
    let center = ai;
    if (i === ai) {
      w = NAV_FOCUS;
    } else if (hi >= 0) {
      const d = Math.abs(i - hi);
      if (d <= NAV_REACH) w = NAV_FOCUS - (NAV_FOCUS - NAV_BASE) * (d / (NAV_REACH + 1));
      if (i === hi) w = NAV_FOCUS;
      center = hi;
    }
    it.style.width = `${w.toFixed(1)}px`; // 宽度过渡统一走 CSS
    // 相邻层 12ms 均匀微差：变化近乎同步、又有涟漪式的微妙时差——无方向偏置，不产生钝感
    it.style.setProperty("--nd", `${Math.min(Math.abs(i - center), 6) * 12}ms`);
  });
}

nav.addEventListener("mouseover", (e) => {
  const it = (e.target as HTMLElement).closest<HTMLElement>(".nav-item");
  if (it) {
    if (it !== navFocus) { navFocus = it; updateNavWidths(); } // 即时跟随（无停顿门控）
  } else if (navFocus) {
    // 滑入标签页以外的区域（项间空隙/导航区下方空白）：即脱离悬停态，梯度立即收拢
    navFocus = null;
    updateNavWidths();
  }
});
// 离开侧栏：悬停焦点清除，全部落回基准——滑过菜单不想选也不会丢失"当前页"的标识
nav.addEventListener("mouseleave", () => {
  if (navFocus) { navFocus = null; updateNavWidths(); }
});

function setCollapsed(v: boolean): void {
  sidebar.classList.toggle("collapsed", v);
  navToggle.classList.toggle("collapsed", v);
  localStorage.setItem("nl-nav-collapsed", v ? "1" : "0");
  updateNavWidths();
}
navToggle.addEventListener("click", () => setCollapsed(!sidebar.classList.contains("collapsed")));
if (localStorage.getItem("nl-nav-collapsed") === "1") setCollapsed(true);
updateNavWidths();

// ===== 启动 =====
initBridge();
initSpark();
initTooltip();
initContextGuard();
navigate();
// 首次启动自动开始新手总教程（intro；已完成或中途关闭都不再自动弹），老用户保持 logo 小提示
let introDone = false;
try { introDone = localStorage.getItem("nl-intro-done") === "1"; } catch { /* 忽略 */ }
if (introDone) {
  maybeShowLogoTip();
} else {
  window.setTimeout(() => {
    if (startPageTour("intro")) {
      try { localStorage.setItem("nl-intro-done", "1"); } catch { /* 忽略 */ }
    }
  }, 900); // 等首帧表格渲染完成，聚光校准链路才能命中
}

// Ctrl+B：收起 / 展开左侧导航（与 logo 等效）
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "b" || e.key === "B")) {
    e.preventDefault();
    document.getElementById("nav-toggle")?.click();
  }
});

onSnapshot((s: Snapshot) => {
  if (s.settings.theme !== lastThemeSetting) {
    lastThemeSetting = s.settings.theme;
    applyTheme(s.settings.theme);
  }
  applyLanguage(s.settings.language);
  upEl.textContent = fmtSpeed(s.totals.up);
  downEl.textContent = fmtSpeed(s.totals.down);
  sessionEl.textContent = `↑ ${fmtBytes(s.totals.upAll)}　↓ ${fmtBytes(s.totals.downAll)}`;
  pushPoint(s.totals.up, s.totals.down);
  if (s.paused !== paused) setPaused(s.paused);
  if (loopbackCb.checked !== s.settings.hideLoopback) loopbackCb.checked = s.settings.hideLoopback;
  if (flaggedCb.checked !== s.settings.onlyFlagged) flaggedCb.checked = s.settings.onlyFlagged;
  if (document.activeElement !== searchEl && searchEl.value !== s.settings.searchText) searchEl.value = s.settings.searchText;

  const mod = pageModules[currentPage];
  if (mod) mod.onSnapshot(s);
});
