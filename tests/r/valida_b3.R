# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 3 (inventario y muestreo). Escribe tests/r/ref_b3.json.
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b3.R
suppressMessages({ library(jsonlite); library(forestmangr); library(fitdistrplus) })
dat <- "data"; out <- list()
g <- function(d) pi * d^2 / 40000

# ---- 1. expansión a la hectárea: bosque mesófilo con parcelas anidadas --------------------
a <- read.csv(file.path(dat, "mesofilo_arboles.csv")); p <- read.csv(file.path(dat, "mesofilo_parcelas.csv"))
a$cut <- p$dap_corte_cm[match(a$parcela, p$parcela)]
a$r <- ifelse(a$dap >= a$cut, p$radio_grande_m[match(a$parcela, p$parcela)], p$radio_chico_m[match(a$parcela, p$parcela)])
a$ef <- 10000 / (pi * a$r^2)
a$v <- g(a$dap) * a$altura * 0.5
viv <- a[a$estado == "vivo", ]
# altura dominante de Assmann: los 100 árboles más gruesos por hectárea, cada uno contado ef veces
hdom <- function(t) { t <- t[order(-t$dap), ]; left <- 100; sh <- 0; sw <- 0
  for (i in seq_len(nrow(t))) { if (left <= 0) break; w <- min(t$ef[i], left); sh <- sh + w * t$altura[i]; sw <- sw + w; left <- left - w }; sh / sw }
per <- do.call(rbind, lapply(split(viv, viv$parcela), function(t) data.frame(parcela = t$parcela[1], estrato = t$estrato[1],
  N = sum(t$ef), G = sum(t$ef * g(t$dap)), V = sum(t$ef * t$v), dq = sqrt(sum(t$ef * t$dap^2) / sum(t$ef)), hdom = hdom(t))))
per <- per[order(per$parcela), ]
per$area <- p$area_estrato_ha[match(per$parcela, p$parcela)]
out$perPlot <- as.list(per[, c("parcela", "N", "G", "V", "dq", "hdom")])

# ---- 2. estimadores del área basal por hectárea --------------------------------------------
y <- per$G; n <- length(y)
out$srs <- list(mean = mean(y), se = sd(y) / sqrt(n), t = qt(0.975, n - 1), errPct = qt(0.975, n - 1) * sd(y) / sqrt(n) / mean(y) * 100)
fm <- sprs(data.frame(parcela = per$parcela, G = per$G), "G", plot_area = 1000, total_area = 1000, m3ha = TRUE, dec_places = 9)
fmv <- setNames(fm$Values, fm$Variables)
out$srs$forestmangr <- list(mean = unname(fmv["Mean (Y)"]), se = unname(fmv["Standard error of the mean (Sy)"]), abserr = unname(fmv["Absolute Error"]), errPct = unname(fmv["Relative Error (%)"]))
# estratificado de Cochran con la asignación realizada y gl de Satterthwaite
st <- split(per, per$estrato); A <- sum(sapply(st, function(s) s$area[1]))
W <- sapply(st, function(s) s$area[1] / A); nh <- sapply(st, nrow); s2 <- sapply(st, function(s) var(s$G)); mh <- sapply(st, function(s) mean(s$G))
terms <- W^2 * s2 / nh; v <- sum(terms); dfs <- v^2 / sum(terms^2 / (nh - 1))
out$strat <- list(mean = sum(W * mh), se = sqrt(v), df = dfs, errPct = qt(0.975, dfs) * sqrt(v) / sum(W * mh) * 100,
  seNeyman = sqrt(sum(W * sqrt(s2))^2 / sum(nh)), efficiency = (var(y) / n) / v)
fs <- strs(data.frame(estrato = per$estrato, G = per$G, area = per$area), "G", plot_area = 1000, strata_area = "area", strata = "estrato", m3ha = TRUE, dec_places = 9)
fsv <- fs[[2]]; fsv <- setNames(fsv$value, fsv$Variables)
out$strat$forestmangr <- list(mean = unname(fsv["Stratified Mean (Y)"]), se = unname(fsv["Standard error of the mean (Sy)"]))
# sistemático: diferencias sucesivas en el orden de las parcelas, con N = 1 000 ha / 0.1 ha
Np <- 1000 * 10000 / 1000
out$sys <- list(mean = mean(y), se = sqrt(sum(diff(y)^2) / (2 * n * (n - 1)) * (Np - n) / Np))
fsd <- ss_diffs(data.frame(parcela = per$parcela, G = per$G), "G", plot_area = 1000, total_area = 1000, m3ha = TRUE, dec_places = 9)
fsdv <- setNames(fsd$Values, fsd$Variables)
out$sys$forestmangr <- list(se = unname(fsdv["Standard error of the mean (Sy)"]))
# conglomerados: cafetal, fincas como conglomerados, estimador de razón (Cochran §9A.2)
ca <- read.csv(file.path(dat, "cafetal_arboles.csv")); cp <- read.csv(file.path(dat, "cafetal_parcelas.csv"))
ca <- ca[ca$estado == "vivo", ]
gc <- tapply(g(ca$dap) * 10, ca$parcela, sum)
cp$G <- as.numeric(gc[cp$parcela])
tot <- tapply(cp$G, cp$finca, sum); m <- tapply(cp$G, cp$finca, length); nc <- length(tot)
yr <- sum(tot) / sum(m); mb <- mean(m)
out$cluster <- list(mean = yr, se = sqrt(1 / (nc * mb^2) * sum((tot - yr * m)^2) / (nc - 1)), deff = (1 / (nc * mb^2) * sum((tot - yr * m)^2) / (nc - 1)) / (var(cp$G) / nrow(cp)))
# tamaño de muestra: iteración hasta que n no cambia
ss <- function(cv, E, N = Inf, conf = 0.95) { n <- 30; prev <- -1; for (i in 1:100) { t <- qt(1 - (1 - conf) / 2, n - 1); nx <- if (is.finite(N)) t^2 * cv^2 / (E^2 + t^2 * cv^2 / N) else t^2 * cv^2 / E^2; nx <- max(2, ceiling(nx - 1e-9)); if (nx == prev) break; prev <- n <- nx }; n }
out$sampleSize <- list(c40e10 = ss(40, 10), c40e10N200 = ss(40, 10, 200), c25e5 = ss(25, 5), c60e15c90 = ss(60, 15, conf = 0.90), c40e10N200nInf = ss(40, 10))

