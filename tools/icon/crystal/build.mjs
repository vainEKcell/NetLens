// NetLens 主题徽章构建（v2）：
//   主体=右下正视晶体（完整六边形宝石，像素定位 x 934-1046、y 712-834）
//   双层裁剪：外层=圆角图标外框；内层=晶体范围（区域外的水印/组合标被裁除）
//   深色版：底 #0D1117（融入应用深色）+ 青切面→天蓝、深色部分→白/亮卡其
//   浅色版：底 #FFFFFF + 黑沿用、青切面→深蓝/海蓝
import { Resvg } from 'file:///S:/ZWorker/NetWatch/tools/icon/node_modules/@resvg/resvg-js/index.js';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const outIco = join(root, 'src', 'NetLens', 'Assets', 'app.ico');
const brandPublic = join(root, 'WebUI', 'public', 'brand.png');
const outDir = join(here, '..', 'logo-final');
mkdirSync(outDir, { recursive: true });

const SIZES = [256, 128, 64, 48, 32];

const src = readFileSync(join(here, 'source.svg'), 'utf8');
const body = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// 右下正视晶体（像素分析）：x 934-1046、y 712-834；裁剪框略放
const CB = { x: 930, y: 708, w: 122, h: 132 };

// 双主题扁平配色（切面间鲜明深浅对比）
const darkMap = {
  '#031928': '#0D1117',
  '#133a53': '#2E86B0',
  '#1f5973': '#46A8D0',
  '#276b88': '#5AC0E4',
  '#317e9a': '#78D2F0',
  '#48a8c1': '#9CE2F6',
  '#5abed7': '#C4F0FC',
  '#ffffff': '#FFFFFF',
};
const lightMap = {
  '#031928': '#12324A',
  '#133a53': '#1B5E86',
  '#1f5973': '#2E86B0',
  '#276b88': '#46A8CC',
  '#317e9a': '#5AC0DC',
  '#48a8c1': '#7AD0E4',
  '#5abed7': '#A0E0F0',
  '#ffffff': '#FFFFFF',
};

function build(map, base) {
  let b = body;
  for (const [a, c] of Object.entries(map)) b = b.split(a).join(c);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CB.x} ${CB.y} ${CB.w} ${CB.h}" width="${CB.w}" height="${CB.h}">
  <defs>
    <clipPath id="cr"><rect x="${CB.x}" y="${CB.y}" width="${CB.w}" height="${CB.h}" rx="26"/></clipPath>
  </defs>
  <rect x="${CB.x}" y="${CB.y}" width="${CB.w}" height="${CB.h}" fill="${base}"/>
${b}
</svg>`;
}

const SIZES_DARK = SIZES;
const outDirDark = join(outDir);
const darkPngs = SIZES_DARK.map((size) => {
  const r = new Resvg(build(darkMap, '#0D1117'), { fitTo: { mode: 'width', value: size } });
  return { size, data: r.render().asPng() };
});

// ICO 打包
function packIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6 + 16 * count);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4);
  let offset = 6 + 16 * count;
  const chunks = [];
  pngs.forEach((p, i) => {
    const b = p.size === 256 ? 0 : p.size;
    const e = header.subarray(6 + 16 * i, 6 + 16 * (i + 1));
    e.writeUInt8(b, 0); e.writeUInt8(b, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(p.data.length, 8); e.writeUInt32LE(offset, 12);
    offset += p.data.length;
    chunks.push(p.data);
  });
  return Buffer.concat([header, ...chunks]);
}

writeFileSync(outIco, packIco(darkPngs));
writeFileSync(join(here, 'icon-preview-dark.png'), darkPngs.find(p => p.size === 256).data);
copyFileSync(join(here, 'icon-preview-dark.png'), brandPublic);

const lightPngs = SIZES.map((size) => {
  const r = new Resvg(build(lightMap, '#FFFFFF'), { fitTo: { mode: 'width', value: size } });
  return { size, data: r.render().asPng() };
});
writeFileSync(join(here, 'icon-preview-light.png'), lightPngs.find(p => p.size === 256).data);
copyFileSync(join(here, 'icon-preview-light.png'), join(root, 'WebUI', 'public', 'brand-light.png'));

console.log('dark/light previews + ICO written');
console.log('output:', outDir);
