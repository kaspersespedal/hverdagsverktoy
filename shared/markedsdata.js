/* shared/markedsdata.js — LIVE MARKEDSDATA-panel for forsiden (kun index.html).
   Henter ekte data klient-side fra åpne, gratis kilder som tillater kommersiell bruk:
     • Vær ........... MET Norway Locationforecast 2.0   (CC BY 4.0 — attribusjon påkrevd)
     • Valuta + rente. Norges Bank åpne data (EXR / IR)  (gjenbruk med kildehenvisning)
     • Strøm ......... hvakosterstrømmen.no               (fritt tilgjengelig, NO1–NO5)
     • Stedssøk ...... Kartverket Geonorge stedsnavn      (CC BY 4.0 — © Kartverket)
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
     men DOM som bærer animasjon (søylediagram, værstripe) skal kun bygges om
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
     2026-06-27 — 8 møter/år. 2027-datoene er ikke publisert ennå; når lista går tom
     skjules «neste møte»-linja heller enn å vise en gal dato. Oppdater ved årsskiftet. */
  var NB_MEETINGS = ['2026-08-13', '2026-09-24', '2026-11-05', '2026-12-17'];
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

  function nb(n, dec) {
    if (n == null || isNaN(n)) return '–';
    var s = Number(n).toFixed(dec == null ? 0 : dec);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // tusenskille = hardt mellomrom
    return p.join(',');
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

  /* ── Sparkline-bygger (200×48 viewBox) ─────────────────────────
     Høyden speiler .widget-spark{height:48px} 1:1, så kurven ikke
     strekkes vertikalt av preserveAspectRatio="none". */
  var SPARK_H = 48;
  function sparkPaths(vals, pad) {
    var W = 200, H = SPARK_H; pad = pad || 6;
    var clean = (vals || []).filter(function (v) { return typeof v === 'number' && !isNaN(v); });
    if (clean.length < 2) return null;
    var mn = Math.min.apply(null, clean), mx = Math.max.apply(null, clean), rng = (mx - mn) || 1, n = clean.length;
    var pts = clean.map(function (v, i) {
      return [(i / (n - 1)) * W, pad + (1 - (v - mn) / rng) * (H - 2 * pad)];
    });
    var line = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
    return { area: line + ' L' + W + ',' + H + ' L0,' + H + ' Z', line: line, last: pts[n - 1] };
  }
  function applySpark(card, vals) {
    if (!card) return;
    var svg = card.querySelector('.widget-spark'); if (!svg) return;
    var sp = sparkPaths(vals); if (!sp) return;
    var paths = svg.querySelectorAll('path'), dot = svg.querySelector('.spark-now');
    if (paths[0]) paths[0].setAttribute('d', sp.area);
    if (paths[1]) paths[1].setAttribute('d', sp.line);
    if (dot) { dot.setAttribute('cx', sp.last[0].toFixed(1)); dot.setAttribute('cy', sp.last[1].toFixed(1)); }
    // Forsidens kurve-forbedrer (glatting, gradient, startlinje, halo) kan først
    // kjøre nå — den har ingen punkter å jobbe med før dette.
    try { svg.dispatchEvent(new CustomEvent('hv:spark', { bubbles: true })); } catch (e) {}
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

  /* Egen count-up — animerer opp til den EKTE verdien (forsidens generiske
     count-up-IIFE hoppes over fordi vi fjernet data-to på disse feltene).
     Animerer kun ved første visning per felt; senere oppdateringer settes direkte. */
  var COUNTED = {};
  function countUp(id, target, dec) {
    var el = $(id);
    if (!el || typeof target !== 'number' || isNaN(target)) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* Desimalene settes i egen .dec-span: mindre grad, dempet farge — heltallet
       skal bære blikket. CSS-en (.widget-value .dec) har ligget der ubrukt. */
    var isValue = el.parentNode && el.parentNode.classList.contains('widget-value');
    function write(v) {
      var s = nb(v, dec);
      var i = dec ? s.lastIndexOf(',') : -1;
      if (isValue && i > 0) el.innerHTML = esc(s.slice(0, i)) + '<span class="dec">' + esc(s.slice(i)) + '</span>';
      else el.textContent = s;
    }
    if (COUNTED[id] || reduce) { write(target); COUNTED[id] = true; return; }
    COUNTED[id] = true;
    var from = target * 0.82, dur = 1100, t0 = null;
    function ease(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / dur);
      write(from + (target - from) * ease(t));
      if (t < 1) requestAnimationFrame(step); else write(target);
    }
    requestAnimationFrame(step);
  }

  function stampNow() {
    var el = $('dailyStampTxt'); if (!el) return;
    el.innerHTML = stampHtml();
  }

  /* «Sist oppdatert» i egen span: på mobil skjules den visuelt (men leses opp),
     så headeren får plass til en kompakt status-pille med bare klokkeslettet. */
  function stampHtml() {
    var d = new Date();
    return '<span class="stamp-pre">Sist oppdatert </span>' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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

  /* Skjemafeltet tar både «1 234,5» og «1234.5». Tomt/ugyldig gir null. */
  function parseAmt(s) {
    var t = String(s == null ? '' : s).replace(/[\s ]/g, '').replace(',', '.');
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
  }

  function renderConv() {
    var out = $('fxcOut'); if (!out) return;
    setText('fxcCode', _fxCode);
    var c = _fx && _fx[_fxCode], amt = parseAmt($('fxcAmt') && $('fxcAmt').value);
    if (!c || c.last == null) { out.textContent = '—'; setText('fxcRate', ''); return; }
    setText('fxcRate', '1 ' + _fxCode + ' = ' + nb(c.last, 4) + ' kr');
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
    snow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 9.4h7a2.4 2.4 0 0 0 .2-4.8a3.4 3.4 0 0 0-6.5-.9A2.6 2.6 0 0 0 4.6 9.4Z"/><circle cx="6" cy="12.3" r=".55" fill="currentColor" stroke="none"/><circle cx="9" cy="12.3" r=".55" fill="currentColor" stroke="none"/></svg>'
  };
  function wxIcon(sym) {
    var s = (sym || '').replace(/_(day|night|polartwilight)$/, '');
    var g = 'cloud';
    if (/snow/.test(s)) g = 'snow';
    else if (/sleet|rain|thunder/.test(s)) g = 'rain';
    else if (/clearsky|fair/.test(s)) g = 'sun';
    return WX_ICONS[g] || WX_ICONS.cloud;
  }
  var DAGER_FULL = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']; // Date.getDay(): 0 = søndag
  function renderWeather(d) {
    _lastWx = d;
    countUp('wxTemp', Math.round(d.temp), 0);
    setText('wxCond', wxText(d.sym));
    var sub = fill(T('trSharedWxMaxMin', 'Maks {max}° · Min {min}°'), { max: Math.round(d.max), min: Math.round(d.min) });
    if (typeof d.wind === 'number') sub += ' · ' + nb(d.wind, 1) + '\u00a0m/s' + (d.dir != null ? '\u00a0' + compass(d.dir) : '');
    setText('wxSub', sub);
    buildForecast(d.hours);
    if (_big.kind === 'wx') bigRefresh(); // live-oppdater åpen fullskjermgraf
    stampNow();
  }
  /* Værmeldings-stripe: «nå» + neste timer framover (klokke + symbol + grad).
     Erstatter den gamle baklengs temp-sparklinen. */
  function buildForecast(hours) {
    var el = $('wxForecast'); if (!el || !hours || !hours.length) return;
    var sig = JSON.stringify(hours);
    if (sig === _fcSig) return; // uendret værmelding — la stripa stå
    _fcSig = sig;
    var html = '';
    for (var i = 0; i < hours.length; i++) {
      var h = hours[i], hh = h.h < 10 ? '0' + h.h : '' + h.h;
      html += '<div class="wx-fc-cell">' +
        '<span class="wx-fc-ico">' + wxIcon(h.sym) + '</span>' +
        '<b class="wx-fc-temp">' + Math.round(h.temp) + '°</b>' +
        '<span class="wx-fc-time">' + (i === 0 ? 'nå' : hh) + '</span>' +
        '</div>';
    }
    el.innerHTML = html;
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
     tidspunkt + temperatur + nedbør neste time (next_1_hours). */
  function buildHours(ts) {
    var out = [];
    for (var i = 0; i < ts.length && out.length < 49; i++) {
      var e = ts[i], det = e.data.instant.details, n1 = e.data.next_1_hours;
      if (!n1) break; // forbi 1-t-sonen → stopp (6-t-blokker egner seg ikke til time-graf)
      if (typeof det.air_temperature !== 'number' || isNaN(det.air_temperature)) continue; // hopp over hull (som buildWeek)
      out.push({
        t: e.time,
        temp: det.air_temperature,
        precip: (n1.details && typeof n1.details.precipitation_amount === 'number') ? n1.details.precipitation_amount : 0
      });
    }
    return out;
  }
  function loadWeather(place, force) {
    var key = 'wx_' + place.lat.toFixed(3) + '_' + place.lon.toFixed(3);
    var c = cacheGet(key);
    /* Cache fra før fullskjermgrafen mangler timeserien (hrs) — vises, men regnes som utløpt. */
    if (!force && c && c.d && c.d.hrs && fresh(c, 30 * 60 * 1000)) { renderWeather(c.d); return; }
    if (c) renderWeather(c.d); // vis cachet umiddelbart mens vi henter ferskt
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
        // Neste timer framover (nå, +2t, +4t, +6t) til værmeldings-stripa. Lokal klokketid.
        var hours = [];
        for (var k = 0; k <= 6 && k < ts.length; k += 2) {
          var e2 = ts[k], det = e2.data.instant.details, nh = e2.data;
          var s2 = (nh.next_1_hours && nh.next_1_hours.summary.symbol_code) ||
                   (nh.next_6_hours && nh.next_6_hours.summary.symbol_code) || sym;
          hours.push({ h: new Date(e2.time).getHours(), temp: det.air_temperature, sym: s2 });
        }
        var d = { temp: now.air_temperature, wind: now.wind_speed, dir: now.wind_from_direction,
                  sym: sym, max: Math.max.apply(null, temps), min: Math.min.apply(null, temps), temps: temps, hours: hours,
                  week: buildWeek(ts), hrs: buildHours(ts) };
        _wxFail = false;
        cacheSet(key, d); renderWeather(d);
      })
      .catch(function () { /* behold cachet/HTML-verdi */
        _wxFail = true;
        if (_big.kind === 'wx') bigRefresh();
      });
  }

  /* ═══════════ FULLSKJERM GRAF (vær · strøm · valuta) ═══════════════════
     Knappen øverst til høyre på vær-, strøm- og valutakortet åpner én felles
     dialog (Claude Design «05 Fullskjerm graf»). DOM-en bygges første gang den
     åpnes og gjenbrukes. Vær leser timeserien loadWeather allerede har hentet;
     strøm (andre soner, i morgen, siste 7 dager) og valuta (ett år) hentes først
     når de vises, og caches. Hver henting lagres under sin egen nøkkel
     (sone + dato, valuta), og dialogen tegnes alltid fra det som er valgt NÅ —
     et sent svar for et gammelt valg kan derfor aldri overskrive et nyere. */
  var BIG = null, _bigT = 0, _rvF = 0, _reduce = false;
  /* kind: åpen graf (wx/st/fx) · r: tidsrom per graf · hov: punkt under peker/piltast
     · M: tegnet modell · sig: modellens signatur (minutt-pulsen tegner bare om ved endring) */
  var _big = { kind: null, r: { wx: 0, st: 0, fx: 0 }, zone: 'NO1', hov: null, M: null, sig: '', ret: null, ov: '' };
  var RANGES = { wx: ['12 t', '24 t', '48 t'], st: ['I dag', 'I morgen', '7 dager'], fx: ['30 d', '90 d', '1 år'] };
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
    M.valOf = function (i) { return String(Math.round(v[i])); };
    M.sub0 = ph(wxText(d.sym)) + (typeof d.wind === 'number'
      ? ' · ' + ph('Vind') + ' ' + nb(d.wind, 1) + ' m/s' + (d.dir != null ? ' ' + compass(d.dir) : '') : '');
    M.subOf = function (i) { return M.label(i) + ' · ' + fill(ph('{mm} mm nedbør'), { mm: nb(p[i], 1) }); };
    M.tipV = function (i) { return Math.round(v[i]) + ' °C · ' + nb(p[i], 1) + ' mm'; };
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
    M.avgV = sum(v) / n;
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
               [ph('Snitt'), nb(M.avgV, 2), 'kr'], [ph('Endring'), (ch > 0 ? '+' : ch < 0 ? '−' : '') + nb(Math.abs(ch), 1) + ' %', ph('i perioden')]];
    M.valOf = function (i) { return nb(v[i], 2); };
    M.sub0 = unit + ' / NOK · ' + fill(ph('snitt {v} kr'), { v: nb(M.avgV, 2) });
    M.subOf = function (i) { return unit + ' / NOK · ' + M.label(i); };
    M.tipV = function (i) { return nb(v[i], 2) + ' kr'; };
    M.state = 'ok';
    return M;
  }

  function bigModel() {
    var k = _big.kind, r = _big.r[k], M = k === 'wx' ? wxModel(r) : k === 'st' ? stModel(r) : fxModel(r);
    M.r = r;
    M.msg = M.state === 'load' ? ph('Henter data …') : M.state === 'err' ? ph('Kunne ikke hente data. Sjekk nettet og prøv igjen.') : M.msg;
    M.sig = [k, r, M.title || M.eye, M.foot, M.state, M.msg, M.v && M.v.join(','), M.p && M.p.join(','), M.nowIdx,
             M.sub0, M.ax && M.ax.join('|'), JSON.stringify(M.week || null), document.documentElement.lang].join('§');
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
          '<div class="mdb-hero"><span class="mdb-big"><span class="mdb-val"></span><span class="mdb-unit"></span></span><span class="mdb-sub"></span></div>' +
          '<div class="mdb-chart">' +
            '<div class="mdb-yax" aria-hidden="true"><div class="mdb-yax-in"></div></div>' +
            '<div class="mdb-pc"><div class="mdb-plot" aria-hidden="true"></div><div class="mdb-tip" aria-hidden="true"><span></span><b></b></div></div>' +
            '<div class="mdb-xax" aria-hidden="true"></div>' +
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
      fs: q('.mdb-fs'), x: q('.mdb-x'), body: q('.mdb-body'), val: q('.mdb-val'), unit: q('.mdb-unit'), sub: q('.mdb-sub'),
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

  /* Glatt temperaturkurve: cardinal-spline (Catmull-Rom) → kubiske bezier-segmenter.
     Kontrollpunkt = P[i] ± tangent/3, ensidig tangent i endene. Passerer alle punkter. */
  function smoothPath(pts) {
    var n = pts.length;
    if (!n) return '';
    if (n === 1) return 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    function tan(i) {
      var a = pts[i === 0 ? 0 : i - 1], b = pts[i === n - 1 ? n - 1 : i + 1];
      var div = (i === 0 || i === n - 1) ? 1 : 2;
      return [(b[0] - a[0]) / div, (b[1] - a[1]) / div];
    }
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (var i = 0; i < n - 1; i++) {
      var mi = tan(i), mj = tan(i + 1);
      var c1x = pts[i][0] + mi[0] / 3, c1y = pts[i][1] + mi[1] / 3;
      var c2x = pts[i + 1][0] - mj[0] / 3, c2y = pts[i + 1][1] - mj[1] / 3;
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) +
           ' ' + pts[i + 1][0].toFixed(1) + ',' + pts[i + 1][1].toFixed(1);
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
    var E = BIG, v = M.v, n = M.n, mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), T;
    if (M.line) {
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
      yl += '<span class="mdb-yl" style="top:' + pctY(y) + (hid ? ';visibility:hidden' : '') + '">' + nb(t, T.dec) + '</span>';
      grid += '<line class="' + (t === 0 && T.lo < 0 ? 'z' : 'g') + '" x1="0" y1="' + y + '" x2="1000" y2="' + y + '"/>';
    });
    grid += '<line class="b" x1="0" y1="399.5" x2="1000" y2="399.5"/>';
    if (!M.line && M.nowIdx != null) { var nx = X(M.nowIdx).toFixed(1); grid += '<line class="nw" x1="' + nx + '" y1="0" x2="' + nx + '" y2="400"/>'; }

    /* Døgnskiller (midnatt i værvarselet, hver dag i ukesvisningen) — annenhver dag får et svakt bånd. */
    var edges = [0], bands = '', days = '';
    M.seps.forEach(function (s) {
      edges.push(sx(s[0]));
      days += '<span class="mdb-day' + (s[1] ? ' has-l' : '') + '" style="left:' + pct(sx(s[0])) + '">' + (s[1] ? '<span>' + esc(s[1]) + '</span>' : '') + '</span>';
    });
    edges.push(1000);
    for (var j = 1; j < edges.length - 1; j += 2) bands += '<span class="mdb-band" style="left:' + pct(edges[j]) + ';width:' + pct(edges[j + 1] - edges[j]) + '"></span>';

    var html = '<span class="mdb-light"></span>' + bands +
      '<svg class="mdb-svg mdb-grid" viewBox="0 0 1000 400" preserveAspectRatio="none">' + grid + '</svg>' + days;
    if (M.line) {
      var pts = v.map(function (x, i) { return [X(i), Y(x)]; }), line = smoothPath(pts), area = line + ' L1000,400 L0,400 Z';
      var topY = Math.min.apply(null, pts.map(function (q) { return q[1]; })).toFixed(1);
      var gx = M.kind === 'wx' ? ['1000', '0'] : ['0', '1000']; // fiolett ende = lengst fra «nå»
      var rain = '';
      if (M.p) {
        /* Nedbør nederst: høyden skaleres mot minst 2 mm/t, så yr ikke ser ut som styrtregn.
           Søyla står midt i timen den gjelder (fra punktet til neste); siste punkt er periodens slutt. */
        var pmax = Math.max(2, Math.max.apply(null, M.p)), hw = 1000 / (n - 1);
        M.p.forEach(function (mm, i) {
          if (mm > 0 && i < n - 1) rain += '<span class="mdb-rain" style="left:' + pct(X(i) + hw / 2) + ';width:calc(' + (62 / (n - 1)).toFixed(3) + '% - 1px);height:' + (mm / pmax * 22).toFixed(2) + '%"></span>';
        });
      }
      /* To kopier av linja og flaten: én dempet, én klippet ved pekeren — slik blir alt til høyre for pekeren dempet. */
      html += '<div class="mdb-rev">' +
        '<svg class="mdb-svg" viewBox="0 0 1000 400" preserveAspectRatio="none"><defs>' +
          '<linearGradient id="mdbFill" gradientUnits="userSpaceOnUse" x1="0" y1="' + topY + '" x2="0" y2="400">' +
          '<stop offset="0" stop-color="currentColor" stop-opacity=".24"/><stop offset=".6" stop-color="currentColor" stop-opacity=".05"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient>' +
          '<clipPath id="mdbCutA"><rect class="mdb-cut" x="-40" y="-80" width="1200" height="560"/></clipPath></defs>' +
          '<path class="mdb-dim" d="' + area + '" fill="url(#mdbFill)"/><path d="' + area + '" fill="url(#mdbFill)" clip-path="url(#mdbCutA)"/></svg>' +
        '<svg class="mdb-svg mdb-line" viewBox="0 0 1000 400" preserveAspectRatio="none"><defs>' +
          '<linearGradient id="mdbInk" gradientUnits="userSpaceOnUse" x1="' + gx[0] + '" y1="0" x2="' + gx[1] + '" y2="0">' +
          '<stop offset="0" style="stop-color:var(--mdb-ink-a)"/><stop offset=".55" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-2)"/></linearGradient>' +
          '<clipPath id="mdbCutL"><rect class="mdb-cut" x="-40" y="-80" width="1200" height="560"/></clipPath></defs>' +
          '<path class="mdb-dim" d="' + line + '" stroke="url(#mdbInk)"/><path d="' + line + '" stroke="url(#mdbInk)" clip-path="url(#mdbCutL)"/></svg>' +
        rain + '</div>';
    } else {
      /* Søyler fra nullinja: positive opp, negative ned. Gradienten strekkes over hele
         den positive høyden, så fargen sier hvor høy prisen er, ikke hvor høy søyla er.
         Også passerte timer får gradienten: velges en av dem, vises den i full farge. */
      var zy = Y(0), thin = n > 48, bars = '';
      v.forEach(function (x, i) {
        var top = x >= 0 ? Y(x) : zy, h = Math.abs(Y(x) - zy);
        if (h < 2.4) { h = 2.4; if (x >= 0) top = zy - 2.4; }
        var past = M.nowIdx != null && i < M.nowIdx, neg = x < 0;
        bars += '<span class="mdb-bar' + (past ? ' is-past' : '') + (neg ? ' is-neg' : '') + (thin ? ' is-thin' : '') + '" style="left:' +
          (thin ? (i / n * 100).toFixed(4) + '%;width:calc(' + (100 / n).toFixed(4) + '% - var(--bgap))' : ((i + 0.07) / n * 100).toFixed(4) + '%;width:' + (86 / n).toFixed(4) + '%') +
          ';top:' + pctY(top) + ';height:' + pctY(h) + (neg ? '' : ';background-size:100% ' + (zy / h * 100).toFixed(1) + '%') +
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
    html += '<span class="mdb-vx"></span><span class="mdb-hx"></span><span class="mdb-pulse"></span><span class="mdb-dot"></span>' +
      tags + '<span class="mdb-tag mdb-ytag"><b></b></span>';
    if (!M.line && M.nowIdx != null) html += '<span class="mdb-now" style="left:' + pct(X(M.nowIdx)) + '">' + esc(ph('Nå')) + '</span>';

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
    E.vx = q('.mdb-vx'); E.hx = q('.mdb-hx'); E.dot = q('.mdb-dot'); E.pulse = q('.mdb-pulse'); E.light = q('.mdb-light'); E.ytag = q('.mdb-ytag');
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
    for (var i = 0; i < E.cuts.length; i++) E.cuts[i].setAttribute('width', hov && M.line ? (cx + 40).toFixed(1) : '1200');
    vis(E.vx, hov && M.line); vis(E.hx, hov); vis(E.ytag, hov);
    vis(E.dot, sel != null && M.line); vis(E.pulse, sel != null && M.line && !hov); vis(E.light, sel != null);
    if (sel == null) return;
    var cy = M.Y(M.v[sel]), L = pct(cx), Tp = pctY(cy), dd = (0.2 + cx / 1000 * 0.6).toFixed(2) + 's';
    E.vx.style.left = E.dot.style.left = E.pulse.style.left = L;
    E.hx.style.top = E.dot.style.top = E.pulse.style.top = E.ytag.style.top = Tp;
    E.dot.style.setProperty('--dd', dd); E.pulse.style.setProperty('--dd', dd);
    E.light.style.background = 'radial-gradient(32% 44% at ' + L + ' ' + Tp + ', rgba(var(--glow-rgb), .1), transparent 72%)';
    E.ytag.firstChild.textContent = nb(M.v[sel], M.ydec);
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
    else delete _fxYFail[_fxCode];
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
    countUp('fxVal', c.last * m, 2);
    /* Undertittelen viser de tre neste i lista — den valgte står i tallet over. */
    var sub = [];
    FX_CODES.forEach(function (k) {
      if (k === code || sub.length >= 3) return;
      var o = d[k]; if (o) sub.push((fxUnit(o, k) + ' ' + fxQuote(o)).replace(/ /g, '\u00a0'));
    });
    setText('fxSub', sub.join(' · '));
    var span = $('fxTrend');
    if (span && c.prev != null) {
      var diff = (c.last - c.prev) * m, dir = Math.abs(diff) < 0.0005 ? 0 : diff > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), 2) + '</span>';
    }
    var dts = c.dates;
    if (dts && dts.length) {
      var lastI = dts.length - 1;
      setText('fxAx0', nbShort(dts[0]));
      setText('fxAx1', nbShort(dts[Math.round(lastI / 2)]));
      setText('fxAx2', 'i dag');
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
    if (!force && fresh(c, 3600 * 1000)) { renderFx(c.d); return; }
    if (c) renderFx(c.d);
    fetch('https://data.norges-bank.no/api/data/EXR/B.USD+EUR+GBP+SEK+DKK+CHF+JPY+PLN.NOK.SP?lastNObservations=30&format=sdmx-json&locale=en')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var d = parseExr(j); cacheSet('fx', d); renderFx(d); })
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
    return { series: vals, last: last, lastDate: dates[dates.length - 1],
             changeDate: dates[ci], prevLevel: ci > 0 ? vals[ci - 1] : last };
  }
  function renderRate(d) {
    countUp('srVal', d.last, 2);
    setText('srSub', fill(T('trSharedRateChanged', 'Norges Bank · sist endret {d}'), { d: nbDate(d.changeDate).replace(/ /g, '\u00a0') }));
    var span = $('srTrend');
    if (span) {
      var diff = d.last - d.prevLevel, dir = Math.abs(diff) < 0.001 ? 0 : diff > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), 2) + '<i>\u00a0pp</i></span>';
    }
    // En rente som endres ~4 ggr/år sier lite som sparkline → vis neste rentemøte i stedet.
    var nm = nextMeeting(), lbl = $('srNextLbl'), val = $('srNext');
    if (lbl && val) {
      if (nm) {
        lbl.textContent = 'Neste rentemøte';
        val.textContent = nbShort(nm) + ' ' + nm.slice(0, 4);
        // Datoen alene sier lite — vis avstanden i dager ved siden av.
        var t = new Date(), md = nm.split('-').map(Number);
        var diff = Math.round((Date.UTC(md[0], md[1] - 1, md[2]) -
                               Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
        var word = diff > 1 ? fill(T('trSharedInDays', 'om {n} dager'), { n: diff }) : diff === 1 ? 'i morgen' : diff === 0 ? 'i dag' : '';
        if (word) {
          var s = document.createElement('span');
          s.className = 'in-days'; s.textContent = word;
          val.appendChild(document.createTextNode(' ')); // skiller ordene for skjermlesere
          val.appendChild(s);
        }
      }
      else { lbl.textContent = ''; val.textContent = ''; }
    }
    stampNow();
  }
  function loadRate(force) {
    var c = cacheGet('rate');
    if (!force && fresh(c, 3600 * 1000)) { renderRate(c.d); return; } // 1 t TTL (var 12 t)
    if (c) renderRate(c.d);
    var start = new Date(Date.now() - 18 * 30 * 864e5).toISOString().slice(0, 10);
    fetch('https://data.norges-bank.no/api/data/IR/B.KPRA.SD.R?startPeriod=' + start + '&format=sdmx-json&locale=en')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var d = parseRate(j); cacheSet('rate', d); renderRate(d); })
      .catch(function () {});
  }

  /* ═══════════════════ STRØM (hvakosterstrømmen.no) ══════════════════ */
  function renderStrom(d, sone) {
    /* «Nå»-timen beregnes ved render (ikke ved fetch) — cachet dagsdata skal
       ikke vise forrige times pris når panelet står åpent over et timeskifte
       eller siden åpnes med gammel cache. */
    if (d.prices && d.prices.length) {
      d.hour = Math.min(new Date().getHours(), d.prices.length - 1);
      d.now = d.prices[d.hour];
    }
    setText('stSone', 'Strøm ' + sone);
    countUp('stVal', Math.round(d.now * 100), 0);
    // Utled billigste time defensivt (eldre cache fra forrige versjon mangler feltet).
    if (typeof d.cheapHour !== 'number' && d.prices) {
      d.cheapHour = 0;
      for (var ci = 1; ci < d.prices.length; ci++) if (d.prices[ci] < d.prices[d.cheapHour]) d.cheapHour = ci;
      d.cheap = d.prices[d.cheapHour];
    }
    var ch = d.cheapHour < 10 ? '0' + d.cheapHour : d.cheapHour;
    setText('stSub', fill(T('trSharedStromSub', 'Billigst kl\u00a0{h} · {cheap}\u00a0øre · snitt {avg}\u00a0øre'),
      { h: ch, cheap: Math.round(d.cheap * 100), avg: Math.round(d.avg * 100) }));
    var span = $('stTrend');
    if (span) {
      var pct = d.avg ? (d.now - d.avg) / d.avg * 100 : 0, dir = Math.abs(pct) < 0.5 ? 0 : pct > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + Math.round(Math.abs(pct)) + '<i>%</i></span>';
    }
    /* Y-akse: dyreste og billigste time i øre. Søylene skaleres mot dagens
       maks, og med spenn som 143:1 blir de billige timene 2 px høye — da er
       tallene det eneste som forteller hva bunnen faktisk er. */
    if (d.prices && d.prices.length) {
      setText('stYMax', String(Math.round(Math.max.apply(null, d.prices) * 100)));
      setText('stYMin', String(Math.round(Math.min.apply(null, d.prices) * 100)));
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
    gPast.setAttribute('fill', 'currentColor'); gPast.setAttribute('opacity', '.5');
    gFut.setAttribute('fill', 'currentColor'); gFut.setAttribute('opacity', '.3');
    var BASE = SPARK_H - 2, MAXH = SPARK_H - 4; // grunnlinje/topp i 200×48-rommet
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
    if (!force && fresh(c, 3600 * 1000)) { renderStrom(c.d, sone); return; }
    if (c) renderStrom(c.d, sone);
    fetch('https://www.hvakosterstrommen.no/api/v1/prices/' + y + '/' + m + '-' + day + '_' + sone + '.json')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (arr) {
        var prices = arr.map(function (o) { return o.NOK_per_kWh; });
        var hour = Math.min(d.getHours(), prices.length - 1), peak = 0, cheap = 0;
        for (var i = 1; i < prices.length; i++) {
          if (prices[i] > prices[peak]) peak = i;
          if (prices[i] < prices[cheap]) cheap = i;
        }
        var avg = prices.reduce(function (a, b) { return a + b; }, 0) / prices.length;
        var out = { now: prices[hour], hour: hour, prices: prices, peakHour: peak, peak: prices[peak],
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
            li.innerHTML = '<span>' + p.navn + '</span><small>' + (p.kommunenavn || '') + '</small>';
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
            applyPlace({ navn: (n && (n.skrivemåte || n.stedsnavn)) || 'Min posisjon', lat: lat, lon: lon,
              kommunenr: komm.kommunenummer, fylkesnr: fyl.fylkesnummer, kommunenavn: komm.kommunenavn });
          })
          .catch(function () { applyPlace({ navn: 'Min posisjon', lat: lat, lon: lon }); })
          .then(function () { btn.classList.remove('busy'); });
      }, function () { btn.classList.remove('busy'); }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 6e5 });
    });
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
      loadWeather(p, true); loadFx(true); loadRate(true); loadStrom(p, true);
    });
  }

  function getPlace() {
    var o = cacheGet('place');
    return (o && o.d && typeof o.d.lat === 'number') ? o.d : DEFAULT_PLACE;
  }

  /* ── Scrub-avlesning på strøm- og valutakurven ────────────────────
     Bindes én gang; leser fra _strom/_fx så chipen alltid viser
     gjeldende data uten å måtte re-bindes ved hver render. */
  function buildScrubs() {
    bindScrub('stSpark', 'stScrub', 'stScrubTxt', function (frac) {
      var p = _strom && _strom.prices; if (!p || !p.length) return '';
      var i = Math.min(p.length - 1, Math.floor(frac * p.length));
      return '<span class="mut">' + String(i).padStart(2, '0') + ':00</span> · ' +
             Math.round(p[i] * 100) + ' øre';
    });
    bindScrub('fxSpark', 'fxScrub', 'fxScrubTxt', function (frac) {
      var u = _fx && _fx[_fxCode]; if (!u || !u.series || !u.series.length) return '';
      var i = Math.min(u.series.length - 1, Math.round(frac * (u.series.length - 1)));
      var dt = u.dates && u.dates[i] ? nbShort(u.dates[i]) : '';
      return (dt ? '<span class="mut">' + dt + '</span> · ' : '') + nb(u.series[i] * (u.mult || 1), 2) + ' kr';
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
