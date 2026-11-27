// Hendelsene: «hva skjedde?» i vanlig språk, og føringen det gir.
// Mva-koden velges av hendelsen, aldri av brukeren, og står på grunnlagslinjen.
(function () {
var BOK = globalThis.HVBok = globalThis.HVBok || {};
var M = BOK.motor;

function D(konto, belop, x) { return Object.assign({ konto: konto, belop: belop }, x); }
function K(konto, belop, x) { return Object.assign({ konto: konto, belop: -belop }, x); }
function prosent(belop, sats) { return Math.round(belop * sats / 100); }
// Beløp inkludert mva delt i grunnlag og mva. Øreforskjellen havner i mva-en.
function avInkl(inkl, sats) { var mva = Math.round(inkl * sats / (100 + sats)); return { netto: inkl - mva, mva: mva }; }
function avEks(eks, sats) { return { netto: eks, mva: prosent(eks, sats) }; }
var kr = function (o) { return M.kr(o) + ' kr'; };

// ── Valglister ──────────────────────────────────────────────────────────
BOK.salgstyper = [
  { id: '25', navn: 'Varer og tjenester, 25 % mva', kode: '3', konto: '3000' },
  { id: '15', navn: 'Mat og alkoholfri drikke som ikke serveres, 15 % mva', kode: '31', konto: '3010' },
  { id: '12', navn: 'Overnatting, persontransport, kino og lignende, 12 % mva', kode: '33', konto: '3010' },
  { id: 'utland', navn: 'Eksport: varer sendt ut av Norge, eller tjenester til bruk i utlandet', kode: '52', konto: '3110' },
  { id: 'fritatt', navn: 'Fritatt for mva, for eksempel bøker', kode: '5', konto: '3100' },
  { id: 'unntatt', navn: 'Utenfor mva-loven, for eksempel helse og undervisning', kode: '6', konto: '3200' }
];
BOK.kjopstyper = [
  { id: 'vare', navn: 'Varer for videresalg', konto: '4000', kode: '1', ord: 'innkjøp lager' },
  { id: 'mat', navn: 'Matvarer for videresalg', konto: '4010', kode: '11', ord: 'innkjøp råvarer' },
  { id: 'under', navn: 'Underleverandør og innleie', konto: '4500', kode: '1', ord: 'konsulent vikar' },
  { id: 'leie0', navn: 'Husleie uten mva', konto: '6300', kode: '0', ord: 'lokale kontor' },
  { id: 'leie1', navn: 'Husleie med mva', konto: '6300', kode: '1', ord: 'lokale kontor', merk: 'Bare når utleieren står med mva på fakturaen (frivillig registrert).' },
  { id: 'strom', navn: 'Strøm og oppvarming', konto: '6340', kode: '1', ord: '' },
  { id: 'renhold', navn: 'Renhold, renovasjon og avfall', konto: '6395', kode: '1', ord: 'vask søppel' },
  { id: 'vann', navn: 'Kommunalt vann og avløp', konto: '6395', kode: '11', ord: 'kommunale avgifter gebyr vannverk kloakk', merk: 'Vann fra vannverk og avløp har 15 % mva. Har fakturaen flere satser, fører du hver del for seg.' },
  { id: 'program', navn: 'Programvare og abonnement fra Norge', konto: '6400', kode: '1', ord: 'lisens regnskapssystem' },
  { id: 'smaa', navn: 'Småutstyr og mindre innkjøp', konto: '6500', kode: '1', ord: 'pc mobil stol verktøy skjerm', smaa: true },
  { id: 'pc', navn: 'Større kjøp: PC og kontormaskiner', konto: '1280', kode: '1', ord: 'server printer', eiendel: true },
  { id: 'maskin', navn: 'Større kjøp: maskiner og utstyr', konto: '1205', kode: '1', ord: '', eiendel: true },
  { id: 'inventar', navn: 'Større kjøp: inventar', konto: '1206', kode: '1', ord: 'møbler innredning', eiendel: true },
  { id: 'varebil', navn: 'Varebil klasse 2 eller lastebil', konto: '1238', kode: '1', ord: 'kjøretøy', eiendel: true, merk: 'Varebil klasse 1 og personbil gir ikke fradrag for mva (mval. § 8-4).' },
  { id: 'personbil', navn: 'Personbil eller varebil klasse 1', konto: '1207', kode: '0', ord: 'kjøretøy', eiendel: true, bil: true, merk: 'Ingen fradrag for mva (mval. § 8-4).' },
  { id: 'vedlikehold', navn: 'Reparasjon og vedlikehold (ikke personbil)', konto: '6695', kode: '1', ord: '' },
  { id: 'raad', navn: 'Regnskap, revisor, advokat og rådgivning', konto: '6700', kode: '1', ord: 'honorar' },
  { id: 'kontor', navn: 'Kontorrekvisita, telefon og internett', konto: '6800', kode: '1', ord: 'mobil papir bredbånd' },
  { id: 'porto', navn: 'Porto og frakt', konto: '6800', kode: '1', ord: 'frimerker pakke posten' },
  { id: 'drivP', navn: 'Personbil: drivstoff, lading, verksted, dekk, bom og parkering', konto: '7000', kode: '0', ord: 'bensin diesel service reparasjon', bil: true, merk: 'Ingen fradrag for mva på personbil (mval. § 8-4).' },
  { id: 'drivV', navn: 'Varebil klasse 2: drivstoff, lading og verksted', konto: '7000', kode: '1', ord: 'bensin diesel' },
  { id: 'bilf', navn: 'Bilforsikring og bilavgift', konto: '7040', kode: '0', ord: 'trafikkforsikring', bil: true },
  { id: 'reise', navn: 'Overnatting, fly, tog og drosje i Norge', konto: '7165', kode: '13', ord: 'reise hotell taxi', merk: 'Frokost på hotellregningen har 25 % mva uten fradrag. Før den for seg. Reiser til og fra utlandet er uten mva: kryss av for det.' },
  { id: 'reklame', navn: 'Markedsføring', konto: '7330', kode: '1', ord: 'annonse nettside logo profilering' },
  { id: 'bevert', navn: 'Enkel bevertning av kunde', konto: '7350', kode: '0', ord: 'lunsj møtemat kaffe', merk: 'Aldri fradrag for mva (mval. § 8-3). Skattefradrag bare for beskjeden servering i arbeidstiden eller ved forhandlinger, uten brennevin. Over {bevertning} kr per person på serveringssted faller hele fradraget bort. Skriv hvem som var med og hvorfor.' },
  { id: 'repr', navn: 'Representasjon (middag, alkohol, underholdning)', konto: '7360', enk: '2060', kode: '0', ord: 'restaurant middag', merk: 'Verken fradrag for mva eller skatt. I enkeltpersonforetak føres det som privat uttak.' },
  { id: 'matans', navn: 'Mat og velferd til ansatte', konto: '5900', kode: '0', ord: 'overtidsmat julebord kaffe', merk: 'Ingen fradrag for mva (mval. § 8-3).' },
  { id: 'gaveans', navn: 'Gave til ansatt', konto: '5900', kode: '0', ord: 'julegave', merk: 'Ingen fradrag for mva (mval. § 8-3).' },
  { id: 'gaveliten', navn: 'Oppmerksomhet eller reklamegjenstand til kunde', konto: '7420', kode: '0', ord: 'blomster profil gave', merk: 'Skattefradrag bare for reklamegjenstander med firmanavn laget i større antall, og for enkel oppmerksomhet. Begge høyst {kundegave} kr. Koster den mer, faller hele fradraget bort: velg «Annen gave til kunde».' },
  { id: 'gavekunde', navn: 'Annen gave til kunde', konto: '7420', enk: '2060', kode: '0', ord: 'julegave vin', merk: 'Verken fradrag for mva eller skatt. I enkeltpersonforetak føres den som privat uttak.' },
  { id: 'konting', navn: 'Kontingent til yrkes- eller næringsorganisasjon', konto: '7400', kode: '0', ord: 'medlemskap fagforening', merk: 'Skattefradrag bare for arbeidsgiverforening og landsomfattende yrkes- og næringsorganisasjon, og bare opp til en grense (skatteloven § 6-19).' },
  { id: 'forsikring', navn: 'Forsikring', konto: '7500', kode: '0', ord: '' },
  { id: 'bankgebyr', navn: 'Bankgebyr og purregebyr', konto: '7770', kode: '0', ord: 'gebyr kortavgift purring inkasso' },
  { id: 'morarente', navn: 'Forsinkelsesrente til leverandør', konto: '8150', kode: '0', ord: 'rente purring inkasso' },
  { id: 'bot', navn: 'Bot, tvangsmulkt eller tilleggsskatt', konto: '7780', enk: '2060', kode: '0', ord: 'fartsbot parkeringsbot forsinkelsesgebyr', merk: 'Ingen skattefradrag.' },
  { id: 'annet', navn: 'Annet til driften', konto: '7700', kode: '1', ord: 'diverse' }
];
var BETALT_SALG = [
  { v: 'faktura', n: 'Ikke betalt, sendt på faktura' }, { v: '1920', n: 'Betalt til bank' },
  { v: '1579', n: 'Kort eller Vipps, kommer senere' }, { v: '1900', n: 'Kontant' }
];
function betaltKjop(ctx) {
  return [{ v: '1920', n: 'Betalt fra bank' }, { v: 'faktura', n: 'Ikke betalt, har fått faktura' }, { v: '2380', n: 'Kredittkort eller kassekreditt' }, { v: '1900', n: 'Kontant fra kassen' },
    { v: 'privat', n: ctx.r.selskap.form === 'AS' ? 'Eier eller ansatt la ut privat' : 'Betalt privat' }];
}
function kontovalg(liste) { return liste.map(function (n) { return { v: n, n: BOK.konto[n].navn }; }); }
function eiendeler(ctx) {
  var s = M.saldoer(ctx.r, null, ctx.dato);
  return BOK.kontoplan.filter(function (k) { return /^1[0-2]/.test(k.nr) && k.nr !== '1070' && (s[k.nr] || 0) > 0; }).map(function (k) { return { v: k.nr, n: k.navn + ' (' + kr(s[k.nr]) + ')' }; });
}
function kostnadsvalg(ctx) { return BOK.kontoplan.filter(function (k) { return /^[4-7]/.test(k.nr) && k.type === 'kostnad' && !k.kontra && !/^(40|42|6000|7[89]|783)/.test(k.nr.slice(0, 4)) && (k.form === 'begge' || k.form === ctx.r.selskap.form); }).map(function (k) { return { v: k.nr, n: k.navn }; }); }
// Alt som er kjøpt på en konto, uten bilag som er nullet
function kostpris(r, konto) { var t = 0; r.bilag.forEach(function (b) { if (!b.reverserer && !M.reversertAv(r, b.nr)) b.linjer.forEach(function (l) { if (l.konto === konto && l.belop > 0) t += l.belop; }); }); return t; }
// Fordelingsplaner: bilag som er betalt eller fakturert for flere måneder, og hva som gjenstår
function planer(ctx, hendelse, bruk, konto) {
  return ctx.r.bilag.filter(function (b) { return b.hendelse === hendelse && b.felt && +b.felt.mnd > 1 && (hendelse !== 'kjop' || b.felt.fordel) && !M.reversertAv(ctx.r, b.nr); }).map(function (b) {
    var tot = 0, brukt = 0, antall = 0;
    b.linjer.forEach(function (l) { if (l.konto === konto) tot += Math.abs(l.belop); });
    ctx.r.bilag.forEach(function (x) { if (x.hendelse === bruk && x.felt && String(x.felt.plan) === String(b.nr) && !M.reversertAv(ctx.r, x.nr)) { antall++; x.linjer.forEach(function (l) { if (l.konto === konto) brukt += Math.abs(l.belop); }); } });
    return { b: b, tot: tot, rest: tot - brukt, mnd: +b.felt.mnd, antall: antall };
  }).filter(function (p) { return p.rest > 0; });
}
function planvalg(liste) { return liste.map(function (p) { return { v: String(p.b.nr), n: 'Bilag ' + p.b.nr + ': ' + p.b.tekst + ' (igjen ' + kr(p.rest) + ')' }; }); }
// Siste måned tar resten, så det ikke blir stående igjen noen øre
function maaneddel(p) { return p.antall + 1 >= p.mnd ? p.rest : Math.min(p.rest, Math.round(p.tot / p.mnd)); }

// Pensjon som er ført, men ikke betalt
function aapenPensjon(r) { var t = 0; r.bilag.forEach(function (b) { if ((b.hendelse === 'otp' || b.hendelse === 'otpbet') && !M.reversertAv(r, b.nr)) b.linjer.forEach(function (l) { if (l.konto === '2990') t -= l.belop; }); }); return t; }

// Felt som går igjen
// Uten mva-registrering teller bare salg som er omfattet av mva-loven, mot grensen for registrering (mval. § 2-1)
function OMF(c) { return { id: 'omf', navn: 'Hva slags salg er det?', type: 'valg', valg: [{ v: 'ja', n: 'Vanlig salg (teller mot mva-grensen)' }, { v: 'nei', n: 'Utenfor mva-loven, for eksempel helse og undervisning' }], vis: function () { return !c.r.selskap.mva; } }; }
function salgskonto(c, f) { return c.r.selskap.mva ? '3000' : f && f.omf === 'nei' ? '3200' : '3205'; }
var KUNDE = { id: 'part', navn: 'Kunde', type: 'part', part: 'kunde' }, LEV = { id: 'part', navn: 'Leverandør', type: 'part', part: 'leverandor' };
function belopfelt(navn, hint, std) { return { id: 'belop', navn: navn || 'Beløp', type: 'belop', hint: hint || '', std: std }; }
function enkel(id, gruppe, navn, x, debet, kredit, forklar) {
  return Object.assign({ id: id, gruppe: gruppe, navn: navn, felt: function () { return [belopfelt(x.belopnavn, x.hint, x.std)]; },
    bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D(typeof debet === 'function' ? debet(c) : debet, b), K(typeof kredit === 'function' ? kredit(c) : kredit, b)], forklaring: forklar(b, c) }; } }, x);
}
var G = { inn: 'Penger inn', ut: 'Kjøp og regninger', eier: 'Eier og selskap', lonn: 'Lønn', bank: 'Bank og lån', mva: 'Mva og skatt', slutt: 'Måned og årsslutt', fag: 'For deg som kan debet og kredit' };
BOK.grupper = [G.inn, G.ut, G.eier, G.lonn, G.bank, G.mva, G.slutt, G.fag];

