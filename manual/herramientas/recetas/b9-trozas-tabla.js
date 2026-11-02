// ventana 1400x1000
/* Capítulo 9: la tabla «Volumen por troza» de las 12 trozas de pino */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Cubicación de trozas', 'Log scaling'));
  const tab = t.querySelector('.res-host .tbl-card');
  irA(tab, 200); await W(800);
  return caja([tab], 10);
})()
