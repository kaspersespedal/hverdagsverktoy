/* Atmosphere v5 — "nordlys sett gjennom dis" (2026-07-02).
   Denne fila EIER auroraen: injiserer .a5-lagene inni .atmo + en
   <style id="a5Style"> SIST i <head> (vinner cascade over site-shell-
   kopien og de 18 inline-kopiene). Legacy .band-elementer skjules av
   injisert CSS men beholdes i DOM (re-injeksjonsguarden under +
   body.atmo-on-reglene forventer dem). Faller JS bort viser CSS-filene
   fortsatt legacy-auroraen — graceful degradering.
   Fire lag: .a5-haze (dyp dis), .a5-arc (conic gardin-stråler),
   .a5-va/.a5-vb (slør i motfase). Anti-pendel-håndverk: asymmetriske
   keyframes (4-5 stopp, ulik avstand), co-prime perioder
   (29/37/43/47/53/59/61/73/101 s), rotasjon+skala i tillegg til translate,
   falloff til hsla(token,0). Farger: KUN eksisterende --atmo-*-tokens.
   Kun transform/opacity animeres. --a5-gain (default 1) = intensitets-
   knott per side. Batteri: html.a5-paused ved document.hidden.
   Cursor-light-logikken er uendret fra v3 (lerp 0.06, av <1024px,
   pause on hidden). Kilde v3: hv_oppdatert_design/Homepage.html. */
