// ventana 1400x1000
/* Capítulo 4: Densidad de la madera con el cafetal de ejemplo: el botón de la base mundial y la densidad asignada a
   cada especie del inventario, con su nivel y la desviación que usa el Monte Carlo (la tabla de referencia, de 42
   renglones, queda fuera del recorte) */
(async () => {
  await bloque(4, 'cafetal');
  const t = tarjeta(4, L('Densidad de la madera', 'Wood density'));
  const fila = porId('b4gwdd').closest('.src-row');
  const host = t.querySelector('.res-host');
  irA(fila, 200); await W(700);
  return caja([fila, host], 10);
})()
