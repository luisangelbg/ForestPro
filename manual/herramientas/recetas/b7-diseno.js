// ventana 1400x1000
/* Capítulo 7: Diseño de plantación con los valores por omisión (sin datos) */
(async () => {
  await bloque(7);
  const t = tarjeta(7, L('Diseño de plantación', 'Planting layout'));
  irA(t, 200); await W(800);
  return caja([t], 4);
})()
