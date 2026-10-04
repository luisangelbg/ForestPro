/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Writes the catalogue of allometric equations of the app (js/eng-biomass.js) to data/ecuaciones_alometricas.csv,
   so it can be read and cited without opening the app:   node tools/export_equations.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = { console, Math, JSON, Array, Object, Number, String, Map, Set, isFinite, isNaN };
ctx.window = ctx; ctx.globalThis = ctx; ctx.T = es => es;
vm.createContext(ctx);
['num.js', 'eng-biomass.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), ctx, { filename: f }));
const q = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const head = ['id', 'nombre', 'name', 'grupo', 'variables', 'ecuacion', 'sigma_ln', 'dap_min_cm', 'dap_max_cm', 'fuente'];
const rows = ctx.Biomass.EQS.map(e => [e.id, e.es, e.en, e.group, (e.needs || []).join(' '), e.eq, e.sigma, e.dmin, e.dmax, strip(e.src)]);
fs.writeFileSync(path.join(root, 'data', 'ecuaciones_alometricas.csv'), '﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\n') + '\n');
console.log('data/ecuaciones_alometricas.csv: ' + rows.length + ' ecuaciones');
