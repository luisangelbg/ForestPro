// ventana 1400x1000
/* Introducción: «Cómo funciona», los seis pasos de un trabajo forestal (Bloque 1) */
(async () => {
  await W(1800);
  const hero = document.querySelector('.hero'); if (hero) hero.style.boxShadow = 'none';  /* su sombra cae sobre el título */
  const ns = seccion(L('Cómo funciona', 'How it works')); irA(ns[0], 220); await W(600);
  return caja(ns, 8);
})()
