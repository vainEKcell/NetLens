// 逐层渲染定位：dark 映射下每层单独渲染，找出碎纹所在层
import { Resvg } from 'file:///S:/ZWorker/NetWatch/tools/icon/node_modules/@resvg/resvg-js/index.js';
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('source.svg', 'utf8');
const layers = [...src.matchAll(/<path fill="([^"]+)" d="([^"]+)"\/>/g)].map(m => ({ fill: m[1], d: m[2] }));

const darkMap = {
  '#031928': '#0E2233', '#133a53': '#2E86B0', '#1f5973': '#46A8D0',
  '#276b88': '#5AC0E4', '#317e9a': '#78D2F0', '#48a8c1': '#9CE2F6',
  '#5abed7': '#C4F0FC', '#ffffff': '#FFFFFF',
};

for (const layer of layers) {
  const fill = darkMap[layer.fill] ?? layer.fill;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="518 163 290 290" width="290" height="290">
  <rect x="518" y="163" width="290" height="290" fill="#0D1117"/>
  <path fill="${fill}" d="${layer.d}"/>
</svg>`;
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } });
  const name = layer.fill.replace('#', '');
  writeFileSync(`layer-${name}.png`, r.render().asPng());
  console.log(name, 'rendered');
}
