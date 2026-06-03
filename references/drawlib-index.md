# drawlib 分类与索引(一类一库)

> `drawlib/` 共 **11 库 / 402 件**,**一类一库**(`excali-*`)。从社区/基础库**图像识别精挑 + 按分类重组**而来(流程见 `asset-taxonomy.md`,出处见 `manifests/`)。本文件是**分类 taxonomy + 检索入口**;清单/关键序号见 `drawlib-catalog.md`,机器索引见根目录 `drawlib-index.json`。
> 资产优先(原则 #2):画之前**先 find,有就 data-lib 复用,别手画**。

## 三种查法

```bash
node scripts/drawlib-find.mjs pie            # 关键词(名/标签/库/分类)→ 给 data-lib 序号
node scripts/drawlib-find.mjs checkbox button
node scripts/drawlib-find.mjs --cat chart    # 按分类列全部
node scripts/drawlib-find.mjs --lib excali-ui # 按库列全部
node scripts/drawlib-find.mjs --cats         # 看所有分类 + 计数
```
找到后:`<div data-lib="库名:序号">`。**序号会漂移 → 用前 `node scripts/drawlib-sheet.mjs <库名>` 渲接触表核对。**

## 分类(11 类 = 11 库,一一对应)

| 分类 category | 库 | 件 | 用在 |
|---|---|---|---|
| `ui-control` | `excali-ui` | 111 | 登录/表单/设置/看板:控件 + 卡片/表格/标签/侧栏 |
| `cloud-icon` | `excali-cloud` | 56 | 架构图:AWS/Azure/GCP + 抽象原语 |
| `tech-icon` | `excali-tech` | 51 | 架构图:技术栈 logo + DevOps 图标 |
| `flowchart-shape` | `excali-shape` | 44 | 流程图/状态机/UML/ER/BPMN/数据结构/图论 |
| `template` | `excali-template` | 37 | deck 幻灯片 + 商业画布 + Wardley/TeamTopo + 协作板 |
| `chart` | `excali-chart` | 32 | Dashboard 图表占位(配 `data-chart`) |
| `person` | `excali-person` | 17 | actor/角色 + 对话气泡 + 机器人 |
| `ml` | `excali-ml` | 16 | ML/DL 概念块 + 工具 logo |
| `net-device` | `excali-net` | 16 | 网络/设备/安全 + 位置/机柜 |
| `math-symbol` | `excali-symbol` | 15 | 公式/逻辑符号 |
| `frame` | `excali-frame` | 7 | 浏览器 + 手机/平板/手表/笔记本外壳 |

## 按「要画什么」反查

| 要画 | find | 备选(社区,见 `community-libraries.md`) |
|---|---|---|
| 登录/表单/设置/看板 | `--cat ui-control`(+ `--cat frame`) | Lo-Fi Wireframing Kit |
| Dashboard / 数据页 | `--cat chart`(+ `data-chart` 数据驱动) | Charts / Graphs |
| 软件架构 / 部署 | `--cat cloud-icon` + `--cat tech-icon` + `--cat net-device` | 各云官方 icon 套件 |
| 流程图 / 状态机 / UML/ER | `--cat flowchart-shape` | System Design / bpmn |
| 用户旅程 / 时序 actor | `--cat person` | Robots / Storytelling |
| 汇报 deck / 战略 / 协作板 | `--cat template` | Presentation Templates |
| 公式 / ML / 算法 | `--cat math-symbol` + `--cat ml` | Deep learning / Algorithms |

## 机器索引 `drawlib-index.json`

`node scripts/build-drawlib-index.mjs` 生成。每条:`{ id:"excali-chart:28", lib, index, name:"Pie", category:"chart", domain, tags, types, elements }`。
- `drawlib-find.mjs` 读它检索;
- `build-drawlib-index.mjs --check` 对比新旧,**序号/数量漂移就非零退出**(可挂 CI / release)。

## 维护

加/换/精挑库 → 写 `manifests/<库>.json`(`include` 整库并入 / `items` 逐件精挑)→ `node scripts/assemble-lib.mjs manifests/<库>.json` → `build-drawlib-index.mjs`(重建)→ `drawlib-sheet.mjs <库>`(核对序号)→ 更新本表 + `drawlib-catalog.md`。完整 pick 流程见 `asset-taxonomy.md`。