// ── Katalogen ───────────────────────────────────────────────────────────
BOK.hendelser = [

// Penger inn
{ id: 'salg', gruppe: G.inn, navn: 'Jeg solgte noe', ord: 'faktura salg kasse vipps kort eksport', bilag: 'Salgsfaktura med nummer, dato, partene, hva som er solgt, levering, beløp, forfall og mva. Sendes senest en måned etter levering.',
  felt: function (c) { return [
    { id: 'type', navn: 'Hva ble solgt?', type: 'valg', valg: BOK.salgstyper.map(function (t) { return { v: t.id, n: t.navn }; }), vis: function () { return c.r.selskap.mva; } }, OMF(c),
    belopfelt('Beløp'), { id: 'inkl', navn: 'Beløpet er', type: 'valg', valg: [{ v: 'eks', n: 'uten mva' }, { v: 'inkl', n: 'med mva' }], vis: function (f) { return c.r.selskap.mva && BOK.mvakoder[BOK.salgstyper.filter(function (t) { return t.id === (f.type || '25'); })[0].kode].sats; } },
    { id: 'betalt', navn: 'Hvordan ble det betalt?', type: 'valg', valg: BETALT_SALG },
    Object.assign({}, KUNDE, { vis: function (f) { return (f.betalt || 'faktura') === 'faktura'; } })]; },
  bygg: function (f, c) {
    var t = BOK.salgstyper.filter(function (x) { return x.id === (f.type || '25'); })[0], b = c.belop('belop'), v = [];
    var mot = f.betalt === 'faktura' ? '1500' : f.betalt, part = mot === '1500' ? { part: c.part('kunde', f.part) } : {};
    if ((mot === '1900' || mot === '1579') && b) v.push('Betaler kunden ved levering med kort, Vipps eller kontanter, er det kontantsalg. Over ' + kr(c.s.kasse * 100) + ' uten mva i året må du ha kassasystem (bokføringsloven § 10 a, bokføringsforskriften § 5-4-1). Nettsalg og fakturasalg regnes ikke med.');
    if (!c.r.selskap.mva) {
      var teller = f.omf === 'nei' ? 0 : M.registreringssalg(c.r, c.dato) + b, gr = c.s.registrering * 100;
      if (teller > gr) v.push('Salget siste tolv måneder blir ' + kr(teller) + '. Du skal registreres i Merverdiavgiftsregisteret når grensen på ' + kr(gr) + ' er passert. Salget som passerer grensen, skal ha mva: krediter fakturaen og send den på nytt når du er registrert.');
      else if (teller > gr * 0.8) v.push('Salget siste tolv måneder blir ' + kr(teller) + '. Grensen for mva-registrering er ' + kr(gr) + '.');
      return { linjer: [D(mot, b, part), K(salgskonto(c, f), b)], varsler: v, forklaring: 'Salget er ' + kr(b) + '. Det er ingen mva fordi virksomheten ikke er registrert.' };
    }
    var sats = BOK.mvakoder[t.kode].sats, p = sats ? (f.inkl === 'inkl' ? avInkl(b, c.s.mva[sats]) : avEks(b, c.s.mva[sats])) : { netto: b, mva: 0 };
    var brutto = p.netto + p.mva;
    if (t.id === 'unntatt') v.push('Har dere både salg utenfor mva-loven og salg med mva, kan dere bare trekke fra mva for den avgiftspliktige delen (mval. § 8-2).');
    return { linjer: [D(mot, brutto, part), K(t.konto, p.netto, { mva: t.kode }), K('2700', p.mva, { avg: t.kode })], varsler: v,
      forklaring: (mot === '1500' ? 'Kunden skylder dere ' : mot === '1579' ? 'Dere venter på ' : 'Dere får inn ') + kr(brutto) + '. ' + (p.mva ? 'Av det er ' + kr(p.mva) + ' mva som skal videre til staten. ' : '') + 'Salget er ' + kr(p.netto) + '.' };
  } },
{ id: 'innbet', gruppe: G.inn, navn: 'En kunde betalte fakturaen', ord: 'innbetaling betalt', bilag: 'Bankutskrift og fakturanummer.',
  felt: function (c) { return [Object.assign({}, KUNDE, { bare: true }), belopfelt('Beløp i banken', '', function (f) { return c.saldoPart('kunde', f.part); })]; },
  bygg: function (f, c) { var b = c.belop('belop'), skyldt = c.saldoPart('kunde', f.part) || 0; return { linjer: [D('1920', b), K('1500', b, { part: c.part('kunde', f.part) })], varsler: b > skyldt ? ['Kunden skylder bare ' + kr(skyldt) + '. Er det betalt to ganger, eller mangler en faktura?'] : [], forklaring: 'Kravet på kunden blir til penger i banken. Resultatet endres ikke, for salget ble ført da fakturaen ble sendt.' }; } },
{ id: 'kredit', gruppe: G.inn, navn: 'Jeg ga kunden kreditnota', ord: 'retur avslag kreditnota', bilag: 'Kreditnota med henvisning til fakturaen.',
  felt: function (c) { return [{ id: 'type', navn: 'Hva gjaldt salget?', type: 'valg', valg: BOK.salgstyper.map(function (t) { return { v: t.id, n: t.navn }; }), vis: function () { return c.r.selskap.mva; } }, OMF(c), belopfelt('Beløp uten mva'), KUNDE]; },
  bygg: function (f, c) { var t = BOK.salgstyper.filter(function (x) { return x.id === (f.type || '25'); })[0], b = c.belop('belop'), sats = c.r.selskap.mva && BOK.mvakoder[t.kode].sats, mva = sats ? prosent(b, c.s.mva[sats]) : 0;
    return { linjer: [D(c.r.selskap.mva ? t.konto : salgskonto(c, f), b, c.r.selskap.mva ? { mva: t.kode } : {}), D('2700', mva, { avg: t.kode }), K('1500', b + mva, { part: c.part('kunde', f.part) })], forklaring: 'Salget går ned med ' + kr(b) + ', og kunden skylder ' + kr(b + mva) + ' mindre.' }; } },
{ id: 'forskudd', gruppe: G.inn, navn: 'Kunden betalte på forhånd', ord: 'forskudd', bilag: 'Bankutskrift og avtale. Ikke salgsfaktura med mva før levering.',
  felt: function () { return [belopfelt('Beløp i banken')]; },
  bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D('1920', b), K('2900', b)], forklaring: 'Dere har fått ' + kr(b) + ', men skylder kunden varen eller jobben. Det blir salg først når dere leverer.' }; } },
{ id: 'lever', gruppe: G.inn, navn: 'Jeg leverte det kunden hadde betalt på forhånd', ord: 'forskudd levert', bilag: 'Salgsfaktura ved levering.',
  felt: function (c) { return [OMF(c), belopfelt('Beløp i alt', c.r.selskap.mva ? 'Med mva. Gjelder salg med 25 % mva' : '', function () { return -c.saldo('2900'); })]; },
  bygg: function (f, c) { var b = c.belop('belop'), p = c.r.selskap.mva ? avInkl(b, c.s.mva.hoy) : { netto: b, mva: 0 }; return { linjer: [D('2900', b), K(salgskonto(c, f), p.netto, c.r.selskap.mva ? { mva: '3' } : {}), K('2700', p.mva, { avg: '3' })], varsler: b > -c.saldo('2900') ? ['Forskuddet dere har stående er bare ' + kr(-c.saldo('2900')) + '.'] : [], forklaring: 'Forskuddet blir til salg på ' + kr(p.netto) + '. Ingen nye penger kommer inn nå.' }; } },
{ id: 'abo', gruppe: G.inn, navn: 'Jeg sendte faktura for flere måneder framover', ord: 'abonnement årsfaktura forskuddsfakturert', bilag: 'Salgsfaktura som viser perioden.',
  felt: function (c) { return [OMF(c), belopfelt('Beløp uten mva', c.r.selskap.mva ? 'Gjelder salg med 25 % mva' : ''), { id: 'mnd', navn: 'Antall måneder', type: 'tall', std: '12', hint: 'Høyst 12. Bare abonnement, leie, persontransport, servering og lignende kan faktureres på forhånd' }, KUNDE]; },
  bygg: function (f, c) { if (c.tall('mnd') > 12) c.feil.push('Faktura på forhånd kan gjelde høyst ett år (bokføringsforskriften § 5-2-6).'); var b = c.belop('belop'), m = c.r.selskap.mva, mva = m ? prosent(b, c.s.mva.hoy) : 0, gj = c.r.selskap.form === 'AS' ? '2970' : '2900';
    return { linjer: [D('1500', b + mva, { part: c.part('kunde', f.part) }), K(gj, b, m ? { mva: '3' } : {}), K('2700', mva, { avg: '3' })], forklaring: 'Mva skal betales for hele fakturaen nå. Salget på ' + kr(b) + ' fordeles på månedene med «Fordel forskuddsfakturert salg».' }; } },
{ id: 'gebyr', gruppe: G.inn, navn: 'Jeg krevde purregebyr eller forsinkelsesrente', ord: 'purring inkasso rente', bilag: 'Purrebrev eller renteberegning.',
  felt: function (c) { return [{ id: 'slag', navn: 'Hva kreves?', type: 'valg', valg: [{ v: '3900', n: 'Purregebyr' }, { v: '8050', n: 'Forsinkelsesrente' }] }, belopfelt('Beløp', '', function (f) { return (f.slag || '3900') === '3900' ? c.s.purregebyr * 100 : null; }), KUNDE]; },
  bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D('1500', b, { part: c.part('kunde', f.part) }), K(f.slag === '8050' && c.r.selskap.form === 'ENK' ? '3900' : f.slag, b, { mva: '7' })], varsler: f.slag === '3900' ? [(b > c.s.purregebyr * 100 ? 'Dette er over grensen. ' : '') + 'Høyst ' + kr(c.s.purregebyr * 100) + ' per skriftlig purring, sendt tidligst 14 dager etter forfall. Er kunden en bedrift, kan dere i stedet kreve standardkompensasjon (forsinkelsesrenteloven § 3 a).'] : [], forklaring: 'Purregebyr og renter er ikke mva-pliktig (mval. § 4-1).' }; } },
{ id: 'tilskudd', gruppe: G.inn, navn: 'Jeg fikk offentlig tilskudd', ord: 'støtte innovasjon norge', bilag: 'Tilskuddsbrev og bankutskrift.', felt: function () { return [belopfelt('Beløp i banken')]; },
  bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D('1920', b), K('3400', b, { mva: '7' })], varsler: ['Er vilkårene i tilskuddsbrevet ikke oppfylt ennå, eller gjelder det en investering, skal det ikke inntektsføres nå.'], forklaring: 'Tilskuddet er inntekt på ' + kr(b) + ' uten mva.' }; } },
{ id: 'renteinn', gruppe: G.inn, navn: 'Jeg fikk renter i banken', ord: 'renteinntekt', bilag: 'Bankens renteoppgave.', felt: function () { return [belopfelt('Beløp')]; }, bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D('1920', b), K('8050', b)], forklaring: 'Renten er finansinntekt.' }; } },
{ id: 'tap', gruppe: G.inn, navn: 'Kunden kan ikke betale', ord: 'tap på krav konkurs', bilag: 'Dokumentasjon på at vilkåret er oppfylt: purringer, inkasso eller konkursmelding.',
  felt: function (c) { return [Object.assign({}, KUNDE, { bare: true }), belopfelt('Beløp med mva', 'Uten purregebyr og renter', function (f) { return c.saldoPart('kunde', f.part); }), { id: 'sats', navn: 'Mva på salget', type: 'valg', valg: [{ v: 'hoy', n: '25 %' }, { v: 'middels', n: '15 %' }, { v: 'lav', n: '12 %' }, { v: 'ingen', n: 'Ingen mva' }], vis: function () { return c.r.selskap.mva; } },
    { id: 'vilkar', navn: 'Hvorfor er det tapt?', type: 'valg', valg: [{ v: '', n: 'Velg' }, { v: 'inkasso', n: 'Inkasso eller tvangsinndrivelse har vært forgjeves' }, { v: 'konkurs', n: 'Konkurs, gjeldsordning eller avvikling, og det er klart at boet ikke dekker kravet' }, { v: '6mnd', n: 'Seks måneder over forfall, minst tre purringer og rimelig innsats for å kreve inn' }, { v: 'annet', n: 'Helt klart at kunden ikke kan betale' }] }]; },
  bygg: function (f, c) { var b = c.belop('belop'), s = c.r.selskap.mva && f.sats !== 'ingen' ? f.sats || 'hoy' : null, p = s ? avInkl(b, c.s.mva[s]) : { netto: b, mva: 0 }, kode = { hoy: '1', middels: '11', lav: '13' }[s];
    if (!f.vilkar) c.feil.push('Velg hvorfor kravet er tapt.');
    return { linjer: [D('7830', p.netto, s ? { mva: kode, spes: 'tap' } : {}), D('2710', p.mva, { avg: kode, spes: 'tap' }), K('1500', b, { part: c.part('kunde', f.part) })], grunn: f.vilkar, varsler: ['Bare når kunden ikke kan betale (mval. § 4-7). Er dere uenige om varen eller prisen, bruk kreditnota.'], forklaring: 'Kravet slettes. ' + kr(p.netto) + ' blir kostnad' + (p.mva ? ', og ' + kr(p.mva) + ' mva får dere tilbake' : '') + '.' }; } },
{ id: 'kortopp', gruppe: G.inn, navn: 'Kort- eller Vipps-oppgjøret kom i banken', ord: 'vipps kort innløser oppgjør', bilag: 'Oppgjørsrapport fra kortselskapet eller Vipps.',
  felt: function (c) { return [belopfelt('Beløp i banken'), { id: 'gebyr', navn: 'Gebyr som er trukket', type: 'belop', std: 0 }]; },
  bygg: function (f, c) { var b = c.belop('belop'), g = c.belop('gebyr', true); return { linjer: [D('1920', b), D('7770', g, { mva: '0' }), K('1579', b + g)], varsler: b + g > c.saldo('1579') ? ['Bare ' + kr(c.saldo('1579')) + ' er ført som salg på kort og Vipps. Mangler et salg?'] : [], forklaring: 'Pengene flyttes fra «på vei» til bank.' + (g ? ' Gebyret på ' + kr(g) + ' er kostnad.' : '') }; } },

