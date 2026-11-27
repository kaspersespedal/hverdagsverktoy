// Skjermen på /regnskap/bokforing/ og i kundefila. All regning skjer i motor.js, alle føringer i hendelser.js,
// og koblingen til resultat, balanse og kontantstrøm i kobling.js.
(function () {
var BOK = globalThis.HVBok, M = BOK.motor, KOB = BOK.kobling, NOKKEL = 'hv-bokforing-v1';
var $ = function (id) { return document.getElementById(id); };
var rot = $('bf'), app = $('bf-app'), dlg = $('bf-dlg');
if (!rot) return;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function idag() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
var kr = function (o) { return M.kr(o) + ' kr'; };
var hele = function (o) { return kr(Math.round(o / 100) * 100); };
function endr(d, noytral) { return '<span class="endr ' + (noytral ? '' : d > 0 ? 'opp' : d < 0 ? 'ned' : '') + '">' + (d > 0 ? '+' : '') + M.kr(d) + '</span>'; }

// ── Tilstand og lagring ─────────────────────────────────────────────────
var innebygd = $('kundedata'), S = { fane: 'for', modus: 'forer', sok: '', h: null, felt: {}, dato: idag(), tekst: '', grunn: '', vedlegg: [], stabel: [], lese: false };
function les() { try { var t = localStorage.getItem(NOKKEL); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function lagre() { if (S.lese) return true; try { localStorage.setItem(NOKKEL, JSON.stringify(S.r)); return true; } catch (e) { toast('Fikk ikke lagret i nettleseren. Last ned sikkerhetskopi under «Data».'); return false; } }
function logg(hva) { S.r = Object.assign({}, S.r, { logg: S.r.logg.concat([{ tid: new Date().toISOString(), hva: hva }]) }); }
function aarliste() { var a = {}; S.r.bilag.forEach(function (b) { a[M.aar(b.dato)] = 1; }); a[M.aar(S.r.selskap.start)] = 1; var n = M.aar(idag()); if (n >= M.aar(S.r.selskap.start)) a[n] = 1; return Object.keys(a).map(Number).sort(); }
// «Til og med»: i dag, eller siste bilag i året hvis det er senere
function tilDato() { var y = S.aar, n = idag(), sist = S.r.bilag.reduce(function (m, b) { return M.aar(b.dato) === y && b.dato > m ? b.dato : m; }, ''); var t = M.aar(n) === y ? n : M.aar(n) > y ? y + '-12-31' : sist || y + '-12-31'; return sist > t ? sist : t; }
function start() {
  if (innebygd) { S.r = JSON.parse(innebygd.textContent); S.lese = true; S.modus = 'kunde'; S.fane = 'oversikt'; }
  else { var r = les(); S.r = r && !M.gyldig(r) ? r : BOK.eksempel(); }
  var a = aarliste(); S.aar = a.indexOf(M.aar(idag())) >= 0 ? M.aar(idag()) : a[a.length - 1];
  nyForing(); tegn(); fraHash();
}
// Er det dette regnskapet som ligger på resultat- og balansesiden?
function koblet() { var k = KOB && globalThis.HVRegnskap && !S.lese && KOB.sist(), s = S.r.selskap; return k && k.navn === s.navn && k.form === s.form && k.eksempel === !!S.r.eksempel ? k : null; }
// Er siden koblet, følger tallene med når noe føres. Tall brukeren har skrevet selv, blir ikke erstattet.
function synk() { if (koblet() && !KOB.status().egne.length) KOB.send(S.r, tilDato(), false); }
function lagreOgSynk() { var ok = lagre(); synk(); return ok; }
// Opp til verktøyet når det er rullet forbi, aldri til toppen av siden
function tilTopp() { var y = rot.getBoundingClientRect().top - 90; if (y < 0) window.scrollTo(0, window.pageYOffset + y); }
function nyForing() { S.h = null; S.felt = {}; S.tekst = ''; S.grunn = ''; S.vedlegg = []; }
function toast(t) { $('bf-status').textContent = t; var e = document.createElement('div'); e.className = 'bf bf-toast'; e.setAttribute('aria-hidden', 'true'); e.textContent = t; document.body.appendChild(e); setTimeout(function () { e.remove(); }, 4500); }

// ── Ramme ───────────────────────────────────────────────────────────────
var FANER = { forer: [['for', 'Før'], ['bilag', 'Bilag'], ['resultat', 'Resultat'], ['balanse', 'Balanse'], ['mva', 'Mva'], ['kontroll', 'Kontroll'], ['data', 'Data']], kunde: [['oversikt', 'Oversikt'], ['resultat', 'Resultat'], ['balanse', 'Balanse'], ['bilag', 'Bilag']] };
function tegn() {
  var s = S.r.selskap, f = FANER[S.modus].filter(function (x) { return x[0] !== 'mva' || s.mva; });
  if (!f.some(function (x) { return x[0] === S.fane; })) S.fane = f[0][0];
  app.innerHTML = '<header class="topp"><div><p class="navn">' + esc(s.navn) + '</p><p>' + (s.form === 'AS' ? 'Aksjeselskap' : 'Enkeltpersonforetak') + (s.mva ? ', mva-registrert' : ', ikke mva-registrert') + '. Regnskapsår <select id="aar" aria-label="Regnskapsår">' + aarliste().map(function (a) { return '<option' + (a === S.aar ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></p></div>'
    + (S.lese ? '<span class="merke">Kundevisning, bare lesing</span>' : '<div class="valgrad" role="group" aria-label="Hvem ser på?"><button type="button" data-modus="forer" aria-pressed="' + (S.modus === 'forer') + '">Den som fører</button><button type="button" data-modus="kunde" aria-pressed="' + (S.modus === 'kunde') + '">Kunden</button></div>') + '</header>'
    + (S.r.eksempel && !S.lese ? '<div class="beskjed rad ikkeprint"><span>Dette er et oppdiktet eksempel. Prøv deg fram. Ingenting sendes noe sted.</span><button type="button" class="knapp" data-gjor="nytt">Start eget regnskap</button></div>' : '')
    + '<nav class="faner" aria-label="Deler av regnskapet">' + f.map(function (x) { return '<button type="button" data-fane="' + x[0] + '"' + (x[0] === S.fane ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('') + '</nav><div id="vis"></div>';
  var v = { for: visFor, bilag: visBilag, resultat: visResultat, balanse: visBalanse, mva: visMva, kontroll: visKontroll, data: visData, oversikt: visOversikt }[S.fane];
  $('vis').innerHTML = v(); if (S.fane === 'for' && S.h) oppdater(true);
  $('bf-bunn').className = 'bf bunn'; if (S.fane === 'for' && S.h) bunn();
}

// ── Føre ────────────────────────────────────────────────────────────────
function passer(h) { var s = S.r.selskap; return (!h.form || h.form === 'begge' || h.form === s.form) && (!h.kreverMva || s.mva) && (!h.kreverIkkeMva || !s.mva); }
function visFor() {
  if (S.h) return '<div class="fore"><form class="kort" id="skjema" autocomplete="off" novalidate><div class="rad"><h3>' + esc(BOK.hendelse[S.h].navn) + '</h3><button type="button" class="lenke" data-gjor="bytt">Velg noe annet</button></div><div id="felter"></div></form><section class="kort virk" id="virk" aria-label="Dette skjer når du bokfører"></section></div>';
  return '<div class="fore"><section class="kort"><h3>Hva skjedde?</h3><label class="skjult" for="sok">Søk</label><input class="sok" id="sok" style="margin-top:12px" placeholder="Søk: utlegg, telefon, vipps, lønn …" value="' + esc(S.sok) + '"><div id="liste">' + liste() + '</div></section><section class="kort virk">' + naa() + '</section></div>';
}
function liste() {
  var q = S.sok.trim().toLowerCase(), ord = q.split(/\s+/).filter(Boolean), treff = function (t) { t = t.toLowerCase(); return ord.every(function (o) { return t.indexOf(o) >= 0; }); }, ut = '';
  if (q) { var kj = BOK.kjopstyper.filter(function (t) { return treff(t.navn + ' ' + t.ord + ' kjøp'); }); if (kj.length) ut += '<div class="gruppe"><h4>Jeg kjøpte</h4>' + kj.map(function (t) { return '<button type="button" class="valg" data-h="kjop" data-type="' + t.id + '">' + esc(t.navn) + '</button>'; }).join('') + '</div>'; }
  BOK.grupper.forEach(function (g) { var h = BOK.hendelser.filter(function (x) { return x.gruppe === g && passer(x) && (!q || treff(x.navn + ' ' + (x.ord || ''))); }); if (h.length) ut += '<div class="gruppe"><h4>' + g + '</h4>' + h.map(function (x) { return '<button type="button" class="valg" data-h="' + x.id + '">' + esc(x.navn) + '</button>'; }).join('') + '</div>'; });
  return ut || '<p class="dempet" style="margin-top:16px">Ingen treff. Prøv et annet ord, eller bruk «Fri føring».</p>';
}
function naa() {
  var t = tilDato(), b = M.balanse(S.r, t), r = M.resultat(S.r, S.aar + '-01-01', t), n = M.kontroller(S.r, t).filter(function (k) { return !k.ok; });
  return '<h3>Slik står det nå</h3><p class="dempet">Per ' + M.dato(t) + '</p><table style="margin-top:8px"><tbody><tr><td>Penger i bank og kasse</td><td class="tall">' + kr(b.bank) + '</td></tr><tr><td>Resultat hittil i ' + S.aar + '</td><td class="tall">' + kr(r.aars) + '</td></tr><tr><td>Kunder skylder</td><td class="tall">' + kr(b.post['B.II.1'] || 0) + '</td></tr><tr><td>Skyldig leverandører</td><td class="tall">' + kr(b.post['D.III.4'] || 0) + '</td></tr></tbody></table>'
    + (n.length ? n.map(function (k) { return '<div class="beskjed ' + (k.nivaa === 'stopp' ? 'feil' : 'varsel') + '"><strong>' + k.navn + ':</strong> ' + esc(k.tekst) + '</div>'; }).join('') : '<div class="beskjed ok">Alle kontroller er i orden.</div>')
    + '<p class="dempet" style="margin-top:14px">Velg hva som skjedde. Du ser føringen, resultatet, balansen og banken her før noe blir lagret.</p>';
}
function kontekst() { return BOK.kontekst(S.r, S.felt, S.dato); }
function synlige(c) { return BOK.hendelse[S.h].felt(c).filter(function (q) { return !q.vis || q.vis(S.felt); }); }
function fyllStd(c) { BOK.hendelse[S.h].felt(c).forEach(function (q) { if (S.felt[q.id] !== undefined && !(S.auto && S.auto[q.id])) return; var v = typeof q.std === 'function' ? q.std(S.felt) : q.std; if (q.type === 'valg') { if (S.felt[q.id] === undefined) S.felt[q.id] = v !== undefined ? v : (q.valg[0] || { v: '' }).v; } else if (q.type === 'kryss') { if (S.felt[q.id] === undefined) S.felt[q.id] = !!v; } else if (q.type === 'belop') { S.felt[q.id] = typeof v === 'number' && v > 0 ? M.kr(v).replace(/ /g, ' ') : typeof v === 'number' ? '' : v || ''; (S.auto = S.auto || {})[q.id] = typeof q.std === 'function'; } else if (q.type === 'tall' && typeof q.std === 'function') { S.felt[q.id] = v || ''; (S.auto = S.auto || {})[q.id] = true; } else if (S.felt[q.id] === undefined) S.felt[q.id] = v || ''; }); }
function velg(id, type) { nyForing(); S.h = id; S.auto = {}; if (type) S.felt.type = type; if (BOK.hendelse[id].frilinjer) S.felt.linjer = [{}, {}]; if (M.aar(S.dato) !== S.aar) S.dato = tilDato(); fyllStd(kontekst()); tegn(); var f = document.querySelector('#felter input,#felter select'); if (f) f.focus({ preventScroll: true }); tilTopp(); }
function feltHtml(q, c) {
  var v = S.felt[q.id], id = 'f-' + q.id;
  if (q.type === 'kryss') return '<label class="kryss"><input type="checkbox" data-felt="' + q.id + '" id="' + id + '"' + (v ? ' checked' : '') + '><span>' + esc(q.navn) + '</span></label>';
  var inn;
  if (q.type === 'valg') inn = '<select data-felt="' + q.id + '" id="' + id + '">' + (q.valg.length ? q.valg : [{ v: '', n: 'Ingenting å velge' }]).map(function (o) { return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(v) ? ' selected' : '') + '>' + esc(o.n) + '</option>'; }).join('') + '</select>';
  else if (q.type === 'part' && q.bare) { var l = M.reskontro(S.r, q.part).filter(function (p) { return p.saldo; }); inn = '<select data-felt="' + q.id + '" id="' + id + '"><option value="">Velg</option>' + l.map(function (p) { return '<option value="' + esc(p.navn) + '"' + (p.navn === v ? ' selected' : '') + '>' + esc(p.navn) + ' (' + kr(p.saldo) + ')</option>'; }).join('') + '</select>'; }
  else if (q.type === 'part') inn = '<input data-felt="' + q.id + '" id="' + id + '" list="l-' + q.part + '" value="' + esc(v) + '" placeholder="Navn"><datalist id="l-' + q.part + '">' + S.r.parter.filter(function (p) { return p.type === q.part; }).map(function (p) { return '<option value="' + esc(p.navn) + '">'; }).join('') + '</datalist>';
  else inn = '<input data-felt="' + q.id + '" id="' + id + '" inputmode="decimal" class="' + (q.type === 'belop' ? 'belop' : '') + '" value="' + esc(v) + '">';
  return '<label class="felt" for="' + id + '"><span>' + esc(q.navn) + (q.type === 'belop' ? ' (kr)' : '') + '</span>' + inn + (q.hint ? '<small>' + esc(q.hint) + '</small>' : '') + '</label>';
}
function friHtml() {
  var k = BOK.kontoplan.filter(function (x) { return (x.form === 'begge' || x.form === S.r.selskap.form) && ['2700', '2710'].indexOf(x.nr) < 0 || (S.h === 'ib' && (x.form === 'begge' || x.form === S.r.selskap.form)); });
  return '<div class="rulle"><table class="fri"><thead><tr><th>Konto</th><th>Debet</th><th>Kredit</th><th>Kunde / leverandør</th></tr></thead><tbody>' + S.felt.linjer.map(function (l, i) {
    return '<tr><td><select data-fri="' + i + '.konto" aria-label="Konto, linje ' + (i + 1) + '"><option value="">Velg</option>' + k.map(function (x) { return '<option value="' + x.nr + '"' + (x.nr === l.konto ? ' selected' : '') + '>' + x.nr + ' ' + esc(x.navn) + '</option>'; }).join('') + '</select></td><td><input data-fri="' + i + '.debet" inputmode="decimal" aria-label="Debet, linje ' + (i + 1) + '" value="' + esc(l.debet) + '"></td><td><input data-fri="' + i + '.kredit" inputmode="decimal" aria-label="Kredit, linje ' + (i + 1) + '" value="' + esc(l.kredit) + '"></td><td>' + (l.konto === '1500' || l.konto === '2400' ? '<input data-fri="' + i + '.part" aria-label="Navn, linje ' + (i + 1) + '" value="' + esc(l.part) + '">' : '') + '</td></tr>';
  }).join('') + '</tbody></table></div><button type="button" class="lenke" data-gjor="frilinje">Legg til linje</button>';
}
var sig = '';
function tegnFelter() {
  var h = BOK.hendelse[S.h], c = kontekst(), q = synlige(c);
  sig = signatur(q);
  $('felter').innerHTML = '<div class="to"><label class="felt" for="f-dato"><span>Dato</span><input type="date" id="f-dato" value="' + esc(S.dato) + '"' + (h.datoFra ? ' readonly' : '') + '></label><label class="felt" for="f-tekst"><span>Beskrivelse</span><input id="f-tekst" value="' + esc(S.tekst) + '" placeholder="' + esc(h.navn) + '"></label></div>'
    + q.map(function (x) { return feltHtml(x, c); }).join('') + (h.frilinjer ? friHtml() : '')
    + (h.kreverGrunn ? '<label class="felt" for="f-grunn"><span>Hvorfor føres dette?</span><input id="f-grunn" value="' + esc(S.grunn) + '"></label>' : '')
    + '<label class="felt" for="f-fil"><span>Kvittering eller faktura</span><input type="file" id="f-fil" accept="image/png,image/jpeg,image/webp,application/pdf" multiple><small>' + esc(h.bilag || '') + '</small></label>'
    + (S.vedlegg.length ? '<ul class="punkt">' + S.vedlegg.map(function (v, i) { return '<li class="rad"><span>' + esc(v.navn) + '</span><button type="button" class="lenke" data-gjor="fjernfil" data-i="' + i + '">Fjern</button></li>'; }).join('') + '</ul>' : '')
    + '<div id="meld"></div><button class="knapp hoved skjemaknapp" style="margin-top:16px;width:100%">Bokfør</button>';
}
function signatur(q) { return S.h + '|' + q.map(function (x) { return x.id + (x.valg ? x.valg.map(function (o) { return o.v + o.n; }).join() : ''); }).join('|'); }
function forslag() { return BOK.lag(S.h, S.felt, S.r, S.dato, { tekst: S.tekst, grunn: S.grunn, vedlegg: S.vedlegg }); }
// Tegner virkningen på nytt. Feltene tegnes bare når et felt skal fram eller bort, så markøren blir stående.
function oppdater(alt) {
  var c = kontekst(), foer = JSON.stringify(S.felt); fyllStd(c);
  if (alt || signatur(synlige(c)) !== sig) tegnFelter();
  else if (JSON.stringify(S.felt) !== foer) Object.keys(S.auto || {}).forEach(function (id) { var e = $('f-' + id); if (e && e !== document.activeElement) e.value = S.felt[id]; });
  var f = forslag(); if (BOK.hendelse[S.h].datoFra && $('f-dato')) $('f-dato').value = f.dato;
  $('virk').innerHTML = virkHtml(f); bunn(f);
  var m = f.varsler.map(function (t) { return '<div class="beskjed varsel">' + esc(t) + '</div>'; }).join('') + (S.visFeil ? f.feil.map(function (t) { return '<div class="beskjed feil">' + esc(t) + '</div>'; }).join('') : '');
  if ($('meld')) $('meld').innerHTML = m;
}
function linjetabell(linjer, nye) {
  var d = 0, k = 0, navn = function (id) { var p = (nye || []).filter(function (x) { return x.id === id; })[0]; return p ? p.navn : M.partNavn(S.r, id); };
  return '<table><thead><tr><th>Konto</th><th class="tall">Debet</th><th class="tall">Kredit</th></tr></thead><tbody>' + linjer.map(function (l) { if (l.belop > 0) d += l.belop; else k -= l.belop;
    return '<tr><td>' + l.konto + ' ' + esc((BOK.konto[l.konto] || {}).navn) + (l.part ? ' <span class="dempet">' + esc(navn(l.part)) + '</span>' : '') + (l.mva != null ? ' <span class="merke" title="' + esc(BOK.mvakoder[l.mva].navn) + '">mva-kode ' + esc(l.mva) + '</span>' : '') + '</td><td class="tall">' + (l.belop > 0 ? M.kr(l.belop) : '') + '</td><td class="tall">' + (l.belop < 0 ? M.kr(-l.belop) : '') + '</td></tr>'; }).join('')
    + '<tr class="sum"><td>Sum</td><td class="tall">' + M.kr(d) + '</td><td class="tall">' + M.kr(k) + '</td></tr></tbody></table>';
}
function kostpost(n) { return (n >= 3 && n <= 9) || (n >= 16 && n <= 18) || n === 20; }
function foretter(rader, noytral) { return '<table><thead><tr><th></th><th class="tall">Før</th><th class="tall">Etter</th><th class="tall">Endring</th></tr></thead><tbody>' + rader.map(function (x) { return '<tr' + (x.sum ? ' class="sum"' : '') + '><td>' + esc(x.navn) + '</td><td class="tall">' + M.kr(x.for) + '</td><td class="tall">' + M.kr(x.etter) + '</td><td class="tall">' + endr(x.etter - x.for, noytral) + '</td></tr>'; }).join('') + '</tbody></table>'; }
function virkHtml(f) {
  var t = '<h3>Dette skjer når du bokfører</h3>';
  if (!f.linjer.length) return t + '<p class="dempet" style="margin-top:8px">Fyll ut skjemaet, så ser du virkningen her.</p>';
  var v = M.virkning(S.r, f), ei = v.balanse.filter(function (x) { return x.side === 'eiendel'; }), eg = v.balanse.filter(function (x) { return x.side !== 'eiendel'; });
  return t + '<p class="forklar">' + esc(f.forklaring) + '</p>'
    + '<div class="del"><h4>Føringen</h4>' + linjetabell(f.linjer, f.nyeParter) + '</div>'
    + '<div class="del"><h4>Resultatet ' + M.aar(f.dato) + '</h4>' + (v.resultat.length ? foretter(v.resultat.map(function (x) { var f2 = kostpost(x.post) ? -1 : 1; return { navn: x.post === 21 ? 'Årets resultat' : x.navn, for: x.for * f2, etter: x.etter * f2, sum: x.sum }; })) : '<p class="dempet">Endres ikke.</p>') + '</div>'
    + '<div class="del"><h4>Balansen</h4>' + (ei.length ? '<p class="dempet">Eiendeler</p>' + foretter(ei, true) : '') + (eg.length ? '<p class="dempet" style="margin-top:8px">Egenkapital og gjeld</p>' + foretter(eg, true) : '') + (!ei.length && !eg.length ? '<p class="dempet">Endres ikke.</p>' : '<p class="dempet" style="margin-top:6px">' + (v.balanserer ? 'Balansen går opp: begge sider blir ' + kr(v.sum.etter) + '.' : 'Balansen går ikke opp ennå.') + '</p>') + '</div>'
    + '<div class="del"><h4>Penger i bank og kasse</h4>' + (v.bank.for !== v.bank.etter ? foretter([{ navn: 'Bank og kasse', for: v.bank.for, etter: v.bank.etter }]) : '<p class="dempet">Endres ikke nå. Saldoen er ' + kr(v.bank.for) + '.</p>') + '</div>';
}
function bunn(f) {
  f = f || forslag(); var t = 'Fyll ut skjemaet';
  if (f.linjer.length) { var v = M.virkning(S.r, f); t = 'Resultat ' + endr(v.aars.etter - v.aars.for) + '<br>Bank ' + endr(v.bank.etter - v.bank.for); }
  $('bf-bunn').className = 'bf bunn vis'; $('bf-bunn').innerHTML = '<p>' + t + '</p><button type="button" class="knapp hoved" data-gjor="bokfor">Bokfør</button>';
}
function bokfor() {
  var f = forslag();
  if (f.feil.length) { S.visFeil = true; oppdater(); var m = $('meld'); if (m) m.scrollIntoView({ block: 'center' }); $('bf-status').textContent = f.feil.join(' '); return; }
  var u = M.bokfor(S.r, f); if (!u.ok) { toast(u.feil.join(' ')); return; }
  S.r = u.regnskap; S.visFeil = false; lagreOgSynk(); if (M.aar(f.dato) !== S.aar) S.aar = M.aar(f.dato); nyForing(); tegn(); tilTopp();
  toast('Bilag ' + u.bilag.nr + ' er bokført: ' + u.bilag.tekst);
}

// ── Rapportene ──────────────────────────────────────────────────────────
function visBilag() {
  var b = S.r.bilag.filter(function (x) { return M.aar(x.dato) === S.aar; }).slice().sort(function (x, y) { return y.nr - x.nr; });
  return '<section class="kort"><div class="rad"><h3>Bilag ' + S.aar + '</h3><span class="dempet">' + b.length + ' bilag</span></div>' + (b.length ? '<div class="rulle"><table style="margin-top:8px"><thead><tr><th>Nr.</th><th>Dato</th><th>Hva</th><th></th><th class="tall">Beløp</th></tr></thead><tbody>' + b.map(function (x) {
    var sum = x.linjer.reduce(function (t, l) { return t + Math.max(0, l.belop); }, 0), av = M.reversertAv(S.r, x.nr);
    return '<tr class="klikk" data-bilag="' + x.nr + '"><td>' + x.nr + '</td><td style="white-space:nowrap">' + M.dato(x.dato) + '</td><td><button type="button" class="radknapp">' + esc(x.tekst) + '</button></td><td>' + (av ? '<span class="merke">' + (S.r.bilag[av - 1].type === 'snu' ? 'Snudd' : 'Rettet') + ' av ' + av + '</span>' : x.reverserer ? '<span class="merke">' + (x.type === 'snu' ? 'Snur ' : 'Retter ') + x.reverserer + '</span>' : '') + (x.vedlegg.length ? ' <span class="merke ok">Vedlegg</span>' : '') + '</td><td class="tall">' + M.kr(sum) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="dempet" style="margin-top:10px">Ingen bilag i ' + S.aar + ' ennå.</p>') + '</section>';
}
function visResultat() {
  var t = tilDato(), r = M.resultat(S.r, S.aar + '-01-01', t), f = M.resultat(S.r, (S.aar - 1) + '-01-01', (S.aar - 1) + '-12-31'), harF = aarliste().indexOf(S.aar - 1) >= 0;
  var rad = BOK.resultatposter.map(function (p) {
    var n = p[0], sum = n === 10 || n === 19 || n === 21; if (!sum && !r.post[n] && !f.post[n]) return '';
    var kost = kostpost(n), v = r.post[n] || 0;
    if (n === 19 && S.r.selskap.form === 'ENK') return ''; var navn = n === 21 && S.r.selskap.form === 'ENK' ? 'Årets resultat' : n === 21 ? (t < S.aar + '-12-31' ? 'Resultat så langt' : 'Årsresultat') : p[1];
    return '<tr class="' + (n === 21 ? 'slutt' : sum ? 'sum' : 'klikk') + '"' + (sum ? '' : ' data-post="R ' + n + '"') + '><td>' + (sum ? esc(navn) : '<button type="button" class="radknapp">' + esc(navn) + '</button>') + '</td><td class="tall">' + M.kr(kost ? -v : v) + '</td>' + (harF ? '<td class="tall dempet">' + M.kr(kost ? -(f.post[n] || 0) : f.post[n] || 0) + '</td>' : '') + '</tr>'; }).join('');
  var anslag = S.r.selskap.form === 'AS' && r.forSkatt > 0 && !r.skatt ? '<p class="dempet" style="margin-top:10px">Skatt er ikke ført ennå. Et grovt anslag er ' + kr(Math.round(r.forSkatt * BOK.satserFor(S.aar).skatt / 10000) * 100) + ' (' + BOK.satserFor(S.aar).skatt + ' prosent av resultatet). Det er ikke bokført.</p>' : '';
  return '<section class="kort"><div class="rad"><h3>Resultat</h3><span class="dempet">1.1.' + S.aar + ' til ' + M.dato(t) + '</span></div><table style="margin-top:8px"><thead><tr><th>Trykk på en linje for å se bilagene bak</th><th class="tall">' + S.aar + '</th>' + (harF ? '<th class="tall">' + (S.aar - 1) + '</th>' : '') + '</tr></thead><tbody>' + rad + '</tbody></table>' + anslag + '</section>' + kobleKort();
}
function visBalanse() {
  var t = tilDato(), b = M.balanse(S.r, t);
  function side(grupper, sum, navn, ekstra) {
    return '<section class="kort"><h3>' + navn + '</h3><table><tbody>' + grupper.map(function (g) {
      var l = g[2].filter(function (p) { return b.post[p[0]]; }), uds = g[0] === 'C.II' ? b.udisponertLinjer : []; if (!l.length && !uds.length) return '';
      return '<tr class="hode"><th colspan="2">' + esc(g[1]) + '</th></tr>' + l.map(function (p) { return '<tr class="klikk" data-post="B ' + p[0] + '"><td><button type="button" class="radknapp">' + esc(p[1]) + '</button></td><td class="tall">' + M.kr(b.post[p[0]]) + '</td></tr>'; }).join('') + uds.map(function (u) { return '<tr><td>' + esc(u.navn) + '</td><td class="tall">' + M.kr(u.belop) + '</td></tr>'; }).join('');
    }).join('') + '<tr class="slutt"><td>Sum ' + navn.toLowerCase() + '</td><td class="tall">' + M.kr(sum) + '</td></tr></tbody></table></section>';
  }
  return '<div class="rad" style="margin-bottom:12px"><span class="dempet">Per ' + M.dato(t) + '. Trykk på en linje for å se bilagene bak.</span><span class="merke ' + (b.eiendeler === b.sumEkGjeld ? 'ok">Balansen går opp' : 'feil">Balansen går ikke opp') + '</span></div><div class="balanse">' + side(BOK.balanseposter.filter(function (g) { return /^[AB]/.test(g[0]); }), b.eiendeler, 'Eiendeler') + side(BOK.balanseposter.filter(function (g) { return /^[CD]/.test(g[0]); }), b.sumEkGjeld, 'Egenkapital og gjeld') + '</div>'
    + ((b.post['D.III.6'] || 0) < 0 ? '<p class="dempet" style="margin-top:10px">Minus på skyldige offentlige avgifter betyr at dere har mva til gode.</p>' : '') + kobleKort();
}
// Koblingen til de tre regnskapssidene
function kobleKort() {
  if (S.lese || !KOB || !globalThis.HVRegnskap || S.modus !== 'forer') return '';
  var k = koblet(), st = KOB.status();
  if (k && !st.egne.length) return '<section class="kort koble"><h3>Koblet til «Lag regnskapet»</h3><p class="dempet">Tallene følger med til resultat, balanse og kontantstrøm hver gang du fører et bilag. Der får du forklaringer og Excel.</p><div class="rad venstre"><a class="lenke" href="/regnskap/resultat/">Resultat</a><a class="lenke" href="/regnskap/balanse/">Balanse</a><a class="lenke" href="/regnskap/kontantstrom/">Kontantstrøm</a><button type="button" class="lenke" data-gjor="koblefra">Koble fra</button></div></section>';
  return '<section class="kort koble"><h3>Vis tallene i «Lag regnskapet»</h3><p class="dempet">Fyller ut resultat, balanse og kontantstrøm på nettsiden med disse tallene, og holder dem oppdatert.</p>'
    + (st.egne.length ? '<div class="beskjed">Du har andre tall i ' + st.egne.join(' og ') + '. De blir erstattet og kan ikke hentes tilbake.</div>' : '')
    + '<button type="button" class="knapp" data-gjor="koble">' + (st.egne.length ? 'Erstatt tallene' : 'Fyll ut sidene') + '</button></section>';
}
function visMva() {
  var ut = ''; for (var t = 1; t <= 6; t++) { var m = M.mva(S.r, S.aar, t); if (!m.koder.length && !m.oppgjor.length && m.fra > idag()) continue;
    var lev = S.r.mvaLevert[S.aar + '-' + t];
    ut += '<section class="kort"><div class="rad"><h3>' + t + '. termin</h3><span>' + (m.oppgjor.length ? '<span class="merke ok">Gjort opp</span>' : m.koder.length ? '<span class="merke varsel">Ikke gjort opp</span>' : '') + (lev != null ? ' <span class="merke ok">Meldt ' + M.kr(lev) + '</span>' : '') + '</span></div><p class="dempet">' + M.dato(m.fra) + '–' + M.dato(m.til) + '. Lever og betal innen ' + M.dato(m.frist) + '.</p>'
      + (m.koder.length ? '<div class="rulle"><table style="margin-top:8px"><thead><tr><th>Kode</th><th class="tall">Grunnlag</th><th class="tall">Mva ut</th><th class="tall">Fradrag</th></tr></thead><tbody>' + m.koder.map(function (k) { return '<tr><td>' + k.kode + ' ' + esc(k.navn) + (k.ok ? '' : ' <span class="merke feil">Stemmer ikke</span>') + '</td><td class="tall">' + M.kr(k.grunnlag) + '</td><td class="tall">' + (k.ut ? M.kr(k.ut) : '') + '</td><td class="tall">' + (k.inn ? M.kr(k.inn) : '') + '</td></tr>'; }).join('') + '<tr class="slutt"><td>' + (m.melding >= 0 ? 'Å betale' : 'Til gode') + '</td><td></td><td></td><td class="tall">' + M.kr(Math.abs(m.melding)) + '</td></tr></tbody></table></div>' : '<p class="dempet">Ingen mva i terminen. Meldingen skal leveres likevel.</p>')
      + '<div class="rad" style="justify-content:flex-start;margin-top:12px">' + (m.koder.length ? '<button type="button" class="knapp" data-gjor="mvaopp" data-t="' + t + '">Gjør opp terminen</button>' : '') + '<button type="button" class="knapp" data-gjor="mvalev" data-t="' + t + '">' + (lev == null ? 'Marker som levert' : 'Endre levert beløp') + '</button></div></section>'; }
  return ut || '<section class="kort"><p class="dempet">Ingen mva-terminer i ' + S.aar + ' ennå.</p></section>';
}
function visKontroll() {
  var t = tilDato(), k = M.kontroller(S.r, t), b = M.balanse(S.r, t), av = S.r.avstemt.bank, e = S.r.selskap.form === 'AS' ? M.eierkrav(S.r, t) : null, reskK = M.reskontro(S.r, 'kunde', t).filter(function (x) { return x.saldo; }), reskL = M.reskontro(S.r, 'leverandor', t).filter(function (x) { return x.saldo; });
  var rt = function (l) { return l.length ? '<table><tbody>' + l.map(function (x) { return '<tr><td>' + esc(x.navn) + '</td><td class="tall">' + kr(x.saldo) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="dempet">Ingen åpne poster.</p>'; };
  var dager = []; for (var m = 1; m <= 12; m++) dager.push(new Date(Date.UTC(S.aar, m, 0)).toISOString().slice(0, 10));
  return '<section class="kort"><h3>Kontroller per ' + M.dato(t) + '</h3><p class="dempet">De finner feil i føringen og glemte steg. De ser ikke om et riktig beløp er ført på feil kostnad.</p><table style="margin-top:8px"><tbody>' + k.map(function (x) { return '<tr><td><span class="merke ' + (x.ok ? 'ok">I orden' : x.nivaa === 'stopp' ? 'feil">Feil' : 'varsel">Se på') + '</span></td><td>' + esc(x.navn) + '<br><span class="dempet">' + esc(x.tekst) + '</span></td></tr>'; }).join('') + '</tbody></table></section>'
    + '<section class="kort"><h3>Avstemming</h3><p class="dempet">Sammenlign med en fasit noen andre har laget.</p><div class="del"><h4>Bank</h4><label class="felt" for="bankfasit"><span>Saldo på kontoutskriften per ' + M.dato(t) + '</span><input id="bankfasit" class="belop" inputmode="decimal" value="' + (av && av.dato === t ? esc(M.kr(av.belop).replace(/ /g, ' ')) : '') + '"></label><div id="bankdiff">' + bankdiff(t) + '</div></div><div class="del"><h4>Kunder som skylder</h4>' + rt(reskK) + '</div><div class="del"><h4>Leverandører dere skylder</h4>' + rt(reskL) + '</div>'
    + (e ? '<div class="del"><h4>Eier og selskap</h4><p>Selskapet skylder eier eller ansatte ' + kr(-(b.saldo['2910'] || 0)) + '. Eieren skylder selskapet ' + kr(e.saldo) + (e.eldste ? ' (eldste uttak ' + M.dato(e.eldste) + ')' : '') + '.' + (e.utbytte ? ' <strong>' + kr(e.utbytte) + ' er trolig blitt skattepliktig utbytte.</strong>' : '') + '</p><p class="dempet">Ingen utenfor har fasiten her. Eieren må bekrefte hver post.</p></div>' : '') + '</section>'
    + '<section class="kort"><h3>Lås perioden</h3><p class="dempet">Etter låsing kan ingenting føres i perioden. ' + (S.r.lukketTil ? 'Låst til og med ' + M.dato(S.r.lukketTil) + '.' : 'Ingenting er låst.') + '</p><div class="rad" style="justify-content:flex-start;margin-top:10px"><select id="laasdato" class="knapp" aria-label="Lås til og med">' + dager.map(function (d) { return '<option value="' + d + '">' + M.dato(d) + '</option>'; }).join('') + '</select><button type="button" class="knapp" data-gjor="laas">Lås til og med</button>' + (S.r.lukketTil ? '<button type="button" class="knapp" data-gjor="aapne">Åpne igjen</button>' : '') + '</div>' + (S.r.logg.length ? '<ul class="punkt">' + S.r.logg.slice(-6).reverse().map(function (l) { return '<li class="dempet">' + esc(new Date(l.tid).toLocaleString('nb-NO')) + ': ' + esc(l.hva) + '</li>'; }).join('') + '</ul>' : '') + '</section>';
}
function bankdiff(t) { var av = S.r.avstemt.bank; if (!av || av.dato !== t) return ''; var b = M.balanse(S.r, t).saldo, bokf = (b['1920'] || 0) + (b['1950'] || 0), d = bokf - av.belop; return '<div class="beskjed ' + (d ? 'varsel' : 'ok') + '">Bokført ' + kr(bokf) + ', banken ' + kr(av.belop) + '. ' + (d ? 'Forskjellen er ' + kr(Math.abs(d)) + '. ' + (d > 0 ? 'Vi har ført noe banken ikke har, eller mangler en utbetaling.' : 'Banken har noe vi ikke har ført: gebyr, rente eller innbetaling.') : 'Det stemmer.') + '</div>'; }
function visData() {
  var s = S.r.selskap;
  return '<section class="kort"><h3>Ta ut data</h3><div class="rad" style="justify-content:flex-start;margin-top:12px"><button type="button" class="knapp" data-gjor="kundefil">Lag kundefil</button><button type="button" class="knapp" data-gjor="journal">Alle bilag (CSV)</button><button type="button" class="knapp" data-gjor="saldo">Saldobalanse (CSV)</button><button type="button" class="knapp" data-gjor="kopi">Sikkerhetskopi</button></div><p class="dempet" style="margin-top:8px">Kundefila er én HTML-fil kunden kan åpne i nettleseren. Den viser oversikt, resultat, balanse og bilag, og kan ikke endres i verktøyet.</p></section>'
    + '<section class="kort"><h3>Les inn sikkerhetskopi</h3><label class="felt" for="innfil"><span>Fil (.json)</span><input type="file" id="innfil" accept="application/json,.json"></label></section>'
    + '<section class="kort"><h3>Selskapet</h3><p class="dempet">' + esc(s.navn) + ', ' + s.form + ', start ' + M.dato(s.start) + ', ' + (s.mva ? 'mva-registrert' : 'ikke mva-registrert') + '. Tallene ligger bare i denne nettleseren.</p><div class="rad" style="justify-content:flex-start;margin-top:12px"><button type="button" class="knapp" data-gjor="nytt">Start nytt regnskap</button><button type="button" class="knapp" data-gjor="eksempel">Vis eksempelet</button></div></section>'
    + '<section class="kort"><h3>Dette er ikke et regnskapssystem</h3><p class="dempet">Verktøyet er til å øve, forstå og vise. Et ekte regnskap må blant annet oppbevares trygt i fem år, sikres mot endring og kunne leveres som SAF-T-fil. Er du bokføringspliktig, må du bruke et regnskapssystem eller en regnskapsfører.</p></section>';
}
// Kundens første skjerm: penger, hvem skylder oss, hvem skylder vi, tjener vi, avgifter
function visOversikt() {
  var t = tilDato(), b = M.balanse(S.r, t), r = M.resultat(S.r, S.aar + '-01-01', t), bro = M.kontantbro(S.r, t), p = function (n) { return b.post[n] || 0; };
  var avg = p('D.III.6'), sist = S.r.bilag.filter(function (x) { return M.aar(x.dato) === S.aar; }).sort(function (x, y) { return x.dato < y.dato ? 1 : -1; });
  return '<div class="tallrad"><button type="button" data-post="B B.IV"><span>Penger i bank og kasse</span><strong class="stor">' + hele(b.bank) + '</strong></button><button type="button" data-fane="resultat"><span>' + (r.aars >= 0 ? 'Overskudd' : 'Underskudd') + ' hittil i ' + S.aar + '</span><strong class="stor">' + hele(Math.abs(r.aars)) + '</strong></button><button type="button" data-post="B B.II.1"><span>Kunder skylder dere</span><strong class="stor">' + hele(p('B.II.1')) + '</strong></button><button type="button" data-post="B D.III.4"><span>Dere skylder leverandører</span><strong class="stor">' + hele(p('D.III.4')) + '</strong></button><button type="button" data-post="B D.III.6"><span>' + (avg < 0 ? 'Avgifter til gode' : 'Mva, trekk og avgift dere skylder') + '</span><strong class="stor">' + hele(Math.abs(avg)) + '</strong></button></div>'
    + '<div class="side2"><section class="kort"><h3>Hvorfor overskuddet ikke er det samme som penger i banken</h3><table style="margin-top:10px"><tbody><tr><td>Penger 1. januar ' + S.aar + '</td><td class="tall">' + M.kr(bro.start) + '</td></tr><tr><td>' + (bro.resultat >= 0 ? 'Overskudd' : 'Underskudd') + '</td><td class="tall">' + endr(bro.resultat) + '</td></tr>' + bro.linjer.map(function (l) { return '<tr><td>' + esc(l.navn) + '</td><td class="tall">' + endr(l.belop) + '</td></tr>'; }).join('') + '<tr class="slutt"><td>Penger ' + M.dato(t) + '</td><td class="tall">' + M.kr(bro.slutt) + '</td></tr></tbody></table></section>'
    + '<section class="kort"><h3>Hva er med i tallene</h3><ul class="punkt">' + medUtenfor(t, r, sist).map(function (x) { return '<li><span class="merke ' + (x[0] ? 'ok">Med' : 'varsel">Ikke med') + '</span> ' + esc(x[1]) + '</li>'; }).join('') + '</ul></section></div>'
    + '<section class="kort" style="margin-top:22px"><h3>Siste bilag</h3>' + (sist.length ? '<table><tbody>' + sist.slice(0, 6).map(function (x) { return '<tr class="klikk" data-bilag="' + x.nr + '"><td style="white-space:nowrap">' + M.dato(x.dato) + '</td><td><button type="button" class="radknapp">' + esc(x.tekst) + '</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="dempet">Ingen bilag ennå.</p>') + '</section>';
}
function medUtenfor(t, r, sist) {
  var ut = [], s = S.r.selskap, har = function (k) { return sist.some(function (b) { return b.linjer.some(function (l) { return l.konto === k; }); }); }, sal = M.saldoer(S.r, null, t);
  ut.push([sist.length > 0, sist.length ? 'Bilag til og med ' + M.dato(sist[0].dato) + '.' : 'Ingen bilag er ført i ' + S.aar + '.']);
  if (s.mva) { var mangler = []; for (var q = 1; q <= 6; q++) { var m = M.mva(S.r, S.aar, q); if (m.til < t && (m.ut || m.inn) && !m.oppgjor.length) mangler.push(q); } ut.push([!mangler.length, mangler.length ? 'Mva-oppgjør for termin ' + mangler.join(', ') + '.' : 'Mva er gjort opp for alle avsluttede terminer.']); }
  if (Object.keys(sal).some(function (k) { return /^1[12]/.test(k) && sal[k] > 0; })) ut.push([har('6000'), har('6000') ? 'Avskrivning på utstyr.' : 'Avskrivning på utstyr. Utstyret er derfor for høyt i balansen.']);
  if (sal['1400'] > 0) { var vt = sist.some(function (b) { return b.hendelse === 'vare'; }); ut.push([vt, vt ? 'Varetelling.' : 'Varetelling i år. Varekostnaden kan bli endret.']); }
  if (s.form === 'AS') ut.push([r.skatt !== 0, r.skatt ? 'Selskapsskatt.' : 'Selskapsskatt. Den føres ved årsslutt.']);
  else ut.push([false, 'Din egen skatt. Den er privat og står ikke i regnskapet.']);
  return ut;
}

// ── Fra tall til bilag: rapportlinje → konto → bilag → kvittering ───────
function lukkDlg() { S.stabel = []; dlg.close(); }
function aapne(x) { S.stabel.push(x); tegnDlg(); if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0; }
function tegnDlg() { var x = S.stabel[S.stabel.length - 1]; dlg.innerHTML = '<div class="dhode"><div>' + (S.stabel.length > 1 ? '<button type="button" class="lenke" data-gjor="tilbake">Tilbake</button>' : '') + '</div><button type="button" class="knapp" data-gjor="lukk">Lukk</button></div><div class="dinn">' + { post: dPost, felt: dFelt, konto: dKonto, bilag: dBilag, rett: dRett, nytt: dNytt, lev: dLev, aapne: dAapne, kvitt: dKvitt }[x.t](x) + '</div>'; }
function dPost(x) {
  var t = tilDato(), k, navn, sum = 0;
  if (x.post.charAt(0) === 'R') { var n = +x.post.slice(2); k = M.resultat(S.r, S.aar + '-01-01', t).kontoer[n] || []; navn = BOK.resultatposter.filter(function (p) { return p[0] === n; })[0][1]; }
  else { var b = M.balanse(S.r, t), q = x.post.slice(2); k = b.kontoer[q] || []; BOK.balanseposter.forEach(function (g) { g[2].forEach(function (p) { if (p[0] === q) navn = p[1]; }); }); }
  k.forEach(function (y) { sum += y.belop; });
  return '<h3 id="dlgtittel">' + esc(navn) + '</h3><p class="sti">' + (x.post.charAt(0) === 'R' ? 'Regnskapsloven § 6-1 nr. ' : 'Regnskapsloven § 6-2 ') + esc(x.post.slice(2)) + ', per ' + M.dato(t) + '</p><table style="margin-top:10px"><tbody>' + k.map(function (y) { return '<tr' + (y.nr ? ' class="klikk" data-konto="' + y.nr + '"' : '') + '><td>' + (y.nr ? '<button type="button" class="radknapp">' + y.nr + ' ' + esc(y.navn) + '</button>' : esc(y.navn)) + '</td><td class="tall">' + M.kr(y.belop) + '</td></tr>'; }).join('') + '<tr class="slutt"><td>Sum</td><td class="tall">' + M.kr(sum) + '</td></tr></tbody></table>';
}
// Kontoene bak et felt på resultat- eller balansesiden (lenkene «Bilag» der)
function dFelt(x) {
  var t = tilDato(), res = x.felt.indexOf('hv-rr-v2') === 0, sal = M.saldoer(S.r, res ? S.aar + '-01-01' : null, t), sum = 0, rad = '';
  KOB.kontoerFor(x.felt).forEach(function (nr) { var k = BOK.konto[nr], v = k.type === 'eiendel' || k.type === 'kostnad' ? sal[nr] || 0 : -(sal[nr] || 0); if (!v) return; sum += v; rad += '<tr class="klikk" data-konto="' + nr + '"><td><button type="button" class="radknapp">' + nr + ' ' + esc(k.navn) + '</button></td><td class="tall">' + M.kr(v) + '</td></tr>'; });
  if (x.felt === 'hv-balanse-v1:bEkOpp') M.udisponert(S.r, t).forEach(function (u) { if (!u.belop) return; sum += u.belop; rad += '<tr><td>' + (u.aar === S.aar ? 'Årets resultat så langt' : 'Resultat ' + u.aar + ', ikke disponert') + '</td><td class="tall">' + M.kr(u.belop) + '</td></tr>'; });
  return '<h3 id="dlgtittel">Kontoene bak tallet</h3><p class="sti">' + (res ? 'Resultatet ' + S.aar : 'Balansen per ' + M.dato(t)) + '. Trykk på en konto for å se bilagene.</p>' + (rad ? '<table><tbody>' + rad + '<tr class="slutt"><td>Sum</td><td class="tall">' + M.kr(sum) + '</td></tr></tbody></table>' : '<p class="dempet">Ingen bilag er ført her.</p>');
}
function dKonto(x) {
  var h = M.hovedbok(S.r, x.konto, S.aar + '-01-01', tilDato()), k = BOK.konto[x.konto], f = k.type === 'eiendel' || k.type === 'kostnad' ? 1 : -1;
  return '<h3 id="dlgtittel">' + esc(k.navn) + '</h3><p class="sti">Konto ' + k.nr + '</p><div class="rulle"><table style="margin-top:10px"><thead><tr><th>Dato</th><th>Bilag</th><th class="tall">Endring</th><th class="tall">Saldo</th></tr></thead><tbody>' + (h.ib ? '<tr><td></td><td>Fra før</td><td></td><td class="tall">' + M.kr(h.ib * f) + '</td></tr>' : '') + h.rader.map(function (y) { return '<tr class="klikk" data-bilag="' + y.nr + '"><td style="white-space:nowrap">' + M.dato(y.dato) + '</td><td><button type="button" class="radknapp">' + y.nr + ' ' + esc(y.tekst) + (y.part ? ' <span class="dempet">' + esc(M.partNavn(S.r, y.part)) + '</span>' : '') + '</button></td><td class="tall">' + endr(y.belop * f, true) + '</td><td class="tall">' + M.kr(y.saldo * f) + '</td></tr>'; }).join('') + '<tr class="slutt"><td></td><td>Saldo</td><td></td><td class="tall">' + M.kr(h.ub * f) + '</td></tr></tbody></table></div>';
}
function dBilag(x) {
  var b = S.r.bilag[x.nr - 1], av = M.reversertAv(S.r, b.nr), h = BOK.hendelse[b.hendelse];
  return '<h3 id="dlgtittel">' + esc(b.tekst) + '</h3><p class="sti">Bilag ' + b.nr + ', ' + M.dato(b.dato) + (h ? ', «' + esc(h.navn) + '»' : '') + '</p>' + (av ? '<div class="beskjed varsel">Dette bilaget er nullet av <button type="button" class="lenke" data-bilag="' + av + '">bilag ' + av + '</button>.</div>' : '') + (b.reverserer ? '<div class="beskjed varsel">Nuller <button type="button" class="lenke" data-bilag="' + b.reverserer + '">bilag ' + b.reverserer + '</button>. Grunn: ' + esc(b.grunn) + '</div>' : b.grunn && b.hendelse === 'fri' ? '<p class="dempet">Grunn: ' + esc(b.grunn) + '</p>' : '')
    + '<div class="del">' + linjetabell(b.linjer) + '</div><div class="del"><h4>Kvittering og faktura</h4>' + (b.vedlegg.length ? '<div class="vedlegg">' + b.vedlegg.map(function (v, i) { return '<figure>' + (/^data:image/.test(v.data) ? '<button type="button" class="radknapp" style="padding:0" data-gjor="kvitt" data-nr="' + b.nr + '" data-i="' + i + '"><img src="' + esc(v.data) + '" alt="' + esc(v.navn) + '"></button>' : '') + '<figcaption>' + (/^data:image/.test(v.data) ? esc(v.navn) : '<button type="button" class="lenke" data-gjor="lastned" data-nr="' + b.nr + '" data-i="' + i + '">Last ned ' + esc(v.navn) + '</button>') + '</figcaption></figure>'; }).join('') + '</div>' : '<p class="dempet">Ingen vedlegg.' + (h && h.bilag ? ' Skal dokumenteres med: ' + esc(h.bilag) : '') + '</p>') + '</div>'
    + '<p class="dempet" style="margin-top:14px">Bokført ' + esc(new Date(b.laget).toLocaleString('nb-NO')) + ', ' + esc(b.regel) + '.</p>'
    + (S.modus === 'forer' && !S.lese && !av && !b.reverserer ? '<div class="rad" style="justify-content:flex-start;margin-top:14px"><button type="button" class="knapp" data-gjor="rett" data-nr="' + b.nr + '" data-slag="retting">Rett feil</button>' + (['palopt', 'opparb', 'fri'].indexOf(b.hendelse) >= 0 ? '<button type="button" class="knapp" data-gjor="rett" data-nr="' + b.nr + '" data-slag="snu">Snu i ny periode</button>' : '') + '</div>' : '');
}
function dKvitt(x) { var v = S.r.bilag[x.nr - 1].vedlegg[x.i]; return '<h3 id="dlgtittel">' + esc(v.navn) + '</h3><img src="' + esc(v.data) + '" alt="' + esc(v.navn) + '" style="display:block;width:100%;max-width:560px;margin:12px auto 0;height:auto">'; }
function dRett(x) { var b = S.r.bilag[x.nr - 1], d = x.slag === 'snu' ? M.plussDager(b.dato, 1) : !S.r.lukketTil || b.dato > S.r.lukketTil ? b.dato : idag(); return '<h3 id="dlgtittel">' + (x.slag === 'snu' ? 'Snu' : 'Rett') + ' bilag ' + x.nr + '</h3><p class="dempet">Bilaget blir stående. Et nytt bilag nuller hele føringen. ' + (x.slag === 'snu' ? '' : 'Før det riktige etterpå.') + '</p><label class="felt" for="rdato"><span>Dato</span><input type="date" id="rdato" value="' + d + '"></label><label class="felt" for="rgrunn"><span>Hvorfor?</span><input id="rgrunn" value="' + (x.slag === 'snu' ? 'Periodisering snus i ny periode' : '') + '"></label><div id="rfeil"></div><button type="button" class="knapp hoved" style="margin-top:14px" data-gjor="rettok" data-nr="' + x.nr + '" data-slag="' + x.slag + '">Bokfør</button>'; }
function dNytt() { return '<h3 id="dlgtittel">Start nytt regnskap</h3>' + (S.r.eksempel || !S.r.bilag.length ? '' : '<div class="beskjed varsel">Regnskapet du har nå blir erstattet. Last ned sikkerhetskopi først.</div>') + '<label class="felt" for="nnavn"><span>Navn</span><input id="nnavn"></label><label class="felt" for="nform"><span>Selskapsform</span><select id="nform"><option value="AS">Aksjeselskap (AS)</option><option value="ENK">Enkeltpersonforetak</option></select></label><label class="felt" for="nstart"><span>Regnskapet starter</span><input type="date" id="nstart" value="' + M.aar(idag()) + '-01-01"></label><label class="kryss"><input type="checkbox" id="nmva"><span>Registrert i Merverdiavgiftsregisteret</span></label><div id="nfeil"></div><button type="button" class="knapp hoved" style="margin-top:14px" data-gjor="nyttok">Start</button>'; }
function dLev(x) { var m = M.mva(S.r, S.aar, x.termin); return '<h3 id="dlgtittel">Levert melding, ' + x.termin + '. termin</h3><p class="dempet">Skriv beløpet på kvitteringen fra Skatteetaten. Kontrollen sier fra hvis bokføringen viser noe annet. Minus hvis dere hadde til gode.</p><label class="felt" for="levbel"><span>Fastsatt merverdiavgift (kr)</span><input id="levbel" class="belop" inputmode="text" value="' + esc(M.kr(m.melding).replace(/ /g, ' ')) + '"></label><button type="button" class="knapp hoved" style="margin-top:14px" data-gjor="levok" data-t="' + x.termin + '">Lagre</button>'; }
function dAapne() { return '<h3 id="dlgtittel">Åpne låst periode</h3><p class="dempet">Åpningen blir logget.</p><label class="felt" for="agrunn"><span>Hvorfor?</span><input id="agrunn"></label><div id="afeil"></div><button type="button" class="knapp hoved" style="margin-top:14px" data-gjor="aapneok">Åpne</button>'; }

// ── Filer ───────────────────────────────────────────────────────────────
function lastNed(navn, type, innhold) { var u = URL.createObjectURL(innhold instanceof Blob ? innhold : new Blob([innhold], { type: type })), a = document.createElement('a'); a.href = u; a.download = navn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); }
function filnavn(s) { return S.r.selskap.navn.toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, '') + '-' + s; }
function tilBlob(d) { var p = d.split(','), t = /^data:([^;,]+)/.exec(d)[1], b = /;base64/.test(p[0]) ? atob(p[1]) : decodeURIComponent(p.slice(1).join(',')); if (!/;base64/.test(p[0])) return new Blob([b], { type: t }); var a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Blob([a], { type: t }); }
// Bilder krympes, så de får plass i nettleserens lager
function lesFil(f) {
  return new Promise(function (ok, feil) {
    var l = new FileReader(); l.onerror = function () { feil(new Error('Fikk ikke lest fila.')); };
    l.onload = function () {
      if (f.type === 'application/pdf') { if (f.size > 500000) return feil(new Error(f.name + ' er over 500 kB. Prototypen tar ikke så store PDF-er.')); return ok({ navn: f.name, type: f.type, data: l.result }); }
      var b = new Image(); b.onerror = function () { feil(new Error(f.name + ' kan ikke leses som bilde.')); };
      b.onload = function () { var s = Math.min(1, 1400 / Math.max(b.width, b.height)), c = document.createElement('canvas'); c.width = Math.round(b.width * s); c.height = Math.round(b.height * s); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(b, 0, 0, c.width, c.height); ok({ navn: f.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.72) }); };
      b.src = l.result;
    };
    l.readAsDataURL(f);
  });
}
// Én HTML-fil med tallene og all kode innebygd, så kunden kan åpne den uten nettsiden.
function kundefil() {
  var css = document.querySelector('link[data-bok]'), js = Array.prototype.slice.call(document.querySelectorAll('script[data-bok]'));
  var hent = function (u) { return fetch(u).then(function (x) { if (!x.ok) throw new Error(u); return x.text(); }); };
  var tag = function (t, i, x) { return '<' + t + i + '>' + x + '</' + t + '>'; };
  Promise.all([hent(css.href)].concat(js.map(function (x) { return hent(x.src); }))).then(function (f) {
    var d = JSON.stringify(Object.assign({}, S.r, { logg: [], avstemt: {} })).replace(/</g, '\u003c');
    lastNed(filnavn('kunde-' + tilDato() + '.html'), 'text/html', '<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Regnskap</title>' + tag('style', '', f[0]) + '</head><body class="bf-fil"><main class="bf" id="bf"><div id="bf-app"></div><p class="dempet">Laget med bokføringsverktøyet på hverdagsverktøy.no. Ikke et offisielt regnskap.</p></main><div class="bf bunn" id="bf-bunn"></div><dialog class="bf" id="bf-dlg" aria-labelledby="dlgtittel"></dialog><div id="bf-status" class="bf skjult" role="status" aria-live="polite"></div>'
      + tag('script', ' type="application/json" id="kundedata"', d) + f.slice(1).map(function (k) { return tag('script', '', k); }).join('') + '</body></html>');
  }).catch(function () { toast('Fikk ikke laget kundefila. Sjekk at du er på nett, og prøv igjen.'); });
}

// ── Hendelser på skjermen ───────────────────────────────────────────────
function skriv(el, html) { if ($(el)) $(el).innerHTML = html; }
var GJOR = {
  bytt: function () { nyForing(); S.visFeil = false; tegn(); }, bokfor: bokfor, frilinje: function () { S.felt.linjer.push({}); oppdater(true); }, fjernfil: function (b) { S.vedlegg.splice(+b.dataset.i, 1); oppdater(true); },
  tilbake: function () { S.stabel.pop(); tegnDlg(); }, lukk: function () { lukkDlg(); },
  kvitt: function (b) { aapne({ t: 'kvitt', nr: +b.dataset.nr, i: +b.dataset.i }); }, lastned: function (b) { var v = S.r.bilag[+b.dataset.nr - 1].vedlegg[+b.dataset.i]; lastNed(v.navn, v.type, tilBlob(v.data)); },
  rett: function (b) { aapne({ t: 'rett', nr: +b.dataset.nr, slag: b.dataset.slag }); },
  rettok: function (b) { var f = M.reverser(S.r, +b.dataset.nr, $('rdato').value, $('rgrunn').value, b.dataset.slag), u = f.feil.length ? { ok: false, feil: f.feil } : M.bokfor(S.r, f); if (!u.ok) { skriv('rfeil', u.feil.map(function (t) { return '<div class="beskjed feil">' + esc(t) + '</div>'; }).join('')); return; } S.r = u.regnskap; lagreOgSynk(); lukkDlg(); tegn(); toast('Bilag ' + u.bilag.nr + ' nuller bilag ' + b.dataset.nr + '.'); },
  mvaopp: function (b) { S.fane = 'for'; velg('mvaopp'); S.felt.termin = S.aar + '-' + b.dataset.t; S.dato = M.terminDatoer(S.aar, +b.dataset.t).til; oppdater(true); },
  mvalev: function (b) { aapne({ t: 'lev', termin: +b.dataset.t }); }, levok: function (b) { var n = M.ore($('levbel').value); if (isNaN(n)) { toast('Beløpet er ikke et gyldig tall.'); return; } var m = Object.assign({}, S.r.mvaLevert); m[S.aar + '-' + b.dataset.t] = n; S.r = Object.assign({}, S.r, { mvaLevert: m }); logg('Mva-melding ' + b.dataset.t + '. termin ' + S.aar + ' registrert som levert: ' + M.kr(n)); lagre(); lukkDlg(); tegn(); },
  laas: function () { var d = $('laasdato').value, f = M.kontroller(S.r, d).filter(function (k) { return !k.ok && k.nivaa === 'stopp'; }); if (f.length) { toast('Kan ikke låse: ' + f[0].navn.toLowerCase() + ' er ikke i orden.'); return; } if (S.r.lukketTil && d < S.r.lukketTil) { toast('Perioden er låst lenger fram. Bruk «Åpne igjen».'); return; } S.r = Object.assign({}, S.r, { lukketTil: d }); logg('Låst til og med ' + M.dato(d)); lagre(); tegn(); toast('Låst til og med ' + M.dato(d) + '.'); },
  aapne: function () { aapne({ t: 'aapne' }); }, aapneok: function () { var g = $('agrunn').value.trim(); if (!g) { skriv('afeil', '<div class="beskjed feil">Skriv en grunn.</div>'); return; } var d = S.r.lukketTil; S.r = Object.assign({}, S.r, { lukketTil: null }); logg('Åpnet perioden som var låst til ' + M.dato(d) + '. Grunn: ' + g); lagre(); lukkDlg(); tegn(); },
  nytt: function () { aapne({ t: 'nytt' }); }, nyttok: function () { var n = $('nnavn').value.trim(), d = $('nstart').value; if (!n || !M.erDato(d)) { skriv('nfeil', '<div class="beskjed feil">Fyll inn navn og startdato.</div>'); return; } S.r = M.nytt({ navn: n, form: $('nform').value, mva: $('nmva').checked, start: d }); S.aar = M.aar(d); S.dato = idag() >= d ? idag() : d; S.modus = 'forer'; S.fane = 'for'; nyForing(); lagreOgSynk(); lukkDlg(); tegn(); },
  eksempel: function () { if (!S.r.eksempel && S.r.bilag.length && !confirm('Regnskapet du har nå blir erstattet av eksempelet. Har du lastet ned sikkerhetskopi?')) return; S.r = BOK.eksempel(); S.aar = 2026; nyForing(); lagreOgSynk(); tegn(); toast('Eksempelet er lagt inn på nytt.'); },
  journal: function () { lastNed(filnavn('bilag.csv'), 'text/csv;charset=utf-8', M.journalCsv(S.r)); }, saldo: function () { lastNed(filnavn('saldobalanse-' + S.aar + '.csv'), 'text/csv;charset=utf-8', M.saldobalanseCsv(S.r, S.aar)); }, koble: function () { var u = KOB.send(S.r, tilDato(), true); tegn(); toast(u.ok ? 'Resultat, balanse og kontantstrøm er fylt ut.' : u.feil); },
  koblefra: function () { KOB.kobleFra(); tegn(); toast('Koblet fra. Tallene på sidene blir stående.'); }, kopi: function () { lastNed(filnavn('kopi-' + idag() + '.json'), 'application/json', JSON.stringify(S.r)); }, kundefil: kundefil
};
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-gjor],[data-bilag],[data-konto],[data-post],[data-h],[data-fane],[data-modus]'); if (!t || !t.closest('.bf')) return; var d = t.dataset;
  if (d.gjor) GJOR[d.gjor](t); else if (d.bilag) aapne({ t: 'bilag', nr: +d.bilag }); else if (d.konto) aapne({ t: 'konto', konto: d.konto }); else if (d.post) aapne({ t: 'post', post: d.post }); else if (d.h) velg(d.h, d.type);
  else if (d.fane) { S.fane = d.fane; S.visFeil = false; if (d.fane === 'for') nyForing(); tegn(); tilTopp(); } else if (d.modus) { S.modus = d.modus; S.fane = FANER[d.modus][0][0]; nyForing(); tegn(); }
});
dlg.addEventListener('close', function () { S.stabel = []; });
dlg.addEventListener('click', function (e) { if (e.target === dlg) lukkDlg(); });
rot.addEventListener('submit', function (e) { e.preventDefault(); bokfor(); });
function endret(e) {
  var t = e.target, d = t.dataset || {}; if (!t.closest || !t.closest('.bf')) return;
  if (t.id === 'sok') { S.sok = t.value; $('liste').innerHTML = liste(); return; }
  if (t.id === 'aar') { if (e.type === 'change') { S.aar = +t.value; tegn(); } return; }
  if (t.id === 'bankfasit') { var n = M.ore(t.value), a = Object.assign({}, S.r.avstemt); if (t.value.trim() === '' || isNaN(n)) delete a.bank; else a.bank = { dato: tilDato(), belop: n }; S.r = Object.assign({}, S.r, { avstemt: a }); lagre(); skriv('bankdiff', bankdiff(tilDato())); return; }
  if (t.id === 'f-fil') { if (e.type !== 'change') return; Promise.all(Array.prototype.map.call(t.files, lesFil)).then(function (v) { S.vedlegg = S.vedlegg.concat(v); oppdater(true); }, function (f) { toast(f.message); t.value = ''; }); return; }
  if (t.id === 'innfil') { if (e.type !== 'change' || !t.files[0]) return; t.files[0].text().then(function (x) { var r; try { r = JSON.parse(x); } catch (z) { toast('Fila er ikke gyldig.'); return; } var f = M.gyldig(r); if (f) { toast(f); return; } if (!S.r.eksempel && S.r.bilag.length && !confirm('Regnskapet du har nå blir erstattet. Fortsette?')) return; S.r = r; logg('Sikkerhetskopi lest inn'); var l = aarliste(); S.aar = l[l.length - 1]; lagreOgSynk(); tegn(); toast('Regnskapet er lest inn.'); }); return; }
  if (!S.h) return;
  if (t.id === 'f-dato') { S.dato = t.value; oppdater(); } else if (t.id === 'f-tekst') { S.tekst = t.value; } else if (t.id === 'f-grunn') { S.grunn = t.value; oppdater(); }
  else if (d.fri) { var p = d.fri.split('.'); S.felt.linjer[+p[0]][p[1]] = t.value; oppdater(p[1] === 'konto' && e.type === 'change'); }
  else if (d.felt) { S.felt[d.felt] = t.type === 'checkbox' ? t.checked : t.value; if (S.auto && d.felt in S.auto) S.auto[d.felt] = false; if (t.tagName === 'SELECT' || d.felt === 'part') Object.keys(S.auto || {}).forEach(function (k) { if (S.auto[k]) S.felt[k] = undefined; }); oppdater(); }
}
document.addEventListener('input', endret); document.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT' || e.target.type === 'file' || e.target.type === 'date') endret(e); });
// Adresser utenfra: #kunde, #fane=balanse og #felt=hv-balanse-v1:bOmlBank (fra «Bilag» på regnskapssidene)
function fraHash() {
  var h = '', f, k;
  if (S.lese) return;
  try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
  if (h === 'kunde') { S.modus = 'kunde'; S.fane = 'oversikt'; nyForing(); tegn(); }
  else if (/^fane=/.test(h)) { f = h.slice(5); if (FANER.forer.some(function (x) { return x[0] === f; })) { S.modus = 'forer'; S.fane = f; nyForing(); tegn(); } }
  else if (/^felt=hv-(rr-v2|balanse-v1):[\w/]+$/.test(h)) { k = koblet(); if (k && aarliste().indexOf(k.aar) >= 0) S.aar = k.aar; S.modus = 'forer'; S.fane = h.indexOf('rr-v2') > 0 ? 'resultat' : 'balanse'; nyForing(); tegn(); aapne({ t: 'felt', felt: h.slice(5) }); }
}
window.addEventListener('hashchange', fraHash);
start();
})();
