/* /avansert/finans/dcf/ — kobler skjemaet til regnemotoren i /avansert/finans/modellering.js. */
(function(){
  'use strict';
  var M = window.HVModell;
  if(!M) return;
  var $ = function(id){ return document.getElementById(id); };
  var fcfIn = [].slice.call(document.querySelectorAll('.dcf-fcf'));
  var pvOut = [].slice.call(document.querySelectorAll('.dcf-pv'));

  // Medistim ASA, årsrapport 2025, tusen kroner. Fri kontantstrøm 2025 = 144 318 (regnestykket står på siden).
  // Vekst, avkastningskrav og WACC-delene er antakelser.
  var EKS = {
    enhet:'1000', base:144318, vekst5:8, wacc:8.9, g:2.5, gjeld:49271, kont:212088, aksjer:18282848, kurs:259,
    rf:4, beta:1, mp:5, rd:5, tax:22, e:4735258, d:49271
  };
  var PCT = ['vekst5', 'wacc', 'g', 'rf', 'mp', 'rd', 'tax'];

  function num(el){ return M.parseNum(el.value); }
  function pctv(id){ return M.parseNum($(id).value) / 100; }
  // Skriv et tall inn i et felt med mellomrom som tusenskille, som resten av nettstedet.
  function put(el, n, d){
    if(!isFinite(n)){ el.value = ''; return; }
    el.value = M.fmt(n, d || 0).replace(/ /g, ' ').replace('−', '-');
  }
  function decs(n){ var s = String(n); return s.indexOf('.') < 0 ? 0 : Math.min(2, s.split('.')[1].length); }
  // Kroner, eller dollar når tallene er hentet fra SEC (se «Hent tall» nederst i fila).
  var USD = false;
  var yearsAuto = false; // årene er fylt inn fra «vekst per år» og ikke rettet for hånd
  var eAuto = false;     // markedsverdien i WACC-hjelpen følger børskursen
  function kort(){ return USD ? 'USD' : 'kr'; }
  function unitName(){ var u = $('dcf-enhet').value, k = kort(); return u === '1000' ? 'tusen ' + k : (u === '1000000' ? 'mill. ' + k : k); }
  function money(n){ return M.fmt(n, 0) + ' ' + unitName(); }

  function fill(o){
    $('dcf-enhet').value = o.enhet;
    put($('dcf-base'), o.base); put($('dcf-vekst5'), o.vekst5, decs(o.vekst5));
    put($('dcf-wacc'), o.wacc, decs(o.wacc)); put($('dcf-g'), o.g, decs(o.g));
    put($('dcf-gjeld'), o.gjeld); put($('dcf-kont'), o.kont); put($('dcf-aksjer'), o.aksjer); put($('dcf-kurs'), o.kurs, decs(o.kurs));
    put($('w-rf'), o.rf, decs(o.rf)); put($('w-beta'), o.beta, decs(o.beta)); put($('w-mp'), o.mp, decs(o.mp));
    put($('w-rd'), o.rd, decs(o.rd)); put($('w-tax'), o.tax, decs(o.tax)); put($('w-e'), o.e); put($('w-d'), o.d);
    fillYears();
  }
  function fillYears(){
    var b = num($('dcf-base')), v = pctv('dcf-vekst5');
    if(!isFinite(b) || !isFinite(v)) return;
    fcfIn.forEach(function(el, i){ put(el, Math.round(b * Math.pow(1 + v, i + 1))); });
  }

  function readFcf(){
    // Fyllte år i rekkefølge. Et tomt år avslutter rekka; tall etter et hull blir ikke med.
    var out = [];
    for(var i = 0; i < fcfIn.length; i++){
      var n = num(fcfIn[i]);
      if(!isFinite(n)) break;
      out.push(n);
    }
    return out;
  }

  function calcWacc(){
    var re = M.capm(pctv('w-rf'), M.parseNum($('w-beta').value), pctv('w-mp'));
    var E = num($('w-e')), D = num($('w-d')) || 0, rd = pctv('w-rd'), t = pctv('w-tax');
    var w = M.wacc({ E:E, D:D, re:re, rd:rd, tax:t });
    $('w-re').textContent = M.pct(re, 2);
    $('w-re-f').textContent = isFinite(re) ? M.pct(pctv('w-rf'), 1) + ' + ' + M.fmt(M.parseNum($('w-beta').value), 2) + ' × ' + M.pct(pctv('w-mp'), 1) : '';
    $('w-rdt').textContent = M.pct(rd * (1 - t), 2);
    $('w-vekt').textContent = (E + D > 0) ? M.pct(E / (E + D), 1) + ' / ' + M.pct(D / (E + D), 1) : '–';
    $('w-wacc').textContent = M.pct(w, 2);
    return w;
  }

  function calc(){
    var fcf = readFcf(), r = pctv('dcf-wacc'), g = pctv('dcf-g');
    var debt = num($('dcf-gjeld')) || 0, cash = num($('dcf-kont')) || 0;
    var shares = M.parseNum($('dcf-aksjer').value), unit = +$('dcf-enhet').value;
    var o = { fcf:fcf, r:r, g:g, debt:debt, cash:cash, shares:shares, unit:unit };
    var res = M.dcf(o);
    var kurs = M.parseNum($('dcf-kurs').value), hasShares = shares > 0, hasKurs = hasShares && kurs > 0;
    // Tall fra SEC: markedsverdien i WACC-hjelpen er børskurs × antall aksjer til brukeren skriver noe annet.
    if(USD && eAuto) put($('w-e'), hasKurs ? Math.round(kurs * shares / unit) : NaN);
    calcWacc();

    // Omvendt: veksten per år i fem år som gir akkurat børskursen. Trenger ikke årene i del 1.
    var impl = hasKurs ? M.impliedGrowth({ base:num($('dcf-base')), target:kurs, years:5, r:r, g:g, debt:debt, cash:cash, shares:shares, unit:unit }) : NaN;
    var implTxt = isFinite(impl) ? M.pct(impl, 1) : (impl === Infinity ? 'over 100 %' : (impl === -Infinity ? 'under −50 %' : ''));
    $('r-impl').textContent = implTxt ? implTxt + ' per år' : '–';
    $('r-impl-s').textContent = implTxt ? 'Jevn vekst i fem år som gir akkurat kursen, med ditt avkastningskrav og din vekst for alltid'
      : (hasKurs ? 'Krever positiv fri kontantstrøm i fjor (del 1), avkastningskrav og vekst for alltid' : 'Fyll inn børskurs og antall aksjer');
    var implKort = implTxt ? 'Kursen ' + M.fmt(kurs, decs(kurs)) + ' ' + kort() + ' forutsetter ' + implTxt + ' vekst per år' : '';

    pvOut.forEach(function(el, i){ el.textContent = res.ok && res.rows[i] ? M.fmt(res.rows[i].pv, 0) : '–'; });
    var feil = $('dcf-feil');
    if(!res.ok){
      feil.hidden = false; feil.textContent = res.err;
      ['s-ps', 's-eq', 's-ev', 's-tv', 'r-pvsum', 'r-tv', 'r-pvtv', 'r-ev', 'r-gjeld', 'r-kont', 'r-eq', 'r-aksjer', 'r-ps', 'r-kurs'].forEach(function(id){ $(id).textContent = '–'; });
      $('s-ps-s').textContent = implKort; $('s-eq-s').textContent = ''; $('r-kurs-s').textContent = '';
      $('dcf-sens').innerHTML = ''; $('dcf-scn').innerHTML = ''; $('dcf-tvvarsel').hidden = true;
      return;
    }
    feil.hidden = true;
    var n = res.n;
    $('r-pvsum').textContent = money(res.pvSum);
    $('r-pvsum-s').textContent = 'Summen av nåverdiene for år 1' + (n > 1 ? '–' + n : '');
    $('r-tv').textContent = money(res.tv);
    $('r-tv-s').textContent = M.fmt(fcf[n - 1], 0) + ' × ' + M.fmt(1 + g, 3) + ' / (' + M.pct(r, 1) + ' − ' + M.pct(g, 1) + '). Verdien ved slutten av år ' + n + '.';
    $('r-pvtv').textContent = money(res.pvTv);
    $('r-pvtv-s').textContent = 'Terminalverdien / ' + M.fmt(1 + r, 3) + (n > 1 ? '^' + n : '');
    $('r-ev').textContent = money(res.ev);
    $('r-gjeld').textContent = money(-debt);
    $('r-kont').textContent = (cash > 0 ? '+' : '') + money(cash);
    $('r-eq').textContent = money(res.equity);
    $('r-aksjer').textContent = hasShares ? M.fmt(shares, 0) : 'Ikke fylt inn';
    $('r-ps').textContent = hasShares ? M.fmt(res.perShare, 2) + ' ' + kort() : '–';

    $('s-ps').textContent = hasShares ? M.fmt(res.perShare, 2) + ' ' + kort() : '–';
    $('s-ps-s').textContent = hasShares ? (implKort || (hasKurs ? vsKurs(res.perShare, kurs) + ' kursen ' + M.fmt(kurs, decs(kurs)) + ' ' + kort() : '')) : 'Fyll inn antall aksjer';
    $('r-kurs').textContent = hasKurs ? M.fmt(kurs, 2) + ' ' + kort() : 'Ikke fylt inn';
    $('r-kurs-s').textContent = hasKurs ? 'Verdien er ' + vsKurs(res.perShare, kurs) + ' kursen' : '';
    var tvv = $('dcf-tvvarsel');
    tvv.hidden = !(res.tvShare > 0.75);
    tvv.textContent = 'Over tre firedeler av verdien kommer fra årene etter prognosen. Svaret hviler mest på avkastningskravet og veksten for alltid, så se på tabellene under.';
    $('s-eq').textContent = M.fmt(res.equity, 0);
    $('s-eq-s').textContent = unitName();
    $('s-ev').textContent = M.fmt(res.ev, 0);
    $('s-tv').textContent = M.pct(res.tvShare, 0);

    sens(o, hasShares, hasKurs ? kurs : NaN);
    scenarios(o, hasShares, hasKurs ? kurs : NaN);
  }

  // «35 % under» / «12 % over» kursen.
  function vsKurs(ps, kurs){
    var d = ps / kurs - 1;
    return Math.abs(d) < 0.005 ? 'omtrent lik' : M.pct(Math.abs(d), 0) + (d < 0 ? ' under' : ' over');
  }

  // Svak og sterk endrer bare veksten i prognoseårene (−4 og +7 prosentpoeng per år).
  function scenarios(o, hasShares, kurs){
    var v = pctv('dcf-vekst5'), hasV = isFinite(v); if(!hasV) v = 0;
    var S = [['Svak', -0.04], ['Normal', 0], ['Sterk', 0.07]];
    var h = '<caption>Tre scenarioer <small>' + (hasShares ? 'Verdi per aksje i ' + (USD ? 'dollar' : 'kroner') : 'Egenkapitalverdi, ' + unitName()) + '</small></caption>';
    h += '<thead><tr><th scope="col">Scenario</th><th scope="col">Vekst per år</th><th scope="col">' + (hasShares ? 'Verdi per aksje' : 'Egenkapitalverdi') + '</th>' + (isFinite(kurs) ? '<th scope="col">Mot kursen</th>' : '') + '</tr></thead><tbody>';
    S.forEach(function(sc){
      var k = (1 + v + sc[1]) / (1 + v);
      var fcf = o.fcf.map(function(x, i){ return x * Math.pow(k, i + 1); });
      var res = M.dcf({ fcf:fcf, r:o.r, g:o.g, debt:o.debt, cash:o.cash, shares:o.shares, unit:o.unit });
      var val = res.ok ? (hasShares ? res.perShare : res.equity) : NaN;
      h += '<tr' + (sc[1] === 0 ? ' class="sum"' : '') + '><td>' + sc[0] + '</td><td>' + (hasV ? M.pct(v + sc[1], 1) : (sc[1] === 0 ? 'Som over' : (sc[1] > 0 ? '+' : '−') + M.fmt(Math.abs(sc[1]) * 100, 0) + ' poeng')) + '</td>';
      h += '<td>' + (isFinite(val) ? M.fmt(val, hasShares ? 2 : 0) : '–') + '</td>';
      if(isFinite(kurs)) h += '<td>' + (isFinite(val) ? vsKurs(val, kurs) : '–') + '</td>';
      h += '</tr>';
    });
    $('dcf-scn').innerHTML = h + '</tbody>';
  }

  function sens(o, hasShares, kurs){
    var dr = [-0.02, -0.01, 0, 0.01, 0.02], dg = [-0.01, -0.005, 0, 0.005, 0.01];
    var grid = M.sensitivity(o, dr, dg);
    $('sens-lead').textContent = hasShares
      ? 'Verdi per aksje i ' + (USD ? 'dollar' : 'kroner') + ' med andre krav og vekst. Midten er svaret over.' + (isFinite(kurs) ? ' Fet skrift er over børskursen.' : '')
      : 'Egenkapitalverdien (' + unitName() + ') med andre krav og vekst. Midten er svaret over.';
    var h = '<caption class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">' + (hasShares ? 'Verdi per aksje' : 'Egenkapitalverdi') + ' for ulike WACC (rader) og vekst for alltid (kolonner)</caption>';
    h += '<thead><tr><th scope="col" class="corner">WACC ↓ · vekst →</th>';
    dg.forEach(function(d){ h += '<th scope="col">' + M.pct(o.g + d, 1) + '</th>'; });
    h += '</tr></thead><tbody>';
    grid.forEach(function(row, i){
      h += '<tr><th scope="row">' + M.pct(o.r + dr[i], 1) + '</th>';
      row.forEach(function(v, j){
        var base = dr[i] === 0 && dg[j] === 0, over = hasShares && v > kurs;
        var cls = (base ? 'base' : '') + (over ? (base ? ' ' : '') + 'over' : '');
        h += '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + (isFinite(v) ? M.fmt(v, hasShares ? 0 : 0) : '–') + '</td>';
      });
      h += '</tr>';
    });
    $('dcf-sens').innerHTML = h + '</tbody>';
  }

  // Penere tall når feltet forlates. Felt med inputmode="numeric" formateres av core.js.
  document.querySelectorAll('.calc-wrap input[inputmode="decimal"]').forEach(function(el){
    el.addEventListener('blur', function(){
      var n = M.parseNum(el.value);
      if(isFinite(n)) put(el, n, decs(n));
    });
  });
  document.querySelector('.calc-wrap').addEventListener('input', function(e){
    var id = e.target.id;
    if(id === 'sec-sok') return; // søkefeltet har sin egen lytter
    if(id === 'w-e') eAuto = false;
    if(e.target.classList.contains('dcf-fcf')) yearsAuto = false;
    if(id === 'dcf-base' || id === 'dcf-vekst5'){
      // Årene fylles ikke før knappen trykkes. Unntak: tall fra SEC, der årene står tomme
      // eller kommer fra veksten, og ingenting brukeren har skrevet kan bli overskrevet.
      if(USD && yearsAuto){
        if(isFinite(num($('dcf-base'))) && isFinite(pctv('dcf-vekst5'))) fillYears();
        else fcfIn.forEach(function(el){ el.value = ''; });
      } else if(id === 'dcf-vekst5') return;
    }
    calc();
  });
  $('dcf-enhet').addEventListener('change', calc);
  $('dcf-fyll').addEventListener('click', function(){ fillYears(); yearsAuto = true; calc(); });
  $('dcf-eks').addEventListener('click', function(){ nullSec(); fill(EKS); $('dcf-eksinfo').hidden = false; $('dcf-fra').hidden = true; calc(); });
  $('dcf-null').addEventListener('click', function(){
    nullSec();
    document.querySelectorAll('.calc-wrap input').forEach(function(el){ el.value = ''; });
    put($('w-tax'), 22); $('dcf-enhet').value = '1';
    $('dcf-eksinfo').hidden = true; $('dcf-fra').hidden = true;
    calc();
  });
  $('w-bruk').addEventListener('click', function(){
    var w = calcWacc();
    if(!isFinite(w)) return;
    put($('dcf-wacc'), Math.round(w * 1000) / 10, 1);
    calc();
    $('dcf-wacc').focus();
  });

  // Fra treårsprognosen: ?fra=prognose, og tallene ligger i lagringen i nettleseren (hv-prognose-til-dcf).
  // Eldre lenker hadde tallene i adressen (?fcf=1,2,3&gjeld=..&kontanter=..&enhet=..). De leses fortsatt,
  // men fjernes straks fra adressefeltet og historikken.
  function fromUrl(){
    var q = new URLSearchParams(location.search), d = null;
    if(q.get('fra') === 'prognose'){
      try { d = JSON.parse(localStorage.getItem('hv-prognose-til-dcf')); } catch(e){}
    } else if(q.get('fcf')){
      d = { fcf: q.get('fcf').split(','), gjeld: q.get('gjeld'), kontanter: q.get('kontanter'), enhet: q.get('enhet') };
    }
    ['fcf', 'gjeld', 'kontanter', 'enhet', 'fra'].forEach(function(k){ q.delete(k); });
    var rest = q.toString();
    try { history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash); } catch(e){}
    if(!d || !Array.isArray(d.fcf)) return false;
    var vals = d.fcf.map(Number).filter(isFinite).slice(0, 5);
    if(!vals.length) return false;
    fill(EKS);
    fcfIn.forEach(function(el, i){ if(i < vals.length) put(el, Math.round(vals[i])); else el.value = ''; });
    if(d.enhet){ var en = $('dcf-enhet'), e0 = en.value; en.value = String(d.enhet); if(en.selectedIndex < 0) en.value = e0; }
    if(d.gjeld != null && isFinite(+d.gjeld)){ put($('dcf-gjeld'), +d.gjeld); put($('w-d'), +d.gjeld); }
    if(d.kontanter != null && isFinite(+d.kontanter)) put($('dcf-kont'), +d.kontanter);
    $('dcf-base').value = ''; $('dcf-vekst5').value = '';
    $('dcf-eksinfo').hidden = true;
    var m = $('dcf-fra');
    m.hidden = false;
    m.innerHTML = '<strong>Fri kontantstrøm for ' + vals.length + ' år kom fra treårsprognosen</strong>, sammen med gjeld og kontanter ved start. Sjekk avkastningskrav, vekst for alltid, antall aksjer og børskurs. De står som i Medistim-eksempelet til du endrer dem.';
    return true;
  }

  // ── Hent tall for et amerikansk selskap ─────────────────────────────────────────────
  // Tallene ligger i /data/sec/ og oppdateres hver natt av scripts/hent-sec.mjs (kilde: SEC EDGAR).
  // Bare fakta fra årsrapporten fylles inn. Vekst, avkastningskrav, vekst for alltid, beta,
  // markedspremie og børskurs står tomme: det er brukerens antakelser, ikke våre.
  var SKATT_USA = 0.21, MILL = 1e6;
  var sok = $('sec-sok'), liste = $('sec-liste');
  var sec = { indeks:null, laster:null, rader:[], aktiv:-1 };
  // Hjelpetekster som er skrevet for norske selskaper, og hva de skal si når tallene er amerikanske.
  var HINT_USD = {
    'w-mp-h': 'Ekstra avkastning aksjer gir over risikofri rente. Anslagene for USA ligger oftest mellom 4 og 6 %.',
    'w-tax-h': '21 % er den føderale selskapsskatten i USA. Delstatene kommer i tillegg.',
    'w-e-h': 'Børskurs ganger antall aksjer. Regnes ut når du skriver inn børskursen.',
    'dcf-gjeld-h': 'Lån og obligasjoner. Vanlig leie er ikke med.',
    'dcf-kont-h': 'Kontanter pluss kortsiktige plasseringer.',
    'dcf-kurs-h': 'Dollar per aksje. Skriv inn kursen selv.'
  };
  var ENHET_USD = { '1':'dollar', '1000':'tusen dollar', '1000000':'millioner dollar' };

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function dato(iso){ var p = String(iso).split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : String(iso); }
  function mill(n){ return n == null ? '–' : M.fmt(n / MILL, 0); }
  // Bytt tekst på et element, og husk den norske teksten så den kan settes tilbake.
  function tekst(el, ny){
    if(el.getAttribute('data-no') == null) el.setAttribute('data-no', el.textContent);
    el.textContent = ny == null ? el.getAttribute('data-no') : ny;
  }
  function setValuta(usd){
    USD = usd;
    [].forEach.call($('dcf-enhet').options, function(op){ tekst(op, usd ? ENHET_USD[op.value] : null); });
    tekst($('dcf-kurs-u'), usd ? 'USD' : null);
    Object.keys(HINT_USD).forEach(function(id){ tekst($(id), usd ? HINT_USD[id] : null); });
    if(!usd) ['w-rf-h', 'w-rd-h', 'dcf-vekst5-h'].forEach(function(id){ tekst($(id), null); });
  }
  // Tilbake til kroner: brukes av «Fyll inn eksempel» og «Nullstill».
  function nullSec(){
    setValuta(false); yearsAuto = false; eAuto = false;
    $('sec-info').hidden = true; $('sec-ut').hidden = true; sok.value = ''; skjulListe();
  }

  function hentIndeks(){
    if(sec.laster) return sec.laster;
    sec.laster = fetch('/data/sec/indeks.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(j){
        sec.indeks = j;
        var antall = {}; j.selskaper.forEach(function(r){ antall[r[2]] = 1; });
        $('sec-hint').textContent = 'For eksempel AAPL eller Microsoft. ' + Object.keys(antall).length + ' selskaper er med, sist oppdatert ' + dato(j.oppdatert) + '.';
        return j;
      })
      .catch(function(){ sec.laster = null; $('sec-hint').textContent = 'Fikk ikke hentet listen over selskaper. Prøv igjen om litt.'; return null; });
    return sec.laster;
  }
  // Ticker som starter med det som er skrevet kommer først, så navn der et ord starter med det.
  // Lista er sortert med de største selskapene først, og den rekkefølgen beholdes.
  function treff(q){
    q = q.trim().toUpperCase();
    if(!q || !sec.indeks) return [];
    var lik = [], ticker = [], navn = [];
    sec.indeks.selskaper.forEach(function(r){
      if(r[0] === q) lik.push(r);
      else if(r[0].indexOf(q) === 0) ticker.push(r);
      else if((' ' + r[1].toUpperCase()).indexOf(' ' + q) > -1) navn.push(r);
    });
    return lik.concat(ticker, navn).slice(0, 8);
  }
  function merkAktiv(i){
    sec.aktiv = i;
    [].forEach.call(liste.children, function(li, n){ li.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
    if(i >= 0) sok.setAttribute('aria-activedescendant', 'sec-o' + i); else sok.removeAttribute('aria-activedescendant');
  }
  function visListe(rader){
    sec.rader = rader;
    liste.innerHTML = rader.length ? rader.map(function(r, i){
      return '<li role="option" id="sec-o' + i + '"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span>' + (r[3] ? '<small>bank, forsikring, eiendom</small>' : '') + '</li>';
    }).join('') : '<li class="tom" role="presentation">Ingen treff blant selskapene som er med.</li>';
    liste.hidden = false; sok.setAttribute('aria-expanded', 'true');
    merkAktiv(rader.length ? 0 : -1);
  }
  function skjulListe(){ liste.hidden = true; sok.setAttribute('aria-expanded', 'false'); sok.removeAttribute('aria-activedescendant'); sec.rader = []; sec.aktiv = -1; }

  function velg(r){
    skjulListe();
    sok.value = r[0] + ' · ' + r[1];
    var info = $('sec-info');
    info.hidden = false; info.textContent = 'Henter tall for ' + r[1] + ' …';
    fetch('/data/sec/' + r[2] + '.json').then(function(res){ if(!res.ok) throw new Error(res.status); return res.json(); })
      .then(brukSec)
      .catch(function(){ info.textContent = 'Fikk ikke hentet tallene for ' + r[1] + '. Prøv igjen om litt.'; });
  }

  // Fri kontantstrøm til hele selskapet, regnet fra kontantstrømoppstillingen:
  // kontantstrøm fra drift + renter etter skatt − investeringer − aksjebasert lønn.
  function fcfAv(a){
    if(a.cfo == null || a.capex == null) return NaN;
    return a.cfo + (a.renter || 0) * (1 - SKATT_USA) - a.capex - (a.sbc || 0);
  }
  var GJELD_NAVN = { samlet:'Lån i alt', langsiktig:'Langsiktige lån', kortsiktig:'Kortsiktige lån og avdrag', kortsiktigDel:'Avdrag som forfaller innen ett år',
    kortsiktigeLaan:'Kortsiktige lån', langsiktigMedKortDel:'Langsiktige lån' };

  function brukSec(d){
    var info = $('sec-info'), navn = esc(d.navn) + ' (' + esc(d.ticker) + ')';
    if(d.unntatt){
      $('sec-ut').hidden = true;
      info.innerHTML = '<strong>' + navn + ' er en bank, et forsikringsselskap eller et eiendomsselskap.</strong> For dem er gjeld en del av driften, og fri kontantstrøm gir ikke mening. De verdsettes med andre metoder, så tall hentes ikke. Feltene under er ikke endret.';
      return;
    }
    var s = d.aar[d.aar.length - 1], b = d.balanse, fcf = fcfAv(s), rente = sec.indeks && sec.indeks.rente;

    // 1. Tøm alle feltene og bytt til millioner dollar.
    document.querySelectorAll('.calc-wrap input').forEach(function(el){ if(el !== sok) el.value = ''; });
    setValuta(true); $('dcf-enhet').value = '1000000';
    yearsAuto = true; eAuto = true;

    // 2. Fakta fra årsrapporten.
    if(isFinite(fcf)) put($('dcf-base'), Math.round(fcf / MILL));
    if(b.gjeld != null){ put($('dcf-gjeld'), Math.round(b.gjeld / MILL)); put($('w-d'), Math.round(b.gjeld / MILL)); }
    if(b.kont != null) put($('dcf-kont'), Math.round((b.kont + (b.plass || 0)) / MILL));
    if(d.aksjer) put($('dcf-aksjer'), d.aksjer.antall);
    put($('w-tax'), SKATT_USA * 100);
    if(rente){
      put($('w-rf'), rente.us10, 2);
      tekst($('w-rf-h'), 'Renten på tiårige amerikanske statsobligasjoner: ' + M.fmt(rente.us10, 2) + ' % per ' + dato(rente.dato) + '. Kilde: U.S. Treasury.');
    } else tekst($('w-rf-h'), 'Renten på tiårige amerikanske statsobligasjoner. U.S. Treasury publiserer den.');
    // Lånerenten: årets rentekostnad delt på gjelden. Bare når svaret er rimelig, og teksten sier hva tallet er.
    var rd = s.renter > 0 && b.gjeld > 0 ? s.renter / b.gjeld * 100 : NaN, rdOk = rd >= 0.5 && rd <= 15;
    if(rdOk) put($('w-rd'), Math.round(rd * 10) / 10, 1);
    tekst($('w-rd-h'), rdOk ? 'Rentekostnaden siste år delt på gjelden ved årsslutt. Et grovt anslag. Endre det hvis årsrapporten sier noe annet.'
      : 'Renten selskapet betaler på lån. Står i noten om gjeld i årsrapporten.');

    // 3. Historisk vekst som hjelp ved vekstfeltet. Fakta, ikke forslag.
    var f0 = d.aar[0], n = d.aar.length - 1;
    tekst($('dcf-vekst5-h'), n > 0 && f0.oms > 0 && s.oms > 0
      ? 'Omsetningen vokste ' + M.pct(Math.pow(s.oms / f0.oms, 1 / n) - 1, 1) + ' per år i snitt fra ' + f0.slutt.slice(0, 4) + ' til ' + s.slutt.slice(0, 4) + '. Det er historikk, ikke en prognose.'
      : 'Hvert år i prognosen.');

    // 4. Melding: hva som er fylt inn, og hva som mangler.
    var merk = [];
    if(!isFinite(fcf)) merk.push('Investeringene ble ikke funnet i dataene, så fri kontantstrøm er ikke regnet ut. De står i kontantstrømoppstillingen i årsrapporten.');
    else {
      if(fcf <= 0) merk.push('Fri kontantstrøm var negativ siste år. Da gir ikke «vekst per år» mening. Skriv inn kontantstrømmen du venter for hvert år selv.');
      if(s.renter == null) merk.push('Rentekostnaden står ikke som egen post, så den er ikke lagt tilbake. Fri kontantstrøm blir da litt for lav.');
      if(s.sbc == null) merk.push('Aksjebasert lønn står ikke som egen post og er ikke trukket fra.');
    }
    if(b.gjeld == null) merk.push('Fant ingen rentebærende gjeld. Enten har selskapet ingen, eller så bruker det en post vi ikke leser. Sjekk balansen i årsrapporten.');
    if(b.kont == null) merk.push('Kontantene ble ikke funnet. De står i balansen i årsrapporten.');
    if(!d.aksjer) merk.push('Antall aksjer ble ikke funnet, trolig fordi selskapet har flere aksjeklasser. Det står på forsiden av årsrapporten.');
    else if(d.aksjer.type === 'snitt') merk.push('Antall aksjer er snittet for året (utvannet), fordi selskapet har flere aksjeklasser.');
    info.innerHTML = '<strong>' + navn + ':</strong> tallene er hentet fra årsrapporten for regnskapsåret som sluttet ' + dato(s.slutt) + ', og fylt inn i millioner dollar. '
      + '<strong>Vekst, avkastningskrav og vekst for alltid er tomme. Dem setter du selv.</strong> Skriv også inn børskursen, så ser du hvilken vekst kursen forutsetter.'
      + (merk.length ? '<ul><li>' + merk.join('</li><li>') + '</li></ul>' : '');

    // 5. Tabellene: fem år fra kontantstrømoppstillingen, og balansen ved årsslutt.
    var aar = d.aar.slice(-5).reverse(); // nyeste år først, som i eksempeltabellene lenger ned
    var rad = function(navn, f, cls){ return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + navn + '</td>' + aar.map(function(a){ return '<td>' + f(a) + '</td>'; }).join('') + '</tr>'; };
    $('sec-aar').innerHTML = '<caption>Fra årsrapportene <small>Millioner dollar. Siste regnskapsår sluttet ' + dato(s.slutt) + '</small></caption>'
      + '<thead><tr><th scope="col">Post</th>' + aar.map(function(a){ return '<th scope="col">' + a.slutt.slice(0, 4) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + rad('Omsetning', function(a){ return mill(a.oms); })
      + rad('Kontantstrøm fra drift', function(a){ return mill(a.cfo); })
      + rad('Pluss renter etter 21 % skatt', function(a){ return a.renter == null ? '–' : mill(a.renter * (1 - SKATT_USA)); })
      + rad('Minus investeringer', function(a){ return a.capex == null ? '–' : mill(-a.capex); })
      + rad('Minus aksjebasert lønn', function(a){ return a.sbc == null ? '–' : mill(-a.sbc); })
      + rad('Fri kontantstrøm', function(a){ var x = fcfAv(a); return isFinite(x) ? mill(x) : '–'; }, 'sum')
      + '</tbody>';
    var bal = '';
    if(b.kont != null){
      bal += '<tr><td>Kontanter og bankinnskudd' + (b.kontBundet ? ', medregnet bundne midler' : '') + '</td><td>' + mill(b.kont) + '</td></tr>';
      if(b.plass) bal += '<tr><td>Kortsiktige plasseringer</td><td>' + mill(b.plass) + '</td></tr><tr class="sum"><td>Kontanter og plasseringer</td><td>' + mill(b.kont + b.plass) + '</td></tr>';
    }
    if(b.gjeld != null){
      var deler = Object.keys(b.gjeldDeler || {});
      if(deler.length > 1) deler.forEach(function(k){ bal += '<tr><td>' + (GJELD_NAVN[k] || k) + '</td><td>' + mill(b.gjeldDeler[k]) + '</td></tr>'; });
      bal += '<tr class="sum"><td>Rentebærende gjeld</td><td>' + mill(b.gjeld) + '</td></tr>';
    }
    if(d.aksjer) bal += '<tr><td>Antall aksjer' + (d.aksjer.type === 'snitt' ? ', snitt for året' : ' per ' + dato(d.aksjer.dato)) + ' (stykk)</td><td>' + M.fmt(d.aksjer.antall, 0) + '</td></tr>';
    $('sec-bal').innerHTML = '<caption>Fra balansen ' + dato(b.dato) + ' <small>Millioner dollar</small></caption><thead><tr><th scope="col">Post</th><th scope="col">Beløp</th></tr></thead><tbody>' + bal + '</tbody>';
    $('sec-kilde').innerHTML = 'Kilde: <a href="' + esc(d.rapport.lenke) + '" rel="noopener">årsrapporten (skjema ' + esc(d.rapport.skjema) + ') hos SEC</a>, levert ' + dato(d.rapport.levert) + '. <a href="#usa">Slik hentes tallene.</a>';

    $('sec-ut').hidden = false; $('dcf-eksinfo').hidden = true; $('dcf-fra').hidden = true;
    calc();
  }

  // Listen hentes først når feltet tas i bruk. Teksten merkes, så et nytt søk skriver over det forrige.
  sok.addEventListener('focus', function(){ hentIndeks(); sok.select(); });
  sok.addEventListener('input', function(){
    hentIndeks().then(function(){ if(sok.value.trim()) visListe(treff(sok.value)); else skjulListe(); });
  });
  sok.addEventListener('keydown', function(e){
    if(liste.hidden) return;
    var n = sec.rader.length;
    if(e.key === 'ArrowDown' && n){ e.preventDefault(); merkAktiv((sec.aktiv + 1) % n); }
    else if(e.key === 'ArrowUp' && n){ e.preventDefault(); merkAktiv((sec.aktiv - 1 + n) % n); }
    else if(e.key === 'Enter' && sec.aktiv >= 0){ e.preventDefault(); velg(sec.rader[sec.aktiv]); }
    else if(e.key === 'Escape') skjulListe();
  });
  sok.addEventListener('blur', skjulListe);
  // mousedown ville tatt fokus fra feltet og lukket lista før klikket rakk fram.
  liste.addEventListener('mousedown', function(e){ e.preventDefault(); });
  liste.addEventListener('click', function(e){
    var li = e.target.closest('li[role="option"]');
    if(li) velg(sec.rader[[].indexOf.call(liste.children, li)]);
  });

  if(!fromUrl()) fill(EKS);
  calc();
})();
