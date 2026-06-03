# 资产需求分类(需求驱动 → 确定分类 → 精挑自建)

> 资产不是"逛库随手拿",而是**从画图需求倒推**:先列我们要画哪些图 → 每类图要哪种资产 → 收敛成确定的资产分类 → 再按分类**逐件视觉精挑**(不整库搬)→ 合并成**自有的一套 `.excalidrawlib`**。
> 本文件是这条链的**规格 + 缺口分析**。确认分类后才进入 pick 阶段。

## 一、图的需求(本 skill 产出哪些图)

| # | 图类型 | 典型场景 |
|---|---|---|
| D1 | 软件架构 / 部署拓扑 | 服务/依赖/数据流、C4、K8s/云部署 |
| D2 | 产品原型 / 线框 | 登录/表单/列表/详情、多屏 flow |
| D3 | 数据看板 / 数据页 | 指标卡 + 图表 |
| D4 | 信息流程 / 状态机 / 决策流 | flowchart、状态机、泳道 |
| D5 | 看板 / 协作板 | kanban 三列、scrum、CJM |
| D6 | 汇报 deck | 标题/章节/KPI/团队整页 |
| D7 | 用户旅程 / 时序 | actor + 阶段 + 情绪 |
| D8 | 商业 / 战略 | 商业模式/价值主张/Wardley/Team Topo |
| D9 | 算法 / ML / 数学 | 数据结构、神经网络、公式符号 |

## 二、需求 → 资产种类(矩阵)

资产种类:**icon**(图标/logo)· **component**(可组合 UI 控件)· **chart**(图表)· **shape**(图元/几何)· **frame**(外壳)· **person**(角色)· **template**(整页/画布)· **symbol**(数学/逻辑符号)· **decoration**(便签/气泡/装饰)· **font**(手绘字体)

| | icon | component | chart | shape | frame | person | template | symbol | decoration | font |
|---|---|---|---|---|---|---|---|---|---|---|
| D1 架构 | ●● 技术/云/网络 | ○ | | ● 框/层 | | ○ | | | | ○ |
| D2 原型 | ● UI affordance | ●● 控件 | | | ●● 设备/网页 | ○ | | | ○ | ○ |
| D3 看板(数据) | ○ | ● 卡片 | ●● | | | | | | | ○ |
| D4 流程 | | | | ●● 图元 | | ○ | | ○ 逻辑 | | ○ |
| D5 看板(协作) | ○ 状态 | ● 卡/头像/标签 | ○ | | | ○ | ○ 板模板 | | ● 便签 | ○ |
| D6 deck | ○ | | ○ | | | ○ | ●● 整页 | | ○ | ○ |
| D7 旅程/时序 | ○ | | | ○ | | ●● | ○ | | ● 气泡 | ○ |
| D8 商业/战略 | | | | ○ | | | ●● 画布 | | ● 便签 | ○ |
| D9 算法/ML/数学 | ● ML logo | | ○ | ●● 结构 | | | | ●● 公式 | | ○ |

●●=核心刚需 · ●=常用 · ○=偶尔

## 三、确定的资产分类(+ drawlib 现状 / 缺口)

收敛矩阵列 → **9 个确定分类**,逐个标现状与缺口(缺口 = 下一步要 pick 的目标):

| 分类 | 覆盖 | 哪些图要 | drawlib 现状 | 缺口 → 来源 |
|---|---|---|---|---|
| **C1 tech-icon** 技术/云图标 | 语言/框架/中间件/AWS/Azure/GCP/K8s/Docker | D1,D9 | `dev_ops`(29,泛、无名) | **大缺**:具体云/技术 logo → 社区 Software Logos / Technology Logos / 各云 |
| **C2 net-device** 网络/设备/安全 | 防火墙/路由/交换/服务器/机柜/VPN | D1 | **空** | **全缺** → Network topology icons / Racks and Servers |
| **C3 ui-control** UI 控件 | 按钮/输入/选择/开关/导航/反馈 | D2,D3,D5 | `basic-ux`(69)+`forms`(26) | 基本够;补 Lo-Fi Kit 视情况 |
| **C4 frame** 外壳/设备 | 浏览器/手机/平板/桌面分辨率 | D2 | `webpage-frames`(3,仅浏览器) | **中缺**:移动/设备框 → Gadgets / Apple Devices |
| **C5 chart** 图表 | 柱/线/饼/面/散点… | D3,D9 | `data-viz`(32)+`data-chart` 生成 | 够 |
| **C6 shape** 流程图元/几何/结构 | page/decision/area/UML/ER/数据结构 | D4,D9 | `information-architecture`(17) | **中缺**:UML/ER、数据结构 → UML-ER / Algorithms |
| **C7 person** 角色 | actor/情绪/机器人 | D5,D7 | `stick-figures`(9) | 够;补气泡 → Bubbles |
| **C8 template** 整页/画布/板 | slide/商业画布/kanban/CJM/Wardley | D6,D8,D5 | `awesome-slides`(16)+`canvases`(2) | **中缺**:Wardley/Team Topo/Scrum/CJM |
| **C9 symbol** 数学/逻辑符号 | ℂ∞∀∃∫∑、逻辑 | D9,D4 | `mathematical-symbols`(15) | 够 |

**额外约定**:
- **font 不入库**:Excalidraw 只有 3 个字体族(Virgil/Normal/Code),由 `design-tokens.md` 映射,**不 vendor 字体**,故不列为 pick 分类。
- **decoration(便签/气泡)**:克制——按 anti-slop,只在 D5/D7/D8 明确需要时少量引入(便签、气泡),不做大批装饰。
- **icon 的 affordance 小图标**(✓/搜索/箭头等):已被 `data-icon`(手绘小形状)+ 反 slop 硬门覆盖,不靠 unicode、不专门 pick。

## 四、挑选与组装流程(确认分类后执行,**不整库搬**)

```
对每个有缺口的分类 Cx:
1. 锁定 1-3 个候选社区库(见 community-libraries.md)
2. node scripts/drawlib-sheet.mjs <候选库>(从社区下载到临时目录后渲接触表)
3. 模型读接触表(图像识别)→ 逐件挑:留"手绘风正、语义清、本分类要"的,弃重复/跑题/风格杂的
4. 把选中的 item 抽出来,归并到自有库 excali-<分类>.excalidrawlib(重生成 id,统一风格)
5. build-drawlib-index.mjs 重建索引;在 catalog/索引登记;标 MIT 出处
```

**自建库命名**(最终形态):按确定分类组织,如
`excali-tech-icon` · `excali-net-device` · `excali-ui` · `excali-frame` · `excali-chart` · `excali-shape` · `excali-person` · `excali-template` · `excali-symbol`
——每个是**精挑后**的合并库,而非某个社区库的整搬。原 `drawlib/` 现有库可逐步并入对应分类。

## 待确认(进入 pick 前)

1. 上面 **9 个分类**对不对?要合并/拆分/增删?
2. 优先级:建议先补 **C1 tech-icon + C2 net-device**(架构图最缺),你同意吗?
3. 自建库是**按分类重组**(推荐,索引干净),还是保留社区库原样只做精选子集?
