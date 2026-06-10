#!/usr/bin/env node
/**
 * encode-check.mjs · 校验 encode.ir(零依赖)
 *
 * encode.ir 是「view.ir → 视觉通道绑定(无坐标)」这一层。通道选择靠模型,但有几件**可计算**的能机械把关:
 *   schema       必需字段 / 枚举(MarkType/Hue/Size/Weight/Fill/Stroke/Arrowhead)/ value∈[0,1]
 *   coverage     (--from view.ir)marks.id 集合 == items;links.rel ⊆ relations;regions.group ⊆ groups
 *   expressiveness/effectiveness(Mackinlay):
 *     hero-unique      hero 必 size:hero+hue:accent;别的 mark 不得用 hero/accent(主角唯一、强调唯一)
 *     relation-encoded 每条 relation 都该有 link(显式 connection,不靠邻近暗示)
 *     group-contained  每个 group 都该有 region(containment)
 *     color-budget     落地色数 ≤4(彩虹 = 凭空编码类别)
 *     emphasis-order   有序 tiers:hero/顶档应是视觉最重(value/size 不被深档反超)
 *
 * 用法:node scripts/encode-check.mjs <encode.ir.json> [--from <view.ir.json>] [--json] [--strict]
 * 退出码:有 error → 1;仅 warn → 0(--strict 则 warn 也 1)。
 *
 * 约束源 = references/encode-ir.d.ts。下面的枚举必须和 d.ts 的字面量联合保持一致(改了 d.ts 同步这里)。
 */
import fs from 'node:fs';

const MARK = new Set(['box', 'ellipse', 'cylinder', 'document', 'diamond', 'hexagon', 'text', 'icon']);
const SIZE = new Set(['hero', 'large', 'normal', 'small']);
const WEIGHT = new Set(['bold', 'emph', 'normal', 'light']);
const FILL = new Set(['none', 'solid', 'hachure', 'cross-hatch', 'zigzag']);
const STROKE = new Set(['solid', 'dashed', 'dotted']);
const HEAD = new Set([null, 'arrow', 'triangle', 'triangle_outline', 'diamond', 'diamond_outline', 'circle', 'circle_outline', 'bar', 'crowfoot_one', 'crowfoot_many', 'crowfoot_one_or_many']);
const hueOk = h => h === 'accent' || h === 'ink' || h === 'muted' || (typeof h === 'string' && h.startsWith('cat:') && h.length > 4);
// 落地色:accent/ink/muted 各算一种,每个不同 cat:X 算一种
const hueColor = h => (typeof h === 'string' && h.startsWith('cat:')) ? h : h;

function args(argv) {
  const a = { _: [] }; const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) { let t = it[i], v = null; const e = t.indexOf('='); if (t.startsWith('--') && e >= 0) { v = t.slice(e + 1); t = t.slice(0, e); } const nx = () => v !== null ? v : it[++i];
    if (t === '--from') a.from = nx(); else if (t === '--json') a.json = true; else if (t === '--strict') a.strict = true; else if (!t.startsWith('--')) a._.push(t); }
  return a;
}

