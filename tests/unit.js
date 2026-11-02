/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Unit tests of the engines: worked examples with known answers (textbook values, closed forms
   computed by hand, limiting cases). The same list runs in tests/run.html (browser) and in
   tests/run_node.js (node). Each test receives the global object with the engines. */
(function (g) {
'use strict';
const U = [];
const t = (block, name, fn) => U.push({ block, name, fn });
const near = (a, b, tol) => { if (!(Math.abs(a - b) <= (tol == null ? 1e-9 : tol) * Math.max(1, Math.abs(b)))) throw new Error(`${a} ≠ ${b}`); };
const ok = (c, m) => { if (!c) throw new Error(m || 'falso'); };

/* ---------- numerical core ---------- */
t(0, 'Cuantiles de t, χ² y normal', E => { near(E.Num.qt(0.975, 10), 2.228138851986, 1e-10); near(E.Num.qchisq(0.95, 3), 7.814727903251, 1e-10); near(E.Num.qnorm(0.975), 1.959963984540, 1e-12); });
t(0, 'Mínimos cuadrados: recta exacta', E => { const r = E.Num.ols([[1, 1], [1, 2], [1, 3]], [3, 5, 7]); near(r.coef[0], 1); near(r.coef[1], 2); near(r.r2, 1); });
t(0, 'Levenberg–Marquardt recupera una exponencial sin ruido', E => {
  const x = [1, 2, 3, 4, 5, 6], y = x.map(v => 3 * Math.exp(-0.4 * v));
  const f = E.NLS.fit({ f: (b, v) => b[0] * Math.exp(-b[1] * v), x, y, start: [1, 0.1] });
  near(f.coef[0], 3, 1e-7); near(f.coef[1], 0.4, 1e-7);
});
t(0, 'Lector: CSV con punto y coma y coma decimal', E => { const r = E.DataIO.readAny(new TextEncoder().encode('DAP;H\n12,5;8\n14;9,5'), 'a.csv'); near(r.cols[0].v[0], 12.5); near(r.cols[1].v[1], 9.5); });
t(0, 'Escritor XLSX: se vuelve a leer igual', E => { const b = E.DataIO.xlsx([{ name: 'A', header: ['x', 'y'], rows: [[1, 'á'], [2.5, 'b']] }]); const r = E.DataIO.readAny(b, 'a.xlsx'); near(r.cols[0].v[1], 2.5); ok(r.cols[1].v[0] === 'á'); });

/* ---------- Block 2 ---------- */
t(2, 'Área basal de un árbol de 30 cm = 0.0706858 m²', E => near(E.Dendro.basalArea(30), 0.07068583470577, 1e-12));
t(2, 'DAP desde la circunferencia: 94.2478 cm → 30 cm', E => near(E.Dendro.dbhFromGirth(30 * Math.PI), 30, 1e-12));
t(2, 'Las tres fórmulas coinciden en un cilindro', E => { near(E.Dendro.huber(30, 4), E.Dendro.smalian(30, 30, 4)); near(E.Dendro.newton(30, 30, 30, 4), E.Dendro.huber(30, 4)); });
t(2, 'Newton es exacta en un paraboloide (g lineal en la longitud)', E => {
  /* paraboloid: g(x) ∝ x, so d ∝ √x; from x = 1 to 3 m with d(x) = 10·√x cm */
  const exact = Math.PI / 40000 * 100 * (9 - 1) / 2;
  near(E.Dendro.newton(10, 10 * Math.sqrt(2), 10 * Math.sqrt(3), 2), exact, 1e-12);
  near(E.Dendro.smalian(10, 10 * Math.sqrt(3), 2), exact, 1e-12);
});
t(2, 'Cono: Smalian por secciones + punta = π r² h / 3', E => {
  const H = 20, D0 = 40, secs = [0, 5, 10, 15].map(h => ({ h, d: D0 * (1 - h / H) }));
  const v = E.Dendro.stemVolume(secs, H);
  /* Smalian overestimates the cone between sections; the tip cone is exact */
  const exact = Math.PI * Math.pow(0.2, 2) * H / 3;
  ok(v.vTotal > exact && v.vTotal < exact * 1.05, 'volumen fuera de rango: ' + v.vTotal + ' vs ' + exact);
});
t(2, 'Volumen comercial al diámetro mínimo en un cono', E => {
  const H = 20, secs = [0, 5, 10, 15].map(h => ({ h, d: 40 * (1 - h / H) }));
  const v = E.Dendro.stemVolume(secs, H, { minTop: 10 });
  near(v.hMerch, 15, 1e-9);
});
t(2, 'Kozak 1969 recupera coeficientes sin ruido', E => {
  const rows = [];
  [[20, 15], [30, 22], [40, 26]].forEach(([D, H]) => [0.3, 1.3, 4, 8, 12].forEach(h => { const z = h / H; rows.push({ D, H, h, d: D * Math.sqrt(-2.4 * (z - 1) + 1.15 * (z * z - 1)) }); }));
  const k = E.Dendro.fitTaper(rows, ['kozak69'])[0];
  near(k.fit.coef[0], -2.4, 1e-9); near(k.fit.coef[1], 1.15, 1e-9);
});
t(2, 'Näslund recupera una curva sin ruido', E => {
  const data = [8, 12, 16, 20, 25, 30, 38, 45].map(d => ({ d, h: 1.3 + d * d / Math.pow(1.6 + 0.17 * d, 2) }));
  const f = E.Dendro.fitHD(data, ['naslund'])[0];
  near(f.fit.coef[0], 1.6, 1e-6); near(f.fit.coef[1], 0.17, 1e-6);
});

/* ---------- Block 3 ---------- */
t(3, 'Factor de expansión de una parcela circular de 17.84 m ≈ 10 árb/ha', E => near(E.Invent.expansion({ shape: 'circle', r: 17.84 }, 20), 10000 / (Math.PI * 17.84 * 17.84), 1e-12));
t(3, 'Parcela anidada: el árbol delgado usa la subparcela', E => { const p = { shape: 'nested', r: 17.84, rSmall: 5.64, dCut: 10 }; near(E.Invent.expansion(p, 8), 10000 / (Math.PI * 5.64 * 5.64), 1e-12); near(E.Invent.expansion(p, 12), 10000 / (Math.PI * 17.84 * 17.84), 1e-12); });
t(3, 'Reineke: 1 000 árb/ha con Dq = 20 cm → 698.6', E => near(E.Invent.reineke(1000, 20), 1000 * Math.pow(0.8, 1.605), 1e-12));
t(3, 'Hart–Becking: 400 árb/ha (5 m) y 20 m de altura → 25 %', E => near(E.Invent.hartBecking(400, 20), 25, 1e-12));
t(3, 'Tamaño de muestra: converge y cumple n = t²CV²/E² con t de n − 1 gl', E => { const r = E.Invent.sampleSize({ cv: 40, err: 10 }); const t = E.Num.qt(0.975, r.n - 1); ok(r.n >= t * t * 16 - 1e-9 && r.n - 1 < E.Num.qt(0.975, r.n - 2) ** 2 * 16 + 1, 'n = ' + r.n); });
t(3, 'MAS: el error estándar es s/√n', E => { const r = E.Invent.srs([10, 12, 14, 16]); near(r.se, E.Num.sd([10, 12, 14, 16]) / 2, 1e-12); });
t(3, 'Estratificado con un estrato igual al MAS', E => { const r = E.Invent.strat([{ name: 'A', y: [3, 5, 7, 9], area: 10 }]); near(r.se, E.Invent.srs([3, 5, 7, 9]).se, 1e-12); });
t(3, 'Weibull recupera forma y escala de una muestra grande', E => { const rng = E.Num.rng(7), x = []; for (let i = 0; i < 20000; i++) x.push(25 * Math.pow(-Math.log(1 - rng()), 1 / 2.2)); const w = E.Invent.weibull(x); near(w.c, 2.2, 0.03); near(w.b, 25, 0.02); });
t(3, 'Relascopía: un árbol contado con FAB 2 representa 2/g árboles', E => { const r = E.Invent.relascope([{ point: 1, trees: [{ d: 20, v: NaN }] }, { point: 2, trees: [{ d: 20, v: NaN }] }], 2); near(r.N.mean, 2 / (Math.PI * 0.04 / 4), 1e-12); near(r.G.mean, 2, 1e-12); });

/* ---------- Block 4 ---------- */
t(4, 'Chave 2014 ec. 4: D 30 cm, H 20 m, ρ 0.6 → 0.0673·10 800^0.976 kg', E => near(E.Biomass.eq('chave14_h').f({ D: 30, H: 20, rho: 0.6 }), 0.0673 * Math.exp(0.976 * Math.log(10800)), 1e-12));
t(4, 'Raíz/tallo del IPCC: 150 t/ha pertenece a la clase 50–150 de coníferas templadas', E => { near(E.Biomass.rootShoot('temp_conif', 150), 0.29); near(E.Biomass.rootShoot('temp_conif', 150.01), 0.20); near(E.Biomass.rootShoot('temp_conif', 49.99), 0.40); });
t(4, 'Suelo: 2.5 % × 1.2 g/cm³ × 30 cm × (1 − 0.10) = 81 Mg C/ha', E => near(E.Biomass.socLayer(2.5, 1.2, 0, 30, 10), 81, 1e-12));
t(4, 'Hojarasca: 500 g en 0.25 m² = 20 Mg/ha', E => near(E.Biomass.litter(500, 0.25), 20, 1e-12));
t(4, 'Van Wagner: una pieza de 10 cm en 30 m → π²·100/240 m³/ha', E => near(E.Biomass.lineIntersect([{ transect: 1, d: 10, cls: 1 }], [{ transect: 1, L: 30 }], { 1: 0.5 })[0].V, Math.PI * Math.PI * 100 / 240, 1e-12));
t(4, 'Densidad: el género es la media de las medias de sus especies, no de sus registros', E => {
  const idx = E.Biomass.densityIndex([{ genus: 'A', species: 'x', wd: 0.4 }, { genus: 'A', species: 'x', wd: 0.6 }, { genus: 'A', species: 'y', wd: 0.8 }]);
  const r = E.Biomass.woodDensity([{ genus: 'A', species: 'z' }], idx, {});
  near(r[0].wd, (0.5 + 0.8) / 2, 1e-12); ok(r[0].level === 'genus');
});
t(4, 'Monte Carlo sin errores de medición: la media iguala al cálculo directo (ruido residual con media uno)', E => {
  const eq = E.Biomass.eq('chave14_h'), trees = [];
  for (let i = 0; i < 40; i++) trees.push({ plot: 1, ef: 10, D: 10 + i, H: 8 + i / 3, rho: 0.6, rhoSd: 0, eq });
  const det = trees.reduce((s, t) => s + eq.f(t) * 10 / 1000, 0);
  const mc = E.Biomass.monteCarlo(trees, { n: 20000, seed: 3, dErr: null, hCv: 0, resid: true });
  near(mc.standMean, det, 0.005);
});
t(4, 'CO₂ equivalente: 44/12 del carbono', E => near(E.Biomass.CO2 * 12, 44, 1e-12));

/* ---------- Block 5 ---------- */
t(5, 'ICA e IMA de una serie lineal: ICA constante e IMA que se le acerca', E => { const r = E.Growth.increments([1, 2, 3, 4].map(t => ({ t, y: 2 * t + 1 }))); near(r.rows[3].ica, 2); near(r.rows[3].ima, 9 / 4); });
t(5, 'Chapman–Richards: la inflexión está en t = ln(p)/k', E => { const f = t => 30 * Math.pow(1 - Math.exp(-0.05 * t), 2.5); const c = E.Growth.criticalAges(f, 40, 1); near(c.tICA, Math.log(2.5) / 0.05, 1e-4); });
t(5, 'Schumacher: el IMA máximo está en t = b', E => { const f = t => 40 * Math.exp(-12 / t); near(E.Growth.criticalAges(f, 30, 1).tIMA, 12, 1e-6); });
t(5, 'Índice de sitio ADA: la curva de un sitio pasa por (edad base, IS)', E => { const sf = { si: null }; const A = 40, p = 1.3, tb = 20; const proj = (h1, t1, t2) => { const u = 1 - Math.pow(h1 / A, 1 / p); return A * Math.pow(1 - Math.pow(u, t2 / t1), p); }; near(proj(proj(22, tb, 35), 35, tb), 22, 1e-10); void sf; });
t(5, 'Clutter: proyectar a la misma edad deja el área basal igual', E => { const c = { alpha: [4, -0.01], beta: [-1.7, -7.7, 0.04, 1.9] }; near(E.Growth.clutterProject(c, 25, 10, 30, [10])[0].G, 30, 1e-12); });

/* ---------- Block 6 ---------- */
t(6, 'Shannon de 4 especies igual de abundantes = ln 4; Hill: q0 = 4, q2 = 4', E => { const x = [5, 5, 5, 5]; near(E.Divers.indices(x).H, Math.log(4), 1e-12); near(E.Divers.hill(x, 0), 4, 1e-12); near(E.Divers.hill(x, 2), 4, 1e-12); });
t(6, 'Chao1 corregido: [1, 1, 2, 3, 5] → 5 + 2·1/(2·2) = 5.5', E => near(E.Divers.indices([1, 1, 2, 3, 5]).chao1, 5.5, 1e-12));
t(6, 'Rarefacción al tamaño de la muestra = riqueza observada', E => { const x = [10, 4, 3, 1, 1, 1]; near(E.Divers.rarefy(x, [20])[0].S, 6, 1e-12); });
t(6, 'Jaccard entre [1,0,1] y [1,1,0] = 2/3; Sørensen = 1/2', E => { near(E.Divers.dissim([[1, 0, 1], [1, 1, 0]], 'jaccard')[1][0], 2 / 3, 1e-12); near(E.Divers.dissim([[1, 0, 1], [1, 1, 0]], 'sorensen')[1][0], 0.5, 1e-12); });
t(6, 'Clark–Evans de una malla cuadrada ≈ 2 (regular)', E => { const p = []; for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) p.push({ x: i + 0.5, y: j + 0.5 }); near(E.Divers.clarkEvans(p, 20, 20).R, 2, 1e-12); });
t(6, 'UPGMA de tres puntos: alturas 1 y (2 + 3)/2', E => { const D = [[0, 1, 2], [1, 0, 3], [2, 3, 0]]; const u = E.Divers.upgma(D); near(u.heights[0], 1, 1e-12); near(u.heights[1], 2.5, 1e-12); });
t(6, 'Escalamiento clásico recupera distancias euclidianas', E => { const P = [[0, 0], [3, 0], [0, 4], [3, 4]]; const D = P.map(a => P.map(b => Math.hypot(a[0] - b[0], a[1] - b[1]))); const X = E.Divers.cmdscale(D, 2).X; near(Math.hypot(X[0][0] - X[3][0], X[0][1] - X[3][1]), 5, 1e-9); });

/* ---------- Block 7 ---------- */
t(7, 'Apertura de un casquete de cielo de 30°: ponderada ≈ 1 − cos 30°, fracción de huecos ≈ 1/9', E => {
  const w = 600, h = 600, R = 300, g = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const r = Math.hypot(x + 0.5 - 300, y + 0.5 - 300); g[y * w + x] = r <= R / 3 ? 230 : 40; }
  const o = E.Agro.openness(g, w, h, { threshold: 128 });
  near(o.weighted, 1 - Math.cos(Math.PI / 6), 2e-3); near(o.gap, 1 / 9, 2e-3);
});
t(7, 'Otsu separa dos poblaciones de grises', E => { const hst = new Array(256).fill(0); for (let i = 0; i < 50; i++) { hst[40 + (i % 10)] += 10; hst[200 + (i % 10)] += 10; } const t0 = E.Agro.otsu(hst); ok(t0 >= 49 && t0 < 200, 'umbral ' + t0); });
t(7, 'Marco real de 10 m en 100 × 100 m: 100 árboles; tresbolillo: 15.5 % más por hectárea', E => { near(E.Agro.layout({ kind: 'square', W: 100, L: 100, a: 10 }).n, 100); near(E.Agro.densityOf({ kind: 'tri', a: 10 }) / E.Agro.densityOf({ kind: 'square', a: 10 }), 2 / Math.sqrt(3), 1e-12); });
t(7, 'Cerco vivo de 400 m de perímetro con un árbol cada 5 m: 80 árboles', E => near(E.Agro.layout({ kind: 'fence', W: 100, L: 100, a: 5 }).n, 80));
t(7, 'Cobertura con traslape: copas que suman la superficie de la parcela cubren 1 − 1/e', E => { const r = Math.sqrt(1000 / Math.PI); near(E.Agro.shadeOfPlot([{ sp: 'a', d: 20, h: 10, crown: 2 * r }], 1000).cover, 100 * (1 - Math.exp(-1)), 1e-12); });
t(7, 'Presupuesto: la diferencia en CO₂e es 44/12 de la de carbono', E => { const b = E.Agro.budget({ a: 10, b: 5 }, { a: 2 }); near(b.diff, 13); near(b.diffCO2, 13 * 44 / 12, 1e-12); });

