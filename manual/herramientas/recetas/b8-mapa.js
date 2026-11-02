// ventana 1400x1000
/* Capítulo 8: El mapa con el bosque mesófilo de ejemplo (parcelas por estrato y predio), sin el fondo en línea
   (apagado por omisión), con las marcas numeradas de la figura 8.1 */
(async () => {
  await bloque(8, 'mesofilo');
  await W(1000); await listo();
  const t = tarjeta(8, L('El mapa', 'The map'));
  irA(t, 200); await W(900);
  const dr = porId('b8draw').parentElement;
  const nodos = [t.querySelector('h2'), dr];
  const c = caja(nodos, 30).split(',').map(Number);
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left + window.scrollX + (dx || 0) - c[0]) / c[2] * 100).toFixed(1), +((r.top + window.scrollY + r.height / 2 + (dy || 0) - c[1]) / c[3] * 100).toFixed(1)]; };
  const btnTxt = s => [...t.querySelectorAll('button, label.btn')].find(b => b.innerText.trim().startsWith(s));
  window.__marcas = [
    m(1, porId('b8ex'), -14),
    m(2, btnTxt(L('Usar el inventario', 'Use the Block')), -14),
    m(3, btnTxt(L('Importar', 'Import')), -14),
    m(4, porId('b8lPlots').parentElement, -14),
    m(5, porId('b8tiles').parentElement, -14),
    m(6, t.querySelector(".map-tools"), t.querySelector(".map-tools").getBoundingClientRect().width + 16),
    m(7, t.querySelector(".map-scale"), t.querySelector(".map-scale").getBoundingClientRect().width + 16),
    m(8, porId('b8draw'), -14),
  ];
  return c.join(',');
})()
