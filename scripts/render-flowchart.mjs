import fs from 'fs';
import { parseMermaid } from './mermaid-to-case.mjs';
// renderFlowchart v2 —— flowchart 专用渲染器
// data → layered布局(重心排序+对齐松弛/泳道) → 正交路由(分支标签离线+就近回边) → role→shape→color → STYLE → excalidraw
// 用法：node render-flowchart.mjs <case.json> <out.excalidraw> [style]
//   case.json: { direction:'TD'|'LR', style?, legend?:true, lanes?:["INPUT",...],
//                nodes:[{id,label,type,lane?}], edges:[{from,to,label?}] }
//   type: start|end|process|decision|io|data|document|manual|preparation|subroutine|connector

const INK='#1e1e1e';
const STYLES = {
  'classic-tricolor': { paper:'#ffffff', sw:1.8, rough:1, fs:'solid', ss:'solid',
    role:{ start:{stroke:'#2f9e44',fill:'#ebfbee'}, end:{stroke:'#2f9e44',fill:'#ebfbee'}, decision:{stroke:'#1971c2',fill:'#a5d8ff'} },
    fill:(t)=> t==='process'?'#e7f5ff':'transparent' },
  'hachure-classic': { paper:'#ffffff', sw:1.6, rough:1, fs:'hachure', ss:'solid',
    fill:(t)=>({process:'#74c0fc',decision:'#69db7c',start:'#ff8787',end:'#ff8787'}[t]||'#adb5bd') },
  'pastel-journal': { paper:'#fdf6e3', sw:2.4, rough:1.4, fs:'solid', ss:'solid', catfill:true },
  'duotone-hachure': { paper:'#ffffff', sw:2, rough:1, fs:'hachure', ss:'solid', stroke:'#7048e8', fill:()=>'#eadcff' },
};
const CAT={ proc:'#ffd9a8', ctrl:'#d4ee9f', deci:'#a5d8ff', doc:'#e6dcf7', data:'#9fe8d6', conn:'#b6e59a', se:'#c3ebb0' };
const TYPE2CAT={ process:'proc',subroutine:'proc',preparation:'proc',manual:'proc',io:'proc',
  decision:'deci', data:'data', document:'doc', connector:'conn', start:'se', end:'se' };
const CAT_LABEL={ proc:'Process', deci:'Decision', doc:'Document / Output', data:'Database', conn:'Connector', se:'Start / End' };

const _in=process.argv[2], _raw=fs.readFileSync(_in,'utf8');
const CASE = (/\.(mmd|mermaid)$/i.test(_in) || /^\s*(flowchart|graph)\s/i.test(_raw)) ? parseMermaid(_raw) : JSON.parse(_raw);
const STYLE_NAME = process.argv[4] || CASE.style || 'classic-tricolor';
const S = STYLES[STYLE_NAME] || STYLES['classic-tricolor'];
const DIR = CASE.direction || 'TD';
const LANES = (CASE.lanes && CASE.lanes.length) ? CASE.lanes : null;

// ---------- 节点尺寸 ----------
const CHAR=9.2, LINEH=22, PADX=26, PADY=20, MINW=120, MINH=56;
function sizeOf(n){
  const lines=String(n.label).split('\n');
  let w=Math.max(MINW, Math.max(...lines.map(l=>l.length))*CHAR+PADX*2);
  let h=Math.max(MINH, lines.length*LINEH+PADY*2);
  if(n.type==='decision'){ w*=1.25; h=Math.max(h,76); }
  if(n.type==='start'||n.type==='end'){ w=Math.max(MINW, lines[0].length*CHAR+PADX*2); }
  if(n.type==='connector'){ w=h=46; }
  return {w,h,_lines:lines};
}
const nodes=Object.fromEntries(CASE.nodes.map(n=>[n.id,{...n,...sizeOf(n)}]));
const ids=CASE.nodes.map(n=>n.id);
const pw=i=> DIR==='TD'?nodes[i].w:nodes[i].h;   // 垂直于主方向的尺寸

// ---------- 邻接 + 回边检测 ----------
const out={}, inc={}; ids.forEach(i=>{out[i]=[];inc[i]=[];});
for(const e of CASE.edges){ out[e.from].push(e); inc[e.to].push(e); }
const back=new Set(); { const onstack=new Set(), seen=new Set();
  const dfs=u=>{ seen.add(u); onstack.add(u);
    for(const e of out[u]){ if(onstack.has(e.to)) back.add(e); else if(!seen.has(e.to)) dfs(e.to); } onstack.delete(u); };
  for(const i of ids) if(!seen.has(i)) dfs(i);
}
const fwd=CASE.edges.filter(e=>!back.has(e));

