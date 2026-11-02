// ventana 1600x1000
/* Capítulo 2: Ecuaciones de volumen con «Usar los árboles cubicados arriba» (pino de ejemplo): comparación, coeficientes y figuras */
(async () => {
  await bloque(2, 'pino');
  const t = tarjeta(2, 2);
  [...t.querySelectorAll('button')].find(b => /Usar los árboles cubicados|Use the trees scaled/.test(b.innerText)).click();
  await listo();
  const rh = t.querySelector(':scope > .res-host');
  irA(rh, 200); await W(800);
  return caja([...rh.children].filter(n => !n.classList.contains('interp')), 10);
})()
