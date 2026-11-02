/* ForestPro — forest inventory, mensuration, biomass, carbon and agroforestry, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* ForestPro — global state and shared utilities of the interface.
   No ES modules: everything hangs from window so the app also works when
   index.html is opened with a double click (file://). */

const state = {
  /* the inventory every block can use: trees and plots of the last data loaded */
  inv: null,          // {name, trees: [...], plots: [...], source}
  /* results, one slot per block */
  dendro: null,       // Block 2
  inventory: null,    // Block 3
  biomass: null,      // Block 4
  growth: null,       // Block 5
  diversity: null,    // Block 6
  agro: null,         // Block 7
  map: null,          // Block 8
  tools: null,        // Block 9
  /* what each block hands to the report: {block: [{kind, title, svg|table|html}]} */
  report: {},
};
window.state = state;

/* the ten blocks of the app, in navigation order; every block is open from the start */
const STEPS = [
  { n: 1, es: 'Inicio', en: 'Home' },
  { n: 2, es: 'Dasometría', en: 'Tree mensuration' },
  { n: 3, es: 'Inventario y muestreo', en: 'Inventory and sampling' },
  { n: 4, es: 'Biomasa y carbono', en: 'Biomass and carbon' },
  { n: 5, es: 'Crecimiento y rendimiento', en: 'Growth and yield' },
  { n: 6, es: 'Diversidad y ecología', en: 'Diversity and ecology' },
  { n: 7, es: 'Sistemas agroforestales', en: 'Agroforestry systems' },
  { n: 8, es: 'Mapas', en: 'Maps' },
  { n: 9, es: 'Utilidades forestales', en: 'Forestry tools' },
  { n: 10, es: 'Informe y proyecto', en: 'Report and project' },
];

/* ---------------- DOM ---------------- */
function el(id) { return document.getElementById(id); }
function els(sel, root) { return [...(root || document).querySelectorAll(sel)]; }
function mk(tag, attrs, html) {
  const n = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'style') n.setAttribute('style', attrs[k]);
    else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  }
  if (html != null) n.innerHTML = html;
  return n;
}
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* bilingual inline HTML: both spans are written, CSS shows the active one */
/* an <option> in both languages: I18N.apply() swaps its text when the language changes.
   Used as `<option value="v"${optL('texto', 'text')}</option>` (it closes the opening tag itself). */
function optL(es, en) { return ` data-es="${esc(es)}" data-en="${esc(en == null ? es : en)}">${esc(T(es, en))}`; }
function L2(es, en) { return `<span data-l="es">${es}</span><span data-l="en">${en == null ? es : en}</span>`; }
/* labels written in capitals by CSS (field labels, tile labels): symbols and units must keep their case,
   so Greek letters, «Mg» and every parenthesis that holds a unit go inside <span class="nc"> (text-transform: none) */
const NC_UNIT = /[\/%°²³₀-₉Ͱ-Ͽ]|(^|[\s(])(?:Mg|kg|g|cm|mm|m|km|ha|t|lb|ft|in|ac|dm|µm)(?=$|[\s)·,])/;
function noCaps(html) {
  return String(html).split(/(<[^>]+>)/).map((part, i) => i % 2 ? part : part
    .replace(/\([^()<>]*\)|[Ͱ-Ͽ]+|\bMg\b|CO₂e?/g, m => m[0] === '(' && !NC_UNIT.test(m.slice(1, -1)) ? m : `<span class="nc">${m}</span>`)).join('')
    .replace(/<span class="nc">([^<]*)<span class="nc">([^<]*)<\/span>([^<]*)<\/span>/g, '<span class="nc">$1$2$3</span>');
}
const NC_SEL = '.field > label, .stat-label, .inc-set > legend';
function guardCaps(node) {
  if (!node || node.nodeType !== 1) return;
  const list = node.matches && node.matches(NC_SEL) ? [node] : [...node.querySelectorAll(NC_SEL)];
  list.forEach(l => { if (l.dataset.nc || l.hasAttribute('data-es') || l.querySelector('input,select,textarea')) return; l.dataset.nc = '1'; const h = noCaps(l.innerHTML); if (h !== l.innerHTML) l.innerHTML = h; });
}
document.addEventListener('DOMContentLoaded', () => {
  guardCaps(document.body);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(guardCaps))).observe(document.body, { childList: true, subtree: true });
});
function showMessage(container, type, text) {
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  type = { warn: 'warning', ok: 'success' }[type] || type;
  const div = mk('div', { class: 'msg msg-' + type }, text);
  if (window.LABG) LABG.messageRole(div, type);
  container.appendChild(div);
  return div;
}
function clearMessages(container) {
  if (typeof container === 'string') container = el(container);
  if (container) container.innerHTML = '';
}

