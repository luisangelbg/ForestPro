# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
#
# Genera los datos de ejemplo de ForestPro. TODOS SON SIMULADOS: no son mediciones de un sitio real.
# Los modelos y parámetros dan órdenes de magnitud realistas para enseñar cada módulo y comparar con R.
#   (a) cafetal_*      cafetal bajo sombra: 25 parcelas de 1 000 m², árboles de sombra y cafetos
#   (b) mesofilo_*     bosque mesófilo en 3 estratos, parcelas circulares anidadas y una parcela mapeada
#   (c) pino_*         plantación de pino: remediciones, análisis troncal, árboles derribados por secciones
#   (d) las densidades y ecuaciones de referencia viven en la app (js/eng-biomass.js) y se exportan desde ella
# Uso:  Rscript generar_datos.R   (desde esta carpeta; escribe los CSV aquí)

set.seed(20261004)
w <- function(d, f) write.csv(d, f, row.names = FALSE, fileEncoding = "UTF-8", na = "")
r1 <- function(x, k = 1) round(x, k)

# ------------------------------------------------------------------ (a) cafetal
fincas <- data.frame(finca = paste0("F", 1:5),
  lat = c(19.172, 19.158, 19.186, 19.149, 19.197), lon = c(-96.968, -96.952, -96.981, -96.993, -96.958),
  manejo = c("policultivo tradicional", "policultivo comercial", "rústico", "monocultivo bajo sombra", "policultivo comercial"),
  alt = c(1210, 1180, 1290, 1140, 1330))
sp_sombra <- data.frame(
  especie = c("Inga vera", "Inga jinicuil", "Cordia alliodora", "Erythrina americana", "Persea americana",
              "Citrus sinensis", "Musa sp.", "Grevillea robusta", "Trema micrantha", "Cedrela odorata"),
  familia = c("Fabaceae", "Fabaceae", "Boraginaceae", "Fabaceae", "Lauraceae", "Rutaceae", "Musaceae",
              "Proteaceae", "Cannabaceae", "Meliaceae"),
  peso = c(30, 14, 7, 7, 8, 8, 14, 3, 4, 3),
  dmed = c(24, 28, 32, 22, 26, 13, 17, 30, 18, 34), hmax = c(16, 18, 26, 14, 16, 7, 6, 24, 18, 26))
