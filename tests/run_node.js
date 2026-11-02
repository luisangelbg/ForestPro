/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Runs the unit tests of tests/unit.js (and, reading the source files, those of tests/t_english.js) in node:   node tests/run_node.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = { console, Math, Date, JSON, TextEncoder, TextDecoder, Uint8Array, Uint32Array, Int32Array, Float64Array, Array, Object, Number, String, Map, Set, Error, isFinite, isNaN };
ctx.window = ctx; ctx.globalThis = ctx; ctx.T = es => es;
vm.createContext(ctx);
['num.js', 'nls.js', 'dataio.js', 'plot.js', 'lang-en.js', 'datasets.js', 'eng-dendro.js', 'eng-invent.js', 'eng-biomass.js', 'eng-growth.js', 'eng-divers.js', 'eng-agro.js', 'eng-geo.js', 'eng-tools.js']
  .forEach(f => { const p = path.join(root, 'js', f); if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); });
vm.runInContext(fs.readFileSync(path.join(__dirname, 'unit.js'), 'utf8'), ctx, { filename: 'unit.js' });
/* the tests of the English interface read the source files */
ctx.FP_SRC = {};
fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js') && f !== 'datasets.js').forEach(f => { ctx.FP_SRC['js/' + f] = fs.readFileSync(path.join(root, 'js', f), 'utf8'); });
fs.readdirSync(path.join(root, 'tools', 'parts')).filter(f => f.endsWith('.html')).forEach(f => { ctx.FP_SRC['tools/parts/' + f] = fs.readFileSync(path.join(root, 'tools', 'parts', f), 'utf8'); });
ctx.FP_SRC['index.html'] = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
vm.runInContext(fs.readFileSync(path.join(__dirname, 't_english.js'), 'utf8'), ctx, { filename: 't_english.js' });
let pass = 0, fail = 0;
ctx.FP_UNIT.forEach(u => {
  try { u.fn(ctx); pass++; } catch (e) { fail++; console.log('FALLA [B' + u.block + '] ' + u.name + ': ' + e.message); }
});
console.log(`${pass + fail} pruebas: ${pass} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
