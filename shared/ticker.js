/* shared/ticker.js — v3 Aurora-over-ink ticker tape
   Source: hv_oppdatert_design/Homepage.html (E78). Extracted to shared/
   so all 24 sub-pages get the same brand-ticker without inline duplication.
   Auto-injects <aside class="ticker-top"> as the first child of <body> if
   not already present, then activates the marquee after a beat. */

(function(){
  'use strict';
  if (document.querySelector('aside.ticker-top')) return;

  var SYMBOLS = [
    ['OBX',         '1 045,21',  'up',   '+0,38 %'],
    ['OSEAX',       '1 612,40',  'up',   '+0,29 %'],
    ['S&P 500','5 218,11',  'down', '−0,12 %'],
    ['Nasdaq',      '16 847,30', 'up',   '+0,21 %'],
    ['DAX',         '18 042,55', 'up',   '+0,18 %'],
    ['FTSE 100','8 124,90', 'flat', '±0,02 %'],
    ['Nikkei',      '39 280,40', 'down', '−0,44 %'],
    ['Styringsrente','4,50 %',   'flat', '±0,00'],
    ['NIBOR 3M','4,68',          'flat', '±0,00'],
    ['EUR / NOK','11,84',   'up',   '+0,06'],
    ['GBP / NOK','13,56',   'up',   '+0,04'],
    ['SEK / NOK','1,02',    'flat', '±0,00'],
    ['USD / NOK','10,72',   'up',   '+0,03'],
    ['BTC',         '$ 67 240','down','−1,8 %'],
    ['ETH',         '$ 3 412','up',  '+0,9 %'],
    ['Brent',       '$ 84,30',   'down', '−0,8 %'],
    ['WTI',         '$ 80,15',   'down', '−0,9 %'],
    ['Gull',        '26 410',    'up',   '+0,4 %'],
    ['Sølv',   '312,40',         'up',   '+0,7 %'],
    ['Kobber',      '$ 4,28',    'up',   '+0,3 %'],
    ['Equinor',     '312,80',         'down', '−0,5 %'],
    ['DNB',         '218,40',         'up',   '+0,2 %'],
    ['Telenor',     '128,60',         'flat', '±0,0 %']
  ];

  function buildSpan(sym, hidden){
    var s = document.createElement('span');
    s.className = 'ti';
    if (hidden) s.setAttribute('aria-hidden', 'true');
    var b = document.createElement('b'); b.textContent = sym[0];
    var v = document.createElement('span'); v.className = 'val'; v.textContent = sym[1];
    var em = document.createElement('em'); em.className = sym[2]; em.textContent = sym[3];
    s.appendChild(b);
    s.appendChild(document.createTextNode(' '));
    s.appendChild(v);
    s.appendChild(document.createTextNode(' '));
    s.appendChild(em);
    return s;
  }

  function build(){
    var aside = document.createElement('aside');
    aside.className = 'ticker-top';
    aside.setAttribute('aria-label', 'Markedsdata — rullende oversikt');
    var mask = document.createElement('div'); mask.className = 'ticker-mask';
    var track = document.createElement('div'); track.className = 'ticker-track'; track.id = 'tickerTrack';
    SYMBOLS.forEach(function(s){ track.appendChild(buildSpan(s, false)); });
    SYMBOLS.forEach(function(s){ track.appendChild(buildSpan(s, true)); });
    mask.appendChild(track);
    aside.appendChild(mask);
    var badge = document.createElement('span');
    badge.className = 'ticker-badge'; badge.setAttribute('aria-hidden','true'); badge.textContent = 'Live';
    aside.appendChild(badge);
    return aside;
  }

  function mount(){
    var aside = build();
    var skip = document.querySelector('a.skip, .skip-link, a[href="#main"]');
    if (skip && skip.parentNode === document.body){
      document.body.insertBefore(aside, skip.nextSibling);
    } else if (document.body.firstChild){
      document.body.insertBefore(aside, document.body.firstChild);
    } else {
      document.body.appendChild(aside);
    }
    var REDUCE_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (REDUCE_MOTION){ aside.classList.add('live'); return; }
    setTimeout(function(){ aside.classList.add('live'); }, 240);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
