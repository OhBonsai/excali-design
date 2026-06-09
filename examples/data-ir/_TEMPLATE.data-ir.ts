// data.ir 的「受类型约束」写法:复制成 <name>.data-ir.ts,satisfies DataIR 会让编辑器/`tsc --noEmit` 当场报错。
// 约束源 = references/data-ir.d.ts。运行时硬门仍是:node scripts/data-ir-check.mjs <name>.data-ir.json(0 error)。
// (若只想要 JSON,用 _TEMPLATE.data-ir.json;本文件用于想要编辑期类型检查的人。)
import type { DataIR } from "../../references/data-ir.d.ts";

const ir = {
  message: "一句话:这张图要回答的问题 / 核心结论(BLUF)",
  dataset_type: "network",                          // DatasetType:写错枚举会报错
  items: [
    { id: "a", label: "..." },
    { id: "b", label: "..." },
  ],
  attributes: [
    { of: "a", name: "...", level: "nominal" },     // DataLevel
  ],
  relations: [
    { from: "a", to: "b", kind: "flow" },           // RelationKind(语义,非画法)
  ],
  salience: {
    hero: "a",
    groups: [{ name: "...", members: ["a", "b"] }],
  },
  scope: {
    boundary: { in: ["a", "b"], out: [] },
    granularity: "container",                        // Granularity
    diagrams: [{ id: "overview", message: "...", level: "container", covers: ["a", "b"] }],
  },
  budget: { included: ["a", "b"], aggregated: [], deferred: [], cut: [] },
} satisfies DataIR;

export default ir;
