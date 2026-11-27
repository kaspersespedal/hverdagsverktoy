// Tester kontrollene i scripts/hent-sec.mjs uten nett: gjeldsregelen, stoppreglene, varslene og fasiten.
// Kjør fra repo-rota:  node scripts/test-hent-sec.mjs
// Avslutter med kode 1 hvis en test feiler.
import { kontroller, motFasit, gjeld } from './hent-sec.mjs';

let pass = 0, fail = 0;
function sann(navn, v) { console.log((v ? 'OK   ' : 'FEIL ') + navn); v ? pass++ : fail++; }

// Et lite, riktig selskap (millioner gjort om til dollar).
const M = 1e6;
function selskap(endre = {}) {
  const d = {
    ticker: 'TEST', cik: 1, rapport: { nr: '0000000001-26-000001' },
    aar: [{ slutt: '2025-12-31', oms: 1000 * M, cfo: 200 * M, capex: 50 * M, sbc: 10 * M, renter: 5 * M }],
    balanse: { eiendeler: 2000 * M, kont: 100 * M, plass: 50 * M, gjeld: 300 * M },
    aksjer: { antall: 100 * M, type: 'utestaende' }, _gjeldSamlet: null
  };
  for (const [k, v] of Object.entries(endre)) {
    const [a, b] = k.split('.');
    if (b) (a === 'aar' ? d.aar[0] : d[a])[b] = v; else d[a] = v;
  }
  return d;
}

// 1. Et riktig selskap passerer uten stopp og uten varsel.
const ok = kontroller(selskap(), null);
sann('Riktig selskap: ingen stopp', ok.stopp.length === 0);
sann('Riktig selskap: ingen varsel', ok.varsel.length === 0);

// 2. Stoppregler: tall som ikke kan stemme.
sann('Negativ omsetning stopper', kontroller(selskap({ 'aar.oms': -5 * M }), null).stopp.length === 1);
sann('Negative investeringer stopper', kontroller(selskap({ 'aar.capex': -5 * M }), null).stopp.length === 1);
sann('Negativ gjeld stopper', kontroller(selskap({ 'balanse.gjeld': -1 * M }), null).stopp.length === 1);
sann('Kontantstrøm over 1,5 × omsetning stopper', kontroller(selskap({ 'aar.cfo': 1600 * M }), null).stopp.length === 1);
sann('Kontanter større enn eiendelene stopper', kontroller(selskap({ 'balanse.kont': 2500 * M }), null).stopp.length === 1);
sann('Gjeld større enn eiendelene er lov (negativ egenkapital, som Domino\'s)', kontroller(selskap({ 'balanse.gjeld': 2100 * M }), null).stopp.length === 0);
sann('Null omsetning er lov (biotek uten salg)', kontroller(selskap({ 'aar.oms': 0 }), null).stopp.length === 0);
sann('Null aksjer stopper', kontroller(selskap({ aksjer: { antall: 0, type: 'utestaende' } }), null).stopp.length === 1);
sann('Banker kontrolleres ikke', kontroller({ unntatt: 'finans' }, null).stopp.length === 0);

// 3. Varsler: kan stemme, men bør ses på.
sann('Gjeld 20 % fra selskapets egen sum gir varsel', kontroller(selskap({ _gjeldSamlet: 250 * M }), null).varsel.length === 1);
sann('Gjeld 5 % fra selskapets egen sum gir ikke varsel', kontroller(selskap({ _gjeldSamlet: 285 * M }), null).varsel.length === 0);
const forrige = selskap({ rapport: { nr: '0000000001-25-000001' } });
sann('Omsetningen tredoblet gir varsel', kontroller(selskap({ 'aar.oms': 3000 * M }), forrige).varsel.some(v => /omsetningen/.test(v)));
sann('Gjelden tidoblet (over 1 mrd.) gir varsel', kontroller(selskap({ 'balanse.gjeld': 1900 * M }), forrige).varsel.some(v => /gjelden/.test(v)));
sann('Aksjene halvert gir varsel', kontroller(selskap({ aksjer: { antall: 40 * M, type: 'utestaende' } }), forrige).varsel.some(v => /aksjer/.test(v)));
sann('Samme årsrapport: ingen hopp-varsel', kontroller(selskap({ 'aar.oms': 3000 * M }), selskap()).varsel.length === 0);

// 4. Fasiten: samme årsrapport skal gi samme tall.
const f = { ticker: 'TEST', cik: 1, rapport: '0000000001-26-000001',
  tall: { oms: 1000 * M, cfo: 200 * M, capex: 50 * M, sbc: 10 * M, renter: 5 * M, kont: 100 * M, plass: 50 * M, gjeld: 300 * M, aksjer: 100 * M } };
sann('Fasit: like tall gir ikke avvik', motFasit(selskap(), f) === null);
sann('Fasit: annen gjeld gir avvik', /gjeld/.test(motFasit(selskap({ 'balanse.gjeld': 350 * M }), f) || ''));
sann('Fasit: manglende tall gir avvik', /plass/.test(motFasit(selskap({ 'balanse.plass': null }), f) || ''));
sann('Fasit: ny årsrapport hoppes over', motFasit(selskap({ rapport: { nr: '0000000001-27-000001' }, 'balanse.gjeld': 999 * M }), f) === null);

// 5. Gjeldsregelen på kjente tilfeller (merkelapper som i SEC-dataene, millioner dollar).
const dato = '2025-12-31';
function gaap(tall) {
  const g = {};
  for (const [tag, val] of Object.entries(tall)) g[tag] = { units: { USD: [{ end: dato, val: val * M, form: '10-K', filed: '2026-02-01' }] } };
  return g;
}
const sum = t => Math.round(gjeld(gaap(t), dato).sum / M);
sann('IBM: kortsiktig gjeld med to merkelapper telles én gang (61 260)',
  sum({ LongTermDebtNoncurrent: 54836, LongTermDebtAndCapitalLeaseObligationsCurrent: 6424, ShortTermBorrowings: 6424, LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities: 61259 }) === 61260);
sann('Tesla: langsiktig + DebtCurrent (8 153)', sum({ LongTermDebt: 6584, DebtCurrent: 1569 }) === 8153);
sann('Cisco: DebtCurrent inneholder avdragene, så de legges ikke til (29 533)',
  sum({ LongTermDebtNoncurrent: 19372, LongTermDebtCurrent: 3500, DebtCurrent: 10161, LongTermDebt: 22872 }) === 29533);
sann('McDonald\'s: lån flyttet til langsiktig telles ikke igjen (39 973)',
  sum({ LongTermDebtNoncurrent: 39973, LongTermDebt: 39973, LongTermDebtCurrent: 725, CommercialPaper: 798, LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths: 0 }) === 39973);
sann('Qualcomm: selskapets egen sum avgjør (14 613)',
  sum({ LongTermDebtNoncurrent: 12620, LongTermDebtCurrent: 1993, DebtCurrent: 2492, DebtLongtermAndShorttermCombinedAmount: 14613 }) === 14613);

console.log('\n' + pass + ' bestått, ' + fail + ' feilet');
process.exit(fail ? 1 : 0);
