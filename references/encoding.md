# 编码:view.ir → encode.ir(你在这一步做什么)

你手上有一份 `view.ir`(已经选好角:hero、有序 tiers、groups)。现在要把它变成 `encode.ir` ——
给每个 item / relation / group 绑视觉通道(形状、颜色、轻重、线型、框),**但不定坐标**(坐标是后面 layout 的事)。

这一步是**半自动**的,先认清分工,别做重复劳动:

- **程序替你做掉了大部分**(机械、可从 view.ir 算出):hero→放大上强调色;tiers→由重到轻的 size/weight/value 梯度;
  关系→flow 实线 / dependency 虚线 + 箭头;每个 group→一个虚线包含框。这些你**不要写**。
- **只剩几件机器判断不了的,你来定**:每个角色**该长什么形状**、关系**要不要特殊箭头头型**、有没有**真的名义类别**要上色。

所以你产出的不是整份 encode.ir,而是一份很小的 `<name>.encode-overrides.json`,只写"偏离默认"的那几项。**能省则省**——默认对就别写。

## 工作流

1. **读 view.ir**,过一遍 items。对每个 item 问一句:**它的形状能不能诚实表意?**
   - 能,就在 overrides 里给 `mark`:存储/库/DB→`cylinder`;文件/产物→`document`;起点/终点/事件→`ellipse`;判断/分支→`diamond`;需要图标→`icon` 并给 `icon`(drawlib id)。
   - 不能(就是个普通框),**别写**,留默认 `box`。形状是名义通道,要表意,不是为不同而不同;拿不准就用 box。
2. 过一遍 relations。**这条关系有特定语义吗?** 继承/实现→`endArrowhead:"triangle_outline"`;组合/聚合→`diamond`/`diamond_outline`;ER 基数→`crowfoot_one|many|one_or_many`;要写字→`label`。普通箭头**别写**(默认就是 arrow)。
3. **有没有真的名义类别?**(比如"服务按团队分三类")。有,才给同类 item 同一个 `hue:"cat:<类别名>"`;没有就**别造**——凭空多色是彩虹 slop。重要度/层级不是类别,那个交给程序的 tier 梯度,**不要用颜色表达有序**。
4. 把上面这些(通常就几行)写进 `<name>.encode-overrides.json`。
5. **程序组装**:`node scripts/encode-derive.mjs <name>.view-ir.json --overrides <name>.encode-overrides.json --out <name>.encode-ir.json`
6. **校验**:`node scripts/encode-check.mjs <name>.encode-ir.json --from <name>.view-ir.json` —— 必须 **0 error**。报错了就改 overrides 再跑第 5、6 步。

## 三条不要(诚实编码的红线)

- **不要**重写机械通道(tier 梯度、flow/dep 线型、group 框、hero 强调)——程序已经填了,你写了也是覆盖,多半画蛇添足。
- **不要**凭空上色:hue 只编码真实的**名义类别**;没有类别就保持 ink/muted(程序会给)。彩虹 = 凭空编码不存在的"类别事实",`encode-check` 的 color-budget 会拦。
- **不要**用颜色/形状表达**有序**(谁更重要):有序走 value/size/weight 梯度,那是程序的活。形状/颜色是名义通道。

## 挑形状/类别时的判断表

| 你面对的数据 | 用哪条通道 | 谁定 |
|---|---|---|
| 名义:角色/种类(存储、文件、判断…) | shape(`mark` 形状 + drawlib `icon`) | **你** |
| 名义:互斥类别(团队/域/状态种类) | hue `cat:`(≤4 种) | **你**(有真类别才给) |
| 关系种类:继承/聚合/基数 | connection 的箭头头型 | **你**(特殊时) |
| 有序:优先级/层级/严重度 | value / size / weight 梯度 | 程序 |
| 关系:流向 / 依赖 | 实线 / 虚线 + connection | 程序 |
| 分组归属 | containment 框 | 程序 |
| 定量:精确数量 | position / length(交给 chart 渲染器) | 不在本层 |

一句话定位:**Excalidraw 是关系图工具**,最忠实的两条通道是 connection(箭头)和 containment(框);它们已被程序自动落上,你只管让每个**节点的形状**和**特殊关系**说对话。

## 一个完整例子(自架构图,这就是全部输入)

`view.ir` 有 17 个节点,但你只需要写这 4 行 —— 其余 13 个节点、13 条边、5 个分组的通道全由程序推导:

```jsonc
// overview.encode-overrides.json
{
  "marks": {
    "in":  { "mark": "ellipse" },   // 起点
    "art": { "mark": "ellipse" },   // 终点产物
    "lib": { "mark": "cylinder" },  // 资产库 = 存储
    "exc": { "mark": "document" }   // .excalidraw = 文件
  }
}
```

跑完第 5、6 步,得到 17 marks / 13 links / 5 regions 的完整 `encode.ir`,且按构造过 `encode-check`(0/0)。
形状参考:`examples/self-arch/overview.encode-overrides.json` → `overview.encode-ir.json`。

## 出处与边界

- schema(产物结构)= `references/encode-ir.d.ts`;机械推导规则 = `scripts/encode-derive.mjs`;校验规则 = `scripts/encode-check.mjs`。
- **为什么这么分**:机械通道是 view.ir 的确定性函数,程序算更稳更省;只有"这角色长什么样、这关系是不是继承、有没有真类别"是语义判断,才需要你。
- **position-free**:你只定通道,不定坐标;`size:"hero"` 是档位不是像素,layout 再解析成 w/h/x/y。
- 想看通道选择背后的理论(Bertin/Cleveland-McGill/Mackinlay、为什么 Excalidraw 偏关系编码):`iterate/encoding-design.md`(不必读也能干活)。
