/* ═══════════════════════════════════════════════════════════
   gen-no-lett.js — bygger de lette norske språkfilene fra no.js.

   Kjør fra repo-rota etter hver endring i no.js eller i en side:
     node scripts/gen-no-lett.js            skriver filene
     node scripts/gen-no-lett.js --sjekk    skriver ingenting, feiler hvis en fil er utdatert
                                            (kjøres av scripts/sjekk-pr.js på hver PR)

   Bakgrunn: no.js er ~380 KB (~110 KB komprimert) og ble lastet på over 100
   sider, men teksten står allerede i HTML-en. En side leser bare noen hundre
   av ~3 500 nøkler. Forsøket på to sider 2026-10-17 ga kalkulatoren klar
   ~0,85 s tidligere på telefon.

   Hver side laster én lett fil for sin seksjon: <script src="/shared/lang/no-lett/skatt.js">.
   Det er sidens egen lenke som avgjør hvilken fil den hører til. En ny side i
   en seksjon trenger bare samme lenke som søsknene, og så kjøre dette skriptet.

   Nøklene en fil får (for alle sidene som lenker til den):
   1. hvert ord i sidens HTML og skript som er en nøkkel i no.js
      (data-i18n-attributter, R().x, T('x') osv.),
   2. hvert ord i de delte skriptene siden laster (core.js, search.js, timer.js …),
   3. nøkler som koden setter sammen av et ord og en hale:
      prefix + 'Rows'/'Lead'/'P1'/'Helper'/'Outro'/'Title' (forklaringsboksene),
      nøkkel + '_one'/'_few' (flertall) og 'trBokKonstNavn_' + nummer,
   4. alle nøkler med et forledd fra FORLEDD, for delte skript som setter
      nøkkelen sammen av forleddet og et navn (temavelgeren i top-chrome.js),
   5. EKSTRA under, for nøkler ingen av reglene finner.
   Verdiene hentes alltid fra no.js, så endret tekst i no.js følger med når
   skriptet kjøres.

   Mangler en nøkkel likevel, faller data-i18n tilbake til den norske teksten
   i HTML-en, og T(nøkkel, norsk) til sin norske reservetekst.
   ═══════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIR = 'shared/lang/no-lett';
const LENKE = /\/shared\/lang\/no-lett\/([a-z0-9-]+)\.js/;
const SJEKK = process.argv.includes('--sjekk');

// Delte skript som lastes av et annet skript, ikke av sidens egen <script>-lenke.
const LASTER_OGSA = {
  '/shared/top-chrome.js': ['/shared/timer.js'],
  '/shared/site-shell.js': ['/shared/learn.js'],
  '/shared/search.js': ['/shared/ordliste.js', '/shared/search-intents.js'],
  '/shared/ordforklaring.js': ['/shared/ordliste.js']
};
// Haler koden setter på et ord: forklaringsboksene (renderHowto), flertall (_one, _few …), løpenummer.
const HALE = /^(?:Rows|Lead|P\d{1,2}|Helper|Outro|Title|_[a-z]+|_?\d+)$/;
// Delte skript som setter sammen nøkkelen av et fast forledd og et navn: alle nøkler med forleddet.
const FORLEDD = {
  '/shared/top-chrome.js': ['tcTheme', 'tcSub'] // tcKey(tema, 'tcTheme'): temanavnene i temavelgeren
};
// Nøkler som leses uten at noen regel over finner dem. Hold lista kort, og skriv hvorfor.
const EKSTRA = [];

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
const KEYS = Object.keys(no);

// Ord i en tekst, også med punktum («fr.title»). Hvert ord gir seg selv, delene
// mellom punktumene, og nøklene som er ordet + en hale fra HALE.
function ordI(txt, ut) {
  const ord = new Set();
  for (const w of txt.match(/[A-Za-z_$][\w$]*(?:\.[\w$]+)*/g) || []) {
    ord.add(w);
    if (w.includes('.')) w.split('.').forEach(d => ord.add(d));
  }
  for (const k of KEYS) {
    if (ord.has(k)) { ut.add(k); continue; }
    // Lengste ord som er starten på nøkkelen, og resten er en hale.
    for (let i = k.length - 1; i > 1; i--) {
      if (ord.has(k.slice(0, i)) && HALE.test(k.slice(i))) { ut.add(k); break; }
    }
  }
  return ut;
}

