/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 3: forest inventory and sampling.
   The inventory loaded here (trees and plots) is the one the other blocks use. */
(function () {
'use strict';
const S = { trees: null, plots: null, rel: null };
const R = {};
const n0 = v => fmtNum(v, 0), n1 = v => fmtNum(v, 1), n2 = v => fmtNum(v, 2), n3 = v => fmtNum(v, 3);
const IV = () => window.Invent;
const VARS = {
  N: { es: 'Densidad (árboles/ha)', en: 'Density (trees/ha)', u: 'árb/ha', ue: 'trees/ha', f: n0, ph: ['la densidad media', 'the mean density'] },
  G: { es: 'Área basal (m²/ha)', en: 'Basal area (m²/ha)', u: 'm²/ha', ue: 'm²/ha', f: n2, ph: ['el área basal media', 'the mean basal area'] },
  V: { es: 'Volumen (m³/ha)', en: 'Volume (m³/ha)', u: 'm³/ha', ue: 'm³/ha', f: n1, ph: ['el volumen medio', 'the mean volume'] },
};

const FT = [
  { key: 'parcela', es: 'Parcela', en: 'Plot', req: true, aliases: ['plot', 'sitio', 'unidad', 'conglomerado parcela'] },
  { key: 'estrato', es: 'Estrato', en: 'Stratum', aliases: ['stratum', 'strata', 'tipo'] },
  { key: 'especie', es: 'Especie', en: 'Species', aliases: ['species', 'sp', 'nombre cientifico'] },
  { key: 'familia', es: 'Familia', en: 'Family', aliases: ['family'] },
  { key: 'dap', es: 'DAP (cm)', en: 'DBH (cm)', num: true, req: true, aliases: ['dbh', 'd130', 'diametro', 'd'] },
  { key: 'altura', es: 'Altura total (m)', en: 'Total height (m)', num: true, aliases: ['ht', 'h', 'height'] },
  { key: 'copa', es: 'Diámetro de copa (m)', en: 'Crown diameter (m)', num: true, aliases: ['crown', 'diametro de copa', 'dc'] },
  { key: 'estado', es: 'Estado (vivo / muerto)', en: 'Status (alive / dead)', aliases: ['status', 'condicion'] },
  { key: 'x', es: 'x (m)', en: 'x (m)', num: true, aliases: ['coordx', 'xm'] },
  { key: 'y', es: 'y (m)', en: 'y (m)', num: true, aliases: ['coordy', 'ym'] },
];
const FP = [
  { key: 'parcela', es: 'Parcela', en: 'Plot', req: true, aliases: ['plot', 'sitio'] },
  { key: 'estrato', es: 'Estrato', en: 'Stratum', aliases: ['stratum'] },
  { key: 'area_estrato_ha', es: 'Superficie del estrato (ha)', en: 'Area of the stratum (ha)', num: true, aliases: ['area estrato', 'stratum area'] },
  { key: 'conglomerado', es: 'Conglomerado', en: 'Cluster', aliases: ['cluster', 'finca', 'grupo'] },
  { key: 'radio_m', es: 'Radio (m)', en: 'Radius (m)', num: true, aliases: ['radio', 'radius', 'radio grande m', 'r'] },
  { key: 'radio_chico_m', es: 'Radio de la subparcela (m)', en: 'Radius of the subplot (m)', num: true, aliases: ['radio chico', 'radio subparcela'] },
  { key: 'dap_corte_cm', es: 'DAP de corte entre parcelas (cm)', en: 'DBH cut between plots (cm)', num: true, aliases: ['dap corte', 'corte'] },
  { key: 'lado_m', es: 'Lado del cuadrado (m)', en: 'Side of the square (m)', num: true, aliases: ['lado', 'side'] },
  { key: 'largo_m', es: 'Largo (m)', en: 'Length (m)', num: true, aliases: ['largo', 'length'] },
  { key: 'ancho_m', es: 'Ancho (m)', en: 'Width (m)', num: true, aliases: ['ancho', 'width'] },
  { key: 'area_m2', es: 'Superficie de la parcela (m²)', en: 'Plot area (m²)', num: true, aliases: ['area', 'superficie', 'plot area'] },
  { key: 'lat', es: 'Latitud', en: 'Latitude', num: true, aliases: ['latitude', 'y'] },
  { key: 'lon', es: 'Longitud', en: 'Longitude', num: true, aliases: ['longitude', 'long', 'x'] },
];
const exTrees = id => {
  if (id === 'cafetal') return FPData.rows('cafetal_arboles').map(r => ({ parcela: r.parcela, estrato: '', especie: r.especie, familia: r.familia, dap: r.dap, altura: r.altura, copa: r.copa, estado: r.estado, x: r.x, y: r.y }));
  return FPData.rows('mesofilo_arboles').map(r => ({ parcela: r.parcela, estrato: r.estrato, especie: r.especie, familia: r.familia, dap: r.dap, altura: r.altura, copa: NaN, estado: r.estado, x: r.x, y: r.y }));
};
const exPlots = id => {
  if (id === 'cafetal') return FPData.rows('cafetal_parcelas').map(r => ({ parcela: r.parcela, estrato: r.manejo, area_estrato_ha: NaN, conglomerado: r.finca, radio_m: r.radio_m, radio_chico_m: NaN, dap_corte_cm: NaN, lado_m: NaN, largo_m: NaN, ancho_m: NaN, area_m2: r.area_m2, lat: r.lat, lon: r.lon }));
  return FPData.rows('mesofilo_parcelas').map(r => ({ parcela: r.parcela, estrato: r.estrato, area_estrato_ha: r.area_estrato_ha, conglomerado: '', radio_m: r.radio_grande_m, radio_chico_m: r.radio_chico_m, dap_corte_cm: r.dap_corte_cm, lado_m: NaN, largo_m: NaN, ancho_m: NaN, area_m2: NaN, lat: r.lat, lon: r.lon }));
};
const EXT = [
  { id: 'cafetal', es: 'Cafetal bajo sombra: árboles', en: 'Shaded coffee farm: trees', d: ['719 árboles de sombra en 25 parcelas circulares de 1 000 m², agrupadas en 5 fincas.', '719 shade trees in 25 circular plots of 1,000 m², grouped in 5 farms.'], rows: () => exTrees('cafetal') },
  { id: 'mesofilo', es: 'Bosque mesófilo: árboles', en: 'Cloud forest: trees', d: ['Parcelas anidadas: DAP ≥ 10 cm en 1 000 m² y de 2.5 a 10 cm en 100 m²; 3 estratos.', 'Nested plots: DBH ≥ 10 cm in 1,000 m² and 2.5–10 cm in 100 m²; 3 strata.'], rows: () => exTrees('mesofilo') },
];
const EXP = [
  { id: 'cafetal', es: 'Cafetal: parcelas', en: 'Coffee farm: plots', d: ['Radio, finca (conglomerado), tipo de manejo y coordenadas de cada parcela.', 'Radius, farm (cluster), management type and coordinates of each plot.'], rows: () => exPlots('cafetal') },
  { id: 'mesofilo', es: 'Bosque mesófilo: parcelas', en: 'Cloud forest: plots', d: ['Radios de la parcela y la subparcela, DAP de corte, estrato y su superficie.', 'Radii of the plot and the subplot, cut DBH, stratum and its area.'], rows: () => exPlots('mesofilo') },
];

/* ---------------- the page ---------------- */
function build() {
  const root = el('b3root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Carga los árboles y, si las tienes, las parcelas (con su forma, tamaño, estrato y coordenadas). El inventario queda disponible para la biomasa, la diversidad, la agroforestería y el mapa.',
    'Load the trees and, if you have them, the plots (with their shape, size, stratum and coordinates). The inventory then serves biomass, diversity, agroforestry and the map.')));

  /* A. the inventory */
  const a = UI.section(root, ['El inventario: árboles y parcelas', 'The inventory: trees and plots'],
    ['Una fila por árbol con su parcela; una fila por parcela con su diseño. Si no cargas parcelas, todas toman el diseño de abajo.', 'One row per tree with its plot; one row per plot with its design. If you do not load plots, all take the design below.']);
  a.appendChild(mk('h3', null, L2('Árboles', 'Trees')));
  /* a new table of trees or plots is a new inventory: the design and the measurement threshold are chosen again */
  S.cardT = UI.dataCard(a, { id: 'b3t', fields: FT, examples: EXT, onData: (rows, meta) => { S.trees = rows; S.treesName = meta.name; S.treesExample = meta.example || null; S.designSet = false; if (meta.example) { S.cardP.load(meta.example); return; } assemble(); } });
  a.appendChild(mk('h3', null, L2('Parcelas (opcional)', 'Plots (optional)')));
  S.cardP = UI.dataCard(a, { id: 'b3p', fields: FP, examples: EXP, onData: rows => { S.plots = rows; S.designSet = false; assemble(); } });
  const dg = mk('details', { class: 'method-box' });
  dg.innerHTML = `<summary>${L2('Diseño por omisión y superficie del predio', 'Default design and area of the property')}</summary>`;
  const fg = mk('div', { class: 'form-grid method-body' });
  fg.innerHTML = `<div class="field"><label for="b3shape">${L2('Forma', 'Shape')}</label><select id="b3shape"><option value="circle"${optL('Circular', 'Circular')}</option><option value="square"${optL('Cuadrada', 'Square')}</option><option value="rect"${optL('Rectangular', 'Rectangular')}</option><option value="nested"${optL('Circular anidada', 'Nested circular')}</option></select></div>` +
    [['b3r', 'Radio (m)', 'Radius (m)', 17.84], ['b3side', 'Lado (m)', 'Side (m)', 31.62], ['b3a', 'Largo (m)', 'Length (m)', 50], ['b3b', 'Ancho (m)', 'Width (m)', 20], ['b3rs', 'Radio de la subparcela (m)', 'Subplot radius (m)', 5.64], ['b3cut', 'DAP de corte (cm)', 'Cut DBH (cm)', 10], ['b3area', 'Superficie total (ha)', 'Total area (ha)', 100]]
      .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('');
  dg.appendChild(fg);
  a.appendChild(dg);
  ['b3shape', 'b3r', 'b3side', 'b3a', 'b3b', 'b3rs', 'b3cut', 'b3area'].forEach(id => el(id).addEventListener('change', () => { if (S.trees) assemble(); }));
  R.inv = mk('div', { class: 'res-host' }); a.appendChild(R.inv);

  /* B. expansion */
  const b = UI.section(root, ['Expansión a la hectárea', 'Expansion to the hectare'],
    ['Cada árbol representa 10 000/a árboles por hectárea, con a la superficie de la parcela (o de la subparcela que le toca por su diámetro).', 'Each tree stands for 10,000/a trees per hectare, with a the area of the plot (or of the subplot its diameter belongs to).']);
  const bf = mk('div', { class: 'form-grid' });
  bf.innerHTML = `<div class="field"><label for="b3vol">${L2('Volumen de cada árbol', 'Volume of each tree')}</label><select id="b3vol"><option value="ff"${optL('g · H · coeficiente mórfico', 'g · H · form factor')}</option><option value="eq"${optL('Ecuación ajustada en el Bloque 2', 'Equation fitted in Block 2')}</option></select></div>` +
    `<div class="field"><label for="b3ff">${L2('Coeficiente mórfico', 'Form factor')}</label><input type="number" id="b3ff" value="0.5" step="0.01"></div>` +
    `<label class="checkbox-label"><input type="checkbox" id="b3fillH" checked> ${L2('Estimar las alturas faltantes (Näslund)', 'Estimate the missing heights (Näslund)')}</label>`;
  b.appendChild(bf);
  ['b3vol', 'b3ff', 'b3fillH'].forEach(id => el(id).addEventListener('change', () => { if (S.trees) assemble(); }));
  R.exp = mk('div', { class: 'res-host' }); b.appendChild(R.exp);
  UI.method(b, { text: [
    '<p>Factor de expansión FE = 10 000 / a (a en m²). Por parcela: N = Σ FE; G = Σ FE·g; V = Σ FE·v; Dq = √(Σ FE·d²/N); altura dominante = media de las alturas de los 100 árboles más gruesos por hectárea (Assmann), contando cada árbol FE veces. Los árboles muertos en pie se informan aparte. Las alturas que faltan se estiman con una curva de Näslund ajustada a los árboles del mismo inventario que sí tienen altura.</p>',
    '<p>Expansion factor EF = 10,000 / a (a in m²). Per plot: N = Σ EF; G = Σ EF·g; V = Σ EF·v; Dq = √(Σ EF·d²/N); dominant height = mean height of the 100 thickest trees per hectare (Assmann), counting each tree EF times. Standing dead trees are reported apart. Missing heights are estimated with a Näslund curve fitted to the trees of the same inventory that have a height.</p>'],
    refs: ['Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, cap. 12–13. Wiley.', 'Assmann, E. (1970). <i>The Principles of Forest Yield Study</i>. Pergamon.'] });

  /* C. estimation */
  const c = UI.section(root, ['Estimación y error de muestreo', 'Estimation and sampling error'],
    ['La media por hectárea, su error estándar, el intervalo de confianza, el error de muestreo en % y el total del predio, según el diseño con que se tomaron las parcelas.', 'The mean per hectare, its standard error, the confidence interval, the sampling error in % and the total of the property, according to the design with which the plots were taken.']);
  const cf = mk('div', { class: 'form-grid' });
  cf.innerHTML = `<div class="field"><label for="b3var">${L2('Variable', 'Variable')}</label><select id="b3var">${Object.keys(VARS).map(k => `<option value="${k}"${optL(VARS[k].es, VARS[k].en)}</option>`).join('')}</select></div>` +
    `<div class="field wide"><label for="b3design">${L2('Diseño', 'Design')}</label><select id="b3design"><option value="srs"${optL('Muestreo aleatorio simple', 'Simple random sampling')}</option><option value="strat"${optL('Estratificado', 'Stratified')}</option><option value="sys"${optL('Sistemático (diferencias sucesivas)', 'Systematic (successive differences)')}</option><option value="cluster"${optL('En conglomerados', 'Cluster')}</option></select></div>` +
    `<div class="field"><label for="b3conf">${L2('Confianza', 'Confidence')}</label><select id="b3conf"><option value="0.9">90 %</option><option value="0.95" selected>95 %</option><option value="0.99">99 %</option></select></div>` +
    `<label class="checkbox-label"><input type="checkbox" id="b3fpc"> ${L2('Corrección por población finita', 'Finite-population correction')}</label>`;
  c.appendChild(cf);
  ['b3var', 'b3design', 'b3conf', 'b3fpc'].forEach(id => el(id).addEventListener('change', () => { if (S.per) drawEst(); }));
  R.est = mk('div', { class: 'res-host' }); c.appendChild(R.est);
  UI.method(c, { text: [
    '<p><b>Aleatorio simple:</b> ȳ, s²/n·(1 − n/N). <b>Estratificado:</b> ȳ<sub>st</sub> = Σ W<sub>h</sub>ȳ<sub>h</sub> con W<sub>h</sub> la proporción de superficie; V(ȳ<sub>st</sub>) = Σ W<sub>h</sub>² s<sub>h</sub>²/n<sub>h</sub>·(1 − f<sub>h</sub>) con la asignación que realmente se hizo, y los grados de libertad efectivos de Satterthwaite. Muchas tablas forestales usan (Σ W<sub>h</sub>s<sub>h</sub>)²/n, que solo es la varianza si la muestra se repartió con la asignación óptima de Neyman; la app da ese valor aparte para comparar. <b>Sistemático:</b> la varianza por diferencias sucesivas Σ(y<sub>i+1</sub> − y<sub>i</sub>)²/(2n(n − 1)) en el orden de la malla; menos pesimista que tratar la malla como aleatoria cuando hay tendencia espacial. <b>Conglomerados:</b> estimador de razón Σy<sub>i</sub>/Σm<sub>i</sub> con conglomerados de tamaño desigual; el efecto del diseño compara su varianza con la de parcelas independientes. Intervalo: ȳ ± t·EE; error de muestreo = t·EE/ȳ·100.</p>',
    '<p><b>Simple random:</b> ȳ, s²/n·(1 − n/N). <b>Stratified:</b> ȳ<sub>st</sub> = Σ W<sub>h</sub>ȳ<sub>h</sub> with W<sub>h</sub> the share of area; V(ȳ<sub>st</sub>) = Σ W<sub>h</sub>² s<sub>h</sub>²/n<sub>h</sub>·(1 − f<sub>h</sub>) with the allocation actually used, and Satterthwaite\'s effective degrees of freedom. Many forestry tables use (Σ W<sub>h</sub>s<sub>h</sub>)²/n, which is the variance only if the sample was spread with Neyman\'s optimum allocation; the app gives that value apart for comparison. <b>Systematic:</b> the successive-differences variance Σ(y<sub>i+1</sub> − y<sub>i</sub>)²/(2n(n − 1)) in grid order; less pessimistic than treating the grid as random when there is a spatial trend. <b>Cluster:</b> ratio estimator Σy<sub>i</sub>/Σm<sub>i</sub> with clusters of unequal size; the design effect compares its variance with that of independent plots. Interval: ȳ ± t·SE; sampling error = t·SE/ȳ·100.</p>'],
    refs: ['Cochran, W. G. (1977). <i>Sampling Techniques</i>, 3.ª ed. Wiley.', 'Shiver, B. D. y Borders, B. E. (1996). <i>Sampling Techniques for Forest Resource Inventory</i>. Wiley.', 'Satterthwaite, F. E. (1946). An approximate distribution of estimates of variance components. <i>Biometrics Bulletin</i> 2:110–114.'] });

  /* D. sample size */
  const d = UI.section(root, ['Tamaño de muestra', 'Sample size'],
    ['¿Cuántas parcelas hacen falta para un error de muestreo dado? Se itera la t de Student con los grados de libertad del tamaño que resulta.', 'How many plots are needed for a given sampling error? The t of Student is iterated with the degrees of freedom of the size it gives.']);
  const df = mk('div', { class: 'form-grid' });
  df.innerHTML = [['b3cv', 'Coeficiente de variación (%)', 'Coefficient of variation (%)', 40], ['b3err', 'Error permisible (%)', 'Permissible error (%)', 10], ['b3Nplots', 'Parcelas posibles N (vacío = infinita)', 'Possible plots N (empty = infinite)', '']]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('') +
    `<div class="field"><label for="b3conf2">${L2('Confianza', 'Confidence')}</label><select id="b3conf2"><option value="0.9">90 %</option><option value="0.95" selected>95 %</option><option value="0.99">99 %</option></select></div>` +
    `<div class="field"><label for="b3alloc">${L2('Asignación por estrato', 'Allocation by stratum')}</label><select id="b3alloc"><option value="neyman"${optL('Óptima (Neyman)', 'Optimum (Neyman)')}</option><option value="prop"${optL('Proporcional', 'Proportional')}</option></select></div>`;
  d.appendChild(df);
  const useCv = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Tomar el CV del inventario cargado', 'Take the CV of the loaded inventory'));
  useCv.addEventListener('click', () => { if (!S.per) return; const v = el('b3var').value, e = IV().srs(S.per.map(p => p[v])); el('b3cv').value = e.cv.toFixed(1); drawSize(); });
  d.appendChild(mk('div', { class: 'btn-row' })).appendChild(useCv);
  ['b3cv', 'b3err', 'b3Nplots', 'b3conf2', 'b3alloc'].forEach(id => el(id).addEventListener('input', drawSize));
  R.size = mk('div', { class: 'res-host' }); d.appendChild(R.size);
  UI.method(d, { text: [
    '<p>Población infinita: n = t²·CV²/E². Finita (N parcelas posibles): n = t²·CV²/(E² + t²·CV²/N). Se empieza con t de 30 grados de libertad y se repite con n − 1 hasta que n no cambia. Por estratos, con D = E·ȳ<sub>st</sub>/t: asignación óptima n = (ΣW<sub>h</sub>s<sub>h</sub>)²/(D² + ΣW<sub>h</sub>s<sub>h</sub>²/N) y n<sub>h</sub> ∝ W<sub>h</sub>s<sub>h</sub>; proporcional n = ΣW<sub>h</sub>s<sub>h</sub>²/(D² + ΣW<sub>h</sub>s<sub>h</sub>²/N) y n<sub>h</sub> ∝ W<sub>h</sub>.</p>',
    '<p>Infinite population: n = t²·CV²/E². Finite (N possible plots): n = t²·CV²/(E² + t²·CV²/N). It starts with the t of 30 degrees of freedom and repeats with n − 1 until n stops changing. By strata, with D = E·ȳ<sub>st</sub>/t: optimum allocation n = (ΣW<sub>h</sub>s<sub>h</sub>)²/(D² + ΣW<sub>h</sub>s<sub>h</sub>²/N) and n<sub>h</sub> ∝ W<sub>h</sub>s<sub>h</sub>; proportional n = ΣW<sub>h</sub>s<sub>h</sub>²/(D² + ΣW<sub>h</sub>s<sub>h</sub>²/N) and n<sub>h</sub> ∝ W<sub>h</sub>.</p>'],
    refs: ['Cochran, W. G. (1977). <i>Sampling Techniques</i>, §4.6 y §5.5. Wiley.', 'Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, cap. 13. Wiley.'] });

  /* E. relascope */
  const e = UI.section(root, ['Relascopía (muestreo puntual)', 'Point sampling (relascope)'],
    ['En cada punto se cuentan los árboles que el relascopio o la cuña dan como «dentro» con un factor de área basal (FAB); cada uno representa FAB/g árboles por hectárea.', 'At each point the trees the relascope or the prism counts “in” with a basal-area factor (BAF) are recorded; each one stands for BAF/g trees per hectare.']);
  const ef = mk('div', { class: 'form-grid' });
  ef.innerHTML = `<div class="field"><label for="b3baf">${L2('Factor de área basal (m²/ha)', 'Basal-area factor (m²/ha)')}</label><input type="number" id="b3baf" value="2" step="any"></div><div class="field"><label for="b3rff">${L2('Coeficiente mórfico', 'Form factor')}</label><input type="number" id="b3rff" value="0.5" step="0.01"></div>`;
  e.appendChild(ef);
  ['b3baf', 'b3rff'].forEach(id => el(id).addEventListener('change', () => { if (S.rel) drawRel(); }));
  S.cardR = UI.dataCard(e, { id: 'b3r', fields: [
    { key: 'punto', es: 'Punto', en: 'Point', req: true, aliases: ['point', 'pto'] },
    { key: 'especie', es: 'Especie', en: 'Species', aliases: ['species'] },
    { key: 'dap', es: 'DAP (cm)', en: 'DBH (cm)', num: true, req: true, aliases: ['dbh', 'd'] },
    { key: 'altura', es: 'Altura (m)', en: 'Height (m)', num: true, aliases: ['h', 'ht'] }],
    examples: [{ id: 'mesofilo', es: 'Bosque mesófilo: 15 puntos, FAB = 2', en: 'Cloud forest: 15 points, BAF = 2', d: ['Los árboles contados «dentro» en cada punto, con su DAP y altura.', 'The trees counted “in” at each point, with their DBH and height.'], rows: () => FPData.rows('mesofilo_relascopio').map(r => ({ punto: r.punto, especie: r.especie, dap: r.dap, altura: r.altura })) }],
    onData: rows => { S.rel = rows; drawRel(); } });
  R.rel = mk('div', { class: 'res-host' }); e.appendChild(R.rel);
  UI.method(e, { text: [
    '<p>Un árbol de diámetro d entra si está a menos de R = d/(2√FAB) m del punto (d en cm). Por punto: G = FAB × árboles contados; N = Σ FAB/g<sub>i</sub>; V = Σ FAB·v<sub>i</sub>/g<sub>i</sub>. La estimación entre puntos es la del muestreo aleatorio simple. Elige el FAB para contar de 7 a 15 árboles por punto.</p>',
    '<p>A tree of diameter d is in if it is closer than R = d/(2√BAF) m to the point (d in cm). Per point: G = BAF × trees counted; N = Σ BAF/g<sub>i</sub>; V = Σ BAF·v<sub>i</sub>/g<sub>i</sub>. The estimate across points is that of simple random sampling. Choose the BAF so as to count 7 to 15 trees per point.</p>'],
    refs: ['Bitterlich, W. (1948). Die Winkelzählprobe. <i>Allgemeine Forst- und Holzwirtschaftliche Zeitung</i> 59:4–5.', 'Grosenbaugh, L. R. (1952). Plotless timber estimates — new, fast, easy. <i>Journal of Forestry</i> 50:32–37.'] });

  /* F. structure */
  const f = UI.section(root, ['Estructura del rodal', 'Stand structure'],
    ['Distribución diamétrica con su modelo de Weibull, tabla de rodal, índice de valor de importancia e índices de densidad y competencia.', 'Diameter distribution with its Weibull model, stand table, importance value index and density and competition indices.']);
  const ff = mk('div', { class: 'form-grid' });
  ff.innerHTML = `<div class="field"><label for="b3w">${L2('Ancho de clase (cm)', 'Class width (cm)')}</label><input type="number" id="b3w" value="5" step="any"></div>` +
    `<div class="field"><label for="b3wb">${L2('Weibull', 'Weibull')}</label><select id="b3wb"><option value="2"${optL('2 parámetros', '2 parameters')}</option><option value="3"${optL('3 parámetros', '3 parameters')}</option></select></div>` +
    `<div class="field"><label for="b3trunc">${L2('DAP mínimo medido (cm)', 'Smallest DBH measured (cm)')}</label><input type="number" id="b3trunc" value="" step="any" min="0" placeholder="${esc(T('sin corte', 'no threshold'))}" data-es-ph="sin corte" data-en-ph="no threshold"></div>` +
    `<div class="field"><label for="b3st">${L2('Estrato', 'Stratum')}</label><select id="b3st"></select></div>` +
    `<div class="field"><label for="b3hegR">${L2('Radio de Hegyi (m)', 'Hegyi radius (m)')}</label><input type="number" id="b3hegR" value="6" step="any"></div>`;
  f.appendChild(ff);
  ['b3w', 'b3wb', 'b3trunc', 'b3st', 'b3hegR'].forEach(id => el(id).addEventListener('change', () => { if (S.per) drawStruct(); }));
  R.struct = mk('div', { class: 'res-host' }); f.appendChild(R.struct);
  UI.method(f, { text: [
    '<p><b>Weibull:</b> f(x) = (c/b)((x − a)/b)<sup>c−1</sup>exp(−((x − a)/b)<sup>c</sup>), por máxima verosimilitud con cada árbol pesado por su factor de expansión (para que la subparcela chica cuente lo que representa); con 3 parámetros, la ubicación a se busca por verosimilitud perfilada por debajo del menor diámetro, y la app avisa cuando queda a menos de 1 % de él. Si hay un DAP mínimo de medición t (los árboles más delgados no se midieron), la distribución se trunca por la izquierda: f(x)/S(t) para x ≥ t, con S(t) = exp(−((t − a)/b)<sup>c</sup>); la app propone el menor DAP del inventario. Bondad de ajuste con los mismos pesos del ajuste: la distribución empírica de Kolmogorov–Smirnov es la ponderada, F<sub>n</sub>(x) = Σw<sub>i</sub>[x<sub>i</sub> ≤ x]/Σw<sub>i</sub>, y el χ² compara las proporciones ponderadas de cada clase con las del modelo; los dos usan el tamaño efectivo de Kish, n<sub>ef</sub> = (Σw<sub>i</sub>)²/Σw<sub>i</sub>², en lugar del número de árboles (con parcelas anidadas, n<sub>ef</sub> es mucho menor). El p de K–S es el asintótico, conservador cuando los parámetros salen de la misma muestra; el χ² junta clases hasta que los esperados son ≥ 5. <b>IVI</b> = densidad relativa + dominancia relativa (área basal) + frecuencia relativa (proporción de parcelas con la especie); suma 300 (IVI % = IVI/3). <b>Reineke:</b> IDR = N·(Dq/25)<sup>1.605</sup>. <b>Hart–Becking:</b> S % = espaciamiento medio/altura dominante × 100, con espaciamiento √(10 000/N) en cuadro o √(20 000/(N√3)) en tresbolillo. <b>Hegyi:</b> IC<sub>i</sub> = Σ (D<sub>j</sub>/D<sub>i</sub>)/dist<sub>ij</sub> sobre los vecinos a menos de R m; los árboles a menos de R del borde se marcan porque les faltan vecinos.</p>',
    '<p><b>Weibull:</b> f(x) = (c/b)((x − a)/b)<sup>c−1</sup>exp(−((x − a)/b)<sup>c</sup>), by maximum likelihood with each tree weighted by its expansion factor (so that the small subplot counts for what it represents); with 3 parameters the location a is searched by profile likelihood below the smallest diameter, and the app warns when it ends within 1 % of it. If there is a smallest DBH measured t (thinner trees were not recorded), the distribution is left-truncated: f(x)/S(t) for x ≥ t, with S(t) = exp(−((t − a)/b)<sup>c</sup>); the app proposes the smallest DBH of the inventory. Goodness of fit with the same weights as the fit: the empirical distribution of Kolmogorov–Smirnov is the weighted one, F<sub>n</sub>(x) = Σw<sub>i</sub>[x<sub>i</sub> ≤ x]/Σw<sub>i</sub>, and the χ² compares the weighted share of each class with that of the model; both use Kish\'s effective size, n<sub>eff</sub> = (Σw<sub>i</sub>)²/Σw<sub>i</sub>², instead of the number of trees (with nested plots n<sub>eff</sub> is much smaller). The K–S p is the asymptotic one, conservative when the parameters come from the same sample; the χ² pools classes until the expected counts are ≥ 5. <b>IVI</b> = relative density + relative dominance (basal area) + relative frequency (share of plots with the species); it adds to 300 (IVI % = IVI/3). <b>Reineke:</b> SDI = N·(Dq/25)<sup>1.605</sup>. <b>Hart–Becking:</b> S % = mean spacing/dominant height × 100, with spacing √(10,000/N) in square or √(20,000/(N√3)) in triangular layout. <b>Hegyi:</b> CI<sub>i</sub> = Σ (D<sub>j</sub>/D<sub>i</sub>)/dist<sub>ij</sub> over the neighbors within R m; trees closer than R to the edge are flagged because they lack neighbors.</p>'],
    refs: ['Bailey, R. L. y Dell, T. R. (1973). Quantifying diameter distributions with the Weibull function. <i>Forest Science</i> 19:97–104.', 'Curtis, J. T. y McIntosh, R. P. (1951). An upland forest continuum in the prairie-forest border region of Wisconsin. <i>Ecology</i> 32:476–496.', 'Reineke, L. H. (1933). Perfecting a stand-density index for even-aged forests. <i>J. Agric. Res.</i> 46:627–638.', 'Wilson, F. G. (1946). Numerical expression of stocking in terms of height. <i>Journal of Forestry</i> 44:758–761.', 'Hegyi, F. (1974). A simulation model for managing jack-pine stands. En <i>Growth Models for Tree and Stand Simulation</i>, pp. 74–90. Royal College of Forestry.'] });
  drawSize();
}

