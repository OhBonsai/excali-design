# drawlib 分类与索引

> `drawlib/` 共 **19 库 / 402 件** = 10 基础库 + **9 自建精选库**(`excali-*`,从社区图像识别精挑合并,见下「自建精选库」)。本文件是**分类(taxonomy)+ 检索入口**;每个 item 的清单/序号见 `drawlib-catalog.md`,机器索引见根目录 `drawlib-index.json`。
> 资产优先(原则 #2):画之前**先 find,有就 data-lib 复用,别手画**。

## 三种查法

```bash
node scripts/drawlib-find.mjs pie            # 关键词(名/标签/库/分类)→ 给 data-lib 序号
node scripts/drawlib-find.mjs checkbox button
node scripts/drawlib-find.mjs --cat chart    # 按分类列全部
node scripts/drawlib-find.mjs --lib forms    # 按库列全部
node scripts/drawlib-find.mjs --cats         # 看所有分类 + 计数
```
找到后:`<div data-lib="库名:序号">`。**序号会随库更新漂移 → 用前 `node scripts/drawlib-sheet.mjs <库名>` 渲接触表核对。**

## 分类(category → 库 / 数量 / 用途)

| 分类 category | 库 | 件数 | 用在 | 领域 domain |
|---|---|---|---|---|
| `ui-control` | basic-ux-wireframing-elements | 69 | 按钮/输入/选择/开关/导航/反馈控件 | 原型 |
| `chart` | data-viz | 32 | 图表占位(配 `data-chart` 数据驱动) | 看板 |
| `tech-icon` | dev_ops | 29 | 架构图节点技术图标 | 架构 |
| `form-control` | forms | 26 | 表单控件态(checkbox/radio 全态、ComboBox…) | 原型 |
| `flowchart-shape` | information-architecture | 17 | 流程图/IA 图元(page/decision/area…) | 图示 |
| `slide-template` | awesome-slides | 16 | 整页 PPT 版式 | deck |
| `math-symbol` | mathematical-symbols | 15 | 公式/算法符号 ℂ∞∀∃∫∑… | 数学 |
| `person` | stick-figures | 9 | actor/角色/用户旅程小人 | 人物 |
| `frame` | webpage-frames | 3 | 浏览器外壳 | 原型 |
| `business-canvas` | canvases | 2 | 商业模式/价值主张画布 | 战略 |

## 自建精选库(`excali-*`,从社区图像识别精挑合并,MIT)

需求驱动 pick(见 `asset-taxonomy.md`)→ 渲接触表 → 模型图像识别逐件挑 → `assemble-lib.mjs` 合并。出处见 `manifests/<库>.json`。

| 库 | 件 | 分类 | 收了什么 | 出处(MIT) |
|---|---|---|---|---|
| `excali-cloud` | 56 | cloud-icon | 抽象原语 + AWS + Azure + GCP 架构图标 | youritjang / slobodan / 7demonsrising / mguidoti |
| `excali-tech` | 22 | tech-icon | Docker/K8s/Kafka/React/Vue/Python/Postgres/Redis/Nginx… | pclainchard / drwnio / maeddes |
| `excali-net` | 16 | net-device | Router/Switch/Firewall/VPN/LB/Server + 位置/机柜 | dwelle / samu_x86 / jgodoy |
| `excali-shape` | 27 | flowchart-shape | UML 实体/接口 + BPMN + 数据结构 + 图论 | BjoernKW / fraoustin / intradeus / jakubpawlina |
| `excali-template` | 19 | template | Wardley + Team Topologies + 便签 + Scrum | simalexan / nikordaris / ferminrp / danimaniarqsoft |
| `excali-ml` | 16 | ml | CNN/RNN/Transformer 等概念 + pandas/TF/Jupyter logo | yuelfei / farisology |
| `excali-ui` | 16 | ui-control | Card/Table/Tabs/Sidebar/Alert/Tag/Badge + 媒体 | spfr / g-script |
| `excali-person` | 8 | person | 对话/思考气泡 + 机器人 | ocapraro / kaligule |
| `excali-frame` | 4 | frame | 手机/平板/手表/笔记本 | morgemoensch |

> 这 9 个是**精挑后的合并库**(非整库搬)。基础 10 库暂保留(`excali-ui/frame/person` 是对 basic-ux/forms/stick-figures 的补充,不是替换)。

## 按「要画什么」反查

| 要画 | find 关键词 / 分类 | 备选(社区,见 `community-libraries.md`) |
|---|---|---|
| 登录/表单/设置页 | `--cat ui-control` + `--cat form-control` + `--lib webpage-frames` | Lo-Fi Wireframing Kit |
| Dashboard / 数据页 | `--cat chart`(+ `data-chart` 数据驱动) | Charts / Graphs |
| 软件架构 / 部署 | `--cat tech-icon` + 基础框 | Software Logos / Technology Logos |
| 流程图 / 状态机 / 站点图 | `--cat flowchart-shape` | System Design / bpmn |
| 看板 / 卡片 | `--cat ui-control`(头像/标签)+ HTML 布局 | Scrum board |
| 用户旅程 / 时序 actor | `--cat person` | Robots / Bubbles |
| 汇报 deck | `--cat slide-template` | Presentation Templates |
| 公式 / ML / 算法 | `--cat math-symbol` | Deep learning / Algorithms |
| 商业模式 / 战略 | `--cat business-canvas` | Wardley Maps / Team Topologies |

## 机器索引 `drawlib-index.json`

`node scripts/build-drawlib-index.mjs` 生成。每条:
```json
{ "id":"data-viz:28", "lib":"data-viz", "index":28, "name":"Pie",
  "category":"chart", "domain":"dashboard", "tags":["chart","dataviz","pie"],
  "types":["line"], "elements":7 }
```
- `drawlib-find.mjs` 读它做检索;
- `build-drawlib-index.mjs --check` 对比新旧,**序号/数量漂移就非零退出**(可挂 CI / release 校验,防库更新后序号失配)。

## 维护(库有增减时)

1. 加/换 `.excalidrawlib` → 放进 `drawlib/`
2. `node scripts/build-drawlib-index.mjs`(重建 JSON)
3. `node scripts/drawlib-sheet.mjs <库名>`(渲接触表,核对/更新序号)
4. 在本表 + `drawlib-catalog.md` 加一行;裸数组库(无 name)把序号→名补进 `build-drawlib-index.mjs` 的 `NAMES`
