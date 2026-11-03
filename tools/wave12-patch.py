# -*- coding: utf-8 -*-
import io, re

# ===== index.html：左段两行（暂停+搜索组 / 复选行），搜索按钮内嵌 =====
p = r"S:\ZWorker\NetWatch\WebUI\index.html"
with io.open(p, encoding="utf-8") as f:
    t = f.read()

old = (
    '    <header id="topbar">\n'
    '      <button id="nav-toggle" title="收起 / 展开导航">\n'
    '        <img src="/brand.png" width="24" height="24" alt="NetLens" />\n'
    '      </button>\n'
    '      <span id="brand-name">NetLens</span>\n'
    '      <div class="tb-sep"></div>\n'
    '      <button id="btn-pause" title="暂停监控">\n'
    '        <svg id="ic-pause" viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="3" y="2" width="3.6" height="12" rx="1"/><rect x="9.4" y="2" width="3.6" height="12" rx="1"/></svg>\n'
    '        <svg id="ic-play" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="display:none"><path d="M4 2l10 6-10 6z"/></svg>\n'
    '      </button>\n'
    '      <label class="tb-check"><input type="checkbox" id="tb-loopback" /><span id="tb-loopback-label">隐藏回环</span></label>\n'
    '      <label class="tb-check"><input type="checkbox" id="tb-flagged" /><span id="tb-flagged-label">仅看可疑</span></label>\n'
    '      <div class="search-group">\n'
    '        <input type="text" id="tb-search" placeholder="搜索 进程 / 路径 / PID" />\n'
    '        <button id="tb-search-btn" title="搜索">\n'
    '          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="7" cy="7" r="4.6"/><path d="M10.6 10.6L14 14"/></svg>\n'
    '        </button>\n'
    '      </div>\n'
    '      <div class="spacer"></div>'
)
new = (
    '    <header id="topbar">\n'
    '      <button id="nav-toggle" title="收起 / 展开导航">\n'
    '        <img src="/brand.png" width="24" height="24" alt="NetLens" />\n'
    '      </button>\n'
    '      <span id="brand-name">NetLens</span>\n'
    '      <div class="tb-sep"></div>\n'
    '      <div class="tb-left">\n'
    '        <div class="tb-row1">\n'
    '          <button id="btn-pause" title="暂停监控">\n'
    '            <svg id="ic-pause" viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="3" y="2" width="3.6" height="12" rx="1"/><rect x="9.4" y="2" width="3.6" height="12" rx="1"/></svg>\n'
    '            <svg id="ic-play" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="display:none"><path d="M4 2l10 6-10 6z"/></svg>\n'
    '          </button>\n'
    '          <div class="search-group">\n'
    '            <input type="text" id="tb-search" placeholder="搜索 进程 / 路径 / PID" />\n'
    '            <button id="tb-search-btn" title="搜索">\n'
    '              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="7" cy="7" r="4.6"/><path d="M10.6 10.6L14 14"/></svg>\n'
    '            </button>\n'
    '          </div>\n'
    '        </div>\n'
    '        <div class="tb-row2">\n'
    '          <label class="tb-check"><input type="checkbox" id="tb-loopback" /><span id="tb-loopback-label">隐藏回环</span></label>\n'
    '          <label class="tb-check"><input type="checkbox" id="tb-flagged" /><span id="tb-flagged-label">仅看可疑</span></label>\n'
    '        </div>\n'
    '      </div>\n'
    '      <div class="spacer"></div>'
)
assert old in t, "index anchor"
t = t.replace(old, new)
with io.open(p, "w", encoding="utf-8", newline="\n") as f:
    f.write(t)
print("html ok")

# ===== styles.css =====
p2 = r"S:\ZWorker\NetWatch\WebUI\src\styles.css"
with io.open(p2, encoding="utf-8") as f:
    t2 = f.read()

# 一体化壳
old2 = (
    "#app { display: flex; flex-direction: column; height: 100vh; }\n"
    "#body { flex: 1; display: flex; min-height: 0; }\n"
)
new2 = (
    "/* 一体化壳：状态栏与侧栏/内容视觉融合（贴合左右底边，顶部留 8px 呼吸） */\n"
    "#app {\n"
    "  display: flex; flex-direction: column;\n"
    "  height: calc(100vh - 8px);\n"
    "  margin-top: 8px;\n"
    "  background: var(--panel);\n"
    "  border-top: 1px solid var(--border);\n"
    "  border-radius: 12px 12px 0 0;\n"
    "  overflow: hidden;\n"
    "}\n"
    "#body { flex: 1; display: flex; min-height: 0; }\n"
)
assert old2 in t2, "app shell"
t2 = t2.replace(old2, new2)

old3 = (
    "/* 常驻状态栏：横贯全宽。监控控件在左，数据与曲线在右 */\n"
    "#topbar {\n"
    "  display: flex;\n"
    "  align-items: center;\n"
    "  gap: 14px;\n"
    "  margin: 12px 16px 12px;\n"
    "  padding: 10px 20px;\n"
    "  background: var(--panel);\n"
    "  border: 1px solid var(--border);\n"
    "  border-radius: var(--radius);\n"
    "  box-shadow: var(--shadow);\n"
    "}"
)
new3 = (
    "/* 常驻状态栏：与壳融合（无独立边框），底部 1px 分隔 */\n"
    "#topbar {\n"
    "  display: flex;\n"
    "  align-items: center;\n"
    "  gap: 14px;\n"
    "  padding: 10px 18px 9px;\n"
    "  border-bottom: 1px solid var(--border);\n"
    "}"
)
if old3 in t2:
    t2 = t2.replace(old3, new3)
