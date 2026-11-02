// ventana 1400x1000
/* Capítulo 9: Conversión de unidades: 250 m³/ha de volumen a las demás unidades, y la leña apilada por omisión */
(async () => {
  await bloque(9, 'pino');
  const t = tarjeta(9, L('Conversión de unidades', 'Unit conversion'));
  const k = porId('b9kind'); k.value = 'volha'; k.dispatchEvent(new Event('change'));
  await W(200);
  const fr = porId('b9from'); fr.value = 'm3ha'; fr.dispatchEvent(new Event('change'));
  const v = porId('b9val'); v.value = 250; v.dispatchEvent(new Event('input'));
  await W(500);
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), porId('b9sto')], 14);
})()
