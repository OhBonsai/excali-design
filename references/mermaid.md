# Mermaid to Excalidraw Hand-drawn Style

> The user gives Mermaid (or the diagram to be drawn is itself a Mermaid-supported type) -> `scripts/mermaid-to-excalidraw.mjs` converts it by type into hand-drawn `.excalidraw`.
> **Agents are fluent in writing Mermaid**, so the common usage is: the agent writes Mermaid first -> calls the script to convert to hand-drawn style (using Mermaid as the intermediate representation).

## Usage

```bash
node scripts/mermaid-to-excalidraw.mjs diagram.mmd --out diagram.excalidraw
node scripts/mermaid-to-excalidraw.mjs --text "flowchart TD; A-->B{ok?}; B-->|yes|C"
```

Dependencies: Node + Playwright + chromium (imports mermaid/excalidraw from CDN, no need to install them via npm).

## Type dispatch (the script judges automatically by the first-line keyword)

| Mermaid type | How it converts | Native hand-drawn? |
|---|---|---|
| **flowchart / graph** | Tier 1: official `@excalidraw/mermaid-to-excalidraw` | Yes, native hand-drawn elements |
| **sequenceDiagram** | Tier 1: official library | Yes, native hand-drawn elements |
| **classDiagram** | getData() (label+members+methods) -> class-box renderer + elkjs | Yes, native hand-drawn (header + separator + attributes + methods) |
| **stateDiagram** | Tier 2: mermaid `getData()` -> arch-layout | Yes, native hand-drawn elements |
| **erDiagram** | Tier 2: same as above | Yes (getData driven) |
| **C4 / mindmap** | Tier 2: try getData -> arch-layout, fall back to image on failure | Yes / fallback |
| **gantt** | `getTasks()` -> task rows + time bars + date axis | Yes, native hand-drawn (section colors, time scaling) |
| **pie** | node regex parsing (no browser needed) -> closed-polyline sectors + legend | Yes, native hand-drawn (borrows the sector technique from drawlib excali-chart) |
| other (timeline/gitGraph/xychart/...) | the official library degrades to an embedded **SVG image** | No, not native hand-drawn |

## Two conversion paths

**Tier 1 - official library** (flowchart / sequence / class):
`parseMermaidToExcalidraw(src)` -> skeleton -> `convertToExcalidrawElements` -> native hand-drawn elements. Maintained by Excalidraw officially, the same as "Mermaid to Excalidraw" on excalidraw.com.

**Tier 2 - getData to arch-layout** (state / er / c4 / mindmap):
The official library only pastes an SVG image (not hand-drawn) for these. This skill takes a different route: mermaid `db.getData()` extracts `{nodes, edges}` (mermaid 11 unified rendering data) -> maps to arch-layout's `{nodes, edges, groups}` -> `arch-layout.mjs` (elkjs) computes a layered + orthogonal layout -> hand-drawn `.excalidraw`. **Composite states/subgraphs (isGroup) -> containers.** This is exactly arch-layout's home turf.

## Limitations (stated honestly)

- **Chart types (timeline/gitGraph/xychart, etc.) are not graph-theory structures**, so getData -> arch-layout does not apply; each needs a **dedicated renderer**: extract data from that type -> draw it custom (rows/bars/sectors). This is per-type incremental development, **not a lack of assets**.
- **The value of drawlib excali-chart**: its chart items (Pie/Donut/Bar...) are **static and fixed**, do not consume data -> they cannot be filled directly; but they **demonstrate the construction technique** (e.g. a sector = a closed `line` polygon approximating an arc + fill), and you generate them programmatically from data by following the same approach. That is exactly how pie is done.
- For chart types without a dedicated renderer yet, the official library temporarily degrades to an SVG image (usable, not editable, not hand-drawn).
- The image-fallback `.excalidraw` contains an `image` element + `files` (dataURL); to export PNG/SVG use `excalidraw-to-image.mjs` (which already supports passing files).
- Tier 2 edges are orthogonally routed by elkjs/arch-layout; labels on parallel edges (such as a state machine A <-> B) may be slightly cramped, and can be nudged manually.

## Place in the workflow

In a drawing task, if the target diagram is a Mermaid-supported type with a clear structure (flowchart/sequence/class/state/ER, etc.), **prefer having the agent write Mermaid -> convert to hand-drawn style** -- it is faster and less error-prone than placing elements by hand. Complex custom architecture posters still go through manual composition + arch-connect.
