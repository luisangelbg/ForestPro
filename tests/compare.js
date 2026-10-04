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

/* ================= Block 3 ================= */
blocks[3] = () => {
  const R = ref(3); if (!R) return;
  const { rows, check, vec } = make(3);
  const I = E.Invent, g = d => Math.PI * d * d / 40000;
  /* expansion of the cloud forest, as the app does it (nested plots, live trees, V = g·H·0.5) */
  const P = new Map(E.FPData.rows('mesofilo_parcelas').map(p => [p.parcela, p]));
  const trees = E.FPData.rows('mesofilo_arboles').map(r => ({ plot: r.parcela, d: r.dap, h: r.altura, v: g(r.dap) * r.altura * 0.5, alive: r.estado === 'vivo', stratum: r.estrato }));
  const plotOf = k => { const p = P.get(k); return { shape: 'nested', r: p.radio_grande_m, rSmall: p.radio_chico_m, dCut: p.dap_corte_cm }; };
  const per = I.perPlot(trees, plotOf, { plots: [...P.keys()].sort() });
  R.perPlot.parcela.forEach((k, i) => {
    const p = per.find(x => x.plot === k);
    check(`${k}: N/ha`, p.N, R.perPlot.N[i], 1e-10); check(`${k}: G/ha`, p.G, R.perPlot.G[i], 1e-10); check(`${k}: V/ha`, p.V, R.perPlot.V[i], 1e-10);
    check(`${k}: Dq`, p.dq, R.perPlot.dq[i], 1e-10); check(`${k}: altura dominante`, p.hdom, R.perPlot.hdom[i], 1e-10);
  });
  const y = R.perPlot.parcela.map(k => per.find(x => x.plot === k).G);
  const s = I.srs(y, { conf: 0.95 });
  check('MAS: media', s.mean, R.srs.mean, 1e-12); check('MAS: error estándar', s.se, R.srs.se, 1e-12); check('MAS: t', s.t, R.srs.t, 1e-10); check('MAS: error de muestreo %', s.errPct, R.srs.errPct, 1e-10);
  check('MAS: media (forestmangr sprs)', s.mean, R.srs.forestmangr.mean, 1e-8); check('MAS: error estándar (sprs)', s.se, R.srs.forestmangr.se, 1e-8);
  check('MAS: error absoluto t·EE (sprs)', s.half, R.srs.forestmangr.abserr, 1e-8); check('MAS: error % (sprs)', s.errPct, R.srs.forestmangr.errPct, 1e-8);
  const strata = new Map();
  R.perPlot.parcela.forEach((k, i) => { const p = P.get(k); if (!strata.has(p.estrato)) strata.set(p.estrato, { name: p.estrato, y: [], area: p.area_estrato_ha }); strata.get(p.estrato).y.push(y[i]); });
  const st = I.strat([...strata.values()], { conf: 0.95 });
  check('Estratificado: media', st.mean, R.strat.mean, 1e-12); check('Estratificado: error estándar (Cochran)', st.se, R.strat.se, 1e-12);
  check('Estratificado: gl de Satterthwaite', st.df, R.strat.df, 1e-10); check('Estratificado: error de muestreo %', st.errPct, R.strat.errPct, 1e-9);
  check('Estratificado: eficiencia frente a MAS', st.efficiency, R.strat.efficiency, 1e-10);
  check('Estratificado: EE con asignación de Neyman', st.seNeyman, R.strat.seNeyman, 1e-12);
  check('Estratificado: media (forestmangr strs)', st.mean, R.strat.forestmangr.mean, 1e-8);
  check('Estratificado: EE de Neyman = Sy de strs', st.seNeyman, R.strat.forestmangr.se, 1e-8);
  const sy = I.systematic(y, { conf: 0.95, N: 10000 });
  check('Sistemático: error estándar', sy.se, R.sys.se, 1e-12); check('Sistemático: EE (forestmangr ss_diffs)', sy.se, R.sys.forestmangr.se, 1e-8);
  /* clusters: farms of the coffee example */
  const cp = E.FPData.rows('cafetal_parcelas'), ca = E.FPData.rows('cafetal_arboles').filter(r => r.estado === 'vivo');
  const G = new Map(); ca.forEach(r => G.set(r.parcela, (G.get(r.parcela) || 0) + g(r.dap) * 10));
  const cl = new Map(); cp.forEach(p => { if (!cl.has(p.finca)) cl.set(p.finca, { id: p.finca, y: [] }); cl.get(p.finca).y.push(G.get(p.parcela)); });
  const c = I.cluster([...cl.values()], { conf: 0.95 });
  check('Conglomerados: media (razón)', c.mean, R.cluster.mean, 1e-12); check('Conglomerados: error estándar', c.se, R.cluster.se, 1e-12); check('Conglomerados: efecto del diseño', c.deff, R.cluster.deff, 1e-10);
  /* sample size */
  check('n: CV 40 %, E 10 %', I.sampleSize({ cv: 40, err: 10 }).n, R.sampleSize.c40e10, 0, 'abs');
  check('n: CV 40 %, E 10 %, N = 200', I.sampleSize({ cv: 40, err: 10, N: 200 }).n, R.sampleSize.c40e10N200, 0, 'abs');
  check('n: CV 25 %, E 5 %', I.sampleSize({ cv: 25, err: 5 }).n, R.sampleSize.c25e5, 0, 'abs');
  check('n: CV 60 %, E 15 %, 90 %', I.sampleSize({ cv: 60, err: 15, conf: 0.90 }).n, R.sampleSize.c60e15c90, 0, 'abs');
  /* relascope */
  const by = new Map();
  E.FPData.rows('mesofilo_relascopio').forEach(r => { if (!by.has(r.punto)) by.set(r.punto, []); by.get(r.punto).push({ d: r.dap, h: r.altura, v: g(r.dap) * r.altura * 0.5 }); });
  const rl = I.relascope([...by.entries()].map(([point, trees]) => ({ point, trees })), 2, { conf: 0.95 });
  check('Relascopía: G/ha', rl.G.mean, R.relascope.G, 1e-12); check('Relascopía: EE de G', rl.G.se, R.relascope.Gse, 1e-12);
  check('Relascopía: N/ha', rl.N.mean, R.relascope.N, 1e-12); check('Relascopía: EE de N', rl.N.se, R.relascope.Nse, 1e-12);
  check('Relascopía: V/ha', rl.V.mean, R.relascope.V, 1e-12); check('Relascopía: EE de V', rl.V.se, R.relascope.Vse, 1e-12);
  /* Weibull and K–S on the DBH of the live trees */
  const d = trees.filter(t => t.alive).map(t => t.d);
  const w2 = I.weibull(d);
  check('Weibull 2p: forma', w2.c, R.weibull2.shape, 1e-6); check('Weibull 2p: escala', w2.b, R.weibull2.scale, 1e-6); check('Weibull 2p: log-verosimilitud', w2.ll, R.weibull2.loglik, 1e-9);
  const ks = I.ks(d, w2.cdf);
  check('Kolmogorov–Smirnov: D', ks.D, R.ks.D, 1e-6); check('Kolmogorov–Smirnov: p asintótico', ks.p, R.ks.p, 1e-4);
  const w3 = I.weibull(d, { three: true });
  check('Weibull 3p: ubicación', w3.a, R.weibull3.a, 1e-3); check('Weibull 3p: forma', w3.c, R.weibull3.shape, 1e-3);
  check('Weibull 3p: escala', w3.b, R.weibull3.scale, 1e-3); check('Weibull 3p: log-verosimilitud', w3.ll, R.weibull3.loglik, 1e-7);
  /* IVI of the coffee shade trees (plots of 1 000 m²: ef = 10) */
  const ivi = I.ivi(ca.map(r => ({ plot: r.parcela, sp: r.especie, d: r.dap, ef: 10 })), 25);
  R.ivi.sp.forEach((sp, i) => {
    const x = ivi.find(r => r.sp === sp);
    check(`${sp}: frecuencia absoluta (%)`, 100 * x.F, R.ivi.AF[i], 1e-9); check(`${sp}: densidad (árb/ha)`, x.N, R.ivi.AD[i], 1e-9);
    check(`${sp}: densidad relativa`, x.Nr, R.ivi.DR[i], 1e-5); check(`${sp}: dominancia (m²/ha)`, x.G, R.ivi.ADo[i], 1e-5);
    check(`${sp}: dominancia relativa`, x.Gr, R.ivi.RDo[i], 1e-5); check(`${sp}: frecuencia relativa`, x.Fr, R.ivi.RF[i], 1e-5);
    check(`${sp}: IVI (%)`, x.iviPct, R.ivi.IVI[i], 1e-5);
  });
  const p1 = per.find(x => x.plot === R.perPlot.parcela[0]);
  check('Reineke IDR (parcela 1)', I.reineke(p1.N, p1.dq), R.density.sdi, 1e-10);
  check('Hart–Becking en cuadro (parcela 1)', I.hartBecking(p1.N, p1.hdom), R.density.hbSq, 1e-10);
  check('Hart–Becking en tresbolillo (parcela 1)', I.hartBecking(p1.N, p1.hdom, 'tri'), R.density.hbTri, 1e-10);
  const mp = E.FPData.rows('mesofilo_mapeada');
  const hg = I.hegyi(mp.map(r => ({ x: r.x, y: r.y, d: r.dap })), 6, [0, 50, 0, 50]);
  vec('Hegyi (parcela mapeada, R = 6 m)', hg.map(h => h.ci), R.hegyi.ci, 1e-10);
  check('Hegyi: árboles marcados en el borde', hg.filter(h => h.edge).length, R.hegyi.edge.reduce((a, b) => a + b, 0), 0, 'abs');
  report(3, 'Inventario y muestreo', rows, [
    'Referencias: R 4.4.2; forestmangr (sprs, strs, ss_diffs, forest_structure), fitdistrplus::fitdist, stats::ks.test y fórmulas de Cochran (1977) escritas aparte en R.',
    'forestmangr::strs calcula el error estándar con (Σ Pⱼ Sⱼ)²/n, que solo es la varianza del estimador estratificado con la asignación de Neyman. La app usa la varianza de Cochran con la asignación realizada y da la de Neyman aparte; se compara cada una con su fórmula.',
    'forestmangr redondea sus salidas a 9 decimales como máximo: por eso la tolerancia contra sus valores es 1e-8. La forma y la escala de Weibull se comparan a 1e-6 porque los dos optimizadores se detienen en puntos ligeramente distintos; la log-verosimilitud coincide a 1e-9.',
    'Datos: los ejemplos simulados del bosque mesófilo (24 parcelas anidadas, relascopía de 15 puntos, parcela mapeada) y del cafetal (25 parcelas en 5 fincas).',
  ]);
};

