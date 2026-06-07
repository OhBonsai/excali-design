import fs from 'fs';
// state 组件库参考表（手绘风）—— 供图像模型作生成约束 + 风格参考
const INK='#1e1e1e', GRAY='#868e96', BLUE='#1971c2', BLUEBG='#a5d8ff';
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=(o={})=>({angle:0,strokeColor:o.stroke??INK,backgroundColor:o.fill??'transparent',fillStyle:o.fs??'solid',strokeWidth:o.sw??1.8,strokeStyle:o.ss??'solid',roughness:o.rough??1,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={},round)=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:round?{type:3}:null,...base(o)});
const Dm=(x,y,w,h,o={})=>els.push({type:'diamond',id:id('d'),x,y,width:w,height:h,...base(o)});
const El=(x,y,w,h,o={})=>els.push({type:'ellipse',id:id('e'),x,y,width:w,height:h,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base(o)});};
const Ar=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'arrow',id:id('a'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,startArrowhead:null,endArrowhead:o.head??'arrow',...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??13)*0.6,height:(o.size??13)+6,angle:0,text:t,fontSize:o.size??13,fontFamily:2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});

els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:1180,height:580,angle:0,strokeColor:'transparent',backgroundColor:'#ffffff',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});
T(40,26,'State 组件库（手绘风）· 供图像模型作生成约束 + 风格参考',{align:'left',size:19,w:1100});

const COLS=[180,470,760,1040], ROWS=[160,400]; let i=0;
const cell=(draw,lab)=>{const c=COLS[i%4],r=ROWS[Math.floor(i/4)]; draw(c,r); T(c-130,r+72,lab,{w:260,size:12,color:GRAY}); i++;};

cell((c,r)=>El(c-13,r-13,26,26,{fill:INK,stroke:INK}), '初始 Initial（实心圆点）');
cell((c,r)=>{El(c-16,r-16,32,32,{fill:'none'});El(c-9,r-9,18,18,{fill:INK,stroke:INK});}, '终止 Final（环+实心）');
cell((c,r)=>{R(c-66,r-26,132,52,{stroke:BLUE,fill:BLUEBG},true);T(c-66,r-12,'State',{w:132});}, '状态 State（圆角框）');
cell((c,r)=>{R(c-70,r-30,140,60,{stroke:BLUE,fill:'#e7f5ff'},true);Ln([[c-70,r-8],[c+70,r-8]]);T(c-70,r-26,'Composite',{w:140,size:12});T(c-66,r-2,'sub-states…',{align:'left',w:130,size:11,color:GRAY});}, '复合状态 Composite');
cell((c,r)=>{Dm(c-40,r-30,80,60,{stroke:BLUE,fill:BLUEBG});}, '选择 Choice（菱形）');
cell((c,r)=>{R(c-50,r-7,100,14,{fill:INK,stroke:INK,sw:1});T(c-30,r+12,'fork / join',{align:'left',w:120,size:11,color:GRAY});}, '分叉汇合 Fork / Join（条）');
cell((c,r)=>{Ar([[c-80,r],[c+80,r]],{sw:2});T(c-50,r-22,'event / guard',{align:'left',size:12,w:150});}, '转移 Transition（带标签）');
cell((c,r)=>{R(c-50,r-24,100,48,{stroke:BLUE,fill:BLUEBG},true);Ar([[c+50,r-14],[c+86,r-14],[c+86,r+14],[c+54,r+14]],{sw:2});T(c+58,r-30,'self',{align:'left',size:11,w:50});}, '自转移 Self-transition');

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:'#ffffff',gridSize:20}};
fs.writeFileSync(process.argv[2],JSON.stringify(doc,null,2));
console.log('els',els.length,'→',process.argv[2]);
