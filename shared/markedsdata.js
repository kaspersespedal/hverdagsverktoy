/* shared/markedsdata.js — LIVE MARKEDSDATA-panel for forsiden (kun index.html).
   Henter ekte data klient-side fra åpne, gratis kilder som tillater kommersiell bruk:
     • Vær ........... MET Norway Locationforecast 2.0   (CC BY 4.0 — attribusjon påkrevd)
     • Valuta + rente. Norges Bank åpne data (EXR / IR)  (gjenbruk med kildehenvisning)
     • Strøm ......... hvakosterstrømmen.no               (fritt tilgjengelig, NO1–NO5)
     • Stedssøk ...... Kartverket Geonorge stedsnavn      (CC BY 4.0 — © Kartverket)
     • Drivstoff, prisvekst, boliglånsrente . SSB PxWebApi v2 (CC BY 4.0 — «Kilde: SSB»)
     • Dagslys ....... regnes ut på siden (ingen kilde)
   Alt caches i localStorage og degraderer pent til forrige/HTML-verdi ved feil — panelet
   viser aldri blankt. Ingen API-nøkler, ingen server. Full kilde/juss-analyse:
   auto-minne project-markedsdata-live-research. */
(function () {
  'use strict';

  var frame = document.querySelector('.daily-frame');
  if (!frame) return;

  /* Siste valutadata fra Norges Bank + valutaen brukeren har valgt.
     Valutakortet og omregner-stripa deler ett valg — se VALUTAVALG under. */
  var _fx = null, _fxCode = 'USD';

  /* Siste strømdata — leses av scrub-chipen på søylediagrammet. */
  var _strom = null;

  /* Render-signaturer: minutt-pulsen re-rendrer fra cache hvert 60. sekund,
     men DOM som bærer animasjon (søylediagram, værgraf) skal kun bygges om
     når innholdet faktisk er endret — ellers restarter animasjonen synlig. */
  var _stromSig = '', _fcSig = '', _weekSig = '';

  /* _lastWx holder siste rendrede vær-data (fullskjermgrafen leser timeserien
     herfra), _wxFail sier om siste værhenting feilet (gir feilmelding i grafen). */
  var _lastWx = null, _wxFail = false;

  /* ── Strømsone-kart (NVE/Statnett prisområder). Slås opp fra Geonorge-treffets
     kommunenummer, med fylke som fallback. Oppslag:
     KOMMUNE_SONE[kommunenr] || FYLKE_SONE[fylkesnr] || 'NO1'.
     KOMMUNE_SONE fylles med presise unntak (splittede fylker) — se merge nederst. */
  /* Datagrunnlag: VG elspot-API (kommunenr→sone, 367 oppføringer), kryssjekket mot
     strompriser.no, hvakosterstrommen.no (Haugesund=NO2), NRK/Ren Røros (Røros=NO1)
     og NVE elspot-temakart. Kommunestruktur 2024 (Kartverket). Verifisert 2026-06-27.
     Fysisk delte kommuner settes til sonen der adm.senteret/befolkningen ligger. */
  var FYLKE_SONE = {
    '03': 'NO1', // Oslo
    '11': 'NO2', // Rogaland (hele fylket NO2, inkl. Haugesund/Haugalandet)
    '15': 'NO3', // Møre og Romsdal
    '18': 'NO4', // Nordland (hele fylket NO4, inkl. Helgeland)
    '31': 'NO1', // Østfold
    '32': 'NO1', // Akershus
    '33': 'NO1', // Buskerud
    '34': 'NO1', // Innlandet
    '39': 'NO2', // Vestfold
    '40': 'NO2', // Telemark
    '42': 'NO2', // Agder
    '46': 'NO5', // Vestland
    '50': 'NO3', // Trøndelag
    '55': 'NO4', // Troms
    '56': 'NO4'  // Finnmark
  };
  var KOMMUNE_SONE = {
    // Buskerud (NO1) → Hallingdal + Numedal-toppen er NO5
    '3320': 'NO5', '3322': 'NO5', '3324': 'NO5', '3326': 'NO5', '3328': 'NO5', '3330': 'NO5', '3338': 'NO5',
    // Innlandet (NO1) → Nord-Gudbrandsdalen er NO3
    '3431': 'NO3', '3432': 'NO3', '3433': 'NO3', '3434': 'NO3', '3435': 'NO3', '3437': 'NO3',
    // Vestland (NO5) → Sunnhordland/sør-Hardanger er NO2
    '4611': 'NO2', '4612': 'NO2', '4613': 'NO2', '4614': 'NO2', '4615': 'NO2', '4616': 'NO2',
    '4617': 'NO2', '4618': 'NO2', '4625': 'NO2',
    // Vestland (NO5) → gamle Sogn og Fjordane-kysten er NO3
    '4602': 'NO3', '4636': 'NO3', '4637': 'NO3', '4638': 'NO3', '4645': 'NO3', '4646': 'NO3',
    '4647': 'NO3', '4648': 'NO3', '4649': 'NO3', '4650': 'NO3', '4651': 'NO3',
    // Trøndelag (NO3) → Røros sør er NO1, Indre Namdal nord er NO4
    '5025': 'NO1', '5042': 'NO4', '5043': 'NO4', '5044': 'NO4'
  };

  function soneFor(kommunenr, fylkesnr) {
    return (kommunenr && KOMMUNE_SONE[kommunenr]) ||
           (fylkesnr && FYLKE_SONE[fylkesnr]) || 'NO1';
  }

  var DEFAULT_PLACE = { navn: 'Oslo', lat: 59.9133, lon: 10.7389, kommunenr: '0301', fylkesnr: '03', sone: 'NO1' };

  /* Norges Banks rentemøter (rentebeslutning-datoer). Verifisert mot norges-bank.no
     2026-06-27 og 2026-11-19 (norges-bank.no/aktuelt/kalender/rentemoter/) — 8 møter/år.
     Når lista går tom, skjules «neste møte»-linja heller enn å vise en gal dato.
     Legg inn neste års datoer hver høst, når Norges Bank publiserer dem. */
  var NB_MEETINGS = ['2026-08-13', '2026-09-24', '2026-11-05', '2026-12-17',
    '2027-01-21', '2027-03-18', '2027-05-05', '2027-06-17', '2027-08-19', '2027-09-23', '2027-11-04', '2027-12-16'];
  function nextMeeting() {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    for (var i = 0; i < NB_MEETINGS.length; i++) {
      if (new Date(NB_MEETINGS[i] + 'T00:00:00') >= t) return NB_MEETINGS[i];
    }
    return null;
  }

  /* ── Småhjelpere ───────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function setText(id, t) { var el = $(id); if (el) el.textContent = t; }
  /* Språk: tekst fra språkfila via R() (core.js), med norsk som reserve. ph() slår opp et
     helt ord i frase-ordboka (_ph), fill() setter inn {navn}-verdiene i en mal. */
  function T(k, no) { try { var v = R()[k]; return v || no; } catch (e) { return no; } }
  function ph(s) { try { var d = R()._ph; return (d && d[s]) || s; } catch (e) { return s; } }
  function fill(s, o) { for (var k in o) s = s.split('{' + k + '}').join(o[k]); return s; }

  /* Tallformat følger språket: punktum som desimaltegn og komma som tusenskille på engelsk,
     kinesisk, somali og tigrinja; ellers komma og hardt mellomrom. */
  var DOT_LANG = { en: 1, zh: 1, so: 1, ti: 1 };
  function decSep() { return DOT_LANG[(document.documentElement.lang || '').slice(0, 2)] ? '.' : ','; }
  function nb(n, dec) {
    if (n == null || isNaN(n)) return '–';
    var s = Number(n).toFixed(dec == null ? 0 : dec), d = decSep();
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, d === '.' ? ',' : ' '); // tusenskille
    return p.join(d);
  }
  function compass(deg) {
    if (deg == null || isNaN(deg)) return '';
    return T('trSharedCompass', 'N,NØ,Ø,SØ,S,SV,V,NV').split(',')[Math.round(deg / 45) % 8];
  }
  var MND = ['jan.', 'feb.', 'mar.', 'apr.', 'mai', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'];
  function nbDate(iso) { // 'YYYY-MM-DD' -> '24. jun. 2026'
    if (!iso) return '';
    return nbShort(iso) + ' ' + iso.split('-')[0];
  }
  function nbShort(iso) { // 'YYYY-MM-DD' -> '24. jun.'
    if (!iso) return '';
    var p = iso.split('-');
    return fill(T('trSharedDateShort', '{d}. {m}'), { d: parseInt(p[2], 10),
      m: T('trSharedMonthsShort', MND.join(',')).split(',')[parseInt(p[1], 10) - 1] });
  }

  /* ── Cache (localStorage) ──────────────────────────────────── */
  function cacheGet(k) {
    try { var s = localStorage.getItem('hvmd_' + k); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  }
  function cacheSet(k, d) {
    try { localStorage.setItem('hvmd_' + k, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
  }
  function fresh(o, ttl) { return o && (Date.now() - o.t) < ttl; }

  /* ── Sparkline-bygger (200×88 viewBox) ─────────────────────────
     Høyden speiler .widget-spark{height:88px} 1:1, så kurven ikke
     strekkes vertikalt av preserveAspectRatio="none". Værgrafen er
     64 px høy: resten av de 88 går til raden med værsymboler over. */
  var SPARK_H = 88, WX_H = 64;
  /* Linjegrafene står på en hårstrek i bunnen, med et svakt, ensfarget felt opp til linja,
     så grafen har tyngde og ikke svever i kortet. Høyeste verdi ligger SPARK_PT under
     toppen og laveste SPARK_PB over bunnstreken, så feltet aldri blir helt borte. */
  var SPARK_PT = 6, SPARK_PB = 10;
  function sparkY(v, mn, mx) {
    return SPARK_PT + (1 - (v - mn) / ((mx - mn) || 1)) * (SPARK_H - SPARK_PT - SPARK_PB);
  }
  /* d = linja som sti, dot = punktet som merkes, mid = det som ligger mellom feltet og linja
     (stiplet linje, hårstreker, nedbør), H = høyden på grafen (værgrafen er lavere). */
  function sparkSvg(d, dot, mid, H) {
    H = H || SPARK_H;
    return '<path class="spark-area" d="' + d + ' L200,' + H + ' L0,' + H + ' Z"/>' + (mid || '') +
      '<line class="spark-floor" x1="0" y1="' + H + '" x2="200" y2="' + H + '"/>' +
      '<path class="spark-line" d="' + d + '"/>' + sparkDot(dot);
  }
  /* Stiplet linje på en bestemt verdi: målet for prisveksten, 12 timer dagslys, 0 grader. */
  function sparkRef(y) {
    return '<line class="spark-base" x1="0" y1="' + y.toFixed(1) + '" x2="200" y2="' + y.toFixed(1) + '"/>';
  }
  /* Rett strek fra punkt til punkt: dagskurser er enkeltmålinger, ingenting å glatte. */
  function linePath(pts) {
    return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
  }
  /* Som linePath, men løfter pennen der ok(i) er usann (måneder uten tall, mørketid). */
  function segPath(pts, ok) {
    var d = '', pen = false;
    for (var i = 0; i < pts.length; i++) {
      if (!ok(i)) { pen = false; continue; }
      d += (pen ? ' L' : ' M') + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1); pen = true;
    }
    return d.slice(1);
  }
  /* Punktet i en kortgraf («nå» / siste kurs): en nesten null-lang strek med rund ende.
     Da blir det en sirkel også når SVG-en strekkes ulikt i bredde og høyde.
     Ringen bak, i kortets bunnfarge, skiller punktet fra linja. */
  function sparkDot(p) {
    var d = 'M' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + 'h.01';
    return '<path class="spark-ring" d="' + d + '"/><path class="spark-dot" d="' + d + '"/>';
  }
  /* ref: en verdi som skal være med på skalaen og få stiplet linje (målet for prisveksten). */
  function applySpark(card, vals, ref, cmp) { // cmp: en stiplet linje til (nominell boliglånsrente)
    if (!card) return;
    var svg = card.querySelector('.widget-spark'); if (!svg) return;
    var clean = (vals || []).filter(function (v) { return typeof v === 'number' && !isNaN(v); }), n = clean.length;
    if (n < 2) return;
    if (cmp && cmp.length !== n) cmp = null;
    var all = (ref == null ? clean : clean.concat(ref)).concat(cmp || []);
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
    function P(a) { return a.map(function (v, i) { return [(i / (n - 1)) * 200, sparkY(v, mn, mx)]; }); }
    var pts = P(clean);
    svg.innerHTML = sparkSvg(linePath(pts), pts[n - 1], (ref == null ? '' : sparkRef(sparkY(ref, mn, mx))) +
      (cmp ? '<path class="spark-cmp" d="' + linePath(P(cmp)) + '"/>' : ''));
  }

  /* ── Scrub-chip: verdien under pekeren, festet til .widget-spark-wrap ──
     Kun peker-enheter — CSS skjuler chipen på @media(hover:none). */
  function bindScrub(svgId, chipId, txtId, read) {
    var svg = $(svgId), chip = $(chipId), txt = $(txtId);
    if (!svg || !chip || !txt) return;
    var wrap = chip.parentElement;
    svg.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = svg.getBoundingClientRect(); if (!r.width) return;
      var frac = Math.max(0, Math.min(0.9999, (e.clientX - r.left) / r.width));
      var html = read(frac);
      if (!html) { chip.classList.remove('on'); return; }
      txt.innerHTML = html;
      var wr = wrap.getBoundingClientRect();
      chip.style.left = (e.clientX - wr.left) + 'px';
      chip.style.top = (r.top - wr.top) + 'px';
      chip.classList.add('on');
    }, { passive: true });
    svg.addEventListener('pointerleave', function () { chip.classList.remove('on'); });
  }
  function trendClass(span, dir) { // dir: 1 up, -1 down, 0 flat
    if (!span) return;
    span.classList.remove('trend-up', 'trend-down', 'trend-flat');
    span.classList.add(dir > 0 ? 'trend-up' : dir < 0 ? 'trend-down' : 'trend-flat');
  }
  function arrowSvg(dir) {
    var d = dir > 0 ? 'M2,8 L8,2 M4,2 L8,2 L8,6' : dir < 0 ? 'M2,2 L8,8 M4,8 L8,8 L8,4' : 'M2,5 L8,5 M6,3 L8,5 L6,7';
    return '<svg class="trend-arrow" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  }

  /* Skriver tallet i et verdifelt. Settes direkte: opptellingen fra 82 % av
     verdien viste et feil tall i et drøyt sekund (4,39 % før 4,50 %) og tegnet
     feltet på nytt for hvert bilde mens siden lastet. */
  function setVal(id, target, dec) {
    var el = $(id);
    if (!el || typeof target !== 'number' || isNaN(target)) return;
    /* Desimalene settes i egen .dec-span: mindre grad, dempet farge — heltallet
       skal bære blikket. CSS-en (.widget-value .dec) har ligget der ubrukt. */
    var isValue = el.parentNode && el.parentNode.classList.contains('widget-value');
    var s = nb(target, dec);
    var i = dec ? s.lastIndexOf(decSep()) : -1;
    if (isValue && i > 0) el.innerHTML = esc(s.slice(0, i)) + '<span class="dec">' + esc(s.slice(i)) + '</span>';
    else el.textContent = s;
  }

  function stampNow() {
    var el = $('dailyStampTxt'); if (!el) return;
    el.innerHTML = stampHtml();
  }

  /* «Sist oppdatert» i egen span: på mobil skjules den visuelt (men leses opp),
     så headeren får plass til en kompakt status-pille med bare klokkeslettet. */
  function stampHtml() {
    /* _got[kort] = når tallene på kortet faktisk ble hentet. Er de eldre enn _STALE[kort]
       (henting feiler, eller nettet er nede), viser stempelet det eldste hentetidspunktet
       med dato i stedet for klokka nå. */
    var d = new Date(), old = 0;
    for (var k in _got) if (_got[k] && Date.now() - _got[k] > _STALE[k] && (!old || _got[k] < old)) old = _got[k];
    if (old) {
      var o = new Date(old);
      return '<span class="stamp-pre">Sist hentet </span>' + pad2(o.getDate()) + '.' + pad2(o.getMonth() + 1) + '. ' + pad2(o.getHours()) + ':' + pad2(o.getMinutes());
    }
    return '<span class="stamp-pre">Sist oppdatert </span>' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  var _got = {}, _STALE = { wx: 2 * 36e5, fx: 26 * 36e5, sr: 26 * 36e5 };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* Faktaradene under tallet i et kort: [[nøkkel, verdi], …] — nøkkel til venstre, verdi til høyre. */
  function setFacts(id, rows) {
    var el = $(id); if (!el) return;
    el.innerHTML = rows.map(function (r) {
      return '<div class="wf"><span class="wf-k">' + esc(r[0]) + '</span><span class="wf-v">' + esc(r[1]) + '</span></div>';
    }).join('');
  }

  /* ════════════════════════ VALUTAVALG ════════════════════════════════
     Valutakortet viste før alltid USD, og under panelet rullet en stripe
     som gjentok de samme kursene. Nå velger brukeren selv valuta, og
     stripa er blitt en omregner (under). Valget deles av begge og lagres. */
  var FX_CODES = ['USD', 'EUR', 'GBP', 'SEK', 'DKK', 'CHF', 'JPY', 'PLN'];

  function getFxCode() {
    var o = cacheGet('fxcode');
    return (o && FX_CODES.indexOf(o.d) >= 0) ? o.d : 'USD';
  }
  function setFxCode(code) {
    if (FX_CODES.indexOf(code) < 0 || code === _fxCode) return;
    _fxCode = code;
    cacheSet('fxcode', code);
    if (_fx) renderFx(_fx);
    renderConv();
  }

  /* Nedtrekksmeny med de åtte valutaene og dagens kurs. Samme meny brukes av
     kortets etikett og av omregnerens valuta-brikke — begge setter _fxCode,
     så de to står alltid på samme valuta. Kursen står i menyen i stedet for
     valutanavnet: det er mer nyttig, og trenger ingen oversettelse. */
  function buildCurMenu(btn, anchor) {
    if (!btn || !anchor) return;
    var menu = document.createElement('ul');
    menu.className = 'fx-menu'; menu.hidden = true;
    menu.setAttribute('role', 'listbox');
    FX_CODES.forEach(function (code) {
      var li = document.createElement('li');
      li.className = 'fx-opt'; li.setAttribute('role', 'option'); li.tabIndex = 0;
      li.innerHTML = '<b>' + code + '</b><small></small>';
      function pick() { setFxCode(code); close(); btn.focus(); }
      li.addEventListener('click', pick);
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      menu.appendChild(li);
    });
    anchor.appendChild(menu);

    function open() {
      for (var i = 0; i < FX_CODES.length; i++) {
        var code = FX_CODES[i], li = menu.children[i], c = _fx && _fx[code];
        li.classList.toggle('on', code === _fxCode);
        li.setAttribute('aria-selected', code === _fxCode ? 'true' : 'false');
        /* Noteringsenheten hører til koden («100 SEK»), kursen står for seg. */
        li.querySelector('b').textContent = c ? fxUnit(c, code) : code;
        li.querySelector('small').textContent = c ? fxQuote(c) + ' kr' : '';
      }
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      /* Omregneren: menyen står over valuta-ruta (høyrekant mot høyrekant), ikke helt til venstre i stripa. */
      if (anchor.id === 'fxConv') {
        menu.style.left = Math.max(12, btn.offsetLeft + btn.offsetWidth - menu.offsetWidth) + 'px';
      }
    }
    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); menu.hidden ? open() : close(); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !anchor.contains(e.target)) close(); });
    menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
  }

  /* ══════════════════════ VALUTAOMREGNER ══════════════════════════════
     Stripa nederst i panelet. Regner mellom valgt valuta og kroner på
     kursene som allerede er hentet — ingen ekstra nettverkskall.
     Retningen snus med byttekapp-knappen og huskes. */
  var _convDir = 1;              // 1: valuta → NOK, −1: NOK → valuta
  var _convPick = null, _convNok = null;

  /* Skjemafeltet tar «1 234,5», «1234.5» og «1.000». Tomt/ugyldig gir null. */
  function parseAmt(s) {
    var t = String(s == null ? '' : s).replace(/[\s ]/g, '');
    // Punktum er tusenskille når det står komma i tallet eller bare grupper på tre sifre følger («1.000», «1.000,50»).
    if (t.indexOf(',') > -1 || /^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    t = t.replace(',', '.');
    if (!/^\d*\.?\d*$/.test(t)) return null;
    var n = parseFloat(t);
    return isNaN(n) ? null : n;
  }

  /* Brikken som kan klikkes står alltid på valuta-siden; NOK-siden er ren
     tekst. Ved retningsbytte flyttes de to nodene mellom feltene. */
  function applyConvDir() {
    var a = $('fxcSlotA'), b = $('fxcSlotB');
    if (!a || !b || !_convPick || !_convNok) return;
    a.appendChild(_convDir > 0 ? _convPick : _convNok);
    b.appendChild(_convDir > 0 ? _convNok : _convPick);
    $('fxConv').classList.toggle('rev', _convDir < 0); // pilene på bytteknappen tar en halv omdreining
  }

  function renderConv() {
    var out = $('fxcOut'); if (!out) return;
    setText('fxcCode', _fxCode);
    var c = _fx && _fx[_fxCode], amt = parseAmt($('fxcAmt') && $('fxcAmt').value);
    if (!c || c.last == null) { out.textContent = '—'; setText('fxcRate', ''); return; }
    var cd = c.dates && c.dates[c.dates.length - 1], rate = $('fxcRate');
    /* Kursen og datoen i hver sin span: datoen står på egen linje under kursen (index.html, .fxc-rate-d). */
    if (rate) rate.innerHTML = '<span>' + esc('1 ' + _fxCode + ' = ' + nb(c.last, 4) + ' kr') + '</span>' +
      (cd && cd !== isoDay(new Date()) ? '<span class="fxc-rate-d">' + esc(nbShort(cd)) + '</span>' : '');
    out.textContent = (amt == null) ? '—' : nb(_convDir > 0 ? amt * c.last : amt / c.last, 2);
  }

  function buildConverter() {
    var root = $('fxConv'), pick = $('fxcPick'), nok = $('fxcNok'), amt = $('fxcAmt'), swap = $('fxcSwap');
    if (!root || !pick || !nok || !amt || !swap) return;
    _convPick = pick; _convNok = nok;
    var o = cacheGet('fxdir'); if (o && o.d === -1) _convDir = -1;
    buildCurMenu(pick, root);
    swap.addEventListener('click', function () {
      _convDir = -_convDir; cacheSet('fxdir', _convDir);
      applyConvDir(); renderConv();
    });
    amt.addEventListener('input', renderConv);
    applyConvDir(); renderConv();
  }

  /* ════════════════════════════ VÆR (MET) ════════════════════════════ */
  var WX = {
    clearsky: 'Klarvær', fair: 'Lettskyet', partlycloudy: 'Delvis skyet', cloudy: 'Skyet', fog: 'Tåke',
    lightrain: 'Lett regn', rain: 'Regn', heavyrain: 'Kraftig regn',
    lightrainshowers: 'Lette regnbyger', rainshowers: 'Regnbyger', heavyrainshowers: 'Kraftige regnbyger',
    lightsleet: 'Lett sludd', sleet: 'Sludd', heavysleet: 'Kraftig sludd',
    lightsleetshowers: 'Sluddbyger', sleetshowers: 'Sluddbyger', heavysleetshowers: 'Kraftige sluddbyger',
    lightsnow: 'Lett snø', snow: 'Snø', heavysnow: 'Kraftig snø',
    lightsnowshowers: 'Lette snøbyger', snowshowers: 'Snøbyger', heavysnowshowers: 'Kraftige snøbyger',
    rainandthunder: 'Regn og torden', rainshowersandthunder: 'Regnbyger og torden',
    snowandthunder: 'Snø og torden', sleetandthunder: 'Sludd og torden'
  };
  function wxText(sym) {
    if (!sym) return 'Vær';
    return WX[sym.replace(/_(day|night|polartwilight)$/, '')] || 'Vær';
  }
  /* Minimal linjeikoner (matcher sidens outline-stil) for værmeldings-stripa. */
  var WX_ICONS = {
    sun: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"/></svg>',
    cloud: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 11.5h7a2.5 2.5 0 0 0 .2-5a3.5 3.5 0 0 0-6.7-1A2.7 2.7 0 0 0 4.6 11.5Z"/></svg>',
    rain: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 9.4h7a2.4 2.4 0 0 0 .2-4.8a3.4 3.4 0 0 0-6.5-.9A2.6 2.6 0 0 0 4.6 9.4Z"/><path d="M6 11.3l-.8 2M9 11.3l-.8 2"/></svg>',
    snow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 9.4h7a2.4 2.4 0 0 0 .2-4.8a3.4 3.4 0 0 0-6.5-.9A2.6 2.6 0 0 0 4.6 9.4Z"/><circle cx="6" cy="12.3" r=".55" fill="currentColor" stroke="none"/><circle cx="9" cy="12.3" r=".55" fill="currentColor" stroke="none"/></svg>',
    moon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.2 9.6A5.4 5.4 0 0 1 6.4 2.8a5.4 5.4 0 1 0 6.8 6.8Z"/></svg>'
  };
  function wxIcon(sym) {
    var s = (sym || '').replace(/_(day|night|polartwilight)$/, '');
    var g = 'cloud';
    if (/snow/.test(s)) g = 'snow';
    else if (/sleet|rain|thunder/.test(s)) g = 'rain';
    else if (/clearsky|fair/.test(s)) g = /_night$/.test(sym || '') ? 'moon' : 'sun';
    return WX_ICONS[g] || WX_ICONS.cloud;
  }
  var DAGER_FULL = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']; // Date.getDay(): 0 = søndag
  function renderWeather(d) {
    _lastWx = d;
    setVal('wxTemp', Math.round(d.temp), 0);
    setText('wxCond', wxText(d.sym));
    var wg = document.querySelector('.trend-weather .trend-glyph');
    if (wg && wg.getAttribute('data-sym') !== (d.sym || '')) {
      var tmp = document.createElement('div');
      tmp.innerHTML = wxIcon(d.sym);
      var ng = tmp.firstChild;
      ng.setAttribute('class', 'trend-glyph'); ng.setAttribute('data-sym', d.sym || '');
      wg.parentNode.replaceChild(ng, wg);
    }
    buildWxSpark(d);
    /* Maks, min og nedbør gjelder det neste døgnet — samme periode og samme tall som grafen
       under. Uten timeserie (gammel cache) brukes dagens maks og min, og nedbøren står over. */
    var w = _wxMini, rows = [[ph('Maks / min'), deg(w ? w.mx : d.max) + ' / ' + deg(w ? w.mn : d.min)]];
    if (typeof d.wind === 'number') rows.push([ph('Vind'), nb(d.wind, 1) + '\u00a0m/s' + (d.dir != null ? '\u00a0' + compass(d.dir) : '')]);
    if (w) rows.push([ph('Nedbør'), nb(w.tot, w.tot ? 1 : 0) + '\u00a0mm']);
    setFacts('wxSub', rows);
    /* Carbon på telefon (index.html, #carbonMobil) viser værkortet som i oktober: én linje
       med dagens maks, min og vind, og fire ruter under. Fylles alltid; CSS velger visning. */
    var line = ph('Maks') + ' ' + deg(w ? w.mx : d.max) + ' · ' + ph('Min') + ' ' + deg(w ? w.mn : d.min); // neste 24 t, som de andre temaene
    if (typeof d.wind === 'number') line += ' · ' + nb(d.wind, 1) + ' m/s' + (d.dir != null ? ' ' + compass(d.dir) : '');
    setText('wxLine', line);
    buildForecast(d);
    if (_big.kind === 'wx') bigRefresh(); // live-oppdater åpen fullskjermgraf
    stampNow();
  }
  function deg(v) { var r = Math.round(v); return (r < 0 ? '−' + (-r) : String(r)) + '°'; }
  /* De fire rutene under linja (Carbon på telefon): nå, +2, +4 og +6 timer, med symbol,
     temperatur og klokkeslett. Samme timeserie som døgngrafen. */
  function buildForecast(d) {
    var el = $('wxForecast'); if (!el) return;
    var now = Date.now();
    var hrs = (d.hrs || []).filter(function (h) { return Date.parse(h.t) + 3600e3 > now; });
    if (hrs.length < 7) return;
    var html = '';
    for (var i = 0; i <= 6; i += 2) {
      var hh = new Date(hrs[i].t).getHours();
      html += '<div class="wx-fc-cell">' +
        '<span class="wx-fc-ico">' + wxIcon(hrs[i].sym) + '</span>' +
        '<b class="wx-fc-temp">' + deg(hrs[i].temp) + '</b>' +
        '<span class="wx-fc-time">' + esc(i === 0 ? ph('nå') : (hh < 10 ? '0' + hh : String(hh))) + '</span>' +
        '</div>';
    }
    el.innerHTML = html;
  }
  /* Værkortets døgngraf: temperaturkurven de neste 24 timene, nedbør som søyler nederst,
     et værsymbol per rute og en setning om når nedbøren kommer.
     _wxMini holder serien scrub-chipen leser fra, og døgnets maks, min og nedbør til faktaradene. */
  var _wxMini = null;
  function buildWxSpark(d) {
    var svg = $('wxSpark'); if (!svg) return;
    var now = Date.now(), i;
    /* Timer som alt er passert, faller ut — «nå» er alltid første punkt. */
    var hrs = (d.hrs || []).filter(function (h) { return Date.parse(h.t) + 3600e3 > now; }).slice(0, 25);
    if (hrs.length < 7) return;
    var sig = JSON.stringify(hrs) + document.documentElement.lang;
    if (sig === _fcSig) return; // uendret værmelding — la grafen stå
    _fcSig = sig;
    var n = hrs.length, v = [], p = [], dt = [];
    for (i = 0; i < n; i++) { v.push(hrs[i].temp); p.push(hrs[i].precip || 0); dt.push(new Date(hrs[i].t)); }
    var mx = Math.max.apply(null, v), mn = Math.min.apply(null, v);
    _wxMini = { v: v, p: p, dt: dt, mx: mx, mn: mn, tot: sum(p.slice(0, n - 1)) };
    /* Et nesten flatt døgn skal se flatt ut: skalaen spenner alltid over minst to grader. */
    if (mx - mn < 2) { var mid = (mx + mn) / 2; mx = mid + 1; mn = mid - 1; }
    var W = 200, H = WX_H, pad = 6;
    function X(k) { return k / (n - 1) * W; }
    function Y(x) { return pad + (1 - (x - mn) / (mx - mn)) * (H - 2 * pad); }
    setText('wxYMax', deg(mx)); setText('wxYMin', deg(mn));

    /* Døgnet deles i like ruter à seks timer regnet fra nå, med klokkeslettet under hver strek
       og ved slutten. Faste klokkeslett (00 · 06 · 12 · 18) ga ujevne ruter: bred først og en
       smal rest til slutt. Annethvert klokkeslett (is-fine) skjules av CSS når fire smale kort
       deler raden. Første klokkeslett sløyfes når ordet for «nå» er så langt at de kolliderer
       i den smaleste grafen der det vises (173 px); streken står likevel. */
    var nowL = ph('nå'), ax = '<span>' + esc(nowL) + '</span>', tk = [], last = n - 1;
    for (i = 6; i < last; i += 6) {
      tk.push(i);
      if (i > 6 || nowL.length * 9.5 + 12 <= 6 / last * 173) ax += '<span' + (i % 12 ? ' class="is-fine"' : '') + ' style="left:' + (i / last * 100).toFixed(1) + '%">' + pad2(dt[i].getHours()) + '</span>';
    }
    /* Slutten får klokkeslett bare når siste rute er hel, ellers kolliderer det med det forrige. */
    if (last % 6 === 0) ax += '<span class="is-end" style="left:100%">' + pad2(dt[last].getHours()) + '</span>';
    var el = $('wxAxis'); if (el) el.innerHTML = ax;

    var s = '';
    /* Loddrett hårstrek over hvert klokkeslett: deler døgnet i ruter som symbolene står i. */
    for (i = 0; i < tk.length; i++) s += '<line class="spark-grid" x1="' + X(tk[i]).toFixed(1) + '" y1="0" x2="' + X(tk[i]).toFixed(1) + '" y2="' + H + '"/>';
    /* Stiplet linje på 0° når døgnet krysser frysepunktet. */
    if (mn < 0 && mx > 0) s += sparkRef(Y(0));
    /* Nedbør: søyla dekker timen fra punktet til neste. Høyden skaleres mot minst 2 mm/t,
       så yr ikke ser ut som styrtregn. Siste punkt er periodens slutt og har ingen søyle. */
    var pmax = Math.max(2, Math.max.apply(null, p)), bw = W / (n - 1);
    for (i = 0; i < n - 1; i++) {
      if (p[i] <= 0) continue;
      var bh = Math.max(1.5, p[i] / pmax * 20);
      s += '<rect class="wx-rain" x="' + (X(i) + bw * 0.15).toFixed(1) + '" y="' + (H - bh).toFixed(1) +
           '" width="' + (bw * 0.7).toFixed(1) + '" height="' + bh.toFixed(1) + '"/>';
    }
    /* Kurven tegnes litt utjevnet: hver time veies sammen med nabotimene. METs tideler gir
       ellers små trappetrinn i en så lav graf. «Nå» og siste time står urørt, og avlesningen
       under pekeren bruker de ekte tallene. */
    var pts = v.map(function (x, k) { return [X(k), Y(k && k < last ? (v[k - 1] + 2 * x + v[k + 1]) / 4 : x)]; });
    svg.innerHTML = sparkSvg(curvePath(pts), pts[0], s, H);

    /* Ett symbol midt i hver rute (mellom to hårstreker). Symbolet oppsummerer de seks timene
       rundt der det står (METs next_6_hours). Ruter under tre timer er for smale og står tomme. */
    var sy = '', b = [0].concat(tk, [n - 1]);
    for (i = 0; i < b.length - 1; i++) {
      if (b[i + 1] - b[i] < 3) continue;
      var c = (b[i] + b[i + 1]) / 2, h0 = hrs[Math.max(b[i], Math.round(c) - 3)], sc = h0.s6 || h0.sym;
      if (sc) sy += '<span style="left:' + (c / (n - 1) * 100).toFixed(1) + '%">' + wxIcon(sc) + '</span>';
    }
    el = $('wxSyms'); if (el) el.innerHTML = sy;
  }
  /* Grupperer hele MET-timeserien på lokal kalenderdag og finner maks/min +
     et symbol representativt for dagen (målepunktet nærmest kl. 13 lokal tid). */
  function buildWeek(ts) {
    var byDate = {}, order = [];
    for (var i = 0; i < ts.length; i++) {
      var dt = new Date(ts[i].time);
      var key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      if (!byDate[key]) { byDate[key] = []; order.push(key); }
      byDate[key].push(ts[i]);
    }
    var week = [];
    for (var di = 0; di < order.length && week.length < 7; di++) {
      var entries = byDate[order[di]];
      var temps = entries.map(function (e) { return e.data.instant.details.air_temperature; })
                          .filter(function (v) { return typeof v === 'number'; });
      if (!temps.length) continue;
      var best = entries[0], bestDiff = Math.abs(new Date(entries[0].time).getHours() - 13);
      for (var j = 1; j < entries.length; j++) {
        var diff = Math.abs(new Date(entries[j].time).getHours() - 13);
        if (diff < bestDiff) { bestDiff = diff; best = entries[j]; }
      }
      var nx = best.data;
      var sym = (nx.next_1_hours && nx.next_1_hours.summary.symbol_code) ||
                (nx.next_6_hours && nx.next_6_hours.summary.symbol_code) || '';
      week.push({ dow: new Date(entries[0].time).getDay(), sym: sym,
                  max: Math.max.apply(null, temps), min: Math.min.apply(null, temps) });
    }
    return week;
  }
  /* Time-for-time-serie framover til fullskjermgrafen (12 / 24 / 48 t).
     Tar de neste 49 time-oppløste punktene fra «nå» (MET gir 1-t-oppløsning
     ~2,5 døgn framover, så dette fylles uansett klokkeslett). Hver post har
     tidspunkt + temperatur + vind, og nedbør + symbol for neste time (next_1_hours).
     s6 er symbolet for de neste seks timene (kortgrafen og 48 t-visningen). */
  function buildHours(ts) {
    var out = [];
    for (var i = 0; i < ts.length && out.length < 49; i++) {
      var e = ts[i], det = e.data.instant.details, n1 = e.data.next_1_hours;
      if (!n1) break; // forbi 1-t-sonen → stopp (6-t-blokker egner seg ikke til time-graf)
      if (typeof det.air_temperature !== 'number' || isNaN(det.air_temperature)) continue; // hopp over hull (som buildWeek)
      out.push({
        t: e.time,
        temp: det.air_temperature,
        precip: (n1.details && typeof n1.details.precipitation_amount === 'number') ? n1.details.precipitation_amount : 0,
        sym: (n1.summary && n1.summary.symbol_code) || '',
        s6: (e.data.next_6_hours && e.data.next_6_hours.summary && e.data.next_6_hours.summary.symbol_code) || '',
        wind: det.wind_speed
      });
    }
    return out;
  }
  function loadWeather(place, force) {
    var key = 'wx_' + place.lat.toFixed(3) + '_' + place.lon.toFixed(3);
    var c = cacheGet(key);
    /* Cache fra før døgngrafen mangler timeserien (hrs) eller symbolene i den — vises, men regnes som utløpt. */
    if (!force && c && c.d && c.d.hrs && c.d.hrs[0] && c.d.hrs[0].sym != null && fresh(c, 30 * 60 * 1000)) { _got.wx = c.t; renderWeather(c.d); return; }
    if (c) { _got.wx = c.t; renderWeather(c.d); } // vis cachet umiddelbart mens vi henter ferskt
    fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + place.lat.toFixed(4) + '&lon=' + place.lon.toFixed(4))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var ts = j.properties.timeseries, now = ts[0].data.instant.details;
        var nx = ts[0].data;
        var sym = (nx.next_1_hours && nx.next_1_hours.summary.symbol_code) ||
                  (nx.next_6_hours && nx.next_6_hours.summary.symbol_code) || '';
        var today = ts[0].time.slice(0, 10);
        var temps = ts.filter(function (e) { return e.time.slice(0, 10) === today; })
                      .map(function (e) { return e.data.instant.details.air_temperature; })
                      .filter(function (v) { return typeof v === 'number'; });
        if (!temps.length) temps = [now.air_temperature];
        var d = { temp: now.air_temperature, wind: now.wind_speed, dir: now.wind_from_direction,
                  sym: sym, max: Math.max.apply(null, temps), min: Math.min.apply(null, temps), temps: temps,
                  week: buildWeek(ts), hrs: buildHours(ts) };
        _wxFail = false;
        cacheSet(key, d); _got.wx = Date.now(); renderWeather(d);
      })
      .catch(function () { /* behold cachet/HTML-verdi */
        _wxFail = true;
        if (_big.kind === 'wx') bigRefresh();
      });
  }

  /* ═══════════ FULLSKJERM GRAF (alle åtte kortene) ═══════════
     Knappen øverst til høyre på hvert kort åpner én felles
     dialog (Claude Design «05 Fullskjerm graf»). DOM-en bygges første gang den
     åpnes og gjenbrukes. Vær leser timeserien loadWeather allerede har hentet;
     strøm (andre soner, i morgen, siste 7 dager), valuta (ett år) og SSB-tallene
     (ti år) hentes først når de vises, og caches. Dagslyset regnes ut på siden.
     Hver henting lagres under sin egen nøkkel
     (sone + dato, valuta), og dialogen tegnes alltid fra det som er valgt NÅ —
     et sent svar for et gammelt valg kan derfor aldri overskrive et nyere. */
  var BIG = null, _bigT = 0, _rvF = 0, _reduce = false;
  /* kind: åpen graf (wx/sr/st/fx/df/kp/bl/su) · r: tidsrom per graf · fuel: 0 bensin, 1 diesel
     · hov: punkt under peker/piltast · M: tegnet modell · sig: modellens signatur
     (minutt-pulsen tegner bare om ved endring) */
  var _big = { kind: null, r: { wx: 0, st: 0, fx: 0, sr: 1, df: 1, kp: 1, bl: 1, su: 0 }, zone: 'NO1', fuel: 0, hov: null, M: null, sig: '', ret: null, ov: '' };
  var RANGES = { wx: ['12 t', '24 t', '48 t'], st: ['I dag', 'I morgen', '7 dager'], fx: ['30 d', '90 d', '1 år'], sr: ['1 år', '5 år', '10 år'],
    df: ['2 år', '5 år', '10 år'], kp: ['2 år', '5 år', '10 år'], bl: ['2 år', '5 år', '10 år'], su: [] }; // dagslyset viser alltid hele året
  var ZONES = [['NO1', 'Øst'], ['NO2', 'Sør'], ['NO3', 'Midt'], ['NO4', 'Nord'], ['NO5', 'Vest']];
  var FS_ON = 'M6 2v4H2M10 14v-4h4M14 6h-4V2M2 10h4v4', FS_OFF = 'M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9';

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function isoDay(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dayShift(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function wdShort(dow) { return ph(DAGER_FULL[dow]).slice(0, 3); } // «Lør» / «Sat»
  function hourLbl(a, b) { return fill(ph('Kl. {a}–{b}'), { a: a, b: b }); }
  /* Små bokstaver midt i en setning («lør kl. 14») — men ikke på engelsk, der ukedagen har stor forbokstav («Sat at 14:00»). */
  function low(s) { return document.documentElement.lang === 'en' ? s : s.toLowerCase(); }
  function monthLbl(iso) { // 'YYYY-MM-DD' -> «Okt 25»
    var p = iso.split('-');
    return cap(T('trSharedMonthsShort', MND.join(',')).split(',')[parseInt(p[1], 10) - 1].replace(/\.$/, '')) + ' ' + p[0].slice(2);
  }
  function spread(n, k) { var o = []; for (var j = 0; j < k; j++) o.push(Math.round(j * (n - 1) / (k - 1))); return o; }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  /* Plottet tegnes i et 1000 × 400-rom; spenn og etiketter plasseres i prosent av det. */
  function pct(x) { return (x / 10).toFixed(3) + '%'; }
  function pctY(y) { return (y / 4).toFixed(3) + '%'; }

  /* ── Strømpris per dag og sone (hvakosterstrømmen.no) ──
     Priser endrer seg ikke etter at de er publisert, så en hentet dag beholdes
     (lagres i localStorage, de siste 8 dagene). 404 betyr «ikke publisert ennå»
     (i morgen før ~kl. 13) og prøves igjen etter to minutter, det samme gjør feil. */
  var _stDays = {}, _stBusy = {}, _stDisk = {};
  /* Timene leses fra time_start, ikke fra rekkefølgen: dager med sommertid-skifte
     har 23 eller 25 timer. Kommer prisene i kvarter, slås de sammen til timer. */
  function stParse(arr) {
    var h = [], s = [], p = [], c = [];
    for (var i = 0; i < arr.length; i++) {
      var o = arr[i], hh = String(o.time_start).slice(11, 13), t = Date.parse(o.time_start), j = h.length - 1;
      if (typeof o.NOK_per_kWh !== 'number' || isNaN(t)) throw 0;
      if (j >= 0 && h[j] === hh && t - s[j] < 3600e3) { p[j] += o.NOK_per_kWh; c[j]++; }
      else { h.push(hh); s.push(t); p.push(o.NOK_per_kWh); c.push(1); }
    }
    if (!h.length) throw 0;
    for (var k = 0; k < p.length; k++) p[k] = Math.round(p[k] / c[k] * 1e4) / 100; // øre/kWh
    return { h: h, s: s, p: p };
  }
  /* Gir dagens data, null (ikke publisert), false (feil) eller undefined (hentes nå).
     peek: bare se i cachen, ikke hent. */
  function stDay(zone, iso, peek) {
    var k = zone + '|' + iso, e = _stDays[k];
    if (!e && !_stDisk[zone]) {
      _stDisk[zone] = 1;
      var o = cacheGet('stdays_' + zone), m = (o && o.d) || {};
      for (var di in m) if (!_stDays[zone + '|' + di]) _stDays[zone + '|' + di] = { d: m[di], t: 0 };
      e = _stDays[k];
    }
    if (e && (e.d || Date.now() - e.t < 120000)) return e.d;
    if (peek) return e ? e.d : null;
    if (!_stBusy[k]) fetchStDay(zone, iso);
    return e ? e.d : undefined; // mens null/feil prøves på nytt, står forrige svar
  }
  function fetchStDay(zone, iso) {
    var k = zone + '|' + iso, p = iso.split('-');
    _stBusy[k] = true;
    fetch('https://www.hvakosterstrommen.no/api/v1/prices/' + p[0] + '/' + p[1] + '-' + p[2] + '_' + zone + '.json')
      .then(function (r) { if (r.status === 404) return null; if (!r.ok) throw 0; return r.json(); })
      .then(function (arr) { return arr ? stParse(arr) : null; })
      .then(function (d) {
        _stDays[k] = { d: d, t: Date.now() };
        if (!d) return;
        var o = cacheGet('stdays_' + zone), m = (o && o.d) || {}, cut = isoDay(dayShift(-8));
        m[iso] = d;
        for (var key in m) if (key < cut) delete m[key];
        cacheSet('stdays_' + zone, m);
      }, function () { _stDays[k] = { d: false, t: Date.now() }; })
      .then(function () { delete _stBusy[k]; if (_big.kind === 'st') bigRefresh(); });
  }

  /* ── Valutakurs siste år (Norges Bank EXR), hentes per valuta når den vises ── */
  var _fxY = {}, _fxYBusy = {}, _fxYFail = {};
  function fxYear(code) {
    var e = _fxY[code] || (_fxY[code] = cacheGet('fxy_' + code));
    if ((!e || !fresh(e, 6 * 3600 * 1000)) && !_fxYBusy[code] &&
        !(_fxYFail[code] && Date.now() - _fxYFail[code] < 120000)) fetchFxYear(code);
    return e && e.d && e.d.dates ? e.d : null;
  }
  function fetchFxYear(code) {
    _fxYBusy[code] = true;
    fetch('https://data.norges-bank.no/api/data/EXR/B.' + code + '.NOK.SP?startPeriod=' + isoDay(dayShift(-372)) + '&format=sdmx-json&locale=en')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var c = parseExr(j)[code];
        if (!c || !c.series.length) throw 0;
        return { dates: c.dates, vals: c.series, mult: c.mult };
      })
      .then(function (d) { cacheSet('fxy_' + code, d); _fxY[code] = { t: Date.now(), d: d }; delete _fxYFail[code]; },
            function () { _fxYFail[code] = Date.now(); })
      .then(function () { delete _fxYBusy[code]; if (_big.kind === 'fx') bigRefresh(); });
  }

  /* ── Styringsrenta siste ti år (Norges Bank IR). Kortet viser bare 18 måneder (og
     ingen graf på telefon); tiårsserien hentes først når fullskjermgrafen åpnes, og
     caches i 6 t. ── */
  var _srL = null, _srLBusy = false, _srLFail = 0;
  function rateLong() {
    var e = _srL || (_srL = cacheGet('srl'));
    if ((!e || !fresh(e, 6 * 3600 * 1000)) && !_srLBusy && !(_srLFail && Date.now() - _srLFail < 120000)) fetchRateLong();
    return e && e.d && e.d.dates ? e.d : null;
  }
  function fetchRateLong() {
    _srLBusy = true;
    /* Litt over ti år: boliglånsgrafen måler mot styringsrenta i alle sine 121 måneder, og SSB ligger et par måneder etter. */
    fetch('https://data.norges-bank.no/api/data/IR/B.KPRA.SD.R?startPeriod=' + isoDay(dayShift(-3800)) + '&format=sdmx-json&locale=en')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var d = parseRate(j); return { dates: d.dates, vals: d.series }; })
      .then(function (d) { cacheSet('srl', d); _srL = { t: Date.now(), d: d }; _srLFail = 0; },
            function () { _srLFail = Date.now(); })
      .then(function () { _srLBusy = false; if (_big.kind === 'sr' || _big.kind === 'bl') bigRefresh(); }); // bl: sammenligningslinja
  }

  /* ── SSB-tallene ti år tilbake (drivstoff, prisvekst, boliglånsrente). Kortene henter
     bare 25 måneder; de 121 hentes først når fullskjermgrafen åpnes, og caches i 12 t. ── */
  var _ssbL = {}, _ssbLBusy = {}, _ssbLFail = {};
  function ssbLong(k) {
    var e = _ssbL[k] || (_ssbL[k] = cacheGet('ssbl_' + k));
    if ((!e || !fresh(e, 12 * 36e5)) && !_ssbLBusy[k] && !(_ssbLFail[k] && Date.now() - _ssbLFail[k] < 120000)) fetchSsbLong(k);
    return e && e.d && e.d.dates ? e.d : null;
  }
  function fetchSsbLong(k) {
    _ssbLBusy[k] = true;
    fetch(SSB + SSB_Q[k].replace('top(25)', 'top(121)'))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var d = parseSsb(j); if (!d.series[0] || d.series[0].length < 2) throw 0; return d; })
      .then(function (d) { cacheSet('ssbl_' + k, d); _ssbL[k] = { t: Date.now(), d: d }; delete _ssbLFail[k]; },
            function () { _ssbLFail[k] = Date.now(); })
      .then(function () { delete _ssbLBusy[k]; if (_big.kind === k) bigRefresh(); });
  }

  /* ── Seriemodeller: én per graf og tidsrom ──
     state: ok | load | err | empty. Ellers: v (verdier), n, line (linje eller søyler),
     def (punktet som vises uten peker), nowIdx, ax ([indeks, etikett]),
     seps (døgnskiller), stats, og tekstene rundt grafen. */
  function wxModel(r) {
    var d = _lastWx, place = getPlace(), now = Date.now();
    var M = { kind: 'wx', line: true, unit: '°C', ydec: 1, eye: ph('Vær') + ' · ' + place.navn,
      foot: fill(ph('MET Norway · timesverdier for {sted} · søylene nederst er nedbør'), { sted: place.navn }),
      week: d && d.week };
    /* Timer som alt er passert, faller ut — «nå» er alltid første punkt. */
    var hrs = ((d && d.hrs) || []).filter(function (h) { return Date.parse(h.t) + 3600e3 > now; }).slice(0, [12, 24, 48][r] + 1);
    if (hrs.length < 2) { M.state = _wxFail ? 'err' : 'load'; return M; }
    var n = hrs.length, v = [], p = [], dt = [], today = isoDay(new Date());
    for (var i = 0; i < n; i++) { v.push(hrs[i].temp); p.push(hrs[i].precip || 0); dt.push(new Date(hrs[i].t)); }
    function hh(i) { return pad2(dt[i].getHours()); }
    function other(i) { return isoDay(dt[i]) !== today; }
    function at(i) { return i === 0 ? ph('nå') : (other(i) ? low(wdShort(dt[i].getDay())) + ' ' : '') + fill(ph('kl. {h}'), { h: hh(i) }); }
    M.n = n; M.v = v; M.p = p; M.def = 0; M.nowIdx = 0;
    M.label = function (i) {
      var b = pad2((dt[i].getHours() + 1) % 24);
      return other(i) ? fill(ph('{wd} kl. {a}–{b}'), { wd: wdShort(dt[i].getDay()), a: hh(i), b: b }) : hourLbl(hh(i), b);
    };
    M.ax = []; M.seps = [];
    for (var j = 0; j < n; j += (n > 13 ? 6 : 3)) M.ax.push([j, j === 0 ? ph('Nå') : hh(j)]);
    for (var k = 1; k < n; k++) {
      if (dt[k].getHours() === 0) M.seps.push([k, ph(DAGER_FULL[dt[k].getDay()]) + (window.innerWidth < 641 ? '' : ' ' + nbShort(isoDay(dt[k])))]);
    }
    var mx = Math.max.apply(null, v), mn = Math.min.apply(null, v);
    /* Nedbøren i et punkt gjelder timen ETTER det — siste punkt er slutten av perioden og telles ikke. */
    M.stats = [[ph('Høyest'), Math.round(mx) + '°', at(v.indexOf(mx))], [ph('Lavest'), Math.round(mn) + '°', at(v.indexOf(mn))],
               [ph('Nedbør'), nb(sum(p.slice(0, n - 1)), 1), ph('mm i perioden')]];
    /* Værsymboler langs kurven: annenhver time (12 t), hver tredje (24 t) eller hver sjette (48 t);
       halvparten så mange på mobil. Siste punkt er periodens slutt og får ikke symbol. */
    var st = (window.innerWidth < 641 ? [3, 6, 12] : [2, 3, 6])[r];
    M.sym = [];
    for (var q = 0; q < n - 1; q += st) {
      var sc = st >= 6 ? hrs[q].s6 || hrs[q].sym : hrs[q].sym;
      if (sc) M.sym.push([q, sc]);
    }
    M.valOf = function (i) { return String(Math.round(v[i])); };
    M.sub0 = ph(wxText(d.sym)) + (typeof d.wind === 'number'
      ? ' · ' + ph('Vind') + ' ' + nb(d.wind, 1) + ' m/s' + (d.dir != null ? ' ' + compass(d.dir) : '') : '');
    M.subOf = function (i) {
      return M.label(i) + (hrs[i].sym ? ' · ' + ph(wxText(hrs[i].sym)) : '') + ' · ' + fill(ph('{mm} mm nedbør'), { mm: nb(p[i], 1) });
    };
    M.tipV = function (i) {
      return Math.round(v[i]) + ' °C · ' + nb(p[i], 1) + ' mm' + (typeof hrs[i].wind === 'number' ? ' · ' + nb(hrs[i].wind, 0) + ' m/s' : '');
    };
    M.state = 'ok';
    return M;
  }

  function stModel(r) {
    var zone = _big.zone, zn = zone;
    ZONES.forEach(function (z) { if (z[0] === zone) zn = zone + ' ' + ph(z[1]); });
    var M = { kind: 'st', line: false, unit: 'øre/kWh', ydec: 1, avg: true, eye: ph('Strømpris'), title: ph('Strømpris') + ' · ' + zn,
      chips: ZONES.map(function (z) { return [z[0], z[0] + ' ' + ph(z[1]), z[0] === zone]; }), chipLbl: ph('Velg prisområde'),
      foot: fill(ph('Ren spotpris · {sone} · nettleie og avgifter kommer i tillegg · stiplet linje er snittet'), { sone: zn }) };
    var dates = r === 0 ? [dayShift(0)] : r === 1 ? [dayShift(1)] : [-6, -5, -4, -3, -2, -1, 0].map(dayShift);
    /* Morgendagens priser publiseres rundt kl. 13 — før det spørres ikke (det gir bare 404). */
    var early = r === 1 && new Date().getHours() < 13;
    var days = dates.map(function (dd) { return stDay(zone, isoDay(dd), early); });
    if (days.indexOf(false) >= 0) { M.state = 'err'; return M; }
    if (days.indexOf(undefined) >= 0) { M.state = 'load'; return M; }
    if (days.indexOf(null) >= 0) {
      M.state = 'empty';
      M.msg = r === 1 ? ph('Morgendagens priser kommer rundt kl. 13') : ph('Prisene for denne perioden er ikke publisert ennå');
      return M;
    }
    var v = [], h = [], s = [], di = [], starts = [];
    days.forEach(function (x, k) {
      starts.push(v.length);
      for (var i = 0; i < x.p.length; i++) { v.push(x.p[i]); h.push(x.h[i]); s.push(x.s[i]); di.push(k); }
    });
    var n = v.length, now = Date.now(), nowIdx = null;
    if (r !== 1) for (var i = 0; i < n; i++) if (s[i] <= now && (i < n - 1 ? s[i + 1] > now : now - s[i] < 3600e3)) nowIdx = i;
    function span(i) { return [h[i], pad2((parseInt(h[i], 10) + 1) % 24)]; }
    function lbl(i) {
      var a = span(i);
      return r === 2 ? fill(ph('{wd} kl. {a}–{b}'), { wd: wdShort(dates[di[i]].getDay()), a: a[0], b: a[1] }) : hourLbl(a[0], a[1]);
    }
    M.n = n; M.v = v; M.nowIdx = nowIdx; M.def = r === 1 ? null : nowIdx;
    M.label = function (i) { return lbl(i) + (i === nowIdx ? ' · ' + ph('nå') : ''); };
    M.ax = []; M.seps = [];
    if (r === 2) {
      starts.forEach(function (st, k) {
        M.ax.push([st + Math.floor(days[k].p.length / 2), wdShort(dates[k].getDay())]);
        if (k) M.seps.push([st, '']);
      });
    } else {
      ['00', '06', '12', '18'].forEach(function (t) { var i = h.indexOf(t); if (i >= 0) M.ax.push([i, t]); });
      M.ax.push([n - 1, h[n - 1]]);
    }
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), lo = v.indexOf(mn);
    M.avgV = sum(v) / n; M.lowIdx = lo;
    M.stats = [[ph('Billigst'), nb(mn, 1), low(M.label(lo))], [ph('Dyrest'), nb(mx, 1), low(M.label(v.indexOf(mx)))],
               [ph('Snitt'), nb(M.avgV, 1), 'øre/kWh']];
    if (nowIdx != null) M.stats.push([ph('Nå'), nb(v[nowIdx], 1), low(hourLbl(span(nowIdx)[0], span(nowIdx)[1]))]);
    var cheap = fill(ph('billigst {t}'), { t: low(lbl(lo)) });
    M.val0 = nb(M.avgV, 1); // vises bare når def er null (i morgen)
    M.sub0 = M.def == null ? ph('Snitt i morgen') + ' · ' + cheap : M.label(M.def) + ' · ' + cheap;
    M.valOf = function (i) { return nb(v[i], 1); };
    M.subOf = M.label;
    M.tipV = function (i) { return nb(v[i], 1) + ' øre/kWh'; };
    M.state = 'ok';
    return M;
  }

  function fxModel(r) {
    var code = _fxCode, y = fxYear(code), base = _fx && _fx[code];
    /* Til årsserien er hentet, kan 30 d vises fra kursene kortet alt har. */
    var src = y || (r === 0 && base ? { dates: base.dates, vals: base.series, mult: base.mult } : null);
    /* Årsserien caches i 6 t. Er den hentet før Norges Bank publiserte (rundt kl. 16), mangler
       den kursen kortet alt viser — legg til kortets nyere dager, så kort og graf sier det samme. */
    if (y && base && base.dates) {
      var last = y.dates[y.dates.length - 1], xd = [], xv = [];
      for (var b = 0; b < base.dates.length; b++) if (base.dates[b] > last) { xd.push(base.dates[b]); xv.push(base.series[b]); }
      if (xd.length) src = { dates: y.dates.concat(xd), vals: y.vals.concat(xv), mult: y.mult };
    }
    var unit = fxUnit({ mult: (src && src.mult) || (base && base.mult) || 1 }, code);
    var M = { kind: 'fx', line: true, unit: 'kr', ydec: 2, avg: true, eye: ph('Valutakurs'), title: ph('Valutakurs') + ' · ' + unit + ' / NOK',
      chips: FX_CODES.map(function (c) { return [c, c, c === code]; }), chipLbl: ph('Velg valuta'),
      foot: ph('Norges Bank · daglige midtkurser · stiplet linje er snittet') };
    if (!src) { M.state = _fxYFail[code] ? 'err' : 'load'; return M; }
    var cut = isoDay(dayShift(-[30, 90, 365][r])), dates = [], v = [], m = src.mult || 1;
    for (var i = 0; i < src.dates.length; i++) if (src.dates[i] >= cut) { dates.push(src.dates[i]); v.push(src.vals[i] * m); }
    if (v.length < 2) { M.state = 'empty'; M.msg = ph('Ingen kurser for denne perioden'); return M; }
    var n = v.length, today = isoDay(new Date()), k = window.innerWidth < 641 ? (r === 2 ? 4 : 3) : (r === 2 ? 7 : 5);
    M.n = n; M.v = v; M.def = n - 1; M.nowIdx = null; M.seps = [];
    M.label = function (i) { return nbDate(dates[i]) + (dates[i] === today ? ' · ' + ph('i dag') : ''); };
    M.ax = spread(n, k).map(function (i) {
      return [i, dates[i] === today ? ph('I dag') : r === 2 ? monthLbl(dates[i]) : nbShort(dates[i])];
    });
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), ch = Math.round((v[n - 1] - v[0]) / v[0] * 1000) / 10;
    M.avgV = sum(v) / n;
    M.stats = [[ph('Høyest'), nb(mx, 2), nbShort(dates[v.indexOf(mx)])], [ph('Lavest'), nb(mn, 2), nbShort(dates[v.indexOf(mn)])],
               [ph('Snitt'), nb(M.avgV, 2), 'kr'], [ph('Endring'), (ch > 0 ? '+' : ch < 0 ? '−' : '') + nb(Math.abs(ch), 1) + ' %', ph('i perioden')]];
    M.valOf = function (i) { return nb(v[i], 2); };
    M.sub0 = unit + ' / NOK · ' + fill(ph('snitt {v} kr'), { v: nb(M.avgV, 2) });
    M.subOf = function (i) { return unit + ' / NOK · ' + M.label(i); };
    M.tipV = function (i) { return nb(v[i], 2) + ' kr'; };
    M.state = 'ok';
    return M;
  }

  /* Renta står stille i måneder og hopper på rentemøtene; med én verdi per virkedag blir
     linja en trapp av seg selv. Ingen snittlinje — et snitt av renta sier lite. */
  function srModel(r) {
    var y = rateLong(), base = _rate, src = y;
    /* Tiårsserien caches i 6 t; har kortet (1 t) fått nyere dager, legges de til. */
    if (y && base && base.dates) {
      var last = y.dates[y.dates.length - 1], xd = [], xv = [];
      for (var b = 0; b < base.dates.length; b++) if (base.dates[b] > last) { xd.push(base.dates[b]); xv.push(base.series[b]); }
      if (xd.length) src = { dates: y.dates.concat(xd), vals: y.vals.concat(xv) };
    }
    var M = { kind: 'sr', line: true, unit: '%', ydec: 2, eye: ph('Styringsrente'), title: ph('Styringsrente') + ' · Norges Bank',
      foot: ph('Norges Bank · styringsrenta hver virkedag') };
    if (!src) { M.state = _srLFail ? 'err' : 'load'; return M; }
    var cut = isoDay(dayShift(-[365, 1826, 3652][r])), dates = [], v = [], i;
    for (i = 0; i < src.dates.length; i++) if (src.dates[i] >= cut) { dates.push(src.dates[i]); v.push(src.vals[i]); }
    if (v.length < 2) { M.state = 'empty'; M.msg = ph('Ingen renter for denne perioden'); return M; }
    var n = v.length, today = isoDay(new Date()), k = window.innerWidth < 641 ? 4 : 6;
    var all = src.vals, ci = all.length - 1;
    while (ci > 0 && all[ci - 1] === all[all.length - 1]) ci--;
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), ch = v[n - 1] - v[0], cnt = 0;
    for (i = 1; i < n; i++) if (v[i] !== v[i - 1]) cnt++;
    M.n = n; M.v = v; M.def = n - 1; M.nowIdx = null; M.seps = [];
    M.label = function (j) { return nbDate(dates[j]) + (dates[j] === today ? ' · ' + ph('i dag') : ''); };
    M.ax = spread(n, k).map(function (j) { return [j, dates[j] === today ? ph('I dag') : monthLbl(dates[j])]; });
    M.stats = [[ph('Høyest'), nb(mx, 2) + ' %', nbDate(dates[v.indexOf(mx)])], [ph('Lavest'), nb(mn, 2) + ' %', nbDate(dates[v.indexOf(mn)])],
               [ph('Endring'), (ch > 0.001 ? '+' : ch < -0.001 ? '−' : '±') + nb(Math.abs(ch), 2) + ' pp', ph('i perioden')],
               [ph('Endringer'), String(cnt), ph('i perioden')]];
    M.valOf = function (j) { return nb(v[j], 2); };
    M.sub0 = 'Norges Bank · ' + fill(ph('sist endret {d}'), { d: nbDate(src.dates[ci]) });
    M.subOf = M.label;
    M.tipV = function (j) { return nb(v[j], 2) + ' %'; };
    M.state = 'ok';
    return M;
  }

  /* Styringsrenta ved utgangen av hver måned ('2026-10' → 4.25): tiårsserien pluss kortets
     nyere dager. Datoene er stigende, så siste dag i måneden blir stående. */
  function rateByMonth() {
    var y = rateLong(), o = {};
    if (!y) return null;
    [{ dates: y.dates, vals: y.vals }, _rate && { dates: _rate.dates, vals: _rate.series }].forEach(function (s) {
      if (s) for (var i = 0; i < s.dates.length; i++) o[s.dates[i].slice(0, 7)] = s.vals[i];
    });
    return o;
  }

  /* Månedstallene fra SSB (drivstoff, prisvekst, boliglånsrente). v2 er en grå linje å måle
     mot: det andre drivstoffet, eller styringsrenta. Prisveksten får stiplet linje på målet. */
  function ssbModel(k, r) {
    var y = ssbLong(k), base = _ssb[k], src = y || (r === 0 && base) || null; // 2 år kan vises fra kortets tall
    /* Tiårsserien caches i 12 t; har kortet fått en nyere måned, legges den til. */
    if (y && base) {
      var at = base.dates.indexOf(y.dates[y.dates.length - 1]);
      if (at >= 0 && at < base.dates.length - 1) src = { dates: y.dates.concat(base.dates.slice(at + 1)),
        series: y.series.map(function (s, i) { return s.concat((base.series[i] || []).slice(at + 1)); }) };
    }
    var dec = k === 'kp' ? 1 : 2, u = k === 'df' ? ' kr' : ' %', fuel = _big.fuel, names = [ph('Bensin 95'), ph('Diesel')];
    var M = { kind: k, line: true, area: true, ydec: dec, unit: k === 'df' ? 'kr/l' : '%', seps: [], nowIdx: null };
    if (k === 'df') {
      M.eye = ph('Drivstoffpris'); M.title = M.eye + ' · ' + names[fuel];
      M.chips = names.map(function (nm, i) { return [String(i), nm, i === fuel]; }); M.chipLbl = ph('Velg drivstoff');
      M.foot = ph('SSB · landssnitt for hver måned, kroner per liter');
    } else if (k === 'kp') {
      M.eye = ph('Prisvekst');
      M.foot = ph('SSB · prisene sammenlignet med samme måned året før');
    } else {
      M.eye = ph('Boliglånsrente');
      M.foot = ph('SSB · snittrente på nye boliglån med flytende rente, effektiv uten gebyrer · nominell er regnet om med månedlige terminer · anslaget med gebyrer gjelder et lån på 3 mill. kr over 25 år med 2 000 kr i etableringsgebyr og 50 kr i termingebyr · styringsrenta fra Norges Bank');
    }
    if (!src) { M.state = _ssbLFail[k] ? 'err' : 'load'; return M; }
    var cut = [24, 60, 120][r] + 1, dates = src.dates.slice(-cut), n = dates.length;
    if (n < 2) { M.state = 'empty'; M.msg = ph('Ingen tall for denne perioden'); return M; }
    var v = (src.series[k === 'df' ? fuel : 0] || src.series[0]).slice(-cut), v2 = null, n2 = '';
    if (k === 'df' && src.series[1]) { v2 = src.series[1 - fuel].slice(-cut); n2 = [ph('Diesel'), ph('Bensin')][fuel]; }
    if (k === 'bl') {
      var rm = rateByMonth();
      if (rm) { v2 = dates.map(function (d) { return rm[d] != null ? rm[d] : null; }); n2 = ph('Styringsrente'); }
    }
    function val(x) { return nb(x, dec) + u; }
    function sgn(x, d) { var a = +Math.abs(x).toFixed(d); return (!a ? '±' : x > 0 ? '+' : '−') + nb(a, d); }
    function other(i) { return (k === 'bl' ? ' · ' + ph('nominell') + ' ' + val(nomRate(v[i])) : '') + (v2 && v2[i] != null ? ' · ' + low(n2) + ' ' + val(v2[i]) : ''); }
    function gap(x) { // avstanden til målet på 2 %
      var g = +(x - 2).toFixed(1);
      return g ? fill(ph(g > 0 ? '{v} pp over målet' : '{v} pp under målet'), { v: nb(Math.abs(g), 1) }) : ph('på målet');
    }
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), last = n - 1, avg = sum(v) / n, ch = v[last] - v[0];
    M.n = n; M.v = v; M.def = last;
    if (v2) { M.v2 = v2; M.has2 = function (i) { return v2[i] != null; }; }
    M.label = function (i) { return mndYr(dates[i]); };
    M.ax = spread(n, window.innerWidth < 641 ? 4 : 7).map(function (i) { return [i, monthLbl(dates[i])]; });
    M.stats = [[ph('Høyest'), val(mx), mndYr(dates[v.indexOf(mx)])], [ph('Lavest'), val(mn), mndYr(dates[v.indexOf(mn)])]];
    M.valOf = function (i) { return nb(v[i], dec); };
    M.tipV = function (i) { return val(v[i]) + other(i); };
    M.subOf = function (i) { return mndYr(dates[i]) + (k === 'kp' ? ' · ' + gap(v[i]) : other(i)); };
    if (k === 'df') {
      M.leg = [['a', names[fuel]]].concat(v2 ? [['c', names[1 - fuel]]] : []);
      M.stats.push([ph('Snitt'), val(avg), ph('i perioden')], [ph('Endring'), sgn(ch / v[0] * 100, 1) + ' %', ph('i perioden')]);
      M.sub0 = ph('Landssnitt for') + ' ' + mndYr(dates[last]) + other(last);
    } else if (k === 'kp') {
      M.avg = true; M.avgV = 2;
      M.leg = [['a', ph('Prisvekst')], ['r', ph('Målet på 2 %')]];
      M.stats.push([ph('Snitt'), val(avg), ph('i perioden')],
        [ph('Over målet'), fill(ph('{a} av {b}'), { a: v.filter(function (x) { return x > 2; }).length, b: n }), ph('måneder')]);
      M.sub0 = ph('Siste 12 mnd. til') + ' ' + mndYr(dates[last]) + ' · ' + gap(v[last]);
    } else {
      M.v3 = v.map(nomRate); // stiplet linje: nominell rente
      M.leg = [['a', ph('Effektiv rente')], ['n', ph('Nominell rente')]].concat(v2 ? [['c', n2]] : []);
      M.stats.push([ph('Med gebyrer'), val(feeRate(v[last])), ph('anslag for 3 mill. kr')], [ph('Endring'), sgn(ch, 2) + ' pp', ph('i perioden')]);
      if (v2 && v2[last] != null) M.stats.push([ph('Over styringsrenta'), sgn(v[last] - v2[last], 2) + ' pp', mndYr(dates[last])]);
      M.sub0 = ph('Effektiv, uten gebyrer') + ' · ' + ph('nominell') + ' ' + val(M.v3[last]) + ' · ' + mndYr(dates[last]);
    }
    M.state = 'ok';
    return M;
  }

  /* Klokkeslett som timer fra midnatt den dagen (08:30 → 8,5), holdt innenfor døgnet. */
  function clock(dt, mid) {
    var day = Math.round((new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()) - mid) / 864e5);
    return Math.max(0, Math.min(24, day * 24 + dt.getHours() + dt.getMinutes() / 60 + dt.getSeconds() / 3600));
  }

  /* Dagslyset gjennom året: feltet går fra soloppgang (v2) til solnedgang (v) dag for dag, med
     klokka på y-aksen. Sommertid gir hakkene i mars og oktober. I mørketid er feltet borte,
     i midnattssol fyller det hele døgnet. */
  function sunModel() {
    var place = getPlace(), now = new Date(), y = now.getFullYear();
    var M = { kind: 'su', line: true, band: true, unit: '', eye: ph('Dagslys') + ' · ' + place.navn,
      foot: fill(ph('Regnet ut for {sted} · feltet viser når sola er oppe'), { sted: place.navn }),
      T: { lo: 0, hi: 24, arr: [0, 6, 12, 18, 24] }, yFmt: function (t) { return pad2(t) + ':00'; },
      notes: [ph('Sola ned'), ph('Sola opp')], nowLbl: ph('I dag'), seps: [], ax: [] };
    var n = Math.round((Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / 864e5), S = [], hi = [], lo = [], len = [], i;
    for (i = 0; i < n; i++) {
      var s = S[i] = sunDay(place.lat, place.lon, y, 0, i + 1), mid = new Date(y, 0, i + 1);
      lo.push(s.polar > 0 ? 0 : clock(s.polar ? new Date(s.noon) : s.rise, mid));
      hi.push(s.polar > 0 ? 24 : s.polar ? lo[i] : clock(s.set, mid));
      len.push(s.len);
    }
    var doy = Math.round((Date.UTC(y, now.getMonth(), now.getDate()) - Date.UTC(y, 0, 1)) / 864e5), td = S[doy];
    function iso(j) { return isoDay(new Date(y, 0, j + 1)); }
    function name(d) { return ph(d.polar < 0 ? 'Mørketid' : 'Midnattssol'); }
    function what(d) { return ph(d.polar < 0 ? 'sola står ikke opp' : 'sola går ikke ned'); }
    function span(d) { return d.polar ? cap(what(d)) : fill(ph('Sola opp {a} · ned {b}'), { a: hhmm(d.rise), b: hhmm(d.set) }); }
    function lenTxt(min) { var t = Math.round(min); return t < 60 ? t + ' min' : dayLen(t); } // «46 min», ikke «0 t 46 min»
    M.n = n; M.v = hi; M.v2 = lo; M.def = M.nowIdx = doy;
    M.has2 = function (j) { return !S[j].polar; };
    M.tagOf = function (j, rise) { return hhmm(rise ? S[j].rise : S[j].set); };
    var small = window.innerWidth < 641;
    for (var m = 0; m < 12; m++) {
      var a = Math.round((Date.UTC(y, m, 1) - Date.UTC(y, 0, 1)) / 864e5);
      if (m) M.seps.push([a, '']);
      M.ax.push([a + 14, small ? monthOnly(m).charAt(0) : monthOnly(m)]);
    }
    /* Mørketid og midnattssol har ingen lengste eller korteste dag: da står antall dager i stedet. */
    function polarStat(sign) {
      var cnt = 0, first = 0;
      for (var j = 0; j < n; j++) if (S[j].polar === sign) { cnt++; if (S[(j + n - 1) % n].polar !== sign) first = j; }
      return [ph(sign < 0 ? 'Mørketid' : 'Midnattssol'), fill(ph('{n} dager'), { n: cnt }), fill(ph('fra {d}'), { d: nbShort(iso(first)) })];
    }
    var mx = Math.max.apply(null, len), mn = Math.min.apply(null, len);
    M.stats = (td.polar ? [[name(td), ph('i dag'), what(td)]]
                        : [[ph('Sola opp'), hhmm(td.rise), ph('i dag')], [ph('Sola ned'), hhmm(td.set), ph('i dag')]])
      .concat([mx >= 1440 ? polarStat(1) : [ph('Lengste dag'), lenTxt(mx), nbShort(iso(len.indexOf(mx)))],
               mn <= 0 ? polarStat(-1) : [ph('Korteste dag'), lenTxt(mn), nbShort(iso(len.indexOf(mn)))]]);
    var diff = Math.round(td.len - sunDay(place.lat, place.lon, y, 0, doy).len); // mot i går
    M.valOf = function (j) { return S[j].polar ? name(S[j]) : lenTxt(len[j]); };
    M.sub0 = span(td) + (td.polar ? '' : ' · ' + (diff ? fill(ph(diff > 0 ? '{n} min lengre enn i går' : '{n} min kortere enn i går'), { n: Math.abs(diff) })
                                                      : ph('like lang som i går')));
    M.label = function (j) { return nbShort(iso(j)) + (j === doy ? ' · ' + ph('i dag') : ''); };
    M.subOf = function (j) { return M.label(j) + ' · ' + span(S[j]); };
    M.tipV = function (j) { return S[j].polar ? name(S[j]) : hhmm(S[j].rise) + '–' + hhmm(S[j].set); };
    M.state = 'ok';
    return M;
  }

  function bigModel() {
    var k = _big.kind, r = _big.r[k];
    var M = k === 'wx' ? wxModel(r) : k === 'st' ? stModel(r) : k === 'sr' ? srModel(r) : k === 'fx' ? fxModel(r) : k === 'su' ? sunModel() : ssbModel(k, r);
    M.r = r;
    M.msg = M.state === 'load' ? ph('Henter data …') : M.state === 'err' ? ph('Kunne ikke hente data. Sjekk nettet og prøv igjen.') : M.msg;
    M.sig = [k, r, M.title || M.eye, M.foot, M.state, M.msg, M.v && M.v.join(','), M.v2 && M.v2.join(','), M.p && M.p.join(','), M.nowIdx,
             M.sub0, M.ax && M.ax.join('|'), M.sym && M.sym.join('|'), JSON.stringify(M.week || null), document.documentElement.lang].join('§');
    return M;
  }

  /* ── Dialogen: bygges ved første åpning, gjenbrukes deretter ── */
  function buildBig() {
    if (BIG) return BIG;
    var root = document.createElement('div');
    root.className = 'mdb'; root.hidden = true;
    root.innerHTML =
      '<div class="mdb-panel" role="dialog" aria-modal="true" tabindex="-1">' +
        '<span class="mdb-glow" aria-hidden="true"></span>' +
        '<div class="mdb-head">' +
          '<div class="mdb-head-l"><span class="mdb-eye"></span><div class="mdb-chips" role="group"></div></div>' +
          '<div class="mdb-head-r"><div class="mdb-seg" role="group"></div>' +
            '<button type="button" class="mdb-ib mdb-fs"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + FS_OFF + '"/></svg></button>' +
            '<button type="button" class="mdb-ib mdb-x"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="mdb-body" role="region">' +
          '<div class="mdb-hero"><span class="mdb-big"><span class="mdb-val"></span><span class="mdb-unit"></span></span><span class="mdb-sub"></span>' +
            '<span class="mdb-leg" aria-hidden="true"></span></div>' +
          '<div class="mdb-chart">' +
            '<div class="mdb-yax" aria-hidden="true"><div class="mdb-yax-in"></div></div>' +
            '<div class="mdb-pc"><div class="mdb-plot" aria-hidden="true"></div><div class="mdb-tip" aria-hidden="true"><span></span><b></b></div></div>' +
            /* data-ph-skip: etikettene skrives ferdig oversatt. Uten det gjør frase-ordboka engelske «Jul» (juli) til «Christmas». */
            '<div class="mdb-xax" aria-hidden="true" data-ph-skip></div>' +
            '<div class="mdb-state" role="status" hidden></div>' +
          '</div>' +
          '<div class="mdb-foot"><div class="mdb-stats"></div><div class="mdb-meta"><span class="mdb-src"></span><span class="mdb-keys" aria-hidden="true"></span></div></div>' +
          '<section class="wx-week" hidden><div class="wx-kicker"></div><ul class="wx-week-list"></ul></section>' +
        '</div>' +
        '<p class="sr-only" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(root);
    function q(s) { return root.querySelector(s); }
    var E = BIG = {
      root: root, panel: q('.mdb-panel'), eye: q('.mdb-eye'), chips: q('.mdb-chips'), seg: q('.mdb-seg'),
      fs: q('.mdb-fs'), x: q('.mdb-x'), body: q('.mdb-body'), val: q('.mdb-val'), unit: q('.mdb-unit'), sub: q('.mdb-sub'), leg: q('.mdb-leg'),
      chart: q('.mdb-chart'), y: q('.mdb-yax-in'), pc: q('.mdb-pc'), plot: q('.mdb-plot'), tip: q('.mdb-tip'),
      xax: q('.mdb-xax'), state: q('.mdb-state'), stats: q('.mdb-stats'), src: q('.mdb-src'), keys: q('.mdb-keys'),
      week: q('.wx-week'), weekK: q('.wx-kicker'), weekList: q('.wx-week-list'), live: q('.sr-only'), head: ''
    };
    E.fsPath = E.fs.querySelector('path');
    root.addEventListener('click', function (e) { if (e.target === root) closeBig(); });
    E.x.addEventListener('click', closeBig);
    E.fs.addEventListener('click', toggleFs);
    E.chips.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'); if (!b || !_big.kind) return;
      _big.hov = null;
      if (_big.kind === 'st') _big.zone = b.getAttribute('data-v');
      else if (_big.kind === 'df') _big.fuel = +b.getAttribute('data-v');
      else setFxCode(b.getAttribute('data-v')); // samme lagrede valg som kortet og omregneren
      bigRender(true);
    });
    E.seg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b || !_big.kind) return;
      _big.r[_big.kind] = +b.getAttribute('data-i'); _big.hov = null;
      bigRender(true);
    });
    E.state.addEventListener('click', function (e) { if (e.target.closest('.mdb-retry')) bigRetry(); });
    E.plot.addEventListener('pointermove', onPlotMove);
    E.plot.addEventListener('pointerdown', onPlotMove);
    E.plot.addEventListener('pointerleave', onPlotLeave);
    E.plot.addEventListener('pointercancel', onPlotLeave);
    document.addEventListener('fullscreenchange', syncFs);
    /* Antall akse-etiketter og døgnetikettene avhenger av bredden — tegn om etter snuing/endret vindu. */
    var rs = 0;
    window.addEventListener('resize', function () {
      if (!_big.kind) return;
      clearTimeout(rs);
      rs = setTimeout(function () { if (_big.kind) bigRender(false); }, 150);
    });
    return E;
  }

  /* Sidens globale Enter-lytter (core.js, «Enter for other calculators») kaller preventDefault
     på alt som ikke er et skjemafelt, og da trykkes ingen knapp med Enter. Enter stoppes før den
     når dit — her og i onModalKeydown — uten preventDefault, så knappens egen handling får skje. */
  function stopEnter(e) { if (e.key === 'Enter') e.stopPropagation(); }
  function wireBig() {
    var bs = document.querySelectorAll('[data-big]');
    for (var i = 0; i < bs.length; i++) {
      bs[i].addEventListener('click', function () { openBig(this.getAttribute('data-big'), this); });
      bs[i].addEventListener('keydown', stopEnter);
    }
  }

  function openBig(kind, btn) {
    var E = buildBig();
    clearTimeout(_bigT);
    _reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!_big.kind) {
      _big.ov = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden'; // siden bak står stille
      document.addEventListener('keydown', onModalKeydown, true);
    }
    _big.kind = kind; _big.hov = null; _big.ret = btn || null;
    if (kind === 'st') _big.zone = getPlace().sone || 'NO1'; // starter alltid på brukerens egen sone
    E.head = '';
    E.root.hidden = false;
    void E.root.offsetWidth; // reflow, så inn-overgangen faktisk kjører
    E.root.classList.add('in');
    E.body.scrollTop = 0;
    bigRender(true);
    var on = E.chips.querySelector('[aria-pressed="true"]');
    if (on) E.chips.scrollLeft = Math.max(0, on.offsetLeft - (E.chips.clientWidth - on.offsetWidth) / 2);
    try { E.panel.focus({ preventScroll: true }); } catch (e) { E.panel.focus(); }
  }

  function closeBig() {
    if (!_big.kind) return;
    var E = BIG, ret = _big.ret;
    _big.kind = null; _big.hov = null; _big.M = null; _big.sig = '';
    document.removeEventListener('keydown', onModalKeydown, true);
    if (document.fullscreenElement && document.exitFullscreen) { var p = document.exitFullscreen(); if (p && p.catch) p.catch(function () {}); }
    cancelAnimationFrame(_rvF);
    E.root.classList.remove('in');
    document.documentElement.style.overflow = _big.ov || '';
    _bigT = setTimeout(function () { if (!_big.kind) E.root.hidden = true; }, _reduce ? 0 : 280);
    if (ret && ret.focus) { try { ret.focus({ preventScroll: true }); } catch (e) { ret.focus(); } }
  }

  /* Tastatur mens dialogen er åpen: Esc lukker, ← → / Home End blar i punktene,
     F slår nettleserens fullskjerm av og på, Tab holdes inne i dialogen.
     Lytter i fangstfasen, så sidens egne snarveier (/ og Ctrl+K til søket)
     ikke flytter fokus til siden bak. */
  function onModalKeydown(e) {
    if (!_big.kind) return;
    var k = e.key;
    if (k === 'Escape') { e.preventDefault(); closeBig(); return; }
    if (k === 'Tab') { trapTab(e); return; }
    if (k === 'Enter') { stopEnter(e); return; }
    if (k === '/' || ((e.metaKey || e.ctrlKey) && String(k).toLowerCase() === 'k')) { e.preventDefault(); e.stopPropagation(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); nudge(k === 'ArrowLeft' ? -1 : 1); }
    else if (k === 'Home' || k === 'End') { e.preventDefault(); nudge(k === 'Home' ? -1e9 : 1e9); }
    else if ((k === 'f' || k === 'F') && fsOk()) { e.preventDefault(); toggleFs(); }
  }
  function trapTab(e) {
    var f = BIG.panel.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])'), list = [];
    for (var i = 0; i < f.length; i++) if (f[i].offsetParent !== null && !f[i].disabled) list.push(f[i]);
    if (!list.length) { e.preventDefault(); return; }
    var first = list[0], last = list[list.length - 1], a = document.activeElement;
    if (list.indexOf(a) < 0) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }

  /* Hele siden går i fullskjerm (ikke bare dialogen), så nordlyset fortsatt lyser bak glasset. */
  function fsOk() { return !!document.documentElement.requestFullscreen; }
  function toggleFs() {
    if (document.fullscreenElement) { if (document.exitFullscreen) { var p = document.exitFullscreen(); if (p && p.catch) p.catch(function () {}); } }
    else if (fsOk()) { var q = document.documentElement.requestFullscreen(); if (q && q.catch) q.catch(function () {}); }
  }
  function syncFs() {
    var E = BIG; if (!E) return;
    var on = !!document.fullscreenElement, l = on ? ph('Avslutt fullskjerm') : ph('Fullskjerm (F)');
    E.root.classList.toggle('is-fs', on);
    E.fs.hidden = !fsOk();
    E.fs.setAttribute('aria-label', l); E.fs.title = l;
    E.fsPath.setAttribute('d', on ? FS_ON : FS_OFF);
  }

  /* Temperaturkurven: monoton kubisk interpolasjon (Fritsch–Carlson). Går gjennom alle punktene
     og svinger aldri over eller under dem — en vanlig glattet spline tegner topper og bunner
     som ikke finnes i varselet. */
  function curvePath(pts) {
    var n = pts.length, dx = [], s = [], m = [], i;
    if (n < 3) return linePath(pts);
    for (i = 0; i < n - 1; i++) { dx[i] = (pts[i + 1][0] - pts[i][0]) || 0.001; s[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
    m[0] = s[0]; m[n - 1] = s[n - 2];
    for (i = 1; i < n - 1; i++) m[i] = s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (s[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      var a = m[i] / s[i], b = m[i + 1] / s[i], h = Math.sqrt(a * a + b * b);
      if (h > 3) { m[i] = 3 / h * a * s[i]; m[i + 1] = 3 / h * b * s[i]; }
    }
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (i = 0; i < n - 1; i++) {
      var c = dx[i] / 3;
      d += ' C' + (pts[i][0] + c).toFixed(1) + ',' + (pts[i][1] + m[i] * c).toFixed(1) + ' ' +
           (pts[i + 1][0] - c).toFixed(1) + ',' + (pts[i + 1][1] - m[i + 1] * c).toFixed(1) + ' ' +
           pts[i + 1][0].toFixed(1) + ',' + pts[i + 1][1].toFixed(1);
    }
    return d;
  }
  /* «Pene» akseverdier: trinn på 1 · 2 · 2,5 · 5 × 10^k som dekker [mn, mx].
     dec = antall desimaler trinnet trenger (2,5 → 1, 25 → 0). */
  function ticks(mn, mx, want) {
    var span = (mx - mn) || Math.abs(mx) || 1, p = Math.pow(10, Math.floor(Math.log(span / want) / Math.LN10));
    var steps = [1, 2, 2.5, 5, 10], step = 10 * p;
    for (var i = 0; i < steps.length; i++) if (span / (steps[i] * p) <= want) { step = steps[i] * p; break; }
    var lo = Math.floor(mn / step + 1e-9) * step, hi = Math.ceil(mx / step - 1e-9) * step, arr = [];
    for (var v = lo; v <= hi + step / 2; v += step) arr.push(+v.toFixed(6));
    return { lo: arr[0], hi: arr[arr.length - 1], arr: arr, step: step, dec: (String(+step.toFixed(6)).split('.')[1] || '').length };
  }

  /* Topplinja: serie-brikker og tidsrom bygges bare når graf eller språk byttes
     (ellers mister en tastaturbruker fokus på knappen hen nettopp trykket). */
  function renderHead(M) {
    var E = BIG, k = _big.kind, key = k + '|' + document.documentElement.lang;
    if (E.head !== key) {
      E.head = key;
      E.chips.innerHTML = (M.chips || []).map(function (c) {
        return '<button type="button" class="mdb-chip" data-v="' + c[0] + '" aria-pressed="false">' + esc(c[1]) + '</button>';
      }).join('');
      E.seg.innerHTML = RANGES[k].map(function (l, i) {
        return '<button type="button" data-i="' + i + '" aria-pressed="false">' + esc(ph(l)) + '</button>';
      }).join('');
      E.seg.setAttribute('aria-label', ph('Tidsrom'));
      E.seg.hidden = !RANGES[k].length;
      E.x.setAttribute('aria-label', ph('Lukk')); E.x.title = ph('Lukk (Esc)');
      E.keys.innerHTML = '<kbd>←</kbd><kbd>→</kbd><span>' + esc(ph('bla')) + '</span><kbd>Esc</kbd><span>' + esc(ph('lukk')) + '</span>' +
        (fsOk() ? '<kbd>F</kbd><span>' + esc(ph('fullskjerm')) + '</span>' : '');
      E.weekK.textContent = ph('Neste 7 dager');
    }
    E.chips.hidden = !M.chips;
    if (M.chips) {
      E.chips.setAttribute('aria-label', M.chipLbl);
      for (var i = 0; i < M.chips.length; i++) E.chips.children[i].setAttribute('aria-pressed', M.chips[i][2] ? 'true' : 'false');
    }
    for (var j = 0; j < E.seg.children.length; j++) E.seg.children[j].setAttribute('aria-pressed', j === M.r ? 'true' : 'false');
    syncFs();
  }

  /* Full tegning: topplinje, tall, akser, graf, nøkkeltall og kilde. anim = la linja
     feie inn og søylene reise seg (ved åpning og bytte av serie/tidsrom). */
  function bigRender(anim, M) {
    var E = BIG;
    M = M || bigModel();
    _big.M = M; _big.sig = M.sig;
    if (_big.hov != null && (M.state !== 'ok' || _big.hov >= M.n)) _big.hov = null;
    E.panel.setAttribute('aria-label', M.title || M.eye);
    E.eye.textContent = M.eye;
    renderHead(M);
    E.unit.textContent = M.unit;
    E.src.textContent = M.foot;
    var ok = M.state === 'ok';
    E.state.hidden = ok;
    /* Forklaring til linjene: a = linja i farge, n = stiplet i farge (nominell), c = den grå å måle mot, r = stiplet. */
    E.leg.hidden = !(ok && M.leg);
    E.leg.innerHTML = ok && M.leg ? M.leg.map(function (l) { return '<span class="is-' + l[0] + '"><i></i>' + esc(l[1]) + '</span>'; }).join('') : '';
    if (ok) drawChart(M, anim && !_reduce);
    else {
      E.plot.innerHTML = ''; E.y.innerHTML = ''; E.xax.innerHTML = ''; E.stats.innerHTML = '';
      E.val.textContent = '–'; E.sub.textContent = '';
      E.state.innerHTML = '<p>' + esc(M.msg) + '</p>' +
        (M.state === 'err' ? '<button type="button" class="mdb-retry">' + esc(ph('Prøv igjen')) + '</button>' : '');
    }
    var wk = M.kind === 'wx' && M.week && M.week.length;
    E.week.hidden = !wk;
    E.body.classList.toggle('has-week', !!wk);
    if (wk) renderWeek(M.week);
    /* Ruller innholdet (lav skjerm, stor zoom), må tastaturet kunne nå det med Tab og rulle med piltastene. */
    E.body.tabIndex = E.body.scrollHeight > E.body.clientHeight + 1 ? 0 : -1;
    E.body.setAttribute('aria-label', M.title || M.eye);
    bigSelect();
  }

  function drawChart(M, anim) {
    /* Skalaen dekker også linja det måles mot og den stiplede linja (målet for prisveksten). */
    var E = BIG, v = M.v, n = M.n, all = v, T;
    if (M.v2 && !M.band) all = all.concat(M.v2.filter(function (x) { return x != null; }));
    if (M.v3) all = all.concat(M.v3);
    if (M.avg) all = all.concat(M.avgV);
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
    if (M.T) T = M.T; // fast akse (døgnet, 00–24)
    else if (M.line) {
      /* Litt luft over og under linja, men aldri under null for serier som ikke kan bli negative. */
      T = ticks(mn, mx, 4);
      if (mn - T.lo < T.step * 0.2 && !(mn >= 0 && T.lo - T.step < 0)) T.arr.unshift(T.lo = +(T.lo - T.step).toFixed(6));
      if (T.hi - mx < T.step * 0.2) T.arr.push(T.hi = +(T.hi + T.step).toFixed(6));
    } else T = ticks(Math.min(0, mn), Math.max(0, mx), 4); // søyler står alltid på null — også når prisen er negativ
    var span = (T.hi - T.lo) || 1;
    function Y(x) { return (1 - (x - T.lo) / span) * 400; }
    function X(i) { return M.line ? (n > 1 ? i / (n - 1) * 1000 : 500) : (i + 0.5) / n * 1000; }
    function sx(i) { return M.line ? X(i) : i / n * 1000; } // døgnskille: mellom to søyler
    M.X = X; M.Y = Y;

    /* Snitt-merket står i samme kolonne som akseverdiene: en verdi under 16 px fra det skjules. */
    var yl = '', grid = '', hpx = E.plot.clientHeight, ayv = M.avg ? Y(M.avgV) : null;
    T.arr.forEach(function (t) {
      var y = Y(t).toFixed(1), hid = ayv != null && Math.abs(Y(t) - ayv) / 400 * hpx < 16;
      yl += '<span class="mdb-yl" style="top:' + pctY(y) + (hid ? ';visibility:hidden' : '') + '">' + (M.yFmt ? M.yFmt(t) : nb(t, T.dec)) + '</span>';
      grid += '<line class="' + (t === 0 && T.lo < 0 ? 'z' : 'g') + '" x1="0" y1="' + y + '" x2="1000" y2="' + y + '"/>';
    });
    grid += '<line class="b" x1="0" y1="399.5" x2="1000" y2="399.5"/>';
    var nowLine = M.nowIdx != null && (!M.line || M.band); // strek og etikett ved «nå» (strøm) og «i dag» (dagslys)
    if (nowLine) { var nx = X(M.nowIdx).toFixed(1); grid += '<line class="nw" x1="' + nx + '" y1="0" x2="' + nx + '" y2="400"/>'; }

    /* Døgnskiller (midnatt i værvarselet, hver dag i ukesvisningen) — annenhver dag får et svakt bånd. */
    var edges = [0], bands = '', days = '';
    M.seps.forEach(function (s) {
      edges.push(sx(s[0]));
      days += '<span class="mdb-day' + (s[1] ? ' has-l' : '') + '" style="left:' + pct(sx(s[0])) + '">' + (s[1] ? '<span>' + esc(s[1]) + '</span>' : '') + '</span>';
    });
    edges.push(1000);
    for (var j = 1; j < edges.length - 1; j += 2) bands += '<span class="mdb-band" style="left:' + pct(edges[j]) + ';width:' + pct(edges[j + 1] - edges[j]) + '"></span>';

    var html = bands +
      '<svg class="mdb-svg mdb-grid" viewBox="0 0 1000 400" preserveAspectRatio="none">' + grid + '</svg>' + days;
    if (M.line) {
      /* Temperatur er en jevn størrelse og tegnes som kurve; dagskurser er enkeltmålinger
         og tegnes rett fra punkt til punkt. */
      var pts = v.map(function (x, i) { return [X(i), Y(x)]; }), p2 = M.v2 && M.v2.map(function (x, i) { return [X(i), Y(x || 0)]; });
      var line = M.kind === 'wx' ? curvePath(pts) : M.band ? segPath(pts, M.has2) + ' ' + segPath(p2, M.has2) : linePath(pts);
      /* Ensfarget felt: under linja ned til bunnen, eller mellom de to kantene (dagslyset). */
      var area = M.band ? linePath(pts) + ' L' + linePath(p2.slice().reverse()).slice(1) + ' Z' : M.area ? line + ' L1000,400 L0,400 Z' : '';
      var cmp = p2 && !M.band ? segPath(p2, M.has2) : '';
      var rain = '', syms = '', notes = '';
      if (M.band) {
        /* «Sola ned» over øvre kant og «Sola opp» under nedre, helt til venstre der feltet er smalest.
           Høyden tas fra dagene teksten dekker (ca. 70 px), så den aldri ligger oppå kanten. */
        var nd = Math.min(n, Math.ceil(70 / (E.plot.clientWidth || 600) * n) + 1);
        notes = '<span class="mdb-note is-up" style="top:' + pctY(Y(Math.max.apply(null, v.slice(0, nd)))) + '">' + esc(M.notes[0]) + '</span>' +
                '<span class="mdb-note" style="top:' + pctY(Y(Math.min.apply(null, M.v2.slice(0, nd)))) + '">' + esc(M.notes[1]) + '</span>';
      }
      if (M.p) {
        /* Nedbør nederst: høyden skaleres mot minst 2 mm/t, så yr ikke ser ut som styrtregn.
           Søyla står midt i timen den gjelder (fra punktet til neste); siste punkt er periodens slutt. */
        var pmax = Math.max(2, Math.max.apply(null, M.p)), hw = 1000 / (n - 1);
        M.p.forEach(function (mm, i) {
          if (mm > 0 && i < n - 1) rain += '<span class="mdb-rain" style="left:' + pct(X(i) + hw / 2) + ';width:calc(' + (62 / (n - 1)).toFixed(3) + '% - 1px);height:' + (mm / pmax * 22).toFixed(2) + '%"></span>';
        });
      }
      /* Værsymbolene følger temperaturkurven, like over punktet de gjelder. */
      (M.sym || []).forEach(function (s) {
        syms += '<span class="mdb-sym" style="left:' + pct(X(s[0])) + ';top:' + pctY(Y(v[s[0]])) + '">' + wxIcon(s[1]) + '</span>';
      });
      /* To kopier av linja: én dempet, én klippet ved pekeren — slik blir alt til høyre for pekeren dempet. */
      html += '<div class="mdb-rev">' + rain +
        '<svg class="mdb-svg mdb-line" viewBox="0 0 1000 400" preserveAspectRatio="none"><defs>' +
          '<clipPath id="mdbCutL"><rect class="mdb-cut" x="-40" y="-80" width="1200" height="560"/></clipPath></defs>' +
          (area ? '<path class="mdb-area" d="' + area + '"/>' : '') + (cmp ? '<path class="mdb-cmp" d="' + cmp + '"/>' : '') +
          (M.v3 ? '<path class="mdb-nom" d="' + linePath(M.v3.map(function (x, i) { return [X(i), Y(x)]; })) + '"/>' : '') +
          '<path class="mdb-dim" d="' + line + '"/><path d="' + line + '" clip-path="url(#mdbCutL)"/></svg>' +
        syms + notes + '</div>';
    } else {
      /* Søyler fra nullinja: positive opp, negative ned. Passerte timer er dempet (velges en
         av dem, vises den i full farge), og billigste time har egen farge — som på kortet. */
      var zy = Y(0), thin = n > 48, bars = '';
      v.forEach(function (x, i) {
        var top = x >= 0 ? Y(x) : zy, h = Math.abs(Y(x) - zy);
        if (h < 2.4) { h = 2.4; if (x >= 0) top = zy - 2.4; }
        var past = M.nowIdx != null && i < M.nowIdx, neg = x < 0;
        bars += '<span class="mdb-bar' + (past ? ' is-past' : '') + (neg ? ' is-neg' : '') + (thin ? ' is-thin' : '') + (i === M.lowIdx ? ' is-low' : '') + '" style="left:' +
          (thin ? (i / n * 100).toFixed(4) + '%;width:calc(' + (100 / n).toFixed(4) + '% - var(--bgap))' : ((i + 0.07) / n * 100).toFixed(4) + '%;width:' + (86 / n).toFixed(4) + '%') +
          ';top:' + pctY(top) + ';height:' + pctY(h) +
          ';--d:' + (120 + Math.round(i / n * 420)) + 'ms"></span>';
      });
      html += '<div class="mdb-bars">' + bars + '</div>';
    }
    var tags = '';
    if (M.avg) {
      var ay = pctY(Y(M.avgV));
      html += '<span class="mdb-avg" style="top:' + ay + '"></span>';
      tags += '<span class="mdb-tag is-avg" style="top:' + ay + '"><b>' + nb(M.avgV, M.ydec) + '</b></span>';
    }
    /* Den andre linja får sitt eget punkt; dagslyset får også klokkeslettet for soloppgang på y-aksen. */
    html += '<span class="mdb-vx"></span><span class="mdb-hx"></span><span class="mdb-dot"></span>' +
      (M.v2 ? '<span class="mdb-dot mdb-dot2' + (M.band ? '' : ' is-cmp') + '"></span>' : '') +
      tags + '<span class="mdb-tag mdb-ytag"><b></b></span>' + (M.band ? '<span class="mdb-tag mdb-ytag mdb-ytag2"><b></b></span>' : '');
    if (nowLine) html += '<span class="mdb-now" style="left:' + pct(X(M.nowIdx)) + '">' + esc(M.nowLbl || ph('Nå')) + '</span>';

    if (anim) E.chart.classList.add('mdb-pre'); // startpunktet for inn-animasjonen, satt FØR nye noder tegnes
    E.y.innerHTML = yl;
    E.plot.innerHTML = html;
    E.xax.innerHTML = M.ax.map(function (a) {
      var x = X(a[0]), al = x < 30 ? 0 : x > 970 ? 2 : 1;
      return '<span class="mdb-xl" style="left:' + pct(x) + ';transform:translateX(' + ['0', '-50%', '-100%'][al] + ')">' + esc(a[1]) +
        '<i style="left:' + ['0%', '50%', '100%'][al] + '"></i></span>';
    }).join('');
    E.stats.innerHTML = M.stats.map(function (s) {
      return '<div class="mdb-stat"><span>' + esc(s[0]) + '</span><div><b>' + esc(s[1]) + '</b><small>' + esc(s[2]) + '</small></div></div>';
    }).join('');
    /* Døgnetiketten som ikke får plass til høyre for streken, settes på venstre side. */
    var pr = E.plot.getBoundingClientRect().right, dl = E.plot.querySelectorAll('.mdb-day > span');
    for (var di = 0; di < dl.length; di++) if (dl[di].getBoundingClientRect().right > pr) dl[di].parentNode.classList.add('is-flip');
    function q(s) { return E.plot.querySelector(s); }
    E.cuts = E.plot.querySelectorAll('.mdb-cut'); E.bars = E.plot.querySelectorAll('.mdb-bar'); E.selBar = null;
    E.vx = q('.mdb-vx'); E.hx = q('.mdb-hx'); E.dot = q('.mdb-dot'); E.ytag = q('.mdb-ytag');
    E.dot2 = q('.mdb-dot2'); E.ytag2 = q('.mdb-ytag2');
    cancelAnimationFrame(_rvF);
    if (anim) {
      void E.chart.offsetWidth;
      _rvF = requestAnimationFrame(function () { _rvF = requestAnimationFrame(function () { E.chart.classList.remove('mdb-pre'); }); });
    } else E.chart.classList.remove('mdb-pre');
  }

  /* Valgt punkt: under pekeren/piltasten, ellers modellens standardpunkt (nå / siste kurs).
     Flytter bare markørene — grafen tegnes ikke på nytt mens pekeren beveger seg. */
  function bigSelect() {
    var E = BIG, M = _big.M; if (!E || !M) return;
    var H = _big.hov, hov = H != null, sel = hov ? H : M.def;
    E.plot.classList.toggle('is-hov', hov);
    E.tip.classList.toggle('is-on', hov && M.state === 'ok');
    if (M.state !== 'ok') return;
    E.val.textContent = sel != null ? M.valOf(sel) : M.val0;
    E.sub.textContent = hov ? M.subOf(H) : M.sub0;
    if (E.selBar) E.selBar.classList.remove('on');
    E.selBar = null;
    function vis(el, on) { el.classList.toggle('is-on', !!on); }
    var cx = sel != null ? M.X(sel) : 0;
    /* on2: den andre verdien finnes i dette punktet. I dagslyset (band) gjelder det begge kantene:
       i mørketid og midnattssol er det verken punkter eller klokkeslett å vise. */
    var on2 = sel != null && !!M.v2 && M.has2(sel), on1 = sel != null && (!M.band || on2);
    for (var i = 0; i < E.cuts.length; i++) E.cuts[i].setAttribute('width', hov && M.line && !M.band ? (cx + 40).toFixed(1) : '1200');
    vis(E.vx, hov && M.line); vis(E.hx, hov && !M.band); vis(E.ytag, hov && on1);
    vis(E.dot, on1 && M.line);
    if (E.dot2) vis(E.dot2, on2);
    if (E.ytag2) vis(E.ytag2, hov && on2);
    if (sel == null) return;
    var cy = M.Y(M.v[sel]), L = pct(cx), Tp = pctY(cy), dd = (0.2 + cx / 1000 * 0.6).toFixed(2) + 's';
    E.vx.style.left = E.dot.style.left = L;
    E.hx.style.top = E.dot.style.top = E.ytag.style.top = Tp;
    E.dot.style.setProperty('--dd', dd);
    if (on1) E.ytag.firstChild.textContent = M.tagOf ? M.tagOf(sel) : nb(M.v[sel], M.ydec);
    if (on2) {
      var T2 = pctY(M.Y(M.v2[sel]));
      E.dot2.style.left = L; E.dot2.style.top = T2; E.dot2.style.setProperty('--dd', dd);
      if (E.ytag2) { E.ytag2.style.top = T2; E.ytag2.firstChild.textContent = M.tagOf(sel, 1); }
    }
    if (!M.line && E.bars[sel]) { E.selBar = E.bars[sel]; E.selBar.classList.add('on'); }
    if (hov) {
      E.tip.firstChild.textContent = M.label(H);
      E.tip.lastChild.textContent = M.tipV(H);
      /* Holdes innenfor grafen; kan stikke inn over Y-aksen til venstre (56 px). */
      var w = E.pc.clientWidth, tw = E.tip.offsetWidth;
      E.tip.style.left = Math.max(tw / 2 - 56, Math.min(w - tw / 2, cx / 1000 * w)) + 'px';
    }
  }

  /* Minutt-pulsen og nye data: tegn bare om når modellen faktisk er endret.
     Inn-animasjonen spilles bare når grafen går fra «henter»/feil til data. */
  function bigRefresh() {
    if (!_big.kind || !BIG) return;
    var M = bigModel();
    if (M.sig === _big.sig) return;
    bigRender(!_big.M || _big.M.state !== 'ok', M);
  }

  function nudge(d) {
    var M = _big.M; if (!M || M.state !== 'ok') return;
    var cur = _big.hov != null ? _big.hov : M.def != null ? M.def : (d > 0 ? -1 : M.n);
    _big.hov = Math.max(0, Math.min(M.n - 1, cur + d));
    bigSelect();
    BIG.live.textContent = M.label(_big.hov) + ': ' + M.tipV(_big.hov);
  }
  function onPlotMove(e) {
    var M = _big.M; if (!M || M.state !== 'ok') return;
    var r = BIG.plot.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
    var i = M.line ? Math.round(f * (M.n - 1)) : Math.min(M.n - 1, Math.floor(f * M.n));
    if (i !== _big.hov) { _big.hov = i; bigSelect(); }
  }
  function onPlotLeave() { if (_big.hov != null) { _big.hov = null; bigSelect(); } }

  function bigRetry() {
    var k = _big.kind;
    if (k === 'wx') { _wxFail = false; loadWeather(getPlace(), true); }
    else if (k === 'st') { for (var key in _stDays) if (_stDays[key].d === false) delete _stDays[key]; }
    else if (k === 'sr') _srLFail = 0;
    else if (k === 'fx') delete _fxYFail[_fxCode];
    else delete _ssbLFail[k];
    bigRender(true);
    BIG.panel.focus(); // knappen forsvant med feilmeldingen
  }

  /* Neste 7 dager (under grafen i værvisningen): typografisk tabell (dag · symbol · maks/min-stolpe · temp). */
  function renderWeek(wk) {
    var wsig = JSON.stringify(wk) + document.documentElement.lang;
    if (wsig === _weekSig) return; // uendret ukesvarsel (minutt-puls) — ikke bygg på nytt
    _weekSig = wsig;
    var gMin = Infinity, gMax = -Infinity;
    wk.forEach(function (w) { if (w.min < gMin) gMin = w.min; if (w.max > gMax) gMax = w.max; });
    var gRng = (gMax - gMin) || 1, html = '';
    wk.forEach(function (w, i) {
      var name = i === 0 ? ph('I dag') : ph(DAGER_FULL[w.dow]);
      var L = (w.min - gMin) / gRng * 100, Wd = (w.max - w.min) / gRng * 100;
      if (Wd < 4) Wd = 4;
      html += '<li class="wx-week-row' + (i === 0 ? ' is-today' : '') + '">' +
        '<span class="wx-week-day">' + name + '</span>' +
        '<span class="wx-week-ico">' + wxIcon(w.sym) + '</span>' +
        '<span class="wx-week-range"><i style="left:' + L.toFixed(1) + '%;width:' + Wd.toFixed(1) + '%"></i></span>' +
        '<span class="wx-week-t">' + Math.round(w.max) + '°<span class="sl">/</span><span class="mn">' + Math.round(w.min) + '°</span></span>' +
        '</li>';
    });
    BIG.weekList.innerHTML = html;
  }

  /* ════════════════════ VALUTA (Norges Bank EXR) ═════════════════════ */
  function parseExr(j) {
    var st = j.data.structure, dims = st.dimensions.series;
    var basePos = dims.findIndex(function (d) { return d.id === 'BASE_CUR'; });
    var baseVals = dims[basePos].values.map(function (v) { return v.id; });
    var aDefs = st.attributes.series || [];
    var umPos = aDefs.findIndex(function (a) { return a.id === 'UNIT_MULT'; });
    var umVals = umPos >= 0 ? aDefs[umPos].values.map(function (v) { return v.id; }) : null;
    var obsTimes = (st.dimensions.observation[0].values || []).map(function (v) { return v.id; });
    var series = j.data.dataSets[0].series, out = {};
    for (var key in series) {
      var idx = key.split(':').map(Number), cur = baseVals[idx[basePos]], ser = series[key];
      var mult = 1;
      if (umVals && ser.attributes) { var um = umVals[ser.attributes[umPos]]; mult = Math.pow(10, parseInt(um, 10) || 0); }
      var ok = Object.keys(ser.observations).sort(function (a, b) { return a - b; });
      var vals = ok.map(function (k) { return parseFloat(ser.observations[k][0]) / mult; });
      var dates = ok.map(function (k) { return obsTimes[parseInt(k, 10)]; });
      /* mult = Norges Banks noteringsenhet (SEK/DKK/JPY noteres per 100).
         Verdiene lagres per 1 enhet; mult tas vare på så etikettene kan
         sitere i bankens egen enhet («100 JPY 7,02») i stedet for «0,07». */
      out[cur] = { last: vals[vals.length - 1], prev: vals[vals.length - 2], series: vals, dates: dates, mult: mult };
    }
    return out;
  }
  /* Y-akse-tall: aldri mer enn fem tegn, ellers sprenger de margen.
     9,94 · 100,3 · 1174 — presisjonen som får plass, ikke mer. */
  function axNum(v) { return nb(v, v >= 1000 ? 0 : v >= 100 ? 1 : 2); }
  /* «SEK» → «100 SEK» når banken noterer per 100. */
  function fxUnit(c, code) { var m = (c && c.mult) || 1; return (m > 1 ? m + ' ' : '') + code; }
  function fxQuote(c, dec) { return nb(c.last * ((c && c.mult) || 1), dec == null ? 2 : dec); }
  function renderFx(d) {
    var code = _fxCode, c = d[code];
    if (!c) { code = 'USD'; c = d.USD; }   // valgt valuta manglet i feeden
    if (!c) return;
    var m = c.mult || 1;
    /* Tall og etikett siteres i Norges Banks egen noteringsenhet, slik at
       yen står som «100 JPY = 7,02» og ikke «1 JPY = 0,07». */
    setText('fxPairName', fxUnit(c, code) + ' / NOK');
    setVal('fxVal', c.last * m, 2);
    /* Faktaradene viser de tre neste i lista — den valgte står i tallet over. */
    var sub = [];
    FX_CODES.forEach(function (k) {
      if (k === code || sub.length >= 3) return;
      var o = d[k]; if (o) sub.push([fxUnit(o, k), fxQuote(o)]);
    });
    setFacts('fxSub', sub);
    setText('fxLine', sub.map(function (r) { return r[0] + ' ' + r[1]; }).join(' · ')); // Carbon på telefon
    var span = $('fxTrend');
    if (span && c.prev != null) {
      var diff = (c.last - c.prev) * m, dir = Math.abs(diff) < 0.0005 ? 0 : diff > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), 2) + '<i> kr</i></span>';
    }
    var dts = c.dates;
    if (dts && dts.length) {
      var lastI = dts.length - 1;
      setText('fxAx0', nbShort(dts[0]));
      setText('fxAx1', nbShort(dts[Math.round(lastI / 2)]));
      setText('fxAx2', dts[lastI] === isoDay(new Date()) ? ph('i dag') : nbShort(dts[lastI])); // Norges Bank publiserer ~kl. 16
    }
    /* Y-akse. Kurven autoskalerer mellom periodens laveste og høyeste verdi,
       så uten disse to tallene er den umulig å måle. Samme noteringsenhet
       som tallet over («100 JPY»), ellers ville aksen sagt 0,06. */
    if (c.series && c.series.length) {
      setText('fxYMax', axNum(Math.max.apply(null, c.series) * m));
      setText('fxYMin', axNum(Math.min.apply(null, c.series) * m));
    }
    applySpark($('fxCard'), c.series);
    _fx = d; renderConv();
    stampNow();
  }
  function loadFx(force) {
    var c = cacheGet('fx');
    /* 1 t TTL (var 6 t): Norges Bank publiserer ~16:00 — med minutt-pulsen
       plukkes ny dagskurs opp senest en time etter publisering. */
    if (!force && fresh(c, 3600 * 1000)) { _got.fx = c.t; renderFx(c.d); return; }
    if (c) { _got.fx = c.t; renderFx(c.d); }
    fetch('https://data.norges-bank.no/api/data/EXR/B.USD+EUR+GBP+SEK+DKK+CHF+JPY+PLN.NOK.SP?lastNObservations=30&format=sdmx-json&locale=en')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var d = parseExr(j); cacheSet('fx', d); _got.fx = Date.now(); renderFx(d); })
      .catch(function () {});
  }

  /* ═══════════════════ STYRINGSRENTE (Norges Bank IR) ════════════════ */
  function parseRate(j) {
    var st = j.data.structure, times = st.dimensions.observation[0].values.map(function (v) { return v.id; });
    var series = j.data.dataSets[0].series, key = Object.keys(series)[0], obs = series[key].observations;
    var ok = Object.keys(obs).sort(function (a, b) { return a - b; });
    var vals = ok.map(function (k) { return parseFloat(obs[k][0]); });
    var dates = ok.map(function (k) { return times[parseInt(k, 10)]; });
    // når begynte gjeldende nivå?
    var last = vals[vals.length - 1], ci = vals.length - 1;
    while (ci > 0 && vals[ci - 1] === last) ci--;
    return { series: vals, dates: dates, last: last, lastDate: dates[dates.length - 1],
             changeDate: dates[ci], prevLevel: ci > 0 ? vals[ci - 1] : last };
  }
  var _rate = null; // siste rentedata — scrub-chipen leser herfra, og fullskjermgrafen legger til dager tiårsserien mangler
  function renderRate(d) {
    _rate = d;
    setVal('srVal', d.last, 2);
    var rows = [[ph('Sist endret'), nbDate(d.changeDate)]];
    /* Neste rentemøte og hvor lenge det er til. Når møtelista er tom, faller de to radene bort. */
    var nm = nextMeeting(), when = '';
    if (nm) {
      rows.push([ph('Neste rentemøte'), nbDate(nm)]);
      var t = new Date(), md = nm.split('-').map(Number);
      var days = Math.round((Date.UTC(md[0], md[1] - 1, md[2]) -
                             Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
      when = days > 1 ? fill(T('trSharedInDays', 'om {n} dager'), { n: days }) : ph(days === 1 ? 'i morgen' : 'i dag');
      rows.push([ph('Møtet er'), when]);
    }
    setFacts('srSub', rows);
    /* Carbon på telefon (index.html, #carbonMobil): én linje, og neste rentemøte i stedet for grafen. */
    setText('srLine', 'Norges Bank · ' + ph('sist endret') + ' ' + nbDate(d.changeDate));
    var nv = $('srNext'), nl = $('srNextLbl');
    if (nv && nl) {
      var wrap = nv.closest('.sr-next-wrap');
      if (wrap) wrap.style.display = nm ? '' : 'none'; // ellers står en tom rute igjen i Carbon
      nl.textContent = nm ? ph('Neste rentemøte') : '';
      nv.textContent = nm ? nbShort(nm) + ' ' + nm.slice(0, 4) : '';
      if (nm) {
        var s = document.createElement('span');
        s.className = 'in-days'; s.textContent = when;
        nv.appendChild(document.createTextNode(' ')); // skiller ordene for skjermlesere
        nv.appendChild(s);
      }
    }
    var span = $('srTrend');
    if (span) {
      var diff = d.last - d.prevLevel, dir = Math.abs(diff) < 0.001 ? 0 : diff > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), 2) + '<i>\u00a0pp</i></span>';
    }
    /* Renta de siste 18 månedene som trappelinje. Aksen viser høyeste og laveste nivå i
       perioden; har renta stått stille hele tiden, er det bare ett nivå å vise. */
    if (d.series && d.series.length > 1) {
      var mx = Math.max.apply(null, d.series), mn = Math.min.apply(null, d.series);
      setText('srYMax', mx > mn ? nb(mx, 2) : ''); setText('srYMin', nb(mn, 2));
      setText('srAx0', d.dates && d.dates[0] ? monthLbl(d.dates[0]) : ''); // eldre cache mangler datoene
      setText('srAx1', ph('i dag'));
      applySpark($('srCard'), d.series);
    }
    stampNow();
  }
  function loadRate(force) {
    var c = cacheGet('rate');
    if (!force && fresh(c, 3600 * 1000)) { _got.sr = c.t; renderRate(c.d); return; } // 1 t TTL (var 12 t)
    if (c) { _got.sr = c.t; renderRate(c.d); }
    var start = new Date(Date.now() - 18 * 30 * 864e5).toISOString().slice(0, 10);
    fetch('https://data.norges-bank.no/api/data/IR/B.KPRA.SD.R?startPeriod=' + start + '&format=sdmx-json&locale=en')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var d = parseRate(j); cacheSet('rate', d); _got.sr = Date.now(); renderRate(d); })
      .catch(function () {});
  }

  /* ═══════════════════ STRØM (hvakosterstrømmen.no) ══════════════════ */
  /* Dager med sommertid-skifte har 23 eller 25 timer, så plassen i lista er ikke
     klokketimen. d.ts = time_start per time: «nå» er siste time som har startet,
     og timeetiketten leses fra time_start. Cache uten ts faller tilbake til indeks. */
  function stromIdx(d) {
    var n = d.prices.length, i = n - 1, now = Date.now();
    if (!d.ts) return Math.min(new Date().getHours(), n - 1);
    while (i > 0 && Date.parse(d.ts[i]) > now) i--;
    return i;
  }
  function stromHH(d, i) { return d.ts && d.ts[i] ? String(d.ts[i]).slice(11, 13) : pad2(i); }
  function renderStrom(d, sone) {
    /* «Nå»-timen beregnes ved render (ikke ved fetch) — cachet dagsdata skal
       ikke vise forrige times pris når panelet står åpent over et timeskifte
       eller siden åpnes med gammel cache. */
    if (d.prices && d.prices.length) {
      d.hour = stromIdx(d);
      d.now = d.prices[d.hour];
    }
    setText('stSone', 'Strøm ' + sone);
    setVal('stVal', Math.round(d.now * 100), 0);
    // Utled billigste time defensivt (eldre cache fra forrige versjon mangler feltet).
    if (typeof d.cheapHour !== 'number' && d.prices) {
      d.cheapHour = 0;
      for (var ci = 1; ci < d.prices.length; ci++) if (d.prices[ci] < d.prices[d.cheapHour]) d.cheapHour = ci;
      d.cheap = d.prices[d.cheapHour];
    }
    var pk = 0;
    if (d.prices) for (var pi = 1; pi < d.prices.length; pi++) if (d.prices[pi] > d.prices[pk]) pk = pi;
    function ore(kr, hour) { return Math.round(kr * 100) + '\u00a0øre' + (hour == null ? '' : ' · ' + fill(ph('kl. {h}'), { h: stromHH(d, hour) })); }
    setFacts('stSub', [[ph('Billigst'), ore(d.cheap, d.cheapHour)],
                       [ph('Dyrest'), ore(d.prices ? d.prices[pk] : d.peak, d.prices ? pk : d.peakHour)],
                       [ph('Snitt'), ore(d.avg)]]);
    setText('stLine', ph('Billigst') + ' ' + fill(ph('kl. {h}'), { h: stromHH(d, d.cheapHour) }) + ' · ' + // Carbon på telefon
      Math.round(d.cheap * 100) + ' øre · ' + ph('snitt') + ' ' + Math.round(d.avg * 100) + ' øre');
    var span = $('stTrend');
    if (span) {
      var pct = d.avg ? (d.now - d.avg) / d.avg * 100 : 0, dir = Math.abs(pct) < 0.5 ? 0 : pct > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + Math.round(Math.abs(pct)) + '<i> %</i></span>';
    }
    /* Y-akse: dyreste og billigste time i øre. Søylene skaleres mot dagens
       maks, og med spenn som 143:1 blir de billige timene 2 px høye — da er
       tallene det eneste som forteller hva bunnen faktisk er. */
    if (d.prices && d.prices.length) {
      setText('stYMax', String(Math.round(Math.max.apply(null, d.prices) * 100)));
      setText('stYMin', '0'); // søylene starter på 0
    }
    _strom = d;
    var sig = sone + '|' + d.hour + '|' + d.cheapHour + '|' + (d.prices ? d.prices.length + ':' + d.prices[0] : '');
    if (sig !== _stromSig) { _stromSig = sig; buildStromBars(d.prices, d.hour, d.cheapHour); }
    stampNow();
  }
  function buildStromBars(prices, nowHour, cheapHour) {
    var card = $('stCard'); if (!card) return;
    var svg = card.querySelector('.spark-bars'); if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var mx = Math.max.apply(null, prices) || 1, n = prices.length, slot = 200 / n, bw = slot * 0.74;
    var NS = 'http://www.w3.org/2000/svg';
    var gPast = document.createElementNS(NS, 'g'), gFut = document.createElementNS(NS, 'g');
    gPast.setAttribute('fill', 'currentColor'); gPast.setAttribute('opacity', '.28');
    gFut.setAttribute('fill', 'currentColor'); gFut.setAttribute('opacity', '.58');
    var BASE = SPARK_H - 2, MAXH = SPARK_H - 4; // grunnlinje/topp i 200×88-rommet
    prices.forEach(function (p, i) {
      var h = Math.max(2, (p / mx) * MAXH), y = BASE - h, x = i * slot + (slot - bw) / 2;
      var rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', x.toFixed(2)); rect.setAttribute('y', y.toFixed(2));
      rect.setAttribute('width', bw.toFixed(2)); rect.setAttribute('height', h.toFixed(2));
      if (i === nowHour) { rect.setAttribute('class', 'bar-now'); svg.appendChild(rect); }
      else if (i === cheapHour) { rect.setAttribute('class', 'bar-cheap'); svg.appendChild(rect); }
      else (i < nowHour ? gPast : gFut).appendChild(rect);
      if (i === cheapHour) { // liten markør over billigste time
        var mk = document.createElementNS(NS, 'circle');
        mk.setAttribute('cx', (x + bw / 2).toFixed(2)); mk.setAttribute('cy', Math.max(2, y - 3).toFixed(2));
        mk.setAttribute('r', '1.7'); mk.setAttribute('class', 'bar-cheap-mark');
        svg.appendChild(mk);
      }
    });
    svg.insertBefore(gPast, svg.firstChild); svg.appendChild(gFut);
  }
  function loadStrom(place, force) {
    var sone = place.sone || 'NO1', d = new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    var key = 'strom_' + y + m + day + '_' + sone, c = cacheGet(key);
    // Cache uten ts (fra før sommertid-rettingen) hentes på nytt; den vises imens.
    if (!force && fresh(c, 3600 * 1000) && c.d.ts) { renderStrom(c.d, sone); return; }
    if (c) renderStrom(c.d, sone);
    fetch('https://www.hvakosterstrommen.no/api/v1/prices/' + y + '/' + m + '-' + day + '_' + sone + '.json')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (arr) {
        var prices = arr.map(function (o) { return o.NOK_per_kWh; });
        var ts = arr.map(function (o) { return o.time_start; }), peak = 0, cheap = 0;
        for (var i = 1; i < prices.length; i++) {
          if (prices[i] > prices[peak]) peak = i;
          if (prices[i] < prices[cheap]) cheap = i;
        }
        var avg = prices.reduce(function (a, b) { return a + b; }, 0) / prices.length;
        var out = { prices: prices, ts: ts, peakHour: peak, peak: prices[peak],
                    cheapHour: cheap, cheap: prices[cheap], avg: avg };
        cacheSet(key, out); renderStrom(out, sone);
      })
      .catch(function () {});
  }

  /* ════════════════════ STEDSØK (Kartverket Geonorge) ════════════════ */
  var PLACE_PRIO = { 'By': 0, 'Tettsted': 1, 'Tettbebyggelse': 2, 'Bygd': 3, 'Grend': 4, 'Boligfelt': 5, 'Bydel': 5 };
  function searchPlaces(q) {
    var url = 'https://ws.geonorge.no/stedsnavn/v1/navn?sok=' + encodeURIComponent(q) +
      '*&fuzzy=true&utkoordsys=4258&treffPerSide=20&side=1';
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var seen = {}, out = [];
      (j.navn || []).forEach(function (n) {
        var rp = n.representasjonspunkt; if (!rp) return;
        var komm = (n.kommuner && n.kommuner[0]) || {}, fyl = (n.fylker && n.fylker[0]) || {};
        var name = n.skrivemåte || n.stedsnavn || '';
        var label = name + '|' + (komm.kommunenavn || '');
        if (seen[label]) return; seen[label] = 1;
        out.push({
          navn: name, lat: rp.nord, lon: rp['øst'],
          kommunenr: komm.kommunenummer, fylkesnr: fyl.fylkesnummer, kommunenavn: komm.kommunenavn,
          prio: (n.navneobjekttype in PLACE_PRIO) ? PLACE_PRIO[n.navneobjekttype] : 9
        });
      });
      out.sort(function (a, b) { return a.prio - b.prio; });
      return out.slice(0, 8);
    });
  }

  function applyPlace(p) {
    p.sone = soneFor(p.kommunenr, p.fylkesnr);
    cacheSet('place', p);
    setText('wxPlaceName', p.navn);
    loadWeather(p, true);
    loadStrom(p, true);
    renderSun(p);
  }

  function buildPicker() {
    var btn = $('wxPlaceBtn'), card = $('wxCard'); if (!btn || !card) return;
    var panel = document.createElement('div');
    panel.className = 'wx-search'; panel.hidden = true;
    panel.innerHTML = '<input type="text" class="wx-input" id="wxInput" placeholder="Søk etter sted i Norge…" ' +
      'autocomplete="off" aria-label="Søk etter sted"><ul class="wx-results" id="wxResults" role="listbox"></ul>';
    card.appendChild(panel);
    var input = $('wxInput'), results = $('wxResults'), timer = null;

    function open() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); input.value = ''; results.innerHTML = ''; setTimeout(function () { input.focus(); }, 30); }
    function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function () { panel.hidden ? open() : close(); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !card.contains(e.target)) close(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });

    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (timer) clearTimeout(timer);
      if (q.length < 2) { results.innerHTML = ''; return; }
      timer = setTimeout(function () {
        searchPlaces(q).then(function (list) {
          results.innerHTML = '';
          if (!list.length) { results.innerHTML = '<li class="wx-empty">Ingen treff</li>'; return; }
          list.forEach(function (p) {
            var li = document.createElement('li');
            li.className = 'wx-result'; li.setAttribute('role', 'option'); li.tabIndex = 0;
            li.innerHTML = '<span>' + esc(p.navn) + '</span><small>' + esc(p.kommunenavn || '') + '</small>';
            function pick() { applyPlace(p); close(); btn.focus(); }
            li.addEventListener('click', pick);
            li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
            results.appendChild(li);
          });
        }).catch(function () { results.innerHTML = '<li class="wx-empty">Søk feilet</li>'; });
      }, 280);
    });
  }

  function buildGeo() {
    var btn = $('wxGeoBtn'); if (!btn) return;
    if (!('geolocation' in navigator)) { btn.style.display = 'none'; return; }
    btn.addEventListener('click', function () {
      btn.classList.add('busy');
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        fetch('https://ws.geonorge.no/stedsnavn/v1/punkt?nord=' + lat.toFixed(4) + '&ost=' + lon.toFixed(4) +
              '&koordsys=4258&utkoordsys=4258&radius=6000&treffPerSide=1&side=1')
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var n = j.navn && j.navn[0], komm = n && n.kommuner && n.kommuner[0] || {}, fyl = n && n.fylker && n.fylker[0] || {};
            applyPlace({ navn: (n && (n.skrivemåte || n.stedsnavn)) || 'Min posisjon', lat: +lat.toFixed(4), lon: +lon.toFixed(4),
              kommunenr: komm.kommunenummer, fylkesnr: fyl.fylkesnummer, kommunenavn: komm.kommunenavn });
          })
          .catch(function () { applyPlace({ navn: 'Min posisjon', lat: +lat.toFixed(4), lon: +lon.toFixed(4) }); })
          .then(function () { btn.classList.remove('busy'); });
      }, function () { btn.classList.remove('busy'); }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 6e5 });
    });
  }

  /* ═══════════ SSB: DRIVSTOFF, PRISVEKST OG BOLIGLÅNSRENTE ═══════════
     Statistisk sentralbyrå, PxWebApi v2 (CC BY 4.0, åpent for nettlesere, ingen nøkkel).
     Alle tre er månedstall som kommer et par uker etter at måneden er omme, så kortene
     sier alltid hvilken måned tallet gjelder. Tabellene (sjekket 2026-11-22):
       09654 Priser på drivstoff: 031 bensin 95 blyfri, 035 diesel (kr per liter, landssnitt)
       14700 KPI (2025=100): 00 i alt, 12-måneders endring (03013 ble avsluttet i 2025)
       10748 Renter på nye boliglån: 70 nedbetalingslån, 04b husholdninger, 08 flytende rente
     25 måneder: to år med graf, og tallet for samme måned året før. */
  var SSB = 'https://data.ssb.no/api/pxwebapi/v2/tables/';
  var SSB_Q = {
    df: '09654/data?lang=no&valueCodes[PetroleumProd]=031,035&valueCodes[ContentsCode]=Priser&valueCodes[Tid]=top(25)',
    kp: '14700/data?lang=no&valueCodes[VareTjenesteGrp]=00&valueCodes[ContentsCode]=Tolvmanedersendring&valueCodes[Tid]=top(25)',
    bl: '10748/data?lang=no&valueCodes[Utlanstype]=70&valueCodes[Sektor]=04b&valueCodes[Rentebinding]=08&valueCodes[ContentsCode]=RenterNyeBolig&valueCodes[Tid]=top(25)'
  };
  var _ssb = {}; // siste SSB-data per kort — scrub-chipen leser herfra

  /* json-stat2 → { dates: ['2026-10', …], series: [[…], […]] }. Tid er siste dimensjon,
     så verdiene ligger rekke for rekke (bensin først, så diesel). Måneder uten tall
     ennå (null) i slutten kuttes, så kortet viser siste måned som faktisk har tall. */
  function parseSsb(j) {
    var tid = j.dimension.Tid.category.index;
    var keys = Object.keys(tid).sort(function (a, b) { return tid[a] - tid[b]; }), n = keys.length, out = [];
    for (var s = 0; s * n < j.value.length; s++) out.push(j.value.slice(s * n, s * n + n));
    var end = n;
    while (end > 0 && out.some(function (r) { return typeof r[end - 1] !== 'number'; })) end--;
    return { dates: keys.slice(0, end).map(function (k) { return k.replace('M', '-'); }),
             series: out.map(function (r) { return r.slice(0, end); }) };
  }
  function mndYr(ym) { // '2026-10' → «okt. 2026»
    var p = ym.split('-');
    return T('trSharedMonthsShort', MND.join(',')).split(',')[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  /* Pil og endring fra måneden før, i kortets enhet (« kr» eller « pp»). */
  function ssbTrend(k, diff, dec, unit) {
    var span = $(k + 'Trend'); if (!span) return;
    var dir = Math.abs(diff) < Math.pow(10, -dec) / 2 ? 0 : diff > 0 ? 1 : -1;
    trendClass(span, dir);
    span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), dec) + '<i>' + unit + '</i></span>';
  }
  /* Grafen: rekka det store tallet viser, med høyeste/laveste verdi på y-aksen og
     første, midterste og siste måned under. ref (målet for prisveksten) er med på
     skalaen og får stiplet linje. */
  function ssbSpark(k, dates, vals, dec, ref, cmp) {
    var n = vals.length, all = (ref == null ? vals : vals.concat(ref)).concat(cmp || []);
    setText(k + 'YMax', nb(Math.max.apply(null, all), dec));
    setText(k + 'YMin', nb(Math.min.apply(null, all), dec));
    setText(k + 'Ax0', monthLbl(dates[0]));
    setText(k + 'Ax1', monthLbl(dates[Math.round((n - 1) / 2)]));
    setText(k + 'Ax2', monthLbl(dates[n - 1]));
    applySpark($(k + 'Card'), vals, ref, cmp);
  }
  /* SSBs boliglånsrente er effektiv rente uten gebyrer: «helårlig etterskuddsrente»,
     x = (1 + r/n)^n − 1, der r er avtalt (nominell) rente og n antall terminer. Etablerings- og
     termingebyr er ikke med (SSB, Om statistikken, sjekket 2026-11-23). Den nominelle renta
     regnes tilbake med 12 terminer i året, som er det vanlige for boliglån. */
  function nomRate(x) { return (Math.pow(1 + x / 100, 1 / 12) - 1) * 1200; }
  /* Anslag for effektiv rente MED gebyrer, for et eksempellån: annuitetslån på 3 mill. kr over
     25 år, 2 000 kr i etableringsgebyr og 50 kr i termingebyr hver måned (midt i det
     /boliglan/ oppgir som vanlig). Månedsrenta r der nåverdien av alle betalingene er lik det
     som blir utbetalt (lån − etableringsgebyr), funnet ved halvering. Årlig: (1 + r)^12 − 1. */
  var BL_EKS = { lan: 3e6, ar: 25, etabl: 2000, termin: 50 };
  function feeRate(x) {
    var i = nomRate(x) / 1200, N = BL_EKS.ar * 12, P = BL_EKS.lan;
    var pay = P * i / (1 - Math.pow(1 + i, -N)) + BL_EKS.termin, lo = i, hi = i + 0.01;
    for (var k = 0; k < 50; k++) {
      var m = (lo + hi) / 2;
      if (pay * (1 - Math.pow(1 + m, -N)) / m > P - BL_EKS.etabl) lo = m; else hi = m;
    }
    return (Math.pow(1 + lo, 12) - 1) * 100;
  }

  function renderDf(d) { // bensin i tallet og grafen, diesel i faktaradene
    var b = d.series[0], di = d.series[1] || [], last = b.length - 1, mnd = mndYr(d.dates[last]);
    setVal('dfVal', b[last], 2);
    ssbTrend('df', b[last] - b[last - 1], 2, ' kr');
    var rows = [];
    if (typeof di[last] === 'number') rows.push([ph('Diesel'), nb(di[last], 2) + ' kr']);
    if (last >= 12) rows.push([ph('Ett år før'), nb(b[last - 12], 2) + ' kr']);
    rows.push([ph('Landssnitt for'), mnd]);
    setFacts('dfSub', rows);
    setText('dfLine', (typeof di[last] === 'number' ? ph('Diesel') + ' ' + nb(di[last], 2) + ' kr · ' : '') + ph('landssnitt') + ' ' + mnd);
    ssbSpark('df', d.dates, b, 2);
  }
  function renderKp(d) { // 12-måneders endring i KPI
    var v = d.series[0], last = v.length - 1, mnd = mndYr(d.dates[last]);
    setVal('kpVal', v[last], 1);
    ssbTrend('kp', v[last] - v[last - 1], 1, ' pp');
    setFacts('kpSub', [[ph('Siste 12 mnd. til'), mnd],
      [ph('Måneden før'), nb(v[last - 1], 1) + ' %'],
      [ph('Norges Banks mål'), nb(2, 0) + ' %']]);
    setText('kpLine', ph('Siste 12 mnd. til') + ' ' + mnd + ' · ' + ph('målet er 2 %'));
    ssbSpark('kp', d.dates, v, 1, 2); // stiplet linje på målet (2 %)
  }
  function renderBl(d) { // snittrente på nye nedbetalingslån med flytende rente: effektiv (SSB) og nominell (regnet om)
    var v = d.series[0], last = v.length - 1, mnd = mndYr(d.dates[last]), nom = nb(nomRate(v[last]), 2) + ' %';
    setVal('blVal', v[last], 2);
    ssbTrend('bl', v[last] - v[last - 1], 2, ' pp');
    var rows = [[ph('Effektiv, uten gebyrer'), mnd], [ph('Nominell rente'), nom]];
    if (last >= 12) rows.push([ph('Ett år før'), nb(v[last - 12], 2) + ' %']);
    setFacts('blSub', rows);
    setText('blLine', ph('Effektiv') + ' · ' + ph('nominell') + ' ' + nom + ' · ' + mnd);
    ssbSpark('bl', d.dates, v, 2, null, v.map(nomRate));
  }
  var SSB_R = { df: renderDf, kp: renderKp, bl: renderBl };
  function renderSsb(k, d) { _ssb[k] = d; SSB_R[k](d); }

  /* Månedstall: det holder å spørre SSB to ganger i døgnet. Cachen vises med en gang. */
  function loadSsb(k, force) {
    var c = cacheGet('ssb_' + k), ok = c && c.d && c.d.series && c.d.series[0] && c.d.series[0].length > 1;
    if (ok) renderSsb(k, c.d);
    if (ok && !force && fresh(c, 12 * 36e5)) return;
    fetch(SSB + SSB_Q[k])
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var d = parseSsb(j);
        if (!d.series[0] || d.series[0].length < 2) throw 0;
        cacheSet('ssb_' + k, d); renderSsb(k, d);
      })
      .catch(function () {});
  }
  function loadSsbAll(force) { loadSsb('df', force); loadSsb('kp', force); loadSsb('bl', force); }

  /* ═══════════════════ DAGSLYS (regnes ut på siden) ══════════════════
     Soloppgang og solnedgang for stedet i værkortet, med de vanlige formlene for solas
     bane (deklinasjon og timevinkel). Sola regnes som oppe når øvre kant er over
     horisonten (−0,833° med lysbrytningen). Treffer innen et par minutter.
     Ingen henting og ingen kilde å vente på. */
  var RAD = Math.PI / 180, J2000 = Date.UTC(2000, 0, 1, 12);
  function sunDay(lat, lon, y, m, d) {
    var n = (Date.UTC(y, m, d, 12) - J2000) / 864e5 - lon / 360;     // dager fra J2000 til soltid-middag
    var M = (357.5291 + 0.98560028 * n) * RAD;                        // middelanomali
    var L = M + (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M) + 282.9372) * RAD;
    var noon = J2000 + (n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)) * 864e5;
    var dec = Math.asin(Math.sin(L) * Math.sin(23.4397 * RAD)), phi = lat * RAD;
    var c = (Math.sin(-0.833 * RAD) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
    if (c >= 1) return { len: 0, polar: -1, noon: noon }; // mørketid: sola står ikke opp (noon: der feltet i fullskjermgrafen lukker seg)
    if (c <= -1) return { len: 1440, polar: 1 };  // midnattssol: sola går ikke ned
    var w = Math.acos(c) / (2 * Math.PI) * 864e5; // halve dagen i ms
    return { len: 2 * w / 6e4, rise: new Date(noon - w), set: new Date(noon + w), polar: 0 };
  }
  function hhmm(dt) { return pad2(dt.getHours()) + ':' + pad2(dt.getMinutes()); }
  function dayLen(min) { // 403 → «6 t 43 min»
    var t = Math.round(min);
    return fill(ph('{h} t {m} min'), { h: Math.floor(t / 60), m: t % 60 });
  }
  function monthOnly(i) { return cap(T('trSharedMonthsShort', MND.join(',')).split(',')[i].replace(/\.$/, '')); }

  var _sun = null, _sunSig = '';
  function renderSun(place) {
    var now = new Date(), y = now.getFullYear(), mo = now.getMonth(), da = now.getDate();
    var sig = isoDay(now) + '|' + place.lat + '|' + place.lon + '|' + document.documentElement.lang;
    if (sig === _sunSig) return;
    _sunSig = sig;
    var td = sunDay(place.lat, place.lon, y, mo, da), yd = sunDay(place.lat, place.lon, y, mo, da - 1);

    setText('suPlace', fill(ph('Dagslys i {sted}'), { sted: place.navn }));
    /* «7 t 5 min»; under én time (like før mørketida) bare «46 min», ikke «0 t 46 min». */
    var t = Math.round(td.len), short = !td.polar && t < 60;
    setText('suVal', String(short ? t : Math.floor(t / 60)));
    setText('suUnit', td.polar ? ph('timer') : short ? 'min' : fill(ph('t {m} min'), { m: t % 60 }));

    /* Pila: hvor mye lengre eller kortere dagen er enn i går. I mørketid og midnattssol
       står det hva det er i stedet. */
    var span = $('suTrend');
    if (span) {
      var diff = td.len - yd.len, dir = Math.abs(diff) < 0.5 ? 0 : diff > 0 ? 1 : -1;
      trendClass(span, td.polar ? 0 : dir);
      span.innerHTML = td.polar
        ? '<span>' + esc(ph(td.polar < 0 ? 'Mørketid' : 'Midnattssol')) + '</span>'
        : arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + Math.round(Math.abs(diff)) + '<i> min</i></span>';
    }

    /* Neste solverv (21. juni og 21. desember, en dag fram eller tilbake fra år til år). */
    var today = Date.UTC(y, mo, da), sols = [[y, 5, 'Sommersolverv'], [y, 11, 'Vintersolverv'], [y + 1, 5, 'Sommersolverv']], sv = null;
    for (var i = 0; i < sols.length && !sv; i++) if (Date.UTC(sols[i][0], sols[i][1], 21) >= today) sv = sols[i];
    var days = Math.round((Date.UTC(sv[0], sv[1], 21) - today) / 864e5);
    var svRow = [ph(sv[2]), days > 1 ? fill(T('trSharedInDays', 'om {n} dager'), { n: days }) : ph(days === 1 ? 'i morgen' : 'i dag')];

    if (td.polar) {
      var what = ph(td.polar < 0 ? 'sola står ikke opp' : 'sola går ikke ned');
      setFacts('suSub', [[ph(td.polar < 0 ? 'Mørketid' : 'Midnattssol'), what], svRow]);
      setText('suLine', ph(td.polar < 0 ? 'Mørketid' : 'Midnattssol') + ' · ' + what);
    } else {
      setFacts('suSub', [[ph('Sola opp'), hhmm(td.rise)], [ph('Sola ned'), hhmm(td.set)], svRow]);
      setText('suLine', fill(ph('Sola opp {a} · ned {b}'), { a: hhmm(td.rise), b: hhmm(td.set) }));
    }

    /* Grafen: dagslengden gjennom hele året (annenhver dag), punkt og loddrett strek for
       i dag og en stiplet linje ved 12 timer, der dag og natt er like lange (jevndøgn). */
    var yrDays = Math.round((Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / 864e5), lens = [];
    for (var dd = 0; dd < yrDays; dd += 2) lens.push(sunDay(place.lat, place.lon, y, 0, dd + 1).len);
    var mn = Math.min.apply(null, lens), mx = Math.max.apply(null, lens);
    var pts = lens.map(function (v, k) { return [(k / (lens.length - 1)) * 200, sparkY(v, mn, mx)]; });
    var doy = Math.round((today - Date.UTC(y, 0, 1)) / 864e5);
    var dot = [(doy / 2 / (lens.length - 1)) * 200, sparkY(td.len, mn, mx)];
    var svg = $('suSpark');
    if (svg) {
      var dx = dot[0].toFixed(1);
      svg.innerHTML = sparkSvg(linePath(pts), dot, (720 > mn && 720 < mx ? sparkRef(sparkY(720, mn, mx)) : '') +
        '<line class="spark-drop" x1="' + dx + '" y1="' + dot[1].toFixed(1) + '" x2="' + dx + '" y2="' + SPARK_H + '"/>');
    }
    setText('suYMax', fill(ph('{n} t'), { n: Math.round(mx / 60) }));
    setText('suYMin', fill(ph('{n} t'), { n: Math.round(mn / 60) }));
    setText('suAx0', monthOnly(0)); setText('suAx1', monthOnly(6)); setText('suAx2', monthOnly(11));
    _sun = { y: y, lens: lens };
  }

  /* ── Oppdater-knapp i headeren ───────────────────────────────── */
  function buildStamp() {
    var stamp = $('dailyStamp'); if (!stamp) return;
    stamp.innerHTML = '<span id="dailyStampTxt">' + stampHtml() + '</span>' +
      '<button type="button" class="daily-refresh" id="dailyRefresh" title="Oppdater" aria-label="Oppdater markedsdata">' +
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M13.4,8 A5.4,5.4 0 1 1 11.8,4.2 M13.6,1.8 V5 H10.4"/></svg></button>';
    $('dailyRefresh').addEventListener('click', function () {
      var p = getPlace();
      loadWeather(p, true); loadFx(true); loadRate(true); loadStrom(p, true); loadSsbAll(true);
    });
  }

  function getPlace() {
    var o = cacheGet('place');
    return (o && o.d && typeof o.d.lat === 'number') ? o.d : DEFAULT_PLACE;
  }

  /* ── Scrub-avlesning på vær-, strøm- og valutagrafen ──────────────
     Bindes én gang; leser fra _wxMini/_strom/_fx så chipen alltid viser
     gjeldende data uten å måtte re-bindes ved hver render. */
  function buildScrubs() {
    bindScrub('wxSpark', 'wxScrub', 'wxScrubTxt', function (frac) {
      var w = _wxMini; if (!w) return '';
      var i = Math.round(frac * (w.v.length - 1));
      return '<span class="mut">' + pad2(w.dt[i].getHours()) + ':00</span> · ' + deg(w.v[i]) +
             (w.p[i] > 0 ? ' · ' + nb(w.p[i], 1) + ' mm' : '');
    });
    bindScrub('srSpark', 'srScrub', 'srScrubTxt', function (frac) {
      var r = _rate; if (!r || !r.series || !r.series.length) return '';
      var i = Math.min(r.series.length - 1, Math.round(frac * (r.series.length - 1)));
      var dt = r.dates && r.dates[i] ? nbDate(r.dates[i]) : '';
      return (dt ? '<span class="mut">' + dt + '</span> · ' : '') + nb(r.series[i], 2) + ' %';
    });
    bindScrub('stSpark', 'stScrub', 'stScrubTxt', function (frac) {
      var p = _strom && _strom.prices; if (!p || !p.length) return '';
      var i = Math.min(p.length - 1, Math.floor(frac * p.length));
      return '<span class="mut">' + stromHH(_strom, i) + ':00</span> · ' +
             Math.round(p[i] * 100) + ' øre';
    });
    bindScrub('fxSpark', 'fxScrub', 'fxScrubTxt', function (frac) {
      var u = _fx && _fx[_fxCode]; if (!u || !u.series || !u.series.length) return '';
      var i = Math.min(u.series.length - 1, Math.round(frac * (u.series.length - 1)));
      var dt = u.dates && u.dates[i] ? nbShort(u.dates[i]) : '';
      return (dt ? '<span class="mut">' + dt + '</span> · ' : '') + nb(u.series[i] * (u.mult || 1), 2) + ' kr';
    });
    ['df', 'kp', 'bl'].forEach(function (k) {
      bindScrub(k + 'Spark', k + 'Scrub', k + 'ScrubTxt', function (frac) {
        var d = _ssb[k], v = d && d.series[0]; if (!v || !v.length) return '';
        var i = Math.min(v.length - 1, Math.round(frac * (v.length - 1)));
        return '<span class="mut">' + mndYr(d.dates[i]) + '</span> · ' + nb(v[i], k === 'kp' ? 1 : 2) + (k === 'df' ? ' kr' : ' %') +
          (k === 'bl' ? ' · <span class="mut">' + esc(ph('nominell')) + '</span> ' + nb(nomRate(v[i]), 2) + ' %' : '');
      });
    });
    bindScrub('suSpark', 'suScrub', 'suScrubTxt', function (frac) {
      var s = _sun; if (!s) return '';
      var i = Math.min(s.lens.length - 1, Math.round(frac * (s.lens.length - 1)));
      return '<span class="mut">' + nbShort(isoDay(new Date(s.y, 0, 1 + 2 * i))) + '</span> · ' + dayLen(s.lens[i]);
    });
  }

  /* ── Minutt-puls ─────────────────────────────────────────────────
     Panelet sjekker alle kilder hvert 60. sekund og ved retur til fanen.
     Nettverk brukes kun når cache-TTL er utløpt (vær 30 min per MET-vilkårene,
     valuta/rente 1 t, strøm 1 t) — men strøm-«nå»-timen og tidsstempelet
     re-rendres lokalt hver puls, så tallene aldri står og blir gamle. */
  function tick() {
    if (document.hidden) return;
    var p = getPlace();
    loadWeather(p, false); loadFx(false); loadRate(false); loadStrom(p, false);
    loadSsbAll(false); renderSun(p); // dagslyset tegnes bare på nytt når datoen eller stedet er nytt
    if (_big.kind) bigRefresh(); // åpen fullskjermgraf: ny «nå»-time, passerte timer ut
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    var place = getPlace();
    _fxCode = getFxCode();
    setText('wxPlaceName', place.navn);
    buildStamp(); buildPicker(); buildGeo(); wireBig(); buildScrubs();
    buildCurMenu($('fxPickBtn'), $('fxCard')); buildConverter();
    loadWeather(place, false); loadFx(false); loadRate(false); loadStrom(place, false);
    loadSsbAll(false); renderSun(place);
    setInterval(tick, 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
    /* core.js setter lang på <html> når en språkfil er lastet. Malene over leses med T() når
       panelet tegnes, så tegn på nytt fra dataene som alt vises (uten ny henting) — også i en
       bakgrunnsfane, der tick() står over. Fullskjermgrafens signatur inneholder språket. */
    new MutationObserver(function () {
      var rate = cacheGet('rate');
      if (_lastWx) renderWeather(_lastWx);
      if (_fx) renderFx(_fx);
      if (rate) renderRate(rate.d);
      if (_strom) renderStrom(_strom, getPlace().sone || 'NO1');
      for (var k in _ssb) renderSsb(k, _ssb[k]);
      renderSun(getPlace()); // signaturen inneholder språket, så dette tegner på nytt
      if (_big.kind) bigRefresh();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  /* Idle-gate: utsett init (fetch + DOM-skriv + count-up) til etter
     entrance-koreografien (~1,2 s) så markedsdata-oppdateringene ikke
     kolliderer med hero-animasjonen. Panelet viser HTML-fallback/cache
     imens — aldri blankt. Timeout 2 s = øvre grense på utsettelsen. */
  function kick() {
    if ('requestIdleCallback' in window) requestIdleCallback(function () { init(); }, { timeout: 2000 });
    else setTimeout(init, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kick, { once: true });
  else kick();
})();
