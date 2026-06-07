import fs from 'fs';
// mermaid erDiagram → IR
// IR: { nodes:[{id,label,attrs:[{name,type,key}]}], edges:[{a,b,cardA,cardB,line,label}] }
// cardA/cardB = {crow,circle,bars}  （鱼爪/圆圈/竖杠 组合）
const REL = /^("[^"]+"|[\w-]+)\s+([|o{}]{1,2})(--|\.\.)([|o{}]{1,2})\s+("[^"]+"|[\w-]+)\s*(?::\s*(.+))?$/;
const card = t => ({ crow:/[{}]/.test(t), circle:/o/.test(t), bars:(t.match(/\|/g)||[]).length });
const unq = s => s.replace(/^"|"$/g,'');

export function parseER(text){
  const nodes=new Map(); const edges=[];
  const ensure=id=>{ let n=nodes.get(id); if(!n){ n={id,label:id,attrs:[]}; nodes.set(id,n);} return n; };
  let cur=null;
  for(const raw of text.split(/\r?\n/)){
    let line=raw.replace(/%%.*$/,'').trim(); if(!line) continue;
    if(/^erDiagram\b/i.test(line)) continue;
    if(/^(title|direction)\b/i.test(line)) continue;
    if(cur){ if(line==='}'){ cur=null; continue; }
      const t=line.replace(/"[^"]*"/g,'').trim().split(/\s+/);          // 去注释
      if(t[0]){ const key=(line.match(/\b(PK|FK|UK)\b/g)||[]).join(','); cur.attrs.push({type:t[0], name:t[1]||'', key}); }
      continue; }
    let m;
    if((m=line.match(/^("[^"]+"|[\w-]+)\s*\{$/))){ cur=ensure(unq(m[1])); continue; }
    if((m=line.match(REL))){ const a=unq(m[1]), b=unq(m[5]); ensure(a); ensure(b);
      edges.push({ a,b, cardA:card(m[2]), cardB:card(m[4]), line:m[3]==='..'?'dashed':'solid', label:m[6]?m[6].trim():null, from:a, to:b });
      continue; }
  }
  return { nodes:[...nodes.values()], edges };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const c=parseER(fs.readFileSync(process.argv[2],'utf8'));
  const j=JSON.stringify(c,null,2);
  if(process.argv[3]){ fs.writeFileSync(process.argv[3],j); console.log(`${c.nodes.length} entities, ${c.edges.length} relations → ${process.argv[3]}`); }
  else console.log(j);
}
