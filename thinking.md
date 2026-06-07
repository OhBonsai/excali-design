# Excali-Design · 画图思维研究笔记（thinking.md）

> 这是一份**活的研究/综合笔记**，不是交付文档。记录"什么是一张好信息图、以及其中多少'品味'能被系统化/自动化"这个中心问题上的思考。供后续会话继续深挖——每节末尾留了 open threads。

## 0. 中心问题

一张好的信息图，本质是**把"信息的层级/结构/重点"编码成"知觉的层级/结构/重点"**，让人在读懂内容之前就先被正确引导。
问题：这套"品味"里，哪些能被规则化、被工程化、被 lint？哪些必须留给人/模型的语义判断？

我们找到了**三个互补的透镜**，它们不是竞争关系，而是同一件事的三层。

---

## 1. 三种画图方法（三个透镜）

### 1.1 视觉修辞 —— 借鉴 `excalidraw-diagram-skill`

（该 skill 在本 repo 的 `excalidraw-diagram-skill/`，作者另一套思路。）

- 纲领：**Diagrams should ARGUE, not DISPLAY**。图是视觉*论证*，不是排版过的文字。
- 两个判据：**Isomorphism test**（删掉所有文字，光结构还传不传达概念？）+ **Education test**（能学到具体东西，还是只在给框贴标签？）。
- 五柱：① 视觉修辞**模式库**（fan-out / convergence / tree / timeline / cloud / assembly-line / side-by-side / gap，"形状即含义"）② 容器极简（默认自由浮动文字，<30% 进框，"lines as structure"）③ **evidence artifacts + research mandate**（技术图先查真规范，把真实代码/JSON/事件名嵌进图里当教学证据）④ **multi-zoom**（summary flow + section 边界 + section 内细节）⑤ 强制 render-view-fix 循环。
- 机制：**纯手写 JSON**，section-by-section；明确**反对**写生成脚本/coding agent/一次性生成（理由：脚本=indirection、更难 debug、易产出泛化网格）。
- 没有：组件库、布局引擎、HTML/Mermaid/LaTeX 管线。靠方法论 + 手摆 + 迭代。

**它强在**：视觉修辞的系统性（"该选哪种构图论证"）、教学密度（evidence artifacts）、依赖面极小、一个 palette 即换品牌。
**它弱在**：无复用、密集图手摆易崩、无确定性布局、覆盖面窄。

### 1.2 画师的知觉层级 —— 信息层级→画面变量

插画师（杂志特稿 / 科学配图 / 报纸 spot）的真实思维流水线：

1. 读文本 → 找**那一个意思**（angle / 视觉隐喻 / 要讲清的机制）。先定 takeaway 再定画什么。
2. **选角（casting）= 定层级**：主角 / 配角 / 语境 / 背景，分配"注意力预算"。
3. **Notan / 黑白灰小稿**：拇指大三值小稿，不画细节，先看层级读不读得出 = 画师的**眯眼测试**；他们**先用三个明度块把画解决掉**。
4. 焦点 + 视线路径 → 5. 色彩小稿（强化已成立的明度层级）→ 6. 只在吸睛处刻画/上材质。

**核心：把信息编码进画面可控变量（通道）**——

| 画面变量 | 编码什么 | 手法 |
|---|---|---|
| 对比（总变量） | 哪里最重要 | 眼睛先去对比峰值（明度/边缘/彩度/细节/孤立）。主角=对比峰 |
| 明度/光影(notan) | 层级、图底、焦点 | 最强层级通道；光当聚光灯；按明度归块=结构 |
| 大小/比例 | 重要度、关系 | 大=重要；落差=戏剧；相对大小=关系 |
| 位置/空间 | 顺序、主次、语境 | 焦点区、前景=要紧、左→右=阅读序、上=首要 |
| 留白/孤立 | 重要、分组 | 被空白包围=重要；聚拢/隔开=同类/分段 |
| 颜色 | 类别、强调、情绪、纵深 | 色相=语义；一抹高彩度落低彩度场=焦点；暖进冷退 |
| 边缘/虚实 | 注意力、纵深 | 硬边=吸睛+前景；软边=后退（lost & found edges） |
| 细节/材质 | 重要、物的性质 | 只刻主角；材质编码"是什么"+触感情绪 |
| 方向/姿态/力线 | 把视线路由到主角 | 姿态、视线、引导线、汇聚线 |
| 重复/节奏 | 系统、模式 | 重复=成体系；破例=焦点 |

**真功夫 = 冗余 + 抑制**：把多条通道**叠在主角身上**（最大+最亮+最实+最艳+最孤立+在焦点节点+所有线指向它），同时从其余元素**抽走**。新手撒满全图 → 处处响=处处不响（"条形码"）。

### 1.3 视觉语法 —— 信息图的生成句法

英语用几个简单从句 + 有限组合算子生成无限长句；图同理。

- **原子**：节点（名词）+ pattern（=一个关系命题=从句）。
- **4 个组合算子**：
  1. **并列 Coordination**：同级同权并排 + 分隔/留白。
  2. **主从 Subordination**：一个 pattern 的**槽位**由另一个 pattern 填（= macro 装 micro）。
  3. **嵌套递归 Embedding**：槽位装整个子构图，可再装 → **multi-zoom**。
  4. **修饰 Modification**：标签/便签/注释/图例/evidence/配色，加细节不改核心关系。