else:
    print("topbar variant missed - checking")

# 侧栏融入（去独立边框圆角）
old4 = (
    "#sidebar {\n"
    "  width: 252px;\n"
    "  flex-shrink: 0;\n"
    "  border-right: 1px solid var(--border);\n"
    "  display: flex;\n"
    "  flex-direction: column;\n"
    "  padding: 12px 12px 10px;\n"
    "  transition: width 0.16s ease;\n"
    "  overflow: hidden;\n"
    "}"
)
new4 = (
    "#sidebar {\n"
    "  width: 252px;\n"
    "  flex-shrink: 0;\n"
    "  border-right: 1px solid var(--border);\n"
    "  display: flex;\n"
    "  flex-direction: column;\n"
    "  padding: 10px 12px 8px;\n"
    "  transition: width 0.16s ease;\n"
    "  overflow: hidden;\n"
    "}"
)
if old4 in t2:
    t2 = t2.replace(old4, new4)

# 顶栏左段两行 + 搜索内嵌 + 暂停方钮
old5 = '#topbar .tb-check { font-size: 12px; gap: 7px; }'
new5 = (
    "/* 顶栏左段：上行=暂停+搜索组（按钮内嵌右侧），下行=复选 */\n"
    ".tb-left { display: flex; flex-direction: column; gap: 7px; }\n"
    ".tb-row1 { display: flex; align-items: center; gap: 10px; }\n"
    ".tb-row2 { display: flex; align-items: center; gap: 18px; }\n"
    ".tb-check {\n"
    "  display: inline-flex; align-items: center; gap: 9px;\n"
    "  font-size: 12px;\n"
    "  color: var(--dim);\n"
    "  cursor: pointer;\n"
    "  user-select: none;\n"
    "  white-space: nowrap;\n"
    "}\n"
    ".tb-check:hover { color: var(--fg); }\n"
    ".tb-check input[type=\"checkbox\"] { margin: 0; }\n"
    "\n"
    "/* 搜索组：按钮内嵌框内右侧（半切式） */\n"
    ".search-group { position: relative; display: flex; align-items: center; }\n"
    ".search-group input[type=\"text\"] { width: 218px; padding-right: 38px; }\n"
    ".search-group button {\n"
    "  position: absolute;\n"
    "  right: 5px;\n"
    "  display: flex; align-items: center; justify-content: center;\n"
    "  width: 26px; height: 26px;\n"
    "  border: none;\n"
    "  border-radius: 6px;\n"
    "  background: transparent;\n"
    "  color: var(--dim);\n"
    "  cursor: pointer;\n"
    "  transition: all 0.13s;\n"
    "}\n"
    ".search-group button:hover { color: var(--accent); background: var(--accent-soft); }\n"
    "\n"
    "#btn-pause {\n"
    "  display: flex; align-items: center; justify-content: center;\n"
    "  width: 34px; height: 34px;\n"
    "  border: 1px solid var(--border-strong);\n"
    "  border-radius: 9px;\n"
    "  background: var(--panel2);\n"
    "  color: var(--fg);\n"
    "  cursor: pointer;\n"
    "  transition: all 0.15s;\n"
    "}\n"
    "#btn-pause:hover { border-color: var(--accent); color: var(--accent); }\n"
    "#btn-pause.paused { color: var(--amber); border-color: var(--amber); }\n"
    "\n"
    "#topbar .tb-check { font-size: 12px; gap: 7px; }"
)
assert old5 in t2, "tb-check anchor"
t2 = t2.replace(old5, new5)

# 删旧独立定义
old6 = (
    ".tb-check {\n"
    "  display: inline-flex; align-items: center; gap: 8px;\n"
    "  color: var(--dim);\n"
    "  font-size: 12.5px;\n"
    "  cursor: pointer;\n"
    "  user-select: none;\n"
    "  white-space: nowrap;\n"
    "}\n"
    ".tb-check:hover { color: var(--fg); }\n"
    ".tb-check input[type=\"checkbox\"] { margin: 0; }\n"
    "#tb-search { width: 176px; }\n"
    "#topbar .spacer { flex: 1; }"
)
new6 = "#topbar .spacer { flex: 1; }"
if old6 in t2:
    t2 = t2.replace(old6, new6)
    print("old tb-check removed")

old7 = (
    "#btn-pause {\n"
    "  white-space: nowrap;\n"
    "  padding: 8px 20px;\n"
    "  border: 1px solid var(--border);\n"
    "  border-radius: 9px;\n"
    "  background: var(--panel2);\n"
    "  color: var(--fg);\n"
    "  cursor: pointer;\n"
    "  font-size: 13px;\n"
    "  font-weight: 600;\n"
    "  font-family: inherit;\n"
    "  transition: all 0.15s;\n"
    "}\n"
    "#btn-pause:hover { border-color: var(--accent); color: var(--accent); }\n"
    "#btn-pause.paused { color: var(--amber); border-color: var(--amber); }"
)
if old7 in t2:
    t2 = t2.replace(old7, "")
    print("old pause removed")

# 指标收紧
t2 = t2.replace(
    "#topbar .metric { display: flex; flex-direction: column; gap: 2px; padding: 0 14px; width: 116px; }",
    "#topbar .metric { display: flex; flex-direction: column; gap: 2px; padding: 0 12px; width: 108px; }",
)

with io.open(p2, "w", encoding="utf-8", newline="\n") as f:
    f.write(t2)
print("css ok")
