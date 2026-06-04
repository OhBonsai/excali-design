# drawlib component library catalog (one category, one library)

> Under `drawlib/` there are **11 `.excalidrawlib` files**, ~402 items total, **one category per library** (`excali-*`). The original community/base libraries have been **reorganized and merged in** by category (see `asset-taxonomy.md`); provenance is recorded in `manifests/<library>.json` (all MIT). **Never hand-draw what you can reuse** (SKILL.md principle #2).

## Pulling items: `data-lib` (use as a component tag in HTML layout)

When using HTML layout (`html-to-excalidraw.mjs`), write `data-lib="library-name:index"` on a box; the converter automatically pulls that item, scales it to fit the box, centers it, and regenerates ids:

```html
<div data-lib="excali-ui:59"></div>      <!-- Filled button -->
<div data-lib="excali-chart:28"></div>   <!-- Pie chart placeholder -->
<div data-lib="excali-cloud:7"></div>    <!-- AWS Lambda -->
<div data-lib="excali-net:0"></div>      <!-- Router -->
<div data-lib="excali-shape:6"></div>    <!-- decision diamond -->
```

**Search first, then pull**: `node scripts/drawlib-find.mjs <keyword>` (or `--cat <category>` / `--cats`) -> gives indices. **Indices drift as libraries are updated** -> before using, run `node scripts/drawlib-sheet.mjs <library-name>` to render a contact sheet and verify. The machine index is at `drawlib-index.json` in the root; the category taxonomy is in `drawlib-index.md`.

## The eleven libraries at a glance

| Library | Items | Use | Key indices |
|---|---|---|---|
| `excali-ui` | 111 | The mainstay for product prototypes: buttons/inputs/selects/switches/navigation/feedback + cards/tables/tags/sidebars | 59=Filled button; 0-68 basic controls; 69-94 form states; 95+ Card/Table/Tabs/Alert/media |
| `excali-cloud` | 56 | Cloud and infrastructure icons: abstract primitives + AWS + Azure + GCP | 0-6 primitives (microservice/db/cache...); 7+ AWS; ~22+ Azure; ~37+ GCP |
| `excali-tech` | 51 | Tech stack logos: Docker/K8s/React/Vue/Python/Postgres/Redis... + DevOps icons | 0-28 DevOps icons; 29+ named logos |
| `excali-shape` | 44 | Flowchart/IA primitives + UML/ER + BPMN + data structures + graph theory | 0-16 IA (6=decision diamond); 17+ UML/BPMN/Array/Tree/graph |
| `excali-template` | 37 | Full pages: slide layouts + business canvases + Wardley + Team Topologies + sticky notes + Scrum | 0-15 slide; 16-17 canvas; 18+ Wardley/TeamTopo/Sticky/Scrum |
| `excali-chart` | 32 | Chart placeholders (paired with `data-chart` for data-driven rendering) | 0=Bar 4=Column 8=Line 10=Area 28=Pie 29=Donut 31=Radar |
| `excali-person` | 17 | Roles/actors + speech bubbles + robots | 0-8 stick figures; 9+ bubbles/robots |
| `excali-ml` | 16 | ML/DL concept blocks + tool logos | 0-8 CNN/RNN/Transformer...; 9+ pandas/TF/Jupyter |
| `excali-net` | 16 | Networking/devices/security + locations + racks | 0=Router 1=Switch 3=Firewall 4=VPN 5=Server 8=Load Balancer |
| `excali-symbol` | 15 | Math/logic symbols ℂ∞∀∃∫∑ | 0=ℂ 13=∫ 14=∑ |
| `excali-frame` | 7 | Shells: browser + phone/tablet/watch/laptop | 0-2 browser; 3+ devices |

> Selection: **diagram with real numeric values** -> `data-chart`; **ready-made component/icon/outer frame/figure** -> `data-lib`; **not in the libraries** -> first check the community `community-libraries.md`, and only if that fails hand-assemble from base elements (observing anti-slop).

## Maintenance (when libraries are added or removed)

Add/swap a library -> `node scripts/build-drawlib-index.mjs` (rebuild the JSON, `--check` to guard against index drift) -> `node scripts/drawlib-sheet.mjs <library-name>` (render a contact sheet to verify indices) -> update this table.
Hand-pick new content from the community: `fetch-candidates.mjs` (live download into `_candidates/`) -> render a contact sheet -> hand-pick via image recognition -> write `manifests/<library>.json` (`include` to merge an entire library / `items` to pick item by item) -> `assemble-lib.mjs` to merge. See `asset-taxonomy.md` for details.
