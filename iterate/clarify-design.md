# clarify 阶段建设记录(本次设计 · 非模型 reference)

> clarify 这一层「为什么这么设计、依据什么方法、哪些机器哪些人」的**建设过程记录**,给人读/交接用。
> **面向模型的操作版在 `references/clarify.md`**(skill.md 走那个)。与 `iterate/data-ir-design.md` 配套。

## 1. 缘起与定位

data.ir 解决「把信息抽成结构」,但它需要**判据**:为谁画、回答什么问题、什么算重要、范围多大。
这些判据不在数据里,在**需求**里。所以 data.ir 前面要先有 clarify,把模糊需求收敛成可用的 `brief`。

**链路**:`clarify(brief)→ data.ir(brief + input + context → 结构 + scope)→ dispatch → encoding → render → lint`。
一句话分工:**clarify 定「为谁、答什么问题、什么重要」(判据);data.ir 拿判据去切真实信息并给范围建议。**

**适用边界**:自由信息可视化。原型/固定 mermaid 仍需基本澄清,但不进 data.ir。

**核心约束**:**用最少的打扰**定下决定下游一切的几个判据——不是问 20 个问题。

## 2. 产物:brief

```jsonc
{
  "audience":  "谁看 + 专业度",       // → 定颗粒度(高管粗 / 工程师细)
  "purpose":   "看完做什么决策/动作",  // Munzner action+target → 定边界 & 谁是 hero
  "question":  "这张图回答的唯一问题",  // → data.ir.message 的种子(BLUF)
  "scope_hints": { "must_include":[...], "out":[...] },
  "constraints": "尺寸/介质/格式/已有 context 与资产"
}
```

## 3. 方法锚(科学依据)

- **Munzner what/why/who**:先问 **WHY(任务/支持什么决策)+ WHO(受众)**,不只问 WHAT(数据)。任务抽象是核心。
- **GQM(Goal-Question-Metric 改造)**:Goal → Question(唯一问题)→ Info(什么信息能回答)。
- **BLUF / 单问题框定**:逼出一个 governing question,早定。
- 本质是把 SKILL.md 现有的「design pre-questions(受众+目的+一句话 takeaway)」系统化。

## 4. 流程

1. **先读 context**(代码/文档/截图/已有架构图)——能查到的**绝不问**(事实先于假设)。
2. **找决策相关的未知**:受众、目的、唯一问题、范围边界。只盯**改变结果**的未知。
3. **逐个决定问不问**:能自信推断 → 推断 + **声明假设**(可纠),不打断;真分叉且高影响 → 才问(AskUserQuestion,带默认,沉默=接受)。
4. **大堆/异质 context → 强制范围澄清**:输入大或杂时(可计算:体积/子团数/类型数),关键一问自动变成范围题——「这张图最想说的**一件事**是什么?给谁看?」。这直接触发 data.ir 的 `scope`(边界/颗粒度/拆几张)。
5. **输出 brief**,交给 data.ir。

## 5. 三分(谁来做)

- **可计算**:检出「该不该强制范围澄清」(输入体积/关系子团数/dataset_type 种类数);从结构化 context 预填部分 brief。
- **概率大模型**:生成好的澄清问题、推断受众/目的、把模糊需求归纳成一个 question。
- **人**:回答澄清、拍板受众与目的、给范围 hint。

## 6. 「好 clarify」判据

- 收尾有:一个可回答的 question + 已知受众 + 已知目的;
- 只问了少数几个、且都决策相关(没审问);
- 推断项**声明了假设**(用户能纠);
- 输入大时**早抛范围题**,不闷头开画。
- **边界**:问得准不准、归纳得对不对仍是语义(模型+人);本方法固定流程与判据,不替你判断内容。

## 7. 落地

- ✅ 操作版 `references/clarify.md`(给 skill.md);本记录(给人)。
- ✅ 接入 SKILL.md 工作流:clarify(brief)→ data.ir;参考表加 clarify 行。
- ⬜ 可选:把「该不该强制范围澄清」的可计算触发(输入体积/子团/类型数)做成小工具,提示模型何时必须抛范围题。

## 8. 一句话

**clarify = 用 Munzner what/why/who + GQM + BLUF,以最少打扰把模糊需求收敛成 brief(受众/目的/唯一问题/范围/约束);先读 context、能推则推、只问分叉项、大堆 context 强制范围题。** 它给 data.ir 提供判据,是整条画图链路的真正起点。
