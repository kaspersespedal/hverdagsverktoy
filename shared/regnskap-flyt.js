// «Lag regnskapet» — felles for resultat, balanse og kontantstrøm.
// 1) Viser hvor langt de tre delene er kommet, i fanene (.rf-v).
// 2) HVRegnskap: eksempelselskapet med enkle tall, og kontantstrømmen utledet av resultat og balanse.
// Leser bare det resultat-, balanse- og kontantstrømsiden selv lagrer i nettleseren:
//   hv-rr-v2            feltene på /regnskap/resultat/        hv-rr-arsresultat   {belop, forSkatt, avskr}
//   hv-balanse-v1       feltene på /regnskap/balanse/         hv-balanse-sum      {eiend, diff, bank, tom}
//   hv-kontantstrom-v2  feltene på /regnskap/kontantstrom/    hv-kontantstrom-sum {ub, any}
(function(){
  function read(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
  function kr(n){ return Math.round(n).toLocaleString('nb-NO') + ' kr'; }
  function set(name, txt){
    document.querySelectorAll('[data-rf="' + name + '"]').forEach(function(e){ if(e.textContent !== txt) e.textContent = txt; });
  }
  function paint(){
    var r = read('hv-rr-arsresultat'), b = read('hv-balanse-sum'), k = read('hv-kontantstrom-sum');
    set('res', (r && typeof r.belop === 'number') ? 'Årsresultat ' + kr(r.belop) : '');
    set('bal', (b && !b.tom && typeof b.diff === 'number') ? (Math.abs(b.diff) < 1 ? 'Balansen stemmer' : 'Avvik ' + kr(Math.abs(b.diff))) : '');
    set('ks',  (k && k.any && typeof k.ub === 'number') ? 'Kontanter ' + kr(k.ub) : '');
  }
  function later(){ setTimeout(paint, 0); }   // etter at siden selv har regnet og lagret
  document.addEventListener('input', later);
  document.addEventListener('click', later);
  window.addEventListener('storage', paint);
  window.addEventListener('pageshow', paint);
  paint();

  // ── HVRegnskap ──────────────────────────────────────────────────────────
  var RES = ['rSalg','rAnnen','rVare','rLonn','rAvskr','rAnnenKost','rFinInnt','rFinKost'];
  var BAL = ['bAnlForsk','bAnlEiend','bAnlMask','bAnlInv','bOmlVare','bOmlKund','bOmlBank',
             'bEkAks','bEkOver','bEkOpp','bGLBank','bGLAnnen','bGKLev','bGKSkat','bGKAnnen'];
  var KS  = ['opRes','opSkatt','opGevinst','opAvskr','opNedskr','opVarelager','opKunde','opLevgjeld','opAnnet',
             'invSalg','invKjop','invAksjer','finGjeld','finKasse','finEk','finUtbytte','kontIB','kontBalUB'];
  var SATS = 0.22;   // selskapsskatt, samme sats som resultatsiden

  function tall(v){
    var s = String(v == null ? '' : v).replace(/[−‒-―]/g, '-').replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
    var neg = s.charAt(0) === '-';
    var n = parseFloat(s.replace(/-/g, ''));
    return isFinite(n) ? (neg ? -n : n) : 0;
  }
  // Slik sidene selv skriver tall i feltene: mellomrom mellom tusener, ekte minustegn
  function felt(n){
    if(!n) return '';
    return (n < 0 ? '−' : '') + Math.round(Math.abs(n)).toLocaleString('nb-NO').replace(/[  ]/g, ' ');
  }

  // Eksempel AS: en liten butikk med runde tall. De tre delene henger sammen:
  //   Resultat   salg 1 000 000 − kostnader 880 000 = drift 120 000, renter 20 000, før skatt 100 000, skatt 22 000, årsresultat 78 000
  //   Balanse    500 000 i fjor → 580 000 i år. Opptjent egenkapital 100 000 + 78 000 = 178 000. Skyldig skatt 22 000.
  //   Kontanter  drift 120 000 − ny maskin 50 000 − avdrag 40 000 = +30 000, banken 100 000 → 130 000
  var EKS = {
    res: {mode:'as', rSalg:1000000, rVare:400000, rLonn:300000, rAvskr:50000, rAnnenKost:130000, rFinKost:20000},
    bal: {bAnlMask:200000, bOmlVare:120000, bOmlKund:130000, bOmlBank:130000,
          bEkAks:100000, bEkOpp:178000, bGLBank:160000, bGKLev:120000, bGKSkat:22000,
          bAnlMask_f:200000, bOmlVare_f:100000, bOmlKund_f:100000, bOmlBank_f:100000,
          bEkAks_f:100000, bEkOpp_f:100000, bGLBank_f:200000, bGKLev_f:100000}
  };

  function regnRes(r){
    var g = function(k){ return +r[k] || 0; };
    var sumDrift = g('rSalg') + g('rAnnen');
    var sumKost = g('rVare') + g('rLonn') + g('rAvskr') + g('rAnnenKost');
    var drift = sumDrift - sumKost, finans = g('rFinInnt') - g('rFinKost'), forSkatt = drift + finans;
    var skatt = r.mode === 'enk' ? 0 : (typeof r.skatt === 'number' ? r.skatt : Math.max(0, forSkatt) * SATS);
    return {sumDrift:sumDrift, sumKost:sumKost, drift:drift, finans:finans, forSkatt:forSkatt,
            skatt:skatt, ar:forSkatt - skatt, avskr:g('rAvskr'), tom:sumDrift === 0 && sumKost === 0 && finans === 0};
  }
  function regnBal(b, f){
    var g = function(k){ return +b[k + (f || '')] || 0; };
    var anl = g('bAnlForsk') + g('bAnlEiend') + g('bAnlMask') + g('bAnlInv'), oml = g('bOmlVare') + g('bOmlKund') + g('bOmlBank');
    var ek = g('bEkAks') + g('bEkOver') + g('bEkOpp'), gl = g('bGLBank') + g('bGLAnnen'), gk = g('bGKLev') + g('bGKSkat') + g('bGKAnnen');
    return {anl:anl, oml:oml, eiend:anl + oml, ek:ek, gl:gl, gk:gk, ekGjeld:ek + gl + gk,
            diff:anl + oml - ek - gl - gk, bank:g('bOmlBank'), tom:anl + oml === 0 && ek + gl + gk === 0};
  }

  // Kontantstrømmen etter den indirekte modellen, slik den settes opp i praksis: resultatet før skatt,
  // pluss avskrivninger, og så endringen i hver balansepost fra i fjor til i år.
  // Fortegn: + styrker kassen, − svekker den. Stemmer begge balansene, blir summen lik endringen i bank.
  function utled(res, b){
    var R = regnRes(res);
    var d = function(k){ return (+b[k] || 0) - (+b[k + '_f'] || 0); };
    var betalt = R.skatt - d('bGKSkat'), rest = 0;      // skatten som faktisk er betalt i år
    if(betalt < 0){ rest = -betalt; betalt = 0; }       // gjelden økte mer enn årets skatt: resten er avgifter
    var inv = d('bAnlForsk') + d('bAnlEiend') + d('bAnlMask') + R.avskr;   // kjøp til kostpris = endring + avskrivning
    var o = {
      opRes: R.forSkatt, opSkatt: -betalt, opAvskr: R.avskr,
      opVarelager: -d('bOmlVare'), opKunde: -d('bOmlKund'), opLevgjeld: d('bGKLev'), opAnnet: d('bGKAnnen') + rest,
      invKjop: inv > 0 ? -inv : 0, invSalg: inv < 0 ? -inv : 0, invAksjer: -d('bAnlInv'),
      finGjeld: d('bGLBank') + d('bGLAnnen'), finEk: d('bEkAks') + d('bEkOver'), finUtbytte: -(R.ar - d('bEkOpp')),
      kontIB: +b.bOmlBank_f || 0, kontBalUB: +b.bOmlBank || 0
    };
    KS.forEach(function(k){ o[k] = Math.round(o[k] || 0); });
    return o;
  }
  function regnKs(k){
    var s = function(a){ return a.reduce(function(t, id){ return t + (+k[id] || 0); }, 0); };
    var op = s(KS.slice(0, 9)), inv = s(KS.slice(9, 12)), fin = s(KS.slice(12, 16));
    return {op:op, inv:inv, fin:fin, net:op + inv + fin, ib:+k.kontIB || 0, ub:(+k.kontIB || 0) + op + inv + fin,
            any:KS.some(function(id){ return (+k[id] || 0) !== 0; })};
  }

  // Det som er lagret på de tre sidene, som tall
  function lagret(){
    var r = read('hv-rr-v2') || {}, b = read('hv-balanse-v1') || {}, k = read('hv-kontantstrom-v2') || {}, a = read('hv-rr-arsresultat');
    var res = {mode: r.mode === 'enk' ? 'enk' : 'as'}, bal = {}, ks = {};
    RES.forEach(function(id){ res[id] = tall(r[id]); });
    BAL.forEach(function(id){ bal[id] = tall(b[id]); bal[id + '_f'] = tall(b[id + '_f']); });
    KS.forEach(function(id){ ks[id] = tall(k[id]); });
    // Resultatsiden kan ha en annen skattekostnad enn 22 % (det ekte eksempelet). Da gjelder den.
    if(res.mode === 'as' && a && typeof a.belop === 'number' && typeof a.forSkatt === 'number'
       && Math.round(regnRes(res).forSkatt) === a.forSkatt) res.skatt = a.forSkatt - a.belop;
    return {res:res, bal:bal, ks:ks};
  }

  // Eksempelet er trykket på én side: legg de to andre delene i lageret, så alle tre viser samme selskap.
  function fyllAndre(denne){
    var R = regnRes(EKS.res), B = regnBal(EKS.bal), ks = utled(EKS.res, EKS.bal), K = regnKs(ks), snap;
    try{
      if(denne !== 'res'){
        snap = {mode:'as'}; RES.forEach(function(id){ snap[id] = felt(EKS.res[id]); });
        localStorage.setItem('hv-rr-v2', JSON.stringify(snap));
        localStorage.setItem('hv-rr-arsresultat', JSON.stringify({belop:R.ar, ts:Date.now(), forSkatt:R.forSkatt, avskr:R.avskr}));
      }
      if(denne !== 'bal'){
        snap = {}; BAL.forEach(function(id){ snap[id] = felt(EKS.bal[id]); snap[id + '_f'] = felt(EKS.bal[id + '_f']); });
        localStorage.setItem('hv-balanse-v1', JSON.stringify(snap));
        localStorage.setItem('hv-balanse-arsresultat-hentet', JSON.stringify({belop:R.ar}));   // årsresultatet er alt med i opptjent egenkapital
        localStorage.setItem('hv-balanse-sum', JSON.stringify({eiend:B.eiend, diff:B.diff, bank:B.bank, tom:false}));
      }
      if(denne !== 'ks'){
        snap = {}; KS.forEach(function(id){ snap[id] = felt(ks[id]); });
        localStorage.setItem('hv-kontantstrom-v2', JSON.stringify(snap));
        localStorage.setItem('hv-kontantstrom-sum', JSON.stringify({ub:K.ub, any:true}));
      }
    }catch(e){}
    paint();
  }

  // «Last ned Excel»: motoren (shared/regnskap-excel.js) hentes først når noen trykker.
  var xl = null;
  function lastExcel(){
    if(!xl) xl = new Promise(function(ok, feil){
      if(window.HVRegnskapExcel) return ok();
      var s = document.createElement('script');
      s.src = '/shared/regnskap-excel.js?v=v1'; s.onload = function(){ ok(); }; s.onerror = function(){ xl = null; feil(new Error('excel')); };
      document.head.appendChild(s);
    });
    return xl;
  }
  document.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('[data-rf-excel]');
    if(!b) return;
    var note = document.querySelector('[data-rf-excel-note]');
    lastExcel().then(function(){
      var ok = window.HVRegnskapExcel.lastNed(lagret());
      if(note) note.textContent = ok ? '' : 'Fyll inn minst én av de tre delene først.';
    }, function(){ if(note) note.textContent = 'Fikk ikke hentet Excel-motoren. Prøv igjen.'; });
  });

  window.HVRegnskap = {RES:RES, BAL:BAL, KS:KS, EKS:EKS, SATS:SATS, tall:tall, felt:felt,
    regnRes:regnRes, regnBal:regnBal, regnKs:regnKs, utled:utled, lagret:lagret, fyllAndre:fyllAndre,
    eksKs:function(){ return utled(EKS.res, EKS.bal); }};
})();
