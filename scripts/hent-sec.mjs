// scripts/hent-sec.mjs — henter regnskapstall for store amerikanske selskaper fra SEC EDGAR
// og skriver små filer til data/sec/. /avansert/finans/dcf/ leser dem («Hent tall»).
//
//   node scripts/hent-sec.mjs                   de 1000 største (børsverdien de selv oppgir til SEC)
//   node scripts/hent-sec.mjs --antall 40       færre
//   node scripts/hent-sec.mjs --cik 320193,34088   bare disse (indeksen beholder de andre)
//   node scripts/hent-sec.mjs --alt             hent regnskapstallene på nytt også der årsrapporten er den samme
//   node scripts/hent-sec.mjs --vis 320193      skriv ut det som ble funnet, uten å lagre noe
//
// Kjøres hver natt av .github/workflows/sec-tall.yml. Krever Node 20+ og miljøvariabelen
// SEC_USER_AGENT. SEC ber alle som henter automatisk om å si hvem de er, med e-postadresse:
//   SEC_USER_AGENT="Hverdagsverktøy kontakt@eksempel.no"
// Regler hos SEC: maks 10 kall i sekundet (vi holder oss på rundt 5).
// https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data
//
// Tallene er de selskapet selv har levert i årsrapporten (skjema 10-K), merket med XBRL.
// Selskapene bruker ulike merkelapper for samme post, så hver post har en reserveliste (TAGS).
// Finner vi ikke en post, står den som null og nevnes i «mangler». Vi gjetter aldri.
// Banker, forsikring og eiendom (SIC 6000–6799) får bare navn og «unntatt»: fri kontantstrøm
// gir ikke mening for dem.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) A[av[i].slice(2)] = av[i + 1] && !av[i + 1].startsWith('--') ? av[++i] : true;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UT = path.join(ROOT, 'data', 'sec');
const UA = process.env.SEC_USER_AGENT;
const V = 2;                       // øk når uttrekket endres, så alle filene lages på nytt
const ANTALL = +A.antall || 1000;
const PAUSE = 200;                 // ms mellom kall

const sov = ms => new Promise(r => setTimeout(r, ms));
let sist = 0;
async function hent(url, somTekst) {
  for (let forsok = 1; ; forsok++) {
    const vent = sist + PAUSE - Date.now();
    if (vent > 0) await sov(vent);
    sist = Date.now();
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate' } }); }
    catch (e) { if (forsok >= 4) throw e; await sov(2000 * forsok); continue; }
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      if (forsok >= 4) throw new Error(res.status + ' fra ' + url);
      await sov(10000 * forsok); continue;
    }
    if (!res.ok) throw new Error(res.status + ' fra ' + url);
    return somTekst ? res.text() : res.json();
  }
}

// ── Merkelapper (us-gaap), i den rekkefølgen de prøves ──────────────────────────────
const TAGS = {
  // Total omsetning. «Revenues» er totalen der selskapet også har annen inntekt enn kundekontrakter.
  oms: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet', 'SalesRevenueGoodsNet'],
  cfo: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
  capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets', 'PaymentsToAcquireOtherProductiveAssets', 'PaymentsToAcquireOtherPropertyPlantAndEquipment', 'PaymentsForCapitalImprovements'],
  sbc: ['ShareBasedCompensation', 'AllocatedShareBasedCompensationExpense'],
  renter: ['InterestExpense', 'InterestExpenseNonoperating', 'InterestExpenseDebt', 'InterestAndDebtExpense', 'InterestPaidNet'],
  kont: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents', 'Cash'],
  // Kortsiktige plasseringer: bare linjer som står i balansen. Samlede verdipapirer fra notene
  // («AvailableForSaleSecuritiesDebtSecurities») ble prøvd og forkastet: hos AT&T og RTX er det papirer
  // som ikke er kortsiktige plasseringer i det hele tatt.
  plass: ['ShortTermInvestments', 'MarketableSecuritiesCurrent', 'AvailableForSaleSecuritiesDebtSecuritiesCurrent', 'DebtSecuritiesAvailableForSaleExcludingAccruedInterestCurrent'],
  kontOgPlass: ['CashCashEquivalentsAndShortTermInvestments'],
  // Gjeld: se gjeld() under.
  langsiktig: ['LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligations', 'LongTermNotesPayable', 'UnsecuredLongTermDebt', 'ConvertibleLongTermNotesPayable', 'ConvertibleDebtNoncurrent', 'ConvertibleNotesPayableNoncurrent'],
  langsiktigTotal: ['LongTermDebt', 'LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities'],
  kortDel: ['LongTermDebtCurrent', 'LongTermDebtAndCapitalLeaseObligationsCurrent'],
  kortLaan: ['ShortTermBorrowings'],
  sertifikat: ['CommercialPaper', 'OtherShortTermBorrowings'],
  gjeldKort: ['DebtCurrent'],
  gjeldSamlet: ['DebtLongtermAndShorttermCombinedAmount'],
  forfallNesteAar: ['LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths'],
};

