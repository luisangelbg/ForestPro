/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the figure kit.

   Every figure is an SVG string built here. The marks the suite's figure
   studio and figure editor (✎) read are written into the markup: data-plot
   (the plotting area, "left top width height") with data-xr and data-yr (the
   ranges of the axes) on the <svg>; data-role on title, axes, ticks, labels,
   grid and legend; data-li on each legend entry; data-name names the figure.
   Ink, grid and background come from CSS variables, so a figure follows the
   light and dark themes without a redraw.

   Plot.xy      points, lines, step lines, ribbons and reference lines on
                linear or logarithmic axes (equal aspect for maps of stems)
   Plot.bars    grouped or stacked bars over categories, or a histogram over
                numeric classes, with optional error bars and overlay curves
   Plot.dendro  a dendrogram from an agglomerative merge list
   Plot.heat    a matrix as colored cells (similarities)
   Plot.ramp    sequential colors (forest greens to gold) for maps and cells */
(function (g) {
'use strict';
const Plot = {};
const f = v => (Math.round(v * 100) / 100).toString();
const escx = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
Plot.esc = escx;
const TT = (es, en) => (g.T ? g.T(es, en) : es);

/* categorical colors of ForestPro: mid tones readable on paper and on the dark theme,
   ordered so that neighbors differ in hue and lightness (forest green, ochre, bark,
   sky, heather, moss, berry, teal, cedar, slate) */
Plot.CAT = ['#2E7D32', '#D08C1E', '#8D6E63', '#3A7DC9', '#9467BD', '#7CB342', '#D84B5A', '#1FA187', '#B5652B', '#6B7F99', '#C2A83E', '#5E9C8F'];
Plot.color = k => Plot.CAT[((k % Plot.CAT.length) + Plot.CAT.length) % Plot.CAT.length];
/* a sequential ramp in OKLab-ish steps: deep forest → moss → gold → pale straw */
const RAMP = [[13, 59, 30], [27, 94, 32], [85, 139, 47], [140, 166, 60], [201, 176, 72], [236, 214, 140], [248, 240, 205]];
Plot.ramp = function (t, rev) {
  t = Math.max(0, Math.min(1, isFinite(t) ? t : 0));
  if (rev) t = 1 - t;
  const x = t * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(x)), u = x - i;
  const c = RAMP[i].map((v, k) => Math.round(v + u * (RAMP[i + 1][k] - v)));
  return 'rgb(' + c.join(',') + ')';
};
/* a diverging ramp (bark brown – pale – forest green) for residual or change maps */
Plot.div = function (t) {
  t = Math.max(-1, Math.min(1, isFinite(t) ? t : 0));
  const a = [140, 81, 10], m = [245, 241, 230], b = [27, 120, 55];
  const c = t < 0 ? a.map((v, k) => Math.round(m[k] + (v - m[k]) * -t)) : b.map((v, k) => Math.round(m[k] + (v - m[k]) * t));
  return 'rgb(' + c.join(',') + ')';
};

/* ---------------- numbers on axes ---------------- */
Plot.ticks = function (lo, hi, count) {
  count = count || 5;
  if (!(hi > lo)) { hi = lo + 1; lo = lo - 1; }
  const nice = (x, round) => {
    const e = Math.floor(Math.log10(x)), fr = x / Math.pow(10, e);
    let nf;
    if (round) nf = fr < 1.5 ? 1 : fr < 3 ? 2 : fr < 7 ? 5 : 10;
    else nf = fr <= 1 ? 1 : fr <= 2 ? 2 : fr <= 5 ? 5 : 10;
    return nf * Math.pow(10, e);
  };
  const range = nice(hi - lo, false), step = nice(range / Math.max(1, count - 1), true);
  const t0 = Math.ceil(lo / step - 1e-9) * step, out = [];
  for (let v = t0; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  return { ticks: out, step };
};
/* decades and 2–5 subdivisions for logarithmic axes */
Plot.logTicks = function (lo, hi) {
  const out = [], a = Math.floor(Math.log10(lo)), b = Math.ceil(Math.log10(hi));
  const sub = b - a <= 2 ? [1, 2, 5] : [1];
  for (let e = a; e <= b; e++) sub.forEach(m => { const v = m * Math.pow(10, e); if (v >= lo * 0.999 && v <= hi * 1.001) out.push(v); });
  return { ticks: out, step: null, log: true };
};
Plot.tickLabel = function (v, step) {
  if (step == null) { const a = Math.abs(v); return a >= 1e4 || (a < 1e-3 && a > 0) ? v.toExponential(0) : String(+v.toPrecision(6)); }
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (v < 0 && +s.replace(/,/g, '') !== 0 ? '−' : '') + s;
};
Plot.scale = (d0, d1, r0, r1, log) => {
  if (log) {
    const l0 = Math.log10(d0), k = (r1 - r0) / ((Math.log10(d1) - l0) || 1);
    const s = v => r0 + (Math.log10(v) - l0) * k; s.inv = p => Math.pow(10, l0 + (p - r0) / k); return s;
  }
  const k = (r1 - r0) / ((d1 - d0) || 1); const s = v => r0 + (v - d0) * k; s.inv = p => d0 + (p - r0) / k; return s;
};
Plot.extent = function (arrs, pad, zero) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const v of a) if (v != null && isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!isFinite(lo)) return [0, 1];
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi === lo) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1; }
  const p = (hi - lo) * (pad == null ? 0.05 : pad);
  return [zero && lo === 0 ? 0 : lo - p, hi + p];
};

