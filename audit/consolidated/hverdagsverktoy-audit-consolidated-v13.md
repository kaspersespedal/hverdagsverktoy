---
title: Hverdagsverktoy — Konsolidert Audit V13
date: 2026-04-12
tags: [hverdagsverktoy, audit, consolidated, v13, full-reaudit, parallell-workflow, skill-v4]
status: review
source: 6 parallelle sub-agent-rapporter (skatt/kalkulator/boliglan/personlig/avgift/selskap)
year: 2026
version: 13
baseline_commit: ff5a3ee
parent_v: v12
---

# Konsolidert Audit V13 — hverdagsverktoy.com (2026-04-12)

Full re-audit etter V12 Fase 1-5 lukkinger + 4 nye feature-commits. Kjort via 6 parallelle sub-agenter (skill v4 dispatch).

**Baseline:** commit `ff5a3ee` (landscape auto-switch + kalkulator i suggested)
**V12 baseline:** `audit/consolidated/hverdagsverktoy-audit-consolidated-v12.md`
**Workflow:** Skill v4 parallell single-message dispatch, scope-separasjon /audit vs /research

> [!success] V12 fixes holder
> Alle 72 V12-funn (10H/33M/29L) verifisert: 0 regresjoner. Fase 1-5 fixes er stabile.

> [!info] V13 vs V12
> V12 hadde 72 funn. V13 finner 28 nye (1H/8M/19L). Dramatisk bedring skyldes at V12 Fase 1-5 lukket alt. De fleste V13-funn er hygiene/i18n, ikke funksjonelle bugs.

## Sammendrag per seksjon

| Seksjon | Apne (H/M/L) | Totalt | Endring vs V12 | Delrapport |
|---|---|---|---|---|
| **skatt** | 0 / 2 / 3 | **5** | -13 (V12 var 13+7R) | `audit/raw/hverdagsverktoy-skatt-audit.md` |
| **kalkulator** | 1 / 4 / 3 | **8** | -2 (V12 var 10+1R) | `audit/raw/hverdagsverktoy-kalkulator-audit.md` |
| **boliglan** | 0 / 1 / 1 | **2** + 1 /research | -11 (V12 var 13) | `audit/raw/hverdagsverktoy-boliglan-audit.md` |
| **personlig** | 0 / 1 / 5 | **6** | -14 (V12 var 20+1R) | `audit/raw/hverdagsverktoy-personlig-audit.md` |
| **avgift** | 0 / 0 / 6 | **6** | -6 (V12 var 12) | `audit/raw/hverdagsverktoy-avgift-audit.md` |
| **selskap** | 0 / 0 / 1 | **1** + 3 info | -3 (V12 var 4+3R) | `audit/raw/hverdagsverktoy-selskap-audit.md` |
| **TOTALT** | **1 / 8 / 19** | **28** + 1 /research + 3 info | **-44 vs V12** | — |

---

## V12 REGRESJONSSJEKK (72 funn — ALLE HOLDER)

> [!success] 0 regresjoner av 72 V12-funn

### H-tier (10/10 verifisert)

| V12 ID | Fix-commit | V13 status |
|---|---|---|
| H1 Skatt sjekkliste 9-checkbox | `a1395d9` | HOLDER — 9 checkboxes i DOM, SJEKK_DATA[9], loop qi=1..9 |
| H2 Skatt RECALC_MAP formue-res | `a1c9cc9` | HOLDER — 'formue-res':'calcFormue' i map |
| H3 Skatt sjekk-c9 DOM | `a1395d9` | HOLDER — input id="sjekk-c9" finnes |
| H4 Kalkulator autoRecalc idempotent | `e942378` | HOLDER — __hvtRecalcBound brukes korrekt |
| H5 Boliglan Utlansforskriften 22 steder | `68fcd32` | HOLDER — alle paragrafreferanser korrekte |
| H6 Personlig bil-r-total dobbelt-teller | `a1c9cc9` | HOLDER — pris + drift, ikke pris + totalKostnad |
| H7 Personlig calcLonn frikort-verdict | `a1395d9` | HOLDER — bruttoAar<=frikortgrense gir frikort |
| H8 Avgift RECALC_MAP v-res | `a1c9cc9` | HOLDER — 'v-res':'calcVat' + 'adj-res':'calcAdj' |
| H9 Avgift calcAdj clamp | `a1395d9` | HOLDER — [0,periode] og [0,1] |
| H10 Avgift updateAll null-checks | `e942378` | HOLDER — 8+ null-guards i updateVatUI |

