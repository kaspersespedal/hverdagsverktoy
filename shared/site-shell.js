/* Hverdagsverktøy — site shell helpers (shared by every "X on Site.html" page) */
window.fmtKr = window.fmtKr || function(n){
  if(!isFinite(n)) return '–';
  return Math.round(n).toLocaleString('nb-NO').replace(/,/g,' ').replace(/ /g,' ');
};
window.fmtKr2 = window.fmtKr2 || function(n){
  if(!isFinite(n)) return '–';
  return n.toLocaleString('nb-NO',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/ /g,' ');
};
window.fmtPct = window.fmtPct || function(p,d){
  if(!isFinite(p)) return '–';
  return (p*100).toFixed(d ?? 1).replace('.',',') + ' %';
};
window.fmtNum = function(n,d){
  if(!isFinite(n)) return '–';
  return n.toLocaleString('nb-NO',{minimumFractionDigits:d??0,maximumFractionDigits:d??0}).replace(/ /g,' ');
};
window.parseKr = window.parseKr || function(s){
  if(s == null) return 0;
  return +String(s).replace(/[^\d]/g,'') || 0;
};
window.parseDec = window.parseDec || function(s){
  if(s == null) return 0;
  return +String(s).replace(/\s/g,'').replace(',','.').replace(/[^\d.]/g,'') || 0;
};

/* Detect ?embed=1 (or window in iframe with parent flag) so calc pages can
   shrink to fit inside the Subpage Preview's inline-calc iframe. The embed
   class on <body> activates the rules in site-shell.css that hide nav/hero/
   footer + side columns and zero out padding. We also push a height back to
   the parent so the iframe sizes correctly without the autosize estimating. */
window.__hvIsEmbed = (function(){
  try {
    var q = (location.search || '').toLowerCase();
    if(/[?&]embed=1\b/.test(q)) return true;
  } catch(_){}
  return false;
})();
window.__hvBudgetEnabled = (function(){
  try {
    var q = (location.search || '').toLowerCase();
    return /[?&]budgetadd=1\b/.test(q);
  } catch(_){ return false; }
})();
if(window.__hvIsEmbed){
  document.documentElement.classList.add('is-embed');
  document.addEventListener('DOMContentLoaded', function(){
    document.body.classList.add('embed');
    // Tell parent our actual content height so the iframe is exactly tall enough.
    function postHeight(){
      var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      try { window.parent.postMessage({type:'__embed_height', h: h}, '*'); } catch(_){}
    }
    requestAnimationFrame(postHeight);
    setTimeout(postHeight, 200);
    setTimeout(postHeight, 600);
    setTimeout(postHeight, 1500);
    try {
      var ro = new ResizeObserver(postHeight);
      ro.observe(document.body);
      ro.observe(document.documentElement);
    } catch(_){}
    window.addEventListener('resize', postHeight);

    if(window.__hvBudgetEnabled){
      // Try to inject the budget CTA. Calcs render asynchronously (React),
      // so retry until .ks-result appears, then bail.
      var tries = 0;
      function tryInject(){
        var target = document.querySelector('.ks-result');
        if(target){ injectBudgetCta(target); return; }
        if(++tries < 40) setTimeout(tryInject, 120);
      }
      setTimeout(tryInject, 200);
    }
  });
}

function injectBudgetCta(host){
  if(host.querySelector('.bud-cta-embed')) return;

  // Pretty CTA that lives just below the big result number, above the
  // breakdown stats. Looks like an integral part of the result column.
  var cta = document.createElement('div');
  cta.className = 'bud-cta-embed';
  cta.innerHTML =
    '<button type="button" class="bud-cta-btn" aria-label="Legg dette tallet til i månedsbudsjettet">' +
      '<span class="bud-cta-icn" aria-hidden="true">' +
        '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M8 3v10M3 8h10"/>' +
        '</svg>' +
      '</span>' +
      '<span class="bud-cta-lbl">' +
        '<span class="bud-cta-eyebrow">Legg til</span>' +
        '<span class="bud-cta-text">i månedsbudsjettet</span>' +
      '</span>' +
      '<span class="bud-cta-arrow" aria-hidden="true">' +
        '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
          '<line x1="3" y1="11" x2="11" y2="3"/>' +
          '<polyline points="5 3 11 3 11 9"/>' +
        '</svg>' +
      '</span>' +
    '</button>' +
    '<span class="bud-cta-toast" role="status" aria-live="polite"></span>';

  // Insert AFTER .ks-r-mnd (the small explanatory line under the big number)
  // or fall back to right after the eyebrow.
  var mnd = host.querySelector('.ks-r-mnd');
  var eyebrow = host.querySelector('.ks-r-eyebrow');
  if(mnd && mnd.parentNode){
    mnd.parentNode.insertBefore(cta, mnd.nextSibling);
  } else if(eyebrow && eyebrow.parentNode){
    eyebrow.parentNode.insertBefore(cta, eyebrow.nextSibling);
  } else {
    host.insertBefore(cta, host.firstChild);
  }

  var btn = cta.querySelector('.bud-cta-btn');
  var toast = cta.querySelector('.bud-cta-toast');
  var toastTimer = null;
  function showToast(msg, warn){
    toast.textContent = msg;
    toast.classList.toggle('warn', !!warn);
    toast.classList.add('show');
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2400);
  }

  btn.addEventListener('click', function(){
    btn.classList.add('is-pressed');
    setTimeout(function(){ btn.classList.remove('is-pressed'); }, 220);
    // Tell the parent to drive the push. Parent posts __bud_request_push to
    // us — the only path that reliably fires the in-page listeners that React
    // registered. We rely on the parent's ack to know success/failure.
    try { window.parent.postMessage({type:'__hv_bud_trigger'}, '*'); } catch(_){}
  });

  window.addEventListener('message', function(e){
    if(!e.data) return;
    if(e.data.type === '__hv_bud_response'){
      if(e.data.ok){
        btn.classList.add('is-added');
        showToast('Lagt til i budsjettet');
        setTimeout(function(){ btn.classList.remove('is-added'); }, 1800);
      } else {
        showToast('Fyll inn tall først', true);
      }
    }
  });
}

