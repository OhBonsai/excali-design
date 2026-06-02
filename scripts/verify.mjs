#!/usr/bin/env node
/**
 * verify.mjs · .excalidraw 结构校验。纯 Node,零依赖。
 *
 * 用法:
 *   node scripts/verify.mjs 图.excalidraw
 *
 * 检查:元素 id 唯一 · 箭头 binding 指向存在的元素。
 * (布局美学/重叠/连线问题用 arch-lint.mjs。)
 */
import fs from 'node:fs';
import path from 'node:path';

function loadElements(p) {
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Array.isArray(d) ? d : (d.elements || []);
}

function checkElements(els, label) {
  const issues = [];
  const ids = els.map(e => e.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) issues.push(`${label}: 存在重复 id`);
  const idset = new Set(ids);
  for (const e of els) {
    if (e.type === 'arrow') {
      for (const b of ['startBinding', 'endBinding']) {
        const bind = e[b];
        if (bind && bind.elementId && !idset.has(bind.elementId))
          issues.push(`${label}: 箭头 ${e.id} 的 ${b} 指向不存在的元素 ${bind.elementId}`);
      }
    }
  }
  return issues;
}

function main() {
  const target = process.argv[2];
  if (!target) { console.error('用法: node verify.mjs 图.excalidraw'); process.exit(1); }
  const els = loadElements(target);
  const issues = checkElements(els, path.basename(target));
  console.log(`校验 ${els.length} 个元素。`);
  if (issues.length) {
    console.log('\n发现问题:');
    for (const i of issues) console.log('  ⚠', i);
    process.exit(2);
  }
  console.log('✓ 通过');
}

main();
