# Prompt:view.ir.json → encode.ir.json(半自动:程序填机械通道,LLM 只标语义)

encode.ir(给每个 item/relation/group 绑视觉通道、**无坐标**)里大半是**机械的**,可从 view.ir 确定性算出 ——
这部分交程序(`scripts/encode-derive.mjs`),**大模型不写**。LLM 只产一份很小的**语义 overrides**:
机器判断不了的那几项(每个角色用什么形状/图标、特殊箭头头型、名义类别色)。

两步:
```
1) LLM:照本提示词产 <name>.encode-overrides.json(只有语义覆盖,能省则省)
2) 程序:node scripts/encode-derive.mjs <view.ir.json> --overrides <overrides.json> --out <encode.ir.json>
   再校验:node scripts/encode-check.mjs <encode.ir.json> --from <view.ir.json>   # 须 0 error
```
schema:产物 = `references/encode-ir.d.ts`;理论依据 = `iterate/encoding-design.md`。

---

## 程序会自动填的(机械通道 —— 你**不要**在 overrides 里重复)

- **hero**(view.ir.hero)→ `size:hero` + `hue:accent` + `weight:bold` + `fill:solid`(强调唯一)。
- **tiers 梯度**(有序):顶档→hero;次档→large/emph;中间→normal/normal;末档→small/light + `value:0.9` + `hue:muted`;其余 `hue:ink`。
- **relation.kind**:flow→`stroke:solid`+`hue:ink`;dependency→`stroke:dashed`+`hue:muted`;`endArrowhead:arrow`;每条 relation 都落一条 connection。
- **group**→ 每个一个 `containment`(dashed + muted)。
- 默认 `mark:box`,`palette` = accent#1971c2 / ink#1e1e1e / muted#868e96。

## 你要产的(语义 overrides —— 只在偏离默认时写)

```
你是感知编码器。只输出一个 overrides JSON(纯 JSON,无解释、无围栏)。机械通道程序会填,
你只覆盖机器判断不了的语义项,且**能省则省**(默认对就别写)。

可覆盖的项:
  marks["<id>"]:
    - mark   : 角色对应的形状 —— box(默认,省略)/ ellipse(起止/事件)/ cylinder(存储/库/DB)
               / document(文件/产物)/ diamond(判断/选择)/ hexagon / icon
    - icon   : drawlib 图标 id(mark=icon 时给;= shape 通道的名义编码)
    - hue    : 仅当该 item 属于一个**名义类别**时给 "cat:<类别名>"(同类同色);否则别写(让程序按 tier 给 ink/muted)
    - fill   : 需要纹理时(hachure/cross-hatch/...)
  links["<from>-><to>"]:
    - endArrowhead/startArrowhead:仅当关系有**特定语义**时 —— 继承/实现 "triangle_outline";组合/聚合 "diamond"/"diamond_outline";ER 基数 "crowfoot_one/many/one_or_many"。普通箭头别写(默认 arrow)。
    - label:中段标签(关系上要写字时)
  regions["<组名>"]:一般不用写(默认 dashed+muted 够了)

判据:
  - 形状要**诚实表意**(圆柱=存储、文档形=文件、菱形=判断),不是为不同而不同;拿不准就用 box。
  - hue 只编码**名义**:没有真类别就别造 cat:(凭空多色 = 彩虹 slop)。有序的重要度交给程序的 tier 梯度,不用 hue。
  - 关系语义清楚才换头型(UML/ER);否则留默认。

【view.ir】
{{VIEW_IR_JSON}}
```

## 输出示例(见 examples/self-arch/overview.encode-overrides.json)

```jsonc
{
  "marks": {
    "in":  { "mark": "ellipse" },   // 起点
    "art": { "mark": "ellipse" },   // 终点产物
    "lib": { "mark": "cylinder" },  // 存储/库
    "exc": { "mark": "document" }   // 文件/产物
  }
}
```

四行覆盖 + 程序推导 = 完整 encode.ir(17 marks / 13 links / 5 regions),且按构造过 `encode-check`。

## 通道速查(挑形状/类别时照这张表)

| 数据类型 | 用什么通道 | 谁来定 |
|---|---|---|
| 名义(类别/角色) | shape(mark 形状 + drawlib icon)/ hue(`cat:`,≤4)/ texture(fill、stroke) | **LLM**(overrides) |
| 有序(优先级/层级) | value / size / weight 梯度 | **程序**(tier 梯度) |
| 关系种类(继承/聚合/基数) | connection 的箭头头型 | **LLM**(特殊时) |
| 关系流向/依赖 | stroke solid/dashed + connection | **程序**(按 kind) |
| 分组归属 | containment | **程序**(按 group) |
| 定量(精确数量) | position/length —— 交给 chart 渲染器,不在本层硬编 | — |

**Excalidraw 是关系图工具**:connection + containment 是它最忠实的两条通道,优先用它们承载结构;这两条已被程序自动落上。

## 备注

- **为什么这么拆**:机械通道(tier 梯度、flow/dep 线型、group 框)是 view.ir 的确定性函数,程序算更稳、还省 token;只有"这个角色长什么样、这条关系是不是继承、有没有真类别"是语义判断,留给 LLM。`encode-check` 兜可计算的诚实性残差。
- **position-free**:本层只定通道,不定坐标;`size:"hero"` 是档位不是像素,layout 再解析成 w/h/x/y。
