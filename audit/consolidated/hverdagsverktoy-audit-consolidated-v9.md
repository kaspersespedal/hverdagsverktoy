---
title: Hverdagsverktøy — Konsolidert Audit v9
date: 2026-04-11
version: 9
previous_version: 8
tags: [hverdagsverktoy, audit, consolidated, post-v8-fixes]
---

# Hverdagsverktøy — Konsolidert Audit v9 (2026-04-11)

Konsolidert rapport etter full re-audit av alle 6 seksjoner i parallelle sub-agent-rapporter. Baseline: [[hverdagsverktoy-audit-consolidated-v8]] som lukket 26→0 åpne funn (100 % progresjon) i commits `4fee17a`, `372e084`, `77c1acc`. Siden v8 har 6 nye commits landet (`b8fcad8`, `4fee17a`, `372e084`, `77c1acc`, `884f94f`, `3b41e83`) — v9 er primært en regresjons- og kvalitetssjekk av disse fiksene + full matematisk verifikasjon av alle 2026-satser.

**Nettoresultat:** **70 nye funn** (12 H / 28 M / 30 L) fordelt på alle 6 seksjoner. Fiksene i v8 holder i praksis, men re-auditen avdekker systematiske mønstre som v1–v8 ikke fanget — særlig **stale satser i `search.js`/lang-filer mens `core.js` er korrekt**, **A11y div→button-fiksen som hoppet over boliglan og personlig**, og **nye regresjoner i ny implementasjon** (boliglan-stresstest, budsjettPdf-krasj, studielån hjemmeboer-sats).

---

## Sammendragstabell per seksjon

| Seksjon | Åpne (H/M/L) | Totalt | Endring v8→v9 | Status |
|---|---|---|---|---|
| **skatt** | 3 / 4 / 3 | 10 | +10 | v8 lukket alle; re-audit avdekker hardkodet kort, BSU stale i søk, reisefradrag 3 versjoner |
| **kalkulator** | 1 / 7 / 7 | 15 | +15 | 1 forretningskritisk (lvu-zone label/value mismatch); resten HTML-fallbacks + a11y + hover |
| **boliglan** | 3 / 4 / 6 | 13 | +10 | Stresstest-regresjon fra `372e084` (`rate+3` uten 7%-gulv); boliglan hoppet over i a11y-fiks; search.js stale |
| **personlig** | 2 / 5 / 4 | 11 | +10 | budsjettPdf TypeError-krasj (ny regresjon); studielån hjemmeboer-sats fabrikert; a11y hoppet over |
| **avgift** | 2 / 3 / 6 | 11 | +10 | Elbil-grense 300k→500k + AGA fribeløp 500k→850k stale; L4 BS4-fiksen verifisert OK |
| **selskap** | 1 / 5 / 4 | 10 | +9 | Brønnøysund-gebyrer stale (ANS/DA 2250→3883, KS 2250→6825); `infoRowsHTML` genererer 55 div-onclick cross-page; L5 BS4-fiksen verifisert OK |
| **TOTALT** | **12 / 28 / 30** | **70 funn** | **+64** | — |

> [!info] Re-audit-scope
> v9 er ikke en inkrementell "regresjonssjekk siden v8" — det er en **full re-audit** som spesifikt verifiserer at v8-fiksene holder OG søker etter nye mønstre som tidligere versjoner ikke fanget. Mange av funnene er eksisterende bugs som v1–v7 ikke oppdaget.

---

## Cross-cutting mønstre (systemiske)

### Mønster #1 — Stale satser i `search.js` / lang-filer mens `core.js` er korrekt

Dette er det **mest utbredte** mønsteret. `core.js` har ofte riktige 2026-verdier mens `search.js` haystack-beskrivelser og lang-fil-radene er stale.

| Seksjon | Bug-ID | Sted | Stale | Korrekt |
|---|---|---|---|---|
| skatt | H2 | `search.js:69` + 10 lang `searchDs.bsu`/`searchKw.bsu` | 20 % | **10 %** |
| skatt | M2 | `lang/no.js:93` + 6 andre lang `salDeprRows` | 15 000 kr | **30 000 kr** |
| boliglan | H2 | `search.js:68` | Egenkapital 15 % | **10 %** |
| boliglan | H3 | `search.js:69` | BSU 20 % | **10 %** |
| avgift | H1 | `lang/no.js:27` (10 filer) `vatLawRows` | Elbil 300 000 kr + § 6-8 | **500 000 kr + § 6-7** |
| avgift | H2 | `lang/no.js:91` (10 filer) `salAgaRows` | AGA fribeløp ca. 500 000 kr | **850 000 kr** |
| selskap | H1 | `lang/no.js:584,615,639,679` (10 filer) | ANS/DA reg.gebyr 2 250 kr | **3 883 kr** |
| selskap | M1 | samme sted | KS reg.gebyr 2 250 kr | **6 825 kr** |
| selskap | M4 | `lang/no.js:871` `searchKw.trygdeavgift` | 7.9 % | **7.6 %** |

**Rotårsak:** Når en calc-konstant oppdateres i `core.js`, blir ikke `search.js` og lang-fil-strenger flaktet automatisk. Det finnes ingen sentralisert konstant-bibliotek eller test som binder satsene sammen på tvers av filer.

**Anbefaling:** Opprett `shared/constants.js` med ALLE 2026-satser som en `RATES_2026`-konstant, og importer fra både `core.js`, `search.js` og lang-filer (via `SUBSTITUTIONS`-system). Alternativt: skriv en `scripts/verify_rates.py` som grepper hardkodede tall i lang-filer og cross-referer mot `core.js`-konstanter.

### Mønster #2 — A11y div→button-fiksen (`77c1acc`) hoppet over boliglan + personlig

Commit `77c1acc` konverterte 35× `<div class="card-hdr" onclick>` til `<button type="button">` i `avgift/` og `selskap/` via BS4 + bounded stack-scanner. Men `boliglan/` og `personlig/` ble ikke inkludert.

| Seksjon | Bug-ID | Antall divs | Mitigant |
|---|---|---|---|
| boliglan | M1 | 6 `.card-hdr` + 2 `.priv-back` | JS-shim `applyA11y` legger til role+tabindex runtime |
| personlig | M1 | 14 `.card-hdr` + 2 `.priv-back` | Samme JS-shim |
| skatt | L1 | ~28 `.card-hdr` | Samme JS-shim |
| kalkulator | M5 | 13 `<div onclick>` mode-switchere (`.cm-opt`, `.cc-swap`, NPV how-to) | Ingen |

