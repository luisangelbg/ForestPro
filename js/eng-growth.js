/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 5: growth and yield.

   · Increments of a series (stem analysis or remeasurements): the periodic
     annual increment (ICA) and the mean annual increment (IMA); the biological
     rotation is the age where IMA peaks, which is where ICA crosses it.
   · Growth models fitted by nonlinear least squares: Chapman–Richards (Richards
     1959), Gompertz (1825), Schumacher (1939) and the logistic; for each one,
     the age of the largest current increment (inflection) and of the largest
     mean increment (rotation), found on the fitted curve.
   · Site index at a base age: anamorphic curves from a guide curve (Schumacher's
     ln H = b₀ + b₁/t, or Chapman–Richards with a common shape), and polymorphic
     curves by the algebraic difference approach on the rate of Chapman–Richards
     with a common asymptote (Bailey and Clutter 1974; Cieszewski and Bailey 2000),
     fitted on pairs of successive remeasurements; classification of plots.
   · Whole-stand growth and yield: the compatible system of Clutter (1963) for
     basal area and volume, fitted by two-stage least squares as it is usually
     applied (the projection of basal area with intercept 0 and the coefficient of
     ln G₁·t₁/t₂ fixed at 1; ln G₂ instrumented in the volume equation), and a
     yield table with survival, dominant height, quadratic diameter, ICA and IMA.
   Needs Num and NLS. No DOM. */
