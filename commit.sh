#!/usr/bin/env bash
# 提交助手:清理可能残留的 git lock(某些挂载/同步盘会留 stale lock,导致 git 报
# "Unable to create '.git/index.lock': File exists")→ git add -A → commit →(可选)push。
# 用法:
#   ./commit.sh "提交说明"            # 暂存全部 + 提交
#   ./commit.sh "提交说明" --push     # 提交后推送到 origin 当前分支
set -euo pipefail
cd "$(dirname "$0")"

# 清理 stale lock(本地 rm 正常;若是只读挂载会忽略错误)
rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock 2>/dev/null || true

msg="${1:-update}"
git add -A
if git diff --cached --quiet; then
  echo "没有要提交的改动。"
  exit 0
fi
git commit -m "$msg"
echo "✓ committed: $(git log --oneline -1)"

if [[ "${2:-}" == "--push" ]]; then
  branch="$(git branch --show-current)"
  git push origin "$branch"
  echo "✓ pushed → origin/$branch"
else
  echo "推送: git push origin $(git branch --show-current)"
fi
