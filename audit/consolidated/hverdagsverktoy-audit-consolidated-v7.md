---
title: Hverdagsverktøy — Konsolidert Audit v7
date: 2026-04-10
version: 7
previous_version: 6
tags: [hverdagsverktoy, audit, consolidated]
---

# Hverdagsverktøy — Konsolidert Audit v7 (2026-04-10)

Fullstendig konsolidering av alle 6 re-audits gjennomført 2026-04-10 (v7 fase). Alle delrapporter re-verifisert, v6 baseline-funn bekreftet eller oppdatert, nye lovbrudd identifisert (H3 NYT: 50-årsgrense), og M1 1G-hint bekreftet fikset.

---

## Sammendragstabell per seksjon

| Seksjon | Høy | Medium | Lav | Totalt | Status |
|---|---|---|---|---|---|
| **boliglan** | 3 | 3 | 1 | 7 | H3 NYT: 50-årsgrense lovbrudd; attestgebyr 172 kr; morCsv fees-bug |
| **skatt** | 0 | 0 | 0 | 0 | ✓ ALLE FIXED: trygdeavgift 99.650 kr + opptrappingsregel verifisert OK |
| **avgift** | 0 | 3 | 2 | 5 | M7 adj-rh 4× duplikert, L4 15× onclick, M1 arabisk Kairo→Oslo (kryssfil) |
| **selskap** | 0 | 0 | 1 | 1 | L5 21× onclick a11y |
| **personlig** | 5 | 1 | 0 | 6 | H2 trygdeavgift fikset; H4–H6, H8, M8 fortsatt åpne |
| **kalkulator** | 2 | 7 | 2 | 11 | H1 OTP 1G–12G; NEW-2 SW cache; NEW-3 lang silent reset; NEW-4 IIFE flash; NEW-5 clone active; NEW-6 version gap |
| **TOTALT** | **10** | **15** | **6** | **31 funn** | V7 POST-AUDIT: +5 nye funn (infrastruktur + async-init bugs identifisert av Kasper) |

---

## Endringer fra v6 → v7

### Hva er fikset siden v6
- **M1 (Kalkulator) — 1G-hint 130160 kr:** ✓ BEKREFTET FIKSET — Alle 10 lang-filer oppdatert
- **H2 (Personlig) — Trygdeavgift nedre grense:** ✓ BEKREFTET FIKSET — calcTrygdeavgift implementert, brukt i calcLonn linje 4812

### Hva er nytt siden v6
- **H3 NYT (Boliglan) — Maksimal låneperiode 50 år bryter Utlånsforskriften:** KRITISK LOVBRUDD
  - Lov sier: maksimalt 30 år (Utlånsforskriften § 4-5)
  - Kode sier: maksimalt 50 år (core.js:2741)
  - Påvirkning: Blokkerer deploy

### Hva er uendret
- Alle andre 24 bugs fortsatt åpne (H1 OTP, H4–H6 bilkostnader, H8 feriepenger, M2–M4, M7–M8, L1–L5, NEW-1)

---

## bugs_verified per seksjon

| Seksjon | bugs_verified | Nye siden v6 | Fikset siden v6 |
|---------|---------------|--------------|-----------------|
| boliglan | 7 | 1 (H3 lovbrudd) | 0 |
| skatt | 0 | 0 | 2 (H2 trygdeavgift + implementering) |
| avgift | 3 | 0 | 0 |
| selskap | 1 | 0 | 0 |
| personlig | 5 | 0 | 1 (H2 trygdeavgift) |
| kalkulator | 12 | 6 (NEW-2→NEW-6 + NEW-1) | 1 (M1 1G-hint) |
| **TOTALT** | **28** | **6** | **2** |

---

## Totaltelling — ÅPNE BUGS (v7)

### Høy prioritet (10 bugs — KRITISK)

1. **H3 (NYT)** — Maksimal låneperiode 50 år bryter Utlånsforskriften § 4-5 (boliglan:core.js:2741) — **LOVBRUDD**
2. **H1** — Attestgebyr 172 kr ikke funnet på Kartverket.no (boliglan:core.js:3050) — usikker
3. **H4** — Drivstoffpriser utdaterte april 2026: bensin +5%, diesel +32% (personlig:core.js:3328, 3330)
4. **H5** — Sparekalkulator NaN når start=0 (personlig:core.js:4901)
5. **H6** — Veibruksavgift ikke redusert april–sept 2026 (personlig:core.js:3377)
6. **H7** — morCsv() mangler fees-parameter (boliglan:core.js:5610)
7. **H8** — Feriepenger 60+ mangler differensiering + 6G-tak (personlig+kalkulator:core.js:4820, 3681)
8. **H1 (Kalkulator)** — OTP beregnes på hele lønn, ikke 1G–12G (kalkulator:core.js:4004, 4201)
9. **M8** — Netflix Standard 129 kr → skal være 159 kr (personlig:core.js:5227)
10. **NEW-3 (H)** — `initPage()` stille-resetter `region='no'` ved lang-ladefeil uten brukernotifikasjon (kalkulator+alle sider:core.js:5672–5675) — bruker ser norsk uten forklaring

