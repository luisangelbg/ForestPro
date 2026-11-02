# Manual de usuario de ForestPro

Manual en español, en HTML, pensado para imprimirse a PDF. Sigue la misma forma que los de
las demás aplicaciones LABG: hoja tamaño carta sin márgenes añadidos, Cormorant para los
títulos, Crimson Pro para el texto y Jost para los rótulos, y una portada **blanca** (regla de la
suite) que es **una sola ilustración vectorial original**, dibujada por código a partir de los datos
de ejemplo y los motores de la propia app. La identidad es la de la app: verde bosque (`#1b5e20`)
y corteza (`#5d4037`), con el oro y negro de la suite.

Sustituye al manual anterior, de otro formato, que sigue en `docs/manual.md` (la fuente) y
`docs/manual.html`. Ese texto es **material de contenido** para los capítulos —métodos, fórmulas,
fuentes, formatos de datos, validación—, no un modelo de forma.

## Carpetas

```
manual/
  LEEME.md              este archivo
  GUIA-CAPITULOS.md     el encargo para quien escriba los capítulos 1 a 10 y los apéndices
  manual.css            hoja de estilo de la portada
  interior.css          hoja de estilo de las páginas interiores (colores por bloque, recuadros, tablas, figuras)
  paginar.js            reparte cada parte en hojas carta, con encabezado, número y pestaña
  es/                   las partes en español (y manual-completo.html, generado)
  en/                   la edición inglesa, cuando se haga (misma estructura; ya tiene su portada)
  img/                  las capturas en español, una por receta; img/en/ las inglesas
  herramientas/         captura, revisión, anchos, portada, referencias y unión
    recetas/            una receta por captura; _comun.js se antepone a todas
```

## Cómo está partido

Un archivo por parte, en `es/`, y **cada capítulo explica el bloque del mismo número**; la
introducción no lleva número (sus secciones son I.1, I.2…). Los títulos de los capítulos 2 a 10 son
los que la app pone sobre cada bloque; las secciones (h2) son sus tarjetas, con su rótulo exacto.

| Archivo | Contenido |
|---|---|
| `00a-portada.html` | Portada (la escribe `herramientas/genera-portada.js`; no se edita a mano) |
| `00b-introduccion.html` | Créditos, índice general, cómo leer el manual e introducción (I.1 a I.10) |
| `01-bloque1.html` | Capítulo 1 · Inicio: la portada y sus botones, Cómo funciona (seis pasos), Los nueve módulos, Datos de ejemplo, Lo que hace y lo que no, Cómo citar con las pruebas y la validación |
| `02-bloque2.html` | Capítulo 2 · Dasometría individual: árboles en pie (diámetro, área basal y volumen); cubicación de trozas y árboles por secciones; ecuaciones de volumen; ahusamiento; relación altura–diámetro |
| `03-bloque3.html` | Capítulo 3 · Inventario forestal y muestreo: el inventario (árboles y parcelas); expansión a la hectárea; estimación y error de muestreo; tamaño de muestra; relascopía; estructura del rodal |
| `04-bloque4.html` | Capítulo 4 · Biomasa y carbono: datos y ecuaciones; densidad de la madera; biomasa y carbono del inventario; incertidumbre por Monte Carlo; necromasa, hojarasca y suelo; reservorios y cambio entre inventarios |
| `05-bloque5.html` | Capítulo 5 · Crecimiento y rendimiento: incrementos y turno biológico; modelos de crecimiento; índice de sitio; proyección del rodal y tabla de producción |
| `06-bloque6.html` | Capítulo 6 · Diversidad y ecología del bosque: la comunidad; índices de diversidad; números de Hill, rarefacción y acumulación; similitud entre sitios y ordenación; estructura vertical; patrón espacial |
| `07-bloque7.html` | Capítulo 7 · Sistemas agroforestales: sombra a partir del inventario; sombra a partir de una fotografía del dosel; sombra y rendimiento; diseño de plantación; presupuesto de carbono del sistema |
| `08-bloque8.html` | Capítulo 8 · Mapas y geoprocesamiento ligero: el mapa; polígonos y áreas; cuadrícula de muestreo; exportar; interpolación entre parcelas |
| `09-bloque9.html` | Capítulo 9 · Utilidades forestales: cubicación de trozas; madera aserrada; rendimiento de aserrío; factor de forma; conversión de unidades; costo y rentabilidad de una plantación |
| `10-bloque10.html` | Capítulo 10 · Informe y proyecto: informe; todas las tablas; proyecto; cómo citar (con el estudio de figuras y el editor ✎) |
| `11-apendices.html` | Apéndices A–F: A archivos que lee y escribe, B reglas reunidas, C glosario, D cuando algo no sale, E licencia y cita, F referencias (las escribe `genera-referencias.js`) |
| `manual-completo.html` | Las partes unidas, que es lo que se imprime (lo genera `herramientas/unir-manual.ps1`; no se edita a mano). La app lo enlaza desde el pie de su portada |

