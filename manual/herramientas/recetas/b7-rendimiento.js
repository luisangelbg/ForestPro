// ventana 1400x1000
/* Capítulo 7: Sombra y rendimiento del cultivo con las 25 parcelas del cafetal: mosaicos, curva y coeficientes */
(async () => {
  await bloque(7, 'cafetal');
  await W(800); await listo();
  const t = tarjeta(7, L('Sombra y rendimiento', 'Shade and crop yield'));
  const host = t.querySelector('.res-host');
  irA(host, 200); await W(800);
  const tiles = host.querySelector(':scope > div'), fig = host.querySelector('.fig-card'), tb = host.querySelector('.tbl-card');
  return caja([tiles, fig, tb], 8);
})()