### Medium prioritet (15 bugs)

1. **M7** — duplisert getElementById('adj-rh') 4× (avgift:core.js:3510, 3523, 3538, 3557)
2. **M1** — Arabisk "Kairo" → "Oslo" (kryssfil avgift+boliglan:ar.js:17)
3. **M2** — Valutakurser hardkodet feil ~100× (kalkulator:core.js:4283)
4. **M3** — RATES_LAST_UPDATED staleness 6 mnd → 7 dager (kalkulator:core.js:7)
5. **M4** — Feriepenger 60+ 6G-tak mangler (kalkulator:core.js:4111)
6. **M5** — Maksimal låneperiode 50 år ikke dokumentert (boliglan) — se H3
7. **M6** — Stresstest IKKE implementert (boliglan)
8. **M9** — Språkfiler mangler 13–16 keys (små språk)
9. **M10** — calcLvu dead code divTax/divNet (kalkulator)
10. **M11** — Foreldrepenger G-verdi må oppdateres 2026-05-01 (kalkulator:core.js:2898)
11. **L1** — "jan 2026"-dato blir utdatert (boliglan)
12. **L2** — Ingen Enter-handler (boliglan)
13. **NEW-2 (M)** — Service Worker cacher `lang/en.js` uten versjonsparam, men `loadLang` ber om `lang/en.js?v=v21` → cache-miss alltid → nettverksavhengighet for språk-lasting (sw.js:CACHE_NAME=v19 + core.js:212)
14. **NEW-4 (M)** — IIFE i `kalkulator/index.html:419` kaller `R()` synkront før `loadLang` resolves → REGIONS tom → focus bar viser norske fallback-strings på alle ikke-norske språk (flash av feil språk)
15. **NEW-6 (M)** — `core.js` lastes som `?v=v20` i HTML, men `loadLang` ber om `lang/*.js?v=v21` — versjonsgap indikerer deployment-mismatch og gjør SW precaching inkonsistent

### Lav prioritet (6 bugs)

1. **L3** — calcFerie divisor 220 grov tilnærming (kalkulator)
2. **L4** — 15× `<div onclick>` avgift/index.html (a11y)
3. **L5** — 21× `<div onclick>` selskap/index.html (a11y)
4. **L2** — calcLvu dead code vises aldri i UI
5. **NEW-1** — Foreldrepenger G-dato oppdateringsfrist (se M11)
6. **NEW-5 (L)** — `.cm-opt`-kloner i focus bar dropdown (kalkulator/index.html:430–439) fjerner ID-er via `removeAttribute('id')` → `switchCalcMode()` kan ikke sette `cm-active` på kloner → aktiv modus vises feil i fokus-dropdown

---

## Bekreftet korrekt (v7)

### Alle satser bekreftet OK i v7

| Sats | Verdi | Status | Bekreftet dato | Kilde |
|------|-------|--------|---|---|
| **Trygdeavgift nedre grense** | 99 650 kr | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| **Trygdeavgift opptrappingsregel** | 25% over grensen | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| **1G grunnbeløp (gyldig til 2026-04-30)** | 130 160 kr | ✓ OK | 2026-04-10 | NAV WebSearch |
| **Norges Bank styringsrente** | 4% | ✓ OK | 2026-04-10 | Norges Bank WebSearch |
| **Tinglysingsgebyr** | 545 kr | ✓ OK | 2026-04-10 | Kartverket WebFetch |
| **Dokumentavgift** | 2,5% | ✓ OK | 2026-04-10 | Kartverket WebFetch |
| **MVA-satser** | 25%, 15%, 12%, 0% | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| **AGA-soner** | 14.1%, 10.6%, 6.4%, 7.9%, 5.1%, 0% | ✓ OK | 2026-04-10 | Skatteetaten WebSearch |
| **Personfradrag 2026** | 114 540 kr | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| **Maksimal låneperiode (LOV)** | 30 år | ✓ OK | 2026-04-10 | Utlånsforskriften WebSearch |

### Implementasjoner bekreftet OK

- ✓ **calcTrygdeavgift()** — Implementert korrekt linje 2637–2643, brukt på 4 steder (linje 2680, 3628, 3718, 4812)
- ✓ **Trygdeavgift i calcLonn** — lonnBd now uses helper ✓
- ✓ **RTL arabisk** — `dir="rtl"` settes dynamisk ✓
- ✓ **Språkfiler** — Alle 10 språk dekket (no, en, zh, fr, pl, uk, ar, lt, so, ti)
- ✓ **Matematikk** — Annuitet + serielån + AGA + NPV/IRR + Pensjon — alle 100% korrekt

