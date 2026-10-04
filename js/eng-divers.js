/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 6: forest diversity and ecology.

   · Indices of a site from its abundances: richness, Shannon (natural log),
     Simpson (Σp², 1 − Σp², 1/Σp² and its unbiased form), Pielou's evenness,
     Fisher's α (Fisher, Corbet and Williams 1943), Margalef, Menhinick,
     Chao1 (bias-corrected; Chao 1987) and ACE (Chao and Lee 1992), sample
     coverage (Chao and Jost 2012).
   · Hill numbers (Hill 1973) as a profile in q, and the asymptotic estimators
     of q = 0, 1, 2 (Chao et al. 2013, 2014); individual-based rarefaction
     (Hurlbert 1971) and extrapolation of richness (Chao et al. 2014);
     sample-based accumulation with the exact expectation and its conditional
     variance (Kindt 2003; Colwell et al. 2004).
   · Dissimilarities between sites (Jaccard, Sørensen, Bray–Curtis), UPGMA with
     the cophenetic correlation, classical scaling and non-metric multidimensional
     scaling (Kruskal 1964; SMACOF iterations with monotone regression, several
     starts).
   · Vertical structure: Pretzsch's species profile index A in three height zones,
     and strata from the mean and SD of height.
   · Spatial pattern of stems in a rectangle: Clark and Evans (1954) with
     Donnelly's (1978) edge correction, Ripley's K and Besag's L with the
     translation edge correction (Ohser 1983) and envelopes of complete
     spatial randomness.
   Needs Num. No DOM. */
