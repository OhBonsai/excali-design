#!/usr/bin/env node
/**
 * build-drawlib-index.mjs · 扫 drawlib/ 全部 .excalidrawlib → 生成机器可读索引 drawlib-index.json
 *
 * 每个 item 一条:{ id:"库名:序号", lib, index, name, category, domain, tags, types, elements }
 *   - name:item 自带 name 优先;裸数组库(无 name)用下方 NAMES 覆盖表;再不行 fallback "库 #i"
 *   - category/domain/tags:库级映射(LIBMETA)+ 已知 item 标签
 *   - 供 data-lib 程序化检索(drawlib-find.mjs)+ 校验序号是否漂移
 *
 * 用法:node scripts/build-drawlib-index.mjs            # 写 drawlib-index.json
 *       node scripts/build-drawlib-index.mjs --check    # 只对比现有 json,序号/数量变了就非零退出
 * 纯 Node,零依赖。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIBDIR = path.join(__dirname, '..', 'drawlib');
const OUT = path.join(__dirname, '..', 'drawlib-index.json');

// 库级元信息:分类 / 领域 / 通用标签
const LIBMETA = {
  'basic-ux-wireframing-elements': { category: 'ui-control', domain: 'prototype', tags: ['ui', 'wireframe', 'control'] },
  'forms': { category: 'form-control', domain: 'prototype', tags: ['form', 'control', 'state'] },
  'webpage-frames': { category: 'frame', domain: 'prototype', tags: ['frame', 'browser', 'shell'] },
  'information-architecture': { category: 'flowchart-shape', domain: 'diagram', tags: ['flowchart', 'ia', 'shape'] },
  'dev_ops': { category: 'tech-icon', domain: 'architecture', tags: ['icon', 'devops', 'infra'] },
  'data-viz': { category: 'chart', domain: 'dashboard', tags: ['chart', 'dataviz'] },
  'stick-figures': { category: 'person', domain: 'people', tags: ['person', 'actor', 'xkcd'] },
  'awesome-slides': { category: 'slide-template', domain: 'deck', tags: ['slide', 'deck', 'template'] },
  'mathematical-symbols': { category: 'math-symbol', domain: 'math', tags: ['math', 'symbol', 'formula'] },
  'canvases': { category: 'business-canvas', domain: 'strategy', tags: ['business', 'canvas', 'strategy'] },
};

// 裸数组库(无 name)的序号→名 覆盖表(经接触表核对)
const NAMES = {
  'data-viz': ['Bar', 'Stacked bar', '100% stacked bar', 'Grouped bar', 'Column', 'Stacked column', '100% stacked column', 'Grouped column', 'Line', 'Line+markers', 'Area', 'Stacked area', 'Stacked area 2', 'Area 2', 'ThemeRiver', 'Scatter', 'Bubble', 'Calendar heatmap', 'Cartesian heatmap', 'Tree Map', 'Waterfall', 'Dot strip', 'Dot strip multi', 'Column histogram', 'Population pyramid', 'Density plot', 'Box & Whisker', 'Violin', 'Pie', 'Donut', 'Polar/Nightingale', 'Radar'],
  'awesome-slides': ['标题页 Title', '时间线 Timeline', '两栏图文 Two-column', '章节分隔 Section', '路线图 Roadmap', 'Main Flow', '引用 Quote', '时间线卡片 Timeline cards', 'KPI 图表', 'KPI Drilldown', '大数字 Big number', '文字+多屏', '要点 Bullets', 'Emoji 卡片', '团队 The Team', '空白 Blank'],
  'canvases': ['商业模式画布 Business Model Canvas', '价值主张画布 Value Proposition Canvas'],
  'forms': ['Button', '分段控件 Segmented', 'ComboBox', 'Date picker', 'Number spinner', 'Toggle', 'Button dropdown', 'Button next', 'Button back', 'Add (+)', 'Marker', 'Help (?)', 'Media controls', 'Checkbox', 'Checkbox selected', 'Checkbox indeterminate', 'Checkbox disabled', 'Checkbox disabled selected', 'Checkbox disabled indeterminate', 'Radio', 'Radio selected', 'Radio indeterminate', 'Radio disabled', 'Radio disabled selected', 'Radio disabled indeterminate', 'Rich text toolbar'],
};

// 部分 item 的精细标签(锦上添花,便于检索)
const ITEMTAGS = {
  'data-viz': { 0: ['bar'], 4: ['column'], 8: ['line'], 10: ['area'], 15: ['scatter'], 16: ['bubble'], 28: ['pie'], 29: ['donut'], 31: ['radar', 'spider'] },
  'information-architecture': { 0: ['page'], 1: ['file'], 5: ['cluster'], 6: ['decision', 'diamond'], 7: ['branch'], 12: ['area', 'container'] },
};

function loadItems(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  return j.library || j.libraryItems || [];
}

function build() {
  const libs = fs.readdirSync(LIBDIR).filter(f => f.endsWith('.excalidrawlib')).sort();
  const entries = [];
  for (const f of libs) {
    const lib = f.replace('.excalidrawlib', '');
    const meta = LIBMETA[lib] || { category: 'misc', domain: 'misc', tags: [] };
    const items = loadItems(path.join(LIBDIR, f));
    items.forEach((raw, i) => {
      const els = (Array.isArray(raw) ? raw : (raw.elements || [])).filter(e => !e.isDeleted);
      const name = (Array.isArray(raw) ? '' : (raw.name || '')) || (NAMES[lib] && NAMES[lib][i]) || `${lib} #${i}`;
      const types = [...new Set(els.map(e => e.type))];
      const tags = [...meta.tags, ...((ITEMTAGS[lib] && ITEMTAGS[lib][i]) || [])];
      entries.push({ id: `${lib}:${i}`, lib, index: i, name, category: meta.category, domain: meta.domain, tags, types, elements: els.length });
    });
  }
  return {
    generated: new Date().toISOString().slice(0, 10),
    libs: libs.length,
    items: entries.length,
    categories: [...new Set(entries.map(e => e.category))],
    entries,
  };
}

const idx = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) { console.error('✗ 无现有 drawlib-index.json,先生成'); process.exit(2); }
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const a = old.entries.map(e => e.id).join(','), b = idx.entries.map(e => e.id).join(',');
  if (a !== b) { console.error(`✗ 序号/数量漂移:旧 ${old.items} 件 vs 现 ${idx.items} 件 → 重新生成并重渲接触表`); process.exit(1); }
  console.log(`✓ 索引一致(${idx.items} 件)`); process.exit(0);
}
fs.writeFileSync(OUT, JSON.stringify(idx, null, 1));
console.log(`✓ ${idx.items} 件 / ${idx.libs} 库 / ${idx.categories.length} 类 → ${OUT}`);
console.log(`  类:${idx.categories.join(', ')}`);