- **闭包律**：组合出的块仍是"合法视觉单位"（有外接框、单一入口/焦点、网格/调色板一致），才能继续当槽位。= 保型组合算子（X-bar / CFG）。
- **主干律**：再复杂的图**只有一个 hero / 一条主脊**，其余从属挂上去。违反 = run-on = 没主角/条形码。

**落成的良构约束（= 语法规则，可 lint）**：① 闭包 ② 一条主脊 ③ 并列须同级（parallelism）④ 从属须视觉从属（不悬垂修饰）⑤ 跨层 concord（调色板/网格/字阶一致）⑥ 干净的入口/出口（可接续）⑦ 连接件匹配关系类型。

**把"内部揭秘"图当句子解析**：主脊=底部 5 步流水线 sequence；施事 sequence（用户→机器人→满意用户）并列于上；机器人三角色标签=adjunct；橙便签=并列附加注释列表；每个流水线框=轻度 embedding。其语法张力 = 施事 sequence 与流水线 sequence 争主句（谁才是真正的 hero）。

---

## 2. 三者的统一：同一件事的三层

它们各回答一个不同的问题：

- **语法（1.3）= WHAT**：结构/组合规则——pattern 是句型，4 算子组合，闭包+主干律。
- **画师（1.2）= HOW it's perceived**：把那个结构**渲染**成知觉层级——用画面变量（对比/明度/大小/色/边/材质）让主脊真的跳出来。
- **修辞 skill（1.1）= WHICH + workflow**：句型库的具体清单（8 个 pattern）+ "argue not display" 立场 + render-fix 流程。

**贯穿三层的同一条律**：把信息层级编码成知觉层级；**一个 hero / 一条主脊**；**冗余 + 抑制**。
- 主干律（语法）↔ 一个主句 ↔ 选角/对比峰（画师）↔ "argue 一个论证"（修辞）。
- 闭包（语法）↔ macro 装 micro（工程）↔ multi-zoom（修辞）。

**关键正交分解（前面会话的核心结论）**：
- **macro（东西摆哪、视觉论证）**：可选范式——网格(CSS) / 图论(elkjs) / **修辞(手工 pattern)**。
- **micro（每个东西长什么样）**：drawlib 复用 / data-chart / evidence / LaTeX——**和 macro 范式无关，所有范式共享**。
- 这解释了"视觉修辞 + 资源库"为什么好：修辞是 macro 选择，资源库是 micro 选择，两层正交、天然可组合。HTML 路线只是"macro=CSS 网格"的一种；缺的是"macro=修辞"分支。

---

## 3. 落到 excali-design 的工程化（融合思路，优先级 1→4→3→2）

1. **加 dispatch 第 4 分支 + `references/visual-rhetoric.md`**（最轻、先做）：在"图类型→路径"里补"不规则修辞/hero 居中/概念解释 → 手工修辞构图 + drawlib + arch-connect + 渲染回归"。把 1.1 的 8 模式 + 两个判据 + 容器<30% + shape-meaning + evidence 搬过来本地化。把"macro/micro 正交"框架写进 SKILL.md 开头。
2. **evidence artifact（`data-evidence`）**：类比 data-chart，吃真实代码/JSON → 渲手绘暗色代码面板，确定性化，补"教学密度"缺口。
3. **hybrid composer（复杂 hero 场景）**：macro 用修辞摆 hero+卫星槽位；每个子块用 HTML/drawlib 渲成 tile；composer 把 tile 贴到槽位。`icon()/block()/comp()` 提取器泛化即可（产品介绍图就是手做的这套）。
4. **`scripts/rhetoric.mjs` 模式原语**（最后、且定位"可选骨架不是必经"）：`fanOut/convergence/timeline/assemblyLine/cloud/tree`，返回算好坐标的元素，槽位能吃 drawlib item。= "不规则布局的 CSS"，把 macro 确定性从网格/图论扩到修辞。尊重 1.1 那条"不规则图本就该人手摆"的合理内核。

---

## 4. 可 lint 性 —— `hierarchy-lint`（视觉语法的 parser/检查器）

把画师思维切两半：**语义 casting 不可 lint**（哪个该是 hero、隐喻好不好）；**知觉兑现可 lint**（声明意图层级后，画面有没有让主角在各通道获胜）。
独有优势：**我们有 scene graph**（`.excalidraw` 每元素的面积/颜色/明度/位置是 ground truth），视觉权重可精确算，不用从像素猜——比给绘画 lint 容易得多。

- **Tier 1（无意图、常开）**：焦点集中度（saliency map → Gini/熵，低=有 hero，高=条形码）、眯眼存活度（模糊后结构相关性，把眯眼测试量化）、配色预算、重心偏移。
- **Tier 2（声明意图、强）**：逐元素视觉权重 `w1·面积 + w2·明度对比 + w3·饱和 + w4·孤立 + w5·焦点贴近`；查 Spearman(意图rank, 权重rank)、hero 是否占 saliency 峰、accent 是否稀缺且在 hero、分组 vs 空间聚类、**箭头/视线向量是否汇聚焦点**、平衡。
- **边界**：saliency ≠ 语义显著（脸/文字/意义有自上而下偏置，bottom-up 测不到）；测不了概念/品味/情绪；**Goodhart**——定位成地板探测器，不是优化目标（同 arch-lint 哲学）。
- **回报**：把眯眼测试变成可复现分数；**逼模型先 casting**（要跑 Tier 2 必须先声明 hero/层级）——这一声明本身就是画师"选角"被强制显式化。
- **它就是 4 节里那门视觉语法的语法检查器**：先 parse 出主脊+从属结构，再查 §1.3 那 7 条良构约束。

