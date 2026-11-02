// ventana 1400x1000
/* Capítulo 3: Tamaño de muestra con el CV del bosque mesófilo de ejemplo («Tomar el CV del inventario cargado») y la asignación por estrato */
(async () => {
  await bloque(3, 'mesofilo');
  const t = tarjeta(3, 3);
  [...t.querySelectorAll('button')].find(b => /Tomar el CV|Take the CV/.test(b.innerText)).click();
  await listo();
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), t.querySelector(':scope > .res-host')], 10);
})()
