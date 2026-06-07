#!/usr/bin/env node
// excali-design 并发评测编排器（用 @opencode-ai/sdk 打 opencode 服务，并发跑多个 case）
//
// 准备：cd eval && npm i            # 装 @opencode-ai/sdk
// 用法：
//   # 0) 小规模验证（3 个代表性 case，全变体，并发 4）
//   node eval/run.mjs method --only "ARCH01-ha-ecommerce EXPL01-transformer ADV01-vague-huge" --conc 4
//   # 1) 全量方法矩阵 / 2) 模型矩阵
//   node eval/run.mjs method --conc 8
//   node eval/run.mjs model  --conc 8
//
// 服务：默认自己用 SDK 拉起 opencode serve；若已 `opencode serve`，设 OPENCODE_URL 复用：
//   OPENCODE_URL=http://127.0.0.1:4096 node eval/run.mjs method --conc 8
//
// 并发模型：变体(列)之间串行(切技能软链，全局只能激活一个版本)，同一变体内所有 case 并发。
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createOpencode, createOpencodeClient } from '@opencode-ai/sdk';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const EVAL = path.join(ROOT, 'eval');
const OUT  = path.join(EVAL, 'out');
const SKILL_LINK = path.join(os.homedir(), '.config/opencode/skills/excali-design');

const args = process.argv.slice(2);
const mode = args[0] === 'model' ? 'model' : 'method';
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ONLY = (opt('--only', '') || '').split(/\s+/).filter(Boolean);
const CONC = parseInt(opt('--conc', process.env.CONCURRENCY || '6'), 10);
const TIMEOUT_MS = parseInt(opt('--timeout', '900'), 10) * 1000;  // 每个 case 等出图的上限(秒)

const cases = fs.readFileSync(path.join(EVAL, 'cases.jsonl'), 'utf8').split('\n').map(l => l.trim()).filter(Boolean).map(l => JSON.parse(l))
  .filter(c => ONLY.length === 0 || ONLY.includes(c.id));
const vcfg = JSON.parse(fs.readFileSync(path.join(EVAL, 'variants.json'), 'utf8'));
const COLSEL = (opt('--cols', '') || '').split(/\s+/).filter(Boolean);
let columns = mode === 'method'
  ? vcfg.variants.map(v => ({ name: v.name, ref: v.ref, model: vcfg.fixed_model }))
  : vcfg._model_matrix.models.map(m => ({ name: m.split('/').pop(), ref: 'WORKTREE', model: m }));
if (COLSEL.length) columns = columns.filter(c => COLSEL.includes(c.name));

const wrap = (p) => `用 excali-design 技能完成：${p} 把 .excalidraw 源文件存为当前目录的 out.excalidraw（PNG 不必你用 playwright 导出，由评测统一渲染；眯眼自检可用轻量 svg-export）。`;

// 评测统一渲染 out.png：默认 svg-export(headless roughjs+resvg，无 chromium)；
// 仅当 .excalidraw 含 image 元素(如 LaTeX 公式内嵌)才回退 playwright 导出器。
function renderPng(src, dir) {
  const png = path.join(dir, 'out.png');
  let hasImage = false;
  try { hasImage = /"type"\s*:\s*"image"/.test(fs.readFileSync(src, 'utf8')); } catch {}
  if (!hasImage) { try { execFileSync('node', [path.join(ROOT, 'scripts/svg-export.mjs'), src, '--png'], { stdio: 'ignore' }); } catch {} }
  if (hasImage || !fs.existsSync(png)) {
    try { execFileSync('node', [path.join(ROOT, 'scripts/excalidraw-to-image.mjs'), src, '--png'], { stdio: 'ignore', timeout: 180000 }); } catch {}
  }
}

async function pool(items, n, worker) {
  const q = [...items]; const running = new Set();
  while (q.length || running.size) {
    while (running.size < n && q.length) {
      const it = q.shift();
      const p = Promise.resolve(worker(it)).catch(e => console.error('  [err]', it.id || '', e?.message || e, '|cause:', e?.cause?.code || e?.cause?.message || e?.cause || '')).finally(() => running.delete(p));
      running.add(p);
    }
    if (running.size) await Promise.race(running);
  }
}

