#!/usr/bin/env node
// mindmap 渲染测试器 —— 挑 case / 风格 / 布局快速验证 render-mindmap。
//   node scripts/test-mindmap.mjs                         # 列 case + 风格 + 布局
//   node scripts/test-mindmap.mjs <case> [style|all] [layout|all|both]
//   node scripts/test-mindmap.mjs all <style>             # 各 case ×(logical+radial) 拼图
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const SCRIPTS=path.dirname(new URL(import.meta.url).pathname), ROOT=path.resolve(SCRIPTS,'..');
const CASES=path.join(ROOT,'examples/mindmap/cases'), OUT=path.join(ROOT,'examples/mindmap/out');
const RENDER=path.join(SCRIPTS,'render-mindmap.mjs'), SVG=path.join(SCRIPTS,'svg-export.mjs');
const STYLES=['pencil','mono','classic-tricolor','hachure-classic','pastel-journal','duotone-hachure'];
const LAYOUTS=['logical','radial'];
const cases=fs.existsSync(CASES)?fs.readdirSync(CASES).filter(f=>/\.(mmd|mermaid)$/.test(f)).map(f=>f.replace(/\.(mmd|mermaid)$/,'')):[];
fs.mkdirSync(OUT,{recursive:true});
const HASM=!!execFileSync('bash',['-c','command -v montage||true'],{encoding:'utf8'}).trim();
const render=(c,s,lay)=>{const src=path.join(CASES,c+'.mmd'); if(!fs.existsSync(src)){console.error('  [skip]',c);return null;}
  const exc=path.join(OUT,`${c}.${lay}.excalidraw`),png=path.join(OUT,`${c}.${lay}.png`);
  try{execFileSync('node',[RENDER,src,exc,s,lay],{stdio:'pipe'});execFileSync('node',[SVG,exc,'--png'],{stdio:'pipe'});console.log(`  ✓ ${c} · ${s} · ${lay}`);return png;}
  catch(e){console.error(`  ✗ ${c} · ${s} · ${lay}: ${e.message.split('\n')[0]}`);return null;}};
const montage=(pngs,out,tile)=>{if(!HASM||pngs.length<2)return;try{execFileSync('montage',[...pngs,'-tile',tile,'-geometry','460x+8+8','-background','#ccc',out]);console.log('  ▦',path.relative(ROOT,out));}catch{}};
const [a1,a2,a3]=process.argv.slice(2);
if(!a1){console.log('cases:',cases.join(', ')||'(none)');console.log('styles:',STYLES.join(', '));console.log('layouts:',LAYOUTS.join(', '),'(default both)');process.exit(0);}
const cl=a1==='all'?cases:[a1];
const sl=!a2?[STYLES[0]]:(a2==='all'?STYLES:[a2]);
const ll=(!a3||a3==='both'||a3==='all')?LAYOUTS:[a3];
const made=[];
for(const c of cl)for(const s of sl)for(const lay of ll){const p=render(c,s,lay);if(p)made.push(p);}
if(a1==='all'&&a2!=='all')montage(made,path.join(OUT,`ALL-cases.${sl[0]}.png`),'2x');
else if(a1!=='all'&&a2==='all')montage(made,path.join(OUT,`${a1}.ALL-styles.png`),`${made.length}x1`);
console.log(`\n完成 ${made.length} 张 → ${path.relative(ROOT,OUT)}/`);
