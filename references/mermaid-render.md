# Mermaid template-render system (overview)

The skill renders five Mermaid diagram types through **dedicated template renderers** instead
of the generic `mermaid-to-excalidraw.mjs`. Each follows the same method
(`references/render-method.md`): Mermaid → IR → layout → routing → role/shape → style preset →
hand-drawn Excalidraw. This page is the index; per-type detail is in the linked references.

## Status by type

| Type | Renderer | Parser | Reference | Status |
|---|---|---|---|---|
| flowchart | `render-flowchart.mjs` | `mermaid-to-case.mjs` | `references/flowchart.md` | ✅ template |
| sequence | `render-sequence.mjs` | `mermaid-sequence.mjs` | `references/sequence.md` | ✅ template |
| state | `render-state.mjs` | `mermaid-state.mjs` | `references/state.md` | ✅ template (reuses flow layout) |
| class | `render-class.mjs` | `mermaid-class.mjs` | `references/class.md` | ✅ template (reuses flow layout) |
| ER | `render-er.mjs` | `mermaid-er.mjs` | `references/er.md` | ✅ template (reuses flow layout) |
| gantt | `render-gantt.mjs` | `mermaid-gantt.mjs` | `references/gantt.md` | ✅ template (bar-on-time-axis, faithful) |
| mindmap | `render-mindmap.mjs` | `mermaid-mindmap.mjs` | `references/mindmap.md` | ✅ template (logical/radial 双布局 + taper 枝 + 图标 + boundary/summary/link/note) |
| pie | — | — | `references/mermaid.md` | ⬜ chart-like, still generic path |

Each type also ships: `scripts/build-<type>-components.mjs` (regenerates the component sheet
into `assets/mermaid-components/<type>-components.png`), `prompts/<type>-styles.md` (gpt-image
style prompts), `scripts/test-<type>.mjs`, and `examples/<type>/cases/*.mmd`. All component
reference sheets live under `assets/mermaid-components/` (gpt-image style explorations in its
`style-explorations/` subfolder) — never at repo root.

## One command per type

```
node scripts/render-flowchart.mjs diagram.mmd out.excalidraw [style]
node scripts/render-sequence.mjs  diagram.mmd out.excalidraw [style]
node scripts/render-state.mjs     diagram.mmd out.excalidraw [style]
node scripts/render-class.mjs     diagram.mmd out.excalidraw [style]
node scripts/render-er.mjs        diagram.mmd out.excalidraw [style]
node scripts/render-gantt.mjs     diagram.mmd out.excalidraw [style]
node scripts/render-mindmap.mjs   diagram.mmd out.excalidraw [style] [logical|radial]
```

Input auto-detects Mermaid vs IR JSON. Styles (all types): `classic-tricolor` ·
`hachure-classic` · `pastel-journal` · `duotone-hachure`. All map onto Excalidraw-reproducible
knobs (`fillStyle` / `roughness` / `strokeStyle` / `strokeWidth`); UML/crowfoot markers use
**native Excalidraw arrowheads** (`startArrowhead`/`endArrowhead` enum), which svg-export now
renders in full — see `references/arrows.md`.

## Shared engine vs per-type

- **Shared (reused across types):** layered layout (rank + barycenter + relaxation), orthogonal
  router with off-line labels + back-edge corridors, the `STYLE` preset mechanism, the render
  primitives (R/Dm/El/Ln/Ar/T), the materials pipeline (component sheet → gpt-image → restore).
- **Per-type (rewritten each):** the parser (`mermaid-<type>.mjs`), the node vocabulary/shapes,
  and any non-graph layout (sequence = actor-column + time-axis; the rest reuse the graph layout).

## Relation to drawlib

The template renderers are **self-contained** — they draw Excalidraw primitives directly and do
**not** depend on `drawlib/`. drawlib (the 11 component libraries) is unchanged and orthogonal;
it serves the architecture/prototype paths, not the Mermaid template path. The Mermaid component
sheets (`assets/mermaid-components/*-components.png`) are separate reference assets used only as
gpt-image style anchors.

## Local test (no model, fast)

Render every type's cases in one go:

```
node scripts/test-mermaid.mjs                 # all types, classic-tricolor
node scripts/test-mermaid.mjs all             # all types, every style (per-type montages)
```

Or per type: `node scripts/test-<type>.mjs <case> [style|all]` /
`node scripts/test-<type>.mjs all <style>`. Outputs to `examples/<type>/out/`. Always finish
with the squint test (`references/verification.md`).

## Eval A/B: v0.5.0 (old generic path) ↔ v0.6.0 (new template path)

The `method` matrix compares skill versions with the model fixed (qwen3.7-max). `v0.5.0` is the
pre-template tag; `v0.6.0` = current worktree (registered in `eval/variants.json`). Entry point
stays `node eval/run.mjs method`; pick the cases with `--only`. The 12 Mermaid cases the new
renderers cover (sequence ×3, state ×2, flowchart ×4, ER, class, gantt):

```
node eval/run.mjs method \
  --only "FLOW01-order-seq FLOW02-https-seq FLOW03-oauth-seq FLOW04-order-state FLOW05-tcp-state FLOW06-approval FLOW07-incident-tree FLOW08-saga FLOW09-ratelimit MODEL01-order-er MODEL02-uml-class CHART05-gantt" \
  --cols "v0.5.0 v0.6.0" --conc 6

node eval/report.mjs method && open eval/report-method.html
```

`report-method.html` shows v0.5.0 (old) and v0.6.0 (new) side by side per case — the before/after
of moving these types onto the template path. (pie excluded: still the generic path.) `v0.5.0` columns for the FLOW cases already exist from earlier runs; re-running only
`--cols "v0.6.0"` regenerates just the new column if you want to save model calls.
