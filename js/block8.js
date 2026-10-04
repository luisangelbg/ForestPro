/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — Block 8: maps and light geoprocessing. */
(function () {
'use strict';
const S = { polygons: [], plots: [], trees: [], grid: [], raster: null, pts: null };
const R = {};
let map = null;
const GE = () => window.Geo;
const n0 = v => fmtNum(v, 0), n1 = v => fmtNum(v, 1), n2 = v => fmtNum(v, 2);
const sig = v => Math.abs(v) >= 1000 ? fmtNum(v, 0) : fmtSig(v, 4).replace(/<[^>]+>/g, '');

function build() {
  const root = el('b8root');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.appendChild(mk('p', { class: 'panel-intro' }, L2('Las parcelas y los árboles en su lugar, las áreas de los polígonos, la cuadrícula para levantar un inventario nuevo, la exportación para el GPS y la interpolación de una variable entre parcelas. Todo se calcula aquí; el fondo de mapa en línea es opcional.',
    'The plots and trees in their place, the areas of the polygons, the grid for laying out a new inventory, the export for the GPS and the interpolation of a variable among plots. Everything is computed here; the online map background is optional.')));

  /* A. the map */
  const a = UI.section(root, ['El mapa', 'The map'], ['Arrastra para moverte; rueda, botones o teclas + y − para acercarte. Las parcelas se dibujan con su radio real; los árboles aparecen al acercarte.', 'Drag to move; wheel, buttons or + and − keys to zoom. Plots are drawn with their true radius; trees appear as you zoom in.']);
  const src = mk('div', { class: 'src-row' });
  src.innerHTML = `<select id="b8ex" aria-label="${esc(T('Ejemplo', 'Example'))}"><option value="mesofilo"${optL('Bosque mesófilo: parcelas y predio', 'Cloud forest: plots and property')}</option><option value="cafetal"${optL('Cafetal: parcelas de 5 fincas', 'Coffee farm: plots of 5 farms')}</option></select>`;
  const exB = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cargar ejemplo', 'Load example'));
  exB.addEventListener('click', () => loadExample(el('b8ex').value));
  const invB = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Usar el inventario del Bloque 3', 'Use the Block 3 inventory'));
  invB.addEventListener('click', () => { fromInventory(); refresh(true); });
  const imp = mk('label', { class: 'btn btn-ghost btn-sm', for: 'b8imp', tabindex: '0', role: 'button' }, L2('Importar GPX, KML o GeoJSON…', 'Import GPX, KML or GeoJSON…'));
  const impIn = mk('input', { type: 'file', id: 'b8imp', class: 'sr-only', accept: '.gpx,.kml,.geojson,.json' });
  impIn.addEventListener('change', importFile);
  src.append(exB, invB, imp, impIn);
  a.appendChild(src);
  const lay = mk('div', { class: 'btn-row' });
  lay.innerHTML = [['b8lPlots', 'Parcelas', 'Plots', true], ['b8lTrees', 'Árboles', 'Trees', true], ['b8lPoly', 'Polígonos', 'Polygons', true], ['b8lGrid', 'Cuadrícula', 'Grid', true], ['b8lRaster', 'Interpolación', 'Interpolation', true]]
    .map(([id, es, en, on]) => `<label class="checkbox-label"><input type="checkbox" id="${id}"${on ? ' checked' : ''}> ${L2(es, en)}</label>`).join('') +
    `<label class="checkbox-label"><input type="checkbox" id="b8tiles"> ${L2('Fondo de OpenStreetMap (pide teselas a internet)', 'OpenStreetMap background (requests tiles from the internet)')}</label>`;
  a.appendChild(lay);
  ['b8lPlots', 'b8lTrees', 'b8lPoly', 'b8lGrid', 'b8lRaster'].forEach(id => el(id).addEventListener('change', () => refresh()));
  el('b8tiles').addEventListener('change', e => { map.setTiles(e.target.checked); if (e.target.checked) { clearMessages(R.msgA); showMessage(R.msgA, 'info', L2('Fondo encendido: el navegador pide las teselas del área visible a los servidores de OpenStreetMap. Tus datos no se envían. Si abriste la app con doble clic, algunos servidores pueden negar las teselas; en línea funciona.', 'Background on: the browser requests the tiles of the visible area from the OpenStreetMap servers. Your data are not sent. If you opened the app with a double click, some servers may refuse the tiles; online it works.')); } });
  R.msgA = mk('div', { class: 'messages' }); a.appendChild(R.msgA);
  const mh = mk('div'); a.appendChild(mh);
  map = MapView.create(mh, { center: [19.5, -97.03], zoom: 11, onDrawEnd: ring => { if (ring) { S.polygons.push({ name: T('Polígono ', 'Polygon ') + (S.polygons.length + 1), ring }); drawPolys(); refresh(); saved(); } el('b8draw').hidden = false; el('b8end').hidden = true; } });
  const dr = mk('div', { class: 'btn-row' });
  dr.innerHTML = `<button type="button" class="btn btn-secondary btn-sm" id="b8draw">${L2('Dibujar un polígono', 'Draw a polygon')}</button><button type="button" class="btn btn-primary btn-sm" id="b8end" hidden>${L2('Terminar el polígono', 'Finish the polygon')}</button><span class="hint" style="margin:0">${L2('Clic para cada vértice; doble clic o «Terminar» para cerrarlo; Esc cancela.', 'Click for each vertex; double click or «Finish» to close it; Esc cancels.')}</span>`;
  a.appendChild(dr);
  el('b8draw').addEventListener('click', () => { map.startDraw(); el('b8draw').hidden = true; el('b8end').hidden = false; });
  el('b8end').addEventListener('click', () => map.finishDraw());
  R.static = mk('div', { class: 'res-host' }); a.appendChild(R.static);
  UI.method(a, { text: [
    '<p>Proyección de Mercator esférica a niveles de zoom enteros, la de los mapas web. Sin fondo, el mapa muestra una retícula de latitud y longitud y nada sale de tu equipo. Con el fondo encendido, el navegador pide las teselas del área visible a los servidores de OpenStreetMap, cuyos datos tienen licencia ODbL y piden la atribución que aparece en la esquina. Los árboles se ubican sumando sus coordenadas locales (x hacia el este, y hacia el norte, en metros) al centro de su parcela en UTM. El mapa estático de abajo, en UTM, es el que va al informe y al estudio de figuras.</p>',
    '<p>Spherical Mercator projection at integer zoom levels, as web maps use. With no background the map shows a latitude and longitude graticule and nothing leaves your computer. With the background on, the browser requests the tiles of the visible area from the OpenStreetMap servers, whose data are licensed ODbL and require the attribution shown in the corner. Trees are placed by adding their local coordinates (x to the east, y to the north, in metres) to the centre of their plot in UTM. The static map below, in UTM, is the one that goes into the report and the figure studio.</p>'],
    refs: ['Snyder, J. P. (1987). <i>Map Projections — A Working Manual</i>. USGS Professional Paper 1395.', 'OpenStreetMap Foundation. Política de uso de teselas y atribución: openstreetmap.org/copyright.'] });

  /* B. polygons */
  const b = UI.section(root, ['Polígonos y áreas', 'Polygons and areas'], ['Superficie y perímetro de cada polígono en la zona UTM de su centro y sobre la esfera.', 'Area and perimeter of each polygon in the UTM zone of its centre and on the sphere.']);
  UI.dataCard(b, { id: 'b8p', fields: [
    { key: 'poligono', es: 'Polígono', en: 'Polygon', req: true, aliases: ['polygon', 'nombre', 'predio'] },
    { key: 'lat', es: 'Latitud', en: 'Latitude', num: true, req: true, aliases: ['latitude', 'y'] },
    { key: 'lon', es: 'Longitud', en: 'Longitude', num: true, req: true, aliases: ['longitude', 'long', 'x'] }],
    examples: [{ id: 'mesofilo', es: 'Predio del bosque mesófilo (9 vértices)', en: 'Cloud forest property (9 vertices)', d: ['Los vértices del polígono en orden, en grados decimales.', 'The vertices of the polygon in order, in decimal degrees.'], rows: () => FPData.rows('mesofilo_predio').map(r => ({ poligono: T('Predio', 'Property'), lat: r.lat, lon: r.lon })) }],
    onData: rows => { const by = new Map(); rows.forEach(r => { const k = String(r.poligono); if (!by.has(k)) by.set(k, []); by.get(k).push([r.lon, r.lat]); }); by.forEach((ring, name) => { if (ring.length >= 3) S.polygons.push({ name, ring }); }); drawPolys(); refresh(true); } });
  R.polys = mk('div', { class: 'res-host' }); b.appendChild(R.polys);
  UI.method(b, { text: [
    '<p>Área en UTM: fórmula del agrimensor (Gauss) sobre las coordenadas planas de la zona del centro del polígono, la que se usa en catastro e inventario; incluye el factor de escala de la proyección (≤ 0.04 % dentro de la zona). Área sobre la esfera: suma de triángulos esféricos desde el primer vértice por el teorema de L\'Huilier, con radio medio de 6 371 008.8 m; difiere de la del elipsoide unas décimas de punto por ciento según la latitud. Los lados de los polígonos se consideran rectos en UTM y arcos de círculo máximo en la esfera.</p>',
    '<p>UTM area: the surveyor\'s formula (Gauss) on the plane coordinates of the zone of the polygon\'s centre, the one used in cadastre and inventory; it includes the scale factor of the projection (≤ 0.04 % within the zone). Area on the sphere: sum of spherical triangles from the first vertex by L\'Huilier\'s theorem, with a mean radius of 6,371,008.8 m; it differs from that of the ellipsoid by a few tenths of a per cent depending on latitude. Polygon sides are straight in UTM and great-circle arcs on the sphere.</p>'],
    refs: ['Karney, C. F. F. (2011). Transverse Mercator with an accuracy of a few nanometers. <i>Journal of Geodesy</i> 85:475–485.', 'Todhunter, I. (1886). <i>Spherical Trigonometry</i>, 5.ª ed. Macmillan (teorema de L\'Huilier).'] });

  /* C. grid */
  const c = UI.section(root, ['Cuadrícula de muestreo', 'Sampling grid'], ['Los centros de parcela de un muestreo sistemático (o aleatorio) dentro de un polígono, listos para el GPS.', 'The plot centres of a systematic (or random) sample inside a polygon, ready for the GPS.']);
  const cg = mk('div', { class: 'form-grid' });
  cg.innerHTML = `<div class="field"><label for="b8poly">${L2('Polígono', 'Polygon')}</label><select id="b8poly"></select></div>` +
    `<div class="field"><label for="b8kind">${L2('Diseño', 'Design')}</label><select id="b8kind"><option value="grid"${optL('Sistemático (cuadrícula)', 'Systematic (grid)')}</option><option value="random"${optL('Aleatorio', 'Random')}</option></select></div>` +
    [['b8sp', 'Distancia entre puntos (m)', 'Spacing between points (m)', 500], ['b8rot', 'Rotación (°)', 'Rotation (°)', 0], ['b8n', 'Puntos al azar', 'Random points', 30], ['b8rad', 'Radio de la parcela (m)', 'Plot radius (m)', 17.84]]
      .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('') +
    `<label class="checkbox-label"><input type="checkbox" id="b8rstart"> ${L2('Arranque aleatorio de la malla', 'Random start of the grid')}</label>`;
  c.appendChild(cg);
  const gb = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Generar los puntos', 'Generate the points'));
  gb.addEventListener('click', makeGrid);
  c.appendChild(mk('div', { class: 'btn-row' })).appendChild(gb);
  R.grid = mk('div', { class: 'res-host' }); c.appendChild(R.grid);
  UI.method(c, { text: [
    '<p>La malla se arma en UTM con la distancia y la rotación elegidas y se queda con los puntos dentro del polígono (prueba del rayo). El número esperado es la superficie entre la distancia al cuadrado. Con arranque aleatorio, el origen de la malla se sortea dentro de una celda: así cada punto del predio tiene la misma probabilidad de caer en la muestra. El diseño aleatorio sortea puntos uniformes dentro del polígono.</p>',
    '<p>The grid is built in UTM with the chosen spacing and rotation and keeps the points inside the polygon (ray test). The expected number is the area over the spacing squared. With a random start, the origin of the grid is drawn within one cell: that way every point of the property has the same chance of falling in the sample. The random design draws uniform points inside the polygon.</p>'],
    refs: ['Gregoire, T. G. y Valentine, H. T. (2008). <i>Sampling Strategies for Natural Resources and the Environment</i>. Chapman & Hall/CRC.'] });

  /* D. export */
  const d = UI.section(root, ['Exportar', 'Export'], ['Las parcelas, la cuadrícula y los polígonos para el GPS o para un programa de mapas.', 'The plots, the grid and the polygons for the GPS or for a mapping program.']);
  const db = mk('div', { class: 'btn-row' });
  [['gpx', 'GPX'], ['kml', 'KML'], ['geojson', 'GeoJSON'], ['csv', 'CSV']].forEach(([k, lab]) => { const bt = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, '⤓ ' + lab); bt.addEventListener('click', () => exportAll(k)); db.appendChild(bt); });
  d.appendChild(db);
  d.appendChild(mk('p', { class: 'hint' }, L2('Incluye las parcelas cargadas, los puntos de la cuadrícula y los polígonos. GPX y KML se abren en los receptores GPS y en los globos virtuales; GeoJSON, en cualquier programa de mapas.', 'Includes the loaded plots, the grid points and the polygons. GPX and KML open in GPS receivers and virtual globes; GeoJSON, in any mapping program.')));

  /* E. interpolation */
  const e = UI.section(root, ['Interpolación entre parcelas', 'Interpolation among plots'], ['Un mapa continuo de una variable medida en las parcelas: por distancia inversa o por kriging, con el variograma y la validación cruzada.', 'A continuous map of a variable measured in the plots: by inverse distance or by kriging, with the variogram and cross-validation.']);
  const eg = mk('div', { class: 'form-grid' });
  eg.innerHTML = `<div class="field"><label for="b8var">${L2('Variable', 'Variable')}</label><select id="b8var"></select></div>` +
    `<div class="field"><label for="b8meth">${L2('Método', 'Method')}</label><select id="b8meth"><option value="ok"${optL('Kriging ordinario', 'Ordinary kriging')}</option><option value="sk"${optL('Kriging simple', 'Simple kriging')}</option><option value="idw"${optL('Distancia inversa (IDW)', 'Inverse distance (IDW)')}</option></select></div>` +
    `<div class="field"><label for="b8vm">${L2('Modelo del variograma', 'Variogram model')}</label><select id="b8vm"><option value="sph"${optL('Esférico', 'Spherical')}</option><option value="exp"${optL('Exponencial', 'Exponential')}</option><option value="gau"${optL('Gaussiano', 'Gaussian')}</option></select></div>` +
    [['b8pow', 'Potencia de IDW', 'IDW power', 2], ['b8cut', 'Distancia máxima del variograma (m, vacío = automática)', 'Variogram cutoff (m, empty = automatic)', ''], ['b8res', 'Celdas en el lado largo', 'Cells on the long side', 60]]
      .map(([id, es, en, v]) => `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="any"></div>`).join('') +
    `<label class="checkbox-label"><input type="checkbox" id="b8mask" checked> ${L2('Recortar al primer polígono', 'Clip to the first polygon')}</label>`;
  e.appendChild(eg);
  UI.dataCard(e, { id: 'b8i', fields: [
    { key: 'lat', es: 'Latitud', en: 'Latitude', num: true, req: true, aliases: ['latitude', 'y'] },
    { key: 'lon', es: 'Longitud', en: 'Longitude', num: true, req: true, aliases: ['longitude', 'x'] },
    { key: 'valor', es: 'Valor', en: 'Value', num: true, req: true, aliases: ['value', 'z', 'biomasa', 'area basal'] },
    { key: 'nombre', es: 'Nombre', en: 'Name', aliases: ['name', 'parcela', 'id'] }],
    examples: [
      { id: 'rend', es: 'Cafetal: rendimiento de café pergamino (kg/ha)', en: 'Coffee farm: yield of parchment coffee (kg/ha)', d: ['Las 25 parcelas del cafetal con su rendimiento; varía de una finca a otra.', 'The 25 plots of the coffee farm with their yield; it varies from one farm to another.'], rows: () => FPData.rows('cafetal_parcelas').map(r => ({ lat: r.lat, lon: r.lon, valor: r.rend_cafe, nombre: r.parcela })) },
      { id: 'sombra', es: 'Cafetal: sombra (%)', en: 'Coffee farm: shade (%)', d: ['La cobertura de sombra medida en las 25 parcelas.', 'The shade cover measured in the 25 plots.'], rows: () => FPData.rows('cafetal_parcelas').map(r => ({ lat: r.lat, lon: r.lon, valor: r.sombra_pct, nombre: r.parcela })) }],
    onData: (rows, meta) => {
      const ex = meta && meta.example;
      S.pts = rows.map(r => ({ lat: r.lat, lon: r.lon, z: r.valor, name: r.nombre }));
      const lab = ex === 'rend' ? ['Rendimiento de café (kg/ha)', 'Coffee yield (kg/ha)'] : ex === 'sombra' ? ['Sombra (%)', 'Shade (%)'] : ['Tabla cargada', 'Loaded table'];
      el('b8var').innerHTML = `<option value="custom"${optL(lab[0], lab[1])}</option>`;
      /* the points on the map, so the interpolation has its place */
      if (!S.plots.length || ex) { S.plots = S.pts.map(p => ({ name: p.name, lat: p.lat, lon: p.lon, r: ex ? 17.84 : 0 })); S.trees = []; S.grid = []; S.raster = null; if (ex) S.polygons = []; drawPolys(); refresh(true); }
    } });
  const ib = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Interpolar', 'Interpolate'));
  ib.addEventListener('click', runInterp);
  e.appendChild(mk('div', { class: 'btn-row' })).appendChild(ib);
  R.interp = mk('div', { class: 'res-host' }); e.appendChild(R.interp);
  UI.method(e, { text: [
    '<p>Todo se calcula en metros (UTM). <b>IDW:</b> ẑ = Σwᵢzᵢ/Σwᵢ con wᵢ = 1/dᵢ<sup>p</sup>. <b>Variograma experimental</b> (Matheron): γ(h) = Σ(zᵢ − zⱼ)²/(2N(h)) por intervalos de distancia; por omisión, hasta un tercio de la diagonal de los datos en 15 intervalos. <b>Modelos:</b> esférico, exponencial γ = c₀ + c₁(1 − e<sup>−h/a</sup>) y gaussiano γ = c₀ + c₁(1 − e<sup>−(h/a)²</sup>) (en los dos últimos el alcance práctico es 3a y √3·a), ajustados por mínimos cuadrados ponderados con pesos Nⱼ/hⱼ². <b>Kriging ordinario:</b> media desconocida, resuelve [Γ 1; 1ᵀ 0][λ; μ] = [γ₀; 1]; varianza σ² = Σλᵢγᵢ₀ + μ. <b>Kriging simple:</b> media conocida (la de los datos). La validación cruzada deja fuera cada parcela, la predice con las demás y resume el error medio y su raíz cuadrática media.</p>',
    '<p>Everything is computed in metres (UTM). <b>IDW:</b> ẑ = Σwᵢzᵢ/Σwᵢ with wᵢ = 1/dᵢ<sup>p</sup>. <b>Experimental variogram</b> (Matheron): γ(h) = Σ(zᵢ − zⱼ)²/(2N(h)) by distance classes; by default, up to a third of the diagonal of the data in 15 classes. <b>Models:</b> spherical, exponential γ = c₀ + c₁(1 − e<sup>−h/a</sup>) and Gaussian γ = c₀ + c₁(1 − e<sup>−(h/a)²</sup>) (in the last two the practical range is 3a and √3·a), fitted by weighted least squares with weights Nⱼ/hⱼ². <b>Ordinary kriging:</b> unknown mean, it solves [Γ 1; 1ᵀ 0][λ; μ] = [γ₀; 1]; variance σ² = Σλᵢγᵢ₀ + μ. <b>Simple kriging:</b> known mean (that of the data). Cross-validation leaves out each plot, predicts it with the others and summarises the mean error and its root mean square.</p>'],
    refs: ['Matheron, G. (1963). Principles of geostatistics. <i>Economic Geology</i> 58:1246–1266.', 'Cressie, N. (1985). Fitting variogram models by weighted least squares. <i>Mathematical Geology</i> 17:563–586.', 'Isaaks, E. H. y Srivastava, R. M. (1989). <i>An Introduction to Applied Geostatistics</i>. Oxford University Press.', 'Shepard, D. (1968). A two-dimensional interpolation function for irregularly-spaced data. <i>Proc. ACM National Conference</i>, pp. 517–524.'] });
}

/* ---------------- data ---------------- */
function fromInventory() {
  if (!state.inv) { clearMessages(R.msgA); showMessage(R.msgA, 'info', L2('Todavía no hay inventario: carga uno en el Bloque 3 o un ejemplo aquí.', 'There is no inventory yet: load one in Block 3 or an example here.')); return false; }
  const pl = state.inv.plots.filter(p => isFinite(p.lat) && isFinite(p.lon));
  if (!pl.length) { clearMessages(R.msgA); showMessage(R.msgA, 'warning', L2('Las parcelas del inventario no tienen latitud y longitud.', 'The plots of the inventory have no latitude and longitude.')); return false; }
  const bm = new Map((state.biomass && state.biomass.plots || []).map(p => [p.plot, p]));
  S.plots = pl.map(p => ({ name: p.plot, lat: p.lat, lon: p.lon, r: p.design && p.design.r ? p.design.r : Math.sqrt(Invent.plotArea(p.design || { shape: 'circle', r: 17.84 }, 1e9) / Math.PI), stratum: p.stratum, N: p.N, G: p.G, V: p.V, agb: (bm.get(p.plot) || {}).agb, c: (bm.get(p.plot) || {}).c }));
  /* trees placed from the centre of their plot */
  const ctr = new Map(S.plots.map(p => [p.name, GE().toUTM(p.lat, p.lon)]));
  S.trees = state.inv.trees.filter(t => t.alive && isFinite(t.x) && isFinite(t.y) && ctr.has(t.plot)).map(t => { const u = ctr.get(t.plot), ll = GE().fromUTM(u.E + t.x, u.N + t.y, u.zone, u.south); return { lat: ll.lat, lon: ll.lon, sp: t.especie, d: t.dap }; });
  const vars = [['G', 'Área basal (m²/ha)', 'Basal area (m²/ha)'], ['N', 'Densidad (árb/ha)', 'Density (trees/ha)'], ['V', 'Volumen (m³/ha)', 'Volume (m³/ha)'], ['agb', 'Biomasa aérea (Mg/ha)', 'Aboveground biomass (Mg/ha)'], ['c', 'Carbono (Mg C/ha)', 'Carbon (Mg C/ha)']].filter(([k]) => S.plots.some(p => isFinite(p[k])));
  el('b8var').innerHTML = vars.map(([k, es, en]) => `<option value="${k}"${optL(es, en)}</option>`).join('');
  S.pts = null;
  return true;
}
function loadExample(id) {
  S.polygons = []; S.grid = []; S.raster = null;
  if (id === 'mesofilo') S.polygons.push({ name: T('Predio', 'Property'), ring: FPData.rows('mesofilo_predio').map(r => [r.lon, r.lat]) });
  const hook = ExampleHooks[id + ':3'];
  if (hook) hook();
  setTimeout(() => { goStep(8); fromInventory(); drawPolys(); refresh(true); }, 120);
}
async function importFile() {
  const f = el('b8imp').files[0];
  if (!f) return;
  try {
    const res = GE().parse(await f.text(), f.name);
    res.polygons.forEach(p => S.polygons.push(p));
    res.points.forEach(p => S.plots.push({ name: p.name, lat: p.lat, lon: p.lon, r: 0 }));
    clearMessages(R.msgA); showMessage(R.msgA, 'success', L2(`${res.polygons.length} polígonos y ${res.points.length} puntos importados.`, `${res.polygons.length} polygons and ${res.points.length} points imported.`));
    drawPolys(); refresh(true); saved();
  } catch (err) { clearMessages(R.msgA); showMessage(R.msgA, 'danger', L2('No se pudo leer el archivo como GPX, KML o GeoJSON.', 'The file could not be read as GPX, KML or GeoJSON.')); }
  el('b8imp').value = '';
}

/* ---------------- map layers and the static map ---------------- */
function refresh(fit) {
  if (!map) return;
  map.setLayers({
    polygons: el('b8lPoly').checked ? S.polygons : [],
    circles: el('b8lPlots').checked ? S.plots.map(p => ({ lat: p.lat, lon: p.lon, r: p.r || 0, label: p.name, color: p.r ? null : 'var(--accent)' })) : [],
    points: [].concat(el('b8lTrees').checked ? S.trees.map(t => ({ lat: t.lat, lon: t.lon, minZoom: 15, size: 1.5 + t.d / 25, color: 'var(--bosque)', label: t.sp + ' · ' + t.d + ' cm' })) : [],
      el('b8lGrid').checked ? S.grid.map(g => ({ lat: g.lat, lon: g.lon, size: 2.6, shape: 'square', label: 'G' + g.id })) : []),
    raster: el('b8lRaster').checked && S.raster ? S.raster : null,
  });
  if (fit) map.fit();
  drawStatic();
  if (S.plots.length || S.polygons.length) { state.map = { plots: S.plots.length, polygons: S.polygons.length, grid: S.grid.length }; Report.set(8, true); refreshStepMarks(); }
}
/* the same layers in UTM, as a figure for the report and the studio */
function drawStatic() {
  R.static.innerHTML = '';
  const all = [].concat(S.polygons.flatMap(p => p.ring.map(q => [q[1], q[0]])), S.plots.map(p => [p.lat, p.lon]), S.grid.map(g => [g.lat, g.lon]));
  if (!all.length) return;
  const zone = GE().utmZone(Num.mean(all.map(p => p[1])));
  const U = (lat, lon) => { const u = GE().toUTM(lat, lon, zone); return [u.E, u.N]; };
  const pts = all.map(p => U(p[0], p[1]));
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
  const W = 640, H = 520, m = { l: 88, r: S.raster ? 90 : 20, t: 16, b: 52 };
  const span = Math.max(x1 - x0, y1 - y0) * 1.08 || 100, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const k = Math.min((W - m.l - m.r) / span, (H - m.t - m.b) / span);
  const ex = [cx - (W - m.l - m.r) / 2 / k, cx + (W - m.l - m.r) / 2 / k], ey = [cy - (H - m.t - m.b) / 2 / k, cy + (H - m.t - m.b) / 2 / k];
  const sx = Plot.scale(ex[0], ex[1], m.l, W - m.r), sy = Plot.scale(ey[0], ey[1], H - m.b, m.t);
  const xt = Plot.ticks(ex[0], ex[1], 5), yt = Plot.ticks(ey[0], ey[1], 5);
  xt.labels = v => fmtNum(v / 1000, 1); yt.labels = v => fmtNum(v / 1000, 1);
  let s = Plot.open(W, H, { name: 'b8-mapa' }, { x0: m.l, x1: W - m.r, y0: H - m.b, y1: m.t, ex, ey }, T('Mapa del inventario en UTM', 'Inventory map in UTM'));
  s += Plot.frame({ x0: m.l, x1: W - m.r, y0: H - m.b, y1: m.t, sx, sy, xt, yt, xlab: T('Este UTM (km), zona ', 'UTM easting (km), zone ') + zone, ylab: T('Norte UTM (km)', 'UTM northing (km)'), ylabX: 16 });
  if (S.raster && S.raster.utm) { const r = S.raster.utm; s += `<image href="${S.raster.href}" x="${sx(r.x0).toFixed(1)}" y="${sy(r.y1).toFixed(1)}" width="${(sx(r.x1) - sx(r.x0)).toFixed(1)}" height="${(sy(r.y0) - sy(r.y1)).toFixed(1)}" preserveAspectRatio="none" opacity="0.85" style="image-rendering:pixelated"/>`; }
  S.polygons.forEach(p => { s += `<path d="${p.ring.map((q, i) => { const u = U(q[1], q[0]); return (i ? 'L' : 'M') + sx(u[0]).toFixed(1) + ' ' + sy(u[1]).toFixed(1); }).join('')}Z" style="fill:none;stroke:var(--primary);stroke-width:2"/>`; });
  S.grid.forEach(g => { const u = U(g.lat, g.lon); s += `<rect x="${(sx(u[0]) - 2.4).toFixed(1)}" y="${(sy(u[1]) - 2.4).toFixed(1)}" width="4.8" height="4.8" style="fill:var(--fig-bg);stroke:var(--fig-ink);stroke-width:1"/>`; });
  const strata = [...new Set(S.plots.map(p => p.stratum).filter(Boolean))];
  S.plots.forEach(p => { const u = U(p.lat, p.lon), col = strata.length > 1 ? Plot.color(strata.indexOf(p.stratum)) : 'var(--fig-ink)'; s += `<circle cx="${sx(u[0]).toFixed(1)}" cy="${sy(u[1]).toFixed(1)}" r="4" style="fill:${col};stroke:var(--fig-bg);stroke-width:1"><title>${esc(p.name)}</title></circle>`; });
  /* north arrow and scale */
  s += `<g transform="translate(${W - m.r - 26} ${m.t + 12})"><path d="M0 22L7 0L14 22L7 16Z" style="fill:var(--fig-ink)"/><text x="7" y="34" text-anchor="middle" class="pl-lab" style="font-size:10px">N</text></g>`;
  const q = span / 4, e10 = Math.pow(10, Math.floor(Math.log10(q))), sb = [5, 2, 1].map(f => f * e10).find(v => v <= q) || e10;
  s += `<g><line x1="${m.l + 10}" y1="${H - m.b - 14}" x2="${(m.l + 10 + sb * k).toFixed(1)}" y2="${H - m.b - 14}" style="stroke:var(--fig-ink);stroke-width:3"/><text x="${m.l + 10}" y="${H - m.b - 20}" class="pl-lab" style="font-size:10px">${sb >= 1000 ? sb / 1000 + ' km' : sb + ' m'}</text></g>`;
  if (strata.length > 1) s += Plot.legend(strata.map((st, i) => ({ label: st, color: Plot.color(i), kind: 'pt' })), m.l + 12, m.t + 14);
  if (S.raster) s += Plot.colorbar(W - m.r + 22, m.t + 30, 12, 200, S.raster.lo, S.raster.hi, true, S.raster.title);
  s += '</svg>';
  UI.figure(R.static, { title: ['Mapa estático en UTM (para el informe)', 'Static map in UTM (for the report)'], svg: s, key: 'b8-static' });
}

/* ---------------- B ---------------- */
function drawPolys() {
  R.polys.innerHTML = '';
  const sel = el('b8poly');
  sel.innerHTML = S.polygons.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('');
  if (!S.polygons.length) return;
  const rows = S.polygons.map((p, i) => Object.assign({ i, name: p.name }, GE().polygonStats(p.ring)));
  UI.table(R.polys, { title: ['Polígonos', 'Polygons'], file: 'forestpro_poligonos', columns: [
    { key: 'name', label: ['Polígono', 'Polygon'] }, { key: 'n', label: ['Vértices', 'Vertices'], num: true },
    { key: 'areaUTM', label: ['Área UTM (ha)', 'UTM area (ha)'], num: true, get: r => fmtNum(r.areaUTM / 10000, 3), raw: r => r.areaUTM / 10000 },
    { key: 'areaSphere', label: ['Área en la esfera (ha)', 'Area on the sphere (ha)'], num: true, get: r => fmtNum(r.areaSphere / 10000, 3), raw: r => r.areaSphere / 10000 },
    { key: 'perimUTM', label: ['Perímetro (m)', 'Perimeter (m)'], num: true, fmt: n1 }, { key: 'zone', label: ['Zona UTM', 'UTM zone'], get: r => r.zone + (r.south ? 'S' : 'N') },
    { key: 'cen', label: ['Centroide', 'Centroid'], get: r => r.centroid.lat.toFixed(5) + ', ' + r.centroid.lon.toFixed(5) }], rows });
  const del = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('Quitar el último polígono', 'Remove the last polygon'));
  del.addEventListener('click', () => { S.polygons.pop(); drawPolys(); refresh(); saved(); });
  R.polys.appendChild(mk('div', { class: 'btn-row' })).appendChild(del);
  const p0 = rows[0];
  UI.interp(R.polys, [`«${esc(p0.name)}» mide ${fmtNum(p0.areaUTM / 10000, 2)} ha en UTM (zona ${p0.zone}) y ${fmtNum(p0.areaSphere / 10000, 2)} ha sobre la esfera: la diferencia de ${fmtPct(100 * (p0.areaSphere / p0.areaUTM - 1), 2)} viene de usar una esfera en vez del elipsoide y del factor de escala de la proyección. Para el inventario usa el área UTM.`,
    `«${esc(p0.name)}» measures ${fmtNum(p0.areaUTM / 10000, 2)} ha in UTM (zone ${p0.zone}) and ${fmtNum(p0.areaSphere / 10000, 2)} ha on the sphere: the ${fmtPct(100 * (p0.areaSphere / p0.areaUTM - 1), 2)} difference comes from using a sphere instead of the ellipsoid and from the scale factor of the projection. For the inventory use the UTM area.`]);
}

