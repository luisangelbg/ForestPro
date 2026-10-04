# Datos de ejemplo de ForestPro

Todos los datos de esta carpeta, salvo la tabla de densidades de la madera, son **simulados**: no son mediciones
de un sitio real. Se generaron con modelos y parámetros que dan órdenes de magnitud realistas, para enseñar cada
bloque de la app y para compararla contra R con los mismos números. Las coordenadas caen en una región cafetalera
y de bosque mesófilo de montaña, pero ni las parcelas ni los árboles existen.

- `generar_datos.R` escribe los conjuntos del cafetal, del bosque mesófilo y de la plantación de pino
  (`set.seed(20261004)`; con la misma versión de R sale idéntico). Uso: `Rscript generar_datos.R` desde esta carpeta.
- `generar_densidades.R` arma la tabla de densidades a partir de la Global Wood Density Database.
- `node tools/embed_data.js` (desde la raíz) pasa los CSV a `js/datasets.js`, que es lo que lee la app; así los
  ejemplos abren con doble clic, sin servidor.
- `node tools/export_equations.js` escribe `ecuaciones_alometricas.csv` desde el catálogo de la app.

Las columnas usan punto decimal, codificación UTF-8 y los nombres que la app reconoce sin tener que emparejarlos.

## Cafetal bajo sombra (5 fincas, 25 parcelas)

Parcelas circulares de 1 000 m² (radio 17.84 m) en cinco fincas con cuatro manejos: rústico, policultivo
tradicional, policultivo comercial y monocultivo bajo sombra. Se usa en los bloques 2, 3, 4, 7 y 8.

| Archivo | Filas | Columnas |
|---|---:|---|
| `cafetal_parcelas.csv` | 25 | parcela, finca, manejo, lat, lon, altitud (m), area_m2, radio_m, sombra_pct (%), densidad_cafe (cafetos/ha), rend_cafe (kg/ha de café pergamino), hojarasca_g (peso seco en el marco), marco_m2 |
| `cafetal_arboles.csv` | 719 | parcela, finca, arbol, especie, familia, dap (cm), altura (m), copa (diámetro, m), estado (vivo / muerto en pie), x, y (m desde el centro) |
| `cafetal_cafetos.csv` | 250 | parcela, cafeto, d15 (diámetro a 15 cm, cm), altura (m) |
| `cafetal_suelo.csv` | 75 | parcela, prof_sup, prof_inf (cm), co_pct (carbono orgánico, %), dap_g_cm3 (densidad aparente), pedregosidad_pct |

La sombra (Inga, Cordia, Erythrina, aguacate, cítricos, plátano y otras) se reparte con pesos distintos según el
manejo. La cobertura de copas se calcula con traslape aleatorio, y el rendimiento sigue una curva con un óptimo de
sombra en 38 % más ruido, para que el Bloque 7 tenga qué encontrar.

## Bosque mesófilo de montaña (3 estratos, 24 parcelas)

Parcelas circulares anidadas: radio de 17.84 m (1 000 m²) para árboles de 10 cm de DAP o más y de 5.64 m (100 m²) para los
de 2.5 a 10 cm. Hay tres estratos (conservado, perturbado y ribereño) con su superficie, y un predio de 9 vértices. Se usa
en los bloques 2, 3, 4, 6 y 8.

| Archivo | Filas | Columnas |
|---|---:|---|
| `mesofilo_parcelas.csv` | 24 | parcela, estrato, area_estrato_ha, lat, lon, altitud, radio_grande_m, radio_chico_m, dap_corte_cm |
| `mesofilo_arboles.csv` | 1 830 | parcela, estrato, subparcela, arbol, especie, familia, dap (cm), altura (m; vacía en parte), estado, x, y |
| `mesofilo_mapeada.csv` | 196 | arbol, especie, dap, altura, x, y (m, en 50 × 50 m), dosel (piso) |
| `mesofilo_relascopio.csv` | 235 | punto, arbol, especie, dap, altura: los árboles «dentro» en 15 puntos del bosque conservado con factor de área basal 2 m²/ha |
| `mesofilo_madera_caida.csv` | 167 | transecto, estrato, longitud_m, pieza, diametro_cm (en el cruce), clase (descomposición 1–3) |
| `mesofilo_predio.csv` | 9 | vertice, lat, lon |

La parcela mapeada mezcla un patrón agregado (proceso de Thomas) en el sotobosque con uno casi regular (inhibición
con 3.5 m de distancia mínima) en el dosel, para que las funciones de Ripley del Bloque 6 muestren las dos escalas.

## Plantación de pino (30 parcelas permanentes)

| Archivo | Filas | Columnas |
|---|---:|---|
| `pino_remediciones.csv` | 180 | parcela, medicion (1–6), edad (años), hdom (altura dominante, m), n_ha, dq (cm), g_ha (m²/ha), v_ha (m³/ha) |
| `pino_analisis_troncal.csv` | 203 | arbol, edad, altura, diametro: el crecimiento de árboles tipo reconstruido por análisis troncal |
| `pino_secciones.csv` | 536 | arbol, dap, altura_total, h (altura de la sección, m), d (diámetro, cm): árboles derribados y cubicados por secciones |
| `pino_arboles.csv` | 85 | parcela, arbol, especie, dap, altura |
| `pino_carbono_remedicion.csv` | 30 | parcela, edad1, edad2, c1, c2 (Mg C/ha en dos mediciones) |

Las alturas dominantes siguen curvas de Chapman–Richards polimórficas (la tasa k cambia de una parcela a otra); el
diámetro cuadrático sale de un índice de densidad de Reineke que se acerca al máximo y el volumen, de G·H·0.47. Las secciones siguen un perfil
segmentado de Max y Burkhart con parámetros conocidos (b = −2.87, 1.30, −1.02, 38, 0.72, 0.08), de modo que el
Bloque 2 debe recuperarlos.

## Densidad básica de la madera

`densidades_madera.csv` (42 especies o géneros): especie, genero, densidad (g/cm³), nivel (especie o género), n
(registros) y fuente. Se tomó de la **Global Wood Density Database** (Zanne, A. E. et al. 2009, Dryad,
doi:10.5061/dryad.234), dedicada al dominio público con **CC0 1.0**, a través de la copia que trae el paquete
BIOMASS de R. Las especies que no están en la base ni por género quedan fuera: la app les asigna la media de la
parcela o del conjunto y lo dice.

## Ecuaciones alométricas de referencia

`ecuaciones_alometricas.csv` (31 ecuaciones) es el catálogo que trae la app: id, nombre en español e inglés, grupo,
variables que pide (D, H, ρ, E, d15), la ecuación con la biomasa aérea en kg, el error residual en escala
logarítmica (σ), el intervalo de DAP en que se ajustó y la fuente publicada. En el Bloque 4 se puede editar, agregar
ecuaciones propias y asignar una ecuación a cada especie o género.
