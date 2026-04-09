/* ═══════════════════════════════════════════════════════════
   Hverdagsverktøy — Søkemodul
   Instant client-side search across all tools and concepts.
   © 2026 Kasper Skjæveland Espedal. All rights reserved.
   ═══════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ─── Translation helper (uses core.js R() if available) ─── */
function T(key, fallback){ try { var v = R()[key]; return v || fallback; } catch(e){ return fallback; } }

/* ─── Search index ─── */
var SEARCH_DATA = [
  // ══════ VERKTØY (Nivå 1 — høyest prioritet) ══════
  // Personlig økonomi
  {name:'Budsjett',desc:'Lag et personlig budsjett med inntekter og utgifter',url:'/personlig/#budsjett-wrapper',tags:'budsjett økonomi personlig inntekt utgift spare penger husholdning budget',type:'tool',page:'Personlig økonomi'},
  {name:'Bilkostnad',desc:'Beregn hva bilen din faktisk koster per måned og km',url:'/personlig/#bil-wrapper',tags:'bil bilkostnad bilhold kjøretøy drivstoff forsikring bompenger vedlikehold bensin diesel elbil km kilometer car cost',type:'tool',page:'Personlig økonomi'},
  {name:'Sparekalkulator',desc:'Se kraften i rentes rente over tid',url:'/personlig/#spare-wrapper',tags:'spare sparing rentes rente avkastning fond aksjer investering månedlig savings compound interest',type:'tool',page:'Personlig økonomi'},
  {name:'Studielån',desc:'Beregn stipend, lån og nedbetalingsplan fra Lånekassen',url:'/personlig/#studie-wrapper',tags:'studielån lånekassen stipend student studie nedbetaling lån utdanning student loan',type:'tool',page:'Personlig økonomi'},
  {name:'Lønn etter skatt',desc:'Se hva du faktisk får utbetalt fra timelønnen din',url:'/personlig/#lonn-wrapper',tags:'lønn timelønn netto brutto utbetalt lønn etter skatt nettolønn hva får jeg salary after tax wage',type:'tool',page:'Personlig økonomi'},
  {name:'Abonnementskalkulator',desc:'Se totalkostnaden for alle abonnementene dine',url:'/personlig/#abo-wrapper',tags:'abonnement streaming netflix spotify hbo viaplay subscription månedskostnad',type:'tool',page:'Personlig økonomi'},

  // Boliglån
  {name:'Boliglånskalkulator',desc:'Beregn månedlig betaling, rente og totalkostnad',url:'/boliglan/#mor-wrapper',tags:'boliglån lån bolig hus leilighet rente annuitet serielån avdrag nedbetaling månedlig betaling mortgage',type:'tool',page:'Boliglån'},
  {name:'Dokumentavgift',desc:'Beregn tinglysning og dokumentavgift ved boligkjøp',url:'/boliglan/#dok-wrapper',tags:'dokumentavgift tinglysing tinglysningsgebyr attestgebyr boligkjøp eiendom selveier borettslag',type:'tool',page:'Boliglån'},

  // Kalkulator (hash handled by switchCalcMode in core.js)
  {name:'Enkel kalkulator',desc:'Standard kalkulator med grunnleggende regning',url:'/kalkulator/',tags:'kalkulator regnemaskin pluss minus gange dele prosent calculator',type:'tool',page:'Kalkulator'},
  {name:'Vitenskapelig kalkulator',desc:'Sin, cos, log, potenser og mer',url:'/kalkulator/#scientific',tags:'vitenskapelig kalkulator sin cos tan log ln potens kvadratrot pi scientific',type:'tool',page:'Kalkulator'},
  {name:'Valutakalkulator',desc:'Regn om mellom valutaer med oppdaterte kurser',url:'/kalkulator/#unit',tags:'valuta valutaomregner kurs dollar euro pund usd eur gbp sek dkk currency',type:'tool',page:'Kalkulator'},
  {name:'Finansiell kalkulator',desc:'Nåverdi, fremtidsverdi og annuitetsberegninger',url:'/kalkulator/#finance',tags:'finansiell kalkulator nåverdi fremtidsverdi annuitet rente perioder financial',type:'tool',page:'Kalkulator'},
  {name:'Ansattkostnad (AGA)',desc:'Beregn total årskostnad for en ansatt inkl. AGA og OTP',url:'/kalkulator/#aga',tags:'ansattkostnad aga arbeidsgiveravgift otp pensjon feriepenger lønn kostnad ansatt arbeidsgiver employee cost',type:'tool',page:'Kalkulator'},
  {name:'Avskrivning',desc:'Regnskapsmessig og skattemessig avskrivning',url:'/kalkulator/#avs',tags:'avskrivning saldoavskrivning lineær saldo avskrivningsgruppe driftsmiddel restverdi levetid anleggsmiddel depreciation',type:'tool',page:'Kalkulator'},
  {name:'Feriepenger',desc:'Beregn feriepenger ut fra årslønn og ferieordning',url:'/kalkulator/#ferie',tags:'feriepenger ferie ferielov ferieordning over 60 bonus ferietillegg 10.2 12 prosent holiday pay',type:'tool',page:'Kalkulator'},
  {name:'Effektiv rente',desc:'Se hva lånet faktisk koster inkl. gebyrer',url:'/kalkulator/#rente',tags:'effektiv rente nominell rente gebyr etableringsavgift lånekostnad effective interest rate',type:'tool',page:'Kalkulator'},
  {name:'Valutagevinst',desc:'Beregn gevinst eller tap ved kjøp og salg av valuta',url:'/kalkulator/#valgevinst',tags:'valutagevinst valutatap valuta kjøp salg kurs gevinst skatt 22 currency gain',type:'tool',page:'Kalkulator'},
  {name:'Likviditetsbudsjett',desc:'Oversikt over penger inn og ut måned for måned',url:'/kalkulator/#likvid',tags:'likviditet likviditetsbudsjett kontantstrøm cashflow inn ut måned balanse liquidity',type:'tool',page:'Kalkulator'},
  {name:'NPV / IRR',desc:'Lønnsomhetsanalyse med netto nåverdi og internrente',url:'/kalkulator/#npv',tags:'npv irr nåverdi internrente investering lønnsomhet kontantstrøm diskonteringsrente tilbakebetalingstid profitability',type:'tool',page:'Kalkulator'},
  {name:'Pensjonskalkulator',desc:'Beregn forventet pensjon og pensjonssparing',url:'/kalkulator/#pensjon',tags:'pensjon pensjonsalder otp innskuddspensjon alderspensjon folketrygd afp tjenestepensjon pension',type:'tool',page:'Kalkulator'},
  {name:'Lønn vs Utbytte',desc:'Sammenlign skatt på lønn mot utbytte fra eget AS',url:'/kalkulator/#lvu',tags:'lønn utbytte aksjeselskap as eier utdeling uttak skatt sammenlign optimal salary dividend',type:'tool',page:'Kalkulator'},

  // Skatt
  {name:'Skattkalkulator',desc:'Beregn skatt på årsinntekt med trinnskatt',url:'/skatt/#sal-salary-card',tags:'skatt skattkalkulator trinnskatt trygdeavgift brutto netto inntektsskatt tax calculator',type:'tool',page:'Skatt'},
  {name:'Uttakskalkulator',desc:'Skatt ved uttak av eiendeler fra virksomhet',url:'/skatt/#sal-uttak-card',tags:'uttak skatt virksomhet eiendeler sktl 5-2 withdrawal',type:'tool',page:'Skatt'},
  {name:'Effektiv skatt ved utdeling',desc:'Aksjonærmodellen og foretaksmodellen',url:'/skatt/#sal-utdeling-card',tags:'utdeling utbytte aksjonærmodellen foretaksmodellen selskapsskatt effektiv skatt distribution',type:'tool',page:'Skatt'},
  {name:'Formueskatt',desc:'Beregn formueskatt med verdsettelsesrabatter',url:'/skatt/#formue-wrapper',tags:'formue formueskatt verdsettelsesrabatt bolig aksjer eiendom gjeld bunnfradrag wealth tax',type:'tool',page:'Skatt'},
  {name:'Reisefradrag',desc:'Fradrag for reise mellom hjem og arbeidssted',url:'/skatt/#reise-wrapper',tags:'reisefradrag pendler reise arbeid km kilometer bom bompenger fradrag travel deduction commute',type:'tool',page:'Skatt'},

  // Avgift
  {name:'MVA-kalkulator',desc:'Beregn MVA-beløp og priser inkl/ekskl. avgift',url:'/avgift/#vat-wrapper',tags:'mva moms merverdiavgift avgift vat 25 15 12 prosent inkludert ekskludert',type:'tool',page:'Avgift'},
  {name:'Justeringskalkulator',desc:'Justering av inngående MVA ved bruksendring',url:'/avgift/#vat-adj-card',tags:'justering mva inngående bruksendring kapitalvare justeringsperiode mval kap 9',type:'tool',page:'Avgift'},

  // Selskap
  {name:'Velg selskapsform',desc:'Hvilken selskapsform passer for deg? ENK, AS, ANS, DA eller KS',url:'/selskap/#selskap-velg-card',tags:'selskapsform velge starte bedrift virksomhet enk as ans da ks company form choose',type:'tool',page:'Selskap'},
  {name:'Enkeltpersonforetak (ENK)',desc:'Den enkleste måten å starte for seg selv — gratis og uten krav til kapital',url:'/selskap/#selskap-enk-card',tags:'enkeltpersonforetak enk selvstendig næringsdrivende frilanser gratis registrering sole proprietorship',type:'tool',page:'Selskap'},
  {name:'Aksjeselskap (AS)',desc:'Begrenset ansvar, aksjekapital og profesjonell drift',url:'/selskap/#selskap-as-card',tags:'aksjeselskap as stiftelse styret generalforsamling aksjekapital vedtekter 30000 company limited',type:'tool',page:'Selskap'},
  {name:'Ansvarlig selskap (ANS / DA)',desc:'Partnerskap med personlig ansvar — solidarisk eller delt',url:'/selskap/#selskap-ans-card',tags:'ansvarlig selskap ans da partnerskap solidarisk delt ansvar selskapsavtale partnership',type:'tool',page:'Selskap'},
  {name:'Kommandittselskap (KS)',desc:'To typer deltakere med ulik risiko — komplementar og kommandittist',url:'/selskap/#selskap-ks-card',tags:'kommandittselskap ks komplementar kommandittist limited partnership begrenset ansvar',type:'tool',page:'Selskap'},
  {name:'Sammenligning selskapsformer',desc:'ENK, AS, ANS, DA og KS side om side — ansvar, skatt og krav',url:'/selskap/#selskap-compare-card',tags:'sammenligning selskapsformer enk as ans da ks tabell compare company forms',type:'tool',page:'Selskap'},
  {name:'Registrere selskap',desc:'Steg-for-steg: slik registrerer du foretak via Altinn',url:'/selskap/#selskap-reg-card',tags:'registrere selskap foretak altinn brønnøysund organisasjonsnummer register company',type:'tool',page:'Selskap'},

  // ══════ BEGREPER (Nivå 2 — fagtermer) ══════
  {name:'Trinnskatt',desc:'Progressiv skatt som øker med inntekten — 4 trinn',url:'/skatt/',tags:'trinnskatt trinn progressiv skatt inntekt sats bracket tax',type:'concept',page:'Skatt'},
  {name:'Skattefradrag',desc:'Fradrag som reduserer skatten din direkte',url:'/skatt/#sal-ded-card',tags:'skattefradrag fradrag redusere skatt tax deduction',type:'concept',page:'Skatt'},
  {name:'Minstefradrag',desc:'Standardfradrag alle lønnsmottakere får automatisk',url:'/skatt/',tags:'minstefradrag standard fradrag lønn automatisk minimum deduction',type:'concept',page:'Skatt'},
  {name:'Trygdeavgift',desc:'Avgift til folketrygden — 7.9% av lønn',url:'/skatt/',tags:'trygdeavgift folketrygden nav 7.9 prosent social security',type:'concept',page:'Skatt'},
  {name:'Egenkapital',desc:'Minimumskapital du må ha ved boligkjøp (15%)',url:'/boliglan/',tags:'egenkapital 15 prosent boligkjøp krav bank equity down payment',type:'concept',page:'Boliglån'},
  {name:'BSU — Boligsparing for ungdom',desc:'Skattefradrag på 20% av innskudd, maks 27 500 kr/år',url:'/boliglan/#mor-bsu-card',tags:'bsu boligsparing ungdom skattefradrag 20 prosent sparing bolig housing savings',type:'concept',page:'Boliglån'},
  {name:'Gjeldsgrad',desc:'Forholdet mellom total gjeld og bruttoinntekt (maks 5x)',url:'/boliglan/',tags:'gjeldsgrad gjeld inntekt 5 ganger krav bank boliglån debt ratio',type:'concept',page:'Boliglån'},
  {name:'Stresstest',desc:'Banken tester om du tåler 3 prosentpoeng renteøkning',url:'/boliglan/',tags:'stresstest rente økning bank test tåle boliglån stress test',type:'concept',page:'Boliglån'},
  {name:'Aksjonærmodellen',desc:'Modell for beskatning av utbytte til personlige aksjonærer',url:'/skatt/#sal-utdeling-card',tags:'aksjonærmodellen utbytte skjermingsfradrag oppjusteringsfaktor aksjonær shareholder model',type:'concept',page:'Skatt'},
  {name:'Foretaksmodellen',desc:'Modell for beskatning av enkeltpersonforetak',url:'/skatt/#sal-utdeling-card',tags:'foretaksmodellen enkeltpersonforetak enk selvstending næring sole proprietor',type:'concept',page:'Skatt'},
  {name:'Verdsettelsesrabatt',desc:'Rabatt på formuesverdi for aksjer, bolig og driftsmidler',url:'/skatt/#formue-wrapper',tags:'verdsettelsesrabatt formue aksjer bolig rabatt reduksjon valuation discount',type:'concept',page:'Skatt'},
  {name:'Saldoavskrivning',desc:'Skattemessig avskrivning med fast prosent av restverdi',url:'/kalkulator/#avs',tags:'saldoavskrivning skattemessig avskrivning saldo degressiv restverdi saldogruppe declining balance',type:'concept',page:'Kalkulator'},
  {name:'OTP — Obligatorisk tjenestepensjon',desc:'Arbeidsgiver må spare minst 2% av lønn over 1G til pensjon',url:'/kalkulator/#aga',tags:'otp obligatorisk tjenestepensjon arbeidsgiver 2 prosent 1g pensjon mandatory pension',type:'concept',page:'Kalkulator'},
  {name:'Arbeidsgiveravgift (AGA)',desc:'Avgift arbeidsgiver betaler på lønn — varierer etter sone',url:'/kalkulator/#aga',tags:'arbeidsgiveravgift aga sone avgift arbeidsgiver lønn 14.1 employer tax',type:'concept',page:'Kalkulator'},
  {name:'Rentes rente',desc:'Avkastning på avkastning — effekten som gjør sparing kraftig over tid',url:'/personlig/#spare-wrapper',tags:'rentes rente compound interest sparing effekt tid avkastning',type:'concept',page:'Personlig økonomi'},
  {name:'Annuitetslån',desc:'Lån med like store månedlige betalinger hele perioden',url:'/boliglan/#mor-wrapper',tags:'annuitetslån annuitet fast betaling like stor måned annuity loan',type:'concept',page:'Boliglån'},
  {name:'Serielån',desc:'Lån med like store avdrag — totalt billigere enn annuitet',url:'/boliglan/#mor-wrapper',tags:'serielån serie avdrag billigere synkende betaling serial loan',type:'concept',page:'Boliglån'},
  {name:'Næring eller hobby?',desc:'Når blir biinntekt skattepliktig næringsvirksomhet?',url:'/skatt/#sal-naering-hobby-card',tags:'næring hobby biinntekt skattepliktig virksomhet grense business hobby',type:'concept',page:'Skatt'},
  {name:'Konsernbidrag',desc:'Overføring av overskudd mellom selskaper i samme konsern',url:'/skatt/',tags:'konsernbidrag konsern overføring selskap morselskap datterselskap group contribution',type:'concept',page:'Skatt'},
  {name:'Fritaksmetoden',desc:'Selskaper slipper skatt på aksjeutbytte og -gevinst',url:'/skatt/',tags:'fritaksmetoden fritak skatt utbytte aksjegevinst selskap participation exemption',type:'concept',page:'Skatt'},
  {name:'Deltakerligning',desc:'Overskudd fordeles og beskattes hos hver deltaker — ANS, DA og KS',url:'/selskap/#selskap-skatt-card',tags:'deltakerligning deltakermodellen ansvarlig selskap kommandittselskap fordeling partner taxation',type:'concept',page:'Selskap'},
  {name:'Selskapsskatt',desc:'22 % skatt på overskudd i aksjeselskap',url:'/selskap/#selskap-skatt-card',tags:'selskapsskatt 22 prosent overskudd aksjeselskap as corporate tax',type:'concept',page:'Selskap'},
  {name:'Utbytteskatt',desc:'37,84 % skatt på utbytte til personlige aksjonærer (oppjustert)',url:'/selskap/#selskap-skatt-card',tags:'utbytteskatt utbytte aksjonær oppjustert 37.84 1.72 dividend tax',type:'concept',page:'Selskap'},
  {name:'Komplementar',desc:'Aktiv leder i KS med ubegrenset personlig ansvar',url:'/selskap/#selskap-ks-card',tags:'komplementar ks kommandittselskap aktiv leder ubegrenset ansvar general partner',type:'concept',page:'Selskap'},
  {name:'Kommandittist',desc:'Passiv investor i KS — ansvar begrenset til innskuddet',url:'/selskap/#selskap-ks-card',tags:'kommandittist ks investor passiv begrenset ansvar innskudd limited partner',type:'concept',page:'Selskap'},
  {name:'MVA-satser',desc:'25% generell, 15% mat, 12% transport/kultur, 0% eksport',url:'/avgift/',tags:'mva satser 25 15 12 0 prosent mat transport kultur eksport vat rates',type:'concept',page:'Avgift'},
  {name:'Omsetningsgrense MVA',desc:'Registreringsplikt ved omsetning over 50 000 kr',url:'/avgift/',tags:'omsetningsgrense mva registrering 50000 plikt næring turnover threshold',type:'concept',page:'Avgift'},
  {name:'Fradragsrett MVA',desc:'Rett til å trekke fra inngående MVA på bedriftskjøp',url:'/avgift/',tags:'fradragsrett mva inngående utgående trekke fra bedrift input vat deduction',type:'concept',page:'Avgift'},

  // ══════ LOVHENVISNINGER (Nivå 3) ══════
  {name:'Skatteloven',desc:'Kapitler og paragrafer fra skatteloven',url:'/skatt/#sal-law-group',tags:'skatteloven lov skatt kapittel paragraf tax act',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 2 — Skatteplikt',desc:'Hvem er skattepliktige til Norge?',url:'/skatt/#sal-subj-card',tags:'skatteloven kap 2 skatteplikt bosted selskap tax liability',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 4 — Formue',desc:'Verdsettelse av formue, aksjer, bolig og rabatter',url:'/skatt/#sal-wealth-card',tags:'skatteloven kap 4 formue verdsettelse bolig aksjer wealth',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 5 — Inntekt',desc:'Skattepliktig inntekt, lønn, kapital og skattefrie ytelser',url:'/skatt/#sal-law-card',tags:'skatteloven kap 5 inntekt lønn kapital ytelser income',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 6 — Fradrag',desc:'Minstefradrag, gjeldsrenter og særfradrag',url:'/skatt/#sal-ded-card',tags:'skatteloven kap 6 fradrag minstefradrag gjeldsrenter deductions',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 9 — Gevinst og tap',desc:'Realisasjon, boligsalg, arv, gave og utflytting',url:'/skatt/#sal-real-card',tags:'skatteloven kap 9 gevinst tap realisasjon boligsalg arv gains losses',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 10 — Selskaper',desc:'Utbytte, aksjegevinst, konsernbidrag og NOKUS',url:'/skatt/#sal-corp-card',tags:'skatteloven kap 10 selskaper utbytte aksjegevinst konsernbidrag nokus companies',type:'law',page:'Skatt'},
  {name:'Skatteloven kap. 14 — Saldoavskrivning',desc:'Saldogrupper, satser og gevinst/tap ved realisasjon',url:'/skatt/#sal-depr-card',tags:'skatteloven kap 14 saldoavskrivning saldogrupper avskrivningssatser depreciation',type:'law',page:'Skatt'},
  {name:'Merverdiavgiftsloven kap. 2 — Registrering',desc:'Fellesregistrering, frivillig registrering og forhåndsregistrering',url:'/avgift/#vat-reg-card',tags:'merverdiavgiftsloven mval kap 2 registrering fellesregistrering vat registration',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 3 — Unntak',desc:'Hva er unntatt fra MVA-loven?',url:'/avgift/#vat-exempt-card',tags:'merverdiavgiftsloven mval kap 3 unntak uttak innførsel exemptions',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 6 — Fritak',desc:'Nullsats — 0% utgående, full fradragsrett',url:'/avgift/#vat-zero-card',tags:'merverdiavgiftsloven mval kap 6 fritak nullsats eksport zero rate',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 8 — Fradrag',desc:'Hovedregel, delt bruk og begrensninger',url:'/avgift/#vat-ded-card',tags:'merverdiavgiftsloven mval kap 8 fradrag delt bruk input deduction',type:'law',page:'Avgift'},
  {name:'Merverdiavgiftsloven kap. 9 — Justering',desc:'Kapitalvarer og justeringsperioder',url:'/avgift/#vat-adj-info-card',tags:'merverdiavgiftsloven mval kap 9 justering kapitalvarer adjustment',type:'law',page:'Avgift'},
  {name:'Regnskapsloven § 5-3 — Avskrivning',desc:'Anleggsmidler med begrenset levetid skal avskrives',url:'/kalkulator/#avs',tags:'regnskapsloven rskl 5-3 avskrivning anleggsmidler levetid accounting act',type:'law',page:'Kalkulator'},
  {name:'Aksjeloven',desc:'Lov om aksjeselskaper — stiftelse, kapital, styre og generalforsamling',url:'/selskap/#selskap-as-card',tags:'aksjeloven lov aksjeselskap as 1997 stiftelse kapital companies act',type:'law',page:'Selskap'},
  {name:'Selskapsloven',desc:'Lov om ansvarlige selskaper og kommandittselskaper',url:'/selskap/#selskap-ans-card',tags:'selskapsloven lov ansvarlig selskap kommandittselskap ans da ks 1985 partnership act',type:'law',page:'Selskap'}
];

/* ─── Foreslåtte (popular searches — translated) ─── */
var SUGGESTED = [
  {labelKey:'suggestLonn',    fallback:'Lønn etter skatt', url:'/personlig/#lonn-wrapper'},
  {labelKey:'suggestBoliglan',fallback:'Boliglån',         url:'/boliglan/#mor-wrapper'},
  {labelKey:'suggestBsu',     fallback:'BSU',              url:'/boliglan/#mor-bsu-card'},
  {labelKey:'suggestMva',     fallback:'MVA',              url:'/avgift/#vat-wrapper'},
  {labelKey:'suggestBilkost', fallback:'Bilkostnad',       url:'/personlig/#bil-wrapper'},
  {labelKey:'suggestFerie',   fallback:'Feriepenger',      url:'/kalkulator/#ferie'},
  {labelKey:'suggestBudsjett',fallback:'Budsjett',         url:'/personlig/#budsjett-wrapper'},
  {labelKey:'suggestStudie',  fallback:'Studielån',        url:'/personlig/#studie-wrapper'}
];

/* ─── Type labels (translated) ─── */
function typeLabel(type){
  if(type==='tool') return T('searchTagTool','Verktøy');
  if(type==='concept') return T('searchTagConcept','Begrep');
  if(type==='law') return T('searchTagLaw','Lov');
  return '';
}

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
  var score = 0;

  // Exact name match → highest
  if(nameN === qn) score += 100;
  else if(nameN.indexOf(qn) === 0) score += 80;
  else if(nameN.indexOf(qn) >= 0) score += 60;

  // Word-by-word matching
  var matched = 0;
  for(var i=0; i<words.length; i++){
    var w = words[i];
    if(nameN.indexOf(w) >= 0) { score += 20; matched++; }
    else if(tagsN.indexOf(w) >= 0) { score += 10; matched++; }
    else if(descN.indexOf(w) >= 0) { score += 5; matched++; }
    else {
      var tagWords = tagsN.split(' ');
      var found = false;
      for(var j=0; j<tagWords.length; j++){
        if(tagWords[j].indexOf(w) === 0){ score += 8; matched++; found = true; break; }
      }
      if(!found){
        // Also try prefix in name words
        var nameWords = nameN.split(' ');
        for(var k=0; k<nameWords.length; k++){
          if(nameWords[k].indexOf(w) === 0){ score += 12; matched++; break; }
        }
      }
    }
  }

  if(matched < words.length) return 0;

  // Type priority
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

/* ─── Find injection point — homepage only ─── */
function findInjectionPoint(){
  // Priority 1: Dashboard tools title (homepage)
  var toolsTitle = document.getElementById('dash-tools-title');
  if(toolsTitle) return {parent: toolsTitle.parentNode, before: toolsTitle};

  // Priority 2: Hero dash rule (homepage alt)
  var dashRule2 = document.getElementById('hero-dash-rule2');
  if(dashRule2) return {parent: dashRule2.parentNode, before: dashRule2};

  // Subpages: do not inject search
  return null;
}

/* ─── Build and inject the search bar ─── */
function initSearch(){
  var point = findInjectionPoint();
  if(!point) return;

  var wrap = document.createElement('div');
  wrap.id = 'site-search';

  var placeholder = T('searchPlaceholder','Søk etter verktøy eller begrep...');

  wrap.innerHTML =
    '<div class="search-box">' +
      '<svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<input type="text" id="search-input" placeholder="'+placeholder+'" autocomplete="off" spellcheck="false">' +
      '<kbd class="search-kbd">/</kbd>' +
    '</div>' +
    '<div class="search-dropdown" id="search-dropdown"></div>' +
    '<div class="search-suggestions" id="search-suggestions"></div>';

  point.parent.insertBefore(wrap, point.before);

  var input    = document.getElementById('search-input');
  var dropdown = document.getElementById('search-dropdown');
  var chips    = document.getElementById('search-suggestions');
  var activeIdx = -1;

  // Build suggestion chips
  var popularLabel = T('searchPopular','Populære:');
  var chipHTML = '<span class="search-chip-label">'+popularLabel+'</span>';
  for(var i=0; i<SUGGESTED.length; i++){
    chipHTML += '<a href="'+SUGGESTED[i].url+'" class="search-chip">'+T(SUGGESTED[i].labelKey, SUGGESTED[i].fallback)+'</a>';
  }
  chips.innerHTML = chipHTML;

  // Show chips on focus (if input is empty) + close language dropdown
  input.addEventListener('focus', function(){
    // Close language dropdown when search is focused
    var rdd=document.getElementById('rdd');if(rdd)rdd.classList.remove('open');
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
      var noResultsText = T('searchNoResults','Ingen resultater for').replace('{q}','');
      var missingText = T('searchMissing','Savner du noe? Gi oss beskjed →');
      dropdown.innerHTML =
        '<div class="search-no-results">' +
          '<div class="search-no-results-text">'+noResultsText+' «<strong>'+escHtml(q)+'</strong>»</div>' +
          '<a href="#" class="search-missing-link" onclick="openContactWithSuggestion(\''+escAttr(q)+'\');return false;">'+missingText+'</a>' +
        '</div>';
      dropdown.classList.add('visible');
      return;
    }

    var html = '';
    for(var i=0; i<results.length; i++){
      var r = results[i].item;
      html += '<a href="'+r.url+'" class="search-result" data-idx="'+i+'">' +
        '<div class="search-result-left">' +
          '<div class="search-result-name">'+highlight(r.name, q)+'</div>' +
          '<div class="search-result-desc">'+r.desc+'</div>' +
        '</div>' +
        '<div class="search-result-right">' +
          '<span class="search-result-tag search-tag-'+r.type+'">'+typeLabel(r.type)+'</span>' +
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
  var overlay = document.getElementById('contact-overlay');
  if(overlay){
    overlay.classList.add('open');
    document.body.style.overflow='hidden';
    document.getElementById('contact-form').style.display='';
    var successEl=document.getElementById('con-success');if(successEl)successEl.classList.remove('show');
    var subjectEl = document.getElementById('con-subject');
    if(subjectEl) subjectEl.value = 'feature';
    var msgEl = document.getElementById('con-message');
    if(msgEl) msgEl.value = T('searchFeedbackMsg','Jeg søkte etter «{q}» men fant ingen resultater. Det hadde vært nyttig med et verktøy eller informasjon om dette.').replace('{q}', query);
    var nameEl = document.getElementById('con-name');
    if(nameEl) nameEl.focus();
    return;
  }
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
