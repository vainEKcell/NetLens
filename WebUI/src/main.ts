import { initBridge, onSnapshot, sendCommand, fmtSpeed, fmtBytes, Snapshot } from "./api";
import { initSpark, pushPoint } from "./chart";
import { initTooltip } from "./tooltip";
import { t, setLang, agLocale } from "./i18n";
import * as overview from "./pages/overview";
import * as destinations from "./pages/destinations";
import * as dns from "./pages/dns";
import * as ports from "./pages/ports";
import * as events from "./pages/events";
import * as blocking from "./pages/blocking";
import * as network from "./pages/network";
import * as netcheck from "./pages/netcheck";
import * as settings from "./pages/settings";

type PageModule = { render(root: HTMLElement): void; onSnapshot(s: Snapshot): void };
const pageModules: Record<string, PageModule> = {
  overview, destinations, dns, ports, events, blocking, network, netcheck, settings,
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
];

// ===== 布局 =====
const nav = document.getElementById("nav")!;
NAV.forEach((item) => {
  const el = document.createElement("div");
  el.className = "nav-item";
  el.dataset.page = item.id;
  el.textContent = t(item.titleKey);
  el.addEventListener("click", () => { location.hash = `#/${item.id}`; });
  nav.appendChild(el);
});

const content = document.getElementById("content")!;
let currentPage = "";

function navigate(force = false): void {
  const id = location.hash.replace(/^#\//, "") || "overview";
  const item = NAV.find((n) => n.id === id) ?? NAV[0];
  if (item.id === currentPage && !force) return;
  currentPage = item.id;

  document.querySelectorAll(".nav-item").forEach((el) =>
    el.classList.toggle("active", (el as HTMLElement).dataset.page === item.id));

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

let paused = false;
function setPaused(v: boolean): void {
  paused = v;
  pauseBtn.textContent = paused ? t("tb.resume") : t("tb.pause");
  pauseBtn.classList.toggle("paused", paused);
}

pauseBtn.addEventListener("click", () => sendCommand(paused ? "resume" : "pause"));

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
    if (el) el.textContent = t(item.titleKey);
  });
  // 顶栏标签
  const lblUp = document.getElementById("lbl-up");
  const lblDown = document.getElementById("lbl-down");
  const lblSession = document.getElementById("lbl-session");
  if (lblUp) lblUp.textContent = t("tb.up");
  if (lblDown) lblDown.textContent = t("tb.down");
  if (lblSession) lblSession.textContent = t("tb.session");
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

// ===== 启动 =====
initBridge();
initSpark();
initTooltip();
navigate();

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

  const mod = pageModules[currentPage];
  if (mod) mod.onSnapshot(s);
});
