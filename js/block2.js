/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 2: tree mensuration.
   Five sections: single trees, scaling by sections, volume equations, taper
   and the height–diameter relationship. Each one takes its own table. */
(function () {
'use strict';
const S = { trees: null, secs: null, vol: null, taper: null, hd: null };
const R = {};      // the result hosts
const D = () => window.Dendro;
const n2 = v => fmtNum(v, 2), n1 = v => fmtNum(v, 1), n3 = v => fmtNum(v, 3), n4 = v => fmtNum(v, 4);

/* example tables, already with the keys of each data card */
const EX = {
  trees: [
    { id: 'cafetal', es: 'Cafetal: árboles de sombra (25 parcelas)', en: 'Coffee farm: shade trees (25 plots)', d: ['719 árboles de sombra con DAP, altura y diámetro de copa.', '719 shade trees with DBH, height and crown diameter.'],
      rows: () => FPData.rows('cafetal_arboles').map(r => ({ especie: r.especie, dap: r.dap, cap: NaN, altura: r.altura, altura_com: NaN, copa: r.copa, estado: r.estado })) },
    { id: 'mesofilo', es: 'Bosque mesófilo (24 parcelas)', en: 'Cloud forest (24 plots)', d: ['Árboles de las parcelas grandes y chicas, con altura.', 'Trees of the large and small plots, with height.'],
      rows: () => FPData.rows('mesofilo_arboles').map(r => ({ especie: r.especie, dap: r.dap, cap: NaN, altura: r.altura, altura_com: NaN, copa: NaN, estado: r.estado })) },
  ],
  secs: [
    { id: 'pino', es: 'Pino: 40 árboles derribados por secciones', en: 'Pine: 40 felled trees by sections', d: ['Diámetro con corteza a 0.3 m, 1.3 m y cada 2.5 m hasta cerca de la punta.', 'Diameter over bark at 0.3 m, 1.3 m and every 2.5 m up to near the tip.'],
      rows: () => FPData.rows('pino_secciones').map(r => ({ arbol: r.arbol, dap: r.dap, altura_total: r.altura_total, h: r.h, d: r.d })) },
  ],
  hd: [
    { id: 'pino', es: 'Pino: parcela con alturas faltantes', en: 'Pine: plot with missing heights', d: ['85 árboles; a 28 les falta la altura, que se estima con la curva elegida.', '85 trees; 28 lack their height, which is estimated with the chosen curve.'],
      rows: () => FPData.rows('pino_arboles').map(r => ({ arbol: r.arbol, especie: r.especie, dap: r.dap, altura: r.altura })) },
    { id: 'mesofilo', es: 'Bosque mesófilo: Liquidambar', en: 'Cloud forest: Liquidambar', d: ['Los árboles de una sola especie para una curva propia.', 'The trees of a single species for a curve of its own.'],
      rows: () => FPData.rows('mesofilo_arboles').filter(r => r.especie === 'Liquidambar styraciflua').map((r, i) => ({ arbol: i + 1, especie: r.especie, dap: r.dap, altura: r.altura })) },
  ],
};
const F = {
  trees: [
    { key: 'especie', es: 'Especie', en: 'Species', aliases: ['species', 'sp', 'nombre cientifico', 'taxon'] },
    { key: 'dap', es: 'DAP (cm)', en: 'DBH (cm)', num: true, aliases: ['dbh', 'd130', 'diametro', 'diameter', 'd'] },
    { key: 'cap', es: 'Circunferencia a 1.3 m (cm)', en: 'Girth at 1.3 m (cm)', num: true, aliases: ['cap', 'cbh', 'gbh', 'circunferencia', 'perimetro'] },
    { key: 'altura', es: 'Altura total (m)', en: 'Total height (m)', num: true, aliases: ['ht', 'h', 'height', 'alt'] },
    { key: 'altura_com', es: 'Altura comercial (m)', en: 'Merchantable height (m)', num: true, aliases: ['hc', 'altura comercial', 'merchantable height'] },
    { key: 'copa', es: 'Diámetro de copa (m)', en: 'Crown diameter (m)', num: true, aliases: ['crown', 'dc', 'diametro de copa'] },
    { key: 'estado', es: 'Estado', en: 'Status', aliases: ['status', 'condicion', 'vivo'] },
  ],
  secs: [
    { key: 'arbol', es: 'Árbol', en: 'Tree', req: true, aliases: ['tree', 'id', 'arb'] },
    { key: 'dap', es: 'DAP (cm)', en: 'DBH (cm)', num: true, aliases: ['dbh', 'd130'] },
    { key: 'altura_total', es: 'Altura total (m)', en: 'Total height (m)', num: true, req: true, aliases: ['ht', 'H', 'height'] },
    { key: 'h', es: 'Altura de la sección (m)', en: 'Height of the section (m)', num: true, req: true, aliases: ['hi', 'altura seccion', 'section height'] },
    { key: 'd', es: 'Diámetro de la sección (cm)', en: 'Diameter of the section (cm)', num: true, req: true, aliases: ['di', 'diametro seccion', 'section diameter'] },
  ],
  vol: [
    { key: 'dap', es: 'DAP (cm)', en: 'DBH (cm)', num: true, req: true, aliases: ['dbh', 'd'] },
    { key: 'altura', es: 'Altura total (m)', en: 'Total height (m)', num: true, req: true, aliases: ['ht', 'h'] },
    { key: 'volumen', es: 'Volumen (m³)', en: 'Volume (m³)', num: true, req: true, aliases: ['v', 'vol', 'volume', 'vt'] },
  ],
  hd: [
    { key: 'arbol', es: 'Árbol', en: 'Tree', aliases: ['tree', 'id'] },
    { key: 'especie', es: 'Especie', en: 'Species', aliases: ['species', 'sp'] },
    { key: 'dap', es: 'DAP (cm)', en: 'DBH (cm)', num: true, req: true, aliases: ['dbh', 'd'] },
    { key: 'altura', es: 'Altura total (m) — vacía si falta', en: 'Total height (m) — empty if missing', num: true, aliases: ['ht', 'h', 'height'] },
  ],
};

/* ---------------- the page ---------------- */
function build() {
  const root = el('b2root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Cinco herramientas que se usan juntas o por separado: la primera mide árboles en pie; la segunda cubica árboles derribados; con esos volúmenes la tercera ajusta ecuaciones de volumen y la cuarta, curvas de ahusamiento; la quinta estima las alturas que faltan.',
    'Five tools used together or on their own: the first measures standing trees; the second scales felled trees; with those volumes the third fits volume equations and the fourth, taper curves; the fifth estimates the missing heights.')));

  /* A. single trees */
  const a = UI.section(root, ['Árboles en pie: diámetro, área basal y volumen', 'Standing trees: diameter, basal area and volume'],
    ['El DAP se calcula de la circunferencia si hace falta; el volumen, con un coeficiente mórfico (la fracción del cilindro de área basal g y altura H que ocupa el fuste).', 'DBH is computed from the girth if needed; volume, with a form factor (the fraction of the cylinder of basal area g and height H filled by the stem).']);
  const fg = mk('div', { class: 'form-grid' });
  fg.innerHTML = `<div class="field"><label for="b2ff">${L2('Coeficiente mórfico', 'Form factor')}</label><input type="number" id="b2ff" value="0.5" step="0.01" min="0.2" max="1"></div>` +
    `<div class="field"><label for="b2calcD">${L2('Calculadora: DAP (cm)', 'Calculator: DBH (cm)')}</label><input type="number" id="b2calcD" value="30" step="any"></div>` +
    `<div class="field"><label for="b2calcC">${L2('o circunferencia (cm)', 'or girth (cm)')}</label><input type="number" id="b2calcC" step="any"></div>` +
    `<div class="field"><label for="b2calcH">${L2('Altura (m)', 'Height (m)')}</label><input type="number" id="b2calcH" value="18" step="any"></div>`;
  a.appendChild(fg);
  R.calc = mk('div', { class: 'res-host' }); a.appendChild(R.calc);
  ['b2ff', 'b2calcD', 'b2calcC', 'b2calcH'].forEach(id => el(id).addEventListener('input', e => { if (id === 'b2calcC' && el('b2calcC').value) el('b2calcD').value = ''; if (id === 'b2calcD' && el('b2calcD').value) el('b2calcC').value = ''; drawCalc(); if (id === 'b2ff' && S.trees) drawTrees(); }));
  UI.dataCard(a, { id: 'b2t', fields: F.trees, examples: EX.trees, inventory: () => state.inv && state.inv.trees ? state.inv.trees.map(t => ({ especie: t.especie, dap: t.dap, cap: NaN, altura: t.altura, altura_com: NaN, copa: t.copa, estado: t.estado })) : null,
    onData: rows => {
      rows.forEach(r => { if (!isFinite(r.dap) && isFinite(r.cap)) r.dap = D().dbhFromGirth(r.cap); });
      S.trees = rows.filter(r => isFinite(r.dap) && r.dap > 0);
      drawTrees();
    } });
  R.trees = mk('div', { class: 'res-host' }); a.appendChild(R.trees);
  UI.method(a, { text: [
    '<p>DAP = C/π. Área basal g = π·DAP²/40 000 (m², con DAP en cm). Volumen = g · H · f, con f el coeficiente mórfico: 0.5 corresponde a un paraboloide; los fustes de coníferas suelen tener entre 0.42 y 0.50 y los de latifoliadas entre 0.35 y 0.48 (el valor de tu especie sale del bloque de cubicación). Esbeltez = 100·H/DAP. Área de copa = π·c²/4. Diámetro cuadrático medio Dq = √(Σ DAP²/n).</p>',
    '<p>DBH = C/π. Basal area g = π·DBH²/40 000 (m², DBH in cm). Volume = g · H · f, with f the form factor: 0.5 is a paraboloid; conifer stems usually have 0.42–0.50 and broadleaves 0.35–0.48 (the value of your species comes from the scaling tool). Slenderness = 100·H/DBH. Crown area = π·c²/4. Quadratic mean diameter Dq = √(Σ DBH²/n).</p>'],
    refs: ['Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, 4.ª ed. Wiley.', 'Avery, T. E. y Burkhart, H. E. (2002). <i>Forest Measurements</i>, 5.ª ed. McGraw-Hill.'] });

  /* B. scaling */
  const b = UI.section(root, ['Cubicación: trozas y árboles por secciones', 'Scaling: logs and trees by sections'],
    ['La calculadora compara las tres fórmulas clásicas en una troza; la tabla cubica árboles derribados sumando trozas de Smalian entre secciones y un cono en la punta.', 'The calculator compares the three classic formulas on one log; the table scales felled trees by adding Smalian logs between sections and a cone at the tip.']);
  const lg = mk('div', { class: 'form-grid' });
  lg.innerHTML = [['b2l1', 'Diámetro mayor (cm)', 'Large-end diameter (cm)', 34], ['b2lm', 'Diámetro al centro (cm)', 'Mid diameter (cm)', 30.5], ['b2l2', 'Diámetro menor (cm)', 'Small-end diameter (cm)', 27], ['b2lL', 'Largo (m)', 'Length (m)', 2.5]]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('');
  b.appendChild(lg);
  R.log = mk('div', { class: 'res-host' }); b.appendChild(R.log);
  ['b2l1', 'b2lm', 'b2l2', 'b2lL'].forEach(id => el(id).addEventListener('input', drawLog));
  const so = mk('div', { class: 'form-grid' });
  so.innerHTML = `<div class="field"><label for="b2top">${L2('Diámetro mínimo en punta (cm)', 'Minimum top diameter (cm)')}</label><input type="number" id="b2top" value="10" step="any"></div>` +
    `<label class="checkbox-label"><input type="checkbox" id="b2stump"> ${L2('Sumar el tocón (cilindro)', 'Add the stump (cylinder)')}</label>`;
  b.appendChild(so);
  ['b2top', 'b2stump'].forEach(id => el(id).addEventListener('change', () => { if (S.secs) drawSecs(); }));
  S.cardSecs = UI.dataCard(b, { id: 'b2s', fields: F.secs, examples: EX.secs, minRows: 4, onData: rows => { S.secs = rows; drawSecs(); } });
  R.secs = mk('div', { class: 'res-host' }); b.appendChild(R.secs);
  UI.method(b, { text: [
    '<p>Huber: V = g<sub>m</sub>·L. Smalian: V = (g<sub>1</sub> + g<sub>2</sub>)/2 · L. Newton: V = (g<sub>1</sub> + 4g<sub>m</sub> + g<sub>2</sub>)/6 · L. Newton es exacta para cualquier sólido cuyo perfil sea una parábola de segundo grado, un cono o un neiloide; Smalian sobreestima en la base neiloide y Huber subestima. Árbol completo: Σ Smalian entre secciones + cono en la punta (g·L/3) + tocón opcional (cilindro). Volumen comercial: hasta la altura en que el diámetro cae al mínimo en punta, interpolada linealmente. Coeficiente mórfico = V/(g·H); cociente de forma = d(H/2)/DAP.</p>',
    '<p>Huber: V = g<sub>m</sub>·L. Smalian: V = (g<sub>1</sub> + g<sub>2</sub>)/2 · L. Newton: V = (g<sub>1</sub> + 4g<sub>m</sub> + g<sub>2</sub>)/6 · L. Newton is exact for any solid whose profile is a second-degree parabola, a cone or a neiloid; Smalian overestimates in the neiloid butt and Huber underestimates. Whole tree: Σ Smalian between sections + a cone at the tip (g·L/3) + an optional stump (cylinder). Merchantable volume: up to the height where the diameter drops to the minimum top diameter, linearly interpolated. Form factor = V/(g·H); form quotient = d(H/2)/DBH.</p>'],
    refs: ['Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, cap. 6. Wiley.', 'Smalian, H. L. (1837). <i>Beitrag zur Holzmeßkunst</i>. Stralsund.'] });

  /* C. volume equations */
  const c = UI.section(root, ['Ecuaciones de volumen', 'Volume equations'],
    ['Ajusta cuatro modelos clásicos a árboles con DAP, altura y volumen (los de la cubicación o los tuyos) y los compara en la escala del volumen con el índice de Furnival.', 'Fits four classic models to trees with DBH, height and volume (those of the scaling tool or your own) and compares them on the volume scale with Furnival\'s index.']);
  const cb = mk('div', { class: 'btn-row' });
  const useSecs = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Usar los árboles cubicados arriba', 'Use the trees scaled above'));
  useSecs.addEventListener('click', () => {
    if (!S.secsOut || !S.secsOut.length) { clearMessages(R.volMsg); showMessage(R.volMsg, 'info', L2('Primero cubica árboles en la sección anterior (o carga el ejemplo del pino).', 'First scale trees in the previous section (or load the pine example).')); return; }
    S.vol = S.secsOut.map(t => ({ dap: t.dbh, altura: t.H, volumen: t.vStem + (el('b2stump').checked ? t.vStump : 0) }));
    drawVol();
  });
  cb.appendChild(useSecs);
  c.appendChild(cb);
  R.volMsg = mk('div', { class: 'messages' }); c.appendChild(R.volMsg);
  UI.dataCard(c, { id: 'b2v', fields: F.vol, minRows: 6, examples: [{ id: 'pino', es: 'Pino: volúmenes de los 40 árboles derribados', en: 'Pine: volumes of the 40 felled trees', d: ['Los volúmenes por Smalian de la sección anterior, ya calculados.', 'The Smalian volumes of the previous section, already computed.'],
    rows: () => D().treesFromSections(FPData.rows('pino_secciones').map(r => ({ tree: r.arbol, dbh: r.dap, H: r.altura_total, h: r.h, d: r.d }))).map(t => ({ dap: t.dbh, altura: t.H, volumen: +t.vStem.toFixed(5) })) }],
    onData: rows => { S.vol = rows; drawVol(); } });
  R.vol = mk('div', { class: 'res-host' }); c.appendChild(R.vol);
  UI.method(c, { text: [
    '<p><b>Schumacher–Hall:</b> V = b₀·D<sup>b₁</sup>·H<sup>b₂</sup>, por mínimos cuadrados no lineales (Levenberg–Marquardt) o en su forma logarítmica ln V = b₀ + b₁ ln D + b₂ ln H; al regresar a la escala original se multiplica por el factor de Meyer exp(σ²/2). <b>Spurr:</b> V = b₀ + b₁·D²H y su forma logarítmica. <b>Índice de Furnival:</b> I = σ̂ para los modelos en la escala del volumen e I = σ̂·exp(media de ln V) para los logarítmicos; el menor es el mejor. También se dan R², RMSE y sesgo en m³.</p>',
    '<p><b>Schumacher–Hall:</b> V = b₀·D<sup>b₁</sup>·H<sup>b₂</sup>, by nonlinear least squares (Levenberg–Marquardt) or in its log form ln V = b₀ + b₁ ln D + b₂ ln H; back on the original scale it is multiplied by Meyer\'s factor exp(σ²/2). <b>Spurr:</b> V = b₀ + b₁·D²H and its log form. <b>Furnival\'s index:</b> I = σ̂ for the models on the volume scale and I = σ̂·exp(mean of ln V) for the logarithmic ones; the smallest is best. R², RMSE and bias in m³ are also given.</p>'],
    refs: ['Schumacher, F. X. y Hall, F. S. (1933). Logarithmic expression of timber-tree volume. <i>J. Agric. Res.</i> 47:719–734.', 'Spurr, S. H. (1952). <i>Forest Inventory</i>. Ronald Press.', 'Meyer, H. A. (1941). A correction for a systematic error occurring in the application of the logarithmic volume equation. <i>Pennsylvania State Forest School Res. Paper</i> 7.', 'Furnival, G. M. (1961). An index for comparing equations used in constructing volume tables. <i>Forest Science</i> 7:337–341.', 'Marquardt, D. W. (1963). An algorithm for least-squares estimation of nonlinear parameters. <i>J. SIAM</i> 11:431–441.'] });

  /* D. taper */
  const d = UI.section(root, ['Ahusamiento', 'Taper'],
    ['Con las secciones de los árboles derribados se ajusta el perfil relativo del fuste; con él se calcula el diámetro a cualquier altura, la altura comercial y el volumen de cada troza.', 'With the sections of the felled trees the relative profile of the stem is fitted; with it the diameter at any height, the merchantable height and the volume of each log are computed.']);
  const db = mk('div', { class: 'btn-row' });
  const useSecs2 = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Ajustar con las secciones cargadas arriba', 'Fit with the sections loaded above'));
  useSecs2.addEventListener('click', () => {
    if (!S.secs) { S.secs = EX.secs[0].rows(); drawSecs(); }
    runTaper();
  });
  db.appendChild(useSecs2);
  d.appendChild(db);
  const tg = mk('div', { class: 'form-grid' });
  tg.innerHTML = [['b2tD', 'DAP del árbol (cm)', 'DBH of the tree (cm)', 35], ['b2tH', 'Altura total (m)', 'Total height (m)', 24], ['b2tTop', 'Diámetro en punta (cm)', 'Top diameter (cm)', 10], ['b2tLen', 'Largo de troza (m)', 'Log length (m)', 2.5], ['b2tStump', 'Altura del tocón (m)', 'Stump height (m)', 0.3]]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('') +
    `<div class="field"><label for="b2tModel">${L2('Modelo', 'Model')}</label><select id="b2tModel"><option value="maxBurkhart">Max–Burkhart</option><option value="kozak69">Kozak 1969</option></select></div>`;
  d.appendChild(tg);
  ['b2tD', 'b2tH', 'b2tTop', 'b2tLen', 'b2tStump', 'b2tModel'].forEach(id => el(id).addEventListener('change', () => { if (S.taper) drawAssort(); }));
  R.taper = mk('div', { class: 'res-host' }); d.appendChild(R.taper);
  R.assort = mk('div', { class: 'res-host' }); d.appendChild(R.assort);
  UI.method(d, { text: [
    '<p>Con z = h/H: <b>Kozak, Munro y Smith (1969)</b>: (d/D)² = b₁(z − 1) + b₂(z² − 1), por mínimos cuadrados sin intercepto. <b>Max y Burkhart (1976)</b>: tres segmentos (neiloide en la base, paraboloide en el centro y cono en la punta) unidos en a₂ y a₁: (d/D)² = b₁(z − 1) + b₂(z² − 1) + b₃(a₁ − z)²·I₁ + b₄(a₂ − z)²·I₂, con Iᵢ = 1 si z ≤ aᵢ; por mínimos cuadrados no lineales con varios arranques. El volumen entre dos alturas integra π·d(h)²/40 000 por Simpson (400 intervalos); la altura al diámetro mínimo se resuelve por el método de Brent.</p>',
    '<p>With z = h/H: <b>Kozak, Munro and Smith (1969)</b>: (d/D)² = b₁(z − 1) + b₂(z² − 1), by least squares through the origin. <b>Max and Burkhart (1976)</b>: three segments (neiloid butt, paraboloid middle and cone top) joined at a₂ and a₁: (d/D)² = b₁(z − 1) + b₂(z² − 1) + b₃(a₁ − z)²·I₁ + b₄(a₂ − z)²·I₂, with Iᵢ = 1 if z ≤ aᵢ; by nonlinear least squares from several starts. The volume between two heights integrates π·d(h)²/40 000 by Simpson (400 intervals); the height to the minimum diameter is solved by Brent\'s method.</p>'],
    refs: ['Kozak, A., Munro, D. D. y Smith, J. H. G. (1969). Taper functions and their application in forest inventory. <i>For. Chron.</i> 45:278–283.', 'Max, T. A. y Burkhart, H. E. (1976). Segmented polynomial regression applied to taper equations. <i>Forest Science</i> 22:283–289.'] });

  /* E. height–diameter */
  const e = UI.section(root, ['Relación altura–diámetro', 'Height–diameter relationship'],
    ['Ajusta tres curvas que pasan por 1.3 m con los árboles que tienen altura y estima la altura de los que no la tienen.', 'Fits three curves through 1.3 m with the trees that have a height and estimates the height of those that do not.']);
  UI.dataCard(e, { id: 'b2h', fields: F.hd, examples: EX.hd, minRows: 6, inventory: () => state.inv && state.inv.trees ? state.inv.trees.map((t, i) => ({ arbol: t.arbol || i + 1, especie: t.especie, dap: t.dap, altura: t.altura })) : null,
    onData: rows => { S.hdRows = rows; runHD(); } });
  const hs = mk('div', { class: 'form-grid' });
  hs.innerHTML = `<div class="field"><label for="b2hSp">${L2('Especie', 'Species')}</label><select id="b2hSp"></select></div><div class="field"><label for="b2hModel">${L2('Curva para estimar', 'Curve to estimate with')}</label><select id="b2hModel"><option value="best"${optL('La de menor AIC', 'Lowest AIC')}</option><option value="naslund">Näslund</option><option value="chapman">Chapman–Richards</option><option value="weibull">Weibull</option></select></div>`;
  e.appendChild(hs);
  el('b2hSp').addEventListener('change', runHD);
  el('b2hModel').addEventListener('change', () => { if (S.hd) drawHD(); });
  R.hd = mk('div', { class: 'res-host' }); e.appendChild(R.hd);
  UI.method(e, { text: [
    '<p>Todas pasan por H = 1.3 m cuando D → 0. <b>Näslund (1937):</b> H = 1.3 + D²/(a + bD)². <b>Chapman–Richards:</b> H = 1.3 + a(1 − e<sup>−bD</sup>)<sup>c</sup>. <b>Weibull:</b> H = 1.3 + a(1 − e<sup>−bD<sup>c</sup></sup>). Se ajustan por mínimos cuadrados no lineales (Levenberg–Marquardt; Näslund arranca de su forma linealizada D/√(H − 1.3) = a + bD). AIC y BIC con la verosimilitud normal, como en R; con la misma respuesta, el menor AIC indica la curva preferible.</p>',
    '<p>All pass through H = 1.3 m as D → 0. <b>Näslund (1937):</b> H = 1.3 + D²/(a + bD)². <b>Chapman–Richards:</b> H = 1.3 + a(1 − e<sup>−bD</sup>)<sup>c</sup>. <b>Weibull:</b> H = 1.3 + a(1 − e<sup>−bD<sup>c</sup></sup>). Fitted by nonlinear least squares (Levenberg–Marquardt; Näslund starts from its linearized form D/√(H − 1.3) = a + bD). AIC and BIC with the normal likelihood, as in R; with the same response, the lowest AIC points to the preferable curve.</p>'],
    refs: ['Näslund, M. (1937). Skogsförsöksanstaltens gallringsförsök i tallskog. <i>Medd. Statens Skogsförsöksanstalt</i> 29.', 'Richards, F. J. (1959). A flexible growth function for empirical use. <i>J. Exp. Bot.</i> 10:290–300.', 'Yang, R. C., Kozak, A. y Smith, J. H. G. (1978). The potential of Weibull-type functions as flexible growth curves. <i>Can. J. For. Res.</i> 8:424–431.', 'Mehtätalo, L., de-Miguel, S. y Gregoire, T. G. (2015). Modeling height-diameter curves for prediction. <i>Can. J. For. Res.</i> 45:826–837.'] });

  drawCalc(); drawLog();
}

