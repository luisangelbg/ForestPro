# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 5 (crecimiento y rendimiento). Escribe tests/r/ref_b5.json.
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b5.R
suppressMessages({ library(jsonlite); library(minpack.lm); library(forestmangr); library(systemfit) })
dat <- "data"; out <- list()
ctl <- nls.lm.control(maxiter = 1000, ftol = 1e-15, ptol = 1e-15)
best <- function(form, data, starts, lower = NULL, upper = NULL) {
  b <- NULL
  for (st in starts) { f <- try(if (is.null(lower)) nlsLM(form, data, start = st, control = ctl) else nlsLM(form, data, start = st, lower = lower, upper = upper, control = ctl), silent = TRUE)
    if (!inherits(f, "try-error") && (is.null(b) || deviance(f) < deviance(b))) b <- f }
  b
}
tab <- function(m) { s <- summary(m)$coefficients; list(coef = unname(s[, 1]), se = unname(s[, 2]), sigma = summary(m)$sigma, aic = AIC(m), rss = deviance(m)) }

# ---- 1. incrementos: volumen = g·H·0.45 de cada árbol del análisis troncal ----------------------
at <- read.csv(file.path(dat, "pino_analisis_troncal.csv"))
at$v <- pi * at$diametro^2 / 40000 * at$altura * 0.45
inc <- lapply(split(at, at$arbol), function(t) {
  t <- t[order(t$edad), ]; ica <- c(NA, diff(t$v) / diff(t$edad)); ima <- t$v / t$edad
  b <- which.max(ima); cr <- NA
  for (i in 3:nrow(t)) { da <- ica[i - 1] - ima[i - 1]; db <- ica[i] - ima[i]; if (!is.na(da) && !is.na(db) && da > 0 && db <= 0) { cr <- t$edad[i - 1] + (t$edad[i] - t$edad[i - 1]) * da / (da - db); break } }
  list(tree = t$arbol[1], ica = ica, ima = ima, tMaxIMA = t$edad[b], maxIMA = ima[b], tCross = cr)
})
out$inc <- unname(inc)

# ---- 2. modelos de crecimiento sobre el volumen del árbol T1 ----------------------------------------
d <- at[at$arbol == "T1", c("edad", "v")]; names(d) <- c("t", "y"); ym <- max(d$y)
m_c <- best(y ~ A * (1 - exp(-k * t))^p, d, list(list(A = ym * 1.3, k = 0.05, p = 1.5), list(A = ym * 1.8, k = 0.03, p = 1.2), list(A = ym * 1.1, k = 0.1, p = 2), list(A = ym * 2.5, k = 0.02, p = 1)), lower = c(1e-6, 1e-6, 0.05), upper = c(1e6, 5, 50))
m_g <- best(y ~ A * exp(-b * exp(-k * t)), d, list(list(A = ym * 1.3, b = 3, k = 0.1), list(A = ym * 1.8, b = 2, k = 0.05), list(A = ym * 1.1, b = 5, k = 0.15)), lower = c(1e-6, 1e-6, 1e-6), upper = c(1e6, 1e3, 5))
l0 <- lm(log(y) ~ I(1 / t), d)
m_s <- best(y ~ A * exp(-b / t), d, list(list(A = exp(unname(coef(l0)[1])), b = -unname(coef(l0)[2]))))
m_l <- best(y ~ A / (1 + b * exp(-k * t)), d, list(list(A = ym * 1.2, b = 10, k = 0.15), list(A = ym * 1.6, b = 20, k = 0.1), list(A = ym * 1.05, b = 5, k = 0.25)), lower = c(1e-6, 1e-6, 1e-6), upper = c(1e6, 1e5, 5))
crit <- function(f, tmin, tmax) { T <- tmax * 4; dd <- function(t) (f(t + 1e-4) - f(t - 1e-4)) / 2e-4
  g <- seq(0.1, T, length.out = 20000); i1 <- g[which.max(dd(g))]; g2 <- seq(tmin, T, length.out = 20000); i2 <- g2[which.max(f(g2) / g2)]
  o1 <- optimize(function(t) -dd(t), c(max(0.1, i1 - T / 1000), i1 + T / 1000), tol = 1e-12); o2 <- optimize(function(t) -f(t) / t, c(max(tmin, i2 - T / 1000), min(T, i2 + T / 1000)), tol = 1e-12)
  list(tICA = o1$minimum, tIMA = o2$minimum) }
mk <- function(m, f) c(tab(m), crit(f, min(d$t), max(d$t)))
cc <- coef(m_c); cg <- coef(m_g); cs <- coef(m_s)
out$models <- list(chapman = mk(m_c, function(t) cc[1] * (1 - exp(-cc[2] * t))^cc[3]), gompertz = c(tab(m_g)), schumacher = mk(m_s, function(t) cs[1] * exp(-cs[2] / t)), logistic = c(tab(m_l)))