// ---------- rank（最长路径） ----------
const rank={}; ids.forEach(i=>rank[i]=0);
for(let g=0,ch=true; ch&&g<999; g++){ ch=false; for(const e of fwd){ if(rank[e.to]<rank[e.from]+1){ rank[e.to]=rank[e.from]+1; ch=true; } } }
const ranks={}; ids.forEach(i=>(ranks[rank[i]]??=[]).push(i));
const rkeys=Object.keys(ranks).map(Number).sort((a,b)=>a-b);

// ---------- 同 rank 重心排序 ----------
const oidx={}; rkeys.forEach(rk=>ranks[rk].forEach((id,k)=>oidx[id]=k));
for(let p=0;p<6;p++){ const down=p%2===0; const seq=down?rkeys:[...rkeys].reverse();
  for(const rk of seq){ const arr=ranks[rk];
    const key=id=>{ const nb=(down?inc[id]:out[id]).filter(e=>!back.has(e)).map(e=>down?e.from:e.to); return nb.length? nb.reduce((s,n)=>s+oidx[n],0)/nb.length : oidx[id]; };
    arr.sort((a,b)=>key(a)-key(b)); arr.forEach((id,k)=>oidx[id]=k);
  }
}

// ---------- 坐标 ----------
const RANKSEP=92, NODESEP=58;
const along={}, cross={};
const alongStep=Math.max(...ids.map(i=>DIR==='TD'?nodes[i].h:nodes[i].w))+RANKSEP;
ids.forEach(i=>along[i]=rank[i]*alongStep);

let laneInfo=null;
if(LANES){
  const laneW=Math.max(...ids.map(pw))+150;
  const center={}; LANES.forEach((ln,k)=>center[ln]=k*laneW);
  const bucket={}; ids.forEach(i=>{ const ln=nodes[i].lane||LANES[0]; (bucket[ln+'@'+rank[i]]??=[]).push(i); });
  Object.values(bucket).forEach(arr=>arr.forEach((i,k)=>{ const ln=nodes[i].lane||LANES[0]; cross[i]=center[ln]+(k-(arr.length-1)/2)*(pw(i)+NODESEP); }));
  laneInfo={names:LANES,center,laneW};
} else {
  rkeys.forEach(rk=>{ let pos=0; ranks[rk].forEach(i=>{ cross[i]=pos+pw(i)/2; pos+=pw(i)+NODESEP; }); });
  for(let pass=0;pass<12;pass++){ const seq=pass%2?rkeys:[...rkeys].reverse();
    for(const rk of seq){ const arr=ranks[rk];
      for(const i of arr){ const nb=[]; for(const e of fwd){ if(e.to===i)nb.push(cross[e.from]); if(e.from===i)nb.push(cross[e.to]); } if(nb.length) cross[i]=nb.reduce((s,x)=>s+x,0)/nb.length; }
      for(let k=1;k<arr.length;k++){ const a=arr[k-1],b=arr[k]; const mn=cross[a]+pw(a)/2+NODESEP+pw(b)/2; if(cross[b]<mn)cross[b]=mn; }
    }
  }
}
ids.forEach(i=>{ if(DIR==='TD'){ nodes[i].cx=cross[i]; nodes[i].cy=along[i]; } else { nodes[i].cx=along[i]; nodes[i].cy=cross[i]; } });
// 平移到正区间
const M=80;
const minx=Math.min(...ids.map(i=>nodes[i].cx-nodes[i].w/2)), miny=Math.min(...ids.map(i=>nodes[i].cy-nodes[i].h/2));
const dx=M-minx+ (LANES?60:0), dy=M-miny+(LANES?40:0);
ids.forEach(i=>{ nodes[i].cx+=dx; nodes[i].cy+=dy; });
let maxx=Math.max(...ids.map(i=>nodes[i].cx+nodes[i].w/2)), maxy=Math.max(...ids.map(i=>nodes[i].cy+nodes[i].h/2));
const legendOn = CASE.legend===true;
const canvasW=maxx+M+(LANES?60:0), canvasH=maxy+M+(legendOn?170:0);

