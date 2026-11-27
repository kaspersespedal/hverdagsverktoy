// Faste testeksempler for bokføringsverktøyet (shared/bokforing/). Kjør: node --test scripts/test-bokforing.js
const test = require('node:test');
const assert = require('node:assert');
const MAPPE = '../shared/bokforing/';
['kontoplan', 'satser', 'motor', 'hendelser', 'eksempel', 'kobling'].forEach((f) => require(MAPPE + f + '.js'));
const BOK = globalThis.HVBok, M = BOK.motor;
const ore = (x) => Math.round(x * 100);
// «1500 D 12500» → sammenlignbar liste, sortert
const linjer = (f) => f.linjer.map((l) => `${l.konto} ${l.belop > 0 ? 'D' : 'K'} ${Math.abs(l.belop) / 100}${l.mva != null ? ' [' + l.mva + ']' : ''}`).sort();
const as = (x) => M.nytt(Object.assign({ navn: 'Test', form: 'AS', mva: true, start: '2026-01-01' }, x));
const enk = (x) => as(Object.assign({ form: 'ENK' }, x));
function bok(r, id, felt, dato = '2026-03-10', x) {
  const f = BOK.lag(id, felt, r, dato, x);
  assert.deepStrictEqual(f.feil, [], id + ': ' + f.feil.join(' '));
  const u = M.bokfor(r, f); assert.ok(u.ok, u.feil.join(' '));
  return u.regnskap;
}
const stopp = (r, dato) => M.kontroller(r, dato || '2026-12-31').filter((k) => !k.ok && k.nivaa === 'stopp').map((k) => k.id);

test('tall og datoer', () => {
  assert.strictEqual(M.ore('12 500,50'), 1250050); assert.strictEqual(M.ore('1.234'), 123400); assert.strictEqual(M.ore('12.5'), 1250);
  assert.strictEqual(M.ore('−300'), -30000); assert.strictEqual(M.ore(''), 0);
  for (const t of ['abc', '12,345', '1,2,3', '--5', '1e5']) assert.ok(Number.isNaN(M.ore(t)), t);
  assert.strictEqual(M.kr(-123456), '−1 234,56');
  assert.ok(!M.erDato('2026-02-30')); assert.ok(M.erDato('2028-02-29'));
});

test('mva-frister følger helgeregelen', () => {
  const f = (a) => [1, 2, 3, 4, 5, 6].map((t) => M.mvaFrist(a, t));
  assert.deepStrictEqual(f(2026), ['2026-04-10', '2026-06-10', '2026-08-31', '2026-10-12', '2026-12-10', '2027-02-10']);
  assert.deepStrictEqual(f(2027), ['2027-04-12', '2027-06-10', '2027-08-31', '2027-10-11', '2027-12-10', '2028-02-10']);
  assert.strictEqual(M.virkedag('2027-05-15'), '2027-05-18');   // lørdag, søndag, 17. mai
  assert.strictEqual(M.virkedag('2026-11-28'), '2026-11-30');   // fredagslønn gir mandag
});

test('kontoplanen er hel', () => {
  const poster = new Set(BOK.balanseposter.flatMap((g) => g[2].map((p) => 'B ' + p[0])).concat(BOK.resultatposter.map((p) => 'R ' + p[0])));
  assert.strictEqual(new Set(BOK.kontoplan.map((k) => k.nr)).size, BOK.kontoplan.length);
  for (const k of BOK.kontoplan) {
    if (k.nr !== '8800') assert.ok(poster.has(k.post), k.nr);
    if (k.form !== 'ENK') assert.ok(k.skd.as, k.nr + ' mangler kode for AS');
    if (k.form !== 'AS') assert.ok(k.skd.enk, k.nr + ' mangler kode for ENK');
  }
});

test('regneeksempelet: saldo, resultat, balanse og mva', () => {
  const r = BOK.eksempel(true), s = M.saldoer(r, null, '2026-12-31');
  const fasit = { 1280: 16000, 1400: 45000, 1500: 20000, 1920: 109860, 2000: -30000, 2050: -46039.72, 2220: -80000, 2400: -4000, 2500: -10165, 2600: 0, 2700: 0, 2710: 0, 2740: 0, 2770: 0, 2775: -575.28, 2800: -10000, 2940: -4080, 2990: -6000,
    3000: -150000, 3110: -20000, 4000: 60000, 4090: -5000, 5000: 40000, 5020: 4080, 5400: 6215.28, 6000: 4000, 6421: 4000, 6700: 6000, 8150: 4500, 8300: 10165, 8800: 36039.72 };
  for (const k of Object.keys(fasit)) assert.strictEqual(s[k] || 0, ore(fasit[k]), 'konto ' + k);
  assert.strictEqual(Object.keys(s).filter((k) => s[k] && fasit[k] === undefined).length, 0);
  const res = M.resultat(r, '2026-01-01', '2026-12-31');
  assert.strictEqual(res.post[1], ore(170000)); assert.strictEqual(res.post[5], ore(55000)); assert.strictEqual(res.post[6], ore(50295.28));
  assert.strictEqual(res.post[7], ore(4000)); assert.strictEqual(res.post[9], ore(10000)); assert.strictEqual(res.drift, ore(50704.72));
  assert.strictEqual(res.post[18], ore(4500)); assert.strictEqual(res.forSkatt, ore(46204.72)); assert.strictEqual(res.skatt, ore(10165)); assert.strictEqual(res.aars, ore(36039.72));
  const b = M.balanse(r, '2026-12-31');
  assert.strictEqual(b.eiendeler, ore(190860)); assert.strictEqual(b.sumEkGjeld, ore(190860)); assert.strictEqual(b.udisponert, 0);
  assert.strictEqual(b.post['C.II.2'], ore(46039.72)); assert.strictEqual(b.post['D.III.5'], ore(10165));
  // Avgiften av feriepenger (575,28) ligger sammen med feriepengene, jf. NRS 8 pkt. 6.2.1.6
  assert.strictEqual(b.post['D.III.6'] || 0, 0); assert.strictEqual(b.post['D.III.7'], ore(20655.28));
  const m = M.mva(r, 2026, 1);
  assert.strictEqual(m.ut, ore(38500)); assert.strictEqual(m.inn, ore(21000)); assert.strictEqual(m.melding, ore(17500));
  const k = Object.fromEntries(m.koder.map((x) => [x.kode, x]));
  assert.strictEqual(k['3'].grunnlag, ore(150000)); assert.strictEqual(k['52'].grunnlag, ore(20000)); assert.strictEqual(k['86'].grunnlag, ore(4000)); assert.strictEqual(k['1'].inn, ore(20000));
  assert.deepStrictEqual(M.kontroller(r, '2026-12-31').filter((x) => !x.ok), []);
  assert.ok(M.kontantbro(r, '2026-12-31').ok);
});

test('pengebroen: hver linje har riktig navn og beløp, ikke bare riktig sum', () => {
  const bro = (r, d) => Object.fromEntries(M.kontantbro(r, d).linjer.map((l) => [l.gruppe, l.belop / 100]));
  assert.deepStrictEqual(bro(BOK.eksempel(), '2026-11-24'), { kunder: 5000, utstyr: -20000, leverandor: -8500, skatt: -12500, laan: -10000, annen: 4655.28 });
  // Etter årsslutt: utbyttet som er satt av, er ikke betalt, så eier skal ikke vises. Avskrivningen gjør utstyret mindre.
  assert.deepStrictEqual(bro(BOK.eksempel(true), '2026-12-31'), { kunder: 5000, lager: -5000, utstyr: -16000, leverandor: -8500, skatt: -2335, laan: -10000, annen: 10655.28 });
  let r = bok(as(), 'kapital', { belop: '30000', overkurs: '0' }); r = bok(r, 'eiertok', { belop: '5000', fra: '1920' }); r = bok(r, 'laan', { belop: '100000', gebyr: '0' });
  assert.deepStrictEqual(bro(r, '2026-12-31'), { laan: 100000, eier: 25000 });
});

test('før disponering står resultatet som egen linje i egenkapitalen', () => {
  const r = BOK.kjorTrinn(BOK.eksempel(), BOK.eksempelSlutt.slice(0, 4)), b = M.balanse(r, '2026-12-31');
  assert.deepStrictEqual(b.udisponertLinjer.map((l) => l.belop), [ore(36039.72)]);
  assert.strictEqual(b.post['C.II.2'], ore(20000)); assert.strictEqual(b.eiendeler, b.sumEkGjeld); assert.ok(M.kontantbro(r, '2026-12-31').ok);
});