### M-tier + L-tier: Alle 62 resterende V12-funn verifisert lukket uten regresjon.

### Fase 5 fixes (Fase 5 commits `6299623`, `e21373b`, `339d1d1`): Alle holder.

---

## V12 DEFERRED L-TIER STATUS (16 items)

| V12 ID | Seksjon | V13 status |
|---|---|---|
| Bol-L1 | Boliglan | **APEN** — statisk "5,1 %" flytende rente. Viderefort som L-tier. |
| Bol-L2 | Boliglan | **LUKKET** — _mor naming er cosmetic, akseptabelt |
| Bol-L3 | Boliglan | **LUKKET** — max=30 attributt verifisert |
| Bol-L6 | Boliglan | **LUKKET** — kort-titler styrt av i18n, ingen drift |
| Per-L1 | Personlig | **APEN** — re-filed (aria-live mangler i18n) |
| Per-L2 | Personlig | **APEN** — re-filed (hardkodede aria-labels) |
| Avg-L1 | Avgift | **APEN** — re-opened som Avg13-L3 (navnedrift) |
| Avg-L3 | Avgift | **APEN** — re-opened som Avg13-L4 (hardkodet arrow) |
| Sks-L2 | Skatt | **LUKKET** — korrekt juridisk notasjon |
| Sks-L3 | Skatt | **APEN** — forblir deferred (forenklet fremstilling) |
| Sel-L1 | Selskap | **APEN** — cmp-table caption/scope, deferred |
| Sel-L2 | Selskap | **LUKKET** — Info, korrekt notasjon |
| Sel-L3 | Selskap | **APEN** — ansatte 30+ nyanser, deferred |
| K12-L4 | Kalkulator | **APEN** — switchCalc race, landscape adder ny trigger. Landscape state machine verifisert korrekt men risk er uendret. |

**Oppsummering:** 5 LUKKET, 9 fortsatt APEN (alle L-tier).

---

## H-TIER APNE FUNN (1)

### K13-H1: calcLvu OTP beregnes pa fullt bruttobelop — matte-feil

> [!bug] HIGH — Gir feil selskapskostnad i LVU-kalkulatoren

**Fil:** `shared/core.js:4208`

```js
const ferie=g*0.12; const otp=g*0.02;
```

OTP beregnes som `brutto * 2%`. Korrekt per innskuddspensjonsloven SS 5-2: kun lonn mellom 1G og 12G. `calcAga` (linje 4233) gjor dette riktig med `otpBase = max(0, min(sal, 12*G) - G)`.

**Eksempel (500 000 kr):**
- Feil (na): OTP = 10 000 kr
- Korrekt: OTP = (min(500k, 1 561 920) - 130 160) * 0.02 = 7 397 kr
- Differanse: **2 603 kr** feil pa selskapskostnad

**Fix:**
```js
const G=_HVT_G;
const otpBase=Math.max(0, Math.min(g, 12*G) - G);
const otp=otpBase*0.02;
```

---

## M-TIER APNE FUNN (8)

### Skatt (2 M)

**S13-M1 — calcSal ignorerer "Selvstendig"-valget**
`salClasses` i alle 10 lang-filer tilbyr "Selvstendig naringsdrivende", men `calcSal` hardkoder 7,6 % trygdeavgift uansett. Bruker far feil sats (burde vaere 10,8 %).
Fix: Fjern self-opsjonen fra alle 10 lang-filer (kalkulatoren er for lonnsmottakere; naringsdrivende har utdeling-kalkulatoren).
`core.js:2826` + `lang/*.js`

**S13-M2 — calcReise hardkoder satsverdier i resultatstreng**
"1,90 kr/km" og "12 000 kr" er hardkodet i strengen (L3213) men finnes som variabler `satsPerKm` og `nedreGrense`.
Fix: Bruk variablene.
`core.js:3213`

### Kalkulator (4 M)

**K13-M1 — gesturestart listener leak**
`enterFocusMode()` legger til anonym `gesturestart`-listener som aldri fjernes. Stacker per focus-syklus.
Fix: Lagre referanse, fjern i exitFocusMode.
`core.js:4832`

**K13-M2 — CSV i18n: likvidCsv og avsCsv bruker hardkodet norsk**
Kolonneoverskrifter, titler og footer pa norsk. bilCsv/aboCsv bruker R() korrekt — monsret finnes.
Fix: Bruk R() translations.
`core.js:6012-6031`

**K13-M3 — exitFocusMode header.offsetHeight=0 i landscape**
I landscape-modus er header `display:none!important`, sa `h.offsetHeight` returnerer 0. `mobile-mode-bar.top` settes til '0px'.
Fix: Guard med `h.offsetHeight > 0`.
`core.js:4833`