/* ================= Block 4 ================= */
blocks[4] = () => {
  const R = ref(4); if (!R) return;
  const { rows, check, vec } = make(4);
  const B = E.Biomass;
  /* the density search of the app: its table (species or genus values) and then the plot mean */
  const table = E.FPData.rows('densidades_madera');
  const idxTab = B.densityIndex(table.map(r => { const nm = B.splitName(r.especie); return { genus: nm.genus, species: nm.species, wd: r.densidad }; }));
  const levelOf = { 'especie': 'species', 'género': 'genus' };
  ['cafetal', 'mesofilo'].forEach(ex => {
    const a = E.FPData.rows(ex + '_arboles');
    const wd = B.woodDensity(a.map(r => { const nm = B.splitName(r.especie); return { genus: nm.genus, species: nm.species, stand: r.parcela }; }), idxTab, { stand: true });
    const tab = new Map(table.map(r => [r.especie, r]));
    const ref4 = R['wd_' + ex];
    let okLvl = 0;
    a.forEach((r, i) => {
      const t = tab.get(r.especie);
      const lvl = t ? levelOf[t.nivel] : wd[i].level;
      const rl = ['species', 'genus', 'family', 'dataset'].includes(ref4.levelWD[i]) ? ref4.levelWD[i] : 'stand';
      if (lvl === rl) okLvl++;
      /* the plot mean averages the rounded densities of the table: the same tolerance */
      check(`${ex} árbol ${i + 1} (${r.especie}): densidad`, t ? t.densidad : wd[i].wd, ref4.meanWD[i], 5e-4);
    });
    check(`${ex}: árboles con el mismo nivel de búsqueda`, okLvl, a.length, 0, 'abs');
  });
  /* the whole global database, loaded as a user would load it */
  const gpath = path.join(root, 'tests', 'r', 'tmp', 'gwdd.csv');
  if (fs.existsSync(gpath)) {
    const t = E.DataIO.readDelimited(fs.readFileSync(gpath, 'utf8'), {});
    const col = n => t.columns[t.names.indexOf(n)];
    const recs = col('wd').map((v, i) => ({ family: col('family')[i], genus: col('genus')[i], species: col('species')[i], wd: +v, region: col('region')[i] }));
    const tx = R.wd_taxa;
    const idx = B.densityIndex(recs);
    const w1 = B.woodDensity(tx.genus.map((g, i) => ({ genus: g, species: tx.species[i], family: tx.family[i] })), idx, {});
    tx.genus.forEach((g, i) => {
      check(`${g} ${tx.species[i]} (con familia): densidad`, w1[i].wd, tx.withFamily.meanWD[i], 1e-12);
      check(`${g} ${tx.species[i]} (con familia): nivel`, w1[i].level === tx.withFamily.levelWD[i] ? 1 : 0, 1, 0, 'abs');
    });
    /* a family written differently from the database: the reference drops the species match, the app keeps it */
    const wm = B.woodDensity([{ genus: 'Inga', species: 'vera', family: 'Fabaceae-mimosoideae' }, { genus: 'Quercus', species: 'rugosa', family: 'Fagaceae' }], idx, {});
    rows.push({ block: 4, item: 'Inga vera con familia «Fabaceae-mimosoideae»: la app (especie) frente a la referencia (' + R.wd_mismatch.levelWD[0] + '), informativa', js: wm[0].wd, r: R.wd_mismatch.meanWD[0], diff: Math.abs(wm[0].wd / R.wd_mismatch.meanWD[0] - 1), tol: NaN, kind: 'info', ok: true });
    const idxR = B.densityIndex(recs, { region: 'CentralAmericaTrop' });
    const w2 = B.woodDensity(tx.genus.map((g, i) => ({ genus: g, species: tx.species[i] })), idxR, {});
    tx.genus.forEach((g, i) => {
      check(`${g} ${tx.species[i]} (región Centroamérica tropical): densidad`, w2[i].wd, tx.region.meanWD[i], 1e-12);
      check(`${g} ${tx.species[i]} (región): nivel`, w2[i].level === tx.region.levelWD[i] ? 1 : 0, 1, 0, 'abs');
    });
  }
  /* computeAGB with the same densities */
  const c = R.computeAGB, eq4 = B.eq('chave14_h');
  c.D.forEach((d, i) => check(`computeAGB, árbol ${i + 1} (Mg)`, eq4.f({ D: d, H: c.H[i], rho: c.WD[i] }) / 1000, c.AGB_Mg[i], 1e-12));
  /* every equation of the catalogue against its independent rewriting */
  const Q = R.equations;
  Object.keys(Q.values).forEach(id => {
    const e = B.eq(id);
    vec(`${id}`, Q.D.map((d, i) => e.f({ D: d, H: Q.H[i], rho: Q.rho[i], E: Q.E })), Q.values[id], 1e-12);
  });
  const cof = B.eq('segura06_coffee');
  vec('segura06_coffee (d15, h)', Q.coffee.d15.map((d, i) => cof.f({ D15: d, H: Q.coffee.h[i] })), Q.coffee.agb, 1e-12);
  const e7 = B.eq('chave14_e'), noH = Q.D.map((d, i) => e7.f({ D: d, rho: Q.rho[i], E: Q.E }));
  rows.push({ block: 4, item: 'Ec. 7 publicada frente al reajuste sin altura de la referencia (diferencia máxima, informativa)', js: Math.max(...noH.map((v, i) => Math.abs(v / Q.biomassNoH[i] - 1))), r: 0, diff: NaN, tol: NaN, kind: 'info', ok: true });
  /* the coffee farm with the example rules */
  const ca = E.FPData.rows('cafetal_arboles');
  const wdc = B.woodDensity(ca.map(r => { const nm = B.splitName(r.especie); return { genus: nm.genus, species: nm.species, stand: r.parcela }; }), idxTab, { stand: true });
  const tab = new Map(table.map(r => [r.especie, r.densidad]));
  const eqFor = sp => sp.startsWith('Inga') ? B.eq('segura06_inga') : sp === 'Cordia alliodora' ? B.eq('segura06_cordia') : sp.startsWith('Musa') ? B.eq('vnoord02_musa') : eq4;
  const pa = new Map();
  ca.forEach((r, i) => { if (r.estado !== 'vivo') return; const rho = tab.has(r.especie) ? tab.get(r.especie) : wdc[i].wd; const a = B.treeAGB({ D: r.dap, H: r.altura, rho }, eqFor(r.especie)).agb; pa.set(r.parcela, (pa.get(r.parcela) || 0) + a * 10 / 1000); });
  R.cafetal.plot.forEach((p, i) => {
    const agb = pa.get(p);
    check(`cafetal ${p}: biomasa aérea (Mg/ha)`, agb, R.cafetal.agb[i], 2e-4);
    check(`cafetal ${p}: raíces IPCC montaña tropical`, agb * B.rootShoot('trop_mount', agb), R.cafetal.bgbIPCC[i], 2e-4);
    check(`cafetal ${p}: raíces Cairns 1997`, B.cairns(agb), R.cafetal.bgbCairns[i], 2e-4);
    check(`cafetal ${p}: carbono (Mg C/ha)`, agb * 1.27 * 0.47, R.cafetal.c[i], 2e-4);
  });
  const est = E.Invent.srs([...pa.values()], {});
  check('cafetal: media de la biomasa aérea', est.mean, R.cafetal.mean, 2e-4); check('cafetal: error estándar', est.se, R.cafetal.se, 2e-3);
  /* root:shoot ratios at the edges of their classes */
  ['trop_moist', 'trop_dry', 'temp_conif', 'temp_broad', 'boreal'].forEach(z => R.rootShoot.agb.forEach((a, i) => check(`raíz/tallo ${z} con ${a} t/ha`, B.rootShoot(z, a), R.rootShoot[z][i], 1e-12)));
  /* Monte Carlo against an independent implementation of the same scheme (another generator) */
  const m = E.FPData.rows('mesofilo_arboles'), P = new Map(E.FPData.rows('mesofilo_parcelas').map(p => [p.parcela, p]));
  const sdl = { species: B.SD_LEVEL.species, genus: B.SD_LEVEL.genus };
  const trees = [];
  m.forEach((r, i) => {
    if (r.estado !== 'vivo') return;
    const p = P.get(r.parcela), lv = R.wd_mesofilo.levelWD[i];
    trees.push({ plot: r.parcela, ef: 10000 / (Math.PI * Math.pow(r.dap >= 10 ? p.radio_grande_m : p.radio_chico_m, 2)), D: r.dap, H: r.altura, rho: R.computeAGB.WD[i], rhoSd: sdl[lv] || R.wd_mesofilo.sdWD[i], eq: eq4 });
  });
  const mc = B.monteCarlo(trees, { n: 4000, seed: 99, dErr: 'chave2004', hCv: 5, resid: true });
  check('Monte Carlo: media del predio', mc.standMean, R.mc.mean, 0.01);
  check('Monte Carlo: desviación estándar', mc.standSd, R.mc.sd, 0.08);
  check('Monte Carlo: percentil 2.5', mc.standLo, R.mc.q025, 0.02);
  check('Monte Carlo: percentil 97.5', mc.standHi, R.mc.q975, 0.02);
  vec('Monte Carlo: media de cada parcela', mc.per.map(p => p.mean), R.mc.plotMean, 0.03);
  const det = Num_mean(E.Invent.perPlot(trees.map(t => Object.assign({}, t, { d: t.D, v: eq4.f(t) / 1000 })), k => ({ shape: 'nested', r: P.get(k).radio_grande_m, rSmall: P.get(k).radio_chico_m, dCut: 10 }), { plots: [...P.keys()].sort() }).map(p => p.V));
  check('Cálculo directo del predio (Mg/ha)', det, R.mc.det, 1e-10);
  /* the reference's own Monte Carlo also draws the coefficients from their posterior: same mean, a slightly wider spread */
  check('Monte Carlo de BIOMASS (AGBmonteCarlo): media', mc.standMean, R.mcBIOMASS.mean, 0.02);
  check('Monte Carlo de BIOMASS (AGBmonteCarlo): desviación estándar', mc.standSd, R.mcBIOMASS.sd, 0.15);
  /* necromass, litter, soil and change */
  const cw = E.FPData.rows('mesofilo_madera_caida'), trs = [...new Set(cw.map(r => r.transecto))].map(t => ({ transect: t, L: 30 }));
  const li = B.lineIntersect(cw.map(r => ({ transect: r.transecto, d: r.diametro_cm, cls: r.clase })), trs, { 1: 0.45, 2: 0.34, 3: 0.23, default: 0.34 });
  vec('Madera caída: volumen por transecto (m³/ha)', li.map(x => x.V), R.cwd.V, 1e-12); vec('Madera caída: masa por transecto (Mg/ha)', li.map(x => x.M), R.cwd.M, 1e-12);
  const cp = E.FPData.rows('cafetal_parcelas');
  vec('Hojarasca por parcela (Mg/ha)', cp.map(r => B.litter(r.hojarasca_g, r.marco_m2)), R.litter.v, 1e-12);
  const so = E.FPData.rows('cafetal_suelo'), sp = new Map();
  so.forEach(r => sp.set(r.parcela, (sp.get(r.parcela) || 0) + B.socLayer(r.co_pct, r.dap_g_cm3, r.prof_sup, r.prof_inf, r.pedregosidad_pct)));
  vec('Carbono del suelo por perfil (Mg C/ha)', R.soil.plot.map(p => sp.get(p)), R.soil.c, 1e-12);
  const pc = E.FPData.rows('pino_carbono_remedicion');
  const yrs = pc.reduce((s, r) => s + r.edad2 - r.edad1, 0) / pc.length;
  const cpd = B.change({ paired: true, pairs: pc.map(r => ({ c1: r.c1, c2: r.c2 })), years: yrs });
  check('Cambio pareado: media', cpd.mean, R.change.paired.mean, 1e-12); check('Cambio pareado: límite inferior', cpd.lo, R.change.paired.lo, 1e-10);
  check('Cambio pareado: límite superior', cpd.hi, R.change.paired.hi, 1e-10); check('Cambio pareado: p', cpd.p, R.change.paired.p, 1e-6); check('Cambio pareado: tasa anual', cpd.rate, R.change.paired.rate, 1e-12);
  const cw2 = B.change({ a: pc.map(r => r.c1), b: pc.map(r => r.c2), years: yrs });
  check('Cambio de Welch: diferencia', cw2.mean, R.change.welch.mean, 1e-12); check('Cambio de Welch: gl', cw2.df, R.change.welch.df, 1e-10);
  check('Cambio de Welch: límite inferior', cw2.lo, R.change.welch.lo, 1e-10); check('Cambio de Welch: p', cw2.p, R.change.welch.p, 1e-6);
  report(4, 'Biomasa y carbono', rows, [
    'Referencias: R 4.4.2 con BIOMASS 2.2.7 (getWoodDensity, computeAGB, AGBmonteCarlo), cada ecuación del catálogo reescrita aparte en R con los coeficientes verificados en sus fuentes, y stats::t.test.',
    'Densidades de la tabla de la app: salen de la misma base redondeadas a 4 decimales (tolerancia 5e-4); la media de la parcela y la búsqueda en la base completa se comparan a 1e-12.',
    'Monte Carlo: dos implementaciones del mismo esquema con generadores distintos; las tolerancias (1 % en la media, 8 % en la desviación estándar, 2 % en los percentiles) son las del error de Monte Carlo con 4 000 iteraciones. El de BIOMASS (AGBmonteCarlo, 1 000 iteraciones) sortea además los coeficientes de su distribución posterior: se compara con 2 % en la media y 15 % en la desviación estándar.',
    'La ecuación 7 de Chave et al. (2014) se usa tal como se publicó; la referencia sin altura usa un reajuste posterior. La diferencia máxima entre ambas en los árboles de prueba se informa como dato.',
  ]);
};
const Num_mean = a => a.reduce((s, v) => s + v, 0) / a.length;

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