/* ---------------- A ---------------- */
function drawCalc() {
  const ff = +el('b2ff').value || 0.5, H = +el('b2calcH').value;
  let d = +el('b2calcD').value;
  const c = +el('b2calcC').value;
  if (!(d > 0) && c > 0) d = D().dbhFromGirth(c);
  if (!(d > 0)) { R.calc.innerHTML = ''; return; }
  const g = D().basalArea(d);
  UI.tiles(R.calc, [
    [['DAP', 'DBH'], n1(d) + ' cm', ['circunferencia ' + n1(D().girthFromDbh(d)) + ' cm', 'girth ' + n1(D().girthFromDbh(d)) + ' cm']],
    [['Área basal', 'Basal area'], fmtNum(g, 4) + ' m²'],
    H > 0 ? [['Volumen (f = ' + ff + ')', 'Volume (f = ' + ff + ')'], fmtNum(D().volFormFactor(d, H, ff), 3) + ' m³'] : null,
    H > 0 ? [['Esbeltez H/D', 'Slenderness H/D'], fmtNum(D().slenderness(H, d), 0), ['más de 80 = árbol inestable al viento', 'over 80 = tree unstable in wind']] : null,
  ]);
}
function drawTrees() {
  const rows = S.trees, ff = +el('b2ff').value || 0.5;
  R.trees.innerHTML = '';
  if (!rows || !rows.length) return;
  const Dd = D();
  rows.forEach(r => {
    r._g = Dd.basalArea(r.dap);
    r._v = isFinite(r.altura) ? Dd.volFormFactor(r.dap, r.altura, ff) : NaN;
    r._vc = isFinite(r.altura_com) ? Dd.volFormFactor(r.dap, r.altura_com, ff) : NaN;
    r._hd = isFinite(r.altura) ? Dd.slenderness(r.altura, r.dap) : NaN;
    r._ca = isFinite(r.copa) ? Dd.crownArea(r.copa) : NaN;
  });
  const n = rows.length, dq = Math.sqrt(rows.reduce((s, r) => s + r.dap * r.dap, 0) / n);
  const withH = rows.filter(r => isFinite(r.altura));
  const G = rows.reduce((s, r) => s + r._g, 0), V = withH.reduce((s, r) => s + r._v, 0);
  const tiles = mk('div'); R.trees.appendChild(tiles);
  UI.tiles(tiles, [
    [['Árboles', 'Trees'], String(n), withH.length < n ? [(n - withH.length) + ' sin altura', (n - withH.length) + ' without height'] : null],
    [['DAP medio', 'Mean DBH'], n1(Num.mean(rows.map(r => r.dap))) + ' cm', ['Dq = ' + n1(dq) + ' cm', 'Dq = ' + n1(dq) + ' cm']],
    withH.length ? [['Altura media', 'Mean height'], n1(Num.mean(withH.map(r => r.altura))) + ' m'] : null,
    [['Área basal total', 'Total basal area'], n2(G) + ' m²'],
    withH.length ? [['Volumen total', 'Total volume'], n2(V) + ' m³', ['f = ' + ff, 'f = ' + ff]] : null,
  ]);
  /* by species */
  const by = new Map();
  rows.forEach(r => { const k = r.especie || T('(sin especie)', '(no species)'); if (!by.has(k)) by.set(k, []); by.get(k).push(r); });
  const sp = [...by.entries()].map(([k, a]) => {
    const h = a.filter(r => isFinite(r.altura));
    return { sp: k, n: a.length, dm: Num.mean(a.map(r => r.dap)), dq: Math.sqrt(a.reduce((s, r) => s + r.dap * r.dap, 0) / a.length), hm: h.length ? Num.mean(h.map(r => r.altura)) : NaN, g: a.reduce((s, r) => s + r._g, 0), v: h.reduce((s, r) => s + r._v, 0) };
  }).sort((x, y) => y.g - x.g);
  const twoF = mk('div', { class: 'figs-2' }); R.trees.appendChild(twoF);
  const pal = UI.speciesColors(rows.map(r => r.especie || ''), 8);
  const ser = pal.top.map(s => { const a = withH.filter(r => (r.especie || '') === s); return { type: 'points', x: a.map(r => r.dap), y: a.map(r => r.altura), color: pal.col(s), label: s || '—', r: 3 }; });
  if (pal.others) { const a = withH.filter(r => !pal.top.includes(r.especie || '')); ser.push({ type: 'points', x: a.map(r => r.dap), y: a.map(r => r.altura), color: '#9AA39A', label: T('otras', 'others'), r: 2.6 }); }
  const fig1 = Plot.xy({ series: ser, xlab: T('DAP (cm)', 'DBH (cm)'), ylab: T('Altura total (m)', 'Total height (m)'), name: 'b2-altura-dap', w: 560, h: 380, zeroY: true });
  UI.figure(twoF, { title: ['Altura y diámetro por especie', 'Height and diameter by species'], svg: withH.length ? fig1 : Plot.empty('Sin alturas', 'No heights'), key: 'b2-hd-sp' });
  const top = sp.slice(0, 12);
  const fig2 = Plot.bars({ cats: top.map(s => s.sp), series: [{ label: T('Área basal (m²)', 'Basal area (m²)'), values: top.map(s => s.g), color: 'var(--primary)' }], ylab: T('Área basal (m²)', 'Basal area (m²)'), name: 'b2-g-especie', w: 560, h: 380 });
  UI.figure(twoF, { title: ['Área basal por especie', 'Basal area by species'], svg: fig2, key: 'b2-g-sp' });
  const spCols = [
    { key: 'sp', label: ['Especie', 'Species'] }, { key: 'n', label: ['Árboles', 'Trees'], num: true },
    { key: 'dm', label: ['DAP medio (cm)', 'Mean DBH (cm)'], num: true, fmt: n1 }, { key: 'dq', label: ['Dq (cm)', 'Dq (cm)'], num: true, fmt: n1 },
    { key: 'hm', label: ['Altura media (m)', 'Mean height (m)'], num: true, fmt: n1 }, { key: 'g', label: ['Área basal (m²)', 'Basal area (m²)'], num: true, fmt: n3 },
    { key: 'v', label: ['Volumen (m³)', 'Volume (m³)'], num: true, fmt: n3 },
  ];
  UI.table(R.trees, { title: ['Resumen por especie', 'Summary by species'], columns: spCols, rows: sp, file: 'forestpro_especies' });
  const tCols = [
    { key: 'especie', label: ['Especie', 'Species'] }, { key: 'dap', label: ['DAP (cm)', 'DBH (cm)'], num: true, fmt: n1 },
    { key: 'altura', label: ['Altura (m)', 'Height (m)'], num: true, fmt: n1 }, { key: '_g', label: ['g (m²)', 'g (m²)'], num: true, fmt: n4 },
    { key: '_v', label: ['Volumen (m³)', 'Volume (m³)'], num: true, fmt: n3 }, { key: '_vc', label: ['Vol. comercial (m³)', 'Merch. vol. (m³)'], num: true, fmt: n3 },
    { key: '_hd', label: ['Esbeltez', 'Slenderness'], num: true, fmt: v => fmtNum(v, 0) }, { key: '_ca', label: ['Área de copa (m²)', 'Crown area (m²)'], num: true, fmt: n1 },
  ];
  UI.table(R.trees, { title: ['Árbol por árbol', 'Tree by tree'], columns: tCols, rows, limit: 60, file: 'forestpro_arboles' });
  const unstable = withH.filter(r => r._hd > 80).length;
  UI.interp(R.trees, [
    `Las ${sp.length} especies suman ${n2(G)} m² de área basal; ${esc(sp[0].sp)} aporta el ${fmtNum(100 * sp[0].g / G, 0)} %. El diámetro cuadrático medio (${n1(dq)} cm) pesa más a los árboles grandes que el promedio aritmético (${n1(Num.mean(rows.map(r => r.dap)))} cm), por eso es el que se usa para el área basal media.` + (unstable ? ` ${unstable} árboles tienen esbeltez mayor de 80: son delgados para su altura y más vulnerables al viento.` : ''),
    `The ${sp.length} species add up to ${n2(G)} m² of basal area; ${esc(sp[0].sp)} contributes ${fmtNum(100 * sp[0].g / G, 0)} %. The quadratic mean diameter (${n1(dq)} cm) weights large trees more than the arithmetic mean (${n1(Num.mean(rows.map(r => r.dap)))} cm), which is why it is the one used for the mean basal area.` + (unstable ? ` ${unstable} trees have a slenderness above 80: they are thin for their height and more vulnerable to wind.` : '')]);
  state.dendro = Object.assign(state.dendro || {}, { trees: { n, G, V, dq } });
  report();
}