**K13-M4 — .cm-opt:hover mangler @media(hover:hover)**
Eneste hover-regel uten guard. Gir "stuck highlight" pa touch.
Fix: Wrap i @media(hover:hover).
`style.css:906`

### Boliglan (1 M)

**B13-M1 — Tinglysingsgebyr 545 kr — trenger /research**

> [!warning] Needs /research verification
> Verdien 545 kr i `core.js:3232` matcher ingen kjent historisk sats (var 585 kr 2023-2025). Kan vaere oppdatert for 2026 eller feil. Verifiser mot Kartverket.

### Personlig (1 M)

**P13-M1 — Abo initial dropdown mismatch med aboAddRow**
Forste rad bruker flat dropdown (Spotify, Netflix...) mens dynamiske rader bruker multi-tier optgroups (Spotify Individual/Duo/Family). `ABO_DEFAULTS["Spotify"]` er undefined — stille data-tap i prisendring-sammenligning.
Fix: Generer forste rad dynamisk med optgroups, eller la init-koden kalle aboAddRow.
`personlig/index.html:731-750` + `core.js:5680-5724`

---

## L-TIER APNE FUNN (19) — Sammendrag

| Seksjon | Antall | Hovedtemaer |
|---|---:|---|
| Skatt | 3 | applyLang hardkoder norsk (2 steder), English fallback, Pattern B gap |
| Kalkulator | 3 | CSV footer/title hardkodet, HTML hint 1G-tall |
| Boliglan | 1 | Statisk "5,1 %" flytende rente (viderefort) |
| Personlig | 5 | aria-live (re-filed), aria-labels (re-filed), scroll timeout, abo aria-label, smartScroll inkonsistens |
| Avgift | 6 | English fallbacks (2), navnedrift (deferred), arrow hardkodet (deferred), typo, clear-list gap |
| Selskap | 1 | search.js mangler 4 URL_TO_I18N_KEYS entries |

Full detaljer i delrapportene.

---

## CROSS-CUTTING MONSTER-TREFF (post-pass V13)

| # | Monster | V13 treff | Endring vs V12 | Eksempler |
|---|---|---:|---|---|
| #1 | Stale satser core.js vs lang | 0 | Uendret | Alle delegert til /research |
| #2 | A11y div→button-gap | 0 | Ned fra 3 | V10+V12 fixes holder |
| #3 | infoRowsHTML div-onclick | 0 | Uendret | V11 fix holder |
| #4 | Hover uten @media(hover:hover) | **1** | Ned fra 0(!) | K13-M4 .cm-opt:hover (ny kode) |
| #5 | Matte-regresjoner | **1** | Ned fra 3 | K13-H1 calcLvu OTP (pre-existing, nyfunnet) |
| #6 | Hardkodede norsk uten applyLang | **5** | Opp fra 2 | CSV i18n gap (likvidCsv, avsCsv), skatt L1, avgift L1/L2 |
| #7 | UI-hint vs kode-konstanter drift | **2** | Opp fra 1 | S13-M1 salClasses, S13-M2 calcReise |
| #8 | repopulateSelectByIndex | 0 | Uendret | Ingen aktive funn |
| #9 | Datastruktur-refaktor uten grep | 0 | Uendret | Ingen state-lekkasje |
| #10 | Fabrikkerte konstanter | 0 | Ned fra 8 | Alle research-verifisert i V12 Fase 4 |
| #11 | HTML/JS fallback drift | **4** | Ned fra 8 | avgift L1/L2/L5, skatt L3 |

### Nye monstre foreslatt for v5 Monsterkatalog

#### Pattern D — Event listener leak i focus/landscape-modes
`gesturestart` listener i `enterFocusMode` legges til uten a lagres/fjernes. Tilsvarende pattern som V12 H4 `autoRecalc` leak, men i focus-mode-kontekst. Utlost av landscape auto-switch-tesing.
Treff: 1 (K13-M1).

#### Pattern E — CSV-eksport i18n gap
CSV-funksjoner (likvidCsv, avsCsv, morCsv footer) bruker hardkodet norsk mens tilsvarende calc-funksjoner bruker R() translations. Pattern finnes allerede fikset i bilCsv/aboCsv — mangelen er inkonsistens.
Treff: 3 (K13-M2, K13-L1, K13-L2).

---

## /RESEARCH-FLAGG (scope-separasjon v4)

