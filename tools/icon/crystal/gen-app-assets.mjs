// 应用图标资产生成：从定稿 logo（polished3.png）产出
//  1) src/NetLens/Assets/app.ico —— 多尺寸 ICO（16/24/32/48/64/128/256，PNG 压缩条目）
//  2) WebUI/public/brand.png + brand-light.png —— 顶栏 logo（单资产策略：两文件同内容）
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const SRC = 'S:/ZWorker/NetWatch/verify/logo-final/polished3.png';
const img = PNG.sync.read(readFileSync(SRC));
const W = img.width, H = img.height;

// ---- 裁切到 alpha 包围盒 + 6% 边距，取正方形 ----
let x0 = W, x1 = -1, y0 = H, y1 = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const a = img.data[((y * W + x) << 2) + 3];
  if (a > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
}
const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
const margin = Math.round(Math.max(bw, bh) * 0.06);
const side = Math.max(bw, bh) + margin * 2;
const cx = Math.round((x0 + x1 + 1) / 2), cy = Math.round((y0 + y1 + 1) / 2);
const L = cx - Math.floor(side / 2), T = cy - Math.floor(side / 2);
console.log('alpha bbox:', bw + 'x' + bh, '→ square', side + 'px @', L + ',' + T);

// ---- 预乘 alpha 的盒式缩放（裁切正方形 → 目标尺寸） ----
function resize(size) {
  const out = Buffer.alloc(size * size * 4);
  const fx = side / size, fy = side / size;
  for (let ty = 0; ty < size; ty++) {
    const cy0 = Math.floor(ty * fy), cy1 = Math.max(cy0 + 1, Math.ceil((ty + 1) * fy));
    for (let tx = 0; tx < size; tx++) {
      const cx0 = Math.floor(tx * fx), cx1 = Math.max(cx0 + 1, Math.ceil((tx + 1) * fx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let cy = cy0; cy < cy1; cy++) for (let cx = cx0; cx < cx1; cx++) {
        const sxp = L + cx, syp = T + cy; // 画布坐标（裁切原点 + 偏移）
        if (sxp < 0 || syp < 0 || sxp >= W || syp >= H) { n++; continue; }
        const i = (syp * W + sxp) << 2;
        const al = img.data[i + 3] / 255;
        r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++;
      }
      const o = (ty * size + tx) << 2;
      if (a > 0) {
        out[o] = Math.min(255, Math.round(r / a));
        out[o + 1] = Math.min(255, Math.round(g / a));
        out[o + 2] = Math.min(255, Math.round(b / a));
        out[o + 3] = Math.round(255 * a / n);
      }
    }
  }
  return out;
}
function encodePNG(rgba, size) {
  const png = new PNG({ width: size, height: size });
  rgba.copy ? rgba.copy(png.data) : png.data.set(rgba);
  return PNG.sync.write(png);
}

// ---- 多尺寸生成 ----
const SIZES = [256, 128, 64, 48, 32, 24, 16];
const blobs = SIZES.map(size => {
  const rgba = resize(size);
  return { size, data: encodePNG(rgba, size) };
});

// ---- ICO 打包（PNG 压缩条目，Vista+ 标准） ----
function packICO(items) {
  const count = items.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4);
  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const datas = [];
  items.forEach((it, i) => {
    const e = entries.subarray(i * 16, (i + 1) * 16);
    e[0] = it.size >= 256 ? 0 : it.size;
    e[1] = it.size >= 256 ? 0 : it.size;
    e[2] = 0; e[3] = 0;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(it.data.length, 8); e.writeUInt32LE(offset, 12);
    offset += it.data.length;
    datas.push(it.data);
  });
  return Buffer.concat([header, entries, ...datas]);
}
const ico = packICO(blobs);
writeFileSync('S:/ZWorker/NetWatch/src/NetLens/Assets/app.ico', ico);
console.log('app.ico:', ico.length, 'bytes, sizes', SIZES.join('/'));

// ---- 顶栏品牌图（112px，4x of 28 显示） ----
const brandRgba = resize(112);
const brandPng = encodePNG(brandRgba, 112);
writeFileSync('S:/ZWorker/NetWatch/WebUI/public/brand.png', brandPng);
writeFileSync('S:/ZWorker/NetWatch/WebUI/public/brand-light.png', brandPng);
console.log('brand.png / brand-light.png: 112x112 (同内容单资产)');

// ---- 验证预览：256 尺寸深/浅底合成 ----
for (const [name, bg] of [['dark', [13, 17, 23]], ['white', [255, 255, 255]]]) {
  const png = new PNG({ width: 256, height: 256 });
  const rgba = resize(256);
  for (let p = 0; p < 256 * 256; p++) {
    const i = p << 2;
    const a = rgba[i + 3] / 255;
    for (let k = 0; k < 3; k++) png.data[i + k] = Math.round(rgba[i + k] * a + bg[k] * (1 - a));
    png.data[i + 3] = 255;
  }
  writeFileSync(`S:/ZWorker/NetWatch/verify/logo-final/icon-256-${name}.png`, PNG.sync.write(png));
}
console.log('verification previews written');
