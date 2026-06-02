# 设计令牌 + HTML → Excalidraw 降级映射

> 风格化能明确的部分,**先借鉴 huashu-design 的纪律**,定成一套令牌(token),全图复用——一致性靠结构不靠自觉。
> 但 Excalidraw 是**手绘风**:很多 CSS token(渐变/阴影/精确字体/字重)**不能直译**,转换时必须**降级/替换成手绘等价物**。
> **铁律:HTML 只管「布局 + 语义结构」,不管最终观感;转 Excalidraw 时一律套手绘风。输出必须读起来是手绘图,不是一张扁平 web UI 截图。**

## 一、令牌(画图前定一次,全图复用)

借 huashu-design 的克制 + Excalidraw 的离散调色板:

**间距 spacing**(全部 8 的倍数,最终吸附 20px 网格):`8 / 16 / 24 / 40 / 64`。容器内边距 ≥ 16;同层兄弟 gap 取一个固定值(如 40)。

**字阶 type scale**(Excalidraw `fontSize`):
| 角色 | px | 用途 |
|---|---|---|
| caption | 13 | 注释/图例/弱化 |
| body | 15 | 正文/成员/标签 |
| label | 16 | 节点名/字段名 |
| subhead | 20 | 区块标题 |
| title | 26 | 图标题 |
| hero | 34+ | 主标题/焦点数字 |
> 不靠字号无限叠——3-4 个层级足够。

**颜色角色 color roles**(全图 ≤ 4 色,见 `color-system.md`):`ink #1e1e1e` / `gray #868e96` / `bg #fafaf6 或 #fff` / 一个 accent 贯穿主角 + 语义色(蓝 `#1971c2` 主链路、绿 `#2f9e44` 成功、红 `#e03131` 告警、橙 `#f08c00` 外部),各配浅填充。**任意 hex 一律吸附到这套最近色。**

**字体 font**(Excalidraw 只有 3 个):`Virgil`(fontFamily 1,手绘体——概念/原型默认)/ `Normal`(2,Helvetica 系——严肃架构)/ `Code`(3,等宽——数据/代码/类成员)。

**描边 + 圆角 + 手绘度**:strokeWidth `2`(主)/`1`(分隔线);roundness `{type:3}`(卡片/节点)或 `null`(严肃/技术);**roughness `1`(手绘默认)**,正式架构图可 `0`。

## 二、为什么走 HTML 草图(布局引擎)

网格/卡片/流式类图(原型、看板、海报)**没有像 elkjs 那样的布局引擎**,手算坐标必翻车。HTML/CSS 本就是为这类内容做的成熟布局引擎:

```
写语义 HTML(div/text/色块 + flex/grid/padding/gap,用上面的令牌)
  → 浏览器算出每个元素的 getBoundingClientRect(精确位置/对齐/换行,免费)
  → 逐元素翻译成 Excalidraw 元素 + 分组(套手绘风、降级 CSS)
  → 边交给 arch-connect
```

和 arch-layout 同一原则:**声明结构 / 引擎算位置 / 不手摆**。图论类用 elkjs,网格类用浏览器 CSS。

**已实现**:`scripts/html-to-excalidraw.mjs`。
```bash
node scripts/html-to-excalidraw.mjs 图.html --out 图.excalidraw
```
给要连线的框加 `data-id="xxx"`(保留为 Excalidraw 元素 id)→ 转完用 `arch-connect` + edges.json 连边。
浏览器算布局 + 自动套手绘风(roughness)+ 降级 CSS(渐变/阴影丢、字体降 Virgil/Normal/Code、任意 hex 吸附调色板、border-radius:50% → 椭圆)。CSS 里直接用颜色角色的 hex,吸附即恒等。

## 三、CSS token → Excalidraw 降级 / 替换映射(核心)

