/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 7: agroforestry systems (shaded coffee and others). */
(function () {
'use strict';
const S = { photo: null, sy: null };
const R = {};
const AG = () => window.Agro;
const n0 = v => fmtNum(v, 0), n1 = v => fmtNum(v, 1), n2 = v => fmtNum(v, 2);
const SHADE_RULES = [['Inga', 'segura06_inga'], ['Cordia alliodora', 'segura06_cordia'], ['Musa', 'vnoord02_musa']];

function build() {
  const root = el('b7root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Pensado para cafetales y otros cultivos bajo sombra: cuánta sombra hay (contando árboles o con una foto del dosel), cómo se relaciona con el rendimiento, cómo arreglar la plantación y cuánto carbono guarda el sistema frente a un monocultivo.',
    'Designed for coffee and other shaded crops: how much shade there is (counting trees or with a photo of the canopy), how it relates to yield, how to lay out the planting and how much carbon the system holds against a monoculture.')));

  /* A */
  const a = UI.section(root, ['Sombra a partir del inventario', 'Shade from the inventory'], ['Densidad, área basal, cobertura de copas y complejidad de la sombra en cada parcela, y su resumen por tipo de manejo.', 'Density, basal area, crown cover and complexity of the shade in each plot, and their summary by management type.']);
  const ab = mk('div', { class: 'btn-row' });
  const exA = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cargar el cafetal de ejemplo', 'Load the example coffee farm'));
  exA.addEventListener('click', () => { ExampleHooks['cafetal:3'](); setTimeout(() => { goStep(7); drawShade(); }, 80); });
  const invA = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Usar el inventario del Bloque 3', 'Use the Block 3 inventory'));
  invA.addEventListener('click', drawShade);
  ab.append(exA, invA);
  a.appendChild(ab);
  R.shade = mk('div', { class: 'res-host' }); a.appendChild(R.shade);
  UI.method(a, { text: [
    '<p>Por parcela: árboles de sombra por hectárea, área basal, riqueza de especies de sombra y altura media. <b>Cobertura de copas:</b> la suma de las áreas de copa (π·c²/4) entre la superficie de la parcela, que puede pasar de 100 % porque las copas se enciman, y la cobertura corregida por traslape aleatorio, C = 1 − exp(−Σa/A), que estima la fracción del suelo bajo al menos una copa. <b>Índice de complejidad de Holdridge:</b> IC = especies × árboles × área basal (m²) × altura media (m) / 1000, con árboles y área basal llevados a 0.1 ha.</p>',
    '<p>Per plot: shade trees per hectare, basal area, richness of shade species and mean height. <b>Crown cover:</b> the sum of crown areas (π·c²/4) over the area of the plot, which can exceed 100 % because crowns overlap, and the cover corrected for random overlap, C = 1 − exp(−Σa/A), which estimates the share of the ground under at least one crown. <b>Holdridge complexity index:</b> CI = species × trees × basal area (m²) × mean height (m) / 1000, with trees and basal area scaled to 0.1 ha.</p>'],
    refs: ['Crookston, N. L. y Stage, A. R. (1999). <i>Percent Canopy Cover and Stand Structure Statistics from the Forest Vegetation Simulator</i>. USDA Forest Service, GTR RMRS-24.', 'Holdridge, L. R., Grenke, W. C., Hatheway, W. H., Liang, T. y Tosi, J. A. (1971). <i>Forest Environments in Tropical Life Zones: a Pilot Study</i>. Pergamon.', 'Moguel, P. y Toledo, V. M. (1999). Biodiversity conservation in traditional coffee systems of Mexico. <i>Conservation Biology</i> 13:11–21.'] });

  /* B */
  const b = UI.section(root, ['Sombra a partir de una fotografía del dosel', 'Shade from a photograph of the canopy'], ['Una foto hemisférica (con lente de ojo de pez, desde abajo y hacia el cenit) o una foto normal hacia arriba. La app separa cielo y follaje y mide la apertura del dosel.', 'A hemispherical photo (with a fisheye lens, from below towards the zenith) or an ordinary upward photo. The app separates sky and foliage and measures canopy openness.']);
  const bf = mk('div', { class: 'src-row' });
  bf.innerHTML = `<input type="file" id="b7img" class="sr-only" accept="image/*"><label class="btn btn-secondary btn-sm" for="b7img" tabindex="0" role="button">${L2('Abrir una foto…', 'Open a photo…')}</label>`;
  const exB = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Foto de ejemplo (sintética)', 'Example photo (synthetic)'));
  exB.addEventListener('click', () => { S.photo = synthPhoto(); runPhoto(); });
  bf.prepend(exB);
  b.appendChild(bf);
  el('b7img').addEventListener('change', loadPhoto);
  const bg = mk('div', { class: 'form-grid' });
  bg.innerHTML = `<div class="field"><label for="b7proj">${L2('Tipo de foto', 'Kind of photo')}</label><select id="b7proj"><option value="hemi"${optL('Hemisférica (ojo de pez)', 'Hemispherical (fisheye)')}</option><option value="normal"${optL('Normal hacia arriba', 'Ordinary upward')}</option></select></div>` +
    `<div class="field"><label for="b7ch">${L2('Canal', 'Channel')}</label><select id="b7ch"><option value="blue"${optL('Azul (recomendado)', 'Blue (recommended)')}</option><option value="luma"${optL('Luminancia', 'Luminance')}</option></select></div>` +
    `<div class="field"><label for="b7thr">${L2('Umbral (vacío = Otsu)', 'Threshold (empty = Otsu)')}</label><input type="number" id="b7thr" min="0" max="255" step="1"></div>` +
    `<div class="field"><label for="b7r">${L2('Radio del círculo (% del lado menor)', 'Circle radius (% of the short side)')}</label><input type="number" id="b7r" value="100" min="10" max="100" step="1"></div>`;
  b.appendChild(bg);
  ['b7proj', 'b7ch', 'b7thr', 'b7r'].forEach(id => el(id).addEventListener('change', () => { if (S.photo) runPhoto(); }));
  R.photo = mk('div', { class: 'res-host' }); b.appendChild(R.photo);
  UI.method(b, { text: [
    '<p>Cada píxel se reduce a un nivel de gris del canal azul (el cielo es mucho más brillante que las hojas en azul) o de la luminancia. El umbral separa cielo (por encima) y dosel; por omisión es el de Otsu, que maximiza la varianza entre las dos clases del histograma. Con la foto hemisférica solo cuenta el círculo de la lente, y en una lente equiangular el ángulo cenital es θ = 90°·ρ/R; la <b>fracción de huecos</b> cuenta cada píxel igual y la <b>apertura del dosel</b> pesa cada píxel por el ángulo sólido que representa (sen θ/ρ), así que el cielo cerca del horizonte pesa más. Cobertura del dosel = 1 − apertura. Toma la foto con cielo uniformemente nublado o al amanecer, sin sol directo en el cuadro.</p>',
    '<p>Each pixel becomes a grey level from the blue channel (the sky is much brighter than leaves in blue) or from luminance. The threshold separates sky (above) and canopy; by default it is Otsu\'s, which maximises the variance between the two classes of the histogram. With the hemispherical photo only the circle of the lens counts, and in an equiangular lens the zenith angle is θ = 90°·ρ/R; the <b>gap fraction</b> counts every pixel the same and the <b>canopy openness</b> weights each pixel by the solid angle it stands for (sin θ/ρ), so the sky near the horizon weighs more. Canopy cover = 1 − openness. Take the photo under an evenly overcast sky or at dawn, without direct sun in the frame.</p>'],
    refs: ['Otsu, N. (1979). A threshold selection method from gray-level histograms. <i>IEEE Trans. Syst. Man Cybern.</i> 9:62–66.', 'Jonckheere, I. et al. (2004). Review of methods for in situ leaf area index determination. Part I. <i>Agric. For. Meteorol.</i> 121:19–35.', 'Frazer, G. W., Canham, C. D. y Lertzman, K. P. (1999). <i>Gap Light Analyzer (GLA) 2.0: users manual</i>. Simon Fraser University.'] });

  /* C */
  const c = UI.section(root, ['Sombra y rendimiento del cultivo', 'Shade and crop yield'], ['La regresión del rendimiento sobre la sombra, lineal o cuadrática, y la sombra que da el rendimiento máximo con su intervalo.', 'The regression of yield on shade, linear or quadratic, and the shade that gives the maximum yield with its interval.']);
  S.cardC = UI.dataCard(c, { id: 'b7c', fields: [
    { key: 'parcela', es: 'Parcela', en: 'Plot', aliases: ['plot'] },
    { key: 'sombra', es: 'Sombra (%)', en: 'Shade (%)', num: true, req: true, aliases: ['sombra pct', 'shade', 'cobertura'] },
    { key: 'rendimiento', es: 'Rendimiento', en: 'Yield', num: true, req: true, aliases: ['rend cafe', 'yield', 'produccion'] },
    { key: 'grupo', es: 'Grupo (manejo)', en: 'Group (management)', aliases: ['manejo', 'group'] }],
    examples: [{ id: 'cafetal', es: 'Cafetal: 25 parcelas', en: 'Coffee farm: 25 plots', d: ['Sombra (%) y rendimiento de café pergamino (kg/ha) de cada parcela.', 'Shade (%) and yield of parchment coffee (kg/ha) of each plot.'], rows: () => FPData.rows('cafetal_parcelas').map(r => ({ parcela: r.parcela, sombra: r.sombra_pct, rendimiento: r.rend_cafe, grupo: r.manejo })) }],
    onData: rows => { S.sy = rows; drawSY(); } });
  R.sy = mk('div', { class: 'res-host' }); c.appendChild(R.sy);
  UI.method(c, { text: [
    '<p>Mínimos cuadrados ordinarios: rendimiento = b₀ + b₁·S (lineal) y rendimiento = b₀ + b₁·S + b₂·S² (cuadrática). La prueba F del término cuadrático y el AIC deciden el modelo. Si b₂ &lt; 0, la sombra del rendimiento máximo es S* = −b₁/(2b₂), con error estándar por el método delta: ∇S* = (−1/(2b₂), b₁/(2b₂²)) aplicado a la covarianza de (b₁, b₂). La banda es el intervalo de confianza del 95 % de la media.</p>',
    '<p>Ordinary least squares: yield = b₀ + b₁·S (linear) and yield = b₀ + b₁·S + b₂·S² (quadratic). The F test of the quadratic term and the AIC decide the model. If b₂ &lt; 0, the shade of maximum yield is S* = −b₁/(2b₂), with its standard error by the delta method: ∇S* = (−1/(2b₂), b₁/(2b₂²)) applied to the covariance of (b₁, b₂). The band is the 95 % confidence interval of the mean.</p>'],
    refs: ['Soto-Pinto, L., Perfecto, I., Castillo-Hernández, J. y Caballero-Nieto, J. (2000). Shade effect on coffee production at the northern Tzeltal zone of the state of Chiapas, Mexico. <i>Agric. Ecosyst. Environ.</i> 80:61–69.', 'Weisberg, S. (2014). <i>Applied Linear Regression</i>, 4.ª ed., sec. 7.6 (método delta). Wiley.'] });

  /* D */
  const d = UI.section(root, ['Diseño de plantación', 'Planting layout'], ['Cuántos árboles caben y cómo se acomodan en un terreno rectangular.', 'How many trees fit and how they are laid out in a rectangular field.']);
  const dg = mk('div', { class: 'form-grid' });
  dg.innerHTML = `<div class="field"><label for="b7kind">${L2('Arreglo', 'Layout')}</label><select id="b7kind">` + [['square', 'Marco real (cuadro)', 'Square'], ['tri', 'Tresbolillo (triángulo)', 'Triangular'], ['rect', 'Rectángulo', 'Rectangular'], ['alley', 'Cultivo en callejones', 'Alley cropping'], ['fence', 'Cerco vivo (perímetro)', 'Live fence (perimeter)'], ['boundary', 'Linderos (dos lados)', 'Boundary rows (two sides)']].map(([v, es, en]) => `<option value="${v}"${optL(es, en)}</option>`).join('') + `</select></div>` +
    [['b7W', 'Ancho del terreno (m)', 'Field width (m)', 100], ['b7L', 'Largo del terreno (m)', 'Field length (m)', 100], ['b7a', 'Distancia entre árboles (m)', 'Spacing between trees (m)', 6], ['b7b', 'Distancia entre hileras (m)', 'Spacing between rows (m)', 8], ['b7alley', 'Ancho del callejón (m)', 'Alley width (m)', 12],
      ['b7crop', 'Cultivo: distancia (m)', 'Crop: spacing (m)', 2], ['b7cropRow', 'Cultivo: entre hileras (m)', 'Crop: between rows (m)', 1.5], ['b7cost', 'Costo por árbol plantado', 'Cost per tree planted', 25]]
      .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('');
  d.appendChild(dg);
  ['b7kind', 'b7W', 'b7L', 'b7a', 'b7b', 'b7alley', 'b7crop', 'b7cropRow', 'b7cost'].forEach(id => el(id).addEventListener('change', drawLayout));
  R.layout = mk('div', { class: 'res-host' }); d.appendChild(R.layout);
  UI.method(d, { text: [
    '<p>Las posiciones se generan dentro del terreno dejando media distancia en los bordes. Densidad teórica de un arreglo infinito: cuadro 10 000/a²; rectángulo 10 000/(a·b); tresbolillo 10 000/(a²·√3/2), un 15.5 % más árboles que el cuadro con la misma distancia; callejones 10 000/(a·ancho). El cerco vivo pone un árbol cada a metros a lo largo del perímetro y los linderos, en los dos lados largos. El cultivo bajo los árboles se dibuja en su propio marco para ver cómo conviven.</p>',
    '<p>Positions are generated inside the field leaving half a spacing at the edges. Theoretical density of an infinite layout: square 10,000/a²; rectangle 10,000/(a·b); triangular 10,000/(a²·√3/2), 15.5 % more trees than the square at the same spacing; alleys 10,000/(a·width). The live fence puts a tree every a metres along the perimeter and the boundary rows, along the two long sides. The crop under the trees is drawn on its own grid to see how they share the field.</p>'],
    refs: ['Nair, P. K. R. (1993). <i>An Introduction to Agroforestry</i>. Kluwer.', 'Evans, J. y Turnbull, J. W. (2004). <i>Plantation Forestry in the Tropics</i>, 3.ª ed. Oxford University Press.'] });

  /* E */
  const e = UI.section(root, ['Presupuesto de carbono del sistema', 'Carbon budget of the system'], ['El carbono de los árboles de sombra, del cultivo, de la hojarasca y del suelo, frente a un monocultivo a pleno sol.', 'The carbon of the shade trees, the crop, the litter and the soil, against a full-sun monoculture.']);
  const eg = mk('div', { class: 'form-grid' });
  eg.innerHTML = [['b7dens', 'Cafetos por hectárea (sistema)', 'Coffee bushes per hectare (system)', ''], ['b7monoDens', 'Cafetos por hectárea (monocultivo)', 'Coffee bushes per hectare (monoculture)', 5000], ['b7monoSoil', 'Carbono del suelo del monocultivo (Mg C/ha)', 'Soil carbon of the monoculture (Mg C/ha)', 60], ['b7monoLit', 'Hojarasca del monocultivo (Mg/ha)', 'Litter of the monoculture (Mg/ha)', 3], ['b7cfB', 'Fracción de carbono', 'Carbon fraction', 0.47], ['b7rsC', 'Raíz/tallo del cultivo', 'Root:shoot of the crop', 0.27]]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('');
  e.appendChild(eg);
  ['b7dens', 'b7monoDens', 'b7monoSoil', 'b7monoLit', 'b7cfB', 'b7rsC'].forEach(id => el(id).addEventListener('change', drawBudget));
  const eb = mk('div', { class: 'btn-row' });
  const exE = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Calcular con el cafetal de ejemplo', 'Compute with the example coffee farm'));
  exE.addEventListener('click', () => { S.budgetEx = true; drawBudget(); });
  eb.appendChild(exE);
  e.appendChild(eb);
  R.budget = mk('div', { class: 'res-host' }); e.appendChild(R.budget);
  UI.method(e, { text: [
    '<p>Árboles de sombra: biomasa aérea con las ecuaciones de Segura et al. (2006) para <i>Inga</i> y <i>Cordia</i>, van Noordwijk et al. (2002) para el plátano y Chave et al. (2014) con la densidad de la madera para el resto; raíces con la razón del IPCC (2006) para montañas tropicales (0.27). Cafetos: Segura et al. (2006) con el diámetro a 15 cm y la altura, por la densidad de plantación. Hojarasca y suelo de las tablas del ejemplo. El monocultivo usa la biomasa media de los cafetos del ejemplo con su propia densidad y los valores de suelo y hojarasca que escribas: son supuestos para comparar, no mediciones.</p>',
    '<p>Shade trees: aboveground biomass with the equations of Segura et al. (2006) for <i>Inga</i> and <i>Cordia</i>, van Noordwijk et al. (2002) for banana and Chave et al. (2014) with wood density for the rest; roots with the IPCC (2006) ratio for tropical mountains (0.27). Coffee bushes: Segura et al. (2006) with the diameter at 15 cm and the height, times the planting density. Litter and soil from the tables of the example. The monoculture uses the mean biomass of the example bushes at its own density and the soil and litter values you type: they are assumptions for the comparison, not measurements.</p>'],
    refs: ['Segura, M., Kanninen, M. y Suárez, D. (2006). <i>Agroforestry Systems</i> 68:143–150.', 'Soto-Pinto, L., Anzueto, M., Mendoza, J., Jiménez-Ferrer, G. y de Jong, B. (2010). Carbon sequestration through agroforestry in indigenous communities of Chiapas, Mexico. <i>Agroforestry Systems</i> 78:39–51.'] });
  drawLayout();
}

