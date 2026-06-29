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
  function renderWeather(d) {
    countUp('wxTemp', Math.round(d.temp), 0);
    setText('wxCond', wxText(d.sym));
    var sub = 'Maks ' + Math.round(d.max) + '° · Min ' + Math.round(d.min) + '°';
    if (typeof d.wind === 'number') sub += ' · ' + nb(d.wind, 1) + ' m/s' + (d.dir != null ? ' ' + compass(d.dir) : '');
    setText('wxSub', sub);
    buildForecast(d.hours);
    stampNow();
  }
  /* Værmeldings-stripe: «nå» + neste timer framover (klokke + symbol + grad).
     Erstatter den gamle baklengs temp-sparklinen. */
  function buildForecast(hours) {
    var el = $('wxForecast'); if (!el || !hours || !hours.length) return;
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
                  sym: sym, max: Math.max.apply(null, temps), min: Math.min.apply(null, temps), temps: temps, hours: hours };
        cacheSet(key, d); renderWeather(d);
      })
      .catch(function () { /* behold cachet/HTML-verdi */ });
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
    if (!force && fresh(c, 6 * 3600 * 1000)) { renderFx(c.d); return; }
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
    if (!force && fresh(c, 12 * 3600 * 1000)) { renderRate(c.d); return; }
    if (c) renderRate(c.d);
    var start = new Date(Date.now() - 18 * 30 * 864e5).toISOString().slice(0, 10);
    fetch('https://data.norges-bank.no/api/data/IR/B.KPRA.SD.R?startPeriod=' + start + '&format=sdmx-json&locale=en')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var d = parseRate(j); cacheSet('rate', d); renderRate(d); })
      .catch(function () {});
  }

  /* ═══════════════════ STRØM (hvakosterstrømmen.no) ══════════════════ */
  function renderStrom(d, sone) {
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
    buildStromBars(d.prices, d.hour, d.cheapHour);
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

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    var place = getPlace();
    setText('wxPlaceName', place.navn);
    buildStamp(); buildPicker(); buildGeo();
    loadWeather(place, false); loadFx(false); loadRate(false); loadStrom(place, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
