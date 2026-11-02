/* ForestPro — manual de usuario: dibuja la portada (es/00a-portada.html).
   Una sola ilustración vectorial original, hecha con los datos de ejemplo y los motores de la propia app (todos
   simulados: data/LEEME.md), para que la portada no sea un adorno sino una figura correcta:
     – al centro, el perfil de la parcela P01 del cafetal bajo sombra (policultivo tradicional, 1 000 m²): cada árbol de
       sombra en su posición x, con su altura, su diámetro de copa y su DAP medidos (cafetal_arboles), los de atrás más
       claros, y debajo la hilera de cafetos con las alturas de su submuestra (cafetal_cafetos); a la izquierda, la
       escala de alturas;
     – debajo del perfil, la misma parcela en planta: el círculo de 17.84 m de radio con la copa de cada árbol en su
       lugar (x, y), con el color de su especie;
     – la franja de los diez colores de los bloques, los mismos del manual;
     – al pie, tres viñetas: la curva altura–diámetro de Chapman–Richards ajustada por Dendro.fitHD a los árboles con
       altura de la parcela de pino (pino_arboles), la parcela mapeada de 50 × 50 m del bosque mesófilo con cada tallo
       (mesofilo_mapeada; dosel y sotobosque) y la pirámide del carbono del cafetal en Mg C/ha: árboles de sombra
       (Chave et al. 2014 con altura, Biomass.treeAGB, densidad por especie o género de la tabla de la app), raíces
       (Cairns et al. 1997, Biomass.cairns), hojarasca (Biomass.litter) y suelo de 0 a 30 cm (Biomass.socLayer), con
       la fracción de carbono 0.47.
   Fondo blanco, como las demás portadas de la suite (es una regla de la suite), con el verde bosque, la corteza y el
   oro y negro de la marca. Sin azar: todo sale de los datos.
   Uso, desde la carpeta de la app:   node manual/herramientas/genera-portada.js
   La edición inglesa (en/00a-portada.html: el mismo dibujo con los textos en inglés):  … genera-portada.js --idioma en */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const APP = path.resolve(__dirname, '..', '..');

