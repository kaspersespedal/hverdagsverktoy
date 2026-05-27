/* Hverdagsverktøy — top chrome: theme menu, language menu, ⌘K hint, ticker.
   Loaded after site-shell.js. Mirrors the feature surface of hverdagsverktoy.com
   so handoff to Claude Code is unambiguous.

   USAGE  Auto-runs on DOMContentLoaded. Reads <html data-theme="…">,
          persists via localStorage('hv-theme', 'hv-lang').
          To disable per-page: <body data-no-topchrome>.
   ─────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  // ── State / persistence ──────────────────────────────
  // Each theme carries a tiny palette for the menu preview tile so users see
  // the actual mood of the theme (bg + ink + accent), not just one swatch.
  var THEMES = [
    {k:'carbon',  l:'Carbon',    group:'dark',  sub:'Bek og messing',     pv:{bg:'#0f0e0d', ink:'#ecebe7', accent:'#b88a5e'}},
    {k:'dark',    l:'Mørk-blå',  group:'dark',  sub:'Kjølig natt',        pv:{bg:'#11172a', ink:'#e9edf4', accent:'#8aa3c8'}},
    {k:'hendrix', l:'Hendrix',   group:'dark',  sub:'Fillmore-plakat',    pv:{bg:'#fdf1e3', ink:'#2a0d3d', accent:'#d6248f'}},
    {k:'bw',      l:'Sort/hvit', group:'dark',  sub:'Høy kontrast',       pv:{bg:'#0a0a0a', ink:'#fafafa', accent:'#fafafa'}},
    {k:'disco',   l:'Disco',     group:'dark',  sub:'Neon-nattklubb',     pv:{bg:'#161226', ink:'#f0e6ff', accent:'#e91e8c'}},
    {k:'frost',   l:'Frost',     group:'light', sub:'Lys morgen',         pv:{bg:'#f7f9fc', ink:'#0f172a', accent:'#4f5fe5'}},
    {k:'glass',   l:'Glass',     group:'light', sub:'Glass og dis',       pv:{bg:'#e8edf6', ink:'#1a1a2e', accent:'#6875f5'}},
    {k:'pink',    l:'Rosa',      group:'light', sub:'Mykt blush',         pv:{bg:'#fffbfc', ink:'#3a2030', accent:'#d4748e'}}
  ];
  var LANGS = [
    {k:'no', l:'Norsk',       flag:'no', group:'main'},
    {k:'en', l:'English',     flag:'gb', group:'main'},
    {k:'pl', l:'Polski',      flag:'pl', group:'norway'},
    {k:'uk', l:'Українська',  flag:'ua', group:'norway'},
    {k:'ar', l:'العربية',     flag:'sa', group:'norway'},
    {k:'lt', l:'Lietuvių',    flag:'lt', group:'norway'},
    {k:'so', l:'Soomaali',    flag:'so', group:'norway'},
    {k:'ti', l:'ትግርኛ',       flag:'er', group:'norway'},
    {k:'zh', l:'中文',         flag:'cn', group:'intl'},
    {k:'fr', l:'Français',    flag:'fr', group:'intl'}
  ];

  function getStored(k, fb){ try{ return localStorage.getItem(k) || fb; }catch(e){ return fb; } }
  function setStored(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

  // True when this document is loaded inside an iframe (i.e. parent ≠ self).
  var IN_IFRAME = (function(){ try{ return window.parent && window.parent !== window; }catch(e){ return false; } })();

  function broadcastTheme(t){
    // Push theme down into any embedded calculators on this page.
    var frames = document.querySelectorAll('iframe');
    for (var i=0; i<frames.length; i++){
      try{ frames[i].contentWindow.postMessage({type:'__hv_theme', theme:t}, '*'); }catch(_e){}
    }
  }

  function applyTheme(t, opts){
    document.documentElement.setAttribute('data-theme', t);
    // Inside an embed we don't want to clobber the parent's localStorage value
    // with whatever the embedded page happened to start at — only persist when
    // top-level OR when the change originated from a user action here.
    if (!IN_IFRAME || (opts && opts.persist)) setStored('hv-theme', t);
    broadcastTheme(t);
  }
  function applyLang(l){
    document.documentElement.setAttribute('lang', l === 'no' ? 'nb' : l);
    setStored('hv-lang', l);
  }

  // Apply persisted theme ASAP (idempotent — html may already have it).
  // Inside an iframe, defer to whatever the parent broadcasts — don't read
  // localStorage (the embed may have been opened separately with a stale theme).
  applyTheme(
    IN_IFRAME
      ? (document.documentElement.getAttribute('data-theme') || 'carbon')
      : getStored('hv-theme', document.documentElement.getAttribute('data-theme') || 'carbon')
  );

  // Receive theme pushes from a host page (Subpage Preview etc.).
  window.addEventListener('message', function(ev){
    var d = ev && ev.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === '__hv_theme' && typeof d.theme === 'string'){
      applyTheme(d.theme);
    }
  });

  // If we're in an iframe, ask the parent for its current theme on boot so
  // freshly-mounted embeds match without waiting for the user to re-pick.
  if (IN_IFRAME){
    try{ window.parent.postMessage({type:'__hv_theme_request'}, '*'); }catch(_e){}
  }
  // Host side: when a child asks, reply with our current theme.
  window.addEventListener('message', function(ev){
    var d = ev && ev.data;
    if (!d || d.type !== '__hv_theme_request') return;
    var t = document.documentElement.getAttribute('data-theme') || 'carbon';
    try{ ev.source && ev.source.postMessage({type:'__hv_theme', theme:t}, '*'); }catch(_e){}
  });

  // Also push to iframes added after page load (focus modal opens lazily).
  var __frameObs = new MutationObserver(function(records){
    var t = document.documentElement.getAttribute('data-theme') || 'carbon';
    for (var i=0;i<records.length;i++){
      var added = records[i].addedNodes;
      for (var j=0; added && j<added.length; j++){
        var n = added[j];
        if (!n || n.nodeType !== 1) continue;
        var fs = n.tagName === 'IFRAME' ? [n] : n.querySelectorAll ? n.querySelectorAll('iframe') : [];
        for (var k=0; k<fs.length; k++){
          (function(f){
            f.addEventListener('load', function(){
              try{ f.contentWindow.postMessage({type:'__hv_theme', theme:t}, '*'); }catch(_e){}
            });
          })(fs[k]);
        }
      }
    }
  });
  if (document.documentElement) __frameObs.observe(document.documentElement, {childList:true, subtree:true});

  // ── Style injection ──────────────────────────────────
  var css = `
  .tc-actions{display:flex;align-items:center;gap:14px;margin-left:auto}
  .tc-btn{display:inline-flex;align-items:center;gap:8px;
    background:transparent;border:0;
    color:var(--ink3);padding:5px 0;border-radius:0;
    font:500 12px/1 var(--font-sans);letter-spacing:0;cursor:pointer;
    transition:color .18s var(--ease)}
  .tc-btn:hover,.tc-btn[aria-expanded="true"]{color:var(--ink)}
  .tc-btn .swatch{width:10px;height:10px;border-radius:50%;
    background:var(--accent);box-shadow:inset 0 0 0 1px rgba(0,0,0,.15);
    transition:transform .18s var(--ease)}
  @media(hover:hover){.tc-btn:hover .swatch{transform:scale(1.15)}}
  .tc-btn .flag{width:16px;height:11px;border-radius:1.5px;overflow:hidden;
    box-shadow:0 0 0 1px rgba(0,0,0,.15);flex-shrink:0;
    transition:transform .18s var(--ease)}
  @media(hover:hover){.tc-btn:hover .flag{transform:scale(1.06)}}
  .tc-btn .flag img{width:100%;height:100%;display:block;object-fit:cover}
  .tc-btn .chev{opacity:.45;transition:transform .2s var(--ease),opacity .18s var(--ease)}
  .tc-btn:hover .chev,.tc-btn[aria-expanded="true"] .chev{opacity:.8}
  .tc-btn[aria-expanded="true"] .chev{transform:rotate(180deg)}
  .tc-divider{width:1px;height:14px;background:var(--line);opacity:.6}
  .tc-kbd{display:inline-flex;align-items:center;gap:3px;
    color:var(--ink3);font:500 10.5px/1 var(--font-sans);
    padding:0;cursor:pointer;opacity:.7;transition:opacity .18s var(--ease)}
  .tc-kbd:hover{opacity:1;color:var(--ink2)}
  .tc-kbd kbd{font:500 10.5px/1 var(--font-mono);color:inherit;
    background:transparent;border:0;padding:0}
  .tc-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:212px;
    background:var(--surface);border:1px solid var(--line-2);border-radius:8px;
    padding:4px;
    box-shadow:0 1px 0 rgba(255,255,255,.04) inset,
               0 24px 60px -12px rgba(0,0,0,.55),
               0 8px 20px -8px rgba(0,0,0,.4);
    opacity:0;visibility:hidden;transform:translateY(-4px) scale(.985);
    transform-origin:top right;
    transition:opacity .16s var(--ease),transform .18s var(--ease),visibility .16s;
    z-index:60}
  .tc-menu.open{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
  /* Section labels — inline divider rule, no big borders, no caps shouting */
  .tc-menu h5{font:500 10.5px/1 var(--font-sans);letter-spacing:.02em;
    text-transform:none;color:var(--ink4);
    margin:10px 10px 4px;padding:0;border:0;opacity:1}
  .tc-menu h5:first-child{margin-top:6px}
  .tc-menu a{position:relative;display:flex;align-items:center;gap:10px;
    padding:7px 10px;
    border-radius:5px;text-decoration:none;color:var(--ink2);
    font:500 13px/1 var(--font-sans);
    transition:background .15s var(--ease),color .15s var(--ease);
    cursor:pointer}
  .tc-menu a:hover{background:color-mix(in srgb, var(--ink) 6%, transparent);
    color:var(--ink)}
  .tc-menu a.current{color:var(--ink)}
  /* Current marker — small accent dot, sits on the trailing edge */
  .tc-menu a.current::after{content:"";margin-left:auto;flex-shrink:0;
    width:5px;height:5px;border-radius:50%;background:var(--accent)}
  .tc-menu .swatch{width:16px;height:16px;border-radius:4px;flex-shrink:0;
    box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);
    transition:transform .2s var(--ease)}
  /* Flags — flat, no drop shadow, hairline boundary only */
  .tc-menu .flag{width:18px;height:13px;border-radius:2px;overflow:hidden;
    box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);
    flex-shrink:0}
  .tc-menu .flag img{width:100%;height:100%;display:block;object-fit:cover}
  .tc-wrap{position:relative}

  /* ── Theme menu — refined: wider, mini-card preview per row ── */
  .tc-theme-menu{min-width:268px;padding:5px}
  .tc-theme-menu .tc-group{padding:0}
  .tc-theme-menu .tc-group + .tc-group{margin-top:2px;
    padding-top:5px;
    border-top:1px solid var(--line)}
  .tc-theme-menu h5{display:flex;align-items:center;gap:8px;
    font:500 9.5px/1 var(--font-sans);letter-spacing:.14em;
    text-transform:uppercase;color:var(--ink4);
    margin:6px 10px 6px;padding:0;border:0}
  .tc-theme-menu h5 .tc-rule{flex:1;height:1px;background:var(--line);
    display:block}
  .tc-theme-menu a{position:relative;display:flex;align-items:center;
    gap:11px;padding:7px 9px;border-radius:6px;
    transition:background .15s var(--ease),color .15s var(--ease)}
  .tc-theme-menu a:hover{background:color-mix(in srgb, var(--ink) 5%, transparent)}
  .tc-theme-menu a.current{background:color-mix(in srgb, var(--accent) 9%, transparent)}
  .tc-theme-menu a.current:hover{background:color-mix(in srgb, var(--accent) 14%, transparent)}
  /* Suppress the generic ::after dot on theme-menu rows — we use a checkmark */
  .tc-theme-menu a.current::after{display:none}

  /* Mini preview tile — a tiny mockup of the actual theme */
  .tc-theme-menu .tc-pv{position:relative;flex-shrink:0;
    width:38px;height:26px;border-radius:5px;overflow:hidden;
    box-shadow:inset 0 0 0 1px rgba(0,0,0,.18),
               inset 0 0 0 1.5px rgba(255,255,255,.04);
    padding:6px 6px 0;display:flex;flex-direction:column;gap:3px;
    transition:transform .2s var(--ease)}
  @media(hover:hover){.tc-theme-menu a:hover .tc-pv{transform:scale(1.04)}}
  .tc-theme-menu .tc-pv-bar{display:block;height:2px;border-radius:1px;
    width:60%;opacity:.85}
  .tc-theme-menu .tc-pv-bar-short{width:38%;opacity:.45}
  .tc-theme-menu .tc-pv-dot{position:absolute;bottom:4px;right:4px;
    width:6px;height:6px;border-radius:50%;
    box-shadow:0 0 0 1.5px rgba(0,0,0,.18)}

  /* Two-line label */
  .tc-theme-menu .tc-row-text{display:flex;flex-direction:column;gap:3px;
    min-width:0;flex:1}
  .tc-theme-menu .tc-row-name{font:500 13px/1 var(--font-sans);color:var(--ink);
    letter-spacing:-.005em}
  .tc-theme-menu .tc-row-sub{font:400 10.5px/1 var(--font-sans);color:var(--ink3);
    letter-spacing:.01em}

  /* Checkmark — only shown on current */
  .tc-theme-menu .tc-check{opacity:0;color:var(--accent);flex-shrink:0;
    transition:opacity .15s var(--ease)}
  .tc-theme-menu a.current .tc-check{opacity:1}

  /* Per-theme swatch colors for the picker preview */
  .sw-carbon{background:#c89968}
  .sw-dark{background:#8aa3c8}
  .sw-hendrix{background:linear-gradient(135deg,#ff5b1f 0%,#c0188a 60%,#ffc24a 100%)}
  .sw-bw{background:#fafafa}
  .sw-disco{background:#e91e8c}
  .sw-frost{background:#4f5fe5}
  .sw-glass{background:linear-gradient(135deg,#8b95ff,#e8edf6)}
  .sw-pink{background:#d4748e}

  /* ── Ticker tape ──────────────────────────── */
  .tc-ticker{position:relative;padding:8px 0;
    background:color-mix(in srgb, var(--bg) 90%, transparent);
    border-bottom:1px solid var(--line);
    overflow:hidden;font:500 12px/1 var(--font-sans);
    font-variant-numeric:tabular-nums lining-nums}
  .tc-ticker-mask{
    -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 60px,#000 calc(100% - 100px),transparent 100%);
    mask-image:linear-gradient(90deg,transparent 0,#000 60px,#000 calc(100% - 100px),transparent 100%);
    overflow:hidden}
  .tc-ticker-track{display:flex;align-items:center;gap:36px;
    width:max-content;animation:tcScroll 120s linear infinite}
  .tc-ticker:hover .tc-ticker-track{animation-play-state:paused}
  @media (prefers-reduced-motion:reduce){.tc-ticker-track{animation:none}}
  @keyframes tcScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .tc-ti{display:inline-flex;align-items:baseline;gap:6px;color:var(--ink2);white-space:nowrap}
  .tc-ti b{font-weight:500;color:var(--ink3);font-size:11px;letter-spacing:0}
  .tc-ti .val{color:var(--ink);font-weight:500}
  .tc-ti em{font-style:normal;color:var(--ink3);font-size:11px}
  .tc-ti em.up{color:var(--pos)}
  .tc-ti em.dn{color:var(--neg)}
  .tc-ticker-badge{position:absolute;top:50%;right:14px;transform:translateY(-50%);
    display:inline-flex;align-items:center;gap:6px;
    font:500 10px/1 var(--font-sans);letter-spacing:.5px;
    color:var(--ink3);background:var(--bg);padding:0 8px;z-index:2}
  .tc-ticker-badge::before{content:"";width:5px;height:5px;border-radius:50%;
    background:var(--accent);animation:tcPulse 2s ease-in-out infinite}
  @keyframes tcPulse{0%,100%{opacity:.4}50%{opacity:1}}
  `;
  var styleEl = document.createElement('style');
  styleEl.id = 'tc-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Render top chrome ────────────────────────────────
  function render(){
    if (document.body.hasAttribute('data-no-topchrome')) return;
    if (document.getElementById('tc-ticker')) return; // idempotent
    // Embed mode: when iframed, hide chrome and let calculator fill the frame
    // Skipped in the design-preview project — the whole site lives in an iframe.
    try{
      var isEmbed = /[?&]embed=1\b/.test(location.search);
      if (isEmbed){
        document.body.classList.add('embed');
        var es = document.createElement('style');
        es.textContent =
          '.nav-wrap,.tabs-wrap,footer,.page-hero,aside.ticker-top,#tc-ticker{display:none !important}'+
          '.side-col{display:none !important}'+
          '.calc-wrap{padding:18px 0 24px !important}'+
          '.calc-wrap .container{grid-template-columns:1fr !important;padding:0 18px !important;max-width:none !important}'+
          'html,body{background:transparent !important;overflow:hidden !important}';
        document.head.appendChild(es);
        document.documentElement.setAttribute('data-embed','1');
        // Report content height to parent so iframe auto-sizes (no tomrom)
        function reportH(){
          try{
            var h = Math.max(
              document.documentElement.scrollHeight,
              document.body ? document.body.scrollHeight : 0
            );
            window.parent.postMessage({type:'__embed_height', h:h}, '*');
          }catch(_e){}
        }
        window.addEventListener('load', function(){ reportH(); setTimeout(reportH, 200); setTimeout(reportH, 800); });
        if(window.ResizeObserver){
          var ro = new ResizeObserver(function(){ reportH(); });
          ro.observe(document.documentElement);
          if(document.body) ro.observe(document.body);
        }
        // Also re-report on input changes (calc results may shift layout)
        document.addEventListener('input', function(){ setTimeout(reportH, 50); });
        document.addEventListener('click', function(){ setTimeout(reportH, 50); });
        return; // skip injecting ticker/nav when embedded
      }
    }catch(_e){}
    // Skip ticker injection if page already has its own (Homepage)
    var hasNativeTicker = document.querySelector('aside.ticker-top');

    // 1) Ticker tape (above nav)
    var tickerItems = [
      ['OBX','1 045,21','+0,38 %','up'],['OSEAX','1 612,40','+0,29 %','up'],
      ['S&P 500','5 218,11','−0,12 %','dn'],['Nasdaq','16 847,30','+0,21 %','up'],
      ['DAX','18 042,55','+0,18 %','up'],['FTSE 100','8 124,90','±0,02 %',''],
      ['Nikkei','39 280,40','−0,44 %','dn'],['Styringsrente','4,50 %','±0,00',''],
      ['NIBOR 3M','4,68','±0,00',''],['EUR / NOK','11,84','+0,06','up'],
      ['GBP / NOK','13,56','+0,04','up'],['SEK / NOK','1,02','±0,00',''],
      ['USD / NOK','10,72','+0,03','up'],['BTC','$ 67 240','−1,8 %','dn'],
      ['ETH','$ 3 412','+0,9 %','up'],['Brent','$ 84,30','−0,8 %','dn'],
      ['WTI','$ 80,15','−0,9 %','dn'],['Gull','26 410','+0,4 %','up'],
      ['Sølv','312,40','+0,7 %','up'],['Kobber','$ 4,28','+0,3 %','up'],
      ['Equinor','312,80','−0,5 %','dn'],['DNB','218,40','+0,2 %','up'],
      ['Telenor','128,60','±0,0 %','']
    ];
    function tiHtml(arr){
      return arr.map(function(t){
        return '<span class="tc-ti"><b>'+t[0]+'</b> <span class="val">'+t[1]+'</span>'+
          (t[2] ? ' <em class="'+(t[3]||'')+'">'+t[2]+'</em>' : '')+'</span>';
      }).join('');
    }
    var ticker = document.createElement('aside');
    ticker.className = 'tc-ticker';
    ticker.id = 'tc-ticker';
    ticker.setAttribute('aria-label','Markedsdata');
    ticker.innerHTML =
      '<div class="tc-ticker-mask"><div class="tc-ticker-track">'+
        tiHtml(tickerItems)+tiHtml(tickerItems)+
      '</div></div>'+
      '<span class="tc-ticker-badge">Live</span>';
    // Ticker only shows on Homepage (native). Subpages omit it entirely.
    if (!hasNativeTicker) { /* skip — no ticker on subpages */ }
    else { document.body.insertBefore(ticker, document.body.firstChild); ticker.remove(); }

    // 2) Theme + language buttons → inject into nav
    var navEl = document.querySelector('.nav-wrap nav');
    if (!navEl) return;
    var curTheme = document.documentElement.getAttribute('data-theme') || 'carbon';
    var curLang = getStored('hv-lang','no');
    var curLangObj = LANGS.find(function(x){return x.k===curLang;}) || LANGS[0];

    // Build a single theme row: mini palette preview + label + subtitle + check.
    // The preview tile is a real mockup of the theme (bg + ink "text" bar + accent dot)
    // so users see what they're picking, not an abstract dot.
    function themeRowHtml(x, cur){
      var pv = x.pv || {};
      var styleBg = 'background:'+pv.bg+';';
      var styleBar = 'background:'+pv.ink+';';
      var styleDot = 'background:'+pv.accent+';';
      return '<a role="menuitemradio" data-theme="'+x.k+'" aria-checked="'+(x.k===cur?'true':'false')+'" class="'+(x.k===cur?'current':'')+'">'+
          '<span class="tc-pv" style="'+styleBg+'">'+
            '<span class="tc-pv-bar" style="'+styleBar+'"></span>'+
            '<span class="tc-pv-bar tc-pv-bar-short" style="'+styleBar+'"></span>'+
            '<span class="tc-pv-dot" style="'+styleDot+'"></span>'+
          '</span>'+
          '<span class="tc-row-text">'+
            '<span class="tc-row-name">'+x.l+'</span>'+
            '<span class="tc-row-sub">'+(x.sub||'')+'</span>'+
          '</span>'+
          '<svg class="tc-check" width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4.8 4.2 7.8 10 1.5"/></svg>'+
        '</a>';
    }
    function themeGroupHtml(label, items, cur){
      return '<div class="tc-group">'+
          '<h5><span>'+label+'</span><i class="tc-rule"></i></h5>'+
          items.map(function(x){return themeRowHtml(x, cur);}).join('')+
        '</div>';
    }

    var actions = document.createElement('div');
    actions.className = 'tc-actions';
    actions.innerHTML =
      '<div class="tc-wrap">'+
        '<button class="tc-btn" id="tc-theme-btn" aria-expanded="false" aria-haspopup="menu">'+
          '<span class="swatch sw-'+curTheme+'"></span>'+
          '<span id="tc-theme-label">'+(THEMES.find(function(x){return x.k===curTheme;})||THEMES[0]).l+'</span>'+
          '<svg class="chev" width="9" height="6" viewBox="0 0 9 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 1.5 4.5 5 8 1.5"/></svg>'+
        '</button>'+
        '<div class="tc-menu tc-theme-menu" id="tc-theme-menu" role="menu">'+
          themeGroupHtml('Mørke',  THEMES.filter(function(x){return x.group==='dark';}),  curTheme)+
          themeGroupHtml('Lyse',   THEMES.filter(function(x){return x.group==='light';}), curTheme)+
        '</div>'+
      '</div>'+
      '<div class="tc-wrap">'+
        '<button class="tc-btn" id="tc-lang-btn" aria-expanded="false" aria-haspopup="menu">'+
          '<span class="flag"><img src="https://flagcdn.com/w80/'+curLangObj.flag+'.png" alt=""></span>'+
          '<span id="tc-lang-label">'+curLangObj.l+'</span>'+
          '<svg class="chev" width="9" height="6" viewBox="0 0 9 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 1.5 4.5 5 8 1.5"/></svg>'+
        '</button>'+
        '<div class="tc-menu" id="tc-lang-menu" role="menu">'+
          '<h5>Hovedspråk</h5>'+
          LANGS.filter(function(x){return x.group==='main';}).map(function(x){
            return '<a data-lang="'+x.k+'" class="'+(x.k===curLang?'current':'')+'"><span class="flag"><img src="https://flagcdn.com/w80/'+x.flag+'.png" alt=""></span>'+x.l+'</a>';
          }).join('')+
          '<h5>Språk i Norge</h5>'+
          LANGS.filter(function(x){return x.group==='norway';}).map(function(x){
            return '<a data-lang="'+x.k+'" class="'+(x.k===curLang?'current':'')+'"><span class="flag"><img src="https://flagcdn.com/w80/'+x.flag+'.png" alt=""></span>'+x.l+'</a>';
          }).join('')+
          '<h5>Internasjonalt</h5>'+
          LANGS.filter(function(x){return x.group==='intl';}).map(function(x){
            return '<a data-lang="'+x.k+'" class="'+(x.k===curLang?'current':'')+'"><span class="flag"><img src="https://flagcdn.com/w80/'+x.flag+'.png" alt=""></span>'+x.l+'</a>';
          }).join('')+
        '</div>'+
      '</div>';
    navEl.appendChild(actions);

    // ── Menu wiring ──────────────────────────────────
    function wireMenu(btnId, menuId, onPick, dataAttr){
      var btn = document.getElementById(btnId);
      var menu = document.getElementById(menuId);
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', open?'true':'false');
        // Close the sibling menu
        document.querySelectorAll('.tc-menu.open').forEach(function(m){
          if(m!==menu){m.classList.remove('open');
            var sb = document.querySelector('[aria-controls="'+m.id+'"],#'+m.id.replace('-menu','-btn'));
            if(sb) sb.setAttribute('aria-expanded','false');}
        });
      });
      menu.addEventListener('click', function(e){
        var a = e.target.closest('a['+dataAttr+']');
        if(!a) return;
        e.preventDefault();
        onPick(a.getAttribute(dataAttr));
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      });
    }
    wireMenu('tc-theme-btn', 'tc-theme-menu', function(t){
      applyTheme(t, {persist:true});
      document.getElementById('tc-theme-label').textContent = (THEMES.find(function(x){return x.k===t;})||THEMES[0]).l;
      document.querySelectorAll('#tc-theme-menu a').forEach(function(a){
        var on = a.getAttribute('data-theme')===t;
        a.classList.toggle('current', on);
        a.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      var sw = document.querySelector('#tc-theme-btn .swatch');
      sw.className = 'swatch sw-'+t;
    }, 'data-theme');
    wireMenu('tc-lang-btn', 'tc-lang-menu', function(l){
      applyLang(l);
      var obj = LANGS.find(function(x){return x.k===l;}) || LANGS[0];
      document.getElementById('tc-lang-label').textContent = obj.l;
      document.querySelector('#tc-lang-btn .flag img').src = 'https://flagcdn.com/w80/'+obj.flag+'.png';
      document.querySelectorAll('#tc-lang-menu a').forEach(function(a){
        a.classList.toggle('current', a.getAttribute('data-lang')===l);
      });
    }, 'data-lang');

    // Click outside to close
    document.addEventListener('click', function(){
      document.querySelectorAll('.tc-menu.open').forEach(function(m){m.classList.remove('open');});
      document.querySelectorAll('.tc-btn[aria-expanded="true"]').forEach(function(b){b.setAttribute('aria-expanded','false');});
    });

    // ⌘K — wire to existing search-input from shared/search.js (matches "/" hotkey pattern)
    document.addEventListener('keydown', function(e){
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
        var searchInput = document.getElementById('search-input');
        if (searchInput){
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', render);
  else
    render();
})();
