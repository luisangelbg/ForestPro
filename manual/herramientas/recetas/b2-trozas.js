// ventana 1400x1000
/* Capítulo 2: un árbol de 35 cm y 24 m (valores por omisión) troceado con Max–Burkhart ajustado al pino de ejemplo */
(async () => {
  await bloque(2, 'pino');
  const t = tarjeta(2, 3);
  [...t.querySelectorAll('button')].find(b => /Ajustar con las secciones|Fit with the sections/.test(b.innerText)).click();
  await listo();
  const g = t.querySelector(':scope > .form-grid'), rh = t.querySelectorAll(':scope > .res-host');
  /* sin la comparación ni los coeficientes, que salen en la figura anterior: los controles y las trozas */
  rh[0].style.display = 'none'; await W(300);
  irA(g, 200); await W(800);
  return caja([g, rh[1]], 10);
})()
