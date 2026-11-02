// ventana 1700x1000
/* Capítulo 5: Modelos de crecimiento con el árbol T1 del pino de ejemplo (volumen): la comparación de los cuatro (ventana ancha: a 1400 px la última columna de la comparación queda escondida)
   modelos y las dos figuras */
(async () => {
  await bloque(5, 'pino');
  const t = tarjeta(5, L('Modelos de crecimiento', 'Growth models'));
  irA(t, 200); await W(800);
  const two = t.querySelector('.figs-2');
  return caja([t.querySelector('h2'), two], 10);
})()
