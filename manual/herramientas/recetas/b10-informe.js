// ventana 1400x1000
/* Capítulo 10: la tarjeta Informe con el cafetal de ejemplo abierto en los bloques 3, 4 y 7 y el pino en el 9, sus campos
   llenos y «Vista previa» oprimida (el mensaje dice cuántos bloques, figuras y tablas entran) */
(async () => {
  await bloque(3, 'cafetal'); await ejemplo('cafetal', 4); await ejemplo('cafetal', 7); await ejemplo('pino', 9);
  goStep(10); await W(1000);
  const set = (id, v) => { const n = porId(id); n.value = v; n.dispatchEvent(new Event('input')); };
  set('b10title', L('Inventario forestal y carbono', 'Forest inventory and carbon')); set('b10site', L('Cafetal bajo sombra (ejemplo)', 'Shade coffee farm (example)'));
  set('b10author', L('Brigada de inventario', 'Inventory crew')); set('b10date', '2026-11-01');
  set('b10notes', L('Inventario de las 25 parcelas del cafetal de ejemplo, con su biomasa, su carbono y su sombra.', 'Inventory of the 25 plots of the example coffee farm, with their biomass, carbon and shade.'));
  const t = tarjeta(10, L('Informe', 'Report'));
  [...t.querySelectorAll('button')].find(b => /^(Vista previa|Preview)$/.test(b.innerText.trim())).click();
  await W(1500);
  irA(t, 200); await W(800);
  return caja([t.querySelector('h2'), t.querySelector('.messages')], 12);
})()
