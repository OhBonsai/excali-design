# 资产需求分类(需求驱动 → 确定分类 → 精挑自建)

> 资产不是"逛库随手拿",而是**从画图需求倒推**:图的需求 → 资产种类 → 收敛成**两级分类**(顶层 → 叶子,叶子=一个 pick 目标)→ 逐件**视觉精挑**(不整库搬)→ 按分类**重组**成**自有的一套 `.excalidrawlib`**。
> 决策已定:**分类要细**、**所有缺口一起推**、**自建库按分类重组**。本文件是规格 + 缺口分析 + pick 执行计划。

## 一、图的需求(本 skill 产出哪些图)

D1 软件架构/部署 · D2 产品原型/线框 · D3 数据看板 · D4 信息流程/状态机 · D5 看板/协作板 · D6 汇报 deck · D7 用户旅程/时序 · D8 商业/战略 · D9 算法/ML/数学

## 二、需求 → 资产种类(矩阵,●●刚需 ●常用 ○偶尔)

| | icon | component | chart | shape | frame | person | template | symbol | decoration |
|---|---|---|---|---|---|---|---|---|---|
| D1 架构 | ●● | ○ | | ● | | ○ | | | |
| D2 原型 | ● | ●● | | | ●● | ○ | | | ○ |
| D3 看板数据 | ○ | ● | ●● | | | | | | |
| D4 流程 | | | | ●● | | ○ | | ○ | |
| D5 协作板 | ○ | ● | ○ | | | ○ | ● | | ● |
| D6 deck | ○ | | ○ | | | ○ | ●● | | ○ |
| D7 旅程/时序 | ○ | | | ○ | | ●● | ○ | | ● |
| D8 商业/战略 | | | | ○ | | | ●● | | ● |
| D9 算法/ML/数学 | ● | | ○ | ●● | | | | ●● | |

## 三、确定分类(两级 · 叶子=pick 目标)

格式:`叶子 — drawlib 现状 → 缺口 → 候选社区库`。现状空=全缺。

### T1 · 云与基础设施图标(icon)→ 自建库 `excali-cloud`
- **T1.1 AWS** — 空 → 全缺 → `slobodan/aws-serverless`、`narhari-motivaras/aws-architecture-icons`、`husainkhambaty/aws-simple-icons`
- **T1.2 Azure** — 空 → 全缺 → `7demonsrising/azure-*`(network/compute/containers/storage/general)
- **T1.3 GCP / Google** — 空 → 全缺 → `mguidoti/google-icons`、`clementbosc/gcp-icons`
- **T1.4 多云/通用基础设施原语**(microservice/db/cache/queue/gateway/lb/cdn) — 空 → 缺 → `youritjang/software-architecture`、`cloud/cloud`

### T2 · 技术栈图标(icon)→ `excali-tech`
- **T2.1 容器/编排**(K8s/Docker/Helm/OpenShift) — `dev_ops` 部分 → 补 → `maeddes/technology-logos`、`markopolo123/dev_ops`
- **T2.2 数据/中间件**(Postgres/MySQL/Redis/Mongo/Kafka/RabbitMQ/ES) — 弱 → 缺 → `drwnio/drwnio`(Software Logos)
- **T2.3 语言/框架**(React/Vue/Angular/Python/Node/Spring/Go) — 空 → 缺 → `pclainchard/it-logos`
- **T2.4 DevOps/CI**(GitHub Actions/GitLab/Terraform/Ansible/Vault/Consul) — `dev_ops` 部分 → 补 → `markopolo123/dev_ops`
- **T2.5 可观测**(Grafana/Prometheus) — 空 → 缺 → `mikhailredis/redis-grafana`

### T3 · 网络 / 设备 / 安全(icon)→ `excali-net`
- **T3.1 网络拓扑**(router/switch/firewall/VPN/hub/gateway) — 空 → **全缺** → `dwelle/network-topology-icons`、`samu_x86/network-elements`
- **T3.2 数据中心/机房**(rack 8U/16U、server 1U/2U、location HQ/office/city) — 空 → **全缺** → `jgodoy/racks-and-servers-components`、`jgodoy/network-locations`
- **T3.3 安全**(shield/lock/cert/IAM) — 空 → 缺 → 从上述+云库挑

### T4 · UI 控件(component)→ `excali-ui`(以现有 basic-ux+forms 为底重组)
- **T4.1 基础控件**(button/input/checkbox/radio/toggle/dropdown/slider) — `basic-ux`+`forms` → **够**
- **T4.2 导航/容器**(tabs/breadcrumb/card/accordion/table) — 弱 → 中缺 → `spfr/lo-fi-wireframing-kit`、`excacomp/web-kit`
- **T4.3 反馈**(tooltip/badge/progress/spinner/modal) — `basic-ux` 部分 → 补 → Lo-Fi Kit
- **T4.4 媒体**(image placeholder/video/avatar/upload) — `basic-ux` 部分 → 补 → `g-script/medias`

