import fs from 'fs';
// ER 组件库参考表（手绘风）—— 鱼爪基数手画
const INK='#1e1e1e', GRAY='#868e96', BLUE='#1971c2', BLUEBG='#a5d8ff';
let sid=1; const id=p=>`${p}${sid++}`; const els=[]; const rnd=()=>(sid*7919)%999983;
const base=(o={})=>({angle:0,strokeColor:o.stroke??INK,backgroundColor:o.fill??'transparent',fillStyle:o.fs??'solid',strokeWidth:o.sw??1.7,strokeStyle:o.ss??'solid',roughness:o.rough??1,opacity:100,seed:rnd(),groupIds:[]});
const R=(x,y,w,h,o={})=>els.push({type:'rectangle',id:id('r'),x,y,width:w,height:h,roundness:null,...base(o)});
const El=(x,y,w,h,o={})=>els.push({type:'ellipse',id:id('e'),x,y,width:w,height:h,...base(o)});
const Ln=(pts,o={})=>{const x=pts[0][0],y=pts[0][1];els.push({type:'line',id:id('l'),x,y,width:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),height:Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1])),points:pts.map(p=>[p[0]-x,p[1]-y]),roundness:null,...base(o)});};
const T=(x,y,t,o={})=>els.push({type:'text',id:id('t'),x,y,width:o.w??t.length*(o.size??13)*0.6,height:(o.size??13)+6,angle:0,text:t,fontSize:o.size??13,fontFamily:2,textAlign:o.align??'left',verticalAlign:'top',strokeColor:o.color??INK,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,seed:rnd(),groupIds:[]});
// 水平关系，基数标记画在右端（朝右进实体），d=描述符
const cardSym=(cx,cy,d)=>{ const P=[cx+90,cy],nb=[cx-90,cy]; Ln([[cx-90,cy],[cx+90,cy]],{sw:2});
  let ix=P[0]-nb[0],iy=P[1]-nb[1];const L=Math.hypot(ix,iy);ix/=L;iy/=L;const px=-iy,py=ix;const at=(dist,s)=>[P[0]-ix*dist+px*s,P[1]-iy*dist+py*s];
  let cur=0;
  if(d.crow){const A=at(16,0);Ln([A,[P[0]+px*11,P[1]+py*11]],{sw:2});Ln([A,P],{sw:2});Ln([A,[P[0]-px*11,P[1]-py*11]],{sw:2});cur=18;}
  if(d.bars>=1)Ln([at(cur+10,8),at(cur+10,-8)],{sw:2});
  if(d.bars>=2)Ln([at(cur+17,8),at(cur+17,-8)],{sw:2});
  if(d.circle){const c=at(cur+(d.bars?22:12),0);El(c[0]-5,c[1]-5,10,10,{fill:'#fff',sw:2});}
};
els.push({type:'rectangle',id:id('bg'),x:0,y:0,width:1180,height:520,angle:0,strokeColor:'transparent',backgroundColor:'#ffffff',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,roundness:null,opacity:100,seed:rnd(),groupIds:[]});
T(40,26,'ER 组件库（手绘风）· 鱼爪基数手画 · 供图像模型作生成约束 + 风格参考',{align:'left',size:19,w:1100});

// 实体框示例
const bx=120,by=110,bw=220;
R(bx,by,bw,124,{fill:'#fff'});R(bx,by,bw,32,{fill:BLUEBG,stroke:BLUE});T(bx,by+9,'ENTITY',{w:bw,align:'center',size:15});
Ln([[bx,by+32],[bx+bw,by+32]],{sw:1.4});
T(bx+12,by+40,'id : int  PK',{align:'left',w:bw-16,size:13});T(bx+12,by+62,'name : string',{align:'left',w:bw-16,size:13});T(bx+12,by+84,'owner : int  FK',{align:'left',w:bw-16,size:13});
T(bx-10,by+132,'实体 Entity（名 + 属性行 + PK/FK）',{align:'left',w:280,size:12,color:GRAY});

// 基数 4 种
const items=[['有且仅一 one (||)',{bars:2}],['零或一 zero-or-one (o|)',{bars:1,circle:true}],['一或多 one-or-many (|{)',{crow:true,bars:1}],['零或多 zero-or-many (o{)',{crow:true,circle:true}]];
items.forEach((it,k)=>{ const col=k%2, rw=Math.floor(k/2); const cx=320+col*520, cy=330+rw*90; cardSym(cx,cy,it[1]); T(cx-90,cy+16,it[0],{align:'left',w:280,size:12,color:GRAY}); });

const doc={type:'excalidraw',version:2,source:'excali-design',elements:els,appState:{viewBackgroundColor:'#ffffff',gridSize:20}};
fs.writeFileSync(process.argv[2],JSON.stringify(doc,null,2));
console.log('els',els.length,'→',process.argv[2]);
