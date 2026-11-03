// C# ⇄ WebUI 唯一通道（与 src/NetLens/Bridge/UiBridge.cs、SnapshotBuilder.cs 对应）

export interface OverviewRow {
  pid: number;
  name: string;
  down: number;
  up: number;
  downTotal: number;
  upTotal: number;
  conns: number;
  risk: number;
  path: string | null;
  vendor: string | null;
  signature: string | null;
}

export interface DetailInfo {
  pid: number;
  name: string;
  path: string | null;
  vendor: string | null;
  signature: string | null;
  signatureState: string | null;
  commandLine: string | null;
  parentPid: number | null;
  parentName: string | null;
  firstSeen: string | null;
  identityKey: string | null;
  identityName: string | null;
  identityKind: string | null;
  fileHash: string | null;
  firewallBlocked: boolean;
  riskReasons: string[];
  detailRisks: string[];
  recentDns: string[];
  services: { name: string; displayName: string }[];
  conns: { Remote: string; Local: string; Proto: string; State: string }[];
  verdict: {
    status: string;
    summary: string;
    riskByte: number;
    evidence: { Statement: string; Basis: string | null; Caveat: string | null; Weight: number }[];
  } | null;
}

export interface PingRow {
  Target: string;
  TargetIp: string;
  AvgText: string;
  JitterText: string;
  LossText: string;
  P95Text: string;
  QualityText: string;
  QualityClass: string;
}

export interface DnsStreamRow {
  time: string;
  process: string;
  domain: string;
  ips: string;
  alert: boolean;
  alertText: string;
}

export interface DohResult {
  Domain: string;
  LocalIps: string;
  RefIps: string;
  Verdict: string;
  RiskByte: number;
}

export interface EventRow {
  time: string;
  kind: string;
  process: string;
  detail: string;
  bytes: string;
  pid: number;
  remote: string | null;
  domain: string | null;
}

export interface Snapshot {
  type: "snapshot";
  paused: boolean;
  totals: { up: number; down: number; upAll: number; downAll: number };
  overview: { rows: OverviewRow[]; selectedPid: number };
  detail: DetailInfo | null;
  dns: {
    servers: string[];
    proxy: string;
    winhttp: string;
    hosts: string;
    stream: DnsStreamRow[];
    doh: {
      running: boolean;
      status: string;
      providerIndex: number;
      probes: string;
      results: DohResult[];
    };
  };
  netcheck: {
    running: boolean;
    progress: string;
    nat: string;
    natExternal: string;
    natDetail: string;
    linkType: string;
    linkSpeed: string;
    wifiSignal: string;
    ssid: string;
    mtu: string;
    pings: PingRow[];
    speed: { down: string; up: string; tier: string; node: string; progress: string };
    scenarios: { Name: string; Verdict: string; Class: string }[];
    peak: string;
    verdict: string;
    verdictClass: string;
    advices: string[];
  };
  events: {
    filterText: string;
    filterVisible: boolean;
    items: EventRow[];
  };
  destinations: {
    Display: string; Scope: string; UpText: string; DownText: string;
    LastText: string; ProcessesText: string;
  }[];
  ports: {
    ProtoText: string; Port: number; Bind: string; BindText: string;
    Pid: number; Process: string;
  }[];
  blocking: {
    apps: { DisplayName: string; Path: string; RulesText: string }[];
    trusted: { Key: string; DisplayName: string }[];
  };
  network: {
    adapters: { Name: string; Status: string; IpsText: string; GwText: string; DnsText: string }[];
    configHistory: { TimeText: string; WhatKey: string; OldRaw: string; NewRaw: string; Serious: boolean }[];
  };
  settings: {
    language: string; theme: string;
    baselineDays: number; evidenceDays: number; evidenceCap: number;
    baselinePaused: boolean; storageInfo: string; auditEnabled: boolean;
    hideLoopback: boolean; onlyFlagged: boolean; searchText: string;
  };
}

type Listener = (s: Snapshot) => void;
const listeners = new Set<Listener>();
let last: Snapshot | null = null;

export function onSnapshot(fn: Listener): void {
  listeners.add(fn);
  if (last) fn(last); // 新注册的页面立即拿到最近一次快照
}

export function sendCommand(name: string, extra: Record<string, unknown> = {}): void {
  window.chrome.webview.postMessage({ name, ...extra });
}

export function latestSnapshot(): Snapshot | null {
  return last;
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

export const riskNames = ["正常", "提示", "关注", "可疑"];
export const riskClass = ["", "risk-low", "risk-medium", "risk-high"];

export function dispatch(s: Snapshot): void {
  last = s;
  listeners.forEach((fn) => fn(s));
}

export function initBridge(): void {
  window.chrome.webview.addEventListener("message", (ev) => {
    const msg = ev.data as Snapshot;
    if (msg && msg.type === "snapshot") dispatch(msg);
  });
}

declare global {
  interface Window {
    chrome: { webview: {
      addEventListener(type: "message", cb: (ev: { data: unknown }) => void): void;
      postMessage(msg: unknown): void;
    } };
  }
}
