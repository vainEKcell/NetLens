// 涂色版保真处理管线 v2（原色逐像素保留，禁止任何改色）
//  1) 直读源文件；黑线与边缘混色壳 → 按单元分布决策：单一单元/近贴对 → 原色延伸填充；多单元分界 → 透明缝
//  2) 干净内部（不贴黑线的彩色像素）→ 原色原样保留
//  3) MERGE_GROUPS 合并组 = 一片晶片（组内缝填充、组间缝保留）
//  4) alpha：填充/内部 = 1，缝/边界由羽化平滑（2px 软边）
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { Resvg } from 'file:///S:/ZWorker/NetWatch/tools/icon/node_modules/@resvg/resvg-js/index.js';

const SRC = 'C:/Users/eastk/Desktop/涂色版.png';
const img = PNG.sync.read(readFileSync(SRC));
const W = img.width, H = img.height, N = W * H;
const INF = 30000;
console.log('source:', SRC, W + 'x' + H);

// ---- 合并配置（按编号切面图填入；空 = 全部分离） ----
const MERGE_GROUPS = [
  [1, 3, 5, 8],       // 顶部→左上弧
  [10, 15, 12, 19],   // 左侧弧
  [21, 23, 25, 27],   // 左下弧
  [22, 24, 26, 28],   // 右下弧
  [11, 13, 16, 20],   // 右侧弧
  [2, 4, 6, 9],       // 顶部→右上弧
];
// 中央四切面（7/14/17/18）色彩覆写：同族天蓝系鲜亮四阶（无深色融入块）
const TONE_LIB = {
  icy:    { l: 0.86, h: 197, s: 0.50 },  // 冰青
  bright: { l: 0.70, h: 203, s: 0.66 },  // 亮天蓝
  sky:    { l: 0.62, h: 205, s: 0.75 },  // 鲜亮天蓝
  vivid:  { l: 0.50, h: 218, s: 0.85 },  // 鲜亮湛蓝
};
const CENTER_OVERRIDE = { 7: 'icy', 17: 'bright', 14: 'sky', 18: 'vivid' };
// 近贴边界对（缝宽压到最小）
const SMALL_GAP_PAIRS = [[7, 17], [14, 18]];

// ---- 分类 ----
const dark = new Uint8Array(N), colored = new Uint8Array(N), trans = new Uint8Array(N);
for (let p = 0; p < N; p++) {
  const i = p << 2;
  if (img.data[i + 3] < 128) { trans[p] = 1; continue; }
  if (Math.max(img.data[i], img.data[i + 1], img.data[i + 2]) < 90) dark[p] = 1;
  else colored[p] = 1;
}

// ---- 彩色连通域 = 切面 ----
const regionId = new Int32Array(N).fill(-1);
const regions = [];
const queue = new Int32Array(N);
for (let p0 = 0; p0 < N; p0++) {
  if (!colored[p0] || regionId[p0] !== -1) continue;
  const id = regions.length;
  let head = 0, tail = 0;
  queue[tail++] = p0; regionId[p0] = id;
  let area = 0, sx = 0, sy = 0;
  while (head < tail) {
    const p = queue[head++]; area++;
    const px = p % W, py = (p / W) | 0;
    sx += px; sy += py;
    if (px > 0 && colored[p - 1] && regionId[p - 1] === -1) { regionId[p - 1] = id; queue[tail++] = p - 1; }
    if (px < W - 1 && colored[p + 1] && regionId[p + 1] === -1) { regionId[p + 1] = id; queue[tail++] = p + 1; }
    if (py > 0 && colored[p - W] && regionId[p - W] === -1) { regionId[p - W] = id; queue[tail++] = p - W; }
    if (py < H - 1 && colored[p + W] && regionId[p + W] === -1) { regionId[p + W] = id; queue[tail++] = p + W; }
  }
  regions.push({ id, area, cx: sx / area, cy: sy / area });
}
const big = regions.filter(r => r.area >= 60);
console.log('colored regions:', regions.length, '(main ' + big.length + ')');

// ---- 合并组解析（编号 = big 顺序，1 起） ----
const regionNum = new Int32Array(regions.length);
big.forEach((r, i) => {
  r.num = i + 1;
  regionNum[r.id] = r.num;
  const gid = MERGE_GROUPS.find(g => g.includes(r.num));
  r.mergeKey = gid ? 'G' + MERGE_GROUPS.indexOf(gid) : 'F' + r.num;
});
const groupMap = new Map();
for (const r of big) {
  if (!groupMap.has(r.mergeKey)) groupMap.set(r.mergeKey, { key: r.mergeKey, members: [] });
  groupMap.get(r.mergeKey).members.push(r);
}
const groupsList = [...groupMap.values()];
const unitOfFacet = new Map();
groupsList.forEach((g, gi) => { for (const m of g.members) unitOfFacet.set(m.id, gi); });
console.log('units:', groupsList.length, '| merge groups:', MERGE_GROUPS.length);

