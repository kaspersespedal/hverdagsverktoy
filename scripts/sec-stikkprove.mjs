// scripts/sec-stikkprove.mjs — plukker selskaper til den månedlige stikkprøven av SEC-tallene på DCF-siden.
//
//   node scripts/sec-stikkprove.mjs --logg <sti til logg.json> [--antall 10] [--side https://…]
//
// Leser tallene fra nettsiden slik brukerne ser dem (data/sec/), og skriver en oversikt i Markdown:
// først varslene fra nattjobben (data/sec/kontroll.json), så tilfeldig valgte selskaper som verken er i
// fasiten (scripts/sec-fasit.json) eller sjekket før (logg.json). For hvert selskap: tallene siden
// viser, i millioner dollar, og lenker til årsrapporten hos SEC. Den som gjør stikkprøven, sammenligner
// med balansen og kontantstrømoppstillingen i rapporten.
//
// Skriptet endrer ingenting. Den som gjør stikkprøven, fører resultatet i logg.json:
//   [{ "cik": 320193, "ticker": "AAPL", "rapport": "0000320193-26-000026", "dato": "2026-12-01", "resultat": "OK" }, …]
// Krever Node 20+.
import fs from 'node:fs';

const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) A[av[i].slice(2)] = av[i + 1] && !av[i + 1].startsWith('--') ? av[++i] : true;
const SIDE = (A.side || 'https://xn--hverdagsverkty-2qb.no').replace(/\/$/, '');
const ANTALL = +A.antall || 10;

async function json(sti) {
  const r = await fetch(SIDE + sti, { headers: { 'Cache-Control': 'no-cache' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(r.status + ' fra ' + SIDE + sti);
  return r.json();
}
const mill = x => (x == null ? '–' : Math.round(x / 1e6).toLocaleString('nb-NO'));

async function main() {
  const indeks = await json('/data/sec/indeks.json');
  if (!indeks) { console.log('IKKE I DRIFT: ' + SIDE + '/data/sec/indeks.json finnes ikke ennå (PR #370 er trolig ikke merget).'); return; }
  const kontroll = (await json('/data/sec/kontroll.json')) || { stoppet: [], varsler: [] };
  const fasit = new Set(((await json('/scripts/sec-fasit.json'))?.selskaper || []).map(f => f.cik));
  let logg = [];
  if (A.logg && fs.existsSync(A.logg)) logg = JSON.parse(fs.readFileSync(A.logg, 'utf8'));
  // Et selskap regnes som sjekket når samme årsrapport står i loggen. Ny årsrapport: kan trekkes igjen.
  const sjekket = new Set(logg.map(l => l.cik + '|' + l.rapport));

  const unike = new Map();
  for (const [ticker, navn, cik, unntatt] of indeks.selskaper) if (!unntatt && !unike.has(cik)) unike.set(cik, { ticker, navn, cik });

  // Varslene først, så tilfeldige. Fisher–Yates for et jevnt trekk.
  const valgt = [], brukt = new Set();
  const ta = async (cik, grunn) => {
    if (brukt.has(cik) || !unike.has(cik)) return;
    const d = await json('/data/sec/' + cik + '.json');
    if (!d || !d.rapport) return;
    brukt.add(cik);
    if (!grunn && (fasit.has(cik) || sjekket.has(cik + '|' + d.rapport.nr))) return;
    valgt.push({ d, grunn });
  };
  for (const v of kontroll.varsler || []) await ta(v.cik, 'Varsel fra nattjobben: ' + v.grunn);
  const rest = [...unike.keys()];
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  for (const cik of rest) {
    if (valgt.filter(v => !v.grunn).length >= ANTALL) break;
    await ta(cik, null);
  }

  const ut = [];
  ut.push('# Stikkprøve av SEC-tallene ' + new Date().toISOString().slice(0, 10), '');
  ut.push('Kilde: ' + SIDE + '/data/sec/ (oppdatert ' + indeks.oppdatert + '). ' + unike.size + ' selskaper på siden, ' + fasit.size + ' i fasiten, ' + sjekket.size + ' i loggen fra før.', '');
  if ((kontroll.stoppet || []).length) {
    ut.push('## Stoppet av nattjobben (forrige versjon vises)', '');
    for (const s of kontroll.stoppet) ut.push('- ' + s.ticker + ' (CIK ' + s.cik + '): ' + s.grunn);
    ut.push('');
  }
  for (const { d, grunn } of valgt) {
    const s = d.aar[d.aar.length - 1], b = d.balanse, mappe = 'https://www.sec.gov/Archives/edgar/data/' + d.cik + '/' + d.rapport.nr.replace(/-/g, '') + '/';
    ut.push('## ' + d.ticker + ' · ' + d.navn, '');
    if (grunn) ut.push('**' + grunn + '**', '');
    ut.push('Årsrapport ' + d.rapport.skjema + ' for året som sluttet ' + d.rapport.slutt + ', levert ' + d.rapport.levert + ' (nr. ' + d.rapport.nr + ').');
    ut.push('Rapporten: ' + d.rapport.lenke);
    ut.push('Tabellene hver for seg: ' + mappe + 'R2.htm, R3.htm, R4.htm … (balansen og kontantstrømmen ligger vanligvis blant R2–R8). Mappe: ' + mappe, '');
    ut.push('| Post (millioner dollar) | Siden viser | Årsrapporten | OK? |', '|---|---:|---:|---|');
    for (const [navn, x] of [['Omsetning', s.oms], ['Kontantstrøm fra drift', s.cfo], ['Kjøp av varige driftsmidler', s.capex],
      ['Aksjebasert lønn (tillegg i kontantstrømmen)', s.sbc], ['Rentekostnad', s.renter], ['Kontanter' + (b.kontBundet ? ' (medregnet bundne)' : ''), b.kont],
      ['Kortsiktige plasseringer', b.plass], ['Rentebærende gjeld (lån, ikke vanlig leie)', b.gjeld]])
      ut.push('| ' + navn + ' | ' + mill(x) + ' |  |  |');
    ut.push('| Antall aksjer (millioner, ' + (d.aksjer ? (d.aksjer.type === 'snitt' ? 'snitt for året' : 'per ' + d.aksjer.dato) : '–') + ') | ' + (d.aksjer ? mill(d.aksjer.antall) : '–') + ' |  |  |', '');
    if (b.gjeldDeler) ut.push('Gjelden er satt sammen av: ' + Object.entries(b.gjeldDeler).map(([k, v]) => k + ' ' + mill(v)).join(' + '), '');
  }
  console.log(ut.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
