/* ═══════════════════════════════════════════════════════════
   lov.js — lovleseren på lovsidene under /lov/ (skatteloven, aksjeloven, mva, bokføring)

   Siden viser én ting om gangen:
   - kapittelboksen (#lov-kapitler) når adressen ikke peker på et kapittel
   - ett kapittel når adressen er #<kapittel-id>
   Det styres av CSS (:target i shared/lov.css), så lenker, tilbakeknappen
   og lenker fra andre sider virker uten noe her.

   Skriptet gjør to ting:
   1. Søket over tittelen: viser treff fra alle kapitlene samtidig, med
      markering, og skjuler boksen så lenge det står noe i feltet.
   2. «Vis alle»-knappen i kapitler som har flere enn tre paragrafer.
   ═══════════════════════════════════════════════════════════ */
(function(){
  var root = document.querySelector('.lov-shell');
  if(!root) return;

  // ── «Vis alle» / «Vis færre» ──
  root.querySelectorAll('.chap-more').forEach(function(btn){
    var chap = btn.closest('.lov-chapter');
    var label = btn.querySelector('span');
    var open = label.textContent, closed = btn.getAttribute('data-faerre') || 'Vis færre';
    btn.addEventListener('click', function(){
      var on = !chap.classList.contains('is-expanded');
      chap.classList.toggle('is-expanded', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      label.textContent = on ? closed : open;
    });
  });

  // ── Søk ──
  var q = root.querySelector('.lov-q');
  if(!q) return;
  var clear = root.querySelector('.lov-clear');
  var countEl = root.querySelector('.lov-count b');
  var empty = root.querySelector('.lov-empty');
  var bar = root.querySelector('.lov-search');
  var pars = [].slice.call(root.querySelectorAll('.par'));
  var chaps = [].slice.call(root.querySelectorAll('.lov-chapter'));
  var totalPars = pars.length;

  function escapeRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  function norm(s){ return (s||'').replace(/\u2060/g,'').toLowerCase().replace(/§\s*/g,'').replace(/\s+/g,' '); }
  function unmark(el){
    el.querySelectorAll('mark').forEach(function(m){
      m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
    });
    el.normalize();
  }
  function highlight(el, re){
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while((n = walker.nextNode())){ if(n.nodeValue.trim() && !/SCRIPT|STYLE|MARK/.test(n.parentNode.tagName)) nodes.push(n); }
    nodes.forEach(function(node){
      re.lastIndex = 0;
      if(!re.test(node.nodeValue)) return;
      var frag = document.createDocumentFragment();
      var last = 0, txt = node.nodeValue, m; re.lastIndex = 0;
      while((m = re.exec(txt))){
        if(m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
        var mk = document.createElement('mark'); mk.textContent = m[0]; frag.appendChild(mk);
        last = m.index + m[0].length;
        if(m.index === re.lastIndex) re.lastIndex++;
      }
      if(last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }
  function runSearch(){
    var raw = (q.value||'').trim();
    pars.forEach(unmark);
    if(!raw){
      root.classList.remove('is-searching');
      bar.classList.remove('has-q');
      pars.forEach(function(p){ p.classList.remove('is-hidden'); });
      chaps.forEach(function(c){ c.classList.remove('is-hidden'); });
      countEl.textContent = totalPars;
      empty.classList.remove('show');
      return;
    }
    root.classList.add('is-searching');
    bar.classList.add('has-q');
    var qNorm = norm(raw);
    var re = new RegExp(escapeRe(raw).replace(/\s+/g,'\\s+').replace(/[-–]/g,'$&\\u2060?'), 'gi');
    var reNum = new RegExp(escapeRe(qNorm).replace(/\s/g,'[-\\s]?'), 'i');
    var hits = 0;
    chaps.forEach(function(c){
      var anyInChap = false;
      var head = c.querySelector('.chap-head'), headHit = !!head && norm(head.textContent).indexOf(qNorm) >= 0;
      c.querySelectorAll('.par').forEach(function(par){
        var sym = par.querySelector('.sym');
        var match = headHit || norm(par.textContent).indexOf(qNorm) >= 0 || (sym && reNum.test(norm(sym.textContent)));
        if(match){ par.classList.remove('is-hidden'); highlight(par, re); anyInChap = true; hits++; }
        else { par.classList.add('is-hidden'); }
      });
      c.classList.toggle('is-hidden', !anyInChap);
    });
    countEl.textContent = hits;
    empty.classList.toggle('show', hits === 0);
  }
  q.addEventListener('input', runSearch);
  clear.addEventListener('click', function(){ q.value=''; runSearch(); q.focus(); });
  // Esc tømmer søket, som i søket i toppmenyen.
  q.addEventListener('keydown', function(e){ if(e.key === 'Escape' && q.value){ q.value=''; runSearch(); } });

  // Lovsidene har ikke søket i toppmenyen, så hurtigtastene derfra (Ctrl/⌘ K og /)
  // flytter markøren hit i stedet.
  var keys = root.querySelector('.lov-keys kbd');
  if(keys && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) keys.textContent = '⌘';
  document.addEventListener('keydown', function(e){
    var t = document.activeElement && document.activeElement.tagName;
    if(t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if(e.key === '/' || ((e.metaKey || e.ctrlKey) && (e.key || '').toLowerCase() === 'k')){
      e.preventDefault(); q.focus(); q.select();
    }
  });
})();