/* the opening of a figure with one plotting area */
Plot.open = function (W, H, o, gg, label) {
  const mark = gg ? ` data-plot="${f(gg.x0)} ${f(gg.y1)} ${f(gg.x1 - gg.x0)} ${f(gg.y0 - gg.y1)}" data-xr="${+gg.ex[0].toPrecision(10)} ${+gg.ex[1].toPrecision(10)}" data-yr="${+gg.ey[0].toPrecision(10)} ${+gg.ey[1].toPrecision(10)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="pl${o.cls ? ' ' + o.cls : ''}"${mark} data-name="${escx(o.name || 'figure')}" role="img" aria-label="${escx(label || o.title || '')}"><rect class="pl-bg" x="0" y="0" width="${W}" height="${H}"/>`;
};
Plot.path = function (x, y, sx, sy) {
  let d = '', pen = false;
  for (let i = 0; i < x.length; i++) {
    if (x[i] != null && y[i] != null && isFinite(x[i]) && isFinite(y[i])) { d += (pen ? 'L' : 'M') + f(sx(x[i])) + ' ' + f(sy(y[i])); pen = true; }
    else pen = false;
  }
  return d;
};

/* axes, grid and labels */
Plot.frame = function (o) {
  const { x0, x1, y0, y1, sx, sy, xt, yt, xlab, ylab } = o;
  let s = '';
  const xl = v => xt.labels ? xt.labels(v) : Plot.tickLabel(v, xt.step);
  const yl = v => yt.labels ? yt.labels(v) : Plot.tickLabel(v, yt.step);
  if (o.grid !== false) {
    s += `<g data-role="grid" class="pl-grid">`;
    if (o.gridX !== false) xt.ticks.forEach(v => { const X = sx(v); if (X >= x0 - 0.5 && X <= x1 + 0.5) s += `<line x1="${f(X)}" y1="${f(y0)}" x2="${f(X)}" y2="${f(y1)}"/>`; });
    yt.ticks.forEach(v => { const Y = sy(v); if (Y <= y0 + 0.5 && Y >= y1 - 0.5) s += `<line x1="${f(x0)}" y1="${f(Y)}" x2="${f(x1)}" y2="${f(Y)}"/>`; });
    s += `</g>`;
  }
  s += `<g data-role="axis" class="pl-axis"><line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y0)}"/><line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x0)}" y2="${f(y1)}"/></g>`;
  s += `<g class="pl-tick" data-role="xtick">`;
  xt.ticks.forEach(v => { const X = sx(v); if (X >= x0 - 0.5 && X <= x1 + 0.5) s += `<line x1="${f(X)}" y1="${f(y0)}" x2="${f(X)}" y2="${f(y0 + 4)}"/><text x="${f(X)}" y="${f(y0 + 15)}" text-anchor="middle">${escx(xl(v))}</text>`; });
  s += `</g><g class="pl-tick" data-role="ytick">`;
  yt.ticks.forEach(v => { const Y = sy(v); if (Y <= y0 + 0.5 && Y >= y1 - 0.5) s += `<line x1="${f(x0 - 4)}" y1="${f(Y)}" x2="${f(x0)}" y2="${f(Y)}"/><text x="${f(x0 - 7)}" y="${f(Y + 3.5)}" text-anchor="end">${escx(yl(v))}</text>`; });
  s += `</g>`;
  if (xlab) s += `<text class="pl-lab" data-role="xlab" x="${f((x0 + x1) / 2)}" y="${f(y0 + 33)}" text-anchor="middle">${escx(xlab)}</text>`;
  if (ylab) s += `<text class="pl-lab" data-role="ylab" transform="translate(${f(o.ylabX || x0 - 44)} ${f((y0 + y1) / 2)}) rotate(-90)" text-anchor="middle">${escx(ylab)}</text>`;
  return s;
};

