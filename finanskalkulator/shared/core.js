// ═══════════════════════════════════════════════════════
// Hverdagsverktøy — core.js
// © 2026 Kasper Skjæveland Espedal. All rights reserved.
// https://hverdagsverktoy.com
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════
const THEMES = [
  {id:'frost',labelKey:'themeFrost',fallback:'Standard',dot:'linear-gradient(135deg,#a8c4e6,#89b0d9)',ring:'#6875f5'},
  {id:'dark',labelKey:'themeDark',fallback:'Mørk',dot:'linear-gradient(135deg,#1c1e2e,#2d3352)',ring:'#6c8aef',dotBorder:'rgba(255,255,255,.25)'},
  {id:'corporate',labelKey:'themeCorporate',fallback:'Skarp',dot:'#1e40af'},
  {id:'pink',labelKey:'themePink',fallback:'Rosa',dot:'#e891b2'},
  {id:'purple',labelKey:'themePurple',fallback:'Lilla',dot:'#a78bdf'},
  {id:'blue',labelKey:'themeBlue',fallback:'Blå',dot:'#7a9ecc'},
  {id:'green',labelKey:'themeGreen',fallback:'Grønn',dot:'#6db89a'},
  {id:'peach',labelKey:'themePeach',fallback:'Fersken',dot:'#e8a878'},
  {id:'glass',labelKey:'themeGlass',fallback:'Glass',dot:'linear-gradient(135deg,#6875f5,#8b95ff)',ring:'#6875f5'}
];
function themeLabel(t){try{var r=typeof R==='function'&&typeof region!=='undefined'?R():null;return r&&r[t.labelKey]?r[t.labelKey]:t.fallback;}catch(e){return t.fallback;}}
function buildThemePicker(){
  var wrap=document.getElementById('theme-picker');
  // If no dedicated theme-picker div, inject into header next to language selector
  if(!wrap){
    var hdrRight=document.querySelector('.hdr-right');
    if(!hdrRight) return;
    wrap=document.createElement('div');
    wrap.id='theme-picker';
    wrap.style.cssText='display:flex;align-items:center;gap:6px;position:relative;';
    hdrRight.appendChild(wrap);
  }
  var isHeader=!!wrap.closest('.hdr-right');
  var current=(document.documentElement.getAttribute('data-theme')||'blue');
  wrap.innerHTML='';
  // "Tema" label — only show on dashboard (not in header)
  if(!isHeader){
    var lbl=document.createElement('span');
    lbl.style.cssText='font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;color:var(--ink);opacity:.55;';
    try{lbl.textContent=(typeof R==='function'&&typeof region!=='undefined'?R().themeLabel:null)||'Tema';}catch(e){lbl.textContent='Tema';}
    wrap.appendChild(lbl);
  }
  // Trigger button — active color dot + chevron
  var activeTheme=THEMES.find(function(t){return t.id===current;})||THEMES[0];
  var btn=document.createElement('button');
  btn.id='theme-trigger';
  btn.style.cssText='display:inline-flex;align-items:center;gap:8px;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--rs);padding:8px 14px;cursor:pointer;outline:none;transition:all .15s;font-size:13px;font-weight:600;';
  btn.onmouseenter=function(){this.style.borderColor='var(--accent)';};
  btn.onmouseleave=function(){var p=document.getElementById('theme-panel');if(!p||p.style.display==='none')this.style.borderColor='var(--border)';};
  var dot=document.createElement('span');
  dot.style.cssText='width:16px;height:16px;border-radius:50%;background:'+activeTheme.dot+';border:1.5px solid '+(activeTheme.dotBorder||'rgba(0,0,0,.1)')+';flex-shrink:0;';
  var btnLabel=document.createElement('span');
  btnLabel.style.cssText='font-size:13px;font-weight:500;color:var(--ink);opacity:.6;';
  btnLabel.textContent=themeLabel(activeTheme);
  var arrow=document.createElement('span');
  arrow.style.cssText='font-size:10px;color:var(--ink);opacity:.35;';
  arrow.innerHTML='&#9662;';
  btn.appendChild(dot);
  btn.appendChild(btnLabel);
  btn.appendChild(arrow);
  // Dropdown panel — horizontal row of color dots
  var panel=document.createElement('div');
  panel.id='theme-panel';
  panel.style.cssText='position:fixed;margin-top:6px;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:10px 14px;display:none;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:9999;white-space:nowrap;';
  THEMES.forEach(function(t,i){
    var isActive=t.id===current;
    var swatch=document.createElement('button');
    swatch.title=themeLabel(t);
    var swatchBorder=isActive?(t.ring||t.dot):(t.dotBorder||'transparent');
    var isMobile=window.innerWidth<500;
    var swSize=isMobile?'24px':'28px';
    var swGap=isMobile?'7px':'10px';
    swatch.style.cssText='width:'+swSize+';height:'+swSize+';border-radius:50%;border:2.5px solid '+swatchBorder+';background:'+t.dot+';cursor:pointer;outline:none;padding:0;transition:transform .15s,border-color .15s,box-shadow .15s;flex-shrink:0;position:relative;display:inline-block;vertical-align:middle;'+(isActive?'box-shadow:0 0 0 2px var(--surface),0 2px 8px rgba(0,0,0,.15);':'')+(i>0?'margin-left:'+swGap+';':'');
    swatch.onmouseenter=function(){if(!isActive)this.style.transform='scale(1.18)';this.style.boxShadow='0 2px 10px rgba(0,0,0,.18)';};
    swatch.onmouseleave=function(){this.style.transform='scale(1)';this.style.boxShadow=isActive?'0 0 0 2px var(--surface),0 2px 8px rgba(0,0,0,.15)':'';};
    swatch.onclick=function(e){e.stopPropagation();setTheme(t.id);};
    if(isActive){
      var ck=document.createElement('span');
      ck.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:13px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);pointer-events:none;';
      ck.textContent='\u2713';
      swatch.appendChild(ck);
    }
    panel.appendChild(swatch);
  });
  btn.onclick=function(e){
    e.stopPropagation();
    var open=panel.style.display==='none';
    if(open){
      // Show off-screen to measure, then position
      panel.style.display='block';
      panel.style.visibility='hidden';
      panel.style.left='0';panel.style.top='0';
      var rect=btn.getBoundingClientRect();
      var panelW=panel.offsetWidth;
      var vw=window.innerWidth;
      if(panelW>vw-24){
        // Panel wider than screen — center it
        panel.style.left='12px';panel.style.right='12px';
      } else {
        var right=vw-rect.right;
        if(right<12) right=12;
        if(right+panelW>vw-12) right=vw-panelW-12;
        panel.style.left='auto';
        panel.style.right=right+'px';
      }
      panel.style.top=(rect.bottom+6)+'px';
      panel.style.visibility='visible';
    } else {
      panel.style.display='none';
    }
    btn.style.borderColor=open?'var(--accent)':'var(--border)';
  };
  // Close on outside click (only add listener once)
  if(!window._themePickerListener){
    window._themePickerListener=true;
    document.addEventListener('click',function(e){
      var w=document.getElementById('theme-picker');
      var p=document.getElementById('theme-panel');
      var b=document.getElementById('theme-trigger');
      if(w&&p&&!w.contains(e.target)){p.style.display='none';if(b)b.style.borderColor='var(--border)';}
    });
  }
  wrap.appendChild(btn);
  wrap.appendChild(panel);
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('hvt-theme', t); } catch(e){}
  buildThemePicker();
  if(typeof buildCalcKeys==='function' && typeof bcMode!=='undefined'){
    const mode = bcMode;
    if(mode==='basic') buildCalcKeys('basic');
    else if(mode==='scientific') buildCalcKeys('scientific');
  }
}
(function(){
  try {
    const saved = localStorage.getItem('hvt-theme');
    const valid = THEMES.map(t=>t.id);
    document.documentElement.setAttribute('data-theme', (saved && valid.includes(saved)) ? saved : 'frost');
  } catch(e){
    document.documentElement.setAttribute('data-theme', 'frost');
  }
})();

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let region = (function(){ try { const s=localStorage.getItem('hvt-lang'); if(s && REGIONS[s]) return s; } catch(e){} return 'no'; })();
buildThemePicker();
let activeCalc = 'dashboard';
let _sal, _mor, _npv, _vat;

function R() { const r=REGIONS[region]; return r.base ? Object.assign({},REGIONS[r.base],r) : r; }
function fmt(n) {
  const r=R();
  return new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0}).format(Math.round(n)).replace(/\u00a0/g,' ')+' '+r.currency;
}
function pct(n) { return n.toFixed(1).replace('.',',')+' %'; }
function parseNum(id) { const el=document.getElementById(id); return el ? +(el.value.replace(/[\s\u00a0,]/g,'').replace(',','.')) || 0 : 0; }
function fmtInput(n) { return new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0}).format(n).replace(/\u00a0/g,' '); }

// Live-format number inputs
document.addEventListener('input', function(e) {
  const el = e.target;
  if(el.inputMode !== 'numeric') return;
  const raw = el.value.replace(/[^0-9\-]/g,'');
  if(raw === '' || raw === '-') return;
  const num = parseInt(raw, 10);
  if(isNaN(num)) return;
  const pos = el.selectionStart;
  const oldLen = el.value.length;
  el.value = fmtInput(num);
  const newLen = el.value.length;
  el.setSelectionRange(pos + newLen - oldLen, pos + newLen - oldLen);
});

// ═══════════════════════════════════════════════════════
// REGION SWITCH
// ═══════════════════════════════════════════════════════
function setRegion(r, e) {
  region = r;
  try { localStorage.setItem('hvt-lang', r); } catch(_e){}
  var _rf=document.getElementById('rf');if(_rf)_rf.textContent=R().flag;
  var _rn=document.getElementById('rn');if(_rn)_rn.textContent=R().name;
  document.querySelectorAll('.region-opt').forEach(el => el.classList.remove('active'));
  if(e && e.currentTarget) e.currentTarget.classList.add('active');
  else document.querySelector('.region-opt[onclick*="\''+r+'\'"]')?.classList.add('active');
  var _rdd=document.getElementById('rdd');if(_rdd)_rdd.classList.remove('open');
  updateAll();
}
function toggleDD() { var el=document.getElementById('rdd');if(el)el.classList.toggle('open'); }
document.addEventListener('click', e => { if(!e.target.closest('.region-sel')){var _rd=document.getElementById('rdd');if(_rd)_rd.classList.remove('open');} });

// ═══════════════════════════════════════════════════════
// UPDATE ALL UI
// ═══════════════════════════════════════════════════════
function updateAll() {
  try{updateHero();}catch(e){}
  try{updateTabs();}catch(e){}
  try{updateDashLabels();}catch(e){}
  if(document.getElementById('calc-salary'))try{updateSalaryUI();updateUttakUI();}catch(e){}
  if(document.getElementById('calc-mortgage'))try{updateMortgageUI();}catch(e){}
  if(document.getElementById('calc-npv'))try{updateNpvUI();}catch(e){}
  if(document.getElementById('calc-vat'))try{updateVatUI();}catch(e){}
  if(document.getElementById('calc-basic'))try{updateFagkalkulatorUI();ccPopulate();vgPopulate();}catch(e){}
  try{updateFooter();}catch(e){}
  try{buildThemePicker();}catch(e){}
  // Section titles
  var _sc=document.getElementById('sec-calculators');if(_sc)_sc.textContent=R().secCalc||'Kalkulatorer';
  // clear results
  ['s-res','m-res','n-res','v-res'].forEach(id => { const el=document.getElementById(id); if(el) el.classList.add('hidden'); });
  _sal=_mor=_npv=_vat=null;
  // set defaults (only if elements exist)
  const d = R().salDefaults;
  var sg=document.getElementById('s-g');if(sg)sg.value = fmtInput(d.gross);
  var ma=document.getElementById('m-a');if(ma)ma.value = fmtInput(3000000);
}

function updateHero() {
  const r = R();
  document.getElementById('hero-h1').innerHTML = r.heroH1 || 'Hverdagsverktøy<br><em>Praktiske verktøy for bedrift og privat</em>';
  document.getElementById('hero-p').textContent = r.heroP || '';
  const tbEl = document.getElementById('tb-main'); if(tbEl) tbEl.textContent = r.heroKickerTb || '';
  setText('rg-main', r.rgMain || 'Hovedspråk');
  setText('rg-norway', r.rgNorway || 'Språk i Norge');
  setText('rg-intl', r.rgIntl || 'Internasjonalt');
}

function updateTabs() {
  const r = R();
  document.getElementById('tl-sal').textContent = r.tabSal || 'Salary After Tax';
  document.getElementById('tl-mor').textContent = r.tabMor || 'Mortgage';
  document.getElementById('tl-npv').textContent = r.tabNpv || 'NPV / IRR';
  document.getElementById('tl-vat').textContent = r.tabVat || 'Tax / Duties';
  document.getElementById('tl-basic').textContent = r.tabBasic || 'Calculator';
  // Right panel labels (only on kalkulator.html)
  var _ct=document.getElementById('lbl-calctype');if(_ct)_ct.textContent = r.cmLabel || 'Calculator type';
  var _cb=document.getElementById('lbl-basic');if(_cb)_cb.textContent = r.cmBasic || 'Basic';
  var _cf=document.getElementById('lbl-finance');if(_cf)_cf.textContent = r.cmFinance || 'Financial';
  var _cs=document.getElementById('lbl-scientific');if(_cs)_cs.textContent = r.cmScientific || 'Scientific';
  var _cu=document.getElementById('lbl-unit');if(_cu)_cu.textContent = r.cmUnit || 'Unit conversion';
  // Finanskalkulatorer shortcut panel (removed — safe-skip)
  const _fc = id => { const el=document.getElementById(id); return el; };
  if(_fc('lbl-fincalcs')) _fc('lbl-fincalcs').textContent = r.cmFinCalcs || 'Financial calculators';
  if(_fc('lbl-fc-sal')) _fc('lbl-fc-sal').textContent = r.cmFcSal || 'Salary after tax';
  if(_fc('lbl-fc-mor')) _fc('lbl-fc-mor').textContent = r.cmFcMor || 'Mortgage';
  if(_fc('lbl-fc-npv')) _fc('lbl-fc-npv').textContent = r.cmFcNpv || 'Profitability analysis';
  if(_fc('lbl-fc-vat')) _fc('lbl-fc-vat').textContent = r.cmFcVat || 'Tax / Duties';
  // Update mode label for current calc mode (kalkulator.html only)
  var _bml=document.getElementById('bc-mode-label');
  if(_bml){
    const modeLabels = {basic: r.tabBasic, scientific: r.cmScientific, finance: r.cmFinance, unit: r.cmUnit};
    _bml.textContent = modeLabels[bcMode] || r.tabBasic || 'Calculator';
    // Finance calculator labels
    setText('fc-lbl-type', r.fcLblType || 'Calculation type');
    setText('fc-btn', r.fcBtn || 'Calculate →');
    setText('fc-res-lbl', r.fcResLbl || 'Result');
    fcPopulateSelect();
    fcUpdateFields();
    // Unit converter labels
    setText('uc-lbl-from', r.ucFrom || 'Fra');
    setText('uc-lbl-to', r.ucTo || 'Til');
    setText('uc-lbl-val', r.ccAmount || 'Beløp');
    setText('uc-lbl-res', r.ucResult || 'Resultat');
    const swapEl=document.getElementById('cc-swap'); if(swapEl) swapEl.textContent='⇅ '+(r.ccSwap||'Bytt');
  }
  // Mortgage loan type (boliglan.html only)
  var _mlt=document.getElementById('mor-l-type');if(_mlt)_mlt.textContent = r.morLType || 'Loan type';
  if(document.getElementById('m-type')) morPopulateType();
  var _ioChk=document.getElementById('m-io-check');
  if(_ioChk){_ioChk.addEventListener('change',function(){document.getElementById('m-io-fields').classList.toggle('hidden',!this.checked);if(!document.getElementById('m-res').classList.contains('hidden'))calcMor();});}
  var _mtSel=document.getElementById('m-type');if(_mtSel){_mtSel.addEventListener('change',function(){morUpdateHint();if(!document.getElementById('m-res').classList.contains('hidden'))calcMor();});morUpdateHint();}
  // Auto-recalc on dropdown change for ALL calculators
  function autoRecalc(selId, resId, calcFn){var s=document.getElementById(selId);if(s)s.addEventListener('change',function(){var r=document.getElementById(resId);if(r&&!r.classList.contains('hidden'))calcFn();});}
  // Salary (skatt.html)
  autoRecalc('s-c','s-res',calcSal);
  autoRecalc('s-r','s-res',calcSal);
  var _sDeduct=document.getElementById('s-deduct');if(_sDeduct){_sDeduct.addEventListener('input',function(){var r=document.getElementById('s-res');if(r&&!r.classList.contains('hidden'))calcSal();});}
  // VAT (avgift.html)
  autoRecalc('v-r','v-res',calcVat);
  autoRecalc('v-t','v-res',calcVat);
  // VAT Adjustment
  autoRecalc('adj-type','adj-res',calcAdj);
  // LVU (kalkulator.html)
  autoRecalc('lvu-zone','lvu-res',calcLvu);
  // AGA
  autoRecalc('aga-zone','aga-res',calcAga);
  autoRecalc('aga-ferie','aga-res',calcAga);
  autoRecalc('aga-otp','aga-res',calcAga);
  // Avskrivning
  autoRecalc('avs-group','avs-res',function(){calcAvs(true);});
  // Feriepenger
  autoRecalc('ferie-type','ferie-res',calcFerie);
  // Pensjon
  autoRecalc('pensjon-otp','pensjon-res',calcPensjon);
  // Uttak (skatt.html)
  autoRecalc('uttak-type','uttak-res',calcUttak);
  // Utdeling
  autoRecalc('utdeling-type','utdeling-res',calcUtdeling);
  // Bil (personlig.html)
  autoRecalc('bil-merke','bil-res',calcBilkostnad);
  autoRecalc('bil-tilstand','bil-res',calcBilkostnad);
  autoRecalc('bil-drivstoff','bil-res',calcBilkostnad);
  autoRecalc('bil-aarsmodell','bil-res',calcBilkostnad);
  autoRecalc('bil-kjopsaar','bil-res',calcBilkostnad);
  // Valutagevinst
  autoRecalc('valgevinst-currency','valgevinst-res',calcValgevinst);
}
function morUpdateHint(){
  var sel=document.getElementById('m-type');var hint=document.getElementById('m-type-hint');
  if(!sel||!hint)return;var r=R();
  if(sel.value==='serial') hint.textContent=r.morHintSerial||'Faste avdrag, synkende renter. Høyere start, men lavere totalkostnad.';
  else hint.textContent=r.morHintAnnuity||'Lik månedlig betaling hele perioden. Lavere start, men høyere totalkostnad.';
}
function morPopulateType(){
  const r = R();
  const sel = document.getElementById('m-type');
  const cur = sel.value || 'annuity';
  sel.innerHTML = '';
  [['annuity', r.morAnnuity||'Annuity loan'],['serial', r.morSerial||'Serial loan']].forEach(([v,l])=>{
    const o=document.createElement('option');o.value=v;o.textContent=l;sel.appendChild(o);
  });
  sel.value = cur;
}

function goToDeprCard(){
  if(!document.getElementById('sal-depr-card')){
    window.location.href='/skatt/#sal-depr-card'; return;
  }
  switchCalc('salary', true);
  const card=document.getElementById('sal-depr-card');
  if(!card) return;
  const lawGroup=card.closest('.law-group');
  if(lawGroup && !lawGroup.classList.contains('open')){
    lawGroup.classList.add('open');
    const body=lawGroup.querySelector('.law-group-body');
    if(body){body.style.transition='none';body.style.maxHeight='none';}
  }
  if(card.classList.contains('collapsed')){
    card.classList.remove('collapsed');
    const arrow=card.querySelector('.card-title span');
    if(arrow) arrow.textContent='▲';
  }
  void card.offsetHeight;
  setTimeout(()=>{
    const hdrs=card.querySelectorAll('.ir-hdr');
    let target=null;
    for(const h of hdrs){if(h.textContent.includes('14-41') || h.textContent.includes('14-43')){target=h;break;}}
    if(!target) target=card;
    const off=stickyOffset();
    const top=target.getBoundingClientRect().top+window.scrollY-off-8;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    if(lawGroup){const body=lawGroup.querySelector('.law-group-body');if(body)setTimeout(()=>{body.style.transition='';},400);}
  },250);
}
function goToAgaCard(){
  if(!document.getElementById('vat-aga-card')){
    window.location.href='/avgift/#vat-aga-card'; return;
  }
  switchCalc('vat', true);
  window.scrollTo({top:0,behavior:'auto'});
  setTimeout(()=>{
    const c=document.getElementById('vat-aga-card');
    if(!c) return;
    c.classList.remove('hidden','collapsed');
    setTimeout(()=>{ smartScroll(c); },400);
  },350);
}
function goToLvuCalc(){
  if(!document.getElementById('bc-lvu')){
    window.location.href='/kalkulator/#lvu'; return;
  }
  switchCalc('basic', true);
  switchCalcMode('lvu', true);
  const el=document.getElementById('bc-lvu');
  if(el){el.style.animation='none';el.style.opacity='1';el.style.transform='none';
    const off=stickyOffset();
    const top=el.getBoundingClientRect().top+window.scrollY-off;
    window.scrollTo(0, Math.max(0,top));
  }
}
function goToAvsCalc(){
  if(!document.getElementById('bc-avs')){
    window.location.href='/kalkulator/#avs'; return;
  }
  switchCalc('basic', true);
  switchCalcMode('avs', true);
  const el=document.getElementById('bc-avs');
  if(el){el.style.animation='none';el.style.opacity='1';el.style.transform='none';
    const off=stickyOffset();
    const top=el.getBoundingClientRect().top+window.scrollY-off;
    window.scrollTo(0, Math.max(0,top));
  }
}
function toggleLawGroup(group){
  var body = group.querySelector('.law-group-body');
  if(group.classList.contains('open')){
    // Closing: animate max-height from current to 0
    body.style.maxHeight = body.scrollHeight + 'px';
    body.offsetHeight; // force reflow
    body.style.maxHeight = '0';
    group.classList.remove('open');
    // Smooth scroll group header into view
    setTimeout(function(){ scrollToEl(group,'nearest'); }, 350);
  } else {
    // Opening: animate max-height from 0 to content
    group.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    // After transition, remove fixed max-height so nested content can expand
    setTimeout(function(){ body.style.maxHeight = 'none'; }, 550);
    // Smooth scroll group header to top (below sticky header)
    setTimeout(function(){ smartScroll(group); }, 550);
  }
}
function toggleCard(card){
  const wasCollapsed = card.classList.contains('collapsed');
  card.classList.toggle('collapsed');
  // Rotate arrow indicator
  const arrow = card.querySelector('.card-title span');
  if(arrow) arrow.textContent = wasCollapsed ? '▲' : '▼';
  if(wasCollapsed){
    setTimeout(()=>{ smartScroll(card); }, 250);
  }
}

// Open a key topic by keyword — opens relevant law group + card and scrolls to specific row
function openKeyTopic(keyword){
  var topicMap={
    'fritaksmetoden':'sal-corp-card',
    'hovedregelen':'sal-law-card',
    'realisasjon':'sal-real-card',
    'inngangsverdi':'sal-real-card',
    'utbytte':'sal-corp-card',
    'konsernbidrag':'sal-corp-card',
    'fusjon':'sal-reorg-card',
    'omgåelse':'sal-anti-card'
  };
  var kw=(keyword||'').toLowerCase();
  var cardId=topicMap[kw];
  if(!cardId) return;
  var card=document.getElementById(cardId);
  if(!card) return;
  var group=card.closest('.law-group');
  if(group&&!group.classList.contains('open')){
    group.classList.add('open');
    var body=group.querySelector('.law-group-body');
    body.style.maxHeight=body.scrollHeight+'px';
    setTimeout(function(){body.style.maxHeight='none';},550);
  }
  if(card.classList.contains('collapsed')) toggleCard(card);
  // Find the specific row matching this topic and scroll+highlight it
  setTimeout(function(){
    var target=card.querySelector('[data-topic*="'+kw+'"]');
    if(target){
      smartScroll(target);
      target.style.transition='background .3s';
      target.style.background='color-mix(in srgb,var(--accent) 15%,transparent)';
      setTimeout(function(){target.style.background='';},2500);
    } else {
      smartScroll(card);
    }
  },400);
}

// Desc-link: click a keyword in law-group-desc to open group + scroll to card/row
document.addEventListener('click',function(e){
  var link=e.target.closest('.desc-link');
  if(!link) return;
  e.stopPropagation();
  // Try openKeyTopic first for precise row scrolling
  var linkText=(link.textContent||'').trim().toLowerCase();
  var topicMap={'fritaksmetoden':1,'hovedregelen':1,'realisasjon':1,'inngangsverdi':1,'utbytte':1,'konsernbidrag':1,'fusjon':1,'omgåelse':1};
  if(topicMap[linkText]){
    openKeyTopic(linkText);
    return;
  }
  // Fallback: just open the card
  var targetId=link.dataset.target;
  var card=document.getElementById(targetId);
  if(!card) return;
  var group=card.closest('.law-group');
  if(group&&!group.classList.contains('open')){
    group.classList.add('open');
    var body=group.querySelector('.law-group-body');
    body.style.maxHeight=body.scrollHeight+'px';
    setTimeout(function(){body.style.maxHeight='none';},550);
  }
  if(card.classList.contains('collapsed')) toggleCard(card);
  setTimeout(function(){ smartScroll(card); },300);
});

