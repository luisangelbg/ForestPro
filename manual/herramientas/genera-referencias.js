/* ForestPro — manual de usuario: escribe las referencias del apéndice F a partir de lo que cita la app.
   ForestPro no tiene un catálogo único de referencias: cada recuadro «Método y fuentes» trae las suyas
   (UI.method(…, { refs: [ … ] }) en js/block2.js a js/block9.js) y el catálogo alométrico del Bloque 4 cita la
   fuente de cada ecuación (Biomass.EQS[].src, js/eng-biomass.js). Esta herramienta las reúne y reemplaza lo que hay
   entre las marcas <!-- REFERENCIAS --> y <!-- /REFERENCIAS --> de es/11-apendices.html: un apartado por bloque, en
   el orden de la app, y uno para las ecuaciones del catálogo, con las obras en orden alfabético. Una obra citada
   varias veces se escribe una sola vez (en el primer bloque que la cita), con su forma más completa. Así el manual y
   el programa citan exactamente lo mismo.
   Uso:   node manual/herramientas/genera-referencias.js              (es/11-apendices.html)
          node manual/herramientas/genera-referencias.js --idioma en  (en/11-apendices.html: los títulos de los apartados
                                                                        en inglés y, en las referencias, «y» → «and»,
                                                                        «4.ª ed.» → «4th ed.», «cap.» → «ch.», «vol.» igual) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '..', '..');
const iIdioma = process.argv.indexOf('--idioma'), en = iIdioma > 0 && process.argv[iIdioma + 1] === 'en';
const lang = en ? 'en' : 'es';

/* the names of the blocks, from js/core.js (STEPS) */
const core = fs.readFileSync(path.join(raiz, 'js', 'core.js'), 'utf8');
const STEPS = vm.runInNewContext('(' + /const STEPS = (\[[\s\S]*?\]);/.exec(core)[1] + ')');

/* the array literal that follows each «refs:» in a file, evaluated as plain strings */
function refsDe(texto) {
  const out = [];
  const re = /refs:\s*\[/g;
  let m;
  while ((m = re.exec(texto))) {
    let i = m.index + m[0].length - 1, prof = 0, q = null;
    const ini = i;
    for (; i < texto.length; i++) {
      const c = texto[i];
      if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
      if (c === '\'' || c === '"' || c === '`') { q = c; continue; }
      if (c === '[') prof++;
      else if (c === ']') { prof--; if (!prof) break; }
    }
    const lit = texto.slice(ini, i + 1);
    try { vm.runInNewContext(lit, { T: (es, e) => (en && e != null ? e : es) }).forEach(r => { if (typeof r === 'string') out.push(r); }); }
    catch (e) { console.warn('no pude leer una lista de referencias: ' + lit.slice(0, 80)); }
  }
  return out;
}

/* the allometric catalogue */
const caja = { console, Math, JSON, Number, String, Array, Object, Map, Set, isFinite, isNaN, T: es => es };
caja.window = caja; caja.globalThis = caja;
vm.createContext(caja);
['num.js', 'eng-biomass.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(raiz, 'js', f), 'utf8'), caja, { filename: f }));
/* only the bibliographic part of each source (some add a note after it, «E es el índice…») */
const fuentesEq = caja.Biomass.EQS.map(e => e.src).filter(Boolean);

/* a work is known by its authors and year; the longest form wins */
const clave = s => { const t = s.replace(/<[^>]+>/g, ''); const m = /^(.*?\(\d{4}[a-z]?\))/.exec(t); return (m ? m[1] : t.slice(0, 60)).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' '); };
const orden = s => s.replace(/<[^>]+>/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const aIngles = s => s.replace(/(\d)\.ª ed\./g, (m, n) => n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n] || 'th') + ' ed.')
  .replace(/ y ([A-ZÁÉÍÓÚ][a-záéíóúñ'-]+, )/g, ' and $1').replace(/, y ([A-ZÁÉÍÓÚ])/g, ', and $1').replace(/\bcap\. /g, 'ch. ').replace(/\bcuadros\b/g, 'tables').replace(/\bcuadro\b/g, 'table');

const grupos = [];
for (let n = 2; n <= 9; n++) {
  const f = path.join(raiz, 'js', 'block' + n + '.js');
  if (!fs.existsSync(f)) continue;
  const st = STEPS.find(s => s.n === n);
  grupos.push({ titulo: (en ? 'Block ' : 'Bloque ') + n + ' · ' + (en ? st.en : st.es), refs: refsDe(fs.readFileSync(f, 'utf8')) });
}
grupos.push({ titulo: en ? 'The allometric equations of the catalogue (Block 4)' : 'Las ecuaciones alométricas del catálogo (Bloque 4)', refs: fuentesEq });

/* the longest form of every work, and the first group that cites it */
const mejor = new Map(), dueño = new Map();
grupos.forEach((g, gi) => g.refs.forEach(r => {
  const k = clave(r);
  if (!mejor.has(k) || r.replace(/<[^>]+>/g, '').length > mejor.get(k).replace(/<[^>]+>/g, '').length) mejor.set(k, r);
  if (!dueño.has(k)) dueño.set(k, gi);
}));

let total = 0, html = '\n', nG = 0;
grupos.forEach((g, gi) => {
  const lista = [...dueño.entries()].filter(([, d]) => d === gi).map(([k]) => mejor.get(k)).map(r => (en ? aIngles(r) : r)).sort((a, b) => orden(a).localeCompare(orden(b), lang));
  if (!lista.length) return;
  total += lista.length; nG++;
  html += `  <h3>F.${nG} · ${g.titulo}</h3>\n  <ul class="refs">\n` + lista.map(r => `    <li>${r}</li>`).join('\n') + '\n  </ul>\n';
});

const archivo = path.join(raiz, 'manual', lang, '11-apendices.html');
if (!fs.existsSync(archivo)) { console.log(`${total} referencias en ${nG} apartados; todavía no existe ${path.relative(raiz, archivo)}`); process.exit(0); }
const texto = fs.readFileSync(archivo, 'utf8');
const a = texto.indexOf('<!-- REFERENCIAS -->'), b = texto.indexOf('<!-- /REFERENCIAS -->');
if (a < 0 || b < 0) throw new Error('No encontré las marcas de las referencias en ' + archivo);
fs.writeFileSync(archivo, texto.slice(0, a + '<!-- REFERENCIAS -->'.length) + html + '  ' + texto.slice(b));
console.log(`${total} referencias en ${nG} apartados escritas en ${path.relative(raiz, archivo)}`);