// ── Katalogen: [hendelse, felt, forventede linjer, selskap, oppsett, dato] ──
const S = 'Kunde', L = 'Leverandør';
const kat = [
  ['S1', 'salg', { type: '25', belop: '10000', inkl: 'eks', betalt: 'faktura', part: S }, ['1500 D 12500', '3000 K 10000 [3]', '2700 K 2500']],
  ['S1 inkl', 'salg', { type: '25', belop: '12500', inkl: 'inkl', betalt: 'faktura', part: S }, ['1500 D 12500', '3000 K 10000 [3]', '2700 K 2500']],
  ['S3', 'salg', { type: '15', belop: '1000', inkl: 'eks', betalt: 'faktura', part: S }, ['1500 D 1150', '3010 K 1000 [31]', '2700 K 150']],
  ['S4', 'salg', { type: '12', belop: '2000', inkl: 'eks', betalt: 'faktura', part: S }, ['1500 D 2240', '3010 K 2000 [33]', '2700 K 240']],
  ['S2 kort', 'salg', { type: '25', belop: '8000', inkl: 'inkl', betalt: '1579' }, ['1579 D 8000', '3000 K 6400 [3]', '2700 K 1600']],
  ['S5', 'kredit', { type: '25', belop: '10000', part: S }, ['3000 D 10000 [3]', '2700 D 2500', '1500 K 12500']],
  ['S6a', 'forskudd', { belop: '12500' }, ['1920 D 12500', '2900 K 12500']],
  ['S6b', 'lever', { belop: '12500' }, ['2900 D 12500', '3000 K 10000 [3]', '2700 K 2500'], null, (r) => bok(r, 'forskudd', { belop: '12500' })],
  ['S7', 'abo', { belop: '12000', mnd: '12', part: S }, ['1500 D 15000', '2970 K 12000 [3]', '2700 K 3000']],
  ['S7 ENK', 'abo', { belop: '12000', mnd: '12', part: S }, ['1500 D 15000', '2900 K 12000 [3]', '2700 K 3000'], { form: 'ENK' }],
  ['S8', 'salg', { type: 'utland', belop: '50000', betalt: 'faktura', part: S }, ['1500 D 50000', '3110 K 50000 [52]']],
  ['S10', 'salg', { type: 'unntatt', belop: '20000', betalt: 'faktura', part: S }, ['1500 D 20000', '3200 K 20000 [6]']],
  ['S11', 'salg', { belop: '6000', betalt: 'faktura', part: S }, ['1500 D 6000', '3205 K 6000'], { mva: false }],
  ['S11 unntatt', 'salg', { omf: 'nei', belop: '6000', betalt: 'faktura', part: S }, ['1500 D 6000', '3200 K 6000'], { mva: false }],
  ['S5 ikke registrert', 'kredit', { omf: 'ja', belop: '6000', part: S }, ['3205 D 6000', '1500 K 6000'], { mva: false }],
  ['opparb ikke registrert', 'opparb', { omf: 'ja', belop: '500' }, ['1530 D 500', '3205 K 500'], { mva: false }],
  ['I1', 'innbet', { part: S, belop: '12500' }, ['1920 D 12500', '1500 K 12500']],
  ['I2', 'gebyr', { slag: '3900', belop: '38', part: S }, ['1500 D 38', '3900 K 38 [7]']],
  ['I3', 'gebyr', { slag: '8050', belop: '125,86', part: S }, ['1500 D 125.86', '8050 K 125.86 [7]']],
  ['I4', 'tap', { part: S, belop: '12500', sats: 'hoy', vilkar: 'konkurs' }, ['7830 D 10000 [1]', '2710 D 2500', '1500 K 12500']],
  ['K1', 'kjop', { type: 'vare', belop: '12500', betalt: 'faktura', part: L, bilag: true }, ['4000 D 10000 [1]', '2710 D 2500', '2400 K 12500']],
  ['K1 mat', 'kjop', { type: 'mat', belop: '2300', betalt: 'faktura', part: L, bilag: true }, ['4010 D 2000 [11]', '2710 D 300', '2400 K 2300']],
  ['K3', 'kjop', { type: 'program', belop: '7500', betalt: 'faktura', part: L, bilag: true, fordel: true, mnd: '12' }, ['1571 D 6000 [1]', '2710 D 1500', '2400 K 7500']],
  ['K4', 'kjop', { type: 'leie0', belop: '15000', betalt: 'faktura', part: L, bilag: true }, ['6300 D 15000 [0]', '2400 K 15000']],
  ['K5', 'kjop', { type: 'leie1', belop: '18750', betalt: 'faktura', part: L, bilag: true }, ['6300 D 15000 [1]', '2710 D 3750', '2400 K 18750']],
  ['K6', 'kjop', { type: 'kontor', belop: '1000', betalt: 'faktura', part: L, bilag: true }, ['6800 D 800 [1]', '2710 D 200', '2400 K 1000']],
  ['K7', 'kjop', { type: 'forsikring', belop: '12000', betalt: 'faktura', part: L, bilag: true, fordel: true, mnd: '12' }, ['1571 D 12000 [0]', '2400 K 12000']],
  ['K8', 'kjop', { type: 'bankgebyr', belop: '50', betalt: '1920', bilag: true }, ['7770 D 50 [0]', '1920 K 50']],
  ['K9', 'kortopp', { belop: '7900', gebyr: '100' }, ['1920 D 7900', '7770 D 100 [0]', '1579 K 8000']],
  ['K11a', 'kjop', { type: 'drivP', belop: '1250', betalt: '1920', bilag: true }, ['7000 D 1250 [0]', '1920 K 1250']],
  ['K11b', 'kjop', { type: 'drivV', belop: '1250', betalt: '1920', bilag: true }, ['7000 D 1000 [1]', '2710 D 250', '1920 K 1250']],
  ['K12a', 'kjop', { type: 'personbil', belop: '400000', betalt: 'faktura', part: L, bilag: true }, ['1207 D 400000 [0]', '2400 K 400000']],
  ['K12b', 'kjop', { type: 'varebil', belop: '375000', betalt: 'faktura', part: L, bilag: true }, ['1238 D 300000 [1]', '2710 D 75000', '2400 K 375000']],
  ['K13 AS', 'kjop', { type: 'repr', belop: '4000', betalt: '1920', bilag: true }, ['7360 D 4000 [0]', '1920 K 4000']],
  ['K13 ENK', 'kjop', { type: 'repr', belop: '4000', betalt: '1920', bilag: true }, ['2060 D 4000 [0]', '1920 K 4000'], { form: 'ENK' }],
  ['K14', 'kjop', { type: 'bevert', belop: '1000', betalt: '1920', bilag: true }, ['7350 D 1000 [0]', '1920 K 1000']],
  ['K15', 'kjop', { type: 'matans', belop: '690', betalt: '1920', bilag: true }, ['5900 D 690 [0]', '1920 K 690']],
  ['K17', 'kjop', { type: 'smaa', belop: '20000', betalt: 'faktura', part: L, bilag: true }, ['6500 D 16000 [1]', '2710 D 4000', '2400 K 20000']],
  ['K18', 'kjop', { type: 'maskin', belop: '75000', betalt: 'faktura', part: L, bilag: true }, ['1205 D 60000 [1]', '2710 D 15000', '2400 K 75000']],
  ['K19a', 'import', { belop: '100000', betalt: 'faktura', part: L }, ['4040 D 100000 [21]', '2400 K 100000']],
  ['K19b', 'importmva', { belop: '106000' }, ['4080 D 106000 [81]', '4081 K 106000', '2710 D 26500', '2700 K 26500']],
  ['K20', 'utland', { hva: '6421', belop: '8000', betalt: 'faktura', part: L }, ['6421 D 8000 [86]', '2400 K 8000', '2710 D 2000', '2700 K 2000']],
  ['K20 uten registrering', 'utland', { hva: '6421', belop: '8000', betalt: 'faktura', part: L, kvartal: true }, ['6421 D 8000 [87]', '6421 D 2000', '2400 K 8000', '2700 K 2000'], { mva: false }],
  ['K21', 'kjop', { type: 'raad', belop: '5000', betalt: 'faktura', part: L, bilag: true, utenmva: true }, ['6700 D 5000 [0]', '2400 K 5000']],
  ['K22', 'kjop', { type: 'annet', belop: '12500', betalt: '1900', bilag: true }, ['7700 D 12500 [0]', '1900 K 12500']],
  ['K23', 'kjop', { type: 'kontor', belop: '1250', betalt: 'privat', bilag: true }, ['6800 D 1000 [1]', '2710 D 250', '2910 K 1250']],
  ['K23 ENK', 'kjop', { type: 'kontor', belop: '1250', betalt: 'privat', bilag: true }, ['6800 D 1000 [1]', '2710 D 250', '2061 K 1250'], { form: 'ENK' }],
  ['K23 hotell', 'kjop', { type: 'reise', belop: '1120', betalt: 'privat', bilag: true }, ['7165 D 1000 [13]', '2710 D 120', '2910 K 1120']],
  ['uten bilag', 'kjop', { type: 'kontor', belop: '1250', betalt: '1920', bilag: false }, ['6800 D 1250 [0]', '1920 K 1250']],
  ['uten registrering', 'kjop', { type: 'kontor', belop: '1250', betalt: '1920', bilag: true }, ['6800 D 1250 [0]', '1920 K 1250'], { mva: false }],
  ['B1', 'betlev', { part: L, belop: '12500', trukket: '' }, ['2400 D 12500', '1920 K 12500']],
  ['B6 tap', 'betlev', { part: L, belop: '11500', trukket: '11700' }, ['2400 D 11500', '8160 D 200', '1920 K 11700']],
  ['B6 gevinst', 'betlev', { part: L, belop: '11500', trukket: '11300' }, ['2400 D 11500', '8060 K 200', '1920 K 11300']],
  ['B4', 'flytt', { fra: '1920', til: '1900', belop: '3000' }, ['1900 D 3000', '1920 K 3000']],
  ['C01', 'kapital', { belop: '30000', overkurs: '6825' }, ['1920 D 36825', '2000 K 30000', '2020 K 6825']],
  ['C02a', 'stift', { belop: '6825' }, ['2020 D 6825', '1920 K 6825'], null, (r) => bok(r, 'kapital', { belop: '30000', overkurs: '6825' })],
  ['C02b', 'stift', { belop: '6825' }, ['2030 D 6825', '1920 K 6825']],
  ['C03a', 'eierlaan', { belop: '100000' }, ['1920 D 100000', '2250 K 100000']],
  ['C05', 'eiertok', { belop: '40000', fra: '1920' }, ['1565 D 40000', '1920 K 40000']],
  ['C06', 'uttak', { belop: '15000' }, ['2060 D 15000', '1920 K 15000'], { form: 'ENK' }],
  ['C07', 'innskudd', { belop: '10000' }, ['1920 D 10000', '2061 K 10000'], { form: 'ENK' }],
  ['C08b', 'enkskatt', { belop: '22000' }, ['2063 D 22000', '1920 K 22000'], { form: 'ENK' }],
  ['C09', 'uttakvare', { belop: '1000' }, ['2060 D 1250', '3080 K 1000 [3]', '2700 K 250'], { form: 'ENK' }],
  ['C10', 'tilskudd', { belop: '50000' }, ['1920 D 50000', '3400 K 50000 [7]']],
  ['C11', 'lonn', { belop: '40000', trekk: '12000', aga: '14,1', ferie: '10,2' }, ['5000 D 40000', '2600 K 12000', '1920 K 28000', '5400 D 5640', '2770 K 5640', '5020 D 4080', '2940 K 4080', '5400 D 575.28', '2775 K 575.28']],
  ['C12', 'trekk', { belop: '12000' }, ['2600 D 12000', '1920 K 12000']],
  ['C13', 'agabet', { belop: '11280' }, ['2770 D 11280', '1920 K 11280']],
  ['C14', 'feriebet', { belop: '4080', aga: '14,1' }, ['2940 D 4080', '1920 K 4080', '2775 D 575.28', '2770 K 575.28'], null, (r) => bok(r, 'lonn', { belop: '40000', trekk: '12000', aga: '14,1', ferie: '10,2' })],
  ['C15', 'otp', { belop: '800', aga: '14,1' }, ['5420 D 800', '2990 K 800', '5400 D 112.8', '2776 K 112.8']],
  ['pensjon betalt', 'otpbet', { belop: '800' }, ['2990 D 800', '1920 K 800', '2776 D 112.8', '2770 K 112.8'], null, (r) => bok(r, 'otp', { belop: '800', aga: '14,1' })],
  ['pensjon halvt betalt', 'otpbet', { belop: '400' }, ['2990 D 400', '1920 K 400', '2776 D 56.4', '2770 K 56.4'], null, (r) => bok(r, 'otp', { belop: '800', aga: '14,1' })],
  ['vann 15 %', 'kjop', { type: 'vann', belop: '11500', betalt: '1920', bilag: true }, ['6395 D 10000 [11]', '2710 D 1500', '1920 K 11500']],
  ['verksted personbil', 'kjop', { type: 'drivP', belop: '10000', betalt: '1920', bilag: true }, ['7000 D 10000 [0]', '1920 K 10000']],
  ['gave liten under 200', 'kjop', { type: 'gaveliten', billig: true, belop: '1250', betalt: '1920', bilag: true }, ['7420 D 1000 [1]', '2710 D 250', '1920 K 1250']],
  ['gave liten', 'kjop', { type: 'gaveliten', billig: false, belop: '300', betalt: '1920', bilag: true }, ['7420 D 300 [0]', '1920 K 300']],
  ['gave annen ENK', 'kjop', { type: 'gavekunde', belop: '900', betalt: '1920', bilag: true }, ['2060 D 900 [0]', '1920 K 900'], { form: 'ENK' }],
  ['morarente', 'kjop', { type: 'morarente', belop: '120', betalt: '1920', bilag: true }, ['8150 D 120 [0]', '1920 K 120']],
  ['rente på kundekrav ENK', 'gebyr', { slag: '8050', belop: '50', part: S }, ['1500 D 50', '3900 K 50 [7]'], { form: 'ENK' }],
  ['import ikke registrert', 'import', { hva: '4040', belop: '1000', innf: '250', betalt: '1920' }, ['4040 D 1250 [0]', '1920 K 1000', '1920 K 250'], { mva: false }],
  ['import utstyr', 'import', { hva: '1280', belop: '40000', betalt: '1920' }, ['1280 D 40000 [21]', '1920 K 40000']],
  ['brukt varebil', 'salgutstyr', { konto: '1238', belop: '150000', bokf: '120000' }, ['1920 D 150000', '1238 K 120000 [5]', '3880 K 30000 [5]'], null, (r) => bok(r, 'kjop', { type: 'varebil', belop: '250000', betalt: '1920', bilag: true })],
  ['brukt personbil med tap', 'salgutstyr', { konto: '1207', belop: '90000', bokf: '100000' }, ['1920 D 90000', '1207 K 100000 [5]', '7880 D 10000 [5]'], null, (r) => bok(r, 'kjop', { type: 'personbil', belop: '200000', betalt: '1920', bilag: true })],
  ['brukt utstyr ENK', 'salgutstyr', { konto: '1280', belop: '10000' }, ['1920 D 12500', '1280 K 10000 [3]', '2700 K 2500'], { form: 'ENK' }, (r) => bok(r, 'kjop', { type: 'pc', belop: '50000', betalt: '1920', bilag: true })],
  ['brukt utstyr ENK over saldo', 'salgutstyr', { konto: '1280', belop: '50000' }, ['1920 D 62500', '1280 K 40000 [3]', '3895 K 10000 [3]', '2700 K 12500'], { form: 'ENK' }, (r) => bok(r, 'kjop', { type: 'pc', belop: '50000', betalt: '1920', bilag: true })],
  ['saldoavskrivning ENK', 'saldoavskr', { konto: '1280', sats: '30' }, ['6000 D 14400', '1280 K 14400'], { form: 'ENK' }, (r) => bok(r, 'kjop', { type: 'pc', belop: '60000', betalt: '1920', bilag: true })],
  ['utsatt skattefordel', 'utsatt', { belop: '-1000' }, ['1070 D 1000', '8320 K 1000']],
  ['utsatt skatt ned forbi null', 'utsatt', { belop: '-1500' }, ['1070 D 500', '2120 D 1000', '8320 K 1500'], null, (r) => bok(r, 'utsatt', { belop: '1000' })],
  ['utsatt skatt opp etter fordel', 'utsatt', { belop: '1500' }, ['1070 K 1000', '2120 K 500', '8320 D 1500'], null, (r) => bok(r, 'utsatt', { belop: '-1000' })],
  ['omvendt mva kvartal', 'omvmva', { belop: '2500,40' }, ['2700 D 2500.4', '2740 K 2500', '7790 K 0.4'], { mva: false }, (r) => bok(r, 'utland', { hva: '6421', belop: '10001,60', betalt: '1920', kvartal: true })],
  ['omvendt mva betalt', 'omvbet', { belop: '2500' }, ['2740 D 2500', '1920 K 2500'], { mva: false }],
  ['levkredit uten mva', 'levkredit', { type: 'kontor', belop: '1000', part: L, utenmva: true }, ['2400 D 1000', '6800 K 1000 [0]']],
  ['egen bil ENK', 'egenbil', { km: '1000' }, ['7080 D 3500', '2061 K 3500'], { form: 'ENK' }],
  ['privat bruk av firmabil', 'privatbil', { belop: '5000' }, ['2060 D 5000', '7099 K 5000'], { form: 'ENK' }],
  ['privat telefon', 'privattlf', { belop: '4392' }, ['2060 D 4392', '6998 K 4392'], { form: 'ENK' }],
  ['hjemmekontor', 'hjemmekontor', { belop: '2240' }, ['7700 D 2240', '2061 K 2240'], { form: 'ENK' }],
  ['egen pensjon', 'egenpensjon', { belop: '10000' }, ['5950 D 10000', '1920 K 10000'], { form: 'ENK' }],
  ['C17', 'reise', { km: '200', diett: '200' }, ['7100 D 900', '2910 K 900']],
  ['C19', 'laan', { belop: '300000', gebyr: '3000' }, ['1920 D 297000', '8150 D 3000', '2220 K 300000']],
  ['C20', 'avdrag', { belop: '7000', rente: '1500' }, ['2220 D 7000', '8150 D 1500', '1920 K 8500']],
  ['C21', 'renteinn', { belop: '420' }, ['1920 D 420', '8050 K 420']],
  ['C24', 'avskriv', { konto: '1205', kost: '120000', aar: '5', mnd: '6' }, ['6000 D 12000', '1205 K 12000'], null, (r) => bok(r, 'kjop', { type: 'maskin', belop: '150000', betalt: '1920', bilag: true })],
  ['C25a', 'salgutstyr', { konto: '1205', belop: '100000', bokf: '84000' }, ['1920 D 125000', '1205 K 84000 [3]', '3880 K 16000 [3]', '2700 K 25000']],
  ['C25b', 'salgutstyr', { konto: '1205', belop: '70000', bokf: '84000' }, ['1920 D 87500', '1205 K 84000 [3]', '7880 D 14000 [3]', '2700 K 17500']],
  ['C25c', 'salgutstyr', { konto: '1205', belop: '0', bokf: '84000' }, ['7880 D 84000', '1205 K 84000']],
  ['C27', 'palopt', { konto: '6700', belop: '8000' }, ['6700 D 8000', '2990 K 8000']],
  ['C29', 'opparb', { belop: '15000' }, ['1530 D 15000', '3000 K 15000']],
  ['C30', 'vare', { belop: '74000' }, ['4090 D 6000', '1400 K 6000'], null, (r) => bok(r, 'vare', { belop: '80000' })],
  ['C32', 'skatt', { belop: '191000' }, ['8300 D 42020', '2500 K 42020'], null, null, '2026-12-31'],
  ['C33', 'utsatt', { belop: '12000' }, ['8320 D 12000', '2120 K 12000']],
  ['C35', 'skattbet', { belop: '36000' }, ['2500 D 36000', '1920 K 36000']]
];
for (const [navn, id, felt, fasit, sel, oppsett, dato] of kat) test('katalog ' + navn, () => {
  let r = as(sel); if (oppsett) r = oppsett(r);
  const f = BOK.lag(id, felt, r, dato || '2026-03-10');
  assert.deepStrictEqual(f.feil, []); assert.deepStrictEqual(linjer(f), fasit.slice().sort());
  assert.ok(M.virkning(r, f).balanserer); assert.deepStrictEqual(stopp(M.bokfor(r, f).regnskap), []);
  assert.ok(f.forklaring.length > 10 && f.bilagskrav.length > 5, 'mangler forklaring eller bilagskrav');
});

