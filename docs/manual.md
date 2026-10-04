# Manual de ForestPro

**Inventario forestal, dasometría, biomasa, carbono y agroforestería en el navegador**

Versión 1.0.0 · 4 de octubre de 2026 · Luis Ángel Barrera-Guzmán (ORCID 0000-0001-8057-2583) · LABG

Licencia del programa: GPL-3.0 o posterior. Este manual describe la versión 1.0.0; cada capítulo corresponde al bloque
de la app que lleva su número.

## Introducción

### I.1 Qué es ForestPro

ForestPro lleva un inventario forestal o agroforestal de la hoja de campo al informe sin instalar nada: es una página web
(HTML, CSS y JavaScript) que hace todos sus cálculos en el navegador. Mide árboles y trozas, estima con su error de
muestreo lo que hay en el predio, convierte el inventario en biomasa y carbono con la incertidumbre del modelo, proyecta
el crecimiento y la calidad de sitio, mide la diversidad y el patrón espacial, evalúa la sombra y el diseño de los
sistemas agroforestales, pone todo en un mapa y resuelve las cuentas del aserradero y de la plantación. Cada resultado
viene con su método, sus fuentes y una interpretación en palabras.

Está pensado para quien levanta y analiza inventarios —técnicos forestales, estudiantes de tesis, responsables de
proyectos de carbono o de manejo— y quiere los métodos estándar, bien hechos y comprobados, sin escribir código.

Lo que no hace: no sustituye la planeación del muestreo en campo ni el criterio del técnico; no trae ecuaciones locales
para cada especie (trae un catálogo de referencia que se puede ampliar); no hace teledetección ni modelos de crecimiento
árbol por árbol; no se conecta a bases de datos ni guarda nada en servidores.

### I.2 Cómo abrirla

1. **Con doble clic en `index.html`.** Abre en el navegador predeterminado, en la página de inicio. Funciona sin
   conexión a internet y sin servidor.
2. **Con el servidor local.** Si el equipo no deja abrir páginas como archivos locales, `Open ForestPro.bat` (o
   `server.ps1` con PowerShell) arranca un servidor pequeño en el propio equipo y abre `http://localhost:9480`.
3. **En línea**, en <https://luisangelbg.github.io/ForestPro/>: los mismos archivos; los datos tampoco salen del
   navegador.

Sirve cualquier navegador actual (Chrome, Edge, Firefox o Safari), en computadora, tableta o teléfono.

### I.3 La interfaz

- **Barra superior:** el nombre de la app, el enlace a la suite LABG, el cambio de idioma (ES/EN), el tema claro u
  oscuro, el botón de animaciones, el de comentarios y la ayuda con los atajos de teclado.
- **Barra de bloques** (a la izquierda; en el teléfono, abajo): los diez bloques numerados. Una palomita marca los que
  ya tienen resultados. Al pie de cada bloque, los botones «Anterior» y «Siguiente».
- **Navegador del bloque** (a la derecha): las secciones del bloque en que estás, la búsqueda (Ctrl K) y el modo
  enfocado, que oculta lo demás.
- **Secciones:** cada bloque se divide en tarjetas con un título, una línea que dice para qué sirven, los datos y
  controles, los resultados y, al final, el recuadro desplegable **«Método y fuentes»**.
- **Resultados:** mosaicos con los números que importan, figuras, tablas con sus botones ⤓ CSV y ⤓ XLSX, y una
  **interpretación** en palabras.
- **Figuras:** el botón del estudio de figuras, en la esquina de cada figura, cambia el estilo de todas y exporta
  cada una en SVG, PNG a 300 ppp o más, JPG o PDF vectorial, en los colores del tema claro aunque la app esté en
  oscuro. El botón ✎ edita esa figura: títulos, ejes, series, leyenda y anotaciones.
- **Teclado:** todo se maneja con el teclado (Tab, Enter, flechas); Alt + → y Alt + ← cambian de bloque y «?» abre la
  lista de atajos. Si el sistema pide reducir el movimiento, las animaciones se detienen.

### I.4 Cómo se cargan los datos

Casi todas las secciones que necesitan datos tienen una **tarjeta de datos** con las mismas opciones:

- **Cargar ejemplo:** elige uno de la lista; una nota dice qué trae.
- **Abrir archivo…:** CSV o TXT (separado por comas, punto y coma o tabuladores; con punto o coma decimal), XLSX o
  ODS. Si el libro tiene varias hojas, se elige la hoja.
- **Pegar tabla:** desde una hoja de cálculo, con su fila de nombres.
- **Escribir a mano:** una tabla vacía con las columnas que pide la sección.
- **⤓ Plantilla:** un CSV con los nombres de las columnas y tres filas de ejemplo.
- **Usar el inventario del Bloque 3**, en las secciones que pueden trabajar con él.

Después de leer el archivo, la app **empareja las columnas**: las que reconoce por su nombre (en español o en inglés, y
con varios sinónimos) ya vienen elegidas; las demás se eligen en una lista. Las columnas obligatorias llevan un
asterisco. Las filas a las que les falta un dato obligatorio se dejan fuera con un aviso. «Ver los datos» muestra lo
que se cargó. En cada capítulo hay una tabla con las columnas de cada tarjeta.

### I.5 Los datos de ejemplo

Cuatro conjuntos, descritos en `data/LEEME.md`. Salvo las densidades de la madera, **son simulados**: tienen órdenes de
magnitud realistas pero no son mediciones de un sitio real.

- **Cafetal bajo sombra:** 25 parcelas de 1 000 m² en cinco fincas con cuatro manejos (rústico, policultivo
  tradicional, policultivo comercial, monocultivo bajo sombra): 719 árboles de sombra con su copa, 250 cafetos, el
  suelo y el rendimiento de café.
- **Bosque mesófilo estratificado:** 24 parcelas circulares anidadas en tres estratos (conservado, perturbado,
  ribereño) con 1 830 árboles, una parcela de 50 × 50 m con las coordenadas de cada tallo, 15 puntos de relascopía,
  transectos de madera caída y el polígono del predio.
- **Plantación de pino:** 30 parcelas permanentes medidas seis veces, el análisis troncal de seis árboles y 536
  secciones de árboles derribados.
- **Densidades y ecuaciones:** la densidad básica de la madera de 42 especies o géneros (Global Wood Density Database,
  CC0) y el catálogo de 31 ecuaciones alométricas.

En la página de inicio, cada conjunto tiene un botón «Abrir en …» por bloque en que se usa: abre el bloque y carga el
ejemplo. Dentro de cada bloque, las tarjetas de datos y los botones «Cargar ejemplo» hacen lo mismo.

### I.6 Privacidad y conexión

Los datos no salen del equipo: no hay servidor que los reciba y la app no pide nada a internet. La única excepción es
voluntaria: el fondo de OpenStreetMap del Bloque 8, apagado por omisión; al encenderlo, el navegador pide las imágenes
del mapa del área visible (nunca los datos del usuario). El idioma, el tema y las preferencias se guardan en el propio
navegador.

### I.7 Cómo se validó

Cada motor de cálculo (`js/eng-*.js`) corre igual en el navegador y en node, así que se comparó, con los datos de
ejemplo, contra referencias independientes en R 4.4.2 (BIOMASS, forestmangr, lmfor, minpack.lm, systemfit, vegan,
MASS, iNEXT, spatstat, fitdistrplus, sf, gstat, units y FinCal) y contra fórmulas escritas aparte. Cada comparación
lleva su tolerancia; las diferencias de convención con los paquetes y los errores de la app que la comparación encontró
y que se corrigieron se explican al final de cada capítulo.

| Bloque | Tema | Comparaciones | Desacuerdos |
|---|---|---:|---:|
| 2 | Dasometría | 287 | 0 |
| 3 | Inventario y muestreo | 430 | 0 |
| 4 | Biomasa y carbono | 4 974 | 0 |
| 5 | Crecimiento y rendimiento | 616 | 0 |
| 6 | Diversidad y ecología | 1 222 | 0 |
| 7 | Sistemas agroforestales | 211 | 0 |
| 8 | Mapas | 269 | 0 |
| 9 | Utilidades forestales | 252 | 0 |
| | **Total** | **8 261** | **0** |

Además, 62 pruebas unitarias con respuestas conocidas (valores de libro, formas cerradas y casos límite) corren en
`tests/run.html` y con `node tests/run_node.js`. Para repetir la validación: `Rscript tests/r/valida_bN.R` y después
`node tests/compare.js`; el detalle de cada comparación queda en `tests/resultados/bN.md`.

## Capítulo 1. Bloque 1 · Inicio

La página de inicio presenta la app y sirve de punto de partida.

- **Encabezado:** qué hace ForestPro, con la sección de un tronco cuyos anillos se vuelven curvas de nivel, y el botón
  «Empezar con un ejemplo», que abre el inventario del cafetal en el Bloque 3.
- **Flujo de trabajo:** medir, muestrear, expandir, convertir, proyectar y reportar, con lo que entra en cada paso.
- **Los bloques:** una tarjeta por bloque con lo que contiene; un clic la abre.
- **Datos de ejemplo:** los cuatro conjuntos (sección I.5), cada uno con sus botones «Abrir en …» para los bloques en que se usa.
- **Lo que no hace:** los límites de la app, dichos de frente (sección I.1).
- **Cómo citar:** la cita en APA y en BibTeX, con botones para copiarlas.

## Capítulo 2. Bloque 2 · Dasometría

El bloque mide árboles uno por uno: del diámetro y la altura salen el área basal y el volumen; de los árboles derribados y cubicados por secciones salen las ecuaciones de volumen, el perfil del fuste y las curvas de altura que usan los bloques siguientes. El ejemplo de la plantación de pino trae 536 secciones de árboles derribados, y los del cafetal y el mesófilo, árboles en pie.

### 2.1 Datos que usa

**Tarjeta de la sección «Árboles en pie: diámetro, área basal y volumen»** (ejemplos: cafetal, mesofilo).

| Columna | Contenido | |
|---|---|---|
| `especie` | Especie | opcional |
| `dap` | DAP (cm) | opcional, número |
| `cap` | Circunferencia a 1.3 m (cm) | opcional, número |
| `altura` | Altura total (m) | opcional, número |
| `altura_com` | Altura comercial (m) | opcional, número |
| `copa` | Diámetro de copa (m) | opcional, número |
| `estado` | Estado | opcional |

**Tarjeta de la sección «Cubicación: trozas y árboles por secciones»** (ejemplos: pino).

| Columna | Contenido | |
|---|---|---|
| `arbol` | Árbol | obligatoria |
| `dap` | DAP (cm) | opcional, número |
| `altura_total` | Altura total (m) | obligatoria, número |
| `h` | Altura de la sección (m) | obligatoria, número |
| `d` | Diámetro de la sección (cm) | obligatoria, número |

**Tarjeta de la sección «Ecuaciones de volumen»** (ejemplos: pino).

| Columna | Contenido | |
|---|---|---|
| `dap` | DAP (cm) | obligatoria, número |
| `altura` | Altura total (m) | obligatoria, número |
| `volumen` | Volumen (m³) | obligatoria, número |

**Tarjeta de la sección «Relación altura–diámetro»** (ejemplos: pino, mesofilo).

| Columna | Contenido | |
|---|---|---|
| `arbol` | Árbol | opcional |
| `especie` | Especie | opcional |
| `dap` | DAP (cm) | obligatoria, número |
| `altura` | Altura total (m) — vacía si falta | opcional, número |

### 2.2 Árboles en pie: diámetro, área basal y volumen

*El DAP se calcula de la circunferencia si hace falta; el volumen, con un coeficiente mórfico (la fracción del cilindro de área basal g y altura H que ocupa el fuste).*

**Cómo se usa.** La calculadora de arriba responde por un árbol: escribe el DAP (o la circunferencia a 1.30 m, de la que se deduce) y la altura, y da el área basal, el volumen con el coeficiente mórfico elegido y la esbeltez H/D, con el aviso de inestabilidad cuando pasa de 80. Con una tabla de árboles (tarjeta «Árboles en pie») hace lo mismo para cada uno y resume el número de árboles, el área basal, el volumen y el diámetro cuadrático. La tabla acepta DAP o circunferencia; si trae las dos, manda el DAP.

**Método.**

<div class="method">
<p>DAP = C/π. Área basal g = π·DAP²/40 000 (m², con DAP en cm). Volumen = g · H · f, con f el coeficiente mórfico: 0.5 corresponde a un paraboloide; los fustes de coníferas suelen tener entre 0.42 y 0.50 y los de latifoliadas entre 0.35 y 0.48 (el valor de tu especie sale del bloque de cubicación). Esbeltez = 100·H/DAP. Área de copa = π·c²/4. Diámetro cuadrático medio Dq = √(Σ DAP²/n).</p>
</div>

**Fuentes.**

- Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, 4.ª ed. Wiley.
- Avery, T. E. y Burkhart, H. E. (2002). <i>Forest Measurements</i>, 5.ª ed. McGraw-Hill.

### 2.3 Cubicación: trozas y árboles por secciones

*La calculadora compara las tres fórmulas clásicas en una troza; la tabla cubica árboles derribados sumando trozas de Smalian entre secciones y un cono en la punta.*

**Cómo se usa.** La calculadora compara Huber, Smalian y Newton en una troza con sus tres diámetros y su largo; la diferencia entre ellas enseña cuánto pesa la forma de la troza. La tabla de secciones (una fila por medición: árbol, DAP, altura total, altura de la sección y su diámetro) cubica árboles completos: suma trozas de Smalian entre secciones, un cono en la punta y, si se pide, el tocón como cilindro; con el diámetro mínimo en punta da también el volumen comercial. De cada árbol salen su coeficiente mórfico y su cociente de forma.

**Método.**

<div class="method">
<p>Huber: V = g<sub>m</sub>·L. Smalian: V = (g<sub>1</sub> + g<sub>2</sub>)/2 · L. Newton: V = (g<sub>1</sub> + 4g<sub>m</sub> + g<sub>2</sub>)/6 · L. Newton es exacta para cualquier sólido cuyo perfil sea una parábola de segundo grado, un cono o un neiloide; Smalian sobreestima en la base neiloide y Huber subestima. Árbol completo: Σ Smalian entre secciones + cono en la punta (g·L/3) + tocón opcional (cilindro). Volumen comercial: hasta la altura en que el diámetro cae al mínimo en punta, interpolada linealmente. Coeficiente mórfico = V/(g·H); cociente de forma = d(H/2)/DAP.</p>
</div>

**Fuentes.**

- Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, cap. 6. Wiley.
- Smalian, H. L. (1837). <i>Beitrag zur Holzmeßkunst</i>. Stralsund.

### 2.4 Ecuaciones de volumen

*Ajusta cuatro modelos clásicos a árboles con DAP, altura y volumen (los de la cubicación o los tuyos) y los compara en la escala del volumen con el índice de Furnival.*

**Cómo se usa.** Carga árboles con DAP, altura y volumen, o pulsa «Usar los árboles cubicados arriba». La app ajusta Schumacher–Hall y Spurr en su forma no lineal y en la logarítmica (con la corrección de Meyer), y los ordena por el índice de Furnival, que permite comparar modelos con y sin logaritmo en la escala del volumen. La mejor ecuación queda disponible para el Bloque 3 («Ecuación ajustada en el Bloque 2»).

**Método.**

<div class="method">
<p><b>Schumacher–Hall:</b> V = b₀·D<sup>b₁</sup>·H<sup>b₂</sup>, por mínimos cuadrados no lineales (Levenberg–Marquardt) o en su forma logarítmica ln V = b₀ + b₁ ln D + b₂ ln H; al regresar a la escala original se multiplica por el factor de Meyer exp(σ²/2). <b>Spurr:</b> V = b₀ + b₁·D²H y su forma logarítmica. <b>Índice de Furnival:</b> I = σ̂ para los modelos en la escala del volumen e I = σ̂·exp(media de ln V) para los logarítmicos; el menor es el mejor. También se dan R², RMSE y sesgo en m³.</p>
</div>

**Fuentes.**

- Schumacher, F. X. y Hall, F. S. (1933). Logarithmic expression of timber-tree volume. <i>J. Agric. Res.</i> 47:719–734.
- Spurr, S. H. (1952). <i>Forest Inventory</i>. Ronald Press.
- Meyer, H. A. (1941). A correction for a systematic error occurring in the application of the logarithmic volume equation. <i>Pennsylvania State Forest School Res. Paper</i> 7.
- Furnival, G. M. (1961). An index for comparing equations used in constructing volume tables. <i>Forest Science</i> 7:337–341.
- Marquardt, D. W. (1963). An algorithm for least-squares estimation of nonlinear parameters. <i>J. SIAM</i> 11:431–441.

### 2.5 Ahusamiento

*Con las secciones de los árboles derribados se ajusta el perfil relativo del fuste; con él se calcula el diámetro a cualquier altura, la altura comercial y el volumen de cada troza.*

**Cómo se usa.** Con las secciones cargadas, «Ajustar con las secciones cargadas arriba» ajusta el modelo segmentado de Max y Burkhart o el de Kozak (1969) al perfil relativo d/DAP contra h/H de todos los árboles. Después, para un árbol con su DAP y altura, la app dibuja el perfil, da la altura a la que el fuste llega al diámetro en punta, y corta trozas del largo pedido desde la altura del tocón con el volumen de cada una.

