/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   What the English interface needs beyond T('texto', 'text'):
     LangEN.ref(r)    a reference written in Spanish (the «Método y fuentes» boxes, the sources of the
                      allometric catalogue) in its English form: «and» between authors, «3rd ed.», «ch.»,
                      «tables», «eq.», «The Hague», «In»… The titles of the works are not touched.
     LangEN.refL2(r)  the reference in both languages, for bilingual HTML (L2).
     LangEN.file(n)   the name of an exported file in English: forestpro_informe_x.html →
                      forestpro_report_x.html. Only the fixed part the app writes is translated; the part
                      that comes from the user (site, title, tree) is kept as is.
   In Spanish everything stays exactly as written. */
(function (g) {
'use strict';
const ORD = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));

/* notes and pieces of references that are Spanish wording (not titles of works) */
const PHRASES = [
  ['E es el índice de estrés ambiental del sitio (ec. 6b).', 'E is the environmental stress index of the site (eq. 6b).'],
  ['La fuente no indica a qué altura se mide D.', 'The source does not say at what height D is measured.'],
  ['(d₁₅: diámetro del tallo a 15 cm del suelo)', '(d₁₅: stem diameter 15 cm above the ground)'],
  ['(modelo de <i>Inga tonduzzi</i>)', '(<i>Inga tonduzzi</i> model)'],
  ['(teorema de L\'Huilier)', '(L\'Huilier\'s theorem)'],
  ['(método delta)', '(delta method)'],
  ['Política de uso de teselas y atribución', 'Tile usage policy and attribution'],
  ['Central Planning Bureau, La Haya', 'Central Planning Bureau, The Hague'],
  ['apéndice B', 'appendix B'],
  ['IICA y GTZ', 'IICA and GTZ'],
  ['(supl.)', '(suppl.)'],
];

function ref(r) {
  if (r == null) return r;
  let s = String(r);
  PHRASES.forEach(([es, en]) => { s = s.split(es).join(en); });
  /* the authors: everything before «(year)»; there «y» is always the conjunction */
  const m = /\s\((?:\d{4}[a-z]?|s\. f\.)\)/.exec(s);
  if (m) s = s.slice(0, m.index).replace(/,? y (?=\S)/g, (y) => (y[0] === ',' ? ', and ' : ' and ')) + s.slice(m.index);
  return s
    .replace(/(\d+)\.ª ed\./g, (x, n) => ORD(+n) + ' ed.')
    .replace(/\bcap\. /g, 'ch. ')
    .replace(/\bcuadros ([\d.]+) y ([\d.]+)/g, 'tables $1 and $2').replace(/\bcuadros\b/g, 'tables').replace(/\bcuadro\b/g, 'table')
    .replace(/\bec\. ([\w.]+) y ([\w.]+)/g, 'eqs. $1 and $2').replace(/\bec\. /g, 'eq. ')
    .replace(/§([\d.]+) y §/g, '§$1 and §')
    .replace(/\) y vol\. /g, ') and vol. ')
    .replace(/\. En <i>/g, '. In <i>')
    .replace(/\bLa Haya\b/g, 'The Hague');
}
function refL2(r) {
  const en = ref(r);
  return en === r ? r : `<span data-l="es">${r}</span><span data-l="en">${en}</span>`;
}

/* the fixed part of the names of the exported files (after «forestpro_»), longest first */
const FILES = [
  ['tablas_csv', 'tables_csv'], ['tablas', 'tables'], ['informe_', 'report_'], ['proyecto_', 'project_'],
  ['especies', 'species'], ['arboles', 'trees'], ['cubicacion', 'scaling'], ['modelos_volumen', 'volume_models'],
  ['ahusamiento', 'taper'], ['trozas', 'logs'], ['altura_diametro', 'height_diameter'], ['alturas_estimadas', 'estimated_heights'],
  ['alturas_completas', 'complete_heights'], ['parcelas_ha', 'plots_ha'], ['disenos', 'designs'], ['estratos_altura', 'height_strata'],
  ['estratos', 'strata'], ['asignacion', 'allocation'], ['relascopia', 'relascope'], ['tabla_rodal', 'stand_table'],
  ['densidades', 'densities'], ['densidad', 'density'], ['ecuaciones', 'equations'], ['biomasa_parcelas', 'biomass_plots'],
  ['biomasa_arboles', 'biomass_trees'], ['madera_caida', 'downed_wood'], ['carbono_suelo', 'soil_carbon'], ['reservorios', 'pools'],
  ['turno', 'rotation'], ['incrementos_', 'increments_'], ['modelos_crecimiento', 'growth_models'], ['coef_crecimiento', 'growth_coef'],
  ['indice_sitio', 'site_index'], ['clases_sitio', 'site_classes'], ['sitio_parcelas', 'site_plots'], ['tabla_produccion', 'yield_table'],
  ['matriz_comunidad', 'community_matrix'], ['matriz_para_', 'matrix_for_'], ['indices_diversidad', 'diversity_indices'],
  ['sombra_manejo', 'shade_management'], ['sombra_parcelas', 'shade_plots'], ['sombra_rendimiento', 'shade_yield'], ['anillos', 'rings'],
  ['presupuesto_carbono', 'carbon_budget'], ['poligonos', 'polygons'], ['cuadricula', 'grid'], ['mapa', 'map'], ['variograma', 'variogram'],
  ['aserrada', 'lumber'], ['conversion', 'conversion'], ['flujo', 'cash_flow'],
].sort((a, b) => b[0].length - a[0].length);
/* the word the app appends to the template of a data card */
const TAIL = [['_plantilla', '_template']];

function file(name, lang) {
  const L = lang || (g.I18N && g.I18N.lang) || 'es';
  if (L !== 'en' || name == null) return name;
  const m = /^(forestpro_)(.*?)((?:\.[A-Za-z0-9]+)*)$/.exec(String(name));
  if (!m) return name;
  let body = m[2];
  const hit = FILES.find(([es]) => body === es || (body.startsWith(es) && (es.endsWith('_') || body[es.length] === '_')));
  if (hit) body = hit[1] + body.slice(hit[0].length);
  TAIL.forEach(([es, en]) => { if (body.endsWith(es)) body = body.slice(0, -es.length) + en; });
  return m[1] + body + m[3];
}

g.LangEN = { ref, refL2, file };
})(typeof window !== 'undefined' ? window : globalThis);