/* ---------------- assemble the inventory ---------------- */
function defaultDesign() {
  return { shape: el('b3shape').value, r: +el('b3r').value, side: +el('b3side').value, a: +el('b3a').value, b: +el('b3b').value, rSmall: +el('b3rs').value, dCut: +el('b3cut').value };
}
function designOf(p, def) {
  if (!p) return def;
  if (p.radio_chico_m > 0 && p.dap_corte_cm > 0 && p.radio_m > 0) return { shape: 'nested', r: p.radio_m, rSmall: p.radio_chico_m, dCut: p.dap_corte_cm };
  if (p.radio_m > 0) return { shape: 'circle', r: p.radio_m };
  if (p.lado_m > 0) return { shape: 'square', side: p.lado_m };
  if (p.largo_m > 0 && p.ancho_m > 0) return { shape: 'rect', a: p.largo_m, b: p.ancho_m };
  if (p.area_m2 > 0) return { shape: 'area', area: p.area_m2 };
  return def;
}
/* «tocón» and «tocon», «Muerto» and «muerto»: accents do not matter */
const alive = s => !/muert|dead|seco|tocon|stump|snag/i.test(String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''));
function assemble() {
  if (!S.trees) return;
  const def = defaultDesign();
  const pmap = new Map((S.plots || []).map(p => [String(p.parcela), p]));
  const trees = S.trees.map((r, i) => ({ id: i + 1, plot: String(r.parcela), stratum: r.estrato || (pmap.get(String(r.parcela)) || {}).estrato || '', sp: r.especie || T('(sin especie)', '(no species)'), family: r.familia || '', d: r.dap, h: r.altura, status: r.estado, alive: alive(r.estado), x: r.x, y: r.y, cluster: (pmap.get(String(r.parcela)) || {}).conglomerado || '' }));
  /* missing heights: a Näslund curve fitted to this inventory */
  const withH = trees.filter(t => t.h > 1.3 && t.d > 0);
  let hdFit = null, nEst = 0;
  if (el('b3fillH').checked && withH.length >= 6 && withH.length < trees.length) {
    hdFit = Dendro.fitHD(withH.map(t => ({ d: t.d, h: t.h })), ['naslund'])[0];
    if (hdFit.ok) trees.forEach(t => { if (!(t.h > 1.3) && t.d > 0) { t.h = hdFit.predict(t.d); t.hEst = true; nEst++; } });
  }
  /* volume of each tree */
  const vm = el('b3vol').value, ff = +el('b3ff').value || 0.5, eq = state.dendro && state.dendro.vol;
  trees.forEach(t => {
    if (!(t.h > 0)) { t.v = NaN; return; }
    t.v = vm === 'eq' && eq ? Dendro.volPredict(eq.best, eq.coef, eq.meyer, t.d, t.h) : Dendro.basalArea(t.d) * t.h * ff;
  });
  const plotIds = [...new Set(trees.map(t => t.plot).concat([...pmap.keys()]))];
  const plotOf = k => designOf(pmap.get(k), def);
  const per = Invent.perPlot(trees, plotOf, { plots: plotIds });
  per.forEach(p => { const pp = pmap.get(p.plot) || {}; p.stratum = pp.estrato || (p.trees[0] || {}).stratum || ''; p.cluster = pp.conglomerado || ''; p.lat = pp.lat; p.lon = pp.lon; p.stratumArea = pp.area_estrato_ha; p.design = plotOf(p.plot); });
  S.per = per; S.inv = trees; S.hdFit = hdFit; S.nEst = nEst;
  state.inv = { name: S.treesName || '', example: S.treesExample || null, trees: trees.map(t => ({ plot: t.plot, stratum: t.stratum, especie: t.sp, familia: t.family, dap: t.d, altura: t.h, hEst: !!t.hEst, estado: t.status, alive: t.alive, x: t.x, y: t.y, ef: t.ef, v: t.v, cluster: t.cluster, copa: (S.trees[t.id - 1] || {}).copa })),
    plots: per.map(p => ({ plot: p.plot, stratum: p.stratum, cluster: p.cluster, lat: p.lat, lon: p.lon, stratumArea: p.stratumArea, design: p.design, N: p.N, G: p.G, V: p.V })), area: +el('b3area').value };
  /* the design that fits the data best by default */
  const strata = [...new Set(per.map(p => p.stratum).filter(Boolean))];
  if (!S.designSet) {
    el('b3design').value = strata.length > 1 && per.every(p => p.stratumArea > 0) ? 'strat' : 'srs';
    /* the measurement threshold: the smallest DBH, rounded down to half a centimeter */
    const dmin = Math.min(...trees.filter(t => t.d > 0).map(t => t.d));
    el('b3trunc').value = isFinite(dmin) && dmin >= 1 ? String(Math.floor(dmin * 2 + 1e-9) / 2) : '';
    S.designSet = true;
  }
  const sel = el('b3st');
  sel.innerHTML = `<option value=""${optL('Todos', 'All')}</option>` + strata.map(s => `<option>${esc(s)}</option>`).join('');
  drawInv(); drawExp(); drawEst(); drawStruct(); drawSize();
  state.inventory = { n: per.length, strata: strata.length };
  Report.set(3, true); refreshStepMarks();
  document.dispatchEvent(new CustomEvent('inventorychange'));
}

