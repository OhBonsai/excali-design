# Excalidraw 元素格式 · 离线参考

> 这是 Excalidraw MCP `read_me` 的离线备份版,确保 MCP 不可用时也能按规格画。
> 用 `create_view` 前若 MCP 可用,**优先实时调 `read_me`**(可能含最新调色板/示例)。

## 一个元素的通用字段

每个 Excalidraw 元素是一个 JSON 对象。最小可用字段:

```json
{
  "type": "rectangle",
  "x": 100, "y": 100,
  "width": 200, "height": 80,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "strokeStyle": "solid",
  "roughness": 1,
  "roundness": { "type": 3 }
}
```

完整字段(create_view 通常会补默认值,但显式写更可控):

| 字段 | 说明 | 常用值 |
|---|---|---|
| `type` | 元素类型 | `rectangle` `ellipse` `diamond` `arrow` `line` `text` `freedraw` `frame` `image` |
| `x` `y` | 左上角坐标(画布像素) | 吸附到 20 的倍数(网格) |
| `width` `height` | 尺寸 | — |
| `angle` | 旋转弧度 | 默认 0 |
| `strokeColor` | 描边色 | 见调色板 |
| `backgroundColor` | 填充色 | `transparent` 或调色板 |
| `fillStyle` | 填充样式 | `solid` `hachure`(斜线) `cross-hatch` |
| `strokeWidth` | 线宽 | `1`(细) `2`(中) `4`(粗) |
| `strokeStyle` | 线型 | `solid` `dashed` `dotted` |
| `roughness` | 手绘抖动度 | `0`(近直) `1`(默认) `2`(很抖) |
| `roundness` | 圆角 | `{"type":3}` 圆角 / `null` 直角 |
| `opacity` | 不透明度 | 0–100 |
| `strokeSharpness` | 旧版圆角字段 | `sharp` / `round`(老格式) |
| `seed` | 手绘随机种子 | 任意整数,决定抖动形状(同 seed = 同形状;重画/复用时固定它形状才稳定) |
| `groupIds` | 分组 id 数组 | 同组元素一起移动 |
| `boundElements` | 绑定的子元素(如框上的文字、连到框的箭头) | `[{"type":"text","id":"..."},{"type":"arrow","id":"..."}]` |

## 文字元素(text)

```json
{
  "type": "text", "x": 120, "y": 120,
  "text": "Auth Service",
  "fontSize": 20,
  "fontFamily": 1,
  "textAlign": "left",
  "verticalAlign": "top",
  "strokeColor": "#1e1e1e"
}
```

- `fontFamily`: `1` = Virgil(手绘体,默认) · `2` = Normal(Helvetica,正式) · `3` = Code(等宽,技术图)
- `fontSize`: 16(S) / 20(M,默认) / 28(L) / 36(XL)
- **容器内文字**:要让文字居中在框里,把 text 元素的 `containerId` 指向框 id,并在框的 `boundElements` 里登记该 text。

## 箭头 / 连线(arrow / line)

```json
{
  "type": "arrow",
  "x": 300, "y": 140,
  "width": 120, "height": 0,
  "points": [[0,0],[120,0]],
  "startBinding": { "elementId": "box-a", "focus": 0, "gap": 4 },
  "endBinding":   { "elementId": "box-b", "focus": 0, "gap": 4 },
  "startArrowhead": null,
  "endArrowhead": "arrow"
}
```

- `points`: 相对 `x,y` 的折线点数组。直线两点,折线多点。
- `startBinding`/`endBinding`: **绑定到框**——框移动时箭头自动跟随。`elementId` 指向框 id;被绑的框要在其 `boundElements` 里登记这条箭头。**架构图的连线一定要 binding**,否则改布局时线会脱节。
- `endArrowhead`: `arrow` `triangle` `dot` `bar` `null`。
- 数据流方向 = 箭头方向,**全图保持一致**(左→右 或 上→下)。

## 调色板(克制!全图 ≤ 4 色)

Excalidraw 官方手绘色板(描边用):

| 语义 | 色值 | 用途 |
|---|---|---|
| Ink(主) | `#1e1e1e` | 默认描边、文字、主体框 |
| Gray | `#868e96` | 次要/弱化元素、辅助说明 |
| Red | `#e03131` | 错误流、告警、删除 |
| Green | `#2f9e44` | 成功流、新增、健康 |
| Blue | `#1971c2` | 主数据流、链接、强调一类 |
| Orange | `#f08c00` | 强调二类、外部依赖 |
| Violet | `#7048e8` | 强调三类(慎用) |

填充背景用浅色版(低饱和):`#ffec99`(黄)`#b2f2bb`(绿)`#a5d8ff`(蓝)`#ffc9c9`(红)`#eaddd7`(米)`transparent`。

**纪律**:颜色**编码语义**(同类服务同色),不是装饰。一张图主体 `#1e1e1e`,最多再用 2-3 个色区分类别。详见 `color-system.md`。

## create_view 输入

`create_view` 的 `elements` 参数 = 上述元素对象数组的 **JSON 字符串**。要求:
- 合法 JSON:无注释、无尾逗号、紧凑
- 每个元素至少有 `type` `x` `y`(+ 形状的 `width`/`height`,文字的 `text`,箭头的 `points`)
- id 自己生成(短字符串即可),binding 双向登记

## 直接产 .excalidraw 文件(MCP 不可用时)

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "excali-design",
  "elements": [ /* 同上元素数组 */ ],
  "appState": { "viewBackgroundColor": "#ffffff", "gridSize": 20 }
}
```

写成 `xxx.excalidraw` 文件,用户拖进 excalidraw.com 即可打开。
