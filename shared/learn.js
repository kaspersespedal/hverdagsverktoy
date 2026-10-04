// ════════ Forklaringsblokkene (lrn) — felles hjelpere ════════
// Siden registrerer en tegnefunksjon med hvtLearn.on(nøkkel, fn). Kalkulatoren sender
// tallene sine med hvtLearn.update(nøkkel, data) etter hver beregning. Flere oppdateringer
// i samme oppgave slås sammen til én tegning, og alt tegnes på nytt når språket byttes.
// (Mikrooppgave, ikke requestAnimationFrame: den står stille i en skjult fane.)
//
// Blokka står under kalkulatoren. Mens den er utenfor skjermen, tegnes den ikke for hvert
// tastetrykk: tegningen venter til blokka er under 200 px fra skjermkanten, eller til det har
// vært stille i 600 ms. Målt på telefon (4× tregere CPU): det meste av tiden per tastetrykk gikk
// til en graf ingen så (INP-median boliglån 88 → 32 ms, effektiv rente 288 → 32 ms), og den
// første tegningen tvang fram en ekstra stil- og layoutrunde midt i DOMContentLoaded.
// near er null til første måling.
(function(){
  var fns = {}, last = {}, queued = {}, waiting = {}, near = null, rest = 0;
  function draw(key){
    if(queued[key] || !fns[key]) return;
    queued[key] = true;
    Promise.resolve().then(function(){ queued[key] = false; fns[key](last[key]); });
  }
  function flush(){
    clearTimeout(rest);
    for(var k in waiting){ delete waiting[k]; draw(k); }
  }
  function run(key){
    if(!fns[key]) return;
    if(near){ draw(key); return; }
    waiting[key] = true;
    clearTimeout(rest);
    rest = setTimeout(flush, 600);
  }
  var blocks = document.querySelectorAll('.lrn');
  if(!blocks.length || typeof IntersectionObserver !== 'function') near = true;
  else {
    var inside = [];
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ inside[Array.prototype.indexOf.call(blocks, e.target)] = e.isIntersecting; });
      near = inside.indexOf(true) > -1;
      if(near) flush();
    }, {rootMargin: '200px 0px'});
    Array.prototype.forEach.call(blocks, function(b){ io.observe(b); });
  }
  // Utskrift skal ha ferske tall, også i en blokk som ikke er tegnet ennå
  window.addEventListener('beforeprint', flush);
  var nf = new Intl.NumberFormat('nb-NO', {maximumFractionDigits: 0});
  // Flertallsformen for tallet n etter reglene til språket som vises: one, two, few, many eller other
  function form(n){
    try { return new Intl.PluralRules(document.documentElement.lang || 'nb').select(n); } catch(e){ return 'other'; }
  }

  window.hvtLearn = {
    update: function(key, data){ last[key] = data; run(key); },
    on: function(key, fn){ fns[key] = fn; if(key in last) run(key); },
    // Hele kroner med norsk tusenskille og ekte minus
    kr: function(n){ return nf.format(Math.round(n)); },
    // Desimaltall med komma
    dec: function(x, d){ return x.toFixed(d).replace('.', ',').replace('-', '−'); },
    // Setning fra språkfila (R()[nøkkel]) med norsk reserve. {navn} byttes med verdiene i vars.
    // Har vars et tall n, vinner nøkkel_one, _few osv. når språkfila har den formen
    // (polsk 2 lata / 5 lat, ukrainsk 2 роки / 5 років, arabisk 3 سنوات / 11 سنة).
    t: function(key, fb, vars){
      var r = typeof window.R === 'function' ? window.R() : null;
      var s = (r && vars && typeof vars.n === 'number' && r[key + '_' + form(vars.n)]) || (r && r[key]) || fb;
      if(vars) for(var k in vars) s = s.split('{' + k + '}').join(vars[k]);
      return s;
    },
    // Kort etikett oversatt med frase-ordboka (samme oppslag som core.js gjør), slik at
    // grafen måler og plasserer ordet på riktig språk
    ph: function(s){
      var r = typeof window.R === 'function' ? window.R() : null;
      return (r && r._ph && r._ph[s]) || s;
    }
  };

  // core.js setter lang på <html> når en språkfil er lastet. Da tegnes setningene på nytt.
  new MutationObserver(function(){ for(var k in fns) run(k); })
    .observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
})();
