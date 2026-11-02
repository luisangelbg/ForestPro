// ventana 1400x1000
/* Capítulo 8: Interpolación entre parcelas con el rendimiento del cafetal (tarjeta b8i, clave rend), kriging
   ordinario esférico por omisión: mosaicos, variograma y tabla del modelo */
(async () => {
  await bloque(8, 'mesofilo');
  await W(1000); await listo();
  await cargar('b8i', 'rend'); await W(800);
  vis('#panel-8 button', L('Interpolar', 'Interpolate')).click(); await W(1500); await listo();
  const t = tarjeta(8, L('Interpolación', 'Interpolation'));
  const host = t.querySelector('.res-host');
  irA(host, 200); await W(800);
  return caja([host.querySelector(':scope > div'), host.querySelector('.fig-card'), host.querySelector('.tbl-card')], 8);
})()