/* ---------- Block 8 ---------- */
t(8, 'UTM ida y vuelta: menos de 1e-8° de diferencia', E => { const u = E.Geo.toUTM(19.5, -97.03); const b = E.Geo.fromUTM(u.E, u.N, u.zone, u.south); near(b.lat, 19.5, 1e-8); near(b.lon, -97.03, 1e-8); ok(u.zone === 14, 'zona ' + u.zone); });
t(8, 'Meridiano central: Este = 500 000 m; Ecuador: Norte = 0', E => { const u = E.Geo.toUTM(0, -99); near(u.E, 500000, 1e-6); near(u.N, 0, 1e-6); });
t(8, 'Cuadrado de 1 km en UTM: área 100 ha (agrimensor) y la esférica difiere < 1 %', E => { const p = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]]; near(Math.abs(E.Geo.planarArea(p)), 1e6, 1e-9); const ring = p.map(q => { const ll = E.Geo.fromUTM(700000 + q[0], 2150000 + q[1], 14, false); return [ll.lon, ll.lat]; }); const s = E.Geo.polygonStats(ring); near(s.areaUTM, 1e6, 1e-3); ok(Math.abs(s.areaSphere / s.areaUTM - 1) < 0.01, 'esfera ' + s.areaSphere); });
t(8, 'Cuadrícula de 100 m en un cuadrado de 1 km: 100 puntos', E => { const ring = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]].map(q => { const ll = E.Geo.fromUTM(700000 + q[0], 2150000 + q[1], 14, false); return [ll.lon, ll.lat]; }); const g = E.Geo.grid(ring, { spacing: 100, offsetX: 0, offsetY: 0 }); ok(g.points.length === 100, 'puntos ' + g.points.length); near(g.expected, 100, 1e-3); });
t(8, 'IDW y kriging ordinario reproducen el dato en su propio punto', E => { const P = [{ x: 0, y: 0, z: 1 }, { x: 100, y: 0, z: 3 }, { x: 0, y: 100, z: 2 }, { x: 100, y: 100, z: 5 }, { x: 50, y: 40, z: 4 }]; near(E.Geo.idw(P, [{ x: 100, y: 0 }])[0], 3); const k = E.Geo.krige(P, [{ x: 0, y: 100 }], { model: 'sph', nugget: 0, psill: 2, range: 150 }, { type: 'ok' })[0]; near(k.z, 2, 1e-9); near(k.v, 0, 1e-9); });
t(8, 'Kriging ordinario: los pesos suman 1 (una constante se predice igual)', E => { const P = [[0, 0], [80, 10], [20, 90], [100, 100], [60, 50]].map(q => ({ x: q[0], y: q[1], z: 7 })); near(E.Geo.krige(P, [{ x: 33, y: 71 }], { model: 'exp', nugget: 0.1, psill: 1, range: 40 }, { type: 'ok' })[0].z, 7, 1e-10); });
t(8, 'GeoJSON exportado se vuelve a leer igual', E => { const pts = [{ name: 'A', lat: 19.5, lon: -97 }], pol = [{ name: 'P', ring: [[-97, 19.5], [-96.99, 19.5], [-96.99, 19.51]] }]; const r = E.Geo.parse(E.Geo.toGeoJSON(pts, pol), 'x.geojson'); near(r.points[0].lat, 19.5); ok(r.polygons[0].ring.length === 4, 'anillo cerrado'); });

