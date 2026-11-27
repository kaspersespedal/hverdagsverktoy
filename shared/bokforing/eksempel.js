// Eksempel AS 2026: oppdiktede tall. Alt føres gjennom de vanlige hendelsene, og testene kontrollerer sluttsaldoene.
(function () {
var BOK = globalThis.HVBok = globalThis.HVBok || {};

function kvittering(tittel, linjer) {
  var y = 64, rader = linjer.map(function (l) { y += 22; return '<text x="24" y="' + y + '" font-size="14">' + l[0] + '</text><text x="296" y="' + y + '" font-size="14" text-anchor="end">' + l[1] + '</text>'; }).join('');
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 ' + (y + 40) + '" font-family="Consolas,monospace" fill="#222"><rect width="320" height="' + (y + 40) + '" fill="#fffdf6"/><text x="24" y="40" font-size="17" font-weight="700">' + tittel + '</text><path d="M24 52H296" stroke="#999" stroke-dasharray="3 3"/>' + rader + '<text x="24" y="' + (y + 28) + '" font-size="11" fill="#777">Oppdiktet bilag til eksempelet</text></svg>';
  return { navn: tittel.toLowerCase().replace(/[^a-zæøå0-9]+/g, '-') + '.svg', type: 'image/svg+xml', data: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) };
}

BOK.eksempelTrinn = [
  ['2026-01-01', 'ib', { linjer: [
    { konto: '1400', debet: '40000' }, { konto: '1500', debet: '25000', part: 'Solvik Verksted' }, { konto: '1920', debet: '100000' },
    { konto: '2000', kredit: '30000' }, { konto: '2050', kredit: '20000' }, { konto: '2220', kredit: '90000' },
    { konto: '2400', kredit: '12500', part: 'Nord Engros' }, { konto: '2500', kredit: '12500' }] }, 'Inngående balanse 2026'],
  ['2026-01-15', 'kjop', { type: 'pc', belop: '25000', betalt: 'faktura', part: 'Data Nord', bilag: true }, 'PC til kontoret', [['PC med skjerm', '20 000,00'], ['Mva 25 %', '5 000,00'], ['Å betale', '25 000,00']]],
  ['2026-01-20', 'kjop', { type: 'vare', belop: '75000', betalt: 'faktura', part: 'Nord Engros', bilag: true }, 'Varer til butikken', [['Varer', '60 000,00'], ['Mva 25 %', '15 000,00'], ['Å betale', '75 000,00']]],
  ['2026-01-31', 'salg', { type: '25', belop: '150000', inkl: 'eks', betalt: 'faktura', part: 'Solvik Verksted' }, 'Salg i januar', [['Varer og montering', '150 000,00'], ['Mva 25 %', '37 500,00'], ['Å betale', '187 500,00']]],
  ['2026-02-05', 'salg', { type: 'utland', belop: '20000', betalt: 'faktura', part: 'Muster Handel' }, 'Salg til kunde i Tyskland', [['Varer, utførsel', '20 000,00'], ['Å betale', '20 000,00']]],
  ['2026-02-10', 'utland', { hva: '6421', belop: '4000', betalt: 'faktura', part: 'Skytjenesten' }, 'Skylagring for året', [['Cloud storage', '4 000,00'], ['Reverse charge', '0,00']]],
  ['2026-02-15', 'lonn', { belop: '40000', trekk: '12000', aga: '14,1', ferie: '10,2' }, 'Lønn februar'],
  ['2026-02-16', 'trekk', { belop: '12000' }, 'Skattetrekk februar'],
  ['2026-02-20', 'innbet', { part: 'Solvik Verksted', belop: '212500' }, 'Solvik betalte fakturaene'],
  ['2026-02-25', 'betlev', { part: 'Nord Engros', belop: '87500', trukket: '' }, 'Betalte Nord Engros'],
  ['2026-02-25', 'betlev', { part: 'Data Nord', belop: '25000', trukket: '' }, 'Betalte Data Nord'],
  ['2026-02-28', 'mvaopp', { termin: '2026-1' }],
  ['2026-03-16', 'agabet', { belop: '5640' }, 'Arbeidsgiveravgift 1. termin'],
  ['2026-04-10', 'mvabet', { belop: '17500' }, 'Betalte mva 1. termin'],
  ['2026-04-10', 'skattbet', { belop: '12500' }, 'Betalte skatt for 2025'],
  ['2026-06-30', 'avdrag', { belop: '10000', rente: '4500' }, 'Termin på banklånet', [['Avdrag', '10 000,00'], ['Renter', '4 500,00'], ['Trukket', '14 500,00']]]
];
BOK.eksempelSlutt = [
  ['2026-12-31', 'vare', { belop: '45000' }, 'Varetelling'],
  ['2026-12-31', 'avskriv', { konto: '1280', kost: '20000', aar: '5', mnd: '12' }, 'Avskrivning PC'],
  ['2026-12-31', 'palopt', { konto: '6700', belop: '6000' }, 'Årsoppgjør, ikke fakturert'],
  ['2026-12-31', 'skatt', { belop: '46204,72' }, 'Skatt for 2026'],
  ['2026-12-31', 'disponer', { utb: '10000' }]
];
BOK.kjorTrinn = function (r, trinn) {
  trinn.forEach(function (t) {
    var f = BOK.lag(t[1], t[2], r, t[0], { tekst: t[3], vedlegg: t[4] ? [kvittering(t[3], t[4])] : [] });
    var u = BOK.motor.bokfor(r, f, t[0] + 'T12:00:00.000Z');
    if (f.feil.length || !u.ok) throw new Error(t[1] + ' ' + t[0] + ': ' + f.feil.concat(u.feil).join(' '));
    r = u.regnskap;
  });
  return r;
};
BOK.eksempel = function (slutt) {
  var r = BOK.motor.nytt({ navn: 'Eksempel AS', form: 'AS', mva: true, start: '2026-01-01' });
  r.eksempel = true;
  r = BOK.kjorTrinn(r, BOK.eksempelTrinn.concat(slutt ? BOK.eksempelSlutt : []));
  r.mvaLevert = { '2026-1': 1750000 };
  return r;
};

if (typeof module === 'object' && module.exports) module.exports = BOK;
})();