function GrowthCore(g) {
'use strict';
const Num = g.Num, NLS = g.NLS;
const { exp, log, pow, max, min, abs, sqrt, PI } = Math;
const G = {};

/* ---------------- increments ---------------- */
G.increments = function (series) {
  const s = series.filter(r => isFinite(r.t) && isFinite(r.y) && r.t > 0).slice().sort((a, b) => a.t - b.t);
  const out = s.map((r, i) => ({ t: r.t, y: r.y, ima: r.y / r.t, ica: i ? (r.y - s[i - 1].y) / (r.t - s[i - 1].t) : NaN }));
  /* the age of the largest IMA, and the crossing of ICA and IMA that goes with it. IMA rises over an interval
     exactly when the (periodic) ICA of the interval exceeds the IMA at its start, so f = ICA − IMA(start) is
     positive on the interval that ends at the largest IMA and not positive on the next; f is placed at the
     middle of each interval and the crossing interpolated linearly between those two midpoints */
  let best = 0;
  out.forEach((r, i) => { if (r.ima > out[best].ima) best = i; });
  let cross = NaN;
  if (best >= 1 && best < out.length - 1) {
    const f = i => out[i].ica - out[i - 1].ima, mid = i => (out[i - 1].t + out[i].t) / 2;
    const fa = f(best), fb = f(best + 1);
    cross = mid(best) + (mid(best + 1) - mid(best)) * fa / (fa - fb);
  }
  return { rows: out, tMaxIMA: out[best].t, maxIMA: out[best].ima, tCross: cross };
};

/* ---------------- growth models ---------------- */
const M = {
  chapman: { es: 'Chapman–Richards', en: 'Chapman–Richards', eq: 'Y = A · (1 − e^(−k·t))^p', names: ['A', 'k', 'p'],
    f: (b, t) => b[0] * pow(1 - exp(-b[1] * t), b[2]),
    start: d => { const ym = max(...d.map(r => r.y)); return [[ym * 1.3, 0.05, 1.5], [ym * 1.8, 0.03, 1.2], [ym * 1.1, 0.1, 2], [ym * 2.5, 0.02, 1]]; }, lower: [1e-6, 1e-6, 0.05], upper: [1e6, 5, 50] },
  gompertz: { es: 'Gompertz', en: 'Gompertz', eq: 'Y = A · exp(−b · e^(−k·t))', names: ['A', 'b', 'k'],
    f: (b, t) => b[0] * exp(-b[1] * exp(-b[2] * t)),
    start: d => { const ym = max(...d.map(r => r.y)); return [[ym * 1.3, 3, 0.1], [ym * 1.8, 2, 0.05], [ym * 1.1, 5, 0.15]]; }, lower: [1e-6, 1e-6, 1e-6], upper: [1e6, 1e3, 5] },
  schumacher: { es: 'Schumacher', en: 'Schumacher', eq: 'Y = A · exp(−b / t)', names: ['A', 'b'],
    f: (b, t) => b[0] * exp(-b[1] / t),
    start: d => { const L = Num.ols(d.filter(r => r.y > 0).map(r => [1, 1 / r.t]), d.filter(r => r.y > 0).map(r => log(r.y))); return L.ok ? [[exp(L.coef[0]), -L.coef[1]]] : [[max(...d.map(r => r.y)) * 1.5, 10]]; }, lower: [1e-6, -1e4], upper: [1e6, 1e4] },
  logistic: { es: 'Logística', en: 'Logistic', eq: 'Y = A / (1 + b · e^(−k·t))', names: ['A', 'b', 'k'],
    f: (b, t) => b[0] / (1 + b[1] * exp(-b[2] * t)),
    start: d => { const ym = max(...d.map(r => r.y)); return [[ym * 1.2, 10, 0.15], [ym * 1.6, 20, 0.1], [ym * 1.05, 5, 0.25]]; }, lower: [1e-6, 1e-6, 1e-6], upper: [1e6, 1e5, 5] },
};
G.MODELS = M;
/* ages of the largest current increment (max of dY/dt) and of the largest mean increment (max of Y/t). Curves that do
   not pass through the origin (Gompertz, logistic) have Y(0) > 0 and Y/t grows without bound near zero, so the mean
   increment is searched from the youngest age observed; a maximum stuck at either end is flagged. */
G.criticalAges = function (f, tMax, tMin) {
  const d = t => (f(t + 1e-4) - f(t - 1e-4)) / 2e-4;
  const T = tMax * 4;
  const argmax = (h, a) => {
    let bt = a, bv = -Infinity;
    for (let i = 0; i < 800; i++) { const t = a + i * (T - a) / 799, v = h(t); if (v > bv) { bv = v; bt = t; } }
    const step = (T - a) / 799;
    const r = Num.golden(t => -h(t), max(a, bt - step), min(T, bt + step), 1e-10);
    return { t: r.x, v: -r.f };
  };
  const t0 = tMin > 0 ? tMin : 0.1;
  const ica = argmax(d, 0.1), ima = argmax(t => f(t) / t, t0);
  return { tICA: ica.t, maxICA: ica.v, tIMA: ima.t, maxIMA: ima.v, edge: ima.t > T * 0.98 || ima.t < t0 * 1.02 };
};
G.fitGrowth = function (data, keys) {
  const ok = data.filter(r => r.t > 0 && isFinite(r.y));
  const tMax = max(...ok.map(r => r.t)), tMin = min(...ok.map(r => r.t));
  return (keys || Object.keys(M)).map(k => {
    const m = M[k];
    const fit = NLS.fit({ f: (b, r) => m.f(b, r.t), x: ok, y: ok.map(r => r.y), start: m.start(ok), names: m.names, lower: m.lower, upper: m.upper });
    if (!fit.ok) return { key: k, ok: false, model: m };
    const ff = t => m.f(fit.coef, t);
    return { key: k, ok: true, model: m, fit, f: ff, crit: G.criticalAges(ff, tMax, tMin), n: ok.length };
  });
};

/* ---------------- site index ----------------
   data: [{plot, t, h}] (dominant height of each plot at each age); tb: base age */
G.SITE = {
  schum: { es: 'Anamórficas de Schumacher (curva guía ln H = b₀ + b₁/t)', en: 'Schumacher anamorphic (guide curve ln H = b₀ + b₁/t)' },
  chapAna: { es: 'Anamórficas de Chapman–Richards (curva guía)', en: 'Chapman–Richards anamorphic (guide curve)' },
  chapADA: { es: 'Polimórficas de Chapman–Richards (diferencias algebraicas en la tasa)', en: 'Chapman–Richards polymorphic (algebraic differences on the rate)' },
};
/* consecutive pairs of each plot */
G.pairs = function (data) {
  const by = new Map();
  data.forEach(r => { const k = String(r.plot); if (!by.has(k)) by.set(k, []); by.get(k).push(r); });
  const out = [];
  by.forEach((rs, k) => { const s = rs.slice().sort((a, b) => a.t - b.t); for (let i = 1; i < s.length; i++) out.push({ plot: k, t1: s[i - 1].t, h1: s[i - 1].h, t2: s[i].t, h2: s[i].h, a: s[i - 1], b: s[i] }); });
  return out;
};
G.siteFit = function (data, tb, method) {
  const ok = data.filter(r => r.t > 0 && r.h > 0);
  if (method === 'schum') {
    const fit = Num.ols(ok.map(r => [1, 1 / r.t]), ok.map(r => log(r.h)));
    if (!fit.ok) return { ok: false };
    const b1 = fit.coef[1];
    return { ok: true, method, fit, names: ['b0', 'b1'], tb,
      si: (t, h) => h * exp(b1 * (1 / tb - 1 / t)), curve: (si, t) => si * exp(b1 * (1 / t - 1 / tb)), guide: t => exp(fit.coef[0] + b1 / t) };
  }
  if (method === 'chapAna') {
    const m = M.chapman;
    const fit = NLS.fit({ f: (b, r) => m.f(b, r.t), x: ok, y: ok.map(r => r.h), start: m.start(ok.map(r => ({ t: r.t, y: r.h }))), names: m.names, lower: m.lower, upper: m.upper });
    if (!fit.ok) return { ok: false };
    const [, k, p] = fit.coef;
    const q = t => pow(1 - exp(-k * t), p);
    return { ok: true, method, fit, names: m.names, tb, si: (t, h) => h * q(tb) / q(t), curve: (si, t) => si * q(t) / q(tb), guide: t => m.f(fit.coef, t) };
  }
  /* polymorphic: H₂ = A (1 − (1 − (H₁/A)^(1/p))^(t₂/t₁))^p, the rate k of each site solved from (t₁, H₁) */
  const pr = G.pairs(ok);
  if (pr.length < 4) return { ok: false, reason: 'pairs' };
  const f = (b, r) => { const A = b[0], p = b[1], u = 1 - pow(min(r.h1 / A, 0.999999), 1 / p); return A * pow(1 - pow(u, r.t2 / r.t1), p); };
  const hmax = max(...ok.map(r => r.h));
  const fit = NLS.fit({ f, x: pr, y: pr.map(r => r.h2), start: [[hmax * 1.3, 1.3], [hmax * 1.8, 1.1], [hmax * 1.1, 1.6], [hmax * 2.5, 1]], names: ['A', 'p'], lower: [hmax * 1.001, 0.05], upper: [hmax * 20, 20] });
  if (!fit.ok) return { ok: false };
  const [A, p] = fit.coef;
  const proj = (h1, t1, t2) => { const u = 1 - pow(min(h1 / A, 0.999999), 1 / p); return A * pow(1 - pow(u, t2 / t1), p); };
  return { ok: true, method, fit, names: ['A', 'p'], tb, pairs: pr, si: (t, h) => proj(h, t, tb), curve: (si, t) => proj(si, tb, t), guide: null, A, p };
};
/* the site index of each plot (mean of the indices of its measurements) and its class, I the best */
G.classify = function (data, sf, nClasses) {
  const by = new Map();
  data.forEach(r => { if (!(r.t > 0 && r.h > 0)) return; const k = String(r.plot); if (!by.has(k)) by.set(k, []); by.get(k).push(sf.si(r.t, r.h)); });
  const plots = [...by.entries()].map(([plot, v]) => ({ plot, si: Num.mean(v), n: v.length, siSd: v.length > 1 ? Num.sd(v) : NaN }));
  const lo = min(...plots.map(p => p.si)), hi = max(...plots.map(p => p.si)), w = (hi - lo) / nClasses;
  const edges = Array.from({ length: nClasses + 1 }, (_, i) => lo + i * w);
  plots.forEach(p => { let k = Math.floor((p.si - lo) / w); if (k >= nClasses) k = nClasses - 1; p.cls = nClasses - k; });
  const classes = Array.from({ length: nClasses }, (_, i) => { const k = nClasses - 1 - i; return { cls: i + 1, lo: edges[k], hi: edges[k + 1], mid: (edges[k] + edges[k + 1]) / 2, n: plots.filter(p => p.cls === i + 1).length }; });
  return { plots, classes };
};
G.roman = n => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] || String(n);

