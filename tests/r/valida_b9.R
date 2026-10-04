# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 9 (utilidades forestales). Escribe tests/r/ref_b9.json.
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b9.R
# Las fórmulas se escriben aquí aparte de la app; las unidades se comparan con udunits2 (paquete units)
# y la evaluación económica con FinCal y con uniroot.
suppressMessages({ library(jsonlite); library(units); library(FinCal) })
out <- list()

# ---- 1. las 12 trozas del ejemplo: largo (m), punta delgada, punta gruesa, mitad (cm), corteza (mm) ----
lg <- data.frame(L = c(2.54, 2.54, 2.54, 2.54, 5.08, 5.08, 3.81, 3.81, 2.54, 2.54, 5.08, 3.81),
  d1 = c(32, 28, 24, 20, 30, 26, 35, 22, 40, 18, 34, 27), d2 = c(36, 31, 27, 22.5, 37, 32, 40, 25.5, 45, 20, 42, 30.5),
  dm = c(34, 29.5, 25.4, 21.2, 33.2, 28.8, 37.4, 23.6, 42.3, 19, 37.7, 28.6), bark = c(12, 10, 9, 8, 12, 11, 14, 8, 15, 7, 13, 10))
ga <- function(d) pi * d^2 / 40000
vols <- function(b) {
  d1 <- lg$d1 - b; d2 <- lg$d2 - b; dm <- lg$dm - b
  list(smalian = lg$L * (ga(d1) + ga(d2)) / 2, huber = lg$L * ga(dm), newton = lg$L * (ga(d1) + 4 * ga(dm) + ga(d2)) / 6,
    frustum = pi * lg$L / 3 * ((d1 / 200)^2 + (d1 / 200) * (d2 / 200) + (d2 / 200)^2))  # cono truncado con radios en m
}
out$logs <- list(over = vols(0), under = vols(2 * lg$bark / 10))
# reglas en pies tabla: punta delgada sin corteza en pulgadas, largo en pies
D <- (lg$d1 - 2 * lg$bark / 10) / 2.54; Lf <- lg$L / 0.3048
doyle <- function(D, L) ifelse(D > 4, (D - 4)^2 * L / 16, 0)
scrib <- function(D, L) pmax(0, (0.79 * D^2 - 2 * D - 4) * L / 16)
intl <- function(D, L) {           # secciones de 4 pies, ½ pulgada de ahusamiento por sección
  sapply(seq_along(D), function(i) {
    n <- floor(L[i] / 4 + 1e-9); r <- L[i] - 4 * n; s <- 0
    for (k in seq_len(n)) { d <- D[i] + (k - 1) / 2; s <- s + max(0, 0.22 * d^2 - 0.71 * d) }
    if (r > 1e-9) { d <- D[i] + n / 2; s <- s + max(0, 0.22 * d^2 - 0.71 * d) * r / 4 }
    0.905 * s })
}
out$rules <- list(D = D, L = Lf, doyle = doyle(D, Lf), scribner = scrib(D, Lf), intl = intl(D, Lf))
# las tablas publicadas de la regla Internacional ¼″ para trozas de 16 pies (redondeadas a 5 pies tabla) y Doyle
out$tables <- list(D = c(6, 8, 10, 12, 14, 16, 18, 20, 22, 24), intl16 = c(20, 40, 65, 95, 135, 180, 230, 290, 355, 425),
  doyle16 = c(4, 16, 36, 64, 100, 144, 196, 256, 324, 400))

# ---- 2. madera aserrada del ejemplo (pulgadas y pies) ----
pz <- data.frame(t = c(1, 1, 1, 1, 2, 4, 1.5), w = c(4, 6, 8, 10, 4, 4, 1.5), L = 8.25, n = c(40, 50, 25, 10, 20, 4, 30))
bfm3 <- as.numeric(set_units(set_units(1, "board_foot"), "m^3"))
bf <- pz$t * pz$w * pz$L / 12 * pz$n
m3 <- pz$t * pz$w * pz$L * pz$n * 0.0254^2 * 0.3048        # exacto: pulgada² × pie
out$lumber <- list(bf = bf, m3 = m3, totBF = sum(bf), totM3 = sum(m3), m3cm = 2.5 * 10 * 2.5 / 10000 * 12)
# ---- 3. rendimiento de aserrío ----
vlog <- sum(out$logs$over$smalian); ruleBF <- sum(out$rules$intl)
bfx <- 0.0254^3 * 144   # el pie tabla exacto
out$sawmill <- list(vlog = vlog, ruleBF = ruleBF, coef = sum(m3) / vlog, bfPerM3 = sum(m3) / bfx / vlog, overrun = sum(m3) / bfx / ruleBF - 1)
# ---- 4. factor de forma ----
out$form <- list(f = 0.85 / (ga(32) * 24), V = 0.47 * ga(32) * 24)