const LOVDATA={
  sktl:'https://lovdata.no/lov/1999-03-26-14/',
  mval:'https://lovdata.no/lov/2009-06-19-58/',
  ftrl:'https://lovdata.no/lov/1997-02-28-19/',
  ferieloven:'https://lovdata.no/lov/1988-04-29-21/',
  'OTP-loven':'https://lovdata.no/lov/2005-12-21-124/'
};
function lovdataUrl(text, defaultLaw) {
  if(!text) return '';
  const dl = defaultLaw || 'sktl';
  const re = /((?:ftrl|mval|ferieloven|OTP-loven|sktl)\.\s*)?§\s*(\d+[\-\d]*(?:\(\d+\))?(?:\s*[a-j])?)/;
  const m = text.match(re);
  if(!m) return '';
  let base = LOVDATA[dl];
  if(m[1]) { const key=m[1].trim().replace(/\.\s*$/,''); if(LOVDATA[key]) base=LOVDATA[key]; }
  const clean = m[2].replace(/\(.*$/,'').trim();
  return base + '%C2%A7' + clean;
}
function lovdataLink(text, defaultLaw) {
  if(!text) return '';
  const dl = defaultLaw || 'sktl';
  return text.replace(/((?:ftrl|mval|ferieloven|OTP-loven|sktl)\.\s*)?§\s*(\d+[\-\d]*(?:\(\d+\))?(?:\s*[a-j])?)/g, function(match, prefix, para) {
    let base = LOVDATA[dl];
    if(prefix) {
      const key = prefix.trim().replace(/\.\s*$/,'');
      if(LOVDATA[key]) base = LOVDATA[key];
    }
    const clean = para.replace(/\(.*$/,'').trim();
    const url = base + '%C2%A7' + clean;
    return '<a href="'+url+'" target="_blank" rel="noopener" style="color:var(--accent-d);text-decoration:underline;font-weight:500">'+match.trim()+'</a>';
  });
}
function infoRowsHTML(rows, defaultLaw) {
  if(!rows) return '';
  const dl = defaultLaw || 'sktl';
  return rows.map(r => {
    const [k,v,hint] = r;
    // Extract § reference for data-topic anchoring
    var topicAttr = '';
    var secMatch = k.match(/§\s*([\d]+-[\d]+(?:\s*to\s*[\d]+-[\d]+)?)/);
    if(secMatch) topicAttr = ' data-section="' + secMatch[1].replace(/\s+/g,'') + '"';
    // Also add keyword-based topic for common terms (check both key and value)
    var kvLower = (k + ' ' + (v||'')).toLowerCase();
    var kwTopics = [];
    if(kvLower.indexOf('fritaksmetod')>=0||kvLower.indexOf('participation exemption')>=0||kvLower.indexOf('免税方法')>=0||kvLower.indexOf('régime d\'exonération')>=0||kvLower.indexOf('metoda zwolnienia')>=0) kwTopics.push('fritaksmetoden');
    if(kvLower.indexOf('konsernbidrag')>=0||kvLower.indexOf('group contribution')>=0) kwTopics.push('konsernbidrag');
    if(kvLower.indexOf('fusjon')>=0||kvLower.indexOf('merger')>=0||kvLower.indexOf('合并')>=0) kwTopics.push('fusjon');
    if(kvLower.indexOf('omgåelse')>=0||kvLower.indexOf('anti-avoidance')>=0||kvLower.indexOf('avoidance')>=0) kwTopics.push('omgåelse');
    if(kvLower.indexOf('realisasjon')>=0||kvLower.indexOf('realisation')>=0||kvLower.indexOf('realisering')>=0) kwTopics.push('realisasjon');
    if(kvLower.indexOf('hovedregel')>=0||kvLower.indexOf('main rule')>=0||kvLower.indexOf('skattepliktig inntekt')>=0||kvLower.indexOf('taxable income')>=0) kwTopics.push('hovedregelen');
    if(kvLower.indexOf('inngangsverdi')>=0||kvLower.indexOf('cost basis')>=0||kvLower.indexOf('cost price')>=0) kwTopics.push('inngangsverdi');
    if(kvLower.indexOf('utbytte')>=0||kvLower.indexOf('dividend')>=0||kvLower.indexOf('skjerming')>=0||kvLower.indexOf('shielding')>=0) kwTopics.push('utbytte');
    if(kwTopics.length) topicAttr += ' data-topic="' + kwTopics.join(',') + '"';

    if(k.startsWith('—')) return `<div class="ir ir-hdr"${topicAttr} style="flex-direction:column;align-items:flex-start;gap:2px;padding:14px 22px 10px;background:var(--surface2);"><span class="k" style="font-weight:700;color:var(--accent);font-size:11px;letter-spacing:.5px">${k}</span>${v?`<span style="font-size:11.5px;color:var(--ink3);font-weight:400;line-height:1.4">${v}</span>`:''}</div>`;
    const long = v && v.length > 40;
    const linkedHint = hint ? lovdataLink(hint, dl) : '';
    const url = hint ? lovdataUrl(hint, dl) : '';
    const clickable = url ? ` onclick="window.open('${url}','_blank')" style="flex-direction:column;align-items:flex-start;gap:4px;padding:12px 22px;cursor:pointer;transition:background .15s;border-radius:4px;" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''"` : ' style="flex-direction:column;align-items:flex-start;gap:4px;padding:12px 22px;"';
    if(long || hint) {
      return `<div class="ir"${topicAttr}${clickable}>
        <div style="font-weight:600;color:var(--ink);font-size:13px;line-height:1.4">${k}</div>
        <div style="color:var(--ink2);font-size:12.5px;line-height:1.5;font-weight:400">${v}</div>
        ${linkedHint?`<div style="font-size:12.5px;color:var(--accent-d);font-weight:500;line-height:1.5">${linkedHint}</div>`:''}
      </div>`;
    }
    return `<div class="ir"${topicAttr}><span class="k">${k}</span><span class="v a">${v}</span></div>`;
  }).join('');
}

function updateSalaryUI() {
  const r = R();
  var salTitleEl=document.getElementById('sal-title');if(salTitleEl)salTitleEl.innerHTML=(r.salTitle||'Salary After Tax')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('sal-desc', r.salDesc || 'Calculate net salary from gross annual income.');
  setText('sal-l-gross', r.lGross || 'Gross Annual Salary');
  setText('sal-l-class', r.lClass || 'Tax Class');
  setText('sal-l-reg', r.lReg || 'Region');
  setText('btn-calc', r.btnCalc || 'Calculate →');
  setText('sal-r-net', r.salRNet || 'Net Annual Income');
  setText('sal-r-tax', r.salRTax || 'Total Tax');
  setText('sal-r-eff', r.salREff || 'Effective Rate');
  setText('sal-r-soc', r.salRSoc || 'Social / NI');
  setText('sal-r-day', r.salRDay || 'Net per Day');
  setText('sal-disclaimer', r.salDisclaimer || 'Beregningen er veiledende og tar ikke hensyn til alle individuelle fradrag. Faktisk skatt avhenger av reisefradrag, fagforeningskontingent, BSU, gjeldsrenter og andre fradrag du har krav på.');
  setText('sal-l-deduct', r.salDeductLabel || 'Rentefradrag — årlige rentekostnader (valgfritt)');
  setText('sal-deduct-hint', r.salDeductHint || 'Finner du i boliglånskalkulatoren under «År 1 renter». Reduserer skatten med 22 % av beløpet.');
  setText('sal-r-deduct', r.salRDeduct || 'Rentefradrag');
  setText('s-trinn-title', r.trinnBreakdownTitle || 'Trinnskatt Breakdown');
  // Help card
  const salHelpCard = document.getElementById('sal-help-card');
  if(r.salHelpRows){
    salHelpCard.classList.remove('hidden');
    salHelpCard.classList.add('collapsed');
    document.getElementById('sal-help-rows').innerHTML = infoRowsHTML(r.salHelpRows);
    document.getElementById('sal-help-title').innerHTML = (r.salHelpTitle || 'Hjelp med denne kalkulatoren') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-help-desc').textContent = r.salHelpDesc || 'Slik bruker du skattekalkulatoren';
  } else {
    salHelpCard.classList.add('hidden');
  }
  const salIntroCard = document.getElementById('sal-intro-card');
  if(r.salIntroRows){
    salIntroCard.classList.remove('hidden');
    salIntroCard.classList.add('collapsed');
    document.getElementById('sal-intro-rows').innerHTML = infoRowsHTML(r.salIntroRows);
    document.getElementById('sal-intro-title').innerHTML = (r.salIntroTitle || 'Hva er skatt?') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-intro-desc').textContent = r.salIntroDesc || 'Kort forklaring for deg som er ny i Norge';
  } else {
    salIntroCard.classList.add('hidden');
  }
  setText('sal-info-title', r.salInfoTitle || 'Tax Reference');
  setText('sal-info-desc', r.salInfoDesc || 'Current rates for selected region');
  const sc = document.getElementById('s-c'); sc.innerHTML = (r.salClasses||[]).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  const sr = document.getElementById('s-r'); sr.innerHTML = (r.salRegions||[]).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  document.getElementById('sal-info-rows').innerHTML = infoRowsHTML(r.salInfoRows||[]);
  const lawHint = '<div style="padding:10px 22px 6px;font-size:11.5px;font-style:italic;color:var(--ink3);opacity:.7">'+(r.lawHintText||'Vanskelig begrep? Se dropdown «Viktige regler og begreper forklart» over Skatteloven')+'</div>';
  // Show/hide Skatteloven group wrapper
  const salLawGroup = document.getElementById('sal-law-group');
  if(r.salLawRows || r.salSubjRows){
    salLawGroup.classList.remove('hidden');
    setText('sal-law-group-title', r.salLawGroupTitle || 'Skatteloven');
    // Build clickable desc links that jump to each card
    (function(){
      var map=[
        ['sal-subj-card', r.salDescSubj||'Skatteplikt'],
        ['sal-wealth-card', r.salDescFormue||'Formue'],
        ['sal-law-card', r.salDescInnt||'Inntekt'],
        ['sal-ded-card', r.salDescFrad||'Fradrag'],
        ['sal-real-card', r.salDescGev||'Gevinst'],
        ['sal-corp-card', r.salDescSels||'Selskaper'],
        ['sal-reorg-card', r.salDescOmorg||'Omorganisering'],
        ['sal-anti-card', r.salDescOmg||'Omgåelse'],
        ['sal-time-card', r.salDescTid||'Tidfesting'],
        ['sal-depr-card', r.salDescAvs||'Avskrivning'],
        ['sal-credit-card', r.salDescKredit||'Skattefradrag']
      ];
      var html=map.map(function(m){return '<span class="desc-link" data-target="'+m[0]+'">'+m[1]+'</span>';}).join(' · ');
      var el=document.getElementById('sal-law-group-desc');
      if(el) el.innerHTML=html;
    })();
  } else {
    salLawGroup.classList.add('hidden');
  }
  const salLawCard = document.getElementById('sal-law-card');
  if(r.salLawRows){
    salLawCard.classList.remove('hidden');
    salLawCard.classList.add('collapsed');
    document.getElementById('sal-law-rows').innerHTML = lawHint + infoRowsHTML(r.salLawRows);
    document.getElementById('sal-law-title').innerHTML = (r.salLawTitle || 'Skattepliktig inntekt (kap. 5)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-law-desc').textContent = r.salLawDesc || 'Lønn · Kapital · Skattefrie ytelser';
  } else {
    salLawCard.classList.add('hidden');
  }
  const salDedCard = document.getElementById('sal-ded-card');
  if(r.salDedRows){
    salDedCard.classList.remove('hidden');
    salDedCard.classList.add('collapsed');
    document.getElementById('sal-ded-rows').innerHTML = lawHint + infoRowsHTML(r.salDedRows);
    document.getElementById('sal-ded-title').innerHTML = (r.salDedTitle || 'Fradrag (kap. 6)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-ded-desc').textContent = r.salDedDesc || 'Minstefradrag · Gjeldsrenter · Særfradrag';
  } else {
    salDedCard.classList.add('hidden');
  }
  const salRealCard = document.getElementById('sal-real-card');
  if(r.salRealRows){
    salRealCard.classList.remove('hidden');
    salRealCard.classList.add('collapsed');
    document.getElementById('sal-real-rows').innerHTML = lawHint + infoRowsHTML(r.salRealRows);
    document.getElementById('sal-real-title').innerHTML = (r.salRealTitle || 'Gevinst og tap (kap. 9)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-real-desc').textContent = r.salRealDesc || 'Realisasjon · Bolig · Arv/gave · Utflytting';
  } else {
    salRealCard.classList.add('hidden');
  }
  const salCorpCard = document.getElementById('sal-corp-card');
  if(r.salCorpRows){
    salCorpCard.classList.remove('hidden');
    salCorpCard.classList.add('collapsed');
    document.getElementById('sal-corp-rows').innerHTML = lawHint + infoRowsHTML(r.salCorpRows);
    document.getElementById('sal-corp-title').innerHTML = (r.salCorpTitle || 'Særregler selskaper (kap. 10)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-corp-desc').textContent = r.salCorpDesc || 'Utbytte · Aksjegevinst · Konsernbidrag · NOKUS';
  } else {
    salCorpCard.classList.add('hidden');
  }
  const salReorgCard = document.getElementById('sal-reorg-card');
  if(r.salReorgRows){
    salReorgCard.classList.remove('hidden');
    salReorgCard.classList.add('collapsed');
    document.getElementById('sal-reorg-rows').innerHTML = lawHint + infoRowsHTML(r.salReorgRows);
    document.getElementById('sal-reorg-title').innerHTML = (r.salReorgTitle || 'Omorganisering (kap. 11)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-reorg-desc').textContent = r.salReorgDesc || 'Fusjon · Fisjon · Aksjebytte · Omdanning';
  } else {
    salReorgCard.classList.add('hidden');
  }
  const salAntiCard = document.getElementById('sal-anti-card');
  if(r.salAntiRows){
    salAntiCard.classList.remove('hidden');
    salAntiCard.classList.add('collapsed');
    document.getElementById('sal-anti-rows').innerHTML = lawHint + infoRowsHTML(r.salAntiRows);
    document.getElementById('sal-anti-title').innerHTML = (r.salAntiTitle || 'Interessefellesskap og omgåelse (kap. 13)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-anti-desc').textContent = r.salAntiDesc || 'Armlengdeprinsippet · Omgåelsesnormen · Skatteposisjoner';
  } else {
    salAntiCard.classList.add('hidden');
  }
  const salTimeCard = document.getElementById('sal-time-card');
  if(r.salTimeRows){
    salTimeCard.classList.remove('hidden');
    salTimeCard.classList.add('collapsed');
    document.getElementById('sal-time-rows').innerHTML = lawHint + infoRowsHTML(r.salTimeRows);
    document.getElementById('sal-time-title').innerHTML = (r.salTimeTitle || 'Tidfesting av inntekt og fradrag (kap. 14)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-time-desc').textContent = r.salTimeDesc || 'Inntektsperioder · Realisasjon · Kontantprinsippet · Underskudd';
  } else {
    salTimeCard.classList.add('hidden');
  }
  const salDeprCard = document.getElementById('sal-depr-card');
  if(r.salDeprRows){
    salDeprCard.classList.remove('hidden');
    salDeprCard.classList.add('collapsed');
    document.getElementById('sal-depr-rows').innerHTML = lawHint + infoRowsHTML(r.salDeprRows) + '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);"><a href="javascript:void(0)" onclick="goToAvsCalc()" style="font-size:12px;font-weight:600;color:var(--accent);text-decoration:none;opacity:.8;">Åpne avskrivningskalkulatoren →</a></div>';
    document.getElementById('sal-depr-title').innerHTML = (r.salDeprTitle || 'Saldoavskrivning (kap. 14, §§ 14-40 til 14-48)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-depr-desc').textContent = r.salDeprDesc || 'Saldogrupper · Avskrivningssatser · Gevinst og tap · Negativ saldo';
  } else {
    salDeprCard.classList.add('hidden');
  }
  const salPrincCard = document.getElementById('sal-princ-card');
  if(salPrincCard){
    if(r.salPrincRows){
      salPrincCard.classList.remove('hidden');
      salPrincCard.classList.add('collapsed');
      document.getElementById('sal-princ-rows').innerHTML = lawHint + infoRowsHTML(r.salPrincRows);
      document.getElementById('sal-princ-title').innerHTML = (r.salPrincTitle || 'Prinsipper og rettspraksis') + ' <span style="font-size:11px;opacity:.5">▼</span>';
      document.getElementById('sal-princ-desc').textContent = r.salPrincDesc || 'Skatteevne · Nøytralitet · Legalitet · Sentrale høyesterettsdommer';
    } else {
      salPrincCard.classList.add('hidden');
    }
  }
  const salKeyGroup = document.getElementById('sal-key-group');
  if(r.salKeyRows){
    salKeyGroup.classList.remove('hidden');
    document.getElementById('sal-key-rows').innerHTML = infoRowsHTML(r.salKeyRows);
    document.getElementById('sal-key-title').textContent = r.salKeyTitle || 'Viktige regler og begreper forklart';
    var keyDescEl = document.getElementById('sal-key-desc');
    if(r.salKeyDescLinks) {
      keyDescEl.innerHTML = r.salKeyDescLinks;
    } else {
      keyDescEl.innerHTML = '<span class="desc-link" data-target="sal-law-card">Hovedregelen</span> · <span class="desc-link" data-target="sal-real-card">Realisasjon</span> · <span class="desc-link" data-target="sal-real-card">Inngangsverdi</span> · <span class="desc-link" data-target="sal-corp-card">Utbytte</span> · <span class="desc-link" data-target="sal-corp-card">Fritaksmetoden</span> · <span class="desc-link" data-target="sal-corp-card">Konsernbidrag</span> · <span class="desc-link" data-target="sal-reorg-card">Fusjon</span> · <span class="desc-link" data-target="sal-anti-card">Omgåelse</span>';
    }
  } else {
    salKeyGroup.classList.add('hidden');
  }
  const salSubjCard = document.getElementById('sal-subj-card');
  if(r.salSubjRows){
    salSubjCard.classList.remove('hidden');
    salSubjCard.classList.add('collapsed');
    document.getElementById('sal-subj-rows').innerHTML = lawHint + infoRowsHTML(r.salSubjRows);
    document.getElementById('sal-subj-title').innerHTML = (r.salSubjTitle || 'Hvem er Skattepliktige? (kap. 2)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-subj-desc').textContent = r.salSubjDesc || 'Bosted · Selskaper · Fritak · Ektefeller · Barn';
  } else {
    salSubjCard.classList.add('hidden');
  }
  const salWealthCard = document.getElementById('sal-wealth-card');
  if(salWealthCard){
    if(r.salWealthRows){
      salWealthCard.classList.remove('hidden');
      salWealthCard.classList.add('collapsed');
      document.getElementById('sal-wealth-rows').innerHTML = lawHint + infoRowsHTML(r.salWealthRows);
      document.getElementById('sal-wealth-title').innerHTML = (r.salWealthTitle || 'Formue (kap. 4)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
      document.getElementById('sal-wealth-desc').textContent = r.salWealthDesc || 'Verdsettelse · Bolig · Aksjer · Rabatter · Bunnfradrag';
    } else {
      salWealthCard.classList.add('hidden');
    }
  }
  const salCreditCard = document.getElementById('sal-credit-card');
  if(salCreditCard){
    if(r.salCreditRows){
      salCreditCard.classList.remove('hidden');
      salCreditCard.classList.add('collapsed');
      document.getElementById('sal-credit-rows').innerHTML = lawHint + infoRowsHTML(r.salCreditRows);
      document.getElementById('sal-credit-title').innerHTML = (r.salCreditTitle || 'Fradrag i skatt (kap. 16)') + ' <span style="font-size:11px;opacity:.5">▼</span>';
      document.getElementById('sal-credit-desc').textContent = r.salCreditDesc || 'BSU · Pensjon · Kreditfradrag · SkatteFUNN';
    } else {
      salCreditCard.classList.add('hidden');
    }
  }
}

function updateMortgageUI() {
  const r = R();
  // Help card
  const morHelpCard = document.getElementById('mor-help-card');
  if(r.morHelpRows){
    morHelpCard.classList.remove('hidden');
    morHelpCard.classList.add('collapsed');
    document.getElementById('mor-help-rows').innerHTML = infoRowsHTML(r.morHelpRows);
    document.getElementById('mor-help-title').innerHTML = (r.morHelpTitle || 'Hjelp med denne kalkulatoren') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('mor-help-desc').textContent = r.morHelpDesc || 'Slik bruker du boliglånskalkulatoren';
  } else {
    morHelpCard.classList.add('hidden');
  }
  setText('mor-title', r.morTitle || 'Mortgage Calculator');
  setText('mor-desc', r.morDesc || 'Monthly payments and total loan costs.');
  setText('mor-l-amount', r.lAmount || 'Loan Amount');
  setText('mor-l-rate', r.lRate || 'Interest Rate (%)');
  setText('mor-l-years', r.lYears || 'Term (years)');
  setText('btn-calc-m', r.btnCalc || 'Calculate →');
  setText('mor-r-mth', r.morRMth || 'Monthly Payment');
  setText('mor-r-tot', r.morRTot || 'Total Repayment');
  setText('mor-r-int', r.morRInt || 'Total Interest');
  setText('mor-r-eff', r.morREff || 'Effective Rate');
  setText('mor-r-y1i', r.morRY1i || 'Year 1 Interest');
  setText('mor-r-y1p', r.morRY1p || 'Year 1 Principal');
  setText('mor-r-first', r.morRFirst || 'Første måned');
  setText('mor-r-last', r.morRLast || 'Siste måned');
  setText('mor-l-fees', r.morLFees || 'Månedlige omkostninger (kr)');
  setText('mor-fees-hint', r.morFeesHint || 'Termingebyr, forsikring, felleskostnader o.l.');
  setText('mor-l-io', r.morIoToggle || 'Avdragsfri periode');
  setText('mor-l-ioyrs', r.morIoYrsLabel || 'Avdragsfri periode (år)');
  setText('mor-io-section-hdr', r.morIoSectionHdr || 'Avdragsfri periode');
  setText('mor-r-fees-tot', r.morRFeesTot || 'Totale omkostninger');
  setText('mor-tax-hdr', r.morTaxHdr || 'Skattefradrag (22 %)');
  setText('mor-r-tax', r.morRTax || 'Totalt skattefradrag');
  setText('mor-r-tax-y1', r.morRTaxY1 || 'År 1 skattefradrag');
  setText('mor-r-io-mthfree', r.morRIoMthFree || 'Månedlig (kun renter)');
  setText('mor-r-io-mthafter', r.morRIoMthAfter || 'Månedlig etter');
  setText('mor-r-io-extra', r.morRIoExtra || 'Ekstra rentekostnad');
  const morReqEl = document.getElementById('mor-req-title');
  if(morReqEl) morReqEl.innerHTML = (r.morReqTitle || 'Krav til boliglån') + ' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('mor-req-desc', r.morReqDesc || 'Egenkapital, gjeldsgrad, stresstest, avdrag');
  if(r.morReqRows) {
    document.getElementById('mor-req-rows').innerHTML = infoRowsHTML(r.morReqRows);
    document.getElementById('mor-cost-rows').innerHTML = infoRowsHTML(r.morCostRows||[]);
    document.getElementById('mor-cost-card').classList.remove('hidden');
  } else {
    document.getElementById('mor-req-rows').innerHTML = infoRowsHTML(r.morInfoRows||[]);
    document.getElementById('mor-cost-card').classList.add('hidden');
  }
  const morCostEl = document.getElementById('mor-cost-title');
  if(morCostEl) morCostEl.innerHTML = (r.morCostTitle || 'Kostnader ved boligkjøp') + ' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('mor-cost-desc', r.morCostDesc || 'Renter, skattefradrag, dokumentavgift');
  // BSU card
  const morBsuEl = document.getElementById('mor-bsu-title');
  if(morBsuEl) morBsuEl.innerHTML = (r.morBsuTitle || 'BSU — Boligsparing for ungdom') + ' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('mor-bsu-desc', r.morBsuDesc || 'Skattefradrag, sparebeløp, aldersgrense, bruksvilkår');
  if(r.morBsuRows) {
    document.getElementById('mor-bsu-rows').innerHTML = infoRowsHTML(r.morBsuRows);
    document.getElementById('mor-bsu-card').classList.remove('hidden');
  } else {
    document.getElementById('mor-bsu-card').classList.add('hidden');
  }
  // Interest-only loan card
  const morIoEl = document.getElementById('mor-io-title');
  if(morIoEl) morIoEl.innerHTML = (r.morIoTitle || 'Avdragsfritt lån') + ' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('mor-io-desc', r.morIoDesc || 'Sammenlign avdragsfritt vs. annuitet fra dag 1');
  setText('io-l-amount', r.ioLAmount || r.lAmount || 'Lånebeløp (kr)');
  setText('io-l-rate', r.ioLRate || r.lRate || 'Rente (%)');
  setText('io-l-iofree', r.ioLIoFree || 'Avdragsfri periode (år)');
  setText('io-l-total', r.ioLTotal || r.lYears || 'Total løpetid (år)');
  setText('btn-calc-io', r.btnCalc || 'Beregn →');
  setText('io-r-lbl', r.ioRLbl || 'Avdragsfritt lån — oversikt');
  setText('io-sec-during', r.ioSecDuring || 'I avdragsfri periode');
  setText('io-sec-after', r.ioSecAfter || 'Etter avdragsfri periode');
  setText('io-sec-compare', r.ioSecCompare || 'Sammenligning');
  setText('io-rl-mthfree', r.ioRlMthFree || 'Månedlig betaling (kun renter)');
  setText('io-rl-totfree', r.ioRlTotFree || 'Totale renter i perioden');
  setText('io-rl-mthafter', r.ioRlMthAfter || 'Månedlig betaling (annuitet)');
  setText('io-rl-intafter', r.ioRlIntAfter || 'Renter i restperioden');
  setText('io-rl-totint-io', r.ioRlTotIntIo || 'Totale renter (med avdragsfritt)');
  setText('io-rl-totint-ann', r.ioRlTotIntAnn || 'Totale renter (annuitet fra dag 1)');
  setText('io-rl-diff', r.ioRlDiff || 'Ekstra rentekostnad');
  setText('io-rl-annmth', r.ioRlAnnMth || 'Månedlig annuitet fra dag 1');
}

function updateNpvUI() {
  const r = R();
  // Bilkostnadskalkulator labels
  var bilEl=document.getElementById('bil-title');if(bilEl)bilEl.innerHTML=(r.bilTitle || 'Car Cost Calculator')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('bil-desc', r.bilDesc || 'See what your car really costs you per month and over time');
  if(document.getElementById('bil-intro')) document.getElementById('bil-intro').textContent = r.bilIntro || 'Most people underestimate the cost of car ownership. Beyond the purchase price come depreciation, insurance, fuel, service, tires, road tax and tolls. The figures below are rough estimates based on averages from NAF and OFV — intended only to illustrate how expensive car ownership really is.';
  setText('bil-l-merke', r.bilLMerke || 'Car brand');
  setText('bil-l-pris', r.bilLPris || 'Purchase price (kr)');
  setText('bil-l-aar', r.bilLAar || 'Ownership period (years)');
  setText('bil-l-km', r.bilLKm || 'Annual mileage (km)');
  setText('bil-l-startKm', r.bilLStartKm || 'Mileage at purchase (km)');
  setText('bil-l-tilstand', r.bilLTilstand || 'Bought as');
  setText('bil-l-modell', r.bilLModell || 'Year model');
  setText('bil-l-kjopsaar', r.bilLKjopsaar || 'Year of purchase');
  setText('bil-l-drivstoff', r.bilLDrivstoff || 'Fuel type');
  setText('bil-manual-hdr', r.bilManualHdr || 'These can be filled in manually, if desired');
  setText('bil-l-forsikring', r.bilLForsikring || 'Insurance (kr/mo)');
  setText('bil-l-drivstoff-mnd', r.bilLDrivstoffMnd || 'Fuel/charging (kr/mo)');
  setText('bil-l-service-mnd', r.bilLServiceMnd || 'Service and maintenance (kr/mo)');
  setText('bil-l-bom-mnd', r.bilLBomMnd || 'Tolls (kr/mo)');
  setText('btn-calc-bil', r.bilBtn || 'Calculate car cost →');
  setText('bil-r-lbl', r.bilRLbl || 'Total ownership cost');
  setText('bil-rl-mnd', r.bilRMnd || 'Cost per month');
  setText('bil-rl-km', r.bilRKm || 'Cost per km');
  setText('bil-rl-verditap', r.bilRVerditap || 'Depreciation');
  setText('bil-rl-driv', r.bilRDriv || 'Fuel / charging');
  setText('bil-rl-fors', r.bilRFors || 'Insurance');
  setText('bil-rl-service', r.bilRService || 'Service and maintenance');
  setText('bil-rl-dekk', r.bilRDekk || 'Tires (wear)');
  setText('bil-rl-avgift', r.bilRAvgift || 'Road tax');
  setText('bil-rl-bom', r.bilRBom || 'Tolls (estimate)');
  setText('bil-r-info', r.bilRInfo || '= Depreciation + Fuel + Insurance + Service + Tires + Road tax + Tolls');
  // Bil dropdowns & disclaimer
  repopulateSelect('bil-merke', r.bilMerkeOpts || ['Gjennomsnitt','Toyota','Volkswagen','Volvo','Škoda','Hyundai / Kia','BMW','Mercedes-Benz','Audi','Tesla'], ['snitt','toyota','volkswagen','volvo','skoda','hyundai','bmw','mercedes','audi','tesla']);
  repopulateSelect('bil-drivstoff', r.bilFuelOpts || ['Bensin','Diesel','Elbil'], ['bensin','diesel','elbil']);
  setText('bil-disclaimer', r.bilDisclaimer || '* Rough estimate. Actual costs vary with driving pattern, location, insurance terms and vehicle condition.');
  // Budsjett labels
  var budEl=document.getElementById('budsjett-title');if(budEl)budEl.innerHTML=(r.budsjettTitle||'Budsjettkalkulator')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('budsjett-desc',r.budsjettDesc||'Lag et personlig budsjett med alle inntekter og utgifter — last ned som CSV');
  setText('budsjett-intro',r.budsjettIntro||'Legg inn alle inntektene og utgiftene dine for å få full oversikt over økonomien. Du kan legge til så mange poster du vil, og laste ned budsjettet som CSV.');
  setText('budsjett-l-income-hdr',r.budLIncomeHdr||'Inntekter');
  setText('budsjett-l-expense-hdr',r.budLExpenseHdr||'Utgifter');
  setText('budsjett-col-desc-i',r.budColDesc||'Description');
  setText('budsjett-col-amount-i',r.budColAmount||'Amount (kr/mo)');
  setText('budsjett-col-desc-e',r.budColDesc||'Description');
  setText('budsjett-col-amount-e',r.budColAmount||'Amount (kr/mo)');
  var phI=document.getElementById('budsjett-ph-income');if(phI)phI.placeholder=r.budPlaceholderIncome||'e.g. Salary';
  var phE=document.getElementById('budsjett-ph-expense');if(phE)phE.placeholder=r.budPlaceholderExpense||'e.g. Rent';
  setText('budsjett-btn-add-income','+ '+(r.budBtnAdd||'Legg til'));
  setText('budsjett-btn-add-expense','+ '+(r.budBtnAdd||'Legg til'));
  setText('btn-calc-budsjett',r.budBtnCalc||'Beregn budsjett →');
  setText('budsjett-r-lbl',r.budRLbl||'Månedlig balanse');
  setText('budsjett-r-lbl-income',r.budRLblIncome||'Sum inntekter');
  setText('budsjett-r-lbl-expense',r.budRLblExpense||'Sum utgifter');
  setText('budsjett-r-lbl-savings',r.budRLblSavings||'Sparerate');
  setText('budsjett-r-lbl-annual',r.budRLblAnnual||'Årlig overskudd');
  setText('budsjett-btn-pdf',r.budBtnPdf||'Last ned (CSV)');
  var csvTipEl=document.getElementById('budsjett-csv-tip');
  if(csvTipEl)csvTipEl.innerHTML='<strong>'+(r.budCsvTipLabel||'Tips')+':</strong> '+(r.budCsvTip||'Hvis kolonnene ikke deles automatisk i Excel: Merk kolonne A → Data → Tekst til kolonner → Skilletegn → Semikolon → Fullfør.');
  // Update category dropdowns
  document.querySelectorAll('#budsjett-expense-rows .budsjett-cat').forEach(function(sel){
    var val=sel.value;sel.innerHTML=budsjettCatOptions(r);sel.value=val;
  });
  // NPV labels
  var npvEl=document.getElementById('npv-title');if(npvEl)npvEl.innerHTML=(r.npvTitle || 'NPV / IRR Calculator')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('npv-desc', r.npvDesc || 'Net present value and internal rate of return.');
  setText('npv-l-inv', r.lInv || 'Initial Investment');
  setText('npv-l-rate', r.lRateD || 'Discount Rate (%)');
  ['1','2','3','4','5'].forEach(i => setText('npv-l-cf'+i, (r['lCF'+i])||('Cash Flow Year '+i)));
  setText('btn-calc-n', r.btnCalc || 'Calculate →');
  setText('npv-r-lbl', r.npvRLbl || 'Net Present Value (NPV)');
  setText('npv-r-pay', r.npvRPay || 'Payback Period');
  setText('npv-r-sum', r.npvRSum || 'Total Cash Flows');
  setText('npv-r-pi', r.npvRPi || 'Profitability Index');
  // Budsjett howto card
  const budHowtoCard = document.getElementById('bud-howto-card');
  if(budHowtoCard) {
    document.getElementById('bud-howto-title').innerHTML = (r.budHowtoTitle || 'Slik bruker du Budsjettkalkulator') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('bud-howto-desc', r.budHowtoDesc || 'Steg-for-steg guide til budsjettering');
    if(r.budHowtoRows){document.getElementById('bud-howto-rows').innerHTML=infoRowsHTML(r.budHowtoRows);budHowtoCard.classList.remove('hidden');}
    else{budHowtoCard.classList.add('hidden');}
  }
  // Bil howto card
  const bilHowtoCard = document.getElementById('bil-howto-card');
  if(bilHowtoCard) {
    document.getElementById('bil-howto-title').innerHTML = (r.bilHowtoTitle || 'Slik bruker du Bilkostnadskalkulator') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('bil-howto-desc', r.bilHowtoDesc || 'Steg-for-steg guide til bilkostnader');
    if(r.bilHowtoRows){document.getElementById('bil-howto-rows').innerHTML=infoRowsHTML(r.bilHowtoRows);bilHowtoCard.classList.remove('hidden');}
    else{bilHowtoCard.classList.add('hidden');}
  }
  // NPV Howto card
  const npvHowtoCard = document.getElementById('npv-howto-card');
  if(npvHowtoCard) {
    document.getElementById('npv-howto-title').innerHTML = (r.npvHowtoTitle || 'How to use the calculator') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('npv-howto-desc', r.npvHowtoDesc || 'Step-by-step guide to NPV and IRR');
    if(r.npvHowtoRows){document.getElementById('npv-howto-rows').innerHTML=infoRowsHTML(r.npvHowtoRows);npvHowtoCard.classList.remove('hidden');}
    else{npvHowtoCard.classList.add('hidden');}
  }
}

function updateVatUI() {
  const r = R();
  // Help card
  const vatHelpCard = document.getElementById('vat-help-card');
  if(r.vatHelpRows){
    vatHelpCard.classList.remove('hidden');
    vatHelpCard.classList.add('collapsed');
    document.getElementById('vat-help-rows').innerHTML = infoRowsHTML(r.vatHelpRows,'mval');
    document.getElementById('vat-help-title').innerHTML = (r.vatHelpTitle || 'Hjelp med denne kalkulatoren') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('vat-help-desc').textContent = r.vatHelpDesc || 'Slik bruker du MVA-kalkulatoren';
  } else {
    vatHelpCard.classList.add('hidden');
  }
  setText('vat-title', r.vatTitle || 'VAT / Tax Calculator');
  setText('vat-desc', r.vatDesc || 'Calculate tax amounts and prices incl/excl.');
  setText('vat-l-amount', r.lVatAmount || 'Amount');
  setText('vat-l-rate', r.lVatRate || 'Tax Rate');
  setText('vat-l-type', r.lVatType || 'Amount is');
  setText('btn-calc-v', r.btnCalc || 'Calculate →');
  setText('vat-r-incl', r.vatRIncl || 'Price Incl. Tax');
  setText('vat-r-excl', r.vatRExcl || 'Excl. Tax');
  setText('vat-r-tax', r.vatRTax || 'Tax Amount');
  setText('vat-r-pct', r.vatRPct || 'Rate %');
  setText('vat-info-title', r.vatInfoTitle || 'Tax Rates Reference');
  setText('vat-info-desc', r.vatInfoDesc || 'Official rates for selected region');
  document.getElementById('vat-info-rows').innerHTML = infoRowsHTML(r.vatInfoRows||[],'mval');
  const vr = document.getElementById('v-r');
  vr.innerHTML = (r.vatRates||[]).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  if(r.vatOptEx) { const oe=document.getElementById('vat-opt-ex'); if(oe) oe.textContent=r.vatOptEx; }
  if(r.vatOptInc) { const oi=document.getElementById('vat-opt-inc'); if(oi) oi.textContent=r.vatOptInc; }
  // "Hva er avgift?" intro card
  const vatIntroCard = document.getElementById('vat-intro-card');
  if(vatIntroCard) {
    if(r.vatIntroRows) {
      vatIntroCard.classList.remove('hidden'); vatIntroCard.classList.add('collapsed');
      document.getElementById('vat-intro-title').innerHTML = (r.vatIntroTitle || 'Hva er avgift (MVA)?') + ' <span style="font-size:11px;opacity:.5">▼</span>';
      document.getElementById('vat-intro-desc').textContent = r.vatIntroDesc || 'Kort forklaring for deg som er ny i Norge';
      document.getElementById('vat-intro-rows').innerHTML = infoRowsHTML(r.vatIntroRows,'mval');
    } else {
      vatIntroCard.classList.add('hidden');
    }
  }
  // "Hvem er avgiftspliktig?" card
  const vatSubjCard = document.getElementById('vat-subj-card');
  if(vatSubjCard) {
    if(r.vatSubjRows) {
      vatSubjCard.classList.remove('hidden'); vatSubjCard.classList.add('collapsed');
      const subjTitleEl = document.getElementById('vat-subj-title');
      if(subjTitleEl) subjTitleEl.innerHTML = (r.vatSubjTitle || 'Hvem er avgiftspliktig?') + ' <span style="font-size:11px;opacity:.5">▼</span>';
      setText('vat-subj-desc', r.vatSubjDesc || 'Næring, omsetningsgrense, registreringsplikt');
      document.getElementById('vat-subj-rows').innerHTML = infoRowsHTML(r.vatSubjRows,'mval');
    } else {
      vatSubjCard.classList.add('hidden');
    }
  }
  // Law cards (only for Norwegian region)
  const exemptCard = document.getElementById('vat-exempt-card');
  const zeroCard = document.getElementById('vat-zero-card');
  const defCard = document.getElementById('vat-def-card');
  const regCard = document.getElementById('vat-reg-card');
  const calcCard = document.getElementById('vat-calc-card');
  const dedCard = document.getElementById('vat-ded-card');
  const adjInfoCard = document.getElementById('vat-adj-info-card');
  const adjCard = document.getElementById('vat-adj-card');
  const arrow = ' <span style="font-size:11px;opacity:.5">▼</span>';
  const vatLawGroup = document.getElementById('vat-law-group');
  if(r.vatLawRows){
    // Show group wrapper
    vatLawGroup.classList.remove('hidden');
    setText('vat-law-group-title', r.vatLawGroupTitle || 'Merverdiavgiftsloven');
    // Build clickable desc links for MVA law group
    (function(){
      var map=[
        ['vat-def-card', r.vatDescDef||'Definisjoner'],
        ['vat-reg-card', r.vatDescReg||'Registrering'],
        ['vat-exempt-card', r.vatDescUnntak||'Unntak'],
        ['vat-calc-card', r.vatDescBeregn||'Beregning'],
        ['vat-zero-card', r.vatDescFritak||'Fritak'],
        ['vat-ded-card', r.vatDescFradrag||'Fradrag'],
        ['vat-adj-info-card', r.vatDescJust||'Justering']
      ];
      var html=map.map(function(m){return '<span class="desc-link" data-target="'+m[0]+'">'+m[1]+'</span>';}).join(' · ');
      var el=document.getElementById('vat-law-group-desc');
      if(el) el.innerHTML=html;
    })();
    // Split vatLawRows into exempt (kap. 3) and zero-rated (kap. 6)
    var exemptRows = [], zeroRows = [], section = 'exempt';
    r.vatLawRows.forEach(function(row){
      var h = row[0].toUpperCase();
      if(h.indexOf('ZERO-RATED') !== -1 || h.indexOf('FRITATT') !== -1 || h.indexOf('0 %') !== -1 && h.indexOf('—') === 0) section = 'zero';
      if(h.indexOf('DEEMED SUPPLY') !== -1 || (h.indexOf('UTTAK') !== -1 && h.indexOf('—') === 0 && h.indexOf('FRITATT') === -1)) section = 'exempt';
      if(h.indexOf('IMPORTS') !== -1 || (h.indexOf('INNFØRSEL') !== -1 && h.indexOf('—') === 0)) section = 'exempt';
      if(section === 'exempt') exemptRows.push(row); else zeroRows.push(row);
    });
    document.getElementById('vat-exempt-rows').innerHTML = infoRowsHTML(r.vatExemptRows||exemptRows,'mval');
    document.getElementById('vat-zero-rows').innerHTML = infoRowsHTML(r.vatZeroRows||zeroRows,'mval');
    document.getElementById('vat-def-rows').innerHTML = infoRowsHTML(r.vatDefRows||[],'mval');
    document.getElementById('vat-reg-rows').innerHTML = infoRowsHTML(r.vatRegRows||[],'mval');
    document.getElementById('vat-calc-rows').innerHTML = infoRowsHTML(r.vatCalcRows||[],'mval');
    document.getElementById('vat-ded-rows').innerHTML = infoRowsHTML(r.vatDedRows||[],'mval');
    document.getElementById('vat-adj-info-rows').innerHTML = infoRowsHTML(r.vatAdjRows||[],'mval');
    // Update titles
    const setTitle = (id,txt)=>{const el=document.getElementById(id);if(el)el.innerHTML=txt+arrow;};
    setTitle('vat-exempt-title', r.vatExemptTitle||'Unntak, uttak og innførsel (kap. 3)');
    setText('vat-exempt-desc', r.vatExemptDesc||'Unntatt fra loven · Uttak til privat bruk · Import');
    setTitle('vat-zero-title', r.vatZeroTitle||'Fritak (kap. 6)');
    setText('vat-zero-desc', r.vatZeroDesc||'Nullsats — 0 % utgående, full fradragsrett');
    setTitle('vat-def-title', r.vatDefTitle||'Definisjoner (§ 1-3)');
    setText('vat-def-desc', r.vatDefDesc||'Omsetning, varer, tjenester, avgiftssubjekt m.m.');
    setTitle('vat-reg-title', r.vatRegTitle||'Registrering (kap. 2)');
    setText('vat-reg-desc', r.vatRegDesc||'Fellesregistrering, frivillig reg., forhåndsregistrering');
    setTitle('vat-calc-title', r.vatCalcTitle||'Beregningsgrunnlag (kap. 4)');
    setText('vat-calc-desc', r.vatCalcDesc||'Vederlag, byttehandel, interessefellesskap, tap');
    setTitle('vat-ded-title', r.vatDedTitle||'Fradrag (kap. 8)');
    setText('vat-ded-desc', r.vatDedDesc||'Hovedregel, delt bruk, begrensninger');
    setTitle('vat-adj-info-title', r.vatAdjInfoTitle||'Justering (kap. 9)');
    setText('vat-adj-info-desc', r.vatAdjInfoDesc||'Kapitalvarer, justeringsperioder');
  } else {
    vatLawGroup.classList.add('hidden');
  }
  // Adjustment calculator — translate labels
  if(adjCard) {
    var ael=document.getElementById('vat-adj-title');if(ael)ael.innerHTML=(r.adjTitle||'Justeringskalkulator')+arrow;
    setText('vat-adj-desc', r.adjDesc||'Mval. kap. 9 — justering av inngående MVA ved bruksendring');
    setText('adj-l-type', r.adjLType||'Type kapitalvare');
    const optP=document.getElementById('adj-opt-prop'); if(optP) optP.textContent=r.adjOptProp||'Fast eiendom (§ 9-1 b) — 10 år';
    const optM=document.getElementById('adj-opt-mach'); if(optM) optM.textContent=r.adjOptMach||'Maskiner & inventar (§ 9-1 a) — 5 år';
    setText('adj-l-mva', r.adjLMva||'Total inngående MVA (kr)');
    setText('adj-l-years', r.adjLYears||'År brukt');
    setText('adj-l-old', r.adjLOld||'Gammel andel (%)');
    setText('adj-l-new', r.adjLNew||'Ny andel (%)');
    setText('adj-hint-type', r.adjHintType||'Bestemmer justeringsperioden — eiendom: 10 år, maskiner: 5 år');
    setText('adj-hint-mva', r.adjHintMva||'MVA-beløpet du opprinnelig fikk fradrag for');
    setText('adj-hint-years', r.adjHintYears||'Hele år siden MVA-fradraget ble tatt');
    setText('adj-hint-old', r.adjHintOld||'Andel avgiftspliktig bruk før endringen');
    setText('adj-hint-new', r.adjHintNew||'Andel avgiftspliktig bruk etter endringen');
    setText('adj-r-info', r.adjRInfo||'= (MVA ÷ periode) × endring i andel × gjenståend år');
    setText('btn-calc-adj', r.adjBtn||'Beregn justering →');
    setText('adj-rl-base', r.adjRlBase||'Årlig grunnbeløp (MVA/periode)');
    setText('adj-rl-annual', r.adjRlAnnual||'Årlig justering');
    setText('adj-rl-remain', r.adjRlRemain||'Gjenværende år');
    setText('adj-rl-change', r.adjRlChange||'Endring i andel');
    setText('adj-explain-title', r.adjExplain||'Forklaring av justeringsreglene (mval. kap. 9)');
    // Adjustment (MVA) explanation
    setText('adj-ex-title', r.adjExTitle || 'Forklaring av justeringsreglene (mval. kap. 9)');
    setText('adj-ex-what', r.adjExWhat || 'Hva er justering?');
    setText('adj-ex-whatdesc', r.adjExWhatDesc || 'Når du har fradragsført inngående MVA...');
    setText('adj-ex-cap', r.adjExCap || 'Kapitalvarer (§ 9-1)');
    setText('adj-ex-mach', r.adjExMach || 'Maskiner & inventar (a)');
    setText('adj-ex-machthres', r.adjExMachthres || 'Terskel: 50 000 kr MVA');
    setText('adj-ex-machper', r.adjExMachper || 'Periode: 5 år');
    setText('adj-ex-machfoot', r.adjExMachfoot || 'Inkl. driftsmidler — ikke fritatte kjøretøy (§ 6-7)');
    setText('adj-ex-prop', r.adjExProp || 'Fast eiendom (b)');
    setText('adj-ex-propthres', r.adjExPropthres || 'Terskel: 100 000 kr MVA');
    setText('adj-ex-propper', r.adjExPropper || 'Periode: 10 år');
    setText('adj-ex-propfoot', r.adjExPropfoot || 'Ny-, på- eller ombygging av fast eiendom');
    setText('adj-ex-when', r.adjExWhen || 'Når skal du justere? (§ 9-2)');
    setText('adj-ex-whendesc', r.adjExWhendesc || 'Justering utløses når bruken endres...');
    if(document.getElementById('adj-ex-when1')) document.getElementById('adj-ex-when1').innerHTML = r.adjExWhen1 || 'Bruksendring...';
    if(document.getElementById('adj-ex-when2')) document.getElementById('adj-ex-when2').innerHTML = r.adjExWhen2 || 'Salg av driftsmidler...';
    if(document.getElementById('adj-ex-when3')) document.getElementById('adj-ex-when3').innerHTML = r.adjExWhen3 || 'Overdragelse av eiendom...';
    if(document.getElementById('adj-ex-when4')) document.getElementById('adj-ex-when4').innerHTML = r.adjExWhen4 || 'Virksomhetsoverdragelse...';
    if(document.getElementById('adj-ex-when5')) document.getElementById('adj-ex-when5').innerHTML = r.adjExWhen5 || 'Unntak: Uttak...';
    setText('adj-ex-transfer', r.adjExTransfer || 'Overføring av justeringsplikt (§ 9-3)');
    setText('adj-ex-transferdesc', r.adjExTransferdesc || 'Ved overdragelse kan kjøper overta...');
    setText('adj-ex-calc', r.adjExCalc || 'Beregning (§ 9-5)');
    setText('adj-ex-calcformula', r.adjExCalcformula || 'Formel:');
    setText('adj-ex-calcf1', r.adjExCalcf1 || 'Årlig justering = (Inngående MVA ÷ periode)...');
    setText('adj-ex-calcf2', r.adjExCalcf2 || 'Total justering = Årlig justering × gjenværende år');
    setText('adj-ex-calcfoot', r.adjExCalcfoot || 'Negativt = tilbakebetaling...');
    setText('adj-ex-rev', r.adjExRev || 'Tilbakeføring (§ 9-6 og § 9-7)');
    setText('adj-ex-revdesc', r.adjExRevdesc || 'Tilbakeføring er noe annet enn justering...');
    if(document.getElementById('adj-ex-rev1')) document.getElementById('adj-ex-rev1').innerHTML = r.adjExRev1 || 'Personkjøretøy...';
    if(document.getElementById('adj-ex-rev2')) document.getElementById('adj-ex-rev2').innerHTML = r.adjExRev2 || 'Eiendom før fullføring...';
    if(document.getElementById('adj-ex-rev3')) document.getElementById('adj-ex-rev3').innerHTML = r.adjExRev3 || 'Unntak: Kondemnering...';
    setText('adj-ex-source', r.adjExSource || 'Kilde: Merverdiavgiftsloven kap. 9...');
  }
  // AGA card (moved from salary)
  const vatAgaCard = document.getElementById('vat-aga-card');
  if(vatAgaCard) {
    document.getElementById('vat-aga-title').innerHTML=(r.salAgaTitle||'Employer Social Security (AGA zones)')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('vat-aga-desc', r.salAgaDesc || 'Rates vary by business location');
    if(r.salAgaRows){document.getElementById('vat-aga-rows').innerHTML=infoRowsHTML(r.salAgaRows)+'<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);"><a href="javascript:void(0)" onclick="goToLvuCalc()" style="font-size:12px;font-weight:600;color:var(--accent);text-decoration:none;opacity:.8;">Lønn vs Utbytte-kalkulator →</a></div>';vatAgaCard.classList.remove('hidden');}
    else{vatAgaCard.classList.add('hidden');}
  }
}

function updateUttakUI() {
  const r = R();
  var el=document.getElementById('uttak-title');if(el)el.innerHTML=(r.uttakTitle||'Uttakskalkulator')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('uttak-desc', r.uttakDesc || 'Tax Act § 5-2 — tax on withdrawal of assets from business');
  setText('uttak-l-type', r.uttakLType || 'Type of business');
  setText('uttak-l-mv', r.uttakLMv || 'Market value at withdrawal (kr)');
  setText('uttak-l-sv', r.uttakLSv || 'Tax basis value (kr)');
  setText('uttak-l-andel', r.uttakLAndel || 'Share withdrawn to private (%)');
  setText('uttak-l-skjerming', r.uttakLSkjerming || 'Shielding deduction (kr)');
  setText('uttak-l-personinntekt', r.uttakLPerson || 'Is the withdrawal personal income?');
  setText('btn-calc-uttak', r.uttakBtn || 'Calculate withdrawal →');
  setText('uttak-opt-enk', r.uttakOptEnk || 'Sole proprietorship (ENK)');
  setText('uttak-opt-as', r.uttakOptAs || 'Limited company (AS)');
  setText('uttak-opt-ja', r.uttakOptJa || 'Yes — business income (bracket tax + national insurance)');
  setText('uttak-opt-nei', r.uttakOptNei || 'No — ordinary income only');
  setText('uttak-r-lbl', r.uttakRLbl || 'Tax on withdrawal');
  setText('uttak-rl-gevinst', r.uttakRGevinst || 'Withdrawal gain');
  setText('uttak-rl-alm', r.uttakRAlm || 'Ordinary income tax (22 %)');
  setText('uttak-rl-trygd', r.uttakRTrygd || 'National insurance (7.6 %)');
  setText('uttak-rl-trinn', r.uttakRTrinn || 'Bracket tax');
  setText('uttak-rl-selskap', r.uttakRSelskap || 'Company tax (22 %)');
  setText('uttak-rl-utbytte', r.uttakRUtbytte || 'Dividend tax shareholder');
  setText('uttak-ex-title', r.uttakExTitle || 'Explanation of withdrawal rules (Tax Act § 5-2)');
  setText('uttak-ex-what', r.uttakExWhat || 'What is withdrawal taxation?');
  setText('uttak-ex-whatdesc', r.uttakExWhatDesc || 'When you withdraw an asset...');
  setText('uttak-ex-diff', r.uttakExDiff || 'Difference between sole proprietorship and limited company');
  setText('uttak-ex-enk', r.uttakExEnk || 'Sole proprietorship (ENK)');
  setText('uttak-ex-enk1', r.uttakExEnk1 || 'Tax: Ordinary income 22%');
  setText('uttak-ex-enk2', r.uttakExEnk2 || '+ National insurance 7.6%');
  setText('uttak-ex-enk3', r.uttakExEnk3 || '+ Bracket tax (if personal income)');
  setText('uttak-ex-enkcond', r.uttakExEnkcond || 'Condition: Cost price wholly/partly deducted (§ 5-2(1))');
  setText('uttak-ex-as', r.uttakExAs || 'Limited company (AS)');
  setText('uttak-ex-as1', r.uttakExAs1 || 'Level 1: Company tax 22%');
  setText('uttak-ex-as2', r.uttakExAs2 || 'Level 2: Dividend tax ~37.84%');
  setText('uttak-ex-as3', r.uttakExAs3 || 'Uplift factor: ×1.72');
  setText('uttak-ex-ascond', r.uttakExAscond || 'Withdrawal treated as dividend for shareholder');
  setText('uttak-ex-val', r.uttakExVal || 'Valuation (§ 5-2 / § 5-3)');
  setText('uttak-ex-formula', r.uttakExFormula || 'Formula:');
  setText('uttak-ex-f1', r.uttakExF1 || 'Withdrawal gain = Market value − Tax depreciated value');
  setText('uttak-ex-f2', r.uttakExF2 || 'ENK: Tax = Gain × (22% + national insurance + bracket tax)');
  setText('uttak-ex-f3', r.uttakExF3 || 'AS: Company tax = Gain × 22% · Dividend tax = (Gain − shielding) × 1.72 × 22%');
  setText('uttak-ex-ffoot', r.uttakExFfoot || 'Market value = transaction value at time of withdrawal');
  setText('uttak-ex-exc', r.uttakExExc || 'Exceptions and special rules');
  if(document.getElementById('uttak-ex-exc1')) document.getElementById('uttak-ex-exc1').innerHTML = r.uttakExExc1 || 'ENK condition...';
  if(document.getElementById('uttak-ex-exc2')) document.getElementById('uttak-ex-exc2').innerHTML = r.uttakExExc2 || 'Business transfer...';
  if(document.getElementById('uttak-ex-exc3')) document.getElementById('uttak-ex-exc3').innerHTML = r.uttakExExc3 || 'Participation exemption...';
  if(document.getElementById('uttak-ex-exc4')) document.getElementById('uttak-ex-exc4').innerHTML = r.uttakExExc4 || 'Group relations...';
  if(document.getElementById('uttak-ex-exc5')) document.getElementById('uttak-ex-exc5').innerHTML = r.uttakExExc5 || 'Private use...';
  setText('uttak-ex-source', r.uttakExSource || 'Source: Tax Act § 5-2...');
  // Utdelingsmodellen card
  var utdEl=document.getElementById('utdeling-title');if(utdEl)utdEl.innerHTML=(r.utdelingTitle||'Dividend Tax Model')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('utdeling-desc', r.utdelingDesc || 'Effective tax burden on distributions from AS and sole prop.');
  if(document.getElementById('utdeling-intro')) document.getElementById('utdeling-intro').innerHTML = r.utdelingIntro || 'This calculator shows the combined tax burden when profits are distributed to the owner. For <b>AS</b>: corporate tax 22% + dividend tax 37.84% = <b>51.5%</b>. For <b>sole prop.</b>: ordinary income 22% + national insurance 10.8% + bracket tax = up to <b>50.6%</b>.';
  setText('utdeling-l-type', r.utdelingLType || 'Business form');
  setText('utdeling-opt-as', r.utdelingOptAs || 'Limited company (AS) — shareholder model');
  setText('utdeling-opt-enk', r.utdelingOptEnk || 'Sole proprietorship (ENK) — enterprise model');
  setText('utdeling-l-overskudd', r.utdelingLOverskudd || 'Pre-tax profit (kr)');
  setText('utdeling-l-skjerming', r.utdelingLSkjerming || 'Shielding deduction (kr)');
  setText('btn-calc-utdeling', r.utdelingBtn || 'Calculate effective tax →');
  setText('utdeling-r-lbl', r.utdelingRLbl || 'Total tax burden');
  // AS labels
  setText('utdeling-rl-overskudd', r.utdelingROverskudd || 'Pre-tax profit');
  setText('utdeling-rl-selskap', r.utdelingRSelskap || 'Corporate tax (22%)');
  setText('utdeling-rl-etter', r.utdelingREtter || 'After corporate tax');
  setText('utdeling-rl-skjerming', r.utdelingRSkjerming || '− Shielding deduction');
  setText('utdeling-rl-oppjustert', r.utdelingROppjustert || 'Uplifted dividend (×1.72)');
  setText('utdeling-rl-utbytte', r.utdelingRUtbytte || 'Dividend tax shareholder (22%)');
  setText('utdeling-rl-total', r.utdelingRTotal || 'Total tax (both levels)');
  setText('utdeling-rl-netto', r.utdelingRNetto || 'Net to owner');
  setText('utdeling-rl-eff', r.utdelingREff || 'Effective tax rate');
  // ENK labels
  setText('utdeling-rl-enk-overskudd', r.utdelingREnkOverskudd || 'Profit (business income)');
  setText('utdeling-rl-enk-alm', r.utdelingREnkAlm || 'Ordinary income tax (22%)');
  setText('utdeling-rl-enk-skjerming', r.utdelingREnkSkjerming || '− Shielding deduction');
  setText('utdeling-rl-enk-person', r.utdelingREnkPerson || '= Calculated personal income');
  setText('utdeling-rl-enk-trygd', r.utdelingREnkTrygd || 'National insurance (10.8%)');
  setText('utdeling-rl-enk-trinn', r.utdelingREnkTrinn || 'Bracket tax');
  setText('utdeling-rl-enk-total', r.utdelingREnkTotal || 'Total tax');
  setText('utdeling-rl-enk-netto', r.utdelingREnkNetto || 'Net to owner');
  setText('utdeling-rl-enk-eff', r.utdelingREnkEff || 'Effective tax rate');
}


function repopulateSelect(id, labels, values) {
  if (!labels) return;
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '';
  labels.forEach((lbl, i) => {
    const o = document.createElement('option');
    o.value = values ? values[i] : i;
    o.textContent = lbl;
    sel.appendChild(o);
  });
  sel.value = cur;
}
function repopulateSelectByIndex(id, labels) {
  if (!labels) return;
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.selectedIndex;
  const opts = sel.querySelectorAll('option');
  labels.forEach((lbl, i) => { if(opts[i]) opts[i].textContent = lbl; });
}

function updateFagkalkulatorUI() {
  const r = R();
  // Menu labels
  setText('lbl-fagcalc', r.lblFagcalc || 'Fagkalkulatorer');
  setText('lbl-lvu', r.lblLvu || 'Lønn vs Utbytte');
  setText('lbl-aga', r.lblAga || 'Ansattkostnad');
  setText('lbl-avs', r.lblAvs || 'Avskrivning');
  setText('lbl-ferie', r.lblFerie || 'Feriepenger');
  setText('lbl-rente', r.lblRente || 'Effektiv Rente');
  setText('lbl-valgevinst', r.lblValgevinst || 'Valutagevinst');
  setText('lbl-likvid', r.lblLikvid || 'Likviditet');
  setText('lbl-pensjon', r.lblPensjon || 'Pensjon');
  // Mobile bar buttons
  setText('mobile-switch-btn', r.mobileSwitch || 'Bytt kalkulator');
  setText('mobile-focus-btn', r.mobileFocus || 'Fokus');
  setText('mobile-focus-exit', r.mobileFocusExit || 'Lukk');
  // Panel titles
  setText('bc-lvu-label', r.lblLvu || 'Lønn vs Utbytte');
  setText('bc-aga-label', r.lblAga || 'Ansattkostnad');
  setText('bc-avs-label', r.lblAvs || 'Avskrivning');
  setText('bc-ferie-label', r.lblFerie || 'Feriepenger');
  setText('bc-rente-label', r.lblRente || 'Effektiv Rente');
  setText('bc-valgevinst-label', r.lblValgevinst || 'Valutagevinst');
  setText('bc-likvid-label', r.lblLikvid || 'Likviditet');
  setText('bc-pensjon-label', r.lblPensjon || 'Pensjon');
  // Decimal label
  setText('bc-dec-lbl', r.bcDecLabel || 'Desimaler');
  // Help hints on remaining calculators (lvu, valgevinst still have links)
  const hh = r.calcHelpHint || 'Trenger du hjelp med kalkulatoren? →';
  ['bc-lvu-help'].forEach(id=>{
    const el=document.getElementById(id); if(el){const a=el.querySelector('a'); if(a) a.textContent=hh;}
  });
  const npvHelp=document.getElementById('npv-help'); if(npvHelp){const a=npvHelp.querySelector('a'); if(a) a.textContent=hh;}
  const adjHelp=document.getElementById('vat-adj-help'); if(adjHelp){const a=adjHelp.querySelector('a'); if(a) a.textContent=hh;}
  // LVU labels
  setText('lvu-l-gross', r.lvuGross || 'Beløp (brutto)');
  setText('lvu-l-zone', r.lvuZone || 'AGA-sone');
  setText('btn-calc-lvu', r.lvuBtn || 'Beregn →');
  setText('lvu-r-sal', r.lvuRSal || 'Lønn - Total kostnad');
  setText('lvu-r-div', r.lvuRDiv || 'Utbytte - Total kostnad');
  setText('lvu-r-diff', r.lvuRDiff || 'Differanse (billigste)');
  // LVU info box
  setText('lvu-info-label', r.lvuInfoLabel || 'Hva viser denne kalkulatoren?');
  setText('lvu-info-h', r.lvuInfoH || 'Kort forklart');
  const lvuInfoEl = document.getElementById('lvu-info-text');
  if(lvuInfoEl) lvuInfoEl.innerHTML = r.lvuInfoText || 'Kalkulatoren sammenligner <b>hva det koster selskapet</b> å gi deg et gitt beløp — enten som lønn eller utbytte. Den viser <b>ikke</b> hva du sitter igjen med privat.<br><br><b>Lønn:</b> Beløpet + arbeidsgiveravgift (AGA) + feriepenger (12%) + OTP (2%). Dette er selskapets totalkostnad.<br><br><b>Utbytte:</b> For å dele ut f.eks. 500 000 kr må selskapet tjene 641 026 kr før 22% selskapsskatt (500 000 / 0,78).<br><br><b>Merk:</b> Som mottaker betaler du i tillegg personlig skatt — inntektsskatt på lønn, eller utbytteskatt (oppjustert ×1,72, beskattet med 22%) på utbytte. Denne kalkulatoren tar ikke med den personlige skatten — den ser kun på selskapets side.';
  // AGA labels
  setText('aga-l-sal', r.agaSal || 'Brutto lønn per år');
  setText('aga-l-zone', r.agaZone || 'AGA-sone');
  setText('aga-l-ferie', r.agaFerie || 'Feriepenger');
  setText('aga-l-otp', r.agaOtp || 'OTP-rate');
  setText('btn-calc-aga', r.agaBtn || 'Beregn →');
  setText('aga-r-total', r.agaRTotal || 'Total årskostnad');
  setText('aga-r-aga', r.agaRAga || 'AGA');
  setText('aga-r-ferie', r.agaRFerie || 'Feriepenger');
  setText('aga-r-otp', r.agaROtp || 'OTP');
  setText('aga-r-pct', r.agaRPct || '% over brutto');
  setText('aga-per-month', r.agaPerMonth || '/mnd');
  // AVS labels
  setText('avs-l-price', r.avsPriceLabel || 'Kjøpesum (kr)');
  setText('avs-l-group', r.avsGroupLabel || 'Avskrivningsgruppe');
  setText('btn-calc-avs', r.avsBtn || 'Beregn →');
  setText('avs-table-header', r.avsDepTableHeader || '10-årig avskrivningsplan');
  setText('avs-l-life', r.avsLifeLabel || 'Utnyttbar levetid (år)');
  setText('avs-l-reg-pct', r.avsRegPctLabel || 'Avskrivningssats (%)');
  setText('avs-l-scrap', r.avsScrapLabel || 'Restverdi (%)');
  setText('avs-regnskap-info', r.avsRegnskapInfo || 'Lineær avskrivning etter rskl. § 5-3. Eiendelen avskrives jevnt over forventet utnyttbar levetid, ned til eventuell restverdi.');
  setText('avs-mode-skatt', r.avsModeSkatt || 'Skatt');
  setText('avs-mode-regnskap', r.avsModeRegnskap || 'Regnskap');
  setText('avs-mode-compare', r.avsModeCompare || 'Sammenlign');
  // FERIE labels
  setText('ferie-l-sal', r.ferieAnnualLabel || 'Årslønn');
  setText('ferie-l-type', r.ferieTypeLabel || 'Ferietype');
  setText('ferie-l-over60', r.ferieOver60Label || 'Over 60 år (+2.3% bonus)');
  setText('btn-calc-ferie', r.ferieBtn || 'Beregn →');
  setText('ferie-r-amt', r.ferieAmtLabel || 'Feriepenger');
  setText('ferie-r-daily', r.ferieDailyLabel || 'Daglig sats');
  setText('ferie-r-over60', r.ferieOver60Result || 'Med 60+ bonus');
  // RENTE labels
  setText('rente-l-amount', r.renteAmountLabel || 'Lånebeløp (kr)');
  setText('rente-l-nom', r.renteNomLabel || 'Nominell rente (%)');
  setText('rente-l-est', r.renteEstLabel || 'Etableringsavgift (kr)');
  setText('rente-l-monthly', r.renteMonthlyLabel || 'Månedlig gebyr (kr)');
  setText('rente-l-years', r.renteYearsLabel || 'Løpetid (år)');
  setText('btn-calc-rente', r.renteBtn || 'Beregn →');
  setText('rente-r-eff', r.renteEffLabel || 'Effektiv årsrente');
  setText('rente-r-total', r.renteTotalLabel || 'Total kostnad');
  setText('rente-r-fees', r.renteFeesLabel || 'Totale gebyrer');
  // VALGEVINST labels
  setText('valgevinst-l-buy-amt', r.valgavinBuyAmtLabel || 'Kjøpt beløp (NOK)');
  setText('valgevinst-l-buy-rate', r.valgevinBuyRateLabel || 'Kjøpskurs');
  setText('valgevinst-l-sell-amt', r.valgevinSellAmtLabel || 'Solgt beløp (valuta)');
  setText('valgevinst-l-sell-rate', r.valgevinSellRateLabel || 'Salgskurs');
  setText('btn-calc-val', r.valgevinBtn || 'Beregn →');
  setText('valgevinst-r-lbl', r.valgevinResultLabel || 'Gevinst/-tap (NOK)');
  setText('valgevinst-r-taxable', r.valgevinTaxableLabel || 'Skattepliktig');
  // LIKVID labels
  setText('likvid-l-start', r.likvidStartLabel || 'Startbalanse (kr)');
  setText('likvid-l-income', r.likvidIncomeLabel || 'Månedlig inntekt (kr)');
  setText('likvid-l-expense', r.likvidExpenseLabel || 'Månedlig utgift (kr)');
  setText('btn-calc-likvid', r.likvidBtn || 'Beregn →');
  // PENSJON labels
  setText('pensjon-l-age', r.pensjonAgeLabel || 'Nåværende alder');
  setText('pensjon-l-retire', r.pensjonRetireLabel || 'Pensjoneringsalder');
  setText('pensjon-l-salary', r.pensjonSalaryLabel || 'Årslønn');
  setText('pensjon-l-otp', r.pensjonOtpLabel || 'OTP-rate');
  setText('pensjon-l-return', r.pensjonReturnLabel || 'Avkastning (%)');
  setText('btn-calc-pensjon', r.pensjonBtn || 'Beregn →');
  setText('pensjon-r-pot', r.pensjonPotLabel || 'Total pensjonspott ved 67 år');
  setText('pensjon-r-annual', r.pensjonAnnualLabel || 'Estimert årlig pensjon');
  setText('pensjon-r-monthly', r.pensjonMonthlyLabel || 'Månedlig pensjon');
  setText('pensjon-r-real', r.pensjonRealLabel || 'Kjøpekraft i dag (2% inflasjon)');
  setText('pensjon-disclaimer', r.pensjonDisclaimer || 'Dette er et estimat for planleggingsformål. Faktisk pensjon kan variere basert på faktisk avkastning, bidrag og regelendringer.');

  // --- Intro texts ---
  // Refresh avs intro based on current mode
  setAvsMode(window.avsMode || 'skatt');
  setText('bc-rente-intro', r.renteIntro || 'Nominell rente er det banken oppgir. Effektiv rente inkluderer også gebyrer og etableringsavgift — den viser hva lånet faktisk koster deg.');
  setText('bc-valgevinst-intro', r.valgevinIntro || 'Beregn gevinst eller tap ved kjøp og salg av utenlandsk valuta. Gevinst beskattes med 22%.');
  setText('bc-likvid-intro', r.likvidIntro || 'Viser om du har nok penger på konto måned for måned. Startbalanse + inntekter − utgifter = det du har igjen.');
  // --- Hint texts ---
  const agaZoneHintEl = document.getElementById('aga-hint-zone');
  if(agaZoneHintEl) {
    const linkText = r.agaZoneLinkText || 'Se alle soner →';
    agaZoneHintEl.innerHTML = (r.agaZoneHint || 'AGA = arbeidsgiveravgift. Satsen avhenger av hvor bedriften holder til.') + ' <a href="javascript:void(0)" onclick="goToAgaCard()" style="color:var(--accent);text-decoration:underline;opacity:.8;">' + linkText + '</a>';
  }
  setText('aga-hint-otp', r.agaOtpHint || 'OTP = obligatorisk tjenestepensjon. Arbeidsgiver må spare minst 2% av lønn over 1G (124 028 kr i 2025) til pensjon.');
  setText('pensjon-hint', r.pensjonHint || 'OTP = obligatorisk tjenestepensjon (minst 2% av lønn over 1G). Avkastning er forventet årlig avkastning på pensjonsfond — historisk snitt ca. 5-7%.');
  // --- Additional valgevinst labels ---
  setText('valgevinst-l-currency', r.valgevinCurrencyLabel || 'Valuta');
  setText('valgevinst-l-units', r.valgevinUnitsLabel || 'Antall enheter kjøpt');
  setText('valgevinst-r-cost', r.valgevinCostLabel || 'Kostpris (NOK)');
  setText('valgevinst-r-sale', r.valgevinSaleLabel || 'Salgsverdi (NOK)');
  setText('valgevinst-r-tax', r.valgevinTaxLabel || 'Skatt (22%)');
  setText('valgevinst-r-net', r.valgevinNetLabel || 'Netto etter skatt');
  // --- Dropdown options ---
  repopulateSelect('aga-zone', r.agaZoneOpts, ['0.141','0.106','0.064','0.051','0']);
  repopulateSelect('aga-ferie', r.agaFerieOpts, ['0.102','0.12']);
  repopulateSelect('aga-otp', r.agaOtpOpts, ['0.02','0.05','0.07']);
  repopulateSelect('avs-group', r.avsGroupOpts, ['0.30','0.20','0.24','0.20','0.14','0.12','0.05','0.04','0.02','0.10']);
  repopulateSelect('ferie-type', r.ferieTypeOpts, ['0.102','0.12']);
  repopulateSelect('pensjon-otp', r.pensjonOtpOpts, ['0.02','0.05','0.07']);
  repopulateSelectByIndex('lvu-zone', r.lvuZoneOpts);

}

function updateFooter() {
  const r = R();
  const yr = new Date().getFullYear();
  setText('fl-about', r.footerAbout||'About');
  setText('fl-priv', r.footerPriv||'Privacy');
  setText('fl-con', r.footerCon||'Contact');
  setText('fl-copy', (r.footerCopy||'© 2026 Hverdagsverktøy').replace(/2026/g, yr));
  // Wire privacy link
  const privLink = document.getElementById('fl-priv');
  if(privLink) privLink.onclick = function(e){ e.preventDefault(); openPrivacy(); };
  // Wire contact link
  const conLink = document.getElementById('fl-con');
  if(conLink) conLink.onclick = function(e){ e.preventDefault(); openContact(); };
}

function openPrivacy() { updatePrivacyUI(); document.getElementById('priv-overlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closePrivacy() { document.getElementById('priv-overlay').classList.remove('open'); document.body.style.overflow=''; }

function updatePrivacyUI() {
  const r = R();
  setText('priv-back', r.privBack||'Tilbake');
  setText('priv-h1', r.privH1||'Personvernerklæring');
  setText('priv-updated', r.privUpdated||'Sist oppdatert: mars 2026');
  setText('priv-intro', r.privIntro||'Hverdagsverktøy er en gratis finanskalkulator som kjører helt og holdent i nettleseren din. Vi tar personvernet ditt på alvor — og den enkleste måten å beskytte det på er å aldri samle inn data i utgangspunktet.');
  setText('priv-h-nodata', r.privHNodata||'Ingen datainnsamling');
  setText('priv-p-nodata', r.privPNodata||'Vi samler ikke inn, lagrer eller sender noen form for personopplysninger. Alle beregninger skjer lokalt i nettleseren din. Ingen data forlater enheten din.');
  setText('priv-h-cookies', r.privHCookies||'Ingen informasjonskapsler (cookies)');
  setText('priv-p-cookies', r.privPCookies||'Denne nettsiden bruker ingen cookies — verken til analyse, sporing eller reklame. Det finnes ingen cookie-banner fordi det ikke finnes noen cookies.');
  setText('priv-h-thirdparty', r.privHThirdparty||'Ingen tredjepartstjenester');
  setText('priv-p-thirdparty', r.privPThirdparty||'Vi bruker ingen analysetjenester (Google Analytics, Facebook Pixel e.l.), ingen annonseringsnettverk og ingen sporing av noe slag. Eneste eksterne ressurs er Bunny Fonts for skrifttyper.');
  setText('priv-h-storage', r.privHStorage||'Minimal lokal lagring');
  setText('priv-p-storage', r.privPStorage||'Kalkulatoren bruker localStorage kun for å huske dine valg av tema og språk. Ingen personopplysninger lagres. Du kan slette disse når som helst via nettleserinnstillingene.');
  setText('priv-h-children', r.privHChildren||'Barn');
  setText('priv-p-children', r.privPChildren||'Siden vi ikke samler inn noen data, er tjenesten trygg å bruke for alle aldersgrupper.');
  setText('priv-h-changes', r.privHChanges||'Endringer');
  setText('priv-p-changes', r.privPChanges||'Dersom vi endrer denne erklæringen, oppdaterer vi datoen øverst. Siden vi ikke samler inn data, forventer vi ingen vesentlige endringer.');
  setText('priv-h-contact', r.privHContact||'Kontakt');
  setText('priv-p-contact', r.privPContact||'Har du spørsmål om personvern? Send en e-post til kontakt@hverdagsverktoy.com.');
}

function openContact() { updateContactUI(); document.getElementById('contact-form').style.display=''; document.getElementById('con-success').classList.remove('show'); document.getElementById('contact-overlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeContact() { document.getElementById('contact-overlay').classList.remove('open'); document.body.style.overflow=''; }

function submitContact(e) {
  e.preventDefault();
  var _cn=document.getElementById('con-name');const name=_cn?_cn.value.trim():'';
  var _ce=document.getElementById('con-email');const email=_ce?_ce.value.trim():'';
  const subjectSel = document.getElementById('con-subject');
  if(!subjectSel) return;
  const subjectText = subjectSel.options[subjectSel.selectedIndex].textContent;
  var _cm=document.getElementById('con-message');const message=_cm?_cm.value.trim():'';
  if(!name || !email || !message) return;
  const _r = R();
  const body = (_r.conMailName||'Navn') + ': ' + name + '\n' + (_r.conMailEmail||'E-post') + ': ' + email + '\n\n' + message;
  const mailto = 'mailto:kontakt@hverdagsverktoy.com?subject=' + encodeURIComponent('Hverdagsverktøy — ' + subjectText) + '&body=' + encodeURIComponent(body);
  window.open(mailto, '_blank');
  document.getElementById('contact-form').style.display='none';
  document.getElementById('con-success').classList.add('show');
}

function updateContactUI() {
  const r = R();
  setText('con-back', r.conBack||'Tilbake');
  setText('con-h1', r.conH1||'Kontakt oss');
  setText('con-sub', r.conSub||'Har du spørsmål, tilbakemeldinger eller forslag? Vi hører gjerne fra deg.');
  setText('con-l-name', r.conLName||'Navn');
  setText('con-l-email', r.conLEmail||'E-post');
  setText('con-l-subject', r.conLSubject||'Emne');
  setText('con-opt-general', r.conOptGeneral||'Generell henvendelse');
  setText('con-opt-bug', r.conOptBug||'Feilrapport');
  setText('con-opt-feature', r.conOptFeature||'Forslag til forbedring');
  setText('con-opt-other', r.conOptOther||'Annet');
  setText('con-l-message', r.conLMessage||'Melding');
  setText('con-btn', r.conBtn||'Send melding →');
  setText('con-success-h', r.conSuccessH||'Takk for meldingen!');
  setText('con-success-p', r.conSuccessP||'E-postklienten din åpnes med meldingen ferdig utfylt. Trykk «Send» i e-postklienten for å fullføre.');
  setText('con-alt-h', r.conAltH||'Direkte kontakt');
  const altP = document.getElementById('con-alt-p');
  if(altP) altP.innerHTML = (r.conAltP||'Du kan også sende e-post direkte til') + ' <a href="mailto:kontakt@hverdagsverktoy.com">kontakt@hverdagsverktoy.com</a>';
}

function setText(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }

// ═══════════════════════════════════════════════════════
// CALC TAB SWITCH
// ═══════════════════════════════════════════════════════

function stickyOffset(){
  const h=document.querySelector('header');
  const n=document.querySelector('.calc-nav');
  return (h?h.offsetHeight:0)+(n&&n.style.display!=='none'?n.offsetHeight:0)+12;
}
function scrollToEl(el,mode){
  if(!el)return;
  const off=stickyOffset();
  if(mode==='top'){
    const top=el.getBoundingClientRect().top+window.scrollY-off;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  } else {
    // 'nearest' — only scroll if not already in view
    const rect=el.getBoundingClientRect();
    const vH=window.innerHeight;
    if(rect.top<off||rect.bottom>vH){
      const top=el.getBoundingClientRect().top+window.scrollY-off;
      window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    }
  }
}
function smartScroll(el,retries){
  if(!el)return;
  retries=retries||0;
  const off=stickyOffset()+12;
  const r=el.getBoundingClientRect();
  const targetY=Math.max(0, r.top+window.scrollY-off);
  const startY=window.scrollY;
  const dist=targetY-startY;
  if(Math.abs(dist)<5&&retries>0)return;
  const dur=Math.min(500, Math.max(250, Math.abs(dist)*0.5));
  let start=null;
  function ease(t){return t<0.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;}
  function step(ts){
    if(!start)start=ts;
    const p=Math.min((ts-start)/dur,1);
    window.scrollTo(0, startY+dist*ease(p));
    if(p<1) requestAnimationFrame(step);
    else if(retries<3){
      // Re-check after CSS transitions settle (law-group expand = 550ms)
      var delay=retries===0?600:400;
      setTimeout(function(){
        const r2=el.getBoundingClientRect();
        if(Math.abs(r2.top-off)>20) smartScroll(el,retries+1);
      },delay);
    }
  }
  requestAnimationFrame(step);
}

// Reset calculator panel when switching
function resetCalcPanel(n){
  try{
    var panel=document.getElementById('calc-'+n);
    if(!panel) return;
    // Hide all result sections in this panel
    panel.querySelectorAll('.result-sec').forEach(function(r){r.classList.add('hidden');});
    // Reset specific known inputs per calculator
    var sets={
      salary:[['s-g','800,000']],
      mortgage:[['m-a','3,000,000'],['m-r','5.5'],['m-y','25']],
      npv:[['n-inv','1,000,000'],['n-r','10'],['n-c1','300,000'],['n-c2','350,000'],['n-c3','400,000'],['n-c4','400,000'],['n-c5','500,000']],
      vat:[['v-a','10,000'],['adj-mva','2,500,000'],['adj-years','4'],['adj-old','100'],['adj-new','60']]
    };
    var arr=sets[n]||[];
    arr.forEach(function(pair){
      var el=document.getElementById(pair[0]);
      if(el) el.value=pair[1];
    });
    // Reset selects to first option for known dropdowns
    var selIds={salary:['s-c','s-r'],mortgage:['m-type'],vat:['v-r','v-t','adj-type']};
    (selIds[n]||[]).forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.selectedIndex=0;
    });
    // Collapse all open info-cards (accordions)
    panel.querySelectorAll('.info-card:not(.collapsed)').forEach(function(card){
      card.classList.add('collapsed');
      var arrow=card.querySelector('.card-title span');
      if(arrow) arrow.textContent='▼';
    });
    // Collapse all open law-groups
    panel.querySelectorAll('.law-group.open').forEach(function(g){
      g.classList.remove('open');
      var body=g.querySelector('.law-group-body');
      if(body) body.style.maxHeight='0';
    });
  }catch(e){console.warn('resetCalcPanel:',e);}
}
// Page mapping for multi-page navigation
var PAGE_MAP = {dashboard:'/',basic:'/kalkulator/',salary:'/skatt/',mortgage:'/boliglan/',npv:'/personlig/',vat:'/avgift/'};
function switchCalc(n, skipScroll) {
  // If the target page content exists on current page, toggle visibility (same-page)
  var target=document.getElementById('calc-'+n);
  if(target) {
    activeCalc = n;
    ['dashboard','basic','salary','mortgage','npv','vat'].forEach(c => {
      var ce=document.getElementById('calc-'+c);if(ce)ce.classList.toggle('hidden', c!==n);
      var te=document.getElementById('tab-'+c);if(te)te.classList.toggle('active', c===n);
    });
    var cnav=document.querySelector('.calc-nav');if(cnav)cnav.style.display = n==='dashboard' ? 'none' : '';
    if(n==='dashboard'){
      setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),50);
      try{ updateDashStats(); }catch(e){}
      updateDashLabels();
    } else {
      resetCalcPanel(n);
      if(!skipScroll){
        var off=stickyOffset();
        var rect=target.getBoundingClientRect();
        window.scrollTo({top:window.pageYOffset+rect.top-off,behavior:'auto'});
      }
    }
  } else {
    // Navigate to the other page
    var page=PAGE_MAP[n];
    if(page) window.location.href=page;
  }
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
function updateDashStats() {
  const el = (id) => document.getElementById(id);
  const sv=el('dash-sal-val'),mv=el('dash-mor-val'),nv=el('dash-npv-val');
  if(sv){ sv.textContent = _sal ? fmt(_sal.net) : '–'; }
  if(mv){ mv.textContent = _mor ? fmt(_mor.mnd) + R().mo : '–'; }
  if(nv){
    nv.textContent = _npv ? fmt(_npv.npv) : '–';
    nv.style.color = '';
  }
}

function updateDashLabels() {
  const r = R();
  const el = (id,txt) => { const e=document.getElementById(id); if(e) e.textContent=txt; };
  el('tl-dash', r.dashHome || 'Hjem');
  el('dash-sal-label', r.dashSalLabel || 'Sist beregnet netto');
  el('dash-mor-label', r.dashMorLabel || 'Sist beregnet lån');
  el('dash-npv-label', r.dashNpvLabel || 'Sist beregnet NPV');
  el('dash-tools-title', r.dashToolsTitle || 'Verktøy');
  el('dash-t-basic', r.tabBasic || 'Kalkulator');
  el('dash-t-sal', r.tabSal || 'Skatt');
  el('dash-t-mor', r.tabMor || 'Boliglån');
  el('dash-t-vat', r.tabVat || 'Avgift');
  el('dash-t-npv', r.tabNpv || 'Personlig økonomi');
  el('dash-t-basic-d', r.dashDescBasic || 'Enkel, valuta, finansiell, vitenskapelig og fagkalkulatorer');
  el('dash-t-sal-d', r.dashDescSal || 'Utregning av skatt, begreper og skatteloven');
  el('dash-t-mor-d', r.dashDescMor || 'Boliglånskalkulator, krav til boliglån, kostnader og BSU');
  el('dash-t-vat-d', r.dashDescVat || 'MVA, merverdiavgiftsloven og arbeidsgiveravgift');
  el('dash-t-npv-d', r.dashDescNpv || 'Bilkostnad, budsjett og lønnsomhet');
  el('dash-ref-title', r.dashRefTitle || 'Hurtigreferanse');
  el('dash-ref-tax-h', r.dashRefTax || 'Skattesatser 2026');
  el('dash-ref-vat-h', r.dashRefVat || 'MVA-satser');
  el('dash-ref-ded-h', r.dashRefDed || 'Fradrag 2026');
  el('dr-tax1', r.drTax1 || 'Alminnelig skatt');
  el('dr-tax2', r.drTax2 || 'Trygdeavgift');
  el('dr-tax3', r.drTax3 || 'Trinnskatt 1 (226k+)');
  el('dr-tax4', r.drTax4 || 'Trinnskatt 2 (318k+)');
  el('dr-tax5', r.drTax5 || 'Trinnskatt 3 (725k+)');
  el('dr-vat1', r.drVat1 || 'Standard');
  el('dr-vat2', r.drVat2 || 'Næringsmidler');
  el('dr-vat3', r.drVat3 || 'Transport/hotell/kino');
  el('dr-vat4', r.drVat4 || 'Fritatt (eksport m.m.)');
  el('dr-ded1', r.drDed1 || 'Personfradrag');
  el('dr-ded2', r.drDed2 || 'Minstefradrag (maks)');
  el('dr-ded3', r.drDed3 || 'Fagforening (maks)');
  el('dr-ded4', r.drDed4 || 'Rentefradrag');
  // Quick ref — always visible (all languages show Norwegian rates)
  const refTitle = document.getElementById('dash-ref-title');
  const refGrid = document.getElementById('dash-ref-grid');
  if(refTitle) refTitle.classList.remove('hidden');
  if(refGrid) refGrid.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════
// CALCULATORS
// ═══════════════════════════════════════════════════════
function calcSal() {
  const r = R();
  const b = parseNum('s-g');
  if(b<=0) return;
  var _sc=document.getElementById('s-c');const kl=_sc?_sc.value:'1';
  var _sr=document.getElementById('s-r');const ks=_sr?+_sr.value:0;
  let ts = 0;
  const trinnAmounts = [];
  // Always use full Norwegian tax rules (region = language, not country)
  const almSats = ks; // 0.22 standard, 0.185 Finnmark/Nord-Troms
  const pf = (kl==='2') ? 229200 : 114540; // Personfradrag 2026
  const mf = Math.min(Math.max(b*0.46,0),95700); // Minstefradrag 2026: 46%, maks 95 700
  const renteFradrag = parseNum('s-deduct');
  const almInntekt = Math.max(b - mf - pf - renteFradrag, 0);
  // Trinnskatt 2026 (5 trinn)
  const trinnSteps = [
    [226100,318300,0.017,(r.trinnLabel1||'Trinn 1')],
    [318300,725050,0.040,(r.trinnLabel2||'Trinn 2')],
    [725050,980100,0.137,(r.trinnLabel3||'Trinn 3')],
    [980100,1467200,0.168,(r.trinnLabel4||'Trinn 4')],
    [1467200,Infinity,0.178,(r.trinnLabel5||'Trinn 5')]
  ];
  trinnSteps.forEach(([lo,hi,s,lbl])=>{const amt=b>lo?(Math.min(b,hi)-lo)*s:0;ts+=amt;trinnAmounts.push({lbl,rate:s,amt});});
  // Alminnelig inntektsskatt (22% standard, 18.5% tiltakssonen)
  const almSkatt = almInntekt * almSats;
  ts += almSkatt;
  trinnAmounts.push({lbl:(r.almSkattLabel||'Alminnelig inntektsskatt'),rate:almSats,amt:almSkatt});
  const socRate = (kl==='self') ? 0.108 : 0.076; // Trygdeavgift 2026: 10.8% selvstendig, 7.6% lønnstaker
  const soc = b * socRate;
  const tot = ts + soc;
  const net = b - tot;
  _sal = { b, net, tot, eff:tot/b*100, soc, region };
  document.getElementById('s-net').textContent = fmt(net);
  document.getElementById('s-mth').textContent = fmt(net/12) + (r.mo||'/mo');
  document.getElementById('s-tax').textContent = fmt(tot);
  document.getElementById('s-eff').textContent = pct(tot/b*100);
  document.getElementById('s-soc').textContent = fmt(soc);
  document.getElementById('s-day').textContent = fmt(net/260);
  // Rentefradrag-visning
  var deductCell = document.getElementById('s-deduct-cell');
  if(deductCell) {
    if(renteFradrag > 0) {
      document.getElementById('s-deduct-val').textContent = '- ' + fmt(renteFradrag * almSats);
      deductCell.classList.remove('hidden');
    } else {
      deductCell.classList.add('hidden');
    }
  }
  // Trinnskatt breakdown
  const tg = document.getElementById('s-trinn-grid');
  const td = document.getElementById('s-trinn');
  if(tg) {
    tg.innerHTML = trinnAmounts.map(t=>`<div class="rt"><div class="rt-lbl">${t.lbl} (${(t.rate*100).toFixed(1)}%)</div><div class="rt-val">${fmt(t.amt)}</div></div>`).join('');
    if(td) td.classList.remove('hidden');
  } else if(td) {
    td.classList.add('hidden');
  }
  document.getElementById('s-res').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('s-res'),'top'),80);
}

function calcMor() {
  const r = R();
  const P = parseNum('m-a');
  if(P<=0) return;
  const yearlyRate = +document.getElementById('m-r').value || 0;
  const mRate = yearlyRate / 100 / 12;
  const rawYears = +document.getElementById('m-y').value;
  const years = rawYears > 0 ? rawYears : 25;
  if(!rawYears) document.getElementById('m-y').value = '25';
  const n = years * 12;
  var _mt=document.getElementById('m-type');const loanType=_mt?_mt.value:'annuity';
  const serialRange = document.getElementById('m-serial-range');

  let mnd, tot, rnt, r1=0, a1=0, firstPmt, lastPmt;

  if(loanType === 'serial'){
    // Serielån: fast avdrag + synkende renter
    const avdrag = P / n; // fast månedlig avdrag
    let bal = P;
    tot = 0; rnt = 0;
    firstPmt = avdrag + bal * mRate;
    for(let i=0; i<n; i++){
      const renteIMnd = bal * mRate;
      const betaling = avdrag + renteIMnd;
      tot += betaling;
      rnt += renteIMnd;
      if(i < 12){ r1 += renteIMnd; a1 += avdrag; }
      bal -= avdrag;
    }
    const lastBal = Math.max(P - avdrag*(n-1), 0);
    lastPmt = lastBal + lastBal * mRate;
    mnd = firstPmt; // Viser første måned som hovedtall
    serialRange.classList.remove('hidden');
    document.getElementById('m-first').textContent = fmt(firstPmt);
    document.getElementById('m-last').textContent = fmt(lastPmt);
    document.getElementById('mor-r-mth').textContent = r.morRMth || 'Månedlig betaling';
  } else {
    // Annuitetslån: fast månedlig betaling
    mnd = mRate===0 ? P/n : P*mRate*Math.pow(1+mRate,n)/(Math.pow(1+mRate,n)-1);
    tot = mnd*n;
    rnt = tot - P;
    let bal = P;
    for(let i=0; i<12; i++){
      const ri = bal * mRate;
      r1 += ri;
      a1 += mnd - ri;
      bal -= (mnd - ri);
    }
    serialRange.classList.add('hidden');
    document.getElementById('mor-r-mth').textContent = r.morRMth || 'Månedlig betaling';
  }

  const effRate = mRate === 0 ? 0 : (Math.pow(1 + mRate, 12) - 1) * 100;
  _mor = { P, rate:yearlyRate, years, mnd, tot, rnt, type:loanType };
  document.getElementById('m-mth').textContent = fmt(mnd);
  document.getElementById('m-sub').textContent = fmt(tot) + ' / ' + years + ' ' + (r.yr||'yrs');
  document.getElementById('m-tot').textContent = fmt(tot);
  document.getElementById('m-int').textContent = fmt(rnt);
  document.getElementById('m-eff').textContent = effRate.toFixed(2).replace('.',',') + ' %';
  document.getElementById('m-y1i').textContent = fmt(r1);
  document.getElementById('m-y1p').textContent = fmt(a1);
  // Avdragsfritt-beregning integrert i hovedkalkulatoren
  const ioCheck = document.getElementById('m-io-check');
  const ioRes = document.getElementById('m-io-res');
  if(ioCheck && ioCheck.checked && ioRes) {
    const ioYears = +(document.getElementById('m-io-yrs').value) || 5;
    if(ioYears < years) {
      const ioMonths = ioYears * 12;
      const remainMonths = n - ioMonths;
      const mthFree = P * mRate;
      const mthAfter = mRate === 0 ? P / remainMonths : P * mRate * Math.pow(1 + mRate, remainMonths) / (Math.pow(1 + mRate, remainMonths) - 1);
      const totFreePeriodInt = mthFree * ioMonths;
      const totAfterPeriod = mthAfter * remainMonths;
      const intAfterPeriod = totAfterPeriod - P;
      const totIntIo = totFreePeriodInt + intAfterPeriod;
      const diff = totIntIo - rnt;
      document.getElementById('m-io-mthfree').textContent = fmt(mthFree);
      document.getElementById('m-io-mthafter').textContent = fmt(mthAfter);
      document.getElementById('m-io-extra').textContent = '+ ' + fmt(diff);
      ioRes.classList.remove('hidden');
    } else {
      ioRes.classList.add('hidden');
    }
  } else if(ioRes) {
    ioRes.classList.add('hidden');
  }

  // Omkostninger
  const feesPerMonth = parseNum('m-fees');
  const feesCell = document.getElementById('m-fees-cell');
  if(feesPerMonth > 0) {
    const totalFees = feesPerMonth * n;
    const grandTotal = tot + totalFees;
    document.getElementById('m-fees-tot').textContent = fmt(totalFees);
    if(feesCell) feesCell.classList.remove('hidden');
    // Totalt tilbakebetalt inkluderer omkostninger
    document.getElementById('m-tot').textContent = fmt(grandTotal);
    document.getElementById('m-mth').textContent = fmt(mnd + feesPerMonth);
    document.getElementById('m-sub').textContent = fmt(grandTotal) + ' / ' + years + ' ' + (r.yr||'yrs');
  } else {
    if(feesCell) feesCell.classList.add('hidden');
  }

  // Skattefradrag: 22% av totale renter
  const taxDeduction = rnt * 0.22;
  const taxEl = document.getElementById('m-tax');
  if(taxEl) taxEl.textContent = fmt(taxDeduction);
  const taxY1El = document.getElementById('m-tax-y1');
  if(taxY1El) taxY1El.textContent = fmt(r1 * 0.22);

  document.getElementById('m-res').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('m-res'),'top'),80);
}

// ═══════════════════════════════════════════════════════
// CAR COST CALCULATOR
// ═══════════════════════════════════════════════════════
// Brand profiles: depreciation rate (annual % of remaining), service multiplier vs average
// Sources: NAF, OFV, Autobransjens Leverandørforening, typical Norwegian market data
var BIL_MERKER = {
  snitt:      {depr:0.15, service:1.0,  label:'Gjennomsnitt'},
  toyota:     {depr:0.12, service:0.80, label:'Toyota'},
  volkswagen: {depr:0.15, service:1.00, label:'Volkswagen'},
  volvo:      {depr:0.16, service:1.05, label:'Volvo'},
  skoda:      {depr:0.14, service:0.85, label:'Škoda'},
  hyundai:    {depr:0.14, service:0.85, label:'Hyundai / Kia'},
  bmw:        {depr:0.18, service:1.35, label:'BMW'},
  mercedes:   {depr:0.19, service:1.40, label:'Mercedes-Benz'},
  audi:       {depr:0.17, service:1.30, label:'Audi'},
  tesla:      {depr:0.20, service:0.70, label:'Tesla'}
};

function bilInitYear(){
  var now=new Date().getFullYear();
  ['bil-kjopsaar','bil-aarsmodell'].forEach(function(id){
    var sel=document.getElementById(id);
    if(!sel) return;
    sel.innerHTML='';
    for(var y=now;y>=now-30;y--){
      var o=document.createElement('option');o.value=y;o.textContent=y;sel.appendChild(o);
    }
  });
}
function bilSyncEiertid(){
  var y=+document.getElementById('bil-kjopsaar').value;
  var now=new Date().getFullYear();
  var diff=now-y;
  if(diff>=0) document.getElementById('bil-aar').value=Math.max(1,diff);
}
function bilUpdateDefaults() {
  var m = document.getElementById('bil-merke').value;
  var p = BIL_MERKER[m];
  if (!p) return;
  // Clear user overrides so auto-estimate kicks in
  document.getElementById('bil-forsikring').value = '';
  var dm=document.getElementById('bil-drivstoff-mnd'); if(dm) dm.value='';
  var sm=document.getElementById('bil-service-mnd'); if(sm) sm.value='';
  var bm=document.getElementById('bil-bom-mnd'); if(bm) bm.value='';
  document.getElementById('bil-res').classList.add('hidden');
}

function calcBilkostnad() {
  var r = R();
  var pris = parseNum('bil-pris');
  if (pris <= 0) return;
  var aar = Math.max(1, Math.min(20, +document.getElementById('bil-aar').value || 5));
  var km = Math.max(1000, parseNum('bil-km') || 12000);
  var startKm = Math.max(0, parseNum('bil-start-km') || 0);
  var merke = document.getElementById('bil-merke').value;
  var drivstoff = document.getElementById('bil-drivstoff').value;
  // User overrides (monthly values) — empty = auto-estimate
  var forsikringMnd = parseNum('bil-forsikring'); // monthly
  var drivstoffMnd = parseNum('bil-drivstoff-mnd'); // monthly
  var bomMnd = parseNum('bil-bom-mnd'); // monthly
  var serviceMnd = parseNum('bil-service-mnd'); // monthly
  var bp = BIL_MERKER[merke] || BIL_MERKER.snitt;

  // 1. Depreciation (declining balance, adjusted for condition)
  var tilstand = (document.getElementById('bil-tilstand')||{}).value || 'brukt';
  var kmFactor = 1 / (1 + startKm / 150000);
  var adjDepr;
  if (tilstand === 'ny') {
    // New car: full brand depreciation rate, only adjusted for km
    adjDepr = bp.depr * kmFactor;
  } else {
    // Used car: already past steepest depreciation, reduce rate significantly
    adjDepr = bp.depr * 0.55 * kmFactor; // ~45% slower depreciation
  }
  var restverdi = pris;
  for (var i = 0; i < aar; i++) restverdi *= (1 - adjDepr);
  var verditap = pris - restverdi;

  // 2. Fuel / charging cost over period
  if (drivstoffMnd > 0) {
    var drivTotal = drivstoffMnd * 12 * aar;
  } else {
    var kmWearFactor = 1 + (startKm / 100000) * 0.05;
    var drivKostPerKm;
    if (drivstoff === 'elbil') {
      drivKostPerKm = 0.20 * 2.0 * kmWearFactor;
    } else if (drivstoff === 'diesel') {
      drivKostPerKm = 0.06 * 19.0 * kmWearFactor;
    } else {
      drivKostPerKm = 0.07 * 20.0 * kmWearFactor;
    }
    var drivTotal = drivKostPerKm * km * aar;
  }

  // 3. Insurance (user enters monthly, or auto-estimate)
  if (forsikringMnd > 0) {
    var forsTotal = forsikringMnd * 12 * aar;
  } else {
    var autoIns = merke==='bmw'||merke==='mercedes'||merke==='audi' ? 1200 : merke==='tesla' ? 1000 : merke==='volvo' ? 900 : 800;
    var forsTotal = autoIns * 12 * aar;
  }

  // 4. Service & maintenance (user enters monthly, or auto-estimate)
  if (serviceMnd > 0) {
    var serviceTotal = serviceMnd * 12 * aar;
  } else {
    // NAF/OFV average: ~8000-12000 kr/yr for fossil, ~4000-6000 for elbil
    var serviceFlat = drivstoff === 'elbil' ? 5000 : 9000;
    var avgTotalKm = startKm + (km * aar / 2);
    var serviceKmFactor = 1 + Math.max(0, avgTotalKm - 60000) / 300000;
    var servicePerAar = serviceFlat * bp.service * serviceKmFactor;
    var serviceTotal = servicePerAar * aar;
  }

  // 5. Tires: ~3500-4500 kr/yr (summer+winter sets, dekkskift, wear)
  var dekkPerAar = drivstoff === 'elbil' ? 4500 : 3500;
  var dekkTotal = dekkPerAar * aar;

  // 6. Trafikkforsikringsavgift (2025/2026 rates): fossil ~2400 kr, elbil ~3300 kr
  var avgiftPerAar = drivstoff === 'elbil' ? 3270 : 2329;
  var avgiftTotal = avgiftPerAar * aar;

  // 7. Bompenger (user monthly override or auto-estimate)
  if (bomMnd > 0) {
    var bomTotal = bomMnd * 12 * aar;
  } else {
    var bomPerAar = drivstoff === 'elbil' ? 2500 : 4500;
    var bomTotal = bomPerAar * aar;
  }

  // Totals
  var totalKostnad = verditap + drivTotal + forsTotal + serviceTotal + dekkTotal + avgiftTotal + bomTotal;
  var perMnd = totalKostnad / (aar * 12);
  var totalKm = km * aar;
  var perKm = totalKostnad / totalKm;

  document.getElementById('bil-r-val').textContent = fmt(totalKostnad);
  document.getElementById('bil-r-sub').textContent = fmt(perMnd) + (r.bilPerMnd || '/mnd') + ' · ' + perKm.toFixed(1).replace('.',',') + ' ' + r.currency + '/km · ' + aar + ' ' + (r.yr || 'år');
  // Use default theme gradient (same as other calculators)
  document.getElementById('bil-r-mnd').textContent = fmt(perMnd);
  document.getElementById('bil-r-km').textContent = perKm.toFixed(1).replace('.',',') + ' ' + r.currency;
  document.getElementById('bil-r-verditap').textContent = fmt(verditap);
  document.getElementById('bil-r-driv').textContent = fmt(drivTotal);
  document.getElementById('bil-r-fors').textContent = fmt(forsTotal);
  document.getElementById('bil-r-service').textContent = fmt(serviceTotal);
  document.getElementById('bil-r-dekk').textContent = fmt(dekkTotal);
  document.getElementById('bil-r-avgift').textContent = fmt(avgiftTotal);
  document.getElementById('bil-r-bom').textContent = fmt(bomTotal);

  document.getElementById('bil-res').classList.remove('hidden');
  setTimeout(function(){scrollToEl(document.getElementById('bil-res'),'nearest');},80);
}

function calcNpv() {
  const r = R();
  const inv = parseNum('n-inv');
  if(inv<=0) return;
  const rate = (+document.getElementById('n-r').value || 0) / 100;
  const cfs = [1,2,3,4,5].map(i=>parseNum('n-c'+i));
  // NPV calculation
  let npv=-inv;
  cfs.forEach((cf,i)=>{ npv+=cf/Math.pow(1+rate,i+1); });
  // Payback period (simple, undiscounted)
  let cum=-inv, pay=null;
  cfs.forEach((cf,i)=>{
    const prevCum=cum;
    cum+=cf;
    if(pay===null&&cum>=0&&cf!==0) pay = i + (-prevCum)/cf;
  });
  // IRR via Newton-Raphson with safeguards
  let irr=0.1, irrValid=true;
  for(let j=0;j<300;j++){
    let f=-inv,df=0;
    cfs.forEach((cf,i)=>{
      const p=Math.pow(1+irr,i+1);
      if(Math.abs(p)<1e-15) return;
      f+=cf/p;
      df-=(i+1)*cf/Math.pow(1+irr,i+2);
    });
    if(Math.abs(df)<1e-12){break;}
    const step=f/df;
    irr-=step;
    // Guard: keep irr in reasonable range
    if(irr<-0.99) irr=-0.99;
    if(irr>10) irr=10;
    if(isNaN(irr)||!isFinite(irr)){irrValid=false;break;}
    if(Math.abs(f)<0.01)break;
  }
  if(isNaN(irr)||!isFinite(irr)) irrValid=false;
  const sum=cfs.reduce((a,b)=>a+b,0);
  const pi=inv>0?(npv+inv)/inv:0;
  _npv = { inv, rate:rate*100, cfs, npv, irr:irrValid?irr*100:null, pay, pi };
  document.getElementById('n-npv').textContent = fmt(npv);
  document.getElementById('n-verd').textContent = npv>=0 ? (r.npvPos||'✓ Profitable') : (r.npvNeg||'✗ Unprofitable');
  document.getElementById('n-irr').textContent = irrValid ? pct(irr*100) : 'N/A';
  document.getElementById('n-pay').textContent = pay!==null ? pay.toFixed(1)+' '+(r.yr||'yrs') : '>5 '+(r.yr||'yrs');
  document.getElementById('n-sum').textContent = fmt(sum);
  document.getElementById('n-pi').textContent = pi.toFixed(2)+'x';
  document.getElementById('n-res').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('n-res'),'top'),80);
}