/* ---------------- B ---------------- */
function drawLog() {
  const d1 = +el('b2l1').value, dm = +el('b2lm').value, d2 = +el('b2l2').value, L = +el('b2lL').value;
  if (!(d1 > 0 && d2 > 0 && L > 0)) { R.log.innerHTML = ''; return; }
  const Dd = D(), vs = Dd.smalian(d1, d2, L), vh = dm > 0 ? Dd.huber(dm, L) : NaN, vn = dm > 0 ? Dd.newton(d1, dm, d2, L) : NaN;
  UI.tiles(R.log, [
    [['Huber', 'Huber'], fmtNum(vh, 4) + ' m³', isFinite(vn) ? [fmtPct(100 * (vh - vn) / vn, 1) + ' frente a Newton', fmtPct(100 * (vh - vn) / vn, 1) + ' vs Newton'] : null],
    [['Smalian', 'Smalian'], fmtNum(vs, 4) + ' m³', isFinite(vn) ? [fmtPct(100 * (vs - vn) / vn, 1) + ' frente a Newton', fmtPct(100 * (vs - vn) / vn, 1) + ' vs Newton'] : null],
    [['Newton', 'Newton'], fmtNum(vn, 4) + ' m³', ['la de referencia', 'the reference']],
  ]);
}
function drawSecs() {
  R.secs.innerHTML = '';
  const rows = S.secs.map(r => ({ tree: r.arbol, dbh: r.dap, H: r.altura_total, h: r.h, d: r.d }));
  const out = D().treesFromSections(rows, { minTop: +el('b2top').value || 0, stump: el('b2stump').checked });
  S.secsOut = out;
  if (!out.length) { showMessage(R.secs, 'warning', L2('Ningún árbol tiene al menos dos secciones.', 'No tree has at least two sections.')); return; }
  const V = out.reduce((s, t) => s + t.vTotal, 0), fm = Num.mean(out.map(t => t.formFactor)), qm = Num.mean(out.filter(t => isFinite(t.formQuotient)).map(t => t.formQuotient));
  const tiles = mk('div'); R.secs.appendChild(tiles);
  UI.tiles(tiles, [
    [['Árboles cubicados', 'Trees scaled'], String(out.length), [rows.length + ' secciones', rows.length + ' sections']],
    [['Volumen total', 'Total volume'], n3(V) + ' m³', [el('b2stump').checked ? 'con tocón' : 'sin tocón', el('b2stump').checked ? 'with stump' : 'without stump']],
    [['Coeficiente mórfico medio', 'Mean form factor'], n3(fm), ['V/(g·H)', 'V/(g·H)']],
    [['Cociente de forma medio', 'Mean form quotient'], n3(qm), ['d(H/2)/DAP', 'd(H/2)/DBH']],
  ]);
  const two = mk('div', { class: 'figs-2' }); R.secs.appendChild(two);
  const ser = out.slice(0, 60).map((t, k) => ({ type: 'line', x: t.secs.map(s => s.d / 2).concat([0]), y: t.secs.map(s => s.h).concat([t.H]), color: Plot.ramp(0.15 + 0.7 * (t.dbh - Math.min(...out.map(o => o.dbh))) / ((Math.max(...out.map(o => o.dbh)) - Math.min(...out.map(o => o.dbh))) || 1)), width: 1.3 }));
  UI.figure(two, { title: ['Perfiles de los fustes (radio contra altura)', 'Stem profiles (radius against height)'], svg: Plot.xy({ series: ser, xlab: T('Radio con corteza (cm)', 'Radius over bark (cm)'), ylab: T('Altura (m)', 'Height (m)'), name: 'b2-perfiles', w: 560, h: 400, zeroX: true, zeroY: true }), note: ['Color: del árbol más delgado (verde oscuro) al más grueso (dorado).', 'Color: from the thinnest tree (dark green) to the thickest (gold).'], key: 'b2-prof' });
  UI.figure(two, { title: ['Coeficiente mórfico contra DAP', 'Form factor against DBH'], svg: Plot.xy({ series: [{ type: 'points', x: out.map(t => t.dbh), y: out.map(t => t.formFactor), color: 'var(--primary)' }, { type: 'hline', y: 0.5, color: 'var(--fig-muted)' }], xlab: T('DAP (cm)', 'DBH (cm)'), ylab: T('Coeficiente mórfico', 'Form factor'), name: 'b2-coef-morfico', w: 560, h: 400 }), note: ['La línea punteada es el paraboloide (0.5).', 'The dashed line is the paraboloid (0.5).'], key: 'b2-ff' });
  const cols = [
    { key: 'tree', label: ['Árbol', 'Tree'] }, { key: 'dbh', label: ['DAP (cm)', 'DBH (cm)'], num: true, fmt: n1 }, { key: 'H', label: ['Altura (m)', 'Height (m)'], num: true, fmt: n2 },
    { key: 'nSec', label: ['Secciones', 'Sections'], num: true }, { key: 'vStem', label: ['V fuste (m³)', 'Stem V (m³)'], num: true, fmt: n4 },
    { key: 'vStump', label: ['V tocón (m³)', 'Stump V (m³)'], num: true, fmt: n4 }, { key: 'vTotal', label: ['V total (m³)', 'Total V (m³)'], num: true, fmt: n4 },
    { key: 'vMerch', label: ['V comercial (m³)', 'Merch. V (m³)'], num: true, fmt: n4 }, { key: 'hMerch', label: ['Altura comercial (m)', 'Merch. height (m)'], num: true, fmt: n2 },
    { key: 'formFactor', label: ['Coef. mórfico', 'Form factor'], num: true, fmt: n3 }, { key: 'formQuotient', label: ['Cociente de forma', 'Form quotient'], num: true, fmt: n3 },
  ];
  UI.table(R.secs, { title: ['Volumen de cada árbol', 'Volume of each tree'], columns: cols, rows: out, file: 'forestpro_cubicacion' });
  UI.interp(R.secs, [`El coeficiente mórfico medio de estos árboles es ${n3(fm)}: ${fm < 0.5 ? 'menor' : 'mayor'} que el del paraboloide. Úsalo en la primera sección para estimar el volumen de árboles en pie de la misma especie y condición; las ecuaciones de la sección siguiente lo hacen mejor porque dejan que la forma cambie con el tamaño.`,
    `The mean form factor of these trees is ${n3(fm)}: ${fm < 0.5 ? 'smaller' : 'larger'} than that of the paraboloid. Use it in the first section to estimate the volume of standing trees of the same species and condition; the equations of the next section do better because they let the shape change with size.`]);
  state.dendro = Object.assign(state.dendro || {}, { secs: { n: out.length, V, fm } });
  report();
}

