// ventana 1400x1000
/* Capítulo 9: las dos figuras de la plantación de pino: el flujo de efectivo por año y el VPN según la tasa */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Costo y rentabilidad', 'Cost and profitability'));
  const fs = [...t.querySelectorAll('figure.fig-card')];
  irA(fs[0], 200); await W(800);
  return caja(fs, 10);
})()
