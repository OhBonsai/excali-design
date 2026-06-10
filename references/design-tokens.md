# Design Tokens + HTML to Excalidraw Downgrade Mapping

> For the parts where styling can be made explicit, **first borrow the discipline of huashu-design**, fix them into a set of tokens, and reuse them across the whole diagram -- consistency comes from structure, not self-discipline.
> But Excalidraw is **hand-drawn**: many CSS tokens (gradients/shadows/precise fonts/font weights) **cannot be translated literally**, and during conversion must be **downgraded/replaced with hand-drawn equivalents**.
> **Rule: HTML only handles "layout + semantic structure", not the final look; when converting to Excalidraw, always apply the hand-drawn style. The output must read as a hand-drawn diagram, not a flat web-UI screenshot.**

## 1. Tokens (fix once before drawing, reuse across the whole diagram)

Borrow the restraint of huashu-design + the discrete palette of Excalidraw:

**spacing** (all multiples of 8, finally snapped to the 20px grid): `8 / 16 / 24 / 40 / 64`. Container inner padding >= 16; same-layer sibling gap takes a fixed value (such as 40).

**type scale** (Excalidraw `fontSize`):
| Role | px | Use |
|---|---|---|
| caption | 13 | annotations/legends/de-emphasized |
| body | 15 | body text/members/labels |
| label | 16 | node names/field names |
| subhead | 20 | block titles |
| title | 26 | diagram title |
| hero | 34+ | main title/focus number |
> Do not pile on font sizes endlessly -- 3-4 levels are enough.

**color roles** (<= 4 colors across the whole diagram, see `color-system.md`): `ink #1e1e1e` / `gray #868e96` / `bg #fafaf6 or #fff` / one accent running through the protagonist + semantic colors (blue `#1971c2` main path, green `#2f9e44` success, red `#e03131` alert, orange `#f08c00` external), each with a light fill. **Any hex is always snapped to the nearest color in this set.**

**font** (Excalidraw has only 3): `Virgil` (fontFamily 1, hand-drawn -- default for concepts/prototypes) / `Normal` (2, Helvetica family -- serious architecture) / `Code` (3, monospace -- data/code/class members).

**stroke + corner radius + roughness**: strokeWidth `2` (main) / `1` (divider lines); roundness `{type:3}` (cards/nodes) or `null` (serious/technical); **roughness `1` (hand-drawn default)**, formal architecture diagrams may use `0`.

## 2. Why go through an HTML sketch (layout engine)

Grid/card/flow-type diagrams (prototypes, kanban, posters) **have no layout engine like elkjs**, and manually computing coordinates is bound to fail. HTML/CSS is itself a mature layout engine made for this kind of content:

```
Write semantic HTML (div/text/color blocks + flex/grid/padding/gap, using the tokens above)
  -> the browser computes each element's getBoundingClientRect (precise position/alignment/wrapping, for free)
  -> translate element by element into Excalidraw elements + grouping (apply hand-drawn style, downgrade CSS)
  -> hand the edges to arch-connect
```

Same principle as arch-layout: **declare structure / let the engine compute positions / do not place by hand**. Graph-theory types use elkjs, grid types use the browser CSS.

**Implemented**: `scripts/html-to-excalidraw.mjs`.
```bash
node scripts/html-to-excalidraw.mjs diagram.html --out diagram.excalidraw
```
Add `data-id="xxx"` to boxes that need edges (preserved as the Excalidraw element id) -> after conversion, use `arch-connect` + edges.json to connect the edges.
The browser computes the layout + automatically applies the hand-drawn style (roughness) + downgrades CSS (gradients/shadows dropped, fonts downgraded to Virgil/Normal/Code, any hex snapped to the palette, border-radius:50% to ellipse). Use the color-role hex directly in CSS; snapping is an identity.

## 3. CSS token to Excalidraw downgrade / replacement mapping (core)

| CSS / HTML | to Excalidraw | downgrade / hand-drawn note |
|---|---|---|
| `display:flex/grid` + `gap/padding/margin` | the element's `x/y/width/height` = the rect the browser computed | **copy the layout directly** -- this is the entire point of using HTML |
| `<div>` pure background color / color block | `rectangle`, `backgroundColor`=that color, `fillStyle:solid` | literal translation |
| `<div>` border / border-radius | `strokeColor`=border color; `roundness:{type:3}` if radius>0, otherwise `null` | -- |
| `background: linear-gradient(...)` / mesh | **drop the gradient, take the main color as `solid`** | gradients are anti-slop; hand-drawn has no gradients |
| `box-shadow` / `filter: blur` / glassmorphism | **discard** | hand-drawn uses no shadows/glass; hierarchy relies on **position + whitespace + font size** |
| text node | `text` element, `fontSize`=mapped type scale | -- |
| `font-family` (Inter/SF/any) | **downgrade to 1 of 3**: serious to Normal(2), concept/prototype to Virgil(1), data/code to Code(3) | **force the hand-drawn font, do not keep the original font** |
| `font-weight: bold` | Excalidraw has **no font weight** -> use **larger font size / Normal font / ink color** to express emphasis | not relying on font weight, on the hierarchy of font size + color |
| `color` / any hex | **snap to the nearest color role**, hold to <= 4 colors | any color -> downgrade to the palette |
| `opacity` | `opacity` 0-100 | literal translation |
| `<img>` / `<svg>` | `image` element (+ `files` dataURL) | translate real images literally; do not draw shapes with CSS |
| `hover` / `transition` / `animation` / `:active` | **drop all** (static diagram) | this skill only does static |
| box to box line | **do not draw in HTML**, hand to `arch-connect` | place node HTML, **edges always go to arch-connect** |
| `text-align` / `line-height` | for text use **Range to measure the actual rendered box** (including padding / vertical centering), not the top of the element box | otherwise text in a padded input box sticks to the top, not centered |
| `<div data-chart="pie" data-values="A:40,B:30">` | **component**: convert to a real sector (closed polyline), not an ordinary box | CSS cannot draw a real pie chart (conic-gradient is untranslatable) -> use a deterministic component to fill in |

