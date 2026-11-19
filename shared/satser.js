/* ────────────────────────────────────────────────────────────────────────
   shared/satser.js — satsene som skatte-, lønns- og trygdekalkulatorene deler.

   Her står hver sats ÉN gang. Sidene under leser herfra i stedet for å ha
   egne kopier, så årsoppdateringen blir én endring i denne fila:
     skatt/inntekt, kalkulator/lonnut, personlig/lonn, personlig/budsjett,
     skatt/skattemelding, skatt/utbytte, skatt/uttak, skatt/reise, boliglan/bsu,
     avgift/aga, kalkulator/ferie, personlig/foreldrepenger, personlig/pensjon,
     personlig/syk

   Lastes UTEN defer, rett før sidens egen <script>, fordi sidene leser
   satsene med en gang de kjøres. Sidene skriver da for eksempel
   HV_SATSER.skatt.personfradrag.

   VARSEL NÅR SATSENE ER GAMLE
   Skript-taggen kan ha data-varsel="skatt", "g" eller "skatt g":
     skatt → fra 1.1. året etter skatt.aar: «Satsene for 2027 er ikke lagt inn ennå …»
     g     → dagen etter g.til:             «Grunnbeløpet (G) fra 1. mai 2027 …»
   Varselet settes inn under ingressen øverst på siden. Det leser klientens
   egen klokke, så en maskin med feil dato får varselet for tidlig eller for sent.
   Teksten oversettes via `_ph` i shared/lang/{en,pl,uk,ar,fr}.js. Nøklene der
   inneholder årstallet, så de må få nye årstall når satsene oppdateres.

   SJEKKLISTE VED ÅRSSKIFTET (skatt, 1.1.) — ikke alt står her ennå:
     1. Alle verdiene i `skatt` under, og `aar` + `kontrollert`.
     2. Satser som bare står på én side og derfor ikke er flyttet hit:
        skatt/formue (bunnfradrag, trinn, satser), avgift/aga (soner, fribeløp),
        avgift/engangsavgift (alle ledd), skjermingsrenten og oppjusteringsfaktoren
        1,72 (utbytte/uttak), og verdiene 0.22 / 0.185 i regionvalget på
        skatt/inntekt og kalkulator/lonnut (må være lik finnmarkSats).
     3. Satser i vanlig tekst og i shared/lang/*.js («Trinn 1 (1,7 %)», titler,
        meta-beskrivelser), og shared/lang/no-lett.js (scripts/gen-no-lett.js).
     4. Død kode i shared/core.js har fortsatt gamle kopier (slettes i P27).
   VED NYTT GRUNNBELØP (1.5.): `g.verdi`, `g.fra`, `g.til`, og nytt år i `g.per31des`.
   ──────────────────────────────────────────────────────────────────────── */
(function(){
  var S = window.HV_SATSER = {

    skatt: {
      aar:         2026,
      kontrollert: '2026-11-19',
      kilde:       'Stortingets skattevedtak for inntektsåret 2026 (FOR-2025-12-18-2747) og skatteetaten.no/satser',
      url:         'https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747',

      // Trinnskatt av personinntekt (skattevedtaket § 3-1)
      trinn: [
        { fra: 226100,  til: 318300,   sats: 0.017 },
        { fra: 318300,  til: 725050,   sats: 0.040 },
        { fra: 725050,  til: 980100,   sats: 0.137 },
        { fra: 980100,  til: 1467200,  sats: 0.168 },
        { fra: 1467200, til: Infinity, sats: 0.178 }
      ],
      minsteSats:       0.46,    // minstefradrag i lønn (skatteloven § 6-32)
      minsteMaks:       95700,   // skattevedtaket § 6-1
      personfradrag:    114540,  // klasse 1, skattevedtaket § 6-3

      // Trygdeavgift (skatteetaten.no/satser/trygdeavgift)
      trygdLonn:        0.076,   // lønn, 17–69 år
      trygdNaering:     0.108,   // annen næringsinntekt
      trygdLav:         0.051,   // under 17 og over 69 år, pensjon
      trygdNedre:       99650,   // ingen trygdeavgift under dette
      trygdOpptrapping: 0.25,    // aldri mer enn 25 % av inntekten over nedre grense

      fagforening:      8700,
      ips:              25000,   // individuell sparing til pensjon
      gaver:            25000,   // gaver til frivillige organisasjoner
      bsuSats:          0.10,
      bsuMaksAar:       27500,
      bsuMaksTotalt:    300000,
      reiseKm:          1.90,    // kr per km
      reiseEgenandel:   12000,
      reiseTak:         120000,
      reiseBomGrense:   3300,    // bom og ferge teller bare over dette (FSFIN § 6-44-4)
      finnmarkSats:     0.185,   // alminnelig inntekt i tiltakssonen (2,40 + 11,35 + 4,75)
      finnmarkFradrag:  45000    // særskilt fradrag i tiltakssonen
    },

    // Grunnbeløpet i folketrygden, fastsatt hvert år per 1. mai (nav.no/grunnbelopet)
    g: {
      verdi:       136549,
      fra:         '2026-05-01',
      til:         '2027-04-30',
      kontrollert: '2026-11-19',
      url:         'https://www.nav.no/grunnbelopet',
      // G per 31.12. i opptjeningsåret (6G-taket for feriepenger, ferieloven § 10 nr. 3)
      per31des:    { 2025: 130160, 2026: 136549 }
    }
  };

  var me = document.currentScript;
  var grupper = ((me && me.getAttribute('data-varsel')) || '').split(/\s+/);

  function tekster(na){
    var ut = [];
    if(grupper.indexOf('skatt') >= 0 && na.getFullYear() > S.skatt.aar){
      ut.push('Satsene for ' + na.getFullYear() + ' er ikke lagt inn ennå. Tallene er regnet med satsene for ' + S.skatt.aar + '.');
    }
    if(grupper.indexOf('g') >= 0 && na > new Date(S.g.til + 'T23:59:59')){
      var nyttAar = +S.g.til.slice(0, 4), gammeltAar = +S.g.fra.slice(0, 4);
      ut.push('Grunnbeløpet (G) fra 1. mai ' + nyttAar + ' er ikke lagt inn ennå. Tallene bruker grunnbeløpet fra 1. mai ' + gammeltAar + '.');
    }
    return ut;
  }

  function visVarsel(){
    var ut = tekster(new Date());
    if(!ut.length) return;
    // .page-hero på kalkulatorsidene, .cat-hero på budsjettet
    var hero = document.querySelector('.page-hero') || document.querySelector('.cat-hero');
    var etter = hero && (hero.querySelector('.page-lead, .ch-sub') || hero.querySelector('.page-title, h1'));
    if(!etter) return;
    if(!document.getElementById('satser-varsel-css')){
      var css = document.createElement('style');
      css.id = 'satser-varsel-css';
      css.textContent = '.satser-varsel{margin:14px 0 0;padding:10px 14px;max-width:62ch;border:1px solid var(--line-2);'
        + 'border-left:3px solid var(--accent);border-radius:8px;color:var(--ink);font-size:14px;line-height:1.5}'
        + '.cat-hero .satser-varsel{margin-left:auto;margin-right:auto}';
      document.head.appendChild(css);
    }
    for(var i = ut.length - 1; i >= 0; i--){
      var p = document.createElement('p');
      p.className = 'satser-varsel';
      p.setAttribute('role', 'note');
      p.textContent = ut[i];
      etter.parentNode.insertBefore(p, etter.nextSibling);
    }
  }

  if(grupper.join('')){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', visVarsel);
    else visVarsel();
  }
})();
