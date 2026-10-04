/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 9: forestry utilities. */
(function () {
'use strict';
const S = { logs: null, pieces: null, flows: null, logRes: null, lumRes: null };
const R = {};
const K = () => window.Tools;
const n0 = v => fmtNum(v, 0), n1 = v => fmtNum(v, 1), n2 = v => fmtNum(v, 2), n3 = v => fmtNum(v, 3), n4 = v => fmtNum(v, 4);

/* example logs of pine: length (m), small end, large end and middle (cm), bark (mm) */
const EX_LOGS = [[2.54, 32, 36, 34, 12], [2.54, 28, 31, 29.5, 10], [2.54, 24, 27, 25.4, 9], [2.54, 20, 22.5, 21.2, 8], [5.08, 30, 37, 33.2, 12], [5.08, 26, 32, 28.8, 11],
  [3.81, 35, 40, 37.4, 14], [3.81, 22, 25.5, 23.6, 8], [2.54, 40, 45, 42.3, 15], [2.54, 18, 20, 19, 7], [5.08, 34, 42, 37.7, 13], [3.81, 27, 30.5, 28.6, 10]]
  .map((r, i) => ({ id: 'T' + String(i + 1).padStart(2, '0'), L: r[0], d1: r[1], d2: r[2], dm: r[3], bark: r[4] }));
/* the lumber sawn from them, in inches and feet (8¼ ft pieces) */
const EX_PIECES = [['Tabla 1″ × 4″', 'Board 1″ × 4″', 1, 4, 8.25, 40], ['Tabla 1″ × 6″', 'Board 1″ × 6″', 1, 6, 8.25, 50], ['Tabla 1″ × 8″', 'Board 1″ × 8″', 1, 8, 8.25, 25], ['Tabla 1″ × 10″', 'Board 1″ × 10″', 1, 10, 8.25, 10],
  ['Polín 2″ × 4″', 'Stud 2″ × 4″', 2, 4, 8.25, 20], ['Viga 4″ × 4″', 'Post 4″ × 4″', 4, 4, 8.25, 4], ['Barrote 1½″ × 1½″', 'Batten 1½″ × 1½″', 1.5, 1.5, 8.25, 30]];
/* a pine plantation, per hectare, in money units */
const EX_FLOWS = [[0, 'Preparación del terreno', 'Site preparation', 7500, 0], [0, 'Planta (1 100 plantas)', 'Seedlings (1,100)', 6600, 0], [0, 'Plantación', 'Planting', 4000, 0],
  [1, 'Reposición de planta y limpia', 'Replanting and weeding', 4500, 0], [2, 'Limpias', 'Weeding', 3500, 0], [3, 'Limpias', 'Weeding', 3000, 0], [5, 'Poda baja', 'Low pruning', 2800, 0],
  [8, 'Poda alta y aclareo precomercial', 'High pruning and precommercial thinning', 5500, 0], [12, 'Primer aclareo comercial (24 m³)', 'First commercial thinning (24 m³)', 7000, 16800],
  [18, 'Segundo aclareo (45 m³)', 'Second thinning (45 m³)', 9000, 40500], [25, 'Corta final (250 m³)', 'Final harvest (250 m³)', 65000, 300000]];

const UNITS = {
  length: [['Longitud', 'Length'], [['m', 'metros', 'metres'], ['cm', 'centímetros', 'centimetres'], ['mm', 'milímetros', 'millimetres'], ['km', 'kilómetros', 'kilometres'], ['in', 'pulgadas', 'inches'], ['ft', 'pies', 'feet'], ['yd', 'yardas', 'yards'], ['ch', 'cadenas (66 pies)', 'chains (66 ft)'], ['mi', 'millas', 'miles']]],
  area: [['Superficie', 'Area'], [['m2', 'm²', 'm²'], ['ha', 'hectáreas', 'hectares'], ['km2', 'km²', 'km²'], ['ac', 'acres', 'acres'], ['ft2', 'pies²', 'square feet']]],
  volume: [['Volumen', 'Volume'], [['m3', 'm³', 'm³'], ['dm3', 'dm³ (litros)', 'dm³ (litres)'], ['ft3', 'pies³', 'cubic feet'], ['bf', 'pies tabla', 'board feet'], ['cord', 'cuerdas (128 pies³ apilados)', 'cords (128 ft³ stacked)']]],
  mass: [['Masa', 'Mass'], [['kg', 'kilogramos', 'kilograms'], ['g', 'gramos', 'grams'], ['t', 'toneladas (Mg)', 'tonnes (Mg)'], ['lb', 'libras', 'pounds'], ['sht', 'toneladas cortas', 'short tons'], ['lgt', 'toneladas largas', 'long tons']]],
  basal: [['Área basal por superficie', 'Basal area per area'], [['m2ha', 'm²/ha', 'm²/ha'], ['ft2ac', 'pies²/acre', 'ft²/acre']]],
  volha: [['Volumen por superficie', 'Volume per area'], [['m3ha', 'm³/ha', 'm³/ha'], ['ft3ac', 'pies³/acre', 'ft³/acre'], ['bfac', 'pies tabla/acre', 'board feet/acre'], ['cordac', 'cuerdas/acre', 'cords/acre']]],
  stock: [['Biomasa por superficie', 'Biomass per area'], [['Mgha', 'Mg/ha (t/ha)', 'Mg/ha (t/ha)'], ['kgm2', 'kg/m²', 'kg/m²'], ['tac', 'toneladas cortas/acre', 'short tons/acre'], ['lbac', 'libras/acre', 'pounds/acre']]],
  carbon: [['Carbono y CO₂', 'Carbon and CO₂'], [['Cha', 'Mg C/ha', 'Mg C/ha'], ['CO2ha', 'Mg CO₂e/ha', 'Mg CO₂e/ha']]],
  density: [['Densidad', 'Density'], [['kgm3', 'kg/m³', 'kg/m³'], ['gcm3', 'g/cm³', 'g/cm³'], ['lbft3', 'libras/pie³', 'lb/ft³']]],
  trees: [['Árboles por superficie', 'Trees per area'], [['ha', 'árboles/ha', 'trees/ha'], ['ac', 'árboles/acre', 'trees/acre'], ['m2', 'árboles/m²', 'trees/m²']]],
};

function build() {
  const root = el('b9root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Las cuentas de todos los días en el monte y en el aserradero: cubicar trozas, contar la madera aserrada, el rendimiento del aserrío, el factor de forma, las conversiones de unidades y la rentabilidad de una plantación.',
    'The everyday sums in the forest and the sawmill: scaling logs, tallying sawn lumber, sawmill yield, form factor, unit conversions and the profitability of a plantation.')));

  /* A. logs */
  const a = UI.section(root, ['Cubicación de trozas', 'Log scaling'], ['Volumen de cada troza en metros cúbicos por cuatro fórmulas y en pies tabla por tres reglas.', 'Volume of each log in cubic metres by four formulas and in board feet by three rules.']);
  const ar = mk('div', { class: 'btn-row' });
  const exA = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cargar ejemplo: 12 trozas de pino', 'Load example: 12 pine logs'));
  exA.addEventListener('click', () => { S.logs = EX_LOGS.map(r => Object.assign({}, r)); drawLogGrid(); scaleLogs(); });
  const clA = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('Tabla vacía', 'Empty table'));
  clA.addEventListener('click', () => { S.logs = [{ id: 'T01', L: NaN, d1: NaN, d2: NaN, dm: NaN, bark: NaN }]; drawLogGrid(); R.logs.innerHTML = ''; });
  ar.append(exA, clA);
  ar.appendChild(mk('label', { class: 'checkbox-label' }, `<input type="checkbox" id="b9ub"> ${L2('Volumen sin corteza', 'Volume under bark')}`));
  a.appendChild(ar);
  R.logGrid = mk('div'); a.appendChild(R.logGrid);
  a.appendChild(mk('p', { class: 'hint' }, L2('Longitud en metros; diámetros con corteza en centímetros (punta delgada, punta gruesa y, si la tienes, a la mitad); grosor de corteza en milímetros, de un solo lado.', 'Length in metres; diameters over bark in centimetres (small end, large end and, if you have it, the middle); bark thickness in millimetres, on one side.')));
  const sb = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cubicar', 'Scale'));
  sb.addEventListener('click', scaleLogs);
  a.appendChild(mk('div', { class: 'btn-row' })).appendChild(sb);
  el('b9ub').addEventListener('change', () => { if (S.logRes) scaleLogs(); });
  R.logs = mk('div', { class: 'res-host' }); a.appendChild(R.logs);
  UI.method(a, { text: [
    '<p>Con g = πd²/40 000 (m², d en cm) y L en m: <b>Smalian</b> V = L(g₁ + g₂)/2; <b>Huber</b> V = L·g<sub>m</sub>; <b>Newton</b> V = L(g₁ + 4g<sub>m</sub> + g₂)/6, exacta para paraboloides, conos y neiloides; <b>cono truncado</b> V = πL(d₁² + d₁d₂ + d₂²)/120 000. Sin corteza, a cada diámetro se le resta dos veces el grosor de corteza. Las <b>reglas en pies tabla</b> estiman la madera aserrada que rinde la troza, no su volumen: usan el diámetro de la punta delgada sin corteza en pulgadas (D) y la longitud en pies (L). <b>Doyle:</b> (D − 4)²L/16, castiga mucho a las trozas delgadas. <b>Scribner:</b> el diagrama de Scribner por la fórmula de Bruce, (0.79D² − 2D − 4)L/16. <b>Internacional ¼″:</b> secciones de 4 pies, cada una con ½ pulgada más de diámetro que la anterior, 0.22D² − 0.71D pies tabla por sección y el factor 0.905 de la sierra de ¼ de pulgada; la fracción final se toma en proporción a su longitud.</p>',
    '<p>With g = πd²/40,000 (m², d in cm) and L in m: <b>Smalian</b> V = L(g₁ + g₂)/2; <b>Huber</b> V = L·g<sub>m</sub>; <b>Newton</b> V = L(g₁ + 4g<sub>m</sub> + g₂)/6, exact for paraboloids, cones and neiloids; <b>frustum of a cone</b> V = πL(d₁² + d₁d₂ + d₂²)/120,000. Under bark, twice the bark thickness is subtracted from every diameter. The <b>board-foot rules</b> estimate the lumber a log yields, not its volume: they use the small-end diameter inside bark in inches (D) and the length in feet (L). <b>Doyle:</b> (D − 4)²L/16, very hard on small logs. <b>Scribner:</b> the Scribner diagram by Bruce\'s formula, (0.79D² − 2D − 4)L/16. <b>International ¼″:</b> 4-foot sections, each ½ inch wider than the one before, 0.22D² − 0.71D board feet per section and the 0.905 factor of the ¼ inch saw kerf; the last fraction is taken in proportion to its length.</p>'],
    refs: ['Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, 4.ª ed. Wiley.', 'Avery, T. E. y Burkhart, H. E. (2002). <i>Forest Measurements</i>, 5.ª ed. McGraw-Hill.', 'Bruce, D. (1925). A formula for the Scribner rule. <i>Journal of Forestry</i> 23:432–433.', 'Clark, J. F. (1906). The measurement of saw logs. <i>Forestry Quarterly</i> 4:79–93.'] });

  /* B. lumber */
  const b = UI.section(root, ['Madera aserrada', 'Sawn lumber'], ['Pies tabla y metros cúbicos de una lista de piezas.', 'Board feet and cubic metres of a list of pieces.']);
  const br = mk('div', { class: 'btn-row' });
  br.innerHTML = `<label for="b9unit" class="sr-only">${L2('Unidades', 'Units')}</label><select id="b9unit"><option value="in"${optL('Pulgadas y pies', 'Inches and feet')}</option><option value="cm"${optL('Centímetros y metros', 'Centimetres and metres')}</option></select>`;
  const exB = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cargar ejemplo: lo aserrado de las 12 trozas', 'Load example: the lumber from the 12 logs'));
  exB.addEventListener('click', () => { el('b9unit').value = 'in'; S.pieces = EX_PIECES.map(p => ({ name: T(p[0], p[1]), t: p[2], w: p[3], L: p[4], n: p[5] })); drawPieceGrid(); tallyLumber(); });
  br.appendChild(exB);
  b.appendChild(br);
  R.pieceGrid = mk('div'); b.appendChild(R.pieceGrid);
  R.unitHint = mk('p', { class: 'hint' }); b.appendChild(R.unitHint);
  const tb = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Contar', 'Tally'));
  tb.addEventListener('click', tallyLumber);
  b.appendChild(mk('div', { class: 'btn-row' })).appendChild(tb);
  el('b9unit').addEventListener('change', () => { drawPieceGrid(); if (S.lumRes) tallyLumber(); });
  R.lumber = mk('div', { class: 'res-host' }); b.appendChild(R.lumber);
  UI.method(b, { text: [
    '<p>Un pie tabla es una pieza de 1 pulgada × 12 pulgadas × 1 pie: 144 pulgadas cúbicas = 2.359 737 216 dm³, de modo que 1 m³ = 423.776 pies tabla. Pies tabla de una pieza = grosor (pulg) × ancho (pulg) × largo (pies) / 12, con las medidas nominales con que se comercia. En centímetros y metros, m³ = grosor × ancho × largo / 10 000.</p>',
    '<p>A board foot is a piece of 1 inch × 12 inches × 1 foot: 144 cubic inches = 2.359737216 dm³, so 1 m³ = 423.776 board feet. Board feet of a piece = thickness (in) × width (in) × length (ft) / 12, with the nominal sizes used in trade. In centimetres and metres, m³ = thickness × width × length / 10,000.</p>'],
    refs: ['NIST (2008). <i>Guide for the Use of the International System of Units (SI)</i>. Special Publication 811, apéndice B.'] });

  /* C. sawmill yield */
  const c = UI.section(root, ['Rendimiento de aserrío', 'Sawmill yield'], ['Cuánta madera aserrada sale de la madera en rollo.', 'How much sawn lumber comes out of the roundwood.']);
  const cg = mk('div', { class: 'form-grid' });
  cg.innerHTML = [['b9vlog', 'Madera en rollo (m³)', 'Roundwood (m³)'], ['b9vlum', 'Madera aserrada (m³)', 'Sawn lumber (m³)'], ['b9rule', 'Regla de referencia (pies tabla)', 'Reference rule (board feet)']]
    .map(([id, es, en]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" step="any"></div>`).join('');
  c.appendChild(cg);
  c.appendChild(mk('p', { class: 'hint' }, L2('Se llenan solas con los totales de las dos secciones de arriba (Smalian e Internacional ¼″); puedes escribir otros.', 'They fill themselves with the totals of the two sections above (Smalian and International ¼″); you may type others.')));
  const yb = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Calcular el rendimiento', 'Compute the yield'));
  yb.addEventListener('click', sawYield);
  c.appendChild(mk('div', { class: 'btn-row' })).appendChild(yb);
  R.yield = mk('div', { class: 'res-host' }); c.appendChild(R.yield);
  UI.method(c, { text: [
    '<p><b>Coeficiente de aserrío</b> = m³ aserrados / m³ en rollo; el resto es aserrín, costeras, recortes y corteza. <b>Pies tabla por m³ en rollo</b> = el mismo cociente expresado en pies tabla. <b>Sobrerrendimiento</b> (<i>overrun</i>) = pies tabla aserrados / pies tabla de la regla − 1: positivo si la regla subestima lo que el aserradero obtiene. Depende del diámetro, la sierra, el patrón de corte y las medidas de las piezas.</p>',
    '<p><b>Lumber recovery</b> = m³ sawn / m³ of roundwood; the rest is sawdust, slabs, trimmings and bark. <b>Board feet per m³ of roundwood</b> = the same ratio in board feet. <b>Overrun</b> = board feet sawn / board feet of the rule − 1: positive if the rule underestimates what the mill obtains. It depends on the diameter, the saw, the cutting pattern and the sizes of the pieces.</p>'],
    refs: ['Steele, P. H. (1984). <i>Factors Determining Lumber Recovery in Sawmilling</i>. USDA Forest Service, Gen. Tech. Rep. FPL-39.'] });

  /* D. form factor */
  const d = UI.section(root, ['Factor de forma', 'Form factor'], ['La fracción del cilindro (área basal × altura) que ocupa el fuste.', 'The fraction of the cylinder (basal area × height) the stem fills.']);
  const dg = mk('div', { class: 'form-grid' });
  dg.innerHTML = [['b9fd', 'Diámetro normal (cm)', 'Diameter at breast height (cm)', 32], ['b9fh', 'Altura (m)', 'Height (m)', 24], ['b9fv', 'Volumen (m³)', 'Volume (m³)', 0.85], ['b9ff', 'Factor de forma', 'Form factor', '']]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('');
  d.appendChild(dg);
  d.appendChild(mk('p', { class: 'hint' }, L2('Deja vacío lo que quieras calcular: el factor (con volumen) o el volumen (con factor).', 'Leave empty what you want to compute: the factor (from volume) or the volume (from factor).')));
  const fb = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Calcular', 'Compute'));
  fb.addEventListener('click', formCalc);
  d.appendChild(mk('div', { class: 'btn-row' })).appendChild(fb);
  R.form = mk('div', { class: 'res-host' }); d.appendChild(R.form);
  UI.method(d, { text: [
    '<p>Factor de forma artificial (referido a la altura del pecho): f = V/(g·h), con g el área basal a 1.30 m. Los sólidos de referencia, medidos en su base, tienen f = 1 (cilindro), 1/2 (paraboloide), 1/3 (cono) y 1/4 (neiloide). En coníferas suele estar entre 0.40 y 0.55; con el Bloque 2 puedes ajustar ecuaciones de volumen, que sustituyen al factor de forma cuando hay datos.</p>',
    '<p>Artificial form factor (referred to breast height): f = V/(g·h), with g the basal area at 1.30 m. The reference solids, measured at their base, have f = 1 (cylinder), 1/2 (paraboloid), 1/3 (cone) and 1/4 (neiloid). In conifers it usually lies between 0.40 and 0.55; with Block 2 you can fit volume equations, which replace the form factor when there are data.</p>'],
    refs: ['Prodan, M., Peters, R., Cox, F. y Real, P. (1997). <i>Mensura Forestal</i>. IICA y GTZ, San José.'] });

  /* E. units */
  const e = UI.section(root, ['Conversión de unidades', 'Unit conversion'], ['Del sistema inglés al métrico y al revés, con las definiciones exactas.', 'From imperial to metric and back, with the exact definitions.']);
  const eg = mk('div', { class: 'form-grid' });
  eg.innerHTML = `<div class="field"><label for="b9kind">${L2('Magnitud', 'Quantity')}</label><select id="b9kind">${Object.entries(UNITS).map(([k, v]) => `<option value="${k}"${optL(v[0][0], v[0][1])}</option>`).join('')}</select></div>` +
    `<div class="field"><label for="b9val">${L2('Valor', 'Value')}</label><input type="number" id="b9val" value="1" step="any"></div>` +
    `<div class="field"><label for="b9from">${L2('De', 'From')}</label><select id="b9from"></select></div>`;
  e.appendChild(eg);
  R.conv = mk('div', { class: 'res-host' }); e.appendChild(R.conv);
  const sg = mk('div', { class: 'form-grid' });
  sg.innerHTML = `<div class="field"><label for="b9st">${L2('Leña apilada (m³ estéreos)', 'Stacked wood (stacked m³)')}</label><input type="number" id="b9st" value="10" step="any"></div><div class="field"><label for="b9stf">${L2('Factor de apilado (sólido/estéreo)', 'Stacking factor (solid/stacked)')}</label><input type="number" id="b9stf" value="0.65" step="any"></div><div class="field"><span class="field-label">${L2('Madera sólida', 'Solid wood')}</span><output id="b9sto" class="field-out"></output></div>`;
  e.appendChild(mk('h3', null, L2('Leña apilada', 'Stacked wood')));
  e.appendChild(sg);
  ['b9kind', 'b9val', 'b9from'].forEach(id => el(id).addEventListener(id === 'b9val' ? 'input' : 'change', e2 => { if (id === 'b9kind') fillUnits(); convert(); }));
  ['b9st', 'b9stf'].forEach(id => el(id).addEventListener('input', stacked));
  UI.method(e, { text: [
    '<p>Definiciones exactas: 1 pulgada = 2.54 cm; 1 pie = 0.3048 m; 1 acre = 4 046.856 422 4 m²; 1 libra = 0.453 592 37 kg; 1 pie tabla = 144 pulg³; 1 cuerda = 128 pies³ de madera apilada. Las magnitudes por superficie se convierten con el factor de la unidad y el de la superficie (por ejemplo, 1 pie²/acre = 0.2296 m²/ha). El carbono pasa a CO₂ equivalente por 44/12. El factor de apilado (madera sólida por metro cúbico estéreo) depende del diámetro y de lo recto de las piezas; 0.6 a 0.7 es lo común en leña.</p>',
    '<p>Exact definitions: 1 inch = 2.54 cm; 1 foot = 0.3048 m; 1 acre = 4,046.8564224 m²; 1 pound = 0.45359237 kg; 1 board foot = 144 in³; 1 cord = 128 ft³ of stacked wood. Per-area quantities are converted with the factor of the unit and that of the area (for example, 1 ft²/acre = 0.2296 m²/ha). Carbon becomes CO₂ equivalent by 44/12. The stacking factor (solid wood per stacked cubic metre) depends on the diameter and the straightness of the pieces; 0.6 to 0.7 is usual for firewood.</p>'],
    refs: ['NIST (2008). <i>Guide for the Use of the International System of Units (SI)</i>. Special Publication 811.'] });

  /* F. plantation economics */
  const f = UI.section(root, ['Costo y rentabilidad de una plantación', 'Cost and profitability of a plantation'], ['Flujo de costos e ingresos por hectárea, descontado a una tasa.', 'Flow of costs and revenues per hectare, discounted at a rate.']);
  const fg = mk('div', { class: 'form-grid' });
  fg.innerHTML = [['b9rate', 'Tasa de descuento (% anual)', 'Discount rate (% per year)', 8], ['b9ann', 'Costo anual fijo (protección, administración)', 'Fixed annual cost (protection, management)', 900], ['b9T', 'Turno (años; vacío = último año del flujo)', 'Rotation (years; empty = last year of the flow)', '']]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('');
  f.appendChild(fg);
  const fr = mk('div', { class: 'btn-row' });
  const exF = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cargar ejemplo: pino a 25 años', 'Load example: pine at 25 years'));
  exF.addEventListener('click', () => { S.flows = EX_FLOWS.map(r => ({ t: r[0], label: T(r[1], r[2]), cost: r[3], income: r[4] })); el('b9rate').value = 8; el('b9ann').value = 900; el('b9T').value = ''; drawFlowGrid(); econ(); });
  fr.appendChild(exF);
  f.appendChild(fr);
  R.flowGrid = mk('div'); f.appendChild(R.flowGrid);
  f.appendChild(mk('p', { class: 'hint' }, L2('Costos e ingresos por hectárea en la moneda que uses; varias filas pueden tener el mismo año.', 'Costs and revenues per hectare in the currency you use; several rows may share a year.')));
  const eb = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Evaluar', 'Evaluate'));
  eb.addEventListener('click', econ);
  f.appendChild(mk('div', { class: 'btn-row' })).appendChild(eb);
  R.econ = mk('div', { class: 'res-host' }); f.appendChild(R.econ);
  UI.method(f, { text: [
    '<p>Con la tasa r y el flujo neto N<sub>t</sub> = ingresos − costos del año t: <b>valor presente neto</b> VPN = Σ N<sub>t</sub>/(1 + r)<sup>t</sup>; <b>relación beneficio/costo</b> = valor presente de los ingresos / el de los costos; <b>tasa interna de retorno</b>: la r que anula el VPN (el primer cambio de signo entre −90 % y 200 %, afinado por bisección); <b>valor esperado del suelo</b> de Faustmann, VES = VPN·(1 + r)<sup>T</sup>/((1 + r)<sup>T</sup> − 1): lo que vale la tierra si se repite el mismo turno para siempre, la medida correcta para comparar turnos de distinta duración; <b>anualidad equivalente</b> = VPN·r/(1 − (1 + r)<sup>−T</sup>); <b>recuperación</b>: el primer año en que el flujo descontado acumulado deja de ser negativo. Todo se calcula en valores reales: usa una tasa sin inflación y precios constantes.</p>',
    '<p>With the rate r and the net flow N<sub>t</sub> = revenues − costs of year t: <b>net present value</b> NPV = Σ N<sub>t</sub>/(1 + r)<sup>t</sup>; <b>benefit–cost ratio</b> = present value of revenues / that of costs; <b>internal rate of return</b>: the r that makes the NPV zero (the first change of sign between −90 % and 200 %, refined by bisection); Faustmann\'s <b>land expectation value</b>, LEV = NPV·(1 + r)<sup>T</sup>/((1 + r)<sup>T</sup> − 1): what the land is worth if the same rotation is repeated forever, the right measure to compare rotations of different length; <b>equivalent annual annuity</b> = NPV·r/(1 − (1 + r)<sup>−T</sup>); <b>payback</b>: the first year in which the cumulative discounted flow stops being negative. Everything is in real terms: use a rate without inflation and constant prices.</p>'],
    refs: ['Faustmann, M. (1849). Berechnung des Werthes, welchen Waldboden sowie noch nicht haubare Holzbestände für die Waldwirthschaft besitzen. <i>Allgemeine Forst- und Jagd-Zeitung</i> 25:441–455.', 'Klemperer, W. D. (1996). <i>Forest Resource Economics and Finance</i>. McGraw-Hill.', 'Bettinger, P., Boston, K., Siry, J. P. y Grebner, D. L. (2017). <i>Forest Management and Planning</i>, 2.ª ed. Academic Press.'] });

  S.logs = [{ id: 'T01', L: NaN, d1: NaN, d2: NaN, dm: NaN, bark: NaN }];
  S.pieces = [{ name: '', t: NaN, w: NaN, L: NaN, n: 1 }];
  S.flows = [{ t: 0, label: '', cost: NaN, income: NaN }];
  drawLogGrid(); drawPieceGrid(); drawFlowGrid(); fillUnits(); convert(); stacked();
}

/* ---------------- A ---------------- */
function drawLogGrid() {
  UI.grid(R.logGrid, [{ key: 'id', label: ['Troza', 'Log'], w: 70 }, { key: 'L', label: ['Largo (m)', 'Length (m)'], num: true }, { key: 'd1', label: ['D punta delgada (cm)', 'Small-end D (cm)'], num: true }, { key: 'd2', label: ['D punta gruesa (cm)', 'Large-end D (cm)'], num: true },
    { key: 'dm', label: ['D a la mitad (cm)', 'Middle D (cm)'], num: true }, { key: 'bark', label: ['Corteza (mm)', 'Bark (mm)'], num: true }], S.logs);
}
function scaleLogs() {
  R.logs.innerHTML = '';
  const ub = el('b9ub').checked;
  const logs = S.logs.filter(l => l.L > 0 && l.d1 > 0 && l.d2 > 0);
  if (!logs.length) { showMessage(R.logs, 'info', L2('Escribe al menos una troza con largo y los dos diámetros de las puntas, o carga el ejemplo.', 'Type at least one log with its length and both end diameters, or load the example.')); return; }
  const swap = logs.filter(l => l.d1 > l.d2);
  if (swap.length) showMessage(R.logs, 'warning', L2(`En ${swap.length} trozas la punta delgada es más gruesa que la gruesa; revisa el orden de las columnas.`, `In ${swap.length} logs the small end is thicker than the large end; check the order of the columns.`));
  const rows = logs.map(l => Object.assign({ id: l.id }, K().logVolume(l, { underBark: ub })));
  const sum = k => rows.reduce((s, r) => s + (isFinite(r[k]) ? r[k] : 0), 0);
  const tot = { smalian: sum('smalian'), huber: sum('huber'), newton: sum('newton'), frustum: sum('frustum'), doyle: sum('doyle'), scribner: sum('scribner'), intl: sum('intl') };
  const allMid = rows.every(r => isFinite(r.huber));
  S.logRes = { rows, tot, ub };
  UI.tiles(R.logs.appendChild(mk('div')), [
    [['Trozas', 'Logs'], String(rows.length), [ub ? 'sin corteza' : 'con corteza', ub ? 'under bark' : 'over bark']],
    [['Smalian', 'Smalian'], n3(tot.smalian) + ' m³', [n0(tot.smalian * K().M3_BF) + ' pies tabla de volumen', n0(tot.smalian * K().M3_BF) + ' board feet of volume']],
    allMid ? [['Newton', 'Newton'], n3(tot.newton) + ' m³', ['Huber: ' + n3(tot.huber) + ' m³', 'Huber: ' + n3(tot.huber) + ' m³']] : null,
    [['Internacional ¼″', 'International ¼″'], n0(tot.intl) + ' PT', ['Doyle ' + n0(tot.doyle) + ' · Scribner ' + n0(tot.scribner), 'Doyle ' + n0(tot.doyle) + ' · Scribner ' + n0(tot.scribner)]],
  ]);
  UI.table(R.logs, { title: ['Volumen por troza', 'Volume by log'], file: 'forestpro_trozas', columns: [
    { key: 'id', label: ['Troza', 'Log'] }, { key: 'Din', label: ['D (pulg)', 'D (in)'], num: true, fmt: n1 }, { key: 'Lft', label: ['L (pies)', 'L (ft)'], num: true, fmt: n1 },
    { key: 'smalian', label: ['Smalian (m³)', 'Smalian (m³)'], num: true, fmt: n4 }, { key: 'huber', label: ['Huber (m³)', 'Huber (m³)'], num: true, fmt: n4 }, { key: 'newton', label: ['Newton (m³)', 'Newton (m³)'], num: true, fmt: n4 }, { key: 'frustum', label: ['Cono truncado (m³)', 'Frustum (m³)'], num: true, fmt: n4 },
    { key: 'doyle', label: ['Doyle (PT)', 'Doyle (BF)'], num: true, fmt: n0 }, { key: 'scribner', label: ['Scribner (PT)', 'Scribner (BF)'], num: true, fmt: n0 }, { key: 'intl', label: ['Internacional ¼″ (PT)', 'International ¼″ (BF)'], num: true, fmt: n0 }],
    rows: rows.concat([Object.assign({ id: T('Total', 'Total'), _class: 'row-total' }, tot)]) });
  const cats = rows.map(r => r.id);
  UI.figure(R.logs, { title: ['Pies tabla por troza según la regla', 'Board feet by log by rule'], svg: Plot.bars({ cats, series: [
    { label: 'Doyle', values: rows.map(r => r.doyle), color: Plot.color(2) }, { label: 'Scribner', values: rows.map(r => r.scribner), color: Plot.color(1) }, { label: T('Internacional ¼″', 'International ¼″'), values: rows.map(r => r.intl), color: 'var(--primary)' }],
    ylab: T('Pies tabla', 'Board feet'), name: 'b9-reglas', w: 680, h: 340 }), key: 'b9-rules' });
  const small = rows.filter(r => r.Din < 12);
  const dS = 100 * (tot.huber / tot.smalian - 1);
  UI.interp(R.logs, [`Las ${rows.length} trozas suman ${n3(tot.smalian)} m³ por Smalian${allMid ? `; Huber da ${fmtPct(dS, 1)} respecto de Smalian y Newton queda entre ambas (${n3(tot.newton)} m³). Smalian sobreestima en trozas con base acampanada; Newton es la más exacta cuando se mide el diámetro de en medio` : ''}. En pies tabla, la regla Internacional ¼″ da ${n0(tot.intl)}, Scribner ${n0(tot.scribner)} y Doyle ${n0(tot.doyle)}: ${small.length ? `Doyle castiga las ${small.length} trozas de menos de 12 pulgadas, que en la práctica rinden más de lo que dice` : 'las diferencias crecen en las trozas delgadas, donde Doyle se queda corta'}. Un m³ en rollo no son 424 pies tabla aserrados: la regla descuenta lo que se va en aserrín y costeras.`,
    `The ${rows.length} logs add up to ${n3(tot.smalian)} m³ by Smalian${allMid ? `; Huber gives ${fmtPct(dS, 1)} relative to Smalian and Newton lies between them (${n3(tot.newton)} m³). Smalian overestimates in logs with a flared butt; Newton is the most accurate when the middle diameter is measured` : ''}. In board feet, the International ¼″ rule gives ${n0(tot.intl)}, Scribner ${n0(tot.scribner)} and Doyle ${n0(tot.doyle)}: ${small.length ? `Doyle is hard on the ${small.length} logs under 12 inches, which in practice yield more than it says` : 'the differences grow in small logs, where Doyle falls short'}. One m³ of roundwood is not 424 board feet of lumber: the rule discounts what goes into sawdust and slabs.`]);
  el('b9vlog').value = +tot.smalian.toFixed(4);
  el('b9rule').value = +tot.intl.toFixed(1);
  state.tools = Object.assign(state.tools || {}, { logs: { n: rows.length, m3: tot.smalian, intl: tot.intl } });
  Report.set(9, true); refreshStepMarks();
}

/* ---------------- B ---------------- */
function drawPieceGrid() {
  const cm = el('b9unit').value === 'cm';
  UI.grid(R.pieceGrid, [{ key: 'name', label: ['Pieza', 'Piece'], w: 170 }, { key: 't', label: cm ? ['Grosor (cm)', 'Thickness (cm)'] : ['Grosor (pulg)', 'Thickness (in)'], num: true }, { key: 'w', label: cm ? ['Ancho (cm)', 'Width (cm)'] : ['Ancho (pulg)', 'Width (in)'], num: true },
    { key: 'L', label: cm ? ['Largo (m)', 'Length (m)'] : ['Largo (pies)', 'Length (ft)'], num: true }, { key: 'n', label: ['Piezas', 'Pieces'], num: true, def: 1 }], S.pieces);
  R.unitHint.innerHTML = cm ? L2('Grosor y ancho en centímetros; largo en metros.', 'Thickness and width in centimetres; length in metres.') : L2('Medidas nominales: grosor y ancho en pulgadas, largo en pies (8¼ pies = 8.25).', 'Nominal sizes: thickness and width in inches, length in feet (8¼ ft = 8.25).');
}
function tallyLumber() {
  R.lumber.innerHTML = '';
  const unit = el('b9unit').value;
  const ps = S.pieces.filter(p => p.t > 0 && p.w > 0 && p.L > 0);
  if (!ps.length) { showMessage(R.lumber, 'info', L2('Escribe al menos una pieza con sus tres medidas, o carga el ejemplo.', 'Type at least one piece with its three sizes, or load the example.')); return; }
  const rows = ps.map(p => Object.assign({ name: p.name || '—', n: p.n > 0 ? p.n : 1 }, K().piece(p, unit)));
  const tot = { bf: rows.reduce((s, r) => s + r.bf, 0), m3: rows.reduce((s, r) => s + r.m3, 0), n: rows.reduce((s, r) => s + r.n, 0) };
  S.lumRes = { rows, tot };
  UI.tiles(R.lumber.appendChild(mk('div')), [[['Piezas', 'Pieces'], n0(tot.n)], [['Pies tabla', 'Board feet'], n1(tot.bf)], [['Metros cúbicos', 'Cubic metres'], n4(tot.m3) + ' m³']]);
  UI.table(R.lumber, { title: ['Madera aserrada por tipo de pieza', 'Sawn lumber by kind of piece'], file: 'forestpro_aserrada', columns: [
    { key: 'name', label: ['Pieza', 'Piece'] }, { key: 'n', label: ['Piezas', 'Pieces'], num: true, fmt: n0 }, { key: 'bf', label: ['Pies tabla', 'Board feet'], num: true, fmt: n2 }, { key: 'm3', label: ['m³', 'm³'], num: true, fmt: n4 },
    { key: 'share', label: ['% del volumen', '% of volume'], num: true, get: r => r._class ? 100 : 100 * r.m3 / tot.m3, fmt: v => fmtNum(v, 1) }],
    rows: rows.concat([Object.assign({ name: T('Total', 'Total'), _class: 'row-total' }, tot)]) });
  el('b9vlum').value = +tot.m3.toFixed(4);
  state.tools = Object.assign(state.tools || {}, { lumber: { bf: tot.bf, m3: tot.m3 } });
  Report.set(9, true); refreshStepMarks();
}

/* ---------------- C ---------------- */
function sawYield() {
  R.yield.innerHTML = '';
  const vl = +el('b9vlog').value, va = +el('b9vlum').value, rule = +el('b9rule').value;
  if (!(vl > 0) || !(va > 0)) { showMessage(R.yield, 'info', L2('Escribe el volumen en rollo y el aserrado (o cubica y cuenta arriba).', 'Type the roundwood and sawn volumes (or scale and tally above).')); return; }
  const y = K().sawmill(vl, va, rule);
  if (y.coef > 1) showMessage(R.yield, 'danger', L2('Sale más madera aserrada que en rollo: revisa las unidades o los datos.', 'More sawn lumber than roundwood comes out: check the units or the data.'));
  UI.tiles(R.yield.appendChild(mk('div')), [
    [['Coeficiente de aserrío', 'Lumber recovery'], fmtPct(100 * y.coef, 1), ['desperdicio ' + fmtPct(100 * y.waste, 1), 'waste ' + fmtPct(100 * y.waste, 1)]],
    [['Pies tabla por m³ en rollo', 'Board feet per m³ of roundwood'], n0(y.bfPerM3)],
    rule > 0 ? [['Sobrerrendimiento', 'Overrun'], fmtPct(100 * y.overrun, 1), ['frente a ' + n0(rule) + ' PT de la regla', 'against ' + n0(rule) + ' BF of the rule']] : null,
  ]);
  UI.interp(R.yield, [`De cada m³ en rollo salen ${fmtNum(y.coef, 3)} m³ de madera aserrada (${n0(y.bfPerM3)} pies tabla); ${fmtPct(100 * y.waste, 0)} se va en aserrín, costeras, recortes y corteza. ${y.coef < 0.45 ? 'Es un rendimiento bajo: trozas delgadas o torcidas, sierras de corte grueso o un patrón de corte que no aprovecha la troza.' : y.coef > 0.65 ? 'Es un rendimiento alto, propio de trozas gruesas y rectas o de sierras delgadas.' : 'Es un rendimiento común en aserraderos de sierra cinta o circular con trozas medianas.'}${rule > 0 ? ` El aserradero obtuvo ${fmtPct(100 * y.overrun, 0)} ${y.overrun >= 0 ? 'más' : 'menos'} de lo que predice la regla.` : ''}`,
    `Each m³ of roundwood yields ${fmtNum(y.coef, 3)} m³ of sawn lumber (${n0(y.bfPerM3)} board feet); ${fmtPct(100 * y.waste, 0)} goes into sawdust, slabs, trimmings and bark. ${y.coef < 0.45 ? 'It is a low recovery: small or crooked logs, thick-kerf saws or a cutting pattern that wastes the log.' : y.coef > 0.65 ? 'It is a high recovery, typical of large straight logs or thin saws.' : 'It is a common recovery for band or circular saw mills with medium logs.'}${rule > 0 ? ` The mill obtained ${fmtPct(100 * Math.abs(y.overrun), 0)} ${y.overrun >= 0 ? 'more' : 'less'} than the rule predicts.` : ''}`]);
  state.tools = Object.assign(state.tools || {}, { sawmill: { coef: y.coef, bfPerM3: y.bfPerM3, overrun: y.overrun } });
  Report.set(9, true); refreshStepMarks();
}

/* ---------------- D ---------------- */
function formCalc() {
  R.form.innerHTML = '';
  const d = +el('b9fd').value, h = +el('b9fh').value, Vs = el('b9fv').value, fs = el('b9ff').value;
  if (!(d > 0) || !(h > 1.3)) { showMessage(R.form, 'info', L2('Escribe el diámetro y la altura.', 'Type the diameter and the height.')); return; }
  const g0 = Math.PI * d * d / 40000;
  let f, V;
  if (Vs !== '' && +Vs > 0) { V = +Vs; f = K().formFactor(V, d, h); el('b9ff').value = ''; }
  else if (fs !== '' && +fs > 0) { f = +fs; V = K().volumeFromForm(f, d, h); }
  else { showMessage(R.form, 'info', L2('Escribe el volumen o el factor de forma.', 'Type the volume or the form factor.')); return; }
  const near = K().SOLIDS.reduce((a, s) => Math.abs(s.f - f) < Math.abs(a.f - f) ? s : a);
  UI.tiles(R.form.appendChild(mk('div')), [[['Factor de forma', 'Form factor'], fmtNum(f, 3)], [['Volumen', 'Volume'], n4(V) + ' m³'], [['Cilindro de referencia', 'Reference cylinder'], n4(g0 * h) + ' m³', ['g = ' + fmtNum(g0, 4) + ' m²', 'g = ' + fmtNum(g0, 4) + ' m²']]]);
  UI.table(R.form, { title: ['Sólidos de referencia', 'Reference solids'], file: false, columns: [{ key: 'name', label: ['Sólido', 'Solid'], get: s => T(s.es, s.en) }, { key: 'f', label: ['Factor de forma', 'Form factor'], num: true, fmt: v => fmtNum(v, 3) }, { key: 'V', label: ['Volumen con estas medidas (m³)', 'Volume with these sizes (m³)'], num: true, get: s => s.f * g0 * h, fmt: n4 }], rows: K().SOLIDS });
  UI.interp(R.form, [`El fuste ocupa ${fmtPct(100 * f, 1)} del cilindro de ${n1(d)} cm × ${n1(h)} m; su forma está más cerca de ${T(near.es, near.en).toLowerCase()}${f > 1 ? '. Un factor mayor que 1 indica un error en el volumen o en las medidas' : f < 0.3 ? '. Un factor tan bajo es raro en un fuste comercial: revisa el volumen' : ''}.`,
    `The stem fills ${fmtPct(100 * f, 1)} of the ${n1(d)} cm × ${n1(h)} m cylinder; its shape is closest to a ${T(near.es, near.en).toLowerCase()}${f > 1 ? '. A factor above 1 points to an error in the volume or the sizes' : f < 0.3 ? '. Such a low factor is rare in a commercial stem: check the volume' : ''}.`]);
}

/* ---------------- E ---------------- */
function fillUnits() {
  const k = el('b9kind').value, sel = el('b9from'), cur = sel.value;
  sel.innerHTML = UNITS[k][1].map(u => `<option value="${u[0]}"${optL(u[1], u[2])}</option>`).join('');
  if (UNITS[k][1].some(u => u[0] === cur)) sel.value = cur;
}
function convert() {
  R.conv.innerHTML = '';
  const k = el('b9kind').value, v = +el('b9val').value, from = el('b9from').value;
  if (!isFinite(v)) return;
  const trim = s => /\.\d*$/.test(s) ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  const fmtV = x => { const a = Math.abs(x); return a === 0 ? '0' : a >= 1e6 || a < 1e-4 ? x.toExponential(5).replace('-', '−') : trim(fmtNum(x, a >= 100 ? 2 : a >= 1 ? 4 : 6)); };
  UI.table(R.conv, { title: [`${fmtV(v)} ${T(...UNITS[k][1].find(u => u[0] === from).slice(1))} equivalen a`, `${fmtV(v)} ${T(...UNITS[k][1].find(u => u[0] === from).slice(1))} equal`], file: 'forestpro_conversion', columns: [
    { key: 'u', label: ['Unidad', 'Unit'] }, { key: 'v', label: ['Valor', 'Value'], num: true, get: r => fmtV(r.v), raw: r => r.v }],
    rows: UNITS[k][1].filter(u => u[0] !== from).map(u => ({ u: T(u[1], u[2]), v: K().convert(k, v, from, u[0]) })) });
}
function stacked() {
  const st = +el('b9st').value, f = +el('b9stf').value;
  el('b9sto').textContent = st > 0 && f > 0 ? fmtNum(K().stacked(st, f), 2) + ' m³' : '—';
}

/* ---------------- F ---------------- */
function drawFlowGrid() {
  UI.grid(R.flowGrid, [{ key: 't', label: ['Año', 'Year'], num: true, def: 0 }, { key: 'label', label: ['Concepto', 'Item'], w: 240 }, { key: 'cost', label: ['Costo', 'Cost'], num: true }, { key: 'income', label: ['Ingreso', 'Revenue'], num: true }], S.flows);
}
function econ() {
  R.econ.innerHTML = '';
  const r = (+el('b9rate').value) / 100, ann = +el('b9ann').value || 0, Ts = el('b9T').value;
  const flows = S.flows.filter(f => isFinite(f.t) && f.t >= 0 && (f.cost > 0 || f.income > 0));
  if (!flows.length) { showMessage(R.econ, 'info', L2('Escribe al menos un costo o un ingreso con su año, o carga el ejemplo.', 'Type at least one cost or revenue with its year, or load the example.')); return; }
  if (!isFinite(r) || r <= -1) { showMessage(R.econ, 'warning', L2('Revisa la tasa de descuento.', 'Check the discount rate.')); return; }
  const T0 = Ts !== '' && +Ts > 0 ? Math.round(+Ts) : null;
  const late = T0 != null ? flows.filter(f => f.t > T0) : [];
  if (late.length) showMessage(R.econ, 'warning', L2(`${late.length} movimientos caen después del turno y no se cuentan.`, `${late.length} items fall after the rotation and are not counted.`));
  const e = K().econ(flows, ann, r, T0);
  const money = v => (v < 0 ? '−' : '') + '$' + fmtNum(Math.abs(v), 0);
  UI.tiles(R.econ.appendChild(mk('div')), [
    [['Valor presente neto', 'Net present value'], money(e.npv), [`al ${fmtPct(100 * r, 1)}`, `at ${fmtPct(100 * r, 1)}`], e.npv >= 0 ? 'good' : 'bad'],
    [['Tasa interna de retorno', 'Internal rate of return'], isFinite(e.irr) ? fmtPct(100 * e.irr, 2) : '—'],
    [['Beneficio / costo', 'Benefit / cost'], fmtNum(e.bc, 2)],
    [['Valor esperado del suelo', 'Land expectation value'], money(e.lev), ['Faustmann, turno de ' + e.T + ' años', 'Faustmann, rotation of ' + e.T + ' years']],
    [['Anualidad equivalente', 'Equivalent annual annuity'], money(e.eaa) + T(' /año', ' /year')],
    [['Costo de establecimiento', 'Establishment cost'], money(e.establishment), ['años 0 y 1; total sin descontar ' + money(e.costTotal), 'years 0 and 1; undiscounted total ' + money(e.costTotal)]],
    [['Recuperación (descontada)', 'Payback (discounted)'], isFinite(e.payback) ? T('año ', 'year ') + e.payback : T('no se recupera', 'not recovered')],
  ]);
  const yrs = e.rows.map(x => String(x.t));
  UI.figure(R.econ, { title: ['Flujo de efectivo por año', 'Cash flow by year'], svg: Plot.bars({ cats: yrs, stacked: true, series: [{ label: T('Ingresos', 'Revenues'), values: e.rows.map(x => x.income || NaN), color: 'var(--primary)' }, { label: T('Costos', 'Costs'), values: e.rows.map(x => x.cost ? -x.cost : NaN), color: 'var(--accent)' }],
    xlab: T('Año', 'Year'), ylab: T('Por hectárea', 'Per hectare'), name: 'b9-flujo', w: 680, h: 330 }), key: 'b9-flow' });
  const rates = Array.from({ length: 61 }, (_, i) => i * 0.0025);
  const curve = K().npvCurve(flows, ann, rates, T0);
  UI.figure(R.econ, { title: ['Valor presente neto según la tasa de descuento', 'Net present value by discount rate'], svg: Plot.xy({ series: [
    { type: 'line', x: rates.map(x => 100 * x), y: curve.map(c => c.npv), color: 'var(--primary)', width: 2.4, label: T('VPN', 'NPV') },
    { type: 'line', x: e.rows.map(x => x.t), y: e.rows.map(x => x.cum), hidden: true },
    { type: 'hline', y: 0, color: 'var(--fig-muted)', dash: '4 3' },
    isFinite(e.irr) && e.irr >= 0 && e.irr <= 0.15 ? { type: 'points', x: [100 * e.irr], y: [0], color: 'var(--accent)', r: 5, label: T('TIR', 'IRR') } : null,
    { type: 'points', x: [100 * r], y: [e.npv], color: 'var(--fig-ink)', r: 4, label: T('Tasa elegida', 'Chosen rate') }].filter(s => s && !s.hidden),
    xlab: T('Tasa de descuento (%)', 'Discount rate (%)'), ylab: T('VPN por hectárea', 'NPV per hectare'), name: 'b9-vpn-tasa', w: 600, h: 330 }), key: 'b9-npv' });
  UI.table(R.econ, { title: ['Flujo de efectivo descontado', 'Discounted cash flow'], file: 'forestpro_flujo', columns: [
    { key: 't', label: ['Año', 'Year'], num: true }, { key: 'cost', label: ['Costos', 'Costs'], num: true, fmt: n0 }, { key: 'income', label: ['Ingresos', 'Revenues'], num: true, fmt: n0 },
    { key: 'net', label: ['Neto', 'Net'], num: true, fmt: n0 }, { key: 'disc', label: ['Neto descontado', 'Discounted net'], num: true, fmt: n0 }, { key: 'cum', label: ['Acumulado descontado', 'Cumulative discounted'], num: true, fmt: n0 }],
    rows: e.rows.filter(x => x.cost || x.income), note: ['Los años sin movimientos más que el costo anual no se muestran; sí se cuentan.', 'Years with nothing but the annual cost are not shown; they are counted.'] });
  UI.interp(R.econ, [`${e.npv >= 0 ? `Al ${fmtPct(100 * r, 1)} la plantación es rentable: deja ${money(e.npv)} por hectárea en valor presente` : `Al ${fmtPct(100 * r, 1)} la plantación no es rentable: pierde ${money(-e.npv)} por hectárea en valor presente`}${isFinite(e.irr) ? ` y su tasa interna de retorno es ${fmtPct(100 * e.irr, 1)}, ${e.irr > r ? 'mayor' : 'menor'} que la tasa exigida` : ''}. Cada unidad invertida regresa ${fmtNum(e.bc, 2)} en valor presente. Si la tierra se dedica a este turno para siempre, vale ${money(e.lev)} por hectárea (Faustmann); compara este valor, no el VPN de un solo turno, cuando evalúes turnos de distinta duración. Con casi todo el ingreso al final, el resultado es muy sensible a la tasa y al precio de la corta final.`,
    `${e.npv >= 0 ? `At ${fmtPct(100 * r, 1)} the plantation is profitable: it leaves ${money(e.npv)} per hectare in present value` : `At ${fmtPct(100 * r, 1)} the plantation is not profitable: it loses ${money(-e.npv)} per hectare in present value`}${isFinite(e.irr) ? ` and its internal rate of return is ${fmtPct(100 * e.irr, 1)}, ${e.irr > r ? 'above' : 'below'} the required rate` : ''}. Each unit invested returns ${fmtNum(e.bc, 2)} in present value. If the land is given to this rotation forever, it is worth ${money(e.lev)} per hectare (Faustmann); compare this value, not the NPV of a single rotation, when you weigh rotations of different length. With almost all the revenue at the end, the result is very sensitive to the rate and to the price of the final harvest.`]);
  state.tools = Object.assign(state.tools || {}, { econ: { npv: e.npv, irr: e.irr, lev: e.lev, bc: e.bc, r } });
  Report.set(9, true); refreshStepMarks();
}

ExampleHooks['pino:9'] = () => { build(); [...el('b9root').querySelectorAll('.btn-primary')].filter(b => /ejemplo|example/i.test(b.textContent)).forEach(b => b.click()); [...el('b9root').querySelectorAll('button')].find(b => /Calcular el rendimiento/.test(b.textContent)).click(); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('langchange', () => { if (!el('b9root') || !el('b9root').dataset.built) return; const k = el('b9kind').value; fillUnits(); el('b9kind').value = k; convert();
  /* the results carry words of the language they were drawn in */
  if (S.logRes) scaleLogs(); if (S.lumRes) tallyLumber(); if (R.yield.childElementCount) sawYield(); if (R.form.childElementCount) formCalc(); if (R.econ.childElementCount) econ(); });
})();
