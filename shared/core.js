// ═══════════════════════════════════════════════════════
// Hverdagsverktøy — core.js
// © 2026 Hverdagsverktøy. All rights reserved.
// https://xn--hverdagsverkty-2qb.no
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
const VALID_LANGS = ['no','en','zh','fr','pl','uk','ar','lt','so','ti'];
if(typeof REGIONS === 'undefined') var REGIONS = {};
let region = (function(){
  // Priority 0: URL path subdirectory (/en/skatt/ → en)
  try { var ps=window.location.pathname.split('/'); if(ps.length>=2&&ps[1].length===2&&VALID_LANGS.indexOf(ps[1])>=0){ var pl=ps[1]; try{localStorage.setItem('hvt-lang',pl);}catch(e){} return pl; } } catch(e){}
  // Priority 1: ?lang= URL parameter (for shared links)
  try { var urlLang = new URLSearchParams(window.location.search).get('lang'); if(urlLang && VALID_LANGS.indexOf(urlLang)>=0) { try{localStorage.setItem('hvt-lang',urlLang);}catch(e){} return urlLang; } } catch(e){}
  // Priority 2: localStorage
  try { const s=localStorage.getItem('hvt-lang'); if(s && VALID_LANGS.indexOf(s)>=0) return s; } catch(e){}
  return 'no';
})();
// Set dir attribute on load for RTL languages
(function(){if(region==='ar'){document.documentElement.setAttribute('dir','rtl');document.documentElement.setAttribute('lang','ar');var s=document.createElement('style');s.textContent='input[inputmode=numeric],input[inputmode=decimal]{direction:ltr}';document.documentElement.appendChild(s);}})();
let _langLoading = {};
function loadLang(code) {
  if(REGIONS[code]) return Promise.resolve();
  if(_langLoading[code]) return _langLoading[code];
  _langLoading[code] = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = '/shared/lang/' + code + '.js?v=v497';
    s.onload = function() { delete _langLoading[code]; resolve(); };
    s.onerror = function() { delete _langLoading[code]; reject(new Error('Failed to load lang: ' + code)); };
    document.head.appendChild(s);
  });
  return _langLoading[code];
}

// Register service worker for offline support
if('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}
// Myk rulling følger «reduser bevegelse»: kall med behavior:'smooth' (her og i sidenes egne skript) blir vanlig rulling.
(function(){
  if(!window.matchMedia||!window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  function calm(o){return(o&&typeof o==='object'&&o.behavior==='smooth')?Object.assign({},o,{behavior:'auto'}):o;}
  var si=Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView=function(o){return si.call(this,calm(o));};
  ['scrollTo','scroll'].forEach(function(n){var f=window[n];window[n]=function(a,b){return typeof a==='object'?f.call(window,calm(a)):f.apply(window,arguments);};});
})();
function R() { const r=REGIONS[region]; if(!r) return REGIONS['no']||{}; return r.base ? Object.assign({},REGIONS[r.base],r) : r; }
function fmt(n) {
  const r=R();
  return new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0}).format(Math.round(n))+'\u00a0'+(r.currency||'kr');
}
function pct(n) { return n.toFixed(1).replace('.',',')+'\u00a0%'; }
function parseNum(id) { const el=document.getElementById(id); return el ? +(el.value.replace(/[\s\u00a0]/g,'').replace(',','.')) || 0 : 0; }
// NB: nb-NO formaterer negative tall med U+2212 MINUS SIGN. Verdien her skrives
// tilbake INN i skjemafelt, og ingen av parserne p\u00e5 nettstedet kjenner U+2212 \u2014
// derfor ble \u2212250 000 lest som 0 (eller +250 000). Skriv ASCII-bindestrek.
function fmtInput(n) { return new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0}).format(n).replace(/\u00a0/g,' ').replace(/\u2212/g,'-'); }
function setEl(id, val) { var el=document.getElementById(id); if(el) el.textContent=val; }
// V12 Fase 3 helpers (Pattern B null-check epidemi):
// getVal — null-safe raw value getter (returnerer fallback hvis element mangler eller value er falsy)
// getChk — null-safe checkbox getter
function getVal(id, fallback) { var el=document.getElementById(id); var v=el?+el.value:NaN; return isNaN(v)?(fallback||0):v; }
function getChk(id) { var el=document.getElementById(id); return el?!!el.checked:false; }
// Live-format number inputs
// Leser teksten i et tallfelt og skriver den pent tilbake: tusenskille i heltallsdelen,
// desimalene beholdes. Komma er desimaltegn. Punktum er tusenskille når det står komma
// i tallet («1.500,50») eller når bare grupper på tre sifre følger («1.000», «2.000.000»);
// ellers er punktum desimaltegn og står som skrevet («1.5»). Før ble alt utenom sifre
// fjernet, så «1 249,50» ble 124 950 (100 ganger for stort).
// Returnerer null når det ikke er noe å formatere ennå («», «-», «,»).
function fmtLiveNum(value) {
  // Unicode-minus/tankestrek (limt inn fra Excel/PDF) må bli ASCII, ellers
  // spises minustegnet og −50 000 blir +50 000.
  var s = String(value).replace(/[−‒-―]/g,'-').replace(/[\s\u00a0\u202f]/g,'');
  var neg = s.charAt(0) === '-';
  var sep = '', i;
  if(s.indexOf(',') > -1) { s = s.replace(/\./g,''); i = s.indexOf(','); sep = ','; }
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) { s = s.replace(/\./g,''); i = -1; }
  else { i = s.indexOf('.'); if(i > -1) sep = '.'; }
  var intPart = (i < 0 ? s : s.slice(0, i)).replace(/\D/g,'');
  var decPart = i < 0 ? '' : s.slice(i + 1).replace(/\D/g,'');
  if(intPart === '' && decPart === '') return null;
  return (neg ? '-' : '') + fmtInput(intPart === '' ? 0 : parseInt(intPart, 10)) + sep + decPart;
}
let _fmtLiveBusy = false;
document.addEventListener('input', function(e) {
  const el = e.target;
  if(_fmtLiveBusy || el.inputMode !== 'numeric') return;
  const out = fmtLiveNum(el.value);
  // Hardt mellomrom som tusenskille (noen sider formaterer selv slik) regnes som ferdig formatert.
  if(out === null || out === el.value.replace(/[\u00a0\u202f]/g,' ')) return;
  const pos = el.selectionStart;
  const oldLen = el.value.length;
  el.value = out;
  const newLen = el.value.length;
  // setSelectionRange kaster på felttyper som ikke støtter markørposisjon.
  try { el.setSelectionRange(pos + newLen - oldLen, pos + newLen - oldLen); } catch(_e){}
  // Sidens egne lyttere har allerede regnet (og lagret) med teksten slik den var før
  // formateringen. Send en ny input-hendelse, så svaret og det som lagres alltid
  // gjelder tallet som står i feltet. Sperren hindrer en evig runddans med sider som
  // selv skriver om feltet (for eksempel med hardt mellomrom som tusenskille).
  _fmtLiveBusy = true;
  try { el.dispatchEvent(new Event('input', {bubbles:true})); } finally { _fmtLiveBusy = false; }
});
// Mens man skriver, kan «1.5» bli «1.500» (tusen), så punktum står urørt. Når feltet
// forlates, er punktum med 1–2 eller 4+ sifre etter et desimaltegn: gjør det til komma,
// som alle sidenes egne tolkere leser riktig.
document.addEventListener('change', function(e) {
  const el = e.target;
  if(el.inputMode !== 'numeric' || !/^-?[\d ]*\.\d+$/.test(el.value)) return;
  el.value = el.value.replace('.', ',');
  el.dispatchEvent(new Event('input', {bubbles:true}));
});