// Kjøp og regninger
{ id: 'kjop', gruppe: G.ut, navn: 'Jeg kjøpte noe', ord: 'kvittering faktura regning utlegg kjøp', bilag: 'Faktura eller kvittering. Over 1 000 kr i butikk må kjøperen stå på den, eller firmaets kort må være brukt. Skriv formålet når det ikke er opplagt.',
  felt: function (c) { return [
    { id: 'type', navn: 'Hva ble kjøpt?', type: 'valg', valg: [{ v: '', n: 'Velg' }].concat(BOK.kjopstyper.map(function (t) { return { v: t.id, n: t.navn }; })) },
    belopfelt('Beløp du betalte (med mva)'), { id: 'betalt', navn: 'Hvordan ble det betalt?', type: 'valg', valg: betaltKjop(c) },
    Object.assign({}, LEV, { vis: function (f) { return f.betalt === 'faktura'; } }),
    { id: 'bilag', navn: 'Jeg har faktura eller kvittering', type: 'kryss', std: true },
    { id: 'utenmva', navn: 'Selgeren har ikke mva på fakturaen', type: 'kryss', std: false, vis: function () { return c.r.selskap.mva; } },
    { id: 'billig', navn: 'Hver gave koster høyst ' + c.s.reklame + ' kr med mva', type: 'kryss', std: false, vis: function (f) { return c.r.selskap.mva && f.type === 'gaveliten'; } },
    { id: 'fordel', navn: 'Gjelder flere måneder framover', type: 'kryss', std: false, vis: function (f) { var t = BOK.kjopstyper.filter(function (x) { return x.id === f.type; })[0]; return t && !t.eiendel && /^[67]/.test(t.konto); } },
    { id: 'mnd', navn: 'Antall måneder', type: 'tall', std: '12', vis: function (f) { return f.fordel; } }]; },
  bygg: function (f, c) {
    var t = BOK.kjopstyper.filter(function (x) { return x.id === f.type; })[0], b = c.belop('belop'), v = [];
    if (!t) { c.feil.push('Velg hva som ble kjøpt.'); return { linjer: [] }; }
    var konto = c.r.selskap.form === 'ENK' && t.enk ? t.enk : t.konto, kode = t.id === 'gaveliten' && f.billig ? '1' : t.kode;
    if (!c.r.selskap.mva || f.utenmva) kode = '0';
    if (kode !== '0' && f.bilag === false) { kode = '0'; v.push('Uten bilag får dere ikke trukket fra mva (mval. § 15-10). Kostnaden kan også bli nektet i skatten.'); }
    else if (f.bilag === false) v.push('Alle føringer skal ha bilag (bokføringsloven § 10).');
    if (f.betalt === '1900' && b >= c.s.kontant * 100) { kode = '0'; v.push('Kontant betaling på ' + kr(c.s.kontant * 100) + ' eller mer gir ikke fradrag for mva (mval. § 8-8), og normalt ikke skattefradrag.'); }
    else if (f.betalt === '1900' && kode !== '0') v.push('Flere kontantbetalinger for samme kjøp regnes samlet mot grensen på ' + kr(c.s.kontant * 100) + '.');
    var sats = BOK.mvakoder[kode].sats, p = sats ? avInkl(b, c.s.mva[sats]) : { netto: b, mva: 0 };
    if (t.merk) v.push(t.merk.replace(/\{(\w+)\}/g, function (_, n) { return M.kr(c.s[n] * 100); }));
    if (t.bil && c.r.selskap.form === 'ENK') v.push('Bruker du privat bil inntil ' + c.s.enkKm.toLocaleString('nb-NO') + ' km i året i jobben, skal du ikke føre bilkostnadene. Velg «Jeg kjørte egen bil i jobben».');
    if (t.id === 'kontor' && c.r.selskap.form === 'ENK') v.push('Bare næringsdelen av telefon og nett gir fradrag for mva (mval. § 8-2). Privat bruk føres tilbake ved årsslutt.');
    if (t.smaa && p.netto >= c.s.smautstyr * 100) v.push('Beløpet er ' + kr(c.s.smautstyr * 100) + ' eller mer. Varer utstyret minst tre år, skal det i balansen: velg et av valgene som begynner med «Større kjøp».');
    if (t.eiendel && p.netto < c.s.smautstyr * 100 && b) v.push('Under ' + kr(c.s.smautstyr * 100) + ' kan det føres rett som kostnad: velg «Småutstyr og mindre innkjøp».');
    var fordel = f.fordel && /^[67]/.test(konto) && +f.mnd > 1;
    var mot = f.betalt === 'faktura' ? '2400' : f.betalt === 'privat' ? (c.r.selskap.form === 'AS' ? '2910' : '2061') : f.betalt || '1920';
    return { linjer: [D(fordel ? '1571' : konto, p.netto, { mva: kode }), D('2710', p.mva, { avg: kode }), K(mot, b, mot === '2400' ? { part: c.part('leverandor', f.part) } : {})], varsler: v, tekst: t.navn, ekstraFelt: { kostkonto: konto },
      forklaring: (konto === '2060' ? 'Dette gir ikke fradrag og føres som privat uttak. ' : t.eiendel ? 'Utstyret er verdt ' + kr(p.netto) + ' i balansen og blir kostnad litt etter litt med avskrivning. ' : fordel ? 'Kostnaden på ' + kr(p.netto) + ' fordeles på ' + f.mnd + ' måneder. ' : 'Kostnaden er ' + kr(p.netto) + '. ')
        + (p.mva ? kr(p.mva) + ' er mva dere trekker fra. ' : sats === null && c.r.selskap.mva && b && konto !== '2060' ? 'Ingen mva trekkes fra' + (t.eiendel || fordel ? '. ' : ', så hele beløpet er kostnad. ') : '')
        + (mot === '2400' ? 'Dere skylder leverandøren ' + kr(b) + '.' : mot === '2910' ? 'Selskapet skylder den som la ut ' + kr(b) + '.' : mot === '2061' ? 'Det du betalte privat blir egenkapital i foretaket.' : '') };
  } },
{ id: 'betlev', gruppe: G.ut, navn: 'Jeg betalte en regning fra en leverandør', ord: 'betaling faktura', bilag: 'Bankutskrift og faktura.',
  felt: function (c) { return [Object.assign({}, LEV, { bare: true }), belopfelt('Beløp på fakturaen', 'I kroner, slik den ble ført', function (f) { return c.saldoPart('leverandor', f.part); }), { id: 'trukket', navn: 'Trukket i banken', type: 'belop', hint: 'Bare hvis kursen ga et annet beløp', std: '' }]; },
  bygg: function (f, c) { var b = c.belop('belop'), tr = f.trukket === '' || f.trukket == null ? b : c.belop('trukket'), diff = tr - b, skyldt = c.saldoPart('leverandor', f.part) || 0;
    return { linjer: [D('2400', b, { part: c.part('leverandor', f.part) }), diff > 0 ? D('8160', diff) : K('8060', -diff), K('1920', tr)], varsler: b > skyldt ? ['Dere skylder bare ' + kr(skyldt) + '. Mangler fakturaen, eller betales den to ganger?'] : [], forklaring: 'Gjelden går ned og pengene går ut. Kostnaden ble ført da fakturaen kom.' + (diff ? ' Kursforskjellen på ' + kr(Math.abs(diff)) + ' er ' + (diff > 0 ? 'valutatap.' : 'valutagevinst.') : '') }; } },
{ id: 'levkredit', gruppe: G.ut, navn: 'Leverandøren ga meg kreditnota', ord: 'retur kreditnota', bilag: 'Kreditnota fra leverandøren.',
  felt: function (c) { return [{ id: 'type', navn: 'Hva gjaldt kjøpet?', type: 'valg', valg: [{ v: '', n: 'Velg' }].concat(BOK.kjopstyper.map(function (t) { return { v: t.id, n: t.navn }; })) }, belopfelt('Beløp med mva'), LEV, { id: 'utenmva', navn: 'Kjøpet var uten mva', type: 'kryss', std: false, vis: function () { return c.r.selskap.mva; } }]; },
  bygg: function (f, c) { var t = BOK.kjopstyper.filter(function (x) { return x.id === f.type; })[0], b = c.belop('belop'); if (!t) { c.feil.push('Velg hva kjøpet gjaldt.'); return { linjer: [] }; }
    var kode = c.r.selskap.mva && !f.utenmva ? t.kode : '0', sats = BOK.mvakoder[kode].sats, p = sats ? avInkl(b, c.s.mva[sats]) : { netto: b, mva: 0 }, konto = c.r.selskap.form === 'ENK' && t.enk ? t.enk : t.konto;
    return { linjer: [D('2400', b, { part: c.part('leverandor', f.part) }), K(konto, p.netto, { mva: kode }), K('2710', p.mva, { avg: kode })], forklaring: 'Kostnaden går ned med ' + kr(p.netto) + ', og dere skylder ' + kr(b) + ' mindre.' }; } },
{ id: 'utland', gruppe: G.ut, navn: 'Jeg kjøpte en digital tjeneste fra utlandet', ord: 'sky google microsoft annonser omvendt avgift programvare', bilag: 'Faktura fra den utenlandske selgeren, uten norsk mva.',
  felt: function (c) { return [{ id: 'hva', navn: 'Hva gjelder det?', type: 'valg', valg: [{ v: '6421', n: 'Sky, programvare og lisenser' }, { v: '7330', n: 'Annonser og markedsføring' }, { v: '6700', n: 'Rådgivning' }] }, belopfelt('Beløp på fakturaen, i kroner'), { id: 'betalt', navn: 'Hvordan ble det betalt?', type: 'valg', valg: betaltKjop(c) }, Object.assign({}, LEV, { vis: function (f) { return f.betalt === 'faktura'; } }),
    { id: 'kvartal', navn: 'Tjenester fra utlandet er til sammen over ' + c.s.utlandKvartal.toLocaleString('nb-NO') + ' kr uten mva i kvartalet', type: 'kryss', std: false, vis: function () { return !c.r.selskap.mva; } }]; },
  bygg: function (f, c) { var b = c.belop('belop'), mot = f.betalt === 'faktura' ? '2400' : f.betalt === 'privat' ? (c.r.selskap.form === 'AS' ? '2910' : '2061') : f.betalt || '1920', mva = prosent(b, c.s.mva.hoy), x = mot === '2400' ? { part: c.part('leverandor', f.part) } : {}, konto = f.hva || '6421';
    if (c.r.selskap.mva) return { linjer: [D(konto, b, { mva: '86' }), K(mot, b, x), D('2710', mva, { avg: '86' }), K('2700', mva, { avg: '86' })], forklaring: 'Dere regner selv ut ' + kr(mva) + ' i mva og trekker den fra i samme melding. Kostnaden er ' + kr(b) + '.' };
    if (f.kvartal) return { linjer: [D(konto, b, { mva: '87' }), D(konto, mva), K(mot, b, x), K('2700', mva, { avg: '87' })], varsler: ['Alle kjøpene i kvartalet skal være med. Bruk «Omvendt mva for kvartalet» når kvartalet er slutt.'], forklaring: 'Dere må selv regne ut og betale ' + kr(mva) + ' i mva, uten fradrag. Kostnaden blir ' + kr(b + mva) + '.' };
    return { linjer: [D(konto, b, { mva: '0' }), K(mot, b, x)], forklaring: 'Under grensen per kvartal skal dere ikke beregne mva. Kostnaden er ' + kr(b) + '.' }; } },
{ id: 'import', gruppe: G.ut, navn: 'Jeg kjøpte varer fra utlandet', ord: 'import vareimport', bilag: 'Faktura fra selgeren og tolldeklarasjonen. Frakt føres på samme måte.', form: 'begge',
  felt: function (c) { return [{ id: 'hva', navn: 'Hva ble kjøpt?', type: 'valg', valg: [{ v: '4040', n: 'Varer for videresalg' }, { v: '6500', n: 'Utstyr under ' + c.s.smautstyr.toLocaleString('nb-NO') + ' kr' }, { v: '1205', n: 'Maskiner og utstyr over grensen' }, { v: '1280', n: 'PC og kontormaskiner over grensen' }] }, belopfelt('Beløp på fakturaen, i kroner'), { id: 'innf', navn: 'Mva og toll betalt ved innførsel', type: 'belop', std: 0, hint: 'Til Tolletaten eller speditøren. Blir en del av kostnaden', vis: function () { return !c.r.selskap.mva; } }, { id: 'betalt', navn: 'Hvordan ble det betalt?', type: 'valg', valg: betaltKjop(c) }, Object.assign({}, LEV, { vis: function (f) { return f.betalt === 'faktura'; } })]; },
  bygg: function (f, c) { var b = c.belop('belop'), reg = c.r.selskap.mva, inn = reg ? 0 : c.belop('innf', true), konto = f.hva || '4040', mot = f.betalt === 'faktura' ? '2400' : f.betalt === 'privat' ? (c.r.selskap.form === 'AS' ? '2910' : '2061') : f.betalt || '1920';
    return { linjer: [D(konto, b + inn, reg ? { mva: '21' } : { mva: '0' }), K(mot, b, mot === '2400' ? { part: c.part('leverandor', f.part) } : {}), K('1920', inn)], varsler: reg ? ['Før også «Tolldeklarasjonen er klar» når deklarasjonen kommer, så mva-en kommer med.'] : [], forklaring: reg ? 'Kjøpet koster ' + kr(b) + '. Mva-en regnes av verdien i tolldeklarasjonen.' : 'Kjøpet koster ' + kr(b + inn) + '. Uten mva-registrering er mva og toll ved innførsel en del av kostnaden.' }; } },
{ id: 'importmva', gruppe: G.ut, navn: 'Tolldeklarasjonen er klar (mva på import)', ord: 'innførsel toll deklarasjon', bilag: 'Tolldeklarasjon med dato og grunnlag.', kreverMva: true,
  felt: function () { return [belopfelt('Grunnlag for mva', 'Tollverdi (varer og frakt til Norge) pluss toll og særavgifter, slik deklarasjonen viser. Gjelder 25 % mva')]; },
  bygg: function (f, c) { var b = c.belop('belop'), mva = prosent(b, c.s.mva.hoy); return { linjer: [D('4080', b, { mva: '81' }), K('4081', b), D('2710', mva, { avg: '81' }), K('2700', mva, { avg: '81' })], forklaring: 'Dere regner selv ut ' + kr(mva) + ' i mva og trekker den fra i samme melding. Grunnlaget føres inn og ut, så resultatet endres ikke.' }; } },