/* Render the standard site chrome (atmosphere, nav, tabs, footer) so each calc page
   stays small. Callers configure the active tab + breadcrumb via data-attrs on body. */
window.renderSiteChrome = function(opts){
  // In embed mode the parent already shows breadcrumbs + title in its own
  // toolbar, so skip the chrome entirely to save vertical space.
  if(window.__hvIsEmbed) return;
  const o = opts || {};
  const activeTab = o.activeTab || 'personlig';
  const crumbCat = o.crumbCat || 'Privatøkonomi';
  const crumbHref = o.crumbHref || ('Subpage Preview.html#' + activeTab);
  const here = o.here || document.title;
  const tabDefs = [
    {k:'budsjett',  l:'Budsjett',      href:'Budsjett on Site.html',
     svg:'<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="7" y1="13" x2="11" y2="13"/><line x1="7" y1="16" x2="9" y2="16"/><line x1="15" y1="13" x2="17" y2="13"/><line x1="15" y1="16" x2="17" y2="16"/>'},
    {k:'personlig', l:'Privatøkonomi', svg:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/>'},
    {k:'boliglan',  l:'Boliglån',      svg:'<path d="M3 11 L12 4 L21 11"/><path d="M5 10 V20 H19 V10"/>'},
    {k:'kalkulator',l:'Kalkulator',    svg:'<rect x="5" y="3" width="14" height="18" rx="2"/>'},
    {k:'skatt',     l:'Skatt',         svg:'<path d="M6 3 H16 L20 7 V21 H6 Z"/>'},
    {k:'selskap',   l:'Selskap',       svg:'<rect x="4" y="7" width="16" height="14" rx="1.5"/>'},
    {k:'avgift',    l:'Avgift',        svg:'<circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><line x1="6" y1="18" x2="18" y2="6"/>'},
    {k:'regnskap',  l:'Regnskap',      svg:'<rect x="4" y="4" width="16" height="16" rx="1.5"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="12" y1="9" x2="12" y2="20"/>'},
    {k:'lov',       l:'Lov',           svg:'<path d="M12 3 V20"/><path d="M5 7 L12 5 L19 7"/><path d="M5 7 L3 13 a3 3 0 0 0 6 0 L7 7"/><path d="M19 7 L17 13 a3 3 0 0 0 6 0 L21 7" transform="translate(-2,0)"/>'},
    // AI-fanen er midlertidig skjult — kommenter inn igjen for å gjenopprette
    // {k:'ai',        l:'Kunstig intelligens', svg:'<rect x="5" y="6" width="14" height="13" rx="2.5"/><circle cx="9.5" cy="12" r="1.2"/><circle cx="14.5" cy="12" r="1.2"/><path d="M12 3 V6"/><path d="M9 19 V21"/><path d="M15 19 V21"/>'}
  ];
  const tabsHtml = tabDefs.map(t =>
    '<a href="'+(t.href || ('Subpage Preview.html#'+t.k))+'" class="tab"'+(t.k===activeTab?' aria-selected="true"':'')+'>'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+t.svg+'</svg>'+
      t.l+'</a>'
  ).join('');

  const head = `
<div class="atmo-base"></div>
  </div>

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="mg" x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#d8ad7e"/><stop offset="1" stop-color="#a87842"/>
    </linearGradient>
    <symbol id="mh" viewBox="0 0 64 64">
      <rect x="14" y="12" width="8" height="40" rx="2.5" fill="url(#mg)"/>
      <rect x="42" y="12" width="8" height="40" rx="2.5" fill="url(#mg)"/>
      <rect x="22" y="28" width="20" height="8" rx="1.5" fill="url(#mg)"/>
    </symbol>
  </defs>
</svg>
<div class="nav-wrap"><div class="container"><nav>
  <a href="Homepage.html" class="brand-row">
    <span class="mark"><svg width="16" height="16"><use href="#mh"/></svg></span>
    <span class="wordmark">Hverdagsverktøy</span>
  </a>
</nav></div></div>
<div class="tabs-wrap"><div class="container"><div class="tabs">${tabsHtml}</div></div></div>`;

  const heroHtml = `
<section class="page-hero"><div class="container">
  <div>
    <div class="crumb">
      <a href="${crumbHref}" class="crumb-back" aria-label="Tilbake">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 3 4 7 8 11"/></svg>
      </a>
      <a href="Homepage.html">Hverdagsverktøy</a>
      <span class="sep"></span>
      <a href="${crumbHref}">${crumbCat}</a>
      <span class="sep"></span>
      <span class="here">${here}</span>
    </div>
    <h1 class="page-title">${o.title || here}</h1>
    <p class="page-lead">${o.lead || ''}</p>
  </div>
  <div class="page-stats">${(o.stats||[]).map(s=>
    '<div class="page-stat"><span class="l">'+s.l+'</span><span class="v">'+s.v+(s.u?'<span class="u">'+s.u+'</span>':'')+'</span></div>'
  ).join('')}</div>
</div></section>`;

  document.body.insertAdjacentHTML('afterbegin', head + heroHtml);

  const foot = `<footer><div class="container foot">
    <span>© 2026 Hverdagsverktøy</span>
    <em>Veiledende beregninger basert på kjente satser.</em>
  </div></footer>`;
  document.body.insertAdjacentHTML('beforeend', foot);
};
