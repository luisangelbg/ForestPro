// ventana 1400x1000
/* Capítulo 8: Polígonos y áreas con el predio del mesófilo (9 vértices) */
(async () => {
  await bloque(8, 'mesofilo');
  await W(1000); await listo();
  const t = tarjeta(8, L('Polígonos y áreas', 'Polygons and areas'));
  irA(t, 200); await W(800);
  const it = t.querySelector('.interp');
  const c = caja([t], 4).split(',').map(Number);
  c[3] = Math.round(it.getBoundingClientRect().bottom + window.scrollY + 8 - c[1]);
  return c.join(',');
})()
