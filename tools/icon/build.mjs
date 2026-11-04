// NetLens 图标生产管线：icon.svg → resvg 渲染多尺寸 → ICO 打包 → 同步 brand/dist → shell 刷新 → exe 自检
// 用法：node build.mjs [--verify-only]
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const svgPath = join(here, 'icon.svg');
const outIco = join(root, 'src', 'NetLens', 'Assets', 'app.ico');
const brandPublic = join(root, 'WebUI', 'public', 'brand.png');
const distBrand = join(root, 'WebUI', 'dist', 'brand.png');
const exeFile = join(root, 'src', 'NetLens', 'bin', 'Debug', 'net10.0-windows', 'NetLens.exe');
const verifyOnly = process.argv.includes('--verify-only');

const SIZES = [256, 128, 64, 48, 32, 24, 20, 16];

// ---- ICO 打包：PNG buffer 数组 → ICO（PNG-in-ICO，256 记为 0） ----
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

if (!verifyOnly) {
  const svg = readFileSync(svgPath, 'utf8');
  mkdirSync(dirname(outIco), { recursive: true });

  // ---- resvg 渲染各尺寸（矢量直出，天然清晰） ----
  const pngs = SIZES.map((size) => {
    const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
    return { size, data: r.render().asPng() };
  });

  // ---- 256 预览 + ICO + brand 同步 ----
  writeFileSync(join(root, 'verify', 'icon-preview.png'), pngs.find(p => p.size === 256).data);
  writeFileSync(outIco, packIco(pngs));
  copyFileSync(join(root, 'verify', 'icon-preview.png'), brandPublic);

  // ---- 前端 dist 重建（应用加载 dist；不重建则置顶栏 logo 不更新） ----
  execSync('npm run build', { cwd: join(root, 'WebUI'), stdio: 'pipe' });
  if (!existsSync(distBrand)) throw new Error('dist build failed - brand.png missing');
  copyFileSync(distBrand, join(root, 'verify', 'diag-dist-brand.png'));

  // ---- shell 图标缓存刷新 ----
  const ps = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
  execSync(`${ps} -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class SN { [DllImport(\\"shell32.dll\\")] public static extern void SHChangeNotify(int e, uint f, IntPtr a, IntPtr b); }'; [SN]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)"`, { stdio: 'pipe' });

  // ---- 小尺寸实拍条（人工验收） ----  由 verify 脚本按需生成，此处省略
  console.log('ICO written:', outIco);
  console.log('brand.png synced (public + dist); shell cache refreshed');
}

// ---- exe 内嵌图标自检（build 后运行核对） ----
if (existsSync(exeFile)) {
  const ps = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
  const cmd = `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Icon]::ExtractAssociatedIcon('${exeFile.replaceAll('\\', '\\\\')}'); $i.ToBitmap().Save('${join(root, 'verify', 'diag-exe-icon.png').replaceAll('\\', '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png); Write-Output ('embedded ' + $i.Width + 'x' + $i.Height)`;
  console.log(execSync(`"${ps}" -NoProfile -Command "${cmd.replaceAll('"', '\\"')}"`, { encoding: 'utf8' }).trim());
} else {
  console.log('exe not found (build first), skip embedded check');
}