// ═══════════════════════════════════════════════════════
// REGION SWITCH
// ═══════════════════════════════════════════════════════
let _regionSwitchId = 0;
function setRegion(r, e) {
  region = r;
  var switchId = ++_regionSwitchId;
  try { localStorage.setItem('hvt-lang', r); } catch(_e){}
  loadLang(r).then(function() {
    if(switchId !== _regionSwitchId) return; // stale switch, skip
    document.documentElement.classList.remove('lang-loading');
    // RTL support for Arabic
    var isRTL = (r === 'ar');
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', r === 'no' ? 'nb' : r);
    try { if(typeof window.hvtSearchInvalidate==='function') window.hvtSearchInvalidate(); } catch(_e){}
    try { if(typeof window.hvtSearchRebuildChips==='function') window.hvtSearchRebuildChips(); } catch(_e){}
    updateAll();
  }).catch(function() {
    if(switchId !== _regionSwitchId) return;
    // Fallback: switch to Norwegian if language fails to load
    if(r !== 'no') { region = 'no'; updateAll(); }
  });
}
// ═══════════════════════════════════════════════════════
// UPDATE ALL UI
// ═══════════════════════════════════════════════════════
function _uiErr(fn,e){if(typeof console!=='undefined'&&console.error)console.error('[HVT] '+fn+':',e);}
function updateAll() {
  try{updateHero();}catch(e){_uiErr('updateHero',e);}
  try{var _ra=R();var _rc=document.querySelector('.region-cur');if(_rc)_rc.setAttribute('aria-label',_ra.a11yLang||'Velg sprak');var _tp=document.getElementById('theme-picker');if(_tp){var _tb=_tp.querySelector('button');if(_tb)_tb.setAttribute('aria-label',_ra.a11yTheme||'Velg tema');}var _chT=_ra.calcHelpAria||'Vis veiledning';document.querySelectorAll('.calc-help-btn').forEach(function(b){b.setAttribute('aria-label',_chT);b.title=_chT;});var _fcT=_ra.focusLabel||'Fokus';document.querySelectorAll('.focus-card-btn').forEach(function(b){b.setAttribute('aria-label',_fcT);});}catch(e){_uiErr('a11yLbl',e);}
  // Generic placeholder-i18n: handled by _updateI18nPh below via [data-i18n-placeholder] (E108).
  // Hard-coded #search-input handler removed in favor of unified mechanism.
  if(document.getElementById('valgevinst-currency'))try{vgPopulate();}catch(e){_uiErr('vgPopulate',e);}
  try{updateFooter();}catch(e){_uiErr('updateFooter',e);}
  // Standardbeløpet skal kun fylle et TOMT felt. Uten !ma.value overskrev updateAll()
  // brukerens lagrede lånebeløp ved hver sidelast (ikke bare ved språkbytte) på
  // boliglan/mor/, mens resultatpanelet fortsatt viste tall regnet på det gamle beløpet.
  var ma=document.getElementById('m-a');if(ma && !ma.value)ma.value = fmtInput(3000000);
  try{_updateI18nHtml(R());}catch(e){_uiErr('i18nHtml',e);}
  try{_updateI18nText(R());}catch(e){_uiErr('i18nText',e);}
  try{_updateI18nPh(R());}catch(e){_uiErr('i18nPh',e);}
  try{_phObserve();_phSweepAll();}catch(e){_uiErr('phraseSweep',e);}
  _tallSweep();
}

// Swap placeholder-attribute on [data-i18n-placeholder] elements when current lang has an override key.
// Original NO placeholder caches paa el._hvtI18nPhOrig ved forste kjoring og brukes som fallback
// naar R() mangler key (f.eks. bytte tilbake til NO etter EN, eller mangler oversettelse).
// Kjorer ogsa for dynamisk JS-genererte rader (abo/budsjett etc.) — querySelectorAll
// finner dem nye runder pga DOM-mutation. E108 LANG-placeholder-mekanisme.
function _updateI18nPh(r){
  if(!r) return;
  var els=document.querySelectorAll('[data-i18n-placeholder]');
  for(var i=0;i<els.length;i++){
    var el=els[i],key=el.getAttribute('data-i18n-placeholder');
    if(!key) continue;
    if(el._hvtI18nPhOrig===undefined) el._hvtI18nPhOrig=el.getAttribute('placeholder')||'';
    var target=r[key]||el._hvtI18nPhOrig;
    if(el._hvtI18nPhApplied===target) continue;
    el.setAttribute('placeholder',target);
    el._hvtI18nPhApplied=target;
  }
}

// Swap innerHTML on [data-i18n-html] elements when current lang has an override key.
// Original NO HTML caches paa el._hvtI18nHtmlOrig ved forste kjoring og brukes som fallback
// naar R() mangler key (f.eks. bytte tilbake til NO etter EN).
function _updateI18nHtml(r){
  if(!r) return;
  var els=document.querySelectorAll('[data-i18n-html]');
  for(var i=0;i<els.length;i++){
    var el=els[i],key=el.getAttribute('data-i18n-html');
    if(!key) continue;
    if(el._hvtI18nHtmlOrig===undefined) el._hvtI18nHtmlOrig=el.innerHTML;
    var target=r[key]||el._hvtI18nHtmlOrig;
    if(el._hvtI18nHtmlApplied===target) continue;
    el.innerHTML=target;
    el._hvtI18nHtmlApplied=target;
  }
}