/* a legend: entries [{label, color, kind: 'pt'|'ln'|'bar'|'band', dash}] at (x, y), stacked */
Plot.legend = function (items, x, y, o) {
  o = o || {};
  if (!items.length) return '';
  let s = `<g data-role="legend" class="pl-legend" transform="translate(${f(x)} ${f(y)})">`;
  let Y = 0;
  if (o.title) { s += `<text class="pl-legend-title" x="0" y="0">${escx(o.title)}</text>`; Y = 14; }
  items.forEach((it, k) => {
    const yy = Y + k * 17;
    let mark;
    if (it.kind === 'ln') mark = `<line data-li="${k}" x1="0" y1="${f(yy - 4)}" x2="16" y2="${f(yy - 4)}" style="stroke:${it.color};stroke-width:2.2${it.dash ? ';stroke-dasharray:' + it.dash : ''}"/>`;
    else if (it.kind === 'bar' || it.kind === 'band') mark = `<rect data-li="${k}" x="1" y="${f(yy - 9.5)}" width="13" height="11" rx="2" style="fill:${it.color}${it.kind === 'band' ? ';fill-opacity:.3' : ''}"/>`;
    else mark = `<circle data-li="${k}" cx="7" cy="${f(yy - 4)}" r="4.5" style="fill:${it.color}"/>`;
    s += mark + `<text data-li="${k}" x="21" y="${f(yy)}">${escx(it.label)}</text>`;
  });
  return s + `</g>`;
};
const legendWidth = items => items.length ? Math.min(190, 30 + 6.4 * Math.max(...items.map(i => String(i.label).length))) : 0;

/* ---------------- XY charts ----------------
   o: { series: [{ type: 'points'|'line'|'step'|'band'|'vline'|'hline'|'text', x, y, y2 (band), color, label,
        r, dash, width, opacity, sizes (points), labels (text) }],
        xlab, ylab, title, w, h, xlog, ylog, xlim, ylim, zeroY, equal (same scale on both axes),
        legend: true|false|'bottom', name, xLabels: v → text } */
