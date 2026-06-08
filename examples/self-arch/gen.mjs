import fs from 'fs';
// excali-design 自身架构图(海报型手工布局)。编码:containment(分区) + connection(箭头);
// hue 3 色编角色:墨=主干流水线 / 蓝=核心渲染器(hero) / 灰=辅助·校验·eval。
const INK='#1e1e1e', BLUE='#1971c2', GRAY='#868e96';
const PAPER='#ffffff', LBLUE='#e7f1fb', LGRAY='#f1f3f5', ZBLUE='#f4f9fe', ZGRAY='#f6f7f8';
const els=[]; let sid=1; const id=p=>`${p}${sid++}`; const rnd=()=>(sid*7919)%999983;
const reg={}; // id->box for binding
function bg(w,h){els.push({type:'rectangle',id:'bg',x:0,y:0,width:w,height:h,angle:0,strokeColor:'transparent',backgroundColor:PAPER,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});}
function zone(x,y,w,h,label,stroke,fill,dashed){
  els.push({type:'rectangle',id:id('z'),x,y,width:w,height:h,angle:0,strokeColor:stroke,backgroundColor:fill,fillStyle:'solid',strokeWidth:1.5,strokeStyle:dashed?'dashed':'solid',roughness:1,roundness:{type:3},opacity:100,seed:rnd(),groupIds:[]});
  els.push({type:'text',id:id('zt'),x:x+14,y:y+10,width:w-28,height:20,angle:0,text:label,fontSize:15,fontFamily:2,textAlign:'left',verticalAlign:'top',strokeColor:stroke,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
}
function box(key,x,y,w,h,label,{stroke=INK,fill=PAPER,fs=14,sub=null}={}){
  const bid=id('b');
  els.push({type:'rectangle',id:bid,x,y,width:w,height:h,angle:0,strokeColor:stroke,backgroundColor:fill,fillStyle:'solid',strokeWidth:2,strokeStyle:'solid',roughness:1,roundness:{type:3},opacity:100,seed:rnd(),groupIds:[],boundElements:[]});
  // 文本(主 + 可选副)
  const lines=sub?[label,sub]:[label];
  const th=lines.length*(fs+5);
  els.push({type:'text',id:id('t'),x:x+6,y:y+h/2-th/2,width:w-12,height:th,angle:0,text:label,fontSize:fs,fontFamily:2,textAlign:'center',verticalAlign:'middle',strokeColor:stroke,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
  if(sub) els.push({type:'text',id:id('t'),x:x+6,y:y+h/2-th/2+fs+5,width:w-12,height:fs,angle:0,text:sub,fontSize:11,fontFamily:2,textAlign:'center',verticalAlign:'middle',strokeColor:GRAY,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
  reg[key]={id:bid,x,y,w,h};
  return bid;
}
function edge(a,b,{color=INK,dashed=false,label=null,head='arrow'}={}){
  const A=reg[a],B=reg[b]; if(!A||!B) throw new Error('edge '+a+'->'+b);
  const ac=[A.x+A.w/2,A.y+A.h/2], bc=[B.x+B.w/2,B.y+B.h/2];
  const dx=bc[0]-ac[0], dy=bc[1]-ac[1];
  let p0,p1;
  if(Math.abs(dx)>=Math.abs(dy)){ // 水平为主:右/左缘
    if(dx>=0){p0=[A.x+A.w,ac[1]];p1=[B.x,bc[1]];} else {p0=[A.x,ac[1]];p1=[B.x+B.w,bc[1]];}
  } else { // 垂直为主:下/上缘
    if(dy>=0){p0=[ac[0],A.y+A.h];p1=[bc[0],B.y];} else {p0=[ac[0],A.y];p1=[bc[0],B.y+B.h];}
  }
  const aid=id('a');
  els.push({type:'arrow',id:aid,x:p0[0],y:p0[1],width:p1[0]-p0[0],height:p1[1]-p0[1],points:[[0,0],[p1[0]-p0[0],p1[1]-p0[1]]],angle:0,strokeColor:color,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:2,strokeStyle:dashed?'dashed':'solid',roughness:1,opacity:100,seed:rnd(),groupIds:[],roundness:null,startArrowhead:null,endArrowhead:head,elbowed:false,startBinding:{elementId:A.id,focus:0,gap:4},endBinding:{elementId:B.id,focus:0,gap:4},boundElements:[]});
  // 双向登记
  const ael=els.find(e=>e.id===A.id), bel=els.find(e=>e.id===B.id);
  ael.boundElements.push({type:'arrow',id:aid}); bel.boundElements.push({type:'arrow',id:aid});
  if(label){ const mx=(p0[0]+p1[0])/2, my=(p0[1]+p1[1])/2; els.push({type:'text',id:id('t'),x:mx-label.length*3.2,y:my-16,width:label.length*7,height:14,angle:0,text:label,fontSize:11,fontFamily:2,textAlign:'center',verticalAlign:'middle',strokeColor:GRAY,backgroundColor:PAPER,fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]}); }
}

const W=1520,H=1060; bg(W,H);
// 标题
els.push({type:'text',id:id('t'),x:48,y:28,width:900,height:30,angle:0,text:'excali-design 架构:一条「需求 -> 信息 -> 编码 -> 渲染 -> 产物」的流水线',fontSize:22,fontFamily:2,textAlign:'left',verticalAlign:'top',strokeColor:INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
els.push({type:'text',id:id('t'),x:48,y:62,width:900,height:20,angle:0,text:'自由信息可视化路径(原型/固定 mermaid 数据已确定,走各自渲染);蓝=核心渲染器,灰=辅助·校验·评测',fontSize:12,fontFamily:2,textAlign:'left',verticalAlign:'top',strokeColor:GRAY,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});

// ── 上游流水线(墨,L→R)──
const Y1=110, BH=64;
box('in',   48, Y1, 150, BH, '输入', {sub:'需求 + context'});
box('clar', 250,Y1, 150, BH, 'clarify', {sub:'-> brief'});
box('dir',  452,Y1, 168, BH, 'data.ir', {sub:'scope/预算 · check'});
box('enc',  672,Y1, 178, BH, '编码决策', {sub:'encoding · schema'});

// ── 核心渲染器 hero 区(蓝 frame)──
zone(252, 250, 660, 300, 'dispatch · 渲染器(按图类型路由)', BLUE, ZBLUE, false);
box('mer', 276, 300, 612, 70, 'Mermaid 模板渲染器', {stroke:BLUE,fill:LBLUE,sub:'flowchart / sequence / state / class / ER / gantt / mindmap'});
box('arch',276, 392, 295, 64, '架构 / 拓扑', {stroke:BLUE,fill:LBLUE,sub:'arch-layout(elkjs) + arch-connect'});
box('prot',592, 392, 296, 64, '原型 / 海报', {stroke:BLUE,fill:LBLUE,sub:'html -> excalidraw'});
box('form',276, 470, 295, 60, '公式', {stroke:BLUE,fill:LBLUE,sub:'render-formula (LaTeX->SVG)'});
box('chart',592,470, 296, 60, '图表', {stroke:BLUE,fill:LBLUE,sub:'忠实编码 + faithfulness'});

// ── 资产(墨,喂渲染器)──
box('lib', 40, 360, 170, 96, 'drawlib 资产', {sub:'11 库 · ~402 件'});

// ── 产物 + 导出(墨,右)──
box('exc', 980, 300, 175, 70, '.excalidraw', {sub:'产物(源文件)'});
box('exp', 980, 408, 175, 70, '导出', {sub:'svg-export / playwright'});
box('art', 980, 516, 175, 60, 'PNG / SVG', {});

// ── 质量门(灰 frame,作用于产物)──
zone(252, 600, 660, 110, '质量门(查脏不查斜;改布局不被路由污染)', GRAY, ZGRAY, false);
box('lint',276, 642, 200, 52, 'arch-lint', {stroke:GRAY,sub:'重叠/穿框/绕背/溢出'});
box('floor',492,642, 200, 52, 'floor-check', {stroke:GRAY,sub:'眯眼/容量/配色'});
box('fix', 708,642, 180, 52, 'fix', {stroke:GRAY,sub:'机械自动修'});

// ── eval(灰虚线 frame,meta)──
zone(980, 600, 460, 110, 'eval(评测)', GRAY, ZGRAY, true);
box('rc',  1004,642, 200, 52, 'round-check', {stroke:GRAY,sub:'确定性回归(本机)'});
box('ab',  1220,642, 196, 52, 'run.mjs A/B', {stroke:GRAY,sub:'v0.5 vs v0.6 模型评测'});

// ── 连接(数据流)──
edge('in','clar'); edge('clar','dir'); edge('dir','enc');
edge('enc','mer',{label:'按类型路由'});          // 进入 hero
edge('lib','arch',{label:'资产复用'});            // drawlib 喂渲染器
edge('mer','exc',{label:'产出'});
edge('exc','exp'); edge('exp','art');
edge('exc','floor',{color:GRAY,dashed:true,label:'自检'});  // 产物 → 质量门
edge('fix','exc',{color:GRAY,dashed:true,label:'回写'});    // 修复回写

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:PAPER,gridSize:20}};
fs.writeFileSync(process.argv[2],JSON.stringify(doc,null,2));
console.log(`arch: ${els.length} els → ${process.argv[2]}`);
