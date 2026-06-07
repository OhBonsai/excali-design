import fs from 'fs';
const INK='#1e1e1e', GRAY='#868e96', BLUE='#1971c2', BLUEBG='#a5d8ff';
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=(o={})=>({angle:0,strokeColor:o.stroke??INK,backgroundColor:o.bg??'transparent',fillStyle:'solid',strokeWidth:o.sw??2,strokeStyle:o.ss??'solid',roughness:1,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={})=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:o.round?{type:3}:null,...base(o)});
const Dm=(x,y,w,h,o={})=>els.push({type:'diamond',id:id('d'),x,y,width:w,height:h,roundness:null,...base(o)});
const El=(x,y,w,h,o={})=>els.push({type:'ellipse',id:id('e'),x,y,width:w,height:h,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:o.round?{type:2}:null,...base(o)});};
const Ar=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'arrow',id:id('a'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,startArrowhead:null,endArrowhead:'arrow',...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??12)*0.62,height:(o.size??12)+6,angle:0,text:t,fontSize:o.size??12,fontFamily:2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
const closed=p=>p.concat([p[0]]);
const poly=(cx,cy,w,h,rel,o={})=>Ln(closed(rel.map(([a,b])=>[cx-w/2+a*w,cy-h/2+b*h])),o);
const arc=(cx,cy,rx,ry,a0,a1,n=10)=>{const p=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;p.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}return p;};

T(40,26,'Flowchart 组件库（完整版 · ISO/ANSI + 常用）· 手绘风 — 供图像模型作生成约束 + 风格参考',{align:'left',size:19,w:1180});

const COLS=[130,360,590,820,1050], ROWS=[140,300,460,620,780,940], W=140,H=66;
let i=0;
const cell=(draw,label)=>{const c=COLS[i%5],r=ROWS[Math.floor(i/5)]; draw(c,r); T(c-95,r+H/2+12,label,{w:190,size:11.5,color:GRAY}); i++;};
const x0=c=>c-W/2, y0=r=>r-H/2;

// --- Process family ---
cell((c,r)=>R(x0(c),y0(r),W,H), '处理 Process');
cell((c,r)=>R(x0(c),y0(r),W,H,{round:true}), '可选处理 Alt-Process');
cell((c,r)=>{R(x0(c),y0(r),W,H);Ln([[x0(c)+14,y0(r)],[x0(c)+14,y0(r)+H]]);Ln([[x0(c)+W-14,y0(r)],[x0(c)+W-14,y0(r)+H]]);}, '子程序 Subroutine');
cell((c,r)=>poly(c,r,W*.9,H,[[.2,0],[.8,0],[1,.5],[.8,1],[.2,1],[0,.5]]), '准备 Preparation（六边）');
cell((c,r)=>poly(c,r,W,H,[[.18,0],[.82,0],[1,1],[0,1]]), '手工操作 Manual-Op（梯形）');
cell((c,r)=>{Ln(closed([[x0(c),y0(r)],[x0(c)+W-H/2,y0(r)],...arc(x0(c)+W-H/2,r,H/2,H/2,-Math.PI/2,Math.PI/2),[x0(c)+W-H/2,y0(r)+H],[x0(c),y0(r)+H]]));}, '延迟 Delay（D 形）');
cell((c,r)=>poly(c,r,W,H,[[.16,0],[.84,0],[1,.28],[1,1],[0,1],[0,.28]]), '循环界限 Loop-limit');

// --- Control ---
cell((c,r)=>R(x0(c)+22,y0(r),W-44,H,{round:true}), '起止 Terminator（胶囊）');
cell((c,r)=>Dm(x0(c),y0(r)-4,W,H+8,{stroke:BLUE,bg:BLUEBG}), '判定 Decision（菱形）');
cell((c,r)=>poly(c,r,W*.8,H,[[0,0],[1,0],[.5,1]]), '汇合 Merge（倒三角）');
cell((c,r)=>{El(x0(c)+(W-H)/2,y0(r),H,H);Ln([[c,y0(r)],[c,y0(r)+H]]);Ln([[c-H/2,r],[c+H/2,r]]);}, '或 Or（圆十字）');
cell((c,r)=>{El(x0(c)+(W-H)/2,y0(r),H,H);const k=H*0.354;Ln([[c-k,r-k],[c+k,r+k]]);Ln([[c-k,r+k],[c+k,r-k]]);}, '汇总 Summing（圆叉）');

