// ventana 1400x1000
/* Capítulo 6: la tarjeta La comunidad con el bosque mesófilo de ejemplo: la tarjeta de datos, los mosaicos y el
   comienzo de la matriz de sitios por especies */
(async () => {
  await bloque(6, 'mesofilo');
  const t = tarjeta(6, L('La comunidad', 'The community'));
  irA(t, 200); await W(800);
  const tb = t.querySelector('.tbl-card .table-scroll');
  const r = tb.getBoundingClientRect();
  /* down to the fifth row of the matrix */
  const fila = tb.querySelectorAll('tbody tr')[4];
  const c = caja([t], 4).split(',').map(Number);
  c[3] = Math.round(fila.getBoundingClientRect().bottom + window.scrollY + 6 - c[1]);
  return c.join(',');
})()
