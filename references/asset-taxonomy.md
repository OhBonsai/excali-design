# Asset Requirements Taxonomy (requirements-driven -> fixed taxonomy -> hand-pick and self-build)

> Assets are not "browse a library and grab whatever," but are derived backward from drawing requirements: diagram requirements -> asset categories -> converged into a two-level taxonomy (top level -> leaf, where a leaf = a single pick target) -> visually hand-picked item by item (do not bulk-move whole libraries) -> reorganized by taxonomy into our own set of `.excalidrawlib` files.
> Decisions are settled: the taxonomy is fine-grained, all gaps are pushed together, and self-built libraries are reorganized by taxonomy. This file is the spec + gap analysis + pick execution plan.

## 1. Diagram requirements (which diagrams this skill produces)

D1 Software architecture/deployment · D2 Product prototype/wireframe · D3 Data dashboard · D4 Information flow/state machine · D5 Kanban/collaboration board · D6 Reporting deck · D7 User journey/sequence · D8 Business/strategy · D9 Algorithms/ML/math

## 2. Requirements -> asset categories (matrix, two filled circles = must-have, one filled circle = common, open circle = occasional)

| | icon | component | chart | shape | frame | person | template | symbol | decoration |
|---|---|---|---|---|---|---|---|---|---|
| D1 Architecture | must-have | occasional | | common | | occasional | | | |
| D2 Prototype | common | must-have | | | must-have | occasional | | | occasional |
| D3 Dashboard data | occasional | common | must-have | | | | | | |
| D4 Flow | | | | must-have | | occasional | | occasional | |
| D5 Collaboration board | occasional | common | occasional | | | occasional | common | | common |
| D6 Deck | occasional | | occasional | | | occasional | must-have | | occasional |
| D7 Journey/sequence | occasional | | | occasional | | must-have | occasional | | common |
| D8 Business/strategy | | | | occasional | | | must-have | | common |
| D9 Algorithms/ML/math | common | | occasional | must-have | | | | must-have | |

## 3. Fixed taxonomy (two levels · leaf = pick target)

Format: `leaf — drawlib current state -> gap -> candidate community libraries`. An empty current state means entirely missing.

### T1 · Cloud and infrastructure icons (icon) -> self-built library `excali-cloud`
- T1.1 AWS — empty -> entirely missing -> `slobodan/aws-serverless`, `narhari-motivaras/aws-architecture-icons`, `husainkhambaty/aws-simple-icons`
- T1.2 Azure — empty -> entirely missing -> `7demonsrising/azure-*` (network/compute/containers/storage/general)
- T1.3 GCP / Google — empty -> entirely missing -> `mguidoti/google-icons`, `clementbosc/gcp-icons`
- T1.4 Multi-cloud/generic infrastructure primitives (microservice/db/cache/queue/gateway/lb/cdn) — empty -> missing -> `youritjang/software-architecture`, `cloud/cloud`

### T2 · Tech stack icons (icon) -> `excali-tech`
- T2.1 Containers/orchestration (K8s/Docker/Helm/OpenShift) — partial in `dev_ops` -> supplement -> `maeddes/technology-logos`, `markopolo123/dev_ops`
- T2.2 Data/middleware (Postgres/MySQL/Redis/Mongo/Kafka/RabbitMQ/ES) — weak -> missing -> `drwnio/drwnio` (Software Logos)
- T2.3 Languages/frameworks (React/Vue/Angular/Python/Node/Spring/Go) — empty -> missing -> `pclainchard/it-logos`
- T2.4 DevOps/CI (GitHub Actions/GitLab/Terraform/Ansible/Vault/Consul) — partial in `dev_ops` -> supplement -> `markopolo123/dev_ops`
- T2.5 Observability (Grafana/Prometheus) — empty -> missing -> `mikhailredis/redis-grafana`

### T3 · Network / devices / security (icon) -> `excali-net`
- T3.1 Network topology (router/switch/firewall/VPN/hub/gateway) — empty -> entirely missing -> `dwelle/network-topology-icons`, `samu_x86/network-elements`
- T3.2 Data center/server room (rack 8U/16U, server 1U/2U, location HQ/office/city) — empty -> entirely missing -> `jgodoy/racks-and-servers-components`, `jgodoy/network-locations`
- T3.3 Security (shield/lock/cert/IAM) — empty -> missing -> pick from the above + cloud libraries

### T4 · UI controls (component) -> `excali-ui` (reorganized on top of existing basic-ux+forms)
- T4.1 Basic controls (button/input/checkbox/radio/toggle/dropdown/slider) — `basic-ux`+`forms` -> sufficient
- T4.2 Navigation/containers (tabs/breadcrumb/card/accordion/table) — weak -> moderate gap -> `spfr/lo-fi-wireframing-kit`, `excacomp/web-kit`
- T4.3 Feedback (tooltip/badge/progress/spinner/modal) — partial in `basic-ux` -> supplement -> Lo-Fi Kit
- T4.4 Media (image placeholder/video/avatar/upload) — partial in `basic-ux` -> supplement -> `g-script/medias`

