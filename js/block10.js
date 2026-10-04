/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 10: the report and the project.

   The report gathers what the blocks show (numbers, figures, tables,
   interpretations and, if asked, the methods with their sources) into one
   HTML file that carries everything inside: the figures go as SVG with their
   styles written in and the colours of the light theme, so the file looks the
   same anywhere and prints to PDF from the browser.

   The project is the record of what was done: the data loaded in each data
   card, the fields changed, the editable tables, the buttons pressed and the
   examples opened, in order. Opening it reloads the page and plays the record
   back, so every block computes again exactly what it showed. */
(function () {
'use strict';
const P = { log: [], quietUntil: 0, replaying: false };
const R = {};
const now = () => performance.now();
const quiet = () => P.replaying || now() < P.quietUntil;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BLOCKS = [2, 3, 4, 5, 6, 7, 8, 9];
const stepName = n => { const s = STEPS.find(x => x.n === n); return s ? T(s.es, s.en) : String(n); };
/* NaN and ±Infinity survive the trip through JSON */
const enc = (k, v) => typeof v === 'number' && !isFinite(v) ? (isNaN(v) ? '__NaN__' : v > 0 ? '__Inf__' : '__-Inf__') : v;
const dec = (k, v) => v === '__NaN__' ? NaN : v === '__Inf__' ? Infinity : v === '__-Inf__' ? -Infinity : v;
const copy = x => JSON.parse(JSON.stringify(x, enc), dec);

/* ---------------- the record ---------------- */
function push(ev) {
  const last = P.log[P.log.length - 1];
  const same = last && last.k === ev.k && ((ev.k === 'field' && ev.id === last.id) || (ev.k === 'grid' && ev.key === last.key) || (ev.k === 'op' && ev.block === last.block && ev.op === last.op));
  if (same) P.log[P.log.length - 1] = ev; else P.log.push(ev);
}
document.addEventListener('fp:data', e => {
  const d = e.detail;
  if (quiet() || d.nested) return;
  push(d.meta && d.meta.example ? { k: 'ex', id: d.id, ex: d.meta.example } : { k: 'data', id: d.id, rows: copy(d.rows), name: (d.meta && d.meta.name) || '' });
});
document.addEventListener('fp:grid', e => { if (!quiet()) push({ k: 'grid', key: e.detail.key, rows: copy(e.detail.rows) }); });
document.addEventListener('fp:op', e => { if (!quiet()) push({ k: 'op', block: e.detail.block, op: e.detail.op, data: copy(e.detail.data) }); });
document.addEventListener('click', e => {
  if (quiet()) return;
  const b = e.target && e.target.closest && e.target.closest('button[data-act]');
  if (!b) return;
  push({ k: 'click', act: b.dataset.act });
  P.quietUntil = now() + 800;   /* what the button sets off is not recorded again */
}, true);
document.addEventListener('change', e => {
  if (quiet()) return;
  const t = e.target;
  if (!t || !t.id || !t.closest || t.type === 'file' || t.closest('.data-card') || t.closest('#b10root') || t.dataset.noproject != null) return;
  if (!t.closest('[id^="panel-"]')) return;
  push({ k: 'field', id: t.id, v: t.type === 'checkbox' ? t.checked : t.value });
}, true);

/* the buttons that start an analysis get a stable name: their block and their place when the page is built */
function nameButtons() {
  BLOCKS.forEach(n => {
    const root = el('b' + n + 'root');
    if (!root) return;
    let k = 0;
    root.querySelectorAll('button').forEach(b => { if (b.closest('.data-card, .map-wrap, .edit-grid, .grid-wrap')) return; b.dataset.act = n + '.' + (++k); });
  });
}
/* the examples opened from the home page go into the record too */
function wrapHooks() {
  Object.keys(ExampleHooks).forEach(name => {
    const f = ExampleHooks[name];
    if (f._fp) return;
    const g = function () { if (!quiet()) { push({ k: 'hook', name }); P.quietUntil = now() + 1500; } return f.apply(this, arguments); };
    g._fp = true;
    ExampleHooks[name] = g;
  });
}

/* ---------------- play it back ---------------- */
async function settle(ms) {
  await sleep(ms);
  for (let g = 0; (window.FP_BUSY || 0) > 0 && g < 1200; g++) await sleep(50);
  await sleep(40);
}
async function apply(ev) {
  if (ev.k === 'ex') { const c = UI.cards[ev.id]; if (c) c.load(ev.ex); return !!c; }
  if (ev.k === 'data') { const c = UI.cards[ev.id]; if (c) c.set(ev.rows, { name: ev.name }); return !!c; }
  if (ev.k === 'click') { const b = document.querySelector(`[data-act="${ev.act}"]`); if (b) b.click(); return !!b; }
  if (ev.k === 'hook') { const h = ExampleHooks[ev.name]; if (h) h(); return !!h; }
  if (ev.k === 'field') {
    const t = el(ev.id);
    if (!t) return false;
    if (t.type === 'checkbox') t.checked = !!ev.v; else t.value = ev.v;
    t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  if (ev.k === 'grid') {
    const g = UI.grids[ev.key];
    if (!g) return false;
    g.rows.splice(0, g.rows.length, ...ev.rows); g.draw();
    if (g.o.onChange) g.o.onChange(g.rows, -1);
    return true;
  }
  if (ev.k === 'op') { const o = window.ProjectOps && ProjectOps[ev.block]; if (o && o[ev.op]) { o[ev.op](ev.data); return true; } return false; }
  return false;
}
async function replay(pr) {
  P.replaying = true; window.FP_REPLAY = true;
  const ban = mk('div', { class: 'fp-replay', role: 'status', 'aria-live': 'polite' });
  document.body.appendChild(ban);
  let missed = 0;
  const evs = pr.events || [];
  for (let i = 0; i < evs.length; i++) {
    ban.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${L2('Abriendo el proyecto', 'Opening the project')} · ${i + 1}/${evs.length}`;
    try { if (!(await apply(evs[i]))) missed++; } catch (err) { missed++; console.warn('ForestPro: paso del proyecto', evs[i], err); }
    await settle(evs[i].k === 'hook' || evs[i].k === 'click' || evs[i].k === 'ex' ? 300 : 60);
  }
  ban.remove();
  P.log = evs.slice();
  P.replaying = false; window.FP_REPLAY = false;
  if (pr.report) Object.entries(pr.report).forEach(([id, v]) => { const t = el(id); if (t) { if (t.type === 'checkbox') t.checked = !!v; else t.value = v; } });
  goStep(pr.step || 10);
  const msg = missed ? L2(`Proyecto abierto; ${missed} pasos no se pudieron repetir.`, `Project opened; ${missed} steps could not be repeated.`) : L2('Proyecto abierto: todos los bloques se calcularon de nuevo.', 'Project opened: every block was computed again.');
  if (window.LABG && LABG.toast) LABG.toast(T(missed ? `Proyecto abierto; ${missed} pasos no se pudieron repetir.` : 'Proyecto abierto.', missed ? `Project opened; ${missed} steps could not be repeated.` : 'Project opened.'), { type: missed ? 'warning' : 'success' });
  if (R.proj) { clearMessages(R.proj); showMessage(R.proj, missed ? 'warning' : 'success', msg); }
}

/* ---------------- the project file ---------------- */
function reportFields() {
  const o = {};
  ['b10title', 'b10site', 'b10author', 'b10date', 'b10notes', 'b10methods', 'b10warn'].forEach(id => { const t = el(id); if (t) o[id] = t.type === 'checkbox' ? t.checked : t.value; });
  BLOCKS.forEach(n => { const t = el('b10inc' + n); if (t) o['b10inc' + n] = t.checked; });
  return o;
}
function saveProject() {
  const cur = (document.querySelector('.step-btn.active') || {}).dataset;
  const st = Object.assign({}, state);
  if (st.inv) st.inv = { name: st.inv.name, trees: st.inv.trees.length, plots: st.inv.plots.length };
  delete st.report;
  const pr = { app: 'ForestPro', format: 1, version: window.FP_VERSION, saved: new Date().toISOString(), lang: document.documentElement.lang, step: cur && cur.step ? +cur.step : 10,
    title: el('b10title').value, report: reportFields(), events: P.log, results: st };
  const name = 'forestpro_proyecto_' + (slug(el('b10site').value || el('b10title').value || 'proyecto') || 'proyecto') + '.json';
  download(JSON.stringify(pr, enc, 1), name, 'application/json');
  clearMessages(R.proj);
  showMessage(R.proj, 'success', L2(`Proyecto guardado con ${P.log.length} pasos.`, `Project saved with ${P.log.length} steps.`));
}
async function openProject(file) {
  clearMessages(R.proj);
  let pr;
  try { pr = JSON.parse(await file.text(), dec); } catch (err) { pr = null; }
  if (!pr || pr.app !== 'ForestPro' || !Array.isArray(pr.events)) { showMessage(R.proj, 'danger', L2('El archivo no es un proyecto de ForestPro.', 'The file is not a ForestPro project.')); return; }
  if (pr.format > 1) { showMessage(R.proj, 'warning', L2('El proyecto viene de una versión más nueva de ForestPro; puede que algunos pasos no se repitan.', 'The project comes from a newer version of ForestPro; some steps may not be repeated.')); }
  const busy = !!state.inv || Object.keys(state).some(k => k !== 'report' && k !== 'inv' && state[k]);
  if (busy && !window.confirm(T('Abrir el proyecto reemplaza lo que hay ahora en la app. ¿Continuar?', 'Opening the project replaces what is in the app now. Continue?'))) return;
  /* on a clean page: reload and play it back there */
  try {
    sessionStorage.setItem('forestpro:open', JSON.stringify(pr, enc));
    window.FP_NO_GUARD = true;
    location.reload();
  } catch (err) {
    showMessage(R.proj, 'info', L2('El proyecto se abre sobre lo que ya hay (el navegador no dejó recargar la página limpia).', 'The project opens over what is already there (the browser did not allow a clean reload).'));
    replay(pr);
  }
}
function pendingProject() {
  let txt = null;
  try { txt = sessionStorage.getItem('forestpro:open'); if (txt) sessionStorage.removeItem('forestpro:open'); } catch (err) { txt = null; }
  if (!txt) return;
  let pr = null;
  try { pr = JSON.parse(txt, dec); } catch (err) { pr = null; }
  if (pr) setTimeout(() => replay(pr), 400);
}

/* ---------------- the report ---------------- */
function inLight(fn) {
  const html = document.documentElement, prev = html.getAttribute('data-theme');
  html.setAttribute('data-theme', 'light');
  try { return fn(); } finally { if (prev == null) html.removeAttribute('data-theme'); else html.setAttribute('data-theme', prev); }
}
const SVG_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing', 'text-transform', 'paint-order', 'stop-color', 'stop-opacity', 'visibility', 'display'];
const SVG_DEF = { 'fill-opacity': '1', 'stroke-opacity': '1', 'stroke-dasharray': 'none', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', opacity: '1', 'font-style': 'normal', 'text-anchor': 'start', 'dominant-baseline': 'auto', 'letter-spacing': 'normal', 'text-transform': 'none', 'paint-order': 'normal', 'stop-opacity': '1', visibility: 'visible' };
const normColor = v => v.indexOf('color(srgb') < 0 ? v : v.replace(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([\d.]+%?))?\)/g, (m, r, g, b, a) => {
  const c = x => Math.round(Math.max(0, Math.min(1, +x)) * 255);
  return a == null ? `rgb(${c(r)}, ${c(g)}, ${c(b)})` : `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${/%$/.test(a) ? parseFloat(a) / 100 : +a})`;
});
/* an SVG of the app with its computed styles written in, in the colours of the light theme */
function svgOut(svg) {
  return inLight(() => {
    const clone = svg.cloneNode(true);
    const a = [svg].concat([...svg.querySelectorAll('*')]), b = [clone].concat([...clone.querySelectorAll('*')]);
    for (let i = 0; i < a.length && i < b.length; i++) {
      const cs = getComputedStyle(a[i]), out = [];
      SVG_PROPS.forEach(p => {
        const v = cs.getPropertyValue(p);
        if (!v || v === SVG_DEF[p]) return;
        if (p === 'display' && v !== 'none') return;
        out.push(p + ':' + normColor(v));
      });
      if (out.length) b[i].setAttribute('style', out.join(';'));
      b[i].removeAttribute('class');
      [...b[i].attributes].forEach(at => { if (/^data-(fe-|lfs)/.test(at.name)) b[i].removeAttribute(at.name); });
    }
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && vb.width) { clone.setAttribute('width', vb.width); clone.setAttribute('height', vb.height); }
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.removeAttribute('popover');
    clone.style.maxWidth = '100%'; clone.style.height = 'auto';
    return new XMLSerializer().serializeToString(clone);
  });
}
function imgOut(node) {
  try {
    if (node.tagName === 'CANVAS') return `<img alt="" src="${node.toDataURL('image/png')}">`;
    const c = document.createElement('canvas'); c.width = node.naturalWidth; c.height = node.naturalHeight;
    c.getContext('2d').drawImage(node, 0, 0);
    return `<img alt="" src="${c.toDataURL('image/png')}">`;
  } catch (err) { return ''; }
}
/* the HTML of a piece of the app in the current language, with no controls */
function clean(node) {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  const c = node.cloneNode(true);
  c.querySelectorAll(`[data-l]:not([data-l="${lang}"])`).forEach(n => n.remove());
  c.querySelectorAll('button, input, select, textarea, .btn-row, .tbl-tools, .fig-head .fe-btn, script').forEach(n => n.remove());
  c.querySelectorAll('*').forEach(n => { [...n.attributes].forEach(at => { if (/^(data-|aria-|role|tabindex|id|style)/.test(at.name)) n.removeAttribute(at.name); }); });
  return c;
}
const textOf = node => node ? clean(node).textContent.trim() : '';
function figHTML(fig) {
  const title = textOf(fig.querySelector('.fig-head h4'));
  const body = fig.querySelector('.fig-body');
  let art = '';
  const svg = body && (body.querySelector('svg.pl') || body.querySelector(':scope > svg') || body.querySelector('svg'));
  if (svg) art = svgOut(svg);
  else { const pics = body ? [...body.querySelectorAll('canvas, img')] : []; art = pics.map(imgOut).join(''); }
  const note = fig.querySelector('.fig-note');
  return `<figure>${art}<figcaption><b>${esc(title)}</b>${note ? ' ' + esc(textOf(note)) : ''}</figcaption></figure>`;
}
function tableHTML(card) {
  const title = textOf(card.querySelector('.tbl-title'));
  const tb = card.querySelector('table');
  if (!tb) return '';
  const t = clean(tb);
  const notes = [...card.querySelectorAll(':scope > .hint')].map(textOf).filter(Boolean);
  return `<div class="tbl">${title ? `<h4>${esc(title)}</h4>` : ''}${t.outerHTML}${notes.map(n => `<p class="note">${esc(n)}</p>`).join('')}</div>`;
}
function partsOf(n, o) {
  const root = el('b' + n + 'root');
  if (!root) return null;
  const out = { data: [], cards: [], tiles: null };
  root.querySelectorAll('.data-card .data-status').forEach(s => { const t = textOf(s); if (t) out.data.push(t); });
  const first = root.querySelector('.results-summary .stat-tile') && root.querySelector('.results-summary');
  if (first) out.tiles = clean(first).innerHTML;
  root.querySelectorAll('section.card').forEach(card => {
    const items = [];
    card.querySelectorAll('.results-summary, figure.fig-card, .tbl-card, .interp, .msg-warning, .msg-danger, details.method-box').forEach(node => {
      if (node.closest('.data-card') || node.closest('.col-match')) return;
      if (node.matches('.results-summary')) { if (node.querySelector('.stat-tile')) items.push({ k: 'tiles', html: `<div class="tiles">${clean(node).innerHTML}</div>` }); }
      else if (node.matches('figure.fig-card')) items.push({ k: 'fig', html: figHTML(node) });
      else if (node.matches('.tbl-card')) items.push({ k: 'tbl', html: tableHTML(node) });
      else if (node.matches('.interp')) items.push({ k: 'interp', html: `<div class="interp">${clean(node).innerHTML}</div>` });
      else if (node.matches('.msg-warning, .msg-danger')) { if (o.warn) items.push({ k: 'warn', html: `<p class="warn">${esc(textOf(node))}</p>` }); }
      else if (o.methods && !node.querySelector('input, select, textarea')) { const b = node.querySelector('.method-body'); if (b) items.push({ k: 'method', html: `<div class="method"><h4>${esc(T('Método y fuentes', 'Method and sources'))}</h4>${clean(b).innerHTML}</div>` }); }
    });
    if (!items.some(it => it.k !== 'method' && it.k !== 'warn')) return;
    out.cards.push({ title: textOf(card.querySelector(':scope > h2')), items });
  });
  return out;
}
const REPORT_CSS = `
:root{--ink:#1b211b;--muted:#566156;--line:#d6ddd2;--soft:#f2f5ef;--primary:#1B5E20;--accent:#5D4037;--moss:#558B2F}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
main{max-width:920px;margin:0 auto;padding:28px 28px 64px}
.cover{display:flex;gap:22px;align-items:center;border-bottom:3px solid var(--primary);padding:8px 0 22px;margin-bottom:22px}
.cover h1{margin:0 0 4px;font-size:1.9rem;line-height:1.2;color:var(--primary)}
.cover p{margin:2px 0;color:var(--muted)}
.cover .site{font-size:1.15rem;color:var(--ink);font-weight:600}
h2{font-size:1.35rem;color:var(--primary);margin:34px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
h3{font-size:1.08rem;margin:22px 0 8px;color:var(--accent)}
h4{font-size:.95rem;margin:14px 0 6px}
.toc ol{margin:6px 0 0;padding-left:22px;columns:2}
.notes{background:var(--soft);border-radius:10px;padding:12px 16px;white-space:pre-wrap}
.data{color:var(--muted);font-size:.9rem;margin:2px 0 10px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin:10px 0}
.stat-tile{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:8px 12px}
.stat-label{font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.stat-value{font-size:1.2rem;font-weight:700}
.stat-sub{font-size:.8rem;color:var(--muted)}
.stat-tile.bad{box-shadow:inset 3px 0 0 #b3261e}.stat-tile.good{box-shadow:inset 3px 0 0 var(--primary)}.stat-tile.warn{box-shadow:inset 3px 0 0 #b26a00}
figure{margin:14px 0;text-align:center}
figure svg,figure img{max-width:100%;height:auto}
figcaption{font-size:.88rem;color:var(--muted);margin-top:4px;text-align:left}
.tbl{margin:12px 0;overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:.84rem;font-variant-numeric:tabular-nums}
th,td{border-bottom:1px solid var(--line);padding:4px 8px;text-align:left;vertical-align:top}
th{background:var(--soft);font-weight:700}
.num{text-align:right}
tr.row-total td{font-weight:700;background:var(--soft)}
.note{font-size:.8rem;color:var(--muted);margin:4px 0}
.interp{border-left:4px solid var(--moss);background:#f4f8f0;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0}
.interp-k{display:block;font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);margin-bottom:2px}
.warn{border-left:4px solid #b26a00;background:#fff6e5;padding:8px 12px;border-radius:0 8px 8px 0;font-size:.9rem}
.method{font-size:.86rem;color:#2f382f;border:1px dashed var(--line);border-radius:8px;padding:6px 14px;margin:10px 0}
.method h4{margin-top:6px}
.ref-mini{padding-left:18px;margin:6px 0}
pre{white-space:pre-wrap;background:var(--soft);border-radius:8px;padding:10px 12px;font-size:.8rem}
footer{margin-top:40px;padding-top:12px;border-top:1px solid var(--line);color:var(--muted);font-size:.85rem}
.printbar{position:fixed;right:16px;top:16px}
.printbar button{font:inherit;font-weight:700;background:var(--primary);color:#fff;border:0;border-radius:8px;padding:8px 14px;cursor:pointer}
@media (max-width:640px){main{padding:18px 16px 48px}.cover{flex-direction:column;align-items:flex-start}.toc ol{columns:1}}
@media print{.printbar{display:none}main{max-width:none;padding:0}h2.blk{break-before:page}figure,.tiles,.interp,.method,tr{break-inside:avoid}h2,h3,h4{break-after:avoid}@page{size:A4;margin:16mm 14mm}}
`;
function buildReport() {
  const o = { methods: el('b10methods').checked, warn: el('b10warn').checked };
  /* the blocks the user worked in, of those ticked */
  const inc = BLOCKS.filter(n => state.report[n] && el('b10inc' + n) && el('b10inc' + n).checked);
  const blocks = inc.map(n => ({ n, name: stepName(n), p: partsOf(n, o) })).filter(b => b.p && b.p.cards.length);
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  const title = el('b10title').value.trim() || T('Informe forestal', 'Forest report');
  const site = el('b10site').value.trim(), author = el('b10author').value.trim(), date = el('b10date').value, notes = el('b10notes').value.trim();
  const dateTxt = date ? new Date(date + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  let h = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}${site ? ' · ' + esc(site) : ''}</title><meta name="generator" content="ForestPro ${esc(window.FP_VERSION || '')}"><style>${REPORT_CSS}</style></head><body>`;
  h += `<div class="printbar"><button type="button" onclick="window.print()">${esc(T('Imprimir o guardar como PDF', 'Print or save as PDF'))}</button></div><main>`;
  h += `<header class="cover">${Art.logo(84)}<div><h1>${esc(title)}</h1>${site ? `<p class="site">${esc(site)}</p>` : ''}<p>${[author, dateTxt].filter(Boolean).map(esc).join(' · ')}</p><p>${esc(T('Generado con ForestPro ', 'Generated with ForestPro ') + (window.FP_VERSION || '') + ' · LABG')}</p></div></header>`;
  if (blocks.length > 1) h += `<nav class="toc"><b>${esc(T('Contenido', 'Contents'))}</b><ol>${blocks.map(b => `<li><a href="#b${b.n}">${esc(b.name)}</a></li>`).join('')}</ol></nav>`;
  if (notes) h += `<h2>${esc(T('Presentación', 'Introduction'))}</h2><div class="notes">${esc(notes)}</div>`;
  const sum = blocks.filter(b => b.p.tiles);
  if (sum.length) {
    h += `<h2>${esc(T('Resumen', 'Summary'))}</h2>`;
    sum.forEach(b => { h += `<h4>${esc(b.name)}</h4><div class="tiles">${b.p.tiles}</div>`; });
  }
  blocks.forEach(b => {
    h += `<h2 class="blk" id="b${b.n}">${b.n - 1}. ${esc(b.name)}</h2>`;
    if (b.p.data.length) h += `<p class="data">${esc(T('Datos: ', 'Data: '))}${b.p.data.map(esc).join('; ')}</p>`;
    b.p.cards.forEach(c => { h += `<h3>${esc(c.title)}</h3>` + c.items.map(it => it.html).join(''); });
  });
  const C = window.FP_CITE || {};
  h += `<h2>${esc(T('Cómo citar ForestPro', 'How to cite ForestPro'))}</h2><p>${esc(C.apa || '')}</p><pre>${esc(C.bib || '')}</pre>`;
  h += `<footer>${esc(T('Todos los cálculos se hicieron en el navegador con ForestPro; los datos no salieron del equipo. Los métodos, sus fuentes y la validación contra R se describen en el manual.', 'Every computation was made in the browser with ForestPro; the data never left the computer. The methods, their sources and the validation against R are described in the manual.'))}</footer>`;
  h += `</main></body></html>`;
  return { html: h, n: blocks.length, figs: (h.match(/<figure>/g) || []).length, tables: (h.match(/<div class="tbl">/g) || []).length, file: 'forestpro_informe_' + (slug(site || title) || 'informe') + '.html' };
}
function preview() {
  clearMessages(R.rep);
  const r = buildReport();
  if (!r.n) { showMessage(R.rep, 'info', L2('Todavía no hay resultados que llevar al informe. Corre algún análisis en los bloques 2 a 9 (o abre un ejemplo desde Inicio).', 'There are no results for the report yet. Run some analysis in Blocks 2 to 9 (or open an example from Home).')); R.frame.hidden = true; return null; }
  R.frame.hidden = false;
  R.frame.srcdoc = r.html;
  showMessage(R.rep, 'success', L2(`Informe con ${r.n} bloques, ${r.figs} figuras y ${r.tables} tablas.`, `Report with ${r.n} blocks, ${r.figs} figures and ${r.tables} tables.`));
  return r;
}

/* ---------------- all the tables in one workbook ---------------- */
function allTables() {
  const sheets = [];
  BLOCKS.forEach(n => {
    const root = el('b' + n + 'root');
    if (!root) return;
    root.querySelectorAll('.tbl-card').forEach(c => { if (c._fp && !c.closest('.data-card')) { const d = c._fp.data(); sheets.push({ name: 'B' + n + ' ' + (c._fp.title || T('Tabla', 'Table')), header: d.header, rows: d.rows, file: c._fp.file }); } });
  });
  return sheets;
}
function exportTables(kind) {
  clearMessages(R.tabs);
  const sh = allTables();
  if (!sh.length) { showMessage(R.tabs, 'info', L2('Todavía no hay tablas de resultados.', 'There are no result tables yet.')); return; }
  if (kind === 'xlsx') download(new Blob([DataIO.xlsx(sh)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'forestpro_tablas.xlsx');
  else {
    const used = new Set();
    const files = sh.map((s, i) => { let nm = (s.file || slug(s.name)).replace(/[^\w.-]+/g, '_'); while (used.has(nm)) nm += '_' + (i + 1); used.add(nm); return { name: nm + '.csv', data: '﻿' + DataIO.toCSV(s.header, s.rows) }; });
    download(new Blob([DataIO.zip(files)], { type: 'application/zip' }), 'forestpro_tablas_csv.zip');
  }
  showMessage(R.tabs, 'success', L2(`${sh.length} tablas exportadas.`, `${sh.length} tables exported.`));
}

/* ---------------- the page ---------------- */
function build() {
  const root = el('b10root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Lo que mostraron los bloques, reunido en un informe que se abre en cualquier navegador y se imprime a PDF; todas las tablas en un libro de Excel; y el proyecto, para volver a abrir el trabajo tal como quedó.',
    'What the blocks showed, gathered into a report that opens in any browser and prints to PDF; all the tables in one Excel workbook; and the project, to open the work again just as it was left.')));

  /* A. report */
  const a = UI.section(root, ['Informe', 'Report'], ['Un archivo HTML que lleva todo dentro: portada, resumen, figuras, tablas e interpretaciones.', 'One HTML file that carries everything inside: cover, summary, figures, tables and interpretations.']);
  const g = mk('div', { class: 'form-grid' });
  const today = new Date(), iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  g.innerHTML = [['b10title', 'Título', 'Title', T('Informe forestal', 'Forest report'), 'text'], ['b10site', 'Predio o proyecto', 'Property or project', '', 'text'], ['b10author', 'Responsable', 'Prepared by', '', 'text'], ['b10date', 'Fecha', 'Date', iso, 'date']]
    .map(([id, es, en, v, ty]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="${ty}" id="${id}" value="${esc(v)}"></div>`).join('');
  a.appendChild(g);
  const nf = mk('div', { class: 'field' });
  nf.innerHTML = `<label for="b10notes">${L2('Presentación o notas (opcional)', 'Introduction or notes (optional)')}</label><textarea id="b10notes" rows="3"></textarea>`;
  a.appendChild(nf);
  const inc = mk('fieldset', { class: 'inc-set' });
  inc.innerHTML = `<legend>${L2('Bloques que entran', 'Blocks to include')}</legend>` + BLOCKS.map(n => `<label class="checkbox-label"><input type="checkbox" id="b10inc${n}" checked> ${n - 1}. ${L2(STEPS.find(s => s.n === n).es, STEPS.find(s => s.n === n).en)}</label>`).join('') +
    `<label class="checkbox-label"><input type="checkbox" id="b10methods" checked> ${L2('Con los métodos y sus fuentes', 'With the methods and their sources')}</label><label class="checkbox-label"><input type="checkbox" id="b10warn" checked> ${L2('Con los avisos', 'With the warnings')}</label>`;
  a.appendChild(inc);
  a.appendChild(mk('p', { class: 'hint' }, L2('Entra lo que cada bloque muestra en este momento; un bloque sin resultados no aparece. Las figuras van con los colores del tema claro y con lo que hayas cambiado en el editor ✎.', 'What each block shows right now goes in; a block with no results does not appear. Figures go in the colours of the light theme and with whatever you changed in the editor ✎.')));
  const row = mk('div', { class: 'btn-row' });
  const pv = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Vista previa', 'Preview'));
  pv.addEventListener('click', preview);
  const dl = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('⤓ Descargar el informe (HTML)', '⤓ Download the report (HTML)'));
  dl.addEventListener('click', () => { const r = preview(); if (r) download(r.html, r.file, 'text/html;charset=utf-8'); });
  const pr = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Abrir para imprimir o guardar como PDF', 'Open to print or save as PDF'));
  pr.addEventListener('click', () => {
    const r = preview(); if (!r) return;
    const url = URL.createObjectURL(new Blob([r.html], { type: 'text/html;charset=utf-8' }));
    const w = window.open(url, '_blank');
    if (!w) showMessage(R.rep, 'info', L2('El navegador bloqueó la ventana nueva: descarga el informe y ábrelo para imprimirlo.', 'The browser blocked the new window: download the report and open it to print it.'));
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  row.append(pv, dl, pr);
  a.appendChild(row);
  R.rep = mk('div', { class: 'messages' }); a.appendChild(R.rep);
  R.frame = mk('iframe', { class: 'report-frame', title: T('Vista previa del informe', 'Report preview'), sandbox: '' });
  R.frame.hidden = true;
  a.appendChild(R.frame);

  /* B. tables */
  const b = UI.section(root, ['Todas las tablas', 'All the tables'], ['Cada tabla de resultados de los bloques 2 a 9, con sus números completos.', 'Every result table of Blocks 2 to 9, with its full numbers.']);
  const br = mk('div', { class: 'btn-row' });
  const bx = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('⤓ Libro de Excel (XLSX), una hoja por tabla', '⤓ Excel workbook (XLSX), one sheet per table'));
  bx.addEventListener('click', () => exportTables('xlsx'));
  const bc = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('⤓ CSV, un archivo por tabla (ZIP)', '⤓ CSV, one file per table (ZIP)'));
  bc.addEventListener('click', () => exportTables('csv'));
  br.append(bx, bc);
  b.appendChild(br);
  R.tabs = mk('div', { class: 'messages' }); b.appendChild(R.tabs);
  b.appendChild(mk('p', { class: 'hint' }, L2('Las figuras se exportan una por una desde su tarjeta, en SVG, PNG a 300 ppp o PDF, con el estudio de figuras.', 'Figures are exported one by one from their card, as SVG, PNG at 300 dpi or PDF, with the figure studio.')));

  /* C. project */
  const c = UI.section(root, ['Proyecto', 'Project'], ['Guarda el trabajo en un archivo y ábrelo después, aquí o en otro equipo.', 'Save the work to a file and open it later, here or on another computer.']);
  const cr = mk('div', { class: 'btn-row' });
  const sv = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('⤓ Guardar el proyecto (JSON)', '⤓ Save the project (JSON)'));
  sv.addEventListener('click', saveProject);
  const op = mk('label', { class: 'btn btn-secondary btn-sm', for: 'b10open', tabindex: '0', role: 'button' }, L2('Abrir un proyecto…', 'Open a project…'));
  const opIn = mk('input', { type: 'file', id: 'b10open', class: 'sr-only', accept: '.json,application/json' });
  opIn.addEventListener('change', () => { const f = opIn.files[0]; opIn.value = ''; if (f) openProject(f); });
  op.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opIn.click(); } });
  const nw = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('Empezar de nuevo', 'Start again'));
  nw.addEventListener('click', () => { if (window.confirm(T('Se borra todo lo que hay en la app (los archivos guardados no se tocan). ¿Continuar?', 'Everything in the app is cleared (saved files are not touched). Continue?'))) { window.FP_NO_GUARD = true; location.reload(); } });
  cr.append(sv, op, opIn, nw);
  c.appendChild(cr);
  R.proj = mk('div', { class: 'messages' }); c.appendChild(R.proj);
  UI.method(c, { text: [
    '<p>El proyecto no guarda los resultados sino la manera de llegar a ellos: los datos que cargaste en cada tarjeta de datos (si fueron de un ejemplo, solo cuál), los campos que cambiaste, las tablas editables, los botones que oprimiste y los ejemplos que abriste, en orden. Al abrirlo, la app se recarga limpia y repite esos pasos, así que cada bloque calcula otra vez lo mismo que mostraba. No guarda la fotografía hemisférica del Bloque 7 ni lo que hayas hecho en el editor de figuras, y la cuadrícula aleatoria del Bloque 8 sale con otro sorteo. El archivo es texto (JSON): puedes leerlo y lleva al final un resumen de los resultados.</p>',
    '<p>The project does not store the results but the way to reach them: the data you loaded in each data card (if they came from an example, just which one), the fields you changed, the editable tables, the buttons you pressed and the examples you opened, in order. When it is opened, the app reloads clean and repeats those steps, so every block computes again what it showed. It does not store the hemispherical photograph of Block 7 or what you did in the figure editor, and the random grid of Block 8 comes out with another draw. The file is text (JSON): you can read it, and it carries a summary of the results at the end.</p>'] });

  /* D. citation */
  const d = UI.section(root, ['Cómo citar', 'How to cite'], ['Si ForestPro te sirvió en un trabajo, cítalo así.', 'If ForestPro helped in a piece of work, cite it like this.']);
  const C = window.FP_CITE || {};
  d.appendChild(mk('p', { class: 'cite-apa' }, esc(C.apa || '')));
  const pre = mk('pre', { class: 'cite-bib' }); pre.textContent = C.bib || ''; d.appendChild(pre);
  const dr = mk('div', { class: 'btn-row' });
  [['APA', C.apa], ['BibTeX', C.bib]].forEach(([lab, txt]) => {
    const bt = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('Copiar ', 'Copy ') + lab);
    bt.addEventListener('click', async () => { try { await navigator.clipboard.writeText(txt); if (window.LABG && LABG.toast) LABG.toast(T('Copiado.', 'Copied.')); } catch (err) { if (window.LABG && LABG.toast) LABG.toast(T('No se pudo copiar; selecciónalo a mano.', 'Could not copy; select it by hand.')); } });
    dr.appendChild(bt);
  });
  const bib = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('⤓ forestpro.bib', '⤓ forestpro.bib'));
  bib.addEventListener('click', () => download((C.bib || '') + '\n', 'forestpro.bib', 'application/x-bibtex'));
  dr.appendChild(bib);
  d.appendChild(dr);
}

document.addEventListener('DOMContentLoaded', () => {
  build();
  /* after every block has built its page */
  setTimeout(() => { nameButtons(); wrapHooks(); pendingProject(); }, 0);
});
document.addEventListener('stepchange', e => { if (e.detail.step === 10) { const has = BLOCKS.some(n => state.report[n]); if (has && R.frame && R.frame.hidden === false) preview(); } });
window.FPProject = { log: () => P.log, replay, build: buildReport };
})();
