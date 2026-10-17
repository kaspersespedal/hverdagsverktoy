/* ═══════════════════════════════════════════════════════════
   gen-no-lett.js — bygger shared/lang/no-lett.js fra no.js.

   Kjør fra repo-rota etter hver endring i no.js:  node scripts/gen-no-lett.js

   Bakgrunn (2026-10-17, forsøk): no.js er 407 KB (116 KB komprimert) og
   lastes på alle sider, men /skatt/inntekt/ og /boliglan/mor/ leser bare
   188 av 3 655 nøkler. Disse to sidene laster no-lett.js i stedet:
   3 KB komprimert, kalkulatoren klar ~0,85 s tidligere på telefon.

   Nøklene hentes fra to steder:
   1. nøklene som står i no-lett.js fra før (funnet ved å spore hvilke
      nøkler sidene faktisk leser i nettleseren, også core.js sine), og
   2. alle ord i sidenes egen HTML som er en nøkkel i no.js
      (data-i18n-attributter og R().x i sidenes skript).
   Verdiene hentes alltid fra no.js, så endret tekst i no.js følger med.

   Det skriptet IKKE fanger: en ny nøkkel som bare core.js eller en annen
   delt fil leser på disse sidene. Den må legges til for hånd i NEW_KEYS.
   Mangler en nøkkel, faller data-i18n tilbake til den norske HTML-teksten.
   ═══════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['skatt/inntekt/index.html', 'boliglan/mor/index.html'];
const OUT = path.join(ROOT, 'shared/lang/no-lett.js');
const NEW_KEYS = [];

function load(file) {
  const ctx = { REGIONS: {}, window: {}, document: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  return ctx.REGIONS.no || {};
}

function ser(v) {
  if (typeof v === 'function') return v.toString();
  if (Array.isArray(v)) return '[' + v.map(ser).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).map(k => JSON.stringify(k) + ':' + ser(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

const no = load(path.join(ROOT, 'shared/lang/no.js'));
const old = fs.existsSync(OUT) ? load(OUT) : {};
const want = new Set(Object.keys(old).concat(NEW_KEYS));
for (const p of PAGES) {
  for (const w of fs.readFileSync(path.join(ROOT, p), 'utf8').match(/[A-Za-z_$][\w$]*/g)) want.add(w);
}

const keys = Object.keys(no).filter(k => want.has(k));
const body = keys.map(k =>
  '    ' + (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + ser(no[k])
).join(',\n');

const src =
  '// Hverdagsverktøy — no-lett.js: utdrag av no.js for /' + PAGES.map(p => p.replace(/index\.html$/, '')).join(' og /') + '.\n' +
  '// Generert av scripts/gen-no-lett.js — ikke rediger for hånd.\n' +
  "REGIONS['no'] = {\n" + body + '\n};\n';

fs.writeFileSync(OUT, src, 'utf8');
const added = keys.filter(k => !(k in old)).length;
const removed = Object.keys(old).filter(k => !keys.includes(k)).length;
console.log('no-lett.js skrevet: ' + keys.length + ' av ' + Object.keys(no).length +
  ' nøkler (' + added + ' nye, ' + removed + ' fjernet), ' + Buffer.byteLength(src) + ' byte.');
