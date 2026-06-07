import fs from 'fs';
// class 组件库参考表（手绘风）—— 关系标记全手画（svg-export 不支持原生箭头头）
const INK='#1e1e1e', GRAY='#868e96', BLUE='#1971c2', BLUEBG='#a5d8ff';
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=(o={})=>({angle:0,strokeColor:o.stroke??INK,backgroundColor:o.fill??'transparent',fillStyle:o.fs??'solid',strokeWidth:o.sw??1.7,strokeStyle:o.ss??'solid',roughness:o.rough??1,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={})=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:null,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??13)*0.6,height:(o.size??13)+6,angle:0,text:t,fontSize:o.size??13,fontFamily:2,textAlign:o.align??'center',verticalAlign:'top',strokeColor:o.color??INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
// 水平关系标记（标记在左端，朝左）
const rel=(cx,cy,kind,dashed)=>{ const x1=cx-90,x2=cx+90,P=[x1,cy],nb=[x1+20,cy];
  Ln([[x1,cy],[x2,cy]],{ss:dashed?'dashed':'solid',sw:2});
  let ix=P[0]-nb[0],iy=P[1]-nb[1];const L0=Math.hypot(ix,iy);ix/=L0;iy/=L0;const px=-iy,py=ix;const at=(d,s)=>[P[0]-ix*d+px*s,P[1]-iy*d+py*s];
  if(kind==='triangle')Ln([P,at(16,9),at(16,-9),P],{fill:'#fff',sw:2});
  else if(kind==='diamondF')Ln([P,at(11,7.5),at(22,0),at(11,-7.5),P],{fill:INK,sw:2});
  else if(kind==='diamondO')Ln([P,at(11,7.5),at(22,0),at(11,-7.5),P],{fill:'#fff',sw:2});
  else if(kind==='arrow'){Ln([at(14,8),P],{sw:2});Ln([at(14,-8),P],{sw:2});}
};
els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:1180,height:560,angle:0,strokeColor:'transparent',backgroundColor:'#ffffff',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});
T(40,26,'Class 组件库（手绘风）· 关系标记手画 · 供图像模型作生成约束 + 风格参考',{align:'left',size:19,w:1100});

// 类框示例（左上）
const bx=120,by=110,bw=200;
R(bx,by,bw,150,{fill:'#fff'});R(bx,by,bw,30,{fill:BLUEBG,stroke:BLUE});T(bx,by+8,'ClassName',{w:bw,align:'center',size:15});
Ln([[bx,by+30],[bx+bw,by+30]],{sw:1.4});T(bx+10,by+38,'+ attribute: Type',{align:'left',w:bw-16,size:12});T(bx+10,by+60,'- private: int',{align:'left',w:bw-16,size:12});
Ln([[bx,by+86],[bx+bw,by+86]],{sw:1.4});T(bx+10,by+94,'+ method(): Ret',{align:'left',w:bw-16,size:12});T(bx+10,by+116,'# helper(): void',{align:'left',w:bw-16,size:12});
T(bx-10,by+158,'类 Class（名/属性/方法三栏）',{align:'left',w:240,size:12,color:GRAY});

// 接口框（右上）
const ix0=420;R(ix0,by,bw,90,{fill:'#fff'});R(ix0,by,bw,48,{fill:BLUEBG,stroke:BLUE});T(ix0,by+8,'«interface»',{w:bw,align:'center',size:11,color:GRAY});T(ix0,by+26,'Drawable',{w:bw,align:'center',size:15});Ln([[ix0,by+48],[ix0+bw,by+48]],{sw:1.4});T(ix0+10,by+56,'+ draw(): void',{align:'left',w:bw-16,size:12});
T(ix0-10,by+158,'接口 Interface（«stereotype»）',{align:'left',w:240,size:12,color:GRAY});

// 关系标记 6 种（下半）
const RC=[820,820,820], rows=[[820,140,'继承 Inheritance','triangle',false],[820,250,'实现 Realization','triangle',true],[820,360,'组合 Composition','diamondF',false],[1080,140,'聚合 Aggregation','diamondO',false],[1080,250,'关联 Association','arrow',false],[1080,360,'依赖 Dependency','arrow',true]];
// 改为两列布局
const items=[['继承 Inheritance','triangle',false],['实现 Realization','triangle',true],['组合 Composition','diamondF',false],['聚合 Aggregation','diamondO',false],['关联 Association','arrow',false],['依赖 Dependency','arrow',true]];
items.forEach((it,k)=>{ const col=k%2, rw=Math.floor(k/2); const cx=300+col*560, cy=360+rw*70; rel(cx,cy,it[1],it[2]); T(cx-90,cy+14,it[0]+(it[2]?'（虚线）':''),{align:'left',w:260,size:12,color:GRAY}); });

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:'#ffffff',gridSize:20}};
fs.writeFileSync(process.argv[2],JSON.stringify(doc,null,2));
console.log('els',els.length,'→',process.argv[2]);