// Eier og selskap
{ id: 'utleggtilb', gruppe: G.eier, form: 'AS', navn: 'Selskapet betalte tilbake et utlegg', ord: 'utlegg refusjon', bilag: 'Utleggsskjema med kvitteringer og bankutskrift.', felt: function (c) { return [belopfelt('Beløp', '', function () { return -c.saldo('2910'); })]; },
  bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D('2910', b), K('1920', b)], varsler: b > -c.saldo('2910') ? ['Selskapet skylder bare ' + kr(-c.saldo('2910')) + '. Resten blir et krav på den som får pengene.'] : [], forklaring: 'Gjelden til den som la ut, går ned.' }; } },
{ id: 'eiertok', gruppe: G.eier, form: 'AS', navn: 'Eieren brukte selskapets penger privat', ord: 'privat firmakort uttak lån til eier', bilag: 'Kvittering og styrets vurdering etter aksjeloven § 8-7.', felt: function () { return [belopfelt('Beløp'), { id: 'fra', navn: 'Betalt med', type: 'valg', valg: [{ v: '1920', n: 'Bank' }, { v: '2380', n: 'Kredittkort' }] }]; },
  bygg: function (f, c) { var b = c.belop('belop'), n = M.eierkrav(c.r, c.dato).saldo + b, g = c.s.eierlan; return { linjer: [D('1565', b), K(f.fra || '1920', b)], varsler: [(n >= g.belop * 100 ? 'Eieren skylder nå ' + kr(n) + '. Hele beløpet kan bli skattlagt som utbytte.' : 'Eieren skylder nå ' + kr(n) + '. Betal tilbake innen ' + g.dager + ' dager, ellers skattlegges det som utbytte.') + ' Dette gjelder personlige aksjonærer og nær familie. Aksjeloven § 8-7 krever i tillegg fri egenkapital og betryggende sikkerhet.'], forklaring: 'Dette er et lån fra selskapet til eieren, ikke en kostnad.' }; } },
