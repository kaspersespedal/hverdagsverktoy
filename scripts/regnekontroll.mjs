// scripts/regnekontroll.mjs — automatisk regnekontroll av de mest brukte kalkulatorene.
//
//   node scripts/regnekontroll.mjs                 kjører alle kontrollene
//   node scripts/regnekontroll.mjs --only uttak    bare kontroller der siden/navnet inneholder «uttak»
//   node scripts/regnekontroll.mjs --list          viser kontrollene uten å kjøre dem
//   node scripts/regnekontroll.mjs --vis           skriver også de leste tallene for kontroller som består
//   (valgfritt: --port 8346  --edge <sti til msedge.exe>  --root <mappe med nettstedet>)
//
// Slik virker den: scriptet starter en lokal webtjener og en skjult Edge, åpner hver kalkulator,
// fyller inn tallene fra kontrollen, leser tallene siden viser og sammenligner med FASIT.
// Fasiten er regnet ut her i fila med egne små funksjoner og satser skrevet rett inn (2026-satser,
// kilde: Stortingets skattevedtak FOR-2025-12-18-2747, skatteetaten.no/satser og nav.no/grunnbelopet,
// kontrollert mot primærkildene i P06/P10 2026-11-19/21). Den leser ALDRI satser eller formler fra
// sidene, så en feil sats eller formel i en kalkulator blir fanget av at tallene ikke stemmer.
// Ved årsskiftet: oppdater SATS-blokka under samtidig med shared/satser.js.
//
// Krever Node 22+, Python (for http.server) og Microsoft Edge. Kontrollene endrer ingen kalkulator.
// Avslutter med kode 1 hvis noe feiler, så den kan kjøres før hver sammenslåing.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) A[av[i].slice(2)] = av[i + 1] && !av[i + 1].startsWith('--') ? av[++i] : true;
const ROOT = A.root || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +A.port || 8346;
const EDGE = A.edge || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p)) || 'msedge';

// ─── Fasit: satser 2026, skrevet inn for hånd (ikke lest fra shared/satser.js) ───
const SATS = {
  trinn: [[226100, 318300, 0.017], [318300, 725050, 0.040], [725050, 980100, 0.137], [980100, 1467200, 0.168], [1467200, Infinity, 0.178]],
  minste: 0.46, minsteMaks: 95700, personfradrag: 114540, alm: 0.22,
  trygdLonn: 0.076, trygdNaering: 0.108, trygdNedre: 99650, opptrapping: 0.25,
  oppjustering: 1.72, G2025: 130160,
};
const trinnskatt = pi => SATS.trinn.reduce((s, [f, t, r]) => s + Math.max(0, Math.min(pi, t) - f) * r, 0);
const trygd = (pi, sats) => pi <= SATS.trygdNedre ? 0 : Math.min(sats * pi, SATS.opptrapping * (pi - SATS.trygdNedre));
// Lønnstaker uten andre fradrag, klasse 1
function lonnSkatt(brutto) {
  const minste = Math.min(SATS.minste * brutto, SATS.minsteMaks);
  const alm = Math.max(0, brutto - minste - SATS.personfradrag) * SATS.alm;
  const t = trinnskatt(brutto), tr = trygd(brutto, SATS.trygdLonn);
  return { alm, trinn: t, trygd: tr, total: alm + t + tr };
}
// Annuitetslån: månedsbeløp. Serielån: sum renter = r·P·(n+1)/2
const annuitet = (P, rAar, n) => { const r = rAar / 1200; return P * r / (1 - Math.pow(1 + r, -n)); };