// ---- 边缘混色壳（彩色且贴黑线）——先于近源 BFS 计算 ----
const shellOf = new Uint8Array(N);
for (let p = 0; p < N; p++) if (colored[p]) {
  const px = p % W, py = (p / W) | 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const xx = px + dx, yy = py + dy;
    if (xx >= 0 && yy >= 0 && xx < W && yy < H && dark[yy * W + xx]) { shellOf[p] = 1; }
  }
}

// ---- 全局最近干净彩色像素 BFS（多源；用于原色延伸填充；壳像素不含在种子内） ----
const nearDist = new Int16Array(N).fill(INF);
const nearSrc = new Int32Array(N).fill(-1);
{
  let head = 0, tail = 0;
  const bigSet = new Set(big.map(r => r.id));
  for (let p = 0; p < N; p++) if (colored[p] && !shellOf[p] && bigSet.has(regionId[p])) { nearDist[p] = 0; nearSrc[p] = p; queue[tail++] = p; }
  while (head < tail) {
    const p = queue[head++];
    const d = nearDist[p];
    if (d >= 30) continue;
    const px = p % W, py = (p / W) | 0;
    const step = (np) => {
      if (colored[np] || nearDist[np] <= d + 1) return;
      nearDist[np] = d + 1; nearSrc[np] = nearSrc[p]; queue[tail++] = np;
    };
    if (px > 0) step(p - 1);
    if (px < W - 1) step(p + 1);
    if (py > 0) step(p - W);
    if (py < H - 1) step(p + W);
  }
}

// ---- 每像素最近两个大切面（穿过黑线 BFS）+ 外部距离 ----
const d1 = new Int16Array(N).fill(INF), f1 = new Int32Array(N).fill(-1);
const d2 = new Int16Array(N).fill(INF), f2 = new Int32Array(N).fill(-1);
{
  const dist = new Int16Array(N);
  for (const r of big) {
    dist.fill(INF);
    let head = 0, tail = 0;
    for (let p = 0; p < N; p++) if (regionId[p] === r.id) { dist[p] = 0; queue[tail++] = p; }
    while (head < tail) {
      const p = queue[head++];
      const d = dist[p];
      if (d >= 30) continue;
      const px = p % W, py = (p / W) | 0;
      const step = (np) => {
        if (colored[np] || dist[np] <= d + 1) return;
        dist[np] = d + 1; queue[tail++] = np;
      };
      if (px > 0) step(p - 1);
      if (px < W - 1) step(p + 1);
      if (py > 0) step(p - W);
      if (py < H - 1) step(p + W);
    }
    for (let k = 0; k < tail; k++) {
      const p = queue[k], d = dist[p];
      if (d < d1[p]) { d2[p] = d1[p]; f2[p] = f1[p]; d1[p] = d; f1[p] = r.id; }
      else if (d < d2[p]) { d2[p] = d; f2[p] = r.id; }
    }
  }
}
const distOut = new Int16Array(N).fill(INF);
{
  let head = 0, tail = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (!dark[p]) continue;
    let border = false;
    for (let dy = -1; dy <= 1 && !border; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H || trans[yy * W + xx]) { border = true; break; }
    }
    if (border) { distOut[p] = 1; queue[tail++] = p; }
  }
  while (head < tail) {
    const p = queue[head++];
    const d = distOut[p];
    if (d >= 60) continue;
    const px = p % W, py = (p / W) | 0;
    const step = (np) => {
      if (!dark[np] || distOut[np] <= d + 1) return;
      distOut[np] = d + 1; queue[tail++] = np;
    };
    if (px > 0) step(p - 1);
    if (px < W - 1) step(p + 1);
    if (py > 0) step(p - W);
    if (py < H - 1) step(p + W);
  }
}

// ---- 非干净像素的单元归属判定（半径 5 内的单元分布） ----
// 干净内部 = 彩色且不贴黑线（原色保留）；其余（黑线 ∪ 边缘混色壳）按下列规则：
//   半径 5 内仅见单一单元 → 填充（原色延伸）
//   半径 5 内恰为近贴对的两个单元 → 填充（缝宽压到最小，alpha 0.75）
//   半径 5 内见其他多单元组合 → 透明缝
const nonClean = new Uint8Array(N);
for (let p = 0; p < N; p++) if (dark[p] || shellOf[p]) nonClean[p] = 1;

