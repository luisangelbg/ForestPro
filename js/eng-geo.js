/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the engine of Block 8: maps and light geoprocessing.

   · Coordinates: WGS84 latitude and longitude ↔ UTM by the series of Krüger
     (1912) in the third-order form of the transverse Mercator projection
     (accurate to about a millimetre within the zone), and the spherical
     Mercator of web maps.
   · Polygons: area and perimeter on the UTM plane and on the sphere (spherical
     excess by L'Huilier's theorem, radius 6 371 008.8 m), point in polygon,
     centroid.
   · Sampling: a systematic grid (spacing, rotation and offset) and random points
     inside a polygon.
   · Formats: GPX, KML and GeoJSON, written and read.
   · Interpolation: inverse distance weighting; the classical semivariogram of
     Matheron, the spherical, exponential and Gaussian models fitted by weighted
     least squares with weights Nⱼ/hⱼ² (Cressie 1985); ordinary and simple
     kriging with their variance; leave-one-out cross-validation.
   Needs Num and NLS. No DOM. */
function GeoCore(g) {
'use strict';
const Num = g.Num, NLS = g.NLS;
const { PI, sin, cos, tan, atan, atan2, asin, sqrt, abs, exp, log, sinh, cosh, atanh, floor, min, max, pow } = Math;
const G = {};
const RAD = PI / 180;

/* ---------------- UTM (WGS84) ---------------- */
const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, n = f / (2 - f);
const A = a / (1 + n) * (1 + n * n / 4 + n * n * n * n / 64);
const al = [0, n / 2 - 2 * n * n / 3 + 5 * n * n * n / 16, 13 * n * n / 48 - 3 * n * n * n / 5, 61 * n * n * n / 240];
const be = [0, n / 2 - 2 * n * n / 3 + 37 * n * n * n / 96, n * n / 48 + n * n * n / 15, 17 * n * n * n / 480];
const de = [0, 2 * n - 2 * n * n / 3 - 2 * n * n * n, 7 * n * n / 3 - 8 * n * n * n / 5, 56 * n * n * n / 15];
const c2 = 2 * sqrt(n) / (1 + n);
G.utmZone = lon => Math.min(60, floor((lon + 180) / 6) + 1);
G.toUTM = function (lat, lon, zone) {
  zone = zone || G.utmZone(lon);
  const lam0 = ((zone - 1) * 6 - 180 + 3) * RAD, phi = lat * RAD, lam = lon * RAD - lam0;
  const t = sinh(atanh(sin(phi)) - c2 * atanh(c2 * sin(phi)));
  const xi1 = atan2(t, cos(lam)), eta1 = atanh(sin(lam) / sqrt(1 + t * t));
  let xi = xi1, eta = eta1;
  for (let j = 1; j <= 3; j++) { xi += al[j] * sin(2 * j * xi1) * cosh(2 * j * eta1); eta += al[j] * cos(2 * j * xi1) * sinh(2 * j * eta1); }
  return { E: 500000 + k0 * A * eta, N: (lat < 0 ? 10000000 : 0) + k0 * A * xi, zone, south: lat < 0 };
};
G.fromUTM = function (E, N, zone, south) {
  const xi = (N - (south ? 10000000 : 0)) / (k0 * A), eta = (E - 500000) / (k0 * A);
  let xi1 = xi, eta1 = eta;
  for (let j = 1; j <= 3; j++) { xi1 -= be[j] * sin(2 * j * xi) * cosh(2 * j * eta); eta1 -= be[j] * cos(2 * j * xi) * sinh(2 * j * eta); }
  const chi = asin(sin(xi1) / cosh(eta1));
  let phi = chi;
  for (let j = 1; j <= 3; j++) phi += de[j] * sin(2 * j * chi);
  const lam0 = ((zone - 1) * 6 - 180 + 3) * RAD;
  return { lat: phi / RAD, lon: (lam0 + atan2(sinh(eta1), cos(xi1))) / RAD };
};
/* web Mercator: world pixels at zoom z (256-pixel tiles) */
G.mercX = (lon, z) => (lon + 180) / 360 * 256 * pow(2, z);
G.mercY = (lat, z) => { const s = sin(Math.max(-85.0511, Math.min(85.0511, lat)) * RAD); return (0.5 - log((1 + s) / (1 - s)) / (4 * PI)) * 256 * pow(2, z); };
G.mercLon = (x, z) => x / (256 * pow(2, z)) * 360 - 180;
G.mercLat = (y, z) => { const t = PI - 2 * PI * y / (256 * pow(2, z)); return 180 / PI * atan(0.5 * (exp(t) - exp(-t))); };

/* ---------------- polygons ---------------- */
/* ring: [[lon, lat]…] (open or closed). Planar results in the UTM zone of its centroid. */
const open = ring => { const r = ring.slice(); if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop(); return r; };
G.polygonUTM = function (ring, zone) {
  const r = open(ring);
  const z = zone || G.utmZone(Num.mean(r.map(p => p[0])));
  const south = Num.mean(r.map(p => p[1])) < 0;
  return { pts: r.map(p => { const u = G.toUTM(p[1], p[0], z); if (south && !u.south) u.N += 10000000; return [u.E, u.N]; }), zone: z, south };
};
G.planarArea = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
G.planarPerimeter = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += Math.hypot(q[0] - p[0], q[1] - p[1]); } return s; };
/* area on the sphere: fan of triangles from the first vertex, each by L'Huilier's theorem, with sign */
const RS = 6371008.8;
const gc = (p, q) => { const f1 = p[1] * RAD, f2 = q[1] * RAD, dl = (q[0] - p[0]) * RAD; return 2 * asin(sqrt(pow(sin((f2 - f1) / 2), 2) + cos(f1) * cos(f2) * pow(sin(dl / 2), 2))); };
G.sphericalArea = function (ring) {
  const r = open(ring);
  let s = 0;
  for (let i = 1; i + 1 < r.length; i++) {
    const p = r[0], q = r[i], w = r[i + 1];
    const A1 = gc(q, w), B1 = gc(p, w), C1 = gc(p, q), S1 = (A1 + B1 + C1) / 2;
    const E = 4 * atan(sqrt(max(0, tan(S1 / 2) * tan((S1 - A1) / 2) * tan((S1 - B1) / 2) * tan((S1 - C1) / 2))));
    /* the sign of the triangle from the orientation in a local tangent plane */
    const cr = (q[0] - p[0]) * (w[1] - p[1]) - (q[1] - p[1]) * (w[0] - p[0]);
    s += (cr >= 0 ? 1 : -1) * E;
  }
  return abs(s) * RS * RS;
};
G.sphericalPerimeter = ring => { const r = open(ring); let s = 0; for (let i = 0; i < r.length; i++) s += gc(r[i], r[(i + 1) % r.length]) * RS; return s; };
G.polygonStats = function (ring) {
  const u = G.polygonUTM(ring);
  const ar = abs(G.planarArea(u.pts));
  let cx = 0, cy = 0, s6 = 0;
  for (let i = 0; i < u.pts.length; i++) { const p = u.pts[i], q = u.pts[(i + 1) % u.pts.length], c = p[0] * q[1] - q[0] * p[1]; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; s6 += c; }
  const cen = G.fromUTM(cx / (3 * s6), cy / (3 * s6), u.zone, u.south);
  return { areaUTM: ar, areaSphere: G.sphericalArea(ring), perimUTM: G.planarPerimeter(u.pts), perimSphere: G.sphericalPerimeter(ring), zone: u.zone, south: u.south, centroid: cen, n: u.pts.length };
};
/* ray casting, on any plane */
G.inside = function (pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/* systematic grid inside a polygon: spacing s (m), rotation (degrees), offset (fractions 0–1 of s) */
G.grid = function (ring, o) {
  const u = G.polygonUTM(ring);
  const s = o.spacing, th = (o.rotation || 0) * RAD, ox = (o.offsetX != null ? o.offsetX : 0.5) * s, oy = (o.offsetY != null ? o.offsetY : 0.5) * s;
  const xs = u.pts.map(p => p[0]), ys = u.pts.map(p => p[1]);
  const cx = (min(...xs) + max(...xs)) / 2, cy = (min(...ys) + max(...ys)) / 2, R = Math.hypot(max(...xs) - min(...xs), max(...ys) - min(...ys)) / 2 + s;
  const out = [];
  for (let i = -Math.ceil(R / s) - 1; i <= Math.ceil(R / s) + 1; i++) for (let j = -Math.ceil(R / s) - 1; j <= Math.ceil(R / s) + 1; j++) {
    const lx = i * s + ox - s / 2, ly = j * s + oy - s / 2;
    const E = cx + lx * cos(th) - ly * sin(th), N = cy + lx * sin(th) + ly * cos(th);
    if (G.inside([E, N], u.pts)) { const ll = G.fromUTM(E, N, u.zone, u.south); out.push({ id: out.length + 1, E, N, lat: ll.lat, lon: ll.lon }); }
  }
  return { points: out, zone: u.zone, south: u.south, area: abs(G.planarArea(u.pts)), expected: abs(G.planarArea(u.pts)) / (s * s) };
};
G.randomPoints = function (ring, k, seed) {
  const u = G.polygonUTM(ring), rng = Num.rng(seed || 1);
  const xs = u.pts.map(p => p[0]), ys = u.pts.map(p => p[1]), x0 = min(...xs), x1 = max(...xs), y0 = min(...ys), y1 = max(...ys);
  const out = [];
  let guard = 0;
  while (out.length < k && guard++ < k * 1000) {
    const E = x0 + rng() * (x1 - x0), N = y0 + rng() * (y1 - y0);
    if (G.inside([E, N], u.pts)) { const ll = G.fromUTM(E, N, u.zone, u.south); out.push({ id: out.length + 1, E, N, lat: ll.lat, lon: ll.lon }); }
  }
  return { points: out, zone: u.zone, south: u.south };
};

/* ---------------- formats ---------------- */
const xesc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const c6 = v => (+v).toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
/* points: [{name, lat, lon, desc, props}]; polygons: [{name, ring: [[lon, lat]…], props}] */
G.toGPX = function (points, polygons, name) {
  let s = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="ForestPro" xmlns="http://www.topografix.com/GPX/1/1">\n';
  s += `<metadata><name>${xesc(name || 'ForestPro')}</name></metadata>\n`;
  points.forEach(p => { s += `<wpt lat="${c6(p.lat)}" lon="${c6(p.lon)}"><name>${xesc(p.name)}</name>${p.desc ? `<desc>${xesc(p.desc)}</desc>` : ''}</wpt>\n`; });
  (polygons || []).forEach(pg => { s += `<trk><name>${xesc(pg.name)}</name><trkseg>` + open(pg.ring).concat([open(pg.ring)[0]]).map(q => `<trkpt lat="${c6(q[1])}" lon="${c6(q[0])}"/>`).join('') + `</trkseg></trk>\n`; });
  return s + '</gpx>\n';
};
G.toKML = function (points, polygons, name) {
  let s = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n';
  s += `<name>${xesc(name || 'ForestPro')}</name>\n`;
  points.forEach(p => { s += `<Placemark><name>${xesc(p.name)}</name>${p.desc ? `<description>${xesc(p.desc)}</description>` : ''}<Point><coordinates>${c6(p.lon)},${c6(p.lat)},0</coordinates></Point></Placemark>\n`; });
  (polygons || []).forEach(pg => { const r = open(pg.ring); s += `<Placemark><name>${xesc(pg.name)}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>` + r.concat([r[0]]).map(q => `${c6(q[0])},${c6(q[1])},0`).join(' ') + `</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>\n`; });
  return s + '</Document></kml>\n';
};
G.toGeoJSON = function (points, polygons) {
  const feats = points.map(p => ({ type: 'Feature', properties: Object.assign({ name: p.name }, p.props || {}), geometry: { type: 'Point', coordinates: [+c6(p.lon), +c6(p.lat)] } }))
    .concat((polygons || []).map(pg => { const r = open(pg.ring); return { type: 'Feature', properties: Object.assign({ name: pg.name }, pg.props || {}), geometry: { type: 'Polygon', coordinates: [r.concat([r[0]]).map(q => [+c6(q[0]), +c6(q[1])])] } }; }));
  return JSON.stringify({ type: 'FeatureCollection', features: feats }, null, 1);
};
/* reading: returns {points: [{name, lat, lon}], polygons: [{name, ring}]} */
G.parse = function (text, fileName) {
  const t = String(text), ext = String(fileName || '').toLowerCase().split('.').pop();
  const out = { points: [], polygons: [] };
  const num = v => parseFloat(v);
  if (ext === 'geojson' || ext === 'json' || /^\s*\{/.test(t)) {
    const j = JSON.parse(t);
    const feats = j.type === 'FeatureCollection' ? j.features : j.type === 'Feature' ? [j] : [{ geometry: j, properties: {} }];
    feats.forEach((fe, i) => {
      const gm = fe.geometry || {}, nm = (fe.properties && (fe.properties.name || fe.properties.nombre)) || String(i + 1);
      if (gm.type === 'Point') out.points.push({ name: nm, lon: gm.coordinates[0], lat: gm.coordinates[1], props: fe.properties || {} });
      else if (gm.type === 'MultiPoint') gm.coordinates.forEach((c, k) => out.points.push({ name: nm + '-' + (k + 1), lon: c[0], lat: c[1] }));
      else if (gm.type === 'Polygon') out.polygons.push({ name: nm, ring: gm.coordinates[0].map(c => [c[0], c[1]]) });
      else if (gm.type === 'MultiPolygon') gm.coordinates.forEach((pg, k) => out.polygons.push({ name: nm + '-' + (k + 1), ring: pg[0].map(c => [c[0], c[1]]) }));
    });
    return out;
  }
  const tag = (s, nm) => { const m = new RegExp('<(?:\\w+:)?' + nm + '[^>]*>([\\s\\S]*?)</(?:\\w+:)?' + nm + '>', 'i').exec(s); return m ? m[1].trim() : ''; };
  const unesc = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  if (/<gpx/i.test(t)) {
    const re = /<wpt\s+([^>]*?)(\/>|>([\s\S]*?)<\/wpt>)/gi;
    let m, k = 0;
    while ((m = re.exec(t))) { const at = m[1]; const la = /lat="([^"]+)"/.exec(at), lo = /lon="([^"]+)"/.exec(at); out.points.push({ name: unesc(tag(m[3] || '', 'name')) || String(++k), lat: num(la[1]), lon: num(lo[1]) }); }
    const tr = /<trk>([\s\S]*?)<\/trk>/gi;
    while ((m = tr.exec(t))) { const pts = []; const rp = /<trkpt\s+[^>]*?lat="([^"]+)"[^>]*?lon="([^"]+)"/gi; let q; while ((q = rp.exec(m[1]))) pts.push([num(q[2]), num(q[1])]); if (pts.length > 2) out.polygons.push({ name: unesc(tag(m[1], 'name')) || 'track', ring: pts }); }
    return out;
  }
  if (/<kml/i.test(t)) {
    const re = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
    let m;
    while ((m = re.exec(t))) {
      const body = m[1], nm = unesc(tag(body, 'name'));
      const coords = s => s.trim().split(/\s+/).map(c => c.split(',').map(num)).filter(c => c.length >= 2 && isFinite(c[0]));
      if (/<Polygon/i.test(body)) out.polygons.push({ name: nm, ring: coords(tag(tag(body, 'outerBoundaryIs'), 'coordinates')).map(c => [c[0], c[1]]) });
      else if (/<Point/i.test(body)) { const c = coords(tag(body, 'coordinates'))[0]; if (c) out.points.push({ name: nm, lon: c[0], lat: c[1] }); }
    }
    return out;
  }
  throw new Error('format');
};

/* ---------------- interpolation ----------------
   pts: [{x, y, z}] in metres (UTM); targets: [{x, y}] */
G.idw = function (pts, targets, o) {
  o = Object.assign({ power: 2, nmax: Infinity }, o || {});
  return targets.map(t => {
    const d = pts.map(p => ({ d: Math.hypot(p.x - t.x, p.y - t.y), z: p.z }));
    const zero = d.find(q => q.d === 0);
    if (zero) return zero.z;
    const near = isFinite(o.nmax) ? d.sort((a1, b1) => a1.d - b1.d).slice(0, o.nmax) : d;
    let sw = 0, sz = 0;
    near.forEach(q => { const w = 1 / pow(q.d, o.power); sw += w; sz += w * q.z; });
    return sz / sw;
  });
};
/* the classical semivariogram in lags of width w up to the cutoff; distance of each lag = mean distance of its pairs */
G.variogram = function (pts, o) {
  const nb = Math.ceil(o.cutoff / o.width - 1e-12);
  const bins = Array.from({ length: nb }, () => ({ n: 0, d: 0, g: 0 }));
  for (let i = 0; i < pts.length; i++) for (let j = 0; j < i; j++) {
    const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
    if (d > o.cutoff) continue;
    let k = Math.ceil(d / o.width) - 1; if (k < 0) k = 0; if (k >= nb) k = nb - 1;
    bins[k].n++; bins[k].d += d; bins[k].g += (pts[i].z - pts[j].z) ** 2;
  }
  return bins.filter(b => b.n > 0).map(b => ({ np: b.n, dist: b.d / b.n, gamma: b.g / (2 * b.n) }));
};
G.VMODELS = {
  sph: { es: 'Esférico', en: 'Spherical', f: (h, c0, c1, r) => h <= 0 ? 0 : c0 + (h < r ? c1 * (1.5 * h / r - 0.5 * pow(h / r, 3)) : c1) },
  exp: { es: 'Exponencial', en: 'Exponential', f: (h, c0, c1, r) => h <= 0 ? 0 : c0 + c1 * (1 - exp(-h / r)) },
  gau: { es: 'Gaussiano', en: 'Gaussian', f: (h, c0, c1, r) => h <= 0 ? 0 : c0 + c1 * (1 - exp(-(h / r) * (h / r))) },
};
/* weighted least squares with weights Nⱼ/hⱼ²; nugget and partial sill kept ≥ 0 */
G.fitVariogram = function (ev, model, start) {
  const m = G.VMODELS[model];
  const w = ev.map(e => e.np / (e.dist * e.dist));
  const gm = max(...ev.map(e => e.gamma)), dm = max(...ev.map(e => e.dist));
  const starts = start ? [start] : [[gm * 0.1, gm * 0.8, dm / 3], [0, gm, dm / 2], [gm * 0.3, gm * 0.6, dm / 5], [gm * 0.05, gm * 0.9, dm]];
  const fit = NLS.fit({ f: (b, e) => m.f(e.dist, b[0], b[1], b[2]), x: ev, y: ev.map(e => e.gamma), w, start: starts, names: ['c0', 'c1', 'a'], lower: [0, 1e-12, dm * 1e-3], upper: [gm * 10, gm * 10, dm * 20] });
  if (!fit.ok) return { ok: false };
  const wsse = ev.reduce((s, e, i) => s + w[i] * (e.gamma - m.f(e.dist, fit.coef[0], fit.coef[1], fit.coef[2])) ** 2, 0);
  return { ok: true, model, nugget: fit.coef[0], psill: fit.coef[1], range: fit.coef[2], wsse, gamma: h => m.f(h, fit.coef[0], fit.coef[1], fit.coef[2]) };
};
/* kriging with a fitted (or given) model vm = {model, nugget, psill, range}; type 'ok' or 'sk' (with mean) */
G.krige = function (pts, targets, vm, o) {
  o = o || {};
  const m = G.VMODELS[vm.model], gam = h => m.f(h, vm.nugget, vm.psill, vm.range), sill = vm.nugget + vm.psill;
  const nP = pts.length;
  const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  if (o.type === 'sk') {
    const mu = o.mean != null ? o.mean : Num.mean(pts.map(p => p.z));
    const C = pts.map(p => pts.map(q => sill - gam(dist(p, q))));
    const Ci = Num.inv(C);
    return targets.map(t => {
      const c = pts.map(p => sill - gam(dist(p, t)));
      const l = Num.matvec(Ci, c);
      let pred = mu, v = sill;
      for (let i = 0; i < nP; i++) { pred += l[i] * (pts[i].z - mu); v -= l[i] * c[i]; }
      return { z: pred, v };
    });
  }
  /* ordinary: [Γ 1; 1ᵀ 0][λ; μ] = [γ₀; 1] */
  const K = Num.zeros(nP + 1, nP + 1);
  for (let i = 0; i < nP; i++) { for (let j = 0; j < nP; j++) K[i][j] = gam(dist(pts[i], pts[j])); K[i][nP] = 1; K[nP][i] = 1; }
  const Ki = Num.inv(K);
  return targets.map(t => {
    const r = pts.map(p => gam(dist(p, t))).concat([1]);
    const l = Num.matvec(Ki, r);
    let pred = 0, v = l[nP];
    for (let i = 0; i < nP; i++) { pred += l[i] * pts[i].z; v += l[i] * r[i]; }
    return { z: pred, v };
  });
};
/* leave-one-out cross-validation of a predictor (pts, target) → value */
G.crossValidate = function (pts, predictOne) {
  const res = pts.map((p, i) => { const rest = pts.filter((_, j) => j !== i); const z = predictOne(rest, p); return { obs: p.z, pred: z, res: p.z - z }; });
  const me = Num.mean(res.map(r => r.res)), rmse = sqrt(Num.mean(res.map(r => r.res * r.res)));
  return { res, me, rmse };
};

g.Geo = G;
return G;
}
if (typeof window !== 'undefined') GeoCore(window);
else if (typeof globalThis !== 'undefined') GeoCore(globalThis);