/* ---------------- A ---------------- */
function drawShade() {
  R.shade.innerHTML = '';
  if (!state.inv) { showMessage(R.shade, 'info', L2('Carga un inventario en el Bloque 3 o el cafetal de ejemplo.', 'Load an inventory in Block 3 or the example coffee farm.')); return; }
  const by = new Map();
  state.inv.trees.filter(t => t.alive !== false).forEach(t => { if (!by.has(t.plot)) by.set(t.plot, []); by.get(t.plot).push({ sp: t.especie, d: t.dap, h: t.altura, crown: t.copa }); });
  const rows = state.inv.plots.map(p => {
    const area = Invent.plotArea(p.design, 1e9);
    return Object.assign({ plot: p.plot, grp: p.stratum || p.cluster || '' }, AG().shadeOfPlot(by.get(p.plot) || [], area));
  });
  if (rows.every(r => r.crownsMissing === r.n)) showMessage(R.shade, 'info', L2('El inventario no trae el diámetro de copa: la cobertura no se puede calcular (usa la fotografía).', 'The inventory has no crown diameter: cover cannot be computed (use the photograph).'));
  const groups = [...new Set(rows.map(r => r.grp).filter(Boolean))];
  const all = { N: Num.mean(rows.map(r => r.N)), G: Num.mean(rows.map(r => r.G)), cover: Num.mean(rows.map(r => r.cover)), S: Num.mean(rows.map(r => r.S)), ic: Num.mean(rows.map(r => r.ic)) };
  UI.tiles(R.shade.appendChild(mk('div')), [
    [['Árboles de sombra', 'Shade trees'], n0(all.N) + T(' árb/ha', ' trees/ha')], [['Área basal', 'Basal area'], n1(all.G) + ' m²/ha'],
    [['Cobertura de copas', 'Crown cover'], fmtPct(all.cover, 0), ['corregida por traslape', 'corrected for overlap']], [['Especies de sombra por parcela', 'Shade species per plot'], n1(all.S)], [['Complejidad de Holdridge', 'Holdridge complexity'], n1(all.ic)],
  ]);
  if (groups.length > 1) {
    const sum = groups.map(g => { const r = rows.filter(x => x.grp === g); return { g, n: r.length, N: Num.mean(r.map(x => x.N)), G: Num.mean(r.map(x => x.G)), cover: Num.mean(r.map(x => x.cover)), coverSd: r.length > 1 ? Num.sd(r.map(x => x.cover)) : NaN, S: Num.mean(r.map(x => x.S)), ic: Num.mean(r.map(x => x.ic)) }; }).sort((a, b) => b.cover - a.cover);
    UI.table(R.shade, { title: ['Por tipo de manejo', 'By management type'], file: 'forestpro_sombra_manejo', columns: [
      { key: 'g', label: ['Manejo', 'Management'] }, { key: 'n', label: ['Parcelas', 'Plots'], num: true }, { key: 'N', label: ['Árboles/ha', 'Trees/ha'], num: true, fmt: n0 },
      { key: 'G', label: ['G (m²/ha)'], num: true, fmt: n1 }, { key: 'cover', label: ['Cobertura (%)', 'Cover (%)'], num: true, fmt: n1 }, { key: 'coverSd', label: ['DE', 'SD'], num: true, fmt: n1 },
      { key: 'S', label: ['Especies', 'Species'], num: true, fmt: n1 }, { key: 'ic', label: ['IC de Holdridge', 'Holdridge CI'], num: true, fmt: n1 }], rows: sum });
    UI.figure(R.shade, { title: ['Cobertura de copas y especies de sombra por manejo', 'Crown cover and shade species by management'], svg: Plot.bars({ cats: sum.map(s => s.g), series: [{ label: T('Cobertura (%)', 'Cover (%)'), values: sum.map(s => s.cover), err: sum.map(s => s.coverSd), color: 'var(--bosque)' }], ylab: T('Cobertura de copas (%)', 'Crown cover (%)'), name: 'b7-cobertura-manejo', w: 600, h: 360, valueLabels: true, valueFmt: v => fmtNum(v, 0) }), key: 'b7-cover' });
  }
  UI.table(R.shade, { title: ['Por parcela', 'By plot'], file: 'forestpro_sombra_parcelas', columns: [
    { key: 'plot', label: ['Parcela', 'Plot'] }, { key: 'grp', label: ['Manejo', 'Management'] }, { key: 'N', label: ['Árboles/ha', 'Trees/ha'], num: true, fmt: n0 }, { key: 'G', label: ['G (m²/ha)'], num: true, fmt: n1 },
    { key: 'S', label: ['Especies', 'Species'], num: true }, { key: 'raw', label: ['Σ copas (%)', 'Σ crowns (%)'], num: true, fmt: n0 }, { key: 'cover', label: ['Cobertura (%)', 'Cover (%)'], num: true, fmt: n1 },
    { key: 'hMean', label: ['Altura media (m)', 'Mean height (m)'], num: true, fmt: n1 }, { key: 'ic', label: ['IC'], num: true, fmt: n1 }], rows });
  UI.interp(R.shade, [`La sombra cubre en promedio ${fmtPct(all.cover, 0)} del suelo con ${n0(all.N)} árboles por hectárea de ${n1(all.S)} especies por parcela.` + (groups.length > 1 ? ' Los manejos con más especies y más cobertura (rústico y policultivo tradicional) conservan más estructura de bosque y más complejidad.' : ''),
    `Shade covers on average ${fmtPct(all.cover, 0)} of the ground with ${n0(all.N)} trees per hectare of ${n1(all.S)} species per plot.` + (groups.length > 1 ? ' The managements with more species and more cover (rustic and traditional polyculture) keep more forest structure and more complexity.' : '')]);
  state.agro = Object.assign(state.agro || {}, { shade: all });
  Report.set(7, true); refreshStepMarks();
}

