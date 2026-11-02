# Guía para escribir los capítulos del manual de ForestPro

Encargo breve para quien escriba los capítulos 1 a 10 y los apéndices. Antes de empezar, lee
`LEEME.md` (carpetas, herramientas, colores), mira `es/00b-introduccion.html` (el índice general ya
trae los títulos y los `id` propuestos, y la introducción ya explica la tarjeta de datos, los mosaicos,
la interpretación, «Método y fuentes», el estudio de figuras y los cuatro conjuntos de ejemplo: no lo
repitas, remite a I.6 e I.7) y, como modelo de forma y de tono, los capítulos del manual de
CytogeneticsPro (`..\..\CytogeneticsPro\manual\es\03-bloque3.html` y `11-apendices.html`).
Todo en español, de tú, en lenguaje llano y con precisión técnica.

**Material de contenido.** El manual anterior, `docs/manual.md`, tiene para cada bloque los datos que
usa (columnas de cada tarjeta), cómo se usa cada sección, los métodos con sus ecuaciones y fuentes, la
interpretación y la validación. Úsalo como fuente, pero **comprueba cada rótulo y cada cifra en la app**:
manda lo que hace la app hoy. Los convenios y los errores que la validación encontró y corrigió están
en `tests/LEEME_VALIDACION.md`; los conjuntos de ejemplo, en `data/LEEME.md`; las fórmulas y las
referencias exactas, en el recuadro «Método y fuentes» de cada tarjeta (y en `js/blockN.js`).

## 1. Las partes y lo que hay en cada bloque

Los títulos de sección (h2) son las tarjetas de la app, con su rótulo exacto; los rótulos entre
comillas son los de la pantalla y se citan **exactamente** como aparecen en español (los campos
aparecen en versalitas en la app, pero se escriben en minúscula normal: «Coeficiente mórfico»). El h1
de los capítulos 2 a 10 es el título que la app pone sobre el bloque; el subtítulo es la línea que lo
acompaña. Ejemplos: la clave del ejemplo para `bloque(n, clave)` y, entre paréntesis, el id de la
tarjeta de datos para `cargar(id, clave)`.

