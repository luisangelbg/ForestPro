// ventana 1400x1000
/* Capítulo 4: la figura Biomasa de cada árbol según su ecuación (cafetal de ejemplo, ejes logarítmicos) */
(async () => {
  await bloque(4, 'cafetal');
  const t = tarjeta(4, L('Biomasa y carbono del inventario', 'Biomass and carbon of the inventory'));
  const two = t.querySelector('.figs-2');
  let f = two.nextElementSibling;
  irA(f, 200); await W(800);
  return caja([f], 6);
})()
