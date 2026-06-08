# Architecture Diagram Layout: Generation + Lint (each handles one stage, neither equals "good-looking")

> Two tools, two different jobs, and neither one equals "aesthetics":
> - **Generation** (`arch-layout.mjs`): for **dense-topology** diagrams, use a layout engine to compute coordinates, saving you from manually placing dozens of nodes.
> - **Lint** (`arch-lint.mjs`): a **last-step assistive hint** that only catches mechanical errors the eye easily misses, like "obvious overlap / detachment".
>
> Warning: **Lint is not a quality standard, nor an optimization target.** It measures the "floor" (whether there is invisible overlap / out-of-bounds), but cannot measure the "ceiling" (expressiveness).
> A diagram that passes lint all green may be flat and ugly; a diagram that triggers lint warnings (an information-dense good poster) may be very good.
> **Optimizing a diagram toward "lint all green" = Goodhart** -- it sacrifices the truly important information density / visual hierarchy / semantic zoning.
> Lint all green only means "no mechanical errors", not "this is a good diagram". Whether it is good is still a human judgment (the "taste" of huashu-design).

## Two manually error-prone steps have been programmatized (do not do them by hand)

Drawing architecture diagrams has two things that are bound to go wrong when done by hand, and both have become deterministic tools -- **the agent should not do these two things by hand**:

| Manual error-prone step | Symptom | Programmatized tool |
|---|---|---|
| **Manually placing node coordinates** | overlap, misalignment | `arch-layout.mjs` (dense-topology diagrams, even places the nodes automatically) |
| **Manually estimating edge `points` coordinates** | diagonal lines, routing around the back (flow reversed), crossings, ports crammed together | `arch-connect.mjs` (**any diagram**: you place the boxes, it connects the lines correctly) |

**`arch-connect` is the key**: it turns "edge routing" from eyeballed coordinates into computation -- given boxes plus declared logical connections (A to B), it computes lines that are **orthogonal + face-side entry/exit + evenly distributed ports + ordered by the far end (auto-eliminating crossings) + binding**. This eliminates that entire class of edge bugs that lint catches (`diagonal` / `wrong-attach-side` / `crossings` / `port-*`) **at the source** -- it also applies to poster-type diagrams (you place the nodes by hand, hand the edges to it).

```bash
node scripts/arch-connect.mjs boxes.excalidraw edges.json --out final.excalidraw
# edges.json: [{"from":"mcp","to":"out","label":"...","dashed":false}]
```

> **Rule: the agent never hand-writes the `points` array of an edge when drawing an architecture diagram.** Node placement (requires taste; human / arch-layout) and edge routing (pure geometry; arch-connect) are decoupled -- this is the structural way to eliminate edge bugs, not relying on self-discipline.

**Warning: arch-connect's boundary (an honest disclaimer)**: it does "orthogonal connection between two boxes + face-side + port distribution + non-crossing", but it **does not do obstacle avoidance** -- when another large box sits between source and target, the elbow line will pass through it. Avoidance relies on **layout**: keep connected source/target as adjacent as possible (short straight connection, not crossing content blocks). If you really need complex obstacle routing, go with `arch-layout` fully automatic (elkjs with routing).

### Key correction: the problem is "dirty arrows", not "too many arrows"

> **Short, straight structural arrows connecting adjacent boxes (embody / reads / reuses / uses) are good; keep them.** Do not delete them just because there are a few lines -- deleting them all breaks the relationships (lesson from testing: one version deleted all arrows = garbage).

An arrow problem is always some **specific** dirtiness; fix them one by one, do not delete across the board:

| Dirtiness | Fix (do not delete; change routing/layout) |
|---|---|
| **Routing around the back / crossings / ports crammed at one point** (typical: multiple lines from scattered sources **converging on a single centered target**, like 3 dependencies to Output) | **fan-in routing**: have the N lines enter the **same edge** of the target (if all above, all enter the top edge), **evenly distributed** along that edge **and ordered by the left-right order of the sources** (left source to left point, right source to right point) so they neither route around nor cross. arch-connect does this automatically; when needed, use `toSide` to force them all onto the same edge (see below) |
| **Crossing half the page / passing through a content box** | make source/target adjacent; or this relationship is already expressed by position, so it can be left undrawn |

