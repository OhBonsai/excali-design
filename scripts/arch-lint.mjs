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
    else if (t === '--pad') a.pad = parseFloat(next());
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

  // W: container-padding(容器内子模块的内边距;贴边 = 缺 padding)
  const minPad = opt.pad ?? 12;
  const rnd = v => Math.round(v);
  for (const C of nodes) {
    if (!isContainer.get(C)) continue;
    const cb = bb.get(C);
    const inside = nodes.filter(n => n !== C && contains(cb, bb.get(n)));
    // 直接子节点:不再嵌进 C 内部的更小容器里
    const kids = inside.filter(n => !inside.some(m => m !== n && isContainer.get(m) && contains(bb.get(m), bb.get(n))));
    if (!kids.length) continue;
    const cs = kids.map(n => bb.get(n));
    const padTop = Math.min(...cs.map(b => b.y)) - cb.y;
    const padBottom = cb.y2 - Math.max(...cs.map(b => b.y2));
    const padLeft = Math.min(...cs.map(b => b.x)) - cb.x;
    const padRight = cb.x2 - Math.max(...cs.map(b => b.x2));
    const sides = { 上: padTop, 右: padRight, 下: padBottom, 左: padLeft };
    const bad = Object.entries(sides).filter(([, v]) => v < minPad).map(([s]) => s);
    if (bad.length)
      add('warn', 'container-padding', `容器 ${idOf(C)} 内边距 上${rnd(padTop)}/右${rnd(padRight)}/下${rnd(padBottom)}/左${rnd(padLeft)} → 「${bad.join('、')}」贴边(<${minPad}px),扩容器或挪子模块`);
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

  // E3 wrong-attach-side(连线接到「背向源」的那条边 = 绕到背面,把流向画反 → error,比斜线更严重)
  //    W11 edge-overshoot(路径越过目标框远侧再绕回)
  const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const centerOf = b => [(b.x + b.x2) / 2, (b.y + b.y2) / 2];
  const findAttach = pt => {
    let best = null, bd = 9;
    for (const n of nodes) {
      if (isContainer.get(n)) continue;
      const b = bb.get(n), s = sideOf(pt, b);
      if (s) { const d = Math.min(Math.abs(pt[1] - b.y), Math.abs(pt[1] - b.y2), Math.abs(pt[0] - b.x), Math.abs(pt[0] - b.x2)); if (d < bd) { bd = d; best = { n, b, side: s }; } }
    }
    return best;
  };
  const expSide = (tb, src) => { const [cx, cy] = centerOf(tb); const dx = src[0] - cx, dy = src[1] - cy; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top'); };
  const nearestSide = (pt, b) => { const d = { top: Math.abs(pt[1] - b.y), bottom: Math.abs(pt[1] - b.y2), left: Math.abs(pt[0] - b.x), right: Math.abs(pt[0] - b.x2) }; return Object.keys(d).reduce((a, k) => (d[k] < d[a] ? k : a)); };
  for (const ar of arrows) {
    const pts = (ar.points || []).map(p => [ar.x + p[0], ar.y + p[1]]); if (pts.length < 2) continue;
    // 有 binding 直接认目标(不靠端点贴边);否则按端点就近找
    for (const [pt, other, boundId] of [[pts[pts.length - 1], pts[0], ar.endBinding?.elementId], [pts[0], pts[pts.length - 1], ar.startBinding?.elementId]]) {
      let at = null;
      const bn = boundId && nodeById(boundId);
      if (bn && !isContainer.get(bn)) { const b = bb.get(bn); at = { n: bn, b, side: nearestSide(pt, b) }; }
      else at = findAttach(pt);
      if (!at) continue;
      const exp = expSide(at.b, other);
      if (at.side === opp[exp]) {
        add('error', 'wrong-attach-side', `连线 ${idOf(ar)} 接到 ${idOf(at.n)} 的「${at.side}」边,但对端在其「${exp}」侧 → 绕到了背面(流向被画反)。改:从「${exp}」边进入,正交直连别绕`);
      } else {
        let over = false;
        for (const p of pts) {
          if (exp === 'top' && p[1] > at.b.y2 + 8) over = true;
          if (exp === 'bottom' && p[1] < at.b.y - 8) over = true;
          if (exp === 'left' && p[0] > at.b.x2 + 8) over = true;
          if (exp === 'right' && p[0] < at.b.x - 8) over = true;
        }
        if (over) add('warn', 'edge-overshoot', `连线 ${idOf(ar)} 路径越过 ${idOf(at.n)} 远侧再绕回(应直连,不过冲)`);
      }
    }
  }

  // W crossings(连线交叉;成对线相交 = 可读性下降。多数由"端口顺序反了"导致,可消除)
  const segInt = (a, b, c, d) => {
    const ccw = (p, q, r) => (r[1] - p[1]) * (q[0] - p[0]) - (q[1] - p[1]) * (r[0] - p[0]);
    const d1 = ccw(c, d, a), d2 = ccw(c, d, b), d3 = ccw(a, b, c), d4 = ccw(a, b, d);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  };
  const edgeSegs = arrows.map(ar => ({ id: ar.id, pts: (ar.points || []).map(p => [ar.x + p[0], ar.y + p[1]]) })).filter(e => e.pts.length >= 2);
  let crossN = 0;
  for (let i = 0; i < edgeSegs.length; i++)
    for (let j = i + 1; j < edgeSegs.length; j++) {
      let hit = false;
      for (let s = 0; s + 1 < edgeSegs[i].pts.length && !hit; s++)
        for (let t = 0; t + 1 < edgeSegs[j].pts.length && !hit; t++)
          if (segInt(edgeSegs[i].pts[s], edgeSegs[i].pts[s + 1], edgeSegs[j].pts[t], edgeSegs[j].pts[t + 1])) hit = true;
      if (hit) { crossN++; if (crossN <= 8) add('warn', 'crossings', `连线 ${idOf({ id: edgeSegs[i].id })} 与 ${idOf({ id: edgeSegs[j].id })} 交叉(多为端口顺序反:让连接点顺序跟源顺序一致即可消除)`); }
    }
  if (crossN > 8) add('warn', 'crossings', `…另有 ${crossN - 8} 处交叉未列出`);

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