/* ---------------- C ---------------- */
function makeGrid() {
  R.grid.innerHTML = '';
  const p = S.polygons[+el('b8poly').value];
  if (!p) { showMessage(R.grid, 'info', L2('Primero carga, importa o dibuja un polígono.', 'First load, import or draw a polygon.')); return; }
  const kind = el('b8kind').value, sp = +el('b8sp').value;
  let res;
  if (kind === 'grid') {
    const rs = el('b8rstart').checked, rng = Num.rng(Date.now() % 100000);
    res = GE().grid(p.ring, { spacing: sp, rotation: +el('b8rot').value || 0, offsetX: rs ? rng() : 0.5, offsetY: rs ? rng() : 0.5 });
  } else res = GE().randomPoints(p.ring, Math.max(1, Math.round(+el('b8n').value || 30)), Date.now() % 100000);
  S.grid = res.points;
  const area = GE().polygonStats(p.ring).areaUTM / 10000, rad = +el('b8rad').value || 0;
  UI.tiles(R.grid.appendChild(mk('div')), [
    [['Puntos', 'Points'], String(res.points.length), kind === 'grid' ? ['esperados: ' + n1(res.expected), 'expected: ' + n1(res.expected)] : null],
    [['Superficie', 'Area'], fmtNum(area, 1) + ' ha'],
    rad > 0 ? [['Intensidad de muestreo', 'Sampling intensity'], fmtPct(100 * res.points.length * Math.PI * rad * rad / 10000 / area, 2), ['con parcelas de ' + n0(Math.PI * rad * rad) + ' m²', 'with plots of ' + n0(Math.PI * rad * rad) + ' m²']] : null,
  ]);
  UI.table(R.grid, { title: ['Puntos de muestreo', 'Sampling points'], file: 'forestpro_cuadricula', columns: [
    { key: 'id', label: ['Punto', 'Point'], num: true }, { key: 'lat', label: ['Latitud', 'Latitude'], num: true, fmt: v => v.toFixed(6) }, { key: 'lon', label: ['Longitud', 'Longitude'], num: true, fmt: v => v.toFixed(6) },
    { key: 'E', label: ['Este UTM', 'UTM easting'], num: true, fmt: v => v.toFixed(1) }, { key: 'N', label: ['Norte UTM', 'UTM northing'], num: true, fmt: v => v.toFixed(1) }], rows: res.points, limit: 25 });
  const row = mk('div', { class: 'btn-row' });
  [['gpx', 'GPX'], ['kml', 'KML'], ['geojson', 'GeoJSON']].forEach(([k, lab]) => { const bt = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, '⤓ ' + lab); bt.addEventListener('click', () => exportAll(k, true)); row.appendChild(bt); });
  R.grid.appendChild(row);
  refresh();
}

