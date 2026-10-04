/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the numerical core: compensated sums and moments, special
   functions, the normal, t, χ² and F distributions, seeded random numbers,
   small dense linear algebra, ordinary and weighted least squares, and the
   one- and many-dimensional optimizers the engines use.
   The special functions and the distributions are those of CorrelationPro, by
   the same author. Nothing here touches the DOM, so the same file runs in the
   browser and in the test benches. */
function NumCore(g) {
'use strict';
const { abs, sqrt, exp, log, log1p, expm1, floor, PI, min, max } = Math;
const Num = {};
const LN_SQRT_2PI = 0.9189385332046727418;
const SQRT2 = 1.4142135623730950488;

/* ---------------- sums and moments ----------------
   Neumaier's compensated sum, and two-pass mean and variance: the naive
   one-pass formula loses every digit when the mean is large compared with the
   spread (heights in mm, dates as numbers…). */
Num.sum = function (a) {
  let s = 0, c = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i], t = s + v;
    c += abs(s) >= abs(v) ? (s - t) + v : (v - t) + s;
    s = t;
  }
  return s + c;
};
Num.mean = a => Num.sum(a) / a.length;
Num.variance = function (a, m) {
  const n = a.length;
  if (n < 2) return NaN;
  if (m == null) m = Num.mean(a);
  let s = 0, c = 0;
  for (let i = 0; i < n; i++) { const d = a[i] - m; s += d * d; c += d; }
  return (s - c * c / n) / (n - 1);
};
Num.sd = a => sqrt(Num.variance(a));
Num.median = function (a) {
  const s = Float64Array.from(a).sort(), n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
/* sample quantile, continuous definition 7 (the default of most statistics books) */
Num.quantile = function (a, p) {
  const s = Float64Array.from(a).sort(), n = s.length;
  if (!n) return NaN;
  const h = (n - 1) * p, lo = floor(h), hi = Math.ceil(h);
  return s[lo] + (h - lo) * (s[hi] - s[lo]);
};
/* median absolute deviation, unscaled (constant 1) */
Num.mad = function (a, med) {
  if (med == null) med = Num.median(a);
  return Num.median(Array.from(a, v => abs(v - med)));
};
/* ---------------- special functions ---------------- */
/* log Γ(x) for x > 0: Lanczos (g = 7, 9 terms), with the reflection formula below 0.5 */
const LZ = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
Num.lgamma = function (x) {
  if (x < 0.5) return log(PI / abs(Math.sin(PI * x))) - Num.lgamma(1 - x);
  x -= 1;
  let a = LZ[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LZ[i] / (x + i);
  return LN_SQRT_2PI + (x + 0.5) * log(t) - t + log(a);
};
/* The remainder of Stirling's series, lgamma(x) − [(x − ½)log x − x + log √(2π)],
   for x ≥ 10: the odd powers of 1/x with the Bernoulli coefficients B₂ₖ/(2k(2k−1)),
   seven terms (the next one is below 1e-17 at x = 10). */
const STIR = [1 / 12, -1 / 360, 1 / 1260, -1 / 1680, 1 / 1188, -691 / 360360, 1 / 156, -3617 / 122400];
function stirRest(x) {
  const z = 1 / (x * x);
  let s = STIR[STIR.length - 1];
  for (let k = STIR.length - 2; k >= 0; k--) s = s * z + STIR[k];
  return s / x;
}
/* log B(a, b). Summing three log-gammas of size ~a log a to get a number of
   size ~1 throws away the digits of the result when a or b is large (t with a
   thousand degrees of freedom: twelve digits); the Stirling form keeps them:
     both ≥ 10:  ½log 2π − ½log(p+q) + corr + (p − ½)log(p/(p+q)) + (q − ½)log1p(−p/(p+q))
     p < 10 ≤ q: lgamma(p) + corr + p − p·log(p+q) + (q − ½)log1p(−p/(p+q))
   with p ≤ q and corr the difference of the Stirling remainders. */
Num.lbeta = function (a, b) {
  const p = min(a, b), q = max(a, b);
  if (q < 10) return Num.lgamma(p) + Num.lgamma(q) - Num.lgamma(p + q);
  const r = p / (p + q);
  if (p >= 10) {
    const corr = stirRest(p) + stirRest(q) - stirRest(p + q);
    return LN_SQRT_2PI - 0.5 * log(p + q) + corr + (p - 0.5) * log(r) + (q - 0.5) * log1p(-r);
  }
  const corr = stirRest(q) - stirRest(p + q);
  return Num.lgamma(p) + corr + p - p * log(p + q) + (q - 0.5) * log1p(-r);
};
/* log n! exactly summed for small n, Lanczos beyond */
const LFACT = [0];
for (let i = 1; i <= 170; i++) LFACT[i] = LFACT[i - 1] + log(i);
Num.lfactorial = n => n <= 170 ? LFACT[n] : Num.lgamma(n + 1);

/* Regularized incomplete beta I_x(a, b): continued fraction (modified
   Lentz), evaluated on the side where it converges fast. */
function betacf(x, a, b) {
  const TINY = 1e-300, EPS = 1e-16;
  let c = 1, d = 1 - (a + b) * x / (a + 1);
  if (abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 10000; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (abs(c) < TINY) c = TINY;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (abs(del - 1) < EPS) break;
  }
  return h;
}
/* returns [I_x(a,b), 1 − I_x(a,b)], each computed directly (no cancellation).
   y = 1 − x may be passed when the caller knows it exactly: near x = 1,
   forming 1 − x in floating point throws away the digits that a·log x and
   the continued fraction on the other side need (t with many degrees of
   freedom, F with a large denominator). */
Num.betaInc2 = function (x, a, b, y) {
  if (y == null) y = 1 - x;
  if (x <= 0) return [0, 1];
  if (y <= 0) return [1, 0];
  const lx = x < 0.5 ? log(x) : log1p(-y), ly = y < 0.5 ? log(y) : log1p(-x);
  const lfront = a * lx + b * ly - Num.lbeta(a, b);
  if (x < (a + 1) / (a + b + 2)) {
    const v = exp(lfront) * betacf(x, a, b) / a;
    return [v, 1 - v];
  }
  const v = exp(lfront) * betacf(y, b, a) / b;
  return [1 - v, v];
};
Num.betaInc = (x, a, b) => Num.betaInc2(x, a, b)[0];

/* Regularized lower incomplete gamma P(a, x) and its complement Q(a, x). */
Num.gammaInc2 = function (a, x) {
  if (x <= 0) return [0, 1];
  const lf = a * log(x) - x - Num.lgamma(a);
  if (x < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 1; n < 100000; n++) { ap += 1; del *= x / ap; sum += del; if (abs(del) < abs(sum) * 1e-16) break; }
    const p = exp(lf) * sum;
    return [p, 1 - p];
  }
  const TINY = 1e-300;
  let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (abs(d) < TINY) d = TINY;
    c = b + an / c; if (abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (abs(del - 1) < 1e-16) break;
  }
  const q = exp(lf) * h;
  return [1 - q, q];
};

/* ---------------- the normal distribution ----------------
   Φ through erfc: a Chebyshev-fitted rational approximation of erfc on three
   ranges (W. J. Cody 1969, Math. Comp. 23:631–637), accurate to ~1e-16
   relative also deep in the tails, which the tests of tiny p-values need. */
const CA = [3.16112374387056560e00, 1.13864154151050156e02, 3.77485237685302021e02, 3.20937758913846947e03, 1.85777706184603153e-1];
const CB = [2.36012909523441209e01, 2.44024637934444173e02, 1.28261652607737228e03, 2.84423683343917062e03];
const CC = [5.64188496988670089e-1, 8.88314979438837594e00, 6.61191906371416295e01, 2.98635138197400131e02,
  8.81952221241769090e02, 1.71204761263407058e03, 2.05107837782607147e03, 1.23033935479799725e03, 2.15311535474403846e-8];
const CD = [1.57449261107098347e01, 1.17693950891312499e02, 5.37181101862009858e02, 1.62138957456669019e03,
  3.29079923573345963e03, 4.36261909014324716e03, 3.43936767414372164e03, 1.23033935480374942e03];
const CP = [3.05326634961232344e-1, 3.60344899949804439e-1, 1.25781726111229246e-1, 1.60837851487422766e-2,
  6.58749161529837803e-4, 1.63153871373020978e-2];
const CQ = [2.56852019228982242e00, 1.87295284992346725e00, 5.27905102951428412e-1, 6.05183413124413191e-2, 2.33520497626869185e-3];
const SQRPI = 5.6418958354775628695e-1;
/* erfc(x) for x ≥ 0 */
function erfcPos(x) {
  if (x < 0.46875) {
    const y = x * x;
    let xn = CA[4] * y, xd = y;
    for (let i = 0; i < 3; i++) { xn = (xn + CA[i]) * y; xd = (xd + CB[i]) * y; }
    return 1 - x * (xn + CA[3]) / (xd + CB[3]);
  }
  let r;
  if (x <= 4) {
    let xn = CC[8] * x, xd = x;
    for (let i = 0; i < 7; i++) { xn = (xn + CC[i]) * x; xd = (xd + CD[i]) * x; }
    r = (xn + CC[7]) / (xd + CD[7]);
  } else {
    if (x > 27) return 0;
    const z = 1 / (x * x);
    let xn = CP[5] * z, xd = z;
    for (let i = 0; i < 4; i++) { xn = (xn + CP[i]) * z; xd = (xd + CQ[i]) * z; }
    r = z * (xn + CP[4]) / (xd + CQ[4]);
    r = (SQRPI - r) / x;
  }
  /* exp(−x²) split to keep the digits of x² */
  const xs = floor(x * 16) / 16, del = (x - xs) * (x + xs);
  return exp(-xs * xs) * exp(-del) * r;
}
Num.erfc = x => x >= 0 ? erfcPos(x) : 2 - erfcPos(-x);
/* Φ(z) and its upper tail 1 − Φ(z), each without cancellation */
Num.pnorm = function (z, upper) {
  if (z !== z) return NaN;
  const lower = z < 0 ? 0.5 * erfcPos(-z / SQRT2) : 1 - 0.5 * erfcPos(z / SQRT2);
  const up = z > 0 ? 0.5 * erfcPos(z / SQRT2) : 1 - 0.5 * erfcPos(-z / SQRT2);
  return upper ? up : lower;
};
Num.dnorm = z => exp(-0.5 * z * z - LN_SQRT_2PI);
/* Φ⁻¹(p): algorithm AS 241 (Wichura 1988, Appl. Statist. 37:477–484), PPND16,
   about 1e-16 relative. */
Num.qnorm = function (p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const q = p - 0.5;
  if (abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    return q * (((((((r * 2509.0809287301226727 + 33430.575583588128105) * r + 67265.770927008700853) * r +
      45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r + 133.14166789178437745) * r +
      3.387132872796366608) / (((((((r * 5226.495278852545925 + 28729.085735721942674) * r + 39307.89580009271061) * r +
      21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r + 42.313330701600911252) * r + 1);
  }
  let r = q < 0 ? p : 1 - p;
  r = sqrt(-log(r));
  let v;
  if (r <= 5) {
    r -= 1.6;
    v = (((((((r * 7.7454501427834140764e-4 + 0.0227238449892691845833) * r + 0.24178072517745061177) * r +
      1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r + 4.6303378461565452959) * r +
      1.42343711074968357734) / (((((((r * 1.05075007164441684324e-9 + 5.475938084995344946e-4) * r +
      0.0151986665636164571966) * r + 0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r +
      2.05319162663775882187) * r + 1);
  } else {
    r -= 5;
    v = (((((((r * 2.01033439929228813265e-7 + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r +
      0.026532189526576123093) * r + 0.29656057182850489123) * r + 1.7848265399172913358) * r + 5.4637849111641143699) * r +
      6.6579046435011037772) / (((((((r * 2.04426310338993978564e-15 + 1.4215117583164458887e-7) * r +
      1.8463183175100546818e-5) * r + 7.868691311456132591e-4) * r + 0.0148753612908506148525) * r +
      0.13692988092273580531) * r + 0.59983220655588793769) * r + 1);
  }
  return q < 0 ? -v : v;
};

/* ---------------- t, F, χ² ---------------- */
/* P(T ≤ t) or P(T > t) with ν degrees of freedom (ν may be fractional) */
Num.pt = function (t, df, upper) {
  if (t !== t || !(df > 0)) return NaN;
  if (!isFinite(t)) return (t > 0) === !upper ? 1 : 0;
  if (df === Infinity) return Num.pnorm(t, upper);
  const t2 = t * t, x = df / (df + t2), y = t2 / (df + t2);
  /* tail = P(|T| > |t|)/2, computed as ½·I_x(ν/2, ½) */
  const [ix] = Num.betaInc2(x, df / 2, 0.5, y);
  const tail = 0.5 * ix;
  const big = t > 0;
  if (upper) return big ? tail : 1 - tail;
  return big ? 1 - tail : tail;
};
/* two-sided p-value of a t statistic */
Num.pt2 = (t, df) => min(1, 2 * Num.pt(abs(t), df, true));
Num.qt = function (p, df) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (df === Infinity) return Num.qnorm(p);
  if (p === 0.5) return 0;
  const lower = p < 0.5, pp = lower ? p : 1 - p;
  /* Newton on the upper tail from the normal start, safeguarded by bisection */
  let lo = 0, hi = 1, x = -Num.qnorm(pp);
  while (Num.pt(hi, df, true) > pp) { lo = hi; hi *= 2; if (hi > 1e12) break; }
  if (!(x > lo && x < hi)) x = (lo + hi) / 2;
  for (let it = 0; it < 200; it++) {
    const f = Num.pt(x, df, true) - pp;
    if (f > 0) lo = x; else hi = x;
    const dens = exp(Num.lgamma((df + 1) / 2) - Num.lgamma(df / 2) - 0.5 * log(df * PI) - (df + 1) / 2 * log1p(x * x / df));
    let nx = x + f / dens;
    if (!(nx > lo && nx < hi)) nx = (lo + hi) / 2;
    if (abs(nx - x) <= 1e-15 * max(1, abs(x))) { x = nx; break; }
    x = nx;
  }
  return lower ? -x : x;
};
Num.pchisq = (x, df, upper) => x <= 0 ? (upper ? 1 : 0) : Num.gammaInc2(df / 2, x / 2)[upper ? 1 : 0];
Num.pf = function (f, d1, d2, upper) {
  if (f <= 0) return upper ? 1 : 0;
  const den = d1 * f + d2;
  const [a, b] = Num.betaInc2(d1 * f / den, d1 / 2, d2 / 2, d2 / den);
  return upper ? b : a;
};

/* ---------------- random numbers ----------------
   sfc32 (a small fast counter generator that passes the usual statistical
   batteries), seeded; a normal by Box–Muller with its spare value kept. */
Num.rng = function (seed) {
  let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = (seed >>> 0) ^ 0xdeadbeef;
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next();
  let spare = null;
  next.normal = function () {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u = 0;
    while (u === 0) u = next();
    const v = next(), r = sqrt(-2 * log(u));
    spare = r * Math.sin(2 * PI * v);
    return r * Math.cos(2 * PI * v);
  };
  next.int = k => floor(next() * k);
  next.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = floor(next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  return next;
};

/* a draw from a multivariate normal with mean m and covariance S (Cholesky) */
Num.mvnorm = function (m, S, rng) {
  const L = Num.chol(S), k = m.length, z = new Array(k);
  for (let i = 0; i < k; i++) z[i] = rng.normal();
  const out = m.slice();
  for (let i = 0; i < k; i++) for (let j = 0; j <= i; j++) out[i] += L[i][j] * z[j];
  return out;
};

/* χ² quantile: Wilson–Hilferty start, then Newton safeguarded by bisection */
Num.qchisq = function (p, df) {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  const z = Num.qnorm(p), h = 2 / (9 * df);
  let x = max(1e-12, df * Math.pow(1 - h + z * sqrt(h), 3));
  let lo = 0, hi = max(1, x * 4);
  while (Num.pchisq(hi, df) < p) hi *= 2;
  for (let it = 0; it < 200; it++) {
    const f = Num.pchisq(x, df) - p;
    if (f > 0) hi = x; else lo = x;
    const dens = exp((df / 2 - 1) * log(x) - x / 2 - (df / 2) * log(2) - Num.lgamma(df / 2));
    let nx = x - f / dens;
    if (!(nx > lo && nx < hi) || !isFinite(nx)) nx = (lo + hi) / 2;
    if (abs(nx - x) <= 1e-14 * max(1, x)) { x = nx; break; }
    x = nx;
  }
  return x;
};
Num.dt = (t, df) => exp(Num.lgamma((df + 1) / 2) - Num.lgamma(df / 2) - 0.5 * log(df * PI) - (df + 1) / 2 * log1p(t * t / df));

/* ---------------- small dense linear algebra ----------------
   Matrices are arrays of rows. Sizes here are those of regression models
   (a handful of parameters) and of kriging systems (up to a few hundred
   points), so plain Gaussian elimination with partial pivoting is enough. */
Num.zeros = (r, c) => Array.from({ length: r }, () => new Array(c).fill(0));
Num.transpose = A => A[0].map((_, j) => A.map(r => r[j]));
Num.matmul = function (A, B) {
  const r = A.length, k = B.length, c = B[0].length, C = Num.zeros(r, c);
  for (let i = 0; i < r; i++) for (let t = 0; t < k; t++) { const a = A[i][t]; if (a) for (let j = 0; j < c; j++) C[i][j] += a * B[t][j]; }
  return C;
};
Num.matvec = (A, x) => A.map(r => { let s = 0; for (let j = 0; j < x.length; j++) s += r[j] * x[j]; return s; });
/* solves A x = b (b a vector or a matrix of right-hand sides); null when A is singular */
Num.solve = function (A, b) {
  const n = A.length, multi = Array.isArray(b[0]);
  const M = A.map((r, i) => r.concat(multi ? b[i] : [b[i]]));
  const w = M[0].length;
  for (let c = 0; c < n; c++) {
    let p = c, best = abs(M[c][c]);
    for (let r = c + 1; r < n; r++) if (abs(M[r][c]) > best) { best = abs(M[r][c]); p = r; }
    if (!(best > 1e-300)) return null;
    if (p !== c) { const t = M[p]; M[p] = M[c]; M[c] = t; }
    const piv = M[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / piv;
      if (f) for (let j = c; j < w; j++) M[r][j] -= f * M[c][j];
    }
  }
  const X = Num.zeros(n, w - n);
  for (let k = 0; k < w - n; k++) for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n + k];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * X[j][k];
    X[i][k] = s / M[i][i];
  }
  return multi ? X : X.map(r => r[0]);
};
Num.inv = function (A) {
  const n = A.length, I = Num.zeros(n, n);
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return Num.solve(A, I);
};
/* lower Cholesky factor; rounding that makes S barely indefinite is clipped to zero */
Num.chol = function (S) {
  const n = S.length, L = Num.zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = S[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) L[i][i] = sqrt(max(s, 0));
    else L[i][j] = L[j][j] > 0 ? s / L[j][j] : 0;
  }
  return L;
};

/* ---------------- least squares ----------------
   Householder QR of the (weighted) design matrix: the normal equations would
   square the condition number, and polynomial taper or volume models are badly
   conditioned (D, D², D³…). Returns everything a table of fit needs. */
Num.ols = function (X, y, opt) {
  opt = opt || {};
  const n = X.length, p = X[0].length, w = opt.w || null;
  const R = X.map((r, i) => r.map(v => w ? v * sqrt(w[i]) : v));
  const qb = y.map((v, i) => w ? v * sqrt(w[i]) : v);
  for (let k = 0; k < p; k++) {
    let nrm = 0;
    for (let i = k; i < n; i++) nrm += R[i][k] * R[i][k];
    nrm = sqrt(nrm);
    if (nrm === 0) continue;
    const alpha = R[k][k] > 0 ? -nrm : nrm;
    const v = new Array(n).fill(0);
    v[k] = R[k][k] - alpha;
    for (let i = k + 1; i < n; i++) v[i] = R[i][k];
    let vv = 0;
    for (let i = k; i < n; i++) vv += v[i] * v[i];
    if (vv === 0) continue;
    for (let j = k; j < p; j++) {
      let s = 0;
      for (let i = k; i < n; i++) s += v[i] * R[i][j];
      s = 2 * s / vv;
      for (let i = k; i < n; i++) R[i][j] -= s * v[i];
    }
    let s = 0;
    for (let i = k; i < n; i++) s += v[i] * qb[i];
    s = 2 * s / vv;
    for (let i = k; i < n; i++) qb[i] -= s * v[i];
  }
  for (let k = 0; k < p; k++) if (!(abs(R[k][k]) > 1e-12 * (abs(R[0][0]) || 1))) return { ok: false, reason: 'singular' };
  const coef = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    let s = qb[i];
    for (let j = i + 1; j < p; j++) s -= R[i][j] * coef[j];
    coef[i] = s / R[i][i];
  }
  /* (XᵀX)⁻¹ = R⁻¹ R⁻ᵀ */
  const Ri = Num.zeros(p, p);
  for (let j = 0; j < p; j++) {
    Ri[j][j] = 1 / R[j][j];
    for (let i = j - 1; i >= 0; i--) {
      let s = 0;
      for (let k = i + 1; k <= j; k++) s += R[i][k] * Ri[k][j];
      Ri[i][j] = -s / R[i][i];
    }
  }
  const XtXi = Num.zeros(p, p);
  for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) { let s = 0; for (let k = max(i, j); k < p; k++) s += Ri[i][k] * Ri[j][k]; XtXi[i][j] = s; }
  const fitted = X.map(r => { let s = 0; for (let j = 0; j < p; j++) s += r[j] * coef[j]; return s; });
  const resid = y.map((v, i) => v - fitted[i]);
  let rss = 0, sw = 0, ybar = 0;
  for (let i = 0; i < n; i++) { const wi = w ? w[i] : 1; rss += wi * resid[i] * resid[i]; sw += wi; ybar += wi * y[i]; }
  ybar /= sw;
  const intercept = opt.intercept != null ? opt.intercept : X.every(r => r[0] === 1);
  let tss = 0;
  for (let i = 0; i < n; i++) { const wi = w ? w[i] : 1; const d = intercept ? y[i] - ybar : y[i]; tss += wi * d * d; }
  const df = n - p, s2 = df > 0 ? rss / df : NaN, sigma = sqrt(s2);
  const cov = XtXi.map(r => r.map(v => v * s2));
  const se = cov.map((r, i) => sqrt(r[i]));
  const t = coef.map((c, i) => c / se[i]), pv = t.map(v => Num.pt2(v, df));
  const r2 = 1 - rss / tss, k = intercept ? p - 1 : p;
  const adjr2 = 1 - (1 - r2) * (n - (intercept ? 1 : 0)) / df;
  const F = k > 0 ? ((tss - rss) / k) / s2 : NaN, pF = k > 0 ? Num.pf(F, k, df, true) : NaN;
  /* log-likelihood and AIC as R's lm computes them (σ² by maximum likelihood, p + 1 parameters) */
  let lw = 0;
  if (w) for (let i = 0; i < n; i++) lw += log(w[i]);
  const logLik = 0.5 * (lw - n * (log(2 * PI) + 1 - log(n) + log(rss)));
  return { ok: true, coef, se, t, p: pv, cov, XtXi, fitted, resid, rss, tss, df, sigma, r2, adjr2, F, pF, n, k: p,
    logLik, aic: -2 * logLik + 2 * (p + 1), bic: -2 * logLik + log(n) * (p + 1) };
};

/* ---------------- one-dimensional root and minimum ---------------- */
/* Brent's root finder on a bracketing interval [a, b] (f(a)·f(b) ≤ 0) */
Num.brent = function (f, a, b, tol) {
  tol = tol || 1e-12;
  let fa = f(a), fb = f(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) return NaN;
  let c = a, fc = fa, d = b - a, e = d;
  for (let it = 0; it < 300; it++) {
    if (fb * fc > 0) { c = a; fc = fa; d = e = b - a; }
    if (abs(fc) < abs(fb)) { a = b; b = c; c = a; fa = fb; fb = fc; fc = fa; }
    const t1 = 2 * Number.EPSILON * abs(b) + 0.5 * tol, xm = 0.5 * (c - b);
    if (abs(xm) <= t1 || fb === 0) return b;
    if (abs(e) >= t1 && abs(fa) > abs(fb)) {
      const s = fb / fa;
      let p, q;
      if (a === c) { p = 2 * xm * s; q = 1 - s; }
      else { q = fa / fc; const r = fb / fc; p = s * (2 * xm * q * (q - r) - (b - a) * (r - 1)); q = (q - 1) * (r - 1) * (s - 1); }
      if (p > 0) q = -q; else p = -p;
      if (2 * p < min(3 * xm * q - abs(t1 * q), abs(e * q))) { e = d; d = p / q; } else { d = xm; e = d; }
    } else { d = xm; e = d; }
    a = b; fa = fb;
    b += abs(d) > t1 ? d : (xm > 0 ? t1 : -t1);
    fb = f(b);
  }
  return b;
};
/* golden-section search for the minimum of a unimodal f on [a, b] */
Num.golden = function (f, a, b, tol) {
  tol = tol || 1e-10;
  const r = (sqrt(5) - 1) / 2;
  let c = b - r * (b - a), d = a + r * (b - a), fc = f(c), fd = f(d);
  for (let it = 0; it < 500 && abs(b - a) > tol * (abs(c) + abs(d) + 1e-12); it++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - r * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + r * (b - a); fd = f(d); }
  }
  return fc < fd ? { x: c, f: fc } : { x: d, f: fd };
};
/* Nelder–Mead simplex, with the adaptive coefficients of Gao and Han (2012) */
Num.nelderMead = function (f, x0, opt) {
  opt = opt || {};
  const k = x0.length, maxIt = opt.maxIt || 2000 * k, tol = opt.tol || 1e-12, K = max(2, k);
  const a = 1, gm = 1 + 2 / K, rho = 0.75 - 1 / (2 * K), sg = 1 - 1 / K;
  let S = [x0.slice()];
  for (let i = 0; i < k; i++) { const x = x0.slice(); x[i] = x[i] !== 0 ? x[i] * (1 + (opt.step || 0.1)) : (opt.step || 0.1); S.push(x); }
  let F = S.map(x => f(x));
  for (let it = 0; it < maxIt; it++) {
    const o = F.map((v, i) => i).sort((i, j) => F[i] - F[j]);
    S = o.map(i => S[i]); F = o.map(i => F[i]);
    if (abs(F[k] - F[0]) <= tol * (abs(F[0]) + 1e-20)) break;
    const c = new Array(k).fill(0);
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) c[j] += S[i][j] / k;
    const xr = c.map((v, j) => v + a * (v - S[k][j])), fr = f(xr);
    if (fr < F[0]) {
      const xe = c.map((v, j) => v + gm * (xr[j] - v)), fe = f(xe);
      if (fe < fr) { S[k] = xe; F[k] = fe; } else { S[k] = xr; F[k] = fr; }
    } else if (fr < F[k - 1]) { S[k] = xr; F[k] = fr; }
    else {
      const out = fr < F[k];
      const xc = out ? c.map((v, j) => v + rho * (xr[j] - v)) : c.map((v, j) => v + rho * (S[k][j] - v));
      const fc = f(xc);
      if (fc < (out ? fr : F[k])) { S[k] = xc; F[k] = fc; }
      else for (let i = 1; i <= k; i++) { S[i] = S[i].map((v, j) => S[0][j] + sg * (v - S[0][j])); F[i] = f(S[i]); }
    }
  }
  let b = 0;
  for (let i = 1; i <= k; i++) if (F[i] < F[b]) b = i;
  return { x: S[b], f: F[b] };
};

/* ---------------- small helpers ---------------- */
Num.clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
Num.expm1 = expm1;
Num.log1p = log1p;
Num.cumsum = a => { let s = 0; return a.map(v => (s += v)); };
Num.range = a => { let lo = Infinity, hi = -Infinity; for (const v of a) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; };
Num.finite = a => a.filter(v => typeof v === 'number' && isFinite(v));
/* t-based confidence interval of a mean */
Num.ciMean = function (a, level) {
  const x = Num.finite(a), n = x.length, m = Num.mean(x), s = Num.sd(x), se = s / sqrt(n);
  const t = Num.qt(1 - (1 - (level || 0.95)) / 2, n - 1);
  return { n, mean: m, sd: s, se, t, lo: m - t * se, hi: m + t * se };
};

g.Num = Num;
return Num;
}
if (typeof window !== 'undefined') NumCore(window);
else if (typeof globalThis !== 'undefined') NumCore(globalThis);
