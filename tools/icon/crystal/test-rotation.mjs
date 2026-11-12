// 旋转对比测试：±45°（与 ±30°）四版并排，确定 N 转正的方向
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const img = PNG.sync.read(readFileSync('S:/ZWorker/NetWatch/verify/logo-final/polished3.png'));
const W = img.width, H = img.height;

function rotate(src, deg) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const cxS = src.width / 2, cyS = src.height / 2;
  // 旋转后包围盒
  const pts = [[0, 0], [src.width, 0], [0, src.height], [src.width, src.height]].map(([x, y]) => {
    const dx = x - cxS, dy = y - cyS;
    return [cxS + dx * cos - dy * sin, cyS + dx * sin + dy * cos];
  });
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const NW = Math.ceil(Math.max(...xs) - Math.min(...xs));
  const NH = Math.ceil(Math.max(...ys) - Math.min(...ys));
  const cxT = NW / 2, cyT = NH / 2;
  const out = new PNG({ width: NW, height: NH });
  for (let ty = 0; ty < NH; ty++) for (let tx = 0; tx < NW; tx++) {
    const dx = tx - cxT, dy = ty - cyT;
    const sx = cxS + dx * cos + dy * sin;
    const sy = cyS - dx * sin + dy * cos;
    const i = (ty * NW + tx) << 2;
    if (sx < 0 || sy < 0 || sx >= src.width - 1 || sy >= src.height - 1) continue;
    const x0 = Math.floor(sx), y0 = Math.floor(sy);
    const fxs = sx - x0, fys = sy - y0;
    const si = (y0 * src.width + x0) << 2;
    for (let k = 0; k < 4; k++) {
      const v00 = src.data[si + k], v10 = src.data[si + 4 + k], v01 = src.data[si + src.width * 4 + k], v11 = src.data[si + src.width * 4 + 4 + k];
      out.data[i + k] = Math.round(v00 * (1 - fxs) * (1 - fys) + v10 * fxs * (1 - fys) + v01 * (1 - fxs) * fys + v11 * fxs * fys);
    }
  }
  return out;
}

// 四版并排（深底）：-45 / +45 / -30 / +30
const variants = [
  { deg: -45, label: '-45' },
  { deg: 45, label: '+45' },
  { deg: -30, label: '-30' },
  { deg: 30, label: '+30' },
];
const cell = 900, pad = 20;
const out = new PNG({ width: (cell + pad) * 2 + pad, height: (cell + pad) * 2 + pad });
for (let p = 0; p < out.width * out.height; p++) {
  const i = p << 2;
  out.data[i] = 13; out.data[i + 1] = 17; out.data[i + 2] = 23; out.data[i + 3] = 255;
}
variants.forEach((v, idx) => {
  const r = rotate(img, v.deg);
  const scaled = new PNG({ width: cell, height: cell });
  const fx = r.width / cell, fy = r.height / cell;
  for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
    const sx = Math.min(r.width - 1, Math.floor(x * fx)), sy = Math.min(r.height - 1, Math.floor(y * fy));
    const si = (sy * r.width + sx) << 2, di = (y * cell + x) << 2;
    const a = r.data[si + 3] / 255;
    for (let k = 0; k < 3; k++) scaled.data[di + k] = Math.round(r.data[si + k] * a + 13 * (1 - a));
    scaled.data[di + 3] = 255;
  }
  const col = idx % 2, row = Math.floor(idx / 2);
  const ox = pad + col * (cell + pad), oy = pad + row * (cell + pad);
  for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
    const si = (y * cell + x) << 2, di = ((oy + y) * out.width + (ox + x)) << 2;
    for (let k = 0; k < 4; k++) out.data[di + k] = scaled.data[si + k];
  }
});
writeFileSync('S:/ZWorker/NetWatch/verify/logo-final/rotation-test.png', PNG.sync.write(out));
console.log('rotation test written (-45 | +45 / -30 | +30)');
