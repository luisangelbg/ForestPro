# ForestPro

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

**Forest inventory, mensuration, biomass, carbon and agroforestry — in the browser, without writing code.**
Volume and taper equations, height–diameter curves, sampling designs and their sampling error, stand tables,
diameter distributions, allometric biomass with wood density and its uncertainty, carbon pools and their change,
growth and site index, diversity and spatial pattern, shade and planting layouts in agroforestry systems, maps with
sampling grids and interpolation, log rules and the economics of a plantation.

A web platform (HTML + CSS + JavaScript, no installation, no third-party libraries, no build step) for the work a
forest inventory, a carbon estimate, a management plan or a thesis has to hand in: what the stand holds, with what
precision, how much biomass and carbon it stores, how fast it grows, how diverse it is, where things are on the map,
and what a plantation is worth. Every computation runs in the browser: the data never leave the computer.

The interface, the figures and the report are available in Spanish (by default) and English, with a light or dark
theme, keyboard navigation and reduced motion when the system asks for it.

## How to open it

1. Double-click **`index.html`**. It opens in the default browser on the home page. Everything is computed in the
   browser, so it works from the local copy, without a server and without an internet connection.
2. If your computer blocks pages opened as local files, double-click **`Open ForestPro.bat`** (or run `server.ps1`
   with PowerShell): it starts a small server on your own computer and opens `http://localhost:9480`.
3. Online, with no installation: <https://luisangelbg.github.io/ForestPro/> (the same files; the data still never
   leave your browser).
4. The unit tests open the same way: **`tests/run.html`**; all of them should come out green.

## The ten blocks

