// ventana 1400x1000
/* Capítulo 3: Expansión a la hectárea con el cafetal de ejemplo: controles y área basal por parcela, coloreada por manejo */
(async () => {
  await bloque(3, 'cafetal');
  const t = tarjeta(3, 1);
  const f = t.querySelector('.fig-card');
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), f], 10);
})()
