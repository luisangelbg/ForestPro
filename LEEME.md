# ForestPro

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23876374.svg)](https://doi.org/10.5281/zenodo.23876374)

**Del árbol medido a la tonelada de carbono** · *English: [README.md](README.md)*

Inventario forestal, dasometría, biomasa, carbono y agroforestería en el
navegador, sin escribir código: ecuaciones de volumen y de ahusamiento, curvas
altura–diámetro, diseños de muestreo con su error, tablas de rodal,
distribuciones diamétricas, biomasa alométrica con densidad de la madera y su
incertidumbre, reservorios de carbono y su cambio, crecimiento e índice de
sitio, diversidad y patrón espacial, sombra y arreglos de plantación en
sistemas agroforestales, mapas con cuadrículas de muestreo e interpolación,
cubicación de trozas y las cuentas de una plantación. Está pensada para
inventarios forestales y agroforestales, estimaciones de carbono, programas de
manejo, tesis y docencia. Español e inglés, tema claro y oscuro, sin instalar
nada; todo se calcula en el propio equipo y los datos no salen de él.


## Cómo abrirla

En línea: https://luisangelbg.github.io/ForestPro/

Doble clic en `index.html`: no necesita servidor, instalación ni internet, y
los ejemplos incluidos funcionan sin conexión. Si el equipo bloquea las
páginas abiertas como archivo local, o para abrirla desde otro equipo de la
red, ejecuta `Open ForestPro.bat` (arranca `server.ps1`, un servidor local en
el puerto 9480).


## Los diez bloques

1. **Inicio** — lo que hace la app y lo que no, el flujo de trabajo, los
   cuatro conjuntos de ejemplo con un botón para cada bloque al que sirven, y
   cómo citarla.
2. **Dasometría** — diámetro a partir de la circunferencia, área basal,
   esbeltez; volumen de trozas y fustes por Huber, Smalian y Newton; ecuaciones
   de volumen (Schumacher–Hall, Spurr y sus formas logarítmicas) ajustadas por
   mínimos cuadrados no lineales y comparadas con el índice de Furnival;
   ahusamiento (Kozak 1969 y el modelo segmentado de Max–Burkhart) con volumen
   comercial y surtidos; curvas altura–diámetro (Näslund, Chapman–Richards,
   Weibull) para completar las alturas que faltan.
3. **Inventario y muestreo** — parcelas circulares, cuadradas, rectangulares o
   anidadas; estimadores del muestreo simple aleatorio, estratificado (Cochran,
   con los grados de libertad de Satterthwaite), sistemático y por
   conglomerados con intervalos de confianza y error de muestreo; tamaño de
   muestra; relascopía; tablas de rodal y de existencias; distribución de
   Weibull de los diámetros; índice de valor de importancia, índice de
   densidad de Reineke, espaciamiento de Hart–Becking e índice de competencia
   de Hegyi.
4. **Biomasa y carbono** — catálogo editable de 31 ecuaciones alométricas
   (Chave 2014 y 2005, Brown 1997, Jenkins 2003, café, plátano, árboles de
   sombra y pinos mexicanos); densidad de la madera de la Global Wood Density
   Database con búsqueda por especie → género → parcela; relaciones
   raíz/tallo; fracción de carbono y CO₂e; propagación por Monte Carlo del
   error alométrico, de la densidad y del muestreo; madera caída por
   intersección de líneas, hojarasca y carbono orgánico del suelo; reservorios
   con su error combinado y el cambio entre dos inventarios.
5. **Crecimiento y rendimiento** — incrementos corriente y medio anual y el
   turno biológico; modelos de Chapman–Richards, Gompertz, Schumacher y
   logístico; curvas de índice de sitio anamórficas y polimórficas con sus
   clases; el sistema de crecimiento y rendimiento de Clutter con proyección y
   una tabla de producción editable.
6. **Diversidad y ecología** — Shannon, Simpson, Pielou, α de Fisher, Chao1 y
   ACE, cobertura de la muestra, números de Hill, rarefacción y acumulación de
   especies; Jaccard, Sørensen y Bray–Curtis, UPGMA y NMDS; perfil vertical de
   especies de Pretzsch; Clark–Evans y la K y la L de Ripley con envolvente de
   simulación.
7. **Sistemas agroforestales** — sombra a partir del inventario de los árboles
   de sombra; apertura del dosel en una fotografía hemisférica segmentada en el
   navegador; la respuesta sombra–rendimiento; arreglos de plantación (marco
   real, tresbolillo, rectangular, callejones, cercos vivos, linderos); el
   presupuesto de carbono del sistema frente a un monocultivo.
8. **Mapas** — un mapa interactivo propio (parcelas con su radio verdadero,
   árboles, polígonos; fondo de OpenStreetMap opcional y apagado por omisión);
   superficie y perímetro de polígonos; cuadrículas de muestreo sistemáticas y
   aleatorias; exportación e importación en GPX, KML, GeoJSON y CSV; IDW y
   kriging ordinario o simple con el variograma y la validación cruzada; un
   mapa UTM estático para el informe.
9. **Utilidades forestales** — cubicación de trozas y reglas de cubicación
   (Doyle, Scribner, Internacional ¼″), madera aserrada, rendimiento y
   sobrerrendimiento del aserradero, factor de forma, conversión de unidades,
   madera apilada y las cuentas de una plantación (VPN, TIR, relación
   beneficio–costo, valor esperado del suelo de Faustmann, anualidad
   equivalente, periodo de recuperación).
10. **Informe y proyecto** — informe HTML autocontenido con todos los bloques
    trabajados, sus figuras, tablas, interpretaciones y, si se pide, los
    métodos con sus fuentes, que se imprime a PDF; todas las tablas de
    resultados en un libro XLSX o como CSV en un ZIP; el proyecto en JSON, que
    repite los pasos dados sobre una página limpia.

## Manuales

- `manual/ForestPro_Manual_de_usuario_ES.pdf` — manual de usuario en español
  (155 hojas tamaño carta): introducción, un capítulo por bloque y apéndices
  (archivos, reglas de decisión, glosario, qué hacer cuando algo no sale,
  licencia y cómo citar, y las 103 referencias).
- `manual/en/ForestPro User's Manual (English).pdf` — el mismo manual en
  inglés (154 hojas).

Las partes en HTML están en `manual/es/` y `manual/en/`; `manual/LEEME.md`
explica cómo se arman. La carpeta `docs/` guarda el manual anterior, de un solo
archivo, como material de consulta: el manual vigente es el de `manual/`.

## Validación

`tests/run.html` ejecuta 84 pruebas de los motores y de la interfaz inglesa
(también con `node tests/run_node.js`). Ábrela con doble clic: todo debe salir
en verde.

Cada motor (`js/eng-*.js`) corre en el navegador y en node, así que cada bloque
se comparó, con los datos de ejemplo, contra referencias independientes en
R 4.4.2 (BIOMASS, forestmangr, lmfor, minpack.lm, systemfit, vegan, MASS,
iNEXT, spatstat, fitdistrplus, sf, gstat, units y FinCal) y contra fórmulas
escritas aparte donde no hay paquete: **8 327 comparaciones, sin
desacuerdos**.

| Bloque | Tema | Comparaciones | Desacuerdos |
|---|---|---:|---:|
| 2 | Dasometría | 287 | 0 |
| 3 | Inventario y muestreo | 458 | 0 |
| 4 | Biomasa y carbono | 5 015 | 0 |
| 5 | Crecimiento y rendimiento | 613 | 0 |
| 6 | Diversidad y ecología | 1 222 | 0 |
| 7 | Sistemas agroforestales | 211 | 0 |
| 8 | Mapas y geoprocesamiento | 269 | 0 |
| 9 | Utilidades forestales | 252 | 0 |
| | **Total** | **8 327** | **0** |

La tolerancia de cada comparación está junto a ella en `tests/resultados/bN.md`;
el resumen, en `tests/VALIDACION.md`, y `tests/LEEME_VALIDACION.md` explica,
bloque por bloque, las diferencias de convención con los paquetes de
referencia y los errores de la app que la comparación atrapó y que se
corrigieron. Para repetirla:

```
Rscript tests/r/valida_b4.R
node tests/compare.js
node tests/run_node.js
```

## Datos y material de terceros

Las rutinas numéricas, el lector de CSV y XLSX, los escritores de XLSX y ZIP,
las figuras y el mapa son código propio, y el programa no pide nada a
internet. Cada método publicado se cita a su fuente original en el código, en
la app y en el manual. Lo que viene de terceros está en
`LICENSES-TERCEROS.md` con su licencia: los íconos de línea de los módulos
compartidos de la suite (navegador, estudio de figuras y efectos), del
proyecto Lucide con licencia ISC (los derivados de Feather, además, con la
MIT); la densidad básica de 42 taxones de la Global Wood Density Database
(Zanne et al. 2009, CC0); y, sólo si el usuario enciende el fondo de mapa del
Bloque 8, las teselas de OpenStreetMap del área visible (nunca los datos del
usuario), con la atribución que pide su licencia.

Los cuatro conjuntos de ejemplo —un **cafetal bajo sombra**, un **bosque
mesófilo estratificado**, una **plantación de pino** y las **tablas de
referencia**— son simulados con un guion propio y una semilla fija
(`data/generar_datos.R`), salvo las densidades de la madera: los lugares son
verosímiles, las parcelas y los árboles no existen. Ver `data/LEEME.md` y
`PROCEDENCIA.md`.

## Cómo citar

Barrera-Guzmán, L. Á. (2026). *ForestPro: a browser-based platform for forest
inventory, mensuration, biomass, carbon and agroforestry* (versión 1.0.0)
[Programa de cómputo]. Zenodo.
https://doi.org/10.5281/zenodo.23876374

El DOI de arriba lleva siempre a la versión más reciente; cada versión tiene
además el suyo en la página de Zenodo (la 1.0.0: 10.5281/zenodo.23876375).
Cita la versión que usaste. Código: https://github.com/luisangelbg/ForestPro

La sección **Cómo citar** de la portada de la app y la del Bloque 10 dan la
cita lista para copiar, también como entrada BibTeX, y todos los informes
terminan con ella; `CITATION.cff` tiene los mismos datos para los gestores de
referencias. Cita además las ecuaciones y los métodos que usaste: cada
resultado los nombra.

## Licencia

Licencia Pública General de GNU, versión 3 o posterior (`LICENSE`). Copyright
(C) 2026 Luis Ángel Barrera-Guzmán.

## Cómo contribuir

Los errores y las propuestas se reciben en
https://github.com/luisangelbg/ForestPro/issues (el botón «Reportar un
problema» de la app abre uno con el bloque y el navegador ya anotados).
