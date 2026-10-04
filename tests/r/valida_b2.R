# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 2 (dasometría): referencias independientes calculadas en R.
# Escribe tests/r/ref_b2.json; tests/compare.js corre el motor de la app con los mismos datos y compara.
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b2.R
suppressMessages({ library(jsonlite); library(minpack.lm); library(forestmangr); library(lmfor) })
dat <- "data"
out <- list()

# ---- 1. fórmulas de trozas: un caso escrito a mano ---------------------------------
g <- function(d) pi * d^2 / 40000
out$logs <- list(d1 = 34, dm = 30.5, d2 = 27, L = 2.5,
  huber = g(30.5) * 2.5, smalian = (g(34) + g(27)) / 2 * 2.5, newton = (g(34) + 4 * g(30.5) + g(27)) / 6 * 2.5)

# ---- 2. volumen por secciones: Smalian entre secciones + cono en la punta ----------
s <- read.csv(file.path(dat, "pino_secciones.csv"))
s <- s[order(s$arbol, s$h), ]
# referencia A: suma propia; referencia B: smalianwb de forestmangr para las trozas entre secciones
vt <- do.call(rbind, lapply(split(s, s$arbol), function(t) {
  n <- nrow(t); vs <- sum((g(t$d[-n]) + g(t$d[-1])) / 2 * diff(t$h))
  vtop <- g(t$d[n]) * (t$altura_total[1] - t$h[n]) / 3
  data.frame(arbol = t$arbol[1], dap = t$dap[1], H = t$altura_total[1], vSections = vs, vTop = vtop,
    vStump = g(t$d[1]) * t$h[1], vStem = vs + vtop)
}))
fm <- smalianwb(s, di = "d", hi = "h", tree = "arbol")
fmv <- tapply(fm$VWB, fm$arbol, sum, na.rm = TRUE)
out$sections <- list(tree = vt$arbol, vSections = vt$vSections, vTop = vt$vTop, vStump = vt$vStump, vStem = vt$vStem,
  vSections_forestmangr = as.numeric(fmv[vt$arbol]))

# ---- 3. ecuaciones de volumen --------------------------------------------------------
v <- data.frame(d = vt$dap, h = vt$H, v = vt$vStem)
m_log <- lm(log(v) ~ log(d) + log(h), v)
st <- list(b0 = exp(coef(m_log)[1]), b1 = coef(m_log)[2], b2 = coef(m_log)[3])
m_sh <- nlsLM(v ~ b0 * d^b1 * h^b2, data = v, start = st, control = nls.lm.control(maxiter = 500, ftol = 1e-15, ptol = 1e-15))
m_sp <- lm(v ~ I(d^2 * h), v)
m_spl <- lm(log(v) ~ log(d^2 * h), v)
tab <- function(m) { s <- summary(m)$coefficients; list(coef = unname(s[, 1]), se = unname(s[, 2]), sigma = summary(m)$sigma, aic = AIC(m)) }
geo <- exp(mean(log(v$v)))
out$vol <- list(
  schumacher = c(tab(m_sh), furnival = summary(m_sh)$sigma),
  schumacherLog = c(tab(m_log), furnival = summary(m_log)$sigma * geo, meyer = exp(summary(m_log)$sigma^2 / 2)),
  spurr = c(tab(m_sp), furnival = summary(m_sp)$sigma),
  spurrLog = c(tab(m_spl), furnival = summary(m_spl)$sigma * geo))
# la misma tabla de nls_table (forestmangr) como segunda referencia de Schumacher–Hall
nt <- nls_table(v, v ~ b0 * d^b1 * h^b2, mod_start = c(b0 = unname(st$b0), b1 = unname(st$b1), b2 = unname(st$b2)), algorithm = "LM")
cfm <- unname(unlist(nt[1, c("b0", "b1", "b2")]))
out$vol$schumacher$coef_forestmangr <- cfm
out$vol$schumacher$rss_forestmangr <- sum((v$v - cfm[1] * v$d^cfm[2] * v$h^cfm[3])^2)
out$vol$schumacher$rss <- deviance(m_sh)

