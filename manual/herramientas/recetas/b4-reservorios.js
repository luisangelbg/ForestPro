// ventana 1400x1000
/* Capítulo 4: Reservorios del cafetal de ejemplo (árboles vivos, muertos en pie, hojarasca y suelo): la tabla
   Reservorios de carbono, con la columna «En el error del total», y su interpretación (sin el mosaico ni la barra
   apilada, que el texto describe) */
(async () => {
  await bloque(4, 'cafetal');
  await cargar('b4l', 'cafetal'); await cargar('b4s', 'cafetal');
  const t = tarjeta(4, L('Reservorios y cambio entre inventarios', 'Pools and change between inventories'));
  const host = t.querySelector('.res-host');
  const tabla = [...host.querySelectorAll('table')].pop();
  const card = tabla.closest('.tbl-card') || tabla;
  const titulo = card.querySelector('.tbl-title') || card.previousElementSibling || card;
  const interp = host.querySelector('.interp');
  irA(titulo, 200); await W(800);
  return caja([titulo, card, interp], 10);
})()
