#!/usr/bin/env node
/**
 * frames-to-video.mjs · PNG 序列 → MP4 (+ 可选 GIF)  (绘图刷新动画 · 导出路径 B 第 2 步)
 *
 * 把 render-frames.mjs 输出的 frame-*.png 用 ffmpeg 合成视频。纯 Node(无 python/bash)。
 *
 * 用法:
 *   node scripts/frames-to-video.mjs <png-dir> [--fps 30] [--out anim.mp4] [--gif] [--gif-width 960] [--hold 1.0]
 *   (--flag value 与 --flag=value 两种写法都支持)
 *
 * 参数:
 *   <png-dir>        含 frame-001.png frame-002.png ... 的目录
 *   --fps <n>        输出帧率,默认 30
 *   --out <path>     输出 MP4,默认 <png-dir>/../anim.mp4
 *   --gif            额外输出 palette 优化 GIF
 *   --gif-width <n>  GIF 缩放宽度,默认 960
 *   --hold <sec>     每帧停留秒数,默认 1.0(输入帧率 = 1/hold,再用 fps 滤镜上采样)
 *
 * 依赖:ffmpeg(系统二进制)。Node 18+。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const a = { fps: 30, gif: false, gifWidth: 960, hold: 1.0, _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null;
    const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    switch (t) {
      case '--fps': a.fps = parseFloat(next()); break;
      case '--out': a.out = next(); break;
      case '--gif': a.gif = true; break;
      case '--gif-width': a.gifWidth = parseInt(next()); break;
      case '--hold': a.hold = parseFloat(next()); break;
      case '--help': case '-h': a.help = true; break;
      default:
        if (t.startsWith('--')) { console.error('未知参数:', t); process.exit(1); }
        a._.push(t);
    }
  }
  return a;
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) { console.error('ffmpeg 失败'); process.exit(r.status || 1); }
}

function main() {
  const a = parseArgs(process.argv);
  const pngDir = a._[0];
  if (a.help || !pngDir) {
    console.error('用法: node frames-to-video.mjs <png-dir> [--fps 30] [--out anim.mp4] [--gif] [--hold 1.0]');
    process.exit(a.help ? 0 : 1);
  }
  if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
    console.error('需要 ffmpeg(系统二进制)。macOS: brew install ffmpeg'); process.exit(1);
  }
  const out = a.out || path.join(path.dirname(pngDir), 'anim.mp4');
  const inputFr = 1.0 / a.hold;
  console.log(`PNG 目录: ${pngDir} · fps: ${a.fps} · hold: ${a.hold}s · 输出: ${out}`);

  // 合成 MP4:输入帧率 1/hold,fps 滤镜上采样,尺寸补偶
  ffmpeg([
    '-framerate', String(inputFr),
    '-pattern_type', 'glob', '-i', path.join(pngDir, 'frame-*.png'),
    '-vf', `fps=${a.fps},scale=trunc(iw/2)*2:trunc(ih/2)*2`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', out,
  ]);
  console.log('✓ MP4:', out);

  // 可选 GIF(两遍 palette)
  if (a.gif) {
    const gifOut = out.replace(/\.mp4$/i, '') + '.gif';
    const palette = path.join(os.tmpdir(), `pal_${Date.now()}.png`);
    ffmpeg(['-i', out, '-vf', `fps=15,scale=${a.gifWidth}:-1:flags=lanczos,palettegen=stats_mode=diff`, palette]);
    ffmpeg(['-i', out, '-i', palette,
      '-lavfi', `fps=15,scale=${a.gifWidth}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`,
      gifOut]);
    fs.rmSync(palette, { force: true });
    console.log('✓ GIF:', gifOut);
  }
}

main();
