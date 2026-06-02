#!/usr/bin/env node
/**
 * drawlib-sheet.mjs · 把一个 .excalidrawlib 的所有 item 排成「接触表」
 *
 * 库里很多 item 无 name,只能按**序号**用(data-lib="库名:序号")。这脚本把每个 item
 * 缩放进格子、标上 #序号(+name),拼成一张图 → 渲染成 PNG 一眼看清谁是谁、序号是几。
 * 序号会随库更新变,所以**用 data-lib 前先渲这张核对**。
 *
 * 用法:
 *   node scripts/drawlib-sheet.mjs data-viz                 # 单个库
 *   node scripts/drawlib-sheet.mjs all --out-dir test/_sheets
 *   node scripts/drawlib-sheet.mjs forms --cols 6 --cell 220
 * 然后:node scripts/excalidraw-to-image.mjs <out>.excalidraw --png
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIBDIR = path.join(__dirname, '..', 'drawlib');

function parseArgs(argv) {
  const a = { cols: 6, cell: 240, outDir: path.join(__dirname, '..', 'test', '_sheets') };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--cols') a.cols = parseInt(next());
    else if (t === '--cell') a.cell = parseInt(next());
    else if (t === '--out-dir') a.outDir = next();
    else if (!t.startsWith('--')) a.lib = t;
  }
  return a;
}

function sheet(libPath, { cols, cell }) {
  const lib = JSON.parse(fs.readFileSync(libPath, 'utf8'));
  const items = lib.library || lib.libraryItems || [];
  let sid = 1; const seed = () => (sid = (sid * 1103515245 + 12345) & 0x7fffffff);
  const R = Math.round, GAP = 30, out = [];
  items.forEach((raw, idx) => {
    const els = (Array.isArray(raw) ? raw : (raw.elements || [])).filter(e => !e.isDeleted);
    const name = (Array.isArray(raw) ? '' : (raw.name || '')).slice(0, 22);
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    for (const e of els) { mnx = Math.min(mnx, e.x); mny = Math.min(mny, e.y); mxx = Math.max(mxx, e.x + (e.width || 0)); mxy = Math.max(mxy, e.y + (e.height || 0)); }
    const bw = mxx - mnx || 1, bh = mxy - mny || 1;
    const s = Math.min((cell - 20) / bw, (cell - 54) / bh, 1.2);
    const col = idx % cols, row = Math.floor(idx / cols);
    const ox = GAP + col * (cell + GAP), oy = GAP + row * (cell + GAP) + 30;
    out.push({ type: 'rectangle', id: 'cell' + idx, x: ox - 10, y: oy - 34, width: cell, height: cell, angle: 0, strokeColor: '#ced4da', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: seed(), groupIds: [], roundness: null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1 });
    out.push({ type: 'text', id: 'lab' + idx, x: ox - 6, y: oy - 30, width: cell - 20, height: 18, text: '#' + idx + (name ? ' ' + name : ''), fontSize: 14, fontFamily: 3, textAlign: 'left', verticalAlign: 'top', strokeColor: '#e03131', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: seed(), groupIds: [], roundness: null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1 });
    const m = new Map(); for (const e of els) m.set(e.id, 'c' + idx + '_' + seed());
    for (const e of els) {
      const ne = JSON.parse(JSON.stringify(e)); ne.id = m.get(e.id);
      ne.x = ox + (e.x - mnx) * s; ne.y = oy + (e.y - mny) * s;
      if (ne.width) ne.width *= s; if (ne.height) ne.height *= s;
      if (ne.points) ne.points = ne.points.map(p => [p[0] * s, p[1] * s]);
      if (ne.fontSize) ne.fontSize = Math.max(6, ne.fontSize * s);
      ne.seed = seed(); ne.versionNonce = seed();
      if (ne.boundElements) ne.boundElements = ne.boundElements.map(b => ({ ...b, id: m.get(b.id) })).filter(b => b.id);
      if (ne.startBinding?.elementId) ne.startBinding = { ...ne.startBinding, elementId: m.get(ne.startBinding.elementId) || ne.startBinding.elementId };
      if (ne.endBinding?.elementId) ne.endBinding = { ...ne.endBinding, elementId: m.get(ne.endBinding.elementId) || ne.endBinding.elementId };
      if (ne.containerId) ne.containerId = m.get(ne.containerId) || ne.containerId;
      out.push(ne);
    }
  });
  return { elements: out, count: items.length };
}

function main() {
  const a = parseArgs(process.argv);
  if (!a.lib) { console.error('用法: node scripts/drawlib-sheet.mjs <库名|all> [--cols 6] [--cell 240]'); process.exit(1); }
  fs.mkdirSync(a.outDir, { recursive: true });
  const libs = a.lib === 'all'
    ? fs.readdirSync(LIBDIR).filter(f => f.endsWith('.excalidrawlib')).map(f => f.replace('.excalidrawlib', ''))
    : [a.lib];
  for (const name of libs) {
    const p = path.join(LIBDIR, name + '.excalidrawlib');
    if (!fs.existsSync(p)) { console.error(`✗ 找不到 ${p}`); continue; }
    const { elements, count } = sheet(p, a);
    const outPath = path.join(a.outDir, `_sheet-${name}.excalidraw`);
    fs.writeFileSync(outPath, JSON.stringify({ type: 'excalidraw', version: 2, source: 'excali-design/drawlib-sheet', elements, appState: { viewBackgroundColor: '#ffffff', gridSize: null } }));
    console.log(`✓ ${name}: ${count} 项 → ${outPath}`);
  }
  console.log('渲染: node scripts/excalidraw-to-image.mjs <上面的 .excalidraw> --png');
}
main();