const dager = (a, b) => (Date.parse(b) - Date.parse(a)) / 86400000;
const erAar = f => /^10-K/.test(f.form || '');

// Årstall (perioder på omtrent ett år) fra årsrapporter: Map(sluttdato → fakta). Sist leverte vinner,
// så omarbeidede tall fra en senere rapport erstatter de gamle.
function perAar(gaap, tag, enhet = 'USD') {
  const ut = new Map();
  for (const f of gaap?.[tag]?.units?.[enhet] || []) {
    if (!f.start || !erAar(f)) continue;
    const d = dager(f.start, f.end);
    if (d < 340 || d > 380) continue;
    const har = ut.get(f.end);
    if (!har || f.filed >= har.filed) ut.set(f.end, f);
  }
  return ut;
}
// Balansetall (ett tidspunkt) på en bestemt dato.
function paaDato(gaap, tag, dato, enhet = 'USD') {
  let best = null;
  for (const f of gaap?.[tag]?.units?.[enhet] || []) {
    if (f.start || f.end !== dato || !erAar(f)) continue;
    if (!best || f.filed >= best.filed) best = f;
  }
  return best;
}
function forste(liste, fn) {
  for (const tag of liste) { const f = fn(tag); if (f) return { tag, val: f.val, f }; }
  return null;
}

// Rentebærende gjeld slik den står i balansen. Selskapene merker den på flere måter, og de samme
// dollarene har ofte to merkelapper (én i balansen, én i en note). Reglene under er laget for ikke å
// telle dobbelt. Kontrollert mot årsrapportene til 36 selskaper (2026-11-27).
function gjeld(gaap, dato) {
  const p = navn => forste(TAGS[navn], t => paaDato(gaap, t, dato));
  const pluss = x => (x && x.val > 0 ? x : null);
  const lang = pluss(p('langsiktig')), total = pluss(p('langsiktigTotal')), kortDel = pluss(p('kortDel')), kortLaan = pluss(p('kortLaan')),
    sert = pluss(p('sertifikat')), gjeldKort = pluss(p('gjeldKort')), samlet = pluss(p('gjeldSamlet')), forfall = p('forfallNesteAar');
  const svar = par => {
    const deler = {}, tags = [];
    for (const [navn, x] of par) if (x) { deler[navn] = x.val; tags.push(x.tag); }
    return tags.length ? { sum: Object.values(deler).reduce((a, b) => a + b, 0), deler, tags } : null;
  };

  if (!lang) {
    if (samlet) return svar([['samlet', samlet]]);
    // Uten egen merkelapp for den langsiktige delen brukes «LongTermDebt» om nettopp den, med «DebtCurrent»
    // for resten (Tesla), eller om langsiktige lån medregnet avdrag, med kortsiktige lån i tillegg.
    return svar([['langsiktigMedKortDel', total], ['kortsiktigeLaan', gjeldKort || kortLaan || sert]]);
  }

  // Har selskapet flyttet kortsiktige lån til langsiktig gjeld fordi de skal refinansieres, ligger de alt
  // i det langsiktige tallet, og merkelappene fra notene må ikke legges til en gang til. To tegn:
  //  – beløpet som er refinansiert er oppgitt (Chevron)
  //  – forfallsnoten sier 0 neste år, mens merkelappen for avdrag har et beløp (McDonald's)
  const refin = (gaap.ShortTermDebtRefinancedAmount?.units?.USD || []).some(f => f.end === dato && erAar(f) && f.val > 0);
  const flyttet = refin || (!!forfall && forfall.val === 0 && !!kortDel);

  // A: delene hver for seg. Avdrag neste år er merkelappen for det, ellers «langsiktige lån i alt» minus den langsiktige delen.
  let avdrag = flyttet ? null : (kortDel || (total && total.val > lang.val ? { val: total.val - lang.val, tag: total.tag + ' − ' + lang.tag } : null));
  const kort = kortLaan || (flyttet ? null : sert);
  // Samme beløp med to merkelapper (IBM: «kortsiktig gjeld» er merket både som lån og som avdrag): tell én gang.
  if (kort && avdrag && Math.abs(kort.val - avdrag.val) <= 0.005 * kort.val) avdrag = null;
  const A = svar([['langsiktig', lang], ['kortsiktigDel', avdrag], ['kortsiktigeLaan', kort]]);
  if (!gjeldKort || flyttet) return A;
  // B: langsiktig del + «DebtCurrent», som etter definisjonen er all kortsiktig rentebærende gjeld på én linje.
  //    Da er kortsiktige lån og avdrag deler av den og skal ikke legges til (J&J, Cisco, Bristol-Myers).
  //    Noen bruker i stedet merkelappen for avdrag om hele linja (Parker-Hannifin): den største av de to gjelder.
  const B = svar([['langsiktig', lang], ['kortsiktig', kortDel && kortDel.val > gjeldKort.val ? kortDel : gjeldKort]]);
  // C: selskapets egen sum av kort og lang gjeld. Den er noen ganger pålydende, eller uten kortsiktige lån,
  //    så den brukes bare som dommer: stemmer den med A og ikke med B, vinner A (Qualcomm).
  const lik = (x, y) => Math.abs(x - y) <= 0.005 * Math.max(x, y);
  return samlet && lik(A.sum, samlet.val) && !lik(B.sum, samlet.val) ? A : B;
}

