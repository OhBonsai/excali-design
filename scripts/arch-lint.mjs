#!/usr/bin/env node
/**
 * arch-lint.mjs · Excalidraw 图的「美学物理规则」检查器(不靠肉眼)
 *
 * 把架构图/原型图的视觉质量拆成确定性几何不变量,逐条检测并报坐标。
 * 这是「靠结构,不靠肉眼」的兜底——配合「从组件树用 layered layout 生成」的预防手段。
 *
 * 用法:
 *   node scripts/arch-lint.mjs <file.excalidraw | _frames/dir/frame-001.json> [--grid 4] [--colors 4] [--json]
 *
 * 退出码:有 error 级问题 → 1,仅 warn → 0(可配 --strict 让 warn 也 1)。
 *
 * 检查项(error = 必修,warn = 应修):
 *   E1 overlap         节点-节点部分重叠(互不包含却相交)= 摆放 bug
 *   E2 arrow-thru      箭头穿过它没绑定的节点(线压过框)
 *   W1 offgrid         x/y 未吸附到网格(默认 4)
 *   W2 near-align      两节点边/中线「几乎对齐但没对齐」(最丑的错位)
 *   W3 uneven-gap      同一行/列相邻节点间距不均
 *   W4 arrow-unbound   箭头端点未 binding 到节点(浮空,改布局会脱节)
 *   W5 color-budget    去重描边+填充色 > 阈值(默认 4,反 slop)
 *   W6 oob             元素超出画布(给了 --width/--height 时)
 *
 * 纯 Node,零依赖。
 */
import fs from 'node:fs';
import path from 'node:path';

const NODE_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'image', 'frame']);

function parseArgs(argv) {
  const a = { grid: 4, colors: 4, _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--grid') a.grid = parseFloat(next());
    else if (t === '--colors') a.colors = parseInt(next());
    else if (t === '--width') a.width = parseFloat(next());
    else if (t === '--height') a.height = parseFloat(next());
    else if (t === '--json') a.json = true;
    else if (t === '--strict') a.strict = true;
    else if (!t.startsWith('--')) a._.push(t);
  }
  return a;
}

function loadElements(p) {
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  return (Array.isArray(d) ? d : d.elements || []).filter(e => e && !e.isDeleted);
}

function bbox(e) {
  if (Array.isArray(e.points) && e.points.length) {
    const xs = e.points.map(p => e.x + p[0]), ys = e.points.map(p => e.y + p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
  }
  return { x: e.x, y: e.y, x2: e.x + (e.width || 0), y2: e.y + (e.height || 0) };
}
const area = b => Math.max(0, b.x2 - b.x) * Math.max(0, b.y2 - b.y);
function interArea(a, b) {
  const ix = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y, b.y));
  return ix * iy;
}
const contains = (A, B, pad = -0.5) => B.x >= A.x + pad && B.y >= A.y + pad && B.x2 <= A.x2 - pad && B.y2 <= A.y2 - pad;
const idOf = e => e.id ? String(e.id).slice(0, 8) : '?';

// 线段是否穿过矩形(Liang–Barsky 裁剪)
function segHitsRect(p0, p1, r) {
  let [x0, y0] = p0, [x1, y1] = p1; const dx = x1 - x0, dy = y1 - y0;
  let t0 = 0, t1 = 1;
  const clip = (p, q) => { if (p === 0) return q >= 0; const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } return true; };
  if (clip(-dx, x0 - r.x) && clip(dx, r.x2 - x0) && clip(-dy, y0 - r.y) && clip(dy, r.y2 - y0)) return t0 < t1;
  return false;
}

