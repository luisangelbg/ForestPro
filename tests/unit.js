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

g.FP_UNIT = U;
})(typeof window !== 'undefined' ? window : globalThis);
