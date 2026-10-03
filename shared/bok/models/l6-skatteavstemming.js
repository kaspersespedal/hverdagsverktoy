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
    versjon: '1.1',
    tittel: 'Avstemming av effektiv skattesats',
    konstanter: ['skattesats_alminnelig', 'skattesats_finansskatt', 'fritaksmetode_sjablong'],

    /* Ren presentasjon: hvilke seksjoner skjemaet deles i. Felt med
       avansert: true legges bak gruppas toggle-knapp. */
    grupper: [
      { id: 'regnskap', tittel: 'Fra regnskapet',
        meta: 'Samme utregning i alle regelsett', metaHref: '#side-om-side' },
      { id: 'forskjeller', tittel: 'Permanente forskjeller', meta: 'Hele beløpet',
        hint: 'Poster som skatten aldri tar med. Skriv hele beløpet, ikke skatten av det.',
        toggle: 'Fikk selskapet aksjeutbytte?',
        /* Eksemplet regnes med valgt sats, så tallene stemmer også på 25 %. */
        note: function (v, k, f) {
          var s = v.sats || k.skattesats_alminnelig;
          var sj = k.fritaksmetode_sjablong;
          var fradrag = 100000 * s;
          var tillegg = 100000 * sj * s;
          return 'Fritaksmetoden: utbytte og aksjegevinst er i hovedsak skattefrie for selskaper. ' +
            'Men ' + f.pst(sj) + ' av utbyttet skattlegges, unntatt i skattekonsern. ' +
            'Eksempel ved ' + f.pst(s) + ': ' + f.kr(100000) + ' i utbytte gir ' + f.kr(fradrag) +
            ' lavere skatt og ' + f.kr(tillegg) + ' ekstra (' + f.tall(100000) + ' × ' + f.pst(sj) +
            ' × ' + f.pst(s) + '). Netto ' + f.kr(fradrag - tillegg) + ' lavere skatt. ' +
            'Gevinster føres under Skattefrie inntekter, tap under Kostnader uten skattefradrag. ' +
            'Bruker dere egenkapitalmetoden, er inntekten deres andel av resultatet, ikke utbyttet. Det dekker ikke siden.';
        },
        noteLenke: { href: '/skatt/utbytte/', tekst: 'Mer om fritaksmetoden' } },
      { id: 'skatt', tittel: 'Skattebeløp', meta: 'Bare skatten',
        hint: 'Beløp som allerede er skatt. Skriv skattebeløpet, det regnes med som det står.',
        toggle: 'Ny skattesats, utland eller grunnrente?' }
    ],

    felt: [
      { id: 'rfs', gruppe: 'regnskap', etikett: 'Resultat før skatt', type: 'kr', start: 0,
        hjelp: 'Linjen rett over skattekostnaden. Underskudd med minus.' },

      { id: 'bokfort', gruppe: 'regnskap', etikett: 'Skattekostnad i regnskapet', type: 'kr', start: 0,
        hjelp: 'Hele skattelinjen, også endring i utsatt skatt. Skatteinntekt med minus.' },

      { id: 'sats', gruppe: 'regnskap', etikett: 'Skattesats', type: 'valg', bredt: true, start: SATS_ALM,
        valg: [
          { verdi: SATS_ALM, etikett: Math.round(SATS_ALM * 100) + ' % – vanlig sats' },
          { verdi: SATS_FIN, etikett: Math.round(SATS_FIN * 100) + ' % – betaler finansskatt på lønn' }
        ] },

      { id: 'ikkeFradr', gruppe: 'forskjeller', etikett: 'Kostnader uten skattefradrag', type: 'kr', start: 0,
        hjelp: 'Bøter, overtredelsesgebyr, representasjon, renter på restskatt. Positivt tall.' },

      { id: 'skattefri', gruppe: 'forskjeller', etikett: 'Skattefrie inntekter', type: 'kr', start: 0,
        hjelp: 'F.eks. aksjegevinst innenfor fritaksmetoden. Utbytte har eget felt under.' },

      { id: 'aksjeInnt', gruppe: 'forskjeller', avansert: true, etikett: 'Aksjeutbytte', type: 'kr', start: 0,
        hjelp: 'Utbytte som er inntektsført i regnskapet, innenfor fritaksmetoden. Skriv det bare her.' },

      { id: 'konsern', gruppe: 'forskjeller', avansert: true, etikett: 'Mottatt innenfor skattekonsern', type: 'avkrysning', start: false,
        hjelp: 'Dere eier over 90 % av aksjene og stemmene i selskapet som delte ut.' },

      { id: 'fjoraar', gruppe: 'skatt', etikett: 'For lite eller mye avsatt i fjor', type: 'kr', start: 0,
        hjelp: 'Endelig fastsatt minus avsatt betalbar skatt. For lite avsatt gir pluss.' },

      { id: 'ikkeBalansefort', gruppe: 'skatt', etikett: 'Skattefordel utenfor balansen', cap: 'endring i år', type: 'kr', start: 0,
        hjelp: 'F.eks. skatteverdien av underskudd som ikke er balanseført. Økning gir pluss.' },

      { id: 'satsendring', gruppe: 'skatt', avansert: true, etikett: 'Effekt av satsendring', type: 'kr', start: 0,
        hjelp: 'Inngående netto midlertidige forskjeller × (ny sats − gammel sats).' },

      { id: 'avvikSats', gruppe: 'skatt', avansert: true, etikett: 'Effekt av avvikende sats', type: 'kr', start: 0,
        hjelp: 'F.eks. utland eller grunnrente. Flere regimer: avstem hvert for seg.' }
    ],

    tomtekst: 'Legg inn resultat før skatt og skattekostnaden. Svaret kommer mens du skriver.',

    /* Dom-linja. Ren tekst — lenken i 0-tilstanden legger motoren på. */
    dom: function (avvik, v, f) {
      var a = Math.abs(avvik);
      if (v.rfs !== 0 && v.bokfort === 0 && a > 1) {
        return 'Har du lagt inn skattekostnaden i regnskapet? 0 kr kan være riktig, men sjekk.' +
          (v.rfs < 0 ? ' Er underskuddet ikke balanseført, før skatteverdien under Skattefordel utenfor balansen.' : '');
      }
      if (avvik === 0) return 'Går opp. Det viser at tallene henger sammen – ikke at skatten er riktig.';
      if (a <= 1) return 'Avviket er 1 krone eller mindre. Trolig avrunding. Vis det i avstemmingen – ikke rund det bort.';
      return 'Regnskapet viser ' + f.kr(a) + (avvik > 0 ? ' mer' : ' mindre') +
        ' skatt enn postene forklarer. Noe mangler eller er feil. Finn årsaken – beløpet skal ikke bli stående.';
    },

    /* Mulige årsaker, vanligste først, med tallene brukeren skal lete etter. */
    forklarAvvik: function (avvik, v, k, f) {
      if (v.rfs !== 0 && v.bokfort === 0) return [];
      var s = v.sats || k.skattesats_alminnelig;
      var a = Math.abs(avvik);
      var ganger = String(Math.round(10 / s) / 10).replace('.', ',');
      return [
        { tittel: 'Noe mangler.',
          tekst: 'Let etter ' + f.kr(a / s) + ' blant de permanente forskjellene, eller ' + f.kr(a) + ' blant skattebeløpene.' },
        { tittel: 'En midlertidig forskjell er tatt med',
          tekst: '(noe som jevner seg ut over tid). Den hører i utsatt skatt, ikke her.' },
        { tittel: 'Hele beløpet og skatten er byttet om.',
          tekst: 'En linje i regnestykket blir da rundt ' + ganger + ' ganger for stor, eller bare ' + f.pst(s) + ' av riktig beløp.' },
        { tittel: 'Pluss og minus byttet om.',
          tekst: 'Let etter ' + f.kr(a / 2) + ' i en linje i regnestykket eller i skattekostnaden. Der står trolig fortegnet feil.' }
      ];
    },

    regn: function (v, k, f) {
      var s = v.sats || k.skattesats_alminnelig;
      var sjablong = k.fritaksmetode_sjablong;

      var forventet = v.rfs * s;
      var tilleggIkkeF = v.ikkeFradr * s;
      var fradragSkattefri = v.skattefri * s;
      /* Utbyttet føres ett sted: feltet gir både fradraget for skattefri
         inntekt og treprosentregelen (null i skattekonsern). */
      var fradragUtbytte = v.aksjeInnt * s;
      var tilleggAksje = v.konsern ? 0 : (v.aksjeInnt * sjablong * s);

      var beregnet = forventet + tilleggIkkeF - fradragSkattefri - fradragUtbytte + tilleggAksje
        + v.ikkeBalansefort + v.fjoraar + v.satsendring + v.avvikSats;

      var etr = v.rfs ? (v.bokfort / v.rfs) : null;

      return {
        steg: [
          { etikett: 'Skatt av resultatet',
            uttrykk: f.kr(v.rfs) + ' × ' + f.pst(s), verdi: forventet },
          { etikett: 'Skatt av kostnader uten skattefradrag',
            uttrykk: f.kr(v.ikkeFradr) + ' × ' + f.pst(s), verdi: tilleggIkkeF },
          { etikett: 'Skatt av skattefrie inntekter',
            uttrykk: f.kr(v.skattefri) + ' × ' + f.pst(s), verdi: -fradragSkattefri },
          { etikett: 'Skattefritt utbytte',
            uttrykk: f.kr(v.aksjeInnt) + ' × ' + f.pst(s), verdi: -fradragUtbytte },
          { etikett: 'Treprosentregelen',
            uttrykk: v.konsern
              ? 'Faller bort i skattekonsern'
              : f.kr(v.aksjeInnt) + ' × ' + f.pst(sjablong) + ' × ' + f.pst(s),
            verdi: tilleggAksje, visAlltid: !!(v.konsern && v.aksjeInnt) },
          { etikett: 'Endring i skattefordel utenfor balansen',
            uttrykk: 'Lagt inn som skatt', verdi: v.ikkeBalansefort },
          { etikett: 'For lite eller mye avsatt i fjor',
            uttrykk: 'Lagt inn som skatt', verdi: v.fjoraar },
          { etikett: 'Effekt av satsendring',
            uttrykk: 'Lagt inn som skatt', verdi: v.satsendring },
          { etikett: 'Effekt av avvikende sats',
            uttrykk: 'Lagt inn som skatt', verdi: v.avvikSats },
          { etikett: 'Forklart skatt',
            uttrykk: 'Sum (beregnet skattekostnad)', verdi: beregnet, sum: true }
        ],

        avstemming: {
          forventetNavn: 'Forklart skatt',
          forventet: beregnet,
          faktiskNavn: 'Skattekostnad i regnskapet',
          faktisk: v.bokfort,
          krav: 0
        },

        noekkeltall: [
          {
            id: 'etr',
            etikett: 'Effektiv skattesats',
            cap: 'skattekostnad ÷ resultat før skatt',
            verdi: etr,
            format: 'pst',
            merknad: (v.rfs < 0)
              ? 'Ved underskudd sier effektiv skattesats ingenting. To negative tall gir en positiv prosent, selv om selskapet har tapt penger.'
              : null
          }
        ]
      };
    }
  });
})();
