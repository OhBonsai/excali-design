#!/usr/bin/env node
/**
 * render-frames.mjs · 帧序列 → PNG 序列(绘图刷新动画 · 导出路径 B 第 1 步)
 *
 * 把 _frames/<name>/frame-*.json(每帧一组 Excalidraw 元素)逐帧渲染成等尺寸 PNG,
 * 供 frames-to-video.sh 用 ffmpeg 合成 MP4/GIF。
 *
 * 用法:
 *   node scripts/render-frames.mjs --frames _frames/order-flow --out _frames/order-flow/png \
 *        [--width 1920] [--height 1080] [--bg "#fafaf6"]
 *
 * 输入:
 *   <frames-dir>/meta.json        { width, height, bg, frameCount, ... }(可选,缺则用 CLI)
 *   <frames-dir>/frame-001.json   Element[]
 *
 * 输出:
 *   <out-dir>/frame-001.png ...   每帧一张,尺寸严格一致(ffmpeg 要求)
 *
 * 实现:Playwright(无头 chromium)加载 @excalidraw/excalidraw 的 exportToBlob 渲染。
 *   - 官方导出 util → 和 excalidraw.com 同款渲染(rough.js 手绘路径保真)
 *   - 每帧注入一个透明 anchor 矩形(0,0,w,h)固定 bbox → 所有 PNG 同尺寸、坐标系一致、无抖动
 *   - getDimensions 固定 width/height/scale,不 auto-fit
 *   - 元素自带 seed,exportToBlob 不重随机 → 手绘形状跨帧稳定(不鬼畜)
 *
 * 字体注意:默认渲染用浏览器衬线 fallback,不是 Excalidraw 手绘体 Virgil。
 *   要真手绘体,设 --fonts 指向 Excalidraw 字体 CSS(见 references/animation-pipeline.md),
 *   或在 HTML 里 @font-face 加载 Virgil/Cascadia/Comic Shanns(fontFamily 1/3/...)。
 *
 * 依赖:npm install playwright @excalidraw/excalidraw 不需要(从 CDN import);只需 playwright + chromium。
 *   npm install playwright && npx playwright install chromium
 *   (CI/沙箱可用 playwright-core + 自带 chromium,设 EXCALI_CHROMIUM=<chrome 可执行路径>)
 *
 * 退化:无 Node/Playwright/chromium 时本脚本不可用 → 只能走动画路径 A(视图内 create_view 刷新)。
 */

import fs from 'node:fs';
import path from 'node:path';

const EXCALIDRAW_CDN = process.env.EXCALI_CDN || 'https://esm.sh/@excalidraw/excalidraw@0.17.6';

function parseArgs(argv) {
  const a = { width: 1920, height: 1080, bg: '#fafaf6' };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--frames') a.frames = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--width') a.width = parseInt(argv[++i]);
    else if (k === '--height') a.height = parseInt(argv[++i]);
    else if (k === '--bg') a.bg = argv[++i];
    else if (k === '--help' || k === '-h') a.help = true;
  }
  return a;
}

function usage() {
  console.error('用法: node render-frames.mjs --frames <dir> --out <dir> [--width 1920] [--height 1080] [--bg "#fafaf6"]');
  process.exit(1);
}

function loadFrames(dir) {
  const metaPath = path.join(dir, 'meta.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
  const files = fs.readdirSync(dir).filter((f) => /^frame-\d+\.json$/.test(f)).sort();
  if (files.length === 0) { console.error(`未找到 frame-NNN.json 于 ${dir}`); process.exit(1); }
  return { meta, files, frames: files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) };
}

async function getChromium() {
  let mod;
  try { mod = await import('playwright'); }
  catch { try { mod = await import('playwright-core'); } catch { return null; } }
  return mod.chromium;
}

const PAGE_HTML = (cdn) => `<!doctype html><meta charset=utf8><body><script type="module">
  const Ex = (await import('${cdn}')).default;
  window.__render = async (elements, w, h, bg, files) => {
    const anchor = { type:'rectangle', id:'__anchor', x:0, y:0, width:w, height:h,
      strokeColor:'transparent', backgroundColor:'transparent', fillStyle:'solid',
      strokeWidth:1, strokeStyle:'solid', roughness:0, opacity:0, seed:1, angle:0,
      groupIds:[], roundness:null, isDeleted:false, boundElements:[], versionNonce:1, updated:1 };
    const blob = await Ex.exportToBlob({
      elements: [anchor, ...elements],
      appState: { exportBackground:true, viewBackgroundColor:bg, exportPadding:0 },
      files: files || null, mimeType:'image/png',
      getDimensions: () => ({ width:w, height:h, scale:1 }),
    });
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  };
  window.__ready = true;
</script></body>`;

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.frames || !args.out) usage();

  const { meta, files, frames } = loadFrames(args.frames);
  const width = meta.width || args.width;
  const height = meta.height || args.height;
  const bg = meta.bg || args.bg;
  fs.mkdirSync(args.out, { recursive: true });

  // 图片素材表(image 元素的 fileId → dataURL),嵌 logo/截图时需要
  const filesPath = path.join(args.frames, 'files.json');
  const imageFiles = fs.existsSync(filesPath) ? JSON.parse(fs.readFileSync(filesPath, 'utf8')) : null;
  if (imageFiles) console.log(`加载 files.json:${Object.keys(imageFiles).length} 个图片素材`);

  // 结构校验(防止把坏帧渲染出来)
  frames.forEach((els, i) => {
    if (!Array.isArray(els)) throw new Error(`${files[i]} 不是元素数组`);
    const ids = els.map((e) => e.id).filter(Boolean);
    if (new Set(ids).size !== ids.length) console.warn(`⚠ ${files[i]} 有重复 id`);
  });

  const chromium = await getChromium();
  if (!chromium) {
    console.error('🚧 未找到 playwright/playwright-core。装:npm i playwright && npx playwright install chromium');
    console.error('   无渲染依赖时请改走动画路径 A(视图内 create_view 刷新),见 SKILL.md。');
    process.exit(3);
  }

  console.log(`帧数:${frames.length} · 画布:${width}x${height} · 背景:${bg} · CDN:${EXCALIDRAW_CDN}`);
  const launchOpts = process.env.EXCALI_CHROMIUM ? { executablePath: process.env.EXCALI_CHROMIUM } : {};
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.setContent(PAGE_HTML(EXCALIDRAW_CDN), { waitUntil: 'networkidle' });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 });

  for (let i = 0; i < frames.length; i++) {
    const bytes = await page.evaluate(([els, w, h, b, f]) => window.__render(els, w, h, b, f), [frames[i], width, height, bg, imageFiles]);
    const outPath = path.join(args.out, files[i].replace(/\.json$/, '.png'));
    fs.writeFileSync(outPath, Buffer.from(bytes));
    process.stdout.write(`\r渲染 ${i + 1}/${frames.length}`);
  }
  process.stdout.write('\n');
  await browser.close();
  console.log(`✓ 输出 ${frames.length} 张 PNG 到 ${args.out}`);
  console.log(`  下一步: bash scripts/frames-to-video.sh ${args.out} --fps 30 --hold 30 --gif`);
}

main().catch((e) => { console.error(e); process.exit(1); });