/* ---------------- C ---------------- */
let volKey = null;
function drawVol() {
  R.vol.innerHTML = '';
  clearMessages(R.volMsg);
  const data = S.vol.map(r => ({ d: r.dap, h: r.altura, v: r.volumen })).filter(r => r.d > 0 && r.h > 0 && r.v > 0);
  if (data.length < 6) { showMessage(R.volMsg, 'warning', L2('Hacen falta al menos 6 árboles con DAP, altura y volumen.', 'At least 6 trees with DBH, height and volume are needed.')); return; }
  const res = D().fitVolumeModels(data).filter(m => m.ok);
  if (!res.length) { showMessage(R.volMsg, 'danger', L2('Ningún modelo convergió.', 'No model converged.')); return; }
  const best = res.slice().sort((a, b) => a.furnival - b.furnival)[0];
  if (!volKey || !res.find(m => m.key === volKey)) volKey = best.key;
  S.volRes = res;
  const cmp = res.map(m => ({ key: m.key, name: T(m.model.es, m.model.en), eq: m.model.eq, n: m.n, r2: m.r2v, rmse: m.rmse, rmsePct: m.rmsePct, bias: m.bias, fi: m.furnival, _class: m.key === best.key ? 'row-sel' : '' }));
  UI.table(R.vol, { title: ['Comparación de modelos (escala del volumen)', 'Comparison of models (volume scale)'], file: 'forestpro_modelos_volumen', columns: [
    { key: 'name', label: ['Modelo', 'Model'] }, { key: 'eq', label: ['Ecuación', 'Equation'] }, { key: 'n', label: ['n'], num: true },
    { key: 'r2', label: ['R²'], num: true, fmt: n4 }, { key: 'rmse', label: ['RMSE (m³)'], num: true, fmt: v => fmtNum(v, 4) }, { key: 'rmsePct', label: ['RMSE %'], num: true, fmt: n1 },
    { key: 'bias', label: ['Sesgo (m³)', 'Bias (m³)'], num: true, fmt: v => fmtNum(v, 5) }, { key: 'fi', label: ['Índice de Furnival', "Furnival's index"], num: true, fmt: v => fmtNum(v, 5) },
  ], rows: cmp, note: ['Resaltado: el menor índice de Furnival.', 'Highlighted: the smallest Furnival index.'] });
  const pick = mk('div', { class: 'form-grid' });
  pick.innerHTML = `<div class="field"><label for="b2vPick">${L2('Ver el modelo', 'Show the model')}</label><select id="b2vPick">${res.map(m => `<option value="${m.key}"${m.key === volKey ? ' selected' : ''}${optL(m.model.es, m.model.en)}</option>`).join('')}</select></div>`;
  R.vol.appendChild(pick);
  el('b2vPick').addEventListener('change', e => { volKey = e.target.value; drawVol(); });
  const m = res.find(x => x.key === volKey);
  UI.coefTable(R.vol, m.fit, { title: [T('Coeficientes: ', 'Coefficients: ') + T(m.model.es, m.model.en), T('Coeficientes: ', 'Coefficients: ') + T(m.model.es, m.model.en)], file: 'forestpro_coef_' + m.key,
    note: m.fit.logScale ? ['Coeficientes en la escala logarítmica; factor de Meyer = ' + fmtNum(m.fit.meyer, 5) + '.', 'Coefficients on the log scale; Meyer factor = ' + fmtNum(m.fit.meyer, 5) + '.'] : null });
  const two = mk('div', { class: 'figs-2' }); R.vol.appendChild(two);
  const mx = Math.max(...m.obs, ...m.pred);
  UI.figure(two, { title: ['Observado contra estimado', 'Observed against predicted'], svg: Plot.xy({ series: [{ type: 'line', x: [0, mx], y: [0, mx], color: 'var(--fig-muted)', dash: '5 4', width: 1.2 }, { type: 'points', x: m.pred, y: m.obs, color: 'var(--primary)' }], xlab: T('Volumen estimado (m³)', 'Predicted volume (m³)'), ylab: T('Volumen observado (m³)', 'Observed volume (m³)'), name: 'b2-vol-obs-est', w: 520, h: 380, zeroX: true, zeroY: true }), key: 'b2-vol-oe' });
  UI.figure(two, { title: ['Residuales', 'Residuals'], svg: Plot.xy({ series: [{ type: 'hline', y: 0, color: 'var(--fig-muted)' }, { type: 'points', x: m.pred, y: m.res, color: 'var(--accent)' }], xlab: T('Volumen estimado (m³)', 'Predicted volume (m³)'), ylab: T('Residual (m³)', 'Residual (m³)'), name: 'b2-vol-residuales', w: 520, h: 380 }), key: 'b2-vol-res' });
  /* is the spread growing with the size? (the usual heteroscedasticity of volume) */
  const half = m.pred.map((p, i) => [p, Math.abs(m.res[i])]).sort((a, b) => a[0] - b[0]);
  const lo = Num.mean(half.slice(0, half.length >> 1).map(x => x[1])), hi = Num.mean(half.slice(half.length >> 1).map(x => x[1]));
  UI.interp(R.vol, [`El modelo con menor índice de Furnival es <b>${esc(T(best.model.es, best.model.en))}</b> (I = ${fmtNum(best.furnival, 5)}; R² = ${n4(best.r2v)}; RMSE = ${fmtNum(best.rmsePct, 1)} % del volumen medio).` + (hi > 1.8 * lo ? ' La dispersión de los residuales crece con el tamaño del árbol (heterocedasticidad); las formas logarítmicas la estabilizan y por eso suelen ganar.' : ''),
    `The model with the smallest Furnival index is <b>${esc(T(best.model.es, best.model.en))}</b> (I = ${fmtNum(best.furnival, 5)}; R² = ${n4(best.r2v)}; RMSE = ${fmtNum(best.rmsePct, 1)} % of the mean volume).` + (hi > 1.8 * lo ? ' The spread of the residuals grows with tree size (heteroscedasticity); the logarithmic forms stabilize it, which is why they usually win.' : '')]);
  state.dendro = Object.assign(state.dendro || {}, { vol: { best: best.key, coef: best.fit.coef, model: best.model.eq, meyer: best.fit.meyer || 1 } });
  report();
}

