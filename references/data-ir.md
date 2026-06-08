# data.ir —— 画图前先把「信息」立起来

> **何时用**:自由信息可视化 / 复杂信息的图像化表达(架构、解释图、信息图、关系图)。
> **何时跳过**:原型(prototype)和固定 mermaid —— 数据已确定,直接走各自渲染路径,不需要 data.ir。
> **为什么**:信息有层级、有结构、有重点,且一张图装不下全部。先把信息抽成结构化、定好类型/重点/取舍的
> `data.ir`,再选 pattern、选编码、布局。它是下游的前提与契约。建设背景见`iterate/data-ir-design.md`。

## data.ir 对象(画之前先产出它)

```jsonc
{
  "message":   "一句话:这张图要回答的问题 / 要传的核心结论(BLUF)",
  "dataset_type": "table | tree | network | temporal | spatial | set",   // 决定 pattern
  "items":     [ { "id":"...", "label":"..." } ],
  "attributes":[ { "of":"itemId", "name":"...", "level":"nominal|ordinal|quantitative|relational" } ], // 喂 encoding.md
  "relations": [ { "from":"a", "to":"b", "kind":"hierarchy|flow|dependency|containment|similarity" } ],
  "salience":  { "hero":"itemId", "secondary":[...], "groups":[ {"name":"...","members":[...]} ] },
  "scope": {                                            // 范围建议:边界 / 颗粒度 / 拆几张
    "boundary":   { "in":[...], "out":[ {"item":"id","why":"低相关/越界"} ] },
    "granularity":"context|container|component|code | coarse|medium|fine",  // + 理由(受众×message×容量)
    "diagrams":   [ { "id":"overview", "message":"...", "level":"context", "covers":[...] } ]  // 长度=1 → 一张;>1 → 建议拆分
  },
  "budget":    { "included":[...], "aggregated":[...], "deferred":[...], "cut":[...] }  // 每张图内的密度取舍
}
```

## 建法:6 步(每步标谁来做)

1. **抽取**:把需求 + 澄清答案 + context(代码/文档/搜索)里的事实卡片化,先穷举。
   *结构化源(代码/CSV)→ 可解析;散文 → 模型抽。*
2. **数据抽象**:定 `dataset_type`,给每属性标 `level`。**先做对,上游错下游全错。**
   *值能见 → 代码推 level(全数字=定量、少量重复=名义、日期=时序);拓扑能算 → 代码定 tree/network。*
3. **结构化**:分组(MECE:互斥穷尽)+ 找层级 + 标 `relations.kind`。*模型提切法;代码查重叠。*
4. **定重点**:定**一个** `message`,排 `salience`(hero/次/辅)。*模型提名,人拍板 message。*
5. **范围与密度**(产出 `scope` + `budget`):先定**边界**(只留服务 message 的)→ 定**颗粒度**(一张图锁一个抽象层,受众×message×容量)→ 估容量(一眼能分辨的区块数,≈7±2)→ 装不下/跨层/多问题就走下面的拆分触发器。`budget` 是每张图内的 `aggregate`/`omit` 取舍。
   *代码算容量+跑触发器;模型提边界/颗粒度/拆分方案;人批准 cut 与拆分。*
6. **冻结**:输出 data.ir,作为下游契约(改哪层只重跑下游)。

## 范围:边界 / 颗粒度 / 拆几张(`scope`)

- **边界 in/out**:item 服务 message 才在界内;其余进 `out`(带 why)。边界 = 回答这个问题需要多少,不是数据有多少。
- **颗粒度**:一张图**只锁一个抽象层**(C4 的 context/container/component/code;或 coarse/medium/fine),混层=slop。由 受众专业度 × message × 容量 定:高管→粗,工程师→细。
- **拆几张**:界内 + 对的颗粒度仍超容量,或这堆其实回答多个问题/跨层 → `scope.diagrams` 列多张,每张是更小的 data.ir。

**拆分触发器**(任一命中 → 建议拆,并把方案给人确认):

| 触发 | 谁判 |
|---|---|
| `included` 数 > 容量预算 | 代码(计数) |
| 检出多个 message(回答不止一个问题) | 模型 |
| 混了抽象层(既有 context 级又有 code 级 item) | 模型 / 部分可检 |
| 多个 `dataset_type`(一部分表、一部分网络) | 可检 |
| 关系图多个不连通子团(connected components > 1) | 代码 |

**用户甩一大堆 context 时的正解**:不硬画成一张,而是回「这其实是 N 张图——1 张总览 + 几张下钻,要全做还是先做总览?」

## 找人的闸口(message / cut / split)—— 怎么问(让人看得懂)

呈现**决策**,不是数据结构。翻译成「会画成啥样 + 丢了啥 + 为什么」。

- **message 闸口**:用一句话说核心 + 出处(「因为你强调性能」)+ 若有对等框架给备选。用 AskUserQuestion,带默认(沉默=接受)。
- **cut 闸口**(最关键):把 `cut`/`deferred` **显式摆出来**(画成灰色脚注/虚线区,防静默省略),问「这些先不画,要保哪个?」。
- **split 闸口**(触发拆分时):把 `scope.diagrams` 摆出来——「这其实是 N 张:总览 + 下钻,全做还是先做总览?」让人决定范围与张数。
- **能画就别说**:先出极便宜骨架/大纲让人用眼确认,而不是读 JSON。
- 只在这几关、且真分叉时打断;每个判断附出处;纠正只动一处(靠 IR 缓存)。

## 验收(画之前自检,部分可 lint)

- 有且仅有一个 `message`;
- 分组 MECE 无重叠(可检)、无遗漏(人/模型兜);
- 每个 `included` 都服务 `message`(否则该进 `cut`);
- 超容量时 `cut`/`deferred` 非空(密度被控制,不是堆);
- `attributes.level` 标对(否则 encoding 不诚实)。

**可计算把关**:`node scripts/data-ir-check.mjs <data-ir.json>` 机械校验 schema + 容量(included vs 预算)+ 关系图**连通分量**(>1 自动提按分量拆图)+ MECE 重叠/缺口;走查样例见 `examples/data-ir/`(naive 触发拆分 → fixed 清零)。语义(message 对不对、切法好不好)仍靠模型/人。

## 交给下游

- `dataset_type` + `relations` → **dispatch 选 pattern**(tree→层级树、network→图、temporal→时间轴…)。
- `attributes.level` → **encoding 选视觉变量**(定量→位置/长度、名义→色相/形状、关系→连接/包含;见 `references/encoding.md`)。
- `salience` → **casting / hierarchy**(hero 在各通道获胜)。
- `budget.deferred` → 另起一张图 / 下钻视图。

**Goodhart**:message 对不对、切法妙不妙是语义,只能靠理解内容;本流程固定步骤与判据,不替你做语义判断。
