import { Snapshot, sendCommand } from "../api";
import { t } from "../i18n";
import { replayTour } from "../tour";

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
          </div>
          <div class="hint">${t("set.close.hint")}</div>
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
            <button class="btn" id="set-tour">${t("tour.rerun")}</button>
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
      </div>
    </div>`;
  rootEl = root;

  (document.getElementById("set-lang") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setLanguage", { value: (e.target as HTMLSelectElement).value });
  (document.getElementById("set-theme") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setTheme", { value: (e.target as HTMLSelectElement).value });
  (document.getElementById("set-close") as HTMLSelectElement).onchange = (e) =>
    sendCommand("setCloseAction", { value: (e.target as HTMLSelectElement).value });
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
  (document.getElementById("set-tour") as HTMLButtonElement).onclick = () => replayTour();
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
  const state = JSON.stringify([st.language, st.theme, st.closeAction, st.baselineDays, st.evidenceDays, st.evidenceCap, st.baselinePaused, st.hideLoopback]);
  if (state === lastSettingsApplied) return;
  lastSettingsApplied = state;

  const lang = document.getElementById("set-lang") as HTMLSelectElement;
  const theme = document.getElementById("set-theme") as HTMLSelectElement;
  const closeSel = document.getElementById("set-close") as HTMLSelectElement;
  if (document.activeElement !== lang) lang.value = st.language;
  if (document.activeElement !== theme) theme.value = st.theme;
  if (document.activeElement !== closeSel && ["ask", "exit", "tray"].includes(st.closeAction))
    closeSel.value = st.closeAction;

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