test('hver hendelse i katalogen er testet, eller står på lista over andre tester', () => {
  const andre = ['mvaopp', 'mvabet', 'disponer', 'utbytte', 'bruk', 'opptjen', 'fri', 'ib', 'levkredit', 'eiertilb', 'eierlaantilb', 'utleggtilb'];
  const testet = new Set(kat.map((k) => k[1]).concat(andre));
  assert.deepStrictEqual(BOK.hendelser.map((h) => h.id).filter((id) => !testet.has(id)), []);
});

test('mva-oppgjør: betale, til gode, øre og tillegg etter oppgjør (B2, B3)', () => {
  let r = as();
  r = bok(r, 'salg', { type: '25', belop: '120000', inkl: 'eks', betalt: '1920' }, '2026-01-10');
  r = bok(r, 'kjop', { type: 'vare', belop: '90000', betalt: '1920', bilag: true }, '2026-01-11');
  let f = BOK.lag('mvaopp', { termin: '2026-1' }, r, '2026-03-01');
  assert.strictEqual(f.dato, '2026-02-28'); assert.deepStrictEqual(linjer(f), ['2700 D 30000', '2710 K 18000', '2740 K 12000']);
  r = M.bokfor(r, f).regnskap;
  assert.deepStrictEqual(BOK.lag('mvaopp', { termin: '2026-1' }, r, '2026-03-01').feil, ['Terminen er allerede gjort opp.']);
  // En sen føring i terminen varsles, slår ut i K10, og kan gjøres opp som et tillegg
  f = BOK.lag('salg', { type: '25', belop: '1000', inkl: 'eks', betalt: '1920' }, r, '2026-02-20');
  assert.ok(f.varsler.some((v) => /ny melding/.test(v)));
  r = M.bokfor(r, f).regnskap;
  assert.ok(!M.kontroller(r, '2026-03-31').find((k) => k.id === 'K10').ok);
  r = bok(r, 'mvaopp', { termin: '2026-1' }, '2026-03-01');
  assert.ok(M.kontroller(r, '2026-03-31').find((k) => k.id === 'K10').ok);
  assert.strictEqual(M.saldoer(r)['2740'], -ore(12250));
  r = bok(r, 'mvabet', { belop: '12250' }, '2026-04-10'); assert.strictEqual(M.saldoer(r)['2740'], 0);
  let g = bok(as(), 'kjop', { type: 'vare', belop: '125000', betalt: '1920', bilag: true }, '2026-01-11');
  g = bok(g, 'mvaopp', { termin: '2026-1' }, '2026-03-01'); assert.strictEqual(M.saldoer(g)['2740'], ore(25000));
  f = BOK.lag('mvabet', { belop: '25000' }, g, '2026-04-10'); assert.deepStrictEqual(linjer(f), ['1920 D 25000', '2740 K 25000']);
  let o = bok(as(), 'salg', { type: '25', belop: '100,30', inkl: 'eks', betalt: '1920' }, '2026-01-10');
  f = BOK.lag('mvaopp', { termin: '2026-1' }, o, '2026-03-01');
  assert.deepStrictEqual(linjer(f), ['2700 D 25.08', '2740 K 25', '7790 K 0.08']);
});

