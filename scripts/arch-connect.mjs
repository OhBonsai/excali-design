#!/usr/bin/env node
/**
 * arch-connect.mjs · 连线路由器(人摆框,程序连线)
 *
 * 解决根因:手摆海报型架构图时,agent 靠肉眼估每条边的点坐标 → 必出斜线/绕背面/交叉/端口挤一起。
 * 本工具把「连线路由」从手工估坐标变成确定性计算:你已摆好框 + 声明逻辑连接(A→B),
 * 它算出**正交 + 面向边出入 + 端口均匀分布 + 按对端顺序排(自动消交叉)+ binding** 的线,写回 .excalidraw。
 *
 * 「节点摆放(需品味,人来)」与「连线路由(纯几何,程序来)」解耦——和 arch-layout 互补:
 *   arch-layout = 连节点都自动摆(拓扑密集图);arch-connect = 框你摆好、只把线连对(海报型图)。
 *
 * 用法:
 *   node scripts/arch-connect.mjs <boxes.excalidraw> <edges.json> [--out out.excalidraw]
 *
 * edges.json:  [{"from":"mcp","to":"out","label":"...","dashed":false,"color":"#1e1e1e"}]
 *   (或 {"edges":[...]})。from/to = boxes.excalidraw 里 rectangle 的 id。
 *
 * 行为:删掉输入里所有现存 arrow(替换为正确路由),保留 box/text/容器;输出合并结果。
 * 纯 Node,零依赖。
 */
import fs from 'node:fs';

let seedN = 7; const seed = () => (seedN = (seedN * 1103515245 + 12345) & 0x7fffffff);

function parseArgs(argv) {
  const a = { _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    if (t === '--out') a.out = v !== null ? v : it[++i];
    else if (!t.startsWith('--')) a._.push(t);
  }
  return a;
}

const bbox = e => ({ x: e.x, y: e.y, x2: e.x + (e.width || 0), y2: e.y + (e.height || 0), cx: e.x + (e.width || 0) / 2, cy: e.y + (e.height || 0) / 2 });