**Core: dirty arrow -> use arch-connect routing (distribute ports + order) to fix that one line, do not touch the other correct arrows.**

## Choosing a tool: by the nature of the diagram, not defaulting to automatic

| Nature of the diagram | What to do |
|---|---|
| **Dense topology** (service mesh, data flow with dozens of nodes, call chains) -- manual placement is bound to error and bound to cross | **arch-layout automatic generation** (its home turf: the engine guarantees no overlap + minimal crossings) |
| **Poster-type / annotation-heavy** (few boxes, lots of text, deliberate zoning, lists/sub-items inside boxes) -- like this skill's own architecture diagram | **manual composition** (the human sets visual hierarchy / semantic zoning / information density); arch-layout cannot hold "multi-line content inside a box", and auto-layout would flatten a poster into a bare tree |

**Core insight**: auto-layout solves "too many nodes to place"; it **does not solve** the **expression** problem of "a few boxes + lots of annotation + deliberate typesetting". The latter is taste, a human judgment. **In both cases lint only serves as a last-step fallback, and a fallback cannot produce good looks.**

## Engine selection for dense-topology diagrams (when going automatic)

Choose by the "shape" of the diagram, not by preference:

| Shape of the diagram | Use | Why |
|---|---|---|
| **Layered architecture / data flow / call chain (DAG)** | **Layered layout** (Sugiyama: assign ranks -> order within rank to reduce crossings -> coordinate assignment with min-gap). Equivalent to Graphviz `dot` / dagre / ELK | same-layer aligned, equal spacing between layers, no overlap, minimal crossings |
| **Regular grid / table / swimlane** | **Grid / flex model** | the coordinate version of CSS flex/grid |
| **Undirected topology / network / relationship graph** | **force-directed + collision constraint** | suited to a level-less "web"; for layered architecture it is soft and prone to overlap, inferior to layered |

For layered architecture, default to **layered**, do not use force (force is the solution for undirected topology). **But remember: the engine only gives the "correct floor", it cannot give the "ceiling of expression".**

### Implementation: `arch-layout.mjs` (reuses elkjs)

Built in. Declare a component tree, ELK (the pure-JS Eclipse Layout Kernel) computes layered + orthogonal routing + compound nesting, and outputs `.excalidraw`:

```bash
node scripts/arch-layout.mjs spec.json --out architecture.excalidraw --direction RIGHT
node scripts/arch-lint.mjs architecture.excalidraw          # fallback, usually 0 error
```

`spec.json`:
```json
{
  "direction": "RIGHT",
  "groups": [{"id":"data","label":"Data Layer"}],
  "nodes": [
    {"id":"client","label":"Client"},
    {"id":"pg","label":"Postgres","group":"data","color":"#2f9e44","bg":"#b2f2bb"}
  ],
  "edges": [{"from":"client","to":"gw","label":"HTTPS","dashed":false}]
}
```

ELK handles: same-layer alignment / equal spacing between layers / **zero overlap** / minimal crossings / orthogonal routing; `group` becomes a layered background container (automatically wrapping child nodes); edges automatically bind to nodes. **Tested**: after generating the 7-node example above, `arch-lint` reports 0 error.

Dependency: `npm install elkjs` (pure JS, no native). Needed only for auto-layout.

> **Prefer this path for architecture diagrams**: declare spec -> generate -> lint. Hand placement is used only for small diagrams / fine-tuning, and must have lint as a fallback.

## Lint: a last-step assistive hint (not a gate)

For any `.excalidraw`, run it once **before** delivery, **only to catch mechanical errors the eye easily misses**:

```bash
node scripts/arch-lint.mjs <file.excalidraw> [--grid 4] [--colors 4] [--width W --height H] [--json]
```

It detects "invisible obvious problems" -- two boxes overlapping a tiny bit, an arrow floating in space, a misalignment off by a few pixels.
**It cannot detect, and should not be used to judge**: whether this diagram explains the system clearly, whether the hierarchy is right, whether the density is sufficient, whether the zoning is reasonable. Those are for a human to see.

### Rule set (two errors = semantic errors, the rest are warns = hints)

