/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Tests of the English interface that read the source files: texts that came out in Spanish with the
   interface in English, US spelling and the names of the files. They need the files themselves, so they
   run in node only (tests/run_node.js gives them g.FP_SRC: { 'js/block4.js': text, … }). */
(function (g) {
'use strict';
const U = g.FP_UNIT, SRC = g.FP_SRC;
if (!U || !SRC) return;
const t = (block, name, fn) => U.push({ block, name, fn });
const ok = (c, m) => { if (!c) throw new Error(m || 'falso'); };
const has = (f, s) => ok(SRC[f].includes(s), `${f} no tiene «${s}»`);
const hasNot = (f, s) => ok(!SRC[f].includes(s), `${f} todavía tiene «${s}»`);
/* the string literals of a file, without its comments */
const strings = text => {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  return code.match(/'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || [];
};

t(0, 'Inglés: textos que salían en español', () => {
  has('js/block4.js', "T(' Mg C/ha/año', ' Mg C/ha/yr')");
  has('js/art.js', "T('m³ ↔ pt', 'm³ ↔ bf')");
  has('js/block9.js', "T(' PT', ' BF')");
  has('js/block7.js', "FPData.rows('cafetal_arboles', 'es')");
  has('tools/parts/_home.html', '<a href="manual/en/manual-completo.html" target="_blank" rel="noopener" data-l="en">User’s manual</a>');
  has('tools/parts/_home.html', '<a href="manual/es/manual-completo.html" target="_blank" rel="noopener" data-l="es">Manual de usuario (en español)</a>');
  hasNot('tools/parts/_home.html', '(in Spanish)');
  has('index.html', 'manual/en/manual-completo.html');
  has('index.html', '<script src="js/lang-en.js"></script>');
});
t(0, 'Inglés: el pie de la portada y lo que sigue al idioma activo (piezas del Bloque 9, aviso del balance del Bloque 4)', () => {
  has('tools/parts/_home.html', '<span data-l="es">Validación contra implementaciones independientes</span><span data-l="en">Validation against independent implementations</span>');
  hasNot('tools/parts/_home.html', 'Validation against R');
  hasNot('tools/parts/_home.html', 'Validación contra R');
  has('js/block9.js', 'if (ex) pc.name = T(ex[0], ex[1]);');
  has('js/ui.js', 'nameL: [e.es, e.en]');
  has('js/block4.js', '(${esc(srcName(ref, 0))})');
  has('js/block4.js', '(${esc(srcName(ref, 1))})');
  hasNot('js/block4.js', 'esc(s.name)');
});
t(10, 'Inglés: el informe con fecha en-US y el pie sin nombrar programas', () => {
  has('js/block10.js', "lang === 'en' ? 'en-US' : 'es-MX'");
  hasNot('js/block10.js', 'en-GB');
  has('js/block10.js', 'the validation against independent implementations are described in the manual.');
  has('js/block10.js', 'la validación contra implementaciones independientes se describen en el manual.');
  hasNot('js/block10.js', 'validation against R');
  hasNot('js/block10.js', 'validación contra R');
});
t(10, 'Inglés: los nombres de archivo pasan por LangEN.file', () => {
  has('js/core.js', 'download: window.LangEN ? LangEN.file(filename) : filename');
  has('js/block10.js', "LangEN.file('forestpro_informe_'");
  has('js/block10.js', "LangEN.file('forestpro_proyecto_'");
  has('js/block10.js', "name: LangEN.file(nm) + '.csv'");
  has('js/ui.js', 'const name = LangEN.file(o.file ||');
  /* every fixed name the app gives a table or a file is known to LangEN.file */
  const fixed = new Set();
  Object.keys(SRC).filter(f => /^js\/(block\d+|ui)\.js$/.test(f)).forEach(f => {
    (SRC[f].match(/'forestpro_[a-z_]+/g) || []).forEach(m => fixed.add(m.slice(1)));
  });
  ok(fixed.size > 40, fixed.size + ' nombres');
  const F = n => g.LangEN.file(n, 'en');
  const left = [...fixed].filter(n => n !== 'forestpro_' && F(n) === n && !/^forestpro_(ivi|weibull|hill|pretzsch|clutter|monte_carlo|coef_|conversion)/.test(n));
  ok(!left.length, 'sin traducir: ' + left.join(', '));
});
t(0, 'Inglés: ortografía estadounidense en los textos de la interfaz', () => {
  const bad = /\b(colours?|Colours?|Colour-blind|centre|Centre|centred|[Gg]reys?|Greyscale|storeys?|understorey|levelling|linearised|characterise|tonnes?|towards)\b/;
  const found = [];
  Object.keys(SRC).forEach(f => {
    const list = /\.html$/.test(f) ? [SRC[f]] : strings(SRC[f]);
    list.forEach(s => {
      /* a word of prose, not a name in the code (const grey = …, centre ? …, A.grey(…)) */
      const re = new RegExp(bad.source, 'g');
      let m;
      while ((m = re.exec(s))) {
        if (s[m.index - 1] === '.' || /^\s*(=|\(|\[|\?)/.test(s.slice(m.index + m[0].length))) continue;
        found.push(f + ': ' + m[0] + ' en ' + s.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' '));
      }
    });
  });
  ok(!found.length, found.slice(0, 6).join(' | '));
});
t(2, 'Inglés: referencias de «Método y fuentes» con su forma inglesa', () => {
  has('js/ui.js', '<li>${LangEN.refL2(r)}</li>');
  has('js/block4.js', 'src: e.user ? e.src : T(e.src, LangEN.ref(e.src))');
  /* in every reference of Blocks 2 to 9, the English form has no Spanish wording outside the titles */
  let n = 0;
  for (let b = 2; b <= 9; b++) {
    const re = /refs: (\[[\s\S]*?\])\s*\}/g;
    let m;
    while ((m = re.exec(SRC['js/block' + b + '.js']))) {
      const list = Function('T', 'return ' + m[1])(es => es);
      list.forEach(r => {
        n++;
        const en = g.LangEN.ref(r).replace(/<i>.*?<\/i>/g, '');
        const authors = en.split(/\s\(\d{4}\)/)[0];
        ok(!/ y /.test(authors), 'B' + b + ': ' + en);
        ok(!/ª ed|\bcap\.|\bcuadros?\b|\bec\.|La Haya|\. En |apéndice|teselas|método delta|teorema/.test(en), 'B' + b + ': ' + en);
      });
    }
  }
  ok(n > 100, n + ' referencias');
});
})(typeof window !== 'undefined' ? window : globalThis);
