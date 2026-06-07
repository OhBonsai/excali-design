import fs from 'fs';
// sequence 组件库参考表（手绘风）—— 供图像模型作生成约束 + 风格参考
const INK='#1e1e1e', GRAY='#868e96', BLUE='#1971c2', BLUEBG='#a5d8ff', YEL='#e8a838', YELBG='#fff3bf', GRN='#2f9e44', GRNBG='#d3f9d8';
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=(o={})=>({angle:0,strokeColor:o.stroke??INK,backgroundColor:o.fill??'transparent',fillStyle:o.fs??'solid',strokeWidth:o.sw??1.8,strokeStyle:o.ss??'solid',roughness:o.rough??1,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={},round)=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:round?{type:3}:null,...base(o)});
const El=(x,y,w,h,o={})=>els.push({type:'ellipse',id:id('e'),x,y,width:w,height:h,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base(o)});};
const Ar=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'arrow',id:id('a'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,startArrowhead:null,endArrowhead:o.head??'arrow',...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??13)*0.6,height:(o.size??13)+6,angle:0,text:t,fontSize:o.size??13,fontFamily:2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});

els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:1180,height:760,angle:0,strokeColor:'transparent',backgroundColor:'#ffffff',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});
T(40,26,'Sequence 组件库（手绘风）· 供图像模型作生成约束 + 风格参考',{align:'left',size:19,w:1100});

const COLS=[180,470,760,1040], ROWS=[150,330,520,690]; let i=0;
const cell=(draw,lab)=>{const c=COLS[i%4],r=ROWS[Math.floor(i/4)]; draw(c,r); T(c-130,r+74,lab,{w:260,size:12,color:GRAY}); i++;};

// 1 participant box
cell((c,r)=>{R(c-60,r-22,120,44,{stroke:BLUE,fill:BLUEBG},true);T(c-60,r-9,'Participant',{w:120});}, '参与者 Participant（框）');
// 2 actor stick figure
cell((c,r)=>{El(c-9,r-30,18,18,{stroke:BLUE,fill:BLUEBG});Ln([[c,r-12],[c,r+8]]);Ln([[c-14,r-4],[c+14,r-4]]);Ln([[c,r+8],[c-12,r+26]]);Ln([[c,r+8],[c+12,r+26]]);T(c-40,r+30,'Actor',{w:80});}, '角色 Actor（小人）');
// 3 lifeline
cell((c,r)=>{R(c-44,r-30,88,26,{stroke:BLUE,fill:BLUEBG},true);T(c-44,r-23,'A',{w:88});Ln([[c,r-4],[c,r+50]],{ss:'dashed',stroke:GRAY,sw:1.4});}, '生命线 Lifeline（虚线）');
// 4 activation bar
cell((c,r)=>{Ln([[c,r-32],[c,r+50]],{ss:'dashed',stroke:GRAY,sw:1.4});R(c-6,r-18,12,54,{stroke:INK,fill:GRNBG,sw:1.5});}, '激活条 Activation');
// 5 sync message
cell((c,r)=>{Ar([[c-90,r],[c+90,r]],{head:'triangle',sw:2});T(c-70,r-22,'sync ->>',{align:'left',size:12,w:140});}, '同步消息 Sync（实线实心头）');
// 6 return message
cell((c,r)=>{Ar([[c-90,r],[c+90,r]],{head:'arrow',sw:2,ss:'dashed'});T(c-80,r-22,'return -->>',{align:'left',size:12,w:150});}, '返回消息 Return（虚线开口）');
// 7 async message
cell((c,r)=>{Ar([[c-90,r],[c+90,r]],{head:'arrow',sw:2});T(c-72,r-22,'async -)',{align:'left',size:12,w:130});}, '异步消息 Async（开口头）');
// 8 self message
cell((c,r)=>{Ln([[c-60,r-30],[c-60,r+44]],{ss:'dashed',stroke:GRAY,sw:1.4});Ar([[c-60,r-10],[c-10,r-10],[c-10,r+10],[c-56,r+10]],{head:'triangle',sw:2});T(c-2,r-8,'self',{align:'left',size:12,w:60});}, '自调用 Self-message');
// 9 destroy/cross
cell((c,r)=>{Ar([[c-90,r],[c+86,r]],{head:'bar',sw:2});Ln([[c+82,r-8],[c+98,r+8]]);Ln([[c+82,r+8],[c+98,r-8]]);}, '终止 Destroy（叉号端）');
// 10 note
cell((c,r)=>{R(c-70,r-22,140,44,{stroke:YEL,fill:YELBG,sw:1.6});T(c-70,r-9,'Note over A,B',{w:140,size:12});}, '注释 Note（便签）');
// 11 fragment frame (loop/alt/opt)
cell((c,r)=>{R(c-80,r-34,160,90,{stroke:GRAY,fill:'transparent',sw:1.4,ss:'dashed',rough:0});R(c-80,r-34,52,20,{stroke:GRAY,fill:'#fff',sw:1.2,rough:0});T(c-74,r-31,'loop',{align:'left',size:12,color:GRAY,w:60});}, '片段框 Fragment（loop/opt）');
// 12 alt with else divider
cell((c,r)=>{R(c-80,r-34,160,90,{stroke:GRAY,fill:'transparent',sw:1.4,ss:'dashed',rough:0});R(c-80,r-34,44,20,{stroke:GRAY,fill:'#fff',sw:1.2,rough:0});T(c-74,r-31,'alt',{align:'left',size:12,color:GRAY,w:50});Ln([[c-80,r+12],[c+80,r+12]],{ss:'dashed',stroke:GRAY,sw:1.2,rough:0});T(c-74,r+14,'else',{align:'left',size:11,color:GRAY,w:50});}, '条件框 Alt（含 else 分隔）');

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:'#ffffff',gridSize:20}};
fs.writeFileSync(process.argv[2],JSON.stringify(doc,null,2));
console.log('els',els.length,'→',process.argv[2]);