function drawInv() {
  R.inv.innerHTML = '';
  const t = S.inv, sp = new Set(t.map(x => x.sp)), strata = new Set(S.per.map(p => p.stratum).filter(Boolean)), cl = new Set(S.per.map(p => p.cluster).filter(Boolean));
  const tiles = mk('div'); R.inv.appendChild(tiles);
  UI.tiles(tiles, [
    [['Parcelas', 'Plots'], String(S.per.length), strata.size ? [strata.size + ' estratos', strata.size + ' strata'] : null],
    [['Árboles', 'Trees'], String(t.length), [t.filter(x => !x.alive).length + ' muertos en pie', t.filter(x => !x.alive).length + ' standing dead']],
    [['Especies', 'Species'], String(sp.size)],
    cl.size ? [['Conglomerados', 'Clusters'], String(cl.size)] : null,
    S.nEst ? [['Alturas estimadas', 'Heights estimated'], String(S.nEst), ['curva de Näslund del inventario', "the inventory's Näslund curve"], 'warn'] : null,
  ]);
  const designs = [...new Set(S.per.map(p => JSON.stringify(p.design)))].map(s => JSON.parse(s));
  const dTxt = d => d.shape === 'nested' ? L2(`circular anidada: r = ${d.r} m (DAP ≥ ${d.dCut} cm) y r = ${d.rSmall} m`, `nested circular: r = ${d.r} m (DBH ≥ ${d.dCut} cm) and r = ${d.rSmall} m`)
    : d.shape === 'circle' ? L2(`circular de ${n1(Math.PI * d.r * d.r)} m² (r = ${d.r} m)`, `circular of ${n1(Math.PI * d.r * d.r)} m² (r = ${d.r} m)`)
    : d.shape === 'square' ? L2(`cuadrada de ${d.side} m`, `square of ${d.side} m`) : d.shape === 'rect' ? L2(`rectangular de ${d.a} × ${d.b} m`, `rectangular of ${d.a} × ${d.b} m`) : L2(`de ${d.area} m²`, `of ${d.area} m²`);
  R.inv.appendChild(mk('p', { class: 'hint' }, L2('Diseño de parcela: ', 'Plot design: ') + designs.map(dTxt).join('; ')));
}

