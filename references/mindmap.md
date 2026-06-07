# Mindmap rendering (template path) — 工作交接文档

思维导图渲染器。和前 6 类(flowchart/sequence/state/class/ER/gantt)同方法
(`references/render-method.md`),但**范式独立**:不是"节点+边的图",而是**根树 + 枝条为 hero**,
布局不复用分层引擎,图标/备注走 drawlib。本文档既是用法说明,也是**下一个 task 的交接清单**。

## 当前状态(已跑通的链路)

`mermaid mindmap 缩进树 → IR 树 → 零依赖 tidy-tree 布局(logical 横树) → 曲线枝条 + 彩色 pill 节点 + 按一级分支配色 → STYLE`

```
node scripts/render-mindmap.mjs <input.mmd|ir.json> <out.excalidraw> [style] [layout]
```
**选布局看内容**(用户一般不会指明布局,别在 prompt 里要求——技能自己判断):发散总览/中心主题+若干并列方面 → `radial`;层级/步骤式 how-to → `logical`;拿不准用 `logical`。

**两种布局方向**(`layout` ∈ `logical`|`radial`,默认 logical;也可在 IR 顶层写 `"layout":"radial"`):
- `logical`:root 左→右横树(原 v1)。
- `radial`:root 居中,一级分支按**叶子数**分配角扇区、极坐标定位、径向曲线枝条 360° 发散。✅ 已跑通
  (learning 17 节点 / product 28 节点·3 层无重叠;4 个 STYLE 全部沿用)。
  - 角度:叶子均分 360°,内节点角度 = 子节点角度均值(零依赖,近 d3.cluster 极坐标)。
  - 半径:每层环 = 上层半宽+本层半宽+间隙(径向不重叠);最外环每叶弧长 < ROWH 时整体放大(切向不重叠)。
  - 枝条:沿 (radius, angle) 线性插值采样 10 点 + roundness:2,得自然弧形。节点 pill 保持水平(不旋转,保可读)。

- 解析器 `scripts/mermaid-mindmap.mjs`:缩进定层级,节点形状 `((circle)) {{hex}} )cloud( [square] (round)`,
  `::icon(...)` 已抓进 `node.icon`(暂未渲染),`:::class` 忽略。
- 渲染器 `scripts/render-mindmap.mjs`:logical 横树(root 左→右),曲线枝条 `roundness:2`、
  按枝粗细分级(depth1 粗→深层细,近似 taper),一级分支各一色、子孙继承父色。
- STYLE:**默认 `pencil`(单色墨线、干净 taper、不追求颜色 —— mindmap 推荐默认)**;`mono`(更硬的纯线 roughness 0);
  彩色可选 `classic-tricolor`(8 色板)/`hachure-classic`/`pastel-journal`(暖色板)/`duotone-hachure`。
  **去脏关键**:taper 锥形带的 roughness 由 `S.brough` 控制(pencil 0.25 / mono 0),早期 1.1 会把细枝糊成毛团;枝宽也调细了。
- 测试用例:`examples/mindmap/cases/learning.mmd`(已验证出图,17 节点 / 3 层)。

**结论:这条路通了,审美 OK,一眼是 mindmap。** v1 logical 横树 + v2 radial 放射,两向都已验证。

## 架构决策(已和用户确认的几点)

1. **布局借库只借"算坐标"**:tidy-tree 的紧致排布业界标准是 `d3-hierarchy`(`d3.tree` 逻辑树 /
   `d3.cluster`+极坐标放射)。v1 先用**零依赖简版**(叶子占行 + 父节点居中,非重叠),和其它渲染器一样
   不引 npm 依赖。要更紧致再换 `d3-hierarchy`。
2. **不走 html→excalidraw**:那条路是给网格/卡片/海报(CSS 盒模型)用的;mindmap 主体是**弯曲枝条
   (SVG 路径)+ 自由坐标**,用 html→excalidraw 反而丢掉枝条这个 mindmap 的灵魂。所以全程自绘图元。
