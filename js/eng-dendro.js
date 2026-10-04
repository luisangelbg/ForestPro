/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 2: tree mensuration.

   Units: diameters in cm, heights and lengths in m, areas in m², volumes in m³.
   · DBH from the girth, basal area g = π d²/40 000.
   · Log volume by the formulas of Huber (middle section), Smalian (the two
     ends) and Newton (ends and middle); the volume of a felled tree from its
     sections (Smalian between sections, a cone for the top, a cylinder for the
     stump when asked); form factor and form quotient (Husch, Beers and Kershaw
     2003, ch. 6; Avery and Burkhart 2002, ch. 6).
   · Volume equations fitted to the data: Schumacher–Hall (1933) by nonlinear
     and by log-linear least squares (with Meyer's 1941 correction of the
     back-transformation), Spurr's (1952) combined variable, and its
     logarithmic form; compared by Furnival's (1961) index, which puts models
     with different responses on the same scale.
   · Taper: Kozak, Munro and Smith (1969) and the segmented polynomial of Max
     and Burkhart (1976); diameter at any height, height to a top diameter and
     volume between two heights by integration of the profile.
   · Height–diameter: Näslund (1937), Chapman–Richards (Richards 1959) and
     Weibull (Yang, Kozak and Smith 1978), all through breast height (1.3 m),
     fitted by nonlinear least squares.
   Needs Num and NLS. No DOM. */