| Block | Content |
|---|---|
| 1 | Home: what the app does and what it does not do, the workflow, the four example data sets with a button for each block they serve, how to cite |
| 2 | Tree mensuration: DBH from girth, basal area, slenderness; log and stem volume by Huber, Smalian and Newton from sections; volume equations (Schumacher–Hall, Spurr, their logarithmic forms) fitted by nonlinear least squares and compared by Furnival's index; taper (Kozak 1969 and the segmented Max–Burkhart model) with merchantable volume and assortments; height–diameter curves (Näslund, Chapman–Richards, Weibull) to fill missing heights |
| 3 | Inventory and sampling: trees and plots (circular, square, rectangular or nested), expansion to the hectare, simple random, stratified (Cochran with Satterthwaite's degrees of freedom), systematic (successive differences) and cluster (ratio) estimators with confidence intervals and sampling error, sample size, point sampling with a relascope, stand and stock tables, the Weibull distribution of diameters (2 and 3 parameters by maximum likelihood), importance value index, Reineke's stand density index, Hart–Becking spacing and Hegyi's competition index |
| 4 | Biomass and carbon: an editable catalogue of 31 allometric equations (Chave 2014 and 2005, Brown 1997, Jenkins 2003, coffee, banana and shade-tree equations, Mexican pines) with species rules and your own equations; wood density from the Global Wood Density Database with species → genus → plot fallback; root-to-shoot ratios (IPCC 2006, Cairns 1997); carbon fraction and CO₂e; Monte Carlo propagation of allometric, density and sampling error; deadwood by line intersect, litter and soil organic carbon (it also reads the layer tables of SoilPro, the soil app of the suite); carbon pools with their combined error and the change between two inventories |
| 5 | Growth and yield: current and mean annual increment and the biological rotation; Chapman–Richards, Gompertz, Schumacher and logistic models; anamorphic and polymorphic (algebraic difference) site index curves and classes; Clutter's whole-stand growth and yield system fitted by two-stage least squares, with projection and an editable yield table |
| 6 | Diversity and ecology: Shannon, Simpson, Pielou, Fisher's α, Chao1 and ACE, sample coverage, Hill numbers with their asymptotic estimates, rarefaction and species accumulation; Jaccard, Sørensen and Bray–Curtis, UPGMA dendrograms and NMDS (started from classical scaling, which is not shown), with export of the matrix to the suite's clustering and factor-analysis apps; Pretzsch's vertical species profile; Clark–Evans with edge correction and Ripley's K and L with a simulation envelope |
| 7 | Agroforestry systems: shade from the inventory of shade trees (crown cover with random overlap, density, basal area, Holdridge's complexity index); canopy openness from a hemispherical photograph segmented in the browser (Otsu's threshold, gap fraction and solid-angle weighting); the shade–yield response with the shade of maximum yield and its interval; planting layouts (square, triangular, rectangular, alleys, live fences, boundary rows) drawn as SVG; the carbon budget of the system against a monoculture |
| 8 | Maps: an own interactive map (plots with their true radius, trees, polygons; optional OpenStreetMap background, off by default); polygon area and perimeter in UTM and on the sphere; systematic and random sampling grids; GPX, KML, GeoJSON and CSV export and import; IDW and ordinary or simple kriging with the experimental variogram, a weighted least-squares fit and leave-one-out cross-validation; a static UTM map for the report |
| 9 | Forestry tools: log scaling (Smalian, Huber, Newton, frustum; Doyle, Scribner and International ¼″ log rules), sawn lumber in board feet and m³, sawmill recovery and overrun, form factor, unit conversions with exact definitions, stacked wood, and the economics of a plantation (NPV, IRR, benefit–cost ratio, Faustmann's land expectation value, equivalent annual annuity, payback) |
| 10 | Report and project: a self-contained HTML report (cover, summary, every block worked with its figures as inline SVG, tables, interpretations and, if asked, methods with their sources) that prints to PDF; all result tables in one XLSX workbook or as CSV files in a ZIP; the project as JSON, which records the steps taken and replays them on a clean page |

## Validation

Every engine (`js/eng-*.js`) runs both in the browser and in node, so each block was compared, with the example
data, against independent references in R 4.4.2: BIOMASS, forestmangr, lmfor, minpack.lm, systemfit, vegan, MASS, iNEXT,
spatstat, fitdistrplus, sf, gstat, units (udunits2) and FinCal, and formulas written apart where no package exists.

| Block | Topic | Comparisons | Disagreements |
|---|---|---:|---:|
| 2 | Tree mensuration | 287 | 0 |
| 3 | Inventory and sampling | 458 | 0 |
| 4 | Biomass and carbon | 5 015 | 0 |
| 5 | Growth and yield | 613 | 0 |
| 6 | Diversity and ecology | 1 222 | 0 |
| 7 | Agroforestry systems | 211 | 0 |
| 8 | Maps and geoprocessing | 269 | 0 |
| 9 | Forestry tools | 252 | 0 |
| | **Total** | **8 327** | **0** |

The tolerance of every comparison is stated next to it in `tests/resultados/bN.md`; the summary is in
`tests/VALIDACION.md`, and `tests/LEEME_VALIDACION.md` explains, block by block, the differences of convention with
the reference packages and the errors of the app that the comparison caught and that were corrected. To repeat it:

```
Rscript tests/r/valida_b4.R
node tests/compare.js
node tests/run_node.js
```

## Example data

Four sets, all simulated with a fixed seed except the wood densities (see `data/LEEME.md`): a **shaded coffee farm**
(25 plots of 1 000 m² in five farms under four managements, shade trees, coffee bushes, soil and yield), a
**stratified cloud forest** (24 nested plots in three strata, a mapped 50 × 50 m plot, relascope points, downed wood
and the property polygon), a **pine plantation** (30 permanent plots remeasured six times, stem analysis and felled
trees cut into sections) and the **reference tables** (basic wood density of 42 taxa from the Global Wood Density
Database, CC0, and the catalogue of allometric equations). Each one opens from the home page with one button per
block it serves.

## Figures, report and project

Every figure is an SVG drawn from CSS tokens. The **figure studio** (palette button in the top bar) restyles all of
them and exports each one as SVG, PNG at 300 dpi or more, JPG or vector PDF, in the light theme even when the app is
dark. The **✎ button** of each figure edits its titles, axes, series, legend and annotations. Every result table
downloads as CSV or XLSX; Block 10 gathers them all, writes the report and saves or opens the project.

## Privacy and network

ForestPro loads nothing from the network and sends nothing anywhere. The only exception is optional: in Block 8 the
user may switch on the OpenStreetMap background, and only then does the browser request the map tiles of the visible
area (never the user's data), with the attribution the licence requires.

## Manual

The user's manual is in `manual/`: one HTML part per chapter in `manual/es/` (Spanish), joined in
**`manual/es/manual-completo.html`** and printable to PDF from the browser, with its screenshots in `manual/img/` (the
English edition goes in `manual/en/`). One chapter per block, with the data formats, how to use every section, the
methods with their equations and sources, the interpretation and the validation. The older single-file manual in
`docs/` is kept as source material.

## Repository, online version and citation

- Source: <https://github.com/luisangelbg/ForestPro>
- Online: <https://luisangelbg.github.io/ForestPro/>

If you use ForestPro, please cite it (the app copies the citation from the **How to cite** section of its home page
and of Block 10, and every report ends with it):

> Barrera-Guzmán, L. Á. (2026). *ForestPro: a browser-based platform for forest inventory, mensuration, biomass,
> carbon and agroforestry* (Version 1.0.0) [Computer software]. https://github.com/luisangelbg/ForestPro

## Provenance

ForestPro contains no computing code by anyone else: the numerical routines, the CSV/XLSX reader, the XLSX and ZIP
writers, the figures and the map are its own. What comes from third parties (line icons of the shared LABG modules,
the wood density table, and the optional map tiles) is listed with its licence in `LICENSES-TERCEROS.md`; see also
`PROCEDENCIA.md`. The equations and constants it carries are cited to their original publications in the source,
in the app and in the manual.

## License

GNU General Public License v3.0 or later. Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
