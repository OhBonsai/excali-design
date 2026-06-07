#!/usr/bin/env node
// 生成 eval/report.html —— 一页看全测试矩阵：行=case 列=变体，每格缩略图+lint 分数+评判标准。
// 用法：node eval/report.mjs [method|model]  然后浏览器打开 eval/report.html
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const EVAL = path.join(ROOT, 'eval');
const mode = process.argv[2] === 'model' ? 'model' : 'method';

const cases = fs.readFileSync(path.join(EVAL, 'cases.jsonl'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean).map(s => JSON.parse(s));
const vcfg = JSON.parse(fs.readFileSync(path.join(EVAL, 'variants.json'), 'utf8'));
const cols = mode === 'method'
  ? vcfg.variants.map(v => ({ name: v.name, sub: v.adds || '' }))
  : vcfg._model_matrix.models.map(m => ({ name: m.split('/').pop(), sub: m }));

const rel = (col, id, f) => `out/${mode}/${col}/${id}/${f}`;
const abs = (col, id, f) => path.join(EVAL, rel(col, id, f));
const has = (col, id) => fs.existsSync(abs(col, id, 'out.png'));
function lint(col, id) {
  try { const d = JSON.parse(fs.readFileSync(abs(col, id, 'lint.json'), 'utf8')); return { e: d.errors?.length ?? 0, w: d.warnings?.length ?? 0 }; }
  catch { return null; }
}
const rows = cases.filter(cs => cols.some(c => has(c.name, cs.id)));
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

const nDone = rows.reduce((a, cs) => a + cols.filter(c => has(c.name, cs.id)).length, 0);

let html = `<!doctype html><meta charset="utf-8"><title>excali-design eval · ${mode}</title>
<style>
:root{--b:#e5e7eb;--g:#6b7280;--ink:#111}
body{font:14px/1.5 -apple-system,system-ui,"PingFang SC",sans-serif;color:var(--ink);margin:0;background:#fafafa}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--b);padding:12px 18px;z-index:5}
h1{font-size:18px;margin:0 0 4px} .muted{color:var(--g);font-size:12px}
.legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.legend span{background:#f3f4f6;border:1px solid var(--b);border-radius:6px;padding:2px 8px;font-size:12px}
table{border-collapse:separate;border-spacing:0;margin:14px}
th,td{border:1px solid var(--b);vertical-align:top;background:#fff}
thead th{position:sticky;top:64px;background:#f9fafb;z-index:4;padding:8px 10px;text-align:left;font-size:12px}
tbody th{position:sticky;left:0;background:#fff;z-index:3;width:230px;max-width:230px;padding:8px 10px;text-align:left}
.cid{font-weight:600} .tag{display:inline-block;font-size:11px;color:var(--g);border:1px solid var(--b);border-radius:5px;padding:0 5px;margin-right:4px}
.focus{font-size:12px;color:#374151;margin-top:4px} .wit{font-size:11px;color:#7048e8;margin-top:4px}
td{padding:6px;text-align:center;width:280px}
td img{width:268px;height:auto;border:1px solid var(--b);border-radius:4px;background:#fff;display:block}
.score{font-size:12px;margin-top:4px} .ok{color:#16a34a} .err{color:#dc2626;font-weight:600} .warn{color:#b45309}
.na{color:#9ca3af;font-size:24px;padding:30px 0}
a{color:inherit;text-decoration:none}
.cell{cursor:zoom-in}
.lb{position:fixed;inset:0;background:rgba(17,17,17,.93);display:none;align-items:center;justify-content:center;flex-direction:column;z-index:50}
.lb.on{display:flex}
.lb img{max-width:95vw;max-height:84vh;background:#fff;border-radius:6px;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.lbcap{color:#fff;font-size:14px;margin-bottom:10px;font-weight:600}
.lbhint{color:#9ca3af;font-size:12px;margin-top:12px}
</style>
<header>
<h1>excali-design 评测矩阵 · ${mode === 'method' ? '方法迭代' : '模型对比'}</h1>
<div class="muted">行=场景 · 列=${mode === 'method' ? '技能变体' : '模型'} · 已出图 ${nDone} 格 · ${rows.length}/${cases.length} 个场景有产物 · 生成 ${new Date().toLocaleString('zh-CN')}</div>
<div class="legend">${cols.map(c => `<span><b>${esc(c.name)}</b> ${esc(c.sub)}</span>`).join('')}</div>
</header>
<table><thead><tr><th>场景 / 评判标准</th>${cols.map(c => `<th>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>`;

const grid = [];  // grid[r][c] = {src,label} | null  供 lightbox 导航
rows.forEach((cs, ri) => {
  html += `<tr><th><div class="cid">${esc(cs.id)}</div>
    <div><span class="tag">${esc(cs.cat)}</span><span class="tag">${esc(cs.complexity)}</span><span class="tag">${esc(cs.path)}</span></div>
    <div class="focus">${esc(cs.focus)}</div>
    <div class="wit">见证: ${(cs.witnesses || []).map(esc).join(' · ')}</div></th>`;
  const rowCells = [];
  cols.forEach((c, ci) => {
    if (!has(c.name, cs.id)) { html += `<td><div class="na">—</div></td>`; rowCells.push(null); return; }
    const l = lint(c.name, cs.id);
    const score = l ? `<span class="${l.e ? 'err' : 'ok'}">err ${l.e}</span> · <span class="warn">warn ${l.w}</span>` : '<span class="muted">no lint</span>';
    const src = rel(c.name, cs.id, 'out.png');
    html += `<td><img class="cell" loading="lazy" data-r="${ri}" data-c="${ci}" src="${src}"><div class="score">${score}</div></td>`;
    rowCells.push({ src, label: `${cs.id}  ·  ${c.name}${l ? `  ·  err ${l.e} / warn ${l.w}` : ''}` });
  });
  grid.push(rowCells);
  html += `</tr>`;
});
html += `</tbody></table>
<div id="lb" class="lb"><div class="lbcap" id="lbcap"></div><img id="lbimg"><div class="lbhint">←→ 换${mode === 'model' ? '模型' : '变体'}（同场景横比） · ↑↓ 换场景 · Esc 退出</div></div>
<script>
const GRID = ${JSON.stringify(grid)};
const lb=document.getElementById('lb'), im=document.getElementById('lbimg'), cap=document.getElementById('lbcap');
let cur=null;
function show(r,c){ const cell=GRID[r]&&GRID[r][c]; if(!cell) return; cur={r,c}; im.src=cell.src; cap.textContent=cell.label; lb.classList.add('on'); }
function close(){ lb.classList.remove('on'); cur=null; }
function step(r,c,dr,dc){ for(let i=1;i<200;i++){ const nr=r+dr*i, nc=c+dc*i; if(nr<0||nc<0||nr>=GRID.length||nc>=(GRID[0]||[]).length) return null; if(GRID[nr][nc]) return {r:nr,c:nc}; } return null; }
document.addEventListener('click',e=>{ if(e.target.classList.contains('cell')) show(+e.target.dataset.r,+e.target.dataset.c); else if(e.target===lb||e.target===cap) close(); });
document.addEventListener('keydown',e=>{ if(!cur) return; let n=null;
  if(e.key==='Escape'){ close(); return; }
  else if(e.key==='ArrowLeft') n=step(cur.r,cur.c,0,-1);
  else if(e.key==='ArrowRight') n=step(cur.r,cur.c,0,1);
  else if(e.key==='ArrowUp') n=step(cur.r,cur.c,-1,0);
  else if(e.key==='ArrowDown') n=step(cur.r,cur.c,1,0);
  else return;
  e.preventDefault(); if(n) show(n.r,n.c);
});
</script>`;
fs.writeFileSync(path.join(EVAL, `report-${mode}.html`), html);
console.log(`report -> eval/report-${mode}.html  (浏览器打开)`);
