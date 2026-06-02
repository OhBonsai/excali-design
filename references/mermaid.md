# Mermaid → Excalidraw 手绘风

> 用户给 Mermaid(或要画的图本就是 Mermaid 支持的类型)→ `scripts/mermaid-to-excalidraw.mjs` 按类型转成 Excalidraw 手绘风 `.excalidraw`。
> **agent 写 Mermaid 很熟**,所以常见用法是:agent 先写 Mermaid → 调脚本转手绘风(把 Mermaid 当中间表示)。

## 用法

```bash
node scripts/mermaid-to-excalidraw.mjs 图.mmd --out 图.excalidraw
node scripts/mermaid-to-excalidraw.mjs --text "flowchart TD; A-->B{ok?}; B-->|yes|C"
```

依赖:Node + Playwright + chromium(从 CDN import mermaid/excalidraw,无需 npm 装它们)。

## 类型分派(脚本自动按首行关键词判断)

| Mermaid 类型 | 怎么转 | 手绘原生? |
|---|---|---|
| **flowchart / graph** | Tier 1:官方 `@excalidraw/mermaid-to-excalidraw` | ✅ 原生手绘元素 |
| **sequenceDiagram** | Tier 1:官方库 | ✅ 原生手绘元素 |
| **classDiagram** | getData()(label+members+methods)→ 类框渲染器 + elkjs | ✅ 原生手绘(头部+分隔线+属性+方法) |
| **stateDiagram** | Tier 2:mermaid `getData()` → arch-layout | ✅ 原生手绘元素 |
| **erDiagram** | Tier 2:同上 | ✅(getData 驱动) |
| **C4 / mindmap** | Tier 2:尝试 getData → arch-layout,失败兜底图片 | ✅/兜底 |
| **gantt** | `getTasks()` → 任务行 + 时间条 + 日期轴 | ✅ 原生手绘(section 配色、时间缩放) |
| **pie** | (规划)slices → 自定义扇区/条 | 🚧 mermaid db 较拧,待建 |
| 其它(timeline/gitGraph/xychart/...) | 官方库退化为 **SVG 图片**嵌入 | ❌ 非手绘原生 |

## 两条转换路径

**Tier 1 · 官方库**(flowchart / sequence / class):
`parseMermaidToExcalidraw(src)` → skeleton → `convertToExcalidrawElements` → 原生手绘元素。Excalidraw 官方维护,和 excalidraw.com 的「Mermaid to Excalidraw」同款。

**Tier 2 · getData → arch-layout**(state / er / c4 / mindmap):
官方库对这些只贴 SVG 图片(非手绘)。本 skill 改走:mermaid `db.getData()` 抽出 `{nodes, edges}`(mermaid 11 统一渲染数据)→ 映射成 arch-layout 的 `{nodes, edges, groups}` → `arch-layout.mjs`(elkjs)算 layered + 正交布局 → 手绘风 `.excalidraw`。**复合状态/子图(isGroup)→ 容器**。这正是 arch-layout 的主场。

## 局限(诚实说明)

- **图表类(gantt/pie/timeline/gitGraph/xychart 等)不是图论结构**,getData→arch-layout 不适用,每种要**专属渲染器**:从该类型的 mermaid db 抽数据(各类型 API 不一致:gantt 的 `getTasks()` 顺、pie 的 `getSections()` 拧)→ 自定义画(行/条/扇区)。这是逐类型的渐进开发,**不是缺素材**——drawlib 的 data-viz 占位是静态的、不吃数据,帮不上。
- 还没建专属渲染器的图表类型,暂时官方库退化为 SVG 图片(能用、不可编辑、非手绘)。
- 图片兜底的 `.excalidraw` 含 `image` 元素 + `files`(dataURL);导出 PNG/SVG 用 `excalidraw-to-image.mjs`(已支持传 files)。
- Tier 2 的连线由 elkjs/arch-layout 正交路由;平行边(如状态机 A⇄B)的标签可能略挤,人工微调即可。

## 在工作流里的位置

画图任务里,如果目标图属于 Mermaid 支持的类型且结构清晰(流程/时序/类/状态/ER 等),**优先让 agent 写 Mermaid → 转手绘风**——比手摆元素快且不易错。复杂的自定义架构海报仍走手工构图 + arch-connect。