function DendroCore(g) {
'use strict';
const Num = g.Num, NLS = g.NLS;
const { PI, sqrt, log, exp, abs, max, min, pow } = Math;
const D = {};
const BH = 1.3;

/* ---------------- single trees ---------------- */
D.dbhFromGirth = c => c / PI;
D.girthFromDbh = d => d * PI;
D.basalArea = d => PI * d * d / 40000;          // m², d in cm
D.crownArea = c => PI * c * c / 4;              // m², crown diameter in m
D.slenderness = (h, d) => 100 * h / d;          // H/D with H in m and D in cm → m/m ×100
D.volFormFactor = (d, h, f) => D.basalArea(d) * h * (f == null ? 0.5 : f);

/* ---------------- logs ---------------- */
/* d in cm, L in m → m³ */
D.huber = (dm, L) => D.basalArea(dm) * L;
D.smalian = (d1, d2, L) => (D.basalArea(d1) + D.basalArea(d2)) / 2 * L;
D.newton = (d1, dm, d2, L) => (D.basalArea(d1) + 4 * D.basalArea(dm) + D.basalArea(d2)) / 6 * L;
D.cone = (d, L) => D.basalArea(d) * L / 3;
D.paraboloid = (d, L) => D.basalArea(d) * L / 2;

/* ---------------- a felled tree from its sections ----------------
   secs: [{h, d}] (heights above ground, diameters at those heights), H: total height.
   Smalian between consecutive sections, a cone from the last section to the tip,
   and, if stump is true, a cylinder of the first diameter from the ground up. */
D.stemVolume = function (secs, H, o) {
  o = o || {};
  const s = secs.filter(x => isFinite(x.h) && isFinite(x.d) && x.d > 0).slice().sort((a, b) => a.h - b.h);
  if (s.length < 2) return null;
  let vs = 0;
  const logs = [];
  for (let i = 0; i + 1 < s.length; i++) {
    const L = s[i + 1].h - s[i].h;
    if (L <= 0) continue;
    const v = D.smalian(s[i].d, s[i + 1].d, L);
    vs += v;
    logs.push({ from: s[i].h, to: s[i + 1].h, d1: s[i].d, d2: s[i + 1].d, v });
  }
  const last = s[s.length - 1];
  const vtop = isFinite(H) && H > last.h ? D.cone(last.d, H - last.h) : 0;
  const vstump = s[0].h > 0 ? D.basalArea(s[0].d) * s[0].h : 0;
  /* merchantable volume up to a top diameter: interpolate the height where d = minTop */
  let vm = NaN, hm = NaN;
  if (o.minTop > 0) {
    vm = 0; hm = s[0].h;
    for (let i = 0; i + 1 < s.length; i++) {
      const a = s[i], b = s[i + 1];
      if (a.d < o.minTop) break;
      if (b.d >= o.minTop) { vm += D.smalian(a.d, b.d, b.h - a.h); hm = b.h; continue; }
      const hx = a.h + (a.d - o.minTop) / (a.d - b.d) * (b.h - a.h);
      vm += D.smalian(a.d, o.minTop, hx - a.h); hm = hx; break;
    }
    if (last.d >= o.minTop && isFinite(H) && H > last.h) {
      /* the top cone down to the top diameter */
      const hx = last.h + (H - last.h) * (1 - o.minTop / last.d);
      vm += D.basalArea(last.d) * (H - last.h) / 3 * (1 - pow(o.minTop / last.d, 3)); hm = hx;
    }
  }
  const total = vs + vtop + (o.stump ? vstump : 0);
  return { vSections: vs, vTop: vtop, vStump: vstump, vTotal: total, vMerch: vm, hMerch: hm, logs, n: s.length };
};
/* a whole table of sections → one record per tree */
D.treesFromSections = function (rows, o) {
  o = o || {};
  const by = new Map();
  rows.forEach(r => { const k = String(r.tree); if (!by.has(k)) by.set(k, []); by.get(k).push(r); });
  const out = [];
  by.forEach((rs, k) => {
    const H = rs.find(r => isFinite(r.H)) ? rs.find(r => isFinite(r.H)).H : NaN;
    let dbh = rs.find(r => isFinite(r.dbh)) ? rs.find(r => isFinite(r.dbh)).dbh : NaN;
    const secs = rs.map(r => ({ h: r.h, d: r.d }));
    if (!isFinite(dbh)) { const b = secs.find(x => abs(x.h - BH) < 1e-9); if (b) dbh = b.d; }
    const v = D.stemVolume(secs, H, o);
    if (!v) return;
    const g0 = D.basalArea(dbh);
    /* the form factor of the stem from the ground (artificial: with g at 1.3 m) */
    const vf = v.vSections + v.vTop + v.vStump;
    const f = vf / (g0 * H);
    /* form quotient: diameter at half the height over DBH (Schiffel), interpolated */
    const dh = D.interpDiameter(secs, H / 2, H);
    out.push({ tree: k, dbh, H, nSec: v.n, vTotal: v.vTotal, vStem: v.vSections + v.vTop, vStump: v.vStump, vMerch: v.vMerch, hMerch: v.hMerch,
      formFactor: f, formQuotient: dh / dbh, secs: secs.slice().sort((a, b) => a.h - b.h) });
  });
  return out;
};
/* diameter at height h by straight lines between sections (0 at the tip) */
D.interpDiameter = function (secs, h, H) {
  const s = secs.slice().sort((a, b) => a.h - b.h);
  if (h <= s[0].h) return s[0].d;
  for (let i = 0; i + 1 < s.length; i++) if (h <= s[i + 1].h) return s[i].d + (s[i + 1].d - s[i].d) * (h - s[i].h) / (s[i + 1].h - s[i].h);
  const L = s[s.length - 1];
  return isFinite(H) && H > L.h ? L.d * max(0, (H - h) / (H - L.h)) : NaN;
};

/* ---------------- volume equations ----------------
   data: [{d, h, v}] with v in m³. Each model returns a NLS/OLS fit, its prediction
   on the volume scale and Furnival's index. */
const VOL = {
  schumacher: {
    es: 'Schumacher–Hall (no lineal)', en: 'Schumacher–Hall (nonlinear)', eq: 'V = b₀ · D^b₁ · H^b₂', names: ['b0', 'b1', 'b2'],
    fit(data) {
      /* the log-linear fit gives the start */
      const L = Num.ols(data.map(r => [1, log(r.d), log(r.h)]), data.map(r => log(r.v)));
      const s = L.ok ? [exp(L.coef[0]), L.coef[1], L.coef[2]] : [5e-5, 1.9, 1];
      const f = (b, r) => b[0] * pow(r.d, b[1]) * pow(r.h, b[2]);
      const grad = (b, r) => { const v = f(b, r); return [v / b[0], v * log(r.d), v * log(r.h)]; };
      const fit = NLS.fit({ f, grad, x: data, y: data.map(r => r.v), start: [s, [5e-5, 2, 1]], names: this.names, lower: [1e-12, -10, -10] });
      return Object.assign(fit, { predict: r => f(fit.coef, r), furnival: fit.sigma });
    },
  },
  schumacherLog: {
    es: 'Schumacher–Hall (logarítmica)', en: 'Schumacher–Hall (logarithmic)', eq: 'ln V = b₀ + b₁ ln D + b₂ ln H', names: ['b0', 'b1', 'b2'],
    fit(data) {
      const y = data.map(r => log(r.v));
      const fit = Num.ols(data.map(r => [1, log(r.d), log(r.h)]), y);
      if (!fit.ok) return fit;
      const cf = exp(fit.sigma * fit.sigma / 2);         // Meyer (1941)
      const geo = exp(Num.mean(y));
      return Object.assign(fit, { names: this.names, logScale: true, meyer: cf, predict: r => cf * exp(fit.coef[0] + fit.coef[1] * log(r.d) + fit.coef[2] * log(r.h)), furnival: fit.sigma * geo });
    },
  },
  spurr: {
    es: 'Variable combinada de Spurr', en: "Spurr's combined variable", eq: 'V = b₀ + b₁ · D²H', names: ['b0', 'b1'],
    fit(data) {
      const fit = Num.ols(data.map(r => [1, r.d * r.d * r.h]), data.map(r => r.v));
      if (!fit.ok) return fit;
      return Object.assign(fit, { names: this.names, predict: r => fit.coef[0] + fit.coef[1] * r.d * r.d * r.h, furnival: fit.sigma });
    },
  },
  spurrLog: {
    es: 'Spurr logarítmica', en: 'Spurr logarithmic', eq: 'ln V = b₀ + b₁ ln(D²H)', names: ['b0', 'b1'],
    fit(data) {
      const y = data.map(r => log(r.v));
      const fit = Num.ols(data.map(r => [1, log(r.d * r.d * r.h)]), y);
      if (!fit.ok) return fit;
      const cf = exp(fit.sigma * fit.sigma / 2), geo = exp(Num.mean(y));
      return Object.assign(fit, { names: this.names, logScale: true, meyer: cf, predict: r => cf * exp(fit.coef[0] + fit.coef[1] * log(r.d * r.d * r.h)), furnival: fit.sigma * geo });
    },
  },
};
D.VOL = VOL;
/* the volume of a tree with a fitted equation (coefficients and, for the log forms, the Meyer factor) */
D.volPredict = function (key, coef, meyer, d, h) {
  const b = coef, m = meyer || 1;
  if (key === 'schumacher') return b[0] * pow(d, b[1]) * pow(h, b[2]);
  if (key === 'schumacherLog') return m * exp(b[0] + b[1] * log(d) + b[2] * log(h));
  if (key === 'spurr') return b[0] + b[1] * d * d * h;
  if (key === 'spurrLog') return m * exp(b[0] + b[1] * log(d * d * h));
  return NaN;
};
/* every model fitted, with the statistics on the volume scale that make them comparable */
D.fitVolumeModels = function (data, keys) {
  const ok = data.filter(r => r.d > 0 && r.h > 0 && r.v > 0);
  return (keys || Object.keys(VOL)).map(k => {
    const m = VOL[k];
    let fit;
    try { fit = m.fit(ok); } catch (e) { fit = { ok: false }; }
    if (!fit || !fit.ok) return { key: k, ok: false, model: m };
    const pred = ok.map(r => fit.predict(r)), obs = ok.map(r => r.v);
    const res = obs.map((v, i) => v - pred[i]);
    const rss = res.reduce((s, e) => s + e * e, 0), mv = Num.mean(obs);
    const tss = obs.reduce((s, v) => s + (v - mv) * (v - mv), 0);
    return {
      key: k, ok: true, model: m, fit, pred, obs, res,
      r2v: 1 - rss / tss, rmse: sqrt(rss / ok.length), rmsePct: 100 * sqrt(rss / ok.length) / mv,
      bias: Num.mean(res), biasPct: 100 * Num.mean(res) / mv, furnival: fit.furnival, n: ok.length,
    };
  });
};

/* ---------------- taper ----------------
   secs: [{d, h, D, H}] per section (D = DBH, H = total height of its tree). */
const TAPER = {
  kozak69: {
    es: 'Kozak, Munro y Smith (1969)', en: 'Kozak, Munro and Smith (1969)', eq: '(d/D)² = b₁(z − 1) + b₂(z² − 1),  z = h/H', names: ['b1', 'b2'],
    fit(rows) {
      const X = rows.map(r => { const z = r.h / r.H; return [z - 1, z * z - 1]; }), y = rows.map(r => (r.d / r.D) * (r.d / r.D));
      const fit = Num.ols(X, y, { intercept: false });
      if (!fit.ok) return fit;
      return Object.assign(fit, { names: this.names, rel: z => max(0, fit.coef[0] * (z - 1) + fit.coef[1] * (z * z - 1)) });
    },
  },
  maxBurkhart: {
    es: 'Max y Burkhart (1976)', en: 'Max and Burkhart (1976)', eq: '(d/D)² = b₁(z−1) + b₂(z²−1) + b₃(a₁−z)²·I₁ + b₄(a₂−z)²·I₂', names: ['b1', 'b2', 'b3', 'b4', 'a1', 'a2'],
    fit(rows) {
      const f = (b, r) => { const z = r.h / r.H; let v = b[0] * (z - 1) + b[1] * (z * z - 1); if (z <= b[4]) v += b[2] * (b[4] - z) * (b[4] - z); if (z <= b[5]) v += b[3] * (b[5] - z) * (b[5] - z); return v; };
      const grad = (b, r) => {
        const z = r.h / r.H, i1 = z <= b[4] ? 1 : 0, i2 = z <= b[5] ? 1 : 0;
        return [z - 1, z * z - 1, i1 * (b[4] - z) * (b[4] - z), i2 * (b[5] - z) * (b[5] - z), i1 * 2 * b[2] * (b[4] - z), i2 * 2 * b[3] * (b[5] - z)];
      };
      const y = rows.map(r => (r.d / r.D) * (r.d / r.D));
      const starts = [[-3, 1.4, -1.5, 40, 0.75, 0.1], [-3.5, 1.7, -2, 60, 0.7, 0.08], [-2.6, 1.2, -1, 20, 0.8, 0.12], [-4, 2, -3, 100, 0.65, 0.06]];
      const fit = NLS.fit({ f, grad, x: rows, y, start: starts, names: this.names, lower: [-50, -50, -500, -5000, 0.2, 0.01], upper: [50, 50, 500, 5000, 0.98, 0.4] });
      if (!fit.ok) return fit;
      return Object.assign(fit, { rel: z => max(0, f(fit.coef, { h: z, H: 1 })) });
    },
  },
};
D.TAPER = TAPER;
D.fitTaper = function (rows, keys) {
  const ok = rows.filter(r => r.d > 0 && r.h >= 0 && r.H > 0 && r.D > 0 && r.h <= r.H);
  return (keys || Object.keys(TAPER)).map(k => {
    let fit;
    try { fit = TAPER[k].fit(ok); } catch (e) { fit = { ok: false }; }
    if (!fit || !fit.ok) return { key: k, ok: false, model: TAPER[k] };
    /* errors on the diameter scale */
    const pd = ok.map(r => r.D * sqrt(fit.rel(r.h / r.H))), od = ok.map(r => r.d);
    const res = od.map((v, i) => v - pd[i]);
    const rss = res.reduce((s, e) => s + e * e, 0), m = Num.mean(od);
    const tss = od.reduce((s, v) => s + (v - m) * (v - m), 0);
    return { key: k, ok: true, model: TAPER[k], fit, n: ok.length, rmseD: sqrt(rss / ok.length), biasD: Num.mean(res), r2D: 1 - rss / tss, pd, od };
  });
};
/* with a fitted profile: diameter at h, volume between h1 and h2 (Simpson), height to a top diameter */
D.taperDiameter = (tp, Dd, H, h) => Dd * sqrt(tp.rel(h / H));
D.taperVolume = function (tp, Dd, H, h1, h2) {
  const n = 400, a = max(0, h1), b = min(H, h2);
  if (!(b > a)) return 0;
  const step = (b - a) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) { const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * tp.rel((a + i * step) / H); }
  return PI / 40000 * Dd * Dd * s * step / 3;
};
D.taperHeightTo = function (tp, Dd, H, dTop) {
  const f = h => D.taperDiameter(tp, Dd, H, h) - dTop;
  if (f(BH) < 0) return NaN;
  return Num.brent(f, BH, H, 1e-6);
};
/* log assortments up a stem: logs of a given length from the stump up to the top diameter */
D.assortments = function (tp, Dd, H, o) {
  o = Object.assign({ stump: 0.3, len: 2.5, trim: 0.05, top: 10 }, o || {});
  const hTop = D.taperHeightTo(tp, Dd, H, o.top);
  const out = [];
  let h = o.stump;
  while (isFinite(hTop) && h + o.len <= hTop + 1e-9) {
    const a = h, b = h + o.len;
    out.push({ n: out.length + 1, from: a, to: b, dBase: D.taperDiameter(tp, Dd, H, a), dTop: D.taperDiameter(tp, Dd, H, b), v: D.taperVolume(tp, Dd, H, a, b) });
    h = b + o.trim;
  }
  return { logs: out, hTop, vMerch: out.reduce((s, l) => s + l.v, 0), vTotal: D.taperVolume(tp, Dd, H, 0, H) };
};

