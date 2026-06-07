#!/usr/bin/env node
// sequence 渲染测试器 —— 挑 case / 挑风格快速验证 render-sequence。
//   node scripts/test-sequence.mjs                  # 列 case + 风格
//   node scripts/test-sequence.mjs <case> [style]
//   node scripts/test-sequence.mjs <case> all       # 单 case × 全风格(拼图)
//   node scripts/test-sequence.mjs all <style>      # 全 case × 一风格(拼图)
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const SCRIPTS=path.dirname(new URL(import.meta.url).pathname), ROOT=path.resolve(SCRIPTS,'..');
const CASES=path.join(ROOT,'examples/sequence/cases'), OUT=path.join(ROOT,'examples/sequence/out');
const RENDER=path.join(SCRIPTS,'render-sequence.mjs'), SVG=path.join(SCRIPTS,'svg-export.mjs');
const STYLES=['classic-tricolor','hachure-classic','pastel-journal','duotone-hachure'];
const cases=fs.existsSync(CASES)?fs.readdirSync(CASES).filter(f=>/\.(mmd|mermaid)$/.test(f)).map(f=>f.replace(/\.(mmd|mermaid)$/,'')):[];
fs.mkdirSync(OUT,{recursive:true});
const HASM=!!execFileSync('bash',['-c','command -v montage||true'],{encoding:'utf8'}).trim();
const render=(c,s)=>{const src=path.join(CASES,c+'.mmd'); if(!fs.existsSync(src)){console.error('  [skip]',c);return null;}
  const exc=path.join(OUT,`${c}.${s}.excalidraw`),png=path.join(OUT,`${c}.${s}.png`);
  try{execFileSync('node',[RENDER,src,exc,s],{stdio:'pipe'});execFileSync('node',[SVG,exc,'--png'],{stdio:'pipe'});console.log(`  ✓ ${c} · ${s}`);return png;}catch(e){console.error(`  ✗ ${c} · ${s}: ${e.message.split('\n')[0]}`);return null;}};
const montage=(pngs,out,tile)=>{if(!HASM||pngs.length<2)return;try{execFileSync('montage',[...pngs,'-tile',tile,'-geometry','520x+8+8','-background','#ccc',out]);console.log('  ▦',path.relative(ROOT,out));}catch{}};
const [a1,a2]=process.argv.slice(2);
if(!a1){console.log('cases:',cases.join(', ')||'(none)');console.log('styles:',STYLES.join(', '));process.exit(0);}
const cl=a1==='all'?cases:[a1], sl=!a2?[STYLES[0]]:(a2==='all'?STYLES:[a2]); const made=[];
for(const c of cl)for(const s of sl){const p=render(c,s);if(p)made.push(p);}
if(a1!=='all'&&a2==='all')montage(made,path.join(OUT,`${a1}.ALL-styles.png`),`${made.length}x1`);
else if(a1==='all'&&a2!=='all')montage(made,path.join(OUT,`ALL-cases.${a2}.png`),'3x');
console.log(`\n完成 ${made.length} 张 → ${path.relative(ROOT,OUT)}/`);
