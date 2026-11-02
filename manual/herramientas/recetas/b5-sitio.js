// ventana 1400x1000
/* Capítulo 5: Índice de sitio con las 30 parcelas permanentes del pino de ejemplo (curvas y clases) */
(async () => {
  await bloque(5, 'pino');
  const t = tarjeta(5, L('Índice de sitio', 'Site index'));
  irA(t, 200); await W(800);
  const h = t.querySelector('h2');
  const fig = t.querySelector('svg');
  const hasta = fig ? (fig.closest('.fig-card, figure') || fig) : t;
  return caja([h, hasta], 10);
})()
