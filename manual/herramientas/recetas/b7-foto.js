// ventana 1400x1000
/* Capítulo 7: Sombra a partir de una fotografía del dosel con la foto de ejemplo (sintética): controles, mosaicos
   y la foto junto a su segmentación */
(async () => {
  await bloque(7, 'cafetal');
  await W(800); await listo();
  const t = tarjeta(7, L('Sombra a partir de una fotografía', 'Shade from a photograph'));
  irA(t, 200); await W(800);
  const pair = t.querySelector('.photo-pair');
  const c = caja([t], 4).split(',').map(Number);
  c[3] = Math.round(pair.getBoundingClientRect().bottom + window.scrollY + 10 - c[1]);
  return c.join(',');
})()