3. **图标/备注走 drawlib(assets-first)**:优先级/旗子/星/note 直接复用 `drawlib`(`excali-symbol` 等)
   的图元组嵌入,既手绘风一致又可复刻;drawlib 没有的用基础图元画小标记。**不用 gpt、不用 html。**
4. **复刻约束**:枝条**粗细连续渐变(taper)Excalidraw 无旋钮** → 按 depth 分级近似;彩铅/纸张纹理不可复刻
   (见 thinking.md §9.1)。

## 三块美感的程序化处理(已落地 ✅ —— 复刻 GPT mindmap 观感的核心)

参考 GPT 生成图的美感来自三处,均已程序化:

1. **大小 = 按 depth 分派形状**(不是只改字号):root=**云形**(扇贝多边形,smooth scallop)大字 /
   一级 & 中间节点=**描边圆角框**(彩色 stroke + 纸色填充) / 叶子=**无框文字 + 彩色下划线**。
   字号梯度 root 24 / L1 17 / 深层 14。`drawNode` 按 `isLeaf`/`_depth` 三分派。
2. **小图标 = 自绘手绘线稿图元**(`ICONS` 表):bulb/star/check/heart/flag/person/people/book/target/note/
   rocket/gear,基础图元拼、tint 成枝色、~30px、放在一级节点上方偏外。`::icon(name)` 已解析进 `node.icon`;
   `ALIAS` 处理同义词。**不接 drawlib**:drawlib 的 "Star graph" 其实是节点-连线图(渲成雪花)、bulb 太小,
   自绘更稳更一致、且反 slop 合规(绝不用 emoji/unicode)。drawlib 的 person 类好用时可按需接。
3. **手绘线条 = taper 锥形带**(`ribbon()`):枝条不再是等宽描边线,而是**贝塞尔中心线 + 法向偏移**生成的
   **闭合填充多边形**,宽度根粗(w0)→梢细(w1)。svg-export 见闭合多边形走 `gen.polygon`(roughjs 填充)
   → 同时拿到**真 taper + 手绘粗糙边**。这是和等宽线差距最大、提升最明显的一项。下划线也用细 ribbon。
   - 枝条端点:父外缘 → 子「连接锚」(叶=下划线近端、框=近边);子端水平切线,流入下划线/框边。

四张示例(两布局 × classic/pastel)在 `examples/mindmap/out/`。

## 结构特性(XMind 概念,mermaid 原生没有 → 自定指令,已落地 ✅)

`scripts/mermaid-mindmap.mjs` 扩展了三条指令(紧跟目标节点之后写;`::link` 写在顶层):

| 指令 | 作用 | 渲染 |
|---|---|---|
| `::boundary[(color)]` | 给上一节点的**整棵子树**加边界 | 子树 bbox 虚线圆角框(枝色/指定色,两布局) |
| `::summary(label)` | 给上一节点的**直接子节点**归并 | logical=竖 `}` 花括号+标签;radial=虚线框+标签 |
| `::link(A, B[, label])` | **跨枝关联**(A/B 按 label 或 id 匹配) | 灰色弯曲虚线 + 中点标签(两布局) |

节点可带 id 供 link 引用:`ui[Redesign UI]` → id=`ui`。示例:`examples/mindmap/cases/features.mmd`
(boundary+summary+2 条 link),产物 `examples/mindmap/out/features.{logical,radial}.png`。

## 新组件清单(mindmap 专属,**要做一张新的组件参考表**)

前 6 类都是"框 + 直/折线"。mindmap 引入一批**新组件**(组件表要画这些,不复用 flowchart 的 31 个):

