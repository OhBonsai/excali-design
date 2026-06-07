import fs from 'fs';
// mermaid sequenceDiagram → IR
// IR: { actors:[{id,label}], events:[ {kind:'msg',from,to,text,line:'solid'|'dotted',head,act:+1|-1|0}
//                                   | {kind:'note',pos:'over'|'right'|'left',actors:[id],text} ],
//      blocks:[{kind,label,start,end,elses:[{at,label}]}] }   // start/end = event index (inclusive)

const ARROW = /^(\w+)\s*(--?)(>>|\)|>|x)\s*([+-]?)\s*(\w+)\s*:\s*(.+)$/;
const headMap = { '>>':'sync', '>':'open', ')':'async', 'x':'cross' };

export function parseSequence(text){
  const actors = []; const seen = new Set();
  const events = []; const blocks = []; const stack = [];
  const reg = (id, label) => { if(!seen.has(id)){ seen.add(id); actors.push({id, label: label||id}); } else if(label){ const a=actors.find(x=>x.id===id); if(a&&a.label===id) a.label=label; } };
  for(const raw of text.split(/\r?\n/)){
    let line = raw.replace(/%%.*$/,'').trim(); if(!line) continue;
    if(/^sequenceDiagram\b/i.test(line)) continue;
    if(/^(autonumber|title|accTitle|accDescr)\b/i.test(line)) continue;
    let m;
    if((m = line.match(/^(participant|actor)\s+(\w+)(?:\s+as\s+(.+))?$/i))){ reg(m[2], m[3]? m[3].trim().replace(/^["']|["']$/g,'') : m[2]); continue; }
    if((m = line.match(/^note\s+(over|right of|left of)\s+(.+?)\s*:\s*(.+)$/i))){
      const pos = m[1].toLowerCase().split(' ')[0]; const acts = m[2].split(',').map(s=>s.trim()); acts.forEach(a=>reg(a));
      events.push({ kind:'note', pos, actors:acts, text:m[3].trim().replace(/<br\s*\/?>/gi,'\n') }); continue;
    }
    if((m = line.match(/^(loop|alt|opt|par|critical|break|rect)\b\s*(.*)$/i))){ stack.push({ kind:m[1].toLowerCase(), label:m[2].trim(), start:events.length, elses:[] }); continue; }
    if((m = line.match(/^else\b\s*(.*)$/i))){ const b=stack[stack.length-1]; if(b) b.elses.push({ at:events.length, label:m[1].trim() }); continue; }
    if((m = line.match(/^and\b\s*(.*)$/i))){ const b=stack[stack.length-1]; if(b) b.elses.push({ at:events.length, label:m[1].trim() }); continue; }
    if(/^end$/i.test(line)){ const b=stack.pop(); if(b){ b.end=events.length-1; blocks.push(b); } continue; }
    if((m = line.match(ARROW))){
      const [,from,dash,head,actMark,to,txt] = m; reg(from); reg(to);
      events.push({ kind:'msg', from, to, text:txt.trim().replace(/<br\s*\/?>/gi,'\n'),
        line: dash==='--'?'dotted':'solid', head: headMap[head]||'open',
        act: actMark==='+'?1 : actMark==='-'?-1 : 0 });
      continue;
    }
    // ignore unknown
  }
  // 关闭未闭合 block
  while(stack.length){ const b=stack.pop(); b.end=events.length-1; blocks.push(b); }
  return { actors, events, blocks };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const c = parseSequence(fs.readFileSync(process.argv[2],'utf8'));
  const j = JSON.stringify(c,null,2);
  if(process.argv[3]){ fs.writeFileSync(process.argv[3],j); console.log(`${c.actors.length} actors, ${c.events.length} events, ${c.blocks.length} blocks → ${process.argv[3]}`); }
  else console.log(j);
}
