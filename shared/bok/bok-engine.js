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
      .format(r).replace(/ /g, ' ') + ' kr';
  }
  function pst(andel) {
    if (andel === null || andel === undefined || !isFinite(andel)) return '–';
    var p = andel * 100;
    var s = (Math.round(p * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
    return s.replace('.', ',') + ' %';
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

  function satsvarsel(k) {
    var na = idag(), varsler = [], eldste = null;
    Object.keys(k._meta).forEach(function (n) {
      var m = k._meta[n];
      if (!eldste || m.kontrollert < eldste) eldste = m.kontrollert;
      if (m.utloper && m.utloper <= na) {
        varsler.push(m.navn + ' (' + m.visning + ') hadde utløpsdato ' + m.utloper +
          ' og er ikke rekontrollert. Kontroller den mot ' + m.kilde + ' før du bruker tallet.');
      }
    });
    return { varsler: varsler, eldsteKontroll: eldste };
  }

  /* ── Feltrenderer ────────────────────────────────────────────────────── */
  function leggTilHjelp(rad, fe) {
    if (fe.hjelp) {
      var h = document.createElement('span');
      h.className = 'hint-line';
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
  }

  /* Felttypen «knapper»: en radiogruppe i et fieldset. Brukes ALLTID der en
     terskel avgjør utfallet, fordi en terskel er en bryter og ikke en
     glideskala — 45 % gir ingen avsetning, uansett hvor stort beløpet er.
     Radioknappen er usynlig, men ligger over knappeflaten og blir værende i
     DOM-en, så tastatur (piltaster) og skjermleser virker som normalt.     */
  function byggKnapper(fe, veduendring) {
    var fs = document.createElement('fieldset');
    fs.className = 'fg full bok-fg-knapper';
    fs.id = 'bf-' + fe.id;

    var lg = document.createElement('legend');
    lg.textContent = fe.etikett;
    fs.appendChild(lg);

    var gruppe = document.createElement('div');
    gruppe.className = 'bok-knapper';
    fe.valg.forEach(function (v) {
      var lbl = document.createElement('label');
      lbl.className = 'bok-knapp';
      var inn = document.createElement('input');
      inn.type = 'radio';
      inn.name = 'bf-' + fe.id;
      inn.value = String(v.verdi);
      if (fe.start !== undefined && String(v.verdi) === String(fe.start)) inn.checked = true;
      inn.addEventListener('change', veduendring);
      var tekst = document.createElement('span');
      tekst.textContent = v.etikett;
      lbl.appendChild(inn);
      lbl.appendChild(tekst);
      gruppe.appendChild(lbl);
    });
    fs.appendChild(gruppe);

    leggTilHjelp(fs, fe);
    return fs;
  }

  function byggFelt(modell, vert, veduendring) {
    vert.innerHTML = '';
    modell.felt.forEach(function (fe) {
      if (fe.type === 'knapper') {
        vert.appendChild(byggKnapper(fe, veduendring));
        return;
      }
      var rad = document.createElement('div');
      rad.className = 'fg' + (fe.bredt ? ' full' : '');

      var lbl = document.createElement('label');
      lbl.className = 'flbl';
      lbl.setAttribute('for', 'bf-' + fe.id);
      lbl.textContent = fe.etikett;
      rad.appendChild(lbl);

      var inn;
      if (fe.type === 'avkrysning') {
        rad.className += ' bok-fg-kryss';
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
      rad.appendChild(inn);

      leggTilHjelp(rad, fe);
      vert.appendChild(rad);
    });
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
     tall satt inn, og resultat. Aldri bokstavformelen.                      */
  function byggSteg(steg, vert) {
    vert.innerHTML = '';
    steg.forEach(function (s) {
      var r = document.createElement('div');
      r.className = 'bok-steg-rad' + (s.sum ? ' er-sum' : '');
      var a = document.createElement('span'); a.className = 'bs-lbl'; a.textContent = s.etikett;
      var b = document.createElement('span'); b.className = 'bs-utt'; b.textContent = s.uttrykk;
      var c = document.createElement('span'); c.className = 'bs-val'; c.textContent = kr(s.verdi);
      r.appendChild(a); r.appendChild(b); r.appendChild(c);
      vert.appendChild(r);
    });
  }

  /* ── Avstemmingsskallet ──────────────────────────────────────────────────
     Gjenbrukes av J15, I14, K12 og A13 senere. Viser et BELØP, ikke en dom:
     ingen grønn hake, ingen godkjent-tilstand. En avstemming som går i null
     beviser at postene henger sammen — ikke at beregningen er riktig.       */
  function byggAvstemming(a, vert) {
    var avvik = a.faktisk - a.forventet;
    var avrunding = Math.abs(avvik) > 0 && Math.abs(avvik) <= 1;
    vert.innerHTML = '';

    function rad(lbl, val, klasse) {
      var r = document.createElement('div');
      r.className = 'bok-avst-rad' + (klasse ? ' ' + klasse : '');
      var a1 = document.createElement('span'); a1.className = 'l'; a1.textContent = lbl;
      var a2 = document.createElement('span'); a2.className = 'v'; a2.textContent = kr(val);
      r.appendChild(a1); r.appendChild(a2);
      vert.appendChild(r);
    }
    rad(a.forventetNavn, a.forventet);
    rad(a.faktiskNavn, a.faktisk);
    rad('Uforklart avvik (skal være 0)', avvik, 'er-krav');

    if (avvik !== 0) {
      var d = document.createElement('div');
      d.className = 'bok-avst-hjelp';
      d.innerHTML = avrunding
        ? '<strong>Avviket er på én krone eller mindre.</strong> Det er trolig avrunding, men beløpet blir stående — det skal ikke rundes bort.'
        : '<strong>Avviket er ikke null.</strong> Det er som regel én av fire ting, i denne rekkefølgen:'
          + '<ol><li>En permanent forskjell mangler i oppstillingen. Avviket er da typisk satsen ganget med et beløp du kjenner igjen.</li>'
          + '<li>En midlertidig forskjell er lagt inn ved en feil. Den hører i utsatt skatt, ikke her.</li>'
          + '<li>Et av feltene som allerede er et skattebeløp er lagt inn som grunnlag. Avviket er da rundt 4,5 ganger for stort, eller rundt 0,22 ganger.</li>'
          + '<li>Feil fortegn på ett felt. Avviket er da nøyaktig to ganger beløpet — del avviket på to og let etter det tallet.</li></ol>';
      vert.appendChild(d);
    }
    return avvik;
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

  /* ── Utfallspanelet (type 2) ─────────────────────────────────────────────
     Et skjønnsspørsmål har ingen fasit å regne mot. Panelet viser derfor
     ALLE utfall samtidig, markerer det brukerens egne svar peker på, og sier
     hvilket svar som avgjorde. Konklusjonen står alltid som brukerens
     forutsetning — «Dine forutsetninger gir …» — aldri som modellens dom.
     Alt settes med textContent: ingen modelltekst tolkes som HTML.          */
  function finnUtfall(modell, id) {
    for (var i = 0; i < modell.utfall.length; i++) {
      if (modell.utfall[i].id === id) return modell.utfall[i];
    }
    return null;
  }

  function byggUtfall(modell, ut, vert) {
    var aktiv = finnUtfall(modell, ut.utfall);
    vert.innerHTML = '';

    var konk = document.createElement('p');
    konk.className = 'bok-konklusjon';
    if (aktiv) {
      konk.appendChild(document.createTextNode('Dine forutsetninger gir: '));
      var s = document.createElement('strong');
      s.textContent = aktiv.navn;
      konk.appendChild(s);
    } else {
      konk.textContent = ut.venter || 'Svar på spørsmålene, så markeres utfallet ditt her.';
    }
    vert.appendChild(konk);

    if (aktiv && ut.grunn) {
      var g = document.createElement('p');
      g.className = 'bok-grunn';
      g.textContent = ut.grunn;
      vert.appendChild(g);
    }

    var liste = document.createElement('ol');
    liste.className = 'bok-utfall-liste';
    modell.utfall.forEach(function (u) {
      var erAktiv = !!aktiv && u.id === aktiv.id;
      var li = document.createElement('li');
      li.className = 'bok-utfall-rad' + (erAktiv ? ' er-aktiv' : '');
      li.setAttribute('data-utfall', u.id);
      if (erAktiv) li.setAttribute('aria-current', 'true');
      var nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = u.navn;
      if (erAktiv) {
        var merke = document.createElement('span');
        merke.className = 'bok-merke';
        merke.textContent = 'Ditt utfall';
        nm.appendChild(merke);
      }
      var hva = document.createElement('span');
      hva.className = 'hva';
      hva.textContent = u.hva;
      li.appendChild(nm);
      li.appendChild(hva);
      liste.appendChild(li);
    });
    vert.appendChild(liste);
    return aktiv;
  }

  /* «Slik kom svaret fram» er type 2 sitt regnestykke linje for linje:
     brukerens egne svar i rekkefølge, med følgen av hvert, og svaret som
     avgjorde markert.                                                       */
  function byggKjede(kjede, vert) {
    vert.innerHTML = '';
    if (!kjede || !kjede.length) {
      var t = document.createElement('div');
      t.className = 'bok-avst-hjelp';
      t.textContent = 'Svarene dine settes inn her, ett spørsmål om gangen, med hva hvert svar betyr.';
      vert.appendChild(t);
      return;
    }
    var ol = document.createElement('ol');
    ol.className = 'bok-kjede';
    kjede.forEach(function (k) {
      var li = document.createElement('li');
      if (k.avgjorde) li.className = 'er-avgjorende';
      var sp = document.createElement('span'); sp.className = 'kj-sp'; sp.textContent = k.sporsmal;
      var sv = document.createElement('span'); sv.className = 'kj-sv'; sv.textContent = k.svar;
      var fo = document.createElement('span'); fo.className = 'kj-fo'; fo.textContent = k.folge;
      li.appendChild(sp); li.appendChild(sv); li.appendChild(fo);
      ol.appendChild(li);
    });
    vert.appendChild(ol);
  }

  function monterType2(modell) {
    var vertFelt = el('bokFelt');
    var vertUtfall = el('bokUtfall');
    if (!vertFelt || !vertUtfall) return;
    var vertKjede = el('bokKjede');
    var nokkel = 'hv-bok-' + modell.id;

    function oppdater() {
      var v = lesFelt(modell);
      var ut = modell.regn(v);
      var aktiv = byggUtfall(modell, ut, vertUtfall);
      if (vertKjede) byggKjede(ut.kjede, vertKjede);
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
    var vertAvst = el('bokAvstemming');
    if (!vertFelt || !vertSteg || !vertAvst) return;

    var k = hentKonstanter(modell.konstanter);
    var varsel = satsvarsel(k);

    var vVarsel = el('bokSatsvarsel');
    if (vVarsel) {
      if (varsel.varsler.length) {
        vVarsel.innerHTML = '<strong>Satsvarsel.</strong> ' + varsel.varsler.join(' ');
        vVarsel.hidden = false;
      } else {
        vVarsel.hidden = true;
      }
    }
    if (varsel.eldsteKontroll) sett('bokKontrollert', varsel.eldsteKontroll);

    var lagerNokkel = 'hv-bok-' + modell.id;

    function lagre(v) { lagreSesjon(lagerNokkel, v); }

    function regnUt() {
      var v = lesFelt(modell);

      /* Tom tilstand. Uten denne viser en urørt side «Uforklart avvik: 0 kr»,
         og null leses som at avstemmingen går opp. En side som påstår at den
         stemmer før brukeren har lagt inn noe, er verre enn ingen side. */
      var harTall = modell.felt.some(function (fe) {
        return fe.type === 'kr' && v[fe.id] !== 0;
      });
      if (!harTall) {
        var start = 'Legg inn tallene dine over. Avstemmingen regnes ut mens du skriver.';
        vertSteg.innerHTML = '<div class="bok-avst-hjelp">' + start + '</div>';
        vertAvst.innerHTML = '<div class="bok-avst-hjelp">' + start + '</div>';
        var vN0 = el('bokNokkeltall');
        if (vN0) vN0.innerHTML = '';
        sett('hStatDiff', '–');
        sett('hStatEtr', '–');
        lagre(v);
        return;
      }

      var ut = modell.regn(v, k, f);

      byggSteg(ut.steg, vertSteg);
      var avvik = byggAvstemming(ut.avstemming, vertAvst);

      sett('hStatDiff', kr(avvik));

      var vNokkel = el('bokNokkeltall');
      if (vNokkel) {
        vNokkel.innerHTML = '';
        (ut.noekkeltall || []).forEach(function (n) {
          var r = document.createElement('div');
          r.className = 'bok-avst-rad';
          var a1 = document.createElement('span'); a1.className = 'l'; a1.textContent = n.etikett;
          var a2 = document.createElement('span'); a2.className = 'v';
          a2.textContent = (n.verdi === null || n.verdi === undefined) ? '–'
            : (n.format === 'pst' ? pst(n.verdi) : kr(n.verdi));
          r.appendChild(a1); r.appendChild(a2);
          vNokkel.appendChild(r);
          if (n.etikett.indexOf('ETR') > -1) sett('hStatEtr', a2.textContent);
          if (n.merknad) {
            var m = document.createElement('div');
            m.className = 'bok-avst-hjelp';
            m.textContent = n.merknad;
            vNokkel.appendChild(m);
          }
        });
      }
      lagre(v);
    }

    byggFelt(modell, vertFelt, regnUt);
    gjenopprett(modell, hentSesjon(lagerNokkel));
    regnUt();
  };

  BOK._f = f;
  BOK._parseNum = parseNum;
})();