function aksjer(fakta, gaap, aar0) {
  // 1. Forsiden av årsrapporten: utestående aksjer noen uker etter årsslutt.
  const forside = (fakta.facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares || [])
    .filter(f => f.accn === aar0.accn).sort((a, b) => a.end < b.end ? 1 : -1)[0];
  if (forside && forside.val > 0) return { antall: forside.val, dato: forside.end, type: 'utestaende' };
  // 2. Balansen ved årsslutt.
  const bal = paaDato(gaap, 'CommonStockSharesOutstanding', aar0.end, 'shares');
  if (bal && bal.val > 0) return { antall: bal.val, dato: bal.end, type: 'utestaende' };
  // 3. Veid snitt for året, utvannet. Brukes når selskapet har flere aksjeklasser og bare oppgir antallet per klasse.
  const snitt = perAar(gaap, 'WeightedAverageNumberOfDilutedSharesOutstanding', 'shares').get(aar0.end);
  if (snitt && snitt.val > 0) return { antall: snitt.val, dato: snitt.end, type: 'snitt' };
  return null;
}

// Fra SECs to svar (innleveringer + alle merkede tall) til den lille fila siden leser.
function trekkUt(inn, fakta) {
  const cik = +inn.cik;
  // Bare vanlige aksjer: første ticker, pluss andre aksjeklasser (GOOGL/GOOG, BRK-B/BRK-A).
  // Preferanseaksjer (BAC-PB) og gjeldspapirer har egne tickere hos SEC og skal ikke med i søket.
  const alle = inn.tickers || [], rot = (alle[0] || '').split('-')[0];
  const tickere = alle.filter((t, i) => i === 0 || (t.split('-')[0] === rot && /^[A-Z.]+-[A-OQ-Z]$/.test(t)));
  const grunn = { v: V, cik, navn: inn.name, ticker: tickere[0] || null, tickere, bors: (inn.exchanges || [])[0] || null,
    sic: +inn.sic || null, bransje: inn.sicDescription || null };
  if (grunn.sic >= 6000 && grunn.sic <= 6799) return { ...grunn, unntatt: 'finans' };

  const gaap = fakta?.facts?.['us-gaap'];
  if (!gaap) return { ...grunn, unntatt: 'ingen-tall' };
  // Hver post leses år for år: første merkelapp på lista som har tall for det året. Et selskap kan bytte merkelapp underveis.
  const POSTER = ['cfo', 'oms', 'capex', 'sbc', 'renter'];
  const serier = {};
  for (const post of POSTER) serier[post] = TAGS[post].map(t => [t, perAar(gaap, t)]);
  const slutter = [...new Set(serier.cfo.flatMap(([, m]) => [...m.keys()]))].sort().reverse().slice(0, 6);
  if (!slutter.length) return { ...grunn, unntatt: 'ingen-tall' };
  const aar0 = serier.cfo.find(([, m]) => m.has(slutter[0]))[1].get(slutter[0]);
  if (dager(aar0.end, new Date().toISOString().slice(0, 10)) > 550) return { ...grunn, unntatt: 'gammel' };

  const merk = {}, mangler = [];
  const aar = slutter.map((slutt, i) => {
    const rad = { slutt };
    for (const post of POSTER) {
      const treff = serier[post].find(([, m]) => m.has(slutt));
      rad[post] = treff ? treff[1].get(slutt).val : null;
      if (i === 0) { if (treff) merk[post] = treff[0]; else mangler.push(post); }
    }
    // Noen fører rentekostnaden med minus foran. Den er en kostnad uansett fortegn.
    if (rad.renter != null) rad.renter = Math.abs(rad.renter);
    return rad;
  }).reverse();

  const dato = aar0.end;
  const kont = forste(TAGS.kont, t => paaDato(gaap, t, dato));
  // Kortsiktige plasseringer: 1) egen linje i balansen, 2) «kontanter og plasseringer» minus kontantene.
  let plass = forste(TAGS.plass, t => paaDato(gaap, t, dato));
  if (!plass && kont) {
    const begge = forste(TAGS.kontOgPlass, t => paaDato(gaap, t, dato));
    if (begge && begge.val > kont.val) plass = { tag: begge.tag, val: begge.val - kont.val };
  }
  const g = gjeld(gaap, dato);
  if (!kont) mangler.push('kont'); else merk.kont = kont.tag;
  if (plass) merk.plass = plass.tag;
  if (!g) mangler.push('gjeld'); else merk.gjeld = g.tags.join(' + ');
  const aks = aksjer(fakta, gaap, aar0);
  if (!aks) mangler.push('aksjer');

  // Lenke til selve årsrapporten hos SEC.
  const r = inn.filings?.recent, n = r ? r.accessionNumber.indexOf(aar0.accn) : -1;
  const lenke = n >= 0
    ? 'https://www.sec.gov/Archives/edgar/data/' + cik + '/' + aar0.accn.replace(/-/g, '') + '/' + r.primaryDocument[n]
    : 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=' + cik + '&type=10-K';

  const eiendeler = paaDato(gaap, 'Assets', dato), samlet = paaDato(gaap, 'DebtLongtermAndShorttermCombinedAmount', dato);
  return { ...grunn,
    rapport: { skjema: aar0.form, slutt: dato, levert: aar0.filed, nr: aar0.accn, lenke },
    aar,
    // kontBundet: selskapet oppgir bare kontanter medregnet bundne midler (sperret for bestemte formål).
    balanse: { dato, eiendeler: eiendeler ? eiendeler.val : null, kont: kont ? kont.val : null, kontBundet: !!kont && /RestrictedCash/.test(kont.tag),
      plass: plass ? plass.val : null, gjeld: g ? g.sum : null, gjeldDeler: g ? g.deler : null },
    aksjer: aks, merk, mangler,
    // Brukes bare av kontrollen under, og lagres ikke.
    _gjeldSamlet: samlet ? samlet.val : null };
}

