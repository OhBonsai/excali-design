import fs from 'fs';
// mermaid stateDiagram(-v2) → IR  { direction, nodes:[{id,label,type}], edges:[{from,to,label?}] }
// type: initial(起始圆点) | final(终止环) | state(状态圆角框) | choice(菱形) | fork | join
const START='__start', END='__end';

export function parseState(text){
  const nodes=new Map(); const edges=[]; let direction='TD';
  const ensure=(id,type,label)=>{ let n=nodes.get(id); if(!n){ n={id,label:label??id,type:type??'state'}; nodes.set(id,n);} else { if(type)n.type=type; if(label!=null)n.label=label;} return n; };
  let skipNote=false;
  for(const raw of text.split(/\r?\n/)){
    let line=raw.replace(/%%.*$/,'').trim(); if(!line) continue;
    if(/^stateDiagram(-v2)?\b/i.test(line)) continue;
    if(/^(title|accTitle|accDescr|classDef|class\s)/i.test(line)) continue;
    if(skipNote){ if(/^end note$/i.test(line)) skipNote=false; continue; }
    let m;
    if((m=line.match(/^direction\s+(TB|TD|BT|LR|RL)\b/i))){ const d=m[1].toUpperCase(); direction=(d==='LR'||d==='RL')?'LR':'TD'; continue; }
    if((m=line.match(/^note\s+(?:left|right)\s+of\s+\w+\s*:\s*.+$/i))) continue;            // 单行 note，忽略
    if((m=line.match(/^note\b/i))){ skipNote=true; continue; }                               // 块 note，忽略到 end note
    if(/^\}$/.test(line)) continue;                                                          // 复合状态闭合
    // state 声明
    if((m=line.match(/^state\s+"(.+?)"\s+as\s+(\w+)/i))){ ensure(m[2],'state',m[1]); continue; }
    if((m=line.match(/^state\s+(\w+)\s*<<(choice|fork|join)>>/i))){ ensure(m[1], m[2].toLowerCase()==='choice'?'choice':m[2].toLowerCase()); continue; }
    if((m=line.match(/^state\s+(\w+)\s*\{?\s*$/i))){ ensure(m[1],'state'); continue; }       // 复合/简单状态声明（忽略花括号嵌套）
    // 转移： A --> B : label
    if((m=line.match(/^(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)\s*(?::\s*(.+))?$/))){
      const from=m[1]==='[*]'?START:m[1], to=m[2]==='[*]'?END:m[2];
      if(m[1]==='[*]') ensure(START,'initial',''); else ensure(from);
      if(m[2]==='[*]') ensure(END,'final',''); else ensure(to);
      edges.push(m[3]?{from,to,label:m[3].trim().replace(/<br\s*\/?>/gi,'\n')}:{from,to});
      continue;
    }
  }
  return { direction, nodes:[...nodes.values()], edges };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const c=parseState(fs.readFileSync(process.argv[2],'utf8'));
  const j=JSON.stringify(c,null,2);
  if(process.argv[3]){ fs.writeFileSync(process.argv[3],j); console.log(`${c.nodes.length} states, ${c.edges.length} transitions → ${process.argv[3]}`); }
  else console.log(j);
}
