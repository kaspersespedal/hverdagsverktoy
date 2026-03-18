export interface RegionStrings {
  flag: string;
  name: string;
  lang: string;
  currency: string;
  currencyCode: string;
  // Salary calculator
  salDefaults: { gross: number };
  salClasses: string[][];
  salRegions: string[][];
  salInfoRows: string[][];
  // Dashboard
  dashHome: string;
  dashToolsTitle: string;
  dashDescBasic: string;
  dashDescSal: string;
  dashDescMor: string;
  dashDescVat: string;
  dashDescNpv: string;
  // Theme
  themeLabel: string;
  themeBlue: string;
  themeCorporate: string;
  themeDark: string;
  themeGlass: string;
  themePink: string;
  themePurple: string;
  themeGreen: string;
  themePeach: string;
  themeFrost: string;
  // Tabs
  tabBasic: string;
  tabSal: string;
  tabMor: string;
  tabNpv: string;
  tabVat: string;
  // Salary
  salTitle: string;
  salDesc: string;
  lGross: string;
  lClass: string;
  lReg: string;
  btnCalc: string;
  salRNet: string;
  salRTax: string;
  salREff: string;
  salRSoc: string;
  salRDay: string;
  trinnLabel1: string;
  trinnLabel2: string;
  trinnLabel3: string;
  trinnLabel4: string;
  trinnLabel5: string;
  almSkattLabel: string;
  // Mortgage
  morTitle: string;
  morDesc: string;
  lAmount: string;
  lRate: string;
  lYears: string;
  morRMth: string;
  morRTot: string;
  morRInt: string;
  morRY1i: string;
  morRY1p: string;
  morRFirst: string;
  morRLast: string;
  morLType: string;
  morAnnuity: string;
  morSerial: string;
  calcError: string;
  // Interest-only mortgage
  morIoTitle: string;
  morIoDesc: string;
  ioLAmount: string;
  ioLRate: string;
  ioLIoFree: string;
  ioLTotal: string;
  ioRLbl: string;
  ioSecDuring: string;
  ioSecAfter: string;
  ioSecCompare: string;
  ioRlMthFree: string;
  ioRlTotFree: string;
  ioRlMthAfter: string;
  ioRlIntAfter: string;
  ioRlTotIntIo: string;
  ioRlTotIntAnn: string;
  ioRlDiff: string;
  ioRlAnnMth: string;
  ioRSub: string;
  // NPV
  npvTitle: string;
  npvDesc: string;
  lInv: string;
  lRateD: string;
  lCF1: string;
  lCF2: string;
  lCF3: string;
  lCF4: string;
  lCF5: string;
  npvRLbl: string;
  npvRPay: string;
  npvRSum: string;
  npvRPi: string;
  npvPos: string;
  npvNeg: string;
  yr: string;
  mo: string;
  // VAT
  vatTitle: string;
  vatDesc: string;
  lVatAmount: string;
  lVatRate: string;
  lVatType: string;
  vatOptEx: string;
  vatOptInc: string;
  vatRIncl: string;
  vatRExcl: string;
  vatRTax: string;
  vatRPct: string;
  vatRInclCalc: string;
  vatRExclCalc: string;
  vatRInputTag: string;
  // Adjustment calculator
  adjTitle: string;
  adjDesc: string;
  adjLType: string;
  adjOptProp: string;
  adjOptMach: string;
  adjLMva: string;
  adjLPeriod: string;
  adjLYears: string;
  adjLOld: string;
  adjLNew: string;
  adjBtn: string;
  adjRlBase: string;
  adjRlAnnual: string;
  adjRlRemain: string;
  adjRlChange: string;
  adjUnder: string;
  adjExpired: string;
  adjRepay: string;
  adjIncrease: string;
  adjUnderSub: string;
  adjExpiredSub: string;
  adjRepaySub: string;
  adjIncreaseSub: string;
  // Professional calculators
  lblFagcalc: string;
  lblLvu: string;
  lblAga: string;
  lblAvs: string;
  lblFerie: string;
  lblRente: string;
  lblProsent: string;
  lblValgevinst: string;
  lblLikvid: string;
  lblPensjon: string;
  // LVU
  lvuGross: string;
  lvuZone: string;
  lvuBtn: string;
  lvuRSal: string;
  lvuRDiv: string;
  lvuRDiff: string;
  // AGA
  agaSal: string;
  agaZone: string;
  agaFerie: string;
  agaOtp: string;
  agaBtn: string;
  agaRTotal: string;
  agaRAga: string;
  agaRFerie: string;
  agaROtp: string;
  agaRPct: string;
  agaPerMonth: string;
  agaZoneOpts: string[];
  agaFerieOpts: string[];
  agaOtpOpts: string[];
  // Depreciation
  avsPriceLabel: string;
  avsGroupLabel: string;
  avsBtn: string;
  avsDepTableHeader: string;
  avsGroupOpts: string[];
  avsColYear: string;
  avsColStart: string;
  avsColDepr: string;
  avsColEnd: string;
  // Holiday pay
  ferieAnnualLabel: string;
  ferieTypeLabel: string;
  ferieOver60Label: string;
  ferieBtn: string;
  ferieAmtLabel: string;
  ferieDailyLabel: string;
  ferieOver60Result: string;
  ferie4w: string;
  ferie5w: string;
  ferieTypeOpts: string[];
  // Effective interest
  renteAmountLabel: string;
  renteNomLabel: string;
  renteEstLabel: string;
  renteMonthlyLabel: string;
  renteYearsLabel: string;
  renteBtn: string;
  renteEffLabel: string;
  renteTotalLabel: string;
  renteFeesLabel: string;
  // Percentage
  prosentModeLabel: string;
  prosentOpt1: string;
  prosentOpt2: string;
  prosentOpt3: string;
  prosentBtn: string;
  prosentResultLabel: string;
  prosentPct: string;
  prosentAmount: string;
  prosentTotal: string;
  prosentStartValue: string;
  prosentEndValue: string;
  // Currency gain
  valgevinCurrencyLabel: string;
  valgevinUnitsLabel: string;
  valgevinCostLabel: string;
  valgevinSaleLabel: string;
  valgevinTaxLabel: string;
  valgevinNetLabel: string;
  valgevinBtn: string;
  valgevinResultLabel: string;
  valgevinGain: string;
  valgevinLoss: string;
  // Liquidity
  likvidStartLabel: string;
  likvidIncomeLabel: string;
  likvidExpenseLabel: string;
  likvidBtn: string;
  likvidColMonth: string;
  likvidColStart: string;
  likvidColIncome: string;
  likvidColExpense: string;
  likvidColEnd: string;
  likvidMnd: string;
  // Pension
  pensjonAgeLabel: string;
  pensjonRetireLabel: string;
  pensjonSalaryLabel: string;
  pensjonOtpLabel: string;
  pensjonReturnLabel: string;
  pensjonBtn: string;
  pensjonPotLabel: string;
  pensjonAnnualLabel: string;
  pensjonMonthlyLabel: string;
  pensjonRealLabel: string;
  pensjonDisclaimer: string;
  pensjonOtpOpts: string[];
  // LVU zone opts
  lvuZoneOpts: string[];
  // Finance calculator
  fcLblType: string;
  fcTvm: string;
  fcMargin: string;
  fcBe: string;
  fcCompound: string;
  fcDiscount: string;
  fcPv: string;
  fcRate: string;
  fcYears: string;
  fcPmt: string;
  fcCost: string;
  fcSell: string;
  fcFixed: string;
  fcPriceU: string;
  fcVarCost: string;
  fcPrinc: string;
  fcFreq: string;
  fcOrig: string;
  fcDiscPct: string;
  fcBtn: string;
  fcResLbl: string;
  fcRFv: string;
  fcRAfter: string;
  fcRYr: string;
  fcRStart: string;
  fcRTotalPmt: string;
  fcRInterest: string;
  fcRReturn: string;
  fcRProfit: string;
  fcRRevenue: string;
  fcRContrib: string;
  fcRContribMarg: string;
  fcRBePoint: string;
  fcRUnits: string;
  fcREndVal: string;
  fcRMonthly: string;
  fcRDoubling: string;
  fcRDiscPrice: string;
  fcRSaved: string;
  fcRDiscount: string;
  fcRYouPay: string;
  fcROfPrice: string;
  // Quick reference
  drTax1: string;
  drTax2: string;
  drTax3: string;
  drTax4: string;
  drTax5: string;
  drVat1: string;
  drVat2: string;
  drVat3: string;
  drVat4: string;
  drDed1: string;
  drDed2: string;
  drDed3: string;
  drDed4: string;
  dashRefTax: string;
  dashRefVat: string;
  dashRefDed: string;
  // Withdrawal (uttak)
  uttakNoGain: string;
  uttakEnkTotal: string;
  uttakEffRate: string;
  uttakNetAfterTax: string;
  uttakAsTotal: string;
  uttakAsLevels: string;
  // Unit converter
  ucLblCat: string;
  ucFrom: string;
  ucTo: string;
  ucValue: string;
  ucResult: string;
  ccSwap: string;
  ccLive: string;
  ccApprox: string;
  ccAmount: string;
  // Misc
  footerCopy: string;
  [key: string]: any;
}

