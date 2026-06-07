import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseMindmap } from './mermaid-mindmap.mjs';
// renderMindmap —— 思维导图。三块美感程序化：
//   1) 大小：按 depth 分派形状 —— root=云形大字 / 一级=描边框+图标 / 内节点=描边框 / 叶子=无框文字+彩色下划线。
//   2) 图标：node.icon → drawlib 现成图元(Bulb/Check/Star/person…)缩放+平移+tint 到一级节点外侧。
//   3) 手绘线条：枝条画成「锥形带(taper ribbon)」—— 贝塞尔中心线 + 法向偏移，根粗梢细，
//      填充多边形 → svg-export 走 roughjs polygon，拿到真 taper + 手绘边。
// 布局两向(logical 横树 / radial 放射)，用法：
//   node render-mindmap.mjs <in.mmd|ir.json> <out.excalidraw> [style] [logical|radial]

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INK='#1e1e1e';
const PAL=[['#1971c2','#d0ebff'],['#2f9e44','#d3f9d8'],['#e8590c','#ffe8cc'],['#7048e8','#eadcff'],
           ['#0c8599','#c5f6fa'],['#c2255c','#ffdeeb'],['#5c940d','#e9fac8'],['#1864ab','#a5d8ff']];
const STYLES = {
  // 默认：pencil —— 单色墨线、干净 taper(低 roughness)、不追求颜色。对标干净手绘 mindmap。
  'pencil':           { paper:'#ffffff', sw:1.6, rough:0.5, brough:0.25, fs:'solid', ink:INK, root:{s:INK,f:'#ffffff',t:INK}, pal:[[INK,'#f1f3f5']] },
  'mono':             { paper:'#ffffff', sw:1.6, rough:0,   brough:0,    fs:'solid', ink:INK, root:{s:INK,f:'#ffffff',t:INK}, pal:[[INK,'#f1f3f5']] },
  'classic-tricolor': { paper:'#ffffff', sw:2.2, rough:1, fs:'solid', ink:INK, root:{s:'#343a40',f:'#ffffff',t:'#1e1e1e'}, pal:PAL },
  'hachure-classic':  { paper:'#ffffff', sw:2,   rough:1, fs:'hachure', ink:INK, root:{s:INK,f:'#ffffff',t:INK}, pal:PAL },
  'pastel-journal':   { paper:'#fdf6e3', sw:2.4, rough:1.3, fs:'solid', ink:'#2b2b2b', root:{s:'#2b2b2b',f:'#fffdf7',t:'#2b2b2b'},
                        pal:[['#c98a48','#ffe3c0'],['#5a8a4a','#dcecc8'],['#3f7d9a','#cfe6ef'],['#8a6fb0','#e6dcf7'],['#b06a8a','#f3dbe6'],['#7a8a3a','#eaf0c8'],['#c07a48','#ffe0c8'],['#4a7a8a','#d4e9ef']] },
  'duotone-hachure':  { paper:'#ffffff', sw:2, rough:1, fs:'hachure', ink:'#7048e8', root:{s:'#7048e8',f:'#ffffff',t:'#7048e8'},
                        pal:[['#7048e8','#eadcff']] },
};
const _in=process.argv[2], _raw=fs.readFileSync(_in,'utf8');
const ROOT = (/\.(mmd|mermaid)$/i.test(_in) || /^\s*mindmap\b/i.test(_raw)) ? parseMindmap(_raw) : JSON.parse(_raw);
const S = STYLES[process.argv[4]||ROOT.style||'pencil'] || STYLES['pencil'];
const LAYOUT = (process.argv[5]||ROOT.layout||'logical').toLowerCase();
const INKC=S.ink;

// ---------- 尺寸 ----------
const ROWH=50, HGAP=72, PADX=16;
const sizeOf=n=>{ const lines=String(n.label).split('\n'); const depth=n._depth||0;
  const fs=depth===0?24:depth===1?17:14;
  n._w=Math.max(46, Math.max(...lines.map(l=>l.length))*fs*0.6+(depth===0?PADX*3:PADX*2));
  n._h=Math.max(depth===0?60:32, lines.length*(fs+7)+(depth===0?22:12)); n._fs=fs; n._lines=lines; };
const isLeaf=n=>!n.children.length;