// ---------- 渲染原语 ----------
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
function styleFor(type){
  let stroke=S.stroke||INK, fill='transparent';
  if(S.catfill) fill=CAT[TYPE2CAT[type]]||'#eee';
  else if(S.role&&S.role[type]){ stroke=S.role[type].stroke; fill=S.role[type].fill; }
  else if(S.fill) fill=S.fill(type);
  return {stroke,fill,fs:S.fs,sw:S.sw,ss:S.ss,rough:S.rough};
}
const base=o=>({angle:0,strokeColor:o.stroke,backgroundColor:o.fill==='none'?'transparent':o.fill,fillStyle:o.fs,strokeWidth:o.sw,strokeStyle:o.ss||'solid',roughness:o.rough,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o,round)=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:round?{type:3}:null,...base(o)});
const Dm=(x,y,w,h,o)=>els.push({type:'diamond',id:id('d'),x,y,width:w,height:h,roundness:null,...base(o)});
const El=(x,y,w,h,o)=>els.push({type:'ellipse',id:id('e'),x,y,width:w,height:h,...base(o)});
const Ln=(pts,o,round)=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:round?{type:2}:null,...base(o)});};
const Ar=(pts,o)=>{const x=pts[0][0],y=pts[0][1];els.push({type:'arrow',id:id('a'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,startArrowhead:null,endArrowhead:'arrow',...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??16)*0.6,height:(o.size??16)+6,angle:0,text:t,fontSize:o.size??16,fontFamily:o.ff??2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
const closed=p=>p.concat([p[0]]);
const poly=(cx,cy,w,h,rel,o)=>Ln(closed(rel.map(([a,b])=>[cx-w/2+a*w,cy-h/2+b*h])),o);
const arc=(cx,cy,rx,ry,a0,a1,n=10)=>{const p=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;p.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}return p;};

// bg
els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:canvasW,height:canvasH,angle:0,strokeColor:'transparent',backgroundColor:S.paper,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});

// 泳道分隔 + 标题（在节点下层）
if(LANES){
  const axis=i=>DIR==='TD'?nodes[i].cx:nodes[i].cy;
  const laneCenters=LANES.map(ln=>{ const mem=ids.filter(i=>(nodes[i].lane||LANES[0])===ln); return {ln,c:mem.reduce((s,i)=>s+axis(i),0)/mem.length}; }).sort((a,b)=>a.c-b.c);
  for(let k=0;k<laneCenters.length-1;k++){ const mid=(laneCenters[k].c+laneCenters[k+1].c)/2;
    if(DIR==='TD') Ln([[mid,40],[mid,canvasH-40]],{stroke:'#adb5bd',fill:'none',fs:'solid',sw:1.5,ss:'dashed',rough:0});
    else Ln([[40,mid],[canvasW-40,mid]],{stroke:'#adb5bd',fill:'none',fs:'solid',sw:1.5,ss:'dashed',rough:0});
  }
  laneCenters.forEach(({ln,c})=>{ if(DIR==='TD') T(c-ln.length*7,30,ln.toUpperCase(),{align:'center',size:22,color:'#495057',w:ln.length*14}); else T(20,c-12,ln.toUpperCase(),{align:'left',size:20,color:'#495057'}); });
}