/* ---------------- B ---------------- */
function drawExp() {
  R.exp.innerHTML = '';
  const per = S.per;
  const cols = [
    { key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'stratum', label: ['Estrato', 'Stratum'] }, { key: 'n', label: ['Árboles', 'Trees'], num: true },
    { key: 'N', label: ['N (árb/ha)', 'N (trees/ha)'], num: true, fmt: n0 }, { key: 'G', label: ['G (m²/ha)', 'G (m²/ha)'], num: true, fmt: n2 },
    { key: 'V', label: ['V (m³/ha)', 'V (m³/ha)'], num: true, fmt: n1 }, { key: 'dq', label: ['Dq (cm)', 'Dq (cm)'], num: true, fmt: n1 },
    { key: 'hdom', label: ['Altura dominante (m)', 'Dominant height (m)'], num: true, fmt: n1 }, { key: 'Ndead', label: ['Muertos (árb/ha)', 'Dead (trees/ha)'], num: true, fmt: n0 },
  ];
  const strata = [...new Set(per.map(p => p.stratum))];
  const sorted = per.slice().sort((a, b) => (a.stratum > b.stratum ? 1 : a.stratum < b.stratum ? -1 : 0) || b.G - a.G);
  const fig = Plot.bars({ cats: sorted.map(p => p.plot), series: strata.map((s, k) => ({ label: s || T('Parcelas', 'Plots'), values: sorted.map(p => p.stratum === s ? p.G : NaN), color: Plot.color(k) })), stacked: true, legendAlways: strata.length > 1, ylab: T('Área basal (m²/ha)', 'Basal area (m²/ha)'), name: 'b3-area-basal-parcelas', w: 680, h: 340 });
  UI.figure(R.exp, { title: ['Área basal por parcela', 'Basal area by plot'], svg: fig, key: 'b3-gplot' });
  UI.table(R.exp, { title: ['Valores por hectárea de cada parcela', 'Values per hectare of each plot'], columns: cols, rows: per, file: 'forestpro_parcelas_ha' });
}