/* ---------------- D ---------------- */
function runTaper() {
  const rows = S.secs.map(r => ({ D: r.dap, H: r.altura_total, h: r.h, d: r.d })).filter(r => r.D > 0 && r.H > 0 && r.h >= 0 && r.d > 0);
  runWork(T('Ajustando el ahusamiento…', 'Fitting the taper…'), () => {
    S.taper = D().fitTaper(rows);
    drawTaper();
  });
}
function drawTaper() {
  R.taper.innerHTML = '';
  const ok = S.taper.filter(m => m.ok);
  if (!ok.length) { showMessage(R.taper, 'danger', L2('No se pudo ajustar el perfil.', 'The profile could not be fitted.')); return; }
  UI.table(R.taper, { title: ['Comparación (en diámetro)', 'Comparison (on diameter)'], file: 'forestpro_ahusamiento', columns: [
    { key: 'name', label: ['Modelo', 'Model'] }, { key: 'n', label: ['Secciones', 'Sections'], num: true },
    { key: 'r2', label: ['R² (d)'], num: true, fmt: n4 }, { key: 'rmse', label: ['RMSE (cm)'], num: true, fmt: n2 }, { key: 'bias', label: ['Sesgo (cm)', 'Bias (cm)'], num: true, fmt: n3 },
    { key: 'aic', label: ['AIC'], num: true, fmt: n1 },
  ], rows: ok.map(m => ({ name: T(m.model.es, m.model.en), n: m.n, r2: m.r2D, rmse: m.rmseD, bias: m.biasD, aic: m.fit.aic })) });
  ok.forEach(m => UI.coefTable(R.taper, m.fit, { title: [T('Coeficientes: ', 'Coefficients: ') + T(m.model.es, m.model.en), T('Coeficientes: ', 'Coefficients: ') + T(m.model.es, m.model.en)], file: 'forestpro_coef_' + m.key }));
  const rows = S.secs.filter(r => r.dap > 0 && r.altura_total > 0);
  const z = Array.from({ length: 101 }, (_, i) => i / 100);
  const ser = [{ type: 'points', x: rows.map(r => r.h / r.altura_total), y: rows.map(r => r.d / r.dap), color: 'var(--fig-muted)', r: 2.2, label: T('Secciones', 'Sections'), opacity: 0.6 }];
  ok.forEach((m, k) => ser.push({ type: 'line', x: z, y: z.map(v => Math.sqrt(m.fit.rel(v))), color: k ? 'var(--accent)' : 'var(--primary)', label: T(m.model.es, m.model.en), width: 2.4 }));
  UI.figure(R.taper, { title: ['Perfil relativo del fuste', 'Relative stem profile'], svg: Plot.xy({ series: ser, xlab: T('Altura relativa h/H', 'Relative height h/H'), ylab: T('Diámetro relativo d/D', 'Relative diameter d/D'), name: 'b2-perfil-relativo', w: 620, h: 380, zeroY: true, legend: 'bottom' }), key: 'b2-taper' });
  drawAssort();
}
function drawAssort() {
  R.assort.innerHTML = '';
  if (!S.taper) return;
  const key = el('b2tModel').value, m = S.taper.find(x => x.key === key && x.ok) || S.taper.find(x => x.ok);
  if (!m) return;
  const Dd = +el('b2tD').value, H = +el('b2tH').value;
  if (!(Dd > 0 && H > 1.3)) return;
  const res = D().assortments(m.fit, Dd, H, { top: +el('b2tTop').value, len: +el('b2tLen').value, stump: +el('b2tStump').value });
  const tiles = mk('div'); R.assort.appendChild(tiles);
  UI.tiles(tiles, [
    [['Volumen total del fuste', 'Total stem volume'], n4(res.vTotal) + ' m³', [T(m.model.es, m.model.en), T(m.model.es, m.model.en)]],
    [['Altura al diámetro mínimo', 'Height to the minimum diameter'], n2(res.hTop) + ' m'],
    [['Trozas', 'Logs'], String(res.logs.length), [n4(res.vMerch) + ' m³ comerciales', n4(res.vMerch) + ' m³ merchantable']],
  ]);
  if (res.logs.length) UI.table(R.assort, { title: ['Trozas del árbol', 'Logs of the tree'], file: 'forestpro_trozas', columns: [
    { key: 'n', label: ['Troza', 'Log'], num: true }, { key: 'from', label: ['Desde (m)', 'From (m)'], num: true, fmt: n2 }, { key: 'to', label: ['Hasta (m)', 'To (m)'], num: true, fmt: n2 },
    { key: 'dBase', label: ['d mayor (cm)', 'Large end (cm)'], num: true, fmt: n1 }, { key: 'dTop', label: ['d menor (cm)', 'Small end (cm)'], num: true, fmt: n1 }, { key: 'v', label: ['Volumen (m³)', 'Volume (m³)'], num: true, fmt: n4 },
  ], rows: res.logs });
  /* the stem drawn to scale with its logs */
  const hh = Array.from({ length: 81 }, (_, i) => H * i / 80), rr = hh.map(h => D().taperDiameter(m.fit, Dd, H, h) / 2);
  const ser = [{ type: 'band', x: hh, y: rr, y2: rr.map(v => -v), color: 'var(--accent)', opacity: 0.35 }];
  res.logs.forEach(l => ser.push({ type: 'vline', x: l.to, color: 'var(--primary)', dash: '3 3', width: 1 }));
  ser.push({ type: 'vline', x: res.hTop, color: 'var(--oro, #D4A848)', dash: '6 3', width: 1.6 });
  UI.figure(R.assort, { title: ['El fuste y sus trozas', 'The stem and its logs'], svg: Plot.xy({ series: ser, xlab: T('Altura (m)', 'Height (m)'), ylab: T('Radio (cm)', 'Radius (cm)'), name: 'b2-trozas', w: 640, h: 260 }), note: ['Línea dorada: altura al diámetro mínimo en punta.', 'Gold line: height to the minimum top diameter.'], key: 'b2-logs' });
  state.dendro = Object.assign(state.dendro || {}, { taper: { model: m.key, coef: m.fit.coef } });
  report();
}

