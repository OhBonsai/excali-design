# excali-design 评测：场景矩阵 + 方法迭代

目的：用 opencode + aliyuntokenplan 模型，自动加载技能、跑一大批手绘图场景、出效果图，**并排成矩阵**，从而看出"改 thinking.md 里哪条方法、哪些场景变好了"。

## 两个矩阵（轴要分清）

- **方法迭代矩阵（主）**：行 = case，列 = 技能变体 `v0 -> v5`（每列多开一个 thinking.md 的方法），**模型固定** `qwen3.7-max`。列与列对比 = 该方法的边际增益。
- **模型矩阵（次）**：行 = case，列 = 5 个模型，技能固定在 `WORKTREE`（当前）。看哪个模型最会执行。

变体定义在 `variants.json`（每个变体 = 一个 git ref；建议每条方法一个 commit/分支，这就是"小步迭代"）。

## 场景目录（`cases.jsonl`，~62 个，九大类）

| 类 | 前缀 | 数量 | 覆盖 |
|---|---|---|---|
| 软件架构 | ARCH | 14 | 三层/C4/部署/EDA/Serverless/ETL/CICD/缓存/SSO/分片/RAG/服务网格 |
| 流程时序状态 | FLOW | 9 | 调用链/HTTPS/OAuth 时序、订单/TCP 状态机、审批/故障树/Saga/限流 |
| 数据模型 | MODEL | 3 | ER / UML 类图 / 依赖图 |
| 技术科普 | EXPL | 12 | Transformer/CAP/布隆/一致性哈希/Raft/LSM/握手/容器vsVM/GC/CNN… |
| 日常信息图 | INFO | 6 | 咖啡因/睡眠/复利/水循环/信用卡/番茄钟 |
| 数据图表 | CHART | 5 | 对比/营收/漏斗/雷达/甘特 |
| 产品原型 | PROTO | 6 | SaaS多屏/登录/移动首页/仪表盘/详情页/空状态 |
| 信息架构 | IA | 7 | 站点地图/思维导图/旅程图/商业画布/看板/路线图/组织架构 |
| 对抗边界 | ADV | 6 | 模糊巨大/真实证据/长文抽骨干/矛盾需求/纯列表/读真仓库 |

每个 case 带 `cat`、`complexity`(S/M/L/overflow)、`path`(应触发的 dispatch 路径)、`witnesses`(它见证的 thinking.md 方法)、`focus`(评判焦点)。**改某条方法，看它 witnesses 命中的 case 有没有变好。**

## 跑法（全 Node + @opencode-ai/sdk 并发）

并发模型：**变体(列)之间串行**(切技能软链，全局只能激活一个版本)，**同一变体内所有 case 并发**(case 互相独立)。编排器 `eval/run.mjs` 用官方 `@opencode-ai/sdk`：`createOpencode()` 拉起/连接服务，`session.create({directory})` 把每个 case 绑到自己的输出目录，`session.prompt(...)` 跑完才 resolve，天然并发。

全部在**仓库根目录**跑（别 cd 进 eval，否则路径会变成 eval/eval/...）：

```bash
npm i --prefix eval        # 装 @opencode-ai/sdk（一次）

# 0) 小规模验证（3 个代表性 case，全变体，并发 4）
node eval/run.mjs method --only "ARCH01-ha-ecommerce EXPL01-transformer ADV01-vague-huge" --conc 4
node eval/report.mjs method && open eval/report-method.html   # ★一页看全:行=场景 列=变体 每格图+lint+评判标准
node eval/montage.mjs method        # (可选)拼成单张 PNG eval/matrix-method.png

# 1) 全量方法矩阵（62 case × 6 变体，模型固定 qwen3.7-max）
node eval/run.mjs method --conc 8
node eval/montage.mjs method

# 2) 模型矩阵（62 case × 5 模型，变体=当前）
node eval/run.mjs model --conc 8
node eval/montage.mjs model
```

服务：默认 run.mjs 自己用 SDK 拉起 `opencode serve`(端口4096)，跑完关掉。若你已手动 `opencode serve`，设环境变量复用：

```bash
OPENCODE_URL=http://127.0.0.1:4096 node eval/run.mjs method --conc 8
```

依赖：`@opencode-ai/sdk`(eval/npm i)、`opencode`(在 PATH)、`git`、`node`、ImageMagick(`montage`/`convert`)。技能已软链到 `~/.config/opencode/skills/excali-design`。(`run.sh` 已废弃。)

## 成本与建议

- 组合会爆：62 × 6 = 372 次 agent 会话（方法矩阵）。**先按 `complexity` 或 `cat` 子集跑**（run.sh 第二参可传 case id 列表），验证有效再扩。
- 建议先用一个**代表性子集**（每类挑1-2个，约 12 个）跑全变体，快速看趋势，再对有争议的方法做全量。

## 文件

- `cases.jsonl` — 62 个场景，带 cat/complexity/path/witnesses/focus。
- `variants.json` — 方法迭代矩阵的列(git ref) + 模型矩阵的模型。
- `run.mjs` — 并发编排器(@opencode-ai/sdk)；变体间串行切软链、变体内 case 并发。
- `montage.mjs` — 组装带 lint 分数标注的矩阵 PNG。
- `package.json` — 仅一个依赖 `@opencode-ai/sdk`。

需你确认：`opencode` 在 PATH 且 aliyuntokenplan 已配好 key（你已配）；模型 id 形如 `aliyuntokenplan/qwen3.7-max`(run.mjs 自动拆成 providerID/modelID)。session 绑定的 `directory` 即 case 输出目录，技能会把 out.excalidraw/out.png 写在那里。

## 评分（矩阵格下的数字）

每格已自动跑 `arch-lint --json` 取 `err/warn` 数标在缩略图下。
待补：`hierarchy-lint`（§6.5 的知觉层 lint：saliency 熵/眯眼存活/视觉权重 vs 声明 hero），补上后每格就能同时显示"几何 + 知觉"两类分数，矩阵直接告诉你哪格更好。
