/* ═══════════════════════════════════════════════════════════
   Hverdagsverktøy — Søkemodul
   Instant client-side search across all tools and concepts.
   © 2026 Kasper Skjæveland Espedal. All rights reserved.
   ═══════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ─── Search index ─── */
var SEARCH_DATA = [
  // ══════ VERKTØY (Nivå 1 — høyest prioritet) ══════
  // Personlig økonomi
  {name:'Budsjett',desc:'Lag et personlig budsjett med inntekter og utgifter',url:'/personlig/#budsjett-wrapper',tags:'budsjett økonomi personlig inntekt utgift spare penger husholdning',type:'tool',page:'Personlig økonomi'},
  {name:'Bilkostnad',desc:'Beregn hva bilen din faktisk koster per måned og km',url:'/personlig/#bil-wrapper',tags:'bil bilkostnad bilhold kjøretøy drivstoff forsikring bompenger vedlikehold bensin diesel elbil km kilometer',type:'tool',page:'Personlig økonomi'},
  {name:'Sparekalkulator',desc:'Se kraften i rentes rente over tid',url:'/personlig/#spare-wrapper',tags:'spare sparing rentes rente avkastning fond aksjer investering månedlig',type:'tool',page:'Personlig økonomi'},
  {name:'Studielån',desc:'Beregn stipend, lån og nedbetalingsplan fra Lånekassen',url:'/personlig/#studie-wrapper',tags:'studielån lånekassen stipend student studie nedbetaling lån utdanning',type:'tool',page:'Personlig økonomi'},
  {name:'Lønn etter skatt',desc:'Se hva du faktisk får utbetalt fra timelønnen din',url:'/personlig/#lonn-wrapper',tags:'lønn timelønn netto brutto utbetalt lønn etter skatt nettolønn hva får jeg',type:'tool',page:'Personlig økonomi'},
  {name:'Abonnementskalkulator',desc:'Se totalkostnaden for alle abonnementene dine',url:'/personlig/#abo-wrapper',tags:'abonnement streaming netflix spotify hbo viaplay subscription månedskostnad',type:'tool',page:'Personlig økonomi'},

  // Boliglån
  {name:'Boliglånskalkulator',desc:'Beregn månedlig betaling, rente og totalkostnad',url:'/boliglan/#mor-wrapper',tags:'boliglån lån bolig hus leilighet rente annuitet serielån avdrag nedbetaling månedlig betaling',type:'tool',page:'Boliglån'},
  {name:'Dokumentavgift',desc:'Beregn tinglysning og dokumentavgift ved boligkjøp',url:'/boliglan/#dok-wrapper',tags:'dokumentavgift tinglysing tinglysningsgebyr attestgebyr boligkjøp eiendom selveier borettslag',type:'tool',page:'Boliglån'},

  // Kalkulator
  {name:'Enkel kalkulator',desc:'Standard kalkulator med grunnleggende regning',url:'/kalkulator/',tags:'kalkulator regnemaskin pluss minus gange dele prosent',type:'tool',page:'Kalkulator'},
  {name:'Vitenskapelig kalkulator',desc:'Sin, cos, log, potenser og mer',url:'/kalkulator/#scientific',tags:'vitenskapelig kalkulator sin cos tan log ln potens kvadratrot pi',type:'tool',page:'Kalkulator'},
  {name:'Valutakalkulator',desc:'Regn om mellom valutaer med oppdaterte kurser',url:'/kalkulator/#unit',tags:'valuta valutaomregner kurs dollar euro pund usd eur gbp sek dkk',type:'tool',page:'Kalkulator'},
  {name:'Finansiell kalkulator',desc:'Nåverdi, fremtidsverdi og annuitetsberegninger',url:'/kalkulator/#finance',tags:'finansiell kalkulator nåverdi fremtidsverdi annuitet rente perioder',type:'tool',page:'Kalkulator'},
  {name:'Ansattkostnad (AGA)',desc:'Beregn total årskostnad for en ansatt inkl. AGA og OTP',url:'/kalkulator/#aga',tags:'ansattkostnad aga arbeidsgiveravgift otp pensjon feriepenger lønn kostnad ansatt arbeidsgiver',type:'tool',page:'Kalkulator'},
  {name:'Avskrivning',desc:'Regnskapsmessig og skattemessig avskrivning',url:'/kalkulator/#avs',tags:'avskrivning saldoavskrivning lineær saldo avskrivningsgruppe driftsmiddel restverdi levetid anleggsmiddel',type:'tool',page:'Kalkulator'},
  {name:'Feriepenger',desc:'Beregn feriepenger ut fra årslønn og ferieordning',url:'/kalkulator/#ferie',tags:'feriepenger ferie ferielov ferieordning over 60 bonus ferietillegg 10.2 12 prosent',type:'tool',page:'Kalkulator'},
  {name:'Effektiv rente',desc:'Se hva lånet faktisk koster inkl. gebyrer',url:'/kalkulator/#rente',tags:'effektiv rente nominell rente gebyr etableringsavgift lånekostnad',type:'tool',page:'Kalkulator'},
  {name:'Valutagevinst',desc:'Beregn gevinst eller tap ved kjøp og salg av valuta',url:'/kalkulator/#valgevinst',tags:'valutagevinst valutatap valuta kjøp salg kurs gevinst skatt 22',type:'tool',page:'Kalkulator'},
  {name:'Likviditetsbudsjett',desc:'Oversikt over penger inn og ut måned for måned',url:'/kalkulator/#likvid',tags:'likviditet likviditetsbudsjett kontantstrøm cashflow inn ut måned balanse',type:'tool',page:'Kalkulator'},
  {name:'NPV / IRR',desc:'Lønnsomhetsanalyse med netto nåverdi og internrente',url:'/kalkulator/#npv',tags:'npv irr nåverdi internrente investering lønnsomhet kontantstrøm diskonteringsrente tilbakebetalingstid',type:'tool',page:'Kalkulator'},
  {name:'Pensjonskalkulator',desc:'Beregn forventet pensjon og pensjonssparing',url:'/kalkulator/#pensjon',tags:'pensjon pensjonsalder otp innskuddspensjon alderspensjon folketrygd afp tjenestepensjon',type:'tool',page:'Kalkulator'},
  {name:'Lønn vs Utbytte',desc:'Sammenlign skatt på lønn mot utbytte fra eget AS',url:'/kalkulator/#lvu',tags:'lønn utbytte aksjeselskap as eier utdeling uttak skatt sammenlign optimal',type:'tool',page:'Kalkulator'},

  // Skatt
  {name:'Skattkalkulator',desc:'Beregn skatt på årsinntekt med trinnskatt',url:'/skatt/#sal-salary-card',tags:'skatt skattkalkulator trinnskatt trygdeavgift brutto netto inntektsskatt',type:'tool',page:'Skatt'},
  {name:'Uttakskalkulator',desc:'Skatt ved uttak av eiendeler fra virksomhet',url:'/skatt/#sal-uttak-card',tags:'uttak skatt virksomhet eiendeler sktl 5-2',type:'tool',page:'Skatt'},
  {name:'Effektiv skatt ved utdeling',desc:'Aksjonærmodellen og foretaksmodellen',url:'/skatt/#sal-utdeling-card',tags:'utdeling utbytte aksjonærmodellen foretaksmodellen selskapsskatt effektiv skatt',type:'tool',page:'Skatt'},
  {name:'Formueskatt',desc:'Beregn formueskatt med verdsettelsesrabatter',url:'/skatt/#formue-wrapper',tags:'formue formueskatt verdsettelsesrabatt bolig aksjer eiendom gjeld bunnfradrag',type:'tool',page:'Skatt'},
  {name:'Reisefradrag',desc:'Fradrag for reise mellom hjem og arbeidssted',url:'/skatt/#reise-wrapper',tags:'reisefradrag pendler reise arbeid km kilometer bom bompenger fradrag',type:'tool',page:'Skatt'},

  // Avgift
  {name:'MVA-kalkulator',desc:'Beregn MVA-beløp og priser inkl/ekskl. avgift',url:'/avgift/#vat-wrapper',tags:'mva moms merverdiavgift avgift vat 25 15 12 prosent inkludert ekskludert',type:'tool',page:'Avgift'},
  {name:'Justeringskalkulator',desc:'Justering av inngående MVA ved bruksendring',url:'/avgift/#vat-adj-card',tags:'justering mva inngående bruksendring kapitalvare justeringsperiode mval kap 9',type:'tool',page:'Avgift'},

  // Selskap
  {name:'Aksjeselskap (AS)',desc:'Stiftelse, drift, ansvar og regler for aksjeselskap',url:'/selskap/',tags:'aksjeselskap as stiftelse styret generalforsamling aksjekapital vedtekter',type:'tool',page:'Selskap'},

  // ══════ BEGREPER (Nivå 2 — fagtermer) ══════
  // Skatt
  {name:'Trinnskatt',desc:'Progressiv skatt som øker med inntekten — 4 trinn',url:'/skatt/',tags:'trinnskatt trinn progressiv skatt inntekt sats',type:'concept',page:'Skatt'},
  {name:'Skattefradrag',desc:'Fradrag som reduserer skatten din direkte',url:'/skatt/#fradrag',tags:'skattefradrag fradrag redusere skatt',type:'concept',page:'Skatt'},
  {name:'Minstefradrag',desc:'Standardfradrag alle lønnsmottakere får automatisk',url:'/skatt/',tags:'minstefradrag standard fradrag lønn automatisk',type:'concept',page:'Skatt'},
  {name:'Trygdeavgift',desc:'Avgift til folketrygden — 7.9% av lønn',url:'/skatt/',tags:'trygdeavgift folketrygden nav 7.9 prosent',type:'concept',page:'Skatt'},
  {name:'Egenkapital',desc:'Minimumskapital du må ha ved boligkjøp (15%)',url:'/boliglan/',tags:'egenkapital 15 prosent boligkjøp krav bank',type:'concept',page:'Boliglån'},
  {name:'BSU — Boligsparing for ungdom',desc:'Skattefradrag på 20% av innskudd, maks 27 500 kr/år',url:'/boliglan/#mor-wrapper',tags:'bsu boligsparing ungdom skattefradrag 20 prosent sparing bolig',type:'concept',page:'Boliglån'},
  {name:'Gjeldsgrad',desc:'Forholdet mellom total gjeld og bruttoinntekt (maks 5x)',url:'/boliglan/',tags:'gjeldsgrad gjeld inntekt 5 ganger krav bank boliglån',type:'concept',page:'Boliglån'},
  {name:'Stresstest',desc:'Banken tester om du tåler 3 prosentpoeng renteøkning',url:'/boliglan/',tags:'stresstest rente økning bank test tåle boliglån',type:'concept',page:'Boliglån'},
  {name:'Aksjonærmodellen',desc:'Modell for beskatning av utbytte til personlige aksjonærer',url:'/skatt/#sal-utdeling-card',tags:'aksjonærmodellen utbytte skjermingsfradrag oppjusteringsfaktor aksjonær',type:'concept',page:'Skatt'},
  {name:'Foretaksmodellen',desc:'Modell for beskatning av enkeltpersonforetak',url:'/skatt/#sal-utdeling-card',tags:'foretaksmodellen enkeltpersonforetak enk selvstending næring',type:'concept',page:'Skatt'},
  {name:'Verdsettelsesrabatt',desc:'Rabatt på formuesverdi for aksjer, bolig og driftsmidler',url:'/skatt/#formue-wrapper',tags:'verdsettelsesrabatt formue aksjer bolig rabatt reduksjon',type:'concept',page:'Skatt'},
  {name:'Saldoavskrivning',desc:'Skattemessig avskrivning med fast prosent av restverdi',url:'/kalkulator/#avs',tags:'saldoavskrivning skattemessig avskrivning saldo degressiv restverdi saldogruppe',type:'concept',page:'Kalkulator'},
  {name:'OTP — Obligatorisk tjenestepensjon',desc:'Arbeidsgiver må spare minst 2% av lønn over 1G til pensjon',url:'/kalkulator/#aga',tags:'otp obligatorisk tjenestepensjon arbeidsgiver 2 prosent 1g pensjon',type:'concept',page:'Kalkulator'},
  {name:'Arbeidsgiveravgift (AGA)',desc:'Avgift arbeidsgiver betaler på lønn — varierer etter sone',url:'/kalkulator/#aga',tags:'arbeidsgiveravgift aga sone avgift arbeidsgiver lønn 14.1',type:'concept',page:'Kalkulator'},
  {name:'Rentes rente',desc:'Avkastning på avkastning — effekten som gjør sparing kraftig over tid',url:'/personlig/#spare',tags:'rentes rente compound interest sparing effekt tid avkastning',type:'concept',page:'Personlig økonomi'},
  {name:'Annuitetslån',desc:'Lån med like store månedlige betalinger hele perioden',url:'/boliglan/',tags:'annuitetslån annuitet fast betaling like stor måned',type:'concept',page:'Boliglån'},
  {name:'Serielån',desc:'Lån med like store avdrag — totalt billigere enn annuitet',url:'/boliglan/',tags:'serielån serie avdrag billigere synkende betaling',type:'concept',page:'Boliglån'},
  {name:'Næring eller hobby?',desc:'Når blir biinntekt skattepliktig næringsvirksomhet?',url:'/skatt/#naering-hobby',tags:'næring hobby biinntekt skattepliktig virksomhet grense',type:'concept',page:'Skatt'},
  {name:'Konsernbidrag',desc:'Overføring av overskudd mellom selskaper i samme konsern',url:'/skatt/',tags:'konsernbidrag konsern overføring selskap morselskap datterselskap',type:'concept',page:'Skatt'},
  {name:'Fritaksmetoden',desc:'Selskaper slipper skatt på aksjeutbytte og -gevinst',url:'/skatt/',tags:'fritaksmetoden fritak skatt utbytte aksjegevinst selskap',type:'concept',page:'Skatt'},

  // Avgift-begreper
  {name:'MVA-satser',desc:'25% generell, 15% mat, 12% transport/kultur, 0% eksport',url:'/avgift/',tags:'mva satser 25 15 12 0 prosent mat transport kultur eksport',type:'concept',page:'Avgift'},
  {name:'Omsetningsgrense MVA',desc:'Registreringsplikt ved omsetning over 50 000 kr',url:'/avgift/',tags:'omsetningsgrense mva registrering 50000 plikt næring',type:'concept',page:'Avgift'},
  {name:'Fradragsrett MVA',desc:'Rett til å trekke fra inngående MVA på bedriftskjøp',url:'/avgift/',tags:'fradragsrett mva inngående utgående trekke fra bedrift',type:'concept',page:'Avgift'},

  // ══════ LOVHENVISNINGER (Nivå 3) ══════
  {name:'Skatteloven kap. 2 — Skatteplikt',desc:'Hvem er skattepliktige til Norge?',url:'/skatt/#law-skatteplikt',tags:'skatteloven kap 2 skatteplikt bosted selskap',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 4 — Formue',desc:'Verdsettelse av formue, aksjer, bolig og rabatter',url:'/skatt/#law-formue',tags:'skatteloven kap 4 formue verdsettelse bolig aksjer',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 5 — Inntekt',desc:'Skattepliktig inntekt, lønn, kapital og skattefrie ytelser',url:'/skatt/#law-inntekt',tags:'skatteloven kap 5 inntekt lønn kapital ytelser',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 6 — Fradrag',desc:'Minstefradrag, gjeldsrenter og særfradrag',url:'/skatt/#law-fradrag',tags:'skatteloven kap 6 fradrag minstefradrag gjeldsrenter',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 9 — Gevinst og tap',desc:'Realisasjon, boligsalg, arv, gave og utflytting',url:'/skatt/#law-gevinst',tags:'skatteloven kap 9 gevinst tap realisasjon boligsalg arv',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 10 — Selskaper',desc:'Utbytte, aksjegevinst, konsernbidrag og NOKUS',url:'/skatt/#law-selskaper',tags:'skatteloven kap 10 selskaper utbytte aksjegevinst konsernbidrag nokus',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 14 — Saldoavskrivning',desc:'Saldogrupper, satser og gevinst/tap ved realisasjon',url:'/skatt/#law-saldo',tags:'skatteloven kap 14 saldoavskrivning saldogrupper avskrivningssatser',type:'law',page:'Skatt'},
  {name:'Merverdiavgiftsloven kap. 2 — Registrering',desc:'Fellesregistrering, frivillig registrering og forhåndsregistrering',url:'/avgift/#law-registrering',tags:'merverdiavgiftsloven mval kap 2 registrering fellesregistrering',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 3 — Unntak',desc:'Hva er unntatt fra MVA-loven?',url:'/avgift/#law-unntak',tags:'merverdiavgiftsloven mval kap 3 unntak uttak innførsel',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 6 — Fritak',desc:'Nullsats — 0% utgående, full fradragsrett',url:'/avgift/#law-fritak',tags:'merverdiavgiftsloven mval kap 6 fritak nullsats eksport',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 8 — Fradrag',desc:'Hovedregel, delt bruk og begrensninger',url:'/avgift/#law-fradrag',tags:'merverdiavgiftsloven mval kap 8 fradrag delt bruk',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 9 — Justering',desc:'Kapitalvarer og justeringsperioder',url:'/avgift/#law-justering',tags:'merverdiavgiftsloven mval kap 9 justering kapitalvarer',type:'law',page:'Avgift'},
  {name:'Regnskapsloven § 5-3 — Avskrivning',desc:'Anleggsmidler med begrenset levetid skal avskrives',url:'/kalkulator/#avs',tags:'regnskapsloven rskl 5-3 avskrivning anleggsmidler levetid',type:'law',page:'Kalkulator'}
];

/* ─── Foreslåtte (popular searches) ─── */
var SUGGESTED = [
  {label:'Lønn etter skatt', url:'/skatt/#sal-salary-card'},
  {label:'Boliglån',         url:'/boliglan/#mor-wrapper'},
  {label:'BSU',              url:'/boliglan/#mor-wrapper'},
  {label:'MVA',              url:'/avgift/#vat-wrapper'},
  {label:'Bilkostnad',       url:'/personlig/#bil-wrapper'},
  {label:'Feriepenger',      url:'/kalkulator/#ferie'},
  {label:'Budsjett',         url:'/personlig/#budsjett-wrapper'},
  {label:'Studielån',        url:'/personlig/#studie-wrapper'}
];

/* ─── Type labels and icons ─── */
var TYPE_META = {
  tool:    {label:'Verktøy', icon:'⚡'},
  concept: {label:'Begrep',  icon:'📖'},
  law:     {label:'Lov',     icon:'⚖️'}
};

/* ─── Normalize string for matching ─── */
function norm(s){
  return s.toLowerCase()
    .replace(/[æ]/g,'ae').replace(/[ø]/g,'o').replace(/[å]/g,'a')
    .replace(/[éè]/g,'e').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}

/* ─── Score a search item against query ─── */
function scoreItem(item, q){
  var qn = norm(q);
  var words = qn.split(' ').filter(Boolean);
  if(!words.length) return 0;

  var nameN = norm(item.name);
  var descN = norm(item.desc);
  var tagsN = norm(item.tags);
  var all   = nameN + ' ' + descN + ' ' + tagsN;
  var score = 0;

  // Exact name match → highest
  if(nameN === qn) score += 100;
  // Name starts with query
  else if(nameN.indexOf(qn) === 0) score += 80;
  // Name contains query
  else if(nameN.indexOf(qn) >= 0) score += 60;

  // Word-by-word matching
  var matched = 0;
  for(var i=0; i<words.length; i++){
    var w = words[i];
    if(nameN.indexOf(w) >= 0) { score += 20; matched++; }
    else if(tagsN.indexOf(w) >= 0) { score += 10; matched++; }
    else if(descN.indexOf(w) >= 0) { score += 5; matched++; }
    // Prefix match in tags (e.g. "avskriv" matches "avskrivning")
    else {
      var tagWords = tagsN.split(' ');
      for(var j=0; j<tagWords.length; j++){
        if(tagWords[j].indexOf(w) === 0){ score += 8; matched++; break; }
      }
    }
  }

  // All words must match somewhere
  if(matched < words.length) return 0;

  // Type priority bonus
  if(item.type === 'tool') score += 15;
  else if(item.type === 'concept') score += 5;

  return score;
}

/* ─── Search function ─── */
function search(q){
  if(!q || !q.trim()) return [];
  var results = [];
  for(var i=0; i<SEARCH_DATA.length; i++){
    var s = scoreItem(SEARCH_DATA[i], q);
    if(s > 0) results.push({item:SEARCH_DATA[i], score:s});
  }
  results.sort(function(a,b){ return b.score - a.score; });
  return results.slice(0, 6);
}

/* ─── Build and inject the search bar ─── */
function initSearch(){
  // Insert search bar before the tools grid in the dashboard
  var toolsTitle = document.getElementById('dash-tools-title');
  if(!toolsTitle){
    // Fallback for non-index pages: insert in hero
    var dashRule2 = document.getElementById('hero-dash-rule2');
    if(!dashRule2) return;
    var fallbackParent = dashRule2.parentNode;
  }

  // Create search container
  var wrap = document.createElement('div');
  wrap.id = 'site-search';
  wrap.innerHTML =
    '<div class="search-box">' +
      '<svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<input type="text" id="search-input" placeholder="Søk etter verktøy eller begrep..." autocomplete="off" spellcheck="false">' +
      '<kbd class="search-kbd">/</kbd>' +
    '</div>' +
    '<div class="search-dropdown" id="search-dropdown"></div>' +
    '<div class="search-suggestions" id="search-suggestions"></div>';

  if(toolsTitle){
    toolsTitle.parentNode.insertBefore(wrap, toolsTitle);
  } else {
    fallbackParent.insertBefore(wrap, document.getElementById('hero-dash-rule2'));
  }

  var input    = document.getElementById('search-input');
  var dropdown = document.getElementById('search-dropdown');
  var chips    = document.getElementById('search-suggestions');
  var activeIdx = -1;

  // Build suggestion chips
  var chipHTML = '<span class="search-chip-label">Populære:</span>';
  for(var i=0; i<SUGGESTED.length; i++){
    chipHTML += '<a href="'+SUGGESTED[i].url+'" class="search-chip">'+SUGGESTED[i].label+'</a>';
  }
  chips.innerHTML = chipHTML;

  // Show chips on focus (if input is empty)
  input.addEventListener('focus', function(){
    if(!input.value.trim()){
      chips.classList.add('visible');
      dropdown.classList.remove('visible');
    }
  });

  // Handle input
  input.addEventListener('input', function(){
    var q = input.value.trim();
    activeIdx = -1;

    if(!q){
      dropdown.classList.remove('visible');
      chips.classList.add('visible');
      return;
    }

    chips.classList.remove('visible');
    var results = search(q);

    if(results.length === 0){
      dropdown.innerHTML =
        '<div class="search-no-results">' +
          '<div class="search-no-results-text">Ingen resultater for «<strong>'+escHtml(q)+'</strong>»</div>' +
          '<a href="#" class="search-missing-link" onclick="openContactWithSuggestion(\''+escAttr(q)+'\');return false;">Savner du noe? Gi oss beskjed →</a>' +
        '</div>';
      dropdown.classList.add('visible');
      return;
    }

    var html = '';
    for(var i=0; i<results.length; i++){
      var r = results[i].item;
      var meta = TYPE_META[r.type] || TYPE_META.tool;
      html += '<a href="'+r.url+'" class="search-result" data-idx="'+i+'">' +
        '<div class="search-result-left">' +
          '<div class="search-result-name">'+highlight(r.name, q)+'</div>' +
          '<div class="search-result-desc">'+r.desc+'</div>' +
        '</div>' +
        '<div class="search-result-right">' +
          '<span class="search-result-tag search-tag-'+r.type+'">'+meta.label+'</span>' +
          '<span class="search-result-page">'+r.page+'</span>' +
        '</div>' +
      '</a>';
    }
    dropdown.innerHTML = html;
    dropdown.classList.add('visible');
  });

  // Keyboard navigation
  input.addEventListener('keydown', function(e){
    var items = dropdown.querySelectorAll('.search-result');
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      updateActive(items);
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, -1);
      updateActive(items);
    } else if(e.key === 'Enter'){
      e.preventDefault();
      if(activeIdx >= 0 && items[activeIdx]){
        window.location.href = items[activeIdx].getAttribute('href');
      } else if(items.length === 1){
        window.location.href = items[0].getAttribute('href');
      } else if(items.length === 0 && input.value.trim()){
        // No results — trigger feedback
        openContactWithSuggestion(input.value.trim());
      }
    } else if(e.key === 'Escape'){
      input.blur();
      dropdown.classList.remove('visible');
      chips.classList.remove('visible');
    }
  });

  function updateActive(items){
    for(var i=0; i<items.length; i++){
      items[i].classList.toggle('search-result-active', i === activeIdx);
    }
    if(activeIdx >= 0 && items[activeIdx]){
      items[activeIdx].scrollIntoView({block:'nearest'});
    }
  }

  // Close on click outside
  document.addEventListener('click', function(e){
    if(!wrap.contains(e.target)){
      dropdown.classList.remove('visible');
      chips.classList.remove('visible');
    }
  });

  // Keyboard shortcut: "/" to focus search
  document.addEventListener('keydown', function(e){
    if(e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT'){
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

/* ─── Helpers ─── */
function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s){ return s.replace(/'/g,"\\'").replace(/"/g,'\\"'); }

function highlight(text, q){
  if(!q) return escHtml(text);
  var lower = text.toLowerCase();
  var qLower = q.toLowerCase();
  var idx = lower.indexOf(qLower);
  if(idx < 0) return escHtml(text);
  return escHtml(text.substring(0, idx)) +
    '<mark>' + escHtml(text.substring(idx, idx + q.length)) + '</mark>' +
    escHtml(text.substring(idx + q.length));
}

/* ─── Open contact form pre-filled with missing feature ─── */
window.openContactWithSuggestion = function(query){
  // Try to use existing contact overlay
  var overlay = document.getElementById('contact-overlay');
  if(overlay){
    overlay.style.display = 'block';
    var subjectEl = document.getElementById('con-subject');
    if(subjectEl) subjectEl.value = 'feature';
    var msgEl = document.getElementById('con-message');
    if(msgEl) msgEl.value = 'Jeg søkte etter «' + query + '» men fant ingen resultater. Det hadde vært nyttig med et verktøy eller informasjon om dette.';
    var nameEl = document.getElementById('con-name');
    if(nameEl) nameEl.focus();
    return;
  }
  // Fallback: mailto
  var subject = encodeURIComponent('Forslag: ' + query);
  var body = encodeURIComponent('Jeg søkte etter «' + query + '» på hverdagsverktoy.com, men fant ingen resultater.\n\nDet hadde vært nyttig med et verktøy eller informasjon om dette.');
  window.location.href = 'mailto:kontakt@hverdagsverktoy.com?subject=' + subject + '&body=' + body;
};

/* ─── Init on page load ─── */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}

})();
