// ═══════════════════════════════════════════════════════
// Hverdagsverktøy — core.js
// © 2026 Kasper Skjæveland Espedal. All rights reserved.
// https://hverdagsverktoy.com
// ═══════════════════════════════════════════════════════

const RATES_LAST_UPDATED = '2026-03-19';
const RATES_YEAR = 2026;

function checkRatesAge(){
  var updated=new Date(RATES_LAST_UPDATED);
  var now=new Date();
  var monthsDiff=(now.getFullYear()-updated.getFullYear())*12+(now.getMonth()-updated.getMonth());
  return {stale:monthsDiff>=6,months:monthsDiff};
}

function injectRatesDisclaimer(resEl){
  if(!resEl||resEl.querySelector('.rates-disc'))return;
  var r=R();var age=checkRatesAge();
  var updatedStr=RATES_LAST_UPDATED.split('-').reverse().join('.');
  var txt=(r.ratesDisclaimer||'Satser: Inntektsåret')+' '+RATES_YEAR+' · '+(r.ratesUpdated||'Sist oppdatert')+' '+updatedStr;
  var staleHtml='';
  if(age.stale){staleHtml='<div style="margin-top:4px;color:#b45309;font-weight:600;">⚠️ '+(r.ratesStale||'Satsene ble sist oppdatert for over 6 måneder siden og kan være utdaterte.')+'</div>';}
  var d=document.createElement('div');d.className='rates-disc';
  d.style.cssText='font-size:11px;color:var(--ink3);padding:6px 12px;border-radius:6px;background:color-mix(in srgb,var(--accent) 4%,transparent);margin-bottom:8px;line-height:1.5;';
  d.innerHTML=txt+' · <a href="https://skatteetaten.no" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline;">skatteetaten.no</a>'+staleHtml;
  resEl.insertBefore(d,resEl.firstChild);
}
// Auto-inject disclaimer when result sections become visible
(function(){
  var obs=new MutationObserver(function(muts){
    muts.forEach(function(m){
      if(m.type==='attributes'&&m.attributeName==='class'){
        var el=m.target;
        if(el.classList.contains('result-sec')&&!el.classList.contains('hidden')&&el.id!=='bil-res'){
          injectRatesDisclaimer(el);
        }
      }
    });
  });
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.result-sec').forEach(function(el){
      obs.observe(el,{attributes:true,attributeFilter:['class']});
    });
  });
})();

// ═══════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════
const THEMES = [
  {id:'carbon',labelKey:'themeCarbon',fallback:'Standard Mørk',dot:'#1e1e1e',ring:'#d4a574',dotBorder:'rgba(255,255,255,.08)'},
  {id:'frost',labelKey:'themeFrost',fallback:'Standard',dot:'#e8ecf4',ring:'#4f5fe5',dotBorder:'rgba(79,95,229,.12)'},
  {id:'dark',labelKey:'themeDark',fallback:'Mørk',dot:'#242740',ring:'#6c8aef',dotBorder:'rgba(255,255,255,.12)'},
  {id:'pink',labelKey:'themePink',fallback:'Rosa',dot:'#e4a0be',ring:'#e890b2',dotBorder:'rgba(0,0,0,.06)'},
  {id:'glass',labelKey:'themeGlass',fallback:'Glass',dot:'#7c88f8',ring:'#6875f5',dotBorder:'rgba(0,0,0,.06)'},
  {id:'hendrix',labelKey:'themeHendrix',fallback:'Hendrix',dot:'#9e5c3a',ring:'#7b2d8e',dotBorder:'rgba(0,0,0,.08)'},
  {id:'bw',labelKey:'themeBw',fallback:'Ray',dot:'#8a8a8a',ring:'#1a1a1a',dotBorder:'rgba(0,0,0,.12)'},
  {id:'disco',labelKey:'themeDisco',fallback:'Disco',dot:'#b044a2',ring:'#e91e8c',dotBorder:'rgba(176,68,162,.2)'}
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
  var oldPanel=document.getElementById('theme-panel');
  if(oldPanel) oldPanel.remove();
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
    var swSize=isMobile?'22px':'24px';
    var swGap=isMobile?'6px':'8px';
    swatch.style.cssText='width:'+swSize+';height:'+swSize+';border-radius:50%;border:1.5px solid '+swatchBorder+';background:'+t.dot+';cursor:pointer;outline:none;padding:0;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;flex-shrink:0;position:relative;display:inline-block;vertical-align:middle;'+(isActive?'box-shadow:0 0 0 1.5px var(--surface),0 0 0 3px '+swatchBorder+';':'')+(i>0?'margin-left:'+swGap+';':'');
    swatch.onmouseenter=function(){if(!isActive)this.style.transform='scale(1.12)';};
    swatch.onmouseleave=function(){this.style.transform='scale(1)';};
    swatch.onclick=function(e){e.stopPropagation();setTheme(t.id);};
    if(isActive){
      var ck=document.createElement('span');
      ck.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5);pointer-events:none;';
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
      // Center panel under button
      var btnCenter=rect.left+rect.width/2;
      var idealLeft=btnCenter-panelW/2;
      if(panelW>vw-24){
        panel.style.left='12px';panel.style.right='12px';
      } else {
        if(idealLeft<12) idealLeft=12;
        if(idealLeft+panelW>vw-12) idealLeft=vw-panelW-12;
        panel.style.left=idealLeft+'px';
        panel.style.right='auto';
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
      if(w&&p&&!w.contains(e.target)&&!p.contains(e.target)){p.style.display='none';if(b)b.style.borderColor='var(--border)';}
    });
  }
  wrap.appendChild(btn);
  document.body.appendChild(panel);
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
  try{updateHero();}catch(e){}
}
(function(){
  try {
    const saved = localStorage.getItem('hvt-theme');
    const valid = THEMES.map(t=>t.id);
    const chosen = (saved && valid.includes(saved)) ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', chosen);
  } catch(e){
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
const VALID_LANGS = ['no','en','zh','fr','pl','uk','ar','lt','so','ti'];
if(typeof REGIONS === 'undefined') var REGIONS = {};
let region = (function(){ try { const s=localStorage.getItem('hvt-lang'); if(s && VALID_LANGS.indexOf(s)>=0) return s; } catch(e){} return 'no'; })();
let _langLoading = {};
function loadLang(code) {
  if(REGIONS[code]) return Promise.resolve();
  if(_langLoading[code]) return _langLoading[code];
  _langLoading[code] = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = '/shared/lang/' + code + '.js?v=v8';
    s.onload = function() { delete _langLoading[code]; resolve(); };
    s.onerror = function() { delete _langLoading[code]; reject(new Error('Failed to load lang: ' + code)); };
    document.head.appendChild(s);
  });
  return _langLoading[code];
}
buildThemePicker();
let activeCalc = 'dashboard';
let _sal, _mor, _npv, _vat;

function R() { const r=REGIONS[region]; if(!r) return REGIONS['no']||{}; return r.base ? Object.assign({},REGIONS[r.base],r) : r; }
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
  document.querySelectorAll('.region-opt').forEach(el => el.classList.remove('active'));
  if(e && e.currentTarget) e.currentTarget.classList.add('active');
  else { var opt=document.querySelector('.region-opt[onclick*="\''+r+'\'"]'); if(opt) opt.classList.add('active'); }
  var _rdd=document.getElementById('rdd');if(_rdd)_rdd.classList.remove('open');
  loadLang(r).then(function() {
    var _rf=document.getElementById('rf');if(_rf)_rf.textContent=R().flag;
    var _rn=document.getElementById('rn');if(_rn)_rn.textContent=R().name;
    updateAll();
  }).catch(function() {
    // Fallback: switch to Norwegian if language fails to load
    if(r !== 'no') { region = 'no'; updateAll(); }
  });
}
function toggleDD() { var el=document.getElementById('rdd');if(el)el.classList.toggle('open'); }
document.addEventListener('click', e => { if(!e.target.closest('.region-sel')){var _rd=document.getElementById('rdd');if(_rd)_rd.classList.remove('open');} });

// ═══════════════════════════════════════════════════════
// UPDATE ALL UI
// ═══════════════════════════════════════════════════════
function updateAll() {
  try{updateHero();}catch(e){}
  try{updateTabs();}catch(e){}
  // Scroll active tab into view on mobile
  try{var _cnav=document.querySelector('.calc-nav');if(_cnav){var _at=_cnav.querySelector('.calc-tab.active');if(_at)setTimeout(function(){_at.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});},50);_cnav.addEventListener('scroll',function(){var atEnd=this.scrollLeft+this.clientWidth>=this.scrollWidth-10;this.classList.toggle('scrolled-end',atEnd);},{passive:true});}}catch(e){}
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
  var _sg=document.getElementById('sec-guide');if(_sg){var gk=document.getElementById('calc-salary')?'secGuideTax':document.getElementById('calc-mortgage')?'secGuideMor':document.getElementById('calc-vat')?'secGuideVat':document.getElementById('calc-npv')?'secGuidePerso':'secGuide';_sg.textContent=R()[gk]||_sg.textContent;}
  // clear results
  ['s-res','m-res','n-res','v-res'].forEach(id => { const el=document.getElementById(id); if(el) el.classList.add('hidden'); });
  _sal=_mor=_npv=_vat=null;
  // set defaults (only if elements exist)
  const d = R().salDefaults;
  var sg=document.getElementById('s-g');if(sg)sg.value = fmtInput(d.gross);
  var ma=document.getElementById('m-a');if(ma)ma.value = fmtInput(3000000);
}

// Three.js disco ball
var _discoBall3D=[];
function initDiscoBall3D(container){
  function boot(){
    if(!window.THREE){
      // Lazy-load Three.js
      var s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload=function(){buildScene(container);};
      document.head.appendChild(s);
    } else {
      buildScene(container);
    }
  }
  function buildScene(el){
    var T=window.THREE;if(!T)return;
    var W=80,H=110;
    var scene=new T.Scene();
    var camera=new T.PerspectiveCamera(40,W/H,0.1,100);
    camera.position.set(0,0.2,3.2);
    var renderer=new T.WebGLRenderer({alpha:true,antialias:true});
    renderer.setSize(W,H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0x000000,0);
    el.appendChild(renderer.domElement);

    // Disco ball — faceted icosahedron
    var geo=new T.IcosahedronGeometry(0.85,2);
    // Create faceted look by computing flat normals
    geo.computeVertexNormals();
    // Make each face flat-shaded by duplicating vertices
    var mat=new T.MeshStandardMaterial({
      color:0xc0c0c8,metalness:0.95,roughness:0.08,flatShading:true,
      envMapIntensity:1.5
    });
    var mesh=new T.Mesh(geo,mat);
    mesh.position.y=0.05;
    scene.add(mesh);

    // Environment map — procedural cube texture for reflections
    var cubeRT=new T.WebGLCubeRenderTarget(64);
    var cubeScene=new T.Scene();
    // Dark environment with colored spots
    cubeScene.background=new T.Color(0x0d0a18);
    var spotColors=[0x7b2ff7,0xe91e8c,0xff6b35,0x00d4ff,0xffd700];
    spotColors.forEach(function(c,i){
      var sGeo=new T.SphereGeometry(0.3,8,8);
      var sMat=new T.MeshBasicMaterial({color:c});
      var sMesh=new T.Mesh(sGeo,sMat);
      var angle=(i/spotColors.length)*Math.PI*2;
      sMesh.position.set(Math.cos(angle)*2,Math.sin(angle*0.7)*1.5,Math.sin(angle)*2);
      cubeScene.add(sMesh);
    });
    var cubeCamera=new T.CubeCamera(0.1,10,cubeRT);
    cubeCamera.update(renderer,cubeScene);
    mat.envMap=cubeRT.texture;

    // Lights
    var ambient=new T.AmbientLight(0x222233,0.4);
    scene.add(ambient);
    var lights=[
      {color:0x7b2ff7,x:2,y:1,z:1,intensity:1.2},
      {color:0xe91e8c,x:-1.5,y:-0.5,z:2,intensity:1.0},
      {color:0xff6b35,x:0,y:2,z:-1.5,intensity:0.8}
    ];
    var pointLights=[];
    lights.forEach(function(l){
      var pl=new T.PointLight(l.color,l.intensity,8);
      pl.position.set(l.x,l.y,l.z);
      scene.add(pl);
      pointLights.push(pl);
    });

    // Thin wire cap on top
    var capGeo=new T.CylinderGeometry(0.06,0.06,0.08,8);
    var capMat=new T.MeshStandardMaterial({color:0x888890,metalness:0.9,roughness:0.2});
    var cap=new T.Mesh(capGeo,capMat);
    cap.position.y=0.9;
    scene.add(cap);

    var clock=new T.Clock();
    var animId;
    function animate(){
      animId=requestAnimationFrame(animate);
      var t=clock.getElapsedTime();
      mesh.rotation.y=t*0.4;
      mesh.rotation.x=Math.sin(t*0.3)*0.08;
      // Rotate lights around ball
      pointLights.forEach(function(pl,i){
        var a=t*0.5+i*(Math.PI*2/3);
        pl.position.x=Math.cos(a)*2.5;
        pl.position.z=Math.sin(a)*2.5;
        pl.position.y=Math.sin(t*0.3+i)*0.8;
      });
      renderer.render(scene,camera);
    }
    animate();
    _discoBall3D.push({renderer:renderer,scene:scene,geo:geo,mat:mat,animId:animId,cubeRT:cubeRT,capGeo:capGeo,capMat:capMat});
  }
  boot();
}
function destroyDiscoBall3D(){
  _discoBall3D.forEach(function(d){
    if(d.animId)cancelAnimationFrame(d.animId);
    if(d.geo)d.geo.dispose();
    if(d.mat)d.mat.dispose();
    if(d.capGeo)d.capGeo.dispose();
    if(d.capMat)d.capMat.dispose();
    if(d.cubeRT)d.cubeRT.dispose();
    if(d.renderer){d.renderer.dispose();d.renderer.forceContextLoss();var c=d.renderer.domElement;if(c&&c.parentElement)c.parentElement.removeChild(c);}
  });
  _discoBall3D=[];
}

