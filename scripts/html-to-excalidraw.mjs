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

function parseArgs(argv) {
  const a = { width: 1200, roughness: 1 };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--out') a.out = next();
    else if (t === '--width') a.width = parseInt(next());
    else if (t === '--roughness') a.roughness = parseFloat(next());
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

async function getChromium() {
  let mod; try { mod = await import('playwright'); } catch { try { mod = await import('playwright-core'); } catch { return null; } } return mod.chromium;
}

const WALK = `() => {
  const out = [];
  const isBg = c => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent';
  function walk(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 && r.height < 0.5) return;
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const hasBox = bw > 0 || isBg(cs.backgroundColor);
    if (hasBox) out.push({ kind: 'rect', x: r.x, y: r.y, w: r.width, h: r.height,
      bg: cs.backgroundColor, border: bw > 0 ? cs.borderTopColor : null, bw,
      radius: parseFloat(cs.borderTopLeftRadius) || 0, opacity: parseFloat(cs.opacity),
      dashed: cs.borderTopStyle === 'dashed', id: el.getAttribute('data-id') });
    const kids = [...el.children];
    const direct = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.replace(/\\s+/g, ' ').trim()).join(' ').trim();
    if (direct && kids.length === 0) out.push({ kind: 'text', x: r.x, y: r.y, w: r.width, h: r.height,
      text: direct, size: parseFloat(cs.fontSize), family: cs.fontFamily, align: cs.textAlign, color: cs.color, weight: cs.fontWeight });
    for (const k of kids) walk(k);
  }
  walk(document.body);
  return out;
}`;

async function main() {
  const a = parseArgs(process.argv);
  if (!a.input) { console.error('用法: node html-to-excalidraw.mjs 图.html [--out x.excalidraw] [--width 1200]'); process.exit(1); }
  const html = fs.readFileSync(a.input, 'utf8');
  const chromium = await getChromium();
  if (!chromium) { console.error('🚧 需要 playwright + chromium'); process.exit(3); }
  const launchOpts = process.env.EXCALI_CHROMIUM ? { executablePath: process.env.EXCALI_CHROMIUM } : {};
  const browser = await chromium.launch(launchOpts);
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
      text: n.text, fontSize: size, fontFamily: fontFamily(n.family), textAlign: ['left', 'center', 'right'].includes(n.align) ? n.align : 'left',
      verticalAlign: 'top', strokeColor: snap(n.color) === 'transparent' ? '#1e1e1e' : snap(n.color), backgroundColor: 'transparent',
      fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: seed(), groupIds: [],
      roundness: null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1 });
  }
  const out = a.out || a.input.replace(/\.html?$/i, '') + '.excalidraw';
  fs.writeFileSync(out, JSON.stringify({ type: 'excalidraw', version: 2, source: 'excali-design/html', elements: els, appState: { viewBackgroundColor: '#fafaf6', gridSize: null } }, null, 1));
  console.log(`✓ ${els.length} 元素(${nodes.filter(n => n.kind === 'rect').length} 框 + ${nodes.filter(n => n.kind === 'text').length} 文字)→ ${out}`);
  console.log(`  有 data-id 的框可用 arch-connect 连边;建议:node scripts/arch-lint.mjs "${out}"`);
}

main().catch(e => { console.error(e); process.exit(1); });