// ── Kontroll før noe lagres ─────────────────────────────────────────────────────────────
// «stopp»: tall som ikke kan stemme. Selskapet beholder forrige versjon, og jobben melder feil.
// «varsel»: tall som kan stemme, men som bør ses på (store hopp, to regnemåter som spriker).
//           De lagres, og står i data/sec/kontroll.json til den månedlige gjennomgangen.
function kontroller(d, gammel) {
  const stopp = [], varsel = [];
  if (d.unntatt) return { stopp, varsel };
  const s = d.aar[d.aar.length - 1], b = d.balanse, mrd = x => (x / 1e9).toFixed(1) + ' mrd.';
  if (s.oms != null && s.oms <= 0) stopp.push('omsetningen er ' + mrd(s.oms));
  for (const [navn, x] of [['investeringer', s.capex], ['aksjebasert lønn', s.sbc], ['kontanter', b.kont], ['plasseringer', b.plass], ['gjeld', b.gjeld]])
    if (x != null && x < 0) stopp.push(navn + ' er negative (' + mrd(x) + ')');
  if (s.oms > 0 && s.cfo > 1.5 * s.oms) stopp.push('kontantstrøm fra drift (' + mrd(s.cfo) + ') er over 1,5 ganger omsetningen (' + mrd(s.oms) + ')');
  if (b.eiendeler > 0) {
    if ((b.kont || 0) + (b.plass || 0) > b.eiendeler) stopp.push('kontanter og plasseringer er større enn alle eiendelene');
    if (b.gjeld > b.eiendeler) stopp.push('gjelden (' + mrd(b.gjeld) + ') er større enn alle eiendelene (' + mrd(b.eiendeler) + ')');
  }
  if (d.aksjer && !(d.aksjer.antall > 0)) stopp.push('antall aksjer er ' + d.aksjer.antall);
  if (d._gjeldSamlet > 0 && b.gjeld > 0 && Math.abs(b.gjeld - d._gjeldSamlet) > 0.10 * d._gjeldSamlet)
    varsel.push('gjelden (' + mrd(b.gjeld) + ') spriker over 10 % fra selskapets egen sum (' + mrd(d._gjeldSamlet) + ')');
  // Store hopp fra forrige årsrapport. Oppkjøp og nye lån kan forklare dem, så de lagres, men merkes.
  const g = gammel && !gammel.unntatt && gammel.rapport && gammel.rapport.nr !== d.rapport.nr ? gammel : null;
  if (g) {
    const gs = g.aar[g.aar.length - 1], hopp = (navn, ny, gml, lav, hoy) => {
      if (ny > 0 && gml > 0 && (ny / gml < lav || ny / gml > hoy)) varsel.push(navn + ' endret fra ' + mrd(gml) + ' til ' + mrd(ny));
    };
    hopp('omsetningen', s.oms, gs.oms, 0.5, 2);
    if (Math.abs((b.gjeld || 0) - (g.balanse.gjeld || 0)) > 1e9) hopp('gjelden', b.gjeld, g.balanse.gjeld, 0.33, 3);
    if (d.aksjer && g.aksjer && d.aksjer.type === g.aksjer.type) {
      const f = d.aksjer.antall / g.aksjer.antall;
      if (f < 0.7 || f > 1.5) varsel.push('antall aksjer endret fra ' + g.aksjer.antall + ' til ' + d.aksjer.antall);
    }
  }
  return { stopp, varsel };
}

