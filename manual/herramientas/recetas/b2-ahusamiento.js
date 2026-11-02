// ventana 1400x1000
/* Capítulo 2: Ahusamiento ajustado con las secciones del pino de ejemplo: comparación de los dos modelos y perfil relativo */
(async () => {
  await bloque(2, 'pino');
  const t = tarjeta(2, 3);
  [...t.querySelectorAll('button')].find(b => /Ajustar con las secciones|Fit with the sections/.test(b.innerText)).click();
  await listo();
  const rh = t.querySelectorAll(':scope > .res-host')[0];
  const tb = rh.querySelector('.tbl-card'), f = rh.querySelector('.fig-card');
  irA(tb, 200); await W(800);
  /* sin las tablas de coeficientes: la comparación y el perfil */
  const cs = [...rh.querySelectorAll('.tbl-card')].slice(1); cs.forEach(c => c.style.display = 'none'); await W(300);
  return caja([tb, f], 10);
})()
