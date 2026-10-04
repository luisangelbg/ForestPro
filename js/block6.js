/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 6: forest diversity and ecology. */
(function () {
'use strict';
const S = { comm: null, heights: null, pts: null };
const R = {};
const DV = () => window.Divers;
const n1 = v => fmtNum(v, 1), n2 = v => fmtNum(v, 2), n3 = v => fmtNum(v, 3);
const SUITE = 'https://luisangelbg.github.io/';

/* a long table (site, species, abundance, group) → community matrix */
function community(rows, name) {
  const sites = [...new Set(rows.map(r => String(r.sitio)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const species = [...new Set(rows.map(r => String(r.especie)))].sort();
  const M = sites.map(() => new Array(species.length).fill(0));
  const grp = new Map();
  rows.forEach(r => { const i = sites.indexOf(String(r.sitio)), j = species.indexOf(String(r.especie)); M[i][j] += isFinite(r.abundancia) ? r.abundancia : 1; if (r.grupo) grp.set(String(r.sitio), String(r.grupo)); });
  return { name, sites, species, M, groups: sites.map(s => grp.get(s) || '') };
}
const EXC = [
  { id: 'mesofilo', es: 'Bosque mesófilo: 24 parcelas en 3 estratos', en: 'Cloud forest: 24 plots in 3 strata', d: ['Individuos vivos de cada especie en cada parcela (DAP ≥ 2.5 cm); el estrato agrupa las parcelas.', 'Live individuals of each species in each plot (DBH ≥ 2.5 cm); the stratum groups the plots.'],
    rows: () => FPData.rows('mesofilo_arboles').filter(r => r.estado === 'vivo').map(r => ({ sitio: r.parcela, especie: r.especie, abundancia: 1, grupo: r.estrato, altura: r.altura })) },
  { id: 'cafetal', es: 'Cafetal: árboles de sombra de 25 parcelas', en: 'Coffee farm: shade trees of 25 plots', d: ['Individuos de cada especie de sombra por parcela; la finca agrupa las parcelas.', 'Individuals of each shade species per plot; the farm groups the plots.'],
    rows: () => FPData.rows('cafetal_arboles').filter(r => r.estado === 'vivo').map(r => ({ sitio: r.parcela, especie: r.especie, abundancia: 1, grupo: r.finca, altura: r.altura })) },
];

function build() {
  const root = el('b6root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Cuántas especies hay, cómo se reparten los individuos, cuántas faltan por registrar, qué tanto se parecen los sitios, cómo se acomodan en altura y en el espacio.',
    'How many species there are, how individuals are shared among them, how many remain to be recorded, how alike the sites are, how they stack in height and in space.')));
  /* A */
  const a = UI.section(root, ['La comunidad', 'The community'], ['Una tabla larga: sitio, especie y abundancia (o una fila por individuo). La columna de grupo, si la hay, colorea los sitios en la ordenación.', 'A long table: site, species and abundance (or one row per individual). The group column, if present, colours the sites in the ordination.']);
  S.cardA = UI.dataCard(a, { id: 'b6a', fields: [
    { key: 'sitio', es: 'Sitio o parcela', en: 'Site or plot', req: true, aliases: ['site', 'parcela', 'plot'] },
    { key: 'especie', es: 'Especie', en: 'Species', req: true, aliases: ['species', 'sp'] },
    { key: 'abundancia', es: 'Abundancia (vacío = 1 individuo)', en: 'Abundance (empty = 1 individual)', num: true, aliases: ['abundance', 'n', 'individuos', 'count'] },
    { key: 'grupo', es: 'Grupo (estrato, finca…)', en: 'Group (stratum, farm…)', aliases: ['group', 'estrato', 'finca', 'tratamiento'] },
    { key: 'altura', es: 'Altura (m), para la estructura vertical', en: 'Height (m), for vertical structure', num: true, aliases: ['h', 'ht'] }],
    examples: EXC,
    inventory: () => state.inv ? state.inv.trees.filter(t => t.alive !== false).map(t => ({ sitio: t.plot, especie: t.especie, abundancia: 1, grupo: t.stratum || t.cluster || '', altura: t.altura })) : null,
    onData: (rows, meta) => { S.comm = community(rows, meta.name); S.heights = rows.filter(r => r.altura > 0).map(r => ({ sp: String(r.especie), h: r.altura, g: r.grupo || '' })); runAll(); } });
  R.comm = mk('div', { class: 'res-host' }); a.appendChild(R.comm);
  /* B */
  const b = UI.section(root, ['Índices de diversidad', 'Diversity indices'], ['Por sitio y para todo el conjunto.', 'By site and for the whole set.']);
  R.idx = mk('div', { class: 'res-host' }); b.appendChild(R.idx);
  UI.method(b, { text: [
    '<p>Con p<sub>i</sub> = n<sub>i</sub>/N: Shannon H′ = −Σp<sub>i</sub> ln p<sub>i</sub>; Simpson λ = Σp<sub>i</sub>², 1 − λ y 1/λ; Pielou J = H′/ln S; α de Fisher, de S = α ln(1 + N/α); Margalef (S − 1)/ln N; Menhinick S/√N. Riqueza estimada: Chao1 corregido por sesgo, S + f₁(f₁ − 1)/(2(f₂ + 1)), y ACE con las especies de 10 individuos o menos como raras. Cobertura de la muestra (Chao y Jost): Ĉ = 1 − (f₁/n)·[(n − 1)f₁/((n − 1)f₁ + 2f₂)], la fracción de los individuos de la comunidad que pertenecen a especies ya registradas.</p>',
    '<p>With p<sub>i</sub> = n<sub>i</sub>/N: Shannon H′ = −Σp<sub>i</sub> ln p<sub>i</sub>; Simpson λ = Σp<sub>i</sub>², 1 − λ and 1/λ; Pielou J = H′/ln S; Fisher\'s α, from S = α ln(1 + N/α); Margalef (S − 1)/ln N; Menhinick S/√N. Estimated richness: bias-corrected Chao1, S + f₁(f₁ − 1)/(2(f₂ + 1)), and ACE with species of 10 individuals or fewer as rare. Sample coverage (Chao and Jost): Ĉ = 1 − (f₁/n)·[(n − 1)f₁/((n − 1)f₁ + 2f₂)], the share of the individuals of the community that belong to species already recorded.</p>'],
    refs: ['Magurran, A. E. (2004). <i>Measuring Biological Diversity</i>. Blackwell.', 'Fisher, R. A., Corbet, A. S. y Williams, C. B. (1943). The relation between the number of species and the number of individuals. <i>J. Anim. Ecol.</i> 12:42–58.', 'Chao, A. (1987). Estimating the population size for capture-recapture data with unequal catchability. <i>Biometrics</i> 43:783–791.', 'Chao, A. y Lee, S.-M. (1992). Estimating the number of classes via sample coverage. <i>JASA</i> 87:210–217.', 'Chao, A. y Jost, L. (2012). Coverage-based rarefaction and extrapolation. <i>Ecology</i> 93:2533–2547.'] });
  /* C */
  const c = UI.section(root, ['Números de Hill, rarefacción y acumulación', 'Hill numbers, rarefaction and accumulation'], ['La diversidad en una sola escala de «especies efectivas», y cómo crece la riqueza con el esfuerzo de muestreo.', 'Diversity on a single scale of «effective species», and how richness grows with sampling effort.']);
  R.hill = mk('div', { class: 'res-host' }); c.appendChild(R.hill);
  UI.method(c, { text: [
    '<p>Números de Hill: <sup>q</sup>D = (Σp<sub>i</sub><sup>q</sup>)<sup>1/(1−q)</sup>; q = 0 es la riqueza, q = 1 exp(H′) y q = 2 el inverso de Simpson: el número de especies igualmente abundantes que daría la misma diversidad. El perfil decrece con q; cuanto más rápido, más dominada la comunidad. Estimadores asintóticos (Chao et al. 2013, 2014): riqueza S + ((n − 1)/n)·f₁²/(2f₂); entropía de Shannon por la fórmula de Chao, Wang y Jost; Simpson n(n − 1)/Σx(x − 1). Rarefacción por individuos (Hurlbert): E[S<sub>m</sub>] = Σ[1 − C(n − x<sub>i</sub>, m)/C(n, m)]; extrapolación hasta 2n: S + f̂₀[1 − (1 − f₁/(nf̂₀ + f₁))<sup>m − n</sup>]. Acumulación por parcelas: la expectativa exacta de especies en t parcelas y su desviación estándar condicionada a la muestra (Kindt; Colwell et al.).</p>',
    '<p>Hill numbers: <sup>q</sup>D = (Σp<sub>i</sub><sup>q</sup>)<sup>1/(1−q)</sup>; q = 0 is richness, q = 1 exp(H′) and q = 2 the inverse Simpson: the number of equally abundant species that would give the same diversity. The profile decreases with q; the faster, the more dominated the community. Asymptotic estimators (Chao et al. 2013, 2014): richness S + ((n − 1)/n)·f₁²/(2f₂); Shannon entropy by the formula of Chao, Wang and Jost; Simpson n(n − 1)/Σx(x − 1). Individual-based rarefaction (Hurlbert): E[S<sub>m</sub>] = Σ[1 − C(n − x<sub>i</sub>, m)/C(n, m)]; extrapolation up to 2n: S + f̂₀[1 − (1 − f₁/(nf̂₀ + f₁))<sup>m − n</sup>]. Plot-based accumulation: the exact expectation of species in t plots and its standard deviation conditional on the sample (Kindt; Colwell et al.).</p>'],
    refs: ['Hill, M. O. (1973). Diversity and evenness: a unifying notation and its consequences. <i>Ecology</i> 54:427–432.', 'Chao, A., Wang, Y. T. y Jost, L. (2013). Entropy and the species accumulation curve. <i>Methods Ecol. Evol.</i> 4:1091–1100.', 'Chao, A. et al. (2014). Rarefaction and extrapolation with Hill numbers. <i>Ecological Monographs</i> 84:45–67.', 'Hurlbert, S. H. (1971). The nonconcept of species diversity. <i>Ecology</i> 52:577–586.', 'Colwell, R. K., Mao, C. X. y Chang, J. (2004). Interpolating, extrapolating, and comparing incidence-based species accumulation curves. <i>Ecology</i> 85:2717–2727.'] });
  /* D */
  const d = UI.section(root, ['Similitud entre sitios y ordenación', 'Similarity among sites and ordination'], ['Qué tanto comparten especies los sitios, un dendrograma y una ordenación no métrica.', 'How much the sites share species, a dendrogram and a non-metric ordination.']);
  const df = mk('div', { class: 'form-grid' });
  df.innerHTML = `<div class="field"><label for="b6dist">${L2('Índice', 'Index')}</label><select id="b6dist"><option value="bray">Bray–Curtis</option><option value="jaccard">Jaccard</option><option value="sorensen">Sørensen</option></select></div>`;
  d.appendChild(df);
  el('b6dist').addEventListener('change', () => { if (S.comm) drawSim(); });
  const sendRow = mk('div', { class: 'btn-row' });
  [['ClusteringPro', 'Enviar la matriz a ClusteringPro', 'Send the matrix to ClusteringPro'], ['PCAPro', 'Enviar la matriz a PCAPro', 'Send the matrix to PCAPro']].forEach(([app, es, en]) => {
    const btn = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2(es, en));
    btn.addEventListener('click', () => sendTo(app));
    sendRow.appendChild(btn);
  });
  d.appendChild(sendRow);
  d.appendChild(mk('p', { class: 'hint' }, L2('Se descarga la matriz sitios × especies en CSV (lista para «Abrir archivo» en la otra app) y la app se abre en una pestaña nueva.', 'The sites × species matrix is downloaded as CSV (ready for «Open file» in the other app) and the app opens in a new tab.')));
  R.sim = mk('div', { class: 'res-host' }); d.appendChild(R.sim);
  UI.method(d, { text: [
    '<p>Disimilitudes: Jaccard (b + c)/(a + b + c) y Sørensen (b + c)/(2a + b + c) con presencia y ausencia (a = especies compartidas, b y c = exclusivas), y Bray–Curtis Σ|x − y|/Σ(x + y) con abundancias. Dendrograma por UPGMA (promedio aritmético no ponderado); la correlación cofenética mide qué tan bien conserva el árbol las disimilitudes. Ordenación: escalamiento multidimensional no métrico en 2 dimensiones que minimiza el estrés-1 de Kruskal con regresión monótona, desde el escalamiento clásico y 20 configuraciones aleatorias; se rota a sus ejes principales. Estrés &lt; 0.10 es una buena representación y &gt; 0.20, una pobre.</p>',
    '<p>Dissimilarities: Jaccard (b + c)/(a + b + c) and Sørensen (b + c)/(2a + b + c) with presence and absence (a = shared species, b and c = exclusive), and Bray–Curtis Σ|x − y|/Σ(x + y) with abundances. Dendrogram by UPGMA (unweighted pair-group arithmetic average); the cophenetic correlation measures how well the tree keeps the dissimilarities. Ordination: non-metric multidimensional scaling in 2 dimensions minimising Kruskal\'s stress-1 with monotone regression, from classical scaling and 20 random configurations; rotated to its principal axes. Stress &lt; 0.10 is a good representation and &gt; 0.20 a poor one.</p>'],
    refs: ['Legendre, P. y Legendre, L. (2012). <i>Numerical Ecology</i>, 3.ª ed. Elsevier.', 'Kruskal, J. B. (1964). Nonmetric multidimensional scaling: a numerical method. <i>Psychometrika</i> 29:115–129.', 'de Leeuw, J. y Mair, P. (2009). Multidimensional scaling using majorization: SMACOF in R. <i>J. Stat. Softw.</i> 31(3).', 'Sokal, R. R. y Rohlf, F. J. (1962). The comparison of dendrograms by objective methods. <i>Taxon</i> 11:33–40.'] });
  /* E */
  const e = UI.section(root, ['Estructura vertical', 'Vertical structure'], ['Cómo se reparten las especies en los pisos del bosque.', 'How species are spread among the storeys of the forest.']);
  R.vert = mk('div', { class: 'res-host' }); e.appendChild(R.vert);
  UI.method(e, { text: [
    '<p><b>Índice de perfil de especies de Pretzsch:</b> A = −ΣΣ p<sub>ij</sub> ln p<sub>ij</sub>, con p<sub>ij</sub> la proporción de individuos de la especie i en la zona de altura j: zona I, más de 80 % de la altura máxima; II, de 50 a 80 %; III, hasta 50 %. A<sub>máx</sub> = ln(S·3) y A<sub>rel</sub> = 100·A/A<sub>máx</sub>: cerca de 100 %, todas las especies en todos los pisos en igual proporción. <b>Estratos por la media y la desviación estándar de la altura:</b> inferior por debajo de la media − 1 DE, superior por encima de la media + 1 DE.</p>',
    '<p><b>Pretzsch\'s species profile index:</b> A = −ΣΣ p<sub>ij</sub> ln p<sub>ij</sub>, with p<sub>ij</sub> the share of individuals of species i in height zone j: zone I, above 80 % of the maximum height; II, 50 to 80 %; III, up to 50 %. A<sub>max</sub> = ln(S·3) and A<sub>rel</sub> = 100·A/A<sub>max</sub>: near 100 %, every species in every storey in equal shares. <b>Strata from the mean and standard deviation of height:</b> lower below the mean − 1 SD, upper above the mean + 1 SD.</p>'],
    refs: ['Pretzsch, H. (1996). Strukturvielfalt als Ergebnis waldbaulichen Handelns. <i>DVFFA, Sektion Ertragskunde</i>, pp. 134–154.', 'Pretzsch, H. (2009). <i>Forest Dynamics, Growth and Yield</i>. Springer.', 'Souza, D. R. et al. (2003). Análise estrutural em floresta ombrófila densa de terra firme. <i>Revista Árvore</i> 27:75–83.'] });
  /* F */
  const f = UI.section(root, ['Patrón espacial de los árboles', 'Spatial pattern of the trees'], ['Con las coordenadas de cada tallo en una parcela rectangular: ¿agregados, al azar o regulares?', 'With the coordinates of every stem in a rectangular plot: clustered, random or regular?']);
  const ff = mk('div', { class: 'form-grid' });
  ff.innerHTML = [['b6W', 'Ancho de la parcela (m)', 'Plot width (m)', 50], ['b6H', 'Largo de la parcela (m)', 'Plot length (m)', 50], ['b6rmax', 'Distancia máxima para K (m)', 'Maximum distance for K (m)', 12], ['b6nsim', 'Simulaciones para la envolvente', 'Simulations for the envelope', 99]]
    .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('') +
    `<div class="field"><label for="b6grp">${L2('Árboles', 'Trees')}</label><select id="b6grp"></select></div>`;
  f.appendChild(ff);
  ['b6W', 'b6H', 'b6rmax', 'b6nsim', 'b6grp'].forEach(id => el(id).addEventListener('change', () => { if (S.pts) runSpatial(); }));
  S.cardF = UI.dataCard(f, { id: 'b6f', fields: [
    { key: 'x', es: 'x (m)', en: 'x (m)', num: true, req: true, aliases: ['coordx', 'este'] },
    { key: 'y', es: 'y (m)', en: 'y (m)', num: true, req: true, aliases: ['coordy', 'norte'] },
    { key: 'especie', es: 'Especie', en: 'Species', aliases: ['species'] },
    { key: 'dap', es: 'DAP (cm)', en: 'DBH (cm)', num: true, aliases: ['dbh', 'd'] },
    { key: 'grupo', es: 'Grupo (piso, cohorte…)', en: 'Group (storey, cohort…)', aliases: ['group', 'dosel', 'piso'] }],
    examples: [{ id: 'mesofilo', es: 'Bosque mesófilo: parcela mapeada de 50 × 50 m', en: 'Cloud forest: mapped 50 × 50 m plot', d: ['196 tallos con coordenadas: el dosel (casi regular) y el sotobosque (agregado).', '196 stems with coordinates: the canopy (almost regular) and the understorey (clustered).'], rows: () => FPData.rows('mesofilo_mapeada').map(r => ({ x: r.x, y: r.y, especie: r.especie, dap: r.dap, grupo: r.dosel })) }],
    onData: rows => { S.pts = rows; const g = el('b6grp'); g.innerHTML = `<option value=""${optL('Todos', 'All')}</option>` + [...new Set(rows.map(r => r.grupo).filter(Boolean))].map(v => `<option>${esc(v)}</option>`).join(''); runSpatial(); } });
  R.spat = mk('div', { class: 'res-host' }); f.appendChild(R.spat);
  UI.method(f, { text: [
    '<p><b>Clark y Evans:</b> R = d̄<sub>obs</sub>/d̄<sub>esp</sub>, con d̄<sub>obs</sub> la distancia media al vecino más cercano y d̄<sub>esp</sub> = 1/(2√λ) bajo aleatoriedad espacial completa; R &lt; 1 indica agregación y R &gt; 1 regularidad. La corrección de Donnelly (1978) suma (0.0514 + 0.0412/√n)·P/n al valor esperado por el efecto del borde (P = perímetro). z = (R − 1)/EE con EE de d̄<sub>obs</sub> = √((4 − π)A/(4π))/n. <b>K de Ripley</b> con corrección por traslación: K(r) = A/(n(n − 1)) Σ<sub>i≠j</sub> 1(d<sub>ij</sub> ≤ r)·A/((W − |Δx|)(H − |Δy|)); L(r) = √(K/π), y L(r) − r por arriba de la envolvente indica agregación a esa escala, por debajo, regularidad. La envolvente es la mínima y la máxima de L(r) − r en simulaciones de aleatoriedad completa con el mismo número de árboles.</p>',
    '<p><b>Clark and Evans:</b> R = d̄<sub>obs</sub>/d̄<sub>exp</sub>, with d̄<sub>obs</sub> the mean nearest-neighbour distance and d̄<sub>exp</sub> = 1/(2√λ) under complete spatial randomness; R &lt; 1 means clustering and R &gt; 1 regularity. Donnelly\'s (1978) correction adds (0.0514 + 0.0412/√n)·P/n to the expected value for the edge effect (P = perimeter). z = (R − 1)/SE with the SE of d̄<sub>obs</sub> = √((4 − π)A/(4π))/n. <b>Ripley\'s K</b> with the translation correction: K(r) = A/(n(n − 1)) Σ<sub>i≠j</sub> 1(d<sub>ij</sub> ≤ r)·A/((W − |Δx|)(H − |Δy|)); L(r) = √(K/π), and L(r) − r above the envelope means clustering at that scale, below it, regularity. The envelope is the minimum and maximum of L(r) − r in simulations of complete randomness with the same number of trees.</p>'],
    refs: ['Clark, P. J. y Evans, F. C. (1954). Distance to nearest neighbor as a measure of spatial relationships in populations. <i>Ecology</i> 35:445–453.', 'Donnelly, K. P. (1978). Simulations to determine the variance and edge effect of total nearest neighbour distance. En <i>Simulation Methods in Archaeology</i>, pp. 91–95. Cambridge University Press.', 'Ripley, B. D. (1977). Modelling spatial patterns. <i>J. R. Stat. Soc. B</i> 39:172–212.', 'Ohser, J. (1983). On estimators for the reduced second moment measure of point processes. <i>Math. Operationsforsch. Statist.</i> 14:63–71.', 'Baddeley, A., Rubak, E. y Turner, R. (2015). <i>Spatial Point Patterns: Methodology and Applications with R</i>. CRC Press.'] });
}

/* ---------------- A: community ---------------- */
function runAll() { drawComm(); drawIdx(); drawHill(); drawSim(); drawVert(); state.diversity = { sites: S.comm.sites.length, species: S.comm.species.length }; Report.set(6, true); refreshStepMarks(); }
function drawComm() {
  R.comm.innerHTML = '';
  const c = S.comm, N = c.M.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);
  UI.tiles(R.comm.appendChild(mk('div')), [
    [['Sitios', 'Sites'], String(c.sites.length), [new Set(c.groups.filter(Boolean)).size + ' grupos', new Set(c.groups.filter(Boolean)).size + ' groups']],
    [['Especies', 'Species'], String(c.species.length)], [['Individuos', 'Individuals'], fmtNum(N, 0)],
  ]);
  const cols = [{ key: 'site', label: ['Sitio', 'Site'] }, { key: 'grp', label: ['Grupo', 'Group'] }].concat(c.species.map((sp, j) => ({ key: 's' + j, label: sp, num: true, get: r => r.v[j] })));
  UI.table(R.comm, { title: ['Matriz de sitios por especies', 'Sites by species matrix'], file: 'forestpro_matriz_comunidad', columns: cols, rows: c.sites.map((s, i) => ({ site: s, grp: c.groups[i], v: c.M[i] })), limit: 30 });
}
function sendTo(app) {
  if (!S.comm) { if (window.LABG) LABG.toast(T('Primero carga una comunidad.', 'Load a community first.')); return; }
  const c = S.comm;
  const header = [T('sitio', 'site'), T('grupo', 'group')].concat(c.species);
  download(DataIO.toCSV(header, c.sites.map((s, i) => [s, c.groups[i]].concat(c.M[i]))), 'forestpro_matriz_para_' + app.toLowerCase() + '.csv', 'text/csv;charset=utf-8');
  window.open(SUITE + app + '/', '_blank', 'noopener');
}

/* ---------------- B: indices ---------------- */
function drawIdx() {
  R.idx.innerHTML = '';
  const c = S.comm, tot = c.species.map((_, j) => c.M.reduce((s, r) => s + r[j], 0));
  const rows = c.sites.map((s, i) => Object.assign({ site: s, grp: c.groups[i] }, DV().indices(c.M[i])));
  const all = Object.assign({ site: T('Todos los sitios', 'All sites'), grp: '', _class: 'row-total' }, DV().indices(tot));
  UI.tiles(R.idx.appendChild(mk('div')), [
    [['Riqueza observada', 'Observed richness'], String(all.S), ['Chao1 = ' + n1(all.chao1) + ' · ACE = ' + n1(all.ace), 'Chao1 = ' + n1(all.chao1) + ' · ACE = ' + n1(all.ace)]],
    [['Shannon H′', 'Shannon H′'], n3(all.H), ['exp(H′) = ' + n1(all.expH) + ' especies efectivas', 'exp(H′) = ' + n1(all.expH) + ' effective species']],
    [['Simpson 1 − λ', 'Simpson 1 − λ'], n3(all.giniSimpson), ['1/λ = ' + n1(all.invSimpson), '1/λ = ' + n1(all.invSimpson)]],
    [['Pielou J', 'Pielou J'], n3(all.pielou)], [['α de Fisher', "Fisher's α"], n2(all.fisher)],
    [['Cobertura de la muestra', 'Sample coverage'], fmtPct(100 * all.coverage, 1), null, all.coverage > 0.95 ? 'ok' : 'warn'],
  ]);
  UI.table(R.idx, { title: ['Índices por sitio', 'Indices by site'], file: 'forestpro_indices_diversidad', columns: [
    { key: 'site', label: ['Sitio', 'Site'] }, { key: 'grp', label: ['Grupo', 'Group'] }, { key: 'N', label: ['N'], num: true }, { key: 'S', label: ['S'], num: true },
    { key: 'H', label: ["H′"], num: true, fmt: n3 }, { key: 'giniSimpson', label: ['1 − λ'], num: true, fmt: n3 }, { key: 'invSimpson', label: ['1/λ'], num: true, fmt: n2 },
    { key: 'pielou', label: ['J'], num: true, fmt: n3 }, { key: 'fisher', label: ['α'], num: true, fmt: n2 }, { key: 'margalef', label: ['Margalef'], num: true, fmt: n2 },
    { key: 'chao1', label: ['Chao1'], num: true, fmt: n1 }, { key: 'ace', label: ['ACE'], num: true, fmt: n1 }, { key: 'coverage', label: [T('Cobertura', 'Coverage'), T('Cobertura', 'Coverage')], num: true, fmt: n3 }],
    rows: rows.concat([all]) });
  const sorted = rows.slice().sort((x, y) => y.S - x.S);
  UI.figure(R.idx, { title: ['Riqueza observada y estimada por sitio', 'Observed and estimated richness by site'], svg: Plot.bars({ cats: sorted.map(r => r.site), series: [{ label: T('Observada', 'Observed'), values: sorted.map(r => r.S), color: 'var(--bosque)' }, { label: 'Chao1', values: sorted.map(r => r.chao1), color: 'var(--oro, #D4A848)' }, { label: 'ACE', values: sorted.map(r => r.ace), color: 'var(--corteza)' }], ylab: T('Especies', 'Species'), name: 'b6-riqueza', w: 680, h: 360 }), key: 'b6-rich' });
  UI.interp(R.idx, [`El conjunto tiene ${all.S} especies registradas y se estiman ${n1(all.chao1)} (Chao1): ${all.chao1 - all.S < 0.5 ? 'el muestreo capturó prácticamente todas' : 'faltan unas ' + n1(all.chao1 - all.S) + ' por registrar'}. La cobertura de ${fmtPct(100 * all.coverage, 1)} dice que solo ${fmtPct(100 * (1 - all.coverage), 1)} de los individuos de la comunidad pertenecen a especies aún no vistas. Con J = ${n2(all.pielou)}, ${all.pielou > 0.8 ? 'los individuos se reparten de forma equitativa' : 'unas pocas especies dominan'}.`,
    `The set has ${all.S} recorded species and ${n1(all.chao1)} are estimated (Chao1): ${all.chao1 - all.S < 0.5 ? 'sampling captured practically all of them' : 'about ' + n1(all.chao1 - all.S) + ' remain to be recorded'}. The coverage of ${fmtPct(100 * all.coverage, 1)} says that only ${fmtPct(100 * (1 - all.coverage), 1)} of the individuals of the community belong to species not yet seen. With J = ${n2(all.pielou)}, ${all.pielou > 0.8 ? 'individuals are evenly spread' : 'a few species dominate'}.`]);
}

/* ---------------- C: Hill, rarefaction, accumulation ---------------- */
function groupVectors() {
  const c = S.comm, groups = [...new Set(c.groups.filter(Boolean))];
  const tot = c.species.map((_, j) => c.M.reduce((s, r) => s + r[j], 0));
  const out = [{ name: T('Todos', 'All'), x: tot }];
  if (groups.length > 1 && groups.length <= 8) groups.forEach(g => out.push({ name: g, x: c.species.map((_, j) => c.M.reduce((s, r, i) => s + (c.groups[i] === g ? r[j] : 0), 0)) }));
  return out;
}
function drawHill() {
  R.hill.innerHTML = '';
  const gv = groupVectors(), qs = Array.from({ length: 31 }, (_, i) => i / 10);
  const two = mk('div', { class: 'figs-2' }); R.hill.appendChild(two);
  UI.figure(two, { title: ['Perfil de diversidad de Hill', 'Hill diversity profile'], svg: Plot.xy({ series: gv.map((g, k) => ({ type: 'line', x: qs, y: qs.map(q => DV().hill(g.x, q)), color: k ? Plot.color(k) : 'var(--fig-ink)', width: k ? 2 : 2.8, label: g.name })), xlab: T('Orden q', 'Order q'), ylab: T('Especies efectivas', 'Effective species'), name: 'b6-hill', w: 520, h: 360, zeroY: true }), key: 'b6-hill' });
  const ser = [];
  gv.forEach((g, k) => {
    const n = g.x.reduce((s, v) => s + v, 0);
    const ms = Array.from({ length: 60 }, (_, i) => Math.max(1, Math.round((i + 1) * 2 * n / 60)));
    const rf = DV().rarefy(g.x, ms);
    const col = k ? Plot.color(k) : 'var(--fig-ink)';
    ser.push({ type: 'line', x: rf.filter(r => r.m <= n).map(r => r.m), y: rf.filter(r => r.m <= n).map(r => r.S), color: col, width: 2.4, label: g.name });
    ser.push({ type: 'line', x: rf.filter(r => r.m >= n).map(r => r.m), y: rf.filter(r => r.m >= n).map(r => r.S), color: col, width: 2, dash: '5 4' });
    ser.push({ type: 'points', x: [n], y: [g.x.filter(v => v > 0).length], color: col, r: 4.5 });
  });
  UI.figure(two, { title: ['Rarefacción (continua) y extrapolación (punteada)', 'Rarefaction (solid) and extrapolation (dashed)'], svg: Plot.xy({ series: ser, xlab: T('Individuos', 'Individuals'), ylab: T('Especies', 'Species'), name: 'b6-rarefaccion', w: 520, h: 360, zeroY: true, zeroX: true }), key: 'b6-rare' });
  const ac = DV().accumulate(S.comm.M.map(r => r.map(v => v > 0)));
  UI.figure(R.hill, { title: ['Acumulación de especies por parcela (± 1 DE)', 'Species accumulation by plot (± 1 SD)'], svg: Plot.xy({ series: [{ type: 'band', x: ac.map(a => a.t), y: ac.map(a => a.S - a.sd), y2: ac.map(a => a.S + a.sd), color: 'var(--musgo)', opacity: 0.25 }, { type: 'line', x: ac.map(a => a.t), y: ac.map(a => a.S), color: 'var(--bosque)', width: 2.6 }], xlab: T('Parcelas', 'Plots'), ylab: T('Especies', 'Species'), name: 'b6-acumulacion', w: 620, h: 340, zeroY: true, legend: false }), key: 'b6-accum' });
  UI.table(R.hill, { title: ['Diversidad observada y asintótica', 'Observed and asymptotic diversity'], file: 'forestpro_hill', columns: [
    { key: 'name', label: ['Conjunto', 'Set'] }, { key: 'n', label: ['Individuos', 'Individuals'], num: true },
    { key: 'q0o', label: ['q = 0 obs.'], num: true }, { key: 'q0', label: ['q = 0 asint.', 'q = 0 asymp.'], num: true, fmt: n1 },
    { key: 'q1o', label: ['q = 1 obs.'], num: true, fmt: n2 }, { key: 'q1', label: ['q = 1 asint.', 'q = 1 asymp.'], num: true, fmt: n2 },
    { key: 'q2o', label: ['q = 2 obs.'], num: true, fmt: n2 }, { key: 'q2', label: ['q = 2 asint.', 'q = 2 asymp.'], num: true, fmt: n2 }, { key: 'cov', label: ['Cobertura', 'Coverage'], num: true, fmt: n3 }],
    rows: gv.map(g => { const a = DV().asymptotic(g.x); return { name: g.name, n: g.x.reduce((s, v) => s + v, 0), q0o: g.x.filter(v => v > 0).length, q0: a.q0, q1o: DV().hill(g.x, 1), q1: a.q1, q2o: DV().hill(g.x, 2), q2: a.q2, cov: DV().coverage(g.x) }; }) });
  const last = ac[ac.length - 1], prev = ac[ac.length - 2] || last;
  UI.interp(R.hill, [`La última parcela agregó en promedio ${n2(last.S - prev.S)} especies: ${last.S - prev.S < 0.5 ? 'la curva de acumulación ya se aplana; más parcelas apenas agregarían especies.' : 'la curva aún sube; más parcelas seguirían agregando especies.'} En el perfil de Hill, la caída de q = 0 a q = 2 mide la dominancia: el número efectivo de especies abundantes es mucho menor que la riqueza cuando dominan unas pocas.`,
    `The last plot added on average ${n2(last.S - prev.S)} species: ${last.S - prev.S < 0.5 ? 'the accumulation curve is already levelling off; more plots would hardly add species.' : 'the curve is still rising; more plots would keep adding species.'} In the Hill profile, the drop from q = 0 to q = 2 measures dominance: the effective number of abundant species is much smaller than richness when a few dominate.`]);
}

/* ---------------- D: similarity ---------------- */
/* axis limits with room on the right for the labels of the points */
const padLim = (v, lo, hi) => { const a = Math.min(...v), b = Math.max(...v), r = (b - a) || 1; return [a - lo * r, b + hi * r]; };
function drawSim() {
  R.sim.innerHTML = '';
  const c = S.comm, method = el('b6dist').value;
  if (c.sites.length < 3) { showMessage(R.sim, 'info', L2('Hacen falta al menos 3 sitios.', 'At least 3 sites are needed.')); return; }
  const Dm = DV().dissim(c.M, method);
  const up = DV().upgma(Dm);
  const groups = [...new Set(c.groups.filter(Boolean))];
  const gIdx = c.groups.map(g => Math.max(0, groups.indexOf(g)));
  UI.figure(R.sim, { title: [`Disimilitud entre sitios (${method === 'bray' ? 'Bray–Curtis' : method === 'jaccard' ? 'Jaccard' : 'Sørensen'})`, `Dissimilarity among sites (${method === 'bray' ? 'Bray–Curtis' : method === 'jaccard' ? 'Jaccard' : 'Sørensen'})`], svg: Plot.heat({ M: Dm, labels: c.sites, min: 0, max: 1, rev: true, name: 'b6-disimilitud', cbTitle: T('disimilitud', 'dissimilarity') }), key: 'b6-heat' });
  const two = mk('div', { class: 'figs-2' }); R.sim.appendChild(two);
  UI.figure(two, { title: [`UPGMA (correlación cofenética ${n3(up.cophCor)})`, `UPGMA (cophenetic correlation ${n3(up.cophCor)})`], svg: Plot.dendro({ merges: up.merges, labels: c.sites, groups: groups.length > 1 ? gIdx : null, xlab: T('Disimilitud', 'Dissimilarity'), name: 'b6-upgma', w: 520 }), key: 'b6-dendro' });
  const nm = DV().nmds(Dm, { starts: 20, seed: 11 });
  const ser = (groups.length > 1 ? groups : ['']).map((g, k) => { const idx = c.sites.map((_, i) => i).filter(i => !g || c.groups[i] === g); return { type: 'points', x: idx.map(i => nm.X[i][0]), y: idx.map(i => nm.X[i][1]), color: Plot.color(k), label: g || T('Sitios', 'Sites'), r: 5, titles: idx.map(i => c.sites[i]) }; });
  ser.push({ type: 'text', x: nm.X.map(p => p[0]), y: nm.X.map(p => p[1]), labels: c.sites });
  UI.figure(two, { title: [`NMDS (estrés = ${n3(nm.stress)})`, `NMDS (stress = ${n3(nm.stress)})`], svg: Plot.xy({ series: ser, xlab: 'NMDS 1', ylab: 'NMDS 2', name: 'b6-nmds', w: 520, h: 440, equal: true, xlim: padLim(nm.X.map(p => p[0]), 0.06, 0.2), ylim: padLim(nm.X.map(p => p[1]), 0.08, 0.1) }), key: 'b6-nmds' });
  /* mean dissimilarity within and between groups */
  if (groups.length > 1) {
    let wi = 0, nw = 0, be = 0, nb = 0;
    for (let i = 0; i < Dm.length; i++) for (let j = 0; j < i; j++) { if (c.groups[i] === c.groups[j]) { wi += Dm[i][j]; nw++; } else { be += Dm[i][j]; nb++; } }
    UI.interp(R.sim, [`La disimilitud media dentro de un mismo grupo es ${n3(wi / nw)} y entre grupos ${n3(be / nb)}: ${be / nb > wi / nw * 1.15 ? 'los grupos tienen composiciones distintas, y la ordenación los separa.' : 'los grupos se parecen; la composición cambia poco entre ellos.'} El estrés de ${n3(nm.stress)} indica una representación ${nm.stress < 0.1 ? 'buena' : nm.stress < 0.2 ? 'aceptable' : 'pobre'} en dos dimensiones.`,
      `The mean dissimilarity within a group is ${n3(wi / nw)} and between groups ${n3(be / nb)}: ${be / nb > wi / nw * 1.15 ? 'the groups have different compositions, and the ordination separates them.' : 'the groups are alike; composition changes little among them.'} The stress of ${n3(nm.stress)} means a ${nm.stress < 0.1 ? 'good' : nm.stress < 0.2 ? 'fair' : 'poor'} representation in two dimensions.`]);
  }
  state.diversity = Object.assign(state.diversity || {}, { nmdsStress: nm.stress, cophCor: up.cophCor });
}

/* ---------------- E: vertical structure ---------------- */
function drawVert() {
  R.vert.innerHTML = '';
  if (!S.heights || S.heights.length < 10) { showMessage(R.vert, 'info', L2('La estructura vertical necesita la altura de los individuos.', 'The vertical structure needs the height of the individuals.')); return; }
  const pz = DV().pretzsch(S.heights);
  const groups = [...new Set(S.heights.map(t => t.g).filter(Boolean))];
  const rows = [{ name: T('Todos', 'All'), r: pz }].concat(groups.length > 1 && groups.length <= 8 ? groups.map(g => ({ name: g, r: DV().pretzsch(S.heights.filter(t => t.g === g)) })) : []);
  UI.tiles(R.vert.appendChild(mk('div')), [
    [['A de Pretzsch', "Pretzsch's A"], n3(pz.A), ['A máx. = ' + n3(pz.Amax), 'A max = ' + n3(pz.Amax)]],
    [['A relativo', 'Relative A'], fmtPct(pz.Arel, 1)], [['Altura máxima', 'Maximum height'], n1(pz.hmax) + ' m'],
  ]);
  UI.table(R.vert, { title: ['Índice de Pretzsch por grupo', "Pretzsch's index by group"], file: 'forestpro_pretzsch', columns: [
    { key: 'name', label: ['Grupo', 'Group'] }, { key: 'N', label: ['Individuos', 'Individuals'], num: true, get: x => x.r.N }, { key: 'S', label: ['Especies', 'Species'], num: true, get: x => x.r.S },
    { key: 'A', label: ['A'], num: true, get: x => n3(x.r.A), raw: x => x.r.A }, { key: 'Amax', label: ['A máx.', 'A max'], num: true, get: x => n3(x.r.Amax), raw: x => x.r.Amax }, { key: 'Arel', label: ['A rel. (%)'], num: true, get: x => n1(x.r.Arel), raw: x => x.r.Arel },
    { key: 'z1', label: ['Zona I', 'Zone I'], num: true, get: x => x.r.byZone[0] }, { key: 'z2', label: ['Zona II', 'Zone II'], num: true, get: x => x.r.byZone[1] }, { key: 'z3', label: ['Zona III', 'Zone III'], num: true, get: x => x.r.byZone[2] }], rows });
  /* species in each zone (top species) */
  const cnt = new Map();
  S.heights.forEach(t => { if (!cnt.has(t.sp)) cnt.set(t.sp, [0, 0, 0]); cnt.get(t.sp)[pz.zone(t.h)]++; });
  const top = [...cnt.entries()].sort((a, b) => b[1].reduce((s, v) => s + v, 0) - a[1].reduce((s, v) => s + v, 0)).slice(0, 10);
  UI.figure(R.vert, { title: ['Individuos por zona de altura (10 especies más abundantes)', 'Individuals by height zone (10 most abundant species)'], svg: Plot.bars({ cats: top.map(x => x[0]), stacked: true, series: [
    { label: T('Zona I (> 80 % de Hmáx)', 'Zone I (> 80 % of Hmax)'), values: top.map(x => x[1][0]), color: 'var(--bosque)' }, { label: T('Zona II (50–80 %)', 'Zone II (50–80 %)'), values: top.map(x => x[1][1]), color: 'var(--musgo)' }, { label: T('Zona III (≤ 50 %)', 'Zone III (≤ 50 %)'), values: top.map(x => x[1][2]), color: '#C2A83E' }],
    ylab: T('Individuos', 'Individuals'), name: 'b6-zonas', w: 680, h: 380 }), key: 'b6-zones' });
  const hs = DV().heightStrata(S.heights.map(t => t.h));
  const st = [0, 0, 0]; S.heights.forEach(t => st[hs.cls(t.h)]++);
  UI.table(R.vert, { title: ['Estratos por la media y la desviación estándar de la altura', 'Strata from the mean and SD of height'], file: 'forestpro_estratos_altura', columns: [
    { key: 'k', label: ['Estrato', 'Stratum'] }, { key: 'lim', label: ['Alturas (m)', 'Heights (m)'] }, { key: 'n', label: ['Individuos', 'Individuals'], num: true }],
    rows: [{ k: T('Inferior', 'Lower'), lim: '< ' + n1(hs.lo), n: st[0] }, { k: T('Medio', 'Middle'), lim: n1(hs.lo) + ' – ' + n1(hs.hi), n: st[1] }, { k: T('Superior', 'Upper'), lim: '≥ ' + n1(hs.hi), n: st[2] }] });
  UI.interp(R.vert, [`El índice A relativo de ${fmtPct(pz.Arel, 0)} dice que ${pz.Arel > 70 ? 'las especies se reparten en varios pisos: el bosque tiene una estructura vertical compleja' : 'pocas especies ocupan cada piso: la estructura vertical es simple'}. ${pz.byZone[0]} individuos (${fmtPct(100 * pz.byZone[0] / pz.N, 0)}) forman el dosel superior.`,
    `The relative A of ${fmtPct(pz.Arel, 0)} says that ${pz.Arel > 70 ? 'species spread over several storeys: the forest has a complex vertical structure' : 'few species fill each storey: the vertical structure is simple'}. ${pz.byZone[0]} individuals (${fmtPct(100 * pz.byZone[0] / pz.N, 0)}) form the upper canopy.`]);
}

/* ---------------- F: spatial pattern ---------------- */
async function runSpatial() {
  R.spat.innerHTML = '';
  const W = +el('b6W').value, H = +el('b6H').value, rmax = +el('b6rmax').value, nsim = Math.max(19, Math.min(999, +el('b6nsim').value || 99)), g = el('b6grp').value;
  const sel = S.pts.filter(p => (!g || p.grupo === g) && p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H);
  const out = S.pts.length - S.pts.filter(p => p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H).length;
  if (out) showMessage(R.spat, 'warning', L2(`${out} árboles quedan fuera del rectángulo de ${W} × ${H} m y no se usan.`, `${out} trees fall outside the ${W} × ${H} m rectangle and are not used.`));
  if (sel.length < 10) { showMessage(R.spat, 'info', L2('Hacen falta al menos 10 árboles.', 'At least 10 trees are needed.')); return; }
  const pts = sel.map(p => ({ x: p.x, y: p.y }));
  const rs = Array.from({ length: 40 }, (_, i) => (i + 1) * rmax / 40);
  let env = null;
  await runWork(T('Simulando la aleatoriedad espacial…', 'Simulating spatial randomness…'), async () => { env = DV().csrEnvelope(pts.length, W, H, rs, nsim, 2026); });
  const ce = DV().clarkEvans(pts, W, H), K = DV().ripleyK(pts, W, H, rs);
  S.spat = { ce, K, env, n: pts.length, g };
  UI.tiles(R.spat.appendChild(mk('div')), [
    [['Clark–Evans R', 'Clark–Evans R'], n3(ce.R), ['z = ' + n2(ce.z) + ' · p ' + (ce.p < 0.001 ? '< 0.001' : '= ' + n3(ce.p)), 'z = ' + n2(ce.z) + ' · p ' + (ce.p < 0.001 ? '< 0.001' : '= ' + n3(ce.p))], ce.p < 0.05 ? (ce.R < 1 ? 'warn' : 'ok') : null],
    [['R con corrección de Donnelly', 'R with Donnelly correction'], n3(ce.Rd), ['p ' + (ce.pd < 0.001 ? '< 0.001' : '= ' + n3(ce.pd)), 'p ' + (ce.pd < 0.001 ? '< 0.001' : '= ' + n3(ce.pd))]],
    [['Densidad', 'Density'], fmtNum(ce.lambda * 10000, 0) + T(' árb/ha', ' trees/ha'), [pts.length + ' árboles', pts.length + ' trees']],
  ]);
  const two = mk('div', { class: 'figs-2' }); R.spat.appendChild(two);
  const pal = UI.speciesColors(sel.map(p => p.especie || ''), 8);
  const dmax = Math.max(...sel.map(p => p.dap || 10));
  UI.figure(two, { title: ['Mapa de tallos (tamaño según el DAP)', 'Stem map (size by DBH)'], svg: Plot.xy({ series: [{ type: 'points', x: sel.map(p => p.x), y: sel.map(p => p.y), colors: sel.map(p => pal.col(p.especie || '')), sizes: sel.map(p => 2 + 7 * Math.sqrt((p.dap || 10) / dmax)), titles: sel.map(p => (p.especie || '') + (p.dap ? ' · ' + p.dap + ' cm' : '')), opacity: 0.85 }], xlim: [0, W], ylim: [0, H], equal: true, xlab: 'x (m)', ylab: 'y (m)', name: 'b6-mapa-tallos', w: 480, h: 480, legend: false }), key: 'b6-map' });
  const Lr = K.map(k => k.L - k.r);
  UI.figure(two, { title: [`L(r) − r con envolvente de ${env.nsim} simulaciones`, `L(r) − r with an envelope of ${env.nsim} simulations`], svg: Plot.xy({ series: [{ type: 'band', x: rs, y: env.lo, y2: env.hi, color: 'var(--fig-muted)', opacity: 0.22, label: T('Aleatoriedad completa', 'Complete randomness') }, { type: 'hline', y: 0, color: 'var(--fig-muted)' }, { type: 'line', x: rs, y: Lr, color: 'var(--primary)', width: 2.6, label: T('Observado', 'Observed') }], xlab: T('Distancia r (m)', 'Distance r (m)'), ylab: 'L(r) − r (m)', name: 'b6-ripley', w: 520, h: 380, legend: 'bottom' }), key: 'b6-ripley' });
  const above = rs.filter((r, i) => Lr[i] > env.hi[i]), below = rs.filter((r, i) => Lr[i] < env.lo[i]);
  UI.interp(R.spat, [`R = ${n3(ce.R)} (${n3(ce.Rd)} con la corrección del borde): ${ce.pd < 0.05 ? (ce.Rd < 1 ? 'los árboles están más agregados' : 'los árboles están más regularmente espaciados') + ' que al azar' : 'no se distingue de un patrón al azar'} según el vecino más cercano. ` + (above.length ? `L(r) − r supera la envolvente entre ${n1(Math.min(...above))} y ${n1(Math.max(...above))} m: agregación a esas escalas. ` : '') + (below.length ? `Queda por debajo entre ${n1(Math.min(...below))} y ${n1(Math.max(...below))} m: regularidad (competencia) a esas distancias. ` : '') + (!above.length && !below.length ? 'L(r) − r no sale de la envolvente a ninguna distancia.' : ''),
    `R = ${n3(ce.R)} (${n3(ce.Rd)} with the edge correction): ${ce.pd < 0.05 ? (ce.Rd < 1 ? 'the trees are more clustered' : 'the trees are more regularly spaced') + ' than at random' : 'it cannot be told from a random pattern'} by the nearest neighbour. ` + (above.length ? `L(r) − r exceeds the envelope between ${n1(Math.min(...above))} and ${n1(Math.max(...above))} m: clustering at those scales. ` : '') + (below.length ? `It falls below between ${n1(Math.min(...below))} and ${n1(Math.max(...below))} m: regularity (competition) at those distances. ` : '') + (!above.length && !below.length ? 'L(r) − r does not leave the envelope at any distance.' : '')]);
  state.diversity = Object.assign(state.diversity || {}, { spatial: { R: ce.R, Rd: ce.Rd, p: ce.pd } });
  Report.set(6, true); refreshStepMarks();
}

ExampleHooks['mesofilo:6'] = () => { build(); S.cardA.load('mesofilo'); S.cardF.load('mesofilo'); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('langchange', () => { if (!el('b6root')) return; if (S.comm) { drawComm(); drawIdx(); drawHill(); drawSim(); drawVert(); } if (S.spat) runSpatial(); });
})();
