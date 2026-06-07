#!/usr/bin/env node
/**
 * fix.mjs · 机械修复器(把 arch-lint 的确定性违规直接改掉,输出修正后的 .excalidraw)
 *
 * 只改「能确定性算对」的机械项;知觉项(squint/hero/平衡)不碰——那要内容判断,留给人/模型。
 *   ★ text-overflow  绑定文字超容器宽 → 加宽容器到放得下
 *   ★ tiny-text      字号 <minfont   → 升到 minfont
 *   ★ overlap        节点部分重叠     → 沿最小穿透轴把后者推开(best-effort,单遍)
 *   ★ offgrid        x/y 未吸附       → snap 到网格(最后做)
 *
 * 用法:
 *   node scripts/fix.mjs <in.excalidraw> [--out out.excalidraw] [--grid 4] [--minfont 12] [--no-overlap]
 * 改完建议复跑 arch-lint 确认。纯 Node,零依赖。
 */
import fs from 'node:fs';

const NODE = new Set(['rectangle', 'ellipse', 'diamond', 'image', 'frame']);
function args(argv) {
  const a = { grid: 4, minfont: 12, overlap: true, _: [] }; const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) { let t = it[i], v = null; const e = t.indexOf('='); if (t.startsWith('--') && e >= 0) { v = t.slice(e + 1); t = t.slice(0, e); } const nx = () => v !== null ? v : it[++i];
    if (t === '--out') a.out = nx(); else if (t === '--grid') a.grid = parseFloat(nx()); else if (t === '--minfont') a.minfont = parseFloat(nx()); else if (t === '--no-overlap') a.overlap = false; else if (!t.startsWith('--')) a._.push(t); }
  return a;
}
const bbox = e => { if (e.points && e.points.length) { const xs = e.points.map(p => e.x + p[0]), ys = e.points.map(p => e.y + p[1]); return { x: Math.min(...xs), y: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) }; } return { x: e.x, y: e.y, x2: e.x + (e.width || 0), y2: e.y + (e.height || 0) }; };
const inter = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y, b.y));
const contains = (a, b) => a.x <= b.x && a.y <= b.y && a.x2 >= b.x2 && a.y2 >= b.y2;
const lineW = (s, fs) => [...String(s)].reduce((w, c) => w + (c.charCodeAt(0) > 255 ? 1.0 : 0.55) * fs, 0);

const a = args(process.argv);
if (!a._.length) { console.error('用法: node scripts/fix.mjs <in.excalidraw> [--out ..] [--grid 4] [--minfont 12] [--no-overlap]'); process.exit(2); }
const file = a._[0];
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
const els = (Array.isArray(doc) ? doc : doc.elements || []).filter(e => e && !e.isDeleted);
const byId = new Map(els.map(e => [e.id, e]));
const log = { 'text-overflow': 0, 'tiny-text': 0, overlap: 0, offgrid: 0 };

// 1) text-overflow → 加宽容器
for (const t of els.filter(e => e.type === 'text' && e.containerId)) {
  const c = byId.get(t.containerId); if (!c || !NODE.has(c.type) || !c.width) continue;
  const fs0 = t.fontSize || 16, need = Math.max(...String(t.text).split('\n').map(ln => lineW(ln, fs0)));
  if (need > c.width * 1.05) { c.width = Math.ceil((need + 16) / a.grid) * a.grid; log['text-overflow']++; }
}
// 2) tiny-text → 升字号
for (const t of els.filter(e => e.type === 'text')) {
  const fs0 = t.fontSize || 16; if (fs0 < a.minfont) { const lines = String(t.text).split('\n').length; t.fontSize = a.minfont; t.height = Math.round(a.minfont * 1.25 * lines); log['tiny-text']++; }
}
// 3) overlap → 沿最小穿透轴推开后者(best-effort 单遍)
if (a.overlap) {
  const nodes = els.filter(e => NODE.has(e.type));
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const A = bbox(nodes[i]), B = bbox(nodes[j]); if (inter(A, B) <= 1) continue; if (contains(A, B) || contains(B, A)) continue;
    const ox = Math.min(A.x2, B.x2) - Math.max(A.x, B.x), oy = Math.min(A.y2, B.y2) - Math.max(A.y, B.y);
    if (ox <= oy) nodes[j].x += (B.x >= A.x ? 1 : -1) * (ox + a.grid); else nodes[j].y += (B.y >= A.y ? 1 : -1) * (oy + a.grid);
    log.overlap++;
  }
}
// 4) offgrid → snap 位置(不动尺寸,免得重新溢出)
if (a.grid > 0) for (const e of els) { const nx = Math.round(e.x / a.grid) * a.grid, ny = Math.round(e.y / a.grid) * a.grid; if (nx !== e.x || ny !== e.y) { e.x = nx; e.y = ny; log.offgrid++; } }

const out = a.out || file.replace(/\.excalidraw$/, '') + '.fixed.excalidraw';
fs.writeFileSync(out, JSON.stringify(doc, null, 2));
const total = Object.values(log).reduce((s, v) => s + v, 0);
console.log(`fix ${file} → ${out}`);
for (const [k, v] of Object.entries(log)) if (v) console.log(`  ✓ ${k}: ${v}`);
console.log(total ? `  共 ${total} 处修正(知觉项未动);建议复跑 arch-lint 确认` : '  无机械项可修');
