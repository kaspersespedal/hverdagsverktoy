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

  /* Live-ticker state: «Valuta & rente»-stripa fylles fra de ekte FX- og
     styringsrente-feedene under (Norges Bank). Ingen hardkodede tall — den
     gamle fake «Aksjer & marked»-stripa er fjernet (E-fix 2026-06-29). */
  var _fx = null, _rate = null;

  /* Render-signaturer: minutt-pulsen re-rendrer fra cache hvert 60. sekund,
     men DOM som bærer animasjon (marquee, søylediagram, værstripe) skal kun
     bygges om når innholdet faktisk er endret — ellers restarter loopen synlig. */
  var _tickerSig = '', _stromSig = '', _fcSig = '', _graphSig = '', _weekSig = '';

  /* Fullskjerm-værmelding-state: modal-DOM bygges lazy ved første åpning,
     _lastWx holder siste rendrede vær-data (mates til grafen ved åpning),
     _graphGeo holder graf-geometri til hover-avlesningen. */
  var _modalEls = null, _modalOpen = false, _wxReturnFocus = null,
      _lastWx = null, _graphGeo = null, _prevHtmlOverflow = '';

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

  function nb(n, dec) {
    if (n == null || isNaN(n)) return '–';
    var s = Number(n).toFixed(dec == null ? 0 : dec);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // tusenskille = hardt mellomrom
    return p.join(',');
  }
  function compass(deg) {
    if (deg == null || isNaN(deg)) return '';
    return ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'][Math.round(deg / 45) % 8];
  }
  var MND = ['jan.', 'feb.', 'mar.', 'apr.', 'mai', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'];
  function nbDate(iso) { // 'YYYY-MM-DD' -> '24. jun. 2026'
    if (!iso) return '';
    var p = iso.split('-');
    return parseInt(p[2], 10) + '. ' + MND[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function nbShort(iso) { // 'YYYY-MM-DD' -> '24. jun.'
    if (!iso) return '';
    var p = iso.split('-');
    return parseInt(p[2], 10) + '. ' + MND[parseInt(p[1], 10) - 1];
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

  /* ── Sparkline-bygger (200×30 viewBox) ─────────────────────── */
  function sparkPaths(vals, pad) {
    var W = 200, H = 30; pad = pad || 4;
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
    if (COUNTED[id] || reduce) { el.textContent = nb(target, dec); COUNTED[id] = true; return; }
    COUNTED[id] = true;
    var from = target * 0.82, dur = 1100, t0 = null;
    function ease(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / dur);
      el.textContent = nb(from + (target - from) * ease(t), dec);
      if (t < 1) requestAnimationFrame(step); else el.textContent = nb(target, dec);
    }
    requestAnimationFrame(step);
  }

  function stampNow() {
    var el = $('dailyStampTxt'); if (!el) return;
    var d = new Date();
    el.textContent = 'Sist oppdatert ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ════════════════ LIVE-TICKER («Valuta & rente»-stripa) ════════════════ */
  /* Oversatt label via i18n (R()) med norsk fallback — bygges ved build-time
     fordi stripa fylles etter at core.js sin data-i18n-swap har kjørt. */
  function tlabel(key, fb) {
    try { var r = (typeof R === 'function') ? R() : null; return (r && r[key]) ? r[key] : fb; }
    catch (e) { return fb; }
  }
  function tickerItems() {
    var items = [];
    if (_fx) {
      [['USD', 'USD / NOK'], ['EUR', 'EUR / NOK'], ['GBP', 'GBP / NOK'], ['SEK', 'SEK / NOK']].forEach(function (p) {
        var c = _fx[p[0]]; if (!c || c.last == null) return;
        var diff = (c.prev != null) ? c.last - c.prev : 0;
        var dir = Math.abs(diff) < 0.0005 ? 0 : diff > 0 ? 1 : -1;
        items.push({ lbl: p[1], val: nb(c.last, 2),
          dir: dir, delta: (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), 2) });
      });
    }
    if (_rate && _rate.last != null) {
      var rd = (_rate.prevLevel != null) ? _rate.last - _rate.prevLevel : 0;
      var rdir = Math.abs(rd) < 0.001 ? 0 : rd > 0 ? 1 : -1;
      items.push({ lbl: tlabel('homeMarketsPairPolicy', 'Styringsrente'), val: nb(_rate.last, 2) + ' %',
        dir: rdir, delta: (rdir > 0 ? '+' : rdir < 0 ? '−' : '±') + nb(Math.abs(rd), 2) + ' pp' });
    }
    return items;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function buildTicker() {
    var track = $('tickerTrack'); if (!track) return;
    var items = tickerItems(); if (!items.length) return;
    var sig = JSON.stringify(items);
    if (sig === _tickerSig) return; // uendret — ikke restart marquee-animasjonen
    _tickerSig = sig;
    function cls(d) { return d > 0 ? 'up' : d < 0 ? 'down' : 'flat'; }
    function span(it, hidden) {
      return '<span class="ti"' + (hidden ? ' aria-hidden="true"' : '') + '><b>' + esc(it.lbl) +
        '</b> <span class="val">' + esc(it.val) + '</span> <em class="' + cls(it.dir) + '">' + esc(it.delta) + '</em></span>';
    }
    var html = '';
    items.forEach(function (it) { html += span(it, false); }); // Set A (lest av skjermleser)
    items.forEach(function (it) { html += span(it, true); });  // Set B (duplikat for sømløs loop)
    track.innerHTML = html;
    // Skaler marquee-fart til antall elementer (originalen var ~4,8s/element).
    track.style.animationDuration = (items.length * 4.8).toFixed(0) + 's';
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
  var MND_LONG = ['januar', 'februar', 'mars', 'april', 'mai', 'juni',
                  'juli', 'august', 'september', 'oktober', 'november', 'desember'];
  function renderWeather(d) {
    _lastWx = d;
    countUp('wxTemp', Math.round(d.temp), 0);
    setText('wxCond', wxText(d.sym));
    var sub = 'Maks ' + Math.round(d.max) + '° · Min ' + Math.round(d.min) + '°';
    if (typeof d.wind === 'number') sub += ' · ' + nb(d.wind, 1) + ' m/s' + (d.dir != null ? ' ' + compass(d.dir) : '');
    setText('wxSub', sub);
    buildForecast(d.hours);
    if (_modalOpen) { renderDayGraph(d); renderWeek(d); modalStamp(); } // live-oppdater åpen modal
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
  /* Full time-for-time-serie framover (til den store dag-grafen i fullskjerm).
     Tar de neste ~24 time-oppløste punktene fra «nå» (MET gir 1-t-oppløsning
     ~2,5 døgn framover, så dette fylles uansett klokkeslett). Hver post har
     temp + nedbør (next_1_hours) + symbol + vind. */
  function buildDayHours(ts) {
    var out = [];
    for (var i = 0; i < ts.length && out.length < 24; i++) {
      var e = ts[i], det = e.data.instant.details, n1 = e.data.next_1_hours;
      if (!n1) break; // forbi 1-t-sonen → stopp (6-t-blokker egner seg ikke til time-graf)
      if (typeof det.air_temperature !== 'number' || isNaN(det.air_temperature)) continue; // hopp over hull (som buildWeek)
      out.push({
        t: e.time,
        hour: new Date(e.time).getHours(),
        temp: det.air_temperature,
        precip: (n1.details && typeof n1.details.precipitation_amount === 'number') ? n1.details.precipitation_amount : 0,
        sym: (n1.summary && n1.summary.symbol_code) || '',
        wind: det.wind_speed,
        dir: det.wind_from_direction
      });
    }
    return out;
  }
  function loadWeather(place, force) {
    var key = 'wx_' + place.lat.toFixed(3) + '_' + place.lon.toFixed(3);
    var c = cacheGet(key);
    if (!force && fresh(c, 30 * 60 * 1000)) { renderWeather(c.d); return; }
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
                  week: buildWeek(ts), dayHours: buildDayHours(ts) };
        cacheSet(key, d); renderWeather(d);
      })
      .catch(function () { /* behold cachet/HTML-verdi */ });
  }

  /* ═══════════ FULLSKJERM VÆRMELDING (dag-graf + neste 7 dager) ═══════════
     «Utvid»-knapp på værkortet åpner en modal med (1) stor time-for-time-graf
     for i dag/neste 24t og (2) de neste 7 dagene. All data er allerede hentet
     og cachet (d.dayHours + d.week) — modalen gjør ingen egne nettverkskall. */

  /* Utvid-knapp: legges i værkortets tall-rad (til høyre for temperaturen). */
  function buildExpand() {
    var card = $('wxCard'); if (!card) return;
    var row = card.querySelector('.widget-value') || card;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wx-expand';
    btn.id = 'wxExpandBtn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', 'Åpne full værmelding – i dag time for time og neste 7 dager');
    btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.5H3.5V5 M10 2.5H12.5V5 M6 13.5H3.5V11 M10 13.5H12.5V11"/></svg>';
    btn.addEventListener('click', function (e) { e.stopPropagation(); openWxModal(); });
    row.appendChild(btn);
  }

  /* Bygger modal-DOM én gang (lazy), gjenbrukes deretter. */
  function buildWxModal() {
    if (_modalEls) return _modalEls;
    var bd = document.createElement('div');
    bd.className = 'wx-modal-backdrop';
    bd.hidden = true;
    bd.innerHTML =
      '<div class="wx-modal" role="dialog" aria-modal="true" aria-labelledby="wxModalPlace" tabindex="-1">' +
        '<header class="wx-modal-head">' +
          '<div><h2 class="wx-modal-place" id="wxModalPlace">Vær</h2>' +
          '<span class="wx-modal-stamp" id="wxModalStamp"></span></div>' +
          '<button type="button" class="wx-modal-close" id="wxModalClose" aria-label="Lukk værmelding">' +
            '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>' +
          '</button>' +
        '</header>' +
        '<div class="wx-modal-scroll">' +
          '<p class="sr-only" id="wxModalSr"></p>' +
          '<div class="wx-kicker">I dag · time for time</div>' +
          '<p class="wx-graph-sub" id="wxGraphSub"></p>' +
          '<div class="wx-graph-wrap"><div id="wxGraphHost"></div><div class="wx-scrub" id="wxScrub" aria-hidden="true"></div></div>' +
          '<div class="wx-stats" id="wxStats"></div>' +
          '<section class="wx-week"><div class="wx-kicker">Neste 7 dager</div><ul class="wx-week-list" id="wxWeekHost"></ul></section>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bd);
    _modalEls = {
      bd: bd, modal: bd.querySelector('.wx-modal'), close: $('wxModalClose'),
      graphHost: $('wxGraphHost'), weekHost: $('wxWeekHost'), scrub: $('wxScrub'),
      sub: $('wxGraphSub'), stats: $('wxStats'), sr: $('wxModalSr'), stamp: $('wxModalStamp')
    };
    _modalEls.close.addEventListener('click', closeWxModal);
    bd.addEventListener('click', function (e) { if (e.target === bd) closeWxModal(); });
    _modalEls.modal.addEventListener('keydown', onModalKeydown);
    wireScrub();
    return _modalEls;
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeWxModal(); return; }
    if (e.key !== 'Tab') return;
    var f = _modalEls.modal.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])');
    var list = [];
    for (var i = 0; i < f.length; i++) if (f[i].offsetParent !== null) list.push(f[i]);
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function modalStamp() {
    if (!_modalEls) return;
    var d = new Date();
    var cond = (_lastWx && _lastWx.sym) ? wxText(_lastWx.sym) : '';
    _modalEls.stamp.textContent = (cond ? cond + ' · ' : '') + 'oppdatert ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function openWxModal() {
    var els = buildWxModal();
    // Forankre fokus-retur til selve utvid-knappen: Safari/Firefox-macOS gir ikke
    // <button> fokus ved musseklikk, så document.activeElement er da <body>.
    var ae = document.activeElement;
    _wxReturnFocus = (ae && ae !== document.body) ? ae : $('wxExpandBtn');
    _modalOpen = true;
    _prevHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    setText('wxModalPlace', getPlace().navn || 'Vær');
    modalStamp();
    if (_lastWx) { renderDayGraph(_lastWx); renderWeek(_lastWx); }
    else {
      els.graphHost.innerHTML = '<svg class="wx-graph" viewBox="0 0 760 300" role="img" aria-label="Værdata lastes"><text class="g-empty" x="34" y="150">Værdata lastes …</text></svg>';
      els.sub.textContent = ''; els.stats.innerHTML = ''; els.weekHost.innerHTML = '';
    }
    els.bd.hidden = false;
    void els.bd.offsetWidth; // tvinger reflow så .in-transisjonen faktisk kjører fra opacity:0/translate
    els.bd.classList.add('in');
    els.close.focus();
  }

  function closeWxModal() {
    if (!_modalEls || !_modalOpen) return;
    _modalOpen = false;
    var els = _modalEls;
    els.bd.classList.remove('in');
    document.documentElement.style.overflow = _prevHtmlOverflow || '';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Guard mot rask lukk→åpne-race: skjul KUN hvis modalen fortsatt er lukket
    // når exit-transisjonen (eller 600ms-fallbacken) fyrer.
    function done() { els.modal.removeEventListener('transitionend', te); if (!_modalOpen) els.bd.hidden = true; }
    function te(e) { if (e.target === els.modal) done(); }
    if (reduce) { done(); }
    else { els.modal.addEventListener('transitionend', te); setTimeout(done, 600); }
    if (_wxReturnFocus && _wxReturnFocus.focus) _wxReturnFocus.focus();
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
  /* Rutelinje-verdier på pene heltall innenfor [lo,hi] (maks 3-4 linjer). */
  function niceTicks(lo, hi) {
    var span = (hi - lo) || 1;
    var step = span >= 20 ? 10 : span >= 8 ? 5 : span >= 3 ? 2 : 1;
    var ticks = [], v;
    for (v = Math.ceil(lo / step) * step; v <= hi + 1e-6 && ticks.length < 5; v += step) ticks.push(v);
    if (ticks.length < 2) ticks = [hi, (hi + lo) / 2, lo];
    if (ticks.length > 4) ticks = [ticks[0], ticks[Math.floor(ticks.length / 2)], ticks[ticks.length - 1]];
    return ticks.map(function (t) { return Math.round(t); });
  }
  /* Nøkkeltall-rad: Nå · Maks · Min · Vind (erstatter tekst-caption). */
  function statCell(lbl, val, unit, dir, isNow) {
    return '<div class="wx-stat"><div class="wx-stat-lbl">' + lbl + '</div>' +
      '<div class="wx-stat-val' + (isNow ? ' is-now' : '') + '"><span>' + val + '</span>' +
      (unit ? '<span class="u">' + unit + '</span>' : '') +
      (dir ? '<span class="d">' + dir + '</span>' : '') + '</div></div>';
  }
  function renderStats(hrs, d) {
    var els = _modalEls; if (!els) return;
    if (!hrs.length) { els.stats.innerHTML = ''; return; }
    var temps = hrs.map(function (h) { return h.temp; });
    var tmax = Math.round(Math.max.apply(null, temps)), tmin = Math.round(Math.min.apply(null, temps));
    var windOk = d && typeof d.wind === 'number';
    els.stats.innerHTML =
      statCell('Nå', Math.round(hrs[0].temp) + '°', '', '', true) +
      statCell('Maks', tmax + '°', '', '', false) +
      statCell('Min', tmin + '°', '', '', false) +
      statCell('Vind', windOk ? String(Math.round(d.wind)) : '–', windOk ? 'm/s' : '',
               (windOk && d.dir != null) ? compass(d.dir) : '', false);
  }

  /* Stor time-for-time-graf: glatt temperaturkurve + nedbørsøyler (nøytral) + symbolrad
     + pene rutelinjer + myk «nå»-halo. Bygges fra cachet d.dayHours. */
  function renderDayGraph(d) {
    var els = _modalEls; if (!els) return;
    // Filtrer bort punkter uten gyldig temperatur (null/undefined/NaN/Infinity fra
    // delvis/korrupt cache) — ellers forgifter ett hull hele Y-skalaen.
    var hrs = ((d && d.dayHours) || []).filter(function (h) { return h && typeof h.temp === 'number' && isFinite(h.temp); });
    var sig = JSON.stringify(hrs);
    if (sig === _graphSig) return; // uendret data (minutt-puls) — ikke bygg SVG på nytt (bevarer hover-scrub)
    _graphSig = sig;
    var today = new Date();
    els.sub.textContent = DAGER_FULL[today.getDay()] + ' ' + today.getDate() + '. ' + MND_LONG[today.getMonth()];
    if (hrs.length < 2) {
      els.graphHost.innerHTML = '<svg class="wx-graph" viewBox="0 0 760 300" role="img" aria-label="Værdata lastes"><text class="g-empty" x="34" y="150">Værdata lastes …</text></svg>';
      els.stats.innerHTML = ''; els.sr.textContent = ''; _graphGeo = null; return;
    }
    var W = 760, H = 300, PADL = 34, PADR = 14, plotW = W - PADL - PADR;
    var TT = 68, TB = 192, ABASE = 200, PBASE = 250; // temp-bånd 68→192, area-baseline 200, nedbør-baseline 250
    var n = hrs.length;
    function X(i) { return n <= 1 ? PADL : PADL + (i / (n - 1)) * plotW; }
    var temps = hrs.map(function (h) { return h.temp; }); // alle endelige tall (filtrert over)
    var tmin0 = Math.min.apply(null, temps), tmax0 = Math.max.apply(null, temps); // faktiske
    var tmin = tmin0, tmax = tmax0;
    if (tmax - tmin < 1) { tmax += 1; tmin -= 1; } // flat dag → gi båndet høyde
    function Y(t) { return TT + (tmax - t) / (tmax - tmin) * (TB - TT); }
    var precs = hrs.map(function (h) { return h.precip || 0; });
    var maxP = Math.max.apply(null, precs), anyP = maxP > 0.05, wettest = 0;
    for (var wi = 1; wi < precs.length; wi++) if (precs[wi] > precs[wettest]) wettest = wi;
    var dense = (window.matchMedia && window.matchMedia('(max-width:640px)').matches) ? 4 : 3;

    // glatt kurve + fylt areal ned til area-baseline
    var pts = hrs.map(function (h, i) { return [X(i), Y(h.temp)]; });
    var line = smoothPath(pts);
    var area = line + ' L' + X(n - 1).toFixed(1) + ',' + ABASE + ' L' + X(0).toFixed(1) + ',' + ABASE + ' Z';

    var g = '';
    niceTicks(tmin0, tmax0).forEach(function (v) {
      var gy = Y(v);
      g += '<line class="g-grid" x1="' + PADL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - PADR) + '" y2="' + gy.toFixed(1) + '"/>';
      g += '<text class="y-lbl" x="' + (PADL - 8) + '" y="' + (gy + 3.5).toFixed(1) + '" text-anchor="end">' + v + '°</text>';
    });
    g += '<path class="g-area" d="' + area + '" fill="url(#wxGraphFill)"/>';
    g += '<path class="g-line" d="' + line + '"/>';
    // nedbør: baseline + søyler (nøytral ink)
    g += '<line class="g-grid" x1="' + PADL + '" y1="' + PBASE + '" x2="' + (W - PADR) + '" y2="' + PBASE + '"/>';
    if (anyP) {
      hrs.forEach(function (h, i) {
        var p = h.precip || 0; if (p <= 0.05) return;
        var bh = Math.max(2, Math.min(30, p / maxP * 30));
        g += '<rect class="g-precip" x="' + (X(i) - 3).toFixed(1) + '" y="' + (PBASE - bh).toFixed(1) + '" width="6" height="' + bh.toFixed(1) + '" rx="1"/>';
      });
      g += '<text class="p-cap" x="' + PADL + '" y="' + (PBASE - 34) + '">Nedbør</text>';
      g += '<text class="p-lbl" x="' + X(wettest).toFixed(1) + '" y="' + (PBASE - 34) + '" text-anchor="middle">' + nb(maxP, 1) + ' mm</text>';
    }
    // symbolrad (hver 3./4. time), «nå» aksentfarget. Nested SVG MÅ ha eksplisitt størrelse.
    hrs.forEach(function (h, i) {
      if (i % dense !== 0) return;
      var ic = wxIcon(h.sym).replace('<svg ', '<svg width="20" height="20" x="' + (X(i) - 10).toFixed(1) + '" y="9" ');
      g += '<g class="g-sym' + (i === 0 ? ' is-now' : '') + '">' + ic + '</g>';
    });
    // time-etiketter («nå» aksentfarget)
    hrs.forEach(function (h, i) {
      if (i % dense !== 0) return;
      var lbl = i === 0 ? 'nå' : String(h.hour).padStart(2, '0');
      g += '<text class="x-lbl' + (i === 0 ? ' x-now' : '') + '" x="' + X(i).toFixed(1) + '" y="272" text-anchor="middle">' + lbl + '</text>';
    });
    // skjult skrubbe-linje (hover-avlesning)
    g += '<line class="g-scrub" id="wxScrubLine" x1="0" y1="' + TT + '" x2="0" y2="' + PBASE + '"/>';
    // «nå»-markør: myk halo-prikk (3 konsentriske sirkler) på kurven
    var nx = X(0).toFixed(1), ny = Y(hrs[0].temp).toFixed(1);
    g += '<circle class="g-now-halo" cx="' + nx + '" cy="' + ny + '" r="6.5"/>' +
         '<circle class="g-now-mid" cx="' + nx + '" cy="' + ny + '" r="4.5"/>' +
         '<circle class="g-now-dot" cx="' + nx + '" cy="' + ny + '" r="3"/>';

    var aria = 'Temperatur time for time. Nå ' + Math.round(hrs[0].temp) + ' grader, maks ' +
      Math.round(tmax0) + ', min ' + Math.round(tmin0) + ' grader' + (anyP ? ', noe nedbør' : '');
    els.graphHost.innerHTML =
      '<svg class="wx-graph" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(aria) + '">' +
        '<defs><linearGradient id="wxGraphFill" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" class="gf-a"/><stop offset="1" class="gf-b"/>' +
        '</linearGradient></defs>' + g + '</svg>';
    els.sr.textContent = aria;
    renderStats(hrs, d);

    var geo = { n: n, xs: [], ys: [], hours: hrs, vbW: W, vbH: H };
    for (var gi = 0; gi < n; gi++) { geo.xs.push(X(gi)); geo.ys.push(Y(hrs[gi].temp)); }
    _graphGeo = geo;
  }

  /* Neste 7 dager: typografisk tabell (dag · symbol · maks/min-stolpe · temp). */
  function renderWeek(d) {
    var els = _modalEls; if (!els) return;
    var wk = (d && d.week) || [];
    var wsig = JSON.stringify(wk);
    if (wsig === _weekSig) return; // uendret ukesvarsel (minutt-puls) — ikke bygg på nytt
    _weekSig = wsig;
    if (!wk.length) { els.weekHost.innerHTML = ''; return; }
    var gMin = Infinity, gMax = -Infinity;
    wk.forEach(function (w) { if (w.min < gMin) gMin = w.min; if (w.max > gMax) gMax = w.max; });
    var gRng = (gMax - gMin) || 1, html = '';
    wk.forEach(function (w, i) {
      var name = i === 0 ? 'I dag' : DAGER_FULL[w.dow];
      var L = (w.min - gMin) / gRng * 100, Wd = (w.max - w.min) / gRng * 100;
      if (Wd < 4) Wd = 4;
      html += '<li class="wx-week-row' + (i === 0 ? ' is-today' : '') + '">' +
        '<span class="wx-week-day">' + name + '</span>' +
        '<span class="wx-week-ico">' + wxIcon(w.sym) + '</span>' +
        '<span class="wx-week-range"><i style="left:' + L.toFixed(1) + '%;width:' + Wd.toFixed(1) + '%"></i></span>' +
        '<span class="wx-week-t">' + Math.round(w.max) + '°<span class="sl">/</span><span class="mn">' + Math.round(w.min) + '°</span></span>' +
        '</li>';
    });
    els.weekHost.innerHTML = html;
  }

  /* Hover-avlesning (kun presise pekere): snapper en tynn linje + en liten
     chip til nærmeste time. Ingen touch-scrubbing (så mobil-arket scroller fritt). */
  function wireScrub() {
    var els = _modalEls; if (!els) return;
    var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!fine) return;
    var wrap = els.graphHost.parentNode;
    wrap.addEventListener('pointermove', function (e) {
      if (!_graphGeo) return;
      var svg = els.graphHost.querySelector('svg'); if (!svg) return;
      var rect = svg.getBoundingClientRect(), wrapRect = wrap.getBoundingClientRect();
      var vbx = (e.clientX - rect.left) / rect.width * 720;
      var best = 0, bd = Infinity;
      for (var i = 0; i < _graphGeo.n; i++) { var dd = Math.abs(_graphGeo.xs[i] - vbx); if (dd < bd) { bd = dd; best = i; } }
      var line = svg.querySelector('#wxScrubLine');
      if (line) { line.setAttribute('x1', _graphGeo.xs[best].toFixed(1)); line.setAttribute('x2', _graphGeo.xs[best].toFixed(1)); line.classList.add('on'); }
      var h = _graphGeo.hours[best];
      els.scrub.innerHTML = '<b>' + (best === 0 ? 'nå' : String(h.hour).padStart(2, '0') + ':00') + '</b> · ' +
        Math.round(h.temp) + '°' + (h.precip > 0.05 ? ' · <span class="mut">' + nb(h.precip, 1) + ' mm</span>' : '');
      els.scrub.style.left = ((rect.left - wrapRect.left) + _graphGeo.xs[best] / _graphGeo.vbW * rect.width) + 'px';
      els.scrub.style.top = ((rect.top - wrapRect.top) + _graphGeo.ys[best] / _graphGeo.vbH * rect.height) + 'px';
      els.scrub.classList.add('on');
    });
    wrap.addEventListener('pointerleave', function () {
      els.scrub.classList.remove('on');
      var svg = els.graphHost.querySelector('svg'), line = svg && svg.querySelector('#wxScrubLine');
      if (line) line.classList.remove('on');
    });
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
      out[cur] = { last: vals[vals.length - 1], prev: vals[vals.length - 2], series: vals, dates: dates };
    }
    return out;
  }
  function renderFx(d) {
    if (!d.USD) return;
    countUp('fxVal', d.USD.last, 2);
    var sub = [];
    if (d.EUR) sub.push('EUR ' + nb(d.EUR.last, 2));
    if (d.GBP) sub.push('GBP ' + nb(d.GBP.last, 2));
    if (d.SEK) sub.push('SEK ' + nb(d.SEK.last, 2));
    setText('fxSub', sub.join(' · '));
    var span = $('fxTrend');
    if (span && d.USD.prev != null) {
      var diff = d.USD.last - d.USD.prev, dir = Math.abs(diff) < 0.0005 ? 0 : diff > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), 2) + '</span>';
    }
    var dts = d.USD.dates;
    if (dts && dts.length) {
      setText('fxAx0', nbShort(dts[0]));
      setText('fxAx1', nbShort(dts[Math.floor((dts.length - 1) / 2)]));
      setText('fxAx2', 'i dag');
    }
    applySpark($('fxCard'), d.USD.series);
    _fx = d; buildTicker();
    stampNow();
  }
  function loadFx(force) {
    var c = cacheGet('fx');
    /* 1 t TTL (var 6 t): Norges Bank publiserer ~16:00 — med minutt-pulsen
       plukkes ny dagskurs opp senest en time etter publisering. */
    if (!force && fresh(c, 3600 * 1000)) { renderFx(c.d); return; }
    if (c) renderFx(c.d);
    fetch('https://data.norges-bank.no/api/data/EXR/B.USD+EUR+GBP+SEK.NOK.SP?lastNObservations=30&format=sdmx-json&locale=en')
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
    setText('srSub', 'Norges Bank · sist endret ' + nbDate(d.changeDate));
    var span = $('srTrend');
    if (span) {
      var diff = d.last - d.prevLevel, dir = Math.abs(diff) < 0.001 ? 0 : diff > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + nb(Math.abs(diff), 2) + '<i> pp</i></span>';
    }
    // En rente som endres ~4 ggr/år sier lite som sparkline → vis neste rentemøte i stedet.
    var nm = nextMeeting(), lbl = $('srNextLbl'), val = $('srNext');
    if (lbl && val) {
      if (nm) { lbl.textContent = 'Neste rentemøte'; val.textContent = nbShort(nm) + ' ' + nm.slice(0, 4); }
      else { lbl.textContent = ''; val.textContent = ''; }
    }
    _rate = d; buildTicker();
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
    setText('stSub', 'Billigst kl ' + ch + ' · ' + Math.round(d.cheap * 100) + ' øre · snitt ' + Math.round(d.avg * 100) + ' øre');
    var span = $('stTrend');
    if (span) {
      var pct = d.avg ? (d.now - d.avg) / d.avg * 100 : 0, dir = Math.abs(pct) < 0.5 ? 0 : pct > 0 ? 1 : -1;
      trendClass(span, dir);
      span.innerHTML = arrowSvg(dir) + '<span>' + (dir > 0 ? '+' : dir < 0 ? '−' : '±') + Math.round(Math.abs(pct)) + '<i>%</i></span>';
    }
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
    prices.forEach(function (p, i) {
      var h = Math.max(2, (p / mx) * 26), y = 28 - h, x = i * slot + (slot - bw) / 2;
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
    setText('wxModalPlace', p.navn); // hold fullskjerm-tittelen i synk (no-op om modal ikke bygd)
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
    var d = new Date();
    var t = 'Sist oppdatert ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    stamp.innerHTML = '<span id="dailyStampTxt">' + t + '</span>' +
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

  /* ── Minutt-puls ─────────────────────────────────────────────────
     Panelet sjekker alle kilder hvert 60. sekund og ved retur til fanen.
     Nettverk brukes kun når cache-TTL er utløpt (vær 30 min per MET-vilkårene,
     valuta/rente 1 t, strøm 1 t) — men strøm-«nå»-timen og tidsstempelet
     re-rendres lokalt hver puls, så tallene aldri står og blir gamle. */
  function tick() {
    if (document.hidden) return;
    var p = getPlace();
    loadWeather(p, false); loadFx(false); loadRate(false); loadStrom(p, false);
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    var place = getPlace();
    setText('wxPlaceName', place.navn);
    buildStamp(); buildPicker(); buildGeo(); buildExpand();
    loadWeather(place, false); loadFx(false); loadRate(false); loadStrom(place, false);
    setInterval(tick, 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
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
