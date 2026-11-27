// Regnemotoren: bilag inn, hovedbok, resultat og balanse ut. Ingen skjerm, ingen lagring.
// Beløp er alltid heltall i øre. Debet er pluss, kredit er minus. Et bilag går alltid i null.
// Bokførte bilag endres aldri: retting er et nytt bilag som reverserer hele det gamle.
// Testes av scripts/test-bokforing.js.
(function () {
var BOK = globalThis.HVBok = globalThis.HVBok || {};
var M = BOK.motor = {};

var BANK = ['1900', '1920', '1950'];
var SAMLE = { '1500': 'kunde', '2400': 'leverandor' };
var MVAKONTI = ['2700', '2710'];

// ── Tall og datoer ──────────────────────────────────────────────────────
// «12 500,50», «12500.5», «−300» → øre. Ugyldig tekst gir NaN, tom tekst gir 0.
M.ore = function (v) {
  if (typeof v === 'number') return Math.round(v * 100);
  var s = String(v == null ? '' : v).replace(/[\s  ]|kr/gi, '').replace(/[−‒-―]/g, '-');
  if (s === '') return 0;
  if (/,/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return NaN;
  var neg = s.charAt(0) === '-', d = s.replace('-', '').split('.');
  var n = parseInt(d[0], 10) * 100 + (d[1] ? parseInt((d[1] + '0').slice(0, 2), 10) : 0);
  return neg ? -n : n;
};
// Øre → «12 500» eller «12 500,50»
M.kr = function (ore, desimaler) {
  var n = Math.abs(Math.round(ore)), hele = Math.floor(n / 100), rest = n % 100;
  var s = String(hele).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (desimaler || rest) s += ',' + ('0' + rest).slice(-2);
  return (ore < 0 && n > 0 ? '−' : '') + s;
};
M.erDato = function (s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  var d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
};
M.aar = function (dato) { return +dato.slice(0, 4); };
M.termin = function (dato) { return Math.ceil(+dato.slice(5, 7) / 2); };
M.terminDatoer = function (aar, t) {
  var m2 = t * 2, siste = new Date(Date.UTC(aar, m2, 0)).toISOString().slice(0, 10);
  return { fra: aar + '-' + ('0' + (m2 - 1)).slice(-2) + '-01', til: siste };
};
M.plussDager = function (dato, n) {
  return new Date(Date.parse(dato + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
};
// Første påskedag (Gauss/Meeus) og de norske helligdagene som kan flytte en frist
function paaske(y) {
  var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
  return y + '-' + ('0' + Math.floor(n / 31)).slice(-2) + '-' + ('0' + (n % 31 + 1)).slice(-2);
}
M.erFridag = function (dato) {
  var u = new Date(dato + 'T00:00:00Z').getUTCDay(), y = M.aar(dato), p = paaske(y), md = dato.slice(5);
  if (u === 0 || u === 6) return true;
  if (['01-01', '05-01', '05-17', '12-25', '12-26'].indexOf(md) >= 0) return true;
  return [-3, -2, 1, 39, 50].some(function (n) { return M.plussDager(p, n) === dato; });
};
M.virkedag = function (dato) { while (M.erFridag(dato)) dato = M.plussDager(dato, 1); return dato; };
// Mva-frist: en måned og ti dager etter terminen, 31. august for 3. termin. Helg flytter til neste virkedag.
M.mvaFrist = function (aar, t) {
  var d = t === 3 ? aar + '-08-31' : t === 6 ? (aar + 1) + '-02-10' : aar + '-' + ('0' + (t * 2 + 2)).slice(-2) + '-10';
  return M.virkedag(d);
};
M.dato = function (d) { return d ? +d.slice(8) + '.' + +d.slice(5, 7) + '.' + d.slice(0, 4) : ''; };

// ── Regnskapet ──────────────────────────────────────────────────────────
M.nytt = function (s) {
  return {
    v: 1, selskap: { navn: s.navn || 'Uten navn', orgnr: s.orgnr || '', form: s.form === 'ENK' ? 'ENK' : 'AS', mva: s.mva !== false, start: s.start || '2026-01-01' },
    parter: [], bilag: [], lukketTil: null, logg: [], avstemt: {}, mvaLevert: {}
  };
};
M.part = function (r, type, navn) {
  navn = String(navn || '').trim();
  if (!navn) return null;
  var f = r.parter.filter(function (p) { return p.type === type && p.navn.toLowerCase() === navn.toLowerCase(); })[0];
  if (f) return f;
  var pre = type === 'kunde' ? 'K' : 'L';
  return { id: pre + (r.parter.filter(function (p) { return p.type === type; }).length + 1), type: type, navn: navn, ny: true };
};
M.partNavn = function (r, id) { var p = r.parter.filter(function (x) { return x.id === id; })[0]; return p ? p.navn : id || ''; };

// Kan forslaget bokføres? Returnerer en liste med feil på vanlig norsk. Tom liste = ja.
M.sjekk = function (r, f) {
  var feil = [], L = (f.linjer || []), sum = 0;
  if (!M.erDato(f.dato)) feil.push('Velg en gyldig dato.');
  else {
    if (f.dato < r.selskap.start) feil.push('Datoen er før regnskapet starter (' + M.dato(r.selskap.start) + ').');
    if (r.lukketTil && f.dato <= r.lukketTil) feil.push('Perioden til og med ' + M.dato(r.lukketTil) + ' er låst. Bruk en senere dato, eller åpne perioden med en grunn.');
  }
  if (!String(f.tekst || '').trim()) feil.push('Skriv kort hva bilaget gjelder.');
  if (L.length < 2) feil.push('Føringen må ha minst to linjer.');
  L.forEach(function (l) {
    var k = BOK.konto[l.konto];
    if (!k) { feil.push('Kontoen ' + l.konto + ' finnes ikke.'); return; }
    if (k.form !== 'begge' && k.form !== r.selskap.form) feil.push(l.konto + ' ' + k.navn + ' brukes bare i ' + k.form + '.');
    if (!Number.isInteger(l.belop)) feil.push('Et beløp er ikke et gyldig tall.');
    else sum += l.belop;
    if (l.belop === 0) feil.push('En linje er null.');
    if (SAMLE[l.konto]) {
      var p = r.parter.concat(f.nyeParter || []).filter(function (x) { return x.id === l.part; })[0];
      if (!p || p.type !== SAMLE[l.konto]) feil.push(l.konto === '1500' ? 'Velg hvilken kunde det gjelder.' : 'Velg hvilken leverandør det gjelder.');
    }
    if (MVAKONTI.indexOf(l.konto) >= 0 && !l.avg && f.type !== 'oppgjor' && f.type !== 'ib' && !f.reverserer) feil.push('Mva-kontoene kan bare føres av verktøyet, ikke direkte.');
    if (l.mva != null && !BOK.mvakoder[l.mva]) feil.push('Ukjent mva-kode ' + l.mva + '.');
  });
  if (sum !== 0) feil.push('Debet og kredit er ikke like. Forskjellen er ' + M.kr(Math.abs(sum), true) + ' kr.');
  if ((f.type === 'retting' || f.type === 'snu') && !String(f.grunn || '').trim()) feil.push('Skriv hvorfor du retter eller snur føringen.');
  return feil.filter(function (x, i) { return feil.indexOf(x) === i; });
};

// Legger bilaget til. Nummeret gis her, i rekkefølge, og brukes aldri om igjen. Endrer ikke det gamle regnskapet.
M.bokfor = function (r, f, naa) {
  var feil = M.sjekk(r, f);
  if (feil.length) return { ok: false, feil: feil, regnskap: r };
  var s = BOK.satserFor(M.aar(f.dato)), b = {
    nr: r.bilag.length + 1, dato: f.dato, tekst: String(f.tekst).trim(), type: f.type || 'vanlig', hendelse: f.hendelse || null,
    felt: f.felt || null, linjer: f.linjer.map(function (l) { return Object.assign({}, l); }), vedlegg: f.vedlegg || [],
    grunn: f.grunn || '', reverserer: f.reverserer || null, laget: naa || new Date().toISOString(),
    regel: 'satser ' + M.aar(f.dato) + ', ' + s.status + ', kontrollert ' + s.kontrollert
  };
  var nye = (f.nyeParter || []).filter(function (p) { return !r.parter.some(function (x) { return x.id === p.id; }); })
    .map(function (p) { return { id: p.id, type: p.type, navn: p.navn }; });
  return { ok: true, feil: [], bilag: b, regnskap: Object.assign({}, r, { bilag: r.bilag.concat([b]), parter: r.parter.concat(nye) }) };
};
M.reversertAv = function (r, nr) { var b = r.bilag.filter(function (x) { return x.reverserer === nr; })[0]; return b ? b.nr : null; };
// Forslag som nuller et bilag. type: 'retting' (feil) eller 'snu' (periodisering snus i ny periode)
M.reverser = function (r, nr, dato, grunn, type) {
  var b = r.bilag[nr - 1];
  if (!b) return { feil: ['Bilag ' + nr + ' finnes ikke.'] };
  if (M.reversertAv(r, nr)) return { feil: ['Bilag ' + nr + ' er allerede reversert av bilag ' + M.reversertAv(r, nr) + '.'] };
  if (b.reverserer) return { feil: ['Bilag ' + nr + ' er selv en reversering. Før det riktige bilaget på nytt i stedet.'] };
  return {
    feil: [], dato: dato, type: type || 'retting', grunn: grunn, reverserer: nr,
    tekst: (type === 'snu' ? 'Snur bilag ' : 'Retter bilag ') + nr + ': ' + b.tekst,
    oppgjor: b.oppgjor,
    linjer: b.linjer.map(function (l) { return Object.assign({}, l, { belop: -l.belop }); })
  };
};

// ── Hovedbok ────────────────────────────────────────────────────────────
// Alle linjer mellom to datoer, i bilagsrekkefølge per dato
M.linjer = function (r, fra, til) {
  var ut = [];
  r.bilag.forEach(function (b) {
    if ((fra && b.dato < fra) || (til && b.dato > til)) return;
    b.linjer.forEach(function (l, i) { ut.push({ b: b, l: l, i: i }); });
  });
  return ut;
};
M.saldoer = function (r, fra, til) {
  var s = {};
  r.bilag.forEach(function (b) {
    if ((fra && b.dato < fra) || (til && b.dato > til)) return;
    b.linjer.forEach(function (l) { s[l.konto] = (s[l.konto] || 0) + l.belop; });
  });
  return s;
};
function erResultat(nr) { var t = BOK.konto[nr] && BOK.konto[nr].type; return t === 'inntekt' || t === 'kostnad'; }
M.hovedbok = function (r, konto, fra, til) {
  var ib = 0, rader = [];
  // Resultatkontoer begynner på null hvert år. Balansekontoer tar med alt som kom før.
  if (!erResultat(konto) && fra) ib = M.saldoer(r, null, M.plussDager(fra, -1))[konto] || 0;
  var saldo = ib;
  M.linjer(r, fra, til).filter(function (x) { return x.l.konto === konto; })
    .sort(function (a, b) { return a.b.dato < b.b.dato ? -1 : a.b.dato > b.b.dato ? 1 : a.b.nr - b.b.nr; })
    .forEach(function (x) { saldo += x.l.belop; rader.push({ nr: x.b.nr, dato: x.b.dato, tekst: x.b.tekst, belop: x.l.belop, saldo: saldo, part: x.l.part, mva: x.l.mva }); });
  return { konto: konto, ib: ib, rader: rader, ub: saldo };
};
M.saldobalanse = function (r, aar) {
  var fra = aar + '-01-01', til = aar + '-12-31', ut = [];
  BOK.kontoplan.forEach(function (k) {
    var h = M.hovedbok(r, k.nr, fra, til), d = 0, c = 0;
    h.rader.forEach(function (x) { if (x.belop > 0) d += x.belop; else c -= x.belop; });
    if (h.ib || h.rader.length) ut.push({ nr: k.nr, navn: k.navn, type: k.type, ib: h.ib, debet: d, kredit: c, ub: h.ub });
  });
  return ut;
};

// ── Resultat og balanse ─────────────────────────────────────────────────
M.resultat = function (r, fra, til) {
  var s = M.saldoer(r, fra, til), p = {}, kontoer = {};
  Object.keys(s).forEach(function (nr) {
    var k = BOK.konto[nr];
    if (!k || !erResultat(nr) || !s[nr]) return;
    var n = +k.post.slice(2), v = k.type === 'inntekt' ? -s[nr] : s[nr];
    p[n] = (p[n] || 0) + v;
    (kontoer[n] = kontoer[n] || []).push({ nr: nr, navn: k.navn, belop: v });
  });
  var g = function () { return Array.prototype.reduce.call(arguments, function (t, n) { return t + (p[n] || 0); }, 0); };
  var inntekt = g(1, 2), kostnad = g(3, 4, 5, 6, 7, 8, 9), drift = inntekt - kostnad;
  var finans = g(11, 12, 13, 14, 15) - g(16, 17, 18), forSkatt = drift + finans, aars = forSkatt - g(20);
  p[10] = drift; p[19] = forSkatt; p[21] = aars;
  return { post: p, kontoer: kontoer, inntekt: inntekt, kostnad: kostnad, drift: drift, finans: finans, forSkatt: forSkatt, skatt: g(20), aars: aars };
};
// Årets resultat minus det som er disponert (8800), per år. Det er den beregnede linjen i egenkapitalen.
M.udisponert = function (r, til) {
  var aar = {}, ut = [];
  r.bilag.forEach(function (b) {
    if (til && b.dato > til) return;
    var a = M.aar(b.dato);
    b.linjer.forEach(function (l) { if (erResultat(l.konto) || l.konto === '8800') aar[a] = (aar[a] || 0) - l.belop; });
  });
  Object.keys(aar).sort().forEach(function (a) { ut.push({ aar: +a, belop: aar[a] }); });
  return ut;
};
M.balanse = function (r, til) {
  var s = M.saldoer(r, null, til), p = {}, kontoer = {}, E = 0, EK = 0, G = 0, denne = M.aar(til);
  Object.keys(s).forEach(function (nr) {
    var k = BOK.konto[nr];
    if (!k || !k.post || erResultat(nr) || !s[nr]) return;
    var post = k.post.slice(2), v = k.type === 'eiendel' ? s[nr] : -s[nr];
    p[post] = (p[post] || 0) + v;
    (kontoer[post] = kontoer[post] || []).push({ nr: nr, navn: k.navn, belop: v });
    if (k.type === 'eiendel') E += v; else if (k.type === 'egenkapital') EK += v; else G += v;
  });
  var U = 0, linjer = [];
  M.udisponert(r, til).forEach(function (u) {
    U += u.belop;
    if (!u.belop) return;
    // I ENK tilhører tidligere års resultat eieren med en gang. I AS står det for seg til det er disponert.
    if (r.selskap.form === 'ENK' && u.aar < denne) {
      p['C.II.2'] = (p['C.II.2'] || 0) + u.belop;
      (kontoer['C.II.2'] = kontoer['C.II.2'] || []).push({ nr: '', navn: 'Resultat ' + u.aar, belop: u.belop });
    } else linjer.push({ aar: u.aar, navn: u.aar === denne ? 'Årets resultat så langt (ikke disponert)' : 'Resultat ' + u.aar + ' (ikke disponert)', belop: u.belop });
  });
  var bank = BANK.reduce(function (t, n) { return t + (s[n] || 0); }, 0);
  return { post: p, kontoer: kontoer, eiendeler: E, egenkapital: EK, gjeld: G, udisponert: U, udisponertLinjer: linjer, sumEkGjeld: EK + G + U, bank: bank, saldo: s };
};
M.reskontro = function (r, type, til) {
  var konto = type === 'kunde' ? '1500' : '2400', s = {}, siste = {};
  M.linjer(r, null, til).forEach(function (x) {
    if (x.l.konto !== konto) return;
    s[x.l.part] = (s[x.l.part] || 0) + x.l.belop;
    siste[x.l.part] = x.b.dato > (siste[x.l.part] || '') ? x.b.dato : siste[x.l.part];
  });
  return Object.keys(s).map(function (id) { return { id: id, navn: M.partNavn(r, id), saldo: type === 'kunde' ? s[id] : -s[id], siste: siste[id] }; })
    .sort(function (a, b) { return b.saldo - a.saldo; });
};

// ── Mva ─────────────────────────────────────────────────────────────────
M.mva = function (r, aar, t) {
  var d = M.terminDatoer(aar, t), sats = BOK.satserFor(aar).mva, koder = {}, oppgjor = [];
  function rad(kode, spes) {
    var n = kode + (spes || '');
    return koder[n] = koder[n] || { kode: kode, spes: spes || '', navn: BOK.mvakoder[kode].navn + (spes === 'tap' ? ' (tap på krav)' : ''), grunnlag: 0, ut: 0, inn: 0, antall: 0, bilag: [] };
  }
  r.bilag.forEach(function (b) {
    if (b.dato < d.fra || b.dato > d.til || b.type === 'ib') return;
    if (b.type === 'oppgjor') { if (!M.reversertAv(r, b.nr) && !b.reverserer) oppgjor.push(b); return; }
    b.linjer.forEach(function (l) {
      if (l.mva != null && BOK.mvakoder[l.mva].melding) {
        var k = rad(l.mva, l.spes), ut = BOK.mvakoder[l.mva].retning !== 'inn' && ['81', '86', '87'].indexOf(l.mva) < 0;
        k.grunnlag += ut ? -l.belop : l.belop; k.antall++;
        if (k.bilag.indexOf(b.nr) < 0) k.bilag.push(b.nr);
      }
      if (l.avg) { var a = rad(l.avg, l.spes); if (l.konto === '2700') a.ut -= l.belop; else if (l.konto === '2710') a.inn += l.belop; }
    });
  });
  // Meldingen tar bare hele kroner, per linje
  var hel = function (o) { return Math.round(o / 100) * 100; }, liste = Object.keys(koder).sort().map(function (n) { return koder[n]; }), utSum = 0, innSum = 0, melding = 0;
  liste.forEach(function (k) {
    utSum += k.ut; innSum += k.inn; melding += hel(k.ut) - hel(k.inn);
    var s = BOK.mvakoder[k.kode].sats, ret = BOK.mvakoder[k.kode].retning, vent = s ? k.grunnlag * sats[s] / 100 : 0, slakk = Math.max(100, k.antall);
    k.ok = !s || ((ret === 'inn' || Math.abs(k.ut - vent) <= slakk) && (ret === 'ut' || Math.abs(k.inn - vent) <= slakk));
  });
  return { aar: aar, termin: t, fra: d.fra, til: d.til, frist: M.mvaFrist(aar, t), koder: liste, ut: utSum, inn: innSum, netto: utSum - innSum, melding: melding, oppgjor: oppgjor };
};
// Rullerende tolv måneders salg som teller mot registreringsgrensen (avgiftspliktig og fritatt, ikke unntatt)
M.registreringssalg = function (r, dato) {
  var fra = M.plussDager((M.aar(dato) - 1) + dato.slice(4).replace('-02-29', '-02-28'), 1), s = M.saldoer(r, fra, dato);
  return -['3000', '3010', '3080', '3100', '3110', '3205'].reduce(function (t, n) { return t + (s[n] || 0); }, 0);
};

// ── Eier og selskap ─────────────────────────────────────────────────────
// AS: hva eieren skylder selskapet (1565), og hvor mye som er blitt utbytte etter skatteloven § 10-11 (4).
// Unntaket i FSFIN § 10-11-1 b krever begge deler: samlet lån under grensen, og innfridd innen fristen.
// Eldste lån regnes betalt først (Skatte-ABC L-5-2.3.2). Det som en gang er blitt utbytte, forsvinner ikke
// ved tilbakebetaling, så hele historien regnes gjennom. Gjelder personlige aksjonærer.
M.eierkrav = function (r, dato) {
  var dager = function (a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }, lan = [], utbytte = 0, hopp = {};
  // En føring som er rettet, var aldri et lån
  r.bilag.forEach(function (b) { if (b.reverserer && b.type === 'retting') { hopp[b.nr] = 1; hopp[b.reverserer] = 1; } });
  function skatt(l) { if (!l.skattlagt) { l.skattlagt = true; utbytte += l.rest; } }
  function frist(d) { lan.forEach(function (l) { if (l.rest > 0 && dager(l.dato, d) > BOK.satserFor(M.aar(l.dato)).eierlan.dager) skatt(l); }); }
  function rest() { return lan.reduce(function (t, l) { return t + l.rest; }, 0); }
  M.linjer(r, null, dato).filter(function (x) { return x.l.konto === '1565' && !hopp[x.b.nr]; })
    .sort(function (a, b) { return a.b.dato < b.b.dato ? -1 : a.b.dato > b.b.dato ? 1 : a.b.nr - b.b.nr; })
    .forEach(function (x) {
      frist(x.b.dato);
      if (x.l.belop > 0) {
        lan.push({ dato: x.b.dato, rest: x.l.belop, skattlagt: false });
        if (rest() >= BOK.satserFor(M.aar(x.b.dato)).eierlan.belop * 100) lan.forEach(function (l) { if (l.rest > 0) skatt(l); });
      } else { var betalt = -x.l.belop; lan.forEach(function (l) { var b = Math.min(betalt, l.rest); l.rest -= b; betalt -= b; }); }
    });
  frist(dato);
  var aapne = lan.filter(function (l) { return l.rest > 0; });
  return { saldo: rest(), eldste: aapne.length ? aapne[0].dato : null, dager: aapne.length ? dager(aapne[0].dato, dato) : 0, utbytte: utbytte };
};
// Hvorfor overskuddet ikke er det samme som penger i banken (1. januar til en dato)
M.kontantbro = function (r, til) {
  var fra = M.aar(til) + '-01-01', forr = M.plussDager(fra, -1), a = M.saldoer(r, null, forr), b = M.saldoer(r, null, til), g = {};
  // Åpningsbilaget er startpunktet, ikke en hendelse i året
  r.bilag.forEach(function (x) { if (x.type === 'ib' && x.dato >= fra && x.dato <= til) x.linjer.forEach(function (l) { a[l.konto] = (a[l.konto] || 0) + l.belop; }); });
  // [når pengene øker, når pengene minker]
  var navn = { kunder: ['Kunder betalte det de skyldte fra før', 'Salg som ikke er betalt ennå'], lager: ['Mindre varer på lager', 'Mer varer på lager'],
    utstyr: ['Avskrivning og salg av utstyr', 'Kjøp av utstyr, minus avskrivning'], andre: ['Andre krav er gjort opp', 'Andre krav og forskudd dere har betalt'],
    leverandor: ['Regninger dere ikke har betalt ennå', 'Betalte regninger fra før'], avgift: ['Mva, trekk og avgift som ikke er betalt ennå', 'Betalte mva, trekk og avgift fra før'],
    skatt: ['Skatt som ikke er betalt ennå', 'Betalt selskapsskatt'], laan: ['Nye lån', 'Avdrag på lån'], eier: ['Fra eier til selskapet', 'Fra selskapet til eier'],
    annen: ['Feriepenger og annet som ikke er betalt ennå', 'Betalte feriepenger og annet fra før'] };
  Object.keys(b).concat(Object.keys(a)).filter(function (n, i, l) { return l.indexOf(n) === i; }).forEach(function (nr) {
    var k = BOK.konto[nr], e = (b[nr] || 0) - (a[nr] || 0);
    if (!k || !k.post || erResultat(nr) || BANK.indexOf(nr) >= 0 || !e) return;
    var p = k.post.slice(2), q = /^A\.(I|II|III)\./.test(p) ? 'utstyr' : p === 'B.I' ? 'lager' : p === 'B.II.1' ? 'kunder' : nr === '1565' ? 'eier' : p.charAt(0) === 'B' ? 'andre'
      : p.charAt(0) === 'C' || nr === '2250' || nr === '2800' || nr === '2910' ? 'eier' : p === 'D.III.4' ? 'leverandor' : p === 'D.III.6' ? 'avgift' : p === 'D.III.5' || p === 'D.I.2' ? 'skatt'
      : /^D\.II\./.test(p) || p === 'D.III.3' ? 'laan' : 'annen';
    g[q] = (g[q] || 0) - e;
  });
  var start = BANK.reduce(function (t, n) { return t + (a[n] || 0); }, 0), slutt = BANK.reduce(function (t, n) { return t + (b[n] || 0); }, 0);
  // Disponeringen (8800) flytter bare resultatet innenfor egenkapitalen
  var d8800 = M.saldoer(r, fra, til)['8800'] || 0;
  if (d8800) g.eier = (g.eier || 0) - d8800;
  var res = M.resultat(r, fra, til).aars, linjer = Object.keys(navn).filter(function (q) { return g[q]; }).map(function (q) { return { gruppe: q, navn: navn[q][g[q] > 0 ? 0 : 1], belop: g[q] }; });
  return { start: start, resultat: res, linjer: linjer, slutt: slutt, ok: start + res + linjer.reduce(function (t, l) { return t + l.belop; }, 0) === slutt };
};

// ── Virkningen av et forslag, før det bokføres ──────────────────────────
M.virkning = function (r, f) {
  var til = M.aar(f.dato) + '-12-31', fra = M.aar(f.dato) + '-01-01';
  var etter = Object.assign({}, r, { parter: r.parter.concat(f.nyeParter || []), bilag: r.bilag.concat([{ nr: r.bilag.length + 1, dato: f.dato, type: f.type || 'vanlig', linjer: f.linjer, tekst: f.tekst }]) });
  var r0 = M.resultat(r, fra, til), r1 = M.resultat(etter, fra, til), b0 = M.balanse(r, til), b1 = M.balanse(etter, til), ut = { resultat: [], balanse: [] };
  BOK.resultatposter.forEach(function (p) {
    var a = r0.post[p[0]] || 0, b = r1.post[p[0]] || 0;
    if (a !== b && [10, 19].indexOf(p[0]) < 0) ut.resultat.push({ post: p[0], navn: p[1], for: a, etter: b, sum: p[0] === 21 });
  });
  BOK.balanseposter.forEach(function (g) {
    g[2].forEach(function (p) {
      var a = b0.post[p[0]] || 0, b = b1.post[p[0]] || 0;
      if (a !== b) ut.balanse.push({ post: p[0], navn: p[1], side: /^[AB]/.test(p[0]) ? 'eiendel' : 'ekgjeld', for: a, etter: b });
    });
  });
  if (b0.udisponert !== b1.udisponert) ut.balanse.push({ post: 'U', navn: 'Årets resultat så langt', side: 'ekgjeld', for: b0.udisponert, etter: b1.udisponert });
  ut.bank = { for: b0.bank, etter: b1.bank };
  ut.aars = { for: r0.aars, etter: r1.aars };
  ut.sum = { for: b0.eiendeler, etter: b1.eiendeler };
  ut.balanserer = b1.eiendeler === b1.sumEkGjeld;
  return ut;
};

// ── Kontrollene ─────────────────────────────────────────────────────────
// Hver kontroll sier hva den beviser. De finner programfeil og glemte steg, ikke riktig beløp på feil kostnadskonto.
M.kontroller = function (r, dato) {
  var ut = [], s = M.saldoer(r, null, dato), b = M.balanse(r, dato), aar = M.aar(dato), res = M.resultat(r, aar + '-01-01', dato);
  function legg(id, navn, ok, tekst, nivaa) { ut.push({ id: id, navn: navn, ok: ok, tekst: tekst || '', nivaa: nivaa || 'stopp' }); }
  var skjev = r.bilag.filter(function (x) { return x.linjer.reduce(function (t, l) { return t + l.belop; }, 0) !== 0; });
  legg('K1', 'Hvert bilag går i null', !skjev.length, skjev.length ? 'Bilag ' + skjev.map(function (x) { return x.nr; }).join(', ') : r.bilag.length + ' bilag');
  var ugyldig = r.bilag.filter(function (x) { return x.linjer.length < 2 || !M.erDato(x.dato) || x.linjer.some(function (l) { return !BOK.konto[l.konto]; }); });
  legg('K2', 'Alle bilag er gyldige', !ugyldig.length, ugyldig.length ? 'Bilag ' + ugyldig.map(function (x) { return x.nr; }).join(', ') : 'Dato, konto og minst to linjer');
  var sum = Object.keys(s).reduce(function (t, n) { return t + s[n]; }, 0);
  legg('K3', 'Saldobalansen er null', sum === 0, 'Sum ' + M.kr(sum, true));
  var ib = r.bilag.filter(function (x) { return x.type === 'ib'; });
  legg('K4', 'Høyst ett åpningsbilag', ib.length <= 1 && ib.every(function (x) { return x.linjer.every(function (l) { return !erResultat(l.konto); }); }), ib.length ? 'Bilag ' + ib[0].nr : 'Nystartet, ingen inngående balanse');
  legg('K5', 'Eiendeler = egenkapital + gjeld', b.eiendeler === b.sumEkGjeld, M.kr(b.eiendeler) + ' = ' + M.kr(b.sumEkGjeld));
  var u = M.udisponert(r, dato).filter(function (x) { return x.aar === aar; })[0], d8800 = (M.saldoer(r, aar + '-01-01', dato)['8800'] || 0);
  var okU = (u ? u.belop : 0) === res.aars - d8800 && (!d8800 || (u ? u.belop : 0) === 0);
  legg('K6', 'Resultatet er likt i resultat og balanse', okU, d8800 && !okU ? 'Disponert ' + M.kr(d8800) + ', men resultatet er ' + M.kr(res.aars) + '. Disponeringen må gjøres på nytt.' : 'Årsresultat ' + M.kr(res.aars));
  var kr = M.reskontro(r, 'kunde', dato).reduce(function (t, x) { return t + x.saldo; }, 0), lr = M.reskontro(r, 'leverandor', dato).reduce(function (t, x) { return t + x.saldo; }, 0);
  var utenPart = M.linjer(r, null, dato).filter(function (x) { return SAMLE[x.l.konto] && !r.parter.some(function (p) { return p.id === x.l.part && p.type === SAMLE[x.l.konto]; }); });
  legg('K7', 'Kunder og leverandører stemmer', kr === (s['1500'] || 0) && lr === -(s['2400'] || 0) && !utenPart.length, utenPart.length ? 'Uten kunde eller leverandør: bilag ' + utenPart.map(function (x) { return x.b.nr; }).join(', ') : 'Kunder ' + M.kr(kr) + ', leverandører ' + M.kr(lr));
  if (r.selskap.mva) {
    var feil8 = [], feil9 = [], feil10 = [], t;
    var forsteAar = r.bilag.reduce(function (m, x) { return Math.min(m, M.aar(x.dato)); }, aar);
    for (var y = forsteAar; y <= aar; y++) for (t = 1; t <= 6; t++) {
      var m = M.mva(r, y, t), navn = t + '. termin ' + y;
      if (m.fra > dato) break;
      m.koder.forEach(function (k) { if (!k.ok) feil8.push(navn + ' kode ' + k.kode); });
      var lev = r.mvaLevert[y + '-' + t];
      if (lev != null && lev !== m.melding) feil9.push(navn + ': levert ' + M.kr(lev) + ', bokført ' + M.kr(m.melding));
      if (m.til < dato && (m.ut || m.inn)) {
        if (!m.oppgjor.length) feil10.push(navn + ' er ikke gjort opp (frist ' + M.dato(m.frist) + ')');
        else {
          var so = function (n) { return m.oppgjor.reduce(function (z, o) { return z + o.linjer.reduce(function (y2, l) { return y2 + (l.konto === n ? l.belop : 0); }, 0); }, 0); };
          if (so('2700') !== m.ut || -so('2710') !== m.inn) feil10.push(navn + ' er endret etter oppgjøret');
        }
      }
    }
    legg('K8', 'Mva = grunnlag ganger sats', !feil8.length, feil8.join(', ') || 'Alle terminer');
    legg('K9', 'Bokført mva = levert melding', !feil9.length, feil9.join(', ') || (Object.keys(r.mvaLevert).length ? 'Alle leverte terminer' : 'Ingen melding er registrert som levert'), 'varsel');
    legg('K10', 'Mva-terminene er gjort opp', !feil10.length, feil10.join('. ') || 'Ingen avsluttede terminer mangler', 'varsel');
  }
  var utenKode = Object.keys(s).filter(function (n) { var k = BOK.konto[n]; return s[n] && n !== '8800' && (!k || !k.post || !k.skd[r.selskap.form.toLowerCase()]); });
  legg('K11', 'Alle kontoer har plass i årsregnskap og skattemelding', !utenKode.length, utenKode.length ? 'Mangler: ' + utenKode.join(', ') : 'Post i §§ 6-1 og 6-2, og kode hos Skatteetaten');
  var hull = r.bilag.filter(function (x, i) { return x.nr !== i + 1; });
  legg('K13', 'Bilagsnumrene er uten hull', !hull.length, r.bilag.length ? '1–' + r.bilag.length : 'Ingen bilag');
  var post = Object.keys(b.post).reduce(function (z, p) { return z + (/^[AB]/.test(p) ? b.post[p] : -b.post[p]); }, 0) - b.udisponertLinjer.reduce(function (z, l) { return z + l.belop; }, 0);
  legg('K14', 'Postene summerer til kontoene', post === 0, 'Differanse ' + M.kr(post, true));
  // Fortegn: gjeld skal ikke stå som eiendel, og omvendt
  var rar = Object.keys(s).filter(function (n) {
    var k = BOK.konto[n]; if (!k || !s[n] || erResultat(n) || k.kontra || ['2740', '2050', '2051', '8800'].indexOf(n) >= 0) return false;
    return (k.side === 'D' && s[n] < 0) || (k.side === 'K' && s[n] > 0);
  });
  legg('K15', 'Ingen konto står på feil side', !rar.length, rar.map(function (n) { return n + ' ' + BOK.konto[n].navn + ' ' + M.kr(s[n]); }).join(', ') || 'Alle balansekontoer har riktig fortegn', 'varsel');
  if (r.selskap.form === 'AS') {
    var e = M.eierkrav(r, dato);
    legg('K16', 'Lån til eier er ikke blitt utbytte', !e.utbytte, (e.utbytte ? M.kr(e.utbytte) + ' kr er trolig blitt skattepliktig utbytte (skatteloven § 10-11). ' : '') + (e.saldo ? 'Eieren skylder ' + M.kr(e.saldo) + ' kr, eldste uttak er ' + e.dager + ' dager gammelt' : 'Eieren skylder ingenting'), 'varsel');
  }
  var trekk = -(s['2600'] || 0), sistLonn = null;
  M.linjer(r, null, dato).forEach(function (x) { if (x.l.konto === '2600' && x.l.belop < 0 && (!sistLonn || x.b.dato > sistLonn)) sistLonn = x.b.dato; });
  if (sistLonn) { var fr = M.virkedag(M.plussDager(sistLonn, 1)); legg('K17', 'Skattetrekket er betalt', trekk <= 0 || dato <= fr, trekk > 0 ? M.kr(trekk) + ' kr, frist ' + M.dato(fr) : 'Ingenting skyldig', 'varsel'); }
  return ut;
};

// Et regnskap som kommer utenfra (fil eller nettleserlager) må være helt før det tas inn. Tom tekst = i orden.
M.gyldig = function (r) {
  var har = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); }, tekst = function (s) { return s == null || typeof s === 'string'; }, heltall = Number.isInteger;
  var obj = function (o) { return !!o && typeof o === 'object' && !Array.isArray(o); }, IKKE = 'Fila er ikke et regnskap fra dette verktøyet.';
  if (!obj(r) || r.v !== 1 || !obj(r.selskap) || !Array.isArray(r.bilag) || !Array.isArray(r.parter) || !Array.isArray(r.logg) || !obj(r.avstemt) || !obj(r.mvaLevert)) return IKKE;
  var s = r.selskap;
  if (['AS', 'ENK'].indexOf(s.form) < 0 || typeof s.mva !== 'boolean' || typeof s.navn !== 'string' || !M.erDato(s.start) || (r.lukketTil !== null && !M.erDato(r.lukketTil))) return IKKE;
  if (r.avstemt.bank && (!M.erDato(r.avstemt.bank.dato) || !heltall(r.avstemt.bank.belop))) return IKKE;
  if (!Object.keys(r.mvaLevert).every(function (k) { return /^\d{4}-[1-6]$/.test(k) && heltall(r.mvaLevert[k]); })) return IKKE;
  if (!r.logg.every(function (l) { return obj(l) && typeof l.tid === 'string' && typeof l.hva === 'string'; })) return IKKE;
  if (!r.parter.every(function (p) { return obj(p) && /^[KL]\d+$/.test(p.id) && ['kunde', 'leverandor'].indexOf(p.type) >= 0 && typeof p.navn === 'string'; })) return IKKE;
  var ok = r.bilag.every(function (b, i) {
    return obj(b) && heltall(b.nr) && M.erDato(b.dato) && typeof b.tekst === 'string' && ['vanlig', 'retting', 'snu', 'ib', 'oppgjor', 'disponering'].indexOf(b.type) >= 0
      && (b.reverserer === null || (heltall(b.reverserer) && b.reverserer >= 1 && b.reverserer <= i)) && (b.hendelse === null || har(BOK.hendelse, b.hendelse)) && (b.felt === null || obj(b.felt))
      && tekst(b.grunn) && tekst(b.laget) && tekst(b.regel) && Array.isArray(b.linjer) && Array.isArray(b.vedlegg)
      && b.linjer.every(function (l) { return obj(l) && har(BOK.konto, l.konto) && heltall(l.belop) && (l.mva == null || (typeof l.mva === 'string' && har(BOK.mvakoder, l.mva))) && (l.avg == null || (typeof l.avg === 'string' && har(BOK.mvakoder, l.avg))) && (l.spes == null || l.spes === 'tap') && (l.part == null || /^[KL]\d+$/.test(l.part)); })
      && b.vedlegg.every(function (v) { return obj(v) && typeof v.navn === 'string' && typeof v.data === 'string' && /^data:(image\/(png|jpeg|webp|svg\+xml)|application\/pdf)[;,]/.test(v.data) && tekst(v.type); });
  });
  if (!ok) return 'Fila har bilag som ikke kan leses.';
  var f = M.kontroller(r, '9999-12-31').filter(function (k) { return !k.ok && k.nivaa === 'stopp' && k.id !== 'K6'; });
  return f.length ? 'Regnskapet i fila er skadet. Disse kontrollene feiler: ' + f.map(function (k) { return '«' + k.navn + '»'; }).join(', ') + '.' : '';
};

// ── Data ut ─────────────────────────────────────────────────────────────
function csv(rader) { return '﻿' + rader.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); if (/^[=+\-@\t]/.test(c) && !/^-?[\d\s.,]+$/.test(c)) c = "'" + c; return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';'); }).join('\r\n'); }
var komma = function (o) { return (o < 0 ? '-' : '') + Math.floor(Math.abs(o) / 100) + ',' + ('0' + Math.abs(o) % 100).slice(-2); };
// Bokføringsspesifikasjonen (bokføringsforskriften § 3-1 nr. 1): alle poster i rekkefølge
M.journalCsv = function (r) {
  var ut = [['Bilag', 'Dato', 'Tekst', 'Konto', 'Kontonavn', 'Debet', 'Kredit', 'Mva-kode', 'Part', 'Type', 'Reverserer', 'Grunn', 'Bokført']];
  r.bilag.forEach(function (b) { b.linjer.forEach(function (l) { ut.push([b.nr, b.dato, b.tekst, l.konto, BOK.konto[l.konto].navn, l.belop > 0 ? komma(l.belop) : '', l.belop < 0 ? komma(-l.belop) : '', l.mva == null ? '' : l.mva, l.part ? M.partNavn(r, l.part) : '', b.type, b.reverserer || '', b.grunn, b.laget]); }); });
  return csv(ut);
};
M.saldobalanseCsv = function (r, aar) {
  var f = r.selskap.form.toLowerCase();
  return csv([['Konto', 'Navn', 'Inngående', 'Debet', 'Kredit', 'Utgående', 'Post', 'Skatteetatens kode']].concat(M.saldobalanse(r, aar).map(function (x) { var k = BOK.konto[x.nr]; return [x.nr, x.navn, komma(x.ib), komma(x.debet), komma(x.kredit), komma(x.ub), k.post ? (k.post.charAt(0) === 'R' ? '§ 6-1 nr. ' : '§ 6-2 ') + k.post.slice(2) : '', k.skd[f] || '']; })));
};

if (typeof module === 'object' && module.exports) module.exports = BOK;
})();