const pixelUnit = new Int32Array(N).fill(-1);
const pixelAlpha = new Float32Array(N);
const painted = new Uint8Array(N);
// 干净内部（彩色且不贴黑线）→ 原色保留、alpha 1
for (let p = 0; p < N; p++) {
  if (painted[p] || !colored[p]) continue;
  const u = unitOfFacet.get(regionId[p]);
  if (u === undefined) continue; // 微小色岛：稍后视作透明
  pixelUnit[p] = u; pixelAlpha[p] = 1; painted[p] = 1;
}
{
  let nFill = 0, nSeam = 0, nSkip = 0;
  for (let p = 0; p < N; p++) {
    if (!nonClean[p] || f1[p] < 0) continue;
    if (distOut[p] <= 4) { nSkip++; continue; } // 外框带/端点圆头 → 透明（顶点色点根除）
    const g1 = unitOfFacet.get(f1[p]);
    if (g1 === undefined) { nSkip++; continue; } // 贴微小色岛的黑线 → 透明（色岛已并入邻近单元）
    const near2 = f2[p] >= 0 && (d2[p] - d1[p]) <= 8;
    const g2 = near2 ? unitOfFacet.get(f2[p]) : null;
    if (!near2) { nSkip++; continue; } // 单侧贴色（暗格边/孤立线）→ 透明
    if (g1 === g2) { // 组内缝：填充（原色延伸）
      pixelUnit[p] = groupsList.indexOf(g1); pixelAlpha[p] = 1; painted[p] = 1; nFill++;
      continue;
    }
    // 组间缝：窄缝渐变；近贴对（7/17、14/18）间距压到最小
    const dd = d1[p] - d2[p];
    const ad = Math.abs(dd);
    const n1 = regionNum[f1[p]], n2 = regionNum[f2[p]];
    const small = SMALL_GAP_PAIRS.some(pr => (pr[0] === n1 && pr[1] === n2) || (pr[0] === n2 && pr[1] === n1));
    const alpha = small
      ? (ad <= 1 ? 0.60 : ad === 2 ? 0.85 : 1)
      : (ad <= 2 ? (ad <= 1 ? 0.10 : 0.25) : ad === 3 ? 0.45 : ad === 4 ? 0.65 : ad === 5 ? 0.85 : 1);
    const nearerUnit = dd <= 0 ? g1 : g2;
    pixelUnit[p] = groupsList.indexOf(nearerUnit); pixelAlpha[p] = alpha; painted[p] = 1;
    nSeam++;
  }
  console.log('non-clean pixels: filled', nFill, '| between-unit seam', nSeam, '| transparent', nSkip);
}

// ---- 渲染：已涂像素保留原色（填充像素=最近彩色像素原色延伸），未涂全透明 ----
const out = new PNG({ width: W, height: H });
out.data.set(img.data);
for (let p = 0; p < N; p++) {
  const i = p << 2;
  if (!painted[p]) { out.data[i] = 0; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 0; continue; }
  if (dark[p] || shellOf[p]) { // 黑线/混色壳上的填充像素：复制最近干净彩色像素的原始 RGB（原色延伸）
    const s = nearSrc[p];
    if (s >= 0) { out.data[i] = img.data[s << 2]; out.data[i + 1] = img.data[(s << 2) + 1]; out.data[i + 2] = img.data[(s << 2) + 2]; }
  }
  out.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, pixelAlpha[p])));
}

// ---- 中央四切面（7/14/17/18）：采用指定色调（取自各组已用色） ----
function hsl2rgb([h, s, l]) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))); };
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}
{
  const centerRgb = new Map();
  groupsList.forEach((g, gi) => {
    if (g.members.length !== 1) return;
    const key = CENTER_OVERRIDE[g.members[0].num];
    if (!key) return;
    const t = TONE_LIB[key];
    centerRgb.set(gi, hsl2rgb([t.h, t.s, t.l]));
  });
  let n = 0;
  for (let p = 0; p < N; p++) {
    const u = pixelUnit[p];
    if (u === -1 || !centerRgb.has(u)) continue;
    const [R, G, B] = centerRgb.get(u);
    const i = p << 2;
    out.data[i] = Math.round(R); out.data[i + 1] = Math.round(G); out.data[i + 2] = Math.round(B);
    n++;
  }
  console.log('center facets recolored pixels:', n);
}

