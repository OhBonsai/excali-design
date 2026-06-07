import fs from 'fs';
import { parseSequence } from './mermaid-sequence.mjs';
// renderSequence —— sequence 专用：IR(或 mermaid) → actor列+时间轴布局 → 消息/激活/note/框 → STYLE → excalidraw
// 用法：node render-sequence.mjs <input.mmd|ir.json> <out.excalidraw> [style]

const INK='#1e1e1e';
const STYLES = {
  'classic-tricolor': { paper:'#ffffff', sw:1.8, rough:1, fs:'solid', ink:INK,
    actor:{stroke:'#1971c2',fill:'#a5d8ff'}, life:'#adb5bd', activation:{stroke:INK,fill:'#e7f5ff'}, note:{stroke:'#e8a838',fill:'#fff3bf'}, frame:'#868e96' },
  'hachure-classic': { paper:'#ffffff', sw:1.6, rough:1, fs:'hachure', ink:INK,
    actor:{stroke:INK,fill:'#a5d8ff'}, life:'#adb5bd', activation:{stroke:INK,fill:'#d3f9d8'}, note:{stroke:INK,fill:'#ffec99'}, frame:'#868e96' },
  'pastel-journal': { paper:'#fdf6e3', sw:2.2, rough:1.3, fs:'solid', ink:'#2b2b2b',
    actor:{stroke:'#2b2b2b',fill:'#ffd9a8'}, life:'#b9b09a', activation:{stroke:'#2b2b2b',fill:'#d4ee9f'}, note:{stroke:'#2b2b2b',fill:'#e6dcf7'}, frame:'#9b8e76' },
  'duotone-hachure': { paper:'#ffffff', sw:2, rough:1, fs:'hachure', ink:'#7048e8',
    actor:{stroke:'#7048e8',fill:'#eadcff'}, life:'#b9a8e8', activation:{stroke:'#7048e8',fill:'#f3eeff'}, note:{stroke:'#7048e8',fill:'#f3eeff'}, frame:'#9c88d8' },
};

const _in = process.argv[2], _raw = fs.readFileSync(_in,'utf8');
const IR = (/\.(mmd|mermaid)$/i.test(_in) || /^\s*sequenceDiagram/i.test(_raw)) ? parseSequence(_raw) : JSON.parse(_raw);
const STYLE_NAME = process.argv[4] || IR.style || 'classic-tricolor';
const S = STYLES[STYLE_NAME] || STYLES['classic-tricolor'];
const INKC = S.ink;

// ---------- 布局 ----------
const M=70, ACTORH=48, ROW=60, HEADGAP=54, SELFW=52;
const actors = IR.actors, events = IR.events, blocks = IR.blocks||[];
const aw = {}; actors.forEach(a=>{ aw[a.id]=Math.max(120, String(a.label).length*10+30); });
const maxAW = Math.max(...actors.map(a=>aw[a.id]), 120);
const GAP = Math.max(maxAW+90, 200);
const ax = {}; actors.forEach((a,i)=>{ ax[a.id] = M + maxAW/2 + i*GAP; });
const headerBottom = M + ACTORH;
const yOf = i => headerBottom + HEADGAP + i*ROW;
const bottomY = yOf(Math.max(events.length-1,0)) + 48;
const W = M + maxAW/2 + (actors.length-1)*GAP + maxAW/2 + M;
const H = bottomY + M;

// ---------- 原语 ----------
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=o=>({angle:0,strokeColor:o.stroke??INKC,backgroundColor:o.fill==='none'?'transparent':(o.fill??'transparent'),fillStyle:o.fs??S.fs,strokeWidth:o.sw??S.sw,strokeStyle:o.ss??'solid',roughness:o.rough??S.rough,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={},round)=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:round?{type:3}:null,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base(o)});};
const Ar=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'arrow',id:id('a'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,startArrowhead:null,endArrowhead:o.head||'arrow',...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??15)*0.6,height:(o.size??15)+6,angle:0,text:t,fontSize:o.size??15,fontFamily:o.ff??2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INKC,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
const label=(cx,cy,lines,o={})=>{ const L=String(lines).split('\n'); L.forEach((ln,k)=>T(cx-(o.w??200)/2, cy-(L.length*20)/2+k*20, ln, {w:o.w??200, align:'center', size:o.size??15, color:o.color})); };

// bg
els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:W,height:H,angle:0,strokeColor:'transparent',backgroundColor:S.paper,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});

