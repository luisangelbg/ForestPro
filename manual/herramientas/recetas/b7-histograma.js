// ventana 1400x1000
/* Capítulo 7: el histograma de grises con el umbral de Otsu y la apertura por anillos (foto de ejemplo) */
(async () => {
  await bloque(7, 'cafetal');
  await W(800); await listo();
  const t = tarjeta(7, L('Sombra a partir de una fotografía', 'Shade from a photograph'));
  const fig = t.querySelector('.fig-card'), tb = t.querySelector('.tbl-card');
  irA(fig, 200); await W(800);
  return caja([fig, tb], 6);
})()
