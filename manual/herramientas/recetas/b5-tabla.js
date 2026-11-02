// ventana 1400x1000
/* Capítulo 5: la tabla de producción editable del pino de ejemplo (de 5 a 39 años) */
(async () => {
  await bloque(5, 'pino');
  const t = tarjeta(5, L('Proyección del rodal y tabla de producción', 'Stand projection and yield table'));
  const h4 = [...t.querySelectorAll('h4')].find(h => /editable/.test(h.innerText));
  const grid = h4.nextElementSibling;
  irA(h4, 200); await W(800);
  return caja([h4, grid], 4);
})()
