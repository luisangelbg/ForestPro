// ventana 1400x1000
/* Capítulo 5: Proyección del rodal y tabla de producción con las remediciones del pino de ejemplo y los valores que
   la app propone: controles, sistema de Clutter, mosaicos y las dos figuras */
(async () => {
  await bloque(5, 'pino');
  const t = tarjeta(5, L('Proyección del rodal y tabla de producción', 'Stand projection and yield table'));
  irA(t, 200); await W(800);
  const two = t.querySelector('.figs-2');
  return caja([t.querySelector("h2"), two], 5);
})()
