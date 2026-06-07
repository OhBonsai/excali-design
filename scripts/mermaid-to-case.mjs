import fs from 'fs';
// mermaid flowchart 语法 → renderFlowchart 的 case 对象
// 支持：flowchart/graph TD|TB|LR|RL；节点形状；边(--> --- -.-> ==>，|label| 与 -- label -->)；subgraph→泳道
// 形状映射：([..])起止 [[..]]子程序 [(..)]数据库 ((..))连接 {{..}}准备 {..}判定
//          [/../]输入输出 [\..\]输入输出 [/..\]手工 [\../]手工 >..]文档 (..)处理 [..]处理

function norm(s){ return s.replace(/<br\s*\/?>/gi,'\n').replace(/^["'](.*)["']$/,'$1').trim(); }

function extractNodes(line, cb){
  const SH=[
    [/([A-Za-z0-9_]+)\(\[(.+?)\]\)/g,'se'],         // ([..]) stadium
    [/([A-Za-z0-9_]+)\[\[(.+?)\]\]/g,'subroutine'], // [[..]]
    [/([A-Za-z0-9_]+)\[\((.+?)\)\]/g,'data'],       // [(..)]
    [/([A-Za-z0-9_]+)\(\((.+?)\)\)/g,'connector'],  // ((..))
    [/([A-Za-z0-9_]+)\{\{(.+?)\}\}/g,'preparation'],// {{..}}
    [/([A-Za-z0-9_]+)\[\/(.+?)\\\]/g,'manual'],     // [/..\]
    [/([A-Za-z0-9_]+)\[\\(.+?)\/\]/g,'manual'],     // [\../]
    [/([A-Za-z0-9_]+)\[\/(.+?)\/\]/g,'io'],         // [/../]
    [/([A-Za-z0-9_]+)\[\\(.+?)\\\]/g,'io'],         // [\..\]
    [/([A-Za-z0-9_]+)>(.+?)\]/g,'document'],        // >..]
    [/([A-Za-z0-9_]+)\{(.+?)\}/g,'decision'],       // {..}
    [/([A-Za-z0-9_]+)\((.+?)\)/g,'altprocess'],     // (..)
    [/([A-Za-z0-9_]+)\[(.+?)\]/g,'process'],        // [..]
  ];
  for(const [re,type] of SH) line=line.replace(re,(_,id,txt)=>{ cb(id,type,norm(txt)); return id; });
  return line;
}

function parseEdges(line, addEdge){
  line=line.replace(/--\s+(.+?)\s+-->/g,'-->|$1|').replace(/-\.\s+(.+?)\s+\.->/g,'-.->|$1|');
  const sep=/\s*(?:<-->|-->|---|-\.->|-\.-|===|==>|--[ox]|[ox]--[ox])\s*(?:\|\s*([^|]*?)\s*\|\s*)?/g;
  const seps=[]; let mm; while((mm=sep.exec(line))) seps.push({index:mm.index,len:mm[0].length,label:mm[1]||null});
  if(!seps.length) return;
  const parts=[]; let pos=0;
  for(const s of seps){ parts.push(line.slice(pos,s.index).trim()); pos=s.index+s.len; }
  parts.push(line.slice(pos).trim());
  const ID=/^[A-Za-z0-9_]+$/;
  for(let k=0;k<parts.length-1;k++){ const a=parts[k],b=parts[k+1]; if(ID.test(a)&&ID.test(b)) addEdge(a,b,seps[k].label); }
}

export function parseMermaid(text){
  const nodesMap=new Map(); const edges=[]; let direction='TD'; const lanes=[]; let curLane=null;
  const ensure=id=>{ if(!nodesMap.has(id)) nodesMap.set(id,{id,label:id,type:'process'}); return nodesMap.get(id); };
  for(const raw of text.split(/\r?\n/)){
    let line=raw.replace(/%%.*$/,'').trim(); if(!line) continue;
    let h=line.match(/^(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)\b/i);
    if(h){ const d=h[1].toUpperCase(); direction=(d==='LR'||d==='RL')?'LR':'TD'; continue; }
    let sg=line.match(/^subgraph\s+(.+)$/i);
    if(sg){ let t=sg[1].trim(); const m=t.match(/\[\s*"?(.+?)"?\s*\]\s*$/); let name=m?m[1]:t.replace(/^["']|["']$/g,''); curLane=name; if(!lanes.includes(name))lanes.push(name); continue; }
    if(/^end$/i.test(line)){ curLane=null; continue; }
    if(/^(direction|classDef|class|style|linkStyle|click|%)/i.test(line)) continue;
    line=extractNodes(line,(id,type,label)=>{ const n=ensure(id); n.type=type; n.label=label; if(curLane)n.lane=curLane; });
    parseEdges(line,(a,b,label)=>{ ensure(a); ensure(b); edges.push(label?{from:a,to:b,label}:{from:a,to:b}); });
  }
  const indeg={},outdeg={}; for(const e of edges){ outdeg[e.from]=(outdeg[e.from]||0)+1; indeg[e.to]=(indeg[e.to]||0)+1; }
  for(const n of nodesMap.values()){
    if(n.type==='se') n.type=(indeg[n.id]||0)===0?'start':'end';
    if(n.type==='altprocess') n.type='process';
  }
  const out={direction,nodes:[...nodesMap.values()],edges};
  if(lanes.length){ out.lanes=lanes; out.legend=true; }
  return out;
}

// CLI: node mermaid-to-case.mjs <in.mmd> [out.json]
if(import.meta.url===`file://${process.argv[1]}`){
  const txt=fs.readFileSync(process.argv[2],'utf8');
  const c=parseMermaid(txt);
  const j=JSON.stringify(c,null,2);
  if(process.argv[3]){ fs.writeFileSync(process.argv[3],j); console.log(`${c.nodes.length} nodes, ${c.edges.length} edges, lanes=${c.lanes?c.lanes.length:0} → ${process.argv[3]}`); }
  else console.log(j);
}
