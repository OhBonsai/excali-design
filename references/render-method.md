# 模板化渲染一个 Mermaid 图类型 · 方法论

> 这份文档沉淀的是**做法**,不是某一张图。它记录了我们怎么把 flowchart 从"通用 mermaid 转换"
> (效果差、不可控)重写成"模板化渲染"(`render-flowchart.mjs`,效果好、风格可切)。
> 同一套方法可以照搬到 sequence / class / state / ER 等其他 mermaid 类型。

## 0. 为什么要"模板路径",而不是通用转换

通用 `mermaid-to-excalidraw` 把任意 mermaid 图按一套泛化规则转一遍,结果是"哪种都画得出来,
但哪种都画不好":布局是别人的、风格锁死、形状语义丢失。系统性问题,换更强的模型也救不了。

模板路径反过来:**一个图类型,一个专用渲染器**。它知道这类图的惯例(flowchart 单一主方向、判定分叉、
回环;sequence 是泳道+时间轴;state 是状态圈+转移),于是布局、路由、配色都能贴着惯例做对。

代价是每个类型要单独写。但写一次,这类图就永远画得好,且能换风格。值。

整件事分两半:**物料**(画什么——形状词汇 + 风格预设)和**设计**(怎么摆——布局/路由/映射的管线)。

---

## 第一半:如何做物料

物料 = 这类图的**形状词汇**,以及每种形状在**各风格下**的描边/填充规则。分四步。

### 物料 Step 1 · 程序化造一张"完整组件参考表"

先把这类图 ISO/ANSI 标准里**所有**形状,用代码画成一张手绘风的 excalidraw 参考表
(网格排列 + 每格标注中英文名)。关键点:

- **求最完备**:把标准里实际会用到的符号一次列全(flowchart 是 31 个:处理/判定/数据库/文档/
  泳道/连接…),宁可多列也别漏。漏了的形状,后面渲染器就没法表达那个语义。
- **纯代码生成**:写一个 `build-*-components.mjs`,用基础图元(rectangle/diamond/ellipse/line)
  + 多边形/弧线辅助函数拼出每个符号。好处是可参数化、可复算、改一处全表更新。
- **故意留白**:真正过时的符号(纸带/磁鼓/collate 等)不画,避免噪音。
- 产物:`assets/mermaid-components/flowchart-components-full.{excalidraw,png}`(参见 `scripts/build-flowchart-components.mjs`)。所有组件参考表统一放 `assets/mermaid-components/`,不放仓库顶层。

这张表有两个用途:① 给图像模型当**生成约束 + 风格锚点**;② 自己当**形状字典**(渲染器照着实现几何)。

### 物料 Step 2 · 拿参考表喂 gpt-image-2,生成"风格化组件表"

参考表不是让模型"照着实现",而是作 **image-to-image 的结构约束**:锁死网格位置、图元数量、标注,
**只换风格**。提示词结构固定(见 `prompts/flowchart-styles.md`):

```
公共前缀:Redraw the SAME N symbols, SAME grid positions, do NOT add/remove/rearrange.
         Keep every symbol identifiable. Keep captions. Restyle as:
风格块:  <一段只描述描边/填充/线质/配色的风格语言>
```

锁死结构后,模型产出的每一张风格化组件表都能和你代码里的 N 格**一一对位**,后面还原时不会错位。

### 物料 Step 3 · 只选 Excalidraw "能复刻"的风格(关键纪律)

图像模型能画出很多好看的质感,但 Excalidraw 只有有限几个旋钮。**风格要落在这些旋钮上,否则还原必失真**:

| 可复刻旋钮 | 取值 |
|---|---|
| `fillStyle` | `hachure`(斜线手绘填充) / `cross-hatch` / `solid` |
| `roughness` | `0` 建筑师(近乎直) / `1` 艺术家 / `2` 漫画家(很抖) |
| `strokeStyle` | `solid` / `dashed` / `dotted` |
| `strokeWidth` | `1` 细 / `2` 粗 / `4` 极粗 |
| `strokeColor` / `backgroundColor` | 任意 hex |
| 画布底色 `viewBackgroundColor` | 纯色(**不能有纹理**) |

