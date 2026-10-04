/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — nonlinear least squares.

   Levenberg–Marquardt with Marquardt's scaling (the damping is added to the
   diagonal of JᵀJ, so every parameter moves on its own scale; Marquardt 1963,
   J. SIAM 11:431–441; Moré 1978). The Jacobian is analytic when the model
   gives it and, otherwise, central differences with a step relative to each
   parameter. Several starting points may be given; the best fit is kept.

   At the solution the covariance of the estimates is σ̂²(JᵀJ)⁻¹ with
   σ̂² = RSS/(n − k), and t, p, AIC and BIC are computed as R's nls does
   (log-likelihood with σ² by maximum likelihood, k + 1 parameters), so the
   tables of fit can be compared one to one.

   Needs Num (num.js). No DOM. */
function NLSCore(g) {
'use strict';
const Num = g.Num;
const { abs, sqrt, log, PI, max } = Math;
const NLS = {};

function jacobian(f, th, X, grad, lower, upper) {
  const n = X.length, k = th.length, J = Num.zeros(n, k);
  if (grad) {
    for (let i = 0; i < n; i++) { const gi = grad(th, X[i], i); for (let j = 0; j < k; j++) J[i][j] = gi[j]; }
    return J;
  }
  for (let j = 0; j < k; j++) {
    const h = 1e-6 * max(abs(th[j]), 1e-4);
    const a = th.slice(), b = th.slice();
    a[j] += h; b[j] -= h;
    /* one-sided at a bound */
    let ha = h, hb = h;
    if (upper && a[j] > upper[j]) { a[j] = th[j]; ha = 0; }
    if (lower && b[j] < lower[j]) { b[j] = th[j]; hb = 0; }
    for (let i = 0; i < n; i++) J[i][j] = (f(a, X[i], i) - f(b, X[i], i)) / (ha + hb);
  }
  return J;
}
function rssOf(f, th, X, y, w) {
  let s = 0;
  for (let i = 0; i < X.length; i++) {
    const r = y[i] - f(th, X[i], i);
    if (!isFinite(r)) return Infinity;
    s += (w ? w[i] : 1) * r * r;
  }
  return s;
}
const clampTo = (th, lo, hi) => th.map((v, j) => {
  if (lo && lo[j] != null && v < lo[j]) v = lo[j];
  if (hi && hi[j] != null && v > hi[j]) v = hi[j];
  return v;
});

/* one run of Levenberg–Marquardt from one start */
function lm(o, start) {
  const { f, x: X, y, w, grad, lower, upper } = o;
  const n = X.length, k = start.length;
  let th = clampTo(start.slice(), lower, upper);
  let rss = rssOf(f, th, X, y, w);
  if (!isFinite(rss)) return { ok: false, th, rss, it: 0, why: 'start' };
  let lam = 1e-3, it = 0, converged = false;
  const maxIt = o.maxIt || 500;
  for (; it < maxIt; it++) {
    const J = jacobian(f, th, X, grad, lower, upper);
    const r = X.map((xi, i) => y[i] - f(th, xi, i));
    const A = Num.zeros(k, k), b = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const wi = w ? w[i] : 1, Ji = J[i];
      for (let a = 0; a < k; a++) {
        b[a] += wi * Ji[a] * r[i];
        for (let c = 0; c <= a; c++) A[a][c] += wi * Ji[a] * Ji[c];
      }
    }
    for (let a = 0; a < k; a++) for (let c = 0; c < a; c++) A[c][a] = A[a][c];
    let improved = false;
    for (let tries = 0; tries < 40; tries++) {
      const M = A.map((row, a) => row.map((v, c) => a === c ? v + lam * max(v, 1e-12) : v));
      const d = Num.solve(M, b);
      if (!d) { lam *= 10; continue; }
      const nt = clampTo(th.map((v, j) => v + d[j]), lower, upper);
      const nr = rssOf(f, nt, X, y, w);
      if (nr <= rss) {
        const rel = (rss - nr) / max(rss, 1e-300);
        const small = d.every((dj, j) => abs(dj) <= 1e-9 * (abs(th[j]) + 1e-9));
        th = nt;
        const old = rss;
        rss = nr;
        lam = max(lam / 10, 1e-12);
        improved = true;
        if (rel < 1e-12 || small || old === 0) converged = true;
        break;
      }
      lam *= 10;
      if (lam > 1e16) break;
    }
    if (!improved || converged) { if (!improved) converged = converged || true; break; }
  }
  return { ok: true, th, rss, it, converged };
}

