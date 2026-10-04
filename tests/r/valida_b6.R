# ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Validación del Bloque 6 (diversidad y ecología). Escribe tests/r/ref_b6.json.
# Uso (desde la raíz de ForestPro):  Rscript tests/r/valida_b6.R
suppressMessages({ library(jsonlite); library(vegan); library(iNEXT); library(MASS); library(spatstat.explore); library(spatstat.geom) })
dat <- "data"; out <- list()

# ---- comunidad: individuos vivos de cada especie en cada parcela del bosque mesófilo -------------
a <- read.csv(file.path(dat, "mesofilo_arboles.csv")); a <- a[a$estado == "vivo", ]
M <- as.matrix(as.data.frame.matrix(table(a$parcela, a$especie))); M <- M[order(rownames(M)), order(colnames(M))]
out$sites <- rownames(M); out$species <- colnames(M)
out$indices <- list(S = unname(specnumber(M)), N = unname(rowSums(M)), H = unname(diversity(M, "shannon")), simpson = unname(1 - diversity(M, "simpson")),
  gini = unname(diversity(M, "simpson")), inv = unname(diversity(M, "invsimpson")), fisher = unname(fisher.alpha(M)),
  chao1 = unname(estimateR(M)["S.chao1", ]), ace = unname(estimateR(M)["S.ACE", ]))
out$indices$pielou <- out$indices$H / log(out$indices$S)
# fisher.alpha resuelve S = α ln(1 + N/α) con la tolerancia por omisión de uniroot; aquí, la misma ecuación con tolerancia estricta
out$indices$fisherExact <- sapply(seq_len(nrow(M)), function(i) { S <- sum(M[i, ] > 0); N <- sum(M[i, ]); uniroot(function(al) al * log(1 + N / al) - S, c(1e-8, 1e7), tol = 1e-14)$root })
# estimadores asintóticos y cobertura (iNEXT) del sitio 1 y de todo el bosque
asy <- function(x) { x <- x[x > 0]; list(q0 = ChaoRichness(x)[1, "Estimator"], q1 = ChaoShannon(x)[1, "Estimator"], q2 = ChaoSimpson(x)[1, "Estimator"], obs1 = ChaoShannon(x)[1, "Observed"]) }
tot <- colSums(M)
out$asy <- list(site1 = asy(M[1, ]), pooled = asy(tot))
inf <- iNEXT(list(pooled = as.numeric(tot[tot > 0])), q = 0, datatype = "abundance", size = c(50, 200, sum(tot), 2500, 3000), se = FALSE)
out$rarefy <- list(m = inf$iNextEst$size_based$m, S = inf$iNextEst$size_based$qD, coverage = inf$DataInfo$SC)
# acumulación por parcelas (exacta, condicionada)
sa <- specaccum(M > 0, "exact")
out$accum <- list(S = sa$richness, sd = sa$sd)

# ---- similitud, UPGMA y ordenación --------------------------------------------------------------
dj <- vegdist(M, "jaccard", binary = TRUE); ds <- vegdist(M, "bray", binary = TRUE); db <- vegdist(M, "bray")
out$dist <- list(jaccard = as.numeric(dj), sorensen = as.numeric(ds), bray = as.numeric(db))
h <- hclust(db, "average")
out$upgma <- list(heights = h$height, coph = cor(cophenetic(h), db))
cm <- cmdscale(db, k = 2, eig = TRUE)
out$cmd <- list(eig = cm$eig[1:4])
iso <- isoMDS(db, k = 2, trace = FALSE, tol = 1e-8, maxit = 500)
set.seed(1); mm <- metaMDS(db, k = 2, trymax = 50, trace = 0, autotransform = FALSE)
out$nmds <- list(isoStress = iso$stress / 100, metaStress = mm$stress)

# ---- estructura vertical (Pretzsch) de todo el bosque ---------------------------------------------
hmax <- max(a$altura); z <- ifelse(a$altura > 0.8 * hmax, 1, ifelse(a$altura > 0.5 * hmax, 2, 3))
p <- table(a$especie, z) / nrow(a); p <- p[p > 0]
S <- length(unique(a$especie))
out$pretzsch <- list(A = -sum(p * log(p)), Amax = log(S * 3), Arel = -sum(p * log(p)) / log(S * 3) * 100, byZone = as.numeric(table(factor(z, 1:3))))

# ---- patrón espacial: la parcela mapeada de 50 × 50 m -------------------------------------------
mp <- read.csv(file.path(dat, "mesofilo_mapeada.csv"))
X <- ppp(mp$x, mp$y, window = owin(c(0, 50), c(0, 50)))
ce <- clarkevans(X, correction = c("none", "Donnelly"))
t1 <- clarkevans.test(X, correction = "none", alternative = "two.sided")
t2 <- clarkevans.test(X, correction = "Donnelly", alternative = "two.sided")
rs <- seq(0.5, 12, by = 0.5)
K <- Kest(X, r = c(0, rs), correction = "translate")
out$spatial <- list(R = unname(ce["naive"]), Rd = unname(ce["Donnelly"]), p = t1$p.value, pd = t2$p.value, r = rs, K = K$trans[-1], n = npoints(X))
# también el subconjunto del dosel
Xc <- X[mp$dosel == "dosel"]
out$spatial$Rcanopy <- unname(clarkevans(Xc, correction = "none"))

write_json(out, "tests/r/ref_b6.json", digits = NA, auto_unbox = TRUE, pretty = FALSE)
cat("ref_b6.json escrito\n")
