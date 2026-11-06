// 实验：对比删除 #133a53 层前后的 dark 渲染（定位纹理碎线）
import { Resvg } from 'file:///S:/ZWorker/NetWatch/tools/icon/node_modules/@resvg/resvg-js/index.js';
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('source.svg', 'utf8');
const paths = [...src.matchAll(/<path fill="([^"]+)" d="([^"]+)"\/>/g)].map(m => ({ fill: m[1], d: m[2] }));
console.log('paths:', paths.map(p => p.fill).join(', '));

const darkMap = {
  '#031928': '#0D1117', '#5abed7': '#4FC3F7', '#317e9a': '#2196D4',
  '#48a8c1': '#42AEE8', '#276b88': '#E8E4C8', '#1f5973': '#F5F8FA',
  '#133a53': '#DCE2E8',
};

function build(keep) {
  const inner = paths.filter(p => keep.includes(p.fill)).map(p => {
    const fill = darkMap[p.fill] ?? p.fill;
    return `<path fill="${fill}" d="${p.d}"/>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="518 163 290 290" width="290" height="290">
  <defs><clipPath id="cr"><rect x="518" y="163" width="290" height="290" rx="52"/></clipPath></defs>
  <g clip-path="url(#cr)">
    <rect x="518" y="163" width="290" height="290" fill="#0D1117"/>
${inner}
  </g>
</svg>`;
}

for (const [name, keep] of [
  ['with-133a', ['#031928', '#5abed7', '#1f5973', '#133a53', '#276b88', '#317e9a', '#48a8c1', '#ffffff']],
  ['without-133a', ['#031928', '#5abed7', '#1f5973', '#276b88', '#317e9a', '#48a8c1', '#ffffff']],
]) {
  const r = new Resvg(build(keep), { fitTo: { mode: 'width', value: 256 } });
  writeFileSync(`S:/ZWorker/NetWatch/verify/logo-final/test-${name}.png`, r.render().asPng());
  console.log(name, 'rendered');
}