function calcVat() {
  const a = parseNum('v-a');
  if(a<=0) return;
  var _vr=document.getElementById('v-r');const s=_vr?+_vr.value/100:0.25;
  var _vt=document.getElementById('v-t');const tp=_vt?_vt.value:'ex';
  let ex,vt,inc;
  if(tp==='ex'){ex=a;vt=ex*s;inc=ex+vt;}else{inc=a;ex=inc/(1+s);vt=inc-ex;}
  _vat = { a, s:s*100, tp, ex, vt, inc };
  // Show the CALCULATED value as main result
  const rr = R();
  if(tp==='ex'){
    // Input was excl. VAT → main result is incl. VAT
    document.getElementById('vat-r-incl').textContent = rr.vatRInclCalc||'Price incl. VAT';
    document.getElementById('v-inc').textContent = fmt(inc);
    document.getElementById('vat-r-excl').textContent = (rr.vatRExclCalc||'Price excl. VAT') + ' ' + (rr.vatRInputTag||'(your input)');
    document.getElementById('v-exc').textContent = fmt(ex);
  } else {
    // Input was incl. VAT → main result is excl. VAT
    document.getElementById('vat-r-incl').textContent = rr.vatRExclCalc||'Price excl. VAT';
    document.getElementById('v-inc').textContent = fmt(ex);
    document.getElementById('vat-r-excl').textContent = (rr.vatRInclCalc||'Price incl. VAT') + ' ' + (rr.vatRInputTag||'(your input)');
    document.getElementById('v-exc').textContent = fmt(inc);
  }
  document.getElementById('v-vat').textContent = fmt(vt);
  document.getElementById('v-pct').textContent = pct(s*100);
  document.getElementById('v-res').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('v-res'),'top'),80);
}

