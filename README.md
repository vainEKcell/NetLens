# NetLens

一个 Windows 下的进程级网络监控工具。

> **分支说明**：`main` = 0.1.5 整理版（0.1.4 外观，稳定线）；`alpha/0.1.5` = 新 WebView2 界面演进分支（当前主开发线）；`beta/0.1.5-classic` = 0.1.4 外观基线（规划中）。界面截图为经典版。

做这个的起因很简单：我想知道我电脑后台到底有哪些程序在联网、在传什么数据。依靠杀软也大多是处于文件本身层面的追查，任务管理器只给个数字，资源监视器的信息又太散。所以我把它做了出来——把每一条网络行为摊开来看：哪个进程在连、连到哪个 IP 和域名、上传下载了多少、签名有没有问题、被谁拉起来的。看完之后要不要放行、要不要掐掉，试图从更多维度去对本机环境进行安全检查，当然未来也许不仅仅局限在client。

## 界面

<img width="1734" height="1092" alt="屏幕截图 2026-10-07 141906" src="https://github.com/user-attachments/assets/0107534b-4564-474d-8551-546effe527a3" />

## 它能干什么

- **实时流量**：每个进程的上传/下载速度、累计流量，1 秒刷新，一目了然
- **连接明细**：每个进程现在连着哪些 IP 和端口，远端会自动标上域名（从本机 DNS 记录被动学的，不外发查询）
- **事件流**：新连接、断开、单次大额传输都会滚动记录，可以导出 CSV
- **DNS 劫持检测**：公网域名解析到内网地址、有程序绕过系统 DNS 自己发查询、hosts 和代理被改——都会提示；还有个手动体检，拿公共 DoH 对比一下解析结果
- **可疑判定**：正常 / 未知 / 值得关注 / 高风险 四档，每条结论都能展开看证据、依据和误报说明，若不能判断或对此方面无过多了解请保持默认与忽略。
- **处置**：不想让某个程序联网？右键直接断网（防火墙规则，随时可恢复）；也可以结束进程、停掉它挂的服务、禁掉服务自启动；信得过的加进允许名单，之后不再提示
- **行为基线**：存在本地 SQLite，跨会话记录"这程序以前连过谁"，新面孔一眼就能看出来
- **系统托盘与关闭行为**（alpha 界面）：常驻托盘图标，左键恢复界面；关闭窗口可询问 / 直接退出 / 最小化到托盘，设置里可改

## 目录结构

```
NetWatch/                     仓库根（项目名沿袭旧名，程序现名 NetLens）
├─ src/NetLens/               C# 主程序（WPF + WebView2 混合，.NET 10）
│  ├─ App.xaml(.cs)           应用入口：单实例/全局异常/数据迁移/托盘创建
│  ├─ MainWindow.xaml(.cs)    classic WPF 界面（main/beta 分支的界面）
│  ├─ SpikeWindow.xaml(.cs)   alpha WebView2 界面窗口（--spike:page 启动）
│  ├─ Bridge/                 C# ↔ WebUI 桥：UiBridge(命令路由) + SnapshotBuilder(1s 快照)
│  ├─ ViewModels/             MainViewModel：监控引擎编排
│  ├─ Services/               监控/检测/处置服务层（ETW/DNS/防火墙/网关/设置/托盘/关闭行为…）
│  ├─ Native/                 Win32 P/Invoke（路由表/DWM 窗口效果）
│  ├─ Themes/                 WPF 主题与语言资源（Palette/Strings zh-en）
│  ├─ Models/                 数据模型
│  └─ Assets/                 app.ico 等资源
├─ WebUI/                     alpha 前端（Vite + TypeScript + AG Grid）
│  ├─ src/pages/              九个页面（总览/目的地/DNS/端口/事件/拦截/网络配置/体检/设置）
│  ├─ src/i18n.ts             前端双语词典
│  ├─ public/brand.png        应用内 logo（与 app.ico 同源，gen-icon.ps1 生成后同步）
│  └─ dist/                   前端构建产物（npm run build，构建后由 csproj 复制进输出目录）
├─ tools/                     长期开发工具
│  ├─ gen-icon.ps1            应用图标生成器（v11 棱镜设计，四档尺寸独立绘制）
│  ├─ shot-*.ps1 / ui-shot.ps1  截图工具族（UI 验收）
│  ├─ sync-to-submit.ps1      同步到 S:\GitSubmitClass 发布目录
│  └─ oneoff/                 一次性补丁/诊断脚本归档（过程记录，勿删）
├─ build-installer.ps1        打包安装器（Inno Setup，输出 dist/）
├─ publish.ps1                发布产物准备（dotnet publish）
├─ setup.iss                  Inno Setup 脚本
├─ dist/                      安装包输出（gitignore，含历史版本归档）
├─ verify/                    本地验收产物（gitignore）：icon-preview.png 为最新图标预览
├─ archive/                   历史文件归档
└─ docs/                      本地文档（gitignore）
```

## 构建与运行

### 程序入口（每次更新后的成品位置）

```
S:\ZWorker\NetWatch\src\NetLens\bin\Debug\net10.0-windows\NetLens.exe
```

调试界面通过启动参数直达：`--spike:overview`（其余页面同名：destinations / dns / ports / events / blocking / network / netcheck / settings）。

### 更新流程（改完代码后）

```powershell
# 1. 前端有改动时先构建 dist（WebUI 目录下）
cd WebUI; npm run build

# 2. 杀掉运行中的实例后构建主程序（dist 会随构建复制到 bin 输出目录）
dotnet build src/NetLens

# 3. 运行验证
S:\ZWorker\NetWatch\src\NetLens\bin\Debug\net10.0-windows\NetLens.exe --spike:overview
```

### 发布安装包

```powershell
powershell -ExecutionPolicy Bypass -File build-installer.ps1
```

## 下载

右侧 [Releases](https://github.com/vainEKcell/NetLens/releases) 中找到最新版本 `NetLens-Setup-x.x.x.exe`，双击安装。打开时弹 UAC 点"是"——需要管理员权限，用于读内核网络事件和改防火墙规则，若对此有顾虑请不要下载该项目。

## 快速开始

其实装个 .NET SDK 就行：

```powershell
powershell -ExecutionPolicy Bypass -File build-installer.ps1
```

## 几点说明

- 本工具只看连接和流量，**看不到 HTTPS 里面的内容**，别指望它替你分析加密数据
- 判定只是提示，不是确诊病毒。仅仅是揭示网络痕迹，最终判断仍然要靠你自己。
- 程序自身零联网：没有遥测、没有更新检查、不查 IP 归属地。例外只有两处，皆为主动触发（自己点击）：设置里的"DNS 体检"、右键的"浏览器查询文件情报"
- 行为基线和证据流都存在本机 `%LOCALAPPDATA%\NetLens`，保留多久可以在设置里调，不想要了随时清
- 浏览器如果开了自带的"安全 DNS"（DoH），会绕过系统解析，DNS 页看不到它的记录——介意的话把浏览器那个开关关掉

## 具体实现

靠 Windows 自带的机制：ETW 内核网络事件（每次收发自带 PID 和字节数）、DNS-Client 提供程序（能看到每个进程查了什么域名）、连接表轮询、服务枚举（svchost 能归因到具体服务，比如 Dnscache）、wintrust 验签名、防火墙 COM 做拦截。界面是 WPF + WebView2 混合（alpha 分支）：WPF 宿主提供提权/托盘/单实例与窗口壳，WebView2 承载新界面（AG Grid 大表），C# 侧 Bridge 每秒推送快照、路由命令。
