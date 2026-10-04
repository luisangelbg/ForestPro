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

g.FP_UNIT = U;
})(typeof window !== 'undefined' ? window : globalThis);