**Método.**

<div class="method">
<p>Con z = h/H: <b>Kozak, Munro y Smith (1969)</b>: (d/D)² = b₁(z − 1) + b₂(z² − 1), por mínimos cuadrados sin intercepto. <b>Max y Burkhart (1976)</b>: tres segmentos (neiloide en la base, paraboloide en el centro y cono en la punta) unidos en a₂ y a₁: (d/D)² = b₁(z − 1) + b₂(z² − 1) + b₃(a₁ − z)²·I₁ + b₄(a₂ − z)²·I₂, con Iᵢ = 1 si z ≤ aᵢ; por mínimos cuadrados no lineales con varios arranques. El volumen entre dos alturas integra π·d(h)²/40 000 por Simpson (400 intervalos); la altura al diámetro mínimo se resuelve por el método de Brent.</p>
</div>

**Fuentes.**

- Kozak, A., Munro, D. D. y Smith, J. H. G. (1969). Taper functions and their application in forest inventory. <i>For. Chron.</i> 45:278–283.
- Max, T. A. y Burkhart, H. E. (1976). Segmented polynomial regression applied to taper equations. <i>Forest Science</i> 22:283–289.

### 2.6 Relación altura–diámetro

*Ajusta tres curvas que pasan por 1.3 m con los árboles que tienen altura y estima la altura de los que no la tienen.*

**Cómo se usa.** La tarjeta pide DAP y altura; la altura puede faltar en parte de los árboles, que es justo lo que se quiere estimar. La app ajusta Näslund, Chapman–Richards y Weibull (todas pasan por 1.30 m), los compara por AIC y error cuadrático medio y, con la curva elegida (la de menor AIC por omisión), estima la altura de los árboles que no la tienen. Se puede ajustar por especie.

**Método.**

<div class="method">
<p>Todas pasan por H = 1.3 m cuando D → 0. <b>Näslund (1937):</b> H = 1.3 + D²/(a + bD)². <b>Chapman–Richards:</b> H = 1.3 + a(1 − e<sup>−bD</sup>)<sup>c</sup>. <b>Weibull:</b> H = 1.3 + a(1 − e<sup>−bD<sup>c</sup></sup>). Se ajustan por mínimos cuadrados no lineales (Levenberg–Marquardt; Näslund arranca de su forma linealizada D/√(H − 1.3) = a + bD). AIC y BIC con la verosimilitud normal, como en R; con la misma respuesta, el menor AIC indica la curva preferible.</p>
</div>

**Fuentes.**

- Näslund, M. (1937). Skogsförsöksanstaltens gallringsförsök i tallskog. <i>Medd. Statens Skogsförsöksanstalt</i> 29.
- Richards, F. J. (1959). A flexible growth function for empirical use. <i>J. Exp. Bot.</i> 10:290–300.
- Yang, R. C., Kozak, A. y Smith, J. H. G. (1978). The potential of Weibull-type functions as flexible growth curves. <i>Can. J. For. Res.</i> 8:424–431.
- Mehtätalo, L., de-Miguel, S. y Gregoire, T. G. (2015). Modeling height-diameter curves for prediction. <i>Can. J. For. Res.</i> 45:826–837.

### 2.7 Validación

287 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b2.md`).

1. **Datos de ahusamiento que no identificaban el modelo segmentado.** En la primera versión, las secciones simuladas seguían el perfil de Kozak, Munro y Smith (1969), que no tiene segmentos, y solo había secciones a 0.3 y 1.3 m en la base. El ajuste de Max y Burkhart (1976) terminaba con el punto de unión a₁ pegado a su límite inferior (0.20) y con b₃ no significativo. No era un error del ajuste: era un modelo que los datos no podían identificar. Se regeneraron las secciones con un perfil segmentado verdadero (a₁ = 0.72, a₂ = 0.08) y con secciones a 0.15, 0.3, 0.8, 1.3, 2 y 3 m. Ahora el ajuste recupera los parámetros (a₁ = 0.717) y coincide con `minpack.lm` en la suma de cuadrados a 1e-6.
2. **La referencia `nls_table` de forestmangr se detiene antes del mínimo.** Sus coeficientes de Schumacher–Hall difieren de los de la app en 1.8e-5 y 2.6e-5 relativos. Usa las tolerancias por omisión de `nlsLM`. Con tolerancias estrictas, `minpack.lm` coincide con la app a menos de 1e-5, y la suma de cuadrados lo confirma: 0.584212824098 en la app y en `minpack.lm` estricto, frente a 0.584212824112 en `nls_table`. La comparación con `nls_table` quedó con tolerancia 1e-4 y una prueba adicional: la suma de cuadrados de la app no es mayor que la suya.
3. **`fithd` de lmfor no sirve de referencia para una curva fija.** Ajusta un modelo mixto con efectos aleatorios de parcela. En su lugar se usaron las funciones de curva del mismo paquete (`HDnaslund`, `HDrichards`, `HDweibull`) dentro de un ajuste por mínimos cuadrados. Así se comprobó que la parametrización de la app es la de lmfor.

## Capítulo 3. Bloque 3 · Inventario y muestreo

Es el corazón del inventario: de árboles medidos en parcelas a valores por hectárea, a la media del predio con su error de muestreo y a la estructura del rodal. Lo que se carga aquí (el inventario) lo usan los bloques 4, 6, 7 y 8.

### 3.1 Datos que usa

**Tarjeta de la sección «El inventario: árboles y parcelas»** (ejemplos: cafetal, mesofilo).

| Columna | Contenido | |
|---|---|---|
| `parcela` | Parcela | obligatoria |
| `estrato` | Estrato | opcional |
| `especie` | Especie | opcional |
| `familia` | Familia | opcional |
| `dap` | DAP (cm) | obligatoria, número |
| `altura` | Altura total (m) | opcional, número |
| `copa` | Diámetro de copa (m) | opcional, número |
| `estado` | Estado (vivo / muerto) | opcional |
| `x` | x (m) | opcional, número |
| `y` | y (m) | opcional, número |

**Tarjeta de la sección «El inventario: árboles y parcelas»** (ejemplos: cafetal, mesofilo).

| Columna | Contenido | |
|---|---|---|
| `parcela` | Parcela | obligatoria |
| `estrato` | Estrato | opcional |
| `area_estrato_ha` | Superficie del estrato (ha) | opcional, número |
| `conglomerado` | Conglomerado | opcional |
| `radio_m` | Radio (m) | opcional, número |
| `radio_chico_m` | Radio de la subparcela (m) | opcional, número |
| `dap_corte_cm` | DAP de corte entre parcelas (cm) | opcional, número |
| `lado_m` | Lado del cuadrado (m) | opcional, número |
| `largo_m` | Largo (m) | opcional, número |
| `ancho_m` | Ancho (m) | opcional, número |
| `area_m2` | Superficie de la parcela (m²) | opcional, número |
| `lat` | Latitud | opcional, número |
| `lon` | Longitud | opcional, número |

**Tarjeta de la sección «Relascopía (muestreo puntual)»** (ejemplos: mesofilo).

| Columna | Contenido | |
|---|---|---|
| `punto` | Punto | obligatoria |
| `especie` | Especie | opcional |
| `dap` | DAP (cm) | obligatoria, número |
| `altura` | Altura (m) | opcional, número |

### 3.2 El inventario: árboles y parcelas

*Una fila por árbol con su parcela; una fila por parcela con su diseño. Si no cargas parcelas, todas toman el diseño de abajo.*

**Cómo se usa.** Hay dos tarjetas. La de árboles lleva una fila por árbol con su parcela; las demás columnas son opcionales (estrato, especie, familia, DAP, altura, copa, estado vivo o muerto, coordenadas x, y desde el centro). La de parcelas lleva una fila por parcela con su diseño (radio, lado, largo y ancho, superficie, o radio de la subparcela y DAP de corte de una parcela anidada), su estrato con la superficie de este, su conglomerado y sus coordenadas. Si no se cargan parcelas, todas toman el «Diseño por omisión», donde también se escribe la superficie total del predio. El ejemplo carga las dos tarjetas a la vez.

### 3.3 Expansión a la hectárea

*Cada árbol representa 10 000/a árboles por hectárea, con a la superficie de la parcela (o de la subparcela que le toca por su diámetro).*

**Cómo se usa.** Elige cómo se calcula el volumen de cada árbol (g·H·coeficiente mórfico o la ecuación ajustada en el Bloque 2) y si se estiman las alturas que faltan con una curva de Näslund ajustada al mismo inventario. La tabla da, por parcela, el número de árboles, N, G y V por hectárea, el diámetro cuadrático, la altura dominante y los muertos en pie; la figura ordena las parcelas por área basal y estrato.

**Método.**

<div class="method">
<p>Factor de expansión FE = 10 000 / a (a en m²). Por parcela: N = Σ FE; G = Σ FE·g; V = Σ FE·v; Dq = √(Σ FE·d²/N); altura dominante = media de las alturas de los 100 árboles más gruesos por hectárea (Assmann), contando cada árbol FE veces. Los árboles muertos en pie se informan aparte. Las alturas que faltan se estiman con una curva de Näslund ajustada a los árboles del mismo inventario que sí tienen altura.</p>
</div>

**Fuentes.**

- Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, cap. 12–13. Wiley.
- Assmann, E. (1970). <i>The Principles of Forest Yield Study</i>. Pergamon.

### 3.4 Estimación y error de muestreo

*La media por hectárea, su error estándar, el intervalo de confianza, el error de muestreo en % y el total del predio, según el diseño con que se tomaron las parcelas.*

**Cómo se usa.** Elige la variable (N, G o V por hectárea), el diseño con que se tomaron las parcelas, la confianza y si se corrige por población finita. La app da la media, su error estándar con sus grados de libertad, el intervalo de confianza, el error de muestreo en porcentaje y el total del predio. En el estratificado añade la tabla por estrato, el error que habría con la asignación óptima de Neyman y la eficiencia frente al muestreo simple; en el de conglomerados, el efecto de diseño.

**Método.**

<div class="method">
<p><b>Aleatorio simple:</b> ȳ, s²/n·(1 − n/N). <b>Estratificado:</b> ȳ<sub>st</sub> = Σ W<sub>h</sub>ȳ<sub>h</sub> con W<sub>h</sub> la proporción de superficie; V(ȳ<sub>st</sub>) = Σ W<sub>h</sub>² s<sub>h</sub>²/n<sub>h</sub>·(1 − f<sub>h</sub>) con la asignación que realmente se hizo, y los grados de libertad efectivos de Satterthwaite. Muchas tablas forestales usan (Σ W<sub>h</sub>s<sub>h</sub>)²/n, que solo es la varianza si la muestra se repartió con la asignación óptima de Neyman; la app da ese valor aparte para comparar. <b>Sistemático:</b> la varianza por diferencias sucesivas Σ(y<sub>i+1</sub> − y<sub>i</sub>)²/(2n(n − 1)) en el orden de la malla; menos pesimista que tratar la malla como aleatoria cuando hay tendencia espacial. <b>Conglomerados:</b> estimador de razón Σy<sub>i</sub>/Σm<sub>i</sub> con conglomerados de tamaño desigual; el efecto del diseño compara su varianza con la de parcelas independientes. Intervalo: ȳ ± t·EE; error de muestreo = t·EE/ȳ·100.</p>
</div>

**Fuentes.**

- Cochran, W. G. (1977). <i>Sampling Techniques</i>, 3.ª ed. Wiley.
- Shiver, B. D. y Borders, B. E. (1996). <i>Sampling Techniques for Forest Resource Inventory</i>. Wiley.
- Satterthwaite, F. E. (1946). An approximate distribution of estimates of variance components. <i>Biometrics Bulletin</i> 2:110–114.

### 3.5 Tamaño de muestra

*¿Cuántas parcelas hacen falta para un error de muestreo dado? Se itera la t de Student con los grados de libertad del tamaño que resulta.*

**Cómo se usa.** Escribe el coeficiente de variación (o tómalo del inventario cargado con el botón), el error permisible, la confianza y, si se conoce, el número de parcelas posibles. La app itera la t de Student hasta que el tamaño no cambia y, con estratos, reparte las parcelas con la asignación óptima o la proporcional.

**Método.**

<div class="method">
<p>Población infinita: n = t²·CV²/E². Finita (N parcelas posibles): n = t²·CV²/(E² + t²·CV²/N). Se empieza con t de 30 grados de libertad y se repite con n − 1 hasta que n no cambia. Por estratos, con D = E·ȳ<sub>st</sub>/t: asignación óptima n = (ΣW<sub>h</sub>s<sub>h</sub>)²/(D² + ΣW<sub>h</sub>s<sub>h</sub>²/N) y n<sub>h</sub> ∝ W<sub>h</sub>s<sub>h</sub>; proporcional n = ΣW<sub>h</sub>s<sub>h</sub>²/(D² + ΣW<sub>h</sub>s<sub>h</sub>²/N) y n<sub>h</sub> ∝ W<sub>h</sub>.</p>
</div>

**Fuentes.**

- Cochran, W. G. (1977). <i>Sampling Techniques</i>, §4.6 y §5.5. Wiley.
- Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, cap. 13. Wiley.

### 3.6 Relascopía (muestreo puntual)

*En cada punto se cuentan los árboles que el relascopio o la cuña dan como «dentro» con un factor de área basal (FAB); cada uno representa FAB/g árboles por hectárea.*

**Cómo se usa.** La tarjeta lleva una fila por árbol «dentro» en cada punto, con su DAP y, si se tiene, su altura. Con el factor de área basal del relascopio o la cuña, cada árbol representa FAB/g árboles por hectárea; la app da N, G y V por punto y su media con el error de muestreo.

**Método.**

<div class="method">
<p>Un árbol de diámetro d entra si está a menos de R = d/(2√FAB) m del punto (d en cm). Por punto: G = FAB × árboles contados; N = Σ FAB/g<sub>i</sub>; V = Σ FAB·v<sub>i</sub>/g<sub>i</sub>. La estimación entre puntos es la del muestreo aleatorio simple. Elige el FAB para contar de 7 a 15 árboles por punto.</p>
</div>

**Fuentes.**

- Bitterlich, W. (1948). Die Winkelzählprobe. <i>Allgemeine Forst- und Holzwirtschaftliche Zeitung</i> 59:4–5.
- Grosenbaugh, L. R. (1952). Plotless timber estimates — new, fast, easy. <i>Journal of Forestry</i> 50:32–37.

### 3.7 Estructura del rodal

*Distribución diamétrica con su modelo de Weibull, tabla de rodal, índice de valor de importancia e índices de densidad y competencia.*

**Cómo se usa.** Elige el ancho de clase, el número de parámetros de la Weibull, el estrato y el radio de búsqueda de vecinos. La app dibuja la distribución diamétrica con la Weibull ajustada por máxima verosimilitud y su bondad de ajuste, arma la tabla de rodal y de existencias por clase, calcula el índice de valor de importancia por especie, el índice de densidad de Reineke, el espaciamiento relativo de Hart–Becking y, con coordenadas, el índice de competencia de Hegyi de cada árbol.

**Método.**

<div class="method">
<p><b>Weibull:</b> f(x) = (c/b)((x − a)/b)<sup>c−1</sup>exp(−((x − a)/b)<sup>c</sup>), por máxima verosimilitud con cada árbol pesado por su factor de expansión (para que la subparcela chica cuente lo que representa); con 3 parámetros, la ubicación a se busca por verosimilitud perfilada por debajo del menor diámetro. Bondad de ajuste: Kolmogorov–Smirnov (p asintótico, conservador cuando los parámetros salen de la misma muestra) y χ² por clases con esperados ≥ 5. <b>IVI</b> = densidad relativa + dominancia relativa (área basal) + frecuencia relativa (proporción de parcelas con la especie); suma 300 (IVI % = IVI/3). <b>Reineke:</b> IDR = N·(Dq/25)<sup>1.605</sup>. <b>Hart–Becking:</b> S % = espaciamiento medio/altura dominante × 100, con espaciamiento √(10 000/N) en cuadro o √(20 000/(N√3)) en tresbolillo. <b>Hegyi:</b> IC<sub>i</sub> = Σ (D<sub>j</sub>/D<sub>i</sub>)/dist<sub>ij</sub> sobre los vecinos a menos de R m; los árboles a menos de R del borde se marcan porque les faltan vecinos.</p>
</div>

**Fuentes.**

- Bailey, R. L. y Dell, T. R. (1973). Quantifying diameter distributions with the Weibull function. <i>Forest Science</i> 19:97–104.
- Curtis, J. T. y McIntosh, R. P. (1951). An upland forest continuum in the prairie-forest border region of Wisconsin. <i>Ecology</i> 32:476–496.
- Reineke, L. H. (1933). Perfecting a stand-density index for even-aged forests. <i>J. Agric. Res.</i> 46:627–638.
- Wilson, F. G. (1946). Numerical expression of stocking in terms of height. <i>Journal of Forestry</i> 44:758–761.
- Hegyi, F. (1974). A simulation model for managing jack-pine stands. En <i>Growth Models for Tree and Stand Simulation</i>, pp. 74–90. Royal College of Forestry.

### 3.8 Validación

430 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b3.md`).

