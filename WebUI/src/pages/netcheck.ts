import { Snapshot } from "../api";
import { sendCommand } from "../api";

let rootEl: HTMLElement | null = null;

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-head">
      <h1>网络体检</h1>
      <div class="sub">NAT 类型探测、网关与公网延迟测量、带宽测试一键完成，全程约半分钟</div>
    </div>
    <div class="card">
      <div style="display:flex; align-items:center; gap:14px;">
        <button class="btn primary" id="nc-run">开始网络体检</button>
        <span class="text-dim" id="nc-progress" style="font-size:12px;"></span>
      </div>
      <div class="hint" id="nc-note">检测仅在点击按钮时产生网络流量，平时不占用带宽。</div>
    </div>

    <div class="grid2">
      <div>
        <div class="card">
          <h2>NAT 类型</h2>
          <div class="big" id="nc-nat">—</div>
          <div class="kv" style="margin-top:6px;">
            <span class="k">外部地址</span><span class="v" id="nc-nat-ext">—</span>
          </div>
          <div class="hint" id="nc-nat-detail" style="white-space:pre-line;"></div>
        </div>

        <div class="card">
          <h2>带宽测试</h2>
          <div class="hint" id="nc-speed-progress" style="margin:0 0 6px;"></div>
          <div class="grid2">
            <div>
              <div class="hint" style="margin:0;">下行</div>
              <div class="big" id="nc-speed-down">—</div>
            </div>
            <div>
              <div class="hint" style="margin:0;">上行（参考）</div>
              <div class="big" id="nc-speed-up">—</div>
            </div>
          </div>
          <div style="margin-top:8px; font-weight:600;" id="nc-speed-tier"></div>
          <div class="hint" id="nc-speed-node" style="margin-top:4px;"></div>
          <div class="hint">自动选择节点拉流采样，剔除 TCP 慢启动阶段后计算平均与峰值并估算宽带档位；测速走直连、不经过代理。</div>
        </div>

        <div class="card">
          <h2>延迟 / 抖动 / 丢包</h2>
          <div class="hint" style="margin:0 0 8px;">网关是路由器，反映内网状况；两个公共 DNS 是公网参考点。看「平均」即可：网关接近 0 属正常，公网约 20~40 ms 属正常。</div>
          <div id="nc-pings"></div>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>综合分析</h2>
          <div id="nc-scenarios"></div>
          <div class="hint" id="nc-peak" style="margin-top:6px;"></div>
          <div class="kv" style="margin-top:8px;">
            <span class="k">连接方式</span><span class="v" id="nc-link">—</span>
            <span class="k">链路速率</span><span class="v" id="nc-linkspeed">—</span>
            <span class="k">Wi-Fi 信号</span><span class="v" id="nc-wifi">—</span>
            <span class="k">网络名称</span><span class="v" id="nc-ssid">—</span>
            <span class="k">路径 MTU</span><span class="v" id="nc-mtu">—</span>
          </div>
        </div>

        <div class="card">
          <h2>体检结果</h2>
          <div class="big" id="nc-verdict" style="margin-bottom:8px;">—</div>
          <div id="nc-advices"></div>
        </div>
      </div>
    </div>`;
  rootEl = root;
  (document.getElementById("nc-run") as HTMLButtonElement).onclick = () => sendCommand("runNetCheck");
}

const stClass = (t: string) =>
  /优秀|良好|正常/.test(t) ? "st-good" : /一般|参考/.test(t) ? "st-fair" : /较差|不足|可疑/.test(t) ? "st-poor" : "";

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
    ? `<div class="ping-row head"><span>目标</span><span class="r">平均</span><span class="r">抖动</span><span class="r">丢包率</span><span class="r">P95 延迟</span><span class="r">质量</span></div>`
      + n.pings.map((p) => `
        <div class="ping-row" title="${escapeHtml(p.TargetIp)}">
          <span class="name">${escapeHtml(p.Target)}</span>
          <span class="r">${escapeHtml(p.AvgText)}</span>
          <span class="r">${escapeHtml(p.JitterText)}</span>
          <span class="r">${escapeHtml(p.LossText)}</span>
          <span class="r">${escapeHtml(p.P95Text)}</span>
          <span class="r ${stClass(p.QualityText)}">${escapeHtml(p.QualityText)}</span>
        </div>`).join("")
    : "";
  if (pings.innerHTML !== pingHtml) pings.innerHTML = pingHtml;

  const sc = document.getElementById("nc-scenarios")!;
  const scHtml = n.scenarios.map((x) => `
    <div class="scenario-row">
      <span>${escapeHtml(x.Name)}</span>
      <span class="${stClass(x.Verdict)}">${escapeHtml(x.Verdict)}</span>
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
  verdictEl.className = `big ${stClass(n.verdict)}`;
  const adv = document.getElementById("nc-advices")!;
  const advHtml = n.advices.map((a) => `<div class="advice">${escapeHtml(a)}</div>`).join("");
  if (adv.innerHTML !== advHtml) adv.innerHTML = advHtml;
}

function escapeHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