function gitHas(ref) {
  try { execFileSync('git', ['-C', ROOT, 'rev-parse', '--verify', '--quiet', ref], { stdio: 'ignore' }); return true; }
  catch { return false; }
}
function activate(ref, name) {
  fs.rmSync(SKILL_LINK, { force: true });
  if (ref !== 'WORKTREE' && !gitHas(ref)) {
    console.warn(`  [warn] git ref '${ref}' 不存在 → 回落到当前工作树(WORKTREE)。建分支后再做真 A/B。`);
    ref = 'WORKTREE';
  }
  if (ref === 'WORKTREE') { fs.symlinkSync(ROOT, SKILL_LINK); return; }
  const wt = path.join(os.tmpdir(), `excali-${name}`);
  try { execFileSync('git', ['-C', ROOT, 'worktree', 'add', '-f', wt, ref], { stdio: 'ignore' }); } catch {}
  fs.symlinkSync(wt, SKILL_LINK);
}
async function withRetry(fn, tries = 3, delay = 1500) {
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { if (i === tries - 1) throw e; await new Promise(r => setTimeout(r, delay * (i + 1))); }
  }
}

async function runCase(client, col, cs) {
  const dir = path.join(OUT, mode, col.name, cs.id);
  fs.mkdirSync(dir, { recursive: true });
  const [providerID, modelID] = col.model.split('/');
  const png = path.join(dir, 'out.png'), src = path.join(dir, 'out.excalidraw');
  // 触发 agent。长会话常把 SDK 连接拖断(fetch failed)，但服务端会跑完并写文件 ——
  // 故不依赖 prompt resolve，吞掉连接断开，靠轮询 out.png 出现判定成功。
  const fired = (async () => {
    const created = await client.session.create({ query: { directory: dir }, body: { title: `${col.name}/${cs.id}` } });
    const id = created.data?.id ?? created.id;
    await client.session.prompt({
      path: { id }, query: { directory: dir },
      body: { model: { providerID, modelID }, parts: [{ type: 'text', text: wrap(cs.prompt) }] },
    });
  })().catch(() => {});
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const t0 = Date.now();
  while (Date.now() - t0 < TIMEOUT_MS && !fs.existsSync(src)) await sleep(4000);  // 等 agent 产出源文件
  await fired.catch(() => {});
  if (fs.existsSync(src)) {
    renderPng(src, dir);  // 评测统一渲染(svg-export 优先，无 chromium)
    try { fs.writeFileSync(path.join(dir, 'lint.json'),
      execFileSync('node', [path.join(ROOT, 'scripts/arch-lint.mjs'), src, '--json'], { encoding: 'utf8' })); } catch {}
  }
  const ok = fs.existsSync(png);
  console.log(ok ? `  done: ${col.name} / ${cs.id}` : `  [timeout] ${col.name} / ${cs.id}`);
}

async function main() {
  // 评测无人审批：放行工具调用（含 external_directory——技能 drawlib/scripts 在 case 目录之外）。
  // 只注入给本次 spawn 的 serve，不动你的全局 opencode.json。
  const evalConfig = { permission: {
    edit: 'allow', bash: 'allow', external_directory: 'allow', skill: 'allow',
    read: 'allow', glob: 'allow', grep: 'allow', list: 'allow', task: 'allow',
    webfetch: 'allow', websearch: 'allow', todowrite: 'allow', question: 'allow',
  } };
  let server, client;
  if (process.env.OPENCODE_URL) { client = createOpencodeClient({ baseUrl: process.env.OPENCODE_URL }); }
  else {
    // 隔离数据目录：dev 构建迁移旧数据会失败("session_message projections...")。给评测一个全新 data dir，
    // 不碰你真实的 ~/.local/share/opencode；key 在 config 里照常生效。可用 OC_EVAL_DATA 覆盖路径。
    process.env.XDG_DATA_HOME = process.env.OC_EVAL_DATA || path.join(os.tmpdir(), 'oc-eval-data');
    fs.mkdirSync(process.env.XDG_DATA_HOME, { recursive: true });
    const oc = await createOpencode({ port: 4096, config: evalConfig }); server = oc.server; client = oc.client;
  }
  console.log(`== mode=${mode} conc=${CONC} cases=${cases.length} columns=${columns.length} ==`);
  try {
    for (const col of columns) {
      console.log(`-- column: ${col.name} (model ${col.model}) --`);
      activate(col.ref, col.name);
      await pool(cases, CONC, cs => runCase(client, col, cs));
    }
  } finally {
    fs.rmSync(SKILL_LINK, { force: true }); fs.symlinkSync(ROOT, SKILL_LINK); // restore
    await server?.close?.();
  }
  console.log(`== 完成。组装矩阵：node eval/montage.mjs ${mode} ==`);
}
main();
