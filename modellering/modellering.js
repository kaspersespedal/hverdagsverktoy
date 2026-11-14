/* Finansiell modellering — regnemotoren for /modellering/dcf/ og /modellering/prognose/.
   Bare rene funksjoner, ingen DOM. Samme fil lastes i nettleseren (window.HVModell)
   og i testene (node modellering/test-modellering.js), så det som testes er det som kjører.
   Alle satser er desimaltall: 8 % = 0.08. Beløp er i den enheten brukeren har valgt. */
(function(root){
  'use strict';

  // Nåverdien av ett beløp som kommer om t år, diskontert med rente r.
  function pv(cf, r, t){ return cf / Math.pow(1 + r, t); }

  // Avkastningskrav til egenkapitalen (CAPM): risikofri rente + beta × markedspremie.
  function capm(rf, beta, mrp){ return rf + beta * mrp; }

  // WACC: vektet snitt av egenkapitalkrav og lånerente etter skatt.
  // E og D er markedsverdien av egenkapitalen og den rentebærende gjelden.
  function wacc(o){
    var E = o.E, D = o.D, V = E + D;
    if(!(V > 0)) return NaN;
    return E / V * o.re + D / V * o.rd * (1 - o.tax);
  }

  // DCF med Gordons vekstformel for terminalverdien.
  // fcf: fri kontantstrøm år 1..N (slutten av hvert år). r: WACC. g: langsiktig vekst etter år N.
  // debt / cash: rentebærende gjeld og kontanter på verdsettelsesdagen. shares: antall aksjer.
  // unit: hvor mange kroner én enhet i fcf er (1, 1000 eller 1 000 000), brukes bare til verdi per aksje.
  function dcf(o){
    var fcf = o.fcf || [], r = o.r, g = o.g, n = fcf.length;
    var out = { ok:false, n:n, rows:[], pvSum:0, tv:NaN, pvTv:NaN, ev:NaN, equity:NaN, perShare:NaN, tvShare:NaN };
    if(!n){ out.err = 'Fyll inn fri kontantstrøm for minst ett år.'; return out; }
    if(!(r > -1)){ out.err = 'Avkastningskravet mangler.'; return out; }
    // Toleransen fanger avrunding: 0,10 − 0,08 er 0,020000000000000004 i flyttall, ikke 0,02.
    if(!(r - g > 1e-9)){ out.err = 'Avkastningskravet må være høyere enn den langsiktige veksten. Ellers vokser verdien uten grense.'; return out; }
    for(var t = 1; t <= n; t++){
      var f = 1 / Math.pow(1 + r, t);
      var row = { t:t, fcf:fcf[t - 1], factor:f, pv:fcf[t - 1] * f };
      out.rows.push(row);
      out.pvSum += row.pv;
    }
    out.tv = fcf[n - 1] * (1 + g) / (r - g);
    out.pvTv = out.tv / Math.pow(1 + r, n);
    out.ev = out.pvSum + out.pvTv;
    out.netDebt = (o.debt || 0) - (o.cash || 0);
    out.equity = out.ev - out.netDebt;
    out.tvShare = out.ev !== 0 ? out.pvTv / out.ev : NaN;
    if(o.shares > 0) out.perShare = out.equity * (o.unit || 1) / o.shares;
    out.ok = true;
    return out;
  }

  // Følsomhetstabell: verdien for hver kombinasjon av WACC og langsiktig vekst.
  // Celler der WACC ikke er over veksten, blir NaN.
  function sensitivity(o, rSteps, gSteps){
    return rSteps.map(function(dr){
      return gSteps.map(function(dg){
        var res = dcf({ fcf:o.fcf, r:o.r + dr, g:o.g + dg, debt:o.debt, cash:o.cash, shares:o.shares, unit:o.unit });
        if(!res.ok) return NaN;
        return o.shares > 0 ? res.perShare : res.equity;
      });
    });
  }

  // Treårsprognose der resultat, balanse og kontantstrøm henger sammen.
  // start: siste regnskapsår (år 0). a: forutsetninger, én verdi per år i arrays på tre.
  //   start = { revenue, fixed, nwc, cash, debt, equity }   (other = det som står igjen, holdes fast)
  //   a = { growth[], ebitdaMargin[], depr[], capex[], nwcPct[], rate[], tax[], payout[], debtChange[] }
  // depr og capex er i % av omsetningen, nwcPct er arbeidskapital i % av omsetningen,
  // rate er renten på gjelden ved inngangen til året. Underskudd gir ingen skatt.
  function forecast(start, a, years){
    years = years || 3;
    var other = start.equity + start.debt - start.fixed - start.nwc - start.cash;
    var prev = { revenue:start.revenue, fixed:start.fixed, nwc:start.nwc, cash:start.cash, debt:start.debt, equity:start.equity };
    var out = { other:other, years:[] };
    for(var i = 0; i < years; i++){
      var y = {};
      y.revenue = prev.revenue * (1 + a.growth[i]);
      y.ebitda = y.revenue * a.ebitdaMargin[i];
      y.depr = y.revenue * a.depr[i];
      y.ebit = y.ebitda - y.depr;
      y.interest = prev.debt * a.rate[i];
      y.ebt = y.ebit - y.interest;
      y.tax = Math.max(0, y.ebt) * a.tax[i];
      y.net = y.ebt - y.tax;
      y.dividend = Math.max(0, y.net) * a.payout[i];

      y.capex = y.revenue * a.capex[i];
      y.nwc = y.revenue * a.nwcPct[i];
      y.dNwc = y.nwc - prev.nwc;
      y.cfo = y.net + y.depr - y.dNwc;
      y.cfi = -y.capex;
      y.debtChange = a.debtChange[i];
      y.cff = y.debtChange - y.dividend;
      y.dCash = y.cfo + y.cfi + y.cff;

      y.fixed = prev.fixed + y.capex - y.depr;
      y.cash = prev.cash + y.dCash;
      y.debt = prev.debt + y.debtChange;
      y.equity = prev.equity + y.net - y.dividend;
      y.other = other;
      y.assets = y.fixed + y.nwc + y.other + y.cash;
      y.claims = y.equity + y.debt;
      y.diff = y.assets - y.claims;

      // Fri kontantstrøm til hele selskapet (før renter), den DCF-en diskonterer:
      // driftsresultat etter skatt + avskrivninger − investeringer − økning i arbeidskapital.
      y.nopat = y.ebit * (1 - a.tax[i]);
      y.fcff = y.nopat + y.depr - y.capex - y.dNwc;

      out.years.push(y);
      prev = y;
    }
    return out;
  }

  // Tall fra skjemafelt: tåler mellomrom, komma som desimaltegn og minus (også U+2212).
  function parseNum(s){
    if(s == null) return NaN;
    var t = String(s).replace(/[\s  ]/g, '').replace(/[−‒-―]/g, '-').replace(',', '.');
    if(t === '' || t === '-' || t === '.') return NaN;
    if(!/^-?\d*\.?\d*$/.test(t)) return NaN;
    return parseFloat(t);
  }

  // Norsk visning: mellomrom som tusenskille, komma som desimaltegn, vanlig bindestrek som minus.
  function fmt(n, d){
    if(!isFinite(n)) return '–';
    d = d == null ? 0 : d;
    var s = Math.abs(n).toFixed(d).split('.');
    var int = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    var str = int + (d > 0 ? ',' + s[1] : '');
    return (n < 0 && Number(str.replace(/\D/g, '')) !== 0 ? '−' : '') + str;
  }
  function pct(x, d){ return isFinite(x) ? fmt(x * 100, d == null ? 1 : d) + ' %' : '–'; }

  var api = { pv:pv, capm:capm, wacc:wacc, dcf:dcf, sensitivity:sensitivity, forecast:forecast, parseNum:parseNum, fmt:fmt, pct:pct };
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.HVModell = api;
})(this);
