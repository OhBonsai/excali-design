#!/usr/bin/env node
/**
 * assemble-lib.mjs · 按 manifest 从 _candidates/ 精挑的 item 合并成自有 .excalidrawlib
 *
 * pick 流程最后一步:图像识别选好后,把选中的 item 抽出来、统一命名、重生成 id,
 * 合并成 drawlib/<target>.excalidrawlib(libraryItems v2,带 name → 索引自动有名)。
 *
 * manifest(JSON):
 *   { "target": "excali-net",
 *     "license": "MIT — 各 item 出处见 source 字段",
 *     "items": [ { "src":"network-topology-icons.excalidrawlib", "index":3, "name":"VPN", "source":"dwelle/network-topology-icons" }, ... ] }
 *   src 相对 _candidates/<target>/;source 仅作出处记录。
 *
 * 用法:node scripts/assemble-lib.mjs manifests/excali-net.json
 * 纯 Node,零依赖。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let sid = 99; const rid = () => 'a' + (sid = (sid * 1103515245 + 12345) & 0x7fffffff).toString(36);

function loadItems(file) { const j = JSON.parse(fs.readFileSync(file, 'utf8')); return j.library || j.libraryItems || []; }

// 取一个 item 的 elements,per-item 重生成 element id + groupId,保持内部引用一致
function extract(raw) {
  const src = (Array.isArray(raw) ? raw : (raw.elements || [])).filter(e => !e.isDeleted);
  const idMap = new Map(), gMap = new Map();
  for (const e of src) { idMap.set(e.id, rid()); (e.groupIds || []).forEach(g => { if (!gMap.has(g)) gMap.set(g, rid()); }); }
  return src.map(e => {
    const ne = JSON.parse(JSON.stringify(e));
    ne.id = idMap.get(e.id);
    if (ne.groupIds) ne.groupIds = ne.groupIds.map(g => gMap.get(g) || g);
    if (ne.boundElements) ne.boundElements = ne.boundElements.map(b => ({ ...b, id: idMap.get(b.id) })).filter(b => b.id);
    if (ne.startBinding?.elementId) ne.startBinding = { ...ne.startBinding, elementId: idMap.get(ne.startBinding.elementId) || ne.startBinding.elementId };
    if (ne.endBinding?.elementId) ne.endBinding = { ...ne.endBinding, elementId: idMap.get(ne.endBinding.elementId) || ne.endBinding.elementId };
    if (ne.containerId) ne.containerId = idMap.get(ne.containerId) || ne.containerId;
    return ne;
  });
}

function main() {
  const mf = process.argv[2];
  if (!mf) { console.error('用法: node scripts/assemble-lib.mjs manifests/<target>.json'); process.exit(1); }
  const m = JSON.parse(fs.readFileSync(path.resolve(mf), 'utf8'));
  const candDir = path.join(ROOT, '_candidates', m.target);
  const cache = {};
  const libraryItems = [];
  m.items.forEach((it, i) => {
    const file = path.join(candDir, it.src);
    if (!(it.src in cache)) cache[it.src] = loadItems(file);
    const raw = cache[it.src][it.index];
    if (!raw) { console.error(`✗ ${it.src}:${it.index} 越界`); return; }
    libraryItems.push({ status: 'published', id: rid(), created: Date.now(), name: it.name || `${m.target} #${i}`, elements: extract(raw) });
  });
  const out = path.join(ROOT, 'drawlib', m.target + '.excalidrawlib');
  fs.writeFileSync(out, JSON.stringify({ type: 'excalidrawlib', version: 2, source: 'excali-design (curated, MIT)', libraryItems }, null, 1));
  console.log(`✓ ${m.target}: 合并 ${libraryItems.length} 件 → ${out}`);
  console.log(`  出处(MIT):${[...new Set(m.items.map(i => i.source))].join(', ')}`);
  console.log(`  下一步:node scripts/build-drawlib-index.mjs && node scripts/drawlib-sheet.mjs ${m.target}`);
}
main();
