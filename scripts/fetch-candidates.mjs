#!/usr/bin/env node
/**
 * fetch-candidates.mjs · 下载 asset-taxonomy.md 里各叶子的候选社区库到 _candidates/
 *
 * ⚠️ 这是 pick 流程里**唯一需要联网**的一步,设计为在**有网的真机**上跑(不是沙箱)。
 *   下载落到 _candidates/<target>/<name>.excalidrawlib 后,后续(渲接触表→图像识别精挑→
 *   合并自建库)都不再联网,本仓库脚本即可完成。
 *
 * 源:libraries.excalidraw.com 背后的 excalidraw/excalidraw-libraries(全 MIT)。
 *   raw 路径 = https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries/<source>
 *
 * 用法:
 *   node scripts/fetch-candidates.mjs                 # 下载全部候选
 *   node scripts/fetch-candidates.mjs excali-net      # 只下某个自建库目标的候选
 *   node scripts/fetch-candidates.mjs --list          # 只列清单不下载
 * 然后(可在沙箱/本仓库做):
 *   node scripts/drawlib-sheet.mjs all --dir _candidates/excali-net --out-dir _candidates/_sheets
 *   再逐张 excalidraw-to-image / svg-export 渲 PNG,交给模型图像识别精挑。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries/';

// 自建库目标 → 候选社区库 source 路径(见 asset-taxonomy.md 的叶子映射)
const CANDIDATES = {
  'excali-net': ['dwelle/network-topology-icons.excalidrawlib', 'samu_x86/network-elements.excalidrawlib', 'jgodoy/racks-and-servers-components.excalidrawlib', 'jgodoy/network-locations.excalidrawlib'],
  'excali-cloud': ['slobodan/aws-serverless.excalidrawlib', 'narhari-motivaras/aws-architecture-icons.excalidrawlib', 'husainkhambaty/aws-simple-icons.excalidrawlib', '7demonsrising/azure-network.excalidrawlib', '7demonsrising/azure-compute.excalidrawlib', '7demonsrising/azure-containers.excalidrawlib', '7demonsrising/azure-storage.excalidrawlib', '7demonsrising/azure-general.excalidrawlib', 'mguidoti/google-icons.excalidrawlib', 'clementbosc/gcp-icons.excalidrawlib', 'youritjang/software-architecture.excalidrawlib', 'cloud/cloud.excalidrawlib'],
  'excali-tech': ['maeddes/technology-logos.excalidrawlib', 'drwnio/drwnio.excalidrawlib', 'pclainchard/it-logos.excalidrawlib', 'markopolo123/dev_ops.excalidrawlib', 'mikhailredis/redis-grafana.excalidrawlib'],
  'excali-ui': ['spfr/lo-fi-wireframing-kit.excalidrawlib', 'excacomp/web-kit.excalidrawlib', 'g-script/medias.excalidrawlib'],
  'excali-frame': ['morgemoensch/gadgets.excalidrawlib', 'franky47/apple-devices-frames.excalidrawlib', 'shinkim/desktop-resolutions.excalidrawlib'],
  'excali-chart': ['g-script/charts.excalidrawlib', 'jakubpawlina/graphs.excalidrawlib'],
  'excali-shape': ['BjoernKW/UML-ER-library.excalidrawlib', 'fraoustin/bpmn.excalidrawlib', 'intradeus/algorithms-and-data-structures-arrays-matrices-trees.excalidrawlib', 'lipis/polygons.excalidrawlib', 'lipis/stars.excalidrawlib'],
  'excali-person': ['kaligule/robots.excalidrawlib', 'ocapraro/bubbles.excalidrawlib', 'drwnio/storytelling.excalidrawlib'],
  'excali-template': ['simalexan/wardley-maps-symbols.excalidrawlib', 'nikordaris/team-topologies.excalidrawlib', 'danimaniarqsoft/scrum-board.excalidrawlib', 'braweria/customer-journey-map.excalidrawlib', 'ferminrp/post-it.excalidrawlib'],
  'excali-symbol': ['yuelfei/deep-learning.excalidrawlib', 'farisology/data-science.excalidrawlib'],
};

async function main() {
  const argv = process.argv.slice(2);
  const only = argv.find(a => !a.startsWith('--'));
  const targets = only ? { [only]: CANDIDATES[only] } : CANDIDATES;
  if (only && !CANDIDATES[only]) { console.error(`未知目标 ${only}。有:${Object.keys(CANDIDATES).join(', ')}`); process.exit(1); }

  if (argv.includes('--list')) {
    for (const [t, srcs] of Object.entries(targets)) { console.log(`\n${t}:`); for (const s of srcs) console.log('  ' + s); }
    console.log(`\n共 ${Object.values(targets).flat().length} 个候选库。下载:去掉 --list。`); return;
  }
  if (typeof fetch !== 'function') { console.error('需要 Node 18+(全局 fetch)。'); process.exit(3); }

  let ok = 0, fail = 0;
  for (const [target, srcs] of Object.entries(targets)) {
    const dir = path.join(ROOT, '_candidates', target);
    fs.mkdirSync(dir, { recursive: true });
    for (const src of srcs) {
      const name = src.split('/').pop();
      const dest = path.join(dir, name);
      try {
        const r = await fetch(BASE + src);
        if (!r.ok) { console.error(`  ✗ ${src} (HTTP ${r.status})`); fail++; continue; }
        const text = await r.text();
        JSON.parse(text);                       // 校验是合法 JSON
        fs.writeFileSync(dest, text);
        console.log(`  ✓ ${target}/${name} (${(text.length / 1024).toFixed(0)} KB)`);
        ok++;
      } catch (e) { console.error(`  ✗ ${src}: ${e.message}`); fail++; }
    }
  }
  console.log(`\n下载完成:${ok} 成功 / ${fail} 失败 → _candidates/`);
  console.log('下一步:node scripts/drawlib-sheet.mjs all --dir _candidates/<target> --out-dir _candidates/_sheets,再渲 PNG 交给模型精挑。');
}
main();