function DiversCore(g) {
'use strict';
const Num = g.Num;
const { log, exp, sqrt, abs, max, min, pow, PI, floor } = Math;
const D = {};

/* ---------------- indices of one site ---------------- */
D.freqCounts = x => { const f = new Map(); x.forEach(v => { if (v > 0) f.set(v, (f.get(v) || 0) + 1); }); return k => f.get(k) || 0; };
D.indices = function (x) {
  const a = x.filter(v => v > 0), N = a.reduce((s, v) => s + v, 0), S = a.length;
  const p = a.map(v => v / N);
  const H = -p.reduce((s, q) => s + q * log(q), 0);
  const simp = p.reduce((s, q) => s + q * q, 0);
  const simpU = a.reduce((s, v) => s + v * (v - 1), 0) / (N * (N - 1));
  const F = D.freqCounts(a), f1 = F(1), f2 = F(2);
  /* Fisher's α: S = α ln(1 + N/α) */
  let fisher = NaN;
  if (S > 0 && N > S) { const h = al => al * log(1 + N / al) - S; fisher = Num.brent(h, 1e-8, 1e7, 1e-12); }
  const chao1 = S + f1 * (f1 - 1) / (2 * (f2 + 1));
  /* ACE with rare species those of ≤ 10 individuals */
  let ace = NaN;
  { const rare = a.filter(v => v <= 10), Srare = rare.length, Nrare = rare.reduce((s, v) => s + v, 0), Sab = S - Srare;
    if (Nrare > 0 && f1 < Nrare) {
      const C = 1 - f1 / Nrare;
      let sm = 0; for (let i = 1; i <= 10; i++) sm += i * (i - 1) * F(i);
      const g2 = max(Srare / C * sm / (Nrare * (Nrare - 1)) - 1, 0);
      ace = Sab + Srare / C + f1 / C * g2;
    } else if (Nrare === 0) ace = S;
  }
  return { N, S, H, expH: exp(H), simpson: simp, giniSimpson: 1 - simp, invSimpson: 1 / simp, simpsonU: 1 - simpU, invSimpsonU: 1 / simpU,
    pielou: S > 1 ? H / log(S) : NaN, fisher, margalef: N > 1 ? (S - 1) / log(N) : NaN, menhinick: S / sqrt(N), chao1, ace, f1, f2, coverage: D.coverage(a) };
};
/* sample coverage of the observed sample (Chao and Jost 2012) */
D.coverage = function (x) {
  const a = x.filter(v => v > 0), n = a.reduce((s, v) => s + v, 0), F = D.freqCounts(a), f1 = F(1), f2 = F(2);
  if (f2 > 0) return 1 - f1 / n * ((n - 1) * f1 / ((n - 1) * f1 + 2 * f2));
  return 1 - f1 / n * ((n - 1) * (f1 - 1) / ((n - 1) * (f1 - 1) + 2));
};
/* Hill number of order q of the observed relative abundances */
D.hill = function (x, q) {
  const a = x.filter(v => v > 0), N = a.reduce((s, v) => s + v, 0), p = a.map(v => v / N);
  if (abs(q - 1) < 1e-9) return exp(-p.reduce((s, r) => s + r * log(r), 0));
  return pow(p.reduce((s, r) => s + pow(r, q), 0), 1 / (1 - q));
};
/* asymptotic estimators: richness (Chao1 as in Chao et al. 2014), Shannon diversity (Chao, Wang and Jost 2013)
   and Simpson diversity (n(n − 1)/Σ x(x − 1)) */
D.asymptotic = function (x) {
  const a = x.filter(v => v > 0), n = a.reduce((s, v) => s + v, 0), S = a.length, F = D.freqCounts(a), f1 = F(1), f2 = F(2);
  const q0 = f2 > 0 ? S + (n - 1) / n * f1 * f1 / (2 * f2) : S + (n - 1) / n * f1 * (f1 - 1) / 2;
  let A;
  if (f2 > 0) A = 2 * f2 / ((n - 1) * f1 + 2 * f2);
  else if (f1 > 0) A = 2 / ((n - 1) * (f1 - 1) + 2);
  else A = 1;
  let h = 0;
  /* Σ over species with 1 ≤ X ≤ n − 1 of X/n · Σ_{k=X}^{n−1} 1/k (harmonic tails by cumulative sums) */
  const tail = new Float64Array(n + 1);
  for (let k = n - 1; k >= 1; k--) tail[k] = tail[k + 1] + 1 / k;
  a.forEach(v => { if (v <= n - 1) h += v / n * tail[v]; });
  if (f1 > 0 && A !== 1) {
    let s = 0, pw = 1;
    for (let r = 1; r <= n - 1; r++) { pw *= (1 - A); s += pw / r; }
    h += f1 / n * pow(1 - A, 1 - n) * (-log(A) - s);
  }
  const q2 = n * (n - 1) / a.reduce((s, v) => s + v * (v - 1), 0);
  return { q0, q1: exp(h), q2, H: h, f0: q0 - S };
};
/* individual-based rarefaction (m ≤ n) and extrapolation (m > n) of richness */
D.rarefy = function (x, ms) {
  const a = x.filter(v => v > 0), n = a.reduce((s, v) => s + v, 0), S = a.length, F = D.freqCounts(a), f1 = F(1), f2 = F(2);
  const lc = (nn, k) => Num.lfactorial(nn) - Num.lfactorial(k) - Num.lfactorial(nn - k);
  const f0 = f2 > 0 ? (n - 1) / n * f1 * f1 / (2 * f2) : (n - 1) / n * f1 * (f1 - 1) / 2;
  return ms.map(m => {
    if (m <= n) {
      let s = 0;
      a.forEach(v => { s += n - v >= m ? 1 - exp(lc(n - v, m) - lc(n, m)) : 1; });
      return { m, S: s, type: m < n ? 'rare' : 'obs' };
    }
    const ms2 = m - n;
    return { m, S: f0 > 0 ? S + f0 * (1 - pow(1 - f1 / (n * f0 + f1), ms2)) : S, type: 'ext' };
  });
};
/* sample-based accumulation: occurrence matrix (sites × species, booleans) → mean and conditional SD */
D.accumulate = function (occ) {
  const n = occ.length, sp = occ[0].length;
  const freq = [], cols = [];
  for (let j = 0; j < sp; j++) { let f = 0; for (let i = 0; i < n; i++) if (occ[i][j]) f++; if (f > 0) { freq.push(f); cols.push(j); } }
  const lc = (nn, k) => Num.lfactorial(nn) - Num.lfactorial(k) - Num.lfactorial(nn - k);
  /* correlations of the occurrence vectors (zero when undefined) */
  const vec = cols.map(j => occ.map(r => r[j] ? 1 : 0));
  const cor = (u, v) => {
    const mu = Num.mean(u), mv = Num.mean(v);
    let su = 0, sv = 0, c = 0;
    for (let i = 0; i < u.length; i++) { su += (u[i] - mu) ** 2; sv += (v[i] - mv) ** 2; c += (u[i] - mu) * (v[i] - mv); }
    return su > 0 && sv > 0 ? c / sqrt(su * sv) : 0;
  };
  const f = freq.length, R = [];
  for (let j = 0; j < f; j++) { R.push([]); for (let k = 0; k < j; k++) R[j][k] = cor(vec[j], vec[k]); }
  const out = [];
  for (let t = 1; t <= n; t++) {
    const q = freq.map(fi => n - fi < t ? 0 : exp(lc(n - fi, t) - lc(n, t)));
    const mean = q.reduce((s, v) => s + 1 - v, 0);
    const V = q.map(v => v * (1 - v));
    let cv = 0;
    for (let j = 0; j < f; j++) for (let k = 0; k < j; k++) cv += R[j][k] * sqrt(V[j] * V[k]);
    out.push({ t, S: mean, sd: sqrt(max(0, V.reduce((s, v) => s + v, 0) + 2 * cv)) });
  }
  return out;
};

/* ---------------- dissimilarities ---------------- */
D.dissim = function (M, method) {
  const n = M.length, out = Num.zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) {
    const x = M[i], y = M[j];
    let d;
    if (method === 'bray') {
      let num = 0, den = 0;
      for (let k = 0; k < x.length; k++) { num += abs(x[k] - y[k]); den += x[k] + y[k]; }
      d = den > 0 ? num / den : 0;
    } else {
      let a = 0, b = 0, c = 0;
      for (let k = 0; k < x.length; k++) { const px = x[k] > 0, py = y[k] > 0; if (px && py) a++; else if (px) b++; else if (py) c++; }
      d = method === 'jaccard' ? (a + b + c > 0 ? (b + c) / (a + b + c) : 0) : (2 * a + b + c > 0 ? (b + c) / (2 * a + b + c) : 0);
    }
    out[i][j] = out[j][i] = d;
  }
  return out;
};
/* UPGMA: merges as in the reference (leaves 0…n−1, clusters n + k), heights, and the cophenetic matrix */
D.upgma = function (Dm) {
  const n = Dm.length;
  let active = Array.from({ length: n }, (_, i) => ({ id: i, size: 1, members: [i] }));
  const dist = new Map(), key = (a, b) => a < b ? a + ',' + b : b + ',' + a;
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) dist.set(key(i, j), Dm[i][j]);
  const merges = [], coph = Num.zeros(n, n);
  let next = n;
  while (active.length > 1) {
    let best = Infinity, bi = -1, bj = -1;
    for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
      const d = dist.get(key(active[i].id, active[j].id));
      if (d < best - 1e-15) { best = d; bi = i; bj = j; }
    }
    const A = active[bi], Bc = active[bj];
    A.members.forEach(a => Bc.members.forEach(b => { coph[a][b] = coph[b][a] = best; }));
    const C = { id: next++, size: A.size + Bc.size, members: A.members.concat(Bc.members) };
    active.forEach(o => { if (o === A || o === Bc) return; dist.set(key(C.id, o.id), (A.size * dist.get(key(A.id, o.id)) + Bc.size * dist.get(key(Bc.id, o.id))) / C.size); });
    merges.push({ a: A.id, b: Bc.id, h: best });
    active = active.filter(o => o !== A && o !== Bc); active.push(C);
  }
  const du = [], cu = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { du.push(Dm[i][j]); cu.push(coph[i][j]); }
  const r = (u, v) => { const mu = Num.mean(u), mv = Num.mean(v); let a = 0, b = 0, c = 0; for (let i = 0; i < u.length; i++) { a += (u[i] - mu) * (v[i] - mv); b += (u[i] - mu) ** 2; c += (v[i] - mv) ** 2; } return a / sqrt(b * c); };
  return { merges, coph, cophCor: r(du, cu), heights: merges.map(m => m.h) };
};
/* symmetric eigen-decomposition by cyclic Jacobi rotations (small matrices) */
D.eigen = function (A0) {
  const n = A0.length, A = A0.map(r => r.slice()), V = Num.zeros(n, n);
  for (let i = 0; i < n; i++) V[i][i] = 1;
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = (th >= 0 ? 1 : -1) / (abs(th) + sqrt(th * th + 1)), c = 1 / sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  const vals = A.map((r, i) => r[i]), idx = vals.map((v, i) => i).sort((a, b) => vals[b] - vals[a]);
  return { values: idx.map(i => vals[i]), vectors: idx.map(i => V.map(r => r[i])) };
};
/* classical scaling (principal coordinates) in k dimensions */
D.cmdscale = function (Dm, k) {
  const n = Dm.length, B = Num.zeros(n, n), rm = new Array(n).fill(0);
  let gm = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = -0.5 * Dm[i][j] * Dm[i][j]; B[i][j] = v; rm[i] += v / n; gm += v / (n * n); }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) B[i][j] = B[i][j] - rm[i] - rm[j] + gm;
  const e = D.eigen(B);
  const X = Array.from({ length: n }, () => new Array(k).fill(0));
  for (let c = 0; c < k; c++) { const l = max(e.values[c], 0), sl = sqrt(l); for (let i = 0; i < n; i++) X[i][c] = e.vectors[c][i] * sl; }
  return { X, values: e.values };
};
/* monotone (isotonic) regression by pool-adjacent-violators, on the order given */
function pava(y) {
  const v = [], w = [], idx = [];
  for (let i = 0; i < y.length; i++) {
    v.push(y[i]); w.push(1); idx.push(1);
    while (v.length > 1 && v[v.length - 2] > v[v.length - 1]) {
      const a = v.pop(), wa = w.pop(), na = idx.pop();
      const b = v.pop(), wb = w.pop(), nb = idx.pop();
      v.push((a * wa + b * wb) / (wa + wb)); w.push(wa + wb); idx.push(na + nb);
    }
  }
  const out = [];
  v.forEach((val, k) => { for (let t = 0; t < idx[k]; t++) out.push(val); });
  return out;
}
/* Kruskal's stress-1 of a configuration X against dissimilarities Dm, with the disparities that minimise it */
function stress1(X, pairs) {
  const d = pairs.map(p => Math.hypot(X[p.i][0] - X[p.j][0], X[p.i][1] - X[p.j][1]));
  const dh = pava(pairs.map((p, k) => d[k]));
  let num = 0, den = 0;
  for (let k = 0; k < d.length; k++) { num += (d[k] - dh[k]) ** 2; den += d[k] * d[k]; }
  return { stress: sqrt(num / den), d, dh };
}
D.nmds = function (Dm, o) {
  o = Object.assign({ starts: 20, seed: 1, maxIt: 500 }, o || {});
  const n = Dm.length;
  /* pairs sorted by dissimilarity (ties kept in the order of the data: the primary approach of Kruskal) */
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) pairs.push({ i, j, delta: Dm[i][j] });
  pairs.sort((a, b) => a.delta - b.delta);
  const sdel = pairs.reduce((s, p) => s + p.delta * p.delta, 0);
  const rng = Num.rng(o.seed);
  const run = X0 => {
    let X = X0.map(r => r.slice()), prev = Infinity, st = null;
    for (let it = 0; it < o.maxIt; it++) {
      st = stress1(X, pairs);
      if (prev - st.stress < 1e-9) break;
      prev = st.stress;
      /* disparities scaled to the size of the current distances, then one Guttman transform */
      const sd = st.d.reduce((s, v) => s + v * v, 0), sh = st.dh.reduce((s, v) => s + v * v, 0), k = sh > 0 ? sqrt(sd / sh) : 1;
      const Bm = Num.zeros(n, n);
      pairs.forEach((p, q) => { const dist = st.d[q]; const b = dist > 1e-12 ? -k * st.dh[q] / dist : 0; Bm[p.i][p.j] = b; Bm[p.j][p.i] = b; });
      for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) if (j !== i) s -= Bm[i][j]; Bm[i][i] = s; }
      X = Num.matmul(Bm, X).map(r => r.map(v => v / n));
      /* stress-1 does not depend on the scale; keeping the distances on the scale of the dissimilarities stops the
         configuration from shrinking iteration after iteration */
      let sdd = 0;
      pairs.forEach(p => { sdd += (X[p.i][0] - X[p.j][0]) ** 2 + (X[p.i][1] - X[p.j][1]) ** 2; });
      const f = sdd > 0 ? sqrt(sdel / sdd) : 1;
      X = X.map(r => [r[0] * f, r[1] * f]);
    }
    return { X, stress: stress1(X, pairs).stress };
  };
  let best = run(D.cmdscale(Dm, 2).X);
  for (let s = 0; s < o.starts; s++) {
    const r = run(Array.from({ length: n }, () => [rng() - 0.5, rng() - 0.5]));
    if (r.stress < best.stress - 1e-9) best = r;
  }
  /* centre and rotate to principal axes, as is customary */
  const m0 = Num.mean(best.X.map(r => r[0])), m1 = Num.mean(best.X.map(r => r[1]));
  let X = best.X.map(r => [r[0] - m0, r[1] - m1]);
  const C = [[0, 0], [0, 0]];
  X.forEach(r => { C[0][0] += r[0] * r[0]; C[0][1] += r[0] * r[1]; C[1][1] += r[1] * r[1]; });
  C[1][0] = C[0][1];
  const e = D.eigen(C);
  X = X.map(r => [r[0] * e.vectors[0][0] + r[1] * e.vectors[0][1], r[0] * e.vectors[1][0] + r[1] * e.vectors[1][1]]);
  const st = stress1(X, pairs);
  return { X, stress: st.stress, shepard: pairs.map((p, k) => ({ delta: p.delta, d: st.d[k], dh: st.dh[k] })) };
};

