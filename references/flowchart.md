# Flowchart rendering (template path)

Flowcharts have their own renderer, separate from the generic `mermaid-to-excalidraw.mjs`.
It takes structured flow data (or Mermaid flowchart syntax), runs a real **layered layout +
orthogonal router + role→shape→color mapping + style preset**, and emits hand-drawn
Excalidraw. Use this for any flowchart; it is more reliable and better-looking than the
generic Mermaid path.

## One command

```
node scripts/render-flowchart.mjs <input> <out.excalidraw> [style]
```

`<input>` is either a Mermaid flowchart (`.mmd`, or any text starting with `flowchart`/`graph`)
or a `case.json` (the internal data model). Mermaid is auto-detected and parsed by
`scripts/mermaid-to-case.mjs`.

## Styles (Excalidraw-reproducible presets)

`classic-tricolor` (solid semantic fills) · `hachure-classic` (sketch diagonal fills) ·
`pastel-journal` (soft category fills on cream paper, with legend) · `duotone-hachure`
(single-hue). All map onto real Excalidraw knobs (`fillStyle` / `roughness` / `strokeStyle` /
`strokeWidth`), so every output can be hand-edited. See `prompts/flowchart-styles.md` for the
full style catalog and the gpt-image prompts that seed new presets.

## What it does automatically

- **Layout** — layered ranks (longest-path), barycenter ordering to reduce crossings,
  coordinate relaxation to align the main spine. `direction: TD` or `LR`.
- **Routing** — orthogonal elbows, branch labels placed off the line, feedback loops
  (back-edges) detected and routed around the spanned region, arrowheads tucked under nodes.
- **role → shape + color** — node `type` picks the shape and the semantic color:
  `start`/`end`→terminator, `process`→rectangle, `decision`→diamond, `io`→parallelogram,
  `data`→cylinder, `document`→wave-bottom, `manual`→trapezoid, `preparation`→hexagon,
  `subroutine`→barred rectangle, `connector`→small circle.
- **swimlanes + legend** — a Mermaid `subgraph` becomes a vertical lane (dashed dividers +
  lane header); `legend:true` (auto-set when lanes exist) draws a category legend.

## Mermaid shape → type mapping

`([..])` terminator · `[..]` process · `(..)` process(rounded) · `{..}` decision ·
`[/../]` `[\..\]` io · `[/..\]` `[\../]` manual · `[(..)]` data · `[[..]]` subroutine ·
`{{..}}` preparation · `((..))` connector · `>..]` document. Edges: `-->` `---` `-.->` `==>`,
labels via `-->|Yes|` or `A -- Yes --> B`. `<br/>` → line break. `subgraph NAME ... end` → lane.

## case.json data model (when not using Mermaid)

```json
{ "direction":"TD", "style":"pastel-journal", "legend":true,
  "lanes":["INPUT","PROCESS","OUTPUT"],
  "nodes":[{"id":"s","label":"Start","type":"start","lane":"INPUT"}],
  "edges":[{"from":"s","to":"a","label":"Yes"}] }
```

## Testing / picking cases

Curated cases live in `examples/flowchart/cases/*.mmd`
(linear, branch, loop, lr-loop, swimlane, shapes, dense).

```
node scripts/test-flowchart.mjs                  # list cases + styles
node scripts/test-flowchart.mjs loop pastel-journal
node scripts/test-flowchart.mjs swimlane all     # one case, every style (montage)
node scripts/test-flowchart.mjs all hachure-classic   # every case, one style (montage)
```

Outputs to `examples/flowchart/out/`. After rendering, run the squint test (`references/verification.md`).
