/**
 * view.ir 的权威类型约束 —— 「单张画布、剪枝+选角后承诺要画的内容」。
 *
 * 它是 data.ir 的下游派生:对 data.ir.scope.diagrams 里的某一张图,做**编辑性减法**(ikebana/装置式:
 * 减到本质、留白主动)+ **选角 casting**(定唯一 hero、排有序优先级 tiers)。
 * 这一步**靠大模型做**(减法/选角是语义判断,不是机械投影);提示词见 `prompts/view-ir.md`。
 *
 * - schema 单一事实源 = 本文件。运行时校验:`node scripts/data-ir-check.mjs <view.ir.json> --view`(0 error)。
 * - 链路:brief → data.ir → **view.ir(每图一份)** → encoding → layout → .excalidraw。
 * - 复用 data.ir 的基础类型(同一信息真相)。
 */
import type { DatasetType, Item, Relation, Group } from "./data-ir.d.ts";

/** 留白意图(ma):airy=多留白/少元素,dense=信息密。 */
export type Density = "airy" | "balanced" | "dense";

/** 一条被删减项的记录(编辑性减法的留痕)。 */
export interface CutRecord {
  item: string;
  why: string;
}

/**
 * view.ir —— 一张画布的承诺集。必填:from / message / dataset_type / items / hero / tiers / density。
 * 硬约束(校验器查):items ⊆ 来源 diagram 的 covers(不许新造);hero ∈ items;tiers 并集 = items。
 */
export interface ViewIR {
  /** 溯源:来自 data.ir.scope.diagrams[i].id。 */
  from: string;
  /** 这张画布的**唯一** message。 */
  message: string;
  dataset_type: DatasetType;
  /** 剪枝 + 聚合后留下的 item(必须是来源 covers 的子集)。 */
  items: Item[];
  /** 仅留存 item 之间的关系。 */
  relations?: Relation[];
  /** 必填:唯一视觉主角(items 里的 id)。 */
  hero: string;
  /** 有序优先级分档,最重要 → 最次;并集 = items;tiers[0] 含 hero。供梯度强调 + hierarchy-lint。 */
  tiers: string[][];
  /** 可选:containment 分组。 */
  groups?: Group[];
  /** 留白 / ma 意图。 */
  density: Density;
  /** 本视图相对来源做的编辑性删减(删了什么 + 为什么)。 */
  cut?: CutRecord[];
  /** 可选:callout / 批注。 */
  notes?: string[];
}