# tipo de manejo → árboles de sombra por 1 000 m², proporción de especies nativas, cobertura objetivo
nmed <- c("rústico" = 46, "policultivo tradicional" = 34, "policultivo comercial" = 24, "monocultivo bajo sombra" = 14)
parc <- list(); arb <- list(); caf <- list(); k <- 0
for (fi in 1:5) for (j in 1:5) {
  k <- k + 1
  F <- fincas[fi, ]
  lat <- F$lat + rnorm(1, 0, 0.0035); lon <- F$lon + rnorm(1, 0, 0.0035)
  n <- max(6, rpois(1, nmed[F$manejo]))
  pw <- sp_sombra$peso
  if (F$manejo == "monocultivo bajo sombra") pw <- pw * c(3, 1.5, 0.3, 1, 0.2, 0.2, 0.6, 0.6, 0.3, 0.1)
  if (F$manejo == "rústico") pw <- pw * c(0.8, 1, 2, 1, 1, 0.5, 0.4, 0.2, 2.5, 2.5)
  sp <- sample(seq_len(nrow(sp_sombra)), n, replace = TRUE, prob = pw)
  d <- pmax(5, rlnorm(n, log(sp_sombra$dmed[sp]), 0.38))
  h <- 1.3 + (sp_sombra$hmax[sp] - 1.3) * (1 - exp(-0.07 * d))^1.1 * exp(rnorm(n, 0, 0.12))
  copa <- pmax(1.2, 0.9 + 0.17 * d * exp(rnorm(n, 0, 0.18)))
  musa <- sp_sombra$especie[sp] == "Musa sp."
  copa[musa] <- r1(runif(sum(musa), 2.2, 3.4))
  ang <- runif(n, 0, 2 * pi); rad <- 17.84 * sqrt(runif(n))
  estado <- ifelse(runif(n) < 0.03, "muerto en pie", "vivo")
  arb[[k]] <- data.frame(parcela = sprintf("P%02d", k), finca = F$finca, arbol = seq_len(n),
    especie = sp_sombra$especie[sp], familia = sp_sombra$familia[sp], dap = r1(d), altura = r1(h),
    copa = r1(copa), estado = estado, x = r1(rad * cos(ang)), y = r1(rad * sin(ang)))
  # cobertura de copas con traslape aleatorio: 1 − exp(−Σ área de copa / área de la parcela)
  cob <- 100 * (1 - exp(-sum(pi * copa^2 / 4) / 1000))
  dens_cafe <- round(runif(1, 2600, 4200), -1)
  # rendimiento de café pergamino (kg/ha) con un óptimo de sombra intermedio
  rend <- 620 + 26 * cob - 0.34 * cob^2 + rnorm(1, 0, 70) + 0.04 * (dens_cafe - 3400)
  parc[[k]] <- data.frame(parcela = sprintf("P%02d", k), finca = F$finca, manejo = F$manejo,
    lat = round(lat, 5), lon = round(lon, 5), altitud = round(F$alt + rnorm(1, 0, 25)),
    area_m2 = 1000, radio_m = 17.84, sombra_pct = r1(cob + rnorm(1, 0, 4)),
    densidad_cafe = dens_cafe, rend_cafe = round(max(rend, 150)),
    hojarasca_g = round(runif(1, 380, 900)), marco_m2 = 0.25)
  nc <- 10
  d15 <- pmax(1.5, rnorm(nc, 4.6, 1.1)); hc <- pmax(0.9, 0.55 + 0.33 * d15 + rnorm(nc, 0, 0.18))
  caf[[k]] <- data.frame(parcela = sprintf("P%02d", k), cafeto = 1:nc, d15 = r1(d15), altura = r1(hc, 2))
}
cafetal_parcelas <- do.call(rbind, parc); cafetal_arboles <- do.call(rbind, arb); cafetal_cafetos <- do.call(rbind, caf)
# carbono orgánico del suelo, 0–30 cm, por parcela (formato genérico de profundidad, % y densidad aparente)
suelo <- do.call(rbind, lapply(cafetal_parcelas$parcela, function(p) data.frame(parcela = p,
  prof_sup = c(0, 10, 20), prof_inf = c(10, 20, 30),
  co_pct = r1(pmax(0.8, c(5.2, 3.9, 2.8) + rnorm(3, 0, 0.5)), 2), dap_g_cm3 = r1(c(0.72, 0.81, 0.88) + rnorm(3, 0, 0.04), 2),
  pedregosidad_pct = r1(pmax(0, rnorm(3, 6, 3))))))
w(cafetal_parcelas, "cafetal_parcelas.csv"); w(cafetal_arboles, "cafetal_arboles.csv")
w(cafetal_cafetos, "cafetal_cafetos.csv"); w(suelo, "cafetal_suelo.csv")

# ------------------------------------------------------------------ (b) bosque mesófilo
sp_mes <- data.frame(
  especie = c("Liquidambar styraciflua", "Quercus germana", "Quercus xalapensis", "Quercus sartorii", "Clethra mexicana",
    "Alnus acuminata", "Carpinus caroliniana", "Podocarpus matudae", "Magnolia schiedeana", "Ternstroemia lineata",
    "Oreopanax xalapensis", "Cyathea fulva", "Platanus mexicana", "Turpinia insignis", "Meliosma alba",
    "Styrax glabrescens", "Symplocos coccinea", "Weinmannia pinnata", "Persea schiedeana", "Ocotea psychotrioides",
    "Trema micrantha", "Heliocarpus appendiculatus", "Hedyosmum mexicanum", "Rhamnus capreifolia", "Eugenia xalapensis",
    "Myrsine coriacea", "Cinnamomum effusum", "Clusia salvinii", "Dendropanax arboreus", "Ilex discolor"),
  familia = c("Altingiaceae", "Fagaceae", "Fagaceae", "Fagaceae", "Clethraceae", "Betulaceae", "Betulaceae",
    "Podocarpaceae", "Magnoliaceae", "Pentaphylacaceae", "Araliaceae", "Cyatheaceae", "Platanaceae", "Staphyleaceae",
    "Sabiaceae", "Styracaceae", "Symplocaceae", "Cunoniaceae", "Lauraceae", "Lauraceae", "Cannabaceae", "Malvaceae",
    "Chloranthaceae", "Rhamnaceae", "Myrtaceae", "Primulaceae", "Lauraceae", "Clusiaceae", "Araliaceae", "Aquifoliaceae"),
  hmax = c(32, 30, 28, 26, 18, 24, 16, 26, 25, 14, 16, 9, 30, 18, 20, 16, 14, 20, 22, 20, 18, 20, 14, 10, 16, 12, 22, 14, 16, 12),
  # abundancia relativa en conservado, perturbado y ribereño
  wA = c(10, 9, 7, 5, 4, 2, 5, 4, 3, 4, 5, 6, 0.5, 3, 3, 2, 2, 2, 2, 3, 0.2, 0.3, 2, 1, 2, 1.5, 2, 1, 1, 1),
  wB = c(18, 4, 3, 2, 12, 9, 3, 0.5, 0.5, 2, 3, 2, 0.5, 2, 1, 2, 1, 1, 1, 1, 7, 6, 3, 2, 1, 3, 1, 0.2, 1, 0.5),
  wC = c(8, 2, 2, 1, 3, 14, 10, 1, 1, 1, 2, 5, 12, 3, 2, 1, 0.5, 0.5, 1, 1, 2, 3, 2, 1, 2, 1, 1, 0.5, 1, 0.5))
