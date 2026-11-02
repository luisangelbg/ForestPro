// ventana 1400x1000
/* Capítulo 8: el mapa estático en UTM del mesófilo con la cuadrícula sistemática de 500 m generada dentro del predio
   (valores por omisión, sin arranque aleatorio: la malla sale siempre igual) */
(async () => {
  await bloque(8, 'mesofilo');
  await W(1000); await listo();
  vis('#panel-8 button', L('Generar los puntos', 'Generate the points')).click(); await W(800); await listo();
  const f = tarjeta(8, L('El mapa', 'The map')).querySelector('.res-host .fig-card');
  irA(f, 200); await W(800);
  return caja([f], 6);
})()