test('fordeling: forhåndsbetalt og forskuddsfakturert går opp til siste øre', () => {
  let r = bok(as(), 'kjop', { type: 'program', belop: '1250', betalt: '1920', bilag: true, fordel: true, mnd: '3' }, '2026-01-05');
  for (let i = 0; i < 3; i++) { const c = BOK.kontekst(r, {}, '2026-0' + (i + 1) + '-28'), felt = BOK.hendelse.bruk.felt(c), std = felt[1].std({}); r = bok(r, 'bruk', { plan: '1', belop: std }, '2026-0' + (i + 1) + '-28'); }
  assert.strictEqual(M.saldoer(r)['1571'], 0); assert.strictEqual(M.saldoer(r)['6400'], ore(1000));
  assert.deepStrictEqual(BOK.hendelse.bruk.felt(BOK.kontekst(r, {}, '2026-04-01'))[0].valg, []);
  let a = bok(as(), 'abo', { belop: '12000', mnd: '12', part: S }, '2026-01-05');
  a = bok(a, 'opptjen', { plan: '1', belop: '1000' }, '2026-01-31'); assert.strictEqual(M.saldoer(a)['2970'], -ore(11000));
  assert.ok(BOK.lag('opptjen', { plan: '1', belop: '11001' }, a, '2026-02-28').feil.length);
  assert.ok(M.mva(a, 2026, 1).koder[0].ok);   // fordelingen endrer ikke mva-en
});

test('retting reverserer hele bilaget, en gang, med grunn og lenke begge veier', () => {
  let r = bok(as(), 'kjop', { type: 'kontor', belop: '1250', betalt: '1920', bilag: true });
  assert.ok(M.sjekk(r, M.reverser(r, 1, '2026-03-12', '')).length);
  r = M.bokfor(r, M.reverser(r, 1, '2026-03-12', 'Feil beløp')).regnskap;
  assert.ok(Object.values(M.saldoer(r)).every((x) => x === 0)); assert.strictEqual(r.bilag[1].reverserer, 1); assert.strictEqual(M.reversertAv(r, 1), 2);
  assert.ok(M.reverser(r, 1, '2026-03-12', 'x').feil.length); assert.ok(M.reverser(r, 2, '2026-03-12', 'x').feil.length);
  assert.strictEqual(M.mva(r, 2026, 2).netto, 0); assert.deepStrictEqual(stopp(r), []);
  let o = bok(as(), 'salg', { type: '25', belop: '1000', inkl: 'eks', betalt: '1920' }, '2026-01-10');
  o = bok(o, 'mvaopp', { termin: '2026-1' }, '2026-03-01');
  o = M.bokfor(o, M.reverser(o, 2, '2026-02-28', 'Feil')).regnskap;
  assert.strictEqual(M.mva(o, 2026, 1).oppgjor.length, 0); assert.strictEqual(M.saldoer(o)['2740'], 0);
});