| Archivo | Capítulo · subtítulo en la app | Tarjetas (h2 de la app) y lo que llevan | Ejemplo |
|---|---|---|---|
| `01-bloque1.html` | 1 · Inicio (sin título de bloque: es la portada) | Héroe «Del árbol medido a la tonelada de carbono» con «Empezar con un ejemplo →» (abre el cafetal en el Bloque 3), «Ver los módulos», «Cómo citar», las cuatro insignias y la sección de un tronco con anillos y curvas de nivel; «Cómo funciona» (6 pasos: Medir, Muestrear, Expandir, Convertir, Proyectar, Reportar); «Los nueve módulos» (una tarjeta con viñeta por bloque 2–10, cada una abre su bloque); «Datos de ejemplo» (4 tarjetas con sus botones «Abrir en …»); «Lo que hace y lo que no» (4 recuadros); «Cómo citar» (APA y BibTeX, «Copiar APA», «Copiar BibTeX»); pie con «Manual de usuario (en español)», «Pruebas» y «Validación contra R» | ninguno |
| `02-bloque2.html` | 2 · Dasometría individual — «Diámetro, área basal, volumen por fórmulas y por ecuaciones ajustadas, ahusamiento y relación altura–diámetro.» | «Árboles en pie: diámetro, área basal y volumen» (Coeficiente mórfico; Calculadora: DAP (cm), o circunferencia (cm), Altura (m); tarjeta de datos); «Cubicación: trozas y árboles por secciones» (Diámetro mayor, al centro, menor, Largo; Huber, Smalian, Newton; Diámetro mínimo en punta, «Sumar el tocón (cilindro)»; tarjeta de secciones); «Ecuaciones de volumen» («Usar los árboles cubicados arriba»; Schumacher–Hall, Spurr y sus formas logarítmicas; índice de Furnival); «Ahusamiento» (DAP del árbol, Altura total, Diámetro en punta, Largo de troza, Altura del tocón, Modelo; «Ajustar con las secciones cargadas arriba»; Kozak 1969 y Max–Burkhart; trozas y volumen comercial); «Relación altura–diámetro» (Especie, Curva para estimar; Näslund, Chapman–Richards, Weibull) | `pino` (`b2s`, `b2v`, `b2h`); `cafetal`/`mesofilo` (`b2t`); `mesofilo` (`b2h`, Liquidambar) |
| `03-bloque3.html` | 3 · Inventario forestal y muestreo — «Tamaño de muestra, diseños de muestreo, expansión a la hectárea, estructura del rodal e índices de densidad.» | «El inventario: árboles y parcelas» (Árboles; Parcelas (opcional); «Diseño por omisión y superficie del predio»; mosaicos Parcelas, Árboles, Especies, Conglomerados; parcelas circulares, cuadradas, rectangulares o anidadas); «Expansión a la hectárea» (Volumen de cada árbol, Coeficiente mórfico, «Estimar las alturas faltantes (Näslund)»); «Estimación y error de muestreo» (Variable, Diseño, Confianza, «Corrección por población finita»; aleatorio simple, estratificado, sistemático, conglomerados; tabla «La misma variable con cada diseño»); «Tamaño de muestra» (Coeficiente de variación, Error permisible, Parcelas posibles N, Confianza, Asignación por estrato; «Tomar el CV del inventario cargado»); «Relascopía (muestreo puntual)» (Factor de área basal, Coeficiente mórfico); «Estructura del rodal» (Ancho de clase, Weibull de 2 o 3 parámetros, Estrato, Radio de Hegyi; tabla de rodal, IVI, Reineke, Hart–Becking, Hegyi) | `cafetal` (`b3t`, `b3p`); `mesofilo` (`b3t`, `b3p`, `b3r`: 15 puntos, FAB = 2) |
| `04-bloque4.html` | 4 · Biomasa y carbono — «Ecuaciones alométricas, densidad de la madera, biomasa aérea y de raíces, necromasa, carbono y CO₂e con su incertidumbre.» | «Datos y ecuaciones» («Cargar ejemplo», «Usar el inventario del Bloque 3»; Ecuación por omisión, E, Biomasa de raíces, Razón raíz/tallo, Fracción de carbono, Fracción que queda en muertos en pie; «Reglas: ecuación por especie o género», «Tus ecuaciones», «Ver el catálogo de ecuaciones (31)»); «Densidad de la madera» (tabla editable; «Cargar la base mundial (archivo de la GWDD)…»; especie → género → familia → parcela); «Biomasa y carbono del inventario» (por árbol, por parcela y del predio); «Incertidumbre por Monte Carlo» (Iteraciones, Error del diámetro, de la altura medida y estimada, «Error residual de la ecuación», «Correr el Monte Carlo»); «Necromasa, hojarasca y suelo» (Madera caída por intersección de líneas con densidades por clase 1–3; Hojarasca; Carbono orgánico del suelo, que lee también las tablas de SoilPro); «Reservorios y cambio entre inventarios» (Arbustos y otros con su error; «Cambio de existencias», «Las mismas parcelas (pareado)», Años entre mediciones) | `cafetal`, `mesofilo`, `referencias` (ganchos); `mesofilo` (`b4w`), `cafetal` (`b4l`, `b4s`), `pino` (`b4c`) |
| `05-bloque5.html` | 5 · Crecimiento y rendimiento — «Incrementos corriente y medio, modelos de crecimiento, índice de sitio y proyección del rodal.» | «Incrementos y turno biológico» (Variable, Coeficiente mórfico, Árbol para los modelos; ICA, IMA, edad del IMA máximo); «Modelos de crecimiento» (Chapman–Richards, Gompertz, Schumacher, logístico); «Índice de sitio» (Edad base, Familia de curvas anamórficas o polimórficas, Clases de sitio); «Proyección del rodal y tabla de producción» (Índice de sitio, Edad inicial, Área basal inicial, Árboles por hectárea iniciales, Mortalidad anual, Edad final, Intervalo; sistema de Clutter; tabla editable) | `pino` (`b5a`: 6 árboles; `b5c`: 30 parcelas × 6) |
| `06-bloque6.html` | 6 · Diversidad y ecología del bosque — «Riqueza, índices y números de Hill, rarefacción, similitud entre sitios, estructura vertical y patrón espacial.» | «La comunidad» (sitio, especie, abundancia, grupo); «Índices de diversidad» (Shannon, Simpson, Pielou, α de Fisher, Chao1, ACE, cobertura); «Números de Hill, rarefacción y acumulación»; «Similitud entre sitios y ordenación» (Índice: Jaccard, Sørensen, Bray–Curtis; UPGMA y NMDS, sin PCoA (el escalamiento clásico solo da el arranque del NMDS y no se muestra); «Enviar la matriz a ClusteringPro», «Enviar la matriz a PCAPro»); «Estructura vertical» (perfil de Pretzsch); «Patrón espacial de los árboles» (Ancho y Largo de la parcela, Distancia máxima para K, Simulaciones para la envolvente; Clark–Evans, K y L de Ripley) | `mesofilo` (`b6a`, `b6f`: 50 × 50 m); `cafetal` (`b6a`) |
| `07-bloque7.html` | 7 · Sistemas agroforestales — «Sombra de cafetales (por inventario o por fotografía hemisférica), sombra y rendimiento, arreglos de plantación y presupuesto de carbono.» | «Sombra a partir del inventario» («Cargar el cafetal de ejemplo», «Usar el inventario del Bloque 3»; cobertura con traslape, índice de Holdridge, resumen por manejo); «Sombra a partir de una fotografía del dosel» (Tipo de foto, Canal, Umbral (vacío = Otsu), Radio del círculo; «Foto de ejemplo (sintética)», «Abrir una foto…»); «Sombra y rendimiento del cultivo» (lineal o cuadrática, sombra del rendimiento máximo con su intervalo); «Diseño de plantación» (Arreglo, Ancho y Largo del terreno, Distancia entre árboles y entre hileras, Ancho del callejón, Cultivo: distancia y entre hileras, Costo por árbol plantado; plano); «Presupuesto de carbono del sistema» (Cafetos por hectárea del sistema y del monocultivo, Carbono del suelo y Hojarasca del monocultivo, Fracción de carbono, Raíz/tallo del cultivo; «Calcular con el cafetal de ejemplo») | `cafetal` (gancho; `b7c`) |
| `08-bloque8.html` | 8 · Mapas y geoprocesamiento ligero — «Parcelas y árboles en el mapa, áreas de polígonos, cuadrícula de muestreo, exportación GPX/KML/GeoJSON e interpolación.» | «El mapa» (capas Parcelas, Árboles, Polígonos, Cuadrícula, Interpolación, «Fondo de OpenStreetMap (pide teselas a internet)», apagado por omisión; «Importar GPX, KML o GeoJSON…», + − ⤢, «Dibujar un polígono»); «Polígonos y áreas» (UTM y esfera); «Cuadrícula de muestreo» (Polígono, Diseño, Distancia entre puntos, Rotación, Puntos al azar, Radio de la parcela, «Arranque aleatorio de la malla», «Generar los puntos»); «Exportar» (⤓ GPX, KML, GeoJSON, CSV); «Interpolación entre parcelas» (Variable, Método IDW o kriging ordinario/simple, Modelo del variograma, Potencia de IDW, Distancia máxima, Celdas, «Recortar al primer polígono», «Interpolar»; validación cruzada) | `mesofilo` (gancho; `b8p`: predio de 9 vértices); `cafetal` para la interpolación (`b8i`: claves `rend` y `sombra`) |
| `09-bloque9.html` | 9 · Utilidades forestales — «Cubicación de trozas y madera aserrada, pies tabla, factores de forma, conversiones, rendimiento de aserrío y costo de plantación.» | «Cubicación de trozas» («Cargar ejemplo: 12 trozas de pino», «Tabla vacía», «Volumen sin corteza», «Cubicar»; Smalian, Huber, Newton, tronco de cono; Doyle, Scribner, Internacional ¼″); «Madera aserrada» (Unidades, «Contar»); «Rendimiento de aserrío» (Madera en rollo, Madera aserrada, Regla de referencia; «Calcular el rendimiento»); «Factor de forma» («Calcular»); «Conversión de unidades» (Magnitud, Valor, De; Leña apilada con Factor de apilado); «Costo y rentabilidad de una plantación» (Tasa de descuento, Costo anual fijo, Turno; «Cargar ejemplo: pino a 25 años», «Evaluar»; VPN, TIR, B/C, Faustmann, anualidad equivalente, recuperación) | `pino` (gancho: carga los ejemplos de la tarjeta) |
| `10-bloque10.html` | 10 · Informe y proyecto — «El informe HTML autocontenido, las tablas, el proyecto reimportable y la cita.» | «Informe» (Título, Predio o proyecto, Responsable, Fecha, Presentación o notas, Bloques que entran, «Con los métodos y sus fuentes», «Con los avisos»; «Vista previa», «⤓ Descargar el informe (HTML)», «Abrir para imprimir o guardar como PDF»); «Todas las tablas» («⤓ Libro de Excel (XLSX), una hoja por tabla», «⤓ CSV, un archivo por tabla (ZIP)»); «Proyecto» («⤓ Guardar el proyecto (JSON)», «Abrir un proyecto…», «Empezar de nuevo»; el proyecto repite los pasos en una página limpia); «Cómo citar» («Copiar APA», «Copiar BibTeX», «⤓ forestpro.bib»). Aquí va también el estudio de figuras y el editor ✎ a fondo | abrir antes los bloques que deban salir en el informe (por ejemplo `cafetal` en 3, 4 y 7) |
| `11-apendices.html` | Apéndices A–F | A los archivos que lee y escribe (las columnas de cada tarjeta de datos, sus sinónimos y la ⤓ Plantilla; GPX/KML/GeoJSON; el proyecto); B las reglas reunidas (error de muestreo admisible, intervalo de la ecuación, raíz/tallo del IPCC con sus límites, fracción de carbono 0.47, CO₂e = C × 44/12, clases de sitio, Clark–Evans, etc.); C glosario; D cuando algo no sale; E licencia (GPL-3.0-or-later) y cita (sin DOI todavía); F referencias, escritas por `genera-referencias.js` entre `<!-- REFERENCIAS -->` y `<!-- /REFERENCIAS -->` | — |

