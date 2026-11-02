// ventana 1400x1000
/* Capítulo 6: la curva de acumulación y la tabla de diversidad observada y asintótica (mesófilo) */
(async () => {
  await bloque(6, 'mesofilo');
  const t = tarjeta(6, L('Números de Hill', 'Hill numbers'));
  const figs = [...t.querySelectorAll('.res-host > .fig-card')], tb = t.querySelector('.tbl-card');
  irA(figs[0], 200); await W(800);
  return caja([figs[0], tb], 6);
})()
