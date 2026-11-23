/* ═══════════════════════════════════════════════════════════
   gen-ordliste.js — bygger ordene på /ordliste/ fra shared/ordliste.js.

   Kjør fra repo-rota:  node scripts/gen-ordliste.js

   Skriver alt mellom <!-- ORDLISTE:START --> og <!-- ORDLISTE:END -->
   i ordliste/index.html, så ordene står i HTML-en (lesbare uten JavaScript
   og for søkemotorer). Sjekker også at hver «Les mer»-lenke peker på en
   side som finnes, og at ankeret (#...) står i den sida. Feiler med
   exit-kode 1 hvis noe er galt, og skriver da ingenting.
   ═══════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'shared', 'ordliste.js');
const SIDE = path.join(ROOT, 'ordliste', 'index.html');

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(DATA, 'utf8'), ctx);
const ord = ctx.window.HVT_ORDLISTE;

const feil = [];
const ids = new Set();
const sideCache = {};
for (const o of ord) {
  if (!o.id || !o.ord || !o.omr || !o.tekst) feil.push(`mangler felt: ${JSON.stringify(o).slice(0, 80)}`);
  if (!/^[a-z0-9-]+$/.test(o.id)) feil.push(`ugyldig id: ${o.id}`);
  if (ids.has(o.id)) feil.push(`dobbel id: ${o.id}`);
  ids.add(o.id);
  if (o.direkte && !o.side) feil.push(`${o.id}: direkte uten side`);
  if (!o.side) continue;
  const [sti, anker] = o.side.split('#');
  const fil = path.join(ROOT, sti, 'index.html');
  if (!fs.existsSync(fil)) { feil.push(`${o.id}: finner ikke siden ${sti}`); continue; }
  const html = sideCache[fil] || (sideCache[fil] = fs.readFileSync(fil, 'utf8'));
  if (anker && !html.includes(`id="${anker}"`)) feil.push(`${o.id}: finner ikke #${anker} på ${sti}`);
}
if (feil.length) { console.error(feil.join('\n')); process.exit(1); }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sortert = ord.slice().sort((a, b) => a.ord.localeCompare(b.ord, 'nb'));
const bokstavAv = o => {
  const c = o.ord.charAt(0).toLocaleUpperCase('nb');
  return /[A-ZÆØÅ]/.test(c) ? c : '#';
};
const grupper = new Map();
for (const o of sortert) {
  const b = bokstavAv(o);
  if (!grupper.has(b)) grupper.set(b, []);
  grupper.get(b).push(o);
}
const anker = b => 'bokstav-' + b.toLowerCase().replace('æ', 'ae').replace('ø', 'o').replace('å', 'aa');
const omrader = [...new Set(ord.map(o => o.omr))];

const ut = [];
ut.push(`<p class="ol-antall">${ord.length} ord</p>`);
ut.push('<div class="ol-omr-valg" role="group" aria-label="Vis ord fra">');
ut.push('  <button type="button" class="ol-chip" data-omr="" aria-pressed="true">Alle</button>');
for (const a of omrader) ut.push(`  <button type="button" class="ol-chip" data-omr="${esc(a)}" aria-pressed="false">${esc(a)}</button>`);
ut.push('</div>');
ut.push('<nav class="ol-bokstaver" aria-label="Hopp til bokstav">');
for (const b of grupper.keys()) ut.push(`  <a href="#${anker(b)}">${b}</a>`);
ut.push('</nav>');
for (const [b, liste] of grupper) {
  ut.push(`<section class="ol-bokstav" id="${anker(b)}" aria-labelledby="${anker(b)}-h">`);
  ut.push(`  <h2 id="${anker(b)}-h">${b}</h2>`);
  ut.push('  <dl class="ol-liste">');
  for (const o of liste) {
    const sok = [o.ord].concat(o.alias || []).join(' ').toLowerCase();
    ut.push(`    <div class="ol-ord" id="${o.id}" data-omr="${esc(o.omr)}" data-sok="${esc(sok)}">`);
    ut.push(`      <dt>${esc(o.ord)} <span class="ol-omr">${esc(o.omr)}</span></dt>`);
    ut.push(`      <dd><p>${esc(o.tekst)}</p>${o.side ? `<a class="ol-mer" href="${esc(o.side)}">Les mer</a>` : ''}</dd>`);
    ut.push('    </div>');
  }
  ut.push('  </dl>');
  ut.push('</section>');
}
ut.push('<p class="ol-tomt" hidden>Fant ingen ord. Prøv et annet ord, eller <a href="/kontakt/">si fra</a> hvis du savner et.</p>');

const html = fs.readFileSync(SIDE, 'utf8');
const start = '<!-- ORDLISTE:START -->', slutt = '<!-- ORDLISTE:END -->';
const i = html.indexOf(start), j = html.indexOf(slutt);
if (i < 0 || j < 0) { console.error('fant ikke markørene i ordliste/index.html'); process.exit(1); }
const nl = html.includes('\r\n') ? '\r\n' : '\n';
const nytt = html.slice(0, i + start.length) + nl + ut.join(nl) + nl + html.slice(j);
fs.writeFileSync(SIDE, nytt);
console.log(`ordliste/index.html: ${ord.length} ord, ${grupper.size} bokstaver, ${omrader.length} områder — alle lenker finnes`);
