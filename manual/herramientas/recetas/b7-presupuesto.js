// ventana 1400x1000
/* Capítulo 7: Presupuesto de carbono del sistema con «Calcular con el cafetal de ejemplo»: campos, mosaicos y
   barras apiladas por reservorio */
(async () => {
  await bloque(7, 'cafetal');
  await W(800); await listo();
  const t = tarjeta(7, L('Presupuesto de carbono', 'Carbon budget'));
  irA(t, 200); await W(800);
  const fig = t.querySelector('.fig-card');
  const c = caja([t], 4).split(',').map(Number);
  c[3] = Math.round(fig.getBoundingClientRect().bottom + window.scrollY + 8 - c[1]);
  return c.join(',');
})()
