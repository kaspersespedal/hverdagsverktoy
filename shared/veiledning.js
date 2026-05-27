/* Hverdagsverktøy — Veiledning (?) help system
   Converts the verbose .side-card.method block into a compact "?" button
   placed next to the page title. Click opens a popover with the steps.
   Self-contained — inject this script and the matching <style> once per page. */
(function(){
  if (window.__veiledningInit) return; window.__veiledningInit = true;

  // Inject styles once
  var css = `
    .veil-trigger{display:inline-flex;align-items:center;gap:6px;
      vertical-align:middle;margin-left:14px;padding:6px 11px 6px 9px;
      background:rgba(200,153,104,.06);border:1px solid rgba(200,153,104,.22);
      border-radius:99px;color:var(--accent,#c89968);cursor:pointer;
      font:600 10px/1 var(--font-sans,'Inter',sans-serif);letter-spacing:1.4px;
      text-transform:uppercase;
      transition:background .18s ease,border-color .18s ease,color .18s ease}
    .veil-trigger:hover,.veil-trigger[aria-expanded="true"]{
      background:rgba(200,153,104,.14);border-color:rgba(200,153,104,.5);
      color:var(--accent-2,#d8ad7e)}
    .veil-trigger .q{display:inline-flex;align-items:center;justify-content:center;
      width:14px;height:14px;border-radius:50%;
      background:rgba(200,153,104,.18);font-size:9px;font-weight:700;letter-spacing:0}
    .veil-pop{position:fixed;z-index:200;
      width:min(380px,calc(100vw - 32px));
      background:#161513;color:var(--ink2,#a8a39a);
      border:1px solid rgba(200,153,104,.28);border-radius:8px;
      padding:18px 20px 16px;
      box-shadow:0 24px 60px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.03);
      font:400 13px/1.55 var(--font-sans,'Inter',sans-serif);
      opacity:0;visibility:hidden;transform:translateY(-4px);
      transition:opacity .2s ease,transform .2s ease,visibility .2s}
    .veil-pop.open{opacity:1;visibility:visible;transform:translateY(0)}
    .veil-pop h5{margin:0 0 12px;color:var(--ink,#ececea);
      font-family:var(--font-serif,'Source Serif 4',serif);font-weight:500;
      font-size:17px;line-height:1.2;letter-spacing:-.3px;
      padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06);
      display:flex;align-items:center;gap:10px}
    .veil-pop h5 .tag{font-family:var(--font-sans,'Inter',sans-serif);
      font:600 9.5px/1 var(--font-sans);letter-spacing:1.6px;text-transform:uppercase;
      color:var(--accent,#c89968);background:rgba(200,153,104,.1);
      padding:4px 8px;border-radius:3px}
    .veil-pop ol{list-style:none;margin:0;padding:0;
      display:flex;flex-direction:column;gap:11px}
    .veil-pop li{display:flex;gap:11px;align-items:flex-start;
      font-size:12.5px;line-height:1.55;color:var(--ink2,#a8a39a)}
    .veil-pop li .n{flex-shrink:0;font:600 9.5px/1.55 var(--font-sans);
      letter-spacing:1px;color:var(--accent,#c89968);width:18px;
      font-variant-numeric:tabular-nums}
    .veil-pop li b{font-weight:500;color:var(--ink,#ececea);letter-spacing:-.05px}
    .veil-pop p{margin:0 0 8px;color:var(--ink2,#a8a39a)}
    .veil-pop p:last-child{margin-bottom:0}
    .veil-close{position:absolute;top:10px;right:10px;
      width:24px;height:24px;border-radius:50%;
      background:transparent;border:0;cursor:pointer;
      color:var(--ink3,#797469);display:flex;align-items:center;justify-content:center;
      transition:background .15s ease,color .15s ease}
    .veil-close:hover{background:rgba(255,255,255,.04);color:var(--ink,#ececea)}
    .veil-backdrop{position:fixed;inset:0;z-index:199;
      background:rgba(0,0,0,.35);backdrop-filter:blur(2px);
      opacity:0;visibility:hidden;transition:opacity .2s ease,visibility .2s}
    .veil-backdrop.open{opacity:1;visibility:visible}
    @media (max-width:640px){
      .veil-trigger{margin-left:10px;padding:5px 10px 5px 8px;font-size:9.5px}
    }
  `;
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    // Find existing .side-card.method block on the page
    var method = document.querySelector('.side-card.method');
    if (!method) return;
    var title = (method.querySelector('h4') || {}).textContent || 'Slik regner vi';
    var stepsHTML = '';
    var ol = method.querySelector('ol, ul');
    if (ol) stepsHTML = ol.outerHTML.replace(/^<ul/i,'<ol').replace(/<\/ul>$/i,'</ol>');
    else stepsHTML = method.innerHTML;

    // Hide the original
    method.style.display = 'none';

    // Find anchor — prefer h1.page-title, else h1
    var anchor = document.querySelector('h1.page-title') || document.querySelector('h1');
    if (!anchor) return;

    // Build trigger button
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'veil-trigger';
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label', title);
    btn.innerHTML = '<span class="q" aria-hidden="true">?</span><span>Veiledning</span>';
    anchor.appendChild(btn);

    // Build popover + backdrop
    var bd = document.createElement('div'); bd.className = 'veil-backdrop';
    var pop = document.createElement('div'); pop.className = 'veil-pop'; pop.setAttribute('role','dialog');
    pop.innerHTML =
      '<button type="button" class="veil-close" aria-label="Lukk">'+
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="2.5" y1="2.5" x2="9.5" y2="9.5"/><line x1="9.5" y1="2.5" x2="2.5" y2="9.5"/></svg>'+
      '</button>'+
      '<h5>'+title+'<span class="tag">Veiledning</span></h5>'+
      stepsHTML;
    document.body.appendChild(bd);
    document.body.appendChild(pop);

    function position(){
      var r = btn.getBoundingClientRect();
      var top = r.bottom + 10;
      var left = r.left;
      var pw = pop.offsetWidth || 380;
      if (left + pw > window.innerWidth - 16) left = window.innerWidth - pw - 16;
      if (left < 16) left = 16;
      pop.style.top = top + 'px';
      pop.style.left = left + 'px';
    }
    function open(){
      position();
      bd.classList.add('open');
      pop.classList.add('open');
      btn.setAttribute('aria-expanded','true');
    }
    function close(){
      bd.classList.remove('open');
      pop.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      if (btn.getAttribute('aria-expanded')==='true') close(); else open();
    });
    pop.querySelector('.veil-close').addEventListener('click', close);
    bd.addEventListener('click', close);
    document.addEventListener('keydown', function(e){ if (e.key==='Escape') close(); });
    window.addEventListener('resize', function(){ if (pop.classList.contains('open')) position(); });
    window.addEventListener('scroll', function(){ if (pop.classList.contains('open')) position(); }, {passive:true});
  });
})();