/* ---------------- C ---------------- */
function estimate(design, v, conf, fpc) {
  const per = S.per, y = per.map(p => p[v]);
  const A = state.inv.area > 0 ? state.inv.area : NaN;
  const meanArea = Num.mean(per.map(p => Invent.plotArea(p.design, 1e9))) / 10000;
  const Nplots = fpc && A > 0 ? A / meanArea : Infinity;
  if (design === 'strat') {
    const groups = new Map();
    per.forEach(p => { if (!groups.has(p.stratum)) groups.set(p.stratum, { name: p.stratum, y: [], area: p.stratumArea }); groups.get(p.stratum).y.push(p[v]); });
    const gs = [...groups.values()];
    if (gs.length < 2 || gs.some(g => !(g.area > 0) || g.y.length < 2)) return { error: 'strat' };
    return Invent.strat(gs, { conf, plotArea: fpc ? meanArea : 0 });
  }
  if (design === 'sys') return Invent.systematic(per.slice().sort((a, b) => String(a.plot).localeCompare(String(b.plot), undefined, { numeric: true })).map(p => p[v]), { conf, N: Nplots, area: A });
  if (design === 'cluster') {
    const groups = new Map();
    per.forEach(p => { if (!p.cluster) return; if (!groups.has(p.cluster)) groups.set(p.cluster, { id: p.cluster, y: [] }); groups.get(p.cluster).y.push(p[v]); });
    if (groups.size < 2) return { error: 'cluster' };
    return Invent.cluster([...groups.values()], { conf, area: A });
  }
  return Invent.srs(y, { conf, N: Nplots, area: A });
}
function drawEst() {
  R.est.innerHTML = '';
  const v = el('b3var').value, design = el('b3design').value, conf = +el('b3conf').value, fpc = el('b3fpc').checked;
  if (v === 'V' && S.per.some(p => !isFinite(p.V))) { showMessage(R.est, 'warning', L2('Hay árboles sin altura: activa la estimación de alturas o elige otra variable.', 'Some trees have no height: turn on the height estimation or choose another variable.')); return; }
  const r = estimate(design, v, conf, fpc), Vv = VARS[v];
  if (r.error) { showMessage(R.est, 'warning', r.error === 'strat' ? L2('El diseño estratificado necesita al menos 2 estratos con superficie y 2 parcelas cada uno.', 'The stratified design needs at least 2 strata with an area and 2 plots each.') : L2('El diseño en conglomerados necesita la columna de conglomerado en las parcelas.', 'The cluster design needs the cluster column in the plots.')); return; }
  const u = T(Vv.u, Vv.ue);
  const tiles = mk('div'); R.est.appendChild(tiles);
  UI.tiles(tiles, [
    [['Media', 'Mean'], Vv.f(r.mean) + ' ' + u, ['± ' + Vv.f(r.half) + ' (' + Math.round(conf * 100) + ' %)', '± ' + Vv.f(r.half) + ' (' + Math.round(conf * 100) + ' %)']],
    [['Error estándar', 'Standard error'], Vv.f(r.se) + ' ' + u, [T('gl = ', 'df = ') + fmtNum(r.df, 1), T('gl = ', 'df = ') + fmtNum(r.df, 1)]],
    [['Error de muestreo', 'Sampling error'], fmtPct(r.errPct), null, r.errPct <= 10 ? 'ok' : r.errPct <= 20 ? 'warn' : 'bad'],
    [['Intervalo de confianza', 'Confidence interval'], Vv.f(r.lo) + ' – ' + Vv.f(r.hi)],
    r.total != null ? [['Total del predio', 'Total of the property'], fmtNum(r.total, 0) + ' ' + u.replace('/ha', ''), [fmtNum(r.totalLo, 0) + ' – ' + fmtNum(r.totalHi, 0) + ' en ' + fmtNum(r.area, 0) + ' ha', fmtNum(r.totalLo, 0) + ' – ' + fmtNum(r.totalHi, 0) + ' over ' + fmtNum(r.area, 0) + ' ha']] : null,
  ]);
  /* the same variable under every design that the data allow */
  const cmp = ['srs', 'strat', 'sys', 'cluster'].map(dk => { const e = estimate(dk, v, conf, fpc); return e.error ? null : { d: dk, mean: e.mean, se: e.se, df: e.df, err: e.errPct, extra: dk === 'strat' ? e.seNeyman : dk === 'cluster' ? e.deff : dk === 'sys' ? e.seSrs : NaN }; }).filter(Boolean);
  const dn = { srs: ['Aleatorio simple', 'Simple random'], strat: ['Estratificado', 'Stratified'], sys: ['Sistemático', 'Systematic'], cluster: ['Conglomerados', 'Cluster'] };
  UI.table(R.est, { title: ['La misma variable con cada diseño', 'The same variable under each design'], file: 'forestpro_disenos', columns: [
    { key: 'd', label: ['Diseño', 'Design'], get: x => T(dn[x.d][0], dn[x.d][1]) }, { key: 'mean', label: ['Media', 'Mean'], num: true, fmt: Vv.f }, { key: 'se', label: ['Error estándar', 'Std. error'], num: true, fmt: Vv.f },
    { key: 'df', label: ['gl', 'df'], num: true, fmt: n1 }, { key: 'err', label: ['Error de muestreo (%)', 'Sampling error (%)'], num: true, fmt: n1 },
    { key: 'extra', label: ['Nota', 'Note'], html: true, get: x => x.d === 'strat' ? T('EE con asignación de Neyman: ', 'SE under Neyman allocation: ') + Vv.f(x.extra) : x.d === 'cluster' ? T('efecto del diseño: ', 'design effect: ') + n2(x.extra) : x.d === 'sys' ? T('EE como aleatorio: ', 'SE as if random: ') + Vv.f(x.extra) : '' },
  ], rows: cmp.map(x => Object.assign(x, { _class: x.d === design ? 'row-sel' : '' })) });
  if (r.strata) {
    UI.table(R.est, { title: ['Por estrato', 'By stratum'], file: 'forestpro_estratos', columns: [
      { key: 'name', label: ['Estrato', 'Stratum'] }, { key: 'area', label: ['Superficie (ha)', 'Area (ha)'], num: true, fmt: n1 }, { key: 'W', label: ['Peso W', 'Weight W'], num: true, fmt: n3 },
      { key: 'n', label: ['Parcelas', 'Plots'], num: true }, { key: 'mean', label: ['Media', 'Mean'], num: true, fmt: Vv.f }, { key: 'sd', label: ['Desv. estándar', 'Std. dev.'], num: true, fmt: Vv.f },
      { key: 'se', label: ['Error estándar', 'Std. error'], num: true, fmt: Vv.f }, { key: 'errPct', label: ['Error (%)', 'Error (%)'], num: true, fmt: n1 },
    ], rows: r.strata });
    const ser = r.strata.map((s, k) => ({ type: 'segments', segs: [[k + 1, s.lo, k + 1, s.hi]], color: Plot.color(k), width: 3 }));
    ser.push({ type: 'points', x: r.strata.map((s, k) => k + 1), y: r.strata.map(s => s.mean), colors: r.strata.map((s, k) => Plot.color(k)), r: 5 });
    ser.push({ type: 'segments', segs: [[r.strata.length + 1, r.lo, r.strata.length + 1, r.hi]], color: 'var(--fig-ink)', width: 3 });
    ser.push({ type: 'points', x: [r.strata.length + 1], y: [r.mean], color: 'var(--fig-ink)', r: 6 });
    const labs = r.strata.map(s => s.name).concat([T('Estratificada', 'Stratified')]);
    UI.figure(R.est, { title: [`${Vv.es}: media e intervalo por estrato`, `${Vv.en}: mean and interval by stratum`], svg: Plot.xy({ series: ser, xlim: [0.4, labs.length + 0.6], xtickVals: labs.map((_, i) => i + 1), xLabels: x => labs[Math.round(x) - 1] || '', ylab: T(Vv.es, Vv.en), name: 'b3-estratos', w: 600, h: 340, legend: false, zeroY: true }), key: 'b3-strata' });
  }
  /* the CV of the plots (the cluster estimator has none of its own) */
  const cvUse = isFinite(r.cv) && r.cv > 0 ? r.cv : Invent.srs(S.per.map(p => p[v])).cv;
  const need = Invent.sampleSize({ cv: cvUse, err: 10, conf });
  UI.interp(R.est, [
    `Con ${r.n} ${design === 'cluster' ? 'conglomerados' : 'parcelas'} ${Vv.ph[0]} es ${Vv.f(r.mean)} ${Vv.u} con un error de muestreo de ${fmtNum(r.errPct, 1)} % al ${Math.round(conf * 100)} % de confianza.` + (r.errPct > 10 ? ` Para bajar a 10 % harían falta unas ${need.n} parcelas con este CV (${fmtNum(cvUse, 0)} %).` : ' Cumple el 10 % que piden muchos planes de manejo.') + (r.efficiency ? ` Estratificar rinde ${fmtNum(r.efficiency, 2)} veces la precisión de tratar las parcelas como una sola muestra aleatoria.` : '') + (r.deff ? ` El efecto del diseño es ${fmtNum(r.deff, 2)}: ${r.deff > 1 ? 'las parcelas de un mismo conglomerado se parecen entre sí y aportan menos información que si fueran independientes' : 'los conglomerados no restan precisión'}.` : ''),
    `With ${r.n} ${design === 'cluster' ? 'clusters' : 'plots'} ${Vv.ph[1]} is ${Vv.f(r.mean)} ${Vv.ue} with a sampling error of ${fmtNum(r.errPct, 1)} % at ${Math.round(conf * 100)} % confidence.` + (r.errPct > 10 ? ` Bringing it down to 10 % would take about ${need.n} plots with this CV (${fmtNum(cvUse, 0)} %).` : ' It meets the 10 % many management plans require.') + (r.efficiency ? ` Stratifying gives ${fmtNum(r.efficiency, 2)} times the precision of treating the plots as one random sample.` : '') + (r.deff ? ` The design effect is ${fmtNum(r.deff, 2)}: ${r.deff > 1 ? 'plots of the same cluster resemble each other and carry less information than independent ones' : 'the clusters cost no precision'}.` : '')], r.errPct > 20 ? 'warn' : null);
  S.est = r;
  state.inventory = Object.assign(state.inventory || {}, { est: { v, design, mean: r.mean, se: r.se, errPct: r.errPct, lo: r.lo, hi: r.hi } });
}

