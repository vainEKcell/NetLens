// 品牌批量重命名：NetWatch -> NetLens（一次性迁移工具）
// 规则：
//  - 扫描 src/（.cs .xaml .csproj .props .manifest）+ 根目录（.ps1 .iss .md）+ WebUI（.html .ts .css .json）
//  - 排除 obj/ bin/ dist/ node_modules/ .git/ verify/
//  - 全文替换 "NetWatch" -> "NetLens"
//  - 例外（替换后修正）：FirewallService 旧规则前缀兼容在别处手工处理
const fs = require("fs");
const path = require("path");

const root = "S:/ZWorker/NetWatch";
const skipDirs = new Set(["obj", "bin", "dist", "node_modules", ".git", "verify", ".zcode", "publish", "dist"]);
const exts = new Set([".cs", ".xaml", ".csproj", ".props", ".manifest", ".ps1", ".iss", ".md", ".html", ".ts", ".css", ".json"]);

let files = 0, hits = 0;
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) { walk(full); continue; }
    if (!exts.has(path.extname(name))) continue;
    const text = fs.readFileSync(full, "utf8");
    if (!text.includes("NetWatch")) continue;
    const count = (text.match(/NetWatch/g) || []).length;
    fs.writeFileSync(full, text.split("NetWatch").join("NetLens"));
    files++; hits += count;
    console.log(`${full.replace(root + "/", "")}  (${count})`);
  }
}

walk(root + "/src");
walk(root + "/WebUI");
for (const f of ["build-installer.ps1", "publish.ps1", "setup.iss", "README.md"]) {
  const full = path.join(root, f);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, "utf8");
  if (!text.includes("NetWatch")) continue;
  const count = (text.match(/NetWatch/g) || []).length;
  fs.writeFileSync(full, text.split("NetWatch").join("NetLens"));
  files++; hits += count;
  console.log(`${f}  (${count})`);
}
console.log(`\nDONE: ${files} files, ${hits} replacements`);
