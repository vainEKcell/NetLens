import { Snapshot } from "../api";
import { sendCommand } from "../api";
import { t } from "../i18n";

let rootEl: HTMLElement | null = null;

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>${t("nc.title")}</h1>
      <div class="sub">${t("nc.sub")}</div>
    </div>
    <div class="card">
      <div style="display:flex; align-items:center; gap:14px;">
        <button class="btn primary" id="nc-run">${t("nc.run")}</button>
        <span class="text-dim" id="nc-progress" style="font-size:12px;"></span>
      </div>
      <div class="hint" id="nc-note">${t("nc.note")}</div>
    </div>

    <div class="grid2">
      <div>
        <div class="card">
          <h2>${t("nc.nat")}</h2>
          <div class="big" id="nc-nat">—</div>
          <div class="kv" style="margin-top:6px;">
            <span class="k">${t("nc.external")}</span><span class="v" id="nc-nat-ext">—</span>
          </div>
          <div class="hint" id="nc-nat-detail" style="white-space:pre-line;"></div>
        </div>

        <div class="card">
          <h2>${t("nc.speed")}</h2>
          <div class="hint" id="nc-speed-progress" style="margin:0 0 6px;"></div>
          <div class="grid2">
            <div>
              <div class="hint" style="margin:0;">${t("nc.down")}</div>
              <div class="big" id="nc-speed-down">—</div>
            </div>
            <div>
              <div class="hint" style="margin:0;">${t("nc.up")}</div>
              <div class="big" id="nc-speed-up">—</div>
            </div>
          </div>
          <div style="margin-top:8px; font-weight:600;" id="nc-speed-tier"></div>
          <div class="hint" id="nc-speed-node" style="margin-top:4px;"></div>
          <div class="hint">${t("nc.speed.hint")}</div>
        </div>

        <div class="card">
          <h2>${t("nc.ping")}</h2>
          <div class="hint" style="margin:0 0 8px;">${t("nc.ping.hint")}</div>
          <div id="nc-pings"></div>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>${t("nc.analysis")}</h2>
          <div id="nc-scenarios"></div>
          <div class="hint" id="nc-peak" style="margin-top:6px;"></div>
          <div class="kv" style="margin-top:8px;">
            <span class="k">${t("nc.link")}</span><span class="v" id="nc-link">—</span>
            <span class="k">${t("nc.linkspeed")}</span><span class="v" id="nc-linkspeed">—</span>
            <span class="k">${t("nc.wifi")}</span><span class="v" id="nc-wifi">—</span>
            <span class="k">${t("nc.ssid")}</span><span class="v" id="nc-ssid">—</span>
            <span class="k">${t("nc.mtu")}</span><span class="v" id="nc-mtu">—</span>
          </div>
        </div>

        <div class="card">
          <h2>${t("nc.conclusion")}</h2>
          <div class="big" id="nc-verdict" style="margin-bottom:8px;">—</div>
          <div id="nc-advices"></div>
        </div>
      </div>
    </div>`;
  rootEl = root;
  (document.getElementById("nc-run") as HTMLButtonElement).onclick = () => sendCommand("runNetCheck");
  // 验证通道：--spike:netcheck?autostart=1 时自动开始体检
  if ((window as unknown as { __autostartNetCheck?: boolean }).__autostartNetCheck) {
    (window as unknown as { __autostartNetCheck?: boolean }).__autostartNetCheck = false;
    window.setTimeout(() => sendCommand("runNetCheck"), 600);
  }
}


export function onSnapshot(s: Snapshot): void {
  if (!rootEl) return;
  const n = s.netcheck;
  const set = (id: string, v: string | null) => {
    const el = document.getElementById(id);
    if (el && el.textContent !== v) el.textContent = v ?? "—";
  };

  set("nc-progress", n.progress);
  const runBtn = document.getElementById("nc-run") as HTMLButtonElement;
  runBtn.disabled = n.running;

  set("nc-nat", n.nat);
  set("nc-nat-ext", n.natExternal);
  const natDetail = document.getElementById("nc-nat-detail")!;
  if (natDetail.textContent !== n.natDetail) natDetail.textContent = n.natDetail;

  set("nc-speed-progress", n.speed.progress);
  set("nc-speed-down", n.speed.down || "—");
  set("nc-speed-up", n.speed.up || "—");
  set("nc-speed-tier", n.speed.tier);
  set("nc-speed-node", n.speed.node);

  const pings = document.getElementById("nc-pings")!;
  const pingHtml = n.pings.length
    ? `<div class="ping-row head"><span>${t("nc.ping.target")}</span><span class="r">${t("nc.ping.avg")}</span><span class="r">${t("nc.ping.jitter")}</span><span class="r">${t("nc.ping.loss")}</span><span class="r">${t("nc.ping.p95")}</span><span class="r">${t("nc.ping.quality")}</span></div>`
      + n.pings.map((p) => `
        <div class="ping-row" data-tip="${escapeHtml(p.TargetIp)}">
          <span class="name">${escapeHtml(p.Target)}</span>
          <span class="r">${escapeHtml(p.AvgText)}</span>
          <span class="r">${escapeHtml(p.JitterText)}</span>
          <span class="r">${escapeHtml(p.LossText)}</span>
          <span class="r">${escapeHtml(p.P95Text)}</span>
          <span class="r ${p.QualityClass}">${escapeHtml(p.QualityText)}</span>
        </div>`).join("")
    : "";
  if (pings.innerHTML !== pingHtml) pings.innerHTML = pingHtml;

  const sc = document.getElementById("nc-scenarios")!;
  const scHtml = n.scenarios.map((x) => `
    <div class="scenario-row">
      <span>${escapeHtml(x.Name)}</span>
      <span class="${x.Class}">${escapeHtml(x.Verdict)}</span>
    </div>`).join("");
  if (sc.innerHTML !== scHtml) sc.innerHTML = scHtml;

  set("nc-peak", n.peak);
  set("nc-link", n.linkType);
  set("nc-linkspeed", n.linkSpeed);
  set("nc-wifi", n.wifiSignal || "—");
  set("nc-ssid", n.ssid || "—");
  set("nc-mtu", n.mtu);

  const verdictEl = document.getElementById("nc-verdict")!;
  verdictEl.textContent = n.verdict;
  verdictEl.className = `big ${n.verdictClass}`;
  const adv = document.getElementById("nc-advices")!;
  const advHtml = n.advices.map((a) => `<div class="advice">${escapeHtml(a)}</div>`).join("");
  if (adv.innerHTML !== advHtml) adv.innerHTML = advHtml;
}

function escapeHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