1. **Dos fórmulas distintas para el error del muestreo estratificado.** `forestmangr::strs` calcula el error estándar como √((Σ Pⱼ Sⱼ)²/n). Esa es la varianza del estimador estratificado solo si la muestra se repartió con la asignación óptima de Neyman. Con las 24 parcelas del mesófilo, repartidas 10, 8 y 6, su fórmula da 1.749 m²/ha. La de Cochran (1977, ec. 5.6) con la asignación realizada, Σ Wₕ² sₕ²/nₕ, da 2.154 m²/ha: un error de muestreo de 12.5 % en lugar de 9.5 %. La app usa la de Cochran, con los grados de libertad efectivos de Satterthwaite (10.6 en lugar de 23), y muestra la de Neyman aparte para quien quiera compararla con esas tablas. Cada una coincide con su referencia.
2. **forestmangr redondea sus salidas.** Su argumento `dec_places` admite como máximo 9 decimales. Las comparaciones contra sus valores usan tolerancia 1e-8; contra las fórmulas escritas aparte en R, 1e-12.
3. **forestmangr pide al menos dos columnas en sus tablas.** Con una sola columna (la variable) sus funciones fallan con «length and number of rows 'df' must be greater than 1»; la referencia les pasa también la columna de la parcela. No afecta los resultados.
4. **La Weibull de 3 parámetros no tiene máximo interior cuando la forma es menor que 1.** Su verosimilitud crece sin límite al acercar la ubicación al diámetro mínimo. La app y la referencia buscan la ubicación por verosimilitud perfilada con un margen de 0.2 % por debajo del menor diámetro, y la app avisa cuando la solución queda pegada a ese margen. Con los datos del mesófilo (forma > 1) las dos dan la misma ubicación a 1e-3.

## Capítulo 4. Bloque 4 · Biomasa y carbono

Convierte el inventario en biomasa y carbono por árbol, por parcela y para el predio, con la incertidumbre del modelo y la del muestreo, y suma los demás reservorios (necromasa, hojarasca, suelo) para el balance completo y su cambio en el tiempo.

### 4.1 Datos que usa

**Tarjeta de la sección «Necromasa, hojarasca y suelo»** (ejemplos: mesofilo).

| Columna | Contenido | |
|---|---|---|
| `transecto` | Transecto | obligatoria |
| `longitud_m` | Longitud (m) | obligatoria, número |
| `diametro_cm` | Diámetro en el cruce (cm) | obligatoria, número |
| `clase` | Clase de descomposición (1–3) | opcional, número |

**Tarjeta de la sección «Necromasa, hojarasca y suelo»** (ejemplos: cafetal).

| Columna | Contenido | |
|---|---|---|
| `parcela` | Parcela | obligatoria |
| `peso_seco_g` | Peso seco (g) | obligatoria, número |
| `marco_m2` | Superficie del marco (m²) | obligatoria, número |

**Tarjeta de la sección «Necromasa, hojarasca y suelo»** (ejemplos: cafetal).

| Columna | Contenido | |
|---|---|---|
| `parcela` | Parcela | obligatoria |
| `prof_sup` | Profundidad superior (cm) | obligatoria, número |
| `prof_inf` | Profundidad inferior (cm) | obligatoria, número |
| `co_pct` | Carbono orgánico (%) | obligatoria, número |
| `dap_g_cm3` | Densidad aparente (g/cm³) | obligatoria, número |
| `pedregosidad_pct` | Fragmentos gruesos (%) | opcional, número |

**Tarjeta de la sección «Reservorios y cambio entre inventarios»** (ejemplos: pino).

| Columna | Contenido | |
|---|---|---|
| `parcela` | Parcela | obligatoria |
| `c1` | Carbono en la 1.ª medición (Mg/ha) | obligatoria, número |
| `c2` | Carbono en la 2.ª medición (Mg/ha) | obligatoria, número |
| `edad1` | Año o edad 1 | opcional, número |
| `edad2` | Año o edad 2 | opcional, número |

### 4.2 Datos y ecuaciones

*Usa el inventario cargado en el Bloque 3 o carga un ejemplo aquí. Elige la ecuación por omisión y las reglas que asignan ecuaciones propias a ciertas especies o géneros.*

**Cómo se usa.** Usa el inventario del Bloque 3 o carga un ejemplo aquí. Elige la ecuación por omisión del catálogo; con «reglas» se asigna otra ecuación a una especie o a un género (la de especie gana a la de género), y en la tabla de ecuaciones propias se agregan otras con su forma, coeficientes, error residual, intervalo de DAP y fuente. Se eligen también el índice E de estrés ambiental si la ecuación lo pide, cómo se calcula la biomasa de raíces (IPCC 2006 por zona, Cairns et al. 1997 o una razón constante), la fracción de carbono (0.47 por omisión) y la fracción que queda en los muertos en pie. El catálogo completo, con la fuente de cada ecuación, se abre en «Método y fuentes» y está en `data/ecuaciones_alometricas.csv`.

**Método.**

<div class="method">
<div class="tbl-card"><div class="table-scroll tall"><table class="res-table"><thead><tr><th class="null" scope="col"><span data-l="es">Ecuación</span></th><th class="null" scope="col"><span data-l="es">Forma (AGB en kg)</span></th><th class="null" scope="col"><span data-l="es">Variables</span></th><th class="num" scope="col"><span data-l="es">σ (ln)</span></th><th class="null" scope="col"><span data-l="es">DAP válido (cm)</span></th><th class="null" scope="col"><span data-l="es">Fuente</span></th></tr></thead><tbody><tr><td class="null">Chave et al. 2014, ec. 4 (pantropical, con altura)</td><td class="null">AGB = 0.0673 · (ρD²H)^0.976</td><td class="null">D, H, ρ</td><td class="num">0.357</td><td class="null">5–212</td><td class="null">Chave, J. et al. (2014). Improved allometric models to estimate the aboveground biomass of tropical trees. <i>Global Change Biology</i> 20:3177–3190. doi:10.1111/gcb.12629</td></tr><tr><td class="null">Chave et al. 2014, ec. 7 (pantropical, sin altura, con E)</td><td class="null">AGB = exp(−1.803 − 0.976E + 0.976 ln ρ + 2.673 ln D − 0.0299 (ln D)²)</td><td class="null">D, ρ, E</td><td class="num">0.413</td><td class="null">5–212</td><td class="null">Chave, J. et al. (2014). <i>Global Change Biology</i> 20:3177–3190. E es el índice de estrés ambiental del sitio (ec. 6b).</td></tr><tr><td class="null">Chave et al. 2005, bosque seco con altura</td><td class="null">AGB = 0.112 · (ρD²H)^0.916</td><td class="null">D, H, ρ</td><td class="num">0.311</td><td class="null">5–156</td><td class="null">Chave, J. et al. (2005). Tree allometry and improved estimation of carbon stocks and balance in tropical forests. <i>Oecologia</i> 145:87–99. doi:10.1007/s00442-005-0100-x</td></tr><tr><td class="null">Chave et al. 2005, bosque húmedo con altura</td><td class="null">AGB = 0.0509 · ρD²H</td><td class="null">D, H, ρ</td><td class="num">0.316</td><td class="null">5–156</td><td class="null">Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.</td></tr><tr><td class="null">Chave et al. 2005, bosque muy húmedo con altura</td><td class="null">AGB = 0.0776 · (ρD²H)^0.940</td><td class="null">D, H, ρ</td><td class="num">0.311</td><td class="null">5–156</td><td class="null">Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.</td></tr><tr><td class="null">Chave et al. 2005, bosque seco sin altura</td><td class="null">AGB = ρ · exp(−0.667 + 1.784 ln D + 0.207 (ln D)² − 0.0281 (ln D)³)</td><td class="null">D, ρ</td><td class="num">0.356</td><td class="null">5–156</td><td class="null">Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.</td></tr><tr><td class="null">Chave et al. 2005, bosque húmedo sin altura</td><td class="null">AGB = ρ · exp(−1.499 + 2.148 ln D + 0.207 (ln D)² − 0.0281 (ln D)³)</td><td class="null">D, ρ</td><td class="num">0.356</td><td class="null">5–156</td><td class="null">Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.</td></tr><tr><td class="null">Chave et al. 2005, bosque muy húmedo sin altura</td><td class="null">AGB = ρ · exp(−1.239 + 1.980 ln D + 0.207 (ln D)² − 0.0281 (ln D)³)</td><td class="null">D, ρ</td><td class="num">0.356</td><td class="null">5–156</td><td class="null">Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.</td></tr><tr><td class="null">Brown 1997, trópico seco</td><td class="null">AGB = exp(−1.996 + 2.32 ln D)</td><td class="null">D</td><td class="num">—</td><td class="null">5–40</td><td class="null">Brown, S. (1997). <i>Estimating Biomass and Biomass Change of Tropical Forests: a Primer</i>. FAO Forestry Paper 134, ec. 3.2.1.</td></tr><tr><td class="null">Brown 1997, trópico húmedo</td><td class="null">AGB = exp(−2.134 + 2.530 ln D)</td><td class="null">D</td><td class="num">—</td><td class="null">5–148</td><td class="null">Brown, S. (1997). FAO Forestry Paper 134, ec. 3.2.4.</td></tr><tr><td class="null">Brown 1997, trópico muy húmedo</td><td class="null">AGB = 21.297 − 6.953·D + 0.740·D²</td><td class="null">D</td><td class="num">—</td><td class="null">4–112</td><td class="null">Brown, S. (1997). FAO Forestry Paper 134, ec. 3.2.5.</td></tr><tr><td class="null">Brown 1997, pinos</td><td class="null">AGB = exp(−1.170 + 2.119 ln D)</td><td class="null">D</td><td class="num">—</td><td class="null">2–52</td><td class="null">Brown, S. (1997). FAO Forestry Paper 134, ec. 3.2.8.</td></tr><tr><td class="null">Segura et al. 2006, árboles de sombra (general)</td><td class="null">log₁₀ AGB = −0.834 + 2.223 log₁₀ D</td><td class="null">D</td><td class="num">—</td><td class="null">5–44</td><td class="null">Segura, M., Kanninen, M. y Suárez, D. (2006). Allometric models for estimating aboveground biomass of shade trees and coffee bushes grown together. <i>Agroforestry Systems</i> 68:143–150. doi:10.1007/s10457-006-9005-x</td></tr><tr><td class="null">Segura et al. 2006, <i>Inga</i></td><td class="null">log₁₀ AGB = −0.936 + 2.348 log₁₀ D</td><td class="null">D</td><td class="num">—</td><td class="null">5–44</td><td class="null">Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150 (modelo de <i>Inga tonduzzi</i>).</td></tr><tr><td class="null">Segura et al. 2006, <i>Cordia alliodora</i></td><td class="null">log₁₀ AGB = −0.755 + 2.072 log₁₀ D</td><td class="null">D</td><td class="num">—</td><td class="null">5–44</td><td class="null">Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150.</td></tr><tr><td class="null">Segura et al. 2006, <i>Juglans olanchana</i></td><td class="null">log₁₀ AGB = −1.417 + 2.755 log₁₀ D</td><td class="null">D</td><td class="num">—</td><td class="null">5–44</td><td class="null">Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150.</td></tr><tr><td class="null">Segura et al. 2006, cafeto (d₁₅ y altura)</td><td class="null">log₁₀ AGB = −1.113 + 1.578 log₁₀ d₁₅ + 0.581 log₁₀ h</td><td class="null">d₁₅, H</td><td class="num">—</td><td class="null">0.3–10</td><td class="null">Segura, M. et al. (2006). <i>Agroforestry Systems</i> 68:143–150 (d₁₅: diámetro del tallo a 15 cm del suelo).</td></tr><tr><td class="null">van Noordwijk et al. 2002, café podado</td><td class="null">AGB = 0.281 · D^2.06</td><td class="null">D</td><td class="num">—</td><td class="null">0.5–15</td><td class="null">van Noordwijk, M. et al. (2002). Carbon stock assessment for a forest-to-coffee conversion landscape in Sumber-Jaya. <i>Science in China C</i> 45 (supl.):75–86. La fuente no indica a qué altura se mide D.</td></tr><tr><td class="null">van Noordwijk et al. 2002, plátano (pseudotallo)</td><td class="null">AGB = 0.030 · D^2.13</td><td class="null">D</td><td class="num">—</td><td class="null">5–40</td><td class="null">van Noordwijk, M. et al. (2002). <i>Science in China C</i> 45 (supl.):75–86.</td></tr><tr><td class="null">Díaz-Franco et al. 2007, <i>Pinus patula</i></td><td class="null">AGB = 0.0357 · D^2.6916</td><td class="null">D</td><td class="num">—</td><td class="null">6.7–64.1</td><td class="null">Díaz-Franco, R. et al. (2007). Determinación de ecuaciones alométricas para estimar biomasa y carbono en <i>Pinus patula</i>. <i>Madera y Bosques</i> 13(1):25–34. doi:10.21829/myb.2007.1311233</td></tr><tr><td class="null">Figueroa-Navarro et al. 2010, <i>Pinus patula</i> (D²H)</td><td class="null">AGB = 5.338 + 0.018635 · D²H</td><td class="null">D, H</td><td class="num">—</td><td class="null">5–60</td><td class="null">Figueroa-Navarro, C. M. et al. (2010). Estimación de la biomasa en un bosque bajo manejo de <i>Pinus patula</i>. <i>Rev. Mex. Cienc. For.</i> 1(1):105–112.</td></tr><tr><td class="null">Jenkins et al. 2003, álamo, aliso y sauce</td><td class="null">AGB = exp(-2.2094 + 2.3867 ln D)</td><td class="null">D</td><td class="num">0.507</td><td class="null">2.5–70</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, arce blando y abedul</td><td class="null">AGB = exp(-1.9123 + 2.3651 ln D)</td><td class="null">D</td><td class="num">0.492</td><td class="null">2.5–66</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, latifoliadas mixtas</td><td class="null">AGB = exp(-2.48 + 2.4835 ln D)</td><td class="null">D</td><td class="num">0.360</td><td class="null">2.5–56</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, arce duro, encino, nogal y haya</td><td class="null">AGB = exp(-2.0127 + 2.4342 ln D)</td><td class="null">D</td><td class="num">0.236</td><td class="null">2.5–73</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, cedro y alerce</td><td class="null">AGB = exp(-2.0336 + 2.2592 ln D)</td><td class="null">D</td><td class="num">0.295</td><td class="null">2.5–250</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, pseudotsuga</td><td class="null">AGB = exp(-2.2304 + 2.4435 ln D)</td><td class="null">D</td><td class="num">0.219</td><td class="null">2.5–210</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, abeto y tsuga</td><td class="null">AGB = exp(-2.5384 + 2.4814 ln D)</td><td class="null">D</td><td class="num">0.182</td><td class="null">2.5–230</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, pino</td><td class="null">AGB = exp(-2.5356 + 2.4349 ln D)</td><td class="null">D</td><td class="num">0.254</td><td class="null">2.5–180</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, picea</td><td class="null">AGB = exp(-2.0773 + 2.3323 ln D)</td><td class="null">D</td><td class="num">0.250</td><td class="null">2.5–250</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr><tr><td class="null">Jenkins et al. 2003, junípero, encino y mezquite (zonas secas)</td><td class="null">AGB = exp(-0.7152 + 1.7029 ln D)</td><td class="null">D</td><td class="num">0.384</td><td class="null">2.5–78</td><td class="null">Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12</td></tr></tbody></table></div><div class="btn-row tbl-tools no-print"><button type="button" class="btn btn-ghost btn-sm" data-act="4.5"><span data-l="es">⤓ CSV</span></button><button type="button" class="btn btn-ghost btn-sm" data-act="4.6"><span data-l="es">⤓ XLSX</span></button></div></div>
</div>

**Método.**

<div class="method">
<p>AGB en kg de materia seca por árbol; D = DAP (cm), H = altura total (m), ρ = densidad básica de la madera (g/cm³). Las ecuaciones de Chave et al. (2005) ya incluyen la corrección por el sesgo de regresar del logaritmo; la de Chave et al. (2014, ec. 4) se usa tal como se publicó. Cada ecuación vale en el intervalo de diámetros con que se ajustó: la app cuenta cuántos árboles quedan fuera. La raíz se estima con la razón raíz/tallo del Cuadro 4.4 del IPCC (2006) según la zona ecológica y la biomasa aérea de cada parcela, o con la ecuación 3 de Cairns et al. (1997) por hectárea. Carbono = biomasa × fracción de carbono (0.47 por omisión, Cuadro 4.3 del IPCC 2006); CO₂e = C × 44/12. Los árboles muertos en pie se calculan con la misma ecuación por la fracción que conservan, y se informan como necromasa.</p>
</div>

**Fuentes.**

- Cairns, M. A., Brown, S., Helmer, E. H. y Baumgardner, G. A. (1997). Root biomass allocation in the world's upland forests. <i>Oecologia</i> 111:1–11.
- IPCC (2006). <i>2006 IPCC Guidelines for National Greenhouse Gas Inventories</i>, vol. 4, cap. 4 (cuadros 4.3 y 4.4).
- Chave, J. et al. (2014). <i>Global Change Biology</i> 20:3177–3190.
- Chave, J. et al. (2005). <i>Oecologia</i> 145:87–99.

