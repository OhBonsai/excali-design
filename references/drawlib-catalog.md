# drawlib 组件库目录

> `drawlib/` 下有 7 个 `.excalidrawlib`,共 ~185 个现成组件。**能复用的绝不手绘**(SKILL.md 原则 #2)。
> 本文件是清单 + 取用方法;具体每个 item 的 elements 在对应 `.excalidrawlib` 里。

## 取用方法(3 步)

```python
import json
lib = json.load(open('drawlib/basic-ux-wireframing-elements.excalidrawlib'))
items = lib['libraryItems']            # 每个 item 有 name + elements
item = next(i for i in items if i.get('name') == 'Filled button (text only)')
els = item['elements']                 # 这就是该组件的 Excalidraw 元素
# 平移到目标位置:给每个 el 的 x/y 加偏移,重新生成 id/groupIds,再放进 create_view
```

注意:
- 库根键不统一:`data-viz` / `forms` 用 `library`,其余用 `libraryItems`——读的时候 `j.library || j.libraryItems`。
- 部分库 item 是**裸 element 数组**(无 name),按**序号**取用;下方给了每号语义。
- 复用时**重新生成 id**(避免撞 id),保持组内相对坐标不变,整体平移。
- 复用后仍要遵循 `anti-slop.md`(别因为库里有就全堆上去)。

## ⭐ 首选取法:`data-lib`(HTML 布局时直接当组件标签)

走 HTML 布局(`html-to-excalidraw.mjs`)时,**不用手抄 elements**——在框上写 `data-lib="库名:序号"`,转换器自动取该 item、缩放贴框、居中、重生成 id:

```html
<div data-lib="basic-ux-wireframing-elements:59"></div>  <!-- Filled button -->
<div data-lib="forms:2"></div>                            <!-- ComboBox -->
<div data-lib="information-architecture:6"></div>         <!-- 决策菱形 -->
<div data-lib="dev_ops:2"></div>                          <!-- 技术图标 -->
<div data-lib="stick-figures:0"></div>                    <!-- actor 小人 -->
<div data-lib="webpage-frames:1"></div>                   <!-- 浏览器外框 -->
```

**序号会随库更新变** → 用前先渲接触表核对:`node scripts/drawlib-sheet.mjs <库名>`(或 `all`)→ 渲 PNG。已存:`test/_sheets/_sheet-*.png`。

### 七个库一句话用途(都能 data-lib)

| 库 | 数量 | 序号根键 | 主要用途 | 接触表 |
|---|---|---|---|---|
| basic-ux-wireframing-elements | 69 | libraryItems | 产品原型主力:按钮/toggle/checkbox/radio/dropdown/slider/搜索/modal/tooltip/help/汉堡菜单/视频播放器/图片占位/文本框/头像/箭头 | `_sheet-basic-ux-...png` |
| data-viz | 32 | library | 图表占位(0=Bar 4=Column 8=Line 10=Area 28=Pie 29=Donut 31=Radar…) | `_sheet-data-viz.png` |
| forms | 26 | library | 表单/设置页:Button/ComboBox(2)/Date picker(3)/Number spinner(4)/checkbox 全状态(13-18)/radio 全状态(19-24)/分段控件(1)/富文本工具条(25) | `_sheet-forms.png` |
| dev_ops | 29 | libraryItems | 架构图技术图标(Docker/K8s/VSCode/Teams/GitLab/HashiCorp 等)+ 建筑/抽象图标——给节点标技术栈 | `_sheet-dev_ops.png` |
| information-architecture | 17 | libraryItems | 流程图/IA 图元:page(0)/file(1)/决策菱形(6)/分支三角(7)/梯形选择(8)/area 容器(12-16)/page stack(3)/cluster(5) | `_sheet-information-architecture.png` |
| stick-figures | 9 | libraryItems | 角色/actor:Stick man(0)/Moustache man/Girl/Guy/Grandma/Child/Shrug/Happy(7)/Sad(8)——用户旅程、时序图小人 | `_sheet-stick-figures.png` |
| webpage-frames | 3 | libraryItems | 浏览器外框:loading(0)/viewable(1)/interactive(2)——网页原型外壳/截图占位 | `_sheet-webpage-frames.png` |

> 选型:**真实数值的图** → `data-chart`;**现成精致组件/图标/外框/小人** → `data-lib`;**这俩都没有** 才用基础元素手拼(守 anti-slop)。

---

## 1. basic-ux-wireframing-elements(69 个)· 产品原型主力库

UI 控件全家桶,画线框/原型时**首选**。含名字,按名取用。

**按钮/动作**:Filled button (text only)、Outlined button (text only)、Disabled filled/outlined button、Confirm/Reject button (text+icon / icon only)、Boxed confirm/reject、Check mark、Cross、Go forward/back arrow、Show more button (circle/boxed)

**输入/表单**:Text field (with text / placeholder)、Search field、Text area (+ placeholder)、Dropdown menu (+ selected / disabled)、Dropdown with options、Search

**选择控件**:Checkbox (text+icon)(+ selected / disabled / selected disabled)、Radio button(同上四态)、Selected checkbox (icon only)、Filled/Outlined slider

**开关**:Boxed toggle (ON/OFF, +text)、Rounded toggle (ON/OFF, +text)

**导航/菜单**:Hamburger menu (text+icon / icon only)、Boxed hamburger、Horizontal/Vertical options (+ in the circle)

**反馈/容器**:Modal、Tooltip (left/right/top/bottom)、Filled/Outlined help (text+icon / icon only)、Videoplayer

**媒体**:Image placeholder (simple / 完整版)、Upload image section、Profile photo、Bulb

> 画一个表单/设置页/登录页时,从这个库取 7-9 成的控件。

## 2. webpage-frames(3 个)· 页面外壳

- `loading webpage` — 带 loading 态的浏览器框
- `viewable webpage` — 静态网页框
- `interactive webpage` — 可交互态网页框

> 原型的「外壳」:先放一个 webpage frame,再往里塞 UX 控件。

## 3. forms(26 个)· 表单控件(细粒度,补充库 1)

按序号语义:0 Button · 1 单选组(One/Two/Three) · 2 ComboBox · 3-4 分隔/数字输入 · 6-8 Button 变体 · 9 加号 · 11 问号 · 13-18 Checkbox 全态(Checkbox/Selected/Indeterminate/Disabled/Disabled selected/Disabled indeterminate) · 19-24 Radio 全态 · 25 富文本工具条(B/style/U/S)

> 库 1 的 checkbox/radio 是「text+icon」整行;这里是**纯控件态**,做控件态对比(全选/半选/禁用)时用。

## 4. information-architecture(17 个)· 流程图/IA 主力

含名字,画流程图/信息架构/决策流的主力库:

`page`、`file`、`flow reference`、`page stack`、`file stack`、`cluster`、`decision point`、`conditional branch`、`conditonal selector`、`concurrent set`、`continuation x`、`continuation y`、`area`、`iterative area`、`conditional area`、`flow area x`、`flow area y`

> 画用户流程、站点地图、决策树时用 page/file/decision point/conditional branch。

## 5. dev_ops(29 个)· 架构图图标库 · 软件架构主力

29 个 DevOps/基础设施图标(无文字标签,按序号取用,多为 server/cloud/container/db/network 类符号)。**画软件架构图、部署拓扑时**的节点图标来源。

> ⚠️ 这些 item 无 name,需要时先用脚本把 29 个各渲染一遍截图建一个视觉索引(后续 demo 任务),再按序号引用。架构图给节点配图标 = 用这个库;纯逻辑框不配(anti-slop)。

## 6. data-viz(32 个)· 图表占位 · Dashboard 原型用

32 种图表的手绘版,做 dashboard 原型/数据页时当图表 placeholder。**无 name,按序号取**(序号经接触表核对):

| # | 图 | # | 图 | # | 图 | # | 图 |
|---|---|---|---|---|---|---|---|
| 0 | Bar(横条) | 8 | Line(多线) | 16 | Bubble | 24 | Population pyramid |
| 1 | Stacked bar | 9 | Line+markers | 17 | Calendar heatmap | 25 | Density plot |
| 2 | 100% stacked bar | 10 | Area | 18 | Cartesian heatmap | 26 | Box & Whisker |
| 3 | Grouped bar | 11 | Stacked area | 19 | Tree Map | 27 | Violin |
| 4 | Column(竖柱) | 12 | Stacked area 2 | 20 | Waterfall | 28 | **Pie** |
| 5 | Stacked column | 13 | Area 2 | 21 | Dot strip | 29 | **Donut** |
| 6 | 100% stacked column | 14 | ThemeRiver | 22 | Dot strip multi | 30 | Polar/Nightingale |
| 7 | Grouped column | 15 | Scatter | 23 | Column histogram | 31 | Radar(spider) |

> 接触表自查:`test/_opus/_dataviz-sheet.png`(序号变了就重渲染核对)。

**两种用法**(都不手画):
- **要真实数据** → 用 `data-chart`(转换器按数值生成):`<div data-chart="bar|line|pie|donut" data-values="App:130,小程序:90,H5:60">`。
- **只要「这里有个图」占位**(更精致的手绘成品)→ 用 `data-lib` 直接实例化本库:`<div data-lib="data-viz:0">`(Bar)、`data-viz:8`(Line)、`data-viz:31`(Radar)。转换器自动缩放贴合框、居中、重生成 id。

`data-lib` 不止图表——**任意库任意组件**都能这么调:`data-lib="basic-ux-wireframing-elements:3"`、`data-lib="dev_ops:12"`。把 drawlib 当 HTML 里的"组件标签"用。

## 7. stick-figures(9 个)· 人物/角色

`Stick man`、`Moustache man`、`Girl`、`Guy`、`Grandma`、`Child`、`Shrug`、`Happy`、`Sad`

> 画用户旅程、角色、actor(时序图/用例图的小人)时用。比手画火柴人强。

---

## 速查:画什么 → 用哪个库

| 你要画 | 首选库 |
|---|---|
| 登录页/设置页/表单原型 | 1 UX 控件 + 2 网页框 |
| 控件态对比(选中/禁用) | 3 forms |
| 用户流程/站点地图/决策树 | 4 information-architecture |
| 软件架构/部署拓扑 | 5 dev_ops(图标)+ 基础元素(框) |
| Dashboard/数据页原型 | 6 data-viz + 1 UX 控件 |
| actor/用户/角色 | 7 stick-figures |