// ---------- block 框（最底层） ----------
const involvedX = (b)=>{ const ids=new Set(); for(let i=b.start;i<=b.end;i++){ const e=events[i]; if(!e)continue; if(e.kind==='msg'){ids.add(e.from);ids.add(e.to);} else e.actors.forEach(a=>ids.add(a)); }
  const xs=[...ids].map(a=>ax[a]); if(!xs.length) return [M, W-M]; return [Math.min(...xs)-maxAW/2-16, Math.max(...xs)+maxAW/2+16]; };
for(const b of blocks){
  const [xL,xR]=involvedX(b); const yT=yOf(b.start)-30, yB=yOf(b.end)+26;
  R(xL,yT,xR-xL,yB-yT,{stroke:S.frame,fill:'none',sw:1.4,ss:'dashed',rough:0});
  // 标签 tab
  const tag=b.kind+(b.label?' ':''); const tw=(b.kind.length+ (b.label?b.label.length:0))*8+24;
  R(xL,yT,Math.min(tw,120),22,{stroke:S.frame,fill:S.paper,sw:1.2,rough:0});
  T(xL+8,yT+3,`[${b.kind}] ${b.label}`.trim(),{align:'left',size:12,color:S.frame,w:200});
  for(const el of b.elses){ const y=yOf(el.at)-18; Ln([[xL,y],[xR,y]],{stroke:S.frame,fill:'none',sw:1.2,ss:'dashed',rough:0}); T(xL+10,y+2,`[else] ${el.label}`.trim(),{align:'left',size:12,color:S.frame,w:160}); }
}

// ---------- 生命线 ----------
for(const a of actors) Ln([[ax[a.id],headerBottom],[ax[a.id],bottomY]],{stroke:S.life,fill:'none',sw:1.4,ss:'dashed',rough:0});

// ---------- 激活条 ----------
const actStack={}; const acts=[];
events.forEach((e,i)=>{ if(e.kind!=='msg') return;
  if(e.act===1){ (actStack[e.to]??=[]).push(yOf(i)); }
  if(e.act===-1){ const st=(actStack[e.from]||[]).pop(); if(st!=null) acts.push([e.from,st,yOf(i)]); }
});
for(const a in actStack) actStack[a].forEach(st=>acts.push([a,st,bottomY-20]));
for(const [a,y0,y1] of acts) R(ax[a]-6,y0,12,Math.max(y1-y0,16),{stroke:S.activation.stroke,fill:S.activation.fill,sw:1.4});

// ---------- 消息 ----------
events.forEach((e,i)=>{ if(e.kind!=='msg') return; const y=yOf(i);
  const head = e.head==='sync'?'triangle' : e.head==='cross'?'bar' : 'arrow';
  const ss = e.line==='dotted'?'dashed':'solid';
  if(e.from===e.to){ const x=ax[e.from];
    Ar([[x+6,y-8],[x+SELFW,y-8],[x+SELFW,y+12],[x+8,y+12]],{stroke:INKC,fill:'none',sw:S.sw,ss,head});
    if(e.text) T(x+SELFW+8,y-6,e.text,{align:'left',size:14,w:e.text.length*9});
  } else { const x1=ax[e.from],x2=ax[e.to];
    Ar([[x1,y],[x2,y]],{stroke:INKC,fill:'none',sw:S.sw,ss,head});
    if(e.text) label((x1+x2)/2, y-16, e.text, {w:Math.abs(x2-x1)-20, size:14});
  }
});

// ---------- note ----------
events.forEach((e,i)=>{ if(e.kind!=='note') return; const y=yOf(i);
  const xs=e.actors.map(a=>ax[a]); let cx,w;
  if(e.pos==='over'){ cx=(Math.min(...xs)+Math.max(...xs))/2; w=(e.actors.length>1? Math.max(...xs)-Math.min(...xs):0)+Math.max(120,String(e.text).length*9); }
  else { cx = xs[0] + (e.pos==='right'? maxAW/2+70 : -(maxAW/2+70)); w=Math.max(110,String(e.text).length*9); }
  const lines=String(e.text).split('\n'); const h=lines.length*20+18;
  R(cx-w/2,y-h/2,w,h,{stroke:S.note.stroke,fill:S.note.fill,sw:1.5,fs:S.fs});
  label(cx,y,e.text,{w,size:13});
});

// ---------- actor 头框（最上层） ----------
for(const a of actors){ const w=aw[a.id], x=ax[a.id]-w/2;
  R(x,M,w,ACTORH,{stroke:S.actor.stroke,fill:S.actor.fill,sw:S.sw},true);
  label(ax[a.id], M+ACTORH/2, a.label, {w, size:15});
}

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:S.paper,gridSize:20}};
fs.writeFileSync(process.argv[3],JSON.stringify(doc,null,2));
console.log(`sequence: ${actors.length} actors, ${events.length} events, ${blocks.length} blocks, style=${STYLE_NAME} → ${process.argv[3]}`);