Plot.xy = function (o) {
  const W = o.w || 560, H = o.h || 380;
  const S = o.series.filter(Boolean);
  const leg = o.legend === false ? [] : S.filter(s => s.label).map(s => ({ label: s.label, color: s.color || 'var(--fig-ink)', kind: s.type === 'points' ? 'pt' : s.type === 'band' ? 'band' : 'ln', dash: s.dash }));
  const legW = o.legend === 'bottom' ? 0 : legendWidth(leg);
  /* a legend under the plot: as many columns as its longest entry allows (up to 3), below the x title */
  const ml = o.ml || 62;
  const bCols = leg.length ? Math.max(1, Math.min(3, leg.length, Math.floor((W - ml - 10) / (28 + 6.3 * Math.max(...leg.map(i => String(i.label).length)))))) : 1;
  const bRows = Math.ceil(leg.length / bCols);
  const m = { l: ml, r: (legW ? legW + 18 : 18), t: o.title ? 32 : 14, b: (o.legend === 'bottom' && leg.length ? 52 + 18 * bRows : 48) };
  let x0 = m.l, x1 = W - m.r, y0 = H - m.b, y1 = m.t;
  const xs = [], ys = [];
  S.forEach(s => {
    if (s.type === 'hline') { ys.push([s.y]); return; }
    if (s.type === 'vline') { xs.push([s.x]); return; }
    if (s.type === 'segments') { s.segs.forEach(q => { xs.push([q[0], q[2]]); ys.push([q[1], q[3]]); }); return; }
    if (s.x) xs.push(s.x.filter(v => !o.xlog || v > 0));
    if (s.y) ys.push(s.y.filter(v => !o.ylog || v > 0));
    if (s.y2) ys.push(s.y2.filter(v => !o.ylog || v > 0));
  });
  let ex = o.xlim || Plot.extent(xs, o.xlog ? 0 : 0.04, o.zeroX), ey = o.ylim || Plot.extent(ys, o.ylog ? 0 : 0.06, o.zeroY);
  if (o.xlog) ex = [Math.max(ex[0], 1e-9) / 1.15, ex[1] * 1.15];
  if (o.ylog) ey = [Math.max(ey[0], 1e-9) / 1.15, ey[1] * 1.15];
  if (o.equal) {
    /* the same meters per pixel on both axes: shrink the longer side */
    const kx = (x1 - x0) / (ex[1] - ex[0]), ky = (y0 - y1) / (ey[1] - ey[0]), k = Math.min(kx, ky);
    const wx = (ex[1] - ex[0]) * k, wy = (ey[1] - ey[0]) * k;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    x0 = cx - wx / 2; x1 = cx + wx / 2; y0 = cy + wy / 2; y1 = cy - wy / 2;
  }
  const sx = Plot.scale(ex[0], ex[1], x0, x1, o.xlog), sy = Plot.scale(ey[0], ey[1], y0, y1, o.ylog);
  /* xtickVals: the exact positions of categorical ticks (1, 2, … with their names in xLabels) */
  const xt = o.xtickVals ? { ticks: o.xtickVals.slice(), step: 1 } : o.xlog ? Plot.logTicks(ex[0], ex[1]) : Plot.ticks(ex[0], ex[1], o.xticks || 6);
  const yt = o.ylog ? Plot.logTicks(ey[0], ey[1]) : Plot.ticks(ey[0], ey[1], o.yticks || 6);
  if (o.xLabels) xt.labels = o.xLabels;
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label || o.title);
  if (o.title) s += `<text class="pl-title" data-role="title" x="${f(m.l)}" y="20">${escx(o.title)}</text>`;
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt, yt, xlab: o.xlab, ylab: o.ylab, grid: o.grid, ylabX: o.ylabX });
  const clip = 'c' + Math.random().toString(36).slice(2, 8);
  s += `<defs><clipPath id="${clip}"><rect x="${f(x0)}" y="${f(y1)}" width="${f(x1 - x0)}" height="${f(y0 - y1)}"/></clipPath></defs><g clip-path="url(#${clip})">`;
  S.forEach((ser, k) => {
    const col = ser.color || 'var(--fig-ink)';
    const lw = ser.width || 2;
    const dash = ser.dash ? `;stroke-dasharray:${ser.dash}` : '';
    if (ser.type === 'band') {
      let d = '';
      for (let i = 0; i < ser.x.length; i++) if (isFinite(ser.y[i])) d += (d ? 'L' : 'M') + f(sx(ser.x[i])) + ' ' + f(sy(ser.y[i]));
      for (let i = ser.x.length - 1; i >= 0; i--) if (isFinite(ser.y2[i])) d += 'L' + f(sx(ser.x[i])) + ' ' + f(sy(ser.y2[i]));
      s += `<path class="pl-band" d="${d}Z" style="fill:${col};fill-opacity:${ser.opacity || 0.18}"/>`;
    } else if (ser.type === 'line' || ser.type === 'step') {
      let d;
      if (ser.type === 'step') {
        d = '';
        for (let i = 0; i < ser.x.length; i++) {
          if (!isFinite(ser.y[i])) continue;
          d += (d ? 'L' + f(sx(ser.x[i])) + ' ' + f(sy(ser.y[i - 1] != null && isFinite(ser.y[i - 1]) ? ser.y[i - 1] : ser.y[i])) + 'L' : 'M') + f(sx(ser.x[i])) + ' ' + f(sy(ser.y[i]));
        }
      } else d = Plot.path(ser.x, ser.y, sx, sy);
      s += `<path class="pl-line" d="${d}" style="stroke:${col};stroke-width:${lw}${dash};fill:none"/>`;
    } else if (ser.type === 'points') {
      s += `<g class="pl-pts">`;
      for (let i = 0; i < ser.x.length; i++) {
        const X = ser.x[i], Y = ser.y[i];
        if (X == null || Y == null || !isFinite(X) || !isFinite(Y) || (o.xlog && X <= 0) || (o.ylog && Y <= 0)) continue;
        const r = ser.sizes ? ser.sizes[i] : (ser.r || 3.4);
        const c = ser.colors ? ser.colors[i] : col;
        s += `<circle cx="${f(sx(X))}" cy="${f(sy(Y))}" r="${f(r)}" style="fill:${c}${ser.opacity ? ';fill-opacity:' + ser.opacity : ''}"${ser.titles ? '><title>' + escx(ser.titles[i]) + '</title></circle>' : '/>'}`;
      }
      s += `</g>`;
    } else if (ser.type === 'hline') {
      s += `<line class="pl-ref" x1="${f(x0)}" y1="${f(sy(ser.y))}" x2="${f(x1)}" y2="${f(sy(ser.y))}" style="stroke:${col};stroke-width:${ser.width || 1.3};stroke-dasharray:${ser.dash || '5 4'}"/>`;
    } else if (ser.type === 'vline') {
      s += `<line class="pl-ref" x1="${f(sx(ser.x))}" y1="${f(y0)}" x2="${f(sx(ser.x))}" y2="${f(y1)}" style="stroke:${col};stroke-width:${ser.width || 1.3};stroke-dasharray:${ser.dash || '5 4'}"/>`;
    } else if (ser.type === 'text') {
      ser.x.forEach((X, i) => { if (isFinite(X) && isFinite(ser.y[i])) s += `<text class="pl-ptlab" x="${f(sx(X) + 5)}" y="${f(sy(ser.y[i]) - 5)}">${escx(ser.labels[i])}</text>`; });
    } else if (ser.type === 'segments') {
      /* ser.segs: [[xa, ya, xb, yb]…] */
      s += `<g class="pl-segs" style="stroke:${col};stroke-width:${ser.width || 1}${dash}">`;
      ser.segs.forEach(q => { s += `<line x1="${f(sx(q[0]))}" y1="${f(sy(q[1]))}" x2="${f(sx(q[2]))}" y2="${f(sy(q[3]))}"/>`; });
      s += `</g>`;
    } else if (ser.type === 'circles') {
      /* circles with a radius in data units (crowns, plots) */
      s += `<g class="pl-circ">`;
      ser.x.forEach((X, i) => {
        const R = Math.abs(sx(X + ser.rad[i]) - sx(X));
        s += `<circle cx="${f(sx(X))}" cy="${f(sy(ser.y[i]))}" r="${f(R)}" style="fill:${ser.colors ? ser.colors[i] : col};fill-opacity:${ser.opacity || 0.25};stroke:${ser.colors ? ser.colors[i] : col};stroke-width:.8"/>`;
      });
      s += `</g>`;
    }
  });
  s += `</g>`;
  if (o.over) s += o.over({ sx, sy, x0, x1, y0, y1 });
  if (leg.length) {
    if (o.legend === 'bottom') {
      let sl = `<g data-role="legend" class="pl-legend" transform="translate(${f(m.l)} ${f(H - 18 * bRows + 6)})">`;
      const cw = (W - m.l - 10) / bCols;
      leg.forEach((it, k) => {
        const X = (k % bCols) * cw, Y = Math.floor(k / bCols) * 18;
        const mark = it.kind === 'ln' ? `<line data-li="${k}" x1="${f(X)}" y1="${f(Y - 4)}" x2="${f(X + 16)}" y2="${f(Y - 4)}" style="stroke:${it.color};stroke-width:2.2${it.dash ? ';stroke-dasharray:' + it.dash : ''}"/>` : it.kind === 'band' ? `<rect data-li="${k}" x="${f(X + 1)}" y="${f(Y - 9.5)}" width="13" height="11" style="fill:${it.color};fill-opacity:.3"/>` : `<circle data-li="${k}" cx="${f(X + 7)}" cy="${f(Y - 4)}" r="4.5" style="fill:${it.color}"/>`;
        sl += mark + `<text data-li="${k}" x="${f(X + 21)}" y="${f(Y)}">${escx(it.label)}</text>`;
      });
      s += sl + `</g>`;
    } else s += Plot.legend(leg, x1 + 16, y1 + 8, { title: o.legendTitle });
  }
  return s + '</svg>';
};

