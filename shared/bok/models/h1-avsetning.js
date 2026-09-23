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
   har samme 50 %-grense. Modellen avgjør OM noe skal føres, ikke hvor mye —
   beløpet regnes ut i egne oppslag.
   ────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var JA_NEI = [
    { verdi: 'ja', etikett: 'Ja' },
    { verdi: 'nei', etikett: 'Nei' }
  ];

  var felt = [
    { id: 'hendelse', type: 'knapper', valg: JA_NEI,
      etikett: '1. Har det skjedd noe før balansedagen som binder dere?',
      kort: 'Hendelse før balansedagen',
      hjelp: 'Et salg med garanti, en ulykke, et utslipp, et søksmål, en kunngjort nedbemanning. Plikten kan følge av lov, avtale eller noe dere har lovet utad. Det er hendelsen som teller, ikke når fakturaen eller dommen kommer.' },

    { id: 'egneValg', type: 'knapper', valg: JA_NEI,
      etikett: '2. Kan dere slippe unna utgiften ved å velge annerledes framover?',
      kort: 'Kan unngås ved egne valg',
      hjelp: 'For eksempel ved å legge ned en aktivitet, selge anlegget eller la være å investere. Kan dere det, hører utgiften til framtidig drift og er ikke en forpliktelse i dag.' },

    { id: 'sannsynlighet', type: 'knapper',
      etikett: '3. Hvor sannsynlig er det at dere må betale?',
      kort: 'Sannsynlighet for å måtte betale',
      valg: [
        { verdi: 'over50', etikett: 'Over 50 % — mer sannsynlig enn ikke' },
        { verdi: '10til50', etikett: '10–50 % — lite sannsynlig' },
        { verdi: 'under10', etikett: 'Under 10 % — svært lite sannsynlig' }
      ],
      hjelp: 'En omtrentlig vurdering holder. Mange like saker, som garantier på solgte varer, vurderes samlet. Saker som gjelder ulike spørsmål, vurderes hver for seg.',
      skjonn: 'Sannsynligheten er din og ledelsens vurdering. Siden foreslår aldri en prosent.' },

    { id: 'estimat', type: 'knapper', valg: JA_NEI,
      etikett: '4. Kan dere anslå beløpet?',
      kort: 'Beløpet kan anslås',
      hjelp: 'Nesten alltid ja. Et spenn av mulige utfall er nok til å finne et beste estimat. Det er svært sjelden at det ikke går.' }
  ];

  var utfall = [
    { id: 'avsetning', navn: 'Avsetning', kort: 'Avsetning',
      hva: 'Før forpliktelsen i balansen og kostnadsfør beste estimat av beløpet.' },
    { id: 'note', navn: 'Note, ingen avsetning', kort: 'Note',
      hva: 'Ingen post i balansen. Forholdet beskrives i noten.' },
    { id: 'ingenting', navn: 'Ingenting', kort: 'Ingenting',
      hva: 'Ingen post i balansen, og noten kan som regel sløyfes.' },
    { id: 'ingen', navn: 'Ingen forpliktelse', kort: 'Ingen forpliktelse',
      hva: 'Det finnes ingen plikt på balansedagen, og ingenting å føre som forpliktelse.' }
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
    versjon: '1.0',
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
        return { utfall: null, venter: 'Svar på spørsmål ' + nr + ', så markeres utfallet ditt her.', kjede: kjede };
      }

      /* 1 — Finnes det en forpliktelse fra noe som alt har skjedd? */
      if (!v.hendelse) return venter(1);
      if (v.hendelse === 'nei') {
        steg('hendelse', 'Uten en hendelse før balansedagen finnes det ingen forpliktelse å vurdere.', true);
        return { utfall: 'ingen', avgjortAv: 1, kjede: kjede,
          grunn: 'Ingenting har skjedd ennå som binder dere. En avsetning krever en forpliktelse på balansedagen, så spørsmål 2 til 4 spiller ingen rolle.' };
      }
      steg('hendelse', 'En forpliktelse er mulig.');

      /* 2 — Kan den unngås ved egne valg framover? */
      if (!v.egneValg) return venter(2);
      if (v.egneValg === 'ja') {
        steg('egneValg', 'Utgiften hører til framtidig drift, ikke til noe dere skylder i dag.', true);
        return { utfall: 'ingen', avgjortAv: 2, kjede: kjede,
          grunn: 'Kan dere velge dere bort fra utgiften, er den ikke en forpliktelse. Framtidige driftstap gir aldri avsetning — vurder heller nedskrivning av eiendelene. Unntak i norsk GAAP: periodisk vedlikehold, se regelen side om side.' };
      }
      steg('egneValg', 'Dere kan ikke velge dere bort fra den. Forpliktelsen er reell.');

      /* 3 — Terskelen. En bryter, ikke en glideskala. */
      if (!v.sannsynlighet) return venter(3);
      if (v.sannsynlighet === 'under10') {
        steg('sannsynlighet', 'Svært lite sannsynlig.', true);
        return { utfall: 'ingenting', avgjortAv: 3, kjede: kjede,
          grunn: 'Under 10 % regnes som svært lite sannsynlig, og noten etter NRS 13 og IAS 37 kan sløyfes. Er forpliktelsen en garanti dere har stilt, skal summen likevel stå i noten (regnskapsloven § 7-28, for små foretak § 7-40 tredje ledd).' };
      }
      if (v.sannsynlighet === '10til50') {
        steg('sannsynlighet', 'Under terskelen på 50 %. Det er en betinget forpliktelse.', true);
        return { utfall: 'note', avgjortAv: 3, kjede: kjede,
          grunn: 'Under 50 % blir det ingen avsetning, uansett hvor stort beløpet er. Forpliktelsen er betinget og beskrives i noten. Små foretak har lettere notekrav — se regelen side om side.' };
      }
      steg('sannsynlighet', 'Over terskelen: det er mer sannsynlig at dere må betale enn at dere slipper.');

      /* 4 — Kan beløpet anslås? */
      if (!v.estimat) return venter(4);
      if (v.estimat === 'nei') {
        steg('estimat', 'Uten et pålitelig estimat kan ingenting føres i balansen.', true);
        return { utfall: 'note', avgjortAv: 4, kjede: kjede,
          grunn: 'Uten et pålitelig estimat blir det ingen balansepost, bare note. Det skjer svært sjelden — lander du ofte her, er utfallsrommet sannsynligvis ikke bygget ennå.' };
      }
      steg('estimat', 'Da kan avsetningen måles til beste estimat.', true);
      return { utfall: 'avsetning', avgjortAv: '1–4', kjede: kjede,
        grunn: 'Alle tre vilkårene er oppfylt: en forpliktelse fra noe som skjedde før balansedagen, over 50 % sannsynlig at dere må betale, og et beløp som kan anslås. Avsetningen føres til beste estimat.' };
    }
  });
})();
