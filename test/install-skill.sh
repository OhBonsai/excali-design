#!/usr/bin/env bash
# 把本 skill 软链到 opencode 的 skills 目录,opencode 即可加载
# (opencode 从 ~/.config/opencode/skills/*/SKILL.md 加载;也读 ~/.claude/skills、.opencode/skills)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.config/opencode/skills/excali-design"
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
ln -s "$ROOT" "$DEST"
echo "✓ 软链:$DEST → $ROOT"
echo "  验证:ls $DEST/SKILL.md"