estr <- data.frame(estrato = c("Conservado", "Perturbado", "Ribereño"), area_ha = c(600, 350, 50), nparc = c(10, 8, 6),
  nmed = c(62, 48, 55), lat0 = c(19.512, 19.498, 19.506), lon0 = c(-97.041, -97.022, -97.030))
mp <- list(); ma <- list(); k <- 0
for (e in 1:3) {
  E <- estr[e, ]; wv <- sp_mes[[c("wA", "wB", "wC")[e]]]
  for (j in seq_len(E$nparc)) {
    k <- k + 1
    pid <- sprintf("M%02d", k)
    mp[[k]] <- data.frame(parcela = pid, estrato = E$estrato, area_estrato_ha = E$area_ha,
      lat = round(E$lat0 + rnorm(1, 0, 0.012), 5), lon = round(E$lon0 + rnorm(1, 0, 0.012), 5),
      altitud = round(1650 + 220 * (e == 1) - 120 * (e == 3) + rnorm(1, 0, 60)),
      radio_grande_m = 17.84, radio_chico_m = 5.64, dap_corte_cm = 10)
    # árboles grandes (DAP ≥ 10) en 1 000 m²
    n <- rpois(1, E$nmed)
    sp <- sample(nrow(sp_mes), n, replace = TRUE, prob = wv)
    d <- 10 + rexp(n, 1 / (if (e == 2) 9 else 14))
    h <- 1.3 + (sp_mes$hmax[sp] - 1.3) * (1 - exp(-0.045 * d))^1.25 * exp(rnorm(n, 0, 0.1))
    h[sp_mes$especie[sp] == "Cyathea fulva"] <- r1(runif(sum(sp_mes$especie[sp] == "Cyathea fulva"), 3, 8))
    ang <- runif(n, 0, 2 * pi); rad <- 17.84 * sqrt(runif(n))
    est <- ifelse(runif(n) < 0.06, "muerto en pie", "vivo")
    g1 <- data.frame(parcela = pid, estrato = E$estrato, subparcela = "1000 m2", especie = sp_mes$especie[sp],
      familia = sp_mes$familia[sp], dap = r1(d), altura = r1(h), estado = est, x = r1(rad * cos(ang)), y = r1(rad * sin(ang)))
    # árboles chicos (2.5 ≤ DAP < 10) en 100 m²
    n2 <- rpois(1, if (e == 2) 22 else 14)
    sp2 <- sample(nrow(sp_mes), n2, replace = TRUE, prob = wv)
    d2 <- runif(n2, 2.5, 9.9); h2 <- 1.3 + (sp_mes$hmax[sp2] * 0.5) * (1 - exp(-0.12 * d2)) * exp(rnorm(n2, 0, 0.12))
    ang <- runif(n2, 0, 2 * pi); rad <- 5.64 * sqrt(runif(n2))
    g2 <- data.frame(parcela = pid, estrato = E$estrato, subparcela = "100 m2", especie = sp_mes$especie[sp2],
      familia = sp_mes$familia[sp2], dap = r1(d2), altura = r1(h2), estado = "vivo", x = r1(rad * cos(ang)), y = r1(rad * sin(ang)))
    ma[[k]] <- rbind(g1, g2)
  }
}
mesofilo_parcelas <- do.call(rbind, mp)
mesofilo_arboles <- do.call(rbind, ma)
mesofilo_arboles$arbol <- ave(seq_len(nrow(mesofilo_arboles)), mesofilo_arboles$parcela, FUN = seq_along)
mesofilo_arboles <- mesofilo_arboles[, c("parcela", "estrato", "subparcela", "arbol", "especie", "familia", "dap", "altura", "estado", "x", "y")]
w(mesofilo_parcelas, "mesofilo_parcelas.csv"); w(mesofilo_arboles, "mesofilo_arboles.csv")
# parcela mapeada de 50 × 50 m: proceso de Thomas (agregado) para los árboles chicos y casi regular para los grandes
padres <- cbind(runif(14, 0, 50), runif(14, 0, 50))
hijos <- do.call(rbind, lapply(seq_len(14), function(i) { m <- rpois(1, 9); cbind(padres[i, 1] + rnorm(m, 0, 2.6), padres[i, 2] + rnorm(m, 0, 2.6)) }))
hijos <- hijos[hijos[, 1] >= 0 & hijos[, 1] <= 50 & hijos[, 2] >= 0 & hijos[, 2] <= 50, ]
# grandes: inhibición simple (distancia mínima de 3.5 m)
gr <- matrix(numeric(0), ncol = 2)
while (nrow(gr) < 70) { p <- runif(2, 0, 50); if (!nrow(gr) || min(sqrt((gr[, 1] - p[1])^2 + (gr[, 2] - p[2])^2)) > 3.5) gr <- rbind(gr, p) }
xy <- rbind(gr, hijos); tipo <- c(rep("dosel", nrow(gr)), rep("sotobosque", nrow(hijos)))
nn <- nrow(xy)
spm <- ifelse(tipo == "dosel", sample(nrow(sp_mes), nn, TRUE, prob = sp_mes$wA * (sp_mes$hmax > 18)), sample(nrow(sp_mes), nn, TRUE, prob = sp_mes$wA * (sp_mes$hmax <= 20)))
dm <- ifelse(tipo == "dosel", 18 + rexp(nn, 1 / 16), 5 + rexp(nn, 1 / 4))
hm <- 1.3 + (sp_mes$hmax[spm] - 1.3) * (1 - exp(-0.045 * dm))^1.25 * exp(rnorm(nn, 0, 0.1))
mapeada <- data.frame(arbol = seq_len(nn), especie = sp_mes$especie[spm], dap = r1(dm), altura = r1(hm),
  x = round(xy[, 1], 2), y = round(xy[, 2], 2), dosel = tipo)