/* ---------------- height–diameter ---------------- */
const HD = {
  naslund: {
    es: 'Näslund', en: 'Näslund', eq: 'H = 1.3 + D² / (a + b·D)²', names: ['a', 'b'],
    f: (b, d) => BH + d * d / ((b[0] + b[1] * d) * (b[0] + b[1] * d)),
    start(data) { const L = Num.ols(data.map(r => [1, r.d]), data.map(r => r.d / sqrt(max(r.h - BH, 0.05)))); return L.ok ? [L.coef] : [[1.5, 0.2]]; },
    lower: [-1e3, 1e-6],
  },
  chapman: {
    es: 'Chapman–Richards', en: 'Chapman–Richards', eq: 'H = 1.3 + a · (1 − e^(−b·D))^c', names: ['a', 'b', 'c'],
    f: (b, d) => BH + b[0] * pow(1 - exp(-b[1] * d), b[2]),
    start(data) { const hm = max(...data.map(r => r.h)); return [[hm * 1.1, 0.04, 1.2], [hm * 1.4, 0.02, 1], [hm, 0.08, 1.5], [hm * 2, 0.01, 0.9]]; },
    lower: [0.1, 1e-6, 0.05], upper: [500, 5, 20],
  },
  weibull: {
    es: 'Weibull', en: 'Weibull', eq: 'H = 1.3 + a · (1 − e^(−b·D^c))', names: ['a', 'b', 'c'],
    f: (b, d) => BH + b[0] * (1 - exp(-b[1] * pow(d, b[2]))),
    start(data) { const hm = max(...data.map(r => r.h)); return [[hm * 1.1, 0.01, 1.2], [hm * 1.3, 0.03, 1], [hm, 0.005, 1.5], [hm * 1.6, 0.02, 0.9]]; },
    lower: [0.1, 1e-8, 0.05], upper: [500, 10, 10],
  },
};
D.HD = HD;
D.fitHD = function (data, keys) {
  const ok = data.filter(r => r.d > 0 && r.h > BH);
  return (keys || Object.keys(HD)).map(k => {
    const m = HD[k];
    const fit = NLS.fit({ f: (b, r) => m.f(b, r.d), x: ok, y: ok.map(r => r.h), start: m.start(ok), names: m.names, lower: m.lower, upper: m.upper });
    if (!fit.ok) return { key: k, ok: false, model: m };
    return { key: k, ok: true, model: m, fit, predict: d => m.f(fit.coef, d), n: ok.length };
  });
};

g.Dendro = D;
return D;
}
if (typeof window !== 'undefined') DendroCore(window);
else if (typeof globalThis !== 'undefined') DendroCore(globalThis);