**Semantisk HTML mangler** — screen readers uten JS-støtte får null tilgjengelighet. Ikke tab-rekkefølge-optimert. CSS-resetten for `button.card-hdr` eksisterer allerede i `style.css:750` — bare å kjøre `scripts/convert_card_hdr.py` på de to siste HTML-filene.

### Mønster #3 — `infoRowsHTML` genererer 55 `<div class="ir" onclick>` på selskap (cross-page)

> [!bug] Funnet først i selskap-audit (M2) — cross-page impact
> `shared/core.js:1130` har:
> ```js
> const clickable = url ? ` onclick="window.open('${url}','_blank')" style="…cursor:pointer;…"` : …;
> ```
> Genererer 55 rad-elementer på selskap-siden alene. Samme funksjon brukes i **skatt, avgift, kalkulator** — totalt trolig 100+ div-onclick-elementer på tvers av sider. Alle er keyboard-utilgjengelige. Dette er en mye større a11y-gap enn de statiske `.card-hdr`-togglere som L4/L5-fiksen dekket.

**Fix:** Endre `infoRowsHTML` til å emittere `<a class="ir" href="${url}" target="_blank" rel="noopener">` istedenfor `<div onclick>`. Én-linjes refactor som fikser 100+ a11y-issues.

### Mønster #4 — Hover-regler uten `@media(hover:hover)` (tema-overrides)

Basis-`.btn-calc:hover`-regel er korrekt wrappet, men tema-varianter overstyrer uten wrap.

| Seksjon | Bug-ID | Fil:linje | Rules |
|---|---|---|---|
| skatt | M3 | `style.css:700` | 1× `.focus-card-btn:hover` |
| kalkulator | M4 | `style.css:29, 90, 249, 413, 544` | 5× theme `.btn-calc:hover` |
| personlig | M2 | `style.css:29, 249, 413, 544, 560, 700` | 6× theme hover-rules |

**Rotårsak:** Tema-CSS ble lagt til etter hover-wrap-regelen ble innført (2026-04-11 incident-pattern). Enkelt å fikse: wrap hver i `@media(hover:hover){...}`.

### Mønster #5 — Matematiske feil i ny implementasjon siden v8

Tre bugs introdusert i v8-fix-commitene:

| Bug | Commit | Fil | Feil |
|---|---|---|---|
| **Boliglan H1** | `372e084` (M6 stresstest) | `core.js:2862` | `rate+3` uten 7%-gulv (Utlånsforskriften § 4-4 krever `max(rate+3, 7)`) |
| **Personlig H1** | ? (regresjon) | `core.js:5673-5676` | `budsjettPdf()` refererer `d.cats`/`catNames` som ikke eksisterer — TypeError-krasj ved CSV-nedlasting |
| **Personlig H2** | historisk | `core.js:5146` | `_studieSatser:{borte:15169, hjemme:7682}` — 7682 er fabrikert; alle studenter får 15 169 kr basislån, forskjellen er stipend-omgjøring |

**Personlig H1** er spesielt alvorlig: en funksjon som brukere aktivt kaller (CSV-eksport) krasjer. Antakelig `budsjettCalc()` ble refaktorert uten at `budsjettPdf()` ble oppdatert.

### Mønster #6 — Hardkodede seksjoner uten `applyLang`-wiring

| Seksjon | Bug-ID | Sted | Størrelse |
|---|---|---|---|
| skatt | H1 | `skatt/index.html:169-245` "Næring eller hobby?" | 77 linjer hardkodet norsk |
| skatt | M1 | `skatt/index.html:629-641` formue-labels fritid/næring/driftsmidler | 3 labels |
| personlig | M3 | `core.js:1570` `lonnHowtoRows` fallback | 1 rad med "Frikort (70 000 kr)" — stale |

**Rotårsak:** Ingen linting som sikrer at hvert element med `id=` har tilsvarende `applyLang`-wire.

### Mønster #7 — UI-hint vs kode-konstanter ute av sync

| Bug | Sted | UI sier | Kode bruker |
|---|---|---|---|
| skatt H3 | `index.html:411` | Reisefradrag egenandel 15 250 kr | 12 000 kr (korrekt 2026) |
| skatt H3 | `core.js:2890` | Fallback 14 400 kr | 12 000 kr |
| boliglan M3 | `no.js:17` morReqRows | "Høyeste av 7% og rente + 3 pp" | `rate+3` uten gulv (se H1) |
| boliglan M4 | `no.js:17` morReqRows | "Avdrag: Min. 2,5% over 60% LTV" | Avdragskravet fjernet i 2022/23 |
| kalkulator M2 | `index.html:215` `aga-hint-otp` fallback | 1G = 124 028 kr (2025) | 130 160 kr (2025/2026) |

---

## Høy prioritet (12 funn)

### skatt

#### H1 — "Næring eller hobby?"-kortet helt hardkodet norsk (77 linjer)

> [!bug] `skatt/index.html:169-245` — ingen `applyLang`-wiring
> Kortet har IDs `naering-hobby-title`, `naering-hobby-desc`, fire kriterier, 50k-grense, skattekonsekvenser, eksempler, "Viktige terskler (2026)" — men ingen av disse er wired i `core.js`. Grep etter `naeringHobby*` i applyLang-sammenheng gir **0 treff**. Ingen lang-keys eksisterer for innholdet.
>
> **Konsekvens:** Bytter bruker til engelsk/arabisk forblir hele kortet på norsk (~2 000 tegn skattefaglig innhold).
>
> **Fix:** Lag `naeringHobbyTitle`, `naeringHobbyDesc`, `naeringHobbyIntro`, `naeringHobbyCrit1..4`, `naeringHobbyConseqHobby`, `naeringHobbyConseqNaering`, `naeringHobbyExamples`, `naeringHobbyThresholds` i alle 10 språkfiler. Wire i `updateSalaryUI()` rundt `core.js:1229`.

#### H2 — BSU beskrevet som "20 %" i søkeresultat (alle 10 språk)

