// ventana 1400x1000
/* Capítulo 9: la figura de los pies tabla por troza según las tres reglas, con la interpretación */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Cubicación de trozas', 'Log scaling'));
  const f = t.querySelector('figure.fig-card'), it = t.querySelector('.interp');
  irA(f, 200); await W(800);
  return caja([it, f], 10);
})()
