/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 7: agroforestry systems.

   · Shade from an inventory of shade trees: density, basal area, crown cover
     as the sum of crown areas and corrected for random overlap,
     C = 1 − exp(−Σaᵢ/A) (Crookston and Stage 1999), and Holdridge's
     complexity index (species × trees × basal area × height / 1000, on 0.1 ha).
   · Shade from a photograph: grey levels from the blue channel or the
     luminance, the threshold of Otsu (1979) or a manual one, a fisheye circle
     and the canopy openness, plain (gap fraction) and weighted by the solid
     angle each pixel stands for in an equiangular projection (θ = 90°·ρ/R).
   · Shade and yield: linear and quadratic regressions, the shade of maximum
     yield −b₁/(2b₂) and its standard error by the delta method.
   · Planting layouts: square, triangular, rectangular, alleys, live fences and
     boundary rows, with every position inside the plot.
   · Carbon budget of the system against a monoculture.
   Needs Num. No DOM. */
function AgroCore(g) {
'use strict';
const Num = g.Num;
const { PI, sqrt, exp, log, sin, cos, abs, max, min, floor } = Math;
const A = {};

/* ---------------- shade from an inventory ----------------
   trees of one plot: [{sp, d (cm), h (m), crown (m)}]; areaM2: plot area */
A.shadeOfPlot = function (trees, areaM2) {
  const ef = 10000 / areaM2;
  const N = trees.length * ef, G = trees.reduce((s, t) => s + PI * t.d * t.d / 40000, 0) * ef;
  const crowns = trees.filter(t => t.crown > 0);
  const sumA = crowns.reduce((s, t) => s + PI * t.crown * t.crown / 4, 0);
  const raw = 100 * sumA / areaM2, cover = 100 * (1 - exp(-sumA / areaM2));
  const S = new Set(trees.map(t => t.sp)).size;
  const hs = trees.filter(t => t.h > 0).map(t => t.h);
  const hMean = hs.length ? Num.mean(hs) : NaN;
  /* Holdridge: with d trees and a m² of basal area per 0.1 ha */
  const ic = S * (N / 10) * (G / 10) * hMean / 1000;
  return { n: trees.length, N, G, S, raw, cover, hMean, ic, crownsMissing: trees.length - crowns.length };
};

/* ---------------- shade from a photograph ----------------
   img: {width, height, data (RGBA bytes)} */
A.grey = function (img, channel) {
  const n = img.width * img.height, out = new Uint8Array(n), d = img.data;
  for (let i = 0; i < n; i++) {
    const r = d[4 * i], gg = d[4 * i + 1], b = d[4 * i + 2];
    out[i] = channel === 'luma' ? Math.round(0.299 * r + 0.587 * gg + 0.114 * b) : b;
  }
  return out;
};
/* the threshold that maximises the between-class variance of the histogram (Otsu 1979); pixels > t are sky */
A.otsu = function (hist) {
  let tot = 0, sum = 0;
  for (let i = 0; i < 256; i++) { tot += hist[i]; sum += i * hist[i]; }
  let wB = 0, sB = 0, best = 0, bt = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = tot - wB;
    if (!wF) break;
    sB += t * hist[t];
    const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; bt = t; }
  }
  return bt;
};
/* openness inside the circle (cx, cy, R): plain gap fraction, and weighted by the solid angle of an equiangular
   fisheye, where the pixel at distance ρ sees the zenith angle θ = (π/2)ρ/R and stands for sin θ / ρ of the
   hemisphere (up to a constant); rings of 15° are reported too. hemi = false: an ordinary photo, every pixel equal */
A.openness = function (grey, w, h, o) {
  const cx = o.cx != null ? o.cx : w / 2, cy = o.cy != null ? o.cy : h / 2, R = o.R != null ? o.R : min(w, h) / 2, t = o.threshold;
  let sky = 0, all = 0, wsky = 0, wall = 0;
  const ring = Array.from({ length: 6 }, () => [0, 0]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, rho = sqrt(dx * dx + dy * dy);
    if (o.hemi !== false && rho > R) continue;
    const isSky = grey[y * w + x] > t ? 1 : 0;
    all++; sky += isSky;
    if (o.hemi !== false) {
      const th = PI / 2 * rho / R, wt = rho > 1e-9 ? sin(th) / rho : PI / 2 / R;
      wall += wt; wsky += wt * isSky;
      const k = min(5, floor(th / (PI / 12)));
      ring[k][0] += isSky; ring[k][1]++;
    }
  }
  return { gap: sky / all, weighted: o.hemi !== false ? wsky / wall : sky / all, pixels: all, rings: ring.map((r, k) => ({ from: 15 * k, to: 15 * (k + 1), open: r[1] ? r[0] / r[1] : NaN, n: r[1] })) };
};
A.histogram = function (grey, w, h, o) {
  const hist = new Array(256).fill(0);
  const cx = o && o.cx != null ? o.cx : w / 2, cy = o && o.cy != null ? o.cy : h / 2, R = o && o.R != null ? o.R : min(w, h) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (o && o.hemi !== false) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy > R * R) continue; }
    hist[grey[y * w + x]]++;
  }
  return hist;
};

/* ---------------- shade and yield ----------------
   x: shade (%), y: yield. Linear and quadratic fits, the F test of the quadratic term, and the shade of
   maximum yield with its SE by the delta method: x* = −b₁/(2b₂), ∇ = (1/(2b₂), b₁/(2b₂²)) on (b₁, b₂). */