Reparto sugerido entre cuatro personas, por volumen: (1) capítulos 1, 2 y 3; (2) capítulos 4 y 5;
(3) capítulos 6, 7 y 8; (4) capítulos 9 y 10 y los apéndices. Quien escriba un capítulo ajusta sus
renglones del índice de `00b-introduccion.html` si cambia un título; los demás no tocan esa parte.

## 2. Cómo se marca

Cada parte copia el `<head>` de `00b-introduccion.html` (tipografías, `../interior.css`,
`../paginar.js`; un `<style>` propio sólo si hace falta) y pone **una sola** `<section>`:

```html
<section class="capitulo" id="cap-4" data-pestana="4" data-orden="4" style="--acento: var(--b4)">
  <div class="cap-apertura">
    <div class="cap-num">4</div>
    <div class="cap-etiqueta">Capítulo cuatro · Bloque 4</div>
    <h1 data-corto="Biomasa y carbono">Biomasa y carbono</h1>
    <div class="cap-regla"></div>
    <p class="cap-resumen">Qué resuelve el bloque en un trabajo forestal, en tres o cuatro renglones.</p>
    <div class="cap-franja"><span class="k3"></span><span class="k4"></span><span class="k4"></span><span class="k10"></span></div>
    <ul class="cap-contenido">
      <li><b>4.1</b>Datos y ecuaciones</li>
      …
    </ul>
  </div>

  <h2 id="s4-1"><span class="num">4.1</span>Datos y ecuaciones</h2>
  <p class="lead">Primer párrafo de la sección, un poco más grande.</p>
  <p>Texto. Los rótulos de la app van así: <span class="ui">Correr el Monte Carlo</span>; una ruta,
     <span class="ruta">Bloque 4<span class="sep">›</span>Densidad de la madera</span>; un archivo o una tecla, <code>Ctrl + K</code>.</p>
  <h3>Subtítulo</h3>
  …
</section>
```

