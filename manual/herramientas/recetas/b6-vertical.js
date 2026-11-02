// ventana 1400x1000
/* Capítulo 6: Estructura vertical del mesófilo: mosaicos, tabla de Pretzsch por estrato y barras por zona */
(async () => {
  await bloque(6, 'mesofilo');
  const t = tarjeta(6, L('Estructura vertical', 'Vertical structure'));
  irA(t, 200); await W(800);
  const tiles = t.querySelector('.res-host > div'), tb = t.querySelector('.tbl-card'), fig = t.querySelector('.fig-card');
  return caja([tiles, tb, fig], 8);
})()
