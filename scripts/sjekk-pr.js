/* ═══════════════════════════════════════════════════════════
   sjekk-pr.js — enkle kontroller før en endring går til main.

   Kjør fra repo-rota:  node scripts/sjekk-pr.js [base]   (base = origin/main)
   Kjøres automatisk på hver PR av .github/workflows/sjekk.yml.

   1. Syntaks: `node --check` på alle JS-filer i repoet. En skrivefeil i
      core.js eller search.js ødelegger ellers alle sider for alle.
   2. Service worker: endrer PR-en filer som nettstedet serverer, må
      CACHE_NAME i sw.js være høyere enn på main. sw.js bruker cache-first
      med ignoreSearch, og filer med ?v= hentes aldri på nytt i bakgrunnen,
      så uten nytt CACHE_NAME når endringen ikke dem som har vært innom før.
   3. Lærebokinnholdet: ingen commit i PR-en kan ha docs/referanse/ eller
      matematikk-22a-fila (fjernet av opphavsrettsgrunner 2026-08-19).
   ═══════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const base = process.argv[2] || 'origin/main';
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = s => s.split('\n').map(l => l.trim()).filter(Boolean);
const feil = [];

// 1. Syntaks
const jsFiler = lines(git('ls-files', '*.js', '*.mjs'));
for (const f of jsFiler) {
  const r = spawnSync(process.execPath, ['--check', f], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) feil.push('Syntaksfeil i ' + f + ':\n' + (r.stderr || '').trim());
}
console.log('Syntaks: ' + jsFiler.length + ' JS-filer sjekket.');

// 2. Service worker-versjon
// Filer som ikke serveres til besøkende (eller ikke caches av sw.js) krever ikke nytt CACHE_NAME.
const IKKE_NETTSIDE = /^(\.github\/|scripts\/)|\.md$|^(\.gitignore|sitemap\.xml|robots\.txt|CNAME|LICENSE|llms\.txt)$/;
const endret = lines(git('diff', '--name-only', base + '...HEAD'));
const nettside = endret.filter(f => !IKKE_NETTSIDE.test(f));
const versjon = txt => {
  const m = txt.match(/CACHE_NAME\s*=\s*'hverdagsverktoy-v(\d+)'/);
  return m ? Number(m[1]) : NaN;
};
const vBase = versjon(git('show', base + ':sw.js'));
const vHer = versjon(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'));
if (Number.isNaN(vHer) || Number.isNaN(vBase)) {
  feil.push('Fant ikke CACHE_NAME = \'hverdagsverktoy-vNNN\' i sw.js.');
} else if (nettside.length && vHer <= vBase) {
  feil.push('sw.js har v' + vHer + ', men main har v' + vBase + '. PR-en endrer ' + nettside.length +
    ' nettstedsfil(er) (f.eks. ' + nettside.slice(0, 3).join(', ') + '), så CACHE_NAME må opp.\n' +
    'Finn neste ledige nummer med: node scripts/neste-sw.js');
}
console.log('Service worker: main v' + vBase + ', denne grenen v' + vHer + ', ' + nettside.length + ' nettstedsfil(er) endret.');

// 3. Lærebokinnholdet i noen commit i PR-en
const LAEREBOK = /(^|\/)docs\/referanse\/|matematikk-22a/;
const navn = lines(git('log', '-m', '--format=', '--name-only', base + '..HEAD'));
const treff = [...new Set(navn.filter(n => LAEREBOK.test(n)))];
if (treff.length) {
  feil.push('Commits i denne PR-en inneholder lærebokinnhold som ble fjernet 2026-08-19:\n  ' + treff.join('\n  '));
}
console.log('Lærebokinnhold: ' + (treff.length ? treff.length + ' treff' : 'ingen treff') + '.');

if (feil.length) {
  console.error('\n' + feil.length + ' feil:\n\n' + feil.join('\n\n'));
  process.exit(1);
}
console.log('\nAlt i orden.');
