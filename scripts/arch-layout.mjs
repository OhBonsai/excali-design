#!/usr/bin/env node
/**
 * arch-layout.mjs · 声明组件树 → ELK 自动布局 → Excalidraw(生成即合规,不手摆)
 *
 * 架构图本质是 DAG;手摆坐标必出重叠/错位。这里复用 elkjs(纯 JS 的 Eclipse Layout Kernel):
 * layered 摆节点 + 正交路由绕线 + 复合嵌套(容器),数学上保证不重叠 / 同层对齐 / 最小交叉。
 * 输出 .excalidraw,再跑 arch-lint.mjs 兜底通常 0 error。
 *
 * 用法:
 *   node scripts/arch-layout.mjs <spec.json> [--out 图.excalidraw] [--direction RIGHT|DOWN]
 *
 * spec.json:
 *   {
 *     "direction": "RIGHT",                         // RIGHT(数据流) | DOWN(分层)
 *     "groups":  [{"id":"data","label":"数据层"}],   // 可选:分层背景/泳道
 *     "nodes":   [{"id":"client","label":"Client","group":null,
 *                  "width":140,"height":64,"color":"#1971c2","bg":"#a5d8ff"}],
 *     "edges":   [{"from":"client","to":"gw","label":"HTTP","dashed":false}]
 *   }
 *
 * 依赖:npm install elkjs(纯 JS,无 native)。仅自动布局时需要。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const a = { direction: 'RIGHT', _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--out') a.out = next();
    else if (t === '--direction') a.direction = next();
    else if (!t.startsWith('--')) a._.push(t);
  }
  return a;
}

let seedN = 1; const seed = () => (seedN = (seedN * 1103515245 + 12345) & 0x7fffffff);
const INK = '#1e1e1e', GRAY = '#868e96', FAINT = '#e9ecef';

function estWidth(label, given) { return given || Math.max(120, Math.round((label || '').length * 11 + 28)); }

async function main() {
  const a = parseArgs(process.argv);
  const specPath = a._[0];
  if (!specPath) { console.error('用法: node arch-layout.mjs <spec.json> [--out 图.excalidraw] [--direction RIGHT|DOWN]'); process.exit(1); }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

  let ELK;
  try { ELK = (await import('elkjs/lib/elk.bundled.js')).default; }
  catch { console.error('🚧 需要 elkjs:npm install elkjs'); process.exit(3); }

  // ── 组装 ELK 图(分组 → 复合容器)──
  const byGroup = {};
  for (const g of spec.groups || []) byGroup[g.id] = { id: g.id, labels: [{ text: g.label || g.id }], children: [], layoutOptions: { 'elk.padding': '[top=36,left=16,bottom=16,right=16]' } };
  const top = [];
  const nodeMeta = {};
  for (const n of spec.nodes) {
    const w = estWidth(n.label, n.width), h = n.height || 64;
    nodeMeta[n.id] = { ...n, w, h };
    const en = { id: n.id, width: w, height: h, labels: [{ text: n.label || n.id }] };
    if (n.group && byGroup[n.group]) byGroup[n.group].children.push(en);
    else top.push(en);
  }
  const children = [...Object.values(byGroup), ...top];
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': a.direction,
      'elk.edgeRouting': 'ORTHOGONAL', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.spacing.nodeNode': '40', 'elk.layered.spacing.nodeNodeBetweenLayers': '90',
      'elk.spacing.edgeNode': '24', 'elk.layered.spacing.edgeNodeBetweenLayers': '24',
    },
    children,
    edges: (spec.edges || []).map((e, i) => ({ id: `e${i}`, sources: [e.from], targets: [e.to], labels: e.label ? [{ text: e.label }] : [], _meta: e })),
  };

  const res = await new ELK().layout(graph);

  // ── 绝对坐标(容器子节点相对父级,累加偏移)──
  const abs = new Map();
  const walk = (node, ox, oy) => {
    for (const c of node.children || []) {
      const x = ox + c.x, y = oy + c.y;
      abs.set(c.id, { x, y, w: c.width, h: c.height, isGroup: !!(c.children && c.children.length), label: c.labels?.[0]?.text });
      walk(c, x, y);
    }
  };
  walk(res, 0, 0);

  // ── 翻译为 Excalidraw 元素 ──
  const els = [];
  const round = v => Math.round(v);
  const txt = (text, x, y, size, color, w, align = 'center') => ({
    type: 'text', id: `t_${seed()}`, x: round(x), y: round(y), width: w, height: size + 6, angle: 0, text,
    fontSize: size, fontFamily: 2, textAlign: align, verticalAlign: 'top', strokeColor: color, backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: seed(), groupIds: [],
    roundness: null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1,
  });
  const boundOf = {};
  const rect = (id, b, stroke, bg, isGroup) => {
    boundOf[id] = [];
    return {
      type: 'rectangle', id, x: round(b.x), y: round(b.y), width: round(b.w), height: round(b.h), angle: 0,
      strokeColor: stroke, backgroundColor: bg, fillStyle: 'solid', strokeWidth: isGroup ? 1 : 2,
      strokeStyle: isGroup ? 'dashed' : 'solid', roughness: 1, opacity: 100, seed: seed(), groupIds: [],
      roundness: isGroup ? null : { type: 3 }, boundElements: boundOf[id], isDeleted: false, versionNonce: seed(), updated: 1,
    };
  };

  // 1) 分组背景(先画,在底层)
  for (const [id, b] of abs) if (b.isGroup) {
    els.push(rect(id, b, GRAY, '#f8f9fa', true));
    els.push(txt(b.label, b.x + 12, b.y + 10, 14, GRAY, b.w - 24, 'left'));
  }
  // 2) 叶子节点 + 居中标签
  for (const n of spec.nodes) {
    const b = abs.get(n.id); if (!b) continue;
    els.push(rect(n.id, b, n.color || INK, n.bg || 'transparent', false));
    const label = n.label || n.id;
    els.push(txt(label, b.x, b.y + (b.h - 20) / 2, 18, INK, b.w, 'center'));
  }
  // 3) 边(正交 bend 点 + binding)
  (res.edges || []).forEach((e) => {
    const s = e.sections?.[0]; if (!s) return;
    const pts = [s.startPoint, ...(s.bendPoints || []), s.endPoint];
    const ox = pts[0].x, oy = pts[0].y;
    const meta = (spec.edges || [])[parseInt(e.id.slice(1))] || {};
    const arrow = {
      type: 'arrow', id: e.id, x: round(ox), y: round(oy),
      width: round(Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))),
      height: round(Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))), angle: 0,
      points: pts.map(p => [round(p.x - ox), round(p.y - oy)]),
      strokeColor: meta.color || INK, backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2,
      strokeStyle: meta.dashed ? 'dashed' : 'solid', roughness: 1, opacity: 100, seed: seed(), groupIds: [],
      roundness: null, boundElements: [], isDeleted: false,
      startBinding: { elementId: e.sources[0], focus: 0, gap: 4 }, endBinding: { elementId: e.targets[0], focus: 0, gap: 4 },
      lastCommittedPoint: null, startArrowhead: null, endArrowhead: 'arrow', versionNonce: seed(), updated: 1,
    };
    els.push(arrow);
    boundOf[e.sources[0]]?.push({ type: 'arrow', id: e.id });
    boundOf[e.targets[0]]?.push({ type: 'arrow', id: e.id });
    if (meta.label) els.push(txt(meta.label, (s.startPoint.x + s.endPoint.x) / 2 - meta.label.length * 4, (s.startPoint.y + s.endPoint.y) / 2 - 18, 12, GRAY, meta.label.length * 11));
  });

  const out = a.out || specPath.replace(/\.json$/i, '') + '.excalidraw';
  const doc = { type: 'excalidraw', version: 2, source: 'excali-design/arch-layout', elements: els, appState: { viewBackgroundColor: '#fafaf6', gridSize: null } };
  fs.writeFileSync(out, JSON.stringify(doc, null, 1));
  console.log(`✓ 生成 ${els.length} 元素 → ${out}`);
  console.log(`  画布 ~${round(res.width)}x${round(res.height)} · 建议 lint: node scripts/arch-lint.mjs "${out}"`);
}

main().catch(e => { console.error(e); process.exit(1); });
