/* ═══════════════════════════════════════════════════════════
   Hverdagsverktøy — Søkemodul
   Instant client-side search across all tools and concepts.
   © 2026 Hverdagsverktøy. All rights reserved.
   ═══════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ─── Translation helper (uses core.js R() if available) ─── */
function T(key, fallback){ try { var v = R()[key]; return v || fallback; } catch(e){ return fallback; } }

/* ─── Search index ─── */
var SEARCH_DATA = [
  // ══════ SEKSJONER (Nivå 0 — grunnord-rooting) ══════
  {name:'Skatt',desc:'Skattkalkulator, satser, begreper og skatteloven',url:'/skatt/',tags:'skatt seksjon oversikt skattkalkulator satser lovverk tax section',type:'section',page:'Skatt',sk:'skattSection'},
  {name:'Boliglån',desc:'Boliglånskalkulator, krav, kostnader og BSU',url:'/boliglan/',tags:'boliglån seksjon oversikt mortgage lån section',type:'section',page:'Boliglån',sk:'boliglanSection'},
  {name:'Kalkulator',desc:'Enkel, valuta, finansiell, vitenskapelig og fagkalkulatorer',url:'/kalkulator/',tags:'kalkulator seksjon calculator oversikt section',type:'section',page:'Kalkulator',sk:'kalkSection'},
  {name:'Avgift',desc:'MVA, merverdiavgiftsloven og arbeidsgiveravgift',url:'/avgift/',tags:'avgift seksjon mva vat oversikt section',type:'section',page:'Avgift',sk:'avgiftSection'},
  {name:'Selskap',desc:'Aksjeselskap, kommandittselskap og selskapsrett',url:'/selskap/',tags:'selskap seksjon company selskapsform oversikt section',type:'section',page:'Selskap',sk:'selskapSection'},
  {name:'Personlig økonomi',desc:'Budsjett, bil, sparing og lønnsomhet',url:'/personlig/',tags:'personlig økonomi seksjon personal finance oversikt section',type:'section',page:'Personlig økonomi',sk:'personligSection'},

  // ══════ VERKTØY (Nivå 1 — høyest prioritet) ══════
  // Personlig økonomi
  {name:'Budsjett',desc:'Lag et personlig budsjett med inntekter og utgifter',url:'/personlig/#budsjett-wrapper',tags:'budsjett økonomi personlig inntekt utgift spare penger husholdning budget',type:'tool',page:'Personlig økonomi',sk:'budsjett'},
  {name:'Bilkostnad',desc:'Beregn hva bilen din faktisk koster per måned og km',url:'/personlig/#bil-wrapper',tags:'bil bilkostnad bilhold kjøretøy drivstoff forsikring bompenger vedlikehold bensin diesel elbil km kilometer car cost',type:'tool',page:'Personlig økonomi',sk:'bilkostnad'},
  {name:'Sparekalkulator',desc:'Se kraften i rentes rente over tid',url:'/personlig/#spare-wrapper',tags:'spare sparing rentes rente avkastning fond aksjer investering månedlig savings compound interest',type:'tool',page:'Personlig økonomi',sk:'spare'},
  {name:'Studielån',desc:'Beregn stipend, lån og nedbetalingsplan fra Lånekassen',url:'/personlig/#studie-wrapper',tags:'studielån lånekassen stipend student studie nedbetaling lån utdanning student loan',type:'tool',page:'Personlig økonomi',sk:'studielan'},
  {name:'Lønn etter skatt',desc:'Se hva du faktisk får utbetalt fra timelønnen din',url:'/personlig/#lonn-wrapper',tags:'lønn timelønn netto brutto utbetalt lønn etter skatt nettolønn hva får jeg salary after tax wage',type:'tool',page:'Personlig økonomi',sk:'lonn'},
  {name:'Abonnementskalkulator',desc:'Se totalkostnaden for alle abonnementene dine',url:'/personlig/#abo-wrapper',tags:'abonnement streaming netflix spotify hbo viaplay subscription månedskostnad',type:'tool',page:'Personlig økonomi',sk:'abo'},

  // Boliglån
  {name:'Boliglånskalkulator',desc:'Beregn månedlig betaling, rente og totalkostnad',url:'/boliglan/#mor-wrapper',tags:'boliglån lån bolig hus leilighet rente annuitet serielån avdrag nedbetaling månedlig betaling mortgage',type:'tool',page:'Boliglån',sk:'boliglan'},
  {name:'Dokumentavgift',desc:'Beregn tinglysning og dokumentavgift ved boligkjøp',url:'/boliglan/#dok-wrapper',tags:'dokumentavgift tinglysing tinglysningsgebyr attestgebyr boligkjøp eiendom selveier borettslag',type:'tool',page:'Boliglån',sk:'dok'},

  // Kalkulator (hash handled by switchCalcMode in core.js)
  {name:'Enkel kalkulator',desc:'Standard kalkulator med grunnleggende regning',url:'/kalkulator/',tags:'kalkulator regnemaskin pluss minus gange dele prosent calculator',type:'tool',page:'Kalkulator',sk:'kalkBasic'},
  {name:'Vitenskapelig kalkulator',desc:'Sin, cos, log, potenser og mer',url:'/kalkulator/#scientific',tags:'vitenskapelig kalkulator sin cos tan log ln potens kvadratrot pi scientific',type:'tool',page:'Kalkulator',sk:'kalkSci'},
  {name:'Valutakalkulator',desc:'Regn om mellom valutaer med oppdaterte kurser',url:'/kalkulator/#unit',tags:'valuta valutaomregner kurs dollar euro pund usd eur gbp sek dkk currency',type:'tool',page:'Kalkulator',sk:'kalkValuta'},
  {name:'Finansiell kalkulator',desc:'Nåverdi, fremtidsverdi og annuitetsberegninger',url:'/kalkulator/#finance',tags:'finansiell kalkulator nåverdi fremtidsverdi annuitet rente perioder financial',type:'tool',page:'Kalkulator',sk:'kalkFin'},
  {name:'Ansattkostnad (AGA)',desc:'Beregn total årskostnad for en ansatt inkl. AGA og OTP',url:'/avgift/#aga-wrapper',tags:'ansattkostnad aga arbeidsgiveravgift otp pensjon feriepenger lønn kostnad ansatt arbeidsgiver employee cost',type:'tool',page:'Kalkulator',sk:'aga'},
  {name:'Avskrivning',desc:'Regnskapsmessig og skattemessig avskrivning',url:'/kalkulator/#avs',tags:'avskrivning saldoavskrivning lineær saldo avskrivningsgruppe driftsmiddel restverdi levetid anleggsmiddel depreciation',type:'tool',page:'Kalkulator',sk:'avs'},
  {name:'Feriepenger',desc:'Beregn feriepenger ut fra årslønn og ferieordning',url:'/kalkulator/#ferie',tags:'feriepenger ferie ferielov ferieordning over 60 bonus ferietillegg 10.2 12 prosent holiday pay',type:'tool',page:'Kalkulator',sk:'ferie'},
  {name:'Effektiv rente',desc:'Se hva lånet faktisk koster inkl. gebyrer',url:'/kalkulator/#rente',tags:'effektiv rente nominell rente gebyr etableringsavgift lånekostnad effective interest rate',type:'tool',page:'Kalkulator',sk:'rente'},
  {name:'Valutagevinst',desc:'Beregn gevinst eller tap ved kjøp og salg av valuta',url:'/kalkulator/#valgevinst',tags:'valutagevinst valutatap valuta kjøp salg kurs gevinst skatt 22 currency gain',type:'tool',page:'Kalkulator',sk:'valgevinst'},
  {name:'Likviditetsbudsjett',desc:'Oversikt over penger inn og ut måned for måned',url:'/kalkulator/#likvid',tags:'likviditet likviditetsbudsjett kontantstrøm cashflow inn ut måned balanse liquidity',type:'tool',page:'Kalkulator',sk:'likvid'},
  {name:'NPV / IRR',desc:'Lønnsomhetsanalyse med netto nåverdi og internrente',url:'/kalkulator/#npv',tags:'npv irr nåverdi internrente investering lønnsomhet kontantstrøm diskonteringsrente tilbakebetalingstid profitability',type:'tool',page:'Kalkulator',sk:'npv'},
  {name:'Pensjonskalkulator',desc:'Beregn forventet pensjon og pensjonssparing',url:'/kalkulator/#pensjon',tags:'pensjon pensjonsalder otp innskuddspensjon alderspensjon folketrygd afp tjenestepensjon pension',type:'tool',page:'Kalkulator',sk:'pensjon'},
  {name:'Lønn vs Utbytte',desc:'Sammenlign skatt på lønn mot utbytte fra eget AS',url:'/kalkulator/#lvu',tags:'lønn utbytte aksjeselskap as eier utdeling uttak skatt sammenlign optimal salary dividend',type:'tool',page:'Kalkulator',sk:'lvu'},

  // Skatt
  {name:'Skattkalkulator',desc:'Beregn skatt på årsinntekt med trinnskatt',url:'/skatt/#sal-salary-card',tags:'skatt skattkalkulator trinnskatt trygdeavgift brutto netto inntektsskatt tax calculator',type:'tool',page:'Skatt',sk:'skatt'},
  {name:'Uttakskalkulator',desc:'Skatt ved uttak av eiendeler fra virksomhet',url:'/skatt/#sal-uttak-card',tags:'uttak skatt virksomhet eiendeler sktl 5-2 withdrawal',type:'tool',page:'Skatt',sk:'uttak'},
  {name:'Effektiv skatt ved utdeling',desc:'Aksjonærmodellen og foretaksmodellen',url:'/skatt/#sal-utdeling-card',tags:'utdeling utbytte aksjonærmodellen foretaksmodellen selskapsskatt effektiv skatt distribution',type:'tool',page:'Skatt',sk:'utdeling'},
  {name:'Formueskatt',desc:'Beregn formueskatt med verdsettelsesrabatter',url:'/skatt/#formue-wrapper',tags:'formue formueskatt verdsettelsesrabatt bolig aksjer eiendom gjeld bunnfradrag wealth tax',type:'tool',page:'Skatt',sk:'formue'},
  {name:'Reisefradrag',desc:'Fradrag for reise mellom hjem og arbeidssted',url:'/skatt/#reise-wrapper',tags:'reisefradrag pendler reise arbeid km kilometer bom bompenger fradrag travel deduction commute',type:'tool',page:'Skatt',sk:'reise'},

  // Avgift
  {name:'MVA-kalkulator',desc:'Beregn MVA-beløp og priser inkl/ekskl. avgift',url:'/avgift/#vat-wrapper',tags:'mva moms merverdiavgift avgift vat 25 15 12 prosent inkludert ekskludert',type:'tool',page:'Avgift',sk:'mva'},
  {name:'Justeringskalkulator',desc:'Justering av inngående MVA ved bruksendring',url:'/avgift/#vat-adj-card',tags:'justering mva inngående bruksendring kapitalvare justeringsperiode mval kap 9',type:'tool',page:'Avgift',sk:'mvajust'},

  // Selskap
  {name:'Velg selskapsform',desc:'Hvilken selskapsform passer for deg? ENK, AS, ANS, DA eller KS',url:'/selskap/#selskap-velg-card',tags:'selskapsform velge starte bedrift virksomhet enk as ans da ks company form choose',type:'tool',page:'Selskap',sk:'selskapVelg'},
  {name:'Enkeltpersonforetak (ENK)',desc:'Den enkleste måten å starte for seg selv — gratis og uten krav til kapital',url:'/selskap/#selskap-enk-card',tags:'enkeltpersonforetak enk selvstendig næringsdrivende frilanser gratis registrering sole proprietorship',type:'tool',page:'Selskap',sk:'enk'},
  {name:'Aksjeselskap (AS)',desc:'Begrenset ansvar, aksjekapital og profesjonell drift',url:'/selskap/#selskap-as-card',tags:'aksjeselskap as stiftelse styret generalforsamling aksjekapital vedtekter 30000 company limited',type:'tool',page:'Selskap',sk:'as'},
  {name:'Ansvarlig selskap (ANS / DA)',desc:'Partnerskap med personlig ansvar — solidarisk eller delt',url:'/selskap/#selskap-ans-card',tags:'ansvarlig selskap ans da partnerskap solidarisk delt ansvar selskapsavtale partnership',type:'tool',page:'Selskap',sk:'ans'},
  {name:'Kommandittselskap (KS)',desc:'To typer deltakere med ulik risiko — komplementar og kommandittist',url:'/selskap/#selskap-ks-card',tags:'kommandittselskap ks komplementar kommandittist limited partnership begrenset ansvar',type:'tool',page:'Selskap',sk:'ks'},
  {name:'Andre selskapsformer',desc:'ASA, NUF, SA og stiftelse',url:'/selskap/#selskap-andre-card',tags:'asa nuf sa stiftelse samvirkeforetak allmennaksjeselskap norskregistrert utenlandsk foretak foundation cooperative',type:'tool',page:'Selskap',sk:'andre'},
  {name:'Sammenligning selskapsformer',desc:'ENK, AS, ANS, DA og KS side om side — ansvar, skatt og krav',url:'/selskap/#selskap-compare-card',tags:'sammenligning selskapsformer enk as ans da ks tabell compare company forms',type:'tool',page:'Selskap',sk:'selskapCompare'},
  {name:'Registrere selskap',desc:'Steg-for-steg: slik registrerer du foretak via Altinn',url:'/selskap/#selskap-reg-card',tags:'registrere selskap foretak altinn brønnøysund organisasjonsnummer register company',type:'tool',page:'Selskap',sk:'selskapReg'},

  // ══════ BEGREPER (Nivå 2 — fagtermer) ══════
  {name:'Fradrag',desc:'Beløp som reduserer skattegrunnlaget eller skatten din',url:'/skatt/#sal-ded-card',tags:'fradrag reduksjon skattegrunnlag skatt minstefradrag reisefradrag særfradrag gjeldsrenter deduction',type:'concept',page:'Skatt',sk:'fradrag'},
  {name:'Trinnskatt',desc:'Progressiv skatt som øker med inntekten — 5 trinn',url:'/skatt/',tags:'trinnskatt trinn progressiv skatt inntekt sats bracket tax',type:'concept',page:'Skatt',sk:'trinnskatt'},
  {name:'Skattefradrag',desc:'Fradrag som reduserer skatten din direkte',url:'/skatt/#sal-ded-card',tags:'skattefradrag fradrag redusere skatt tax deduction',type:'concept',page:'Skatt',sk:'skatteFradrag'},
  {name:'Minstefradrag',desc:'Standardfradrag alle lønnsmottakere får automatisk',url:'/skatt/',tags:'minstefradrag standard fradrag lønn automatisk minimum deduction',type:'concept',page:'Skatt',sk:'minstefradrag'},
  {name:'Trygdeavgift',desc:'Avgift til folketrygden — 7.6% av lønn (2026)',url:'/skatt/',tags:'trygdeavgift folketrygden nav 7.6 prosent social security',type:'concept',page:'Skatt',sk:'trygdeavgift'},
  {name:'Egenkapital',desc:'Minimumskapital du må ha ved boligkjøp (10%)',url:'/boliglan/',tags:'egenkapital 10 prosent boligkjøp krav bank equity down payment',type:'concept',page:'Boliglån',sk:'egenkapital'},
  {name:'BSU — Boligsparing for ungdom',desc:'Skattefradrag på 10% av innskudd, maks 27 500 kr/år',url:'/boliglan/#mor-bsu-card',tags:'bsu boligsparing ungdom skattefradrag 10 prosent sparing bolig housing savings',type:'concept',page:'Boliglån',sk:'bsu'},
  {name:'Gjeldsgrad',desc:'Forholdet mellom total gjeld og bruttoinntekt (maks 5x)',url:'/boliglan/',tags:'gjeldsgrad gjeld inntekt 5 ganger krav bank boliglån debt ratio',type:'concept',page:'Boliglån',sk:'gjeldsgrad'},
  {name:'Stresstest',desc:'Banken tester om du tåler 3 prosentpoeng renteøkning',url:'/boliglan/',tags:'stresstest rente økning bank test tåle boliglån stress test',type:'concept',page:'Boliglån',sk:'stresstest'},
  {name:'Aksjonærmodellen',desc:'Modell for beskatning av utbytte til personlige aksjonærer',url:'/skatt/#sal-utdeling-card',tags:'aksjonærmodellen utbytte skjermingsfradrag oppjusteringsfaktor aksjonær shareholder model',type:'concept',page:'Skatt',sk:'aksjonarmodellen'},
  {name:'Foretaksmodellen',desc:'Modell for beskatning av enkeltpersonforetak',url:'/skatt/#sal-utdeling-card',tags:'foretaksmodellen enkeltpersonforetak enk selvstending næring sole proprietor',type:'concept',page:'Skatt',sk:'foretaksmodellen'},
  {name:'Verdsettelsesrabatt',desc:'Rabatt på formuesverdi for aksjer, bolig og driftsmidler',url:'/skatt/#formue-wrapper',tags:'verdsettelsesrabatt formue aksjer bolig rabatt reduksjon valuation discount',type:'concept',page:'Skatt',sk:'verdsettelsesrabatt'},
  {name:'Saldoavskrivning',desc:'Skattemessig avskrivning med fast prosent av restverdi',url:'/kalkulator/#avs',tags:'saldoavskrivning skattemessig avskrivning saldo degressiv restverdi saldogruppe declining balance',type:'concept',page:'Kalkulator',sk:'saldoavs'},
  {name:'OTP — Obligatorisk tjenestepensjon',desc:'Arbeidsgiver må spare minst 2% av lønn over 1G til pensjon',url:'/avgift/#aga-wrapper',tags:'otp obligatorisk tjenestepensjon arbeidsgiver 2 prosent 1g pensjon mandatory pension',type:'concept',page:'Avgift',sk:'otp'},
  {name:'Arbeidsgiveravgift (AGA)',desc:'Avgift arbeidsgiver betaler på lønn — varierer etter sone',url:'/avgift/#aga-wrapper',tags:'arbeidsgiveravgift aga sone avgift arbeidsgiver lønn 14.1 employer tax',type:'concept',page:'Avgift',sk:'agaBegrep'},
  {name:'Rentes rente',desc:'Avkastning på avkastning — effekten som gjør sparing kraftig over tid',url:'/personlig/#spare-wrapper',tags:'rentes rente compound interest sparing effekt tid avkastning',type:'concept',page:'Personlig økonomi',sk:'rentesRente'},
  {name:'Annuitetslån',desc:'Lån med like store månedlige betalinger hele perioden',url:'/boliglan/#mor-wrapper',tags:'annuitetslån annuitet fast betaling like stor måned annuity loan',type:'concept',page:'Boliglån',sk:'annuitet'},
  {name:'Serielån',desc:'Lån med like store avdrag — totalt billigere enn annuitet',url:'/boliglan/#mor-wrapper',tags:'serielån serie avdrag billigere synkende betaling serial loan',type:'concept',page:'Boliglån',sk:'serieLan'},
  {name:'Næring eller hobby?',desc:'Når blir biinntekt skattepliktig næringsvirksomhet?',url:'/skatt/#sal-naering-hobby-card',tags:'næring hobby biinntekt skattepliktig virksomhet grense business hobby',type:'concept',page:'Skatt',sk:'naeringHobby'},
  {name:'Konsernbidrag',desc:'Overføring av overskudd mellom selskaper i samme konsern',url:'/skatt/',tags:'konsernbidrag konsern overføring selskap morselskap datterselskap group contribution',type:'concept',page:'Skatt',sk:'konsernbidrag'},
  {name:'Fritaksmetoden',desc:'Selskaper slipper skatt på aksjeutbytte og -gevinst',url:'/skatt/',tags:'fritaksmetoden fritak skatt utbytte aksjegevinst selskap participation exemption',type:'concept',page:'Skatt',sk:'fritaksmetoden'},
  {name:'Deltakerligning',desc:'Overskudd fordeles og beskattes hos hver deltaker — ANS, DA og KS',url:'/selskap/#selskap-skatt-card',tags:'deltakerligning deltakermodellen ansvarlig selskap kommandittselskap fordeling partner taxation',type:'concept',page:'Selskap',sk:'deltakerligning'},
  {name:'Selskapsskatt',desc:'22 % skatt på overskudd i aksjeselskap',url:'/selskap/#selskap-skatt-card',tags:'selskapsskatt 22 prosent overskudd aksjeselskap as corporate tax',type:'concept',page:'Selskap',sk:'selskapsskatt'},
  {name:'Utbytteskatt',desc:'37,84 % skatt på utbytte til personlige aksjonærer (oppjustert)',url:'/selskap/#selskap-skatt-card',tags:'utbytteskatt utbytte aksjonær oppjustert 37.84 1.72 dividend tax',type:'concept',page:'Selskap',sk:'utbytteskatt'},
  {name:'Komplementar',desc:'Aktiv leder i KS med ubegrenset personlig ansvar',url:'/selskap/#selskap-ks-card',tags:'komplementar ks kommandittselskap aktiv leder ubegrenset ansvar general partner',type:'concept',page:'Selskap',sk:'komplementar'},
  {name:'Kommandittist',desc:'Passiv investor i KS — ansvar begrenset til innskuddet',url:'/selskap/#selskap-ks-card',tags:'kommandittist ks investor passiv begrenset ansvar innskudd limited partner',type:'concept',page:'Selskap',sk:'kommandittist'},
  {name:'MVA-satser',desc:'25% generell, 15% mat, 12% transport/kultur, 0% eksport',url:'/avgift/',tags:'mva satser 25 15 12 0 prosent mat transport kultur eksport vat rates',type:'concept',page:'Avgift',sk:'mvaSatser'},
  {name:'Omsetningsgrense MVA',desc:'Registreringsplikt ved omsetning over 50 000 kr',url:'/avgift/',tags:'omsetningsgrense mva registrering 50000 plikt næring turnover threshold',type:'concept',page:'Avgift',sk:'omsetning'},
  {name:'Fradragsrett MVA',desc:'Rett til å trekke fra inngående MVA på bedriftskjøp',url:'/avgift/',tags:'fradragsrett mva inngående utgående trekke fra bedrift input vat deduction',type:'concept',page:'Avgift',sk:'fradragsrett'},

  // ══════ LOVHENVISNINGER (Nivå 3) ══════
  {name:'Skatteloven',desc:'Kapitler og paragrafer fra skatteloven',url:'/skatt/#sal-law-group',tags:'skatteloven lov skatt kapittel paragraf tax act',type:'law',page:'Skatt',sk:'skatteloven'},
  {name:'Skatteloven kap. 2 — Skatteplikt',desc:'Hvem er skattepliktige til Norge?',url:'/skatt/#sal-subj-card',tags:'skatteloven kap 2 skatteplikt bosted selskap tax liability',type:'law',page:'Skatt',sk:'sktlK2'},
  {name:'Skatteloven kap. 4 — Formue',desc:'Verdsettelse av formue, aksjer, bolig og rabatter',url:'/skatt/#sal-wealth-card',tags:'skatteloven kap 4 formue verdsettelse bolig aksjer wealth',type:'law',page:'Skatt',sk:'sktlK4'},
  {name:'Skatteloven kap. 5 — Inntekt',desc:'Skattepliktig inntekt, lønn, kapital og skattefrie ytelser',url:'/skatt/#sal-law-card',tags:'skatteloven kap 5 inntekt lønn kapital ytelser income',type:'law',page:'Skatt',sk:'sktlK5'},
  {name:'Skatteloven kap. 6 — Fradrag',desc:'Minstefradrag, gjeldsrenter og særfradrag',url:'/skatt/#sal-ded-card',tags:'skatteloven kap 6 fradrag minstefradrag gjeldsrenter deductions',type:'law',page:'Skatt',sk:'sktlK6'},
  {name:'Skatteloven kap. 9 — Gevinst og tap',desc:'Realisasjon, boligsalg, arv, gave og utflytting',url:'/skatt/#sal-real-card',tags:'skatteloven kap 9 gevinst tap realisasjon boligsalg arv gains losses',type:'law',page:'Skatt',sk:'sktlK9'},
  {name:'Skatteloven kap. 10 — Selskaper',desc:'Utbytte, aksjegevinst, konsernbidrag og NOKUS',url:'/skatt/#sal-corp-card',tags:'skatteloven kap 10 selskaper utbytte aksjegevinst konsernbidrag nokus companies',type:'law',page:'Skatt',sk:'sktlK10'},
  {name:'Skatteloven kap. 14 — Saldoavskrivning',desc:'Saldogrupper, satser og gevinst/tap ved realisasjon',url:'/skatt/#sal-depr-card',tags:'skatteloven kap 14 saldoavskrivning saldogrupper avskrivningssatser depreciation',type:'law',page:'Skatt',sk:'sktlK14'},
  {name:'Merverdiavgiftsloven kap. 2 — Registrering',desc:'Fellesregistrering, frivillig registrering og forhåndsregistrering',url:'/avgift/#vat-reg-card',tags:'merverdiavgiftsloven mval kap 2 registrering fellesregistrering vat registration',type:'law',page:'Avgift',sk:'mvalK2'},
  {name:'Merverdiavgiftsloven kap. 3 — Unntak',desc:'Hva er unntatt fra MVA-loven?',url:'/avgift/#vat-exempt-card',tags:'merverdiavgiftsloven mval kap 3 unntak uttak innførsel exemptions',type:'law',page:'Avgift',sk:'mvalK3'},
  {name:'Merverdiavgiftsloven kap. 6 — Fritak',desc:'Nullsats — 0% utgående, full fradragsrett',url:'/avgift/#vat-zero-card',tags:'merverdiavgiftsloven mval kap 6 fritak nullsats eksport zero rate',type:'law',page:'Avgift',sk:'mvalK6'},
  {name:'Merverdiavgiftsloven kap. 8 — Fradrag',desc:'Hovedregel, delt bruk og begrensninger',url:'/avgift/#vat-ded-card',tags:'merverdiavgiftsloven mval kap 8 fradrag delt bruk input deduction',type:'law',page:'Avgift',sk:'mvalK8'},
  {name:'Merverdiavgiftsloven kap. 9 — Justering',desc:'Kapitalvarer og justeringsperioder',url:'/avgift/#vat-adj-info-card',tags:'merverdiavgiftsloven mval kap 9 justering kapitalvarer adjustment',type:'law',page:'Avgift',sk:'mvalK9'},
  {name:'Regnskapsloven § 5-3 — Avskrivning',desc:'Anleggsmidler med begrenset levetid skal avskrives',url:'/kalkulator/#avs',tags:'regnskapsloven rskl 5-3 avskrivning anleggsmidler levetid accounting act',type:'law',page:'Kalkulator',sk:'rskl53'},
  {name:'Aksjeloven',desc:'Lov om aksjeselskaper — stiftelse, kapital, styre og generalforsamling',url:'/selskap/#selskap-as-card',tags:'aksjeloven lov aksjeselskap as 1997 stiftelse kapital companies act',type:'law',page:'Selskap',sk:'aksjeloven'},
  {name:'Selskapsloven',desc:'Lov om ansvarlige selskaper og kommandittselskaper',url:'/selskap/#selskap-ans-card',tags:'selskapsloven lov ansvarlig selskap kommandittselskap ans da ks 1985 partnership act',type:'law',page:'Selskap',sk:'selskapsloven'}
];

