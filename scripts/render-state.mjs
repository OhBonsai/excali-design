import fs from 'fs';
import { parseState } from './mermaid-state.mjs';
// renderState —— 状态机专用：复用分层布局+正交路由，状态圆角框/初末态圆点/choice菱形/fork-join 条
// 用法：node render-state.mjs <input.mmd|ir.json> <out.excalidraw> [style]

const INK='#1e1e1e', GRAY='#868e96';
const STYLES = {
  'classic-tricolor': { paper:'#ffffff', sw:1.8, rough:1, fs:'solid', ink:INK, dot:INK,
    fill:(t)=> t==='state'?'#e7f5ff' : t==='choice'?'#a5d8ff' : 'transparent' },
  'hachure-classic': { paper:'#ffffff', sw:1.6, rough:1, fs:'hachure', ink:INK, dot:INK,
    fill:(t)=> t==='state'?'#a5d8ff' : t==='choice'?'#69db7c' : 'transparent' },
  'pastel-journal': { paper:'#fdf6e3', sw:2.4, rough:1.4, fs:'solid', ink:'#2b2b2b', dot:'#2b2b2b',
    fill:(t)=> t==='state'?'#ffd9a8' : t==='choice'?'#a5d8ff' : 'transparent' },
  'duotone-hachure': { paper:'#ffffff', sw:2, rough:1, fs:'hachure', ink:'#7048e8', dot:'#7048e8',
    fill:(t)=> (t==='state'||t==='choice')?'#eadcff':'transparent' },
};

const _in=process.argv[2], _raw=fs.readFileSync(_in,'utf8');
const IR = (/\.(mmd|mermaid)$/i.test(_in) || /^\s*stateDiagram/i.test(_raw)) ? parseState(_raw) : JSON.parse(_raw);
const STYLE_NAME = process.argv[4] || IR.style || 'classic-tricolor';
const S = STYLES[STYLE_NAME] || STYLES['classic-tricolor'];
const INKC=S.ink, DIR = IR.direction || 'TD';

// ---------- 尺寸 ----------
const CHAR=9.2, LINEH=22, MINW=110, MINH=52;
function sizeOf(n){
  const lines=String(n.label||'').split('\n');
  if(n.type==='initial'||n.type==='final') return {w:30,h:30,_lines:['']};
  if(n.type==='fork'||n.type==='join')     return {w:Math.max(90,(n.label||'').length*CHAR+30),h:16,_lines:['']};
  let w=Math.max(MINW, Math.max(...lines.map(l=>l.length))*CHAR+44), h=Math.max(MINH, lines.length*LINEH+28);
  if(n.type==='choice'){ w=Math.max(64,w*0.7); h=64; }
  return {w,h,_lines:lines};
}
const nodes=Object.fromEntries(IR.nodes.map(n=>[n.id,{...n,...sizeOf(n)}]));
const ids=IR.nodes.map(n=>n.id);
const edges=IR.edges;
const pw=i=> DIR==='TD'?nodes[i].w:nodes[i].h;