> **The error vs warn boundary = whether it changes the meaning of the diagram**:
> - **error (functional error, changes meaning)**: `overlap` boxes colliding; `wrong-attach-side` arrow routing around the back -> **flow drawn backwards**. The reader will misread the system, must be fixed.
> - **warn (readability, does not change meaning)**: `crossings`, `port-uneven` crammed together, `diagonal` diagonal lines... 连接本身正确, just hard to read. Should be fixed but not fatal.
>
> To judge whether an arrow problem is a must-fix error: **ask "does it draw the connection/direction as a different meaning?"** Drawn backwards / connected wrong = error; merely routing around / crammed / diagonal = warn.
> Note: among readability warns, the **"eliminable"** ones (such as crossings caused by reversed port order) should still be fixed; the truly "unavoidable" ones (a few crossings in a dense diagram) can be let go.

| Rule | Level | Detects what | Physical criterion |
|---|---|---|---|
| **overlap** | error | node-node **partial overlap** (neither contains the other yet they intersect) = placement bug | the two bboxes intersect with area > 0 and `!contains(A,B) && !contains(B,A)` |
| **wrong-attach-side** | **error** | line attaches to the edge "**facing away from the far end**" = routing around the back of the node, **drawing the data flow direction backwards** (most easily introduced by orthogonalization, worse than a diagonal) | actual attach edge = `opposite(the edge facing the far end)` |
| **edge-overshoot** | warn | the line path overshoots the far side of the target box and loops back (overshoot) | the path has a point exceeding the far side of the target bbox > 8px |
| **crossings** | warn | two lines cross (readability down; mostly "reversed port order", eliminable) | line-segment pair truly intersects |
| **arrow-thru** | warn | an arrow passes through a node it is not bound to (line cuts across the box) | line segment intersects node rectangle (Liang-Barsky); containers excluded |
| **arrow-unbound** | warn | arrow endpoint not bound (floating, will detach when layout changes) | `!startBinding && !endBinding` |
| **offgrid** | warn | x/y not snapped to the grid | `x % grid || y % grid` |
| **near-align** | warn | two nodes' edges/centerlines are **almost aligned but not aligned** (the ugliest misalignment) | difference of edge/centerline values is in (0.5, 6]px |
| **uneven-gap** | warn | uneven spacing between adjacent nodes in the same row/column (planned) | spacing variance > threshold |
| ~~**diagonal**~~ | **已移除** | 曾警告斜线段;现已删除——正交/斜线/曲线都是合法选择,按可读性挑,**不为正交而正交**(见 `iterate/layout.md`)。真正的问题(穿框/绕背/交叉)由 arrow-thru / wrong-attach-side / crossings 管 | — |
| **port-stacked** | warn | multiple lines on the same edge crammed at the same point (mass imbalance) | port spacing on the same side < 6px |
| **port-uneven** | warn | multiple connection points on the same side unevenly distributed (should be equidistant) | port gap max/min > 3.5 |
| **port-offcenter** | warn | a side has only one edge yet it does not attach at the midpoint | offset from midpoint > max(18, edge length times 20%) |
| **port-corner** | warn | a connection point sticks to the box corner (should leave a margin) | distance to corner < 8px |
| **container-padding** | warn | a child module inside a container **sticks to the edge** (missing inner padding, the common "no bottom padding") | `container edge - child module bounding-box edge < minPad` (default 12) |
| **color-budget** | warn | deduplicated stroke + fill colors > threshold | `distinctColors > N` (default 4, anti-slop) |
| **oob** | warn | element exceeds the canvas | bbox crosses 0..W / 0..H |

### Aesthetics of lines and connection points (physical criteria)

These rules turn the mature conventions of "how a line/connection point should attach" into geometric checks -- **most easily missed during manual composition, which is exactly where lint earns its keep** (the auto-layout engine ELK satisfies these inherently).

