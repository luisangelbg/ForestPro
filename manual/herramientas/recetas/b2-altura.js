// ventana 1400x1000
/* Capítulo 2: Relación altura–diámetro con la parcela de pino con alturas faltantes (b2h): controles, comparación y curvas (sin la tabla de coeficientes) */
(async () => {
  await bloque(2);
  await cargar('b2h', 'pino');
  const t = tarjeta(2, 4);
  const g = t.querySelector(':scope > .form-grid'), rh = t.querySelector(':scope > .res-host');
  const f = rh.querySelector('.fig-card');
  /* sin la tabla de coeficientes (sus valores van en el texto): la comparación y la figura */
  rh.querySelectorAll('.tbl-card')[1].style.display = 'none'; await W(300);
  irA(g, 200); await W(800);
  return caja([g, f], 10);
})()
