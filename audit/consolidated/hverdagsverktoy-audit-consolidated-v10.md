---
title: Hverdagsverktøy — Konsolidert audit V10
date: 2026-04-11
tags: [hverdagsverktoy, audit, consolidated, v10]
status: review
version: 10
baseline_commit: 80a66e7
source: 6 delrapporter i research/raw/hverdagsverktoy-*-audit.md
---

# Konsolidert audit V10 — hverdagsverktoy.com

**Dato:** 2026-04-11
**Baseline:** post-commit `80a66e7` (V9 Mønster #2 a11y batch 2)
**Scope:** Full re-audit av alle 6 seksjoner via parallell sub-agent-dispatch (skill v3)
**Delrapporter:** [[hverdagsverktoy-skatt-audit]] · [[hverdagsverktoy-kalkulator-audit]] · [[hverdagsverktoy-boliglan-audit]] · [[hverdagsverktoy-personlig-audit]] · [[hverdagsverktoy-avgift-audit]] · [[hverdagsverktoy-selskap-audit]]

---

## Totalt

> [!danger] V10 C1 — KRITISK REGRESJON
> Min V9 batch 1 fix (`efefef8`) endret `no.js:27` elbil-fritak fra `§ 6-8 / 300 000 kr` → `§ 6-7 / 500 000 kr`. **Begge endringene er feil for 2026.** Korrekt: **§ 6-8 / 300 000 kr** (statsbudsjett 2026 reduserte fra 500k til 300k, paragraf uendret). De 9 andre lang-filene var korrekte fra start og skal IKKE propageres med NO sin feil — NO skal rulles tilbake. Se avgift-rapporten for full detalj.

| Seksjon | Høy | Medium | Lav | Totalt | Delrapport |
|---|---|---|---|---|---|
| **skatt** | 3 | 4 | 7 | 14 | [[hverdagsverktoy-skatt-audit\|link]] |
| **kalkulator** | 2 | 3 | — | 5+ | [[hverdagsverktoy-kalkulator-audit\|link]] |
| **boliglan** | 1 | 3 | 6 | 10 | [[hverdagsverktoy-boliglan-audit\|link]] |
| **personlig** | 0 | 2 | 5 | 7 | [[hverdagsverktoy-personlig-audit\|link]] |
| **avgift** | 3 (+ C1) | 2 | 3 | 9 | [[hverdagsverktoy-avgift-audit\|link]] |
| **selskap** | 1 | 2 | 1 | 4 | [[hverdagsverktoy-selskap-audit\|link]] |
| **TOTALT** | **10 (+ 1 C)** | **16** | **22** | **49** | — |

**v10 vs v9 delta:**
- V9 fant 70 nye funn (12 H / 28 M / 30 L)
- Etter V9 batch 1 + batch 2 (commits `748495e`, `3336fc9`, `7c90a2e`, `d85e280`, `30749e4`, `efefef8`, `5bea53f`, `80a66e7`): ~11 H lukket, ~7 M lukket, ~62 a11y-konverteringer
- V10 finner 49 åpne funn (10 H + 16 M + 22 L + 1 kritisk regresjon)
- Flere av V9 funnene var bare delvis lukket — batch 1 oppdaterte NO + search.js men glemte de 9 andre lang-filene (se Mønster #1 post-pass)

---

## Mønster-katalog post-pass analyse

Hvert mønster fra skill v3 sjekket eksplisitt av hver sub-agent. Aggregerte treff:

### Mønster #1 — Stale satser i search.js/lang vs core.js
**Massivt treff: Batch 1-fiksen var ufullstendig — 9 lang-filer ble aldri oppdatert.**

| Seksjon | Funn-ID | Stale i | Antall |
|---|---|---|---|
| skatt H1 | `searchDs.{bsu,egenkapital,trygdeavgift}` | 9 lang-filer × 3 keys | 27 stale strings |
| skatt H3 | `searchDs.trinnskatt` "4 trinn" | 9 lang-filer + search.js | 10 strings |
| selskap H1 | `selskapAnsBody`, `selskapKsBody`, `selskapCompareBody`, `selskapRegBody` | 9 lang-filer × 4 rader | 36 stale strings |
| avgift H1 | `salAgaRows` 5 % ekstra AGA | 10 lang-filer | 10 strings |
| avgift H2 | `salAgaRows` fribeløp 500k→850k | 9 lang-filer | 9 strings |
| **TOTALT** | — | — | **~92 stale strings i lang-filer** |

**Rotårsak:** `efefef8` ("Fix V9 stale satser batch 1 — NO + search.js") oppdaterte kun NO og `search.js` items-array, men glemte `searchDs`/`searchKw`-lookup-objektene og alle 9 andre språkfiler. Batch 2 (`5bea53f`) fokuserte på M-tier men dekket heller ikke 9-lang-gapet.

**Løsning (batch 3):** Systematisk oppdatering av alle 9 ikke-norske lang-filer i én atomisk commit. Bruk grep-pattern for å finne alle stale strings, eller skriv Python-script (samme pattern som `add_search_translations.py`).

### Mønster #2 — A11y div→button-gap
**Små gjenværende treff etter batch 2, men kalkulator har et nytt stort område (.cm-opt).**

| Seksjon | Funn-ID | Antall div-onclick | Klasser |
|---|---|---|---|
| skatt M3 | Uttaksregler toggle | 1 | `<div onclick="uttakToggleExplanation()">` linje 423 |
| kalkulator H1 | Mode-switchere | 13 | `.cm-opt` (Lønn vs Utbytte modus-velger) |
| kalkulator M3 | Currency-swap | 1 | `#cc-swap` |
| **TOTALT** | — | **15** | — |

**Rotårsak:** Batch 2 (`80a66e7`) targetet kun `.card-hdr` + `.priv-back`. Andre klasser med `onclick` ble ikke dekket.

**Løsning:** Oppgradere `scripts/convert_a11y_batch2.py` til å også håndtere `.cm-opt`, `.cc-swap`, og andre onclick-klasser. Eller gjør 15 Edit-kall manuelt.

### Mønster #3 — infoRowsHTML div-onclick (systemisk)
**Største systemiske a11y-gjeld. ~300+ elementer på tvers av siden.**

| Seksjon | Antall `.ir` med onclick |
|---|---|
| skatt | 100+ |
| boliglan | ~10 (Krav/Kostnader/BSU-kortene) |
| avgift | ~120+ |
| selskap | ~55 |
| kalkulator | ukjent (mindre) |
| personlig | ukjent (mindre) |
| **TOTALT** | **~300+** |

**Rotårsak:** `shared/core.js:1130` `infoRowsHTML()` template:
```js
const clickable = url
  ? ` onclick="window.open('${url}','_blank')" style="... cursor:pointer; ..."`
  : ' style="..."';
```

**Løsning (én-linjes core.js refactor):** Endre til `<a class="ir" href="${url}" target="_blank" rel="noopener">`. Fikser ~300+ a11y-issues cross-page. Må verifisere at `.ir` CSS-klassen funker med `<a>` (display: block + color inherit).

### Mønster #4 — Hover-regler uten @media(hover:hover)
**Systemisk — samme 5-7 regler rammer alle 6 seksjoner.**

| Linje i style.css | Regel | Effekt |
|---|---|---|
| 29 | `[data-theme="bw"] .btn-calc:hover` | translateY + box-shadow |
| 90 (multi-line) | `[data-theme="pink"] .btn-calc:hover` | translateY + box-shadow |
| 249 (multi-line) | `[data-theme="hendrix"] .btn-calc:hover` | translateY + box-shadow |
| 413 (multi-line) | `[data-theme="disco"] .btn-calc:hover` | translateY + box-shadow |
| 544 | `[data-theme="frost"] .btn-calc:hover` | translateY + box-shadow |
| 560 | `[data-theme="frost"] .dash-ref-card:hover` | box-shadow |
| 700 | `.focus-card-btn:hover` | transform:scale(1.1) |

**Løsning (én edit av style.css):** Wrap hver regel i `@media(hover:hover) { ... }`. Kan gjøres med et Python-script som finner alle `:hover`-regler med `transform` eller `box-shadow` og wrapper dem.

### Mønster #5 — Matte-regresjoner fra fix-commits
**1 kritisk regresjon + 1 pre-eksisterende feilreferanse funnet.**

- **V10 C1 (avgift):** V9 batch 1 elbil-fix var dobbelt feil. Rollback trengs.
- **V10 H1 (boliglan):** Utlånsforskriften § 4-4/§ 4-5 er feil paragraf-referanse (faktisk § 5/§ 9). Ikke en regresjon — var alltid feil — men avslørt av V10.

### Mønster #6 — Hardkodede seksjoner uten applyLang-wiring
Ingen nye treff. V9 H1 (Næring/hobby) er lukket via `30749e4` med EN-fallback.

### Mønster #7 — UI-hint vs kode-konstanter drift
**2 treff:**
- boliglan H1: `mor-stress-note` HTML-default er `§ 5` (riktig), men 10 lang-filer overstyrer til `§ 4-4` (feil)
- selskap Info: Stiftelse UI sier "100 000 kr" uten å nevne 200 000 kr for næringsdrivende (stiftelsesloven § 14 (2))

### Mønster #8 — `repopulateSelectByIndex` silent overwrite
Ingen nye treff etter V9 H1 lvu-zone ble lukket.

### Mønster #9 — Datastruktur-refaktor uten grep-validering
**2 treff:**
- skatt M1: `no.js` mangler hele `searchDn`/`searchDs`-objektene (de 9 andre har dem — arkitektonisk inkonsistens)
- boliglan L1: `updateMortgageUI` linje 1478-1498 har 21 linjer død kode som wirer til fjernede `mor-io-*`-ID-er

### Mønster #10 — Fabrikkerte konstanter
**1 mulig treff (usikkert):**
- personlig L1: `ABO_OLD` priskatalog har Viaplay 149→799 og iCloud+ 12→29 som ser usannsynlige ut — men er historisk data, ikke nåværende satser, så lav prioritet.

### NYTT Mønster #11 — HTML-fallback stale selv når lang oppdateres
**Utvidelse av Mønster #1.** HTML-default-verdier i index.html-filene brukes som fallback hvis applyLang svikter eller før den kjører (FOUC). Disse oppdateres sjelden sammen med lang-filene.

**Eksempler fra V10:**
- boliglan H1: HTML-default på `mor-stress-note` er `§ 5` (riktig) men `mor-note-maxyears` er `§ 4-5` (feil)
- avgift M2: `avgift/index.html:215-228` har engelske hardkodete labels for MVA-kalkulator
- personlig L2: `budsjett-csv-tip` hardkodet norsk uten lang-wiring
- kalkulator HTML-fallbacks for saldogruppe c og 1G ble fikset i batch 2, men andre kan finnes

**Løsning:** Legg til HTML-scan som standard steg i audit-skill v4.

---

## Critical + Høy-funn (detaljert)

### V10 C1 — Elbil-fritak regresjon i NO (avgift)

> [!bug] REGRESJON fra commit `efefef8`
> **Fil:** `shared/lang/no.js:27` (`vatLawRows`)
>
> **Nåværende (feil):**
> ```js
> ['Elbil under 500 000 kr?','Fritatt — vederlag over dette beregnes 25 % mva (fra 2023)','§ 6-7']
> ```
>
> **Korrekt for 2026:**
> ```js
> ['Elbil under 300 000 kr?','Fritatt — vederlag over dette beregnes 25 % mva','§ 6-8']
> ```
>
> **Kilder:** Skatteetaten MVA-håndboken M-6-8, revisorforeningen.no statsbudsjett 2026, NAF moms på elbil 2026, VATupdate Norway 2026 Budget.
>
> **Fix:** 1-linjes rollback i no.js:27. Kritisk å fikse før neste deploy.

### V10 skatt H1 — searchDs stale i 9 lang-filer

`searchDs.{bsu, egenkapital, trygdeavgift}` i alle ikke-norske lang-filer har stale 2023/2024-satser. Når `search.js:276-279` slår opp `item.sk === 'bsu'`, overrides default-tekst med stale tekst fra lang-fil. Rammer søkeresultater på 9 språk.

**Fix:** Batch 3 — oppdater `searchDs` i `ar.js`, `en.js`, `fr.js`, `lt.js`, `pl.js`, `so.js`, `ti.js`, `uk.js`, `zh.js` for BSU (20→10 %), egenkapital (15→10 %), trygdeavgift (7.9→7.6 %).

### V10 skatt H2 — Sjekkliste Q7/Q8 drift HTML vs lang

`skatt/index.html` har c7 = "Har du tap på aksjer eller fond?", c8 = "Leier du ut bolig?". Men alle 10 lang-filer har `sjekkQ7:'Jobber du hjemmefra?'`, `sjekkQ8:'tap aksjer'`, `sjekkQ9:'leier ut bolig'` (død). `SJEKK_DATA` i `core.js:2897-2906` bygger på HTML-rekkefølgen, så label/tip/fradragsberegning er inconsistent for c7/c8.

**Fix:** Align lang-filene med HTML-rekkefølgen, eller reorganiser HTML. Krever grundig cross-check med `SJEKK_DATA` i core.js.

### V10 skatt H3 — Trinnskatt sier "4 trinn" (skal være 5)

`search.js:64` desc + alle 10 lang-filer `searchDs.trinnskatt` sier "4 trinn/brackets". 2026 har 5 trinn (226k/318k/725k/980k/1 467k).

**Fix:** Oppdater `search.js` + 10 lang-filer. 1-linjes per fil.

### V10 kalkulator H1 — 13× `.cm-opt` div-onclick uten tastaturstøtte

`kalkulator/index.html:316-358` har 13 modus-switchere `<div class="cm-opt" onclick="setCalcMode(...)">` som ikke kan aktiveres med tastatur. JS-shim på `core.js:5895` dekker kun `.card-hdr`/`.region-cur`.

**Fix:** Konverter til `<button type="button" class="cm-opt">` (mindre sjanse for hver enkelt) eller utvid `convert_a11y_batch2.py` til å dekke `.cm-opt`.

### V10 kalkulator H2 — 5 tema `.btn-calc:hover` uten wrap

Samme som Mønster #4 global fix. Allerede dekket.

### V10 boliglan H1 — Feil § 4-4/§ 4-5-referanser til Utlånsforskriften

Utlånsforskriften har faktisk `§ 5` (betjeningsevne/stresstest), `§ 6` (gjeldsgrad), `§ 7` (belåningsgrad), `§ 9` (avdrag — og IKKE maks-løpetid). Men HTML + alle 10 lang-filer bruker `§ 4-4` og `§ 4-5`. Spesielt kritisk: HTML-default `mor-stress-note` har riktig `§ 5`, men 10 lang-filer overstyrer til feil `§ 4-4`.

**Fix:** Ubdater 10 lang-filer + 4 core.js fallbacks + 1 kommentar. 30-års clamp skal markeres som bransjenorm (ikke regulatorisk krav) — ingen paragraf hjemler maks løpetid.

### V10 avgift H1 — 5 % ekstra AGA stale i 10 lang-filer

Ordningen avviklet fra 1. jan 2025 per Skatteetaten a-melding. Men alle 10 lang-filer har `salAgaRows`-rad som omtaler den som aktiv. NO har også feil terskel (750k skal være 850k).

**Fix:** Fjern raden eller endre til "Opphevet fra 1. jan 2025" i alle 10 lang-filer.

### V10 avgift H2 — AGA fribeløp 850k kun i NO

Samme problem som Mønster #1 rotårsak: batch 1 oppdaterte kun NO. De 9 andre lang-filene viser fortsatt 500k.

**Fix:** Batch 3 — oppdater fribeløp-raden i 9 lang-filer.

### V10 avgift H3 — Elbil i 9 lang er faktisk riktig (ikke fiks!)

De 9 lang-filene viser `300 000 kr (§ 6-8)` som er korrekt for 2026. Ikke propager NO sin feil — rull NO tilbake (C1).

### V10 selskap H1 — ANS/DA + KS reg.gebyr i 9 lang-filer

`selskapAnsBody`, `selskapKsBody`, `selskapCompareBody`, `selskapRegBody` i alle 9 ikke-norske lang-filer har stale 2 250 kr for ANS/DA og KS. Skal være 3 883 kr (ANS/DA) og 6 825 kr (KS). Total: 36 stale strings.

**Fix:** Batch 3 — oppdater 4 rader × 9 språk = 36 strings.

---

## Medium-funn (kort)

| ID | Seksjon | Kort | Fil:linje |
|---|---|---|---|
| skatt M1 | skatt | `no.js` mangler `searchDn`/`searchDs`-objektene | `shared/lang/no.js:914` |
| skatt M2 | skatt | `.ir`-elementer onclick uten keyboard | `shared/core.js:1130` (Mønster #3) |
| skatt M3 | skatt | Uttaksregler-toggle er div onclick | `skatt/index.html:423` (Mønster #2) |
| skatt M4 | skatt | 5× `.btn-calc:hover` uten `@media(hover:hover)` | `shared/style.css:29,90,249,413,544` (Mønster #4) |
| kalkulator M1 | kalkulator | `calcLvu` sammenligner uten netto-til-mottaker konstant | `shared/core.js:4040-4056` |
| kalkulator M2 | kalkulator | Null-checks mangler i `calcAga`/`calcAvs`/`calcFerie` | `shared/core.js:4062, 4142, 4192-4193` |
| kalkulator M3 | kalkulator | `#cc-swap` div onclick | `kalkulator/index.html` (Mønster #2) |
| boliglan M1 | boliglan | BSU "(13-33 år)" stale i 10 lang (ingen nedre grense) | `morBsuTitle` i 10 lang |
| boliglan M2 | boliglan | infoRowsHTML div-onclick (cross-page) | Mønster #3 |
| boliglan M3 | boliglan | 5 tema-hover uten wrap | Mønster #4 |
| personlig M1 | personlig | 7 CSS-hover uten `@media(hover:hover)` | `style.css:29,90,249,413,544,560,700` (Mønster #4) |
| personlig M2 | personlig | Duplisert `id` attribute | `personlig/index.html:680` |
| avgift M1 | avgift | `adjExMachfoot` § 6-7 hardkodet i 12 filer (skal være § 6-8) | HTML+core.js+10 lang |
| avgift M2 | avgift | Engelsk HTML-fallback for MVA-labels | `avgift/index.html:215-228` (Mønster #11) |
| selskap M1 | selskap | ~55 infoRowsHTML div-onclick (lovverks-gruppen) | Mønster #3 |
| selskap M2 | selskap | Stiftelse 200k næringsdrivende-regel mangler | `selskapAndreBody` i 10 lang |

---

## Lav-funn (svært kortfattet)

| ID | Seksjon | Kort |
|---|---|---|
| skatt L1 | skatt | `sal-info-rows` uten EN-fallback |
| skatt L2 | skatt | `const kl` lite lesbar |
| skatt L3 | skatt | `sjekkQ9` død kode |
| skatt L4 | skatt | `27 km` tvetydig én-vei vs t/r |
| skatt L5 | skatt | `sjekkQ5` HTML vs lang drift |
| skatt L6 | skatt | `.focus-card-btn:hover` transform uten wrap |
| skatt L7 | skatt | `.ir:hover` uten wrap (background, ikke kritisk) |
| boliglan L1 | boliglan | 21 linjer død kode i `updateMortgageUI` |
| boliglan L2 | boliglan | `morHintAnnuity`/`morHintSerial` ikke definert |
| boliglan L3 | boliglan | Attestgebyr-raden alltid 0 kr |
| boliglan L4 | boliglan | `morInfoRows` fallback key ikke i noe lang |
| boliglan L5 | boliglan | `ioYears >= years` skjules silent |
| boliglan L6 | boliglan | Stresstest-serielån som annuitet |
| personlig L1 | personlig | ABO_OLD priser delvis fabrikkert (Viaplay/iCloud+) |
| personlig L2 | personlig | `budsjett-csv-tip` hardkodet norsk |
| personlig L3 | personlig | `studie-rente` default 5.0 (faktisk 4.698) |
| personlig L4 | personlig | Bil drivstoffestimat dokumentert korrekt — ingen fix |
| personlig L5 | personlig | 127 output-IDs uten null-guards (robusthet) |
| avgift L1 | avgift | ~120+ `.ir` div-onclick (Mønster #3) |
| avgift L2 | avgift | 4 hover-regler uten wrap (Mønster #4) |
| avgift L3 | avgift | `calcAdj` bruker rå `getElementById` |
| selskap L3 | selskap | Hover-wrap (Mønster #4) |

---

## Prioritert fix-rekkefølge

### Umiddelbart (dagens deploy)

1. **V10 C1 — Rollback NO elbil-fritak** (1 linje). **KRITISK — juridisk feilinformasjon.**
2. **V10 avgift H1 — Fjern 5 % ekstra AGA** i 10 lang-filer (1 rad × 10 = 10 strings). Opphevet fra 2025.

### Batch 3 — Mønster #1 systemisk 9-lang oppdatering

3. **skatt H1** — `searchDs` BSU/egenkapital/trygdeavgift i 9 lang (27 strings)
4. **skatt H3** — `searchDs` trinnskatt "4 trinn" → "5 trinn" (10 strings)
5. **selskap H1** — reg.gebyr ANS/DA 3 883 + KS 6 825 i 9 lang (36 strings)
6. **avgift H2** — AGA fribeløp 850 000 i 9 lang (9 strings)

**Total:** ~82 strings. Kan gjøres med ett Python-script eller koordinert batch-commit. Bruk samme mønster som `add_search_translations.py`.

### Batch 4 — Cross-cutting systemiske fikser

7. **Mønster #3 (én-linjes core.js refactor)** — `infoRowsHTML` div→`<a>`. Fikser ~300+ a11y-issues cross-page.
8. **Mønster #4 (én edit av style.css)** — Wrap alle 7 hover-regler i `@media(hover:hover)`.

### Batch 5 — Resterende Høy

9. **skatt H2** — Sjekkliste Q7/Q8 drift (HTML + lang + SJEKK_DATA). Krever grundig cross-check.
10. **boliglan H1** — § 4-4/§ 4-5 → § 5/§ 9 + fjern feil juridisk hjemmel for maks løpetid. 10 lang + 4 core.js + 1 HTML.
11. **kalkulator H1** — 13× `.cm-opt` div→button. Utvid `convert_a11y_batch2.py` eller manuelt.
12. **kalkulator H2** — Dekkes av batch 4 (Mønster #4).
13. **avgift H3** — Dekket av V10 C1 rollback (ikke propager feil).

### Batch 6 — Medium + Lav

14. Resterende 16 M + 22 L i sin tur.

---

## Bekreftet korrekt (samlet)

> [!success] Matematikk
> Alle calc-funksjoner (`calcSal`, `calcTrygdeavgift`, `calcFormue`, `calcReise`, `calcUttak`, `calcUtdeling`, `calcMor`, `calcDok`, `calcLvu`, `calcAga`, `calcAvs`, `calcFerie`, `calcNpv`, `calcRente`, `calcValgevinst`, `calcVat`, `calcAdj`, `calcLonn`, `calcBil`, `calcSpare`, `calcStudie`, `budsjettCalc`, `calcAbo`) er matematisk verifisert mot 2026-satser og offisielle formler.

> [!success] Kjerne-konstanter i core.js
> Personfradrag 114 540, minstefradrag 46 % / 95 700, trinnskatt 5 brackets, trygdeavgift 7.6 %/10.8 %/5.1 %, 1G 130 160, oppjustering 1.72, BSU 10 %/27 500/300 000/33 år, egenkapital 10 %, gjeldsgrad 5×, LTV 90 %/60 %, stresstest max(rate+3, 7 %), dokumentavgift 2.5 %, tinglysingsgebyr 545 kr, AS 30 000 / ASA 1 000 000, reg.gebyr AS 6 825, MVA 25/15/12/0 %, AGA soner 14.1/10.6/6.4/7.9/5.1/0 %, AGA fribeløp 850 000 (2026), Lånekassen basislån 15 169, frikort 100 000, saldogruppe c 24 %. Alle verifisert.

> [!success] A11y (etter batch 2)
> Alle 48 `.card-hdr` på alle 7 sider + 14 `.priv-back` på alle 7 sider er nå `<button type="button">` med riktig CSS-reset.

> [!success] Cache-bust konsistens
> `v=v26/v30/v9` konsistent på alle 7 sider.

> [!success] Event-wiring
> `btn-calc`-knapper, `toggleCard`-håndterere, `setRegion`-listeners, `hvtSearchRebuildChips`-hook — alle verifisert.

---

## Metodenotater

### v10 vs v9 — skill-workflow

**v9 (2026-04-11 morgen):** Sekvensiell sub-agent-dispatch — 6 agenter én om gangen, med kumulativ cross-reference. Total tid: ~63 min (420 tool uses, ~1.3M tokens).

**v10 (2026-04-11 ettermiddag):** Parallell sub-agent-dispatch via skill v3 — alle 6 agenter i ett enkelt message. Total tid: ~21 min (lengste enkelt-agent = wall-clock tid). ~1.3M tokens totalt.

**Speedup:** 3x (63 → 21 min).

**Trade-off:** v2s kumulative cross-reference er erstattet med:
1. **Mønster-katalog seeded på forhånd** — hver sub-agent fikk listen av 10 kjente systemiske bugs fra start og sjekket dem eksplisitt. Det gjenopprettet noe av v2s kumulative verdi uten å kreve sekvensiell kjøring.
2. **Cross-cutting post-pass** — denne seksjonen (konsolideringen) aggregerer treff på tvers av seksjonene.

**Læring:** Parallell workflow fungerer godt når Mønster-katalogen er moden. For første audit av en ny seksjon / ny kodebase vil sekvensiell fortsatt være bedre fordi det ikke finnes en eksisterende katalog å seede med.

### v10-baseline vs v9

Kontraintuitivt: antall åpne funn økte fra ~53 (post-V9 batch 2) til 49 H/M/L + 1 C = 50 i V10. Det skyldes:
1. **V10 oppdaget funn som V9 ikke fant** (skatt M1 no.js searchDs manglende, boliglan H1 feil § refs, avgift H1 5 % ekstra AGA opphevet, personlig L1 ABO_OLD fabrikkerte priser)
2. **V10 avdekket at V9 batch 1 bare delvis lukket Mønster #1** (92 stale strings i 9 lang-filer var ikke touched)
3. **V10 fant 1 kritisk regresjon fra V9 batch 1** (avgift C1)

Dette er **progress, ikke regresjon** — det viser at v10s mønster-katalog fanger opp systemiske bugs som tidligere audits missed.

### Nytt mønster foreslått til v11

**Mønster #11 — HTML-fallback stale selv når lang oppdateres.** HTML-default-verdier i `index.html`-filene brukes som fallback før applyLang kjører (FOUC) eller hvis den svikter. De oppdateres sjelden sammen med lang-filene. 4 V10-funn matcher dette mønsteret. Skal legges til Mønster-katalogen i audit-skill v4.

---

## Konsolidert kilde-tabell

| Kilde | URL | Dato | Verifiserer |
|---|---|---|---|
| Skatteetaten — MVA-håndboken M-6-8 | skatteetaten.no | 2026-04-11 | Elbil fritak § 6-8 |
| Revisorforeningen — Statsbudsjettet 2026 | revisorforeningen.no | 2026-04-11 | Elbil terskel 300 000 kr 2026 |
| NAF — Moms på elbil 2026 | naf.no | 2026-04-11 | Elbil 300k fra jan 2026 |
| VATupdate — Norway 2026 Budget | vatupdate.com | 2026-04-11 | Elbil cut + CO2 increase |
| Skatteetaten — AGA-satser | skatteetaten.no | 2026-04-11 | Sone-satser + fribeløp 850 000 |
| Skatteetaten — Ekstra AGA (UTGÅTT) | skatteetaten.no | 2026-04-11 | 5 % ekstra AGA avviklet 2025 |
| Skatteetaten — MVA-satser | skatteetaten.no | 2026-04-11 | 25/15/12/0 % |
| Brønnøysund — Gebyrer 2026 | brreg.no | 2026-04-11 | AS 6 825, ANS/DA 3 883, KS 6 825 |
| Lovdata — Utlånsforskriften (FOR-2020-12-09-2648) | lovdata.no | 2026-04-11 | § 5 stresstest, § 9 avdrag |
| Finanstilsynet — Boliglånsundersøkelsen 2025 | finanstilsynet.no | 2026-04-11 | Utlånsforskriften praksis |
| Skatteetaten — BSU | skatteetaten.no | 2026-04-11 | 10 %/27 500/300 000 |
| Kartverket — Tinglysingsgebyr | kartverket.no | 2026-04-11 | 545 kr |
| Lånekassen — Basislån 2025-26 | lanekassen.no | 2026-04-11 | 15 169 kr alle |
| NAV — Grunnbeløpet | nav.no | 2026-04-11 | 1G = 130 160 |
| Skatteetaten — Forskuddsutskrivingen 2026 | skatteetaten.no | 2026-04-11 | Personfradrag 114 540, trinn 2026 |
| Skatteetaten — Foreldrefradrag 2026 | skatteetaten.no | 2026-04-11 | 15 000/10 000 kr |
| Prop. 1 LS (2025-2026) | regjeringen.no | 2026-04-11 | Statsbudsjett 2026 |
| Stortingsvedtak 2025-12-18-2747 | lovdata.no | 2026-04-11 | Skattesatser 2026 |
| Forskrift om gebyr til Brønnøysund (FOR-2015-12-11-1668) | lovdata.no | 2026-04-11 | Siste endring 2025-12-16 |
| Ferieloven § 10 | lovdata.no | 2026-04-11 | Feriepenger 10.2 / 12 % |

---

## Relaterte noter

- [[hverdagsverktoy-audit-consolidated-v9]] — forrige baseline (70 funn → ~53 etter batch 1+2)
- [[hverdagsverktoy-audit-consolidated-v8]] — 26 funn lukket 100 %
- Delrapporter: [[hverdagsverktoy-skatt-audit]] · [[hverdagsverktoy-kalkulator-audit]] · [[hverdagsverktoy-boliglan-audit]] · [[hverdagsverktoy-personlig-audit]] · [[hverdagsverktoy-avgift-audit]] · [[hverdagsverktoy-selskap-audit]]
