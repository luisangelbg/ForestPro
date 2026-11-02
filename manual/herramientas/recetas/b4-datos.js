// ventana 1400x1000
/* Capítulo 4: la tarjeta Datos y ecuaciones con el cafetal de ejemplo (ecuación por omisión, raíces, carbono y las
   tres reglas del ejemplo), hasta el catálogo de ecuaciones, con las marcas numeradas de la figura 4.1 */
(async () => {
  await bloque(4, 'cafetal');
  const t = tarjeta(4, L('Datos y ecuaciones', 'Data and equations'));
  irA(t, 200); await W(700);
  const cat = [...t.querySelectorAll('details')].find(d => /catálogo|catalog/i.test(d.querySelector('summary').innerText));
  const rt = t.getBoundingClientRect(), rh = t.querySelector('h2').getBoundingClientRect(), rc = cat.getBoundingClientRect();
  const bx = rt.left + scrollX - 4, by = rh.top + scrollY - 14, bw = rt.width + 8, bh = rc.bottom - rh.top + 26;
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left + scrollX + (dx || 0) - bx) / bw * 100).toFixed(1), +((r.top + scrollY + r.height / 2 + (dy || 0) - by) / bh * 100).toFixed(1)]; };
  const campo = id => porId(id).closest('.field').querySelector('label');
  const h3 = [...t.querySelectorAll('h3')];
  window.__marcas = [
    m(1, porId('b4ex'), -14),
    m(2, campo('b4def'), -12),
    m(3, campo('b4E'), -12),
    m(4, campo('b4rootSel'), -12),
    m(5, campo('b4rs'), -12),
    m(6, campo('b4cf'), -12),
    m(7, campo('b4dead'), -12),
    m(8, h3[0], -14),
    m(9, h3[1], -14),
    m(10, cat.querySelector('summary'), -14),
  ];
  return [bx, by, bw, bh].map(Math.round).join(',');
})()
