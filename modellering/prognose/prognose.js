/* /modellering/prognose/ — kobler skjemaet til regnemotoren i /modellering/modellering.js. */
(function(){
  'use strict';
  var M = window.HVModell;
  if(!M) return;
  var $ = function(id){ return document.getElementById(id); };

  // Forutsetningene, i rekkefølgen de står på siden. pct:true betyr at feltet er i prosent.
  var ROWS = [
    { k:'growth',       nm:'Inntektsvekst',                    sm:'Økning i omsetning fra året før', pct:true },
    { k:'ebitdaMargin', nm:'Driftsmargin før avskrivninger',  sm:'Andel av omsetningen (EBITDA-margin)', pct:true },
    { k:'depr',         nm:'Avskrivninger',                    sm:'Andel av omsetningen', pct:true },
    { k:'capex',        nm:'Investeringer',                    sm:'Andel av omsetningen', pct:true },
    { k:'nwcPct',       nm:'Arbeidskapital',                   sm:'Andel av omsetningen', pct:true },
    { k:'rate',         nm:'Rente på gjeld',                   sm:'Av gjelden ved starten av året', pct:true },
    { k:'tax',          nm:'Skattesats',                       sm:'22 % for aksjeselskap', pct:true },
    { k:'payout',       nm:'Utbytte',                          sm:'Andel av årsresultatet', pct:true },
    { k:'debtChange',   nm:'Nytt lån (+) eller avdrag (−)',    sm:'Beløp per år', pct:false }
  ];

  // Medistim ASA, konsernregnskap 2025, tusen kroner. Forutsetningene er antakelser (se tabellen på siden).
  var EKS = {
    enhet:'1000',
    start:{ oms:699767, am:165484, ak:182598, bank:212088, gjeld:49271, ek:468407 },
    a:{ growth:[10, 8, 6], ebitdaMargin:[31.5, 31.5, 31.5], depr:[3.5, 3.5, 3.5], capex:[4.7, 4.7, 4.7], nwcPct:[26, 26, 26],
        rate:[1.3, 1.3, 1.3], tax:[22, 22, 22], payout:[92, 92, 92], debtChange:[0, 0, 0] }
  };
  var START = ['oms', 'am', 'ak', 'bank', 'gjeld', 'ek'];

  // Bygg forutsetningsradene
  var fors = $('pg-fors'), inp = {};
  ROWS.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'md-yr';
    var h = '<span class="nm" id="pg-l-' + r.k + '">' + r.nm + (r.pct ? ' (%)' : '') + '<small>' + r.sm + '</small></span>';
    for(var i = 0; i < 3; i++){
      h += '<input class="ik-input" type="text" inputmode="decimal" autocomplete="off" data-k="' + r.k + '" data-i="' + i + '" aria-label="' + r.nm + ', år ' + (i + 1) + '">';
    }
    row.innerHTML = h;
    fors.appendChild(row);
    inp[r.k] = [].slice.call(row.querySelectorAll('input'));
  });

  function put(el, n, d){
    if(!isFinite(n)){ el.value = ''; return; }
    el.value = M.fmt(n, d || 0).replace(/ /g, ' ').replace('−', '-');
  }
  function decs(n){ var s = String(n); return s.indexOf('.') < 0 ? 0 : Math.min(2, s.split('.')[1].length); }
  function unitName(){ var u = $('pg-enhet').value; return u === '1000' ? 'tusen kr' : (u === '1000000' ? 'mill. kr' : 'kr'); }
  function f0(n){ return M.fmt(n, 0); }

  function fill(o){
    $('pg-enhet').value = o.enhet;
    START.forEach(function(k){ put($('pg-' + k), o.start[k]); });
    ROWS.forEach(function(r){ inp[r.k].forEach(function(el, i){ put(el, o.a[r.k][i], decs(o.a[r.k][i])); }); });
  }

  function read(){
    var s = {}, ok = true;
    START.forEach(function(k){ s[k] = M.parseNum($('pg-' + k).value); if(!isFinite(s[k])) ok = false; });
    var a = {};
    ROWS.forEach(function(r){
      a[r.k] = inp[r.k].map(function(el){
        var n = M.parseNum(el.value);
        if(!isFinite(n)) n = 0;          // tomt felt = 0
        return r.pct ? n / 100 : n;
      });
    });
    return { ok:ok, start:{ revenue:s.oms, fixed:s.am, nwc:s.ak, cash:s.bank, debt:s.gjeld, equity:s.ek }, a:a };
  }

  function row(cls, label, vals){
    return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + label + '</td>' +
      vals.map(function(v){ return '<td>' + f0(v) + '</td>'; }).join('') + '</tr>';
  }
  function head(cols){ return '<thead><tr><th scope="col">' + unitName().replace(/^./, function(c){ return c.toUpperCase(); }) + '</th>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead>'; }
  function pick(ys, k, sign){ return ys.map(function(y){ return (sign || 1) * y[k]; }); }

  function calc(){
    var d = read();
    var tabs = ['pg-t-res', 'pg-t-bal', 'pg-t-ks', 'pg-t-fcf'];
    if(!d.ok){
      tabs.forEach(function(id){ $(id).innerHTML = '<tbody><tr class="chk"><td>Fyll inn alle seks tallene i startpunktet, eller trykk «Fyll inn eksempel».</td></tr></tbody>'; });
      ['pgs-oms', 'pgs-res', 'pgs-bank', 'pgs-bal'].forEach(function(id){ $(id).textContent = '–'; });
      ['pgs-oms-s', 'pgs-res-s', 'pgs-bank-s', 'pgs-bal-s'].forEach(function(id){ $(id).textContent = ''; });
      $('pg-andre').textContent = ''; $('pg-varsel').hidden = true;
      $('pg-send').setAttribute('aria-disabled', 'true'); $('pg-send').href = '/modellering/dcf/';
      return;
    }
    var p = M.forecast(d.start, d.a, 3), Y = p.years, s = d.start;
    var cols = ['År 1', 'År 2', 'År 3'];

    $('pg-andre').innerHTML = 'Andre poster, netto: <b>' + f0(p.other) + '</b> ' + unitName() + '. Det er egenkapital + gjeld − anleggsmidler − arbeidskapital − bank. Holdes fast i alle tre årene.';

    $('pg-t-res').innerHTML = head(cols) + '<tbody>' +
      row('', 'Driftsinntekter', pick(Y, 'revenue')) +
      row('sub', 'Vekst', []).replace('</tr>', Y.map(function(y, i){ return '<td>' + M.pct(d.a.growth[i], 1) + '</td>'; }).join('') + '</tr>') +
      row('', 'Driftskostnader før avskrivninger', Y.map(function(y){ return -(y.revenue - y.ebitda); })) +
      row('sum', 'Driftsresultat før avskrivninger', pick(Y, 'ebitda')) +
      row('', 'Avskrivninger', pick(Y, 'depr', -1)) +
      row('sum', 'Driftsresultat', pick(Y, 'ebit')) +
      row('', 'Rentekostnad', pick(Y, 'interest', -1)) +
      row('sum', 'Resultat før skatt', pick(Y, 'ebt')) +
      row('', 'Skattekostnad', pick(Y, 'tax', -1)) +
      row('sum', 'Årsresultat', pick(Y, 'net')) +
      row('sub', 'Herav utbytte', pick(Y, 'dividend')) +
      '</tbody>';

    var allCols = ['Start'].concat(cols);
    function withStart(v0, k){ return [v0].concat(pick(Y, k)); }
    $('pg-t-bal').innerHTML = head(allCols) + '<tbody>' +
      row('', 'Anleggsmidler', withStart(s.fixed, 'fixed')) +
      row('', 'Arbeidskapital', withStart(s.nwc, 'nwc')) +
      row('', 'Andre poster, netto', [p.other, p.other, p.other, p.other]) +
      row('', 'Bankinnskudd', withStart(s.cash, 'cash')) +
      row('sum', 'Sum eiendeler (netto)', [s.fixed + s.nwc + p.other + s.cash].concat(pick(Y, 'assets'))) +
      row('', 'Egenkapital', withStart(s.equity, 'equity')) +
      row('', 'Rentebærende gjeld', withStart(s.debt, 'debt')) +
      row('sum', 'Sum egenkapital og gjeld', [s.equity + s.debt].concat(pick(Y, 'claims'))) +
      '<tr class="chk"><td>Kontroll (skal være 0)</td>' +
        [0].concat(pick(Y, 'diff')).map(function(v){ return '<td>' + (Math.abs(v) < 0.5 ? '0' : f0(v)) + '</td>'; }).join('') + '</tr>' +
      '</tbody>';

    $('pg-t-ks').innerHTML = head(cols) + '<tbody>' +
      row('', 'Årsresultat', pick(Y, 'net')) +
      row('', 'Pluss avskrivninger', pick(Y, 'depr')) +
      row('', 'Minus økning i arbeidskapital', pick(Y, 'dNwc', -1)) +
      row('sum', 'Kontantstrøm fra drift', pick(Y, 'cfo')) +
      row('sum', 'Investeringer', pick(Y, 'cfi')) +
      row('', 'Nytt lån eller avdrag', pick(Y, 'debtChange')) +
      row('', 'Utbytte', pick(Y, 'dividend', -1)) +
      row('sum', 'Kontantstrøm fra finansiering', pick(Y, 'cff')) +
      row('sum', 'Endring i bank', pick(Y, 'dCash')) +
      row('', 'Bank ved starten av året', [s.cash].concat(pick(Y, 'cash').slice(0, 2))) +
      row('sum', 'Bank ved slutten av året', Y.map(function(y, i){ return (i ? Y[i - 1].cash : s.cash) + y.dCash; })) +
      row('', 'Bank i balansen', pick(Y, 'cash')) +
      '<tr class="chk"><td>Kontroll (skal være 0)</td>' +
        Y.map(function(y, i){ var v = (i ? Y[i - 1].cash : s.cash) + y.dCash - y.cash; return '<td>' + (Math.abs(v) < 0.5 ? '0' : f0(v)) + '</td>'; }).join('') + '</tr>' +
      '</tbody>';

    $('pg-t-fcf').innerHTML = head(cols) + '<tbody>' +
      row('', 'Driftsresultat', pick(Y, 'ebit')) +
      row('', 'Minus skatt på driftsresultatet', Y.map(function(y){ return -(y.ebit - y.nopat); })) +
      row('', 'Pluss avskrivninger', pick(Y, 'depr')) +
      row('', 'Minus investeringer', pick(Y, 'capex', -1)) +
      row('', 'Minus økning i arbeidskapital', pick(Y, 'dNwc', -1)) +
      row('sum', 'Fri kontantstrøm', pick(Y, 'fcff')) +
      '</tbody>';

    // Stripa
    var y3 = Y[2];
    $('pgs-oms').textContent = f0(y3.revenue); $('pgs-oms-s').textContent = unitName() + ', ' + M.pct(y3.revenue / s.revenue - 1, 0) + ' over startåret';
    $('pgs-res').textContent = f0(y3.net); $('pgs-res-s').textContent = unitName() + ', margin ' + M.pct(y3.revenue ? y3.net / y3.revenue : NaN, 1);
    $('pgs-bank').textContent = f0(y3.cash); $('pgs-bank-s').textContent = unitName() + ', ' + (y3.cash >= s.cash ? 'opp ' : 'ned ') + f0(Math.abs(y3.cash - s.cash));
    var maxDiff = Math.max.apply(null, Y.map(function(y){ return Math.abs(y.diff); }));
    $('pgs-bal').textContent = maxDiff < 0.5 ? 'Går opp' : 'Går ikke opp';
    $('pgs-bal-s').textContent = maxDiff < 0.5 ? 'Eiendeler = egenkapital + gjeld i alle tre år' : 'Avvik ' + f0(maxDiff);

    // Varsel om negativ bank eller egenkapital
    function yrs(test){ var l = []; Y.forEach(function(y, i){ if(test(y)) l.push(i + 1); }); return l.length ? 'år ' + l.join(l.length === 2 ? ' og ' : ', ').replace(/, (\d)$/, ' og $1') : ''; }
    var neg = [], t;
    if((t = yrs(function(y){ return y.cash < 0; }))) neg.push('banken går i minus i ' + t);
    if((t = yrs(function(y){ return y.equity < 0; }))) neg.push('egenkapitalen blir negativ i ' + t);
    if((t = yrs(function(y){ return y.debt < 0; }))) neg.push('avdragene er større enn gjelden i ' + t);
    var v = $('pg-varsel');
    v.hidden = !neg.length;
    if(neg.length) v.innerHTML = '<strong>Se her:</strong> ' + neg.join(', og ') + '. Selskapet trenger da mer lån, lavere utbytte eller færre investeringer.';

    // Lenken til DCF
    var q = 'fcf=' + Y.map(function(y){ return Math.round(y.fcff); }).join(',') + '&gjeld=' + Math.round(s.debt) + '&kontanter=' + Math.round(s.cash) + '&enhet=' + $('pg-enhet').value;
    $('pg-send').href = '/modellering/dcf/?' + q;
    $('pg-send').removeAttribute('aria-disabled');
  }

  // «Følger med»: år 2 og 3 tar etter år 1 hvis de var like år 1 fra før
  var before = {};
  fors.addEventListener('focusin', function(e){
    var el = e.target;
    if(el.matches && el.matches('input[data-i="0"]')) before[el.getAttribute('data-k')] = el.value;
  });
  fors.addEventListener('input', function(e){
    var el = e.target;
    if(!(el.matches && el.matches('input[data-i="0"]'))) return;
    var k = el.getAttribute('data-k'), list = inp[k], old = before[k];
    for(var i = 1; i < 3; i++){ if(list[i].value === old) list[i].value = el.value; }
    before[k] = el.value;
  });

  document.querySelectorAll('.calc-wrap input[inputmode="decimal"]').forEach(function(el){
    el.addEventListener('blur', function(){
      var n = M.parseNum(el.value);
      if(isFinite(n)) put(el, n, decs(n));
    });
  });
  document.querySelector('.calc-wrap').addEventListener('input', calc);
  $('pg-enhet').addEventListener('change', calc);
  $('pg-eks').addEventListener('click', function(){ fill(EKS); $('pg-eksinfo').hidden = false; calc(); });
  $('pg-null').addEventListener('click', function(){
    document.querySelectorAll('.calc-wrap input').forEach(function(el){ el.value = ''; });
    inp.tax.forEach(function(el){ el.value = '22'; });
    $('pg-enhet').value = '1';
    $('pg-eksinfo').hidden = true;
    calc();
  });

  fill(EKS);
  calc();
})();
