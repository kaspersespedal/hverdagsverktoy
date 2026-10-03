/* ──────────────────────────────────────────────────────────────────────────
   shared/bok/bok-engine.js — motoren bak bokføringsoppslagene under /regnskap/.

   FASE 1 (2026-09-22), minste brukbare form:
     · registry              window.BOK.register(modell)
     · feltrenderer          bygger inndatafeltene fra modellens felt-liste
     · stegvisning           regnestykket med BRUKERENS EGNE TALL satt inn
     · avstemmingsskall      forventet − faktisk = uforklart, krav 0
     · satsvarsel            leser utloper/kontrollert i BOK_DATA og varsler selv
     · sessionStorage        i try/catch, tømmes når fanen lukkes

   FASE 1b (2026-09-23), for H1 — første modell av type 2 (strukturert skjønn):
     · felttypen «knapper»   radiogruppe. En terskel er en bryter, aldri en glider
     · utfallspanel          alle utfall samtidig, det aktive markert, og hvilket
                             svar som avgjorde — i stedet for avstemmingsskallet

   FASE 1c (2026-09-24), ks-oppsettet (samme skall som lønn-siden):
     · modell.grupper        seksjoner med hode, felt i par og sjeldne felt
                             bak en toggle som sier fra når de er i bruk
     · data-bok="<nøkkel>"   motoren fyller alle elementer med nøkkelen
     · dom / forklarAvvik    modellens egen dom-linje og årsaksliste
     · type 2 i ks           utfallene i stripa (#bokStrip), svaret stort i
                             svarkortet, kjeden som stat-rader. Den gamle
                             .fg-banen og utfallslista er fjernet.
     · avstemmingsskallet    (#bokAvstemming, .bok-avst) er fjernet: avviket
                             står i stripa og svarkortet.

   IKKE ennå, med vilje: kontoplan, mva-koder, bilagstabell, T-konto,
   regelsettvelger, i18n, bransjefilter, CSV-eksport.

   TYPESPERRE: validering 1 (type 3 kan ikke ha inndatafelt) og validering 2
   i lett form (type 2 kan ikke ha bilag-funksjon) er på plass. Validering 3
   (skjønnsmerket følger med i kopiert tekst) hører til fase 3, når
   bilagsrendereren bygges.

   Denne fila kjører SYNKRONT nederst i <body>, altså før core.js. Den er
   selvforsynt med parsing og formatering nettopp derfor — den kan ikke regne
   med at hjelpere i core.js eller site-shell.js finnes ennå.
   ────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var BOK = window.BOK = window.BOK || {};

  /* ── Tall inn ────────────────────────────────────────────────────────────
     Rekkefølgen er kritisk og er lært av en tidligere feil i repoet:
     1) unicode-minus FØRST. Tall limt inn fra Excel eller PDF kommer med
        U+2212, og den globale live-formattereren i core.js skriver ASCII-minus.
        Strippes mellomrom først, spises minustegnet og −50 000 blir +50 000.
     2) mellomrom og hardt mellomrom — tegnklassen skal IKKE inneholde komma.
        Med komma i klassen forsvinner det før steg 3 rekker å gjøre det om,
        og 12,5 blir 125.
     3) desimalkomma til punktum.                                            */
  function parseNum(el) {
    if (!el) return 0;
    var s = String(el.value || '')
      .replace(/[−‒–—―]/g, '-')
      .replace(/[\s  ]/g, '')
      .replace(',', '.');
    var v = parseFloat(s);
    return isFinite(v) ? v : 0;
  }

  /* ── Tall ut ─────────────────────────────────────────────────────────── */
  function kr(n) {
    if (n === null || n === undefined || !isFinite(n)) return '–';
    var r = Math.round(n);
    if (r === 0) r = 0;   /* Math.round(-0) er -0, og Intl skriver det ut som «-0». */
    return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })
      .format(r).replace(/ /g, ' ') + '\u00a0kr';   /* enheten brytes aldri bort fra tallet */
  }
  function pst(andel) {
    if (andel === null || andel === undefined || !isFinite(andel)) return '–';
    var p = andel * 100;
    var s = (Math.round(p * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
    return s.replace('.', ',') + '\u00a0%';
  }
  function tall(n) {
    if (n === null || n === undefined || !isFinite(n)) return '–';
    return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })
      .format(Math.round(n)).replace(/ /g, ' ');
  }
  var f = { kr: kr, pst: pst, tall: tall };

  function el(id) { return document.getElementById(id); }
  function sett(id, tekst) { var e = el(id); if (e) e.textContent = tekst; }
  function idag() { return new Date().toISOString().slice(0, 10); }
  /* ISO-dato til «1. januar 2027». Leses som UTC, så tidssonen ikke flytter dagen. */
  function datoTekst(iso) {
    var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!d) return iso || '–';
    return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(+d[1], +d[2] - 1, +d[3]))).replace(' ', ' ');
  }

  /* ── Konstanter ──────────────────────────────────────────────────────────
     Modellen kopierer aldri en sats inn i regnestykket. Den oppgir hvilke
     konstanter den bruker, og får verdiene inn via k-argumentet. Det er
     nettopp derfor motoren kan varsle om utløp uten at noen husker noe.     */
  function hentKonstanter(noekler) {
    var kilde = (window.BOK_DATA && window.BOK_DATA.konstanter) || {};
    var ut = { _meta: {} };
    (noekler || []).forEach(function (n) {
      var k = kilde[n];
      if (!k) { ut[n] = 0; return; }
      ut[n] = k.verdi;
      ut._meta[n] = k;
    });
    return ut;
  }

  /* Utløpte satser gruppert på utløpsdato: tre satser med samme dato blir
     én setning, ikke tre like. */
  function satsvarsel(k) {
    var na = idag(), perDato = {}, datoer = [], eldste = null;
    Object.keys(k._meta).forEach(function (n) {
      var m = k._meta[n];
      if (!eldste || m.kontrollert < eldste) eldste = m.kontrollert;
      if (m.utloper && m.utloper <= na) {
        if (!perDato[m.utloper]) { perDato[m.utloper] = []; datoer.push(m.utloper); }
        perDato[m.utloper].push(m);
      }
    });
    return {
      grupper: datoer.map(function (d) { return { utloper: d, satser: perDato[d] }; }),
      eldsteKontroll: eldste
    };
  }

  /* «a», «a og b», «a, b og c» */
  function opplisting(ord) {
    return ord.length < 2 ? ord.join('') : ord.slice(0, -1).join(', ') + ' og ' + ord[ord.length - 1];
  }

  /* Bygges med textContent: bare strong og lenken er elementer. Lenken til
     Hjemmel legges bare på når siden har seksjonen, ellers står kildene. */
  function visSatsvarsel(vert, grupper) {
    vert.textContent = '';
    vert.hidden = !grupper.length;
    if (!grupper.length) return;
    var antall = grupper.reduce(function (n, g) { return n + g.satser.length; }, 0);
    var st = document.createElement('strong');
    st.textContent = antall === 1 ? 'Sjekk satsen.' : 'Sjekk satsene.';
    vert.appendChild(st);
    function tekst(t) { vert.appendChild(document.createTextNode(t)); }
    grupper.forEach(function (g) {
      var s = g.satser;
      if (s.length === 1) {
        tekst(' ' + s[0].navn + ' (' + s[0].visning + ') skulle vært kontrollert på nytt innen ' + datoTekst(g.utloper) +
          '. Kontroller den mot ' + s[0].kilde + ' før du bruker tallet.');
        return;
      }
      tekst(' Disse skulle vært kontrollert på nytt innen ' + datoTekst(g.utloper) + ': ' +
        opplisting(s.map(function (m) { return m.navn + ' (' + m.visning + ')'; })) + '.');
      if (el('hjemmel')) {
        tekst(' Kontroller dem mot kildene under ');
        var a = document.createElement('a');
        a.href = '#hjemmel';
        a.textContent = 'Hjemmel';
        vert.appendChild(a);
        tekst(' før du bruker tallene.');
      } else {
        tekst(' Kontroller dem mot ' + opplisting(s.map(function (m) { return m.kilde; })) + ' før du bruker tallene.');
      }
    });
  }

  /* ── Feltrenderer ────────────────────────────────────────────────────── */
  function leggTilHjelp(rad, fe) {
    if (fe.hjelp) {
      var h = document.createElement('span');
      h.className = 'ik-hint';
      h.textContent = fe.hjelp;
      rad.appendChild(h);
    }
    if (fe.skjonn) {
      var sk = document.createElement('span');
      sk.className = 'bok-skjonn';
      /* Modellen kan gi sin egen formulering; ellers standardteksten. */
      sk.textContent = (typeof fe.skjonn === 'string') ? fe.skjonn
        : 'Dette feltet er din vurdering, ikke et tall som kan slås opp.';
      rad.appendChild(sk);
    }
    /* Utdyping og eksempler står bak en summary. Regelen som endrer svaret,
       hører i hjelp og står synlig. */
    if (fe.mer) {
      var d = document.createElement('details');
      d.className = 'bok-mer';
      var s = document.createElement('summary');
      s.textContent = fe.merEtikett || 'Mer';
      var p = document.createElement('p');
      p.textContent = fe.mer;
      d.appendChild(s);
      d.appendChild(p);
      rad.appendChild(d);
    }
  }

  /* Felttypen «knapper»: en radiogruppe i et fieldset. Brukes ALLTID der en
     terskel avgjør utfallet, fordi en terskel er en bryter og ikke en
     glideskala — 45 % gir ingen avsetning, uansett hvor stort beløpet er.
     Radioknappen er usynlig, men ligger over knappeflaten og blir værende i
     DOM-en, så tastatur (piltaster) og skjermleser virker som normalt.
     Flata (.bk-f) står rett etter input, så input:checked + .bk-f og
     input:focus-visible + .bk-f treffer hele knappen, også den lille
     teksten under. Har ett valg en slik tekst (under), står knappene under
     hverandre i stedet for side om side.                                    */
  function byggKnapper(fe, veduendring) {
    var fs = document.createElement('fieldset');
    fs.className = 'ik-fg bok-fg-knapper';
    fs.id = 'bf-' + fe.id;

    var lg = document.createElement('legend');
    lg.className = 'bok-sp';
    lg.textContent = fe.etikett;
    fs.appendChild(lg);

    var rader = fe.valg.some(function (v) { return !!v.under; });
    var gruppe = document.createElement('div');
    gruppe.className = 'bok-knapper' + (rader ? ' bok-knapper-rader' : '');
    gruppe.style.setProperty('--n', String(fe.valg.length));
    fe.valg.forEach(function (v) {
      var lbl = document.createElement('label');
      lbl.className = 'bok-knapp';
      var inn = document.createElement('input');
      inn.type = 'radio';
      inn.name = 'bf-' + fe.id;
      inn.value = String(v.verdi);
      if (fe.start !== undefined && String(v.verdi) === String(fe.start)) inn.checked = true;
      inn.addEventListener('change', veduendring);
      var flate = document.createElement('span');
      flate.className = 'bk-f';
      var t = document.createElement('span');
      t.className = 'bk-t';
      t.textContent = v.etikett;
      flate.appendChild(t);
      if (v.under) {
        var u = document.createElement('span');
        u.className = 'bk-u';
        u.textContent = v.under;
        flate.appendChild(u);
      }
      lbl.appendChild(inn);
      lbl.appendChild(flate);
      gruppe.appendChild(lbl);
    });
    fs.appendChild(gruppe);

    leggTilHjelp(fs, fe);
    return fs;
  }

  /* Selve inndataelementet (avkrysning, valg eller beløp). */
  function lagInndata(fe, veduendring) {
    var inn;
    if (fe.type === 'avkrysning') {
      inn = document.createElement('input');
      inn.type = 'checkbox';
      inn.id = 'bf-' + fe.id;
      if (fe.start) inn.checked = true;
      inn.addEventListener('change', veduendring);
    } else if (fe.type === 'valg') {
      inn = document.createElement('select');
      inn.id = 'bf-' + fe.id;
      fe.valg.forEach(function (v) {
        var o = document.createElement('option');
        o.value = String(v.verdi);
        o.textContent = v.etikett;
        if (String(v.verdi) === String(fe.start)) o.selected = true;
        inn.appendChild(o);
      });
      inn.addEventListener('change', veduendring);
    } else {
      inn = document.createElement('input');
      inn.type = 'text';
      inn.id = 'bf-' + fe.id;
      /* Beløp i hele kroner får tusenskille gratis av den globale
         formattereren i core.js. Felt som skal tåle komma må ha
         inputmode="decimal", ellers spiser formattereren kommaet. */
      inn.setAttribute('inputmode', fe.type === 'desimal' ? 'decimal' : 'numeric');
      inn.setAttribute('placeholder', '0');
      if (fe.start) inn.value = tall(fe.start);
      inn.addEventListener('input', veduendring);
    }
    return inn;
  }

  /* ks-banen: lønn-sidens markup, .ik-fg > .ik-lbl + .ik-input/.ik-select
     + .ik-hint. En avkrysning står i en boks på høyde med nabofeltets
     inndata, med etiketten til høyre for krysset. */
  function byggIkFelt(fe, veduendring) {
    if (fe.type === 'knapper') return byggKnapper(fe, veduendring);
    var fg = document.createElement('div');
    fg.className = 'ik-fg';
    var inn = lagInndata(fe, veduendring);
    var lbl = document.createElement('label');
    lbl.setAttribute('for', inn.id);
    lbl.textContent = fe.etikett;
    if (fe.type === 'avkrysning') {
      fg.className += ' bok-ik-kryss';
      var boks = document.createElement('div');
      boks.className = 'bok-kryss-boks';
      boks.appendChild(inn);
      boks.appendChild(lbl);
      fg.appendChild(boks);
    } else {
      lbl.className = 'ik-lbl';
      if (fe.cap) {
        var cap = document.createElement('span');
        cap.className = 'cap';
        cap.textContent = fe.cap;
        lbl.appendChild(cap);
      }
      inn.className = fe.type === 'valg' ? 'ik-select' : 'ik-input';
      fg.appendChild(lbl);
      fg.appendChild(inn);
    }
    leggTilHjelp(fg, fe);
    return fg;
  }

  /* Radgrupperingen i ks-banen: knappefelt og felt med bredt: true får egen
     full rad, resten fylles to og to. En halvrad med ett felt blir stående. */
  function fyllStabel(felter, stabel, veduendring) {
    var rad = null;
    felter.forEach(function (fe) {
      var full = fe.type === 'knapper' || !!fe.bredt;
      if (full || !rad) {
        rad = document.createElement('div');
        rad.className = full ? 'ik-row full' : 'ik-row';
        stabel.appendChild(rad);
      }
      rad.appendChild(byggIkFelt(fe, veduendring));
      if (full || rad.children.length === 2) rad = null;
    });
  }

  function apne(sek, apen) {
    sek.samme.classList.toggle('open', apen);
    sek.knapp.setAttribute('aria-expanded', apen ? 'true' : 'false');
  }

  /* Har feltet en annen verdi enn start? Styrer «· N i bruk» på toggelen og
     automatisk åpning ved gjenoppretting: et felt som påvirker svaret, skal
     aldri ligge skjult uten at det synes. */
  function erEndret(fe, verdi) {
    if (fe.type === 'avkrysning') return verdi !== !!fe.start;
    if (fe.type === 'knapper') return verdi !== null && String(verdi) !== String(fe.start);
    return verdi !== (fe.start || 0);
  }

  /* Seksjoner fra modell.grupper: hode (tittel + meta eller meta-lenke),
     valgfri hint, primærfeltene, og felt med avansert: true bak en toggle.
     Returnerer det regnUt trenger for å holde toggelen og noten oppdatert. */
  function byggSeksjoner(modell, vert, veduendring) {
    vert.innerHTML = '';
    return modell.grupper.map(function (g) {
      var felter = modell.felt.filter(function (fe) { return fe.gruppe === g.id; });
      var sek = { gruppe: g, avanserte: felter.filter(function (fe) { return fe.avansert; }) };

      var sec = document.createElement('section');
      sec.className = 'ks-section';
      sec.setAttribute('data-gruppe', g.id);
      sec.setAttribute('aria-labelledby', 'bok-sek-' + g.id);

      var hode = document.createElement('div');
      hode.className = 'ik-section-head';
      var h = document.createElement('h3');
      h.id = 'bok-sek-' + g.id;
      h.textContent = g.tittel;
      hode.appendChild(h);
      if (g.meta) {
        var meta = document.createElement(g.metaHref ? 'a' : 'span');
        meta.className = 'meta';
        if (g.metaHref) meta.href = g.metaHref;
        meta.textContent = g.meta;
        hode.appendChild(meta);
      }
      sec.appendChild(hode);

      if (g.hint) {
        var hint = document.createElement('p');
        hint.className = 'ik-hint bok-sek-hint';
        hint.textContent = g.hint;
        sec.appendChild(hint);
      }

      var stabel = document.createElement('div');
      stabel.className = 'ik-stack';
      fyllStabel(felter.filter(function (fe) { return !fe.avansert; }), stabel, veduendring);
      sec.appendChild(stabel);

      if (sek.avanserte.length) {
        sek.knapp = document.createElement('button');
        sek.knapp.type = 'button';
        sek.knapp.className = 'ik-toggle';
        sek.knapp.setAttribute('aria-expanded', 'false');
        sek.knapp.setAttribute('aria-controls', 'bok-adv-' + g.id);
        sek.knapp.textContent = g.toggle;

        sek.samme = document.createElement('div');
        sek.samme.className = 'ik-collapse';
        sek.samme.id = 'bok-adv-' + g.id;
        var stabel2 = document.createElement('div');
        stabel2.className = 'ik-stack';
        fyllStabel(sek.avanserte, stabel2, veduendring);
        sek.samme.appendChild(stabel2);

        if (g.note) {
          var note = document.createElement('p');
          note.className = 'ik-note bok-note';
          sek.noteTekst = document.createElement('span');
          note.appendChild(sek.noteTekst);
          if (g.noteLenke) {
            var a = document.createElement('a');
            a.href = g.noteLenke.href;
            a.textContent = g.noteLenke.tekst;
            note.appendChild(document.createTextNode(' '));
            note.appendChild(a);
          }
          sek.samme.appendChild(note);
        }

        sek.knapp.addEventListener('click', function () {
          apne(sek, !sek.samme.classList.contains('open'));
          veduendring();
        });
        sec.appendChild(sek.knapp);
        sec.appendChild(sek.samme);
      }
      vert.appendChild(sec);
      return sek;
    });
  }

  /* Én bane, to innganger: modell.grupper gir seksjoner med hode
     (skatteavstemming). Uten grupper er verten selv en .ik-stack som fylles
     med ks-rader direkte (avsetninger, der sidens HTML har hodet). */
  function byggFelt(modell, vert, veduendring) {
    if (modell.grupper) return byggSeksjoner(modell, vert, veduendring);
    vert.innerHTML = '';
    fyllStabel(modell.felt, vert, veduendring);
    return [];
  }

  function lesFelt(modell) {
    var v = {};
    modell.felt.forEach(function (fe) {
      var e = el('bf-' + fe.id);
      if (!e) { v[fe.id] = 0; return; }
      if (fe.type === 'knapper') {
        /* Ubesvart er null, ikke 0: «ikke svart ennå» er noe annet enn et svar. */
        var valgt = e.querySelector('input:checked');
        v[fe.id] = valgt ? valgt.value : null;
      }
      else if (fe.type === 'avkrysning') v[fe.id] = !!e.checked;
      else if (fe.type === 'valg') v[fe.id] = parseFloat(e.value);
      else v[fe.id] = parseNum(e);
    });
    return v;
  }

  /* ── Stegvisning ─────────────────────────────────────────────────────────
     Hvert steg rendres som tre deler: etikett, uttrykk med brukerens egne
     tall satt inn, og resultat. Aldri bokstavformelen.
     Linjer med 0 kr skjules. Første linje og summen står alltid, og modellen
     kan be om at en nullinje vises likevel (visAlltid). Summen endres ikke,
     siden bare nullinjer skjules.                                           */
  function byggSteg(steg, vert) {
    vert.innerHTML = '';
    steg.forEach(function (s, i) {
      if (s.verdi === 0 && i > 0 && !s.sum && !s.visAlltid) return;
      var r = document.createElement('div');
      r.className = 'bok-steg-rad' + (s.sum ? ' er-sum' : '');
      var a = document.createElement('span'); a.className = 'bs-lbl'; a.textContent = s.etikett;
      var b = document.createElement('span'); b.className = 'bs-utt'; b.textContent = s.uttrykk;
      var c = document.createElement('span'); c.className = 'bs-val'; c.textContent = kr(s.verdi);
      r.appendChild(a); r.appendChild(b); r.appendChild(c);
      vert.appendChild(r);
    });
  }

  /* ── Økt-lagring og gjenoppretting, felles for alle modelltyper ─────────
     sessionStorage, alltid i try/catch: er den sperret, skal siden virke
     uten lagring i stedet for å stoppe.                                     */
  function lagreSesjon(nokkel, v) {
    try { sessionStorage.setItem(nokkel, JSON.stringify(v)); } catch (e) {}
  }
  function hentSesjon(nokkel) {
    try {
      var raw = sessionStorage.getItem(nokkel);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function gjenopprett(modell, lagret) {
    if (!lagret) return;
    modell.felt.forEach(function (fe) {
      if (lagret[fe.id] === undefined || lagret[fe.id] === null) return;
      var e = el('bf-' + fe.id);
      if (!e) return;
      if (fe.type === 'knapper') {
        e.querySelectorAll('input').forEach(function (r) {
          r.checked = (r.value === String(lagret[fe.id]));
        });
      }
      else if (fe.type === 'avkrysning') e.checked = !!lagret[fe.id];
      else if (fe.type === 'valg') e.value = String(lagret[fe.id]);
      else e.value = tall(lagret[fe.id]);
    });
  }

  /* ── Utfallet (type 2) ───────────────────────────────────────────────────
     Et skjønnsspørsmål har ingen fasit å regne mot. Stripa over skjemaet
     viser derfor ALLE utfall samtidig og markerer det brukerens egne svar
     peker på — med tekst, ikke bare farge. Svarkortet viser utfallet stort,
     hva det betyr og hvorfor, og kjeden viser hvilket svar som avgjorde.
     Utfallet står som svarenes følge («Svarene dine gir»), aldri som
     modellens dom. Alt settes med textContent: ingen modelltekst tolkes
     som HTML.                                                               */
  function finnUtfall(modell, id) {
    for (var i = 0; i < modell.utfall.length; i++) {
      if (modell.utfall[i].id === id) return modell.utfall[i];
    }
    return null;
  }

  /* Stripa er statisk innhold fra modellen: rendres én gang, bare
     markeringen flytter seg. */
  function byggStripe(modell, vert) {
    vert.innerHTML = '';
    modell.utfall.forEach(function (u) {
      var c = document.createElement('div');
      c.className = 'ks-strip-cell';
      c.setAttribute('data-utfall', u.id);
      var l = document.createElement('span'); l.className = 'l'; l.textContent = u.effekt || '';
      var v = document.createElement('span'); v.className = 'v'; v.textContent = u.navn;
      c.appendChild(l);
      c.appendChild(v);
      vert.appendChild(c);
    });
  }

  function markerStripe(vert, id) {
    vert.querySelectorAll('.ks-strip-cell').forEach(function (c) {
      var aktiv = c.getAttribute('data-utfall') === id;
      var merke = c.querySelector('.bok-merke');
      c.classList.toggle('accent', aktiv);
      if (aktiv) {
        c.setAttribute('aria-current', 'true');
        if (!merke) {
          merke = document.createElement('span');
          merke.className = 'bok-merke';
          merke.textContent = 'Ditt utfall';
          c.appendChild(merke);
        }
      } else {
        c.removeAttribute('aria-current');
        if (merke) c.removeChild(merke);
      }
    });
  }

  /* Det store svaret → hva du skal gjøre (dom-linja) → hvorfor (grunnen).
     Svaret og dom-linja lages én gang og oppdateres siden. Dom-linja er det
     eneste som leses opp av seg selv (aria-live), og et levende område som
     byttes ut ved hvert svar, blir ikke lest opp. Grunnen og kjeden er
     vanlig innhold. */
  function byggUtfall(modell, ut, vert) {
    var aktiv = finnUtfall(modell, ut.utfall);
    var net = vert.querySelector('.ks-r-net');
    var mnd = vert.querySelector('.ks-r-mnd');
    if (!net || !mnd) {
      vert.innerHTML = '';
      net = document.createElement('div');
      net.className = 'ks-r-net';
      mnd = document.createElement('p');
      mnd.className = 'ks-r-mnd';
      mnd.setAttribute('aria-live', 'polite');
      mnd.setAttribute('aria-atomic', 'true');
      vert.appendChild(net);
      vert.appendChild(mnd);
    }
    net.textContent = aktiv ? aktiv.navn : '–';
    mnd.textContent = aktiv ? aktiv.hva : (ut.venter || 'Svar på spørsmålene for å se utfallet.');

    var g = vert.querySelector('.bok-grunn');
    if (aktiv && ut.grunn) {
      if (!g) {
        g = document.createElement('p');
        g.className = 'bok-grunn';
        vert.appendChild(g);
      }
      g.textContent = ut.grunn;
    } else if (g) {
      vert.removeChild(g);
    }
    return aktiv;
  }

  /* «Slik kom svaret fram» er type 2 sitt regnestykke linje for linje:
     brukerens egne svar i rekkefølge, med følgen av hvert. Svaret som
     avgjorde får «Avgjorde.». Når alle svarene sammen avgjorde (avgjortAv
     er en tekst som «1–4», ikke ett tall), får alle radene «Oppfylt.» — da
     sier kjeden det samme som heroen. Mens brukeren fortsatt svarer, er
     utfall null, og ingen rad merkes. Blokka er skjult til første svar.     */
  function byggKjede(ut, vert) {
    var kjede = ut.kjede || [];
    var blokk = el('bokKjedeBlokk');
    vert.innerHTML = '';
    if (blokk) blokk.hidden = !kjede.length;
    if (!kjede.length) return;
    var samlet = !!ut.utfall && typeof ut.avgjortAv === 'string';
    kjede.forEach(function (k, i) {
      var merk = samlet || !!k.avgjorde;
      var li = document.createElement('li');
      li.className = 'ks-r-stat bok-kj' + (merk ? ' er-avgjorende' : '');
      var l = document.createElement('span'); l.className = 'l'; l.textContent = (i + 1) + '. ' + k.sporsmal;
      var v = document.createElement('span'); v.className = 'v'; v.textContent = k.svar;
      var fo = document.createElement('span'); fo.className = 'bok-kj-fo';
      if (merk) {
        var s = document.createElement('strong');
        s.textContent = samlet ? 'Oppfylt.' : 'Avgjorde.';
        fo.appendChild(s);
        fo.appendChild(document.createTextNode(' '));
      }
      fo.appendChild(document.createTextNode(k.folge));
      li.appendChild(l); li.appendChild(v); li.appendChild(fo);
      vert.appendChild(li);
    });
  }

  function monterType2(modell) {
    var vertFelt = el('bokFelt');
    var vertUtfall = el('bokUtfall');
    if (!vertFelt || !vertUtfall) return;
    var vertKjede = el('bokKjede');
    var vertStripe = el('bokStrip');
    var nokkel = 'hv-bok-' + modell.id;
    if (vertStripe) byggStripe(modell, vertStripe);

    function oppdater() {
      var v = lesFelt(modell);
      var ut = modell.regn(v);
      var aktiv = byggUtfall(modell, ut, vertUtfall);
      if (vertStripe) markerStripe(vertStripe, aktiv ? aktiv.id : null);
      if (vertKjede) byggKjede(ut, vertKjede);
      sett('hStatUtfall', aktiv ? (aktiv.kort || aktiv.navn) : '–');
      sett('hStatAvgjort', (aktiv && ut.avgjortAv) ? 'Svar ' + ut.avgjortAv : '–');
      lagreSesjon(nokkel, v);
    }

    byggFelt(modell, vertFelt, oppdater);
    gjenopprett(modell, hentSesjon(nokkel));
    oppdater();
  }

  /* ── Registrering og montering ───────────────────────────────────────── */
  BOK.register = function (modell) {
    /* Typesperre, validering 1: et rent skjønnsspørsmål kan ikke ha
       inndatafelt. Bryter modellen kontrakten, skal det smelle med én gang
       og ikke stille produsere et svar som ser ut som et regnestykke. */
    if (modell.type === 3 && modell.felt && modell.felt.length) {
      throw new Error('BOK: modell "' + modell.id + '" er type 3 (rent skjønn) og kan ikke ha inndatafelt. Fant ' + modell.felt.length + '.');
    }

    /* Typesperre, validering 2 i lett form: et strukturert skjønnsspørsmål
       kan ikke produsere bilag. Den fulle kontrollen — at ingen bilagstabell
       rendres — kommer med bilagsrendereren i fase 3. */
    if (modell.type === 2 && typeof modell.bilag === 'function') {
      throw new Error('BOK: modell "' + modell.id + '" er type 2 (strukturert skjønn) og kan ikke ha en bilag-funksjon.');
    }
    if (modell.type === 2) {
      monterType2(modell);
      return;
    }

    var vertFelt = el('bokFelt');
    var vertSteg = el('bokSteg');
    if (!vertFelt || !vertSteg) return;
    var vertDom = el('bokDom');
    var vertAarsaker = el('bokAarsaker');
    var vertMerknad = el('bokMerknad');
    var boksSteg = el('regnestykket');
    var beviser = el('beviser-ikke');

    var k = hentKonstanter(modell.konstanter);
    var varsel = satsvarsel(k);

    var vVarsel = el('bokSatsvarsel');
    if (vVarsel) visSatsvarsel(vVarsel, varsel.grupper);
    if (varsel.eldsteKontroll) sett('bokKontrollert', datoTekst(varsel.eldsteKontroll));

    var lagerNokkel = 'hv-bok-' + modell.id;
    var seksjoner = [];

    function lagre(v) { lagreSesjon(lagerNokkel, v); }

    /* Alle elementer med data-bok="<nøkkel>" får samme tekst: hero, stripe
       og svarkort viser de samme tallene uten at motoren kjenner id-ene. */
    function fyll(nokkel, tekst) {
      document.querySelectorAll('[data-bok="' + nokkel + '"]').forEach(function (e) { e.textContent = tekst; });
    }

    /* Toggle-teksten sier fra når skjulte felt er i bruk, og noten regnes med
       gjeldende tall — også før brukeren har skrevet noe. */
    function oppdaterSeksjoner(v) {
      seksjoner.forEach(function (sek) {
        if (!sek.knapp) return;
        var n = sek.avanserte.filter(function (fe) { return erEndret(fe, v[fe.id]); }).length;
        var lukket = !sek.samme.classList.contains('open');
        sek.knapp.textContent = sek.gruppe.toggle + (lukket && n ? ' · ' + n + ' i bruk' : '');
        if (sek.noteTekst) sek.noteTekst.textContent = sek.gruppe.note(v, k, f);
      });
    }

    function visDom(avvik, v) {
      if (!vertDom) return;
      var a = Math.abs(avvik);
      vertDom.textContent = modell.dom ? modell.dom(avvik, v, f)
        : (avvik === 0 ? '' : a <= 1
          ? 'Avviket er på én krone eller mindre. Det er trolig avrunding, men beløpet blir stående — det skal ikke rundes bort.'
          : 'Avviket er ikke null.');
      /* Bremsen står der den trengs: ved 0 kr lenker dom-linja til boksen
         om hva en avstemming i null ikke beviser. Samme tekst som summary. */
      if (avvik === 0 && beviser) {
        var sum = beviser.querySelector('summary');
        var lenke = document.createElement('a');
        lenke.href = '#beviser-ikke';
        lenke.textContent = sum ? sum.textContent : 'Hva beviser 0 kr i avvik?';
        vertDom.appendChild(document.createTextNode(' '));
        vertDom.appendChild(lenke);
      }
    }

    function visAarsaker(avvik, v) {
      if (!vertAarsaker) return;
      var liste = (Math.abs(avvik) > 1 && modell.forklarAvvik) ? modell.forklarAvvik(avvik, v, k, f) : [];
      vertAarsaker.textContent = '';
      vertAarsaker.hidden = !liste.length;
      if (!liste.length) return;
      var t = document.createElement('p');
      t.className = 'bok-aarsaker-t';
      t.textContent = 'Mulige årsaker, vanligste først';
      var ol = document.createElement('ol');
      liste.forEach(function (a) {
        var li = document.createElement('li');
        var s = document.createElement('strong');
        s.textContent = a.tittel;
        li.appendChild(s);
        li.appendChild(document.createTextNode(' ' + a.tekst));
        ol.appendChild(li);
      });
      vertAarsaker.appendChild(t);
      vertAarsaker.appendChild(ol);
    }

    function regnUt() {
      var v = lesFelt(modell);
      oppdaterSeksjoner(v);

      /* Tom tilstand. Uten denne viser en urørt side «Uforklart avvik: 0 kr»,
         og null leses som at avstemmingen går opp. En side som påstår at den
         stemmer før brukeren har lagt inn noe, er verre enn ingen side. */
      var harTall = modell.felt.some(function (fe) {
        return fe.type === 'kr' && v[fe.id] !== 0;
      });
      if (!harTall) {
        ['forventet', 'beregnet', 'bokfort', 'avvik', 'etr'].forEach(function (n) { fyll(n, '–'); });
        if (vertDom) vertDom.textContent = modell.tomtekst || 'Legg inn tallene dine over. Avstemmingen regnes ut mens du skriver.';
        if (vertAarsaker) vertAarsaker.hidden = true;
        if (vertMerknad) vertMerknad.hidden = true;
        if (boksSteg) boksSteg.hidden = true;
        vertSteg.innerHTML = '';
        lagre(v);
        return;
      }

      var ut = modell.regn(v, k, f);

      if (boksSteg) boksSteg.hidden = false;
      byggSteg(ut.steg, vertSteg);

      /* Avrundet til hele øre, så dom og årsaker ikke snubler i
         flyttallsrester som 0,00000001 kr. */
      var avvik = Math.round((ut.avstemming.faktisk - ut.avstemming.forventet) * 100) / 100;
      if (avvik === 0) avvik = 0;
      fyll('forventet', kr(ut.steg[0].verdi));
      fyll('beregnet', kr(ut.avstemming.forventet));
      fyll('bokfort', kr(ut.avstemming.faktisk));
      fyll('avvik', kr(avvik));

      var merknad = null;
      (ut.noekkeltall || []).forEach(function (n) {
        if (n.id === 'etr' || n.etikett.indexOf('ETR') > -1) {
          fyll('etr', (n.verdi === null || n.verdi === undefined) ? '–' : pst(n.verdi));
        }
        if (n.merknad) merknad = n.merknad;
      });
      if (vertMerknad) {
        vertMerknad.textContent = merknad || '';
        vertMerknad.hidden = !merknad;
      }

      visDom(avvik, v);
      visAarsaker(avvik, v);
      lagre(v);
    }

    /* Lenken i dom-linja åpner boksen før nettleseren ruller dit. */
    if (vertDom && beviser) {
      vertDom.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('a[href="#beviser-ikke"]')) beviser.open = true;
      });
    }

    seksjoner = byggFelt(modell, vertFelt, regnUt);
    var lagret = hentSesjon(lagerNokkel);
    gjenopprett(modell, lagret);
    if (lagret) {
      var v0 = lesFelt(modell);
      seksjoner.forEach(function (sek) {
        if (sek.knapp && sek.avanserte.some(function (fe) { return erEndret(fe, v0[fe.id]); })) apne(sek, true);
      });
    }
    regnUt();
  };

  BOK._f = f;
  BOK._parseNum = parseNum;
})();
