import fs from 'fs';
// mermaid classDiagram → IR
// IR: { nodes:[{id,label,stereotype?,attrs:[..],methods:[..]}],
//       edges:[{a,b,markerA,markerB,line:'solid'|'dashed',cardA?,cardB?,label?,from,to}] }
// markerA/markerB ∈ null|'triangle'|'diamondF'|'diamondO'|'arrow'

const REL = /^(\w+)\s*(?:"([^"]*)")?\s*([<>o*|.\-]{2,})\s*(?:"([^"]*)")?\s*(\w+)\s*(?::\s*(.+))?$/;

function leftMarker(op){ if(op.startsWith('<|'))return'triangle'; if(op.startsWith('*'))return'diamondF'; if(op.startsWith('o'))return'diamondO'; if(op.startsWith('<'))return'arrow'; return null; }
function rightMarker(op){ if(op.endsWith('|>'))return'triangle'; if(op.endsWith('*'))return'diamondF'; if(op.endsWith('o'))return'diamondO'; if(op.endsWith('>'))return'arrow'; return null; }

export function parseClass(text){
  const nodes=new Map(); const edges=[];
  const ensure=id=>{ let n=nodes.get(id); if(!n){ n={id,label:id,attrs:[],methods:[]}; nodes.set(id,n);} return n; };
  const member=(n,raw)=>{ let s=raw.trim(); if(!s) return; const st=s.match(/^<<(.+)>>$/); if(st){ n.stereotype=st[1]; return; }
    if(/[()]/.test(s)) n.methods.push(s); else n.attrs.push(s); };
  let cur=null;
  for(const raw of text.split(/\r?\n/)){
    let line=raw.replace(/%%.*$/,'').trim(); if(!line) continue;
    if(/^classDiagram(-v2)?\b/i.test(line)) continue;
    if(/^(direction|title|accTitle|accDescr|classDef|style|click|note)\b/i.test(line)) continue;
    if(cur){ if(line==='}'){ cur=null; continue; } member(cur, line); continue; }
    let m;
    if((m=line.match(/^class\s+(\w+)(?:\s*~.+~)?\s*\{$/i))){ cur=ensure(m[1]); continue; }
    if((m=line.match(/^class\s+(\w+)(?:\s+as\s+(.+))?$/i))){ const n=ensure(m[1]); if(m[2])n.label=m[2].trim(); continue; }
    // inline member:  Foo : +bar() void   或  Foo : -baz int
    if((m=line.match(/^(\w+)\s*:\s*(.+)$/)) && !REL.test(line)){ member(ensure(m[1]), m[2]); continue; }
    // relationship
    if((m=line.match(REL))){
      const [,A,cardA,op,cardB,B,label]=m; ensure(A); ensure(B);
      const mA=leftMarker(op), mB=rightMarker(op), dashed=op.includes('..');
      // 层级方向：父/整体在上
      let from=A,to=B;
      if(mA==='triangle'||mA==='diamondF'||mA==='diamondO') { from=A; to=B; }
      else if(mB==='triangle'){ from=B; to=A; }
      else { from=A; to=B; }
      edges.push({ a:A,b:B,markerA:mA,markerB:mB,line:dashed?'dashed':'solid', cardA:cardA||null, cardB:cardB||null, label:label?label.trim():null, from, to });
      continue;
    }
  }
  return { nodes:[...nodes.values()], edges };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const c=parseClass(fs.readFileSync(process.argv[2],'utf8'));
  const j=JSON.stringify(c,null,2);
  if(process.argv[3]){ fs.writeFileSync(process.argv[3],j); console.log(`${c.nodes.length} classes, ${c.edges.length} relations → ${process.argv[3]}`); }
  else console.log(j);
}