- `data-orden` es el número del bloque (In = 0, Ap = 11); los apéndices usan `id="apendices"`,
  `data-pestana="Ap"`, `--acento: var(--bx)`, `cap-num` «A» y h2 `id="ap-a"` … `ap-f` con
  `<span class="num">A</span>`.
- La etiqueta de apertura dice el número con letra: «Capítulo uno · Bloque 1», «Capítulo dos ·
  Bloque 2», … «Capítulo diez · Bloque 10».
- h2 siempre numerados (`N.M`), con `id="sN-M"` igual al del índice; h3 sin número; h4 para un
  rótulo menor en versalitas.
- `data-corto` del h1 es lo que sale en el encabezado de las hojas: si el título es largo («Mapas y
  geoprocesamiento ligero»), uno corto («Mapas»).

**Figuras**, numeradas por capítulo (Figura 4.1, 4.2…), con la imagen en `../img/` y, si lleva
marcas, la lista justo después:

```html
<figure class="w70">
  <div class="marco"><img src="../img/b4-montecarlo.png" alt="Descripción para lector de pantalla">
    <span class="marca" style="left:12.5%;top:8%">1</span>
  </div>
  <figcaption><b>Figura 4.3.</b> Qué se ve y qué números importan.</figcaption>
</figure>
<ul class="leyenda-marcas">
  <li><span class="n">1</span><b>Iteraciones.</b> …</li>
</ul>
```

