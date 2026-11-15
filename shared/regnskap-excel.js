// «Last ned Excel» for Lag regnskapet: én arbeidsbok med resultat, balanse, kontantstrøm og nøkkeltall.
// Fila lages i nettleseren, uten bibliotek og uten at tallene sendes noe sted.
// Lyse felt er tallene brukeren har fylt inn. Alt annet er formler, så boka kan regnes videre i Excel.
// Hentes først når noen trykker på knappen (shared/regnskap-flyt.js). Trenger window.HVRegnskap.
(function(root){
  'use strict';

  // ── Farger og tallformat ──
  var INK = '1F2430', GRA = '6B7280', AKS = 'B4793F', AKSM = '8A5A2B', BAND = 'F6F1EA', TOT = 'F1E7DA',
      INN = 'FFFBF2', KANT = 'E6DCCB', LINJE = '9CA3AF', BLA = '1D4E89', HVIT = 'FFFFFF';
  var NF = '#,##0;-#,##0;"–"', NFP = '0.0\\ %', NFX = '0.00', NFK = '[=0]"Stemmer";"Avvik "#,##0';

  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ── ZIP uten komprimering (en .xlsx er en zip med XML-filer) ──
  var CRC = (function(){ var t = [], n, c, k; for(n = 0; n < 256; n++){ c = n; for(k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b){ var c = 0xFFFFFFFF; for(var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s){ return new TextEncoder().encode(s); }
  function zip(files){
    var parts = [], central = [], off = 0, d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function(f){
      var name = utf8(f.n), data = utf8(f.d), crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
      c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    var csize = central.reduce(function(t, a){ return t + a.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, csize, true); e.setUint32(16, off, true);
    var all = parts.concat(central, [new Uint8Array(e.buffer)]);
    var out = new Uint8Array(all.reduce(function(t, a){ return t + a.length; }, 0)), p = 0;
    all.forEach(function(a){ out.set(a, p); p += a.length; });
    return out;
  }

  // ── Stiler: hver ulike kombinasjon av skrift, fyll, kant og tallformat får ett nummer ──
  function Stiler(){
    var fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'],
        borders = [], xfs = [], fmts = [], idx = {};
    function put(arr, xml){ var i = arr.indexOf(xml); if(i < 0){ arr.push(xml); i = arr.length - 1; } return i; }
    function font(f){
      f = f || {};
      return put(fonts, '<font>' + (f.b ? '<b/>' : '') + (f.i ? '<i/>' : '') + '<sz val="' + (f.sz || 11) + '"/><color rgb="FF' + (f.c || INK) + '"/>'
        + '<name val="' + (f.n || 'Calibri') + '"/><family val="' + (f.n === 'Georgia' ? 1 : f.n === 'Consolas' ? 3 : 2) + '"/></font>');
    }
    function fill(c){ return c ? put(fills, '<fill><patternFill patternType="solid"><fgColor rgb="FF' + c + '"/><bgColor indexed="64"/></patternFill></fill>') : 0; }
    function border(b){
      b = b || {};
      function side(k){ var x = b[k]; return x ? '<' + k + ' style="' + x[0] + '"><color rgb="FF' + x[1] + '"/></' + k + '>' : '<' + k + '/>'; }
      return put(borders, '<border>' + side('left') + side('right') + side('top') + side('bottom') + '<diagonal/></border>');
    }
    function fmt(code){ if(!code) return 0; var i = fmts.indexOf(code); if(i < 0){ fmts.push(code); i = fmts.length - 1; } return 164 + i; }
    this.get = function(d){
      var key = JSON.stringify(d);
      if(key in idx) return idx[key];
      var a = d.a || {};
      xfs.push('<xf numFmtId="' + fmt(d.nf) + '" fontId="' + font(d.f) + '" fillId="' + fill(d.fill) + '" borderId="' + border(d.b) + '" xfId="0"'
        + ' applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">'
        + '<alignment horizontal="' + (a.h || 'general') + '" vertical="center"' + (a.ind ? ' indent="' + a.ind + '"' : '') + (a.wrap ? ' wrapText="1"' : '') + '/></xf>');
      return idx[key] = xfs.length - 1;
    };
    this.get({});   // nummer 0 = vanlig celle
    this.xml = function(){
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + '<numFmts count="' + fmts.length + '">' + fmts.map(function(c, i){ return '<numFmt numFmtId="' + (164 + i) + '" formatCode="' + esc(c) + '"/>'; }).join('') + '</numFmts>'
        + '<fonts count="' + fonts.length + '">' + fonts.join('') + '</fonts>'
        + '<fills count="' + fills.length + '">' + fills.join('') + '</fills>'
        + '<borders count="' + borders.length + '">' + borders.join('') + '</borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs>'
        + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    };
  }

  // ── Ett ark ──
  function Ark(navn, bredder, sisteKol){ this.navn = navn; this.bredder = bredder; this.siste = sisteKol; this.rader = {}; this.hoyde = {}; this.frys = 0; this.aktiv = 'A1'; }
  Ark.prototype.c = function(kol, r, o){ (this.rader[r] = this.rader[r] || {})[kol] = o; return o; };
  Ark.prototype.xml = function(forst){
    var self = this, nr = Object.keys(this.rader).map(Number).sort(function(a, b){ return a - b; }), maks = nr[nr.length - 1] || 1;
    var data = nr.map(function(r){
      var celler = self.rader[r], h = self.hoyde[r];
      return '<row r="' + r + '"' + (h ? ' ht="' + h + '" customHeight="1"' : '') + '>' + Object.keys(celler).sort().map(function(k){
        var o = celler[k], a = ' r="' + k + r + '" s="' + (o.s || 0) + '"';
        if(o.f != null) return '<c' + a + (typeof o.v === 'string' ? ' t="str"' : '') + '><f>' + esc(o.f) + '</f>' + (o.v == null ? '' : '<v>' + esc(o.v) + '</v>') + '</c>';
        if(typeof o.v === 'number') return '<c' + a + '><v>' + o.v + '</v></c>';
        if(o.v) return '<c' + a + ' t="inlineStr"><is><t xml:space="preserve">' + esc(o.v) + '</t></is></c>';
        return '<c' + a + '/>';
      }).join('') + '</row>';
    }).join('');
    var pane = this.frys ? '<pane ySplit="' + this.frys + '" topLeftCell="A' + (this.frys + 1) + '" activePane="bottomLeft" state="frozen"/>'
      + '<selection pane="bottomLeft" activeCell="' + this.aktiv + '" sqref="' + this.aktiv + '"/>' : '<selection activeCell="' + this.aktiv + '" sqref="' + this.aktiv + '"/>';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetPr><tabColor rgb="FF' + AKS + '"/><pageSetUpPr fitToPage="1"/></sheetPr>'
      + '<dimension ref="A1:' + this.siste + maks + '"/>'
      + '<sheetViews><sheetView showGridLines="0"' + (forst ? ' tabSelected="1"' : '') + ' workbookViewId="0">' + pane + '</sheetView></sheetViews>'
      + '<sheetFormatPr defaultRowHeight="18" customHeight="1"/>'
      + '<cols>' + this.bredder.map(function(w, i){ return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>'
      + '<sheetData>' + data + '</sheetData>'
      + '<printOptions horizontalCentered="1"/>'
      + '<pageMargins left="0.6" right="0.6" top="0.7" bottom="0.7" header="0.3" footer="0.3"/>'
      + '<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1"/>'
      + '<headerFooter><oddFooter>&amp;L&amp;8&amp;K6B7280Laget med hverdagsverktoy.com&amp;R&amp;8&amp;K6B7280Side &amp;P av &amp;N</oddFooter></headerFooter>'
      + '</worksheet>';
  };

  // ── Radtypene i en oppstilling. kol = beløpskolonnene, f.eks. ['D'] eller ['D','E'] ──
  // En celle er {i:tall} for et felt brukeren har fylt inn, {f:formel, v:verdi} for en formel, eller {v:tall} for et fast tall.
  function Skriver(ark, st, kol){
    var r = 1, alle = ['B', 'C'].concat(kol);
    function S(d){ return st.get(d); }
    function fyll(farge, kant){ alle.forEach(function(k){ if(!(ark.rader[r] || {})[k]) ark.c(k, r, {s:S({fill:farge, b:kant})}); }); }
    function belop(celler, stil, inn){
      celler.forEach(function(c, i){
        if(!c) return;
        if('i' in c) ark.c(kol[i], r, {v:c.i ? c.i : null, s:S(inn)});
        else ark.c(kol[i], r, {f:c.f, v:c.v, s:S(c.nf ? Object.assign({}, stil, {nf:c.nf}) : stil)});
      });
    }
    var w = {
      rad: function(){ return r; },
      tittel: function(t, under){
        r = 2; ark.hoyde[1] = 10; ark.hoyde[2] = 34;
        ark.c('B', 2, {v:t, s:S({f:{n:'Georgia', sz:22, b:1}})});
        ark.c('B', 3, {v:under, s:S({f:{sz:10, c:GRA}})});
        r = 4; ark.hoyde[4] = 8; fyll(null, {bottom:['medium', AKS]});
        r = 5;
      },
      hode: function(etiketter, konto){
        ark.hoyde[r] = 24;
        ark.c('B', r, {v:konto || '', s:S({f:{sz:9, b:1, c:GRA}, b:{bottom:['thin', LINJE]}})});
        ark.c('C', r, {v:'', s:S({b:{bottom:['thin', LINJE]}})});
        kol.forEach(function(k, i){ ark.c(k, r, {v:etiketter[i], s:S({f:{sz:10, b:1, c:i ? GRA : INK}, a:{h:'right'}, b:{bottom:['thin', LINJE]}})}); });
        ark.frys = r; r++;
      },
      seksjon: function(t){
        ark.hoyde[r] = 12; r++; ark.hoyde[r] = 24;
        ark.c('B', r, {v:t.toUpperCase(), s:S({f:{sz:11, b:1}, b:{bottom:['thin', INK]}})}); fyll(null, {bottom:['thin', INK]}); r++;
      },
      gruppe: function(t){
        ark.hoyde[r] = 8; r++; ark.hoyde[r] = 21;
        ark.c('B', r, {v:t, s:S({f:{sz:10, b:1, c:AKSM}, fill:BAND})}); fyll(BAND); r++;
      },
      post: function(konto, navn, celler, stil){
        ark.hoyde[r] = 20;
        ark.c('B', r, {v:konto || '', s:S({f:{n:'Consolas', sz:9, c:GRA}})});
        ark.c('C', r, {v:navn, s:S({})});
        belop(celler, stil || {nf:NF}, {nf:NF, f:{c:BLA}, fill:INN, b:{left:['thin', KANT], right:['thin', KANT], top:['thin', KANT], bottom:['thin', KANT]}});
        return r++;
      },
      sum: function(navn, celler){
        ark.hoyde[r] = 22;
        var kant = {top:['thin', LINJE]};
        ark.c('C', r, {v:navn, s:S({f:{b:1}, b:kant})});
        belop(celler, {nf:NF, f:{b:1}, b:kant}); fyll(null, kant);
        return r++;
      },
      total: function(navn, celler){
        ark.hoyde[r] = 6; r++; ark.hoyde[r] = 25;
        ark.c('C', r, {v:navn, s:S({f:{b:1, sz:11.5}, fill:TOT})});
        belop(celler, {nf:NF, f:{b:1, sz:11.5}, fill:TOT}); fyll(TOT);
        return r++;
      },
      band: function(navn, celler){
        ark.hoyde[r] = 8; r++; ark.hoyde[r] = 30;
        ark.c('C', r, {v:navn, s:S({f:{n:'Georgia', b:1, sz:13, c:HVIT}, fill:AKS})});
        belop(celler, {nf:NF, f:{b:1, sz:13, c:HVIT}, fill:AKS}); fyll(AKS);
        return r++;
      },
      luft: function(h){ ark.hoyde[r] = h || 10; r++; },
      merknad: function(t){ ark.hoyde[r] = 18; ark.c('B', r, {v:t, s:S({f:{sz:9, c:GRA, i:1}})}); r++; },
      forklaring: function(){
        ark.hoyde[r] = 14; r++; ark.hoyde[r] = 20;
        ark.c('B', r, {s:S({fill:INN, b:{left:['thin', KANT], right:['thin', KANT], top:['thin', KANT], bottom:['thin', KANT]}})});
        ark.c('C', r, {v:'Lyse felt er tall du fyller inn. Resten regnes ut av formler.', s:S({f:{sz:9, c:GRA}, a:{ind:1}})}); r++;
        ark.c('B', r, {v:'Laget med hverdagsverktoy.com. Veiledende oppstilling, ikke et offisielt årsregnskap.', s:S({f:{sz:9, c:GRA}})}); r++;
      }
    };
    return w;
  }

  // ── Arbeidsboka ──
  function bygg(D){
    var H = root.HVRegnskap, res = D.res, bal = D.bal, ks = D.ks;
    var R = H.regnRes(res), B = H.regnBal(bal), Fj = H.regnBal(bal, '_f');
    var U = H.utled(res, bal), ksTom = !H.regnKs(ks).any;
    // Kontantstrømmen skrives som formler når den er lik det resultat og balanse gir (eller ikke er fylt ut ennå).
    // Har brukeren ført egne tall der, skrives de som de er.
    var avledet = !R.tom && !B.tom && (ksTom || H.KS.every(function(id){ return (ks[id] || 0) === (U[id] || 0); }));
    var kv = avledet ? U : ks, K = H.regnKs(kv);
    // Det ekte eksempelet (Nille) gjelder 2025. Samme kjennetegn som sidene selv bruker.
    var aar = (res.rSalg === 1769689501 || bal.bAnlForsk === 42844941) ? 2025 : 2026;
    var enk = res.mode === 'enk', egenSkatt = typeof res.skatt === 'number';
    var st = new Stiler(), I = function(v){ return {i:v || 0}; };

    // 1 · Resultat
    var a1 = new Ark('Resultat', [3, 9, 46, 19, 3], 'D'), w = Skriver(a1, st, ['D']), P = {};
    w.tittel('Resultatregnskap', (enk ? 'Enkeltpersonforetak' : 'Aksjeselskap') + ' · regnskapsåret ' + aar + ' · beløp i kroner');
    w.hode([String(aar)], 'Konto');
    w.gruppe('Driftsinntekter');
    P.salg = w.post('3000', 'Salgsinntekt', [I(res.rSalg)]);
    P.annen = w.post('3900', 'Annen driftsinntekt', [I(res.rAnnen)]);
    P.sumDrift = w.sum('Sum driftsinntekter', [{f:'SUM(D' + P.salg + ':D' + P.annen + ')', v:R.sumDrift}]);
    w.gruppe('Driftskostnader');
    P.vare = w.post('4000', 'Varekostnad', [I(res.rVare)]);
    w.post('5000', 'Lønnskostnad inkl. arbeidsgiveravgift', [I(res.rLonn)]);
    P.avskr = w.post('6000', 'Avskrivning', [I(res.rAvskr)]);
    P.annenK = w.post('6790', 'Annen driftskostnad', [I(res.rAnnenKost)]);
    P.sumKost = w.sum('Sum driftskostnader', [{f:'SUM(D' + P.vare + ':D' + P.annenK + ')', v:R.sumKost}]);
    P.drift = w.total('Driftsresultat', [{f:'D' + P.sumDrift + '-D' + P.sumKost, v:R.drift}]);
    w.gruppe('Finansposter');
    P.finI = w.post('8050', 'Finansinntekt', [I(res.rFinInnt)]);
    P.finK = w.post('8150', 'Finanskostnad', [I(res.rFinKost)]);
    P.finans = w.sum('Netto finansposter', [{f:'D' + P.finI + '-D' + P.finK, v:R.finans}]);
    P.forSkatt = w.total('Resultat før skatt', [{f:'D' + P.drift + '+D' + P.finans, v:R.forSkatt}]);
    var skattCelle = enk ? {v:0} : egenSkatt ? I(R.skatt) : {f:'', v:R.skatt};
    P.skatt = w.post('8300', enk ? 'Skattekostnad (eieren skatter privat)' : 'Skattekostnad', [skattCelle]);
    P.ar = w.band(enk ? 'Årsresultat før eierens skatt' : 'Årsresultat', [{f:'D' + P.forSkatt + '-D' + P.skatt, v:R.ar}]);
    if(!enk && !egenSkatt){
      w.luft(16);
      P.sats = w.post('', 'Skattesats for selskap', [{i:H.SATS}]);
      a1.rader[P.sats].D.s = st.get({nf:'0\\ %', f:{c:BLA}, fill:INN, b:{left:['thin', KANT], right:['thin', KANT], top:['thin', KANT], bottom:['thin', KANT]}});
      a1.rader[P.skatt].D.f = 'MAX(0,D' + P.forSkatt + ')*D' + P.sats;
    }
    w.forklaring(); a1.aktiv = 'D' + P.salg;

    // 2 · Balanse (i år og i fjor)
    var a2 = new Ark('Balanse', [3, 9, 44, 17, 17, 3], 'E'), Q = {};
    w = Skriver(a2, st, ['D', 'E']);
    function to(id){ return [I(bal[id]), I(bal[id + '_f'])]; }
    function summ(fra, til, a, f){ return [{f:'SUM(D' + fra + ':D' + til + ')', v:a}, {f:'SUM(E' + fra + ':E' + til + ')', v:f}]; }
    function pluss(rader, a, f){ return ['D', 'E'].map(function(k, i){ return {f:rader.map(function(x){ return k + x; }).join('+'), v:i ? f : a}; }); }
    w.tittel('Balanse', 'Per 31.12.' + aar + ' og 31.12.' + (aar - 1) + ' · beløp i kroner');
    w.hode(['31.12.' + aar, '31.12.' + (aar - 1)], 'Konto');
    w.seksjon('Eiendeler');
    w.gruppe('Anleggsmidler');
    Q.bAnlForsk = w.post('1000', 'Forskning og utvikling', to('bAnlForsk'));
    Q.bAnlEiend = w.post('1100', 'Tomter, bygninger og eiendom', to('bAnlEiend'));
    Q.bAnlMask = w.post('1200', 'Maskiner og utstyr', to('bAnlMask'));
    Q.bAnlInv = w.post('1350', 'Investeringer i aksjer og andeler', to('bAnlInv'));
    Q.anl = w.sum('Sum anleggsmidler', summ(Q.bAnlForsk, Q.bAnlInv, B.anl, Fj.anl));
    w.gruppe('Omløpsmidler');
    Q.bOmlVare = w.post('1400', 'Varelager', to('bOmlVare'));
    Q.bOmlKund = w.post('1500', 'Kundefordringer og andre fordringer', to('bOmlKund'));
    Q.bOmlBank = w.post('1920', 'Bankinnskudd og kontanter', to('bOmlBank'));
    Q.oml = w.sum('Sum omløpsmidler', summ(Q.bOmlVare, Q.bOmlBank, B.oml, Fj.oml));
    Q.eiend = w.total('Sum eiendeler', pluss([Q.anl, Q.oml], B.eiend, Fj.eiend));
    w.seksjon('Egenkapital og gjeld');
    w.gruppe('Egenkapital');
    Q.bEkAks = w.post('2000', 'Aksjekapital', to('bEkAks'));
    Q.bEkOver = w.post('2020', 'Overkurs', to('bEkOver'));
    Q.bEkOpp = w.post('2050', 'Opptjent egenkapital', to('bEkOpp'));
    Q.ek = w.sum('Sum egenkapital', summ(Q.bEkAks, Q.bEkOpp, B.ek, Fj.ek));
    w.gruppe('Langsiktig gjeld');
    Q.bGLBank = w.post('2220', 'Gjeld til kredittinstitusjoner', to('bGLBank'));
    Q.bGLAnnen = w.post('2290', 'Annen langsiktig gjeld', to('bGLAnnen'));
    Q.gl = w.sum('Sum langsiktig gjeld', summ(Q.bGLBank, Q.bGLAnnen, B.gl, Fj.gl));
    w.gruppe('Kortsiktig gjeld');
    Q.bGKLev = w.post('2400', 'Leverandørgjeld', to('bGKLev'));
    Q.bGKSkat = w.post('2600', 'Skatte- og avgiftsgjeld', to('bGKSkat'));
    Q.bGKAnnen = w.post('2900', 'Annen kortsiktig gjeld', to('bGKAnnen'));
    Q.gk = w.sum('Sum kortsiktig gjeld', summ(Q.bGKLev, Q.bGKAnnen, B.gk, Fj.gk));
    Q.ekGjeld = w.total('Sum egenkapital og gjeld', pluss([Q.ek, Q.gl, Q.gk], B.ekGjeld, Fj.ekGjeld));
    w.luft(8);
    w.post('', 'Kontroll: eiendeler er lik egenkapital og gjeld', ['D', 'E'].map(function(k, i){
      return {f:'ABS(' + k + Q.eiend + '-' + k + Q.ekGjeld + ')', v:Math.abs(i ? Fj.diff : B.diff)}; }), {nf:NFK, f:{b:1, c:AKSM}, a:{h:'right'}});
    w.forklaring(); a2.aktiv = 'D' + Q.bAnlForsk;

    // 3 · Kontantstrøm (indirekte modell)
    var a3 = new Ark('Kontantstrøm', [3, 4, 52, 19, 3], 'D'), X = {};
    w = Skriver(a3, st, ['D']);
    function d(id){ return '(Balanse!D' + Q[id] + '-Balanse!E' + Q[id] + ')'; }
    var skattRef = 'Resultat!D' + P.skatt, avskrRef = 'Resultat!D' + P.avskr;
    var kjop = '(' + d('bAnlForsk') + '+' + d('bAnlEiend') + '+' + d('bAnlMask') + '+' + avskrRef + ')';
    var FORM = {
      opRes: 'Resultat!D' + P.forSkatt, opSkatt: '-MAX(0,' + skattRef + '-' + d('bGKSkat') + ')', opAvskr: avskrRef,
      opVarelager: '-' + d('bOmlVare'), opKunde: '-' + d('bOmlKund'), opLevgjeld: d('bGKLev'),
      opAnnet: d('bGKAnnen') + '+MAX(0,' + d('bGKSkat') + '-' + skattRef + ')',
      invSalg: 'MAX(0,-' + kjop + ')', invKjop: '-MAX(0,' + kjop + ')', invAksjer: '-' + d('bAnlInv'),
      finGjeld: d('bGLBank') + '+' + d('bGLAnnen'), finEk: d('bEkAks') + '+' + d('bEkOver'),
      finUtbytte: '-(Resultat!D' + P.ar + '-' + d('bEkOpp') + ')',
      kontIB: 'Balanse!E' + Q.bOmlBank, kontBalUB: 'Balanse!D' + Q.bOmlBank
    };
    function k(id){ return [avledet && FORM[id] ? {f:FORM[id], v:kv[id] || 0} : I(kv[id])]; }
    w.tittel('Kontantstrøm', 'Indirekte modell · regnskapsåret ' + aar + ' · beløp i kroner');
    w.hode([String(aar)]);
    w.merknad(avledet ? 'Tallene hentes fra arkene Resultat og Balanse. Pluss styrker kassen, minus svekker den.'
                      : 'Pluss styrker kassen, minus svekker den.');
    w.gruppe('Drift');
    X.opRes = w.post('', 'Resultat før skatt', k('opRes'));
    w.post('', 'Betalt skatt i år', k('opSkatt'));
    w.post('', 'Gevinst eller tap ved salg av anleggsmidler', k('opGevinst'));
    w.post('', 'Avskrivninger', k('opAvskr'));
    w.post('', 'Nedskrivninger', k('opNedskr'));
    w.post('', 'Endring i varelager', k('opVarelager'));
    w.post('', 'Endring i kundefordringer', k('opKunde'));
    w.post('', 'Endring i leverandørgjeld', k('opLevgjeld'));
    X.opAnnet = w.post('', 'Endring i andre tidsavgrensningsposter', k('opAnnet'));
    X.op = w.sum('Netto kontantstrøm fra drift', [{f:'SUM(D' + X.opRes + ':D' + X.opAnnet + ')', v:K.op}]);
    w.gruppe('Investering');
    X.invSalg = w.post('', 'Salg av varige driftsmidler', k('invSalg'));
    w.post('', 'Kjøp av varige driftsmidler', k('invKjop'));
    X.invAksjer = w.post('', 'Salg og kjøp av aksjer og andeler', k('invAksjer'));
    X.inv = w.sum('Netto kontantstrøm fra investering', [{f:'SUM(D' + X.invSalg + ':D' + X.invAksjer + ')', v:K.inv}]);
    w.gruppe('Finansiering');
    X.finGjeld = w.post('', 'Endring i langsiktig gjeld', k('finGjeld'));
    w.post('', 'Endring i kassekreditt', k('finKasse'));
    w.post('', 'Inn- eller utbetalt egenkapital', k('finEk'));
    X.finUtbytte = w.post('', 'Utbetalt utbytte', k('finUtbytte'));
    X.fin = w.sum('Netto kontantstrøm fra finansiering', [{f:'SUM(D' + X.finGjeld + ':D' + X.finUtbytte + ')', v:K.fin}]);
    X.net = w.band('Netto endring i kontanter', [{f:'D' + X.op + '+D' + X.inv + '+D' + X.fin, v:K.net}]);
    w.gruppe('Avstemming mot balansen');
    X.ib = w.post('', 'Kontanter 1. januar', k('kontIB'));
    X.ub = w.sum('Kontanter 31. desember, regnet ut', [{f:'D' + X.ib + '+D' + X.net, v:K.ub}]);
    X.balUB = w.post('', 'Kontanter 31. desember i balansen', k('kontBalUB'));
    w.post('', 'Kontroll: de to tallene er like', [{f:'ABS(D' + X.ub + '-D' + X.balUB + ')', v:Math.abs(K.ub - (kv.kontBalUB || 0))}], {nf:NFK, f:{b:1, c:AKSM}, a:{h:'right'}});
    w.forklaring(); a3.aktiv = 'D' + X.opRes;

    // 4 · Nøkkeltall
    var a4 = new Ark('Nøkkeltall', [3, 30, 16, 62, 3], 'D');
    w = Skriver(a4, st, ['C']);
    w.tittel('Nøkkeltall', 'Regnet ut av arkene Resultat, Balanse og Kontantstrøm');
    a4.hoyde[5] = 24; a4.frys = 5;
    a4.c('B', 5, {v:'Nøkkeltall', s:st.get({f:{sz:9, b:1, c:GRA}, b:{bottom:['thin', LINJE]}})});
    a4.c('C', 5, {v:String(aar), s:st.get({f:{sz:10, b:1}, a:{h:'right'}, b:{bottom:['thin', LINJE]}})});
    a4.c('D', 5, {v:'Slik regnes det', s:st.get({f:{sz:9, b:1, c:GRA}, a:{ind:2}, b:{bottom:['thin', LINJE]}})});
    var nr = 6;
    function del(a, b){ return b ? a / b : ''; }
    function nok(navn, formel, verdi, nf, tekst){
      a4.hoyde[nr] = 24;
      var kant = {bottom:['hair', LINJE]};
      a4.c('B', nr, {v:navn, s:st.get({f:{b:1}, b:kant})});
      a4.c('C', nr, {f:formel, v:verdi, s:st.get({nf:nf, f:{b:1, sz:12, c:AKSM}, a:{h:'right'}, b:kant})});
      a4.c('D', nr, {v:tekst, s:st.get({f:{sz:10, c:GRA}, a:{ind:2}, b:kant})});
      nr++;
    }
    function br(teller, nevner){ return 'IF(' + nevner + '=0,"",' + teller + '/' + nevner + ')'; }
    var rD = 'Resultat!D', bD = 'Balanse!D';
    nok('Driftsmargin', br(rD + P.drift, rD + P.sumDrift), del(R.drift, R.sumDrift), NFP, 'Driftsresultat delt på driftsinntekter');
    nok('Resultatgrad', br(rD + P.forSkatt, rD + P.sumDrift), del(R.forSkatt, R.sumDrift), NFP, 'Resultat før skatt delt på driftsinntekter');
    nok('Kostnadsandel', br(rD + P.sumKost, rD + P.sumDrift), del(R.sumKost, R.sumDrift), NFP, 'Driftskostnader delt på driftsinntekter');
    nok('Egenkapitalandel', br(bD + Q.ek, bD + Q.eiend), del(B.ek, B.eiend), NFP, 'Egenkapital delt på sum eiendeler');
    nok('Likviditetsgrad 1', br(bD + Q.oml, bD + Q.gk), del(B.oml, B.gk), NFX, 'Omløpsmidler delt på kortsiktig gjeld. Bør være over 1.');
    nok('Gjeldsgrad', br('(' + bD + Q.gl + '+' + bD + Q.gk + ')', bD + Q.ek), del(B.gl + B.gk, B.ek), NFX, 'Gjeld delt på egenkapital');
    nok('Arbeidskapital', bD + Q.oml + '-' + bD + Q.gk, B.oml - B.gk, NF, 'Omløpsmidler minus kortsiktig gjeld, i kroner');
    nok('Kontantstrøm fra drift', "'Kontantstrøm'!D" + X.op, K.op, NF, 'Pengene driften ga i år, i kroner');
    a4.hoyde[nr] = 14; nr++;
    a4.c('B', nr, {v:'Laget med hverdagsverktoy.com. Veiledende oppstilling, ikke et offisielt årsregnskap.', s:st.get({f:{sz:9, c:GRA}})});
    a4.aktiv = 'C6';

    var ark = [a1, a2, a3, a4], X1 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    var na = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    var filer = [
      {n:'[Content_Types].xml', d:X1 + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + ark.map(function(a, i){ return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('')
        + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'},
      {n:'_rels/.rels', d:X1 + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'},
      {n:'docProps/core.xml', d:X1 + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        + '<dc:title>Regnskap ' + aar + '</dc:title><dc:creator>Hverdagsverktøy</dc:creator>'
        + '<dcterms:created xsi:type="dcterms:W3CDTF">' + na + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + na + '</dcterms:modified></cp:coreProperties>'},
      {n:'xl/workbook.xml', d:X1 + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        + '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000" activeTab="0"/></bookViews>'
        + '<sheets>' + ark.map(function(a, i){ return '<sheet name="' + esc(a.navn) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>'
        + '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'},
      {n:'xl/_rels/workbook.xml.rels', d:X1 + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + ark.map(function(a, i){ return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('')
        + '<Relationship Id="rId' + (ark.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'}
    ];
    ark.forEach(function(a, i){ filer.push({n:'xl/worksheets/sheet' + (i + 1) + '.xml', d:a.xml(i === 0)}); });
    filer.push({n:'xl/styles.xml', d:st.xml()});
    return {bytes:zip(filer), navn:'Regnskap-' + aar + '.xlsx', tom:R.tom && B.tom && Fj.tom && ksTom};
  }

  function lastNed(D){
    var bok = bygg(D);
    if(bok.tom) return false;
    var url = URL.createObjectURL(new Blob([bok.bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    var a = document.createElement('a');
    a.href = url; a.download = bok.navn; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
    return true;
  }

  root.HVRegnskapExcel = {bygg:bygg, lastNed:lastNed};
})(typeof window !== 'undefined' ? window : globalThis);
