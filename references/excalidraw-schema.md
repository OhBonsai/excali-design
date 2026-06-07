# Excalidraw 元素 Schema · 原生能力地图

> 把 Excalidraw 的「config」(每个元素的 JSON 属性)系统梳理成**能力**——不是堆资产,而是用尽它自带的表达力。
> 取值/默认全部核对自官方源:`packages/element/src/types.ts`(`ExcalidrawElement` 等)与 `packages/common/src/constants.ts`。
> 箭头能力另有专章 `references/arrows.md`;本页是全元素总览 + 「想要 X → 设什么」反查表。
>
> **svg-export 支持边界**:本仓库 headless 导出器 `scripts/svg-export.mjs` 覆盖
> rectangle/ellipse/diamond/line/arrow/freedraw/text/image/frame,含全部 Arrowhead 头型、曲线、dashed/dotted、
> hachure/cross-hatch/solid 填充。**不渲染**:zigzag 填充、freedraw 压力 taper、embeddable/iframe、image 的 crop。
> 这些在真 Excalidraw / `excalidraw-to-image.mjs`(playwright)里完整。

## 0. 文件外壳

```json
{ "type":"excalidraw", "version":2, "source":"excali-design",
  "elements":[ /* 元素数组 */ ],
  "appState":{ "viewBackgroundColor":"#ffffff", "gridSize":20 } }
```
`version` 固定 2;`appState` 静态导出只需 `viewBackgroundColor`(背景纸色)和 `gridSize`(默认 20)。

## 1. 所有元素的公共属性(base)

| 属性 | 含义 | 取值 / 默认 |
|---|---|---|
| `id` | 唯一 id | 自起短字符串 |
| `type` | 类型 | rectangle / ellipse / diamond / text / line / arrow / freedraw / image / frame / embeddable / iframe |
| `x` `y` | 左上角(画布像素) | 吸附网格(默认 20) |
| `width` `height` | 尺寸 | 线/箭头 = points 包围盒 |
| `angle` | 旋转 | **弧度**(不是度!),默认 0 |
| `strokeColor` | 描边色 | 默认 `#1e1e1e` |
| `backgroundColor` | 填充色 | 默认 `transparent` |
| `fillStyle` | 填充样式 | `hachure`(斜线,默认)/ `cross-hatch`(交叉)/ `solid`(实心)/ `zigzag` |
| `strokeWidth` | 线宽 | `1` thin / `2` bold(默认)/ `4` extraBold |
| `strokeStyle` | 线型 | `solid`(默认)/ `dashed` / `dotted` |
| `roughness` | 手绘抖动 | `0` architect(近直)/ `1` artist(默认)/ `2` cartoonist(更抖) |
| `roundness` | 圆角算法 | `null` 直角 / `{"type":1}` legacy / `{"type":2}` 比例半径(线/菱形)/ `{"type":3}` 自适应(矩形默认,固定 ~32px) |
| `opacity` | 不透明度 | 0–100,默认 100 |
| `seed` | 手绘随机种子 | 整数;同 seed = 同抖动形状,复刻时固定它 |
| `groupIds` | 所属分组 | 同组一起移动;数组,深→浅 |
| `frameId` | 所属 frame | 见 §frame |
| `boundElements` | 绑定的子元素 | `[{"type":"text","id":..},{"type":"arrow","id":..}]` |
| `link` | 超链接 | url 或 null |
| `locked` | 锁定 | 默认 false |
| `index` | 层序(分数索引) | 决定 z 序;可省(同数组顺序) |
| `isDeleted` | 软删除 | 渲染时过滤掉 true 的 |

> 记账字段 `version`/`versionNonce`/`updated` 是协作用的,**静态生成可全省**;导出器只看上表那些。

## 2. 取值词汇表(config vocabulary —— 这些就是「旋钮」)

- **填充 `fillStyle`**:hachure / cross-hatch / solid / zigzag。手绘风默认 hachure;要干净实心用 solid。
- **线型 `strokeStyle`**:solid / dashed / dotted。异步/弱关系/边界常用 dashed。
- **抖动 `roughness`**:0 / 1 / 2。正式架构图压到 0–1;概念草图可 1–2。**注意**:roughness 只抖描边路径,几何边界仍精确(图表柱高/饼角不会因此失真)。
- **线宽 `strokeWidth`**:1 / 2 / 4。
- **圆角 `roundness`**:null / {type:1|2|3}。矩形圆角用 type:3;**线/箭头要曲线用 type:2**;菱形用 type:2。
- **字体 `fontFamily`**(整数):1 Virgil(手绘)· 2 Helvetica(无衬线/正式)· 3 Cascadia(等宽/代码)· 5 Excalifont(新版手绘默认)· 6 Nunito · 7 Lilita One · 8 Comic Shanns · 9 Liberation Sans · 10 Assistant。**本仓库渲染器与 svg-export 用 1/2/3**;手绘选 1,正式选 2,技术/代码选 3。
- **字号 `fontSize`**:16 sm / 20 md(默认)/ 28 lg / 36 xl(任意正数也可)。
- **水平对齐 `textAlign`**:left / center / right。**垂直 `verticalAlign`**:top / middle / bottom。
- **主题**:light / dark(导出一般 light)。

## 3. 各元素类型 + 它解锁的能力

### 矩形 / 菱形 / 椭圆(rectangle / diamond / ellipse)
基础容器/节点。能力:`fillStyle`(含 zigzag/cross-hatch 做纹理区分)、`roundness`、`opacity` 做层次、`strokeStyle:dashed` 做虚线框/边界。菱形=判定/选择;椭圆=起止/事件。

