---
title: Hverdagsverktøy — Konsolidert Audit v8
date: 2026-04-10
version: 8
previous_version: 7
tags: [hverdagsverktoy, audit, consolidated, verified]
---

# Hverdagsverktøy — Konsolidert Audit v8 (2026-04-10)

Post-fix rapport som dokumenterer tilstanden etter Claude Code-sesjonen 2026-04-10 kveld. 18 av 31 åpne funn fra [[hverdagsverktoy-audit-consolidated-v7]] er nå fikset. To nye bugs ble funnet og fikset underveis (inklusive en trunkert HTML-fil), og tre regresjoner ble introdusert og reparert. Denne versjonen sporer både hva som er verifisert fikset og hva som fortsatt er åpent.

---

## Sammendragstabell per seksjon

| Seksjon | Åpne (H/M/L) | Totalt | Endring fra v7 | Status |
|---|---|---|---|---|
| **boliglan** | 0 / 1 / 2 | 3 | −4 | H3, H1, H7 fikset; M5, L1, L2 igjen |
| **skatt** | 0 / 0 / 0 | 0 | 0 | Alle fortsatt OK |
| **avgift** | 0 / 0 / 1 | 1 | −4 | M1, M7 fikset; L4 reverted etter a11y-regresjon |
| **selskap** | 0 / 0 / 1 | 1 | 0 | L5 reverted etter a11y-regresjon |
| **personlig** | 1 / 0 / 0 | 1 | −5 | H4, H5, H7, H8, M8 fikset; H6 fortsatt åpen |
| **kalkulator** | 0 / 2 / 1 | 3 | −9 | H1 OTP, H8 ferie, M11, NEW-2, NEW-3, NEW-4, NEW-5, NEW-6, samt BONUS (trunkert HTML) fikset; M9, L3 igjen |
| **i18n (språkfiler)** | 0 / 0 / 0 | 0 | −1 | M1 + privPThirdparty på alle 10 språk fikset |
| **infrastruktur** | 0 / 0 / 0 | 0 | −1 | SW cache alignment fikset |
| **TOTALT ÅPNE** | **1 / 3 / 5** | **9 funn** | **−17** (fra 26 til 9) | 65 % progresjon siden v7 |

### Tilleggs-endringer (ikke fra v7-listen)

| Type | Fiks | Commit |
|---|---|---|
| SEO | robots.txt, sitemap.xml, llms.txt, hreflang ×10, JSON-LD (WebSite+Person+WebApplication+BreadcrumbList), sr-only H1 på subsider, overlay H1→H2, viewport `maximum-scale=1.0` fjernet, privacy-tekst oppdatert til faktisk liste over tredjeparter | `22c5206` |
| CSS bug | Skatteloven kapitler skjules i desktop-focus mode pga CSS `.info-card ~ .info-card` traff nestede | `db5765c` |
| Scroll bug | `_animateScroll` `scrollTo(0,y)` overstyres av `html{scroll-behavior:smooth}` | `cde72ca` |

---

## Endringer fra v7 → v8

### Hva er fikset siden v7

> [!success] Verifisert fikset i preview + direktetest
> - **H3 Boliglan** Maksimal låneperiode 50 → 30 år (Utlånsforskriften § 4-5). Input `50` clamper til `30`.
> - **H1 Boliglan** Attestgebyr 172 → 0 kr. Dok-kalkulator verifisert: `0 kr attest`, total `125 545 kr`.
> - **H7 Boliglan** `morCsv()` lagrer nå `feesPerMonth` i `_mor` og inkluderer det i CSV-eksport. Verifisert: `_mor.fees=100` etter `calcMor`.
> - **H4 Personlig** Drivstoffpriser april 2026: diesel 19 → 25,08 kr/L, bensin 20 → 21 kr/L.
> - **H5 Personlig** Sparekalkulator returnerte `Infinity %` ved `start=0`. Nå `0,000 %`.
> - **H8 Personlig + Kalkulator** `calcFerie`: 60+ bonus kappet ved 6G per Ferieloven § 10 nr. 3. Verifisert: 1M kr → base 102 000, med 60+ bonus 119 962.
> - **H1 Kalkulator** `calcAga` + `calcPensjon` bruker nå `max(0, min(sal, 12G) − 1G)` som OTP-grunnlag per Innskuddspensjonsloven § 4-7. Verifisert: 2M × 5% = 71 588 kr.
> - **M1** `shared/lang/ar.js` `في القاهرة` → `في أوسلو`.
> - **M7 Avgift** `calcAdj` deduplisert 4× `document.getElementById('adj-rh')` til én referanse.
> - **M8 Personlig** Netflix Standard 129 → 159 kr/mnd.
> - **M11 Kalkulator** Foreldrepenger G-verdi-kommentar viser nå validitetsvindu (2025-05-01 til 2026-04-30).
> - **NEW-2 / NEW-6** Service Worker cache URL-mismatch fikset med `caches.match(req, {ignoreSearch: true})` + `CACHE_NAME` bumped to v20.
> - **NEW-3** `initPage` viser nå en toast + console.warn ved språk-ladefeil i stedet for stille reset til `no`.
> - **NEW-4** Kalkulator focus-bar IIFE venter nå på at `REGIONS[region]` er populert før `R()` kalles (via polling).
> - **NEW-5** `switchCalcMode` finner klonede `.cm-opt` i focus-dropdown via `data-mode`-attributt.
> - **BONUS** Trunkert `<script>` i `kalkulator/index.html` (endte midt i `origTogg`) skrevet komplett på nytt.

