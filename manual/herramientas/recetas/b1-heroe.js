// ventana 1400x900
/* Capítulo 1: el héroe de la portada (Bloque 1) con sus botones, las cuatro insignias y la sección del tronco, con marcas */
(async () => {
  await W(1800);
  window.scrollTo(0, 0); await W(400);
  const h = document.querySelector('#panel-1 .hero');
  const c = caja([h], 6).split(',').map(Number);
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left + window.scrollX + (dx || 0) - c[0]) / c[2] * 100).toFixed(1), +((r.top + window.scrollY + r.height / 2 + (dy || 0) - c[1]) / c[3] * 100).toFixed(1)]; };
  const bd = document.querySelectorAll('#panel-1 .badge');
  window.__marcas = [m(1, porId('startBtn'), -14), m(2, porId('modulesBtn'), -14), m(3, porId('citeBtn'), porId('citeBtn').getBoundingClientRect().width + 14), m(4, bd[0], -14), m(5, porId('heroArt'), 20, -120)];
  return c.join(',');
})()
