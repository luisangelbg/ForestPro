/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 9: forestry utilities.

   · Logs: volume by Smalian, Huber, Newton and the frustum of a cone, with or
     without bark (bark thickness on the radius), and the board-foot log rules
     of Doyle, Scribner (Bruce's formula for the Decimal C diagram) and the
     International ¼ inch (4-foot sections, ½ inch of taper per section,
     0.22D² − 0.71D per section, × 0.905 for a ¼ inch saw kerf).
   · Sawn lumber: board feet of nominal pieces (thickness in inches × width
     in inches × length in feet / 12) and cubic metres.
   · Sawmill yield: lumber over log volume, board feet per cubic metre of log
     and the overrun against a log rule.
   · Form factors of a tree and the standard solids.
   · Units, with the exact definitions of the inch, the foot, the acre, the
     pound and the board foot (144 in³ = 2.359737216 dm³).
   · Plantation economics: present values, net present value, internal rate
     of return, benefit–cost ratio, Faustmann's land expectation value, the
     equivalent annual annuity and the discounted payback year.
   Needs nothing. No DOM. */
function ToolsCore(g) {
'use strict';
const K = {};
const PI = Math.PI;
const IN = 0.0254, FT = 0.3048, AC = 4046.8564224, LB = 0.45359237;
K.BF_M3 = 144 * Math.pow(IN, 3);           /* 0.002359737216 m³ */
K.M3_BF = 1 / K.BF_M3;                       /* 423.7760007… board feet */

/* ---------------- logs (d in cm, L in m → m³) ---------------- */
const gArea = d => PI * d * d / 40000;
K.smalian = (d1, d2, L) => L * (gArea(d1) + gArea(d2)) / 2;
K.huber = (dm, L) => L * gArea(dm);
K.newton = (d1, dm, d2, L) => L * (gArea(d1) + 4 * gArea(dm) + gArea(d2)) / 6;
K.frustum = (d1, d2, L) => PI * L * (d1 * d1 + d1 * d2 + d2 * d2) / 120000;
/* one log: {L, d1 (small end), d2 (large end), dm, bark (mm, single thickness)} */
K.logVolume = function (lg, o) {
  o = o || {};
  const b = o.underBark && lg.bark > 0 ? lg.bark / 5 : 0;  /* mm on the radius → cm on the diameter */
  const d1 = lg.d1 - b, d2 = lg.d2 - b, dm = lg.dm > 0 ? lg.dm - b : NaN, L = lg.L;
  const r = { smalian: K.smalian(d1, d2, L), frustum: K.frustum(d1, d2, L), huber: isFinite(dm) ? K.huber(dm, L) : NaN, newton: isFinite(dm) ? K.newton(d1, dm, d2, L) : NaN };
  /* board-foot rules take the small end inside bark in inches and the length in feet */
  const Din = (lg.d1 - (lg.bark > 0 ? lg.bark / 5 : 0)) / 2.54, Lft = L / FT;
  r.doyle = K.doyle(Din, Lft); r.scribner = K.scribner(Din, Lft); r.intl = K.international(Din, Lft);
  r.Din = Din; r.Lft = Lft;
  return r;
};

/* ---------------- board-foot log rules (D: small end in inches, L: feet) ---------------- */
K.doyle = (D, L) => D > 4 ? (D - 4) * (D - 4) * L / 16 : 0;
K.scribner = (D, L) => Math.max(0, (0.79 * D * D - 2 * D - 4) * L / 16);
K.international = function (D, L, kerf) {
  const sec = d => Math.max(0, 0.22 * d * d - 0.71 * d);
  const n = Math.floor(L / 4 + 1e-9), rem = L - 4 * n;
  let s = 0;
  for (let k = 0; k < n; k++) s += sec(D + k / 2);
  if (rem > 1e-9) s += sec(D + n / 2) * rem / 4;
  return kerf === '1/8' ? s : s * 0.905;
};

/* ---------------- sawn lumber ---------------- */
/* piece: {t, w, L, n} in inches, inches and feet (unit 'in') or cm, cm and m (unit 'cm') */
K.piece = function (p, unit) {
  const n = p.n > 0 ? p.n : 1;
  if (unit === 'cm') { const m3 = p.t * p.w * p.L / 10000 * n; return { m3, bf: m3 * K.M3_BF }; }
  const bf = p.t * p.w * p.L / 12 * n;
  return { bf, m3: bf * K.BF_M3 };
};
/* sawmill yield: log volume (m³), lumber (m³) and the log rule's board feet */
K.sawmill = function (logM3, lumberM3, ruleBF) {
  const lumberBF = lumberM3 * K.M3_BF;
  return { coef: lumberM3 / logM3, waste: 1 - lumberM3 / logM3, bfPerM3: lumberBF / logM3, lumberBF, overrun: ruleBF > 0 ? lumberBF / ruleBF - 1 : NaN };
};

/* ---------------- form ---------------- */
K.formFactor = (V, d, h) => V / (gArea(d) * h);
K.volumeFromForm = (f, d, h) => f * gArea(d) * h;
K.SOLIDS = [
  { id: 'cyl', es: 'Cilindro', en: 'Cylinder', f: 1 },
  { id: 'par', es: 'Paraboloide', en: 'Paraboloid', f: 1 / 2 },
  { id: 'cone', es: 'Cono', en: 'Cone', f: 1 / 3 },
  { id: 'nei', es: 'Neiloide', en: 'Neiloid', f: 1 / 4 },
];

/* ---------------- units: each factor takes the unit to the base of its kind ---------------- */
K.UNITS = {
  length: { base: 'm', u: { m: 1, cm: 0.01, mm: 0.001, km: 1000, in: IN, ft: FT, yd: 0.9144, ch: 20.1168, mi: 1609.344 } },
  area: { base: 'm2', u: { m2: 1, ha: 10000, km2: 1e6, ac: AC, ft2: FT * FT } },
  volume: { base: 'm3', u: { m3: 1, dm3: 0.001, ft3: FT * FT * FT, bf: K.BF_M3, cord: 128 * FT * FT * FT } },
  mass: { base: 'kg', u: { kg: 1, g: 0.001, t: 1000, lb: LB, sht: 2000 * LB, lgt: 2240 * LB } },
  basal: { base: 'm2ha', u: { m2ha: 1, ft2ac: FT * FT / AC * 10000 } },
  volha: { base: 'm3ha', u: { m3ha: 1, ft3ac: FT * FT * FT / AC * 10000, bfac: K.BF_M3 / AC * 10000, cordac: 128 * FT * FT * FT / AC * 10000 } },
  stock: { base: 'Mgha', u: { Mgha: 1, kgm2: 10, tac: 2000 * LB / AC * 10, lbac: LB / AC * 10 } },
  carbon: { base: 'Cha', u: { Cha: 1, CO2ha: 12 / 44 } },
  density: { base: 'kgm3', u: { kgm3: 1, gcm3: 1000, lbft3: LB / (FT * FT * FT) } },
  trees: { base: 'ha', u: { ha: 1, ac: 10000 / AC, m2: 10000 } },
};
K.convert = (kind, v, from, to) => v * K.UNITS[kind].u[from] / K.UNITS[kind].u[to];
/* stacked wood: solid = stacked × factor */
K.stacked = (st, factor) => st * factor;

/* ---------------- plantation economics ---------------- */
/* flows: [{t, cost, income}]; annual: a cost every year from 1 to T; r: rate (0.08 = 8 %) */
K.cashFlow = function (flows, annual, T) {
  T = T != null ? T : Math.max(0, ...flows.map(f => f.t));
  const net = Array.from({ length: T + 1 }, (_, t) => ({ t, cost: 0, income: 0 }));
  flows.forEach(f => { if (f.t >= 0 && f.t <= T && isFinite(f.t)) { const k = Math.round(f.t); net[k].cost += +f.cost || 0; net[k].income += +f.income || 0; } });
  if (annual > 0) for (let t = 1; t <= T; t++) net[t].cost += annual;
  net.forEach(n => { n.net = n.income - n.cost; });
  return net;
};
K.npv = (net, r) => net.reduce((s, n) => s + n.net / Math.pow(1 + r, n.t), 0);
K.irr = function (net) {
  const f = r => K.npv(net, r);
  /* the first change of sign on a fine scan, then bisection */
  let a = -0.9, fa = f(a);
  for (let r = -0.9 + 0.005; r <= 2; r += 0.005) {
    const fr = f(r);
    if (fa === 0) return a;
    if (fa * fr < 0) { let lo = a, hi = r, flo = fa; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2, fm = f(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } } return (lo + hi) / 2; }
    a = r; fa = fr;
  }
  return NaN;
};
K.econ = function (flows, annual, r, T) {
  const net = K.cashFlow(flows, annual, T);
  T = net.length - 1;
  const d = t => Math.pow(1 + r, -t);
  const pvC = net.reduce((s, n) => s + n.cost * d(n.t), 0), pvI = net.reduce((s, n) => s + n.income * d(n.t), 0);
  const npv = pvI - pvC, q = Math.pow(1 + r, T);
  let cum = 0, payback = NaN;
  const rows = net.map(n => { cum += n.net * d(n.t); if (!isFinite(payback) && cum >= 0 && n.t > 0) payback = n.t; return Object.assign({}, n, { disc: n.net * d(n.t), cum }); });
  return {
    rows, T, r, pvC, pvI, npv, bc: pvI / pvC, irr: K.irr(net),
    lev: T > 0 ? npv * q / (q - 1) : NaN,                    /* Faustmann: the same rotation forever */
    eaa: T > 0 ? (r === 0 ? npv / T : npv * r / (1 - 1 / q)) : NaN,
    payback, costTotal: net.reduce((s, n) => s + n.cost, 0), incomeTotal: net.reduce((s, n) => s + n.income, 0),
    establishment: net.filter(n => n.t <= 1).reduce((s, n) => s + n.cost, 0),
  };
};
K.npvCurve = (flows, annual, rates, T) => { const net = K.cashFlow(flows, annual, T); return rates.map(r => ({ r, npv: K.npv(net, r) })); };

g.Tools = K;
return K;
}
if (typeof window !== 'undefined') ToolsCore(window);
else if (typeof globalThis !== 'undefined') ToolsCore(globalThis);