> [!info] Ikke fra v7-listen
> - **SEO-kritiske funn** (egen audit): robots.txt, sitemap.xml, llms.txt, hreflang, JSON-LD, SR-only H1, viewport, privacy-tekst.
> - **privPThirdparty** oppdatert på alle 10 språkfiler (tidligere kun Norwegian inline HTML).
> - **M2 valutakurser** localStorage-cache med 7-dagers TTL (auditens «~100 hardkodede» var overdrevet — faktisk 15 fallback, live-fetch aktiv fra før).
> - **Skatt law-chapter CSS-bug**: `.info-card:not(.collapsed)~.info-card.collapsed` scopet til `.card > .info-card`.
> - **smartScroll**: `_animateScroll` endret til `behavior:'instant'`.

### Hva er introdusert og reversert (Claude-regresjoner)

> [!warning] Pre-revert regresjoner — dokumentert for fremtidig læring
> - **A11y-konvertering ødela alle kort (commit `fe23e7f` → `7889179`):** 83 `<div class="card-hdr">` konvertert til `<button>` via regex. Non-greedy `.*?` matchet innerste `</div>` i stedet for ytre. Alle kort sluttet å kollapse. Rapportert av Kasper med «hele nettsiden bugger nå». Hotfix (`7889179`) reverterte alle 83 konverteringer. CSS-resetten for `button.card-hdr` står igjen som harmløs, klar for korrekt implementering neste gang via BeautifulSoup.

### Hva er uendret

- **H6 Personlig** Veibruksavgift april–sept 2026. Uavklart: om H4 drivstoffpriser-oppdatering allerede reflekterer pump-prisene (inkl. reduksjon), eller om det trenges separat dato-sjekk med subtraksjon. Trenger Kasper's input.
- **L4 Avgift** 15× `<div onclick>` a11y — kan gjøres på nytt via BeautifulSoup.
- **L5 Selskap** 21× `<div onclick>` a11y — samme.
- **M5 / M6 Boliglan** dokumentasjon + stresstest — ikke-kritiske feature-requests.
- **L1, L2 Boliglan** — mindre UI-polish.
- **L3 Kalkulator** `calcFerie` divisor 220 grov tilnærming.
- **M9** Små språkfiler mangler 13–16 keys — krever systematisk oversettelsesarbeid.

---

## Totaltelling — ÅPNE BUGS (v8)

### Høy prioritet (1 bug)

1. **H6 Personlig** Veibruksavgift april–sept 2026 ikke redusert. Stortingsvedtak 486/2026 sier 0 kr apr–sept. Impact: bilkostnad overestimert 7–8k kr/år dersom pump-prisene i H4 ikke allerede reflekterer reduksjonen.

### Medium prioritet (3 bugs)

1. **M5 Boliglan** Maksimal låneperiode 30 år ikke dokumentert i UI (fikset i H3, men ikke vist som disclaimer).
2. **M6 Boliglan** Stresstest IKKE implementert.
3. **M9** Små språkfiler (ti, so, lt) mangler 13–16 keys.

### Lav prioritet (5 bugs)

1. **L1 Boliglan** "jan 2026"-dato blir utdatert
2. **L2 Boliglan** Ingen Enter-handler på input
3. **L3 Kalkulator** `calcFerie` divisor 220 grov tilnærming
4. **L4 Avgift** 15× `<div onclick>` a11y (attempted + reverted)
5. **L5 Selskap** 21× `<div onclick>` a11y (attempted + reverted)

---

## Bekreftet korrekt (v8) — kumulativt siden v7

| Sats | Verdi | Status | Bekreftet dato | Kilde |
|------|-------|--------|---|---|
| Trygdeavgift nedre grense | 99 650 kr | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| Trygdeavgift opptrappingsregel | 25% over grensen | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| 1G grunnbeløp (gyldig til 2026-04-30) | 130 160 kr | ✓ OK | 2026-04-10 | NAV WebSearch |
| Norges Bank styringsrente | 4 % | ✓ OK | 2026-04-10 | Norges Bank |
| Tinglysingsgebyr | 545 kr | ✓ OK | 2026-04-10 | Kartverket WebFetch |
| Dokumentavgift | 2,5 % | ✓ OK | 2026-04-10 | Kartverket WebFetch |
| MVA-satser | 25%, 15%, 12%, 0% | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| AGA-soner | 14.1%, 10.6%, 6.4%, 7.9%, 5.1%, 0% | ✓ OK | 2026-04-10 | Skatteetaten WebSearch |
| Personfradrag 2026 | 114 540 kr | ✓ OK | 2026-04-10 | Skatteetaten WebFetch |
| Maksimal låneperiode (LOV) | 30 år | ✓ OK | 2026-04-10 | Utlånsforskriften |
| Attestgebyr | 0 kr (ikke separat gebyr) | ✓ OK | 2026-04-10 | Kartverket WebFetch |
| OTP-grunnlag 1G–12G | Innskuddspensjonsloven § 4-7 | ✓ IMPLEMENTERT | 2026-04-10 | Lovdata |
| Feriepenger 60+ 6G-tak | Ferieloven § 10 nr. 3 | ✓ IMPLEMENTERT | 2026-04-10 | Lovdata |
| Netflix Standard (NO) | 159 kr/mnd | ✓ OK | 2026-04-10 | Netflix.no |