// ═══════════════════════════════════════════════════════
// MVA ADJUSTMENT CALCULATOR (mval. kap. 9)
// ═══════════════════════════════════════════════════════
function calcAdj() {
  const r = R();
  var _at=document.getElementById('adj-type');const type=_at?_at.value:'eiendom';
  const totalMva = parseNum('adj-mva');
  if(totalMva <= 0) return;
  const periode = type === 'eiendom' ? 10 : 5;
  const terskel = type === 'eiendom' ? 100000 : 50000;
  const aarBrukt = parseInt(document.getElementById('adj-years').value) || 0;
  const gammelAndel = (parseNum('adj-old') || 0) / 100;
  const nyAndel = (parseNum('adj-new') || 0) / 100;
  const ofT = r.adjOfTotal || ' av ';

  if(totalMva < terskel) {
    document.getElementById('adj-r-lbl').textContent = r.adjUnder||'Under terskelverdi';
    document.getElementById('adj-r-val').textContent = fmt(terskel);
    document.getElementById('adj-r-sub').textContent = (r.adjUnderSub||'Inngående MVA må overstige {t} for justeringsplikt').replace('{t}',fmt(terskel));
    document.getElementById('adj-rh').style.background = 'linear-gradient(135deg,var(--ink3),var(--ink2))';
    document.getElementById('adj-r-base').textContent = '–';
    document.getElementById('adj-r-annual').textContent = '–';
    document.getElementById('adj-r-remain').textContent = '–';
    document.getElementById('adj-r-change').textContent = '–';
    document.getElementById('adj-res').classList.remove('hidden');
    return;
  }

  if(aarBrukt >= periode) {
    document.getElementById('adj-r-lbl').textContent = r.adjExpired||'Justeringsperioden utløpt';
    document.getElementById('adj-r-val').textContent = '0';
    document.getElementById('adj-r-sub').textContent = (r.adjExpiredSub||'Alle {p} år er brukt — ingen justering nødvendig').replace('{p}',periode);
    document.getElementById('adj-rh').style.background = 'linear-gradient(135deg,var(--ink3),var(--ink2))';
    document.getElementById('adj-r-base').textContent = fmt(totalMva / periode);
    document.getElementById('adj-r-annual').textContent = '0';
    document.getElementById('adj-r-remain').textContent = '0' + ofT + periode;
    document.getElementById('adj-r-change').textContent = pct((nyAndel - gammelAndel) * 100);
    document.getElementById('adj-res').classList.remove('hidden');
    return;
  }

  // Bagatellgrense § 9-2: justering foretas ikke hvis endring < 10 prosentpoeng
  const endring = nyAndel - gammelAndel;
  if(Math.round(Math.abs(endring) * 100) < 10) {
    document.getElementById('adj-r-lbl').textContent = r.adjBagatell||'Under bagatellgrensen (§ 9-2)';
    document.getElementById('adj-r-val').textContent = '0';
    document.getElementById('adj-r-sub').textContent = (r.adjBagatellSub||'Endring på {p} er under 10 prosentpoeng — ingen justeringsplikt').replace('{p}',pct(Math.abs(endring)*100));
    document.getElementById('adj-rh').style.background = 'linear-gradient(135deg,var(--ink3),var(--ink2))';
    document.getElementById('adj-r-base').textContent = fmt(totalMva / periode);
    document.getElementById('adj-r-annual').textContent = '0';
    document.getElementById('adj-r-remain').textContent = (periode - aarBrukt) + ofT + periode;
    document.getElementById('adj-r-change').textContent = pct(endring * 100);
    document.getElementById('adj-res').classList.remove('hidden');
    return;
  }

  const gjenstaende = periode - aarBrukt;
  const arligBeloep = totalMva / periode;
  const justering = arligBeloep * endring * gjenstaende;

  const erTilbake = justering < 0;
  document.getElementById('adj-r-lbl').textContent = erTilbake ? (r.adjRepay||'Tilbakebetaling til staten') : (r.adjIncrease||'Økt fradrag');
  document.getElementById('adj-r-val').textContent = fmt(Math.abs(justering));
  document.getElementById('adj-r-sub').textContent = erTilbake
    ? (r.adjRepaySub||'Du må tilbakebetale {a} i tidligere fradragsført MVA').replace('{a}',fmt(Math.abs(justering)))
    : (r.adjIncreaseSub||'Du kan kreve {a} i ekstra MVA-fradrag').replace('{a}',fmt(justering));
  document.getElementById('adj-rh').style.background = 'linear-gradient(135deg,var(--accent),var(--accent-l))';

  const arligJustering = arligBeloep * Math.abs(endring);
  document.getElementById('adj-r-base').textContent = fmt(arligBeloep);
  document.getElementById('adj-r-annual').textContent = fmt(arligJustering);
  document.getElementById('adj-r-remain').textContent = gjenstaende + ofT + periode;
  document.getElementById('adj-r-change').textContent = (endring > 0 ? '+' : '') + pct(endring * 100);

  document.getElementById('adj-res').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('adj-res'),'nearest'),80);
}