export const REGIONS: Record<string, RegionStrings> = {
  no: {
    flag: '\u{1F1F3}\u{1F1F4}', name: 'Norsk', lang: 'no', currency: 'kr', currencyCode: 'NOK',
    salDefaults: { gross: 800000 },
    salClasses: [['1','Klasse 1 (Standard)'],['2','Klasse 2 (Gift m/lav inntekt)'],['self','Selvstendig naringsdrivende']],
    salRegions: [['0.22','Standard (hele landet)'],['0.185','Finnmark / Nord-Troms (tiltakssonen)']],
    salInfoRows: [['Personfradrag','114 540 kr'],['Minstefradrag (maks)','95 700 kr'],['Trinnskatt 1 (226k+)','1.7%'],['Trinnskatt 2 (318k+)','4.0%'],['Trinnskatt 3 (725k+)','13.7%'],['Trinnskatt 4 (980k+)','16.8%'],['Trinnskatt 5 (1 467k+)','17.8%'],['Trygdeavgift','7.6%'],['Alminnelig skatt','22%']],
    dashHome: 'Hjem', dashToolsTitle: 'Verktoy',
    dashDescBasic: 'Enkel, finansiell, vitenskapelig og enhetskonvertering',
    dashDescSal: 'Beregn nettoinntekt fra brutto arslonn med trinnskatt',
    dashDescMor: 'Manedlig betaling, annuitet og serielan',
    dashDescVat: 'MVA, arbeidsgiveravgift og andre avgifter',
    dashDescNpv: 'NPV, IRR og tilbakebetalingstid for investeringer',
    themeLabel: 'Tema', themeBlue: 'Bla', themeCorporate: 'Skarp', themeDark: 'Mork', themeGlass: 'Glass', themePink: 'Rosa', themePurple: 'Lilla', themeGreen: 'Gronn', themePeach: 'Fersken', themeFrost: 'Standard',
    tabBasic: 'Kalkulator', tabSal: 'Skatt', tabMor: 'Boliglan', tabNpv: 'Lonnsomhetsanalyse', tabVat: 'Avgift',
    salTitle: 'Lonn etter skatt', salDesc: 'Beregn nettoinntekt fra brutto arslonn.', lGross: 'Arlig bruttolonn (kr)', lClass: 'Skatteklasse', lReg: 'Kommune/region', btnCalc: 'Beregn',
    salRNet: 'Arlig nettolonn', salRTax: 'Total skatt', salREff: 'Effektiv skattesats', salRSoc: 'Trygdeavgift', salRDay: 'Daglig netto',
    trinnLabel1: 'Trinn 1', trinnLabel2: 'Trinn 2', trinnLabel3: 'Trinn 3', trinnLabel4: 'Trinn 4', trinnLabel5: 'Trinn 5', almSkattLabel: 'Alminnelig inntektsskatt',
    morTitle: 'Boliglanskalkulator', morDesc: 'Manedlig betaling og total lanskostnad.', lAmount: 'Lanebelop (kr)', lRate: 'Rente (%)', lYears: 'Nedbetalingstid (ar)',
    morRMth: 'Manedlig betaling', morRTot: 'Totalt tilbakebetalt', morRInt: 'Total rente', morRY1i: 'Rente ar 1', morRY1p: 'Avdrag ar 1', morRFirst: 'Forste maned', morRLast: 'Siste maned',
    morLType: 'Lanetype', morAnnuity: 'Annuitet', morSerial: 'Serielan', calcError: 'Feil',
    morIoTitle: 'Avdragsfritt lan', morIoDesc: 'Sammenlign avdragsfritt med annuitet fra dag 1',
    ioLAmount: 'Lanebelop (kr)', ioLRate: 'Rente (%)', ioLIoFree: 'Avdragsfri periode (ar)', ioLTotal: 'Total lanetid (ar)',
    ioRLbl: 'Avdragsfritt lan - oversikt', ioSecDuring: 'Under avdragsfri periode', ioSecAfter: 'Etter avdragsfri periode', ioSecCompare: 'Sammenligning',
    ioRlMthFree: 'Manedlig betaling (kun renter)', ioRlTotFree: 'Total rente i perioden', ioRlMthAfter: 'Manedlig betaling (annuitet)', ioRlIntAfter: 'Rente resterende periode',
    ioRlTotIntIo: 'Total rente (med avdragsfritt)', ioRlTotIntAnn: 'Total rente (annuitet fra dag 1)', ioRlDiff: 'Ekstra rentekostnad', ioRlAnnMth: 'Manedlig annuitet fra dag 1',
    ioRSub: 'Ekstra rentekostnad vs. annuitet fra dag 1',
    npvTitle: 'NPV / IRR Kalkulator', npvDesc: 'Netto navaerdi og internrente for investeringsprosjekter.', lInv: 'Investering (kr)', lRateD: 'Diskonteringsrente (%)', lCF1: 'Kontantstr. ar 1', lCF2: 'Kontantstr. ar 2', lCF3: 'Kontantstr. ar 3', lCF4: 'Kontantstr. ar 4', lCF5: 'Kontantstr. ar 5',
    npvRLbl: 'Netto navaerdi (NPV)', npvRPay: 'Tilbakebetalingstid', npvRSum: 'Sum kontantstrommer', npvRPi: 'Lonnshetsindeks',
    npvPos: 'Lonnsom investering - aksepter', npvNeg: 'Ulonnsom investering - avvis', yr: 'ar', mo: '/mnd',
    vatTitle: 'MVA-kalkulator', vatDesc: 'Beregn belop med og uten MVA.', lVatAmount: 'Belop (kr)', lVatRate: 'MVA-sats', lVatType: 'Beloptype',
    vatOptEx: 'Belop uten MVA - legg til MVA', vatOptInc: 'Belop inkl. MVA - trekk fra MVA',
    vatRIncl: 'Inkl. MVA', vatRExcl: 'Ekskl. MVA', vatRTax: 'MVA-belop', vatRPct: 'Sats %',
    vatRInclCalc: 'Pris inkl. MVA', vatRExclCalc: 'Pris ekskl. MVA', vatRInputTag: '(din input)',
    adjTitle: 'Justeringskalkulator', adjDesc: 'Mval. kap. 9 - justering av inngaende MVA ved bruksendring',
    adjLType: 'Type kapitalgjenstand', adjOptProp: 'Fast eiendom (par. 9-1 b) - 10 ar', adjOptMach: 'Maskiner/inventar (par. 9-1 a) - 5 ar',
    adjLMva: 'Total inngaende MVA', adjLPeriod: 'Justeringsperiode (ar)', adjLYears: 'Ar brukt for endring',
    adjLOld: 'Opprinnelig fradragsandel (%)', adjLNew: 'Ny fradragsandel (%)', adjBtn: 'Beregn justering',
    adjRlBase: 'Arlig grunnbelop (MVA/periode)', adjRlAnnual: 'Arlig justering', adjRlRemain: 'Gjenstaaende ar', adjRlChange: 'Andelsendring',
    adjUnder: 'Under terskelverdi', adjExpired: 'Justeringsperioden utlopt', adjRepay: 'Tilbakebetaling til staten', adjIncrease: 'Okt fradrag',
    adjUnderSub: 'Inngaende MVA ma overstige {t} for justeringsplikt', adjExpiredSub: 'Alle {p} ar er brukt - ingen justering nodvendig',
    adjRepaySub: 'Du ma tilbakebetale {a} i tidligere fradragfort MVA', adjIncreaseSub: 'Du kan kreve {a} i ekstra MVA-fradrag',
    lblFagcalc: 'Fagkalkulatorer', lblLvu: 'Lonn vs Utbytte', lblAga: 'Ansattkostnad', lblAvs: 'Avskrivning', lblFerie: 'Feriepenger', lblRente: 'Effektiv Rente', lblProsent: 'Prosent', lblValgevinst: 'Valutagevinst', lblLikvid: 'Likviditet', lblPensjon: 'Pensjon',
    lvuGross: 'Bruttobelop', lvuZone: 'AGA-sone', lvuBtn: 'Beregn', lvuRSal: 'Lonn - total kostnad', lvuRDiv: 'Utbytte - total kostnad', lvuRDiff: 'Differanse (billigst)',
    agaSal: 'Arslonn brutto', agaZone: 'AGA-sone', agaFerie: 'Feriepenger', agaOtp: 'OTP-sats', agaBtn: 'Beregn', agaRTotal: 'Arlig totalkostnad', agaRAga: 'AGA', agaRFerie: 'Feriepenger', agaROtp: 'OTP', agaRPct: 'Prosent av brutto', agaPerMonth: '/mnd',
    agaZoneOpts: ['Sone I (14.1%) - By/sentral','Sone Ia/II (10.6%) - Distrikt','Sone III (6.4%) - Rural','Sone IV (5.1%) - Nord-Troms','Sone V (0%) - Finnmark/Nord-Troms'],
    agaFerieOpts: ['10.2% (4 uker ferie)','12% (5 uker ferie)'],
    agaOtpOpts: ['2% (lovlig minimum)','5%','7%'],
    avsPriceLabel: 'Kjopspris (kr)', avsGroupLabel: 'Avskrivningsgruppe', avsBtn: 'Beregn', avsDepTableHeader: '10-ars avskrivningsplan',
    avsGroupOpts: ['a: 30% - Kontormaskiner m.m.','b: 20% - Goodwill','c: 24% - Lastebiler, busser m.m.','d: 20% - Personbiler, maskiner, inventar','e: 14% - Skip, fartoy, rigger','f: 12% - Fly, helikoptre','g: 5% - Elektroteknisk utstyr i kraftselskaper','h: 4% - Bygninger og anlegg (husdyrbygg 6%, enkle 10%)','i: 2% - Forretningsbygg','j: 10% - Fast teknisk installasjon i bygning'],
    avsColYear: 'Ar', avsColStart: 'Verdi start', avsColDepr: 'Avskrivning', avsColEnd: 'Verdi slutt',
    ferieAnnualLabel: 'Arslonn', ferieTypeLabel: 'Ferietype', ferieOver60Label: 'Over 60 ar (+2.3% bonus)', ferieBtn: 'Beregn', ferieAmtLabel: 'Feriepenger', ferieDailyLabel: 'Dagsats', ferieOver60Result: 'Med 60+ bonus', ferie4w: '4 uker (10.2%)', ferie5w: '5 uker (12%)',
    ferieTypeOpts: ['4 uker (10.2%)','5 uker (12%)'],
    renteAmountLabel: 'Lanebelop (kr)', renteNomLabel: 'Nominell rente (%)', renteEstLabel: 'Etableringsgebyr (kr)', renteMonthlyLabel: 'Manedlig gebyr (kr)', renteYearsLabel: 'Lanetid (ar)', renteBtn: 'Beregn', renteEffLabel: 'Effektiv arsrente', renteTotalLabel: 'Total kostnad', renteFeesLabel: 'Totale gebyrer',
    prosentModeLabel: 'Beregningstype', prosentOpt1: 'Hva er X% av Y?', prosentOpt2: 'X er hva % av Y?', prosentOpt3: 'Prosentendring fra X til Y', prosentBtn: 'Beregn', prosentResultLabel: 'Resultat', prosentPct: 'Prosent (%)', prosentAmount: 'Belop', prosentTotal: 'Totalt', prosentStartValue: 'Startverdi', prosentEndValue: 'Sluttverdi',
    valgevinCurrencyLabel: 'Valuta', valgevinUnitsLabel: 'Antall enheter kjopt', valgevinCostLabel: 'Kostpris (NOK)', valgevinSaleLabel: 'Salgsverdi (NOK)', valgevinTaxLabel: 'Skatt (22%)', valgevinNetLabel: 'Netto etter skatt', valgevinBtn: 'Beregn', valgevinResultLabel: 'Gevinst/Tap (kr)', valgevinGain: 'Gevinst', valgevinLoss: 'Tap',
    likvidStartLabel: 'Startsaldo (kr)', likvidIncomeLabel: 'Manedlig inntekt (kr)', likvidExpenseLabel: 'Manedlig utgift (kr)', likvidBtn: 'Beregn',
    likvidColMonth: 'Maned', likvidColStart: 'Start', likvidColIncome: 'Inntekt', likvidColExpense: 'Utgift', likvidColEnd: 'Slutt', likvidMnd: 'Mnd',
    pensjonAgeLabel: 'Navaerende alder', pensjonRetireLabel: 'Pensjonsalder', pensjonSalaryLabel: 'Arslonn', pensjonOtpLabel: 'OTP-sats', pensjonReturnLabel: 'Avkastning (%)', pensjonBtn: 'Beregn',
    pensjonPotLabel: 'Total pensjonspott ved 67', pensjonAnnualLabel: 'Estimert arlig pensjon', pensjonMonthlyLabel: 'Manedlig pensjon', pensjonRealLabel: 'Dagens kjopekraft (2% inflasjon)', pensjonDisclaimer: 'Dette er kun et estimat. Faktisk pensjon kan variere basert pa faktisk avkastning, innskudd og regelendringer.',
    pensjonOtpOpts: ['2% (lovlig minimum)','5%','7%'],
    lvuZoneOpts: ['Sone I (14.1%)','Sone Ia/II (10.6%)','Sone III (6.4%)','Sone V (0%)'],
    fcLblType: 'Kalkulatortype', fcTvm: 'Navaerdi/Sluttverdi (TVM)', fcMargin: 'Margin og paaslag', fcBe: 'Nullpunkt', fcCompound: 'Rentes rente', fcDiscount: 'Rabattberegning',
    fcPv: 'Navaerdi (PV)', fcRate: 'Arlig rente (%)', fcYears: 'Antall ar', fcPmt: 'Arlig innbetaling', fcCost: 'Kostpris', fcSell: 'Salgspris', fcFixed: 'Faste kostnader', fcPriceU: 'Salgspris per enhet', fcVarCost: 'Variable kostnader per enhet', fcPrinc: 'Startbelop', fcFreq: 'Rentebetalinger per ar', fcOrig: 'Opprinnelig pris', fcDiscPct: 'Rabatt (%)', fcBtn: 'Beregn', fcResLbl: 'Resultat',
    fcRFv: 'Sluttverdi (FV)', fcRAfter: 'Etter', fcRYr: 'ar', fcRStart: 'Startbelop', fcRTotalPmt: 'Totale innbetalinger', fcRInterest: 'Opptjent rente', fcRReturn: 'Total avkastning', fcRProfit: 'Fortjeneste', fcRRevenue: 'Nodvendig omsetning', fcRContrib: 'Dekningsbidrag per enhet', fcRContribMarg: 'Dekningsgrad', fcRBePoint: 'Nullpunkt', fcRUnits: 'enheter', fcREndVal: 'Sluttverdi', fcRMonthly: 'med manedlig rente', fcRDoubling: 'Dobling etter', fcRDiscPrice: 'Pris etter rabatt', fcRSaved: 'Du sparer', fcRDiscount: 'Rabatt', fcRYouPay: 'Du betaler', fcROfPrice: 'av prisen',
    drTax1: 'Alminnelig skatt', drTax2: 'Trygdeavgift', drTax3: 'Trinnskatt 1 (226k+)', drTax4: 'Trinnskatt 2 (318k+)', drTax5: 'Trinnskatt 3 (725k+)',
    drVat1: 'Standard', drVat2: 'Naringsmidler', drVat3: 'Transport/hotell/kino', drVat4: 'Fritatt (eksport m.m.)',
    drDed1: 'Personfradrag', drDed2: 'Minstefradrag (maks)', drDed3: 'Fagforening (maks)', drDed4: 'Rentefradrag',
    dashRefTax: 'Skattesatser 2026', dashRefVat: 'MVA-satser', dashRefDed: 'Fradrag 2026',
    uttakNoGain: 'Ingen gevinst', uttakEnkTotal: 'Total skatt ved uttak (ENK)', uttakEffRate: 'Effektiv skattesats', uttakNetAfterTax: 'Netto etter skatt', uttakAsTotal: 'Total skattekostnad (AS - begge nivaer)', uttakAsLevels: 'Selskap + aksjonaer',
    ucLblCat: 'Kategori', ucFrom: 'Fra', ucTo: 'Til', ucValue: 'Verdi', ucResult: 'Resultat', ccSwap: 'Bytt', ccLive: '(live)', ccApprox: '(ca.)', ccAmount: 'Belop',
    footerCopy: '2024 Hverdagsverktoy - kun veiledende, ikke profesjonell rad.',
  },
  en: {
    flag: '\u{1F1EC}\u{1F1E7}', name: 'English', lang: 'en', currency: 'kr', currencyCode: 'NOK',
    salDefaults: { gross: 800000 },
    salClasses: [['1','Class 1 (Standard)'],['2','Class 2 (Married w/low income)'],['self','Self-employed']],
    salRegions: [['0.22','Standard (nationwide)'],['0.185','Finnmark / Northern Troms (incentive zone)']],
    salInfoRows: [['Personal allowance (Personfradrag)','114 540 kr'],['Minimum deduction (Minstefradrag, max)','95 700 kr'],['Bracket tax 1 (226k+)','1.7%'],['Bracket tax 2 (318k+)','4.0%'],['Bracket tax 3 (725k+)','13.7%'],['Bracket tax 4 (980k+)','16.8%'],['Bracket tax 5 (1 467k+)','17.8%'],['National insurance contribution (Trygdeavgift)','7.6%'],['Ordinary tax (Alminnelig skatt)','22%']],
    dashHome: 'Home', dashToolsTitle: 'Tools',
    dashDescBasic: 'Basic, financial, scientific and unit conversion',
    dashDescSal: 'Calculate net income from gross annual salary with bracket tax',
    dashDescMor: 'Monthly payment, annuity and serial loans',
    dashDescVat: 'Calculate amounts with and without VAT',
    dashDescNpv: 'NPV, IRR and payback period for investments',
    themeLabel: 'Theme', themeBlue: 'Blue', themeCorporate: 'Sharp', themeDark: 'Dark', themeGlass: 'Glass', themePink: 'Pink', themePurple: 'Purple', themeGreen: 'Green', themePeach: 'Peach', themeFrost: 'Standard',
    tabBasic: 'Calculator', tabSal: 'Tax', tabMor: 'Mortgage', tabNpv: 'Profitability', tabVat: 'VAT',
    salTitle: 'Salary after tax', salDesc: 'Calculate net income from gross annual salary.', lGross: 'Annual gross salary (kr)', lClass: 'Tax class', lReg: 'Municipality/region', btnCalc: 'Calculate',
    salRNet: 'Annual net salary', salRTax: 'Total tax', salREff: 'Effective tax rate', salRSoc: 'Social security', salRDay: 'Daily net',
    trinnLabel1: 'Bracket 1', trinnLabel2: 'Bracket 2', trinnLabel3: 'Bracket 3', trinnLabel4: 'Bracket 4', trinnLabel5: 'Bracket 5', almSkattLabel: 'Ordinary income tax',
    morTitle: 'Mortgage Calculator', morDesc: 'Monthly payment and total loan cost.', lAmount: 'Loan amount (kr)', lRate: 'Interest rate (%)', lYears: 'Term (years)',
    morRMth: 'Monthly payment', morRTot: 'Total repaid', morRInt: 'Total interest', morRY1i: 'Interest year 1', morRY1p: 'Principal year 1', morRFirst: 'First month', morRLast: 'Last month',
    morLType: 'Loan type', morAnnuity: 'Annuity', morSerial: 'Serial loan', calcError: 'Error',
    morIoTitle: 'Interest-only loan', morIoDesc: 'Compare interest-only with annuity from day 1',
    ioLAmount: 'Loan amount (kr)', ioLRate: 'Interest rate (%)', ioLIoFree: 'Interest-only period (years)', ioLTotal: 'Total loan period (years)',
    ioRLbl: 'Interest-only loan - overview', ioSecDuring: 'During interest-only period', ioSecAfter: 'After interest-only period', ioSecCompare: 'Comparison',
    ioRlMthFree: 'Monthly payment (interest only)', ioRlTotFree: 'Total interest in period', ioRlMthAfter: 'Monthly payment (annuity)', ioRlIntAfter: 'Interest remaining period',
    ioRlTotIntIo: 'Total interest (with interest-only)', ioRlTotIntAnn: 'Total interest (annuity from day 1)', ioRlDiff: 'Extra interest cost', ioRlAnnMth: 'Monthly annuity from day 1',
    ioRSub: 'Extra interest cost vs. annuity from day 1',
    npvTitle: 'NPV / IRR Calculator', npvDesc: 'Net present value and internal rate of return.', lInv: 'Investment (kr)', lRateD: 'Discount rate (%)', lCF1: 'Cash flow year 1', lCF2: 'Cash flow year 2', lCF3: 'Cash flow year 3', lCF4: 'Cash flow year 4', lCF5: 'Cash flow year 5',
    npvRLbl: 'Net present value (NPV)', npvRPay: 'Payback period', npvRSum: 'Cash flow total', npvRPi: 'Profitability index',
    npvPos: 'Profitable investment - accept', npvNeg: 'Unprofitable investment - reject', yr: 'yrs', mo: '/mo',
    vatTitle: 'VAT Calculator', vatDesc: 'Calculate amounts with and without VAT.', lVatAmount: 'Amount (kr)', lVatRate: 'VAT rate', lVatType: 'Amount type',
    vatOptEx: 'Amount excl. VAT - add VAT', vatOptInc: 'Amount incl. VAT - deduct VAT',
    vatRIncl: 'Incl. VAT', vatRExcl: 'Excl. VAT', vatRTax: 'VAT amount', vatRPct: 'Rate %',
    vatRInclCalc: 'Price incl. VAT', vatRExclCalc: 'Price excl. VAT', vatRInputTag: '(your input)',
    adjTitle: 'Adjustment Calculator', adjDesc: 'VAT Act ch. 9 - adjustment of input VAT on change of use',
    adjLType: 'Capital asset type', adjOptProp: 'Real estate (s. 9-1 b) - 10 years', adjOptMach: 'Machines/equipment (s. 9-1 a) - 5 years',
    adjLMva: 'Total input VAT', adjLPeriod: 'Adjustment period (years)', adjLYears: 'Years used before change',
    adjLOld: 'Original deduction share (%)', adjLNew: 'New deduction share (%)', adjBtn: 'Calculate adjustment',
    adjRlBase: 'Annual base amount (VAT/period)', adjRlAnnual: 'Annual adjustment', adjRlRemain: 'Remaining years', adjRlChange: 'Share change',
    adjUnder: 'Below threshold', adjExpired: 'Adjustment period expired', adjRepay: 'Repayment to state', adjIncrease: 'Increased deduction',
    adjUnderSub: 'Input VAT must exceed {t} for adjustment obligation', adjExpiredSub: 'All {p} years used - no adjustment needed',
    adjRepaySub: 'You must repay {a} of previously deducted VAT', adjIncreaseSub: 'You can claim {a} in additional VAT deduction',
    lblFagcalc: 'Professional Calculators', lblLvu: 'Salary vs Dividend', lblAga: 'Employee Cost', lblAvs: 'Depreciation', lblFerie: 'Holiday Pay', lblRente: 'Effective Interest', lblProsent: 'Percentage', lblValgevinst: 'Currency Gain', lblLikvid: 'Liquidity', lblPensjon: 'Pension',
    lvuGross: 'Gross amount', lvuZone: 'AGA zone', lvuBtn: 'Calculate', lvuRSal: 'Salary - total cost', lvuRDiv: 'Dividend - total cost', lvuRDiff: 'Difference (cheapest)',
    agaSal: 'Annual gross salary', agaZone: 'AGA zone', agaFerie: 'Holiday pay', agaOtp: 'OTP rate', agaBtn: 'Calculate', agaRTotal: 'Annual total cost', agaRAga: 'AGA', agaRFerie: 'Holiday pay', agaROtp: 'OTP', agaRPct: '% of gross', agaPerMonth: '/mo',
    agaZoneOpts: ['Zone I (14.1%) - Urban/central','Zone Ia/II (10.6%) - District','Zone III (6.4%) - Rural','Zone IV (5.1%) - Northern Troms','Zone V (0%) - Finnmark/N. Troms'],
    agaFerieOpts: ['10.2% (4 weeks)','12% (5 weeks)'],
    agaOtpOpts: ['2% (legal minimum)','5%','7%'],
    avsPriceLabel: 'Purchase price (kr)', avsGroupLabel: 'Depreciation group', avsBtn: 'Calculate', avsDepTableHeader: '10-year depreciation plan',
    avsGroupOpts: ['a: 30% - Office machines etc.','b: 20% - Goodwill','c: 24% - Trucks, buses etc.','d: 20% - Cars, machines, furniture','e: 14% - Ships, vessels, rigs','f: 12% - Aircraft, helicopters','g: 5% - Electrotechnical equipment','h: 4% - Buildings (livestock 6%, simple 10%)','i: 2% - Commercial buildings','j: 10% - Fixed technical installations'],
    avsColYear: 'Year', avsColStart: 'Start value', avsColDepr: 'Depreciation', avsColEnd: 'End value',
    ferieAnnualLabel: 'Annual salary', ferieTypeLabel: 'Holiday type', ferieOver60Label: 'Over 60 years (+2.3% bonus)', ferieBtn: 'Calculate', ferieAmtLabel: 'Holiday pay', ferieDailyLabel: 'Daily rate', ferieOver60Result: 'With 60+ bonus', ferie4w: '4 weeks (10.2%)', ferie5w: '5 weeks (12%)',
    ferieTypeOpts: ['4 weeks (10.2%)','5 weeks (12%)'],
    renteAmountLabel: 'Loan amount (kr)', renteNomLabel: 'Nominal interest (%)', renteEstLabel: 'Setup fee (kr)', renteMonthlyLabel: 'Monthly fee (kr)', renteYearsLabel: 'Loan term (years)', renteBtn: 'Calculate', renteEffLabel: 'Effective annual rate', renteTotalLabel: 'Total cost', renteFeesLabel: 'Total fees',
    prosentModeLabel: 'Calculation Type', prosentOpt1: 'What is X% of Y?', prosentOpt2: 'X is what % of Y?', prosentOpt3: 'Percentage change from X to Y', prosentBtn: 'Calculate', prosentResultLabel: 'Result', prosentPct: 'Percent (%)', prosentAmount: 'Amount', prosentTotal: 'Total', prosentStartValue: 'Start Value', prosentEndValue: 'End Value',
    valgevinCurrencyLabel: 'Currency', valgevinUnitsLabel: 'Units purchased', valgevinCostLabel: 'Cost price (NOK)', valgevinSaleLabel: 'Sale value (NOK)', valgevinTaxLabel: 'Tax (22%)', valgevinNetLabel: 'Net after tax', valgevinBtn: 'Calculate', valgevinResultLabel: 'Gain/Loss (kr)', valgevinGain: 'Gain', valgevinLoss: 'Loss',
    likvidStartLabel: 'Starting balance (kr)', likvidIncomeLabel: 'Monthly income (kr)', likvidExpenseLabel: 'Monthly expense (kr)', likvidBtn: 'Calculate',
    likvidColMonth: 'Month', likvidColStart: 'Start', likvidColIncome: 'Income', likvidColExpense: 'Expense', likvidColEnd: 'End', likvidMnd: 'Mo',
    pensjonAgeLabel: 'Current age', pensjonRetireLabel: 'Retirement age', pensjonSalaryLabel: 'Annual salary', pensjonOtpLabel: 'OTP rate', pensjonReturnLabel: 'Return (%)', pensjonBtn: 'Calculate',
    pensjonPotLabel: 'Total pension pot at 67', pensjonAnnualLabel: 'Estimated annual pension', pensjonMonthlyLabel: 'Monthly pension', pensjonRealLabel: 'Today\'s purchasing power (2% inflation)', pensjonDisclaimer: 'This is an estimate only. Actual pension may vary based on actual returns, contributions and regulatory changes.',
    pensjonOtpOpts: ['2% (legal minimum)','5%','7%'],
    lvuZoneOpts: ['Zone I (14.1%)','Zone Ia/II (10.6%)','Zone III (6.4%)','Zone V (0%)'],
    fcLblType: 'Calculator type', fcTvm: 'Present/Future Value (TVM)', fcMargin: 'Margin & Markup', fcBe: 'Break-even', fcCompound: 'Compound interest', fcDiscount: 'Discount calculation',
    fcPv: 'Present value (PV)', fcRate: 'Annual interest (%)', fcYears: 'Number of years', fcPmt: 'Annual payment', fcCost: 'Cost price', fcSell: 'Selling price', fcFixed: 'Fixed costs', fcPriceU: 'Selling price per unit', fcVarCost: 'Variable cost per unit', fcPrinc: 'Starting amount', fcFreq: 'Interest payments per year', fcOrig: 'Original price', fcDiscPct: 'Discount (%)', fcBtn: 'Calculate', fcResLbl: 'Result',
    fcRFv: 'Future value (FV)', fcRAfter: 'After', fcRYr: 'years', fcRStart: 'Starting amount', fcRTotalPmt: 'Total payments', fcRInterest: 'Interest earned', fcRReturn: 'Total return', fcRProfit: 'Profit', fcRRevenue: 'Required revenue', fcRContrib: 'Contribution per unit', fcRContribMarg: 'Contribution margin', fcRBePoint: 'Break-even point', fcRUnits: 'units', fcREndVal: 'Final value', fcRMonthly: 'with monthly interest', fcRDoubling: 'Doubling after', fcRDiscPrice: 'Price after discount', fcRSaved: 'You save', fcRDiscount: 'Discount', fcRYouPay: 'You pay', fcROfPrice: 'of the price',
    drTax1: 'Ordinary tax', drTax2: 'National insurance', drTax3: 'Bracket tax 1 (226k+)', drTax4: 'Bracket tax 2 (318k+)', drTax5: 'Bracket tax 3 (725k+)',
    drVat1: 'Standard', drVat2: 'Foodstuffs', drVat3: 'Transport/hotel/cinema', drVat4: 'Exempt (exports etc.)',
    drDed1: 'Personal allowance', drDed2: 'Minimum deduction (max)', drDed3: 'Union dues (max)', drDed4: 'Interest deduction',
    dashRefTax: 'Tax rates 2026', dashRefVat: 'VAT rates', dashRefDed: 'Deductions 2026',
    uttakNoGain: 'No gain', uttakEnkTotal: 'Total withdrawal tax (ENK)', uttakEffRate: 'Effective tax rate', uttakNetAfterTax: 'Net after tax', uttakAsTotal: 'Total tax cost (AS - both levels)', uttakAsLevels: 'Company + shareholder',
    ucLblCat: 'Category', ucFrom: 'From', ucTo: 'To', ucValue: 'Value', ucResult: 'Result', ccSwap: 'Swap', ccLive: '(live)', ccApprox: '(approx.)', ccAmount: 'Amount',
    footerCopy: '2024 Hverdagsverktoy - for guidance only, not professional advice.',
  },
  pl: {
    flag: '\u{1F1F5}\u{1F1F1}', name: 'Polski', lang: 'pl', currency: 'kr', currencyCode: 'NOK',
    salDefaults: { gross: 800000 },
    salClasses: [['1','Klasa 1 (Standardowa)'],['2','Klasa 2 (Malz. z niskim dochodem)'],['self','Samozatrudniony']],
    salRegions: [['0.22','Standard (caly kraj)'],['0.185','Finnmark / Polnocny Troms']],
    salInfoRows: [['Ulga osobista','114 540 kr'],['Odliczenie minimalne (maks)','95 700 kr'],['Podatek progresywny 1 (226k+)','1.7%'],['Podatek progresywny 2 (318k+)','4.0%'],['Podatek progresywny 3 (725k+)','13.7%'],['Podatek progresywny 4 (980k+)','16.8%'],['Podatek progresywny 5 (1 467k+)','17.8%'],['Skladka na ubezp. spoleczne','7.6%'],['Podatek zwykly','22%']],
    dashHome: 'Strona glowna', dashToolsTitle: 'Narzedzia',
    dashDescBasic: 'Podstawowy, finansowy, naukowy i konwersja jednostek',
    dashDescSal: 'Oblicz dochod netto z rocznego wynagrodzenia brutto',
    dashDescMor: 'Miesieczna rata, anuitet i kredyt seryjny',
    dashDescVat: 'Oblicz kwoty z i bez VAT',
    dashDescNpv: 'NPV, IRR i okres zwrotu inwestycji',
    themeLabel: 'Motyw', themeBlue: 'Niebieski', themeCorporate: 'Ostry', themeDark: 'Ciemny', themeGlass: 'Szklany', themePink: 'Rozowy', themePurple: 'Fioletowy', themeGreen: 'Zielony', themePeach: 'Brzoskwiniowy', themeFrost: 'Standard',
    tabBasic: 'Kalkulator', tabSal: 'Podatek', tabMor: 'Kredyt', tabNpv: 'Rentownosc', tabVat: 'VAT',
    salTitle: 'Wynagrodzenie po podatku', salDesc: 'Oblicz dochod netto z rocznego brutto.', lGross: 'Roczne brutto (kr)', lClass: 'Klasa podatkowa', lReg: 'Gmina/region', btnCalc: 'Oblicz',
    salRNet: 'Roczne netto', salRTax: 'Calkowity podatek', salREff: 'Efektywna stawka', salRSoc: 'Ubezp. spoleczne', salRDay: 'Dzienne netto',
    trinnLabel1: 'Prog 1', trinnLabel2: 'Prog 2', trinnLabel3: 'Prog 3', trinnLabel4: 'Prog 4', trinnLabel5: 'Prog 5', almSkattLabel: 'Podatek od dochodu zwyklego',
    morTitle: 'Kalkulator kredytu', morDesc: 'Miesieczna rata i calkowity koszt.', lAmount: 'Kwota kredytu (kr)', lRate: 'Oprocentowanie (%)', lYears: 'Okres (lata)',
    morRMth: 'Miesieczna rata', morRTot: 'Calkowita splata', morRInt: 'Calkowite odsetki', morRY1i: 'Odsetki rok 1', morRY1p: 'Kapital rok 1', morRFirst: 'Pierwszy miesiac', morRLast: 'Ostatni miesiac',
    morLType: 'Typ kredytu', morAnnuity: 'Anuitet', morSerial: 'Kredyt seryjny', calcError: 'Blad',
    morIoTitle: 'Kredyt bezodsetkowy', morIoDesc: 'Porownaj z anuitetem od 1. dnia',
    ioLAmount: 'Kwota (kr)', ioLRate: 'Oprocentowanie (%)', ioLIoFree: 'Okres bez splat (lata)', ioLTotal: 'Calkowity okres (lata)',
    ioRLbl: 'Przeglad', ioSecDuring: 'W okresie bez splat', ioSecAfter: 'Po okresie', ioSecCompare: 'Porownanie',
    ioRlMthFree: 'Rata miesieczna (tylko odsetki)', ioRlTotFree: 'Calkowite odsetki w okresie', ioRlMthAfter: 'Rata miesieczna (anuitet)', ioRlIntAfter: 'Odsetki pozostaly okres',
    ioRlTotIntIo: 'Calkowite odsetki (z bezodsetkowym)', ioRlTotIntAnn: 'Calkowite odsetki (anuitet od 1. dnia)', ioRlDiff: 'Dodatkowy koszt odsetek', ioRlAnnMth: 'Miesieczny anuitet od 1. dnia',
    ioRSub: 'Dodatkowy koszt odsetek vs. anuitet od 1. dnia',
    npvTitle: 'Kalkulator NPV / IRR', npvDesc: 'Wartosc biez. netto i wewn. stopa zwrotu.', lInv: 'Inwestycja (kr)', lRateD: 'Stopa dyskontowa (%)', lCF1: 'Przeplyw rok 1', lCF2: 'Przeplyw rok 2', lCF3: 'Przeplyw rok 3', lCF4: 'Przeplyw rok 4', lCF5: 'Przeplyw rok 5',
    npvRLbl: 'Wartosc biez. netto (NPV)', npvRPay: 'Okres zwrotu', npvRSum: 'Suma przeplywow', npvRPi: 'Indeks rentownosci',
    npvPos: 'Oplacalna inwestycja', npvNeg: 'Nieoplacalna inwestycja', yr: 'lat', mo: '/msc',
    vatTitle: 'Kalkulator VAT', vatDesc: 'Oblicz kwoty z i bez VAT.', lVatAmount: 'Kwota (kr)', lVatRate: 'Stawka VAT', lVatType: 'Typ kwoty',
    vatOptEx: 'Kwota bez VAT - dodaj VAT', vatOptInc: 'Kwota z VAT - odejmij VAT',
    vatRIncl: 'Z VAT', vatRExcl: 'Bez VAT', vatRTax: 'Kwota VAT', vatRPct: 'Stawka %',
    vatRInclCalc: 'Cena z VAT', vatRExclCalc: 'Cena bez VAT', vatRInputTag: '(twoj input)',
    adjTitle: 'Kalkulator korekty', adjDesc: 'Korekta naliczonego VAT przy zmianie uzytkowania',
    adjLType: 'Typ srodka', adjOptProp: 'Nieruchomosc - 10 lat', adjOptMach: 'Maszyny - 5 lat',
    adjLMva: 'Calkowity VAT naliczony', adjLPeriod: 'Okres korekty (lata)', adjLYears: 'Lata uzytkowane',
    adjLOld: 'Poczatkowy udzial odliczenia (%)', adjLNew: 'Nowy udzial odliczenia (%)', adjBtn: 'Oblicz korekte',
    adjRlBase: 'Roczna kwota bazowa', adjRlAnnual: 'Roczna korekta', adjRlRemain: 'Pozostale lata', adjRlChange: 'Zmiana udzialu',
    adjUnder: 'Ponizej progu', adjExpired: 'Okres korekty wygas', adjRepay: 'Zwrot do panstwa', adjIncrease: 'Zwiekszenie odliczenia',
    adjUnderSub: 'VAT musi przekraczac {t}', adjExpiredSub: 'Wszystkie {p} lat wykorzystane',
    adjRepaySub: 'Musisz zwrocic {a}', adjIncreaseSub: 'Mozesz zyczc {a} dodatkowego odliczenia',
    lblFagcalc: 'Kalkulatory profesjonalne', lblLvu: 'Wynagrodzenie vs Dywidenda', lblAga: 'Koszt pracownika', lblAvs: 'Amortyzacja', lblFerie: 'Wynagrodzenie urlopowe', lblRente: 'Efektywna stopa', lblProsent: 'Procent', lblValgevinst: 'Zysk walutowy', lblLikvid: 'Plynnosc', lblPensjon: 'Emerytura',
    lvuGross: 'Kwota brutto', lvuZone: 'Strefa AGA', lvuBtn: 'Oblicz', lvuRSal: 'Wynagrodzenie - koszt', lvuRDiv: 'Dywidenda - koszt', lvuRDiff: 'Roznica (tansze)',
    agaSal: 'Roczne brutto', agaZone: 'Strefa AGA', agaFerie: 'Urlop', agaOtp: 'Stawka OTP', agaBtn: 'Oblicz', agaRTotal: 'Roczny koszt', agaRAga: 'AGA', agaRFerie: 'Urlop', agaROtp: 'OTP', agaRPct: '% brutto', agaPerMonth: '/msc',
    agaZoneOpts: ['Strefa I (14.1%)','Strefa Ia/II (10.6%)','Strefa III (6.4%)','Strefa IV (5.1%)','Strefa V (0%)'],
    agaFerieOpts: ['10.2% (4 tygodnie)','12% (5 tygodni)'],
    agaOtpOpts: ['2% (minimum)','5%','7%'],
    avsPriceLabel: 'Cena zakupu (kr)', avsGroupLabel: 'Grupa amortyzacji', avsBtn: 'Oblicz', avsDepTableHeader: '10-letni plan amortyzacji',
    avsGroupOpts: ['a: 30%','b: 20%','c: 24%','d: 20%','e: 14%','f: 12%','g: 5%','h: 4%','i: 2%','j: 10%'],
    avsColYear: 'Rok', avsColStart: 'Wartosc pocz.', avsColDepr: 'Amortyzacja', avsColEnd: 'Wartosc konc.',
    ferieAnnualLabel: 'Roczne wynagrodzenie', ferieTypeLabel: 'Typ urlopu', ferieOver60Label: 'Powyzej 60 lat (+2.3%)', ferieBtn: 'Oblicz', ferieAmtLabel: 'Wynagrodzenie urlopowe', ferieDailyLabel: 'Stawka dzienna', ferieOver60Result: 'Z bonusem 60+', ferie4w: '4 tygodnie (10.2%)', ferie5w: '5 tygodni (12%)',
    ferieTypeOpts: ['4 tygodnie (10.2%)','5 tygodni (12%)'],
    renteAmountLabel: 'Kwota kredytu (kr)', renteNomLabel: 'Oprocentowanie nominalne (%)', renteEstLabel: 'Oplata poczatkowa (kr)', renteMonthlyLabel: 'Oplata miesieczna (kr)', renteYearsLabel: 'Okres (lata)', renteBtn: 'Oblicz', renteEffLabel: 'Efektywna stopa roczna', renteTotalLabel: 'Calkowity koszt', renteFeesLabel: 'Calkowite oplaty',
    prosentModeLabel: 'Typ obliczenia', prosentOpt1: 'Ile wynosi X% z Y?', prosentOpt2: 'X to jaki % z Y?', prosentOpt3: 'Zmiana procentowa od X do Y', prosentBtn: 'Oblicz', prosentResultLabel: 'Wynik', prosentPct: 'Procent (%)', prosentAmount: 'Kwota', prosentTotal: 'Razem', prosentStartValue: 'Wartosc poczatkowa', prosentEndValue: 'Wartosc koncowa',
    valgevinCurrencyLabel: 'Waluta', valgevinUnitsLabel: 'Jednostki', valgevinCostLabel: 'Koszt (NOK)', valgevinSaleLabel: 'Wartosc sprzedazy (NOK)', valgevinTaxLabel: 'Podatek (22%)', valgevinNetLabel: 'Netto po podatku', valgevinBtn: 'Oblicz', valgevinResultLabel: 'Zysk/Strata (kr)', valgevinGain: 'Zysk', valgevinLoss: 'Strata',
    likvidStartLabel: 'Saldo poczatkowe (kr)', likvidIncomeLabel: 'Miesieczny dochod (kr)', likvidExpenseLabel: 'Miesieczny wydatek (kr)', likvidBtn: 'Oblicz',
    likvidColMonth: 'Miesiac', likvidColStart: 'Poczatek', likvidColIncome: 'Dochod', likvidColExpense: 'Wydatek', likvidColEnd: 'Koniec', likvidMnd: 'Msc',
    pensjonAgeLabel: 'Obecny wiek', pensjonRetireLabel: 'Wiek emerytalny', pensjonSalaryLabel: 'Roczne wynagrodzenie', pensjonOtpLabel: 'Stawka OTP', pensjonReturnLabel: 'Zwrot (%)', pensjonBtn: 'Oblicz',
    pensjonPotLabel: 'Kapital emerytalny w wieku 67', pensjonAnnualLabel: 'Szacunkowa roczna emerytura', pensjonMonthlyLabel: 'Miesieczna emerytura', pensjonRealLabel: 'Siala nabywcza dzis (2% inflacja)', pensjonDisclaimer: 'To tylko szacunek.',
    pensjonOtpOpts: ['2% (minimum)','5%','7%'],
    lvuZoneOpts: ['Strefa I (14.1%)','Strefa Ia/II (10.6%)','Strefa III (6.4%)','Strefa V (0%)'],
    fcLblType: 'Typ kalkulatora', fcTvm: 'Wartosc biez./przyszla (TVM)', fcMargin: 'Marza i narzut', fcBe: 'Prog rentownosci', fcCompound: 'Procent skladany', fcDiscount: 'Obliczanie rabatu',
    fcPv: 'Wartosc biez. (PV)', fcRate: 'Roczna stopa (%)', fcYears: 'Liczba lat', fcPmt: 'Roczna wplata', fcCost: 'Cena kosztu', fcSell: 'Cena sprzedazy', fcFixed: 'Koszty stale', fcPriceU: 'Cena jednostkowa', fcVarCost: 'Koszt zmienny/jedn.', fcPrinc: 'Kwota poczatkowa', fcFreq: 'Platnosci odsetkowe/rok', fcOrig: 'Cena oryginalna', fcDiscPct: 'Rabat (%)', fcBtn: 'Oblicz', fcResLbl: 'Wynik',
    fcRFv: 'Wartosc przyszla (FV)', fcRAfter: 'Po', fcRYr: 'lat', fcRStart: 'Kwota poczatkowa', fcRTotalPmt: 'Calkowite wplaty', fcRInterest: 'Zarobione odsetki', fcRReturn: 'Calkowity zwrot', fcRProfit: 'Zysk', fcRRevenue: 'Wymagany przychod', fcRContrib: 'Marza jednostkowa', fcRContribMarg: 'Stopa marzy', fcRBePoint: 'Prog rentownosci', fcRUnits: 'jednostek', fcREndVal: 'Wartosc koncowa', fcRMonthly: 'z miesiecznymi odsetkami', fcRDoubling: 'Podwojenie po', fcRDiscPrice: 'Cena po rabacie', fcRSaved: 'Oszczedzasz', fcRDiscount: 'Rabat', fcRYouPay: 'Placisz', fcROfPrice: 'ceny',
    drTax1: 'Podatek zwykly', drTax2: 'Ubezp. spoleczne', drTax3: 'Prog 1 (226k+)', drTax4: 'Prog 2 (318k+)', drTax5: 'Prog 3 (725k+)',
    drVat1: 'Standardowy', drVat2: 'Zywnosc', drVat3: 'Transport/hotel/kino', drVat4: 'Zwolniony',
    drDed1: 'Ulga osobista', drDed2: 'Odliczenie minimalne', drDed3: 'Skladka zwiazkowa', drDed4: 'Odliczenie odsetek',
    dashRefTax: 'Stawki podatkowe 2026', dashRefVat: 'Stawki VAT', dashRefDed: 'Odliczenia 2026',
    uttakNoGain: 'Brak zysku', uttakEnkTotal: 'Calkowity podatek (ENK)', uttakEffRate: 'Efektywna stawka', uttakNetAfterTax: 'Netto po podatku', uttakAsTotal: 'Calkowity podatek (AS)', uttakAsLevels: 'Spolka + akcjonariusz',
    ucLblCat: 'Kategoria', ucFrom: 'Z', ucTo: 'Do', ucValue: 'Wartosc', ucResult: 'Wynik', ccSwap: 'Zamien', ccLive: '(live)', ccApprox: '(ok.)', ccAmount: 'Kwota',
    footerCopy: '2024 Hverdagsverktoy - tylko do celow informacyjnych.',
  },
  uk: {
    flag: '\u{1F1FA}\u{1F1E6}', name: 'Ukrainska', lang: 'uk', currency: 'kr', currencyCode: 'NOK',
    salDefaults: { gross: 800000 }, salClasses: [['1','Klas 1'],['2','Klas 2'],['self','Samostijnyj']], salRegions: [['0.22','Standard'],['0.185','Finnmark']], salInfoRows: [],
    dashHome: 'Domu', dashToolsTitle: 'Instrumenty', dashDescBasic: 'Kalkuljator', dashDescSal: 'Podatok', dashDescMor: 'Ipoteka', dashDescVat: 'PDV', dashDescNpv: 'NPV/IRR',
    themeLabel: 'Tema', themeBlue: 'Blakytnyj', themeCorporate: 'Hostryj', themeDark: 'Temnyj', themeGlass: 'Sklo', themePink: 'Rozhevyj', themePurple: 'Fioletovyj', themeGreen: 'Zelenyj', themePeach: 'Persykovyj', themeFrost: 'Standard',
    tabBasic: 'Kalkuljator', tabSal: 'Podatok', tabMor: 'Ipoteka', tabNpv: 'Rentabelnist', tabVat: 'PDV',
    salTitle: 'Zarplata pislja podatkiv', salDesc: 'Rozrahunok netto.', lGross: 'Richna brutto (kr)', lClass: 'Podatkova klasa', lReg: 'Region', btnCalc: 'Rozrahuvaty',
    salRNet: 'Richne netto', salRTax: 'Zagalnyj podatok', salREff: 'Efektyvna stavka', salRSoc: 'Socstrah', salRDay: 'Shhodenno netto',
    trinnLabel1: 'Stupin 1', trinnLabel2: 'Stupin 2', trinnLabel3: 'Stupin 3', trinnLabel4: 'Stupin 4', trinnLabel5: 'Stupin 5', almSkattLabel: 'Zvychajnyj podatok',
    morTitle: 'Kalkuljator ipoteky', morDesc: 'Shchomisyachnyj platizh.', lAmount: 'Suma (kr)', lRate: 'Stavka (%)', lYears: 'Termin (roky)',
    morRMth: 'Shchomisyachno', morRTot: 'Vsogo', morRInt: 'Vsogo vidsotkiv', morRY1i: 'Vidsotky rik 1', morRY1p: 'Kapital rik 1', morRFirst: 'Pershyj misyac', morRLast: 'Ostannij misyac',
    morLType: 'Typ kredytu', morAnnuity: 'Anuitet', morSerial: 'Serijnyj', calcError: 'Pomylka',
    morIoTitle: 'Bezvidsotkove', morIoDesc: 'Porivnjannya', ioLAmount: 'Suma (kr)', ioLRate: 'Stavka (%)', ioLIoFree: 'Bez vidsotki (roky)', ioLTotal: 'Zagal. termin (roky)',
    ioRLbl: 'Oglyad', ioSecDuring: 'Pid chas', ioSecAfter: 'Pislja', ioSecCompare: 'Porivnjannja',
    ioRlMthFree: 'Shchomisyachno (tilky %)', ioRlTotFree: 'Vsogo % za period', ioRlMthAfter: 'Shchomisyachno (anuitet)', ioRlIntAfter: '% za zalysok',
    ioRlTotIntIo: 'Vsogo % (z bezvidsotkoyym)', ioRlTotIntAnn: 'Vsogo % (anuitet vid 1 dnya)', ioRlDiff: 'Dodatkovi vytraty', ioRlAnnMth: 'Anuitet vid 1 dnya',
    ioRSub: 'Dodatkovi vytraty',
    npvTitle: 'NPV / IRR', npvDesc: 'Chysta teperishnya vartist.', lInv: 'Investycija (kr)', lRateD: 'Dyskontna stavka (%)', lCF1: 'Potik rik 1', lCF2: 'Potik rik 2', lCF3: 'Potik rik 3', lCF4: 'Potik rik 4', lCF5: 'Potik rik 5',
    npvRLbl: 'NPV', npvRPay: 'Termin okupnosti', npvRSum: 'Suma potokiv', npvRPi: 'Indeks rentabelnosti',
    npvPos: 'Prybutokova investycija', npvNeg: 'Zbytokova investycija', yr: 'rokiv', mo: '/mis',
    vatTitle: 'Kalkuljator PDV', vatDesc: 'Z i bez PDV.', lVatAmount: 'Suma (kr)', lVatRate: 'Stavka PDV', lVatType: 'Typ sumy',
    vatOptEx: 'Bez PDV - dodaty', vatOptInc: 'Z PDV - vidjaty',
    vatRIncl: 'Z PDV', vatRExcl: 'Bez PDV', vatRTax: 'Suma PDV', vatRPct: 'Stavka %',
    vatRInclCalc: 'Cina z PDV', vatRExclCalc: 'Cina bez PDV', vatRInputTag: '(vashe vvedennja)',
    adjTitle: 'Koreguvannja', adjDesc: 'Koreguvannja vhidnogo PDV',
    adjLType: 'Typ aktyvu', adjOptProp: 'Neruhomist - 10 rokiv', adjOptMach: 'Mashyny - 5 rokiv',
    adjLMva: 'Zagalnyj vhidnyj PDV', adjLPeriod: 'Period (roky)', adjLYears: 'Roky vykorystannja',
    adjLOld: 'Pochatk. chastka (%)', adjLNew: 'Nova chastka (%)', adjBtn: 'Rozrahuvaty',
    adjRlBase: 'Richna baza', adjRlAnnual: 'Richne koreguvannja', adjRlRemain: 'Zalyshok rokiv', adjRlChange: 'Zmina chastky',
    adjUnder: 'Nyzhche poroga', adjExpired: 'Period zakinchyvsya', adjRepay: 'Povernennya', adjIncrease: 'Zbilshennya',
    adjUnderSub: 'PDV maye perevyshchuvaty {t}', adjExpiredSub: 'Vsi {p} rokiv vykorystano',
    adjRepaySub: 'Vy mayete povernuti {a}', adjIncreaseSub: 'Vy mozhete vymagaty {a}',
    lblFagcalc: 'Profesijni', lblLvu: 'Zarplata vs Dyvidendy', lblAga: 'Vytraty na pracivnykiv', lblAvs: 'Amortyzacija', lblFerie: 'Vidpuskni', lblRente: 'Efektyvna stavka', lblProsent: 'Vidsotok', lblValgevinst: 'Valyutnyj prybutok', lblLikvid: 'Likvidnist', lblPensjon: 'Pensija',
    lvuGross: 'Brutto', lvuZone: 'Zona AGA', lvuBtn: 'Rozrahuvaty', lvuRSal: 'Zarplata - vartist', lvuRDiv: 'Dyvidendy - vartist', lvuRDiff: 'Riznycia',
    agaSal: 'Richne brutto', agaZone: 'Zona AGA', agaFerie: 'Vidpuskni', agaOtp: 'OTP', agaBtn: 'Rozrahuvaty', agaRTotal: 'Richna vartist', agaRAga: 'AGA', agaRFerie: 'Vidpuskni', agaROtp: 'OTP', agaRPct: '% vid brutto', agaPerMonth: '/mis',
    agaZoneOpts: ['Zona I (14.1%)','Zona Ia/II (10.6%)','Zona III (6.4%)','Zona IV (5.1%)','Zona V (0%)'],
    agaFerieOpts: ['10.2%','12%'], agaOtpOpts: ['2%','5%','7%'],
    avsPriceLabel: 'Cina (kr)', avsGroupLabel: 'Hrupa', avsBtn: 'Rozrahuvaty', avsDepTableHeader: '10-richnyj plan',
    avsGroupOpts: ['a: 30%','b: 20%','c: 24%','d: 20%','e: 14%','f: 12%','g: 5%','h: 4%','i: 2%','j: 10%'],
    avsColYear: 'Rik', avsColStart: 'Pochatok', avsColDepr: 'Amortyzacija', avsColEnd: 'Kinec',
    ferieAnnualLabel: 'Richna zarplata', ferieTypeLabel: 'Typ vidpustky', ferieOver60Label: '60+ (+2.3%)', ferieBtn: 'Rozrahuvaty', ferieAmtLabel: 'Vidpuskni', ferieDailyLabel: 'Dennа stavka', ferieOver60Result: 'Z bonusom 60+', ferie4w: '4 tyzhni (10.2%)', ferie5w: '5 tyzhniv (12%)',
    ferieTypeOpts: ['4 tyzhni (10.2%)','5 tyzhniv (12%)'],
    renteAmountLabel: 'Suma (kr)', renteNomLabel: 'Nominalna (%)', renteEstLabel: 'Zbir (kr)', renteMonthlyLabel: 'Shchomisyachno (kr)', renteYearsLabel: 'Termin (roky)', renteBtn: 'Rozrahuvaty', renteEffLabel: 'Efektyvna richna', renteTotalLabel: 'Zagalna vartist', renteFeesLabel: 'Zagalni zbory',
    prosentModeLabel: 'Typ', prosentOpt1: 'X% vid Y', prosentOpt2: 'X - ce skilky % vid Y', prosentOpt3: 'Zmina % vid X do Y', prosentBtn: 'Rozrahuvaty', prosentResultLabel: 'Rezultat', prosentPct: 'Vidsotok (%)', prosentAmount: 'Suma', prosentTotal: 'Vsogo', prosentStartValue: 'Pochatok', prosentEndValue: 'Kinec',
    valgevinCurrencyLabel: 'Valyuta', valgevinUnitsLabel: 'Kilkist', valgevinCostLabel: 'Sobivartist (NOK)', valgevinSaleLabel: 'Prodazh (NOK)', valgevinTaxLabel: 'Podatok (22%)', valgevinNetLabel: 'Netto', valgevinBtn: 'Rozrahuvaty', valgevinResultLabel: 'Prybutok/Zbytok', valgevinGain: 'Prybutok', valgevinLoss: 'Zbytok',
    likvidStartLabel: 'Pochatkove saldo (kr)', likvidIncomeLabel: 'Dohid/mis (kr)', likvidExpenseLabel: 'Vytraty/mis (kr)', likvidBtn: 'Rozrahuvaty',
    likvidColMonth: 'Misyac', likvidColStart: 'Pochatok', likvidColIncome: 'Dohid', likvidColExpense: 'Vytraty', likvidColEnd: 'Kinec', likvidMnd: 'Mis',
    pensjonAgeLabel: 'Vik', pensjonRetireLabel: 'Pensijnyj vik', pensjonSalaryLabel: 'Richna zarplata', pensjonOtpLabel: 'OTP', pensjonReturnLabel: 'Prybutkovist (%)', pensjonBtn: 'Rozrahuvaty',
    pensjonPotLabel: 'Pensijnyj fond u 67', pensjonAnnualLabel: 'Richna pensija', pensjonMonthlyLabel: 'Misyachna pensija', pensjonRealLabel: 'Kupivna spromozhnist (2%)', pensjonDisclaimer: 'Tse tilky otsinka.',
    pensjonOtpOpts: ['2%','5%','7%'], lvuZoneOpts: ['I (14.1%)','Ia/II (10.6%)','III (6.4%)','V (0%)'],
    fcLblType: 'Typ', fcTvm: 'TVM', fcMargin: 'Marzha', fcBe: 'Tochka bezbytkovosti', fcCompound: 'Skladni vidsotky', fcDiscount: 'Znyzhka',
    fcPv: 'PV', fcRate: 'Stavka (%)', fcYears: 'Roky', fcPmt: 'Richnyj platizh', fcCost: 'Sobivartist', fcSell: 'Cina prodazhu', fcFixed: 'Postijni vytraty', fcPriceU: 'Cina/odn.', fcVarCost: 'Zminni/odn.', fcPrinc: 'Pochatkova suma', fcFreq: 'Platezhi/rik', fcOrig: 'Pochatkova cina', fcDiscPct: 'Znyzhka (%)', fcBtn: 'Rozrahuvaty', fcResLbl: 'Rezultat',
    fcRFv: 'FV', fcRAfter: 'Pislja', fcRYr: 'rokiv', fcRStart: 'Pochatok', fcRTotalPmt: 'Platezhi', fcRInterest: 'Vidsotky', fcRReturn: 'Povernennj', fcRProfit: 'Prybutok', fcRRevenue: 'Potrebnyj dohid', fcRContrib: 'Marzhа/odn.', fcRContribMarg: 'Marzhynalnist', fcRBePoint: 'Bezbytkovist', fcRUnits: 'odynycj', fcREndVal: 'Kinceva vartist', fcRMonthly: 'shchomisyachno', fcRDoubling: 'Podvoyennya pislja', fcRDiscPrice: 'Cina zi znyzhkoju', fcRSaved: 'Ekonomija', fcRDiscount: 'Znyzhka', fcRYouPay: 'Vy platyete', fcROfPrice: 'vid ciny',
    drTax1: 'Zvychajnyj', drTax2: 'Socstrah', drTax3: 'Stupin 1', drTax4: 'Stupin 2', drTax5: 'Stupin 3',
    drVat1: 'Standard', drVat2: 'Produkty', drVat3: 'Transport', drVat4: 'Zvilneno',
    drDed1: 'Osobyste', drDed2: 'Minimalne', drDed3: 'Profspilka', drDed4: 'Vidsotky',
    dashRefTax: 'Podatkovi stavky 2026', dashRefVat: 'Stavky PDV', dashRefDed: 'Vidrahuvannya 2026',
    uttakNoGain: 'Nemaye prybutku', uttakEnkTotal: 'Podatok ENK', uttakEffRate: 'Efektyvna stavka', uttakNetAfterTax: 'Netto', uttakAsTotal: 'Podatok AS', uttakAsLevels: 'Kompanija + aktsioner',
    ucLblCat: 'Kategorija', ucFrom: 'Vid', ucTo: 'Do', ucValue: 'Suma', ucResult: 'Rezultat', ccSwap: 'Pominyaty', ccLive: '(live)', ccApprox: '(pryblyzhno)', ccAmount: 'Suma',
    footerCopy: '2024 Hverdagsverktoy - tilky dovidka.',
  },
  // Remaining 6 languages use simplified copies (ar, lt, so, ti, zh, fr)
  // For brevity they fallback to English with name/flag overrides
  ar: { ...({} as any), flag: '\u{1F1F8}\u{1F1E6}', name: 'Al-Arabiyya', lang: 'ar' },
  lt: { ...({} as any), flag: '\u{1F1F1}\u{1F1F9}', name: 'Lietuviu', lang: 'lt' },
  so: { ...({} as any), flag: '\u{1F1F8}\u{1F1F4}', name: 'Soomaali', lang: 'so' },
  ti: { ...({} as any), flag: '\u{1F1EA}\u{1F1F7}', name: 'Tigrinya', lang: 'ti' },
  zh: { ...({} as any), flag: '\u{1F1E8}\u{1F1F3}', name: 'Zhongwen', lang: 'zh' },
  fr: { ...({} as any), flag: '\u{1F1EB}\u{1F1F7}', name: 'Francais', lang: 'fr' },
};

// Fill missing language properties by falling back to English
const enRegion = REGIONS.en;
for (const key of Object.keys(REGIONS)) {
  if (key === 'en' || key === 'no' || key === 'pl' || key === 'uk') continue;
  const region = REGIONS[key];
  for (const prop of Object.keys(enRegion)) {
    if (!(prop in region) || region[prop] === undefined) {
      (region as any)[prop] = (enRegion as any)[prop];
    }
  }
}

export const regionKeys = Object.keys(REGIONS);
export const defaultRegion = 'no';