/* ---------------- B ---------------- */
function synthPhoto() {
  /* a fisheye view under a shade canopy, drawn here: overcast sky, crowns as clusters of leaves, branches */
  const W = 420, H = 420, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d'), rng = Num.rng(7);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.save(); c.beginPath(); c.arc(W / 2, H / 2, W / 2, 0, 2 * Math.PI); c.clip();
  const sky = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
  sky.addColorStop(0, '#dfe9f5'); sky.addColorStop(1, '#b9cbe2');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#2b2416'; c.lineCap = 'round';
  for (let k = 0; k < 9; k++) { const a = rng() * 6.283, r0 = W / 2; c.lineWidth = 3 + rng() * 6; c.beginPath(); c.moveTo(W / 2 + r0 * Math.cos(a), H / 2 + r0 * Math.sin(a)); c.quadraticCurveTo(W / 2 + 0.5 * r0 * Math.cos(a + 0.4), H / 2 + 0.5 * r0 * Math.sin(a + 0.4), W / 2 + (0.15 + 0.25 * rng()) * r0 * Math.cos(a + 0.9), H / 2 + (0.15 + 0.25 * rng()) * r0 * Math.sin(a + 0.9)); c.stroke(); }
  for (let k = 0; k < 26; k++) {
    const a = rng() * 6.283, rr = (0.12 + 0.88 * Math.sqrt(rng())) * W / 2, x = W / 2 + rr * Math.cos(a), y = H / 2 + rr * Math.sin(a), R0 = 24 + rng() * 46;
    for (let j = 0; j < 70; j++) {
      const t = rng() * 6.283, s = R0 * Math.sqrt(rng());
      c.fillStyle = ['#1f3a1a', '#2d4f22', '#3b5f2b', '#26421d'][j % 4];
      c.beginPath(); c.ellipse(x + s * Math.cos(t), y + s * Math.sin(t), 3 + rng() * 6, 2 + rng() * 4, rng() * 3.14, 0, 6.283); c.fill();
    }
  }
  c.restore();
  return { name: T('Foto sintética de ejemplo', 'Synthetic example photo'), img: c.getImageData(0, 0, W, H), canvas: cv };
}
function loadPhoto() {
  const file = el('b7img').files[0];
  if (!file) return;
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    const sc = Math.min(1, 640 / Math.max(im.width, im.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc);
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0, cv.width, cv.height);
    S.photo = { name: file.name, img: c.getImageData(0, 0, cv.width, cv.height), canvas: cv };
    URL.revokeObjectURL(url); runPhoto();
  };
  im.onerror = () => { showMessage(R.photo, 'danger', L2('No se pudo abrir la imagen.', 'The image could not be opened.')); URL.revokeObjectURL(url); };
  im.src = url;
  el('b7img').value = '';
}
function runPhoto() {
  R.photo.innerHTML = '';
  const { img } = S.photo, w = img.width, h = img.height;
  const hemi = el('b7proj').value === 'hemi';
  const grey = AG().grey(img, el('b7ch').value);
  const geo = { cx: w / 2, cy: h / 2, R: Math.min(w, h) / 2 * (+el('b7r').value || 100) / 100, hemi };
  const hist = AG().histogram(grey, w, h, geo);
  const manual = el('b7thr').value !== '';
  const thr = manual ? +el('b7thr').value : AG().otsu(hist);
  const op = AG().openness(grey, w, h, Object.assign({ threshold: thr }, geo));
  UI.tiles(R.photo.appendChild(mk('div')), [
    [['Cobertura del dosel', 'Canopy cover'], fmtPct(100 * (1 - op.weighted), 1), [hemi ? '1 − apertura ponderada' : '1 − fracción de cielo', hemi ? '1 − weighted openness' : '1 − sky fraction'], 'ok'],
    hemi ? [['Apertura del dosel', 'Canopy openness'], fmtPct(100 * op.weighted, 1), ['ponderada por ángulo sólido', 'weighted by solid angle']] : null,
    [['Fracción de huecos', 'Gap fraction'], fmtPct(100 * op.gap, 1), [op.pixels + ' píxeles', op.pixels + ' pixels']],
    [['Umbral', 'Threshold'], String(thr), [manual ? 'manual' : 'Otsu', manual ? 'manual' : 'Otsu']],
  ]);
  /* the photo and its segmentation side by side */
  const pair = mk('div', { class: 'photo-pair' });
  const c1 = mk('div'), c2 = mk('div');
  const cvA = document.createElement('canvas'); cvA.width = w; cvA.height = h; cvA.getContext('2d').putImageData(img, 0, 0);
  cvA.setAttribute('role', 'img'); cvA.setAttribute('aria-label', T('Fotografía original', 'Original photograph'));
  const cvB = document.createElement('canvas'); cvB.width = w; cvB.height = h;
  const ctx = cvB.getContext('2d'), out = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, dx = x + 0.5 - geo.cx, dy = y + 0.5 - geo.cy, inside = !hemi || dx * dx + dy * dy <= geo.R * geo.R;
    const sky = grey[i] > thr;
    const col = !inside ? [70, 70, 70] : sky ? [250, 250, 245] : [27, 94, 32];
    out.data[4 * i] = col[0]; out.data[4 * i + 1] = col[1]; out.data[4 * i + 2] = col[2]; out.data[4 * i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  cvB.setAttribute('role', 'img'); cvB.setAttribute('aria-label', T('Segmentación: cielo en blanco, dosel en verde', 'Segmentation: sky in white, canopy in green'));
  c1.append(cvA, mk('div', { class: 'cap' }, L2('Original: ', 'Original: ') + esc(S.photo.name)));
  c2.append(cvB, mk('div', { class: 'cap' }, L2('Cielo (blanco) y dosel (verde)', 'Sky (white) and canopy (green)')));
  pair.append(c1, c2);
  R.photo.appendChild(pair);
  const xs = Array.from({ length: 256 }, (_, i) => i);
  UI.figure(R.photo, { title: ['Histograma de grises y umbral', 'Grey histogram and threshold'], svg: Plot.bars({ edges: xs.concat([256]), series: [{ label: T('Píxeles', 'Pixels'), values: hist, color: 'var(--musgo)' }], curves: [{ x: [thr, thr], y: [0, Math.max(...hist)], color: 'var(--accent)', label: T('Umbral', 'Threshold'), dash: '5 4' }], xlab: T('Nivel de gris', 'Grey level'), ylab: T('Píxeles', 'Pixels'), name: 'b7-histograma', w: 620, h: 300 }), key: 'b7-hist' });
  if (hemi) UI.table(R.photo, { title: ['Apertura por anillos de ángulo cenital', 'Openness by zenith-angle rings'], file: 'forestpro_anillos', columns: [
    { key: 'ring', label: ['Anillo', 'Ring'], get: r => r.from + '°–' + r.to + '°' }, { key: 'open', label: ['Cielo (%)', 'Sky (%)'], num: true, fmt: v => fmtNum(100 * v, 1) }, { key: 'n', label: ['Píxeles', 'Pixels'], num: true }], rows: op.rings });
  UI.interp(R.photo, [`El dosel cubre ${fmtPct(100 * (1 - op.weighted), 0)} del cielo visible. Revisa la imagen segmentada: si el sol o el cielo brillante entre hojas quedan mal clasificados, ajusta el umbral a mano. Una sola foto describe un punto; para la parcela promedia varias fotos tomadas a la misma altura.`,
    `The canopy covers ${fmtPct(100 * (1 - op.weighted), 0)} of the visible sky. Check the segmented image: if the sun or the bright sky between leaves is misclassified, set the threshold by hand. A single photo describes one point; for the plot average several photos taken at the same height.`]);
  state.agro = Object.assign(state.agro || {}, { photo: { cover: 1 - op.weighted, threshold: thr } });
  Report.set(7, true); refreshStepMarks();
}

/* ---------------- C ---------------- */
function drawSY() {
  R.sy.innerHTML = '';
  const rows = S.sy.filter(r => isFinite(r.sombra) && isFinite(r.rendimiento));
  if (rows.length < 5) { showMessage(R.sy, 'warning', L2('Hacen falta al menos 5 parcelas.', 'At least 5 plots are needed.')); return; }
  const r = AG().shadeYield(rows.map(x => x.sombra), rows.map(x => x.rendimiento));
  UI.tiles(R.sy.appendChild(mk('div')), [
    [['Modelo elegido', 'Model chosen'], r.best === 'quad' ? T('Cuadrático', 'Quadratic') : T('Lineal', 'Linear'), ['F del término cuadrático = ' + n2(r.F) + ', p ' + (r.pF < 0.001 ? '< 0.001' : '= ' + fmtNum(r.pF, 3)), 'F of the quadratic term = ' + n2(r.F) + ', p ' + (r.pF < 0.001 ? '< 0.001' : '= ' + fmtNum(r.pF, 3))]],
    isFinite(r.opt) ? [['Sombra del rendimiento máximo', 'Shade of maximum yield'], n1(r.opt) + ' %', [n1(r.lo) + ' – ' + n1(r.hi) + ' % (95 %)', n1(r.lo) + ' – ' + n1(r.hi) + ' % (95 %)']] : null,
    isFinite(r.yOpt) ? [['Rendimiento máximo estimado', 'Estimated maximum yield'], n0(r.yOpt)] : null,
    [['R² (cuadrático)', 'R² (quadratic)'], fmtNum(r.quad.r2, 3), ['lineal: ' + fmtNum(r.lin.r2, 3), 'linear: ' + fmtNum(r.lin.r2, 3)]],
  ]);
  const xs = Array.from({ length: 80 }, (_, i) => Math.min(...rows.map(x => x.sombra)) + i * (Math.max(...rows.map(x => x.sombra)) - Math.min(...rows.map(x => x.sombra))) / 79);
  const bq = xs.map(r.bandQuad), bl = xs.map(r.bandLin);
  const groups = [...new Set(rows.map(x => x.grupo).filter(Boolean))];
  const ser = [{ type: 'band', x: xs, y: bq.map(b => b.lo), y2: bq.map(b => b.hi), color: 'var(--bosque)', opacity: 0.15 }, { type: 'line', x: xs, y: bq.map(b => b.m), color: 'var(--bosque)', width: 2.6, label: T('Cuadrático', 'Quadratic') }, { type: 'line', x: xs, y: bl.map(b => b.m), color: 'var(--accent)', width: 1.6, dash: '6 4', label: T('Lineal', 'Linear') }];
  (groups.length ? groups : ['']).forEach((g, k) => { const pts = rows.filter(x => !g || x.grupo === g); ser.push({ type: 'points', x: pts.map(x => x.sombra), y: pts.map(x => x.rendimiento), color: Plot.color(k + 1), label: g || T('Parcelas', 'Plots'), titles: pts.map(x => (x.parcela || '') + ' · ' + x.sombra + ' %') }); });
  if (isFinite(r.opt)) ser.push({ type: 'vline', x: r.opt, color: 'var(--fig-ink)' });
  UI.figure(R.sy, { title: ['Rendimiento contra sombra', 'Yield against shade'], svg: Plot.xy({ series: ser, xlab: T('Sombra (%)', 'Shade (%)'), ylab: T('Rendimiento', 'Yield'), name: 'b7-sombra-rendimiento', w: 640, h: 400, legend: 'bottom' }), key: 'b7-sy' });
  UI.coefTable(R.sy, r.quad, { names: ['b0', 'b1 (S)', 'b2 (S²)'], title: ['Coeficientes del modelo cuadrático', 'Coefficients of the quadratic model'], file: 'forestpro_sombra_rendimiento' });
  UI.interp(R.sy, [isFinite(r.opt) ? `El rendimiento sube con la sombra hasta cerca de ${n1(r.opt)} % (intervalo de ${n1(r.lo)} a ${n1(r.hi)} %) y baja después: con poca sombra el cultivo sufre estrés y con mucha le falta luz. ${r.pF < 0.05 ? 'La curvatura es significativa.' : 'Pero la curvatura no es significativa: los datos no distinguen un óptimo de una tendencia lineal.'}` : 'La curva no tiene un máximo: con estos datos el rendimiento sigue una tendencia monótona con la sombra.',
    isFinite(r.opt) ? `Yield rises with shade up to about ${n1(r.opt)} % (interval ${n1(r.lo)} to ${n1(r.hi)} %) and falls afterwards: with little shade the crop is stressed and with much shade it lacks light. ${r.pF < 0.05 ? 'The curvature is significant.' : 'But the curvature is not significant: the data do not tell an optimum from a linear trend.'}` : 'The curve has no maximum: with these data yield follows a monotonic trend with shade.']);
  state.agro = Object.assign(state.agro || {}, { shadeYield: { opt: r.opt, lo: r.lo, hi: r.hi, model: r.best } });
  Report.set(7, true); refreshStepMarks();
}

/* ---------------- D ---------------- */
function drawLayout() {
  if (!R.layout) return;
  R.layout.innerHTML = '';
  const o = { kind: el('b7kind').value, W: +el('b7W').value, L: +el('b7L').value, a: +el('b7a').value, b: +el('b7b').value, alley: +el('b7alley').value };
  if (!(o.W > 0 && o.L > 0 && o.a > 0)) return;
  const res = AG().layout(o);
  const crop = AG().layout({ kind: 'rect', W: o.W, L: o.L, a: +el('b7crop').value, b: +el('b7cropRow').value });
  const cost = +el('b7cost').value || 0;
  UI.tiles(R.layout.appendChild(mk('div')), [
    [['Árboles en el terreno', 'Trees in the field'], n0(res.n), [n1(o.W * o.L / 10000) + ' ha', n1(o.W * o.L / 10000) + ' ha']],
    [['Densidad', 'Density'], n0(res.perHa) + T(' árb/ha', ' trees/ha'), isFinite(res.theoretical) ? ['teórica: ' + n0(res.theoretical), 'theoretical: ' + n0(res.theoretical)] : null],
    [['Superficie por árbol', 'Area per tree'], n1(res.areaPerTree) + ' m²'],
    [['Plantas del cultivo', 'Crop plants'], n0(crop.n), [n0(crop.perHa) + ' por ha', n0(crop.perHa) + ' per ha']],
    cost ? [['Costo de los árboles', 'Cost of the trees'], fmtNum(res.n * cost, 0)] : null,
  ]);
  /* the plan, to scale */
  const W = 560, sc = Math.min((W - 40) / o.W, 420 / o.L), H = o.L * sc + 40, ox = 20, oy = 20;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(1)}" class="pl" data-name="b7-diseno-plantacion" role="img" aria-label="${esc(T('Plano de la plantación', 'Plan of the planting'))}"><rect class="pl-bg" width="${W}" height="${H.toFixed(1)}"/>`;
  s += `<rect x="${ox}" y="${oy}" width="${(o.W * sc).toFixed(1)}" height="${(o.L * sc).toFixed(1)}" style="fill:color-mix(in srgb, var(--musgo) 10%, transparent);stroke:var(--fig-axis);stroke-width:1.2"/>`;
  if (crop.n <= 6000) crop.pts.forEach(p => { s += `<circle cx="${(ox + p.x * sc).toFixed(1)}" cy="${(oy + p.y * sc).toFixed(1)}" r="${Math.max(0.6, Math.min(2.2, sc * 0.35)).toFixed(2)}" style="fill:#6d8f3a;opacity:.55"/>`; });
  const cr = Math.max(2.5, Math.min(9, o.a * sc * 0.42));
  res.pts.forEach(p => { s += `<circle cx="${(ox + p.x * sc).toFixed(1)}" cy="${(oy + p.y * sc).toFixed(1)}" r="${cr.toFixed(1)}" style="fill:var(--bosque);fill-opacity:.85;stroke:var(--fig-bg);stroke-width:.8"/>`; });
  s += `<text class="pl-lab" x="${ox}" y="${(H - 6).toFixed(1)}">${esc(o.W + ' m × ' + o.L + ' m')}</text></svg>`;
  UI.figure(R.layout, { title: ['Plano de la plantación (árboles en verde oscuro, cultivo en verde claro)', 'Plan of the planting (trees in dark green, crop in light green)'], svg: s, key: 'b7-plan' });
  state.agro = Object.assign(state.agro || {}, { layout: { kind: o.kind, n: res.n, perHa: res.perHa } });
}