### 4.3 Densidad de la madera

*La tabla trae los valores de la base mundial de densidad de la madera para las especies de los ejemplos; edítala o agrega las tuyas. Si cargas la base completa, la búsqueda baja de especie a género y familia como en la implementación de referencia.*

**Cómo se usa.** La tabla trae la densidad básica de las especies de los ejemplos, de la Global Wood Density Database, y se puede editar. Si se carga la base completa (el archivo CSV de la GWDD), la búsqueda baja de especie a género y a familia como lo hace la implementación de referencia, por región. Los árboles sin dato toman la media de su parcela o del conjunto, y la app lo dice.

**Método.**

<div class="method">
<p>Densidad básica = masa anhidra / volumen verde. Orden de búsqueda: (1) tu tabla, por nombre exacto; (2) con la base mundial cargada, la media de los registros de la especie; si falta, la media de las medias de las especies del género; si falta y conoces la familia, la media de las medias de los géneros de la familia; (3) la media de los árboles de la misma parcela; (4) la media de todo el inventario. La desviación estándar que se usa en el Monte Carlo depende del nivel en que se encontró: 0.071 (especie), 0.094 (género) y 0.123 g/cm³ (familia), como en la implementación de referencia. La base mundial es de dominio público (CC0): Zanne et al. (2009), doi:10.5061/dryad.234.</p>
</div>

**Fuentes.**

- Zanne, A. E. et al. (2009). Data from: Towards a worldwide wood economics spectrum. Dryad, doi:10.5061/dryad.234.
- Chave, J. et al. (2009). Towards a worldwide wood economics spectrum. <i>Ecology Letters</i> 12:351–366.
- Réjou-Méchain, M. et al. (2017). BIOMASS: an R package for estimating above-ground biomass and its uncertainty in tropical forests. <i>Methods in Ecology and Evolution</i> 8:1163–1167.

### 4.4 Biomasa y carbono del inventario

*Por árbol, por parcela y para todo el predio, con el intervalo del muestreo.*

**Cómo se usa.** Aparece al cargar el inventario: biomasa aérea, de raíces, total, carbono y CO₂e por árbol, por parcela y por hectárea con su intervalo de muestreo, el total del predio, y el aviso de los árboles que quedan fuera del intervalo de diámetros en que se ajustó su ecuación.

### 4.5 Incertidumbre por Monte Carlo

*Repite el cálculo cientos de veces con diámetros, alturas y densidades perturbados por su error y con el error residual de cada ecuación. Da la incertidumbre de las mediciones y del modelo, que se suma a la del muestreo.*

**Cómo se usa.** Elige las iteraciones y los errores de medición (diámetro, altura medida y estimada) y si se incluye el error residual de cada ecuación. La app repite el cálculo con todo perturbado y da la distribución de la biomasa del rodal, su intervalo y su error relativo, y lo combina con el error de muestreo.

**Método.**

<div class="method">
<p>En cada iteración: D′ ~ normal truncada (0.1–500 cm) con DE = 0.0062·D + 0.0904 para el 95 % de los árboles y 4.64 cm para un 5 % sorteado (errores de medición de Chave et al. 2004), o con el CV elegido; H′ ~ normal truncada (1.3 m – máximo + 15 m) con el CV elegido, mayor para las alturas que se estimaron con una curva; ρ′ ~ normal truncada (0.08–1.39 g/cm³) con la DE de su nivel; y, si la ecuación publica su error residual σ en escala logarítmica, AGB′ = AGB(D′, H′, ρ′)·exp(ε − σ²/2) con ε ~ N(0, σ): el ruido tiene media uno porque las ecuaciones publicadas ya predicen la media (su intercepto incluye la corrección exp(σ²/2)). Se suma por parcela con su factor de expansión y se promedia entre parcelas. El intervalo es el de los percentiles 2.5 y 97.5. La incertidumbre total combina en cuadratura la del muestreo y la de Monte Carlo (método 1 de propagación del IPCC 2006, vol. 1, cap. 3). A diferencia de la implementación de referencia, no se sortean los coeficientes de la ecuación (no se publican sus distribuciones posteriores); el error residual domina en las ecuaciones pantropicales.</p>
</div>

**Fuentes.**

- Chave, J. et al. (2004). Error propagation and scaling for tropical forest biomass estimates. <i>Phil. Trans. R. Soc. B</i> 359:409–420.
- Réjou-Méchain, M. et al. (2017). <i>Methods in Ecology and Evolution</i> 8:1163–1167.
- IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 1, cap. 3: Uncertainties.

### 4.6 Necromasa, hojarasca y suelo

*Los otros reservorios de carbono, cada uno con su propia tabla.*

**Cómo se usa.** Tres tarjetas, una por reservorio: la madera caída por intersección de líneas (transecto, longitud, diámetro de cada pieza en el cruce y su clase de descomposición, con la densidad de cada clase), la hojarasca recogida en marcos (peso seco y superficie del marco) y el suelo por capas (profundidades, carbono orgánico, densidad aparente y fragmentos gruesos). Cada una da su reservorio en Mg/ha con su error estándar.

**Método.**

<div class="method">
<p><b>Madera caída</b> (Van Wagner 1968): V = π²·Σd²/(8L), con d en cm y L en m da m³/ha directamente; la masa es V por la densidad de su clase de descomposición (mídela en tu sitio; los valores por omisión son solo un punto de partida). <b>Hojarasca:</b> Mg/ha = gramos secos / m² del marco × 0.01. <b>Suelo:</b> Mg C/ha de una capa = C % × densidad aparente (g/cm³) × espesor (cm) × (1 − fragmentos gruesos/100); se suman las capas de cada perfil.</p>
</div>

**Fuentes.**

- Van Wagner, C. E. (1968). The line intersect method in forest fuel sampling. <i>Forest Science</i> 14:20–26.
- Pearson, T. R. H., Brown, S. L. y Birdsey, R. A. (2007). <i>Measurement Guidelines for the Sequestration of Forest Carbon</i>. USDA Forest Service, GTR NRS-18.

### 4.7 Reservorios y cambio entre inventarios

*El carbono de todos los reservorios con su error, y cuánto cambió entre dos mediciones.*

**Cómo se usa.** Reúne todos los reservorios con su error (se pueden agregar arbustos y otros), los suma con su error combinado y los pasa a CO₂e. La tarjeta del cambio lleva el carbono de cada parcela en dos mediciones; con las mismas parcelas el cambio es pareado y, con las edades o los años, se da la tasa anual.

**Método.**

<div class="method">
<p>Cada reservorio se estima con su propia muestra (parcelas, transectos, marcos o perfiles) y su error estándar. El total es la suma de las medias y su error estándar la raíz de la suma de los cuadrados, suponiendo errores independientes; el intervalo usa ±1.96·EE. <b>Cambio:</b> con las mismas parcelas, la media de las diferencias parcela a parcela y su error estándar (t pareada); con muestras independientes, la diferencia de medias con el error de Welch. La tasa anual divide entre los años transcurridos.</p>
</div>

**Fuentes.**

- IPCC (2006). <i>2006 IPCC Guidelines</i>, vol. 1, cap. 3 (ec. 3.1 y 3.2) y vol. 4, cap. 2.
- Welch, B. L. (1947). The generalization of «Student's» problem when several different population variances are involved. <i>Biometrika</i> 34:28–35.

### 4.8 Validación

4 974 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b4.md`).

1. **El Monte Carlo contaba dos veces el sesgo logarítmico (error de la app, corregido).** La primera versión multiplicaba la biomasa de cada árbol por exp(ε) con ε ~ N(0, σ). Así la media de Monte Carlo quedaba 6.6 % arriba del cálculo directo, justo exp(0.357²/2). Mi implementación independiente en R tenía el mismo error y por eso coincidían entre sí. Lo atrapó la comparación con `AGBmonteCarlo` de BIOMASS, cuya media sí coincidía con el cálculo directo (201.7 frente a 201.1 Mg/ha). La causa está en los parámetros posteriores del paquete: exp(media del intercepto) = 0.0632 y exp(media del intercepto + σ²/2) = 0.0674. **El 0.0673 publicado por Chave et al. (2014) ya incluye la corrección**, y la ecuación predice la media. Ahora el ruido residual tiene media uno, exp(ε − σ²/2), en la app y en la referencia. La media de la app coincide con la de BIOMASS a 0.03 %. La desviación estándar de BIOMASS es 7 % mayor porque además sortea los coeficientes.
2. **Límite de clase en la razón raíz/tallo (error de la app, corregido).** Con exactamente 150 t/ha de biomasa aérea, la app tomaba la clase «> 150» (0.20 en coníferas templadas y 0.24 en otras latifoliadas). En el Cuadro 4.4 del IPCC (2006) el intervalo «50–150» incluye el 150, que corresponde a 0.29 y 0.23. Ahora cada clase dice si su límite superior le pertenece.
3. **Una familia escrita distinto de la base (diferencia de convención, documentada).** La base mundial de densidad no usa subfamilias: todas las leguminosas son «Fabaceae». Si el usuario escribe «Fabaceae-mimosoideae», `getWoodDensity` busca especie y género junto con la familia y, al no encontrarlos, cae a la media del conjunto (0.701 para *Inga vera*). La app no descarta una especie encontrada por su nombre exacto y le da su valor de especie (0.575). Con familias escritas como en la base, las dos coinciden a 1e-12 en los cuatro niveles (especie, género, familia, conjunto) y por región.
4. **La ecuación 7 de Chave et al. (2014) no es la que usa la referencia sin altura.** BIOMASS usa un reajuste posterior (Réjou-Méchain et al. 2017) con otros coeficientes. La app usa la ecuación publicada. En los árboles de prueba difieren hasta 5.6 %; el dato queda informado en `resultados/b4.md`.
5. **Redondeo de la tabla de densidades.** La tabla de la app guarda 4 decimales, y la media de la parcela de las especies sin densidad (*Musa*, *Cyathea*) promedia esos valores redondeados: difiere de la referencia en 1e-5. La tolerancia de esas comparaciones es 5e-4. La búsqueda en la base completa coincide a 1e-12.

## Capítulo 5. Bloque 5 · Crecimiento y rendimiento

De cómo crece un árbol a cómo crece un rodal: incrementos, modelos de crecimiento, la calidad de sitio y la proyección con una tabla de producción.

### 5.1 Datos que usa

**Tarjeta de la sección «Incrementos y turno biológico»** (ejemplos: pino).

| Columna | Contenido | |
|---|---|---|
| `arbol` | Árbol o serie | obligatoria |
| `edad` | Edad (años) | obligatoria, número |
| `diametro` | Diámetro (cm) | opcional, número |
| `altura` | Altura (m) | opcional, número |
| `volumen` | Volumen (m³) | opcional, número |

**Tarjeta de la sección «Índice de sitio»** (ejemplos: pino).

| Columna | Contenido | |
|---|---|---|
| `parcela` | Parcela | obligatoria |
| `edad` | Edad (años) | obligatoria, número |
| `hdom` | Altura dominante (m) | obligatoria, número |
| `g_ha` | Área basal (m²/ha) | opcional, número |
| `v_ha` | Volumen (m³/ha) | opcional, número |
| `n_ha` | Árboles por hectárea | opcional, número |

### 5.2 Incrementos y turno biológico

*Con el análisis troncal o las remediciones de un árbol: el incremento corriente anual (ICA), el medio anual (IMA) y la edad en que el IMA es máximo.*

**Cómo se usa.** La tarjeta lleva series de un árbol (análisis troncal) o de una parcela (remediciones): árbol o serie, edad y la variable (diámetro, altura, volumen). Elige la variable y, si falta el volumen, el coeficiente mórfico para calcularlo. La app da el incremento corriente anual, el medio anual y la edad en que este es máximo (el turno biológico o de máxima producción en volumen).

**Método.**

<div class="method">
<p>ICA entre dos mediciones = (Y<sub>2</sub> − Y<sub>1</sub>)/(t<sub>2</sub> − t<sub>1</sub>); IMA = Y/t. Mientras el ICA supera al IMA, el IMA crece; el máximo del IMA (turno biológico o de máxima producción en volumen) está donde las dos curvas se cruzan. Si no hay volumen medido, se calcula como g·H·f con el coeficiente mórfico.</p>
</div>

**Fuentes.**

- Assmann, E. (1970). <i>The Principles of Forest Yield Study</i>. Pergamon.
- Davis, L. S., Johnson, K. N., Bettinger, P. S. y Howard, T. E. (2001). <i>Forest Management</i>, 4.ª ed. McGraw-Hill.

### 5.3 Modelos de crecimiento

*Cuatro curvas sigmoides ajustadas a la serie elegida, con la edad del máximo incremento corriente y del máximo incremento medio de cada una.*

**Cómo se usa.** Con la serie del árbol elegido en la sección anterior, la app ajusta Chapman–Richards, Gompertz, Schumacher y la logística, los compara por AIC y da, para cada uno, la edad del máximo incremento corriente (la inflexión) y la del máximo incremento medio.

**Método.**

<div class="method">
<p><b>Chapman–Richards:</b> Y = A(1 − e<sup>−kt</sup>)<sup>p</sup>. <b>Gompertz:</b> Y = A·exp(−b·e<sup>−kt</sup>). <b>Schumacher:</b> Y = A·exp(−b/t). <b>Logística:</b> Y = A/(1 + b·e<sup>−kt</sup>). A es la asíntota. Ajuste por mínimos cuadrados no lineales desde varios puntos de arranque; AIC con la verosimilitud normal. La edad del máximo ICA es la del punto de inflexión (máximo de dY/dt) y la del máximo IMA, la del máximo de Y/t; ambas se buscan en la curva ajustada. Gompertz y la logística no pasan por el origen, así que su IMA solo se busca desde la menor edad observada.</p>
</div>

**Fuentes.**

- Richards, F. J. (1959). A flexible growth function for empirical use. <i>J. Exp. Bot.</i> 10:290–300.
- Gompertz, B. (1825). On the nature of the function expressive of the law of human mortality. <i>Phil. Trans. R. Soc.</i> 115:513–583.
- Schumacher, F. X. (1939). A new growth curve and its application to timber yield studies. <i>Journal of Forestry</i> 37:819–820.
- Zeide, B. (1993). Analysis of growth equations. <i>Forest Science</i> 39:594–616.

### 5.4 Índice de sitio

*La altura dominante que alcanza cada parcela a la edad base: curvas anamórficas o polimórficas ajustadas a las remediciones, y la clase de sitio de cada parcela.*

**Cómo se usa.** La tarjeta lleva remediciones de parcelas: parcela, edad y altura dominante (y, si se tienen, G, V y N, que usa la proyección). Elige la edad base, la familia de curvas (anamórficas de Schumacher o de Chapman–Richards, o polimórficas por diferencias algebraicas) y el número de clases. La app dibuja las curvas, da el índice de sitio de cada parcela y su clase.

**Método.**

<div class="method">
<p><b>Anamórficas:</b> todas las curvas tienen la forma de una curva guía y difieren solo en escala. Con Schumacher, ln H = b₀ + b₁/t (mínimos cuadrados ordinarios) e IS = H·exp(b₁(1/t<sub>b</sub> − 1/t)); con Chapman–Richards, la curva guía H = A(1 − e<sup>−kt</sup>)<sup>p</sup> e IS = H·[(1 − e<sup>−k·t<sub>b</sub></sup>)/(1 − e<sup>−kt</sup>)]<sup>p</sup>. <b>Polimórficas</b> (diferencias algebraicas, ADA): Chapman–Richards con asíntota A y forma p comunes y tasa k propia de cada sitio, que se despeja de una medición; con dos mediciones de la misma parcela, H₂ = A[1 − (1 − (H₁/A)<sup>1/p</sup>)<sup>t₂/t₁</sup>]<sup>p</sup>, ajustada a los pares de remediciones sucesivas; la curva de un sitio pasa por (t<sub>b</sub>, IS). El índice de una parcela es la media de los índices de sus mediciones; las clases dividen el intervalo de índices en partes iguales (I = la mejor).</p>
</div>

**Fuentes.**

- Clutter, J. L., Fortson, J. C., Pienaar, L. V., Brister, G. H. y Bailey, R. L. (1983). <i>Timber Management: a Quantitative Approach</i>. Wiley.
- Bailey, R. L. y Clutter, J. L. (1974). Base-age invariant polymorphic site curves. <i>Forest Science</i> 20:155–159.
- Cieszewski, C. J. y Bailey, R. L. (2000). Generalized algebraic difference approach. <i>Forest Science</i> 46:116–126.

### 5.5 Proyección del rodal y tabla de producción

*El sistema compatible de Clutter ajustado a las mismas remediciones proyecta el área basal y el volumen; con la supervivencia y la curva de sitio forma la tabla de producción, que puedes editar.*

**Cómo se usa.** Con las remediciones con área basal, la app ajusta el sistema de Clutter (área basal futura y volumen) por mínimos cuadrados en dos etapas. Escribe el índice de sitio, la edad, el área basal y la densidad iniciales, la mortalidad anual, la edad final y el intervalo: sale la tabla de producción (altura dominante, N, G, V, ICA e IMA) con la edad de máximo IMA. La tabla se puede editar a mano.

**Método.**

<div class="method">
<p>Sistema de Clutter (1963), compatible: el crecimiento integrado da el rendimiento. Área basal: ln G₂ = ln G₁·(t₁/t₂) + α₀(1 − t₁/t₂) + α₁(1 − t₁/t₂)·S. Volumen: ln V₂ = β₀ + β₁/t₂ + β₂·S + β₃·ln G₂. Se ajusta a los pares de remediciones sucesivas como suele aplicarse: la ecuación de área basal sin intercepto y con el coeficiente de ln G₁·t₁/t₂ fijo en 1 (mínimos cuadrados), y la de volumen por mínimos cuadrados en dos etapas, con ln G₂ sustituido por su proyección sobre todas las variables exógenas. S es el índice de sitio de cada parcela de la sección anterior. La tabla agrega la altura dominante de la curva de sitio, la supervivencia a tasa anual constante N = N₀(1 − m)<sup>t − t₀</sup> y Dq = √(40 000·G/(π·N)). Si editas la tabla, el ICA, el IMA y el turno se recalculan.</p>
</div>

**Fuentes.**

- Clutter, J. L. (1963). Compatible growth and yield models for loblolly pine. <i>Forest Science</i> 9:354–371.
- Campos, J. C. C. y Leite, H. G. (2017). <i>Mensuração Florestal</i>, 5.ª ed. UFV.
- Theil, H. (1953). Repeated least squares applied to complete equation systems. Central Planning Bureau, La Haya.

### 5.6 Validación

616 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b5.md`).

