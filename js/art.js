/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the artwork, all drawn here as vector paths.

   The logo is the end of a log: growth rings around the pith, the bark, and
   on its right side the outer rings leave the trunk and go on as contour lines,
   because a forest is measured tree by tree and mapped hectare by hectare.
   The rings are not circles: each one is a closed curve whose radius wanders
   with two low harmonics, as wood does, and the same seeded wobble is used
   everywhere so the logo, the favicon and the cover always match. */
(function () {
'use strict';
const Art = {};
const f = v => (Math.round(v * 100) / 100).toString();

/* a closed wobbly ring, or an open arc between angles a0 and a1 (radians, 0 = right, counter-clockwise up) */
function ring(cx, cy, R, k, o) {
  o = o || {};
  const a0 = o.a0 != null ? o.a0 : 0, a1 = o.a1 != null ? o.a1 : Math.PI * 2, N = o.n || 72;
  const amp = o.amp != null ? o.amp : 0.035, ph = o.contour ? 2 + k * 0.08 : k * 1.7;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = a0 + (a1 - a0) * i / N;
    /* the contour lines open up away from the trunk: more wobble on the right */
    const open = o.contour ? 1 + 0.10 * Math.cos(t) * Math.cos(t) + 0.04 * Math.sin(3 * t + 2) : 1;
    const r = R * open * (1 + amp * Math.sin(2 * t + ph) + amp * 0.6 * Math.sin(5 * t - ph * 0.7));
    d += (i ? 'L' : 'M') + f(cx + r * Math.cos(t)) + ' ' + f(cy - r * Math.sin(t));
  }
  return o.a1 == null && o.a0 == null ? d + 'Z' : d;
}
Art.ring = ring;

/* ---------------- the logo ---------------- */
Art.logo = function (size, opt) {
  opt = opt || {};
  const S = 64, cx = 25, cy = 33;
  const id = 'fpl' + Math.random().toString(36).slice(2, 7);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${size || 32}" height="${size || 32}"${opt.title ? ' role="img" aria-label="' + opt.title + '"' : ' aria-hidden="true" focusable="false"'}>`;
  s += `<defs><clipPath id="${id}c"><rect x="0" y="0" width="64" height="64" rx="14"/></clipPath>` +
    `<radialGradient id="${id}w" cx="0.45" cy="0.5" r="0.6"><stop offset="0" stop-color="#E7C98A"/><stop offset="1" stop-color="#B98A4E"/></radialGradient></defs>`;
  s += `<rect x="0" y="0" width="64" height="64" rx="14" fill="#0B0D0A"/>`;
  s += `<g clip-path="url(#${id}c)">`;
  /* contour lines leaving the trunk */
  [24.5, 29.5, 35, 41, 47.5].forEach((R, k) => {
    s += `<path d="${ring(cx, cy, R, k + 7, { a0: -1.25, a1: 1.25, contour: true, amp: 0.05, n: 40 })}" fill="none" stroke="${k % 2 ? '#D4A848' : '#7FBF62'}" stroke-width="${k % 2 ? 1.6 : 1.9}" stroke-linecap="round" opacity="${(0.95 - k * 0.12).toFixed(2)}"/>`;
  });
  /* the wood and its rings */
  s += `<path d="${ring(cx, cy, 20.5, 0, { amp: 0.025 })}" fill="url(#${id}w)"/>`;
  [3.2, 6.4, 9.4, 12.2, 14.9, 17.4].forEach((R, k) => {
    s += `<path d="${ring(cx, cy, R, k + 1)}" fill="none" stroke="#6D4C2F" stroke-width="${k % 2 ? 0.9 : 1.25}" opacity="${0.55 + k * 0.06}"/>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="1.3" fill="#5D4037"/>`;
  /* the bark, in the forest green of ForestPro with a golden edge */
  s += `<path d="${ring(cx, cy, 20.5, 0, { amp: 0.025 })}" fill="none" stroke="#2E7D32" stroke-width="3.2"/>`;
  s += `<path d="${ring(cx, cy, 22.3, 0, { amp: 0.025 })}" fill="none" stroke="#D4A848" stroke-width="1"/>`;
  s += `</g><rect x="0.6" y="0.6" width="62.8" height="62.8" rx="13.4" fill="none" stroke="#D4A848" stroke-opacity=".55" stroke-width="1.2"/></svg>`;
  return s;
};
/* the favicon: the same idea, fewer lines (data URI, written into index.html by the build) */
Art.favicon = function () {
  const cx = 13, cy = 16.5;
  let s = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='#0B0D0A'/>`;
  [13, 17.5, 22].forEach((R, k) => { s += `<path d='${ring(cx, cy, R, k + 7, { a0: -1.2, a1: 1.2, contour: true, amp: 0.05, n: 24 })}' fill='none' stroke='${k % 2 ? '#D4A848' : '#7FBF62'}' stroke-width='1.6' stroke-linecap='round'/>`; });
  s += `<path d='${ring(cx, cy, 10.2, 0, { amp: 0.025, n: 36 })}' fill='#D9B576' stroke='#2E7D32' stroke-width='2'/>`;
  [3.2, 6.4].forEach((R, k) => { s += `<path d='${ring(cx, cy, R, k + 1, { n: 30 })}' fill='none' stroke='#6D4C2F' stroke-width='1'/>`; });
  return s + `</svg>`;
};

/* ---------------- the cover ----------------
   The log end grows ring by ring; its outer rings leave the trunk as contour
   lines over a small map, with the plots of an inventory and the trees along
   the hillside. Drawn with stroke-dash animations (none with reduced motion). */
Art.hero = function () {
  const W = 560, H = 440, cx = 190, cy = 228;
  const id = 'fph' + Math.random().toString(36).slice(2, 7);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="hero-svg" aria-hidden="true" focusable="false">`;
  s += `<defs><radialGradient id="${id}w" cx="0.45" cy="0.5" r="0.62"><stop offset="0" stop-color="#EBD29B"/><stop offset=".7" stop-color="#C99D5E"/><stop offset="1" stop-color="#A97A43"/></radialGradient>` +
    `<radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#D4A848" stop-opacity=".22"/><stop offset="1" stop-color="#D4A848" stop-opacity="0"/></radialGradient></defs>`;
  s += `<circle cx="${cx}" cy="${cy}" r="200" fill="url(#${id}g)"/>`;
  /* contour lines over the map, numbered like a topographic sheet */
  const cont = [150, 178, 208, 240, 274, 310, 348];
  const plots = [[cx + 252, cy - 128, 26], [cx + 300, cy + 40, 22], [cx + 210, cy + 150, 24]];
  /* does a label box (x … x + 44, y − 11 … y + 2) touch one of the plots? */
  const onPlot = (x, y) => plots.some(([px, py, pr]) => Math.hypot(Math.max(x - px, 0, px - x - 44), Math.max(y - 11 - py, 0, py - y - 2)) < pr + 3);
  cont.forEach((R, k) => {
    const d = ring(cx, cy, R, k + 7, { a0: -1.05, a1: 1.05, contour: true, amp: 0.045, n: 80 });
    s += `<path class="ha-cont" style="--d:${(1.5 + k * 0.12).toFixed(2)}s" pathLength="1" d="${d}" fill="none" stroke="${k % 2 ? '#D4A848' : '#7FBF62'}" stroke-width="${k % 3 === 0 ? 2.2 : 1.4}" stroke-linecap="round" opacity="${(0.9 - k * 0.07).toFixed(2)}"/>`;
    if (k % 3 === 0) {
      /* the label sits on its line, moved up the line far enough to stay inside the drawing */
      let t = 0.55 - k * 0.04, r = R * (1 + 0.10 * Math.cos(t) ** 2);
      for (let i = 0; i < 40 && cx + r * Math.cos(t) + 4 + 44 > W; i++) { t += 0.01; r = R * (1 + 0.10 * Math.cos(t) ** 2); }
      for (let i = 0; i < 40 && onPlot(cx + r * Math.cos(t) + 4, cy - r * Math.sin(t) - 4); i++) { t -= 0.01; r = R * (1 + 0.10 * Math.cos(t) ** 2); }
      s += `<text class="ha-lab" style="--d:${(2.1 + k * 0.12).toFixed(2)}s" x="${f(cx + r * Math.cos(t) + 4)}" y="${f(cy - r * Math.sin(t) - 4)}" fill="#D4A848" font-size="11" font-family="system-ui, sans-serif">${2100 + k * 20} m</text>`;
    }
  });
  /* a circular plot of the inventory, with its trees, and a systematic grid of sample points */
  plots.forEach(([x, y, r], k) => {
    s += `<g class="ha-plot" style="--d:${(2.4 + k * 0.25).toFixed(2)}s"><circle cx="${x}" cy="${y}" r="${r}" fill="rgba(127,191,98,.10)" stroke="#E6C470" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    [[-8, -6], [7, -9], [10, 6], [-6, 9], [1, 1]].forEach(([dx, dy], j) => {
      if ((j + k) % 5 === 4 && k) return;
      s += `<path d="M${x + dx} ${y + dy - 7}l5 9h-10z" fill="#7FBF62"/><rect x="${x + dx - 0.8}" y="${y + dy + 2}" width="1.6" height="2.5" fill="#B98A4E"/>`;
    });
    s += `</g>`;
  });
  for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 5; gy++) {
    const x = cx + 236 + gx * 34, y = cy - 190 + gy * 34 + (gx % 2) * 8;
    if (Math.hypot(x - cx, y - cy) < 240) continue;
    s += `<circle class="ha-pt" style="--d:${(2.8 + (gx + gy) * 0.05).toFixed(2)}s" cx="${x}" cy="${y}" r="2.2" fill="#E6C470"/>`;
  }
  /* the wood */
  s += `<path d="${ring(cx, cy, 128, 0, { amp: 0.022, n: 120 })}" fill="url(#${id}w)"/>`;
  /* radial cracks of a drying log */
  [[0.35, 0.55], [2.2, 0.42], [4.1, 0.5]].forEach(([t, L]) => { s += `<path d="M${f(cx + 128 * Math.cos(t))} ${f(cy - 128 * Math.sin(t))}L${f(cx + 128 * (1 - L) * Math.cos(t + 0.03))} ${f(cy - 128 * (1 - L) * Math.sin(t + 0.03))}" stroke="#7A5530" stroke-width="1.2" opacity=".45"/>`; });
  /* rings: wide early wood, thin late wood; they appear from the pith outward */
  const R = []; let r = 5;
  for (let k = 0; r < 120; k++) { r += 5.2 + 3.2 * Math.sin(k * 0.9) + (k < 5 ? 2.5 : 0); R.push(Math.min(r, 120)); }
  R.forEach((rr, k) => {
    s += `<path class="ha-ring" style="--d:${(0.15 + k * 0.07).toFixed(2)}s" pathLength="1" d="${ring(cx, cy, rr, k + 1, { n: 110 })}" fill="none" stroke="#6D4C2F" stroke-width="${k % 4 === 3 ? 2 : 1.1}" opacity="${(0.5 + 0.03 * k).toFixed(2)}"/>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="3.6" fill="#5D4037"/>`;
  /* an increment core, the way rings are counted in the field */
  s += `<g class="ha-core" style="--d:1.9s"><rect x="${cx + 4}" y="${cy - 2.5}" width="132" height="5" rx="2.5" fill="#F3E3BE" stroke="#7A5530" stroke-width=".8"/>`;
  R.forEach(rr => { if (rr < 130) s += `<line x1="${f(cx + rr)}" y1="${cy - 2.5}" x2="${f(cx + rr)}" y2="${cy + 2.5}" stroke="#6D4C2F" stroke-width=".8"/>`; });
  s += `</g>`;
  /* the bark */
  s += `<path d="${ring(cx, cy, 128, 0, { amp: 0.022, n: 120 })}" fill="none" stroke="#2E7D32" stroke-width="9"/>`;
  s += `<path d="${ring(cx, cy, 134, 0, { amp: 0.022, n: 120 })}" fill="none" stroke="#D4A848" stroke-width="1.6" opacity=".9"/>`;
  /* a label like a field sheet */
  s += `<g font-family="system-ui, sans-serif" class="ha-lab" style="--d:2.2s"><text x="${cx - 120}" y="${cy + 172}" fill="#CFDACA" font-size="12">${T('DAP 38.4 cm · 43 anillos · 1.30 m', 'DBH 38.4 cm · 43 rings · 1.30 m')}</text></g>`;
  return s + `</svg>`;
};

/* ---------------- block vignettes (220 × 108) ---------------- */
const V = (inner, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 108" role="img" aria-label="${label || ''}">${inner}</svg>`;
const tree = (x, y, h, c) => `<rect x="${x - 1.6}" y="${y - h * 0.32}" width="3.2" height="${h * 0.32}" fill="var(--corteza)"/><path d="M${x} ${y - h}l${h * 0.28} ${h * 0.7}h${-h * 0.56}z" fill="${c || 'var(--bosque)'}"/>`;
const round = (x, y, h, c) => `<rect x="${x - 1.8}" y="${y - h * 0.45}" width="3.6" height="${h * 0.45}" fill="var(--corteza)"/><circle cx="${x}" cy="${y - h * 0.68}" r="${h * 0.3}" fill="${c || 'var(--musgo)'}"/>`;
Art.vignette = function (n) {
  const ax = 'stroke="var(--fig-axis)" stroke-width="1"';
  switch (+n) {
    case 2: return V(`<line x1="20" y1="96" x2="200" y2="96" ${ax}/>` + tree(70, 96, 82) +
      `<path d="M62 70h16" stroke="var(--oro)" stroke-width="3"/><text x="46" y="76" text-anchor="end" class="art-mut" font-size="9">${T('DAP', 'DBH')}</text><text x="46" y="87" text-anchor="end" class="art-mut" font-size="9">1.30 m</text>` +
      `<path d="M104 96V14M100 18l4-6 4 6M100 92l4 4 4-4" stroke="var(--fig-ink)" fill="none" stroke-width="1.2"/><text x="110" y="52" class="art-mut" font-size="9">H</text>` +
      `<path d="M140 90c10-2 16-22 26-40s14-28 30-34" fill="none" stroke="var(--primary)" stroke-width="2"/>` +
      [[146, 84], [152, 74], [160, 64], [166, 50], [176, 40], [186, 30], [196, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y + (x % 7) - 3}" r="2.4" fill="var(--musgo)"/>`).join(''));
    case 3: return V(Array.from({ length: 12 }, (_, i) => `<circle cx="${22 + (i % 4) * 28}" cy="${22 + Math.floor(i / 4) * 30}" r="10" fill="none" stroke="var(--musgo)" stroke-dasharray="3 2"/>`).join('') +
      `<line x1="130" y1="96" x2="210" y2="96" ${ax}/>` + [42, 64, 50, 32, 20, 12, 7].map((h, i) => `<rect x="${134 + i * 10.5}" y="${96 - h}" width="9" height="${h}" fill="var(--primary)" opacity=".85"/>`).join('') +
      `<path d="M134 70C150 34 160 30 172 52S196 88 208 92" fill="none" stroke="var(--oro)" stroke-width="2"/>`);
    case 4: return V(`<line x1="16" y1="70" x2="120" y2="70" ${ax}/>` + round(60, 70, 62, 'var(--bosque)') +
      `<path d="M60 70l-14 22M60 70l12 24M60 70l-2 28" stroke="var(--corteza)" stroke-width="2" fill="none"/>` +
      `<rect x="146" y="20" width="24" height="44" fill="var(--bosque)"/><rect x="146" y="64" width="24" height="16" fill="var(--corteza)"/><rect x="146" y="80" width="24" height="14" fill="var(--oro)"/>` +
      `<text x="176" y="44" class="art-mut" font-size="9">AGB</text><text x="176" y="75" class="art-mut" font-size="9">BGB</text><text x="176" y="91" class="art-mut" font-size="9">CO₂e</text>`);
    case 5: return V(`<line x1="18" y1="94" x2="206" y2="94" ${ax}/><line x1="18" y1="94" x2="18" y2="8" ${ax}/>` +
      [0, 1, 2, 3, 4].map(k => { const A = 34 + k * 14; let d = ''; for (let i = 0; i <= 30; i++) { const t = i / 30 * 60; const y = A * Math.pow(1 - Math.exp(-0.06 * t), 1.3); d += (i ? 'L' : 'M') + f(18 + t * 3.1) + ' ' + f(94 - y); } return `<path d="${d}" fill="none" stroke="${k === 2 ? 'var(--oro)' : 'var(--primary)'}" stroke-width="${k === 2 ? 2.4 : 1.4}" opacity="${k === 2 ? 1 : 0.6}"/>`; }).join(''));
    case 6: { let s = ''; const cols = ['#2E7D32', '#D08C1E', '#8D6E63', '#3A7DC9', '#9467BD', '#7CB342']; for (let i = 0; i < 46; i++) { const x = 12 + ((i * 37) % 100), y = 10 + ((i * 53) % 88); s += `<circle cx="${x}" cy="${y}" r="${2.4 + (i % 3)}" fill="${cols[i % (i < 30 ? 2 : 6)]}"/>`; }
      return V(s + `<path d="M126 90H200M134 90V60H150V90M142 60V40H180V74H170V90M180 74H192V90" fill="none" stroke="var(--fig-ink)" stroke-width="1.4"/>`); }
    case 7: return V(`<line x1="10" y1="92" x2="210" y2="92" ${ax}/>` + round(44, 92, 76, 'var(--bosque)') + round(150, 92, 84, 'var(--musgo)') +
      [70, 92, 114, 128, 186, 204].map(x => `<ellipse cx="${x}" cy="84" rx="8" ry="10" fill="#2E5E2A"/><circle cx="${x - 3}" cy="82" r="1.5" fill="#C62828"/><circle cx="${x + 2}" cy="86" r="1.5" fill="#C62828"/>`).join('') +
      `<path d="M20 30q90-30 180 0" fill="none" stroke="var(--oro)" stroke-dasharray="3 3"/>`);
    case 8: return V([20, 34, 48, 62].map((R, k) => `<path d="${ring(70, 56, R, k + 7, { a0: -2.6, a1: 2.6, contour: true, amp: 0.06, n: 40 })}" fill="none" stroke="${k % 2 ? 'var(--oro)' : 'var(--musgo)'}" stroke-width="1.4"/>`).join('') +
      `<path d="M128 18L200 30L192 92L134 84Z" fill="rgba(46,125,50,.12)" stroke="var(--primary)" stroke-width="1.8"/>` +
      Array.from({ length: 12 }, (_, i) => `<circle cx="${144 + (i % 4) * 14}" cy="${36 + Math.floor(i / 4) * 16}" r="2.2" fill="var(--oro)"/>`).join(''));
    case 9: return V(`<ellipse cx="60" cy="56" rx="22" ry="34" fill="#D9B576" stroke="var(--corteza)" stroke-width="4"/>` +
      [8, 15, 22].map(r => `<ellipse cx="60" cy="56" rx="${r * 0.66}" ry="${r}" fill="none" stroke="#7A5530" stroke-width=".9"/>`).join('') +
      `<rect x="60" y="22" width="120" height="68" fill="#E2C48C" stroke="var(--corteza)" stroke-width="1.4"/>` +
      `<path d="M44 42h32M44 56h32M44 70h32" stroke="var(--primary)" stroke-width="1.4" stroke-dasharray="3 2"/><text x="120" y="60" class="art-mut" font-size="11" text-anchor="middle">${T('m³ ↔ pt', 'm³ ↔ bf')}</text>`);
    case 10: return V(`<rect x="62" y="8" width="96" height="94" rx="6" fill="var(--card-bg)" stroke="var(--border-strong)"/>` +
      `<rect x="72" y="18" width="50" height="6" rx="3" fill="var(--primary)"/>` + [32, 40, 48].map(y => `<rect x="72" y="${y}" width="76" height="3" rx="1.5" fill="var(--border-strong)"/>`).join('') +
      [22, 34, 18, 28].map((h, i) => `<rect x="${76 + i * 16}" y="${92 - h}" width="11" height="${h}" fill="${i === 1 ? 'var(--oro)' : 'var(--musgo)'}"/>`).join(''));
    default: return V('');
  }
};

window.Art = Art;
})();