// ─── Kontrollene. forvent: [etikett, fasit, tillatt avvik] (standard 1 = én krone, rundingen i sidene) ───
const C = (side, navn, sett, forvent) => ({ side, navn, sett, forvent });
const L = lonnSkatt;
const FERIE = /Daglig sats\n[\d ]+ kr\nFeriepenger\n/; // resultatkortet, ikke overskriften
const AGA = /\nAGA\n/; // resultatraden «AGA», ikke «AGA-sone» i overskriften
const rad = navn => new RegExp('\n' + navn + '\n', 'i'); // egen linje i resultatkortet, ikke ingress eller forklaring
const TRYGD = rad('Trygdeavgift'), TRINN = rad('Trinnskatt'), UTBET = rad('Utbetalt per måned');
const T = 250 * 37.5 * 47;
const CASES = [
  // 1. Inntektsskatt
  C('/skatt/inntekt/', 'inntekt 450 000', { '#inn-brutto': '450000' },
    [['Brutto / mnd', 37500], ['Total skatt', L(450000).total], [TRINN, L(450000).trinn], ['Alminnelig', L(450000).alm], [TRYGD, L(450000).trygd], ['Netto / mnd', (450000 - L(450000).total) / 12]]),
  C('/skatt/inntekt/', 'inntekt 1 600 000 (alle trinn)', { '#inn-brutto': '1600000' },
    [['Total skatt', L(1600000).total], [TRINN, L(1600000).trinn], ['Alminnelig', L(1600000).alm], [TRYGD, L(1600000).trygd]]),
  C('/skatt/inntekt/', 'inntekt 120 000 (trygdeavgiftens opptrapping)', { '#inn-brutto': '120000' },
    [[TRYGD, L(120000).trygd], ['Total skatt', L(120000).total]]),
  C('/skatt/inntekt/', 'inntekt 90 000 (under trygdegrensen)', { '#inn-brutto': '90000' },
    [['Total skatt', 0]]),
  // 2. Lønn ut (samme regnestykke, annen side)
  C('/kalkulator/lonnut/', 'lønn ut 450 000', { '#inn-brutto': '450000' },
    [['Total skatt', L(450000).total], [TRINN, L(450000).trinn], [TRYGD, L(450000).trygd]]),
  // 3. Lønn etter skatt (timelønn)
  C('/personlig/lonn/', 'lønn etter skatt 250 kr x 37,5 t x 47 uker', { '#lonnTimelonn': '250', '#lonnTimer': '37.5' },
    [['Bruttolønn per år', T], ['Total skatt', L(T).total], [UTBET, (T - L(T).total) / 12], ['Feriepenger (10,2 %)', 0.102 * T]]),
  C('/personlig/lonn/', 'lønn etter skatt, standard (under frikortgrensen)', {},
    [['Bruttolønn per år', 141000], ['Total skatt', trygd(141000, SATS.trygdLonn)], [UTBET, (141000 - trygd(141000, SATS.trygdLonn)) / 12]]),
  // 4. Boliglån
  C('/boliglan/mor/', 'boliglån annuitet 3 000 000 / 5,13 % / 25 år', {},
    [['Månedlig betaling', annuitet(3e6, 5.13, 300)], ['Totalt tilbakebetalt', annuitet(3e6, 5.13, 300) * 300], ['Totale renter', annuitet(3e6, 5.13, 300) * 300 - 3e6]]),
  C('/boliglan/mor/', 'boliglån annuitet 2 000 000 / 4,5 % / 20 år', { '#m-a': '2000000', '#m-r': '4,5', '#m-y': '20' },
    [['Månedlig betaling', annuitet(2e6, 4.5, 240)], ['Totalt tilbakebetalt', annuitet(2e6, 4.5, 240) * 240], ['Totale renter', annuitet(2e6, 4.5, 240) * 240 - 2e6]]),
  C('/boliglan/mor/', 'boliglån serielån 2 400 000 / 6 % / 20 år (sum renter)', { '#m-type': '@1', '#m-a': '2400000', '#m-r': '6', '#m-y': '20' },
    [['Totale renter', 0.06 / 12 * 2.4e6 * 241 / 2]]),
  // 5. BSU (renteforskjellen nulles ut ved lik rente, så «Total fordel» = skattefradraget)
  C('/boliglan/bsu/', 'BSU 2 291 kr/mnd i 10 år, lik rente', { '#bsu-alt-rate': '4', '#bsu-bsu-rate': '4' },
    [['Samlede innskudd', 2291 * 12 * 10], ['Skattefradrag', 2291 * 12 * 10 * 0.1], ['Total fordel BSU', 2291 * 12 * 10 * 0.1]]),
  C('/boliglan/bsu/', 'BSU 2 500 kr/mnd i 5 år (over taket på 27 500 per år)', { '#bsu-monthly': '2500', '#bsu-years': '5', '#bsu-alt-rate': '4', '#bsu-bsu-rate': '4' },
    [['Samlede innskudd', 27500 * 5], ['Skattefradrag', 2750 * 5]]),
  // 6. Arbeidsgiveravgift: avgiften regnes av lønn + feriepenger + OTP, OTP av lønn
  C('/avgift/aga/', 'AGA sone I, 600 000, 10,2 % ferie, 2 % OTP', {},
    [['Feriepenger + OTP', 600000 * 0.102 + 600000 * 0.02], [AGA, (600000 + 61200 + 12000) * 0.141], ['Total årskostnad', (600000 + 61200 + 12000) * 1.141]]),
  C('/avgift/aga/', 'AGA sone I, 1 000 000, 12 % ferie, 5 % OTP', { '#aga-salary': '1000000', '#aga-ferie': '@1', '#aga-otp': '@1' },
    [[AGA, (1e6 + 120000 + 50000) * 0.141], ['Total årskostnad', (1e6 + 120000 + 50000) * 1.141]]),
  // 7. Feriepenger
  C('/kalkulator/ferie/', 'ferie 500 000, 4 uker', {}, [[FERIE, 51000]]),
  C('/kalkulator/ferie/', 'ferie 500 000, 5 uker', { '#ferie-type': '@1' }, [[FERIE, 60000]]),
  C('/kalkulator/ferie/', 'ferie 900 000, 5 uker, 60+ (tillegget bare til 6G)', { '#ferie-salary': '900000', '#ferie-type': '@1', '#ferie-over60': 'true' },
    [['Med tillegg 60+', 900000 * 0.12 + 0.023 * Math.min(900000, 6 * SATS.G2025)]]),
  // 8. Utbytteskatt (AS)
  C('/skatt/utbytte/', 'utbytte AS 1 000 000 uten skjerming', {},
    [['Total skatt', 220000 + 780000 * 1.72 * 0.22], ['Netto til eier', 780000 - 780000 * 1.72 * 0.22], ['Selskapsskatt (22 %)', 220000], ['Oppjustert beløp (×1,72)', 780000 * 1.72], ['Utbytteskatt aksjonær (22 %)', 780000 * 1.72 * 0.22]]),
  C('/skatt/utbytte/', 'utbytte AS 1 000 000 med skjermingsfradrag 20 000', { '#utbytte-skjerming': '20000' },
    [['Total skatt', 220000 + 760000 * 1.72 * 0.22], ['Oppjustert beløp (×1,72)', 760000 * 1.72]]),
  // 9. Uttaksbeskatning (ENK, personinntekt, ingen annen inntekt): 22 % av gevinst etter personfradrag + trygd 10,8 % + trinnskatt
  C('/skatt/uttak/', 'uttak ENK, gevinst 600 000', { '#uttak-mv': '1000000', '#uttak-sv': '400000' },
    [['Total skatt', SATS.alm * (600000 - SATS.personfradrag) + trygd(600000, SATS.trygdNaering) + trinnskatt(600000)], [TRYGD, trygd(600000, SATS.trygdNaering)], [TRINN, trinnskatt(600000)]]),
  C('/skatt/uttak/', 'uttak ENK, ikke personinntekt, gevinst 600 000', { '#uttak-mv': '1000000', '#uttak-sv': '400000', '#uttak-personinntekt': '@1' },
    [['Total skatt', SATS.alm * (600000 - SATS.personfradrag)]]),
  // 10. Reisefradrag
  C('/skatt/reise/', 'reise 35 km x 230 dager', {},
    [['Brutto reisekostnad', 35 * 2 * 230 * 1.9], ['Årlig fradrag', 35 * 2 * 230 * 1.9 - 12000], ['Skattebesparelse', (35 * 2 * 230 * 1.9 - 12000) * 0.22]]),
  C('/skatt/reise/', 'reise 60 km x 220 dager, bom 15 kr/dag (3 300 er ikke over grensen)', { '#reise-km': '60', '#reise-dager': '220', '#reise-bom': '15' },
    [['Brutto reisekostnad', 60 * 2 * 220 * 1.9]]),
  C('/skatt/reise/', 'reise 60 km x 220 dager, bom 16 kr/dag (3 520 teller)', { '#reise-km': '60', '#reise-dager': '220', '#reise-bom': '16' },
    [['Brutto reisekostnad', 60 * 2 * 220 * 1.9 + 16 * 220]]),
];

