# 产品原型工作流(v1 主干)

> 用 Excalidraw 画产品原型 / 线框图 / UI mockup 的完整流程。
> 核心:**复用 drawlib 控件 + 网格对齐 + 诚实 placeholder + 先骨架后细节**。

## 0. 先决定保真度(lo-fi / mid-fi)

Excalidraw 原型**不追求像素完美**——那是 huashu-design 的 HTML hi-fi 的活。Excalidraw 的甜区是:

| 保真度 | 长什么样 | 何时用 |
|---|---|---|
| **lo-fi 线框** | 灰块 + 占位文字 + 手绘控件,`roughness: 1` | 早期探讨布局/流程,要的就是「未定稿」的亲和感 |
| **mid-fi 原型** | 复用 drawlib 控件、真实文案、克制配色、对齐网格 | 评审、和工程对齐、给 PM 看交互流程 |

需求模糊默认 **mid-fi**。用户说「随便画个草图」→ lo-fi。**不要在 Excalidraw 里硬怼 hi-fi**(违和且费时,该用 huashu-design)。

## 1. 探索上下文(原型版原则 #1)

按优先级找参照:
1. 现有产品截图 / Figma / design system → 提炼布局规律、控件清单、文案口吻
2. 竞品参考(用户给 URL/截图)
3. 代码库里的页面结构(`routes/` `pages/` `components/`)→ 知道有哪些屏、哪些控件
4. 都没有 → 列方向让用户选(落地页 / 表单页 / Dashboard / 列表-详情),再开工

## 2. 布局四问(每屏开工前必答)

- **这屏的任务**:用户来这屏要完成什么?(决定哪个控件是主角)
- **信息层级**:主操作 / 次操作 / 辅助信息的三级划分?
- **屏的类型**:表单 / 列表 / 详情 / Dashboard / 引导?(决定骨架模板,见下)
- **多屏关系**:单屏还是流程?流程的话屏间怎么连?(overview 平铺 vs flow 箭头串联)

## 3. 骨架模板(常见屏型的起手布局)

用 webpage-frame 当外壳,先摆**骨架灰块**,再填 drawlib 控件。

**表单页**:顶部标题 → 字段组(label + Text field,纵向 stack,字段左对齐同一 x)→ 底部主按钮(Filled button)+ 次按钮(Outlined button)。字段从 `drawlib` 库1 取。

**列表页**:顶栏(Search field + Hamburger menu)→ 列表项(重复行:Image placeholder + 文字两行 + Go forward arrow),行高一致、y 等距。

**详情页**:Hero(Image placeholder 大)→ 标题/元信息 → 正文占位 → 底部动作条(Confirm/Reject)。

**Dashboard**:顶栏 → 指标卡行(2-4 个等宽框 + 大数字 placeholder)→ 图表区(data-viz 库取 Bar/Line/Donut)→ 表格占位。**高密度型**:每屏 ≥ 3 处真实信息(别只放一个图表)。

**引导/空状态**:居中 Bulb/Image placeholder + 一句话标题 + 主按钮。留白是设计,不填满。

## 4. 多屏交付形态(先问用户要哪种)

| 形态 | 何时用 | 做法 |
|---|---|---|
| **Overview 平铺** | 看全貌 / 比布局 / 走查一致性 | 所有屏并排,每屏一个 webpage-frame,横向 gap 一致,屏上方加灰色斜体 label |
| **Flow 串联** | 演示一条用户路径 | 屏按流程横排,屏间用 arrow 连(标注触发动作:「点击登录」),箭头 binding 到屏框 |

**路由**:出现「平铺/所有页面/看一眼/比较」→ overview;「流程/走一遍/路径」→ flow。不确定就问,别默认挑费工的。

## 5. 复用 drawlib(强制,见 drawlib-catalog.md)

- 控件 9 成从 `basic-ux-wireframing-elements`(库1)取
- 页面外壳从 `webpage-frames`(库2)
- 控件态对比从 `forms`(库3)
- 图表占位从 `data-viz`(库6)
- 角色/actor 从 `stick-figures`(库7)

**手绘只发生在库里没有的东西**(特定布局容器、自定义组合)。

## 6. 对齐与网格(原型最容易翻车处)

- 所有元素 x/y 吸附到 **20px 网格**
- 同一纵向 stack 的控件**左边缘对齐同一 x**
- 同一横向 row 的控件**顶边对齐同一 y**、等距 gap
- 屏与屏之间 gap 一致
- 字段 label 和输入框的间距全屏统一
- **不对齐 = 业余**,这是 mid-fi 和「AI 随手画」的最大区别

## 7. 配色(原型版,见 color-system.md)

- 主体 `#1e1e1e` 描边 + `transparent`/白底
- **一个** accent 色贯穿主操作(主按钮、当前选中态)——别每个按钮一个色
- 禁用态用 `#868e96` 灰
- 状态:成功 `#2f9e44` / 错误 `#e03131`,只在真表达状态时用
- 全屏 ≤ 3 色

## 8. Junior pass → Full pass

**Junior pass**(先 show):webpage-frame 外壳 + 灰块占位 + 关键 label + `<!-- 主按钮待定 -->` 注释式 placeholder。用 create_view 渲染,问用户「布局这样对吗」。

**Full pass**(确认后):替换灰块为 drawlib 真控件、填真实文案、上 accent 色、对齐网格、多屏连流程。做到一半再 show。

## 9. 验证(交付前,见 verification.md)

- 元素无意外重叠
- 控件取自库且平移后无变形
- 全屏对齐网格、同层对齐
- 配色 ≤ 3 色
- 多屏 flow 的箭头 binding 正确、方向一致
- placeholder 都是诚实的(没有编造的假数据冒充真内容)

## 10. (可选)让原型动起来

原型流程可做成动画(onboarding 演示、交互流程讲解)→ 走 `animation-pipeline.md`:
- 累加式:一屏一屏长出来,讲清流程顺序
- 替换式:同一屏内做「点击 → 状态切换」(按钮按下、弹出 Modal、toggle 翻转)
- hero:让用户路径上的「光标」或「高亮框」当 hero 贯穿全程