/* ---------------- D ---------------- */
function drawSize() {
  if (!R.size) return;
  R.size.innerHTML = '';
  const cv = +el('b3cv').value, err = +el('b3err').value, conf = +el('b3conf2').value, Nv = el('b3Nplots').value === '' ? Infinity : +el('b3Nplots').value;
  if (!(cv > 0 && err > 0)) return;
  const r = Invent.sampleSize({ cv, err, conf, N: Nv });
  const tiles = mk('div'); R.size.appendChild(tiles);
  UI.tiles(tiles, [
    [['Parcelas necesarias', 'Plots needed'], String(r.n), [`t = ${fmtNum(r.t, 3)} con ${r.n - 1} gl`, `t = ${fmtNum(r.t, 3)} with ${r.n - 1} df`]],
    isFinite(Nv) ? [['Sin corrección finita', 'Without finite correction'], String(r.nInf)] : null,
    [['Iteraciones', 'Iterations'], String(r.it)],
  ]);
  /* by strata, with the s and the mean of each stratum in the loaded inventory */
  if (S.per) {
    const v = el('b3var').value, groups = new Map();
    S.per.forEach(p => { if (!p.stratum || !(p.stratumArea > 0)) return; if (!groups.has(p.stratum)) groups.set(p.stratum, { name: p.stratum, y: [], w: p.stratumArea }); groups.get(p.stratum).y.push(p[v]); });
    const st = [...groups.values()].filter(g => g.y.length > 1).map(g => ({ name: g.name, w: g.w, s: Num.sd(g.y), mean: Num.mean(g.y) }));
    if (st.length > 1) {
      const a = Invent.stratSampleSize({ strata: st, err, conf, alloc: el('b3alloc').value });
      UI.table(R.size, { title: [`Asignación por estrato (${T(VARS[v].es, VARS[v].en)}): n = ${a.n}`, `Allocation by stratum (${T(VARS[v].es, VARS[v].en)}): n = ${a.n}`], file: 'forestpro_asignacion', columns: [
        { key: 'name', label: ['Estrato', 'Stratum'] }, { key: 'w', label: ['Superficie (ha)', 'Area (ha)'], num: true, fmt: n1 }, { key: 's', label: ['Desv. estándar', 'Std. dev.'], num: true, fmt: n2 },
        { key: 'nh', label: ['Parcelas', 'Plots'], num: true }], rows: st.map((s, i) => Object.assign({}, s, { nh: a.nh[i] })) });
    }
  }
}

