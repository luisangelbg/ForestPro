# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 4 (biomasa y carbono). Escribe tests/r/ref_b4.json y, para la comparación de la búsqueda de
# densidades, una copia de la base mundial de densidad (tests/r/tmp/gwdd.csv, fuera del repositorio).
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b4.R
suppressMessages({ library(jsonlite); library(BIOMASS) })
dat <- "data"; out <- list()
dir.create("tests/r/tmp", showWarnings = FALSE)
gsplit <- function(sp) { s <- strsplit(sub(" sp[.]?$", " sp", sp), " "); list(g = sapply(s, `[`, 1), s = sapply(s, function(x) ifelse(length(x) > 1, x[2], ""))) }

# ---- 1. densidad: la tabla de la app (especie/género) + media de la parcela, contra getWoodDensity -----
for (ex in c("cafetal", "mesofilo")) {
  a <- read.csv(file.path(dat, paste0(ex, "_arboles.csv")))
  n <- gsplit(a$especie)
  w <- suppressMessages(suppressWarnings(getWoodDensity(n$g, n$s, stand = a$parcela, region = "World", verbose = FALSE)))
  out[[paste0("wd_", ex)]] <- list(meanWD = w$meanWD, levelWD = w$levelWD, sdWD = w$sdWD)
}
# la base completa, para que la app la cargue como lo haría el usuario
wd <- as.data.frame(BIOMASS::wdData)
write.csv(data.frame(family = wd$family, genus = wd$genus, species = wd$species, wd = wd$wd, region = wd$regionId), "tests/r/tmp/gwdd.csv", row.names = FALSE)
# taxones de prueba: con familia (llega al nivel de familia) y en una región
tx <- data.frame(genus = c("Quercus", "Quercus", "Inga", "Clethra", "Abarema", "Nonexistus", "Persea", "Pinus", "Cecropia", "Nonexistus"),
  species = c("germana", "rugosa", "vera", "mexicana", "jupunba", "foo", "americana", "patula", "obtusifolia", "bar"),
  family = c("Fagaceae", "Fagaceae", "Fabaceae", "Clethraceae", "Fabaceae", "Fagaceae", "Lauraceae", "Pinaceae", "Urticaceae", "Lauraceae"),
  stand = c(1, 1, 1, 1, 2, 2, 2, 2, 2, 2))
w1 <- suppressMessages(getWoodDensity(tx$genus, tx$species, family = tx$family, verbose = FALSE))
w2 <- suppressMessages(suppressWarnings(getWoodDensity(tx$genus, tx$species, region = "CentralAmericaTrop", verbose = FALSE)))
# una familia escrita distinto de la base (que no usa subfamilias): la referencia descarta la especie
w3 <- suppressMessages(getWoodDensity(c("Inga", "Quercus"), c("vera", "rugosa"), family = c("Fabaceae-mimosoideae", "Fagaceae"), verbose = FALSE))
out$wd_mismatch <- list(meanWD = w3$meanWD, levelWD = w3$levelWD)
out$wd_taxa <- list(genus = tx$genus, species = tx$species, family = tx$family, withFamily = list(meanWD = w1$meanWD, levelWD = w1$levelWD), region = list(meanWD = w2$meanWD, levelWD = w2$levelWD))

# ---- 2. ecuaciones: BIOMASS::computeAGB y el catálogo reescrito aparte -------------------------------
m <- read.csv(file.path(dat, "mesofilo_arboles.csv"))
nm <- gsplit(m$especie)
wm <- suppressMessages(suppressWarnings(getWoodDensity(nm$g, nm$s, stand = m$parcela, verbose = FALSE)))
out$computeAGB <- list(D = m$dap, H = m$altura, WD = wm$meanWD, AGB_Mg = computeAGB(m$dap, wm$meanWD, H = m$altura))
D <- c(5, 8, 12, 20, 30, 45, 60, 90, 130); H <- c(6, 8, 11, 15, 19, 24, 27, 31, 34); rho <- c(0.45, 0.52, 0.6, 0.38, 0.71, 0.5, 0.64, 0.55, 0.48); E <- 0.05
l <- log(D)
eqs <- list(
  chave14_h = 0.0673 * (rho * D^2 * H)^0.976,
  chave14_e = exp(-1.803 - 0.976 * E + 0.976 * log(rho) + 2.673 * l - 0.0299 * l^2),
  chave05_dry_h = 0.112 * (rho * D^2 * H)^0.916, chave05_moist_h = 0.0509 * rho * D^2 * H, chave05_wet_h = 0.0776 * (rho * D^2 * H)^0.940,
  chave05_dry = rho * exp(-0.667 + 1.784 * l + 0.207 * l^2 - 0.0281 * l^3), chave05_moist = rho * exp(-1.499 + 2.148 * l + 0.207 * l^2 - 0.0281 * l^3),
  chave05_wet = rho * exp(-1.239 + 1.980 * l + 0.207 * l^2 - 0.0281 * l^3),
  brown97_dry = exp(-1.996 + 2.32 * l), brown97_moist = exp(-2.134 + 2.530 * l), brown97_wet = 21.297 - 6.953 * D + 0.740 * D^2, brown97_pine = exp(-1.170 + 2.119 * l),
  segura06_shade = 10^(-0.834 + 2.223 * log10(D)), segura06_inga = 10^(-0.936 + 2.348 * log10(D)), segura06_cordia = 10^(-0.755 + 2.072 * log10(D)),
  segura06_juglans = 10^(-1.417 + 2.755 * log10(D)), vnoord02_coffee = 0.281 * D^2.06, vnoord02_musa = 0.030 * D^2.13,
  diaz07_patula = 0.0357 * D^2.6916, figueroa10_patula = 5.338 + 0.018635 * D^2 * H,
  jenkins03_aspen = exp(-2.2094 + 2.3867 * l), jenkins03_softmaple = exp(-1.9123 + 2.3651 * l), jenkins03_mixedhw = exp(-2.4800 + 2.4835 * l),
  jenkins03_hardmaple = exp(-2.0127 + 2.4342 * l), jenkins03_cedar = exp(-2.0336 + 2.2592 * l), jenkins03_douglas = exp(-2.2304 + 2.4435 * l),
  jenkins03_truefir = exp(-2.5384 + 2.4814 * l), jenkins03_pine = exp(-2.5356 + 2.4349 * l), jenkins03_spruce = exp(-2.0773 + 2.3323 * l), jenkins03_woodland = exp(-0.7152 + 1.7029 * l))
