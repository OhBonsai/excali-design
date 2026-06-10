import fs from 'fs';
// 从 view.ir.json 自由渲染(复刻版):五分区网格 + 正交布线 + 反馈线走边缘。
// 数据源 = view.ir(hero/tiers/groups/relations);布局/路由是本图的手摆编排。
const V = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];
const INK='#1e1e1e', BLUE='#1971c2', GRAY='#868e96', PAPER='#ffffff', LBLUE='#cfe3fa';
const els=[]; let sid=1; const id=p=>`${p}${sid++}`; const rnd=()=>(sid*7919)%999983;
const base=o=>({angle:0,strokeColor:o.s??INK,backgroundColor:o.f??'transparent',fillStyle:'solid',strokeWidth:o.sw??2,strokeStyle:o.ss??'solid',roughness:o.r??1,opacity:o.op??100,seed:rnd(),groupIds:o.g?[o.g]:[]});

// 手摆位置 + 形状。 [x,y,w,h,shape]  shape: rect|ell|cyl|doc
const POS = {
  in:[70,104,150,54,'rect'], clar:[58,196,176,52,'rect'], dir:[70,288,150,52,'rect'], view:[70,380,150,52,'rect'], enc:[70,472,150,52,'rect'],
  mer:[346,326,372,184,'rect'],
  arch:[346,544,116,50,'rect'], prot:[474,544,128,50,'rect'], form:[614,544,104,50,'rect'],
  lib:[58,648,156,98,'cyl'],
  exc:[800,232,172,124,'doc'], exp:[818,432,154,56,'rect'], art:[812,548,166,72,'ell'],
  lint:[108,884,150,52,'rect'], floor:[298,884,164,52,'rect'], fix:[502,884,110,52,'rect'], rc:[652,884,162,52,'rect'],
};
// 显示用短标签(数据 id 不变);多行用数组
const LABEL = {
  in:['输入'], clar:['clarify -> brief'], dir:['data.ir'], view:['view.ir'], enc:['编码'],
  mer:['渲染器','(按图类型分发)'], arch:['架构/拓扑'], prot:['原型/海报'], form:['公式'],
  lib:['drawlib 资产'], exc:['.excalidraw','产物'], exp:['导出'], art:['PNG/SVG'],
  lint:['arch-lint'], floor:['floor-check'], fix:['fix'], rc:['round-check'],
};
const reg={};
const tierOf = id => V.tiers.findIndex(t => t.includes(id));
function nodeStyle(id){
  if(id===V.hero) return {s:BLUE,f:LBLUE,sw:3.0,fs:22,op:100};
  const t=tierOf(id);
  if(t===1) return {s:INK,f:PAPER,sw:2.4,fs:15,op:100};
  if(t>=3)  return {s:GRAY,f:PAPER,sw:1.5,fs:13,op:90};
  return {s:INK,f:PAPER,sw:2,fs:15,op:100};
}
function Tlines(cx,cy,lines,{size=15,color=INK}={}){
  const lh=size+6, total=lines.length*lh, y0=cy-total/2;
  lines.forEach((ln,i)=>{ const w=ln.length*size*0.62;
    els.push({type:'text',id:id('t'),x:cx-w/2,y:y0+i*lh,width:w,height:size+4,angle:0,text:ln,fontSize:size,fontFamily:2,textAlign:'center',verticalAlign:'top',strokeColor:color,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
  });
}
function drawNode(it){
  const p=POS[it.id]; if(!p){console.error('no pos',it.id);return;}
  const [x,y,w,h,shape]=p; const st=nodeStyle(it.id); let main;
  if(shape==='ell'){ main={type:'ellipse',id:id('n'),x,y,width:w,height:h,roundness:null,...base({s:st.s,f:st.f,sw:st.sw,op:st.op})}; els.push(main); }
  else if(shape==='cyl'){ const g='cyl_'+it.id,eh=h*0.22,G=o=>({...base({...o,g})});
    main={type:'rectangle',id:id('n'),x,y:y+eh/2,width:w,height:h-eh,roundness:null,...G({s:'transparent',op:st.op})}; els.push(main);
    els.push({type:'ellipse',id:id('n'),x,y,width:w,height:eh,roundness:null,...G({s:st.s,op:st.op})});
    els.push({type:'line',id:id('n'),x,y:y+eh/2,width:0,height:h-eh,points:[[0,0],[0,h-eh]],roundness:null,...G({s:st.s,op:st.op})});
    els.push({type:'line',id:id('n'),x:x+w,y:y+eh/2,width:0,height:h-eh,points:[[0,0],[0,h-eh]],roundness:null,...G({s:st.s,op:st.op})});
    els.push({type:'ellipse',id:id('n'),x,y:y+h-eh,width:w,height:eh,roundness:null,...G({s:st.s,op:st.op})}); }
  else if(shape==='doc'){ const pts=[[0,0],[w,0],[w,h-12],[w*0.66,h],[w*0.33,h-12],[0,h]]; main={type:'line',id:id('n'),x,y,width:w,height:h,points:[...pts,[0,0]],roundness:null,...base({s:st.s,f:st.f,sw:st.sw,op:st.op})}; els.push(main); }
  else { main={type:'rectangle',id:id('n'),x,y,width:w,height:h,roundness:{type:3},...base({s:st.s,f:st.f,sw:st.sw,op:st.op})}; els.push(main); }
  main.boundElements=[];
  Tlines(x+w/2, y+h/2, LABEL[it.id]||[it.label], {size:st.fs,color:st.s});
  reg[it.id]={x,y,w,h,eid:main.id};
}
// 锚点:节点某条边上 t 处
function anchor(rid,side,t=0.5){const b=reg[rid];
  if(side==='top')return[b.x+b.w*t,b.y]; if(side==='bottom')return[b.x+b.w*t,b.y+b.h];
  if(side==='left')return[b.x,b.y+b.h*t]; return[b.x+b.w,b.y+b.h*t];}
// 正交连线(via = 绝对路点)
function edge(from,to,{fs='right',ts='left',t0=0.5,t1=0.5,via=[],dashed=false,color=INK,sw=2}={}){
  const A=reg[from],B=reg[to]; if(!A||!B)return;
  const s=anchor(from,fs,t0), e=anchor(to,ts,t1);
  const abs=[s,...via,e]; const pts=abs.map(p=>[p[0]-s[0],p[1]-s[1]]);
  const xs=abs.map(p=>p[0]),ys=abs.map(p=>p[1]);
  const aid=id('a');
  els.push({type:'arrow',id:aid,x:s[0],y:s[1],width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),points:pts,angle:0,strokeColor:color,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:sw,strokeStyle:dashed?'dashed':'solid',roughness:1,opacity:dashed?70:100,seed:rnd(),groupIds:[],roundness:null,startArrowhead:null,endArrowhead:'arrow',elbowed:false,startBinding:{elementId:A.eid,focus:0,gap:4},endBinding:{elementId:B.eid,focus:0,gap:4},boundElements:[]});
  const ae=els.find(x=>x.id===A.eid),be=els.find(x=>x.id===B.eid);
  if(ae){ae.boundElements=ae.boundElements||[];ae.boundElements.push({type:'arrow',id:aid});}
  if(be){be.boundElements=be.boundElements||[];be.boundElements.push({type:'arrow',id:aid});}
}
function zone(g){
  const ms=g.members.map(m=>reg[m]).filter(Boolean); if(!ms.length)return;
  const x0=Math.min(...ms.map(b=>b.x))-18, y0=Math.min(...ms.map(b=>b.y))-34, x1=Math.max(...ms.map(b=>b.x+b.w))+18, y1=Math.max(...ms.map(b=>b.y+b.h))+16;
  els.splice(1,0,{type:'rectangle',id:id('z'),x:x0,y:y0,width:x1-x0,height:y1-y0,roundness:{type:3},...base({s:GRAY,ss:'dashed',sw:1.4,op:60})}); // 背景(idx0)之后、节点之前
  els.push({type:'text',id:id('t'),x:x0+16,y:y0+8,width:200,height:22,angle:0,text:g.name,fontSize:17,fontFamily:2,textAlign:'left',verticalAlign:'top',strokeColor:INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
}

const W=1040,H=1012;
els.push({type:'rectangle',id:'bg',x:0,y:0,width:W,height:H,roundness:null,...base({s:'transparent',f:PAPER,sw:1,r:0})});

V.items.forEach(drawNode);
(V.groups||[]).forEach(zone);

// 显式正交路由表(键 = from>to)
const R = {
  'in>clar':{fs:'bottom',ts:'top'}, 'clar>dir':{fs:'bottom',ts:'top'}, 'dir>view':{fs:'bottom',ts:'top'}, 'view>enc':{fs:'bottom',ts:'top'},
  'enc>mer':{fs:'right',ts:'left',via:[[300,498],[300,418]]},
  'mer>exc':{fs:'right',t0:0.4,ts:'left',via:[[760,400],[760,294]]},
  'exc>exp':{fs:'bottom',ts:'top',via:[[885,394],[895,394]]},
  'exp>art':{fs:'bottom',ts:'top'},
  // 依赖/反馈(虚线,走边缘)
  'lib>mer':{fs:'right',ts:'bottom',t1:0.2,via:[[420,697]],dashed:true,color:GRAY,sw:1.7},
  'rc>mer': {fs:'top',ts:'bottom',t1:0.62,via:[[733,696],[569,696]],dashed:true,color:GRAY,sw:1.7},
  'exc>floor':{fs:'bottom',t0:0.4,ts:'top',via:[[861,838],[380,838]],dashed:true,color:GRAY,sw:1.7},
  'exc>lint': {fs:'bottom',t0:0.62,ts:'top',via:[[903,846],[183,846]],dashed:true,color:GRAY,sw:1.7},
  'fix>exc':  {fs:'top',t1:0.78,ts:'bottom',via:[[557,854],[920,854]],dashed:true,color:GRAY,sw:1.7},
};
for(const r of (V.relations||[])){
  const k=`${r.from}>${r.to}`; const o=R[k]||{};
  edge(r.from,r.to,{dashed:r.kind==='dependency',color:r.kind==='dependency'?GRAY:INK, ...o});
}

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:PAPER,gridSize:20}};
fs.writeFileSync(OUT,JSON.stringify(doc,null,2));
console.log(`replica: ${els.length} els, hero=${V.hero}, items=${V.items.length} → ${OUT}`);
