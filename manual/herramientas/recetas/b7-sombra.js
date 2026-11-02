// ventana 1400x1000
/* Capítulo 7: Sombra a partir del inventario con el cafetal de ejemplo: botones, mosaicos, resumen por manejo y
   la gráfica de cobertura */
(async () => {
  await bloque(7, 'cafetal');
  await W(800); await listo();
  const t = tarjeta(7, L('Sombra a partir del inventario', 'Shade from the inventory'));
  irA(t, 200); await W(800);
  const fig = t.querySelector('.fig-card');
  const c = caja([t], 4).split(',').map(Number);
  c[3] = Math.round(fig.getBoundingClientRect().bottom + window.scrollY + 8 - c[1]);
  return c.join(',');
})()
