import fs from 'fs';
import { parseClass } from './mermaid-class.mjs';
// renderClass —— 类图专用：复用分层布局，三栏类框 + 手工 UML 标记（svg-export 不支持原生箭头头，故标记全手画）
// 用法：node render-class.mjs <input.mmd|ir.json> <out.excalidraw> [style]

const INK='#1e1e1e', GRAY='#868e96';
const STYLES = {
  'classic-tricolor': { paper:'#ffffff', sw:1.7, rough:1, fs:'solid', ink:INK, title:'#a5d8ff', body:'#ffffff' },
  'hachure-classic':  { paper:'#ffffff', sw:1.5, rough:1, fs:'hachure', ink:INK, title:'#a5d8ff', body:'#ffffff' },
  'pastel-journal':   { paper:'#fdf6e3', sw:2.1, rough:1.3, fs:'solid', ink:'#2b2b2b', title:'#ffd9a8', body:'#fffdf6' },
  'duotone-hachure':  { paper:'#ffffff', sw:1.9, rough:1, fs:'hachure', ink:'#7048e8', title:'#eadcff', body:'#ffffff' },
};
const _in=process.argv[2], _raw=fs.readFileSync(_in,'utf8');
const IR = (/\.(mmd|mermaid)$/i.test(_in) || /^\s*classDiagram/i.test(_raw)) ? parseClass(_raw) : JSON.parse(_raw);
const S = STYLES[process.argv[4]||IR.style||'classic-tricolor'] || STYLES['classic-tricolor'];
const INKC=S.ink, DIR=IR.direction||'TD';

// ---------- 尺寸 ----------
const CW=8.6, LINEH=22, TITLEH=30, PAD=14;
function sizeOf(n){
  const all=[n.label, ...(n.stereotype?['«'+n.stereotype+'»']:[]), ...n.attrs, ...n.methods];
  const w=Math.max(130, Math.max(...all.map(s=>String(s).length))*CW+PAD*2);
  const th=TITLEH+(n.stereotype?18:0);
  const ah=n.attrs.length?n.attrs.length*LINEH+10:14;
  const mh=n.methods.length?n.methods.length*LINEH+10:14;
  return {w,h:th+ah+mh,_th:th,_ah:ah,_mh:mh};
}
const nodes=Object.fromEntries(IR.nodes.map(n=>[n.id,{...n,...sizeOf(n)}]));
const ids=IR.nodes.map(n=>n.id); const edges=IR.edges;
const pw=i=>DIR==='TD'?nodes[i].w:nodes[i].h;

// ---------- 回边 + 分层（复用） ----------
const out={},inc={}; ids.forEach(i=>{out[i]=[];inc[i]=[];});
for(const e of edges){ if(nodes[e.from]&&nodes[e.to]){ out[e.from].push(e); inc[e.to].push(e); } }
const back=new Set(); { const st=new Set(),seen=new Set(); const dfs=u=>{seen.add(u);st.add(u);for(const e of out[u]){if(st.has(e.to))back.add(e);else if(!seen.has(e.to))dfs(e.to);}st.delete(u);}; for(const i of ids)if(!seen.has(i))dfs(i); }
const fwd=edges.filter(e=>!back.has(e));
const rank={}; ids.forEach(i=>rank[i]=0);
for(let g=0,ch=1;ch&&g<999;g++){ch=0;for(const e of fwd){if(nodes[e.from]&&rank[e.to]<rank[e.from]+1){rank[e.to]=rank[e.from]+1;ch=1;}}}
const ranks={}; ids.forEach(i=>(ranks[rank[i]]??=[]).push(i));
const rkeys=Object.keys(ranks).map(Number).sort((a,b)=>a-b);
const oidx={}; rkeys.forEach(rk=>ranks[rk].forEach((id,k)=>oidx[id]=k));
for(let p=0;p<6;p++){const down=p%2===0,seq=down?rkeys:[...rkeys].reverse();for(const rk of seq){const arr=ranks[rk];const key=id=>{const nb=(down?inc[id]:out[id]).filter(e=>!back.has(e)).map(e=>down?e.from:e.to);return nb.length?nb.reduce((s,n)=>s+oidx[n],0)/nb.length:oidx[id];};arr.sort((a,b)=>key(a)-key(b));arr.forEach((id,k)=>oidx[id]=k);}}
const RANKSEP=96,NODESEP=66;
const along={},cross={}; const alongStep=Math.max(...ids.map(i=>DIR==='TD'?nodes[i].h:nodes[i].w))+RANKSEP;
ids.forEach(i=>along[i]=rank[i]*alongStep);
rkeys.forEach(rk=>{let pos=0;ranks[rk].forEach(i=>{cross[i]=pos+pw(i)/2;pos+=pw(i)+NODESEP;});});
for(let pass=0;pass<12;pass++){const seq=pass%2?rkeys:[...rkeys].reverse();for(const rk of seq){const arr=ranks[rk];for(const i of arr){const nb=[];for(const e of fwd){if(e.to===i)nb.push(cross[e.from]);if(e.from===i)nb.push(cross[e.to]);}if(nb.length)cross[i]=nb.reduce((s,x)=>s+x,0)/nb.length;}for(let k=1;k<arr.length;k++){const a=arr[k-1],b=arr[k];const mn=cross[a]+pw(a)/2+NODESEP+pw(b)/2;if(cross[b]<mn)cross[b]=mn;}}}
ids.forEach(i=>{if(DIR==='TD'){nodes[i].cx=cross[i];nodes[i].cy=along[i];}else{nodes[i].cx=along[i];nodes[i].cy=cross[i];}});
const M=70,minx=Math.min(...ids.map(i=>nodes[i].cx-nodes[i].w/2)),miny=Math.min(...ids.map(i=>nodes[i].cy-nodes[i].h/2));
ids.forEach(i=>{nodes[i].cx+=M-minx;nodes[i].cy+=M-miny;});
const maxx=Math.max(...ids.map(i=>nodes[i].cx+nodes[i].w/2)),maxy=Math.max(...ids.map(i=>nodes[i].cy+nodes[i].h/2));