// Fasit: selskaper som er kontrollert for hånd (scripts/sec-fasit.json). Samme årsrapport skal gi samme tall.
function motFasit(d, f) {
  if (!d.rapport || d.rapport.nr !== f.rapport) return null;   // ny årsrapport: fasiten gjelder ikke lenger
  const s = d.aar[d.aar.length - 1], b = d.balanse;
  const na = { oms: s.oms, cfo: s.cfo, capex: s.capex, sbc: s.sbc, renter: s.renter, kont: b.kont, plass: b.plass, gjeld: b.gjeld, aksjer: d.aksjer ? d.aksjer.antall : null };
  const avvik = Object.keys(f.tall).filter(k => {
    const x = na[k], y = f.tall[k];
    return (x == null) !== (y == null) || (x != null && Math.abs(x - y) > 0.005 * Math.max(Math.abs(x), Math.abs(y)));
  });
  return avvik.length ? f.ticker + ': ' + avvik.map(k => k + ' ' + na[k] + ' (fasit ' + f.tall[k] + ')').join(', ') : null;
}

// ── Hvilke selskaper: de største etter «public float» (børsverdien av aksjene som ikke eies av innsidere),
//    som alle oppgir på forsiden av årsrapporten. Tallet gjelder en dato midt i regnskapsåret og leveres
//    først med årsrapporten, så det kan være nesten to år gammelt. Noen daterer det dessuten et år feil.
//    Derfor leser vi elleve kvartaler og beholder, per selskap, tallet fra den nyeste innleveringen
//    (årstallet står i innleveringsnummeret: 0000002488-26-000021 er fra 2026).
//    Noen små selskaper oppgir tallet i feil enhet (tusen ganger for høyt). De lukes ut ved å se på
//    eiendelene: ingen ekte selskaper har børsverdi over 150 ganger balansen.
async function ramme(sti) {
  const na = new Date(), best = new Map();
  const nyere = (a, b) => { const ya = a.accn.split('-')[1], yb = b.accn.split('-')[1]; return ya !== yb ? ya > yb : a.end > b.end; };
  let y = na.getUTCFullYear(), q = Math.floor(na.getUTCMonth() / 3) + 1;
  for (let i = 0; i < 11; i++) {
    const j = await hent('https://data.sec.gov/api/xbrl/frames/' + sti + '/USD/CY' + y + 'Q' + q + 'I.json');
    for (const d of j?.data || []) { const har = best.get(d.cik); if (!har || nyere(d, har)) best.set(d.cik, d); }
    if (--q < 1) { q = 4; y--; }
  }
  return best;
}
async function storste(antall) {
  const flyt = await ramme('dei/EntityPublicFloat'), eiendeler = await ramme('us-gaap/Assets');
  return [...flyt.values()]
    .filter(d => d.val > 0 && !(eiendeler.get(d.cik)?.val > 0 && d.val > 150 * eiendeler.get(d.cik).val))
    .sort((x, z) => z.val - x.val).slice(0, Math.ceil(antall * 1.25) + 30)
    .map(d => ({ cik: d.cik, flyt: d.val, eiendeler: eiendeler.get(d.cik)?.val || 0 }));
}
// Samme kontroll en gang til når tallene er hentet: børsverdi mot omsetning og mot antall aksjer.
// Banker og forsikring har store balanser, så der er grensen fem ganger eiendelene.
function tastefeil(d, flyt, eiendeler) {
  if (d.unntatt === 'finans') return eiendeler > 0 && flyt > 5 * eiendeler;
  const siste = d.aar ? d.aar[d.aar.length - 1] : null;
  if (!siste || !flyt) return false;
  return (siste.oms > 0 && flyt > 200 * siste.oms) || (!!d.aksjer && flyt / d.aksjer.antall > 20000);
}

