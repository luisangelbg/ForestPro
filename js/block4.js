/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 4: biomass and carbon.
   Works on the inventory of Block 3 (trees with their plot and expansion factor). */
(function () {
'use strict';
const S = { rules: [], dens: null, gwdd: null, custom: [], res: null, mc: null };
const R = {};
const BM = () => window.Biomass;
const n0 = v => fmtNum(v, 0), n1 = v => fmtNum(v, 1), n2 = v => fmtNum(v, 2), n3 = v => fmtNum(v, 3);
const PRESETS = {
  cafetal: { def: 'chave14_h', zone: 'trop_mount', rules: [['Inga', 'segura06_inga'], ['Cordia alliodora', 'segura06_cordia'], ['Musa', 'vnoord02_musa']] },
  mesofilo: { def: 'chave14_h', zone: 'trop_mount', rules: [] },
};
const allEqs = () => BM().EQS.concat(S.custom.map(c => BM().custom(c)));
const eqById = id => allEqs().find(e => e.id === id);
const eqName = e => e ? T(e.es, e.en).replace(/<[^>]+>/g, '') : '—';

/* ---------------- the page ---------------- */
function build() {
  const root = el('b4root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('La biomasa se calcula árbol por árbol con la ecuación que le toca, se expande a la hectárea con los factores del inventario del Bloque 3 y se convierte en carbono y CO₂ equivalente. Cada número sale con su incertidumbre: la del muestreo y la de las mediciones y la ecuación.',
    'Biomass is computed tree by tree with the equation that applies, expanded to the hectare with the factors of the Block 3 inventory, and converted to carbon and CO₂ equivalent. Every number comes with its uncertainty: that of sampling and that of the measurements and the equation.')));
  /* the reference table of the examples; its level (especie / género) is a label of the examples and follows the language */
  S.dens = FPData.rows('densidades_madera').map(r => ({ especie: r.especie, densidad: r.densidad, nivel: r.nivel, n: r.n, fuente: r.fuente }));
  S.dens.forEach(r => Object.defineProperty(r, 'exLevel', { value: true, enumerable: false }));

  /* A. data and equations */
  const a = UI.section(root, ['Datos y ecuaciones', 'Data and equations'],
    ['Usa el inventario cargado en el Bloque 3 o carga un ejemplo aquí. Elige la ecuación por omisión y las reglas que asignan ecuaciones propias a ciertas especies o géneros.', 'Use the inventory loaded in Block 3 or load an example here. Choose the default equation and the rules that give certain species or genera their own equation.']);
  const src = mk('div', { class: 'src-row' });
  src.innerHTML = `<select id="b4ex" aria-label="${esc(T('Ejemplo', 'Example'))}"><option value="cafetal"${optL('Cafetal bajo sombra', 'Shaded coffee farm')}</option><option value="mesofilo"${optL('Bosque mesófilo', 'Cloud forest')}</option></select>`;
  const exB = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cargar ejemplo', 'Load example'));
  const invB = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Usar el inventario del Bloque 3', 'Use the Block 3 inventory'));
  exB.addEventListener('click', () => loadExample(el('b4ex').value));
  invB.addEventListener('click', () => { if (!state.inv) { clearMessages(R.msgA); showMessage(R.msgA, 'info', L2('Todavía no hay inventario: carga uno en el Bloque 3 o un ejemplo aquí.', 'There is no inventory yet: load one in Block 3 or an example here.')); return; } compute(); });
  src.append(exB, invB);
  a.appendChild(src);
  R.msgA = mk('div', { class: 'messages' }); a.appendChild(R.msgA);
  R.status = mk('p', { class: 'data-status' }); a.appendChild(R.status);
  const fg = mk('div', { class: 'form-grid' });
  fg.innerHTML = `<div class="field wider"><label for="b4def">${L2('Ecuación por omisión', 'Default equation')}</label><select id="b4def"></select></div>` +
    `<div class="field"><label for="b4E">${L2('E (estrés ambiental, si la ecuación lo pide)', 'E (environmental stress, if the equation asks for it)')}</label><input type="number" id="b4E" value="0" step="any"></div>` +
    `<div class="field wide"><label for="b4rootSel">${L2('Biomasa de raíces', 'Root biomass')}</label><select id="b4rootSel"></select></div>` +
    `<div class="field"><label for="b4rs">${L2('Razón raíz/tallo (si es constante)', 'Root:shoot ratio (if constant)')}</label><input type="number" id="b4rs" value="0.24" step="0.01"></div>` +
    `<div class="field"><label for="b4cf">${L2('Fracción de carbono', 'Carbon fraction')}</label><input type="number" id="b4cf" value="0.47" step="0.01"></div>` +
    `<div class="field"><label for="b4dead">${L2('Fracción que queda en muertos en pie', 'Fraction left in standing dead')}</label><input type="number" id="b4dead" value="1" step="0.05" min="0" max="1"></div>`;
  a.appendChild(fg);
  fillEqSelect(el('b4def'), 'chave14_h');
  const rs = el('b4rootSel');
  rs.innerHTML = BM().IPCC_RS.map(z => `<option value="${z.id}"${optL('IPCC 2006: ' + z.es, 'IPCC 2006: ' + z.en)}</option>`).join('') + `<option value="cairns"${optL('Cairns et al. 1997 (por hectárea)', 'Cairns et al. 1997 (per hectare)')}</option><option value="const"${optL('Razón constante', 'Constant ratio')}</option>`;
  rs.value = 'trop_mount';
  ['b4def', 'b4E', 'b4rootSel', 'b4rs', 'b4cf', 'b4dead'].forEach(id => el(id).addEventListener('change', () => { if (S.res) compute(); }));
  a.appendChild(mk('h3', null, L2('Reglas: ecuación por especie o género', 'Rules: equation by species or genus')));
  a.appendChild(mk('p', { class: 'hint' }, L2('Una especie («Cordia alliodora») o un género («Inga») y la ecuación que le toca. Una regla de especie gana a una de género.', 'A species (“Cordia alliodora”) or a genus (“Inga”) and the equation that applies. A species rule wins over a genus rule.')));
  R.rules = mk('div'); a.appendChild(R.rules);
  drawRules();
  a.appendChild(mk('h3', null, L2('Tus ecuaciones', 'Your equations')));
  a.appendChild(mk('p', { class: 'hint' }, L2('Agrega una ecuación local con su forma y coeficientes (resultado en kg; D en cm, H en m, ρ en g/cm³). Aparece en las listas de arriba.', 'Add a local equation with its form and coefficients (result in kg; D in cm, H in m, ρ in g/cm³). It shows in the lists above.')));
  R.custom = mk('div'); a.appendChild(R.custom);
  drawCustom();
  R.catalog = mk('div'); a.appendChild(R.catalog);
  drawCatalog();
  UI.method(a, { text: [
    '<p>AGB en kg de materia seca por árbol; D = DAP (cm), H = altura total (m), ρ = densidad básica de la madera (g/cm³). Las ecuaciones de Chave et al. (2005) ya incluyen la corrección por el sesgo de regresar del logaritmo; la de Chave et al. (2014, ec. 4) se usa tal como se publicó. Cada ecuación vale en el intervalo de diámetros con que se ajustó: la app cuenta cuántos árboles quedan fuera. La raíz se estima con la razón raíz/tallo del Cuadro 4.4 del IPCC (2006) según la zona ecológica y la biomasa aérea de cada parcela, o con la ecuación 3 de Cairns et al. (1997) por hectárea. Carbono = biomasa × fracción de carbono (0.47 por omisión, Cuadro 4.3 del IPCC 2006); CO₂e = C × 44/12. Los árboles muertos en pie se calculan con la misma ecuación por la fracción que conservan, y se informan como necromasa.</p>',
    '<p>AGB in kg of dry mass per tree; D = DBH (cm), H = total height (m), ρ = basic wood density (g/cm³). The equations of Chave et al. (2005) already include the correction for the bias of back-transforming from the logarithm; that of Chave et al. (2014, eq. 4) is used as published. Each equation holds in the range of diameters it was fitted on: the app counts how many trees fall outside. Roots come from the root:shoot ratio of IPCC (2006) Table 4.4 by ecological zone and the aboveground biomass of each plot, or from eq. 3 of Cairns et al. (1997) per hectare. Carbon = biomass × carbon fraction (0.47 by default, IPCC 2006 Table 4.3); CO₂e = C × 44/12. Standing dead trees use the same equation times the fraction they keep, and are reported as necromass.</p>'],
    refs: ['Cairns, M. A., Brown, S., Helmer, E. H. y Baumgardner, G. A. (1997). Root biomass allocation in the world\'s upland forests. <i>Oecologia</i> 111:1–11.', 'IPCC (2006). <i>2006 IPCC Guidelines for National Greenhouse Gas Inventories</i>, vol. 4, cap. 4 (cuadros 4.3 y 4.4).', 'Chave, J. et al. (2014). <i>Global Change Biology</i> 20:3177–3190.', 'Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.'] });

  /* B. wood density */
  const b = UI.section(root, ['Densidad de la madera', 'Wood density'],
    ['La tabla trae los valores de la base mundial de densidad de la madera para las especies de los ejemplos; edítala o agrega las tuyas. Si cargas la base completa, la búsqueda baja de especie a género y familia como en la implementación de referencia.', 'The table brings the values of the global wood density database for the species of the examples; edit it or add yours. If you load the full database, the search goes down from species to genus and family as in the reference implementation.']);
  R.densGrid = mk('div'); b.appendChild(R.densGrid);
  UI.grid(R.densGrid, [{ key: 'especie', label: ['Especie', 'Species'], w: 190 }, { key: 'densidad', label: ['Densidad (g/cm³)', 'Density (g/cm³)'], num: true }, { key: 'nivel', label: ['Nivel', 'Level'], w: 90 }, { key: 'fuente', label: ['Fuente', 'Source'], w: 200 }], S.dens, { onChange: () => { if (S.res) compute(); } });
  const gw = mk('div', { class: 'src-row' });
  gw.innerHTML = `<input type="file" id="b4gwdd" class="sr-only" accept=".csv,.txt,.xlsx,.xlsm,.ods"><label class="btn btn-secondary btn-sm" for="b4gwdd" tabindex="0" role="button">${L2('Cargar la base mundial (archivo de la GWDD)…', 'Load the global database (GWDD file)…')}</label>` +
    `<label class="inline-label">${L2('Región', 'Region')} <select id="b4region"><option value="World"${optL('Mundo', 'World')}</option></select></label>`;
  b.appendChild(gw);
  el('b4gwdd').addEventListener('change', loadGWDD);
  el('b4region').addEventListener('change', () => { if (S.gwddRows) { buildGWDD(); if (S.res) compute(); } });
  R.dens = mk('div', { class: 'res-host' }); b.appendChild(R.dens);
  UI.method(b, { text: [
    '<p>Densidad básica = masa anhidra / volumen verde. Orden de búsqueda: (1) tu tabla, por nombre exacto; (2) con la base mundial cargada, la media de los registros de la especie; si falta, la media de las medias de las especies del género; si falta y conoces la familia, la media de las medias de los géneros de la familia; (3) la media de los árboles de la misma parcela; (4) la media de todo el inventario. La desviación estándar que se usa en el Monte Carlo depende del nivel en que se encontró: 0.071 (especie), 0.094 (género) y 0.123 g/cm³ (familia), como en la implementación de referencia. La base mundial es de dominio público (CC0): Zanne et al. (2009), doi:10.5061/dryad.234.</p>',
    '<p>Basic density = oven-dry mass / green volume. Search order: (1) your table, by exact name; (2) with the global database loaded, the mean of the records of the species; if missing, the mean of the species means of the genus; if missing and the family is known, the mean of the genus means of the family; (3) the mean of the trees of the same plot; (4) the mean of the whole inventory. The standard deviation used in the Monte Carlo depends on the level at which it was found: 0.071 (species), 0.094 (genus) and 0.123 g/cm³ (family), as in the reference implementation. The global database is in the public domain (CC0): Zanne et al. (2009), doi:10.5061/dryad.234.</p>'],
    refs: ['Zanne, A. E. et al. (2009). Data from: Towards a worldwide wood economics spectrum. Dryad, doi:10.5061/dryad.234.', 'Chave, J. et al. (2009). Towards a worldwide wood economics spectrum. <i>Ecology Letters</i> 12:351–366.', 'Réjou-Méchain, M. et al. (2017). BIOMASS: an R package for estimating above-ground biomass and its uncertainty in tropical forests. <i>Methods in Ecology and Evolution</i> 8:1163–1167.'] });

  /* C. results */
  const c = UI.section(root, ['Biomasa y carbono del inventario', 'Biomass and carbon of the inventory'], ['Por árbol, por parcela y para todo el predio, con el intervalo del muestreo.', 'Per tree, per plot and for the whole property, with the sampling interval.']);
  R.res = mk('div', { class: 'res-host' }); c.appendChild(R.res);

  /* D. Monte Carlo */
  const d = UI.section(root, ['Incertidumbre por Monte Carlo', 'Uncertainty by Monte Carlo'],
    ['Repite el cálculo cientos de veces con diámetros, alturas y densidades perturbados por su error y con el error residual de cada ecuación. Da la incertidumbre de las mediciones y del modelo, que se suma a la del muestreo.', 'Repeats the computation hundreds of times with diameters, heights and densities perturbed by their error and with the residual error of each equation. It gives the uncertainty of measurements and model, which adds to that of sampling.']);
  const mf = mk('div', { class: 'form-grid' });
  mf.innerHTML = `<div class="field"><label for="b4n">${L2('Iteraciones', 'Iterations')}</label><select id="b4n"><option>500</option><option selected>1000</option><option>2000</option><option>5000</option></select></div>` +
    `<div class="field wide"><label for="b4dErr">${L2('Error del diámetro', 'Diameter error')}</label><select id="b4dErr"><option value="chave2004"${optL('Chave et al. 2004 (95 % pequeño, 5 % grande)', 'Chave et al. 2004 (95 % small, 5 % large)')}</option><option value="cv1">CV 1 %</option><option value="cv2">CV 2 %</option><option value="none"${optL('Sin error', 'No error')}</option></select></div>` +
    `<div class="field"><label for="b4hCv">${L2('Error de la altura medida (CV %)', 'Error of measured height (CV %)')}</label><input type="number" id="b4hCv" value="5" step="any"></div>` +
    `<div class="field"><label for="b4hCvEst">${L2('Error de la altura estimada (CV %)', 'Error of estimated height (CV %)')}</label><input type="number" id="b4hCvEst" value="15" step="any"></div>` +
    `<label class="checkbox-label"><input type="checkbox" id="b4resid" checked> ${L2('Error residual de la ecuación', 'Residual error of the equation')}</label>`;
  d.appendChild(mf);
  const runB = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Correr el Monte Carlo', 'Run the Monte Carlo'));
  runB.addEventListener('click', runMC);
  d.appendChild(mk('div', { class: 'btn-row' })).appendChild(runB);
  R.mc = mk('div', { class: 'res-host' }); d.appendChild(R.mc);
  UI.method(d, { text: [
    '<p>En cada iteración: D′ ~ normal truncada (0.1–500 cm) con DE = 0.0062·D + 0.0904 para el 95 % de los árboles y 4.64 cm para un 5 % sorteado (errores de medición de Chave et al. 2004), o con el CV elegido; H′ ~ normal truncada (1.3 m – máximo + 15 m) con el CV elegido, mayor para las alturas que se estimaron con una curva; ρ′ ~ normal truncada (0.08–1.39 g/cm³) con la DE de su nivel; y, si la ecuación publica su error residual σ en escala logarítmica, AGB′ = AGB(D′, H′, ρ′)·exp(ε − σ²/2) con ε ~ N(0, σ): el ruido tiene media uno porque las ecuaciones publicadas ya predicen la media (su intercepto incluye la corrección exp(σ²/2)). Se suma por parcela con su factor de expansión y se promedia entre parcelas. El intervalo es el de los percentiles 2.5 y 97.5. La incertidumbre total combina en cuadratura la del muestreo y la de Monte Carlo (método 1 de propagación del IPCC 2006, vol. 1, cap. 3). A diferencia de la implementación de referencia, no se sortean los coeficientes de la ecuación (no se publican sus distribuciones posteriores); el error residual domina en las ecuaciones pantropicales.</p>',
    '<p>In each iteration: D′ ~ truncated normal (0.1–500 cm) with SD = 0.0062·D + 0.0904 for 95 % of the trees and 4.64 cm for a random 5 % (measurement errors of Chave et al. 2004), or with the chosen CV; H′ ~ truncated normal (1.3 m – maximum + 15 m) with the chosen CV, larger for heights estimated with a curve; ρ′ ~ truncated normal (0.08–1.39 g/cm³) with the SD of its level; and, if the equation publishes its residual error σ on the log scale, AGB′ = AGB(D′, H′, ρ′)·exp(ε − σ²/2) with ε ~ N(0, σ): the noise has mean one because the published equations already predict the mean (their intercept includes the exp(σ²/2) correction). It is summed per plot with its expansion factor and averaged over plots. The interval is that of the 2.5 and 97.5 percentiles. The total uncertainty combines in quadrature that of sampling and that of the Monte Carlo (approach 1 of IPCC 2006, vol. 1, ch. 3). Unlike the reference implementation, the coefficients of the equation are not drawn (their posterior distributions are not published); the residual error dominates in the pantropical equations.</p>'],
    refs: ['Chave, J. et al. (2004). Error propagation and scaling for tropical forest biomass estimates. <i>Phil. Trans. R. Soc. B</i> 359:409–420.', 'Réjou-Méchain, M. et al. (2017). <i>Methods in Ecology and Evolution</i> 8:1163–1167.', 'IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 1, cap. 3: Uncertainties.'] });

  /* E. necromass, litter and soil */
  const e = UI.section(root, ['Necromasa, hojarasca y suelo', 'Necromass, litter and soil'], ['Los otros reservorios de carbono, cada uno con su propia tabla.', 'The other carbon pools, each with its own table.']);
  e.appendChild(mk('h3', null, L2('Madera caída (intersección de líneas)', 'Downed wood (line intersect)')));
  const df = mk('div', { class: 'form-grid' });
  df.innerHTML = [['b4d1', 'Densidad clase 1, sana (g/cm³)', 'Density class 1, sound (g/cm³)', 0.45], ['b4d2', 'Clase 2, intermedia', 'Class 2, intermediate', 0.34], ['b4d3', 'Clase 3, podrida', 'Class 3, rotten', 0.23]]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="0.01"></div>`).join('');
  e.appendChild(df);
  ['b4d1', 'b4d2', 'b4d3'].forEach(id => el(id).addEventListener('change', () => { if (S.cwd) drawCWD(); }));
  UI.dataCard(e, { id: 'b4w', fields: [
    { key: 'transecto', es: 'Transecto', en: 'Transect', req: true, aliases: ['transect', 'linea'] },
    { key: 'longitud_m', es: 'Longitud (m)', en: 'Length (m)', num: true, req: true, aliases: ['longitud', 'length', 'l'] },
    { key: 'diametro_cm', es: 'Diámetro en el cruce (cm)', en: 'Diameter at the crossing (cm)', num: true, req: true, aliases: ['diametro', 'diameter', 'd'] },
    { key: 'clase', es: 'Clase de descomposición (1–3)', en: 'Decay class (1–3)', num: true, aliases: ['class', 'decay'] }],
    examples: [{ id: 'mesofilo', es: 'Bosque mesófilo: 12 transectos de 30 m', en: 'Cloud forest: 12 transects of 30 m', d: ['Diámetro de cada pieza en el punto donde la línea la cruza y su clase de descomposición.', 'Diameter of each piece where the line crosses it, and its decay class.'], rows: () => FPData.rows('mesofilo_madera_caida').map(r => ({ transecto: r.transecto, longitud_m: r.longitud_m, diametro_cm: r.diametro_cm, clase: r.clase })) }],
    onData: (rows, meta) => { S.cwd = rows; S.cwdSrc = srcOf(meta); drawCWD(); } });
  R.cwd = mk('div', { class: 'res-host' }); e.appendChild(R.cwd);
  e.appendChild(mk('h3', null, L2('Hojarasca', 'Litter')));
  UI.dataCard(e, { id: 'b4l', fields: [
    { key: 'parcela', es: 'Parcela', en: 'Plot', req: true, aliases: ['plot'] },
    { key: 'peso_seco_g', es: 'Peso seco (g)', en: 'Dry weight (g)', num: true, req: true, aliases: ['hojarasca g', 'peso', 'dry weight'] },
    { key: 'marco_m2', es: 'Superficie del marco (m²)', en: 'Frame area (m²)', num: true, req: true, aliases: ['marco', 'frame'] }],
    examples: [{ id: 'cafetal', es: 'Cafetal: un marco de 0.25 m² por parcela', en: 'Coffee farm: one 0.25 m² frame per plot', d: ['Peso seco de la hojarasca recogida en el marco.', 'Dry weight of the litter collected in the frame.'], rows: () => FPData.rows('cafetal_parcelas').map(r => ({ parcela: r.parcela, peso_seco_g: r.hojarasca_g, marco_m2: r.marco_m2 })) }],
    onData: (rows, meta) => { S.lit = rows; S.litSrc = srcOf(meta); drawLitter(); } });
  R.lit = mk('div', { class: 'res-host' }); e.appendChild(R.lit);
  e.appendChild(mk('h3', null, L2('Carbono orgánico del suelo', 'Soil organic carbon')));
  UI.dataCard(e, { id: 'b4s', fields: [
    { key: 'parcela', es: 'Parcela o perfil', en: 'Plot or profile', req: true, aliases: ['plot', 'perfil', 'muestra', 'rep', 'repeticion', 'sitio'] },
    { key: 'prof_sup', es: 'Profundidad superior (cm)', en: 'Upper depth (cm)', num: true, aliases: ['desde', 'top', 'prof sup'] },
    { key: 'prof_inf', es: 'Profundidad inferior (cm)', en: 'Lower depth (cm)', num: true, aliases: ['hasta', 'bottom', 'prof inf'] },
    { key: 'capa', es: 'Capa (p. ej. «0-10»), si no hay profundidades', en: 'Layer (e.g. “0-10”), if there are no depths', aliases: ['layer', 'horizonte', 'profundidad'] },
    { key: 'espesor_cm', es: 'Espesor (cm), si no hay profundidades ni capa', en: 'Thickness (cm), if there are no depths or layer', num: true, aliases: ['espesor', 'thickness', 'thick'] },
    { key: 'co_pct', es: 'Carbono orgánico (%)', en: 'Organic carbon (%)', num: true, req: true, aliases: ['co', 'cos', 'soc', 'carbono organico', 'c org', 'oc'] },
    { key: 'dap_g_cm3', es: 'Densidad aparente (g/cm³)', en: 'Bulk density (g/cm³)', num: true, req: true, aliases: ['densidad aparente', 'da', 'bd', 'bulk density'] },
    { key: 'pedregosidad_pct', es: 'Fragmentos gruesos (%)', en: 'Coarse fragments (%)', num: true, aliases: ['pedregosidad', 'gravas', 'coarse', 'fragmentos', 'frag'] },
    { key: 'grupo', es: 'Sistema o grupo (opcional)', en: 'System or group (optional)', aliases: ['sistema', 'manejo', 'tratamiento', 'group', 'uso'] },
    { key: 'anio', es: 'Año (opcional)', en: 'Year (optional)', aliases: ['año', 'year', 'fecha'] }],
    examples: [{ id: 'cafetal', es: 'Cafetal: 3 capas de 0 a 30 cm por parcela', en: 'Coffee farm: 3 layers from 0 to 30 cm per plot', d: ['El mismo formato de capas que usan los análisis de suelo (carbono %, densidad aparente y fragmentos gruesos).', 'The same layer format soil analyses use (carbon %, bulk density and coarse fragments).'], rows: () => FPData.rows('cafetal_suelo') }],
    onData: (rows, meta) => { S.soil = soilLayers(rows); S.soilSrc = srcOf(meta); S.soilGroup = null; drawSoil(); } });
  R.soil = mk('div', { class: 'res-host' }); e.appendChild(R.soil);
  UI.method(e, { text: [
    '<p><b>Madera caída</b> (Van Wagner 1968): V = π²·Σd²/(8L), con d en cm y L en m da m³/ha directamente; la masa es V por la densidad de su clase de descomposición (mídela en tu sitio; los valores por omisión son solo un punto de partida). <b>Hojarasca:</b> Mg/ha = gramos secos / m² del marco × 0.01. <b>Suelo:</b> Mg C/ha de una capa = C % × densidad aparente (g/cm³) × espesor (cm) × (1 − fragmentos gruesos/100); se suman las capas de cada perfil.</p>',
    '<p><b>Downed wood</b> (Van Wagner 1968): V = π²·Σd²/(8L), with d in cm and L in m gives m³/ha directly; mass is V times the density of its decay class (measure it at your site; the default values are only a starting point). <b>Litter:</b> Mg/ha = dry grams / m² of frame × 0.01. <b>Soil:</b> Mg C/ha of a layer = C % × bulk density (g/cm³) × thickness (cm) × (1 − coarse fragments/100); the layers of each profile are added.</p>'],
    refs: ['Van Wagner, C. E. (1968). The line intersect method in forest fuel sampling. <i>Forest Science</i> 14:20–26.', 'Pearson, T. R. H., Brown, S. L. y Birdsey, R. A. (2007). <i>Measurement Guidelines for the Sequestration of Forest Carbon</i>. USDA Forest Service, GTR NRS-18.'] });

  /* F. pools and change */
  const f = UI.section(root, ['Reservorios y cambio entre inventarios', 'Pools and change between inventories'], ['El carbono de todos los reservorios con su error, y cuánto cambió entre dos mediciones.', 'The carbon of every pool with its error, and how much it changed between two measurements.']);
  const pf = mk('div', { class: 'form-grid' });
  pf.innerHTML = `<div class="field"><label for="b4shrub">${L2('Arbustos y otros (Mg C/ha)', 'Shrubs and others (Mg C/ha)')}</label><input type="number" id="b4shrub" value="0" step="any"></div><div class="field"><label for="b4shrubSe">${L2('Su error estándar', 'Its standard error')}</label><input type="number" id="b4shrubSe" value="0" step="any"></div>`;
  f.appendChild(pf);
  ['b4shrub', 'b4shrubSe'].forEach(id => el(id).addEventListener('change', drawPools));
  R.pools = mk('div', { class: 'res-host' }); f.appendChild(R.pools);
  f.appendChild(mk('h3', null, L2('Cambio de existencias', 'Change in stocks')));
  UI.dataCard(f, { id: 'b4c', fields: [
    { key: 'parcela', es: 'Parcela', en: 'Plot', req: true, aliases: ['plot'] },
    { key: 'c1', es: 'Carbono en la 1.ª medición (Mg/ha)', en: 'Carbon at the 1st measurement (Mg/ha)', num: true, req: true, aliases: ['c inicial', 'stock1'] },
    { key: 'c2', es: 'Carbono en la 2.ª medición (Mg/ha)', en: 'Carbon at the 2nd measurement (Mg/ha)', num: true, req: true, aliases: ['c final', 'stock2'] },
    { key: 'edad1', es: 'Año o edad 1', en: 'Year or age 1', num: true, aliases: ['ano1', 'year1'] },
    { key: 'edad2', es: 'Año o edad 2', en: 'Year or age 2', num: true, aliases: ['ano2', 'year2'] }],
    examples: [{ id: 'pino', es: 'Pino: carbono aéreo en dos remediciones', en: 'Pine: aboveground carbon in two remeasurements', d: ['30 parcelas permanentes medidas dos veces (las mismas parcelas: diseño pareado).', '30 permanent plots measured twice (the same plots: paired design).'], rows: () => FPData.rows('pino_carbono_remedicion') }],
    onData: rows => { S.chg = rows; drawChange(); } });
  const cf2 = mk('div', { class: 'form-grid' });
  cf2.innerHTML = `<label class="checkbox-label"><input type="checkbox" id="b4paired" checked> ${L2('Las mismas parcelas (pareado)', 'The same plots (paired)')}</label><div class="field"><label for="b4years">${L2('Años entre mediciones (si no hay columnas de año)', 'Years between measurements (if there are no year columns)')}</label><input type="number" id="b4years" value="5" step="any"></div>`;
  f.appendChild(cf2);
  ['b4paired', 'b4years'].forEach(id => el(id).addEventListener('change', () => { if (S.chg) drawChange(); }));
  R.chg = mk('div', { class: 'res-host' }); f.appendChild(R.chg);
  UI.method(f, { text: [
    '<p>Cada reservorio se estima con su propia muestra (parcelas, transectos, marcos o perfiles) y su error estándar. El total es la suma de las medias. Su error no se obtiene sumando en cuadratura los reservorios que salen de las mismas parcelas, porque no son independientes: la biomasa aérea, las raíces (que se calculan de ella) y los muertos en pie suben y bajan juntos de una parcela a otra, y la cuadratura subestimaría el error. Por eso los reservorios medidos en las parcelas del inventario (árboles vivos, raíces, muertos en pie y, si traen las mismas parcelas, la hojarasca y el suelo) se suman parcela por parcela, y el error del total sale de esos totales por parcela con el mismo estimador del inventario (aleatorio simple o estratificado). Solo los reservorios de otra muestra (los transectos de madera caída, o una hojarasca o un suelo de otras parcelas) y el valor que escribas para arbustos se agregan en cuadratura, como independientes (IPCC 2006, vol. 1, ec. 3.1). El intervalo usa ±1.96·EE. El balance usa los datos de un solo sitio: una tarjeta cargada con el ejemplo o el archivo de otro sitio que el inventario queda fuera, con un aviso. <b>Cambio:</b> con las mismas parcelas, la media de las diferencias parcela a parcela y su error estándar (t pareada); con muestras independientes, la diferencia de medias con el error de Welch. La tasa anual divide entre los años transcurridos.</p>',
    '<p>Each pool is estimated with its own sample (plots, transects, frames or profiles) and its standard error. The total is the sum of the means. Its error is not obtained by adding in quadrature the pools that come from the same plots, because they are not independent: aboveground biomass, roots (computed from it) and standing dead trees rise and fall together from plot to plot, and quadrature would understate the error. So the pools measured on the plots of the inventory (live trees, roots, standing dead and, if they carry the same plots, litter and soil) are added plot by plot, and the error of the total comes from those plot totals with the same estimator as the inventory (simple random or stratified). Only the pools from another sample (the downed-wood transects, or litter or soil from other plots) and the value you type for shrubs are added in quadrature, as independent (IPCC 2006, vol. 1, eq. 3.1). The interval uses ±1.96·SE. The balance uses the data of a single site: a card loaded with the example or the file of a site other than the inventory\'s is left out, with a warning. <b>Change:</b> with the same plots, the mean of the plot-by-plot differences and its standard error (paired t); with independent samples, the difference of means with Welch\'s error. The annual rate divides by the years elapsed.</p>'],
    refs: ['IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 1, cap. 3 (ec. 3.1 y 3.2) y vol. 4, cap. 2.', 'Welch, B. L. (1947). The generalization of “Student’s” problem when several different population variances are involved. <i>Biometrika</i> 34:28–35.'] });
}

/* ---------------- equations: selects, rules, custom ---------------- */
function fillEqSelect(sel, value) {
  const groups = [['pan', 'Pantropicales', 'Pantropical'], ['dry', 'Trópico seco', 'Dry tropics'], ['moist', 'Trópico húmedo', 'Moist tropics'], ['wet', 'Trópico muy húmedo', 'Wet tropics'], ['agro', 'Agroforestería (café y sombra)', 'Agroforestry (coffee and shade)'], ['pine', 'Pinos', 'Pines'], ['temperate', 'Templadas (por grupos de especies)', 'Temperate (by species groups)'], ['user', 'Tus ecuaciones', 'Your equations']];
  const eqs = allEqs();
  sel.innerHTML = groups.map(([g, es, en]) => { const l = eqs.filter(e => e.group === g); return l.length ? `<optgroup label="${esc(T(es, en))}">${l.map(e => `<option value="${e.id}">${esc(eqName(e))}</option>`).join('')}</optgroup>` : ''; }).join('');
  if (value && eqs.find(e => e.id === value)) sel.value = value;
}
function drawRules() {
  R.rules.innerHTML = '';
  const opts = allEqs().map(e => [e.id, eqName(e)]);
  UI.grid(R.rules, [{ key: 'pat', label: ['Especie o género', 'Species or genus'], w: 190 }, { key: 'eq', label: ['Ecuación', 'Equation'], options: opts }], S.rules, { onChange: () => { if (S.res) compute(); } });
}
function drawCustom() {
  R.custom.innerHTML = '';
  const forms = Object.keys(BM().FORMS).map(k => [k, BM().FORMS[k].es]);
  UI.grid(R.custom, [{ key: 'name', label: ['Nombre', 'Name'], w: 150 }, { key: 'form', label: ['Forma', 'Form'], options: forms }, { key: 'a', label: ['a'], num: true }, { key: 'b', label: ['b'], num: true }, { key: 'c', label: ['c'], num: true }, { key: 'd', label: ['d'], num: true }, { key: 'sigma', label: ['σ (ln)'], num: true }, { key: 'dmin', label: ['D mín.', 'D min.'], num: true }, { key: 'dmax', label: ['D máx.', 'D max.'], num: true }, { key: 'src', label: ['Fuente', 'Source'], w: 160 }],
    S.custom, { onChange: () => { S.custom.forEach((c, i) => { c.id = 'user' + (i + 1); if (!c.form) c.form = 'power'; if (!c.name) c.name = T('Mi ecuación ', 'My equation ') + (i + 1); ['c', 'd'].forEach(k => { if (!isFinite(c[k])) c[k] = 0; }); }); fillEqSelect(el('b4def'), el('b4def').value); drawRules(); drawCatalog(); if (S.res) compute(); } });
}
function drawCatalog() {
  R.catalog.innerHTML = '';
  const det = mk('details', { class: 'method-box' });
  det.innerHTML = `<summary>${L2('Ver el catálogo de ecuaciones', 'See the catalog of equations')} (${allEqs().length})</summary>`;
  const body = mk('div', { class: 'method-body' });
  det.appendChild(body);
  R.catalog.appendChild(det);
  UI.table(body, { file: 'forestpro_ecuaciones', cls: 'res-table wrap', columns: [
    { key: 'name', label: ['Ecuación', 'Equation'], html: true }, { key: 'eq', label: ['Forma (AGB en kg)', 'Form (AGB in kg)'] },
    { key: 'needs', label: ['Variables', 'Variables'] }, { key: 'sigma', label: ['σ (ln)'], num: true, fmt: n3 },
    { key: 'range', label: ['DAP válido (cm)', 'Valid DBH (cm)'] }, { key: 'src', label: ['Fuente', 'Source'], html: true }],
    rows: allEqs().map(e => ({ name: T(e.es, e.en), eq: e.eq, needs: e.needs.join(', ').replace('rho', 'ρ').replace('D15', 'd₁₅'), sigma: e.sigma, range: e.dmin + '–' + (isFinite(e.dmax) ? e.dmax : '∞'), src: e.user ? e.src : T(e.src, LangEN.ref(e.src)) })) });
}
function eqFor(sp) {
  const s = String(sp || '').trim().toLowerCase(), genus = s.split(' ')[0];
  const exact = S.rules.find(r => String(r.pat || '').trim().toLowerCase() === s);
  if (exact && eqById(exact.eq)) return eqById(exact.eq);
  const gen = S.rules.find(r => String(r.pat || '').trim().toLowerCase() === genus);
  if (gen && eqById(gen.eq)) return eqById(gen.eq);
  return eqById(el('b4def').value);
}

/* ---------------- wood density ---------------- */
async function loadGWDD() {
  const file = el('b4gwdd').files[0];
  if (!file) return;
  try {
    /* the old binary workbook (.xls) is not read: the reader handles CSV, XLSX and ODS */
    if (/\.xls$/i.test(file.name)) throw new Error(T('es un libro del formato viejo (.xls); guárdalo como .xlsx o .csv.', 'it is an old-format workbook (.xls); save it as .xlsx or .csv.'));
    const tab = DataIO.readAny(new Uint8Array(await file.arrayBuffer()), file.name, { sheet: 'Data' });
    const fi = DataIO.findColumn(tab.names, ['family', 'familia']), bi = DataIO.findColumn(tab.names, ['binomial', 'species', 'especie', 'taxon']);
    const wi = DataIO.findColumn(tab.names, ['wood density g cm 3 oven dry mass fresh volume', 'wood density', 'wd', 'densidad']), ri = DataIO.findColumn(tab.names, ['region', 'regionid']);
    if (bi < 0 || wi < 0) throw new Error(T('No se encontraron las columnas de especie y densidad.', 'The species and density columns were not found.'));
    S.gwddRows = [];
    for (let i = 0; i < tab.n; i++) {
      const nm = BM().splitName(tab.cols[bi].v[i]), wd = tab.cols[wi].num ? tab.cols[wi].v[i] : DataIO.toNumber(tab.cols[wi].v[i], '.');
      if (!nm.genus || !isFinite(wd)) continue;
      S.gwddRows.push({ family: fi >= 0 ? String(tab.cols[fi].v[i]) : '', genus: nm.genus, species: nm.species, wd, region: ri >= 0 ? String(tab.cols[ri].v[i]) : '' });
    }
    const regions = [...new Set(S.gwddRows.map(r => r.region).filter(Boolean))].sort();
    el('b4region').innerHTML = `<option value="World"${optL('Mundo', 'World')}</option>` + regions.map(r => `<option>${esc(r)}</option>`).join('');
    buildGWDD();
    if (window.LABG) LABG.toast(T(`Base cargada: ${S.gwddRows.length} registros`, `Database loaded: ${S.gwddRows.length} records`));
    if (S.res) compute();
  } catch (err) { showMessage(R.dens, 'danger', L2('No se pudo leer la base: ', 'The database could not be read: ') + esc(err.message || err)); }
  el('b4gwdd').value = '';
}
function buildGWDD() { S.gwdd = BM().densityIndex(S.gwddRows, { region: el('b4region').value }); }
function densities(trees) {
  const tab = new Map(S.dens.filter(r => r.especie && r.densidad > 0).map(r => [String(r.especie).trim().toLowerCase(), r]));
  const lvlName = { especie: 'species', 'género': 'genus', genero: 'genus', species: 'species', genus: 'genus' };
  const out = new Array(trees.length).fill(null);
  const rest = [];
  trees.forEach((t, i) => {
    const r = tab.get(String(t.especie || '').trim().toLowerCase());
    if (r) out[i] = { wd: r.densidad, n: r.n, level: lvlName[String(r.nivel || '').toLowerCase()] || 'table', sd: BM().SD_LEVEL[lvlName[String(r.nivel || '').toLowerCase()]] || BM().SD_LEVEL.species, src: 'table' };
    else rest.push(i);
  });
  if (rest.length) {
    const idx = S.gwdd || BM().densityIndex(S.dens.filter(r => r.densidad > 0).map(r => { const nm = BM().splitName(r.especie); return { genus: nm.genus, species: nm.species, wd: r.densidad }; }));
    /* the stand fallback needs every tree of the plot, also those already found in the table */
    const items = trees.map(t => { const nm = BM().splitName(t.especie); return { genus: nm.genus, species: nm.species, family: t.familia || '', stand: t.plot }; });
    const all = BM().woodDensity(items, idx, { stand: true });
    rest.forEach(i => { out[i] = Object.assign({}, all[i], { src: S.gwdd ? 'gwdd' : 'table' }); });
  }
  return out;
}

/* ---------------- computing ---------------- */
function loadExample(id) {
  const p = PRESETS[id];
  el('b4def').value = p.def; el('b4rootSel').value = p.zone;
  S.rules.length = 0; p.rules.forEach(([pat, eq]) => S.rules.push({ pat, eq }));
  drawRules();
  S.pendingCompute = true;
  goStep(4);
  if (window.ExampleHooks[id + ':3']) ExampleHooks[id + ':3']();
  setTimeout(() => { if (S.pendingCompute) { S.pendingCompute = false; compute(); } goStep(4); }, 60);
}
function compute() {
  if (!state.inv) return;
  const trees = state.inv.trees, Bm = BM();
  const dens = densities(trees);
  const E = +el('b4E').value || 0, deadKeep = Math.max(0, Math.min(1, +el('b4dead').value));
  const res = trees.map((t, i) => {
    const eq = eqFor(t.especie);
    const x = { D: t.dap, H: t.altura, rho: dens[i].wd, E, D15: t.d15 };
    const r = Bm.treeAGB(x, eq);
    return { plot: t.plot, stratum: t.stratum, sp: t.especie, D: t.dap, H: t.altura, hEst: t.hEst, rho: dens[i].wd, rhoLevel: dens[i].level, rhoSd: dens[i].sd, ef: t.ef, alive: t.alive !== false, eq, agb: r.agb * (t.alive === false ? deadKeep : 1), out: !!r.out, why: r.why };
  });
  /* per plot */
  const plots = state.inv.plots.map(p => ({ plot: p.plot, stratum: p.stratum, stratumArea: p.stratumArea }));
  const pIdx = new Map(plots.map((p, k) => [p.plot, k]));
  plots.forEach(p => { p.agb = 0; p.dead = 0; p.n = 0; });
  res.forEach(r => { const p = plots[pIdx.get(r.plot)]; if (!p || !isFinite(r.agb)) return; if (r.alive) { p.agb += r.agb * r.ef / 1000; p.n++; } else p.dead += r.agb * r.ef / 1000; });
  const rsSel = el('b4rootSel').value, cf = +el('b4cf').value || 0.47;
  plots.forEach(p => {
    if (rsSel === 'cairns') p.bgb = p.agb > 0 ? Bm.cairns(p.agb) : 0;
    else { p.rs = rsSel === 'const' ? +el('b4rs').value : Bm.rootShoot(rsSel, p.agb); p.bgb = p.agb * p.rs; }
    p.tot = p.agb + p.bgb; p.c = p.tot * cf; p.co2 = p.c * Bm.CO2; p.cDead = p.dead * cf;
  });
  S.res = { trees: res, plots, cf };
  state.biomass = { plots: plots.map(p => ({ plot: p.plot, agb: p.agb, bgb: p.bgb, c: p.c, co2: p.co2 })), cf };
  drawDensityTable(res);
  drawResults();
  drawPools();
  Report.set(4, true); refreshStepMarks();
  document.dispatchEvent(new CustomEvent('biomasschange'));
}
function estimateOf(plots, key) {
  const st = new Map();
  plots.forEach(p => { if (!p.stratum || !(p.stratumArea > 0)) return; if (!st.has(p.stratum)) st.set(p.stratum, { name: p.stratum, y: [], area: p.stratumArea }); st.get(p.stratum).y.push(p[key]); });
  const gs = [...st.values()];
  if (gs.length > 1 && gs.every(g => g.y.length > 1) && plots.every(p => p.stratumArea > 0)) return Invent.strat(gs, { conf: 0.95 });
  return Invent.srs(plots.map(p => p[key]), { conf: 0.95, area: state.inv.area });
}
function drawDensityTable(res) {
  R.dens.innerHTML = '';
  const by = new Map();
  res.forEach(r => { if (!by.has(r.sp)) by.set(r.sp, { sp: r.sp, n: 0, rho: r.rho, level: r.rhoLevel, sd: r.rhoSd, uses: r.eq && r.eq.needs.includes('rho') }); by.get(r.sp).n++; });
  const lv = { species: ['especie', 'species'], genus: ['género', 'genus'], family: ['familia', 'family'], stand: ['media de la parcela', 'plot mean'], dataset: ['media del inventario', 'inventory mean'], table: ['tabla', 'table'] };
  const rows = [...by.values()].sort((a, b) => b.n - a.n);
  UI.table(R.dens, { title: ['Densidad asignada a cada especie del inventario', 'Density given to each species of the inventory'], file: 'forestpro_densidades', columns: [
    { key: 'sp', label: ['Especie', 'Species'] }, { key: 'n', label: ['Árboles', 'Trees'], num: true }, { key: 'rho', label: ['Densidad (g/cm³)', 'Density (g/cm³)'], num: true, fmt: v => fmtNum(v, 3) },
    { key: 'level', label: ['Nivel', 'Level'], get: r => lv[r.level] ? T(lv[r.level][0], lv[r.level][1]) : r.level }, { key: 'sd', label: ['DE para el Monte Carlo', 'SD for the Monte Carlo'], num: true, fmt: v => fmtNum(v, 3) }], rows });
  /* only where the equation uses the density (a banana equation, for instance, does not) */
  const weak = rows.filter(r => r.uses && (r.level === 'stand' || r.level === 'dataset'));
  if (weak.length) showMessage(R.dens, 'warning', L2(`${weak.length} especies no están en la tabla ni a nivel de género (${weak.slice(0, 4).map(r => esc(r.sp)).join(', ')}${weak.length > 4 ? '…' : ''}): reciben la media de su parcela. Agrégalas a la tabla si conoces su densidad.`, `${weak.length} species are not in the table even at genus level (${weak.slice(0, 4).map(r => esc(r.sp)).join(', ')}${weak.length > 4 ? '…' : ''}): they get the mean of their plot. Add them to the table if you know their density.`));
}
function drawResults() {
  R.res.innerHTML = '';
  const { trees, plots, cf } = S.res;
  R.status.innerHTML = `<b>${esc(state.inv.name || T('Inventario', 'Inventory'))}</b> · ${L2(plots.length + ' parcelas, ' + trees.length + ' árboles', plots.length + ' plots, ' + trees.length + ' trees')}`;
  const live = trees.filter(t => t.alive);
  const miss = live.filter(t => !isFinite(t.agb));
  const out = live.filter(t => t.out && isFinite(t.agb));
  if (miss.length) showMessage(R.res, 'warning', L2(`${miss.length} árboles no tienen lo que pide su ecuación (${[...new Set(miss.map(t => t.why))].join(', ')}) y no suman biomasa.`, `${miss.length} trees lack what their equation needs (${[...new Set(miss.map(t => t.why))].join(', ')}) and add no biomass.`));
  const eA = estimateOf(plots, 'agb'), eT = estimateOf(plots, 'tot'), eC = estimateOf(plots, 'c'), eCO = estimateOf(plots, 'co2');
  S.est = { agb: eA, tot: eT, c: eC, co2: eCO };
  const tiles = mk('div'); R.res.appendChild(tiles);
  const ci = e => ['± ' + n1(e.half) + ' (' + fmtNum(e.errPct, 1) + ' %)', '± ' + n1(e.half) + ' (' + fmtNum(e.errPct, 1) + ' %)'];
  UI.tiles(tiles, [
    [['Biomasa aérea', 'Aboveground biomass'], n1(eA.mean) + ' Mg/ha', ci(eA)],
    [['Biomasa total (con raíces)', 'Total biomass (with roots)'], n1(eT.mean) + ' Mg/ha', ci(eT)],
    [['Carbono', 'Carbon'], n1(eC.mean) + ' Mg C/ha', ci(eC)],
    [['CO₂ equivalente', 'CO₂ equivalent'], n1(eCO.mean) + ' Mg CO₂e/ha', ci(eCO)],
    eC.total != null ? [['Carbono del predio', 'Carbon of the property'], fmtNum(eC.total, 0) + ' Mg C', [fmtNum(eC.totalLo, 0) + ' – ' + fmtNum(eC.totalHi, 0), fmtNum(eC.totalLo, 0) + ' – ' + fmtNum(eC.totalHi, 0)]] : null,
    out.length ? [['Fuera del intervalo de la ecuación', 'Outside the range of the equation'], String(out.length), [fmtPct(100 * out.length / live.length, 0) + ' de los árboles vivos', fmtPct(100 * out.length / live.length, 0) + ' of live trees'], 'warn'] : null,
  ]);
  const two = mk('div', { class: 'figs-2' }); R.res.appendChild(two);
  const sorted = plots.slice().sort((a, b) => b.tot - a.tot);
  UI.figure(two, { title: ['Biomasa por parcela', 'Biomass by plot'], svg: Plot.bars({ cats: sorted.map(p => p.plot), stacked: true, series: [{ label: T('Aérea', 'Aboveground'), values: sorted.map(p => p.agb), color: 'var(--bosque)' }, { label: T('Raíces', 'Roots'), values: sorted.map(p => p.bgb), color: 'var(--corteza)' }], ylab: 'Mg/ha', name: 'b4-biomasa-parcelas', w: 600, h: 360 }), key: 'b4-plots' });
  /* by species, per hectare */
  const nP = plots.length, bySp = new Map();
  live.forEach(t => { if (!isFinite(t.agb)) return; bySp.set(t.sp, (bySp.get(t.sp) || 0) + t.agb * t.ef / 1000 / nP); });
  const sp = [...bySp.entries()].sort((a, b) => b[1] - a[1]), top = sp.slice(0, 10);
  if (sp.length > 10) top.push([T('Otras', 'Others'), sp.slice(10).reduce((s, x) => s + x[1], 0)]);
  UI.figure(two, { title: ['Biomasa aérea por especie', 'Aboveground biomass by species'], svg: Plot.bars({ cats: top.map(x => x[0]), series: [{ label: 'Mg/ha', values: top.map(x => x[1]), color: 'var(--musgo)' }], ylab: T('Biomasa aérea (Mg/ha)', 'Aboveground biomass (Mg/ha)'), name: 'b4-biomasa-especies', w: 600, h: 360 }), key: 'b4-sp' });
  /* AGB against D by equation */
  const eqs = [...new Set(live.filter(t => isFinite(t.agb) && t.agb > 0).map(t => t.eq.id))];
  const ser = eqs.map((id, k) => { const a = live.filter(t => t.eq.id === id && t.agb > 0); return { type: 'points', x: a.map(t => t.D), y: a.map(t => t.agb), color: Plot.color(k), label: eqName(eqById(id)), r: 2.8 }; });
  UI.figure(R.res, { title: ['Biomasa de cada árbol según su ecuación', 'Biomass of each tree by its equation'], svg: Plot.xy({ series: ser, xlog: true, ylog: true, xlab: T('DAP (cm, escala log)', 'DBH (cm, log scale)'), ylab: T('Biomasa aérea (kg, escala log)', 'Aboveground biomass (kg, log scale)'), name: 'b4-biomasa-arbol', w: 680, h: 400, legend: 'bottom' }), key: 'b4-trees' });
  UI.table(R.res, { title: ['Por parcela', 'By plot'], file: 'forestpro_biomasa_parcelas', columns: [
    { key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'stratum', label: ['Estrato', 'Stratum'] }, { key: 'agb', label: ['Aérea (Mg/ha)', 'Aboveground (Mg/ha)'], num: true, fmt: n1 },
    { key: 'bgb', label: ['Raíces (Mg/ha)', 'Roots (Mg/ha)'], num: true, fmt: n1 }, { key: 'rs', label: ['Raíz/tallo', 'Root:shoot'], num: true, fmt: n2 },
    { key: 'c', label: ['Carbono (Mg C/ha)', 'Carbon (Mg C/ha)'], num: true, fmt: n1 }, { key: 'co2', label: ['CO₂e (Mg/ha)'], num: true, fmt: n1 }, { key: 'dead', label: ['Muertos en pie (Mg/ha)', 'Standing dead (Mg/ha)'], num: true, fmt: n2 }], rows: plots });
  UI.table(R.res, { title: ['Árbol por árbol', 'Tree by tree'], file: 'forestpro_biomasa_arboles', limit: 40, columns: [
    { key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'sp', label: ['Especie', 'Species'] }, { key: 'D', label: ['DAP (cm)', 'DBH (cm)'], num: true, fmt: n1 },
    { key: 'H', label: ['Altura (m)', 'Height (m)'], num: true, fmt: n1 }, { key: 'rho', label: ['ρ (g/cm³)'], num: true, fmt: n3 },
    { key: 'eq', label: ['Ecuación', 'Equation'], get: r => eqName(r.eq), raw: r => r.eq.id }, { key: 'agb', label: ['AGB (kg)'], num: true, fmt: n1 },
    { key: 'ef', label: ['Factor de expansión', 'Expansion factor'], num: true, fmt: n1 }, { key: 'alive', label: ['Vivo', 'Alive'], get: r => r.alive ? '✓' : '—' }], rows: trees });
  const topSp = sp[0];
  UI.interp(R.res, [
    `El predio guarda ${n1(eC.mean)} ± ${n1(eC.half)} Mg C/ha (${n1(eCO.mean)} Mg CO₂e/ha) en sus árboles vivos, con raíces. ${topSp ? `<i>${esc(topSp[0])}</i> aporta el ${fmtNum(100 * topSp[1] / eA.mean, 0)} % de la biomasa aérea. ` : ''}El intervalo solo refleja el muestreo; el Monte Carlo de abajo agrega el de las mediciones y las ecuaciones.` + (out.length ? ` ${out.length} árboles quedan fuera del intervalo de diámetros de su ecuación: revisa si conviene otra.` : ''),
    `The property holds ${n1(eC.mean)} ± ${n1(eC.half)} Mg C/ha (${n1(eCO.mean)} Mg CO₂e/ha) in its live trees, with roots. ${topSp ? `<i>${esc(topSp[0])}</i> contributes ${fmtNum(100 * topSp[1] / eA.mean, 0)} % of the aboveground biomass. ` : ''}The interval reflects sampling only; the Monte Carlo below adds that of measurements and equations.` + (out.length ? ` ${out.length} trees fall outside the diameter range of their equation: check whether another one suits better.` : '')]);
}

/* ---------------- Monte Carlo ---------------- */
async function runMC() {
  if (!S.res) { clearMessages(R.mc); showMessage(R.mc, 'info', L2('Primero calcula la biomasa del inventario.', 'First compute the biomass of the inventory.')); return; }
  const n = +el('b4n').value, de = el('b4dErr').value;
  const dErr = de === 'chave2004' ? 'chave2004' : de === 'none' ? null : { cv: de === 'cv1' ? 1 : 2 };
  const hCv = +el('b4hCv').value || 0, hCvE = +el('b4hCvEst').value || 0;
  const trees = S.res.trees.filter(t => t.alive && isFinite(t.agb) && t.agb > 0).map(t => ({ plot: t.plot, ef: t.ef, D: t.D, H: t.H, rho: t.eq.needs.includes('rho') ? t.rho : NaN, rhoSd: t.rhoSd, eq: t.eq, E: +el('b4E').value || 0, hEst: t.hEst }));
  await runWork(T('Propagando la incertidumbre…', 'Propagating the uncertainty…'), async () => { S.mc = mcWithHeights(trees, n, dErr, hCv, hCvE); });
  drawMC();
}
/* the engine perturbs H with one CV; heights estimated from a curve get a larger one, so the trees are
   run in two passes with the same seed sequence and their plot sums added */
function mcWithHeights(trees, n, dErr, hCv, hCvE) {
  const a = trees.filter(t => !t.hEst), b = trees.filter(t => t.hEst);
  const resid = el('b4resid').checked;
  const A = a.length ? BM().monteCarlo(a, { n, seed: 20261004, dErr, hCv, resid }) : null;
  const Bb = b.length ? BM().monteCarlo(b, { n, seed: 20261005, dErr, hCv: hCvE, resid }) : null;
  const plots = S.res.plots.map(p => p.plot);
  const per = plots.map(p => {
    const x = A && A.per.find(q => q.plot === p), y = Bb && Bb.per.find(q => q.plot === p);
    const d = new Float64Array(n);
    for (let i = 0; i < n; i++) d[i] = (x ? x.draws[i] : 0) + (y ? y.draws[i] : 0);
    return { plot: p, draws: d, mean: Num.mean(d), sd: Num.sd(d), lo: Num.quantile(d, 0.025), hi: Num.quantile(d, 0.975) };
  });
  const stand = new Float64Array(n);
  for (let i = 0; i < n; i++) { let s = 0; per.forEach(p => { s += p.draws[i]; }); stand[i] = s / per.length; }
  return { per, stand, standMean: Num.mean(stand), standSd: Num.sd(stand), standLo: Num.quantile(stand, 0.025), standHi: Num.quantile(stand, 0.975), n };
}
function drawMC() {
  R.mc.innerHTML = '';
  const m = S.mc, eA = S.est.agb;
  const det = Num.mean(S.res.plots.map(p => p.agb));
  const halfMC = (m.standHi - m.standLo) / 2, halfS = eA.half;
  const comb = Math.sqrt(halfMC * halfMC + halfS * halfS);
  const tiles = mk('div'); R.mc.appendChild(tiles);
  UI.tiles(tiles, [
    [['Biomasa aérea (Monte Carlo)', 'Aboveground biomass (Monte Carlo)'], n1(m.standMean) + ' Mg/ha', [n1(m.standLo) + ' – ' + n1(m.standHi) + ' (95 %)', n1(m.standLo) + ' – ' + n1(m.standHi) + ' (95 %)']],
    [['Mediciones y ecuación', 'Measurements and equation'], '± ' + n1(halfMC) + ' Mg/ha', [fmtPct(100 * halfMC / m.standMean, 1), fmtPct(100 * halfMC / m.standMean, 1)]],
    [['Muestreo', 'Sampling'], '± ' + n1(halfS) + ' Mg/ha', [fmtPct(100 * halfS / eA.mean, 1), fmtPct(100 * halfS / eA.mean, 1)]],
    [['Total combinada', 'Combined total'], '± ' + n1(comb) + ' Mg/ha', [fmtPct(100 * comb / eA.mean, 1), fmtPct(100 * comb / eA.mean, 1)], comb / eA.mean < 0.1 ? 'ok' : comb / eA.mean < 0.2 ? 'warn' : 'bad'],
  ]);
  const cl = Invent.classes(Array.from(m.stand), Plot.ticks(Num.range(m.stand)[0], Num.range(m.stand)[1], 24).step);
  UI.figure(R.mc, { title: ['Distribución de la biomasa aérea media del predio', 'Distribution of the mean aboveground biomass of the property'], svg: Plot.bars({ edges: cl.edges, series: [{ label: T('Iteraciones', 'Iterations'), values: cl.counts, color: 'var(--musgo)' }], curves: [{ x: [m.standLo, m.standLo], y: [0, Math.max(...cl.counts)], color: 'var(--accent)', dash: '5 4', label: T('Intervalo del 95 %', '95 % interval') }, { x: [m.standHi, m.standHi], y: [0, Math.max(...cl.counts)], color: 'var(--accent)', dash: '5 4' }, { x: [det, det], y: [0, Math.max(...cl.counts)], color: 'var(--fig-ink)', label: T('Cálculo directo', 'Direct computation') }], xlab: 'Mg/ha', ylab: T('Iteraciones', 'Iterations'), name: 'b4-monte-carlo', w: 640, h: 340 }), key: 'b4-mc' });
  UI.table(R.mc, { title: ['Por parcela (Monte Carlo)', 'By plot (Monte Carlo)'], file: 'forestpro_monte_carlo', columns: [
    { key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'det', label: ['Directo (Mg/ha)', 'Direct (Mg/ha)'], num: true, fmt: n1 }, { key: 'mean', label: ['Media MC (Mg/ha)', 'MC mean (Mg/ha)'], num: true, fmt: n1 },
    { key: 'sd', label: ['DE', 'SD'], num: true, fmt: n2 }, { key: 'lo', label: ['2.5 %'], num: true, fmt: n1 }, { key: 'hi', label: ['97.5 %'], num: true, fmt: n1 }, { key: 'cv', label: ['CV (%)'], num: true, fmt: n1 }],
    rows: m.per.map(p => Object.assign({}, p, { det: (S.res.plots.find(q => q.plot === p.plot) || {}).agb, cv: 100 * p.sd / p.mean })) });
  UI.interp(R.mc, [`Con ${m.n} iteraciones, las mediciones y las ecuaciones aportan ±${fmtNum(100 * halfMC / m.standMean, 1)} % a la biomasa media y el muestreo ±${fmtNum(100 * halfS / eA.mean, 1)} %. ${halfS > halfMC ? 'El muestreo domina: más parcelas reducirían el error más que mejores mediciones.' : 'Las mediciones y las ecuaciones dominan: una ecuación local o mejores alturas reducirían el error más que más parcelas.'} La media de Monte Carlo difiere ${fmtNum(100 * Math.abs(m.standMean / det - 1), 1)} % del cálculo directo: el error residual se sortea con media uno y solo la curvatura de la ecuación y los límites de los errores la mueven.`,
    `With ${m.n} iterations, measurements and equations contribute ±${fmtNum(100 * halfMC / m.standMean, 1)} % to the mean biomass and sampling ±${fmtNum(100 * halfS / eA.mean, 1)} %. ${halfS > halfMC ? 'Sampling dominates: more plots would cut the error more than better measurements.' : 'Measurements and equations dominate: a local equation or better heights would cut the error more than more plots.'} The Monte Carlo mean differs by ${fmtNum(100 * Math.abs(m.standMean / det - 1), 1)} % from the direct computation: the residual error is drawn with mean one and only the curvature of the equation and the bounds of the errors move it.`]);
  state.biomass = Object.assign(state.biomass || {}, { mc: { mean: m.standMean, lo: m.standLo, hi: m.standHi, halfMC, halfS, comb } });
}

/* ---------------- other pools ---------------- */
function drawCWD() {
  R.cwd.innerHTML = '';
  const dens = { 1: +el('b4d1').value, 2: +el('b4d2').value, 3: +el('b4d3').value, default: +el('b4d2').value };
  const tr = new Map();
  S.cwd.forEach(r => { if (!tr.has(r.transecto)) tr.set(r.transecto, { transect: r.transecto, L: r.longitud_m }); });
  const res = BM().lineIntersect(S.cwd.map(r => ({ transect: r.transecto, d: r.diametro_cm, cls: isFinite(r.clase) ? r.clase : 2 })), [...tr.values()], dens);
  const e = Invent.srs(res.map(r => r.M), { conf: 0.95 });
  S.cwdEst = e;
  UI.tiles(R.cwd.appendChild(mk('div')), [
    [['Volumen de madera caída', 'Volume of downed wood'], n1(Num.mean(res.map(r => r.V))) + ' m³/ha'],
    [['Masa', 'Mass'], n1(e.mean) + ' Mg/ha', ['± ' + n1(e.half) + ' (' + fmtNum(e.errPct, 0) + ' %)', '± ' + n1(e.half) + ' (' + fmtNum(e.errPct, 0) + ' %)']],
    [['Carbono', 'Carbon'], n1(e.mean * (+el('b4cf').value || 0.47)) + ' Mg C/ha'],
  ]);
  UI.table(R.cwd, { title: ['Por transecto', 'By transect'], file: 'forestpro_madera_caida', columns: [
    { key: 'transect', label: ['Transecto', 'Transect'] }, { key: 'L', label: ['Longitud (m)', 'Length (m)'], num: true, fmt: n0 }, { key: 'pieces', label: ['Piezas', 'Pieces'], num: true },
    { key: 'V', label: ['V (m³/ha)'], num: true, fmt: n1 }, { key: 'M', label: ['Masa (Mg/ha)', 'Mass (Mg/ha)'], num: true, fmt: n1 }], rows: res });
  drawPools();
}
function drawLitter() {
  R.lit.innerHTML = '';
  const v = S.lit.map(r => ({ plot: r.parcela, m: BM().litter(r.peso_seco_g, r.marco_m2) }));
  const e = Invent.srs(v.map(r => r.m), { conf: 0.95 });
  S.litEst = e; S.litRows = v;
  UI.tiles(R.lit.appendChild(mk('div')), [
    [['Hojarasca', 'Litter'], n2(e.mean) + ' Mg/ha', ['± ' + n2(e.half) + ' (' + fmtNum(e.errPct, 0) + ' %)', '± ' + n2(e.half) + ' (' + fmtNum(e.errPct, 0) + ' %)']],
    [['Carbono', 'Carbon'], n2(e.mean * (+el('b4cf').value || 0.47)) + ' Mg C/ha'],
  ]);
  drawPools();
}
/* the depths of each layer: given, from a layer written «0-10», or piled up from the thicknesses of each profile
   (the layer format of SoilPro: system, year, replicate, layer, thickness, SOC, BD, coarse fragments) */
function soilLayers(rows) {
  const acc = new Map();
  return rows.map(r => {
    const o = Object.assign({}, r);
    const prof = [r.grupo, r.anio, r.parcela].join('|');
    let m;
    if (!(isFinite(o.prof_sup) && isFinite(o.prof_inf))) {
      if (r.capa && (m = /(\d+(?:[.,]\d+)?)\s*[-–a]\s*(\d+(?:[.,]\d+)?)/.exec(String(r.capa)))) { o.prof_sup = +m[1].replace(',', '.'); o.prof_inf = +m[2].replace(',', '.'); }
      else if (r.espesor_cm > 0) { const t = acc.get(prof) || 0; o.prof_sup = t; o.prof_inf = t + r.espesor_cm; }
    }
    if (isFinite(o.prof_inf)) acc.set(prof, Math.max(acc.get(prof) || 0, o.prof_inf));
    return o;
  }).filter(o => isFinite(o.prof_sup) && isFinite(o.prof_inf) && o.prof_inf > o.prof_sup);
}
function drawSoil() {
  R.soil.innerHTML = '';
  if (!S.soil.length) { showMessage(R.soil, 'warning', L2('Ninguna capa tiene profundidades: hacen falta las profundidades superior e inferior, la capa escrita como «0-10» o el espesor.', 'No layer has depths: the upper and lower depths, the layer written as “0-10” or the thickness are needed.')); return; }
  /* several systems or years (as SoilPro exports them): one at a time */
  const gkey = r => [r.grupo, r.anio].filter(v => v != null && v !== '').join(' · ');
  const groups = [...new Set(S.soil.map(gkey))];
  let src = S.soil;
  if (groups.length > 1) {
    if (!groups.includes(S.soilGroup)) S.soilGroup = groups[0];
    const f = mk('div', { class: 'field', style: 'max-width:360px' });
    f.innerHTML = `<label for="b4sgrp">${L2('Sistema o grupo', 'System or group')}</label><select id="b4sgrp">${groups.map(g => `<option${g === S.soilGroup ? ' selected' : ''}>${esc(g)}</option>`).join('')}</select>`;
    R.soil.appendChild(f);
    f.querySelector('select').addEventListener('change', ev => { S.soilGroup = ev.target.value; drawSoil(); });
    src = S.soil.filter(r => gkey(r) === S.soilGroup);
  }
  const by = new Map();
  src.forEach(r => { const k = String(r.parcela); by.set(k, (by.get(k) || 0) + BM().socLayer(r.co_pct, r.dap_g_cm3, r.prof_sup, r.prof_inf, isFinite(r.pedregosidad_pct) ? r.pedregosidad_pct : 0)); });
  const rows = [...by.entries()].map(([plot, c]) => ({ plot, c }));
  const depth = Math.max(...src.map(r => r.prof_inf));
  const e = Invent.srs(rows.map(r => r.c), { conf: 0.95 });
  S.soilEst = e; S.soilRows = rows;
  UI.tiles(R.soil.appendChild(mk('div')), [
    [['Carbono orgánico del suelo', 'Soil organic carbon'], n1(e.mean) + ' Mg C/ha', ['0–' + depth + ' cm · ± ' + n1(e.half), '0–' + depth + ' cm · ± ' + n1(e.half)]],
    [['Perfiles', 'Profiles'], String(rows.length)],
  ]);
  UI.table(R.soil, { title: ['Por perfil', 'By profile'], file: 'forestpro_carbono_suelo', columns: [{ key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'c', label: ['Mg C/ha'], num: true, fmt: n1 }], rows, limit: 30 });
  drawPools();
}
/* where the data of a card come from: an example (its id names the site) or a file / typed table (no id) */
const srcOf = meta => ({ example: meta && meta.example ? meta.example : null, name: meta && meta.name ? meta.name : '' });
function drawPools() {
  if (!R.pools) return;
  R.pools.innerHTML = '';
  const cf = +el('b4cf').value || 0.47;
  /* the site of the balance: that of the inventory, or of the first pool loaded when there is none */
  const ref = S.est ? { example: state.inv.example || null, name: state.inv.name || '' } : [S.cwd && S.cwdSrc, S.lit && S.litSrc, S.soil && S.soilSrc].find(Boolean) || null;
  const invPlots = S.est ? S.res.plots.map(p => String(p.plot)) : [];
  const covers = rows => { if (!invPlots.length || !rows) return false; const m = new Set(rows.map(r => String(r.plot))); return invPlots.every(p => m.has(p)); };
  const same = src => !ref || (src && src.example) === ref.example;
  const excluded = [];
  /* pools on the plots of the inventory (summed plot by plot) and pools from another sample (independent) */
  const pools = [];
  const byPlot = [];
  if (S.est) {
    byPlot.push({ k: ['Árboles vivos: aérea', 'Live trees: aboveground'], c: 'var(--bosque)', v: p => p.agb * cf });
    byPlot.push({ k: ['Árboles vivos: raíces', 'Live trees: roots'], c: 'var(--corteza)', v: p => p.bgb * cf });
    if (S.res.plots.some(p => p.cDead > 0)) byPlot.push({ k: ['Muertos en pie', 'Standing dead'], c: '#9AA39A', v: p => p.cDead });
  }
  const plotPool = (est, rows, src, k, c, scale) => {
    if (!est) return;
    if (covers(rows)) { const mp = new Map(rows.map(r => [String(r.plot), r.val])); byPlot.push({ k, c, v: p => mp.get(String(p.plot)) * scale }); return; }
    if (!same(src)) { excluded.push([k, src]); return; }
    pools.push({ k, m: est.mean * scale, se: est.se * scale, c, indep: true });
  };
  if (S.cwdEst) { if (same(S.cwdSrc)) pools.push({ k: ['Madera caída', 'Downed wood'], m: S.cwdEst.mean * cf, se: S.cwdEst.se * cf, c: '#B5652B', indep: true }); else excluded.push([['Madera caída', 'Downed wood'], S.cwdSrc]); }
  plotPool(S.litEst, S.litRows && S.litRows.map(r => ({ plot: r.plot, val: r.m })), S.litSrc, ['Hojarasca', 'Litter'], '#C2A83E', cf);
  const sh = +el('b4shrub').value || 0;
  if (sh > 0) pools.push({ k: ['Arbustos y otros', 'Shrubs and others'], m: sh, se: +el('b4shrubSe').value || 0, c: 'var(--musgo)', indep: true });
  plotPool(S.soilEst, S.soilRows && S.soilRows.map(r => ({ plot: r.plot, val: r.c })), S.soilSrc, ['Suelo', 'Soil'], '#6D4C2F', 1);
  if (excluded.length) showMessage(R.pools, 'warning', L2(
    `No entran en el balance porque vienen de otro sitio que ${S.est ? 'el inventario' : 'el primer reservorio cargado'} (${esc(ref.name)}): ${excluded.map(([k, s]) => `${k[0].toLowerCase()} (${esc(s.name)})`).join('; ')}. Carga en esa tarjeta los datos del mismo sitio.`,
    `Left out of the balance because they come from a site other than ${S.est ? 'the inventory' : 'the first pool loaded'} (${esc(ref.name)}): ${excluded.map(([k, s]) => `${k[1].toLowerCase()} (${esc(s.name)})`).join('; ')}. Load the data of the same site in that card.`));
  /* the pools on the plots: each one with the estimator of the inventory, and their plot-by-plot sum */
  let eSum = null;
  if (byPlot.length) {
    const plots = S.res.plots.map(p => { const o = Object.assign({}, p); byPlot.forEach((b, j) => { o['_p' + j] = b.v(p); }); o._sum = byPlot.reduce((s, b, j) => s + o['_p' + j], 0); return o; });
    byPlot.forEach((b, j) => { const e = estimateOf(plots, '_p' + j); pools.push({ k: b.k, m: e.mean, se: e.se, c: b.c, indep: false }); });
    eSum = estimateOf(plots, '_sum');
  }
  if (!pools.length) { R.pools.appendChild(mk('p', { class: 'hint' }, L2('Calcula la biomasa o carga algún reservorio para ver el resumen.', 'Compute the biomass or load a pool to see the summary.'))); return; }
  /* the order of the figure and the table: trees, dead wood, litter, shrubs, soil */
  const ORDER = ['Árboles vivos: aérea', 'Árboles vivos: raíces', 'Muertos en pie', 'Madera caída', 'Hojarasca', 'Arbustos y otros', 'Suelo'];
  pools.sort((a, b) => ORDER.indexOf(a.k[0]) - ORDER.indexOf(b.k[0]));
  const ind = pools.filter(p => p.indep);
  const comb = BM().combinePools(eSum ? { mean: eSum.mean, se: eSum.se } : null, ind.map(p => ({ mean: p.m, se: p.se })));
  const tot = comb.mean, seT = comb.se;
  const seNaive = Math.sqrt(pools.reduce((s, p) => s + p.se * p.se, 0));
  const how = p => p.indep ? T('independiente', 'independent') : T('suma por parcela', 'summed by plot');
  const rows = pools.map(p => ({ k: T(p.k[0], p.k[1]), m: p.m, se: p.se, lo: p.m - 1.96 * p.se, hi: p.m + 1.96 * p.se, pct: 100 * p.m / tot, co2: p.m * BM().CO2, how: how(p) }));
  rows.push({ k: T('Total', 'Total'), m: tot, se: seT, lo: tot - 1.96 * seT, hi: tot + 1.96 * seT, pct: 100, co2: tot * BM().CO2, how: '', _class: 'row-total' });
  UI.tiles(R.pools.appendChild(mk('div')), [[['Carbono total del sistema', 'Total carbon of the system'], n1(tot) + ' Mg C/ha', ['± ' + n1(1.96 * seT) + ' · ' + n1(tot * BM().CO2) + ' Mg CO₂e/ha', '± ' + n1(1.96 * seT) + ' · ' + n1(tot * BM().CO2) + ' Mg CO₂e/ha']]]);
  UI.figure(R.pools, { title: ['Carbono por reservorio', 'Carbon by pool'], svg: Plot.bars({ cats: [T('Sistema', 'System')], stacked: true, series: pools.map(p => ({ label: T(p.k[0], p.k[1]), values: [p.m], color: p.c })), legendAlways: true, ylab: 'Mg C/ha', name: 'b4-reservorios', w: 520, h: 360 }), key: 'b4-pools' });
  UI.table(R.pools, { title: ['Reservorios de carbono', 'Carbon pools'], file: 'forestpro_reservorios', columns: [
    { key: 'k', label: ['Reservorio', 'Pool'] }, { key: 'm', label: ['Mg C/ha'], num: true, fmt: n1 }, { key: 'se', label: ['Error estándar', 'Std. error'], num: true, fmt: n2 },
    { key: 'lo', label: ['Inferior 95 %', 'Lower 95 %'], num: true, fmt: n1 }, { key: 'hi', label: ['Superior 95 %', 'Upper 95 %'], num: true, fmt: n1 }, { key: 'pct', label: ['% del total', '% of total'], num: true, fmt: n1 }, { key: 'co2', label: ['Mg CO₂e/ha'], num: true, fmt: n1 },
    { key: 'how', label: ['En el error del total', 'In the error of the total'] }], rows });
  /* short names for the sentence */
  const SHORT = { 'Árboles vivos: aérea': ['la biomasa aérea', 'aboveground biomass'], 'Árboles vivos: raíces': ['las raíces', 'roots'], 'Muertos en pie': ['los muertos en pie', 'standing dead'], 'Madera caída': ['la madera caída', 'downed wood'], 'Hojarasca': ['la hojarasca', 'litter'], 'Arbustos y otros': ['los arbustos', 'shrubs'], 'Suelo': ['el suelo', 'soil'] };
  const sn = (p, j) => (SHORT[p.k[0]] || p.k)[j];
  const byP = pools.filter(p => !p.indep), list = (a, y) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + y + ' ' + a[a.length - 1];
  const bE = byP.map(p => sn(p, 0)), bN = byP.map(p => sn(p, 1)), iE = ind.map(p => sn(p, 0)), iN = ind.map(p => sn(p, 1));
  const nPl = S.res ? S.res.plots.length : 0;
  UI.interp(R.pools, [
    (bE.length ? `El error del total suma ${list(bE, 'y')} parcela por parcela (${nPl} parcelas)` : 'El error del total') + (iE.length ? `${bE.length ? ' y agrega en cuadratura' : ' combina en cuadratura'} ${list(iE, 'y')}, que ${iE.length > 1 ? 'vienen' : 'viene'} de otra muestra` : '') + `: ±${n1(1.96 * seT)} Mg C/ha.` + (bE.length > 1 ? ` Sumar en cuadratura los reservorios de las mismas parcelas, como si fueran independientes, daría ±${n1(1.96 * seNaive)}.` : ''),
    (bN.length ? `The error of the total adds ${list(bN, 'and')} plot by plot (${nPl} plots)` : 'The error of the total') + (iN.length ? `${bN.length ? ' and adds in quadrature' : ' combines in quadrature'} ${list(iN, 'and')}, which ${iN.length > 1 ? 'come' : 'comes'} from another sample` : '') + `: ±${n1(1.96 * seT)} Mg C/ha.` + (bN.length > 1 ? ` Adding the pools of the same plots in quadrature, as if they were independent, would give ±${n1(1.96 * seNaive)}.` : '')]);
  state.biomass = Object.assign(state.biomass || {}, { pools: rows.map(r => ({ k: r.k, m: r.m, se: r.se })), total: tot, seTotal: seT });
}
function drawChange() {
  R.chg.innerHTML = '';
  const rows = S.chg, paired = el('b4paired').checked;
  const yrs = rows.every(r => isFinite(r.edad1) && isFinite(r.edad2)) ? Num.mean(rows.map(r => r.edad2 - r.edad1)) : +el('b4years').value;
  const r = paired ? BM().change({ paired: true, pairs: rows.map(x => ({ plot: x.parcela, c1: x.c1, c2: x.c2 })), years: yrs }) : BM().change({ a: rows.map(x => x.c1), b: rows.map(x => x.c2), years: yrs });
  UI.tiles(R.chg.appendChild(mk('div')), [
    [['Cambio medio', 'Mean change'], (r.mean >= 0 ? '+' : '') + n2(r.mean) + ' Mg C/ha', [n2(r.lo) + ' a ' + n2(r.hi) + ' (95 %)', n2(r.lo) + ' to ' + n2(r.hi) + ' (95 %)'], r.lo > 0 ? 'ok' : r.hi < 0 ? 'bad' : 'warn'],
    [['Tasa anual', 'Annual rate'], (r.rate >= 0 ? '+' : '') + n2(r.rate) + T(' Mg C/ha/año', ' Mg C/ha/yr'), [n2(r.rateLo) + ' a ' + n2(r.rateHi) + ' · ' + n2(r.rate * BM().CO2) + ' Mg CO₂e/ha/año', n2(r.rateLo) + ' to ' + n2(r.rateHi) + ' · ' + n2(r.rate * BM().CO2) + ' Mg CO₂e/ha/yr']],
    [['Prueba', 'Test'], 'p ' + (r.p < 0.001 ? '< 0.001' : '= ' + fmtNum(r.p, 3)), [paired ? `t pareada, ${r.df} gl` : `Welch, ${fmtNum(r.df, 1)} gl`, paired ? `paired t, ${r.df} df` : `Welch, ${fmtNum(r.df, 1)} df`]],
  ]);
  const ser = [{ type: 'segments', segs: rows.map(x => [1, x.c1, 2, x.c2]), color: 'var(--fig-muted)', width: 1 }, { type: 'points', x: rows.map(() => 1), y: rows.map(x => x.c1), color: 'var(--accent)' }, { type: 'points', x: rows.map(() => 2), y: rows.map(x => x.c2), color: 'var(--primary)' }];
  UI.figure(R.chg, { title: ['Carbono de cada parcela en las dos mediciones', 'Carbon of each plot at the two measurements'], svg: Plot.xy({ series: ser, xlim: [0.6, 2.4], xtickVals: [1, 2], xLabels: v => Math.abs(v - 1) < 0.01 ? T('Medición 1', 'Measurement 1') : Math.abs(v - 2) < 0.01 ? T('Medición 2', 'Measurement 2') : '', ylab: 'Mg C/ha', name: 'b4-cambio', w: 460, h: 360, legend: false }), key: 'b4-change' });
  UI.interp(R.chg, [`En ${fmtNum(yrs, 1)} años el carbono ${r.mean >= 0 ? 'aumentó' : 'disminuyó'} ${n2(Math.abs(r.mean))} Mg C/ha (${n2(Math.abs(r.rate))} Mg C/ha por año); ${r.lo > 0 || r.hi < 0 ? 'el intervalo del 95 % no incluye el cero: el cambio es distinguible del error de muestreo.' : 'el intervalo del 95 % incluye el cero: con estas parcelas el cambio no se distingue del error de muestreo.'}${paired ? ' Medir las mismas parcelas quita de la varianza las diferencias permanentes entre ellas.' : ''}`,
    `In ${fmtNum(yrs, 1)} years carbon ${r.mean >= 0 ? 'rose' : 'fell'} by ${n2(Math.abs(r.mean))} Mg C/ha (${n2(Math.abs(r.rate))} Mg C/ha per year); ${r.lo > 0 || r.hi < 0 ? 'the 95 % interval excludes zero: the change stands out from the sampling error.' : 'the 95 % interval includes zero: with these plots the change cannot be told from the sampling error.'}${paired ? ' Remeasuring the same plots removes the permanent differences between them from the variance.' : ''}`]);
  state.biomass = Object.assign(state.biomass || {}, { change: { mean: r.mean, rate: r.rate, lo: r.lo, hi: r.hi } });
  Report.set(4, true); refreshStepMarks();
}

ExampleHooks['cafetal:4'] = () => { build(); loadExample('cafetal'); };
ExampleHooks['mesofilo:4'] = () => { build(); loadExample('mesofilo'); };
ExampleHooks['referencias:4'] = () => { build(); const d = document.querySelector('#panel-4 .grid-wrap'); if (d) d.scrollIntoView(); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('inventorychange', () => { if (S.pendingCompute) { S.pendingCompute = false; compute(); } else if (S.res) compute(); });
document.addEventListener('langchange', () => {
  if (!el('b4root')) return;
  /* before the grid redraws itself: the levels of the rows that came with the app, in the new language */
  if (S.dens) { const L = I18N.lang, M = FPData.EN.nivel; S.dens.forEach(r => { if (!r.exLevel) return; const es = Object.keys(M).find(k => k === r.nivel || M[k] === r.nivel); if (es) r.nivel = L === 'en' ? M[es] : es; }); }
  fillEqSelect(el('b4def'), el('b4def').value);
  drawRules(); drawCatalog();
  if (S.res) { drawDensityTable(S.res.trees); drawResults(); }
  if (S.mc) drawMC();
  if (S.cwd) drawCWD(); if (S.lit) drawLitter(); if (S.soil) drawSoil();
  drawPools();
  if (S.chg) drawChange();
});
})();
