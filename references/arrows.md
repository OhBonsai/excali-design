# Arrows & lines — Excalidraw 的强项(端点头型 / 中间文字 / 曲线 / 绑定 / 直角)

箭头是 Excalidraw 表达力最强、却最常被本技能用浅的图元。一条 `arrow`/`line` 能做到:
**两端各自换头型**(含纯线条)、**中间嵌标签**、**多控制点拉曲线**、**直角(elbow)走线**、**两端绑定到图形**。
schema 见 `references/element-format.md`;本页是箭头专章。所有取值核对自 Excalidraw 官方
`packages/element/src/types.ts`(`Arrowhead` 枚举),并经 `svg-export.mjs` 渲染验证。

> headless 预览:`scripts/svg-export.mjs` 已支持下述全部头型 + 曲线(`roughjs` 的 `gen.curve`),
> 预览即所见。导出的 `.excalidraw` 在 excalidraw.com 内为完全保真。

## 1) 端点头型 `startArrowhead` / `endArrowhead`

`arrow`/`line` 各有独立的起点、终点头型。取值(`null` = 该端无头):

| 取值 | 形态 | 典型用途 |
|---|---|---|
| `null` | 无 | 纯线条端;两端都 null → 一条线 |
| `"arrow"` | 开口 V(默认终点) | 普通有向边 |
| `"triangle"` | 实心三角 | 强指向 |
| `"triangle_outline"` | 空心三角 | UML 继承/实现 |
| `"diamond"` / `"diamond_outline"` | 实/空心菱形 | UML 组合 / 聚合 |
| `"circle"`(旧名 `"dot"`) / `"circle_outline"` | 实/空心圆 | 端点标记 / BPMN |
| `"bar"` | 垂直短杠 | 终止/边界 |
| `"cardinality_one"`(旧 `"crowfoot_one"`) | 一杠 | ER:恰一 |
| `"cardinality_many"`(旧 `"crowfoot_many"`) | 鸦爪三叉 | ER:多 |
| `"cardinality_one_or_many"` | 叉 + 杠 | ER:一或多 |
| `"cardinality_zero_or_one"` | 圈 + 杠 | ER:零或一 |
| `"cardinality_zero_or_many"` | 圈 + 叉 | ER:零或多 |
| `"cardinality_exactly_one"` | 双杠 | ER:精确一 |

**纯线条 = 两端都 `null`**(也可直接用 `type:"line"`)。**双向箭头** = 两端都设头型。

```jsonc
// 纯线条(分隔线/连接线，无头)
{ "type":"arrow", "startArrowhead":null, "endArrowhead":null, ... }
// UML 继承:子 →▷ 父(空心三角指向父类)
{ "type":"arrow", "startArrowhead":null, "endArrowhead":"triangle_outline", ... }
// ER:一对多
{ "type":"arrow", "startArrowhead":"cardinality_one", "endArrowhead":"cardinality_many", ... }
```

## 2) 中间文字(绑定标签)

箭头中段的文字是一个 **`text` 子元素**,通过双向引用绑定:

- `text.containerId` = 箭头 `id`
- `text.verticalAlign = "middle"`、`textAlign = "center"`
- 箭头 `boundElements` 数组里加 `{ "type":"text", "id":"<文字id>" }`

Excalidraw 会自动把它摆在箭头中点;**手写时把 text 的 `x/y` 设成箭头中点附近**(svg-export 按 text 自身 x/y 画),约 `(箭头中点x − 文字宽/2, 中点y − fontSize/2)`。

```jsonc
{ "type":"arrow", "id":"e1", "points":[[0,0],[300,0]],
  "boundElements":[{"type":"text","id":"e1lbl"}], ... },
{ "type":"text", "id":"e1lbl", "containerId":"e1",
  "text":"owns", "verticalAlign":"middle", "textAlign":"center",
  "x":/*中点x-宽/2*/, "y":/*中点y-8*/, ... }
```

> 本技能的 mermaid 模板渲染器(sequence/class/ER/flowchart)已用「离线标签」画边标签(独立 text,
> 不绑定),那是为了精确避让路由;**手绘/少量边**时优先用绑定标签,跟着箭头走、更省心。

## 3) 曲线(多控制点)

`points` 给 **≥3 个点** + `roundness:{ "type":2 }` → 平滑穿过控制点的曲线;
`roundness:null` → 直角折线。曲线适合避让、表达「关系」而非「流程」、让放射图更有机。

```jsonc
{ "type":"arrow", "points":[[0,0],[140,90],[300,0]], "roundness":{"type":2},
  "width":300, "height":90, ... }   // width/height = points 的包围盒
```

`width`/`height` 必须等于 points 的包围盒(max−min),否则选中框错位。

## 4) 直角箭头(elbow)

`elbowed:true` → 正交折线(自动绕行)。配合 `startBinding`/`endBinding` 时 Excalidraw 会重算拐点。
本技能架构图的正交路由走 `arch-connect.mjs`(更可控);**手画连接器**想要直角就置 `elbowed:true`。

## 5) 两端绑定到图形 `startBinding` / `endBinding`

```jsonc
"startBinding": { "elementId":"<图形id>", "focus":0, "gap":4 }
```
新版用 `FixedPointBinding`:`{ "elementId", "fixedPoint":[fx,fy], "mode":"orbit" }`,
`fixedPoint` 是相对图形左上角的 0–1 比例锚点,`mode`:`"orbit"`(停在外缘)/`"inside"`/`"skip"`。
绑定后图形移动箭头自动跟随。**离线导出 PNG 不需要绑定**(坐标已定);绑定是为了用户在 app 里继续拖。

## 速查

- 一条线:`type:"arrow"` 两端 `null`,或 `type:"line"`。
- 换头型:`startArrowhead` / `endArrowhead`(枚举见上表,`null`=无)。
- 中间字:绑定 `text`(`containerId`+`boundElements` 互指,`verticalAlign:"middle"`)。
- 拉曲线:`points` ≥3 + `roundness:{type:2}`;直角:`elbowed:true`。
- 跟随图形:`startBinding`/`endBinding`(app 内交互用;静态导出可省)。