function updateHero() {
  const r = R();
  document.getElementById('hero-h1').innerHTML = r.heroH1 || 'Hverdagsverktøy<br><em>Praktiske verktøy for bedrift og privat</em>';
  if(document.documentElement.getAttribute('data-theme')==='disco'){
    var em=document.querySelector('#hero-h1 em');
    if(em){
      em.textContent='\u266B Dancing \u266A';
      // Wrap entire em in a clickable link outside the gradient clip context
      if(!em.parentElement.classList.contains('disco-link-wrap')){
        var link=document.createElement('a');
        link.href='https://www.youtube.com/watch?v=LUID0jSh2Ic';
        link.target='_blank';link.rel='noopener';
        link.className='disco-link-wrap';
        link.style.cssText='text-decoration:none;color:inherit;display:block;position:relative;z-index:10;cursor:pointer;';
        link.onclick=function(e){e.stopPropagation();};
        em.parentElement.insertBefore(link,em);
        link.appendChild(em);
      }
    }
    // Add Two Three.js disco balls to hero (left + right)
    var hero=document.querySelector('.hero');
    if(hero&&!hero.querySelector('.disco-ball')){
      ['left','right'].forEach(function(side){
        var ball=document.createElement('div');ball.className='disco-ball disco-ball-'+side;
        ball.innerHTML='<div class="disco-ball-wire"></div>';
        hero.appendChild(ball);
        initDiscoBall3D(ball);
      });
    }
  } else if(document.documentElement.getAttribute('data-theme')==='hendrix'){
    // Hendrix easter egg — link subtitle to YouTube
    var emH=document.querySelector('#hero-h1 em');
    if(emH&&!emH.parentElement.classList.contains('hendrix-link-wrap')){
      var linkH=document.createElement('a');
      linkH.href='https://www.youtube.com/watch?v=LCGSfEWDNFs';
      linkH.target='_blank';linkH.rel='noopener';
      linkH.className='hendrix-link-wrap';
      linkH.style.cssText='text-decoration:none;color:inherit;-webkit-text-fill-color:inherit;display:block;position:relative;z-index:10;cursor:pointer;';
      linkH.onclick=function(e){e.stopPropagation();};
      emH.parentElement.insertBefore(linkH,emH);
      linkH.appendChild(emH);
    }
    // Cleanup disco stuff if switching from disco
    destroyDiscoBall3D();
    document.querySelectorAll('.disco-ball').forEach(function(db){db.remove();});
  } else {
    // Remove disco ball + cleanup Three.js if switching away
    destroyDiscoBall3D();
    document.querySelectorAll('.disco-ball').forEach(function(db){db.remove();});
    // Unwrap any theme link if present
    var dw=document.querySelector('.disco-link-wrap')||document.querySelector('.hendrix-link-wrap');
    if(dw){var emInside=dw.querySelector('em');if(emInside)dw.parentElement.insertBefore(emInside,dw);dw.remove();}
  }
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
  var _tlSelskap=document.getElementById('tl-selskap');if(_tlSelskap)_tlSelskap.textContent = r.tabSelskap || 'Selskap';
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
  // Formueskatt (skatt.html)
  autoRecalc('formue-personer','formue-res',calcFormue);
  // Reisefradrag — no dropdown, but we can wire inputs
  // Dokumentavgift (boliglan.html)
  autoRecalc('dok-type','dok-res',calcDok);
  // Auto-recalc on text input change
  function autoRecalcInput(ids,resId,fn){ids.forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('input',function(){var r=document.getElementById(resId);if(r&&!r.classList.contains('hidden'))fn();});});}
  autoRecalcInput(['dok-verdi'],'dok-res',calcDok);
  autoRecalcInput(['formue-primaer','formue-sekundaer','formue-fritid','formue-naering','formue-aksjer','formue-driftsmidler','formue-bank','formue-gjeld'],'formue-res',calcFormue);
  autoRecalcInput(['reise-km','reise-dager','reise-bom'],'reise-res',calcReise);
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
  window.scrollTo({top:0,behavior:'smooth'});
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
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
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
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  }
}
function openLawCard(cardId,searchText){
  var card=document.getElementById(cardId);if(!card)return;
  // Open parent law-group if collapsed
  var group=card.closest('.law-group');
  if(group&&!group.classList.contains('open'))toggleLawGroup(group);
  // Open the card itself
  setTimeout(function(){
    if(card.classList.contains('collapsed'))card.classList.remove('collapsed');
    setTimeout(function(){
      if(searchText){
        // Find the specific paragraph text inside the card
        var rows=card.querySelectorAll('.ir .k, .ir');
        var target=null;
        rows.forEach(function(r){if(r.textContent.indexOf(searchText)>=0)target=r;});
        if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.style.background='color-mix(in srgb,var(--accent) 15%,transparent)';setTimeout(function(){target.style.background='';},2000);return;}
      }
      card.scrollIntoView({behavior:'smooth',block:'start'});
    },200);
  },100);
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
  var body = card.querySelector('.law-body');
  if(!wasCollapsed){
    // Collapsing — pin scroll so header stays in place
    var hdr = card.querySelector('.card-hdr');
    var topBefore = (hdr||card).getBoundingClientRect().top;
    if(body) body.classList.remove('opening');
    card.classList.add('collapsed');
    var topAfter = (hdr||card).getBoundingClientRect().top;
    var drift = topAfter - topBefore;
    if(Math.abs(drift) > 2) window.scrollBy(0, drift);
  } else {
    // Opening — collapse other open cards in the same column first
    var parent=card.closest('.calc-grid > div, .calc-grid > .right-col');
    if(parent){
      parent.querySelectorAll('.info-card:not(.collapsed)').forEach(function(other){
        if(other===card||other.contains(card)||card.contains(other))return;
        other.classList.add('collapsed');
        var otherArrow=other.querySelector('.card-title span');
        if(otherArrow)otherArrow.textContent='▼';
      });
    }
    card.classList.remove('collapsed');
    if(body){
      body.classList.remove('opening');
      body.offsetHeight; // force reflow
      body.classList.add('opening');
    }
  }
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
    document.getElementById('sal-help-title').innerHTML = (r.salHelpTitle || 'Hjelp med kalkulatorene') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('sal-help-desc').textContent = r.salHelpDesc || 'Slik bruker du skattekalkulatorene';
    // Sub-help titles
    var _shss=document.getElementById('sal-help-sub-salary');if(_shss)_shss.innerHTML=(r.salTitle||'Lønn etter skatt')+' <span style="font-size:11px;opacity:.5">▼</span>';
    var _shsu=document.getElementById('sal-help-sub-uttak');if(_shsu)_shsu.innerHTML=(r.uttakHelpTitle||'Uttakskalkulator')+' <span style="font-size:11px;opacity:.5">▼</span>';
    var _shsd=document.getElementById('sal-help-sub-utdeling');if(_shsd)_shsd.innerHTML=(r.utdelingHelpTitle||'Effektiv skatt ved utdeling')+' <span style="font-size:11px;opacity:.5">▼</span>';
    // Sub-help rows
    var _uhr=document.getElementById('uttak-help-rows');if(_uhr&&r.uttakHelpRows)_uhr.innerHTML=infoRowsHTML(r.uttakHelpRows);
    var _udhr=document.getElementById('utdeling-help-rows');if(_udhr&&r.utdelingHelpRows)_udhr.innerHTML=infoRowsHTML(r.utdelingHelpRows);
    // Formue + reise sub-help titles
    var _shsf=document.getElementById('sal-help-sub-formue');if(_shsf)_shsf.innerHTML=(r.formueTitle||'Formueskatt')+' <span style="font-size:11px;opacity:.5">▼</span>';
    var _shsr=document.getElementById('sal-help-sub-reise');if(_shsr)_shsr.innerHTML=(r.reiseTitle||'Reisefradrag')+' <span style="font-size:11px;opacity:.5">▼</span>';
    // Formue + reise sub-help rows
    var _fhr=document.getElementById('formue-help-rows');if(_fhr)_fhr.innerHTML=infoRowsHTML(r.formueHelpRows||[['— SLIK BRUKER DU KALKULATOREN —','Beregn om du betaler formueskatt'],['Fyll inn verdier','Skriv inn markedsverdi for bolig, aksjer, bankinnskudd og gjeld. Kalkulatoren bruker verdsettelsesrabattene automatisk.'],['Verdsettelsesrabatter','Primærbolig: 25% (70% over 10M). Aksjer/fond: 80%. Bankinnskudd: 100%.'],['Bunnfradrag','1 900 000 kr per person (2026). Ektefeller får dobbelt.'],['— GODT Å VITE —',''],['Mange betaler ikke','Med typisk boliglån og primærbolig betaler de fleste null i formueskatt.'],['Gjeld reduseres','Gjeldsfradraget justeres proporsjonalt med verdsettelsesrabattene.']]);
    var _rhr=document.getElementById('reise-help-rows');if(_rhr)_rhr.innerHTML=infoRowsHTML(r.reiseHelpRows||[['— SLIK BRUKER DU KALKULATOREN —','Beregn pendlerfradrag for arbeidsreise'],['Avstand','Skriv inn avstand én vei i km. Kalkulatoren dobler automatisk for tur-retur.'],['Arbeidsdager','Standard er 230 dager. Juster for deltid eller fravær.'],['Bompenger/ferge','Faktiske utgifter per arbeidsdag legges til reisekostnaden.'],['— GODT Å VITE —',''],['Bunnfradrag','Du må ha mer enn 12 000 kr i reisekostnader for å få fradrag (2026).'],['Maks fradrag','Øvre grense er 120 000 kr per år (2026).'],['Skattebesparelse','Fradraget gir 22% tilbake — det er besparelsen du ser i resultatet.']]);
  } else {
    salHelpCard.classList.add('hidden');
  }
  // Formueskatt labels
  var _fmT=document.getElementById('formue-title');
  if(_fmT){
    _fmT.innerHTML=(r.formueTitle||'Formueskatt')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('formue-desc',r.formueDesc||'Beregn formueskatt med verdsettelsesrabatter');
    setText('formue-l-primaer',r.formueLPrimaer||'Primærbolig (markedsverdi)');
    setText('formue-l-sekundaer',r.formueLSekundaer||'Sekundærbolig (markedsverdi)');
    setText('formue-l-aksjer',r.formueLAksjer||'Aksjer og fond');
    setText('formue-l-bank',r.formueLBank||'Bankinnskudd');
    setText('formue-l-gjeld',r.formueLGjeld||'Total gjeld');
    setText('formue-l-personer',r.formueLPersoner||'Skattesubjekt');
    setText('formue-opt-en',r.formueOptEn||'Enslig (1 × bunnfradrag)');
    setText('formue-opt-to',r.formueOptTo||'Ektefeller (2 × bunnfradrag)');
    setText('btn-calc-formue',r.formueBtnCalc||'Beregn formueskatt →');
    setText('formue-r-lbl',r.formueRLbl||'Formueskatt');
    setText('formue-rl-brutto',r.formueRlBrutto||'Brutto skattemessig formue');
    setText('formue-rl-gjeld',r.formueRlGjeld||'Gjeldsfradrag (justert)');
    setText('formue-rl-netto',r.formueRlNetto||'Netto formue');
    setText('formue-rl-bunnfradrag',r.formueRlBunnfradrag||'Bunnfradrag');
    setText('formue-rl-skattepliktig',r.formueRlSkattepliktig||'Skattepliktig formue');
    setText('formue-rl-effsats',r.formueRlEffsats||'Effektiv skattesats');
  }
  // Reisefradrag labels
  var _reT=document.getElementById('reise-title');
  if(_reT){
    _reT.innerHTML=(r.reiseTitle||'Reisefradrag')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('reise-desc',r.reiseDesc||'Beregn pendlerfradrag for reise mellom hjem og jobb');
    setText('reise-l-km',r.reiseLKm||'Avstand hjem–jobb (km, én vei)');
    setText('reise-l-dager',r.reiseLDager||'Arbeidsdager per år');
    setText('reise-l-bom',r.reiseLBom||'Bompenger / ferge per dag (kr)');
    setText('btn-calc-reise',r.reiseBtnCalc||'Beregn reisefradrag →');
    setText('reise-r-lbl',r.reiseRLbl||'Årlig reisefradrag');
    setText('reise-rl-brutto',r.reiseRlBrutto||'Brutto reisekostnad');
    setText('reise-rl-bunnfradrag',r.reiseRlBunnfradrag||'Bunnfradrag');
    setText('reise-rl-besparelse',r.reiseRlBesparelse||'Skattebesparelse (22 %)');
    setText('reise-rl-permnd',r.reiseRlPermnd||'Per måned');
  }
  // Sjekkliste labels
  var _sjT=document.getElementById('sjekk-title');
  if(_sjT){
    _sjT.innerHTML=(r.sjekkTitle||'Skattemelding-sjekkliste')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('sjekk-desc',r.sjekkDesc||'Har du glemt noe? Sjekk vanlige fradrag du kan ha krav på.');
    for(var qi=1;qi<=8;qi++)setText('sjekk-q'+qi,(r['sjekkQ'+qi])||(document.getElementById('sjekk-q'+qi)||{}).textContent||'');
    setText('sjekk-summary-lbl',r.sjekkSummaryLbl||'Estimert potensiell besparelse');
    setText('sjekk-note',r.sjekkNote||'Estimatene er veiledende.');
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
  var _sit=document.getElementById('sal-info-title');if(_sit)_sit.innerHTML=(r.salInfoTitle||'Skattereferanse')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('sal-info-desc', r.salInfoDesc || 'Current rates for selected region');
  const sc = document.getElementById('s-c'); sc.innerHTML = (r.salClasses||[]).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  const sr = document.getElementById('s-r'); sr.innerHTML = (r.salRegions||[]).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  document.getElementById('sal-info-rows').innerHTML = infoRowsHTML(r.salInfoRows||[]);
  const lawHint = '<div style="padding:10px 22px 6px;font-size:11.5px;font-style:italic;color:var(--ink3);opacity:.7">'+(r.lawHintText||'Vanskelig begrep? Se dropdown «Viktige regler og begreper forklart» over Skatteloven')+'</div>';
  // Show/hide Skatteloven group wrapper
  const salLawGroup = document.getElementById('sal-law-group');
  if(r.salLawRows || r.salSubjRows){
    salLawGroup.classList.remove('hidden');
    var _slgt=document.getElementById('sal-law-group-title');if(_slgt)_slgt.innerHTML=(r.salLawGroupTitle||'Skatteloven')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('sal-law-group-desc', 'Kapitler og paragrafer fra skatteloven');
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
    document.getElementById('sal-key-title').innerHTML = (r.salKeyTitle || 'Viktige regler og begreper forklart') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('sal-key-desc', 'Sentrale skatteregler og begreper forklart');
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
    document.getElementById('mor-help-title').innerHTML = (r.morHelpTitle || 'Hjelp med kalkulatoren') + ' <span style="font-size:11px;opacity:.5">▼</span>';
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
  // Dokumentavgift labels
  var _dokT=document.getElementById('dok-title');
  if(_dokT){
    _dokT.innerHTML=(r.dokTitle||'Dokumentavgift')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('dok-desc',r.dokDesc||'2,5 % av markedsverdi ved tinglysing av eiendomsoverdragelse');
    setText('dok-l-verdi',r.dokLVerdi||'Markedsverdi (kr)');
    setText('dok-l-type',r.dokLType||'Type eiendom');
    setText('dok-opt-bolig',r.dokOptBolig||'Selveier (bolig/fritid)');
    setText('dok-opt-borettslag',r.dokOptBorettslag||'Borettslag (kun andel)');
    setText('btn-calc-dok',r.dokBtnCalc||'Beregn dokumentavgift →');
    setText('dok-r-lbl',r.dokRLbl||'Totale tinglysningskostnader');
    setText('dok-rl-avgift',r.dokRlAvgift||'Dokumentavgift (2,5 %)');
    setText('dok-rl-tinglyse',r.dokRlTinglyse||'Tinglysingsgebyr');
    setText('dok-rl-attestgebyr',r.dokRlAttestgebyr||'Attestgebyr');
  }
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
  setText('bil-l-forsikring-type', r.bilLForsikringType || 'Insurance type');
  repopulateSelect('bil-forsikring-type',
    [r.bilOptFullkasko || 'Comprehensive (Fullkasko)', r.bilOptDelkasko || 'Partial (Delkasko)', r.bilOptAnsvar || 'Liability only (Ansvar)'],
    ['fullkasko', 'delkasko', 'ansvar']
  );
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
  bilRepopulateMerke(r);
  repopulateSelect('bil-drivstoff', r.bilFuelOpts || ['Bensin','Diesel','Elbil'], ['bensin','diesel','elbil']);
  setText('bil-mode-plan-label', r.bilModePlan || 'Bil jeg vurderer å kjøpe');
  setText('bil-mode-own-label', r.bilModeOwn || 'Bil jeg allerede eier');
  var resaleEl=document.getElementById('bil-l-resale');if(resaleEl){var rt=r.bilLResale||'Forventet salgsverdi / Finn-pris (kr)';resaleEl.innerHTML=rt.replace('Finn','<a href="https://www.finn.no/car/used/search.html" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline;">Finn</a>');}
  setText('bil-disclaimer', r.bilDisclaimer || '* Rough estimate. Actual costs vary with driving pattern, location, insurance terms and vehicle condition.');
  // Lønn etter skatt labels
  var lonnEl=document.getElementById('lonn-title');if(lonnEl)lonnEl.innerHTML=(r.lonnTitle||'Lønn etter skatt')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('lonn-desc',r.lonnDesc||'Legg inn timelønn og timer per uke — se hva du faktisk får utbetalt');
  setText('lonn-intro',r.lonnIntro||'Jobber du deltid ved siden av skole eller studier? Legg inn timelønnen din og hvor mange timer du jobber i uka — så ser du bruttolønn, skattetrekk, feriepenger og hva du faktisk får utbetalt. Basert på norske skatteregler for 2026.');
  setText('lonn-l-timelonn',r.lonnLTimelonn||'Timelønn (kr)');
  setText('lonn-l-timer',r.lonnLTimer||'Timer per uke');
  setText('lonn-l-uker',r.lonnLUker||'Arbeidsuker per år');
  setText('lonn-l-alder',r.lonnLAlder||'Alder');
  var lonnAlderSel=document.getElementById('lonn-alder');if(lonnAlderSel){lonnAlderSel.options[0].text=r.lonnOptUnder18||'Under 18 år';lonnAlderSel.options[1].text=r.lonnOpt18plus||'18 år eller eldre';}
  setText('lonn-frikort-hint',r.lonnFrikortHint||'Frikortgrensen for 2026 er 100 000 kr. Tjener du under dette, trekkes ingen skatt.');
  setText('btn-calc-lonn',r.lonnBtnCalc||'Beregn lønn →');
  setText('lonn-r-lbl',r.lonnRLbl||'Utbetalt per måned');
  setText('lonn-rl-brutto-aar',r.lonnRlBruttoAar||'Bruttolønn per år');
  setText('lonn-rl-brutto-mnd',r.lonnRlBruttoMnd||'Bruttolønn per måned');
  setText('lonn-rl-skatt',r.lonnRlSkatt||'Skattetrekk per år');
  setText('lonn-rl-skatt-mnd',r.lonnRlSkattMnd||'Skattetrekk per måned');
  setText('lonn-rl-effektiv',r.lonnRlEffektiv||'Effektiv skattesats');
  setText('lonn-rl-feriepenger',r.lonnRlFeriepenger||'Feriepenger (10,2 %)');
  setText('lonn-rl-netto-aar',r.lonnRlNettoAar||'Netto årslønn (etter skatt)');
  setText('lonn-rl-netto-time',r.lonnRlNettoTime||'Netto per time');
  setText('lonn-disclaimer',r.lonnDisclaimer||'* Forenklet estimat. Faktisk skattetrekk avhenger av skattekortet ditt (tabelltrekk). Feriepenger utbetales normalt i juni året etter.');
  // Lønn howto
  var lonnHowtoEl=document.getElementById('lonn-howto-title');if(lonnHowtoEl)lonnHowtoEl.innerHTML=(r.lonnHowtoTitle||'Slik bruker du Lønnskalkulatoren')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('lonn-howto-desc',r.lonnHowtoDesc||'Steg-for-steg guide for VGS-elever og studenter');
  var lonnHowtoC=document.getElementById('lonn-howto-rows');
  if(lonnHowtoC){var lonnHR=r.lonnHowtoRows||[['— SLIK BRUKER DU KALKULATOREN —','Beregn hva du faktisk får utbetalt fra deltidsjobben'],['1. Timelønn','Skriv inn timelønnen din. Minstelønn finnes ikke i Norge, men tariff er typisk 160–220 kr for unge.'],['2. Timer per uke','Hvor mange timer jobber du i en typisk uke? Deltid ved siden av skole er gjerne 10–20 timer.'],['3. Arbeidsuker per år','Standard er 47 uker (52 minus 5 uker ferie). Jobber du kun i ferier, skriv inn antall uker.'],['4. Alder','Under 18 betaler du ingen trygdeavgift. Over 18 trekkes 7,6 % trygdeavgift.'],['— SLIK LESER DU RESULTATENE —',''],['Frikort (70 000 kr)','Tjener du under 70 000 kr i året, trekkes ingen skatt. Du trenger kun frikort (bestilles på skatteetaten.no).'],['Bruttolønn','Det du tjener FØR skatt. Timelønn × timer × uker.'],['Skattetrekk','Det staten trekker i skatt. Beregnes fra trinnskatt, alminnelig inntektsskatt og trygdeavgift.'],['Feriepenger','Arbeidsgiver setter av 10,2 % av lønnen din til feriepenger. Utbetales normalt i juni året etter.'],['Netto','Det du faktisk får inn på konto hver måned — etter at skatten er trukket.'],['— GODT Å VITE —',''],['Skattekort','Bestill skattekort på skatteetaten.no. Uten skattekort trekkes 50 % skatt!'],['Selvangivelse','Selv om du ikke betaler skatt, må du sjekke skattemeldingen i april.'],['Feriepenger ≠ ekstra lønn','Feriepenger erstatter lønnen i ferien — du får dem utbetalt når du tar ferie.']];lonnHowtoC.innerHTML=lonnHR.map(function(row){return '<div class="law-item" style="padding:10px 24px;border-bottom:1px solid var(--border);"><div style="font-weight:600;font-size:13px;color:var(--ink);">'+row[0]+'</div>'+(row[1]?'<div style="font-size:12px;color:var(--ink2);margin-top:4px;line-height:1.6;">'+row[1]+'</div>':'')+'</div>';}).join('');}
  // Abonnement labels
  var aboEl=document.getElementById('abo-title');if(aboEl)aboEl.innerHTML=(r.aboTitle||'Abonnement')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('abo-desc',r.aboDesc||'Se totalkostnaden for alle abonnementene dine — per måned og per år');
  setText('abo-intro',r.aboIntro||'Mange undervurderer hvor mye de betaler i abonnementer. Legg inn alle tjenestene dine — streaming, trening, mobil, sky-lagring, osv. — og se den faktiske totalkostnaden. Overraskelseseffekten er stor.');
  setText('abo-l-hdr',r.aboLHdr||'Dine abonnementer');
  setText('abo-col-name',r.aboColName||'Tjeneste');
  setText('abo-col-amount',r.aboColAmount||'Pris (kr/mnd)');
  setText('abo-btn-add','+ '+(r.aboBtnAdd||'Legg til'));
  setText('btn-calc-abo',r.aboBtnCalc||'Beregn totalkostnad →');
  setText('abo-r-lbl',r.aboRLbl||'Total abonnementskostnad');
  setText('abo-rl-aar',r.aboRlAar||'Per år');
  setText('abo-rl-antall',r.aboRlAntall||'Antall abonnementer');
  setText('abo-rl-snitt',r.aboRlSnitt||'Snitt per abonnement');
  setText('abo-rl-daglig',r.aboRlDaglig||'Per dag');
  setText('abo-disclaimer',r.aboDisclaimer||'* Kun en oversikt. Faktiske priser kan variere med kampanjer, familieabonnementer og prisendringer.');
  // Abo howto
  var aboHowtoEl=document.getElementById('abo-howto-title');if(aboHowtoEl)aboHowtoEl.innerHTML=(r.aboHowtoTitle||'Slik bruker du Abonnementskalkulatoren')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('abo-howto-desc',r.aboHowtoDesc||'Få full oversikt over abonnementskostnadene dine');
  var aboHowtoC=document.getElementById('abo-howto-rows');
  if(aboHowtoC){var aboHR=r.aboHowtoRows||[['— SLIK BRUKER DU KALKULATOREN —','Få oversikt over hva du betaler i abonnementer'],['1. Legg inn abonnementene dine','Velg fra listen eller skriv inn egne. Prisene fylles inn automatisk med typiske norske priser, men du kan justere.'],['2. Trykk Beregn','Du ser totalkostnad per måned, per år og per dag — pluss en perspektiv-boks som setter beløpet i sammenheng.'],['3. Vurder hvert abonnement','Bruker du egentlig alle tjenestene? Mange betaler for ting de sjelden bruker.'],['— GODT Å VITE —',''],['Subscription creep','Små beløp som 99 kr/mnd føles ufarlige, men 10 slike abonnementer er nesten 12 000 kr i året.'],['Del der du kan','Familie- og venneabonnementer er ofte mye billigere per person. Spotify Family, Netflix Standard osv.'],['Rydd opp regelmessig','Sett en påminnelse hver 3. måned: Gå gjennom kontoutskriften og se etter abonnementer du har glemt.']];aboHowtoC.innerHTML=aboHR.map(function(row){return '<div class="law-item" style="padding:10px 24px;border-bottom:1px solid var(--border);"><div style="font-weight:600;font-size:13px;color:var(--ink);">'+row[0]+'</div>'+(row[1]?'<div style="font-size:12px;color:var(--ink2);margin-top:4px;line-height:1.6;">'+row[1]+'</div>':'')+'</div>';}).join('');}
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
  // Update dropdown options for existing rows on language change
  document.querySelectorAll('#budsjett-income-rows .budsjett-cat').forEach(function(sel){
    var o;
    o=sel.querySelector('option[value="Lønn (netto)"]');if(o)o.textContent=r.budOptLonn||'Lønn (netto)';
    o=sel.querySelector('option[value="Ekstrajobb/freelance"]');if(o)o.textContent=r.budOptEkstra||'Ekstrajobb/freelance';
    o=sel.querySelector('option[value="Stipend"]');if(o)o.textContent=r.budOptStipend||'Stipend';
    o=sel.querySelector('option[value="Kapitalinntekter"]');if(o)o.textContent=r.budOptKapital||'Kapitalinntekter';
    o=sel.querySelector('option[value="NAV-ytelser"]');if(o)o.textContent=r.budOptNav||'NAV-ytelser';
    o=sel.querySelector('option[value="__custom__"]');if(o)o.textContent=r.budOptCustom||'Valgfritt...';
  });
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
  // Update expense category dropdowns
  document.querySelectorAll('#budsjett-expense-rows .budsjett-cat').forEach(function(sel){
    var o=sel.querySelector('option[value="Husleie"]');if(o)o.textContent=r.budOptHusleie||'Husleie';
    o=sel.querySelector('option[value="Mat og dagligvarer"]');if(o)o.textContent=r.budOptMat||'Mat og dagligvarer';
    o=sel.querySelector('option[value="Transport"]');if(o)o.textContent=r.budOptTransport||'Transport';
    o=sel.querySelector('option[value="Strøm"]');if(o)o.textContent=r.budOptStrom||'Strøm';
    o=sel.querySelector('option[value="Forsikring"]');if(o)o.textContent=r.budOptForsikring||'Forsikring';
    o=sel.querySelector('option[value="Mobil/Internett"]');if(o)o.textContent=r.budOptMobil||'Mobil/Internett';
    o=sel.querySelector('option[value="Studielån (nedbetaling)"]');if(o)o.textContent=r.budOptStudielan||'Studielån (nedbetaling)';
    o=sel.querySelector('option[value="Boliglån (terminbeløp)"]');if(o)o.textContent=r.budOptTermin||'Boliglån (terminbeløp)';
    o=sel.querySelector('option[value="Trening"]');if(o)o.textContent=r.budOptTrening||'Trening';
    o=sel.querySelector('option[value="Streaming/Abonnement"]');if(o)o.textContent=r.budOptStreaming||'Streaming/Abonnement';
    o=sel.querySelector('option[value="Klær og personlig"]');if(o)o.textContent=r.budOptKlaer||'Klær og personlig';
    o=sel.querySelector('option[value="Sparing/BSU"]');if(o)o.textContent=r.budOptSparing||'Sparing/BSU';
    o=sel.querySelector('option[value="__custom__"]');if(o)o.textContent=r.budOptCustom||'Valgfritt...';
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
  // NPV panel labels (kalkulator.html)
  setText('bc-npv-label', r.npvTitle || 'Lønnsomhetsanalyse (NPV/IRR)');
  setText('bc-npv-intro', r.npvDesc || 'Netto nåverdi og internrente for investeringsprosjekter.');
  setText('lbl-npv-calc', r.lblNpvCalc || 'Lønnsomhetsanalyse (NPV/IRR)');
  // Sparekalkulator labels
  var spareEl=document.getElementById('spare-title');if(spareEl)spareEl.innerHTML=(r.spareTitle||'Sparekalkulator')+' <span style="font-size:11px;opacity:.5">▼</span>';
  setText('spare-desc',r.spareDesc||'Se kraften i rentes rente — hvor mye du sparer vs. hva renten genererer');
  setText('spare-intro',r.spareIntro||'Legg inn startbeløp, månedlig sparing, forventet avkastning og antall år. Grafen viser tydelig forskjellen mellom det du faktisk sparte og det renten genererte — rentes rente-effekten.');
  setText('spare-l-start',r.spareLStart||'Startbeløp (kr)');
  setText('spare-l-monthly',r.spareLMonthly||'Månedlig sparing (kr)');
  setText('spare-l-rate',r.spareLRate||'Forventet årlig avkastning (%)');
  setText('spare-l-years',r.spareLYears||'Antall år');
  setText('btn-calc-spare',r.spareBtnCalc||'Beregn sparing →');
  setText('spare-r-lbl',r.spareRLbl||'Total verdi etter sparing');
  setText('spare-rl-innskudd',r.spareRlInnskudd||'Totalt innskudd');
  setText('spare-rl-rente',r.spareRlRente||'Opptjent rente');
  setText('spare-rl-renteandel',r.spareRlRenteandel||'Renteandel av total');
  setText('spare-rl-effektiv',r.spareRlEffektiv||'Effektiv månedlig avkastning');
  setText('spare-th-year',r.spareThYear||'År');
  setText('spare-th-innskudd',r.spareThInnskudd||'Innskudd');
  setText('spare-th-rente',r.spareThRente||'Rente');
  setText('spare-th-total',r.spareThTotal||'Total');
  // Spare howto card
  var spareHowtoCard=document.getElementById('spare-howto-card');
  if(spareHowtoCard){
    document.getElementById('spare-howto-title').innerHTML=(r.spareHowtoTitle||'Slik bruker du Sparekalkulatoren')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('spare-howto-desc',r.spareHowtoDesc||'Steg-for-steg guide til sparing og rentes rente');
    if(r.spareHowtoRows){document.getElementById('spare-howto-rows').innerHTML=infoRowsHTML(r.spareHowtoRows);spareHowtoCard.classList.remove('hidden');}
    else{spareHowtoCard.classList.add('hidden');}
  }
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
  // Studielån howto card
  const studieHowtoCard = document.getElementById('studie-howto-card');
  if(studieHowtoCard) {
    document.getElementById('studie-howto-title').innerHTML = (r.studieHowtoTitle || 'Slik bruker du Studielånkalkulatoren') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('studie-howto-desc', r.studieHowtoDesc || 'Steg-for-steg guide til studielån');
    if(r.studieHowtoRows){document.getElementById('studie-howto-rows').innerHTML=infoRowsHTML(r.studieHowtoRows);studieHowtoCard.classList.remove('hidden');}
    else{studieHowtoCard.classList.add('hidden');}
  }
  // Studielån labels
  var _stT=document.getElementById('studie-title');
  if(_stT){
    _stT.innerHTML=(r.studieTitle||'Studielån')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('studie-desc',r.studieDesc||'Stipend vs. lån, nedbetalingsplan og månedskostnad fra Lånekassen');
    setText('studie-intro',r.studieIntro||'Beregn hva studielånet ditt faktisk koster. Se hvor mye som blir stipend, hva du må betale tilbake, og hva månedskostnaden blir med ulike renter. Basert på Lånekassens satser for 2025–2026.');
    setText('studie-l-varighet',r.studieLVarighet||'Studievarighet (år)');
    setText('studie-l-grad',r.studieLGrad||'Fullfører du en grad?');
    setText('studie-l-basis',r.studieLBasis||'Basisstøtte per måned (kr)');
    setText('studie-l-mnd',r.studieLMnd||'Utbetalingsmåneder per år');
    setText('studie-l-totalstotte',r.studieLTotalstotte||'Total basisstøtte');
    setText('studie-l-laandel',r.studieLLaandel||'Gjenstående lån');
    setText('studie-extra-hdr',r.studieExtraHdr||'Tillegg (skolepenger, tilleggslån o.l.) ▾');
    setText('studie-l-skolepenger',r.studieLSkolepenger||'Lån til skolepenger (kr/år)');
    setText('studie-l-tilleggslan',r.studieLTilleggslan||'Tilleggslån, 30+ (kr/år)');
    setText('studie-sec-nedbetaling',r.studieSecNedbetaling||'Nedbetalingsvilkår');
    setText('studie-l-rente',r.studieLRente||'Rente (%)');
    setText('studie-l-nedbtid',r.studieLNedbtid||'Nedbetalingstid (år)');
    setText('btn-calc-studie',r.studieBtnCalc||'Beregn studielån →');
    setText('studie-r-lbl',r.studieRLbl||'Månedlig nedbetaling');
    setText('studie-rl-totalstotte',r.studieRlTotalstotte||'Total basisstøtte');
    setText('studie-rl-stipend',r.studieRlStipend||'Omgjort til stipend');
    setText('studie-rl-ekstralan',r.studieRlEkstralan||'Tillegg (skolepenger + tilleggslån)');
    setText('studie-rl-gjeld',r.studieRlGjeld||'Gjeld ved studieslutt');
    setText('studie-rl-rente',r.studieRlRente||'Rente');
    setText('studie-rl-tid',r.studieRlTid||'Nedbetalingstid');
    setText('studie-rl-totbetalt',r.studieRlTotbetalt||'Totalt tilbakebetalt');
    setText('studie-rl-totrente',r.studieRlTotrente||'Herav renter');
    setText('studie-rl-skattefradrag',r.studieRlSkattefradrag||'Skattefradrag på renter (22 %)');
    setText('studie-rl-reellkost',r.studieRlReellkost||'Reell kostnad etter skattefradrag');
    setText('studie-sec-rentesamm',r.studieSecRentesamm||'Månedskostnad ved ulike renter');
    setText('studie-th-rente',r.studieThRente||'Rente');
    setText('studie-th-mndbet',r.studieThMndbet||'Mnd. betaling');
    setText('studie-th-totrente',r.studieThTotrente||'Total rente');
    setText('studie-th-totbetalt',r.studieThTotbetalt||'Totalt betalt');
    setText('studie-sec-nedplan',r.studieSecNedplan||'Nedbetalingsplan (år for år)');
    setText('studie-th-aar',r.studieThAar||'År');
    setText('studie-th-betaling',r.studieThBetaling||'Betaling');
    setText('studie-th-renter',r.studieThRenter||'Renter');
    setText('studie-th-avdrag',r.studieThAvdrag||'Avdrag');
    setText('studie-th-restgjeld',r.studieThRestgjeld||'Restgjeld');
    setText('studie-disclaimer',r.studieDisclaimer||'* Basert på Lånekassens satser 2025–2026. Faktisk stipendandel avhenger av beståtte studiepoeng og inntekt/formue. Annuitetslån med termingebyr 18 kr (0 kr med eFaktura).');
    studieUpdateTotal();
  }
  // NPV Howto card
  const npvHowtoCard = document.getElementById('npv-howto-card');
  if(npvHowtoCard) {
    document.getElementById('npv-howto-title').innerHTML = (r.npvHowtoTitle || 'How to use the calculator') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('npv-howto-desc', r.npvHowtoDesc || 'Step-by-step guide to NPV and IRR');
    if(r.npvHowtoRows){document.getElementById('npv-howto-rows').innerHTML=infoRowsHTML(r.npvHowtoRows);npvHowtoCard.classList.remove('hidden');}
    else{npvHowtoCard.classList.add('hidden');}
  }
  // Foreldrepenger labels
  var _fpT=document.getElementById('fp-title');
  if(_fpT){
    _fpT.innerHTML=(r.fpTitle||'Foreldrepenger')+' <span style="font-size:11px;opacity:.5">▼</span>';
    setText('fp-desc',r.fpDesc||'Beregn foreldrepenger — 100 % vs. 80 %, fordeling mor/far');
    setText('fp-l-inntekt',r.fpLInntekt||'Årsinntekt (kr)');
    setText('fp-l-dekning',r.fpLDekning||'Dekningsgrad');
    setText('fp-opt-100',r.fpOpt100||'100 % — 49 uker');
    setText('fp-opt-80',r.fpOpt80||'80 % — 59 uker');
    setText('btn-calc-fp',r.fpBtnCalc||'Beregn foreldrepenger →');
    setText('fp-r-lbl',r.fpRLbl||'Månedlig utbetaling');
    setText('fp-rl-total',r.fpRlTotal||'Total utbetaling');
    setText('fp-rl-dagsats',r.fpRlDagsats||'Dagsats');
    setText('fp-rl-grunnlag',r.fpRlGrunnlag||'Beregningsgrunnlag');
    setText('fp-rl-uker',r.fpRlUker||'Totalt antall uker');
    setText('fp-rl-mor',r.fpRlMor||'Mødrekvote');
    setText('fp-rl-far',r.fpRlFar||'Fedrekvote');
    setText('fp-rl-felles',r.fpRlFelles||'Fellesperiode');
    setText('fp-rl-forfoedsel',r.fpRlForfoedsel||'Før fødsel');
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
    document.getElementById('vat-help-title').innerHTML = (r.vatHelpTitle || 'Hjelp med kalkulatorene') + ' <span style="font-size:11px;opacity:.5">▼</span>';
    document.getElementById('vat-help-desc').textContent = r.vatHelpDesc || 'Slik bruker du avgiftskalkulatorene';
    // Sub-help titles
    var _vhsm=document.getElementById('vat-help-sub-mva');if(_vhsm)_vhsm.innerHTML=(r.vatTitle||'MVA-kalkulator')+' <span style="font-size:11px;opacity:.5">▼</span>';
    var _vhsa=document.getElementById('vat-help-sub-adj');if(_vhsa)_vhsa.innerHTML=(r.adjTitle||'Justeringskalkulator')+' <span style="font-size:11px;opacity:.5">▼</span>';
    // Sub-help rows
    var _ahr=document.getElementById('adj-help-rows');if(_ahr&&r.adjHelpRows)_ahr.innerHTML=infoRowsHTML(r.adjHelpRows,'mval');
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
  repopulateSelect('aga-zone', r.agaZoneOpts, ['0.141','0.106','0.064','0.079','0.051','0']);
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
        window.scrollTo({top:window.pageYOffset+rect.top-off,behavior:'smooth'});
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
  el('dash-t-selskap', r.tabSelskap || 'Selskap');
  el('dash-t-npv', r.tabNpv || 'Personlig økonomi');
  el('dash-t-basic-d', r.dashDescBasic || 'Enkel, valuta, finansiell, vitenskapelig og fagkalkulatorer');
  el('dash-t-sal-d', r.dashDescSal || 'Utregning av skatt, begreper og skatteloven');
  el('dash-t-mor-d', r.dashDescMor || 'Boliglånskalkulator, krav til boliglån, kostnader og BSU');
  el('dash-t-selskap-d', r.dashDescSelskap || 'Aksjeselskap, kommandittselskap og selskapsrett');
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
  const pf = 114540; // Personfradrag 2026 (skatteklasse 2 avskaffet fra 2018)
  const mf = Math.min(Math.max(b*0.46,0),95700); // Minstefradrag 2026: 46%, maks 95 700
  const renteFradrag = parseNum('s-deduct');
  // Nye fradrag — fagforening, IPS, gaver, reise (alle reduserer alminnelig inntekt)
  const fagforening = Math.min(parseNum('s-fagforening')||0, 8700);
  const ips = Math.min(parseNum('s-pensjon')||0, 25000);
  const gaver = Math.min(parseNum('s-gaver')||0, 25000);
  const reise = parseNum('s-reise')||0;
  const bsu = Math.min(parseNum('s-bsu')||0, 27500);
  const ekstraFradrag = fagforening + ips + gaver + reise;
  const almInntekt = Math.max(b - mf - pf - renteFradrag - ekstraFradrag, 0);
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
  const bsuKreditt = bsu * 0.10; // BSU: 10% direkte skattefradrag (ikke inntektsfradrag)
  const tot = Math.max(ts + soc - bsuKreditt, 0);
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
  // Andre fradrag-visning (fagforening + IPS + gaver + reise → 22%)
  var fradragCell = document.getElementById('s-fradrag-cell');
  if(fradragCell) {
    if(ekstraFradrag > 0) {
      document.getElementById('s-fradrag-val').textContent = '- ' + fmt(ekstraFradrag * almSats);
      fradragCell.classList.remove('hidden');
    } else {
      fradragCell.classList.add('hidden');
    }
  }
  // BSU-visning (10% direkte skattefradrag)
  var bsuCell = document.getElementById('s-bsu-cell');
  if(bsuCell) {
    if(bsu > 0) {
      document.getElementById('s-bsu-val').textContent = '- ' + fmt(bsuKreditt);
      bsuCell.classList.remove('hidden');
    } else {
      bsuCell.classList.add('hidden');
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
// SKATTEMELDING SJEKKLISTE
// ═══════════════════════════════════════════════════════
var SJEKK_DATA=[
  {id:'sjekk-c1',fradrag:15000,type:'fradrag'},// Pendler: ~15k avg reisefradrag
  {id:'sjekk-c2',fradrag:30000,type:'fradrag'},// Boliglån: ~30k rentefradrag
  {id:'sjekk-c3',fradrag:8700,type:'fradrag'},// Fagforening: max 8700 (2026)
  {id:'sjekk-c4',fradrag:2750,type:'skattefradrag'},// BSU: 10% av 27500 = 2750 direkte
  {id:'sjekk-c5',fradrag:15000,type:'fradrag'},// Barnehage: foreldrefradrag 15000 for 1 barn
  {id:'sjekk-c6',fradrag:5500,type:'fradrag'},// Gaver: max 25000 × 22%
  {id:'sjekk-c7',fradrag:0,type:'info'},// Aksjetap: varierer
  {id:'sjekk-c8',fradrag:0,type:'info'}// Utleie: varierer
];
function updateSjekkliste(){
  var r=R();var tips=r.sjekkTips||[
    'Reisefradrag: Gjelder reise mellom hjem og fast arbeidssted. Avstanden må typisk overstige 37 km tur-retur for at det skal lønne seg etter egenandelen på 14 400 kr. Bruk reisefradragskalkulatoren over.',
    'Rentefradrag: Du får 22 % av renteutgifter tilbake på skatten. Sjekk at alle lån (boliglån, studielån, billån) er med i skattemeldingen.',
    'Fagforening: Maks 8 700 kr i fradrag for 2026. Sjekk at beløpet er forhåndsutfylt korrekt.',
    'BSU: 10 % skattefradrag (maks 2 750 kr/år). Gjelder til og med året du fyller 33 år, og du kan ikke eie bolig per 31. desember.',
    'Foreldrefradrag: Inntil 15 000 kr for ett barn og 10 000 kr for hvert barn utover det. Gjelder dokumenterte utgifter til barnehage, SFO og dagmamma.',
    'Gavefradrag: Fradrag for gaver på minst 500 kr til den enkelte godkjente organisasjon, maks 25 000 kr/år totalt.',
    'Har du realisert tap på aksjer eller fond? Sjekk at tapet er kommet med i skattemeldingen. Tap gir fradrag med effektiv verdi 37,84 % (oppjustert).',
    'Utleie av egen bolig: Skattefritt dersom du selv bor i minst halvparten (etter utleieverdi). Korttidsutleie (under 30 dager per leieforhold): inntekt inntil 10 000 kr er skattefri, 85 % av overskytende er skattepliktig.'
  ];
  var totalBesparelse=0;var nChecked=0;
  SJEKK_DATA.forEach(function(q,i){
    var cb=document.getElementById(q.id);
    var tipEl=document.getElementById(q.id+'-tip');
    if(!cb)return;
    if(tipEl)tipEl.innerHTML=tips[i]||'';
    if(cb.checked){
      nChecked++;
      if(tipEl)tipEl.classList.remove('hidden');
      if(q.type==='fradrag')totalBesparelse+=Math.round(q.fradrag*0.22);
      else if(q.type==='skattefradrag')totalBesparelse+=q.fradrag;
    }else{
      if(tipEl)tipEl.classList.add('hidden');
    }
  });
  var summary=document.getElementById('sjekk-summary');
  if(summary){
    if(nChecked>0){summary.classList.remove('hidden');document.getElementById('sjekk-total').textContent=fmt(totalBesparelse)+' kr';}
    else summary.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════
// FORELDREPENGER CALCULATOR
// ═══════════════════════════════════════════════════════
function calcForeldrepenger(){
  var inntekt=parseNum('fp-inntekt');if(inntekt<=0)return;
  var G=130160;// Grunnbeløp (gjeldende fra 1. mai 2025)
  var maxGrunnlag=6*G;// 744 168
  var grunnlag=Math.min(inntekt,maxGrunnlag);
  var sel=document.getElementById('fp-dekning');
  var dekning=sel?+sel.value:100;
  var totalUker=dekning===100?49:59;
  var morKvote=dekning===100?15:19;
  var farKvote=dekning===100?15:19;
  var forFodsel=3;
  var felles=totalUker-morKvote-farKvote-forFodsel;
  var dekPct=dekning/100;
  var dagsats=Math.round(grunnlag/260*dekPct);
  var mndUtbetaling=Math.round(dagsats*21.67);
  var totalUtbetaling=Math.round(dagsats*totalUker*5);
  var r=R();
  document.getElementById('fp-r-val').textContent=fmt(mndUtbetaling);
  document.getElementById('fp-r-sub').textContent=dekning+'% '+( r.fpDekning||'dekning')+' · '+totalUker+' '+(r.fpUker||'uker');
  document.getElementById('fp-r-total').textContent=fmt(totalUtbetaling);
  document.getElementById('fp-r-dagsats').textContent=fmt(dagsats);
  document.getElementById('fp-r-grunnlag').textContent=fmt(grunnlag)+(inntekt>maxGrunnlag?' (6G max)':'');
  document.getElementById('fp-r-uker').textContent=totalUker+' '+(r.fpUker||'uker');
  document.getElementById('fp-r-mor').textContent=morKvote+' '+(r.fpUker||'uker');
  document.getElementById('fp-r-far').textContent=farKvote+' '+(r.fpUker||'uker');
  document.getElementById('fp-r-felles').textContent=felles+' '+(r.fpUker||'uker');
  document.getElementById('fp-r-forfoedsel').textContent=forFodsel+' '+(r.fpUker||'uker');
  var tip=document.getElementById('fp-tip');
  if(tip)tip.innerHTML=inntekt>maxGrunnlag?(r.fpTipMax||'Inntekt over 6G ('+fmt(maxGrunnlag)+' kr) dekkes ikke av NAV. Mange arbeidsgivere dekker mellomlegget.'):(r.fpTipGeneral||'Grunnbeløpet (G) justeres hvert år i mai. Foreldrepenger beregnes ut fra inntekt de siste 3 månedene eller siste 12 måneder — det som gir høyest grunnlag.');
  document.getElementById('fp-res').classList.remove('hidden');
  setTimeout(function(){scrollToEl(document.getElementById('fp-res'),'top');},80);
}

// ═══════════════════════════════════════════════════════
// FORMUESKATT CALCULATOR
// ═══════════════════════════════════════════════════════
function calcFormue(){
  var pri=parseNum('formue-primaer'),sek=parseNum('formue-sekundaer');
  var fritid=parseNum('formue-fritid'),naering=parseNum('formue-naering');
  var aksjer=parseNum('formue-aksjer'),driftsmidler=parseNum('formue-driftsmidler');
  var bank=parseNum('formue-bank');
  var gjeld=parseNum('formue-gjeld');
  var sel=document.getElementById('formue-personer');var personer=sel?+sel.value:1;
  // Verdsettelsesrabatter 2026 (Skatteetaten)
  var priU10=Math.min(pri,10000000),priO10=Math.max(pri-10000000,0);
  var priV=priU10*0.25+priO10*0.70;// Primærbolig: 25% under 10M, 70% over (§ 4-10(2))
  var sekV=sek*1.00;// Sekundærbolig: 100% (§ 4-10(3))
  var fritidV=fritid*0.30;// Fritidsbolig: maks 30% av markedsverdi (§ 4-10(6))
  var naeringV=naering*0.80;// Næringseiendom: 80% av utleieverdi (§ 4-10(7))
  var aksV=aksjer*0.80;// Aksjer/fond: 80% (§ 4-12)
  var driftV=driftsmidler*0.70;// Driftsmidler: 70% (§ 4-17)
  var bankV=bank*1.00;// Bank: 100%
  var bruttoFormue=priV+sekV+fritidV+naeringV+aksV+driftV+bankV;
  // Gjeldsreduksjon (§ 4-19): gjeld fordeles forholdsmessig på eiendeler,
  // reduseres for eiendeler med rabatt (aksjer 80%, driftsmidler 70%, næring 80%).
  // Primærbolig, sekundærbolig og bank reduseres IKKE.
  var markedTotal=pri+sek+fritid+naering+aksjer+driftsmidler+bank;
  if(markedTotal>0){
    var gjeldAks=gjeld*(aksjer/markedTotal);
    var gjeldDrift=gjeld*(driftsmidler/markedTotal);
    var gjeldNaer=gjeld*(naering/markedTotal);
    var gjeldRest=gjeld-gjeldAks-gjeldDrift-gjeldNaer;// Pri+sek+fritid+bank
    var gjeldJustert=gjeldRest+(gjeldAks*0.80)+(gjeldDrift*0.70)+(gjeldNaer*0.80);
  }else{var gjeldJustert=gjeld;}
  var nettoFormue=bruttoFormue-gjeldJustert;// Kan bli negativ
  // Bunnfradrag 2026: 1 900 000 kr per person
  var bunnfradrag=1900000*personer;
  var skattepliktig=Math.max(nettoFormue-bunnfradrag,0);
  // Skattesatser 2026: kommunal 0,35% + stat 0,65% = 1,0% opp til 21,5M
  // Over 21,5M: kommunal 0,35% + stat 0,75% = 1,1%
  var kommunal=skattepliktig*0.0035;
  var statGrense=(21500000-1900000)*personer;// Innslagspunkt trinn 2
  var statBase1=Math.min(skattepliktig,Math.max(statGrense,0));
  var statBase2=Math.max(skattepliktig-Math.max(statGrense,0),0);
  var stat=statBase1*0.0065+statBase2*0.0075;
  var totalSkatt=kommunal+stat;
  var effSats=markedTotal>0?(totalSkatt/markedTotal*100):0;
  // Effektiv sats med 2 desimaler
  var effSatsStr=(Math.round(effSats*100)/100).toFixed(2).replace('.',',')+' %';
  var r=R();
  document.getElementById('formue-r-val').textContent=skattepliktig<=0?(r.formueNoTax||'0 kr — ingen formueskatt'):fmt(Math.round(totalSkatt));
  document.getElementById('formue-r-sub').textContent=skattepliktig<=0?(r.formueUnderBunn||'Netto formue er under bunnfradraget'):((r.formueEffSatsLabel||'Effektiv sats')+': '+effSatsStr+' '+(r.formueOfMarked||'av markedsverdi'));
  document.getElementById('formue-r-brutto').textContent=fmt(Math.round(bruttoFormue));
  document.getElementById('formue-r-gjeld').textContent='− '+fmt(Math.round(gjeldJustert));
  document.getElementById('formue-r-netto').textContent=fmt(Math.round(nettoFormue));
  document.getElementById('formue-r-bunnfradrag').textContent='− '+fmt(bunnfradrag)+' ('+personer+'×'+fmt(1900000)+')';
  document.getElementById('formue-r-skattepliktig').textContent=fmt(Math.round(skattepliktig));
  document.getElementById('formue-r-effsats').textContent=effSatsStr;
  // Breakdown table
  var bd=document.getElementById('formue-breakdown');
  if(bd){
    var h='<div style="font-weight:700;margin-bottom:8px;">'+(r.formueRabattTitle||'Skattemessig verdsettelse')+'</div>';
    h+='<table style="width:100%;font-size:12px;border-collapse:collapse;"><thead><tr style="color:var(--ink3);font-size:11px;text-transform:uppercase;letter-spacing:.3px;"><th style="text-align:left;padding:4px 0;font-weight:600;">'+(r.formueColEiendel||'Eiendel')+'</th><th style="text-align:right;padding:4px 0;font-weight:600;">'+(r.formueColMarked||'Markedsverdi')+'</th><th style="text-align:right;padding:4px 0;font-weight:600;">'+(r.formueColSkatt||'Skatteverdi')+'</th></tr></thead><tbody>';
    function fRow(label,mv,sv){return '<tr style="border-top:1px solid var(--border);"><td style="padding:6px 0;">'+label+'</td><td style="text-align:right;color:var(--ink3);padding:6px 0;">'+fmt(mv)+'</td><td style="text-align:right;padding:6px 0;font-weight:600;">'+fmt(Math.round(sv))+'</td></tr>';}
    if(pri>0)h+=fRow(r.formuePrimaerShort||'Primærbolig',pri,priV);
    if(sek>0)h+=fRow(r.formueSekundaerShort||'Sekundærbolig',sek,sekV);
    if(fritid>0)h+=fRow(r.formueFritidShort||'Fritidsbolig',fritid,fritidV);
    if(naering>0)h+=fRow(r.formueNaeringShort||'Næringseiendom',naering,naeringV);
    if(aksjer>0)h+=fRow(r.formueAksjerShort||'Aksjer/fond',aksjer,aksV);
    if(driftsmidler>0)h+=fRow(r.formueDriftShort||'Driftsmidler',driftsmidler,driftV);
    if(bank>0)h+=fRow(r.formueBankShort||'Bank',bank,bankV);
    h+='</tbody></table>';
    // Info om når formueskatt inntrer
    if(skattepliktig<=0){
      var mangler=bunnfradrag-nettoFormue;
      h+='<div style="margin-top:10px;padding:8px 12px;background:color-mix(in srgb,var(--accent) 6%,transparent);border-radius:6px;font-size:11px;color:var(--ink2);line-height:1.5;">'+(r.formueThreshold||'Formueskatt inntrer når netto skattemessig formue overstiger')+' <b>'+fmt(bunnfradrag)+'</b>. '+(r.formueMargin||'Du har')+' <b>'+fmt(Math.round(mangler))+'</b> '+(r.formueMarginLeft||'i margin før formueskatt.')+'</div>';
    }
    bd.innerHTML=h;
  }
  var _fres=document.getElementById('formue-res');
  var wasHidden=_fres.classList.contains('hidden');
  _fres.classList.remove('hidden');
  if(wasHidden)setTimeout(function(){scrollToEl(_fres,'top');},80);
}

// ═══════════════════════════════════════════════════════
// REISEFRADRAG CALCULATOR
// ═══════════════════════════════════════════════════════
function calcReise(){
  var km=parseNum('reise-km');if(km<=0)return;
  var dager=parseNum('reise-dager')||230;
  var bom=parseNum('reise-bom');
  var satsPerKm=1.90;// Skatteetaten 2025/2026
  var nedreGrense=12000;// Egenandel
  var oevreGrense=120000;// Maks fradragsgrunnlag
  var reisekost=km*2*dager*satsPerKm;
  var bomTotal=bom*dager;
  var brutto=Math.min(reisekost+bomTotal,oevreGrense);// Tak på 120 000
  var fradrag=Math.max(brutto-nedreGrense,0);
  var besparelse=fradrag*0.22;
  var perMnd=besparelse/12;
  var r=R();
  document.getElementById('reise-r-val').textContent=fmt(Math.round(fradrag));
  document.getElementById('reise-r-sub').textContent=(r.reiseBesparelseLbl||'Skattebesparelse')+': '+fmt(Math.round(besparelse))+'/'+(r.yr||'år')+' · 1,90 kr/km · '+(r.reiseEgenandel||'egenandel')+' 12 000 kr';
  document.getElementById('reise-r-brutto').textContent=fmt(Math.round(brutto))+(reisekost+bomTotal>oevreGrense?' (tak '+fmt(oevreGrense)+')':'');
  document.getElementById('reise-r-bunnfradrag').textContent='− '+fmt(nedreGrense);
  document.getElementById('reise-r-besparelse').textContent=fmt(Math.round(besparelse));
  document.getElementById('reise-r-permnd').textContent=fmt(Math.round(perMnd));
  var _rres=document.getElementById('reise-res');
  var _rwh=_rres.classList.contains('hidden');
  _rres.classList.remove('hidden');
  if(_rwh)setTimeout(function(){scrollToEl(_rres,'top');},80);
}

// ═══════════════════════════════════════════════════════
// DOKUMENTAVGIFT CALCULATOR
// ═══════════════════════════════════════════════════════
function calcDok(){
  var verdi=parseNum('dok-verdi');if(verdi<=0)return;
  var type=document.getElementById('dok-type');var t=type?type.value:'bolig';
  var rate=0.025;// 2.5% standard
  var avgift=t==='borettslag'?0:verdi*rate;
  var tinglyse=545;// Fast gebyr 2026
  var attest=172;// Attestgebyr
  var total=avgift+tinglyse+attest;
  var r=R();
  document.getElementById('dok-r-val').textContent=fmt(total);
  document.getElementById('dok-r-sub').textContent=t==='borettslag'?(r.dokBorettslagSub||'Borettslag er fritatt for dokumentavgift'):(pct(rate*100)+' '+r.adjOfTotal+fmt(verdi));
  document.getElementById('dok-r-avgift').textContent=fmt(avgift);
  document.getElementById('dok-r-tinglyse').textContent=fmt(tinglyse);
  document.getElementById('dok-r-attestgebyr').textContent=fmt(attest);
  var tip=document.getElementById('dok-tip');
  if(tip)tip.innerHTML=t==='borettslag'?(r.dokTipBorettslag||'I borettslag eier du en andel, ikke eiendommen direkte. Dokumentavgift påløper ikke — du betaler kun tinglysingsgebyr og attestgebyr.'):(r.dokTipSelveier||'Dokumentavgift beregnes av eiendommens markedsverdi på tinglysingstidspunktet. Borettslag er fritatt. Nybygg fra utbygger kan ha lavere grunnlag (tomt alene).');
  var _dres=document.getElementById('dok-res');
  var _dwh=_dres.classList.contains('hidden');
  _dres.classList.remove('hidden');
  if(_dwh)setTimeout(function(){scrollToEl(_dres,'top');},80);
}

// ═══════════════════════════════════════════════════════
// CAR COST CALCULATOR
// ═══════════════════════════════════════════════════════
// Brand profiles: depreciation rate (annual % of remaining), service multiplier vs average
// Sources: NAF, OFV, Finn.no markedsdata, Autobransjens Leverandørforening (2024-2026)
// depr = årlig verditap som andel av gjenværende verdi (declining balance)
// service = multiplikator vs norsk gjennomsnitt (~9000 kr/år fossil, ~5000 kr/år elbil)
// cat = kategori for forsikringsestimat: 'budget'|'standard'|'premium'|'luxury'|'ev-budget'
var BIL_MERKER = {
  snitt:      {depr:0.15, service:1.00, cat:'standard',   label:'Gjennomsnitt'},
  // ── Japansk ──
  toyota:     {depr:0.12, service:0.80, cat:'standard',   label:'Toyota'},
  lexus:      {depr:0.12, service:1.15, cat:'premium',    label:'Lexus'},
  honda:      {depr:0.14, service:0.90, cat:'standard',   label:'Honda'},
  mazda:      {depr:0.13, service:0.85, cat:'standard',   label:'Mazda'},
  nissan:     {depr:0.14, service:0.95, cat:'standard',   label:'Nissan'},
  suzuki:     {depr:0.11, service:0.85, cat:'budget',     label:'Suzuki'},
  mitsubishi: {depr:0.16, service:1.00, cat:'standard',   label:'Mitsubishi'},
  subaru:     {depr:0.16, service:1.00, cat:'standard',   label:'Subaru'},
  // ── Koreansk ──
  hyundai:    {depr:0.14, service:0.85, cat:'standard',   label:'Hyundai'},
  kia:        {depr:0.14, service:0.85, cat:'standard',   label:'Kia'},
  // ── Tysk (standard) ──
  volkswagen: {depr:0.15, service:1.00, cat:'standard',   label:'Volkswagen'},
  skoda:      {depr:0.14, service:0.85, cat:'standard',   label:'Škoda'},
  cupra:      {depr:0.17, service:1.05, cat:'standard',   label:'CUPRA / SEAT'},
  // ── Tysk (premium) ──
  bmw:        {depr:0.18, service:1.35, cat:'premium',    label:'BMW'},
  mercedes:   {depr:0.19, service:1.40, cat:'premium',    label:'Mercedes-Benz'},
  audi:       {depr:0.18, service:1.30, cat:'premium',    label:'Audi'},
  porsche:    {depr:0.20, service:1.60, cat:'luxury',     label:'Porsche'},
  // ── Svensk ──
  volvo:      {depr:0.16, service:1.05, cat:'standard',   label:'Volvo'},
  polestar:   {depr:0.16, service:1.05, cat:'premium',    label:'Polestar'},
  // ── Fransk ──
  peugeot:    {depr:0.19, service:1.15, cat:'standard',   label:'Peugeot'},
  citroen:    {depr:0.18, service:1.10, cat:'standard',   label:'Citroën'},
  renault:    {depr:0.20, service:1.10, cat:'standard',   label:'Renault'},
  dacia:      {depr:0.21, service:0.80, cat:'budget',     label:'Dacia'},
  // ── Annet Europa ──
  fiat:       {depr:0.16, service:1.00, cat:'standard',   label:'Fiat'},
  ford:       {depr:0.18, service:1.10, cat:'standard',   label:'Ford'},
  landrover:  {depr:0.20, service:1.40, cat:'luxury',     label:'Land Rover'},
  // ── Elbil (kinesisk) ──
  tesla:      {depr:0.18, service:0.70, cat:'ev-budget',  label:'Tesla'},
  byd:        {depr:0.22, service:1.20, cat:'ev-budget',  label:'BYD'},
  mg:         {depr:0.23, service:1.15, cat:'ev-budget',  label:'MG'}
};

// Grouped brand order for the select dropdown
var BIL_GROUPS = [
  {label:'Japansk',    keys:['toyota','lexus','honda','mazda','nissan','suzuki','mitsubishi','subaru']},
  {label:'Koreansk',   keys:['hyundai','kia']},
  {label:'Tysk',       keys:['volkswagen','skoda','cupra','bmw','mercedes','audi','porsche']},
  {label:'Svensk',     keys:['volvo','polestar']},
  {label:'Fransk',     keys:['peugeot','citroen','renault','dacia']},
  {label:'Annet',      keys:['fiat','ford','landrover']},
  {label:'Elbilmerker',keys:['tesla','byd','mg']}
];
// Group label translations (only "Average" label differs per language)
var BIL_GROUP_I18N = {en:{g0:'Japanese',g1:'Korean',g2:'German',g3:'Swedish',g4:'French',g5:'Other',g6:'EV brands',avg:'Average'},
  zh:{g0:'日系',g1:'韩系',g2:'德系',g3:'瑞典',g4:'法系',g5:'其他',g6:'电动品牌',avg:'平均'},
  fr:{g0:'Japonais',g1:'Coréen',g2:'Allemand',g3:'Suédois',g4:'Français',g5:'Autre',g6:'Marques EV',avg:'Moyenne'},
  no:{g0:'Japansk',g1:'Koreansk',g2:'Tysk',g3:'Svensk',g4:'Fransk',g5:'Annet',g6:'Elbilmerker',avg:'Gjennomsnitt'},
  pl:{g0:'Japońskie',g1:'Koreańskie',g2:'Niemieckie',g3:'Szwedzkie',g4:'Francuskie',g5:'Inne',g6:'Marki EV',avg:'Średnia'},
  uk:{g0:'Японські',g1:'Корейські',g2:'Німецькі',g3:'Шведські',g4:'Французькі',g5:'Інші',g6:'Марки EV',avg:'Середнє'},
  ar:{g0:'يابانية',g1:'كورية',g2:'ألمانية',g3:'سويدية',g4:'فرنسية',g5:'أخرى',g6:'علامات EV',avg:'المتوسط'},
  lt:{g0:'Japoniški',g1:'Korejiečių',g2:'Vokiški',g3:'Švediški',g4:'Prancūziški',g5:'Kiti',g6:'EV markės',avg:'Vidurkis'},
  so:{g0:'Jabbaanka',g1:'Kuuriyaanka',g2:'Jarmalka',g3:'Iswiidishka',g4:'Faransiiska',g5:'Kuwo kale',g6:'EV brand',avg:'Celceliska'},
  ti:{g0:'ጃፓናዊ',g1:'ኮርያዊ',g2:'ጀርመናዊ',g3:'ሽወደናዊ',g4:'ፈረንሳዊ',g5:'ካልእ',g6:'ኤሌክትሪክ',avg:'ማእከላይ'},
  sv:{g0:'Japansk',g1:'Koreansk',g2:'Tysk',g3:'Svensk',g4:'Fransk',g5:'Övrigt',g6:'Elbilmärken',avg:'Genomsnitt'},
  es:{g0:'Japonés',g1:'Coreano',g2:'Alemán',g3:'Sueco',g4:'Francés',g5:'Otro',g6:'Marcas EV',avg:'Promedio'},
  pt:{g0:'Japonês',g1:'Coreano',g2:'Alemão',g3:'Sueco',g4:'Francês',g5:'Outro',g6:'Marcas EV',avg:'Média'},
  ur:{g0:'جاپانی',g1:'کوریائی',g2:'جرمن',g3:'سویڈش',g4:'فرانسیسی',g5:'دیگر',g6:'ای وی برانڈز',avg:'اوسط'}
};
function bilRepopulateMerke(r){
  var sel=document.getElementById('bil-merke');
  if(!sel) return;
  var cur=sel.value;
  sel.innerHTML='';
  var lang=curRegion||'no';
  var t=BIL_GROUP_I18N[lang]||BIL_GROUP_I18N.no;
  // "Gjennomsnitt" option first
  var avgOpt=document.createElement('option');
  avgOpt.value='snitt';avgOpt.textContent=t.avg;
  sel.appendChild(avgOpt);
  BIL_GROUPS.forEach(function(g,gi){
    var og=document.createElement('optgroup');
    og.label=t['g'+gi]||g.label;
    g.keys.forEach(function(k){
      var bp=BIL_MERKER[k];if(!bp)return;
      var o=document.createElement('option');
      o.value=k;o.textContent=bp.label;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
  sel.value=cur;
}

var bilMode = ''; // 'plan' or 'own'

function bilSetMode(mode) {
  bilMode = mode;
  var fields = document.getElementById('bil-fields');
  var btnPlan = document.getElementById('bil-mode-plan');
  var btnOwn = document.getElementById('bil-mode-own');
  var rowEiertid = document.getElementById('bil-row-eiertid');
  var eiertidInfo = document.getElementById('bil-own-eiertid-info');
  var rowResale = document.getElementById('bil-row-resale');
  var eiertidInput = document.getElementById('bil-aar');

  // Show fields
  fields.style.display = '';
  bilUpdateInsHint();

  // Highlight selected button
  btnPlan.style.opacity = mode === 'plan' ? '1' : '.55';
  btnOwn.style.opacity = mode === 'own' ? '1' : '.55';

  var eiertidHint = document.getElementById('bil-eiertid-hint');
  var r = R();

  if (mode === 'own') {
    // Own mode: auto-calc eiertid, show resale, lock eiertid, unlock kjøpsår
    eiertidInput.readOnly = true;
    eiertidInput.style.opacity = '.6';
    eiertidInfo.style.display = '';
    if (eiertidHint) eiertidHint.style.display = 'none';
    rowResale.style.display = '';
    var kjopsaarSel = document.getElementById('bil-kjopsaar');
    kjopsaarSel.disabled = false;
    kjopsaarSel.style.opacity = '1';
    bilSyncEiertid(); // calculate eiertid from kjøpsår
  } else {
    // Plan mode: manual eiertid, hide resale, lock kjøpsår to current year
    eiertidInput.readOnly = false;
    eiertidInput.style.opacity = '1';
    eiertidInfo.style.display = 'none';
    if (eiertidHint) { eiertidHint.style.display = ''; eiertidHint.textContent = r.bilEiertidHint || 'Hvor lenge planlegger du å eie bilen?'; }
    rowResale.style.display = 'none';
    var kjopsaarSel = document.getElementById('bil-kjopsaar');
    kjopsaarSel.value = new Date().getFullYear();
    kjopsaarSel.disabled = true;
    kjopsaarSel.style.opacity = '.6';
  }

  // Hide result when switching mode
  document.getElementById('bil-res').classList.add('hidden');
}

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
  // When kjøpsår changes: clamp årsmodell down if needed
  var modell = document.getElementById('bil-aarsmodell');
  var kjop = document.getElementById('bil-kjopsaar');
  if(modell && kjop && +modell.value > +kjop.value) modell.value = kjop.value;

  if(bilMode !== 'own') return; // Only auto-sync in own mode
  var y=+document.getElementById('bil-kjopsaar').value;
  var now=new Date().getFullYear();
  var diff=now-y;
  if(diff>=0) document.getElementById('bil-aar').value=Math.max(1,diff);
  var infoEl = document.getElementById('bil-own-eiertid-text');
  var r = R();
  var aar = Math.max(1, diff);
  infoEl.textContent = (r.bilOwnEiertidAuto || 'Eiertid: {n} år (beregnet fra kjøpsår {y})').replace('{n}', aar).replace('{y}', y);
}

// When årsmodell changes: clamp kjøpsår up if needed
function bilClampKjopsaar(){
  var modell = document.getElementById('bil-aarsmodell');
  var kjop = document.getElementById('bil-kjopsaar');
  if(!modell || !kjop) return;
  if(+kjop.value < +modell.value) kjop.value = modell.value;
  bilSyncEiertid();
}
function bilUpdateInsHint() {
  var pris = parseNum('bil-pris') || 400000;
  var merke = (document.getElementById('bil-merke') || {}).value || 'snitt';
  var bp = BIL_MERKER[merke] || BIL_MERKER.snitt;
  var forsikringType = (document.getElementById('bil-forsikring-type') || {}).value || 'fullkasko';
  var insTypeBase = forsikringType === 'ansvar' ? 350 : forsikringType === 'delkasko' ? 550 : 800;
  // Brand insurance multiplier based on category
  var catMult = {budget:0.90, standard:1.0, premium:1.35, luxury:1.50, 'ev-budget':1.15};
  var insBrandMult = catMult[bp.cat] || 1.0;
  var insValueScale = forsikringType === 'ansvar' ? 0.85 + 0.15 * Math.min(1, pris / 300000) : 0.5 + 0.5 * Math.min(1, pris / 400000);
  var est = Math.round(insTypeBase * insBrandMult * insValueScale);
  var hint = document.getElementById('bil-ins-hint');
  if (hint) hint.textContent = 'Estimat: ~' + est.toLocaleString('nb-NO') + ' kr/mnd';
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
  bilUpdateInsHint();
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

  // 1. Depreciation / value loss
  var tilstand = (document.getElementById('bil-tilstand')||{}).value || 'brukt';
  var resaleInput = parseNum('bil-resale');
  var verditap;

  if (bilMode === 'own' && resaleInput > 0) {
    // User provided actual resale value (e.g. from Finn) — use it directly
    verditap = Math.max(0, pris - resaleInput);
  } else {
    // Estimate depreciation with declining balance model
    var kmFactor = 1 / (1 + startKm / 150000);
    var adjDepr;
    if (tilstand === 'ny') {
      adjDepr = bp.depr * kmFactor;
    } else {
      adjDepr = bp.depr * 0.55 * kmFactor;
    }
    var restverdi = pris;
    for (var i = 0; i < aar; i++) restverdi *= (1 - adjDepr);
    verditap = pris - restverdi;
  }

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

  // 3. Insurance (user enters monthly, or auto-estimate by type)
  var forsikringType = (document.getElementById('bil-forsikring-type') || {}).value || 'fullkasko';
  if (forsikringMnd > 0) {
    var forsTotal = forsikringMnd * 12 * aar;
  } else {
    // Norwegian averages (monthly): Ansvar ~250-400, Delkasko ~400-700, Fullkasko ~600-1200
    // Base rates per type (for average ~200k car)
    var insTypeBase = forsikringType === 'ansvar' ? 350 : forsikringType === 'delkasko' ? 550 : 800;
    // Brand premium multiplier based on category
    var catMult = {budget:0.90, standard:1.0, premium:1.35, luxury:1.50, 'ev-budget':1.15};
    var insBrandMult = catMult[bp.cat] || 1.0;
    // Scale by car value — ansvar is fairly flat, kasko scales more with value
    var insValueScale;
    if (forsikringType === 'ansvar') {
      insValueScale = 0.85 + 0.15 * Math.min(1, pris / 300000); // mostly flat
    } else {
      insValueScale = 0.5 + 0.5 * Math.min(1, pris / 400000); // scales with value
    }
    var autoIns = insTypeBase * insBrandMult * insValueScale;
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
    // Scale down for cheap cars — a 30k car won't get 9k/yr in service
    var priceFactor = Math.min(1, pris / 200000);
    priceFactor = 0.3 + 0.7 * priceFactor; // floor at 30% of base rate
    var servicePerAar = serviceFlat * bp.service * serviceKmFactor * priceFactor;
    var serviceTotal = servicePerAar * aar;
  }

  // 5. Tires: ~3500-4500 kr/yr (summer+winter sets, dekkskift, wear)
  var dekkPerAar = drivstoff === 'elbil' ? 4500 : 3500;
  var dekkTotal = dekkPerAar * aar;

  // 6. Trafikkforsikringsavgift (fra 1. mars 2026): fossil 6,52 kr/dag, elbil 9,16 kr/dag
  var avgiftPerAar = drivstoff === 'elbil' ? 3343 : 2380;
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
  document.getElementById('bil-r-total').textContent = fmt(totalKostnad + pris);

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
  let sz = isSmall ? '12px' : '17px';
  let pad = isSmall ? '10px 6px' : '18px 8px';
  let rad = isSmall ? '10px' : '14px';
  let base = `border:none;border-radius:${rad};padding:${pad};font-family:'Inter',sans-serif;font-size:${sz};font-weight:500;cursor:pointer;transition:all .15s ease;`;
  if(l==='=') return base+'background:linear-gradient(135deg,var(--accent-d,#5b8def),var(--accent));color:#fff;font-size:18px;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,.12);';
  if(t==='acc') return base+'background:color-mix(in srgb,var(--accent) 6%,transparent);color:var(--accent-d,#5b8def);border:1px solid color-mix(in srgb,var(--accent) 8%,transparent);font-weight:600;';
  if(t==='fn') return base+'background:color-mix(in srgb,var(--accent) 4%,transparent);color:var(--accent-d,#5b8def);border:1px solid color-mix(in srgb,var(--accent) 6%,transparent);font-weight:600;';
  if(t==='op') return base+'background:var(--surface2);color:var(--ink3);border:1px solid var(--border);font-weight:600;';
  return base+'background:var(--surface);color:var(--ink);border:1px solid var(--border);font-weight:500;';
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
    grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(6,1fr);gap:8px;flex:1;';
    basicBtns.forEach(b=>grid.appendChild(mkBtn(b,false)));
    bcKeys.appendChild(grid);
  }
}

// LVU: Lønn vs Utbytte — sammenligner selskapskostnad for begge
function calcLvu(){const g=parseNum('lvu-gross');if(g<=0)return;const aga=parseNum('lvu-zone');
  // Lønn: selskapet betaler brutto + feriepenger + OTP + AGA (på hele grunnlaget)
  const ferie=g*0.12;const otp=g*0.02;const agaBase=g+ferie+otp;const agaAmt=agaBase*aga;
  const salCost=g+ferie+otp+agaAmt;
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
  // Utbetaling over 20 år med fortsatt avkastning (annuitet)
  const payoutYears=20;
  const annual=retRate>0?pot*retRate/(1-Math.pow(1+retRate,-payoutYears)):pot/payoutYears;
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
  var mobileLabels={basic:'Enkel',scientific:'Vitenskapelig',finance:'Finansiell',unit:'Valuta',lvu:'Lønn vs Utbytte',aga:'Ansattkostnad',avs:'Avskrivning',ferie:'Feriepenger',rente:'Effektiv Rente',valgevinst:'Valutagevinst',likvid:'Likviditet',pensjon:'Pensjon',npv:'NPV/IRR'};
  if(typeof updateMobileBar==='function')updateMobileBar(mobileLabels[mode]||mode);
  // Auto-focus for scientific on mobile
  if(mode==='scientific'&&window.innerWidth<=768&&typeof enterFocusMode==='function')setTimeout(enterFocusMode,100);
  document.querySelectorAll('.cm-opt').forEach(el=>el.classList.remove('cm-active'));
  const modeMap={basic:'cm-basic',finance:'cm-fin',scientific:'cm-sci',unit:'cm-unit',lvu:'cm-lvu',aga:'cm-aga',avs:'cm-avs',ferie:'cm-ferie',rente:'cm-rente',valgevinst:'cm-valgevinst',likvid:'cm-likvid',pensjon:'cm-pensjon',npv:'cm-npv'};
  var mEl=document.getElementById(modeMap[mode]);if(mEl)mEl.classList.add('cm-active');
  const keysWrap=bcKeys?bcKeys.parentElement:null;
  const dispWrap=bcDisp?bcDisp.parentElement:null;
  const specialPanels=['bc-unit','bc-finance','bc-lvu','bc-aga','bc-avs','bc-ferie','bc-rente','bc-valgevinst','bc-likvid','bc-pensjon','bc-npv'];
  specialPanels.forEach(id=>{var el=document.getElementById(id);if(el)el.classList.add('hidden');});
  const r=R();
  const extraModes={lvu:r.lblLvu||'Lønn vs Utbytte',aga:r.lblAga||'Ansattkostnad',avs:r.lblAvs||'Avskrivning',ferie:r.lblFerie||'Feriepenger',rente:r.lblRente||'Effektiv Rente',valgevinst:r.lblValgevinst||'Valutagevinst',likvid:r.lblLikvid||'Likviditet',pensjon:r.lblPensjon||'Pensjon',npv:r.lblNpvCalc||'Lønnsomhetsanalyse (NPV/IRR)'};
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
    if(!sel) return;
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
function ucPopulateCat(){ ccPopulate(); }
function ucUpdateUnits(){ ccConvert(); }
function ucConvert(){ ccConvert(); }

function fcUpdateFields(){
  var _fct=document.getElementById('fc-type');const type=_fct?_fct.value:'pv';
  const cfg = getFcConfigs()[type];
  const container = document.getElementById('fc-fields');
  if(!container) return;
  container.innerHTML = '';
  cfg.fields.forEach(f => {
    const isRate = f.id.includes('rate');
    container.innerHTML += `<div class="fg"><label class="flbl">${f.label}</label><input class="fc" type="text" ${isRate?'':'inputmode="numeric"'} id="${f.id}" value="${isRate ? f.val : fmtInput(f.val)}"></div>`;
  });
  document.getElementById('fc-result').classList.add('hidden');
}

function fcCalc(){
  const type = document.getElementById('fc-type').value;
  const g = id => parseFloat(document.getElementById(id).value.replace(/[\s\u00a0,]/g,''))||0;
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

// Desktop focus mode — index-based (supports N columns)
function toggleDesktopFocus(colIndex){
  var b=document.body;
  var grid=document.querySelector('.calc-grid');
  if(!grid) return;
  if(b.classList.contains('desktop-focus')){
    // Exit focus
    b.classList.remove('desktop-focus');
    Array.from(grid.children).forEach(function(c){c.removeAttribute('data-desktop-hidden');});
  } else if(colIndex!==undefined){
    // Enter focus on specific column
    b.classList.add('desktop-focus');
    Array.from(grid.children).forEach(function(c,i){
      if(i!==colIndex) c.setAttribute('data-desktop-hidden','true');
      else c.removeAttribute('data-desktop-hidden');
    });
  }
}
function _getColIndex(el){
  var parent=el.closest('.calc-grid > div, .calc-grid > .right-col');
  var grid=el.closest('.calc-grid');
  if(!parent||!grid) return 0;
  return Array.from(grid.children).indexOf(parent);
}
function initDesktopFocus(){
  // Add focus buttons to section title headers
  document.querySelectorAll('.calc-grid .section-title').forEach(function(h2){
    if(h2.querySelector('.focus-toggle')) return;
    h2.style.display='flex';h2.style.alignItems='center';h2.style.justifyContent='space-between';
    var idx=_getColIndex(h2);
    var btn=document.createElement('button');
    btn.className='focus-toggle';
    btn.onclick=function(e){e.stopPropagation();toggleDesktopFocus(idx);};
    btn.innerHTML='<span class="focus-toggle-label">⛶ Fokus</span><span class="focus-toggle-exit">✕ Lukk</span>';
    h2.appendChild(btn);
  });
  // Add small focus circle to each info-card header
  document.querySelectorAll('.calc-grid .info-card > .card-hdr').forEach(function(hdr){
    if(hdr.querySelector('.focus-card-btn')) return;
    var card=hdr.parentElement;
    if(!card||!card.classList.contains('info-card')) return;
    var idx=_getColIndex(card);
    hdr.style.position='relative';
    var btn=document.createElement('button');
    btn.className='focus-card-btn';
    btn.title='Fokus';
    btn.onclick=function(e){
      e.stopPropagation();
      var b=document.body;
      if(!b.classList.contains('desktop-focus')){
        toggleDesktopFocus(idx);
      }
      if(card.classList.contains('collapsed')) toggleCard(card);
      setTimeout(function(){ smartScroll(card); },250);
    };
    hdr.appendChild(btn);
  });
  // Always start without focus mode
  document.body.classList.remove('desktop-focus');
  var grid=document.querySelector('.calc-grid');
  if(grid) Array.from(grid.children).forEach(function(c){c.removeAttribute('data-desktop-hidden');});
  // Add global focus close bar before calc-grid
  if(grid&&!document.getElementById('focus-close-bar')){
    var bar=document.createElement('div');
    bar.id='focus-close-bar';
    bar.innerHTML='<button onclick="toggleDesktopFocus()" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:6px;">✕ Lukk fokus</button>';
    grid.parentElement.insertBefore(bar,grid);
  }
}

// Mobile section tabs — show/hide navigation (matches desktop focus feel)
function initMobileFocus(){
  var grid=document.querySelector('.calc-grid');
  if(!grid) return;
  // Skip kalkulator.html (has its own mobile mode bar)
  if(document.getElementById('calc-basic')) return;
  if(document.querySelector('.mobile-section-tabs')) return;
  var cols=Array.from(grid.children).filter(function(c){return c.querySelector&&c.querySelector('.section-title');});
  if(cols.length<2) return;
  var bar=document.createElement('div');
  bar.className='mobile-section-tabs';
  var tabs=[];
  function activateCol(idx){
    cols.forEach(function(c,i){c.classList.toggle('mobile-active',i===idx);});
    tabs.forEach(function(t,i){t.classList.toggle('active',i===idx);});
    window.scrollTo({top:0,behavior:'instant'});
  }
  cols.forEach(function(col,i){
    var title=col.querySelector('.section-title');
    if(!title) return;
    var tab=document.createElement('button');
    tab.className='mobile-section-tab'+(i===0?' active':'');
    tab.textContent=title.textContent.replace(/⛶.*|✕.*/g,'').trim();
    tab.onclick=function(){ activateCol(i); };
    bar.appendChild(tab);
    tabs.push(tab);
  });
  grid.parentElement.insertBefore(bar,grid);
  // Activate first column by default
  activateCol(0);
}

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
  // Skip if user is typing in an input/textarea/select
  var tag=e.target.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') {
    if(e.key==='Enter'){
      if(!e.target.closest('form')){
        e.preventDefault();
        const calcMap={salary:calcSal,mortgage:calcMor,npv:calcNpv,vat:calcVat,uttak:calcUttak,adj:calcAdj};
        if(activeCalc==='basic'&&bcMode==='finance'){fcCalc();return;}
        if(activeCalc==='basic'){
          const subCalcMap={aga:calcAga,avs:calcAvs,ferie:calcFerie,rente:calcRente,valgevinst:calcValgevinst,likvid:calcLikvid,pensjon:calcPensjon};
          if(subCalcMap[bcMode]){subCalcMap[bcMode]();return;}
        }
        if(calcMap[activeCalc])calcMap[activeCalc]();
      }
    }
    return;
  }
  // Calculator keyboard input (only for basic/scientific calc modes)
  var isCalcPage=activeCalc==='basic'||(activeCalc==='dashboard'&&document.getElementById('calc-basic')&&!document.getElementById('calc-basic').classList.contains('hidden'));
  if(isCalcPage&&(bcMode==='basic'||bcMode==='scientific')){
    var keyMap={'0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
      '.':',',',':',','+':'+','-':'−','*':'×','/':'÷','(':' (',')':') ',
      'Backspace':'⌫','Delete':'C','Escape':'C'};
    var mapped=keyMap[e.key];
    if(mapped){e.preventDefault();bcPress(mapped);return;}
    if(e.key==='Enter'){e.preventDefault();bcPress('=');return;}
    if(e.key==='%'){e.preventDefault();bcPress('%');return;}
  }
  // Enter for other calculators
  if(e.key==='Enter'){
    e.preventDefault();
    const calcMap={salary:calcSal,mortgage:calcMor,npv:calcNpv,vat:calcVat,uttak:calcUttak,adj:calcAdj};
    if(activeCalc==='basic'&&bcMode==='finance'){fcCalc();return;}
    if(activeCalc==='basic'){
      const subCalcMap={aga:calcAga,avs:calcAvs,ferie:calcFerie,rente:calcRente,valgevinst:calcValgevinst,likvid:calcLikvid,pensjon:calcPensjon};
      if(subCalcMap[bcMode]){subCalcMap[bcMode]();return;}
      bcPress('=');return;
    }
    if(calcMap[activeCalc])calcMap[activeCalc]();
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
// ═══════════════════════════════════════════════════════
// LØNN ETTER SKATT — Simplified wage calculator for youth
// ═══════════════════════════════════════════════════════
function calcLonn() {
  const r = R();
  const timelonn = parseNum('lonn-timelonn');
  const timerUke = +(document.getElementById('lonn-timer').value) || 0;
  const ukerAar = +(document.getElementById('lonn-uker').value) || 47;
  var _la=document.getElementById('lonn-alder');const alder=_la?_la.value:'18plus';
  if(timelonn<=0||timerUke<=0) return;

  const bruttoAar = timelonn * timerUke * ukerAar;
  const bruttoMnd = bruttoAar / 12;

  // Frikortgrense 2026: 100 000 kr
  const frikortgrense = 100000;

  // Minstefradrag 2026: 46%, maks 95 700 kr
  const mf = Math.min(Math.max(bruttoAar * 0.46, 0), 95700);
  // Personfradrag 2026: 114 540 kr (klasse 1)
  const pf = 114540;
  // Alminnelig inntekt
  const almInntekt = Math.max(bruttoAar - mf - pf, 0);

  let totalSkatt = 0;
  const breakdown = [];

  // Trinnskatt 2026
  const trinnSteps = [
    [226100, 318300, 0.017, (r.trinnLabel1||'Trinn 1')],
    [318300, 725050, 0.040, (r.trinnLabel2||'Trinn 2')],
    [725050, 980100, 0.137, (r.trinnLabel3||'Trinn 3')],
    [980100, 1467200, 0.168, (r.trinnLabel4||'Trinn 4')],
    [1467200, Infinity, 0.178, (r.trinnLabel5||'Trinn 5')]
  ];
  let trinnskatt = 0;
  trinnSteps.forEach(function(s){
    var lo=s[0],hi=s[1],rate=s[2];
    var amt = bruttoAar>lo ? (Math.min(bruttoAar,hi)-lo)*rate : 0;
    if(amt>0) trinnskatt += amt;
  });
  if(trinnskatt>0) { totalSkatt+=trinnskatt; breakdown.push({lbl:(r.lonnBdTrinn||'Trinnskatt'),val:trinnskatt}); }

  // Alminnelig inntektsskatt 22%
  const almSkatt = almInntekt * 0.22;
  if(almSkatt>0) { totalSkatt+=almSkatt; breakdown.push({lbl:(r.lonnBdAlm||'Alminnelig inntektsskatt (22 %)'),val:almSkatt}); }

  // Trygdeavgift 7.6% for 18+, 0% for under 18
  // Beregnes på personinntekt uavhengig av frikortgrense
  var trygdRate = (alder==='under18') ? 0 : 0.076;
  const trygd = bruttoAar * trygdRate;
  if(trygd>0) { totalSkatt+=trygd; breakdown.push({lbl:(r.lonnBdTrygd||'Trygdeavgift ('+(trygdRate*100).toFixed(1)+' %)'),val:trygd}); }

  // Minstefradrag & personfradrag info
  breakdown.push({lbl:(r.lonnBdMf||'Minstefradrag'), val: -mf, isFradrag:true});
  breakdown.push({lbl:(r.lonnBdPf||'Personfradrag'), val: -pf, isFradrag:true});

  // Feriepenger 10.2% (4 uker, standard under 60 år)
  const feriepenger = bruttoAar * 0.102;

  const nettoAar = bruttoAar - totalSkatt;
  const nettoMnd = nettoAar / 12;
  const nettoTime = (totalSkatt > 0) ? timelonn * (1 - totalSkatt/bruttoAar) : timelonn;
  const effSats = bruttoAar > 0 ? (totalSkatt/bruttoAar*100) : 0;

  // Verdict
  var verdict = '';
  if(totalSkatt <= 0) {
    verdict = r.lonnVerdictFrikort || 'Ingen skatt — inntekten er lav nok til at fradragene dekker alt.';
  } else if(effSats < 15) {
    verdict = r.lonnVerdictLav || 'Lav skattesats — typisk for deltidsjobb ved siden av studier.';
  } else {
    verdict = r.lonnVerdictNormal || 'Normal skattesats for inntektsnivået ditt.';
  }

  document.getElementById('lonn-r-netto-mnd').textContent = fmt(nettoMnd);
  document.getElementById('lonn-r-verdict').textContent = verdict;
  document.getElementById('lonn-r-brutto-aar').textContent = fmt(bruttoAar);
  document.getElementById('lonn-r-brutto-mnd').textContent = fmt(bruttoMnd);
  document.getElementById('lonn-r-skatt').textContent = fmt(totalSkatt);
  document.getElementById('lonn-r-skatt-mnd').textContent = fmt(totalSkatt/12);
  document.getElementById('lonn-r-effektiv').textContent = pct(effSats);
  document.getElementById('lonn-r-feriepenger').textContent = fmt(feriepenger);
  document.getElementById('lonn-r-netto-aar').textContent = fmt(nettoAar);
  document.getElementById('lonn-r-netto-time').textContent = fmt(nettoTime);

  // Breakdown
  var bd = document.getElementById('lonn-breakdown');
  if(bd && breakdown.length > 0) {
    var html = '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:8px;">'+(r.lonnBdTitle||'Skatteberegning')+'</div>';
    html += '<div style="border:1px solid var(--border);border-radius:var(--rs);overflow:hidden;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
    breakdown.forEach(function(item){
      var color = item.isFradrag ? 'color:var(--ink3);font-style:italic;' : '';
      var valStr = item.isFradrag ? fmt(Math.abs(item.val))+' ↓' : fmt(item.val);
      html += '<tr style="border-bottom:1px solid var(--border);"><td style="padding:8px 10px;'+color+'">'+item.lbl+'</td><td style="padding:8px 10px;text-align:right;font-weight:500;'+color+'">'+valStr+'</td></tr>';
    });
    html += '<tr style="background:var(--surface2);font-weight:700;"><td style="padding:8px 10px;">'+(r.lonnBdTotal||'Total skatt')+'</td><td style="padding:8px 10px;text-align:right;">'+fmt(totalSkatt)+'</td></tr>';
    html += '</table></div>';
    bd.innerHTML = html;
  }

  document.getElementById('lonn-res').classList.remove('hidden');
  setTimeout(function(){scrollToEl(document.getElementById('lonn-res'),'top');},80);
}

// ═══════════════════════════════════════════════════════
// SPAREKALKULATOR — Compound interest with visualization
// ═══════════════════════════════════════════════════════
var _spareChart = null;

function calcSpare() {
  const r = R();
  const start = parseNum('spare-start');
  const monthly = parseNum('spare-monthly');
  const rateAnnual = +(document.getElementById('spare-rate').value) || 0;
  const years = +(document.getElementById('spare-years').value) || 1;
  const rateMonthly = rateAnnual / 100 / 12;

  // Build year-by-year data
  let balance = start;
  let totalDeposits = start;
  const data = [];
  data.push({ year: 0, deposits: start, interest: 0, total: start });

  for (let y = 1; y <= years; y++) {
    let yearStart = balance;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + rateMonthly) + monthly;
    }
    totalDeposits += monthly * 12;
    let totalInterest = balance - totalDeposits;
    data.push({ year: y, deposits: totalDeposits, interest: totalInterest, total: balance });
  }

  const totalVal = balance;
  const totalDep = totalDeposits;
  const totalInt = totalVal - totalDep;
  const intPct = totalVal > 0 ? (totalInt / totalVal * 100) : 0;
  const effMonthly = totalVal > 0 && totalDep > 0 ? ((Math.pow(totalVal / start, 1 / (years * 12)) - 1) * 100) : 0;

  // Display results
  document.getElementById('spare-r-total').textContent = fmt(totalVal);
  document.getElementById('spare-r-innskudd').textContent = fmt(totalDep);
  document.getElementById('spare-r-rente').textContent = fmt(totalInt);
  document.getElementById('spare-r-renteandel').textContent = intPct.toFixed(1).replace('.', ',') + ' %';
  document.getElementById('spare-r-effektiv').textContent = effMonthly.toFixed(3).replace('.', ',') + ' %';

  // Verdict
  var verdictEl = document.getElementById('spare-r-verdict');
  if (totalInt > totalDep) {
    verdictEl.textContent = r.spareVerdictGreat || 'Renten tjente mer enn du sparte — rentes rente-effekten i aksjon!';
  } else if (totalInt > 0) {
    verdictEl.textContent = r.spareVerdictGood || 'Renten ga deg ' + intPct.toFixed(0) + ' % ekstra — tid er din beste venn.';
  } else {
    verdictEl.textContent = r.spareVerdictNone || 'Uten avkastning vokser pengene kun med innskuddene dine.';
  }

  // Build table
  var tbody = document.getElementById('spare-tbody');
  tbody.innerHTML = '';
  var yearLabel = r.spareThYear || 'År';
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    var tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom:1px solid var(--border);';
    if (i % 2 === 0) tr.style.background = 'var(--surface2)';
    tr.innerHTML = '<td style="padding:6px 10px;color:var(--ink);">' + (d.year === 0 ? (r.spareStart || 'Start') : d.year) + '</td>' +
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);">' + fmtInput(Math.round(d.deposits)) + '</td>' +
      '<td style="padding:6px 10px;text-align:right;color:var(--green);font-weight:500;">' + fmtInput(Math.round(d.interest)) + '</td>' +
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);font-weight:600;">' + fmtInput(Math.round(d.total)) + '</td>';
    tbody.appendChild(tr);
  }

  // Chart
  var ctx = document.getElementById('spare-chart').getContext('2d');
  if (_spareChart) _spareChart.destroy();

  var labels = data.map(function(d) { return d.year === 0 ? (r.spareStart || 'Start') : (r.spareThYear || 'År') + ' ' + d.year; });
  var depositsData = data.map(function(d) { return Math.round(d.deposits); });
  var interestData = data.map(function(d) { return Math.round(d.interest); });

  // Get computed CSS colors
  var cs = getComputedStyle(document.documentElement);
  var accentColor = cs.getPropertyValue('--accent').trim() || '#7a9ecc';
  var greenColor = cs.getPropertyValue('--green').trim() || '#16a34a';
  var inkColor = cs.getPropertyValue('--ink2').trim() || '#4a5568';
  var borderColor = cs.getPropertyValue('--border').trim() || '#e0e8f4';

  _spareChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: r.spareChartDeposits || 'Innskudd',
          data: depositsData,
          backgroundColor: accentColor + '99',
          borderColor: accentColor,
          borderWidth: 1,
          borderRadius: 3
        },
        {
          label: r.spareChartInterest || 'Rente (rentes rente)',
          data: interestData,
          backgroundColor: greenColor + '99',
          borderColor: greenColor,
          borderWidth: 1,
          borderRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: inkColor, font: { size: 12, family: 'Inter' }, usePointStyle: true, pointStyle: 'rectRounded', padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) { return ctx.dataset.label + ': ' + new Intl.NumberFormat('nb-NO').format(ctx.parsed.y).replace(/\u00a0/g, ' ') + ' ' + (R().currency || 'kr'); }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: inkColor, font: { size: 11 }, maxRotation: 45 }
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: inkColor,
            font: { size: 11 },
            callback: function(val) {
              if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
              if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
              return val;
            }
          }
        }
      }
    }
  });

  document.getElementById('spare-res').classList.remove('hidden');
  scrollToEl(document.getElementById('spare-res'));
}

