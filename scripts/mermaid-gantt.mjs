import fs from 'fs';
// mermaid gantt → IR  { title, tasks:[{id,name,section,start,end,status:[],milestone}] }  (start/end = epoch 天数)
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
const dayNum = s => { const [y,m,d]=s.split('-').map(Number); return Math.floor(Date.UTC(y,m-1,d)/86400000); };
const durDays = s => { const m=s.match(/^(\d+(?:\.\d+)?)([dwh])$/); if(!m) return 1; const n=+m[1]; return m[2]==='w'?n*7:m[2]==='h'?n/24:n; };
const STAT = new Set(['done','active','crit','milestone']);

export function parseGantt(text){
  let title=''; const tasks=[]; const byId={}; let section=null; let prevEnd=null;
  for(const raw of text.split(/\r?\n/)){
    let line=raw.replace(/%%.*$/,'').trim(); if(!line) continue;
    if(/^gantt\b/i.test(line)) continue;
    let m;
    if((m=line.match(/^title\s+(.+)$/i))){ title=m[1].trim(); continue; }
    if(/^(dateFormat|axisFormat|excludes|todayMarker|tickInterval|weekday|accTitle|accDescr)\b/i.test(line)) continue;
    if((m=line.match(/^section\s+(.+)$/i))){ section=m[1].trim(); continue; }
    const ci=line.indexOf(':'); if(ci<0) continue;
    const name=line.slice(0,ci).trim(); const fields=line.slice(ci+1).split(',').map(s=>s.trim()).filter(Boolean);
    const status=[]; let idTok=null, startDate=null, endDate=null, dur=null, after=null;
    for(const f of fields){
      if(STAT.has(f)) status.push(f);
      else if(/^after\s+/i.test(f)) after=f.replace(/^after\s+/i,'').split(/\s+/);
      else if(isDate(f)){ if(startDate==null) startDate=dayNum(f); else endDate=dayNum(f); }
      else if(/^\d+(?:\.\d+)?[dwh]$/.test(f)) dur=durDays(f);
      else if(idTok==null) idTok=f;
    }
    const milestone=status.includes('milestone');
    let start;
    if(startDate!=null) start=startDate;
    else if(after) start=Math.max(...after.map(a=>byId[a]?byId[a].end:(prevEnd??0)));
    else start=prevEnd??0;
    let end;
    if(endDate!=null) end=endDate;
    else if(dur!=null) end=start+dur;
    else if(milestone) end=start;
    else end=start+1;
    const t={id:idTok||`t${tasks.length}`, name, section, start, end, status, milestone};
    byId[t.id]=t; tasks.push(t); prevEnd=end;
  }
  return { title, tasks };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const c=parseGantt(fs.readFileSync(process.argv[2],'utf8'));
  const j=JSON.stringify(c,null,2);
  if(process.argv[3]){ fs.writeFileSync(process.argv[3],j); console.log(`"${c.title}" ${c.tasks.length} tasks → ${process.argv[3]}`); }
  else console.log(j);
}
