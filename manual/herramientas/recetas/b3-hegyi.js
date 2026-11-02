// ventana 1400x1000
/* Capítulo 3: competencia de Hegyi contra DAP en el cafetal de ejemplo (radio de 6 m, árboles lejos del borde) */
(async () => {
  await bloque(3, 'cafetal');
  const t = tarjeta(3, L('Estructura del rodal', 'Stand structure'));
  const f = [...t.querySelectorAll('.fig-card')].find(c => /Hegyi/.test(c.innerText));
  irA(f, 200); await W(800);
  return caja([f], 10);
})()