Las posiciones de las marcas salen de la receta (`window.__marcas`, ver `LEEME.md` y
`recetas/i-interfaz.js`), no a ojo.

**Recuadros** (los que promete «Cómo leer este manual»):

```html
<div class="caja nota"><div class="caja-t"><span class="ico">i</span>Nota</div><p>…</p></div>
<div class="caja importante"><div class="caja-t"><span class="ico">!</span>Importante</div><p>…</p></div>
<div class="caja teoria"><div class="caja-t"><span class="ico">θ</span>Teoría en breve</div><p>…</p></div>
<div class="caja ejemplo"><div class="caja-t"><span class="ico">▸</span>Ejemplo resuelto · la densidad del cafetal</div><p>…</p></div>
<div class="caja regla">
  <div class="caja-t"><span class="ico">✓</span>Regla de decisión</div>
  <table class="compacta"><tbody>
    <tr><td style="width:40%"><b>Si</b> el error de muestreo pasa de 10 %</td><td><b>entonces</b> …</td></tr>
  </tbody></table>
  <p class="regla-pie">Guías para interpretar, no leyes.</p>
</div>
<div class="caja error"><div class="caja-t"><span class="ico">✕</span>Cuando algo sale mal</div><p>…</p></div>
<div class="caja dato"><div class="dato-cifra">31</div><div class="dato-txt"><div class="caja-t">Dato clave</div>…</div></div>
```

Además: `ol.pasos` para procedimientos numerados, `table.compacta` para tablas (con `<caption>` si
hace falta; `td.num` para números alineados a la derecha), `.formula` para una fórmula en bloque,
`.dos` para dos columnas, chips de bloque `<span class="chip k3">3</span>`. Cada capítulo cierra con
una «Regla de decisión» o una tabla de lectura y un «Cuando algo sale mal». Cada sección que cargue
datos dice qué columnas pide su tarjeta (las obligatorias, con asterisco en la app); la lista completa
de columnas y sinónimos va en el apéndice A.

