/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 4: biomass and carbon.

   · A catalogue of allometric equations with their units, range and source
     (Chave et al. 2005 and 2014, Brown 1997, Jenkins et al. 2003, Segura et
     al. 2006, van Noordwijk et al. 2002, Díaz-Franco et al. 2007, Figueroa-
     Navarro et al. 2010), plus the user's own equations in five forms.
   · Wood density: a reference table and, when the user loads the Global Wood
     Density Database (Zanne et al. 2009; CC0), the same search the reference
     implementation in R uses: the mean of the records of the species; if it is
     missing, the mean of the species means of the genus, then of the genus
     means of the family; then the mean of the stand and of the data set.
   · Belowground biomass by a root:shoot ratio (IPCC 2006, vol. 4, table 4.4)
     or by Cairns et al. (1997, eq. 3); carbon by a fraction (0.47 by default,
     IPCC 2006, table 4.3) and CO₂-equivalent by 44/12.
   · Necromass of downed wood by line intersect (Van Wagner 1968), litter from
     frames, soil organic carbon by layers (stock = C% × bulk density × depth ×
     (1 − coarse fraction)).
   · Uncertainty by Monte Carlo: errors of measurement in D (a fixed SD, a
     percentage, or the model of Chave et al. 2004), in H and in wood density
     (truncated normals), and the residual error of the equation on the log
     scale with mean one, exp(ε − σ²/2), because the published equations
     predict the mean; per-plot and per-stand distributions.
   · Change of stock between two inventories, paired by plot or not.
   Needs Num. No DOM. */
