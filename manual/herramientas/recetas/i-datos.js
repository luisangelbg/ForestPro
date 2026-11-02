// ventana 1400x1000
/* Introducción: la tarjeta de datos del Bloque 3 (árboles del cafetal cargados), la pieza con que se cargan los
   datos en todos los bloques: ejemplo, archivo, tabla pegada, a mano, inventario cargado y plantilla */
(async () => {
  await bloque(3, 'cafetal');
  const t = tarjeta(3, 0);
  const dc = t.querySelector('.data-card');
  const det = dc.querySelector('details.data-preview'); if (det) det.open = true;
  await W(500);
  irA(t, 90); await W(600);
  const h = t.querySelector('h2'), hint = t.querySelector(':scope > .hint');
  /* la tarjeta con su título y la primera tarjeta de datos, sin las demás */
  const sc = dc.querySelector('.table-scroll'); if (sc) { sc.style.maxHeight = '230px'; sc.style.overflow = 'hidden'; }
  await W(300);
  return caja([h, hint, dc], 10);
})()
