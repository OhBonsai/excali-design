// 把 eval/out/<mode>/<col>/<case>/out.png 组装成一张矩阵对比图。
// 行=case，列=变体(或模型)，每格图下标 lint 摘要。依赖 ImageMagick(montage/convert)。
// 用法：node eval/montage.mjs method   |   node eval/montage.mjs model
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const ROOT = new URL('..', import.meta.url).pathname;
const EVAL = ROOT + 'eval';
const mode = process.argv[2] || 'method';
const cases = fs.readFileSync(`${EVAL}/cases.jsonl`,'utf8').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>JSON.parse(l));
const vcfg = JSON.parse(fs.readFileSync(`${EVAL}/variants.json`,'utf8'));
const cols = mode==='method'
  ? vcfg.variants.map(v=>v.name)
  : vcfg._model_matrix.models.map(m=>m.split('/').pop());

const CELL = 300;                 // 每格目标宽
// 只保留至少有一格出图的 case 行，避免把 62 行空格子拼成超限巨图
const rows = cases.filter(cs => cols.some(c => fs.existsSync(`${EVAL}/out/${mode}/${c}/${cs.id}/out.png`)));
if (!rows.length) { console.error('没有任何 out.png，先跑 run.mjs'); process.exit(1); }
const tmp = `${EVAL}/.tiles`; fs.mkdirSync(tmp,{recursive:true});
const tiles = [];

function labelTile(txt, file){ // 纯文字格(表头/占位)
  execSync(`convert -size ${CELL}x40 -background '#f1f3f5' -fill '#1e1e1e' -gravity center -pointsize 16 label:${JSON.stringify(txt)} ${file}`);
}
function metric(dir){
  try{ const t=fs.readFileSync(`${dir}/lint.json`,'utf8'); const m=t.match(/(\d+)\s*error/i), w=t.match(/(\d+)\s*warn/i);
       return `err ${m?m[1]:'?'} · warn ${w?w[1]:'?'}`; }catch{ return 'no lint'; }
}

// 表头行：左上角空 + 每列名
labelTile(mode==='method'?'case \\ variant':'case \\ model', `${tmp}/h_corner.png`); tiles.push(`${tmp}/h_corner.png`);
cols.forEach((c,i)=>{ labelTile(c, `${tmp}/h_${i}.png`); tiles.push(`${tmp}/h_${i}.png`); });

// 每行：行首 case 名 + 各列缩略图(带 metric label)
for(const cs of rows){
  labelTile(cs.id, `${tmp}/r_${cs.id}.png`); tiles.push(`${tmp}/r_${cs.id}.png`);
  cols.forEach((c,i)=>{
    const dir = `${EVAL}/out/${mode}/${c}/${cs.id}`;
    const src = `${dir}/out.png`;
    const tile = `${tmp}/c_${cs.id}_${i}.png`;
    if(fs.existsSync(src)){
      execSync(`convert ${JSON.stringify(src)} -thumbnail ${CELL}x${CELL} -background white -gravity center -extent ${CELL}x${CELL} -gravity south -background '#000000aa' -fill white -pointsize 13 -annotate +0+2 ${JSON.stringify(metric(dir))} ${tile}`);
    } else {
      execSync(`convert -size ${CELL}x${CELL} -background '#fff5f5' -fill '#e03131' -gravity center -pointsize 18 label:'(no output)' ${tile}`);
    }
    tiles.push(tile);
  });
}

const ncol = cols.length + 1;
const outPng = `${EVAL}/matrix-${mode}.png`;
execSync(`montage ${tiles.map(t=>JSON.stringify(t)).join(' ')} -tile ${ncol}x -geometry +6+6 -background white -title ${JSON.stringify('excali-design · '+(mode==='method'?'方法迭代矩阵 (列=变体, 行=case)':'模型矩阵 (列=模型, 行=case)'))} ${JSON.stringify(outPng)}`);
fs.rmSync(tmp,{recursive:true,force:true});
console.log('matrix ->', outPng);