/* ---------------- D ---------------- */
function exportAll(fmt, gridOnly) {
  const points = (gridOnly ? [] : S.plots.map(p => ({ name: p.name, lat: p.lat, lon: p.lon, desc: p.stratum || '', props: { stratum: p.stratum || '', G: p.G, N: p.N } })))
    .concat(S.grid.map(g => ({ name: 'G' + g.id, lat: g.lat, lon: g.lon, desc: T('punto de muestreo', 'sampling point'), props: { E: +g.E.toFixed(2), N: +g.N.toFixed(2) } })));
  const polys = gridOnly ? [] : S.polygons;
  if (!points.length && !polys.length) { if (window.LABG) LABG.toast(T('No hay nada que exportar todavía.', 'Nothing to export yet.')); return; }
  const base = gridOnly ? 'forestpro_cuadricula' : 'forestpro_mapa';
  if (fmt === 'gpx') download(GE().toGPX(points, polys, 'ForestPro'), base + '.gpx', 'application/gpx+xml');
  else if (fmt === 'kml') download(GE().toKML(points, polys, 'ForestPro'), base + '.kml', 'application/vnd.google-earth.kml+xml');
  else if (fmt === 'geojson') download(GE().toGeoJSON(points, polys), base + '.geojson', 'application/geo+json');
  else download(DataIO.toCSV(['nombre', 'lat', 'lon', 'descripcion'], points.map(p => [p.name, p.lat, p.lon, p.desc])), base + '.csv', 'text/csv;charset=utf-8');
}

