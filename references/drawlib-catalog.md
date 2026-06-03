# drawlib 组件库目录(一类一库)

> `drawlib/` 下有 **11 个 `.excalidrawlib`**,共 ~402 件,**一类一库**(`excali-*`)。原社区/基础库已按分类**重组并入**(见 `asset-taxonomy.md`),出处记在 `manifests/<库>.json`(全 MIT)。**能复用的绝不手绘**(SKILL.md 原则 #2)。

## ⭐ 取用:`data-lib`(HTML 布局时当组件标签)

走 HTML 布局(`html-to-excalidraw.mjs`)时,在框上写 `data-lib="库名:序号"`,转换器自动取该 item、缩放贴框、居中、重生成 id:

```html
<div data-lib="excali-ui:59"></div>      <!-- Filled button -->
<div data-lib="excali-chart:28"></div>   <!-- Pie 图占位 -->
<div data-lib="excali-cloud:7"></div>    <!-- AWS Lambda -->
<div data-lib="excali-net:0"></div>      <!-- Router -->
<div data-lib="excali-shape:6"></div>    <!-- 决策菱形 -->
```

**先检索再取**:`node scripts/drawlib-find.mjs <关键词>`(或 `--cat <类>` / `--cats`)→ 给序号。**序号会随库更新漂移** → 用前 `node scripts/drawlib-sheet.mjs <库名>` 渲接触表核对。机器索引在根目录 `drawlib-index.json`,分类 taxonomy 见 `drawlib-index.md`。

## 十一库一览

| 库 | 件 | 用途 | 关键序号 |
|---|---|---|---|
| `excali-ui` | 111 | 产品原型主力:按钮/输入/选择/开关/导航/反馈 + 卡片/表格/标签/侧栏 | 59=Filled button;0-68 基础控件;69-94 表单态;95+ Card/Table/Tabs/Alert/媒体 |
| `excali-cloud` | 56 | 云与基础设施图标:抽象原语 + AWS + Azure + GCP | 0-6 原语(microservice/db/cache…);7+ AWS;~22+ Azure;~37+ GCP |
| `excali-tech` | 51 | 技术栈 logo:Docker/K8s/React/Vue/Python/Postgres/Redis… + DevOps 图标 | 0-28 DevOps 图标;29+ 命名 logo |
| `excali-shape` | 44 | 流程图/IA 图元 + UML/ER + BPMN + 数据结构 + 图论 | 0-16 IA(6=决策菱形);17+ UML/BPMN/Array/Tree/graph |
| `excali-template` | 37 | 整页:幻灯片版式 + 商业画布 + Wardley + Team Topologies + 便签 + Scrum | 0-15 slide;16-17 画布;18+ Wardley/TeamTopo/Sticky/Scrum |
| `excali-chart` | 32 | 图表占位(配 `data-chart` 数据驱动) | 0=Bar 4=Column 8=Line 10=Area 28=Pie 29=Donut 31=Radar |
| `excali-person` | 17 | 角色/actor + 气泡 + 机器人 | 0-8 火柴人;9+ 气泡/机器人 |
| `excali-ml` | 16 | ML/DL 概念块 + 工具 logo | 0-8 CNN/RNN/Transformer…;9+ pandas/TF/Jupyter |
| `excali-net` | 16 | 网络/设备/安全 + 位置 + 机柜 | 0=Router 1=Switch 3=Firewall 4=VPN 5=Server 8=Load Balancer |
| `excali-symbol` | 15 | 数学/逻辑符号 ℂ∞∀∃∫∑ | 0=ℂ 13=∫ 14=∑ |
| `excali-frame` | 7 | 外壳:浏览器 + 手机/平板/手表/笔记本 | 0-2 浏览器;3+ 设备 |

> 选型:**真实数值的图** → `data-chart`;**现成组件/图标/外框/小人** → `data-lib`;**库里没有** → 先查社区 `community-libraries.md`,再不行才基础元素手拼(守 anti-slop)。

## 维护(库有增减时)

加/换库 → `node scripts/build-drawlib-index.mjs`(重建 JSON,`--check` 防序号漂移)→ `node scripts/drawlib-sheet.mjs <库名>`(渲接触表核对序号)→ 更新本表。
从社区精挑新内容:`fetch-candidates.mjs`(真机下载到 `_candidates/`)→ 渲接触表 → 图像识别精挑 → 写 `manifests/<库>.json`(`include` 整库并入 / `items` 逐件挑)→ `assemble-lib.mjs` 合并。详见 `asset-taxonomy.md`。
