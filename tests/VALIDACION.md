# Validación de ForestPro contra referencias independientes

Cada bloque se compara contra R 4.4.2 (paquetes de referencia) o contra cálculos escritos aparte, con los mismos datos de ejemplo. Los guiones están en `tests/r/`, las referencias en `tests/r/ref_bN.json` y el detalle de cada comparación en `tests/resultados/bN.md`. Para repetirlo:

```
Rscript tests/r/valida_bN.R
node tests/compare.js
```

| Bloque | Tema | Comparaciones | Desacuerdos |
|---|---|---:|---:|
| 2 | Dasometría | 287 | 0 |
| 3 | Inventario y muestreo | 430 | 0 |
| 4 | Biomasa y carbono | 4974 | 0 |
| 5 | Crecimiento y rendimiento | 616 | 0 |
| 6 | Diversidad y ecología | 1222 | 0 |
| 7 | Sistemas agroforestales | 211 | 0 |
| 8 | Mapas y geoprocesamiento | 269 | 0 |
| 9 | Utilidades forestales | 252 | 0 |
| | **Total** | **8261** | **0** |