/* the app's engines, loaded as tests/run_node.js loads them */
const box = { console, Math, Date, JSON, TextEncoder, TextDecoder, Uint8Array, Uint32Array, Int32Array, Float64Array, Array, Object, Number, String, Map, Set, Error, isFinite, isNaN };
box.window = box; box.globalThis = box; box.T = es => es;
vm.createContext(box);
['num.js', 'nls.js', 'datasets.js', 'eng-dendro.js', 'eng-biomass.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(APP, 'js', f), 'utf8'), box, { filename: f }));
const { FPData, Dendro, Biomass } = box;
const B = Biomass || box.Bio || box.BiomassCore;

const EN = process.argv.includes('--idioma') && process.argv[process.argv.indexOf('--idioma') + 1] === 'en';
const L = (es, en) => (EN ? en : es);
const f1 = v => (Math.round(v * 10) / 10).toString();
const nf = (v, d) => v.toFixed(d == null ? 1 : d);

/* ---------------- the palette: the app's identity on white paper ---------------- */
const P = {
  tinta: '#14200f', gris: '#5e6858', oro: '#8f6a1c', oroLin: '#b98d2c', bosque: '#1b5e20', musgo: '#4a7a26',
  corteza: '#5d4037', tronco: '#6d4c2f', suelo: '#8a6a4a', cafe: '#3f7a35', cereza: '#b0353f',
};
/* the colours of the app's charts (js/plot.js, Plot.CAT), one per species of shade tree */
const CAT = ['#2E7D32', '#5E8F2A', '#9DB86A', '#1B5E20', '#7CB342', '#4E7D3A', '#A3B34A', '#3B6A1C', '#6FA35A', '#2F5E2A'];
/* (en el perfil y en la planta, una gama de verdes de la app, de bosque a musgo: un tono por especie) */
const BLOQUES = ['#1b5e20', '#5d4037', '#4a7a26', '#187a68', '#a2660f', '#6f4f9e', '#b0353f', '#2f67a6', '#8f4c1f', '#94701c'];

/* ---------------- data ---------------- */
const arboles = FPData.rows('cafetal_arboles');
const parcelas = FPData.rows('cafetal_parcelas');
const P01 = arboles.filter(t => t.parcela === 'P01' && t.estado === 'vivo');
const P01p = parcelas.find(p => p.parcela === 'P01');
const cafetos = FPData.rows('cafetal_cafetos').filter(c => c.parcela === 'P01');
const especies = [...new Set(arboles.map(t => t.especie))].sort((a, b) => arboles.filter(t => t.especie === b).length - arboles.filter(t => t.especie === a).length);
const colorDe = sp => CAT[especies.indexOf(sp) % CAT.length];

/* ---------------- carbon of the coffee farm, with the app's engines ---------------- */
const dens = FPData.rows('densidades_madera');
const rhoDe = sp => { const d = dens.find(r => r.especie === sp) || dens.find(r => r.genero === String(sp).split(' ')[0]); return d ? d.densidad : NaN; };
const rhoMedia = (() => { const v = arboles.map(t => rhoDe(t.especie)).filter(isFinite); return v.reduce((s, x) => s + x, 0) / v.length; })();
const eq = B.eq('chave14_h');
const agbHa = parcelas.map(p => {
  const ts = arboles.filter(t => t.parcela === p.parcela && t.estado === 'vivo');
  const kg = ts.reduce((s, t) => { const r = B.treeAGB({ D: t.dap, H: t.altura, rho: isFinite(rhoDe(t.especie)) ? rhoDe(t.especie) : rhoMedia }, eq); return s + (isFinite(r.agb) ? r.agb : 0); }, 0);
  return kg / 1000 * (10000 / p.area_m2);
});
const media = a => a.reduce((s, x) => s + x, 0) / a.length;
const AGB = media(agbHa), BGB = media(agbHa.map(a => B.cairns(a, 'tropical')));
const LIT = media(parcelas.map(p => B.litter(p.hojarasca_g, p.marco_m2)));
const suelo = FPData.rows('cafetal_suelo');
const SOC = media(parcelas.map(p => suelo.filter(s => s.parcela === p.parcela).reduce((s, c) => s + B.socLayer(c.co_pct, c.dap_g_cm3, c.prof_sup, c.prof_inf, c.pedregosidad_pct), 0)));
const CF = 0.47;
const pools = [
  [L('árboles de sombra', 'shade trees'), AGB * CF, P.bosque],
  [L('raíces', 'roots'), BGB * CF, P.corteza],
  [L('hojarasca', 'litter'), LIT * CF, '#a2660f'],
  [L('suelo 0–30 cm', 'soil 0–30 cm'), SOC, '#7a5a3a'],
];

/* ---------------- the height–diameter curve of the pine plot ---------------- */
const pinos = FPData.rows('pino_arboles').filter(r => r.dap > 0);
const hd = Dendro.fitHD(pinos.filter(r => r.altura > 1.3).map(r => ({ d: r.dap, h: r.altura })), ['chapman'])[0];

/* ---------------- the drawing ---------------- */
const W = 850, H = 1100;
let s = `<defs>
  <linearGradient id="oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6ae55"/><stop offset="0.5" stop-color="#9c7320"/><stop offset="1" stop-color="#cfa548"/></linearGradient>
  <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef4ea"/></linearGradient>
  <linearGradient id="tierra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7b56"/><stop offset="1" stop-color="#c9b293" stop-opacity="0.2"/></linearGradient>
  <radialGradient id="planta" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f4f8f0"/><stop offset="1" stop-color="#e3ecdc"/></radialGradient>
  <clipPath id="perfil"><rect x="120" y="356" width="610" height="352"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="url(#oro)" stroke-width="2.2"/>
<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${P.oroLin}" stroke-width="0.7" opacity="0.7"/>`;
/* corner ornaments: a small conifer in each corner, in gold */
[[62, 66], [W - 62, 66], [62, H - 58], [W - 62, H - 58]].forEach(([x, y]) => {
  s += `<path d="M${x} ${y - 16}l8 13h-4l6 9h-20l6-9h-4z" fill="${P.oroLin}" stroke="${P.oroLin}" stroke-width="1" stroke-linejoin="round"/><line x1="${x}" y1="${y + 6}" x2="${x}" y2="${y + 11}" stroke="${P.oroLin}" stroke-width="1.2"/>`;
});

/* ---------------- title ---------------- */
s += `<text x="${W / 2}" y="104" text-anchor="middle" font-family="Jost" font-weight="500" font-size="12.5" letter-spacing="5.5" fill="${P.oro}">${L('LABG SUITE · CIENCIA ABIERTA EN EL NAVEGADOR', 'LABG SUITE · OPEN SCIENCE IN THE BROWSER')}</text>
<text x="${W / 2}" y="194" text-anchor="middle" font-family="Cormorant" font-weight="600" font-size="92" fill="${P.tinta}">Forest<tspan fill="${P.bosque}">Pro</tspan></text>
<line x1="${W / 2 - 70}" y1="220" x2="${W / 2 + 70}" y2="220" stroke="${P.oroLin}" stroke-width="1.4"/>`;
const t1 = L('Manual de usuario', 'User’s Manual'), t2 = L('User’s Manual', 'Manual de usuario');
const l1 = L('Del árbol medido a la tonelada de carbono', 'From the measured tree to the tonne of carbon');
const l2 = L('From the measured tree to the tonne of carbon', 'Del árbol medido a la tonelada de carbono');
s += `
<text x="${W / 2}" y="258" text-anchor="middle" font-family="Cormorant" font-weight="600" font-size="38" fill="${P.tinta}">${t1}</text>
<text x="${W / 2}" y="287" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="25" fill="${P.oro}">${t2}</text>
<text x="${W / 2}" y="316" text-anchor="middle" font-family="Jost" font-weight="400" font-size="15" fill="${P.tinta}" opacity="0.9">${l1}</text>
<text x="${W / 2}" y="335" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="14" fill="${P.gris}">${l2}</text>`;

/* ---------------- the profile of plot P01 ---------------- */
const R = P01p.radio_m, X0 = W / 2, SUELO = 694;
/* one scale for heights and distances, as large as the tallest tree allows */
const ESC = Math.min(14, 300 / Math.max(...P01.map(t => t.altura)));
const px = x => X0 + x * ESC, py = h => SUELO - h * ESC;
s += `<rect x="${f1(px(-R) - 8)}" y="356" width="${f1(2 * R * ESC + 16)}" height="${SUELO - 356}" fill="url(#cielo)"/>`;
/* height scale on the left */
s += `<g font-family="Jost" font-size="8.5" fill="${P.gris}">`;
for (let h = 0; h <= 25; h += 5) s += `<line x1="${f1(px(-R) - 24)}" y1="${f1(py(h))}" x2="${f1(px(-R) - 18)}" y2="${f1(py(h))}" stroke="${P.gris}" stroke-width="0.8"/><text x="${f1(px(-R) - 28)}" y="${f1(py(h) + 3)}" text-anchor="end">${h}</text>`;
s += `<line x1="${f1(px(-R) - 18)}" y1="${f1(py(0))}" x2="${f1(px(-R) - 18)}" y2="${f1(py(25))}" stroke="${P.gris}" stroke-width="0.8"/><text x="${f1(px(-R) - 28)}" y="${f1(py(25) - 12)}" text-anchor="end">m</text></g>`;
/* the trees, from the back (largest y) to the front; the back ones paler */
const yMax = Math.max(...P01.map(t => t.y)), yMin = Math.min(...P01.map(t => t.y));
const orden = P01.slice().sort((a, b) => b.y - a.y);
let gArb = '';
orden.forEach(t => {
  const fondo = (t.y - yMin) / (yMax - yMin);            /* 1 = at the back */
  const op = (0.95 - 0.5 * fondo).toFixed(2);
  const x = px(t.x), top = py(t.altura), cw = t.copa * ESC, col = colorDe(t.especie);
  const tw = Math.max(1.6, t.dap / 100 * ESC * 1.6);       /* trunk drawn 1.6 × its true width, so the thin ones show */
  if (/^Musa/.test(t.especie)) {
    /* a banana plant: pseudostem and a fan of leaves */
    gArb += `<g opacity="${op}"><rect x="${f1(x - tw / 2)}" y="${f1(top + 10)}" width="${f1(tw)}" height="${f1(SUELO - top - 10)}" fill="#7d8f45"/>`;
    [-60, -30, 0, 30, 60].forEach(a => { gArb += `<ellipse cx="${f1(x)}" cy="${f1(top + 12)}" rx="${f1(cw * 0.16)}" ry="${f1(cw * 0.5)}" transform="rotate(${a} ${f1(x)} ${f1(top + 12)}) translate(0 ${f1(-cw * 0.42)})" fill="${col}"/>`; });
    gArb += `</g>`;
    return;
  }
  const crownH = Math.min(t.altura * 0.5, Math.max(t.copa * 0.75, 2.5)) * ESC;
  gArb += `<g opacity="${op}"><rect x="${f1(x - tw / 2)}" y="${f1(top + crownH * 0.5)}" width="${f1(tw)}" height="${f1(SUELO - top - crownH * 0.5)}" fill="${P.tronco}"/>` +
    `<ellipse cx="${f1(x)}" cy="${f1(top + crownH / 2)}" rx="${f1(cw / 2)}" ry="${f1(crownH / 2)}" fill="${col}"/>` +
    `<ellipse cx="${f1(x - cw * 0.12)}" cy="${f1(top + crownH * 0.38)}" rx="${f1(cw * 0.26)}" ry="${f1(crownH * 0.2)}" fill="#ffffff" opacity="0.16"/></g>`;
});
/* the coffee bushes: a row every 2 m, with the heights of the plot's subsample in turn */
let gCafe = '';
const hc = cafetos.map(c => c.altura);
for (let x = -R + 1, k = 0; x <= R - 1; x += 2, k++) {
  const h = hc[k % hc.length] * ESC, cx = px(x);
  gCafe += `<ellipse cx="${f1(cx)}" cy="${f1(SUELO - h / 2)}" rx="${f1(Math.max(h * 0.32, 5))}" ry="${f1(h / 2)}" fill="${P.cafe}"/>`;
  if (k % 2 === 0) gCafe += `<circle cx="${f1(cx - 2)}" cy="${f1(SUELO - h * 0.45)}" r="1.4" fill="${P.cereza}"/><circle cx="${f1(cx + 2.5)}" cy="${f1(SUELO - h * 0.32)}" r="1.4" fill="${P.cereza}"/>`;
}
s += `<g clip-path="url(#perfil)">${gArb}${gCafe}</g>`;
s += `<rect x="${f1(px(-R) - 8)}" y="${SUELO}" width="${f1(2 * R * ESC + 16)}" height="14" fill="url(#tierra)"/>
<line x1="${f1(px(-R) - 8)}" y1="${SUELO}" x2="${f1(px(R) + 8)}" y2="${SUELO}" stroke="${P.corteza}" stroke-width="1.4"/>`;
/* the plot limits on the ground */
s += `<g stroke="${P.oroLin}" stroke-width="1" stroke-dasharray="3 3"><line x1="${f1(px(-R))}" y1="${SUELO}" x2="${f1(px(-R))}" y2="${SUELO - 300}"/><line x1="${f1(px(R))}" y1="${SUELO}" x2="${f1(px(R))}" y2="${SUELO - 300}"/></g>`;
s += `<text x="${f1(px(R) + 14)}" y="${py(17)}" font-family="Jost" font-size="9" fill="${P.oro}">r = ${R} m</text>`;
s += `<text x="${f1(px(R) + 14)}" y="${py(15.8)}" font-family="Jost" font-size="8.5" fill="${P.gris}">${L('perfil', 'profile')}</text>`;

/* ---------------- the same plot from above ---------------- */
{
  const cy = 790, esc = 3.6, cx = X0;
  let g = `<circle cx="${cx}" cy="${cy}" r="${f1(R * esc)}" fill="url(#planta)" stroke="${P.oroLin}" stroke-width="1.1" stroke-dasharray="3 3"/>`;
  P01.slice().sort((a, b) => a.altura - b.altura).forEach(t => {
    g += `<circle cx="${f1(cx + t.x * esc)}" cy="${f1(cy - t.y * esc)}" r="${f1(t.copa / 2 * esc)}" fill="${colorDe(t.especie)}" fill-opacity="0.55" stroke="${colorDe(t.especie)}" stroke-width="0.6"/>`;
    g += `<circle cx="${f1(cx + t.x * esc)}" cy="${f1(cy - t.y * esc)}" r="1" fill="${P.tinta}"/>`;
  });
  g += `<circle cx="${cx}" cy="${cy}" r="1.8" fill="${P.oro}"/>`;
  s += g;
  /* left: what it is; right: the species of the plot */
  s += `<g font-family="Jost" fill="${P.tinta}">
<text x="${cx - 92}" y="${cy - 24}" text-anchor="end" font-family="Cormorant" font-style="italic" font-size="17">${L('Cafetal bajo sombra', 'Shaded coffee farm')}</text>
<text x="${cx - 92}" y="${cy - 8}" text-anchor="end" font-size="10" fill="${P.oro}">${L('parcela', 'plot')} P01 · ${P01p.area_m2.toLocaleString('en-US')} m² · ${P01.length} ${L('árboles', 'trees')}</text>
<text x="${cx - 92}" y="${cy + 6}" text-anchor="end" font-size="8.5" fill="${P.gris}">${L('sombra', 'shade')} ${nf(P01p.sombra_pct)} % · ${P01p.densidad_cafe.toLocaleString('en-US')} ${L('cafetos/ha', 'coffee bushes/ha')}</text>
<text x="${cx - 92}" y="${cy + 19}" text-anchor="end" font-size="8.5" fill="${P.gris}">${L('ejemplo simulado', 'simulated example')}</text></g>`;
  const sp = [...new Set(P01.map(t => t.especie))].sort((a, b) => especies.indexOf(a) - especies.indexOf(b)).slice(0, 6);
  s += `<g font-family="Cormorant" font-style="italic" font-size="11.5" fill="${P.tinta}">` + sp.map((e, i) => `<circle cx="${cx + 98}" cy="${cy - 34 + i * 14}" r="4" fill="${colorDe(e)}"/><text x="${cx + 108}" y="${cy - 30.5 + i * 14}">${e}</text>`).join('') + `</g>`;
}

/* ---------------- the strip of the ten block colours ---------------- */
BLOQUES.forEach((c, i) => { s += `<rect x="${f1(150 + i * 55.5)}" y="874" width="52" height="6" fill="${c}"/>`; });

/* ---------------- three vignettes ---------------- */
const vin = (x, titulo, g) => `<g transform="translate(${x} 892)"><rect width="176" height="104" rx="6" fill="#f7faf4" stroke="${P.oroLin}" stroke-opacity="0.7" stroke-width="0.8"/>${g}<text x="88" y="96" text-anchor="middle" font-family="Jost" font-weight="500" font-size="8.5" letter-spacing="2" fill="${P.oro}">${titulo}</text></g>`;
/* 1 · height–diameter, Chapman–Richards on the pine plot */
{
  const dMax = Math.ceil(Math.max(...pinos.map(r => r.dap)) / 10) * 10, hMax = Math.ceil(Math.max(...pinos.filter(r => r.altura > 0).map(r => r.altura)) / 5) * 5;
  const gx = d => 18 + d / dMax * 146, gy = h => 78 - h / hMax * 64;
  let g = `<line x1="18" y1="78" x2="164" y2="78" stroke="${P.tinta}" stroke-opacity="0.6" stroke-width="0.8"/><line x1="18" y1="78" x2="18" y2="12" stroke="${P.tinta}" stroke-opacity="0.6" stroke-width="0.8"/>`;
  pinos.filter(r => r.altura > 0).forEach(r => { g += `<circle cx="${f1(gx(r.dap))}" cy="${f1(gy(r.altura))}" r="1.6" fill="${P.musgo}" fill-opacity="0.75"/>`; });
  if (hd && hd.ok) {
    let d = '';
    for (let k = 0; k <= 60; k++) { const dd = 1 + k / 60 * (dMax - 1); d += (k ? 'L' : 'M') + f1(gx(dd)) + ' ' + f1(gy(hd.predict(dd))); }
    g += `<path d="${d}" fill="none" stroke="${P.oro}" stroke-width="1.8"/>`;
  }
  g += `<text x="164" y="74" text-anchor="end" font-family="Jost" font-size="6.5" fill="${P.gris}">${L('DAP', 'DBH')}</text><text x="22" y="17" font-family="Jost" font-size="6.5" fill="${P.gris}">H</text>`;
  s += vin(130, L('ALTURA–DIÁMETRO', 'HEIGHT–DIAMETER'), g);
}
/* 2 · the mapped plot of the cloud forest, 50 × 50 m */
{
  const m = FPData.rows('mesofilo_mapeada'), e = 64 / 50, x0 = 56, y0 = 12;
  let g = `<rect x="${x0}" y="${y0}" width="64" height="64" fill="#ffffff" stroke="${P.tinta}" stroke-opacity="0.35" stroke-width="0.7"/>`;
  m.forEach(t => { const dosel = t.dosel === 'dosel'; g += `<circle cx="${f1(x0 + t.x * e)}" cy="${f1(y0 + 64 - t.y * e)}" r="${f1(Math.max(0.8, Math.sqrt(t.dap) * 0.28))}" fill="${dosel ? P.bosque : '#7CB342'}" fill-opacity="${dosel ? 0.85 : 0.7}"/>`; });
  g += `<text x="${x0 + 70}" y="${y0 + 8}" font-family="Jost" font-size="6.5" fill="${P.gris}">50 × 50 m</text><text x="${x0 + 70}" y="${y0 + 18}" font-family="Jost" font-size="6.5" fill="${P.gris}">${m.length} ${L('tallos', 'stems')}</text>`;
  s += vin(337, L('EL PATRÓN ESPACIAL', 'SPATIAL PATTERN'), g);
}
/* 3 · the carbon pyramid of the coffee farm (Mg C/ha) */
{
  const tot = pools.reduce((a, p) => a + p[1], 0), mx = Math.max(...pools.map(p => p[1]));
  let g = '';
  /* the pools from the canopy down to the soil, each bar as wide as its carbon */
  pools.forEach(([n, v, c], i) => {
    const w = Math.max(3, v / mx * 72), y = 10 + i * 14.5;
    g += `<rect x="72" y="${f1(y)}" width="${f1(w)}" height="11" rx="2" fill="${c}"/>`;
    g += `<text x="68" y="${f1(y + 8)}" text-anchor="end" font-family="Jost" font-size="6.5" fill="${P.tinta}">${n}</text>`;
    g += `<text x="${f1(72 + w + 4)}" y="${f1(y + 8)}" font-family="Jost" font-size="6.5" fill="${P.gris}">${nf(v)}</text>`;
  });
  g += `<text x="88" y="80" text-anchor="middle" font-family="Jost" font-size="6.8" fill="${P.tinta}">${nf(tot)} Mg C/ha · ${nf(tot * 44 / 12, 0)} Mg CO₂e/ha</text>`;
  s += vin(544, L('EL CARBONO', 'CARBON'), g);
}

/* ---------------- footer ---------------- */
s += `<text x="${W / 2}" y="1028" text-anchor="middle" font-family="Jost" font-weight="400" font-size="12" letter-spacing="2.5" fill="${P.tinta}" opacity="0.9">LUIS ÁNGEL BARRERA-GUZMÁN</text>
<text x="${W / 2}" y="1047" text-anchor="middle" font-family="Jost" font-weight="400" font-size="10" letter-spacing="1.5" fill="${P.oro}">${L('PRIMERA EDICIÓN · 2026 · VERSIÓN 1.0', 'FIRST ENGLISH EDITION · 2026 · VERSION 1.0')}</text>`;

const html = `<!doctype html>
<html lang="${L('es', 'en')}">
<head>
<meta charset="utf-8">
<title>${L('ForestPro · Manual de usuario · Portada', 'ForestPro · User’s Manual · Cover')}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../manual.css">
<!-- dibujada por herramientas/genera-portada.js${L('', ' --idioma en')}: no se edita a mano -->
</head>
<body>
<section class="page cover" aria-label="${L('Portada', 'Cover')}">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('Portada del manual de ForestPro: el perfil y la planta de una parcela de cafetal bajo sombra, con cada árbol en su lugar, y tres viñetas (la curva altura–diámetro, el patrón espacial de una parcela mapeada y el carbono del sistema)', 'Cover of the ForestPro manual: the profile and the plan of a shaded coffee plot, with every tree in its place, and three vignettes (the height–diameter curve, the spatial pattern of a mapped plot and the carbon of the system)')}">
${s}
</svg>
</section>
</body>
</html>
`;
const dir = path.join(APP, 'manual', EN ? 'en' : 'es');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, '00a-portada.html'), html);
console.log('portada:', P01.length, 'árboles en P01 ·', 'Chapman–Richards', hd && hd.ok ? hd.fit.coef.map(v => v.toFixed(3)).join(', ') : 'sin ajuste',
  '· carbono', pools.map(p => p[0] + ' ' + nf(p[1])).join(', '), '·', (html.length / 1024).toFixed(0) + ' KB');