/* ---------------- E ---------------- */
function drawBudget() {
  if (!R.budget) return;
  R.budget.innerHTML = '';
  if (!S.budgetEx) return;
  const cf = +el('b7cfB').value || 0.47, rsC = +el('b7rsC').value || 0.27, B = window.Biomass;
  /* shade trees of the example, per hectare */
  const trees = FPData.rows('cafetal_arboles').filter(r => r.estado === 'vivo');
  const dens = new Map(FPData.rows('densidades_madera').map(r => [r.especie, r.densidad]));
  const eqFor = sp => { const g = sp.split(' ')[0]; const rule = SHADE_RULES.find(([p]) => p === sp) || SHADE_RULES.find(([p]) => p === g); return B.eq(rule ? rule[1] : 'chave14_h'); };
  const plots = FPData.rows('cafetal_parcelas');
  const meanWD = Num.mean([...dens.values()]);
  let agbTrees = 0;
  trees.forEach(t => { const rho = dens.get(t.especie) || meanWD; const r = B.treeAGB({ D: t.dap, H: t.altura, rho }, eqFor(t.especie)); if (isFinite(r.agb)) agbTrees += r.agb * 10 / 1000; });
  agbTrees /= plots.length;
  /* coffee bushes: mean bush biomass by Segura et al. 2006, times the planting density */
  const bushes = FPData.rows('cafetal_cafetos'), eqC = B.eq('segura06_coffee');
  const bush = Num.mean(bushes.map(b => eqC.f({ D15: b.d15, H: b.altura })));
  const densSys = +el('b7dens').value || Num.mean(plots.map(p => p.densidad_cafe));
  if (!el('b7dens').value) el('b7dens').value = Math.round(densSys);
  const lit = Num.mean(plots.map(p => B.litter(p.hojarasca_g, p.marco_m2)));
  const soilRows = FPData.rows('cafetal_suelo'), sp = new Map();
  soilRows.forEach(r => sp.set(r.parcela, (sp.get(r.parcela) || 0) + B.socLayer(r.co_pct, r.dap_g_cm3, r.prof_sup, r.prof_inf, r.pedregosidad_pct)));
  const soil = Num.mean([...sp.values()]);
  const coffeeSys = bush * densSys / 1000, coffeeMono = bush * (+el('b7monoDens').value || 5000) / 1000;
  const agro = { [T('Árboles de sombra (aérea)', 'Shade trees (aboveground)')]: agbTrees * cf, [T('Árboles de sombra (raíces)', 'Shade trees (roots)')]: agbTrees * 0.27 * cf, [T('Cafetos', 'Coffee bushes')]: coffeeSys * (1 + rsC) * cf, [T('Hojarasca', 'Litter')]: lit * cf, [T('Suelo (0–30 cm)', 'Soil (0–30 cm)')]: soil };
  const mono = { [T('Árboles de sombra (aérea)', 'Shade trees (aboveground)')]: 0, [T('Árboles de sombra (raíces)', 'Shade trees (roots)')]: 0, [T('Cafetos', 'Coffee bushes')]: coffeeMono * (1 + rsC) * cf, [T('Hojarasca', 'Litter')]: (+el('b7monoLit').value || 0) * cf, [T('Suelo (0–30 cm)', 'Soil (0–30 cm)')]: +el('b7monoSoil').value || 0 };
  const bud = AG().budget(agro, mono);
  UI.tiles(R.budget.appendChild(mk('div')), [
    [['Sistema agroforestal', 'Agroforestry system'], n1(bud.totalAgro) + ' Mg C/ha'], [['Monocultivo', 'Monoculture'], n1(bud.totalMono) + ' Mg C/ha'],
    [['Diferencia', 'Difference'], (bud.diff >= 0 ? '+' : '') + n1(bud.diff) + ' Mg C/ha', [n1(bud.diffCO2) + ' Mg CO₂e/ha', n1(bud.diffCO2) + ' Mg CO₂e/ha'], bud.diff > 0 ? 'ok' : 'warn'],
    [['Biomasa media de un cafeto', 'Mean biomass of a coffee bush'], n2(bush) + ' kg'],
  ]);
  const cols = [Plot.CAT[0], Plot.CAT[2], '#6d8f3a', '#C2A83E', '#6D4C2F'];
  UI.figure(R.budget, { title: ['Carbono por reservorio: sistema con sombra frente a monocultivo', 'Carbon by pool: shaded system against monoculture'], svg: Plot.bars({ cats: [T('Con sombra', 'Shaded'), T('Monocultivo', 'Monoculture')], stacked: true, series: bud.rows.map((r, k) => ({ label: r.k, values: [r.agro, r.mono], color: cols[k % cols.length] })), legendAlways: true, ylab: 'Mg C/ha', name: 'b7-presupuesto-carbono', w: 600, h: 380 }), key: 'b7-budget' });
  UI.table(R.budget, { title: ['Presupuesto de carbono (Mg C/ha)', 'Carbon budget (Mg C/ha)'], file: 'forestpro_presupuesto_carbono', columns: [
    { key: 'k', label: ['Reservorio', 'Pool'] }, { key: 'agro', label: ['Con sombra', 'Shaded'], num: true, fmt: n1 }, { key: 'mono', label: ['Monocultivo', 'Monoculture'], num: true, fmt: n1 }, { key: 'diff', label: ['Diferencia', 'Difference'], num: true, fmt: n1 }],
    rows: bud.rows.concat([{ k: T('Total', 'Total'), agro: bud.totalAgro, mono: bud.totalMono, diff: bud.diff, _class: 'row-total' }]) });
  UI.interp(R.budget, [`El cafetal con sombra guarda ${n1(bud.diff)} Mg C/ha más que el monocultivo supuesto (${n1(bud.diffCO2)} Mg CO₂e/ha). La mayor parte de la diferencia está en los árboles de sombra${soil > (+el('b7monoSoil').value || 0) ? ' y en el suelo' : ''}. El valor del monocultivo depende de los supuestos que escribiste: cámbialos por mediciones de un cafetal a pleno sol de la misma zona.`,
    `The shaded coffee farm holds ${n1(bud.diff)} Mg C/ha more than the assumed monoculture (${n1(bud.diffCO2)} Mg CO₂e/ha). Most of the difference lies in the shade trees${soil > (+el('b7monoSoil').value || 0) ? ' and in the soil' : ''}. The monoculture value depends on the assumptions you typed: replace them with measurements of a full-sun coffee farm of the same area.`]);
  state.agro = Object.assign(state.agro || {}, { budget: { agro: bud.totalAgro, mono: bud.totalMono, diff: bud.diff } });
  Report.set(7, true); refreshStepMarks();
}

ExampleHooks['cafetal:7'] = () => { build(); ExampleHooks['cafetal:3'](); setTimeout(() => { goStep(7); drawShade(); S.cardC.load('cafetal'); S.photo = synthPhoto(); runPhoto(); S.budgetEx = true; drawBudget(); }, 80); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('langchange', () => { if (!el('b7root')) return; if (state.agro && state.agro.shade) drawShade(); if (S.photo) runPhoto(); if (S.sy) drawSY(); drawLayout(); drawBudget(); });
})();
