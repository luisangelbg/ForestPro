/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 5: growth and yield. */
(function () {
'use strict';
const S = { series: null, site: null, rem: null };
const R = {};
const n1 = v => fmtNum(v, 1), n2 = v => fmtNum(v, 2), n3 = v => fmtNum(v, 3);
const GR = () => window.Growth;
const VARS = { diametro: ['Diámetro (cm)', 'Diameter (cm)'], altura: ['Altura (m)', 'Height (m)'], volumen: ['Volumen (m³)', 'Volume (m³)'], area: ['Área basal (m²)', 'Basal area (m²)'] };

function build() {
  const root = el('b5root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Del anillo al turno: los incrementos de cada árbol, los modelos que describen su crecimiento, la calidad de sitio de cada parcela y la tabla de producción del rodal.',
    'From the ring to the rotation: the increments of each tree, the models that describe its growth, the site quality of each plot and the yield table of the stand.')));

  /* A. increments */
  const a = UI.section(root, ['Incrementos y turno biológico', 'Increments and biological rotation'],
    ['Con el análisis troncal o las remediciones de un árbol: el incremento corriente anual (ICA), el medio anual (IMA) y la edad en que el IMA es máximo.', 'With the stem analysis or the remeasurements of a tree: the current annual increment (CAI), the mean annual increment (MAI) and the age at which MAI peaks.']);
  S.cardA = UI.dataCard(a, { id: 'b5a', fields: [
    { key: 'arbol', es: 'Árbol o serie', en: 'Tree or series', req: true, aliases: ['tree', 'serie', 'id'] },
    { key: 'edad', es: 'Edad (años)', en: 'Age (years)', num: true, req: true, aliases: ['age', 't', 'anos'] },
    { key: 'diametro', es: 'Diámetro (cm)', en: 'Diameter (cm)', num: true, aliases: ['dap', 'dbh', 'd'] },
    { key: 'altura', es: 'Altura (m)', en: 'Height (m)', num: true, aliases: ['h', 'ht', 'height'] },
    { key: 'volumen', es: 'Volumen (m³)', en: 'Volume (m³)', num: true, aliases: ['v', 'vol'] }],
    examples: [{ id: 'pino', es: 'Pino: análisis troncal de 6 árboles', en: 'Pine: stem analysis of 6 trees', d: ['Diámetro y altura de cada árbol a cada edad, reconstruidos de sus anillos.', 'Diameter and height of each tree at each age, rebuilt from its rings.'], rows: () => FPData.rows('pino_analisis_troncal') }],
    onData: rows => { S.series = rows; drawInc(); runModels(); } });
  const af = mk('div', { class: 'form-grid' });
  af.innerHTML = `<div class="field"><label for="b5var">${L2('Variable', 'Variable')}</label><select id="b5var">${Object.keys(VARS).map(k => `<option value="${k}"${k === 'volumen' ? ' selected' : ''}${optL(VARS[k][0], VARS[k][1])}</option>`).join('')}</select></div>` +
    `<div class="field"><label for="b5ff">${L2('Coeficiente mórfico (si falta el volumen)', 'Form factor (if volume is missing)')}</label><input type="number" id="b5ff" value="0.45" step="0.01"></div>` +
    `<div class="field"><label for="b5tree">${L2('Árbol para los modelos', 'Tree for the models')}</label><select id="b5tree"></select></div>`;
  a.appendChild(af);
  ['b5var', 'b5ff'].forEach(id => el(id).addEventListener('change', () => { if (S.series) { drawInc(); runModels(); } }));
  el('b5tree').addEventListener('change', () => { if (S.series) runModels(); });
  R.inc = mk('div', { class: 'res-host' }); a.appendChild(R.inc);
  UI.method(a, { text: [
    '<p>ICA entre dos mediciones = (Y<sub>2</sub> − Y<sub>1</sub>)/(t<sub>2</sub> − t<sub>1</sub>); IMA = Y/t. Mientras el ICA supera al IMA, el IMA crece; el máximo del IMA (turno biológico o de máxima producción en volumen) está donde las dos curvas se cruzan. Si no hay volumen medido, se calcula como g·H·f con el coeficiente mórfico.</p>',
    '<p>CAI between two measurements = (Y<sub>2</sub> − Y<sub>1</sub>)/(t<sub>2</sub> − t<sub>1</sub>); MAI = Y/t. While CAI exceeds MAI, MAI keeps rising; the maximum MAI (the biological rotation, or of maximum volume production) is where the two curves cross. If no volume was measured, it is computed as g·H·f with the form factor.</p>'],
    refs: ['Assmann, E. (1970). <i>The Principles of Forest Yield Study</i>. Pergamon.', 'Davis, L. S., Johnson, K. N., Bettinger, P. S. y Howard, T. E. (2001). <i>Forest Management</i>, 4.ª ed. McGraw-Hill.'] });

  /* B. growth models */
  const b = UI.section(root, ['Modelos de crecimiento', 'Growth models'], ['Cuatro curvas sigmoides ajustadas a la serie elegida, con la edad del máximo incremento corriente y del máximo incremento medio de cada una.', 'Four sigmoid curves fitted to the chosen series, with the age of the largest current and of the largest mean increment of each.']);
  R.mod = mk('div', { class: 'res-host' }); b.appendChild(R.mod);
  UI.method(b, { text: [
    '<p><b>Chapman–Richards:</b> Y = A(1 − e<sup>−kt</sup>)<sup>p</sup>. <b>Gompertz:</b> Y = A·exp(−b·e<sup>−kt</sup>). <b>Schumacher:</b> Y = A·exp(−b/t). <b>Logística:</b> Y = A/(1 + b·e<sup>−kt</sup>). A es la asíntota. Ajuste por mínimos cuadrados no lineales desde varios puntos de arranque; AIC con la verosimilitud normal. La edad del máximo ICA es la del punto de inflexión (máximo de dY/dt) y la del máximo IMA, la del máximo de Y/t; ambas se buscan en la curva ajustada. Gompertz y la logística no pasan por el origen, así que su IMA solo se busca desde la menor edad observada.</p>',
    '<p><b>Chapman–Richards:</b> Y = A(1 − e<sup>−kt</sup>)<sup>p</sup>. <b>Gompertz:</b> Y = A·exp(−b·e<sup>−kt</sup>). <b>Schumacher:</b> Y = A·exp(−b/t). <b>Logistic:</b> Y = A/(1 + b·e<sup>−kt</sup>). A is the asymptote. Fitted by nonlinear least squares from several starting points; AIC with the normal likelihood. The age of the largest CAI is that of the inflection point (maximum of dY/dt) and that of the largest MAI, of the maximum of Y/t; both are searched on the fitted curve. Gompertz and the logistic do not pass through the origin, so their MAI is searched only from the youngest observed age.</p>'],
    refs: ['Richards, F. J. (1959). A flexible growth function for empirical use. <i>J. Exp. Bot.</i> 10:290–300.', 'Gompertz, B. (1825). On the nature of the function expressive of the law of human mortality. <i>Phil. Trans. R. Soc.</i> 115:513–583.', 'Schumacher, F. X. (1939). A new growth curve and its application to timber yield studies. <i>Journal of Forestry</i> 37:819–820.', 'Zeide, B. (1993). Analysis of growth equations. <i>Forest Science</i> 39:594–616.'] });

  /* C. site index */
  const c = UI.section(root, ['Índice de sitio', 'Site index'], ['La altura dominante que alcanza cada parcela a la edad base: curvas anamórficas o polimórficas ajustadas a las remediciones, y la clase de sitio de cada parcela.', 'The dominant height each plot reaches at the base age: anamorphic or polymorphic curves fitted to the remeasurements, and the site class of each plot.']);
  S.cardC = UI.dataCard(c, { id: 'b5c', fields: [
    { key: 'parcela', es: 'Parcela', en: 'Plot', req: true, aliases: ['plot'] },
    { key: 'edad', es: 'Edad (años)', en: 'Age (years)', num: true, req: true, aliases: ['age', 't'] },
    { key: 'hdom', es: 'Altura dominante (m)', en: 'Dominant height (m)', num: true, req: true, aliases: ['altura dominante', 'h0', 'hd', 'dominant height'] },
    { key: 'g_ha', es: 'Área basal (m²/ha)', en: 'Basal area (m²/ha)', num: true, aliases: ['g', 'ab', 'basal area'] },
    { key: 'v_ha', es: 'Volumen (m³/ha)', en: 'Volume (m³/ha)', num: true, aliases: ['v', 'vol'] },
    { key: 'n_ha', es: 'Árboles por hectárea', en: 'Trees per hectare', num: true, aliases: ['n', 'densidad', 'nha'] }],
    examples: [{ id: 'pino', es: 'Pino: 30 parcelas permanentes, 6 remediciones', en: 'Pine: 30 permanent plots, 6 remeasurements', d: ['Altura dominante, densidad, diámetro cuadrático, área basal y volumen por hectárea de cada parcela a cada edad.', 'Dominant height, density, quadratic diameter, basal area and volume per hectare of each plot at each age.'], rows: () => FPData.rows('pino_remediciones') }],
    onData: rows => { S.rem = rows; runSite(); runClutter(); } });
  const cf = mk('div', { class: 'form-grid' });
  cf.innerHTML = `<div class="field"><label for="b5tb">${L2('Edad base (años)', 'Base age (years)')}</label><input type="number" id="b5tb" value="20" step="1"></div>` +
    `<div class="field"><label for="b5sm">${L2('Familia de curvas', 'Family of curves')}</label><select id="b5sm">${Object.keys(GR().SITE).map(k => `<option value="${k}"${k === 'chapADA' ? ' selected' : ''}${optL(GR().SITE[k].es, GR().SITE[k].en)}</option>`).join('')}</select></div>` +
    `<div class="field"><label for="b5nc">${L2('Clases de sitio', 'Site classes')}</label><select id="b5nc"><option>3</option><option selected>4</option><option>5</option></select></div>`;
  c.appendChild(cf);
  ['b5tb', 'b5sm', 'b5nc'].forEach(id => el(id).addEventListener('change', () => { if (S.rem) { runSite(); runClutter(); } }));
  R.site = mk('div', { class: 'res-host' }); c.appendChild(R.site);
  UI.method(c, { text: [
    '<p><b>Anamórficas:</b> todas las curvas tienen la forma de una curva guía y difieren solo en escala. Con Schumacher, ln H = b₀ + b₁/t (mínimos cuadrados ordinarios) e IS = H·exp(b₁(1/t<sub>b</sub> − 1/t)); con Chapman–Richards, la curva guía H = A(1 − e<sup>−kt</sup>)<sup>p</sup> e IS = H·[(1 − e<sup>−k·t<sub>b</sub></sup>)/(1 − e<sup>−kt</sup>)]<sup>p</sup>. <b>Polimórficas</b> (diferencias algebraicas, ADA): Chapman–Richards con asíntota A y forma p comunes y tasa k propia de cada sitio, que se despeja de una medición; con dos mediciones de la misma parcela, H₂ = A[1 − (1 − (H₁/A)<sup>1/p</sup>)<sup>t₂/t₁</sup>]<sup>p</sup>, ajustada a los pares de remediciones sucesivas; la curva de un sitio pasa por (t<sub>b</sub>, IS). El índice de una parcela es la media de los índices de sus mediciones; las clases dividen el intervalo de índices en partes iguales (I = la mejor).</p>',
    '<p><b>Anamorphic:</b> all curves have the shape of a guide curve and differ only in scale. With Schumacher, ln H = b₀ + b₁/t (ordinary least squares) and SI = H·exp(b₁(1/t<sub>b</sub> − 1/t)); with Chapman–Richards, the guide curve H = A(1 − e<sup>−kt</sup>)<sup>p</sup> and SI = H·[(1 − e<sup>−k·t<sub>b</sub></sup>)/(1 − e<sup>−kt</sup>)]<sup>p</sup>. <b>Polymorphic</b> (algebraic difference approach, ADA): Chapman–Richards with common asymptote A and shape p and a site-specific rate k, solved from one measurement; with two measurements of the same plot, H₂ = A[1 − (1 − (H₁/A)<sup>1/p</sup>)<sup>t₂/t₁</sup>]<sup>p</sup>, fitted to the pairs of successive remeasurements; the curve of a site passes through (t<sub>b</sub>, SI). The index of a plot is the mean of the indices of its measurements; the classes split the range of indices in equal parts (I = the best).</p>'],
    refs: ['Clutter, J. L., Fortson, J. C., Pienaar, L. V., Brister, G. H. y Bailey, R. L. (1983). <i>Timber Management: a Quantitative Approach</i>. Wiley.', 'Bailey, R. L. y Clutter, J. L. (1974). Base-age invariant polymorphic site curves. <i>Forest Science</i> 20:155–159.', 'Cieszewski, C. J. y Bailey, R. L. (2000). Generalized algebraic difference approach. <i>Forest Science</i> 46:116–126.'] });

  /* D. projection */
  const d = UI.section(root, ['Proyección del rodal y tabla de producción', 'Stand projection and yield table'], ['El sistema compatible de Clutter ajustado a las mismas remediciones proyecta el área basal y el volumen; con la supervivencia y la curva de sitio forma la tabla de producción, que puedes editar.', "Clutter's compatible system fitted to the same remeasurements projects basal area and volume; with survival and the site curve it builds the yield table, which you can edit."]);
  const df = mk('div', { class: 'form-grid' });
  df.innerHTML = [['b5S', 'Índice de sitio', 'Site index', ''], ['b5t0', 'Edad inicial (años)', 'Initial age (years)', 8], ['b5g0', 'Área basal inicial (m²/ha)', 'Initial basal area (m²/ha)', ''], ['b5n0', 'Árboles por hectárea iniciales', 'Initial trees per hectare', 1200], ['b5mort', 'Mortalidad anual (%)', 'Annual mortality (%)', 1.5], ['b5tEnd', 'Edad final (años)', 'Final age (years)', 40], ['b5step', 'Intervalo (años)', 'Step (years)', 2]]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('');
  d.appendChild(df);
  ['b5S', 'b5t0', 'b5g0', 'b5n0', 'b5mort', 'b5tEnd', 'b5step'].forEach(id => el(id).addEventListener('change', () => { if (S.clutter) drawYield(); }));
  R.clut = mk('div', { class: 'res-host' }); d.appendChild(R.clut);
  R.yield = mk('div', { class: 'res-host' }); d.appendChild(R.yield);
  UI.method(d, { text: [
    '<p>Sistema de Clutter (1963), compatible: el crecimiento integrado da el rendimiento. Área basal: ln G₂ = ln G₁·(t₁/t₂) + α₀(1 − t₁/t₂) + α₁(1 − t₁/t₂)·S. Volumen: ln V₂ = β₀ + β₁/t₂ + β₂·S + β₃·ln G₂. Se ajusta a los pares de remediciones sucesivas como suele aplicarse: la ecuación de área basal sin intercepto y con el coeficiente de ln G₁·t₁/t₂ fijo en 1 (mínimos cuadrados), y la de volumen por mínimos cuadrados en dos etapas, con ln G₂ sustituido por su proyección sobre todas las variables exógenas. S es el índice de sitio de cada parcela de la sección anterior. La tabla agrega la altura dominante de la curva de sitio, la supervivencia a tasa anual constante N = N₀(1 − m)<sup>t − t₀</sup> y Dq = √(40 000·G/(π·N)). Si editas la tabla, el ICA, el IMA y el turno se recalculan.</p>',
    '<p>Clutter\'s (1963) compatible system: integrated growth gives yield. Basal area: ln G₂ = ln G₁·(t₁/t₂) + α₀(1 − t₁/t₂) + α₁(1 − t₁/t₂)·S. Volume: ln V₂ = β₀ + β₁/t₂ + β₂·S + β₃·ln G₂. It is fitted to the pairs of successive remeasurements as it is usually applied: the basal-area equation without intercept and with the coefficient of ln G₁·t₁/t₂ fixed at 1 (least squares), and the volume equation by two-stage least squares, with ln G₂ replaced by its projection on every exogenous variable. S is the site index of each plot from the previous section. The table adds the dominant height of the site curve, survival at a constant annual rate N = N₀(1 − m)<sup>t − t₀</sup> and Dq = √(40,000·G/(π·N)). If you edit the table, CAI, MAI and the rotation are recomputed.</p>'],
    refs: ['Clutter, J. L. (1963). Compatible growth and yield models for loblolly pine. <i>Forest Science</i> 9:354–371.', 'Campos, J. C. C. y Leite, H. G. (2017). <i>Mensuração Florestal</i>, 5.ª ed. UFV.', 'Theil, H. (1953). Repeated least squares applied to complete equation systems. Central Planning Bureau, La Haya.'] });
}

