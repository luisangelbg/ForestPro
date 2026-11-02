// ventana 1600x1000
/* Capítulo 3: índice de valor de importancia del cafetal de ejemplo, tabla y componentes */
(async () => {
  await bloque(3, 'cafetal');
  const t = tarjeta(3, L('Estructura del rodal', 'Stand structure'));
  const rh = t.querySelector(':scope > .res-host');
  const tb = [...rh.querySelectorAll('.tbl-card')].find(c => /Índice de valor|Importance value/.test(c.innerText));
  const f = [...rh.querySelectorAll('.fig-card')].find(c => /IVI/.test(c.innerText));
  irA(tb, 200); await W(800);
  return caja([tb, f], 10);
})()
