// ventana 1400x1000
/* Capítulo 5: Incrementos y turno biológico con el análisis troncal del pino de ejemplo (volumen, 6 árboles):
   la figura del ICA y el IMA y la tabla del turno de cada árbol */
(async () => {
  await bloque(5, 'pino');
  const t = tarjeta(5, L('Incrementos y turno biológico', 'Increments and biological rotation'));
  const host = t.querySelector('.res-host');
  const tbl = host.querySelectorAll('.tbl-card')[0] || host.querySelector('table');
  irA(host, 200); await W(800);
  return caja([host.firstElementChild, tbl], 10);
})()
