# 立信息:brief → data.ir(你在这一步做什么)

你拿到了 `brief`(澄清产出)和需求 + context(代码/文档/搜索)。现在要把信息**立成结构**:抽象成一个带类型、
带重点、带取舍的 `<name>.data-ir.json`,作为下游(选角→编码→布局)的契约。**它不是画法,是信息真相。**

**何时做**:自由信息可视化(架构/解释图/信息图/关系图)。
**何时跳过**:原型(prototype)和固定 mermaid —— 数据已确定,直接走各自渲染路径,不立 data.ir。
**强制**:画 `.excalidraw` 前必须依次落盘并过校验:`brief.json`(见 `clarify.md`)→ `data.ir.json`(过 `data-ir-check`)
→ 每张图一份 `view.ir.json`(`prompts/view-ir.md`,过 `--view --from`)。**`.excalidraw` 从 view.ir 渲染,不是从 data.ir。** 不许"脑子里走一遍直接画"。

## 工作流(6 步,每步标谁来做)

1. **抽取**:把需求 + 澄清答案 + context 里的事实卡片化,先穷举。*结构化源(代码/CSV)可解析;散文你来抽。*
2. **数据抽象**:定 `dataset_type`,给每条 attribute 标 `level`(nominal/ordinal/quantitative/relational)。**先做对——上游错下游全错。** *值能见就让程序推 level(全数字=定量、少量重复=名义、日期=时序);拓扑能算就让程序定 tree/network。*
3. **结构化**:分组(MECE:互斥穷尽)+ 找层级 + 标 `relations.kind`。*你提切法;程序查重叠。*
4. **定重点**:定**一个** `message`,排 `salience`(hero/次/辅)。*你提名,人拍板 message。*
5. **范围与密度**(产出 `scope` + `budget`):先定**边界**(只留服务 message 的)→ 定**颗粒度**(一张图锁一个抽象层,受众×message×容量)→ 估容量(一眼能分辨的区块数 ≈7±2)→ 装不下/跨层/多问题就走下面的拆分触发器。*程序算容量+跑触发器;你提边界/颗粒度/拆分方案;人批准 cut 与拆分。*
6. **冻结 + 校验**:写出 data.ir,跑 `node scripts/data-ir-check.mjs <name>.data-ir.json` → **0 error**(按它的建议修/拆)。

## 产出形状(权威定义见 `references/data-ir.d.ts`)

**schema 单一事实源 = `references/data-ir.d.ts`**(TS 类型,枚举/必填/可选以它为准)。编辑期想要类型约束:写 `<name>.data-ir.ts` 并 `satisfies DataIR`(模板 `_TEMPLATE.data-ir.ts`)。

```jsonc
{
  "message":   "一句话结论先行",                                // 必填
  "dataset_type": "table|tree|network|temporal|spatial|set",   // 必填
  "items":     [ { "id":"...", "label":"..." } ],              // 必填
  "attributes":[ { "of":"itemId", "name":"...", "level":"nominal|ordinal|quantitative|relational" } ], // 可选 → encoding
  "relations": [ { "from":"a", "to":"b", "kind":"hierarchy|flow|dependency|containment|similarity" } ], // 可选(语义,非画法)
  "salience":  { "hero":"itemId", "secondary":[...], "groups":[ {"name":"...","members":[...]} ] },      // 可选
  "scope":     { "boundary":{ "in":[...], "out":[{"item":"id","why":"..."}] },
                 "granularity":"context|container|component|code|coarse|medium|fine",
                 "diagrams":[ {"id":"overview","message":"...","level":"container","covers":[...]} ] },  // 可选;diagrams>1=建议拆
  "budget":    { "included":[...], "aggregated":[...], "deferred":[...], "cut":[...] }                   // 可选
}
```

## 范围:边界 / 颗粒度 / 拆几张(第 5 步细则)

- **边界 in/out**:item 服务 message 才在界内;其余进 `out`(带 why)。边界 = 回答这个问题需要多少,不是数据有多少。
- **颗粒度**:一张图**只锁一个抽象层**(C4 的 context/container/component/code;或 coarse/medium/fine),混层 = slop。由 受众专业度 × message × 容量 定:高管→粗,工程师→细。
- **拆几张**:界内 + 对的颗粒度仍超容量,或这堆其实回答多个问题/跨层 → `scope.diagrams` 列多张,每张是更小的 data.ir。

**拆分触发器**(任一命中 → 建议拆,把方案给人确认):

| 触发 | 谁判 |
|---|---|
| `included` 数 > 容量预算 | 程序(计数) |
| 检出多个 message(回答不止一个问题) | 你 |
| 混了抽象层(既有 context 级又有 code 级 item) | 你 / 部分可检 |
| 多个 `dataset_type`(一部分表、一部分网络) | 可检 |
| 关系图多个不连通子团(connected components > 1) | 程序 |

**用户甩一大堆 context 时的正解**:不硬画成一张,而是回「这其实是 N 张图——1 张总览 + 几张下钻,要全做还是先做总览?」

## 找人的闸口(message / cut / split):怎么问让人看得懂

呈现**决策**,不是数据结构——翻译成「会画成啥样 + 丢了啥 + 为什么」:

- **message 闸口**:用一句话说核心 + 出处(「因为你强调性能」)+ 若有对等框架给备选。AskUserQuestion,带默认(沉默=接受)。
- **cut 闸口(最关键)**:把 `cut`/`deferred` **显式摆出来**(画成灰色脚注/虚线区,防静默省略),问「这些先不画,要保哪个?」。
- **split 闸口**(触发拆分时):把 `scope.diagrams` 摆出来——「这其实是 N 张:总览 + 下钻,全做还是先做总览?」。
- **能画就别说**:先出极便宜的骨架/大纲让人用眼确认,而不是读 JSON。
- 只在这几关、且真分叉时打断;每个判断附出处;纠正只动一处(靠 IR 缓存)。

## 画之前自检(部分可 lint)

- 有且仅有一个 `message`;分组 MECE 无重叠(可检)、无遗漏(你/人兜);
- 每个 `included` 都服务 `message`(否则该进 `cut`);超容量时 `cut`/`deferred` 非空(密度被控,不是堆);
- `attributes.level` 标对(否则下游 encoding 不诚实)。
- 机械把关:`data-ir-check` 查 schema + 容量 + **连通分量**(>1 自动提按分量拆图)+ MECE。走查样例 `examples/data-ir/`(naive 触发拆分 → fixed 清零)。

## 交给下游

- `dataset_type` + `relations` → **dispatch 选 pattern**(tree→层级树、network→图、temporal→时间轴…)。
- `attributes.level` → **encoding 选视觉变量**(见 `references/encoding.md`)。
- `salience` → **选角 / hierarchy**(hero 在各通道获胜)。
- `budget.deferred` → 另起一张图 / 下钻视图。

## 边界

message 对不对、切法妙不妙是语义,只能靠理解内容;本流程固定步骤与判据,不替你做语义判断。
建设背景与理论见 `iterate/data-ir-design.md`(不必读也能干活)。