# ---- 3. índice de sitio con las remediciones ---------------------------------------------------------
r <- read.csv(file.path(dat, "pino_remediciones.csv")); tb <- 20
s1 <- lm(log(hdom) ~ I(1 / edad), r)
b1 <- unname(coef(s1)[2])
r$si_schum <- r$hdom * exp(b1 * (1 / tb - 1 / r$edad))
hm <- max(r$hdom)
s2 <- best(hdom ~ A * (1 - exp(-k * edad))^p, r, list(list(A = hm * 1.3, k = 0.05, p = 1.5), list(A = hm * 1.8, k = 0.03, p = 1.2), list(A = hm * 1.1, k = 0.1, p = 2), list(A = hm * 2.5, k = 0.02, p = 1)), lower = c(1e-6, 1e-6, 0.05), upper = c(1e6, 5, 50))
k2 <- coef(s2)[2]; p2 <- coef(s2)[3]
r$si_chapAna <- r$hdom * ((1 - exp(-k2 * tb)) / (1 - exp(-k2 * r$edad)))^p2
r <- r[order(r$parcela, r$edad), ]
pr <- do.call(rbind, lapply(split(r, r$parcela), function(t) data.frame(t1 = t$edad[-nrow(t)], h1 = t$hdom[-nrow(t)], t2 = t$edad[-1], h2 = t$hdom[-1])))
s3 <- best(h2 ~ A * (1 - (1 - (h1 / A)^(1 / p))^(t2 / t1))^p, pr, list(list(A = hm * 1.3, p = 1.3), list(A = hm * 1.8, p = 1.1), list(A = hm * 1.1, p = 1.6), list(A = hm * 2.5, p = 1)), lower = c(hm * 1.001, 0.05), upper = c(hm * 20, 20))
A3 <- coef(s3)[1]; p3 <- coef(s3)[2]
r$si_ada <- A3 * (1 - (1 - (r$hdom / A3)^(1 / p3))^(tb / r$edad))^p3
sip <- aggregate(cbind(si_schum, si_chapAna, si_ada) ~ parcela, r, mean)
cls <- function(si, nc) { lo <- min(si); w <- (max(si) - lo) / nc; k <- pmin(floor((si - lo) / w), nc - 1); nc - k }
out$site <- list(schum = tab(s1), chapAna = tab(s2), chapADA = tab(s3), plot = sip$parcela, si_schum = sip$si_schum, si_chapAna = sip$si_chapAna, si_ada = sip$si_ada,
  cls_ada4 = cls(sip$si_ada, 4), curve_ada_25_40 = unname(A3 * (1 - (1 - (25 / A3)^(1 / p3))^(40 / tb))^p3), npairs = nrow(pr))
# la curva guía de forestmangr (Schumacher) a la edad índice: debe ser exp(b0 + b1/tb)
gc <- try(guide_curve(r, "hdom", "edad", tb, n_class = 4, model = "Schumacher", output = "table"), silent = TRUE)
out$site$guideAtTb <- unname(exp(coef(s1)[1] + b1 / tb))

# ---- 4. sistema de Clutter con el índice de sitio polimórfico de cada parcela ----------------------
r$S <- sip$si_ada[match(r$parcela, sip$parcela)]
fc <- fit_clutter(r, "edad", "hdom", "g_ha", "v_ha", "S", "parcela", model = "full", keep_model = TRUE)
out$clutter <- list(forestmangr = list(b0 = fc$b0, b1 = fc$b1, b2 = fc$b2, b3 = fc$b3, a0 = fc$a0, a1 = fc$a1))
# el mismo sistema directo con systemfit, para los errores estándar
cp <- do.call(rbind, lapply(split(r, r$parcela), function(t) data.frame(I1 = t$edad[-nrow(t)], I2 = t$edad[-1], G1 = t$g_ha[-nrow(t)], G2 = t$g_ha[-1], V2 = t$v_ha[-1], S = t$S[-1])))
cp <- within(cp, { Y1 <- log(G2); X1 <- log(G1) * (I1 / I2); X2 <- 1 - I1 / I2; X3 <- (1 - I1 / I2) * S; Y2 <- log(V2); X4 <- 1 / I2; X5 <- S })
rm <- matrix(0, 2, 8); rm[1, 5] <- 1; rm[2, 6] <- 1
sf <- systemfit(list(V = Y2 ~ X4 + X5 + Y1, G = Y1 ~ X1 + X2 + X3), "2SLS", inst = ~X4 + X5 + X1 + X2 + X3, data = cp, restrict.matrix = rm, restrict.rhs = c(0, 1))
cf <- coef(sf); se <- sqrt(diag(vcov(sf)))
out$clutter$systemfit <- list(coef = unname(cf), se = unname(se), n = nrow(cp))
# errores estándar de una sola ecuación: 2SLS del volumen y mínimos cuadrados del área basal con las restricciones sustituidas
sv <- systemfit(list(V = Y2 ~ X4 + X5 + Y1), "2SLS", inst = ~X4 + X5 + X1 + X2 + X3, data = cp)
sg <- lm(I(Y1 - X1) ~ 0 + X2 + X3, cp)
out$clutter$single <- list(seBeta = unname(coef(summary(sv))[, 2]), seAlpha = unname(coef(summary(sg))[, 2]), sigmaV = summary(sv)$eq[[1]]$sigma, sigmaG = summary(sg)$sigma)
# proyección con S = 25, de 8 años y G = 20 m²/ha a 10, 20 y 40 años
cf <- unname(cf); pj <- sapply(c(10, 20, 40), function(t) { rr <- 1 - 8 / t; lg <- log(20) * 8 / t + cf[7] * rr + cf[8] * rr * 25; c(G = exp(lg), V = exp(cf[1] + cf[2] / t + cf[3] * 25 + cf[4] * lg)) })
out$clutter$proj <- list(t = c(10, 20, 40), G = unname(pj["G", ]), V = unname(pj["V", ]))

write_json(out, "tests/r/ref_b5.json", digits = NA, auto_unbox = TRUE, pretty = FALSE)
cat("ref_b5.json escrito\n")
