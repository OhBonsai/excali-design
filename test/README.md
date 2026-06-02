# 用本机 opencode 测这个 skill

`test-prompts.json`(根目录)是 15 条评测用例;`run-opencode.mjs` 用你本机的 opencode 逐条跑、抓产物、自动校验。

## 一、装 skill 到 opencode

opencode 从 `~/.config/opencode/skills/*/SKILL.md` 加载 skill。软链过去即可:

```bash
bash test/install-skill.sh
# 或跑测试时加 --install 自动软链
```

## 二、跑测试

前置:`opencode auth login` 已配好模型;Node 18+;(可选)`npm install` 装 elkjs/playwright 让校验更全。

```bash
# 直接跑(每条新开一次会话)
node test/run-opencode.mjs -m anthropic/claude-sonnet-4-6

# 更快:先起 serve,再 attach(免每次冷启)
opencode serve            # 终端 A
node test/run-opencode.mjs --attach http://localhost:4096 -m anthropic/claude-sonnet-4-6   # 终端 B

# 只跑 mermaid 相关几条
node test/run-opencode.mjs --ids 7,8,9,10,11 -m openai/gpt-5

# 顺手装 skill 再跑
node test/run-opencode.mjs --install -m anthropic/claude-sonnet-4-6
```

每条会:
1. 在 `test/_out/<id>/work/` 里 `opencode run --dir <work> --dangerously-skip-permissions "<prompt>"`;
2. 抓该目录产出的 `.excalidraw / .png / .svg`;
3. 自动跑 `verify.mjs`(结构)+ `arch-lint.mjs`(几何),统计 error 数;
4. 最后出汇总表。

`--dangerously-skip-permissions` 是为了非交互自动跑不卡在权限确认(只在测试目录里用)。

## 三、怎么看结果

- 产物在 `test/_out/<id>/`:`output.txt`(agent 输出)+ `work/`(产出的图)。
- **lint 只查机械错误(重叠/流向反/斜线/缺 binding…),过不代表图好看**——打开 `.excalidraw`(拖进 excalidraw.com)或导出的 PNG **肉眼过**才是判好坏的标准。
- 部分用例(#12 导出、#14 检查这张图)是"针对已有图"的,跑时用 `--seed 某图.excalidraw` 给工作目录预置一张图更合理。

## 四、选项

| 选项 | 说明 |
|---|---|
| `-m/--model provider/model` | 传给 opencode run |
| `--attach <url>` | 接已起的 `opencode serve` |
| `--ids 1,3,5` | 只跑这些用例 |
| `--timeout <sec>` | 每条超时(默认 360) |
| `--out <dir>` | 输出目录(默认 `test/_out`) |
| `--no-eval` | 跳过自动校验 |
| `--install` | 先软链 skill |
| `--seed <a.excalidraw>` | 每个工作目录预置一张图 |

> 说明:测试在你机器上跑(用你的 opencode + 模型 + key)。本仓库不内置模型调用。
