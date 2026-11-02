// ventana 1400x1000
/* Capítulo 9: Factor de forma con los valores por omisión (32 cm, 24 m, 0.85 m³) y «Calcular» */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Factor de forma', 'Form factor'));
  [...t.querySelectorAll('button')].find(b => /^(Calcular|Compute)$/.test(b.innerText.trim())).click();
  await W(600);
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), t.querySelector('.interp')], 12);
})()
