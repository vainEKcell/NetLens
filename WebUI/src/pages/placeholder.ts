// beta 版迁移的占位页：目的地排行 / 监听端口 / 拦截名单 / 网络配置 / 设置
export function render(root: HTMLElement, title: string, desc: string): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${title}</h1>
      <div class="sub">${desc}</div>
    </div>
    <div class="placeholder">
      <div class="big-ico">🚧</div>
      <div>此页将在 0.1.5 beta 中迁移到新界面</div>
      <div style="font-size:11.5px;">功能当前仍可通过启动 NetWatch 时不加 --spike 参数使用完整 WPF 界面</div>
    </div>`;
}
