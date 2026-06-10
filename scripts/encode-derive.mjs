#!/usr/bin/env node
/**
 * encode-derive.mjs · 程序推导 encode.ir 的**机械通道**,只吃一份 LLM 语义 overrides(零依赖)
 *
 * encode.ir 里大半是机械的(可从 view.ir 确定性算出),不该让大模型逐字写:
 *   tiers → size/weight/value 梯度(有序)   hero → accent+hero+bold
 *   relation.kind → stroke(flow=solid / dependency=dashed)+ hue(dep=muted)+ endArrowhead=arrow
 *   group → containment(dashed+muted)
 * 真正语义的只剩几项,由 LLM 在 overrides 里给:
 *   每个角色的 mark 形状 / drawlib icon、特殊箭头头型(UML/ER)、中段 label、名义类别 hue(cat:)。
 *
 * 用法:node scripts/encode-derive.mjs <view.ir.json> [--overrides <sem.json>] [--out <encode.ir.json>]
 * 产物按构造满足 encode-check(再跑一遍 --from 兜底)。
 *
 * overrides 形状(全可选):
 *   { "marks":   { "<id>":  { "mark":"cylinder", "icon":"db", "hue":"cat:store", "fill":"hachure" } },
 *     "links":   { "a->b":  { "endArrowhead":"triangle_outline", "startArrowhead":"diamond", "label":"...", "stroke":"dotted", "hue":"muted" } },
 *     "regions": { "<组名>": { "stroke":"solid", "hue":"muted", "fill":"none" } } }
 */
import fs from 'node:fs';

function args(argv) {
  const a = { _: [] }; const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) { let t = it[i], v = null; const e = t.indexOf('='); if (t.startsWith('--') && e >= 0) { v = t.slice(e + 1); t = t.slice(0, e); } const nx = () => v !== null ? v : it[++i];
    if (t === '--overrides') a.ov = nx(); else if (t === '--out') a.out = nx(); else if (!t.startsWith('--')) a._.push(t); }
  return a;
}

// tier 梯度(有序通道)。idx=档号(0=顶),T=总档数。
function ladder(T, idx) {
  const last = idx === T - 1;
  const size = idx === 0 ? 'hero' : idx === 1 ? 'large' : last ? 'small' : 'normal';
  const weight = idx === 0 ? 'bold' : idx === 1 ? 'emph' : last ? 'light' : 'normal';
  const value = last && T > 1 ? 0.9 : 1.0;
  const hue = idx === 0 ? 'accent' : last && T > 1 ? 'muted' : 'ink';
  return { size, weight, value, hue };
}

function derive(view, ov) {
  const items = view.items || [];
  const tiers = view.tiers || [];
  const T = tiers.length || 1;
  const tierOf = id => { const i = tiers.findIndex(t => t.includes(id)); return i < 0 ? Math.max(0, T - 1) : i; };
  const mOv = (ov && ov.marks) || {}, lOv = (ov && ov.links) || {}, rOv = (ov && ov.regions) || {};

  const marks = items.map(it => {
    const id = it.id; const o = mOv[id] || {};
    const lad = ladder(T, tierOf(id));
    const isHero = id === view.hero;
    const channels = {
      hue: o.hue || (isHero ? 'accent' : lad.hue),
      value: isHero ? 1.0 : lad.value,
      size: isHero ? 'hero' : lad.size,
      weight: isHero ? 'bold' : lad.weight,
    };
    if (isHero) channels.fill = o.fill || 'solid';
    else if (o.fill) channels.fill = o.fill;
    if (o.icon) channels.icon = o.icon;
    return { id, mark: o.mark || (o.icon ? 'icon' : 'box'), channels };
  });

  const links = (view.relations || []).map(r => {
    const rel = `${r.from}->${r.to}`; const o = lOv[rel] || {};
    const dep = r.kind === 'dependency';
    const link = { rel, channel: 'connection', stroke: o.stroke || (dep ? 'dashed' : 'solid'), hue: o.hue || (dep ? 'muted' : 'ink') };
    link.endArrowhead = (o.endArrowhead !== undefined) ? o.endArrowhead : 'arrow';
    if (o.startArrowhead !== undefined) link.startArrowhead = o.startArrowhead;
    if (o.label) link.label = o.label;
    return link;
  });

  const regions = (view.groups || []).map(g => {
    const o = rOv[g.name] || {};
    const reg = { group: g.name, channel: 'containment', stroke: o.stroke || 'dashed', hue: o.hue || 'muted' };
    if (o.fill) reg.fill = o.fill;
    return reg;
  });

  return {
    from: view.from,
    message: view.message,
    dataset_type: view.dataset_type,
    marks, links, regions,
    palette: (ov && ov.palette) || { accent: '#1971c2', ink: '#1e1e1e', muted: '#868e96' },
    notes: (ov && ov.notes) || ['机械通道由 encode-derive 程序推导;只有 mark 形状/图标/特殊头型/类别来自 LLM overrides'],
  };
}

const a = args(process.argv);
if (!a._.length) { console.error('用法: node scripts/encode-derive.mjs <view.ir.json> [--overrides <sem.json>] [--out <encode.ir.json>]'); process.exit(2); }
const view = JSON.parse(fs.readFileSync(a._[0], 'utf8'));
const ov = a.ov ? JSON.parse(fs.readFileSync(a.ov, 'utf8')) : null;
const enc = derive(view, ov);
const out = a.out || a._[0].replace(/\.view-ir\.json$/, '.encode-ir.json').replace(/\.json$/, '.encode-ir.json');
fs.writeFileSync(out, JSON.stringify(enc, null, 2) + '\n');
console.log(`encode-derive: ${enc.marks.length} marks · ${enc.links.length} links · ${enc.regions.length} regions → ${out}`);
console.log(`  校验: node scripts/encode-check.mjs ${out} --from ${a._[0]}`);