**不可复刻**(写进提示词只会误导,还原时拍平):纸张颗粒、彩铅不均匀涂抹、水彩晕染、渐变、阴影、柔和质感。

判断口诀:**配色 + 形状 + 纯色填充 + 纯色底 = 能复刻;一切"纹理/笔触质感" = 不能**。
所以"暖米底粉彩"能做(纯色平涂粉彩 + 米黄底),但"暖米底**纸张颗粒**"不能——把"颗粒"二字去掉即可。

### 物料 Step 4 · 组件还原 → STYLE 预设表

拿回每张风格化组件表,逐格提取该形状的 `stroke / fill / fillStyle / roughness / strokeStyle /
strokeWidth`,归纳成一个 `STYLE` 预设。一个风格 = 一组规则:

```js
'hachure-classic': { paper:'#ffffff', sw:1.6, rough:1, fs:'hachure',
  fill:(type)=>({process:'#74c0fc',decision:'#69db7c',start:'#ff8787'}[type]||'#adb5bd') }
'pastel-journal':  { paper:'#fdf6e3', sw:2.4, rough:1.4, fs:'solid', catfill:true }  // 按类别配色
```

这张 `STYLES` 表就是渲染器的风格层。加一个风格 = 加一行,渲染器的几何/布局完全不动。

> 已沉淀的可复刻风格清单 + 对应 gpt 提示词:`prompts/flowchart-styles.md`(11 个)。

---

## 第二半:如何设计渲染管线

设计 = 把"一段结构化描述"变成图的**五层流水线**。组件只是最后渲染那一步用到的图元。

```
data(节点+边+type) ─→ IR ─→ ① 布局 ─→ ② 路由 ─→ ③ role→shape→color ─→ ④ STYLE ─→ ⑤ 渲染 excalidraw
                                                                              ↑ 物料(组件+预设)只在这两步
```

### IR · 统一数据模型

不管输入是 mermaid 还是手写 JSON,先归一成一个中间结构(IR),后面所有层都只认 IR:

```json
{ "direction":"TD|LR", "style":"...", "lanes":["INPUT","PROCESS"],
  "nodes":[{"id","label","type","lane?"}], "edges":[{"from","to","label?"}] }
```

`type` 是语义角色(start/decision/data/document…),**不是形状**。形状由第③层决定。
mermaid 解析器(`mermaid-to-case.mjs`)只干一件事:把 mermaid 语法翻成这个 IR。

### ① 布局(最关键,缺它全盘皆空)

flowchart 用**分层定向布局**(Sugiyama-lite):

1. **检回边**:DFS,指向栈上节点的边 = 回边(feedback loop),先从 DAG 里摘掉。
2. **定 rank**:最长路径,决定节点在主方向的层号。
3. **同层排序**:重心法(barycenter)几趟,减少连线交叉。
4. **横向对齐**:坐标松弛——每个节点向邻居重心靠拢,再做防重叠推挤。让主脊尽量对齐成一条线。
5. 泳道模式下,横向坐标改由 lane 决定(见下)。

> 不同图类型这一层换算法:sequence 是"actor 定列 + message 定行";state 用力导向/分层都行。**布局是每个类型最需要重写的部分**。

### ② 路由(正交连线)

- 端口:从节点的边(上下左右)出入,不从角上斜拉。
- 普通边:同列直线,错位走**直角肘形**(elbow)。
- **回边**:沿被跨越区域的外侧走廊绕回去,成为视觉上的"循环",而不是穿过节点。
- **分支标签**(Yes/No):放在线段**旁边**(垂直偏移),不压在箭头上。
- 箭头端点压在节点边缘下层,节点最后画,盖住端点。

铁律:**永不手估坐标**。坐标全由布局+路由算出来。

### ③ role → shape → color

IR 的 `type` 在这里翻译成"画哪个图元 + 取哪个语义色":

