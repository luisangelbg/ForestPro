// ventana 1400x1000
/* Capítulo 4: Necromasa, hojarasca y suelo, segunda parte: la hojarasca y el carbono del suelo del cafetal de
   ejemplo, cada una con su ejemplo cargado, hasta los mosaicos del suelo */
(async () => {
  await bloque(4, 'cafetal');
  await cargar('b4l', 'cafetal'); await cargar('b4s', 'cafetal');
  const t = tarjeta(4, L('Necromasa, hojarasca y suelo', 'Necromass, litter and soil'));
  const h3 = [...t.querySelectorAll('h3')].find(h => /Hojarasca|Litter/.test(h.innerText));
  const host = t.querySelectorAll('.res-host')[2];
  const tiles = host.querySelector('.stat-tile').parentElement;
  irA(h3, 200); await W(800);
  return caja([h3, tiles], 10);
})()
