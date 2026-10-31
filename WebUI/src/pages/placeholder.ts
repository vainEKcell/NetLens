// beta 版迁移的占位页：目的地排行 / 监听端口 / 拦截名单 / 网络配置 / 设置
import { t } from "../i18n";

export function render(root: HTMLElement, title: string, desc: string): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${title}</h1>
      <div class="sub">${desc}</div>
    </div>
    <div class="placeholder">
      <div class="big-ico">🚧</div>
      <div>${t("ph.title")}</div>
      <div style="font-size:11.5px;">${t("ph.sub")}</div>
    </div>`;
}
