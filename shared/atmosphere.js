/* Cursor-anchored light — lerp 0.06, lags 200-400ms.
   Disabled <1024px and under prefers-reduced-motion. Pauses on hidden tab.
   Source: hv_oppdatert_design/Homepage.html (v3, 2026-04-30). */
(function(){
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WIDE   = matchMedia('(min-width: 1024px)').matches;
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