/* ---------------- Clutter (1963) ----------------
   rows: [{plot, t, g, v, s}] with g basal area (m²/ha), v volume (m³/ha), s site index of the plot */
G.clutter = function (rows) {
  const pr = [];
  const by = new Map();
  rows.forEach(r => { if (!(r.t > 0 && r.g > 0 && r.v > 0 && isFinite(r.s))) return; const k = String(r.plot); if (!by.has(k)) by.set(k, []); by.get(k).push(r); });
  by.forEach(rs => { const s = rs.slice().sort((a, b) => a.t - b.t); for (let i = 1; i < s.length; i++) pr.push({ t1: s[i - 1].t, t2: s[i].t, g1: s[i - 1].g, g2: s[i].g, v2: s[i].v, s: s[i].s }); });
  if (pr.length < 6) return { ok: false, reason: 'pairs' };
  /* basal area: ln G₂ − ln G₁·t₁/t₂ = α₀(1 − t₁/t₂) + α₁(1 − t₁/t₂)S, no intercept */
  const Xg = pr.map(p => { const r = 1 - p.t1 / p.t2; return [r, r * p.s]; });
  const yg = pr.map(p => log(p.g2) - log(p.g1) * p.t1 / p.t2);
  const fg = Num.ols(Xg, yg, { intercept: false });
  /* volume: ln V₂ = β₀ + β₁/t₂ + β₂S + β₃ ln G₂, with ln G₂ replaced by its projection on every exogenous variable */
  const Z = pr.map(p => { const r = 1 - p.t1 / p.t2; return [1, 1 / p.t2, p.s, log(p.g1) * p.t1 / p.t2, r, r * p.s]; });
  const s1 = Num.ols(Z, pr.map(p => log(p.g2)));
  const Xv = pr.map((p, i) => [1, 1 / p.t2, p.s, s1.fitted[i]]);
  const fv = Num.ols(Xv, pr.map(p => log(p.v2)));
  /* structural residuals use the observed ln G₂ */
  const Xo = pr.map(p => [1, 1 / p.t2, p.s, log(p.g2)]);
  const res = pr.map((p, i) => log(p.v2) - Xo[i].reduce((s, x, j) => s + x * fv.coef[j], 0));
  const n = pr.length, kv = 4, rssV = res.reduce((s, e) => s + e * e, 0), s2v = rssV / (n - kv);
  const covV = fv.XtXi.map(r => r.map(v => v * s2v));
  const seV = covV.map((r, i) => sqrt(r[i]));
  return { ok: true, pairs: pr, n,
    alpha: fg.coef, seAlpha: fg.se, sigmaG: fg.sigma,
    beta: fv.coef, seBeta: seV, sigmaV: sqrt(s2v), stage1: s1 };
};
/* project basal area and volume from (t₁, G₁) to every age in ages, for site index S */
G.clutterProject = function (c, S, t1, g1, ages) {
  return ages.map(t => {
    const r = 1 - t1 / t;
    const lg = log(g1) * t1 / t + c.alpha[0] * r + c.alpha[1] * r * S;
    const lv = c.beta[0] + c.beta[1] / t + c.beta[2] * S + c.beta[3] * lg;
    return { t, G: exp(lg), V: exp(lv) };
  });
};
/* a yield table: Clutter for G and V, dominant height from the site model, survival at a constant annual rate,
   quadratic mean diameter from G and N; ICA and IMA of volume */
