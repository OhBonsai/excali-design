#!/usr/bin/env node
/**
 * data-ir-check.mjs · 校验 data.ir + 跑可计算的拆分触发器(零依赖)
 *
 * data.ir 的核心是语义(靠模型),但有几件**可计算**的事能机械把关、甚至自动提拆分建议:
 *   schema    必需字段 / 枚举 / hero 引用合法
 *   capacity  scope.boundary.in(或 items)数 > 预算(默认 9 ≈ 7±2 上限)→ 该拆/砍
 *   over-budget-no-relief  超容量却 budget.cut 与 deferred 都空、且只有 1 张图 → 密度没控制
 *   components 关系图(network/tree)按 relations 求**连通分量**;>1 → 建议按分量拆图(并打印方案)
 *   mece      salience.groups 成员重叠 → MECE 违反;未归组的 item → 覆盖缺口
 *
 * 不查的(语义,留给模型/人):message 对不对、分组切得好不好、是否多个 message。
 *
 * 用法:node scripts/data-ir-check.mjs <data-ir.json> [--budget 9] [--json] [--strict]
 * 退出码:有 error → 1;仅 warn → 0(--strict 则 warn 也 1)。
 *
 * 约束源 = references/data-ir.d.ts(TypeScript 类型)。TS 类型在运行时被擦除,所以本文件是它的
 * **运行时镜像**:下面的枚举集合必须和 d.ts 的字面量联合保持一致(改了 d.ts 记得同步这里)。
 */
import fs from 'node:fs';

// ↓↓ 镜像 references/data-ir.d.ts 的字面量联合(DatasetType / DataLevel / RelationKind)
const DATASET = new Set(['table', 'tree', 'network', 'temporal', 'spatial', 'set']);
const LEVELS = new Set(['nominal', 'ordinal', 'quantitative', 'relational']);
const KINDS = new Set(['hierarchy', 'flow', 'dependency', 'containment', 'similarity']);

function args(argv) {
  const a = { budget: 9, _: [] }; const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) { let t = it[i], v = null; const e = t.indexOf('='); if (t.startsWith('--') && e >= 0) { v = t.slice(e + 1); t = t.slice(0, e); } const nx = () => v !== null ? v : it[++i];
    if (t === '--budget') a.budget = parseInt(nx()); else if (t === '--json') a.json = true; else if (t === '--strict') a.strict = true;
    else if (t === '--view') a.view = true; else if (t === '--from') a.from = nx(); else if (!t.startsWith('--')) a._.push(t); }
  return a;
}

const DENSITY = new Set(['airy', 'balanced', 'dense']);

