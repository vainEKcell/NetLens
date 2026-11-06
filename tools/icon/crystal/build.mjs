// 晶体图标构建：candidate-3 裁剪晶体区域（viewBox 特写）→ 多尺寸渲染 → ICO 打包 → 同步部署
import { Resvg } from 'file:///S:/ZWorker/NetWatch/tools/icon/node_modules/@resvg/resvg-js/index.js';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const outIco = join(root, 'src', 'NetLens', 'Assets', 'app.ico');
const brandPublic = join(root, 'WebUI', 'public', 'brand.png');
const distBrand = join(root, 'WebUI', 'dist', 'brand.png');
const exeFile = join(root, 'src', 'NetLens', 'bin', 'Debug', 'net10.0-windows', 'NetLens.exe');

const SIZES = [256, 128, 64, 48, 32, 24, 20, 16];

// 晶体特写 SVG：viewBox 直接取晶体区域（含原底色层，一并裁入）
const src = readFileSync(join(here, 'candidate-3.svg'), 'utf8');
let body = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
// 黑底适配：原设计为白底深色细线——暗色层逐级提亮、细线加粗，保证黑底上清晰
const colorMap = {
  '#133A53': '#1E6E92',
  '#1F5973': '#2E96BE',
  '#276B88': '#46B4DC',
  '#317E9A': '#5CC8E8',
  '#48A8C1': '#82DCF4',
  '#5ABED7': '#9CE8FA',
};
for (const [a, b] of Object.entries(colorMap)) body = body.split(a).join(b);
body = body.replace(/stroke-width="0\.1"/g, 'stroke-width="0.6"');
const cropSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="524 110 272 272" width="272" height="272">
  <defs>
    <clipPath id="cr"><rect x="524" y="110" width="272" height="272" rx="46"/></clipPath>
  </defs>
  <g clip-path="url(#cr)">
    <rect x="524" y="110" width="272" height="272" fill="#07080C"/>
${body}
  </g>
</svg>`;

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

const pngs = SIZES.map((size) => {
  const r = new Resvg(cropSvg, { fitTo: { mode: 'width', value: size } });
  return { size, data: r.render().asPng() };
});

writeFileSync(outIco, packIco(pngs));
writeFileSync(join(here, 'icon-crystal-preview.png'), pngs.find(p => p.size === 256).data);
copyFileSync(join(here, 'icon-crystal-preview.png'), brandPublic);

execSync('npm run build', { cwd: join(root, 'WebUI'), stdio: 'pipe' });
if (!existsSync(distBrand)) throw new Error('dist build failed');
copyFileSync(distBrand, join(here, '..', 'icon-crystal-dist-check.png'));

const ps = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
execSync(`${ps} -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class SN { [DllImport(\\"shell32.dll\\")] public static extern void SHChangeNotify(int e, uint f, IntPtr a, IntPtr b); }'; [SN]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)"`, { stdio: 'pipe' });

if (existsSync(exeFile)) {
  const cmd = `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Icon]::ExtractAssociatedIcon('${exeFile.replaceAll('\\', '\\\\')}'); $i.ToBitmap().Save('${join(here, 'taskmgr-embed-check.png').replaceAll('\\', '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)`;
  execSync(`"${ps}" -NoProfile -Command "${cmd.replaceAll('"', '\\"')}"`, { encoding: 'utf8' });
  console.log('exe embedded icon extracted');
}
console.log('ICO written:', outIco);
console.log('brand synced (public + dist); shell cache refreshed');
