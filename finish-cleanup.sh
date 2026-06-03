#!/usr/bin/env bash
# excali-design · master 分支瘦身 + 提交本次更新
# 用法：在仓库根目录执行  bash finish-cleanup.sh
# 说明：Cowork 的沙箱挂载禁止删除/写 git index，所以这步留给你本机跑。
set -e
cd "$(dirname "$0")"

echo "==> 0. 清掉上次残留的 git 锁（如果有）"
rm -f .git/index.lock

echo "==> 1. 从版本库移除：被新画廊取代的旧示例图 + 开发用 eval 文件（与技能安装无关）"
git rm -q --ignore-unmatch \
  assets/readme/login-flow.png assets/readme/dashboard.png \
  assets/readme/kanban.png assets/readme/architecture.png \
  test-prompts.json test/run-opencode.mjs test/README.md

echo "==> 2. 删掉磁盘上 gitignored 的开发产物（不在分发内，纯本地瘦身；都可再生）"
rm -rf _candidates test/_sheets test/_out
rm -f "excali-design 架构图 v4.png" "excali-design 架构图 v5.png" "excali-design 架构图 v10.png"
# node_modules 可选删除（删后需 npm install 才能跑 scripts）：
# rm -rf node_modules

echo "==> 3. 暂存本次所有改动（README 画廊 / SKILL / references / package.json / 新 SVG / render-formula）"
git add -A

echo "==> 4. 提交"
git commit -m "docs: 用新画廊更新 README(SVG)；落实反slop规则(箭头减法/留白/LaTeX公式/眯眼必做)；新增 render-formula；瘦身 master"

echo "==> 完成。git log -1 看看："
git log -1 --stat | head -40
