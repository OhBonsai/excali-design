#!/usr/bin/env bash
# frames-to-video.sh · PNG 序列 → MP4 (+ 可选 GIF)  (绘图刷新动画 · 导出路径 B 第 2 步)
#
# 把 render-frames.mjs 输出的 frame-*.png 用 ffmpeg 合成视频。
#
# 用法:
#   bash scripts/frames-to-video.sh <png-dir> [--fps 30] [--out anim.mp4] [--gif] [--gif-width 960] [--hold N]
#
# 参数:
#   <png-dir>        含 frame-001.png frame-002.png ... 的目录
#   --fps <n>        输出帧率,默认 30(逐帧累加动画 12-30 帧时,配合 --hold 控制每帧停留)
#   --out <path>     输出 MP4 路径,默认 <png-dir>/../anim.mp4
#   --gif            额外输出 palette 优化 GIF(发社媒用)
#   --gif-width <n>  GIF 缩放宽度,默认 960
#   --hold <sec>     每帧停留秒数(逐帧揭示动画的节奏);默认 1.0
#                    例:12 帧 reveal,每帧停 0.9 秒 → --hold 0.9,总时长 ≈ 10.8s
#
# 行为:
#   - 输入帧率 = 1/hold(每帧占 hold 秒),再用 fps 滤镜上采样到 --fps 平滑输出
#   - libx264 yuv420p 输出(宽容兼容),尺寸补偶(H.264 要求)
#   - GIF 两遍 palette(palettegen stats_mode=diff + paletteuse bayer dither)
#
# 后续:bash scripts/add-music.sh anim.mp4 --mood=educational  # 加 BGM/SFX
#
# 依赖:ffmpeg(brew install ffmpeg)
# 状态:🚧 SCAFFOLD —— 参数解析 + ffmpeg 命令就位,建议产出首个真实帧序列后联调。
set -e

PNG_DIR=""
FPS=30
OUT=""
MAKE_GIF=0
GIF_WIDTH=960
HOLD=1.0   # 每帧停留秒数

# 同时支持 --flag value 与 --flag=value 两种写法(与 add-music.sh 一致)
while [ $# -gt 0 ]; do
  case "$1" in
    --fps=*)       FPS="${1#*=}"; shift ;;
    --fps)         FPS="$2"; shift 2 ;;
    --out=*)       OUT="${1#*=}"; shift ;;
    --out)         OUT="$2"; shift 2 ;;
    --gif)         MAKE_GIF=1; shift ;;
    --gif-width=*) GIF_WIDTH="${1#*=}"; shift ;;
    --gif-width)   GIF_WIDTH="$2"; shift 2 ;;
    --hold=*)      HOLD="${1#*=}"; shift ;;
    --hold)        HOLD="$2"; shift 2 ;;
    --*) echo "未知参数: $1" >&2; exit 1 ;;
    *) if [ -z "$PNG_DIR" ]; then PNG_DIR="$1"; fi; shift ;;
  esac
done

[ -z "$PNG_DIR" ] && { echo "用法: bash frames-to-video.sh <png-dir> [--fps 30] [--out anim.mp4] [--gif] [--hold N]"; exit 1; }
[ -z "$OUT" ] && OUT="$(dirname "$PNG_DIR")/anim.mp4"

command -v ffmpeg >/dev/null 2>&1 || { echo "需要 ffmpeg。brew install ffmpeg"; exit 1; }

echo "PNG 目录: $PNG_DIR · fps: $FPS · hold: $HOLD · 输出: $OUT"

# ── 合成 MP4 ──────────────────────────────────────────────────────────
# 输入帧率 = 1/hold(每帧占 hold 秒);fps 滤镜上采样到 --fps 平滑输出;尺寸补偶
INPUT_FR=$(python3 -c "print(1.0/float('${HOLD}'))" 2>/dev/null || awk "BEGIN{print 1.0/${HOLD}}")
ffmpeg -y -framerate "$INPUT_FR" -pattern_type glob -i "$PNG_DIR/frame-*.png" \
  -vf "fps=${FPS},scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -c:v libx264 -pix_fmt yuv420p -preset medium "$OUT"
echo "✓ MP4: $OUT"

# ── 可选 GIF(palette 优化)────────────────────────────────────────────
if [ "$MAKE_GIF" -eq 1 ]; then
  GIF_OUT="${OUT%.mp4}.gif"
  PALETTE="$(mktemp -u).png"
  ffmpeg -y -i "$OUT" -vf "fps=15,scale=${GIF_WIDTH}:-1:flags=lanczos,palettegen=stats_mode=diff" "$PALETTE"
  ffmpeg -y -i "$OUT" -i "$PALETTE" \
    -lavfi "fps=15,scale=${GIF_WIDTH}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
    "$GIF_OUT"
  rm -f "$PALETTE"
  echo "✓ GIF: $GIF_OUT"
fi