/* ---------------- numbers ----------------
   Decimal point and comma for thousands in both languages (the custom in
   Mexico and in English); the minus is the typographic one. */
function fmtNum(v, d, o) {
  if (v == null || typeof v !== 'number' || !isFinite(v)) return '—';
  d = d == null ? 2 : d;
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: !(o && o.plain) });
  return (v < 0 && +s.replace(/,/g, '') !== 0 ? '−' : '') + s;
}
/* significant figures for coefficients that may be tiny or huge */
function fmtSig(v, s) {
  if (v == null || !isFinite(v)) return '—';
  s = s || 4;
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) return (v < 0 ? '−' : '') + a.toExponential(s - 1).replace('e', '×10^').replace(/\^\+?(-?\d+)/, (m, e) => '<sup>' + e.replace('-', '−') + '</sup>');
  const d = a === 0 ? s - 1 : Math.max(0, s - 1 - Math.floor(Math.log10(a)));
  return fmtNum(v, Math.min(d, 8), { plain: true });
}
function fmtP(p) {
  if (p == null || !isFinite(p)) return '—';
  if (p < 0.001) return '< 0.001';
  return fmtNum(p, 3);
}
function fmtPct(v, d) { return v == null || !isFinite(v) ? '—' : fmtNum(v, d == null ? 1 : d) + ' %'; }