// 校验 view.ir(镜像 references/view-ir.d.ts)。--from <data-ir.json> 时额外查 items ⊆ 来源 covers。
function runView(file, a) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const F = []; const add = (sev, rule, msg, fix) => F.push({ sev, rule, msg, fix });
  if (!d.message || !String(d.message).trim()) add('error', 'schema', 'message 缺失/为空');
  if (!DATASET.has(d.dataset_type)) add('error', 'schema', `dataset_type "${d.dataset_type}" 非法`);
  const items = Array.isArray(d.items) ? d.items : [];
  if (!items.length) add('error', 'schema', 'items 为空');
  const ids = new Set(items.map(i => i.id));
  if (!DENSITY.has(d.density)) add('error', 'schema', `density "${d.density}" 非法`, `取值: ${[...DENSITY].join('/')}`);
  if (!d.hero) add('error', 'schema', 'hero 缺失(view 必须有唯一主角)');
  else if (!ids.has(d.hero)) add('error', 'hero', `hero "${d.hero}" 不在 items 里`);
  for (const r of (d.relations || [])) { if (r.kind && !KINDS.has(r.kind)) add('warn', 'schema', `relation kind "${r.kind}" 非法`); if (!ids.has(r.from) || !ids.has(r.to)) add('error', 'relation', `relation ${r.from}→${r.to} 端点不在 items`); }
  // tiers 并集 == items(不重不漏)
  const tiers = d.tiers || [];
  if (!tiers.length) add('error', 'tiers', 'tiers 缺失(需有序优先级分档)');
  else {
    const seen = new Map();
    for (let ti = 0; ti < tiers.length; ti++) for (const m of tiers[ti]) { if (seen.has(m)) add('error', 'tiers', `item "${m}" 出现在多个 tier`); else seen.set(m, ti); if (!ids.has(m)) add('error', 'tiers', `tier 里的 "${m}" 不在 items`); }
    const miss = [...ids].filter(id => !seen.has(id)); if (miss.length) add('error', 'tiers', `${miss.length} 个 item 未排进 tiers: ${miss.slice(0, 6).join(', ')}`);
    if (tiers[0] && !tiers[0].includes(d.hero)) add('warn', 'tiers', 'tiers[0] 不含 hero(顶档应是主角)');
  }
  // items ⊆ 来源 covers(给了 --from)
  if (a.from) {
    try { const src = JSON.parse(fs.readFileSync(a.from, 'utf8')); const dia = (src.scope?.diagrams || []).find(x => x.id === d.from);
      if (!dia) add('warn', 'from', `--from 里找不到 diagram id="${d.from}"`);
      else { const cov = new Set(dia.covers || []); const extra = [...ids].filter(id => !cov.has(id)); if (extra.length) add('error', 'subset', `新造了来源 covers 没有的 item: ${extra.join(', ')}(view 不许造数据)`); }
    } catch (e) { add('warn', 'from', `读 --from 失败: ${e.message}`); }
  }
  const errs = F.filter(f => f.sev === 'error').length, warns = F.length - errs;
  if (a.json) console.log(JSON.stringify({ file, kind: 'view.ir', findings: F, errs, warns }, null, 2));
  else { console.log(`\nview-ir-check ${file}`); console.log(`  hero=${d.hero} items=${items.length} tiers=${(d.tiers||[]).length} density=${d.density}`);
    if (!F.length) console.log('  ✓ 无问题'); for (const f of F) { console.log(`  ${f.sev === 'error' ? '✗' : '⚠'} [${f.rule}] ${f.msg}`); if (f.fix) console.log(`     → ${f.fix}`); }
    console.log(`  → ${errs} error / ${warns} warn`); }
  return errs > 0 || (a.strict && warns > 0) ? 1 : 0;
}

// 连通分量(无向,按 relations 的 from/to;孤立 item 各成一团)
function components(itemIds, relations) {
  const parent = new Map(itemIds.map(id => [id, id]));
  const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const uni = (a, b) => { if (!parent.has(a) || !parent.has(b)) return; parent.set(find(a), find(b)); };
  for (const r of relations) uni(r.from, r.to);
  const groups = new Map();
  for (const id of itemIds) { const root = find(id); (groups.get(root) ?? groups.set(root, []).get(root)).push(id); }
  return [...groups.values()];
}