### Implementasjoner verifisert i preview

- ✓ `calcTrygdeavgift(inntekt, rate)` med 99.650 kr / 25% — brukt 4 steder (`calcSal`, `calcUttak`, `calcUtdeling`, `calcLonn`)
- ✓ RTL arabisk `dir="rtl"` fortsatt korrekt
- ✓ Alle 10 språkfiler dekker privPThirdparty med korrekt tredjeparts-liste
- ✓ Schema.org JSON-LD valid på alle 7 sider (parser OK, types: WebSite/Person/WebApplication/BreadcrumbList)
- ✓ 11 hreflang alternate links per side (nb/en/pl/uk/ar/lt/so/ti/zh/fr/x-default)
- ✓ Service Worker `CACHE_NAME=hverdagsverktoy-v20` + `{ignoreSearch: true}` matching
- ✓ Currency rates persisted til localStorage (166 rates, 7-dagers TTL)
- ✓ Skatteloven-kapitler alle 12 synlige i desktop-focus mode etter CSS-fix

---

## Prioritert fix-rekkefølge — resten

### Topp-3 resterende

1. **H6 Veibruksavgift** (1 time, trenger Kasper's input først). Avklar først om H4 pump-priser allerede reflekterer april–sept tax-reduksjon.
2. **L4 + L5 a11y** (2 timer, bruk BeautifulSoup ikke regex). Reverted etter Claude-regresjon — CSS-resetten for `button.card-hdr` er allerede på plass i style.css så kun HTML-parser-basert konvertering trengs.
3. **M9 Språkfiler** (4 timer, systematisk). Mangler 13–16 keys i ti, so, lt.

### Estimert total fix-tid: ~7 timer

---

## Kilde-tabell

Samme som [[hverdagsverktoy-audit-consolidated-v7]] — ingen nye verifiseringer i v8 utover de som støtter v7-funnene.

Tilleggs-kilder brukt for SEO-fikses i denne sesjonen:

| Tema | Kilde | Status | Dato |
|------|-------|--------|------|
| Schema.org JSON-LD spec | schema.org | ✓ Validert | 2026-04-10 |
| llms.txt format | llmstxt.org | ✓ Referert | 2026-04-10 |
| Hreflang for single-URL multilingual | Google Search Central | ✓ Referert | 2026-04-10 |

---

## Metodenotater

**Audit-modus:** C — POST-FIX-VERIFIKASJON.

**Scope:**
- Full SEO-audit mot hverdagsverktoy.com (via installed `seo-audit` skill v1.8.2)
- Implementering av Topp-10 + NEW-2 til NEW-6 fra v7-baseline
- Oppfølging etter to Claude-regresjoner (div→button og CSS sibling)
- Identifikasjon og fix av pre-eksisterende smartScroll-bug ingen tidligere audit hadde fanget

**Verifiseringsmetoder (denne runden):**
- Direkte test i `localhost:8082` preview browser (JS eval + preview_eval)
- `fetch('/shared/core.js')` + regex verifisering av at fix landet
- Computed-style inspection for CSS-fixes
- `document.visibilityState` test (som avslørte preview-begrensning: rAF throttlet til 0fps i bakgrunnen)
- Schema.org JSON-LD validering via `JSON.parse` + type-check

**Commits i sesjonen (alle pushet til `main`):**
1. `22c5206` — SEO critical fixes
2. `9a364e5` — 13 audit findings + BONUS trunkert HTML
3. `fe23e7f` — A11y + i18n + currency cache
4. `7889179` — HOTFIX revert of broken div→button
5. `db5765c` — Skatt law-chapter CSS fix
6. `cde72ca` — smartScroll browser override fix

**Total sesjonstid:** ~4–5 timer real-time (kunne vært mindre uten de to regresjonene).

---

## Relaterte noter

- [[2026-04-10-session-seo-audit-fixes]] — detaljert sesjonslogg
- [[hverdagsverktoy-audit-consolidated-v7]] — forrige konsoliderte rapport (baseline)
- [[hverdagsverktoy-audit-latest]] — alias som peker til denne versjonen

---

**Rapport generert:** 2026-04-10 23:15 UTC (post-fix)
**Versjon:** v8
**Status:** 9 åpne funn igjen (av 26 i v7 + 5 NEW). 65 % progresjon.
**Signoff:** Ingen blocker igjen. Alle kritiske (H-merkede) funn fra v7 er fikset unntatt H6 som trenger Kasper's avklaring om pump-pris-semantikk.
