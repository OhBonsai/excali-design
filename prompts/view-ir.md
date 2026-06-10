# 选角:data.ir → view.ir(你在这一步做什么)

你手上有一份全量 `data.ir` 和一个**目标图 id**(来自 `data.ir.scope.diagrams[i].id`)。现在要把这份 data.ir
**投影到这一张图**:做编辑性减法(插花/装置艺术:美在减法,不在堆叠)+ 选角(定唯一主角、排优先级),
产出一个 `<name>.<diagram>.view-ir.json`。

你的唯一目标:**让这张画布只回答一个问题、有一个明确主角、留白会呼吸**。

减法和选角是语义判断(机器算不了"哪枝该留"),所以这步靠你。`data.ir → N 张图`:每个 `scope.diagrams[i]` 跑一遍本流程。
schema = `references/view-ir.d.ts`;校验器兜可计算的硬约束。

## 工作流

1. **取确定性地板**:从 `data.ir.scope.diagrams` 里挑出 id = 你的目标图的那条,拿它的 `covers` 当候选 item 集,
   减去 `data.ir.budget.cut` 和 `budget.deferred`。这是你的起点——**只能在这个集合里减,不能新造**。
2. **继续减(编辑性减法)**:即使装得下也减。每个想保留的 item,必须同时过这四关,过不了就删:
   - **服务 message**:离题即删;
   - **非冗余**:它的信息不能由别的已留元素推出/替代;
   - **增强焦点**:它帮主角说话,而不是分散注意;
   - **必要性**:删了它,这张图的结论会变吗?不变 → 删。
   每删一个,记进 `cut`(item + why)。留白是主动留的,不是没填满。
3. **选角 casting**:
   - 选**唯一** `hero`(留下的里最重要的一个);
   - 把所有保留 item 排成有序 `tiers`(最重要→最次,每档一组 id);**`tiers[0]` 只放 hero 这一个**;tiers 的并集 = items;**档数 ≤5**;
   - 可选:用 `groups` 表达 containment 分组(分组能折叠感知负载)。
4. **定 density(留白意图)**:元素少/想突出主角 → `"airy"`;信息确实密 → `"dense"`;一般 → `"balanced"`。
   软上限按感知负载(分了 groups 按组数,否则按 item 数):airy≤6 / balanced≤12 / dense≤20。超了就**再减 / 拆图 / 降一档**。
5. **留关系**:只保留**两端都在 items 里**的 relations。`message` / `dataset_type` 照抄;`from` 填目标图 id。
6. **写文件 + 校验**:写出 `<name>.view-ir.json`,跑
   `node scripts/data-ir-check.mjs <name>.view-ir.json --view --from <name>.data-ir.json` —— 必须 **0 error**。报错就改、再跑。

## 硬约束(校验器会拦,先自查)

- `items` ⊆ 地板候选集 —— **不许新造 data.ir 里没有的 item**;
- `hero` 必须在 items 里;`tiers` 的并集必须恰好等于 items(不重不漏),`tiers[0]` 含 hero;
- 有且仅有一个 `message`;
- 输出是**纯 JSON**(无解释文字、无 markdown 围栏),符合 `references/view-ir.d.ts`。

## 一条提醒

减法要**狠**:这是整条链里唯一"主动丢信息"的一步,也是图好不好看的关键。地板(covers − cut)只是你能动的范围,
不是要画的清单——在地板上继续砍,直到只剩为 message 服务的本质。

## 输出形状(参考 examples/self-arch/overview.view-ir.json)

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

## 边界

- **第 1 步(候选 − cut)是确定性的**,本可程序算;**第 2–4 步(减到本质、定 hero、排 tiers、留白意图)是编辑判断**,只有你能做。
- 设计背景(减法美学 / 选角理论)见 `iterate/thinking.md`、`iterate/layout.md`(不必读也能干活)。