# ---- 5. unidades: udunits2 (usa el acre y la cadena del levantamiento de EE. UU.; la app, las internacionales) ----
cv <- function(from, to) as.numeric(set_units(set_units(1, from, mode = "standard"), to, mode = "standard"))
out$units <- list(
  list(k = "length", from = "in", to = "m", v = cv("in", "m"), tol = 1e-12), list(k = "length", from = "ft", to = "m", v = cv("ft", "m"), tol = 1e-12),
  list(k = "length", from = "yd", to = "m", v = cv("yd", "m"), tol = 1e-12), list(k = "length", from = "mi", to = "m", v = cv("mi", "m"), tol = 1e-12),
  list(k = "length", from = "ch", to = "m", v = cv("chain", "m"), tol = 3e-6),
  list(k = "area", from = "ac", to = "m2", v = cv("acre", "m^2"), tol = 5e-6), list(k = "area", from = "ft2", to = "m2", v = cv("ft^2", "m^2"), tol = 1e-12),
  list(k = "area", from = "ha", to = "ac", v = cv("ha", "acre"), tol = 5e-6),
  list(k = "volume", from = "ft3", to = "m3", v = cv("ft^3", "m^3"), tol = 1e-12), list(k = "volume", from = "bf", to = "m3", v = cv("board_foot", "m^3"), tol = 5e-7),
  list(k = "volume", from = "m3", to = "bf", v = cv("m^3", "board_foot"), tol = 5e-7), list(k = "volume", from = "cord", to = "m3", v = 128 * cv("ft^3", "m^3"), tol = 1e-12),
  list(k = "mass", from = "lb", to = "kg", v = cv("lb", "kg"), tol = 1e-12), list(k = "mass", from = "sht", to = "kg", v = cv("short_ton", "kg"), tol = 1e-12),
  list(k = "mass", from = "lgt", to = "kg", v = cv("long_ton", "kg"), tol = 1e-12),
  list(k = "basal", from = "ft2ac", to = "m2ha", v = cv("ft^2/acre", "m^2/ha"), tol = 5e-6), list(k = "basal", from = "m2ha", to = "ft2ac", v = cv("m^2/ha", "ft^2/acre"), tol = 5e-6),
  list(k = "volha", from = "ft3ac", to = "m3ha", v = cv("ft^3/acre", "m^3/ha"), tol = 5e-6), list(k = "volha", from = "bfac", to = "m3ha", v = cv("board_foot/acre", "m^3/ha"), tol = 5e-6),
  list(k = "stock", from = "tac", to = "Mgha", v = cv("short_ton/acre", "Mg/ha"), tol = 5e-6), list(k = "stock", from = "lbac", to = "Mgha", v = cv("lb/acre", "Mg/ha"), tol = 5e-6),
  list(k = "stock", from = "kgm2", to = "Mgha", v = cv("kg/m^2", "Mg/ha"), tol = 1e-12),
  list(k = "density", from = "lbft3", to = "kgm3", v = cv("lb/ft^3", "kg/m^3"), tol = 1e-10), list(k = "density", from = "gcm3", to = "kgm3", v = cv("g/cm^3", "kg/m^3"), tol = 1e-12),
  list(k = "trees", from = "ac", to = "ha", v = cv("1/acre", "1/ha"), tol = 5e-6), list(k = "carbon", from = "Cha", to = "CO2ha", v = 44 / 12, tol = 1e-12))

# ---- 6. la plantación de pino del ejemplo ----
fl <- data.frame(t = c(0, 0, 0, 1, 2, 3, 5, 8, 12, 18, 25), cost = c(7500, 6600, 4000, 4500, 3500, 3000, 2800, 5500, 7000, 9000, 65000),
  income = c(0, 0, 0, 0, 0, 0, 0, 0, 16800, 40500, 300000))
Tt <- 25; ann <- 900; r <- 0.08
cost <- income <- numeric(Tt + 1)
for (i in seq_len(nrow(fl))) { cost[fl$t[i] + 1] <- cost[fl$t[i] + 1] + fl$cost[i]; income[fl$t[i] + 1] <- income[fl$t[i] + 1] + fl$income[i] }
cost[2:(Tt + 1)] <- cost[2:(Tt + 1)] + ann
cf <- income - cost
df <- (1 + r)^-(0:Tt)
npvv <- FinCal::npv(r, cf)
irr_fine <- uniroot(function(x) sum(cf / (1 + x)^(0:Tt)), c(0.01, 0.5), tol = 1e-14)$root
cum <- cumsum(cf * df)
out$econ <- list(r = r, npv = npvv, npvHand = sum(cf * df), pvC = sum(cost * df), pvI = sum(income * df), bc = sum(income * df) / sum(cost * df),
  irr = irr_fine, irrFinCal = FinCal::irr(cf), lev = npvv * (1 + r)^Tt / ((1 + r)^Tt - 1), eaa = npvv * r / (1 - (1 + r)^-Tt),
  payback = which(cum >= 0 & (0:Tt) > 0)[1] - 1, cum = cum, costTotal = sum(cost), establishment = sum(cost[1:2]),
  curve = list(r = c(0, 0.02, 0.05, 0.1, 0.15), npv = sapply(c(0, 0.02, 0.05, 0.1, 0.15), function(x) FinCal::npv(x, cf))))

write_json(out, "tests/r/ref_b9.json", digits = NA, auto_unbox = TRUE, pretty = FALSE)
cat("ref_b9.json escrito\n")
