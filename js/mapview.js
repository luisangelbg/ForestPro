/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — a small interactive map of its own.

   Spherical Mercator at integer zoom levels, as web maps use. Layers are drawn
   in one SVG over the map: polygons, circles with a radius in metres (plots),
   points (trees, grid), labels and a raster image (interpolations). Drag to
   pan, wheel or + − to zoom, arrows on the keyboard; a click can add vertices
   of a polygon. With no background the map shows a graticule of latitude and
   longitude. The background of OpenStreetMap tiles is off until the user turns
   it on: only then does the page ask a tile server for images, and the
   attribution its licence requires is shown. Nothing else leaves the computer. */
(function () {
'use strict';
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MapView = {};
MapView.create = function (host, o) {
  o = Object.assign({ center: [19.5, -97.0], zoom: 12, minZoom: 2, maxZoom: 19 }, o || {});
  const G = window.Geo;
  const wrap = mk('div', { class: 'map-wrap', tabindex: '0', role: 'application', 'aria-label': T('Mapa. Arrastra para mover, rueda o teclas + y − para acercar o alejar, flechas para desplazar.', 'Map. Drag to move, wheel or + and − keys to zoom in or out, arrows to pan.') });
  const tiles = mk('div', { class: 'map-tiles', 'aria-hidden': 'true' });
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'map-svg');
  const tools = mk('div', { class: 'map-tools' });
  const attrib = mk('div', { class: 'map-attrib' });
  const scale = mk('div', { class: 'map-scale', 'aria-hidden': 'true' });
  const coord = mk('div', { class: 'map-coord', 'aria-live': 'off' });
  wrap.append(tiles, svg, tools, attrib, scale, coord);
  host.appendChild(wrap);
  const st = { lat: o.center[0], lon: o.center[1], z: o.zoom, tiles: false, layers: {}, drawing: null };
  const size = () => ({ w: wrap.clientWidth || 600, h: wrap.clientHeight || 400 });
  const toScreen = (lat, lon) => { const s = size(); return [G.mercX(lon, st.z) - G.mercX(st.lon, st.z) + s.w / 2, G.mercY(lat, st.z) - G.mercY(st.lat, st.z) + s.h / 2]; };
  const toLatLon = (x, y) => { const s = size(); return [G.mercLat(G.mercY(st.lat, st.z) + y - s.h / 2, st.z), G.mercLon(G.mercX(st.lon, st.z) + x - s.w / 2, st.z)]; };
  const mpp = () => 156543.03392 * Math.cos(st.lat * Math.PI / 180) / Math.pow(2, st.z);
  const btn = (txt, title, fn) => { const b = mk('button', { type: 'button', title, 'aria-label': title }, txt); b.addEventListener('click', e => { e.stopPropagation(); fn(); }); tools.appendChild(b); return b; };
  btn('+', T('Acercar', 'Zoom in'), () => zoom(1));
  btn('−', T('Alejar', 'Zoom out'), () => zoom(-1));
  btn('⤢', T('Ajustar a los datos', 'Fit to the data'), () => api.fit());

  function zoom(dz, at) {
    const nz = Math.max(o.minZoom, Math.min(o.maxZoom, st.z + dz));
    if (nz === st.z) return;
    if (at) { const before = toLatLon(at[0], at[1]); st.z = nz; const p = toScreen(before[0], before[1]); const s = size(); const c = toLatLon(s.w / 2 + p[0] - at[0], s.h / 2 + p[1] - at[1]); st.lat = c[0]; st.lon = c[1]; }
    else st.z = nz;
    draw();
  }
  /* pointer: drag to pan, click to draw */
  let drag = null;
  wrap.addEventListener('pointerdown', e => { if (e.target.closest('.map-tools, .map-attrib')) return; drag = { x: e.clientX, y: e.clientY, moved: false }; wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', e => {
    const r = wrap.getBoundingClientRect(), ll = toLatLon(e.clientX - r.left, e.clientY - r.top);
    coord.textContent = ll[0].toFixed(5) + ', ' + ll[1].toFixed(5);
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    if (!drag.moved) return;
    const s = size(), c = toLatLon(s.w / 2 - dx, s.h / 2 - dy);
    st.lat = c[0]; st.lon = c[1]; drag.x = e.clientX; drag.y = e.clientY;
    draw();
  });
  wrap.addEventListener('pointerup', e => {
    const was = drag; drag = null;
    if (was && !was.moved && st.drawing) { const r = wrap.getBoundingClientRect(); const ll = toLatLon(e.clientX - r.left, e.clientY - r.top); st.drawing.push([ll[1], ll[0]]); draw(); if (o.onDrawChange) o.onDrawChange(st.drawing); }
  });
  wrap.addEventListener('dblclick', e => { if (st.drawing) { e.preventDefault(); api.finishDraw(); } });
  wrap.addEventListener('wheel', e => { e.preventDefault(); const r = wrap.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1 : -1, [e.clientX - r.left, e.clientY - r.top]); }, { passive: false });
  wrap.addEventListener('keydown', e => {
    const s = size(), step = 80;
    const pan = (dx, dy) => { const c = toLatLon(s.w / 2 + dx, s.h / 2 + dy); st.lat = c[0]; st.lon = c[1]; draw(); };
    if (e.key === '+' || e.key === '=') zoom(1); else if (e.key === '-') zoom(-1);
    else if (e.key === 'ArrowLeft') pan(-step, 0); else if (e.key === 'ArrowRight') pan(step, 0); else if (e.key === 'ArrowUp') pan(0, -step); else if (e.key === 'ArrowDown') pan(0, step);
    else if (e.key === 'Escape' && st.drawing) api.cancelDraw();
    else return;
    e.preventDefault();
  });

  /* ---------------- drawing ---------------- */
  const S = (tag, attrs, text) => { const n = document.createElementNS(svgNS, tag); for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; };
  function drawTiles() {
    tiles.innerHTML = '';
    if (!st.tiles) return;
    const s = size(), n = Math.pow(2, st.z), cx = G.mercX(st.lon, st.z), cy = G.mercY(st.lat, st.z);
    const x0 = Math.floor((cx - s.w / 2) / 256), x1 = Math.floor((cx + s.w / 2) / 256), y0 = Math.floor((cy - s.h / 2) / 256), y1 = Math.floor((cy + s.h / 2) / 256);
    for (let tx = x0; tx <= x1; tx++) for (let ty = Math.max(0, y0); ty <= Math.min(n - 1, y1); ty++) {
      const img = new Image();
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'strict-origin-when-cross-origin';
      img.src = TILE_URL.replace('{z}', st.z).replace('{x}', ((tx % n) + n) % n).replace('{y}', ty);
      img.style.left = Math.round(tx * 256 - cx + s.w / 2) + 'px';
      img.style.top = Math.round(ty * 256 - cy + s.h / 2) + 'px';
      tiles.appendChild(img);
    }
  }
  function graticule(g) {
    const s = size(), a = toLatLon(0, s.h), b = toLatLon(s.w, 0);
    const tx = Plot.ticks(a[1], b[1], 6), ty = Plot.ticks(a[0], b[0], 5);
    const gg = S('g', { class: 'map-grat' });
    const dec = st => Math.max(0, Math.min(6, -Math.floor(Math.log10(st) + 1e-9)));
    tx.ticks.forEach(lon => { const p = toScreen(a[0], lon), q = toScreen(b[0], lon); gg.appendChild(S('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1] })); gg.appendChild(S('text', { x: p[0] + 3, y: s.h - 22 }, lon.toFixed(dec(tx.step)) + '°')); });
    ty.ticks.forEach(lat => { const p = toScreen(lat, a[1]), q = toScreen(lat, b[1]); gg.appendChild(S('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1] })); gg.appendChild(S('text', { x: 50, y: p[1] - 3 }, lat.toFixed(dec(ty.step)) + '°')); });
    g.appendChild(gg);
  }
  function draw() {
    const s = size();
    svg.setAttribute('viewBox', `0 0 ${s.w} ${s.h}`);
    svg.innerHTML = '';
    drawTiles();
    const root = S('g', {});
    if (!st.tiles) graticule(root);
    const L = st.layers;
    if (L.raster && L.raster.href) {
      const p0 = toScreen(L.raster.bbox[3], L.raster.bbox[0]), p1 = toScreen(L.raster.bbox[1], L.raster.bbox[2]);
      root.appendChild(S('image', { href: L.raster.href, x: p0[0], y: p0[1], width: p1[0] - p0[0], height: p1[1] - p0[1], preserveAspectRatio: 'none', opacity: L.raster.opacity || 0.75, style: 'image-rendering:pixelated' }));
    }
    (L.polygons || []).forEach(pg => {
      const d = pg.ring.map((q, i) => { const p = toScreen(q[1], q[0]); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('') + 'Z';
      const path = S('path', { d, style: `fill:${pg.fill || 'rgba(46,125,50,.10)'};stroke:${pg.stroke || 'var(--primary)'};stroke-width:2` });
      path.appendChild(S('title', {}, pg.name || ''));
      root.appendChild(path);
    });
    (L.circles || []).forEach(c => {
      const p = toScreen(c.lat, c.lon), r = Math.max(2.5, c.r / mpp());
      const e = S('circle', { cx: p[0], cy: p[1], r, style: `fill:${c.color || 'var(--oro, #D4A848)'};fill-opacity:.35;stroke:${c.color || '#9C7128'};stroke-width:1.4` });
      e.appendChild(S('title', {}, c.label || ''));
      root.appendChild(e);
      if (c.label && st.z >= (c.labelZoom || 13)) root.appendChild(S('text', { x: p[0] + r + 3, y: p[1] + 4, class: 'map-label', style: 'fill:var(--fig-ink);font-size:11px;paint-order:stroke;stroke:var(--fig-bg);stroke-width:3px' }, c.label));
    });
    (L.points || []).forEach(q => {
      if (q.minZoom && st.z < q.minZoom) return;
      const p = toScreen(q.lat, q.lon);
      if (p[0] < -20 || p[1] < -20 || p[0] > s.w + 20 || p[1] > s.h + 20) return;
      const r = q.size || 3;
      const e = q.shape === 'square' ? S('rect', { x: p[0] - r, y: p[1] - r, width: 2 * r, height: 2 * r, style: `fill:${q.color || 'var(--fig-bg)'};stroke:${q.stroke || 'var(--fig-ink)'};stroke-width:1.2` })
        : S('circle', { cx: p[0], cy: p[1], r, style: `fill:${q.color || 'var(--bosque)'};stroke:var(--fig-bg);stroke-width:.6` });
      if (q.label) e.appendChild(S('title', {}, q.label));
      root.appendChild(e);
    });
    if (st.drawing && st.drawing.length) {
      const d = st.drawing.map((q, i) => { const p = toScreen(q[1], q[0]); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
      root.appendChild(S('path', { d, style: 'fill:none;stroke:var(--accent);stroke-width:2;stroke-dasharray:6 4' }));
      st.drawing.forEach(q => { const p = toScreen(q[1], q[0]); root.appendChild(S('circle', { cx: p[0], cy: p[1], r: 4, style: 'fill:var(--accent)' })); });
    }
    svg.appendChild(root);
    wrap.classList.toggle('drawing', !!st.drawing);
    /* scale bar: a round distance close to 110 px */
    const m = mpp() * 110, e = Math.pow(10, Math.floor(Math.log10(m))), nice = [1, 2, 5, 10].map(k => k * e).filter(v => v <= m).pop() || e;
    scale.innerHTML = (nice >= 1000 ? (nice / 1000) + ' km' : nice + ' m') + `<i style="width:${(nice / mpp()).toFixed(0)}px"></i>`;
    attrib.innerHTML = st.tiles ? '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">' + T('colaboradores de OpenStreetMap', 'OpenStreetMap contributors') + '</a>' : T('Sin fondo: retícula de latitud y longitud', 'No background: latitude and longitude graticule');
  }
  const api = {
    el: wrap,
    setLayers(l) { st.layers = Object.assign(st.layers, l); draw(); },
    layers: () => st.layers,
    setTiles(on) { st.tiles = !!on; draw(); },
    tilesOn: () => st.tiles,
    view: () => ({ lat: st.lat, lon: st.lon, z: st.z }),
    setView(lat, lon, z) { st.lat = lat; st.lon = lon; if (z != null) st.z = z; draw(); },
    /* fit to every layer (or to the given [lat, lon] points) */
    fit(pts) {
      const L = st.layers;
      pts = pts || [].concat((L.polygons || []).flatMap(p => p.ring.map(q => [q[1], q[0]])), (L.circles || []).map(c => [c.lat, c.lon]), (L.points || []).map(q => [q.lat, q.lon]));
      if (!pts.length) return;
      const la = pts.map(p => p[0]), lo = pts.map(p => p[1]);
      const a = [Math.min(...la), Math.min(...lo)], b = [Math.max(...la), Math.max(...lo)];
      st.lat = (a[0] + b[0]) / 2; st.lon = (a[1] + b[1]) / 2;
      const s = size();
      for (let z = o.maxZoom; z >= o.minZoom; z--) { const w = G.mercX(b[1], z) - G.mercX(a[1], z), h = G.mercY(a[0], z) - G.mercY(b[0], z); if (w < s.w * 0.86 && h < s.h * 0.86) { st.z = Math.min(z, 18); break; } }
      draw();
    },
    startDraw(onChange) { st.drawing = []; o.onDrawChange = onChange; draw(); wrap.focus(); },
    finishDraw() {
      /* a double click leaves the last vertex twice */
      const r = (st.drawing || []).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
      st.drawing = null; draw();
      if (o.onDrawEnd) o.onDrawEnd(r.length >= 3 ? r : null);
      return r;
    },
    cancelDraw() { st.drawing = null; draw(); if (o.onDrawEnd) o.onDrawEnd(null); },
    drawing: () => st.drawing,
    redraw: draw,
  };
  if (window.ResizeObserver) new ResizeObserver(() => draw()).observe(wrap);
  document.addEventListener('langchange', draw);
  setTimeout(draw, 0);
  return api;
};
window.MapView = MapView;
})();