// ---------- 公共：depth / hue / 尺寸 / 叶子计数 ----------
let leafCount=0; const all=[];
(function walk(n,depth,hue,parent){ n._depth=depth; n._hue=hue; n._parent=parent; sizeOf(n); all.push(n);
  if(isLeaf(n)){ n._leaf=leafCount++; }
  n.children.forEach((c,i)=>walk(c,depth+1, depth===0?i:hue, n));
})(ROOT,0,-1,null);
const maxDepth=Math.max(...all.map(n=>n._depth));
const maxW={}; all.forEach(n=>{ maxW[n._depth]=Math.max(maxW[n._depth]||0, n._w); });

let maxx, maxy, CENTER=null;

if(LAYOUT==='radial'){
  (function ang(n){ if(isLeaf(n)){ n._ang=(n._leaf+0.5)/leafCount*2*Math.PI; return n._ang; }
    const cs=n.children.map(ang); n._ang=(cs[0]+cs[cs.length-1])/2; return n._ang; })(ROOT);
  const RGAP=78; const ringR={0:0};
  for(let d=1; d<=maxDepth; d++){ const prevHalf=d===1?ROOT._w/2:maxW[d-1]/2; ringR[d]=ringR[d-1]+prevHalf+maxW[d]/2+RGAP; }
  if(leafCount>1 && maxDepth>0){ const need=ROWH*leafCount/(2*Math.PI);
    if(ringR[maxDepth]<need){ const k=need/ringR[maxDepth]; for(let d=1;d<=maxDepth;d++) ringR[d]*=k; } }
  all.forEach(n=>{ n._rx=ringR[n._depth]*Math.cos(n._ang); n._ry=ringR[n._depth]*Math.sin(n._ang); });
  const M=90;
  const minx=Math.min(...all.map(n=>n._rx-n._w/2)), miny=Math.min(...all.map(n=>n._ry-n._h/2));
  const CX=M-minx, CY=M-miny; CENTER=[CX,CY];
  all.forEach(n=>{ n._cx=CX+n._rx; n._cy=CY+n._ry; });
  maxx=Math.max(...all.map(n=>n._cx+n._w/2))+M; maxy=Math.max(...all.map(n=>n._cy+n._h/2))+M;
} else {
  (function rows(n){ if(isLeaf(n)){ n._row=n._leaf; return; } n.children.forEach(rows);
    n._row=(n.children[0]._row + n.children[n.children.length-1]._row)/2; })(ROOT);
  const colX={0:0};
  for(let d=1; d<=maxDepth; d++) colX[d]=colX[d-1]+maxW[d-1]+HGAP;
  const M=70;
  all.forEach(n=>{ n._cx = M + colX[n._depth] + n._w/2; n._cy = M + 30 + n._row*ROWH; });
  maxx=Math.max(...all.map(n=>n._cx+n._w/2))+M+40; maxy=Math.max(...all.map(n=>n._cy+n._h/2))+M;
}

// ---------- 原语 ----------
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=o=>({angle:0,strokeColor:o.stroke??INKC,backgroundColor:o.fill==='none'?'transparent':(o.fill??'transparent'),fillStyle:o.fs??S.fs,strokeWidth:o.sw??S.sw,strokeStyle:o.ss??'solid',roughness:o.rough??S.rough,opacity:o.opacity??100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={})=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:{type:3},...base(o)});
const Poly=(pts,o={})=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);
  els.push({type:'line',id:id('p'),x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y,points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:o.round?{type:2}:null,...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??14)*0.6,height:(o.size??14)+6,angle:0,text:t,fontSize:o.size??14,fontFamily:o.ff??2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INKC,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:maxx,height:maxy,angle:0,strokeColor:'transparent',backgroundColor:S.paper,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});

const hue=n=> n._hue<0 ? null : S.pal[n._hue % S.pal.length];
const unit=(ax,ay)=>{const m=Math.hypot(ax,ay)||1; return [ax/m,ay/m];};
const bez=(P,N=20)=>{const[a,b,c,d]=P,out=[];for(let i=0;i<=N;i++){const t=i/N,m=1-t,
  x=m*m*m*a[0]+3*m*m*t*b[0]+3*m*t*t*c[0]+t*t*t*d[0], y=m*m*m*a[1]+3*m*m*t*b[1]+3*m*t*t*c[1]+t*t*t*d[1];
  out.push([x,y]);}return out;};