function run(file, a) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const F = []; const add = (sev, rule, msg, fix) => F.push({ sev, rule, msg, fix });

  // ---- schema ----
  if (!d.message || !String(d.message).trim()) add('error', 'schema', 'message 缺失或为空', '先定一个 governing question/结论');
  if (!DATASET.has(d.dataset_type)) add('error', 'schema', `dataset_type "${d.dataset_type}" 非法`, `取值: ${[...DATASET].join('/')}`);
  const items = Array.isArray(d.items) ? d.items : [];
  if (!items.length) add('error', 'schema', 'items 为空');
  const ids = new Set(items.map(i => i.id));
  for (const at of (d.attributes || [])) if (at.level && !LEVELS.has(at.level)) add('warn', 'schema', `attribute level "${at.level}" 非法`, `取值: ${[...LEVELS].join('/')}`);
  for (const r of (d.relations || [])) { if (r.kind && !KINDS.has(r.kind)) add('warn', 'schema', `relation kind "${r.kind}" 非法`); if (!ids.has(r.from) || !ids.has(r.to)) add('warn', 'schema', `relation ${r.from}→${r.to} 端点不在 items 里`); }
  const hero = d.salience?.hero;
  if (hero && !ids.has(hero)) add('error', 'schema', `salience.hero "${hero}" 不在 items 里`);

  // ---- MECE ----
  const groups = d.salience?.groups || [];
  const seen = new Map();
  for (const g of groups) for (const m of (g.members || [])) { if (seen.has(m)) add('warn', 'mece-overlap', `item "${m}" 同时在分组「${seen.get(m)}」和「${g.name}」`, '一个 item 只归一组'); else seen.set(m, g.name); }
  if (groups.length) { const ungrouped = [...ids].filter(id => !seen.has(id)); if (ungrouped.length) add('warn', 'mece-gap', `${ungrouped.length} 个 item 未归任何组: ${ungrouped.slice(0, 6).join(', ')}${ungrouped.length > 6 ? '…' : ''}`, '补全分组或确认它们该在图里'); }

  // ---- capacity ----
  const inN = (d.scope?.boundary?.in?.length) || items.length;
  const diagrams = d.scope?.diagrams || [];
  const cut = (d.budget?.cut?.length || 0) + (d.budget?.deferred?.length || 0);
  if (inN > a.budget) {
    if (diagrams.length <= 1 && cut === 0) add('warn', 'over-capacity', `界内 ${inN} 项 > 容量预算 ${a.budget},却只有 1 张图、且 cut/deferred 为空 —— 密度没控制`, '拆图(scope.diagrams)或上卷/砍(budget)');
    else add('info', 'capacity', `界内 ${inN} 项 > ${a.budget};已用 ${diagrams.length} 图 / cut+defer ${cut} 项缓解`);
  }

  // ---- components(可计算拆分触发 + 自动提方案)----
  let proposed = null;
  if ((d.dataset_type === 'network' || d.dataset_type === 'tree') && items.length) {
    const comps = components([...ids], (d.relations || []));
    if (comps.length > 1) {
      const named = comps.map((c, i) => { const g = groups.find(g => c.every(m => (g.members || []).includes(m))); return g?.name || `分量${i + 1}`; });
      if (diagrams.length >= comps.length) add('info', 'components', `关系图 ${comps.length} 个不连通分量,已拆成 ${diagrams.length} 图 ✓(${named.join(' / ')})`);
      else { proposed = comps; add('warn', 'disconnected', `关系图有 ${comps.length} 个不连通分量 → 建议拆成 ${comps.length} 张图`, `按分量: ${named.join(' / ')}`); }
    }
  }

  return finish(file, a, F, { in: inN, budget: a.budget, items: items.length, groups: groups.length, diagrams: diagrams.length }, proposed, items);
}

function finish(file, a, F, metrics, proposed, items) {
  const errs = F.filter(f => f.sev === 'error').length, warns = F.filter(f => f.sev === 'warn').length;
  const label = id => (items.find(i => i.id === id)?.label) || id;
  if (a.json) console.log(JSON.stringify({ file, metrics, findings: F, proposed_split: proposed }, null, 2));
  else {
    console.log(`\ndata-ir-check ${file}`);
    console.log(`  指标 ${JSON.stringify(metrics)}`);
    if (!F.length) console.log('  ✓ 无问题');
    for (const f of F) { console.log(`  ${f.sev === 'error' ? '✗' : f.sev === 'warn' ? '⚠' : 'ℹ'} [${f.rule}] ${f.msg}`); if (f.fix) console.log(`     → ${f.fix}`); }
    if (proposed) { console.log('  建议拆分(按连通分量):'); proposed.forEach((c, i) => console.log(`     图${i + 1}: ${c.map(label).join(', ')}`)); }
    console.log(`  → ${errs} error / ${warns} warn`);
  }
  return errs > 0 || (a.strict && warns > 0) ? 1 : 0;
}

const a = args(process.argv);
if (!a._.length) { console.error('用法: node scripts/data-ir-check.mjs <data-ir.json> [--budget 9] [--json] [--strict]\n      node scripts/data-ir-check.mjs <view.ir.json> --view [--from <data-ir.json>]'); process.exit(2); }
let code = 0; for (const f of a._) { try { code = (a.view ? runView(f, a) : run(f, a)) || code; } catch (e) { console.error(`✗ ${f}: ${e.message}`); code = 2; } }
process.exit(code);
