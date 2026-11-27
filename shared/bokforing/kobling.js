// Koblingen fra bokføringen til /regnskap/resultat/, /regnskap/balanse/ og /regnskap/kontantstrom/.
// Hver konto har et felt i kontoplan.js. Her summeres kontoene per felt, rundes av til hele kroner, og
// lagres i de samme nøklene som sidene selv bruker (se toppen av shared/regnskap-flyt.js).
//   hv-bok-kobling   {v, navn, form, aar, til, ts, eksempel, forSkatt, skatt, res, bal, ks}   det som sist ble sendt
// «Sist sendt» er det som gjør at koblingen kan se om brukeren har endret tallene på sidene selv.
(function () {
var BOK = globalThis.HVBok = globalThis.HVBok || {};
var M = BOK.motor, KOB = BOK.kobling = {};
var NOKKEL = KOB.NOKKEL = 'hv-bok-kobling';
var RES = ['rSalg', 'rAnnen', 'rVare', 'rLonn', 'rAvskr', 'rAnnenKost', 'rFinInnt', 'rFinKost'];
var BAL = ['bAnlForsk', 'bAnlEiend', 'bAnlMask', 'bAnlInv', 'bOmlVare', 'bOmlKund', 'bOmlBank', 'bEkAks', 'bEkOver', 'bEkOpp', 'bGLBank', 'bGLAnnen', 'bGKLev', 'bGKSkat', 'bGKAnnen'];
var BALF = BAL.concat(BAL.map(function (id) { return id + '_f'; }));
function hel(ore) { return Math.round(ore / 100); }
function eiendel(id) { return /^b(Anl|Oml)/.test(id) || /^ekstra\/(anl|oml)\//.test(id); }

// Beløp per felt i øre, med fortegnet feltet skal ha på siden
function perFelt(saldo) {
  var ut = {};
  Object.keys(saldo).forEach(function (nr) {
    var k = BOK.konto[nr];
    if (!k || !k.felt || !saldo[nr]) return;
    ut[k.felt] = (ut[k.felt] || 0) + (k.type === 'eiendel' || k.type === 'kostnad' ? saldo[nr] : -saldo[nr]);
  });
  return ut;
}
// «hv-balanse-v1:bOmlBank» → {side:'bal', id:'bOmlBank'}. Skatten (hv-rr-arsresultat) er ikke et eget felt.
function delopp(f) {
  var p = f.split(':');
  return p[0] === 'hv-rr-v2' ? { side: 'res', id: p[1] } : p[0] === 'hv-balanse-v1' ? { side: 'bal', id: p[1] } : { side: 'skatt' };
}
// Inngående balanse i året: alt før 1. januar, pluss åpningsbilaget når det er datert i året
function saldoFjor(r, aar) {
  var s = M.saldoer(r, null, M.plussDager(aar + '-01-01', -1));
  r.bilag.forEach(function (b) { if (b.type === 'ib' && M.aar(b.dato) === aar) b.linjer.forEach(function (l) { s[l.konto] = (s[l.konto] || 0) + l.belop; }); });
  return s;
}
// Resultat som ikke er disponert, ligger i opptjent egenkapital på balansesiden
function balFelt(saldo, udisponert) {
  var f = {}, p = perFelt(saldo);
  Object.keys(p).forEach(function (k) { var d = delopp(k); if (d.side === 'bal') f[d.id] = p[k]; });
  f.bEkOpp = (f.bEkOpp || 0) + udisponert;
  return f;
}
function sumSide(f, vilEiendel) { return Object.keys(f).reduce(function (t, id) { return eiendel(id) === vilEiendel ? t + f[id] : t; }, 0); }
// Avrunding kan gi noen kroner i forskjell. Den legges i den største linjen som ikke er bank, skatt eller egenkapital,
// så banken, årsresultatet og utbyttet i kontantstrømmen blir riktige.
function jevnUt(f) {
  var diff = sumSide(f, true) - sumSide(f, false);
  if (!diff) return f;
  var best = Object.keys(f).filter(function (id) { return f[id] && !/^(bOmlBank|bEk|bGKSkat|ekstra\/ek\/)/.test(id); })
    .sort(function (a, b) { return Math.abs(f[b]) - Math.abs(f[a]); })[0] || 'bGKAnnen';
  f[best] = (f[best] || 0) + (eiendel(best) ? -diff : diff);
  return f;
}

// Regnskapet i hele kroner, klart for sidene. Rører ikke lageret.
KOB.tall = function (r, til) {
  var aar = M.aar(til), fra = aar + '-01-01', forr = M.plussDager(fra, -1), p = perFelt(M.saldoer(r, fra, til)), res = {}, skatt = 0;
  Object.keys(p).forEach(function (k) { var d = delopp(k); if (d.side === 'res') res[d.id] = hel(p[k]); else if (d.side === 'skatt') skatt += p[k]; });
  skatt = hel(skatt);
  var inn = function (id) { return /^r(Salg|Annen|FinInnt)$/.test(id) || /^ekstra\/(di|fi)\//.test(id); };
  var forSkatt = Object.keys(res).reduce(function (t, id) { return t + (inn(id) ? res[id] : -res[id]); }, 0), ar = forSkatt - skatt;
  var udisp = function (d) { return M.udisponert(r, d).reduce(function (t, u) { return t + u.belop; }, 0); };
  var fO = balFelt(saldoFjor(r, aar), udisp(forr)), nO = balFelt(M.saldoer(r, null, til), udisp(til)), f = {}, n = {};
  Object.keys(fO).forEach(function (id) { f[id] = hel(fO[id]); });
  jevnUt(f);
  Object.keys(nO).forEach(function (id) { n[id] = hel(nO[id]); });
  // Opptjent egenkapital følger årsresultatet i hele kroner. Resten er utbytte, uttak og innskudd.
  n.bEkOpp = (f.bEkOpp || 0) + ar + hel((nO.bEkOpp || 0) - (fO.bEkOpp || 0) - M.resultat(r, fra, til).aars);
  jevnUt(n);
  return { aar: aar, form: r.selskap.form, res: res, forSkatt: forSkatt, skatt: skatt, ar: ar, bal: n, fjor: f };
};

// ── Formatet sidene lagrer ──────────────────────────────────────────────
function tekst(n) { return n ? (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('nb-NO').replace(/[  ]/g, ' ') : ''; }
// Egne poster: «ekstra/gk/2700» → {id, g, p, k, n, v, f}
function ekstra(felt, fjor) {
  var alle = {}, R = globalThis.HVRegnskap;
  Object.keys(felt).concat(Object.keys(fjor || {})).forEach(function (x) { if (/^ekstra\//.test(x) && (felt[x] || (fjor && fjor[x]))) alle[x] = 1; });
  return Object.keys(alle).sort().map(function (x, i) {
    var q = x.split('/'), k = BOK.kontoplan.filter(function (y) { return y.felt && y.felt.split(':')[1] === x; })[0];
    var post = R && R.POSTER && (R.POSTER[q[1]] || []).filter(function (y) { return y.p === q[2]; })[0];
    var e = { id: 'x' + (i + 1), g: q[1], p: q[2], k: /^\d+$/.test(q[2]) ? q[2] : '', n: post ? post.n : k ? k.navn : '', v: tekst(felt[x] || 0) };
    if (fjor) e.f = tekst(fjor[x] || 0);
    return e;
  });
}
KOB.pakke = function (t) {
  var res = { mode: t.form === 'ENK' ? 'enk' : 'as' }, bal = {}, xr = ekstra(t.res), xb = ekstra(t.bal, t.fjor);
  RES.forEach(function (id) { res[id] = tekst(t.res[id] || 0); });
  BAL.forEach(function (id) { bal[id] = tekst(t.bal[id] || 0); bal[id + '_f'] = tekst(t.fjor[id] || 0); });
  if (xr.length) res.ekstra = xr;
  if (xb.length) bal.ekstra = xb;
  return { res: res, bal: bal };
};

// ── Lagring ─────────────────────────────────────────────────────────────
function les(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
// Sammenligner bare tall, så tomt felt, «0» og ulik formatering regnes som likt
function likt(a, b, felt) {
  var T = function (v) { return Math.round(globalThis.HVRegnskap.tall(v)); };
  var x = function (o) { return (Array.isArray(o.ekstra) ? o.ekstra : []).map(function (e) { return [e.g, e.p, T(e.v), T(e.f)].join('|'); }).filter(function (s) { return !/\|0\|0$/.test(s); }).sort().join(';'); };
  a = a || {}; b = b || {};
  return felt.every(function (id) { return T(a[id]) === T(b[id]); }) && x(a) === x(b);
}
KOB.sist = function () { var k = les(NOKKEL); return k && k.v === 1 && k.res && k.bal && k.ks ? k : null; };
// Hvilke av de tre sidene har tall som brukeren har skrevet selv?
KOB.status = function () {
  var k = KOB.sist(), R = globalThis.HVRegnskap, r = les('hv-rr-v2'), b = les('hv-balanse-v1'), s = les('hv-kontantstrom-v2'), egne = [];
  var ok = function (o, sendt, felt) { return likt(o, {}, felt) || (sendt && likt(o, sendt, felt)); };
  if (!ok(r, k && k.res, RES)) egne.push('resultatet');
  if (!ok(b, k && k.bal, BALF)) egne.push('balansen');
  if (!ok(s, k && k.ks, R.KS)) egne.push('kontantstrømmen');
  return { koblet: !!k, sist: k, egne: egne };
};
// Skriver tallene til de tre sidene. tving = erstatt tall brukeren har skrevet selv.
KOB.send = function (r, til, tving) {
  var R = globalThis.HVRegnskap, st = KOB.status();
  if (st.egne.length && !tving) return { ok: false, egne: st.egne };
  var t = KOB.tall(r, til), p = KOB.pakke(t);
  try {
    var sett = function (k, v) { localStorage.setItem(k, JSON.stringify(v)); };
    sett('hv-rr-v2', p.res);
    if (t.forSkatt || t.ar || Object.keys(t.res).length) sett('hv-rr-arsresultat', { belop: t.ar, ts: Date.now(), forSkatt: t.forSkatt, avskr: t.res.rAvskr || 0 });
    else localStorage.removeItem('hv-rr-arsresultat');
    sett('hv-balanse-v1', p.bal);
    sett('hv-balanse-arsresultat-hentet', { belop: t.ar });
    // Kontantstrømmen regnes av samme kode som kontantstrømsiden bruker
    var l = R.lagret(), ks, K, B, snap = {};
    l.res.skatt = t.skatt;
    B = R.regnBal(l.bal); ks = R.utled(l.res, l.bal); K = R.regnKs(ks);
    R.KS.forEach(function (id) { snap[id] = R.felt(ks[id]); });
    sett('hv-balanse-sum', { eiend: B.eiend, diff: B.diff, bank: B.bank, tom: B.tom });
    sett('hv-kontantstrom-v2', snap);
    sett('hv-kontantstrom-sum', { ub: K.ub, any: K.any });
    sett(NOKKEL, { v: 1, navn: r.selskap.navn, form: t.form, aar: t.aar, til: til, ts: Date.now(), eksempel: !!r.eksempel, forSkatt: t.forSkatt, skatt: t.skatt, res: p.res, bal: p.bal, ks: snap });
  } catch (e) { return { ok: false, feil: 'Fikk ikke lagret i nettleseren.' }; }
  return { ok: true, tall: t };
};
KOB.kobleFra = function () { try { localStorage.removeItem(NOKKEL); } catch (e) {} };
// Kontoene bak et felt på resultat- eller balansesiden
KOB.kontoerFor = function (f) { return BOK.kontoplan.filter(function (k) { return k.felt === f; }).map(function (k) { return k.nr; }); };

if (typeof module === 'object' && module.exports) module.exports = BOK;
})();
