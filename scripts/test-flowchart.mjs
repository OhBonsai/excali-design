#!/usr/bin/env node
// flowchart 渲染测试器 —— 让你挑 case / 挑风格快速验证 renderFlowchart 这条路。
// 用法（在技能根目录跑）：
//   node scripts/test-flowchart.mjs                     # 列出所有 case 和风格
//   node scripts/test-flowchart.mjs <case>              # 单 case，默认风格
//   node scripts/test-flowchart.mjs <case> <style>      # 单 case + 指定风格
//   node scripts/test-flowchart.mjs <case> all          # 单 case × 全部风格（拼图）
//   node scripts/test-flowchart.mjs all <style>         # 全部 case × 一个风格
//   node scripts/test-flowchart.mjs all all             # 全矩阵
// 产物：examples/flowchart/out/*.png
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SCRIPTS = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(SCRIPTS, '..');
const CASES_DIR = path.join(ROOT, 'examples/flowchart/cases');
const OUT_DIR = path.join(ROOT, 'examples/flowchart/out');
const RENDER = path.join(SCRIPTS, 'render-flowchart.mjs');
const SVG = path.join(SCRIPTS, 'svg-export.mjs');
const STYLES = ['classic-tricolor', 'hachure-classic', 'pastel-journal', 'duotone-hachure'];

const cases = fs.existsSync(CASES_DIR) ? fs.readdirSync(CASES_DIR).filter(f => /\.(mmd|mermaid)$/.test(f)).map(f => f.replace(/\.(mmd|mermaid)$/, '')) : [];
fs.mkdirSync(OUT_DIR, { recursive: true });
const has = c => execFileSync('bash', ['-c', `command -v ${c} || true`], { encoding: 'utf8' }).trim();
const HAS_MONTAGE = !!has('montage');

function render(caseName, style) {
  const src = path.join(CASES_DIR, caseName + '.mmd');
  if (!fs.existsSync(src)) { console.error(`  [skip] no case: ${caseName}`); return null; }
  const exc = path.join(OUT_DIR, `${caseName}.${style}.excalidraw`);
  const png = path.join(OUT_DIR, `${caseName}.${style}.png`);
  try {
    execFileSync('node', [RENDER, src, exc, style], { stdio: 'pipe' });
    execFileSync('node', [SVG, exc, '--png'], { stdio: 'pipe' });
    console.log(`  ✓ ${caseName} · ${style}  →  ${path.relative(ROOT, png)}`);
    return png;
  } catch (e) { console.error(`  ✗ ${caseName} · ${style}: ${e.message.split('\n')[0]}`); return null; }
}
function montage(pngs, out, tile) {
  if (!HAS_MONTAGE || pngs.length < 2) return false;
  try { execFileSync('montage', [...pngs, '-tile', tile, '-geometry', '600x+8+8', '-background', '#cccccc', out]); console.log(`  ▦ montage → ${path.relative(ROOT, out)}`); return true; } catch { return false; }
}

const [a1, a2] = process.argv.slice(2);
if (!a1) {
  console.log('cases:', cases.join(', ') || '(none)');
  console.log('styles:', STYLES.join(', '));
  console.log('\n例: node scripts/test-flowchart.mjs loop pastel-journal');
  console.log('   node scripts/test-flowchart.mjs swimlane all   (单case全风格)');
  console.log('   node scripts/test-flowchart.mjs all hachure-classic   (全case一风格)');
  process.exit(0);
}
const caseList = a1 === 'all' ? cases : [a1];
const styleList = (!a2) ? [STYLES[0]] : (a2 === 'all' ? STYLES : [a2]);

const made = [];
for (const c of caseList) for (const s of styleList) { const p = render(c, s); if (p) made.push({ c, s, p }); }

// 拼图：单 case 全风格 → 横排；全 case 单风格 → 网格
if (a1 !== 'all' && a2 === 'all') montage(made.map(m => m.p), path.join(OUT_DIR, `${a1}.ALL-styles.png`), `${made.length}x1`);
else if (a1 === 'all' && a2 !== 'all') montage(made.map(m => m.p), path.join(OUT_DIR, `ALL-cases.${a2}.png`), '3x');
console.log(`\n完成 ${made.length} 张 → ${path.relative(ROOT, OUT_DIR)}/`);
