/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 3: forest inventory and sampling.

   · Sample size for a permissible error, iterating the t of Student with the
     degrees of freedom of the size it gives (Cochran 1977, §4.6; Husch et al.
     2003, ch. 13); with the finite-population correction when the number of
     possible plots is known. For strata: proportional and optimum (Neyman)
     allocation (Cochran 1977, §5.5).
   · Estimators per hectare: simple random sampling; stratified random
     sampling with the allocation actually used, V = Σ W²ₕ s²ₕ/nₕ (1 − fₕ), and
     the effective degrees of freedom of Satterthwaite (Cochran 1977, eq. 5.16);
     systematic sampling by the successive-differences variance (Cochran 1977,
     §8.11); one-stage cluster sampling with clusters of unequal size by the
     ratio estimator (Cochran 1977, §9A.2); point sampling with a basal-area
     factor (Bitterlich 1948; Grosenbaugh 1952).
   · Expansion of each tree to the hectare from circular, square, rectangular or
     nested plots; per-plot N, G, V, Dq and dominant height (the mean height of
     the 100 thickest trees per hectare, Assmann 1970).
   · Structure: diameter classes, two- and three-parameter Weibull fitted by
     (weighted) maximum likelihood with Kolmogorov–Smirnov and χ² tests (Bailey
     and Dell 1973), stand tables, importance value index (Curtis and McIntosh
     1951), Reineke's stand density index (1933), Hart–Becking spacing index and
     Hegyi's competition index (1974).
   Needs Num. No DOM. */