// Renten på tiårige amerikanske statsobligasjoner, siste dag i Treasurys daglige rentekurve.
async function rente() {
  for (const aar of [new Date().getUTCFullYear(), new Date().getUTCFullYear() - 1]) {
    try {
      const csv = await hent('https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/' + aar +
        '/all?type=daily_treasury_yield_curve&field_tdr_date_value=' + aar + '&page&_format=csv', true);
      const linjer = (csv || '').trim().split(/\r?\n/);
      const hode = linjer[0].split(',').map(s => s.replace(/"/g, '').trim());
      const kol = hode.indexOf('10 Yr');
      if (kol < 0 || linjer.length < 2) continue;
      const rad = linjer[1].split(',');                       // nyeste dag står øverst
      const [m, d, y] = rad[0].replace(/"/g, '').split('/');
      const us10 = parseFloat(rad[kol]);
      if (isFinite(us10)) return { dato: y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0'), us10 };
    } catch (e) { console.warn('Rentekurven kunne ikke hentes for ' + aar + ': ' + e.message); }
  }
  return null;
}

const les = fil => { try { return JSON.parse(fs.readFileSync(fil, 'utf8')); } catch (e) { return null; } };
const pad = cik => String(cik).padStart(10, '0');

async function ettSelskap(cik, tving) {
  const inn = await hent('https://data.sec.gov/submissions/CIK' + pad(cik) + '.json');
  if (!inn) return null;
  const fil = path.join(UT, cik + '.json'), gammel = les(fil);
  // Samme årsrapport som sist og samme uttrekk: ingenting nytt å hente.
  const r = inn.filings?.recent;
  const sisteAar = r ? r.accessionNumber[r.form.findIndex(f => /^10-K/.test(f))] : null;
  if (!tving && gammel && gammel.v === V && (gammel.unntatt === 'finans' || (gammel.rapport && gammel.rapport.nr === sisteAar))) return gammel;
  const finans = +inn.sic >= 6000 && +inn.sic <= 6799;
  const fakta = finans ? null : await hent('https://data.sec.gov/api/xbrl/companyfacts/CIK' + pad(cik) + '.json');
  return trekkUt({ ...inn, cik }, fakta);
}

async function main() {
  if (!UA) {
    console.error('SEC_USER_AGENT mangler. SEC krever at automatiske kall sier hvem de er, med e-postadresse.\n' +
      'Eksempel:  SEC_USER_AGENT="Hverdagsverktøy kontakt@eksempel.no" node scripts/hent-sec.mjs');
    process.exit(1);
  }
  if (A.vis) {
    for (const cik of String(A.vis).split(',')) {
      const d = await ettSelskap(+cik, true), k = d ? kontroller(d, null) : null;
      console.log(JSON.stringify(d, null, 1));
      if (k) console.log('Kontroll:', JSON.stringify(k));
    }
    return;
  }
  fs.mkdirSync(UT, { recursive: true });
  const indeksFil = path.join(UT, 'indeks.json'), gammelIndeks = les(indeksFil);
  const kandidater = A.cik ? String(A.cik).split(',').map(c => ({ cik: +c })) : await storste(ANTALL);
  const maal = A.cik ? kandidater.length : ANTALL;
  const fasit = les(path.join(ROOT, 'scripts', 'sec-fasit.json'))?.selskaper || [];
  const fasitCik = new Map(fasit.map(f => [f.cik, f]));
  console.log(kandidater.length + ' kandidater, mål ' + maal + ', ' + fasit.length + ' selskaper i fasit');

  // Ingenting skrives før alle selskapene er hentet og kontrollert.
  const ferdige = new Map(), skriv = new Map(), stoppet = [], varsler = [], fasitAvvik = [];
  let feil = 0, endretGamle = 0, gamleMedSammeUttrekk = 0;
  for (const [i, { cik, flyt, eiendeler }] of kandidater.entries()) {
    if (ferdige.size >= maal) break;
    try {
      const fil = path.join(UT, cik + '.json'), gammel = les(fil);
      // Selskapene i fasiten hentes på nytt hver natt, så en feil i programmet eller hos SEC blir oppdaget.
      const d = await ettSelskap(cik, !!A.alt || fasitCik.has(cik));
      if (!d || !d.ticker || d.unntatt === 'ingen-tall' || d.unntatt === 'gammel') continue;
      if (tastefeil(d, flyt, eiendeler)) { console.warn('Hopper over ' + d.ticker + ': børsverdien i innleveringen er i feil enhet.'); continue; }
      if (fasitCik.has(cik)) { const a = motFasit(d, fasitCik.get(cik)); if (a) fasitAvvik.push(a); }
      const k = kontroller(d, gammel);
      for (const v of k.varsel) varsler.push({ ticker: d.ticker, cik, rapport: d.rapport?.nr || null, grunn: v });
      if (k.stopp.length) {
        stoppet.push({ ticker: d.ticker, cik, rapport: d.rapport?.nr || null, grunn: k.stopp.join('; ') });
        console.warn('Lagrer ikke ' + d.ticker + ': ' + k.stopp.join('; '));
        if (gammel && gammel.ticker) ferdige.set(cik, gammel);   // forrige versjon står til feilen er forstått
        continue;
      }
      const { _gjeldSamlet, ...lagre } = d;
      const tekst = JSON.stringify(lagre) + '\n';
      if (!fs.existsSync(fil) || fs.readFileSync(fil, 'utf8') !== tekst) {
        skriv.set(fil, tekst);
        if (gammel && gammel.v === V) endretGamle++;
      }
      if (gammel && gammel.v === V) gamleMedSammeUttrekk++;
      ferdige.set(cik, lagre);
    } catch (e) { feil++; console.warn('CIK ' + cik + ': ' + e.message); }
    if ((i + 1) % 50 === 0) console.log('  ' + (i + 1) + ' / ' + kandidater.length);
  }

  // Tre grunner til å stoppe uten å skrive noe:
  // 1. Mer enn hvert femte selskap feilet: noe er galt hos SEC eller i nettet.
  if (feil > maal / 5) { console.error(feil + ' av ' + maal + ' feilet. Ingenting er lagret.'); process.exit(1); }
  // 2. Et selskap i fasiten gir andre tall for samme årsrapport: programmet eller SEC har endret seg.
  if (fasitAvvik.length) {
    console.error('Fasiten stemmer ikke. Ingenting er lagret. Finn ut hva som har endret seg før neste kjøring:\n  ' + fasitAvvik.join('\n  '));
    sammendrag('Stoppet: fasiten stemmer ikke', fasitAvvik);
    process.exit(1);
  }
  // 3. Over en firedel av selskapene som var hentet fra før, fikk nye tall på én natt. Så mange årsrapporter
  //    kommer aldri samme dag, så det er nesten sikkert en feil. (Nye selskaper og --alt teller ikke.)
  if (!A.alt && gamleMedSammeUttrekk >= 40 && endretGamle > gamleMedSammeUttrekk / 4) {
    console.error(endretGamle + ' av ' + gamleMedSammeUttrekk + ' selskaper fikk nye tall på én natt. Ingenting er lagret.');
    sammendrag('Stoppet: for mange endringer på én natt', [endretGamle + ' av ' + gamleMedSammeUttrekk]);
    process.exit(1);
  }
  for (const [fil, tekst] of skriv) fs.writeFileSync(fil, tekst);
  const nye = skriv.size;

  // Indeksen: én rad per ticker → [ticker, navn, cik, 1 hvis unntatt]. Med --cik beholdes radene fra før.
  const rader = new Map();
  if (A.cik && gammelIndeks) for (const r of gammelIndeks.selskaper) if (!ferdige.has(r[2])) rader.set(r[0], r);
  for (const d of ferdige.values()) for (const t of d.tickere) rader.set(t, [t, d.navn, d.cik, d.unntatt ? 1 : 0]);
  const selskaper = [...rader.values()];   // største først, så søket viser de kjente selskapene øverst
  // Renten endrer seg litt hver dag. For å slippe en ny innsjekking hver natt byttes den bare når den
  // har flyttet seg minst 0,10 prosentpoeng, eller den lagrede er over en uke gammel.
  const ny = await rente(), gml = gammelIndeks?.rente || null;
  const r = ny && gml && Math.abs(ny.us10 - gml.us10) < 0.10 && dager(gml.dato, ny.dato) < 7 ? gml : (ny || gml);
  const uendret = gammelIndeks && JSON.stringify(gammelIndeks.selskaper) === JSON.stringify(selskaper) && JSON.stringify(gammelIndeks.rente) === JSON.stringify(r);
  if (!uendret) fs.writeFileSync(indeksFil, JSON.stringify({ oppdatert: new Date().toISOString().slice(0, 10), rente: r, selskaper }) + '\n');

  // Rydd bort filer for selskaper som har falt ut av lista (bare ved full kjøring).
  if (!A.cik) {
    const beholdt = new Set(selskaper.map(r => r[2] + '.json'));
    for (const f of fs.readdirSync(UT)) if (/^\d+\.json$/.test(f) && !beholdt.has(f)) fs.unlinkSync(path.join(UT, f));
  }
  // Kontrollrapporten: det som ble stoppet og det som bør ses på. Den leses av den månedlige gjennomgangen.
  // Varsler fra tidligere netter blir stående til selskapet leverer en ny årsrapport.
  const kontrollFil = path.join(UT, 'kontroll.json'), gammelKontroll = les(kontrollFil);
  const iDag = new Map(varsler.map(v => [v.cik + '|' + v.grunn, v]));
  for (const v of gammelKontroll?.varsler || []) {
    const d = ferdige.get(v.cik);
    if (d && d.rapport && d.rapport.nr === v.rapport && !iDag.has(v.cik + '|' + v.grunn)) iDag.set(v.cik + '|' + v.grunn, v);
  }
  const kontroll = { stoppet, varsler: [...iDag.values()] };
  if (!gammelKontroll || JSON.stringify({ stoppet: gammelKontroll.stoppet, varsler: gammelKontroll.varsler }) !== JSON.stringify(kontroll))
    fs.writeFileSync(kontrollFil, JSON.stringify({ oppdatert: new Date().toISOString().slice(0, 10), ...kontroll }, null, 1) + '\n');

  console.log('Ferdig: ' + ferdige.size + ' selskaper, ' + nye + ' filer endret, ' + feil + ' feil, ' + stoppet.length + ' stoppet, ' +
    kontroll.varsler.length + ' varsler. Rente: ' + (r ? r.us10 + ' % (' + r.dato + ')' : 'ikke hentet'));
  if (kontroll.varsler.length) sammendrag('Bør ses på', kontroll.varsler.map(v => v.ticker + ': ' + v.grunn));
  if (stoppet.length) {
    sammendrag('Ikke lagret (forrige versjon står)', stoppet.map(s => s.ticker + ': ' + s.grunn));
    console.error(stoppet.length + ' selskap(er) ble ikke lagret. Se data/sec/kontroll.json.');
    process.exit(1);
  }
}

// Skriver en liste til oppsummeringen på GitHub (siden for hver kjøring under Actions).
function sammendrag(tittel, linjer) {
  const fil = process.env.GITHUB_STEP_SUMMARY;
  if (!fil || !linjer.length) return;
  fs.appendFileSync(fil, '### ' + tittel + '\n\n' + linjer.map(l => '- ' + l).join('\n') + '\n\n');
}

// Kjøres som program, eller importeres av scripts/test-hent-sec.mjs (som tester kontrollene uten nett).
export { kontroller, motFasit, gjeld };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