G.yieldTable = function (o) {
  const ages = [];
  for (let t = o.t0; t <= o.tEnd + 1e-9; t += o.step) ages.push(+t.toFixed(6));
  /* the final age always closes the table, even when the step does not land on it */
  if (ages[ages.length - 1] < o.tEnd - 1e-9) ages.push(+(+o.tEnd).toFixed(6));
  const pr = G.clutterProject(o.clutter, o.S, o.t0, o.g0, ages);
  const rows = pr.map((r, i) => {
    const N = o.n0 * pow(1 - (o.mort || 0) / 100, r.t - o.t0);
    const hd = o.site ? o.site.curve(o.S, r.t) : NaN;
    return { t: r.t, hdom: hd, N, G: r.G, dq: sqrt(r.G / N * 40000 / PI), V: r.V, ima: r.V / r.t, ica: i ? (r.V - pr[i - 1].V) / (r.t - pr[i - 1].t) : NaN };
  });
  return G.finishYield(rows);
};
/* the IMA and ICA of an (edited) table, and the age of the largest IMA */
G.finishYield = function (rows) {
  rows.forEach((r, i) => { r.ima = r.V / r.t; r.ica = i ? (r.V - rows[i - 1].V) / (r.t - rows[i - 1].t) : NaN; });
  let b = 0;
  rows.forEach((r, i) => { if (r.ima > rows[b].ima) b = i; });
  return { rows, tRot: rows[b].t, maxIMA: rows[b].ima, atEnd: b === rows.length - 1 };
};

g.Growth = G;
return G;
}
if (typeof window !== 'undefined') GrowthCore(window);
else if (typeof globalThis !== 'undefined') GrowthCore(globalThis);