---

## 5. 旁支 —— 图像模型文生图提示词（结论存档）

- 结构化提示**在模型能解析的轴上**有用：风格/媒介/调色、"让某元素出现" 强稳；空间/计数/绑定/文字**看架构**——CLIP/扩散弱（概念袋、无逻辑/否定/空间），LLM 接地（gpt-image/Imagen）强。
- 天花板救不回来的：多元素精确版式、密集文字、箭头落点——正是**图表**最需要的，所以**对图表文生图性价比很低、很快撞墙**（这正是确定性引擎存在的理由）。
- 边际递减/反噬：约束堆太多→平均化/丢细节。最大杠杆不在提示词：换模型、**i2i 喂参考图**、ControlNet/区域控制、多 seed 挑。
- 一句话：结构化提示帮你把能拿的分拿满，拿不到模型本来给不了的分。

---

## 6. 更多画图思维模型（学界框架 · 网络检索）

前三条（修辞 / 画师 / 语法）偏"创作手感"。学界还有一批更形式化的思维模型。**关键发现：它们各自回答不同的问题，所以是叠加不是竞争。** 按"回答什么问题"归类：

### A. 为什么图有用（认知底座）
- **Larkin & Simon 1987《Why a Diagram is (Sometimes) Worth 10,000 Words》**：图和文字"信息等价"，但**计算不等价**——图按**位置索引**信息（看一个位置=同时拿到那里所有信息，省搜索），并支持"知觉推理"（很多结论在图里直接看出来，在文字里要算）。这是所有画图逻辑底下的机制解释。借鉴：判断"该不该用图"= 这任务能不能靠**位置索引 + 知觉推理**省力。

### B. 编码理论（"信息→画面变量"的学术版 = 画师 lens 形式化）
- **Bertin《Semiology of Graphics》1967**：marks + **视觉变量**（位置、大小、形状、明度、颜色、方向、纹理）+ 三层阅读（元素/中间/整体）。把"用什么画面属性编码什么信息"系统化。
- **Cleveland & McGill 1984 + Mackinlay 1986 (APT)**：**知觉精度排序**——位置 > 长度 > 角度/斜率 > 面积 > 体积 > 颜色/浓度；Mackinlay 加 **expressiveness（表达得准）+ effectiveness（看得准）** 两准则并据此**自动选图**。这是"自动化画图"的理论源头，正对你的引擎路线。

### C. 图形语法（和你的"句法"是姊妹，但针对数据图）
- **Grammar of Graphics — Wilkinson 1999 / Wickham 分层语法(ggplot2)**：data → 美学映射(aes) → 几何(geom) → 统计变换(stat) → 标度(scale) → 坐标系 → 分面(facet)。**注意：这是"数据→图"的语法，和 §1.3"修辞结构组合"的语法不是一回事**——一个把数据映射成图元，一个把命题结构组合成构图。两种语法可并存（统计图走 GoG，论证图走修辞语法）。

### D. 知觉分组/弹出（画师与语法的科学底层，且可 lint）
- **格式塔法则 + 预注意属性（Colin Ware《Information Visualization: Perception for Design》）**：**预注意属性**（颜色/方向/大小/位置，<500ms 自动弹出）+ **格式塔分组**（邻近、相似、闭合、连续、连接、共同命运、图底）。解释"主角为什么跳出""为什么靠近=一组"，直接喂 hierarchy-lint（邻近聚类 vs 声明分组、单一弹出=单 hero）。

### E. 语义接地（某空间摆法为何"有意义" = 语法的语义层）
- **概念隐喻 / 意象图式（Lakoff & Johnson）**：抽象概念靠**空间意象图式**理解——容器(containment)、路径(path)、上=多、力/连接。Venn=容器图式，Sankey=流动/路径图式。它解释 §1.3 的 pattern 为何"天生表达某关系"：tree=部分-整体/容器、fan-out=源、timeline=路径、cycle=循环。借鉴：选 pattern 先问"这关系的意象图式是什么"，让形状和概念同构（呼应对面 skill 的 Isomorphism test）。

### F. 叙事/编排（时间与引导轴）
- **Segel & Heer 2010《Narrative Visualization》**：**author-driven ↔ reader-driven** 光谱 + 7 体裁（杂志式、注释图、分区海报、流程图、连环画、幻灯片、影片）。处理"跨帧怎么讲故事、谁控节奏"。借鉴：多屏/分镜/multi-zoom 时，先定在光谱上的位置。

### G. 效率与诚实（"画多少"的伦理）
- **Tufte：data-ink ratio / chartjunk / graphical integrity / small multiples**：最大化数据墨水、擦非数据墨水、别失真、用小倍数做对比。和 anti-slop 同源，但多了"图形诚信（不歪曲）"和"small multiples"两件。注：data-ink 极简近年有争议（过度极简损可读性），**当地板不当教条**。

### 主表

