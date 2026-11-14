// «Lag regnskapet» — viser hvor langt de tre delene er kommet, i fanene (.rf-v).
// Leser bare det resultat-, balanse- og kontantstrømsiden selv lagrer i nettleseren:
//   hv-rr-arsresultat   {belop, forSkatt, avskr}   fra /regnskap/resultat/
//   hv-balanse-sum      {eiend, diff, bank, tom}   fra /regnskap/balanse/
//   hv-kontantstrom-sum {ub, any}                  fra /regnskap/kontantstrom/
(function(){
  function read(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
  function kr(n){ return Math.round(n).toLocaleString('nb-NO') + ' kr'; }
  function set(name, txt){
    document.querySelectorAll('[data-rf="' + name + '"]').forEach(function(e){ if(e.textContent !== txt) e.textContent = txt; });
  }
  function paint(){
    var r = read('hv-rr-arsresultat'), b = read('hv-balanse-sum'), k = read('hv-kontantstrom-sum');
    set('res', (r && typeof r.belop === 'number') ? 'Årsresultat ' + kr(r.belop) : '');
    set('bal', (b && !b.tom && typeof b.diff === 'number') ? (Math.abs(b.diff) < 1 ? 'Balansen stemmer' : 'Avvik ' + kr(Math.abs(b.diff))) : '');
    set('ks',  (k && k.any && typeof k.ub === 'number') ? 'Kontanter ' + kr(k.ub) : '');
  }
  function later(){ setTimeout(paint, 0); }   // etter at siden selv har regnet og lagret
  document.addEventListener('input', later);
  document.addEventListener('click', later);
  window.addEventListener('storage', paint);
  window.addEventListener('pageshow', paint);
  paint();
})();
