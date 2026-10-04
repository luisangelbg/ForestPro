# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 8 (mapas y geoprocesamiento). Escribe tests/r/ref_b8.json.
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b8.R
suppressMessages({ library(jsonlite); library(sf); library(gstat); library(sp) })
dat <- "data"; out <- list()

# ---- 1. UTM: las parcelas del bosque mesófilo y del cafetal (zona 14 norte, EPSG 32614) ------------
p <- read.csv(file.path(dat, "mesofilo_parcelas.csv")); cp <- read.csv(file.path(dat, "cafetal_parcelas.csv"))
ll <- rbind(data.frame(id = p$parcela, lat = p$lat, lon = p$lon), data.frame(id = cp$parcela, lat = cp$lat, lon = cp$lon))
pt <- st_as_sf(ll, coords = c("lon", "lat"), crs = 4326)
u <- st_coordinates(st_transform(pt, 32614))
back <- st_coordinates(st_transform(st_as_sf(data.frame(E = u[, 1], N = u[, 2]), coords = c("E", "N"), crs = 32614), 4326))
out$utm <- list(id = ll$id, lat = ll$lat, lon = ll$lon, E = u[, 1], N = u[, 2], latBack = back[, 2], lonBack = back[, 1])

# ---- 2. el polígono del predio: área y perímetro en UTM y en la esfera -------------------------------
pr <- read.csv(file.path(dat, "mesofilo_predio.csv"))
ring <- rbind(cbind(pr$lon, pr$lat), c(pr$lon[1], pr$lat[1]))
pg <- st_sfc(st_polygon(list(ring)), crs = 4326)
pgu <- st_transform(pg, 32614)
sf_use_s2(TRUE)
out$poly <- list(areaUTM = as.numeric(st_area(pgu)), perimUTM = as.numeric(st_length(st_cast(pgu, "MULTILINESTRING"))),
  areaSphere = as.numeric(st_area(pg)), perimSphere = as.numeric(st_length(st_cast(pg, "MULTILINESTRING"))))
# la cuadrícula de 500 m: la misma malla centrada en el rectángulo envolvente, y sf decide qué puntos caen dentro
bb <- st_bbox(pgu); cx <- (bb["xmin"] + bb["xmax"]) / 2; cy <- (bb["ymin"] + bb["ymax"]) / 2; s <- 500
R <- sqrt((bb["xmax"] - bb["xmin"])^2 + (bb["ymax"] - bb["ymin"])^2) / 2 + s; k <- ceiling(R / s) + 1
g <- expand.grid(i = -k:k, j = -k:k); g$E <- cx + g$i * s; g$N <- cy + g$j * s
gp <- st_as_sf(g, coords = c("E", "N"), crs = 32614)
ins <- lengths(st_intersects(gp, pgu)) > 0
out$grid <- list(n = sum(ins), E = unname(st_coordinates(gp[ins, ])[, 1]), N = unname(st_coordinates(gp[ins, ])[, 2]))

# ---- 3. interpolación del área basal por hectárea de las 24 parcelas -------------------------------
a <- read.csv(file.path(dat, "mesofilo_arboles.csv")); a <- a[a$estado == "vivo", ]
a$r <- ifelse(a$dap >= p$dap_corte_cm[match(a$parcela, p$parcela)], p$radio_grande_m[match(a$parcela, p$parcela)], p$radio_chico_m[match(a$parcela, p$parcela)])
Gp <- tapply(pi * a$dap^2 / 40000 * 10000 / (pi * a$r^2), a$parcela, sum)
up <- st_coordinates(st_transform(st_as_sf(p, coords = c("lon", "lat"), crs = 4326), 32614))
d <- data.frame(x = up[, 1], y = up[, 2], z = as.numeric(Gp[p$parcela]))
coordinates(d) <- ~x + y
tg <- data.frame(x = c(mean(up[, 1]), min(up[, 1]) + 800, max(up[, 1]) - 500), y = c(mean(up[, 2]), min(up[, 2]) + 600, max(up[, 2]) - 900)); coordinates(tg) <- ~x + y
i1 <- idw(z ~ 1, d, tg, idp = 2, debug.level = 0); i2 <- idw(z ~ 1, d, tg, idp = 2, nmax = 5, debug.level = 0)
cutoff <- 4000; width <- 400
ev <- variogram(z ~ 1, d, cutoff = cutoff, width = width)
fv <- fit.variogram(ev, vgm(NA, "Sph", NA, NA), fit.method = 7)
fe <- fit.variogram(ev, vgm(NA, "Exp", NA, NA), fit.method = 7)
ok <- krige(z ~ 1, d, tg, model = fv, debug.level = 0)
sk <- krige(z ~ 1, d, tg, model = fv, beta = mean(d$z), debug.level = 0)
cv <- krige.cv(z ~ 1, d, model = fv, nfold = nrow(d), verbose = FALSE)
cvi <- krige.cv(z ~ 1, d, nfold = nrow(d), verbose = FALSE, set = list(idp = 2))
out$interp <- list(x = d@coords[, 1], y = d@coords[, 2], z = d$z, tx = tg@coords[, 1], ty = tg@coords[, 2],
  idw = i1$var1.pred, idw5 = i2$var1.pred, cutoff = cutoff, width = width,
  ev = list(np = ev$np, dist = ev$dist, gamma = ev$gamma),
  sph = list(nugget = fv$psill[1], psill = fv$psill[2], range = fv$range[2], sse = attr(fv, "SSErr")),
  exp = list(nugget = fe$psill[1], psill = fe$psill[2], range = fe$range[2], sse = attr(fe, "SSErr")),
  ok = list(pred = ok$var1.pred, var = ok$var1.var), sk = list(pred = sk$var1.pred, var = sk$var1.var, mean = mean(d$z)),
  cvOK = list(rmse = sqrt(mean(cv$residual^2)), me = mean(cv$residual)), cvIDW = list(rmse = sqrt(mean(cvi$residual^2)), me = mean(cvi$residual)))

write_json(out, "tests/r/ref_b8.json", digits = NA, auto_unbox = TRUE, pretty = FALSE)
cat("ref_b8.json escrito\n")
