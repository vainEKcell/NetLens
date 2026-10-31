import { Snapshot, sendCommand } from "../api";

let rootEl: HTMLElement | null = null;

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>设置</h1>
      <div class="sub">语言 / 主题 / 数据保留（即改即存）</div>
    </div>
    <div class="grid2">
      <div>
        <div class="card">
          <h2>外观</h2>
          <div class="kv" style="grid-template-columns: 90px 220px; row-gap: 10px;">
            <span class="k">界面语言</span>
            <select id="set-lang">
              <option value="auto">跟随系统</option>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <span class="k">主题</span>
            <select id="set-theme">
              <option value="auto">跟随系统</option>
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </div>
          <div class="hint">语言影响服务层产出的文本（NAT 判定、告警等）；界面文字的英文翻译将在 beta 版补齐。</div>
        </div>

        <div class="card">
          <h2>数据与隐私</h2>
          <div class="kv" style="grid-template-columns: 90px 220px; row-gap: 10px;">
            <span class="k">行为基线</span>
            <select id="set-baseline">
              <option value="30">保留 30 天</option>
              <option value="90">保留 90 天</option>
              <option value="365">保留 365 天</option>
              <option value="0">不限</option>
            </select>
            <span class="k">证据流</span>
            <select id="set-evidence">
              <option value="3">保留 3 天</option>
              <option value="7">保留 7 天</option>
              <option value="30">保留 30 天</option>
              <option value="0">不限</option>
            </select>
            <span class="k">证据容量</span>
            <select id="set-cap">
              <option value="128">128 MB</option>
              <option value="512">512 MB</option>
              <option value="2048">2 GB</option>
            </select>
            <span class="k">基线学习</span>
            <label style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="set-pause" style="width:auto;" /> 暂停（证据流照常）
            </label>
          </div>
          <div class="hint" id="set-storage" style="margin-top:8px;">—</div>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="btn" id="set-cleanup">立即清理过期数据</button>
            <button class="btn" id="set-audit" style="display:none;">启用防火墙拦截审计</button>
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>总览显示</h2>
          <div class="kv" style="grid-template-columns: 90px 220px; row-gap: 10px;">
            <span class="k">回环流量</span>
            <label style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="set-loopback" style="width:auto;" /> 显示回环 (127.x)
            </label>
            <span class="k">搜索</span>
            <input type="text" id="set-search" placeholder="按进程名/路径过滤总览" style="width: 100%;" />
          </div>
        </div>
        <div class="card">
          <h2>事件流</h2>
          <div style="display:flex; gap:8px;">
            <button class="btn" id="set-export">导出事件流 (CSV)</button>
            <button class="btn" id="set-clearev">清空事件流</button>
          </div>
          <div class="hint">导出用系统另存为对话框；清空仅影响界面视图，磁盘证据流不受影响。</div>
        </div>
      </div>
    </div>`;
  rootEl = root;

  (document.getElementById("set-lang") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setLanguage", { value: (e.target as HTMLSelectElement).value });
  (document.getElementById("set-theme") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setTheme", { value: (e.target as HTMLSelectElement).value });
  (document.getElementById("set-baseline") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setBaselineDays", { value: parseInt((e.target as HTMLSelectElement).value, 10) });
  (document.getElementById("set-evidence") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setEvidenceDays", { value: parseInt((e.target as HTMLSelectElement).value, 10) });
  (document.getElementById("set-cap") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setEvidenceCap", { value: parseInt((e.target as HTMLSelectElement).value, 10) });
  (document.getElementById("set-pause") as HTMLInputElement).onchange = (e) =>
    sendCommand("setBaselinePaused", { value: (e.target as HTMLInputElement).checked });
  (document.getElementById("set-cleanup") as HTMLButtonElement).onclick = () => sendCommand("cleanupNow");
  (document.getElementById("set-audit") as HTMLButtonElement).onclick = () => sendCommand("enableAudit");
  (document.getElementById("set-loopback") as HTMLInputElement).onchange = (e) =>
    sendCommand("setHideLoopback", { value: (e.target as HTMLInputElement).checked });
  (document.getElementById("set-export") as HTMLButtonElement).onclick = () => sendCommand("exportEvents");
  (document.getElementById("set-clearev") as HTMLButtonElement).onclick = () => sendCommand("clearEvents");
  let searchTimer = 0;
  (document.getElementById("set-search") as HTMLInputElement).oninput = (e) => {
    window.clearTimeout(searchTimer);
    const v = (e.target as HTMLInputElement).value;
    searchTimer = window.setTimeout(() => sendCommand("setSearch", { value: v }), 300);
  };
}

let lastSettingsApplied = "";

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  const st = s.settings;
  const state = JSON.stringify([st.language, st.theme, st.baselineDays, st.evidenceDays, st.evidenceCap, st.baselinePaused, st.hideLoopback]);
  if (state === lastSettingsApplied) return;
  lastSettingsApplied = state;

  const lang = document.getElementById("set-lang") as HTMLSelectElement;
  const theme = document.getElementById("set-theme") as HTMLSelectElement;
  if (document.activeElement !== lang) lang.value = st.language;
  if (document.activeElement !== theme) theme.value = st.theme;

  const bl = document.getElementById("set-baseline") as HTMLSelectElement;
  const ev = document.getElementById("set-evidence") as HTMLSelectElement;
  const cap = document.getElementById("set-cap") as HTMLSelectElement;
  if ([30, 90, 365, 0].includes(st.baselineDays)) bl.value = String(st.baselineDays);
  if ([3, 7, 30, 0].includes(st.evidenceDays)) ev.value = String(st.evidenceDays);
  if ([128, 512, 2048].includes(st.evidenceCap)) cap.value = String(st.evidenceCap);
  (document.getElementById("set-pause") as HTMLInputElement).checked = st.baselinePaused;
  (document.getElementById("set-loopback") as HTMLInputElement).checked = st.hideLoopback;
  const searchEl = document.getElementById("set-search") as HTMLInputElement;
  if (document.activeElement !== searchEl && searchEl.value !== st.searchText) searchEl.value = st.searchText;

  const storage = document.getElementById("set-storage")!;
  if (storage.textContent !== st.storageInfo) storage.textContent = st.storageInfo;

  const auditBtn = document.getElementById("set-audit") as HTMLButtonElement;
  auditBtn.style.display = st.auditEnabled ? "none" : "";
}