// ---------- 回边 + rank（同 flowchart） ----------
const out={},inc={}; ids.forEach(i=>{out[i]=[];inc[i]=[];});
for(const e of edges){ out[e.from].push(e); inc[e.to].push(e); }
const back=new Set(); { const st=new Set(),seen=new Set();
  const dfs=u=>{ seen.add(u);st.add(u); for(const e of out[u]){ if(st.has(e.to))back.add(e); else if(!seen.has(e.to))dfs(e.to);} st.delete(u); };
  for(const i of ids) if(!seen.has(i)) dfs(i);
}
const fwd=edges.filter(e=>!back.has(e));
const rank={}; ids.forEach(i=>rank[i]=0);
for(let g=0,ch=1; ch&&g<999; g++){ ch=0; for(const e of fwd){ if(rank[e.to]<rank[e.from]+1){ rank[e.to]=rank[e.from]+1; ch=1; } } }
const ranks={}; ids.forEach(i=>(ranks[rank[i]]??=[]).push(i));
const rkeys=Object.keys(ranks).map(Number).sort((a,b)=>a-b);
const oidx={}; rkeys.forEach(rk=>ranks[rk].forEach((id,k)=>oidx[id]=k));
for(let p=0;p<6;p++){ const down=p%2===0,seq=down?rkeys:[...rkeys].reverse();
  for(const rk of seq){ const arr=ranks[rk];
    const key=id=>{ const nb=(down?inc[id]:out[id]).filter(e=>!back.has(e)).map(e=>down?e.from:e.to); return nb.length?nb.reduce((s,n)=>s+oidx[n],0)/nb.length:oidx[id]; };
    arr.sort((a,b)=>key(a)-key(b)); arr.forEach((id,k)=>oidx[id]=k);
  }
}
const RANKSEP=86, NODESEP=56;
const along={},cross={}; const alongStep=Math.max(...ids.map(i=>DIR==='TD'?nodes[i].h:nodes[i].w))+RANKSEP;
ids.forEach(i=>along[i]=rank[i]*alongStep);
rkeys.forEach(rk=>{ let pos=0; ranks[rk].forEach(i=>{ cross[i]=pos+pw(i)/2; pos+=pw(i)+NODESEP; }); });
for(let pass=0;pass<12;pass++){ const seq=pass%2?rkeys:[...rkeys].reverse();
  for(const rk of seq){ const arr=ranks[rk];
    for(const i of arr){ const nb=[]; for(const e of fwd){ if(e.to===i)nb.push(cross[e.from]); if(e.from===i)nb.push(cross[e.to]); } if(nb.length)cross[i]=nb.reduce((s,x)=>s+x,0)/nb.length; }
    for(let k=1;k<arr.length;k++){ const a=arr[k-1],b=arr[k]; const mn=cross[a]+pw(a)/2+NODESEP+pw(b)/2; if(cross[b]<mn)cross[b]=mn; }
  }
}
ids.forEach(i=>{ if(DIR==='TD'){nodes[i].cx=cross[i];nodes[i].cy=along[i];}else{nodes[i].cx=along[i];nodes[i].cy=cross[i];} });
const M=70, minx=Math.min(...ids.map(i=>nodes[i].cx-nodes[i].w/2)), miny=Math.min(...ids.map(i=>nodes[i].cy-nodes[i].h/2));
ids.forEach(i=>{ nodes[i].cx+=M-minx; nodes[i].cy+=M-miny; });
const maxx=Math.max(...ids.map(i=>nodes[i].cx+nodes[i].w/2)), maxy=Math.max(...ids.map(i=>nodes[i].cy+nodes[i].h/2));

// ---------- 原语 ----------
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=o=>({angle:0,strokeColor:o.stroke??INKC,backgroundColor:o.fill==='none'?'transparent':(o.fill??'transparent'),fillStyle:o.fs??S.fs,strokeWidth:o.sw??S.sw,strokeStyle:o.ss??'solid',roughness:o.rough??S.rough,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={},round)=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:round?{type:3}:null,...base(o)});
const Dm=(x,y,w,h,o={})=>els.push({type:'diamond',id:id('d'),x,y,width:w,height:h,roundness:null,...base(o)});
const El=(x,y,w,h,o={})=>els.push({type:'ellipse',id:id('e'),x,y,width:w,height:h,...base(o)});
const Ar=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'arrow',id:id('a'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,startArrowhead:null,endArrowhead:'arrow',...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??15)*0.6,height:(o.size??15)+6,angle:0,text:t,fontSize:o.size??15,fontFamily:2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INKC,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});

els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:maxx+M,height:maxy+M,angle:0,strokeColor:'transparent',backgroundColor:S.paper,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});