1. **La edad del IMA máximo de Gompertz y la logística salía en 0.05 años (error de la app, corregido).** Esas curvas no pasan por el origen: Y(0) = A·e⁻ᵇ en Gompertz y A/(1 + b) en la logística. Por eso Y/t crece sin límite cerca de cero, y la búsqueda del máximo terminaba en el borde inferior. Ahora el máximo del IMA se busca desde la menor edad observada, y la app marca «en el borde» cuando cae en un extremo (con el árbol T1 del ejemplo, Gompertz y la logística quedan así). Chapman–Richards y Schumacher, que sí pasan por el origen, coinciden con R a 1e-6 en las dos edades críticas.
2. **Errores estándar del sistema de Clutter: dos fórmulas legítimas.** Los coeficientes de la app coinciden con `forestmangr::fit_clutter` y con `systemfit` en todos los dígitos. Los errores estándar no: `fit_clutter` estima las dos ecuaciones juntas con restricciones, y `systemfit` mete entonces en las varianzas la covarianza residual entre ecuaciones (−0.00146), con lo que β₀ queda con EE 0.554. La app usa los errores de una sola ecuación: 2SLS del volumen (EE de β₀ = 0.626) y mínimos cuadrados del área basal con las restricciones sustituidas. Coinciden con `systemfit` sin restricciones y con `lm` a 1e-4.
3. **Una trampa de la referencia en R.** Al proyectar con los coeficientes de `systemfit`, los nombres de los coeficientes pasaban al resultado de `sapply` («G.X2» en lugar de «G») y la extracción por nombre fallaba. Se resolvió quitando los nombres antes de proyectar; no afecta a la app.
4. **Precisión de la edad de inflexión.** El máximo de dY/dt es plano y la derivada se calcula por diferencias centrales. La edad sale con un error relativo de 4e-6 frente a la fórmula exacta de Chapman–Richards, t = ln(p)/k: de sobra para un turno, y así quedó la tolerancia de la prueba unitaria.

## Capítulo 6. Bloque 6 · Diversidad y ecología

La diversidad del inventario: cuántas especies hay y en qué proporción, cuántas faltan por registrar, qué tanto se parecen los sitios, cómo se reparten las especies en altura y cómo se reparten los árboles en el espacio.

### 6.1 Datos que usa

**Tarjeta de la sección «La comunidad»** (ejemplos: mesofilo, cafetal).

| Columna | Contenido | |
|---|---|---|
| `sitio` | Sitio o parcela | obligatoria |
| `especie` | Especie | obligatoria |
| `abundancia` | Abundancia (vacío = 1 individuo) | opcional, número |
| `grupo` | Grupo (estrato, finca…) | opcional |
| `altura` | Altura (m), para la estructura vertical | opcional, número |

**Tarjeta de la sección «Patrón espacial de los árboles»** (ejemplos: mesofilo).

| Columna | Contenido | |
|---|---|---|
| `x` | x (m) | obligatoria, número |
| `y` | y (m) | obligatoria, número |
| `especie` | Especie | opcional |
| `dap` | DAP (cm) | opcional, número |
| `grupo` | Grupo (piso, cohorte…) | opcional |

### 6.2 La comunidad

*Una tabla larga: sitio, especie y abundancia (o una fila por individuo). La columna de grupo, si la hay, colorea los sitios en la ordenación.*

**Cómo se usa.** La tarjeta es una tabla larga: sitio, especie y abundancia (si no hay abundancia, cada fila es un individuo), más un grupo opcional (estrato, finca) que colorea los sitios en la ordenación y la altura de cada individuo para la estructura vertical. El inventario del Bloque 3 se puede usar directamente. La app arma la matriz de sitios por especies.

### 6.3 Índices de diversidad

*Por sitio y para todo el conjunto.*

**Cómo se usa.** No pide nada: da, por sitio y para todo el conjunto, la riqueza, Shannon, Simpson, Pielou, el α de Fisher, Chao1 y ACE con la cobertura de la muestra.

**Método.**

<div class="method">
<p>Con p<sub>i</sub> = n<sub>i</sub>/N: Shannon H′ = −Σp<sub>i</sub> ln p<sub>i</sub>; Simpson λ = Σp<sub>i</sub>², 1 − λ y 1/λ; Pielou J = H′/ln S; α de Fisher, de S = α ln(1 + N/α); Margalef (S − 1)/ln N; Menhinick S/√N. Riqueza estimada: Chao1 corregido por sesgo, S + f₁(f₁ − 1)/(2(f₂ + 1)), y ACE con las especies de 10 individuos o menos como raras. Cobertura de la muestra (Chao y Jost): Ĉ = 1 − (f₁/n)·[(n − 1)f₁/((n − 1)f₁ + 2f₂)], la fracción de los individuos de la comunidad que pertenecen a especies ya registradas.</p>
</div>

**Fuentes.**

- Magurran, A. E. (2004). <i>Measuring Biological Diversity</i>. Blackwell.
- Fisher, R. A., Corbet, A. S. y Williams, C. B. (1943). The relation between the number of species and the number of individuals. <i>J. Anim. Ecol.</i> 12:42–58.
- Chao, A. (1987). Estimating the population size for capture-recapture data with unequal catchability. <i>Biometrics</i> 43:783–791.
- Chao, A. y Lee, S.-M. (1992). Estimating the number of classes via sample coverage. <i>JASA</i> 87:210–217.
- Chao, A. y Jost, L. (2012). Coverage-based rarefaction and extrapolation. <i>Ecology</i> 93:2533–2547.

### 6.4 Números de Hill, rarefacción y acumulación

*La diversidad en una sola escala de «especies efectivas», y cómo crece la riqueza con el esfuerzo de muestreo.*

**Cómo se usa.** Tampoco pide nada: dibuja el perfil de diversidad de Hill (q de 0 a 3) observado y estimado, la curva de rarefacción y extrapolación por individuos y la de acumulación por sitios con su banda.

**Método.**

<div class="method">
<p>Números de Hill: <sup>q</sup>D = (Σp<sub>i</sub><sup>q</sup>)<sup>1/(1−q)</sup>; q = 0 es la riqueza, q = 1 exp(H′) y q = 2 el inverso de Simpson: el número de especies igualmente abundantes que daría la misma diversidad. El perfil decrece con q; cuanto más rápido, más dominada la comunidad. Estimadores asintóticos (Chao et al. 2013, 2014): riqueza S + ((n − 1)/n)·f₁²/(2f₂); entropía de Shannon por la fórmula de Chao, Wang y Jost; Simpson n(n − 1)/Σx(x − 1). Rarefacción por individuos (Hurlbert): E[S<sub>m</sub>] = Σ[1 − C(n − x<sub>i</sub>, m)/C(n, m)]; extrapolación hasta 2n: S + f̂₀[1 − (1 − f₁/(nf̂₀ + f₁))<sup>m − n</sup>]. Acumulación por parcelas: la expectativa exacta de especies en t parcelas y su desviación estándar condicionada a la muestra (Kindt; Colwell et al.).</p>
</div>

**Fuentes.**

- Hill, M. O. (1973). Diversity and evenness: a unifying notation and its consequences. <i>Ecology</i> 54:427–432.
- Chao, A., Wang, Y. T. y Jost, L. (2013). Entropy and the species accumulation curve. <i>Methods Ecol. Evol.</i> 4:1091–1100.
- Chao, A. et al. (2014). Rarefaction and extrapolation with Hill numbers. <i>Ecological Monographs</i> 84:45–67.
- Hurlbert, S. H. (1971). The nonconcept of species diversity. <i>Ecology</i> 52:577–586.
- Colwell, R. K., Mao, C. X. y Chang, J. (2004). Interpolating, extrapolating, and comparing incidence-based species accumulation curves. <i>Ecology</i> 85:2717–2727.

### 6.5 Similitud entre sitios y ordenación

*Qué tanto comparten especies los sitios, un dendrograma y una ordenación no métrica.*

**Cómo se usa.** Elige el índice (Bray–Curtis con abundancias, Jaccard o Sørensen con presencias). La app da la matriz, el dendrograma UPGMA con su correlación cofenética y la ordenación NMDS con su estrés, coloreada por grupo. Los botones descargan la matriz sitios × especies en CSV y abren ClusteringPro o PCAPro, donde se carga con «Abrir archivo».

**Método.**

<div class="method">
<p>Disimilitudes: Jaccard (b + c)/(a + b + c) y Sørensen (b + c)/(2a + b + c) con presencia y ausencia (a = especies compartidas, b y c = exclusivas), y Bray–Curtis Σ|x − y|/Σ(x + y) con abundancias. Dendrograma por UPGMA (promedio aritmético no ponderado); la correlación cofenética mide qué tan bien conserva el árbol las disimilitudes. Ordenación: escalamiento multidimensional no métrico en 2 dimensiones que minimiza el estrés-1 de Kruskal con regresión monótona, desde el escalamiento clásico y 20 configuraciones aleatorias; se rota a sus ejes principales. Estrés &lt; 0.10 es una buena representación y &gt; 0.20, una pobre.</p>
</div>

**Fuentes.**

- Legendre, P. y Legendre, L. (2012). <i>Numerical Ecology</i>, 3.ª ed. Elsevier.
- Kruskal, J. B. (1964). Nonmetric multidimensional scaling: a numerical method. <i>Psychometrika</i> 29:115–129.
- de Leeuw, J. y Mair, P. (2009). Multidimensional scaling using majorization: SMACOF in R. <i>J. Stat. Softw.</i> 31(3).
- Sokal, R. R. y Rohlf, F. J. (1962). The comparison of dendrograms by objective methods. <i>Taxon</i> 11:33–40.

### 6.6 Estructura vertical

*Cómo se reparten las especies en los pisos del bosque.*

**Cómo se usa.** Con la altura de los individuos, la app divide el rodal en tres pisos según la altura máxima y calcula el índice de Pretzsch: la diversidad de especies repartida entre los pisos, comparada con su máximo posible.

**Método.**

<div class="method">
<p><b>Índice de perfil de especies de Pretzsch:</b> A = −ΣΣ p<sub>ij</sub> ln p<sub>ij</sub>, con p<sub>ij</sub> la proporción de individuos de la especie i en la zona de altura j: zona I, más de 80 % de la altura máxima; II, de 50 a 80 %; III, hasta 50 %. A<sub>máx</sub> = ln(S·3) y A<sub>rel</sub> = 100·A/A<sub>máx</sub>: cerca de 100 %, todas las especies en todos los pisos en igual proporción. <b>Estratos por la media y la desviación estándar de la altura:</b> inferior por debajo de la media − 1 DE, superior por encima de la media + 1 DE.</p>
</div>

**Fuentes.**

- Pretzsch, H. (1996). Strukturvielfalt als Ergebnis waldbaulichen Handelns. <i>DVFFA, Sektion Ertragskunde</i>, pp. 134–154.
- Pretzsch, H. (2009). <i>Forest Dynamics, Growth and Yield</i>. Springer.
- Souza, D. R. et al. (2003). Análise estrutural em floresta ombrófila densa de terra firme. <i>Revista Árvore</i> 27:75–83.

### 6.7 Patrón espacial de los árboles

*Con las coordenadas de cada tallo en una parcela rectangular: ¿agregados, al azar o regulares?*

**Cómo se usa.** La tarjeta pide las coordenadas x, y de cada tallo en una parcela rectangular (y, si se quiere, la especie, el DAP o un grupo para filtrar). Escribe las dimensiones de la parcela, la distancia máxima y las simulaciones. La app da el índice de Clark–Evans con la corrección de borde de Donnelly y su prueba, y las funciones K y L de Ripley con la envolvente de simulaciones de un patrón completamente aleatorio.

**Método.**

<div class="method">
<p><b>Clark y Evans:</b> R = d̄<sub>obs</sub>/d̄<sub>esp</sub>, con d̄<sub>obs</sub> la distancia media al vecino más cercano y d̄<sub>esp</sub> = 1/(2√λ) bajo aleatoriedad espacial completa; R &lt; 1 indica agregación y R &gt; 1 regularidad. La corrección de Donnelly (1978) suma (0.0514 + 0.0412/√n)·P/n al valor esperado por el efecto del borde (P = perímetro). z = (R − 1)/EE con EE de d̄<sub>obs</sub> = √((4 − π)A/(4π))/n. <b>K de Ripley</b> con corrección por traslación: K(r) = A/(n(n − 1)) Σ<sub>i≠j</sub> 1(d<sub>ij</sub> ≤ r)·A/((W − |Δx|)(H − |Δy|)); L(r) = √(K/π), y L(r) − r por arriba de la envolvente indica agregación a esa escala, por debajo, regularidad. La envolvente es la mínima y la máxima de L(r) − r en simulaciones de aleatoriedad completa con el mismo número de árboles.</p>
</div>

**Fuentes.**

- Clark, P. J. y Evans, F. C. (1954). Distance to nearest neighbor as a measure of spatial relationships in populations. <i>Ecology</i> 35:445–453.
- Donnelly, K. P. (1978). Simulations to determine the variance and edge effect of total nearest neighbour distance. En <i>Simulation Methods in Archaeology</i>, pp. 91–95. Cambridge University Press.
- Ripley, B. D. (1977). Modelling spatial patterns. <i>J. R. Stat. Soc. B</i> 39:172–212.
- Ohser, J. (1983). On estimators for the reduced second moment measure of point processes. <i>Math. Operationsforsch. Statist.</i> 14:63–71.
- Baddeley, A., Rubak, E. y Turner, R. (2015). <i>Spatial Point Patterns: Methodology and Applications with R</i>. CRC Press.

### 6.8 Validación

