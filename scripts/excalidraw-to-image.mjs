#!/usr/bin/env node
/**
 * excalidraw-to-image.mjs · 单个 .excalidraw 文件 → PNG / SVG
 *
 * 把一张静态 Excalidraw 图导出成图片(放 README、发文档、贴 PPT)。
 * 用 @excalidraw/excalidraw 官方导出 util(从 CDN import),和 excalidraw.com 同款渲染。
 *
 * 用法:
 *   node scripts/excalidraw-to-image.mjs <input.excalidraw> [--png] [--svg] \
 *        [--out <basepath>] [--scale 2] [--bg "#fafaf6"] [--padding 32] [--transparent]
 *
 * 参数:
 *   <input.excalidraw>   excalidraw 文件(含 {elements, appState})或裸 Element[] JSON
 *   --png                输出 PNG(默认:不指定 --png/--svg 时两者都出)
 *   --svg                输出 SVG(矢量,可无限缩放/可编辑)
 *   --out <base>         输出基路径,默认 = 输入同名(<input>.png / <input>.svg)
 *   --scale <n>          PNG 缩放倍率(高清图用 2~3),默认 2
 *   --bg <hex>           背景色,默认取文件 appState.viewBackgroundColor,否则 #fafaf6
 *   --padding <px>       导出留白,默认 32
 *   --transparent        PNG 透明背景(覆盖 --bg)
 *
 * 与 render-frames.mjs 的关系:
 *   render-frames = 多帧 → PNG 序列(动画);本脚本 = 单图 → PNG/SVG(静态交付)。
 *   两者共用同一套 Playwright + Excalidraw CDN 渲染内核。
 *
 * 依赖:playwright + chromium(npm i playwright && npx playwright install chromium)。
 *   沙箱/CI:playwright-core + EXCALI_CHROMIUM=<chrome 路径>;EXCALI_CDN 可换版本。
 *
 * 字体注意:同 render-frames——默认衬线 fallback,非手绘体 Virgil。见 references/animation-pipeline.md。
 */

import fs from 'node:fs';
import path from 'node:path';

const EXCALIDRAW_CDN = process.env.EXCALI_CDN || 'https://esm.sh/@excalidraw/excalidraw@0.17.6';

function parseArgs(argv) {
  const a = { scale: 2, padding: 32, png: false, svg: false, transparent: false };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--png') a.png = true;
    else if (k === '--svg') a.svg = true;
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--scale') a.scale = parseFloat(argv[++i]);
    else if (k === '--bg') a.bg = argv[++i];
    else if (k === '--padding') a.padding = parseInt(argv[++i]);
    else if (k === '--transparent') a.transparent = true;
    else if (k === '--help' || k === '-h') a.help = true;
    else if (!k.startsWith('--')) a.input = k;
  }
  if (!a.png && !a.svg) { a.png = true; a.svg = true; } // 默认两者都出
  return a;
}

function usage() {
  console.error('用法: node excalidraw-to-image.mjs <input.excalidraw> [--png] [--svg] [--out base] [--scale 2] [--bg "#fafaf6"] [--padding 32] [--transparent]');
  process.exit(1);
}

function loadScene(input) {
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (Array.isArray(data)) return { elements: data, appState: {}, files: {} };
  return { elements: data.elements || [], appState: data.appState || {}, files: data.files || {} };
}

import { launchChromium, NO_BROWSER_HINT } from './_browser.mjs';

const PAGE_HTML = (cdn) => `<!doctype html><meta charset=utf8><body><script type="module">
  const Ex = (await import('${cdn}')).default;
  window.__png = async (elements, appState, scale, padding, files) => {
    const blob = await Ex.exportToBlob({
      elements, appState, files: files || null, mimeType:'image/png',
      exportPadding: padding,
      getDimensions: (w,h) => ({ width:w*scale, height:h*scale, scale }),
    });
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  };
  window.__svg = async (elements, appState, padding, files) => {
    const svg = await Ex.exportToSvg({ elements, appState, files: files || null, exportPadding: padding });
    return new XMLSerializer().serializeToString(svg);
  };
  window.__ready = true;
</script></body>`;

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.input) usage();

  const { elements, appState, files } = loadScene(args.input);
  if (elements.length === 0) { console.error('文件无元素'); process.exit(1); }

  const bg = args.transparent ? 'transparent' : (args.bg || appState.viewBackgroundColor || '#fafaf6');
  const exportAppState = {
    ...appState,
    exportBackground: !args.transparent,
    viewBackgroundColor: bg,
  };
  const base = args.out || args.input.replace(/\.excalidraw$/i, '').replace(/\.json$/i, '');

  const { browser, used, error, detail } = await launchChromium();
  if (error) { console.error(NO_BROWSER_HINT + (detail ? `\n   (${detail})` : '')); process.exit(3); }
  console.error(`· 渲染内核:${used}`);
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.setContent(PAGE_HTML(EXCALIDRAW_CDN), { waitUntil: 'networkidle' });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 });

  const outs = [];
  if (args.png) {
    const bytes = await page.evaluate(([e, s, sc, p, f]) => window.__png(e, s, sc, p, f), [elements, exportAppState, args.scale, args.padding, files]);
    const out = `${base}.png`;
    fs.writeFileSync(out, Buffer.from(bytes));
    outs.push(out);
  }
  if (args.svg) {
    const svg = await page.evaluate(([e, s, p, f]) => window.__svg(e, s, p, f), [elements, exportAppState, args.padding, files]);
    const out = `${base}.svg`;
    fs.writeFileSync(out, svg, 'utf8');
    outs.push(out);
  }
  await browser.close();
  console.log('✓ 导出:', outs.join('  '));
}

main().catch((e) => { console.error(e); process.exit(1); });
