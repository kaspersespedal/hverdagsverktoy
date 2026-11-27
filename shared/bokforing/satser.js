// Satser og grenser per år. Dette er ENESTE sted et tall fra lov eller vedtak står.
// status: 'i kraft' eller 'foreslått' (foreslått eller ikke fastsatt). Da sier verktøyet fra ved hver føring.
(function () {
var BOK = globalThis.HVBok = globalThis.HVBok || {};

BOK.satser = {
  2026: {
    status: 'i kraft', kontrollert: '2026-11-24',
    mva: { hoy: 25, middels: 15, lav: 12 },        // Stortingets vedtak om merverdiavgift 2026 §§ 2–4
    aga: 14.1,                                      // arbeidsgiveravgift sone I, Skatteetaten 2026
    feriepenger: 10.2,                              // ferieloven § 10
    skatt: 22,                                      // Stortingets skattevedtak 2026 § 3-3
    smautstyr: 30000,                               // skatteloven § 14-40
    bevertning: 592,                                // satsforskriften 2026 § 10 (FSSD § 6-21-2), per person på serveringssted
    kundegave: 324,                                 // satsforskriften 2026 § 10 (FSSD §§ 6-21-5 og 6-21-6), per gjenstand eller tilfelle
    reklame: 200,                                   // merverdiavgiftsforskriften § 1-3-6, per enhet inkl. mva
    kontant: 10000,                                 // merverdiavgiftsloven § 8-8, samlet betaling inkl. mva
    registrering: 50000,                            // merverdiavgiftsloven § 2-1, tolv måneder
    utlandKvartal: 2000,                            // merverdiavgiftsloven § 11-3
    kasse: 50000,                                   // bokføringsforskriften § 5-4-1, kontantsalg uten mva per år uten kassasystem
    purregebyr: 38,                                 // inkassoforskriften §§ 1-1 og 1-2
    km: 3.5,                                        // satsforskriften 2026, trekkfri kjøregodtgjørelse og § 4 (næring)
    enkKm: 6000,                                    // grense for kilometersats i ENK, satsforskriften 2026 § 4
    ekom: 4392,                                     // privat bruk av telefon og nett i ENK, Skatteetaten 2026
    hjemmekontor: 2240,                             // standardfradrag, satsforskriften 2026 § 14
    saldo: { '1280': 30, '1238': 24, '1205': 20, '1206': 20, '1207': 20 }, // høyeste saldosats, skatteloven § 14-43 (gruppe a, c og d)
    eierlan: { belop: 100000, dager: 60 }           // FSFIN § 10-11, samlet kreditt og innfrielse
  },
  2027: {
    // Mva, arbeidsgiveravgift og skatt: Prop. 1 LS (2026–2027), foreslått. Km, bevertning og kundegave: vedtatt
    // 18.11.2026 (FOR-2026-11-18-2405). Purregebyr, privat telefon og hjemmekontor er ikke kontrollert for 2027; her står 2026-tallene.
    status: 'foreslått', kontrollert: '2026-11-24',
    mva: { hoy: 25, middels: 15, lav: 12 },
    aga: 14.1, feriepenger: 10.2, skatt: 22, smautstyr: 30000,
    bevertning: 608, kundegave: 333, reklame: 200, kontant: 10000, registrering: 50000,
    utlandKvartal: 2000, kasse: 50000, purregebyr: 38, km: 3.5, enkKm: 6000, ekom: 4392, hjemmekontor: 2240,
    saldo: { '1280': 30, '1238': 24, '1205': 20, '1206': 20, '1207': 20 }, eierlan: { belop: 100000, dager: 60 }
  }
};

// Satsene for et år. Mangler året, brukes siste kjente og status blir 'mangler'.
BOK.satserFor = function (aar) {
  if (BOK.satser[aar]) return BOK.satser[aar];
  var kjente = Object.keys(BOK.satser).map(Number).sort();
  var naer = aar < kjente[0] ? kjente[0] : kjente[kjente.length - 1];
  return Object.assign({}, BOK.satser[naer], { status: 'mangler', laant: naer });
};

// Mva-koder: Skatteetatens standardkoder (SAF-T). Koden står på grunnlagslinjen, aldri på mva-linjen.
// retning: ut = utgående, inn = fradrag, begge = omvendt avgift (ut og inn), ingen = bare merking.
BOK.mvakoder = {
  '0':  { navn: 'Kjøp uten mva eller uten fradrag', sats: null, retning: 'ingen', melding: false },
  '1':  { navn: 'Kjøp med fradrag, høy sats', sats: 'hoy', retning: 'inn', melding: true },
  '11': { navn: 'Kjøp med fradrag, middels sats', sats: 'middels', retning: 'inn', melding: true },
  '13': { navn: 'Kjøp med fradrag, lav sats', sats: 'lav', retning: 'inn', melding: true },
  '3':  { navn: 'Salg, høy sats', sats: 'hoy', retning: 'ut', melding: true },
  '31': { navn: 'Salg, middels sats', sats: 'middels', retning: 'ut', melding: true },
  '33': { navn: 'Salg, lav sats', sats: 'lav', retning: 'ut', melding: true },
  '5':  { navn: 'Salg fritatt for mva', sats: null, retning: 'ingen', melding: true },
  '52': { navn: 'Salg til utlandet', sats: null, retning: 'ingen', melding: true },
  '6':  { navn: 'Salg utenfor mva-loven', sats: null, retning: 'ingen', melding: true },
  '7':  { navn: 'Inntekt som ikke er omsetning', sats: null, retning: 'ingen', melding: false },
  '21': { navn: 'Varekjøp fra utlandet, faktura', sats: null, retning: 'ingen', melding: false },
  '81': { navn: 'Vareimport, grunnlag', sats: 'hoy', retning: 'begge', melding: true },
  '86': { navn: 'Tjeneste fra utlandet, med fradrag', sats: 'hoy', retning: 'begge', melding: true },
  '87': { navn: 'Tjeneste fra utlandet, uten fradrag', sats: 'hoy', retning: 'ut', melding: true }
};

// Oppstillingsplanen, ordrett fra regnskapsloven §§ 6-1 og 6-2.
BOK.resultatposter = [
  [1, 'Salgsinntekt'], [2, 'Annen driftsinntekt'],
  [3, 'Endring i beholdning av varer under tilvirkning og ferdig tilvirkede varer'],
  [4, 'Endring i beholdning av egentilvirkede anleggsmidler'], [5, 'Varekostnad'], [6, 'Lønnskostnad'],
  [7, 'Avskrivning på varige driftsmidler og immaterielle eiendeler'],
  [8, 'Nedskrivning av varige driftsmidler og immaterielle eiendeler'], [9, 'Annen driftskostnad'],
  [10, 'Driftsresultat'],
  [11, 'Inntekt på investering i datterselskap og tilknyttet selskap'], [12, 'Inntekt på andre investeringer'],
  [13, 'Renteinntekt fra foretak i samme konsern'], [14, 'Annen finansinntekt'],
  [15, 'Verdiendring av finansielle instrumenter vurdert til virkelig verdi'],
  [16, 'Nedskrivning av finansielle eiendeler'], [17, 'Rentekostnad til foretak i samme konsern'],
  [18, 'Annen finanskostnad'], [19, 'Resultat før skattekostnad'], [20, 'Skattekostnad'], [21, 'Årsresultat']
];
BOK.balanseposter = [
  ['A.I', 'Immaterielle eiendeler', [['A.I.1', 'Utvikling'], ['A.I.2', 'Konsesjoner, patenter, lisenser, varemerker og lignende rettigheter'], ['A.I.3', 'Utsatt skattefordel'], ['A.I.4', 'Goodwill']]],
  ['A.II', 'Varige driftsmidler', [['A.II.1', 'Tomter, bygninger og annen fast eiendom'], ['A.II.2', 'Maskiner og anlegg'], ['A.II.4', 'Driftsløsøre, inventar, verktøy, kontormaskiner og lignende']]],
  ['A.III', 'Finansielle anleggsmidler', [['A.III.6', 'Investeringer i aksjer og andeler'], ['A.III.8', 'Andre fordringer']]],
  ['B.I', 'Varer', [['B.I', 'Varer']]],
  ['B.II', 'Fordringer', [['B.II.1', 'Kundefordringer'], ['B.II.2', 'Andre fordringer'], ['B.II.3', 'Krav på innbetaling av selskapskapital']]],
  ['B.IV', 'Bankinnskudd, kontanter og lignende', [['B.IV', 'Bankinnskudd, kontanter og lignende']]],
  ['C.I', 'Innskutt egenkapital', [['C.I.1', 'Selskapskapital'], ['C.I.2', 'Overkurs'], ['C.I.3', 'Annen innskutt egenkapital']]],
  ['C.II', 'Opptjent egenkapital', [['C.II.1', 'Fond'], ['C.II.2', 'Annen egenkapital']]],
  ['D.I', 'Avsetning for forpliktelser', [['D.I.1', 'Pensjonsforpliktelser'], ['D.I.2', 'Utsatt skatt'], ['D.I.3', 'Andre avsetninger for forpliktelser']]],
  ['D.II', 'Annen langsiktig gjeld', [['D.II.3', 'Gjeld til kredittinstitusjoner'], ['D.II.4', 'Øvrig langsiktig gjeld']]],
  ['D.III', 'Kortsiktig gjeld', [['D.III.3', 'Gjeld til kredittinstitusjoner'], ['D.III.4', 'Leverandørgjeld'], ['D.III.5', 'Betalbar skatt'], ['D.III.6', 'Skyldige offentlige avgifter'], ['D.III.7', 'Annen kortsiktig gjeld']]]
];

if (typeof module === 'object' && module.exports) module.exports = BOK;
})();