/* o: { f(θ, xᵢ, i) → ŷᵢ, x: [xᵢ…], y: [yᵢ…], start: θ₀ or [θ₀…], names?: [...], grad?, w?, lower?, upper?, maxIt? } */
NLS.fit = function (o) {
  const starts = Array.isArray(o.start[0]) ? o.start : [o.start];
  let best = null;
  for (const s of starts) {
    let r;
    try { r = lm(o, s); } catch (e) { r = { ok: false }; }
    if (r.ok && isFinite(r.rss) && (!best || r.rss < best.rss)) best = r;
  }
  if (!best) return { ok: false, reason: 'noconv' };
  return NLS.summary(o, best.th, best.it, best.converged);
};

/* the table of a fit at θ (also used to describe a model with fixed coefficients) */
NLS.summary = function (o, th, it, converged) {
  const { f, x: X, y, w, grad } = o;
  const n = X.length, k = th.length;
  const fitted = X.map((xi, i) => f(th, xi, i)), resid = y.map((v, i) => v - fitted[i]);
  let rss = 0, sw = 0, ybar = 0, lw = 0;
  for (let i = 0; i < n; i++) { const wi = w ? w[i] : 1; rss += wi * resid[i] * resid[i]; sw += wi; ybar += wi * y[i]; if (w) lw += log(wi); }
  ybar /= sw;
  let tss = 0;
  for (let i = 0; i < n; i++) tss += (w ? w[i] : 1) * (y[i] - ybar) * (y[i] - ybar);
  const df = n - k, s2 = rss / df, sigma = sqrt(s2);
  const J = jacobian(f, th, X, grad, null, null);
  const A = Num.zeros(k, k);
  for (let i = 0; i < n; i++) { const wi = w ? w[i] : 1; for (let a = 0; a < k; a++) for (let c = 0; c < k; c++) A[a][c] += wi * J[i][a] * J[i][c]; }
  const Ai = Num.inv(A);
  const cov = Ai ? Ai.map(r => r.map(v => v * s2)) : null;
  const se = cov ? cov.map((r, i) => sqrt(max(r[i], 0))) : th.map(() => NaN);
  const t = th.map((c, i) => c / se[i]), p = t.map(v => isFinite(v) ? Num.pt2(v, df) : NaN);
  const logLik = 0.5 * (lw - n * (log(2 * PI) + 1 - log(n) + log(rss)));
  let bias = 0, mae = 0;
  for (let i = 0; i < n; i++) { bias += resid[i]; mae += abs(resid[i]); }
  return {
    ok: true, coef: th.slice(), names: o.names || th.map((_, i) => 'b' + i), se, t, p, cov,
    fitted, resid, rss, tss, df, n, k, sigma, rmse: sqrt(rss / n),
    r2: 1 - rss / tss, adjr2: 1 - (1 - rss / tss) * (n - 1) / df,
    bias: bias / n, mae: mae / n, logLik,
    aic: -2 * logLik + 2 * (k + 1), bic: -2 * logLik + log(n) * (k + 1),
    iterations: it || 0, converged: converged !== false,
  };
};

/* prediction with a standard error (delta method) at a new point */
NLS.predict = function (fit, f, xi) {
  const th = fit.coef, k = th.length, y = f(th, xi);
  if (!fit.cov) return { y, se: NaN };
  const gr = new Array(k);
  for (let j = 0; j < k; j++) {
    const h = 1e-6 * max(abs(th[j]), 1e-4), a = th.slice(), b = th.slice();
    a[j] += h; b[j] -= h;
    gr[j] = (f(a, xi) - f(b, xi)) / (2 * h);
  }
  let v = 0;
  for (let a = 0; a < k; a++) for (let c = 0; c < k; c++) v += gr[a] * fit.cov[a][c] * gr[c];
  return { y, se: sqrt(max(v, 0)) };
};

g.NLS = NLS;
return NLS;
}
if (typeof window !== 'undefined') NLSCore(window);
else if (typeof globalThis !== 'undefined') NLSCore(globalThis);