test('bokførte bilag kan ikke endres gjennom motoren', () => {
  const r = bok(as(), 'forskudd', { belop: '100' }), for_ = JSON.stringify(r);
  bok(r, 'forskudd', { belop: '200' }); M.virkning(r, BOK.lag('forskudd', { belop: '5' }, r, '2026-03-01'));
  assert.strictEqual(JSON.stringify(r), for_);
});

test('det som skal stoppes, blir stoppet', () => {
  const r = as(), nei = (id, felt, dato, sel) => assert.ok(BOK.lag(id, felt, sel || r, dato || '2026-03-10').feil.length, id + JSON.stringify(felt));
  nei('salg', { type: '25', belop: '', inkl: 'eks', betalt: '1920' }); nei('salg', { type: '25', belop: 'ti', inkl: 'eks', betalt: '1920' }); nei('salg', { type: '25', belop: '-5', inkl: 'eks', betalt: '1920' });
  nei('salg', { type: '25', belop: '100', inkl: 'eks', betalt: 'faktura', part: '' }); nei('kjop', { type: '', belop: '100', betalt: '1920' });
  nei('forskudd', { belop: '100' }, '2026-02-30'); nei('forskudd', { belop: '100' }, '2025-12-31'); nei('forskudd', { belop: '100' }, '2026-03-10', Object.assign({}, r, { lukketTil: '2026-03-31' }));
  nei('utbytte', { belop: '1000' }); nei('skatt', { belop: '0' }); nei('disponer', { utb: '0' }); nei('lonn', { belop: '100', trekk: '200', aga: '14,1', ferie: '10,2' });
  nei('fri', { linjer: [{ konto: '2700', debet: '100' }, { konto: '1920', kredit: '100' }] }); nei('fri', { linjer: [{ konto: '1500', debet: '100' }, { konto: '1920', kredit: '100' }] });
  const ubal = BOK.lag('fri', { linjer: [{ konto: '6800', debet: '100' }, { konto: '1920', kredit: '90' }] }, r, '2026-03-10', { grunn: 'x' });
  assert.ok(ubal.feil.some((x) => /10,00 kr/.test(x))); assert.strictEqual(M.bokfor(r, ubal).ok, false);
  assert.ok(BOK.lag('fri', { linjer: [{ konto: '2051', kredit: '100' }, { konto: '1920', debet: '100' }] }, r, '2026-03-10', { grunn: 'x' }).feil.some((x) => /bare i ENK/.test(x)));
  assert.ok(BOK.lag('ib', { linjer: [{ konto: '3000', kredit: '100' }, { konto: '1920', debet: '100' }] }, r, '2026-01-01').feil.length);
});

test('varslene kommer når de skal', () => {
  const r = as(), v = (id, felt, dato, sel) => BOK.lag(id, felt, sel || r, dato || '2026-03-10').varsler.join(' | ');
  assert.match(v('kjop', { type: 'smaa', belop: '40000', betalt: '1920', bilag: true }), /Større kjøp/); assert.match(v('kjop', { type: 'pc', belop: '10000', betalt: '1920', bilag: true }), /Småutstyr/);
  assert.match(v('kjop', { type: 'annet', belop: '10000', betalt: '1900', bilag: true }), /8-8/); assert.match(v('kjop', { type: 'annet', belop: '4000', betalt: '1900', bilag: true }), /regnes samlet/); assert.doesNotMatch(v('kjop', { type: 'annet', belop: '9999', betalt: '1900', bilag: true }), /8-8/);
  assert.match(v('kjop', { type: 'bevert', belop: '100', betalt: '1920', bilag: true }), /592 kr per person/); assert.match(v('kjop', { type: 'gaveliten', belop: '100', betalt: '1920', bilag: true }), /høyst 324 kr/);
  assert.match(v('kjop', { type: 'gaveliten', belop: '100', betalt: '1920', bilag: true }, '2027-03-10'), /høyst 333 kr/); assert.match(v('kjop', { type: 'bevert', belop: '100', betalt: '1920', bilag: true }, '2027-03-10'), /608 kr per person/);
  assert.match(v('eiertok', { belop: '100000', fra: '1920' }), /Hele beløpet/); assert.match(v('lonn', { belop: '40000', trekk: '1', aga: '14,1', ferie: '10,2' }, '2026-11-27'), /30\.11\.2026/);
  assert.match(v('salg', { belop: '50001', betalt: '1920' }, null, as({ mva: false })), /skal registreres/); assert.match(v('salg', { belop: '45000', betalt: '1920' }, null, as({ mva: false })), /Grensen/);
  assert.match(v('forskudd', { belop: '1' }, '2027-02-01'), /foreslått eller ikke fastsatt/); assert.match(v('forskudd', { belop: '1' }, '2029-02-01'), /ikke lagt inn/);
});

// Skatte-ABC L-5-2.3.2, eksempel 1–3 (med datoer i 2026)
const eier = (trinn) => trinn.reduce((r, [dato, b]) => bok(r, b > 0 ? 'eiertok' : 'eiertilb', b > 0 ? { belop: String(b), fra: '1920' } : { belop: String(-b) }, dato), as());
const utbytte = (r, dato) => M.eierkrav(r, dato).utbytte / 100;
test('lån til eier: eksemplene i Skatte-ABC L-5-2.3.2', () => {
  assert.strictEqual(utbytte(eier([['2026-01-01', 40000], ['2026-02-01', 50000], ['2026-03-01', -50000], ['2026-04-01', -40000]]), '2026-12-31'), 0);
  const to = eier([['2026-01-01', 40000], ['2026-02-01', 50000], ['2026-03-01', -30000]]);
  assert.strictEqual(utbytte(to, '2026-03-02'), 0); assert.strictEqual(utbytte(to, '2026-03-03'), 10000); assert.strictEqual(utbytte(to, '2026-04-02'), 10000); assert.strictEqual(utbytte(to, '2026-04-03'), 60000);
  const tre = eier([['2026-01-01', 40000], ['2026-02-01', 50000], ['2026-02-15', 60000], ['2026-02-20', -150000]]);
  assert.strictEqual(utbytte(tre, '2026-02-14'), 0); assert.strictEqual(utbytte(tre, '2026-02-15'), 150000);
  // Tilbakebetaling tar det ikke bort: kontrollen skal fortsatt slå ut når saldoen er null
  assert.strictEqual(M.eierkrav(tre, '2026-12-31').saldo, 0); assert.strictEqual(utbytte(tre, '2026-12-31'), 150000);
  assert.ok(!M.kontroller(tre, '2026-12-31').find((k) => k.id === 'K16').ok);
});
test('lån til eier: grensene, rettet føring og eldste først', () => {
  assert.strictEqual(utbytte(eier([['2026-01-01', 99999], ['2026-03-02', -99999]]), '2026-12-31'), 0);      // dag 60
  assert.strictEqual(utbytte(eier([['2026-01-01', 99999], ['2026-03-03', -99999]]), '2026-12-31'), 99999);  // dag 61
  assert.strictEqual(utbytte(eier([['2026-01-01', 100000], ['2026-01-02', -100000]]), '2026-12-31'), 100000);
  const r = eier([['2026-01-10', 30000], ['2026-03-01', 20000], ['2026-03-05', -35000]]), e = M.eierkrav(r, '2026-03-31');
  assert.deepStrictEqual(e, { saldo: ore(15000), eldste: '2026-03-01', dager: 30, utbytte: 0 });
  let f = eier([['2026-01-10', 200000]]); f = M.bokfor(f, M.reverser(f, 1, '2026-05-10', 'Feil konto')).regnskap;
  assert.strictEqual(utbytte(f, '2026-12-31'), 0);
});

test('disponering: overskudd, underskudd og dekning av gammelt tap', () => {
  let r = bok(as(), 'salg', { type: 'unntatt', belop: '100000', betalt: '1920' }); r = bok(r, 'skatt', { belop: '100000' }, '2026-12-31'); r = bok(r, 'disponer', { utb: '50000' }, '2026-12-31');
  assert.strictEqual(M.saldoer(r)['2800'], -ore(50000)); assert.strictEqual(M.saldoer(r)['2050'], -ore(28000)); assert.ok(BOK.lag('disponer', { utb: '0' }, r, '2026-12-31').feil.length);
  r = bok(r, 'utbytte', { belop: '50000' }, '2027-07-01'); assert.strictEqual(M.saldoer(r)['2800'], 0);
  r = bok(r, 'kjop', { type: 'raad', belop: '40000', betalt: '1920', bilag: true, utenmva: true }, '2027-08-01'); r = bok(r, 'disponer', { utb: '0' }, '2027-12-31');
  assert.strictEqual(M.saldoer(r)['2050'], 0); assert.strictEqual(M.saldoer(r)['2080'], ore(12000));
  r = bok(r, 'salg', { type: 'unntatt', belop: '20000', betalt: '1920' }, '2028-01-10'); r = bok(r, 'disponer', { utb: '0' }, '2028-12-31');
  assert.strictEqual(M.saldoer(r)['2080'], 0); assert.strictEqual(M.saldoer(r)['2050'], -ore(8000)); assert.deepStrictEqual(stopp(r, '2028-12-31'), []);
});