1 222 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b6.md`).

1. **El α de Fisher de la referencia es menos preciso que el de la app.** `vegan::fisher.alpha` resuelve S = α·ln(1 + N/α) con la tolerancia por omisión de `uniroot` (≈1.2e-4). Por eso difería de la app hasta en 2.5e-6 relativos. Con su valor, el residuo de la ecuación en la parcela M01 es 1.8e-5; con el de la app, 2e-9. La referencia ahora resuelve la misma ecuación con tolerancia 1e-14 y coincide con la app a 1e-9. La comparación con vegan queda con tolerancia 1e-5.
2. **La ordenación se encogía (error visual de la app, corregido).** Las iteraciones de SMACOF con disparidades reescaladas reducían la configuración hasta coordenadas de ±0.001. El estrés no depende de la escala, así que el resultado era correcto, pero la figura no se leía. Ahora, en cada iteración, las distancias se llevan a la escala de las disimilitudes. El estrés-1 sigue en 0.0900, entre el de `isoMDS` (0.0904) y el de `metaMDS` con 50 inicios (0.0899).
3. **Convenciones de iNEXT.** `ChaoShannon` devuelve la entropía, no su exponencial. `ChaoSimpson` devuelve 1 − Σx(x − 1)/(n(n − 1)), no el inverso. Los dos imprimen 3 decimales, así que la comparación con ellos usa 1e-3. Con la entropía y el inverso de Simpson de la app, convertidos a esas escalas, coinciden.
4. **La varianza «exacta» de la curva de acumulación** de vegan está condicionada a la muestra e incluye las correlaciones de presencia entre especies. La app la calcula igual y coincide a 1e-8 en las 24 parcelas.

## Capítulo 7. Bloque 7 · Sistemas agroforestales

Los sistemas en que los árboles conviven con un cultivo: cuánta sombra dan, cómo responde el cultivo a ella, cómo se acomodan los árboles en el terreno y cuánto carbono guarda el sistema frente a un monocultivo. El ejemplo es el cafetal bajo sombra.

### 7.1 Datos que usa

**Tarjeta de la sección «Sombra y rendimiento del cultivo»** (ejemplos: cafetal).

| Columna | Contenido | |
|---|---|---|
| `parcela` | Parcela | opcional |
| `sombra` | Sombra (%) | obligatoria, número |
| `rendimiento` | Rendimiento | obligatoria, número |
| `grupo` | Grupo (manejo) | opcional |

### 7.2 Sombra a partir del inventario

*Densidad, área basal, cobertura de copas y complejidad de la sombra en cada parcela, y su resumen por tipo de manejo.*

**Cómo se usa.** «Cargar el cafetal de ejemplo» o «Usar el inventario del Bloque 3» (con el diámetro de copa de cada árbol). La app da, por parcela, la densidad, el área basal, la suma de las áreas de copa y la cobertura corregida por traslape, la riqueza de especies de sombra y el índice de complejidad de Holdridge, y los resume por tipo de manejo.

**Método.**

<div class="method">
<p>Por parcela: árboles de sombra por hectárea, área basal, riqueza de especies de sombra y altura media. <b>Cobertura de copas:</b> la suma de las áreas de copa (π·c²/4) entre la superficie de la parcela, que puede pasar de 100 % porque las copas se enciman, y la cobertura corregida por traslape aleatorio, C = 1 − exp(−Σa/A), que estima la fracción del suelo bajo al menos una copa. <b>Índice de complejidad de Holdridge:</b> IC = especies × árboles × área basal (m²) × altura media (m) / 1000, con árboles y área basal llevados a 0.1 ha.</p>
</div>

**Fuentes.**

- Crookston, N. L. y Stage, A. R. (1999). <i>Percent Canopy Cover and Stand Structure Statistics from the Forest Vegetation Simulator</i>. USDA Forest Service, GTR RMRS-24.
- Holdridge, L. R., Grenke, W. C., Hatheway, W. H., Liang, T. y Tosi, J. A. (1971). <i>Forest Environments in Tropical Life Zones: a Pilot Study</i>. Pergamon.
- Moguel, P. y Toledo, V. M. (1999). Biodiversity conservation in traditional coffee systems of Mexico. <i>Conservation Biology</i> 13:11–21.

### 7.3 Sombra a partir de una fotografía del dosel

*Una foto hemisférica (con lente de ojo de pez, desde abajo y hacia el cenit) o una foto normal hacia arriba. La app separa cielo y follaje y mide la apertura del dosel.*

**Cómo se usa.** Abre una foto hemisférica (ojo de pez, tomada desde abajo hacia el cenit) o una foto normal hacia arriba, o usa la foto sintética de ejemplo. Elige el canal (el azul separa mejor el cielo del follaje), el umbral (vacío = Otsu) y el radio del círculo útil. La app muestra la foto segmentada y da la fracción de huecos, la apertura ponderada por ángulo sólido y la cobertura del dosel. La foto no sale del equipo.

**Método.**

<div class="method">
<p>Cada píxel se reduce a un nivel de gris del canal azul (el cielo es mucho más brillante que las hojas en azul) o de la luminancia. El umbral separa cielo (por encima) y dosel; por omisión es el de Otsu, que maximiza la varianza entre las dos clases del histograma. Con la foto hemisférica solo cuenta el círculo de la lente, y en una lente equiangular el ángulo cenital es θ = 90°·ρ/R; la <b>fracción de huecos</b> cuenta cada píxel igual y la <b>apertura del dosel</b> pesa cada píxel por el ángulo sólido que representa (sen θ/ρ), así que el cielo cerca del horizonte pesa más. Cobertura del dosel = 1 − apertura. Toma la foto con cielo uniformemente nublado o al amanecer, sin sol directo en el cuadro.</p>
</div>

**Fuentes.**

- Otsu, N. (1979). A threshold selection method from gray-level histograms. <i>IEEE Trans. Syst. Man Cybern.</i> 9:62–66.
- Jonckheere, I. et al. (2004). Review of methods for in situ leaf area index determination. Part I. <i>Agric. For. Meteorol.</i> 121:19–35.
- Frazer, G. W., Canham, C. D. y Lertzman, K. P. (1999). <i>Gap Light Analyzer (GLA) 2.0: users manual</i>. Simon Fraser University.

### 7.4 Sombra y rendimiento del cultivo

*La regresión del rendimiento sobre la sombra, lineal o cuadrática, y la sombra que da el rendimiento máximo con su intervalo.*

**Cómo se usa.** La tarjeta lleva la sombra (%) y el rendimiento de cada parcela, con un grupo opcional. La app ajusta la regresión lineal y la cuadrática, las compara y, si la cuadrática tiene máximo, da la sombra del rendimiento máximo con su intervalo por el método delta.

**Método.**

<div class="method">
<p>Mínimos cuadrados ordinarios: rendimiento = b₀ + b₁·S (lineal) y rendimiento = b₀ + b₁·S + b₂·S² (cuadrática). La prueba F del término cuadrático y el AIC deciden el modelo. Si b₂ &lt; 0, la sombra del rendimiento máximo es S* = −b₁/(2b₂), con error estándar por el método delta: ∇S* = (−1/(2b₂), b₁/(2b₂²)) aplicado a la covarianza de (b₁, b₂). La banda es el intervalo de confianza del 95 % de la media.</p>
</div>

**Fuentes.**

- Soto-Pinto, L., Perfecto, I., Castillo-Hernández, J. y Caballero-Nieto, J. (2000). Shade effect on coffee production at the northern Tzeltal zone of the state of Chiapas, Mexico. <i>Agric. Ecosyst. Environ.</i> 80:61–69.
- Weisberg, S. (2014). <i>Applied Linear Regression</i>, 4.ª ed., sec. 7.6 (método delta). Wiley.

### 7.5 Diseño de plantación

*Cuántos árboles caben y cómo se acomodan en un terreno rectangular.*

**Cómo se usa.** Elige el arreglo (marco real, tresbolillo, rectángulo, callejones, cerco vivo o linderos), las dimensiones del terreno, las distancias y, si se quiere, el cultivo intercalado y el costo por árbol. La app dibuja el arreglo en SVG y cuenta los árboles, su densidad por hectárea y su costo.

**Método.**

<div class="method">
<p>Las posiciones se generan dentro del terreno dejando media distancia en los bordes. Densidad teórica de un arreglo infinito: cuadro 10 000/a²; rectángulo 10 000/(a·b); tresbolillo 10 000/(a²·√3/2), un 15.5 % más árboles que el cuadro con la misma distancia; callejones 10 000/(a·ancho). El cerco vivo pone un árbol cada a metros a lo largo del perímetro y los linderos, en los dos lados largos. El cultivo bajo los árboles se dibuja en su propio marco para ver cómo conviven.</p>
</div>

**Fuentes.**

- Nair, P. K. R. (1993). <i>An Introduction to Agroforestry</i>. Kluwer.
- Evans, J. y Turnbull, J. W. (2004). <i>Plantation Forestry in the Tropics</i>, 3.ª ed. Oxford University Press.

### 7.6 Presupuesto de carbono del sistema

*El carbono de los árboles de sombra, del cultivo, de la hojarasca y del suelo, frente a un monocultivo a pleno sol.*

**Cómo se usa.** Escribe los cafetos por hectárea del sistema y del monocultivo, el carbono del suelo y la hojarasca del monocultivo, la fracción de carbono y la razón raíz/tallo del cultivo, o pulsa «Calcular con el cafetal de ejemplo». La app suma el carbono de los árboles de sombra, del cultivo, de la hojarasca y del suelo y lo compara con el monocultivo a pleno sol, en carbono y en CO₂e.

**Método.**

<div class="method">
<p>Árboles de sombra: biomasa aérea con las ecuaciones de Segura et al. (2006) para <i>Inga</i> y <i>Cordia</i>, van Noordwijk et al. (2002) para el plátano y Chave et al. (2014) con la densidad de la madera para el resto; raíces con la razón del IPCC (2006) para montañas tropicales (0.27). Cafetos: Segura et al. (2006) con el diámetro a 15 cm y la altura, por la densidad de plantación. Hojarasca y suelo de las tablas del ejemplo. El monocultivo usa la biomasa media de los cafetos del ejemplo con su propia densidad y los valores de suelo y hojarasca que escribas: son supuestos para comparar, no mediciones.</p>
</div>

**Fuentes.**

- Segura, M., Kanninen, M. y Suárez, D. (2006). <i>Agroforestry Systems</i> 68:143–150.
- Soto-Pinto, L., Anzueto, M., Mendoza, J., Jiménez-Ferrer, G. y de Jong, B. (2010). Carbon sequestration through agroforestry in indigenous communities of Chiapas, Mexico. <i>Agroforestry Systems</i> 78:39–51.

### 7.7 Validación

211 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b7.md`).

1. **El inventario perdía el diámetro de copa (error de la app, corregido).** La tabla de árboles del Bloque 3 no tenía el campo de diámetro de copa. Al pasar el cafetal al Bloque 7, la cobertura de sombra no se podía calcular. Lo atrapó la prueba de la interfaz antes de la comparación con R. Ahora el campo existe y el ejemplo lo trae.
2. **Comprobación de cordura del ejemplo.** El rendimiento simulado tiene su máximo en 26/(2·0.34) = 38.2 % de sombra. La app estima 38.8 % (intervalo de 34.3 a 43.4 %) y coincide con `lm` y con el método delta escrito aparte a 1e-9.
3. **Apertura del dosel.** En una imagen de prueba con cielo en un casquete de 40° y en una franja, la app y la referencia en R dan el mismo umbral de Otsu (131), la misma fracción de huecos y la misma apertura ponderada por ángulo sólido, también por anillos de 15°. Una prueba unitaria fija el caso analítico: un casquete de 30° vale 1 − cos 30° = 0.134 ponderado y 1/9 sin ponderar.

## Capítulo 8. Bloque 8 · Mapas

Lo espacial del inventario: dónde están las parcelas y los árboles, cuánto miden los polígonos, cómo se traza una cuadrícula de muestreo para levantar un inventario nuevo, cómo se lleva todo al GPS y cómo se interpola una variable entre parcelas. El mapa es propio de la app; el fondo en línea es opcional.

### 8.1 Datos que usa

**Tarjeta de la sección «Polígonos y áreas»** (ejemplos: mesofilo).

| Columna | Contenido | |
|---|---|---|
| `poligono` | Polígono | obligatoria |
| `lat` | Latitud | obligatoria, número |
| `lon` | Longitud | obligatoria, número |

**Tarjeta de la sección «Interpolación entre parcelas»** (ejemplos: rend, sombra).

| Columna | Contenido | |
|---|---|---|
| `lat` | Latitud | obligatoria, número |
| `lon` | Longitud | obligatoria, número |
| `valor` | Valor | obligatoria, número |
| `nombre` | Nombre | opcional |

### 8.2 El mapa

*Arrastra para moverte; rueda, botones o teclas + y − para acercarte. Las parcelas se dibujan con su radio real; los árboles aparecen al acercarte.*

**Cómo se usa.** Elige un ejemplo y pulsa «Cargar ejemplo», usa el inventario del Bloque 3 (si sus parcelas tienen latitud y longitud) o importa un archivo GPX, KML o GeoJSON. El mapa se mueve arrastrando y se acerca con la rueda, los botones + y − o el teclado (flechas, + y −); el botón ⤢ lo ajusta a los datos. Las parcelas se dibujan con su radio real y los árboles aparecen al acercarse (nivel 15 o más), ubicados por sus coordenadas x, y dentro de la parcela. Las casillas encienden y apagan cada capa. «Dibujar un polígono» agrega un polígono con un clic por vértice; doble clic o «Terminar el polígono» lo cierra y Esc lo cancela. La casilla del fondo de OpenStreetMap, apagada por omisión, pide las teselas a internet. Debajo queda el mapa estático en UTM, el que va al informe y al estudio de figuras.

**Método.**

<div class="method">
<p>Proyección de Mercator esférica a niveles de zoom enteros, la de los mapas web. Sin fondo, el mapa muestra una retícula de latitud y longitud y nada sale de tu equipo. Con el fondo encendido, el navegador pide las teselas del área visible a los servidores de OpenStreetMap, cuyos datos tienen licencia ODbL y piden la atribución que aparece en la esquina. Los árboles se ubican sumando sus coordenadas locales (x hacia el este, y hacia el norte, en metros) al centro de su parcela en UTM. El mapa estático de abajo, en UTM, es el que va al informe y al estudio de figuras.</p>
</div>

**Fuentes.**

- Snyder, J. P. (1987). <i>Map Projections — A Working Manual</i>. USGS Professional Paper 1395.
- OpenStreetMap Foundation. Política de uso de teselas y atribución: openstreetmap.org/copyright.

### 8.3 Polígonos y áreas

*Superficie y perímetro de cada polígono en la zona UTM de su centro y sobre la esfera.*

**Cómo se usa.** La tarjeta lleva los vértices de uno o varios polígonos en orden (polígono, latitud, longitud). Cada polígono cargado, importado o dibujado aparece en la tabla con su número de vértices, su área en UTM y sobre la esfera, su perímetro, su zona UTM y su centroide. «Quitar el último polígono» deshace el último.

**Método.**

<div class="method">
<p>Área en UTM: fórmula del agrimensor (Gauss) sobre las coordenadas planas de la zona del centro del polígono, la que se usa en catastro e inventario; incluye el factor de escala de la proyección (≤ 0.04 % dentro de la zona). Área sobre la esfera: suma de triángulos esféricos desde el primer vértice por el teorema de L'Huilier, con radio medio de 6 371 008.8 m; difiere de la del elipsoide unas décimas de punto por ciento según la latitud. Los lados de los polígonos se consideran rectos en UTM y arcos de círculo máximo en la esfera.</p>
</div>

**Fuentes.**

