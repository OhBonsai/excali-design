/**
 * data.ir 的权威类型约束 —— 画图前的「信息中间表」。
 *
 * 这是 schema 的**单一事实源**:枚举/必填/可选都以本文件为准。
 * - 用法说明:`references/data-ir.md`
 * - 运行时校验:`scripts/data-ir-check.mjs`(TS 类型在运行时被擦除,故 checker 是本文件的「运行时镜像」;
 *   改了这里的枚举/必填,记得同步那边)。
 * - 编辑时约束:把 data.ir 写成 `<name>.data-ir.ts` 并 `satisfies DataIR`(见 examples/data-ir/_TEMPLATE.data-ir.ts),
 *   编辑器 / `tsc --noEmit` 会当场报类型错。
 *
 * 适用:自由信息可视化(架构/解释/信息图/关系)。原型 / 固定 mermaid 数据已确定,不走 data.ir。
 */

/** 数据整体形态(决定 dispatch 选哪种 pattern)。 */
export type DatasetType =
  | "table"
  | "tree"
  | "network"
  | "temporal"
  | "spatial"
  | "set";

/** 属性的数据类型层级(Bertin/Munzner)——决定 encoding 用哪种视觉变量。 */
export type DataLevel = "nominal" | "ordinal" | "quantitative" | "relational";

/** 关系的语义种类(注意:这是语义,不是画法;渲染时才决定变箭头还是嵌套框)。 */
export type RelationKind =
  | "hierarchy"
  | "flow"
  | "dependency"
  | "containment"
  | "similarity";

/** 抽象层级 / 粗细(一张图只锁一个层)。 */
export type Granularity =
  | "context"
  | "container"
  | "component"
  | "code"
  | "coarse"
  | "medium"
  | "fine";

/** 信息单元。 */
export interface Item {
  id: string;
  label: string;
}

/** 某 item 的一个属性 + 其数据类型层级(喂 encoding)。 */
export interface Attribute {
  /** 所属 item 的 id。 */
  of: string;
  name: string;
  level: DataLevel;
}

/** 一条 typed 关系(from/to 为 item id)。 */
export interface Relation {
  from: string;
  to: string;
  kind: RelationKind;
  label?: string;
}

/** 一个分组(MECE:互斥、穷尽)。 */
export interface Group {
  name: string;
  members: string[];
}

/** 重要性 / casting。 */
export interface Salience {
  /** 视觉主角 item id。 */
  hero?: string;
  secondary?: string[];
  groups?: Group[];
}

export interface BoundaryOut {
  item: string;
  why: string;
}

/** 范围边界:in 可填 item id,也可填分区名(让容量按「感知块数」算)。 */
export interface Boundary {
  in: string[];
  out?: BoundaryOut[];
}

/** 一张子图(diagrams.length > 1 即「建议拆分」)。 */
export interface DiagramSpec {
  id: string;
  message: string;
  level?: string;
  covers: string[];
}

/** 范围建议:边界 / 颗粒度 / 拆几张。 */
export interface Scope {
  boundary: Boundary;
  granularity: Granularity;
  diagrams: DiagramSpec[];
}

/** 密度预算:included 入图;其余三档是「控制密度」的取舍清单。 */
export interface Budget {
  included: string[];
  /** 折叠/上卷(如 18 组件折成 6 个 containment 分区)。 */
  aggregated?: string[];
  /** 下钻到另一张图。 */
  deferred?: string[];
  /** 舍弃(低相关/越界)。 */
  cut?: string[];
}

/**
 * data.ir —— 画 .excalidraw 之前必须产出的信息中间表。
 * 最小可用:message + dataset_type + items;其余按需要补。
 */
export interface DataIR {
  /** 一句话:这张图回答的问题 / 核心结论(BLUF)。 */
  message: string;
  dataset_type: DatasetType;
  items: Item[];
  attributes?: Attribute[];
  relations?: Relation[];
  salience?: Salience;
  scope?: Scope;
  budget?: Budget;
}
