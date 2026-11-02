# Registro de cambios

Todas las versiones de ForestPro, de la más reciente a la más antigua. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la numeración, [SemVer](https://semver.org/lang/es/).

## [Sin versión] — 2026-11-01

Correcciones halladas al escribir el manual. La versión sigue siendo la 1.0.0.

### Corregido

- **Bloque 4 · error del total de reservorios.** Ya no se suman en cuadratura reservorios que salen de las mismas
  parcelas: la biomasa aérea, las raíces, los muertos en pie (y la hojarasca y el suelo cuando traen las mismas
  parcelas) se suman parcela por parcela y el error del total sale de esos totales con el estimador del inventario;
  solo los reservorios de otra muestra (madera caída, arbustos) se agregan en cuadratura. La tabla dice cómo entra
  cada reservorio y la interpretación compara con la cuadratura. El balance ya no mezcla tarjetas de sitios
  distintos: lo que viene de otro ejemplo o archivo queda fuera con un aviso. Validado contra un cálculo aparte en R.
- **Bloque 4:** la gráfica del cambio rotula «Medición 1»; la leyenda de las ecuaciones ya no recorta los nombres ni
  se encima con el título del eje; el selector de la base mundial ya no ofrece .xls (que no se lee) y lo explica si
  llega uno.
- **Bloque 3 · Weibull:** Kolmogorov–Smirnov y χ² usan los mismos pesos del ajuste y el tamaño efectivo de Kish;
  nuevo campo «DAP mínimo medido» (truncamiento por la izquierda; la app propone el menor DAP del inventario) y las
  clases empiezan en él; el aviso de borde de la de 3 parámetros salta a menos de 1 % del mínimo, y otro avisa cuando
  la ubicación queda en 0.
- **Bloque 3:** el tamaño de muestra estratificado reparte parcelas enteras que suman la n del título (y se calcula
  al cargar el inventario); conglomerados ya no dice «CV (0 %)»; «tocón» con acento cuenta como muerto; el diseño de
  estimación y el corte se eligen de nuevo con cada inventario; la figura por estrato rotula todos los estratos y no
  corta los intervalos; las notas de los ejemplos se actualizan al cargarlos desde otro bloque.
- **Bloque 5:** rehacer el sitio respeta la edad inicial, el índice de sitio y el área basal que escribió el usuario;
  si cambia la edad base, el índice propuesto se recalcula y el escrito a mano lleva un aviso; la tabla de producción
  termina en la edad final; el cruce ICA = IMA usa el ICA periódico contra el IMA al inicio del intervalo y
  corresponde al IMA máximo.
- **Bloque 7:** el texto de la foto hemisférica dice bien que el peso sen θ/ρ disminuye hacia el horizonte; la
  gráfica de cobertura se titula «Cobertura de copas por manejo (media ± DE)» y sus cifras quedan sobre las barras de
  error; el plano de plantación sale centrado.
- **Bloque 8:** la validación cruzada usa el kriging elegido (simple u ordinario); el predio no se agrega dos veces;
  la barra de color deja lugar para su título.
- **Bloque 9:** la nota del flujo descontado es cierta (se ocultan los años con solo el costo anual); sin doble
  negativo en el sobrerrendimiento; singulares «1 metro equivale a», «1 movimiento cae…».
- **Bloque 10:** los bloques llevan su número (en las casillas, en Ctrl K y en el informe, cuyo índice también); los
  CSV del ZIP llevan una sola BOM; el botón de imprimir es una barra fija arriba y ya no tapa el título.
- **Bloque 2:** la opción «La de menor AIC» ya no muestra los dos idiomas; leyendas que no se enciman con el eje.
- **Figuras y diseño:** leyendas de abajo en tantas columnas como quepan y bajo el título del eje (Bloques 2, 4 y 6);
  los símbolos y las unidades no pasan a mayúsculas en las etiquetas (Mg, λ, α); a 1 400 px caben los menús largos y
  las tablas de resultados (los encabezados se parten en dos renglones); el flujo de trabajo del inicio va en dos
  filas de tres; detalles del héroe y de la viñeta del Bloque 2.
- **Datos:** la hojarasca simulada del cafetal era demasiado alta (12.0 Mg C/ha); ahora 3.5 Mg C/ha.
- **Documentación:** el README apunta al manual de `manual/`; la guía y el registro ya no mencionan una PCoA que la app
  no muestra; interfaz inglesa con ortografía estadounidense y comillas “ ” donde se tocó.

### Interfaz inglesa (lo que salió al traducir el manual)

- **Referencias de «Método y fuentes» (Bloques 2 a 9) y fuentes del catálogo de ecuaciones** en su forma inglesa:
  «and» entre autores, «3rd/4th/5th ed.», «ch.», «tables», «eq.»/«eqs.», «The Hague», «In», «appendix», «suppl.», y
  las notas del catálogo traducidas (índice E de Chave 2014, d₁₅ de Segura, altura de D de van Noordwijk…). Nuevo
  `js/lang-en.js` (`LangEN.ref`), con la conversión del generador del apéndice F ampliada. Los títulos de las obras
  no se tocan; en español todo queda igual.
- **Textos en español con la interfaz en inglés:** «Mg C/ha/yr» en la tasa anual del cambio de carbono; «m³ ↔ bf»
  en la viñeta del Bloque 9; «BF» en la cubicación de trozas; el pie de la portada enlaza al manual inglés
  (`manual/en/manual-completo.html`, «User’s manual»; el español sigue en `manual/es/`).
- **Etiquetas de los ejemplos en el idioma de la interfaz:** estratos (Conserved, Disturbed, Riparian), manejos
  (rustic, traditional/commercial polyculture, shaded monoculture), pisos (canopy, understory), niveles de la tabla
  de densidades (species, genus) y estado (alive, standing dead). Sólo se traducen las filas de los ejemplos
  (`FPData.rows`); los datos de un usuario no se tocan. Si se cambia de idioma con un ejemplo cargado, el ejemplo se
  vuelve a cargar con las etiquetas nuevas (sin entrar dos veces en el proyecto).
- **Nombres de archivo en el idioma de la interfaz** (`LangEN.file`, aplicado en toda descarga):
  `forestpro_report_…`, `forestpro_project_…`, `forestpro_tables.xlsx`, `forestpro_stand_table.csv`,
  `forestpro_strata.csv`, `…_template.csv`, etc.; también los CSV del ZIP de tablas y el encabezado del CSV del mapa.
  En español no cambia nada.
- **Ortografía estadounidense:** characterize, linearized, leveling off, story/stories, understory, toward, metric
  ton(s); en las copias de los módulos comunes, color, gray/Grays/Grayscale, center/centered (como CytogeneticsPro).
- **Informe en inglés** con la fecha en formato estadounidense (`en-US`).

### Corregido (en los dos idiomas)

- **Informe:** el pie dice «la validación contra implementaciones independientes» / «the validation against
  independent implementations» (antes nombraba R).
- **Portada:** el pie enlaza a «Validación contra implementaciones independientes» / «Validation against independent
  implementations» (antes «Validación contra R»).
- **Al cambiar de idioma:** las piezas del ejemplo de madera aserrada del Bloque 9 (Tabla/Board, Polín/Stud…) y los
  nombres de los ejemplos en el aviso del balance del Bloque 4 siguen el idioma activo (antes, el de la carga).
- **Bloque 7:** las barras del histograma de grises se ven (sin hueco ni borde entre las 256 clases; opción `solid`
  de `Plot.bars`).

### Validación

- 8 327 comparaciones con R sin desacuerdos (antes 8 261): nuevas la Weibull ponderada y truncada con sus pruebas, el
  reparto del tamaño de muestra estratificado y el balance de reservorios; regeneradas las referencias de los Bloques
  3, 4 y 5 (`tests/LEEME_VALIDACION.md`). 72 pruebas unitarias (antes 62).
- Interfaz inglesa: 84 pruebas (12 nuevas: 6 en `tests/unit.js` y 6 que leen el código en `tests/t_english.js`,
  sólo en node); la validación sigue en 8 327 comparaciones sin desacuerdos.

## [1.0.0] — 2026-10-04

Primera versión pública.

### Añadido

- **Bloque 1 · Inicio:** qué hace y qué no hace la app, el flujo de trabajo, los cuatro conjuntos de ejemplo con un
  botón por bloque y la cita.
- **Bloque 2 · Dasometría:** DAP desde la circunferencia, área basal, esbeltez; volumen de trozas y árboles por
  secciones (Huber, Smalian, Newton); ecuaciones de volumen ajustadas por mínimos cuadrados no lineales y comparadas
  con el índice de Furnival; ahusamiento de Kozak (1969) y de Max y Burkhart (segmentado) con volumen comercial y
  productos; curvas altura–diámetro (Näslund, Chapman–Richards, Weibull).
- **Bloque 3 · Inventario y muestreo:** parcelas circulares, cuadradas, rectangulares y anidadas; expansión a la
  hectárea; estimadores aleatorio simple, estratificado (Cochran, gl de Satterthwaite), sistemático (diferencias
  sucesivas) y por conglomerados (razón); tamaño de muestra; relascopía; tablas de rodal y de existencias;
  distribución de Weibull de 2 y 3 parámetros; IVI; índice de Reineke, espaciamiento de Hart–Becking e índice de
  competencia de Hegyi.
- **Bloque 4 · Biomasa y carbono:** catálogo editable de 31 ecuaciones alométricas con reglas por especie y
  ecuaciones propias; densidad de la madera de la Global Wood Density Database (especie → género → parcela);
  relación raíz/tallo (IPCC 2006, Cairns 1997); fracción de carbono y CO₂e; Monte Carlo; necromasa por intersección
  de líneas, hojarasca y carbono del suelo (lee también las tablas por capas de SoilPro); reservorios con su error combinado y cambio entre inventarios.
- **Bloque 5 · Crecimiento y rendimiento:** ICA, IMA y turno biológico; modelos de Chapman–Richards, Gompertz,
  Schumacher y logístico; índice de sitio anamórfico y polimórfico (diferencia algebraica) con clases; sistema de
  Clutter por mínimos cuadrados en dos etapas, proyección y tabla de producción editable.
- **Bloque 6 · Diversidad y ecología:** Shannon, Simpson, Pielou, α de Fisher, Chao1 y ACE, cobertura, números de
  Hill y sus estimaciones asintóticas, rarefacción y acumulación; Jaccard, Sørensen y Bray–Curtis, UPGMA y
  NMDS, con envío de la matriz a ClusteringPro y PCAPro; perfil de Pretzsch; Clark–Evans y K y L de Ripley.
- **Bloque 7 · Sistemas agroforestales:** sombra desde el inventario (cobertura con traslape, índice de complejidad
  de Holdridge) y desde una foto hemisférica (umbral de Otsu, apertura por ángulo sólido); respuesta del
  rendimiento a la sombra con su óptimo; diseños de plantación en SVG; presupuesto de carbono contra monocultivo.
- **Bloque 8 · Mapas:** mapa propio con fondo de OpenStreetMap opcional y apagado por omisión; áreas en UTM y en la
  esfera; cuadrícula sistemática y puntos al azar; GPX, KML, GeoJSON y CSV; IDW y kriging ordinario y simple con
  variograma, ajuste ponderado y validación cruzada; mapa estático en UTM.
- **Bloque 9 · Utilidades:** cubicación de trozas y reglas de Doyle, Scribner e Internacional ¼″; madera aserrada;
  rendimiento de aserrío; factor de forma; conversiones con definiciones exactas; leña apilada; costo y
  rentabilidad de una plantación (VPN, TIR, B/C, Faustmann, anualidad equivalente, recuperación).
- **Bloque 10 · Informe y proyecto:** informe HTML autocontenido que se imprime a PDF; todas las tablas en XLSX o en
  un ZIP de CSV; proyecto JSON que se reabre repitiendo los pasos en una página limpia.
- Validación contra R en los bloques 2 a 9: 8 261 comparaciones con su tolerancia, sin desacuerdos
  (`tests/VALIDACION.md`), y 62 pruebas unitarias (`tests/run.html`, `tests/run_node.js`).
- Español e inglés, tema claro y oscuro, estudio de figuras, editor ✎ de figuras, navegador LABG y esperas animadas
  con la escena propia de ForestPro.
- Manual de usuario en español (`docs/manual.html` y `docs/manual.md`).
