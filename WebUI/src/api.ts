// C# ⇄ WebUI 的唯一通道（与 src/NetWatch/Bridge/UiBridge.cs 对应）：
// C# 每秒 push snapshot；前端仅发送 {name:"pause"|"resume"} 命令。
export interface OverviewRow {
  pid: number;
  name: string;
  down: number;
  up: number;
  downTotal: number;
  upTotal: number;
  conns: number;
  risk: number;
}

export interface Snapshot {
  type: "snapshot";
  tick: number;
  totals: { up: number; down: number };
  rows: OverviewRow[];
}

type Listener = (s: Snapshot) => void;

export function onSnapshot(fn: Listener): void {
  window.chrome.webview.addEventListener("message", (ev) => {
    const msg = ev.data as Snapshot;
    if (msg && msg.type === "snapshot") fn(msg);
  });
}

export function sendCommand(name: "pause" | "resume"): void {
  window.chrome.webview.postMessage({ name });
}

export function fmtSpeed(bytesPerSec: number): string {
  const u = ["B/s", "KB/s", "MB/s", "GB/s"];
  let v = bytesPerSec;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`;
}

export function fmtBytes(b: number): string {
  const u = ["B", "KB", "MB", "GB"];
  let v = b;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`;
}

declare global {
  interface Window {
    chrome: { webview: {
      addEventListener(type: "message", cb: (ev: { data: unknown }) => void): void;
      postMessage(msg: unknown): void;
    } };
  }
}