/* ---------------- E ---------------- */
function drawRel() {
  R.rel.innerHTML = '';
  const BAF = +el('b3baf').value, ffv = +el('b3rff').value || 0.5;
  if (!(BAF > 0)) return;
  const by = new Map();
  S.rel.forEach(r => { const k = String(r.punto); if (!by.has(k)) by.set(k, []); by.get(k).push({ d: r.dap, h: r.altura, v: r.altura > 0 ? Dendro.basalArea(r.dap) * r.altura * ffv : NaN, sp: r.especie }); });
  const pts = [...by.entries()].map(([point, trees]) => ({ point, trees }));
  const res = Invent.relascope(pts, BAF, { conf: 0.95 });
  const tiles = mk('div'); R.rel.appendChild(tiles);
  UI.tiles(tiles, [
    [['Puntos', 'Points'], String(pts.length), [fmtNum(Num.mean(res.per.map(p => p.count)), 1) + ' árboles por punto', fmtNum(Num.mean(res.per.map(p => p.count)), 1) + ' trees per point']],
    [['Área basal', 'Basal area'], n2(res.G.mean) + ' m²/ha', ['± ' + n2(res.G.half) + ' (' + fmtNum(res.G.errPct, 1) + ' %)', '± ' + n2(res.G.half) + ' (' + fmtNum(res.G.errPct, 1) + ' %)']],
    [['Densidad', 'Density'], n0(res.N.mean) + T(' árb/ha', ' trees/ha'), ['± ' + n0(res.N.half) + ' (' + fmtNum(res.N.errPct, 1) + ' %)', '± ' + n0(res.N.half) + ' (' + fmtNum(res.N.errPct, 1) + ' %)']],
    res.V ? [['Volumen', 'Volume'], n1(res.V.mean) + ' m³/ha', ['± ' + n1(res.V.half) + ' (' + fmtNum(res.V.errPct, 1) + ' %)', '± ' + n1(res.V.half) + ' (' + fmtNum(res.V.errPct, 1) + ' %)']] : null,
  ]);
  UI.table(R.rel, { title: ['Por punto', 'By point'], file: 'forestpro_relascopia', columns: [
    { key: 'point', label: ['Punto', 'Point'] }, { key: 'count', label: ['Árboles contados', 'Trees counted'], num: true },
    { key: 'G', label: ['G (m²/ha)'], num: true, fmt: n1 }, { key: 'N', label: ['N (árb/ha)', 'N (trees/ha)'], num: true, fmt: n0 }, { key: 'V', label: ['V (m³/ha)'], num: true, fmt: n1 }], rows: res.per });
  const mc = Num.mean(res.per.map(p => p.count));
  UI.interp(R.rel, [`Con FAB = ${BAF} se contaron en promedio ${fmtNum(mc, 1)} árboles por punto${mc < 7 ? ': pocos; un FAB menor daría más árboles y menos error' : mc > 15 ? ': muchos; un FAB mayor ahorraría tiempo sin perder mucha precisión' : ', dentro del intervalo recomendado de 7 a 15'}. Los árboles gruesos entran desde más lejos, por eso la relascopía estima el área basal sin medir parcelas.`,
    `With BAF = ${BAF} an average of ${fmtNum(mc, 1)} trees were counted per point${mc < 7 ? ': few; a smaller BAF would give more trees and less error' : mc > 15 ? ': many; a larger BAF would save time without losing much precision' : ', within the recommended range of 7 to 15'}. Thick trees count from farther away, which is how point sampling estimates basal area without measuring plots.`]);
  state.inventory = Object.assign(state.inventory || {}, { relascope: { BAF, G: res.G.mean } });
  Report.set(3, true); refreshStepMarks();
}