// --- Input / Output ---
cell((c,r)=>poly(c,r,W,H,[[.18,0],[1,0],[.82,1],[0,1]]), '输入输出 I/O（平行四边形）');
cell((c,r)=>poly(c,r,W,H,[[0,.28],[1,0],[1,1],[0,1]]), '手工输入 Manual-Input（斜顶）');
cell((c,r)=>{const x=x0(c),y=y0(r);Ln(closed([[x,y],[x+W,y],[x+W,y+H*.78],[x+W*.66,y+H],[x+W*.33,y+H*.72],[x,y+H]]),{round:true});}, '文档 Document（波形底）');
cell((c,r)=>{for(const d of [8,4,0]){const x=x0(c)+d,y=y0(r)+d;Ln(closed([[x,y],[x+W-8,y],[x+W-8,y+H*.7],[x+(W-8)*.66,y+H*.9],[x+(W-8)*.33,y+H*.62],[x,y+H*.9]]),{round:true});}}, '多文档 Multi-document');
cell((c,r)=>{const x=x0(c),y=y0(r);Ln(closed([...arc(x+H*.5,r,H*.5,H*.5,Math.PI/2,Math.PI*1.5,8),[x+W*.8,y],[x+W,r],[x+W*.8,y+H]]));}, '显示 Display（屏幕形）');
cell((c,r)=>poly(c,r,W,H,[[.16,0],[1,0],[1,1],[0,1],[0,.3]]), '卡片 Card（切角）');

// --- Storage ---
cell((c,r)=>{const x=x0(c),y=y0(r);El(x,y,W,H*.42);Ln([[x,y+H*.21],[x,y+H-H*.21]]);Ln([[x+W,y+H*.21],[x+W,y+H-H*.21]]);Ln(arc(x+W/2,y+H-H*.21,W/2,H*.21,0,Math.PI,10));}, '数据库 Database（柱体）');
cell((c,r)=>{const x=x0(c),y=y0(r);Ln(closed([[x+W*.14,y],[x+W,y],[x+W*.86,r],[x+W,y+H],[x+W*.14,y+H],...arc(x+W*.14,r,W*.14,H/2,Math.PI/2,Math.PI*1.5,6)]));}, '存储数据 Stored-data');
cell((c,r)=>{R(x0(c),y0(r),W,H);Ln([[x0(c),y0(r)+16],[x0(c)+W,y0(r)+16]]);Ln([[x0(c)+18,y0(r)],[x0(c)+18,y0(r)+H]]);}, '内部存储 Internal-storage');
cell((c,r)=>{El(x0(c)+(W-H)/2,y0(r),H,H);Ln([[c+H*.35,r+H*.35],[c+H*.6,y0(r)+H+6]]);}, '顺序存储 Tape（磁带）');

// --- Connector / Annotation / Group ---
cell((c,r)=>El(c-20,r-20,40,40), '页内连接 Connector（小圆）');
cell((c,r)=>poly(c,r,W*.8,H,[[0,0],[.72,0],[1,.5],[.72,1],[0,1]]), '跨页连接 Off-page（五边）');
cell((c,r)=>{const x=x0(c),y=y0(r);Ln([[x+18,y],[x,y],[x,y+H],[x+18,y+H]]);T(x+24,r-7,'注释 note',{align:'left',size:11,w:110});}, '注释 Annotation（括号）');
cell((c,r)=>R(x0(c),r-9,W,18,{bg:INK,sw:1}), '并行 Fork/Join（粗条）');
cell((c,r)=>{R(x0(c),y0(r),W,H,{ss:'dashed',stroke:GRAY,sw:1.5,bg:'#f8f9fa'});T(x0(c)+8,y0(r)+6,'子图 Subgraph',{w:120,size:10.5,color:GRAY,align:'left'});}, '分组/子图 Group');

// --- Lines / arrows ---
cell((c,r)=>Ar([[x0(c),r],[x0(c)+W,r]]), '连线 Flow-line（直箭头）');
cell((c,r)=>Ar([[x0(c),r-H/3],[c,r-H/3],[c,r+H/3],[x0(c)+W,r+H/3]]), '肘形 Elbow（直角）');
cell((c,r)=>Ar([[x0(c),r],[x0(c)+W,r]],{ss:'dashed',stroke:GRAY}), '注释连线 Comment-link（虚线）');
cell((c,r)=>{Ar([[x0(c)+30,r],[x0(c)+W,r]]);T(x0(c)-6,r-10,'是 Yes',{align:'left',size:12,w:60});}, '分支标签 Branch-label');

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:'#ffffff',gridSize:20}};
fs.writeFileSync(process.argv[2],JSON.stringify(doc,null,2));
console.log('els',els.length,'shapes~31 →',process.argv[2]);
