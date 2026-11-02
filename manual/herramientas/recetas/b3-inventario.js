// ventana 1400x1000
/* Capítulo 3: el bosque mesófilo de ejemplo cargado: tarjeta de parcelas, diseño por omisión abierto, mosaicos y diseño leído */
(async () => {
  await bloque(3, 'mesofilo');
  const t = tarjeta(3, 0);
  const hs = t.querySelectorAll(':scope > h3');
  const d = t.querySelector(':scope > details'); d.open = true;
  const rh = t.querySelector(':scope > .res-host');
  irA(hs[1], 200); await W(800);
  return caja([hs[1], rh], 10);
})()