if (A.list) { for (const c of CASES) console.log(c.side.padEnd(22), c.navn); process.exit(0); }
const todo = CASES.filter(c => !A.only || (c.side + ' ' + c.navn).toLowerCase().includes(String(A.only).toLowerCase()));

// ─── Lese tall fra sidetekst: første tall etter etiketten ───
const norm = s => s.replace(/[\u00a0\u202f\u2009\u2060]/g, ' ').replace(/\u2212/g, '-');
function les(tekst, etikett) {
  // etikett: tekst (uavhengig av store/små bokstaver, siden kan vise «TRINNSKATT») eller RegExp (tallet leses etter treffet)
  const t = norm(tekst); let slutt;
  if (etikett instanceof RegExp) { const m = etikett.exec(t); if (!m) return null; slutt = m.index + m[0].length; }
  else { const i = t.toLowerCase().indexOf(norm(etikett).toLowerCase()); if (i < 0) return null; slutt = i + etikett.length; }
  const m = t.slice(slutt, slutt + 60).match(/^[^\d\-]{0,40}?(-?\d[\d ]*(?:,\d+)?)/);
  return m ? parseFloat(m[1].replace(/ /g, '').replace(',', '.')) : null;
}

// ─── Edge via DevTools-protokollen ───
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CDP = 9400 + (process.pid % 500);
const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${CDP}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'regnekontroll-'))}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
edge.on('error', () => {}); srv.on('error', () => {});
let ws, seq = 0; const pend = new Map();
const stopp = kode => { try { edge.kill(); srv.kill(); } catch {} process.exit(kode); };
async function koble() {
  for (let i = 0; i < 100; i++) { try { const u = (await (await fetch(`http://127.0.0.1:${CDP}/json/version`)).json()).webSocketDebuggerUrl; ws = new WebSocket(u); await new Promise(r => ws.onopen = r); break; } catch { await sleep(150); } }
  if (!ws) { console.error('Fant ikke Edge (' + EDGE + '). Bruk --edge <sti>.'); stopp(2); }
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
}
const send = (method, params = {}, sessionId) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params, sessionId })); return new Promise(r => pend.set(id, r)); };

