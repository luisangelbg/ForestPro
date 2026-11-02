// ventana 1400x1000
/* Capítulo 6: Patrón espacial de los árboles con la parcela mapeada de 50 × 50 m, todos los tallos */
(async () => {
  await bloque(6, 'mesofilo');
  const t = tarjeta(6, L('Patrón espacial', 'Spatial pattern'));
  irA(t, 200); await W(800);
  const tiles = t.querySelector('.res-host > div:not(.messages)'), two = t.querySelector('.figs-2'), it = t.querySelector('.res-host .interp');
  return caja([tiles, two, it], 8);
})()