// ----- 3) taper 锥形带：中心线 → 法向偏移宽度(根 w0 → 梢 w1)→ 闭合填充多边形 -----
function ribbon(center,w0,w1,col){
  const N=center.length, L=[], Rr=[];
  for(let i=0;i<N;i++){ const t=i/(N-1); const w=Math.max(0.8,(w0+(w1-w0)*t)/2);
    const a=center[Math.max(0,i-1)], b=center[Math.min(N-1,i+1)];
    const [tx,ty]=unit(b[0]-a[0], b[1]-a[1]); const nx=-ty, ny=tx;
    L.push([center[i][0]+nx*w, center[i][1]+ny*w]);
    Rr.push([center[i][0]-nx*w, center[i][1]-ny*w]); }
  Poly([...L, ...Rr.reverse()], {stroke:col, fill:col, fs:'solid', sw:0.6, rough:S.brough??0.4, round:true});
}

// 枝条端点：父外缘 → 子「连接锚」(叶=下划线近端 / 框=近边)
function parentEdge(p,c){ if(LAYOUT==='radial'){ const [ux,uy]=unit(c._cx-p._cx,c._cy-p._cy); return [p._cx+ux*p._w*0.42, p._cy+uy*(p._h*0.42)]; }
  return [p._cx+p._w/2, p._cy]; }
function leafUnderlineY(c){ return c._cy + c._fs*0.5 + 6; }
function childAnchor(p,c){
  if(isLeaf(c)){ const uy=leafUnderlineY(c), A=[c._cx-c._w/2,uy], B=[c._cx+c._w/2,uy];
    return (Math.hypot(A[0]-p._cx,A[1]-p._cy) <= Math.hypot(B[0]-p._cx,B[1]-p._cy)) ? A : B; }
  const sx = c._cx>p._cx? -1 : 1; return [c._cx + sx*c._w/2, c._cy];
}
function branchCenter(p,c){
  const P0=parentEdge(p,c), P3=childAnchor(p,c);
  const hdir = P0[0]>P3[0] ? 1 : -1;            // 子端水平切线(指向父侧)
  let P1;
  if(LAYOUT==='radial'){ const [ox,oy]= p._depth===0? unit(c._cx-p._cx,c._cy-p._cy) : unit(p._cx-CENTER[0],p._cy-CENTER[1]);
    P1=[P0[0]+ox*48, P0[1]+oy*48]; }
  else P1=[P0[0]+(P3[0]-P0[0])*0.5, P0[1]];
  const P2=[P3[0]+hdir*46, P3[1]];
  return bez([P0,P1,P2,P3], 22);
}

// ----- 2) 手绘小图标：基础图元程序化拼(线稿、tint 成枝色)。reliable + 手绘风一致 + 反 slop。
//   drawlib 里好用的图标(person 等)可按需接，但 star/bulb 等手绘更稳，这里自绘。
const ic_el=(o)=>els.push(o);
const ELn=(pts,col,sw=2,fill='transparent')=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);
  ic_el({type:'line',id:id('ic'),x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y,points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base({stroke:col,fill,fs:'solid',sw,rough:1.2})});};