1. **中心主题 central topic**(大、云形,扇贝多边形)— ✅ 已实现(drawRoot)
2. **分支/中间节点 box**(彩色描边圆角框 + 纸色填充)— ✅ 已实现
3. **无框/下划线叶子**(文字 + 彩色下划线 taper)— ✅ 已实现
4. **有机枝条 organic branch**(真 taper 锥形带 + 手绘边)— ✅ 已实现(ribbon)
5. **图标 icons**(自绘手绘线稿 12 种,tint 枝色)— ✅ 已实现(ICONS)
6. **边界 boundary**(虚线圆角框圈住子树)— ✅ 已实现(`::boundary`)
7. **概要 summary**(`}` 大括号归并子节点 + 标签)— ✅ 已实现(`::summary(label)`;logical 竖 brace / radial 虚线框)
8. **跨枝关联 relationship**(两分支间弯曲虚线 + 标签)— ✅ 已实现(`::link(A,B,label)`)
9. **备注 note callout**(小 note 图标 + 黄色便签框 + 引线)— ✅ 已实现(`::note(text)`)

## 风格探索(用户"去找风格"用的 gpt-image 提示词)

公共基底:
```
A hand-drawn mind map in clean Excalidraw / whiteboard-sketch style: one central topic in
the middle, branches radiating out; each first-level branch AND all its descendants share
ONE color (branch = category); organic, slightly-curved branch lines; node text sits ON the
branches (mostly no boxes); a few small hand-drawn icons on some nodes. Flat, no 3D /
shadow / gradient / texture. Then:
```
- **radial-buzan**:`Radial Buzan layout — central rounded "cloud" topic, 5–6 main branches fanning 360°, branches thicker near the root and thinner toward leaves, soft category colors, 2 levels of sub-branches, a few doodle markers (star, flag, lightbulb, "!"). Lively, organic.`
- **logical-right**:`Logical tree — root on the LEFT, branches growing RIGHT in a tidy non-overlapping layout, gentle curved connectors, node text on small rounded pills, one color per top branch, very legible. Clean study-notes feel.`
- **notebook-pastel**:`Cream paper, relaxed sketchbook feel, soft pastel branch colors (peach/mint/lavender), loose wobbly curves, cozy and friendly.`
- **monoline-ink**:`Single charcoal ink only, NO color — elegance from the curved branch lines themselves (varying thickness), generous whitespace, editorial.`

风格化组件表(待组件表做好后)按前 6 类同样套路:公共前缀锁网格 + 风格块,还原成 STYLE 预设。

## 下一个 task 的待办

1. ~~radial 布局~~ ✅ / ~~taper 枝 + depth 形状 + 图标~~ ✅ / ~~boundary/summary/link/note~~ ✅ /
   ~~test-mindmap.mjs~~ ✅ / ~~接进 SKILL.md + mermaid-render 状态表 + test-mermaid TYPES~~ ✅(均已落地)。
2. **组件参考表** `scripts/build-mindmap-components.mjs` → `assets/mermaid-components/mindmap-components.png`
   (画上面 9 个组件,现已全部实现可照着画),+ `prompts/mindmap-styles.md`(公共前缀 + 风格块)。⬜
3. **drawlib 图标**(可选):当前图标自绘;person 类等 drawlib 有好资产时可按 icon 名接 `excali-person`。⬜
4. **eval**:cases.jsonl 已有 `IA02-mindmap`;接进 v0.5↔v0.6 A/B 的 `--only`。⬜

## 文件地图(已落地)

| 文件 | 状态 |
|---|---|
| `scripts/mermaid-mindmap.mjs` | ✅ 解析器(缩进树 + 形状 + id + icon/boundary/summary/note/link 指令) |
| `scripts/render-mindmap.mjs` | ✅ 渲染器(logical/radial + 4 STYLE + taper 枝 + depth 形状 + 12 图标 + boundary/summary/link/note) |
| `scripts/test-mindmap.mjs` | ✅ 测试器(case × style × layout) |
| `examples/mindmap/cases/features.mmd` | ✅ 测试用例(boundary+summary+note+2 link) |
| `examples/mindmap/cases/learning.mmd` | ✅ 测试用例(17 节点) |
| `examples/mindmap/cases/product.mmd` | ✅ 测试用例(28 节点·3 层,压宽/深布局) |
| `examples/mindmap/out/*.{radial,logical}.{excalidraw,svg,png}` | ✅ 示例产物 |
| 组件表 / prompts / radial / 图标 / test / SKILL 接入 | ⬜ 见上方待办 |
