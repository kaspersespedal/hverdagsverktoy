/* ──────────────────────────────────────────────────────────────────────────
   L6 — Avstemming av effektiv skattesats.
   Første oppslag i bokføringsserien under /regnskap/. Katalog-id L6.

   Modellen kopierer ALDRI en sats inn i regnestykket. Den oppgir hvilke
   konstanter den bruker, og får verdiene inn via k-argumentet til regn().
   Det er det som gjør at motoren kan varsle om utløpte satser av seg selv.

   Bokføring: ingen. Dette er en kontroll og et notekrav, ikke et bilag.
   Derfor finnes ingen bilag()-funksjon i denne modellen.
   ────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var D = (window.BOK_DATA && window.BOK_DATA.konstanter) || {};
  var SATS_ALM = D.skattesats_alminnelig ? D.skattesats_alminnelig.verdi : 0.22;
  var SATS_FIN = D.skattesats_finansskatt ? D.skattesats_finansskatt.verdi : 0.25;

  window.BOK.register({
    id: 'l6-skatteavstemming',
    katalogId: 'L6',
    sti: '/regnskap/skatteavstemming/',
    type: 1,
    versjon: '1.0',
    tittel: 'Avstemming av effektiv skattesats',
    konstanter: ['skattesats_alminnelig', 'skattesats_finansskatt', 'fritaksmetode_sjablong'],

    felt: [
      { id: 'rfs', etikett: 'Resultat før skattekostnad', type: 'kr', bredt: true, start: 0,
        hjelp: 'Linjen rett over skattekostnaden i resultatregnskapet. Underskudd tastes med minus.' },

      { id: 'bokfort', etikett: 'Bokført skattekostnad', type: 'kr', bredt: true, start: 0,
        hjelp: 'Betalbar skatt pluss endring i utsatt skatt, slik den faktisk står i regnskapet. Er skattelinjen en netto skatteinntekt, tastes den med minus.' },

      { id: 'sats', etikett: 'Skattesats', type: 'valg', start: SATS_ALM,
        valg: [
          { verdi: SATS_ALM, etikett: '22 % — hovedregel' },
          { verdi: SATS_FIN, etikett: '25 % — selskap som svarer finansskatt på lønn' }
        ],
        hjelp: 'Stortingets skattevedtak for 2026 § 3-3. Annet ledd gir 25 % for selskap som svarer finansskatt på lønn etter folketrygdloven § 23-2 a.' },

      { id: 'ikkeFradr', etikett: 'Ikke-fradragsberettigede kostnader', type: 'kr', bredt: true, start: 0,
        hjelp: 'Grunnlaget i kroner, ikke skatten av det. Representasjon over grensen, bøter, gebyrer, renter på restskatt. Alltid positivt tall.' },

      { id: 'skattefri', etikett: 'Skattefrie inntekter', type: 'kr', bredt: true, start: 0,
        hjelp: 'Grunnlaget i kroner. Aksjeinntekt innenfor fritaksmetoden skal IKKE med her — den hører i feltet under, ellers telles den to ganger.' },

      { id: 'aksjeInnt', etikett: 'Netto skattefritt utbytte innenfor fritaksmetoden', type: 'kr', bredt: true, start: 0,
        hjelp: 'Kun utbytte, jf. skatteloven § 2-38 sjette ledd bokstav a. Gevinster omfattes ikke av treprosentregelen og hører i feltet over.' },

      { id: 'konsern', etikett: 'Utbyttet er mottatt innenfor skattekonsern (over 90 % eier- og stemmeandel)', type: 'avkrysning', start: false,
        hjelp: 'Unntaket i skatteloven § 2-38 sjette ledd bokstav c. Begge vilkår må være oppfylt. Krysset av settes treprosentlinjen til null.' },

      { id: 'ikkeBalansefort', etikett: 'Endring i ikke-balanseført utsatt skattefordel', type: 'kr', bredt: true, start: 0,
        hjelp: 'Allerede et skattebeløp, ikke et grunnlag. Positivt når fordelen som ikke balanseføres øker. Det er her fremførbart underskudd slår inn i den effektive satsen.' },

      { id: 'fjoraar', etikett: 'For lite (+) eller for mye (−) avsatt betalbar skatt i fjor', type: 'kr', bredt: true, start: 0,
        hjelp: 'Et skattebeløp. Endelig fastsatt skatt minus det som ble avsatt i fjorårets regnskap. Føres i år som estimatendring, ikke mot egenkapitalen.' },

      { id: 'satsendring', etikett: 'Effekt av endret skattesats på inngående utsatt skatt', type: 'kr', bredt: true, start: 0,
        hjelp: 'Et skattebeløp: netto midlertidige forskjeller inngående balanse ganget med ny sats minus gammel sats. Skal alltid stå på egen linje.' },

      { id: 'avvikSats', etikett: 'Effekt av avvikende sats (utland, grunnrente, særregimer)', type: 'kr', bredt: true, start: 0,
        hjelp: 'Et skattebeløp. Har selskapet flere parallelle regimer, avstemmes hvert regime for seg — denne linjen samler dem ikke.' }
    ],

    regn: function (v, k, f) {
      var s = v.sats || k.skattesats_alminnelig;
      var sjablong = k.fritaksmetode_sjablong;

      var forventet = v.rfs * s;
      var tilleggIkkeF = v.ikkeFradr * s;
      var fradragSkattefri = v.skattefri * s;
      var tilleggAksje = v.konsern ? 0 : (v.aksjeInnt * sjablong * s);

      var beregnet = forventet + tilleggIkkeF - fradragSkattefri + tilleggAksje
        + v.ikkeBalansefort + v.fjoraar + v.satsendring + v.avvikSats;

      var etr = v.rfs ? (v.bokfort / v.rfs) : null;

      return {
        steg: [
          { etikett: 'Forventet skattekostnad',
            uttrykk: f.kr(v.rfs) + ' × ' + f.pst(s), verdi: forventet },
          { etikett: 'Skatt av ikke-fradragsberettigede kostnader',
            uttrykk: f.kr(v.ikkeFradr) + ' × ' + f.pst(s), verdi: tilleggIkkeF },
          { etikett: 'Skatt av skattefrie inntekter',
            uttrykk: '− ' + f.kr(v.skattefri) + ' × ' + f.pst(s), verdi: -fradragSkattefri },
          { etikett: 'Treprosentregelen i fritaksmetoden',
            uttrykk: v.konsern
              ? 'Skattekonsernunntaket er krysset av'
              : f.kr(v.aksjeInnt) + ' × ' + f.pst(sjablong) + ' × ' + f.pst(s),
            verdi: tilleggAksje },
          { etikett: 'Endring i ikke-balanseført utsatt skattefordel',
            uttrykk: 'Skattebeløp lagt inn direkte', verdi: v.ikkeBalansefort },
          { etikett: 'For lite eller for mye avsatt i fjor',
            uttrykk: 'Skattebeløp lagt inn direkte', verdi: v.fjoraar },
          { etikett: 'Effekt av endret skattesats',
            uttrykk: 'Skattebeløp lagt inn direkte', verdi: v.satsendring },
          { etikett: 'Effekt av avvikende sats',
            uttrykk: 'Skattebeløp lagt inn direkte', verdi: v.avvikSats },
          { etikett: 'Beregnet skattekostnad',
            uttrykk: 'Sum av linjene over', verdi: beregnet, sum: true }
        ],

        avstemming: {
          forventetNavn: 'Beregnet skattekostnad',
          forventet: beregnet,
          faktiskNavn: 'Bokført skattekostnad',
          faktisk: v.bokfort,
          krav: 0
        },

        noekkeltall: [
          {
            etikett: 'Effektiv skattesats (ETR)',
            verdi: etr,
            format: 'pst',
            merknad: (v.rfs < 0)
              ? 'Effektiv skattesats er ikke meningsfull ved underskudd. To negative tall gir en positiv brøk som ser ut som en lav skattesats, men selskapet har tapt penger.'
              : null
          }
        ]
      };
    }
  });
})();