const EEl=(cx,cy,w,h,col,sw=2,fill='transparent')=>ic_el({type:'ellipse',id:id('ic'),x:cx-w/2,y:cy-h/2,width:w,height:h,roundness:null,...base({stroke:col,fill,fs:'solid',sw,rough:1.1})});
const starPts=(cx,cy,r,k=5,inner=0.42)=>{const p=[];for(let i=0;i<k*2;i++){const a=-Math.PI/2+i*Math.PI/k,rr=i%2?r*inner:r;p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}return p;};
const ICONS={
  bulb:(cx,cy,s,c)=>{const r=s*0.32;EEl(cx,cy-s*0.12,r*2,r*2,c);ELn([[cx-r*0.5,cy+s*0.18],[cx+r*0.5,cy+s*0.18]],c);ELn([[cx-r*0.4,cy+s*0.30],[cx+r*0.4,cy+s*0.30]],c);ELn([[cx-r*0.25,cy+s*0.42],[cx+r*0.25,cy+s*0.42]],c);},
  star:(cx,cy,s,c)=>ELn([...starPts(cx,cy,s*0.46),starPts(cx,cy,s*0.46)[0]],c,2),
  check:(cx,cy,s,c)=>ELn([[cx-s*0.32,cy+s*0.02],[cx-s*0.08,cy+s*0.26],[cx+s*0.36,cy-s*0.28]],c,2.6),
  heart:(cx,cy,s,c)=>{const r=s*0.2;EEl(cx-r,cy-s*0.06,r*2,r*2,c,2);EEl(cx+r,cy-s*0.06,r*2,r*2,c,2);ELn([[cx-s*0.38,cy+s*0.02],[cx,cy+s*0.42],[cx+s*0.38,cy+s*0.02]],c,2);},
  flag:(cx,cy,s,c)=>{ELn([[cx-s*0.3,cy-s*0.42],[cx-s*0.3,cy+s*0.44]],c,2.4);ELn([[cx-s*0.3,cy-s*0.4],[cx+s*0.34,cy-s*0.22],[cx-s*0.3,cy-s*0.02]],c,2);},
  person:(cx,cy,s,c)=>{EEl(cx,cy-s*0.24,s*0.34,s*0.34,c,2);ELn([[cx-s*0.3,cy+s*0.42],[cx-s*0.22,cy+s*0.06],[cx+s*0.22,cy+s*0.06],[cx+s*0.3,cy+s*0.42]],c,2);},
  people:(cx,cy,s,c)=>{EEl(cx-s*0.22,cy-s*0.2,s*0.26,s*0.26,c,2);EEl(cx+s*0.22,cy-s*0.2,s*0.26,s*0.26,c,2);ELn([[cx-s*0.42,cy+s*0.38],[cx-s*0.36,cy+s*0.08],[cx-s*0.02,cy+s*0.08],[cx-s*0.04,cy+s*0.38]],c,2);ELn([[cx+s*0.04,cy+s*0.38],[cx+s*0.02,cy+s*0.08],[cx+s*0.36,cy+s*0.08],[cx+s*0.42,cy+s*0.38]],c,2);},
  book:(cx,cy,s,c)=>{ELn([[cx-s*0.38,cy-s*0.3],[cx-s*0.38,cy+s*0.34],[cx,cy+s*0.24],[cx,cy-s*0.4]],c,2);ELn([[cx+s*0.38,cy-s*0.3],[cx+s*0.38,cy+s*0.34],[cx,cy+s*0.24],[cx,cy-s*0.4]],c,2);},
  target:(cx,cy,s,c)=>{EEl(cx,cy,s*0.84,s*0.84,c,2);EEl(cx,cy,s*0.44,s*0.44,c,2);EEl(cx,cy,s*0.1,s*0.1,c,2,c);},
  note:(cx,cy,s,c)=>{ELn([[cx-s*0.34,cy-s*0.4],[cx+s*0.34,cy-s*0.4],[cx+s*0.34,cy+s*0.4],[cx-s*0.34,cy+s*0.4],[cx-s*0.34,cy-s*0.4]],c,2);ELn([[cx-s*0.2,cy-s*0.14],[cx+s*0.2,cy-s*0.14]],c,1.6);ELn([[cx-s*0.2,cy+s*0.04],[cx+s*0.2,cy+s*0.04]],c,1.6);ELn([[cx-s*0.2,cy+s*0.22],[cx+s*0.05,cy+s*0.22]],c,1.6);},
  rocket:(cx,cy,s,c)=>{ELn([[cx,cy-s*0.46],[cx+s*0.2,cy+s*0.1],[cx,cy+s*0.28],[cx-s*0.2,cy+s*0.1],[cx,cy-s*0.46]],c,2);EEl(cx,cy-s*0.08,s*0.16,s*0.16,c,1.8);ELn([[cx-s*0.2,cy+s*0.1],[cx-s*0.34,cy+s*0.38],[cx-s*0.06,cy+s*0.24]],c,1.8);ELn([[cx+s*0.2,cy+s*0.1],[cx+s*0.34,cy+s*0.38],[cx+s*0.06,cy+s*0.24]],c,1.8);},
  gear:(cx,cy,s,c)=>{ELn([...starPts(cx,cy,s*0.46,8,0.7),starPts(cx,cy,s*0.46,8,0.7)[0]],c,2);EEl(cx,cy,s*0.34,s*0.34,c,2);},
};
const ALIAS={idea:'bulb',light:'bulb',lightbulb:'bulb',done:'check',tick:'check',favorite:'star',users:'people',team:'people',group:'people',user:'person',man:'person',goal:'target',aim:'target',settings:'gear',notes:'note',read:'book'};
function placeIcon(iconName, cx, cy, size, tint){
  let k=(iconName||'').toLowerCase().trim(); k=ALIAS[k]||k;
  const fn=ICONS[k];
  if(fn) fn(cx,cy,size,tint);
  else EEl(cx,cy,size*0.7,size*0.7,tint,2); // 兜底手绘环
}

