import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import fs from 'fs';

const tex = process.argv[2];
const out = process.argv[3];
const color = process.argv[4] || '#1e1e1e';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const html = mathjax.document('', { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: 'none' }) });
const node = html.convert(tex, { display: true });
let svg = adaptor.outerHTML(adaptor.firstChild(node)); // the <svg>
// force color (mathjax uses currentColor)
svg = svg.replace('<svg ', `<svg color="${color}" `).replace(/currentColor/g, color);
fs.writeFileSync(out, svg);
// report size
const m = svg.match(/width="([\d.]+)ex" height="([\d.]+)ex"/);
console.log('wrote', out, m ? `(${m[1]}ex x ${m[2]}ex)` : '');