// ── Studielån (Lånekassen) ──
function _studieSatser(){return{borte:15169,hjemme:7682};}
function studieClampBorte(){
  var S=_studieSatser();
  var aar=+(document.getElementById('studie-varighet').value)||3;
  var borteEl=document.getElementById('studie-borte-aar');
  if(!borteEl) return;
  borteEl.max=aar;
  if(+borteEl.value>aar) borteEl.value=aar;
  if(+borteEl.value<0) borteEl.value=0;
  var borte=+borteEl.value;
  var hjemme=aar-borte;
  var hintEl=document.getElementById('studie-boform-hint');
  if(hintEl){
    var parts=[];
    if(borte>0) parts.push(borte+' år borteboer ('+fmt(S.borte)+'/mnd)');
    if(hjemme>0) parts.push(hjemme+' år hjemmeboer ('+fmt(S.hjemme)+'/mnd)');
    hintEl.textContent=parts.join(' + ');
  }
}
function studieUpdateTotal(){
  var S=_studieSatser();
  var mndPerAar=+(document.getElementById('studie-mnd').value)||11;
  var aar=+(document.getElementById('studie-varighet').value)||3;
  var borte=+(document.getElementById('studie-borte-aar').value)||0;
  var hjemme=aar-borte;
  var grad=document.getElementById('studie-grad').value==='ja';
  var totalStotte=(borte*S.borte+hjemme*S.hjemme)*mndPerAar;
  var borteDel=borte*S.borte*mndPerAar;
  var stipendPct=grad?0.40:0.15;
  var stipend=Math.round(borteDel*stipendPct);
  var laan=totalStotte-stipend;
  var pctLabel=grad?'40':'15';
  document.getElementById('studie-v-totalstotte').textContent=fmt(totalStotte);
  document.getElementById('studie-v-stipend').textContent=fmt(stipend);
  document.getElementById('studie-v-laan').textContent=fmt(laan);
  var infoEl=document.getElementById('studie-l-stipendandel');
  if(infoEl){
    var r=R();
    if(grad){
      infoEl.textContent=(r.studieStipendGrad||'Omgjort til stipend')+' ('+pctLabel+' %)';
    } else {
      infoEl.textContent=(r.studieStipendNoGrad||'Omgjort til stipend')+' ('+pctLabel+' %)';
    }
  }
  var omgjInfo=document.getElementById('studie-omgj-info');
  if(omgjInfo){
    var r=R();
    if(grad){
      omgjInfo.textContent=r.studieOmgjGrad||'Stipendandel: 25 % for fullført grad + 15 % for beståtte studiepoeng = 40 %. Kun borteboer-delen kan omgjøres. Uten grad: kun 15 % for studiepoeng.';
    } else {
      omgjInfo.textContent=r.studieOmgjNoGrad||'Uten fullført grad får du kun 15 % omgjort til stipend (for beståtte studiepoeng). Fullfør en grad for å få 40 %.';
    }
  }
}
function calcStudielan(){
  var r=R();
  var mndPerAar=+(document.getElementById('studie-mnd').value)||11;
  var aar=+(document.getElementById('studie-varighet').value)||3;
  var borte=+(document.getElementById('studie-borte-aar').value)||0;
  var hjemme=aar-borte;
  var grad=document.getElementById('studie-grad').value==='ja';
  var rente=+(document.getElementById('studie-rente').value)||0;
  var nedbtid=+(document.getElementById('studie-nedbtid').value)||20;
  var skolepenger=parseNum('studie-skolepenger');
  var tilleggslan=parseNum('studie-tilleggslan');

  var S=_studieSatser();
  var totalStotte=(borte*S.borte+hjemme*S.hjemme)*mndPerAar;
  var borteDel=borte*S.borte*mndPerAar;
  var stipendPct=grad?0.40:0.15;
  var stipend=Math.round(borteDel*stipendPct);
  var ekstraLan=(skolepenger+tilleggslan)*aar;
  var gjeld=totalStotte-stipend+ekstraLan;

  // Annuitetslån
  var mndRente=rente/100/12;
  var antTerminer=nedbtid*12;
  var mndBetaling;
  if(mndRente>0){
    mndBetaling=gjeld*mndRente*Math.pow(1+mndRente,antTerminer)/(Math.pow(1+mndRente,antTerminer)-1);
  } else {
    mndBetaling=gjeld/antTerminer;
  }
  var totBetalt=mndBetaling*antTerminer;
  var totRente=totBetalt-gjeld;
  var skattefradrag=totRente*0.22;
  var reellKostnad=totBetalt-skattefradrag;

  // Display results
  document.getElementById('studie-r-mnd').textContent=fmt(mndBetaling)+' kr';
  document.getElementById('studie-r-totalstotte').textContent=fmt(totalStotte);
  document.getElementById('studie-r-stipend').textContent=fmt(stipend)+' ('+(stipendPct*100).toFixed(0)+' %)';
  document.getElementById('studie-r-ekstralan').textContent=fmt(ekstraLan);
  document.getElementById('studie-r-gjeld').textContent=fmt(gjeld);
  document.getElementById('studie-r-rente').textContent=rente.toFixed(1).replace('.',',')+' %';
  document.getElementById('studie-r-tid').textContent=nedbtid+' '+(r.studieAar||'år');
  document.getElementById('studie-r-totbetalt').textContent=fmt(totBetalt);
  document.getElementById('studie-r-totrente').textContent=fmt(totRente);
  document.getElementById('studie-r-skattefradrag').textContent=fmt(skattefradrag);
  document.getElementById('studie-r-reellkost').textContent=fmt(reellKostnad);

  // Verdict
  var verdictEl=document.getElementById('studie-r-verdict');
  var mndEtterSkatt=mndBetaling-(totRente*0.22/antTerminer);
  if(mndBetaling<2000){
    verdictEl.textContent=r.studieVerdictLow||'Overkommelig — lavere enn de fleste abonnementstjenester.';
  } else if(mndBetaling<3500){
    verdictEl.textContent=r.studieVerdictMid||'Moderat — omtrent som en strømregning.';
  } else {
    verdictEl.textContent=r.studieVerdictHigh||'Høy månedskostnad — vurder lengre nedbetalingstid.';
  }

  // Rente-sammenligning
  var renteRater=[2.0,3.0,4.0,5.0,6.0,7.0,8.0];
  var tbody=document.getElementById('studie-rente-tbody');
  tbody.innerHTML='';
  for(var i=0;i<renteRater.length;i++){
    var r2=renteRater[i]/100/12;
    var mBet;
    if(r2>0){
      mBet=gjeld*r2*Math.pow(1+r2,antTerminer)/(Math.pow(1+r2,antTerminer)-1);
    } else {
      mBet=gjeld/antTerminer;
    }
    var tBet=mBet*antTerminer;
    var tRente2=tBet-gjeld;
    var tr=document.createElement('tr');
    tr.style.cssText='border-bottom:1px solid var(--border);';
    if(i%2===0) tr.style.background='var(--surface2)';
    var isActive=Math.abs(renteRater[i]-rente)<0.05;
    if(isActive) tr.style.cssText+='font-weight:700;background:color-mix(in srgb,var(--accent) 10%,transparent);';
    tr.innerHTML='<td style="padding:6px 10px;color:var(--ink);">'+renteRater[i].toFixed(1).replace('.',',')+' %'+(isActive?' ←':'')+'</td>'+
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);">'+fmt(mBet)+'</td>'+
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);">'+fmt(tRente2)+'</td>'+
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);">'+fmt(tBet)+'</td>';
    tbody.appendChild(tr);
  }

  // Nedbetalingsplan (år for år)
  var planBody=document.getElementById('studie-plan-tbody');
  planBody.innerHTML='';
  var restgjeld=gjeld;
  var aarligBetaling=mndBetaling*12;
  for(var y=1;y<=nedbtid;y++){
    var aarRente=0;
    var aarAvdrag=0;
    for(var m=0;m<12;m++){
      var mRente=restgjeld*mndRente;
      var mAvdrag=mndBetaling-mRente;
      if(mAvdrag>restgjeld) mAvdrag=restgjeld;
      aarRente+=mRente;
      aarAvdrag+=mAvdrag;
      restgjeld-=mAvdrag;
      if(restgjeld<0) restgjeld=0;
    }
    var tr=document.createElement('tr');
    tr.style.cssText='border-bottom:1px solid var(--border);';
    if(y%2===0) tr.style.background='var(--surface2)';
    tr.innerHTML='<td style="padding:6px 10px;color:var(--ink);">'+y+'</td>'+
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);">'+fmt(aarRente+aarAvdrag)+'</td>'+
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);">'+fmt(aarRente)+'</td>'+
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);">'+fmt(aarAvdrag)+'</td>'+
      '<td style="padding:6px 10px;text-align:right;color:var(--ink);font-weight:'+(y===nedbtid?'700':'400')+';">'+fmt(restgjeld)+'</td>';
    planBody.appendChild(tr);
    if(restgjeld<=0) break;
  }

  // Show & scroll
  document.getElementById('studie-res').classList.remove('hidden');
  scrollToEl(document.getElementById('studie-res'));
}
// Auto-update total on load
document.addEventListener('DOMContentLoaded',function(){
  if(document.getElementById('studie-borte-aar')){ studieClampBorte(); studieUpdateTotal(); }
});

