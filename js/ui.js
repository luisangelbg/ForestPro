/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — the pieces every block is made of.

   UI.dataCard   the entry of a table: an example, a file (CSV, TXT, XLSX, ODS),
                 a pasted table, typing by hand, or the inventory already loaded;
                 then the columns are matched to the fields the method needs
   UI.grid       an editable table (catalogues, costs, small inputs)
   UI.figure     a figure card (the studio and the editor ✎ attach to it)
   UI.table      a table card with CSV and XLSX download
   UI.method     the «Method and sources» box of every analysis
   UI.interp     the interpretation, in words
   UI.tiles      the handful of numbers that matter
   Report        what every block hands to the report of Block 10 */
(function () {
'use strict';
const UI = {};
const tt = a => Array.isArray(a) ? L2(a[0], a[1]) : (a || '');
const tx = a => Array.isArray(a) ? T(a[0], a[1]) : (a || '');
UI.tt = tt; UI.tx = tx;

/* ---------------- result tiles ---------------- */
UI.tiles = function (host, tiles) {
  if (typeof host === 'string') host = el(host);
  if (!host) return;
  host.innerHTML = '';
  host.classList.add('results-summary');
  tiles.filter(Boolean).forEach(t => {
    const [label, value, sub, level] = Array.isArray(t) ? t : [t.label, t.value, t.sub, t.level];
    const d = mk('div', { class: 'stat-tile' + (level ? ' ' + level : '') });
    d.innerHTML = `<div class="stat-label">${tt(label)}</div><div class="stat-value">${value}</div>` + (sub ? `<div class="stat-sub">${tt(sub)}</div>` : '');
    host.appendChild(d);
  });
};

/* ---------------- tables ---------------- */
/* columns: [{ key, label: [es, en] | html, get?, fmt?, num?, html? }] */
UI.buildTable = function (columns, rows, o) {
  o = o || {};
  const table = mk('table', { class: o.cls || 'res-table' });
  const thead = mk('thead'), trh = mk('tr');
  columns.forEach(c => trh.appendChild(mk('th', { class: c.num ? 'num' : null, scope: 'col' }, tt(c.label != null ? c.label : c.key))));
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = mk('tbody');
  (o.limit ? rows.slice(0, o.limit) : rows).forEach(r => {
    const tr = mk('tr');
    if (r && r._class) tr.className = r._class;
    columns.forEach(c => {
      const td = mk('td', { class: c.num ? 'num' : null });
      let v = c.get ? c.get(r) : r[c.key];
      if (c.html) { td.innerHTML = v == null || v === '' ? '—' : v; tr.appendChild(td); return; }
      if (c.fmt && v != null && v !== '' && !(typeof v === 'number' && !isFinite(v))) v = c.fmt(v);
      td.textContent = (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) ? '—' : v;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
};
/* the raw value of a cell for a downloaded file: numbers stay numbers */
const rawOf = (c, r) => {
  const v = c.raw ? c.raw(r) : c.get ? c.get(r) : r[c.key];
  if (typeof v === 'string') return v.replace(/<[^>]+>/g, '');
  return v;
};
const plainLabel = c => { const l = c.label != null ? c.label : c.key; return (Array.isArray(l) ? tx(l) : String(l)).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<[^>]+>/g, ''); };
UI.tableData = (columns, rows) => ({ header: columns.map(plainLabel), rows: rows.map(r => columns.map(c => rawOf(c, r))) });
/* a card section with a table, a note and the download buttons */
UI.table = function (host, o) {
  if (typeof host === 'string') host = el(host);
  if (!host) return null;
  const wrap = mk('div', { class: 'tbl-card' });
  if (o.title) wrap.appendChild(mk('h4', { class: 'tbl-title' }, tt(o.title)));
  const sc = mk('div', { class: 'table-scroll' + (o.rows.length > 14 ? ' tall' : '') });
  sc.appendChild(UI.buildTable(o.columns, o.rows, o));
  wrap.appendChild(sc);
  if (o.limit && o.rows.length > o.limit) wrap.appendChild(mk('p', { class: 'hint' }, L2(`Se muestran ${o.limit} de ${o.rows.length} filas; las descargas las llevan todas.`, `Showing ${o.limit} of ${o.rows.length} rows; the downloads carry them all.`)));
  if (o.note) wrap.appendChild(mk('p', { class: 'hint' }, tt(o.note)));
  if (o.file !== false) {
    const bar = mk('div', { class: 'btn-row tbl-tools no-print' });
    const name = LangEN.file(o.file || slug(tx(o.title) || T('tabla', 'table')));
    const csv = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('⤓ CSV', '⤓ CSV'));
    csv.addEventListener('click', () => { const d = UI.tableData(o.columns, o.rows); download(DataIO.toCSV(d.header, d.rows), name + '.csv', 'text/csv;charset=utf-8'); });
    const xl = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('⤓ XLSX', '⤓ XLSX'));
    xl.addEventListener('click', () => { const d = UI.tableData(o.columns, o.rows); download(new Blob([DataIO.xlsx([{ name: name.slice(0, 31), header: d.header, rows: d.rows }])], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name + '.xlsx'); });
    bar.append(csv, xl);
    wrap.appendChild(bar);
  }
  wrap._fp = { title: tx(o.title), file: o.file, data: () => UI.tableData(o.columns, o.rows) };
  host.appendChild(wrap);
  return wrap;
};

/* ---------------- figures ---------------- */
UI.figure = function (host, o) {
  if (typeof host === 'string') host = el(host);
  if (!host) return null;
  const card = mk('figure', { class: 'fig-card', 'data-fig': o.key || '' });
  const head = mk('div', { class: 'fig-head' });
  head.appendChild(mk('h4', null, tt(o.title)));
  card.appendChild(head);
  const body = mk('div', { class: 'fig-body' }, o.svg);
  card.appendChild(body);
  if (o.note) card.appendChild(mk('figcaption', { class: 'fig-note' }, tt(o.note)));
  host.appendChild(card);
  return card;
};

/* ---------------- method, interpretation ---------------- */
UI.method = function (host, o) {
  if (typeof host === 'string') host = el(host);
  if (!host) return null;
  const d = mk('details', { class: 'method-box' });
  d.innerHTML = `<summary>${L2('Método y fuentes', 'Method and sources')}</summary><div class="method-body">${tt(o.text)}` +
    (o.refs && o.refs.length ? `<ul class="ref-mini">${o.refs.map(r => `<li>${LangEN.refL2(r)}</li>`).join('')}</ul>` : '') + `</div>`;
  if (o.open) d.open = true;
  host.appendChild(d);
  return d;
};
UI.interp = function (host, text, level) {
  if (typeof host === 'string') host = el(host);
  if (!host) return null;
  const d = mk('div', { class: 'interp' + (level ? ' ' + level : '') }, `<span class="interp-k">${L2('Interpretación', 'Interpretation')}</span>${tt(text)}`);
  host.appendChild(d);
  return d;
};
UI.section = function (host, title, sub, o) {
  if (typeof host === 'string') host = el(host);
  const card = mk('section', { class: 'card' + (o && o.cls ? ' ' + o.cls : ''), id: o && o.id ? o.id : null });
  card.appendChild(mk('h2', null, tt(title)));
  if (sub) card.appendChild(mk('p', { class: 'hint' }, tt(sub)));
  host.appendChild(card);
  return card;
};

/* ---------------- an editable table ----------------
   fields: [{ key, label, num, w (px), options: [[value, es, en]…] }]; rows: array of objects (edited in place) */
UI.grid = function (host, fields, rows, o) {
  o = o || {};
  if (typeof host === 'string') host = el(host);
  host.innerHTML = '';
  const gkey = () => { const p = host.closest('.step-panel'); return p && !host.closest('.data-card') ? p.id + ':' + fields.map(fd => fd.key).join(',') : null; };
  const changed = () => { const k = gkey(); if (k) document.dispatchEvent(new CustomEvent('fp:grid', { detail: { key: k, rows } })); };
  const wrap = mk('div', { class: 'table-scroll grid-wrap' });
  const table = mk('table', { class: 'edit-grid' });
  const draw = () => {
    table.innerHTML = '';
    const thead = mk('thead'), tr = mk('tr');
    fields.forEach(fd => tr.appendChild(mk('th', { class: fd.num ? 'num' : null, scope: 'col' }, tt(fd.label))));
    if (o.removable !== false) tr.appendChild(mk('th', null, '<span class="sr-only">' + L2('Quitar', 'Remove') + '</span>'));
    thead.appendChild(tr); table.appendChild(thead);
    const tb = mk('tbody');
    rows.forEach((r, i) => {
      const trr = mk('tr');
      fields.forEach(fd => {
        const td = mk('td');
        const lab = tx(fd.label).replace(/<[^>]+>/g, '') + ' · ' + T('fila ', 'row ') + (i + 1);
        let inp;
        if (fd.options) {
          inp = mk('select', { 'aria-label': lab });
          fd.options.forEach(op => { const opt = mk('option', { value: op[0] }, op[2] ? T(op[1], op[2]) : op[1]); if (String(r[fd.key]) === String(op[0])) opt.selected = true; inp.appendChild(opt); });
        } else {
          inp = mk('input', { type: fd.num ? 'number' : 'text', step: fd.num ? 'any' : null, value: r[fd.key] == null || (fd.num && !isFinite(r[fd.key])) ? '' : r[fd.key], 'aria-label': lab, style: fd.w ? 'width:' + fd.w + 'px' : null });
        }
        inp.addEventListener('change', () => {
          r[fd.key] = fd.num ? (inp.value === '' ? NaN : +inp.value) : inp.value;
          changed();
          if (o.onChange) o.onChange(rows, i, fd.key);
        });
        td.appendChild(inp); trr.appendChild(td);
      });
      if (o.removable !== false) {
        const td = mk('td');
        const b = mk('button', { type: 'button', class: 'icon-btn grid-del', title: T('Quitar fila', 'Remove row'), 'aria-label': T('Quitar fila ', 'Remove row ') + (i + 1) }, '×');
        b.addEventListener('click', () => { rows.splice(i, 1); draw(); changed(); if (o.onChange) o.onChange(rows, -1); });
        td.appendChild(b); trr.appendChild(td);
      }
      tb.appendChild(trr);
    });
    table.appendChild(tb);
  };
  draw();
  wrap.appendChild(table);
  host.appendChild(wrap);
  if (o.addable !== false) {
    const add = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('+ Agregar fila', '+ Add row'));
    add.addEventListener('click', () => { const nr = {}; fields.forEach(fd => { nr[fd.key] = fd.def != null ? fd.def : (fd.num ? NaN : ''); }); rows.push(nr); draw(); changed(); if (o.onChange) o.onChange(rows, rows.length - 1); });
    host.appendChild(mk('div', { class: 'btn-row' })).appendChild(add);
  }
  document.addEventListener('langchange', () => { if (host.isConnected) draw(); });
  const k0 = gkey();
  if (k0) UI.grids[k0] = { rows, draw, o };
  return { redraw: draw, rows };
};
UI.grids = {};
/* the data cards whose example must be loaded again when the language changes, so that its labels (strata,
   managements…) follow it. This listener is added before those of the blocks (ui.js loads first), so the
   blocks redraw with the relabelled data */
UI.relabelers = [];
document.addEventListener('langchange', () => UI.relabelers.forEach(f => f()));

/* ---------------- the data card ----------------
   o: { id, fields: [{ key, es, en, aliases, num, req }], examples: [{ id, es, en, d: [es, en], rows: () => [...] }],
        inventory: () => rows | null, onData(rows, meta), minRows } */
UI.dataCard = function (host, o) {
  if (typeof host === 'string') host = el(host);
  const box = mk('div', { class: 'data-card' });
  host.appendChild(box);
  const id = o.id;
  const srcs = mk('div', { class: 'src-row' });
  const exSel = mk('select', { id: id + 'Ex', 'aria-label': T('Ejemplo', 'Example') });
  const fillEx = () => { exSel.innerHTML = (o.examples || []).map(e => `<option value="${e.id}"${optL(e.es, e.en)}</option>`).join(''); };
  fillEx();
  const exBtn = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Cargar ejemplo', 'Load example'));
  const fileIn = mk('input', { type: 'file', accept: '.csv,.txt,.tsv,.xlsx,.xlsm,.ods', class: 'sr-only', id: id + 'File' });
  const fileBtn = mk('label', { class: 'btn btn-secondary btn-sm', for: id + 'File', tabindex: '0', role: 'button' }, L2('Abrir archivo…', 'Open file…'));
  const pasteBtn = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('Pegar tabla', 'Paste table'));
  const handBtn = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('Escribir a mano', 'Type by hand'));
  const invBtn = o.inventory ? mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('Usar el inventario cargado', 'Use the loaded inventory')) : null;
  const tplBtn = mk('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, L2('⤓ Plantilla', '⤓ Template'));
  if (o.examples && o.examples.length) srcs.append(exSel, exBtn);
  srcs.append(fileBtn, fileIn, pasteBtn, handBtn);
  if (invBtn) srcs.append(invBtn);
  srcs.append(tplBtn);
  box.appendChild(srcs);
  const exNote = mk('p', { class: 'hint ex-note' });
  box.appendChild(exNote);
  const showExNote = () => { const e = (o.examples || []).find(x => x.id === exSel.value); exNote.innerHTML = e && e.d ? tt(e.d) : ''; };
  exSel.addEventListener('change', showExNote); showExNote();
  const area = mk('div', { class: 'data-area' });
  box.appendChild(area);
  const msg = mk('div', { class: 'messages' });
  box.appendChild(msg);
  const status = mk('p', { class: 'data-status' });
  box.appendChild(status);

  /* the example loaded last, with its rows as text: the labels of the examples (strata, managements…)
     follow the language, so when it changes the example is loaded again with the new labels */
  let exLoaded = null;
  const finish = (rows, meta) => {
    if (!meta.example) exLoaded = null;
    clearMessages(msg);
    const req = o.fields.filter(fd => fd.req);
    const bad = rows.filter(r => req.some(fd => fd.num ? !isFinite(r[fd.key]) : (r[fd.key] == null || r[fd.key] === '')));
    if (o.minRows && rows.length - bad.length < o.minRows) {
      showMessage(msg, 'warning', L2(`Hacen falta al menos ${o.minRows} filas completas; hay ${rows.length - bad.length}.`, `At least ${o.minRows} complete rows are needed; there are ${rows.length - bad.length}.`));
      return;
    }
    if (bad.length) showMessage(msg, 'warning', L2(`${bad.length} filas no tienen todos los campos obligatorios y no se usan.`, `${bad.length} rows lack a required field and are left out.`));
    const good = rows.filter(r => !bad.includes(r));
    status.innerHTML = `<b>${esc(meta.name || '')}</b> · ${L2(good.length + ' filas', good.length + ' rows')}` + (meta.note ? ' · ' + tt(meta.note) : '');
    preview(good);
    /* the project of Block 10 records the loads the user makes, not those a block makes from inside another */
    document.dispatchEvent(new CustomEvent('fp:data', { detail: { id, rows: good, meta, nested: UI.dataDepth > 0 } }));
    UI.dataDepth++;
    try { o.onData(good, meta); } finally { UI.dataDepth--; }
  };
  const preview = rows => {
    area.innerHTML = '';
    const cols = o.fields.filter(fd => rows.some(r => r[fd.key] != null && r[fd.key] !== '' && !(fd.num && !isFinite(r[fd.key]))));
    const det = mk('details', { class: 'data-preview' });
    det.innerHTML = `<summary>${L2('Ver los datos', 'See the data')} (${rows.length})</summary>`;
    const sc = mk('div', { class: 'table-scroll' + (rows.length > 12 ? ' tall' : '') });
    sc.appendChild(UI.buildTable(cols.map(fd => ({ key: fd.key, label: [fd.es, fd.en], num: fd.num, fmt: fd.num ? v => +(+v).toPrecision(8) : null })), rows, { limit: 200, cls: 'data-grid' }));
    det.appendChild(sc);
    area.appendChild(det);
  };
  /* a raw typed table → the column matcher */
  const matcher = (tab, meta) => {
    area.innerHTML = '';
    clearMessages(msg);
    const m = mk('div', { class: 'col-match' });
    m.innerHTML = `<p class="hint">${L2('Indica qué columna de tu tabla corresponde a cada campo. Las que se reconocieron por su nombre ya están elegidas.', 'Say which column of your table holds each field. Those recognized by their name are already chosen.')}</p>`;
    const grid = mk('div', { class: 'form-grid' });
    const sels = {};
    o.fields.forEach(fd => {
      const fid = id + 'Col_' + fd.key;
      const f = mk('div', { class: 'field' });
      f.appendChild(mk('label', { for: fid }, L2(fd.es, fd.en) + (fd.req ? ' *' : '')));
      const s = mk('select', { id: fid });
      s.innerHTML = `<option value="-1"${optL('— ninguna —', '— none —')}</option>` + tab.names.map((nm, j) => `<option value="${j}">${esc(nm)}</option>`).join('');
      s.value = String(DataIO.findColumn(tab.names, [fd.key, fd.es, fd.en].concat(fd.aliases || [])));
      sels[fd.key] = s;
      f.appendChild(s); grid.appendChild(f);
    });
    m.appendChild(grid);
    const go = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Usar estos datos', 'Use these data'));
    go.addEventListener('click', () => {
      const missing = o.fields.filter(fd => fd.req && sels[fd.key].value === '-1');
      if (missing.length) { clearMessages(msg); showMessage(msg, 'warning', L2('Falta elegir: ', 'Still to choose: ') + missing.map(fd => L2(fd.es, fd.en)).join(', ')); return; }
      const rows = [];
      for (let i = 0; i < tab.n; i++) {
        const r = {};
        o.fields.forEach(fd => {
          const j = +sels[fd.key].value;
          if (j < 0) { r[fd.key] = fd.num ? NaN : ''; return; }
          const col = tab.cols[j], v = col.v[i];
          r[fd.key] = fd.num ? (col.num ? v : DataIO.toNumber(v, tab.decimal || '.')) : (v == null || (typeof v === 'number' && !isFinite(v)) ? '' : String(v));
        });
        rows.push(r);
      }
      finish(rows, meta);
    });
    m.appendChild(mk('div', { class: 'btn-row' })).appendChild(go);
    area.appendChild(m);
  };

  exBtn.addEventListener('click', () => {
    const e = (o.examples || []).find(x => x.id === exSel.value);
    if (!e) return;
    const rows = e.rows();
    exLoaded = { id: e.id, key: JSON.stringify(rows) };
    finish(rows.map(r => Object.assign({}, r)), { name: T(e.es, e.en), example: e.id, note: e.note });
  });
  fileIn.addEventListener('change', async () => {
    const file = fileIn.files[0];
    if (!file) return;
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const tab = DataIO.readAny(buf, file.name);
      matcher(tab, { name: file.name });
      if (tab.sheets && tab.sheets.length > 1) {
        const p = mk('p', { class: 'sheet-pick' }, L2('Hoja: ', 'Sheet: '));
        const s = mk('select', { 'aria-label': T('Hoja del libro', 'Sheet of the workbook') });
        s.innerHTML = tab.sheets.map(n => `<option${n === tab.sheet ? ' selected' : ''}>${esc(n)}</option>`).join('');
        s.addEventListener('change', () => { const t2 = DataIO.readAny(buf, file.name, { sheet: s.value }); matcher(t2, { name: file.name + ' · ' + s.value }); area.prepend(p); });
        p.appendChild(s);
        area.prepend(p);
      }
    } catch (err) {
      clearMessages(msg);
      showMessage(msg, 'danger', L2(err.es || 'No se pudo leer el archivo: ' + esc(err.message), err.en || 'The file could not be read: ' + esc(err.message)));
    }
    fileIn.value = '';
  });
  fileBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } });
  pasteBtn.addEventListener('click', () => {
    area.innerHTML = '';
    const ta = mk('textarea', { rows: 8, class: 'paste-area', 'aria-label': T('Tabla pegada', 'Pasted table'), placeholder: T('Pega aquí la tabla con su fila de nombres (desde una hoja de cálculo o un texto separado por comas, punto y coma o tabuladores).', 'Paste the table here with its row of names (from a spreadsheet, or text separated by commas, semicolons or tabs).') });
    const b = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Leer la tabla', 'Read the table'));
    b.addEventListener('click', () => {
      try {
        const t = DataIO.readDelimited(ta.value, {});
        matcher(Object.assign(DataIO.typed(t, t.decimal), { decimal: t.decimal }), { name: T('Tabla pegada', 'Pasted table') });
      } catch (err) { clearMessages(msg); showMessage(msg, 'danger', L2(err.es || esc(err.message), err.en || esc(err.message))); }
    });
    area.append(ta, mk('div', { class: 'btn-row' }));
    area.lastChild.appendChild(b);
    ta.focus();
  });
  handBtn.addEventListener('click', () => {
    area.innerHTML = '';
    const rows = [];
    for (let i = 0; i < (o.handRows || 5); i++) { const r = {}; o.fields.forEach(fd => { r[fd.key] = fd.num ? NaN : ''; }); rows.push(r); }
    const g = mk('div');
    area.appendChild(g);
    UI.grid(g, o.fields.map(fd => ({ key: fd.key, label: [fd.es, fd.en], num: fd.num, w: fd.num ? 90 : 130 })), rows);
    const b = mk('button', { type: 'button', class: 'btn btn-primary btn-sm' }, L2('Usar estos datos', 'Use these data'));
    b.addEventListener('click', () => finish(rows.map(r => Object.assign({}, r)), { name: T('Datos escritos a mano', 'Data typed by hand') }));
    area.appendChild(mk('div', { class: 'btn-row' })).appendChild(b);
  });
  if (invBtn) invBtn.addEventListener('click', () => {
    const rows = o.inventory();
    if (!rows || !rows.length) { clearMessages(msg); showMessage(msg, 'info', L2('Todavía no hay un inventario cargado. Carga uno en el Bloque 3 (o un ejemplo aquí).', 'No inventory is loaded yet. Load one in Block 3 (or an example here).')); return; }
    finish(rows.map(r => Object.assign({}, r)), { name: T('Inventario cargado', 'Loaded inventory') + (state.inv ? ' · ' + state.inv.name : '') });
  });
  tplBtn.addEventListener('click', () => {
    const header = o.fields.map(fd => fd.key);
    const ex = (o.examples && o.examples[0]) ? o.examples[0].rows().slice(0, 3).map(r => o.fields.map(fd => r[fd.key])) : [];
    download(DataIO.toCSV(header, ex), 'forestpro_' + id + '_plantilla.csv', 'text/csv;charset=utf-8');
  });
  document.addEventListener('langchange', () => { const v = exSel.value; fillEx(); exSel.value = v; showExNote(); });
  /* runs before the blocks redraw themselves (UI.relabel, below) */
  UI.relabelers.push(() => {
    const e = exLoaded && box.isConnected && (o.examples || []).find(x => x.id === exLoaded.id);
    if (!e) return;
    const rows = e.rows(), key = JSON.stringify(rows);
    if (key === exLoaded.key) { const b = status.querySelector('b'); if (b) b.textContent = T(e.es, e.en); return; }
    exLoaded.key = key;
    finish(rows.map(r => Object.assign({}, r)), { name: T(e.es, e.en), example: e.id, note: e.note, relabel: true });
  });
  const api = { load: exId => { if (exId) { exSel.value = exId; showExNote(); } exBtn.click(); }, set: (rows, meta) => finish(rows, meta || {}), box, fields: o.fields, examples: (o.examples || []).map(e => e.id) };
  UI.cards[id] = api;
  return api;
};
UI.cards = {};
UI.dataDepth = 0;