enkel('eiertilb', G.eier, 'Eieren betalte tilbake til selskapet', { form: 'AS', ord: 'tilbakebetaling', bilag: 'Bankutskrift.', std: function () { return null; } }, '1920', '1565', function () { return 'Kravet på eieren går ned.'; }),
enkel('eierlaan', G.eier, 'Eieren lånte penger til selskapet', { form: 'AS', ord: 'lån fra eier', bilag: 'Låneavtale og bankutskrift.' }, '1920', '2250', function (b) { return 'Selskapet får ' + kr(b) + ' og skylder det samme. Det er ikke inntekt.'; }),
enkel('eierlaantilb', G.eier, 'Selskapet betalte tilbake lån til eieren', { form: 'AS', ord: 'avdrag eierlån', bilag: 'Bankutskrift.' }, '2250', '1920', function () { return 'Gjelden til eieren går ned. Det er ikke en kostnad.'; }),
{ id: 'kapital', gruppe: G.eier, form: 'AS', navn: 'Aksjekapitalen ble betalt inn', ord: 'stiftelse aksjekapital overkurs', bilag: 'Stiftelsesdokument eller protokoll, og bekreftelse på innskuddet.', felt: function () { return [belopfelt('Aksjekapital'), { id: 'overkurs', navn: 'Overkurs', type: 'belop', std: 0 }]; },
  bygg: function (f, c) { var b = c.belop('belop'), o = c.belop('overkurs', true); return { linjer: [D('1920', b + o), K('2000', b), K('2020', o)], varsler: c.saldo('2000') ? ['Ved kapitalforhøyelse kan pengene normalt ikke brukes før den er registrert i Foretaksregisteret (aksjeloven § 10-13).'] : [], forklaring: 'Eierens innskudd er egenkapital, ikke inntekt.' }; } },
{ id: 'stift', gruppe: G.eier, form: 'AS', navn: 'Selskapet betalte stiftelsesutgifter', ord: 'gebyr brønnøysund registrering', bilag: 'Gebyr eller faktura, og stiftelsesdokumentet som sier at selskapet dekker den.', felt: function () { return [belopfelt('Beløp')]; },
  bygg: function (f, c) { var b = c.belop('belop'), o = Math.min(b, Math.max(0, -c.saldo('2020'))); return { linjer: [D('2020', o), D('2030', b - o), K('1920', b)], varsler: ['Skattefradraget må huskes i skattemeldingen, fordi utgiften ikke står i resultatet.', 'Selskapet kan bare dekke det stiftelsesdokumentet sier, og høyst det som er betalt inn (aksjeloven § 2-5).'], forklaring: 'Stiftelsesutgifter trekkes fra i innskutt egenkapital. De er ikke kostnad i regnskapet (NRS 8 pkt. 5.1.2).' }; } },
{ id: 'utbytte', gruppe: G.eier, form: 'AS', navn: 'Utbytte ble utbetalt', ord: 'utbytte aksjonær', bilag: 'Protokoll fra generalforsamlingen og bankutskrift.', felt: function (c) { return [belopfelt('Beløp', '', function () { return -c.saldo('2800'); })]; },
  bygg: function (f, c) { var b = c.belop('belop'); if (b > -c.saldo('2800')) c.feil.push('Det er bare satt av ' + kr(-c.saldo('2800')) + ' i utbytte. Utbytte må være vedtatt før det betales.'); return { linjer: [D('2800', b), K('1920', b)], forklaring: 'Utbytte er ikke en kostnad. Gjelden til eierne går ned.' }; } },
enkel('uttak', G.eier, 'Jeg tok ut penger privat', { form: 'ENK', ord: 'privatuttak lønn til meg selv', bilag: 'Bankutskrift.' }, '2060', '1920', function () { return 'Privat uttak er ikke lønn og ikke kostnad. Skatten regnes av overskuddet, uansett hva du tar ut.'; }),
enkel('innskudd', G.eier, 'Jeg satte inn private penger', { form: 'ENK', ord: 'privat innskudd', bilag: 'Bankutskrift.' }, '1920', '2061', function () { return 'Privat innskudd er ikke inntekt.'; }),
{ id: 'uttakvare', gruppe: G.eier, form: 'ENK', navn: 'Jeg tok ut en vare eller tjeneste til eget bruk', ord: 'uttak vare', bilag: 'Uttaksbilag med verdi, senest femten virkedager ut i neste måned.', felt: function () { return [belopfelt('Salgsverdi uten mva', 'Gjelder varer og tjenester med 25 % mva')]; },
  bygg: function (f, c) { var b = c.belop('belop'), mva = c.r.selskap.mva ? prosent(b, c.s.mva.hoy) : 0; return { linjer: [D('2060', b + mva), K(c.r.selskap.mva ? '3080' : '3205', b, c.r.selskap.mva ? { mva: '3' } : {}), K('2700', mva, { avg: '3' })], forklaring: 'Uttaket regnes som salg til deg selv.' }; } },
enkel('enkskatt', G.eier, 'Jeg betalte forskuddsskatt', { form: 'ENK', ord: 'forskuddsskatt', bilag: 'Skatteregning og bankutskrift.' }, '2063', '1920', function () { return 'Skatten er din egen og føres som privat, ikke som kostnad.'; }),

// Lønn
{ id: 'lonn', gruppe: G.lonn, navn: 'Jeg kjørte lønn', ord: 'lønnsslipp ansatt arbeidsgiveravgift', bilag: 'Lønnsslipp og lønnsliste.', felt: function (c) { return [belopfelt('Bruttolønn'), { id: 'trekk', navn: 'Skattetrekk', type: 'belop' }, { id: 'aga', navn: 'Arbeidsgiveravgift, prosent', type: 'tall', std: String(c.s.aga).replace('.', ','), hint: 'Sone I er forslaget' }, { id: 'ferie', navn: 'Feriepenger, prosent', type: 'tall', std: String(c.s.feriepenger).replace('.', ','), hint: '12 ved fem ukers ferie. Over 60 år gjelder høyere sats' }]; },
  bygg: function (f, c) { var b = c.belop('belop'), t = c.belop('trekk', true), a = c.tall('aga'), p = c.tall('ferie'), aga = prosent(b, a), ferie = prosent(b, p), agaF = prosent(ferie, a); if (t > b) c.feil.push('Trekket kan ikke være større enn lønnen.');
    return { linjer: [D('5000', b), K('2600', t), K('1920', b - t), D('5400', aga), K('2770', aga), D('5020', ferie), K('2940', ferie), D('5400', agaF), K('2775', agaF)], varsler: t ? ['Skattetrekket på ' + kr(t) + ' skal betales senest ' + M.dato(M.virkedag(M.plussDager(c.dato, 1))) + ' (første virkedag etter lønn).'] : [], forklaring: 'Den ansatte får ' + kr(b - t) + '. Lønnen koster selskapet ' + kr(b + aga + ferie + agaF) + ' med avgift og feriepenger.' }; } },
enkel('trekk', G.lonn, 'Jeg betalte skattetrekket', { ord: 'forskuddstrekk', bilag: 'Bankutskrift med KID.', stdKonto: '2600' }, '2600', '1920', function () { return 'Pengene er den ansattes skatt. Det er ingen ny kostnad.'; }),
enkel('agabet', G.lonn, 'Jeg betalte arbeidsgiveravgift', { ord: 'arbeidsgiveravgift', bilag: 'Bankutskrift med KID.', stdKonto: '2770' }, '2770', '1920', function () { return 'Avgiften ble kostnad da lønnen ble kjørt. Nå går gjelden ned.'; }),
{ id: 'feriebet', gruppe: G.lonn, navn: 'Jeg betalte ut feriepenger', ord: 'feriepenger', bilag: 'Feriepengegrunnlag og lønnsslipp.', felt: function (c) { return [belopfelt('Feriepenger', 'Uten skattetrekk når de er opptjent året før. Ellers føres de som lønn', function () { return -c.saldo('2940'); }), { id: 'aga', navn: 'Arbeidsgiveravgift, prosent', type: 'tall', std: String(c.s.aga).replace('.', ',') }]; },
  bygg: function (f, c) { var b = c.belop('belop'), a = Math.min(prosent(b, c.tall('aga')), Math.max(0, -c.saldo('2775'))); return { linjer: [D('2940', b), K('1920', b), D('2775', a), K('2770', a)], forklaring: 'Feriepengene ble kostnad da de ble tjent opp. Nå betales de ut, og avgiften forfaller.' }; } },
{ id: 'otp', gruppe: G.lonn, navn: 'Tjenestepensjon for måneden', ord: 'otp pensjon', bilag: 'Beregning eller faktura fra pensjonsleverandøren.', felt: function (c) { return [belopfelt('Pensjonsinnskudd'), { id: 'aga', navn: 'Arbeidsgiveravgift, prosent', type: 'tall', std: String(c.s.aga).replace('.', ',') }]; },
  bygg: function (f, c) { var b = c.belop('belop'), a = prosent(b, c.tall('aga')); return { linjer: [D('5420', b), K('2990', b), D('5400', a), K('2776', a)], forklaring: 'Pensjonen er lønnskostnad i måneden arbeidet ble gjort. Avgiften skal betales når pensjonen er betalt.' }; } },
{ id: 'otpbet', gruppe: G.lonn, navn: 'Jeg betalte tjenestepensjonen', ord: 'otp pensjon betaling', bilag: 'Faktura fra pensjonsleverandøren og bankutskrift.', felt: function (c) { return [belopfelt('Beløp', '', function () { return aapenPensjon(c.r); })]; },
  bygg: function (f, c) { var b = c.belop('belop'), skyldt = aapenPensjon(c.r), avg = Math.max(0, -c.saldo('2776')), a = skyldt > 0 ? Math.min(avg, Math.round(avg * b / skyldt)) : 0; return { linjer: [D('2990', b), K('1920', b), D('2776', a), K('2770', a)], varsler: b > skyldt ? ['Det er bare ført ' + kr(skyldt) + ' i pensjon som ikke er betalt.'] : [], forklaring: 'Pensjonen ble kostnad da den ble tjent opp. Nå betales den, og arbeidsgiveravgiften på ' + kr(a) + ' skal med i a-meldingen.' }; } },
{ id: 'reise', gruppe: G.lonn, navn: 'Kjøring og diett innenfor trekkfri sats', ord: 'kilometer kjørebok reiseregning', bilag: 'Signert reiseregning med dato, formål og rute. Skal med i a-meldingen.', form: 'AS', felt: function (c) { return [{ id: 'km', navn: 'Kilometer', type: 'tall', std: '0' }, { id: 'diett', navn: 'Diett', type: 'belop', std: 0 }]; },
  bygg: function (f, c) { var km = Math.round(c.tall('km') * c.s.km * 100), d = c.belop('diett', true); return { linjer: [D('7100', km + d), K('2910', km + d)], forklaring: 'Kjøring er regnet med ' + String(c.s.km).replace('.', ',') + '0 kr per km, som er trekkfritt. Selskapet skylder den reisende ' + kr(km + d) + '.' }; } },

