/* ──────────────────────────────────────────────────────────────────────────
   H1 — Avsetning, note eller ingenting? Innregningstesten.
   Andre oppslag i bokføringsserien under /regnskap/. Katalog-id H1.

   Type 2, strukturert skjønn. Modellen stiller spørsmålene i riktig
   rekkefølge og viser hva hvert svar fører til. Den konkluderer ikke på
   brukerens vegne, og den foreslår ALDRI en sannsynlighet: den er brukerens
   og ledelsens vurdering.

   Rekkefølgen er beslutningstreet: forpliktelse → egne valg → sannsynlighet
   → estimat. Stopper et svar saken, avgjør det utfallet, og resten av
   spørsmålene spiller ingen rolle.

   Ingen konstanter og ingen årlige satser. Tersklene er sannsynlighets-
   skalaen i NRS 13 pkt. 3.2 (over 50 % / 10–50 % / under 10 %); IAS 37.23
   har samme 50 %-grense. Modellen avgjør OM noe skal føres, ikke hvor mye.
   Beløpet regnes ikke ut her; det settes til beste estimat (regnskapsloven
   § 4-2).

   Tekstfelt: hjelp står synlig under knappene, mer/merEtikett blir en
   sammenleggbar utdyping, og valg[].under er den lille teksten på knappen.
   utfall[].effekt er den lille etiketten i stripa over skjemaet.
   ────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var JA_NEI = [
    { verdi: 'ja', etikett: 'Ja' },
    { verdi: 'nei', etikett: 'Nei' }
  ];

  var felt = [
    { id: 'hendelse', type: 'knapper', valg: JA_NEI,
      etikett: '1. Skjedde det noe før balansedagen som binder dere?',
      kort: 'Hendelse før balansedagen',
      hjelp: 'For eksempel salg med garanti, et søksmål eller et utslipp. Balansedagen er regnskapsårets siste dag, som regel 31. desember.',
      merEtikett: 'Hva teller?',
      mer: 'Plikten kan følge av lov eller avtale. Den kan også følge av fast praksis eller et løfte dere har gitt, slik at andre med rette regner med det. Hendelsen teller, ikke når fakturaen eller dommen kommer. Et søksmål i februar om en ulykke i november teller som ja: ulykken skjedde før balansedagen. Også en kunngjort nedbemanning kan binde dere.' },

    { id: 'egneValg', type: 'knapper', valg: JA_NEI,
      etikett: '2. Kan dere unngå utgiften ved egne valg framover?',
      kort: 'Kan unngås ved egne valg',
      hjelp: 'For eksempel ved å legge ned en aktivitet, selge anlegget eller droppe en investering.' },

    { id: 'sannsynlighet', type: 'knapper',
      etikett: '3. Hvor sannsynlig er det at dere må betale?',
      kort: 'Sannsynlighet for å måtte betale',
      valg: [
        { verdi: 'over50', etikett: 'Over 50 %', under: 'mer sannsynlig enn ikke' },
        { verdi: '10til50', etikett: '10–50 %', under: 'lite sannsynlig: note' },
        { verdi: 'under10', etikett: 'Under 10 %', under: 'svært lite sannsynlig: som regel ingen note' }
      ],
      hjelp: 'Under 50 % gir ingen avsetning, uansett beløp.',
      skjonn: 'Sannsynligheten er deres og ledelsens vurdering, og den må kunne begrunnes. Et omtrentlig anslag holder.',
      merEtikett: 'Slik vurderes like saker',
      mer: 'Eksempel: hver solgte vare har 3 % risiko for garantikrav. Av 1 000 varer kommer det nesten sikkert krav, så sannsynligheten er over 50 %. Saker som gjelder ulike spørsmål, for eksempel skattesaker, må vurderes hver for seg.' },

    { id: 'estimat', type: 'knapper', valg: JA_NEI,
      etikett: '4. Kan dere anslå beløpet?',
      kort: 'Beløpet kan anslås',
      hjelp: 'Nesten alltid ja. Det holder med et spenn, for eksempel 200 000–400 000 kr.' }
  ];

  var utfall = [
    { id: 'avsetning', navn: 'Avsetning', effekt: 'Gjeld i balansen',
      hva: 'Før forpliktelsen som gjeld i balansen, og som regel samme beløp som kostnad i resultatet. Bruk beste estimat: det beste anslaget ut fra det dere vet når regnskapet avlegges.' },
    { id: 'note', navn: 'Note', effekt: 'Bare forklart i noten',
      hva: 'Ingen post i balansen. Beskriv saken i tilleggsopplysningene til årsregnskapet (noten).' },
    { id: 'ingenting', navn: 'Ingenting', effekt: 'Som regel ingen note',
      hva: 'Ingen post i balansen, og som regel ingen note.' },
    { id: 'ingen', navn: 'Ingen forpliktelse', effekt: 'Ikke noe å føre',
      hva: 'Ingen plikt på balansedagen, og ingenting å føre som forpliktelse.' }
  ];

  function finnFelt(id) {
    for (var i = 0; i < felt.length; i++) if (felt[i].id === id) return felt[i];
    return null;
  }
  function svarTekst(id, verdi) {
    var fe = finnFelt(id);
    for (var j = 0; j < fe.valg.length; j++) {
      if (fe.valg[j].verdi === verdi) return fe.valg[j].etikett;
    }
    return String(verdi);
  }

  window.BOK.register({
    id: 'h1-avsetning',
    katalogId: 'H1',
    sti: '/regnskap/avsetninger/',
    type: 2,
    versjon: '1.1',
    tittel: 'Avsetning, note eller ingenting?',
    konstanter: [],
    felt: felt,
    utfall: utfall,

    regn: function (v) {
      var kjede = [];
      function steg(id, folge, avgjorde) {
        kjede.push({ sporsmal: finnFelt(id).kort, svar: svarTekst(id, v[id]), folge: folge, avgjorde: !!avgjorde });
      }
      function venter(nr) {
        return { utfall: null, venter: 'Svar på spørsmål ' + nr + ' for å se utfallet.', kjede: kjede };
      }

      /* 1 — Finnes det en forpliktelse fra noe som alt har skjedd? */
      if (!v.hendelse) return venter(1);
      if (v.hendelse === 'nei') {
        steg('hendelse', 'Ingen hendelse før balansedagen, ingen forpliktelse å vurdere.', true);
        return { utfall: 'ingen', avgjortAv: 1, kjede: kjede,
          grunn: 'Spørsmål 2–4 spiller da ingen rolle.' };
      }
      steg('hendelse', 'En forpliktelse er mulig.');

      /* 2 — Kan den unngås ved egne valg framover? */
      if (!v.egneValg) return venter(2);
      if (v.egneValg === 'ja') {
        steg('egneValg', 'Utgiften hører til framtidig drift, ikke til noe dere skylder i dag.', true);
        return { utfall: 'ingen', avgjortAv: 2, kjede: kjede,
          grunn: 'Utgifter dere kan velge bort, er ingen forpliktelse, så spørsmål 3 og 4 spiller ingen rolle. Unntak i norsk GAAP: periodisk vedlikehold kan avsettes likevel (se tabellen over regelsett lenger ned). Framtidige driftstap gir aldri avsetning: vurder heller om eiendelene må skrives ned.' };
      }
      steg('egneValg', 'Forpliktelsen er reell.');

      /* 3 — Terskelen. En bryter, ikke en glideskala. */
      if (!v.sannsynlighet) return venter(3);
      if (v.sannsynlighet === 'under10') {
        steg('sannsynlighet', 'Svært lite sannsynlig.', true);
        return { utfall: 'ingenting', avgjortAv: 3, kjede: kjede,
          grunn: 'NRS 13 krever ingen note under 10 %. IAS 37 har ingen prosentgrense: noten faller bort bare når det er svært lite sannsynlig at dere må betale (avsnitt 86). Unntak: er forpliktelsen en garanti dere har stilt, skal summen likevel stå i noten (regnskapsloven § 7-28, små foretak § 7-40 tredje ledd). Spørsmål 4 spiller ingen rolle.' };
      }
      if (v.sannsynlighet === '10til50') {
        steg('sannsynlighet', 'Under 50 %: for usikkert til å føres i balansen (betinget forpliktelse).', true);
        return { utfall: 'note', avgjortAv: 3, kjede: kjede,
          grunn: 'Under 50 % blir det ingen avsetning, uansett beløp. Små foretak har lettere notekrav (se tabellen over regelsett lenger ned). Spørsmål 4 spiller ingen rolle.' };
      }
      steg('sannsynlighet', 'Over 50 %: mer sannsynlig at dere må betale enn ikke.');

      /* 4 — Kan beløpet anslås? */
      if (!v.estimat) return venter(4);
      if (v.estimat === 'nei') {
        steg('estimat', 'Uten et pålitelig anslag kan ingenting føres i balansen.', true);
        return { utfall: 'note', avgjortAv: 4, kjede: kjede,
          grunn: 'Det er svært sjelden at beløpet ikke kan anslås. Lander du ofte her, har du trolig ikke satt opp mulige utfall og beløp ennå.' };
      }
      steg('estimat', 'Da kan beløpet føres i balansen.', true);
      return { utfall: 'avsetning', avgjortAv: '1–4', kjede: kjede,
        grunn: 'Alle tre vilkårene er oppfylt: plikten (svar 1 og 2), sannsynligheten (svar 3) og beløpet (svar 4).' };
    }
  });
})();