| type | 形状 | mermaid 语法 |
|---|---|---|
| start/end | 胶囊(圆角窄矩形) | `([..])` |
| process | 矩形 | `[..]` |
| decision | 菱形 | `{..}` |
| io | 平行四边形 | `[/../]` `[\..\]` |
| data | 柱体 | `[(..)]` |
| document | 波形底 | `>..]` |
| manual | 梯形 | `[/..\]` `[\../]` |
| preparation | 六边形 | `{{..}}` |
| subroutine | 双边矩形 | `[[..]]` |
| connector | 小圆 | `((..))` |

颜色:语义编码(起止/判定/数据各一色),或按类别配色(泳道场景)。**不要彩虹色**。

### ④ STYLE(套预设)

第③层只决定"形状 + 语义角色",具体描边/填充/线质由当前 `STYLE` 预设(物料 Step 4)统一施加。
换风格 = 换预设名,一个参数。

### ⑤ 渲染 + 附加层

- 渲染成 excalidraw 元素,导出 PNG(`svg-export.mjs`,无 chromium)。
- **泳道**:`subgraph` → 纵向 lane,画虚线分隔 + lane 标题;节点横坐标按 lane 分带。
- **图例**:从实际用到的类别自动生成。
- 最后**眯眼测试**(blur 后还能认出结构吗?)+ `arch-lint`。

### 计算 / 旋钮 / 概率 三分法(贯穿设计的哲学)

- **能算的就算**(human + code 是可靠底线):布局坐标、路由、对齐、回边——纯几何,交给代码,确定且可复现。
- **能枚举的做成旋钮**:风格、方向、配色——做成 `STYLE` / `direction` 参数,人来选。
- **只在必要处用模型**:把自然语言流程**翻成 mermaid/IR** 这步交给大模型;它一旦翻对,后面全是确定性渲染。
  概率是补充,不是唯一——probability lends us wings, but never holds the lamp。

---

## 如何套用到下一个 mermaid 类型(复刻 checklist)

做 sequence / class / state 时,照下面走:

1. **物料 Step 1–4**:画该类型的完整组件表(sequence:actor 框/生命线/激活条/同步异步箭头/alt-loop 框…)
   → 喂 gpt-image 出风格化表(复用同一套公共前缀)→ 只选可复刻风格 → 还原成 `STYLES` 预设。
   **风格预设大概率能直接复用 flowchart 那 11 个的旋钮逻辑**。
2. **IR**:定该类型的数据模型(sequence:`actors[] + messages[{from,to,text,kind}]`)。
3. **解析器** `mermaid-to-<type>-case.mjs`:mermaid 语法 → IR(注意 id 字符类别含 `-`,会把 `-->` 吃成节点——
   这是 flowchart 解析踩过的坑)。
4. **布局**:这是要重写的核心。换成该类型的布局算法。
5. **路由 + role→shape→color + STYLE + 渲染**:大量可复用 flowchart 的渲染原语(R/Dm/El/Ln/Ar/T)和 STYLE 机制。
6. **测试**:加几个 `examples/<type>/cases/*.mmd`,用 `test-*.mjs` 挑 case/风格快测;再用 eval `method` 模式
   做"老路 vs 新路"A/B(v0.5.0 vs 新 tag)。

可复用程度:**渲染原语、STYLE 机制、物料流程、IR 模式 ≈ 全复用;布局算法 = 每类重写;解析器 = 每类新写**。

---

## 文件地图(flowchart 这一套的产物)

| 文件 | 职责 |
|---|---|
| `scripts/build-flowchart-components.mjs` | 程序化造 31 图元完整参考表(物料 Step 1) |
| `prompts/flowchart-styles.md` | 11 个可复刻风格 + gpt-image 提示词(物料 Step 2–3) |
| `scripts/render-flowchart.mjs` | 五层渲染管线 + `STYLES` 预设表(设计 ①–⑤ + 物料 Step 4) |
| `scripts/mermaid-to-case.mjs` | mermaid flowchart 语法 → IR |
| `scripts/test-flowchart.mjs` | 挑 case/风格快速测试 |
| `examples/flowchart/cases/*.mmd` | 7 个精选测试用例 |
| `references/flowchart.md` | 使用说明(命令/风格/形状映射/数据模型) |

一句话:**物料解决"画什么、什么风格",设计解决"怎么摆";物料可大量复用,设计里只有布局每类要重写。**
