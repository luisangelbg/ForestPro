// ventana 1400x1000
/* Capítulo 3: Relascopía con los 15 puntos del bosque mesófilo de ejemplo (b3r, FAB = 2) */
(async () => {
  await bloque(3);
  await cargar('b3r', 'mesofilo');
  const t = tarjeta(3, 4);
  const rh = t.querySelector(':scope > .res-host');
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), rh.firstElementChild], 10);
})()