// ---------- 路由 ----------
const EC=S.stroke||INK;
const port=(n,s)=>({t:[n.cx,n.cy-n.h/2],b:[n.cx,n.cy+n.h/2],l:[n.cx-n.w/2,n.cy],r:[n.cx+n.w/2,n.cy]}[s]);
function placeLabel(pts,text){
  let best=-1,bi=0; for(let i=0;i<pts.length-1;i++){ const L=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]); if(L>best){best=L;bi=i;} }
  const a=pts[bi],b=pts[bi+1], mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
  const horiz=Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1]);
  if(horiz) T(mx-text.length*4.2,my-22,text,{align:'left',size:14,color:EC,w:text.length*9});
  else      T(mx+10,my-9,text,{align:'left',size:14,color:EC,w:text.length*9});
}
function draw(pts,label){ Ar(pts,{stroke:EC,fill:'none',fs:'solid',sw:S.sw,ss:'solid',rough:1}); if(label)placeLabel(pts,label); }
function routeFwd(e){ const u=nodes[e.from],v=nodes[e.to]; let pts;
  if(DIR==='TD'){ if(Math.abs(u.cx-v.cx)<3) pts=[port(u,'b'),port(v,'t')]; else { const my=(u.cy+u.h/2+v.cy-v.h/2)/2,s=port(u,'b'),t=port(v,'t'); pts=[s,[s[0],my],[t[0],my],t]; } }
  else { if(Math.abs(u.cy-v.cy)<3) pts=[port(u,'r'),port(v,'l')]; else { const mx=(u.cx+u.w/2+v.cx-v.w/2)/2,s=port(u,'r'),t=port(v,'l'); pts=[s,[mx,s[1]],[mx,t[1]],t]; } }
  draw(pts,e.label);
}
function routeBack(e){ const u=nodes[e.from],v=nodes[e.to];
  const lo=Math.min(rank[e.from],rank[e.to]),hi=Math.max(rank[e.from],rank[e.to]);
  const span=ids.filter(i=>rank[i]>=lo&&rank[i]<=hi); let pts;
  if(DIR==='TD'){ const cor=Math.min(...span.map(i=>nodes[i].cx-nodes[i].w/2))-34, s=port(u,'l'),t=port(v,'l'); pts=[s,[cor,s[1]],[cor,t[1]],t]; }
  else { const cor=Math.min(...span.map(i=>nodes[i].cy-nodes[i].h/2))-34, s=port(u,'t'),t=port(v,'t'); pts=[s,[s[0],cor],[t[0],cor],t]; }
  draw(pts,e.label);
}

// ---------- 节点 ----------
function drawNode(n){ const o=styleFor(n.type),{cx,cy,w,h}=n,x=cx-w/2,y=cy-h/2,oN={...o,fill:'none'};
  switch(n.type){
    case 'start': case 'end': R(x+8,y,w-16,h,o,true); break;
    case 'process': R(x,y,w,h,o); break;
    case 'subroutine': R(x,y,w,h,o); Ln([[x+12,y],[x+12,y+h]],oN); Ln([[x+w-12,y],[x+w-12,y+h]],oN); break;
    case 'decision': Dm(x,y,w,h,o); break;
    case 'io': poly(cx,cy,w,h,[[.16,0],[1,0],[.84,1],[0,1]],o); break;
    case 'manual': poly(cx,cy,w,h,[[.12,0],[.88,0],[1,1],[0,1]],o); break;
    case 'preparation': poly(cx,cy,w,h,[[.16,0],[.84,0],[1,.5],[.84,1],[.16,1],[0,.5]],o); break;
    case 'data': El(x,y,w,h*.32,o); Ln([[x,y+h*.16],[x,y+h-h*.16]],oN); Ln([[x+w,y+h*.16],[x+w,y+h-h*.16]],oN); Ln(arc(cx,y+h-h*.16,w/2,h*.16,0,Math.PI,10),oN); break;
    case 'document': Ln(closed([[x,y],[x+w,y],[x+w,y+h*.82],[x+w*.66,y+h],[x+w*.33,y+h*.74],[x,y+h]]),o,true); break;
    case 'connector': El(x,y,w,h,o); break;
    default: R(x,y,w,h,o);
  }
  const L=n._lines,tot=L.length*LINEH; L.forEach((ln,k)=>T(cx-w/2,cy-tot/2+k*LINEH+3,ln,{w,align:'center',size:16}));
}

for(const e of CASE.edges) (back.has(e)?routeBack:routeFwd)(e);
ids.forEach(i=>drawNode(nodes[i]));

// ---------- 图例 ----------
if(legendOn){
  const present=[...new Set(ids.map(i=>TYPE2CAT[nodes[i].type]).filter(Boolean))];
  let lx=M, ly=maxy+M-10;
  present.forEach(c=>{ const col=S.catfill?CAT[c]:(c==='deci'?'#a5d8ff':c==='se'?'#ebfbee':c==='proc'?'#e7f5ff':'#f1f3f5');
    R(lx,ly,30,22,{stroke:INK,fill:col,fs:S.catfill?'solid':'solid',sw:1.6,ss:'solid',rough:1},true);
    T(lx+40,ly+2,CAT_LABEL[c],{align:'left',size:15,w:200}); lx+=200; });
}

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:S.paper,gridSize:20}};
fs.writeFileSync(process.argv[3],JSON.stringify(doc,null,2));
console.log(`flowchart: ${ids.length} nodes, ${CASE.edges.length} edges (${back.size} back), lanes=${LANES?LANES.length:0}, style=${STYLE_NAME}, dir=${DIR} → ${process.argv[3]}`);
