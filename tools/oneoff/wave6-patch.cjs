// wave 6 补丁：排序控件接入 + 分隔/checkbox 样式 + i18n 键
const fs = require("fs");
const base = "S:/ZWorker/NetWatch/WebUI/src/";

function apply(file, pairs, importLine) {
  let t = fs.readFileSync(base + file, "utf8");
  let miss = 0;
  for (const [old, neu] of pairs) {
    if (!t.includes(old)) { console.log("MISS", file, JSON.stringify(old.slice(0, 44))); miss++; continue; }
    t = t.split(old).join(neu);
  }
  if (importLine && !t.includes('sortctl')) {
    const idx = t.indexOf('import { t, agLocale }');
    if (idx >= 0) {
      const le = t.indexOf("\n", idx);
      t = t.slice(0, le + 1) + importLine + "\n" + t.slice(le + 1);
    }
  }
  fs.writeFileSync(base + file, t);
  console.log("done", file, miss ? `(${miss} missed)` : "");
}

// ---- overview：页头排序 ----
apply("pages/overview.ts", [
  [`    <div class="page-head">
      <h1>${"${t(\"ov.title\")}"}</h1>
      <div class="sub">${"${t(\"ov.sub\")}"}</div>
    </div>`,
   `    <div class="page-head" style="display:flex; align-items:baseline; gap:14px;">
      <div>
        <h1>${"${t(\"ov.title\")}"}</h1>
        <div class="sub">${"${t(\"ov.sub\")}"}</div>
      </div>
    </div>`],
  [`  detailBody = document.getElementById("detail-panel")!;
  selectedPidEl = detailBody;
  renderDetailEmpty();`,
   `  detailBody = document.getElementById("detail-panel")!;
  selectedPidEl = detailBody;
  renderDetailEmpty();

  const head = root.querySelector(".page-head") as HTMLElement;
  mountSortControl(head, api, [
    { key: "down", label: t("ov.col.down") },
    { key: "up", label: t("ov.col.up") },
    { key: "downTotal", label: t("ov.col.downTotal") },
    { key: "upTotal", label: t("ov.col.upTotal") },
    { key: "conns", label: t("ov.col.conns") },
    { key: "name", label: t("ov.col.name") },
    { key: "pid", label: t("ov.col.pid") },
  ], "down", "desc");`],
], 'import { mountSortControl } from "../sortctl";');

// ---- destinations ----
apply("pages/destinations.ts", [
  [`  rootEl = root;
  api = createGrid(document.getElementById("dst-grid")!, gridOptions);`,
   `  rootEl = root;
  api = createGrid(document.getElementById("dst-grid")!, gridOptions);
  const head = root.querySelector(".page-head") as HTMLElement;
  mountSortControl(head, api, [
    { key: "DownBytes", label: t("dst.col.down") },
    { key: "UpBytes", label: t("dst.col.up") },
    { key: "Display", label: t("dst.col.display") },
  ], "DownBytes", "desc");`],
], 'import { mountSortControl } from "../sortctl";');

// ---- ports ----
apply("pages/ports.ts", [
  [`  rootEl = root;
  api = createGrid(document.getElementById("port-grid")!, gridOptions);`,
   `  rootEl = root;
  api = createGrid(document.getElementById("port-grid")!, gridOptions);
  const head = root.querySelector(".page-head") as HTMLElement;
  mountSortControl(head, api, [
    { key: "Port", label: t("port.col.port") },
    { key: "Process", label: t("port.col.process") },
    { key: "Pid", label: t("port.col.pid") },
  ], "Port", "asc");`],
], 'import { mountSortControl } from "../sortctl";');

// ---- events ----
apply("pages/events.ts", [
  [`  rootEl = root;
  api = createGrid(document.getElementById("ev-grid")!, gridOptions);`,
   `  rootEl = root;
  api = createGrid(document.getElementById("ev-grid")!, gridOptions);
  const head = root.querySelector(".page-head") as HTMLElement;
  mountSortControl(head, api, [
    { key: "__i", label: t("ev.col.time") },
    { key: "Process", label: t("ev.col.process") },
    { key: "BytesText", label: t("ev.col.bytes") },
  ], "__i", "desc");`],
], 'import { mountSortControl } from "../sortctl";');

// ---- styles.css：分隔提亮 + checkbox + 排序控件样式 ----
{
  const p = base + "styles.css";
  let t = fs.readFileSync(p, "utf8");
  t = t.replace("--border: #1d2431;", "--border: #26304a;");
  const oldCb = `input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 15px; height: 15px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--panel2);
  cursor: pointer;
  position: relative;
  transition: all 0.12s;
  vertical-align: middle;
}
input[type="checkbox"]:hover { border-color: var(--accent); }
input[type="checkbox"]:checked {
  background: var(--accent);
  border-color: var(--accent);
}
input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 4.5px; top: 1.5px;
  width: 4px; height: 8px;
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(42deg);
}`;
  const newCb = `input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  flex: 0 0 auto;
  width: 16px; height: 16px;
  border: 1.5px solid var(--faint);
  border-radius: 4px;
  background: var(--panel2);
  cursor: pointer;
  position: relative;
  transition: all 0.12s;
  vertical-align: middle;
}
input[type="checkbox"]:hover { border-color: var(--accent); }
input[type="checkbox"]:checked {
  background: var(--accent);
  border-color: var(--accent);
}
input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 4.5px; top: 1px;
  width: 4px; height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(42deg);
}

/* 复选框与文字间距（此前挤压） */
label.tb-check, .tb-check input[type="checkbox"] {
  display: inline-flex;
  align-items: center;
}
.tb-check {
  color: var(--dim);
  font-size: 12.5px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  gap: 8px;
}
.tb-check:hover { color: var(--fg); }

/* 页头排序控件 */
.page-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
.page-head > div:first-child { min-width: 0; }
.sort-ctl { display: inline-flex; align-items: center; gap: 8px; }
.sort-label { color: var(--faint); font-size: 11.5px; }
.sort-select { min-width: 130px; }
.sort-dir { padding: 6px 12px; font-family: var(--mono); }`;
  if (!t.includes(oldCb)) { console.log("MISS styles checkbox"); }
  else t = t.replace(oldCb, newCb);
  fs.writeFileSync(p, t);
  console.log("done styles.css");
}

// ---- i18n：sort.label ----
{
  const p = base + "i18n.ts";
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes('"sort.label"')) {
    t = t.replace('"ag.noRows": "暂无数据",', '"sort.label": "排序",\n  "ag.noRows": "暂无数据",', 1);
    t = t.replace('"ag.noRows": "No data",', '"sort.label": "Sort",\n  "ag.noRows": "No data",', 1);
  }
  fs.writeFileSync(p, t);
  console.log("done i18n sort");
}
console.log("ALL DONE");
