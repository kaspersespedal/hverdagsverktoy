// «Lag regnskapet» — felles for resultat, balanse og kontantstrøm.
// 1) Viser hvor langt de tre delene er kommet, i fanene (.rf-v).
// 2) HVRegnskap: eksempelselskapet med enkle tall, og kontantstrømmen utledet av resultat og balanse.
// Leser bare det resultat-, balanse- og kontantstrømsiden selv lagrer i nettleseren:
//   hv-rr-v2            feltene på /regnskap/resultat/        hv-rr-arsresultat   {belop, forSkatt, avskr}
//   hv-balanse-v1       feltene på /regnskap/balanse/         hv-balanse-sum      {eiend, diff, bank, tom}
//                       + ekstra: [{id, g, p, k, n, v, f}] = egne poster (se POSTER)
//   hv-kontantstrom-v2  feltene på /regnskap/kontantstrom/    hv-kontantstrom-sum {ub, any}
(function(){
  function read(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
  function kr(n){ return Math.round(n).toLocaleString('nb-NO') + ' kr'; }
  function set(name, txt){
    document.querySelectorAll('[data-rf="' + name + '"]').forEach(function(e){ if(e.textContent !== txt) e.textContent = txt; });
  }
  // Balansen har hentet årsresultatet, men resultatet er endret etterpå og balansen er ikke åpnet siden.
  // Da hører balansen (og summen den lagret) til det gamle resultatet.
  function balUtdatert(){
    var r = read('hv-rr-arsresultat'), h = read('hv-balanse-arsresultat-hentet'), b = read('hv-balanse-sum');
    return !!(b && !b.tom && h && typeof h.belop === 'number' && r && typeof r.belop === 'number' && Math.round(r.belop) !== Math.round(h.belop));
  }
  var UTDATERT = 'Balansen er ikke oppdatert med det nye resultatet. Åpne balansen først.';
  function paint(){
    var r = read('hv-rr-arsresultat'), b = read('hv-balanse-sum'), k = read('hv-kontantstrom-sum');
    set('res', (r && typeof r.belop === 'number') ? 'Årsresultat ' + kr(r.belop) : '');
    set('bal', (b && !b.tom && typeof b.diff === 'number') ? (balUtdatert() ? 'Må oppdateres' : Math.abs(b.diff) < 1 ? 'Balansen stemmer' : 'Avvik ' + kr(Math.abs(b.diff))) : '');
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

  // Egne poster i balansen («+ Legg til post»). Loven har en fast oppstillingsplan, men sier at poster skal
  // legges til når forholdene tilsier det (regnskapsloven § 6-3 første ledd). Kontonumrene følger Skatteetatens
  // standard kontoplan (SAF-T). Rollen sier hvor endringen i posten hører hjemme i kontantstrømmen:
  //   anl      kjøp og salg av varige driftsmidler      aksjer   kjøp og salg av aksjer og andeler
  //   drift    andre tidsavgrensningsposter               skatt    utsatt skatt: ikke betalt, trekkes ut av betalt skatt
  //   ek       inn- eller utbetalt egenkapital            gjeld    endring i langsiktig gjeld
  //   kasse    endring i kassekreditt                     utbytte  skyldig utbytte: styrets forslag står som kortsiktig
  //            gjeld til det betales neste år (NRS 8 kap. 5.3.1 og 6.2.1.7.1), så endringen skal ikke inn i driften
  var POSTER = {
    anl: [{p:'1020', n:'Konsesjoner, patenter og lisenser', r:'anl'}, {p:'1070', n:'Utsatt skattefordel', r:'skatt'},
          {p:'1230', n:'Biler og andre transportmidler', r:'anl'}, {p:'1250', n:'Inventar og kontormaskiner', r:'anl'}],
    oml: [{p:'1700', n:'Forskuddsbetalte kostnader', r:'drift'}, {p:'1810', n:'Markedsbaserte aksjer og fond', r:'aksjer'}],
    ek:  [{p:'2010', n:'Egne aksjer', sub:'føres med minus', r:'ek'}, {p:'2030', n:'Annen innskutt egenkapital', r:'ek'}],
    gl:  [{p:'2120', n:'Utsatt skatt', r:'skatt'}, {p:'2255', n:'Lån fra eier', r:'gjeld'}],
    gk:  [{p:'2380', n:'Kassekreditt', r:'kasse'}, {p:'2700', n:'Skyldige offentlige avgifter', r:'drift'},
          {p:'2800', n:'Skyldig utbytte', r:'utbytte'}, {p:'2940', n:'Skyldige feriepenger', r:'drift'}]
  };
  // «Egen post» får gruppas vanlige rolle. Egenkapitalen har ingen: lovens poster der er faste (§ 6-2 C).
  var EGEN = {anl:'anl', oml:'drift', gl:'gjeld', gk:'drift'};
  function eiendel(g){ return g === 'anl' || g === 'oml'; }
  // De lagrede egne postene som tall, med konto, navn og rolle. Ukjente poster hoppes over.
  function ekstraTall(liste){
    return (Array.isArray(liste) ? liste : []).map(function(e){
      if(!e || !POSTER[e.g]) return null;
      var q = e.p === 'egen' ? (EGEN[e.g] ? {p:'', n:String(e.n || '').trim() || 'Egen post', r:EGEN[e.g]} : null)
        : POSTER[e.g].filter(function(x){ return x.p === e.p; })[0];
      return q ? {id:e.id, g:e.g, k:q.p, n:q.n, r:q.r, v:tall(e.v), f:tall(e.f)} : null;
    }).filter(Boolean);
  }

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
    var x = function(grp){ return (b.ekstra || []).reduce(function(t, e){ return t + (e.g === grp ? (f ? e.f : e.v) : 0); }, 0); };
    var anl = g('bAnlForsk') + g('bAnlEiend') + g('bAnlMask') + g('bAnlInv') + x('anl'), oml = g('bOmlVare') + g('bOmlKund') + g('bOmlBank') + x('oml');
    var ek = g('bEkAks') + g('bEkOver') + g('bEkOpp') + x('ek'), gl = g('bGLBank') + g('bGLAnnen') + x('gl'), gk = g('bGKLev') + g('bGKSkat') + g('bGKAnnen') + x('gk');
    return {anl:anl, oml:oml, eiend:anl + oml, ek:ek, gl:gl, gk:gk, ekGjeld:ek + gl + gk,
            diff:anl + oml - ek - gl - gk, bank:g('bOmlBank'), tom:anl + oml === 0 && ek + gl + gk === 0};
  }

  // Kontantstrømmen etter den indirekte modellen, slik den settes opp i praksis: resultatet før skatt,
  // pluss avskrivninger, og så endringen i hver balansepost fra i fjor til i år.
  // Fortegn: + styrker kassen, − svekker den. Stemmer begge balansene, blir summen lik endringen i bank.
  function utled(res, b){
    var R = regnRes(res);
    var d = function(k){ return (+b[k] || 0) - (+b[k + '_f'] || 0); };
    // Endringen i de egne postene med rolle r, med fortegnet som styrker kassen (eiendeler minus, gjeld og egenkapital pluss)
    var x = function(r){ return (b.ekstra || []).reduce(function(t, e){ return e.r === r ? t + (eiendel(e.g) ? e.f - e.v : e.v - e.f) : t; }, 0); };
    var betalt = R.skatt - d('bGKSkat') - x('skatt'), rest = 0;   // skatten som faktisk er betalt i år
    if(betalt < 0){ rest = -betalt; betalt = 0; }       // gjelden økte mer enn årets skatt: resten er avgifter
    var inv = d('bAnlForsk') + d('bAnlEiend') + d('bAnlMask') - x('anl') + R.avskr;   // kjøp til kostpris = endring + avskrivning
    var o = {
      opRes: R.forSkatt, opSkatt: -betalt, opAvskr: R.avskr,
      opVarelager: -d('bOmlVare'), opKunde: -d('bOmlKund'), opLevgjeld: d('bGKLev'), opAnnet: d('bGKAnnen') + x('drift') + rest,
      invKjop: inv > 0 ? -inv : 0, invSalg: inv < 0 ? -inv : 0, invAksjer: -d('bAnlInv') + x('aksjer'),
      finGjeld: d('bGLBank') + d('bGLAnnen') + x('gjeld'), finKasse: x('kasse'), finEk: d('bEkAks') + d('bEkOver') + x('ek'),
      // Utbytte satt av i år = årsresultat − økningen i opptjent egenkapital. Det som fortsatt er skyldig, er ikke betalt.
      finUtbytte: -(R.ar - d('bEkOpp')) + x('utbytte'),
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
    bal.ekstra = ekstraTall(b.ekstra);
    KS.forEach(function(id){ ks[id] = tall(k[id]); });
    // Resultatsiden kan ha en annen skattekostnad enn 22 % (det ekte eksempelet). Da gjelder den.
    if(res.mode === 'as' && a && typeof a.belop === 'number' && typeof a.forSkatt === 'number'
       && Math.round(regnRes(res).forSkatt) === a.forSkatt) res.skatt = a.forSkatt - a.belop;
    return {res:res, bal:bal, ks:ks};
  }

  // Har brukeren ført egne tall i en del (noe annet enn tomt eller eksempelet)?
  function egneTall(del, eksKs){
    var n = 0;
    if(del === 'res'){ var r = read('hv-rr-v2') || {}; RES.forEach(function(id){ if(tall(r[id]) !== (EKS.res[id] || 0)) n++; }); }
    if(del === 'bal'){ var b = read('hv-balanse-v1') || {}; BAL.forEach(function(id){
      if(tall(b[id]) !== (EKS.bal[id] || 0) || tall(b[id + '_f']) !== (EKS.bal[id + '_f'] || 0)) n++; });
      ekstraTall(b.ekstra).forEach(function(e){ if(e.v || e.f) n++; }); }
    if(del === 'ks'){ var k = read('hv-kontantstrom-v2') || {}; KS.forEach(function(id){ if(tall(k[id]) !== (eksKs[id] || 0)) n++; }); }
    return n > 0;
  }
  var NAVN = {res:'resultatet', bal:'balansen', ks:'kontantstrømmen'};

  // Eksempelet er trykket på én side: legg de to andre delene i lageret, så alle tre viser samme selskap.
  // Har brukeren ført egne tall i en av de andre delene, spør vi først. Svarer brukeren Avbryt, står
  // de andre delene urørt, og bare siden brukeren står på får eksempelet.
  function fyllAndre(denne){
    var R = regnRes(EKS.res), B = regnBal(EKS.bal), ks = utled(EKS.res, EKS.bal), K = regnKs(ks), snap;
    var egne = ['res', 'bal', 'ks'].filter(function(d){ return d !== denne && egneTall(d, ks); });
    if(egne.length){
      var ok = true;
      try{ ok = window.confirm('Eksempelet erstatter tallene du har ført i ' + egne.map(function(d){ return NAVN[d]; }).join(' og ')
        + '. De kan ikke hentes tilbake.\n\nVelg OK for å fylle alle tre delene med eksempelet, eller Avbryt for å bare fylle denne siden.'); }catch(e){}
      if(!ok) return;
    }
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
      s.src = '/shared/regnskap-excel.js?v=v3'; s.onload = function(){ ok(); }; s.onerror = function(){ xl = null; feil(new Error('excel')); };
      document.head.appendChild(s);
    });
    return xl;
  }
  document.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('[data-rf-excel]');
    if(!b) return;
    var note = document.querySelector('[data-rf-excel-note]');
    if(balUtdatert()){ if(note) note.textContent = UTDATERT; return; }
    lastExcel().then(function(){
      var ok = window.HVRegnskapExcel.lastNed(lagret());
      if(note) note.textContent = ok ? '' : 'Fyll inn minst én av de tre delene først.';
    }, function(){ if(note) note.textContent = 'Fikk ikke hentet Excel-motoren. Prøv igjen.'; });
  });

  window.HVRegnskap = {RES:RES, BAL:BAL, KS:KS, EKS:EKS, SATS:SATS, POSTER:POSTER, EGEN:EGEN, tall:tall, felt:felt,
    regnRes:regnRes, regnBal:regnBal, regnKs:regnKs, utled:utled, lagret:lagret, fyllAndre:fyllAndre,
    balUtdatert:balUtdatert, UTDATERT:UTDATERT,
    eksKs:function(){ return utled(EKS.res, EKS.bal); }};
})();