/* ---------------- A ---------------- */
function seriesOf(tree) {
  const v = el('b5var').value, ff = +el('b5ff').value || 0.45;
  return S.series.filter(r => String(r.arbol) === String(tree)).map(r => {
    let y = r[v];
    if (v === 'volumen' && !isFinite(y) && r.diametro > 0 && r.altura > 0) y = Math.PI * r.diametro * r.diametro / 40000 * r.altura * ff;
    if (v === 'area' && r.diametro > 0) y = Math.PI * r.diametro * r.diametro / 40000;
    return { t: r.edad, y };
  }).filter(p => isFinite(p.y));
}
function drawInc() {
  R.inc.innerHTML = '';
  const trees = [...new Set(S.series.map(r => String(r.arbol)))];
  const sel = el('b5tree'), prev = sel.value;
  sel.innerHTML = trees.map(t => `<option${t === prev ? ' selected' : ''}>${esc(t)}</option>`).join('');
  const res = trees.map(t => Object.assign({ tree: t }, GR().increments(seriesOf(t))));
  const v = el('b5var').value, vn = T(VARS[v][0], VARS[v][1]);
  const unit = vn.replace(/^.*\((.*)\)$/, '$1');
  const ser = [];
  res.forEach((r, k) => {
    ser.push({ type: 'line', x: r.rows.map(x => x.t), y: r.rows.map(x => x.ica), color: Plot.color(k), width: 1.4, dash: '4 3' });
    ser.push({ type: 'line', x: r.rows.map(x => x.t), y: r.rows.map(x => x.ima), color: Plot.color(k), width: 2.2, label: r.tree });
  });
  UI.figure(R.inc, { title: [`ICA (punteado) e IMA (continuo): ${vn.toLowerCase()}`, `CAI (dashed) and MAI (solid): ${vn.toLowerCase()}`], svg: Plot.xy({ series: ser, xlab: T('Edad (años)', 'Age (years)'), ylab: T('Incremento (', 'Increment (') + unit + T('/año)', '/yr)'), name: 'b5-ica-ima', w: 680, h: 380, zeroY: true }), key: 'b5-inc' });
  UI.table(R.inc, { title: ['Turno biológico de cada árbol', 'Biological rotation of each tree'], file: 'forestpro_turno', columns: [
    { key: 'tree', label: ['Árbol', 'Tree'] }, { key: 'tMaxIMA', label: ['Edad del IMA máximo', 'Age of maximum MAI'], num: true, fmt: n1 },
    { key: 'maxIMA', label: ['IMA máximo', 'Maximum MAI'], num: true, html: true, get: r => fmtSig(r.maxIMA, 4), raw: r => r.maxIMA }, { key: 'tCross', label: ['Cruce ICA = IMA (interpolado)', 'CAI = MAI crossing (interpolated)'], num: true, fmt: n1 }], rows: res });
  const r0 = res.find(r => r.tree === sel.value) || res[0];
  UI.table(R.inc, { title: [`Serie del árbol ${r0.tree}`, `Series of tree ${r0.tree}`], file: 'forestpro_incrementos_' + slug(r0.tree), columns: [
    { key: 't', label: ['Edad', 'Age'], num: true }, { key: 'y', label: [vn, vn], num: true, html: true, get: r => fmtSig(r.y, 5), raw: r => r.y }, { key: 'ica', label: ['ICA', 'CAI'], num: true, html: true, get: r => fmtSig(r.ica, 4), raw: r => r.ica }, { key: 'ima', label: ['IMA', 'MAI'], num: true, html: true, get: r => fmtSig(r.ima, 4), raw: r => r.ima }], rows: r0.rows, limit: 40 });
  const atEnd = res.filter(r => r.tMaxIMA === Math.max(...r.rows.map(x => x.t)));
  UI.interp(R.inc, [`El IMA máximo se alcanza en promedio a los ${n1(Num.mean(res.map(r => r.tMaxIMA)))} años.` + (atEnd.length ? ` En ${atEnd.length} árboles el IMA aún crece en la última edad medida: su turno es posterior a la serie.` : '') + ' En volumen, ese máximo marca el turno de máxima producción; el turno económico suele ser más corto.',
    `The maximum MAI is reached on average at ${n1(Num.mean(res.map(r => r.tMaxIMA)))} years.` + (atEnd.length ? ` In ${atEnd.length} trees MAI is still rising at the last measured age: their rotation is beyond the series.` : '') + ' In volume, that maximum marks the rotation of maximum production; the economic rotation is usually shorter.']);
  state.growth = Object.assign(state.growth || {}, { inc: { tRot: Num.mean(res.map(r => r.tMaxIMA)) } });
  Report.set(5, true); refreshStepMarks();
}

