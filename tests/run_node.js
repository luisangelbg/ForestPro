/* ForestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Runs the unit tests of tests/unit.js in node:   node tests/run_node.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = { console, Math, Date, JSON, TextEncoder, TextDecoder, Uint8Array, Uint32Array, Int32Array, Float64Array, Array, Object, Number, String, Map, Set, Error, isFinite, isNaN };
ctx.window = ctx; ctx.globalThis = ctx; ctx.T = es => es;
vm.createContext(ctx);
['num.js', 'nls.js', 'dataio.js', 'datasets.js', 'eng-dendro.js', 'eng-invent.js', 'eng-biomass.js', 'eng-growth.js', 'eng-divers.js', 'eng-agro.js', 'eng-geo.js', 'eng-tools.js']
  .forEach(f => { const p = path.join(root, 'js', f); if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); });
vm.runInContext(fs.readFileSync(path.join(__dirname, 'unit.js'), 'utf8'), ctx, { filename: 'unit.js' });
let pass = 0, fail = 0;
ctx.FP_UNIT.forEach(u => {
  try { u.fn(ctx); pass++; } catch (e) { fail++; console.log('FALLA [B' + u.block + '] ' + u.name + ': ' + e.message); }
});
console.log(`${pass + fail} pruebas: ${pass} pasan, ${fail} fallan`);
process.exit(fail ? 1 : 0);