// ---- 抛光亮边（1-2px 向白，全边界） ----
{
  const painted2 = new Uint8Array(N);
  for (let p = 0; p < N; p++) if (pixelAlpha[p] >= 0.9) painted2[p] = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (!painted2[p]) continue;
    let near = 0;
    for (let dy = -2; dy <= 2 && near < 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const r2 = Math.max(Math.abs(dx), Math.abs(dy));
      if (r2 < 1) continue;
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H || !painted2[yy * W + xx]) { near = r2; break; }
    }
    if (!near) continue;
    const k = near === 1 ? 0.14 : 0.07;
    const i = p << 2;
    out.data[i] = Math.min(255, Math.round(out.data[i] + (255 - out.data[i]) * k));
    out.data[i + 1] = Math.min(255, Math.round(out.data[i + 1] + (255 - out.data[i + 1]) * k));
    out.data[i + 2] = Math.min(255, Math.round(out.data[i + 2] + (255 - out.data[i + 2]) * k));
  }
}

// ---- alpha 羽化（模糊体掩膜）——仅已涂像素；未涂强制全透明 ----
{
  const mask = new Float32Array(N);
  for (let p = 0; p < N; p++) mask[p] = painted[p] ? pixelAlpha[p] : 0;
  let a = Float32Array.from(mask);
  const R = 2, PASSES = 2;
  for (let it = 0; it < PASSES; it++) {
    const b = new Float32Array(N);
    for (let y = 0; y < H; y++) {
      const row = y * W;
      let sa = 0;
      for (let x = -R; x <= R; x++) { const xx = Math.min(W - 1, Math.max(0, x)); sa += a[row + xx]; }
      for (let x = 0; x < W; x++) {
        b[row + x] = sa / (2 * R + 1);
        const xAdd = Math.min(W - 1, x + R + 1), xRem = Math.max(0, x - R);
        sa += a[row + xAdd] - a[row + xRem];
      }
    }
    const c = new Float32Array(N);
    for (let x = 0; x < W; x++) {
      let sa = 0;
      for (let y = -R; y <= R; y++) { const yy = Math.min(H - 1, Math.max(0, y)); sa += b[yy * W + x]; }
      for (let y = 0; y < H; y++) {
        c[y * W + x] = sa / (2 * R + 1);
        const yAdd = Math.min(H - 1, y + R + 1), yRem = Math.max(0, y - R);
        sa += b[yAdd * W + x] - b[yRem * W + x];
      }
    }
    a = c;
  }
  for (let p = 0; p < N; p++) {
    const i = p << 2;
    if (!painted[p]) { out.data[i] = 0; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 0; continue; }
    out.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, a[p])));
  }
}

// ---- 输出（无旋转：图标保持源文件原姿态；仅收放按钮的转角动画另计）----
writeFileSync('S:/ZWorker/NetWatch/verify/logo-final/polished3.png', PNG.sync.write(out));
console.log('written: polished3.png (原色保真 + 合并，原姿态)');

// ---- 编号切面图 ----
{
  let texts = '';
  for (const r of big) {
    const cx = Math.round(r.cx), cy = Math.round(r.cy);
    texts += `<text x="${cx}" y="${cy + 12}" font-family="Arial" font-size="38" font-weight="bold" fill="none" stroke="#000000" stroke-width="8" text-anchor="middle">${r.num}</text>`;
    texts += `<text x="${cx}" y="${cy + 12}" font-family="Arial" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle">${r.num}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${texts}</svg>`;
  const rr = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: ['C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/arial.ttf'], loadSystemFonts: false, defaultFontFamily: 'Arial' },
  });
  const baseImg = PNG.sync.read(readFileSync('S:/ZWorker/NetWatch/verify/logo-final/polished3.png'));
  const darkBg = new PNG({ width: W, height: H });
  for (let p = 0; p < N; p++) {
    const i = p << 2;
    const a = baseImg.data[i + 3] / 255;
    darkBg.data[i] = Math.round(baseImg.data[i] * a + 13 * (1 - a));
    darkBg.data[i + 1] = Math.round(baseImg.data[i + 1] * a + 17 * (1 - a));
    darkBg.data[i + 2] = Math.round(baseImg.data[i + 2] * a + 23 * (1 - a));
    darkBg.data[i + 3] = 255;
  }
  const numImg = PNG.sync.read(rr.render().asPng());
  for (let p = 0; p < N; p++) {
    const i = p << 2;
    const a = numImg.data[i + 3] / 255;
    if (a > 0) for (let k = 0; k < 3; k++) darkBg.data[i + k] = Math.round(numImg.data[i + k] * a + darkBg.data[i + k] * (1 - a));
  }
  writeFileSync('S:/ZWorker/NetWatch/verify/logo-final/facet-map.png', PNG.sync.write(darkBg));
  console.log('written: facet-map.png');
}
