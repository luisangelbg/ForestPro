// ventana 1400x1000
/* Capítulo 4: Necromasa, hojarasca y suelo, primera parte: la madera caída del bosque mesófilo de ejemplo
   (12 transectos de 30 m), con las densidades por clase y sus mosaicos (sin la tabla por transecto) */
(async () => {
  await bloque(4, 'cafetal');
  await cargar('b4w', 'mesofilo');
  await W(800); await listo();
  const t = tarjeta(4, L('Necromasa, hojarasca y suelo', 'Necromass, litter and soil'));
  /* the first tiles of the card after the data card of downed wood */
  const tile = [...t.querySelectorAll('.stat-tile')].find(n => /Volumen de madera caída|Volume of downed wood/i.test(n.innerText));
  if (!tile) throw new Error('No encuentro los mosaicos de la madera caída');
  const tiles = tile.parentElement;
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), tiles], 10);
})()