w(mapeada, "mesofilo_mapeada.csv")
# relascopía en el bosque conservado: 15 puntos con factor de área basal 2 m²/ha. En el muestreo puntual un árbol
# entra con probabilidad proporcional a su área basal, así que los diámetros contados se sortean con peso d²
grandes <- mesofilo_arboles[mesofilo_arboles$estrato == "Conservado" & mesofilo_arboles$subparcela == "1000 m2" & mesofilo_arboles$estado == "vivo", ]
rel <- list()
for (p in 1:15) {
  m <- rpois(1, 33 / 2)
  i <- sample(nrow(grandes), m, replace = TRUE, prob = grandes$dap^2)
  rel[[p]] <- data.frame(punto = sprintf("R%02d", p), arbol = seq_len(m), especie = grandes$especie[i],
    dap = r1(grandes$dap[i] * exp(rnorm(m, 0, 0.04))), altura = r1(grandes$altura[i] * exp(rnorm(m, 0, 0.05))))
}
w(do.call(rbind, rel), "mesofilo_relascopio.csv")
# polígono del predio (vértices en sentido antihorario) alrededor de las parcelas
pol <- data.frame(vertice = 1:9,
  lat = c(19.462, 19.471, 19.503, 19.539, 19.548, 19.536, 19.519, 19.488, 19.468),
  lon = c(-97.063, -97.003, -96.992, -97.001, -97.031, -97.066, -97.071, -97.078, -97.074))
w(pol, "mesofilo_predio.csv")