function InventCore(g) {
'use strict';
const Num = g.Num;
const { PI, sqrt, log, exp, abs, max, min, pow, ceil } = Math;
const I = {};

/* ---------------- sample size ---------------- */
/* cv and err in %; N = number of possible plots (Infinity: no correction) */
I.sampleSize = function (o) {
  const cv = o.cv, E = o.err, conf = o.conf || 0.95, N = o.N > 0 ? o.N : Infinity;
  const tq = df => Num.qt(1 - (1 - conf) / 2, max(1, df));
  let n = 30, t = tq(n - 1), it = 0, prev = -1;
  const nOf = t => isFinite(N) ? t * t * cv * cv / (E * E + t * t * cv * cv / N) : t * t * cv * cv / (E * E);
  while (it < 100) {
    const nx = max(2, ceil(nOf(t) - 1e-9));
    if (nx === prev) break;
    prev = n = nx; t = tq(n - 1); it++;
  }
  return { n, exact: nOf(t), t, it, nInf: ceil(t * t * cv * cv / (E * E) - 1e-9), N };
};
/* strata: [{name, w (weight or area), s (sd), mean}] → n for an error E (% of the stratified mean) */
I.stratSampleSize = function (o) {
  const S = o.strata, conf = o.conf || 0.95;
  const W = S.map(s => s.w), sw = W.reduce((a, b) => a + b, 0), Wh = W.map(w => w / sw);
  const mean = S.reduce((a, s, i) => a + Wh[i] * s.mean, 0);
  const D = o.err / 100 * mean;
  const sumWS = S.reduce((a, s, i) => a + Wh[i] * s.s, 0), sumWS2 = S.reduce((a, s, i) => a + Wh[i] * s.s * s.s, 0);
  const Ntot = o.N > 0 ? o.N : Infinity;
  let n = 30, prev = -1, t = 2, it = 0;
  while (it < 100) {
    t = Num.qt(1 - (1 - conf) / 2, max(1, n - 1));
    const d2 = (D / t) * (D / t);
    const raw = o.alloc === 'prop' ? sumWS2 / (d2 + sumWS2 / Ntot) : sumWS * sumWS / (d2 + sumWS2 / Ntot);
    const nx = max(S.length * 2, ceil(raw - 1e-9));
    if (nx === prev) break;
    prev = n = nx; it++;
  }
  const nh = S.map((s, i) => o.alloc === 'prop' ? Wh[i] * n : n * Wh[i] * s.s / sumWS);
  return { n, t, mean, D, nh: nh.map(v => max(2, Math.round(v))), nhExact: nh, Wh };
};

/* ---------------- estimators of the mean per hectare ----------------
   y: values per hectare of each plot; N: number of possible plots (area / plot area; Infinity if unknown);
   area: hectares of the population (for the totals). */
const tOf = (conf, df) => Num.qt(1 - (1 - (conf || 0.95)) / 2, max(1, df));
function finish(r, conf, area) {
  r.t = tOf(conf, r.df);
  r.half = r.t * r.se;
  r.lo = r.mean - r.half; r.hi = r.mean + r.half;
  r.errPct = 100 * r.half / r.mean;
  if (area > 0) { r.total = r.mean * area; r.totalLo = r.lo * area; r.totalHi = r.hi * area; r.area = area; }
  return r;
}
I.srs = function (y, o) {
  o = o || {};
  const v = Num.finite(y), n = v.length, mean = Num.mean(v), s2 = Num.variance(v), sd = sqrt(s2);
  const N = o.N > 0 ? o.N : Infinity, f = isFinite(N) ? n / N : 0;
  const se = sqrt(s2 / n * (1 - f));
  return finish({ design: 'srs', n, mean, s2, sd, cv: 100 * sd / mean, se, df: n - 1, f, N }, o.conf, o.area);
};
/* strata: [{name, y: [...], area (ha) or N}] */
I.strat = function (strata, o) {
  o = o || {};
  const areas = strata.map(s => s.area), A = areas.reduce((a, b) => a + b, 0);
  const rows = strata.map(s => {
    const v = Num.finite(s.y), n = v.length, m = Num.mean(v), s2 = n > 1 ? Num.variance(v) : NaN;
    const Nh = o.plotArea > 0 ? s.area / o.plotArea : Infinity, f = isFinite(Nh) ? n / Nh : 0;
    return { name: s.name, n, mean: m, s2, sd: sqrt(s2), area: s.area, W: s.area / A, Nh, f };
  });
  const mean = rows.reduce((a, r) => a + r.W * r.mean, 0);
  const terms = rows.map(r => r.W * r.W * r.s2 / r.n * (1 - r.f));
  const v = terms.reduce((a, b) => a + b, 0), se = sqrt(v);
  /* Satterthwaite's effective degrees of freedom, with gₕ = Wₕ²(1 − fₕ)/nₕ */
  const den = rows.reduce((a, r, i) => a + terms[i] * terms[i] / (r.n - 1), 0);
  const df = den > 0 ? v * v / den : rows.reduce((a, r) => a + r.n, 0) - rows.length;
  rows.forEach(r => { r.se = sqrt(r.s2 / r.n * (1 - r.f)); const t = tOf(o.conf, r.n - 1); r.lo = r.mean - t * r.se; r.hi = r.mean + t * r.se; r.errPct = 100 * t * r.se / r.mean; });
  /* the same data as if they were one simple random sample: the gain of stratifying */
  const all = [].concat(...strata.map(s => Num.finite(s.y)));
  const srsVar = Num.variance(all) / all.length;
  /* the standard error forestry tables often print: the one of optimum (Neyman) allocation, (Σ Wₕ sₕ)²/n */
  const nTot = rows.reduce((a, r) => a + r.n, 0), sumWS = rows.reduce((a, r) => a + r.W * r.sd, 0);
  const res = finish({ design: 'strat', n: nTot, mean, se, df, strata: rows, var: v, srsVar, efficiency: srsVar / v, seNeyman: sqrt(sumWS * sumWS / nTot) }, o.conf, o.area || A);
  res.cv = 100 * sqrt(rows.reduce((a, r) => a + r.W * r.s2, 0)) / mean;
  return res;
};
/* systematic sample: y in the order of the grid; variance by successive differences */
I.systematic = function (y, o) {
  o = o || {};
  const v = Num.finite(y), n = v.length, mean = Num.mean(v);
  let sd2 = 0;
  for (let i = 1; i < n; i++) sd2 += (v[i] - v[i - 1]) * (v[i] - v[i - 1]);
  const N = o.N > 0 ? o.N : Infinity, f = isFinite(N) ? n / N : 0;
  const se = sqrt(sd2 / (2 * n * (n - 1)) * (1 - f));
  const asSrs = I.srs(v, o);
  return finish({ design: 'sys', n, mean, se, df: n - 1, f, N, seSrs: asSrs.se, sd: asSrs.sd, cv: asSrs.cv }, o.conf, o.area);
};
/* one-stage cluster sampling: clusters [{id, y: [values of its plots]}]; the mean per plot is the ratio
   Σ yᵢ / Σ mᵢ with yᵢ the cluster total and mᵢ its number of plots; N = clusters in the population */
I.cluster = function (clusters, o) {
  o = o || {};
  const cl = clusters.map(c => { const v = Num.finite(c.y); return { id: c.id, m: v.length, tot: v.reduce((a, b) => a + b, 0) }; }).filter(c => c.m > 0);
  const n = cl.length, M = cl.reduce((a, c) => a + c.m, 0), mbar = M / n;
  const mean = cl.reduce((a, c) => a + c.tot, 0) / M;
  const N = o.N > 0 ? o.N : Infinity, f = isFinite(N) ? n / N : 0;
  const sr = cl.reduce((a, c) => a + (c.tot - mean * c.m) * (c.tot - mean * c.m), 0) / (n - 1);
  const se = sqrt((1 - f) / (n * mbar * mbar) * sr);
  /* how much clustering costs: the variance of the plots as if they were independent */
  const all = [].concat(...clusters.map(c => Num.finite(c.y)));
  const seSrs = Num.sd(all) / sqrt(all.length);
  return finish({ design: 'cluster', n, M, mbar, mean, se, df: n - 1, f, N, seSrs, deff: (se * se) / (seSrs * seSrs), clusters: cl }, o.conf, o.area);
};

/* ---------------- plots and expansion ---------------- */
/* plot: {shape: 'circle'|'square'|'rect'|'nested', r, side, a, b, rSmall, dCut} → area (m²) for a tree of diameter d */
I.plotArea = function (p, d) {
  if (p.area > 0 && p.shape !== 'nested') return p.area;
  if (p.shape === 'square') return p.side * p.side;
  if (p.shape === 'rect') return p.a * p.b;
  if (p.shape === 'nested') return d >= p.dCut ? PI * p.r * p.r : PI * p.rSmall * p.rSmall;
  return PI * p.r * p.r;
};
I.expansion = (p, d) => 10000 / I.plotArea(p, d);
/* trees: [{plot, d, h, v, alive}] with v already computed (m³) or NaN; plots: Map plot → design.
   Returns one record per plot with the values per hectare. */
I.perPlot = function (trees, plotOf, o) {
  o = o || {};
  const by = new Map();
  trees.forEach(t => { const k = String(t.plot); if (!by.has(k)) by.set(k, []); by.get(k).push(t); });
  const keys = o.plots ? o.plots.map(String) : [...by.keys()];
  return keys.map(k => {
    const ts = (by.get(k) || []).filter(t => isFinite(t.d) && t.d > 0);
    const p = plotOf(k);
    let N = 0, G = 0, V = 0, sd2 = 0, Nd = 0, Gd = 0, vOk = true;
    const live = [];
    ts.forEach(t => {
      const ef = I.expansion(p, t.d);
      t.ef = ef;
      if (t.alive === false) { Nd += ef; Gd += ef * PI * t.d * t.d / 40000; return; }
      N += ef; G += ef * PI * t.d * t.d / 40000; sd2 += ef * t.d * t.d;
      if (isFinite(t.v)) V += ef * t.v; else vOk = false;
      live.push(t);
    });
    return { plot: k, n: ts.length, N, G, V: vOk ? V : NaN, dq: N > 0 ? sqrt(sd2 / N) : NaN, hdom: I.dominantHeight(live, o.nDom || 100), Ndead: Nd, Gdead: Gd, trees: ts };
  });
};
/* mean height of the nDom thickest trees per hectare (Assmann); with expansion factors, each tree
   counts as ef trees per hectare and the last one only partly */
I.dominantHeight = function (trees, nDom) {
  const ts = trees.filter(t => isFinite(t.h) && t.h > 0 && t.ef > 0).slice().sort((a, b) => b.d - a.d);
  let left = nDom || 100, sh = 0, sw = 0;
  for (const t of ts) { if (left <= 0) break; const w = min(t.ef, left); sh += w * t.h; sw += w; left -= w; }
  return sw > 0 ? sh / sw : NaN;
};

/* ---------------- point sampling (relascope) ----------------
   points: [{point, trees: [{d, h, v}]}] of the trees counted «in» at each point; BAF in m²/ha.
   Each counted tree stands for BAF/g trees per hectare. */
I.relascope = function (points, BAF, o) {
  const per = points.map(p => {
    let N = 0, V = 0, vOk = true;
    p.trees.forEach(t => { const gi = PI * t.d * t.d / 40000, k = BAF / gi; N += k; if (isFinite(t.v)) V += k * t.v; else vOk = false; });
    return { point: p.point, count: p.trees.length, G: BAF * p.trees.length, N, V: vOk ? V : NaN };
  });
  return { per, G: I.srs(per.map(p => p.G), o), N: I.srs(per.map(p => p.N), o), V: per.every(p => isFinite(p.V)) ? I.srs(per.map(p => p.V), o) : null };
};
/* the limiting distance of a tree of diameter d (cm) for a factor BAF: R = d / (2√BAF) m */
I.limitingDistance = (d, BAF) => d / (2 * sqrt(BAF));

/* ---------------- diameter distribution ---------------- */
I.classes = function (d, w, o) {
  o = o || {};
  const x = d.filter(isFinite), wt = o.weights || null;
  const lo = o.start != null ? o.start : Math.floor(min(...x) / w) * w;
  const hi = Math.ceil((max(...x) + 1e-9) / w) * w;
  const edges = [];
  for (let e = lo; e <= hi + 1e-9; e += w) edges.push(+e.toFixed(6));
  if (edges.length < 2) edges.push(lo + w);
  const counts = new Array(edges.length - 1).fill(0);
  d.forEach((v, i) => { if (!isFinite(v)) return; let k = Math.floor((v - lo) / w + 1e-9); if (k >= counts.length) k = counts.length - 1; if (k >= 0) counts[k] += wt ? wt[i] : 1; });
  return { edges, counts, mids: counts.map((_, k) => (edges[k] + edges[k + 1]) / 2) };
};
/* Weibull by maximum likelihood (weights allowed): f(x) = (c/b)((x−a)/b)^(c−1) exp(−((x−a)/b)^c).
   For a fixed location a the score of the shape c is solved by Brent and the scale follows in closed form. */
function weibullFixedA(x, w, a) {
  const y = x.map(v => v - a);
  if (y.some(v => v <= 0)) return null;
  const sw = w.reduce((s, v) => s + v, 0);
  const ly = y.map(log), mlog = ly.reduce((s, v, i) => s + w[i] * v, 0) / sw;
  const score = c => {
    let s1 = 0, s2 = 0;
    for (let i = 0; i < y.length; i++) { const p = w[i] * pow(y[i], c); s1 += p * ly[i]; s2 += p; }
    return 1 / c + mlog - s1 / s2;
  };
  let lo = 0.05, hi = 1;
  while (score(hi) > 0 && hi < 200) hi *= 2;
  const c = Num.brent(score, lo, hi, 1e-13);
  let sp = 0;
  for (let i = 0; i < y.length; i++) sp += w[i] * pow(y[i], c);
  const b = pow(sp / sw, 1 / c);
  let ll = 0;
  for (let i = 0; i < y.length; i++) ll += w[i] * (log(c) - log(b) + (c - 1) * (ly[i] - log(b)) - pow(y[i] / b, c));
  return { a, b, c, ll };
}
I.weibull = function (d, o) {
  o = o || {};
  const x = [], w = [];
  d.forEach((v, i) => { if (isFinite(v) && v > 0) { x.push(v); w.push(o.weights ? o.weights[i] : 1); } });
  let fit;
  if (o.three) {
    const m = min(...x);
    if (o.location != null) fit = weibullFixedA(x, w, o.location);
    else {
      /* profile likelihood of the location on [0, min − ε]; the likelihood is unbounded when c < 1 near min, so the
         search stops at a small gap below the smallest diameter */
      const gap = max(1e-3, 0.002 * m);
      const r = Num.golden(a => { const f = weibullFixedA(x, w, a); return f ? -f.ll : Infinity; }, 0, m - gap, 1e-12);
      fit = weibullFixedA(x, w, r.x);
      fit.boundary = r.x > m - gap * 1.5;
    }
  } else fit = weibullFixedA(x, w, 0);
  const cdf = v => v <= fit.a ? 0 : 1 - exp(-pow((v - fit.a) / fit.b, fit.c));
  const pdf = v => v <= fit.a ? 0 : (fit.c / fit.b) * pow((v - fit.a) / fit.b, fit.c - 1) * exp(-pow((v - fit.a) / fit.b, fit.c));
  const k = o.three && o.location == null ? 3 : 2;
  const sw = w.reduce((s, v) => s + v, 0);
  return Object.assign(fit, { cdf, pdf, k, n: x.length, sw, aic: -2 * fit.ll + 2 * k, mean: fit.a + fit.b * exp(Num.lgamma(1 + 1 / fit.c)) });
};
/* Kolmogorov–Smirnov statistic of a sample against a cdf, with the asymptotic p of Kolmogorov
   (conservative when the parameters were estimated from the same sample) */
I.ks = function (x, cdf) {
  const s = Num.finite(x).slice().sort((a, b) => a - b), n = s.length;
  let D = 0;
  for (let i = 0; i < n; i++) { const F = cdf(s[i]); D = max(D, (i + 1) / n - F, F - i / n); }
  const lam = (sqrt(n) + 0.12 + 0.11 / sqrt(n)) * D;
  let p = 0;
  for (let k = 1; k < 100; k++) p += 2 * pow(-1, k - 1) * exp(-2 * k * k * lam * lam);
  /* the exact asymptotic form, as R's ks.test(exact = FALSE): λ = √n·D */
  const l2 = sqrt(n) * D;
  let p2 = 0;
  for (let k = 1; k < 100; k++) p2 += 2 * pow(-1, k - 1) * exp(-2 * k * k * l2 * l2);
  return { D, n, p: min(1, max(0, p2)), pStephens: min(1, max(0, p)) };
};
/* χ² of observed class counts against the expected ones from a cdf; classes with expected < 5 are merged
   with their neighbour from the tails inward (Cochran's rule) */
I.chi2 = function (edges, obs, cdf, nPar) {
  const n = obs.reduce((a, b) => a + b, 0);
  let E = obs.map((_, k) => n * (cdf(edges[k + 1]) - cdf(edges[k])));
  /* the tails beyond the first and last edges go to the end classes */
  E[0] += n * cdf(edges[0]); E[E.length - 1] += n * (1 - cdf(edges[edges.length - 1]));
  const O = obs.slice();
  const merged = [];
  let oo = 0, ee = 0;
  for (let k = 0; k < O.length; k++) { oo += O[k]; ee += E[k]; if (ee >= 5) { merged.push([oo, ee]); oo = 0; ee = 0; } }
  if (ee > 0 || oo > 0) { if (merged.length) { merged[merged.length - 1][0] += oo; merged[merged.length - 1][1] += ee; } else merged.push([oo, ee]); }
  const chi = merged.reduce((a, [o, e]) => a + (o - e) * (o - e) / e, 0);
  const df = merged.length - 1 - (nPar || 0);
  return { chi, df, p: df > 0 ? Num.pchisq(chi, df, true) : NaN, classes: merged.length };
};

/* ---------------- stand table and importance value ----------------
   trees: [{plot, sp, d, ef}] (live trees, with their expansion factor); nPlots: plots in the sample */
I.standTable = function (trees, edges) {
  const sps = [...new Set(trees.map(t => t.sp))];
  const K = edges.length - 1, nP = new Set(trees.map(t => t.plot)).size || 1;
  const rows = sps.map(sp => ({ sp, N: new Array(K).fill(0), G: new Array(K).fill(0) }));
  trees.forEach(t => {
    let k = -1;
    for (let j = 0; j < K; j++) if (t.d >= edges[j] && (t.d < edges[j + 1] || (j === K - 1 && t.d <= edges[j + 1] + 1e-9))) { k = j; break; }
    if (k < 0) return;
    const r = rows[sps.indexOf(t.sp)];
    r.N[k] += t.ef / nP; r.G[k] += t.ef * PI * t.d * t.d / 40000 / nP;
  });
  return { edges, rows, nPlots: nP };
};
I.ivi = function (trees, nPlots) {
  const by = new Map(), plotsWith = new Map();
  trees.forEach(t => {
    if (!by.has(t.sp)) { by.set(t.sp, { sp: t.sp, n: 0, N: 0, G: 0 }); plotsWith.set(t.sp, new Set()); }
    const r = by.get(t.sp); r.n++; r.N += t.ef; r.G += t.ef * PI * t.d * t.d / 40000; plotsWith.get(t.sp).add(t.plot);
  });
  const nP = nPlots || new Set(trees.map(t => t.plot)).size;
  const rows = [...by.values()].map(r => Object.assign(r, { N: r.N / nP, G: r.G / nP, F: plotsWith.get(r.sp).size / nP }));
  const sN = rows.reduce((a, r) => a + r.N, 0), sG = rows.reduce((a, r) => a + r.G, 0), sF = rows.reduce((a, r) => a + r.F, 0);
  rows.forEach(r => { r.Nr = 100 * r.N / sN; r.Gr = 100 * r.G / sG; r.Fr = 100 * r.F / sF; r.ivi = r.Nr + r.Gr + r.Fr; r.iviPct = r.ivi / 3; r.ivc = (r.Nr + r.Gr) / 2; });
  return rows.sort((a, b) => b.ivi - a.ivi);
};

/* ---------------- density and competition ---------------- */
/* Reineke: SDI = N (Dq/Dref)^1.605 (trees of the reference diameter per hectare at the same relative density) */
I.reineke = (N, dq, ref, b) => N * pow(dq / (ref || 25), b || 1.605);
/* Hart–Becking: mean spacing between trees as a percentage of the dominant height */
I.hartBecking = (N, h0, layout) => layout === 'tri' ? 100 * sqrt(20000 / (N * sqrt(3))) / h0 : 100 * sqrt(10000 / N) / h0;
/* Hegyi: CIᵢ = Σⱼ (Dⱼ/Dᵢ)/distᵢⱼ over the neighbours within R m; with a rectangular plot [0, W] × [0, H],
   trees closer than R to an edge are flagged (their index misses neighbours outside the plot); box may also
   be a function of the tree that says whether it is near the edge (circular plots) */
I.hegyi = function (trees, R, box) {
  return trees.map((t, i) => {
    let ci = 0, k = 0;
    trees.forEach((u, j) => {
      if (i === j) return;
      const dd = Math.hypot(t.x - u.x, t.y - u.y);
      if (dd > 0 && dd <= R) { ci += (u.d / t.d) / dd; k++; }
    });
    const edge = typeof box === 'function' ? box(t) : box ? (t.x < box[0] + R || t.x > box[1] - R || t.y < box[2] + R || t.y > box[3] - R) : false;
    return { i, ci, neighbours: k, edge };
  });
};

g.Invent = I;
return I;
}
if (typeof window !== 'undefined') InventCore(window);
else if (typeof globalThis !== 'undefined') InventCore(globalThis);