A.shadeYield = function (x, y) {
  const lin = Num.ols(x.map(v => [1, v]), y), quad = Num.ols(x.map(v => [1, v, v * v]), y);
  const F = (lin.rss - quad.rss) / (quad.rss / quad.df), pF = Num.pf(F, 1, quad.df, true);
  const [, b1, b2] = quad.coef;
  let opt = NaN, se = NaN, lo = NaN, hi = NaN, yOpt = NaN;
  if (b2 < 0) {
    opt = -b1 / (2 * b2);
    const g1 = -1 / (2 * b2), g2 = b1 / (2 * b2 * b2);
    const C = quad.cov;
    se = sqrt(g1 * g1 * C[1][1] + 2 * g1 * g2 * C[1][2] + g2 * g2 * C[2][2]);
    const t = Num.qt(0.975, quad.df);
    lo = opt - t * se; hi = opt + t * se;
    yOpt = quad.coef[0] + b1 * opt + b2 * opt * opt;
  }
  /* the confidence band of the mean of each model */
  const band = (fit, X0) => { const p = X0.length, t = Num.qt(0.975, fit.df); return xv => { const xr = p === 2 ? [1, xv] : [1, xv, xv * xv]; let m = 0, v = 0; for (let i = 0; i < p; i++) { m += xr[i] * fit.coef[i]; for (let j = 0; j < p; j++) v += xr[i] * fit.cov[i][j] * xr[j]; } return { m, lo: m - t * sqrt(v), hi: m + t * sqrt(v) }; }; };
  return { lin, quad, F, pF, opt, se, lo, hi, yOpt, bandLin: band(lin, [1, 1]), bandQuad: band(quad, [1, 1, 1]), best: quad.aic < lin.aic && pF < 0.05 ? 'quad' : 'lin' };
};

/* ---------------- planting layouts ----------------
   W × L plot (m). Every layout returns the positions inside it, keeping half a spacing from the edges. */
A.layout = function (o) {
  const W = o.W, L = o.L, pts = [];
  const push = (x, y, k) => { if (x >= -1e-9 && x <= W + 1e-9 && y >= -1e-9 && y <= L + 1e-9) pts.push({ x, y, k: k || 0 }); };
  if (o.kind === 'square' || o.kind === 'rect') {
    const a = o.a, b = o.kind === 'square' ? o.a : o.b;
    for (let y = b / 2; y <= L - b / 2 + 1e-9; y += b) for (let x = a / 2; x <= W - a / 2 + 1e-9; x += a) push(x, y);
  } else if (o.kind === 'tri') {
    const a = o.a, r = a * sqrt(3) / 2;
    let row = 0;
    for (let y = a / 2; y <= L - a / 2 + 1e-9; y += r, row++) { const off = row % 2 ? a / 2 : 0; for (let x = a / 2 + off; x <= W - a / 2 + 1e-9; x += a) push(x, y); }
  } else if (o.kind === 'alley') {
    /* rows of trees every o.alley m (across the length), trees every o.a m along each row */
    for (let y = o.alley / 2; y <= L - o.alley / 2 + 1e-9 || y <= L / 2; y += o.alley) { for (let x = o.a / 2; x <= W - o.a / 2 + 1e-9; x += o.a) push(x, y); if (o.alley >= L) break; }
  } else if (o.kind === 'fence') {
    /* live fence along the perimeter, one tree every o.a m */
    const P = 2 * (W + L), n = floor(P / o.a + 1e-9);
    for (let i = 0; i < n; i++) {
      let s = i * o.a, x, y;
      if (s < W) { x = s; y = 0; } else if ((s -= W) < L) { x = W; y = s; } else if ((s -= L) < W) { x = W - s; y = L; } else { s -= W; x = 0; y = L - s; }
      push(x, y);
    }
  } else if (o.kind === 'boundary') {
    /* boundary rows along the two long sides */
    for (let x = o.a / 2; x <= W - o.a / 2 + 1e-9; x += o.a) { push(x, 0); if (o.both !== false) push(x, L); }
  }
  const area = W * L;
  return { pts, n: pts.length, perHa: pts.length * 10000 / area, areaPerTree: area / pts.length, theoretical: A.densityOf(o) };
};
/* the density of an infinite layout (trees per hectare) */
A.densityOf = function (o) {
  if (o.kind === 'square') return 10000 / (o.a * o.a);
  if (o.kind === 'rect') return 10000 / (o.a * o.b);
  if (o.kind === 'tri') return 10000 / (o.a * o.a * sqrt(3) / 2);
  if (o.kind === 'alley') return 10000 / (o.a * o.alley);
  return NaN;
};

/* ---------------- carbon budget ----------------
   pools: {name: Mg C/ha} for the agroforestry system and the monoculture */
A.budget = function (agro, mono) {
  const keys = [...new Set(Object.keys(agro).concat(Object.keys(mono)))];
  const rows = keys.map(k => ({ k, agro: agro[k] || 0, mono: mono[k] || 0, diff: (agro[k] || 0) - (mono[k] || 0) }));
  const ta = rows.reduce((s, r) => s + r.agro, 0), tm = rows.reduce((s, r) => s + r.mono, 0);
  return { rows, totalAgro: ta, totalMono: tm, diff: ta - tm, diffCO2: (ta - tm) * 44 / 12 };
};

g.Agro = A;
return A;
}
if (typeof window !== 'undefined') AgroCore(window);
else if (typeof globalThis !== 'undefined') AgroCore(globalThis);
