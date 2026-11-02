// ventana 1400x1000
/* Introducción: lo que trae cada resultado. Bloque 3 › Estimación y error de muestreo con el cafetal: los mosaicos,
   la tabla, la interpretación y el recuadro «Método y fuentes» abierto */
(async () => {
  await bloque(3, 'cafetal');
  const t = tarjeta(3, L('Estimación y error de muestreo', 'Estimation and sampling error'));
  abrirMetodo(t); await W(500);
  irA(t, 220); await W(800);
  return caja([t], 4);
})()