| 模型 | 提出者 | 回答的问题 | 和三条的关系 |
|---|---|---|---|
| 计算卸载 | Larkin & Simon 1987 | 为什么图有用 | 底座（三条都站它上面）|
| 视觉变量 | Bertin 1967 | 用什么编码什么 | 画师 lens 形式化 |
| 知觉精度 + 自动化 | Cleveland-McGill / Mackinlay | 哪种编码看得准 | 画师 lens + 引擎自动化；进 lint |
| 图形语法 | Wilkinson / Wickham | 数据怎么变成图 | 语法的"数据图"姊妹 |
| 格式塔 + 预注意 | Wertheimer / Ware | 怎么自动弹出/分组 | 画师+语法的科学底层；进 lint |
| 意象图式 | Lakoff & Johnson | 空间摆法为何有意义 | 语法的语义层 |
| 叙事可视化 | Segel & Heer 2010 | 怎么跨帧讲故事 | 新增"时间/编排"轴 |
| 图形卓越 | Tufte | 该画多少、别失真 | anti-slop 源头 + 诚信 |
| 嵌套设计模型 | Munzner 2009 | 怎么设计+验证（流程）| 元方法：domain→abstraction→encoding→algorithm，上游错下游全错 |

### 综合：把它们当一个分层工具箱，不是选流派

这些模型回答的是**不同的问句**，自然叠成一条 checklist：
**为什么(Larkin-Simon) → 用什么编码(Bertin) → 哪种最准(Cleveland-Mackinlay) → 怎么组合(修辞语法 + GoG) → 怎么被知觉(格式塔-Ware) → 为何有意义(Lakoff) → 怎么渲染出层级(画师) → 怎么叙事(Segel-Heer) → 画多少(Tufte)**；外面套 Munzner 的 what/why/how 设计-验证流程。

对**工程化**最有用的三块：**Cleveland-Mackinlay**（编码精度排序，可进 lint + 自动选编码）、**Gestalt-Ware**（分组/弹出，可进 hierarchy-lint）、**Lakoff 意象图式**（给 §1.3 pattern 表补"语义/同构"判据）。