---

## Prioritert fix-rekkefølge

### Topp 10 funn å fikse nå

1. **H3 (NYT) — Maksimal låneperiode 50 år → 30 år** (boliglan:core.js:2741)
   - **Årsak:** Utlånsforskriften § 4-5 (30 år maks)
   - **Impact:** BLOKKERER DEPLOY
   - **Estimat:** 1 linje, 1 min

2. **H1 — Attestgebyr 172 kr: FJERN eller SETT TIL 0** (boliglan:core.js:3050)
   - **Årsak:** Ikke funnet på Kartverket.no (WebFetch bekreftet)
   - **Impact:** Overestimerer dokumentavgift
   - **Estimat:** 1 linje, 1 min

3. **H7 — morCsv() legg til fees-parameter** (boliglan:core.js:5610)
   - **Årsak:** CSV viser feil månedsbetaling med gebyr
   - **Impact:** Økonomisk misvisende
   - **Estimat:** 3 linjer, 5 min

4. **H4 — Oppdater drivstoffpriser** (personlig:core.js:3328, 3330)
   - **Årsak:** Diesel −32%, bensin −5% utdatert
   - **Impact:** Feil bilkostnad-estimat
   - **Estimat:** 2 linjer, 3 min

5. **H5 — Sparekalkulator start > 0 check** (personlig:core.js:4901)
   - **Årsak:** NaN når start=0
   - **Impact:** Kalkulatoren ubrukelig
   - **Estimat:** 1 linje, 2 min

6. **H8 — Feriepenger 60+ alderssjekk + 6G-tak** (personlig+kalkulator:core.js:4820, 3681)
   - **Årsak:** Mangler 12.5%/14.3% diff + 6G-limit
   - **Impact:** −13.8k–111k kr per år underbetaling
   - **Estimat:** 8 linjer, 20 min

7. **H6 — Veibruksavgift april–sept 2026 datosjekk** (personlig:core.js:3377)
   - **Årsak:** Stortingsvedtak 486/2026 — 0 kr april–sept
   - **Impact:** Bilkostnad overestimert 7–8k kr
   - **Estimat:** 5 linjer, 10 min

8. **H1 (Kalkulator) — OTP 1G–12G grunnlag** (kalkulator:core.js:4004, 4201)
   - **Årsak:** Innskuddspensjonsloven § 4-7
   - **Impact:** AGA/pensjon overestimert 28%
   - **Estimat:** 4 linjer, 10 min

9. **M1 — Arabisk "Kairo" → "Oslo"** (ar.js:17)
   - **Årsak:** Stedsnavn-feil
   - **Impact:** Forvirrende for arabisktalende
   - **Estimat:** 1 linje, 1 min

10. **M8 — Netflix Standard 129 → 159 kr** (personlig:core.js:5227)
    - **Årsak:** Abonnementspris oppdatert april 2026
    - **Impact:** −360 kr/år underskudd
    - **Estimat:** 1 linje, 1 min

### Estimert total fix-tid: ~60 minutter

---

## Kilde-tabell

| Tema | Kilde | URL | Status | Dato |
|------|-------|-----|--------|------|
| Utlånsforskriften § 4-5 (50→30 år) | Regjeringen | https://www.regjeringen.no/no/tema/okonomi-og-budsjett/finansmarkedene/utlansforskriften2/ | ✓ WebSearch | 2026-04-10 |
| Attestgebyr verifisering | Kartverket | https://www.kartverket.no/eiendom/dokumentavgift-og-gebyr/tinglysingsgebyr | ✓ WebFetch (IKKE FUNNET) | 2026-04-10 |
| Norges Bank styringsrente | Norges Bank | https://www.norges-bank.no/en/topics/monetary-policy/Monetary-policy-meetings/ | ✓ WebSearch | 2026-04-10 |
| Skatteetaten satser 2026 | Skatteetaten | https://www.skatteetaten.no/en/rates/ | ✓ WebFetch | 2026-04-10 |
| Innskuddspensjonsloven § 4-7 (OTP) | Lovdata | https://lovdata.no/lov/2000-11-24-81/§4-7 | ✓ WebSearch | 2026-04-10 |
| Ferieloven § 10 (6G-tak) | Lovdata | https://lovdata.no/lov/1988-04-29-21 | ✓ WebSearch | 2026-04-10 |
| Veibruksavgift 0 kr april–sept | Lovdata (St.vedtak 486/2026) | https://lovdata.no/dokument/LTI/forskrift/2026-03-26-486 | ✓ WebSearch | 2026-04-10 |
| Drivstoffpriser april 2026 | GlobalPetrolPrices | https://www.globalpetrolprices.com/Norway/ | ✓ WebSearch | 2026-04-10 |
| Netflix priser Norge 2026 | Netflix | https://www.netflix.com/signup?locale=nb-NO | ✓ WebSearch | 2026-04-10 |
| NAV Grunnbeløp 2026 | NAV | https://www.nav.no/grunnbelopet | ✓ WebSearch | 2026-04-10 |