// ── Match calculator card heights with howto card heights ──
function syncCardHeights(){}

// ── Budsjettkalkulator ──
// ═══════════════════════════════════════════════════════
// ABONNEMENTSKALKULATOR — Subscription creep tracker
// ═══════════════════════════════════════════════════════

var ABO_DEFAULTS={
  'Spotify':139,'Netflix':129,'HBO Max':149,'Disney+':109,'YouTube Premium':169,
  'Viaplay':799,'Apple Music':99,'Apple iCloud+':29,'Treningssenter':449,
  'Mobilabonnement':349,'Bredbånd':699,'VG+':99,'Aftenposten':379,
  'Adobe Creative Cloud':619,'Microsoft 365':119,'PlayStation Plus':85,'Xbox Game Pass':149
};
var ABO_OLD={
  'Spotify':119,'Netflix':119,'HBO Max':99,'Disney+':109,'YouTube Premium':129,
  'Viaplay':149,'Apple Music':119,'Apple iCloud+':12,'Treningssenter':399,
  'Mobilabonnement':399,'Bredbånd':499,'VG+':199,'Aftenposten':399,
  'Adobe Creative Cloud':659,'Microsoft 365':99,'PlayStation Plus':69,'Xbox Game Pass':119
};

function aboCatChange(sel){
  var wrap=sel.parentElement;
  var existing=wrap.querySelector('.abo-custom');
  if(sel.value==='__custom__'){
    if(!existing){
      var inp=document.createElement('input');inp.type='text';inp.className='fc abo-custom';
      inp.placeholder='Skriv inn...';inp.style.cssText='width:100%;margin-top:4px;';
      wrap.appendChild(inp);inp.focus();
    }
  } else {
    if(existing)existing.remove();
    // Auto-fill default price
    var amtInput=sel.closest('.abo-row').querySelector('.abo-amount');
    if(amtInput&&ABO_DEFAULTS[sel.value]){amtInput.value=ABO_DEFAULTS[sel.value];}
  }
}

