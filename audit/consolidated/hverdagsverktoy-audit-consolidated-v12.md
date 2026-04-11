---
title: Hverdagsverktøy — Konsolidert Audit V12
date: 2026-04-11
tags: [hverdagsverktoy, audit, consolidated, v12, full-reaudit, parallell-workflow, skill-v4]
status: review
source: 6 parallelle sub-agent-rapporter (skatt/kalkulator/boliglan/personlig/avgift/selskap)
year: 2026
version: 12
baseline_commit: bba7fd9
parent_v: v11 (kun i Brain_HV)
---

# Konsolidert Audit V12 — hverdagsverktoy.com (2026-04-11 sen kveld)

Full re-audit etter dagens 3 commits (`a750990` Mønster #11 batch + `bba7fd9` H6 veibruksavgift). Kjørt via 6 parallelle sub-agenter (skill v4 dispatch — første audit etter scope-separasjon fra /research).

**Baseline:** post-commit `bba7fd9` (H6 veibruksavgift suspensjon-modeling)
**V11 baseline:** kun i Brain_HV (`wiki/bugs/2026-04-11_audit-konsolidert-v11.md`)
**Workflow:** Skill v4 parallell single-message dispatch, scope-separasjon /audit vs /research

> [!warning] V12 fanget regresjon fra dagens commit
> Mønster #11-fixen i `a750990` for boliglan er **PARTIELL**. HTML-fallback `boliglan/index.html:228` har riktig 7%-gulv-tekst, men JS-fallback `core.js:1519` har fortsatt feil "§ 5" + drifted formulering "+3 prosentpoeng høyere rente". Lang-overrides i 10 filer maskerer dette i prod, men drifts-risikoen er reell. Se H1 boliglan.

## Sammendrag per seksjon

| Seksjon | Åpne (H/M/L) | Totalt | Endring vs V11 | Delrapport |
|---|---|---|---|---|
| **skatt** | 3 / 5 / 5 | **13** + 7 /research | +1H, +1M | `audit/raw/hverdagsverktoy-skatt-audit.md` |
| **kalkulator** | 1 / 5 / 4 | **10** + 1 /research bundle | +1M, +2L | `audit/raw/hverdagsverktoy-kalkulator-audit.md` |
| **boliglan** | 1 / 6 / 6 | **13** | +1H (regresjon), +3M, +3L | `audit/raw/hverdagsverktoy-boliglan-audit.md` |
| **personlig** | 2 / 11 / 7 | **20** + 1 /research | +1H (lonn-frikort), +8M, +6L | `audit/raw/hverdagsverktoy-personlig-audit.md` |
| **avgift** | 3 / 5 / 4 | **12** | +3H, +1M, +1L (V11 #11 LUKKET) | `audit/raw/hverdagsverktoy-avgift-audit.md` |
| **selskap** | 0 / 1 / 3 | **4** + 3 /research | +1M, +3L (V11 div-onclick LUKKET) | `audit/raw/hverdagsverktoy-selskap-audit.md` |
| **TOTALT** | **10 / 33 / 29** | **72** + 11 /research | **+50%** vs V11 (~48) | — |

> [!info] Hvorfor økning fra ~48 → 72 åpne funn?
> V12 var dypere enn V11. Sub-agenter brukte runtime-instrumentation mer aggressivt: bil-r-total dobbelt-teller VERIFISERT med eksakte tall (1 044 650 vs 744 650), autoRecalc leak VERIFISERT med iframe-isolert event-listener-måling (lineær vekst 1→5 per updateAll), sjekkliste H1 VERIFISERT (hjemmekontor gir 0 kr besparelse i stedet for ~484). Mange L-tier defensive null-check-funn ble katalogisert som ikke fantes i V11.

## V11 åpne funn — status (12 funn)

| V11 ID | Beskrivelse | V12 status |
|---|---|---|
| Skatt H Sjekkliste Q/C drift | 3-lags HTML/lang/SJEKK_DATA mismatch | **ÅPEN — VERRE enn V11** (runtime: 0 kr besparelse) |
| Boliglan H §-referanser | 22 steder Utlånsforskriften feil | **ÅPEN — /research blocked** |
| Personlig H bil-r-total dobbelt-teller | core.js:3539 (linjenr driftet etter H6) | **ÅPEN — runtime verifisert med eksakte tall** |
| Personlig H6 veibruksavgift | Stortingsvedtak 486/2026 | **LUKKET** (`bba7fd9` verifisert) |
| Kalkulator H autoRecalc leak | event-listener leak i updateAll | **ÅPEN — empirisk verifisert** lineær vekst |
| Skatt M formue-res i RECALC_MAP | calcFormue ikke dekket | **ÅPEN — promoveres til H i V12** |
| Skatt M calcUttak null-checks | 10 DOM-elementer | **ÅPEN — utvidet til 17 DOM-gets** |
| Skatt M Næring-hobby EN-fallback | 8 språk faller på _nhEn | **ÅPEN** |
| Boliglan M mor-stress-note Mønster #11 | HTML-fallback stale | **DELVIS LUKKET** (`a750990`) — JS-fallback drifter fortsatt → ny H1 |
| Avgift M2 hardkodede labels Mønster #11 | 10 strings engelsk | **LUKKET** (`a750990`, alle 10/10 norske) |
| Personlig M lonn dead frikortgrense | core.js:5006 | **ÅPEN** |
| Personlig M studielan dead mndEtterSkatt | core.js:5353 | **ÅPEN** |
| Kalkulator M calcLvu urettferdig | + dead code divTax/divNet | **ÅPEN — verifisert** |
| Kalkulator M 6 calc null-checks | calcLvu/Valgevinst/Ferie/Pensjon/Rente/Aga | **ÅPEN — utvidet til 7 (+fcCalc)** |
| Kalkulator M calcNpv pay cf=0 | edge case | **ÅPEN** (minor) |
| Boliglan M so/ti morReqRows duplikat | 3 rader fra morCostRows | **ÅPEN** |
| Boliglan M morCsv hardkodet norsk | + locale 'no-NO' | **ÅPEN** |
| Boliglan M5/M6 30-år/stresstest UI | V8 carry | **M5 ÅPEN, M6 LUKKET** (stresstest finnes, erstattes av M4) |
| Avgift L calcAdj manglende clamp | aarBrukt/gammelAndel/nyAndel | **ÅPEN — ESKALERT L→H** (200% input gir absurde resultater) |
| Avgift L MVA auto-recalc | manglende på inputs | **ÅPEN** |
| Selskap L 21× div-onclick a11y | V8 attempted+reverted | **LUKKET** (V10 commit `4b26e41` + Mønster #3 — runtime 55/55 keyboard-accessible) |
| Selskap info Stiftelsesloven § 14(2) | 200 000 kr næringsdrivende | **ÅPEN — /research-blocked (R2)** |

---

## H-TIER ÅPNE FUNN (10)

### H1 Skatt — Sjekkliste 3-lags drift (V11 carry, runtime verifisert)
**Fil:** `shared/core.js:1292`, `skatt/index.html:204-210`, `shared/core.js:2969-2978`

3 ortogonale bugs fra samme rot:
1. **DOM/lang mapping-drift:** HTML har 8 q-spans (`sjekk-q1..q8`), lang har 9 keys (`sjekkQ1..sjekkQ9`). applyLang-loop itererer 1..8 → `sjekkQ9='Leier du ut bolig'` rendres ALDRI.
2. **Tips-index-skew i SJEKK_DATA:** `SJEKK_DATA[6]={type:'info', fradrag:0}` (originally for aksjer). Etter applyLang viser `sjekk-q7` "Jobber du hjemmefra". Bruker som krysser av hjemmekontor får 0 kr i stedet for ~484 kr (2 200 kr × 0.22).
3. **Label/fradrag-mismatch på c8:** semantisk gale rader mot labels.

**Runtime-verifisert:**
```json
{ "q7 DOM": "Jobber du hjemmefra?", "SJEKK_DATA[6]": {type:'info', fradrag:0},
  "lang_q9": "Leier du ut bolig?", "sjekk-q9 i DOM": false }
```

**Fix:** Atomic — utvid HTML til 9 checkboxes, utvid SJEKK_DATA til 9 entries (c7=hjemmekontor 2200 fradrag, c8=aksjer info, c9=utleie info), utvid applyLang-loop til `qi<=9`. Verifiser sjekkTips array-rekkefølge i alle 10 lang-filer.

### H2 Skatt — `_RESULT_RECALC_MAP` mangler `formue-res` (V11 M → V12 H)
**Fil:** `shared/core.js:308-331`

`reise-res:'calcReise'` finnes (linje 320), men `'formue-res':'calcFormue'` mangler. Bruker som har formue-resultat synlig + bytter språk får mixed-language UI.

**Fix:** Legg til `'formue-res':'calcFormue'` i map. 1-linje. Promovert H fordi bruker-synlig.

### H3 Skatt — sjekk-c9 mangler fra DOM
**Fil:** `skatt/index.html:180-212`

HTML har bare 8 checkboxes (c1-c8) men lang har 9 spørsmål. "Leier du ut bolig" (`sjekkQ9`) er helt skjult fra UI. Dekningsbug — skatteyter som leier ut bolig får aldri spørsmålet. Adresseres samme commit som H1.

### H4 Kalkulator — autoRecalc event-listener leak (V11 H, EMPIRISK VERIFISERT)
**Fil:** `shared/core.js:654-697`

Funksjonen `autoRecalc(selId, resId, calcFn)` er definert INNE i `updateAll()` og kalles 20+ ganger per kjøring. Hver `change`-listener registreres uten `removeEventListener` først.

**Empirisk bevis (preview_eval iframe):**

| updateAll-kall | lvu-zone | aga-zone | aga-ferie | aga-otp | avs-group | ferie-type | pensjon-otp | valgevinst-currency |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |

Lineær vekst — etter 10 språkbytter har hver select 10 stacked listeners, hver change-event fyrer calc 10×.

**Fix:** Idempotent binding via `el.__hvtRecalcBound`-flag eller flytt `autoRecalc` ut av `updateAll` og kall fra `initPage` én gang.

### H5 Boliglan — Mønster #11 fix `a750990` PARTIELL (NY V12, regresjon-flagg)
**Fil:** `boliglan/index.html:228`, `shared/core.js:1519`

Dagens commit `a750990` oppdaterte HTML-fallbacken til "høyeste av 7 % og rente + 3 prosentpoeng" (riktig), men:
1. **HTML-fallback** har fortsatt feil `§ 5`-referanse
2. **JS-fallback `core.js:1519`** ble IKKE oppdatert i det hele tatt:
   ```js
   setText('mor-stress-note', r.morStressNote || 'Utlånsforskriften § 5: banken må sjekke at du tåler +3 prosentpoeng høyere rente.');
   ```
3. **Tre formuleringer drifter:** lang-filer har "§ 4-4 + ...høyeste av 7 %", HTML-fallback har "§ 5 + ...høyeste av 7 %", JS-fallback har "§ 5 + ...3 prosentpoeng høyere rente"

Normale brukere får riktig tekst (lang-override), men ved lang-load-feil ser de feil §-ref. Drifts-risikoen er reell.

**§-nummer er fortsatt /research-blocked** — ikke fix paragraf-referansen før /research er klar. Når research klart: oppdater linje 228 + 1519 SAMTIDIG.

### H6 Personlig — `bil-r-total` dobbelt-teller verditap (V11 H, runtime verifisert)
**Fil:** `shared/core.js:3539` (driftet fra :3516 etter H6 kommentar-tillegg)

```js
var totalKostnad = verditap + drivTotal + forsTotal + serviceTotal + dekkTotal + avgiftTotal + bomTotal;
document.getElementById('bil-r-total').textContent = fmt(totalKostnad + pris);
```

`verditap = pris - restverdi` allerede. `totalKostnad + pris = 2·pris - restverdi + drift`.

**Runtime-verifisert** (pris=500 000, resale=200 000, aar=5, km=12 000, bensin):

| Felt | Verdi |
|---|---:|
| verditap | 300 000 |
| totalKostnad (sum) | 544 650 |
| **bil-r-total VIST** | **1 044 650 kr** |
| **Forventet** | **744 650 kr** (pris + drift) |

Bug: 300 000 kr for høyt. Synlig i resultatgridets bunnfelt.

**Fix:** En linje:
```js
var drift = drivTotal + forsTotal + serviceTotal + dekkTotal + avgiftTotal + bomTotal;
document.getElementById('bil-r-total').textContent = fmt(pris + drift);
```

### H7 Personlig — `calcLonn` frikort-verdict mismatch ved 100 000 kr (NY V12)
**Fil:** `shared/core.js:5057-5064`

Bruker med brutto = 100 000 kr (eksakt målgruppen — VGS/student deltidsjobb) får verdict "Lav skattesats" i stedet for "Under frikortgrensen" fordi:
- Trygd-opptrapping fra 99 650 → 100 000 = 88 kr → `totalSkatt > 0`
- `effSats < 15 %` → fyrer `lonnVerdictLav` ("typisk for deltidsjobb")
- Forventet: `lonnVerdictFrikort`

Terskelen ligger på 99 650 (trygd) i stedet for 100 000 (frikort). Kombineres naturlig med fix av V11 dead code `frikortgrense=100000`.

### H8 Avgift — `_RESULT_RECALC_MAP['vat-res']` skal være `'v-res'` (NY V12)
**Fil:** `shared/core.js:323`

```js
var _RESULT_RECALC_MAP = {
  ...
  'vat-res':'calcVat',   // ← skal være 'v-res'
};
```

HTML-elementet er `<div id="v-res">` (`avgift/index.html:221`). `hvtRebuildVisibleResults` itererer map-nøkler og treffer aldri `v-res`. Map mangler også `'adj-res':'calcAdj'`.

**Effekt:** Språkbytte med MVA-resultat synlig → ikke rekalkulert → setEl-verdier fra forrige kjøring (linje 3606-3614) som bruker `rr.vatRInclCalc + rr.vatRInputTag` blir mixed-language.

**Fix:** 8-tegns endring `'vat-res'` → `'v-res'` + legg til `'adj-res':'calcAdj'`.

### H9 Avgift — calcAdj mangler clamp på input (V11 L → V12 H, eskalert)
**Fil:** `shared/core.js:3638-3640`

```js
const aarBrukt = parseInt(document.getElementById('adj-years').value) || 0;
const gammelAndel = (parseNum('adj-old') || 0) / 100;
const nyAndel = (parseNum('adj-new') || 0) / 100;
```

**Repro:** "Gammel andel" = 200, "Ny andel" = -50 → `endring = -2.5` → `justering = arligBeloep × -2.5 × gjenstaende` → absurd negativ tilbakebetaling uten advarsel.

**Fix:** Clamp til [0, periode] og [0, 1].

### H10 Avgift — Null-check drift i updateAll VAT-blokk (NY V12)
**Fil:** `shared/core.js:1931-2089` (8+ steder)

```js
vr.innerHTML = (r.vatRates||[]).map(...);  // 1933 — vr kan være null
vatLawGroup.classList.remove('hidden');     // 1974
document.getElementById('vat-aga-title').innerHTML = ...;  // 2086
```

En manglende DOM-node bryter hele `updateAll()`-kjeden → påfølgende seksjoner får ikke oppdatert språk. Samme klasse som autoRecalc-leak — defensive guards mangler systematisk.

---

## M-TIER ÅPNE FUNN (33)

### Skatt (5 M)
- **M1** — calcUttak + calcFormue 17 DOM-gets uten null-checks (`core.js:3728-3755, 3095-3102, 3124-3125`)
- **M2** — Næring-hobby 8 lang EN-fallback (kun no.js+en.js har `nhBodyHTML`)
- **M3** — utdeling ENK skjerming-label semantikk
- **M4** — utdeling minstefradrag-gap
- **M5** — calcUttak null-refs (10 DOM-elementer)

### Kalkulator (5 M)
- **K12-M1** — calcLvu urettferdig sammenligning + dead code `divTax`/`divNet` (`core.js:4122-4138`)
- **K12-M2** — 7 calc-funksjoner mangler null-checks (calcLvu/Aga/Ferie/Rente/Valgevinst/Pensjon/fcCalc)
- **K12-M3** — calcNpv pay cf=0 edge case (`core.js:3555-3560`)
- **K12-M4** — NY: CSV-eksport hardkodet norsk + locale `'no-NO'` (`core.js:5807-5831`, likvidCsv/avsCsv/morCsv)
- **K12-M5** — NY: G=130160 DRY-brudd 4 steder (`core.js:3017, 4147, 4283, 4387`)

### Boliglan (6 M)
- **B12-M1** — so.js/ti.js morReqRows duplikat 3 rader fra morCostRows
- **B12-M2** — NY: morCsv ignorerer avdragsfri-periode (CSV matcher ikke UI)
- **B12-M3** — morCsv hardkodet norsk + locale (`core.js:5834-5862`)
- **B12-M4** — ESKALERT L→M: Stresstest ignorerer avdragsfri (`core.js:2952-2960`). Runtime: `m-stress-mth=24 157` IDENTISK med/uten IO=5
- **B12-M5** — Maks 30 år: kun statisk disclaimer, ingen flash ved clamp
- **B12-M6** — ESKALERT L→M: Enter-handler mangler på 5 inputs (m-a, m-r, m-y, m-io-yrs, m-fees)

### Personlig (11 M)
- **P12-M1** — NY: studie-r-mnd "kr kr" double suffix (`core.js:5339`)
- **P12-M2** — Duplisert id `lonn-frikort-hint`/`lonn-frikort-note` (`personlig/index.html:680`, V10 carry ×3)
- **P12-M3** — NY: spare-r-effektiv villedende — viser 11,137 % når reell er 0,583 % (CAGR over startkapital + innskudd)
- **P12-M4** — NY: calcSpare godtar negativ years stilltiende
- **P12-M5** — NY: calcBilkostnad silent clamping km/aar
- **P12-M6** — NY: calcBilkostnad pris<=0 silent no-op
- **P12-M7** — NY: null-check gap i alle calc-funksjoner
- **P12-M8** — NY: 13 i18n-keys mangler i ALLE 10 lang-filer + `Belop`-typo (`budsjettColDescI/AmountI/DescE/AmountE`, `budDefault*`, `budOpt*`, `aboPriceChange*`)
- **P12-M9** — calcLonn dead `frikortgrense` (`core.js:5006`)
- **P12-M10** — calcStudielan dead `mndEtterSkatt` (`core.js:5353`)
- **P12-M11** — V8 M9 carry: små lang-filer mangler 13-21 keys

### Avgift (5 M)
- **A12-M1** — 2× div-onclick a11y (`vat-law-group` L169, Justering-toggle L283)
- **A12-M2** — NY: calcAdj tidlig return uten å skjule stale `adj-res`
- **A12-M3** — NY: updateAll engelske JS-fallbacks (`core.js:1921-1928`, 8 strings)
- **A12-M4** — Manglende autoRecalcInput på `v-a`, `adj-mva`, `adj-years`, `adj-old`, `adj-new`
- **A12-M5** — NY: Typo "gjenståend" i HTML-fallback `avgift/index.html:272`

### Selskap (1 M)
- **S12-M1** — NY: search.js mangler `selskap-andre-card` (ASA/NUF/SA/stiftelse usynlig for global søk)

---

## L-TIER ÅPNE FUNN (29) — Sammendrag

| Seksjon | Antall | Hovedtemaer |
|---|---:|---|
| Skatt | 5 | HTML engelske defaults, formue ektefelle, primærbolig label, kl dead, reise-dager 230 |
| Kalkulator | 4 | mobile-sidebar-backdrop, calcLvu uten fortegn, calcFerie over60 auto-recalc, switchCalc race |
| Boliglan | 6 | "5,1 % flytende" statisk, `_mor.tot` navn, m-io-yrs max=30, calcMor null-checks, button type, kort-titler drift |
| Personlig | 7 | aria-live, hardkodede aria-labels, bil intro motsier H6, studie-r-stipend "(40 %)", "0"-override |
| Avgift | 4 | navne-drift vat-aga, calcVat silent s=0, arrow hardkodet, scope-notat |
| Selskap | 3 | cmp-table caption/scope, sel. § 1-2 format, ansatte-30+ nyanser |

Full liste i delrapportene.

---

## CROSS-CUTTING MØNSTER-TREFF (post-pass)

Aggregert fra alle 6 sub-agent-rapporter etter at delrapportene var skrevet:

| # | Mønster | Treff i V12 | Hovedeksempler |
|---|---|---:|---|
| #1 | Stale satser core.js vs lang | 0 | Alle delegert til /research per skill v4 |
| #2 | A11y div→button-gap | 3 | Kalkulator L1 (mobile-sidebar-backdrop), Avgift M1 (vat-law-group, Justering-toggle) |
| #3 | infoRowsHTML div-onclick | 0 (LUKKET) | V11 commit `4b26e41` holder — verifisert 55/55 i selskap, 35 i skatt |
| #4 | Hover-regler uten @media(hover:hover) | 0 | Alle transform/box-shadow hover wrapped |
| #5 | Matte-regresjoner fra fix-commits | **3** | Personlig H1 (bil-r-total), Avgift H2 (calcAdj clamp), Skatt H1 (sjekkliste data-rad-rekkefølge) |
| #6 | Hardkodede norsk uten applyLang | **2** | Kalkulator K12-M4 (CSV-eksport), Avgift M5 (typo "gjenståend") |
| #7 | UI-hint vs kode-konstanter drift | **1** | Personlig L3 (bil intro-tekst motsier H6 fix-kommentaren) |
| #8 | repopulateSelectByIndex silent overwrite | 0 | Ikke aktivt i scope |
| #9 | Datastruktur-refaktor uten grep | 0 | Ingen state-lekkasje |
| #10 | Fabrikkerte konstanter | **8 bundles** | Skatt R1-R7 (7 satser), Kalkulator R1 bundle (G/AGA/ferie/OTP) |
| #11 | HTML/JS fallback drift | **8** | Boliglan H5 (a750990 partial!), Personlig L2/L3/M2/M8, Avgift M3/M5, Skatt L1 |

### Nye systemiske patterns oppdaget i V12

#### Pattern A — `_RESULT_RECALC_MAP` typo/missing entries
**Treff:** Skatt H2 (`formue-res` mangler), Avgift H8 (`vat-res` skal være `v-res`, `adj-res` mangler)

Samme klasse som V11 E-fix for focus-mode (commit `e717220`). Sub-agent-bemerkning: hver gang nye calc-funksjoner legges til må RECALC_MAP oppdateres. Forslag: skript som validerer at hver `id="*-res"` i HTML har et tilsvarende key i map.

#### Pattern B — Null-check epidemi (40+ DOM-gets på tvers)
**Treff:** Skatt M1 (17), Kalkulator K12-M2 (7 funksjoner), Boliglan B12-L4 (3), Personlig M7, Avgift A12-H3 (8+ i updateAll)

Cross-cutting fix: helper-funksjoner `getVal(id, fallback)`, `getChk(id)`, `setEl(id, txt)` som null-safe wraps. Refactor alle `document.getElementById(...)` til disse.

#### Pattern C — Dead code fra refactor-drift
**Treff:** Personlig M9 (`frikortgrense=100000`), Personlig M10 (`mndEtterSkatt`), Kalkulator K12-M1 (`divTax`/`divNet`)

Variabler beregnes men brukes aldri. Indikerer at refactor-passes har glemt å rydde. Lint-regel `no-unused-vars` ville fanget dette.

---

## /RESEARCH-FLAGG (scope-separasjon v4)

Følgende krever ekstern primærkilde-verifikasjon før eventuell fix:

| ID | Sats/regel | Filer | Kontekst |
|---|---|---|---|
| **R-skatt-1** | Minstefradrag-tak 95 700 kr 2026 | `core.js:2762` | Skatteetaten satser |
| **R-skatt-2** | Personfradrag 114 540 kr 2026 | `core.js:2761, 3851` | Skatteetaten satser |
| **R-skatt-3** | Trinnskatt 5-trinns innslagspunkter + satser 2026 | `core.js:2773-2779` | Stortingsvedtak skatt 2026 |
| **R-skatt-4** | Formue bunnfradrag 1 900 000 + trinn 2 21 500 000 | `core.js:3081` | Skatteetaten formue |
| **R-skatt-5** | Reisefradrag 1,90 kr/km | `core.js:3136` | Skatteetaten reisefradrag |
| **R-skatt-6** | Fagforeningstak 8 700 | `core.js:2765` | Skatteetaten fradrag |
| **R-skatt-7** | BSU-tak 27 500 + grense 33 år | `core.js:2769` | Skatteetaten BSU |
| **R-kalk-1** | G=130160 + AGA-soner + 22% SS + 1.72 + OTP 2% + ferie 10.2/12% | `core.js` flere | NAV/Skatteetaten/innskuddspensjonsloven |
| **R-bol-1** | **Utlånsforskriften § 4-4/§ 4-5 vs § 5/§ 9 (V11/V10 carry)** | 22 steder | Lovdata Utlånsforskriften — KRITISK |
| **R-pers-1** | ABO_OLD priskatalog Viaplay 149→799 | `core.js:5466-5471` | Viaplay pressemeldinger |
| **R-sel-1** | Aksjeloven § 6-2 DL-krav etter 2020-lovendring (3 mill-terskel?) | `lang/no.js:757` | Lovdata aksjeloven LOV-2019-12-20-88 |
| **R-sel-2** | Stiftelsesloven § 14 grunnkapital 100k vs 200k (V11 carry) | 10 lang-filer L715 | Lovdata stiftelsesloven |
| **R-sel-3** | asl. § 13-3 og § 13-14 fusjon-kreditorvarsel | `lang/no.js:779` | Lovdata aksjeloven kap. 13 |
| **R-avgift** | MVA-satser 25/15/12/0%, kapitalvarer 50k/100k, justeringsperiode 10/5 år | `lang/no.js`, `core.js:3626-3704` | Mval. § 5-1 til 5-11, § 9-1, § 9-5 |

**14 /research-flagg totalt.** Boliglan R-bol-1 er HØYESTE prioritet (blokkerer H5 fix).

---

## V11 VERIFISERTE LUKKEDE FUNN

| Funn | Lukket av | Verifikasjon |
|---|---|---|
| Personlig H6 veibruksavgift | `bba7fd9` | Runtime: drivTotal=99 750 kr matcher 0.07×23.75×60000 |
| Avgift M2 hardkodede labels (Mønster #11) | `a750990` | 10/10 strings norske, fetch-verifisert |
| Selskap L 21× div-onclick a11y | `4b26e41` (V11 Mønster #3) | Runtime: 55/55 keyboard-accessible |
| Boliglan M6 stresstest UI | erstattes av M4 | Stresstest finnes (`core.js:2952-2960`), men ignorerer IO |
| Kalkulator L calcFerie divisor 220 | aldri eksisterte | Nåværende kode deler på 20/25 (vacationDays) |
| Skatt L jan 2026-dato (V8 carry) | scope-out | Ikke i skatt-scope |
| Boliglan jan 2026-dato (V8 carry) | scope-out | Ikke funnet i boliglan-scope |

---

## ANBEFALT FIX-REKKEFØLGE V12 → V13

### Fase 1 — Quick wins (LUKKET — commit `a1c9cc9`)
1. ✅ **H6 Personlig bil-r-total** — `core.js:3544` (runtime: 919 562 → 744 650 kr)
2. ✅ **H2 Skatt formue-res RECALC_MAP** — `core.js:321`
3. ✅ **H8 Avgift `'vat-res'`→`'v-res'` + `'adj-res':'calcAdj'`** — `core.js:323-324`
4. ✅ **P12-M1 studie-r-mnd "kr kr"** — `core.js:5344`
5. ✅ **P12-M2 duplisert id linje 680** — `personlig/index.html:680`
6. ✅ **A12-M5 typo "gjenståend"** — `avgift/index.html:272`
7. ✅ **P12-M4 calcSpare negativ years clamp** — `core.js:5112`

### Fase 2 — Mellomstore (LUKKET — commit `a1395d9`)
8. ✅ **H7 Personlig calcLonn frikort-verdict** — `core.js:5063`, bruker dead `frikortgrense`
9. ✅ **H9 Avgift calcAdj clamp** — `core.js:3643-3645`
10. ✅ **B12-M4 boliglan stresstest IO-aware** — `core.js:2954-2972` (24 157→26 035 for IO=5)
11. ✅ **H1+H3 Skatt sjekkliste atomic** — HTML+SJEKK_DATA+applyLang loop til 9, hjemmekontor 484 kr
12. ✅ **B12-M6 Enter-handler boliglan** — `_initPageReady`, 5 inputs
13. ✅ **BONUS sjekk-total kr kr** — `core.js:3009`, samme klasse som P12-M1

### Fase 3 — Strukturelle fixes (1-3 timer)
13. **H4 autoRecalc leak fix** — idempotent binding via `__hvtRecalcBound`-flag
14. **Pattern B null-check helpers** — `getVal/getChk/setEl` + refactor av 7 calc-funksjoner i kalkulator + skatt + personlig + avgift
15. **H10 Avgift updateAll null-check sweep** — guard alle 8+ DOM-access
16. **P12-M8 13 i18n-keys** — Python-script som legger til keys i alle 10 lang-filer
17. **K12-M5 G=130160 DRY** — sentral konstant

### Fase 4 — /research-blokkerte
18. **R-bol-1 Utlånsforskriften** — kjør /research, så fix H5 boliglan + 22 steder
19. **R-skatt-1..7** — kjør /research, så verifiser/oppdater 7 satser
20. **R-sel-1..3** — kjør /research, så fix selskap-tekster

### Fase 5 — Cleanup batch
21. M-tier rest (so/ti morReqRows duplikat, morCsv i18n, dead code)
22. L-tier batch (20+ funn, mest hygiene)

**Estimert total fix-tid V12 → V13:** 15-20 timer.

---

## METODENOTATER V12

**Skill:** v4 (scope-separasjon — første audit etter v3 → v4)
**Workflow:** Parallell single-message dispatch (6 sub-agenter samtidig)
**Tid:** ~15-20 min wall-clock (lengste enkelt-agent: personlig 19m 38s)
**Token-forbruk:** ~1.2M på tvers av 6 sub-agenter
**Tool-kall total:** 459 (skatt 80, kalk 89, bol 57, personlig 106, avgift 72, sel 55)
**Beste sub-agent:** personlig (runtime-verifiserte 3 av sine egne H/M-funn med eksakte tall)
**Cleanest:** selskap (4 funn, V11 CLEANEST-status holder)
**Mest funn:** personlig (20 funn — 2H + 11M + 7L)
**Største regresjon-fanget:** H5 boliglan (a750990 partial fix)

### Scope-separasjon v4 i praksis

V12 var første audit etter v3 → v4-overgangen. Sub-agentene fulgte instruksjonen om å IKKE verifisere satser mot eksterne kilder — i stedet flagget de 14 /research-funn for handoff. Dette ga:

**Fordeler:**
- Ingen risiko for å sitere stale 2023-kilder (V10 C1-typen unngås)
- Klarere ansvarsfordeling: /audit ser kode, /research ser fakta
- Færre URL-fetches → raskere sub-agent-tid

**Nye utfordringer:**
- Antallet "needs research"-flagg vokser (14 i V12 vs 0 eksplisitt i V10/V11)
- Krever disiplinert handoff til /research før commit

**V12-eksempel:** Boliglan §-referanser ble korrekt holdt blokkert i 12. iterasjon — ikke fix-forsøk uten /research-klarsignal. Sub-agent gjenskapte tillit til scope-separasjonen.

---

## RELATERTE NOTER

- [[hverdagsverktoy-audit-consolidated-v10]] — V10 baseline
- V11 (kun i Brain_HV): `wiki/bugs/2026-04-11_audit-konsolidert-v11.md`
- [[../../research/2026-04-11_research_veibruksavgift-suspensjon|Research veibruksavgift]] — H6 verifikasjon
- [[../../research/2026-04-11_research_v10-moenster1-batch3|Research V10 Mønster #1 batch 3]]
- Aktiv todo: `wiki/notater/2026-04-11_aktiv-todo-v11.md` (oppdateres etter V12)
- Delrapporter: `audit/raw/hverdagsverktoy-{skatt,kalkulator,boliglan,personlig,avgift,selskap}-audit.md`

---

## DAGENS COMMITS (post-V11, pre-V12)

| Commit | Beskrivelse | V12 status |
|---|---|---|
| `e717220` | Fix focus-mode språk-re-render | ✅ Verifisert (V11), scroll-leak fanget+fikset i V11 |
| `8646678` | V10 Mønster #2 + #4 (cm-opt + hover) | ✅ Verifisert (V11) |
| `de4046e` | V10 Mønster #1 batch 3 (82 strings + KS) | ✅ Verifisert (V11) |
| `ed33c62` | V11 5 H-tier fix | ✅ Verifisert |
| `4b26e41` | V11 Mønster #3 infoRowsHTML refactor | ✅ Verifisert (selskap 55/55, skatt 35) |
| **`a750990`** | **V11 Mønster #11 batch (boliglan + avgift)** | **⚠️ DELVIS — boliglan JS-fallback drifter (H5)** |
| **`bba7fd9`** | **V8/V11 H6 veibruksavgift suspensjon** | **✅ Verifisert (drivTotal matcher math)** |
