# Excali-Design

[中文](README.md) · **English**

> *"One sentence in, one clear software-architecture / design / prototype diagram out."*

An agent-agnostic skill that draws **static** **software architecture / design / product-prototype / information-flow diagrams** in **Excalidraw hand-drawn style**. Output is always static (`.excalidraw` / PNG / SVG) — no animation, video, or audio.

> 🙏 **Heavily modeled on `huashu-design`.** Its four philosophies (anti-AI-slop / Junior-Designer / asset-first / fact-verify), the SKILL spine + references routing + scripts toolchain are all inherited — only the medium changed from HTML to Excalidraw elements, focused on static diagrams.

## Install

**Option A · `npx skills` (recommended, installs to all your agents)** — uses the [vercel-labs/skills](https://github.com/vercel-labs/skills) CLI (GitHub as registry, auto-detects opencode / Claude Code / Cursor / Codex …):

```bash
npx skills add OhBonsai/excali-design -g          # global (~/.config/<agent>/skills, etc.)
npx skills add OhBonsai/excali-design             # this project only (./<agent>/skills/)
npx skills add OhBonsai/excali-design -a opencode -y   # opencode only, non-interactive
```

**Option B · manual** — download the zip from [Releases](../../releases) into your agent's skills dir, or clone this repo. It pulls the default branch `master` (lean).

## Usage

**Just tell your AI agent one sentence** (works with Claude Code / Cursor / Codex / Cowork / opencode …):

```
Use excali-design to draw an architecture diagram of the order service
Read this repo and draw its microservice call graph
Use excali-design to draw a login/registration prototype flow
```

The agent reads `SKILL.md`, follows the references routing table, and searches + reuses `drawlib/` components. Not sure how to start? Say "**read the excali-design skill, then ask me a few questions**" — it aligns on requirements first.

## Examples (all produced by this skill)

Pipeline: semantic HTML layout → browser computes positions → convert to hand-drawn Excalidraw. Components via `data-lib`, charts via `data-chart` (real values), edges via `arch-connect`, then a model **squint-review** of the render.

| Prototype · multi-screen flow | Dashboard · data-chart |
|---|---|
| ![login flow](assets/readme/login-flow.png) | ![dashboard](assets/readme/dashboard.png) |
| **Kanban · data-lib cards** | **Architecture · arch-connect** |
| ![kanban](assets/readme/kanban.png) | ![architecture](assets/readme/architecture.png) |

## Capabilities at a glance

| Capability | How | Tool / doc |
|---|---|---|
| **Asset reuse** (never hand-draw what exists) | 11 libs / 402 items by category, keyword search → embed via `data-lib` | `drawlib-find.mjs` · `references/drawlib-index.md` |
| **Data charts** | `data-chart="pie\|donut\|bar\|line"` from real values | `html-to-excalidraw.mjs` |
| **Anti-AI-slop (hard gate)** | Unicode/emoji as icons → build fails; use `data-icon` hand-drawn shapes instead | `_antislop.mjs` · `references/anti-slop.md` |
| **Architecture trifecta** | auto node layout + auto edge routing + geometric lint — never by hand | `arch-layout` / `arch-connect` / `arch-lint` |
| **Mermaid → hand-drawn** | flowchart/sequence/state/ER/class/gantt/pie | `mermaid-to-excalidraw.mjs` |
| **Export** | headless SVG (no chromium) / pixel-perfect PNG (playwright) | `svg-export.mjs` / `excalidraw-to-image.mjs` |
| **Squint-review** | render and let the model eyeball it (focus/text/edges/primitives); mechanical lint can't judge quality | `references/design-tokens.md` |

## Component libraries & asset reuse (11 libs · 402 items · one lib per category)

`drawlib/` holds **11 `excali-*` libraries**, curated from the community (libraries.excalidraw.com, all MIT) via **image-recognition cherry-picking + regrouping by category**:

| Library | Items | Library | Items |
|---|---|---|---|
| `excali-ui` controls/cards/tables | 111 | `excali-chart` chart placeholders | 32 |
| `excali-cloud` AWS/Azure/GCP icons | 56 | `excali-person` actors/bubbles | 17 |
| `excali-tech` tech-stack logos | 51 | `excali-ml` ML/DL concepts+tools | 16 |
| `excali-shape` flow/UML/data-structures | 44 | `excali-net` network/devices | 16 |
| `excali-template` deck/canvas/board | 37 | `excali-symbol` math symbols | 15 |
| | | `excali-frame` device shells | 7 |

**Usage** — search first, then embed:

```bash
node scripts/drawlib-find.mjs pie kubernetes lambda   # keyword → data-lib id
node scripts/drawlib-find.mjs --cat cloud-icon         # list a whole category
```
```html
<div data-lib="excali-cloud:7"></div>   <!-- AWS Lambda -->
<div data-lib="excali-ui:59"></div>     <!-- Filled button -->
```

Not in the libs? Check curated community picks in [`references/community-libraries.md`](references/community-libraries.md) and extend via the `asset-taxonomy.md` flow (`fetch-candidates` download → contact sheet → image-pick → `assemble-lib` merge). Machine index lives in `drawlib-index.json`; `build-drawlib-index.mjs --check` guards against index drift (wired into CI).

## The architecture trifecta (layout / edges / lint — never by hand)

| Tool | What it does |
|---|---|
| `arch-layout.mjs` | declare `{nodes, edges, groups}` → elkjs auto-layout (layered + orthogonal + nested), **zero overlap + min crossings**. For dense topologies |
| `arch-connect.mjs` | place boxes, then route edges programmatically: orthogonal + facing-side ports + even distribution + crossing removal + binding. ⛔ never guess edge coords |
| `arch-lint.mjs` | pre-delivery geometric scan (overlap / reversed flow / diagonals / crossings / padding / color budget). **A hint, not a quality gate** |

See [`references/arch-lint.md`](references/arch-lint.md).

## Export (PNG / SVG)

**Lightweight · no chromium (daily use)** — `svg-export.mjs` uses Rough.js `RoughGenerator` **headless** to produce hand-drawn SVG (same seed+roughness as official), needs only `roughjs`; add `--png` to rasterize via `@resvg/resvg-js` (prebuilt, non-browser):

```bash
node scripts/svg-export.mjs diagram.excalidraw --png
```

**Highest fidelity · Playwright** — `excalidraw-to-image.mjs` uses the official export kernel, fonts/wrapping 100% matching excalidraw.com (at the cost of chromium):

```bash
node scripts/excalidraw-to-image.mjs diagram.excalidraw --png --svg --scale 2
```

> Rule of thumb: **daily images / squint-review → headless svg-export; pixel-perfect parity with official → playwright.**

## Project structure

```
excali-design/
├── SKILL.md                  # spine: persona + philosophy + workflow + references routing
├── drawlib/                  # 11 .excalidrawlib (one lib per category, ~402 items)
├── drawlib-index.json        # machine index (drawlib-find search / --check guard)
├── manifests/                # per excali-* lib recipe (src/index/name/MIT source)
├── references/               # deep manuals (routed by task)
│   ├── drawlib-index.md / drawlib-catalog.md   # category index + catalog
│   ├── community-libraries.md / asset-taxonomy.md  # community picks + extension flow
│   ├── architecture-workflow.md / prototype-workflow.md
│   ├── design-tokens.md / anti-slop.md / arch-lint.md / ...
├── scripts/                  # pure Node (+ optional elkjs/roughjs/resvg/playwright)
│   ├── arch-layout / arch-connect / arch-lint
│   ├── html-to-excalidraw    # semantic HTML → hand-drawn; data-lib + data-chart + data-icon
│   ├── mermaid-to-excalidraw
│   ├── drawlib-find / drawlib-sheet / build-drawlib-index / assemble-lib / fetch-candidates
│   ├── svg-export            # headless hand-drawn SVG (no chromium)
│   └── excalidraw-to-image   # playwright, highest fidelity
├── .github/workflows/release.yml   # tag → validate + package + Release
└── test/ · demos/ · test-prompts.json
```

## Dependencies

**Default `npm install` (no chromium, pure JS + small prebuilt binaries)**: `elkjs` + `roughjs` + `@resvg/resvg-js`. Out of the box: write `.excalidraw` / `arch-*` / mermaid Tier2 / `svg-export`.

**Two scripts need a browser kernel** (`npm install` includes `playwright`): `html-to-excalidraw` (HTML layout relies on the browser CSS engine) and `excalidraw-to-image` (pixel-perfect export). Both **first look for an installed Chrome/Edge/Chromium/Brave** (`_browser.mjs`) — use it if found (no download), else fall back to playwright's bundled chromium; or set `EXCALI_CHROMIUM=<path>`.

> With the Excalidraw MCP connected, `create_view` renders directly; otherwise it writes `.excalidraw` files to import at excalidraw.com.

## License

MIT. Each `drawlib/` library is cherry-picked and merged from community MIT libraries; sources are recorded in `manifests/<lib>.json`.
