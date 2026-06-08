# Software Architecture Diagram Workflow

> Draw system architecture / service topology / data flow / sequence / deployment / information architecture diagrams.
> Core: **first extract the real structure from code/docs (Principle #0) -> choose abstraction level -> single-direction data-flow layout -> semantic color.**

## 1. Extract the real structure (Principle #0, most important)

Before drawing a **real system**, extract the structure from the assets first; do not guess:
- `docker-compose.yml` / `k8s/*.yaml` -> service list + dependencies + ports
- module/package directories (`src/` `services/` `packages/`) -> component boundaries
- `package.json` / `go.mod` / `pom.xml` -> tech stack, external dependencies
- `README` / existing architecture docs / ADR -> design intent
- public systems -> `WebSearch` the official architecture docs

Write what you extract into `system-facts.md`: service list, dependency edges, data-flow direction, tech stack, external systems. **The diagram grows out of this fact sheet.**

## 2. Choose the abstraction level (C4 mindset)

One diagram expresses **one level**; do not mix:

| Level | What it draws | Node granularity |
|---|---|---|
| **Context** | system + external users/systems | the whole system is one box |
| **Container** | deployable units (service/DB/queue/frontend) | one box per service (most common) |
| **Component** | modules inside a single service | class/module level |
| **Deployment topology** | physical/cloud resources (VPC/node/region) | infrastructure |

When in doubt, default to **Container level** -- it aligns best with engineering. Draw only one level at a time; for detail, produce a separate drill-down diagram.

## 3. Layout: single-direction data flow (anti spaghetti diagram)

- **Fix the main data-flow direction**: left to right (request path) or top to bottom (layered). Consistent across the whole diagram.
- **Layered background**: use large light-colored `area` boxes to enclose layers (access layer/service layer/data layer), placing nodes inside the layers.
- **Reduce arrow crossings**: align nodes within the same layer, keep cross-layer edges as parallel as possible; use routing points where crossings are unavoidable.
- **External dependencies** go to the edges, connected with dashed lines (`strokeStyle: dashed`) to distinguish internal/external.
- Grid alignment (20px), nodes in the same layer aligned on y and evenly spaced.

## 4. Nodes and icons

- node = rectangle (service) / cylinder shape (DB, using ellipse+line or the excali-tech library) / diamond (decision/routing)
- nodes that need to distinguish **type** get an `excali-tech` library icon (library 5); pure logic boxes do not (anti-slop)
- each node: type icon (optional) + name + a one-line tech-stack annotation (e.g. "Auth Service - Go")
- actor/user uses `excali-person`

## 5. Edge semantics + subtraction (the most important trade-off in architecture diagrams)

> **Rule: better to have no arrows than overlapping arrows. Architecture diagrams must learn omission and whitespace.**
> Drawing every dependency as a line = spaghetti diagram, which blurs into a "barcode" under the squint test. Readers understand "upper layer calls lower layer" from **layered position** alone; not every line is needed.

- **Draw only the necessary arrows**: (1) the main entry request trunk (user -> CDN -> gateway -> service), (2) **one core business hero path** (e.g. place order -> pay -> payment channel). All other dependencies (service -> data, service -> MQ, service discovery, observability collection) **are omitted entirely**, expressed via layers + whitespace + a one-line note ("each service reads/writes the data layer below; lines omitted").
- **Criterion**: will a given line overlap or bunch up with other lines? -> Delete it, replace with position and whitespace. Warning: but do not delete everything (deleting all = all relationships severed); reduce to just the trunk + hero.
- **Diagonals are acceptable**: cross-layer lines in architecture diagrams may be **drawn as direct diagonals** (center to center, clipped to the box border, fanned out by angle); there is no need to force right angles. The real enemy is overlap/passing-through-boxes, not diagonals. Forcing full orthogonality instead flattens everything into a parallel bundle. arch-lint no longer flags diagonal (rule removed); orthogonal / diagonal / curved are all valid — choose by readability.
- Line-type encoding: solid line = synchronous call, dashed = asynchronous/event, dotted = optional/weak dependency
- Color encoding: main path `#1971c2`, error/degradation path `#e03131`, the rest `#1e1e1e`
- Edges **must be bound** to nodes (element-format.md) so layout changes do not detach them
- Add labels only to key edges; do not label every one (noise)
- **Whitespace as design**: leave ample gaps between layers (~80px) so the layering and focus surface on their own.

> Warning: This section governs **architecture/topology diagrams only**. The arrows in sequence diagrams / flowcharts / state machines are the substance of the diagram and cannot be omitted (see Section 7).

## 6. Color (semantic encoding, see color-system.md)

Color by **service category**, not by aesthetics: e.g. "frontend = blue, backend = black, data = green, external = gray". The whole diagram uses <= 4 colors. Background layers use very light fills to distinguish, without stealing attention from nodes.

## 7. Sequence diagram / flowchart special cases

- **Sequence diagram**: actors/services in a row across the top, each dropping a vertical lifeline (line); messages are horizontal arrows arranged top to bottom by time, labeled with message names.
- **Flowchart/decision flow**: use the decision point / conditional branch from `excali-shape`; decisions use a diamond, branches labeled yes/no.
- **State machine**: states use rounded rectangles, transitions use arrows labeled with the triggering event.

## 8. Junior pass to Full pass

**Junior**: draw only the layered background + main node boxes + main data-flow arrows (the skeleton), and show it to the user to confirm the boundaries and levels are correct.
**Full**: add icons, tech-stack annotations, secondary dependencies, semantic color, alignment.

## 9. Verification (see verification.md)

- Check item by item against `system-facts.md`: all services present / dependency directions correct / no key edges missing
- Data-flow direction consistent, not misleading
- Arrow bindings correct
- Single abstraction level (no drill-down detail mixed in)
- Color is semantic, <= 4 colors