// ----- bbox 工具 -----
function subtreeBBox(n){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; (function go(m){
  x0=Math.min(x0,m._cx-m._w/2); y0=Math.min(y0,m._cy-m._h/2); x1=Math.max(x1,m._cx+m._w/2); y1=Math.max(y1,m._cy+m._h/2);
  m.children.forEach(go); })(n); return [x0,y0,x1,y1]; }
function childrenBBox(n){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const c of n.children){ const [a,b,cc,d]=subtreeBBox(c);
  x0=Math.min(x0,a);y0=Math.min(y0,b);x1=Math.max(x1,cc);y1=Math.max(y1,d);} return [x0,y0,x1,y1]; }

// ===== 0) boundary：虚线圆角框圈住子树(在所有节点之下) =====
for(const n of all){ if(n._boundary){ const [x0,y0,x1,y1]=subtreeBBox(n); const pad=18;
  const col = typeof n._boundary==='string' ? n._boundary : (hue(n)||[INKC])[0];
  els.push({type:'rectangle',id:id('bd'),x:x0-pad,y:y0-pad,width:(x1-x0)+pad*2,height:(y1-y0)+pad*2,roundness:{type:3},...base({stroke:col,fill:'none',ss:'dashed',sw:1.6,rough:1,opacity:75})}); }}

// ===== 绘制：枝条(底) → 下划线 → 节点 → 图标(顶) =====
(function branches(n){ for(const c of n.children){
  const col=(hue(c)||[INKC])[0];
  const w0=c._depth===1?9:c._depth===2?5.5:3.6, w1=c._depth===1?3:c._depth===2?2.2:1.6;
  ribbon(branchCenter(n,c), w0, w1, col);
  branches(c);
}})(ROOT);

for(const n of all){
  if(n._depth===0) continue;
  const h=hue(n)||[INKC,'#f1f3f5'], col=h[0];
  if(isLeaf(n)){ // 叶子：无框，文字 + 彩色下划线(细 taper)
    const uy=leafUnderlineY(n);
    ribbon([[n._cx-n._w/2,uy],[n._cx+n._w/2,uy]], 2.4, 1.6, col);
    const tot=n._lines.length*(n._fs+6);
    n._lines.forEach((ln,k)=>T(n._cx-n._w/2, n._cy-tot/2+k*(n._fs+6)-2, ln, {w:n._w,align:'center',size:n._fs,color:INKC}));
  } else { // 内/一级节点：描边圆角框(彩色 stroke + 纸色填充)
    R(n._cx-n._w/2, n._cy-n._h/2, n._w, n._h, {stroke:col, fill:S.paper, sw:S.sw});
    const tot=n._lines.length*(n._fs+6);
    n._lines.forEach((ln,k)=>T(n._cx-n._w/2, n._cy-tot/2+k*(n._fs+6)+2, ln, {w:n._w,align:'center',size:n._fs,color:col}));
  }
}

// root(顶层之上，最后画保证压在枝条上)：云形大字
(function drawRoot(){ const n=ROOT, x=n._cx-n._w/2, y=n._cy-n._h/2;
  // 云：椭圆基 + 扇贝边(闭合多边形)
  const cx=n._cx, cy=n._cy, rx=n._w/2, ry=n._h/2, pts=[], K=8;
  for(let i=0;i<64;i++){ const a=i/64*2*Math.PI; const bump=1+0.07*Math.cos(K*a); pts.push([cx+Math.cos(a)*rx*bump, cy+Math.sin(a)*ry*bump]); }
  Poly(pts, {stroke:S.root.s, fill:S.root.f, fs:'solid', sw:S.sw, rough:1, round:true});
  const tot=n._lines.length*(n._fs+7);
  n._lines.forEach((ln,k)=>T(cx-n._w/2, cy-tot/2+k*(n._fs+7)+2, ln, {w:n._w,align:'center',size:n._fs,color:S.root.t}));
})();

// 图标：一级节点(depth1)若有 icon，放在节点上方偏外
for(const n of all){ if(n._depth===1 && n.icon){
  const col=(hue(n)||[INKC])[0];
  const ix=n._cx, iy=n._cy - n._h/2 - 22;
  placeIcon(n.icon, ix, iy, 30, col);
}}

