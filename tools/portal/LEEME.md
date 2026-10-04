# ForestPro en el portal de la LABG Suite

Lo que hace falta para que ForestPro aparezca en `luisangelbg.github.io`. Nada de esto se ha copiado al portal.

1. **Imágenes.** Copia `ForestPro.webp` (captura de 1200 × 750) a `assets/apps/ForestPro.webp` y `ForestPro.jpg`
   (imagen para redes de 1200 × 630) a `assets/og/ForestPro.jpg`.
2. **Catálogo.** Pega el bloque de abajo en `data/apps.js`, dentro de `window.LABG_APPS`, por ejemplo después del de
   SoilPro. Va con `estado: "proximamente"`; cuando el repositorio esté en GitHub Pages, cámbialo a `"enlinea"`.
   Si después se archiva en Zenodo, pon el DOI de concepto en `doi`.
3. **Páginas generadas.** `npm run build` (o el flujo de GitHub al cambiar `data/`) crea `apps/forestpro/`.

```js
  {
    id: "ForestPro", nombre: "ForestPro",
    lema: "Del árbol medido a la tonelada de carbono",
    descripcion: "Inventario forestal y agroforestal, de la hoja de campo al informe: dasometría con ecuaciones de volumen, ahusamiento y altura–diámetro; diseños de muestreo con su error, relascopía, tablas de rodal y distribución de Weibull; biomasa y carbono con 31 ecuaciones alométricas, densidad de la madera e incertidumbre por Monte Carlo; crecimiento, índice de sitio y tabla de producción; diversidad, ordenación y patrón espacial; sombra y diseño de cafetales y sistemas agroforestales; mapas con cuadrícula de muestreo, GPX, KML, GeoJSON y kriging; y las cuentas del aserradero y de la plantación. Validada contra R con 8 261 comparaciones.",
    categoria: "agronomia", estado: "proximamente", version: "1.0.0", doi: "", licencia: "GPL-3.0",
    manualPdf: "", manualMb: 0, manualHtml: true, datos: true,
    puntos: ["Volumen, ahusamiento y altura por ajuste no lineal; inventario con su error de muestreo", "Biomasa y carbono con densidad de la madera, Monte Carlo y todos los reservorios", "Crecimiento, índice de sitio, diversidad, ordenación y patrón espacial", "Sombra y diseño agroforestal, mapas con kriging y GPX, informe autocontenido"],
    destacada: false
  },
```

`manualHtml: true` funciona porque el repositorio trae `manual/es/manual-completo.html`, que lleva al manual de
`docs/manual.html`.
