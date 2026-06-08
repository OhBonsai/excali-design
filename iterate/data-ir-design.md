# data.ir 建设记录(本次设计 · 非模型 reference)

> 这是 data.ir 这一层「为什么这么设计、依据什么科学方法、哪些机器哪些人」的**建设过程记录**,
> 给人读、给后续迭代交接用。**面向模型的操作版在 `references/data-ir.md`**(skill.md 走那个)。

## 1. 缘起与边界

**问题**:技能过去一上来就奔「怎么画」(资产/编码/渲染器)。但对**复杂信息的图像化**而言,真正的第一步是
先把「**要表达的信息是什么**」立清楚——thinking.md §6.5 那条 IR 栈最顶上的 ①content 层,且它被标成
「唯一不可机械化、投资全压在这」的语义核。data.ir 就是把这层**从『靠悟』变成『有章法』**。

**适用边界(重要)**:只管自由信息可视化 / 复杂信息表达。**原型(prototype)、固定 mermaid 不在内**——
那两类的数据已经是确定性的(用户把结构给死了),不需要再抽 data.ir,直接走各自渲染路径。

**核心认识**:信息**有层级、有结构、有重点**,且**一张图装不下全部**→ 必须做**密度控制**(主动取舍)。
data.ir 要把这四点编码进一个结构里,并作为下游(dispatch / encoding / casting / 密度预算)的前提与契约。

## 2. data.ir 在 IR 栈的位置

```
data.ir(①content,本层)
  → dispatch(按 dataset_type + relations 选 pattern)
  → encoding(按 attribute level 选视觉变量,交集见 references/encoding.md)
  → layout → render → arch-lint / floor-check
```
对应 Card/Mackinlay/Shneiderman 的可视化参考模型「raw data → **data table** → visual structure → view」:
**data.ir = 那个 data table 阶段**;也对应 Munzner 嵌套模型的 **data abstraction** 步骤。

## 3. data.ir 产物结构(7 字段)

| 字段 | 含义 | 喂给谁 |
|---|---|---|
| `message` | 这张图回答的**一个**问题 / 传的**一句**核心结论(BLUF) | 全局地基 |
| `dataset_type` | 整体形态:表 / 层级树 / 网络 / 时序 / 空间 / 集合归属 | dispatch 选 pattern |
| `items` | 信息单元(实体/事件/概念) | — |
| `attributes` | 每个 item 的属性 + **数据类型 level**(名义/有序/定量/关系) | encoding 选视觉变量 |
| `relations` | typed 关系(层级/流向/依赖/包含/相似) | connection/containment 编码 |
| `salience` | 重要性排序(hero/次/辅)+ 分组 | casting / hierarchy-lint |
| `budget` | 密度四清单:included / aggregated(上卷)/ deferred(下钻另图)/ cut(舍) | 密度控制 |

## 4. 六步建法(每步挂一个科学方法)

- **E1 抽取**:把需求 + 澄清答案 + 已看 context(代码/文档/搜索)里的事实**卡片化**,先穷举不取舍。
- **E2 数据抽象**(最关键):定 `dataset_type`,给每属性标 level。依据 **Munzner data abstraction** + **Bertin「信息=组件×条目表,每组件有 level」**。Munzner 嵌套模型:**上游错→下游全错**,所以先做对。
- **E3 结构化**:分组 + 找层级 + 标关系类型。依据 **MECE / 亲和图**(互斥穷尽)+ **Minto 金字塔**(论点→支撑→细节)。
- **E4 定重点**:定一个 governing message,排 salience。依据 **Minto 单一论点在顶 + 倒金字塔/BLUF**。
- **E5 密度预算**(「装不下」的科学处理):先估**知觉容量**(组块 ~Miller 7±2、眯眼可分辨区块数;目标=一眼一结论);超了走 **Shneiderman「overview → zoom/filter → details-on-demand」**:aggregate 上卷 / decompose 拆分(总览+下钻 / small multiples)/ omit 舍弃。产出四清单。
- **E6 冻结**:输出 data.ir 对象,作为下游契约 + 缓存(改哪层只重跑下游)。

## 5. 三分:程序化 / 大模型 / 人

**程序化(确定性)**:结构化 context 解析(代码 AST、CSV/JSON → items/attr/relation);从值推 level;从 relations 算拓扑(树/DAG/环/二分)校验 dataset_type;结构性 salience 信号(度中心性/子树大小/深度);**校验/lint**(MECE 重叠、included 数 vs 容量预算、超预算无 cut 报警、schema 合法、level 与值一致);**机制执行**(聚合/拆分/序列化)。

