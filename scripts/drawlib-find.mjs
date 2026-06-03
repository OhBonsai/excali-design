#!/usr/bin/env node
/**
 * drawlib-find.mjs · 在 drawlib-index.json 里按关键词/分类查组件 → 打印 data-lib 序号
 *
 * 资产优先:画之前先 find,有现成的就 data-lib 复用,别手画。
 *
 * 用法:
 *   node scripts/drawlib-find.mjs pie              # 名/标签/库名/分类里搜 "pie"
 *   node scripts/drawlib-find.mjs checkbox button  # 多词(任一命中)
 *   node scripts/drawlib-find.mjs --cat chart      # 按分类列全部
 *   node scripts/drawlib-find.mjs --lib forms      # 按库列全部
 *   node scripts/drawlib-find.mjs --cats           # 列所有分类 + 计数
 * 若 drawlib-index.json 不存在或过期:node scripts/build-drawlib-index.mjs
 * 纯 Node,零依赖。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IDX = path.join(__dirname, '..', 'drawlib-index.json');

if (!fs.existsSync(IDX)) { console.error('✗ 缺 drawlib-index.json → 先跑 node scripts/build-drawlib-index.mjs'); process.exit(2); }
const data = JSON.parse(fs.readFileSync(IDX, 'utf8'));
const argv = process.argv.slice(2);

function flag(name) { const i = argv.indexOf(name); return i >= 0 ? (argv[i + 1] || '') : null; }

if (argv.includes('--cats')) {
  const by = {};
  for (const e of data.entries) by[e.category] = (by[e.category] || 0) + 1;
  console.log(`分类(${data.items} 件 / ${data.libs} 库):`);
  for (const [c, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${c}`);
  process.exit(0);
}

const cat = flag('--cat'), lib = flag('--lib');
let hits;
if (cat) hits = data.entries.filter(e => e.category === cat);
else if (lib) hits = data.entries.filter(e => e.lib === lib);
else {
  const terms = argv.filter(a => !a.startsWith('--')).map(s => s.toLowerCase());
  if (!terms.length) { console.error('用法: drawlib-find.mjs <关键词…> | --cat <类> | --lib <库> | --cats'); process.exit(1); }
  hits = data.entries.filter(e => {
    const hay = `${e.id} ${e.name} ${e.category} ${e.tags.join(' ')}`.toLowerCase();
    return terms.some(t => hay.includes(t));
  });
}

if (!hits.length) { console.log('（无命中。试 --cats 看有哪些分类,或 build-drawlib-index 重建）'); process.exit(0); }
console.log(`命中 ${hits.length} 个 → 用 data-lib="<id>" 复用:`);
for (const e of hits.slice(0, 60)) console.log(`  ${e.id.padEnd(34)} ${e.name}   [${e.category}]`);
if (hits.length > 60) console.log(`  … 还有 ${hits.length - 60} 个(用 --cat/--lib 收窄)`);
console.log('⚠ 序号会随库更新漂移 → 用前先 node scripts/drawlib-sheet.mjs <库名> 渲接触表核对。');
