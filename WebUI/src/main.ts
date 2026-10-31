import { initBridge, onSnapshot, sendCommand, fmtSpeed, fmtBytes, Snapshot } from "./api";
import { initSpark, pushPoint } from "./chart";
import * as overview from "./pages/overview";
import * as dns from "./pages/dns";
import * as netcheck from "./pages/netcheck";
import * as events from "./pages/events";
import * as placeholder from "./pages/placeholder";

// ===== 导航注册 =====
const NAV: { id: string; icon: string; title: string; sub: string; page: "module" | "ph" }[] = [
  { id: "overview",     icon: "▤", title: "总览",      sub: "每进程实时流量 · 点击行查看详情与处置", page: "module" },
  { id: "destinations", icon: "⊕", title: "目的地排行", sub: "按远端地址聚合的流量排行", page: "ph" },
  { id: "dns",          icon: "◎", title: "DNS 安全",   sub: "解析流为被动监听（零流量）；DNS 体检为主动交叉验证", page: "module" },
  { id: "ports",        icon: "⇥", title: "监听端口",   sub: "本机监听端口与对外暴露面", page: "ph" },
  { id: "events",       icon: "≡", title: "事件流",     sub: "连接、传输、DNS 与拦截事件的统一时间线", page: "module" },
  { id: "blocking",     icon: "⊘", title: "拦截名单",   sub: "防火墙拦截规则与允许名单", page: "ph" },
  { id: "network",      icon: "⚑", title: "网络配置",   sub: "网卡 / 代理 / hosts 变更历史", page: "ph" },
  { id: "netcheck",     icon: "✚", title: "网络体检",   sub: "NAT / 延迟 / 带宽一键体检", page: "module" },
  { id: "settings",     icon: "⚙", title: "设置",       sub: "语言 / 主题 / 数据保留", page: "ph" },
];

const pageModules: Record<string, typeof overview> = { overview, dns, netcheck, events };

// ===== 布局 =====
const nav = document.getElementById("nav")!;
NAV.forEach((item) => {
  const el = document.createElement("div");
  el.className = "nav-item";
  el.dataset.page = item.id;
  el.innerHTML = `<span class="ico">${item.icon}</span><span>${item.title}</span>`;
  el.addEventListener("click", () => { location.hash = `#/${item.id}`; });
  nav.appendChild(el);
});

const content = document.getElementById("content")!;
let currentPage = "";

function navigate(): void {
  const id = location.hash.replace(/^#\//, "") || "overview";
  const item = NAV.find((n) => n.id === id) ?? NAV[0];
  if (item.id === currentPage) return;
  currentPage = item.id;

  document.querySelectorAll(".nav-item").forEach((el) =>
    el.classList.toggle("active", (el as HTMLElement).dataset.page === item.id));

  content.innerHTML = "";
  const pageEl = document.createElement("div");
  pageEl.className = "page active";
  pageEl.id = `page-${item.id}`;
  content.appendChild(pageEl);

  if (item.page === "module") {
    (pageModules[item.id] as typeof overview).render(pageEl);
  } else {
    placeholder.render(pageEl, item.title, `${item.sub}（beta 版迁移至此）`);
  }
}

window.addEventListener("hashchange", navigate);

// ===== 顶栏 =====
const upEl = document.getElementById("tb-up")!;
const downEl = document.getElementById("tb-down")!;
const sessionEl = document.getElementById("tb-session")!;
const pauseBtn = document.getElementById("btn-pause") as HTMLButtonElement;

let paused = false;
function setPaused(v: boolean): void {
  paused = v;
  pauseBtn.textContent = paused ? "恢复监控" : "暂停监控";
  pauseBtn.classList.toggle("paused", paused);
}

pauseBtn.addEventListener("click", () => sendCommand(paused ? "resume" : "pause"));

// ===== 启动 =====
initBridge();
initSpark();
navigate();

onSnapshot((s: Snapshot) => {
  upEl.textContent = fmtSpeed(s.totals.up);
  downEl.textContent = fmtSpeed(s.totals.down);
  sessionEl.textContent = `↑ ${fmtBytes(s.totals.upAll)}　↓ ${fmtBytes(s.totals.downAll)}`;
  pushPoint(s.totals.up, s.totals.down);
  if (s.paused !== paused) setPaused(s.paused);

  const mod = pageModules[currentPage];
  if (mod) mod.onSnapshot(s);
});
