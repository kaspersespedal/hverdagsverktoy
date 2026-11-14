/* /modellering/dcf/ — kobler skjemaet til regnemotoren i /modellering/modellering.js. */
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
    enhet:'1000', base:144318, vekst5:8, wacc:8.9, g:2.5, gjeld:49271, kont:212088, aksjer:18282848,
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
  function unitName(){ var u = $('dcf-enhet').value; return u === '1000' ? 'tusen kr' : (u === '1000000' ? 'mill. kr' : 'kr'); }
  function money(n){ return M.fmt(n, 0) + ' ' + unitName(); }

  function fill(o){
    $('dcf-enhet').value = o.enhet;
    put($('dcf-base'), o.base); put($('dcf-vekst5'), o.vekst5, decs(o.vekst5));
    put($('dcf-wacc'), o.wacc, decs(o.wacc)); put($('dcf-g'), o.g, decs(o.g));
    put($('dcf-gjeld'), o.gjeld); put($('dcf-kont'), o.kont); put($('dcf-aksjer'), o.aksjer);
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
    calcWacc();

    pvOut.forEach(function(el, i){ el.textContent = res.ok && res.rows[i] ? M.fmt(res.rows[i].pv, 0) : '–'; });
    var feil = $('dcf-feil');
    if(!res.ok){
      feil.hidden = false; feil.textContent = res.err;
      ['s-ps', 's-eq', 's-ev', 's-tv', 'r-pvsum', 'r-tv', 'r-pvtv', 'r-ev', 'r-gjeld', 'r-kont', 'r-eq', 'r-aksjer', 'r-ps'].forEach(function(id){ $(id).textContent = '–'; });
      $('s-ps-s').textContent = ''; $('s-eq-s').textContent = '';
      $('dcf-sens').innerHTML = '';
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
    var hasShares = shares > 0;
    $('r-aksjer').textContent = hasShares ? M.fmt(shares, 0) : 'Ikke fylt inn';
    $('r-ps').textContent = hasShares ? M.fmt(res.perShare, 2) + ' kr' : '–';

    $('s-ps').textContent = hasShares ? M.fmt(res.perShare, 2) + ' kr' : '–';
    $('s-ps-s').textContent = hasShares ? '' : 'Fyll inn antall aksjer';
    $('s-eq').textContent = M.fmt(res.equity, 0);
    $('s-eq-s').textContent = unitName();
    $('s-ev').textContent = M.fmt(res.ev, 0);
    $('s-tv').textContent = M.pct(res.tvShare, 0);

    sens(o, hasShares);
  }

  function sens(o, hasShares){
    var dr = [-0.02, -0.01, 0, 0.01, 0.02], dg = [-0.01, -0.005, 0, 0.005, 0.01];
    var grid = M.sensitivity(o, dr, dg);
    $('sens-lead').textContent = hasShares
      ? 'Verdien per aksje i kroner med litt høyere og lavere avkastningskrav og vekst. Feltet i midten er svaret over. Ser du store sprang, er verdien følsom for antakelsene.'
      : 'Egenkapitalverdien (' + unitName() + ') med litt høyere og lavere avkastningskrav og vekst. Feltet i midten er svaret over. Fyll inn antall aksjer for å se verdi per aksje.';
    var h = '<caption class="sr-only" style="position:absolute;left:-9999px">' + (hasShares ? 'Verdi per aksje' : 'Egenkapitalverdi') + ' for ulike WACC (rader) og vekst for alltid (kolonner)</caption>';
    h += '<thead><tr><th scope="col" class="corner">WACC ↓ · vekst →</th>';
    dg.forEach(function(d){ h += '<th scope="col">' + M.pct(o.g + d, 1) + '</th>'; });
    h += '</tr></thead><tbody>';
    grid.forEach(function(row, i){
      h += '<tr><th scope="row">' + M.pct(o.r + dr[i], 1) + '</th>';
      row.forEach(function(v, j){
        var base = dr[i] === 0 && dg[j] === 0;
        h += '<td' + (base ? ' class="base"' : '') + '>' + (isFinite(v) ? M.fmt(v, hasShares ? 0 : 0) : '–') + '</td>';
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
    if(e.target.id === 'dcf-base' || e.target.id === 'dcf-vekst5') return; // fyller ikke årene før knappen trykkes
    calc();
  });
  $('dcf-enhet').addEventListener('change', calc);
  $('dcf-fyll').addEventListener('click', function(){ fillYears(); calc(); });
  $('dcf-eks').addEventListener('click', function(){ fill(EKS); $('dcf-eksinfo').hidden = false; $('dcf-fra').hidden = true; calc(); });
  $('dcf-null').addEventListener('click', function(){
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

  // Fra treårsprognosen: ?fcf=1,2,3&gjeld=..&kontanter=..&enhet=..
  function fromUrl(){
    var q = new URLSearchParams(location.search), f = q.get('fcf');
    if(!f) return false;
    var vals = f.split(',').map(Number).filter(isFinite).slice(0, 5);
    if(!vals.length) return false;
    fill(EKS);
    fcfIn.forEach(function(el, i){ if(i < vals.length) put(el, Math.round(vals[i])); else el.value = ''; });
    if(q.get('enhet')) $('dcf-enhet').value = q.get('enhet');
    if(isFinite(+q.get('gjeld')) && q.get('gjeld') !== null){ put($('dcf-gjeld'), +q.get('gjeld')); put($('w-d'), +q.get('gjeld')); }
    if(isFinite(+q.get('kontanter')) && q.get('kontanter') !== null) put($('dcf-kont'), +q.get('kontanter'));
    $('dcf-base').value = ''; $('dcf-vekst5').value = '';
    $('dcf-eksinfo').hidden = true;
    var m = $('dcf-fra');
    m.hidden = false;
    m.innerHTML = '<strong>Fri kontantstrøm for ' + vals.length + ' år kom fra treårsprognosen</strong>, sammen med gjeld og kontanter ved start. Sjekk avkastningskrav, vekst for alltid og antall aksjer. De står som i Medistim-eksempelet til du endrer dem.';
    return true;
  }

  if(!fromUrl()) fill(EKS);
  calc();
})();