**Sources（网络检索）**：
- Larkin & Simon, *Why a Diagram is (Sometimes) Worth 10,000 Words* — [Wiley](https://onlinelibrary.wiley.com/doi/10.1111/j.1551-6708.1987.tb00863.x)
- Munzner, *A Nested Model for Visualization Design and Validation* — [UBC PDF](https://www.cs.ubc.ca/labs/imager/tr/2009/NestedModel/NestedModel.pdf)
- Cleveland & McGill, *Graphical Perception* (1984) + Mackinlay APT — [CSE412 perception notes](https://courses.cs.washington.edu/courses/cse412/21sp/lectures/CSE412-Perception1.pdf)、[Mackinlay ranking](https://www.researchgate.net/figure/The-Mackinlay-ranking-of-perceptual-task_fig2_221098028)
- Wilkinson / Wickham, *A Layered Grammar of Graphics* — [Wickham PDF](https://vita.had.co.nz/papers/layered-grammar.html)、[Wikipedia](https://en.wikipedia.org/wiki/Wilkinson's_Grammar_of_Graphics)
- Colin Ware, preattentive + Gestalt — [IxDF: Preattentive Visual Properties](https://ixdf.org/literature/article/preattentive-visual-properties-and-how-to-use-them-in-information-visualization)
- Lakoff/Johnson 意象图式 in viz — [Risch, On the Role of Metaphor in InfoVis](https://arxiv.org/pdf/0809.0884)、[Image schema (Wikipedia)](https://en.wikipedia.org/wiki/Image_schema)
- Segel & Heer, *Narrative Visualization* (2010) — [Semantic Scholar](https://www.semanticscholar.org/paper/Narrative-Visualization:-Telling-Stories-with-Data-Segel-Heer/7b2972e2bdd6944338a895c97eecbd12725fdcd8)
- Tufte, data-ink / chartjunk — [GA Tech notes](https://faculty.cc.gatech.edu/~stasko/7450/16/Notes/tufte.pdf)、[批评视角](https://www.frank.computer/blog/2025/04/data-to-ink.html)

## 6.5 操作化架构：把所有思维落到代码（IR 栈 + compute/lint + dispatch）

> 把前面所有透镜真正落地的总图。三个问题——"中间数据当约束 / 程序化 lint 或计算 / 怎么挑思维链"——其实是**一个架构的三个切面**。
> 核心答案：**建一条分层的中间表示（IR）栈，让每个思维模型沉到对应的那一层；能 by-construction 算对的就直接 compute，算不了的才 lint；挑哪条思维链不是凭感觉，而是从最上层 content IR 读特征、走决策树路由。**

### A. 沉淀中间数据 = 一条 5 层 typed IR 栈

一张图不是一个数据，是一串逐级精化的数据。每个思维模型天然属于其中一层；把每层做成 typed、可序列化的文件，约束就**声明在具体某一层上**。

| IR 层 | 是什么 | 哪些思维模型住这层 | 约束类型 | 落地文件 |
|---|---|---|---|---|
| ① 内容/意图 | entities + typed relations + **hero/ranks/groups** + facts/evidence | Larkin-Simon、Munzner(what/why)、casting | 语义（模型产出，不可全自动）| `intent.json` |
| ② 构图(macro) | **语法 parse 树**：主脊 + 并列/主从/嵌套/修饰，每节点标 pattern + 意象图式 | §1.3 语法、Lakoff | 语法良构 | `composition.json` |
| ③ 编码 | 每元素：哪个视觉变量编码哪条信息 | Bertin、Cleveland-Mackinlay | 编码精度 | `encoding.json` |
| ④ 几何 | 实际 `.excalidraw` 元素(x/y/w/h/color) | arch-layout/connect、CSS、Tufte | 几何 | `*.excalidraw` |
| ⑤ 像素 | 渲染图 + 派生（saliency、明度降采样、模糊）| 画师、Gestalt-Ware、hierarchy | 知觉 | `*.png`、`saliency.png` |

**最核心的单一结构** = 一个 typed diagram-IR：一张图，节点带 `{role, importanceRank, group, pattern, imageSchema, encodingChannel, bbox, value, visualWeight}`，边带 `{relationType, connective, routing}`。所有层都在往这同一个结构的不同字段上写/读。现有的 `spec.json`/`edges.json` 就是它的雏形。

两条铁律：① 模型必须**先声明 intent**（hero/ranks/relations）——声明本身就是约束底座（没声明 hero，就无法 lint"hero 跳没跳"）。② 每层**独立可查、独立可重生**（按层缓存失效）。

### B. compute vs lint：能算对就别检查

原则：**确定性的 by-construction 直接算对，不事后 lint；只对"启发式/偏好、生成器可能违反"的残差才 lint。** 这正是和对面 skill 的根本分野——他们无 compute 层、全靠 render-fix 迭代；你 compute 大头、lint 残差。

| 思维模型 | 作用层 | compute / lint | 算法 · 指标 |
|---|---|---|---|
| Cleveland-Mackinlay | ③编码 | **compute** | 最高 rank 的空闲通道直接分给最重要的量 |
| arch-layout/connect、CSS | ④几何 | **compute** | elkjs / 浏览器 CSS / 正交-斜线路由 |
| Lakoff 图式 | ②构图 | **compute(查表)** | relationType → pattern（containment→嵌套、sequence→timeline）|
| 语法良构(§1.3) | ②构图 | **lint(符号)** | parse 树：一条主脊、并列同级、闭包、从属<宿主权重 |
| 视觉层级 | ④+⑤ | **lint(数值)** | `visualWeight` 向量；Spearman(意图rank, 算出rank) |
| Gestalt 分组 | ⑤像素 | **lint(数值)** | bbox 质心 DBSCAN 聚类 → 与声明 group 的纯度/集合重合 |
| 预注意弹出 | ⑤像素 | **lint(数值)** | hero 在邻域内是否在某预注意通道(色/大小/方向)唯一 |
| 焦点/眯眼(画师) | ⑤像素 | **lint(数值)** | saliency 熵/Gini（低=有 hero）；模糊后结构相关性（眯眼存活）|
| Tufte | ④几何 | **lint(数值)** | data-ink ≈ 编码性元素/总元素；装饰元素计数=chartjunk |
| Larkin-Simon | ①内容 | **gate(非 lint)** | 关系数/交叉引用低 → 可能该用表而非图 |

`hierarchy-lint`（⑤像素知觉）和 `arch-lint`（④几何）并列，分别管"知觉检查"和"几何检查"。

### C. 挑选思维链：先分"层"和"叉"

最大误区是把这些模型当**平行流派去选**。其实绝大多数是 **always-on 的层**（全图都过），真正互斥、需 dispatch 的只有 2–3 个叉。

**Always-on（不选，全跑）**：Larkin-Simon 门 → casting/hierarchy（每张图都得有 hero）→ Gestalt/预注意 → Tufte 节制 → render+squint。

**真正的互斥叉**，信号全部从 ①content IR 读特征：

```
从 intent.json 抽特征：
  has_quantitative_values, dominant_relation_type,
  node_count, density, needs_evidence, frame_count, audience

Fork 1  量化为主？
  ├─ 是 → Grammar of Graphics（data→aes→geom，图由数据算出）
  └─ 否（关系/概念结构）→ 进 Fork 2

Fork 2  关系图的 macro 范式？
  ├─ 规整卡片/仪表盘/海报 → CSS(HTML)
  ├─ 密集拓扑/几十节点    → elkjs auto-layout
  └─ 单 hero+少卫星/概念/"argue" → 修辞手摆
        └─ 选哪个 pattern？= dominant_relation_type 查 Lakoff 图式表
             oneToMany→fan-out  sequence→timeline/assembly
             containment→tree/嵌套  comparison→side-by-side  cycle→cycle

Fork 3  frame_count > 1 → Segel-Heer：先定 author↔reader 光谱 + 体裁
```

"思维链确定" = **抽特征 → 决策树路由 → 套上 always-on 层**。模型唯一不可机械化的判断输入只有两个：**casting（hero/ranks）和 takeaway**；其余全是确定性路由。

### D. 收口

整条流水线：**声明 intent（①）→ 按特征路由（C 的叉）→ 能算对的 by-construction 算（B-compute：编码/布局/连线/pattern 查表）→ 残差 lint（B-lint：语法树 + 几何 + 知觉）→ render + 眯眼。** 那串 IR 文件**既是契约又是缓存**。

不可约的语义核只剩一处：**生成干净的 ①content IR（关系 + casting）只能靠模型理解内容**。杠杆因此很清楚——**把投资全压在"让模型先吐出结构良好的 intent IR"上，下游几乎全可机械化。** 这也把前面所有线收口：macro/micro=②的主从/嵌套；hierarchy-lint=⑤；视觉语法=②良构；dispatch=从①抽特征。

---

## 6.6 风格与反 AI 味：lint 守下限，opinionated identity 撑上限（后续要做）

> §6.5 的 IR/lint 栈缺的那块：**为什么光有 IR/lint 不够。** 这是后面要重点考虑的方向。

把"AI 味 / slop"拆成 5 层，标注 thinking+IR+lint 能不能干掉：

| 层级 | 是什么 | 这套机器能干掉吗 |
|---|---|---|
| A 机械缺陷 | 重叠、错位、脱线、unicode 当图标、文字溢出 | **完全能**（几何/结构 lint）|
| B 无层级 | 没 hero、彩虹色、面条/条形码 | **基本能**（casting-IR + hierarchy-lint，地板）|
| C 泛化模板 | 卡片网格、5 个等大框、训练语料平均长相 | **半能，且可能更糟**（见下）|
| D 语义空洞 | 只给框贴标签、教不到东西 | **只能逼、不能保证**（IR 强制 evidence/takeaway，洞见靠模型）|
| E 品味/机锋 | 那个妙喻、意外却对的构图 | **完全不能**（lint 的天花板）|

A、B 是"丑 slop"，这套机器可靠干掉约 90%——真胜利。但刺眼的 AI 味在 **C**，且有 Goodhart 陷阱：

> **一条"永远把卡片路由成 CSS 网格、永远同配色、永远吸附同 pattern"的确定性流水线，会产出"全都正确、但全都长一样"的图——这本身是新 slop（模板味）。lint 全绿 ≠ 没 AI 味；过度确定性 = 收敛到无菌均值。**

**核心洞察**：**"形成独有风格"和"拒绝 AI 味"是同一件事的正反面，而且都不是 lint 产出的。** AI 味 = 统计均值 = 没有被承诺的、具体的、出人意料的选择。解药只有一个：**对具体的承诺 + 克制 + 一个观点。** lint 能执行克制、保证一致，但**供不出观点和具体性**。

要真正杀掉 AI 味，得在 IR/lint 之外**再加两层**：

1. **Opinionated identity（风格是正向断言，不是缺陷的缺席）**：一套签名配色/accent、一种线条质感（手绘 roughness）、一套 drawlib 复用词汇、几个招牌构图习语（泳道+斜线、橙便签 notice、LaTeX inset）。**风格 = 一组刻意偏离训练均值的非默认约束。** 画廊已有胚子（一眼能认出"excali-design 出品"）。**IR 的作用是让选定的身份被一致执行；但选什么身份，是人的品味，不是 lint 推出来的——风格不是 lint 的产物，风格是 lint 的前提。**
2. **Anti-monotony（给自己的模板味也上一道 lint）**：刻意制造方差——"2-3 个跨维度变体"、"每个概念用不同 pattern、不要统一卡片"、构图/seed 变化，外加**元 lint：模板距离**——这张图的 composition-IR parse 树 + 配色若与最近几张几乎一样就报警。注意：这条要 lint 的是"跨产出的雷同"，不是"单图内的正确"。

不可约核（永远在 lint 之外）：**casting（选谁当 hero）+ 概念新意 + 机锋** = 模型/人的判断。

**收口**：thinking+IR+lint 把你从"丑 slop"拉到"干净、克制、有层级"（90% 的活，确定性可达）；"有灵魂、有辨识度、零 AI 味"那最后一截，不在 lint 里，在**注入流水线的 opinionated priors + 方差纪律**里。两件事，别指望一个解决另一个：**lint 守下限不让你丢人，身份与品味撑上限让你被记住。**

### 待做
- 把"signature 身份"显式写成 IR 级默认/约束（配色、roughness、复用词汇、招牌习语），让风格可被一致执行。
- **模板距离元 lint**：跨产出比 composition-IR parse 树 + 配色 + pattern 分布的相似度，报"又一张一样的"。
- 强制变体：generator 默认出 2-3 个跨维度变体（布局/抽象层/分组），由人/casting 选。
- 想清楚"opinionated priors"具体是哪几条——这是 excali-design 区别于通用画图的真正护城河。

---

## 7. Open threads（待深挖）

1. **主脊冲突判定**：内部揭秘图里"施事 sequence vs 流水线 sequence"争主句——怎么形式化"哪个是真 hero"？是否允许"双主句"（并列复合句）？
2. **视觉权重公式的权重定标**：w1..w5 怎么标定？用一批人工标过 hero 的图回归？
3. **补语义显著**：bottom-up saliency 漏脸/文字/意义。是否引入"文字块/人物自动加权"或轻量 VLM 打 top-down 显著性？
4. **完整句型表 + 每个 pattern 的良构约束**：把 8 个 pattern 各自的"合法入口/出口、可嵌套槽位、典型修饰"写成一张语法表（CFG 风格的产生式）。
5. **multi-zoom 自动嵌套**：递归 embedding 怎么程序化生成（summary→sections→detail 三层）？
6. **强制 casting 步骤**：在 workflow 里加一步"声明 hero + 层级 + 分组"，让 §4 的 Tier 2 lint 可跑——把选角从隐性变显性。
7. **evidence artifact 的确定性渲染**：暗色代码面板 + 伪语法着色的手绘风规格。
8. **语法→lint 形式化**：能否真的写一个 parser，从 `.excalidraw` 反推出主从结构树（谁是主脊、谁修饰谁、谁嵌在谁里），再跑良构约束？这是把"图有句法"落到代码的终极一步。
9. **编码精度 lint（Cleveland-Mackinlay）**：把感知排序做成规则——"重要的量是否用了排序靠前的通道（位置/长度而非颜色/面积）"；甚至自动**选编码**。
10. **pattern × 意象图式表（Lakoff）**：给 §1.3 每个修辞 pattern 标注对应意象图式（tree=容器、fan-out=源、timeline=路径…），作为"选对 pattern / 形状与概念同构"的判据。
11. **叙事光谱进 workflow（Segel-Heer）**：多屏/分镜/multi-zoom 时先定 author-driven↔reader-driven 位置与体裁，再排镜头。
12. **Munzner 四层自检**：把"domain→data/task abstraction→encoding→algorithm"做成一张交付前自检，专抓"抽象层选错导致下游全错"。

---

## 9. Mindmap 与 Chart 类：下一步优化思路

**定位**：mermaid 五类（flow/seq/state/class/er）已上模板路，共性是"节点+边的结构图"，布局靠分层。Mindmap 和 Chart 跳出这个范式——前者是"放射树"，后者是"数据→量的编码"。它们需要不同的 IR、布局、faithfulness 约束，不能照搬分层图布局。

### 9.1 Mindmap —— 放射树，branch 才是 hero

1. **不是 DAG 是 rooted tree**；布局不是分层而是两选一：(a) **放射** radial——每棵子树按"叶子数"分配一个角扇区，`radius=depth×ringGap, angle=扇区中心`，天然不重叠；(b) **逻辑横树**——Reingold-Tilford tidy tree，root 在左、子在右（或左右平衡）。两种都做：放射=灵感图气质，横树=大纲气质（文字水平好读）。
2. **视觉重心在 branch 不在 box**：mindmap 节点常无框，只是文字坐在一条"有机弯曲、颜色编码"的枝上。渲染模型相比 flowchart **反转**——edge（曲线、可能 taper）携带视觉权重，节点是文字 + 末端可选 leaf pill。曲线用 Excalidraw 多点 line + `roundness:2` 近似（可复刻）；但**粗细渐变 taper 没有单一旋钮**，只能分段递减宽度或接受等宽——记为复刻约束。
3. **颜色 = 按一级 branch 分类**（Bertin：hue=名义分组），所有后代继承父枝的色。一个 STYLE = 一组 branch 色板。
4. **曲线语法**：父→子离开父时切向、到达子时收束，3–4 控制点。
5. **IR = rooted tree** `{label, children[], branchHue}`；parser = 缩进→树（像 Python 缩进）；mermaid mindmap 还有 `((round))/[square])cloud(` 节点形状与 `::icon`。
6. **compute/lint**：角扇区分配是纯算（按构造不重叠）；深度 >4 警告（建议折叠/分图）；横树用 tidy-tree 保证同层不撞。materials 组件很少（root 云 / branch 枝 / leaf），**layout 本身才是产品**。

### 9.2 Chart 类 —— faithfulness 是铁律，roughness 只动描边

**最关键认知：手绘 ≠ 不精确。** Excalidraw 的 `roughness` 只抖描边路径，形状的几何边界仍精确。所以"手绘柱状图" = 精确柱矩形 @ `roughness:1`，抖动纯装饰、柱高仍忠于数据。这一条化解了"图表要精确 vs 技能是手绘"的根本张力——**别因为要手绘就手摆坐标**。

1. **几何全 compute，绝不手摆**：饼角 `= value/total×360`；柱高 `= value/max×轴高`。图表是"能算就算"原则压得最狠的地方——比例画错一眼穿帮。`render-chart.mjs` 吃 `{type,data}` 算出精确几何，再交 roughness 描边。
2. **按数据类型选编码**（Cleveland-McGill 感知排序）：比大小→**柱**（位置/长度最准）；部分整体且 ≤5 类→饼可接受，多了→堆叠柱或直接柱（12 瓣饼=slop）；趋势→**线**；排期→**gantt**。渲染器要编码对；被要求坏编码（12 瓣饼）时技能应**反推荐**柱。
3. **Gantt 就是图表**：横时间轴 + 任务条。任务=行，`x=日期线性映射, width=工期`；依赖=箭头；section=分组行；milestone=菱形。复用"轴绘制 + 行布局 + date scale"，**不用图布局**。
4. **chart chrome 全确定**：nice-number 刻度（`1/2/5×10^k`）、淡虚线网格、轴线、数据标签——可读性全靠它，全可算。
5. **faithfulness lint（chart 的富 lint 面，机械可查）**：饼角和 `=360±ε`；柱高单调于值；**柱轴必须从 0 起**（截断轴=经典欺骗，不从 0 → 警告）；类别/瓣数过多 → 警告；每个 mark 有数据标签或值可读。
6. **复刻约束**：平滑线 `roundness:2` 近似 OK；线下面积=闭合多边形 hachure/solid 填充 OK；**渐变填充不可复刻** → solid/hachure；细瓣饼+小标签难读 → 限瓣数或加引线。
7. **三分法最干净**：模型选编码（乱数据+意图→"该用分组柱"）、写标题/takeaway、选标注；代码做全部几何；**概率管解读，代码管忠实**。
8. **图表 vs 信息图要分开**：纯图表=忠实计算渲染；信息图=图表 + 大数字 callout + 图标 + 叙事 = 布局（走 HTML 路 + canvas-design）。把"图表内核"（精确、可复用）与"外围信息图"（编排、标注）解耦。

### 9.3 共性沉淀

- 两类都**不复用分层图布局**：mindmap=tidy/放射 tree layout；chart=轴 + scale。但都**复用**：STYLE 预设机制、render 原语、materials（组件表→gpt→还原）、`references/render-method.md` 的"物料/设计两段法"。
- **优先级**：gantt（eval 有 `CHART05-gantt`；是 bar-on-time，最贴近已有能力）> 通用 chart（pie/bar/line，faithfulness 内核）> mindmap（布局范式独立，但组件最少）。
- **反 slop 切口**（可进 `anti-slop.md`）：chart 的 slop = 截断轴 / 3D 饼 / 彩虹柱 / 12 瓣饼；mindmap 的 slop = 等距网格摆放（失去有机感）/ 层级 >4 / 颜色不编码分组。

---

## 8. 相关产物索引

- 借鉴 skill：`excalidraw-diagram-skill/SKILL.md`
- 已沉淀的纪律：`SKILL.md` + `references/anti-slop.md`（箭头减法/留白）、`references/verification.md`（眯眼必做）
- 已验证的"修辞 macro + drawlib micro"手做案例：画廊 04 产品介绍、06 内部技术图、02 Transformer
- 工具：`scripts/`（arch-layout/arch-connect/arch-lint/render-formula）+ 会话里攒的 `drawlib-icons.mjs`(icon/block/comp)、`direct-connect.mjs`、`build-*.mjs`
- Mermaid 模板渲染系统（已落地 flow/seq/state/class/er/gantt/mindmap 七类）：方法论 `references/render-method.md`、索引 `references/mermaid-render.md`、各类型 `render-<type>.mjs` + `mermaid-<type>.mjs` + `references/<type>.md` + `prompts/<type>-styles.md`；组件表 `assets/mermaid-components/`
- 箭头能力专章：`references/arrows.md`（端点头型 / 中间文字 / 曲线 / elbow / 绑定）
- 下一步优化思路（mindmap / chart 类）：见 §9；本次会话变更见 §10

## 10. 会话变更日志（v0.6 续，未单独打 tag）

本轮把 §9.1 的 mindmap 思路全部落地，并由「补齐 Excalidraw 箭头能力」反推简化了 class/ER。

**Mindmap 渲染器**（`render-mindmap.mjs` + `mermaid-mindmap.mjs`，§9.1 全部兑现）
- 双布局：`logical` 横树 / `radial` 360° 放射（叶子均分角度、内节点取子均值、环半径保证径向+切向不重叠，零依赖近 d3.cluster）。
- 三块「GPT mindmap 美感」程序化:① 大小=按 depth 分形（云根 / 描边框 / 无框下划线叶 + 字号梯度）；② 图标=自绘 12 种手绘线稿 tint 枝色（drawlib 的 Star graph 是节点连线图、bulb 太小，自绘更稳更一致、反 slop 合规）；③ 手绘线条=**taper 锥形带**（贝塞尔中心线 + 法向偏移宽度根粗梢细 → 闭合填充多边形 → roughjs polygon 拿真 taper + 手绘边）。这是和等宽线差距最大、提升最明显的一项。
- 结构指令（XMind 概念，mermaid 原生无 → 自定）：`::boundary` 子树虚线框 / `::summary(label)` 花括号归并 / `::link(A,B,label)` 跨枝弯曲虚线 / `::note(text)` 便签；节点 id（`ui[Label]`）供 link 引用。

**箭头能力补全 → 反推简化**（关键认知：能力补进 svg-export 后，多个渲染器都能简化）
- 查官方 `types.ts` 拿到 `Arrowhead` 完整枚举（triangle(_outline)/diamond(_outline)/circle(_outline)/bar/cardinality_* + 旧名 dot/crowfoot_*）。
- `svg-export.mjs` 升级：类型感知渲染全部头型 + 多点曲线（roughjs `gen.curve`，`roundness:2`）。原来一律开口三角、不画曲线 → 这些能力以前预览看不出来。
- 用此能力**反推简化** class/ER：UML marker（`MK` 映射 triangle_outline/diamond/diamond_outline/arrow）、ER crowfoot（`cardEnum` → cardinality_*）从「手绘 line 拼」改为原生 `start/endArrowhead`，各删一个 marker 函数；和 flow/seq/state 的清爽头型统一。
- 专章 `references/arrows.md`：端点头型 / 中间文字（绑定 text）/ 曲线 / elbow / 绑定，全部可粘贴 JSON。

**eval / 文档**
- variants.json v0.6.0 `adds` 扩成七类模板 + 原生头型 + svg-export 升级的完整描述。
- 新增 case：`MODEL04-uml-full`（六种 UML 关系）、`MODEL05-er-crowfoot`（多基数）、`IA08-mindmap-radial`（放射+图标+boundary/summary）。
- A/B 命令（需 opencode+模型 API+chromium，本机跑不了）：
  `node eval/run.mjs method --cols "v0.5.0 v0.6.0" --only "FLOW01..09 MODEL01/02 CHART05-gantt"`。
- 仍待做：mindmap 组件参考表 + `prompts/mindmap-styles.md`；chart 类（§9.2）；note callout 与 drawlib person 图标接入（可选）。