/* ---------------- B ---------------- */
function runModels() {
  R.mod.innerHTML = '';
  const tree = el('b5tree').value, data = seriesOf(tree);
  if (data.length < 5) { showMessage(R.mod, 'warning', L2('Hacen falta al menos 5 edades.', 'At least 5 ages are needed.')); return; }
  const fits = GR().fitGrowth(data).filter(m => m.ok);
  S.models = { tree, data, fits };
  drawModels();
}
function drawModels() {
  R.mod.innerHTML = '';
  const { tree, data, fits } = S.models;
  const best = fits.slice().sort((a, b) => a.fit.aic - b.fit.aic)[0];
  const v = el('b5var').value, vn = T(VARS[v][0], VARS[v][1]);
  UI.table(R.mod, { title: [`Comparación de modelos (árbol ${tree})`, `Comparison of models (tree ${tree})`], file: 'forestpro_modelos_crecimiento', columns: [
    { key: 'name', label: ['Modelo', 'Model'] }, { key: 'eq', label: ['Ecuación', 'Equation'] }, { key: 'rmse', label: ['RMSE'], num: true, html: true, get: r => fmtSig(r.rmse, 4), raw: r => r.rmse },
    { key: 'r2', label: ['R²'], num: true, fmt: v => fmtNum(v, 4) }, { key: 'aic', label: ['AIC'], num: true, fmt: n1 },
    { key: 'A', label: ['Asíntota A', 'Asymptote A'], num: true, html: true, get: r => fmtSig(r.A, 4), raw: r => r.A },
    { key: 'tICA', label: ['Edad del ICA máximo', 'Age of max CAI'], num: true, fmt: n1 }, { key: 'tIMA', label: ['Edad del IMA máximo', 'Age of max MAI'], num: true, html: true }],
    rows: fits.map(m => ({ name: T(m.model.es, m.model.en), eq: m.model.eq, rmse: m.fit.rmse, r2: m.fit.r2, aic: m.fit.aic, A: m.fit.coef[0], tICA: m.crit.tICA, tIMA: m.crit.edge ? '— <small>' + T('(en el borde)', '(at the edge)') + '</small>' : n1(m.crit.tIMA), _class: m === best ? 'row-sel' : '' })) });
  UI.coefTable(R.mod, best.fit, { title: [T('Coeficientes: ', 'Coefficients: ') + T(best.model.es, best.model.en), T('Coeficientes: ', 'Coefficients: ') + T(best.model.es, best.model.en)], file: 'forestpro_coef_crecimiento' });
  const tMax = Math.max(...data.map(r => r.t)) * 1.6, xs = Array.from({ length: 120 }, (_, i) => 0.3 + i * tMax / 119);
  const two = mk('div', { class: 'figs-2' }); R.mod.appendChild(two);
  const ser = [{ type: 'points', x: data.map(r => r.t), y: data.map(r => r.y), color: 'var(--fig-muted)', label: T('Observado', 'Observed') }];
  fits.forEach((m, k) => ser.push({ type: 'line', x: xs, y: xs.map(m.f), color: Plot.color(k), width: m === best ? 2.8 : 1.5, dash: m === best ? null : '5 3', label: T(m.model.es, m.model.en) }));
  UI.figure(two, { title: ['Curvas ajustadas', 'Fitted curves'], svg: Plot.xy({ series: ser, xlab: T('Edad (años)', 'Age (years)'), ylab: vn, name: 'b5-modelos', w: 560, h: 380, zeroY: true, zeroX: true }), key: 'b5-models' });
  const f = best.f, d = t => (f(t + 1e-3) - f(t - 1e-3)) / 2e-3;
  const ser2 = [{ type: 'line', x: xs, y: xs.map(d), color: 'var(--primary)', label: T('ICA del modelo', 'Model CAI'), width: 2.4 }, { type: 'line', x: xs, y: xs.map(t => f(t) / t), color: 'var(--accent)', label: T('IMA del modelo', 'Model MAI'), width: 2.4 },
    { type: 'vline', x: best.crit.tICA, color: 'var(--primary)' }, { type: 'vline', x: best.crit.tIMA, color: 'var(--accent)' }];
  UI.figure(two, { title: [`ICA e IMA de ${T(best.model.es, best.model.en)}`, `CAI and MAI of ${T(best.model.es, best.model.en)}`], svg: Plot.xy({ series: ser2, xlab: T('Edad (años)', 'Age (years)'), ylab: T('Incremento anual', 'Annual increment'), name: 'b5-ica-ima-modelo', w: 560, h: 380, zeroY: true }), key: 'b5-crit' });
  UI.interp(R.mod, [`<b>${esc(T(best.model.es, best.model.en))}</b> es el de menor AIC. Según él, el incremento corriente es máximo a los ${n1(best.crit.tICA)} años y el medio a los ${best.crit.edge ? '(fuera del intervalo de búsqueda)' : n1(best.crit.tIMA)} años. La asíntota (${fmtSig(best.fit.coef[0], 4)}) es una extrapolación: vale como orden de magnitud, no como dato.`,
    `<b>${esc(T(best.model.es, best.model.en))}</b> has the lowest AIC. By it, the current increment peaks at ${n1(best.crit.tICA)} years and the mean increment at ${best.crit.edge ? '(outside the search range)' : n1(best.crit.tIMA)} years. The asymptote (${fmtSig(best.fit.coef[0], 4)}) is an extrapolation: take it as an order of magnitude, not as a fact.`]);
}