/* ---------------- vertical structure ---------------- */
/* Pretzsch's A: zones I (> 80 % of the maximum height), II (50–80 %) and III (≤ 50 %) */
D.pretzsch = function (trees) {
  const hmax = max(...trees.map(t => t.h)), N = trees.length;
  const zone = h => h > 0.8 * hmax ? 0 : h > 0.5 * hmax ? 1 : 2;
  const cnt = new Map();
  trees.forEach(t => { const k = t.sp + '|' + zone(t.h); cnt.set(k, (cnt.get(k) || 0) + 1); });
  let A = 0;
  cnt.forEach(v => { const p = v / N; A -= p * log(p); });
  const S = new Set(trees.map(t => t.sp)).size, Z = 3;
  const byZone = [0, 1, 2].map(z => trees.filter(t => zone(t.h) === z).length);
  return { A, Amax: log(S * Z), Arel: 100 * A / log(S * Z), hmax, S, N, byZone, zone };
};
/* strata from the mean and SD of height: lower < mean − SD ≤ middle < mean + SD ≤ upper */
D.heightStrata = function (h) {
  const m = Num.mean(h), s = Num.sd(h);
  const lo = m - s, hi = m + s;
  return { mean: m, sd: s, lo, hi, cls: v => v < lo ? 0 : v < hi ? 1 : 2 };
};