### 文字(text)
```json
{ "type":"text","x":120,"y":120,"text":"Auth\nService","fontSize":20,"fontFamily":2,
  "textAlign":"center","verticalAlign":"middle","containerId":"box1","lineHeight":1.25 }
```
- 多行用 `\n`;`lineHeight` 无单位(×fontSize=像素行高)。
- **容器内文字(关键能力)**:`containerId` 指向框(rectangle/diamond/ellipse/**arrow**),并在框的 `boundElements` 里登记 → 文字自动居中、随框走。内边距 `BOUND_TEXT_PADDING=5`。
- `autoResize`:true 文字撑宽;false 按给定宽换行。

### 线 / 箭头(line / arrow)——表达力最强,见 `references/arrows.md`
- `points`:相对 `x,y` 的点数组;**≥3 点 + `roundness:{type:2}` = 平滑曲线**。
- `startArrowhead` / `endArrowhead`(两端独立,`null`=无头,两端 null=纯线条):
  `arrow / triangle / triangle_outline / diamond / diamond_outline / circle(旧 dot) / circle_outline / bar /
  cardinality_one|many|one_or_many|zero_or_one|zero_or_many|exactly_one`(旧 `crowfoot_*`)。
- **中间文字**:绑定 text(`containerId`=箭头 id + `verticalAlign:middle`,箭头 `boundElements` 互登记)。
- `elbowed:true`:正交直角走线(+ `fixedSegments` 固定段)。
- `line` 专有 `polygon:true`:闭合成多边形(可填充)。
- **绑定** `startBinding`/`endBinding`(`FixedPointBinding`):
  `{ "elementId", "fixedPoint":[fx,fy](0–1 相对框左上), "mode":"orbit"|"inside"|"skip" }`;旧式 `{elementId,focus,gap}` 也认。绑定后随框移动。静态导出可省绑定(坐标已定),交互续编才需要。

### 自由画(freedraw)
`points` + `pressures`(每点压力,变宽=铅笔 taper)+ `simulatePressure`。**注意**:svg-export 按普通路径渲,压力 taper 不显示(要真 Excalidraw)。

### 图片(image)
`{ "type":"image","fileId":"f1","width":..,"height":..,"scale":[1,1],"crop":null }` +
文件内容放顶层 `files`:`{ "f1": { "mimeType":"image/png", "dataURL":"data:image/png;base64,..." } }`。
能力:内嵌任意位图/SVG(本仓库用它嵌 **LaTeX 公式 SVG**,见 render-formula)。`scale:[-1,1]` 水平翻转。
MIME:png/jpg/svg+xml/gif/webp/bmp/avif。

### 帧(frame / magicframe)
`{ "type":"frame","name":"登录流","x":..,"y":..,"width":..,"height":.. }`,子元素设 `frameId` 指向它。
能力:**可视分区/画板**(给一组元素一个有名边框,如多屏原型的每屏一帧)。frame 默认 `#bbb` 描边、8px 圆角、`roughness:0`。

### embeddable / iframe
嵌网页/视频。**静态导出不适用**(需活渲染),且属 `LIBRARY_DISABLED_TYPES`。本技能产静态图,基本不用。

## 4. 绑定模型(让图「活」起来)

三种绑定,都是**双向登记**:
- **文字↔容器**:text.`containerId` ↔ 容器.`boundElements`(文字居中、随框)。
- **箭头↔节点**:arrow.`startBinding/endBinding` ↔ 节点.`boundElements`(连线随框,改布局不脱线)。架构图连线**必须**绑定。
- **frame↔子元素**:子.`frameId` ↔(frame 不需反登记,按 frameId 聚合)。

## 5. 反查表:想要 X → 设什么(最常用)

| 想要的效果 | 设置 |
|---|---|
| 纯线条(无箭头) | `arrow` 两端 `null`,或 `type:"line"` |
| 换箭头头型(UML/ER/圆点/方块) | `startArrowhead`/`endArrowhead` 见 §3 枚举 |
| 双向箭头 | 两端都设头型 |
| 连线中间放标签 | 绑定 text(containerId=箭头 + boundElements) |
| 曲线连接 | `points` ≥3 + `roundness:{type:2}` |
| 直角连接 | `elbowed:true` |
| 虚线/点线 | `strokeStyle:"dashed"`/`"dotted"` |
| 框里居中文字 | text.`containerId` + 容器.`boundElements` |
| 圆角矩形 | `roundness:{type:3}` |
| 实心/斜线/交叉/锯齿填充 | `fillStyle: solid / hachure / cross-hatch / zigzag` |
| 更干净(少手绘味) | `roughness:0` |
| 淡化次要元素 | `opacity` 调低(如 60) |
| 一组一起移动 | 同 `groupIds` |
| 命名分区/画板 | `frame` + 子元素 `frameId` |
| 内嵌图片/公式 | `image` + 顶层 `files[fileId].dataURL` |
| 水平翻转图片 | `scale:[-1,1]` |
| 锁定不可选 | `locked:true` |
| 超链接 | `link:"https://…"` |
| 闭合可填充折线 | `line` + `polygon:true` |

## 6. 默认值(可省略的字段)

`fillStyle:solid? ` 实际默认 hachure;`strokeWidth:2`、`strokeStyle:solid`、`roughness:1`、`opacity:100`、
`backgroundColor:transparent`、`strokeColor:#1e1e1e`、`fontFamily:Excalifont(5)`(本仓库用 2)、`fontSize:20`、
`textAlign:left`、`verticalAlign:top`、`gridSize:20`、`roundness`(矩形 type:3,其余 null)。
写全更可控;但只要 `type`+`x`/`y`(+形状的 `width`/`height`、文字的 `text`、线的 `points`)就能渲。
