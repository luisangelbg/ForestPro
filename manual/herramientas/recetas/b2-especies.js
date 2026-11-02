// ventana 1400x1000
/* Capítulo 2: las dos figuras y el resumen por especie de los árboles de sombra del cafetal de ejemplo (b2t) */
(async () => {
  await bloque(2);
  await cargar('b2t', 'cafetal');
  const t = tarjeta(2, 0);
  const rh = t.querySelectorAll(':scope > .res-host')[1];
  const f = rh.querySelector('.figs-2'), tb = rh.querySelector('.tbl-card');
  irA(f, 200); await W(800);
  return caja([f, tb], 10);
})()
