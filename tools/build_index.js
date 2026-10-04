/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Assembles index.html: the head, the common bar of the LABG Suite (parts/_topbar.html), the home page
   (parts/_home.html), the shell of each block (title, introduction and the host its script fills) and
   the scripts. Run with node from the root of the app after editing any of those parts:
       node tools/build_index.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..'), parts = path.join(__dirname, 'parts');
const read = f => fs.readFileSync(path.join(parts, f), 'utf8');

/* the favicon comes from the same drawing as the logo (js/art.js) */
const box = { window: {}, T: (es) => es, Math };
box.window = box;
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'art.js'), 'utf8'), box);
const favicon = 'data:image/svg+xml,' + box.Art.favicon().replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23');

/* block shells: number, names and the one-line purpose shown under the title */
const BLOCKS = [
  [2, 'Dasometría individual', 'Tree mensuration', 'Diámetro, área basal, volumen por fórmulas y por ecuaciones ajustadas, ahusamiento y relación altura–diámetro.', 'Diameter, basal area, volume by formulas and fitted equations, taper and the height–diameter relationship.'],
  [3, 'Inventario forestal y muestreo', 'Forest inventory and sampling', 'Tamaño de muestra, diseños de muestreo, expansión a la hectárea, estructura del rodal e índices de densidad.', 'Sample size, sampling designs, expansion to the hectare, stand structure and density indices.'],
  [4, 'Biomasa y carbono', 'Biomass and carbon', 'Ecuaciones alométricas, densidad de la madera, biomasa aérea y de raíces, necromasa, carbono y CO₂e con su incertidumbre.', 'Allometric equations, wood density, above- and belowground biomass, necromass, carbon and CO₂e with their uncertainty.'],
  [5, 'Crecimiento y rendimiento', 'Growth and yield', 'Incrementos corriente y medio, modelos de crecimiento, índice de sitio y proyección del rodal.', 'Current and mean annual increments, growth models, site index and stand projection.'],
  [6, 'Diversidad y ecología del bosque', 'Forest diversity and ecology', 'Riqueza, índices y números de Hill, rarefacción, similitud entre sitios, estructura vertical y patrón espacial.', 'Richness, indices and Hill numbers, rarefaction, similarity among sites, vertical structure and spatial pattern.'],
  [7, 'Sistemas agroforestales', 'Agroforestry systems', 'Sombra de cafetales (por inventario o por fotografía hemisférica), sombra y rendimiento, arreglos de plantación y presupuesto de carbono.', 'Shade of coffee farms (by inventory or by hemispherical photograph), shade and yield, planting layouts and carbon budget.'],
  [8, 'Mapas y geoprocesamiento ligero', 'Maps and light geoprocessing', 'Parcelas y árboles en el mapa, áreas de polígonos, cuadrícula de muestreo, exportación GPX/KML/GeoJSON e interpolación.', 'Plots and trees on the map, polygon areas, sampling grid, GPX/KML/GeoJSON export and interpolation.'],
  [9, 'Utilidades forestales', 'Forestry tools', 'Cubicación de trozas y madera aserrada, pies tabla, factores de forma, conversiones, rendimiento de aserrío y costo de plantación.', 'Log and lumber scaling, board feet, form factors, conversions, sawmill yield and plantation cost.'],
  [10, 'Informe y proyecto', 'Report and project', 'El informe HTML autocontenido, las tablas, el proyecto reimportable y la cita.', 'The self-contained HTML report, the tables, the re-importable project and the citation.'],
];
const shells = BLOCKS.map(([n, es, en, des, den]) => {
  const extra = path.join(parts, '_panel' + n + '.html');
  const body = fs.existsSync(extra) ? fs.readFileSync(extra, 'utf8').trim() : `<div id="b${n}root"></div>`;
  return `<!-- ==================== BLOCK ${n} ==================== -->
<section class="step-panel" id="panel-${n}">
  <div class="panel-title"><div class="pt-num">${n}</div><div><h2><span data-l="es">${es}</span><span data-l="en">${en}</span></h2><p><span data-l="es">${des}</span><span data-l="en">${den}</span></p></div></div>
  ${body}
</section>`;
}).join('\n\n');

const scripts = [
  'labg-core.js', ['labg-figure-studio.js', 'defer'], ['labg-navigator.js', 'defer'], ['labg-fx.js', 'data-app="forestpro" defer'],
  'num.js', 'nls.js', 'dataio.js', 'plot.js', 'core.js', 'ui.js', ['labg-figedit.js', 'data-key="forestpro:figedit"'],
  'datasets.js', 'eng-dendro.js', 'eng-invent.js', 'eng-biomass.js', 'eng-growth.js', 'eng-divers.js', 'eng-agro.js', 'eng-geo.js', 'eng-tools.js',
  'art.js', 'home.js', 'block2.js', 'block3.js', 'block4.js', 'block5.js', 'block6.js', 'block7.js', 'mapview.js', 'block8.js', 'block9.js', 'block10.js',
].filter(s => fs.existsSync(path.join(root, 'js', Array.isArray(s) ? s[0] : s)))
  .map(s => Array.isArray(s) ? `<script src="js/${s[0]}" ${s[1]}></script>` : `<script src="js/${s}"></script>`).join('\n');

const html = `<!DOCTYPE html>
<!--
  ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
  Copyright (C) 2026  Luis Ángel Barrera-Guzmán

  This program is free software: you can redistribute it and/or modify it under
  the terms of the GNU General Public License as published by the Free Software
  Foundation, either version 3 of the License, or (at your option) any later
  version.

  This program is distributed in the hope that it will be useful, but WITHOUT
  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
  FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  this program, in the file LICENSE.  If not, see <https://www.gnu.org/licenses/>.

  This notice covers the whole program: index.html, css/ and the files in js/.
  This file is assembled by tools/build_index.js.
-->
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title data-es="ForestPro — Inventario forestal, biomasa y carbono" data-en="ForestPro — Forest inventory, biomass and carbon">ForestPro — Inventario forestal, biomasa y carbono</title>
<meta name="description" content="Forest inventory, tree mensuration, biomass and carbon with uncertainty, growth and site index, diversity and spatial pattern, agroforestry and light mapping, in the browser and with its own code.">
<meta name="labg-repo" content="ForestPro">
<meta property="og:title" content="ForestPro — LABG Suite">
<meta property="og:description" content="Forest inventory, mensuration, biomass, carbon and agroforestry in the browser.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://luisangelbg.github.io/ForestPro/">
<meta property="og:image" content="https://luisangelbg.github.io/ForestPro/img/og-forestpro.png">
<meta name="theme-color" content="#0B0D0A">
<link rel="icon" href="${favicon}">
<link rel="stylesheet" href="css/labg-base.css">
<link rel="stylesheet" href="css/style.css">
<script src="js/i18n.js"></script>
</head>
<body class="on-home">

<a class="skip-link" href="#main"><span data-l="es">Saltar al contenido</span><span data-l="en">Skip to content</span></a>
${read('_topbar.html').trim()}

<main id="main" tabindex="-1">

${read('_home.html').trim()}

${shells}

</main>

${scripts}
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html:', html.length, 'caracteres;', BLOCKS.length + 1, 'bloques.');