test('nytt år: resultat fra null, balanse videre, udisponert vises for hvert år', () => {
  let r = BOK.kjorTrinn(BOK.eksempel(), BOK.eksempelSlutt.slice(0, 4)); r = bok(r, 'salg', { type: 'unntatt', belop: '5000', betalt: '1920' }, '2027-01-15');
  assert.strictEqual(M.resultat(r, '2027-01-01', '2027-12-31').aars, ore(5000));
  const b = M.balanse(r, '2027-01-31'); assert.deepStrictEqual(b.udisponertLinjer.map((l) => [l.aar, l.belop]), [[2026, ore(36039.72)], [2027, ore(5000)]]); assert.strictEqual(b.eiendeler, b.sumEkGjeld);
  assert.strictEqual(M.hovedbok(r, '1920', '2027-01-01', '2027-12-31').ib, ore(109860)); assert.strictEqual(M.hovedbok(r, '3000', '2027-01-01', '2027-12-31').ib, 0); assert.ok(M.kontantbro(r, '2027-01-31').ok);
  let e = bok(enk(), 'salg', { type: 'unntatt', belop: '7000', betalt: '1920' }, '2026-05-01'); e = bok(e, 'uttak', { belop: '2000' }, '2027-02-01');
  const eb = M.balanse(e, '2027-02-28'); assert.strictEqual(eb.post['C.II.2'], ore(5000)); assert.strictEqual(eb.udisponertLinjer.length, 0); assert.strictEqual(eb.eiendeler, eb.sumEkGjeld); assert.deepStrictEqual(stopp(e, '2027-02-28'), []);
});

test('kontrollene slår ut når noe er galt', () => {
  const ok = BOK.eksempel(true), kopi = () => JSON.parse(JSON.stringify(ok)), slo = (r, d) => M.kontroller(r, d || '2026-12-31').filter((k) => !k.ok).map((k) => k.id);
  assert.deepStrictEqual(slo(ok), []);
  let r = kopi(); r.bilag[3].linjer[0].belop += 100; assert.ok(['K1', 'K3', 'K5'].every((k) => slo(r).includes(k)), 'tastefeil');
  r = kopi(); r.bilag[3].linjer[0].belop += 100; r.bilag[2].linjer[0].belop -= 100; assert.ok(slo(r).includes('K1') && !slo(r).includes('K3'), 'to feil som opphever hverandre');
  r = kopi(); r.bilag.splice(5, 1); assert.ok(slo(r).includes('K13'), 'slettet bilag');
  r = kopi(); r.bilag[8].linjer[1].part = 'L1'; assert.ok(slo(r).includes('K7'), 'feil part');
  r = kopi(); r.mvaLevert['2026-1'] = 1; assert.ok(slo(r).includes('K9'), 'feil melding');
  r = kopi(); const l = r.bilag[3].linjer; l[1].belop += 10000; l[2].belop -= 10000; assert.ok(slo(r).includes('K8'), 'feil mva');
  r = kopi(); r.bilag = r.bilag.filter((b) => b.type !== 'oppgjor'); assert.ok(slo(r).includes('K10'), 'manglende oppgjør');
  r = kopi(); r.bilag[17].linjer[0].belop += 100; r.bilag[17].linjer[1].belop -= 100; assert.ok(slo(r).includes('K6'), 'gammel disponering');
  r = kopi(); r.bilag[1].linjer[0].konto = '9999'; assert.ok(slo(r).includes('K2') && slo(r).includes('K11'), 'ukjent konto');
  r = kopi(); r.bilag[7].linjer[1].belop = 0; r.bilag[7].linjer[0].belop = 0; assert.ok(slo(r).includes('K17'), 'trekk ikke betalt');
});

test('tilfeldige hendelser: alt går opp uansett rekkefølge', () => {
  let fro = 20261124; const rnd = (n) => { fro = (fro * 1103515245 + 12345) % 2147483648; return fro % n; };
  for (let runde = 0; runde < 12; runde++) {
    const form = runde % 2 ? 'ENK' : 'AS', mva = runde % 3 !== 0; let r = M.nytt({ navn: 'T', form, mva, start: '2026-01-01' }), n = 0;
    for (let i = 0; i < 160; i++) {
      const liste = BOK.hendelser.filter((h) => (!h.form || h.form === 'begge' || h.form === form) && (!h.kreverMva || mva) && !h.frilinjer), h = liste[rnd(liste.length)];
      const dato = '2026-' + ('0' + (1 + rnd(12))).slice(-2) + '-' + ('0' + (1 + rnd(28))).slice(-2), c = BOK.kontekst(r, {}, dato), felt = {};
      h.felt(c).forEach((q) => { const s = typeof q.std === 'function' ? q.std(felt) : q.std;
        felt[q.id] = q.type === 'valg' ? (q.valg.length ? q.valg[rnd(q.valg.length)].v : '') : q.type === 'kryss' ? rnd(2) === 1 : q.type === 'part' ? ['A', 'B', 'C'][rnd(3)] : q.type === 'tall' ? (s || String(1 + rnd(10))) : 1 + rnd(2000000); });   // tall = øre, tekst = kroner
      const f = BOK.lag(h.id, felt, r, dato); if (f.feil.length) continue;
      const v = M.virkning(r, f), u = M.bokfor(r, f); assert.ok(u.ok); r = u.regnskap; n++; assert.ok(v.balanserer);
      assert.strictEqual(M.balanse(r, '2026-12-31').bank, v.bank.etter);
    }
    assert.ok(n > 60, 'for få bilag: ' + n); assert.deepStrictEqual(stopp(r).filter((k) => k !== 'K6'), [], 'runde ' + runde); assert.ok(M.kontantbro(r, '2026-12-31').ok);
    assert.strictEqual(M.saldobalanse(r, 2026).reduce((t, x) => t + x.ub, 0), 0);
  }
});

test('data ut: journal og saldobalanse', () => {
  const r = BOK.eksempel(true), j = M.journalCsv(r).split('\r\n'), s = M.saldobalanseCsv(r, 2026);
  assert.strictEqual(j.length - 1, r.bilag.reduce((t, b) => t + b.linjer.length, 0)); assert.ok(s.includes('§ 6-2 B.IV')); assert.ok(!/NaN|undefined/.test(j.join() + s));
  const x = bok(as(), 'forskudd', { belop: '1' }, '2026-01-02', { tekst: '=SUM(A1);"x"' }); assert.ok(M.journalCsv(x).includes('"\'=SUM(A1);""x"""'));
});

test('regnskap utenfra: hele filer slipper inn, skadde og manipulerte stoppes', () => {
  const g = JSON.stringify(BOK.eksempel(true)), med = (f) => { const r = JSON.parse(g); f(r); return M.gyldig(r); };
  assert.strictEqual(med(() => {}), '');
  const daarlig = { ubalanse: (r) => { r.bilag[2].linjer[0].belop += 1; }, hull: (r) => { r.bilag.splice(4, 1); }, nummertekst: (r) => { r.bilag[2].nr = '3'; }, konto: (r) => { r.bilag[2].linjer[0].konto = 'constructor'; }, mvakode: (r) => { r.bilag[2].linjer[0].mva = '<b>'; }, mvaarv: (r) => { r.bilag[2].linjer[0].mva = 'toString'; },
    vedlegg: (r) => { r.bilag[2].vedlegg = [{ navn: 'a', data: 'javascript:alert(1)' }]; }, html: (r) => { r.bilag[2].vedlegg = [{ navn: 'a', data: 'data:text/html,<script>' }]; }, part: (r) => { r.parter[0].id = '"><b>'; }, reverserer: (r) => { r.bilag[2].reverserer = '1" onclick="x'; }, framover: (r) => { r.bilag[2].reverserer = 9; },
    hendelse: (r) => { r.bilag[2].hendelse = '__proto__'; }, form: (r) => { r.selskap.form = 'XX'; }, laas: (r) => { r.lukketTil = 'x'; }, levert: (r) => { r.mvaLevert = { 'x<b>': 1 }; }, desimal: (r) => { r.bilag[2].linjer[0].belop += 0.5; r.bilag[2].linjer[1].belop -= 0.5; }, dato: (r) => { r.bilag[2].dato = '2026-13-01'; } };
  for (const [n, f] of Object.entries(daarlig)) assert.notStrictEqual(med(f), '', n);
  for (const x of [null, 1, 'x', [], {}, { v: 1 }]) assert.notStrictEqual(M.gyldig(x), '');
});