function aboGetName(row){
  var sel=row.querySelector('.abo-cat');
  if(sel){
    if(sel.value==='__custom__'){
      var custom=row.querySelector('.abo-custom');
      return custom?custom.value.trim():'';
    }
    return sel.value;
  }
  return '';
}

function aboAddRow(){
  var r=R();var cont=document.getElementById('abo-rows');
  var row=document.createElement('div');row.className='abo-row';row.style.cssText='display:flex;gap:8px;margin-bottom:6px;';
  var opts='<option value="Spotify">Spotify</option>'+
    '<option value="Netflix">Netflix</option>'+
    '<option value="HBO Max">HBO Max</option>'+
    '<option value="Disney+">Disney+</option>'+
    '<option value="YouTube Premium">YouTube Premium</option>'+
    '<option value="Viaplay">Viaplay</option>'+
    '<option value="Apple Music">Apple Music</option>'+
    '<option value="Apple iCloud+">Apple iCloud+</option>'+
    '<option value="Treningssenter">'+(r.aboOptTrening||'Treningssenter')+'</option>'+
    '<option value="Mobilabonnement">'+(r.aboOptMobil||'Mobilabonnement')+'</option>'+
    '<option value="Bredbånd">'+(r.aboOptBredband||'Bredbånd')+'</option>'+
    '<option value="VG+">VG+</option>'+
    '<option value="Aftenposten">Aftenposten</option>'+
    '<option value="Adobe Creative Cloud">Adobe Creative Cloud</option>'+
    '<option value="Microsoft 365">Microsoft 365</option>'+
    '<option value="PlayStation Plus">PlayStation Plus</option>'+
    '<option value="Xbox Game Pass">Xbox Game Pass</option>'+
    '<option value="__custom__">'+(r.aboOptCustom||'Valgfritt...')+'</option>';
  row.innerHTML='<div style="flex:2;position:relative;"><select class="fc abo-cat" onchange="aboCatChange(this)" style="width:100%;">'+opts+'</select></div>'+
    '<input type="text" class="fc abo-amount" placeholder="0" inputmode="numeric" style="flex:1;text-align:right;" value="139">'+
    '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--ink3,#999);cursor:pointer;font-size:16px;padding:0 4px;" title="Fjern">×</button>';
  cont.appendChild(row);
  row.querySelector('.abo-cat').focus();
}