(function(){
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WIDE   = matchMedia('(min-width: 1024px)').matches;

  /* .ks-template ships uten aurora-markup — injiser legacy-settet en gang
     hvis det mangler, så synlighets-kontrakten (.atmo) finnes på alle sider.
     .atmo-base beholdes som instant-paint-fallback (males av ren CSS-fil). */
  if(document.body && !document.querySelector('.atmo') && !document.body.classList.contains('embed')){
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="atmo-base" aria-hidden="true"></div>'+
      '<div class="atmo" aria-hidden="true">'+
        '<div class="band band-a"><div class="band-inner"></div></div>'+
        '<div class="band band-b"><div class="band-inner"></div></div>'+
        '<div class="cursor-light" id="cursorLight"></div>'+
      '</div>'+
      '<svg class="film-grain" aria-hidden="true" preserveAspectRatio="none">'+
        '<filter id="atmoGrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/></filter>'+
        '<rect width="100%" height="100%" filter="url(#atmoGrain)"/>'+
      '</svg>');
  }

  /* ── AURORA v5 CSS — injiseres sist i head så den vinner over alle
     eldre kopier. Nye klasse-/keyframe-navn (a5-prefiks) unngår kollisjon
     med bandA-/bandB-keyframes som er definert 3 steder (site-shell,
     atmosphere.css, inline i 18 sider). Single source = denne strengen. */
  var A5_CSS = [
    '/* AURORA v5 (injisert av atmosphere.js) */',
    'html body .atmo .band{display:none !important}',
    '.a5{position:absolute;inset:0;pointer-events:none;animation:a5In 1.6s ease-out .35s both}',
    '.a5>div{position:absolute;mix-blend-mode:screen;will-change:transform,opacity;transform-origin:center}',
    '.a5-haze{width:170vw;height:120vh;left:-35vw;top:-25vh;',
    '  background:radial-gradient(ellipse 55% 45% at 50% 42%, hsla(var(--atmo-band-b), .6) 0%, hsla(var(--atmo-band-b), 0) 68%);',
    '  opacity:calc(var(--atmo-band-b-op) * .9 * var(--a5-gain, 1));animation:a5Haze 61s ease-in-out infinite}',
    '.a5-arc{width:120vw;height:64vh;left:-10vw;top:-6vh;transform-origin:50% -38%;',
    '  background:conic-gradient(from 162deg at 50% -38%,',
    '    hsla(var(--atmo-band-a), 0) 0deg, hsla(var(--atmo-band-a), .5) 7deg, hsla(var(--atmo-band-a), 0) 16deg,',
    '    hsla(var(--atmo-band-b), .35) 23deg, hsla(var(--atmo-band-b), 0) 33deg,',
    '    hsla(var(--atmo-band-a), .28) 40deg, hsla(var(--atmo-band-a), 0) 46deg);',
    '  -webkit-mask-image:radial-gradient(circle at 50% -38%, transparent 34%, #000 48%, #000 72%, transparent 88%);',
    '  mask-image:radial-gradient(circle at 50% -38%, transparent 34%, #000 48%, #000 72%, transparent 88%);',
    '  opacity:calc(var(--atmo-band-a-op) * .85 * var(--a5-gain, 1));animation:a5Arc 101s ease-in-out infinite}',
    '.a5-va{width:150vw;height:55vh;left:-25vw;top:6%;animation:a5DriftA 73s ease-in-out infinite}',
    '.a5-vb{width:125vw;height:46vh;left:-8vw;top:32%;animation:a5DriftB 59s ease-in-out infinite;animation-delay:-31s}',
    '.a5-i{position:absolute;inset:0;will-change:transform,opacity;transform-origin:45% 55%}',
    '.a5-va .a5-i{background:radial-gradient(ellipse 62% 44% at 42% 52%, hsl(var(--atmo-band-a)) 0%, hsla(var(--atmo-band-a), 0) 67%);',
    '  opacity:calc(var(--atmo-band-a-op) * var(--a5-gain, 1));',
    '  animation:a5SwayA 47s ease-in-out infinite, a5BreatheA 29s ease-in-out infinite}',
    '.a5-vb .a5-i{background:radial-gradient(ellipse 58% 46% at 56% 48%, hsl(var(--atmo-band-b)) 0%, hsla(var(--atmo-band-b), 0) 66%);',
    '  opacity:calc(var(--atmo-band-b-op) * var(--a5-gain, 1));',
    '  animation:a5SwayB 43s ease-in-out infinite, a5BreatheB 37s ease-in-out infinite;animation-delay:-17s,-11s}',
    '@keyframes a5In{from{opacity:0}to{opacity:1}}',
    '@keyframes a5Haze{0%{transform:translate3d(0,0,0) scale(1)}41%{transform:translate3d(1.6%,-1.1%,0) scale(1.05)}73%{transform:translate3d(-1.2%,.9%,0) scale(.965)}100%{transform:translate3d(0,0,0) scale(1)}}',
    '@keyframes a5Arc{0%{transform:rotate(-2.1deg) translate3d(-1.4%,0,0)}31%{transform:rotate(.6deg) translate3d(.9%,.5%,0)}58%{transform:rotate(2deg) translate3d(1.7%,-.4%,0)}83%{transform:rotate(-.6deg) translate3d(-.5%,.3%,0)}100%{transform:rotate(-2.1deg) translate3d(-1.4%,0,0)}}',
    '@keyframes a5DriftA{0%{transform:translate3d(-5.5%,0,0) rotate(-1.4deg)}27%{transform:translate3d(2.4%,-1.1%,0) rotate(.5deg)}52%{transform:translate3d(5.5%,.7%,0) rotate(1.6deg)}74%{transform:translate3d(-1.6%,1.4%,0) rotate(.1deg)}100%{transform:translate3d(-5.5%,0,0) rotate(-1.4deg)}}',
    '@keyframes a5DriftB{0%{transform:translate3d(4.8%,.6%,0) rotate(1.2deg)}23%{transform:translate3d(-2.2%,-.9%,0) rotate(-.3deg)}56%{transform:translate3d(-5%,.4%,0) rotate(-1.5deg)}81%{transform:translate3d(1.4%,1.2%,0) rotate(.4deg)}100%{transform:translate3d(4.8%,.6%,0) rotate(1.2deg)}}',
    '@keyframes a5SwayA{0%{transform:translate3d(0,-2%,0) scale(1)}33%{transform:translate3d(0,1.2%,0) scale(1.045)}61%{transform:translate3d(0,2.1%,0) scale(.985)}85%{transform:translate3d(0,-.7%,0) scale(1.02)}100%{transform:translate3d(0,-2%,0) scale(1)}}',
    '@keyframes a5SwayB{0%{transform:translate3d(0,1.8%,0) scale(1.03)}29%{transform:translate3d(0,-1.4%,0) scale(.99)}63%{transform:translate3d(0,-2.2%,0) scale(1.05)}86%{transform:translate3d(0,.9%,0) scale(1)}100%{transform:translate3d(0,1.8%,0) scale(1.03)}}',
    '@keyframes a5BreatheA{0%{opacity:calc(var(--atmo-band-a-op) * var(--a5-gain, 1))}38%{opacity:calc(var(--atmo-band-a-op-breathe) * var(--a5-gain, 1))}57%{opacity:calc((var(--atmo-band-a-op) + var(--atmo-band-a-op-breathe)) / 2 * var(--a5-gain, 1))}82%{opacity:calc(var(--atmo-band-a-op-breathe) * .94 * var(--a5-gain, 1))}100%{opacity:calc(var(--atmo-band-a-op) * var(--a5-gain, 1))}}',
    '@keyframes a5BreatheB{0%{opacity:calc(var(--atmo-band-b-op-breathe) * var(--a5-gain, 1))}26%{opacity:calc(var(--atmo-band-b-op) * var(--a5-gain, 1))}54%{opacity:calc(var(--atmo-band-b-op-breathe) * .9 * var(--a5-gain, 1))}79%{opacity:calc((var(--atmo-band-b-op) + var(--atmo-band-b-op-breathe)) / 2 * var(--a5-gain, 1))}100%{opacity:calc(var(--atmo-band-b-op-breathe) * var(--a5-gain, 1))}}',
    '@media (max-width:768px){',
    '  .a5-arc,.a5-haze{display:none}',
    '  .a5-va{animation-duration:109s}',
    '  .a5-vb{animation-duration:89s}',
    '  .a5-va .a5-i{animation:a5SwayA 71s ease-in-out infinite}',
    '  .a5-vb .a5-i{animation:a5SwayB 67s ease-in-out infinite}',
    '}',
    '@media (prefers-reduced-motion:reduce){',
    '  .a5,.a5>div,.a5 .a5-i{animation:none !important}',
    '  .a5-arc{display:none}',
    '  .a5-va .a5-i{opacity:.04 !important}',
    '  .a5-vb .a5-i{opacity:.025 !important}',
    '}',
    '@media (prefers-reduced-data:reduce),(update:slow){',
    '  .a5,.a5>div,.a5 .a5-i{animation:none !important}',
    '  .a5-arc{display:none}',
    '}',
    'html.a5-paused .a5,html.a5-paused .a5 *{animation-play-state:paused}'
  ].join('\n');

  if(!document.getElementById('a5Style')){
    var st = document.createElement('style');
    st.id = 'a5Style';
    st.appendChild(document.createTextNode(A5_CSS));
    document.head.appendChild(st);
  }
  /* Markup: .a5 først i .atmo — cursor-light (senere søsken) maler over. */
  var atmo = document.querySelector('.atmo');
  if(atmo && !atmo.querySelector('.a5')){
    atmo.insertAdjacentHTML('afterbegin',
      '<div class="a5" aria-hidden="true">'+
        '<div class="a5-haze"></div>'+
        '<div class="a5-arc"></div>'+
        '<div class="a5-va"><div class="a5-i"></div></div>'+
        '<div class="a5-vb"><div class="a5-i"></div></div>'+
      '</div>');
  }

  /* Batteri: pause alle v5-animasjoner når fanen er skjult.
     (Egen listener FØR cursor-light-guarden — den skal kjøre også på
     sider/bredder uten cursor-light.) Sett også ved boot: en fane som
     åpnes i bakgrunnen skal ikke animere før den faktisk vises. */
  if(document.hidden){ document.documentElement.classList.add('a5-paused'); }
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ document.documentElement.classList.add('a5-paused'); }
    else { document.documentElement.classList.remove('a5-paused'); }
  });

  /* ── Cursor-anchored light — uendret fra v3 (lerp 0.06, lags 200-400ms).
     Disabled <1024px og under prefers-reduced-motion. Pauses on hidden tab. */
  var light  = document.getElementById('cursorLight');
  if(!light) return;
  if(REDUCE || !WIDE){ light.style.display = 'none'; return; }

  var targetX = window.innerWidth  / 2;
  var targetY = window.innerHeight / 2;
  var curX = targetX, curY = targetY;
  var raf = null, paused = false;

  function tick(){
    if(paused){ raf = null; return; }
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;
    light.style.transform =
      'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0)';
    if(Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5){
      raf = requestAnimationFrame(tick);
    } else { raf = null; }
  }
  function onMove(e){
    targetX = e.clientX; targetY = e.clientY;
    if(!raf && !paused) raf = requestAnimationFrame(tick);
  }
  window.addEventListener('mousemove', onMove, {passive:true});
  document.addEventListener('visibilitychange', function(){
    paused = document.hidden;
    if(paused){ if(raf){ cancelAnimationFrame(raf); raf = null; } }
    else if(Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5){
      raf = requestAnimationFrame(tick);
    }
  });
  light.style.transform =
    'translate3d(' + targetX + 'px,' + targetY + 'px,0)';
})();

