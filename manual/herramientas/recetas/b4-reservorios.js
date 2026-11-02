// ventana 1400x1000
/* Capítulo 4: Reservorios del cafetal de ejemplo (árboles vivos, muertos en pie, hojarasca y suelo, sin la madera
   caída, que es del mesófilo): mosaico, figura y tabla */
(async () => {
  await bloque(4, 'cafetal');
  await cargar('b4l', 'cafetal'); await cargar('b4s', 'cafetal');
  const t = tarjeta(4, L('Reservorios y cambio entre inventarios', 'Pools and change between inventories'));
  const host = t.querySelector('.res-host');
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), host], 10);
})()