# ---- 4. ahusamiento --------------------------------------------------------------------
tp <- data.frame(z = s$h / s$altura_total, y = (s$d / s$dap)^2)
m_k <- lm(y ~ 0 + I(z - 1) + I(z^2 - 1), tp)
mbf <- y ~ b1 * (z - 1) + b2 * (z^2 - 1) + b3 * (a1 - z)^2 * (z <= a1) + b4 * (a2 - z)^2 * (z <= a2)
best <- NULL
for (st in list(c(-3, 1.4, -1.5, 40, 0.75, 0.1), c(-3.5, 1.7, -2, 60, 0.7, 0.08), c(-2.6, 1.2, -1, 20, 0.8, 0.12), c(-4, 2, -3, 100, 0.65, 0.06))) {
  f <- try(nlsLM(mbf, tp, start = list(b1 = st[1], b2 = st[2], b3 = st[3], b4 = st[4], a1 = st[5], a2 = st[6]),
    lower = c(-50, -50, -500, -5000, 0.2, 0.01), upper = c(50, 50, 500, 5000, 0.98, 0.4), control = nls.lm.control(maxiter = 1000, ftol = 1e-15, ptol = 1e-15)), silent = TRUE)
  if (!inherits(f, "try-error") && (is.null(best) || deviance(f) < deviance(best))) best <- f
}
out$taper <- list(kozak69 = tab(m_k), maxBurkhart = c(tab(best), rss = deviance(best)))

# ---- 5. altura–diámetro ----------------------------------------------------------------
a <- read.csv(file.path(dat, "pino_arboles.csv")); a <- a[!is.na(a$altura) & a$altura > 1.3, ]
hd <- data.frame(d = a$dap, h = a$altura)
lin <- lm(I(d / sqrt(h - 1.3)) ~ d, hd)
m_n <- nlsLM(h ~ 1.3 + d^2 / (a + b * d)^2, hd, start = list(a = unname(coef(lin)[1]), b = unname(coef(lin)[2])))
fitbest <- function(form, starts) { b <- NULL; for (st in starts) { f <- try(nlsLM(form, hd, start = st, control = nls.lm.control(maxiter = 1000, ftol = 1e-15, ptol = 1e-15)), silent = TRUE); if (!inherits(f, "try-error") && (is.null(b) || deviance(f) < deviance(b))) b <- f }; b }
hm <- max(hd$h)
m_c <- fitbest(h ~ 1.3 + a * (1 - exp(-b * d))^c, list(list(a = hm * 1.1, b = 0.04, c = 1.2), list(a = hm * 1.4, b = 0.02, c = 1), list(a = hm, b = 0.08, c = 1.5)))
m_w <- fitbest(h ~ 1.3 + a * (1 - exp(-b * d^c)), list(list(a = hm * 1.1, b = 0.01, c = 1.2), list(a = hm * 1.3, b = 0.03, c = 1), list(a = hm, b = 0.005, c = 1.5)))
out$hd <- list(naslund = c(tab(m_n), bic = BIC(m_n)), chapman = c(tab(m_c), bic = BIC(m_c)), weibull = c(tab(m_w), bic = BIC(m_w)))
# segunda referencia: las funciones de curva de lmfor (HDnaslund, HDrichards, HDweibull) dentro del ajuste,
# para comprobar que la parametrización de la app es la misma
out$hd$naslund$coef_lmfor <- unname(coef(nlsLM(h ~ HDnaslund(d, a, b), hd, start = setNames(as.list(unname(coef(m_n))), c("a", "b")))))
out$hd$chapman$coef_lmfor <- unname(coef(nlsLM(h ~ HDrichards(d, a, b, c), hd, start = setNames(as.list(unname(coef(m_c))), c("a", "b", "c")))))
out$hd$weibull$coef_lmfor <- unname(coef(nlsLM(h ~ HDweibull(d, a, b, c), hd, start = setNames(as.list(unname(coef(m_w))), c("a", "b", "c")))))

write_json(out, "tests/r/ref_b2.json", digits = NA, auto_unbox = TRUE, pretty = TRUE)
cat("ref_b2.json escrito\n")
