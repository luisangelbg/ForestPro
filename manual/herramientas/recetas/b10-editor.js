// ventana 1400x1000
/* Capítulo 10: el editor ✎ abierto sobre la figura del VPN según la tasa (Bloque 9, plantación de pino): la figura y el panel */
(async () => {
  try { localStorage.removeItem('forestpro:figedit'); } catch (e) {}
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Costo y rentabilidad', 'Cost and profitability'));
  const f = [...t.querySelectorAll('figure.fig-card')][1];
  irA(f, 200); await W(500);
  f.querySelector('.fig-ed').click(); await W(1500);
  const p = document.querySelector('.fe-title').closest('.fe-head').parentElement;
  return caja([p], 6);
})()
