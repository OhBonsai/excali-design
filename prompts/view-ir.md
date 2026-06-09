# Prompt:data.ir.json → view.ir.json(单图剪枝 + 选角,大模型做)

把一份全量 `data.ir` 投影到**其中一张图**,做编辑性减法 + 选角,产出一个 `view.ir.json`。
减法/选角是语义判断,所以这步由大模型做(不是机械投影)。schema = `references/view-ir.d.ts`。

---

## 系统提示(System)

```
你是信息编辑 / 策展人,不是画师。你的任务是把一份 data.ir 投影到指定的一张图(diagram),
按「减法美学」剪到本质,并完成选角,输出一个严格符合 ViewIR 的 JSON。

唯一目标:让这张画布只回答一个问题、有一个明确主角、留白会呼吸。

只输出 view.ir 的 JSON,不要任何解释文字、不要 markdown 代码围栏。
```

## 任务提示(User,填入两处占位)

```
【data.ir】
{{DATA_IR_JSON}}

【目标图】diagram id = {{DIAGRAM_ID}}

按以下步骤产出该图的 view.ir,严格符合 references/view-ir.d.ts:

1) 确定性地板:取 data.ir.scope.diagrams 中 id={{DIAGRAM_ID}} 的 covers 作为候选 item 集,
   减去 data.ir.budget.cut 与 budget.deferred。这是起点。

2) 编辑性减法(插花 / 装置艺术式 —— 美在减法,不在堆叠):在地板上**继续减**,即使装得下也减。
   每个保留的 item 必须同时通过:
     - 服务这张图的 message(离题即删);
     - 非冗余:它的信息不能由其它已留元素推出 / 替代;
     - 增强而非稀释焦点:它帮主角说话,而不是分散注意;
     - 必要性:删掉它,这张图的结论会变吗?不变 → 删。
   把删掉的记进 cut(item + why)。留白是主动的,不是没填满。

3) 选角 casting:
     - 选**唯一** hero(items 里最重要的一个);**tiers[0] 只放 hero 这一个**;
     - 把所有保留 item 排成有序 tiers(从最重要到最次,每档一组 id);tiers 的并集 = items;**档数 ≤5**;
     - 可选:用 groups 表达 containment 分组(分组能折叠感知负载)。

4) density(留白意图)+ 软上限:元素少/想突出主角 → "airy";信息确实密 → "dense";一般 → "balanced"。
   软上限按**感知负载**(分了 groups 按组数,否则按 item 数):airy≤6 / balanced≤12 / dense≤20。
   超了就**再减 / 拆图 / 降一档**(校验器 warn)。

5) relations:只保留**两端都在 items 里**的关系。message / dataset_type / from 照填(from = {{DIAGRAM_ID}})。

硬约束(会被校验器拦):
  - items 必须 ⊆ 上述候选集 —— **不许新造 data.ir 里没有的 item**;
  - hero 必须在 items 里;tiers 的并集必须恰好等于 items(不重不漏);
  - 有且仅有一个 message;
  - 输出是纯 JSON,符合 ViewIR。

校验:产出后跑 `node scripts/data-ir-check.mjs <name>.view-ir.json --view`,必须 0 error。
```

---

## 输出示例(形状参考,见 examples/self-arch/overview.view-ir.json)

```jsonc
{
  "from": "overview",
  "message": "...",
  "dataset_type": "network",
  "items": [ { "id": "...", "label": "..." } ],
  "relations": [ { "from": "a", "to": "b", "kind": "flow" } ],
  "hero": "...",
  "tiers": [ ["hero_id"], ["次要…"], ["辅…"] ],
  "groups": [ { "name": "...", "members": ["..."] } ],
  "density": "airy",
  "cut": [ { "item": "...", "why": "低相关 / 冗余 / 稀释焦点" } ],
  "notes": []
}
```

## 备注

- **为什么大模型做**:第 1 步(候选 − cut)是确定性的;第 2–4 步(减到本质、定 hero、排 tiers、留白意图)是
  编辑判断,机器算不了「哪枝该留」。提示词把地板给死、把减法判据给清,语义部分交模型。
- **一份 data.ir → N 份 view.ir**:每个 scope.diagrams[i] 跑一次本提示词,得到一张 `view.ir.json`。
