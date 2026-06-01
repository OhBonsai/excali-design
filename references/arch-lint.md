# 架构图美学 = 物理规则(生成 + lint,不靠肉眼)

> 把「图好不好看」从主观肉眼判断,降维成**确定性几何规则**。两层:
> **预防**(从组件树用布局引擎生成,数学上不重叠)+ **检测**(`arch-lint.mjs` 查几何不变量)。
> 这是 huashu-design「品味 = 可证伪的物理」哲学在 Excalidraw 布局上的落地。

## 为什么需要这个

手摆坐标 + 肉眼查 = 必然出 bug:框重叠、差几像素的错位、箭头压过框、颜色失控。
人眼会疲劳、会漏;**几何规则不会**。架构图本质是**有向图(DAG)**,图布局是个被研究透的问题——
不该靠直觉摆,该靠引擎算。

## 第一层 · 预防:从组件树生成,别手摆

架构图 = `{nodes, edges, layers}`。正确流程:

```
声明组件树(节点+类型+边+分层) → 布局引擎算坐标 → 发 Excalidraw 元素
```

布局引擎选型(按图的"形状"选,不是按喜好):

| 图的形状 | 用什么 | 为什么 |
|---|---|---|
| **分层架构 / 数据流 / 调用链(DAG,主流)** | **Layered layout**(Sugiyama:分 rank → rank 内排序减交叉 → 坐标分配带 min-gap)。等价 Graphviz `dot` / dagre / ELK | 数学保证:同层对齐、层间等距、**不重叠**、最小化交叉。架构图的标准答案 |
| **规则网格 / 表格 / 泳道** | **Grid / flex 模型**(行列 + gap + align) | 整齐、可预测;CSS flex/grid 的坐标版 |
| **无向拓扑 / 网络 / 关系图** | **力学(force-directed)**:节点斥力 + 边引力,迭代到平衡,**必须加碰撞约束** | 适合无明确层级的"网";但对分层架构会"软"且易叠,不如 layered крис |

**铁律**:分层架构默认走 **layered**,不要用 force(force 是无向拓扑的解,不是架构图的解)。
坐标一旦由引擎算出,**节点间最小间距、同层对齐、容器内边距都是布局参数,不是事后调**。

> 现状:本 skill 暂未内置布局引擎,架构图仍可能手摆 → **必须跑第二层 lint 兜底**。
> (规划:`arch-layout.mjs`——声明 `{nodes,edges}` → 内置极简 layered 算法 → 输出无重叠 Excalidraw。)

## 第二层 · 检测:arch-lint.mjs

任何 `.excalidraw` 或帧 JSON 跑一遍,把审美拆成几何不变量:

```bash
node scripts/arch-lint.mjs <file.excalidraw> [--grid 4] [--colors 4] [--width W --height H] [--strict] [--json]
# 有 error → 退出码 1(可进 CI / 交付前 gate)
```

### 规则集(error = 必修,warn = 应修)

| 规则 | 级别 | 检测什么 | 物理判据 |
|---|---|---|---|
| **overlap** | error | 节点-节点**部分重叠**(互不包含却相交)= 摆放 bug | 两 bbox 相交面积 > 0 且 `!contains(A,B) && !contains(B,A)` |
| **arrow-thru** | warn | 箭头穿过它没绑定的节点(线压过框)| 线段 × 节点矩形相交(Liang–Barsky);排除容器 |
| **arrow-unbound** | warn | 箭头端点未 binding(浮空,改布局会脱节)| `!startBinding && !endBinding` |
| **offgrid** | warn | x/y 没吸附网格 | `x % grid || y % grid` |
| **near-align** | warn | 两节点边/中线**几乎对齐但没对齐**(最丑的错位)| 边/中线值之差 ∈ (0.5, 6]px |
| **uneven-gap** | warn | 同行/列相邻节点间距不均(规划中)| 间距方差 > 阈值 |
| **color-budget** | warn | 去重描边+填充色 > 阈值 | `distinctColors > N`(默认 4,反 slop) |
| **oob** | warn | 元素超出画布 | bbox 越过 0..W / 0..H |

### 关键设计

- **容器识别**:完整包住 ≥1 个其它节点的框 = 容器(分层背景/泳道)。容器**不参与** overlap 误报(它本就包孩子)、不参与 arrow-thru(箭头穿过分层背景合法)。
- **overlap 区分包含 vs 部分相交**:节点在容器内 = 合法;两个 peer 部分重叠 = bug。只报后者。
- **near-align 是启发式**:对"居中排列、宽度不一"的图标行,左边缘会有 1-6px 差(它们中线齐而非边齐),属可接受噪音,人判断。

## 修复闭环(交付前)

```
渲染前 / 交付前:
  node scripts/arch-lint.mjs 图.excalidraw
  ├─ 有 error(重叠等)→ 必修,改坐标 → 重跑,直到 0 error
  └─ warn → 评估:offgrid/near-align 吸附网格;color-budget 砍色;arrow-unbound 补 binding
```

**把 lint 接进工作流第 7 步「验证」**:`arch-lint` 0 error 是交付硬门槛,等同"肉眼过一遍"的机器版,但不会漏。

## 实测(本 skill 自身的架构图)

`node arch-lint.mjs "excali-design 架构图.excalidraw"` 抓到:1 处真实 overlap(r02/r21 ~13%)、
16 条浮空箭头、13 种颜色(超 ≤4 反 slop)。NBA bracket 帧抓到中心卡片与冠军 logo 的 14% 重叠
——**全是肉眼会漏或要反复看才发现的,机器一次定位到坐标**。
