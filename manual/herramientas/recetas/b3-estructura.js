// ventana 1400x1000
/* Capítulo 3: Estructura del rodal con el bosque mesófilo de ejemplo: controles, distribución diamétrica con su Weibull y la tabla de parámetros y bondad de ajuste */
(async () => {
  await bloque(3, 'mesofilo');
  const t = tarjeta(3, L('Estructura del rodal', 'Stand structure'));
  irA(t, 200); await W(800);
  const rh = t.querySelector(':scope > .res-host');
  return caja([t.querySelector('h2'), rh.querySelector('.tbl-card')], 10);
})()