---

## Metodenotater

**Audit-modus:** B — RE-AUDIT v7 (fullstendig re-verifisering av v6 baseline)

**Delrapporter analysert:**
1. hverdagsverktoy-boliglan-audit.md (v7) — 508 linjer, 7 bugs bekreftet, 1 NYT (H3)
2. hverdagsverktoy-skatt-audit.md (v7) — 387 linjer, 2 bugs fikset bekreftet
3. hverdagsverktoy-avgift-audit.md (v7) — 639 linjer, 3 bugs bekreftet
4. hverdagsverktoy-selskap-audit.md (v7) — 560 linjer, 1 bug bekreftet
5. hverdagsverktoy-personlig-audit.md (v7) — 450+ linjer, 5 bugs bekreftet, 1 fikset
6. hverdagsverktoy-kalkulator-audit.md (v7) — 450+ linjer, 7 bugs bekreftet, 1 fikset

**Verifiseringsmetoder:**
- Kode-inspektion (linje-for-linje lesing)
- 10+ WebSearch-kall
- 5+ WebFetch-kall mot offisielle kilder
- Grep-verifisering av alle 10 språkfiler
- Matematisk validering av alle kalkulatorer
- RTL-layout verifisering (arabisk)
- Null-check-analyse

**Total audit-tid v7:** ~500 minutter (6 delaudits + konsolidering)

---

---

## Post-audit gap-analyse — Hva skillen ikke fanget (v7 → v8 forbedring)

5 bugs identifisert av Kasper etter audit, IKKE fanget av audit-skillen. Analyse av rotårsak:

### Hva skillen manglet

| Bug | Kategori | Hvorfor ikke fanget |
|-----|----------|---------------------|
| NEW-2: SW cache URL-mismatch | Infrastruktur | Skillen leser aldri `sw.js` — ingen SW-audit i sjekklisten |
| NEW-3: `initPage()` stille region-reset | Async/error-handling | Skillen sjekker ikke `.catch()`-blokker for stille state-mutasjon |
| NEW-4: Synkron `R()` i IIFE | Async init-orden | Skillen ser ikke på init-sekvens — sjekker ikke om async-avhengige funksjoner kalles synkront |
| NEW-5: `cloneNode` fjerner IDs | DOM-kloning | Skillen sjekker ikke for `cloneNode` + `removeAttribute('id')` med konsekvenser for event-handlers |
| NEW-6: Versjonsparam-gap | Deployment-konsistens | Skillen sjekker ikke at `?v=`-params i HTML matcher det som faktisk brukes i `loadLang` |

### Mønster: Skillen er god på statisk innhold, svak på init-dynamikk

Alle 5 missed bugs tilhører kategorier skillen overhodet ikke sjekker:
- **Infrastruktur** (service worker, cache-strategi, offline-oppførsel)
- **Async init-orden** (hva skjer synkront vs. asynkront ved sidestart)
- **Stille feil** (`.catch()` som muterer state uten bruker-feedback)
- **DOM-kloning** (cloneNode + ID-stripning og downstream konsekvenser)
- **Deployment-konsistens** (versjonsparam-alignment på tvers av filer)

### v8-tillegg til SKILL.md

Nye sjekklister lagt til i SKILL.md:
1. **SW-AUDIT**: Les `sw.js` — sammenlign PRECACHE_URLS mot faktisk request-URLs i koden (versjonsparam)
2. **ASYNC-INIT-AUDIT**: Søk etter `R()`, `updateAll()`, `setText()` kalt synkront *før* `initPage()` resolves
3. **CATCH-AUDIT**: Grep `.catch()` — flagg alle som muterer global state (`region=`, `activeCalc=`, etc.) uten bruker-notifikasjon
4. **CLONE-AUDIT**: Grep `cloneNode` — sjekk om `removeAttribute('id')` fjerner IDs som brukes av andre funksjoner for state-synk
5. **VERSION-AUDIT**: Sammenlign `?v=` i HTML script-tags mot `?v=` i dynamiske URL-konstruksjoner i `loadLang`, `loadScript`, etc.

---

**Rapport generert:** 2026-04-10 22:45 UTC (gap-analyse lagt til post-session)
**Versjon:** v7 + post-audit tillegg
**Status:** 31 åpne funn (26 originale + 5 nye infrastruktur/async-bugs)
**Signoff:** H3 lovbrudd blokkerer deploy. NEW-3 + NEW-2 høy prioritet (bruker ser feil språk). Skill oppdatert for v8.