## 4. Deterministic Components -- what HTML cannot express, fill with a component

CSS can do layout, but some visuals **cannot be drawn or cannot be translated accurately** (a real pie chart, badges, mini line charts...). These do not rely on the large model placing coordinates by hand, but are settled into **deterministic components**: write a declarative placeholder `<div data-chart="...">` in HTML, and the converter generates hand-drawn elements with a fixed algorithm. **Deterministic token + deterministic component = raise the quality floor; the model is only responsible for "where to put it, whether to put it", not for "whether it is drawn accurately".**

**Two paths; prefer reusing drawlib (your library has ~402 ready-made pieces, do not draw from scratch):**

**A. `data-lib="library:index"` -- directly instantiate a ready-made drawlib component** (a refined hand-drawn finished piece, used as a placeholder). Any library, any component; the converter automatically scales it to fit the box + centers it + regenerates ids:
```html
<div data-lib="excali-chart:0"></div>       <!-- Bar chart placeholder -->
<div data-lib="excali-chart:31"></div>      <!-- Radar -->
<div data-lib="excali-ui:3"></div>  <!-- any UI control -->
```
For indices see `drawlib-catalog.md` (excali-chart:28=Pie, 29=Donut, 8=Line...). **Use drawlib as an HTML component tag.**

**B. `data-chart="..." data-values="..."` -- data-driven deterministic generation** (use when it must reflect real numbers):

| ctype | HTML declaration | generates |
|---|---|---|
| `pie` | `data-chart="pie" data-values="Digital:40,Apparel:30,Food:18"` | real sectors (arc closed to the center as a closed polyline) |
| `donut` | `data-chart="donut" data-values="..."` | a holed ring sector (annulus) |
| `bar` | `data-chart="bar" data-values="App:130,MiniApp:90,H5:60"` | proportional vertical bars, height proportional to value |
| `line` | `data-chart="line" data-values="1:30,2:45,..."` | mini line chart (value to y) |

All apply color-role rotation + light fill + roughness hand-drawn. **Real numbers -> B; just "there is a chart here" -> A (better-looking).**

**C. `data-icon="square|circle|diamond"` (+ `data-color`) -- icon placeholder. Rule: never use Unicode characters as icons**:

```html
<div data-icon="circle" data-color="green" style="width:20px;height:20px"></div>
```
Converts to a **hand-drawn solid small square/circle/diamond** (`data-color` takes ink/gray/blue/green/red/orange/purple or any hex, snapped to the palette). **Rule (see `anti-slop.md`): never use marks like check, cross, star, filled-dot, filled-square, triangle, arrows, up/down, gear, magnifier as fake icons** -- the temperament clashes, cross-font rendering is inconsistent, and it is the most conspicuous slop. If you have an icon set / drawlib, use `data-lib`; if not, use `data-icon`. When the converter detects icon characters inside text it will **warn**.

Edges are never drawn in HTML -> `arch-connect`; only primitives/icons use components. Same principle: "declare structure, let the engine produce the shape".

## 5. Required after conversion: model squint review (LLM-in-the-loop, not optional)

**html to excalidraw is not enough with pure logic alone.** The converter faithfully translates HTML, but cannot translate "whether it should be a pie chart", "whether the arrows are messy", "whether the focus is right" -- these are only known by **showing the rendered diagram to the model**. So once you have the `.excalidraw`, you **must**:

```
1. node scripts/svg-export.mjs diagram.excalidraw --png   # default squint renderer: headless, no chromium (if no resvg, look at the .svg)
2. The model reads this PNG/SVG (squint test), checking item by item:
   - Focus/grouping/hierarchy: looking blurry, are the protagonist and zones still recognizable?
   - Text: any sticking to the edge / not centered / overflowing? (-> Range not measured right / container too small)
   - Lines: clean and non-crossing, entering from the facing side (orthogonal / diagonal / curved are all fine — no orthogonality requirement)? Any darting around the back? (-> change fromSide/toSide and reconnect)
   - Primitives: pie chart is a pie chart, bar is a bar, not "line-blocks"? (-> should use a component)
   - Hand-drawn style: no gradients/shadows, fonts only Virgil/Normal/Code, <= 4 colors?
3. If there are problems -> change HTML / edges / component -> regenerate -> look again. Iterate until it passes.
```

Mechanical lint (arch-lint) only checks geometric errors, **it cannot judge good versus bad**; the squint review is the round that the large model adds, and it cannot be skipped.

## 6. Post-conversion self-check list (go through item by item while squinting)

- [ ] No gradients / shadows / glassmorphism (all downgraded away)
- [ ] Fonts only Virgil/Normal/Code, no Inter/SF kept
- [ ] <= 4 colors across the whole diagram, all from the color roles
- [ ] roughness 1 (or 0 for formal diagrams), elements snapped to the grid
- [ ] Text is both vertically/horizontally where it should be (Range-measured, not sticking to the box top)
- [ ] Inter-box lines are programmatically routed (arch-connect or a geometric connector), not hand-estimated / HTML pseudo-connections; style is free (orthogonal / diagonal / curved); no back-routing or through-box darting
- [ ] Charts are real primitives (pie/bar), not assembled from color blocks
- [ ] **Squint test**: looking blurry, focus and grouping are still recognizable; it reads as a hand-drawn diagram, not a web screenshot