test('fart: 2 000 bilag regnes på under 100 ms', () => {
  let r = as(); const b = M.bokfor(r, BOK.lag('salg', { type: '25', belop: '100', inkl: 'eks', betalt: '1920' }, r, '2026-03-10')).bilag;
  r.bilag = Array.from({ length: 2000 }, (_, i) => Object.assign({}, b, { nr: i + 1, dato: '2026-' + ('0' + (1 + i % 12)).slice(-2) + '-10' }));
  M.balanse(r, '2026-12-31'); const t = process.hrtime.bigint(); M.balanse(r, '2026-12-31'); M.resultat(r, '2026-01-01', '2026-12-31'); M.virkning(r, BOK.lag('forskudd', { belop: '1' }, r, '2026-03-01'));
  const ms = Number(process.hrtime.bigint() - t) / 1e6; assert.ok(ms < 100, ms + ' ms');
});

// ── Koblingen til resultat, balanse og kontantstrøm ─────────────────────
// Laster nettsidens egen shared/regnskap-flyt.js, så testene bruker samme regning som sidene.
function medSidene() {
  const lager = {}, fs = require('fs'), vm = require('vm'), path = require('path');
  const localStorage = { getItem: (k) => (k in lager ? lager[k] : null), setItem: (k, v) => { lager[k] = String(v); }, removeItem: (k) => { delete lager[k]; } };
  const window = { addEventListener() {} }, document = { addEventListener() {}, querySelectorAll: () => [], querySelector: () => null, getElementById: () => null };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../shared/regnskap-flyt.js'), 'utf8'), { window, document, localStorage, setTimeout, JSON, Math, Date, isFinite, parseFloat });
  globalThis.HVRegnskap = window.HVRegnskap; globalThis.localStorage = localStorage;
  return { R: window.HVRegnskap, lager };
}
// Det en bruker får se på de tre sidene etter «Fyll ut sidene»
function paaSidene(r, til) {
  const { R, lager } = medSidene(), u = BOK.kobling.send(r, til, false); assert.ok(u.ok, u.feil || String(u.egne));
  const l = R.lagret(), res = R.regnRes(Object.assign(l.res, { skatt: u.tall.skatt })), bal = R.regnBal(l.bal), fjor = R.regnBal(l.bal, '_f'), ks = R.utled(l.res, l.bal), K = R.regnKs(ks);
  return { R, lager, l, res, bal, fjor, ks, K, sendt: u.tall };
}
const hel = (o) => Math.round(o / 100);

test('koblingen: eksempelet gir samme tall på sidene som i bokføringen', () => {
  const r = BOK.eksempel(true), p = paaSidene(r, '2026-12-31'), regn = M.resultat(r, '2026-01-01', '2026-12-31');
  assert.strictEqual(p.res.ar, hel(regn.aars)); assert.strictEqual(p.res.skatt, hel(regn.skatt));
  assert.strictEqual(p.bal.diff, 0); assert.strictEqual(p.fjor.diff, 0); assert.strictEqual(p.bal.eiend, hel(M.balanse(r, '2026-12-31').eiendeler));
  assert.strictEqual(p.K.ub, 109860); assert.strictEqual(p.K.op, 39860);
  // Avgiftene ligger i egen post, så kontantstrømmen viser skatten som faktisk er betalt
  assert.strictEqual(p.ks.opSkatt, -12500); assert.strictEqual(p.ks.opAnnet, 10655); assert.strictEqual(p.ks.finUtbytte, 0);
  assert.strictEqual(JSON.parse(p.lager['hv-rr-arsresultat']).belop, p.res.ar);
  assert.strictEqual(JSON.parse(p.lager['hv-balanse-arsresultat-hentet']).belop, p.res.ar);
  assert.strictEqual(JSON.parse(p.lager['hv-balanse-sum']).diff, 0);
});
test('koblingen: før årsslutt er skatten null og resultatet står i egenkapitalen', () => {
  const p = paaSidene(BOK.eksempel(), '2026-11-24');
  assert.strictEqual(p.sendt.skatt, 0); assert.strictEqual(p.res.ar, p.res.forSkatt); assert.strictEqual(p.bal.diff, 0); assert.strictEqual(p.K.ub, 109860); assert.strictEqual(p.ks.finUtbytte, 0);
});
test('koblingen: skyldig mva og betalt skatt blandes ikke i kontantstrømmen', () => {
  let r = BOK.kjorTrinn(M.nytt({ navn: 'E', form: 'AS', mva: true, start: '2026-01-01' }), BOK.eksempelTrinn.slice(0, 13)); r = bok(r, 'skattbet', { belop: '12500' }, '2026-04-01');
  const p = paaSidene(r, '2026-04-05'); assert.strictEqual(-M.balanse(r, '2026-04-05').saldo['2740'], 1750000); assert.strictEqual(p.ks.opSkatt, -12500); assert.strictEqual(p.bal.diff, 0);
});
test('koblingen: hver konto har et felt som finnes på sidene', () => {
  const { R } = medSidene();
  BOK.kontoplan.filter((k) => k.nr !== '8800').forEach((k) => {
    const [nokkel, id] = k.felt.split(':'); if (nokkel === 'hv-rr-arsresultat') return;
    const m = /^ekstra\/(\w+)\/(\w+)$/.exec(id);
    if (m) assert.ok(m[2] === 'egen' ? R.EGEN[m[1]] : R.POSTER[m[1]].some((q) => q.p === m[2]), k.nr + ' ' + id);
    else assert.ok((nokkel === 'hv-rr-v2' ? R.RES : R.BAL).includes(id), k.nr + ' ' + id);
  });
});
test('koblingen: utbytte, uttak og to år', () => {
  let r = BOK.eksempel(true); r = bok(r, 'utbytte', { belop: '10000' }, '2027-03-01');
  let p = paaSidene(r, '2027-12-31'); assert.strictEqual(p.ks.finUtbytte, -10000); assert.strictEqual(p.bal.diff, 0); assert.strictEqual(p.fjor.diff, 0); assert.strictEqual(p.ks.kontIB, 109860); assert.strictEqual(p.K.ub, 99860);
  let e = enk(); e = bok(e, 'innskudd', { belop: '20000' }, '2026-01-05'); e = bok(e, 'salg', { type: '25', belop: '10000,50', inkl: 'eks', betalt: '1920' }, '2026-02-01'); e = bok(e, 'uttak', { belop: '3000' }, '2026-03-01');
  p = paaSidene(e, '2026-12-31'); assert.strictEqual(p.l.res.mode, 'enk'); assert.strictEqual(p.ks.finUtbytte, 17000); assert.strictEqual(p.bal.diff, 0); assert.strictEqual(p.K.ub, hel(M.balanse(e, '2026-12-31').bank));
});
test('koblingen: egne tall blir ikke erstattet uten ja, tall fra bokføringen blir', () => {
  let r = BOK.eksempel(); const { lager } = medSidene(), K = BOK.kobling, d = '2026-12-31';
  assert.deepStrictEqual(K.status().egne, []); assert.ok(K.send(r, d).ok); assert.deepStrictEqual(K.status().egne, []);
  r = bok(r, 'kjop', { type: 'kontor', belop: '1250', betalt: '1920', bilag: true }, '2026-11-24'); assert.ok(K.send(r, d).ok);
  const snap = JSON.parse(lager['hv-rr-v2']); snap.rSalg = '1'; lager['hv-rr-v2'] = JSON.stringify(snap);
  assert.deepStrictEqual(K.status().egne, ['resultatet']); assert.deepStrictEqual(K.send(r, d).egne, ['resultatet']); assert.strictEqual(JSON.parse(lager['hv-rr-v2']).rSalg, '1');
  assert.ok(K.send(r, d, true).ok); assert.deepStrictEqual(K.status().egne, []);
  K.kobleFra(); assert.deepStrictEqual(K.status().egne, ['resultatet', 'balansen', 'kontantstrømmen']);
});
test('koblingen: tilfeldige regnskap med øre stemmer alltid på sidene', () => {
  let fro = 7; const rnd = (n) => { fro = (fro * 1103515245 + 12345) % 2147483648; return fro % n; };
  for (let runde = 0; runde < 30; runde++) {
    const form = runde % 2 ? 'ENK' : 'AS', mva = runde % 3 !== 0; let r = M.nytt({ navn: 'T', form, mva, start: '2026-01-01' });
    for (let i = 0; i < 70; i++) {
      const liste = BOK.hendelser.filter((h) => (!h.form || h.form === 'begge' || h.form === form) && (!h.kreverMva || mva) && !h.frilinjer), h = liste[rnd(liste.length)];
      const dato = (2026 + rnd(2)) + '-' + ('0' + (1 + rnd(12))).slice(-2) + '-' + ('0' + (1 + rnd(28))).slice(-2), c = BOK.kontekst(r, {}, dato), felt = {};
      h.felt(c).forEach((q) => { const s = typeof q.std === 'function' ? q.std(felt) : q.std; felt[q.id] = q.type === 'valg' ? (q.valg.length ? q.valg[rnd(q.valg.length)].v : '') : q.type === 'kryss' ? rnd(2) === 1 : q.type === 'part' ? ['A', 'B'][rnd(2)] : q.type === 'tall' ? (s || String(1 + rnd(10))) : 1 + rnd(2000000); });
      const f = BOK.lag(h.id, felt, r, dato); if (!f.feil.length) r = M.bokfor(r, f).regnskap;
    }
    for (const d of ['2026-06-30', '2026-12-31', '2027-12-31']) {
      const p = paaSidene(r, d), aar = M.aar(d), b = M.balanse(r, d), reg = M.resultat(r, aar + '-01-01', d);
      assert.strictEqual(p.bal.diff, 0, runde + ' ' + d); assert.strictEqual(p.fjor.diff, 0, runde + ' fjor ' + d);
      assert.strictEqual(p.l.bal.bOmlBank, hel(b.bank)); assert.strictEqual(p.K.ub, hel(b.bank), runde + ' ks ' + d);
      assert.ok(Math.abs(p.res.ar - reg.aars / 100) <= 8, runde + ' ar ' + d);
      assert.strictEqual(JSON.parse(p.lager['hv-rr-arsresultat'] || '{"belop":0}').belop, p.res.ar);
    }
  }
});