// ===== summary：花括号归并子节点 + 标签 =====
function braceV(x,y0,y1,col,label){ const t=10,h=y1-y0,my=(y0+y1)/2;
  Poly([[x,y0],[x+t,y0+h*0.08],[x+t,my-h*0.10],[x+2*t,my],[x+t,my+h*0.10],[x+t,y1-h*0.08],[x,y1]],{stroke:col,fill:'none',sw:2,rough:1,round:true});
  if(label) T(x+2*t+8, my-9, label, {align:'left', size:14, color:col, w:label.length*10+20}); }
for(const n of all){ if(n._summary && n.children.length){ const [x0,y0,x1,y1]=childrenBBox(n); const col=(hue(n)||[INKC])[0];
  if(LAYOUT==='logical'){ braceV(x1+12, y0-4, y1+4, col, n._summary); }
  else { const pad=14; els.push({type:'rectangle',id:id('sm'),x:x0-pad,y:y0-pad,width:(x1-x0)+pad*2,height:(y1-y0)+pad*2,roundness:{type:3},...base({stroke:col,fill:'none',ss:'dashed',sw:1.6,rough:1,opacity:70})});
    T((x0+x1)/2-(n._summary.length*4), y0-pad-18, n._summary, {align:'center',size:13,color:col,w:n._summary.length*9+20}); } }}

// ===== link：跨枝弯曲虚线 + 中点标签(按 label 或 id 匹配) =====
const byKey={}; for(const n of all){ if(n.id && !(n.id in byKey)) byKey[n.id]=n; if(!(n.label in byKey)) byKey[n.label]=n; }
for(const lk of (ROOT._links||[])){ const a=byKey[lk.a], b=byKey[lk.b]; if(!a||!b||a===b) continue;
  const dx=b._cx-a._cx, dy=b._cy-a._cy, [ux,uy]=unit(dx,dy), nx=-uy, ny=ux, off=Math.min(130, Math.hypot(dx,dy)*0.28);
  const c1=[(a._cx+b._cx)/2+nx*off, (a._cy+b._cy)/2+ny*off];
  Poly(bez([[a._cx,a._cy],c1,c1,[b._cx,b._cy]],26), {stroke:'#868e96',fill:'none',ss:'dashed',sw:1.8,rough:0.8,round:true});
  if(lk.label) T(c1[0]-(lk.label.length*3.5), c1[1]-8, lk.label, {align:'center',size:12,color:'#868e96',w:lk.label.length*8+16}); }

// ===== note callout：便签(小 note 图标 + 黄色便签框 + 细引线) =====
const wrap=(s,n)=>{ const w=String(s).split(/\s+/), out=[]; let l=''; for(const x of w){ if((l+' '+x).trim().length>n){ if(l)out.push(l); l=x; } else l=(l+' '+x).trim(); } if(l)out.push(l); return out.length?out:['']; };
for(const n of all){ if(n._note){
  const lines=wrap(n._note,20), nw=Math.max(96, Math.max(...lines.map(l=>l.length))*6.6+30), nh=lines.length*16+16;
  let bx,by;
  if(LAYOUT==='radial' && CENTER){ const [ox,oy]=unit(n._cx-CENTER[0],n._cy-CENTER[1]); bx=n._cx+ox*(n._w/2+34)-nw/2; by=n._cy+oy*(n._h/2+28)-nh/2; }
  else { bx=n._cx-nw/2; by=n._cy+n._h/2+18; }
  Poly([[n._cx,n._cy],[bx+nw/2, by<n._cy?by+nh:by]], {stroke:'#adb5bd',fill:'none',sw:1.2,rough:0.5});
  els.push({type:'rectangle',id:id('nt'),x:bx,y:by,width:nw,height:nh,roundness:{type:3},...base({stroke:'#e8a90c',fill:'#fff3bf',fs:'solid',sw:1.4,rough:1})});
  ICONS.note(bx+13, by+nh/2, 16, '#e8a90c');
  lines.forEach((ln,k)=>T(bx+26, by+9+k*16, ln, {align:'left',size:12,color:'#664d00',w:nw-30}));
}}

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:S.paper,gridSize:20}};
fs.writeFileSync(process.argv[3],JSON.stringify(doc,null,2));
console.log(`mindmap[${LAYOUT}]: ${all.length} nodes, depth ${maxDepth}, style=${process.argv[4]||ROOT.style||'classic-tricolor'} → ${process.argv[3]}`);
