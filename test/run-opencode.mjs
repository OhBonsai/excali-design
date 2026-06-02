#!/usr/bin/env node
/**
 * run-opencode.mjs · 用本机 opencode 跑 test-prompts.json,产出 + 自动校验
 *
 * 对每条 prompt:在独立工作目录里 `opencode run`,抓产出的 .excalidraw / .png,
 * 自动跑 verify.mjs + arch-lint.mjs,最后出汇总表。产物留在 test/_out/<id>/ 供肉眼过。
 *
 * 前置:
 *   1. 装好 opencode 并登录(opencode auth login),`opencode models` 能列出模型。
 *   2. 安装本 skill(二选一):
 *      - 软链:bash test/install-skill.sh        (链到 ~/.config/opencode/skills/excali-design)
 *      - 或本脚本加 --install 自动软链。
 *
 * 用法:
 *   node test/run-opencode.mjs -m anthropic/claude-sonnet-4-6
 *   node test/run-opencode.mjs --attach http://localhost:4096   # 先 opencode serve,跑更快
 *   node test/run-opencode.mjs --ids 7,8,10,11                   # 只跑部分用例
 *   node test/run-opencode.mjs --install -m openai/gpt-5         # 顺手装 skill 再跑
 *
 * 选项:
 *   -m/--model provider/model   传给 opencode run
 *   --attach <url>              接已起的 opencode serve(避免每次冷启 MCP)
 *   --ids 1,3,5                 只跑这些 id(默认全跑)
 *   --timeout <sec>            每条超时秒数(默认 360)
 *   --out <dir>                输出目录(默认 test/_out)
 *   --no-eval                  跳过 verify/arch-lint 自动校验
 *   --install                  先把本 skill 软链到 opencode skills 目录
 *   --seed <a.excalidraw>      给每个工作目录预置一张图(供"导出/检查这张图"类用例)
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');               // skill 仓库根
const SKILL_DEST = path.join(os.homedir(), '.config', 'opencode', 'skills', 'excali-design');

function parseArgs(argv) {
  const a = { timeout: 360, out: path.join(__dirname, '_out'), eval: true };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '-m' || t === '--model') a.model = next();
    else if (t === '--attach') a.attach = next();
    else if (t === '--ids') a.ids = next().split(',').map(s => parseInt(s.trim()));
    else if (t === '--timeout') a.timeout = parseInt(next());
    else if (t === '--out') a.out = next();
    else if (t === '--no-eval') a.eval = false;
    else if (t === '--no-render') a.render = false;
    else if (t === '--install') a.install = true;
    else if (t === '--seed') a.seed = next();
  }
  if (a.render === undefined) a.render = true;
  return a;
}

function installSkill() {
  fs.mkdirSync(path.dirname(SKILL_DEST), { recursive: true });
  try { fs.rmSync(SKILL_DEST, { recursive: true, force: true }); } catch {}
  fs.symlinkSync(ROOT, SKILL_DEST, 'dir');
  console.log(`✓ 软链 skill:${SKILL_DEST} → ${ROOT}`);
}

function checkInstalled() {
  for (const p of [SKILL_DEST, path.join(os.homedir(), '.claude/skills/excali-design'), path.join(process.cwd(), '.opencode/skills/excali-design')]) {
    if (fs.existsSync(path.join(p, 'SKILL.md'))) return p;
  }
  return null;
}

function hasOpencode() {
  return spawnSync('opencode', ['--version'], { encoding: 'utf8' }).status === 0;
}

function collect(dir, exts) {
  const out = [];
  const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (exts.some(e => f.toLowerCase().endsWith(e))) out.push(p); } };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

function runEval(file) {
  const r1 = spawnSync('node', [path.join(ROOT, 'scripts', 'verify.mjs'), file], { encoding: 'utf8' });
  const r2 = spawnSync('node', [path.join(ROOT, 'scripts', 'arch-lint.mjs'), file], { encoding: 'utf8' });
  const lintOut = (r2.stdout || '') + (r2.stderr || '');
  const m = lintOut.match(/合计:(\d+)\s*error.*?(\d+)\s*warn/);
  return { verify: r1.status === 0 ? 'pass' : 'FAIL', errors: m ? +m[1] : (lintOut.includes('全部通过') ? 0 : '?'), warns: m ? +m[2] : 0 };
}

// 眯眼回归默认渲染器:headless svg-export(无 chromium)。出 SVG;装了 resvg 则连 PNG。
function renderImg(file) {
  const r = spawnSync('node', [path.join(ROOT, 'scripts', 'svg-export.mjs'), file, '--png'], { encoding: 'utf8' });
  return (r.stdout || '').includes('✓ PNG') ? 'svg+png' : (r.status === 0 ? 'svg' : 'fail');
}

function main() {
  const a = parseArgs(process.argv);
  if (a.install) installSkill();
  if (!hasOpencode()) { console.error('✗ 找不到 opencode。先装并 opencode auth login。'); process.exit(1); }
  const inst = checkInstalled();
  if (!inst) { console.error(`✗ skill 未安装。跑:bash test/install-skill.sh  或加 --install`); process.exit(1); }
  console.log(`✓ skill: ${inst}`);

  let prompts = JSON.parse(fs.readFileSync(path.join(ROOT, 'test-prompts.json'), 'utf8'));
  if (a.ids) prompts = prompts.filter(p => a.ids.includes(p.id));
  fs.mkdirSync(a.out, { recursive: true });
  const SUFFIX = '\n\n要求:用 excali-design 技能;把最终图保存为当前目录下的 .excalidraw 文件(描述性文件名);需要自动布局/连线/转 mermaid 时用技能 scripts 里的脚本。';

  const rows = [];
  for (const p of prompts) {
    const dir = path.join(a.out, String(p.id));
    const work = path.join(dir, 'work');
    fs.mkdirSync(work, { recursive: true });
    if (a.seed && fs.existsSync(a.seed)) fs.copyFileSync(a.seed, path.join(work, 'seed.excalidraw'));
    const args = ['run', '--dir', work, '--dangerously-skip-permissions'];
    if (a.model) args.push('-m', a.model);
    if (a.attach) args.push('--attach', a.attach);
    args.push(p.prompt + SUFFIX);

    console.log(`\n▶ [${p.id}] ${p.prompt.slice(0, 40)}…`);
    const t0 = Date.now();
    const r = spawnSync('opencode', args, { encoding: 'utf8', timeout: a.timeout * 1000, maxBuffer: 64 * 1024 * 1024 });
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    fs.writeFileSync(path.join(dir, 'output.txt'), (r.stdout || '') + '\n--- stderr ---\n' + (r.stderr || ''));
    if (r.error) console.log(`   ⚠ ${r.error.message}`);

    const files = collect(work, ['.excalidraw', '.png', '.svg']).filter(f => !f.endsWith('seed.excalidraw'));
    const exc = files.filter(f => f.endsWith('.excalidraw'));
    let evals = [];
    if (a.eval) for (const f of exc) evals.push(runEval(f));
    let rendered = '-';
    if (a.render) { const rs = exc.map(renderImg); rendered = rs.length ? rs.join(',') : '-'; }
    const errs = evals.reduce((s, e) => s + (typeof e.errors === 'number' ? e.errors : 0), 0);
    rows.push({ id: p.id, secs, files: files.length, exc: exc.length, errs, tests: p.tests });
    console.log(`   产出 ${files.length} 文件(${exc.length} excalidraw)· ${secs}s · lint errors=${a.eval ? errs : '-'} · 渲染=${rendered}`);
  }

  console.log('\n══════ 汇总 ══════');
  console.log('id  时长  文件  excalidraw  lint-err  覆盖点');
  for (const r of rows) console.log(`${String(r.id).padEnd(3)} ${(r.secs + 's').padEnd(5)} ${String(r.files).padEnd(4)} ${String(r.exc).padEnd(10)} ${String(r.errs).padEnd(8)} ${r.tests}`);
  console.log(`\n产物在 ${a.out}/<id>/(每个 .excalidraw 旁已生成同名 .svg/.png,headless 渲染无需 chromium)。`);
  console.log(`⚠ lint 只查机械错误,不判好坏——好不好仍需**眯眼过**(看 .png/.svg:焦点/分组/文字/连线/图元/手绘风)。`);
}

main();
