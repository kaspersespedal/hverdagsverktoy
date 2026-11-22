/* ═══════════════════════════════════════════════════════════
   neste-sw.js — finner neste ledige sw-versjon (CACHE_NAME i sw.js).

   Kjør fra repo-rota:  node scripts/neste-sw.js
   Krever git og gh (innlogget). Leser sw.js på origin/main og i alle
   åpne PR-er, og skriver neste ledige nummer.

   Velg nummeret rett før merge, ikke når arbeidet starter: to grener som
   tar samme nummer gir ingen konflikt i git, men den siste av dem når ikke
   dem som allerede har siden i cache (se sw.js).

   node scripts/neste-sw.js --sjekk [PR-nummer]
     Feiler hvis sw.js i denne sjekkouten har samme nummer som en annen
     åpen PR. Kjøres av .github/workflows/sjekk.yml.
   ═══════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
const versjon = txt => {
  const m = (txt || '').match(/CACHE_NAME\s*=\s*'hverdagsverktoy-v(\d+)'/);
  return m ? Number(m[1]) : NaN;
};

const sjekk = process.argv[2] === '--sjekk';
const egenPr = Number(process.argv[3]) || 0;

try { run('git', ['fetch', '-q', 'origin', 'main']); } catch (e) { /* bruk det vi har */ }
const vMain = versjon(run('git', ['show', 'origin/main:sw.js']));

const prer = JSON.parse(run('gh', ['pr', 'list', '--state', 'open', '--limit', '100',
  '--json', 'number,title,headRefOid,isDraft']));
const rader = [];
for (const pr of prer) {
  let v = NaN;
  try {
    v = versjon(run('gh', ['api', '-H', 'Accept: application/vnd.github.raw',
      'repos/{owner}/{repo}/contents/sw.js?ref=' + pr.headRefOid]));
  } catch (e) { /* PR-en har ikke sw.js */ }
  rader.push({ nr: pr.number, v, tittel: pr.title, utkast: pr.isDraft });
}

console.log('main: v' + vMain);
for (const r of rader.sort((a, b) => (b.v || 0) - (a.v || 0))) {
  const merk = Number.isNaN(r.v) ? '' : r.v <= vMain ? '  (ikke høyere enn main: trenger nytt nummer hvis PR-en endrer nettstedsfiler)' : '';
  console.log('#' + r.nr + ': ' + (Number.isNaN(r.v) ? '–' : 'v' + r.v) + (r.utkast ? ' (utkast)' : '') + merk + '  ' + r.tittel);
}
const hoyest = Math.max(vMain, ...rader.map(r => r.v).filter(v => !Number.isNaN(v)));
console.log('\nNeste ledige: v' + (hoyest + 1));

if (sjekk) {
  const vHer = versjon(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'));
  const like = rader.filter(r => r.nr !== egenPr && r.v === vHer && vHer > vMain);
  if (like.length) {
    console.error('\nsw.js har v' + vHer + ', men det har også ' +
      like.map(r => '#' + r.nr).join(', ') + '. Ta neste ledige: v' + (hoyest + 1) + '.');
    process.exit(1);
  }
  console.log('Ingen annen åpen PR har v' + vHer + '.');
}
