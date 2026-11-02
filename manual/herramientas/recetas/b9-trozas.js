// ventana 1400x1000
/* Capítulo 9: Cubicación de trozas con las 12 trozas de pino del ejemplo: la tabla editable y los mosaicos */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Cubicación de trozas', 'Log scaling'));
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), t.querySelector('.res-host .results-summary')], 12);
})()