// ═══════════════════════════════════════════════════════
// UTTAKSKALKULATOR (sktl. § 5-2)
// ═══════════════════════════════════════════════════════
function uttakToggleFields() {
  var _ut=document.getElementById('uttak-type');const type=_ut?_ut.value:'aksjer';
  document.getElementById('uttak-as-fields').classList.toggle('hidden', type !== 'as');
  document.getElementById('uttak-enk-fields').classList.toggle('hidden', type !== 'enk');
  document.getElementById('uttak-res').classList.add('hidden');
}

function calcUttak() {
  const r = R();
  var _ut=document.getElementById('uttak-type');const type=_ut?_ut.value:'aksjer';
  const mv = parseNum('uttak-mv');
  const sv = parseNum('uttak-sv');
  if (mv <= 0) return;
  const andel = Math.min(Math.max(+document.getElementById('uttak-andel').value || 100, 1), 100) / 100;

  const gevinst = (mv - sv) * andel;

  // Result elements
  const rh = document.getElementById('uttak-rh');
  const rLbl = document.getElementById('uttak-r-lbl');
  const rVal = document.getElementById('uttak-r-val');
  const rSub = document.getElementById('uttak-r-sub');
  const rGevinst = document.getElementById('uttak-r-gevinst');
  const rAlm = document.getElementById('uttak-r-alm');
  const rtTrygd = document.getElementById('uttak-rt-trygd');
  const rTrygd = document.getElementById('uttak-r-trygd');
  const rtTrinn = document.getElementById('uttak-rt-trinn');
  const rTrinn = document.getElementById('uttak-r-trinn');
  const asGrid = document.getElementById('uttak-as-grid');

  rGevinst.textContent = fmt(gevinst);

  if (gevinst <= 0) {
    rLbl.textContent = r.uttakNoGain || 'Ingen gevinst';
    rVal.textContent = fmt(0);
    rSub.textContent = r.uttakNoGainDesc || 'Skattemessig verdi er lik eller høyere enn markedsverdi — ingen uttaksbeskatning';
    rh.style.background = 'linear-gradient(135deg,var(--ink3),var(--ink2))';
    rAlm.textContent = '–';
    rTrygd.textContent = '–';
    rTrinn.textContent = '–';
    rtTrygd.style.display = '';
    rtTrinn.style.display = '';
    asGrid.classList.add('hidden');
    document.getElementById('uttak-res').classList.remove('hidden');
    setTimeout(()=>scrollToEl(document.getElementById('uttak-res'),'nearest'),80);
    return;
  }

  if (type === 'enk') {
    // ENK: alminnelig inntekt + evt. personinntekt
    const almSkatt = gevinst * 0.22;
    var _up=document.getElementById('uttak-personinntekt');const erPersoninntekt=_up?_up.value==='ja':false;
    let trygd = 0, trinn = 0;

    if (erPersoninntekt) {
      trygd = gevinst * 0.108;
      // Trinnskatt-beregning på gevinsten
      const trinnSatser = [
        { grense: 1467200, sats: 0.178 },
        { grense: 980100,  sats: 0.168 },
        { grense: 725050,  sats: 0.137 },
        { grense: 318300,  sats: 0.040 },
        { grense: 226100,  sats: 0.017 }
      ];
      let gjenstaar = gevinst;
      for (const t of trinnSatser) {
        if (gjenstaar > t.grense) {
          trinn += (gjenstaar - t.grense) * t.sats;
          gjenstaar = t.grense;
        }
      }
    }

    const totalSkatt = almSkatt + trygd + trinn;
    const effSats = (totalSkatt / gevinst) * 100;

    rLbl.textContent = r.uttakEnkTotal || 'Total skatt ved uttak (ENK)';
    rVal.textContent = fmt(totalSkatt);
    rSub.textContent = (r.uttakEffRate || 'Effektiv skattesats') + ': ' + pct(effSats) + ' · ' + (r.uttakNetAfterTax || 'Netto etter skatt') + ': ' + fmt(gevinst - totalSkatt);
    rh.style.background = 'linear-gradient(135deg,var(--accent),var(--accent-l))';

    rAlm.textContent = fmt(almSkatt);
    rtTrygd.style.display = '';
    rtTrinn.style.display = '';
    rTrygd.textContent = erPersoninntekt ? fmt(trygd) : '–';
    rTrinn.textContent = erPersoninntekt ? fmt(trinn) : '–';
    asGrid.classList.add('hidden');

  } else {
    // AS: to nivåer — selskapsskatt + utbytteskatt på det som faktisk kan deles ut
    const skjerming = parseNum('uttak-skjerming');
    const selskapsskatt = gevinst * 0.22;
    const etterSelskapsskatt = gevinst - selskapsskatt;
    const utbytteGrunnlag = etterSelskapsskatt - skjerming;
    const oppjustert = Math.max(0, utbytteGrunnlag) * 1.72;
    const utbytteskatt = oppjustert * 0.22;
    const totalSkatt = selskapsskatt + utbytteskatt;
    const nettoEtterSkatt = gevinst - totalSkatt;
    const effSats = (totalSkatt / gevinst) * 100;

    rLbl.textContent = r.uttakAsTotal || 'Total skattekostnad (AS — begge nivåer)';
    rVal.textContent = fmt(totalSkatt);
    rSub.textContent = (r.uttakEffRate || 'Effektiv skattesats') + ': ' + pct(effSats) + ' · ' + (r.uttakAsLevels || 'Selskap + aksjonær');
    rh.style.background = 'linear-gradient(135deg,var(--accent),var(--accent-l))';

    // Hide ENK-specific rows
    rAlm.textContent = '–';
    rtTrygd.style.display = 'none';
    rtTrinn.style.display = 'none';

    // Show AS grid
    asGrid.classList.remove('hidden');
    document.getElementById('uttak-r-selskap').textContent = fmt(selskapsskatt);
    document.getElementById('uttak-r-utbytte').textContent = fmt(utbytteskatt);
    document.getElementById('uttak-r-total').textContent = fmt(totalSkatt);
    document.getElementById('uttak-r-netto').textContent = fmt(nettoEtterSkatt);
  }

  document.getElementById('uttak-res').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('uttak-res'),'nearest'),80);
}