// Swap textContent on [data-i18n] elements (excluding those with [data-i18n-html]).
// Brukes av editorial-prototyper (<page>/index-new.html) som annoterer plain-text
// elementer (subtitle, knappe-labels, h3, count-tekst). Same fallback-mønster som
// _updateI18nHtml: original NO caches paa el._hvtI18nTextOrig, brukes naar R() mangler key.
// Bruker textContent (ikke innerHTML) — XSS-trygt + bevarer ikke barn-elementer.
// For oversettelser med inline-markup, bruk data-i18n-html i stedet.
// Skriv teksten uten å ødelegge et eventuelt <svg>-ikon inne i elementet.
// Bakgrunn: fanerekka på 7 sider markerer hver fane med data-i18n, og fanene
// har formen <a data-i18n="tabX"><svg>…</svg>Etikett</a>. `textContent = …`
// sletter alle barn-noder, så ikonene forsvant ~150 ms etter sidelast — hele
// fanerekka så annerledes ut på de sidene enn på de øvrige 63.
// Elementer som IKKE bare har svg-barn beholder nøyaktig gammel oppførsel.
function _setI18nText(el, target){
  var kids = el.children, onlySvg = kids.length > 0;
  for(var k=0; k<kids.length; k++){
    if(String(kids[k].nodeName).toLowerCase() !== 'svg'){ onlySvg = false; break; }
  }
  if(!onlySvg){ el.textContent = target; return; }
  // Bare ikoner som barn: bytt tekstnoden, la ikonet stå. (En <svg> bidrar ikke
  // med tekst, så _hvtI18nTextOrig fanget uansett bare etiketten.)
  for(var n = el.lastChild; n; n = n.previousSibling){
    if(n.nodeType === 3 && n.nodeValue.trim()){ n.nodeValue = target; return; }
  }
  el.appendChild(document.createTextNode(target));
}

function _updateI18nText(r){
  if(!r) return;
  var els=document.querySelectorAll('[data-i18n]:not([data-i18n-html])');
  for(var i=0;i<els.length;i++){
    var el=els[i],key=el.getAttribute('data-i18n');
    if(!key) continue;
    if(el._hvtI18nTextOrig===undefined) el._hvtI18nTextOrig=el.textContent;
    var target=r[key]||el._hvtI18nTextOrig;
    if(el._hvtI18nTextApplied===target) continue;
    // Samme synlige tekst: ikke skriv, ellers forsvinner lenker/<strong>/<em> i elementet.
    if(el.children.length && _tallRen(el.textContent).trim() === _tallRen(target).trim()){ el._hvtI18nTextApplied=target; continue; }
    _setI18nText(el, target);
    el._hvtI18nTextApplied=target;
  }
}

// ═══════════════════════════════════════════════════════
// FRASE-i18n — oversetter tekst som ikke har data-i18n-nøkkel
// ═══════════════════════════════════════════════════════
// Bakgrunn (2026-08-09): de tre mekanismene over dekker bare elementer som er
// merket i HTML. Editorial-redesignen la inn ~4 000 norske tekster i de 71
// kanoniske sidene UTEN merking, så en engelsk bruker så norsk overalt. Å merke
// hvert element ville betydd ~4 000 attributt-innsettinger i 71 filer, og
// elementer som JS skriver resultater inn i måtte ekskluderes manuelt.
//
// I stedet: hver språkfil har en ordbok `_ph` der NØKKELEN er den norske teksten
// («Slik regnes det ut») og verdien er oversettelsen. Vi går over tekstnodene og
// bytter dem som står i ordboka.
//
// Hvorfor det ikke kan ødelegge noe:
//  · Vi husker kildeteksten per node (_hvPhSrc) og hva vi selv skrev (_hvPhOut).
//    Har noen andre (en kalkulator, en render-funksjon) skrevet til noden siden
//    sist, er cur ≠ _hvPhOut, og vi tar den nye teksten som ny kilde. Vi
//    overskriver derfor aldri et regnet resultat med en gammel plassholder.
//  · Treff krever eksakt match på hele den trimmede teksten. Tall og beløp som
//    JS lager, står ikke i ordboka og blir stående.
//  · Mangler oversettelsen, blir norsk stående. Ingenting blir tomt.
// Kjører etter de nøkkelbaserte passene, så et ekte data-i18n-treff vinner.
var _phBusy=false, _phObs=null, _phQueued=false, _phRoots=[];
function _phDict(){ var r=R(); return (r && r._ph) || null; }

// Bytt ut teksten, men behold whitespace rundt (linjeskift/innrykk i HTML-kilden).
function _phSwap(src, hit){
  var key=src.trim(), i=src.indexOf(key);
  return src.slice(0,i) + hit + src.slice(i+key.length);
}

var _PH_SKIP_PARENT={SCRIPT:1,STYLE:1,TEXTAREA:1,NOSCRIPT:1,TEMPLATE:1,CODE:1,svg:1,title:1};
// Innhold som bare finnes på norsk merkes data-ph-skip, så enkeltord ikke oversettes midt i norsk tekst.
function _phSkip(n){ var p=n&&n.parentNode; return !!(p && (_PH_SKIP_PARENT[p.nodeName] || (p.closest && p.closest('[data-ph-skip]')))); }
function _phText(node, dict){
  var cur=node.nodeValue;
  if(node._hvPhOut!==cur) node._hvPhSrc=cur;   // noen andre skrev til noden → ny kilde
  var src=node._hvPhSrc, key=src.trim();
  if(key.length<2) return;
  var hit=dict && dict[key];
  var next=hit ? _phSwap(src,hit) : src;
  // Bare hårde mellomrom skiller (_tallSweep har vært her): ikke skriv råteksten tilbake.
  if(next!==cur && _tallRen(next)===_tallRen(cur)) next=cur;
  if(next!==cur) node.nodeValue=next;
  node._hvPhOut=next;
}

var _PH_ATTRS=['placeholder','aria-label','title','alt'];
function _phAttrs(el, dict){
  for(var a=0;a<_PH_ATTRS.length;a++){
    var name=_PH_ATTRS[a];
    if(!el.hasAttribute(name)) continue;
    // data-i18n-placeholder eier placeholder-attributtet på de feltene som har den.
    if(name==='placeholder' && el.hasAttribute('data-i18n-placeholder')) continue;
    var store='_hvPhA_'+a, cur=el.getAttribute(name);
    if(el[store+'o']!==cur) el[store]=cur;
    var src=el[store], key=(src||'').trim();
    if(key.length<2) continue;
    var hit=dict && dict[key];
    var next=hit ? _phSwap(src,hit) : src;
    if(next!==cur) el.setAttribute(name,next);
    el[store+'o']=next;
  }
}

