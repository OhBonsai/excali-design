#!/usr/bin/env node
/**
 * add-music.mjs · 给 MP4 混入场景化 BGM。纯 Node(无 python/bash)。
 *
 * 用法:
 *   node scripts/add-music.mjs <input.mp4> [--mood tech] [--music <path>] [--out <path>]
 *   (--flag value 与 --flag=value 都支持;旧式位置参数 <input> [music] [out] 仍可用)
 *
 * mood 预设(assets/bgm-<mood>.mp3):tech(默认) / ad / educational(-alt) / tutorial(-alt)
 *
 * 行为:BGM 裁到视频长度,0.3s 淡入 + 1.0s 淡出;视频流 copy 不重编码,音频 AAC 192k。
 * 依赖:ffmpeg + ffprobe。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');

function parseArgs(argv) {
  const a = { mood: 'tech', _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null;
    const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    switch (t) {
      case '--mood': a.mood = next(); break;
      case '--music': a.music = next(); break;
      case '--out': a.out = next(); break;
      case '--help': case '-h': a.help = true; break;
      default:
        if (t.startsWith('--')) { console.error('未知参数:', t); process.exit(1); }
        a._.push(t);
    }
  }
  return a;
}

const moods = () => fs.readdirSync(ASSETS).filter(f => /^bgm-.*\.mp3$/.test(f)).map(f => f.slice(4, -4)).join(' ');

function ffprobeDuration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8' });
  return parseFloat((r.stdout || '').trim());
}

function main() {
  const a = parseArgs(process.argv);
  const input = a._[0];
  const music0 = a.music || a._[1];
  const out0 = a.out || a._[2];
  if (a.help || !input || !fs.existsSync(input)) {
    console.error(`用法: node add-music.mjs <input.mp4> [--mood ${a.mood}] [--music <path>] [--out <path>]`);
    console.error('可用 mood:', moods());
    process.exit(a.help ? 0 : 1);
  }
  const music = music0 ? music0 : path.join(ASSETS, `bgm-${a.mood}.mp3`);
  if (!fs.existsSync(music)) {
    console.error('✗ BGM 未找到:', music, '\n  可用 mood:', moods());
    console.error('  (音频在 all 分支:git checkout all -- assets/bgm-*.mp3)');
    process.exit(1);
  }
  const out = out0 || path.join(path.dirname(path.resolve(input)), path.basename(input, '.mp4') + '-bgm.mp4');
  const dur = ffprobeDuration(input);
  if (!dur) { console.error('✗ 读不到视频时长'); process.exit(1); }
  const fadeOut = Math.max(0, dur - 1);

  console.log(`▸ 混入 BGM:${music0 ? 'custom' : 'mood ' + a.mood} · 时长 ${dur}s → ${out}`);
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error',
    '-i', input, '-i', music,
    '-filter_complex', `[1:a]atrim=0:${dur},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.3,afade=t=out:st=${fadeOut}:d=1[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out,
  ], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) { console.error('ffmpeg 失败'); process.exit(r.status || 1); }
  console.log('✓ Done:', out);
}

main();
