#!/usr/bin/env node
/**
 * mermaid-to-excalidraw.mjs · Mermaid → Excalidraw 手绘风(静态图)
 *
 * 把 Mermaid 图转成 Excalidraw 手绘风 `.excalidraw`。按类型分派:
 *   - Tier 1(flowchart / sequence / class):用官方 @excalidraw/mermaid-to-excalidraw
 *     直接转成**原生手绘元素**(可编辑、真手绘风)。
 *   - Tier 2(stateDiagram / erDiagram):解析结构 → {nodes,edges} → 走 arch-layout(elkjs)
 *     出手绘风(本脚本调 arch-layout 的逻辑;见 mermaid.md)。
 *   - 其它类型:官方库退化为 SVG 图片(非手绘原生),给出提示。
 *
 * 用法:
 *   node scripts/mermaid-to-excalidraw.mjs <图.mmd> [--out 图.excalidraw]
 *   node scripts/mermaid-to-excalidraw.mjs --text "flowchart TD; A-->B" [--out a.excalidraw]
 *
 * 依赖:Node + Playwright + chromium(从 CDN import mermaid/excalidraw,无需 npm 装它们)。
 *   CI/沙箱:playwright-core + EXCALI_CHROMIUM=<chrome 路径>。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERMAID_CDN = process.env.MERMAID_CDN || 'https://esm.sh/mermaid@11.12.1';

const M2E_CDN = process.env.M2E_CDN || 'https://esm.sh/@excalidraw/mermaid-to-excalidraw@2.2.2';
const EXCALIDRAW_CDN = process.env.EXCALI_CDN || 'https://esm.sh/@excalidraw/excalidraw@0.17.6';

function parseArgs(argv) {
  const a = { _: [] };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--out') a.out = next();
    else if (t === '--text') a.text = next();
    else if (!t.startsWith('--')) a._.push(t);
  }
  return a;
}

function detectType(src) {
  const line = src.split('\n').map(s => s.trim()).find(s => s && !s.startsWith('%%')) || '';
  const kw = line.toLowerCase();
  if (kw.startsWith('flowchart') || kw.startsWith('graph')) return 'flowchart';
  if (kw.startsWith('sequencediagram')) return 'sequence';
  if (kw.startsWith('classdiagram')) return 'class';
  if (kw.startsWith('statediagram')) return 'state';
  if (kw.startsWith('erdiagram')) return 'er';
  if (kw.startsWith('c4')) return 'c4';
  if (kw.startsWith('mindmap')) return 'mindmap';
  return 'other';
}

async function getChromium() {
  let mod;
  try { mod = await import('playwright'); }
  catch { try { mod = await import('playwright-core'); } catch { return null; } }
  return mod.chromium;
}

// Tier 1:官方库转原生元素(在 Playwright 里跑,mermaid 需 DOM)
async function tier1(src) {
  const chromium = await getChromium();
  if (!chromium) { console.error('🚧 需要 playwright + chromium'); process.exit(3); }
  const launchOpts = process.env.EXCALI_CHROMIUM ? { executablePath: process.env.EXCALI_CHROMIUM } : {};
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('[page]', e.message));
  const HTML = `<!doctype html><meta charset=utf8><body><script type="module">
    const m2e = await import('${M2E_CDN}');
    const ex = (await import('${EXCALIDRAW_CDN}')).default;
    window.__convert = async (src) => {
      const { elements, files } = await m2e.parseMermaidToExcalidraw(src);
      const full = ex.convertToExcalidrawElements(elements);
      return JSON.stringify({ elements: full, files: files || null });
    };
    window.__ready = true;
  </script></body>`;
  await page.setContent(HTML, { waitUntil: 'networkidle' });
  await page.waitForFunction('window.__ready === true', { timeout: 60000 });
  const json = await page.evaluate((s) => window.__convert(s), src);
  await browser.close();
  return JSON.parse(json);
}

// Tier 2:用 mermaid db.getData() 抽 {nodes,edges} → arch-layout(elkjs)出手绘风
async function tier2(src, type, out) {
  const chromium = await getChromium();
  if (!chromium) { console.error('🚧 需要 playwright + chromium'); process.exit(3); }
  const launchOpts = process.env.EXCALI_CHROMIUM ? { executablePath: process.env.EXCALI_CHROMIUM } : {};
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('[page]', e.message));
  const HTML = `<!doctype html><meta charset=utf8><body><script type="module">
    const mermaid = (await import('${MERMAID_CDN}')).default;
    mermaid.initialize({ startOnLoad:false });
    window.__graph = async (src) => {
      await mermaid.parse(src);
      const d = await mermaid.mermaidAPI.getDiagramFromText(src);
      const db = d.db || (d.getDiagram && d.getDiagram().db);
      const data = db.getData ? db.getData() : null;
      return JSON.stringify(data || {});
    };
    window.__ready = true;
  </script></body>`;
  await page.setContent(HTML, { waitUntil: 'networkidle' });
  await page.waitForFunction('window.__ready === true', { timeout: 60000 });
  const data = JSON.parse(await page.evaluate(s => window.__graph(s), src));
  await browser.close();

  const rawNodes = data.nodes || [], rawEdges = data.edges || [];
  if (!rawNodes.length) { console.error('未能从 mermaid 抽到节点,回退 Tier 1 图片'); return false; }
  // start/end 伪状态显示为小标签
  const labelOf = n => (n.shape === 'stateStart' ? '●' : n.shape === 'stateEnd' ? '◉' : (n.label || n.id));
  const nodes = rawNodes.map(n => ({ id: n.id, label: labelOf(n), group: n.parentId || undefined }));
  const groups = rawNodes.filter(n => n.isGroup).map(n => ({ id: n.id, label: n.label || n.id }));
  const edges = rawEdges.map(e => ({
    from: e.start ?? e.id1 ?? e.from, to: e.end ?? e.id2 ?? e.to,
    label: e.label || e.relationTitle || '',
    dashed: (e.type && /dotted|dashed/i.test(e.type)) || false,
  })).filter(e => e.from && e.to);

  const spec = { direction: 'DOWN', nodes: nodes.filter(n => !groups.find(g => g.id === n.id)), groups, edges };
  const specPath = path.join(os.tmpdir(), `mmd-spec-${Date.now()}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const r = spawnSync('node', [path.join(__dirname, 'arch-layout.mjs'), specPath, '--out', out, '--direction', 'DOWN'], { stdio: ['ignore', 'inherit', 'inherit'] });
  fs.rmSync(specPath, { force: true });
  return r.status === 0;
}

// class:getData() 给 classBox(label+members+methods)→ elkjs 布局 + 自定义类框渲染(手绘原生)
async function tier2Class(src, out) {
  const chromium = await getChromium();
  if (!chromium) { console.error('🚧 需要 playwright + chromium'); process.exit(3); }
  const launchOpts = process.env.EXCALI_CHROMIUM ? { executablePath: process.env.EXCALI_CHROMIUM } : {};
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('[page]', e.message));
  const HTML = `<!doctype html><meta charset=utf8><body><script type="module">
    const mermaid = (await import('${MERMAID_CDN}')).default; mermaid.initialize({ startOnLoad:false });
    window.__class = async (src) => {
      await mermaid.parse(src);
      const d = await mermaid.mermaidAPI.getDiagramFromText(src);
      const db = d.db || (d.getDiagram && d.getDiagram().db);
      const data = db.getData();
      const str = m => (m && (m.id || m.text || m.label)) || (typeof m === 'string' ? m : '');
      const nodes = (data.nodes || []).filter(n => n.shape === 'classBox').map(n => ({
        id: n.id, name: n.label || n.id,
        members: (n.members || []).map(str).filter(Boolean),
        methods: (n.methods || []).map(str).filter(Boolean),
      }));
      const edges = (data.edges || []).map(e => ({ from: e.start, to: e.end, label: e.label || '' }));
      return JSON.stringify({ nodes, edges });
    };
    window.__ready = true;
  </script></body>`;
  await page.setContent(HTML, { waitUntil: 'networkidle' });
  await page.waitForFunction('window.__ready === true', { timeout: 60000 });
  const { nodes, edges } = JSON.parse(await page.evaluate(s => window.__class(s), src));
  await browser.close();
  if (!nodes.length) return false;

  let ELK; try { ELK = (await import('elkjs/lib/elk.bundled.js')).default; } catch { console.error('需要 elkjs'); return false; }
  const LINE = 22, HEAD = 34, PAD = 10, CW = 8.2;
  const sized = nodes.map(n => {
    const lines = [n.name, ...n.members, ...n.methods];
    const w = Math.max(140, Math.round(Math.max(...lines.map(s => s.length)) * CW + 28));
    const h = HEAD + (n.members.length ? n.members.length * LINE + 8 : 0) + (n.methods.length ? n.methods.length * LINE + 8 : 0) + PAD;
    return { ...n, w, h };
  });
  const graph = {
    id: 'root', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'DOWN', 'elk.edgeRouting': 'ORTHOGONAL', 'elk.spacing.nodeNode': '50', 'elk.layered.spacing.nodeNodeBetweenLayers': '70' },
    children: sized.map(n => ({ id: n.id, width: n.w, height: n.h })),
    edges: edges.map((e, i) => ({ id: 'e' + i, sources: [e.from], targets: [e.to] })),
  };
  const res = await new ELK().layout(graph);
  const pos = new Map(res.children.map(c => [c.id, c]));

  let seedN = 1; const seed = () => (seedN = (seedN * 1103515245 + 12345) & 0x7fffffff);
  const els = []; const R = Math.round;
  const txt = (t, x, y, size, align, w, bold) => els.push({ type: 'text', id: 't_' + seed(), x: R(x), y: R(y), width: w, height: size + 4, angle: 0, text: t, fontSize: size, fontFamily: bold ? 2 : 3, textAlign: align, verticalAlign: 'top', strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, seed: seed(), groupIds: [], roundness: null, boundElements: [], isDeleted: false, versionNonce: seed(), updated: 1 });
  const hline = (x, y, w) => els.push({ type: 'line', id: 'l_' + seed(), x: R(x), y: R(y), width: R(w), height: 0, angle: 0, points: [[0, 0], [R(w), 0]], strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 1, opacity: 100, seed: seed(), groupIds: [], roundness: null, boundElements: [], isDeleted: false, startBinding: null, endBinding: null, lastCommittedPoint: null, startArrowhead: null, endArrowhead: null, versionNonce: seed(), updated: 1 });
  const bound = {};
  for (const n of sized) {
    const c = pos.get(n.id); if (!c) continue;
    bound[n.id] = [];
    els.push({ type: 'rectangle', id: n.id, x: R(c.x), y: R(c.y), width: R(c.width), height: R(c.height), angle: 0, strokeColor: '#1e1e1e', backgroundColor: '#fff', fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 1, opacity: 100, seed: seed(), groupIds: [], roundness: { type: 3 }, boundElements: bound[n.id], isDeleted: false, versionNonce: seed(), updated: 1 });
    txt(n.name, c.x, c.y + 8, 18, 'center', c.width, true);
    let yy = c.y + HEAD;
    if (n.members.length) { hline(c.x, yy, c.width); yy += 6; for (const m of n.members) { txt(m, c.x + 12, yy, 14, 'left', c.width - 24); yy += LINE; } yy += 2; }
    if (n.methods.length) { hline(c.x, yy, c.width); yy += 6; for (const m of n.methods) { txt(m, c.x + 12, yy, 14, 'left', c.width - 24); yy += LINE; } }
  }
  (res.edges || []).forEach(e => {
    const s = e.sections?.[0]; if (!s) return;
    const pts = [s.startPoint, ...(s.bendPoints || []), s.endPoint]; const ox = pts[0].x, oy = pts[0].y;
    els.push({ type: 'arrow', id: e.id, x: R(ox), y: R(oy), width: R(Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))), height: R(Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))), angle: 0, points: pts.map(p => [R(p.x - ox), R(p.y - oy)]), strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 1, opacity: 100, seed: seed(), groupIds: [], roundness: null, boundElements: [], isDeleted: false, startBinding: { elementId: e.sources[0], focus: 0, gap: 4 }, endBinding: { elementId: e.targets[0], focus: 0, gap: 4 }, lastCommittedPoint: null, startArrowhead: null, endArrowhead: 'arrow', versionNonce: seed(), updated: 1 });
    bound[e.sources[0]]?.push({ type: 'arrow', id: e.id }); bound[e.targets[0]]?.push({ type: 'arrow', id: e.id });
  });
  fs.writeFileSync(out, JSON.stringify({ type: 'excalidraw', version: 2, source: 'excali-design/mermaid', elements: els, appState: { viewBackgroundColor: '#fafaf6', gridSize: null } }, null, 1));
  return true;
}

async function main() {
  const a = parseArgs(process.argv);
  const src = a.text || (a._[0] && fs.readFileSync(a._[0], 'utf8'));
  if (!src) { console.error('用法: node mermaid-to-excalidraw.mjs <图.mmd> [--out x.excalidraw]  或  --text "..."'); process.exit(1); }
  const type = detectType(src);
  const out = a.out || (a._[0] ? a._[0].replace(/\.(mmd|mermaid|txt)$/i, '') + '.excalidraw' : 'diagram.excalidraw');

  const TIER1 = new Set(['flowchart', 'sequence']);          // 官方库原生手绘
  const TIER2 = new Set(['state', 'er', 'c4', 'mindmap']);    // mermaid getData() → arch-layout 手绘风(失败自动兜底图片)

  if (type === 'class') {
    console.log('类型:class(getData → 类框渲染器,手绘原生)');
    const ok = await tier2Class(src, out);
    if (ok) { console.log(`✓ → ${out}`); console.log(`  建议:node scripts/arch-lint.mjs "${out}"`); }
    else { const { elements, files } = await tier1(src); fs.writeFileSync(out, JSON.stringify({ type: 'excalidraw', version: 2, source: 'excali-design/mermaid', elements, appState: { viewBackgroundColor: '#fafaf6' }, files: files || {} }, null, 1)); console.log(`✓(兜底)→ ${out}`); }
  } else if (TIER1.has(type)) {
    console.log(`类型:${type}(Tier 1 官方原生手绘)`);
    const { elements, files } = await tier1(src);
    const doc = { type: 'excalidraw', version: 2, source: 'excali-design/mermaid', elements, appState: { viewBackgroundColor: '#fafaf6', gridSize: null }, files: files || {} };
    fs.writeFileSync(out, JSON.stringify(doc, null, 1));
    console.log(`✓ ${elements.length} 元素 → ${out}`);
    console.log(`  建议:node scripts/arch-lint.mjs "${out}"`);
  } else if (TIER2.has(type)) {
    console.log(`类型:${type}(Tier 2:mermaid 结构 → arch-layout 手绘风)`);
    const ok = await tier2(src, type, out);
    if (ok) { console.log(`✓ → ${out}`); console.log(`  建议:node scripts/arch-lint.mjs "${out}"`); }
    else {
      const { elements, files } = await tier1(src);
      fs.writeFileSync(out, JSON.stringify({ type: 'excalidraw', version: 2, source: 'excali-design/mermaid', elements, appState: { viewBackgroundColor: '#fafaf6' }, files: files || {} }, null, 1));
      console.log(`✓(Tier 2 失败,官方图片兜底)→ ${out}`);
    }
  } else {
    console.log(`⚠ 类型「${type}」官方库不原生支持,会退化为 SVG 图片(非手绘原生)。`);
    const { elements, files } = await tier1(src);
    fs.writeFileSync(out, JSON.stringify({ type: 'excalidraw', version: 2, source: 'excali-design/mermaid', elements, appState: { viewBackgroundColor: '#fafaf6' }, files: files || {} }, null, 1));
    console.log(`✓(SVG 图片兜底)→ ${out}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