/* ---------------- table of a fitted model: estimate, SE, t, p ---------------- */
UI.coefRows = (fit, names) => (names || fit.names).map((nm, i) => ({ par: nm, est: fit.coef[i], se: fit.se[i], t: fit.t[i], p: fit.p[i] }));
UI.coefCols = [
  { key: 'par', label: ['Parámetro', 'Parameter'] },
  { key: 'est', label: ['Estimación', 'Estimate'], num: true, html: true, get: r => fmtSig(r.est, 5), raw: r => r.est },
  { key: 'se', label: ['Error estándar', 'Std. error'], num: true, html: true, get: r => fmtSig(r.se, 4), raw: r => r.se },
  { key: 't', label: ['t'], num: true, get: r => fmtNum(r.t, 2), raw: r => r.t },
  { key: 'p', label: ['p'], num: true, get: r => fmtP(r.p), raw: r => r.p },
];
UI.coefTable = (host, fit, o) => UI.table(host, Object.assign({ columns: UI.coefCols, rows: UI.coefRows(fit, o && o.names) }, o || {}));
/* the species with the most rows keep their color; the rest are pooled as «others» */
UI.speciesColors = function (list, k) {
  k = k || 8;
  const cnt = new Map();
  list.forEach(s => cnt.set(s, (cnt.get(s) || 0) + 1));
  const top = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(e => e[0]);
  const col = s => { const i = top.indexOf(s); return i >= 0 ? Plot.color(i) : '#9AA39A'; };
  return { top, col, others: cnt.size > top.length };
};

/* ---------------- the report registry ---------------- */
const Report = {
  /* items: [{ kind: 'fig'|'table'|'text'|'tiles', title, svg | columns+rows | html | tiles }] */
  set(block, items) { state.report[block] = items; document.dispatchEvent(new CustomEvent('reportchange', { detail: { block } })); },
  get(block) { return state.report[block] || []; },
  clear(block) { delete state.report[block]; },
};

window.UI = UI;
window.Report = Report;
})();