/* ---------------- C ---------------- */
function runSite() {
  R.site.innerHTML = '';
  const data = S.rem.map(r => ({ plot: r.parcela, t: r.edad, h: r.hdom }));
  const tb = +el('b5tb').value || 20, method = el('b5sm').value, nc = +el('b5nc').value;
  const sf = GR().siteFit(data, tb, method);
  if (!sf.ok) { showMessage(R.site, 'danger', L2('No se pudo ajustar la familia de curvas (hacen falta remediciones de las mismas parcelas para las polimórficas).', 'The family of curves could not be fitted (the polymorphic ones need remeasurements of the same plots).')); S.site = null; return; }
  const cl = GR().classify(data, sf, nc);
  S.site = { sf, cl, data, tb };
  state.growth = Object.assign(state.growth || {}, { site: { method, tb, coef: sf.fit.coef, classes: cl.classes.map(c => ({ cls: c.cls, lo: c.lo, hi: c.hi })) } });
  drawSite();
}
function drawSite() {
  R.site.innerHTML = '';
  const { sf, cl, data, tb } = S.site;
  UI.coefTable(R.site, sf.fit, { names: sf.names, title: [T('Parámetros: ', 'Parameters: ') + T(GR().SITE[sf.method].es, GR().SITE[sf.method].en), T('Parámetros: ', 'Parameters: ') + T(GR().SITE[sf.method].es, GR().SITE[sf.method].en)], file: 'forestpro_indice_sitio',
    note: [`σ residual = ${fmtNum(sf.fit.sigma, 3)} m${sf.pairs ? ' · ' + sf.pairs.length + ' pares de remediciones' : ''}`, `residual σ = ${fmtNum(sf.fit.sigma, 3)} m${sf.pairs ? ' · ' + sf.pairs.length + ' remeasurement pairs' : ''}`] });
  const tMax = Math.max(...data.map(r => r.t)) * 1.15, xs = Array.from({ length: 100 }, (_, i) => 1 + i * (tMax - 1) / 99);
  const ser = [];
  const by = new Map();
  data.forEach(r => { if (!by.has(r.plot)) by.set(r.plot, []); by.get(r.plot).push(r); });
  by.forEach(rs => { const s = rs.slice().sort((a, b) => a.t - b.t); ser.push({ type: 'line', x: s.map(r => r.t), y: s.map(r => r.h), color: 'var(--fig-muted)', width: 0.9 }); });
  cl.classes.forEach((c, k) => {
    ser.push({ type: 'line', x: xs, y: xs.map(t => sf.curve(c.mid, t)), color: Plot.color(k), width: 2.6, label: T('Clase ', 'Class ') + GR().roman(c.cls) + ' (IS ' + n1(c.mid) + ')' });
    ser.push({ type: 'band', x: xs, y: xs.map(t => sf.curve(c.lo, t)), y2: xs.map(t => sf.curve(c.hi, t)), color: Plot.color(k), opacity: 0.08 });
  });
  ser.push({ type: 'vline', x: tb, color: 'var(--fig-ink)', dash: '3 3' });
  UI.figure(R.site, { title: ['Curvas de índice de sitio y trayectorias de las parcelas', 'Site index curves and plot trajectories'], svg: Plot.xy({ series: ser, xlab: T('Edad (años)', 'Age (years)'), ylab: T('Altura dominante (m)', 'Dominant height (m)'), name: 'b5-indice-sitio', w: 680, h: 420, zeroY: true }), note: [`La línea vertical marca la edad base (${tb} años). Gris: cada parcela.`, `The vertical line marks the base age (${tb} years). Grey: each plot.`], key: 'b5-site' });
  UI.table(R.site, { title: ['Clases de sitio', 'Site classes'], file: 'forestpro_clases_sitio', columns: [
    { key: 'cls', label: ['Clase', 'Class'], get: c => GR().roman(c.cls), raw: c => c.cls }, { key: 'lo', label: ['IS desde (m)', 'SI from (m)'], num: true, fmt: n1 }, { key: 'hi', label: ['IS hasta (m)', 'SI to (m)'], num: true, fmt: n1 }, { key: 'n', label: ['Parcelas', 'Plots'], num: true }], rows: cl.classes });
  UI.table(R.site, { title: ['Índice de sitio de cada parcela', 'Site index of each plot'], file: 'forestpro_sitio_parcelas', columns: [
    { key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'si', label: [`IS a ${tb} años (m)`, `SI at ${tb} years (m)`], num: true, fmt: n2 }, { key: 'siSd', label: ['DE entre mediciones', 'SD among measurements'], num: true, fmt: n2 },
    { key: 'n', label: ['Mediciones', 'Measurements'], num: true }, { key: 'cls', label: ['Clase', 'Class'], get: p => GR().roman(p.cls), raw: p => p.cls }], rows: cl.plots, limit: 40 });
  const sdm = Num.mean(cl.plots.map(p => p.siSd).filter(isFinite));
  UI.interp(R.site, [`Los índices van de ${n1(Math.min(...cl.plots.map(p => p.si)))} a ${n1(Math.max(...cl.plots.map(p => p.si)))} m a los ${tb} años. La desviación del índice de una misma parcela entre sus mediciones es de ${n2(sdm)} m: ${sdm < 0.6 ? 'las curvas siguen bien la forma en que crecen las parcelas.' : 'grande; prueba otra familia de curvas (las polimórficas suelen seguir mejor sitios que crecen a ritmos distintos).'}`,
    `The indices range from ${n1(Math.min(...cl.plots.map(p => p.si)))} to ${n1(Math.max(...cl.plots.map(p => p.si)))} m at ${tb} years. The spread of the index of the same plot among its measurements is ${n2(sdm)} m: ${sdm < 0.6 ? 'the curves follow well the way the plots grow.' : 'large; try another family of curves (polymorphic ones usually follow better sites that grow at different paces).'}`]);
  Report.set(5, true); refreshStepMarks();
}