// ---------- 路由 ----------
const port=(n,s)=>({t:[n.cx,n.cy-n.h/2],b:[n.cx,n.cy+n.h/2],l:[n.cx-n.w/2,n.cy],r:[n.cx+n.w/2,n.cy]}[s]);
function placeLabel(pts,text){ let best=-1,bi=0; for(let i=0;i<pts.length-1;i++){const L=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]); if(L>best){best=L;bi=i;}}
  const a=pts[bi],b=pts[bi+1],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,horiz=Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1]);
  if(horiz) T(mx-text.length*4,my-20,text,{align:'left',size:13,color:INKC,w:text.length*9}); else T(mx+9,my-9,text,{align:'left',size:13,color:INKC,w:text.length*9}); }
function draw(pts,label){ Ar(pts,{stroke:INKC,fill:'none',sw:S.sw,rough:1}); if(label)placeLabel(pts,label); }
function routeFwd(e){ const u=nodes[e.from],v=nodes[e.to]; let pts;
  if(DIR==='TD'){ if(Math.abs(u.cx-v.cx)<3)pts=[port(u,'b'),port(v,'t')]; else{const my=(u.cy+u.h/2+v.cy-v.h/2)/2,s=port(u,'b'),t=port(v,'t');pts=[s,[s[0],my],[t[0],my],t];} }
  else { if(Math.abs(u.cy-v.cy)<3)pts=[port(u,'r'),port(v,'l')]; else{const mx=(u.cx+u.w/2+v.cx-v.w/2)/2,s=port(u,'r'),t=port(v,'l');pts=[s,[mx,s[1]],[mx,t[1]],t];} }
  draw(pts,e.label); }
function routeBack(e){ const u=nodes[e.from],v=nodes[e.to],lo=Math.min(rank[e.from],rank[e.to]),hi=Math.max(rank[e.from],rank[e.to]),span=ids.filter(i=>rank[i]>=lo&&rank[i]<=hi); let pts;
  if(DIR==='TD'){const cor=Math.min(...span.map(i=>nodes[i].cx-nodes[i].w/2))-34,s=port(u,'l'),t=port(v,'l');pts=[s,[cor,s[1]],[cor,t[1]],t];}
  else{const cor=Math.min(...span.map(i=>nodes[i].cy-nodes[i].h/2))-34,s=port(u,'t'),t=port(v,'t');pts=[s,[s[0],cor],[t[0],cor],t];}
  draw(pts,e.label); }

// ---------- 节点 ----------
function drawNode(n){ const {cx,cy,w,h}=n,x=cx-w/2,y=cy-h/2, fill=S.fill?S.fill(n.type):'transparent';
  switch(n.type){
    case 'initial': El(cx-11,cy-11,22,22,{fill:S.dot,stroke:S.dot,fs:'solid'}); break;
    case 'final': El(cx-13,cy-13,26,26,{fill:'none'}); El(cx-7,cy-7,14,14,{fill:S.dot,stroke:S.dot,fs:'solid'}); break;
    case 'choice': Dm(x,y,w,h,{fill}); break;
    case 'fork': case 'join': R(x,cy-7,w,14,{fill:S.dot,stroke:S.dot,fs:'solid',sw:1}); break;
    default: R(x,y,w,h,{fill},true);
  }
  if(n._lines&&n._lines[0]){ const L=n._lines,tot=L.length*LINEH; L.forEach((ln,k)=>T(cx-w/2,cy-tot/2+k*LINEH+3,ln,{w,align:'center',size:15})); }
}

for(const e of edges)(back.has(e)?routeBack:routeFwd)(e);
ids.forEach(i=>drawNode(nodes[i]));

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:S.paper,gridSize:20}};
fs.writeFileSync(process.argv[3],JSON.stringify(doc,null,2));
console.log(`state: ${ids.length} states, ${edges.length} transitions (${back.size} back), style=${STYLE_NAME}, dir=${DIR} → ${process.argv[3]}`);