**概率大模型(语义核)**:非结构化输入抽信息单元 + 命名;歧义时判 dataset_type / 属性类型 / 关系类型;**提出有意义的分组切法**;拟 message、判相关性、提名 hero;**提出取舍方案**。模型是**候选生成器**。

**人介入(高风险/真实性)**:需求澄清;**拍板 message**(地基,错了全废);**批准 cut/defer**(在丢用户的信息,「不重要」取决于受众/目的);兜「无遗漏」(code 能查 overlap,查不了 gap);分组/关系的**领域真实性**。

**两条要点**:
1. **边界随输入结构性漂移**——context 越结构化(代码库/CSV),E1–E3 越能程序化;越散文越靠模型。可程序化比例 = 输入源结构性的函数。
2. **角色是「LLM 提出 → code 把关(可回弹重做)→ human 在 message 和 cut 两关拍板」**,不是各干各的。不可约的语义核只有一处:从内容提出结构良好的候选;立住后下游几乎全机械化。

## 6. 人介入的呈现法(让人看得懂)

- **呈现「决策」不是数据结构**:翻译成「会画成啥样 + 丢了啥 + 为什么」,四件套=默认 + 出处 + 备选 + 代价。
- **能画就别说**:先出极便宜骨架/大纲让人用眼确认;**被砍的内容画成灰色脚注/虚线**(显式可见,防静默省略——密度控制最大的坑)。
- **只在两个高风险闸口问**(message / cut),**带默认值**(沉默=接受),只在真分叉时问;用 AskUserQuestion + 骨架缩略图。
- **每个判断附出处**(凭什么这么定;推断的关系当「待核实断言」摆出来)。
- **纠正便宜且局部**:靠 IR 分层缓存,人改一处只重跑下游。

## 7. 「好 data.ir」的可验证判据(部分可 lint)

- 单一 governing message(一眼测试的上游版);
- MECE 分组无重叠(**可检**)、无遗漏(靠人/模型);
- 每个 included item 对 message 有贡献(低相关→该 cut);
- **有显式 cut/deferred 清单**(included 数 vs 容量预算 → 可 lint「超预算却没拆分」);
- attribute level 标对(否则 encoding 不可能诚实)。
- **Goodhart 边界**:message 对不对、切法妙不妙仍是语义,方法固定流程与判据,不替人做语义判断(同 §6.6)。

## 8. 落地与待办

- ✅ 操作版 `references/data-ir.md`(给 skill.md);本记录(给人)。
- ⬜ 可选 lint 脚本:data.ir schema 校验 + MECE 重叠 + 密度预算计数(`included` 数超阈值且 `cut/deferred` 为空 → 警告)。
- ⬜ 与 `references/encoding.md` 串成回路:data.ir.attributes.level → encoding 表 → 视觉变量。
- ⬜ 与 dispatch 串:data.ir.dataset_type + relations → pattern 选择。

## 8.5 增补:clarify 阶段 + scope 建议(本轮加)

**链路补全为**:`clarify(brief)→ data.ir(+scope)→ dispatch → encoding → render → lint`。

- **clarify(上游,`references/clarify.md`)**:画前先把需求问清,产出 brief(受众/目的/唯一问题/范围hint/约束)。
  方法锚 Munzner what/why/who + GQM + BLUF。原则:先读 context、只问决策相关且分叉的、能推则推并声明假设、
  **大堆 context 自动转成范围题**。三分:可计算(检出该不该强制范围澄清)/ 模型(生成好问题、归纳 question)/ 人(回答、拍板受众目的)。
- **scope(data.ir 新增一等字段)**:不止砍密度,还主动建议**边界 / 颗粒度 / 拆几张**。
  - 边界:item 服务 message 才在界内;颗粒度:一张图锁一个抽象层(C4),受众×message×容量定。
  - 拆分触发器(任一命中→建议拆并让人确认):included 超预算(计数)、多 message(模型)、混抽象层、多 dataset_type、关系图多个不连通子团(connected components>1)。
  - 大堆 context 的正解 = 回「这其实是 N 张:总览+下钻,全做还是先做总览?」(split 闸口,与 cut 同属 stakes)。

## 9. 一句话

**data.ir = 用「数据抽象(Munzner/Bertin)+ 金字塔/MECE(Minto)+ overview→filter→detail(Shneiderman)」
把用户给的一摊信息,压成一个『有类型、有层级、有重点、有取舍』的结构;机器解析与校验、模型提候选、人守 message 与 cut 两关。** 它是 §6.5 那个语义核的施工法,也是 encoding/dispatch 的上游前提。