/* ---------- Block 9 ---------- */
t(9, '1 m³ = 423.776 pies tabla; 1 pie tabla = 144 pulg³', E => { near(E.Tools.M3_BF, 423.776000657, 1e-9); near(E.Tools.BF_M3, 144 * Math.pow(0.0254, 3), 1e-15); });
t(9, 'Doyle: troza de 12″ × 16 pies = 64 pies tabla', E => near(E.Tools.doyle(12, 16), 64, 1e-12));
t(9, 'Internacional ¼″: 12″ × 16 pies = 0.905 × (0.88·144 − 1.52·12 − 1.36)', E => near(E.Tools.international(12, 16), 0.905 * (0.88 * 144 - 1.52 * 12 - 1.36), 1e-12));
t(9, 'Newton es exacta en un cono truncado', E => { const d1 = 10, d2 = 30, L = 4; near(E.Tools.newton(d1, (d1 + d2) / 2, d2, L), E.Tools.frustum(d1, d2, L), 1e-12); });
t(9, 'Conversión de ida y vuelta: acre → ha → acre', E => near(E.Tools.convert('area', E.Tools.convert('area', 3.7, 'ac', 'ha'), 'ha', 'ac'), 3.7, 1e-12));
t(9, 'Costo de 100 hoy e ingreso de 121 en dos años: VPN = 0 al 10 % y TIR = 10 %', E => { const e = E.Tools.econ([{ t: 0, cost: 100, income: 0 }, { t: 2, cost: 0, income: 121 }], 0, 0.1); near(e.npv, 0, 1e-9); near(e.irr, 0.1, 1e-10); near(e.bc, 1, 1e-12); });
t(9, 'Faustmann: un turno de 1 año con VPN v vale v·(1 + r)/r', E => { const e = E.Tools.econ([{ t: 0, cost: 0, income: 0 }, { t: 1, cost: 0, income: 11 }], 0, 0.1); near(e.lev, e.npv * 1.1 / 0.1, 1e-12); near(e.lev, 110, 1e-9); });