# ------------------------------------------------------------------ (c) plantación de pino
# remediciones: altura dominante con un modelo de Chapman–Richards polimórfico (k varía por parcela)
A <- 38; p <- 1.32
rem <- list()
for (i in 1:30) {
  kk <- exp(rnorm(1, log(0.052), 0.22))
  e0 <- sample(5:9, 1); ed <- e0 + c(0, 4, 8, 12, 16, 20) + sample(0:1, 6, TRUE)
  hd <- A * (1 - exp(-kk * ed))^p * exp(rnorm(6, 0, 0.025))
  n0 <- round(runif(1, 1050, 1350), -1)
  surv <- exp(-0.012 * (ed - e0) - 0.00045 * (ed - e0)^2 * (hd / 20))
  nha <- round(n0 * surv, -1)
  # diámetro cuadrático por un índice de densidad de Reineke que se acerca al máximo (~ 900 árboles de 25 cm)
  dq <- pmin(25.4 * (pmin(860, 280 + 26 * ed + 12 * hd) / nha)^(1 / 1.605), 4 + 1.6 * hd)
  g <- nha * pi * dq^2 / 40000
  v <- g * hd * 0.47
  rem[[i]] <- data.frame(parcela = sprintf("R%02d", i), medicion = 1:6, edad = ed, hdom = r1(hd, 2), n_ha = nha,
    dq = r1(dq), g_ha = r1(g, 2), v_ha = r1(v))
}
pino_rem <- do.call(rbind, rem)
w(pino_rem, "pino_remediciones.csv")
# análisis troncal de 6 árboles: altura y diámetro a cada edad
at <- list()
for (i in 1:6) {
  Ai <- runif(1, 30, 36); ki <- runif(1, 0.055, 0.075); Di <- runif(1, 48, 62)
  ed <- 1:sample(30:36, 1)
  hh <- Ai * (1 - exp(-ki * ed))^1.35 * exp(rnorm(length(ed), 0, 0.012))
  dd <- Di * (1 - exp(-0.05 * ed))^1.45 * exp(rnorm(length(ed), 0, 0.015))
  hh <- cummax(hh); dd <- cummax(dd)
  at[[i]] <- data.frame(arbol = sprintf("T%d", i), edad = ed, altura = r1(hh, 2), diametro = r1(pmax(dd, 0.1)))
}
w(do.call(rbind, at), "pino_analisis_troncal.csv")
# árboles derribados: secciones con un perfil segmentado (neiloide en la base, paraboloide al centro y cono
# en la punta, en la forma de Max y Burkhart 1976, con coeficientes elegidos para este ejemplo) y ruido multiplicativo
mb <- function(z, b) b[1] * (z - 1) + b[2] * (z^2 - 1) + b[3] * (b[5] - z)^2 * (z <= b[5]) + b[4] * (b[6] - z)^2 * (z <= b[6])
sec <- list(); fel <- list()
for (i in 1:40) {
  D <- runif(1, 12, 52); H <- 1.3 + 31 * (1 - exp(-0.045 * D))^1.15 * exp(rnorm(1, 0, 0.07))
  bb <- c(-2.87 + rnorm(1, 0, 0.1), 1.30 + rnorm(1, 0, 0.06), -1.02, 38, 0.72, 0.08)
  hs <- unique(c(0.15, 0.3, 0.8, 1.3, 2, 3, seq(5, H - 0.8, by = 2.5)))
  dd <- D * sqrt(pmax(0, mb(hs / H, bb))) * exp(rnorm(length(hs), 0, 0.02))
  dd[hs == 1.3] <- D
  sec[[i]] <- data.frame(arbol = sprintf("D%02d", i), dap = r1(D), altura_total = r1(H, 2), h = hs, d = r1(dd))
  fel[[i]] <- data.frame(arbol = sprintf("D%02d", i), dap = r1(D), altura = r1(H, 2))
}
w(do.call(rbind, sec), "pino_secciones.csv")
# árboles en pie de una parcela de 500 m² para la relación altura–diámetro (un tercio sin altura medida)
n <- 85; D <- pmax(6, rnorm(n, 27, 8)); H <- 1.3 + 30 * (1 - exp(-0.05 * D))^1.3 * exp(rnorm(n, 0, 0.07))
alt <- r1(H); alt[sample(n, 28)] <- NA
w(data.frame(parcela = "R01", arbol = 1:n, especie = "Pinus patula", dap = r1(D), altura = alt), "pino_arboles.csv")
cat("Listo: datos simulados escritos en", getwd(), "\n")