/* ─── Foreslåtte (popular searches — translated) ─── */
var SUGGESTED = [
  {labelKey:'suggestLonn',    fallback:'Lønn etter skatt', url:'/personlig/#lonn-wrapper'},
  {labelKey:'suggestBoliglan',fallback:'Boliglån',         url:'/boliglan/#mor-wrapper'},
  {labelKey:'suggestKalk',    fallback:'Kalkulator',       url:'/kalkulator/'},
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
// Unicode-safe: preserves letters in ALL scripts (Latin, Cyrillic, Arabic,
// CJK, Ge'ez/Tigrinya, etc.) while stripping punctuation and diacritics.
// This is what allows search to work in every supported language.
function norm(s){
  if(s==null) return '';
  var out = String(s).toLowerCase();
  // Norwegian/Danish/Swedish special handling — map to Latin equivalents so
  // searches work regardless of whether the user types ø/o, æ/ae, å/a.
  out = out.replace(/æ/g,'ae').replace(/ø/g,'o').replace(/å/g,'a');
  // Strip combining diacritics (é→e, ü→u, ś→s, ą→a, etc.)
  try { out = out.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch(e){}
  // Keep unicode letters + digits + spaces, replace everything else with space.
  try { out = out.replace(/[^\p{L}\p{N} ]/gu, ' '); }
  catch(e){ out = out.replace(/[^a-z0-9 ]/g,' '); }
  return out.replace(/\s+/g,' ').trim();
}

/* ─── URL → translation key map ───
   Maps each tool URL to a list of keys in R() whose translated values should
   be included in the item's multilingual search haystack. Keeps SEARCH_DATA
   clean and makes it trivial to add more mappings later. */
var URL_TO_I18N_KEYS = {
  // Personlig økonomi
  '/personlig/#budsjett-wrapper': ['budsjettTitle','budsjettDesc','budsjettHowtoTitle','budsjettHowtoDesc','tabPerso','dashDescPerso'],
  '/personlig/#bil-wrapper':       ['bilTitle','bilDesc'],
  '/personlig/#spare-wrapper':     ['spareTitle','spareDesc'],
  '/personlig/#studie-wrapper':    ['studieTitle','studieDesc'],
  '/personlig/#lonn-wrapper':      ['lonnTitle','lonnDesc','lonnHowtoTitle','lonnHowtoDesc'],
  '/personlig/#abo-wrapper':       ['aboTitle','aboDesc'],
  // Boliglån
  '/boliglan/#mor-wrapper':        ['morTitle','morDesc','morInfoTitle','morInfoDesc','tabMor'],
  '/boliglan/#dok-wrapper':        ['dokTitle','dokDesc'],
  '/boliglan/#mor-bsu-card':       ['morBsuTitle','morBsuDesc'],
  // Kalkulator (fagkalkulatorer)
  '/kalkulator/':                  ['tabBasic','cmBasic','cmLabel'],
  '/kalkulator/#scientific':       ['cmScientific'],
  '/kalkulator/#unit':             ['cmUnit'],
  '/kalkulator/#finance':          ['cmFinance','cmFinCalcs'],
  '/kalkulator/#aga':              ['lblAga','agaRTotal','agaSal','salAgaTitle','salAgaDesc'],
  '/kalkulator/#avs':              ['lblAvs'],
  '/kalkulator/#ferie':            ['lblFerie','agaFerie','lonnRlFeriepenger'],
  '/kalkulator/#rente':            ['lblRente','renteEffLabel','renteAmountLabel','renteIntro'],
  '/kalkulator/#valgevinst':       ['lblValgevinst'],
  '/kalkulator/#likvid':           ['lblLikvid','likvidIntro'],
  '/kalkulator/#npv':              ['npvTitle','npvDesc','cmFcNpv'],
  '/kalkulator/#pensjon':          ['lblPensjon','pensjonHint'],
  '/kalkulator/#lvu':              ['lblLvu','lvuRSal','lvuRDiv','lvuGross'],
  // Skatt
  '/skatt/#sal-salary-card':       ['salTitle','salDesc','tabSal','cmFcSal'],
  '/skatt/#formue-wrapper':        ['formueTitle','formueDesc'],
  '/skatt/#reise-wrapper':         ['reiseTitle','reiseDesc'],
  // Avgift
  '/avgift/#vat-wrapper':          ['vatTitle','vatDesc','tabVat','cmFcVat'],
  '/avgift/#vat-adj-card':         ['vatAdjTitle','vatAdjDesc'],
  // Selskap
  '/selskap/#selskap-velg-card':    ['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-as-card':     ['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-enk-card':    ['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-ans-card':    ['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-ks-card':     ['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-andre-card':  ['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-compare-card':['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-skatt-card':  ['tabSelskap','dashDescSelskap'],
  '/selskap/#selskap-reg-card':    ['tabSelskap','dashDescSelskap']
};

/* ─── URL → display key map ───
   Maps each search item's URL to translation keys for the DISPLAYED
   title and description. Used when rendering result rows so the
   dropdown respects the active UI language. Falls back to the
   hardcoded Norwegian name/desc when a key is missing or empty. */
var URL_TO_DISPLAY = {
  // Personlig økonomi
  '/personlig/#budsjett-wrapper': {title:'budsjettTitle', desc:'budsjettDesc'},
  '/personlig/#bil-wrapper':      {title:'bilTitle',      desc:'bilDesc'},
  '/personlig/#spare-wrapper':    {title:'spareTitle',    desc:'spareDesc'},
  '/personlig/#studie-wrapper':   {title:'studieTitle',   desc:'studieDesc'},
  '/personlig/#lonn-wrapper':     {title:'lonnTitle',     desc:'lonnDesc'},
  '/personlig/#abo-wrapper':      {title:'aboTitle',      desc:'aboDesc'},
  // Boliglån
  '/boliglan/#mor-wrapper':       {title:'morTitle',      desc:'morDesc'},
  '/boliglan/#dok-wrapper':       {title:'dokTitle',      desc:'dokDesc'},
  '/boliglan/#mor-bsu-card':      {title:'morBsuTitle',   desc:'morBsuDesc'},
  // Kalkulator
  '/kalkulator/':                 {title:'cmBasic'},
  '/kalkulator/#scientific':      {title:'cmScientific'},
  '/kalkulator/#unit':            {title:'cmUnit'},
  '/kalkulator/#finance':         {title:'cmFinance'},
  '/kalkulator/#aga':             {title:'lblAga'},
  '/kalkulator/#avs':             {title:'lblAvs'},
  '/kalkulator/#ferie':           {title:'lblFerie'},
  '/kalkulator/#rente':           {title:'lblRente',      desc:'renteIntro'},
  '/kalkulator/#valgevinst':      {title:'lblValgevinst'},
  '/kalkulator/#likvid':          {title:'lblLikvid',     desc:'likvidIntro'},
  '/kalkulator/#npv':             {title:'npvTitle',      desc:'npvDesc'},
  '/kalkulator/#pensjon':         {title:'lblPensjon',    desc:'pensjonHint'},
  '/kalkulator/#lvu':             {title:'lblLvu'},
  // Skatt
  '/skatt/#sal-salary-card':      {title:'salTitle',      desc:'salDesc'},
  '/skatt/#sal-uttak-card':       {title:'uttakTitle',    desc:'uttakDesc'},
  '/skatt/#sal-utdeling-card':    {title:'utdelingTitle', desc:'utdelingDesc'},
  '/skatt/#formue-wrapper':       {title:'formueTitle',   desc:'formueDesc'},
  '/skatt/#reise-wrapper':        {title:'reiseTitle',    desc:'reiseDesc'},
  // Avgift
  '/avgift/#vat-wrapper':         {title:'vatTitle',      desc:'vatDesc'},
  '/avgift/#vat-adj-card':        {title:'adjTitle',      desc:'adjDesc'},
  // Selskap
  '/selskap/#selskap-velg-card':    {title:'selskapVelgTitle',    desc:'selskapVelgDesc'},
  '/selskap/#selskap-enk-card':     {title:'selskapEnkTitle',     desc:'selskapEnkDesc'},
  '/selskap/#selskap-as-card':      {title:'selskapAsTitle',      desc:'selskapAsDesc'},
  '/selskap/#selskap-ans-card':     {title:'selskapAnsTitle',     desc:'selskapAnsDesc'},
  '/selskap/#selskap-ks-card':      {title:'selskapKsTitle',      desc:'selskapKsDesc'},
  '/selskap/#selskap-compare-card': {title:'selskapCompareTitle', desc:'selskapCompareDesc'},
  '/selskap/#selskap-reg-card':     {title:'selskapRegTitle',     desc:'selskapRegDesc'},
  '/selskap/#selskap-andre-card':   {title:'selskapAndreTitle',   desc:'selskapAndreDesc'}
};

/* ─── Page label → translation key ───
   Maps the hardcoded Norwegian `page` strings in SEARCH_DATA to
   translation keys so the "page" chip in each result also
   follows the active UI language. */
var PAGE_KEY = {
  'Personlig økonomi': 'tabNpv',
  'Boliglån':          'tabMor',
  'Kalkulator':        'tabBasic',
  'Skatt':             'tabSal',
  'Avgift':            'tabVat',
  'Selskap':           'tabSelskap'
};

/* ─── Resolve display strings for a search item ───
   Returns {name, desc, page} with translations applied when available.
   Title/desc translation is only applied to tool items — several
   concepts and laws legitimately share a URL with a tool (e.g.
   Annuitetslån concept + Boliglånskalkulator tool both on
   /boliglan/#mor-wrapper), and we must not collapse those distinct
   entries into the same displayed name. Page label is always
   translated since it's purely a category. */
function resolveDisplay(item){
  var out = { name: item.name, desc: item.desc, page: item.page };
  try {
    var r = (typeof R === 'function') ? R() : null;
    if(!r) return out;
    if(item.type === 'tool'){
      var disp = URL_TO_DISPLAY[item.url];
      if(disp){
        if(disp.title && typeof r[disp.title]==='string' && r[disp.title].trim()) out.name = r[disp.title];
        if(disp.desc  && typeof r[disp.desc]==='string'  && r[disp.desc].trim())  out.desc = r[disp.desc];
      }
    } else if(item.sk && r.searchDn && r.searchDn[item.sk]){
      // Concept/law items: look up translated display name by sk key
      out.name = r.searchDn[item.sk];
      if(r.searchDs && r.searchDs[item.sk]) out.desc = r.searchDs[item.sk];
    }
    var pk = PAGE_KEY[item.page];
    if(pk && typeof r[pk]==='string' && r[pk].trim()) out.page = r[pk];
  } catch(e){}
  return out;
}

/* ─── Multilingual haystack cache ─── */
// For each item, precompute a haystack that includes translated strings from
// the currently active language dictionary. Rebuilds when the language
// changes. This lets users type in their own language and still find tools.
var _i18nHaystacks = null;
var _i18nLang = null;
function buildI18nHaystacks(){
  try {
    var r = (typeof R === 'function') ? R() : null;
    if(!r) return null;
    // Collect all translated string values from R() into one big blob.
    var allVals = [];
    for(var k in r){
      if(Object.prototype.hasOwnProperty.call(r,k)){
        var v = r[k];
        if(typeof v === 'string') allVals.push(v);
        else if(Array.isArray(v)){
          // Flatten arrays of strings / nested arrays one level deep
          for(var i2=0;i2<v.length;i2++){
            if(typeof v[i2]==='string') allVals.push(v[i2]);
            else if(Array.isArray(v[i2])) allVals.push(v[i2].join(' '));
          }
        }
      }
    }
    var globalBlob = norm(allVals.join(' '));
    // Per-item i18n haystacks: resolve translation keys from URL_TO_I18N_KEYS
    // (or item.i18nKeys) and normalize the resulting strings.
    var hays = [];
    for(var i=0; i<SEARCH_DATA.length; i++){
      var it = SEARCH_DATA[i];
      var parts = [];
      var keys = it.i18nKeys || URL_TO_I18N_KEYS[it.url] || null;
      if(keys){
        for(var j=0;j<keys.length;j++){
          var kk=keys[j];
          var val=r[kk];
          if(!val) continue;
          if(typeof val==='string') parts.push(norm(val));
          else if(Array.isArray(val)) parts.push(norm(val.join(' ')));
        }
      }
      // Per-item translated keywords (searchKw[sk]) — primary source of
      // multilingual search terms for concepts, laws, and tools whose
      // URLs aren't in URL_TO_I18N_KEYS.
      if(it.sk && r.searchKw && r.searchKw[it.sk]){
        parts.push(norm(r.searchKw[it.sk]));
      }
      hays.push(parts.join(' '));
    }
    return {perItem:hays, global:globalBlob};
  } catch(e){ return null; }
}
function getI18nHaystacks(){
  var curLang = (typeof region !== 'undefined') ? region : 'no';
  if(!_i18nHaystacks || _i18nLang !== curLang){
    _i18nHaystacks = buildI18nHaystacks();
    _i18nLang = curLang;
  }
  return _i18nHaystacks;
}

/* ─── Score a search item against query ─── */
function scoreItem(item, q, itemIdx, hays){
  var qn = norm(q);
  var words = qn.split(' ').filter(Boolean);
  if(!words.length) return 0;

  var nameN = norm(item.name);
  var descN = norm(item.desc);
  var tagsN = norm(item.tags);
  // Append per-item translated haystack (if available) to the tag bag so
  // queries in the active UI language can hit translated names/descriptions.
  var i18nN = '';
  if(hays && hays.perItem && hays.perItem[itemIdx]){
    i18nN = hays.perItem[itemIdx];
    if(i18nN){ tagsN = tagsN + ' ' + i18nN; nameN = nameN + ' ' + i18nN; }
  }
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
  if(item.type === 'section') score += 30;
  else if(item.type === 'tool') score += 15;
  else if(item.type === 'concept') score += 5;

  return score;
}

/* ─── Lazy-load search-intents.js (80KB) — only when search is actually used.
   Pages without search never pay the download. matchIntent() returns null
   gracefully if not yet loaded (race-safe for first keystroke). */
var __hvtIntentsLoadStarted = false;
function loadSearchIntents(){
  if(__hvtIntentsLoadStarted || window.SEARCH_INTENTS) return;
  __hvtIntentsLoadStarted = true;
  var s = document.createElement('script');
  s.src = '/shared/search-intents.js?v=v1';
  s.async = true;
  document.head.appendChild(s);
}

/* ─── Intent pre-matcher (Mac-leveranse 2026-04-19) ─── */
function matchIntent(q){
  if(typeof window.SEARCH_INTENTS !== 'object' || !window.SEARCH_INTENTS) return null;
  var qn = q.toLowerCase().trim();
  if(!qn) return null;
  for(var section in window.SEARCH_INTENTS){
    var data = window.SEARCH_INTENTS[section];
    if(!data) continue;
    var targetMap = {};
    (data.targets||[]).forEach(function(t){ targetMap[t.id] = t; });
    var intents = data.intents || [];
    for(var i=0; i<intents.length; i++){
      var it = intents[i];
      var qMatch = (it.q||'').toLowerCase() === qn;
      var kwMatch = false;
      var kws = it.keywords || [];
      for(var j=0; j<kws.length; j++){
        if(kws[j] && qn.indexOf(kws[j].toLowerCase()) >= 0){ kwMatch = true; break; }
      }
      if(qMatch || kwMatch){
        var t = targetMap[it.target];
        if(t && t.url) return { url:t.url, name:t.name, desc:t.description };
      }
    }
  }
  return null;
}

/* ─── Search function ─── */
function search(q){
  if(!q || !q.trim()) return [];
  var hays = getI18nHaystacks();
  var results = [];
  for(var i=0; i<SEARCH_DATA.length; i++){
    var s = scoreItem(SEARCH_DATA[i], q, i, hays);
    if(s > 0) results.push({item:SEARCH_DATA[i], score:s});
  }
  results.sort(function(a,b){ return b.score - a.score; });
  var intent = matchIntent(q);
  if(intent){
    var dupIdx = -1;
    for(var k=0; k<results.length; k++){ if(results[k].item.url === intent.url){ dupIdx = k; break; } }
    if(dupIdx >= 0){
      results[dupIdx].score = 1000;
      results.sort(function(a,b){ return b.score - a.score; });
    } else {
      results.unshift({ item:{ name:intent.name, desc:intent.desc||'', url:intent.url, tags:'', type:'tool', page:'' }, score:1000 });
    }
  }
  return results.slice(0, 6);
}
// Invalidate translated haystacks when language changes — core.js should call
// this after setRegion(), but we also detect lazily on each search.
window.hvtSearchInvalidate = function(){ _i18nHaystacks = null; _i18nLang = null; };

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
  var kbdHint = T('searchKbdHint','Trykk / for å fokusere søket');

  wrap.innerHTML =
    '<div class="search-box">' +
      '<svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<input type="text" id="search-input" placeholder="'+placeholder+'" autocomplete="off" spellcheck="false">' +
      '<kbd class="search-kbd" title="'+kbdHint+'" aria-label="'+kbdHint+'">/</kbd>' +
    '</div>' +
    '<div class="search-dropdown" id="search-dropdown"></div>' +
    '<div class="search-suggestions" id="search-suggestions"></div>';

  point.parent.insertBefore(wrap, point.before);

  var input    = document.getElementById('search-input');
  var dropdown = document.getElementById('search-dropdown');
  var chips    = document.getElementById('search-suggestions');
  var activeIdx = -1;

  // Build suggestion chips (rebuildable on language change)
  function buildChips(){
    var popularLabel = T('searchPopular','Populære:');
    var chipHTML = '<span class="search-chip-label">'+popularLabel+'</span>';
    for(var i=0; i<SUGGESTED.length; i++){
      chipHTML += '<a href="'+SUGGESTED[i].url+'" class="search-chip">'+T(SUGGESTED[i].labelKey, SUGGESTED[i].fallback)+'</a>';
    }
    chips.innerHTML = chipHTML;
  }
  buildChips();
  // Expose so setRegion() / language switcher can retranslate chips
  window.hvtSearchRebuildChips = buildChips;

  // Show chips on focus (if input is empty) + close language dropdown + kickstart intents-load
  input.addEventListener('focus', function(){
    loadSearchIntents();
    // Close language dropdown when search is focused
    var rdd=document.getElementById('rdd');if(rdd)rdd.classList.remove('open');
    if(!input.value.trim()){
      chips.classList.add('visible');
      dropdown.classList.remove('visible');
    }
  });
  // Backup: load intents at idle time even if user never focuses search
  if('requestIdleCallback' in window){
    requestIdleCallback(loadSearchIntents, { timeout: 4000 });
  } else {
    setTimeout(loadSearchIntents, 3000);
  }

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
      var d = resolveDisplay(r);
      html += '<a href="'+r.url+'" class="search-result" data-idx="'+i+'">' +
        '<div class="search-result-left">' +
          '<div class="search-result-name">'+highlight(d.name, q)+'</div>' +
          '<div class="search-result-desc">'+d.desc+'</div>' +
        '</div>' +
        '<div class="search-result-right">' +
          '<span class="search-result-tag search-tag-'+r.type+'">'+typeLabel(r.type)+'</span>' +
          '<span class="search-result-page">'+d.page+'</span>' +
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