La portada usa sólo `manual.css`, porque es una hoja entera de dibujo. Todo lo demás usa
`interior.css` y `paginar.js`, que reparten el texto en hojas con su encabezado corrido
(«ForestPro · Manual de usuario», o «ForestPro · User’s Manual» cuando la parte lleva `lang="en"`),
su número de página y la pestaña del capítulo en el margen (doce pestañas: In, 1 a 10 y Ap).
Los números de página del índice se llenan solos; en una parte suelta quedan en blanco, que es
lo esperado hasta que se unen. El índice general de `00b-introduccion.html` ya trae el h1 y los
h2 propuestos de cada capítulo con sus `id` (`cap-N`, `sN-M`, `ap-a`…`ap-f`): quien escriba un
capítulo lo ajusta si cambia un título.

## Los colores de los bloques

La app no tiene un color por bloque, así que se tomaron de su propia paleta: el verde bosque, la
corteza y el musgo de su identidad (`css/style.css`), los colores de sus gráficas (`js/plot.js`,
`Plot.CAT`: verde azulado, ámbar, violeta, rojo, azul y óxido, oscurecidos lo justo para llevar texto
blanco) y el oro de la suite. Todos llevan texto blanco encima.

| Variable | Color | Bloque |
|---|---|---|
| `--b0` | `#1f2e1c` verde casi negro, el sotobosque | Preliminares e introducción (pestaña In) |
| `--b1` | `#1b5e20` verde bosque | 1 · Inicio |
| `--b2` | `#5d4037` corteza | 2 · Dasometría |
| `--b3` | `#4a7a26` musgo | 3 · Inventario y muestreo |
| `--b4` | `#187a68` verde azulado | 4 · Biomasa y carbono |
| `--b5` | `#a2660f` ámbar | 5 · Crecimiento y rendimiento |
| `--b6` | `#6f4f9e` violeta | 6 · Diversidad y ecología |
| `--b7` | `#b0353f` rojo cereza de café | 7 · Sistemas agroforestales |
| `--b8` | `#2f67a6` azul | 8 · Mapas |
| `--b9` | `#8f4c1f` óxido de la madera aserrada | 9 · Utilidades forestales |
| `--b10` | `#94701c` oro | 10 · Informe y proyecto |
| `--bx` | `#1f2e1c` verde casi negro | Apéndices (pestaña Ap) |

Las clases `.k0` a `.k10` y `.kx` pintan los chips del índice y las franjas; cada capítulo
pone `style="--acento: var(--bN)"` en su `<section>`. Los recuadros «aviso» y «cuando algo sale mal»
usan el ámbar (`--b5`).

## Las capturas

Las imágenes de `img/` salen de la app misma, a doble resolución, con una receta por imagen en
`herramientas/recetas/`. Cada receta es un fragmento que abre un bloque con un ejemplo, ajusta
los controles y devuelve el recorte; su primera línea dice el tamaño de la ventana
(`// ventana 1400x1000`). `recetas/_comun.js` se antepone a todas: abre un bloque con su ejemplo como
los botones «Abrir en …» de la portada (`bloque(n, clave)`, que llama a `ExampleHooks['clave:n']`),
carga el ejemplo de una tarjeta de datos por su id (`cargar('b4s', 'cafetal')`), espera a que terminen
los cálculos (`listo()`, que mira `window.FP_BUSY`), busca una tarjeta por su título (`tarjeta`),
despliega su «Método y fuentes» (`abrirMetodo`), lleva un elemento a la vista (`irA`), calcula el
recorte (`caja`) y esconde los botones flotantes del navegador LABG y los avisos emergentes para que
no salgan en la imagen. Los ejemplos reemplazan los datos sin preguntar, salvo donde la app pide
confirmación con `window.confirm`, que `_comun.js` contesta solo. `EN` y `L('texto', 'text')` sirven
para que una receta funcione en los dos idiomas.

**Con qué datos salen.** Sólo con los conjuntos de ejemplo incluidos (`js/datasets.js`, desde los CSV de
`data/`), todos simulados salvo las densidades, y con los valores por omisión de cada control salvo que
la receta diga otra cosa:

