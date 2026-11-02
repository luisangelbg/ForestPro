// ventana 1400x1000
/* Capítulo 9: Madera aserrada con lo aserrado de las 12 trozas */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Madera aserrada', 'Sawn lumber'));
  irA(t, 200); await W(800);
  const tab = t.querySelector('.res-host .tbl-card');
  return caja([t.querySelector('h2'), tab], 12);
})()