function BiomassCore(g) {
'use strict';
const Num = g.Num;
const { PI, sqrt, log, exp, abs, max, min, pow, log10 } = Math;
const B = {};

/* ---------------- the catalogue ----------------
   Every equation: id, names, group, needs (which of D, H, rho, d15, E it uses), f(tree) → kg dry mass,
   sigma (residual SE on the natural-log scale, if published), range of D, source. */
const L10 = Math.LN10;
B.EQS = [
  { id: 'chave14_h', es: 'Chave et al. 2014, ec. 4 (pantropical, con altura)', en: 'Chave et al. 2014, eq. 4 (pantropical, with height)', group: 'pan', needs: ['D', 'H', 'rho'], sigma: 0.357, dmin: 5, dmax: 212,
    eq: 'AGB = 0.0673 · (ρD²H)^0.976', f: t => 0.0673 * pow(t.rho * t.D * t.D * t.H, 0.976),
    src: 'Chave, J. et al. (2014). Improved allometric models to estimate the aboveground biomass of tropical trees. <i>Global Change Biology</i> 20:3177–3190. doi:10.1111/gcb.12629' },
  { id: 'chave14_e', es: 'Chave et al. 2014, ec. 7 (pantropical, sin altura, con E)', en: 'Chave et al. 2014, eq. 7 (pantropical, no height, with E)', group: 'pan', needs: ['D', 'rho', 'E'], sigma: 0.413, dmin: 5, dmax: 212,
    eq: 'AGB = exp(−1.803 − 0.976E + 0.976 ln ρ + 2.673 ln D − 0.0299 (ln D)²)', f: t => exp(-1.803 - 0.976 * t.E + 0.976 * log(t.rho) + 2.673 * log(t.D) - 0.0299 * log(t.D) * log(t.D)),
    src: 'Chave, J. et al. (2014). <i>Global Change Biology</i> 20:3177–3190. E es el índice de estrés ambiental del sitio (ec. 6b).' },
  { id: 'chave05_dry_h', es: 'Chave et al. 2005, bosque seco con altura', en: 'Chave et al. 2005, dry forest with height', group: 'dry', needs: ['D', 'H', 'rho'], sigma: 0.311, dmin: 5, dmax: 156,
    eq: 'AGB = 0.112 · (ρD²H)^0.916', f: t => 0.112 * pow(t.rho * t.D * t.D * t.H, 0.916), src: 'Chave, J. et al. (2005). Tree allometry and improved estimation of carbon stocks and balance in tropical forests. <i>Oecologia</i> 145:87–99. doi:10.1007/s00442-005-0100-x' },
  { id: 'chave05_moist_h', es: 'Chave et al. 2005, bosque húmedo con altura', en: 'Chave et al. 2005, moist forest with height', group: 'moist', needs: ['D', 'H', 'rho'], sigma: 0.316, dmin: 5, dmax: 156,
    eq: 'AGB = 0.0509 · ρD²H', f: t => 0.0509 * t.rho * t.D * t.D * t.H, src: 'Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.' },
  { id: 'chave05_wet_h', es: 'Chave et al. 2005, bosque muy húmedo con altura', en: 'Chave et al. 2005, wet forest with height', group: 'wet', needs: ['D', 'H', 'rho'], sigma: 0.311, dmin: 5, dmax: 156,
    eq: 'AGB = 0.0776 · (ρD²H)^0.940', f: t => 0.0776 * pow(t.rho * t.D * t.D * t.H, 0.940), src: 'Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.' },
  { id: 'chave05_dry', es: 'Chave et al. 2005, bosque seco sin altura', en: 'Chave et al. 2005, dry forest without height', group: 'dry', needs: ['D', 'rho'], sigma: 0.356, dmin: 5, dmax: 156,
    eq: 'AGB = ρ · exp(−0.667 + 1.784 ln D + 0.207 (ln D)² − 0.0281 (ln D)³)', f: t => { const l = log(t.D); return t.rho * exp(-0.667 + 1.784 * l + 0.207 * l * l - 0.0281 * l * l * l); }, src: 'Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.' },
  { id: 'chave05_moist', es: 'Chave et al. 2005, bosque húmedo sin altura', en: 'Chave et al. 2005, moist forest without height', group: 'moist', needs: ['D', 'rho'], sigma: 0.356, dmin: 5, dmax: 156,
    eq: 'AGB = ρ · exp(−1.499 + 2.148 ln D + 0.207 (ln D)² − 0.0281 (ln D)³)', f: t => { const l = log(t.D); return t.rho * exp(-1.499 + 2.148 * l + 0.207 * l * l - 0.0281 * l * l * l); }, src: 'Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.' },
  { id: 'chave05_wet', es: 'Chave et al. 2005, bosque muy húmedo sin altura', en: 'Chave et al. 2005, wet forest without height', group: 'wet', needs: ['D', 'rho'], sigma: 0.356, dmin: 5, dmax: 156,
    eq: 'AGB = ρ · exp(−1.239 + 1.980 ln D + 0.207 (ln D)² − 0.0281 (ln D)³)', f: t => { const l = log(t.D); return t.rho * exp(-1.239 + 1.980 * l + 0.207 * l * l - 0.0281 * l * l * l); }, src: 'Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.' },
  { id: 'brown97_dry', es: 'Brown 1997, trópico seco', en: 'Brown 1997, dry tropics', group: 'dry', needs: ['D'], sigma: null, dmin: 5, dmax: 40,
    eq: 'AGB = exp(−1.996 + 2.32 ln D)', f: t => exp(-1.996 + 2.32 * log(t.D)), src: 'Brown, S. (1997). <i>Estimating Biomass and Biomass Change of Tropical Forests: a Primer</i>. FAO Forestry Paper 134, ec. 3.2.1.' },
  { id: 'brown97_moist', es: 'Brown 1997, trópico húmedo', en: 'Brown 1997, moist tropics', group: 'moist', needs: ['D'], sigma: null, dmin: 5, dmax: 148,
    eq: 'AGB = exp(−2.134 + 2.530 ln D)', f: t => exp(-2.134 + 2.530 * log(t.D)), src: 'Brown, S. (1997). FAO Forestry Paper 134, ec. 3.2.4.' },
  { id: 'brown97_wet', es: 'Brown 1997, trópico muy húmedo', en: 'Brown 1997, wet tropics', group: 'wet', needs: ['D'], sigma: null, dmin: 4, dmax: 112,
    eq: 'AGB = 21.297 − 6.953·D + 0.740·D²', f: t => 21.297 - 6.953 * t.D + 0.740 * t.D * t.D, src: 'Brown, S. (1997). FAO Forestry Paper 134, ec. 3.2.5.' },
  { id: 'brown97_pine', es: 'Brown 1997, pinos', en: 'Brown 1997, pines', group: 'pine', needs: ['D'], sigma: null, dmin: 2, dmax: 52,
    eq: 'AGB = exp(−1.170 + 2.119 ln D)', f: t => exp(-1.170 + 2.119 * log(t.D)), src: 'Brown, S. (1997). FAO Forestry Paper 134, ec. 3.2.8.' },
  { id: 'segura06_shade', es: 'Segura et al. 2006, árboles de sombra (general)', en: 'Segura et al. 2006, shade trees (general)', group: 'agro', needs: ['D'], sigma: null, dmin: 5, dmax: 44,
    eq: 'log₁₀ AGB = −0.834 + 2.223 log₁₀ D', f: t => pow(10, -0.834 + 2.223 * log10(t.D)), src: 'Segura, M., Kanninen, M. y Suárez, D. (2006). Allometric models for estimating aboveground biomass of shade trees and coffee bushes grown together. <i>Agroforestry Systems</i> 68:143–150. doi:10.1007/s10457-006-9005-x' },
  { id: 'segura06_inga', es: 'Segura et al. 2006, <i>Inga</i>', en: 'Segura et al. 2006, <i>Inga</i>', group: 'agro', needs: ['D'], sigma: null, dmin: 5, dmax: 44,
    eq: 'log₁₀ AGB = −0.936 + 2.348 log₁₀ D', f: t => pow(10, -0.936 + 2.348 * log10(t.D)), src: 'Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150 (modelo de <i>Inga tonduzzi</i>).' },
  { id: 'segura06_cordia', es: 'Segura et al. 2006, <i>Cordia alliodora</i>', en: 'Segura et al. 2006, <i>Cordia alliodora</i>', group: 'agro', needs: ['D'], sigma: null, dmin: 5, dmax: 44,
    eq: 'log₁₀ AGB = −0.755 + 2.072 log₁₀ D', f: t => pow(10, -0.755 + 2.072 * log10(t.D)), src: 'Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150.' },
  { id: 'segura06_juglans', es: 'Segura et al. 2006, <i>Juglans olanchana</i>', en: 'Segura et al. 2006, <i>Juglans olanchana</i>', group: 'agro', needs: ['D'], sigma: null, dmin: 5, dmax: 44,
    eq: 'log₁₀ AGB = −1.417 + 2.755 log₁₀ D', f: t => pow(10, -1.417 + 2.755 * log10(t.D)), src: 'Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150.' },
  { id: 'segura06_coffee', es: 'Segura et al. 2006, cafeto (d₁₅ y altura)', en: 'Segura et al. 2006, coffee bush (d₁₅ and height)', group: 'agro', needs: ['D15', 'H'], sigma: null, dmin: 0.3, dmax: 10,
    eq: 'log₁₀ AGB = −1.113 + 1.578 log₁₀ d₁₅ + 0.581 log₁₀ h', f: t => pow(10, -1.113 + 1.578 * log10(t.D15) + 0.581 * log10(t.H)), src: 'Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150 (d₁₅: diámetro del tallo a 15 cm del suelo).' },
  { id: 'vnoord02_coffee', es: 'van Noordwijk et al. 2002, café podado', en: 'van Noordwijk et al. 2002, pruned coffee', group: 'agro', needs: ['D'], sigma: null, dmin: 0.5, dmax: 15,
    eq: 'AGB = 0.281 · D^2.06', f: t => 0.281 * pow(t.D, 2.06), src: 'van Noordwijk, M. et al. (2002). Carbon stock assessment for a forest-to-coffee conversion landscape in Sumber-Jaya. <i>Science in China C</i> 45 (supl.):75–86. La fuente no indica a qué altura se mide D.' },
  { id: 'vnoord02_musa', es: 'van Noordwijk et al. 2002, plátano (pseudotallo)', en: 'van Noordwijk et al. 2002, banana (pseudostem)', group: 'agro', needs: ['D'], sigma: null, dmin: 5, dmax: 40,
    eq: 'AGB = 0.030 · D^2.13', f: t => 0.030 * pow(t.D, 2.13), src: 'van Noordwijk, M. et al. (2002). <i>Science in China C</i> 45 (supl.):75–86.' },
  { id: 'diaz07_patula', es: 'Díaz-Franco et al. 2007, <i>Pinus patula</i>', en: 'Díaz-Franco et al. 2007, <i>Pinus patula</i>', group: 'pine', needs: ['D'], sigma: null, dmin: 6.7, dmax: 64.1,
    eq: 'AGB = 0.0357 · D^2.6916', f: t => 0.0357 * pow(t.D, 2.6916), src: 'Díaz-Franco, R. et al. (2007). Determinación de ecuaciones alométricas para estimar biomasa y carbono en <i>Pinus patula</i>. <i>Madera y Bosques</i> 13(1):25–34. doi:10.21829/myb.2007.1311233' },
  { id: 'figueroa10_patula', es: 'Figueroa-Navarro et al. 2010, <i>Pinus patula</i> (D²H)', en: 'Figueroa-Navarro et al. 2010, <i>Pinus patula</i> (D²H)', group: 'pine', needs: ['D', 'H'], sigma: null, dmin: 5, dmax: 60,
    eq: 'AGB = 5.338 + 0.018635 · D²H', f: t => 5.338 + 0.018635 * t.D * t.D * t.H, src: 'Figueroa-Navarro, C. M. et al. (2010). Estimación de la biomasa en un bosque bajo manejo de <i>Pinus patula</i>. <i>Rev. Mex. Cienc. For.</i> 1(1):105–112.' },
];
[['aspen', 'Álamo, aliso y sauce', 'Aspen, alder and willow', -2.2094, 2.3867, 0.507441, 70], ['softmaple', 'Arce blando y abedul', 'Soft maple and birch', -1.9123, 2.3651, 0.491685, 66],
 ['mixedhw', 'Latifoliadas mixtas', 'Mixed hardwoods', -2.4800, 2.4835, 0.360458, 56], ['hardmaple', 'Arce duro, encino, nogal y haya', 'Hard maple, oak, hickory and beech', -2.0127, 2.4342, 0.236483, 73],
 ['cedar', 'Cedro y alerce', 'Cedar and larch', -2.0336, 2.2592, 0.294574, 250], ['douglas', 'Pseudotsuga', 'Douglas-fir', -2.2304, 2.4435, 0.218712, 210],
 ['truefir', 'Abeto y tsuga', 'True fir and hemlock', -2.5384, 2.4814, 0.182329, 230], ['pine', 'Pino', 'Pine', -2.5356, 2.4349, 0.253781, 180],
 ['spruce', 'Picea', 'Spruce', -2.0773, 2.3323, 0.250424, 250], ['woodland', 'Junípero, encino y mezquite (zonas secas)', 'Juniper, oak and mesquite (dry woodland)', -0.7152, 1.7029, 0.384331, 78]]
  .forEach(([k, es, en, b0, b1, rmse, dmax]) => B.EQS.push({ id: 'jenkins03_' + k, es: 'Jenkins et al. 2003, ' + es.toLowerCase(), en: 'Jenkins et al. 2003, ' + en.toLowerCase(), group: 'temperate', needs: ['D'], sigma: rmse, dmin: 2.5, dmax,
    eq: `AGB = exp(${b0} + ${b1} ln D)`, f: t => exp(b0 + b1 * log(t.D)), src: 'Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12' }));
B.eq = id => B.EQS.find(e => e.id === id);
/* the user's own equation: five forms with coefficients a, b, c, d */
B.FORMS = {
  power: { es: 'a · D^b', f: (c, t) => c.a * pow(t.D, c.b), needs: ['D'] },
  powerDH: { es: 'a · (D²H)^b', f: (c, t) => c.a * pow(t.D * t.D * t.H, c.b), needs: ['D', 'H'] },
  powerRDH: { es: 'a · (ρD²H)^b', f: (c, t) => c.a * pow(t.rho * t.D * t.D * t.H, c.b), needs: ['D', 'H', 'rho'] },
  lnlin: { es: 'exp(a + b ln D + c ln H + d ln ρ)', f: (c, t) => exp(c.a + c.b * log(t.D) + (c.c ? c.c * log(t.H) : 0) + (c.d ? c.d * log(t.rho) : 0)), needs: ['D'] },
  log10lin: { es: '10^(a + b log₁₀ D + c log₁₀ H)', f: (c, t) => pow(10, c.a + c.b * log10(t.D) + (c.c ? c.c * log10(t.H) : 0)), needs: ['D'] },
};
B.custom = function (o) {
  const F = B.FORMS[o.form];
  const needs = F.needs.slice();
  if (o.form === 'lnlin' && o.c) needs.push('H');
  if (o.form === 'lnlin' && o.d) needs.push('rho');
  if (o.form === 'log10lin' && o.c) needs.push('H');
  return { id: o.id, es: o.name, en: o.name, group: 'user', needs: [...new Set(needs)], sigma: o.sigma > 0 ? o.sigma : null, dmin: o.dmin || 0, dmax: o.dmax || Infinity, eq: F.es, f: t => F.f(o, t), src: o.src || '', user: true };
};

/* ---------------- wood density ----------------
   db: { records: [{family, genus, species, wd}] } (the Global Wood Density Database or the reference table).
   items: [{genus, species, family, stand}] → [{wd, sd, level, n}] following the search of the reference
   implementation: species mean of records; genus = mean of species means; family = mean of genus means (only if
   the family is given); then the mean of the stand, then of the data set. SDs by level from the same source. */
B.SD_LEVEL = { species: 0.07082326, genus: 0.09413391, family: 0.12340172 };
B.splitName = function (name) {
  const p = String(name || '').trim().replace(/\s+/g, ' ').split(' ');
  return { genus: p[0] || '', species: p[1] && !/^(sp|spp|sp\.|spp\.)$/i.test(p[1]) ? p[1] : '' };
};
B.densityIndex = function (records, o) {
  o = o || {};
  const recs = records.filter(r => isFinite(r.wd) && (!o.region || !r.region || String(r.region).toLowerCase() === String(o.region).toLowerCase() || o.region === 'World'));
  const key = r => (r.family || '') + '|' + r.genus + '|' + r.species;
  const sp = new Map();
  recs.forEach(r => { const k = key(r); if (!sp.has(k)) sp.set(k, { family: r.family || '', genus: r.genus, species: r.species, s: 0, n: 0 }); const x = sp.get(k); x.s += r.wd; x.n++; });
  const spMeans = [...sp.values()].map(x => ({ family: x.family, genus: x.genus, species: x.species, wd: x.s / x.n, n: x.n }));
  const gn = new Map();
  spMeans.forEach(x => { const k = x.family + '|' + x.genus; if (!gn.has(k)) gn.set(k, { family: x.family, genus: x.genus, s: 0, n: 0 }); const y = gn.get(k); y.s += x.wd; y.n++; });
  const gnMeans = [...gn.values()].map(y => ({ family: y.family, genus: y.genus, wd: y.s / y.n, n: y.n }));
  const fm = new Map();
  gnMeans.forEach(y => { const k = String(y.family || '').toLowerCase(); if (!fm.has(k)) fm.set(k, { s: 0, n: 0 }); const z = fm.get(k); z.s += y.wd; z.n++; });
  return { spMeans, gnMeans, fmMeans: fm, recs: recs.length, sdTot: Num.sd(recs.map(r => r.wd)) };
};
B.woodDensity = function (items, idx, o) {
  o = o || {};
  const lc = s => String(s || '').toLowerCase();
  const spMap = new Map(), gnMap = new Map(), gnByName = new Map();
  idx.spMeans.forEach(x => { spMap.set(lc(x.genus) + ' ' + lc(x.species) + '|' + lc(x.family), x); if (!spMap.has(lc(x.genus) + ' ' + lc(x.species))) spMap.set(lc(x.genus) + ' ' + lc(x.species), x); });
  idx.gnMeans.forEach(y => { gnMap.set(lc(y.genus) + '|' + lc(y.family), y); if (!gnByName.has(lc(y.genus))) gnByName.set(lc(y.genus), y); });
  const out = items.map(it => {
    const fam = lc(it.family), gen = lc(it.genus), spc = lc(it.species);
    /* the reference matches on family, genus and species together when the family is known */
    /* with the family given, the match is on family, genus and species, as in the reference; if the family is
       written differently from the database (it uses subfamilies such as Fabaceae-mimosoideae), the name decides */
    let s = spc ? ((fam && spMap.get(gen + ' ' + spc + '|' + fam)) || spMap.get(gen + ' ' + spc)) : null;
    if (s) return { wd: s.wd, n: s.n, sd: B.SD_LEVEL.species, level: 'species' };
    const gg = (fam && gnMap.get(gen + '|' + fam)) || gnByName.get(gen);
    if (gg) return { wd: gg.wd, n: gg.n, sd: B.SD_LEVEL.genus, level: 'genus' };
    if (fam && o.useFamily !== false && idx.fmMeans.has(fam)) {
      const f = idx.fmMeans.get(fam);
      return { wd: f.s / f.n, n: f.n, sd: B.SD_LEVEL.family, level: 'family' };
    }
    return null;
  });
  /* the stand and the data set fill what is left */
  if (o.stand) {
    const st = new Map();
    out.forEach((r, i) => { if (!r) return; const k = items[i].stand; if (!st.has(k)) st.set(k, []); st.get(k).push(r.wd); });
    out.forEach((r, i) => { if (r) return; const v = st.get(items[i].stand); if (v && v.length) out[i] = { wd: Num.mean(v), n: v.length, sd: v.length > 1 ? Num.sd(v) : idx.sdTot, level: 'stand' }; });
  }
  const known = out.filter(Boolean).map(r => r.wd);
  out.forEach((r, i) => { if (!r) out[i] = { wd: known.length ? Num.mean(known) : 0.5, n: known.length, sd: known.length > 1 ? Num.sd(known) : idx.sdTot, level: 'dataset' }; });
  out.forEach(r => { if (!(r.sd > 0)) r.sd = idx.sdTot; });
  return out;
};

/* ---------------- biomass of the trees ----------------
   trees: [{D, H, rho, D15, E, eqId}] → kg each, with flags for the range of the equation */
B.treeAGB = function (t, eq) {
  if (!eq) return { agb: NaN, why: 'eq' };
  for (const k of eq.needs) if (!(t[k] > 0) && !(k === 'E' && isFinite(t.E))) return { agb: NaN, why: k };
  const v = eq.f(t);
  const d = eq.needs.includes('D15') ? t.D15 : t.D;
  return { agb: v > 0 ? v : 0, out: d < eq.dmin || d > eq.dmax };
};
/* belowground: ratio (constant or by the IPCC table 4.4 thresholds) or Cairns et al. 1997 eq. 3 (per hectare, Mg) */
B.IPCC_RS = [
  { id: 'trop_rain', es: 'Bosque tropical lluvioso', en: 'Tropical rain forest', r: [[Infinity, 0.37]] },
  { id: 'trop_moist', es: 'Bosque tropical húmedo caducifolio', en: 'Tropical moist deciduous forest', r: [[125, 0.20], [Infinity, 0.24]] },
  { id: 'trop_dry', es: 'Bosque tropical seco', en: 'Tropical dry forest', r: [[20, 0.56], [Infinity, 0.28]] },
  { id: 'trop_shrub', es: 'Matorral tropical', en: 'Tropical shrubland', r: [[Infinity, 0.40]] },
  { id: 'trop_mount', es: 'Sistemas montañosos tropicales', en: 'Tropical mountain systems', r: [[Infinity, 0.27]] },
  { id: 'sub_humid', es: 'Bosque subtropical húmedo', en: 'Subtropical humid forest', r: [[125, 0.20], [Infinity, 0.24]] },
  { id: 'sub_dry', es: 'Bosque subtropical seco', en: 'Subtropical dry forest', r: [[20, 0.56], [Infinity, 0.28]] },
  { id: 'temp_conif', es: 'Templado: coníferas', en: 'Temperate: conifers', r: [[50, 0.40], [150, 0.29, true], [Infinity, 0.20]] },
  { id: 'temp_quercus', es: 'Templado: Quercus (> 70 t/ha)', en: 'Temperate: Quercus (> 70 t/ha)', r: [[Infinity, 0.30]] },
  { id: 'temp_broad', es: 'Templado: otras latifoliadas', en: 'Temperate: other broadleaves', r: [[75, 0.46], [150, 0.23, true], [Infinity, 0.24]] },
  { id: 'boreal', es: 'Boreal', en: 'Boreal', r: [[75, 0.39], [Infinity, 0.24]] },
];
B.rootShoot = function (zoneId, agbHa) {
  const z = B.IPCC_RS.find(x => x.id === zoneId);
  if (!z) return NaN;
  /* «< 50», «50–150» (150 included) and «> 150»: a third element marks an upper limit that belongs to its class */
  for (const [lim, r, incl] of z.r) if (incl ? agbHa <= lim : agbHa < lim) return r;
  return z.r[z.r.length - 1][1];
};
B.cairns = (agbHa, zone) => exp(-1.0587 + 0.8836 * log(agbHa) + (zone === 'temperate' ? 0.2840 : zone === 'boreal' ? 0.1874 : 0));
B.CO2 = 44 / 12;

/* ---------------- necromass, litter and soil ---------------- */
/* line intersect: pieces [{transect, d (cm), cls}] and transects [{transect, L (m)}] → m³/ha and Mg/ha per transect */
B.lineIntersect = function (pieces, transects, dens) {
  return transects.map(tr => {
    const ps = pieces.filter(p => String(p.transect) === String(tr.transect));
    let v = 0, m = 0;
    const byCls = {};
    ps.forEach(p => {
      const vi = PI * PI * p.d * p.d / (8 * tr.L);
      v += vi; const rho = dens[p.cls] != null ? dens[p.cls] : dens.default;
      m += vi * rho;
      byCls[p.cls] = (byCls[p.cls] || 0) + vi;
    });
    return { transect: tr.transect, L: tr.L, pieces: ps.length, V: v, M: m, byCls };
  });
};
/* litter: dry weight (g) collected in a frame of a (m²) → Mg/ha */
B.litter = (gDry, frameM2) => gDry / frameM2 * 0.01;
/* soil organic carbon of a layer: C % × bulk density (g/cm³) × thickness (cm) × (1 − coarse %/100) → Mg C/ha */
B.socLayer = (cPct, bd, top, bottom, coarsePct) => cPct * bd * (bottom - top) * (1 - (coarsePct || 0) / 100);

/* ---------------- Monte Carlo ----------------
   trees: [{plot, ef, D, H, rho, rhoSd, D15, E, eq (object)}]; o: {n, seed, dErr: 'chave2004'|{sd}|{cv}, hCv, rhoSd (override),
   resid: true/false} → per-plot draws of AGB (Mg/ha) and the draws of the stand mean over plots */
function truncNorm(rng, mean, sd, lo, hi) {
  if (!(sd > 0)) return mean;
  const a = Num.pnorm((lo - mean) / sd), b = Num.pnorm((hi - mean) / sd);
  const u = a + rng() * (b - a);
  return mean + sd * Num.qnorm(min(max(u, 1e-16), 1 - 1e-16));
}
B.monteCarlo = function (trees, o) {
  o = Object.assign({ n: 1000, seed: 1, dErr: 'chave2004', hCv: 0, resid: true }, o || {});
  const rng = Num.rng(o.seed);
  const plots = [...new Set(trees.map(t => t.plot))];
  const pIdx = new Map(plots.map((p, i) => [p, i]));
  const draws = plots.map(() => new Float64Array(o.n));
  const len = trees.length, five = Math.round(len * 5 / 100);
  const hMax = max(...trees.map(t => t.H || 0).filter(isFinite)) + 15;
  const order = Array.from({ length: len }, (_, i) => i);
  for (let it = 0; it < o.n; it++) {
    /* the 5 % of trees with a large error in D change every iteration (Chave et al. 2004) */
    let large = null;
    if (o.dErr === 'chave2004') { rng.shuffle(order); large = new Set(order.slice(0, five)); }
    for (let i = 0; i < len; i++) {
      const t = trees[i];
      let D = t.D, H = t.H, rho = t.rho, D15 = t.D15;
      if (o.dErr === 'chave2004' && D > 0) D = truncNorm(rng, D, large.has(i) ? 4.64 : 0.0062 * D + 0.0904, 0.1, 500);
      else if (o.dErr && o.dErr.sd > 0 && D > 0) D = truncNorm(rng, D, o.dErr.sd, 0.1, 500);
      else if (o.dErr && o.dErr.cv > 0 && D > 0) D = truncNorm(rng, D, D * o.dErr.cv / 100, 0.1, 500);
      if (o.dErr && o.dErr.cv > 0 && D15 > 0) D15 = truncNorm(rng, D15, D15 * o.dErr.cv / 100, 0.05, 100);
      if (o.hCv > 0 && H > 0) H = truncNorm(rng, H, H * o.hCv / 100, 1.3, hMax);
      if (rho > 0) rho = truncNorm(rng, rho, o.rhoSd != null ? o.rhoSd : t.rhoSd, 0.08, 1.39);
      let a = t.eq.f({ D, H, rho, D15, E: t.E });
      if (!(a > 0)) continue;
      /* the published equations predict the mean (their intercept already carries exp(σ²/2)), so the residual
         noise has mean one: exp(ε − σ²/2) */
      if (o.resid && t.eq.sigma > 0) a *= exp(rng.normal() * t.eq.sigma - t.eq.sigma * t.eq.sigma / 2);
      draws[pIdx.get(t.plot)][it] += a * t.ef / 1000;
    }
  }
  const q = (arr, p) => Num.quantile(arr, p);
  const per = plots.map((p, k) => ({ plot: p, mean: Num.mean(draws[k]), sd: Num.sd(draws[k]), lo: q(draws[k], 0.025), hi: q(draws[k], 0.975), draws: draws[k] }));
  const stand = new Float64Array(o.n);
  for (let it = 0; it < o.n; it++) { let s = 0; for (let k = 0; k < plots.length; k++) s += draws[k][it]; stand[it] = s / plots.length; }
  return { per, stand, standMean: Num.mean(stand), standSd: Num.sd(stand), standLo: q(stand, 0.025), standHi: q(stand, 0.975), n: o.n };
};
/* combining two independent sources of error of the same mean (IPCC 2006, vol. 1, ch. 3, approach 1) */
B.combineSE = (a, b) => sqrt(a * a + b * b);

/* ---------------- change of stock ----------------
   pairs: [{plot, c1, c2}] (same plots) or two independent lists; years between inventories */
B.change = function (o) {
  const conf = o.conf || 0.95;
  if (o.paired) {
    const d = o.pairs.map(p => p.c2 - p.c1).filter(isFinite), n = d.length, m = Num.mean(d), se = Num.sd(d) / sqrt(n);
    const t = Num.qt(1 - (1 - conf) / 2, n - 1);
    return { paired: true, n, mean: m, se, df: n - 1, t, lo: m - t * se, hi: m + t * se, p: Num.pt2(m / se, n - 1), rate: o.years > 0 ? m / o.years : NaN, rateLo: o.years > 0 ? (m - t * se) / o.years : NaN, rateHi: o.years > 0 ? (m + t * se) / o.years : NaN };
  }
  const a = Num.finite(o.a), b = Num.finite(o.b), va = Num.variance(a) / a.length, vb = Num.variance(b) / b.length;
  const m = Num.mean(b) - Num.mean(a), se = sqrt(va + vb), df = (va + vb) * (va + vb) / (va * va / (a.length - 1) + vb * vb / (b.length - 1));
  const t = Num.qt(1 - (1 - conf) / 2, df);
  return { paired: false, n: a.length + b.length, mean: m, se, df, t, lo: m - t * se, hi: m + t * se, p: Num.pt2(m / se, df), rate: o.years > 0 ? m / o.years : NaN, rateLo: o.years > 0 ? (m - t * se) / o.years : NaN, rateHi: o.years > 0 ? (m + t * se) / o.years : NaN };
};

g.Biomass = B;
return B;
}
if (typeof window !== 'undefined') BiomassCore(window);
else if (typeof globalThis !== 'undefined') BiomassCore(globalThis);
