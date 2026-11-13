import { Snapshot, sendCommand } from "../api";
import { t } from "../i18n";

let rootEl: HTMLElement | null = null;

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("set.title")}</h1>
      <div class="sub">${t("set.sub")}</div>
    </div>
    <div class="grid2">
      <div>
        <div class="card">
          <h2>${t("set.appearance")}</h2>
          <div class="kv" style="grid-template-columns: 90px 220px; row-gap: 10px;">
            <span class="k">${t("set.lang")}</span>
            <select id="set-lang">
              <option value="auto">${t("set.lang.auto")}</option>
              <option value="zh">${t("set.lang.zh")}</option>
              <option value="en">${t("set.lang.en")}</option>
            </select>
            <span class="k">${t("set.theme")}</span>
            <select id="set-theme">
              <option value="auto">${t("set.theme.auto")}</option>
              <option value="dark">${t("set.theme.dark")}</option>
              <option value="light">${t("set.theme.light")}</option>
            </select>
            <span class="k">${t("set.close")}</span>
            <select id="set-close">
              <option value="ask">${t("set.close.ask")}</option>
              <option value="exit">${t("set.close.exit")}</option>
              <option value="tray">${t("set.close.tray")}</option>
            </select>
            <span class="k">${t("set.minimize")}</span>
            <select id="set-min">
              <option value="tray">${t("set.minimize.tray")}</option>
              <option value="taskbar">${t("set.minimize.taskbar")}</option>
            </select>
          </div>
          <div class="hint">${t("set.close.hint")}</div>
          <div class="hint">${t("set.minimize.hint")}</div>
          <div class="hint">${t("set.lang.hint")}</div>
        </div>

        <div class="card">
          <h2>${t("set.data")}</h2>
          <div class="kv" style="grid-template-columns: 90px 220px; row-gap: 10px;">
            <span class="k">${t("set.baseline")}</span>
            <select id="set-baseline">
              <option value="30">${t("set.b30")}</option>
              <option value="90">${t("set.b90")}</option>
              <option value="365">${t("set.b365")}</option>
              <option value="0">${t("set.b0")}</option>
            </select>
            <span class="k">${t("set.evidence")}</span>
            <select id="set-evidence">
              <option value="3">${t("set.e3")}</option>
              <option value="7">${t("set.e7")}</option>
              <option value="30">${t("set.e30")}</option>
              <option value="0">${t("set.b0")}</option>
            </select>
            <span class="k">${t("set.cap")}</span>
            <select id="set-cap">
              <option value="128">${t("set.c128")}</option>
              <option value="512">${t("set.c512")}</option>
              <option value="2048">${t("set.c2048")}</option>
            </select>
            <span class="k">${t("set.baselinePause")}</span>
            <label style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="set-pause" /> ${t("set.baselinePause.hint")}
            </label>
          </div>
          <div class="hint" id="set-storage" style="margin-top:8px;">—</div>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="btn" id="set-cleanup">${t("set.cleanup")}</button>
            <button class="btn" id="set-audit" style="display:none;">${t("set.audit")}</button>
          </div>
          <div style="margin-top:10px;">
            <button class="btn" id="set-guide">${t("set.openGuide")}</button>
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>${t("set.overview")}</h2>
          <div class="kv" style="grid-template-columns: 90px 220px; row-gap: 10px;">
            <span class="k">${t("set.loopback")}</span>
            <label style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="set-loopback" /> ${t("set.loopback.hint")}
            </label>
            <span class="k">${t("set.search")}</span>
            <input type="text" id="set-search" placeholder="${t("set.search.ph")}" style="width: 100%;" />
          </div>
        </div>
        <div class="card">
          <h2>${t("set.events")}</h2>
          <div style="display:flex; gap:8px;">
            <button class="btn" id="set-export">${t("set.export")}</button>
            <button class="btn" id="set-clearev">${t("set.clear")}</button>
          </div>
          <div class="hint">${t("set.clear.hint")}</div>
        </div>
        <div class="card">
          <h2>${t("set.about")}</h2>
          <div class="sub" style="margin-top:2px;">${t("set.about.sub")}</div>
          <div class="kv" style="grid-template-columns: 90px 220px; row-gap: 10px; margin-top: 10px;">
            <span class="k">${t("set.upd.current")}</span>
            <span id="upd-current">—</span>
          </div>
          <div class="hint" id="upd-state" style="margin-top:8px;">—</div>
          <div id="upd-progress" style="display:none; margin-top:8px; height:6px; border-radius:3px; background:rgba(128,128,128,.25); overflow:hidden;">
            <div id="upd-bar" style="height:100%; width:0%; background:#4d8dff; border-radius:3px; transition: width .3s;"></div>
          </div>
          <div id="upd-notes" style="display:none; margin-top:10px; white-space:pre-wrap; font-size:12px; line-height:1.6; opacity:.85; max-height:180px; overflow:auto; border-top:1px solid rgba(128,128,128,.2); padding-top:8px;"></div>
          <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
            <button class="btn" id="upd-check">${t("set.upd.check")}</button>
            <button class="btn" id="upd-dl" style="display:none;">${t("set.upd.download")}</button>
            <button class="btn" id="upd-releases">${t("set.upd.releases")}</button>
            <button class="btn" id="upd-repo">${t("set.upd.repo")}</button>
          </div>
          <div class="hint">${t("set.upd.err.hint")}</div>
        </div>
      </div>
    </div>`;
  rootEl = root;

  (document.getElementById("set-lang") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setLanguage", { value: (e.target as HTMLSelectElement).value });
  (document.getElementById("set-theme") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setTheme", { value: (e.target as HTMLSelectElement).value });
  (document.getElementById("set-close") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setCloseAction", { value: (e.target as HTMLSelectElement).value });
  (document.getElementById("set-min") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setMinimizeAction", { value: (e.target as HTMLSelectElement).value });
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
  (document.getElementById("set-guide") as HTMLButtonElement).onclick = () => { location.hash = "#/guide"; };
  (document.getElementById("set-loopback") as HTMLInputElement).onchange = (e) =>
    sendCommand("setHideLoopback", { value: (e.target as HTMLInputElement).checked });
  (document.getElementById("set-export") as HTMLButtonElement).onclick = () => sendCommand("exportEvents");
  (document.getElementById("set-clearev") as HTMLButtonElement).onclick = () => sendCommand("clearEvents");
  (document.getElementById("upd-check") as HTMLButtonElement).onclick = () => sendCommand("update.check");
  (document.getElementById("upd-releases") as HTMLButtonElement).onclick = () =>
    sendCommand("update.openPage", { which: "releases" });
  (document.getElementById("upd-repo") as HTMLButtonElement).onclick = () =>
    sendCommand("update.openPage", { which: "repo" });
  (document.getElementById("upd-dl") as HTMLButtonElement).onclick = () =>
    sendCommand(updDlAction === "install" ? "update.install" : "update.download");
  let searchTimer = 0;
  (document.getElementById("set-search") as HTMLInputElement).oninput = (e) => {
    window.clearTimeout(searchTimer);
    const v = (e.target as HTMLInputElement).value;
    searchTimer = window.setTimeout(() => sendCommand("setSearch", { value: v }), 300);
  };
}

let lastSettingsApplied = "";
let updDlAction = "download"; // download / install（随阶段切换）

export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  renderUpdate(s.update); // 更新状态每次快照都渲染（自带去重门），必须在设置项早退门之前
  const st = s.settings;
  const state = JSON.stringify([st.language, st.theme, st.closeAction, st.minimizeAction, st.baselineDays, st.evidenceDays, st.evidenceCap, st.baselinePaused, st.hideLoopback]);
  if (state === lastSettingsApplied) return;
  lastSettingsApplied = state;

  const lang = document.getElementById("set-lang") as HTMLSelectElement;
  const theme = document.getElementById("set-theme") as HTMLSelectElement;
  const closeSel = document.getElementById("set-close") as HTMLSelectElement;
  const minSel = document.getElementById("set-min") as HTMLSelectElement;
  if (document.activeElement !== lang) lang.value = st.language;
  if (document.activeElement !== theme) theme.value = st.theme;
  if (document.activeElement !== closeSel && ["ask", "exit", "tray"].includes(st.closeAction))
    closeSel.value = st.closeAction;
  if (document.activeElement !== minSel && ["tray", "taskbar"].includes(st.minimizeAction))
    minSel.value = st.minimizeAction;

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

  renderUpdate(s.update);
}

// ---- 关于与更新：随快照渲染状态 ----
let lastUpdRender = "";
function renderUpdate(up: Snapshot["update"]): void {
  const state = JSON.stringify([up.phase, up.progress, up.latestVersion, up.error, up.notes]);
  if (state === lastUpdRender) return;
  lastUpdRender = state;

  const curEl = document.getElementById("upd-current")!;
  if (curEl.textContent !== up.currentVersion) curEl.textContent = up.currentVersion;

  const stateEl = document.getElementById("upd-state")!;
  const dlBtn = document.getElementById("upd-dl") as HTMLButtonElement;
  const prog = document.getElementById("upd-progress")!;
  const bar = document.getElementById("upd-bar")!;
  const notes = document.getElementById("upd-notes")!;
  const checkBtn = document.getElementById("upd-check") as HTMLButtonElement;

  let stateText = "—";
  let dlLabel = "";
  updDlAction = "download";
  let showNotes = false;

  switch (up.phase) {
    case "checking":
      stateText = t("set.upd.checking");
      break;
    case "available":
      stateText = `${t("set.upd.available")}：v${up.latestVersion}`;
      dlLabel = t("set.upd.download");
      showNotes = true;
      break;
    case "upToDate":
      stateText = `${t("set.upd.uptodate")}（v${up.latestVersion}）`;
      break;
    case "downloading":
      stateText = `${t("set.upd.downloading")} ${up.progress}%`;
      showNotes = true;
      break;
    case "ready":
      stateText = t("set.upd.ready");
      dlLabel = t("set.upd.install");
      updDlAction = "install";
      showNotes = true;
      break;
    case "error":
      stateText = `${t("set.upd.error")}：${up.error}`;
      dlLabel = t("set.upd.redownload");
      break;
    default:
      stateText = "—";
  }

  stateEl.textContent = stateText;
  const busy = up.phase === "checking" || up.phase === "downloading";
  checkBtn.disabled = busy;
  dlBtn.style.display = dlLabel ? "" : "none";
  if (dlBtn.textContent !== dlLabel) dlBtn.textContent = dlLabel;
  prog.style.display = up.phase === "downloading" ? "" : "none";
  bar.style.width = up.progress + "%";
  notes.style.display = showNotes && up.notes ? "" : "none";
  if (showNotes && notes.textContent !== up.notes) notes.textContent = up.notes;
}