function calcAbo(){
  var r=R();
  var rows=document.querySelectorAll('#abo-rows .abo-row');
  var totalMnd=0;
  var items=[];
  rows.forEach(function(row){
    var name=aboGetName(row)||r.aboDefaultName||'Abonnement';
    var amt=+(row.querySelector('.abo-amount').value.replace(/[^0-9.\-]/g,''))||0;
    if(amt>0){items.push({name:name,amount:amt});totalMnd+=amt;}
  });
  if(items.length===0)return;

  var totalAar=totalMnd*12;
  var antall=items.length;
  var snitt=totalMnd/antall;
  var daglig=totalAar/365;

  // Verdict
  var verdict='';
  if(totalMnd<500){
    verdict=r.aboVerdictLow||'Lavt forbruk — du har god kontroll på abonnementene.';
  } else if(totalMnd<1500){
    verdict=r.aboVerdictMid||'Moderat — sjekk om du bruker alle tjenestene aktivt.';
  } else if(totalMnd<3000){
    verdict=r.aboVerdictHigh||'Høyt forbruk — her kan du spare mye ved å kutte noen tjenester.';
  } else {
    verdict=r.aboVerdictVeryHigh||'Veldig høyt — du betaler mer enn de fleste i abonnementer.';
  }

  document.getElementById('abo-r-mnd').textContent=fmt(totalMnd)+(r.aboPerMnd||' / mnd');
  document.getElementById('abo-r-verdict').textContent=verdict;
  document.getElementById('abo-r-aar').textContent=fmt(totalAar);
  document.getElementById('abo-r-antall').textContent=antall;
  document.getElementById('abo-r-snitt').textContent=fmt(Math.round(snitt));
  document.getElementById('abo-r-daglig').textContent=fmt(Math.round(daglig));

  // Breakdown bar chart
  var bd=document.getElementById('abo-breakdown');
  if(items.length>0){
    var html='<div style="font-size:11px;font-weight:700;color:var(--ink2);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;">'+(r.aboBreakdownTitle||'Fordeling')+'</div>';
    html+='<div style="margin-top:4px;">';
    items.sort(function(a,b){return b.amount-a.amount;});
    items.forEach(function(item){
      var pctVal=totalMnd>0?((item.amount/totalMnd)*100):0;
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:12px;">'+
        '<div style="width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+item.name+'</div>'+
        '<div style="flex:1;background:var(--border);border-radius:4px;height:14px;overflow:hidden;">'+
        '<div style="width:'+pctVal+'%;height:100%;background:var(--accent);border-radius:4px;transition:width .3s;"></div></div>'+
        '<div style="width:80px;text-align:right;opacity:.6;">'+fmt(item.amount)+' <span style="font-size:10px;">/ '+(r.aboMo||'mnd')+'</span></div></div>';
    });
    html+='</div>';
    bd.innerHTML=html;
  } else { bd.innerHTML=''; }

  // Price change summary — show old vs new prices
  var changeEl=document.getElementById('abo-pricechange');
  if(!changeEl){
    changeEl=document.createElement('div');changeEl.id='abo-pricechange';
    changeEl.style.cssText='margin-top:12px;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;font-size:12px;line-height:1.7;color:var(--ink2);';
    bd.parentElement.insertBefore(changeEl,bd.nextSibling);
  }
  var totalOld=0,changes=[];
  items.forEach(function(item){
    var oldP=ABO_OLD[item.name];
    if(oldP!==undefined&&oldP!==item.amount){
      var diff=item.amount-oldP;
      var pctChange=((diff/oldP)*100).toFixed(0);
      changes.push({name:item.name,old:oldP,now:item.amount,diff:diff,pct:pctChange});
      totalOld+=oldP;
    } else {
      totalOld+=(oldP||item.amount);
    }
  });
  if(changes.length>0){
    var totalDiff=totalMnd-totalOld;
    var ch='<div style="font-size:11px;font-weight:700;color:var(--ink2);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;">'+(r.aboPriceChangeTitle||'Prisendringer siste år')+'</div>';
    changes.sort(function(a,b){return b.diff-a.diff;});
    changes.forEach(function(c){
      var col=c.diff>0?'var(--red)':'var(--green)';
      var arrow=c.diff>0?'↑':'↓';
      ch+='<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">'+
        '<span>'+c.name+'</span>'+
        '<span><span style="opacity:.5;text-decoration:line-through;">'+fmt(c.old)+'</span> → '+fmt(c.now)+' <span style="color:'+col+';font-weight:600;">'+arrow+' '+(c.diff>0?'+':'')+fmt(c.diff)+' ('+c.pct+' %)</span></span></div>';
    });
    if(totalDiff!==0){
      var tCol=totalDiff>0?'var(--red)':'var(--green)';
      ch+='<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-weight:600;">'+
        '<span>'+(r.aboTotalChange||'Total prisøkning / mnd')+'</span>'+
        '<span style="color:'+tCol+';">'+(totalDiff>0?'+':'')+fmt(totalDiff)+' kr</span></div>';
      ch+='<div style="display:flex;justify-content:space-between;opacity:.7;">'+
        '<span>'+(r.aboTotalChangeYear||'Per år')+'</span>'+
        '<span style="color:'+tCol+';">'+(totalDiff>0?'+':'')+fmt(totalDiff*12)+' kr</span></div>';
    }
    changeEl.innerHTML=ch;
    changeEl.style.display='block';
  } else {
    changeEl.style.display='none';
  }

  // Perspective box — "what else could you buy"
  var persEl=document.getElementById('abo-perspective');
  if(persEl){
    var kaffe=Math.round(totalAar/55);
    var flyreiser=Math.round(totalAar/1500*10)/10;
    var iphone=(totalAar/15990*100).toFixed(0);
    var html2='<div style="font-weight:600;margin-bottom:6px;">'+(r.aboPerspTitle||'Perspektiv — hva tilsvarer dette?')+'</div>';
    html2+='<div>☕ '+fmt(totalAar)+' kr/år ≈ <strong>'+kaffe+'</strong> '+(r.aboPerspKaffe||'kopper kaffe')+'</div>';
    html2+='<div>✈️ ≈ <strong>'+flyreiser+'</strong> '+(r.aboPerspFly||'tur-retur flyreiser i Europa')+'</div>';
    html2+='<div>📱 ≈ <strong>'+iphone+' %</strong> '+(r.aboPerspIphone||'av en ny iPhone')+'</div>';
    persEl.innerHTML=html2;
  }

  document.getElementById('abo-res').classList.remove('hidden');
  setTimeout(function(){scrollToEl(document.getElementById('abo-res'),'top');},80);
}