const delt = {};
function deltSkript(src, ut, sett) {
  if (sett.has(src)) return;
  sett.add(src);
  const fil = path.join(ROOT, src.replace(/^\//, ''));
  if (!fs.existsSync(fil)) return;
  if (!delt[src]) {
    delt[src] = ordI(fs.readFileSync(fil, 'utf8'), new Set());
    for (const f of FORLEDD[src] || []) KEYS.filter(k => k.startsWith(f)).forEach(k => delt[src].add(k));
  }
  delt[src].forEach(k => ut.add(k));
  (LASTER_OGSA[src] || []).forEach(s => deltSkript(s, ut, sett));
}

// Sidene som lenker til en lett fil, gruppert etter fila.
const sider = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const grupper = {};
for (const p of sider) {
  const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
  const m = html.match(LENKE);
  if (!m) continue;
  const ut = grupper[m[1]] || (grupper[m[1]] = { sider: [], nokler: new Set(EKSTRA) });
  ut.sider.push(p);
  ordI(html, ut.nokler);
  const sett = new Set();
  for (const s of html.match(/\/shared\/[\w./-]+\.js/g) || []) if (!s.includes('/lang/')) deltSkript(s, ut.nokler, sett);
}

const utdatert = [];
const filer = new Set();
for (const navn of Object.keys(grupper).sort()) {
  const g = grupper[navn];
  const keys = KEYS.filter(k => g.nokler.has(k));
  const body = keys.map(k => '    ' + (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + ser(no[k])).join(',\n');
  const src =
    '// Hverdagsverktøy — no-lett/' + navn + '.js: utdrag av no.js for ' + g.sider.length + ' side(r):\n' +
    '// ' + g.sider.map(p => '/' + p.replace(/index\.html$/, '')).join(' ') + '\n' +
    '// Generert av scripts/gen-no-lett.js — ikke rediger for hånd.\n' +
    "REGIONS['no'] = {\n" + body + '\n};\n';
  const fil = path.join(ROOT, DIR, navn + '.js');
  filer.add(navn + '.js');
  // Git på Windows (core.autocrlf) sjekker ut med CRLF: sammenlign uten linjeslutt-forskjell.
  const gammel = fs.existsSync(fil) ? fs.readFileSync(fil, 'utf8').replace(/\r\n/g, '\n') : null;
  if (gammel !== src) {
    utdatert.push(DIR + '/' + navn + '.js');
    if (!SJEKK) { fs.mkdirSync(path.dirname(fil), { recursive: true }); fs.writeFileSync(fil, src, 'utf8'); }
  }
  console.log((navn + '.js').padEnd(16) + String(keys.length).padStart(5) + ' av ' + KEYS.length + ' nøkler, ' +
    String(Math.round(Buffer.byteLength(src) / 1024)).padStart(3) + ' KB, ' + g.sider.length + ' side(r)');
}
// Filer ingen side lenker til lenger.
const mappe = path.join(ROOT, DIR);
for (const f of fs.existsSync(mappe) ? fs.readdirSync(mappe) : []) {
  if (f.endsWith('.js') && !filer.has(f)) {
    utdatert.push(DIR + '/' + f + ' (ingen side lenker til den)');
    if (!SJEKK) fs.unlinkSync(path.join(mappe, f));
  }
}

if (SJEKK && utdatert.length) {
  console.error('\nDe lette språkfilene er utdatert (no.js eller en side er endret):\n  ' + utdatert.join('\n  ') +
    '\nKjør: node scripts/gen-no-lett.js');
  process.exit(1);
}
console.log(utdatert.length ? '\n' + (SJEKK ? '' : 'Skrevet: ') + utdatert.join(', ') : '\nAlle lette språkfiler er oppdatert.');
