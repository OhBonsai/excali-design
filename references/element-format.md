# Excalidraw Element Format · Offline Reference

> This is an offline backup of the Excalidraw MCP `read_me`, ensuring you can draw to spec even when the MCP is unavailable.
> Before using `create_view`, if the MCP is available, prefer calling `read_me` live (it may contain the latest palette/examples).

## Common fields of an element

Every Excalidraw element is a JSON object. The minimal usable fields:

```json
{
  "type": "rectangle",
  "x": 100, "y": 100,
  "width": 200, "height": 80,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "strokeStyle": "solid",
  "roughness": 1,
  "roundness": { "type": 3 }
}
```

Full fields (create_view usually fills in defaults, but writing them explicitly gives more control):

| Field | Description | Common values |
|---|---|---|
| `type` | Element type | `rectangle` `ellipse` `diamond` `arrow` `line` `text` `freedraw` `frame` `image` |
| `x` `y` | Top-left coordinate (canvas pixels) | Snap to multiples of 20 (grid) |
| `width` `height` | Size | — |
| `angle` | Rotation in radians | Default 0 |
| `strokeColor` | Stroke color | See palette |
| `backgroundColor` | Fill color | `transparent` or palette |
| `fillStyle` | Fill style | `solid` `hachure` (diagonal lines) `cross-hatch` |
| `strokeWidth` | Line width | `1` (thin) `2` (medium) `4` (thick) |
| `strokeStyle` | Line style | `solid` `dashed` `dotted` |
| `roughness` | Hand-drawn jitter level | `0` (near straight) `1` (default) `2` (very jittery) |
| `roundness` | Rounded corners | `{"type":3}` rounded / `null` square |
| `opacity` | Opacity | 0-100 |
| `strokeSharpness` | Legacy corner field | `sharp` / `round` (old format) |
| `seed` | Hand-drawn random seed | Any integer, determines jitter shape (same seed = same shape; fix it when redrawing/reusing so the shape stays stable) |
| `groupIds` | Array of group ids | Elements in the same group move together |
| `boundElements` | Bound child elements (e.g. text on a box, an arrow connected to a box) | `[{"type":"text","id":"..."},{"type":"arrow","id":"..."}]` |

## Text element (text)

```json
{
  "type": "text", "x": 120, "y": 120,
  "text": "Auth Service",
  "fontSize": 20,
  "fontFamily": 1,
  "textAlign": "left",
  "verticalAlign": "top",
  "strokeColor": "#1e1e1e"
}
```

- `fontFamily`: `1` = Virgil (hand-drawn font, default) · `2` = Normal (Helvetica, formal) · `3` = Code (monospace, technical diagrams)
- `fontSize`: 16 (S) / 20 (M, default) / 28 (L) / 36 (XL)
- Text inside a container: to center text within a box, point the text element's `containerId` at the box id, and register that text in the box's `boundElements`.

## Arrow / line (arrow / line)

```json
{
  "type": "arrow",
  "x": 300, "y": 140,
  "width": 120, "height": 0,
  "points": [[0,0],[120,0]],
  "startBinding": { "elementId": "box-a", "focus": 0, "gap": 4 },
  "endBinding":   { "elementId": "box-b", "focus": 0, "gap": 4 },
  "startArrowhead": null,
  "endArrowhead": "arrow"
}
```

- `points`: an array of polyline points relative to `x,y`. Two points for a straight line, multiple points for a polyline. **≥3 points + `"roundness":{"type":2}` → a smooth curve** through the points.
- `startBinding`/`endBinding`: binding to a box -- the arrow follows automatically when the box moves. `elementId` points at the box id; the bound box must register this arrow in its `boundElements`. Connections in architecture diagrams must always use binding, otherwise the line detaches when you change the layout.
- `startArrowhead` / `endArrowhead`: independent per end. `null` = no head (both null = a plain line). Full enum: `arrow` `triangle` `triangle_outline` `diamond` `diamond_outline` `circle`(legacy `dot`) `circle_outline` `bar` `cardinality_one|many|one_or_many|zero_or_one|zero_or_many|exactly_one` (legacy `crowfoot_*`).
- **Mid-arrow text label**: a `text` child with `containerId` = the arrow id + `verticalAlign:"middle"`, and the arrow's `boundElements` lists `{"type":"text","id":...}`.
- `elbowed:true` → orthogonal (right-angle) routing.
- Data flow direction = arrow direction, kept consistent across the whole diagram (left to right or top to bottom).
- **Arrows are powerful and underused — see `references/arrows.md`** for the full guide (heads / mid-labels / curves / elbow / binding) with copy-paste snippets. svg-export renders all of it.

## Palette (be restrained! whole diagram <= 4 colors)

Excalidraw's official hand-drawn palette (for stroke):

| Semantics | Value | Use |
|---|---|---|
| Ink (primary) | `#1e1e1e` | Default stroke, text, main bodies/boxes |
| Gray | `#868e96` | Secondary/de-emphasized elements, supporting notes |
| Red | `#e03131` | Error flows, alerts, deletion |
| Green | `#2f9e44` | Success flows, additions, healthy |
| Blue | `#1971c2` | Primary data flow, links, emphasis category one |
| Orange | `#f08c00` | Emphasis category two, external dependencies |
| Violet | `#7048e8` | Emphasis category three (use sparingly) |

For fill backgrounds use light, low-saturation variants: `#ffec99` (yellow) `#b2f2bb` (green) `#a5d8ff` (blue) `#ffc9c9` (red) `#eaddd7` (beige) `transparent`.

Rule: colors encode semantics (same category of service = same color), they are not decoration. A single diagram is mostly `#1e1e1e`, with at most 2-3 additional colors to distinguish categories. See `color-system.md` for details.

## create_view input

The `elements` parameter of `create_view` = a JSON string of the array of element objects above. Requirements:
- Valid JSON: no comments, no trailing commas, compact
- Each element has at least `type` `x` `y` (plus `width`/`height` for shapes, `text` for text, `points` for arrows)
- Generate ids yourself (a short string is fine), register bindings in both directions

## Producing a .excalidraw file directly (when MCP is unavailable)

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "excali-design",
  "elements": [ /* same element array as above */ ],
  "appState": { "viewBackgroundColor": "#ffffff", "gridSize": 20 }
}
```

Write it as an `xxx.excalidraw` file; the user can drag it into excalidraw.com to open it.