// Bank og lån
{ id: 'laan', gruppe: G.bank, navn: 'Jeg tok opp et lån', ord: 'banklån', bilag: 'Låneavtale og bankutskrift.', felt: function () { return [belopfelt('Lånebeløp'), { id: 'gebyr', navn: 'Gebyr trukket fra', type: 'belop', std: 0 }]; },
  bygg: function (f, c) { var b = c.belop('belop'), g = c.belop('gebyr', true); return { linjer: [D('1920', b - g), D('8150', g), K('2220', b)], forklaring: 'Lånet er gjeld, ikke inntekt.' + (g ? ' Gebyret er finanskostnad.' : '') }; } },
{ id: 'avdrag', gruppe: G.bank, navn: 'Jeg betalte renter og avdrag', ord: 'termin lån', bilag: 'Terminvarsel fra banken.', felt: function () { return [{ id: 'belop', navn: 'Avdrag', type: 'belop' }, { id: 'rente', navn: 'Renter', type: 'belop', std: 0 }]; },
  bygg: function (f, c) { var b = c.belop('belop', true), q = c.belop('rente', true); return { linjer: [D('2220', b), D('8150', q), K('1920', b + q)], forklaring: 'Bare renten på ' + kr(q) + ' er kostnad. Avdraget gjør gjelden mindre.' }; } },
{ id: 'flytt', gruppe: G.bank, navn: 'Jeg flyttet penger mellom kontoer', ord: 'overføring kontantuttak', bilag: 'Bankutskrift.', felt: function () { var v = kontovalg(['1920', '1900', '2380']); return [{ id: 'fra', navn: 'Fra', type: 'valg', valg: v }, { id: 'til', navn: 'Til', type: 'valg', valg: v.slice(1).concat(v[0]) }, belopfelt('Beløp')]; },
  bygg: function (f, c) { var b = c.belop('belop'); if (f.fra === f.til) c.feil.push('Velg to ulike kontoer.'); return { linjer: [D(f.til, b), K(f.fra, b)], forklaring: 'Pengene bytter bare plass.' }; } },

// Mva og skatt
{ id: 'mvaopp', gruppe: G.mva, navn: 'Gjør opp en mva-termin', ord: 'mva-melding termin', bilag: 'Mva-meldingen for terminen. Har du årstermin, er fristen 10. mars.', kreverMva: true,
  felt: function (c) { var y = M.aar(c.dato), v = []; for (var t = 1; t <= 6; t++) v.push({ v: y + '-' + t, n: t + '. termin ' + y }); return [{ id: 'termin', navn: 'Termin', type: 'valg', valg: v, std: y + '-' + M.termin(c.dato) }]; },
  datoFra: function (f) { var d = (f.termin || '').split('-'); return d.length === 2 ? M.terminDatoer(+d[0], +d[1]).til : null; },
  bygg: function (f, c) { var d = (f.termin || '').split('-'), m = M.mva(c.r, +d[0], +d[1]); var so = function (n) { return m.oppgjor.reduce(function (z, o) { return z + o.linjer.reduce(function (q, l) { return q + (l.konto === n ? l.belop : 0); }, 0); }, 0); };
    var ut = m.ut - so('2700'), inn = m.inn + so('2710'), mel = m.melding + so('2740'), oere = mel - (ut - inn);
    if (!ut && !inn) c.feil.push(m.oppgjor.length ? 'Terminen er allerede gjort opp.' : 'Det er ingen mva i terminen.');
    return { type: 'oppgjor', linjer: [D('2700', ut), K('2710', inn), K('2740', mel), D('7790', oere)], tekst: 'Mva-oppgjør ' + d[1] + '. termin ' + d[0], forklaring: (mel >= 0 ? 'Dere skal betale ' + kr(mel) : 'Dere har til gode ' + kr(-mel)) + '. Fristen er ' + M.dato(m.frist) + '.' }; } },
{ id: 'mvabet', gruppe: G.mva, navn: 'Mva-en ble betalt eller kom inn', ord: 'mva betaling', bilag: 'Bankutskrift med KID.', kreverMva: true, felt: function (c) { return [belopfelt(c.saldo('2740') > 0 ? 'Beløp vi fikk' : 'Beløp vi betalte', '', function () { return Math.abs(c.saldo('2740')); })]; },
  bygg: function (f, c) { var b = c.belop('belop'), gode = c.saldo('2740') > 0; return { linjer: gode ? [D('1920', b), K('2740', b)] : [D('2740', b), K('1920', b)], varsler: b !== Math.abs(c.saldo('2740')) ? ['Oppgjørskontoen står med ' + kr(Math.abs(c.saldo('2740'))) + '.'] : [], forklaring: 'Mva er aldri inntekt eller kostnad. Pengene går bare videre.' }; } },
{ id: 'omvmva', gruppe: G.mva, navn: 'Omvendt mva for kvartalet', ord: 'utland kvartal særskilt melding', bilag: 'Særskilt skattemelding for mva.', kreverIkkeMva: true, felt: function (c) { return [belopfelt('Mva på kjøp fra utlandet', '', function () { return -c.saldo('2700'); })]; },
  bygg: function (f, c) { var b = c.belop('belop'), h = Math.round(b / 100) * 100, kv = Math.ceil(+c.dato.slice(5, 7) / 3), y = M.aar(c.dato); if (b > -c.saldo('2700')) c.feil.push('Det er bare ført ' + kr(-c.saldo('2700')) + ' i omvendt mva.'); var frist = M.virkedag([y + '-05-10', y + '-08-31', y + '-11-10', (y + 1) + '-02-10'][kv - 1]); return { type: 'oppgjor', linjer: [D('2700', b), K('2740', h), D('7790', h - b)], forklaring: 'Dere skal melde og betale ' + kr(h) + '. Fristen for ' + kv + '. kvartal er ' + M.dato(frist) + '.' }; } },
enkel('omvbet', G.mva, 'Jeg betalte omvendt mva', { kreverIkkeMva: true, ord: 'utland kvartal betaling', bilag: 'Bankutskrift med KID.', stdKonto: '2740' }, '2740', '1920', function () { return 'Avgiften ble kostnad da kjøpet ble ført. Nå går gjelden ned.'; }),
{ id: 'skatt', gruppe: G.mva, form: 'AS', navn: 'Før årets skatt', ord: 'betalbar skatt selskapsskatt', bilag: 'Skatteberegning.', felt: function (c) { return [belopfelt('Skattepliktig resultat', 'Forslaget er resultat før skatt. Legg til kostnader uten fradrag (representasjon, bøter, gaver), og trekk fra stiftelsesutgifter og fremført underskudd.', function () { return M.resultat(c.r, M.aar(c.dato) + '-01-01', M.aar(c.dato) + '-12-31').forSkatt; })]; },
  datoFra: function (f, c) { return M.aar(c.dato) + '-12-31'; },
  bygg: function (f, c) { var b = c.belop('belop'), sk = Math.round(b * c.s.skatt / 10000) * 100; if (b <= 0) c.feil.push('Det er ikke overskudd å regne skatt av. Underskudd kan brukes senere.'); return { linjer: [D('8300', sk), K('2500', sk)], varsler: M.resultat(c.r, M.aar(c.dato) + '-01-01', M.aar(c.dato) + '-12-31').skatt ? ['Det er allerede ført skatt i år.'] : [], forklaring: c.s.skatt + ' prosent av ' + kr(b) + ' er ' + kr(sk) + '. Skatten betales neste år.' }; } },
enkel('skattbet', G.mva, 'Selskapet betalte skatt', { form: 'AS', ord: 'forskuddsskatt restskatt', bilag: 'Bankutskrift med KID.', stdKonto: '2500' }, '2500', '1920', function () { return 'Skatten ble kostnad da den ble ført. Nå går gjelden ned.'; }),

