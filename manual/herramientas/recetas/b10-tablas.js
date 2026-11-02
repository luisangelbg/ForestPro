// ventana 1400x1000
/* Capítulo 10: Todas las tablas y Proyecto, con el cafetal (bloques 3, 4 y 7) y el pino (Bloque 9) abiertos; se oprimen
   «⤓ Libro de Excel…» y «⤓ Guardar el proyecto (JSON)» sin descargar nada, para que se vean sus mensajes */
(async () => {
  await bloque(3, 'cafetal'); await ejemplo('cafetal', 4); await ejemplo('cafetal', 7); await ejemplo('pino', 9);
  goStep(10); await W(1000);
  window.download = () => {};
  const a = tarjeta(10, L('Todas las tablas', 'All the tables')), b = tarjeta(10, L('Proyecto', 'Project'));
  a.querySelector('button.btn-primary').click(); await W(400);
  b.querySelector('button.btn-primary').click(); await W(400);
  irA(a, 200); await W(800);
  return caja([a, b], 6);
})()
