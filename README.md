# Excali-Design

> *"一句话,一张能讲清楚的软件架构图 / 设计图 / 原型图。"*

用 **Excalidraw 手绘风**做**静态**的**软件架构图 / 设计图 / 产品原型图 / 信息流程图**的 agent-agnostic skill。产出全部是静态图(`.excalidraw` / PNG / SVG)——不做动画、视频、音频。

> 🪶 **你在 `master`(精简分支):指令(`*.md`)+ 脚本 + `drawlib` 组件库,克隆轻量,开箱即用。**
> 仅**音频(6 BGM + 37 SFX)+ demo 源文件**在 [`all`](https://github.com/OhBonsai/excali-design/tree/all) 分支。做带音频的动画导出前按需取:
> ```bash
> git checkout all -- assets/sfx assets/bgm-*.mp3   # 拉音频到本地
> ```
> 或直接克隆全量:`git clone -b all https://github.com/OhBonsai/excali-design.git`

> 🙏 **本 skill 重度参考 [`huashu-design`](../huashu-design)(花叔 Design)设计。**
> SKILL.md 主干 + references 路由 + scripts 工具链,以及「反 AI slop / Junior Designer / 资产优先 / 事实验证」四大哲学,都直接继承自 huashu-design,只是把媒介从 HTML 换成了 Excalidraw 元素、聚焦静态图。没有 huashu-design 就没有这个 skill,在此致谢。

<p align="center">
  <img src="assets/readme/architecture-v9.png" alt="Excali-Design 技能架构图" width="720">
</p>

<p align="center"><sub>▲ 这张架构图由 <b>Excali-Design 技能</b>自己画的(Excalidraw 手绘风、语义配色、`arch-connect` 正交路由、`arch-lint` 几何扫描)。<a href="excali-design%20架构图%20v9.excalidraw">源文件</a></sub></p>

## 如何使用

**安装 = 对着你的 AI agent 说一句话。** 这是一个 markdown-based 的 agent-agnostic skill(Claude Code / Cursor / Codex / Cowork 等都能用),没有 npm 包要装、没有配置要填——把这个目录放进 agent 能读到的地方,然后直接说:

```
安装并使用 excali-design 这个技能,帮我画一张订单服务的架构图
```

或:

```
用 excali-design,把我这个 React 项目的组件结构画成架构图
读 excali-design 技能,帮我画一套登录注册流程的产品原型
读一下我这个仓库,画出它的微服务调用关系图
```

agent 会自己读 `SKILL.md`、按 references 路由表深入对应手册、复用 `drawlib/` 组件、(MCP 可用时)用 `create_view` 渲染。**你只管说要什么图,剩下的交给技能。**

> 不确定怎么开口?直接说「**读一下 excali-design 技能,然后问我几个问题**」——它会按 Junior Designer 流程先和你对齐需求,再动手。

## 它能做什么

- **软件架构图**:从代码库/文档抽真实结构(原则 #0 先验证),按 C4 抽象层级画单向数据流拓扑,语义配色。拓扑密集图用 `arch-layout`(elkjs)自动摆节点,连线用 `arch-connect` 正交路由。
- **产品原型 / 线框图**:复用 `drawlib/` 里 ~185 个现成 UI 控件,快速搭 lo-fi/mid-fi 原型,支持多屏 overview 平铺或 flow 串联。
- **设计图 / 信息图 / 流程图**:决策流、状态机、时序图、泳道图、概念示意。

## 画架构图的三板斧(节点摆放 / 连线 / 校验都别手做)

手摆坐标必出错。本 skill 把架构图最容易翻车的三件事都程序化了:

| 工具 | 作用 |
|---|---|
| `scripts/arch-layout.mjs` | 声明 `{节点, 边, 分组}` → elkjs 自动布局(layered + 正交 + 嵌套),**保证不重叠 + 最小交叉**。拓扑密集图用 |
| `scripts/arch-connect.mjs` | 人摆好框,**程序连线**:正交 + 面向边出入 + 端口均匀分布 + 按序排(消交叉)+ binding。⛔ 不手估边坐标 |
| `scripts/arch-lint.mjs` | 交付前几何扫描:重叠 / 流向反 / 斜线 / 交叉 / 容器内边距 / 配色超限。**只是辅助提示,不是质量门槛** |

详见 [`references/arch-lint.md`](references/arch-lint.md)。

## 导出图片(PNG / SVG)

任意 `.excalidraw` 文件可一键导出成图片(贴 README / 文档 / PPT),用 Excalidraw 官方导出内核,和 excalidraw.com 同款渲染:

```bash
# 同时出 PNG(@2x 高清)+ SVG(矢量,可缩放/可编辑)
node scripts/excalidraw-to-image.mjs "架构图.excalidraw" --png --svg --scale 2

# 只要透明背景 PNG
node scripts/excalidraw-to-image.mjs 图.excalidraw --png --transparent --scale 3
```

上面那张架构图就是这么导出的。依赖 Playwright + chromium(见「依赖」)。

## 项目结构

```
excali-design/
├── SKILL.md                      # 主干:人格 + 哲学 + 工作流 + references 路由表
├── drawlib/                      # 7 个 .excalidrawlib 组件库(~185 个现成组件)
├── references/                   # 深度手册(按任务路由)
│   ├── element-format.md         # Excalidraw 元素 schema(离线 read_me)
│   ├── drawlib-catalog.md        # 7 库清单 + 取用方法
│   ├── architecture-workflow.md  # 软件架构图
│   ├── prototype-workflow.md     # 产品原型
│   ├── arch-lint.md              # 架构图:摆节点 / 连线 / lint 的方法论
│   ├── layout-system.md / color-system.md / anti-slop.md
│   ├── workflow.md / verification.md / critique-guide.md
│   └── ...
├── assets/
│   ├── readme/                   # 文档引用的展示媒体
│   └── templates/                # 起手元素模板(待补)
├── scripts/                      # 纯 Node(+ 可选 elkjs/playwright)
│   ├── arch-layout.mjs           # 声明组件树 → elkjs 自动布局(零重叠)
│   ├── arch-connect.mjs          # 人摆框,程序连线(正交+面向边+消交叉)
│   ├── arch-lint.mjs             # 几何 lint(重叠/流向/斜线/交叉/留白/配色)
│   ├── excalidraw-to-image.mjs   # .excalidraw → PNG/SVG
│   └── verify.mjs                # .excalidraw 结构校验(id/binding)
├── demos/                        # 示例 spec
└── test-prompts.json             # 评测用例
```

## 依赖

- **Excalidraw MCP**(`create_view` / `read_me`)——视图内渲染。未接入时降级为直接产 `.excalidraw` 文件(用户导入 excalidraw.com)。
- **架构图自动布局**(可选):`arch-layout.mjs` 依赖 `elkjs`(纯 JS,无 native)→ `npm install elkjs`。
- **导出 PNG/SVG**(可选):`excalidraw-to-image.mjs` 需 Node + Playwright + chromium(从 CDN import excalidraw,无需 npm 装 excalidraw)→ `npm install playwright && npx playwright install chromium`。
- 核心画图(写 `.excalidraw` / create_view / lint)零依赖,纯 Node。
