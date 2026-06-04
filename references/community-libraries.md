# Community Asset Picks (Excalidraw Libraries)

> An extension of asset-first (SKILL Principle #2): **before drawing, check whether something ready-made exists** -- not only in this repo's `drawlib/`, but also in the Excalidraw community.
> Community libraries are all **MIT licensed**, well-made, and broad in coverage. This file is a **curated list + intake workflow** (step one of the two-step method: first decide the direction; once you have narrowed it down, vendor it into `drawlib/`).

## Where to find them

- **[libraries.excalidraw.com](https://libraries.excalidraw.com/)** -- the official directory, search + one-click "Add to Excalidraw". Backed by `libraries.json` in [`excalidraw/excalidraw-libraries`](https://github.com/excalidraw/excalidraw-libraries).
- **[marketplace.excalidraw.com](https://marketplace.excalidraw.com/)** -- a newer library/template marketplace.
- A few specialized libraries are scattered on GitHub (AWS/Azure/GCP, Fluent UI, etc.), see below.

## Community provenance of this repo's drawlib (already vendored)

A few items in our `drawlib/` are the community originals: `data-viz`=`dbssticky/data-viz`, `dev_ops`=`markopolo123/dev_ops`, `information-architecture`=`inwardmovement/...`, `stick-figures`=`youritjang/...`, `awesome-slides`=`ferminrp/awesome-slides`, `canvases`=`shellerbrand/canvases`.

## Curated picks (by category, the first pick per category is marked "top pick")

### 1. Software architecture / cloud-vendor icons
- top pick **Software Logos** `drwnio/drwnio.excalidrawlib` -- database/docker/k8s/Postgres/Redis/Nginx/RabbitMQ/reverse proxy... infrastructure logos
- top pick **Technology Logos** `maeddes/technology-logos.excalidrawlib` -- k8s/Docker/git/Terraform/Spring/Kafka/Redis... cloud-native
- **Cloud** `cloud/cloud.excalidrawlib` -- multi-cloud kit (K8s/AWS/Azure/GCP logos + architecture illustrations)
- **Software Architecture** `youritjang/software-architecture.excalidrawlib` -- microservice/db/cache/event bus/browser/mobile primitives
- **IT Logos** `pclainchard/it-logos.excalidrawlib` -- ~30 web-stack: Angular/Docker/Kafka/k8s/Next/React/Vue/VSCode...
- **AWS Serverless** `slobodan/aws-serverless.excalidrawlib`; **AWS Architecture** `narhari-motivaras/aws-architecture-icons.excalidrawlib`
- **Azure** kit `7demonsrising/azure-{network,compute,containers,storage,general}.excalidrawlib` (can be treated as one set)
- **GCP / Google** `mguidoti/google-icons.excalidrawlib`, `clementbosc/gcp-icons.excalidrawlib`

### 2. UI / wireframe / prototype controls
- top pick **Lo-Fi Wireframing Kit** `spfr/lo-fi-wireframing-kit.excalidrawlib` -- a complete lo-fi wireframe kit
- **Web Kit** `excacomp/web-kit.excalidrawlib` / **Mobile Kit** `excacomp/mobile-kit.excalidrawlib`
- **Wireframing placeholders** `xxxdeveloper/wireframing-placeholders.excalidrawlib`
- **Apple Devices Frames** `franky47/apple-devices-frames.excalidrawlib`; **Gadgets** `morgemoensch/gadgets.excalidrawlib` (phone/tablet/laptop/watch)
- **Medias** `g-script/medias.excalidrawlib` -- video player/playback controls/volume bar

### 3. Flowchart / information architecture / shape primitives
- top pick **System Design Components** `rohanp/system-design.excalidrawlib` -- high-level system design components
- **bpmn** `fraoustin/bpmn.excalidrawlib` -- ~34 BPMN elements (task/event/gateway)
- **Shapes for UML & ER** `BjoernKW/UML-ER-library.excalidrawlib`
- **Hexagonal Architecture** `corlaez/hexagonal-architecture.excalidrawlib` (ports and adapters)
- **Message Queue** `coexist/mq.excalidrawlib`; **Polygons** `lipis/polygons.excalidrawlib`

### 4. Charts / data visualization
- **Charts** `g-script/charts.excalidrawlib` (bar/column/line/pie); **Graphs** `jakubpawlina/graphs.excalidrawlib` (graph theory)
- **Gantt** `ferminrp/gantt.excalidrawlib`

### 5. People / actors
- top pick **Stick Figures** `youritjang/stick-figures.excalidrawlib` (already vendored)
- **Robots** `kaligule/robots.excalidrawlib`; **Bubbles** `ocapraro/bubbles.excalidrawlib` (speech/thought bubbles); **Storytelling** `drwnio/storytelling.excalidrawlib`

### 6. Network / security / devices
- top pick **Network topology icons** `dwelle/network-topology-icons.excalidrawlib` -- VPN/firewall/server/switch/router (by a core team member)
- **Racks and Servers** `jgodoy/racks-and-servers-components.excalidrawlib` (racks 8U/16U + 1U/2U/4U)
- **Network locations** `jgodoy/network-locations.excalidrawlib` (HQ/data center/city)
- **GitHub Git Icons** `marwinburesch/github-icons.excalidrawlib` (branch/commit/merge/PR)

### 7. Slides / decoration
- top pick **Awesome Slides** `ferminrp/awesome-slides.excalidrawlib` (already vendored); **Presentation Templates** `shinkim/presentation-templates.excalidrawlib`
- **Sticky Notes** `ferminrp/post-it.excalidrawlib`; **Awesome Icons** `ferminrp/awesome-icons.excalidrawlib`

### 8. Specialized (strategy / algorithms / ML)
- **Business Model Templates** `shellerbrand/canvases.excalidrawlib` (already vendored)
- **Wardley Maps** `simalexan/wardley-maps-symbols.excalidrawlib`; **Team Topologies** `nikordaris/team-topologies.excalidrawlib`
- **Customer Journey Map** `braweria/customer-journey-map.excalidrawlib`; **Scrum board** `danimaniarqsoft/scrum-board.excalidrawlib`
- **Algorithms & Data Structures** `intradeus/algorithms-and-data-structures-...excalidrawlib` (array/linked list/hash/tree/matrix)
- **Deep learning** `yuelfei/deep-learning.excalidrawlib` (CNN/RNN/LSTM/attention/transformer); **Data Science logos** `farisology/data-science.excalidrawlib` (Airflow/Jupyter/Pandas/TF/sklearn)

## Intake workflow

**A. One-off use (drawing on excalidraw.com)**: browse [libraries.excalidraw.com](https://libraries.excalidraw.com/) -> search -> "Add to Excalidraw".

**B. Vendor into this repo (make data-lib available offline, step two of the two-step method)**:
1. Download the `.excalidrawlib`: `https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries/<source>`
2. Place it at `drawlib/<libname>.excalidrawlib` (give `<libname>` a short name)
3. `node scripts/build-drawlib-index.mjs` (rebuild the index) + `node scripts/drawlib-sheet.mjs <libname>` (render the contact sheet to verify indices)
4. Add a row to the quick-reference table in `drawlib-catalog.md`; afterwards you can use `data-lib="<libname>:index"`
5. **Preserve MIT provenance**: note the original author/source in the catalog (community libraries are all MIT; just attribute)

> Warning: vendoring increases the master size -- pick by "truly frequently used", do not drag in whole batches (the asset version of anti-slop: being in the library != needing all of it).
