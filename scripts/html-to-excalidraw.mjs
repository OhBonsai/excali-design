#!/usr/bin/env node
/**
 * html-to-excalidraw.mjs · 语义 HTML 布局 → Excalidraw 手绘风
 *
 * 网格/卡片/海报类图没有 elkjs 那样的布局引擎 → 借浏览器 CSS:
 *   写语义 HTML(div/text/色块 + flex/grid/padding,用设计令牌)
 *   → Playwright 渲染,读每个元素 getBoundingClientRect + computedStyle
 *   → 逐元素转 Excalidraw,套手绘风 + 降级 CSS(渐变/阴影丢弃、字体降 Virgil/Normal/Code、
 *     任意 hex 吸附到颜色角色)
 *   → .excalidraw
 *
 * 节点 id:给要被 arch-connect 连线的框加 `data-id="xxx"`,会保留为 Excalidraw 元素 id。
 * 连线**不在 HTML 画**——转完后用 arch-connect + edges.json 连。
 * 见 references/design-tokens.md 的降级映射表。
 *
 * 用法:
 *   node scripts/html-to-excalidraw.mjs 图.html --out 图.excalidraw [--width 1200] [--roughness 1]
 *
 * 依赖:Node + Playwright + chromium。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = { width: 1200, roughness: 1, strict: true };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--out') a.out = next();
    else if (t === '--width') a.width = parseInt(next());
    else if (t === '--roughness') a.roughness = parseFloat(next());
    else if (t === '--loose') a.strict = false;   // 把无效 data-lib 从 error 降级为 warn
    else if (!t.startsWith('--')) a.input = t;
  }
  return a;
}

// 颜色角色调色板(任意 hex 吸附到最近)
const PALETTE = [
  [30, 30, 30, '#1e1e1e'], [134, 142, 150, '#868e96'], [255, 255, 255, '#ffffff'], [250, 250, 246, '#fafaf6'],
  [241, 243, 245, '#f1f3f5'], [25, 113, 194, '#1971c2'], [165, 216, 255, '#a5d8ff'], [47, 158, 68, '#2f9e44'],
  [178, 242, 187, '#b2f2bb'], [224, 49, 49, '#e03131'], [255, 201, 201, '#ffc9c9'], [240, 140, 0, '#f08c00'],
  [255, 236, 153, '#ffec99'], [112, 72, 232, '#7048e8'], [208, 191, 255, '#d0bfff'],
];
function parseRGB(s) { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; }
function snap(s) {
  const c = parseRGB(s); if (!c || c.a < 0.08) return 'transparent';
  let best = PALETTE[0], bd = 1e9;
  for (const [r, g, b, hex] of PALETTE) { const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2; if (d < bd) { bd = d; best = hex; } }
  return best;
}
function fontFamily(fam) { return /mono|code|consol|menlo/i.test(fam || '') ? 3 : 2; }

import { launchChromium, NO_BROWSER_HINT } from './_browser.mjs';

const WALK = `() => {
  const out = [];
  const isBg = c => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent';
  function walk(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 && r.height < 0.5) return;
    // 组件:data-lib="库名:序号" → 直接实例化 drawlib 现成组件到本框
    if (el.dataset && el.dataset.lib) {
      out.push({ kind: 'lib', ref: el.dataset.lib, x: r.x, y: r.y, w: r.width, h: r.height });
      return;
    }
    // 组件:data-chart(pie/donut/bar/line)→ 数据驱动确定性渲染,不当普通框
    if (el.dataset && el.dataset.chart) {
      out.push({ kind: 'chart', ctype: el.dataset.chart, values: el.dataset.values || '', title: el.dataset.title || '', x: r.x, y: r.y, w: r.width, h: r.height });
      return;
    }
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const hasBox = bw > 0 || isBg(cs.backgroundColor);
    if (hasBox) out.push({ kind: 'rect', x: r.x, y: r.y, w: r.width, h: r.height,
      bg: cs.backgroundColor, border: bw > 0 ? cs.borderTopColor : null, bw,
      radius: parseFloat(cs.borderTopLeftRadius) || 0, opacity: parseFloat(cs.opacity),
      dashed: cs.borderTopStyle === 'dashed', id: el.getAttribute('data-id') });
    const kids = [...el.children];
    const direct = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.replace(/\\s+/g, ' ').trim()).join(' ').trim();
    if (direct && kids.length === 0) {
      // 用 Range 量文字**实际渲染位置**(含 padding / 垂直居中),不是框顶
      const rng = document.createRange(); rng.selectNodeContents(el);
      const tr = rng.getBoundingClientRect();
      out.push({ kind: 'text', x: tr.x, y: tr.y, w: tr.width || r.width, h: tr.height,
        text: direct, size: parseFloat(cs.fontSize), family: cs.fontFamily, color: cs.color, weight: cs.fontWeight });
    }
    for (const k of kids) walk(k);
  }
  walk(document.body);
  return out;
}`;

async function main() {
  const a = parseArgs(process.argv);
  if (!a.input) { console.error('用法: node html-to-excalidraw.mjs 图.html [--out x.excalidraw] [--width 1200]'); process.exit(1); }
  const html = fs.readFileSync(a.input, 'utf8');
  const { browser, used, error, detail } = await launchChromium();
  if (error) { console.error(NO_BROWSER_HINT + (detail ? `\n   (${detail})` : '')); process.exit(3); }
  console.error(`· CSS 布局内核:${used}`);
  const page = await browser.newPage({ viewport: { width: a.width, height: 800 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const nodes = await page.evaluate(`(${WALK})()`);
  await browser.close();

  let seedN = 1; const seed = () => (seedN = (seedN * 1103515245 + 12345) & 0x7fffffff);
  const R = Math.round; const els = [];
  // 归一化到 (40,40) 起点
  const minX = Math.min(...nodes.map(n => n.x)), minY = Math.min(...nodes.map(n => n.y));
  const dx = 40 - minX, dy = 40 - minY;
  // 先矩形(底层),后文字
  for (const n of nodes.filter(n => n.kind === 'rect')) {
    const round = n.radius * 2 >= Math.min(n.w, n.h) - 2;  // border-radius:50% → 椭圆
    els.push({ type: round ? 'ellipse' : 'rectangle', id: n.id || ('r_' + seed()), x: R(n.x + dx), y: R(n.y + dy), width: R(n.w), height: R(n.h), angle: 0,
      strokeColor: n.border ? snap(n.border) : 'transparent', backgroundColor: snap(n.bg), fillStyle: 'solid',
      strokeWidth: n.bw >= 2 ? 2 : 1, strokeStyle: n.dashed ? 'dashed' : 'solid', roughness: a.roughness,
      opacity: R((isFinite(n.opacity) ? n.opacity : 1) * 100), seed: seed(), groupIds: [],
      roundness: (!round && n.radius > 1) ? { type: 3 } : null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1 });
  }
  for (const n of nodes.filter(n => n.kind === 'text')) {
    const size = R(n.size || 15);
    els.push({ type: 'text', id: 't_' + seed(), x: R(n.x + dx), y: R(n.y + dy), width: R(n.w), height: size + 4, angle: 0,
      text: n.text, fontSize: size, fontFamily: fontFamily(n.family), textAlign: 'left',
      verticalAlign: 'top', strokeColor: snap(n.color) === 'transparent' ? '#1e1e1e' : snap(n.color), backgroundColor: 'transparent',
      fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: seed(), groupIds: [],
      roundness: null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1 });
  }
  // 颜色角色轮转(图表多系列时用)
  const ROLE = ['#1971c2', '#2f9e44', '#f08c00', '#7048e8', '#e03131', '#0c8599', '#e8590c', '#ae3ec9'];
  const ROLELT = ['#a5d8ff', '#b2f2bb', '#ffec99', '#d0bfff', '#ffc9c9', '#99e9f2', '#ffd8a8', '#eebefa'];
  const parseVals = v => v.split(',').map(s => { const [l, x] = s.split(':'); return { label: (l || '').trim(), value: parseFloat(x) || 0 }; }).filter(s => isFinite(s.value));
  const pushEl = (o) => els.push({ angle: 0, fillStyle: 'solid', strokeStyle: 'solid', roughness: a.roughness, opacity: 100, seed: seed(), groupIds: [], roundness: null, boundElements: [], isDeleted: false, startBinding: null, endBinding: null, lastCommittedPoint: null, startArrowhead: null, endArrowhead: null, versionNonce: seed(), updated: 1, ...o });
  // 数据驱动图表组件
  for (const n of nodes.filter(n => n.kind === 'chart')) {
    const data = parseVals(n.values).filter(s => n.ctype === 'line' || s.value > 0);
    if (!data.length) continue;
    const bx = n.x + dx, by = n.y + dy;
    if (n.ctype === 'pie' || n.ctype === 'donut') {
      const total = data.reduce((a, s) => a + s.value, 0) || 1;
      const cx = bx + n.w / 2, cy = by + n.h / 2, r = Math.min(n.w, n.h) / 2 - 2;
      const hole = n.ctype === 'donut' ? r * 0.55 : 0;
      let ang = -Math.PI / 2;
      data.forEach((s, i) => {
        const sweep = s.value / total * Math.PI * 2; const steps = Math.max(2, Math.ceil(sweep / (Math.PI / 18)));
        const pts = [];
        if (hole) { for (let k = 0; k <= steps; k++) { const aa = ang + sweep * k / steps; pts.push([Math.cos(aa) * hole, Math.sin(aa) * hole]); } for (let k = steps; k >= 0; k--) { const aa = ang + sweep * k / steps; pts.push([Math.cos(aa) * r, Math.sin(aa) * r]); } pts.push(pts[0]); }
        else { pts.push([0, 0]); for (let k = 0; k <= steps; k++) { const aa = ang + sweep * k / steps; pts.push([Math.cos(aa) * r, Math.sin(aa) * r]); } pts.push([0, 0]); }
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        pushEl({ type: 'line', id: 'pie_' + seed(), x: R(cx + Math.min(...xs)), y: R(cy + Math.min(...ys)), width: R(Math.max(...xs) - Math.min(...xs)), height: R(Math.max(...ys) - Math.min(...ys)), points: pts.map(p => [R(p[0] - Math.min(...xs)), R(p[1] - Math.min(...ys))]), strokeColor: ROLE[i % 8], backgroundColor: ROLELT[i % 8], strokeWidth: 2 });
        ang += sweep;
      });
    } else if (n.ctype === 'bar') {
      const max = Math.max(...data.map(s => s.value)) || 1; const pad = 6, n0 = data.length;
      const gap = 10, bw = Math.max(6, (n.w - pad * 2 - gap * (n0 - 1)) / n0), base = by + n.h - pad;
      data.forEach((s, i) => { const h = (s.value / max) * (n.h - pad * 2); const x = bx + pad + i * (bw + gap);
        pushEl({ type: 'rectangle', id: 'bar_' + seed(), x: R(x), y: R(base - h), width: R(bw), height: R(h), strokeColor: ROLE[0], backgroundColor: ROLELT[0], strokeWidth: 1.5, roundness: { type: 3 } }); });
    } else if (n.ctype === 'line') {
      const vals = data.map(s => s.value); const max = Math.max(...vals), min = Math.min(...vals), rng = (max - min) || 1, pad = 6;
      const stepX = (n.w - pad * 2) / Math.max(1, vals.length - 1);
      const pts = vals.map((v, i) => [pad + i * stepX, (n.h - pad) - ((v - min) / rng) * (n.h - pad * 2)]);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      pushEl({ type: 'line', id: 'line_' + seed(), x: R(bx + Math.min(...xs)), y: R(by + Math.min(...ys)), width: R(Math.max(...xs) - Math.min(...xs)), height: R(Math.max(...ys) - Math.min(...ys)), points: pts.map(p => [R(p[0] - Math.min(...xs)), R(p[1] - Math.min(...ys))]), strokeColor: ROLE[0], backgroundColor: 'transparent', strokeWidth: 2 });
    }
  }
  // data-lib:把任意 drawlib 现成组件实例化到 HTML 框(缩放贴合 + 居中 + 重生成 id)
  const libCache = {};
  const libErrors = []; let libUsed = 0;
  const listLibs = () => { try { return fs.readdirSync(path.join(__dirname, '..', 'drawlib')).filter(f => f.endsWith('.excalidrawlib')).map(f => f.replace('.excalidrawlib', '')).join(', '); } catch { return ''; } };
  const loadLib = name => { if (!(name in libCache)) { try { const j = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'drawlib', name + '.excalidrawlib'), 'utf8')); libCache[name] = j.library || j.libraryItems || null; } catch { libCache[name] = null; } } return libCache[name]; };
  for (const n of nodes.filter(n => n.kind === 'lib')) {
    const [lname, idxs] = n.ref.split(':'); const idx = parseInt(idxs);
    const items = loadLib((lname || '').trim());
    if (!items) { libErrors.push(`data-lib="${n.ref}":找不到库「${lname}」。可用库:${listLibs()}`); continue; }
    const raw = items[idx]; if (!raw) { libErrors.push(`data-lib="${n.ref}":序号越界(${lname} 共 ${items.length} 项,合法 0–${items.length - 1})。核对:node scripts/drawlib-sheet.mjs ${lname}`); continue; }
    libUsed++;
    const src = (Array.isArray(raw) ? raw : raw.elements).filter(e => !e.isDeleted);
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    for (const e of src) { mnx = Math.min(mnx, e.x); mny = Math.min(mny, e.y); mxx = Math.max(mxx, e.x + (e.width || 0)); mxy = Math.max(mxy, e.y + (e.height || 0)); }
    const s = Math.min(n.w / (mxx - mnx || 1), n.h / (mxy - mny || 1));
    const ox = n.x + dx + (n.w - (mxx - mnx) * s) / 2, oy = n.y + dy + (n.h - (mxy - mny) * s) / 2;
    const idmap = new Map(); for (const e of src) idmap.set(e.id, 'L' + seed());
    for (const e of src) {
      const ne = JSON.parse(JSON.stringify(e)); ne.id = idmap.get(e.id);
      ne.x = R(ox + (e.x - mnx) * s); ne.y = R(oy + (e.y - mny) * s);
      if (ne.width) ne.width = R(ne.width * s); if (ne.height) ne.height = R(ne.height * s);
      if (ne.points) ne.points = ne.points.map(p => [R(p[0] * s), R(p[1] * s)]);
      if (ne.fontSize) ne.fontSize = Math.max(6, R(ne.fontSize * s));
      ne.seed = seed(); ne.versionNonce = seed();
      if (ne.boundElements) ne.boundElements = ne.boundElements.map(b => ({ ...b, id: idmap.get(b.id) })).filter(b => b.id);
      if (ne.startBinding?.elementId) ne.startBinding = { ...ne.startBinding, elementId: idmap.get(ne.startBinding.elementId) || ne.startBinding.elementId };
      if (ne.endBinding?.elementId) ne.endBinding = { ...ne.endBinding, elementId: idmap.get(ne.endBinding.elementId) || ne.endBinding.elementId };
      if (ne.containerId) ne.containerId = idmap.get(ne.containerId) || ne.containerId;
      els.push(ne);
    }
  }
  // 代码约束:无效 data-lib 引用 → 默认 strict 直接失败(逼你回去查接触表);--loose 降级为 warn
  if (libErrors.length) {
    const tag = a.strict ? '✗ data-lib 引用无效(strict,构建失败)' : '⚠ data-lib 引用无效(loose)';
    console.error(tag); for (const e of libErrors) console.error('   · ' + e);
    if (a.strict) { console.error('   修正引用,或加 --loose 跳过(不推荐)。'); process.exit(2); }
  }
  const out = a.out || a.input.replace(/\.html?$/i, '') + '.excalidraw';
  fs.writeFileSync(out, JSON.stringify({ type: 'excalidraw', version: 2, source: 'excali-design/html', elements: els, appState: { viewBackgroundColor: '#fafaf6', gridSize: null } }, null, 1));
  const nChart = nodes.filter(n => n.kind === 'chart').length;
  console.log(`✓ ${els.length} 元素(${nodes.filter(n => n.kind === 'rect').length} 框 + ${nodes.filter(n => n.kind === 'text').length} 文字 + 复用 ${libUsed} data-lib + ${nChart} data-chart)→ ${out}`);
  console.log(`  有 data-id 的框可用 arch-connect 连边;建议:node scripts/arch-lint.mjs "${out}"`);
}

main().catch(e => { console.error(e); process.exit(1); });
