// ventana 1400x1000
/* Capítulo 9: Costo y rentabilidad de una plantación con el ejemplo del pino a 25 años: controles, flujo y mosaicos */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Costo y rentabilidad', 'Cost and profitability'));
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), t.querySelector('.res-host .results-summary')], 12);
})()