| CSS / HTML | → Excalidraw | 降级 / 手绘说明 |
|---|---|---|
| `display:flex/grid` + `gap/padding/margin` | 元素的 `x/y/width/height` = 浏览器算出的 rect | **照搬布局**——这是用 HTML 的全部意义 |
| `<div>` 纯背景色 / 色块 | `rectangle`,`backgroundColor`=该色,`fillStyle:solid` | 直译 |
| `<div>` border / border-radius | `strokeColor`=border 色;`roundness:{type:3}` 若 radius>0,否则 `null` | — |
| `background: linear-gradient(...)` / mesh | **丢渐变 → 取主色 `solid`** | 渐变是反 slop;手绘没有渐变 |
| `box-shadow` / `filter: blur` / glassmorphism | **丢弃** | 手绘不用阴影/玻璃;层级靠**位置 + 留白 + 字号** |
| 文本节点 | `text` 元素,`fontSize`=映射字阶 | — |
| `font-family`(Inter/SF/任意) | **降到 3 选 1**:严肃→Normal(2)、概念/原型→Virgil(1)、数据/代码→Code(3) | **强制手绘字体,不保留原字体** |
| `font-weight: bold` | Excalidraw **无字重** → 用**更大字号 / Normal 字体 / ink 色**表达强调 | 不靠字重,靠字号+颜色的层级 |
| `color` / 任意 hex | **吸附到颜色角色最近色**,守 ≤4 色 | 任意色 → 降到调色板 |
| `opacity` | `opacity` 0–100 | 直译 |
| `<img>` / `<svg>` | `image` 元素(+ `files` dataURL) | 真图直译;别用 CSS 画图形 |
| `hover` / `transition` / `animation` / `:active` | **全丢**(静态图) | 本 skill 只做静态 |
| 框 → 框的连线 | **不在 HTML 画**,交 `arch-connect` | 节点 HTML 摆,**边永远 arch-connect** |
| `text-align` / `line-height` | 文字用 **Range 量实际渲染框**(含 padding / 垂直居中),不是元素框顶 | 否则带 padding 的输入框文字会贴顶,不居中 |
| `<div data-chart="pie" data-values="A:40,B:30">` | **组件**:转成真扇形(闭合折线),不当普通框 | CSS 画不出真饼图(conic-gradient 不可译)→ 用确定性组件补 |

## 四、确定性组件(component)——HTML 表达不了的,用组件补

CSS 能布局,但有些视觉**画不出来或译不准**(真饼图、徽章、迷你折线…)。这些不靠大模型手摆坐标,而是沉淀成**确定性组件**:HTML 里写一个声明式占位 `<div data-chart="...">`,转换器用固定算法生成手绘元素。**确定性 token + 确定性 component = 把质量下限抬高,模型只负责"放哪、放不放",不负责"画得准不准"。**

| 组件 | HTML 声明 | 生成 |
|---|---|---|
| 饼图 | `<div data-chart="pie" data-values="数码:40,服饰:30,食品:18">` | 真扇形(圆心采弧闭合折线),颜色角色轮转、浅填充、roughness 手绘 |
| (待补)条形 / 迷你折线 / 徽章 | `data-chart="bar"` … | 同理:声明数据 → 固定算法 |

边永远不在 HTML 画 → `arch-connect`;饼图这类"图元"才用组件。两者都是"声明结构,引擎出形"。

## 五、转换后必做:模型眯眼回归(LLM-in-the-loop,非可选)

**html→excalidraw 不是纯逻辑就够。** 转换器忠实翻译 HTML,但翻译不出"该不该是饼图""箭头是不是乱""焦点对不对"——这些只有**把渲染图给模型看**才知道。所以有了 `.excalidraw` 之后,**必须**:

```
1. node scripts/excalidraw-to-image.mjs 图.excalidraw --png
2. 模型读这张 PNG(眯眼看),逐条核:
   - 焦点/分组/层级:模糊看,主角和分区仍认得出?
   - 文字:有没有贴边/不居中/溢出?(→ Range 没量准 / 容器太小)
   - 连线:正交干净不交叉?有没有侧边乱窜?(→ 改 fromSide/toSide 重连)
   - 图元:饼图是饼图、条形是条形,不是"线方块"?(→ 该上组件)
   - 手绘风:没渐变/阴影,字体只 Virgil/Normal/Code,≤4 色?
3. 有问题 → 改 HTML / edges / 组件 → 重新生成 → 再看。迭代到过。
```

机械 lint(arch-lint)只查几何错误,**判不了好坏**;眯眼回归是大模型补的那一环,不能省。

## 六、转换后自检清单(眯眼时逐条过)

- [ ] 没有渐变 / 阴影 / 玻璃拟态(全降级掉了)
- [ ] 字体只用了 Virgil/Normal/Code,没保留 Inter/SF
- [ ] 全图 ≤ 4 色,都来自颜色角色
- [ ] roughness 1(或正式图 0),元素吸附网格
- [ ] 文字垂直/水平都在它该在的位置(Range 量的,不贴框顶)
- [ ] 框间是 arch-connect 路由的正交线,不是手画/HTML 伪连线;无侧边乱窜
- [ ] 图表是真图元(饼/条),不是色块凑
- [ ] **眯眼测试**:模糊看,焦点和分组仍认得出;读起来是手绘图不是 web 截图
