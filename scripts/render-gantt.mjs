import fs from 'fs';
import { parseGantt } from './mermaid-gantt.mjs';
// renderGantt —— 甘特图：时间轴线性映射，任务条几何精确(roughness 只动描边)，里程碑菱形，section 分组，刻度网格
// 用法：node render-gantt.mjs <input.mmd|ir.json> <out.excalidraw> [style]

const INK='#1e1e1e', GRAY='#868e96', GRID='#e9ecef';
const STYLES = {
  'classic-tricolor': { paper:'#ffffff', sw:1.6, rough:1, fs:'solid', ink:INK,
    bar:{s:'#1971c2',f:'#a5d8ff'}, done:{s:'#868e96',f:'#dee2e6'}, active:{s:'#2f9e44',f:'#b2f2bb'}, crit:{s:'#e03131',f:'#ffc9c9'} },
  'hachure-classic': { paper:'#ffffff', sw:1.5, rough:1, fs:'hachure', ink:INK,
    bar:{s:INK,f:'#74c0fc'}, done:{s:INK,f:'#ced4da'}, active:{s:INK,f:'#69db7c'}, crit:{s:INK,f:'#ff8787'} },
  'pastel-journal': { paper:'#fdf6e3', sw:2.0, rough:1.3, fs:'solid', ink:'#2b2b2b',
    bar:{s:'#2b2b2b',f:'#ffd9a8'}, done:{s:'#2b2b2b',f:'#e9e2d0'}, active:{s:'#2b2b2b',f:'#d4ee9f'}, crit:{s:'#2b2b2b',f:'#f6c9a8'} },
  'duotone-hachure': { paper:'#ffffff', sw:1.8, rough:1, fs:'hachure', ink:'#7048e8',
    bar:{s:'#7048e8',f:'#eadcff'}, done:{s:'#7048e8',f:'#f3eeff'}, active:{s:'#7048e8',f:'#d8c9f5'}, crit:{s:'#7048e8',f:'#c3b0ef'} },
};
const _in=process.argv[2], _raw=fs.readFileSync(_in,'utf8');
const IR = (/\.(mmd|mermaid)$/i.test(_in) || /^\s*gantt\b/i.test(_raw)) ? parseGantt(_raw) : JSON.parse(_raw);
const S = STYLES[process.argv[4]||IR.style||'classic-tricolor'] || STYLES['classic-tricolor'];
const INKC=S.ink, tasks=IR.tasks;

// ---------- 时间标度（faithfulness：x/width 全由日期算） ----------
const minDay=Math.min(...tasks.map(t=>t.start)), maxDay=Math.max(...tasks.map(t=>t.end));
const span=Math.max(maxDay-minDay,1);
const M=40, LGUT=240, TOPAX=92, ROWH=34, BARH=22;
const W=Math.max(900, LGUT+span*Math.min(26, Math.max(8, 760/span))+120);
const x0=LGUT, x1=W-M-20;
const X=d=> x0 + (d-minDay)/span*(x1-x0);
// 行序列：section 各占一独立表头行，任务名缩进，不再与 section 同行重叠
const rows=[]; let _sec=null;
for(const t of tasks){ if(t.section&&t.section!==_sec){ _sec=t.section; rows.push({kind:'section',name:t.section}); } rows.push({kind:'task',task:t}); }
const H=TOPAX+rows.length*ROWH+50;

// ---------- 刻度（nice step by 天数跨度） ----------
const step = span<=14?2 : span<=45?7 : span<=120?14 : span<=400?30 : 90;
const fmt=d=>{ const dt=new Date(d*86400000); return `${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`; };

// ---------- 原语 ----------
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=o=>({angle:0,strokeColor:o.stroke??INKC,backgroundColor:o.fill==='none'?'transparent':(o.fill??'transparent'),fillStyle:o.fs??S.fs,strokeWidth:o.sw??S.sw,strokeStyle:o.ss??'solid',roughness:o.rough??S.rough,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={},round)=>els.push({type:'rectangle',id:id('r'),x,y,width:Math.max(w,1),height:h,roundness:round?{type:3}:null,...base(o)});
const Dm=(x,y,w,h,o={})=>els.push({type:'diamond',id:id('d'),x,y,width:w,height:h,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??14)*0.6,height:(o.size??14)+6,angle:0,text:t,fontSize:o.size??14,fontFamily:o.ff??2,textAlign:o.align??'left',verticalAlign:'top',strokeColor:o.color??INKC,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});

els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:W,height:H,angle:0,strokeColor:'transparent',backgroundColor:S.paper,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});
if(IR.title) T(M,28,IR.title,{size:22,w:W-2*M});

// 网格 + 刻度（先画，垫底）
const gridTop=TOPAX-18, gridBot=H-30;
for(let d=minDay; d<=maxDay+0.5; d+=step){ const x=X(d);
  Ln([[x,gridTop],[x,gridBot]],{stroke:GRID,fill:'none',sw:1,ss:'dashed',rough:0});
  T(x-16,TOPAX-36,fmt(d),{size:12,color:GRAY,w:48,align:'center'});
}
Ln([[x0,gridTop],[x1,gridTop]],{stroke:GRAY,fill:'none',sw:1.4,rough:0});   // 轴线

// section 表头行 + 任务行
rows.forEach((row,i)=>{ const y=TOPAX+i*ROWH, cy=y+ROWH/2;
  if(row.kind==='section'){ T(M,cy-9,row.name,{size:14.5,color:INKC,w:LGUT-M-8});
    Ln([[M,y+ROWH-2],[x1,y+ROWH-2]],{stroke:GRID,fill:'none',sw:1,rough:0}); return; }
  const t=row.task;
  T(M+22,cy-8,t.name,{size:13.5,color:INKC,w:LGUT-M-30});                    // 任务名（缩进）
  const c = t.status.includes('crit')?S.crit : t.status.includes('done')?S.done : t.status.includes('active')?S.active : S.bar;
  if(t.milestone){ const x=X(t.start); Dm(x-11,cy-11,22,22,{stroke:c.s,fill:c.f}); }
  else { const bx=X(t.start), bw=X(t.end)-X(t.start); R(bx,cy-BARH/2,bw,BARH,{stroke:c.s,fill:c.f},true);
    T(X(t.end)+8,cy-8,`${Math.round(t.end-t.start)}d`,{size:11,color:GRAY,w:50}); }
});

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:S.paper,gridSize:20}};
fs.writeFileSync(process.argv[3],JSON.stringify(doc,null,2));
console.log(`gantt: "${IR.title}" ${tasks.length} tasks, span=${span}d, style=${process.argv[4]||IR.style||'classic-tricolor'} → ${process.argv[3]}`);