d15 <- c(2, 3, 4, 5, 6); hc <- c(1.2, 1.6, 2, 2.4, 2.8)
out$equations <- list(D = D, H = H, rho = rho, E = E, values = eqs, coffee = list(d15 = d15, h = hc, agb = 10^(-1.113 + 1.578 * log10(d15) + 0.581 * log10(hc))))
# la versión reajustada que usa BIOMASS sin altura (para dejar constancia de la diferencia con la ec. 7 publicada)
out$equations$biomassNoH <- exp(-2.023977 - 0.89563505 * E + 0.92023559 * log(rho) + 2.79495823 * l - 0.04606298 * l^2)

# ---- 3. el cafetal con las reglas del ejemplo: biomasa por parcela -----------------------------------
ca <- read.csv(file.path(dat, "cafetal_arboles.csv")); nc <- gsplit(ca$especie)
wc <- suppressMessages(suppressWarnings(getWoodDensity(nc$g, nc$s, stand = ca$parcela, verbose = FALSE)))
ca$wd <- wc$meanWD
agb <- with(ca, ifelse(nc$g == "Inga", 10^(-0.936 + 2.348 * log10(dap)), ifelse(especie == "Cordia alliodora", 10^(-0.755 + 2.072 * log10(dap)),
  ifelse(nc$g == "Musa", 0.030 * dap^2.13, 0.0673 * (wd * dap^2 * altura)^0.976))))
ca$agb <- agb
live <- ca[ca$estado == "vivo", ]
pa <- tapply(live$agb * 10 / 1000, live$parcela, sum)
# raíz: IPCC montañas tropicales (0.27) y Cairns; carbono 0.47
out$cafetal <- list(plot = names(pa), agb = as.numeric(pa), bgbIPCC = as.numeric(pa) * 0.27, bgbCairns = exp(-1.0587 + 0.8836 * log(as.numeric(pa))),
  c = (as.numeric(pa) * 1.27) * 0.47, mean = mean(pa), se = sd(pa) / sqrt(length(pa)))
# razón raíz/tallo del cuadro 4.4 según la biomasa aérea
rsTab <- function(zone, agb) switch(zone, trop_moist = ifelse(agb < 125, 0.20, 0.24), trop_dry = ifelse(agb < 20, 0.56, 0.28), temp_conif = ifelse(agb < 50, 0.40, ifelse(agb <= 150, 0.29, 0.20)), temp_broad = ifelse(agb < 75, 0.46, ifelse(agb <= 150, 0.23, 0.24)), boreal = ifelse(agb < 75, 0.39, 0.24))
ag <- c(10, 19.9, 20, 49, 50, 74, 75, 124, 125, 150, 151, 300)
out$rootShoot <- list(agb = ag, trop_moist = rsTab("trop_moist", ag), trop_dry = rsTab("trop_dry", ag), temp_conif = rsTab("temp_conif", ag), temp_broad = rsTab("temp_broad", ag), boreal = rsTab("boreal", ag))