function utdelingToggleType() {
  document.getElementById('utdeling-res').classList.add('hidden');
}

function calcUtdeling() {
  const r = R();
  const overskudd = parseNum('utdeling-overskudd');
  if (overskudd <= 0) return;
  const skjerming = parseNum('utdeling-skjerming');
  var _ut=document.getElementById('utdeling-type');const type=_ut?_ut.value:'as';
  const asGrid = document.getElementById('utdeling-as-grid');
  const enkGrid = document.getElementById('utdeling-enk-grid');

  let totalSkatt, netto, effSats;

  if (type === 'enk') {
    // Foretaksmodellen: alminnelig inntekt 22% + trygdeavgift 10.8% (2026) + trinnskatt on personinntekt
    asGrid.classList.add('hidden');
    enkGrid.classList.remove('hidden');
    const personfradrag = 114540; // 2026
    const almInntekt = Math.max(0, overskudd - personfradrag);
    const almSkatt = almInntekt * 0.22;
    const personinntekt = Math.max(0, overskudd - skjerming);
    const trygd = personinntekt * 0.108;
    // Trinnskatt 2026 (progressive brackets)
    const trinnSatser = [
      { grense: 1467200, sats: 0.178 },
      { grense: 980100,  sats: 0.168 },
      { grense: 725050,  sats: 0.137 },
      { grense: 318300,  sats: 0.040 },
      { grense: 226100,  sats: 0.017 }
    ];
    let trinn = 0, gjenstaar = personinntekt;
    for (const t of trinnSatser) {
      if (gjenstaar > t.grense) { trinn += (gjenstaar - t.grense) * t.sats; gjenstaar = t.grense; }
    }
    totalSkatt = almSkatt + trygd + trinn;
    netto = overskudd - totalSkatt;
    effSats = (totalSkatt / overskudd) * 100;

    document.getElementById('utdeling-r-enk-overskudd').textContent = fmt(overskudd);
    document.getElementById('utdeling-r-enk-alm').textContent = fmt(almSkatt);
    document.getElementById('utdeling-r-enk-skjerming').textContent = fmt(skjerming);
    document.getElementById('utdeling-r-enk-person').textContent = fmt(personinntekt);
    document.getElementById('utdeling-r-enk-trygd').textContent = fmt(trygd);
    document.getElementById('utdeling-r-enk-trinn').textContent = fmt(trinn);
    document.getElementById('utdeling-r-enk-total').textContent = fmt(totalSkatt);
    document.getElementById('utdeling-r-enk-netto').textContent = fmt(netto);
    document.getElementById('utdeling-r-enk-eff').textContent = pct(effSats);
  } else {
    // Aksjonærmodellen: selskapsskatt 22% + oppjustert utbytte × 22%
    asGrid.classList.remove('hidden');
    enkGrid.classList.add('hidden');
    const selskapsskatt = overskudd * 0.22;
    const etterSelskap = overskudd - selskapsskatt;
    const utbytteGrunnlag = Math.max(0, etterSelskap - skjerming);
    const oppjustert = utbytteGrunnlag * 1.72;
    const utbytteskatt = oppjustert * 0.22;
    totalSkatt = selskapsskatt + utbytteskatt;
    netto = overskudd - totalSkatt;
    effSats = (totalSkatt / overskudd) * 100;

    document.getElementById('utdeling-r-overskudd').textContent = fmt(overskudd);
    document.getElementById('utdeling-r-selskap').textContent = fmt(selskapsskatt);
    document.getElementById('utdeling-r-etter').textContent = fmt(etterSelskap);
    document.getElementById('utdeling-r-skjerming2').textContent = fmt(skjerming);
    document.getElementById('utdeling-r-oppjustert').textContent = fmt(oppjustert);
    document.getElementById('utdeling-r-utbytte').textContent = fmt(utbytteskatt);
    document.getElementById('utdeling-r-total').textContent = fmt(totalSkatt);
    document.getElementById('utdeling-r-netto').textContent = fmt(netto);
    document.getElementById('utdeling-r-eff').textContent = pct(effSats);
  }

  document.getElementById('utdeling-r-val').textContent = fmt(totalSkatt);
  document.getElementById('utdeling-r-sub').textContent = (r.utdelingEffRate || 'Effektiv skattesats') + ': ' + pct(effSats) + ' · ' + (r.utdelingNetLabel || 'Netto til eier') + ': ' + fmt(netto);
  document.getElementById('utdeling-rh').style.background = 'linear-gradient(135deg,var(--accent),var(--accent-l))';
  document.getElementById('utdeling-res').classList.remove('hidden');
  setTimeout(()=>scrollToEl(document.getElementById('utdeling-res'),'nearest'),80);
}

// ═══════════════════════════════════════════════════════
// BASIC CALCULATOR
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// BASIC / SCIENTIFIC CALCULATOR + UNIT CONVERTER
// ═══════════════════════════════════════════════════════
let bcMode = 'basic';
let bcExpr = '', bcFresh = true, bcHistory = '';
const bcDisp = document.getElementById('bc-display');
const bcKeys = document.getElementById('bc-keys');
const bcExprDisp = document.getElementById('bc-expr-display');

const basicBtns = [
  {l:'C',t:'op'},{l:'⌫',t:'op'},{l:'(',t:'op'},{l:')',t:'op'},
  {l:'√',t:'fn'},{l:'x²',t:'fn'},{l:'%',t:'op'},{l:'÷',t:'acc'},
  {l:'7',t:'num'},{l:'8',t:'num'},{l:'9',t:'num'},{l:'×',t:'acc'},
  {l:'4',t:'num'},{l:'5',t:'num'},{l:'6',t:'num'},{l:'−',t:'acc'},
  {l:'1',t:'num'},{l:'2',t:'num'},{l:'3',t:'num'},{l:'+',t:'acc'},
  {l:'±',t:'op'},{l:'0',t:'num'},{l:',',t:'num'},{l:'=',t:'acc'}
];
// Scientific: top function strip (5 cols) + main numpad (4 cols)
const sciFnBtns = [
  {l:'sin',t:'fn'},{l:'cos',t:'fn'},{l:'tan',t:'fn'},{l:'log',t:'fn'},{l:'ln',t:'fn'},
  {l:'π',t:'fn'},{l:'e',t:'fn'},{l:'xʸ',t:'fn'},{l:'n!',t:'fn'},{l:'1/x',t:'fn'},
];
const sciMainBtns = [
  {l:'C',t:'op'},{l:'⌫',t:'op'},{l:'EXP',t:'fn'},{l:'÷',t:'acc'},
  {l:'7',t:'num'},{l:'8',t:'num'},{l:'9',t:'num'},{l:'×',t:'acc'},
  {l:'4',t:'num'},{l:'5',t:'num'},{l:'6',t:'num'},{l:'−',t:'acc'},
  {l:'1',t:'num'},{l:'2',t:'num'},{l:'3',t:'num'},{l:'+',t:'acc'},
  {l:'±',t:'op'},{l:'0',t:'num'},{l:',',t:'num'},{l:'=',t:'acc'}
];

function bcBtnStyle(t,l,isSmall){
  let sz = isSmall ? '12px' : '16px';
  let pad = isSmall ? '10px 6px' : '16px 8px';
  let rad = isSmall ? '10px' : '12px';
  let base = `border:none;border-radius:${rad};padding:${pad};font-family:'Inter',sans-serif;font-size:${sz};font-weight:600;cursor:pointer;transition:all .15s;`;
  if(l==='=') return base+'background:linear-gradient(135deg,var(--accent-d,#5b8def),var(--accent));color:#fff;font-size:17px;font-weight:800;';
  if(t==='acc') return base+'background:color-mix(in srgb,var(--accent) 4%,transparent);color:var(--accent-d,#5b8def);border:1.5px solid color-mix(in srgb,var(--accent) 7%,transparent);font-weight:700;';
  if(t==='fn') return base+'background:color-mix(in srgb,var(--accent) 3%,transparent);color:var(--accent-d,#5b8def);border:1.5px solid color-mix(in srgb,var(--accent) 5%,transparent);';
  if(t==='op') return base+'background:var(--surface2);color:var(--ink3);border:1.5px solid var(--border);';
  return base+'background:var(--surface);color:var(--ink);border:1.5px solid var(--border);';
}

function bcFmtExpr(s){
  let out = (s||'').replace(/(\d+\.?\d*)/g, (m) => {
    const parts = m.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    return parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];
  });
  out = out.replace(/×10\*\*/g, '×10^').replace(/\*\*/g, '^');
  return out;
}
function bcUpdateDisp(){
  if(!bcDisp) return;
  const show = bcExpr || '0';
  bcDisp.value = bcFmtExpr(show);
  if(bcPendingFn && bcExpr){
    bcExprDisp.textContent = bcPendingLabel + '(' + bcFmtExpr(bcExpr) + ')';
  } else if(bcPendingFn){
    bcExprDisp.textContent = bcPendingLabel + '(?)';
  } else {
    bcExprDisp.textContent = bcHistory ? bcFmtExpr(bcHistory)+' =' : '';
  }
}

function factorial(n){if(n<0)return NaN;if(n===0||n===1)return 1;let r=1;for(let i=2;i<=n;i++)r*=i;return r;}

// Pending function: user pressed fn first, then types number, then = applies it
let bcPendingFn = null;
let bcPendingLabel = '';

// Helper: extract last number from expr, apply fn, replace it
// If no number yet, store fn as pending and wait for input
function bcApplyToLast(fn, label){
  const match = bcExpr.match(/(-?\d+\.?\d*)$/);
  if(!match || !bcExpr){
    // No number — go into prefix mode: show "log(" and wait
    bcPendingFn = fn;
    bcPendingLabel = label;
    bcExpr = '';
    bcFresh = false;
    bcDisp.value = '0';
    bcExprDisp.textContent = label + '(?)';
    return;
  }
  const val = parseFloat(match[1]);
  const result = fn(val);
  if(isNaN(result)||!isFinite(result)){bcExpr=(R().calcError||'Feil');bcFresh=true;bcUpdateDisp();return;}
  const rounded = Math.round(result*1e10)/1e10;
  bcExpr = bcExpr.slice(0, -match[1].length) + rounded;
  bcFresh=true;bcPendingFn=null;bcPendingLabel='';bcUpdateDisp();
}

function bcPress(k){
  if(k==='C'){bcExpr='';bcHistory='';bcFresh=true;bcPendingFn=null;bcPendingLabel='';bcUpdateDisp();return;}
  if(k==='⌫'){bcExpr=bcExpr.slice(0,-1);bcUpdateDisp();return;}
  // Constants — replace last number or insert
  if(k==='π'){
    if(bcFresh){bcExpr='';bcFresh=false;}
    else if(bcExpr && /\d$/.test(bcExpr)) bcExpr+='×';
    bcExpr+='3.14159265359';bcUpdateDisp();return;
  }
  if(k==='e'){
    if(bcFresh){bcExpr='';bcFresh=false;}
    else if(bcExpr && /\d$/.test(bcExpr)) bcExpr+='×';
    bcExpr+='2.71828182846';bcUpdateDisp();return;
  }
  if(k==='EXP'){
    // Scientific notation: append ×10^ then user types exponent
    bcExpr+='×10**';bcFresh=false;bcUpdateDisp();return;
  }
  if(k==='±'){
    if(!bcExpr)return;
    bcExpr=bcExpr.replace(/(^|[+\-×÷(])(-?)(\d+\.?\d*)$/,(m,op,neg,num)=>op+(neg?'':'-')+num);
    bcUpdateDisp();return;
  }
  if(k==='%'){bcExpr=bcExpr.replace(/(\d+\.?\d*)$/,(m)=>''+(parseFloat(m)/100));bcUpdateDisp();return;}
  // Unary functions — apply to last number, or enter prefix mode
  if(k==='sin'){bcApplyToLast(v=>Math.sin(v*Math.PI/180),'sin');return;}
  if(k==='cos'){bcApplyToLast(v=>Math.cos(v*Math.PI/180),'cos');return;}
  if(k==='tan'){bcApplyToLast(v=>Math.tan(v*Math.PI/180),'tan');return;}
  if(k==='log'){bcApplyToLast(v=>Math.log10(v),'log');return;}
  if(k==='ln'){bcApplyToLast(v=>Math.log(v),'ln');return;}
  if(k==='√'){bcApplyToLast(v=>Math.sqrt(v),'√');return;}
  if(k==='x²'){bcApplyToLast(v=>v*v,'x²');return;}
  if(k==='n!'){bcApplyToLast(v=>factorial(Math.round(v)),'n!');return;}
  if(k==='1/x'){bcApplyToLast(v=>1/v,'1/x');return;}
  if(k==='xʸ'){bcExpr+='**';bcFresh=false;bcUpdateDisp();return;}
  if(k==='('){
    // After a result or fresh state, start new expression with (
    if(bcFresh && bcExpr && !'+-×÷−'.includes(bcExpr.slice(-1))){bcExpr='';}
    // Auto-insert × if last char is digit or ) — e.g. "5(" becomes "5×("
    if(bcExpr && /[\d)]$/.test(bcExpr)){bcExpr+='×';}
    bcExpr+='(';bcFresh=false;bcUpdateDisp();return;
  }
  if(k===')'){
    // Only allow ) if there's a matching open (
    const opens=(bcExpr.match(/\(/g)||[]).length;
    const closes=(bcExpr.match(/\)/g)||[]).length;
    if(closes>=opens) return; // no unmatched ( to close
    bcExpr+=')';bcUpdateDisp();return;
  }
  if(k==='='){
    try{
      if(bcPendingFn && bcExpr){
        // Apply pending function to current input
        const val = parseFloat(bcExpr.replace(/,/g,''));
        bcHistory = bcPendingLabel + '(' + bcExpr + ')';
        const result = bcPendingFn(val);
        if(isNaN(result)||!isFinite(result)) throw 'err';
        const dec2=parseInt(document.getElementById('bc-decimals').value)||0;
        const fac2=Math.pow(10,Math.min(Math.max(dec2,0),15));
        bcExpr=''+Math.round(result*fac2)/fac2;
        bcPendingFn=null;bcPendingLabel='';bcFresh=true;
      } else {
        bcHistory=bcExpr;
        let e=bcExpr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,'');
        let result=Function('"use strict";return('+e+')')();
        const dec=parseInt(document.getElementById('bc-decimals').value)||0;
        const factor=Math.pow(10,Math.min(Math.max(dec,0),15));
        bcExpr=''+Math.round(result*factor)/factor;bcFresh=true;
      }
    }catch(ex){bcExpr=(R().calcError||'Feil');bcHistory='';bcFresh=true;bcPendingFn=null;bcPendingLabel='';}
    bcUpdateDisp();return;
  }
  if(k===','){k='.';}
  if('+-×÷'.includes(k)||k==='−'){bcFresh=false;bcExpr+=k;bcUpdateDisp();return;}
  if(bcFresh){if(!bcExpr||!'+-×÷−'.includes(bcExpr.slice(-1))){bcExpr='';}bcFresh=false;}
  bcExpr+=k;bcUpdateDisp();
}