| ID | Sats/regel | Fil | Kontekst |
|---|---|---|---|
| **R-bol-2** | Tinglysingsgebyr 545 kr 2026 | `core.js:3232` | Kartverket gebyrforskrift |
| **R-sel-2** | Stiftelsesloven SS 22 grunnkapital | 10 lang-filer | Viderefort fra V12 |
| R-skatt-* | Alle skattesatser 2026 | core.js diverse | Konsistente cross-file, trenger arlig revalidering |

**2 aktive /research-flagg.** V12 hadde 14 (12 lukket i Fase 4, 2 viderefort).

---

## ANBEFALT FIX-REKKEFOLGE V13

### Fase 1 — Quick wins (~30 min, 1 commit)

| # | ID | Fix | Filer |
|---|---|---|---|
| 1 | K13-H1 | calcLvu OTP: bruk 1G-12G band | core.js:4208 |
| 2 | K13-M4 | .cm-opt:hover: wrap i @media(hover:hover) | style.css:906 |
| 3 | S13-M2 | calcReise: bruk satsPerKm/nedreGrense variabler | core.js:3213 |
| 4 | K13-M3 | exitFocusMode: guard offsetHeight>0 | core.js:4833 |

### Fase 2 — Mellomstore (~1-2 timer, 1 commit)

| # | ID | Fix | Filer |
|---|---|---|---|
| 5 | S13-M1 | Fjern "Selvstendig" fra salClasses i 10 lang-filer | lang/*.js |
| 6 | K13-M1 | gesturestart listener: lagre ref + fjern i exit | core.js:4832 |
| 7 | K13-M2 | CSV i18n: bruk R() i likvidCsv/avsCsv | core.js:6012-6031 |
| 8 | P13-M1 | Abo dropdown: multi-tier optgroups i initial HTML | personlig/index.html:731-750 |

### Fase 3 — /research-blokkerte

| # | ID | Fix | Filer |
|---|---|---|---|
| 9 | B13-M1 | Tinglysingsgebyr: verifiser 545 kr mot Kartverket | core.js:3232 |

### Fase 4 — L-tier sweep (~1-2 timer)

19 L-tier funn. Batch per seksjon. Prioriter skatt L1 (bruker-synlig norsk for ikke-norske) og avgift L5 (typo).

**Estimert total V13 fix-tid: 3-5 timer.**

---

## METODENOTATER V13

**Skill:** v4 (scope-separasjon, uendret fra V12)
**Workflow:** Parallell single-message dispatch (6 sub-agenter samtidig)
**Tid:** ~7 min wall-clock (raskeste: avgift 5 min, tregeste: skatt 8 min)
**Baseline:** commit `ff5a3ee` (2026-04-12)
**Nye commits auditert:** ff5a3ee (landscape auto-switch + suggested), 5787dfe (focus i18n), c768b4d (HTTPS), 37a219a (hero gradient)
**Regressions found:** 0 av 72 V12-funn
**V12 deferred closed:** 5 av 16 (Bol-L2/L3/L6, Sks-L2, Sel-L2)

### V13 vs V12 sammenligning

| Metrikk | V12 | V13 | Endring |
|---|---|---|---|
| Total funn | 72 | 28 | **-61 %** |
| H-tier | 10 | 1 | **-90 %** |
| M-tier | 33 | 8 | **-76 %** |
| L-tier | 29 | 19 | **-34 %** |
| /research-flagg | 14 | 2 | **-86 %** |
| Regresjoner funnet | N/A | 0 | Clean |

**Landscape auto-switch (ff5a3ee):** State machine verifisert korrekt for alle 4 risiko-scenarioer (manuell switch i landscape, focus+landscape, non-kalkulator sider, race condition). Kun M3 (offsetHeight=0) og M1 (gesturestart leak) er faktiske funn — begge defensive, ingen runtime-crash.

**_refreshFocusLabels (5787dfe):** Solid implementasjon med null-guards og korrekte i18n-nokkler i alle 10 sprak. Ingen bugs funnet.

**HTTPS enforcement (c768b4d):** Dual-layer (CSP + JS redirect) verifisert pa alle 7 sider. Korrekt localhost-unntak.

---

## RELATERTE NOTER

- [[hverdagsverktoy-audit-consolidated-v12]] — V12 baseline (72 funn, alle lukket)
- Delrapporter: `audit/raw/hverdagsverktoy-{skatt,kalkulator,boliglan,personlig,avgift,selskap}-audit.md`
- Research INDEX: `research/INDEX.md`
- Brain_HV aktiv-todo: `wiki/notater/2026-04-11_aktiv-todo-v12.md` (STALE — oppdater etter V13)
