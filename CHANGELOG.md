# Registro de cambios

Todas las versiones de ForestPro, de la más reciente a la más antigua. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la numeración, [SemVer](https://semver.org/lang/es/).

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
  Hill y sus estimaciones asintóticas, rarefacción y acumulación; Jaccard, Sørensen y Bray–Curtis, UPGMA, PCoA y
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
