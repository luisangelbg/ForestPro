/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the home page: logo, cover, workflow, the nine modules, the
   example data and the citation. */
(function () {
'use strict';
/* the blocks register here how to open each example: ExampleHooks[id] = () => … */
window.ExampleHooks = window.ExampleHooks || {};

const VERSION = '1.0.0';
/* cited by its author, title, version and the concept DOI of Zenodo, which always resolves to the latest version */
const CITE_DOI = '10.5281/zenodo.23876374';
const CITE = {
  apa: 'Barrera-Guzmán, L. Á. (2026). ForestPro: a browser-based platform for forest inventory, mensuration, biomass, carbon and agroforestry (Version ' + VERSION + ') [Computer software]. Zenodo. https://doi.org/' + CITE_DOI,
  bib: '@software{BarreraGuzman2026ForestPro,\n  author  = {Barrera-Guzmán, Luis Ángel},\n  title   = {{ForestPro}: a browser-based platform for forest inventory, mensuration, biomass, carbon and agroforestry},\n  year    = {2026},\n  version = {' + VERSION + '},\n  license = {GPL-3.0-or-later},\n  doi     = {' + CITE_DOI + '},\n  url     = {https://doi.org/' + CITE_DOI + '}\n}',
};
window.FP_CITE = CITE;
window.FP_VERSION = VERSION;

const WF = [
  ['Medir', 'Measure', 'DAP, alturas, secciones', 'DBH, heights, sections'],
  ['Muestrear', 'Sample', 'diseño y tamaño de muestra', 'design and sample size'],
  ['Expandir', 'Expand', 'a la hectárea y al rodal', 'to the hectare and the stand'],
  ['Convertir', 'Convert', 'biomasa, carbono, CO₂e', 'biomass, carbon, CO₂e'],
  ['Proyectar', 'Project', 'crecimiento e índice de sitio', 'growth and site index'],
  ['Reportar', 'Report', 'informe, tablas y mapas', 'report, tables and maps'],
];
const EXAMPLES = [
  { id: 'cafetal', es: 'Cafetal bajo sombra', en: 'Shaded coffee farm', f: ['25 parcelas · 1 000 m² · café y árboles de sombra', '25 plots · 1,000 m² · coffee and shade trees'],
    d: ['Inventario de árboles de sombra (Inga, Cordia, Erythrina, aguacate, cítricos, plátano) y una submuestra de cafetos, con cobertura de sombra, rendimiento de café y coordenadas.', 'Inventory of shade trees (Inga, Cordia, Erythrina, avocado, citrus, banana) and a subsample of coffee bushes, with shade cover, coffee yield and coordinates.'],
    go: [[3, 'Inventario', 'Inventory'], [4, 'Biomasa', 'Biomass'], [7, 'Agroforestería', 'Agroforestry']] },
  { id: 'mesofilo', es: 'Bosque mesófilo estratificado', en: 'Stratified cloud forest', f: ['3 estratos · 24 parcelas · parcela mapeada de 50 × 50 m', '3 strata · 24 plots · 50 × 50 m mapped plot'],
    d: ['Parcelas circulares anidadas en bosque conservado, perturbado y ribereño, con especies, alturas y una parcela con coordenadas de cada tallo para el patrón espacial.', 'Nested circular plots in conserved, disturbed and riparian forest, with species, heights and one plot with the coordinates of every stem for the spatial pattern.'],
    go: [[3, 'Inventario', 'Inventory'], [6, 'Diversidad', 'Diversity'], [8, 'Mapas', 'Maps']] },
  { id: 'pino', es: 'Plantación de pino', en: 'Pine plantation', f: ['30 parcelas permanentes · 6 remediciones · árboles derribados', '30 permanent plots · 6 remeasurements · felled trees'],
    d: ['Remediciones de altura dominante, densidad y diámetro, análisis troncal de árboles tipo y secciones de árboles derribados para cubicación y ahusamiento.', 'Remeasurements of dominant height, density and diameter, stem analysis of sample trees and sections of felled trees for scaling and taper.'],
    go: [[2, 'Dasometría', 'Mensuration'], [5, 'Crecimiento', 'Growth'], [9, 'Utilidades', 'Utilities']] },
  { id: 'referencias', es: 'Densidades y ecuaciones', en: 'Densities and equations', f: ['densidad básica de la madera · catálogo alométrico', 'basic wood density · allometric catalog'],
    d: ['La tabla de densidades de las especies de los ejemplos y el catálogo de ecuaciones alométricas de referencia, editables y con su fuente.', 'The table of densities of the species in the examples and the catalog of reference allometric equations, editable and with their source.'],
    go: [[4, 'Biomasa', 'Biomass']] },
];

document.addEventListener('DOMContentLoaded', () => {
  const logo = el('brandLogo');
  if (logo && window.Art) logo.innerHTML = Art.logo(30);
  const brand = el('brand');
  if (brand) { brand.style.cursor = 'pointer'; brand.addEventListener('click', () => goStep(1)); }
  const hero = el('heroArt');
  if (hero && window.Art) hero.innerHTML = Art.hero() + `<p class="ha-caption">${L2('Los anillos de un tronco y las curvas de nivel del rodal: lo que mide ForestPro.', 'The rings of a trunk and the contour lines of the stand: what ForestPro measures.')}</p>`;
  const wf = el('workflow');
  if (wf) wf.innerHTML = WF.map((w, i) => `<div class="wf-step"><div class="wf-n">${L2('PASO ' + (i + 1), 'STEP ' + (i + 1))}</div><div class="wf-t">${L2(w[0], w[1])}</div><div class="wf-d">${L2(w[2], w[3])}</div></div>`).join('');
  const grid = el('blockGrid');
  if (grid) {
    STEPS.filter(s => s.n > 1).forEach(s => {
      const shell = el('panel-' + s.n);
      const p = shell ? shell.querySelector('.panel-title p') : null;
      const b = mk('button', { type: 'button', class: 'feature' });
      b.innerHTML = `<div class="f-art">${Art.vignette(s.n)}</div><div class="f-num">${L2('Bloque ' + s.n, 'Block ' + s.n)}</div><h3>${L2(s.es, s.en)}</h3>` + (p ? `<p>${p.innerHTML}</p>` : '');
      b.addEventListener('click', () => goStep(s.n));
      grid.appendChild(b);
    });
  }
  const ex = el('exampleGrid');
  if (ex) EXAMPLES.forEach(e => {
    const c = mk('div', { class: 'ex-card' });
    c.innerHTML = `<h3>${L2(e.es, e.en)}</h3><div class="ex-f">${L2(e.f[0], e.f[1])}</div><p>${L2(e.d[0], e.d[1])}</p>`;
    const row = mk('div', { class: 'btn-row' });
    e.go.forEach(([n, es, en]) => {
      const b = mk('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, L2('Abrir en ' + es, 'Open in ' + en));
      b.addEventListener('click', () => { goStep(n); const h = ExampleHooks[e.id + ':' + n]; if (h) setTimeout(h, 30); });
      row.appendChild(b);
    });
    c.appendChild(row);
    ex.appendChild(c);
  });
  const cite = el('citeBox');
  if (cite) {
    cite.innerHTML = `<p>${L2('Si ForestPro te sirve en un trabajo publicado, cítalo así (y cita también las ecuaciones y métodos que usaste, que cada resultado indica):', 'If ForestPro helps in a published work, cite it as follows (and also cite the equations and methods you used, which every result names):')}</p>` +
      `<div class="cite-ref" id="citeApa">${esc(CITE.apa)}</div><div class="cite-ref" id="citeBib">${esc(CITE.bib)}</div>`;
    const row = mk('div', { class: 'btn-row' });
    [['apa', 'Copiar APA', 'Copy APA'], ['bib', 'Copiar BibTeX', 'Copy BibTeX']].forEach(([k, es, en]) => {
      const b = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2(es, en));
      b.addEventListener('click', () => { try { navigator.clipboard.writeText(CITE[k]); if (window.LABG) LABG.toast(T('Copiado', 'Copied')); } catch (e) { /* no clipboard */ } });
      row.appendChild(b);
    });
    cite.appendChild(row);
  }
  const start = el('startBtn');
  if (start) start.addEventListener('click', () => { goStep(3); const h = ExampleHooks['cafetal:3']; if (h) setTimeout(h, 30); });
  const mb = el('modulesBtn');
  if (mb) mb.addEventListener('click', () => el('modules').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  const cb = el('citeBtn');
  if (cb) cb.addEventListener('click', () => el('cite').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
});
document.addEventListener('langchange', () => {
  const hero = el('heroArt');
  if (hero && window.Art) { const cap = hero.querySelector('.ha-caption'); hero.innerHTML = Art.hero(); if (cap) hero.appendChild(cap); }
  /* the vignettes carry a word or two (DAP / DBH) */
  if (window.Art) els('#blockGrid .feature .f-art').forEach((d, i) => { d.innerHTML = Art.vignette(i + 2); });
});
})();