function lint(els, opt) {
  const issues = [];
  const add = (sev, rule, msg) => issues.push({ sev, rule, msg });
  const nodes = els.filter(e => NODE_TYPES.has(e.type));
  const bb = new Map(els.map(e => [e, bbox(e)]));
  // 容器 = 完整包住 ≥1 个其它节点的框(分层背景/泳道)。箭头穿过容器属合法,需排除。
  const isContainer = new Map();
  for (const a of nodes) isContainer.set(a, nodes.some(b => b !== a && contains(bb.get(a), bb.get(b))));

  // E1 节点-节点部分重叠(互不包含却相交)
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const A = bb.get(nodes[i]), B = bb.get(nodes[j]);
      const ia = interArea(A, B);
      if (ia <= 1) continue;
      if (contains(A, B) || contains(B, A)) continue;        // 容器/子节点 = 合法
      const frac = (ia / Math.min(area(A), area(B)) * 100).toFixed(0);
      add('error', 'overlap', `节点 ${idOf(nodes[i])}(${nodes[i].type}) 与 ${idOf(nodes[j])}(${nodes[j].type}) 部分重叠 ~${frac}% @(${A.x|0},${A.y|0})`);
    }

  // E2 箭头穿过未绑定节点 / W4 浮空箭头
  const arrows = els.filter(e => e.type === 'arrow');
  for (const ar of arrows) {
    const sId = ar.startBinding?.elementId, eId = ar.endBinding?.elementId;
    if (!sId && !eId) add('warn', 'arrow-unbound', `箭头 ${idOf(ar)} 两端都未 binding(浮空)`);
    const pts = (ar.points || []).map(p => [ar.x + p[0], ar.y + p[1]]);
    for (let s = 0; s + 1 < pts.length; s++)
      for (const n of nodes) {
        if (n.id === sId || n.id === eId) continue;
        if (isContainer.get(n)) continue;           // 分层背景/泳道:穿过合法
        const r = bb.get(n);
        // 收缩一点避免端点贴边误报
        const rr = { x: r.x + 3, y: r.y + 3, x2: r.x2 - 3, y2: r.y2 - 3 };
        if (rr.x2 > rr.x && rr.y2 > rr.y && segHitsRect(pts[s], pts[s + 1], rr))
          add('warn', 'arrow-thru', `箭头 ${idOf(ar)} 穿过未绑定节点 ${idOf(n)} @(${r.x|0},${r.y|0})`);
      }
  }

  // W7 diagonal:架构图连线应正交(横平竖直 + 直角拐弯),不用斜线
  const orthoTol = 2;
  const connectors = els.filter(e => e.type === 'arrow' || e.type === 'line');
  for (const c of connectors) {
    const pts = (c.points || []).map(p => [c.x + p[0], c.y + p[1]]);
    let diag = false;
    for (let s = 0; s + 1 < pts.length; s++) {
      const dx = Math.abs(pts[s + 1][0] - pts[s][0]), dy = Math.abs(pts[s + 1][1] - pts[s][1]);
      if (dx > orthoTol && dy > orthoTol) diag = true;
    }
    if (diag) add('warn', 'diagonal', `连线 ${idOf(c)} 含斜线段(架构图应横平竖直 + 直角拐弯,不用斜线)`);
  }

  // W8/W9/W10 端口分布(连接点的"质量分布":朝向/居中/均匀/不贴角)
  const nodeById = id => nodes.find(n => n.id === id);
  const ports = new Map();  // nodeId -> [{side, along, b}]
  const sideOf = (pt, b) => {
    const d = { top: Math.abs(pt[1] - b.y), bottom: Math.abs(pt[1] - b.y2), left: Math.abs(pt[0] - b.x), right: Math.abs(pt[0] - b.x2) };
    const side = Object.keys(d).reduce((a, k) => (d[k] < d[a] ? k : a));
    return d[side] > 8 ? null : side;  // 端点不在框边上 → 跳过
  };
  for (const ar of arrows) {
    const pts = (ar.points || []).map(p => [ar.x + p[0], ar.y + p[1]]);
    if (pts.length < 2) continue;
    for (const [nid, pt] of [[ar.startBinding?.elementId, pts[0]], [ar.endBinding?.elementId, pts[pts.length - 1]]]) {
      const n = nid && nodeById(nid); if (!n) continue;
      const b = bb.get(n), side = sideOf(pt, b); if (!side) continue;
      const along = (side === 'top' || side === 'bottom') ? pt[0] : pt[1];
      (ports.get(nid) ?? ports.set(nid, []).get(nid)).push({ side, along, b });
    }
  }
  for (const [nid, list] of ports) {
    const bySide = {};
    for (const p of list) (bySide[p.side] ??= []).push(p);
    for (const side of Object.keys(bySide)) {
      const ps = bySide[side].sort((a, b) => a.along - b.along), b = ps[0].b;
      const horiz = side === 'top' || side === 'bottom';
      const lo = horiz ? b.x : b.y, hi = horiz ? b.x2 : b.y2, center = (lo + hi) / 2, len = hi - lo;
      for (const p of ps) if (p.along - lo < 8 || hi - p.along < 8) { add('warn', 'port-corner', `${idOf({ id: nid })} 的连接点贴${side}边角(应留边距)`); break; }
      if (ps.length === 1) {
        const dev = Math.abs(ps[0].along - center);
        if (dev > Math.max(18, len * 0.2)) add('warn', 'port-offcenter', `${idOf({ id: nid })} ${side} 仅一条边却不居中(偏 ${dev | 0}px)`);
      } else {
        for (let i = 0; i + 1 < ps.length; i++) if (ps[i + 1].along - ps[i].along < 6) { add('warn', 'port-stacked', `${idOf({ id: nid })} ${side} 有 ${ps.length} 条边挤在同一点(应沿边均匀分布)`); break; }
        const gaps = []; let prev = lo; for (const p of ps) { gaps.push(p.along - prev); prev = p.along; } gaps.push(hi - prev);
        const mx = Math.max(...gaps), mn = Math.min(...gaps);
        if (mn > 0 && mx / mn > 3.5) add('warn', 'port-uneven', `${idOf({ id: nid })} ${side} 的 ${ps.length} 个连接点分布不均(质量不平衡,应等距)`);
      }
    }
  }

  // W1 off-grid
  const g = opt.grid;
  if (g > 0) {
    let off = 0;
    for (const e of nodes) { if ((e.x % g) || (e.y % g)) off++; }
    if (off) add('warn', 'offgrid', `${off}/${nodes.length} 个节点未吸附 ${g}px 网格`);
  }

  // W2 near-miss alignment(边/中线几乎对齐但没对齐)
  const tol = 6;
  const edges = { left: [], top: [], cx: [], cy: [] };
  for (const e of nodes) { const b = bb.get(e); edges.left.push([b.x, e]); edges.top.push([b.y, e]); edges.cx.push([(b.x + b.x2) / 2, e]); edges.cy.push([(b.y + b.y2) / 2, e]); }
  const nameMap = { left: '左边缘', top: '顶边', cx: '水平中线', cy: '垂直中线' };
  let nearCount = 0;
  for (const k of Object.keys(edges)) {
    const arr = edges[k].sort((a, b) => a[0] - b[0]);
    for (let i = 0; i + 1 < arr.length; i++) {
      const d = arr[i + 1][0] - arr[i][0];
      if (d > 0.5 && d <= tol) { nearCount++; if (nearCount <= 12) add('warn', 'near-align', `${idOf(arr[i][1])} 与 ${idOf(arr[i + 1][1])} 的${nameMap[k]}相差 ${d.toFixed(1)}px(几乎对齐→应吸附到同值)`); }
    }
  }
  if (nearCount > 12) add('warn', 'near-align', `…另有 ${nearCount - 12} 处近似对齐未列出`);

  // W5 color budget
  const cols = new Set();
  for (const e of nodes) { for (const c of [e.strokeColor, e.backgroundColor]) if (c && c !== 'transparent') cols.add(c.toLowerCase()); }
  if (cols.size > opt.colors) add('warn', 'color-budget', `用了 ${cols.size} 种色(阈值 ${opt.colors}):${[...cols].join(' ')}`);

  // W6 out of bounds
  if (opt.width && opt.height) {
    for (const e of nodes) { const b = bb.get(e); if (b.x < 0 || b.y < 0 || b.x2 > opt.width || b.y2 > opt.height) add('warn', 'oob', `${idOf(e)} 超出画布 @(${b.x|0},${b.y|0},${b.x2|0},${b.y2|0})`); }
  }

  return issues;
}