### T5 · Shell / device frames (frame) -> `excali-frame`
- T5.1 Browser frames — `webpage-frames` (3) -> sufficient
- T5.2 Mobile/devices (iPhone/Android/tablet/watch) — empty -> moderate gap -> `morgemoensch/gadgets`, `franky47/apple-devices-frames`
- T5.3 Desktop resolutions — empty -> occasional -> `shinkim/desktop-resolutions`

### T6 · Charts (chart) -> `excali-chart` (paired with `data-chart` data-driven)
- T6.1 Basic charts (bar/line/pie/area/scatter...) — `data-viz` (32) -> sufficient
- T6.2 KPI/stat card / gauge / funnel — weak -> occasional -> assemble manually or `g-script/charts`

### T7 · Primitives / structures (shape) -> `excali-shape`
- T7.1 Flowchart primitives (page/decision/area/branch) — `information-architecture` (17) -> sufficient
- T7.2 UML (class/interface/package/actor/usecase) — empty -> moderate gap -> `BjoernKW/UML-ER-library`
- T7.3 ER (entity/relation/cardinality) — empty -> moderate gap -> `BjoernKW/UML-ER-library`
- T7.4 BPMN (task/event/gateway) — empty -> occasional -> `fraoustin/bpmn`
- T7.5 Data structures (array/list/tree/hash/matrix/graph) — empty -> missing (D9) -> `intradeus/algorithms-...`
- T7.6 Geometric primitives (polygon/star) — weak -> occasional -> `lipis/polygons`, `lipis/stars`

### T8 · Characters / expressions (person) -> `excali-person`
- T8.1 Stick figures (emotion/posture) — `stick-figures` (9) -> sufficient
- T8.2 Robots / avatars — empty -> occasional -> `kaligule/robots`
- T8.3 Bubbles / emotions (speech/thought bubble) — empty -> missing (D7) -> `ocapraro/bubbles`, `drwnio/storytelling`

### T9 · Full-page templates / canvases / boards (template) -> `excali-template`
- T9.1 Slide layouts — `awesome-slides` (16) -> sufficient
- T9.2 Business canvases (BMC/VPC/Lean) — `canvases` (2) -> sufficient, supplement Lean
- T9.3 Strategy maps (Wardley/Team Topologies) — empty -> moderate gap -> `simalexan/wardley-maps-symbols`, `nikordaris/team-topologies`
- T9.4 Collaboration boards (kanban/scrum/CJM/sticky notes) — empty -> moderate gap -> `danimaniarqsoft/scrum-board`, `braweria/customer-journey-map`, `ferminrp/post-it`

### T10 · Symbols (symbol) -> `excali-symbol`
- T10.1 Math/logic (C, infinity, for-all, exists, integral, sum, ...) — `mathematical-symbols` (15) -> sufficient
- T10.2 ML/DL concept blocks (neuron/layer/CNN/RNN/transformer/QKV) — empty -> missing (D9) -> `yuelfei/deep-learning`, `farisology/data-science`

### T11 · Annotation / decoration (decoration, restrained) -> merged into `excali-template` or `excali-person`
- T11.1 Sticky notes post-it — empty -> occasional -> `ferminrp/post-it`
- T11.2 Callout / markers — use `data-icon` + basic elements, do not pick specifically

### Not added to libraries
- font: Excalidraw has only 3 font families (Virgil/Normal/Code), assigned to `design-tokens.md`, do not vendor fonts.
- affordance small icons (check / arrow / search): covered by `data-icon` + the anti-slop hard gate, fall back to unicode, do not pick specifically.

## 4. Self-built library list (reorganized by taxonomy, final form)

| Self-built library | Which leaves it collects | Existing merged in |
|---|---|---|
| `excali-cloud` | T1.* | — |
| `excali-tech` | T2.* | dev_ops (split and reclassified) |
| `excali-net` | T3.* | — |
| `excali-ui` | T4.* | basic-ux + forms |
| `excali-frame` | T5.* | webpage-frames |
| `excali-chart` | T6.* | data-viz |
| `excali-shape` | T7.* | information-architecture |
| `excali-person` | T8.* | stick-figures |
| `excali-template` | T9.* + T11.1 | awesome-slides + canvases |
| `excali-symbol` | T10.* | mathematical-symbols |

> Each self-built library = a merged library after hand-picking, sorted internally by subcategory; referenced via `data-lib="excali-cloud:index"`. The existing 10 libraries are gradually merged into their corresponding categories.

## 5. Pick execution flow (leaf by leaf)

```
For each leaf Tx.y that has a gap:
1. Lock in the candidate community library (table above) -> download the .excalidrawlib into a temp directory
2. node scripts/drawlib-sheet.mjs <candidate> (render contact sheet)
3. Model reads the contact sheet (image recognition) -> pick item by item: keep "hand-drawn style correct / semantically clear / needed by this leaf", discard duplicates/off-topic/mixed-style
4. Extract selected items -> merge into the corresponding self-built library (regenerate ids, group by subcategory)
5. build-drawlib-index.mjs rebuild index + drawlib-sheet verify + catalog register + mark MIT provenance
```

Priority: the decision is to "push all gaps together," but execution is ordered from must-have to occasional: first T1/T2/T3 (architecture, must-have), then T5.2/T7.2-3 (prototype/flow, common), then T8.3/T9.3-4/T10.2 (occasional).
