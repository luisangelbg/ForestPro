// ventana 1400x1000
/* Capítulo 4: Biomasa y carbono del inventario con el cafetal de ejemplo: mosaicos y las dos primeras figuras
   (biomasa por parcela, aérea y raíces, y biomasa aérea por especie) */
(async () => {
  await bloque(4, 'cafetal');
  const t = tarjeta(4, L('Biomasa y carbono del inventario', 'Biomass and carbon of the inventory'));
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), t.querySelector('.figs-2')], 10);
})()
