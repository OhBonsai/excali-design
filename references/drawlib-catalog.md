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
- 老格式库(data-viz / dev_ops / forms)的 `libraryItems` 元素可能是**裸 element 数组**(无 name),按**序号**取用;下方给了每号的语义。
- 复用时**重新生成 id**(避免和画布其他元素撞 id),保持组内相对坐标不变,整体平移。
- 复用后仍要遵循 `anti-slop.md`(别因为库里有就全堆上去)。

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

32 种图表的手绘版,做 dashboard 原型/数据页时当图表 placeholder:

Bar / Stacked bar / 100% stacked bar / Grouped bar / Column(同 4 变体)/ Line / Area / Stacked area / ThemeRiver / Scatter / Bubble / Cartesian heatmap / Calendar heatmap / Tree Map / Waterfall / Dot strip plot(+ multi-strip / jitter)/ Column Histogram / Population pyramid / Density plot / Box & Whisker / Violin / Pie / Donut / Polar Area(Nightingale)

> 原型里要表达「这里有个柱状图」→ 取 data-viz 的 Bar,而不是手画。

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
