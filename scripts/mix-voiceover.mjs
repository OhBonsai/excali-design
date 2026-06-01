#!/usr/bin/env node
/**
 * mix-voiceover.mjs · 把人声(主轨)+ 可选 BGM 混入 MP4。纯 Node(无 python/bash)。
 *
 * 用法:
 *   node scripts/mix-voiceover.mjs <video.mp4> --voiceover <v.mp3> [--bgm <b.mp3> | --bgm-mood <name>] [选项]
 *   (--flag value 与 --flag=value 都支持)
 *
 * 选项:
 *   --voiceover <path>   人声主轨(必填)
 *   --bgm <path>         自定义 BGM(覆盖 --bgm-mood)
 *   --bgm-mood <name>    预设 BGM(assets/bgm-<name>.mp3)
 *   --bgm-volume <0-1>   BGM 静态音量,默认 0.18
 *   --voice-volume <0-2> 人声音量倍率,默认 1.0
 *   --no-ducking         关闭 sidechain ducking(默认开:人声响时 BGM 让路)
 *   --out <path>         输出,默认 <input>-voiced.mp4
 *
 * 依赖:ffmpeg。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');

function parseArgs(argv) {
  const a = { bgmVolume: '0.18', voiceVolume: '1.0', ducking: true, _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null;
    const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    switch (t) {
      case '--voiceover': a.voiceover = next(); break;
      case '--bgm': a.bgm = next(); break;
      case '--bgm-mood': a.bgmMood = next(); break;
      case '--bgm-volume': a.bgmVolume = next(); break;
      case '--voice-volume': a.voiceVolume = next(); break;
      case '--no-ducking': a.ducking = false; break;
      case '--out': a.out = next(); break;
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
  const input = a._[0];
  if (a.help || !input || !fs.existsSync(input)) {
    console.error('用法: node mix-voiceover.mjs <video.mp4> --voiceover <v.mp3> [--bgm-mood <name>] [--no-ducking]');
    process.exit(a.help ? 0 : 1);
  }
  if (!a.voiceover || !fs.existsSync(a.voiceover)) { console.error('✗ 缺 --voiceover <path>'); process.exit(1); }
  let bgm = a.bgm || (a.bgmMood ? path.join(ASSETS, `bgm-${a.bgmMood}.mp3`) : null);
  if (bgm && !fs.existsSync(bgm)) { console.error('✗ BGM 不存在:', bgm); process.exit(1); }
  const out = a.out || input.replace(/\.[^.]+$/, '') + '-voiced.mp4';

  console.log(`─ mix-voiceover ─ 人声 ${a.voiceover}(vol=${a.voiceVolume})` +
    (bgm ? ` · BGM ${path.basename(bgm)}(vol=${a.bgmVolume}, ducking=${a.ducking})` : ' · 无 BGM') + ` → ${out}`);

  const common = ['-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out];
  if (!bgm) {
    ffmpeg(['-i', input, '-i', a.voiceover, '-filter_complex', `[1:a]volume=${a.voiceVolume}[a]`, ...common]);
  } else if (a.ducking) {
    ffmpeg(['-i', input, '-i', a.voiceover, '-i', bgm, '-filter_complex',
      `[1:a]volume=${a.voiceVolume}[voice];` +
      `[2:a]volume=${a.bgmVolume},aloop=loop=-1:size=2e9[bgm_lo];` +
      `[bgm_lo][voice]sidechaincompress=threshold=0.04:ratio=8:attack=5:release=300:makeup=1[bgm_ducked];` +
      `[voice][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=0,afade=t=out:st=0:d=0.5:curve=tri[a]`,
      ...common]);
  } else {
    ffmpeg(['-i', input, '-i', a.voiceover, '-i', bgm, '-filter_complex',
      `[1:a]volume=${a.voiceVolume}[voice];` +
      `[2:a]volume=${a.bgmVolume},aloop=loop=-1:size=2e9[bgm];` +
      `[voice][bgm]amix=inputs=2:duration=first:dropout_transition=0[a]`,
      ...common]);
  }
  console.log('✓ Done:', out);
}

main();