function budsjettCatChange(sel){
  var wrap=sel.parentElement;
  var existing=wrap.querySelector('.budsjett-custom');
  if(sel.value==='__custom__'){
    if(!existing){
      var inp=document.createElement('input');inp.type='text';inp.className='fc budsjett-custom';
      inp.placeholder='Skriv inn...';inp.style.cssText='width:100%;margin-top:4px;';
      wrap.appendChild(inp);inp.focus();
    }
  } else {
    if(existing)existing.remove();
  }
}
function budsjettGetName(row){
  var sel=row.querySelector('.budsjett-cat');
  if(sel){
    if(sel.value==='__custom__'){
      var custom=row.querySelector('.budsjett-custom');
      return custom?custom.value.trim():'';
    }
    return sel.value;
  }
  var nameInput=row.querySelector('.budsjett-name');
  return nameInput?nameInput.value.trim():'';
}
function budsjettAddRow(type){
  var r=R();var cont=document.getElementById('budsjett-'+type+'-rows');
  var row=document.createElement('div');row.className='budsjett-row';row.style.cssText='display:flex;gap:8px;margin-bottom:6px;';
  var opts='';
  if(type==='income'){
    opts='<option value="Lønn (netto)">'+(r.budOptLonn||'Lønn (netto)')+'</option>'+
      '<option value="Ekstrajobb/freelance">'+(r.budOptEkstra||'Ekstrajobb/freelance')+'</option>'+
      '<option value="Stipend">'+(r.budOptStipend||'Stipend')+'</option>'+
      '<option value="Kapitalinntekter">'+(r.budOptKapital||'Kapitalinntekter')+'</option>'+
      '<option value="NAV-ytelser">'+(r.budOptNav||'NAV-ytelser')+'</option>'+
      '<option value="__custom__">'+(r.budOptCustom||'Valgfritt...')+'</option>';
  } else {
    opts='<option value="Husleie">'+(r.budOptHusleie||'Husleie')+'</option>'+
      '<option value="Mat og dagligvarer">'+(r.budOptMat||'Mat og dagligvarer')+'</option>'+
      '<option value="Transport">'+(r.budOptTransport||'Transport')+'</option>'+
      '<option value="Strøm">'+(r.budOptStrom||'Strøm')+'</option>'+
      '<option value="Forsikring">'+(r.budOptForsikring||'Forsikring')+'</option>'+
      '<option value="Mobil/Internett">'+(r.budOptMobil||'Mobil/Internett')+'</option>'+
      '<option value="Studielån (nedbetaling)">'+(r.budOptStudielan||'Studielån (nedbetaling)')+'</option>'+
      '<option value="Boliglån (terminbeløp)">'+(r.budOptTermin||'Boliglån (terminbeløp)')+'</option>'+
      '<option value="Trening">'+(r.budOptTrening||'Trening')+'</option>'+
      '<option value="Streaming/Abonnement">'+(r.budOptStreaming||'Streaming/Abonnement')+'</option>'+
      '<option value="Klær og personlig">'+(r.budOptKlaer||'Klær og personlig')+'</option>'+
      '<option value="Sparing/BSU">'+(r.budOptSparing||'Sparing/BSU')+'</option>'+
      '<option value="__custom__">'+(r.budOptCustom||'Valgfritt...')+'</option>';
  }
  row.innerHTML='<div style="flex:2;position:relative;"><select class="fc budsjett-cat" onchange="budsjettCatChange(this)" style="width:100%;">'+opts+'</select></div>'+
    '<input type="text" class="fc budsjett-amount" placeholder="0" inputmode="numeric" style="flex:1;text-align:right;">'+
    '<button onclick="this.parentElement.remove();budsjettCalc()" style="background:none;border:none;color:var(--ink3,#999);cursor:pointer;font-size:16px;padding:0 4px;" title="Fjern">×</button>';
  cont.appendChild(row);
  row.querySelector('.budsjett-cat').focus();
}
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target.classList.contains('budsjett-amount')){e.preventDefault();budsjettCalc();}
});
function budsjettCalc(){
  var r=R();
  var incomeRows=document.querySelectorAll('#budsjett-income-rows .budsjett-row');
  var expenseRows=document.querySelectorAll('#budsjett-expense-rows .budsjett-row');
  var totalIncome=0,totalExpense=0;
  var incomeItems=[],expenseItems=[];
  incomeRows.forEach(function(row){
    var name=budsjettGetName(row)||r.budDefaultIncome||'Inntekt';
    var amt=+(row.querySelector('.budsjett-amount').value.replace(/[^0-9.\-]/g,''))||0;
    if(amt>0){incomeItems.push({name:name,amount:amt});totalIncome+=amt;}
  });
  expenseRows.forEach(function(row){
    var name=budsjettGetName(row)||r.budDefaultExpense||'Utgift';
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
  var resEl=document.getElementById('budsjett-res');
  resEl.classList.remove('hidden');
  setTimeout(function(){ smartScroll(resEl); },100);
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
  // Load active language, then initialize
  loadLang(region).catch(function() {
    region = 'no';
    return loadLang('no');
  }).then(function() { _initPageReady(); });
}
function _initPageReady(){
  // Sync region selector UI with saved language
  var _rf=document.getElementById('rf');if(_rf)_rf.textContent=R().flag;
  var _rn=document.getElementById('rn');if(_rn)_rn.textContent=R().name;
  document.querySelectorAll('.region-opt').forEach(function(el){el.classList.remove('active');});
  var activeOpt=document.querySelector('.region-opt[onclick*="\''+region+'\'"]');
  if(activeOpt) activeOpt.classList.add('active');
  bilInitYear();
  updateAll();
  // Sync calculator/howto card heights
  setTimeout(syncCardHeights,200);
  window.addEventListener('resize',syncCardHeights);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){setTimeout(syncCardHeights,50);});
  // Re-sync on card toggle
  var _origToggle=window.toggleCard;
  window.toggleCard=function(el){_origToggle(el);setTimeout(syncCardHeights,500);};
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
        var modes=['lvu','aga','avs','ferie','rente','valgevinst','likvid','pensjon','npv'];
        if(modes.indexOf(hash)>=0) switchCalcMode(hash);
      }
    },300);
  }
  initDesktopFocus();
  initMobileFocus();
}