# ---- 4. Monte Carlo independiente (mismo esquema que la app, otro generador) -------------------------
set.seed(20261004)
mm <- m[m$estado == "vivo", ]; wv <- wm[m$estado == "vivo", ]
P <- read.csv(file.path(dat, "mesofilo_parcelas.csv"))
mm$ef <- 10000 / (pi * ifelse(mm$dap >= 10, P$radio_grande_m[match(mm$parcela, P$parcela)], P$radio_chico_m[match(mm$parcela, P$parcela)])^2)
rtn <- function(n, mean, sd, lo, hi) qnorm(runif(n, pnorm(lo, mean, sd), pnorm(hi, mean, sd)), mean, sd)
sdlev <- c(species = 0.07082326, genus = 0.09413391)[wv$levelWD]
sdlev[is.na(sdlev)] <- wv$sdWD[is.na(sdlev)]
nIt <- 4000; len <- nrow(mm); five <- round(len * 5 / 100); hmax <- max(mm$altura) + 15
plots <- sort(unique(mm$parcela)); pidx <- match(mm$parcela, plots)
stand <- numeric(nIt); perPlot <- matrix(0, length(plots), nIt)
for (it in 1:nIt) {
  dsd <- 0.0062 * mm$dap + 0.0904; dsd[sample(len, five)] <- 4.64
  Ds <- rtn(len, mm$dap, dsd, 0.1, 500); Hs <- rtn(len, mm$altura, mm$altura * 0.05, 1.3, hmax); Ws <- rtn(len, wv$meanWD, sdlev, 0.08, 1.39)
  a <- 0.0673 * (Ws * Ds^2 * Hs)^0.976 * exp(rnorm(len, 0, 0.357) - 0.357^2 / 2)
  perPlot[, it] <- tapply(a * mm$ef / 1000, factor(pidx, levels = seq_along(plots)), sum)
  stand[it] <- mean(perPlot[, it])
}
out$mc <- list(mean = mean(stand), sd = sd(stand), q025 = unname(quantile(stand, 0.025)), q975 = unname(quantile(stand, 0.975)),
  plotMean = rowMeans(perPlot), plotSd = apply(perPlot, 1, sd), det = mean(tapply(computeAGB(mm$dap, wv$meanWD, H = mm$altura) * mm$ef, mm$parcela, sum)))
# contexto: el Monte Carlo de BIOMASS (sortea además los coeficientes de su posterior)
set.seed(1)
bm <- AGBmonteCarlo(D = mm$dap, WD = wv$meanWD, errWD = sdlev, H = mm$altura, errH = mm$altura * 0.05, Dpropag = "chave2004", n = 1000)
sim <- bm$AGB_simu * mm$ef
bst <- colMeans(apply(sim, 2, function(col) tapply(col, mm$parcela, sum)))
out$mcBIOMASS <- list(mean = mean(bst), sd = sd(bst))

# ---- 5. necromasa, hojarasca, suelo y cambio ---------------------------------------------------------
cw <- read.csv(file.path(dat, "mesofilo_madera_caida.csv"))
dens <- c(0.45, 0.34, 0.23)
cwt <- do.call(rbind, lapply(split(cw, cw$transecto), function(t) data.frame(tr = t$transecto[1], V = pi^2 * sum(t$diametro_cm^2) / (8 * t$longitud_m[1]), M = sum(pi^2 * t$diametro_cm^2 / (8 * t$longitud_m[1]) * dens[t$clase]))))
out$cwd <- list(V = cwt$V, M = cwt$M, mean = mean(cwt$M), se = sd(cwt$M) / sqrt(nrow(cwt)))
cp <- read.csv(file.path(dat, "cafetal_parcelas.csv"))
lit <- cp$hojarasca_g / cp$marco_m2 * 0.01
out$litter <- list(v = lit, mean = mean(lit), se = sd(lit) / sqrt(length(lit)))
so <- read.csv(file.path(dat, "cafetal_suelo.csv"))
so$c <- so$co_pct * so$dap_g_cm3 * (so$prof_inf - so$prof_sup) * (1 - so$pedregosidad_pct / 100)
sp <- tapply(so$c, so$parcela, sum)
out$soil <- list(plot = names(sp), c = as.numeric(sp), mean = mean(sp), se = sd(sp) / sqrt(length(sp)))
pc <- read.csv(file.path(dat, "pino_carbono_remedicion.csv"))
tp <- t.test(pc$c2, pc$c1, paired = TRUE); tw <- t.test(pc$c2, pc$c1, paired = FALSE)
yrs <- mean(pc$edad2 - pc$edad1)
out$change <- list(paired = list(mean = unname(tp$estimate), lo = tp$conf.int[1], hi = tp$conf.int[2], p = tp$p.value, df = unname(tp$parameter), rate = unname(tp$estimate) / yrs),
  welch = list(mean = unname(diff(rev(tw$estimate))), lo = tw$conf.int[1], hi = tw$conf.int[2], p = tw$p.value, df = unname(tw$parameter)))

write_json(out, "tests/r/ref_b4.json", digits = NA, auto_unbox = TRUE, pretty = FALSE)
cat("ref_b4.json escrito\n")
