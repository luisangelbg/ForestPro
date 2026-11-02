// ventana 1400x900
/* Capítulo 10: la figura del VPN según la tasa (Bloque 9, plantación de pino) abierta en el estudio de figuras: la ventana entera */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Costo y rentabilidad', 'Cost and profitability'));
  const f = [...t.querySelectorAll('figure.fig-card')][1];
  irA(f, 200); await W(500);
  f.querySelector('.lfs-open').click(); await W(4500);
  return null;
})()