const bkspSVG = `<svg width="20" height="16" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 1H8L1 9l7 8h13a1 1 0 001-1V2a1 1 0 00-1-1z"/><line x1="17" y1="6" x2="12" y2="12"/><line x1="12" y1="6" x2="17" y2="12"/></svg>`;
function mkBtn(b, small){
  const el=document.createElement('button');
  if(b.l==='⌫'){el.innerHTML=bkspSVG;el.style.cssText=bcBtnStyle(b.t,b.l,small)+'display:flex;align-items:center;justify-content:center;';}
  else{el.textContent=b.l;el.style.cssText=bcBtnStyle(b.t,b.l,small);}
  el.onmouseenter=()=>{el.style.transform='translateY(-1px)';el.style.boxShadow='0 2px 8px rgba(14,40,110,.08)';};
  el.onmouseleave=()=>{el.style.transform='translateY(0)';el.style.boxShadow='none';};
  el.onclick=()=>bcPress(b.l);
  return el;
}
function buildCalcKeys(mode){
  if(!bcKeys) return;
  bcKeys.innerHTML='';
  if(mode==='scientific'){
    // Function strip at top
    const fnStrip=document.createElement('div');
    fnStrip.style.cssText='display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px;';
    sciFnBtns.forEach(b=>fnStrip.appendChild(mkBtn(b,true)));
    bcKeys.appendChild(fnStrip);
    // Separator
    const sep=document.createElement('div');
    sep.style.cssText='height:1px;background:var(--border);margin-bottom:12px;';
    bcKeys.appendChild(sep);
    // Main numpad
    const grid=document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:10px;';
    sciMainBtns.forEach(b=>grid.appendChild(mkBtn(b,false)));
    bcKeys.appendChild(grid);
  } else {
    const grid=document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:10px;';
    basicBtns.forEach(b=>grid.appendChild(mkBtn(b,false)));
    bcKeys.appendChild(grid);
  }
}

// LVU: Lønn vs Utbytte — sammenligner selskapskostnad for begge
function calcLvu(){const g=parseNum('lvu-gross');if(g<=0)return;const aga=parseNum('lvu-zone');
  // Lønn: selskapet betaler brutto + AGA + feriepenger + OTP
  const salCost=g*(1+aga+0.12+0.02);
  // Utbytte: selskapet trenger nok overskudd før skatt til å dele ut g
  const divPreTax=g/(1-0.22);
  // Aksjonæren betaler utbytteskatt: (g-skjerming)*1.72*0.22
  const divTax=g*1.72*0.22; // forenklet, uten skjerming
  const divNet=g-divTax;
  const r=R();const cheaper=salCost<divPreTax?(r.lvuSalary||'Lønn'):(r.lvuDividend||'Utbytte');
  const diff=Math.abs(salCost-divPreTax);
  document.getElementById('lvu-sal-cost').textContent=fmt(salCost);
  document.getElementById('lvu-div-cost').textContent=fmt(divPreTax);
  document.getElementById('lvu-diff').textContent=cheaper+' '+(r.lvuIsCheaper||'er billigere for selskapet')+' ('+fmt(diff)+')';
  document.getElementById('lvu-res').classList.remove('hidden');
}

// AGA: Ansattkostnad
function calcAga(){const sal=parseNum('aga-salary');if(sal<=0)return;const aga=+document.getElementById('aga-zone').value;const ferie=+document.getElementById('aga-ferie').value;const otp=+document.getElementById('aga-otp').value;const ferieAmt=sal*ferie;const otpAmt=sal*otp;const agaBase=sal+ferieAmt+otpAmt;const agaAmt=agaBase*aga;const total=sal+agaAmt+ferieAmt+otpAmt;const pct=(agaAmt+ferieAmt+otpAmt)/sal*100;document.getElementById('aga-aga-amt').textContent=fmt(agaAmt);document.getElementById('aga-ferie-amt').textContent=fmt(ferieAmt);document.getElementById('aga-otp-amt').textContent=fmt(otpAmt);document.getElementById('aga-total').textContent=fmt(total);document.getElementById('aga-per-month').textContent=fmt(total/12)+' '+(R().agaPerMonth||'/mnd');document.getElementById('aga-pct').textContent=pct.toFixed(1)+'%';document.getElementById('aga-res').classList.remove('hidden');}

// AVS: Avskrivning — mode toggle
window.avsMode='regnskap';
function setAvsMode(mode){
  var isInfo=mode==='info';
  if(!isInfo) window.avsMode=mode;
  document.querySelectorAll('.avs-mode-btn').forEach(function(b){b.classList.toggle('active',b.dataset.mode===mode)});
  var infoPanel=document.getElementById('avs-info-panel');
  var calcFields=['avs-l-price','avs-skatt-fields','avs-regnskap-fields','avs-calc-btn','avs-res'].map(function(id){return document.getElementById(id)});
  var priceRow=document.getElementById('avs-l-price');if(priceRow)priceRow=priceRow.parentElement;
  if(isInfo){
    // Hide calc UI, show info
    document.getElementById('avs-skatt-fields').classList.add('hidden');
    document.getElementById('avs-regnskap-fields').classList.add('hidden');
    if(priceRow)priceRow.classList.add('hidden');
    document.getElementById('avs-calc-btn').classList.add('hidden');
    document.getElementById('avs-res').classList.add('hidden');
    infoPanel.classList.remove('hidden');
    var r=R();
    infoPanel.innerHTML=r.avsInfoContent||'<div style="font-size:14px;font-weight:600;color:var(--ink);margin-bottom:12px;">Hva er avskrivning?</div>'+
      '<div style="font-size:13px;color:var(--ink2);line-height:1.7;">'+
      '<p style="margin:0 0 10px;">Avskrivning betyr å fordele kostnaden for et driftsmiddel (maskin, kjøretøy, bygg) over levetiden — i stedet for å kostnadsføre alt ved kjøp.</p>'+
      '<p style="margin:0 0 10px;"><strong>Regnskapsmessig (rskl. § 5-3)</strong><br>Avskrivning skjer etter en fornuftig avskrivningsplan. Lineær avskrivning er vanligst, men metoden skal reflektere forventet økonomisk forbruk av driftsmiddelet.</p>'+
      '<p style="margin:0 0 10px;"><strong>Skattemessig (sktl. §§ 14-40 til 14-48)</strong><br>Saldoavskrivning: en fast prosent av gjenværende saldoverdi hvert år. Høyere avskrivning tidlig, lavere over tid. Prosenten avhenger av saldogruppe (a–j). Hvilken gruppe eiendelen plasseres i har <strong>stor betydning</strong> for hvor mye skattefradrag du får — høyere avskrivningssats betyr raskere fradrag og lavere skatt de første årene. Når restsaldoen kommer under 30 000 kr kan hele beløpet fradragsføres direkte.</p>'+
      '<p style="margin:0 0 10px;"><strong>Hvorfor er det forskjell?</strong><br>Fordi skattereglene og regnskapsreglene har ulike formål. Skattereglene gir ofte raskere fradrag (incentiv), mens regnskapsreglene følger den regnskapsmessige planen for faktisk verdifall. Forskjellen skaper <em>midlertidige forskjeller</em> som påvirker utsatt skatt i balansen.</p>'+
      '<p style="margin:0 0 10px;"><strong>Skattefordel vs. skattegjeld</strong><br>Når skattemessig avskrivning er høyere enn regnskapsmessig → bokført verdi > skattemessig verdi → <strong>utsatt skattegjeld</strong> (du har fått fradrag skattemessig tidligere enn i regnskapet).<br>Når regnskapsmessig er høyere → omvendt → <strong>utsatt skattefordel</strong>.</p>'+
      '<p style="margin:0 0 10px;"><strong>Hva betyr utsatt skatt i praksis?</strong><br>Det handler om <em>når</em> du får fradraget, ikke nødvendigvis om du får det. Skattemessig saldoavskrivning gir ofte større fradrag tidlig, mens regnskapsmessig avskrivning følger den regnskapsmessige planen. Derfor oppstår midlertidige forskjeller og utsatt skatt/utsatt skattefordel. Samlet fradrag blir normalt det samme over tid, men tidspunktet kan være forskjellig.</p>'+
      '<p style="margin:0;opacity:.7;font-size:12px;">Bruk <strong>Sammenlign</strong>-modusen for å se konkrete tall for forskjellen mellom metodene.</p>'+
      '</div>';
    var intro=document.getElementById('bc-avs-intro');
    if(intro) intro.innerHTML=r.avsIntroInfo||'En kort oversikt over regnskapsmessig og skattemessig avskrivning.';
    return;
  }
  // Normal modes: restore calc UI
  infoPanel.classList.add('hidden');
  if(priceRow)priceRow.classList.remove('hidden');
  document.getElementById('avs-calc-btn').classList.remove('hidden');
  document.getElementById('avs-skatt-fields').classList.toggle('hidden',mode==='regnskap');
  document.getElementById('avs-regnskap-fields').classList.toggle('hidden',mode==='skatt');
  if(mode==='compare'){document.getElementById('avs-skatt-fields').classList.remove('hidden');document.getElementById('avs-regnskap-fields').classList.remove('hidden');}
  var r=R();var intro=document.getElementById('bc-avs-intro');
  if(intro){
    var lawLnk=' (<a href="#" onclick="goToDeprCard();return false" style="color:var(--accent-d);text-decoration:underline;cursor:pointer;">'+(r.avsLawLink||'sktl. §§ 14-40 til 14-48')+'</a>).';
    if(mode==='skatt'){intro.innerHTML=(r.avsIntroSkatt||'Skattemessig saldoavskrivning: eiendelen skrives ned med en fast prosent av restverdi hvert år (degressiv metode). Velg saldogruppe etter type eiendel.')+lawLnk;}
    else if(mode==='regnskap'){intro.innerHTML=r.avsIntroRegnskap||'Regnskapsmessig avskrivning etter <strong>rskl. § 5-3</strong>: anleggsmidler med begrenset utnyttbar levetid skal avskrives etter en fornuftig avskrivningsplan. Lineær metode fordeler kostprisen jevnt over levetiden.';}
    else{intro.innerHTML=(r.avsIntroCompare||'Sammenlign skattemessig saldoavskrivning (degressiv) med regnskapsmessig lineær avskrivning. Differansen viser midlertidig forskjell som påvirker utsatt skatt.')+lawLnk;}
  }
  var header=document.getElementById('avs-table-header');
  if(header){
    if(mode==='skatt')header.textContent=r.avsDepTableHeader||'10-årig avskrivningsplan';
    else if(mode==='regnskap')header.textContent=r.avsRegTableHeader||'Lineær avskrivningsplan';
    else header.textContent=r.avsCmpTableHeader||'Sammenligning: Skatt vs. Regnskap';
  }
  if(!document.getElementById('avs-res').classList.contains('hidden'))calcAvs(true);
}
function avsLifeChanged(){var life=Math.max(1,+(document.getElementById('avs-life').value)||10);document.getElementById('avs-reg-pct').value=+(100/life).toFixed(1);}

function calcAvs(skipScroll){
  var price=parseNum('avs-price');if(price<=0)return;
  var r=R();var mode=window.avsMode||'skatt';
  var taxRate=+document.getElementById('avs-group').value;
  var regPct=Math.max(0.1,+(document.getElementById('avs-reg-pct')||{value:10}).value||10)/100;
  var scrapPct=Math.max(0,Math.min(100,+(document.getElementById('avs-scrap')||{value:0}).value||0))/100;
  var scrapValue=price*scrapPct;var depBase=price-scrapValue;
  var annualLinear=depBase*regPct;
  var lifeYears=Math.ceil(1/regPct);
  var years=mode==='regnskap'?lifeYears:(mode==='compare'?Math.max(10,lifeYears):10);
  var tds='<td style="padding:8px 4px;font-weight:600;color:var(--ink);';
  var rows=[];
  if(mode==='skatt'){
    rows.push('<tr style="border-bottom:1px solid var(--border);">'+tds+'">'+(_y(r))+'</td>'+tds+'text-align:right;">'+(_s(r))+'</td>'+tds+'text-align:right;">'+(_d(r))+'</td>'+tds+'text-align:right;">'+(_e(r))+'</td></tr>');
    var remaining=price;for(var i=1;i<=10;i++){var depr=remaining*taxRate;var newR=remaining-depr;rows.push(_row(i,fmt(remaining),fmt(depr),fmt(newR)));remaining=newR;}
  }else if(mode==='regnskap'){
    rows.push('<tr style="border-bottom:1px solid var(--border);">'+tds+'">'+(_y(r))+'</td>'+tds+'text-align:right;">'+(_s(r))+'</td>'+tds+'text-align:right;">'+(_d(r))+'</td>'+tds+'text-align:right;">'+(_e(r))+'</td></tr>');
    var bookVal=price;for(var i=1;i<=lifeYears;i++){var depr=Math.min(annualLinear,bookVal-scrapValue);if(depr<=0)break;var newBV=bookVal-depr;rows.push(_row(i,fmt(bookVal),fmt(depr),fmt(newBV)));bookVal=newBV;}
  }else{
    rows.push('<tr style="border-bottom:2px solid var(--border);">'+tds+'">'+(r.avsColYear||'År')+'</td>'+tds+'text-align:right;">'+(r.avsCmpRegnskap||'Regnskap (lineær)')+'</td>'+tds+'text-align:right;">'+(r.avsCmpSkatt||'Skatt (saldo)')+'</td>'+tds+'text-align:right;">'+(r.avsCmpDiff||'Differanse')+'</td></tr>');
    var taxRemaining=price;var bookVal=price;var cumDiffs=[];var bookVals=[price];var taxVals=[price];
    for(var i=1;i<=years;i++){var taxDepr=taxRemaining*taxRate;taxRemaining-=taxDepr;var accDepr=0;if(bookVal>scrapValue){accDepr=Math.min(annualLinear,bookVal-scrapValue);}bookVal-=accDepr;var diff=accDepr-taxDepr;cumDiffs.push(diff);bookVals.push(bookVal);taxVals.push(taxRemaining);rows.push('<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 4px;">'+i+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(accDepr)+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(taxDepr)+'</td><td style="padding:6px 4px;text-align:right;">'+((diff>=0?'+':'')+fmt(diff))+'</td></tr>');}
    var taxTotalDepr=price-taxRemaining;var accTotalDepr=price-Math.max(bookVal,0);
    rows.push('<tr style="border-top:2px solid var(--ink);font-weight:600;"><td style="padding:8px 4px;">'+(r.avsTotal||'Totalt')+'</td><td style="padding:8px 4px;text-align:right;">'+fmt(accTotalDepr)+'</td><td style="padding:8px 4px;text-align:right;">'+fmt(taxTotalDepr)+'</td><td style="padding:8px 4px;text-align:right;">'+fmt(accTotalDepr-taxTotalDepr)+'</td></tr>');
    rows.push('<tr><td colspan="4" style="padding:10px 4px 4px;font-size:11px;color:var(--ink3);line-height:1.4;"><em>'+(r.avsCmpNote||'Differanse = regnskap − skatt. Negativ differanse → skattemessig avskrivning høyere → bokført verdi > skattemessig verdi → utsatt skattegjeld. Positiv differanse → omvendt → utsatt skattefordel.')+'</em></td></tr>');
    // Skatteeffekt-tabell (uten akkumulert)
    var skattesats=0.22;
    var effRows='<tr style="border-bottom:2px solid var(--border);">'+tds+'">'+(r.avsColYear||'År')+'</td>'+tds+'text-align:right;">'+(r.avsCmpEffDiff||'Midlertidig forskjell')+'</td>'+tds+'text-align:right;">'+(r.avsCmpEffTax||'Utsatt skatt (22%)')+'</td></tr>';
    var cumDiff=0;
    for(var i=0;i<cumDiffs.length;i++){cumDiff+=cumDiffs[i];var uts=cumDiff*skattesats;effRows+='<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 4px;">'+(i+1)+'</td><td style="padding:6px 4px;text-align:right;">'+((cumDiffs[i]>=0?'+':'')+fmt(cumDiffs[i]))+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(Math.abs(uts))+' '+(cumDiff<0?(r.avsCmpDebtShort||'gjeld'):(r.avsCmpAssetShort||'fordel'))+'</td></tr>';}
    rows.push('<tr><td colspan="4" style="padding:16px 0 8px;"><div style="font-size:11px;font-weight:700;color:var(--ink2);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;">'+(r.avsCmpEffTitle||'Skatteeffekt av midlertidige forskjeller')+'</div><table style="width:100%;border-collapse:collapse;font-size:13px;">'+effRows+'</table></td></tr>');
    // Verdi på driftsmiddelet
    var valRows='<tr style="border-bottom:2px solid var(--border);">'+tds+'">'+(r.avsColYear||'År')+'</td>'+tds+'text-align:right;">'+(r.avsCmpBookVal||'Bokført verdi')+'</td>'+tds+'text-align:right;">'+(r.avsCmpTaxVal||'Skattemessig verdi')+'</td>'+tds+'text-align:right;">'+(r.avsCmpValDiff||'Forskjell')+'</td></tr>';
    valRows+='<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 4px;">0</td><td style="padding:6px 4px;text-align:right;">'+fmt(price)+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(price)+'</td><td style="padding:6px 4px;text-align:right;">0</td></tr>';
    for(var i=1;i<=years;i++){var bv=bookVals[i];var tv=taxVals[i];var vdiff=bv-tv;valRows+='<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 4px;">'+i+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(bv)+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(tv)+'</td><td style="padding:6px 4px;text-align:right;">'+((vdiff>=0?'+':'')+fmt(vdiff))+'</td></tr>';}
    rows.push('<tr><td colspan="4" style="padding:16px 0 8px;"><div style="font-size:11px;font-weight:700;color:var(--ink2);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;">'+(r.avsCmpValTitle||'Verdi på driftsmiddelet')+'</div><table style="width:100%;border-collapse:collapse;font-size:13px;">'+valRows+'</table><div style="font-size:11px;color:var(--ink3);margin-top:8px;line-height:1.4;font-style:italic;">'+(r.avsCmpValNote||'Bokført verdi = regnskapsmessig restverdi (lineær avskrivning). Skattemessig verdi = saldoverdi (degressiv avskrivning). Forskjell = bokført − skattemessig. Positiv forskjell → utsatt skattegjeld. Negativ forskjell → utsatt skattefordel. Tallene er basert på verdiene du har lagt inn i sammenligningen over.')+'</div></td></tr>');
  }
  document.getElementById('avs-table').innerHTML='<table style="width:100%;border-collapse:collapse;">'+rows.join('')+'</table>';
  document.getElementById('avs-res').classList.remove('hidden');
  if(!skipScroll) requestAnimationFrame(function(){setTimeout(function(){smartScroll(document.getElementById('avs-res'))},150)});
}
function _y(r){return r.avsColYear||'År';}function _s(r){return r.avsColStart||'Verdi start';}function _d(r){return r.avsColDepr||'Avskrivning';}function _e(r){return r.avsColEnd||'Verdi slutt';}
function _row(i,s,d,e){return '<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 4px;">'+i+'</td><td style="padding:6px 4px;text-align:right;">'+s+'</td><td style="padding:6px 4px;text-align:right;">'+d+'</td><td style="padding:6px 4px;text-align:right;">'+e+'</td></tr>';}

// FERIE: Feriepenger
function calcFerie(){const sal=parseNum('ferie-salary');if(sal<=0)return;const type=+document.getElementById('ferie-type').value;const over60=document.getElementById('ferie-over60').checked;const amt=sal*type;const daily=amt/220;let bonus=0;if(over60){bonus=sal*(type+0.023)-amt;}document.getElementById('ferie-amt').textContent=fmt(amt);document.getElementById('ferie-daily').textContent=fmt(daily);if(over60){document.getElementById('ferie-over60-row').classList.remove('hidden');document.getElementById('ferie-with-bonus').textContent=fmt(amt+bonus);}else{document.getElementById('ferie-over60-row').classList.add('hidden');}document.getElementById('ferie-res').classList.remove('hidden');}

// RENTE: Effektiv Rente (bisection method)
function calcRente(){
  const amt=parseNum('rente-amount'),nom=+document.getElementById('rente-nom').value/100,est=parseNum('rente-est'),monthlyFee=parseNum('rente-monthly'),years=+document.getElementById('rente-years').value;
  if(amt<=0||years<=0||nom<0||monthlyFee<0||est<0)return;
  const n=years*12;
  // Monthly annuity payment at nominal rate
  const mr=nom/12;
  const annuity=mr>0?amt*mr/(1-Math.pow(1+mr,-n)):amt/n;
  const totalPayment=annuity+monthlyFee; // total monthly outflow
  const netProceeds=amt-est; // what borrower actually receives
  // Find effective rate r where PV of all payments = netProceeds
  // PV(r) = totalPayment * (1-(1+r/12)^-n) / (r/12)
  function pvAtRate(r){
    if(r<1e-10)return totalPayment*n;
    const rm=r/12;
    return totalPayment*(1-Math.pow(1+rm,-n))/rm;
  }
  // Bisection: find r where pvAtRate(r) = netProceeds
  let lo=0.0001,hi=2.0;
  for(let i=0;i<200;i++){
    const mid=(lo+hi)/2;
    if(pvAtRate(mid)>netProceeds)lo=mid;else hi=mid;
  }
  const eff=(lo+hi)/2*100;
  const totalFees=est+monthlyFee*n;
  const totalCost=annuity*n+monthlyFee*n+est;
  document.getElementById('rente-eff').textContent=eff.toFixed(2)+'%';
  document.getElementById('rente-total').textContent=fmt(totalCost);
  document.getElementById('rente-fees').textContent=fmt(totalFees);
  document.getElementById('rente-res').classList.remove('hidden');
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
  vgFillRate();
}
function vgFillRate(){
  const sel=document.getElementById('valgevinst-currency');
  const hint=document.getElementById('vg-rate-hint');
  if(!sel||!hint) return;
  const cur=sel.value;
  const r=R();
  if(ccRates[cur] && ccRates.NOK){
    const ratePerUnit = 1/ccRates[cur];
    hint.textContent=(r.vgDagensKurs||'Dagens kurs: ca.')+' '+ratePerUnit.toFixed(2).replace('.',',')+' NOK/'+cur+(ccRatesLoaded?' (live)':' '+(r.vgLive||'(ca.)'));
  } else { hint.textContent=''; }
}
function calcValgevinst(){
  const units=parseNum('valgevinst-units');
  const buyRate=+(document.getElementById('valgevinst-buy-rate').value.replace(',','.'));
  const sellRate=+(document.getElementById('valgevinst-sell-rate').value.replace(',','.'));
  if(units<=0||buyRate<=0||sellRate<=0) return;
  const r=R();
  const costNok=units*buyRate;
  const saleNok=units*sellRate;
  const gain=saleNok-costNok;
  const tax=gain>0?gain*0.22:0;
  const net=gain-tax;
  document.getElementById('valgevinst-result').textContent=fmt(gain);
  document.getElementById('valgevinst-verdict').textContent=gain>=0?(r.valgevinGain||'✓ Gevinst'):(r.valgevinLoss||'✗ Tap');
  document.getElementById('valgevinst-cost').textContent=fmt(costNok);
  document.getElementById('valgevinst-sale').textContent=fmt(saleNok);
  document.getElementById('valgevinst-tax').textContent=gain>0?fmt(tax):fmt(0);
  document.getElementById('valgevinst-net').textContent=fmt(net);
  document.getElementById('valgevinst-res').classList.remove('hidden');
}