## 3. Las capturas

- Una receta por imagen en `herramientas/recetas/`, con nombre `bN-que.js` (por ejemplo
  `b4-montecarlo.js`) y la ventana en la primera línea. Se apoyan en `_comun.js`:
  `await bloque(4, 'cafetal')`, `await cargar('b4s', 'cafetal')`, `tarjeta(5, L('Índice de sitio', 'Site index'))`,
  `abrirMetodo(t)`, `irA(nodo, 200)`, `return caja([nodo], 8)`. Hay tres recetas de muestra
  (`b3-estructura`, `b5-sitio`, `b7-diseno`) que funcionan en los dos idiomas.
- Los rótulos que busques con `tarjeta()` o `vis()` deben estar en el idioma de la captura: escríbelos
  con `L('español', 'English')` para que la misma receta sirva para la edición inglesa. Con un id
  (`porId('b2ff')`) no hay problema de idioma.
- Después de cambiar un control (`const c = porId('b2ff'); c.value = 0.45; c.dispatchEvent(new Event('input'))`),
  `await listo()` espera a que terminen los cálculos de la app.
- Deja `irA(nodo, 200)` o más: con menos, la sombra de la barra fija o del héroe del Bloque 1 cae sobre
  el recorte.
- Sacar: `node manual/herramientas/captura.js b4-montecarlo` desde la raíz de la app, con el node de
  `C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe`. **Mirar cada imagen** antes
  de citarla.
- Revisar: `node manual/herramientas/revisar.js manual/es/04-bloque4.html --huecos 1.2`. Cero
  desbordes y cero imágenes sin cargar; si una figura deja un hueco grande, angostarla con
  `anchos.js` (no menos de `w60` si la captura tiene mucho texto) o reordenar.
- Las herramientas borran sus perfiles temporales (`forestpro-manual-*` en `%TEMP%`); si algo
  se interrumpe, bórralos a mano, y no cierres ventanas de Edge que no sean de esos perfiles.

## 4. Las cifras

**Todas las cifras del texto salen de la app con los conjuntos de ejemplo**, con los valores por
omisión salvo que el texto diga qué se cambió, y se comprueban en la captura o en la app misma
(con la receta, o con la consola de una captura: `state.inventory`, `state.biomass`, `state.growth`,
`UI.cards`…). Nada se copia del manual anterior, de la literatura ni de `tests/` sin comprobarlo en
pantalla, ni se calcula a mano aparte. Recuerda que los ejemplos son simulados: se dice «el cafetal
de ejemplo», no «el cafetal». Números con punto decimal y coma de miles, como los escribe la app
(«27,764 árb»), y la unidad separada por un espacio.

## 5. Si encuentras un error de la app

**No lo corrijas.** Anótalo al final de tu entrega con el bloque, cómo reproducirlo, qué esperabas y
qué salió (con la captura si ayuda), y escribe el capítulo con lo que la app hace hoy, sin presentar
el error como correcto. Los errores que se anotaron al escribir la primera versión del manual se
corrigieron en la app (commit 0eebe7b, 72 pruebas, 8 327 comparaciones sin desacuerdos; la lista está en
el mensaje del commit): entre ellos, la numeración de las casillas de «Bloques que entran» del Bloque 10,
el flujo de «Cómo funciona» en dos filas de tres, el campo «Diseño» ancho y la hojarasca del cafetal.
La cita de la app sigue apuntando a `https://github.com/luisangelbg/ForestPro`, que existirá al publicarla.

## 6. Tamaño

Los capítulos de la plantilla ocupan **entre 5 y 14 hojas** cada uno; el Bloque 1 y los bloques con
más tarjetas (3, 4, 7, 9) irán hacia arriba, el 5 y el 10 hacia abajo. La introducción tiene 18 hojas
(5 de preliminares y 13 de texto). Los apéndices, con las 103 referencias, rondarán 12 a 16 hojas.
