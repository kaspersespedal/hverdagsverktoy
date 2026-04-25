/* PDF-stiler for Hverdagsverktoy — lonn-etter-skatt rapport.
   Kalles fra shared/core.js generateLonnPdf() via window.PDF_STYLES[key](s, meta).
   s   = window._sal (full breakdown fra calcSal)
   meta = { today, regionLbl, reportId, almSats } */
(function(){
  'use strict';

  // Tall-formatering. core.js definerer global fmt() — gjenbruk hvis tilgjengelig,
  // ellers fallback (pdf-styles.js loader etter core.js, men vaer defensiv).
  var fmt = (typeof window.fmt === 'function')
    ? window.fmt
    : function(n){ return new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0}).format(Math.round(n||0)).replace(/ /g,' '); };

  function palette(){
    var theme = document.documentElement.getAttribute('data-theme')
             || document.body.getAttribute('data-theme')
             || 'carbon';
    if(theme === 'dark'){
      return {
        pageBg:'#141520', surface:'#1c1e2e', surface2:'#242738',
        border:'#2f3450', border2:'#3a4060',
        ink:'#f0f0f5', ink2:'#b0b8cc', ink3:'#6a7494',
        accent:'#6c8aef',
        green:'#4ade80', greenInk:'#86efac', red:'#f87171',
        barPrimary:'#6c8aef', barSecondary:'#8aa4ff',
        heroLbl:'#a5b4fc', zebra:'#20233a'
      };
    }
    return {
      pageBg:null, surface:'#ffffff', surface2:'#f9f6f0',
      border:'#e0e0e0', border2:'#e8dfcc',
      ink:'#1a1a2e', ink2:'#8a8a8a', ink3:'#6a6a6a',
      accent:'#c9a066',
      green:'#5dd47f', greenInk:'#2f9e44', red:'#d94841',
      barPrimary:'#4a6fa5', barSecondary:'#6b8fc9',
      heroLbl:'#8a6d3b', zebra:'#fbf9f5'
    };
  }

  function buildEliteDoc(s, meta){
    var C = palette();
    var today = (meta && meta.today) || new Date().toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'});
    var regionLbl = (meta && meta.regionLbl) || (s.almSats===0.185 ? 'Finnmark/Nord-Troms (18,5 %)' : 'Resten av Norge (22 %)');
    var reportId = (meta && meta.reportId) || ('HV-' + Date.now().toString(36).toUpperCase().slice(-6));

    // Bar-visualisering: proporsjonale barer for skatte-breakdown.
    var barItems = [];
    (s.trinnAmounts || []).forEach(function(t){
      if(t.amt > 0) barItems.push({ lbl:t.lbl, rate:(t.rate*100).toFixed(1).replace('.',',')+' %', amt:t.amt, color:C.barPrimary });
    });
    barItems.push({ lbl:'Trygdeavgift', rate:'7,6 %', amt:s.soc, color:C.barSecondary });
    if(s.bsuKreditt > 0) barItems.push({ lbl:'BSU-fradrag', rate:'-10 %', amt:-s.bsuKreditt, color:C.green });
    var maxBar = Math.max.apply(null, barItems.map(function(b){ return Math.abs(b.amt); }));
    if(!maxBar || !isFinite(maxBar)) maxBar = 1;
    var barWidth = 260;

    function barRow(item){
      var w = Math.max(2, Math.abs(item.amt) / maxBar * barWidth);
      var isNeg = item.amt < 0;
      return [
        { text:[
            { text:item.lbl, bold:true, color:C.ink },
            { text:'  ' + item.rate, fontSize:9, color:C.ink2 }
          ], margin:[0,4,0,0] },
        { canvas:[{ type:'rect', x:0, y:6, w:w, h:8, color:isNeg?C.green:item.color, r:2 }], margin:[0,0,0,0] },
        { text:(isNeg?'- ':'') + fmt(Math.abs(item.amt)), alignment:'right', bold:!isNeg, color:isNeg?C.greenInk:C.ink, margin:[0,4,0,0] }
      ];
    }
    var barRows = barItems.map(barRow);
    barRows.push([
      { text:'TOTAL SKATT', bold:true, color:C.ink, margin:[0,6,0,0] },
      { text:'' },
      { text:fmt(s.tot), alignment:'right', bold:true, fontSize:13, color:C.ink, margin:[0,4,0,0] }
    ]);

    // Fradrag-tabell (zebra).
    var fradragRows = [[
      { text:'POST', bold:true, color:C.ink2, fontSize:8, characterSpacing:1, margin:[0,4,0,4] },
      { text:'BELOP', bold:true, color:C.ink2, fontSize:8, characterSpacing:1, alignment:'right', margin:[0,4,0,4] }
    ]];
    function addFrad(label, amt, isNeg){
      fradragRows.push([
        { text:label, color:C.ink, margin:[0,5,0,5] },
        { text:(isNeg?'- ':'') + fmt(Math.abs(amt)), alignment:'right', color:isNeg?C.red:C.ink, margin:[0,5,0,5] }
      ]);
    }
    addFrad('Bruttolonn', s.b, false);
    addFrad('Minstefradrag (46 %, maks 95 700)', s.mf, true);
    addFrad('Personfradrag 2026', s.pf, true);
    if(s.renteFradrag > 0) addFrad('Rentefradrag', s.renteFradrag, true);
    if(s.fagforening > 0) addFrad('Fagforeningskontingent', s.fagforening, true);
    if(s.ips > 0) addFrad('IPS (pensjonssparing)', s.ips, true);
    if(s.gaver > 0) addFrad('Gaver til veldedighet', s.gaver, true);
    if(s.reise > 0) addFrad('Reisefradrag', s.reise, true);
    fradragRows.push([
      { text:'Alminnelig inntekt', bold:true, fontSize:11, color:C.ink, margin:[0,8,0,8] },
      { text:fmt(s.almInntekt), alignment:'right', bold:true, fontSize:11, color:C.ink, margin:[0,8,0,8] }
    ]);

    return {
      pageSize:'A4',
      pageMargins:[48, 80, 48, 60],
      info:{ title:'Lonn etter skatt — ' + today, author:'Hverdagsverktoy.com', subject:'Skatterapport 2026' },
      background:function(currentPage, pageSize){
        var layers = [];
        if(C.pageBg) layers.push({ canvas:[{ type:'rect', x:0, y:0, w:pageSize.width, h:pageSize.height, color:C.pageBg }] });
        layers.push({ canvas:[{ type:'rect', x:0, y:0, w:pageSize.width, h:4, color:C.accent }] });
        return layers;
      },
      header:function(curr){
        if(curr !== 1) return null;
        return { columns:[
          { text:'HVERDAGSVERKTOY', style:'brandMark', margin:[48,28,0,0] },
          { text:'SKATTERAPPORT · ' + reportId, style:'docMeta', alignment:'right', margin:[0,28,48,0] }
        ]};
      },
      content:[
        { text:'Lonn etter skatt', style:'h1', margin:[0,6,0,2] },
        { text:today + '   ·   ' + regionLbl, style:'sub', margin:[0,0,0,28] },

        { table:{ widths:['*','*'], body:[[
          { stack:[
            { text:'NETTO ARSINNTEKT', style:'heroLbl' },
            { text:fmt(s.net), style:'heroVal' },
            { canvas:[{ type:'line', x1:0, y1:0, x2:30, y2:0, lineWidth:2, lineColor:C.accent }], margin:[0,4,0,8] },
            { text:fmt(s.net/12) + ' per maned', style:'heroSub' },
            { text:fmt(s.net/260) + ' per dag', style:'heroSubMuted' }
          ], fillColor:C.surface2, margin:[22,22,22,22] },
          { stack:[
            { text:'EFFEKTIV SKATTESATS', style:'heroLbl' },
            { text:s.eff.toFixed(1).replace('.',',') + ' %', style:'heroVal' },
            { canvas:[{ type:'line', x1:0, y1:0, x2:30, y2:0, lineWidth:2, lineColor:C.accent }], margin:[0,4,0,8] },
            { text:fmt(s.tot) + ' i total skatt', style:'heroSub' },
            { text:fmt(s.soc) + ' herav trygdeavgift', style:'heroSubMuted' }
          ], fillColor:C.surface2, margin:[22,22,22,22] }
        ]]}, layout:{
          hLineWidth:function(){ return 0; },
          vLineWidth:function(i){ return i===1 ? 0.5 : 0; },
          vLineColor:function(){ return C.border2; }
        }, margin:[0,0,0,32] },

        { text:'SKATTE-BREAKDOWN', style:'sectionLbl' },
        { canvas:[{ type:'line', x1:0, y1:0, x2:499, y2:0, lineWidth:0.8, lineColor:C.accent }], margin:[0,2,0,16] },
        { table:{ widths:[160, 260, 80], body:barRows }, layout:'noBorders', margin:[0,0,0,32] },

        { text:'INNTEKTS-GRUNNLAG', style:'sectionLbl' },
        { canvas:[{ type:'line', x1:0, y1:0, x2:499, y2:0, lineWidth:0.8, lineColor:C.accent }], margin:[0,2,0,12] },
        { table:{ widths:['*', 90], body:fradragRows }, layout:{
          hLineWidth:function(i, n){
            if(i===0 || i===1) return 0.6;
            if(i===n.table.body.length-1 || i===n.table.body.length) return 0.6;
            return 0;
          },
          hLineColor:function(){ return C.accent; },
          vLineWidth:function(){ return 0; },
          fillColor:function(rowIdx){
            if(rowIdx === 0) return null;
            if(rowIdx === fradragRows.length-1) return null;
            return rowIdx % 2 === 0 ? C.zebra : null;
          }
        }, margin:[0,0,0,24] },

        { text:'FORUTSETNINGER', style:'sectionLbl' },
        { canvas:[{ type:'line', x1:0, y1:0, x2:499, y2:0, lineWidth:0.8, lineColor:C.accent }], margin:[0,2,0,10] },
        { columns:[
          { width:'*', ul:[
            'Satser for inntektsaret 2026',
            'Personfradrag: 114 540 kr',
            'Minstefradrag: 46 % (maks 95 700 kr)'
          ], style:'note' },
          { width:'*', ul:[
            'Trygdeavgift: 7,6 % av bruttoinntekt',
            'Alminnelig inntektssats: ' + (s.almSats*100).toFixed(1).replace('.',',') + ' %',
            'BSU: 10 % direkte skattefradrag'
          ], style:'note' }
        ] }
      ],
      footer:function(curr, total){
        return { margin:[48,20,48,0], table:{ widths:['*','auto'], body:[[
          { text:[
              { text:'Hverdagsverktoy.com', bold:true, color:C.ink, fontSize:8 },
              { text:'   ·   veiledende beregning, ikke profesjonell radgivning', color:C.ink3, fontSize:8 }
            ], border:[false,true,false,false], borderColor:[C.border,C.border,C.border,C.border], margin:[0,8,0,0] },
          { text:reportId + '   ·   side ' + curr + ' / ' + total, alignment:'right', color:C.ink3, fontSize:8, border:[false,true,false,false], borderColor:[C.border,C.border,C.border,C.border], margin:[0,8,0,0] }
        ]]}, layout:{
          defaultBorder:false,
          hLineWidth:function(i){ return i===0 ? 0.5 : 0; },
          hLineColor:function(){ return C.border; }
        }};
      },
      styles:{
        brandMark:{ fontSize:9, bold:true, color:C.ink, characterSpacing:2 },
        docMeta:{ fontSize:8, color:C.ink2, characterSpacing:1.2 },
        h1:{ fontSize:32, bold:true, color:C.ink },
        sub:{ fontSize:10, color:C.ink2 },
        sectionLbl:{ fontSize:9, bold:true, color:C.ink, characterSpacing:2, margin:[0,0,0,2] },
        heroLbl:{ fontSize:8, bold:true, color:C.heroLbl, characterSpacing:1.8, margin:[0,0,0,10] },
        heroVal:{ fontSize:36, bold:true, color:C.ink, margin:[0,0,0,0] },
        heroSub:{ fontSize:11, color:C.ink, bold:true },
        heroSubMuted:{ fontSize:10, color:C.ink2, margin:[0,2,0,0] },
        note:{ fontSize:9, color:C.ink2, lineHeight:1.45 }
      },
      defaultStyle:{ fontSize:10, color:C.ink }
    };
  }

  window.PDF_STYLE_ORDER = ['elite'];
  window.PDF_STYLE_LABELS = { elite: 'Profesjonell' };
  window.PDF_STYLES = { elite: buildEliteDoc };
})();
