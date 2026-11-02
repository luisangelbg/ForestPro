# ForestPro

**From the measured tree to the metric ton of carbon** · *Español: [LEEME.md](LEEME.md)*

Forest inventory, mensuration, biomass, carbon and agroforestry in the
browser, without writing code: volume and taper equations, height–diameter
curves, sampling designs and their sampling error, stand tables, diameter
distributions, allometric biomass with wood density and its uncertainty,
carbon pools and their change, growth and site index, diversity and spatial
pattern, shade and planting layouts in agroforestry systems, maps with
sampling grids and interpolation, log rules and the economics of a
plantation. It is meant for forest and agroforestry inventories, carbon
estimates, management plans, theses and teaching. The interface is in Spanish
and English, with light and dark themes. There is nothing to install, and
everything is computed on your own computer: the data never leave it.

## Statement of need

A forest inventory goes from the field sheet to the report through many
steps: expanding each plot to the hectare, estimating the mean with its
sampling error under the design that was really used, filling missing heights,
fitting volume and taper equations, choosing an allometric equation and a wood
density for every tree, propagating their error to the carbon stock, fitting
growth and site index curves, computing diversity, mapping the plots and
pricing the plantation. In practice those steps are spread over spreadsheets,
several R packages, a GIS and a drawing program, and every transfer is a
chance for error. ForestPro puts the whole chain in one page that opens with a
double click: each computation names its method and its source, explains what
the number means, draws the figures and writes a self-contained report with
the methods that were actually used.

## Open it

- **On line:** https://luisangelbg.github.io/ForestPro/
- **On your computer:** download the repository and double-click
  `index.html`. No server, no installation, no build step and no internet
  connection; the bundled examples work offline. Any current browser works.

If your computer blocks pages opened as local files, or to open it from
another device on the same network, run `Open ForestPro.bat` (Windows; it
starts `server.ps1`, a minimal local server on port 9480).

## The ten blocks

1. **Home** — what the app does and what it does not do, the workflow, the
   four example data sets with a button for each block they serve, and how to
   cite.
2. **Tree mensuration** — DBH from girth, basal area, slenderness; log and
   stem volume by Huber, Smalian and Newton; volume equations
   (Schumacher–Hall, Spurr and their logarithmic forms) fitted by nonlinear
   least squares and compared by Furnival's index; taper (Kozak 1969 and the
   segmented Max–Burkhart model) with merchantable volume and assortments;
   height–diameter curves (Näslund, Chapman–Richards, Weibull) to fill missing
   heights.
3. **Inventory and sampling** — circular, square, rectangular or nested
   plots; simple random, stratified (Cochran, with Satterthwaite's degrees of
   freedom), systematic and cluster estimators with confidence intervals and
   sampling error; sample size; point sampling with a relascope; stand and
   stock tables; the Weibull distribution of diameters; importance value
   index, Reineke's stand density index, Hart–Becking spacing and Hegyi's
   competition index.
4. **Biomass and carbon** — an editable catalogue of 31 allometric equations
   (Chave 2014 and 2005, Brown 1997, Jenkins 2003, coffee, banana and
   shade-tree equations, Mexican pines); wood density from the Global Wood
   Density Database with species → genus → plot fallback; root-to-shoot
   ratios; carbon fraction and CO₂e; Monte Carlo propagation of allometric,
   density and sampling error; deadwood by line intersect, litter and soil
   organic carbon; carbon pools with their combined error and the change
   between two inventories.
5. **Growth and yield** — current and mean annual increment and the
   biological rotation; Chapman–Richards, Gompertz, Schumacher and logistic
   models; anamorphic and polymorphic site index curves and classes; Clutter's
   whole-stand growth and yield system with projection and an editable yield
   table.
6. **Diversity and ecology** — Shannon, Simpson, Pielou, Fisher's α, Chao1
   and ACE, sample coverage, Hill numbers, rarefaction and species
   accumulation; Jaccard, Sørensen and Bray–Curtis, UPGMA and NMDS; Pretzsch's
   vertical species profile; Clark–Evans and Ripley's K and L with a
   simulation envelope.
7. **Agroforestry systems** — shade from the inventory of shade trees;
   canopy openness from a hemispherical photograph segmented in the browser;
   the shade–yield response; planting layouts (square, triangular,
   rectangular, alleys, live fences, boundary rows); the carbon budget of the
   system against a monoculture.
8. **Maps** — an own interactive map (plots with their true radius, trees,
   polygons; optional OpenStreetMap background, off by default); polygon area
   and perimeter; systematic and random sampling grids; GPX, KML, GeoJSON and
   CSV export and import; IDW and ordinary or simple kriging with the
   variogram and cross-validation; a static UTM map for the report.
9. **Forestry tools** — log scaling and log rules (Doyle, Scribner,
   International ¼″), sawn lumber, sawmill recovery and overrun, form factor,
   unit conversions, stacked wood, and the economics of a plantation (NPV,
   IRR, benefit–cost ratio, Faustmann's land expectation value, equivalent
   annual annuity, payback).