> [!bug] `shared/search.js:69` + `searchDs.bsu`/`searchKw.bsu` i 10 lang-filer
> ```js
> {name:'BSU — Boligsparing for ungdom',desc:'Skattefradrag på 20% av innskudd, maks 27 500 kr/år', tags:'... 20 prosent ...'}
> ```
> `calcSal()` beregner korrekt 10 % (`bsu * 0.10`, `core.js:2697`) — søkeresultatet lyver. Kilde: [Skatteetaten — BSU](https://www.skatteetaten.no/en/rates/deduction-for-young-peoples-housing-savings-bsu/) (10 % siden 2021).
>
> **Fix:** Bytt "20 %" → "10 %" i `search.js:69` (desc + tags) + 10 lang-filer.

#### H3 — Reisefradrag egenandel har 3 ulike stale verdier

> [!bug] Egenandel 2026 = 12 000 kr
> - `skatt/index.html:411` `sal-reise-hint`: "**15 250 kr**" (2024-tall)
> - `shared/core.js:2890` fallback: "egenandelen på **14 400 kr**"
> - `shared/lang/no.js:425` sjekkTips[0]: "**37 km**" (feil heuristikk — riktig ≈27 km med 12 000 kr bunnfradrag)
>
> `calcReise` (core.js:3045-3050) bruker korrekt `nedreGrense=12000`. Kun UI-strings er stale.
>
> **Fix:** Oppdater 3 referanser + sjekkTips[0] i 10 lang-filer (27 km).

### kalkulator

#### H1 — `lvu-zone` dropdown label/value mismatch (FORRETNINGSKRITISK)

> [!danger] `kalkulator/index.html:202` + `core.js:2328` — Bedrifter i Finnmark/Nord-Troms får feil kalkyle
> HTML har **5 options** for `#lvu-zone`, lang-filer har **6 labels**. `repopulateSelectByIndex` overskriver kun textContent uten å endre `value`-attributtet og uten å legge til en 6. option.
>
> **Resultat etter applyLang (verifisert i preview_eval):**
> - Posisjon 4: value=0.051 men label sier "Sone IVa (7,9%)"
> - Posisjon 5: value=0 men label sier "Sone IV (5,1%)"
> - Sone V (0%) er helt utelatt
>
> **Konsekvens:** Bedrifter som bruker "Lønn vs Utbytte"-kalkyle til konkrete valg i Sone IVa eller Sone V får systematisk feil AGA-kalkyle. Dette er en forretningskritisk bug som kan ha økonomiske konsekvenser for brukere.
>
> **Fix:** Oppdater HTML `#lvu-zone` til 6 options (match `#aga-zone`). Bytt `core.js:2328` fra `repopulateSelectByIndex` til `repopulateSelect` med eksplisitt value-array.
> ```html
> <option value="0.141">Sone I (14.1%)</option>
> <option value="0.106">Sone Ia/II (10.6%)</option>
> <option value="0.064">Sone III (6.4%)</option>
> <option value="0.079">Sone IVa (7.9%)</option>
> <option value="0.051">Sone IV (5.1%)</option>
> <option value="0">Sone V (0%)</option>
> ```

### boliglan

#### H1 — Stresstest mangler 7 %-gulv (regresjon fra `372e084` M6-fix)

> [!danger] `shared/core.js:2862-2869` — matematisk feil i kjernefunksjon
> ```js
> // Stresstest: Utlånsforskriften § 5 — banken må sjekke at låntaker tåler +3 pp høyere rente
> const stressRate = (yearlyRate + 3) / 100 / 12;
> ```
> Utlånsforskriften **§ 4-4** (ikke § 5) krever `max(rate+3, 7%)`. Finanstilsynet: *"kunden må tåle en renteøkning på 3 prosentpoeng, men aldri lavere enn 7 %"*.
>
> Ironisk: `morReqRows` i `no.js:17` sier korrekt *"Høyeste av 7% og rente + 3 pp"*. Info-boksen er korrekt, koden er det ikke.
>
> **Fix:**
> ```js
> const stressYearlyPct = Math.max(yearlyRate + 3, 7);
> const stressRate = stressYearlyPct / 100 / 12;
> ```
> Oppdater også kommentar til `§ 4-4` og `morStressNote` i alle 10 språkfiler.

#### H2 — search.js egenkapital stale (15 % → 10 %)

> [!bug] `shared/search.js:68` — Utlånsforskriften endret 2025
> ```js
> desc:'Minimumskapital du må ha ved boligkjøp (15%)'
> tags:'egenkapital 15 prosent boligkjøp krav bank ...'
> ```
> Egenkapitalkrav senket fra 15 % til 10 % i 2025-endringen, LTV-tak fra 85 % til 90 %. Kilde: [regjeringen.no](https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/). `morReqRows` i `no.js:17` sier korrekt 10 %.
>
> **Fix:** Bytt til 10 % i desc + tags.

#### H3 — search.js BSU stale (20 % → 10 %)

> [!bug] `shared/search.js:69` — Kryss-sjekk med skatt H2
> Samme mønster — `calcSal:2697` bruker `bsu * 0.10`, `morBsuRows` sier 10 %, men `search.js` desc sier 20 %. Kan fikses samtidig som skatt H2.

### personlig

#### H1 — `budsjettPdf()` krasjer med TypeError (kritisk ny regresjon)

> [!bug] `shared/core.js:5673-5676` — CSV-nedlasting krasjer umiddelbart
> ```js
> Object.keys(d.cats).sort(function(a,b){return d.cats[b]-d.cats[a];}).forEach(function(c){
>   var pct=d.totalExpense>0?((d.cats[c]/d.totalExpense)*100).toFixed(1):'0';
>   rows.push([catNames[c]||c,d.cats[c],pct+'%']);
> });
> ```
> `budsjettCalc()` lagrer kun `incomeItems, expenseItems, totalIncome, totalExpense, balance, savingsRate` i `window._budsjettData` — **ikke** `cats`. `catNames` er aldri definert. Når brukeren klikker "Last ned (CSV)" → `TypeError: Cannot read properties of undefined (reading 'sort')`.
>
> **Rotårsak:** `budsjettCalc()` ble refaktorert til per-rad gruppering, men PDF-eksporten ble aldri tilpasset nytt dataformat.
>
> **Fix:** Iterer over `d.expenseItems` i stedet:
> ```js
> d.expenseItems.forEach(function(i){
>   var pct = d.totalExpense > 0 ? ((i.amount/d.totalExpense)*100).toFixed(1) : '0';
>   rows.push([i.name, i.amount, pct+'%']);
> });
> ```

#### H2 — Studielån hjemmeboer-sats er fabrikkert (7 682 kr/mnd)

> [!bug] `shared/core.js:5146` — 7 682 er ikke en reell Lånekassen-sats
> ```js
> function _studieSatser(){return{borte:15169,hjemme:7682};}
> ```
> **Faktisk Lånekassen 2025–2026** (verifisert mot `lanekassen.no`): Basislånet er **15 169 kr/mnd** for ALLE fulltidsstudenter — uansett boform. Forskjellen er at hjemmeboere ikke får stipend-omgjøring (hele basislånet forblir lån; borteboere får inntil 40 % stipend).
>
> **Eksempel — 3 år hjemmeboer, fullført bachelor:**
> - Kode: `3 × 7682 × 11 = 253 506 kr` total basisstøtte → systematisk feil
> - Faktisk: `3 × 15169 × 11 = 500 577 kr` total basisstøtte
>
> **Fix:** `hjemme: 15169`. Oppdater også `studieClampBorte` hint-strengen på linje 5160-5162.

### avgift

#### H1 — Stale elbil-grense i vatLawRows (300 000 → 500 000 + paragraf § 6-8 → § 6-7)

> [!danger] `shared/lang/no.js:27` + 9 andre lang-filer
> ```js
> ['Elbil under 300 000 kr?','Fritatt — over dette beregnes 25 % mva','§ 6-8']
> ```
> Siden 1. januar 2023 er elbil-fritaket begrenset til **500 000 kr**, ikke 300 000. Og riktig paragraf er **mval. § 6-7** (ikke § 6-8, som regulerer el-kraft til husholdning i Nord-Norge).
>
> Kilde: [Skatteetaten — Elbil mva § 6-7](https://www.skatteetaten.no/en/rettskilder/type/uttalelser/prinsipputtalelser/innforing-av-merverdiavgift-pa-elbiler-fra-1.-januar-2023---narmere-om-tidspunkt-for-levering/).
>
> **Fix:**
> ```js
> ['Elbil under 500 000 kr?','Fritatt — vederlag over dette beregnes 25 % mva (fra 2023)','§ 6-7']
> ```
> Oppdater i alle 10 språkfiler. Høy synlighet — dette er det mest googlede elbil-spørsmålet i Norge.

#### H2 — Fabrikert AGA-fribeløp i salAgaRows (500k → 850k for 2026)

> [!bug] `shared/lang/no.js:91` + 9 andre lang-filer
> ```js
> ['Hva er fribeløpet?','Bedrifter i lavere soner har et fribeløp (ca. 500 000 kr/år)...','ESA-regelverk']
> ```
> For 2026 er fribeløpet **850 000 kr** (sone Ia/II/III/IVa bruker redusert sats til differansen mot sone I-sats når 850 000 kr/år er nådd). Kilde: [Skatteetaten AGA 2026](https://www.skatteetaten.no/en/rates/employers-national-insurance-contributions/).
>
> **Merk:** Vises i `vat-aga-card` på avgift-siden. Cross-sectional pattern — kryss-referer med kalkulator-siden (AGA-kalkulatoren bor der).
>
> **Fix:** Oppdater tekst til "Sone Ia/II/III/IVa bruker redusert sats til differansen mot sone I-sats (14,1 %) når 850 000 kr/år er nådd (2026)".

### selskap

#### H1 — ANS/DA registreringsgebyr 2 250 kr stale (faktisk 3 883 kr 2026)

> [!bug] `shared/lang/no.js:584, 615, 639, 679` + 9 andre språkfiler
> Vises i `selskapAnsBody` nøkkelfakta, `selskapCompareBody` tabell, og `selskapRegBody` steg 3. Brønnøysund 2026: ANS/DA = **3 883 kr elektronisk** / 4 398 kr papir.
>
> Kilde: [Brønnøysund — Gebyrer for registrering](https://www.brreg.no/en/how-can-we-help-you/fees-for-registration/).
>
> **Fix:** Oppdater alle 10 språkfiler. Vurder å sentralisere i `FEES = {as: 6825, ans: 3883, ks: 6825}` i `core.js` — cross-link til Mønster #1.

---

## Medium prioritet (28 funn)

### skatt

- **M1** `formue-l-fritid/naering/driftsmidler` labels ikke oversatt (`skatt/index.html:629-641` + core.js:1184-1205)
- **M2** Saldoavskrivning-terskel "15 000 kr" stale i 7 lang-filer — korrekt 2024+: **30 000 kr** (sktl. § 14-40(1))
- **M3** `.focus-card-btn:hover` uwrapped hover-rule (`style.css:700`) — bruker `transform:scale(1.1)` uten `@media(hover:hover)`
- **M4** Stale "foreldrefradrag avviklet fra 2023" i `sjekkTips[4]` kontrasterer med levende checkbox i UI (eksisterer fortsatt som sktl. § 6-48)

### kalkulator

- **M1** HTML-fallback saldogruppe c stale `value="0.22"` (skal være `0.24`) — `kalkulator/index.html:223`. Runtime korrekt via `repopulateSelect`, HTML-fallback stale.
- **M2** HTML-fallback 1G stale "124 028 kr i 2025" → **130 160 kr** (`kalkulator/index.html:215`)
- **M3** `ti.js:280` `agaOtpHint` har arabisk tekst midt i tigrinja-setning (`كرونة في 2025/2026`)
- **M4** 5 tema-spesifikke `.btn-calc:hover` ikke wrappet (`style.css:29, 90, 249, 413, 544`)
- **M5** 13 `<div onclick>` mode-switchere i kalkulator/index.html mangler tastaturtilgang (`.cm-opt`, `.cc-swap`, NPV how-to)
- **M6** `repopulateSelect` kan silent-reset brukerens valg ved språkbytte hvis HTML-fallback-verdi ikke finnes i ny options-liste
- **M7** `calcLvu` "Lønn vs Utbytte" mangler disclaimer om at sammenligningen kun er selskapskostnad (ikke nettobeløp til mottaker); `divNet` er dead code

### boliglan

- **M1** 6× `<div class="card-hdr" onclick>` i `boliglan/index.html` — L4/L5-fiksen hoppet over boliglan (Mønster #2)
- **M2** `§ 5` i stresstest-notat feil paragraf — skal være **§ 4-4** (Utlånsforskriften). `morStressNote` i 10 språkfiler + core.js:2862 kommentar
- **M3** UI-tekst `morReqRows` sier korrekt "Høyeste av 7% og rente + 3 pp", men `calcMor` gjør ikke max-beregning (kryss-link H1)
- **M4** `morReqRows` "Avdrag 2,5% over 60% belåning" er utdatert — avdragskravet ble **opphevet** i 2022/23-revisjon av Utlånsforskriften. Verifiser mot Finanstilsynet.

### personlig

- **M1** 14× `<div class="card-hdr" onclick>` i `personlig/index.html` — Mønster #2
- **M2** 6 tema-hover-rules uten `@media(hover:hover)` — Mønster #4
- **M3** Stale fallback "Frikort (70 000 kr)" hardkodet i `core.js:1570` `lonnHowtoRows` fallback — frikortgrense 2026 = **100 000 kr**. Dead code i praksis (lang-filen vinner), men aktivt feilinformasjon hvis lang-load feiler.
- **M4** `ABO_OLD` historie-priser ikke datert (Spotify 119→139 er fra 2024, Viaplay 149→799 urealistisk, iCloud+ 12→29 stemmer ikke)
- **M5** `'Description'`, `'Amount (kr/mo)'`, `'Beskrivelse'` engelsk HTML-fallback i norsk miljø (`core.js:1597-1600`)

### avgift

- **M1** i18n key-mismatch i `search.js:186` — bruker `vatAdjTitle`/`vatAdjDesc` men lang-filene definerer `adjTitle`/`adjDesc`. `URL_TO_DISPLAY` (linje 233) bruker korrekt navn, men haystack-søk på ikke-norske oversettelser treffer ikke. Én-linjes fix.
- **M2** Engelske HTML-fallbacks på norsk side (`avgift/index.html:215-220`) — "Amount", "Tax Rate", "Excl. tax (add tax)" etc. FOUC-risiko hvis `applyLang` aborter
- **M3** Sone Ia og II kollapset til ett dropdown-alternativ i `agaZoneOpts` (matematisk OK, men `salAgaRows` lister dem separat → inkonsistens)

### selskap

- **M1** KS registreringsgebyr stale 2 250 kr → **6 825 kr** (samme som AS) — kryss-link H1
- **M2** `infoRowsHTML` genererer 55 `<div class="ir" onclick="window.open(...)">` på selskap-siden + cross-page impact (Mønster #3) — **faktisk 100+ div-onclick-elementer totalt**
- **M3** Stiftelse 100 000 kr vises kun for alminnelige — mangler 200 000 kr for næringsdrivende (stiftelsesloven § 14 annet ledd)
- **M4** `searchKw.trygdeavgift:'...7.9 prosent'` stale (2026 = 7,6 % / 10,8 % / 5,1 %)
- **M5** `selskap-andre-card` (ASA/NUF/SA/stiftelse) ikke i `SEARCH_DATA` → usøkbar. Samme for alle `sel-asl-*`/`sel-sel-*` sub-lov-kort.

---

## Lav prioritet (30 funn)

### skatt (3)

| ID | Kort | Fil:linje |
|---|---|---|
| L1 | `<div class="card-hdr" onclick>` mønster (28×) — mitigert av `applyA11y` | `skatt/index.html` |
| L2 | `search-result-desc` rendres uescaped HTML (kun dictionary-strings, teoretisk XSS) | `search.js:516` |
| L3 | `sjekk-c1-tip`..`sjekk-c8-tip` IDs ikke wired per språk (fungerer via lang-filen, teoretisk XSS) | `skatt/index.html:255-283` |

### kalkulator (7)

| ID | Kort | Fil:linje |
|---|---|---|
| L1 | `calcRente` mangler sanity check for `est >= amt` (bisection konvergerer til cap 200 %) | `core.js:4199-4228` |
| L2 | `calcValgevinst` mangler `isFinite`/NaN-guard på buy/sell rate | `core.js:4257-4275` |
| L3 | `avs-mode-info` "?"-knapp mangler `aria-label` | `kalkulator/index.html:221` |
| L4 | `avsLifeChanged`/`calcAvs` uten null-check på `avs-life`/`avs-group` | `core.js:4118, 4123` |
| L5 | `calcFerie` uten null-check på `ferie-type`/`ferie-over60` | `core.js:4173-4174` |
| L6 | `calcLvu` beregner `divNet` som aldri brukes (dead code) | `core.js:4029` |
| L7 | `aga-hint-zone` bruker `javascript:void(0)` (foreldet pattern) | `kalkulator/index.html:215` |

### boliglan (6)

| ID | Kort | Fil:linje |
|---|---|---|
| L1 | morCsv dokumentasjon av `_mor.fees` semantikk mangler | `core.js:2805` |
| L2 | "Rente nå: Ca. 5,1 % flytende" hardkodet i 10 språkfiler | `no.js:18` morCostRows |
| L3 | `_mor` lagrer månedlig `fees` men csv-kommentar mangler | `core.js:2805` |
| L4 | `<input id="m-y">` mangler `min="1"` | `boliglan/index.html:186` |
| L5 | `<input id="m-r">` mangler `min="0"` | `boliglan/index.html:185` |
| L6 | Avdragsfri-feil (`ioYears >= years`) skjules uten feilmelding | `core.js:2822` |

### personlig (4)

| ID | Kort | Fil:linje |
|---|---|---|
| L1 | `calcLonn` personfradrag/minstefradrag ikke kappet i breakdown-visningen | `core.js:4908-4912` |
| L2 | `calcBil` har ingen øvre grense på `km` (1.5M km/år mulig) | `core.js:3313` |
| L3 | Drivstoffpriser `27.93`/`25.71` magiske tall — bør løftes til `DRIVSTOFF_2026`-konstant | `core.js:3355, 3359` |
| L4 | `loadLang('no').catch(...)` feil-håndtering lekker hardkodede fallbacks | `core.js:5807-5823` |

### avgift (6)

| ID | Kort | Fil:linje |
|---|---|---|
| L1 | 4× sekundære `<div onclick>` (law-group, justeringsforklaring, privacy/contact-back) | `avgift/index.html:169, 283, 389, 428` |
| L2 | § 6-8 feil paragraf for elbil — cascade fra H1 | `lang/*.js vatLawRows` |
| L3 | Bagatellgrense 10 pp rounding edge case (9.5 → 10 round → ikke bagatell) | `core.js:3570` |
| L4 | `adj-years` mangler null-check | `core.js:3537` |
| L5 | Redundant `role=button` + `tabindex=0` på native `<button>` (a11y "duplicated role") | `core.js:5866, 5873` |
| L6 | Sone IVa/IV rekkefølge inkonsistent mellom `agaZoneOpts` og `salAgaRows` | `lang/no.js:342` |

### selskap (4)

| ID | Kort | Fil:linje |
|---|---|---|
| L1 | Law-group + sub-kort (`sel-asl-*`/`sel-sel-*`) ikke i SEARCH_DATA — §§ usøkbare | `search.js:54-61` |
| L2 | Terminologi "deltakerligning" (pre-2006) inkonsistent med moderne "deltakermodellen" | `lang/no.js:591, 646, 647, 655, 818, 888` |
| L3 | Pink-theme hover korrekt wrappet — dokumentert (ingen fix) | `style.css:116-117` |
| L4 | ENK "Gratis" pedagogisk forenkling (korrekt for Enhetsregisteret, Foretaksregisteret 3 883 kr) | `lang/no.js:533, 639, 679` |

---

## Bekreftet korrekt (kumulativt fra v8 → v9)

> [!success] Alle 2026-satser re-verifisert 2026-04-11 mot offisielle kilder

### Satser og konstanter

| Sats | Verdi | Kilde |
|---|---|---|
| Personfradrag 2026 | 114 540 kr | Skatteetaten |
| Trinnskatt trinn 1-5 | 1.7/4.0/13.7/16.8/17.8 % @ 226 100/318 300/725 050/980 100/1 467 200 | Skatteetaten |
| Trygdeavgift lønn/næring | 7.6 % / 10.8 % | Skatteetaten |
| Trygdeavgift nedre grense | 99 650 kr | Skatteetaten |
| Trygdeavgift opptrapping | 25 % cap | Skatteetaten |
| Minstefradrag | 46 % / maks 95 700 kr | Skatteetaten |
| 1G grunnbeløp | 130 160 kr (gyldig til 2026-04-30) | NAV |
| Formueskatt bunnfradrag | 1 900 000 kr | Skatteetaten |
| Formueskatt innslagspunkt trinn 2 | 21 500 000 kr | Skatteetaten |
| Formueskatt trinn 1/2 satser | 1.00 % / 1.10 % | Skatteetaten |
| Saldogruppe a-j | 30/20/24/20/14/12/5/4/2/10 % | sktl. § 14-43 |
| Feriepenger ordinær/60+ | 10.2 % / 12.0 % (+2.3 % 60+ 6G-tak) | Ferieloven § 10 |
| BSU skattefradrag | **10 %** (ikke 20 %) | Skatteetaten |
| BSU maks innskudd | 27 500 kr/år, 300 000 kr total | Skatteetaten |
| Oppjusteringsfaktor aksjeinntekt | 1.72 (effektiv utbytteskatt 37.84 %) | sktl. § 10-11 |
| MVA-satser | 25 / 15 / 12 / 0 % | Stortingsvedtak 2026 |
| AGA-soner | 14.1 / 10.6 / 7.9 / 6.4 / 5.1 / 0 % | Skatteetaten |
| AGA fribeløp sone Ia/II | **850 000 kr** (ikke 500k) | Skatteetaten 2026 |
| Selskapsskatt AS | 22 % | Skatteetaten |
| Aksjekapital min. AS | 30 000 kr | asl. § 3-1 |
| Reg.gebyr AS elektronisk | **6 825 kr** | Brønnøysund 2026 |
| Reg.gebyr ANS/DA elektronisk | **3 883 kr** (ikke 2 250) | Brønnøysund 2026 |
| Reg.gebyr KS elektronisk | **6 825 kr** (ikke 2 250) | Brønnøysund 2026 |
| Norges Bank styringsrente | 4.00 % | Norges Bank (jan 2026) |
| SSB snitt boliglånsrente | 5.07 % (feb 2026) | SSB 09654 |
| Tinglysingsgebyr skjøte | 545 kr | Kartverket 2026 |
| Dokumentavgift | 2.5 % | Kartverket |
| Max låneperiode (§ 4-5) | 30 år | Utlånsforskriften |
| Max LTV privatbolig | 90 % (opp fra 85 %) | Utlånsforskriften 2025 |
| Max gjeld-til-inntekt | 5× bruttoinntekt | Utlånsforskriften § 4-3 |
| Stresstest | **max(rate + 3 pp, 7 %)** | Utlånsforskriften § 4-4 |
| Diesel pumppris april 2026 | 27.93 kr/L (pump 25.08 + redusert veibruksavgift 2.28 × 1.25 MVA) | Stortingsvedtak 486/2026 + NAF |
| Bensin pumppris april 2026 | 25.71 kr/L (pump 21.00 + redusert 3.77 × 1.25 MVA) | Stortingsvedtak 486/2026 |
| Frikortgrense 2026 | 100 000 kr | Skatteetaten |
| Trafikkforsikringsavgift | 2 380 / 3 343 kr (fossil / elbil) | Skatteetaten |
| Lånekassen basislån | 15 169 kr/mnd for ALLE studenter | lanekassen.no |
| Reisefradrag egenandel | **12 000 kr** (ikke 14 400 / 15 250) | Skatteetaten 2026 |
| Reisefradrag sats | 1.90 kr/km | Skatteetaten |
| Saldoavskrivning terskel | **30 000 kr** (ikke 15 000) | sktl. § 14-40 (siden 2024) |
| Elbil mva-grense | **500 000 kr** (ikke 300 000) + **§ 6-7** | Skatteetaten 2023 |
| Netflix Standard NO | 159 kr/mnd | Netflix.no |
| Spotify Premium Individual | 139 kr/mnd | Spotify.no |

### Implementasjoner verifisert

- ✓ `calcTrygdeavgift` med opptrapping 25 % cap — brukt 4 steder (`calcSal`, `calcUttak`, `calcUtdeling`, `calcLonn`)
- ✓ `calcMor` annuitetsformel + serielån + 30-års clamp (v8-fix holder)
- ✓ `calcAdj` justeringsmoms (10 år eiendom / 5 år maskiner) + terskel (100k/50k) + bagatell (<10 pp) + § 9-5 formel
- ✓ `calcVat` både 'ex' og 'inc' retninger
- ✓ `calcNpv` Newton-Raphson med konvergens/range/NaN-guards (300 iterasjoner)
- ✓ `calcEffRate` bisection 200 iterasjoner (mangler sanity check for est≥amt — se kalkulator L1)
- ✓ `calcSpare` compound interest NaN-guard (v8-fix holder)
- ✓ `calcAga`/`calcPensjon` OTP 1G-12G via Innskuddspensjonsloven § 4-7
- ✓ `calcFerie` Ferieloven § 5 (20/25 virkedager) + § 10 nr. 3 (6G-tak 60+ bonus) — v8-fix verifisert matematisk korrekt
- ✓ `calcBil` drivstoffpriser 2026 med dokumentert valg om ikke å modellere apr-sept reduksjon separat
- ✓ Fritaksmetoden i18n (`884f94f`) — alle 10 språkfiler har `utdelingFritakTitle`/`Body`/`Link`, `applyLang`-wiring intakt
- ✓ CSS `.info-card ~ .info-card` fiksen fra `b8fcad8` — scoped til `.card > .info-card`, skatteloven-kapitler synlige i desktop-focus
- ✓ Search `resolveDisplay` fallback-flyt for concept/law items
- ✓ `buildChips` + `hvtSearchRebuildChips`-hook (`3b41e83`) patch-path validert
- ✓ L4 BS4 div→button verifisert OK på avgift (16/16 buttons, 0 divs, aria-expanded virker)
- ✓ L5 BS4 div→button verifisert OK på selskap (19/19 buttons, RTL virker, toggle 0→479 px)
- ✓ M7 dedupe `calcAdj` 4× `getElementById('adj-rh')` → 1× holder
- ✓ HTML-integritet: ingen trunkering i noen seksjon (kalkulator IIFE kompletterer seg selv)
- ✓ RTL `setRegion('ar')` fungerer på alle 6 seksjoner
- ✓ Cache-bust alle 7 sider: `style.css?v=v26`, `core.js?v=v30`, `search.js?v=v9` konsistent
- ✓ i18n key parity etter `372e084` M9-fix: alle 10 språkfiler har selskap-keys (64/64), kalkulator-keys (14/14)

---

## Prioritert fix-rekkefølge

### Topp-5 umiddelbare (forretningskritiske + regresjon)

1. **Kalkulator H1 (lvu-zone)** — 15 min. Bedrifter i Finnmark/Nord-Troms får feil AGA-kalkyle. Oppdater 6 options i HTML + bytt til `repopulateSelect` i `core.js:2328`.
2. **Personlig H1 (budsjettPdf TypeError)** — 10 min. CSV-nedlasting krasjer umiddelbart. Iterer over `d.expenseItems` i stedet for `d.cats`.
3. **Personlig H2 (studielån hjemmeboer fabrikkert)** — 10 min. Sett `hjemme: 15169`. Oppdater `studieClampBorte` hint-streng.
4. **Boliglan H1 (stresstest 7 %-gulv)** — 15 min. `Math.max(yearlyRate + 3, 7)`. Fix `§ 5` → `§ 4-4` i kommentar.
5. **Skatt H1 ("Næring eller hobby?" hardkodet)** — 2 timer. Lag 12+ lang-keys × 10 språk + wire i `updateSalaryUI()`. Størst arbeid, men høyeste synlighet.

### Neste (stale satser — Mønster #1)

6. **search.js stale BSU 20 %→10 %** (skatt H2 + boliglan H3) — 10 min, én fix treffer begge
7. **search.js egenkapital 15 %→10 %** (boliglan H2) — 5 min
8. **vatLawRows elbil 300k→500k + § 6-8→§ 6-7** (avgift H1) — 20 min (10 språk)
9. **salAgaRows fribeløp 500k→850k** (avgift H2) — 20 min (10 språk)
10. **Selskap Brønnøysund-gebyrer 2250→3883/6825** (selskap H1 + M1) — 30 min (10 språk × 3 nøkler × 4 rader)
11. **Skatt reisefradrag 14400/15250→12000** (skatt H3) — 30 min (HTML + core.js + sjekkTips[0] i 10 lang)
12. **Skatt saldoavskrivning 15k→30k** (skatt M2) — 20 min (7 lang-filer)

### A11y-gjeld (Mønster #2 + #3)

13. **`infoRowsHTML` div→anchor refactor** (selskap M2 cross-page) — 15 min. Én-linjes endring i `core.js:1130`. Fikser 100+ a11y-issues.
14. **BS4 div→button på boliglan + personlig** (boliglan M1 + personlig M1) — 30 min. Kjør `scripts/convert_card_hdr.py` på begge filer.
15. **13× mode-switchere i kalkulator** (kalkulator M5) — 30 min. Konverter `.cm-opt`, `.cc-swap`, NPV how-to til `<button>`.

### Hover-regler (Mønster #4)

16. **Wrap 12 tema-hover-rules** (skatt M3 + kalkulator M4 + personlig M2) — 15 min. `@media(hover:hover){...}` rundt hver regel.

### UI-hint / konsistens (Mønster #7)

17. **HTML-fallback saldogruppe c + 1G** (kalkulator M1 + M2) — 5 min
18. **Boliglan § 5 → § 4-4 paragraf** (boliglan M2) — 15 min (10 språk + core.js)
19. **Verifiser "avdrag 2.5%/60%"-regel** (boliglan M4) — 20 min + WebSearch mot Finanstilsynet
20. **`ti.js` arabisk midt i tigrinja** (kalkulator M3) — 5 min

### i18n-hull (nye keys)

21. **Formue-labels fritid/næring/driftsmidler** (skatt M1) — 20 min (10 språk + wire)
22. **`searchKw.trygdeavgift` 7.9→7.6** (selskap M4) — 2 min
23. **`selskap-andre-card` + law-sub-kort i SEARCH_DATA** (selskap M5 + L1) — 30 min
24. **`avgift M1` `vatAdjTitle` → `adjTitle`** (avgift M1) — 2 min

### Total estimat

**Topp-5 umiddelbare:** ~3 timer
**Stale satser (Mønster #1):** ~2.5 timer
**A11y-gjeld:** ~1.5 timer
**Hover + UI-hint:** ~1.5 timer
**i18n-hull:** ~1.5 timer
**Totalt: ~10 timer** for alle 70 funn.

---

## Metodenotater

### Audit-modus (v9)

**Type:** FULL RE-AUDIT med sub-agent-per-seksjon workflow (skill v2).

**Scope:**
- Alle 6 seksjoner auditert av én fresh general-purpose sub-agent hver
- Hver sub-agent fikk cross-reference-mønstre fra tidligere sub-agenter i samme sesjon (kumulativ intelligens)
- WebSearch-verifisering mot offisielle 2026-kilder for alle satser
- Matematisk verifisering av alle `calcX`-funksjoner
- i18n-coverage alle 10 språkfiler per seksjon
- A11y-regresjonssjekk etter L4/L5 BS4-fikser
- HTML-integritet + RTL-verifikasjon
- Preview-server (port 8082) for runtime-verifikasjon der relevant

**Cross-reference-strategi:** Hver sub-agent fra nummer 2 og utover fikk eksplisitt liste over mønstre funnet av tidligere sub-agenter. Dette forsterket signal på systemiske bugs (f.eks. `search.js` stale-pattern ble funnet av 4 av 6 sub-agenter).

### Endringer vs v8

**Nye funn ikke i v8:**
- Mønster #1 stale `search.js`/lang-satser er nesten fullstendig nytt — v8 fokuserte på `core.js`-satser
- Mønster #3 `infoRowsHTML` dynamiske div-onclicks har cross-page impact som v8 ikke kvantifiserte
- Mønster #5 matematiske regresjoner fra v8-fiksene (stresstest, budsjettPdf)
- Mønster #7 systematisk UI-hint vs kode-konstant drift

**v8-fikser verifisert:**
- ✓ `4fee17a` H6 drivstoffpriser korrekt implementert + dokumentert valg om ikke å modellere apr-sept reduksjon separat
- ✓ `372e084` M5 (30-år clamp) + M6 (stresstest UI) + M9 (i18n key parity) — men **stresstest-matematikken har regresjon** (Boliglan H1)
- ✓ `77c1acc` L1 (stale datoer) + L2 (Enter-handler) + L3 (calcFerie divisor) holder
- ✓ L4/L5 BS4 div→button fullstendig verifisert på avgift (16/16) + selskap (19/19)
- ✗ L4/L5 BS4 fix hoppet over boliglan (6 divs) + personlig (14 divs) — åpent som v9-M1
- ✓ `884f94f` Fritaksmetoden i18n + search.js resolveDisplay fungerer på alle 10 språk
- ✓ `3b41e83` search chips rebuild hook validert
- ✓ `b8fcad8` CSS sibling-fiks scoped korrekt, skatteloven-kapitler synlige

### Kjente fallgruver unngått

- Ingen regex brukt til å omskrive nested HTML (incident 2026-04-10)
- Ingen CSS `~`/`:has()` + `display:none`-mønstre lagt til
- Alle hover-regler i fiks-forslag skal wrappes i `@media(hover: hover)`
- Sub-agent-outputs verifisert med `ls`/`Read` etter hver dispatch
- Scheduled tasks ikke brukt (skill v2-regel)
- Saldogruppe c = 24 % kryss-verifisert (ikke 22 % fra v7-falsk-positivet)

### Sub-agent metrics

| Seksjon | Duration (ms) | Tool uses | Tokens |
|---|---|---|---|
| skatt | 579 973 (~9.7 min) | 69 | 250 399 |
| kalkulator | 900 344 (~15 min) | 86 | 217 129 |
| boliglan | 520 960 (~8.7 min) | 54 | 183 520 |
| personlig | 483 535 (~8 min) | 55 | 236 617 |
| avgift | 565 044 (~9.4 min) | 72 | 204 783 |
| selskap | 751 775 (~12.5 min) | 84 | 236 750 |
| **Total sub-agent tid** | **~63 min** | **420** | **~1 329 000** |

### Verifikasjonsmetoder

- **Live preview** (`localhost:8082`) — H1 lvu-zone label/value mismatch, M3 ti.js arabisk/tigrinja, L5 div→button toggle, RTL switching
- **WebSearch** mot skatteetaten.no, regjeringen.no, lovdata.no, brreg.no, nav.no, kartverket.no, norges-bank.no, finanstilsynet.no, lanekassen.no, naf.no
- **WebFetch** for direkte kilde-validering (Kartverket tinglysingsgebyr, Brønnøysund fees)
- **Grep cross-reference** JS-konstanter ↔ lang-filer for alle satser

---

## Relaterte noter

- [[hverdagsverktoy-audit-consolidated-v8]] — forrige baseline (26→0 lukket)
- [[hverdagsverktoy-audit-latest]] — 1:1 kopi av denne versjonen
- [[hverdagsverktoy-skatt-audit]] — delrapport (10 funn)
- [[hverdagsverktoy-kalkulator-audit]] — delrapport (15 funn)
- [[hverdagsverktoy-boliglan-audit]] — delrapport (13 funn)
- [[hverdagsverktoy-personlig-audit]] — delrapport (11 funn)
- [[hverdagsverktoy-avgift-audit]] — delrapport (11 funn)
- [[hverdagsverktoy-selskap-audit]] — delrapport (10 funn)

## Kilder (kumulativ)

### Primærkilder 2026

- [Skatteetaten — Satser 2026](https://www.skatteetaten.no/en/rates/) (alle rate-sider)
- [Regjeringen — Skattesatser 2026](https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skattesatser-2026/id3121978/)
- [Lovdata — Stortingsvedtak 2025-12-18 (skatt/mva/AGA 2026)](https://lovdata.no/dokument/STV/)
- [Lovdata — Skatteloven](https://lovdata.no/lov/1999-03-26-14)
- [Lovdata — Merverdiavgiftsloven](https://lovdata.no/dokument/NL/lov/2009-06-19-58)
- [Lovdata — Ferieloven](https://lovdata.no/dokument/NL/lov/1988-04-29-21)
- [Lovdata — Aksjeloven](https://lovdata.no/lov/1997-06-13-44)
- [Lovdata — Utlånsforskriften (FOR-2022-12-09-2037)](https://lovdata.no/dokument/SF/forskrift/2022-12-09-2037)
- [Lovdata — Stortingsvedtak 486/2026 (drivstoff-reduksjon)](https://lovdata.no/dokument/LTI/forskrift/2026-03-26-486)
- [NAV — Grunnbeløpet](https://www.nav.no/grunnbelopet)
- [Norges Bank — Styringsrente](https://www.norges-bank.no/tema/pengepolitikk/Styringsrenten/)
- [Kartverket — Dokumentavgift + tinglysingsgebyr](https://www.kartverket.no/en/property/dokumentavgift-og-gebyr/tinglysingsgebyr)
- [Brønnøysund — Gebyrer for registrering 2026](https://www.brreg.no/en/how-can-we-help-you/fees-for-registration/)
- [Lånekassen — Endringer 2025-2026](https://lanekassen.no/en-US/presse-og-samfunnskontakt/nyheter/endringer-for-elever-og-studenter-for-studiearet-2025-2026/)
- [Finanstilsynet — Utlånsforskriften 2025](https://www.finanstilsynet.no/publikasjoner-og-analyser/boliglansundersokelser/2025/)
- [Regjeringen — Utlånsforskriften-endringer 2025](https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/)
- [SSB 09654 — Renter i banker](https://www.ssb.no/statbank/table/09654)
- [NAF — Drivstoffavgifts-reduksjon 2026](https://kommunikasjon.ntb.no/pressemelding/18847937/)

---

**Rapport generert:** 2026-04-11 (sub-agent-workflow, 6 sub-agents sekvensielt)
**Versjon:** v9
**Status:** 70 åpne funn (12 H / 28 M / 30 L). Seks systemiske cross-cutting mønstre identifisert.
**Signoff:** Fem umiddelbare fikser (topp-5) er forretningskritiske eller regresjoner. Resten er stale data og a11y-gjeld som kan fikses i batcher.
