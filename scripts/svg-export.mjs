#!/usr/bin/env node
/**
 * svg-export.mjs · .excalidraw → SVG(headless,无 chromium)
 *
 * Excalidraw 的手绘抖动不存在文件里,是渲染时 Rough.js 按 seed+roughness 实时生成的。
 * Rough.js 的 RoughGenerator(`rough.generator()`)**不需要 DOM/浏览器**:给它形状参数
 * → 它返回 toPaths()(SVG path 数据)→ 我们自己拼成 <path>。所以全程 headless。
 *
 * 字体:只写 font-family 回退(Virgil→手写体回退 / Normal→sans / Code→mono),不嵌字体
 * → SVG 小、零字体依赖;装了对应字体的人看着最准,没装的优雅回退。
 *
 * 覆盖:rectangle / ellipse / diamond / line / arrow / freedraw / text / image / frame。
 * 唯一依赖:roughjs(纯 JS,无 native、无浏览器)。比 playwright+chromium 轻一两个数量级。
 *
 * 用法:
 *   node scripts/svg-export.mjs 图.excalidraw [--out 图.svg] [--padding 20] [--transparent]
 *   node scripts/svg-export.mjs 图.excalidraw --png        # 若装了 @resvg/resvg-js 则顺带出 PNG
 *
 * PNG:SVG→PNG 需要栅格化器(非纯 Node)。本脚本可选用 @resvg/resvg-js(预编译,非浏览器);
 *     没装就只出 SVG 并提示。要最高保真仍可用 excalidraw-to-image.mjs(playwright)。
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const a = { padding: 20, transparent: false, png: false };
  const it = argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    let t = it[i], v = null; const eq = t.indexOf('=');
    if (t.startsWith('--') && eq >= 0) { v = t.slice(eq + 1); t = t.slice(0, eq); }
    const next = () => (v !== null ? v : it[++i]);
    if (t === '--out') a.out = next();
    else if (t === '--padding') a.padding = parseInt(next());
    else if (t === '--transparent') a.transparent = true;
    else if (t === '--png') a.png = true;
    else if (!t.startsWith('--')) a.input = t;
  }
  return a;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = { 1: "Virgil, 'Comic Sans MS', 'Segoe Print', 'Bradley Hand', cursive", 2: "Helvetica, Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif", 3: "Cascadia, 'Cascadia Code', 'Courier New', monospace" };
const ANCHOR = { left: 'start', center: 'middle', right: 'end' };

// 圆角矩形 path(roundness:{type:3} 用)
function roundedRectPath(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

function main() {
  const a = parseArgs(process.argv);
  if (!a.input) { console.error('用法: node scripts/svg-export.mjs 图.excalidraw [--out x.svg] [--png] [--transparent]'); process.exit(1); }
  let rough; try { rough = require('roughjs'); } catch { console.error('🚧 需要 roughjs:npm install roughjs'); process.exit(3); }
  const gen = rough.generator();

  const doc = JSON.parse(fs.readFileSync(a.input, 'utf8'));
  const els = (doc.elements || []).filter(e => !e.isDeleted);
  const files = doc.files || {};
  const bg = a.transparent ? null : ((doc.appState && doc.appState.viewBackgroundColor) || '#ffffff');

  // 1) bbox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of els) {
    const xs = [e.x, e.x + (e.width || 0)], ys = [e.y, e.y + (e.height || 0)];
    if (e.points) for (const p of e.points) { xs.push(e.x + p[0]); ys.push(e.y + p[1]); }
    minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
    minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
  }
  if (!isFinite(minX)) { minX = minY = 0; maxX = maxY = 100; }
  const pad = a.padding;
  const vbX = minX - pad, vbY = minY - pad, vbW = (maxX - minX) + pad * 2, vbH = (maxY - minY) + pad * 2;

  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}" width="${vbW.toFixed(0)}" height="${vbH.toFixed(0)}">`);
  if (bg) out.push(`<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bg}"/>`);

  // roughjs Drawable → <path> 串
  const emitDrawable = (drawable, opacity) => {
    const op = (opacity ?? 100) / 100;
    const g = op < 1 ? `<g opacity="${op}">` : '';
    let s = g;
    for (const p of gen.toPaths(drawable)) {
      // 用默认 nonzero 填充规则:roughjs 的实心椭圆填充是多段重叠子路径,evenodd 会互相抵消成空心
      s += `<path d="${p.d}"${p.stroke && p.stroke !== 'none' ? ` stroke="${p.stroke}"` : ' stroke="none"'}${p.strokeWidth ? ` stroke-width="${p.strokeWidth}"` : ''}${p.fill && p.fill !== 'none' ? ` fill="${p.fill}"` : ' fill="none"'} stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return s + (g ? '</g>' : '');
  };

  const roughOpts = e => {
    const o = { roughness: e.roughness ?? 1, seed: e.seed || 1, stroke: (e.strokeColor && e.strokeColor !== 'transparent') ? e.strokeColor : 'none', strokeWidth: e.strokeWidth || 1 };
    if (e.strokeStyle === 'dashed') o.strokeLineDash = [8, 8];
    else if (e.strokeStyle === 'dotted') o.strokeLineDash = [2, 4];
    if (e.backgroundColor && e.backgroundColor !== 'transparent') {
      o.fill = e.backgroundColor;
      o.fillStyle = e.fillStyle === 'solid' ? 'solid' : (e.fillStyle === 'cross-hatch' ? 'cross-hatch' : 'hachure');
    }
    return o;
  };

  // 箭头头(在末段方向画一个 V)
  const arrowHead = (p0, p1, color, sw) => {
    const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); const L = 14 + sw * 2, spread = 0.45;
    const a1 = [p1[0] - L * Math.cos(ang - spread), p1[1] - L * Math.sin(ang - spread)];
    const a2 = [p1[0] - L * Math.cos(ang + spread), p1[1] - L * Math.sin(ang + spread)];
    return `<path d="M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${a2[0].toFixed(1)} ${a2[1].toFixed(1)}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  };

  for (const e of els) {
    try {
      if (e.type === 'rectangle' || e.type === 'frame') {
        const r = (e.roundness ? Math.min(32, Math.min(e.width, e.height) * 0.25) : 0);
        const d = r > 0 ? gen.path(roundedRectPath(e.x, e.y, e.width, e.height, r), roughOpts(e)) : gen.rectangle(e.x, e.y, e.width, e.height, roughOpts(e));
        out.push(emitDrawable(d, e.opacity));
      } else if (e.type === 'ellipse') {
        out.push(emitDrawable(gen.ellipse(e.x + e.width / 2, e.y + e.height / 2, e.width, e.height, roughOpts(e)), e.opacity));
      } else if (e.type === 'diamond') {
        const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
        out.push(emitDrawable(gen.polygon([[cx, e.y], [e.x + e.width, cy], [cx, e.y + e.height], [e.x, cy]], roughOpts(e)), e.opacity));
      } else if (e.type === 'line' || e.type === 'freedraw') {
        const pts = (e.points || []).map(p => [e.x + p[0], e.y + p[1]]);
        if (pts.length < 2) continue;
        const closed = e.backgroundColor && e.backgroundColor !== 'transparent';
        const d = closed ? gen.polygon(pts, roughOpts(e)) : gen.linearPath(pts, roughOpts(e));
        out.push(emitDrawable(d, e.opacity));
      } else if (e.type === 'arrow') {
        const pts = (e.points || []).map(p => [e.x + p[0], e.y + p[1]]);
        if (pts.length < 2) continue;
        out.push(emitDrawable(gen.linearPath(pts, roughOpts(e)), e.opacity));
        const col = (e.strokeColor && e.strokeColor !== 'transparent') ? e.strokeColor : '#1e1e1e';
        if (e.endArrowhead !== null) out.push(arrowHead(pts[pts.length - 2], pts[pts.length - 1], col, e.strokeWidth || 2));
        if (e.startArrowhead) out.push(arrowHead(pts[1], pts[0], col, e.strokeWidth || 2));
      } else if (e.type === 'text') {
        const size = e.fontSize || 16, lh = size * 1.25, fam = FONT[e.fontFamily] || FONT[1];
        const anchor = ANCHOR[e.textAlign] || 'start';
        const tx = anchor === 'middle' ? e.x + (e.width || 0) / 2 : anchor === 'end' ? e.x + (e.width || 0) : e.x;
        const col = (e.strokeColor && e.strokeColor !== 'transparent') ? e.strokeColor : '#1e1e1e';
        const op = (e.opacity ?? 100) / 100;
        const lines = String(e.text || '').split('\n');
        let s = `<text x="${tx.toFixed(1)}" y="${(e.y + size * 0.92).toFixed(1)}" font-family="${esc(fam)}" font-size="${size}" fill="${col}" text-anchor="${anchor}"${op < 1 ? ` opacity="${op}"` : ''} style="white-space:pre">`;
        s += lines.map((ln, i) => `<tspan x="${tx.toFixed(1)}"${i ? ` dy="${lh.toFixed(1)}"` : ''}>${esc(ln)}</tspan>`).join('');
        out.push(s + '</text>');
      } else if (e.type === 'image' && e.fileId && files[e.fileId]) {
        out.push(`<image x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" href="${files[e.fileId].dataURL}"${(e.opacity ?? 100) < 100 ? ` opacity="${(e.opacity / 100).toFixed(2)}"` : ''}/>`);
      }
    } catch (err) { console.error(`  ⚠ 跳过 ${e.type}#${e.id}: ${err.message}`); }
  }
  out.push('</svg>');
  const svg = out.join('\n');
  const outPath = a.out || a.input.replace(/\.excalidraw$/i, '') + '.svg';
  fs.writeFileSync(outPath, svg);
  console.log(`✓ SVG(headless,无 chromium):${els.length} 元素 → ${outPath}  (${(svg.length / 1024).toFixed(1)} KB)`);

  if (a.png) {
    let Resvg; try { ({ Resvg } = require('@resvg/resvg-js')); } catch { Resvg = null; }
    if (!Resvg) { console.log('  ⚠ 要出 PNG 需:npm install @resvg/resvg-js(预编译,非浏览器)。或用 excalidraw-to-image.mjs(playwright)。'); }
    else {
      const pngPath = outPath.replace(/\.svg$/i, '.png');
      const r = new Resvg(svg, { fitTo: { mode: 'width', value: Math.round(vbW * 2) } });
      fs.writeFileSync(pngPath, r.render().asPng());
      console.log(`✓ PNG(resvg,无 chromium):→ ${pngPath}`);
    }
  }
}
main();
