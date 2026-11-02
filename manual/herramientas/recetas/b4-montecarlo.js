// ventana 1400x1000
/* Capítulo 4: Incertidumbre por Monte Carlo con el cafetal de ejemplo, valores por omisión (1000 iteraciones),
   después de «Correr el Monte Carlo»: controles, mosaicos e histograma */
(async () => {
  await bloque(4, 'cafetal');
  const t = tarjeta(4, L('Incertidumbre por Monte Carlo', 'Uncertainty by Monte Carlo'));
  [...t.querySelectorAll('button')].find(b => /Correr el Monte Carlo|Run the Monte Carlo/.test(b.innerText)).click();
  await W(500); await listo(120000);
  irA(t, 200); await W(800);
  const host = t.querySelector('.res-host');
  const fig = [...host.children].find(n => n.querySelector && n.querySelector('svg'));
  return caja([t.querySelector('h2'), fig], 10);
})()
