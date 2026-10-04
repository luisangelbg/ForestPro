# Procedencia de ForestPro

Este documento dice qué partes de ForestPro son obra propia y cuáles no, de dónde salen estas últimas y en qué
situación quedan, para que cualquiera pueda comprobarlo sin tener que creerlo.

Última revisión: 4 de octubre de 2026 (versión 1.0.0).

## 1. En una frase

ForestPro no contiene código de cálculo de nadie más. Contiene ecuaciones, tablas y constantes científicas
publicadas, citadas a su fuente en el código, en la app y en el manual, y verificadas contra R; una tabla de
densidades de la madera de dominio público (CC0); y, en los módulos comunes de la suite LABG, íconos de línea con
licencia ISC.

## 2. Lo que el programa no tiene

- **Ninguna biblioteca de terceros.** Ni de gráficas, ni de mapas, ni de lectura de hojas de cálculo, ni de
  álgebra. Las rutinas numéricas (`js/num.js`: QR, Cholesky, inversa, distribuciones t, F, χ², normal, beta y
  gamma, Brent, Nelder–Mead), el ajuste no lineal de Levenberg–Marquardt (`js/nls.js`), el lector de CSV, XLSX y
  ODS y los escritores de XLSX y ZIP (`js/dataio.js`), las figuras en SVG (`js/plot.js`, `js/art.js`) y el mapa
  (`js/mapview.js`, `js/eng-geo.js`) se escribieron para este programa.
- **Nada minificado, empaquetado ni pegado.** No hay `vendor/`, ni `node_modules/`, ni paso de compilación.
- **Nada que se cargue de la red.** `index.html` no apunta fuera de la carpeta. La única petición a internet es
  opcional: el fondo de OpenStreetMap del Bloque 8, apagado mientras el usuario no lo encienda.

## 3. Lo que viene de otros

| Elemento | Dónde está | Origen | Situación |
|---|---|---|---|
| Íconos de línea | `js/labg-navigator.js`, `js/labg-figure-studio.js`, `js/labg-fx.js` | Lucide 1.49.0 (parte de Feather) | ISC y MIT, permisivas; texto completo en `LICENSES-TERCEROS.md` |
| Densidad básica de la madera | `data/densidades_madera.csv`, `js/datasets.js` | Global Wood Density Database (Zanne et al. 2009), vía el paquete BIOMASS | CC0 1.0 (dominio público), citada igualmente |
| Teselas del fondo de mapa | no se distribuyen; se piden solo si el usuario enciende el fondo | OpenStreetMap | ODbL y CC BY-SA 2.0, con la atribución en el mapa |

Los módulos comunes de la suite (`labg-core.js`, `labg-base.css`, `labg-navigator.js`, `labg-figure-studio.js`,
`labg-figedit.js`, `labg-fx.js`) son del mismo autor y se comparten entre las apps LABG.

## 4. Ecuaciones y constantes publicadas

Las ecuaciones alométricas (Chave et al. 2005 y 2014, Brown 1997, Jenkins et al. 2003, Segura et al. 2006,
van Noordwijk et al. 2002 y las de pinos mexicanos), las relaciones raíz/tallo del IPCC (2006) y de Cairns et al.
(1997), los modelos de volumen, ahusamiento, altura–diámetro y crecimiento, los estimadores de muestreo, los índices
de diversidad y de estructura, el variograma y el kriging, las reglas de cubicación y las fórmulas financieras son
conocimiento científico publicado. Se escribieron a partir de sus publicaciones originales, cada una citada junto a
su código, en el recuadro «Método y fuentes» de la app y en el manual. El catálogo alométrico se exporta a
`data/ecuaciones_alometricas.csv` con la fuente de cada ecuación.

## 5. Datos de ejemplo

Los conjuntos del cafetal, del bosque mesófilo y de la plantación de pino son simulados por
`data/generar_datos.R` con una semilla fija; no son mediciones de ningún sitio real. Ver `data/LEEME.md`.

## 6. Validación

Las comparaciones contra R (`tests/r/`, `tests/compare.js`) usan paquetes de R como referencia externa; ninguno de
ellos forma parte del programa ni se distribuye con él.
