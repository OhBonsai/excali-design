#!/usr/bin/env node
/**
 * verify.mjs · 帧/图结构校验(绘图刷新动画 & 静态图)。纯 Node,零依赖。
 *
 * 用法:
 *   node scripts/verify.mjs _frames/order-flow         # 校验帧序列
 *   node scripts/verify.mjs 架构图.excalidraw          # 校验单个 .excalidraw
 *
 * 检查:元素 id 唯一 · 箭头 binding 指向存在的元素 · 跨帧共享元素 seed 不变(防鬼畜)。
 */
import fs from 'node:fs';
import path from 'node:path';

function loadElements(p) {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Array.isArray(data) ? data : (data.elements || []);
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
  if (!target) { console.error('用法: node verify.mjs <_frames/dir | file.excalidraw>'); process.exit(1); }
  const issues = [];

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const frameFiles = fs.readdirSync(target).filter(f => /^frame-\d+\.json$/.test(f)).sort();
    if (frameFiles.length === 0) { console.error('目录中无 frame-*.json:', target); process.exit(1); }
    const seedMap = new Map();
    for (const ff of frameFiles) {
      const els = loadElements(path.join(target, ff));
      issues.push(...checkElements(els, ff));
      for (const e of els) {
        if (e.id && e.seed != null) {
          if (seedMap.has(e.id) && seedMap.get(e.id) !== e.seed)
            issues.push(`${ff}: 元素 ${e.id} 的 seed 跨帧变化(动画会鬼畜)`);
          if (!seedMap.has(e.id)) seedMap.set(e.id, e.seed);
        }
      }
    }
    console.log(`校验 ${frameFiles.length} 帧。`);
  } else {
    const els = loadElements(target);
    issues.push(...checkElements(els, path.basename(target)));
    console.log(`校验 ${els.length} 个元素。`);
  }

  if (issues.length) {
    console.log('\n发现问题:');
    for (const i of issues) console.log('  ⚠', i);
    process.exit(2);
  }
  console.log('✓ 通过');
}

main();
