// ventana 1400x1000
/* Capítulo 8: el mapa estático en UTM con la superficie de rendimiento del cafetal interpolada por kriging ordinario */
(async () => {
  await bloque(8, 'mesofilo');
  await W(1000); await listo();
  await cargar('b8i', 'rend'); await W(800);
  vis('#panel-8 button', L('Interpolar', 'Interpolate')).click(); await W(1500); await listo();
  const f = tarjeta(8, L('El mapa', 'The map')).querySelector('.res-host .fig-card');
  irA(f, 200); await W(800);
  return caja([f], 6);
})()
