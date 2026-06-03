#!/usr/bin/env bash
# 把本 skill 软链到各 agent 的 skills 目录,agent 即可加载。
#
# 用法(在本仓库任意位置跑):
#   bash test/install-skill.sh            # 默认:Claude Code + opencode 都链
#   bash test/install-skill.sh claude     # 只链 Claude Code(~/.claude/skills)
#   bash test/install-skill.sh opencode   # 只链 opencode(~/.config/opencode/skills)
#
# 等价的纯一行(只装 Claude Code):
#   mkdir -p ~/.claude/skills && ln -sfn "$(pwd)" ~/.claude/skills/excali-design
#
# 想一键装到本机所有 agent,也可用社区 CLI(GitHub 当注册表):
#   npx skills add OhBonsai/excali-design -g
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="excali-design"
TARGET="${1:-all}"

link() {  # $1 = 目标 skills 目录
  mkdir -p "$1"
  ln -sfn "$ROOT" "$1/$NAME"      # -sfn:符号链接 + 强制替换 + 不跟随已存在的链接
  echo "✓ $1/$NAME → $ROOT"
}

case "$TARGET" in
  claude)   link "$HOME/.claude/skills" ;;
  opencode) link "$HOME/.config/opencode/skills" ;;
  all)      link "$HOME/.claude/skills"; link "$HOME/.config/opencode/skills" ;;
  *) echo "未知目标:$TARGET(用 claude / opencode / all)"; exit 1 ;;
esac

echo "  验证:ls -l \$HOME/.claude/skills/$NAME && head -1 \$HOME/.claude/skills/$NAME/SKILL.md"