| Clave | Ejemplo | Bloques (`ExampleHooks`) | Tarjetas de datos con ese ejemplo |
|---|---|---|---|
| `cafetal` | Cafetal bajo sombra: 25 parcelas de 1 000 m² en 5 fincas y 4 manejos, 719 árboles de sombra, 250 cafetos, suelo, hojarasca, sombra y rendimiento | 3, 4 y 7 | `b2t`, `b3t`, `b3p`, `b4l`, `b4s`, `b6a`, `b7c`; `b8i` (`rend`, `sombra`) |
| `mesofilo` | Bosque mesófilo estratificado: 24 parcelas anidadas en 3 estratos, 1 830 árboles, parcela mapeada de 50 × 50 m (196 tallos), 15 puntos de relascopía, madera caída y predio de 9 vértices | 3, 4, 6 y 8 | `b2t`, `b2h`, `b3t`, `b3p`, `b3r`, `b4w`, `b6a`, `b6f`, `b8p` |
| `pino` | Plantación de pino: 30 parcelas permanentes con 6 remediciones, análisis troncal de 6 árboles, 40 árboles derribados por secciones, una parcela de 85 árboles con alturas faltantes y el carbono en dos mediciones | 2, 5 y 9 | `b2s`, `b2v`, `b2h`, `b4c`, `b5a`, `b5c` |
| `referencias` | Densidades y ecuaciones: densidad básica de 42 taxones y catálogo de 31 ecuaciones alométricas | 4 | (las tablas del Bloque 4) |

El Bloque 1 no necesita ejemplo; el 10 reúne lo que hayan calculado los demás, así que su receta
abre antes los bloques que deba mostrar. La foto hemisférica del Bloque 7 es sintética (`Foto de
ejemplo (sintética)`). Las figuras de la introducción: `i-inicio` (portada de la app), `i-interfaz`
(Bloque 3 con el cafetal, con marcas), `i-buscar` («carbono» en `Ctrl + K`), `i-datos` (la tarjeta de
datos de los árboles del cafetal), `i-metodo` (Estimación y error de muestreo con su «Método y
fuentes» abierto), `i-ejemplos` y `i-flujo` (secciones del Bloque 1). Hay además tres recetas de
prueba de capítulos (`b3-estructura`, `b5-sitio`, `b7-diseno`), que quien escriba esos capítulos
puede usar, cambiar o borrar.

Desde la raíz de la app (no hay `node` en el PATH de este equipo; se usa el de Creative Cloud):

```
set NODE="C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
%NODE% manual/herramientas/captura.js b5-sitio                  # una
%NODE% manual/herramientas/captura.js b5-sitio --idioma en --salida en/b5-sitio
%NODE% manual/herramientas/captura.js --todas                   # todas
%NODE% manual/herramientas/captura.js --todas --idioma en       # todas, en inglés, a img/en/
```

El idioma se elige escribiendo la clave `forestpro:lang` en el almacenamiento del navegador
antes de abrir la app (`js/i18n.js`). Si una receta deja en `window.__marcas` una lista
`[[n, x%, y%], …]`, la herramienta escribe además `img/<nombre>.marcas.json` con la posición de los
círculos numerados que el texto pone encima (`<span class="marca" style="left:…%;top:…%">n</span>`).
**Después de cambiar algo visible en la app, se vuelven a sacar las capturas afectadas**: el texto
del manual cita los números que se ven en ellas, y todos se comprueban en la app.

## Las herramientas

Todas usan `cdp.js`, que abre Edge (o Chrome) sin ventana con un perfil temporal propio
(`forestpro-manual-<puerto>` en la carpeta temporal), con la página enfocada y visible por emulación
(`Emulation.setFocusEmulationEnabled`, para que en tandas largas el navegador no la trate como oculta),
le pide cerrarse con `Browser.close` y borra el perfil al terminar; si el navegador no se cierra,
cierra sólo los procesos de ese perfil. Nunca toca el navegador del usuario. Node 18 o posterior;
sin dependencias.

| Herramienta | Para qué |
|---|---|
| `captura.js` | Saca una captura de la app con su receta (`--idioma en` para la interfaz inglesa) |
| `revisar.js` | Dice cuántas hojas salen, si alguna desborda, las imágenes que no cargaron y los huecos grandes al pie de cada hoja, con la figura que los causa (`… revisar.js manual/es/05-bloque5.html --huecos 1.2`) |
| `anchos.js` | Pone o quita las clases de ancho de las figuras por el nombre de su imagen (`… anchos.js archivo b5-sitio=w70 …`; `=w100` la quita) |
| `genera-portada.js` | Dibuja la portada con los datos y los motores de la app: el perfil y la planta de la parcela P01 del cafetal (cada árbol con su posición, altura, copa y DAP), la franja de los bloques y tres viñetas (la curva altura–diámetro de Chapman–Richards ajustada al pino, la parcela mapeada del mesófilo y el carbono del cafetal por reservorio); `--idioma en` para la inglesa |
| `genera-referencias.js` | Escribe las referencias del apéndice F desde lo que cita la app —los `refs` de cada «Método y fuentes» de `js/block2.js` a `js/block9.js` y las fuentes del catálogo alométrico (`Biomass.EQS`)—, entre las marcas `<!-- REFERENCIAS -->` y `<!-- /REFERENCIAS -->` de `11-apendices.html`; un apartado por bloque y uno para las ecuaciones, sin repetir obras (hoy, 103 referencias en 9 apartados); `--idioma en` para la inglesa |
| `unir-manual.ps1` | Une las partes en `manual-completo.html` |