/* ---------------- bars and histograms ----------------
   o: { cats: [labels] (categorical) or edges: [e0…eK] (histogram classes),
        series: [{ label, values: [...], color, err?: [...] }], stacked, horizontal?,
        curves: [{ x, y, color, label, dash }] (numeric x, histogram only), xlab, ylab, title, w, h,
        valueLabels: true (print the value on each bar),
        solid: true (histogram of many narrow classes: bars side by side with no gap or outline, so that
        bars one or two pixels wide do not vanish behind their own border) } */
Plot.bars = function (o) {
  const W = o.w || 560, H = o.h || 360;
  const S = o.series;
  const hist = !!o.edges;
  const K = hist ? o.edges.length - 1 : o.cats.length;
  const leg = (S.length > 1 || o.legendAlways ? S.map((s, k) => ({ label: s.label, color: s.color || Plot.color(k), kind: 'bar' })) : [])
    .concat((o.curves || []).filter(c => c.label).map(c => ({ label: c.label, color: c.color || 'var(--fig-ink)', kind: 'ln', dash: c.dash })));
  const legW = legendWidth(leg);
  const longCat = !hist && Math.max(...o.cats.map(c => String(c).length)) * 6.2 + 8 > (W - 80) / K;
  const m = { l: o.ml || 62, r: legW ? legW + 18 : 16, t: o.title ? 32 : 14, b: longCat ? 86 : 48 };
  const x0 = m.l, x1 = W - m.r, y0 = H - m.b, y1 = m.t;
  let top = 0, bot = 0;
  for (let i = 0; i < K; i++) {
    if (o.stacked) {
      let p = 0, n = 0;
      S.forEach(s => { const v = s.values[i]; if (isFinite(v)) { if (v >= 0) p += v; else n += v; } });
      top = Math.max(top, p); bot = Math.min(bot, n);
    } else S.forEach(s => { const v = s.values[i] + (s.err ? s.err[i] || 0 : 0); if (isFinite(v)) top = Math.max(top, v); if (s.values[i] < 0) bot = Math.min(bot, s.values[i] - (s.err ? s.err[i] || 0 : 0)); });
  }
  (o.curves || []).forEach(c => c.y.forEach(v => { if (isFinite(v)) top = Math.max(top, v); }));
  if (o.ymax) top = Math.max(top, o.ymax);
  const ey = [bot * 1.06, top * 1.08 || 1];
  const sy = Plot.scale(ey[0], ey[1], y0, y1);
  const yt = Plot.ticks(ey[0], ey[1], 6);
  let ex, sx, xt;
  if (hist) { ex = [o.edges[0], o.edges[K]]; sx = Plot.scale(ex[0], ex[1], x0, x1); xt = Plot.ticks(ex[0], ex[1], Math.min(K + 1, 9)); if (o.edgeTicks) xt = { ticks: o.edges.slice(), step: null }; }
  else { ex = [0, K]; sx = Plot.scale(0, K, x0, x1); xt = { ticks: [], step: 1 }; }
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label || o.title);
  if (o.title) s += `<text class="pl-title" data-role="title" x="${f(m.l)}" y="20">${escx(o.title)}</text>`;
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt, yt, xlab: o.xlab, ylab: o.ylab, gridX: false });
  if (!hist) {
    s += `<g class="pl-tick" data-role="xtick">`;
    o.cats.forEach((c, i) => {
      const X = sx(i + 0.5);
      if (longCat) s += `<text x="${f(X)}" y="${f(y0 + 12)}" text-anchor="end" transform="rotate(-38 ${f(X)} ${f(y0 + 12)})">${escx(c)}</text>`;
      else s += `<text x="${f(X)}" y="${f(y0 + 15)}" text-anchor="middle">${escx(c)}</text>`;
    });
    s += `</g>`;
  }
  s += `<g class="pl-bars">`;
  const nS = S.length;
  for (let i = 0; i < K; i++) {
    const xa = hist ? sx(o.edges[i]) : sx(i), xb = hist ? sx(o.edges[i + 1]) : sx(i + 1);
    const gap = hist ? (o.solid ? 0 : 0.6) : (xb - xa) * 0.16;
    let pos = 0, neg = 0;
    S.forEach((ser, k) => {
      const v = ser.values[i];
      if (!isFinite(v)) return;
      const col = ser.color || Plot.color(k);
      let bx, bw, ya, yb;
      if (o.stacked || nS === 1) {
        bx = xa + gap; bw = xb - xa - 2 * gap;
        if (v >= 0) { ya = sy(pos + v); yb = sy(pos); pos += v; } else { ya = sy(neg); yb = sy(neg + v); neg += v; }
      } else {
        const inner = (xb - xa - 2 * gap) / nS;
        bx = xa + gap + k * inner; bw = inner * 0.92;
        ya = sy(Math.max(v, 0)); yb = sy(Math.min(v, 0));
      }
      s += `<rect x="${f(bx)}" y="${f(ya)}" width="${f(Math.max(bw, 0.5))}" height="${f(Math.max(yb - ya, 0))}" style="fill:${col}${o.solid ? ';stroke:none' : ''}"><title>${escx((hist ? o.edges[i] + '–' + o.edges[i + 1] : o.cats[i]) + (ser.label ? ' · ' + ser.label : '') + ': ' + (+v.toPrecision(5)))}</title></rect>`;
      if (ser.err && isFinite(ser.err[i]) && !o.stacked) {
        const cx = bx + bw / 2, e = ser.err[i];
        s += `<path class="pl-err" d="M${f(cx)} ${f(sy(v - e))}V${f(sy(v + e))}M${f(cx - 4)} ${f(sy(v - e))}H${f(cx + 4)}M${f(cx - 4)} ${f(sy(v + e))}H${f(cx + 4)}"/>`;
      }
      /* the value sits above the error bar when there is one, so neither hides the other */
      const yLab = ser.err && isFinite(ser.err[i]) && !o.stacked && v >= 0 ? Math.min(ya, sy(v + ser.err[i])) : ya;
      if (o.valueLabels && (nS === 1 || !o.stacked)) s += `<text class="pl-vlab" x="${f(bx + bw / 2)}" y="${f(yLab - 4)}" text-anchor="middle">${escx(o.valueFmt ? o.valueFmt(v) : +v.toPrecision(3))}</text>`;
    });
  }
  s += `</g>`;
  (o.curves || []).forEach(c => {
    s += `<path class="pl-line" d="${Plot.path(c.x, c.y, sx, sy)}" style="stroke:${c.color || 'var(--fig-ink)'};stroke-width:${c.width || 2.2};fill:none${c.dash ? ';stroke-dasharray:' + c.dash : ''}"/>`;
  });
  if (leg.length) s += Plot.legend(leg, x1 + 16, y1 + 8, { title: o.legendTitle });
  return s + '</svg>';
};

