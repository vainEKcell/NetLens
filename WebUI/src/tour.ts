// 首次启动小提示：logo 可收放导航（一次性，非模态气泡）；完整功能说明在「使用指南」页
import { t } from "./i18n";

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

function dismiss(): void {
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

  // 定位：logo 正下方（窗口内收敛）
  const r = anchor.getBoundingClientRect();
  const el = tipEl;
  el.style.left = `${Math.max(10, r.left - 4)}px`;
  el.style.top = `${r.bottom + 10}px`;

  const close = () => dismiss();
  el.querySelector(".logo-tip-close")!.addEventListener("click", close);
  anchor.addEventListener("click", close, { once: true });
  window.setTimeout(close, 10000); // 10 秒后自动消失
}