- **Line orthogonality**: lines in technical diagrams go horizontal/vertical + right-angle turns, no diagonals. Diagonals read as "noodle/casual", orthogonal reads as "engineered" (aligned with the implicit grid, parallel segments grouped, crossings are clean 90 degrees). -> `diagonal`
- **"Mass distribution" of connection points** (you can think of it as gravity/balance):
  - **Orientation (now error-level `wrong-attach-side`)**: the line enters/exits from **the edge facing the other party** (top-bottom: parent exits the bottom, child enters the top; left-right: exit right, enter left). **Attaching to the directly opposite edge = routing around the back, flow drawn backwards** -- this is the counterproductive effect most easily introduced when "fixing a diagonal to orthogonal": the line routes around the target box and stabs in from the back. **It is an order of magnitude worse than a diagonal** (a diagonal is just ugly, this is wrong), so it is rated error. Fix: have the line connect orthogonally and directly from the edge "facing the source", do not route around the box.
  - **Centered**: an edge with only one line attached -> attach at the **midpoint** (symmetric, not weighted). -> `port-offcenter`
  - **Even distribution**: an edge with multiple lines attached -> spread **equidistantly** along the edge, do not cram in the middle, do not pile at one point, do not stick to the corner. Even = mass balance, the box does not "tilt". -> `port-stacked` / `port-uneven` / `port-corner`
  - **Barycenter**: a parent node should be horizontally centered on the center of all its child nodes (the "parent at children's barycenter" rule of Sugiyama/Reingold-Tilford). This is currently guaranteed by the layout engine; lint does not strictly test it for now.
- These are all **warn-level hints**: in most cases you should listen, but poster-type diagrams occasionally break the rule deliberately -- human judgment.

### Spacing: padding and margin are both coordinate differences (detectable)

**margin/padding are not abstract aesthetics, they are subtraction of absolute coordinates**, so lint can compute them directly:

- **inner padding = container edge - child module bounding-box edge**: `bottom padding = container.y2 - max(child.y2)`. A child module sticking to the container edge (such as the common "leaves top room for a title but has no bottom padding") -> `container-padding`. Criterion `padding < minPad`. The error lists the **values for all four sides** (such as `top40/right20/bottom2/left20`), making top-heaviness obvious at a glance.
- **outer margin = the gap between adjacent sibling boxes**: `gap = right box.x - left box.x2`. Siblings in the same group should have consistent gap (the planned `uneven-gap`).
- **Rules of thumb**: container inner padding >= 12-16px (the side leaving room for a title can be larger); same-layer sibling gap takes a fixed rhythm value (such as 40). These are all layout parameters, set them at generation time; manual diagrams rely on lint as a fallback.

### Key design

- **Container recognition**: a box that fully encloses >= 1 other node = container (layered background / swimlane). A container **does not participate** in overlap false positives (it inherently contains children), and does not participate in arrow-thru (an arrow passing through a layered background is legal).
- **overlap distinguishes containment vs partial intersection**: a node inside a container = legal; two peers partially overlapping = bug. Only the latter is reported.
- **near-align is heuristic**: for diagrams of "centered, varying-width" icon rows, the left edges will differ by 1-6px (their centerlines align rather than edges), which is acceptable noise -- human judgment.

## How to use it (an assistive hint, not closed-loop optimization)

```
Run once before delivery:
  node scripts/arch-lint.mjs diagram.excalidraw
  |- overlap error -> most likely a real overlap; go look at that coordinate, confirm, then fix
  |- warn -> treat as a reference hint, human judgment on whether to act (many are false positives / irrelevant for poster-type diagrams)
```

**Never change a diagram for the sake of "lint all green"** -- especially do not sacrifice information density / zoning / hierarchy just to clear warns.
Lint warning does not mean the diagram is bad; lint all green does not mean the diagram is good. It only helps you not miss an "invisible obvious overlap".

> Attaches at step 7 "Verify" of the workflow: lint is the **last assistive scan before delivery**, on par with "review it once more with your own eyes", not a replacement for the latter, and certainly not a quality gate.

## Tested: what it is good at (and only that)

`arch-lint` caught 1 real overlap on this skill's hand-placed architecture diagram (r02/r21 ~13%), and caught a 14% overlap between the center card and the champion logo in an NBA bracket -- **this kind of "obvious overlap the eye would miss" is exactly its value**.
But for the same hand-placed diagram, a human looking at it finds it "information-dense, clearly zoned, a good poster"; lint, however, reports a pile of warns. **This precisely shows that lint does not measure good versus bad** -- do not treat it as a referee.