/* ---------------- D ---------------- */
function runClutter() {
  R.clut.innerHTML = ''; R.yield.innerHTML = '';
  if (!S.site || !S.rem.some(r => r.g_ha > 0 && r.v_ha > 0)) { if (S.rem) showMessage(R.clut, 'info', L2('La proyección necesita el área basal y el volumen por hectárea de las remediciones y el índice de sitio de cada parcela.', 'The projection needs the basal area and volume per hectare of the remeasurements and the site index of each plot.')); return; }
  const sMap = new Map(S.site.cl.plots.map(p => [String(p.plot), p.si]));
  const c = GR().clutter(S.rem.map(r => ({ plot: r.parcela, t: r.edad, g: r.g_ha, v: r.v_ha, s: sMap.get(String(r.parcela)) })));
  if (!c.ok) { showMessage(R.clut, 'warning', L2('Hacen falta al menos 6 pares de remediciones.', 'At least 6 remeasurement pairs are needed.')); return; }
  S.clutter = c;
  /* sensible defaults from the data */
  const young = S.rem.filter(r => r.edad === Math.min(...S.rem.map(x => x.edad)));
  if (!el('b5S').value) el('b5S').value = n1(Num.median(S.site.cl.plots.map(p => p.si))).replace(/,/g, '');
  if (!el('b5g0').value) el('b5g0').value = n1(Num.mean(S.rem.filter(r => r.edad <= Math.min(...S.rem.map(x => x.edad)) + 1).map(r => r.g_ha))).replace(/,/g, '');
  el('b5t0').value = Math.round(Num.mean(young.map(r => r.edad)));
  const rows = [{ par: 'α₀', est: c.alpha[0], se: c.seAlpha[0] }, { par: 'α₁', est: c.alpha[1], se: c.seAlpha[1] }].concat(['β₀', 'β₁', 'β₂', 'β₃'].map((p, i) => ({ par: p, est: c.beta[i], se: c.seBeta[i] })));
  UI.table(R.clut, { title: [`Sistema de Clutter (${c.n} pares de remediciones)`, `Clutter system (${c.n} remeasurement pairs)`], file: 'forestpro_clutter', columns: [
    { key: 'par', label: ['Parámetro', 'Parameter'] }, { key: 'est', label: ['Estimación', 'Estimate'], num: true, html: true, get: r => fmtSig(r.est, 5), raw: r => r.est }, { key: 'se', label: ['Error estándar', 'Std. error'], num: true, html: true, get: r => fmtSig(r.se, 4), raw: r => r.se }],
    rows, note: [`σ de ln G₂ = ${fmtNum(c.sigmaG, 4)}; σ de ln V₂ = ${fmtNum(c.sigmaV, 4)}`, `σ of ln G₂ = ${fmtNum(c.sigmaG, 4)}; σ of ln V₂ = ${fmtNum(c.sigmaV, 4)}`] });
  drawYield();
}
function drawYield(edited) {
  R.yield.innerHTML = '';
  const o = { clutter: S.clutter, S: +el('b5S').value, t0: +el('b5t0').value, g0: +el('b5g0').value, n0: +el('b5n0').value, mort: +el('b5mort').value, tEnd: +el('b5tEnd').value, step: +el('b5step').value || 2, site: S.site.sf };
  if (!(o.S > 0 && o.t0 > 0 && o.g0 > 0 && o.n0 > 0 && o.tEnd > o.t0)) return;
  const y = edited || GR().yieldTable(o);
  S.yield = y;
  UI.tiles(R.yield.appendChild(mk('div')), [
    [['Turno de máximo IMA', 'Rotation of maximum MAI'], n1(y.tRot) + T(' años', ' years'), y.atEnd ? ['el IMA aún crece al final de la tabla', 'MAI still rising at the end of the table'] : null, y.atEnd ? 'warn' : 'ok'],
    [['IMA máximo', 'Maximum MAI'], n1(y.maxIMA) + ' m³/ha/' + T('año', 'yr')],
    [['Volumen al turno', 'Volume at rotation'], fmtNum((y.rows.find(r => r.t === y.tRot) || {}).V, 0) + ' m³/ha'],
  ]);
  const xs = y.rows.map(r => r.t);
  const two = mk('div', { class: 'figs-2' }); R.yield.appendChild(two);
  UI.figure(two, { title: ['Volumen proyectado', 'Projected volume'], svg: Plot.xy({ series: [{ type: 'line', x: xs, y: y.rows.map(r => r.V), color: 'var(--primary)', width: 2.6, label: 'V (m³/ha)' }, { type: 'points', x: xs, y: y.rows.map(r => r.V), color: 'var(--primary)', r: 3 }], xlab: T('Edad (años)', 'Age (years)'), ylab: T('Volumen (m³/ha)', 'Volume (m³/ha)'), name: 'b5-volumen', w: 520, h: 360, zeroY: true, legend: false }), key: 'b5-vol' });
  UI.figure(two, { title: ['ICA e IMA del volumen', 'CAI and MAI of volume'], svg: Plot.xy({ series: [{ type: 'line', x: xs, y: y.rows.map(r => r.ica), color: 'var(--primary)', width: 2.4, label: T('ICA', 'CAI') }, { type: 'line', x: xs, y: y.rows.map(r => r.ima), color: 'var(--accent)', width: 2.4, label: T('IMA', 'MAI') }, { type: 'vline', x: y.tRot, color: 'var(--fig-ink)' }], xlab: T('Edad (años)', 'Age (years)'), ylab: 'm³/ha/' + T('año', 'yr'), name: 'b5-ica-ima-rodal', w: 520, h: 360, zeroY: true }), key: 'b5-yinc' });
  R.yield.appendChild(mk('h4', { class: 'tbl-title' }, L2('Tabla de producción (editable: cambia un valor y se recalculan Dq, ICA, IMA y el turno)', 'Yield table (editable: change a value and Dq, CAI, MAI and the rotation are recomputed)')));
  const g = mk('div'); R.yield.appendChild(g);
  UI.grid(g, [{ key: 't', label: ['Edad', 'Age'], num: true }, { key: 'hdom', label: ['Altura dominante (m)', 'Dominant height (m)'], num: true }, { key: 'N', label: ['N (árb/ha)', 'N (trees/ha)'], num: true }, { key: 'G', label: ['G (m²/ha)'], num: true }, { key: 'V', label: ['V (m³/ha)'], num: true }],
    y.rows.map(r => ({ t: +r.t.toFixed(2), hdom: +r.hdom.toFixed(2), N: Math.round(r.N), G: +r.G.toFixed(2), V: +r.V.toFixed(1) })), { removable: true, onChange: rows => {
      const rs = rows.filter(r => r.t > 0 && r.V > 0).sort((a, b) => a.t - b.t).map(r => ({ t: r.t, hdom: r.hdom, N: r.N, G: r.G, dq: Math.sqrt(r.G / r.N * 40000 / Math.PI), V: r.V }));
      if (rs.length > 1) drawYield(GR().finishYield(rs));
    } });
  UI.table(R.yield, { title: ['Tabla de producción completa', 'Full yield table'], file: 'forestpro_tabla_produccion', columns: [
    { key: 't', label: ['Edad', 'Age'], num: true, fmt: n1 }, { key: 'hdom', label: ['Hdom (m)'], num: true, fmt: n1 }, { key: 'N', label: ['N (árb/ha)', 'N (trees/ha)'], num: true, fmt: v => fmtNum(v, 0) },
    { key: 'G', label: ['G (m²/ha)'], num: true, fmt: n2 }, { key: 'dq', label: ['Dq (cm)'], num: true, fmt: n1 }, { key: 'V', label: ['V (m³/ha)'], num: true, fmt: n1 },
    { key: 'ica', label: ['ICA (m³/ha/año)', 'CAI (m³/ha/yr)'], num: true, fmt: n2 }, { key: 'ima', label: ['IMA (m³/ha/año)', 'MAI (m³/ha/yr)'], num: true, fmt: n2 }], rows: y.rows.map(r => Object.assign({}, r, { _class: r.t === y.tRot ? 'row-sel' : '' })) });
  UI.interp(R.yield, [`Con índice de sitio ${n1(o.S)} m, el volumen medio anual es máximo a los ${n1(y.tRot)} años (${n1(y.maxIMA)} m³/ha/año). El sistema se ajustó con parcelas de ${n1(Math.min(...S.rem.map(r => r.edad)))} a ${n1(Math.max(...S.rem.map(r => r.edad)))} años: más allá, la tabla es extrapolación.`,
    `With site index ${n1(o.S)} m, the mean annual volume increment peaks at ${n1(y.tRot)} years (${n1(y.maxIMA)} m³/ha/yr). The system was fitted with plots from ${n1(Math.min(...S.rem.map(r => r.edad)))} to ${n1(Math.max(...S.rem.map(r => r.edad)))} years: beyond, the table is extrapolation.`]);
  state.growth = Object.assign(state.growth || {}, { yield: { tRot: y.tRot, maxIMA: y.maxIMA, S: o.S } });
  Report.set(5, true); refreshStepMarks();
}

ExampleHooks['pino:5'] = () => { build(); S.cardA.load('pino'); S.cardC.load('pino'); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('langchange', () => { if (!el('b5root')) return; if (S.series) { drawInc(); if (S.models) drawModels(); } if (S.site) drawSite(); if (S.clutter) runClutter(); });
})();