/* ---------------- spatial pattern ----------------
   pts: [{x, y}] in the rectangle [x0, x0 + W] × [y0, y0 + H] */
D.nnDist = function (pts) {
  return pts.map((p, i) => { let m = Infinity; pts.forEach((q, j) => { if (i !== j) { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < m) m = d; } }); return m; });
};
D.clarkEvans = function (pts, W, H) {
  const n = pts.length, A = W * H, lam = n / A;
  const dobs = Num.mean(D.nnDist(pts)), dpois = 1 / (2 * sqrt(lam));
  const se = sqrt((4 - PI) * A / (4 * PI)) / n;
  const P = 2 * (W + H), ddon = dpois + (0.0514 + 0.0412 / sqrt(n)) * P / n;
  const R = dobs / dpois, Rd = dobs / ddon;
  const z = (R - 1) / (se / dpois), zd = (Rd - 1) / (se / ddon);
  return { n, lambda: lam, dobs, dpois, ddon, R, Rd, z, zd, p: 2 * Num.pnorm(-abs(z)), pd: 2 * Num.pnorm(-abs(zd)) };
};
/* Ripley's K with the translation correction: K(r) = A/(n(n − 1)) Σ_{i≠j} 1(dᵢⱼ ≤ r) A/((W − |dx|)(H − |dy|)) */
D.ripleyK = function (pts, W, H, rs) {
  const n = pts.length, A = W * H;
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue;
    const dx = abs(pts[i].x - pts[j].x), dy = abs(pts[i].y - pts[j].y);
    pairs.push([Math.hypot(dx, dy), A / ((W - dx) * (H - dy))]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  const lam2 = n * (n - 1) / (A * A);
  const out = [];
  let k = 0, acc = 0;
  rs.forEach(r => { while (k < pairs.length && pairs[k][0] <= r) { acc += pairs[k][1]; k++; } out.push({ r, K: acc / (lam2 * A), L: sqrt(acc / (lam2 * A) / PI) }); });
  return out;
};
/* pointwise envelopes of L(r) − r under complete spatial randomness with the same number of points */
D.csrEnvelope = function (n, W, H, rs, nsim, seed) {
  const rng = Num.rng(seed || 1);
  const sims = [];
  for (let s = 0; s < nsim; s++) {
    const pts = Array.from({ length: n }, () => ({ x: rng() * W, y: rng() * H }));
    sims.push(D.ripleyK(pts, W, H, rs).map(v => v.L - v.r));
  }
  const lo = rs.map((_, i) => min(...sims.map(s => s[i]))), hi = rs.map((_, i) => max(...sims.map(s => s[i])));
  return { lo, hi, nsim };
};

g.Divers = D;
return D;
}
if (typeof window !== 'undefined') DiversCore(window);
else if (typeof globalThis !== 'undefined') DiversCore(globalThis);