/* ---------------- downloads ---------------- */
function download(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = mk('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const slug = s => String(s || 'forestpro').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();

/* ---------------- step navigation ---------------- */
function goStep(n) {
  n = String(n);
  els('.step-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + n));
  els('.step-btn').forEach(b => b.classList.toggle('active', b.dataset.step === n));
  document.body.classList.toggle('on-home', n === '1');
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const btn = stepBtn(n);
  if (window.LABG) {
    LABG.setCurrentStep(n);
    if (btn) LABG.announce(T('Bloque ', 'Block ') + stepName(n));
  } else if (btn && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  refreshStepMarks();
  refreshStepFooters();
  document.dispatchEvent(new CustomEvent('stepchange', { detail: { step: Number(n) } }));
}
const stepBtn = n => document.querySelector('.step-btn[data-step="' + n + '"]');
const stepOn = n => { const b = stepBtn(n); return !!b && !b.disabled; };
function stepName(n) {
  const s = STEPS.find(x => String(x.n) === String(n));
  return s ? s.n + ' · ' + T(s.es, s.en) : String(n);
}
/* a block counts as done when the result it hands on is in `state` */
const STEP_RESULT = { 2: 'dendro', 3: 'inventory', 4: 'biomass', 5: 'growth', 6: 'diversity', 7: 'agro', 8: 'map', 9: 'tools' };
function refreshStepMarks() {
  if (!window.LABG) return;
  STEPS.forEach(s => {
    const key = STEP_RESULT[s.n];
    if (!key) return;
    LABG.markStep(s.n, state[key] ? 'done' : null);
  });
}
/* footer of every block: Previous / Next, with the name of the block */
function refreshStepFooters() {
  if (!window.LABG) return;
  els('.step-panel').forEach(p => {
    const n = Number(p.id.replace('panel-', ''));
    const i = STEPS.findIndex(s => s.n === n);
    if (i < 0) return;
    let f = p.querySelector(':scope > .step-footer');
    if (!f) {
      f = mk('nav', { class: 'step-footer no-print' });
      f.innerHTML = '<button type="button" class="btn btn-secondary prev"></button><button type="button" class="btn btn-primary next"></button>';
      f.addEventListener('click', e => { const b = e.target.closest('button[data-go]'); if (b && !b.disabled) goStep(b.dataset.go); });
      p.appendChild(f);
    }
    f.setAttribute('aria-label', T('Bloques', 'Blocks'));
    const prev = STEPS[i - 1], next = STEPS[i + 1];
    const label = s => L2(s.n + ' · ' + s.es, s.n + ' · ' + s.en);
    const bp = f.querySelector('.prev'), bn = f.querySelector('.next');
    bp.hidden = !prev;
    if (prev) { bp.dataset.go = prev.n; bp.innerHTML = `← <span><small>${L2('Anterior', 'Previous')}</small>${label(prev)}</span>`; }
    bn.hidden = !next;
    if (next) { bn.dataset.go = next.n; bn.innerHTML = `<span><small>${L2('Siguiente', 'Next')}</small>${label(next)}</span> →`; }
  });
}
function buildStepper() {
  const nav = el('stepper');
  if (!nav || nav.children.length) return;
  nav.innerHTML = STEPS.map(s => `<button type="button" class="step-btn${s.n === 1 ? ' active' : ''}" data-step="${s.n}"><span class="step-num">${s.n}</span>${L2(s.es, s.en)}</button>`).join('');
  nav.addEventListener('click', e => { const b = e.target.closest('.step-btn'); if (b && !b.disabled) goStep(b.dataset.step); });
}
function paintCommonBar() {
  if (!window.LABG) return;
  LABG.theme.key = 'forestpro:theme';
  LABG.theme.paint();
  const nav = el('stepper');
  if (nav) nav.setAttribute('aria-label', T('Bloques', 'Blocks'));
}

/* runs a long synchronous computation once the browser has painted, inside the suite's wait
   (LABGfx.loading: the growth rings of ForestPro over the results panel) */
async function runWork(title, task, o) {
  o = o || {};
  /* the project of Block 10 waits for the work in course before its next step */
  window.FP_BUSY = (window.FP_BUSY || 0) + 1;
  try {
    /* the wait waits for a painted frame: in a hidden tab there are none, so the work runs without it */
    if (window.LABGfx && LABGfx.loading && !window.FP_REPLAY && document.visibilityState !== 'hidden') {
      return await LABGfx.loading.run({ titulo: title, mensaje: o.message || '', pasos: o.steps || 0 }, async step => task(step));
    }
    await new Promise(r => setTimeout(r, 0));
    return await task(() => {});
  } finally { window.FP_BUSY--; }
}

/* Persisted preferences */
const Prefs = {
  get(k, d) { try { const v = localStorage.getItem('forestpro:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('forestpro:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback || '#1B5E20';
}
function isDark() { return window.Theme ? Theme.current() === 'dark' : false; }

/* wired after every DOMContentLoaded handler has run */
document.addEventListener('DOMContentLoaded', () => {
  buildStepper();
  setTimeout(() => {
    if (!window.LABG) return;
    if (LABG.work) {
      LABG.work.tips = [
        ['El DAP se mide a 1.30 m sobre el suelo, del lado de arriba de la pendiente.', 'DBH is measured 1.30 m above the ground, on the uphill side.'],
        ['El error de muestreo baja con la raíz de n: para reducirlo a la mitad hacen falta cuatro veces más parcelas.', 'Sampling error falls with the square root of n: halving it takes four times as many plots.'],
        ['La densidad de la madera pesa tanto como la altura en la biomasa: revísala especie por especie.', 'Wood density weighs as much as height on biomass: check it species by species.'],
      ];
    }
    const hb = el('helpBtn');
    if (hb) hb.addEventListener('click', () => LABG.showShortcuts());
    LABG.shortcuts([]);
    LABG.bindStepKeys(goStep);
    LABG.guardUnload(() => !window.FP_NO_GUARD && (!!state.inv || Object.keys(STEP_RESULT).some(k => !!state[STEP_RESULT[k]])));
    LABG.setCurrentStep((document.querySelector('.step-btn.active') || {}).dataset?.step || '1');
    document.addEventListener('themechange', paintCommonBar);
    document.addEventListener('langchange', () => { paintCommonBar(); refreshStepFooters(); });
    paintCommonBar();
    refreshStepMarks();
    refreshStepFooters();
  }, 0);
});

Object.assign(window, {
  STEPS, el, els, mk, esc, L2, noCaps, showMessage, clearMessages,
  fmtNum, fmtSig, fmtP, fmtPct, download, slug,
  goStep, stepOn, stepName, refreshStepMarks, runWork, Prefs, cssVar, isDark,
});