/* ---------------- dendrogram ----------------
   merges: [{ a, b, h }] with a, b < n for leaves and n + k for the k-th merge (as hclust, 0-based);
   labels: leaf names. Leaves are ordered so that no branches cross. */
Plot.dendro = function (o) {
  const n = o.labels.length, W = o.w || 560, H = o.h || Math.max(260, 18 * n + 70);
  const M = o.merges;
  const order = [];
  (function walk(k) { if (k < n) { order.push(k); return; } const mm = M[k - n]; walk(mm.a); walk(mm.b); })(n + M.length - 1);
  const pos = new Array(n);
  order.forEach((leaf, i) => { pos[leaf] = i; });
  const maxLab = Math.max(...o.labels.map(s => String(s).length));
  const m = { l: 16, r: Math.min(220, 12 + maxLab * 6.4), t: o.title ? 32 : 14, b: 46 };
  const x0 = m.l, x1 = W - m.r, y0 = H - m.b, y1 = m.t;
  const hmax = Math.max(...M.map(q => q.h)) * 1.04 || 1;
  /* height axis horizontal, from the right (0) to the left (hmax) */
  const sx = Plot.scale(hmax, 0, x0, x1), sy = Plot.scale(-0.5, n - 0.5, y1, y0);
  const ex = [hmax, 0], ey = [-0.5, n - 0.5];
  const xt = Plot.ticks(0, hmax, 6);
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label || o.title);
  if (o.title) s += `<text class="pl-title" data-role="title" x="${f(m.l)}" y="20">${escx(o.title)}</text>`;
  s += `<g data-role="axis" class="pl-axis"><line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y0)}"/></g><g class="pl-tick" data-role="xtick">`;
  xt.ticks.forEach(v => { const X = sx(v); if (X >= x0 - 0.5 && X <= x1 + 0.5) s += `<line x1="${f(X)}" y1="${f(y0)}" x2="${f(X)}" y2="${f(y0 + 4)}"/><text x="${f(X)}" y="${f(y0 + 15)}" text-anchor="middle">${Plot.tickLabel(v, xt.step)}</text>`; });
  s += `</g>`;
  if (o.xlab) s += `<text class="pl-lab" data-role="xlab" x="${f((x0 + x1) / 2)}" y="${f(y0 + 33)}" text-anchor="middle">${escx(o.xlab)}</text>`;
  const Y = new Array(n + M.length), Hh = new Array(n + M.length);
  for (let i = 0; i < n; i++) { Y[i] = pos[i]; Hh[i] = 0; }
  s += `<g class="pl-dendro">`;
  M.forEach((q, k) => {
    const id = n + k;
    Y[id] = (Y[q.a] + Y[q.b]) / 2; Hh[id] = q.h;
    const xa = sx(Hh[q.a]), xb = sx(Hh[q.b]), xm = sx(q.h);
    s += `<path d="M${f(xa)} ${f(sy(Y[q.a]))}H${f(xm)}V${f(sy(Y[q.b]))}H${f(xb)}"/>`;
  });
  s += `</g><g class="pl-dlab">`;
  for (let i = 0; i < n; i++) s += `<text x="${f(x1 + 6)}" y="${f(sy(pos[i]) + 3.5)}"${o.groups ? ` style="fill:${Plot.color(o.groups[i])}"` : ''}>${escx(o.labels[i])}</text>`;
  return s + `</g></svg>`;
};

