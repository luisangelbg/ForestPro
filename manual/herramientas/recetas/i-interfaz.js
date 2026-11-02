// ventana 1400x900
/* Introducción: la pantalla del Bloque 3 con el cafetal de ejemplo abierto, la ventana entera, con las marcas
   numeradas de la figura I.2 (el texto las explica en la lista que sigue a la figura) */
(async () => {
  await bloque(3, 'cafetal');
  window.scrollTo(0, 0); await W(500);
  const Wv = innerWidth, Hv = innerHeight;
  /* a mark on a node: at its left edge (dx, dy in px), as percentages of the window */
  const m = (n, node, dx, dy) => { if (!node) return null; const r = node.getBoundingClientRect(); return [n, +((r.left + (dx || 0)) / Wv * 100).toFixed(1), +((r.top + r.height / 2 + (dy || 0)) / Hv * 100).toFixed(1)]; };
  const q = s => document.querySelector(s);
  const buscar = [...document.querySelectorAll('button, kbd, span')].find(n => { const r = n.getBoundingClientRect(); return r.top < 100 && r.left > 900 && /Ctrl\s*K/.test(n.innerText || ''); });
  window.__marcas = [
    m(1, q('.brand-sub'), q('.brand-sub').getBoundingClientRect().width + 16),
    m(2, q('.suite-link'), -12),
    m(3, q('.lang-seg'), -4, 20),
    m(4, q('#themeBtn'), 60, 20),
    m(5, q('.lnav-side-nav') || q('#stepper'), 232, -31),
    m(6, q('.lnav-crumbs'), -10),
    m(7, q('.lnav-seg'), -10),
    m(8, buscar, -10),
    m(9, q('.lnav-toc'), -6, -60),
    m(10, q('#panel-3 .panel-title'), -12),
    m(11, tarjeta(3, 0).querySelector('h2'), -14),
    m(12, [...document.querySelectorAll('button, a')].find(n => /Modo enfocado|Focus mode/.test(n.innerText || '') && n.getBoundingClientRect().left < 300 && n.getBoundingClientRect().top > Hv - 200), 230),
  ].filter(Boolean);
  return null;
})()