/* ---------------- F ---------------- */
function drawStruct() {
  R.struct.innerHTML = '';
  const stSel = el('b3st').value;
  const per = S.per.filter(p => !stSel || p.stratum === stSel);
  const trees = [].concat(...per.map(p => p.trees.filter(t => t.alive !== false)));
  if (trees.length < 10) { showMessage(R.struct, 'info', L2('Hacen falta al menos 10 árboles vivos.', 'At least 10 live trees are needed.')); return; }
  const w = +el('b3w').value || 5, nP = per.length;
  const d = trees.map(t => t.d), wt = trees.map(t => t.ef / nP);
  const three = el('b3wb').value === '3';
  const trunc = +el('b3trunc').value > 0 ? +el('b3trunc').value : 0;
  /* with a measurement threshold the classes start at it, so the first bar is a whole class like the rest */
  const cl = Invent.classes(d, w, { weights: wt, start: trunc > 0 && Math.min(...d) >= trunc ? trunc : undefined });
  const ef = trees.map(t => t.ef);
  const wb = Invent.weibull(d, { weights: ef, three, trunc });
  /* the trees the model describes: those at or above the measurement threshold */
  const inT = d.map(v => v >= trunc);
  const dT = d.filter((_, i) => inT[i]), efT = ef.filter((_, i) => inT[i]);
  const Nha = wt.reduce((a, b, i) => a + (inT[i] ? b : 0), 0);
  const xs = Array.from({ length: 160 }, (_, i) => cl.edges[0] + i * (cl.edges[cl.edges.length - 1] - cl.edges[0]) / 159);
  const fig = Plot.bars({ edges: cl.edges, series: [{ label: T('Árboles por hectárea', 'Trees per hectare'), values: cl.counts, color: 'var(--musgo)' }], curves: [{ x: xs, y: xs.map(x => Nha * w * wb.pdf(x)), color: 'var(--accent)', label: 'Weibull ' + (three ? '3p' : '2p') + (trunc ? T(' truncada', ' truncated') : '') }],
    xlab: T('Clase diamétrica (cm)', 'Diameter class (cm)'), ylab: T('Árboles por hectárea', 'Trees per hectare'), name: 'b3-distribucion-diametrica', w: 640, h: 360, edgeTicks: cl.edges.length <= 16 });
  UI.figure(R.struct, { title: ['Distribución diamétrica y modelo de Weibull', 'Diameter distribution and Weibull model'], svg: fig, key: 'b3-ddist' });
  if (wb.boundary) showMessage(R.struct, 'warning', wb.c < 1
    ? L2(`La ubicación de la Weibull de 3 parámetros quedó pegada al diámetro mínimo (a = ${n2(wb.a)} cm): con forma menor que 1 la verosimilitud no tiene máximo interior. Usa la de 2 parámetros.`, `The location of the 3-parameter Weibull stuck to the smallest diameter (a = ${n2(wb.a)} cm): with a shape below 1 the likelihood has no interior maximum. Use the 2-parameter one.`)
    : L2(`La ubicación de la Weibull de 3 parámetros quedó en el borde: a = ${n2(wb.a)} cm, a ${fmtNum(wb.edgeGap, 3)} cm del menor diámetro. Ahí el modelo de 3 parámetros no se distingue de uno de 2 que empieza en el mínimo; ${trunc ? 'con el corte de medición, la de 2 parámetros truncada describe lo mismo con un parámetro menos' : 'si hubo un DAP mínimo de medición, escríbelo y usa la de 2 parámetros truncada'}.`, `The location of the 3-parameter Weibull is at the edge: a = ${n2(wb.a)} cm, ${fmtNum(wb.edgeGap, 3)} cm below the smallest diameter. There the 3-parameter model cannot be told from a 2-parameter one that starts at the minimum; ${trunc ? 'with the measurement threshold, the truncated 2-parameter one describes the same with one parameter less' : 'if there was a smallest DBH measured, type it and use the truncated 2-parameter one'}.`));
  if (three && wb.atZero) showMessage(R.struct, 'info', L2('La ubicación de la Weibull de 3 parámetros quedó en 0: el modelo se reduce al de 2 parámetros.', 'The location of the 3-parameter Weibull ended at 0: the model reduces to the 2-parameter one.'));
  /* goodness of fit with the weights of the fit and Kish's effective size: the weighted empirical distribution
     for K–S, the weighted share of each class (scaled to n_eff) for the χ² */
  const ks = Invent.ks(dT, wb.cdf, efT);
  const raw = Invent.classes(dT, w, { weights: efT, start: trunc > 0 ? trunc : undefined });
  const sRaw = raw.counts.reduce((a, b) => a + b, 0);
  const chi = Invent.chi2(raw.edges, raw.counts.map(c => c / sRaw * ks.nEff), wb.cdf, wb.k);
  UI.table(R.struct, { title: ['Parámetros y bondad de ajuste', 'Parameters and goodness of fit'], file: 'forestpro_weibull', columns: [
    { key: 'k', label: ['Cantidad', 'Quantity'] }, { key: 'v', label: ['Valor', 'Value'], num: true }], rows: [
    { k: T('Ubicación a (cm)', 'Location a (cm)'), v: n2(wb.a) }, { k: T('Escala b (cm)', 'Scale b (cm)'), v: n3(wb.b) }, { k: T('Forma c', 'Shape c'), v: n3(wb.c) },
    { k: T('DAP mínimo medido, truncamiento (cm)', 'Smallest DBH measured, truncation (cm)'), v: trunc ? n1(trunc) : '—' },
    { k: T('DAP medio del modelo (cm)', 'Model mean DBH (cm)'), v: n2(wb.mean) },
    { k: T('Árboles / tamaño efectivo (Kish)', 'Trees / effective size (Kish)'), v: dT.length + ' / ' + n1(ks.nEff) },
    { k: T('Kolmogorov–Smirnov D (ponderado)', 'Kolmogorov–Smirnov D (weighted)'), v: n3(ks.D) }, { k: T('p (K–S, asintótico)', 'p (K–S, asymptotic)'), v: fmtP(ks.p) },
    { k: 'χ² (' + chi.classes + T(' clases, ', ' classes, ') + chi.df + T(' gl)', ' df)'), v: n2(chi.chi) }, { k: 'p (χ²)', v: fmtP(chi.p) }] });
  /* stand table: top species × classes, trees per hectare */
  /* the stand table closes with an open class once 99 % of the trees are counted */
  const sortedD = d.slice().sort((a, b) => a - b), q99 = sortedD[Math.floor(0.99 * (sortedD.length - 1))];
  let kOpen = cl.edges.findIndex(e => e > q99);
  if (kOpen < 2) kOpen = cl.edges.length - 1;
  const stEdges = cl.edges.slice(0, kOpen).concat([cl.edges[cl.edges.length - 1]]);
  const stb = Invent.standTable(trees.map(t => ({ plot: t.plot, sp: t.sp, d: t.d, ef: t.ef })), stEdges);
  const stCounts = stEdges.slice(1).map((_, k) => stb.rows.reduce((s, r) => s + r.N[k], 0));
  const ivi = Invent.ivi(trees.map(t => ({ plot: t.plot, sp: t.sp, d: t.d, ef: t.ef })), nP);
  const topSp = ivi.slice(0, 10).map(r => r.sp);
  const stRows = stb.rows.filter(r => topSp.includes(r.sp)).sort((a, b) => topSp.indexOf(a.sp) - topSp.indexOf(b.sp));
  const others = stb.rows.filter(r => !topSp.includes(r.sp));
  if (others.length) stRows.push({ sp: T('Otras', 'Others'), N: stCounts.map((_, k) => others.reduce((s, r) => s + r.N[k], 0)), G: stCounts.map((_, k) => others.reduce((s, r) => s + r.G[k], 0)) });
  const total = { sp: T('Total', 'Total'), N: stCounts, _class: 'row-total' };
  const clsCols = stCounts.map((_, k) => ({ key: 'c' + k, label: k === stCounts.length - 1 && stEdges.length < cl.edges.length ? '≥ ' + stEdges[k] : stEdges[k] + '–' + stEdges[k + 1], num: true, get: r => r.N[k] ? n1(r.N[k]) : '·', raw: r => r.N[k] }));
  UI.table(R.struct, { title: ['Tabla de rodal: árboles por hectárea por especie y clase', 'Stand table: trees per hectare by species and class'], file: 'forestpro_tabla_rodal',
    columns: [{ key: 'sp', label: ['Especie', 'Species'] }].concat(clsCols, [{ key: 'tot', label: ['Total'], num: true, get: r => n1(r.N.reduce((a, b) => a + b, 0)), raw: r => r.N.reduce((a, b) => a + b, 0) }]), rows: stRows.concat([total]) });
  UI.table(R.struct, { title: ['Índice de valor de importancia', 'Importance value index'], file: 'forestpro_ivi', columns: [
    { key: 'sp', label: ['Especie', 'Species'] }, { key: 'N', label: ['N (árb/ha)', 'N (trees/ha)'], num: true, fmt: n1 }, { key: 'Nr', label: ['Densidad rel. (%)', 'Rel. density (%)'], num: true, fmt: n2 },
    { key: 'G', label: ['G (m²/ha)'], num: true, fmt: n3 }, { key: 'Gr', label: ['Dominancia rel. (%)', 'Rel. dominance (%)'], num: true, fmt: n2 },
    { key: 'F', label: ['Frecuencia', 'Frequency'], num: true, fmt: n2 }, { key: 'Fr', label: ['Frecuencia rel. (%)', 'Rel. frequency (%)'], num: true, fmt: n2 },
    { key: 'ivi', label: ['IVI (0–300)'], num: true, fmt: n2 }, { key: 'iviPct', label: ['IVI (%)'], num: true, fmt: n2 }], rows: ivi });
  const top = ivi.slice(0, 10);
  UI.figure(R.struct, { title: ['Componentes del IVI (10 especies principales)', 'Components of the IVI (top 10 species)'], svg: Plot.bars({ cats: top.map(r => r.sp), stacked: true, series: [
    { label: T('Densidad relativa', 'Relative density'), values: top.map(r => r.Nr), color: Plot.CAT[0] }, { label: T('Dominancia relativa', 'Relative dominance'), values: top.map(r => r.Gr), color: Plot.CAT[1] }, { label: T('Frecuencia relativa', 'Relative frequency'), values: top.map(r => r.Fr), color: Plot.CAT[2] }],
    ylab: 'IVI', name: 'b3-ivi', w: 680, h: 380 }), key: 'b3-ivi' });
  /* density per plot */
  const dens = per.map(p => ({ plot: p.plot, N: p.N, dq: p.dq, sdi: Invent.reineke(p.N, p.dq), hdom: p.hdom, hb: Invent.hartBecking(p.N, p.hdom) }));
  UI.table(R.struct, { title: ['Índices de densidad por parcela', 'Density indices by plot'], file: 'forestpro_densidad', columns: [
    { key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'N', label: ['N (árb/ha)', 'N (trees/ha)'], num: true, fmt: n0 }, { key: 'dq', label: ['Dq (cm)'], num: true, fmt: n1 },
    { key: 'sdi', label: ['IDR de Reineke', "Reineke's SDI"], num: true, fmt: n0 }, { key: 'hdom', label: ['Altura dominante (m)', 'Dominant height (m)'], num: true, fmt: n1 }, { key: 'hb', label: ['Hart–Becking (%)'], num: true, fmt: n1 }], rows: dens, limit: 30 });
  /* Hegyi with the coordinates inside each plot */
  const withXY = per.filter(p => p.trees.filter(t => isFinite(t.x) && isFinite(t.y)).length >= 5);
  let heg = null;
  if (withXY.length) {
    const Rr = +el('b3hegR').value || 6;
    heg = [];
    withXY.forEach(p => {
      const ts = p.trees.filter(t => isFinite(t.x) && isFinite(t.y) && t.alive !== false && (p.design.shape !== 'nested' || t.d >= p.design.dCut));
      const rad = p.design.r || Math.sqrt(Invent.plotArea(p.design, 1e9) / Math.PI);
      const h = Invent.hegyi(ts.map(t => ({ x: t.x, y: t.y, d: t.d })), Rr, t => Math.hypot(t.x, t.y) > rad - Rr);
      h.forEach((r, i) => heg.push({ plot: p.plot, sp: ts[i].sp, d: ts[i].d, ci: r.ci, k: r.neighbours, edge: r.edge }));
    });
    const inner = heg.filter(r => !r.edge);
    if (inner.length > 5) {
      UI.figure(R.struct, { title: ['Competencia de Hegyi contra DAP (árboles lejos del borde)', 'Hegyi competition against DBH (trees away from the edge)'], svg: Plot.xy({ series: [{ type: 'points', x: inner.map(r => r.d), y: inner.map(r => r.ci), color: 'var(--primary)', r: 3 }], xlab: T('DAP (cm)', 'DBH (cm)'), ylab: T('Índice de Hegyi', 'Hegyi index'), name: 'b3-hegyi', w: 600, h: 340, zeroY: true }), key: 'b3-hegyi' });
    }
  }
  const sdi = Num.mean(dens.map(r => r.sdi).filter(isFinite)), hb = Num.mean(dens.map(r => r.hb).filter(isFinite));
  UI.interp(R.struct, [
    `La forma de Weibull c = ${n2(wb.c)} ${wb.c < 1.2 ? 'describe una J invertida: muchos árboles delgados y pocos gruesos, típica de un bosque irregular o en regeneración' : wb.c < 3 ? 'da una distribución sesgada a la derecha: la mayoría de los árboles en las clases medias-bajas' : 'da una campana casi simétrica, típica de un rodal coetáneo'}. La especie de mayor importancia es <i>${esc(ivi[0].sp)}</i> (IVI = ${n1(ivi[0].ivi)} de 300). El IDR medio de Reineke es ${n0(sdi)} árboles equivalentes de 25 cm por hectárea` + (isFinite(hb) ? ` y el índice de Hart–Becking ${n1(hb)} % (${hb < 17 ? 'rodal denso, candidato a aclareo' : hb > 25 ? 'rodal abierto' : 'densidad intermedia'}).` : '.') + (ks.p < 0.05 ? ' La prueba de Kolmogorov–Smirnov rechaza el ajuste: los diámetros no siguen bien una sola Weibull (¿mezcla de cohortes o de estratos?).' : ''),
    `The Weibull shape c = ${n2(wb.c)} ${wb.c < 1.2 ? 'describes a reverse J: many thin trees and few thick ones, typical of an uneven-aged or regenerating forest' : wb.c < 3 ? 'gives a right-skewed distribution: most trees in the low-to-middle classes' : 'gives an almost symmetric bell, typical of an even-aged stand'}. The most important species is <i>${esc(ivi[0].sp)}</i> (IVI = ${n1(ivi[0].ivi)} of 300). The mean Reineke SDI is ${n0(sdi)} equivalent 25-cm trees per hectare` + (isFinite(hb) ? ` and the Hart–Becking index ${n1(hb)} % (${hb < 17 ? 'dense stand, a thinning candidate' : hb > 25 ? 'open stand' : 'intermediate density'}).` : '.') + (ks.p < 0.05 ? ' The Kolmogorov–Smirnov test rejects the fit: the diameters do not follow a single Weibull well (a mix of cohorts or strata?).' : '')]);
  state.inventory = Object.assign(state.inventory || {}, { struct: { weibull: { a: wb.a, b: wb.b, c: wb.c }, ivi: ivi.slice(0, 5).map(r => r.sp), sdi } });
}

ExampleHooks['cafetal:3'] = () => { build(); S.cardT.load('cafetal'); };
ExampleHooks['mesofilo:3'] = () => { build(); S.cardT.load('mesofilo'); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('langchange', () => { if (!el('b3root')) return; drawSize(); if (S.per) { drawInv(); drawExp(); drawEst(); drawStruct(); } if (S.rel) drawRel(); });
/* a volume equation fitted in Block 2 can change the volume of every tree */
document.addEventListener('stepchange', e => { if (e.detail.step === 3 && S.trees && el('b3vol').value === 'eq') assemble(); });
window.B3 = { S };
})();