/* ---------------- heat map of a square matrix ---------------- */
Plot.heat = function (o) {
  const n = o.labels.length, cell = Math.max(14, Math.min(40, 420 / n));
  const maxLab = Math.max(...o.labels.map(s => String(s).length));
  const lw = Math.min(160, 10 + maxLab * 6.2);
  const W = o.w || lw + n * cell + 100, H = o.h || lw * 0.6 + n * cell + 40 + (o.title ? 20 : 0);
  const x0 = lw, y1 = (o.title ? 30 : 10) + lw * 0.55, x1 = x0 + n * cell, y0 = y1 + n * cell;
  const lo = o.min != null ? o.min : 0, hi = o.max != null ? o.max : 1;
  let s = Plot.open(W, H, o, null, o.label || o.title);
  if (o.title) s += `<text class="pl-title" data-role="title" x="10" y="20">${escx(o.title)}</text>`;
  s += `<g class="pl-heat">`;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = o.M[i][j], t = (v - lo) / ((hi - lo) || 1);
    s += `<rect x="${f(x0 + j * cell)}" y="${f(y1 + i * cell)}" width="${f(cell - 1)}" height="${f(cell - 1)}" style="fill:${Plot.ramp(o.rev ? 1 - t : t)}"><title>${escx(o.labels[i] + ' · ' + o.labels[j] + ': ' + (+v.toPrecision(4)))}</title></rect>`;
    if (cell >= 26 && o.numbers !== false) s += `<text class="pl-cellnum" x="${f(x0 + j * cell + cell / 2 - 0.5)}" y="${f(y1 + i * cell + cell / 2 + 3)}" text-anchor="middle" style="fill:${(o.rev ? 1 - t : t) < 0.55 ? '#fff' : '#1a1a1a'}">${(+v.toFixed(2)).toString().replace(/^0\./, '.')}</text>`;
  }
  s += `</g><g class="pl-tick">`;
  o.labels.forEach((l, i) => {
    s += `<text x="${f(x0 - 5)}" y="${f(y1 + i * cell + cell / 2 + 3.5)}" text-anchor="end">${escx(l)}</text>`;
    const X = x0 + i * cell + cell / 2, Y = y1 - 5;
    s += `<text x="${f(X)}" y="${f(Y)}" transform="rotate(-50 ${f(X)} ${f(Y)})">${escx(l)}</text>`;
  });
  s += `</g>`;
  s += Plot.colorbar(x1 + 18, y1, 12, Math.min(n * cell, 180), lo, hi, o.rev, o.cbTitle);
  return s + '</svg>';
};
/* a vertical color bar with its numbers */
Plot.colorbar = function (x, y, w, h, lo, hi, rev, title) {
  const id = 'cb' + Math.random().toString(36).slice(2, 8);
  let s = `<g data-legend="colorbar" data-role="legend"><defs><linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0">`;
  for (let k = 0; k <= 10; k++) s += `<stop offset="${k / 10}" stop-color="${Plot.ramp(rev ? 1 - k / 10 : k / 10)}"/>`;
  s += `</linearGradient></defs>`;
  if (title) s += `<text class="pl-legend-title" x="${f(x)}" y="${f(y - 6)}">${escx(title)}</text>`;
  s += `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${f(h)}" style="fill:url(#${id})"/>`;
  const t = Plot.ticks(lo, hi, 5);
  t.ticks.forEach(v => { if (v < lo - 1e-12 || v > hi + 1e-12) return; const Y = y + h - (v - lo) / ((hi - lo) || 1) * h; s += `<line class="pl-cbtick" x1="${f(x + w)}" y1="${f(Y)}" x2="${f(x + w + 4)}" y2="${f(Y)}"/><text class="pl-cbtext" x="${f(x + w + 7)}" y="${f(Y + 3.5)}">${Plot.tickLabel(v, t.step)}</text>`; });
  return s + `</g>`;
};

/* the empty figure: a message where a figure will appear */
Plot.empty = function (es, en, w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w || 560} ${h || 200}" class="pl pl-empty" role="img" aria-label="${escx(TT(es, en))}"><rect class="pl-bg" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" class="pl-lab">${escx(TT(es, en))}</text></svg>`;
};

g.Plot = Plot;
})(typeof window !== 'undefined' ? window : globalThis);
