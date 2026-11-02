/* ForestPro — manual: ayudantes que captura.js antepone a cada receta.
   W(ms)                 espera
   listo(max)            espera a que terminen los cálculos en curso (window.FP_BUSY vuelve a 0: runWork, js/core.js)
   vis(sel, txt)         el primer elemento visible que coincide (y cuyo texto empieza con txt)
   irA(nodo, margen)     lleva el nodo a la vista, debajo de las barras fijas
   caja(nodos, p)        el recorte que envuelve a los nodos, con p píxeles de aire, en coordenadas del documento
   seccion(id)           los nodos de una sección de la portada (Bloque 1): su título .section-title y lo que sigue
                         hasta el siguiente título; id es el del título (modules, cite) o el comienzo de su texto en el
                         idioma activo («Cómo funciona», «Datos de ejemplo», «Lo que hace y lo que no»…)
   ejemplo(clave, n)     abre el bloque n con un ejemplo, como los botones «Abrir en …» de la portada
                         (ExampleHooks['clave:n'] de cada js/blockN.js). Claves y bloques:
                           'cafetal'     cafetal bajo sombra, 25 parcelas ........ bloques 3, 4 y 7
                           'mesofilo'    bosque mesófilo estratificado, 24 parcelas  bloques 3, 4, 6 y 8
                           'pino'        plantación de pino con remediciones ...... bloques 2, 5 y 9
                           'referencias' densidades y ecuaciones .................. bloque 4
   bloque(n, clave)      abre el bloque n y, si se da, carga su ejemplo con ejemplo(clave, n)
   cargar(id, clave)     carga el ejemplo de una tarjeta de datos por su id (UI.cards: b2t, b2s, b2v, b2h, b3t, b3p,
                         b3r, b4w, b4l, b4s, b4c, b5a, b5c, b6a, b6f, b7c, b8p, b8i) y espera a que calcule
   tarjeta(n, i)         la i-ésima tarjeta (.card) visible del bloque n; o, si i es texto, la tarjeta cuyo título
                         h2 empieza con ese texto (en el idioma activo)
   abrirMetodo(nodo)     despliega el recuadro «Método y fuentes» de una tarjeta
   porId(id)             document.getElementById, con error claro si no existe
   Los textos se comparan con innerText (sólo el idioma visible: la app escribe los dos y esconde uno con CSS).
   La interfaz sale en el idioma que captura.js deja guardado (forestpro:lang); los textos que se buscan con
   vis() o tarjeta() deben estar en ese idioma, o buscarse por id. Las recetas pueden usar EN (true en inglés)
   y L('texto', 'text') para escribir los dos. */
var W = ms => new Promise(r => setTimeout(r, ms));
var EN = window.I18N && I18N.lang === 'en';
var L = (es, en) => (EN ? en : es);
var listo = async max => {
  const t0 = Date.now();
  await W(300);
  while ((window.FP_BUSY || 0) > 0 && Date.now() - t0 < (max || 60000)) await W(200);
  await W(500);
};
var vis = (sel, txt) => [...document.querySelectorAll(sel)].find(n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (!txt || (n.innerText || n.textContent).trim().startsWith(txt)); });
var irA = (n, margen) => { window.scrollTo(0, n.getBoundingClientRect().top + window.scrollY - (margen == null ? 150 : margen)); };
var caja = (nodos, p) => {
  p = p == null ? 10 : p;
  const rs = [].concat(nodos).filter(Boolean).map(n => n.getBoundingClientRect()).filter(r => r.width > 0);
  const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p;
  const w = Math.max(...rs.map(r => r.right)) + p - x, h = Math.max(...rs.map(r => r.bottom)) + p - y;
  return [Math.max(0, x + window.scrollX), Math.max(0, y + window.scrollY), w, h].map(Math.round).join(',');
};
var porId = id => { const n = document.getElementById(id); if (!n) throw new Error('No existe #' + id); return n; };
var seccion = id => {
  const h = document.getElementById(id) || vis('#panel-1 .section-title', id);
  if (!h) throw new Error('No encuentro la sección ' + id);
  const out = [h];
  let n = h.nextElementSibling;
  while (n && !n.classList.contains('section-title') && !n.classList.contains('footer-note')) { out.push(n); n = n.nextElementSibling; }
  return out;
};
/* un ejemplo abierto como lo abre la portada: el bloque primero y después su gancho */
var ejemplo = async (clave, n) => {
  window.confirm = () => true;
  goStep(n); await W(700);
  const h = window.ExampleHooks && ExampleHooks[clave + ':' + n];
  if (!h) throw new Error('No hay ejemplo ' + clave + ' para el Bloque ' + n);
  h();
  await W(600); await listo();
};
var bloque = async (n, clave) => {
  await W(900);
  if (clave) await ejemplo(clave, n);
  else { goStep(n); await W(1200); }
  window.scrollTo(0, 0); await W(300);
};
var cargar = async (id, clave) => {
  const c = window.UI && UI.cards[id];
  if (!c) throw new Error('No existe la tarjeta de datos ' + id + ' (¿se abrió su bloque?)');
  c.load(clave); await W(400); await listo();
};
var tarjeta = (n, i) => {
  const cs = [...document.querySelectorAll('#panel-' + n + ' .card')].filter(c => c.getBoundingClientRect().height > 0);
  if (typeof i === 'string') return cs.find(c => { const h = c.querySelector('h2'); return h && h.innerText.trim().startsWith(i); });
  return cs[i || 0];
};
var abrirMetodo = nodo => { const d = [...nodo.querySelectorAll('details')].find(x => /Método y fuentes|Method and sources/.test(x.innerText)); if (d) d.open = true; return d; };
/* the floating buttons of the navigator (back to top, last change) and the toasts
   stay out of the captures */
(() => {
  const st = document.createElement('style');
  st.textContent = '.lnav-fbtn, .lnav-float, [data-lnav="top"], [data-lnav="last"], .toast-stack { display: none !important; }';
  document.head.appendChild(st);
})();