function _phSweep(root, dict){
  if(!root) return;
  if(root.nodeType===3){ if(!_phSkip(root)) _phText(root,dict); return; }
  if(root.nodeType!==1 && root.nodeType!==9) return;
  var walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode:function(n){
      return _phSkip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  for(var n=walker.nextNode(); n; n=walker.nextNode()) _phText(n,dict);
  if(root.nodeType===1 && !(root.closest && root.closest('[data-ph-skip]'))) _phAttrs(root,dict);
  var els=root.querySelectorAll('[placeholder],[aria-label],[title],[alt]');
  for(var i=0;i<els.length;i++) if(!els[i].closest('[data-ph-skip]')) _phAttrs(els[i],dict);
}

function _phSweepAll(roots){
  var dict=_phDict();
  // Ingen ordbok (norsk, eller språk uten `_ph`): kjør likevel én gang for å
  // føre tilbake det vi eventuelt har oversatt tidligere i økta.
  _phBusy=true;
  try{
    var list=roots&&roots.length?roots:[document.body];
    for(var i=0;i<list.length;i++) _phSweep(list[i],dict);
    if(document.title){
      if(document._hvPhOut!==document.title) document._hvPhSrc=document.title;
      var t=dict&&dict[document._hvPhSrc.trim()];
      document.title=document._hvPhOut=(t?_phSwap(document._hvPhSrc,t):document._hvPhSrc);
    }
  }catch(e){ _uiErr('phraseI18n',e); }
  finally{ if(_phObs) _phObs.takeRecords(); _phBusy=false; }
}

// Kalkulatorene bygger resultat-DOM etter at siden er lastet. Observatøren fanger
// den nye teksten. Egne skrivinger drenerer vi ut via takeRecords() over, så det
// blir ingen evig runddans.
function _phObserve(){
  if(_phObs || typeof MutationObserver!=='function' || !document.body) return;
  _phObs=new MutationObserver(function(muts){
    if(_phBusy) return;
    for(var i=0;i<muts.length;i++){
      var m=muts[i];
      if(m.type==='characterData') _phRoots.push(m.target);
      else for(var j=0;j<m.addedNodes.length;j++) _phRoots.push(m.addedNodes[j]);
    }
    if(!_phRoots.length) return;
    // Uten ordbok (norsk) er det bare tallene som skal rettes. Det skjer med en gang: venter vi på neste
    // animasjonsramme, må nettleseren legge ut siden én gang til når teksten ble skrevet inne i en ramme.
    if(!_phDict()){ var nye=_phRoots; _phRoots=[]; _tallSweep(nye); return; }
    if(_phQueued) return;
    _phQueued=true;
    requestAnimationFrame(function(){
      _phQueued=false;
      var roots=_phRoots; _phRoots=[];
      if(_phDict()) _phSweepAll(roots);
      _tallSweep(roots);
    });
  });
  _phObs.observe(document.body,{childList:true,subtree:true,characterData:true});
}

// ═══════════════════════════════════════════════════════
// TALL OG ENHET — hårde mellomrom i all synlig tekst
// ═══════════════════════════════════════════════════════
// Uten dette deles tall over to linjer: «27 / 500 kr», «25 000 / kr», «§ 17- / 1».
// Teksten kommer fra HTML, språkfilene og sidenes egne fmtKr(), så den rettes der alt
// havner til slutt: i tekstnodene. Bare mellomrom og streker rundt tall endres.
//  · Vi skriver bare ved endring. Går på samme observatør og animasjonsramme som frase-i18n.
//    Egne skrivinger drenes med takeRecords(), så det blir ingen runddans.
//  · Kode som leser tekst tilbake må tåle U+00A0 og U+2060: bruk _tallRen().
var _TALL_ROM='[ \\t\\r\\n]+';
var _TALL_ENHET='kr|kroner|krone|øre|nok|usd|eur|sek|dkk|gbp|%|prosent|prosentpoeng|pp|percent|'+
  'år|mnd|måned|måneder|uke|uker|dag|dager|time|timer|t|min|minutter|'+
  'km|m|m2|m3|mm|kg|g|l|stk|ganger|x|×|barn|ansatte|aksje|aksjer|person|mill|million|millioner|'+
  'year|years|month|months|week|weeks|day|days|hour|hours|minutes|times|employees|shares|children';
var _TALL_FORAN='§§?|\\b(?:kr\\.?|nok|nr\\.?|kap\\.?|ca\\.?|kl\\.?)';
var _TALL_REGLER=[
  [new RegExp('(\\d)'+_TALL_ROM+'(?=\\d{3}(?!\\d))','g'),'$1\u00a0'],                                 // 27 500
  [new RegExp('(\\d)'+_TALL_ROM+'(?=(?:'+_TALL_ENHET+')(?![A-Za-zÀ-ɏ0-9]))','gi'),'$1\u00a0'],        // 500 kr, 4,0 %
  [new RegExp('('+_TALL_FORAN+')'+_TALL_ROM+'(?=[-−]?\\d)','gi'),'$1\u00a0'],                         // kr 500, § 17, ca. 5
  [new RegExp('\\b(mill\\.?|millioner)'+_TALL_ROM+'(?=(?:kr|kroner|nok)\\b)','gi'),'$1\u00a0'],       // 7 mill. kr
  [/(\d[-–—]|[A-Za-zÀ-ɏ]-)(?=\d)|(\d-)(?=[A-Za-zÀ-ɏ])/g,'$1$2\u2060'],                                // 17-1, 1 200–1 300, LOV-1999, 5-årig
  [new RegExp('(^|[\\s(])([=≈≤≥×÷+−])'+_TALL_ROM+'(?=\\S)','g'),'$1$2\u00a0'],                        // = 500, − 500: regnetegnet følger tallet
  [/(^|[^A-Za-zÀ-ɏ0-9])([A-ZÆØÅ]{1,5}|[a-zæøå])-(?=[A-Za-zÀ-ɏ])/g,'$1$2-\u2060'],                        // e-post, a-melding, NAV-dager, ETF-er: kort forledd deles ikke
  [new RegExp('([^\\s])'+_TALL_ROM+'(?=[—–]'+_TALL_ROM+')','g'),'$1\u00a0'],                            // «tekst — tekst»: ingen linje starter med tankestrek
  [new RegExp('\\b(eks\\.?|inkl\\.?)'+_TALL_ROM+'(?=mva\\b)','gi'),'$1\u00a0'],                         // eks. MVA
  [new RegExp('([^\\s])'+_TALL_ROM+'(?=-[A-Za-zÀ-ɏ])','g'),'$1\u00a0']                                 // «og -rett»: bindestrek-ordet følger ordet foran
];
var _TALL_HINT=/[\d=≈≤≥×÷+−—–-]/;
function _tallFix(s){
  if(!_TALL_HINT.test(s)) return s;
  for(var i=0;i<_TALL_REGLER.length;i++) s=s.replace(_TALL_REGLER[i][0],_TALL_REGLER[i][1]);
  return s;
}
// Tilbake til vanlig tekst, for sammenligning og for det som forlater siden.
function _tallRen(s){ return String(s).replace(/\u2060/g,'').replace(/\s+/g,' '); }

var _TALL_SKIP='script,style,noscript,template,textarea,select,option,code,pre,svg,[contenteditable]';
function _tallSkip(el){ return !el || !el.closest || !!el.closest(_TALL_SKIP); }
// Samme bokføring som _phText: kildeteksten overlever, så frase-oppslaget fortsatt treffer.
function _tallSett(n,v){
  var cur=n.nodeValue;
  if(v===cur) return;
  if(n._hvPhOut!==cur) n._hvPhSrc=cur;
  n._hvPhOut=v;
  n.nodeValue=v;
}

// Stort tall alene i boksen sin (svaret i kalkulatoren): vanlige mellomrom. Det står alene på linja og
// brytes bare når det ikke får plass, og da er «1 234 567 / kr» bedre enn at tallet stikker ut av kortet.
var _TALL_ALENE=/^\s*[−+-]?\d[\d\s.,]*\D{0,12}$/;
function _tallStorBoks(n){
  var p=n.parentNode, b=p;
  if(parseFloat(getComputedStyle(p).fontSize)<20) return false;
  while(b && b.nodeType===1 && getComputedStyle(b).display==='inline') b=b.parentNode;
  return !!b && b.nodeType===1 && b.textContent.length<=30 && _TALL_ALENE.test(b.textContent);
}
function _tallStore(alene){
  try{
    for(var k=0;k<alene.length;k++){
      var t=alene[k];
      if(document.documentElement.dir!=='rtl' && t.nodeValue.indexOf('\u00a0')>=0 && !_tallSkip(t.parentNode) && _tallStorBoks(t)) _tallSett(t,t.nodeValue.replace(/\u00a0/g,' '));
    }
  }catch(e){ _uiErr('tall',e); }
  finally{ if(_phObs) _phObs.takeRecords(); }
}
function _tallSweep(roots){
  var alene=[];
  try{
    var list=roots||[document.body];
    for(var i=0;i<list.length;i++){
      var r=list[i], w=r.nodeType===1?document.createTreeWalker(r,NodeFilter.SHOW_TEXT,null):null;
      for(var n=w?w.nextNode():(r.nodeType===3?r:null);n;n=w?w.nextNode():null){
        if(!n.parentNode || n.parentNode.nodeName==='SCRIPT' || n.parentNode.nodeName==='STYLE') continue;
        var cur=n.nodeValue, next=_tallFix(cur);
        if(next!==cur && !_tallSkip(n.parentNode)) _tallSett(n,next);
        if(next.length<=30 && _TALL_ALENE.test(next)) alene.push(n);
      }
    }
  }catch(e){ _uiErr('tall',e); }
  finally{ if(_phObs) _phObs.takeRecords(); }
  // Første runde: stilen er ikke regnet ut ennå, så de store tallene venter til nettleseren uansett gjør det.
  if(roots) _tallStore(alene);
  else requestAnimationFrame(function(){ _tallStore(alene); });
}
// Kopiering fra siden: U+2060 skal ikke følge med ut.
document.addEventListener('copy',function(e){
  var s=window.getSelection&&window.getSelection(), t=s?String(s):'';
  if(t.indexOf('\u2060')<0 || !e.clipboardData || !s.rangeCount) return;
  var d=document.createElement('div');
  d.appendChild(s.getRangeAt(0).cloneContents());
  e.clipboardData.setData('text/plain',t.replace(/\u2060/g,'').replace(/\u00a0/g,' '));
  e.clipboardData.setData('text/html',d.innerHTML.replace(/\u2060/g,''));
  e.preventDefault();
});

function updateHero() {
  const r = R();
  setText('skip-link', r.skipLink || 'Hopp til hovedinnhold');
}

function updateFooter() {
  const r = R();
  const yr = new Date().getFullYear();
  // Frosne språkkopier ligger under /xx/ og har ingen egen /xx/om/-side.
  // De ble tidligere gjenkjent på at de hadde personvern-modalen i markupen;
  // den er fjernet (den påsto at ingen data forlater enheten, noe som var galt),
  // så kopiene må nå gjenkjennes eksplisitt på stien.
  const _p1 = window.location.pathname.split('/')[1] || '';
  const isFrozenCopy = _p1.length === 2 && VALID_LANGS.indexOf(_p1) >= 0;
  // «Om» sto ikke i footer-markupen på noen kanonisk side, så /om/ hadde null
  // inngående lenker og var usynlig for både brukere og søkemotorer. Lenka
  // settes inn her — ikke i 65 HTML-filer — og får id-en setText allerede
  // fyller tekst i. Hopper over de frosne kopiene: der finnes ingen /xx/om/.
  if(!isFrozenCopy){
    document.querySelectorAll('.foot-links').forEach(function(box){
      if(box.querySelector('#fl-about')) return;
      const first = box.querySelector('a'); if(!first) return;
      const a = document.createElement('a');
      a.id = 'fl-about';
      a.href = '/om/';
      // Matcher separator-stilen siden bruker: <span class="foot-sep"> med mellomrom
      // rundt, « · » som tekst, eller ingen separator (da styrer gap/padding avstanden).
      const sepSrc = box.querySelector('.foot-sep');
      const hadDot = box.textContent.indexOf('·') >= 0;
      const addSep = function(){
        if (sepSrc) {
          box.insertBefore(document.createTextNode(' '), first);
          box.insertBefore(sepSrc.cloneNode(true), first);
          box.insertBefore(document.createTextNode(' '), first);
        } else if (hadDot) {
          box.insertBefore(document.createTextNode(' · '), first);
        }
      };
      box.insertBefore(a, first);
      addSep();
      // «Ordliste» rett etter «Om» — samme grep, så ingen av HTML-filene må redigeres
      const ord = document.createElement('a');
      ord.id = 'fl-ord';
      ord.href = '/ordliste/';
      box.insertBefore(ord, first);
      addSep();
    });
  }
  setText('fl-about', r.footerAbout||'About');
  setText('fl-ord', r.footerOrd||'Ordliste');
  setText('fl-priv', r.footerPriv||'Privacy');
  setText('fl-con', r.footerCon||'Contact');
  setText('fl-author', r.footerAuthor||'Hverdagsverktøy — gratis norske finanskalkulatorer');
  // Bytt KUN copyright-året. footerCopy inneholder også et sats-år ("… per mars 2026"),
  // og en global /2026/g rullet begge — fra 1.1. ville alle sidene påstått "per mars 2027"
  // uten at én sats var oppdatert. Alle 10 språkfiler starter strengen med "© 2026 ".
  setText('fl-copy', (r.footerCopy||'© 2026 Hverdagsverktøy').replace(/(©\s*)\d{4}/, '$1'+yr));
  // footerCopy already carries the full disclaimer — hide the standalone fl-disc so the
  // "Veiledende beregninger … ikke profesjonell rådgivning" line isn't shown twice.
  const discEl = document.getElementById('fl-disc');
  if(discEl) discEl.style.display = 'none';
  // Fot-lenkene skal peke på ekte sider. Markupen varierer mellom sidene:
  // landings bruker id="fl-con", kalkulatorsidene id="fl-cont", og fire sider har
  // bare data-i18n — derfor treffes alle variantene her, så ingen av de 65 HTML-filene
  // må redigeres. Personvern peker nå alltid på /personvern/ — den er eneste
  // kilde til sannhet og oversettes i drift.
  document.querySelectorAll('#fl-priv,[data-i18n="footerPriv"]').forEach(function(a){
    a.onclick = null;
    a.setAttribute('href', '/personvern/');
  });
  document.querySelectorAll('#fl-con,#fl-cont,[data-i18n="footerCon"]').forEach(function(a){
    a.onclick = null;
    a.setAttribute('href', '/kontakt/');
  });
  setText('seo-toggle', r.seoToggle||'Om denne siden');
}

function setText(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }

// ═══════════════════════════════════════════════════════
// RULLING — scrollToEl brukes av finanskalkulatoren (fcCalc), _scrollInstant ved sidelast
// ═══════════════════════════════════════════════════════

function stickyOffset(){
  const h=document.querySelector('header');
  const n=document.querySelector('.calc-nav');
  const mmb=document.querySelector('.mobile-mode-bar');
  const mfc=document.getElementById('mobile-focus-close');
  return (h?h.offsetHeight:0)+(n&&n.style.display!=='none'?n.offsetHeight:0)+(mmb&&window.getComputedStyle(mmb).display!=='none'?mmb.offsetHeight:0)+(mfc&&window.getComputedStyle(mfc).display!=='none'?mfc.offsetHeight:0)+12;
}
var _scrollId=0; // cancellation token for all programmatic scrolls
function _cancelScroll(){_scrollId++;}
// Cancel programmatic scroll on user touch/wheel/keyboard
(function(){
  var opts={passive:true};
  window.addEventListener('wheel',_cancelScroll,opts);
  window.addEventListener('touchstart',_cancelScroll,opts);
  window.addEventListener('keydown',function(e){
    if(e.key==='ArrowUp'||e.key==='ArrowDown'||e.key==='PageUp'||e.key==='PageDown'||e.key===' ')_cancelScroll();
  },opts);
})();
// Safari 15.0-15.3 ignores scrollTo({behavior:'instant'}); fallback temporarily
// overrides CSS scroll-behavior and uses plain scroll calls.
function _scrollInstant(op){
  var el=document.documentElement;
  var prev=el.style.scrollBehavior;
  el.style.scrollBehavior='auto';
  try { op(); } finally { el.style.scrollBehavior=prev; }
}

function _animateScroll(targetY,dur,id,cb){
  var startY=window.scrollY;
  var dist=targetY-startY;
  if(Math.abs(dist)<3){if(cb)cb();return;}
  var start=null;
  var htmlEl=document.documentElement;
  var prevSB=htmlEl.style.scrollBehavior;
  htmlEl.style.scrollBehavior='auto';
  function ease(t){return t<0.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;}
  function step(ts){
    if(id!==_scrollId){htmlEl.style.scrollBehavior=prevSB;return;}
    if(!start)start=ts;
    var p=Math.min((ts-start)/dur,1);
    window.scrollTo(0, startY+dist*ease(p));
    if(p<1) requestAnimationFrame(step);
    else { htmlEl.style.scrollBehavior=prevSB; if(cb) cb(); }
  }
  requestAnimationFrame(step);
}
function scrollToEl(el,mode){
  if(!el)return;
  // V11 E-fix: skip scroll during language-change recalc to avoid jumping back to result section
  if(window._hvtLangRecalcActive)return;
  _cancelScroll();
  var id=_scrollId;
  var off=stickyOffset();
  if(mode==='top'){
    var top=Math.max(0,el.getBoundingClientRect().top+window.scrollY-off);
    _animateScroll(top,300,id);
  } else {
    var rect=el.getBoundingClientRect();
    var vH=window.innerHeight;
    if(rect.top<off||rect.bottom>vH){
      var top2=Math.max(0,el.getBoundingClientRect().top+window.scrollY-off);
      _animateScroll(top2,300,id);
    }
  }
}
// VALGEVINST: Valutagevinst
function vgPopulate(){
  const sel=document.getElementById('valgevinst-currency');
  if(!sel) return;
  const prev=sel.value||'EUR';
  sel.innerHTML='';
  getCcCurrencies().filter(c=>c[0]!=='NOK').forEach(c=>{
    const opt=document.createElement('option');
    opt.value=c[0]; opt.textContent=c[1];
    sel.appendChild(opt);
  });
  sel.value=prev;
}
// ═══════════════════════════════════════════════════════
// VALUTALISTE — fyller valgene i kalkulator/valgevinst (vgPopulate)
// ═══════════════════════════════════════════════════════
const ccCurrenciesNO = ['Norske kroner','Euro','Amerikanske dollar','Britiske pund','Svenske kroner','Danske kroner','Polske zloty','Sveitsiske franc','Japanske yen','Kinesiske yuan','Kanadiske dollar','Australske dollar','Indiske rupi','Tyrkiske lira','Brasilianske real'];
const ccCurrencyCodes = ['NOK','EUR','USD','GBP','SEK','DKK','PLN','CHF','JPY','CNY','CAD','AUD','INR','TRY','BRL'];
const ccCurrencyFlags = ['no','eu','us','gb','se','dk','pl','ch','jp','cn','ca','au','in','tr','br'];
function getCcCurrencies(){ const r=R(); const names=r.ccCurrNames||ccCurrenciesNO; return ccCurrencyCodes.map((code,i)=>[code,code+' — '+(names[i]||ccCurrenciesNO[i]),ccCurrencyFlags[i]]); }
// ═══════════════════════════════════════════════════════
// FINANCE CALCULATOR
// ═══════════════════════════════════════════════════════
function getFcConfigs() {
  const r = R();
  return {
    tvm: {
      label: r.fcTvm||'Present value / Future value (TVM)',
      fields: [
        {id:'fc-pv',label:r.fcPv||'Present value (PV)',val:'10000'},
        {id:'fc-rate',label:r.fcRate||'Annual interest (%)',val:'5'},
        {id:'fc-n',label:r.fcYears||'Number of years',val:'10'},
        {id:'fc-pmt',label:r.fcPmt||'Annual payment',val:'0'}
      ]
    },
    margin: {
      label: r.fcMargin||'Margin & Markup',
      fields: [
        {id:'fc-cost',label:r.fcCost||'Cost price',val:'500'},
        {id:'fc-sell',label:r.fcSell||'Selling price',val:'800'}
      ]
    },
    breakeven: {
      label: r.fcBe||'Break-even',
      fields: [
        {id:'fc-fixed',label:r.fcFixed||'Fixed costs',val:'100000'},
        {id:'fc-price',label:r.fcPriceU||'Selling price per unit',val:'250'},
        {id:'fc-varcost',label:r.fcVarCost||'Variable cost per unit',val:'150'}
      ]
    },
    compound: {
      label: r.fcCompound||'Compound interest',
      fields: [
        {id:'fc-princ',label:r.fcPrinc||'Starting amount',val:'100000'},
        {id:'fc-crate',label:r.fcRate||'Annual interest (%)',val:'7'},
        {id:'fc-cyears',label:r.fcYears||'Number of years',val:'20'},
        {id:'fc-cfreq',label:r.fcFreq||'Interest payments per year',val:'12'}
      ]
    },
    discount: {
      label: r.fcDiscount||'Discount calculation',
      fields: [
        {id:'fc-orig',label:r.fcOrig||'Original price',val:'1000'},
        {id:'fc-disc',label:r.fcDiscPct||'Discount (%)',val:'25'}
      ]
    }
  };
}
function fcPopulateSelect(){
  const cfgs = getFcConfigs();
  const sel = document.getElementById('fc-type');
  if(!sel) return;
  const cur = sel.value || 'tvm';
  sel.innerHTML = '';
  for(const [k,v] of Object.entries(cfgs)){
    const o = document.createElement('option');
    o.value = k; o.textContent = v.label;
    sel.appendChild(o);
  }
  sel.value = cur;
}
function fcUpdateFields(){
  var _fct=document.getElementById('fc-type');const type=_fct?_fct.value:'pv';
  const cfg = getFcConfigs()[type];
  const container = document.getElementById('fc-fields');
  if(!container) return;
  container.innerHTML = '';
  cfg.fields.forEach(f => {
    const isRate = f.id.includes('rate');
    // for=/id= kobler etiketten til feltet — uten den hadde de 4 feltene på
    // /kalkulator/finance/ ingen tilgjengelig navn i det hele tatt.
    container.innerHTML += `<div class="fg"><label class="flbl" for="${f.id}">${f.label}</label><input class="fc" type="text" ${isRate?'':'inputmode="numeric"'} id="${f.id}" value="${isRate ? f.val : fmtInput(f.val)}"></div>`;
  });
  document.getElementById('fc-result').classList.add('hidden');
}

function fcCalc(){
  // V12 Fase 3 Pattern B: null-safe DOM access
  var _ft=document.getElementById('fc-type');
  if(!_ft) return;
  const type = _ft.value;
  const g = id => { var el=document.getElementById(id); return el?(parseFloat(el.value.replace(/[\s\u00a0]/g,'').replace(',','.'))||0):0; };
  const resLbl = document.getElementById('fc-res-lbl');
  const resVal = document.getElementById('fc-res-val');
  const resSub = document.getElementById('fc-res-sub');
  const resGrid = document.getElementById('fc-res-grid');
  const r = R();
  if(resGrid) resGrid.innerHTML = '';
  if(resSub) resSub.textContent = '';

  if(type==='tvm'){
    const pv=g('fc-pv'), rate=g('fc-rate')/100, n=g('fc-n'), pmt=g('fc-pmt');
    const factor = Math.pow(1+rate, n);
    const fv = pmt===0 ? pv*factor : (rate===0 ? pv + pmt*n : pv*factor + pmt*(factor-1)/rate);
    const totalPmt = pmt*n;
    const interest = fv - pv - totalPmt;
    resLbl.textContent = r.fcRFv||'Future value (FV)';
    resVal.textContent = fmt(fv);
    resSub.textContent = (r.fcRAfter||'After') + ' ' + n + ' ' + (r.fcRYr||'years');
    const invested = pv + totalPmt;   // avkastning = renter delt på alt som er satt inn, ikke bare startbeløpet
    const tvmReturn = invested>0 ? pct(interest/invested*100) : '—';
    resGrid.innerHTML = `
      <div class="rt"><div class="rt-lbl">${r.fcRStart||'Starting amount'}</div><div class="rt-val">${fmt(pv)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRTotalPmt||'Total payments'}</div><div class="rt-val">${fmt(totalPmt)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRInterest||'Interest earned'}</div><div class="rt-val">${fmt(interest)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRReturn||'Total return'}</div><div class="rt-val">${tvmReturn}</div></div>`;
  }
  else if(type==='margin'){
    const cost=g('fc-cost'), sell=g('fc-sell');
    if(cost<0 || sell<0) return;
    const profit = sell - cost;
    const margin = sell!==0 ? (profit/sell)*100 : 0;
    const markup = cost!==0 ? (profit/cost)*100 : 0;
    resLbl.textContent = r.fcRProfit||'Profit';
    resVal.textContent = fmt(profit);
    resGrid.innerHTML = `
      <div class="rt"><div class="rt-lbl">Margin</div><div class="rt-val">${pct(margin)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRMarkup||'Markup'}</div><div class="rt-val">${pct(markup)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcCost||'Cost price'}</div><div class="rt-val">${fmt(cost)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcSell||'Selling price'}</div><div class="rt-val">${fmt(sell)}</div></div>`;
  }
  else if(type==='breakeven'){
    const fixed=g('fc-fixed'), price=g('fc-price'), vc=g('fc-varcost');
    const contribution = price - vc;
    const units = contribution > 0 ? Math.ceil(+(fixed / contribution).toFixed(9)) : Infinity;
    const revenue = units * price;
    resLbl.textContent = r.fcRBePoint||'Break-even point';
    resVal.textContent = units === Infinity ? '∞' : fmtInput(units) + ' ' + (r.fcRUnits||'units');
    resGrid.innerHTML = `
      <div class="rt"><div class="rt-lbl">${r.fcRRevenue||'Required revenue'}</div><div class="rt-val">${fmt(revenue)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRContrib||'Contribution per unit'}</div><div class="rt-val">${fmt(contribution)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcFixed||'Fixed costs'}</div><div class="rt-val">${fmt(fixed)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRContribMarg||'Contribution margin'}</div><div class="rt-val">${price!==0 ? pct((contribution/price)*100) : '—'}</div></div>`;
  }
  else if(type==='compound'){
    const p=g('fc-princ'), rate=g('fc-crate')/100, y=g('fc-cyears'), freq=g('fc-cfreq')||1;
    const total = p * Math.pow(1 + rate/freq, freq*y);
    const interest = total - p;
    const logBase = Math.log(1 + rate/freq);
    const doubling = logBase > 0 ? Math.log(2) / logBase / freq : Infinity;
    resLbl.textContent = r.fcREndVal||'Final value';
    resVal.textContent = fmt(total);
    // Frekvensteksten må følge feltet: 12 = månedlig, 4 = kvartalsvis, 1 = årlig. Andre tall: ingen tekst.
    const freqTxt = freq===12 ? (r.fcRMonthly||'with monthly interest') : freq===4 ? (r.fcRQuarterly||'') : freq===1 ? (r.fcRYearly||'') : '';
    resSub.textContent = (r.fcRAfter||'After') + ' ' + y + ' ' + (r.fcRYr||'years') + (freqTxt ? ' ' + freqTxt : '');
    const compReturn = p!==0 ? pct((total/p-1)*100) : '—';
    const doublingStr = isFinite(doubling) && doubling > 0 ? doubling.toFixed(1).replace('.',',') + ' ' + (r.fcRYr||'years') : '—';
    resGrid.innerHTML = `
      <div class="rt"><div class="rt-lbl">${r.fcRStart||'Starting amount'}</div><div class="rt-val">${fmt(p)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRInterest||'Interest earned'}</div><div class="rt-val">${fmt(interest)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRReturn||'Total return'}</div><div class="rt-val">${compReturn}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRDoubling||'Doubling after'}</div><div class="rt-val">${doublingStr}</div></div>`;
  }
  else if(type==='discount'){
    const orig=g('fc-orig'), disc=Math.min(Math.max(g('fc-disc'),0),100);
    const saved = orig * disc / 100;
    const final = orig - saved;
    resLbl.textContent = r.fcRDiscPrice||'Price after discount';
    resVal.textContent = fmt(final);
    resGrid.innerHTML = `
      <div class="rt"><div class="rt-lbl">${r.fcOrig||'Original price'}</div><div class="rt-val">${fmt(orig)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRSaved||'You save'}</div><div class="rt-val">${fmt(saved)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRDiscount||'Discount'}</div><div class="rt-val">${pct(disc)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcRYouPay||'You pay'}</div><div class="rt-val">${pct(100-disc)} ${r.fcROfPrice||'of the price'}</div></div>`;
  }
  document.getElementById('fc-result').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('fc-result'),'nearest'),80);
}