- Karney, C. F. F. (2011). Transverse Mercator with an accuracy of a few nanometers. <i>Journal of Geodesy</i> 85:475–485.
- Todhunter, I. (1886). <i>Spherical Trigonometry</i>, 5.ª ed. Macmillan (teorema de L'Huilier).

### 8.4 Cuadrícula de muestreo

*Los centros de parcela de un muestreo sistemático (o aleatorio) dentro de un polígono, listos para el GPS.*

**Cómo se usa.** Elige el polígono, el diseño (sistemático o aleatorio), la distancia entre puntos y la rotación de la malla, o el número de puntos al azar, y el radio de la parcela para conocer la intensidad de muestreo. «Arranque aleatorio de la malla» sortea el origen. La app da el número de puntos (y el esperado), la superficie, la intensidad y la tabla de puntos con sus coordenadas geográficas y UTM, que se descarga en GPX, KML o GeoJSON.

**Método.**

<div class="method">
<p>La malla se arma en UTM con la distancia y la rotación elegidas y se queda con los puntos dentro del polígono (prueba del rayo). El número esperado es la superficie entre la distancia al cuadrado. Con arranque aleatorio, el origen de la malla se sortea dentro de una celda: así cada punto del predio tiene la misma probabilidad de caer en la muestra. El diseño aleatorio sortea puntos uniformes dentro del polígono.</p>
</div>

**Fuentes.**

- Gregoire, T. G. y Valentine, H. T. (2008). <i>Sampling Strategies for Natural Resources and the Environment</i>. Chapman &amp; Hall/CRC.

### 8.5 Exportar

*Las parcelas, la cuadrícula y los polígonos para el GPS o para un programa de mapas.*

**Cómo se usa.** Descarga en GPX, KML, GeoJSON o CSV las parcelas cargadas, los puntos de la cuadrícula y los polígonos, para el receptor GPS, un globo virtual o un programa de mapas.

### 8.6 Interpolación entre parcelas

*Un mapa continuo de una variable medida en las parcelas: por distancia inversa o por kriging, con el variograma y la validación cruzada.*

**Cómo se usa.** Elige la variable (las del inventario: N, G, V y, si se calcularon en el Bloque 4, biomasa y carbono; o una tabla propia de latitud, longitud y valor en la tarjeta, con dos ejemplos del cafetal), el método (kriging ordinario, simple o IDW), el modelo del variograma, la potencia de IDW, la distancia máxima del variograma (vacía = un tercio de la diagonal), la resolución y si se recorta al primer polígono. «Interpolar» pinta la superficie sobre el mapa y en el mapa estático, y da el variograma con el modelo ajustado, sus parámetros y la validación cruzada de kriging e IDW. Si el variograma sale plano (efecto pepita puro), la app lo advierte: la variable no tiene estructura espacial a esa escala.

**Método.**

<div class="method">
<p>Todo se calcula en metros (UTM). <b>IDW:</b> ẑ = Σwᵢzᵢ/Σwᵢ con wᵢ = 1/dᵢ<sup>p</sup>. <b>Variograma experimental</b> (Matheron): γ(h) = Σ(zᵢ − zⱼ)²/(2N(h)) por intervalos de distancia; por omisión, hasta un tercio de la diagonal de los datos en 15 intervalos. <b>Modelos:</b> esférico, exponencial γ = c₀ + c₁(1 − e<sup>−h/a</sup>) y gaussiano γ = c₀ + c₁(1 − e<sup>−(h/a)²</sup>) (en los dos últimos el alcance práctico es 3a y √3·a), ajustados por mínimos cuadrados ponderados con pesos Nⱼ/hⱼ². <b>Kriging ordinario:</b> media desconocida, resuelve [Γ 1; 1ᵀ 0][λ; μ] = [γ₀; 1]; varianza σ² = Σλᵢγᵢ₀ + μ. <b>Kriging simple:</b> media conocida (la de los datos). La validación cruzada deja fuera cada parcela, la predice con las demás y resume el error medio y su raíz cuadrática media.</p>
</div>

**Fuentes.**

- Matheron, G. (1963). Principles of geostatistics. <i>Economic Geology</i> 58:1246–1266.
- Cressie, N. (1985). Fitting variogram models by weighted least squares. <i>Mathematical Geology</i> 17:563–586.
- Isaaks, E. H. y Srivastava, R. M. (1989). <i>An Introduction to Applied Geostatistics</i>. Oxford University Press.
- Shepard, D. (1968). A two-dimensional interpolation function for irregularly-spaced data. <i>Proc. ACM National Conference</i>, pp. 517–524.

### 8.7 Validación

269 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b8.md`).

1. **La inversa de UTM deja 0.2 mm.** La proyección directa coincide con sf a menos de 1 µm. La inversa (de metros a grados) usa la serie de Krüger de tercer orden y regresa la latitud con 1.65e-9° de diferencia, unos 0.2 mm sobre el terreno. La tolerancia de 1e-8° (≈1 mm) lo cubre; para inventario forestal es despreciable.
2. **El ajuste del variograma de gstat no converge con estos datos.** `fit.variogram` se detiene a las 200 iteraciones con el área basal de las 24 parcelas del mesófilo. Por eso se compara el criterio que ambos minimizan: la suma de cuadrados ponderada (pesos Nⱼ/hⱼ²) de la app es 1.12 frente a 1.95 de gstat con el modelo esférico, y 1.13 frente a 1.85 con el exponencial. El kriging ordinario y el simple se comparan dándole a la app los parámetros de gstat, y coinciden a 1e-9 en predicción y varianza.
3. **El área sobre la esfera excede a la de UTM en 0.27 %.** Las dos coinciden con sf (s2 sobre la esfera, planar en EPSG:32614). La diferencia entre ellas viene de usar una esfera de radio medio en lugar del elipsoide. La app muestra las dos y recomienda la de UTM para el inventario.
4. **Variograma plano en el ejemplo del mesófilo (aviso nuevo de la app).** La prueba de la interfaz mostró que el área basal de las parcelas del mesófilo no tiene estructura espacial: el ajuste lleva el alcance al límite inferior (3 m) y el kriging predice la media en todo el predio. Es correcto, porque las parcelas se simularon independientes dentro de cada estrato, pero el mapa resultaba uniforme sin explicación. Ahora la app avisa de efecto pepita puro cuando el alcance queda por debajo del primer intervalo o la meseta parcial es menor que 5 % de la total. El ejemplo de interpolación usa el rendimiento del cafetal, que sí varía con la distancia (pepita 1 % de la meseta, alcance ≈ 2.5 km).

## Capítulo 9. Bloque 9 · Utilidades forestales

Las cuentas de todos los días en el monte y en el aserradero. Cada sección trae un ejemplo con un botón, y la del rendimiento de aserrío toma sus números de las dos primeras.

### 9.1 Cubicación de trozas

*Volumen de cada troza en metros cúbicos por cuatro fórmulas y en pies tabla por tres reglas.*

**Cómo se usa.** Escribe en la tabla cada troza con su largo, los diámetros con corteza de la punta delgada, de la gruesa y, si se tiene, de la mitad, y el grosor de corteza de un lado; o carga las 12 trozas de pino del ejemplo. «Volumen sin corteza» descuenta la corteza. «Cubicar» da, por troza y en total, el volumen por Smalian, Huber, Newton y cono truncado, y los pies tabla por las reglas de Doyle, Scribner e Internacional ¼″, con una figura que compara las tres reglas.

**Método.**

<div class="method">
<p>Con g = πd²/40 000 (m², d en cm) y L en m: <b>Smalian</b> V = L(g₁ + g₂)/2; <b>Huber</b> V = L·g<sub>m</sub>; <b>Newton</b> V = L(g₁ + 4g<sub>m</sub> + g₂)/6, exacta para paraboloides, conos y neiloides; <b>cono truncado</b> V = πL(d₁² + d₁d₂ + d₂²)/120 000. Sin corteza, a cada diámetro se le resta dos veces el grosor de corteza. Las <b>reglas en pies tabla</b> estiman la madera aserrada que rinde la troza, no su volumen: usan el diámetro de la punta delgada sin corteza en pulgadas (D) y la longitud en pies (L). <b>Doyle:</b> (D − 4)²L/16, castiga mucho a las trozas delgadas. <b>Scribner:</b> el diagrama de Scribner por la fórmula de Bruce, (0.79D² − 2D − 4)L/16. <b>Internacional ¼″:</b> secciones de 4 pies, cada una con ½ pulgada más de diámetro que la anterior, 0.22D² − 0.71D pies tabla por sección y el factor 0.905 de la sierra de ¼ de pulgada; la fracción final se toma en proporción a su longitud.</p>
</div>

**Fuentes.**

- Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, 4.ª ed. Wiley.
- Avery, T. E. y Burkhart, H. E. (2002). <i>Forest Measurements</i>, 5.ª ed. McGraw-Hill.
- Bruce, D. (1925). A formula for the Scribner rule. <i>Journal of Forestry</i> 23:432–433.
- Clark, J. F. (1906). The measurement of saw logs. <i>Forestry Quarterly</i> 4:79–93.

### 9.2 Madera aserrada

*Pies tabla y metros cúbicos de una lista de piezas.*

**Cómo se usa.** Elige las unidades (pulgadas y pies, o centímetros y metros) y escribe cada tipo de pieza con su grosor, ancho, largo y número de piezas; o carga lo aserrado de las 12 trozas. «Contar» da los pies tabla y los metros cúbicos de cada tipo y del total.

**Método.**

<div class="method">
<p>Un pie tabla es una pieza de 1 pulgada × 12 pulgadas × 1 pie: 144 pulgadas cúbicas = 2.359 737 216 dm³, de modo que 1 m³ = 423.776 pies tabla. Pies tabla de una pieza = grosor (pulg) × ancho (pulg) × largo (pies) / 12, con las medidas nominales con que se comercia. En centímetros y metros, m³ = grosor × ancho × largo / 10 000.</p>
</div>

**Fuentes.**

- NIST (2008). <i>Guide for the Use of the International System of Units (SI)</i>. Special Publication 811, apéndice B.

### 9.3 Rendimiento de aserrío

*Cuánta madera aserrada sale de la madera en rollo.*

**Cómo se usa.** Los tres campos se llenan con los totales de arriba (madera en rollo por Smalian, madera aserrada y pies tabla de la regla Internacional ¼″), y se pueden cambiar. La app da el coeficiente de aserrío, el desperdicio, los pies tabla por metro cúbico en rollo y el sobrerrendimiento frente a la regla.

**Método.**

<div class="method">
<p><b>Coeficiente de aserrío</b> = m³ aserrados / m³ en rollo; el resto es aserrín, costeras, recortes y corteza. <b>Pies tabla por m³ en rollo</b> = el mismo cociente expresado en pies tabla. <b>Sobrerrendimiento</b> (<i>overrun</i>) = pies tabla aserrados / pies tabla de la regla − 1: positivo si la regla subestima lo que el aserradero obtiene. Depende del diámetro, la sierra, el patrón de corte y las medidas de las piezas.</p>
</div>

**Fuentes.**

- Steele, P. H. (1984). <i>Factors Determining Lumber Recovery in Sawmilling</i>. USDA Forest Service, Gen. Tech. Rep. FPL-39.

### 9.4 Factor de forma

*La fracción del cilindro (área basal × altura) que ocupa el fuste.*

**Cómo se usa.** Escribe el DAP, la altura y el volumen para obtener el factor de forma, o el factor para obtener el volumen. La tabla compara con los sólidos de referencia.

**Método.**

<div class="method">
<p>Factor de forma artificial (referido a la altura del pecho): f = V/(g·h), con g el área basal a 1.30 m. Los sólidos de referencia, medidos en su base, tienen f = 1 (cilindro), 1/2 (paraboloide), 1/3 (cono) y 1/4 (neiloide). En coníferas suele estar entre 0.40 y 0.55; con el Bloque 2 puedes ajustar ecuaciones de volumen, que sustituyen al factor de forma cuando hay datos.</p>
</div>

**Fuentes.**

- Prodan, M., Peters, R., Cox, F. y Real, P. (1997). <i>Mensura Forestal</i>. IICA y GTZ, San José.

### 9.5 Conversión de unidades

*Del sistema inglés al métrico y al revés, con las definiciones exactas.*

**Cómo se usa.** Elige la magnitud (longitud, superficie, volumen, masa, área basal, volumen o biomasa por superficie, carbono, densidad, árboles por superficie), escribe el valor y su unidad: la tabla da su equivalencia en todas las demás. Abajo, la leña apilada pasa a madera sólida con el factor de apilado.

**Método.**

<div class="method">
<p>Definiciones exactas: 1 pulgada = 2.54 cm; 1 pie = 0.3048 m; 1 acre = 4 046.856 422 4 m²; 1 libra = 0.453 592 37 kg; 1 pie tabla = 144 pulg³; 1 cuerda = 128 pies³ de madera apilada. Las magnitudes por superficie se convierten con el factor de la unidad y el de la superficie (por ejemplo, 1 pie²/acre = 0.2296 m²/ha). El carbono pasa a CO₂ equivalente por 44/12. El factor de apilado (madera sólida por metro cúbico estéreo) depende del diámetro y de lo recto de las piezas; 0.6 a 0.7 es lo común en leña.</p>
</div>

**Fuentes.**

- NIST (2008). <i>Guide for the Use of the International System of Units (SI)</i>. Special Publication 811.

### 9.6 Costo y rentabilidad de una plantación

*Flujo de costos e ingresos por hectárea, descontado a una tasa.*

**Cómo se usa.** Escribe la tasa de descuento, el costo anual fijo (protección, administración) y, si se quiere, el turno; en la tabla, cada costo o ingreso por hectárea con su año (varias filas pueden compartir año). O carga el ejemplo del pino a 25 años. «Evaluar» da el valor presente neto, la tasa interna de retorno, la relación beneficio/costo, el valor esperado del suelo de Faustmann, la anualidad equivalente, el costo de establecimiento y el año de recuperación, con el flujo por año, el VPN según la tasa y la tabla del flujo descontado.

**Método.**

<div class="method">
<p>Con la tasa r y el flujo neto N<sub>t</sub> = ingresos − costos del año t: <b>valor presente neto</b> VPN = Σ N<sub>t</sub>/(1 + r)<sup>t</sup>; <b>relación beneficio/costo</b> = valor presente de los ingresos / el de los costos; <b>tasa interna de retorno</b>: la r que anula el VPN (el primer cambio de signo entre −90 % y 200 %, afinado por bisección); <b>valor esperado del suelo</b> de Faustmann, VES = VPN·(1 + r)<sup>T</sup>/((1 + r)<sup>T</sup> − 1): lo que vale la tierra si se repite el mismo turno para siempre, la medida correcta para comparar turnos de distinta duración; <b>anualidad equivalente</b> = VPN·r/(1 − (1 + r)<sup>−T</sup>); <b>recuperación</b>: el primer año en que el flujo descontado acumulado deja de ser negativo. Todo se calcula en valores reales: usa una tasa sin inflación y precios constantes.</p>
</div>

**Fuentes.**

- Faustmann, M. (1849). Berechnung des Werthes, welchen Waldboden sowie noch nicht haubare Holzbestände für die Waldwirthschaft besitzen. <i>Allgemeine Forst- und Jagd-Zeitung</i> 25:441–455.
- Klemperer, W. D. (1996). <i>Forest Resource Economics and Finance</i>. McGraw-Hill.
- Bettinger, P., Boston, K., Siry, J. P. y Grebner, D. L. (2017). <i>Forest Management and Planning</i>, 2.ª ed. Academic Press.

### 9.7 Validación

252 comparaciones contra R, sin desacuerdos fuera de tolerancia (detalle en `tests/resultados/b9.md`).

1. **Dos acres distintos.** udunits2, la biblioteca de unidades que usa R, define el acre y la cadena con el pie del levantamiento de EE. UU. (1 200/3 937 m). La app usa el pie internacional (0.3048 m), el único vigente desde que NIST retiró el de levantamiento en 2023. La diferencia es de 2 partes por millón en longitud y de 4 en superficie, y aparece en todas las conversiones por acre. Se compara a 5e-6 y se deja dicho.
2. **El pie tabla de udunits2 está redondeado** a 2.359737 dm³. El exacto es 144 pulg³ = 2.359 737 216 dm³, con el que 1 m³ = 423.776 pies tabla. Se compara a 5e-7.
3. **La regla Internacional ¼″ reproduce sus tablas.** Con secciones de 4 pies, ½ pulgada de ahusamiento por sección y el factor 0.905, la app cae a menos de 2.5 pies tabla de los valores publicados para trozas de 16 pies de 6 a 24 pulgadas, que vienen redondeados a 5.
4. **La TIR de FinCal es aproximada.** `FinCal::irr` usa `uniroot` con su tolerancia por omisión (≈1e-4). Contra `uniroot` a 1e-14 la TIR de la app coincide a 1.6e-14 (8.500 %). El VPN, el valor esperado del suelo de Faustmann y la anualidad equivalente coinciden a 1e-11.

## Capítulo 10. Bloque 10 · Informe y proyecto

Lo que mostraron los bloques, reunido en un informe que se abre en cualquier navegador y se imprime a PDF; todas las tablas en un libro de Excel; y el proyecto, para volver a abrir el trabajo tal como quedó.

### 10.1 Informe

*Un archivo HTML que lleva todo dentro: portada, resumen, figuras, tablas e interpretaciones.*

**Cómo se usa.** Escribe el título, el predio o proyecto, el responsable, la fecha y, si se quiere, una presentación; marca los bloques que entran y si van los métodos con sus fuentes y los avisos. «Vista previa» muestra el informe dentro de la página; «Descargar el informe (HTML)» lo guarda como un solo archivo que lleva todo dentro (las figuras como SVG con sus estilos y en los colores del tema claro), y «Abrir para imprimir o guardar como PDF» lo abre en una pestaña con su botón de impresión. Entra lo que cada bloque muestra en ese momento, con lo que se haya cambiado en el editor ✎; un bloque sin resultados no aparece. El informe tiene portada, contenido, un resumen con los números principales de cada bloque, una sección por bloque con sus datos, figuras, tablas, interpretaciones y métodos, la cita y una nota de privacidad.

### 10.2 Todas las tablas

*Cada tabla de resultados de los bloques 2 a 9, con sus números completos.*

**Cómo se usa.** Descarga todas las tablas de resultados de los bloques 2 a 9 en un libro XLSX, una hoja por tabla con los números completos, o como archivos CSV dentro de un ZIP. Las figuras se exportan una por una desde su tarjeta con el estudio de figuras (SVG, PNG a 300 ppp o más, JPG o PDF vectorial).

### 10.3 Proyecto

*Guarda el trabajo en un archivo y ábrelo después, aquí o en otro equipo.*

**Cómo se usa.** «Guardar el proyecto (JSON)» descarga el registro de lo hecho; «Abrir un proyecto…» lo vuelve a abrir: la app se recarga limpia y repite los pasos, con una barra que cuenta el avance, y al final avisa si algún paso no se pudo repetir. «Empezar de nuevo» borra todo lo que hay en la app (no toca los archivos guardados).

**Método.**

<div class="method">
<p>El proyecto no guarda los resultados sino la manera de llegar a ellos: los datos que cargaste en cada tarjeta de datos (si fueron de un ejemplo, solo cuál), los campos que cambiaste, las tablas editables, los botones que oprimiste y los ejemplos que abriste, en orden. Al abrirlo, la app se recarga limpia y repite esos pasos, así que cada bloque calcula otra vez lo mismo que mostraba. No guarda la fotografía hemisférica del Bloque 7 ni lo que hayas hecho en el editor de figuras, y la cuadrícula aleatoria del Bloque 8 sale con otro sorteo. El archivo es texto (JSON): puedes leerlo y lleva al final un resumen de los resultados.</p>
</div>

### 10.4 Cómo citar

*Si ForestPro te sirvió en un trabajo, cítalo así.*

**Cómo se usa.** La cita en formato APA y en BibTeX, con botones para copiarlas y para descargar el archivo `.bib`.

## Apéndice A. Referencias

Todas las fuentes citadas en los recuadros «Método y fuentes» de la app, en orden alfabético.

- Assmann, E. (1970). <i>The Principles of Forest Yield Study</i>. Pergamon.
- Avery, T. E. y Burkhart, H. E. (2002). <i>Forest Measurements</i>, 5.ª ed. McGraw-Hill.
- Baddeley, A., Rubak, E. y Turner, R. (2015). <i>Spatial Point Patterns: Methodology and Applications with R</i>. CRC Press.
- Bailey, R. L. y Clutter, J. L. (1974). Base-age invariant polymorphic site curves. <i>Forest Science</i> 20:155–159.
- Bailey, R. L. y Dell, T. R. (1973). Quantifying diameter distributions with the Weibull function. <i>Forest Science</i> 19:97–104.
- Bettinger, P., Boston, K., Siry, J. P. y Grebner, D. L. (2017). <i>Forest Management and Planning</i>, 2.ª ed. Academic Press.
- Bitterlich, W. (1948). Die Winkelzählprobe. <i>Allgemeine Forst- und Holzwirtschaftliche Zeitung</i> 59:4–5.
- Brown, S. (1997). <i>Estimating Biomass and Biomass Change of Tropical Forests: a Primer</i>. FAO Forestry Paper 134, ec. 3.2.1.
- Bruce, D. (1925). A formula for the Scribner rule. <i>Journal of Forestry</i> 23:432–433.
- Cairns, M. A., Brown, S., Helmer, E. H. y Baumgardner, G. A. (1997). Root biomass allocation in the world's upland forests. <i>Oecologia</i> 111:1–11.
- Campos, J. C. C. y Leite, H. G. (2017). <i>Mensuração Florestal</i>, 5.ª ed. UFV.
- Chao, A. (1987). Estimating the population size for capture-recapture data with unequal catchability. <i>Biometrics</i> 43:783–791.
- Chao, A. et al. (2014). Rarefaction and extrapolation with Hill numbers. <i>Ecological Monographs</i> 84:45–67.
- Chao, A. y Jost, L. (2012). Coverage-based rarefaction and extrapolation. <i>Ecology</i> 93:2533–2547.
- Chao, A. y Lee, S.-M. (1992). Estimating the number of classes via sample coverage. <i>JASA</i> 87:210–217.
- Chao, A., Wang, Y. T. y Jost, L. (2013). Entropy and the species accumulation curve. <i>Methods Ecol. Evol.</i> 4:1091–1100.
- Chave, J. et al. (2004). Error propagation and scaling for tropical forest biomass estimates. <i>Phil. Trans. R. Soc. B</i> 359:409–420.
- Chave, J. et al. (2005). Tree allometry and improved estimation of carbon stocks and balance in tropical forests. <i>Oecologia</i> 145:87–99. doi:10.1007/s00442-005-0100-x
- Chave, J. et al. (2009). Towards a worldwide wood economics spectrum. <i>Ecology Letters</i> 12:351–366.
- Chave, J. et al. (2014). Improved allometric models to estimate the aboveground biomass of tropical trees. <i>Global Change Biology</i> 20:3177–3190. doi:10.1111/gcb.12629
- Cieszewski, C. J. y Bailey, R. L. (2000). Generalized algebraic difference approach. <i>Forest Science</i> 46:116–126.
- Clark, J. F. (1906). The measurement of saw logs. <i>Forestry Quarterly</i> 4:79–93.
- Clark, P. J. y Evans, F. C. (1954). Distance to nearest neighbor as a measure of spatial relationships in populations. <i>Ecology</i> 35:445–453.
- Clutter, J. L. (1963). Compatible growth and yield models for loblolly pine. <i>Forest Science</i> 9:354–371.
- Clutter, J. L., Fortson, J. C., Pienaar, L. V., Brister, G. H. y Bailey, R. L. (1983). <i>Timber Management: a Quantitative Approach</i>. Wiley.
- Cochran, W. G. (1977). <i>Sampling Techniques</i>, 3.ª ed. Wiley.
- Colwell, R. K., Mao, C. X. y Chang, J. (2004). Interpolating, extrapolating, and comparing incidence-based species accumulation curves. <i>Ecology</i> 85:2717–2727.
- Cressie, N. (1985). Fitting variogram models by weighted least squares. <i>Mathematical Geology</i> 17:563–586.
- Crookston, N. L. y Stage, A. R. (1999). <i>Percent Canopy Cover and Stand Structure Statistics from the Forest Vegetation Simulator</i>. USDA Forest Service, GTR RMRS-24.
- Curtis, J. T. y McIntosh, R. P. (1951). An upland forest continuum in the prairie-forest border region of Wisconsin. <i>Ecology</i> 32:476–496.
- Davis, L. S., Johnson, K. N., Bettinger, P. S. y Howard, T. E. (2001). <i>Forest Management</i>, 4.ª ed. McGraw-Hill.
- de Leeuw, J. y Mair, P. (2009). Multidimensional scaling using majorization: SMACOF in R. <i>J. Stat. Softw.</i> 31(3).
- Díaz-Franco, R. et al. (2007). Determinación de ecuaciones alométricas para estimar biomasa y carbono en <i>Pinus patula</i>. <i>Madera y Bosques</i> 13(1):25–34. doi:10.21829/myb.2007.1311233
- Donnelly, K. P. (1978). Simulations to determine the variance and edge effect of total nearest neighbour distance. En <i>Simulation Methods in Archaeology</i>, pp. 91–95. Cambridge University Press.
- Evans, J. y Turnbull, J. W. (2004). <i>Plantation Forestry in the Tropics</i>, 3.ª ed. Oxford University Press.
- Faustmann, M. (1849). Berechnung des Werthes, welchen Waldboden sowie noch nicht haubare Holzbestände für die Waldwirthschaft besitzen. <i>Allgemeine Forst- und Jagd-Zeitung</i> 25:441–455.
- Figueroa-Navarro, C. M. et al. (2010). Estimación de la biomasa en un bosque bajo manejo de <i>Pinus patula</i>. <i>Rev. Mex. Cienc. For.</i> 1(1):105–112.
- Fisher, R. A., Corbet, A. S. y Williams, C. B. (1943). The relation between the number of species and the number of individuals. <i>J. Anim. Ecol.</i> 12:42–58.
- Frazer, G. W., Canham, C. D. y Lertzman, K. P. (1999). <i>Gap Light Analyzer (GLA) 2.0: users manual</i>. Simon Fraser University.
- Furnival, G. M. (1961). An index for comparing equations used in constructing volume tables. <i>Forest Science</i> 7:337–341.
- Gompertz, B. (1825). On the nature of the function expressive of the law of human mortality. <i>Phil. Trans. R. Soc.</i> 115:513–583.
- Gregoire, T. G. y Valentine, H. T. (2008). <i>Sampling Strategies for Natural Resources and the Environment</i>. Chapman &amp; Hall/CRC.
- Grosenbaugh, L. R. (1952). Plotless timber estimates — new, fast, easy. <i>Journal of Forestry</i> 50:32–37.
- Hegyi, F. (1974). A simulation model for managing jack-pine stands. En <i>Growth Models for Tree and Stand Simulation</i>, pp. 74–90. Royal College of Forestry.
- Hill, M. O. (1973). Diversity and evenness: a unifying notation and its consequences. <i>Ecology</i> 54:427–432.
- Holdridge, L. R., Grenke, W. C., Hatheway, W. H., Liang, T. y Tosi, J. A. (1971). <i>Forest Environments in Tropical Life Zones: a Pilot Study</i>. Pergamon.
- Hurlbert, S. H. (1971). The nonconcept of species diversity. <i>Ecology</i> 52:577–586.
- Husch, B., Beers, T. W. y Kershaw, J. A. (2003). <i>Forest Mensuration</i>, 4.ª ed. Wiley.
- IPCC (2006). <i>2006 IPCC Guidelines for National Greenhouse Gas Inventories</i>, vol. 4, cap. 4 (cuadros 4.3 y 4.4).
- Isaaks, E. H. y Srivastava, R. M. (1989). <i>An Introduction to Applied Geostatistics</i>. Oxford University Press.
- Jenkins, J. C. et al. (2003). National-scale biomass estimators for United States tree species. <i>Forest Science</i> 49:12–35. doi:10.1093/forestscience/49.1.12
- Jonckheere, I. et al. (2004). Review of methods for in situ leaf area index determination. Part I. <i>Agric. For. Meteorol.</i> 121:19–35.
- Karney, C. F. F. (2011). Transverse Mercator with an accuracy of a few nanometers. <i>Journal of Geodesy</i> 85:475–485.
- Klemperer, W. D. (1996). <i>Forest Resource Economics and Finance</i>. McGraw-Hill.
- Kozak, A., Munro, D. D. y Smith, J. H. G. (1969). Taper functions and their application in forest inventory. <i>For. Chron.</i> 45:278–283.
- Kruskal, J. B. (1964). Nonmetric multidimensional scaling: a numerical method. <i>Psychometrika</i> 29:115–129.
- Legendre, P. y Legendre, L. (2012). <i>Numerical Ecology</i>, 3.ª ed. Elsevier.
- Magurran, A. E. (2004). <i>Measuring Biological Diversity</i>. Blackwell.
- Marquardt, D. W. (1963). An algorithm for least-squares estimation of nonlinear parameters. <i>J. SIAM</i> 11:431–441.
- Matheron, G. (1963). Principles of geostatistics. <i>Economic Geology</i> 58:1246–1266.
- Max, T. A. y Burkhart, H. E. (1976). Segmented polynomial regression applied to taper equations. <i>Forest Science</i> 22:283–289.
- Mehtätalo, L., de-Miguel, S. y Gregoire, T. G. (2015). Modeling height-diameter curves for prediction. <i>Can. J. For. Res.</i> 45:826–837.
- Meyer, H. A. (1941). A correction for a systematic error occurring in the application of the logarithmic volume equation. <i>Pennsylvania State Forest School Res. Paper</i> 7.
- Moguel, P. y Toledo, V. M. (1999). Biodiversity conservation in traditional coffee systems of Mexico. <i>Conservation Biology</i> 13:11–21.
- Nair, P. K. R. (1993). <i>An Introduction to Agroforestry</i>. Kluwer.
- Näslund, M. (1937). Skogsförsöksanstaltens gallringsförsök i tallskog. <i>Medd. Statens Skogsförsöksanstalt</i> 29.
- NIST (2008). <i>Guide for the Use of the International System of Units (SI)</i>. Special Publication 811, apéndice B.
- Ohser, J. (1983). On estimators for the reduced second moment measure of point processes. <i>Math. Operationsforsch. Statist.</i> 14:63–71.
- OpenStreetMap Foundation. Política de uso de teselas y atribución: openstreetmap.org/copyright.
- Otsu, N. (1979). A threshold selection method from gray-level histograms. <i>IEEE Trans. Syst. Man Cybern.</i> 9:62–66.
- Pearson, T. R. H., Brown, S. L. y Birdsey, R. A. (2007). <i>Measurement Guidelines for the Sequestration of Forest Carbon</i>. USDA Forest Service, GTR NRS-18.
- Pretzsch, H. (1996). Strukturvielfalt als Ergebnis waldbaulichen Handelns. <i>DVFFA, Sektion Ertragskunde</i>, pp. 134–154.
- Pretzsch, H. (2009). <i>Forest Dynamics, Growth and Yield</i>. Springer.
- Prodan, M., Peters, R., Cox, F. y Real, P. (1997). <i>Mensura Forestal</i>. IICA y GTZ, San José.
- Reineke, L. H. (1933). Perfecting a stand-density index for even-aged forests. <i>J. Agric. Res.</i> 46:627–638.
- Réjou-Méchain, M. et al. (2017). BIOMASS: an R package for estimating above-ground biomass and its uncertainty in tropical forests. <i>Methods in Ecology and Evolution</i> 8:1163–1167.
- Richards, F. J. (1959). A flexible growth function for empirical use. <i>J. Exp. Bot.</i> 10:290–300.
- Ripley, B. D. (1977). Modelling spatial patterns. <i>J. R. Stat. Soc. B</i> 39:172–212.
- Satterthwaite, F. E. (1946). An approximate distribution of estimates of variance components. <i>Biometrics Bulletin</i> 2:110–114.
- Schumacher, F. X. (1939). A new growth curve and its application to timber yield studies. <i>Journal of Forestry</i> 37:819–820.
- Schumacher, F. X. y Hall, F. S. (1933). Logarithmic expression of timber-tree volume. <i>J. Agric. Res.</i> 47:719–734.
- Segura, M., Kanninen, M. y Suárez, D. (2006). Allometric models for estimating aboveground biomass of shade trees and coffee bushes grown together. <i>Agroforestry Systems</i> 68:143–150. doi:10.1007/s10457-006-9005-x
- Shepard, D. (1968). A two-dimensional interpolation function for irregularly-spaced data. <i>Proc. ACM National Conference</i>, pp. 517–524.
- Shiver, B. D. y Borders, B. E. (1996). <i>Sampling Techniques for Forest Resource Inventory</i>. Wiley.
- Smalian, H. L. (1837). <i>Beitrag zur Holzmeßkunst</i>. Stralsund.
- Snyder, J. P. (1987). <i>Map Projections — A Working Manual</i>. USGS Professional Paper 1395.
- Sokal, R. R. y Rohlf, F. J. (1962). The comparison of dendrograms by objective methods. <i>Taxon</i> 11:33–40.
- Soto-Pinto, L., Anzueto, M., Mendoza, J., Jiménez-Ferrer, G. y de Jong, B. (2010). Carbon sequestration through agroforestry in indigenous communities of Chiapas, Mexico. <i>Agroforestry Systems</i> 78:39–51.
- Soto-Pinto, L., Perfecto, I., Castillo-Hernández, J. y Caballero-Nieto, J. (2000). Shade effect on coffee production at the northern Tzeltal zone of the state of Chiapas, Mexico. <i>Agric. Ecosyst. Environ.</i> 80:61–69.
- Souza, D. R. et al. (2003). Análise estrutural em floresta ombrófila densa de terra firme. <i>Revista Árvore</i> 27:75–83.
- Spurr, S. H. (1952). <i>Forest Inventory</i>. Ronald Press.
- Steele, P. H. (1984). <i>Factors Determining Lumber Recovery in Sawmilling</i>. USDA Forest Service, Gen. Tech. Rep. FPL-39.
- Theil, H. (1953). Repeated least squares applied to complete equation systems. Central Planning Bureau, La Haya.
- Todhunter, I. (1886). <i>Spherical Trigonometry</i>, 5.ª ed. Macmillan (teorema de L'Huilier).
- van Noordwijk, M. et al. (2002). Carbon stock assessment for a forest-to-coffee conversion landscape in Sumber-Jaya. <i>Science in China C</i> 45 (supl.):75–86. La fuente no indica a qué altura se mide D.
- Van Wagner, C. E. (1968). The line intersect method in forest fuel sampling. <i>Forest Science</i> 14:20–26.
- Weisberg, S. (2014). <i>Applied Linear Regression</i>, 4.ª ed., sec. 7.6 (método delta). Wiley.
- Welch, B. L. (1947). The generalization of «Student's» problem when several different population variances are involved. <i>Biometrika</i> 34:28–35.
- Wilson, F. G. (1946). Numerical expression of stocking in terms of height. <i>Journal of Forestry</i> 44:758–761.
- Yang, R. C., Kozak, A. y Smith, J. H. G. (1978). The potential of Weibull-type functions as flexible growth curves. <i>Can. J. For. Res.</i> 8:424–431.
- Zanne, A. E. et al. (2009). Data from: Towards a worldwide wood economics spectrum. Dryad, doi:10.5061/dryad.234.
- Zeide, B. (1993). Analysis of growth equations. <i>Forest Science</i> 39:594–616.

## Apéndice B. Archivos del programa

| Ruta | Contenido |
|---|---|
| `index.html` | La app (la arma `node tools/build_index.js` con las partes de `tools/parts/`) |
| `js/eng-*.js` | Los motores de cálculo de cada bloque, sin interfaz; corren en el navegador y en node |
| `js/blockN.js` | La interfaz de cada bloque |
| `js/num.js`, `js/nls.js` | Rutinas numéricas y ajuste no lineal |
| `js/dataio.js` | Lectura de CSV, XLSX y ODS; escritura de CSV, XLSX y ZIP |
| `js/plot.js`, `js/art.js`, `js/mapview.js` | Figuras SVG, logotipo e ilustraciones, mapa |
| `js/ui.js`, `js/core.js`, `js/i18n.js` | Componentes de la interfaz, estado, idioma y tema |
| `js/labg-*.js`, `css/labg-*.css` | Módulos comunes de la suite LABG (barra, navegador, estudio de figuras, editor, esperas) |
| `data/` | Los datos de ejemplo, sus generadores en R y su descripción (`LEEME.md`) |
| `tests/` | Pruebas unitarias (`run.html`, `run_node.js`) y validación contra R (`r/`, `compare.js`, `resultados/`) |
| `docs/` | Este manual en Markdown y en HTML |

## Apéndice C. Cómo citar ForestPro

> Barrera-Guzmán, L. Á. (2026). *ForestPro: a browser-based platform for forest inventory, mensuration, biomass,
> carbon and agroforestry* (Version 1.0.0) [Computer software]. https://github.com/luisangelbg/ForestPro

```
@software{BarreraGuzman2026ForestPro,
  author  = {Barrera-Guzmán, Luis Ángel},
  title   = {{ForestPro}: a browser-based platform for forest inventory, mensuration, biomass, carbon and agroforestry},
  year    = {2026},
  version = {1.0.0},
  license = {GPL-3.0-or-later},
  url     = {https://github.com/luisangelbg/ForestPro}
}
```