// ── Funn fra kontrollen mot primærkilder 24.11.2026 ─────────────────────
test('kontroll: salg utenfor mva-loven teller ikke mot registreringsgrensen', () => {
  let r = enk({ mva: false }); r = bok(r, 'salg', { omf: 'nei', belop: '60000', betalt: '1920' });
  assert.doesNotMatch(BOK.lag('salg', { omf: 'nei', belop: '60000', betalt: '1920' }, r, '2026-04-01').varsler.join(), /registrer/i);
  assert.match(BOK.lag('salg', { omf: 'ja', belop: '50001', betalt: '1920' }, r, '2026-04-01').varsler.join(), /skal registreres/);
});
test('kontroll: kassasystem gjelder kort og Vipps ved disken, også uten mva-registrering', () => {
  for (const r of [as(), enk({ mva: false })]) { for (const b of ['1900', '1579']) assert.match(BOK.lag('salg', { belop: '100', betalt: b }, r, '2026-04-01').varsler.join(), /kassasystem/); assert.doesNotMatch(BOK.lag('salg', { belop: '100', betalt: 'faktura', part: 'A' }, r, '2026-04-01').varsler.join(), /kassasystem/); }
});
test('kontroll: utbytte kan ikke spise av aksjekapitalen, og lån til eier trekkes fra', () => {
  let r = as(); r = bok(r, 'kapital', { belop: '30000', overkurs: 0 }, '2026-01-02'); r = bok(r, 'stift', { belop: '6825' }, '2026-01-03'); r = bok(r, 'salg', { type: '25', belop: '10000', inkl: 'eks', betalt: '1920' }, '2026-02-01');
  assert.match(BOK.lag('disponer', { utb: '10000' }, r, '2026-12-31').feil.join(), /høyst deles ut 3.175/); assert.deepStrictEqual(BOK.lag('disponer', { utb: '3175' }, r, '2026-12-31').feil, []);
  const e = bok(r, 'eiertok', { belop: '2000', fra: '1920' }, '2026-03-01'); assert.match(BOK.lag('disponer', { utb: '3175' }, e, '2026-12-31').feil.join(), /høyst deles ut 1.175/);
  // Overkurs er fri egenkapital
  let o = as(); o = bok(o, 'kapital', { belop: '30000', overkurs: '50000' }, '2026-01-02'); o = bok(o, 'salg', { type: '25', belop: '10000', inkl: 'eks', betalt: '1920' }, '2026-02-01');
  const f = BOK.lag('disponer', { utb: '40000' }, o, '2026-12-31'); assert.deepStrictEqual(f.feil, []); assert.deepStrictEqual(linjer(f), ['2020 D 30000', '2800 K 40000', '8800 D 10000']);
  assert.ok(M.bokfor(o, f).ok); assert.match(BOK.lag('disponer', { utb: '60001' }, o, '2026-12-31').feil.join(), /høyst deles ut 60.000/);
});
test('kontroll: lineær avskrivning er lik hver måned, til den er ferdig', () => {
  let r = bok(as(), 'kjop', { type: 'pc', belop: '60000', betalt: '1920', bilag: true }, '2026-01-05'); const b = [];
  for (let m = 1; m <= 12; m++) { const c = BOK.kontekst(r, { konto: '1280' }, '2026-12-31'), kost = BOK.hendelse.avskriv.felt(c).filter((q) => q.id === 'kost')[0].std({ konto: '1280' }); const f = BOK.lag('avskriv', { konto: '1280', kost, aar: '5', mnd: '1' }, r, '2026-12-31'); b.push(f.linjer[0].belop); r = M.bokfor(r, f).regnskap; }
  assert.deepStrictEqual(new Set(b), new Set([80000])); assert.strictEqual(M.saldoer(r)['1280'], 4800000 - 960000);
  const f = BOK.lag('avskriv', { konto: '1280', kost: '48000', aar: '1', mnd: '24' }, r, '2026-12-31'); assert.strictEqual(f.linjer[0].belop, 3840000);
});
test('kontroll: saldoavskrivning føres én gang i året, og ikke over høyeste sats', () => {
  let r = bok(enk(), 'kjop', { type: 'varebil', belop: '250000', betalt: '1920', bilag: true }, '2026-01-05');
  assert.match(BOK.lag('saldoavskr', { konto: '1238', sats: '30' }, r, '2026-06-01').feil.join(), /24 prosent/);
  const f = BOK.lag('saldoavskr', { konto: '1238', sats: '24' }, r, '2026-06-01'); assert.strictEqual(f.dato, '2026-12-31'); assert.strictEqual(f.linjer[0].belop, 4800000); r = M.bokfor(r, f).regnskap;
  assert.match(BOK.lag('saldoavskr', { konto: '1238', sats: '24' }, r, '2026-12-31').feil.join(), /alt ført/); assert.strictEqual(BOK.lag('saldoavskr', { konto: '1238', sats: '24' }, r, '2027-12-31').linjer[0].belop, 3648000);
  assert.ok(!BOK.hendelse.avskriv.form || BOK.hendelse.avskriv.form === 'AS');
});
test('kontroll: forskuddsfaktura høyst ett år', () => {
  assert.match(BOK.lag('abo', { belop: '36000', mnd: '36', part: 'A' }, as(), '2026-03-01').feil.join(), /ett år/); assert.deepStrictEqual(BOK.lag('abo', { belop: '12000', mnd: '12', part: 'A' }, as(), '2026-03-01').feil, []);
});
test('kontroll: forklaringen sier ikke kostnad når det er eiendel, uttak eller fordeles', () => {
  const x = (felt, sel) => BOK.lag('kjop', Object.assign({ betalt: '1920', bilag: true, belop: '40000' }, felt), sel || as(), '2026-03-01').forklaring;
  for (const t of [x({ type: 'personbil' }), x({ type: 'bot' }, enk()), x({ type: 'forsikring', fordel: true, mnd: '12' })]) assert.doesNotMatch(t, /hele beløpet er kostnad/); assert.match(x({ type: 'forsikring' }), /hele beløpet er kostnad/);
});
test('kontroll: omvendt mva for ikke registrerte kan gjøres opp, og fristene er riktige', () => {
  let r = bok(as({ mva: false }), 'utland', { hva: '6421', belop: '10000', betalt: '1920', kvartal: true }, '2026-05-10');
  assert.match(BOK.lag('omvmva', { belop: '2500' }, r, '2026-06-30').forklaring, /31\.8\.2026/); r = bok(r, 'omvmva', { belop: '2500' }, '2026-06-30'); r = bok(r, 'omvbet', { belop: '2500' }, '2026-08-31');
  assert.strictEqual(M.saldoer(r)['2700'], 0); assert.strictEqual(M.saldoer(r)['2740'], 0); assert.match(BOK.lag('omvmva', { belop: '1' }, r, '2026-09-30').feil.join(), /bare ført 0 kr/);
});
test('kontroll: egen bil over 6 000 km gir varsel', () => {
  let r = bok(enk(), 'egenbil', { km: '5000' }, '2026-05-01'); assert.strictEqual(BOK.lag('egenbil', { km: '1000' }, r, '2026-06-01').varsler.length, 0); assert.match(BOK.lag('egenbil', { km: '1001' }, r, '2026-06-01').varsler.join(), /6.000 km/);
});
