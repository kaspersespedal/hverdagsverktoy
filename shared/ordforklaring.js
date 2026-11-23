/* ═══════════════════════════════════════════════════════════
   Hverdagsverktøy — ordforklaring der du leser (PRØVE)
   Første gang et ord fra ordlista (shared/ordliste.js) står i teksten på sida,
   får det prikket understrek. Pek på det (PC) eller trykk på det (mobil), så
   vises forklaringen i en liten boble med lenke til ordlista.
   Bare på norsk: ordlista finnes bare på norsk ennå.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var MAKS = 25;          // flere understreker enn dette på én side blir støy
  // Ord som også har en helt vanlig betydning, og som derfor ikke merkes i teksten
  var TVETYDIG = ['lager','unntak','fritak','justering','noter','sone','uttak','import','pendler','beta',
                  'ledd','termin','forfall','gevinst','avkastning','balanse','pant','toll','tap','stiftelse','konkurs',
                  'selvstendig','notert','tariff','frafall','spredning','ideell','kontinuitet','akkord','diett','skjønn',
                  'vederlag','refusjon','markedsverdi','egenandel','hefter','innmat'];
  var HOPP = 'a,button,input,select,textarea,label,h1,h2,h3,h4,h5,h6,summary,dt,code,pre,svg,nav,header,footer,' +
             '.tabs-wrap,.crumb,.page-title,.page-lead,.hv-ord,.search-dropdown,#site-search,[data-ord-hopp]';

  function sprak(){
    try { if(typeof region !== 'undefined' && region) return region; } catch(e){}
    return document.documentElement.getAttribute('data-lang') || 'no';
  }
  function hent(ferdig){
    if(window.HVT_ORDLISTE) return ferdig();
    var s = document.createElement('script');
    s.src = '/shared/ordliste.js?v=v502';
    s.async = true;
    s.onload = ferdig;
    document.head.appendChild(s);
  }
  function rx(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function merk(){
    var main = document.querySelector('main');
    if(!main || sprak() !== 'no' || !window.HVT_ORDLISTE) return;
    var perForm = {}, former = [];
    window.HVT_ORDLISTE.forEach(function(o){
      [o.ord.split(/ — | \(/)[0]].concat(o.alias || []).forEach(function(n){
        var k = String(n).trim().toLowerCase();
        if(k.length < 4 || perForm[k] || TVETYDIG.indexOf(k) >= 0) return;
        perForm[k] = o; former.push(k);
      });
    });
    former.sort(function(a, b){ return b.length - a.length; }); // «utsatt skatt» før «skatt»
    var re = new RegExp('(^|[^a-zæøå0-9])(' + former.map(rx).join('|') + ')(ene|en|et|er|ne|a|s)?(?![a-zæøå0-9])', 'i');

    var brukt = {}, antall = 0, noder = [];
    var tw = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        if(!n.nodeValue || n.nodeValue.length < 4) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if(!p || p.closest(HOPP) || p.closest('[hidden]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while(tw.nextNode()) noder.push(tw.currentNode);

    for(var i=0; i<noder.length && antall<MAKS; i++){
      var node = noder[i];
      while(node && antall < MAKS){
        var m = re.exec(node.nodeValue);
        // Hopp over treff på ord som allerede er merket: let videre i resten av teksten
        var start = 0, funnet = null;
        while(m){
          var o = perForm[m[2].toLowerCase()];
          if(o && !brukt[o.id]){ funnet = { m: m, o: o, i: start + m.index + m[1].length }; break; }
          start += m.index + m[0].length;
          m = re.exec(node.nodeValue.slice(start));
        }
        if(!funnet) break;
        var lengde = funnet.m[2].length + (funnet.m[3] || '').length;
        var ordNode = node.splitText(funnet.i);
        node = ordNode.splitText(lengde);
        var span = document.createElement('span');
        span.className = 'hv-ord';
        span.tabIndex = 0;
        span.setAttribute('role', 'button');
        span.setAttribute('aria-expanded', 'false');
        span.setAttribute('data-ord', funnet.o.id);
        ordNode.parentNode.replaceChild(span, ordNode);
        span.appendChild(ordNode);
        brukt[funnet.o.id] = funnet.o;
        antall++;
      }
    }
    if(antall) koble(brukt);
  }

  function koble(ordene){
    var st = document.createElement('style');
    st.textContent =
      '.hv-ord{text-decoration:underline dotted;text-decoration-color:var(--ink3,#888);text-decoration-thickness:1px;text-underline-offset:3px;cursor:help;border-radius:2px}' +
      '.hv-ord:hover,.hv-ord:focus-visible,.hv-ord[aria-expanded="true"]{text-decoration-color:var(--accent-2,currentColor)}' +
      '.hv-ord:focus-visible{outline:2px solid var(--accent-2,currentColor);outline-offset:2px}' +
      '#hv-ord-boble{position:fixed;z-index:9999;max-width:min(320px,calc(100vw - 24px));padding:11px 13px;' +
        'background:var(--surface,#fff);color:var(--ink2,#333);border:1px solid var(--line,#ccc);border-radius:8px;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.28);font:400 13.5px/1.5 var(--font-sans,system-ui,sans-serif)}' +
      '#hv-ord-boble[hidden]{display:none}' +
      '#hv-ord-boble strong{display:block;color:var(--ink,#111);font-weight:600;margin-bottom:3px}' +
      '#hv-ord-boble span{display:block}' +
      '#hv-ord-boble a{display:inline-block;margin-top:6px;color:var(--accent-2,inherit);text-decoration:none;border-bottom:1px solid var(--line-warm,currentColor)}';
    document.head.appendChild(st);

    var boble = document.createElement('div');
    boble.id = 'hv-ord-boble';
    boble.setAttribute('role', 'tooltip');
    boble.hidden = true;
    document.body.appendChild(boble);
    var aktiv = null, lukkTid = 0;

    function vis(span){
      clearTimeout(lukkTid);
      if(aktiv && aktiv !== span) aktiv.setAttribute('aria-expanded', 'false');
      var o = ordene[span.getAttribute('data-ord')];
      if(!o) return;
      boble.innerHTML = '';
      var t = document.createElement('strong'); t.textContent = o.ord;
      var p = document.createElement('span'); p.textContent = o.tekst;
      var a = document.createElement('a'); a.href = '/ordliste/#' + o.id; a.textContent = 'Les mer i ordlista →';
      boble.appendChild(t); boble.appendChild(p); boble.appendChild(a);
      boble.hidden = false;
      span.setAttribute('aria-expanded', 'true');
      span.setAttribute('aria-describedby', 'hv-ord-boble');
      aktiv = span;
      plasser();
    }
    // Under ordet, eller over hvis det ikke er plass. Lukkes når ordet er rullet ut av syne.
    function plasser(){
      if(!aktiv) return;
      var r = aktiv.getBoundingClientRect(), b = boble.getBoundingClientRect();
      if(r.bottom < 0 || r.top > window.innerHeight){ skjul(); return; }
      var venstre = Math.max(12, Math.min(r.left, window.innerWidth - b.width - 12));
      var topp = r.bottom + 8;
      if(topp + b.height > window.innerHeight - 8) topp = Math.max(8, r.top - b.height - 8);
      boble.style.left = venstre + 'px';
      boble.style.top = topp + 'px';
    }
    function skjul(){
      boble.hidden = true;
      if(aktiv){ aktiv.setAttribute('aria-expanded', 'false'); aktiv.removeAttribute('aria-describedby'); }
      aktiv = null;
    }
    function skjulSnart(){ clearTimeout(lukkTid); lukkTid = setTimeout(skjul, 180); }

    document.addEventListener('mouseover', function(e){
      var s = e.target.closest && e.target.closest('.hv-ord');
      if(s) vis(s);
      else if(e.target.closest && e.target.closest('#hv-ord-boble')) clearTimeout(lukkTid);
    });
    document.addEventListener('mouseout', function(e){
      if(e.target.closest && (e.target.closest('.hv-ord') || e.target.closest('#hv-ord-boble'))) skjulSnart();
    });
    document.addEventListener('focusin', function(e){
      var s = e.target.closest && e.target.closest('.hv-ord');
      if(s) vis(s);
      else if(!(e.target.closest && e.target.closest('#hv-ord-boble'))) skjul();
    });
    // Trykk (mobil) eller klikk: vis, eller lukk hvis den samme alt er åpen
    document.addEventListener('click', function(e){
      var s = e.target.closest && e.target.closest('.hv-ord');
      if(s){ if(aktiv === s && !boble.hidden) skjul(); else vis(s); return; }
      if(!(e.target.closest && e.target.closest('#hv-ord-boble'))) skjul();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && aktiv){ var s = aktiv; skjul(); s.focus(); }
      if((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('hv-ord')){ e.preventDefault(); vis(e.target); }
    });
    window.addEventListener('scroll', plasser, { passive: true });
    window.addEventListener('resize', plasser);
  }

  function start(){ hent(merk); }
  // Etter at sida og språket er på plass, når nettleseren har tid
  function senere(){ if('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 1200); }
  if(document.readyState === 'complete') senere();
  else window.addEventListener('load', senere);
})();
