/**
 * _browser.mjs · 找一个能用的 Chromium 内核(给 html-to-excalidraw / excalidraw-to-image 用)
 *
 * 优先级:不强迫下载 playwright 的 chromium——客户系统里有 Chrome/Edge/Chromium 就直接用。
 *   1. EXCALI_CHROMIUM 环境变量(显式指定)
 *   2. 系统已装浏览器(常见路径:Chrome / Chromium / Edge / Brave)
 *   3. playwright channel('chrome' / 'msedge',用系统装的)
 *   4. playwright 自带 chromium(npx playwright install chromium 装的)
 * 全失败 → 返回 {error}.
 */
import { existsSync } from 'node:fs';

const PATHS = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ],
  linux: [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium',
    '/usr/bin/microsoft-edge', '/usr/bin/brave-browser',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
};

export function findSystemBrowser() {
  if (process.env.EXCALI_CHROMIUM && existsSync(process.env.EXCALI_CHROMIUM)) return process.env.EXCALI_CHROMIUM;
  for (const p of (PATHS[process.platform] || PATHS.linux)) if (existsSync(p)) return p;
  return null;
}

/**
 * 返回 { browser, used } 或 { error }。used = 实际用的内核来源(便于打印)。
 */
export async function launchChromium(launchArgs = {}) {
  let mod;
  try { mod = await import('playwright'); }
  catch { try { mod = await import('playwright-core'); } catch { return { error: 'no-playwright' }; } }
  const chromium = mod.chromium;

  const sys = findSystemBrowser();
  const attempts = [];
  if (sys) attempts.push({ opt: { ...launchArgs, executablePath: sys }, used: `系统浏览器 ${sys}` });
  attempts.push({ opt: { ...launchArgs, channel: 'chrome' }, used: '系统 Chrome(channel)' });
  attempts.push({ opt: { ...launchArgs, channel: 'msedge' }, used: '系统 Edge(channel)' });
  attempts.push({ opt: { ...launchArgs }, used: 'playwright 自带 chromium' });

  let lastErr;
  for (const a of attempts) {
    try { const browser = await chromium.launch(a.opt); return { browser, used: a.used }; }
    catch (e) { lastErr = e; }
  }
  return { error: 'launch-failed', detail: lastErr && lastErr.message };
}

export const NO_BROWSER_HINT =
  '🚧 找不到可用的浏览器内核。两种解法(任一):\n' +
  '   · 已装 Chrome/Edge → 设 EXCALI_CHROMIUM=<可执行文件路径>(或确保在标准安装路径)\n' +
  '   · 或装 playwright 自带 chromium:npm install playwright && npx playwright install chromium';