/* ─────────────────────────────────────────────────────────────
   hv-entrance — støtteskript for entrance-koreografi v2 (ES5)
   Oppgaver:
   1. Setter body.hv-entered når koreografien er ferdig (~1,4 s)
      → CSS (site-shell.css) fjerner flare-laget (fixed ::before)
        slik at backdrop-filter-barene slipper et permanent lag.
   2. Skjult fane ved last (restored tab / cmd-klikk i bakgrunn)
      eller reduced-motion → hopp rett til slutt-tilstand.
   3. Går fanen i bakgrunnen MIDT i entreen → avslutt umiddelbart.
   Ingen kontinuerlig main-thread-arbeid: én setTimeout + én
   (selv-fjernende) visibilitychange-lytter. På sider uten
   .page-content er klassen et no-op.
   ───────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  /* > siste delay (0,80 s) + lengste varighet (0,55 s) + margin */
  var DONE_MS = 1400;

  function markEntered(){
    var b = document.body;
    if (b && !b.classList.contains('hv-entered')){
      b.classList.add('hv-entered');
    }
  }

  function boot(){
    var reduce = false;
    try{
      reduce = !!(window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }catch(e){ /* eldre nettlesere: anta full motion */ }

    /* Skjult fane eller reduced-motion: ferdig-tilstand med én gang */
    if (reduce || document.hidden){
      markEntered();
      return;
    }

    setTimeout(markEntered, DONE_MS);

    /* Batteri: fane i bakgrunnen midt i entré → avslutt nå.
       Lytteren fjerner seg selv — ingen varig kostnad. */
    function onVis(){
      if (document.hidden){
        markEntered();
        document.removeEventListener('visibilitychange', onVis);
      }
    }
    document.addEventListener('visibilitychange', onVis);
    setTimeout(function(){
      document.removeEventListener('visibilitychange', onVis);
    }, DONE_MS + 100);
  }

  if (document.body){ boot(); }
  else { document.addEventListener('DOMContentLoaded', boot); }
})();
