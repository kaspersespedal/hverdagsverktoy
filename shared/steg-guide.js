// Steg-for-steg-veiledning: en lenke til #id inne i en lukket <details> (f.eks. #skattemelding
// eller #cc-sjekk) åpner nedtrekket og alle nedtrekk rundt det før siden ruller dit.
(function(){
  function target(hash){
    if(!hash || hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch(e){ return null; }
  }
  function openTo(el){
    for(var n = el; n; n = n.parentElement){ if(n.tagName === 'DETAILS') n.open = true; }
  }
  function go(hash){
    var el = target(hash);
    if(!el) return;
    openTo(el);
    el.scrollIntoView({block:'start'});
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    var el = a && target(a.getAttribute('href'));
    if(el) openTo(el);
  });
  window.addEventListener('hashchange', function(){ go(location.hash); });
  // Første lasting: åpne med en gang, men rull først når siden er ferdig lastet.
  // Nettleserens eget hopp skjer før nedtrekket er åpent og treffer derfor ikke.
  var first = target(location.hash);
  if(first){
    openTo(first);
    var scroll = function(){ setTimeout(function(){ go(location.hash); }, 0); };
    if(document.readyState === 'complete') scroll(); else window.addEventListener('load', scroll);
  }
})();