### T5 · 外壳 / 设备框(frame)→ `excali-frame`
- **T5.1 浏览器框** — `webpage-frames`(3) → 够
- **T5.2 移动/设备**(iPhone/Android/tablet/watch) — 空 → 中缺 → `morgemoensch/gadgets`、`franky47/apple-devices-frames`
- **T5.3 桌面分辨率** — 空 → 偶用 → `shinkim/desktop-resolutions`

### T6 · 图表(chart)→ `excali-chart`(配 `data-chart` 数据驱动)
- **T6.1 基础图**(bar/line/pie/area/scatter…) — `data-viz`(32) → 够
- **T6.2 KPI/统计卡 / gauge / funnel** — 弱 → 偶用 → 自拼或 `g-script/charts`

### T7 · 图元 / 结构(shape)→ `excali-shape`
- **T7.1 流程图原语**(page/decision/area/branch) — `information-architecture`(17) → 够
- **T7.2 UML**(class/interface/package/actor/usecase) — 空 → 中缺 → `BjoernKW/UML-ER-library`
- **T7.3 ER**(entity/relation/cardinality) — 空 → 中缺 → `BjoernKW/UML-ER-library`
- **T7.4 BPMN**(task/event/gateway) — 空 → 偶用 → `fraoustin/bpmn`
- **T7.5 数据结构**(array/list/tree/hash/matrix/graph) — 空 → 缺(D9) → `intradeus/algorithms-...`
- **T7.6 几何原语**(polygon/star) — 弱 → 偶用 → `lipis/polygons`、`lipis/stars`

### T8 · 角色 / 表情(person)→ `excali-person`
- **T8.1 火柴人**(情绪/姿态) — `stick-figures`(9) → 够
- **T8.2 机器人 / 头像** — 空 → 偶用 → `kaligule/robots`
- **T8.3 气泡 / 情绪**(speech/thought bubble) — 空 → 缺(D7) → `ocapraro/bubbles`、`drwnio/storytelling`

### T9 · 整页模板 / 画布 / 板(template)→ `excali-template`
- **T9.1 slide 版式** — `awesome-slides`(16) → 够
- **T9.2 商业画布**(BMC/VPC/Lean) — `canvases`(2) → 够,补 Lean
- **T9.3 战略地图**(Wardley/Team Topologies) — 空 → 中缺 → `simalexan/wardley-maps-symbols`、`nikordaris/team-topologies`
- **T9.4 协作板**(kanban/scrum/CJM/便签) — 空 → 中缺 → `danimaniarqsoft/scrum-board`、`braweria/customer-journey-map`、`ferminrp/post-it`

### T10 · 符号(symbol)→ `excali-symbol`
- **T10.1 数学/逻辑**(ℂ∞∀∃∫∑…) — `mathematical-symbols`(15) → 够
- **T10.2 ML/DL 概念块**(neuron/layer/CNN/RNN/transformer/QKV) — 空 → 缺(D9) → `yuelfei/deep-learning`、`farisology/data-science`

### T11 · 标注 / 装饰(decoration,克制)→ 并入 `excali-template` 或 `excali-person`
- **T11.1 便签 post-it** — 空 → 偶用 → `ferminrp/post-it`
- **T11.2 callout / 标记** — 用 `data-icon` + 基础元素,**不专门 pick**

### 不入库
- **font**:Excalidraw 仅 3 字体族(Virgil/Normal/Code),归 `design-tokens.md`,**不 vendor 字体**。
- **affordance 小图标**(✓/→/搜索):由 `data-icon` + 反 slop 硬门覆盖,不够 unicode、不专门 pick。

## 四、自建库清单(按分类重组,最终形态)

| 自建库 | 收哪些叶子 | 现有并入 |
|---|---|---|
| `excali-cloud` | T1.* | — |
| `excali-tech` | T2.* | dev_ops(拆分归类) |
| `excali-net` | T3.* | — |
| `excali-ui` | T4.* | basic-ux + forms |
| `excali-frame` | T5.* | webpage-frames |
| `excali-chart` | T6.* | data-viz |
| `excali-shape` | T7.* | information-architecture |
| `excali-person` | T8.* | stick-figures |
| `excali-template` | T9.* + T11.1 | awesome-slides + canvases |
| `excali-symbol` | T10.* | mathematical-symbols |

> 每个自建库 = **精挑后的合并库**,内部按子类排序;`data-lib="excali-cloud:序号"` 引用。现有 10 库逐步并入对应分类。

## 五、pick 执行流程(逐叶子)

```
对每个有缺口的叶子 Tx.y:
1. 锁定候选社区库(上表)→ 下载 .excalidrawlib 到临时目录
2. node scripts/drawlib-sheet.mjs <候选>(渲接触表)
3. 模型读接触表(图像识别)→ 逐件挑:留"手绘风正/语义清/本叶子要"的,弃重复/跑题/风格杂
4. 抽出选中 item → 归并进对应自建库(重生成 id,子类分组)
5. build-drawlib-index.mjs 重建索引 + drawlib-sheet 核对 + catalog 登记 + 标 MIT 出处
```

**优先级**:决策为"所有缺口一起推",但执行按**刚需→偶用**排:先 T1/T2/T3(架构 ●●)、T5.2/T7.2-3(原型/流程 ●)、再 T8.3/T9.3-4/T10.2(○)。
