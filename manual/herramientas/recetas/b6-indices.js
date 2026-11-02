// ventana 1400x1000
/* Capítulo 6: Índices de diversidad del bosque mesófilo: los mosaicos, la riqueza observada y estimada por sitio y
   la interpretación. La tabla «Índices por sitio» se esconde para la imagen (el texto la cita aparte) */
(async () => {
  await bloque(6, 'mesofilo');
  const t = tarjeta(6, L('Índices de diversidad', 'Diversity indices'));
  t.querySelector('.res-host > .tbl-card').style.display = 'none';
  irA(t, 200); await W(800);
  const h = t.querySelector('h2'), tiles = t.querySelector('.res-host > div'), fig = t.querySelector('.fig-card'), it = t.querySelector('.interp');
  return caja([h, tiles, fig, it], 8);
})()
