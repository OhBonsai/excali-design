# 社区资产精选(Excalidraw Libraries)

> 资产优先(SKILL 原则 #2)的外延:**画之前先看有没有现成的**——不光看本仓库 `drawlib/`,也看 Excalidraw 社区。
> 社区库全部 **MIT 许可**,做工精良、覆盖广。本文件是**精选清单 + 取用流程**(两步法第一步:先定方向,你圈定后再 vendor 进 `drawlib/`)。

## 在哪找

- **[libraries.excalidraw.com](https://libraries.excalidraw.com/)** —— 官方目录,搜索 + 一键「Add to Excalidraw」。背后是 [`excalidraw/excalidraw-libraries`](https://github.com/excalidraw/excalidraw-libraries) 的 `libraries.json`。
- **[marketplace.excalidraw.com](https://marketplace.excalidraw.com/)** —— 较新的库/模板市场。
- 个别专题库散在 GitHub(AWS/Azure/GCP、Fluent UI 等),见下。

## 本仓库 drawlib 的社区出处(已 vendor)

我们 `drawlib/` 里这几个就是社区原件:`data-viz`=`dbssticky/data-viz`、`dev_ops`=`markopolo123/dev_ops`、`information-architecture`=`inwardmovement/...`、`stick-figures`=`youritjang/...`、`awesome-slides`=`ferminrp/awesome-slides`、`canvases`=`shellerbrand/canvases`。

## 精选(按分类,标 ⭐ 为每类首选)

### 1. 软件架构 / 云厂商图标
- ⭐ **Software Logos** `drwnio/drwnio.excalidrawlib` —— database/docker/k8s/Postgres/Redis/Nginx/RabbitMQ/反向代理…基础设施 logo
- ⭐ **Technology Logos** `maeddes/technology-logos.excalidrawlib` —— k8s/Docker/git/Terraform/Spring/Kafka/Redis… 云原生
- **Cloud** `cloud/cloud.excalidrawlib` —— 多云套件(K8s/AWS/Azure/GCP logo + 架构插画)
- **Software Architecture** `youritjang/software-architecture.excalidrawlib` —— microservice/db/cache/event bus/browser/mobile 原语
- **IT Logos** `pclainchard/it-logos.excalidrawlib` —— ~30 web 栈:Angular/Docker/Kafka/k8s/Next/React/Vue/VSCode…
- **AWS Serverless** `slobodan/aws-serverless.excalidrawlib`;**AWS Architecture** `narhari-motivaras/aws-architecture-icons.excalidrawlib`
- **Azure** 套件 `7demonsrising/azure-{network,compute,containers,storage,general}.excalidrawlib`(可当一套)
- **GCP / Google** `mguidoti/google-icons.excalidrawlib`、`clementbosc/gcp-icons.excalidrawlib`

### 2. UI / 线框 / 原型控件
- ⭐ **Lo-Fi Wireframing Kit** `spfr/lo-fi-wireframing-kit.excalidrawlib` —— 完整 lo-fi 线框套件
- **Web Kit** `excacomp/web-kit.excalidrawlib` / **Mobile Kit** `excacomp/mobile-kit.excalidrawlib`
- **Wireframing placeholders** `xxxdeveloper/wireframing-placeholders.excalidrawlib`
- **Apple Devices Frames** `franky47/apple-devices-frames.excalidrawlib`;**Gadgets** `morgemoensch/gadgets.excalidrawlib`(手机/平板/笔记本/手表)
- **Medias** `g-script/medias.excalidrawlib` —— 视频播放器/播放控件/音量条

### 3. 流程图 / 信息架构 / 图形原语
- ⭐ **System Design Components** `rohanp/system-design.excalidrawlib` —— 系统设计高层组件
- **bpmn** `fraoustin/bpmn.excalidrawlib` —— ~34 BPMN 元素(task/event/gateway)
- **Shapes for UML & ER** `BjoernKW/UML-ER-library.excalidrawlib`
- **Hexagonal Architecture** `corlaez/hexagonal-architecture.excalidrawlib`(端口适配器)
- **Message Queue** `coexist/mq.excalidrawlib`;**Polygons** `lipis/polygons.excalidrawlib`

### 4. 图表 / 数据可视化
- **Charts** `g-script/charts.excalidrawlib`(bar/column/line/pie);**Graphs** `jakubpawlina/graphs.excalidrawlib`(图论)
- **Gantt** `ferminrp/gantt.excalidrawlib`

### 5. 人物 / actor
- ⭐ **Stick Figures** `youritjang/stick-figures.excalidrawlib`(已 vendor)
- **Robots** `kaligule/robots.excalidrawlib`;**Bubbles** `ocapraro/bubbles.excalidrawlib`(对话/思考气泡);**Storytelling** `drwnio/storytelling.excalidrawlib`

### 6. 网络 / 安全 / 设备
- ⭐ **Network topology icons** `dwelle/network-topology-icons.excalidrawlib` —— VPN/防火墙/服务器/交换机/路由(核心团队作)
- **Racks and Servers** `jgodoy/racks-and-servers-components.excalidrawlib`(机柜 8U/16U + 1U/2U/4U)
- **Network locations** `jgodoy/network-locations.excalidrawlib`(HQ/机房/城市)
- **GitHub Git Icons** `marwinburesch/github-icons.excalidrawlib`(branch/commit/merge/PR)

### 7. 幻灯片 / 装饰
- ⭐ **Awesome Slides** `ferminrp/awesome-slides.excalidrawlib`(已 vendor);**Presentation Templates** `shinkim/presentation-templates.excalidrawlib`
- **Sticky Notes** `ferminrp/post-it.excalidrawlib`;**Awesome Icons** `ferminrp/awesome-icons.excalidrawlib`

### 8. 专题(战略 / 算法 / ML)
- **Business Model Templates** `shellerbrand/canvases.excalidrawlib`(已 vendor)
- **Wardley Maps** `simalexan/wardley-maps-symbols.excalidrawlib`;**Team Topologies** `nikordaris/team-topologies.excalidrawlib`
- **Customer Journey Map** `braweria/customer-journey-map.excalidrawlib`;**Scrum board** `danimaniarqsoft/scrum-board.excalidrawlib`
- **Algorithms & Data Structures** `intradeus/algorithms-and-data-structures-...excalidrawlib`(数组/链表/哈希/树/矩阵)
- **Deep learning** `yuelfei/deep-learning.excalidrawlib`(CNN/RNN/LSTM/attention/transformer);**Data Science logos** `farisology/data-science.excalidrawlib`(Airflow/Jupyter/Pandas/TF/sklearn)

## 取用流程

**A. 临时用(在 excalidraw.com 画)**:逛 [libraries.excalidraw.com](https://libraries.excalidraw.com/) → 搜 → 「Add to Excalidraw」。

**B. vendor 进本仓库(让 data-lib 离线可用,两步法第二步)**:
1. 下载 `.excalidrawlib`:`https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries/<source>`
2. 放进 `drawlib/<库名>.excalidrawlib`(`<库名>` 取个短名)
3. `node scripts/build-drawlib-index.mjs`(重建索引)+ `node scripts/drawlib-sheet.mjs <库名>`(渲接触表核对序号)
4. 在 `drawlib-catalog.md` 速查表加一行;之后即可 `data-lib="<库名>:序号"`
5. **保留 MIT 出处**:在 catalog 里注明原作者/source(社区库都是 MIT,标注归属即可)

> ⚠️ vendor 会增大 master 体积——按「真的常用」来选,别整批拖进来(anti-slop 的资产版:库里有 ≠ 都要)。
