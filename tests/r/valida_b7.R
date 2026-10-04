# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 7 (sistemas agroforestales). Escribe tests/r/ref_b7.json.
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b7.R
suppressMessages({ library(jsonlite) })
dat <- "data"; out <- list()

# ---- 1. sombra por parcela del cafetal (parcelas de 1 000 m²) ------------------------------------
a <- read.csv(file.path(dat, "cafetal_arboles.csv")); a <- a[a$estado == "vivo", ]
sh <- do.call(rbind, lapply(split(a, a$parcela), function(t) {
  N <- nrow(t) * 10; G <- sum(pi * t$dap^2 / 40000) * 10; S <- length(unique(t$especie)); sa <- sum(pi * t$copa^2 / 4)
  data.frame(parcela = t$parcela[1], N = N, G = G, S = S, raw = 100 * sa / 1000, cover = 100 * (1 - exp(-sa / 1000)), h = mean(t$altura), ic = S * (N / 10) * (G / 10) * mean(t$altura) / 1000)
}))
out$shade <- as.list(sh)

# ---- 2. umbral de Otsu y apertura en una imagen construida aquí ----------------------------------
# una imagen de 160 × 160: cielo (niveles altos) dentro de un casquete de 40° de ángulo cenital y en una franja; dosel (niveles bajos) en el resto
set.seed(3)
w <- 160; h <- 160; R <- 80
img <- matrix(0L, h, w)
for (y in 0:(h - 1)) for (x in 0:(w - 1)) {
  rho <- sqrt((x + 0.5 - 80)^2 + (y + 0.5 - 80)^2); th <- 90 * rho / R
  sky <- th <= 40 || (x > 120 && x < 135)
  img[y + 1, x + 1] <- if (sky) round(min(255, max(0, rnorm(1, 205, 18)))) else round(min(255, max(0, rnorm(1, 60, 22))))
}
inside <- outer(0:(h - 1), 0:(w - 1), function(y, x) sqrt((x + 0.5 - 80)^2 + (y + 0.5 - 80)^2) <= R)
hist <- tabulate(img[inside] + 1, 256)
# Otsu: el umbral t (cielo > t) que maximiza la varianza entre clases
best <- -1; bt <- 0; lv <- 0:255
for (t in 0:254) { w0 <- sum(hist[1:(t + 1)]); w1 <- sum(hist[(t + 2):256]); if (w0 == 0 || w1 == 0) next
  m0 <- sum(lv[1:(t + 1)] * hist[1:(t + 1)]) / w0; m1 <- sum(lv[(t + 2):256] * hist[(t + 2):256]) / w1; v <- w0 * w1 * (m0 - m1)^2
  if (v > best) { best <- v; bt <- t } }
# apertura sin ponderar y ponderada por sen(θ)/ρ, y por anillos de 15°
xs <- outer(rep(1, h), 0:(w - 1)) + 0.5 - 80; ys <- outer(0:(h - 1), rep(1, w)) + 0.5 - 80; rho <- sqrt(xs^2 + ys^2)
th <- pi / 2 * rho / R; wt <- ifelse(rho > 1e-9, sin(th) / rho, pi / 2 / R); sky <- img > bt
gap <- sum(sky[inside]) / sum(inside); wop <- sum((wt * sky)[inside]) / sum(wt[inside])
ring <- pmin(5, floor(th / (pi / 12)))
rings <- sapply(0:5, function(k) { m <- inside & ring == k; sum(sky[m]) / sum(m) })
out$photo <- list(w = w, h = h, data = as.vector(t(img)), threshold = bt, gap = gap, weighted = wop, rings = rings)

# ---- 3. sombra y rendimiento ---------------------------------------------------------------------
p <- read.csv(file.path(dat, "cafetal_parcelas.csv"))
m1 <- lm(rend_cafe ~ sombra_pct, p); m2 <- lm(rend_cafe ~ sombra_pct + I(sombra_pct^2), p)
an <- anova(m1, m2)
b <- coef(m2); V <- vcov(m2)
opt <- -b[2] / (2 * b[3]); gr <- c(0, -1 / (2 * b[3]), b[2] / (2 * b[3]^2)); se <- sqrt(drop(t(gr) %*% V %*% gr))
nd <- data.frame(sombra_pct = c(20, 40, 60))
pr <- predict(m2, nd, interval = "confidence")
out$shadeYield <- list(lin = list(coef = unname(coef(m1)), r2 = summary(m1)$r.squared, aic = AIC(m1)),
  quad = list(coef = unname(b), se = unname(sqrt(diag(V))), r2 = summary(m2)$r.squared, aic = AIC(m2)),
  F = an$F[2], pF = an$`Pr(>F)`[2], opt = unname(opt), se = se, lo = unname(opt - qt(0.975, m2$df.residual) * se), hi = unname(opt + qt(0.975, m2$df.residual) * se),
  band = list(x = nd$sombra_pct, fit = unname(pr[, "fit"]), lwr = unname(pr[, "lwr"]), upr = unname(pr[, "upr"])))

write_json(out, "tests/r/ref_b7.json", digits = NA, auto_unbox = TRUE, pretty = FALSE)
cat("ref_b7.json escrito\n")