Las figuras demasiado altas para la hoja se angostan con las clases `figure.w50` a `figure.w80`
de `interior.css`; los textos de las capturas no deben quedar por debajo de lo legible (una
captura con mucho texto, no menos de `w60`). `paginar.js` adelanta el texto que sigue a una figura
que no cabe, así que un hueco al pie de una hoja no siempre se arregla moviendo párrafos.

## Cómo se trabaja

1. Escribir la parte en `es/NN-bloqueN.html` con la estructura de `GUIA-CAPITULOS.md`.
2. Sacar sus capturas con su receta y mirarlas una por una (la herramienta las deja en `img/`).
3. Revisar la paginación: `revisar.js` con `--huecos 1.2`; ningún desborde, ninguna imagen sin
   cargar, y los huecos grandes sólo antes de una figura que de verdad no cabe. Ajustar anchos con
   `anchos.js`.
4. Unir las partes (se puede hacer cuantas veces se quiera; la app enlaza el resultado):

```
cd manual
powershell -ExecutionPolicy Bypass -File herramientas\unir-manual.ps1 es
```

Escribe `es/manual-completo.html` con la portada como primera hoja y las partes en orden, con un solo
`paginar.js`, de modo que la numeración sea continua y el índice encuentre las páginas de todos los
capítulos. Los estilos propios de cada parte se funden; si dos partes escriben el mismo selector con
valores distintos, gana el más frecuente y el otro se acota a las hojas de su capítulo. **El script
tiene que guardarse con marca de orden de bytes (BOM)**: Windows PowerShell 5.1 lee como ANSI un
`.ps1` sin ella, y el `·` del título saldría mal. Hoy `manual-completo.html` ya existe con la portada
y la introducción, para que el enlace de la app no lleve a ninguna parte vacía; se vuelve a generar
cada vez que se una.

## Cómo se obtiene el PDF

**Sólo al final**, cuando todas las partes están escritas y revisadas, y **de una sola vez**: unir
PDF sueltos pierde los enlaces del índice y reinicia la numeración. No se imprime tras cada parte ni
tras cada corrección. Después de unir, se imprime con el guion de PowerShell que maneja Chrome por el
protocolo de DevTools y espera a que carguen las tres tipografías y a que `paginar.js` reparta las
hojas (no se usa `--print-to-pdf`, que imprime antes):

```
powershell -ExecutionPolicy Bypass -File "C:\Users\luisa\AppData\Local\Temp\claude\C--Users-luisa-Documents\0c3144d8-eb0a-4647-b9f1-c07d0731f8ee\scratchpad\imprimir-pdf.ps1" ^
  -Url "file:///C:/Users/luisa/Documents/LABG%20Apps/ForestPro/manual/es/manual-completo.html" ^
  -Out "C:\Users\luisa\Documents\LABG Apps\ForestPro\manual\ForestPro_Manual_de_usuario_ES.pdf" ^
  -Prof "%TEMP%\forestpro-pdf"
```

(o sirviendo la carpeta con `server.ps1` y pasando `-Url http://localhost:9480/manual/es/manual-completo.html`).
Al terminar se borra el perfil temporal `%TEMP%\forestpro-pdf` y se comprueba que no quedó
ningún Chrome sin ventana de ese perfil. También se puede imprimir a mano desde el navegador:
destino **Guardar como PDF**, márgenes **Ninguno** y **Gráficos de fondo** activado.

El resultado se guarda como `manual/ForestPro_Manual_de_usuario_ES.pdf`, igual que en las
demás apps.

## De fuera

Las tres tipografías (Cormorant, Crimson Pro y Jost) vienen del servicio público de tipografías web
y sólo las usa el manual, no la app; tienen licencia SIL Open Font License. Todo lo demás —el texto,
las capturas, la portada y las herramientas— es propio. El manual no nombra programas ni marcas:
los resultados de la app se validaron contra implementaciones de referencia independientes, pero eso
se documenta en `tests/` (que no forma parte de la obra), no aquí. Los rótulos de la app que nombran
algo de fuera (el fondo de mapa en línea del Bloque 8, la base mundial de densidad de la madera, las
apps de la suite) se citan tal como aparecen en pantalla.