# ---- 3. relascopía -----------------------------------------------------------------------------
r <- read.csv(file.path(dat, "mesofilo_relascopio.csv")); BAF <- 2
rp <- do.call(rbind, lapply(split(r, r$punto), function(t) data.frame(punto = t$punto[1], G = BAF * nrow(t), N = sum(BAF / g(t$dap)), V = sum(BAF * g(t$dap) * t$altura * 0.5 / g(t$dap)))))
out$relascope <- list(G = mean(rp$G), Gse = sd(rp$G) / sqrt(nrow(rp)), N = mean(rp$N), Nse = sd(rp$N) / sqrt(nrow(rp)), V = mean(rp$V), Vse = sd(rp$V) / sqrt(nrow(rp)))

# ---- 4. Weibull, K–S, IVI, densidad, Hegyi -----------------------------------------------------
d <- viv$dap
w2 <- fitdist(d, "weibull", control = list(reltol = 1e-14))
out$weibull2 <- list(shape = unname(w2$estimate["shape"]), scale = unname(w2$estimate["scale"]), loglik = w2$loglik)
ks <- suppressWarnings(ks.test(d, "pweibull", shape = w2$estimate["shape"], scale = w2$estimate["scale"], exact = FALSE))
out$ks <- list(D = unname(ks$statistic), p = ks$p.value)
# Weibull de 3 parámetros: verosimilitud perfilada de la ubicación (independiente de la app: optimize + fitdist)
prof <- function(a0) { f <- try(fitdist(d - a0, "weibull", control = list(reltol = 1e-14)), silent = TRUE); if (inherits(f, "try-error")) -1e300 else f$loglik }
gap <- max(1e-3, 0.002 * min(d))
op <- optimize(prof, c(0, min(d) - gap), maximum = TRUE, tol = 1e-10)
w3 <- fitdist(d - op$maximum, "weibull", control = list(reltol = 1e-14))
out$weibull3 <- list(a = op$maximum, shape = unname(w3$estimate["shape"]), scale = unname(w3$estimate["scale"]), loglik = w3$loglik)
# IVI del cafetal (parcelas de 1 000 m²) con forest_structure
fsx <- as.data.frame(forest_structure(ca, "especie", "dap", "parcela", 1000))
fsx <- fsx[order(fsx$especie), ]
out$ivi <- list(sp = as.character(fsx$especie), AF = fsx$AF, AD = fsx$AD, DR = fsx$DR, ADo = fsx$ADo, RDo = fsx$RDo, RF = fsx$RF, IVI = fsx$IVI)
# densidad: Reineke y Hart–Becking de la primera parcela
p1 <- per[1, ]
out$density <- list(N = p1$N, dq = p1$dq, hdom = p1$hdom, sdi = p1$N * (p1$dq / 25)^1.605, hbSq = 100 * sqrt(10000 / p1$N) / p1$hdom, hbTri = 100 * sqrt(20000 / (p1$N * sqrt(3))) / p1$hdom)
# Hegyi en la parcela mapeada (R = 6 m)
mp <- read.csv(file.path(dat, "mesofilo_mapeada.csv"))
D <- as.matrix(dist(mp[, c("x", "y")])); Rr <- 6
heg <- sapply(seq_len(nrow(mp)), function(i) { j <- which(D[i, ] > 0 & D[i, ] <= Rr); sum((mp$dap[j] / mp$dap[i]) / D[i, j]) })
out$hegyi <- list(ci = heg, edge = as.numeric(mp$x < Rr | mp$x > 50 - Rr | mp$y < Rr | mp$y > 50 - Rr))

write_json(out, "tests/r/ref_b3.json", digits = NA, auto_unbox = TRUE, pretty = TRUE)
cat("ref_b3.json escrito\n")
