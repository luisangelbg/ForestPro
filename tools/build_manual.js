/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Turns docs/manual.md into docs/manual.html: one self-contained page with a table of contents, the logo, styles for
   the screen and for printing (letter size, a chapter per page), light and dark themes.   node tools/build_manual.js

   The Markdown it reads is the plain kind the manual uses: headings (#, ##, ###), paragraphs, **bold**, *italics*,
   `code`, <links>, [text](url), lists (- and 1.), quotes (>), tables with a header row, fenced code (```) and HTML
   blocks or inline HTML, which pass through untouched. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'docs', 'manual.md'), 'utf8').replace(/\r\n/g, '\n');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/* inline: code first (kept apart), then links, bold and italics; HTML tags pass through */
function inline(t) {
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (m, c) => { codes.push('<code>' + esc(c) + '</code>'); return '\u0000' + (codes.length - 1) + '\u0000'; });
  t = t.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/<(https?:\/\/[^>\s]+)>/g, '<a href="$1">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[\s(«])\*([^*\s][^*]*?)\*(?=[\s).,;:»]|$)/g, '$1<em>$2</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => codes[+i]);
}
const lines = src.split('\n');
let html = '', i = 0;
const toc = [];
const isBlockStart = l => /^(#{1,3} |```|> |- |\d+\. |\||<)/.test(l) || l.trim() === '';
while (i < lines.length) {
  const l = lines[i];
  if (!l.trim()) { i++; continue; }
  let m;
  if ((m = /^(#{1,3}) (.*)$/.exec(l))) {
    const lv = m[1].length, text = m[2], id = slug(text);
    if (lv > 1) toc.push({ lv, text, id });
    const cls = lv === 2 && /^(Capítulo|Apéndice)/.test(text) ? ' class="chapter"' : '';
    html += `<h${lv} id="${id}"${cls}>${inline(text)}</h${lv}>\n`;
    i++; continue;
  }
  if (l.startsWith('```')) {
    const buf = []; i++;
    while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
    i++;
    html += '<pre><code>' + esc(buf.join('\n')) + '</code></pre>\n';
    continue;
  }
  if (l.startsWith('<')) {   /* an HTML block: up to the closing of its first tag, or a blank line */
    const tag = (/^<([a-zA-Z0-9]+)/.exec(l) || [])[1];
    const buf = [];
    if (tag && !new RegExp('</' + tag + '>\\s*$').test(l)) {
      while (i < lines.length) { buf.push(lines[i]); if (new RegExp('^</' + tag + '>').test(lines[i].trim()) && buf.length > 1) { i++; break; } i++; }
    } else { while (i < lines.length && lines[i].trim()) buf.push(lines[i++]); }
    html += buf.join('\n') + '\n';
    continue;
  }
  if (l.startsWith('> ')) {
    const buf = [];
    while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
    html += '<blockquote><p>' + inline(buf.join(' ')) + '</p></blockquote>\n';
    continue;
  }
  if (l.startsWith('|')) {
    const rows = [];
    while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
    const cells = r => r.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
    const head = cells(rows[0]), al = cells(rows[1]).map(a => /:$/.test(a) ? ' class="num"' : '');
    html += '<div class="tbl"><table><thead><tr>' + head.map((c, j) => `<th${al[j]}>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
    rows.slice(2).forEach(r => { html += '<tr>' + cells(r).map((c, j) => `<td${al[j] || ''}>${inline(c)}</td>`).join('') + '</tr>'; });
    html += '</tbody></table></div>\n';
    continue;
  }
  if (/^(- |\d+\. )/.test(l)) {
    const ordered = /^\d+\. /.test(l), items = [];
    while (i < lines.length && (/^(- |\d+\. )/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
      if (/^(- |\d+\. )/.test(lines[i])) items.push(lines[i].replace(/^(- |\d+\. )/, ''));
      else items[items.length - 1] += ' ' + lines[i].trim();
      i++;
    }
    const t = ordered ? 'ol' : 'ul';
    html += `<${t}>` + items.map(x => '<li>' + inline(x) + '</li>').join('') + `</${t}>\n`;
    continue;
  }
  const buf = [];
  while (i < lines.length && !isBlockStart(lines[i])) buf.push(lines[i++]);
  if (!buf.length) buf.push(lines[i++]);
  html += '<p>' + inline(buf.join(' ')) + '</p>\n';
}

/* the logo, from the app's own drawing */
const ctx = { Math, JSON, Array, Object, Number, String, T: es => es };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'art.js'), 'utf8'), ctx);
const logo = ctx.Art.logo(72);

const tocHtml = '<nav class="toc" aria-label="Contenido"><h2>Contenido</h2><ol>' + toc.filter(t => t.lv === 2).map(t => {
  const subs = toc.slice(toc.indexOf(t) + 1);
  const next = subs.findIndex(s => s.lv === 2);
  const kids = (next < 0 ? subs : subs.slice(0, next)).filter(s => s.lv === 3);
  return `<li><a href="#${t.id}">${inline(t.text)}</a>` + (kids.length ? '<ol>' + kids.map(k => `<li><a href="#${k.id}">${inline(k.text)}</a></li>`).join('') + '</ol>' : '') + '</li>';
}).join('') + '</ol></nav>';

const CSS = `
:root{--ink:#1b211b;--muted:#566156;--line:#d6ddd2;--soft:#f2f5ef;--primary:#1B5E20;--accent:#5D4037;--moss:#558B2F;--bg:#ffffff;--link:#1B5E20}
@media (prefers-color-scheme: dark){:root{--ink:#e6eae2;--muted:#a9b3a6;--line:#2f3a2f;--soft:#182018;--primary:#81C784;--accent:#BCAAA4;--moss:#9CCC65;--bg:#0e130e;--link:#9CCC65}}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
main{max-width:880px;margin:0 auto;padding:32px 24px 80px}
a{color:var(--link)}
.cover{display:flex;gap:20px;align-items:center;border-bottom:3px solid var(--primary);padding-bottom:18px;margin-bottom:8px}
.cover svg{flex:0 0 auto}
h1{font-size:2rem;line-height:1.2;margin:0;color:var(--primary)}
h2{font-size:1.45rem;color:var(--primary);margin:44px 0 10px;padding-bottom:4px;border-bottom:1px solid var(--line)}
h3{font-size:1.12rem;margin:28px 0 8px;color:var(--accent)}
p,li{hyphens:auto}
code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.88em;background:var(--soft);padding:1px 4px;border-radius:4px}
pre{background:var(--soft);border-radius:8px;padding:12px 14px;overflow-x:auto;font-size:.85rem}
pre code{background:none;padding:0}
blockquote{margin:12px 0;padding:8px 16px;border-left:4px solid var(--moss);background:var(--soft);border-radius:0 8px 8px 0}
.tbl{overflow-x:auto;margin:10px 0 16px}
table{border-collapse:collapse;width:100%;font-size:.88rem;font-variant-numeric:tabular-nums}
th,td{border-bottom:1px solid var(--line);padding:5px 8px;text-align:left;vertical-align:top}
th{background:var(--soft)}
.num{text-align:right}
.method{border:1px dashed var(--line);border-radius:10px;padding:4px 16px;margin:8px 0 12px;font-size:.94rem}
.method .table-scroll{overflow-x:auto}
.method table{font-size:.8rem}
.toc{background:var(--soft);border-radius:12px;padding:6px 22px 14px;margin:24px 0}
.toc h2{border:0;margin:12px 0 4px;font-size:1.1rem}
.toc ol{padding-left:0;margin:4px 0;list-style:none}
.toc ol ol{padding-left:18px}
.toc ol ol{font-size:.88rem;columns:2;column-gap:28px}
.toc li{margin:2px 0}
@media (max-width:640px){main{padding:20px 16px 60px}.cover{flex-direction:column;align-items:flex-start}.toc ol ol{columns:1}}
@media print{
  :root{--ink:#111;--muted:#444;--line:#ccc;--soft:#f3f3f3;--primary:#1B5E20;--accent:#5D4037;--bg:#fff;--link:#111}
  body{font-size:10.5pt}
  main{max-width:none;padding:0}
  h2.chapter{break-before:page}
  h2,h3{break-after:avoid}
  table,pre,blockquote,.method{break-inside:avoid}
  a{text-decoration:none}
  @page{size:letter;margin:20mm 18mm}
}`;

/* the title goes next to the logo; the contents, before the introduction */
const h1 = /^<h1 id="[^"]*">([\s\S]*?)<\/h1>\n/.exec(html);
const body = (h1 ? html.slice(h1[0].length) : html).replace(/(<h2 id="introduccion")/, tocHtml + '\n$1');
const out = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manual de ForestPro</title><meta name="description" content="Manual de usuario de ForestPro 1.0.0: inventario forestal, dasometría, biomasa, carbono y agroforestería en el navegador.">
<meta name="color-scheme" content="light dark"><style>${CSS}</style></head>
<body><main>
<header class="cover">${logo}<div><h1>${h1 ? h1[1] : 'Manual de ForestPro'}</h1></div></header>
${body}</main></body></html>
`;
fs.writeFileSync(path.join(root, 'docs', 'manual.html'), out);
console.log('docs/manual.html: ' + Math.round(out.length / 1024) + ' KB, ' + toc.filter(t => t.lv === 2).length + ' capítulos y secciones mayores');
