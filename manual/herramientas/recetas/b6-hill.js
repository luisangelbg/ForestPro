// ventana 1400x1000
/* Capítulo 6: los dos primeros gráficos de Números de Hill, rarefacción y acumulación (mesófilo, por estrato) */
(async () => {
  await bloque(6, 'mesofilo');
  const t = tarjeta(6, L('Números de Hill', 'Hill numbers'));
  const two = t.querySelector('.figs-2');
  irA(two, 200); await W(800);
  return caja([two], 6);
})()