// Måned og årsslutt
{ id: 'avskriv', gruppe: G.slutt, form: 'AS', navn: 'Før avskrivning', ord: 'avskrivning slitasje', bilag: 'Avskrivningsplan.', felt: function (c) { return [{ id: 'konto', navn: 'Hva avskrives?', type: 'valg', valg: eiendeler(c) }, { id: 'kost', navn: 'Kjøpspris', type: 'belop', hint: 'Forslaget er alt som er kjøpt på kontoen. Rett det hvis noe er solgt eller har annen levetid', std: function (f) { return kostpris(c.r, f.konto || (eiendeler(c)[0] || {}).v); } }, { id: 'aar', navn: 'Levetid i år', type: 'tall', std: '5' }, { id: 'mnd', navn: 'Antall måneder nå', type: 'tall', std: '1' }]; },
  bygg: function (f, c) { var k = c.belop('kost'), aar = c.tall('aar'), m = c.tall('mnd'); if (!f.konto) { c.feil.push('Det er ikke noe utstyr i balansen å avskrive.'); return { linjer: [] }; } if (!(aar > 0) || !(m > 0)) { c.feil.push('Fyll inn levetid og antall måneder.'); return { linjer: [] }; }
    var b = Math.min(Math.round(k / (aar * 12) * m), Math.max(0, c.saldo(f.konto))); return { linjer: [D('6000', b), K(f.konto, b)], tekst: 'Avskrivning ' + BOK.konto[f.konto].navn.toLowerCase(), forklaring: 'Utstyret blir ' + kr(b) + ' mindre verdt. Det koster ingen penger nå.' }; } },
{ id: 'saldoavskr', gruppe: G.slutt, form: 'ENK', navn: 'Før årets avskrivning', ord: 'avskrivning saldo slitasje', bilag: 'Saldoskjema for avskrivning.', felt: function (c) { return [{ id: 'konto', navn: 'Hva avskrives?', type: 'valg', valg: eiendeler(c) }, { id: 'sats', navn: 'Prosent av verdien', type: 'tall', std: function (f) { return String(c.s.saldo[f.konto || (eiendeler(c)[0] || {}).v] || ''); }, hint: 'Høyeste sats etter skatteloven § 14-43. Du kan velge lavere' }]; },
  datoFra: function (f, c) { return M.aar(c.dato) + '-12-31'; },
  bygg: function (f, c) { var pst = c.tall('sats'), y = M.aar(c.dato), hoy = c.s.saldo[f.konto]; if (!f.konto) { c.feil.push('Det er ikke noe utstyr i balansen å avskrive.'); return { linjer: [] }; } if (!(pst > 0)) c.feil.push('Fyll inn prosent.'); if (hoy && pst > hoy) c.feil.push('Høyeste sats er ' + hoy + ' prosent.');
    if (c.r.bilag.some(function (b) { return b.hendelse === 'saldoavskr' && M.aar(b.dato) === y && b.felt && b.felt.konto === f.konto && !M.reversertAv(c.r, b.nr); })) c.feil.push('Årets avskrivning på denne er alt ført.');
    var b = prosent(Math.max(0, c.saldo(f.konto)), pst); return { linjer: [D('6000', b), K(f.konto, b)], tekst: 'Avskrivning ' + BOK.konto[f.konto].navn.toLowerCase(), forklaring: 'Enkeltpersonforetak uten regnskapsplikt avskriver en fast prosent av det som står igjen, én gang i året. Utstyret blir ' + kr(b) + ' mindre verdt.' }; } },
{ id: 'bruk', gruppe: G.slutt, navn: 'Fordel kostnad som er betalt på forhånd', ord: 'periodisering forskuddsbetalt', bilag: 'Viser til bilaget som fordeles.', felt: function (c) { var p = planer(c, 'kjop', 'bruk', '1571'); return [{ id: 'plan', navn: 'Hva fordeles?', type: 'valg', valg: planvalg(p) }, belopfelt('Beløp for måneden', '', function (f) { var q = p.filter(function (x) { return String(x.b.nr) === String(f.plan || (p[0] && p[0].b.nr)); })[0]; return q ? maaneddel(q) : null; })]; },
  bygg: function (f, c) { var q = planer(c, 'kjop', 'bruk', '1571').filter(function (x) { return String(x.b.nr) === String(f.plan); })[0], b = c.belop('belop'); if (!q) { c.feil.push('Det er ingen kostnader å fordele.'); return { linjer: [] }; } if (b > q.rest) c.feil.push('Det er bare ' + kr(q.rest) + ' igjen å fordele.'); return { linjer: [D(q.b.felt.kostkonto, b), K('1571', b)], tekst: 'Månedens del av bilag ' + q.b.nr + ': ' + q.b.tekst, forklaring: 'Denne månedens del blir kostnad. Ingen mva, for den ble ført på fakturaen.' }; } },
{ id: 'opptjen', gruppe: G.slutt, navn: 'Fordel forskuddsfakturert salg', ord: 'abonnement periodisering opptjent', bilag: 'Viser til fakturaen som fordeles.', felt: function (c) { var gj = c.r.selskap.form === 'AS' ? '2970' : '2900', p = planer(c, 'abo', 'opptjen', gj); return [{ id: 'plan', navn: 'Hva fordeles?', type: 'valg', valg: planvalg(p) }, belopfelt('Beløp for måneden', '', function (f) { var q = p.filter(function (x) { return String(x.b.nr) === String(f.plan || (p[0] && p[0].b.nr)); })[0]; return q ? maaneddel(q) : null; })]; },
  bygg: function (f, c) { var gj = c.r.selskap.form === 'AS' ? '2970' : '2900', q = planer(c, 'abo', 'opptjen', gj).filter(function (x) { return String(x.b.nr) === String(f.plan); })[0], b = c.belop('belop'); if (!q) { c.feil.push('Det er ingen salg å fordele.'); return { linjer: [] }; } if (b > q.rest) c.feil.push('Det er bare ' + kr(q.rest) + ' igjen å fordele.'); return { linjer: [D(gj, b), K(salgskonto(c, q.b.felt), b)], tekst: 'Månedens del av bilag ' + q.b.nr + ': ' + q.b.tekst, forklaring: 'Denne månedens del er tjent opp og blir salg. Ingen mva nå.' }; } },
{ id: 'palopt', gruppe: G.slutt, navn: 'Kostnad vi har brukt, men ikke fått faktura for', ord: 'påløpt periodisering avsetning', bilag: 'Beregning eller avtale.', felt: function (c) { return [{ id: 'konto', navn: 'Hva gjelder det?', type: 'valg', valg: kostnadsvalg(c) }, belopfelt(c.r.selskap.mva ? 'Beløp uten mva dere får trukket fra' : 'Beløp med mva')]; },
  bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D(f.konto, b), K('2990', b)], tekst: 'Påløpt: ' + (BOK.konto[f.konto] || { navn: '' }).navn.toLowerCase(), varsler: ['Snu føringen når fakturaen kommer, ellers telles kostnaden to ganger. Bruk «Snu» på bilaget.'], forklaring: 'Kostnaden hører til denne perioden selv om fakturaen kommer senere.' }; } },
{ id: 'opparb', gruppe: G.slutt, form: 'AS', navn: 'Jobb vi har gjort, men ikke fakturert', ord: 'opptjent ikke fakturert', bilag: 'Timeliste eller avtale.', felt: function (c) { return [OMF(c), belopfelt('Beløp uten mva')]; }, bygg: function (f, c) { var b = c.belop('belop'); return { linjer: [D('1530', b), K(salgskonto(c, f), b)], varsler: ['Snu føringen når fakturaen sendes. Bruk «Snu» på bilaget.'], forklaring: 'Inntekten hører til nå. Mva kommer først med fakturaen.' }; } },
{ id: 'vare', gruppe: G.slutt, navn: 'Varetelling', ord: 'lager telling svinn', bilag: 'Signert telleliste med dato.', felt: function (c) { return [belopfelt('Verdi av lageret til innkjøpspris uten mva', 'Bokført nå: ' + kr(c.saldo('1400')))]; },
  bygg: function (f, c) { var talt = c.belop('belop', true), d = talt - c.saldo('1400'); if (!d) c.feil.push('Lageret er allerede bokført med dette beløpet.'); return { linjer: [D('1400', d), K('4090', d)], forklaring: d > 0 ? 'Dere har ' + kr(d) + ' mer på lager. Varer som ikke er solgt, er ikke kostnad ennå.' : 'Dere har ' + kr(-d) + ' mindre på lager. Det blir varekostnad.' }; } },
{ id: 'salgutstyr', gruppe: G.slutt, navn: 'Jeg solgte eller kastet utstyr', ord: 'salg driftsmiddel gevinst tap bil', bilag: 'Salgsfaktura eller kasseringsbilag.', felt: function (c) { return [{ id: 'konto', navn: 'Hva ble solgt?', type: 'valg', valg: eiendeler(c) }, belopfelt('Salgspris uten mva', '0 hvis det ble kastet'), { id: 'bokf', navn: 'Bokført verdi av det som ble solgt', type: 'belop', std: function (f) { return c.saldo(f.konto || (eiendeler(c)[0] || {}).v); }, vis: function () { return c.r.selskap.form === 'AS'; } }]; },
  bygg: function (f, c) { var as = c.r.selskap.form === 'AS', p = c.belop('belop', true); if (!f.konto) { c.feil.push('Det er ikke noe utstyr i balansen.'); return { linjer: [] }; }
    // Brukt kjøretøy som har vært registrert i Norge, er fritatt for mva (mval. § 6-7). Annet utstyr har 25 %.
    var bil = f.konto === '1207' || f.konto === '1238', kode = !c.r.selskap.mva || !p ? null : bil ? '5' : BOK.konto[f.konto].mva === '1' ? '3' : null, mva = kode === '3' ? prosent(p, c.s.mva.hoy) : 0, x = kode ? { mva: kode } : {};
    var v = as ? c.belop('bokf', true) : Math.min(p, Math.max(0, c.saldo(f.konto))), d = p - v;
    if (!as && !p) c.feil.push('Kastet utstyr gir ingen føring i enkeltpersonforetak. Det avskrives videre på saldoen.');
    return { linjer: [D('1920', p + mva), K(f.konto, v, x), d >= 0 ? K(as ? '3880' : '3895', d, x) : D('7880', -d, x), K('2700', mva, { avg: '3' })], tekst: 'Salg av ' + BOK.konto[f.konto].navn.toLowerCase(), varsler: kode === '5' ? ['Brukt bil som har vært registrert i Norge, selges uten mva, også når dere trakk fra mva ved kjøpet (mval. § 6-7).'] : [],
      forklaring: as ? (d >= 0 ? 'Gevinsten er ' + kr(d) + '.' : 'Tapet er ' + kr(-d) + '.') : 'Salgsprisen trekkes fra verdien som står igjen å avskrive' + (d > 0 ? ', og ' + kr(d) + ' blir inntekt.' : '.') }; } },
{ id: 'utsatt', gruppe: G.slutt, form: 'AS', navn: 'Endring i utsatt skatt', ord: 'utsatt skatt midlertidige forskjeller skattefordel', bilag: 'Skatteberegning.', felt: function () { return [belopfelt('Økning i utsatt skatt', 'Minus hvis den går ned')]; },
  bygg: function (f, c) { var b = c.belop('belop', false, true), L; if (b > 0) { var k70 = Math.min(b, Math.max(0, c.saldo('1070'))); L = [D('8320', b), K('1070', k70), K('2120', b - k70)]; } else { var d20 = Math.min(-b, Math.max(0, -c.saldo('2120'))); L = [K('8320', -b), D('2120', d20), D('1070', -b - d20)]; }
    return { linjer: L, forklaring: 'Skatt som kommer senere fordi regnskap og skatt er ulike. Utsatt skatt skal føres. Utsatt skattefordel kan små foretak la være å føre opp (NRS 8 pkt. 6.1.1.2).' }; } },
{ id: 'disponer', gruppe: G.slutt, form: 'AS', navn: 'Disponer årsresultatet', ord: 'disponering utbytte egenkapital årsslutt', bilag: 'Styrets forslag til disponering.', felt: function () { return [{ id: 'utb', navn: 'Foreslått utbytte', type: 'belop', std: 0 }]; },
  datoFra: function (f, c) { return M.aar(c.dato) + '-12-31'; },
  bygg: function (f, c) { var y = M.aar(c.dato), res = M.resultat(c.r, y + '-01-01', y + '-12-31'), d = M.saldoer(c.r, y + '-01-01', y + '-12-31')['8800'] || 0, rest = res.aars - d, u = c.belop('utb', true), opp = -c.saldo('2050'), tap = c.saldo('2080'), L = [], v = [];
    if (!rest) c.feil.push('Årsresultatet er allerede disponert.');
    if (res.forSkatt > 0 && !res.skatt) v.push('Årets skatt er ikke ført ennå.');
    // Aksjeloven § 8-1: aksjekapitalen må være dekket, og lån til eier trekkes fra
    var fri = rest - c.saldo('2020') - c.saldo('2030') - c.saldo('2050') - c.saldo('2080') - Math.max(0, c.saldo('1565'));
    if (u > Math.max(0, fri)) c.feil.push('Det kan høyst deles ut ' + kr(Math.max(0, fri)) + '. Aksjekapitalen må være dekket, og lån til eier trekkes fra (aksjeloven § 8-1).');
    if (rest >= 0) { var dekk = Math.min(rest, Math.max(0, tap)), mangler = Math.max(0, u - (rest - dekk) - Math.max(0, opp)), fra20 = Math.min(mangler, Math.max(0, -c.saldo('2020'))); L = [D('8800', rest), K('2080', dekk), K('2800', u), K('2050', rest - dekk - u + mangler), D('2020', fra20), D('2030', mangler - fra20)]; }
    else { if (u) c.feil.push('Året har underskudd. Utbytte av tidligere overskudd tas ikke med her.'); var ta = Math.min(-rest, Math.max(0, opp)); L = [K('8800', -rest), D('2050', ta), D('2080', -rest - ta)]; }
    if (u) v.push('Generalforsamlingen må vedta utbyttet, og egenkapital og likviditet må være forsvarlig (aksjeloven § 8-1 fjerde ledd, jf. § 3-4).');
    return { type: 'disponering', linjer: L, tekst: 'Disponering av årsresultat ' + y, varsler: v, forklaring: 'Årsresultatet på ' + kr(rest) + ' flyttes til egenkapitalen' + (u ? ', og ' + kr(u) + ' settes av til utbytte' : '') + '.' }; } },
{ id: 'egenbil', gruppe: G.eier, form: 'ENK', navn: 'Jeg kjørte egen bil i jobben', ord: 'kilometer kjørebok privat bil', bilag: 'Kjørebok med dato, formål, rute og kilometer.', felt: function (c) { return [{ id: 'km', navn: 'Kilometer', type: 'tall', std: '', hint: String(c.s.km).replace('.', ',') + '0 kr per km, når bilen brukes høyst ' + c.s.enkKm.toLocaleString('nb-NO') + ' km i året i jobben' }]; },
  bygg: function (f, c) { var b = Math.round(c.tall('km') * c.s.km * 100), y = M.aar(c.dato), foer = M.saldoer(c.r, y + '-01-01', y + '-12-31')['7080'] || 0; if (!b) c.feil.push('Fyll inn kilometer.'); return { linjer: [D('7080', b), K('2061', b)], varsler: foer + b > c.s.enkKm * c.s.km * 100 ? ['Over ' + c.s.enkKm.toLocaleString('nb-NO') + ' km i året skal bilen føres som firmabil, med faktiske kostnader.'] : [], forklaring: 'Kostnaden er ' + kr(b) + '. Du har brukt din egen bil, så motposten er privat innskudd.' }; } },