function run(file, a) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const F = []; const add = (sev, rule, msg, fix) => F.push({ sev, rule, msg, fix });

  // ---- schema ----
  if (!d.message || !String(d.message).trim()) add('error', 'schema', 'message 缺失/为空');
  const marks = Array.isArray(d.marks) ? d.marks : [];
  if (!marks.length) add('error', 'schema', 'marks 为空');
  const mids = new Set(); const colors = new Set();
  for (const m of marks) {
    if (!m || typeof m.id !== 'string') { add('error', 'schema', `mark 缺 id: ${JSON.stringify(m)}`); continue; }
    if (mids.has(m.id)) add('error', 'schema', `mark id "${m.id}" 重复`); mids.add(m.id);
    if (!MARK.has(m.mark)) add('error', 'schema', `mark "${m.id}" 的 mark="${m.mark}" 非法`, `取值: ${[...MARK].join('/')}`);
    const c = m.channels || {};
    if (!hueOk(c.hue)) add('error', 'schema', `mark "${m.id}" hue="${c.hue}" 非法`, '取值: accent/ink/muted/cat:<名>');
    else colors.add(hueColor(c.hue));
    if (typeof c.value !== 'number' || c.value < 0 || c.value > 1) add('error', 'schema', `mark "${m.id}" value=${c.value} 不在 [0,1]`);
    if (!SIZE.has(c.size)) add('error', 'schema', `mark "${m.id}" size="${c.size}" 非法`, `取值: ${[...SIZE].join('/')}`);
    if (!WEIGHT.has(c.weight)) add('error', 'schema', `mark "${m.id}" weight="${c.weight}" 非法`, `取值: ${[...WEIGHT].join('/')}`);
    if (c.fill !== undefined && !FILL.has(c.fill)) add('warn', 'schema', `mark "${m.id}" fill="${c.fill}" 非法`);
    if (m.mark === 'icon' && !c.icon) add('warn', 'schema', `mark "${m.id}" mark=icon 但缺 channels.icon(drawlib id)`);
  }
  for (const l of (d.links || [])) {
    if (typeof l.rel !== 'string' || !l.rel.includes('->')) add('error', 'schema', `link.rel "${l.rel}" 应为 "from->to"`);
    if (l.channel !== 'connection') add('error', 'schema', `link "${l.rel}" channel 必须为 "connection"`);
    if (!STROKE.has(l.stroke)) add('error', 'schema', `link "${l.rel}" stroke="${l.stroke}" 非法`, `取值: ${[...STROKE].join('/')}`);
    for (const k of ['endArrowhead', 'startArrowhead']) if (l[k] !== undefined && !HEAD.has(l[k])) add('warn', 'schema', `link "${l.rel}" ${k}="${l[k]}" 非法`);
    if (l.hue !== undefined) { if (!hueOk(l.hue)) add('warn', 'schema', `link "${l.rel}" hue="${l.hue}" 非法`); else colors.add(hueColor(l.hue)); }
  }
  for (const rg of (d.regions || [])) {
    if (typeof rg.group !== 'string') add('error', 'schema', `region 缺 group`);
    if (rg.channel !== 'containment') add('error', 'schema', `region "${rg.group}" channel 必须为 "containment"`);
    if (rg.stroke !== undefined && !STROKE.has(rg.stroke)) add('warn', 'schema', `region "${rg.group}" stroke 非法`);
    if (rg.hue !== undefined) { if (!hueOk(rg.hue)) add('warn', 'schema', `region "${rg.group}" hue 非法`); else colors.add(hueColor(rg.hue)); }
  }

  // ---- color-budget(落地色数 ≤4) ----
  if (colors.size > 4) add('warn', 'color-budget', `落地色 ${colors.size} 种(>4):${[...colors].join(', ')}`, '并到 ≤4(accent + ink/muted + 少量 cat:);彩虹 = 凭空编码类别');

  // ---- hero / 强调唯一(不依赖 --from 的弱检查) ----
  const heroMarks = marks.filter(m => m.channels?.size === 'hero');
  const accentMarks = marks.filter(m => m.channels?.hue === 'accent');

  // ---- coverage + 有序 + hero(--from view.ir) ----
  let view = null;
  if (a.from) {
    try { view = JSON.parse(fs.readFileSync(a.from, 'utf8')); } catch (e) { add('warn', 'from', `读 --from 失败: ${e.message}`); }
  }
  if (view) {
    const items = (view.items || []).map(i => i.id); const itemSet = new Set(items);
    const relSet = new Set((view.relations || []).map(r => `${r.from}->${r.to}`));
    const groupNames = new Set((view.groups || []).map(g => g.name));
    // marks ⟷ items 不重不漏
    const extra = [...mids].filter(id => !itemSet.has(id)); if (extra.length) add('error', 'coverage', `marks 出现 view.ir 没有的 item: ${extra.join(', ')}`);
    const miss = items.filter(id => !mids.has(id)); if (miss.length) add('error', 'coverage', `${miss.length} 个 item 没有 mark: ${miss.slice(0, 8).join(', ')}`, '每个 item 恰好一个 mark');
    // links.rel ⊆ relations;每条 relation 该被编码
    for (const l of (d.links || [])) if (typeof l.rel === 'string' && l.rel.includes('->') && !relSet.has(l.rel)) add('error', 'coverage', `link.rel "${l.rel}" 不是 view.ir 的 relation`);
    const linkSet = new Set((d.links || []).map(l => l.rel));
    const relMiss = [...relSet].filter(r => !linkSet.has(r)); if (relMiss.length) add('warn', 'relation-encoded', `${relMiss.length} 条 relation 没有 link(关系没被显式编码,只靠邻近会歧义): ${relMiss.slice(0, 6).join(', ')}`, '每条 relation 给一条 connection');
    // regions.group ⊆ groups;每个 group 该被 containment
    for (const rg of (d.regions || [])) if (typeof rg.group === 'string' && !groupNames.has(rg.group)) add('error', 'coverage', `region.group "${rg.group}" 不是 view.ir 的 group`);
    const regSet = new Set((d.regions || []).map(r => r.group));
    const gMiss = [...groupNames].filter(g => !regSet.has(g)); if (gMiss.length) add('warn', 'group-contained', `${gMiss.length} 个 group 没有 region: ${gMiss.slice(0, 6).join(', ')}`, '每个 group 给一个 containment(frame/虚线框)');
    // hero 唯一 + 强调唯一
    const hero = view.hero;
    if (hero) {
      const hm = marks.find(m => m.id === hero);
      if (!hm) add('error', 'hero', `view.ir.hero "${hero}" 没有 mark`);
      else {
        if (hm.channels?.size !== 'hero') add('warn', 'hero-unique', `hero "${hero}" 的 size 不是 "hero"(主角该是视觉最大)`, 'hero → size:hero');
        if (hm.channels?.hue !== 'accent') add('warn', 'hero-unique', `hero "${hero}" 的 hue 不是 "accent"(强调色该留给主角)`, 'hero → hue:accent');
      }
      for (const m of heroMarks) if (m.id !== hero) add('warn', 'hero-unique', `非主角 "${m.id}" 也用了 size:hero(主角应唯一)`, '降到 large/normal');
      for (const m of accentMarks) if (m.id !== hero) add('warn', 'hero-unique', `非主角 "${m.id}" 也用了 hue:accent(强调色应唯一)`, '改 ink/muted');
    }
    // 有序梯度:hero/顶档应是视觉最重,不被深档反超(value)
    const tiers = view.tiers || []; const tierOf = id => tiers.findIndex(t => t.includes(id));
    const heroVal = (marks.find(m => m.id === hero)?.channels?.value) ?? 1;
    for (const m of marks) { const ti = tierOf(m.id); if (ti > 0 && (m.channels?.value ?? 0) > heroVal + 1e-9) add('warn', 'emphasis-order', `"${m.id}"(第${ti}档)的 value=${m.channels.value} 比主角还重`, '深档不应比 hero 更亮/更重'); }
  } else {
    // 没 --from:只做弱 hero 检查
    if (heroMarks.length === 0) add('warn', 'hero-unique', '没有任何 mark 用 size:hero(缺主角)');
    if (heroMarks.length > 1) add('warn', 'hero-unique', `${heroMarks.length} 个 mark 用了 size:hero(主角应唯一)`);
    if (accentMarks.length > 1) add('warn', 'hero-unique', `${accentMarks.length} 个 mark 用了 hue:accent(强调色应唯一)`);
  }

  const errs = F.filter(f => f.sev === 'error').length, warns = F.filter(f => f.sev === 'warn').length;
  if (a.json) console.log(JSON.stringify({ file, kind: 'encode.ir', findings: F, errs, warns }, null, 2));
  else {
    console.log(`\nencode-ir-check ${file}`);
    console.log(`  marks=${marks.length} links=${(d.links || []).length} regions=${(d.regions || []).length} 落地色=${colors.size}${a.from ? ' (--from ' + a.from + ')' : ''}`);
    if (!F.length) console.log('  ✓ 无问题');
    for (const f of F) { console.log(`  ${f.sev === 'error' ? '✗' : '⚠'} [${f.rule}] ${f.msg}`); if (f.fix) console.log(`     → ${f.fix}`); }
    console.log(`  → ${errs} error / ${warns} warn`);
  }
  return errs > 0 || (a.strict && warns > 0) ? 1 : 0;
}

const a = args(process.argv);
if (!a._.length) { console.error('用法: node scripts/encode-check.mjs <encode.ir.json> [--from <view.ir.json>] [--json] [--strict]'); process.exit(2); }
let code = 0; for (const f of a._) { try { code = run(f, a) || code; } catch (e) { console.error(`✗ ${f}: ${e.message}`); code = 2; } }
process.exit(code);