// ---------- 原语 ----------
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=o=>({angle:0,strokeColor:o.stroke??INKC,backgroundColor:o.fill==='none'?'transparent':(o.fill??'transparent'),fillStyle:o.fs??S.fs,strokeWidth:o.sw??S.sw,strokeStyle:o.ss??'solid',roughness:o.rough??S.rough,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={})=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:null,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??14)*0.6,height:(o.size??14)+6,angle:0,text:t,fontSize:o.size??14,fontFamily:o.ff??2,textAlign:o.align??'left',verticalAlign:'top',strokeColor:o.color??INKC,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:maxx+M,height:maxy+M,angle:0,strokeColor:'transparent',backgroundColor:S.paper,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});

// ---------- 手工 UML 标记 ----------
function marker(kind,P,nb){ if(!kind) return;
  let ix=P[0]-nb[0], iy=P[1]-nb[1]; const L0=Math.hypot(ix,iy)||1; ix/=L0; iy/=L0;   // into-box 单位向量
  const px=-iy, py=ix;  // 垂直
  const at=(d,s)=>[P[0]-ix*d+px*s, P[1]-iy*d+py*s];
  if(kind==='triangle'){ const L=16,W=9; Ln([P, at(L,W), at(L,-W), P], {fill:S.paper,fs:'solid',sw:S.sw}); }
  else if(kind==='diamondF'||kind==='diamondO'){ const L=11,W=7.5; Ln([P, at(L,W), at(2*L,0), at(L,-W), P], {fill:kind==='diamondF'?INKC:S.paper,fs:'solid',sw:S.sw}); }
  else if(kind==='arrow'){ const L=14,W=8; Ln([at(L,W),P],{fill:'none',sw:S.sw}); Ln([at(L,-W),P],{fill:'none',sw:S.sw}); }
}

// ---------- 路由（盒到盒，正交单肘） ----------
const port=(n,s)=>({t:[n.cx,n.cy-n.h/2],b:[n.cx,n.cy+n.h/2],l:[n.cx-n.w/2,n.cy],r:[n.cx+n.w/2,n.cy]}[s]);
function route(e){ const a=nodes[e.a], b=nodes[e.b]; if(!a||!b) return;
  const dx=b.cx-a.cx, dy=b.cy-a.cy; let pa,pb,pts;
  if(Math.abs(dy)>=Math.abs(dx)){ // 垂直为主
    if(dy>=0){ pa=port(a,'b'); pb=port(b,'t'); } else { pa=port(a,'t'); pb=port(b,'b'); }
    const my=(pa[1]+pb[1])/2; pts = Math.abs(pa[0]-pb[0])<3?[pa,pb]:[pa,[pa[0],my],[pb[0],my],pb];
  } else {
    if(dx>=0){ pa=port(a,'r'); pb=port(b,'l'); } else { pa=port(a,'l'); pb=port(b,'r'); }
    const mx=(pa[0]+pb[0])/2; pts = Math.abs(pa[1]-pb[1])<3?[pa,pb]:[pa,[mx,pa[1]],[mx,pb[1]],pb];
  }
  Ln(pts,{stroke:INKC,fill:'none',sw:S.sw,ss:e.line==='dashed'?'dashed':'solid'});
  marker(e.markerA, pts[0], pts[1]);
  marker(e.markerB, pts[pts.length-1], pts[pts.length-2]);
  if(e.cardA) T(pts[0][0]+8, pts[0][1]+4, e.cardA, {size:12,color:GRAY,w:40});
  if(e.cardB) T(pts[pts.length-1][0]+8, pts[pts.length-1][1]-16, e.cardB, {size:12,color:GRAY,w:40});
  if(e.label){ const mid=pts[Math.floor(pts.length/2)]; T(mid[0]+6, mid[1]-8, e.label, {size:12,color:GRAY,align:'left',w:e.label.length*8}); }
}

// ---------- 类框 ----------
function drawNode(n){ const x=n.cx-n.w/2, y=n.cy-n.h/2;
  R(x,y,n.w,n.h,{fill:S.body});                                   // 外框
  R(x,y,n.w,n._th,{fill:S.title});                                // 标题栏
  let ty=y+8; if(n.stereotype){ T(x,ty,'«'+n.stereotype+'»',{w:n.w,align:'center',size:12,color:GRAY}); ty+=18; }
  T(x,ty,n.label,{w:n.w,align:'center',size:15});
  let cy=y+n._th; Ln([[x,cy],[x+n.w,cy]],{sw:1.4});               // 分隔线1
  let ay=cy+6; n.attrs.forEach(a=>{ T(x+10,ay,a,{size:13.5,w:n.w-16}); ay+=LINEH; });
  cy+=n._ah; Ln([[x,cy],[x+n.w,cy]],{sw:1.4});                    // 分隔线2
  let my=cy+6; n.methods.forEach(mm=>{ T(x+10,my,mm,{size:13.5,w:n.w-16}); my+=LINEH; });
}

for(const e of edges) route(e);
ids.forEach(i=>drawNode(nodes[i]));

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:S.paper,gridSize:20}};
fs.writeFileSync(process.argv[3],JSON.stringify(doc,null,2));
console.log(`class: ${ids.length} classes, ${edges.length} relations, style=${process.argv[4]||IR.style||'classic-tricolor'} → ${process.argv[3]}`);
