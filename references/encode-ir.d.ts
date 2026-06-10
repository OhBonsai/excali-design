/**
 * encode.ir 的权威类型约束 —— 「把 view.ir 的语义/选角,绑到忠实的视觉通道(position-free)」。
 *
 * 链路:brief → data.ir → view.ir → **encode.ir(本层)** → layout(定坐标)→ .excalidraw(具体元素)。
 *
 * 它回答的唯一问题:**每个 item / relation / group 用哪条视觉通道、取什么值** —— 不回答「画在哪」。
 * 坐标是下游 layout 的活;具体元素(含 x,y,hex,points)就是 .excalidraw 本身,所以没有单独的 component.ir。
 *
 * 通道选择是感知判断(Bertin 视觉变量 × Cleveland-McGill 精度 × Mackinlay 有效性),**靠大模型做**;
 * 提示词见 `references/encoding.md`,理论背景见 `iterate/encoding-design.md`。
 *
 * - schema 单一事实源 = 本文件。运行时校验:`node scripts/encode-check.mjs <encode.ir.json> --from <view.ir.json>`(0 error)。
 * - 关键不变量:**通道值是语义 token(accent/ink/muted、hero/normal、0..1),不是像素/hex** —— 这样才能机械校验「诚实编码」。
 */
import type { DatasetType } from "./data-ir.d.ts";

/** 元素的几何原型(shape 通道,名义)。drawlib 图标走 `icon`。 */
export type MarkType =
  | "box" | "ellipse" | "cylinder" | "document" | "diamond" | "hexagon" | "text" | "icon";

/**
 * 色相角色(hue 通道)。**保留语义 token**,不是 hex:
 *  - "accent" 唯一强调色(留给 hero / 最强焦点);
 *  - "ink"    默认中性(正文级);
 *  - "muted"  弱化(辅助 / 背景 / 依赖);
 *  - "cat:<名>" 名义类别色(类别编码才允许多色;总落地色数 ≤4)。
 * 有序数据**不要**用 hue 区分(那是名义通道)—— 用 `value`/`size`。
 */
export type Hue = "accent" | "ink" | "muted" | `cat:${string}`;

/** 描边粗细(weight 通道,有序强调)。 */
export type Weight = "bold" | "emph" | "normal" | "light";
/** 尺寸档(size 通道,有序;hero 该唯一)。 */
export type Size = "hero" | "large" | "normal" | "small";
/** 纹理(fillStyle / strokeStyle,名义/选择通道)。 */
export type Fill = "none" | "solid" | "hachure" | "cross-hatch" | "zigzag";
export type Stroke = "solid" | "dashed" | "dotted";

/** 箭头头型(connection 通道用头型区分关系种类;镜像 Excalidraw Arrowhead)。 */
export type Arrowhead =
  | null | "arrow" | "triangle" | "triangle_outline"
  | "diamond" | "diamond_outline" | "circle" | "circle_outline"
  | "bar" | "crowfoot_one" | "crowfoot_many" | "crowfoot_one_or_many";

/** 一个 item 的视觉通道绑定(无坐标)。 */
export interface Channels {
  /** 色相角色。默认 "ink"。 */
  hue: Hue;
  /** 明度/不透明 0..1(有序通道,主通道之一)。 */
  value: number;
  /** 尺寸档(有序;hero 唯一)。 */
  size: Size;
  /** 描边粗细(有序强调)。 */
  weight: Weight;
  /** 可选:纹理填充。 */
  fill?: Fill;
  /** 可选:drawlib 图标 id —— shape 通道的名义编码(`mark:"icon"` 时必填)。 */
  icon?: string;
}

/** item → mark + 通道。 */
export interface Mark {
  /** 必须是 view.ir.items 里的 id。 */
  id: string;
  mark: MarkType;
  channels: Channels;
}

/** relation → connection 通道(显式编码关系,不靠空间邻近)。 */
export interface Link {
  /** "from->to",两端必须是 view.ir 里的 relation。 */
  rel: string;
  /** Excalidraw 主场通道。 */
  channel: "connection";
  /** 头型表关系种类(UML/ER/普通);默认 end="arrow"。 */
  endArrowhead?: Arrowhead;
  startArrowhead?: Arrowhead;
  /** 线型(texture):flow 多用 solid,dependency 多用 dashed。 */
  stroke: Stroke;
  hue?: Hue;
  /** 可选:中段标签(绑定 text)。 */
  label?: string;
}

/** group → containment 通道(frame/嵌套/虚线框)。 */
export interface Region {
  /** view.ir.groups[i].name。 */
  group: string;
  channel: "containment";
  stroke?: Stroke;
  hue?: Hue;
  fill?: Fill;
}

/**
 * encode.ir —— 一张画布的视觉通道绑定集(position-free)。
 * 硬约束(校验器查,--from view.ir):
 *   marks 的 id 集合 == view.ir.items(不重不漏);links.rel ⊆ view.ir.relations;regions.group ⊆ view.ir.groups;
 *   hero(view.ir.hero)那个 mark 必须 size:"hero" + hue:"accent",且**别的 mark 不得**用 hero/accent(主角唯一、强调唯一);
 *   落地色数 ≤4(色预算);value ∈ [0,1]。
 */
export interface EncodeIR {
  /** 溯源:= view.ir.from。 */
  from: string;
  /** 沿用同一 message(单一)。 */
  message: string;
  dataset_type: DatasetType;
  marks: Mark[];
  links?: Link[];
  regions?: Region[];
  /** 可选:语义 token → 实际色值的落地表(留空则渲染器用默认 ink/accent/muted)。 */
  palette?: Record<string, string>;
  notes?: string[];
}