/* ---------- corrections of 2026-11-01 ---------- */
t(3, 'Tamaño de muestra estratificado: los nₕ enteros suman la n que se informa (mínimo 2 por estrato)', E => {
  const st = [{ name: 'A', w: 600, s: 9, mean: 30 }, { name: 'B', w: 300, s: 4, mean: 25 }, { name: 'C', w: 100, s: 2, mean: 20 }];
  ['neyman', 'prop'].forEach(al => { const a = E.Invent.stratSampleSize({ strata: st, err: 10, alloc: al }); near(a.nh.reduce((x, y) => x + y, 0), a.n, 0); ok(a.nh.every(v => v >= 2 && Number.isInteger(v)), 'nₕ enteros ≥ 2'); ok(a.n >= a.nRaw, 'n ≥ n sin redondear'); });
});
t(3, 'K–S ponderado: con pesos iguales es el de siempre; el tamaño efectivo de Kish es (Σw)²/Σw²', E => {
  const x = [3.1, 4.7, 5.2, 6.8, 7.7, 9.4, 11.0, 12.6, 15.3, 20.9], F = v => 1 - Math.exp(-Math.pow(v / 9, 1.6));
  const a = E.Invent.ks(x, F), b = E.Invent.ks(x, F, x.map(() => 7));
  near(a.D, b.D, 1e-12); near(a.p, b.p, 1e-12); near(b.nEff, 10, 1e-12);
  const c = E.Invent.ks(x, F, x.map((_, i) => i < 5 ? 100 : 10)); near(c.nEff, Math.pow(550, 2) / 50500, 1e-12);
});
t(3, 'Weibull truncada: con corte 0 es la de siempre; el ajuste truncado descarta los árboles bajo el corte', E => {
  const d = [2.6, 3.1, 4.0, 4.4, 5.5, 6.1, 7.3, 8.8, 9.9, 12.5, 14.0, 18.2, 22.7, 30.1];
  const a = E.Invent.weibull(d), b = E.Invent.weibull(d, { trunc: 0 });
  near(a.c, b.c, 1e-12); near(a.b, b.b, 1e-12);
  const t25 = E.Invent.weibull(d, { trunc: 2.5 }), t4 = E.Invent.weibull(d, { trunc: 4 });
  ok(t4.n === d.filter(v => v >= 4).length, 'n con corte'); near(t25.cdf(2.5), 0, 1e-15); near(t25.cdf(1e6), 1, 1e-12);
  ok(t25.mean > 2.5 && isFinite(t25.mean), 'media truncada');
});
t(3, 'Weibull de 3 parámetros: la ubicación pegada al mínimo se marca en el borde', E => {
  /* a reverse J (shape < 1): the profile likelihood climbs up to the smallest diameter */
  const d = []; for (let i = 1; i <= 60; i++) d.push(+(5 + 40 * Math.pow(i / 61, 2.2)).toFixed(2));
  const w = E.Invent.weibull(d, { three: true });
  ok(w.boundary, 'en el borde'); ok(w.edgeGap < 0.01 * Math.min(...d) + 1e-9, 'a menos de 1 % del mínimo');
});
t(4, 'Reservorios: la suma por parcela capta la covarianza que la cuadratura ignora', E => {
  const ag = [40, 55, 30, 62, 48, 35], root = ag.map(v => v * 0.27);
  const sAg = E.Invent.srs(ag), sRoot = E.Invent.srs(root), sSum = E.Invent.srs(ag.map((v, i) => v + root[i]));
  const c = E.Biomass.combinePools({ mean: sSum.mean, se: sSum.se }, [{ mean: 3, se: 0.4 }]);
  near(c.mean, sAg.mean + sRoot.mean + 3, 1e-12);
  near(c.se, Math.sqrt((sAg.se + sRoot.se) ** 2 + 0.16), 1e-12);
  ok(c.se > Math.sqrt(sAg.se ** 2 + sRoot.se ** 2 + 0.16), 'mayor que la cuadratura');
});
t(5, 'Cruce ICA = IMA: queda a menos de medio intervalo de la edad del IMA máximo', E => {
  const s = [5, 10, 15, 20, 25, 30, 35, 40].map(t => ({ t, y: 300 * Math.pow(1 - Math.exp(-0.06 * t), 2.4) }));
  const r = E.Growth.increments(s);
  ok(Math.abs(r.tCross - r.tMaxIMA) <= 2.5 + 1e-9, r.tCross + ' frente a ' + r.tMaxIMA);
  const rising = E.Growth.increments(s.slice(0, 3)); ok(!isFinite(rising.tCross), 'sin cruce si el IMA aún crece');
});
t(5, 'La tabla de producción termina en la edad final aunque el intervalo no caiga en ella', E => {
  const c = { alpha: [3.5, 0.02], beta: [1.5, -10, 0.02, 1.0] };
  const y = E.Growth.yieldTable({ clutter: c, S: 18, t0: 5, g0: 8, n0: 1200, mort: 1.5, tEnd: 40, step: 2 });
  const ts = y.rows.map(r => r.t);
  ok(ts[ts.length - 1] === 40 && ts[ts.length - 2] === 39 && ts[0] === 5, 'edades: ' + ts.join(' '));
});
t(7, 'Plano de plantación centrado: el margen sobrante se reparte entre los dos bordes', E => {
  const r = E.Agro.layout({ kind: 'square', W: 103, L: 47, a: 10 });
  const xs = r.pts.map(p => p.x), ys = r.pts.map(p => p.y);
  near(Math.min(...xs), 103 - Math.max(...xs), 1e-9); near(Math.min(...ys), 47 - Math.max(...ys), 1e-9); near(r.n, 40, 0);
});
t(0, 'Figuras: los segmentos entran en la escala y las marcas categóricas caen en 1, 2, …', E => {
  if (!E.Plot) return;
  const s = E.Plot.xy({ series: [{ type: 'segments', segs: [[1, 10, 1, 90]] }, { type: 'points', x: [1, 2], y: [40, 50] }], xlim: [0.6, 2.4], xtickVals: [1, 2], xLabels: v => 'M' + v, legend: false });
  const yr = /data-yr="([^"]+)"/.exec(s)[1].split(' ').map(Number);
  ok(yr[1] >= 90, 'el intervalo no se corta: ' + yr); ok(s.includes('>M1<') && s.includes('>M2<'), 'las dos marcas');
});
t(0, 'Figuras: la leyenda de abajo no se encima con el título del eje x', E => {
  if (!E.Plot) return;
  const s = E.Plot.xy({ series: [{ type: 'points', x: [1, 2], y: [1, 2], label: 'Una etiqueta bastante larga de ecuación (ec. 4)' }, { type: 'line', x: [1, 2], y: [2, 1], label: 'Otra etiqueta larga para la segunda serie' }], xlab: 'x', legend: 'bottom', w: 500, h: 320 });
  const xl = +/data-role="xlab" x="[^"]+" y="([^"]+)"/.exec(s)[1], lg = +/data-role="legend" class="pl-legend" transform="translate\([^ ]+ ([^)]+)\)/.exec(s)[1];
  ok(lg - xl >= 18, `leyenda a ${lg - xl} px del título`);
});

/* ---------- the English interface (labels of the examples, references, file names) ---------- */
t(0, 'Inglés: referencias con «and», «4th ed.», «ch.», «tables», «eqs.», «The Hague» e «In»', E => {
  if (!E.LangEN) return;
  const R = E.LangEN.ref;
  ok(R('Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, 4.ª ed. Wiley.') === 'Husch, B., Beers, T. W. and Kershaw, J. A. (2003). <i>Forest Mensuration</i>, 4th ed. Wiley.');
  ok(R('Cochran, W. G. (1977). <i>Sampling Techniques</i>, 3.ª ed. Wiley.').includes('3rd ed.'));
  ok(R('X, A. (2010). <i>Libro</i>, 2.ª ed. Y.').includes('2nd ed.') && R('X, A. (2010). <i>Libro</i>, 1.ª ed. Y.').includes('1st ed.'));
  ok(R('IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 4, cap. 4 (cuadros 4.3 y 4.4).') === 'IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 4, ch. 4 (tables 4.3 and 4.4).');
  ok(R('IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 1, cap. 3 (ec. 3.1 y 3.2) y vol. 4, cap. 2.') === 'IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 1, ch. 3 (eqs. 3.1 and 3.2) and vol. 4, ch. 2.');
  ok(R('Theil, H. (1953). Repeated least squares. Central Planning Bureau, La Haya.').endsWith('Central Planning Bureau, The Hague.'));
  ok(R('Hegyi, F. (1974). A model. En <i>Growth Models</i>, pp. 74–90.').includes('. In <i>Growth Models</i>'));
  ok(R('Cochran, W. G. (1977). <i>Sampling Techniques</i>, §4.6 y §5.5. Wiley.').includes('§4.6 and §5.5'));
  ok(R('Colwell, R. K., Mao, C. X. y Chang, J. (2004). Interpolating.') === 'Colwell, R. K., Mao, C. X. and Chang, J. (2004). Interpolating.');
});
t(0, 'Inglés: los títulos de las obras no se traducen y una referencia sin formas españolas queda igual', E => {
  if (!E.LangEN) return;
  const r = 'Díaz-Franco, R. et al. (2007). Determinación de ecuaciones alométricas para estimar biomasa y carbono en <i>Pinus patula</i>. <i>Madera y Bosques</i> 13(1):25–34.';
  ok(E.LangEN.ref(r) === r, 'cambió un título');
  const o = 'Otsu, N. (1979). A threshold selection method from gray-level histograms. <i>IEEE Trans. Syst. Man Cybern.</i> 9:62–66.';
  ok(E.LangEN.ref(o) === o && E.LangEN.refL2(o) === o);
  ok(E.LangEN.refL2('A, B. y C, D. (2000). T.') === '<span data-l="es">A, B. y C, D. (2000). T.</span><span data-l="en">A, B. and C, D. (2000). T.</span>');
});
t(4, 'Inglés: las notas del catálogo de ecuaciones salen sin español', E => {
  if (!E.LangEN) return;
  E.Biomass.EQS.forEach(e => {
    /* what is left after the authors and the year, without the titles in italics: Spanish wording would show here */
    const en = E.LangEN.ref(e.src).replace(/<i>.*?<\/i>/g, '').replace(/^.*?\(\d{4}\)\. /, '');
    ok(/^(Determinación|Estimación)/.test(en) || !/\bec\.|\bcap\.|ª ed|supl\.|La fuente|es el índice|diámetro|modelo de|\bdel\b/.test(en), e.id + ': ' + en);
  });
  ok(E.LangEN.ref(E.Biomass.eq('chave14_e').src).endsWith('E is the environmental stress index of the site (eq. 6b).'));
  ok(E.LangEN.ref(E.Biomass.eq('brown97_dry').src).endsWith('FAO Forestry Paper 134, eq. 3.2.1.'));
  ok(E.LangEN.ref(E.Biomass.eq('vnoord02_coffee').src).endsWith('45 (suppl.):75–86. The source does not say at what height D is measured.'));
});
t(0, 'Inglés: nombres de los archivos exportados', E => {
  if (!E.LangEN) return;
  const F = n => E.LangEN.file(n, 'en');
  ok(F('forestpro_informe_bosque_mesofilo.html') === 'forestpro_report_bosque_mesofilo.html');
  ok(F('forestpro_proyecto_project.json') === 'forestpro_project_project.json');
  ok(F('forestpro_tablas.xlsx') === 'forestpro_tables.xlsx' && F('forestpro_tablas_csv.zip') === 'forestpro_tables_csv.zip');
  ok(F('forestpro_b2t_plantilla.csv') === 'forestpro_b2t_template.csv');
  ok(F('forestpro_incrementos_t1.csv') === 'forestpro_increments_t1.csv' && F('forestpro_tabla_rodal.csv') === 'forestpro_stand_table.csv');
  ok(F('forestpro_estratos_altura.xlsx') === 'forestpro_height_strata.xlsx' && F('forestpro_estratos.csv') === 'forestpro_strata.csv');
  ok(F('forestpro_mapa.geojson') === 'forestpro_map.geojson' && F('forestpro_cuadricula.gpx') === 'forestpro_grid.gpx');
  ok(F('forestpro_coef_hd_naslund.csv') === 'forestpro_coef_hd_naslund.csv');
  ok(F(F('forestpro_informe_x.html')) === 'forestpro_report_x.html', 'no es idempotente');
  ok(E.LangEN.file('forestpro_informe_x.html', 'es') === 'forestpro_informe_x.html', 'cambió en español');
  ok(E.LangEN.file('forestpro_trozas.csv') === 'forestpro_trozas.csv', 'sin idioma debe quedar en español');
});
t(0, 'Inglés: etiquetas de los ejemplos (estratos, manejos, pisos, niveles, estado)', E => {
  const P = E.FPData;
  const es = P.rows('mesofilo_parcelas', 'es'), en = P.rows('mesofilo_parcelas', 'en');
  const set = (name, col) => JSON.stringify([...new Set(P.rows(name, 'en').map(r => r[col]))].sort());
  ok(es[0].estrato === 'Conservado' && en[0].estrato === 'Conserved');
  ok(set('mesofilo_arboles', 'estrato') === '["Conserved","Disturbed","Riparian"]');
  ok(set('cafetal_parcelas', 'manejo') === '["commercial polyculture","rustic","shaded monoculture","traditional polyculture"]');
  ok(set('mesofilo_mapeada', 'dosel') === '["canopy","understory"]');
  ok(set('densidades_madera', 'nivel') === '["genus","species"]');
  ok(set('cafetal_arboles', 'estado') === '["alive","standing dead"]');
  /* the numbers, species and plots do not change; outside the browser the labels are Spanish */
  ok(en[0].parcela === es[0].parcela && en[0].area_estrato_ha === es[0].area_estrato_ha);
  ok(P.rows('mesofilo_arboles', 'en')[0].especie === P.rows('mesofilo_arboles', 'es')[0].especie);
  ok(P.rows('mesofilo_parcelas')[0].estrato === 'Conservado');
  ok(P.label('estrato', 'Conservado', 'en') === 'Conserved' && P.label('estrato', 'Bosque alto', 'en') === 'Bosque alto' && P.label('estrato', 'Conservado', 'es') === 'Conservado');
  ok(P.alive('vivo') && P.alive('alive') && !P.alive('muerto en pie') && !P.alive('standing dead'));
  ok(P.rows('mesofilo_arboles', 'en').filter(r => P.alive(r.estado)).length === P.rows('mesofilo_arboles', 'es').filter(r => r.estado === 'vivo').length);
});
t(7, 'Histograma de muchas clases: barras sin hueco ni borde (opción solid)', E => {
  if (!E.Plot) return;
  const edges = Array.from({ length: 257 }, (_, i) => i), values = edges.slice(0, 256).map(i => 100 + i);
  const s = E.Plot.bars({ edges, series: [{ label: 'p', values, color: '#558B2F' }], w: 620, h: 300, solid: true });
  const rects = s.match(/<rect [^>]*style="fill:#558B2F[^"]*"/g) || [];
  ok(rects.length === 256, rects.length + ' barras');
  ok(rects.every(r => /stroke:none/.test(r)), 'con borde');
  const w = +/width="([\d.]+)"/.exec(rects[100])[1];
  ok(w > 1.5, 'barra de ' + w + ' px');
  const s0 = E.Plot.bars({ edges, series: [{ label: 'p', values, color: '#558B2F' }], w: 620, h: 300 });
  ok(!/stroke:none/.test(s0), 'sin solid, el dibujo de siempre');
});

g.FP_UNIT = U;
})(typeof window !== 'undefined' ? window : globalThis);
