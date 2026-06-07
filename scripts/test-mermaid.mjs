#!/usr/bin/env node
// 统一 mermaid 模板渲染测试器 —— 一次性把 5 种类型的全部 case 渲染出来（本地，不调模型）。
//   node scripts/test-mermaid.mjs [style]     默认 classic-tricolor；传 all 则每类型出全风格拼图
// 逐类型调用各自的 test-<type>.mjs。产物在 examples/<type>/out/。
import path from 'node:path'; import { execFileSync } from 'node:child_process';
const SCRIPTS=path.dirname(new URL(import.meta.url).pathname);
const TYPES=['flowchart','sequence','state','class','er','gantt','mindmap'];
const style=process.argv[2]||'classic-tricolor';
for(const t of TYPES){
  console.log(`\n== ${t} ==`);
  try{ execFileSync('node',[path.join(SCRIPTS,`test-${t}.mjs`),'all',style],{stdio:'inherit'}); }
  catch(e){ console.error(`  [type err] ${t}: ${e.message.split('\n')[0]}`); }
}
console.log(`\n全部完成。各类型产物：examples/<type>/out/  （ALL-cases.${style}.png 是该类型拼图）`);
