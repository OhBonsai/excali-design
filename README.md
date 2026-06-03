# Excali-Design

**中文** · [English](README.en.md)

> *"一句话,一张能讲清楚的软件架构图 / 设计图 / 原型图。"*

用 **Excalidraw 手绘风**做**静态**的**软件架构图 / 设计图 / 产品原型图 / 信息流程图**的 agent-agnostic skill。产出全部是静态图(`.excalidraw` / PNG / SVG)——不做动画、视频、音频。

> 🙏 **本 skill 重度参考 `huashu-design`(花叔 Design)设计。**「反 AI slop / Junior Designer / 资产优先 / 事实验证」四大哲学、SKILL 主干 + references 路由 + scripts 工具链都直接继承,只是把媒介从 HTML 换成 Excalidraw 元素、聚焦静态图。在此致谢。

## 安装

**方式 A · `npx skills`(推荐,一键装到所有 agent)** —— 用 [vercel-labs/skills](https://github.com/vercel-labs/skills) CLI,GitHub 当注册表,自动探测你的 agent(opencode / Claude Code / Cursor / Codex 等):

```bash
npx skills add OhBonsai/excali-design -g          # 全局(~/.config/<agent>/skills 等)
npx skills add OhBonsai/excali-design             # 仅当前项目(./<agent>/skills/)
npx skills add OhBonsai/excali-design -a opencode -y   # 只装 opencode,非交互
```

**方式 B · 手动** —— 从 [Releases](../../releases) 下 zip 解压到 agent 的 skills 目录,或直接 clone 本仓库。拉的是默认分支 `master`(精简版)。

## 怎么用

**对着你的 AI agent 说一句话就行**(Claude Code / Cursor / Codex / Cowork / opencode 等都能用):

```
用 excali-design,帮我画一张订单服务的架构图
读一下我这个仓库,画出它的微服务调用关系图
用 excali-design 画一套登录注册流程的产品原型
```

agent 会自己读 `SKILL.md`、按 references 路由表深入手册、检索复用 `drawlib/` 组件。不确定怎么开口?说「**读一下 excali-design 技能,然后问我几个问题**」,它会先和你对齐需求再动手。

## 示例(全部本 skill 生成)

走「语义 HTML 布局 → 浏览器算位置 → 转 Excalidraw 手绘风」流水线:组件用 `data-lib` 拉现成库,图表用 `data-chart` 按真实数值生成,连线交 `arch-connect`,转完渲图**眯眼回归**。

| 产品原型 · 多屏 flow | 数据看板 · data-chart |
|---|---|
| ![登录注册流程](assets/readme/login-flow.png) | ![数据看板](assets/readme/dashboard.png) |
| **项目看板 · data-lib 卡片** | **软件架构 · arch-connect** |
| ![项目看板](assets/readme/kanban.png) | ![服务架构](assets/readme/architecture.png) |

## 核心能力一览

| 能力 | 怎么做 | 工具 / 文档 |
|---|---|---|
| **资产复用**(能复用绝不手绘) | 11 库 / 402 件按分类组织,关键词检索 → `data-lib` 嵌入 | `drawlib-find.mjs` · `references/drawlib-index.md` |
| **数据图表** | `data-chart="pie\|donut\|bar\|line"` 按真实数值生成手绘图 | `html-to-excalidraw.mjs` |
| **反 AI slop(代码硬门)** | Unicode/emoji 冒充图标 → 构建直接失败;改用 `data-icon` 手绘小形状 | `_antislop.mjs` · `references/anti-slop.md` |
| **架构图三板斧** | 节点自动布局 + 连线自动路由 + 几何 lint,都别手做 | `arch-layout` / `arch-connect` / `arch-lint` |
| **Mermaid → 手绘风** | flowchart/sequence/state/ER/class/gantt/pie | `mermaid-to-excalidraw.mjs` |
| **导出** | headless SVG(无 chromium)/ 像素级 PNG(playwright) | `svg-export.mjs` / `excalidraw-to-image.mjs` |
| **眯眼回归** | 转完渲图给模型看一遍(焦点/文字/连线/图元),机械 lint 判不了好坏 | `references/design-tokens.md` |

## 组件库与资产复用(11 库 · 402 件 · 一类一库)

`drawlib/` 是 **11 个 `excali-*` 库**,从社区(libraries.excalidraw.com,全 MIT)**图像识别精挑 + 按分类重组**而来:

| 库 | 件 | 库 | 件 |
|---|---|---|---|
| `excali-ui` UI 控件/卡片/表格 | 111 | `excali-chart` 图表占位 | 32 |
| `excali-cloud` AWS/Azure/GCP 图标 | 56 | `excali-person` 角色/气泡 | 17 |
| `excali-tech` 技术栈 logo | 51 | `excali-ml` ML/DL 概念+工具 | 16 |
| `excali-shape` 流程/UML/数据结构 | 44 | `excali-net` 网络/设备 | 16 |
| `excali-template` deck/画布/板 | 37 | `excali-symbol` 数学符号 | 15 |
| | | `excali-frame` 设备外壳 | 7 |

**用法**:先检索,再嵌入:

```bash
node scripts/drawlib-find.mjs pie kubernetes lambda   # 关键词 → data-lib 序号
node scripts/drawlib-find.mjs --cat cloud-icon         # 按分类列全部
```
```html
<div data-lib="excali-cloud:7"></div>   <!-- AWS Lambda -->
<div data-lib="excali-ui:59"></div>     <!-- Filled button -->
```

库里没有 → 先看社区精选 [`references/community-libraries.md`](references/community-libraries.md),按 `asset-taxonomy.md` 的流程(`fetch-candidates` 下载 → 渲接触表 → 图像识别精挑 → `assemble-lib` 合并)扩库。机器索引在 `drawlib-index.json`,`build-drawlib-index.mjs --check` 防序号漂移(已挂 CI)。

## 画架构图的三板斧(节点 / 连线 / 校验都别手做)

| 工具 | 作用 |
|---|---|
| `arch-layout.mjs` | 声明 `{节点, 边, 分组}` → elkjs 自动布局(layered + 正交 + 嵌套),**零重叠 + 最小交叉**。拓扑密集图用 |
| `arch-connect.mjs` | 人摆好框,**程序连线**:正交 + 面向边出入 + 端口均匀 + 消交叉 + binding。⛔ 不手估边坐标 |
| `arch-lint.mjs` | 交付前几何扫描(重叠/流向反/斜线/交叉/留白/配色)。**辅助提示,不是质量门槛** |

详见 [`references/arch-lint.md`](references/arch-lint.md)。

## 导出图片(PNG / SVG)

**轻量 · 无 chromium(日常用)** —— `svg-export.mjs` 用 Rough.js `RoughGenerator` **headless** 生成手绘 SVG(seed+roughness 与官方一致),只需 `roughjs`;加 `--png` 经 `@resvg/resvg-js`(预编译,非浏览器)出 PNG:

```bash
node scripts/svg-export.mjs 图.excalidraw --png
```

**最高保真 · Playwright** —— `excalidraw-to-image.mjs` 走官方导出内核,字体/换行和 excalidraw.com 100% 一致(代价是 chromium):

```bash
node scripts/excalidraw-to-image.mjs 图.excalidraw --png --svg --scale 2
```

> 速记:**日常贴图 / 眯眼回归用 headless svg-export;要像素级对齐官方用 playwright。**

## 项目结构

```
excali-design/
├── SKILL.md                  # 主干:人格 + 哲学 + 工作流 + references 路由表
├── drawlib/                  # 11 个 .excalidrawlib(一类一库,~402 件)
├── drawlib-index.json        # 机器索引(drawlib-find 检索 / --check 校验)
├── manifests/                # 每个 excali-* 库的精挑配方(src/index/name/MIT 出处)
├── references/               # 深度手册(按任务路由)
│   ├── drawlib-index.md / drawlib-catalog.md   # 分类索引 + 清单
│   ├── community-libraries.md / asset-taxonomy.md  # 社区精选 + 扩库流程
│   ├── architecture-workflow.md / prototype-workflow.md
│   ├── design-tokens.md / anti-slop.md / arch-lint.md / ...
├── scripts/                  # 纯 Node(+ 可选 elkjs/roughjs/resvg/playwright)
│   ├── arch-layout / arch-connect / arch-lint
│   ├── html-to-excalidraw    # 语义 HTML → 手绘;data-lib 复用 + data-chart 图表 + data-icon
│   ├── mermaid-to-excalidraw
│   ├── drawlib-find / drawlib-sheet / build-drawlib-index / assemble-lib / fetch-candidates
│   ├── svg-export            # headless 手绘 SVG(无 chromium)
│   └── excalidraw-to-image   # playwright 最高保真
├── .github/workflows/release.yml   # 打 tag → 校验 + 打包 + 建 Release
└── test/ · demos/ · test-prompts.json
```

## 依赖

**默认 `npm install`(无 chromium,纯 JS + 预编译小二进制)**:`elkjs` + `roughjs` + `@resvg/resvg-js`。开箱即用:写 `.excalidraw` / `arch-*` / mermaid Tier2 / `svg-export` 出图。

**需浏览器内核的两个脚本**(`npm install` 默认带 `playwright`):`html-to-excalidraw`(HTML 布局靠浏览器算 CSS)和 `excalidraw-to-image`(像素级导出)。这俩会**先找系统已装的 Chrome/Edge/Chromium/Brave**(`_browser.mjs`)——找到就用、免下载,没有才用 playwright 自带的;也可 `EXCALI_CHROMIUM=<路径>` 指定。

> Excalidraw MCP 接入时 `create_view` 直接渲染;未接入则产 `.excalidraw` 文件导入 excalidraw.com。

## License

MIT。`drawlib/` 各库从社区 MIT 库精挑合并,出处记在 `manifests/<库>.json`。
