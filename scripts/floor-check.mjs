#!/usr/bin/env node
/**
 * floor-check.mjs · 知觉「地板探测器」(把眯眼测试量化,零渲染、零依赖)
 *
 * 思路:把 .excalidraw 场景图栅格化成一张「墨密度粗网格」(降采样本身=眯眼/模糊),
 * 然后在网格上算几条知觉地板指标。不渲染像素、不打总分,只报具体违规(同 arch-lint 哲学)。
 * 与 arch-lint 分工:arch-lint 查几何(重叠/脱线/越界/文字溢出),本脚本查知觉(眯眼存活/焦点/平衡/配色)。
 *
 * 类型感知:--type structural(默认,flowchart/seq/state/class/er/gantt/mindmap…)只查通用项;
 *           --type hero(架构海报/explainer/infographic)额外查「有没有视觉主角」。
 *
 * 用法:
 *   node scripts/floor-check.mjs <file.excalidraw> [--type structural|hero] [--grid 32] [--colors 4] [--json] [--strict]
 * 退出码:有 error → 1;仅 warn → 0(--strict 则 warn 也 1)。纯 Node,零依赖。
 */
import fs from 'node:fs';

function parseArgs(argv) {
  const a = { type: 'structural', grid: 32, colors: 4, _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--type') a.type = next();
    else if (t === '--grid') a.grid = parseInt(next());
    else if (t === '--colors') a.colors = parseInt(next());
    else if (t === '--json') a.json = true;
    else if (t === '--strict') a.strict = true;
    else if (!t.startsWith('--')) a._.push(t);
  }
  return a;
}

const load = p => { const d = JSON.parse(fs.readFileSync(p, 'utf8')); return (Array.isArray(d) ? d : d.elements || []).filter(e => e && !e.isDeleted); };
const bbox = e => {
  if (e.points && e.points.length) { const xs = e.points.map(p => e.x + p[0]), ys = e.points.map(p => e.y + p[1]); return { x: Math.min(...xs), y: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) }; }
  return { x: e.x, y: e.y, x2: e.x + (e.width || 0), y2: e.y + (e.height || 0) };
};

// 颜色:判断是否「彩色」(非中性灰/黑/白/透明)
function isChroma(c) {
  if (!c || c === 'transparent') return false;
  let r, g, b; const m = c.replace('#', '');
  if (m.length === 3) { r = parseInt(m[0] + m[0], 16); g = parseInt(m[1] + m[1], 16); b = parseInt(m[2] + m[2], 16); }
  else if (m.length >= 6) { r = parseInt(m.slice(0, 2), 16); g = parseInt(m.slice(2, 4), 16); b = parseInt(m.slice(4, 6), 16); }
  else return false;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return (mx - mn) > 24;   // 饱和度阈:RGB 极差>24 才算"有色"
}

