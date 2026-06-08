# Anti "hand-drawn AI slop"

> Excalidraw has its own "visual lowest common denominator" too. Anti-slop is not aesthetic fussiness; it protects the **readability** and **professional feel** of the diagram on the user's behalf.
> Same logic as huashu-design: an AI's default output = the average of its training corpus = something everyone perceives as "yet another diagram dashed off casually."

## Blacklist (with the "why")

| Element | Why it is slop | When an exception is allowed |
|---|---|---|
| **Rainbow-colored boxes** (one color per box) | The colors encode no information, pure noise; the reader has to work to figure out "what do these colors mean" | Legitimate when color **encodes semantics** (one color per category) |
| **All `roughness: 2`** jittered to bits | Excessive hand-drawn = cheap, not serious; a disaster for a formal architecture diagram | lo-fi sketch / approachable scenarios can use 1; conceptual doodles can use 2 |
| **Dirty arrows** (routed around the back / crossing into a web / spanning half a page through content boxes / a pile converging tangled onto one point) | The problem is "dirty arrows," not "too many arrows." Short, straight structural arrows connecting adjacent boxes (embody/reads/uses) are completely fine | **The fix is routing, not deletion**: use arch-connect to route (orthogonal + distributed ports + crossing removal), or place source/target adjacent. **Do not delete arrows just because there are a few lines** -- delete them all and you sever the relationships |
| **Stacked arrows / full dependency lines** (an architecture diagram drawing every dependency as a line -> lines on lines, crammed into parallel bundles) | **Better to have no arrows than stacked arrows.** If every dependency in a layered architecture is drawn out, under the squint test it blurs into a "barcode" noise zone, and the key points become unreadable. **Learn to omit and to use whitespace** | **Architecture/topology types only**: draw only the **entry trunk + one core business hero**, and express the rest of the dependencies (service to data, service to MQ, registry/discovery, observability collection) via **layered position + whitespace + a one-line note**. Criterion: will this line stack with / crowd other lines? If yes -> delete it, replace with position and whitespace. Warning: this is not "delete them all" (delete them all = relationships severed, see previous row); it is reducing down to just the trunk + hero. **The arrows in sequence diagrams / flowcharts / state machines are the body of the diagram itself; this rule does not apply** |
| **For dodging diagonals, forcing right angles** (orthogonalizing every cross-layer line that could connect directly on a diagonal) | Diagonals in an architecture diagram **are not slop**: the real enemy is "stacking/passing through boxes," not "diagonal." Forcing everything orthogonal instead compresses cross-layer lines into parallel bundles (barcode) | Architecture diagrams may **connect directly on a diagonal** (center to center, clipped to the bounding box, fanned out by angle), as long as they do not stack and do not pass through unrelated boxes; `arch-lint` 已移除 diagonal 规则:正交/斜线/曲线都合法,按可读性选 |
| **An emoji/icon per node** | iconography slop, icons become decoration | Only attach them to nodes that need their type distinguished |
| **Unicode characters posing as icons** (using `✓ ✗ ★ ● ■ ▲ → ↑↓ ⚙ 🔍 📁` etc. as icons) | **Absolutely do not.** These glyphs clash with the hand-drawn aesthetic and render inconsistently across fonts (often turning into tofu boxes); they are the most conspicuous slop. **Model diagrams are the most prone to this shortcut -- which is why this rule is a hard code gate, not a suggestion** | **No exceptions.** If you have an icon set, use the icon set / `data-lib`; **when you do not, use a hand-drawn solid-color small square / small circle / small diamond** (`data-icon`) instead. Do not reach for unicode |

> **This rule is code-enforced** (relying on structure, not self-discipline): when `html-to-excalidraw.mjs` detects that text contains icon characters, **the strict build fails by default (exit code 2)**; `arch-lint.mjs` lists it as an **error**. That is, if you use `✓/→/★/emoji` as icons, the tooling stops you outright, forcing you to switch to `data-lib` / `data-icon`. Only if you really must keep them (very rare cases) add `--loose`.
| **Centered, scattered, unaligned** | The single biggest source of an amateur feel | None -- always align to the grid |
| **Hand-drawn font with serious architecture** | The aesthetics clash | Use Virgil for concept diagrams; switch to Normal/Code for serious architecture |
| **Drawing every component** | box slop, information overload | None -- every box must earn its place |
| **Fake data posing as real content** (made-up metric numbers, fake usernames) | data slop, misleading | None -- use an honest placeholder |
| **Solid lines by default for uncertain relationships** | Drawing speculation as certainty, misleading decisions | For uncertainty use a dashed line + "?" |
| **Assembling formulas from drawlib blocks / hand-drawn small boxes** | Hand-drawn formula blocks blur on scaling, subscripts/superscripts misalign, math symbols render inconsistently | **Always render LaTeX to inline SVG**: `scripts/render-formula.mjs` (MathJax TeX to SVG, requires `npm i mathjax-full`) -> image element + dataURL -> playwright export. No exceptions |

## What to do positively

- Use: color encodes semantics, the whole diagram <= 3-4 colors, body in black/gray
- Use: default `roughness: 1`, drop to `0` for serious architecture diagrams
- Use: data flow is unidirectional (left to right / top to bottom), reducing crossings
- Use: snap elements to the 20px grid, align within a layer
- Use: reuse drawlib rather than hand-drawing (principle #2)
- Use: one "screenshot-worthy" detail (clear layering, a pleasing alignment rhythm), the rest restrained
- Use: honest placeholders: `[data pending]`, dashed line + `?`
- Use: **architecture diagrams: subtract arrows** -- trunk + one core hero, express the rest of the dependencies via layering + whitespace + notes; better to omit than to stack
- Use: **whitespace is design**: leave enough gap between layers, let the layering and focus surface on their own, instead of filling up by drawing more lines

## Decision quick reference

- Want to give each box a different color? -> Most likely do not; ask "what does this color encode"
- Want to add an emoji icon? -> Only add it when distinguishing node types
- Want to use characters like `✓/★/→/🔍` as icons? -> **Never.** Use an icon set / `data-lib`; if you have none, use `data-icon` (hand-drawn small square / circle / diamond)
- Want to draw this component too? -> First ask "would the diagram get worse if I deleted it"; if not, delete it
- Want to connect this dependency too? -> (architecture diagram) First ask "will it stack with other lines"; if yes, do not connect it, express it via layered position
- Want to make up a number so the card is not empty? -> Do not make it up, leave a placeholder
- Feel like "a bit more jitter would be more hand-drawn"? -> That is usually a sign of slop
- Should the cross-layer line be forced into a right angle? -> (architecture diagram) No need; a direct diagonal is fine as long as it does not stack and does not pass through boxes
