# 在 Excalidraw 能力框架内完成编码(理论 ↔ d.ts)

> 把编码理论(Bertin 视觉变量 / Cleveland-McGill 精度 / Mackinlay APT,见 `iterate/thinking.md` §6 B)
> 逐条落到 Excalidraw 真实的元素属性(`references/excalidraw-schema.md`)。
> 一句话:**理论说「该用什么编码」,d.ts 说「这工具有什么编码」,交集 = 在 Excalidraw 里能忠实编码的可行集。**

## 0. 核心结论

Mackinlay 的编码通道里有 **connection(连接)** 和 **containment(包含)** 两个**关系通道**,而它们正是 Excalidraw
最强的原生能力(`arrow` + binding / `frame` + 嵌套)。所以理论 × d.ts 的交集得出一个定位判断:

> **Excalidraw 是关系图工具,不是统计图工具。** 它的忠实编码偏向「关系」(连接/包含);
> 定量数据只有 position / length 少数几条忠实路径(bar 高、时间轴),其余(面积/角度/色相表数量)都看不准 → 该交给 chart 渲染器并被 faithfulness lint 管住。

## 1. Bertin 视觉变量 → Excalidraw 旋钮(实现矩阵)

| 视觉变量 | Excalidraw 旋钮(d.ts) | 适合数据类型 | svg-export 保真 | 备注 |
|---|---|---|---|---|
| 位置 position | `x,y` / `points` | 定/序/名/关系 全 | ✓ | 最强,唯一天然定量 |
| 长度 length(1D) | 单轴 `width` 或 `height`(bar)/ 线段长 | 定量 | ✓ | 次强,精确量首选 |
| 大小/面积 size(2D) | `width`×`height` 缩放、`fontSize` | 定量(弱) | ✓ | 面积看不准,慎用 |
| 明度 value | `opacity`(0–100)/ 填充·描边明度 | 有序 | ✓ | opacity 是干净的有序通道 |
| 饱和 saturation | 颜色饱和度 | 有序 | ✓ | |
| 色相 hue | `strokeColor` / `backgroundColor` | **名义** | ✓ | 类别最佳;预算 ≤4 |
| 方向 orientation | `angle`(弧度) | 名义(弱) | 渲染但手绘抖 | 不适合编码数据,少用 |
| 形状 shape | 元素类型(rect/ellipse/diamond)+ **drawlib 图标** | 名义 | ✓ | **这就是「资产」的位置:shape 编码 = 图标库** |
| 纹理 texture | `fillStyle`(hachure/cross-hatch/solid/zigzag)+ `strokeStyle`(solid/dashed/dotted) | 名义/选择 | 部分(zigzag 不渲) | Excalidraw 真有 texture 通道 |
| **连接 connection** | **`arrow` + binding**(头型区分关系种类) | **关系(有向)** | ✓ | **Excalidraw 主场** |
| **包含 containment** | **`frame` / 嵌套 rect / 虚线 boundary** | **关系(集合归属)** | ✓ | **Excalidraw 主场** |

**缺口**(理论要、Excalidraw 没有的通道):连续渐变填充(用 hachure 密度 / opacity 近似)、真 3D/体积(本就不该用)、可靠的 orientation 编码。标明 = 不硬上。

## 2. 按数据类型选编码(在 Excalidraw 里具体怎么落)

| 数据类型 | 在 Excalidraw 里用 | 禁/慎 |
|---|---|---|
| 定量 quantitative | position(gantt 时间轴 / 散点)、length(bar 高) | ✗ hue / 面积 / 角度 表精确量 → 走 chart 渲染器 |
| 有序 ordinal(优先级/严重度) | `opacity` 或 size 梯度 | ✗ hue(无序) |
| 名义 nominal(类别) | hue(≤4)/ shape(drawlib 图标)/ texture(fillStyle、dashed)/ containment(frame 分组) | ✗ 排到位置/长度轴 |
| **关系 relational(架构/流程/时序 —— 本技能主体)** | **connection(`arrow`,头型表关系种类:UML/ER/普通)+ containment(`frame`/嵌套/boundary)** | ✗ 只靠「空间邻近」暗示关系(歧义) |

例:mindmap 一级分支配色 = 名义用 hue(正解);架构服务类型 = shape 用 drawlib 图标;类图关系 = connection 用箭头头型;泳道/边界 = containment 用 frame/虚线框。

## 3. expressiveness / effectiveness → Excalidraw 专属 lint

**expressiveness(恰好编码全部且仅有事实):**
- 名义数据排上位置/长度轴(凭空造顺序)→ **error**
- 截断轴(bar 不从 0)→ **error**(graphical integrity)
- **彩虹色 = 色相在变却不编码任何类别 → 凭空编码了不存在的「类别事实」→ expressiveness 违反**
  (这把 `color-budget` / 反 slop 接到了诚实性理论上,不只是「丑」)
- 关系画了却不 binding(连线浮空)→ 关系没被真正编码(改布局即丢)→ **warn**

**effectiveness(有更准的没用):**
- 数量用了 area/hue,而 length/position 可用 → **warn**(退档)
- 关系只用「靠近」(空间邻近),没用 connection/containment 显式通道 → 歧义(gestalt 邻近 ≠ 声明关系)→ **warn**

落点:前两条进 chart faithfulness lint(§9.2);彩虹/预算进 `arch-lint` color-budget + `floor-check`;浮空连线已在 `arch-lint` arrow-unbound。

## 4. 接 dispatch / compute / lint(把它变成回路)

```
①content IR 给每个字段标数据类型(定/序/名/关系)
  → dispatch 查「类型 → Excalidraw 通道」表(本页 §1+§2)
  → compute 选 mark + 属性(忠实集内的最优,= Mackinlay effectiveness)
  → render(.excalidraw)
  → arch-lint / floor-check 查 expressiveness/effectiveness 残差(§3)
```
这正是 Mackinlay APT「express → effective → render」回路在 Excalidraw 能力框架内的实例化。

## 5. 一句话收口

**理论给「该用什么编码」,d.ts 给「有什么编码」,交集才是可行的忠实编码集;交集之外要么近似(渐变→hachure 密度)、要么明确放弃(3D/orientation)。Excalidraw 的交集偏向关系编码(connection/containment)——这从编码理论层面解释了它为什么是图解工具而非统计图工具。**
