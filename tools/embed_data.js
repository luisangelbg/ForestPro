/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Writes js/datasets.js from the example CSV files in data/, so the examples also open when
   index.html is opened with a double click (a page under file:// cannot read files beside it).
       node tools/embed_data.js */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), dir = path.join(root, 'data');
function parse(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') { q = true; continue; }
    if (c === ',') { row.push(cell); cell = ''; continue; }
    if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(v => v !== ''));
}
const out = {};
fs.readdirSync(dir).filter(f => f.endsWith('.csv') && f !== 'ecuaciones_alometricas.csv').sort().forEach(f => {
  const rows = parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const cols = rows[0];
  const num = cols.map((_, j) => rows.slice(1).every(r => r[j] === '' || !isNaN(Number(r[j]))));
  out[f.replace(/\.csv$/, '')] = { cols, rows: rows.slice(1).map(r => r.map((v, j) => num[j] ? (v === '' ? null : Number(v)) : v)) };
});
const js = `/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   The example data of ForestPro, written by tools/embed_data.js from the CSV files in data/.
   ALL OF THEM ARE SIMULATED (data/generar_datos.R): they are not measurements of a real site. */
(function (g) {
'use strict';
const RAW = ${JSON.stringify(out)};
/* the labels of the examples (strata, managements, stories, density levels, status) in English. Only the
   rows of the examples are translated, when they are loaded with the interface in English; a user's data
   are never touched. The CSV files and the validation keep the Spanish labels. */
const EN = {
  estrato: { Conservado: 'Conserved', Perturbado: 'Disturbed', 'Ribereño': 'Riparian' },
  manejo: { 'policultivo tradicional': 'traditional polyculture', 'policultivo comercial': 'commercial polyculture', 'rústico': 'rustic', 'monocultivo bajo sombra': 'shaded monoculture' },
  dosel: { dosel: 'canopy', sotobosque: 'understory' },
  nivel: { especie: 'species', 'género': 'genus' },
  estado: { vivo: 'alive', 'muerto en pie': 'standing dead' },
};
const FPData = {
  names: Object.keys(RAW),
  EN,
  /* rows as objects, a copy every time (the blocks may edit them). lang: 'es' or 'en'; by default the
     language of the interface (Spanish outside the browser) */
  rows(name, lang) {
    const t = RAW[name]; if (!t) return [];
    const L = lang || (g.I18N && g.I18N.lang) || 'es';
    const tr = t.cols.map(c => (L === 'en' && EN[c]) || null);
    return t.rows.map(r => { const o = {}; t.cols.forEach((c, j) => { const v = r[j]; o[c] = v == null ? NaN : (tr[j] && tr[j][v] != null ? tr[j][v] : v); }); return o; });
  },
  /* the label of an example in a language: label('estrato', 'Conservado', 'en') → 'Conserved' */
  label(col, v, lang) { return (lang || (g.I18N && g.I18N.lang) || 'es') === 'en' && EN[col] && EN[col][v] != null ? EN[col][v] : v; },
  /* a tree of the examples is alive (vivo / alive) */
  alive: v => v === 'vivo' || v === 'alive',
  cols(name) { return RAW[name] ? RAW[name].cols.slice() : []; },
};
g.FPData = FPData;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(root, 'js', 'datasets.js'), js);
console.log('js/datasets.js:', Object.keys(out).length, 'tablas,', (js.length / 1024).toFixed(0), 'KB');
