# Flowchart Component-Sheet Style Prompts (Excalidraw-reproducible)

Prompts for **gpt-image-2** to generate the 31-symbol flowchart component sheet in
different hand-drawn styles. Every style here maps cleanly onto Excalidraw's real
primitives, so each generated sheet can be **restored 1:1** into a `STYLE` preset for
`renderFlowchart(data, style)`.

Reference image to feed every prompt: `assets/mermaid-components/flowchart-components-full.png` (31 ISO/ANSI
symbols, 5-column grid, gray caption under each cell).

## What "reproducible" means

Only these knobs exist in Excalidraw, so styles are built from them:

| Knob | Values |
|---|---|
| `fillStyle` | `hachure` (diagonal sketch lines) · `cross-hatch` · `solid` |
| `roughness` | `0` architect (near-straight) · `1` artist · `2` cartoonist (wobbly) |
| `strokeStyle` | `solid` · `dashed` · `dotted` |
| `strokeWidth` | `1` thin · `2` bold · `4` extra-bold |
| `strokeColor` / `backgroundColor` | any hex |
| `roundness` | sharp · round · |
| `opacity`, hand-drawn font, canvas `viewBackgroundColor` (flat color only) |

**NOT reproducible** — do not rely on these, they flatten on restore: paper grain,
colored-pencil uneven coverage, watercolor washes, gradients, drop shadows, soft texture.

## Shared prefix — prepend to EVERY body below

```
Image-to-image. The reference image is a sheet of 31 flowchart symbols in a 5-column
grid with a small gray label under each cell. Redraw the SAME 31 symbols, SAME grid
positions, sizes, and labels — do NOT add, remove, merge, or rearrange any shape. Keep
every symbol identifiable as its flowchart type (rectangle=process, diamond=decision,
parallelogram=I/O, cylinder=database, etc.). Hand-drawn flat vector look, no 3D /
shadows / gradients / paper texture. Keep the gray caption under each cell. Restyle as:
```

---

## Styles

### 1. `classic-tricolor` — 经典三色语义（solid 填充）
Knobs: `fillStyle:solid, roughness:1, sw:1.5`
```
Clean hand-drawn marker look on white. Wobbly single-weight charcoal outlines (#1e1e1e).
SOLID flat semantic fills, used sparingly: process pale blue (#a5d8ff / outline #1971c2),
decision & control pale green (#b2f2bb / #2f9e44), start-end & emphasis pale red
(#ffc9c9 / #e03131); everything else white. Tidy engineer's-whiteboard vibe, squint-clean.
```

### 2. `hachure-classic` — 真·手绘斜线填充（excalidraw 招牌）
Knobs: `fillStyle:hachure, roughness:1, sw:1.5`
```
All fills are HACHURE (sketchy parallel diagonal pen lines with white gaps showing
between them), NOT solid. Wobbly ink outlines. Tricolor semantic hachure: process
pale-blue hachure, decision green hachure, start/end red hachure, the rest hollow white.
The diagonal-line fill texture is the whole point.
```

### 3. `cross-hatch-emphasis` — 交叉网格强调
Knobs: `fillStyle:cross-hatch (key nodes only), else transparent, roughness:1`
```
Most shapes are hollow charcoal outlines. Only the decision/terminal family is filled
with CROSS-HATCH (two crossing sets of sketch lines, woven-grid look) in a single accent
hue. Emphasis comes from texture density, not from color count.
```

### 4. `blue-accent-decision` — 单一蓝点缀
Knobs: `solid fill on decision family only, rest transparent`
```
All shapes charcoal ink on white, hollow — EXCEPT the decision/control family (diamond,
merge triangle, or-circle, summing) which get a single soft-blue solid fill (#a5d8ff,
outline #1971c2). Color appears only where a choice happens; everything else monochrome.
```

### 5. `coral-minimal` — 单一 hero accent
Knobs: `solid fill on decision only, max whitespace`
```
Minimalist monochrome: charcoal hollow shapes on lots of white — EXCEPT the decision
diamond, drawn slightly bolder with a single warm-coral fill (#ffc9c9, outline #ff8787)
as the one accent. Confident, poster-like restraint, maximal whitespace between cells.
```

### 6. `architect-r0` — 建筑师极简（roughness 0）
Knobs: `roughness:0, fillStyle:solid, roundness:sharp`
```
roughness 0: strokes nearly straight and crisp, yet still clearly hand-drawn (subtle
imperfection). Solid flat pale fills, sharp corners, very tidy — a precise but warm
technical sketch. Charcoal outlines + at most two muted fills.
```

### 7. `cartoonist-r2` — 漫画家松弛（roughness 2）
Knobs: `roughness:2, sw:2, fillStyle:hachure`
```
roughness 2: very wobbly, loose, bouncy outlines, thicker strokes, slightly oversized
corners — playful hand-drawn cartoon energy. Soft pastel HACHURE fills (peach, mint,
lavender, baby-blue rotating across cells). Friendly and lively but still legible.
```

### 8. `blueprint-dashed` — 蓝图虚线
Knobs: `strokeStyle:dashed, strokeColor single blue, fill transparent or light hachure`
```
Monochrome blueprint: every outline a single blue hue (#1971c2) drawn with DASHED stroke
style. Shapes hollow, or filled with very light blue hachure. Calm technical blueprint
feel on white, one uniform dashed line language throughout.
```

### 9. `bold-mono-ink` — 粗墨黑白
Knobs: `strokeWidth:4, strokeColor:#1e1e1e, fill transparent`
```
Pure black ink on white, NO fills, but strokes are EXTRA BOLD and confident (heavy
weight). High-contrast, punchy, poster-like. Every shape a thick decisive hollow outline.
roughness ~1.
```

### 10. `duotone-hachure` — 同色双调
Knobs: `strokeColor dark hue + fillStyle:hachure same hue light`
```
One single hue family only (violet): dark-violet outlines (#7048e8) with light-violet
HACHURE fills (#eadffd) inside every shape. Monochromatic duotone, quiet and cohesive.
roughness ~1; the hachure texture supplies the hand-drawn warmth.
```

### 11. `dotgrid-tidy` — 点格纸密集克制
Knobs: `viewBackgroundColor faint, roughness:1, ≤2 solid accent fills`
```
Faint flat dot-grid background (small evenly spaced dots, no texture). Every symbol crisp
and impeccably tidy, snapped to the grid, perfectly even spacing. Charcoal outlines with
at most TWO faint solid accent fills total (pale blue, pale green) used sparingly.
Restrained engineering-notebook precision, squint-test clean.
```

---

## Restore mapping (gpt sheet → STYLE preset)

| Style | restore signal |
|---|---|
| classic-tricolor | solid fills, 3 semantic hues |
| hachure-classic | `fillStyle:hachure` + 3 hues |
| cross-hatch-emphasis | `cross-hatch` on decisions, else transparent |
| blue-accent-decision | solid fill on diamonds only |
| coral-minimal | single coral fill on diamond |
| architect-r0 | `roughness:0`, sharp, solid |
| cartoonist-r2 | `roughness:2`, `sw:2`, hachure |
| blueprint-dashed | `strokeStyle:dashed`, mono blue |
| bold-mono-ink | `strokeWidth:4`, no fill |
| duotone-hachure | one-hue outline + light hachure |
| dotgrid-tidy | grid bg, ≤2 accents, roughness 1 |

After GPT returns each sheet, extract per-symbol stroke/fill/fillStyle/roughness/
strokeStyle/strokeWidth into the matching preset, then `renderFlowchart(data, style)`
switches any flowchart between them with one argument.
