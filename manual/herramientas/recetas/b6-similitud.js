// ventana 1400x1000
/* Capítulo 6: el dendrograma UPGMA y la ordenación NMDS con Bray–Curtis (mesófilo, coloreado por estrato) */
(async () => {
  await bloque(6, 'mesofilo');
  const t = tarjeta(6, L('Similitud entre sitios', 'Similarity among sites'));
  const two = t.querySelector('.figs-2'), it = t.querySelector('.interp');
  irA(two, 200); await W(800);
  return caja([two, it], 6);
})()
