---
name: icon-pipeline
description: NetLens 应用图标生产管线——理解用户的文字构想或画板草图后改 SVG 源，一条命令出全尺寸图标并全链路部署
---

# 图标生产管线（NetLens）

用户以**文字描述构想**或**画板草图**表达图标意图；助手理解意图后修改 SVG 矢量源，用管线一键生成并部署。模型不做位图绘制，只产出/修改矢量代码。

## 管线位置与命令

- SVG 源：`S:\ZWorker\NetWatch\tools\icon\icon.svg`（人可读可改，几何全部参数化）
- 构建脚本：`S:\ZWorker\NetWatch\tools\icon\build.mjs`（Node + @resvg/resvg-js 渲染）
- 一键命令：`cd S:\ZWorker\NetWatch\tools\icon && node build.mjs`
- 仅核对 exe 内嵌图标：`node build.mjs --verify-only`（结果存 `verify\diag-exe-icon.png`）

## 管线覆盖的完整链路（一条命令全部完成）

1. resvg 矢量直出 8 档尺寸（256/128/64/48/32/24/20/16）——单源渲染，任何位置观感一致
2. 打包 ICO（PNG-in-ICO，写入 `src/NetLens/Assets/app.ico`）
3. 同步 `WebUI/public/brand.png` 并 **npm run build 重建 dist**（应用加载 dist，跳过这步置顶栏 logo 不会更新）
4. SHChangeNotify 刷新 shell 图标缓存
5. 提取 exe 内嵌图标自检（`verify/diag-exe-icon.png`）

## 修改后的部署收尾（管线之外）

```
提权 taskkill NetLens → dotnet build src/NetLens → (图标大改时) verify\rebuild-iconcache.ps1 → 启动 bin\...\NetLens.exe
```

## 设计约定（历版反馈沉淀）

- 黑底圆角方（#07080C）、纯白线条等粗（8/256 基准）、点线为主少封闭面
- 中心对称（logo 兼作侧栏收放钮会旋转，构图需旋转自洽）
- 辉光用 SVG feGaussianBlur 滤镜（冷白 #BED6FF，opacity 0.15），勿手画宽线
- 任务栏与应用内一致性靠单源渲染保证；小尺寸不再独立加粗
- 历史见 memory netlens-monitor.md 图标演化条目（v9→v17 各版被否/采纳原因）

## 当前设计（v17）

斜置 45° 透视水晶棱镜（细长六边形：左右两尖、上边短下边长的透视差）+ 水平光轴（两端信号点）+ 竖直谱线。中心对称叙事：双向流量贯穿水晶镜片交汇分解。
