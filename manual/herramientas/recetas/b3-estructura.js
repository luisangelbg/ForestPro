// ventana 1400x1000
/* Capítulo 3: Estructura del rodal con el bosque mesófilo de ejemplo (distribución diamétrica y su Weibull) */
(async () => {
  await bloque(3, 'mesofilo');
  const t = tarjeta(3, L('Estructura del rodal', 'Stand structure'));
  irA(t, 200); await W(800);
  const fig = t.querySelector('figure, .fig-card, svg');
  const h = t.querySelector('h2');
  /* el título, los controles y la primera figura */
  const hasta = fig ? (fig.closest('.fig-card, figure, .card-fig') || fig) : t;
  return caja([h, hasta], 10);
})()