function run(file, a) {
  const els = load(file);
  const findings = [];
  const add = (sev, rule, msg) => findings.push({ sev, rule, msg });

  // 背景纸:transparent 描边的大矩形 → 取画布范围,且排除出墨量
  const bg = els.find(e => e.type === 'rectangle' && (e.strokeColor === 'transparent') && (e.width || 0) > 0);
  const ink = els.filter(e => e !== bg && e.type !== 'frame');
  if (!ink.length) { add('warn', 'empty', '没有可见元素'); return finish(file, a, findings, {}); }
  const X = bg ? bg.x : Math.min(...ink.map(e => bbox(e).x));
  const Y = bg ? bg.y : Math.min(...ink.map(e => bbox(e).y));
  const X2 = bg ? bg.x + bg.width : Math.max(...ink.map(e => bbox(e).x2));
  const Y2 = bg ? bg.y + bg.height : Math.max(...ink.map(e => bbox(e).y2));
  const W = Math.max(1, X2 - X), H = Math.max(1, Y2 - Y);

  // 栅格化:每个元素按 bbox 覆盖面积 × 暗度 摊进格子(填充重、线/文字轻)
  const G = a.grid, grid = new Float64Array(G * G);
  const cw = W / G, ch = H / G, cellA = cw * ch;
  const darkness = e => (e.backgroundColor && e.backgroundColor !== 'transparent') ? 0.85 : (e.type === 'text' ? 0.5 : 0.3);
  for (const e of ink) {
    const b = bbox(e), d = darkness(e);
    const gx0 = Math.max(0, Math.floor((b.x - X) / cw)), gx1 = Math.min(G - 1, Math.floor((b.x2 - X) / cw));
    const gy0 = Math.max(0, Math.floor((b.y - Y) / ch)), gy1 = Math.min(G - 1, Math.floor((b.y2 - Y) / ch));
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const cx = X + gx * cw, cy = Y + gy * ch;
      const ox = Math.max(0, Math.min(b.x2, cx + cw) - Math.max(b.x, cx));
      const oy = Math.max(0, Math.min(b.y2, cy + ch) - Math.max(b.y, cy));
      grid[gy * G + gx] += (ox * oy / cellA) * d;
    }
  }

  // 指标
  const vals = Array.from(grid);
  const nonzero = vals.filter(v => v > 0.02);
  const inkFrac = nonzero.length / vals.length;            // 覆盖率
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
  const cv = mean > 0 ? std / mean : 0;                     // 变异系数:低=平,高=有起伏
  // Gini(焦点集中度):0=均匀,1=全压一格
  const sorted = [...vals].sort((x, y) => x - y); const n = sorted.length; const tot = sorted.reduce((s, v) => s + v, 0);
  let gini = 0; if (tot > 0) { let cum = 0; for (let i = 0; i < n; i++) { cum += sorted[i]; gini += cum; } gini = (n + 1 - 2 * gini / tot) / n; gini = 1 - 2 * (gini); gini = Math.abs(gini); }
  // 墨重心偏移(占半幅比例)
  let mx = 0, my = 0, mw = 0; for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) { const v = grid[gy * G + gx]; mx += gx * v; my += gy * v; mw += v; }
  const offX = mw ? Math.abs((mx / mw) - (G - 1) / 2) / (G / 2) : 0;
  const offY = mw ? Math.abs((my / mw) - (G - 1) / 2) / (G / 2) : 0;
  const metrics = { inkFrac: +inkFrac.toFixed(3), cv: +cv.toFixed(3), gini: +gini.toFixed(3), offX: +offX.toFixed(3), offY: +offY.toFixed(3) };

  // —— 通用地板(所有图种)——
  // 眯眼存活:覆盖率高 + 起伏小 = 模糊后摊成一团(条形码),结构没了
  if (inkFrac > 0.7 && cv < 0.6) add('warn', 'squint-collapse', `墨量摊平(覆盖 ${(inkFrac * 100) | 0}%、起伏 cv=${cv.toFixed(2)})—— 眯眼后结构糊成一团,加留白/分组/层级`);
  // 配色预算
  const cols = new Set(); for (const e of ink) { for (const c of [e.strokeColor, e.backgroundColor]) if (isChroma(c)) cols.add(c.toLowerCase()); }
  if (cols.size > a.colors) add('warn', 'color-budget', `彩色 ${cols.size} 种 > 预算 ${a.colors}:${[...cols].join(' ')}`);
  // 平衡:重心严重偏一边
  if (offX > 0.33 || offY > 0.33) add('warn', 'balance', `墨重心偏移(x ${(offX * 100) | 0}% / y ${(offY * 100) | 0}%)—— 画面失衡`);

  // —— hero 类专属:必须有视觉主角(按元素视觉权重,不靠网格 gini)——
  if (a.type === 'hero') {
    const wts = ink.filter(e => e.type !== 'text').map(e => { const b = bbox(e); return Math.max(0, (b.x2 - b.x) * (b.y2 - b.y)) * darkness(e); }).sort((x, y) => y - x);
    const sum = wts.reduce((s, v) => s + v, 0);
    const share = sum > 0 ? wts[0] / sum : 0;     // 最重元素占总墨比
    if (wts.length >= 4 && share < 0.18) add('warn', 'no-hero', `最重元素仅占墨量 ${(share * 100) | 0}%(<18%)—— 没有视觉主角,hero 类图应有一个明显最重的焦点`);
    metrics.heroShare = +share.toFixed(3);
  }

  return finish(file, a, findings, metrics);
}

// 知觉项多为「方向」非精确补丁:给改的方向,落点靠判断(谁是 hero 机器不知道)。
const FIXES = {
  'squint-collapse': '加留白(元素间距×1.5)/ 分组留沟 / 提一个 hero;最好回去调布局的密度参数重渲,而非补丁',
  'color-budget': '把多余色并到 ≤阈值的调色板(留 1 主色 + 中性);mindmap/mermaid 可直接换 pencil 单色',
  balance: '把偏轻的一侧补内容或整体重排,使墨重心回中',
  'no-hero': '放大主角 / 压暗其余 / 给主角加强调色;「谁是主角」需按内容判断(机器不替你选角)',
  empty: '检查是否渲染失败 / 元素被删',
};
function finish(file, a, findings, metrics) {
  const withFix = f => ({ ...f, fix: FIXES[f.rule] || null });
  const errs = findings.filter(f => f.sev === 'error').length, warns = findings.length - errs;
  if (a.json) { console.log(JSON.stringify({ file, type: a.type, metrics, findings: findings.map(withFix), errs, warns }, null, 2)); }
  else {
    console.log(`\nfloor-check [${a.type}] ${file}`);
    console.log(`  指标 ${JSON.stringify(metrics)}`);
    if (!findings.length) console.log('  ✓ 无地板问题');
    for (const f of findings) { console.log(`  ${f.sev === 'error' ? '✗' : '⚠'} [${f.rule}] ${f.msg}`); if (FIXES[f.rule]) console.log(`     → 改:${FIXES[f.rule]}`); }
    console.log(`  → ${errs} error / ${warns} warn`);
  }
  return errs > 0 || (a.strict && warns > 0) ? 1 : 0;
}

const a = parseArgs(process.argv);
if (!a._.length) { console.error('用法: node scripts/floor-check.mjs <file.excalidraw> [--type structural|hero] [--json] [--strict]'); process.exit(2); }
let code = 0;
for (const f of a._) { try { code = run(f, a) || code; } catch (e) { console.error(`✗ ${f}: ${e.message}`); code = 2; } }
process.exit(code);