// LIKVID: Likviditetsbudsjett
function calcLikvid(){const start=parseNum('likvid-start'),income=parseNum('likvid-income'),expense=parseNum('likvid-expense');const r=R();let balance=start;const rows=['<tr style="border-bottom:1px solid var(--border);"><td style="padding:8px 4px;font-weight:600;">'+(r.likvidColMonth||'Måned')+'</td><td style="padding:8px 4px;font-weight:600;text-align:right;">'+(r.likvidColStart||'Start')+'</td><td style="padding:8px 4px;font-weight:600;text-align:right;">'+(r.likvidColIncome||'Inntekt')+'</td><td style="padding:8px 4px;font-weight:600;text-align:right;">'+(r.likvidColExpense||'Utgift')+'</td><td style="padding:8px 4px;font-weight:600;text-align:right;">'+(r.likvidColEnd||'Slutt')+'</td></tr>'];for(let i=1;i<=6;i++){const endBal=balance+income-expense;const style=endBal<0?'background:rgba(255,0,0,0.05);':'';rows.push('<tr style="border-bottom:1px solid var(--border);'+style+'"><td style="padding:6px 4px;">'+(r.likvidMnd||'Mnd')+' '+i+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(balance)+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(income)+'</td><td style="padding:6px 4px;text-align:right;">'+fmt(expense)+'</td><td style="padding:6px 4px;text-align:right;font-weight:600;">'+fmt(endBal)+'</td></tr>');balance=endBal;}document.getElementById('likvid-table').innerHTML='<table style="width:100%;border-collapse:collapse;">'+rows.join('')+'</table>';document.getElementById('likvid-res').classList.remove('hidden');}

// PENSJON: Pensjon OTP
function calcPensjon(){
  const age=+document.getElementById('pensjon-age').value,retire=+document.getElementById('pensjon-retire').value,sal=parseNum('pensjon-salary'),otpRate=+document.getElementById('pensjon-otp').value,retRate=+document.getElementById('pensjon-return').value/100;
  const years=retire-age;if(years<=0)return;
  let pot=0;
  for(let y=0;y<years;y++){pot=(pot+sal*otpRate)*(1+retRate);}
  const annual=pot/20;
  const monthly=annual/12;
  // Inflasjonsjustert kjøpekraft (2% inflasjon)
  const inflasjon=0.02;
  const realMonthly=monthly/Math.pow(1+inflasjon,years);
  document.getElementById('pensjon-pot').textContent=fmt(pot);
  document.getElementById('pensjon-annual').textContent=fmt(annual);
  document.getElementById('pensjon-monthly').textContent=fmt(monthly);
  document.getElementById('pensjon-real-monthly').textContent=fmt(realMonthly);
  document.getElementById('pensjon-disclaimer').classList.remove('hidden');
  document.getElementById('pensjon-res').classList.remove('hidden');
}

function switchCalcMode(mode, skipScroll){
  bcMode=mode;
  bcExpr='';bcHistory='';bcFresh=true;
  if(typeof closeMobileSidebar==='function')closeMobileSidebar();
  if(typeof exitFocusMode==='function')exitFocusMode();
  // Update mobile bar label
  var mobileLabels={basic:'Enkel',scientific:'Vitenskapelig',finance:'Finansiell',unit:'Valuta',lvu:'Lønn vs Utbytte',aga:'Ansattkostnad',avs:'Avskrivning',ferie:'Feriepenger',rente:'Effektiv Rente',valgevinst:'Valutagevinst',likvid:'Likviditet',pensjon:'Pensjon'};
  if(typeof updateMobileBar==='function')updateMobileBar(mobileLabels[mode]||mode);
  // Auto-focus for scientific on mobile
  if(mode==='scientific'&&window.innerWidth<=768&&typeof enterFocusMode==='function')setTimeout(enterFocusMode,100);
  document.querySelectorAll('.cm-opt').forEach(el=>el.classList.remove('cm-active'));
  const modeMap={basic:'cm-basic',finance:'cm-fin',scientific:'cm-sci',unit:'cm-unit',lvu:'cm-lvu',aga:'cm-aga',avs:'cm-avs',ferie:'cm-ferie',rente:'cm-rente',valgevinst:'cm-valgevinst',likvid:'cm-likvid',pensjon:'cm-pensjon'};
  var mEl=document.getElementById(modeMap[mode]);if(mEl)mEl.classList.add('cm-active');
  const keysWrap=bcKeys?bcKeys.parentElement:null;
  const dispWrap=bcDisp?bcDisp.parentElement:null;
  const specialPanels=['bc-unit','bc-finance','bc-lvu','bc-aga','bc-avs','bc-ferie','bc-rente','bc-valgevinst','bc-likvid','bc-pensjon'];
  specialPanels.forEach(id=>{var el=document.getElementById(id);if(el)el.classList.add('hidden');});
  const r=R();
  const extraModes={lvu:r.lblLvu||'Lønn vs Utbytte',aga:r.lblAga||'Ansattkostnad',avs:r.lblAvs||'Avskrivning',ferie:r.lblFerie||'Feriepenger',rente:r.lblRente||'Effektiv Rente',valgevinst:r.lblValgevinst||'Valutagevinst',likvid:r.lblLikvid||'Likviditet',pensjon:r.lblPensjon||'Pensjon'};
  if(extraModes[mode]){
    if(keysWrap)keysWrap.classList.add('hidden');if(dispWrap)dispWrap.classList.add('hidden');
    const panel=document.getElementById('bc-'+mode);if(panel){panel.classList.remove('hidden');panel.classList.remove('bc-panel-anim');void panel.offsetWidth;panel.classList.add('bc-panel-anim');}
    var ml=document.getElementById('bc-mode-label');if(ml)ml.textContent=extraModes[mode];
  } else if(mode==='unit'){
    if(keysWrap)keysWrap.classList.add('hidden');if(dispWrap)dispWrap.classList.add('hidden');
    const panel=document.getElementById('bc-unit');if(panel){panel.classList.remove('hidden');panel.classList.remove('bc-panel-anim');void panel.offsetWidth;panel.classList.add('bc-panel-anim');}
    var ml2=document.getElementById('bc-mode-label');if(ml2)ml2.textContent=r.cmUnit||'Valuta';
    ccConvert();
  } else if(mode==='finance'){
    if(keysWrap)keysWrap.classList.add('hidden');if(dispWrap)dispWrap.classList.add('hidden');
    const panel=document.getElementById('bc-finance');if(panel){panel.classList.remove('hidden');panel.classList.remove('bc-panel-anim');void panel.offsetWidth;panel.classList.add('bc-panel-anim');}
    var ml3=document.getElementById('bc-mode-label');if(ml3)ml3.textContent=r.cmFinance||'Financial';
    fcUpdateFields();
  } else {
    if(keysWrap)keysWrap.classList.remove('hidden');if(dispWrap)dispWrap.classList.remove('hidden');
    var ml4=document.getElementById('bc-mode-label');
    if(mode==='scientific'){
      if(ml4)ml4.textContent=r.cmScientific||'Scientific';
      buildCalcKeys('scientific');
    } else {
      if(ml4)ml4.textContent=r.tabBasic||'Calculator';
      buildCalcKeys('basic');
    }
    bcUpdateDisp();
  }
  // Scroll to the active panel, not just nav
  if(!skipScroll){
    setTimeout(()=>{
      var target=document.getElementById('bc-'+mode);
      if(!target||target.classList.contains('hidden')) target=document.querySelector('.calc-nav');
      if(target) scrollToEl(target,'top');
    },120);
  }
}

// ═══════════════════════════════════════════════════════
// UNIT CONVERTER
// ═══════════════════════════════════════════════════════
// CURRENCY CONVERTER
// ═══════════════════════════════════════════════════════
const ccCurrenciesNO = ['Norske kroner','Euro','US Dollar','Britiske pund','Svenske kroner','Danske kroner','Polske zloty','Sveitsiske franc','Japanske yen','Kinesiske yuan','Kanadiske dollar','Australske dollar','Indiske rupi','Tyrkiske lira','Brasilianske real'];
const ccCurrencyCodes = ['NOK','EUR','USD','GBP','SEK','DKK','PLN','CHF','JPY','CNY','CAD','AUD','INR','TRY','BRL'];
const ccCurrencyFlags = ['🇳🇴','🇪🇺','🇺🇸','🇬🇧','🇸🇪','🇩🇰','🇵🇱','🇨🇭','🇯🇵','🇨🇳','🇨🇦','🇦🇺','🇮🇳','🇹🇷','🇧🇷'];
function getCcCurrencies(){ const r=R(); const names=r.ccCurrNames||ccCurrenciesNO; return ccCurrencyCodes.map((code,i)=>[code,ccCurrencyFlags[i]+' '+code+' — '+(names[i]||ccCurrenciesNO[i])]); }
// Fallback rates vs NOK (approximate March 2026)
let ccRates = {NOK:1,EUR:0.0904,USD:0.0935,GBP:0.0737,SEK:0.9524,DKK:0.6404,PLN:0.3685,CHF:0.0813,JPY:14.02,CNY:0.6618,CAD:0.1267,AUD:0.1435,INR:7.88,TRY:3.39,BRL:0.5356};
let ccRatesLoaded = false;
let ccLastUpdate = '';

async function ccFetchRates(){
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/NOK');
    const data = await res.json();
    if(data.result==='success'){
      ccRates = data.rates;
      ccRatesLoaded = true;
      ccLastUpdate = data.time_last_update_utc ? new Date(data.time_last_update_utc).toLocaleDateString('no') : '';
      ccConvert();
      vgFillRate();
    }
  } catch(e){ /* use fallback rates */ }
}

function ccPopulate(){
  const defaults=['NOK','EUR'];
  ['uc-from','uc-to'].forEach((id,i)=>{
    const sel=document.getElementById(id);
    const prev=sel.value||defaults[i];
    sel.innerHTML='';
    getCcCurrencies().forEach(([code,label],j)=>{
      const o=document.createElement('option');
      o.value=code;o.textContent=label;
      sel.appendChild(o);
    });
    sel.value=prev;
  });
}

function ccConvert(){
  const from=document.getElementById('uc-from').value;
  const to=document.getElementById('uc-to').value;
  const val=parseFloat(document.getElementById('uc-val').value)||0;
  const rateFrom=ccRates[from]||1;
  const rateTo=ccRates[to]||1;
  const result=val*(rateTo/rateFrom);
  const rate=(rateTo/rateFrom);
  document.getElementById('uc-res').textContent=result.toLocaleString('no',{minimumFractionDigits:2,maximumFractionDigits:2});
  const info=document.getElementById('uc-rate-info');
  const r=R();if(info) info.textContent='1 '+from+' = '+rate.toLocaleString('no',{minimumFractionDigits:4,maximumFractionDigits:4})+' '+to+(ccRatesLoaded?' '+(r.ccLive||'(live)'):' '+(r.ccApprox||'(ca.)'));
}

function ccSwap(){
  const f=document.getElementById('uc-from');
  const t=document.getElementById('uc-to');
  const tmp=f.value;f.value=t.value;t.value=tmp;
  ccConvert();
}

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
  const cur = sel.value || 'tvm';
  sel.innerHTML = '';
  for(const [k,v] of Object.entries(cfgs)){
    const o = document.createElement('option');
    o.value = k; o.textContent = v.label;
    sel.appendChild(o);
  }
  sel.value = cur;
}
function ucPopulateCat(){ ccPopulate(); }
function ucUpdateUnits(){ ccConvert(); }
function ucConvert(){ ccConvert(); }

function fcUpdateFields(){
  var _fct=document.getElementById('fc-type');const type=_fct?_fct.value:'pv';
  const cfg = getFcConfigs()[type];
  const container = document.getElementById('fc-fields');
  container.innerHTML = '';
  cfg.fields.forEach(f => {
    const isRate = f.id.includes('rate');
    container.innerHTML += `<div class="fg"><label class="flbl">${f.label}</label><input class="fc" type="text" ${isRate?'':'inputmode="numeric"'} id="${f.id}" value="${isRate ? f.val : fmtInput(f.val)}"></div>`;
  });
  document.getElementById('fc-result').classList.add('hidden');
}

function fcCalc(){
  const type = document.getElementById('fc-type').value;
  const g = id => parseFloat(document.getElementById(id).value.replace(/,/g,''))||0;
  const resLbl = document.getElementById('fc-res-lbl');
  const resVal = document.getElementById('fc-res-val');
  const resSub = document.getElementById('fc-res-sub');
  const resGrid = document.getElementById('fc-res-grid');
  const r = R();
  resGrid.innerHTML = '';
  resSub.textContent = '';

  if(type==='tvm'){
    const pv=g('fc-pv'), rate=g('fc-rate')/100, n=g('fc-n'), pmt=g('fc-pmt');
    const factor = Math.pow(1+rate, n);
    const fv = pmt===0 ? pv*factor : (rate===0 ? pv + pmt*n : pv*factor + pmt*(factor-1)/rate);
    const totalPmt = pmt*n;
    const interest = fv - pv - totalPmt;
    resLbl.textContent = r.fcRFv||'Future value (FV)';
    resVal.textContent = fmt(fv);
    resSub.textContent = (r.fcRAfter||'After') + ' ' + n + ' ' + (r.fcRYr||'years');
    const tvmReturn = pv!==0 ? pct((fv/pv-1)*100) : '—';
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
      <div class="rt"><div class="rt-lbl">Markup</div><div class="rt-val">${pct(markup)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcCost||'Cost price'}</div><div class="rt-val">${fmt(cost)}</div></div>
      <div class="rt"><div class="rt-lbl">${r.fcSell||'Selling price'}</div><div class="rt-val">${fmt(sell)}</div></div>`;
  }
  else if(type==='breakeven'){
    const fixed=g('fc-fixed'), price=g('fc-price'), vc=g('fc-varcost');
    const contribution = price - vc;
    const units = contribution > 0 ? Math.ceil(fixed / contribution) : Infinity;
    const revenue = units * price;
    resLbl.textContent = r.fcRBePoint||'Break-even point';
    resVal.textContent = units === Infinity ? '∞' : units.toLocaleString('en') + ' ' + (r.fcRUnits||'units');
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
    resSub.textContent = (r.fcRAfter||'After') + ' ' + y + ' ' + (r.fcRYr||'years') + ' ' + (r.fcRMonthly||'with monthly interest');
    const compReturn = p!==0 ? pct((total/p-1)*100) : '—';
    const doublingStr = isFinite(doubling) && doubling > 0 ? doubling.toFixed(1) + ' ' + (r.fcRYr||'years') : '—';
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

// Mobile sidebar toggle
function toggleMobileSidebar(){document.body.classList.toggle('mobile-sidebar-open');}
function closeMobileSidebar(){document.body.classList.remove('mobile-sidebar-open');}
// Focus mode
var _focusZoomHandler=null;
function enterFocusMode(){document.body.classList.add('calc-focus');document.body.style.overflow='hidden';var mmb=document.querySelector('.mobile-mode-bar');if(mmb)mmb.style.top='0px';var vp=document.querySelector('meta[name="viewport"]');if(vp)vp.setAttribute('content','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no');_focusZoomHandler=function(e){if(e.touches&&e.touches.length>1){e.preventDefault();}};document.addEventListener('touchstart',_focusZoomHandler,{passive:false});document.addEventListener('gesturestart',function(e){e.preventDefault();},{passive:false});}
function exitFocusMode(){document.body.classList.remove('calc-focus');document.body.style.overflow='';var mmb=document.querySelector('.mobile-mode-bar');var h=document.querySelector('header');if(mmb&&h)mmb.style.top=h.offsetHeight+'px';var vp=document.querySelector('meta[name="viewport"]');if(vp)vp.setAttribute('content','width=device-width,initial-scale=1');if(_focusZoomHandler){document.removeEventListener('touchstart',_focusZoomHandler);_focusZoomHandler=null;}}
function updateMobileBar(label){var el=document.getElementById('mobile-mode-label');if(el)el.textContent=label;}

// Init basic calc
buildCalcKeys('basic');
bcFresh=false;
bcUpdateDisp();
fcPopulateSelect();
fcUpdateFields();
ccPopulate();
ccFetchRates();
vgPopulate();
if(document.getElementById('m-type')) morPopulateType();
// Restore theme from localStorage
// ═══════════════════════════════════════════════════════
// ENTER KEY → CALCULATE
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown', function(e){
  if(e.key==='Enter'){
    var tag=e.target.tagName;
    if(tag==='TEXTAREA'||e.target.closest('form')) return;
    e.preventDefault();
    const calcMap = {salary:calcSal, mortgage:calcMor, npv:calcNpv, vat:calcVat};
    if(activeCalc==='basic' && bcMode==='finance'){ fcCalc(); return; }
    if(activeCalc==='basic'){
      const subCalcMap={lvu:calcLvu,aga:calcAga,avs:calcAvs,ferie:calcFerie,rente:calcRente,valgevinst:calcValgevinst,likvid:calcLikvid,pensjon:calcPensjon};
      if(subCalcMap[bcMode]){ subCalcMap[bcMode](); return; }
      bcPress('='); return;
    }
    if(calcMap[activeCalc]) calcMap[activeCalc]();
  }
});

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
if('scrollRestoration' in history) history.scrollRestoration = 'manual';
// Restore saved language in header
(function(){
  var _rf=document.getElementById('rf');if(_rf)_rf.textContent=R().flag;
  var _rn=document.getElementById('rn');if(_rn)_rn.textContent=R().name;
  document.querySelectorAll('.region-opt').forEach(function(el){el.classList.remove('active');});
  var sel=document.querySelector('.region-opt[onclick*="\''+region+'\'"]');
  if(sel) sel.classList.add('active');
})();
// ── Budsjettkalkulator ──
function budsjettAddRow(type){
  var r=R();var cont=document.getElementById('budsjett-'+type+'-rows');
  var row=document.createElement('div');row.className='budsjett-row';row.style.cssText='display:flex;gap:8px;margin-bottom:6px;';
  var phName=type==='income'?(r.budPlaceholderIncome||'f.eks. Lønn'):(r.budPlaceholderExpense||'f.eks. Utgift');
  row.innerHTML='<input type="text" class="fc budsjett-name" placeholder="'+phName+'" style="flex:2;">'+
    '<input type="text" class="fc budsjett-amount" placeholder="0" inputmode="numeric" style="flex:1;text-align:right;">'+
    '<button onclick="this.parentElement.remove();budsjettCalc()" style="background:none;border:none;color:var(--ink3,#999);cursor:pointer;font-size:16px;padding:0 4px;" title="Fjern">×</button>';
  cont.appendChild(row);
  row.querySelector('.budsjett-name').focus();
}
function budsjettCalc(){
  var r=R();
  var incomeRows=document.querySelectorAll('#budsjett-income-rows .budsjett-row');
  var expenseRows=document.querySelectorAll('#budsjett-expense-rows .budsjett-row');
  var totalIncome=0,totalExpense=0;
  var incomeItems=[],expenseItems=[];
  incomeRows.forEach(function(row){
    var name=row.querySelector('.budsjett-name').value.trim()||r.budDefaultIncome||'Inntekt';
    var amt=+(row.querySelector('.budsjett-amount').value.replace(/[^0-9.\-]/g,''))||0;
    if(amt>0){incomeItems.push({name:name,amount:amt});totalIncome+=amt;}
  });
  expenseRows.forEach(function(row){
    var name=row.querySelector('.budsjett-name').value.trim()||r.budDefaultExpense||'Utgift';
    var amt=+(row.querySelector('.budsjett-amount').value.replace(/[^0-9.\-]/g,''))||0;
    if(amt>0){expenseItems.push({name:name,amount:amt});totalExpense+=amt;}
  });
  var balance=totalIncome-totalExpense;
  var savingsRate=totalIncome>0?((balance/totalIncome)*100):0;
  document.getElementById('budsjett-r-income').textContent=fmt(totalIncome);
  document.getElementById('budsjett-r-expense').textContent=fmt(totalExpense);
  document.getElementById('budsjett-r-balance').textContent=fmt(balance);
  document.getElementById('budsjett-r-balance').style.color='#fff';
  document.getElementById('budsjett-r-savings').textContent=savingsRate.toFixed(1)+' %';
  document.getElementById('budsjett-r-annual').textContent=fmt(balance*12);
  var verdict=balance>0?(r.budVerdictSurplus||'Du har et månedlig overskudd.'):balance===0?(r.budVerdictBreakeven||'Du går i null.'):( r.budVerdictDeficit||'Du bruker mer enn du tjener.');
  document.getElementById('budsjett-r-verdict').textContent=verdict;
  // Expense breakdown (simple list with bar chart)
  var bd=document.getElementById('budsjett-breakdown');
  if(expenseItems.length>1){
    var html='<div style="font-size:11px;font-weight:700;color:var(--ink2);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;">'+(r.budBreakdownTitle||'Utgiftsfordeling')+'</div>';
    html+='<div style="margin-top:4px;">';
    expenseItems.sort(function(a,b){return b.amount-a.amount;});
    expenseItems.forEach(function(item){
      var pct=totalExpense>0?((item.amount/totalExpense)*100):0;
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:12px;">'+
        '<div style="width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+item.name+'</div>'+
        '<div style="flex:1;background:var(--border);border-radius:4px;height:14px;overflow:hidden;">'+
        '<div style="width:'+pct+'%;height:100%;background:var(--accent);border-radius:4px;transition:width .3s;"></div></div>'+
        '<div style="width:70px;text-align:right;opacity:.6;">'+fmt(item.amount)+'</div></div>';
    });
    html+='</div>';
    bd.innerHTML=html;
  } else { bd.innerHTML=''; }
  document.getElementById('budsjett-res').classList.remove('hidden');
  // Store data for CSV
  window._budsjettData={incomeItems:incomeItems,expenseItems:expenseItems,totalIncome:totalIncome,totalExpense:totalExpense,balance:balance,savingsRate:savingsRate};
}
function budsjettPdf(){
  var d=window._budsjettData;if(!d)return;
  var r=R();
  var sep=';';
  var rows=[];
  rows.push([(r.budPdfTitle||'Personlig budsjett'),new Date().toLocaleDateString('no-NO',{year:'numeric',month:'long',day:'numeric'})]);
  rows.push([]);
  rows.push([(r.budLIncomeHdr||'Inntekter').toUpperCase(),'']);
  rows.push([(r.budDefaultIncome||'Post'),(r.budTotal||'Beløp')]);
  d.incomeItems.forEach(function(i){rows.push([i.name,i.amount]);});
  rows.push([(r.budTotal||'Totalt'),d.totalIncome]);
  rows.push([]);
  rows.push([(r.budLExpenseHdr||'Utgifter').toUpperCase(),'']);
  rows.push([(r.budDefaultExpense||'Post'),(r.budTotal||'Beløp')]);
  d.expenseItems.forEach(function(i){rows.push([i.name,i.amount]);});
  rows.push([(r.budTotal||'Totalt'),d.totalExpense]);
  rows.push([]);
  rows.push([(r.budBreakdownTitle||'Utgifter per kategori').toUpperCase(),'','']);
  rows.push([(r.budBreakdownTitle||'Kategori'),(r.budTotal||'Beløp'),'%']);
  Object.keys(d.cats).sort(function(a,b){return d.cats[b]-d.cats[a];}).forEach(function(c){
    var pct=d.totalExpense>0?((d.cats[c]/d.totalExpense)*100).toFixed(1):'0';
    rows.push([catNames[c]||c,d.cats[c],pct+'%']);
  });
  rows.push([]);
  rows.push([(r.budSummaryTitle||'Sammendrag').toUpperCase(),'','']);
  rows.push([r.budRLblIncome||'Sum inntekter','',d.totalIncome]);
  rows.push([r.budRLblExpense||'Sum utgifter','',d.totalExpense]);
  rows.push([r.budRLbl||'Månedlig balanse','',d.balance]);
  rows.push([r.budRLblSavings||'Sparerate','',d.savingsRate.toFixed(1)+'%']);
  rows.push([r.budRLblAnnual||'Årlig overskudd','',d.balance*12]);
  rows.push([]);
  rows.push([(r.budPdfFooter||'Generert av Hverdagsverktøy')]);
  var csv=rows.map(function(r){return r.map(function(c){var s=String(c==null?'':c);return s.indexOf(sep)>=0||s.indexOf('"')>=0?'"'+s.replace(/"/g,'""')+'"':s;}).join(sep);}).join('\r\n');
  var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='budsjett.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}

// Page initialization — called by each page after DOM is ready
function initPage(){
  // Sync region selector UI with saved language
  var _rf=document.getElementById('rf');if(_rf)_rf.textContent=R().flag;
  var _rn=document.getElementById('rn');if(_rn)_rn.textContent=R().name;
  document.querySelectorAll('.region-opt').forEach(function(el){el.classList.remove('active');});
  var activeOpt=document.querySelector('.region-opt[onclick*="\''+region+'\'"]');
  if(activeOpt) activeOpt.classList.add('active');
  bilInitYear();
  updateAll();
  // Set calc-nav sticky top to match actual header height
  (function(){
    var h=document.querySelector('header');
    var nav=document.querySelector('.calc-nav');
    if(h&&nav){
      var hH=h.offsetHeight;
      nav.style.top=hH+'px';
      // Also fix mobile-mode-bar if present
      var mmb=document.querySelector('.mobile-mode-bar');
      if(mmb&&!document.body.classList.contains('calc-focus')) mmb.style.top=hH+'px';
    }
    // Re-check on resize (header height may change)
    window.addEventListener('resize',function(){
      if(h&&nav) nav.style.top=h.offsetHeight+'px';
      var mmb2=document.querySelector('.mobile-mode-bar');
      if(h&&mmb2&&!document.body.classList.contains('calc-focus')) mmb2.style.top=h.offsetHeight+'px';
    });
  })();
  window.scrollTo(0,0);
  // Auto-scroll selects into view on focus (mobile-friendly)
  document.querySelectorAll('select.fc').forEach(function(sel){
    sel.addEventListener('focus',function(){setTimeout(function(){scrollToEl(sel);},150);});
  });
  // Handle hash-based deep links (cross-page navigation)
  var hash=window.location.hash.replace('#','');
  if(hash){
    setTimeout(function(){
      var el=document.getElementById(hash);
      if(el){
        // Open card/law-group if collapsed
        if(el.classList.contains('collapsed')) el.classList.remove('collapsed');
        var lawGroup=el.closest&&el.closest('.law-group');
        if(lawGroup&&!lawGroup.classList.contains('open')){
          lawGroup.classList.add('open');
          var body=lawGroup.querySelector('.law-group-body');
          if(body){body.style.maxHeight='none';}
        }
        setTimeout(function(){smartScroll(el);},200);
      }
      // Handle mode hashes like #lvu, #avs
      if(typeof switchCalcMode==='function'){
        var modes=['lvu','aga','avs','ferie','rente','valgevinst','likvid','pensjon'];
        if(modes.indexOf(hash)>=0) switchCalcMode(hash);
      }
    },300);
  }
}

