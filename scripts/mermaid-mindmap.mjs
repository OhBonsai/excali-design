import fs from 'fs';
// mermaid mindmap → IR 树  { id?, label, shape, icon?, _boundary?, _summary?, children:[...] }
//   缩进定层级。形状：((x))=circle {{x}}=hexagon )x(=cloud [x]=square (x)=rounded 其余=text
//   形状前可带 id：A(Frontend) → id=A,label=Frontend（供 ::link 引用）。
// 扩展指令（XMind 概念，mermaid 原生没有，紧跟目标节点之后写）：
//   ::icon(name)         给上一个节点加图标
//   ::boundary[(color)]  给上一个节点的「整棵子树」加虚线边界框
//   ::summary(label)     给上一个节点的「直接子节点」加花括号归并 + 标签
//   ::note(text)         给上一个节点挂一张便签（note callout）
//   ::link(A, B[, label]) 顶层：A/B 按 label 或 id 匹配两节点，画跨枝弯曲虚线（可带标签）

function nodeText(s){
  s = s.replace(/:::[\w-]+/g,'').trim();               // class（忽略）
  let icon=null; s = s.replace(/::icon\(([^)]*)\)/g,(_,i)=>{ icon=i.trim(); return ''; }).trim();
  let m, shape='text', label=s, id=null;
  if((m=s.match(/^([\w-]*)\(\((.+)\)\)$/)))      { id=m[1]||null; label=m[2]; shape='circle'; }
  else if((m=s.match(/^([\w-]*)\{\{(.+)\}\}$/))) { id=m[1]||null; label=m[2]; shape='hexagon'; }
  else if((m=s.match(/^([\w-]*)\)(.+)\($/)))     { id=m[1]||null; label=m[2]; shape='cloud'; }
  else if((m=s.match(/^([\w-]*)\[(.+)\]$/)))     { id=m[1]||null; label=m[2]; shape='square'; }
  else if((m=s.match(/^([\w-]*)\((.+)\)$/)))     { id=m[1]||null; label=m[2]; shape='rounded'; }
  else label = s.replace(/^["']|["']$/g,'');
  return { id, label: label.replace(/<br\s*\/?>/gi,'\n'), shape, icon };
}

export function parseMindmap(text){
  const stack=[]; let root=null; const links=[];
  for(const raw of text.split(/\r?\n/)){
    if(/^\s*%%/.test(raw) || !raw.trim()) continue;
    if(/^\s*mindmap\b/i.test(raw)) continue;
    const indent = raw.match(/^\s*/)[0].replace(/\t/g,'  ').length;
    const content = raw.trim();
    // ---- 指令（不入树，紧跟目标节点）----
    if(/^::/.test(content)){
      const top = stack.length ? stack[stack.length-1].node : null;
      let m;
      if((m=content.match(/^::icon\(([^)]*)\)/i)))      { if(top) top.icon=m[1].trim(); }
      else if((m=content.match(/^::boundary(?:\(([^)]*)\))?/i))) { if(top) top._boundary=(m[1]&&m[1].trim())||true; }
      else if((m=content.match(/^::summary\(([^)]*)\)/i)))      { if(top) top._summary=m[1].trim(); }
      else if((m=content.match(/^::note\(([^)]*)\)/i)))         { if(top) top._note=m[1].trim(); }
      else if((m=content.match(/^::link\(([^)]*)\)/i)))         { const p=m[1].split(',').map(s=>s.trim());
        if(p.length>=2) links.push({a:p[0], b:p[1], label:p[2]||''}); }
      continue;
    }
    const node = { ...nodeText(content), children:[] };
    while(stack.length && stack[stack.length-1].indent >= indent) stack.pop();
    if(!stack.length){ if(!root){ root=node; } else { root.children.push(node); } }
    else stack[stack.length-1].node.children.push(node);
    stack.push({ indent, node });
  }
  root = root || { label:'(empty)', shape:'circle', children:[] };
  if(links.length) root._links = links;
  return root;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const r=parseMindmap(fs.readFileSync(process.argv[2],'utf8'));
  const count=n=>1+n.children.reduce((s,c)=>s+count(c),0);
  const j=JSON.stringify(r,null,2);
  if(process.argv[3]){ fs.writeFileSync(process.argv[3],j); console.log(`root "${r.label}", ${count(r)} nodes → ${process.argv[3]}`); }
  else console.log(j);
}