function main() {
  const opt = parseArgs(process.argv);
  const file = opt._[0];
  if (!file) { console.error('用法: node arch-lint.mjs <file.excalidraw> [--grid 4] [--colors 4] [--width W --height H] [--json] [--strict]'); process.exit(1); }
  const els = loadElements(file);
  const issues = lint(els, opt);
  const errs = issues.filter(i => i.sev === 'error'), warns = issues.filter(i => i.sev === 'warn');

  if (opt.json) { console.log(JSON.stringify({ file, errors: errs, warnings: warns }, null, 2)); }
  else {
    console.log(`arch-lint ${path.basename(file)} · ${els.length} 元素`);
    if (!issues.length) { console.log('✓ 全部通过'); }
    else {
      const byRule = {};
      for (const i of issues) (byRule[i.rule] ??= []).push(i);
      for (const rule of Object.keys(byRule)) {
        const list = byRule[rule]; const sev = list[0].sev === 'error' ? '✗ ERROR' : '⚠ warn';
        console.log(`\n${sev} · ${rule}(${list.length})`);
        for (const i of list) console.log('   ', i.msg);
      }
      console.log(`\n合计:${errs.length} error · ${warns.length} warn`);
    }
  }
  process.exit(errs.length || (opt.strict && warns.length) ? 1 : 0);
}

main();
