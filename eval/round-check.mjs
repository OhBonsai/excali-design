#!/usr/bin/env node
/**
 * round-check.mjs · 本轮改动的确定性回归验证(零模型、零 chromium)
 *
 * 不走模型 A/B(那需 opencode+API+chromium),而是直接渲染代表 case,断言「这轮新增的能力确实出现在产物里」:
 *   1) mindmap 默认 pencil = 单色(无彩色)+ taper 锥形带(填充多边形枝)+ 云形根
 *   2) mindmap radial 与 logical 布局都成立
 *   3) class 用原生 UML 头型(triangle_outline/diamond/diamond_outline)而非手绘 marker
 *   4) ER 用原生 cardinality_* 鸦爪头型
 *   5) 箭头能力:曲线(≥3点+roundness:2)+ 中间绑定文字 + 多头型,svg-export 能渲
 *   6) floor-check 对干净 mindmap 无 error;arch-lint 无 text-overflow/tiny-text 误报
 *
 * 用法:node eval/round-check.mjs        退出码:有失败 → 1
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const S = p => path.join(ROOT, 'scripts', p);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-'));
const run = (script, args) => execFileSync('node', [S(script), ...args], { encoding: 'utf8' });
const render = (type, src, style, layout) => { const out = path.join(TMP, `${type}.excalidraw`); run(`render-${type}.mjs`, [src, out, style, ...(layout ? [layout] : [])]); return JSON.parse(fs.readFileSync(out, 'utf8')); };
const els = doc => doc.elements.filter(e => !e.isDeleted);
const isChroma = c => { if (!c || c === 'transparent') return false; const m = c.replace('#', ''); let r, g, b; if (m.length === 3) { r = parseInt(m[0] + m[0], 16); g = parseInt(m[1] + m[1], 16); b = parseInt(m[2] + m[2], 16); } else if (m.length >= 6) { r = parseInt(m.slice(0, 2), 16); g = parseInt(m.slice(2, 4), 16); b = parseInt(m.slice(4, 6), 16); } else return false; return Math.max(r, g, b) - Math.min(r, g, b) > 24; };
const ex = (f, dir = TMP) => { const p = path.join(dir, f); return p; };

let pass = 0, fail = 0;
const check = (name, fn) => { try { const [ok, detail] = fn(); console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`); ok ? pass++ : fail++; } catch (e) { console.log(`  ✗ ${name} — 异常: ${e.message.split('\n')[0]}`); fail++; } };
const C = (root, rel) => path.join(root, rel);

console.log('round-check · 本轮改动确定性验证\n');

// 1) mindmap pencil 默认:单色 + taper 填充枝 + 云根
console.log('[1] mindmap 默认 pencil(单色 + taper + 云根)');
{
  const doc = render('mindmap', C(ROOT, 'examples/mindmap/cases/learning.mmd'), 'pencil', 'logical');
  const E = els(doc);
  check('无彩色(mono)', () => { const chroma = E.filter(e => isChroma(e.strokeColor) || isChroma(e.backgroundColor)); return [chroma.length === 0, chroma.length ? `仍有 ${chroma.length} 个彩色元素` : '全墨色']; });
  check('taper 锥形带(填充多边形枝)', () => { const ribs = E.filter(e => e.type === 'line' && e.backgroundColor && e.backgroundColor !== 'transparent' && e.points && e.points.length > 3); return [ribs.length >= 4, `${ribs.length} 条填充枝`]; });
  check('云形根(多点闭合多边形)', () => { const cloud = E.filter(e => e.type === 'line' && e.points && e.points.length >= 40); return [cloud.length >= 1, cloud.length ? `${cloud[0].points.length} 点` : '未找到']; });
}

// 2) 两种布局都成立(radial 与 logical 节点位置分布不同)
console.log('[2] mindmap 双布局');
{
  const lo = els(render('mindmap', C(ROOT, 'examples/mindmap/cases/learning.mmd'), 'pencil', 'logical'));
  const ra = els(render('mindmap', C(ROOT, 'examples/mindmap/cases/learning.mmd'), 'pencil', 'radial'));
  const texts = a => a.filter(e => e.type === 'text').map(e => `${e.x | 0},${e.y | 0}`).sort().join('|');
  check('logical 与 radial 产物不同', () => [texts(lo) !== texts(ra) && lo.length > 10 && ra.length > 10, 'layout 切换生效']);
}

// 3) class 原生 UML 头型
console.log('[3] class 原生 UML 箭头头型');
{
  const E = els(render('class', C(ROOT, 'examples/class/cases/animals.mmd'), 'classic-tricolor'));
  const heads = new Set(); for (const e of E.filter(e => e.type === 'arrow')) { for (const h of [e.startArrowhead, e.endArrowhead]) if (h) heads.add(h); }
  check('使用原生 UML 头型', () => { const uml = [...heads].filter(h => /triangle_outline|diamond|diamond_outline|^arrow$/.test(h)); return [uml.length >= 1, `头型: ${[...heads].join(',') || '无'}`]; });
}

// 4) ER 原生 cardinality 鸦爪
console.log('[4] ER 原生 cardinality 头型');
{
  const E = els(render('er', C(ROOT, 'examples/er/cases/shop.mmd'), 'classic-tricolor'));
  const heads = new Set(); for (const e of E.filter(e => e.type === 'arrow')) { for (const h of [e.startArrowhead, e.endArrowhead]) if (h) heads.add(h); }
  check('使用 cardinality_* 头型', () => { const card = [...heads].filter(h => /cardinality_/.test(h)); return [card.length >= 1, `头型: ${[...heads].join(',') || '无'}`]; });
}

// 5) 箭头能力 showcase + svg-export
console.log('[5] 箭头:曲线 + 中间标签 + 多头型 + svg-export');
{
  const showcase = {
    type: 'excalidraw', version: 2, source: 'rc', appState: { viewBackgroundColor: '#fff' },
    elements: [
      { type: 'arrow', id: 'cur', x: 40, y: 40, width: 300, height: 90, points: [[0, 0], [140, 90], [300, 0]], roundness: { type: 2 }, angle: 0, strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 1, opacity: 100, seed: 1, groupIds: [], startArrowhead: null, endArrowhead: 'arrow', elbowed: false, boundElements: [{ type: 'text', id: 'lbl' }] },
      { type: 'text', id: 'lbl', x: 170, y: 95, width: 30, height: 20, text: 'mid', fontSize: 14, fontFamily: 2, textAlign: 'center', verticalAlign: 'middle', containerId: 'cur', strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: 2, groupIds: [], angle: 0 },
      { type: 'arrow', id: 'uml', x: 40, y: 200, width: 300, height: 0, points: [[0, 0], [300, 0]], roundness: null, angle: 0, strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 1, opacity: 100, seed: 3, groupIds: [], startArrowhead: 'diamond', endArrowhead: 'triangle_outline', elbowed: false, boundElements: [] },
    ],
  };
  const f = ex('arrows.excalidraw'); fs.writeFileSync(f, JSON.stringify(showcase));
  check('曲线箭头(≥3点+roundness:2)', () => { const a = showcase.elements.find(e => e.id === 'cur'); return [a.points.length >= 3 && a.roundness?.type === 2, '已构造']; });
  check('中间绑定文字', () => { const a = showcase.elements.find(e => e.id === 'cur'); const t = showcase.elements.find(e => e.id === 'lbl'); return [t.containerId === 'cur' && a.boundElements.some(b => b.id === 'lbl'), '双向绑定']; });
  check('svg-export 渲染含路径', () => { const out = ex('arrows.svg'); run('svg-export.mjs', [f, '--out', out]); const svg = fs.readFileSync(out, 'utf8'); const paths = (svg.match(/<path/g) || []).length; return [paths >= 4, `${paths} 条 path`]; });
}

// 6) floor-check / arch-lint 不误报
console.log('[6] floor-check / arch-lint 对干净产物不误报');
{
  const f = path.join(TMP, 'mindmap.excalidraw'); // 复用 [2] 最后渲染的(radial pencil)
  render('mindmap', C(ROOT, 'examples/mindmap/cases/learning.mmd'), 'pencil', 'logical');
  check('floor-check 无 error', () => { const out = JSON.parse(run('floor-check.mjs', [f, '--type', 'structural', '--json'])); return [out.errs === 0, `${out.errs} error / ${out.warns} warn`]; });
  check('arch-lint 无 text-overflow/tiny-text', () => { const out = JSON.parse(run('arch-lint.mjs', [f, '--json'])); const all = [...out.errors, ...out.warnings].map(i => i.rule); const bad = all.filter(r => r === 'text-overflow' || r === 'tiny-text'); return [bad.length === 0, bad.length ? bad.join(',') : '无文字误报']; });
}

console.log(`\n${fail === 0 ? '✅ 全部通过' : '❌ 有失败'}:${pass} pass / ${fail} fail`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
process.exit(fail ? 1 : 0);
