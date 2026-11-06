// 晶体图标构建（双主题）：深色主题用提亮晶体（黑底可辨），浅色主题用原生深青晶体
// 输出：app.ico（深色变体）+ brand.png（深色变体）+ brand-light.png（浅色主题 WebUI 切换用）
import { Resvg } from 'file:///S:/ZWorker/NetWatch/tools/icon/node_modules/@resvg/resvg-js/index.js';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const outIco = join(root, 'src', 'NetLens', 'Assets', 'app.ico');
const brandPublic = join(root, 'WebUI', 'public', 'brand.png');
const brandLightPublic = join(root, 'WebUI', 'public', 'brand-light.png');
const distBrand = join(root, 'WebUI', 'dist', 'brand.png');
const distBrandLight = join(root, 'WebUI', 'dist', 'brand-light.png');
const exeFile = join(root, 'src', 'NetLens', 'bin', 'Debug', 'net10.0-windows', 'NetLens.exe');

const SIZES = [256, 128, 64, 48, 32, 24, 20, 16];

const src = readFileSync(join(here, 'source.svg'), 'utf8');
let body = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// 双主题配色映射（切面逐级提亮，保持明暗层次；浅色主题保留原生深青）
const darkMap = {
  '#031928': '#0E2233',
  '#133a53': '#1E5B85',
  '#1f5973': '#2E86B0',
  '#276b88': '#3FA9D4',
  '#317e9a': '#54C2E8',
  '#48a8c1': '#74D4F0',
  '#5abed7': '#96E4F8',
};
const lightMap = {
  '#031928': '#0C1D2E',
};

function applyMap(text, map) {
  let out = text;
  for (const [a, b] of Object.entries(map)) out = out.split(a).join(b);
  return out;
}

function crop(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="518 163 290 290" width="290" height="290">
  <defs>
    <clipPath id="cr"><rect x="518" y="163" width="290" height="290" rx="52"/></clipPath>
  </defs>
  <g clip-path="url(#cr)">
    <rect x="518" y="163" width="290" height="290" fill="${inner.base}"/>
${inner.body}
  </g>
</svg>`;
}

const darkSvg = crop({ base: '#07080C', body: applyMap(body, darkMap) });
const lightSvg = crop({ base: '#031928', body: applyMap(body, lightMap) });

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

const darkPngs = SIZES.map((size) => {
  const r = new Resvg(darkSvg, { fitTo: { mode: 'width', value: size } });
  return { size, data: r.render().asPng() };
});
const lightPngs = SIZES.map((size) => {
  const r = new Resvg(lightSvg, { fitTo: { mode: 'width', value: size } });
  return { size, data: r.render().asPng() };
});

writeFileSync(outIco, packIco(darkPngs));
writeFileSync(join(here, 'icon-crystal-preview.png'), darkPngs.find(p => p.size === 256).data);
writeFileSync(join(here, 'icon-crystal-light-preview.png'), lightPngs.find(p => p.size === 256).data);
copyFileSync(join(here, 'icon-crystal-preview.png'), brandPublic);
copyFileSync(join(here, 'icon-crystal-light-preview.png'), brandLightPublic);

execSync('npm run build', { cwd: join(root, 'WebUI'), stdio: 'pipe' });
if (!existsSync(distBrand) || !existsSync(distBrandLight)) throw new Error('dist build failed');
copyFileSync(distBrand, join(here, '..', 'icon-crystal-dist-check.png'));

const ps = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
execSync(`${ps} -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class SN { [DllImport(\\"shell32.dll\\")] public static extern void SHChangeNotify(int e, uint f, IntPtr a, IntPtr b); }'; [SN]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)"`, { stdio: 'pipe' });

if (existsSync(exeFile)) {
  const cmd = `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Icon]::ExtractAssociatedIcon('${exeFile.replaceAll('\\', '\\\\')}'); $i.ToBitmap().Save('${join(here, 'taskmgr-embed-check.png').replaceAll('\\', '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)`;
  execSync(`"${ps}" -NoProfile -Command "${cmd.replaceAll('"', '\\"')}"`, { encoding: 'utf8' });
  console.log('exe embedded icon extracted');
}
console.log('ICO written:', outIco);
console.log('brand synced (public + dist, dark + light); shell cache refreshed');
