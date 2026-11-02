// ventana 1400x1000
/* Capítulo 8: Cuadrícula de muestreo en el predio del mesófilo con los valores por omisión (sistemática, 500 m,
   sin arranque aleatorio): controles, mosaicos y comienzo de la tabla de puntos */
(async () => {
  await bloque(8, 'mesofilo');
  await W(1000); await listo();
  vis('#panel-8 button', L('Generar los puntos', 'Generate the points')).click(); await W(800); await listo();
  const t = tarjeta(8, L('Cuadrícula de muestreo', 'Sampling grid'));
  irA(t, 200); await W(800);
  const fila = t.querySelectorAll('.tbl-card tbody tr')[5];
  const c = caja([t], 4).split(',').map(Number);
  c[3] = Math.round(fila.getBoundingClientRect().bottom + window.scrollY + 6 - c[1]);
  return c.join(',');
})()
