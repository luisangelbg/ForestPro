/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Validation against independent references. For every block with a reference file tests/r/ref_bN.json
   (written by tests/r/valida_bN.R), the engine of the app is run here on the same data and every
   number is compared with an explicit tolerance. Writes tests/resultados/bN.md and tests/VALIDACION.md.
       node tests/compare.js            (from the root of ForestPro) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');

/* the engines, loaded as the browser loads them */
const ctx = { console, Math, Date, JSON, TextEncoder, TextDecoder, Uint8Array, Uint32Array, Int32Array, Float64Array, Array, Object, Number, String, Map, Set, isFinite, isNaN, parseFloat };
ctx.window = ctx; ctx.globalThis = ctx; ctx.T = (es) => es;
vm.createContext(ctx);
['num.js', 'nls.js', 'dataio.js', 'datasets.js', 'eng-dendro.js', 'eng-invent.js', 'eng-biomass.js', 'eng-growth.js', 'eng-divers.js', 'eng-agro.js', 'eng-geo.js', 'eng-tools.js']
  .forEach(f => { const p = path.join(root, 'js', f); if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); });
const E = ctx;

/* ---------------- the comparison ledger ---------------- */
const all = [];
function make(block) {
  const rows = [];
  const check = (item, js, r, tol, kind) => {
    kind = kind || 'rel';
    const a = +js, b = +r;
    let diff, ok;
    if (!isFinite(a) || !isFinite(b)) { diff = NaN; ok = (!isFinite(a) && !isFinite(b)); }
    else if (kind === 'abs') { diff = Math.abs(a - b); ok = diff <= tol; }
    else { diff = Math.abs(a - b) / Math.max(Math.abs(b), 1e-300); ok = diff <= tol || Math.abs(a - b) <= 1e-12; }
    rows.push({ block, item, js: a, r: b, diff, tol, kind, ok });
    return ok;
  };
  const vec = (item, js, r, tol, kind) => { r.forEach((v, i) => check(item + '[' + (i + 1) + ']', js[i], v, tol, kind)); };
  return { rows, check, vec };
}
const fmt = v => (v == null || !isFinite(v)) ? String(v) : (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-4 && v !== 0) ? v.toExponential(6) : (+v.toPrecision(9)).toString());
function report(block, title, rows, notes) {
  const dir = path.join(root, 'tests', 'resultados');
  fs.mkdirSync(dir, { recursive: true });
  const bad = rows.filter(r => !r.ok);
  let md = `# Validación del Bloque ${block}: ${title}\n\n`;
  md += `Comparaciones: **${rows.length}** · desacuerdos fuera de tolerancia: **${bad.length}**\n\n`;
  if (notes && notes.length) md += notes.map(n => '- ' + n).join('\n') + '\n\n';
  md += '| Cantidad | ForestPro | Referencia | Diferencia | Tolerancia | ¿Coincide? |\n|---|---:|---:|---:|---:|:---:|\n';
  rows.forEach(r => { md += `| ${r.item} | ${fmt(r.js)} | ${fmt(r.r)} | ${fmt(r.diff)} | ${r.kind === 'abs' ? '±' : ''}${r.tol}${r.kind === 'abs' ? '' : ' rel.'} | ${r.ok ? 'sí' : '**NO**'} |\n`; });
  fs.writeFileSync(path.join(dir, 'b' + block + '.md'), md);
  all.push({ block, title, n: rows.length, bad: bad.length, badRows: bad });
  console.log(`Bloque ${block} (${title}): ${rows.length} comparaciones, ${bad.length} desacuerdos`);
  bad.slice(0, 12).forEach(r => console.log('   NO', r.item, fmt(r.js), 'vs', fmt(r.r), 'dif', fmt(r.diff)));
}
const ref = n => { const p = path.join(root, 'tests', 'r', 'ref_b' + n + '.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const blocks = {};

/* ================= Block 2 ================= */
blocks[2] = () => {
  const R = ref(2); if (!R) return;
  const { rows, check, vec } = make(2);
  const D = E.Dendro;
  check('Huber (m³)', D.huber(R.logs.dm, R.logs.L), R.logs.huber, 1e-12);
  check('Smalian (m³)', D.smalian(R.logs.d1, R.logs.d2, R.logs.L), R.logs.smalian, 1e-12);
  check('Newton (m³)', D.newton(R.logs.d1, R.logs.dm, R.logs.d2, R.logs.L), R.logs.newton, 1e-12);
  const secs = E.FPData.rows('pino_secciones').map(r => ({ tree: r.arbol, dbh: r.dap, H: r.altura_total, h: r.h, d: r.d }));
  const trees = D.treesFromSections(secs, { minTop: 0 });
  const byT = new Map(trees.map(t => [t.tree, t]));
  R.sections.tree.forEach((t, i) => {
    const x = byT.get(t);
    const sv = D.stemVolume(x.secs, x.H);
    check(`${t}: V entre secciones`, sv.vSections, R.sections.vSections[i], 1e-10);
    check(`${t}: V entre secciones (forestmangr)`, sv.vSections, R.sections.vSections_forestmangr[i], 1e-10);
    check(`${t}: cono de la punta`, sv.vTop, R.sections.vTop[i], 1e-10);
    check(`${t}: tocón`, x.vStump, R.sections.vStump[i], 1e-10);
    check(`${t}: V del fuste`, x.vStem, R.sections.vStem[i], 1e-10);
  });
  /* volume equations on the same per-tree volumes */
  const vd = R.sections.tree.map((t, i) => ({ d: byT.get(t).dbh, h: byT.get(t).H, v: R.sections.vStem[i] }));
  const fits = D.fitVolumeModels(vd);
  fits.forEach(m => {
    const r = R.vol[m.key];
    vec(`${m.key}: coeficientes`, m.fit.coef, r.coef, m.key === 'schumacher' ? 1e-5 : 1e-9);
    vec(`${m.key}: errores estándar`, m.fit.se, r.se, m.key === 'schumacher' ? 1e-3 : 1e-8);
    check(`${m.key}: σ residual`, m.fit.sigma, r.sigma, m.key === 'schumacher' ? 1e-6 : 1e-9);
    check(`${m.key}: AIC`, m.fit.aic, r.aic, 1e-7);
    check(`${m.key}: índice de Furnival`, m.furnival, r.furnival, m.key === 'schumacher' ? 1e-6 : 1e-9);
    if (r.meyer) check(`${m.key}: factor de Meyer`, m.fit.meyer, r.meyer, 1e-10);
    if (r.coef_forestmangr) {
      /* nls_table stops with the default tolerances of nlsLM: same valley, a little short of the minimum */
      vec(`${m.key}: coeficientes (nls_table de forestmangr)`, m.fit.coef, r.coef_forestmangr, 1e-4);
      check(`${m.key}: SCR de la app ≤ SCR de nls_table`, m.fit.rss <= r.rss_forestmangr ? 1 : 0, 1, 0, 'abs');
      check(`${m.key}: SCR (minpack.lm estricto)`, m.fit.rss, r.rss, 1e-9);
    }
  });
  /* taper */
  const tr = E.FPData.rows('pino_secciones').map(r => ({ D: r.dap, H: r.altura_total, h: r.h, d: r.d }));
  const tf = D.fitTaper(tr);
  const k = tf.find(m => m.key === 'kozak69'), mb = tf.find(m => m.key === 'maxBurkhart');
  vec('Kozak 1969: coeficientes', k.fit.coef, R.taper.kozak69.coef, 1e-9);
  vec('Kozak 1969: errores estándar', k.fit.se, R.taper.kozak69.se, 1e-8);
  check('Kozak 1969: σ residual', k.fit.sigma, R.taper.kozak69.sigma, 1e-9);
  vec('Max–Burkhart: coeficientes', mb.fit.coef, R.taper.maxBurkhart.coef, 2e-3);
  check('Max–Burkhart: suma de cuadrados residual', mb.fit.rss, R.taper.maxBurkhart.rss, 1e-6);
  check('Max–Burkhart: σ residual', mb.fit.sigma, R.taper.maxBurkhart.sigma, 1e-6);
  /* height–diameter */
  const hd = E.FPData.rows('pino_arboles').filter(r => r.altura > 1.3).map(r => ({ d: r.dap, h: r.altura }));
  D.fitHD(hd).forEach(m => {
    const r = R.hd[m.key];
    vec(`${m.key}: coeficientes`, m.fit.coef, r.coef, 2e-4);
    vec(`${m.key}: coeficientes (funciones de lmfor)`, m.fit.coef, r.coef_lmfor, 2e-4);
    vec(`${m.key}: errores estándar`, m.fit.se, r.se, 5e-3);
    check(`${m.key}: σ residual`, m.fit.sigma, r.sigma, 1e-6);
    check(`${m.key}: AIC`, m.fit.aic, r.aic, 1e-7);
    check(`${m.key}: BIC`, m.fit.bic, r.bic, 1e-7);
  });
  report(2, 'Dasometría', rows, [
    'Referencias: R 4.4.2 con minpack.lm (Levenberg–Marquardt), lm, forestmangr::smalianwb y nls_table, y las funciones de curva de lmfor.',
    'Tolerancias: 1e-12 en fórmulas cerradas; 1e-9 en mínimos cuadrados lineales; en mínimos cuadrados no lineales, 1e-6 en σ y AIC (el mínimo es el mismo) y de 1e-5 a 2e-3 en coeficientes, porque dos optimizadores se detienen en puntos distintos de un valle casi plano.',
    'Datos: los ejemplos simulados pino_secciones.csv (40 árboles, 520 secciones) y pino_arboles.csv (57 árboles con altura).',
  ]);
};

/* ---------------- run ---------------- */
const only = process.argv.slice(2).map(Number).filter(Boolean);
Object.keys(blocks).map(Number).filter(n => !only.length || only.includes(n)).forEach(n => {
  try { blocks[n](); } catch (e) { console.log('Bloque', n, 'ERROR', e.stack); all.push({ block: n, title: 'ERROR', n: 0, bad: 1 }); }
});
/* the summary keeps the blocks already reported in earlier runs */
const sumPath = path.join(root, 'tests', 'VALIDACION.md');
const prev = {};
if (fs.existsSync(path.join(root, 'tests', 'resultados'))) fs.readdirSync(path.join(root, 'tests', 'resultados')).forEach(f => {
  const m = /^b(\d+)\.md$/.exec(f); if (!m) return;
  const t = fs.readFileSync(path.join(root, 'tests', 'resultados', f), 'utf8');
  const h = /# Validación del Bloque \d+: (.*)\n/.exec(t), c = /Comparaciones: \*\*(\d+)\*\* · desacuerdos fuera de tolerancia: \*\*(\d+)\*\*/.exec(t);
  if (h && c) prev[m[1]] = { block: +m[1], title: h[1], n: +c[1], bad: +c[2] };
});
const list = Object.values(prev).sort((a, b) => a.block - b.block);
let md = '# Validación de ForestPro contra referencias independientes\n\n';
md += 'Cada bloque se compara contra R 4.4.2 (paquetes de referencia) o contra cálculos escritos aparte, con los mismos datos de ejemplo. Los guiones están en `tests/r/`, las referencias en `tests/r/ref_bN.json` y el detalle de cada comparación en `tests/resultados/bN.md`. Para repetirlo:\n\n```\nRscript tests/r/valida_bN.R\nnode tests/compare.js\n```\n\n';
md += '| Bloque | Tema | Comparaciones | Desacuerdos |\n|---|---|---:|---:|\n';
list.forEach(b => { md += `| ${b.block} | ${b.title} | ${b.n} | ${b.bad} |\n`; });
md += `| | **Total** | **${list.reduce((s, b) => s + b.n, 0)}** | **${list.reduce((s, b) => s + b.bad, 0)}** |\n`;
fs.writeFileSync(sumPath, md);
