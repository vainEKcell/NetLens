// NetLens 主题徽章构建（最终版）：
//   晶体切面保留源设计原生配色（黑底上层次天然成立，与用户参照图一致）
//   双层裁剪：外层=圆角图标外框；内层=主晶体区域（区域外的白色水印碎线被裁除）
//   纹理碎线清理：#133a53 层内嵌的细碎装饰子段按长度过滤（保留切面主体）
//   深色版：底 #0D1117（融入应用深色）；浅色版：底 #FFFFFF（融入应用浅色）
import { Resvg } from 'file:///S:/ZWorker/NetWatch/tools/icon/node_modules/@resvg/resvg-js/index.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'logo-final');
mkdirSync(outDir, { recursive: true });

const SIZES = [256, 128, 64, 48, 32];

const src = readFileSync(join(here, 'source.svg'), 'utf8');
let body = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// 纹理碎线清理：#133a53 层（深青切面层）内嵌大量细碎子段（生成器纹理），
// 按子段长度过滤——保留 >=280 字符的切面主体段，删除细碎装饰段
body = body.replace(/(<path fill="#133a53" d=")([^"]+)("\/>)/g, (full, head, d, tail) => {
  const segs = d.split(/(?=M)/g).filter(s => s.length >= 280);
  if (!segs.length) return '';
  return head + segs.join('') + tail;
});

// 主晶体区域（像素分析）：x 550-776、y 181-436；裁剪框略放
const CB = { x: 546, y: 176, w: 236, h: 266 };

function build(base) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="518 163 290 290" width="290" height="290">
  <defs>
    <clipPath id="cr"><rect x="518" y="163" width="290" height="290" rx="52"/></clipPath>
    <clipPath id="cb"><rect x="${CB.x}" y="${CB.y}" width="${CB.w}" height="${CB.h}"/></clipPath>
  </defs>
  <g clip-path="url(#cr)">
    <rect x="518" y="163" width="290" height="290" fill="${base}"/>
    <g clip-path="url(#cb)">
${body}
    </g>
  </g>
</svg>`;
}

for (const [name, base] of [['logo-dark', '#0D1117'], ['logo-light', '#FFFFFF']]) {
  const svg = build(base);
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } });
  writeFileSync(join(outDir, `${name}.png`), r.render().asPng());
  console.log(`${name}.png written`);
}
console.log('output:', outDir);