/* ---------------- E ---------------- */
async function runInterp() {
  R.interp.innerHTML = '';
  const v = el('b8var').value;
  const src = v === 'custom' && S.pts ? S.pts : S.plots.filter(p => isFinite(p[v])).map(p => ({ lat: p.lat, lon: p.lon, z: p[v], name: p.name }));
  if (src.length < 5) { showMessage(R.interp, 'info', L2('Hacen falta al menos 5 puntos con valor (carga un inventario con coordenadas o una tabla).', 'At least 5 points with a value are needed (load an inventory with coordinates or a table).')); return; }
  const zone = GE().utmZone(Num.mean(src.map(p => p.lon)));
  const pts = src.map(p => { const u = GE().toUTM(p.lat, p.lon, zone); return { x: u.E, y: u.N, z: p.z, name: p.name }; });
  const meth = el('b8meth').value, model = el('b8vm').value;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const cutoff = +el('b8cut').value > 0 ? +el('b8cut').value : diag / 3, width = cutoff / 15;
  const ev = GE().variogram(pts, { cutoff, width });
  const vf = ev.length >= 3 ? GE().fitVariogram(ev, model) : { ok: false };
  if (meth !== 'idw' && !vf.ok) { showMessage(R.interp, 'warning', L2('El variograma no se pudo ajustar; usa IDW o cambia la distancia máxima.', 'The variogram could not be fitted; use IDW or change the cutoff.')); return; }
  /* a range below the first lag, or a negligible partial sill: no spatial dependence at these distances */
  const pureNug = vf.ok && (vf.range < ev[0].dist || vf.psill / (vf.nugget + vf.psill) < 0.05);
  const power = +el('b8pow').value || 2;
  const pred = (P, T0) => meth === 'idw' ? GE().idw(P, T0, { power }).map(z => ({ z, v: NaN })) : GE().krige(P, T0, vf, { type: meth });
  /* the grid: in UTM, clipped to the first polygon if asked */
  const mask = el('b8mask').checked && S.polygons.length ? GE().polygonUTM(S.polygons[0].ring, zone).pts : null;
  let gx0 = Math.min(...xs), gx1 = Math.max(...xs), gy0 = Math.min(...ys), gy1 = Math.max(...ys);
  if (mask) { gx0 = Math.min(...mask.map(p => p[0])); gx1 = Math.max(...mask.map(p => p[0])); gy0 = Math.min(...mask.map(p => p[1])); gy1 = Math.max(...mask.map(p => p[1])); }
  const pad = 0.04 * Math.max(gx1 - gx0, gy1 - gy0); gx0 -= pad; gx1 += pad; gy0 -= pad; gy1 += pad;
  const nl = Math.max(10, Math.min(200, Math.round(+el('b8res').value || 60)));
  const cell = Math.max(gx1 - gx0, gy1 - gy0) / nl, nx = Math.ceil((gx1 - gx0) / cell), ny = Math.ceil((gy1 - gy0) / cell);
  const targets = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) targets.push({ x: gx0 + (i + 0.5) * cell, y: gy1 - (j + 0.5) * cell, i, j });
  let vals = null, cv = null, cvI = null;
  await runWork(T('Interpolando…', 'Interpolating…'), async () => {
    const inside = targets.map(t => !mask || GE().inside([t.x, t.y], mask));
    const tIn = targets.filter((t, k) => inside[k]);
    const pIn = pred(pts, tIn);
    vals = new Array(targets.length).fill(null);
    let q = 0;
    targets.forEach((t, k) => { if (inside[k]) vals[k] = pIn[q++]; });
    cvI = GE().crossValidate(pts, (rest, p) => GE().idw(rest, [p], { power })[0]);
    if (vf.ok) cv = GE().crossValidate(pts, (rest, p) => GE().krige(rest, [p], vf, { type: 'ok' })[0].z);
  });
  const zs = vals.filter(Boolean).map(r => r.z), lo = Math.min(...zs), hi = Math.max(...zs);
  /* the raster image */
  const cvs = document.createElement('canvas'); cvs.width = nx; cvs.height = ny;
  const cx = cvs.getContext('2d'), im = cx.createImageData(nx, ny);
  vals.forEach((r, k) => { if (!r) { im.data[4 * k + 3] = 0; return; } const c = Plot.ramp((r.z - lo) / ((hi - lo) || 1), true).match(/\d+/g).map(Number); im.data[4 * k] = c[0]; im.data[4 * k + 1] = c[1]; im.data[4 * k + 2] = c[2]; im.data[4 * k + 3] = 230; });
  cx.putImageData(im, 0, 0);
  const href = cvs.toDataURL('image/png');
  const llTL = GE().fromUTM(gx0, gy1, zone, false), llBR = GE().fromUTM(gx0 + nx * cell, gy1 - ny * cell, zone, false);
  const vname = (el('b8var').selectedOptions[0] || {}).textContent || T('Valor', 'Value');
  S.raster = { href, bbox: [llTL.lon, llBR.lat, llBR.lon, llTL.lat], opacity: 0.78, lo, hi, title: vname.replace(/\s*\(.*\)/, ''), utm: { x0: gx0, x1: gx0 + nx * cell, y0: gy1 - ny * cell, y1: gy1 } };
  refresh();
  UI.tiles(R.interp.appendChild(mk('div')), [
    [['Puntos', 'Points'], String(pts.length), [meth === 'idw' ? 'IDW, potencia ' + power : (meth === 'ok' ? 'kriging ordinario' : 'kriging simple'), meth === 'idw' ? 'IDW, power ' + power : (meth === 'ok' ? 'ordinary kriging' : 'simple kriging')]],
    [['Intervalo del mapa', 'Range of the map'], n1(lo) + ' – ' + n1(hi)],
    cv ? [['Validación cruzada: kriging', 'Cross-validation: kriging'], 'RMSE ' + n2(cv.rmse), ['error medio ' + n2(cv.me), 'mean error ' + n2(cv.me)]] : null,
    [['Validación cruzada: IDW', 'Cross-validation: IDW'], 'RMSE ' + n2(cvI.rmse), ['error medio ' + n2(cvI.me), 'mean error ' + n2(cvI.me)]],
  ]);
  if (pureNug) showMessage(R.interp, 'warning', L2('El variograma no muestra dependencia espacial en las distancias analizadas (efecto pepita puro): el kriging predice casi la media en todo el mapa. Prueba IDW u otra distancia máxima, o acepta que la variable no tiene estructura espacial a esta escala.', 'The variogram shows no spatial dependence at the distances analysed (pure nugget effect): kriging predicts almost the mean over the whole map. Try IDW or another cutoff, or accept that the variable has no spatial structure at this scale.'));
  if (vf.ok) {
    const hs = Array.from({ length: 80 }, (_, i) => cutoff * i / 79);
    UI.figure(R.interp, { title: ['Variograma experimental y modelo ajustado', 'Experimental variogram and fitted model'], svg: Plot.xy({ series: [{ type: 'points', x: ev.map(e => e.dist), y: ev.map(e => e.gamma), sizes: ev.map(e => 2.5 + Math.sqrt(e.np) * 0.8), color: 'var(--accent)', label: T('Experimental (tamaño = pares)', 'Experimental (size = pairs)') }, { type: 'line', x: hs, y: hs.map(vf.gamma), color: 'var(--primary)', width: 2.4, label: T(GE().VMODELS[model].es, GE().VMODELS[model].en) }], xlab: T('Distancia (m)', 'Distance (m)'), ylab: 'γ(h)', name: 'b8-variograma', w: 600, h: 340, zeroX: true, zeroY: true }), key: 'b8-vgm' });
    UI.table(R.interp, { title: ['Modelo del variograma', 'Variogram model'], file: 'forestpro_variograma', columns: [{ key: 'k', label: ['Parámetro', 'Parameter'] }, { key: 'v', label: ['Valor', 'Value'], num: true }], rows: [
      { k: T('Pepita c₀', 'Nugget c₀'), v: sig(vf.nugget) }, { k: T('Meseta parcial c₁', 'Partial sill c₁'), v: sig(vf.psill) },
      { k: T('Alcance a (m)', 'Range a (m)'), v: fmtNum(vf.range, 0) }, { k: T('Pepita / meseta total', 'Nugget / total sill'), v: fmtPct(100 * vf.nugget / (vf.nugget + vf.psill), 0) }, { k: T('Distancia máxima / intervalo (m)', 'Cutoff / width (m)'), v: fmtNum(cutoff, 0) + ' / ' + fmtNum(width, 0) }] });
  }
  UI.interp(R.interp, [`${cv ? (cv.rmse < cvI.rmse ? `El kriging predice mejor que IDW en la validación cruzada (RMSE ${n2(cv.rmse)} frente a ${n2(cvI.rmse)}).` : `IDW predice tan bien o mejor que el kriging en la validación cruzada (RMSE ${n2(cvI.rmse)} frente a ${n2(cv.rmse)}).`) : ''} ` + (vf.ok && !pureNug ? `La pepita es ${fmtPct(100 * vf.nugget / (vf.nugget + vf.psill), 0)} de la meseta: ${vf.nugget / (vf.nugget + vf.psill) > 0.6 ? 'la mayor parte de la variación es de corta distancia o error, y el mapa interpolado tiene poca estructura que mostrar' : 'hay dependencia espacial clara hasta unos ' + n0(model === 'sph' ? vf.range : model === 'exp' ? 3 * vf.range : Math.sqrt(3) * vf.range) + ' m'}. ` : '') + (pureNug ? 'El variograma es plano: la variación entre parcelas no depende de la distancia que las separa. ' : '') + 'Con pocas parcelas, el mapa es una aproximación: úsalo para ubicar zonas, no para leer valores puntuales.',
    `${cv ? (cv.rmse < cvI.rmse ? `Kriging predicts better than IDW in cross-validation (RMSE ${n2(cv.rmse)} against ${n2(cvI.rmse)}).` : `IDW predicts as well as or better than kriging in cross-validation (RMSE ${n2(cvI.rmse)} against ${n2(cv.rmse)}).`) : ''} ` + (vf.ok && !pureNug ? `The nugget is ${fmtPct(100 * vf.nugget / (vf.nugget + vf.psill), 0)} of the sill: ${vf.nugget / (vf.nugget + vf.psill) > 0.6 ? 'most of the variation is short-range or error, and the interpolated map has little structure to show' : 'there is clear spatial dependence up to about ' + n0(model === 'sph' ? vf.range : model === 'exp' ? 3 * vf.range : Math.sqrt(3) * vf.range) + ' m'}. ` : '') + (pureNug ? 'The variogram is flat: the variation among plots does not depend on the distance between them. ' : '') + 'With few plots the map is an approximation: use it to locate zones, not to read point values.']);
  state.map = Object.assign(state.map || {}, { interp: { method: meth, n: pts.length, rmse: cv ? cv.rmse : cvI.rmse } });
}

/* the layers drawn or imported by hand go into the project of Block 10 */
function saved() { document.dispatchEvent(new CustomEvent('fp:op', { detail: { block: 8, op: 'layers', data: { polygons: S.polygons, plots: S.plots } } })); }
(window.ProjectOps = window.ProjectOps || {})[8] = { layers: d => { build(); S.polygons = d.polygons || []; S.plots = d.plots || []; drawPolys(); refresh(true); } };
ExampleHooks['mesofilo:8'] = () => { build(); loadExample('mesofilo'); };
document.addEventListener('DOMContentLoaded', build);
document.addEventListener('stepchange', e => { if (e.detail.step === 8 && map) setTimeout(() => map.redraw(), 30); });
document.addEventListener('langchange', () => { if (!el('b8root')) return; drawPolys(); drawStatic(); if (S.raster && R.interp.childElementCount) runInterp(); });
})();