enkel('privatbil', G.slutt, 'Jeg brukte firmabilen privat', { form: 'ENK', ord: 'privat bruk bil årsslutt', bilag: 'Beregning av privat bruk.' }, '2060', '7099', function (b) { return 'Den private delen på ' + kr(b) + ' er ikke kostnad i foretaket, men privat uttak.'; }),
enkel('privattlf', G.slutt, 'Jeg brukte firmatelefon eller nett privat', { form: 'ENK', ord: 'telefon mobil internett privat bruk årsslutt', bilag: 'Oversikt over årets telefon- og nettkostnader.' }, '2060', '6998', function (b) { return 'Den private delen på ' + kr(b) + ' er ikke kostnad i foretaket, men privat uttak.'; }),
enkel('hjemmekontor', G.slutt, 'Jeg har hjemmekontor', { form: 'ENK', ord: 'kontor hjemme standardfradrag', bilag: 'Opplysning om rommet, som bare kan brukes i jobben.' }, '7700', '2061', function (b) { return 'Standardfradraget på ' + kr(b) + ' er kostnad. Du har betalt rommet privat, så motposten er privat innskudd.'; }),
enkel('egenpensjon', G.eier, 'Jeg sparte til egen pensjon i foretaket', { form: 'ENK', ord: 'pensjon innskuddspensjon selvstendig', bilag: 'Avtale og bankutskrift.', hint: 'Høyst 7 prosent av beregnet personinntekt opp til 12 G' }, '5950', '1920', function (b) { return 'Innskuddet på ' + kr(b) + ' er kostnad i foretaket.'; }),

// For deg som kan debet og kredit
{ id: 'fri', gruppe: G.fag, navn: 'Fri føring', ord: 'manuell debet kredit', bilag: 'Bilag som viser hvorfor føringen gjøres.', frilinjer: true, kreverGrunn: true, felt: function () { return []; }, bygg: function (f, c) { return { linjer: c.frilinjer(), forklaring: 'Mva-kontoene kan ikke føres her. Kunder og leverandører må velges på 1500 og 2400.' }; } },
{ id: 'ib', gruppe: G.fag, navn: 'Inngående balanse fra forrige system', ord: 'åpningsbalanse start', bilag: 'Saldobalanse fra forrige system.', frilinjer: true, felt: function () { return []; }, datoFra: function (f, c) { return c.r.selskap.start; },
  bygg: function (f, c) { if (c.r.bilag.some(function (b) { return b.type === 'ib' && !M.reversertAv(c.r, b.nr); })) c.feil.push('Inngående balanse er allerede ført.'); var L = c.frilinjer(); if (L.some(function (l) { var t = (BOK.konto[l.konto] || {}).type; return t === 'inntekt' || t === 'kostnad'; })) c.feil.push('Inngående balanse kan bare ha balansekontoer.'); return { type: 'ib', linjer: L, tekst: 'Inngående balanse', forklaring: 'Saldoene dere tar med fra forrige system. Summen skal være null.' }; } }
];
BOK.hendelse = {};
BOK.hendelser.forEach(function (h) { BOK.hendelse[h.id] = h; });
// Forslag til beløp fra kontosaldoen for de enkle betalingene
BOK.hendelser.forEach(function (h) { if (h.stdKonto) h.felt = function (c) { return [belopfelt('Beløp', '', function () { return -c.saldo(h.stdKonto); })]; }; if (h.id === 'privattlf') h.felt = function (c) { return [belopfelt('Beløp', 'Inntil ' + M.kr(c.s.ekom * 100) + ' kr i året, men ikke mer enn det telefon og nett kostet', function () { return c.s.ekom * 100; })]; }; if (h.id === 'hjemmekontor') h.felt = function (c) { return [belopfelt('Standardfradrag', '', function () { return c.s.hjemmekontor * 100; })]; }; if (h.id === 'eiertilb') h.felt = function (c) { return [belopfelt('Beløp', '', function () { return M.eierkrav(c.r, c.dato).saldo || null; })]; }; });

// ── Fra hendelse og felt til et forslag som kan bokføres ────────────────
BOK.kontekst = function (r, f, dato) {
  var nye = [], feil = [], s = BOK.satserFor(M.erDato(dato) ? M.aar(dato) : M.aar(r.selskap.start)), sal = null;
  var c = {
    r: r, dato: dato, s: s, feil: feil, nye: nye,
    saldo: function (k) { sal = sal || M.saldoer(r, null, M.erDato(dato) ? M.aar(dato) + '-12-31' : null); return sal[k] || 0; },
    saldoPart: function (type, navn) { var p = M.part(r, type, navn); if (!p || p.ny) return null; var x = M.reskontro(r, type).filter(function (q) { return q.id === p.id; })[0]; return x ? x.saldo : 0; },
    part: function (type, navn) { var p = M.part(r, type, navn); if (!p) return null; if (p.ny && !nye.some(function (q) { return q.id === p.id; })) nye.push({ id: p.id, type: p.type, navn: p.navn }); return p.id; },
    belop: function (id, nullOk, minusOk) { var v = f[id], n = typeof v === 'number' ? v : M.ore(v); if (isNaN(n)) { feil.push('Beløpet er ikke et gyldig tall.'); return 0; } if (!nullOk && !n) feil.push('Fyll inn beløp.'); if (n < 0 && !minusOk) feil.push('Beløpet kan ikke være minus.'); return n; },
    tall: function (id) { var n = parseFloat(String(f[id] == null ? '' : f[id]).replace(/\s/g, '').replace(',', '.')); if (!isFinite(n) || n < 0) { feil.push('Et tall mangler eller er ugyldig.'); return 0; } return n; },
    frilinjer: function () { return (f.linjer || []).map(function (l) { var d = M.ore(l.debet), k = M.ore(l.kredit); if (isNaN(d) || isNaN(k)) { feil.push('Et beløp er ikke et gyldig tall.'); return null; } if (!l.konto && !d && !k) return null; var x = { konto: l.konto, belop: d - k }; if (l.konto === '1500' || l.konto === '2400') x.part = c.part(l.konto === '1500' ? 'kunde' : 'leverandor', l.part); return x; }).filter(function (x) { return x && x.belop !== 0; }); }
  };
  return c;
};
BOK.lag = function (id, f, r, dato, x) {
  x = x || {};
  var h = BOK.hendelse[id], c, d = dato;
  if (h.datoFra) { var d2 = h.datoFra(f, { r: r, dato: dato }); if (d2) d = d2; }
  c = BOK.kontekst(r, f, d);
  if (!M.erDato(d)) c.feil.push('Velg en gyldig dato.');
  var ut = c.feil.length ? { linjer: [] } : h.bygg(f, c);
  var varsler = (ut.varsler || []).slice();
  if (c.s.status === 'foreslått') varsler.push('Satsene for ' + M.aar(d) + ' er foreslått eller ikke fastsatt ennå (kontrollert ' + M.dato(c.s.kontrollert) + ').');
  if (c.s.status === 'mangler') varsler.push('Satsene for ' + (M.erDato(d) ? M.aar(d) : 'året') + ' er ikke lagt inn. Verktøyet bruker ' + c.s.laant + '.');
  var forslag = {
    hendelse: id, dato: d, tekst: x.tekst || ut.tekst || h.navn, type: ut.type || 'vanlig', grunn: x.grunn || ut.grunn || '',
    linjer: (ut.linjer || []).filter(function (l) { return l.belop !== 0; }), nyeParter: c.nye, varsler: varsler, forklaring: ut.forklaring || '',
    felt: Object.assign({}, f, ut.ekstraFelt), vedlegg: x.vedlegg || [], bilagskrav: h.bilag || ''
  };
  // Mva i en termin som alt er gjort opp, må med i en ny melding for den terminen
  if (r.selskap.mva && M.erDato(d) && forslag.type !== 'oppgjor' && forslag.linjer.some(function (l) { return l.avg; })) {
    var m = M.mva(r, M.aar(d), M.termin(d));
    if (m.oppgjor.length) varsler.push(m.termin + '. termin er alt gjort opp. Føringen endrer den, så det må leveres ny melding for terminen.');
  }
  if (h.kreverGrunn && !forslag.grunn) c.feil.push('Skriv hvorfor føringen gjøres.');
  forslag.feil = c.feil.length ? c.feil.filter(function (q, i) { return c.feil.indexOf(q) === i; }) : M.sjekk(r, forslag);
  return forslag;
};

if (typeof module === 'object' && module.exports) module.exports = BOK;
})();
