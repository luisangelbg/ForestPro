// ventana 1400x1000
/* Capítulo 4: Cambio de existencias con el carbono del pino de ejemplo (30 parcelas medidas dos veces, pareado):
   las opciones, los mosaicos y la gráfica (sin la tarjeta de datos) */
(async () => {
  await bloque(4, 'cafetal');
  await cargar('b4c', 'pino');
  const t = tarjeta(4, L('Reservorios y cambio entre inventarios', 'Pools and change between inventories'));
  const opciones = porId('b4paired').closest('.form-grid');
  const hosts = [...t.querySelectorAll('.res-host')];
  const fig = [...hosts[hosts.length - 1].children].find(n => n.querySelector && n.querySelector('svg'));
  irA(opciones, 200); await W(800);
  return caja([opciones, fig], 10);
})()