async function kjor(c) {
  // egen kontekst per kontroll: ingen delt localStorage eller service worker mellom kontrollene
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 3000, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${c.side}` }, sessionId);
  await sleep(2200);
  const ev = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }, sessionId)).result?.value;
  const mangler = await ev(`(()=>{const s=${JSON.stringify(c.sett)},miss=[];for(const k in s){const el=document.querySelector(k);if(!el){miss.push(k);continue}
    if(s[k]==='true')el.checked=true;else if(typeof s[k]==='string'&&s[k][0]==='@'&&el.tagName==='SELECT')el.selectedIndex=+s[k].slice(1);else{el.focus&&el.focus();el.value=s[k]}
    el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('blur'))}return miss.join(',')})()`);
  // siden regner med litt forsinkelse (og tregere når maskinen er travel): les på nytt til alt stemmer, maks ca. 9 s
  let tekst = '';
  for (let i = 0; i < 18; i++) {
    await sleep(500);
    tekst = (await ev('document.body.innerText')) || '';
    if (c.forvent.every(([e, f, tol = 1]) => { const v = les(tekst, e); return v !== null && Math.abs(v - f) <= tol; })) break;
  }
  await send('Target.disposeBrowserContext', { browserContextId });
  return { tekst, mangler };
}

await koble();
let ok = 0, feil = 0;
for (const c of todo) {
  let r; try { r = await kjor(c); } catch (e) { r = { tekst: '', mangler: 'unntak: ' + e }; }
  const linjer = [];
  if (r.mangler) linjer.push(`  felt finnes ikke: ${r.mangler}`);
  let bra = !r.mangler;
  for (const [etikett, fasit, tol = 1] of c.forvent) {
    const fikk = les(r.tekst, etikett);
    const stemmer = fikk !== null && Math.abs(fikk - fasit) <= tol;
    if (!stemmer) bra = false;
    if (!stemmer || A.vis) linjer.push(`  ${stemmer ? 'ok   ' : 'FEIL '}${etikett instanceof RegExp ? etikett.source.replace(/\n/g, ' ').trim() : etikett}: siden viser ${fikk === null ? '(fant ikke etiketten)' : fikk}, fasit ${Math.round(fasit * 100) / 100}`);
  }
  console.log(`${bra ? 'OK   ' : 'FEIL '} ${c.side}  ${c.navn}`); linjer.forEach(l => console.log(l));
  bra ? ok++ : feil++;
}
console.log(`\n${ok} bestått, ${feil} feilet (av ${todo.length} kontroller)`);
stopp(feil ? 1 : 0);