function main() {
  const a = parseArgs(process.argv);
  if (a._.length < 2) { console.error('用法: node arch-connect.mjs <boxes.excalidraw> <edges.json> [--out out]'); process.exit(1); }
  const doc = JSON.parse(fs.readFileSync(a._[0], 'utf8'));
  let elements = (Array.isArray(doc) ? doc : doc.elements || []).filter(e => e && !e.isDeleted);
  let edges = JSON.parse(fs.readFileSync(a._[1], 'utf8'));
  if (!Array.isArray(edges)) edges = edges.edges || [];

  const boxes = elements.filter(e => ['rectangle', 'ellipse', 'diamond', 'image'].includes(e.type));
  const byId = new Map(boxes.map(e => [e.id, e]));
  const bb = new Map(boxes.map(e => [e.id, bbox(e)]));

  // 1) 每条边定"面向边"(facing side):按源/目标相对位置
  const facing = (from, to) => {
    const dx = to.cx - from.cx, dy = to.cy - from.cy;
    return Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 'bottom' : 'top') : (dx > 0 ? 'right' : 'left');
  };
  const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const routed = [];
  for (const e of edges) {
    const S = bb.get(e.from), T = bb.get(e.to);
    if (!S || !T) { console.error(`跳过:找不到 ${e.from} 或 ${e.to}`); continue; }
    // 默认按相对位置选"面向边";可用 fromSide/toSide 强制(fan-in 让多条线进目标同一边)
    let sSide = e.fromSide || null, tSide = e.toSide || null;
    if (!sSide && !tSide) { sSide = facing(S, T); tSide = opp[sSide]; }
    else if (tSide && !sSide) sSide = opp[tSide];
    else if (sSide && !tSide) tSide = opp[sSide];
    routed.push({ e, S, T, sSide, tSide });
  }

  // 2) 端口分布:同一(节点,边)上的多条连线,沿该边均匀铺开,按"对端位置"排序(消交叉)
  const portGroups = new Map();  // key = id|side -> [{routed, isStart, otherCenter}]
  const addPort = (id, side, r, isStart, otherCenter) => {
    const k = id + '|' + side; (portGroups.get(k) ?? portGroups.set(k, []).get(k)).push({ r, isStart, otherCenter });
  };
  for (const r of routed) {
    addPort(r.e.from, r.sSide, r, true, r.T.cx /*for top/bottom*/ ?? 0);
  }
  // 重新按 side 轴正确取 otherCenter
  portGroups.clear();
  for (const r of routed) {
    const sAxis = (r.sSide === 'top' || r.sSide === 'bottom') ? r.T.cx : r.T.cy;
    const tAxis = (r.tSide === 'top' || r.tSide === 'bottom') ? r.S.cx : r.S.cy;
    addPort(r.e.from, r.sSide, r, true, sAxis);
    addPort(r.e.to, r.tSide, r, false, tAxis);
  }
  const portPos = new Map();  // r + role -> {x,y}
  for (const [k, list] of portGroups) {
    const [id, side] = k.split('|'); const b = bb.get(id);
    const horiz = side === 'top' || side === 'bottom';
    const lo = horiz ? b.x : b.y, hi = horiz ? b.x2 : b.y2;
    list.sort((p, q) => p.otherCenter - q.otherCenter);   // 按对端顺序排 → 不交叉
    const n = list.length;
    list.forEach((p, i) => {
      const t = lo + (hi - lo) * (i + 1) / (n + 1);        // 均匀分布
      const pt = horiz ? [t, side === 'top' ? b.y : b.y2] : [side === 'left' ? b.x : b.x2, t];
      portPos.set(p.r.e.__id ?? (p.r.e.__id = Symbol()), portPos.get(p.r.e.__id) || {});
      portPos.get(p.r.e.__id)[p.isStart ? 'start' : 'end'] = pt;
    });
  }

  // 3) 正交路由(3 段 elbow:出源边 → 中线通道 → 入目标边)
  const elbow = (sp, tp, sSide) => {
    if (sSide === 'top' || sSide === 'bottom') {
      if (Math.abs(sp[0] - tp[0]) < 1) return [sp, tp];
      const midY = (sp[1] + tp[1]) / 2; return [sp, [sp[0], midY], [tp[0], midY], tp];
    } else {
      if (Math.abs(sp[1] - tp[1]) < 1) return [sp, tp];
      const midX = (sp[0] + tp[0]) / 2; return [sp, [midX, sp[1]], [midX, tp[1]], tp];
    }
  };

  const arrowsOut = [];
  for (const r of routed) {
    const pp = portPos.get(r.e.__id); if (!pp || !pp.start || !pp.end) continue;
    const pts = elbow(pp.start, pp.end, r.sSide);
    const ox = pts[0][0], oy = pts[0][1];
    const id = 'c_' + seed();
    arrowsOut.push({
      type: 'arrow', id, x: Math.round(ox), y: Math.round(oy),
      width: Math.round(Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0]))),
      height: Math.round(Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]))), angle: 0,
      points: pts.map(p => [Math.round(p[0] - ox), Math.round(p[1] - oy)]),
      strokeColor: r.e.color || '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2,
      strokeStyle: r.e.dashed ? 'dashed' : 'solid', roughness: 1, opacity: 100, seed: seed(), groupIds: [],
      roundness: null, boundElements: [], isDeleted: false,
      startBinding: { elementId: r.e.from, focus: 0, gap: 4 }, endBinding: { elementId: r.e.to, focus: 0, gap: 4 },
      lastCommittedPoint: null, startArrowhead: null, endArrowhead: 'arrow', versionNonce: seed(), updated: 1,
    });
    for (const nid of [r.e.from, r.e.to]) { const box = byId.get(nid); if (box) { box.boundElements = (box.boundElements || []).filter(x => x.type !== 'arrow' || x.id !== id); box.boundElements.push({ type: 'arrow', id }); } }
    if (r.e.label) {
      const mid = pts[Math.floor(pts.length / 2) - (pts.length > 2 ? 0 : 0)];
      arrowsOut.push({ type: 'text', id: 't_' + seed(), x: Math.round((pts[0][0] + pts[pts.length - 1][0]) / 2 - r.e.label.length * 4), y: Math.round((pts[0][1] + pts[pts.length - 1][1]) / 2 - 9), width: r.e.label.length * 11, height: 18, text: r.e.label, fontSize: 13, fontFamily: 2, textAlign: 'center', verticalAlign: 'top', strokeColor: '#868e96', backgroundColor: '#fafaf6', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: seed(), groupIds: [], roundness: null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1 });
    }
  }

  // 4) 输出:原元素(去掉旧 arrow)+ 新路由的 arrow
  const kept = elements.filter(e => e.type !== 'arrow');
  const out = { type: 'excalidraw', version: 2, source: 'excali-design/arch-connect', elements: [...kept, ...arrowsOut], appState: (Array.isArray(doc) ? {} : doc.appState) || { viewBackgroundColor: '#fafaf6' } };
  const outPath = a.out || a._[0].replace(/\.excalidraw$/i, '') + '.connected.excalidraw';
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log(`✓ 路由 ${routed.length} 条连线(正交+面向边+均匀分布+按序排)→ ${outPath}`);
  console.log(`  建议 lint: node scripts/arch-lint.mjs "${outPath}"`);
}

main();