// Fyller valgene i finanskalkulatoren og valutagevinst-kalkulatoren (gjør ingenting på andre sider).
fcPopulateSelect();
fcUpdateFields();
vgPopulate();
// ═══════════════════════════════════════════════════════
// ENTER-TASTEN
// ═══════════════════════════════════════════════════════
// Enter i et felt utenfor <form>, og på elementer som ikke er lenker eller knapper, gjør
// ingenting. Kalkulatorene regner selv mens man skriver.
document.addEventListener('keydown', function(e){
  if(e.key!=='Enter') return;
  var tag=e.target.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') {
    if(!e.target.closest('form')) e.preventDefault();
    return;
  }
  // Enter skal virke som vanlig på lenker, knapper, <summary> og elementer med rolle (WCAG 2.1.1)
  if(e.target.closest&&e.target.closest('a[href],button,summary,[role="button"],[role="tab"],[role="link"],[role="menuitem"],[role="option"],[contenteditable="true"]'))return;
  e.preventDefault();
});

// ═══════════════════════════════════════════════════════
// TILSTAND PÅ FOKUS- OG VEILEDNINGSKNAPPENE (aria-pressed / aria-expanded)
// Sidene bytter selv klassene; her holdes aria-attributtene i takt for alle sidene.
// ═══════════════════════════════════════════════════════
(function(){
  function syncFocusBtns(){
    var on=document.body.classList.contains('focus-mode')?'true':'false';
    document.querySelectorAll('.focus-card-btn').forEach(function(b){b.setAttribute('aria-pressed',on);});
  }
  function initToggleState(){
    document.querySelectorAll('.calc-help-btn').forEach(function(b){if(!b.hasAttribute('aria-expanded'))b.setAttribute('aria-expanded','false');});
    syncFocusBtns();
    new MutationObserver(syncFocusBtns).observe(document.body,{attributes:true,attributeFilter:['class']});
  }
  // Veiledningsknappen: har sidens egen kode ikke endret aria-expanded under klikket, snus den her.
  var _helpBefore=null;
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.calc-help-btn');_helpBefore=b?b.getAttribute('aria-expanded'):null;},true);
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.calc-help-btn');
    if(b&&b.getAttribute('aria-expanded')===_helpBefore)b.setAttribute('aria-expanded',_helpBefore==='true'?'false':'true');
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initToggleState);else initToggleState();
})();

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
if('scrollRestoration' in history) history.scrollRestoration = 'manual';
// CSV-nedlasting: brukt av boliglan/mor, personlig/abo og personlig/bil (_csvDate også av flere).
function downloadCSV(rows,filename){
  var sep=';';
  var csv=rows.map(function(r){return r.map(function(c){var s=String(c==null?'':c);return s.indexOf(sep)>=0||s.indexOf('"')>=0?'"'+s.replace(/"/g,'""')+'"':s;}).join(sep);}).join('\r\n');
  var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
function _csvDate(){var loc={'en':'en-GB','ar':'ar-SA','zh':'zh-CN','fr':'fr-FR','pl':'pl-PL','uk':'uk-UA','lt':'lt-LT','so':'so-SO','ti':'ti-ER'}[region]||'nb-NO';return new Date().toLocaleDateString(loc,{year:'numeric',month:'long',day:'numeric'});}

// Page initialization — called by each page after DOM is ready
function initPage(){
  // Load active language, then initialize.
  // If the active language fails to load we fall back to Norwegian and log a
  // warning so the silent reset isn't invisible to the user/developer.
  var requestedRegion = region;
  loadLang(requestedRegion).catch(function(err) {
    console.warn('[hverdagsverktoy] Failed to load language "' + requestedRegion + '", falling back to Norwegian.', err);
    region = 'no';
    try { localStorage.removeItem('hvt-lang'); } catch(e){}
    // Show a transient toast so the user sees why the language reverted.
    window.addEventListener('load', function(){
      if(document.getElementById('hvt-lang-toast')) return;
      var t = document.createElement('div');
      t.id = 'hvt-lang-toast';
      t.setAttribute('role','status');
      t.setAttribute('aria-live','polite');
      t.textContent = 'Could not load the language — showing Norwegian.';
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#b45309;color:#fff;padding:10px 18px;border-radius:8px;font:600 13px/1.3 Geist,Inter,sans-serif;z-index:10000;box-shadow:0 6px 20px rgba(0,0,0,.18);';
      document.body.appendChild(t);
      setTimeout(function(){ t.style.transition='opacity .4s'; t.style.opacity='0'; }, 5000);
      setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 5500);
    }, { once: true });
    return loadLang('no');
  }).then(function() {
    document.documentElement.classList.remove('lang-loading');
    _initPageReady();
  });
}
function _initPageReady(){
  // Fortell nettleseren hvilket språk siden faktisk vises på. setRegion gjorde
  // dette ved språkbytte, men ikke ved sidelast — så en engelsk bruker fikk
  // lang="nb" fra HTML-fila. Skjermlesere leste da engelsk tekst med norsk
  // uttale, og sider som leser attributtet for å velge innhold traff norsk.
  document.documentElement.setAttribute('lang', region === 'no' ? 'nb' : region);
  document.documentElement.setAttribute('dir', region === 'ar' ? 'rtl' : 'ltr');
  updateAll();
  // Rebuild search chips with loaded language (chips built before lang was ready)
  try { if(typeof window.hvtSearchRebuildChips==='function') window.hvtSearchRebuildChips(); } catch(_e){}
  try { if(typeof window.hvtSearchInvalidate==='function') window.hvtSearchInvalidate(); } catch(_e){}
  if(!window.location.hash) _scrollInstant(function(){window.scrollTo(0, 0);});
  // Handle hash-based deep links (cross-page navigation)
  _handleHashFocus();
}

// Runs on initial load AND on hashchange: rull til elementet adressen peker på (#id).
function _handleHashFocus(){
  var hash=window.location.hash.replace('#','');
  if(!hash) return;
  var el=document.getElementById(hash);
  if(el) el.scrollIntoView({block:'start',behavior:'smooth'});
}

// Boot: scripts use `defer`, so they execute in order before DOMContentLoaded fires.
// By the time this listener runs, search.js and lang/*.js have completed.
document.addEventListener('DOMContentLoaded', initPage);
window.addEventListener('hashchange', _handleHashFocus);