10. **Report and project** — a self-contained HTML report with every block
    worked, its figures, tables, interpretations and, if asked, the methods
    with their sources, that prints to PDF; all result tables in one XLSX
    workbook or as CSV files in a ZIP; the project as JSON, which replays the
    steps taken on a clean page.

## Tests and validation

- **Unit tests.** Open `tests/run.html` with a double click (or run
  `node tests/run_node.js`): 84 tests of the engines and of the English
  interface. Every line must be green.
- **Validation against R.** Every engine (`js/eng-*.js`) runs both in the
  browser and in node, so each block was compared, with the example data,
  against independent references in R 4.4.2 (BIOMASS, forestmangr, lmfor,
  minpack.lm, systemfit, vegan, MASS, iNEXT, spatstat, fitdistrplus, sf,
  gstat, units and FinCal) and against formulas written apart where no package
  exists: **8,327 comparisons, no disagreements**.

| Block | Topic | Comparisons | Disagreements |
|---|---|---:|---:|
| 2 | Tree mensuration | 287 | 0 |
| 3 | Inventory and sampling | 458 | 0 |
| 4 | Biomass and carbon | 5,015 | 0 |
| 5 | Growth and yield | 613 | 0 |
| 6 | Diversity and ecology | 1,222 | 0 |
| 7 | Agroforestry systems | 211 | 0 |
| 8 | Maps and geoprocessing | 269 | 0 |
| 9 | Forestry tools | 252 | 0 |
| | **Total** | **8,327** | **0** |

The tolerance of every comparison is stated next to it in
`tests/resultados/bN.md`; the summary is in `tests/VALIDACION.md`, and
`tests/LEEME_VALIDACION.md` explains, block by block, the differences of
convention with the reference packages and the errors of the app that the
comparison caught and that were corrected (all in Spanish). To repeat it:

```
Rscript tests/r/valida_b4.R
node tests/compare.js
node tests/run_node.js
```

## Documentation

| Document | Language | What it is |
|---|---|---|
| `manual/ForestPro_Manual_de_usuario_ES.pdf` | Spanish | User manual, 155 pages: introduction, one chapter per block, appendices (files, decision rules, glossary, common problems, licence and how to cite, the 103 references) |
| `manual/en/ForestPro User's Manual (English).pdf` | English | The same manual in English, 154 pages |
| `manual/es/`, `manual/en/` | Spanish, English | The parts of the manuals in HTML; `manual/LEEME.md` explains how they are built |
| `docs/` | Spanish | The earlier single-file manual, kept as source material; the current manual is the one in `manual/` |
| Home page of the app (Block 1) and the «Method and sources» box of every card | Spanish and English | What each block does, the methods with their sources |
| [`CHANGELOG.md`](CHANGELOG.md) | Spanish | What changed in each stage and version |
| [`PROCEDENCIA.md`](PROCEDENCIA.md) | Spanish | Item by item, what is original work and where the methods and the example data come from |

## Data and third-party material

All the numerical routines, the CSV/XLSX reader, the XLSX and ZIP writers,
the figures and the map are the author's own code, and the program requests
nothing from the internet. It implements published methods, each one cited to
its original source in the code, in the app and in the manual. What comes
from third parties is listed with its licence in
[`LICENSES-TERCEROS.md`](LICENSES-TERCEROS.md): the line icons of the shared
modules of the suite (navigator, figure studio and effects), from the Lucide
project under the ISC licence (those derived from Feather also under MIT); the
basic wood density of 42 taxa from the Global Wood Density Database (Zanne et
al. 2009, CC0); and, only if the user switches on the map background of
Block 8, the OpenStreetMap tiles of the visible area (never the user's data),
with the attribution the licence requires.

The four example sets — a **shaded coffee farm**, a **stratified cloud
forest**, a **pine plantation** and the **reference tables** — are simulated
with the author's own script and a fixed seed (`data/generar_datos.R`), except
the wood densities: the places are realistic, the plots and trees do not
exist. `data/LEEME.md` and `PROCEDENCIA.md` (in Spanish) give the details.

## How to cite

Barrera-Guzmán, L. Á. (2026). ForestPro: a browser-based platform for forest
inventory, mensuration, biomass, carbon and agroforestry (Version 1.0.0)
[Computer software]. https://github.com/luisangelbg/ForestPro

The **Home** page of the app and Block 10 give the citation ready to copy,
also as a BibTeX entry, and every report ends with it. `CITATION.cff` has the
same data for reference managers. Cite also the equations and methods you
used: every result names them.

## Contributing and support

Problems and proposals go to
https://github.com/luisangelbg/ForestPro/issues (the **Report a problem**
button of the app opens one with the block and the browser already filled
in).

## Licence

GNU General Public License, version 3 or later (`LICENSE`). Copyright (C) 2026
Luis Ángel Barrera-Guzmán.
