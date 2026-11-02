// ventana 1400x1000
/* Capítulo 4: Cambio de existencias con el carbono del pino de ejemplo (30 parcelas medidas dos veces, pareado):
   sólo la gráfica (los mosaicos y las opciones los describe el texto) */
(async () => {
  await bloque(4, 'cafetal');
  await cargar('b4c', 'pino');
  const t = tarjeta(4, L('Reservorios y cambio entre inventarios', 'Pools and change between inventories'));
  const hosts = [...t.querySelectorAll('.res-host')];
  const host = hosts[hosts.length - 1];
  const fig = [...host.children].find(n => n.querySelector && n.querySelector('svg'));
  irA(host, 200); await W(800);
  return caja([fig], 6);
})()