/* ---------------- E ---------------- */
let hdSp = '';
function runHD() {
  const all = S.hdRows || [];
  const spp = [...new Set(all.map(r => r.especie).filter(Boolean))];
  const sel = el('b2hSp');
  const prev = sel.value;
  sel.innerHTML = `<option value=""${optL('Todas', 'All')}</option>` + spp.map(s => `<option${s === prev ? ' selected' : ''}>${esc(s)}</option>`).join('');
  hdSp = sel.value;
  const rows = hdSp ? all.filter(r => r.especie === hdSp) : all;
  const data = rows.filter(r => r.dap > 0 && r.altura > 1.3).map(r => ({ d: r.dap, h: r.altura }));
  R.hd.innerHTML = '';
  if (data.length < 6) { showMessage(R.hd, 'warning', L2('Hacen falta al menos 6 árboles con altura medida.', 'At least 6 trees with a measured height are needed.')); return; }
  S.hd = { rows, fits: D().fitHD(data), data };
  drawHD();
}
function drawHD() {
  R.hd.innerHTML = '';
  const { rows, fits, data } = S.hd;
  const ok = fits.filter(f => f.ok);
  if (!ok.length) { showMessage(R.hd, 'danger', L2('Ninguna curva convergió.', 'No curve converged.')); return; }
  const best = ok.slice().sort((a, b) => a.fit.aic - b.fit.aic)[0];
  const pickV = el('b2hModel').value;
  const use = pickV === 'best' ? best : (ok.find(f => f.key === pickV) || best);
  UI.table(R.hd, { title: ['Comparación de curvas', 'Comparison of curves'], file: 'forestpro_altura_diametro', columns: [
    { key: 'name', label: ['Curva', 'Curve'] }, { key: 'eq', label: ['Ecuación', 'Equation'] }, { key: 'n', label: ['n'], num: true },
    { key: 'rmse', label: ['RMSE (m)'], num: true, fmt: n2 }, { key: 'r2', label: ['R²'], num: true, fmt: n3 }, { key: 'bias', label: ['Sesgo (m)', 'Bias (m)'], num: true, fmt: n3 },
    { key: 'aic', label: ['AIC'], num: true, fmt: n1 }, { key: 'bic', label: ['BIC'], num: true, fmt: n1 },
  ], rows: ok.map(f => ({ name: T(f.model.es, f.model.en), eq: f.model.eq, n: f.n, rmse: f.fit.rmse, r2: f.fit.r2, bias: f.fit.bias, aic: f.fit.aic, bic: f.fit.bic, _class: f === use ? 'row-sel' : '' })) });
  UI.coefTable(R.hd, use.fit, { title: [T('Coeficientes: ', 'Coefficients: ') + T(use.model.es, use.model.en), T('Coeficientes: ', 'Coefficients: ') + T(use.model.es, use.model.en)], file: 'forestpro_coef_hd_' + use.key });
  const dmax = Math.max(...rows.map(r => r.dap).filter(isFinite)) * 1.05;
  const xs = Array.from({ length: 80 }, (_, i) => 0.5 + i * dmax / 79);
  const missing = rows.filter(r => r.dap > 0 && !(r.altura > 1.3));
  missing.forEach(r => { r._hEst = use.predict(r.dap); });
  const ser = [{ type: 'points', x: data.map(r => r.d), y: data.map(r => r.h), color: 'var(--fig-muted)', label: T('Medidos', 'Measured'), r: 2.8 }];
  ok.forEach((f, k) => ser.push({ type: 'line', x: xs, y: xs.map(f.predict), color: [ 'var(--primary)', 'var(--accent)', '#D08C1E'][k], label: T(f.model.es, f.model.en), width: f === use ? 2.8 : 1.6, dash: f === use ? null : '6 3' }));
  if (missing.length) ser.push({ type: 'points', x: missing.map(r => r.dap), y: missing.map(r => r._hEst), color: '#D08C1E', label: T('Estimados', 'Estimated'), r: 3.6 });
  UI.figure(R.hd, { title: ['Curvas de altura–diámetro', 'Height–diameter curves'], svg: Plot.xy({ series: ser, xlab: T('DAP (cm)', 'DBH (cm)'), ylab: T('Altura total (m)', 'Total height (m)'), name: 'b2-altura-diametro', w: 640, h: 400, zeroX: true, zeroY: true }), key: 'b2-hd' });
  if (missing.length) {
    UI.table(R.hd, { title: ['Alturas estimadas', 'Estimated heights'], file: 'forestpro_alturas_estimadas', columns: [
      { key: 'arbol', label: ['Árbol', 'Tree'] }, { key: 'especie', label: ['Especie', 'Species'] }, { key: 'dap', label: ['DAP (cm)', 'DBH (cm)'], num: true, fmt: n1 },
      { key: '_hEst', label: ['Altura estimada (m)', 'Estimated height (m)'], num: true, fmt: n1 },
    ], rows: missing });
    const full = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('⤓ Tabla completa con alturas rellenas (CSV)', '⤓ Full table with filled heights (CSV)'));
    full.addEventListener('click', () => download(DataIO.toCSV(['arbol', 'especie', 'dap', 'altura', 'altura_estimada'], rows.map(r => [r.arbol, r.especie, r.dap, r.altura > 1.3 ? r.altura : +(+r._hEst).toFixed(2), r.altura > 1.3 ? 0 : 1])), 'forestpro_alturas_completas.csv', 'text/csv;charset=utf-8'));
    R.hd.appendChild(mk('div', { class: 'btn-row' })).appendChild(full);
  }
  UI.interp(R.hd, [`La curva con menor AIC es <b>${esc(T(best.model.es, best.model.en))}</b> (RMSE = ${n2(best.fit.rmse)} m). ${missing.length ? `Con ${esc(T(use.model.es, use.model.en))} se estimaron ${missing.length} alturas faltantes. ` : ''}Fuera del intervalo de diámetros medidos (${n1(Math.min(...data.map(r => r.d)))}–${n1(Math.max(...data.map(r => r.d)))} cm) las curvas pueden separarse: no extrapoles lejos de él.`,
    `The curve with the lowest AIC is <b>${esc(T(best.model.es, best.model.en))}</b> (RMSE = ${n2(best.fit.rmse)} m). ${missing.length ? `${missing.length} missing heights were estimated with ${esc(T(use.model.es, use.model.en))}. ` : ''}Outside the range of measured diameters (${n1(Math.min(...data.map(r => r.d)))}–${n1(Math.max(...data.map(r => r.d)))} cm) the curves may part ways: do not extrapolate far from it.`]);
  state.dendro = Object.assign(state.dendro || {}, { hd: { model: use.key, coef: use.fit.coef, best: best.key, nEst: missing.length } });
  report();
}

/* ---------------- what goes into the report ---------------- */
/* the report of Block 10 reads the results from the page; here the block only says it has some */
function report() {
  Report.set(2, true);
  refreshStepMarks();
}

/* the examples of the home page */
ExampleHooks['pino:2'] = () => { build(); S.cardSecs.load('pino'); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('langchange', () => {
  if (!el('b2root')) return;
  drawCalc(); drawLog();
  if (S.trees) drawTrees();
  if (S.secs) drawSecs();
  if (S.vol) drawVol();
  if (S.taper) drawTaper();
  if (S.hd) drawHD();
});
})();
