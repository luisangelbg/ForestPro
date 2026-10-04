# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Tabla de densidad básica de la madera (g/cm³) de las especies de los ejemplos, tomada de la Global Wood
# Density Database (Zanne et al. 2009, Dryad doi:10.5061/dryad.234, dedicada al dominio público con CC0 1.0)
# a través de la copia incluida en el paquete BIOMASS. Nivel: especie (media de sus registros) o género (media
# de las medias de sus especies). Las especies sin especie ni género en la base quedan fuera: la app les asigna
# la media de su parcela o del conjunto. Uso: Rscript generar_densidades.R (desde esta carpeta).
suppressMessages(library(BIOMASS))
sp <- unique(c(read.csv("cafetal_arboles.csv")$especie, read.csv("mesofilo_arboles.csv")$especie,
  read.csv("pino_arboles.csv")$especie, "Coffea arabica", "Juglans olanchana", "Pinus pseudostrobus", "Erythrina poeppigiana"))
sp <- sort(sp)
gs <- do.call(rbind, strsplit(sub(" sp[.]$", " sp", sp), " "))
wd <- suppressMessages(suppressWarnings(getWoodDensity(gs[, 1], gs[, 2], region = "World", verbose = FALSE)))
out <- data.frame(especie = sp, genero = gs[, 1], densidad = round(wd$meanWD, 4), nivel = wd$levelWD, n = wd$nInd)
out$nivel[out$nivel == "species"] <- "especie"; out$nivel[out$nivel == "genus"] <- "género"
out <- out[out$nivel %in% c("especie", "género"), ]
out$fuente <- "GWDD (Zanne et al. 2009), CC0"
write.csv(out, "densidades_madera.csv", row.names = FALSE, fileEncoding = "UTF-8")
print(out)
