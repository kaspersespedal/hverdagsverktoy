---
title: Hverdagsverktøy — Konsolidert Audit v1
date: 2026-04-10
tags: [hverdagsverktoy, audit, consolidated, v1, 2026]
status: review
scope: alle 6 seksjoner (personlig, boliglan, kalkulator, skatt, avgift, selskap)
year: 2026
---

# Hverdagsverktøy — Konsolidert Audit v1 (2026-04-10)

Samlet rapport fra seks separate audits av hverdagsverktoy.com gjennomført 10. april 2026. Dekker samtlige kalkulator-seksjoner, norske 2026-satser, kode-hygiene (null-checks, event-lekkasjer, a11y), språkdekning i 10 lang-filer og RTL-support.

**Delrapporter:**
- [[hverdagsverktoy-personlig-audit]]
- [[hverdagsverktoy-boliglan-audit]]
- [[hverdagsverktoy-kalkulator-audit]]
- [[hverdagsverktoy-skatt-audit]]
- [[hverdagsverktoy-avgift-audit]]
- [[hverdagsverktoy-selskap-audit]]

---

## Sammendrag av alvorlighet

| Seksjon | Høy | Medium | Lav | Kommentar |
|---|---|---|---|---|
| personlig | 3 | 1 | 0 | frikort/trygd, drivstoff, NaN-krasj |
| boliglan | 1 | 2 | 2 | attestgebyr, morCsv-fees, Kairo→Oslo |
| kalkulator | 1 | 3 | 3 | OTP på hele lønn i 2 funksjoner |
| skatt | 1 | 0 | 0 | samme trygdeavgift-bug som personlig |
| avgift | 1 | 2 | 2 | null-ref i uttakToggleFields |
| selskap | 0 | 0 | 2 | ren seksjon, kun a11y-forslag |
| **SUM** | **7** | **8** | **9** | |

---

## HØY prioritet (fikses først)

### H1. Trygdeavgift mangler nedre grense og opptrappingsregel

> [!bug] Høy — Samme bug i to funksjoner
> **Filer:** `core.js:4794` (`calcLonn`, personlig) + `core.js:2662–2663` (`calcSal`, skatt)
> **Problem:** Begge funksjonene beregner trygdeavgift som flat 7,6 % fra kr 1. Korrekt er (a) ingen trygdeavgift under 99 650 kr (nedre grense), (b) maks 25 % av beløp over grensen (opptrappingsregel).
> **Konsekvens:** 17-åring med 100 k sommerjobb ser ~7 600 kr skatt, reell ~88 kr. Effektiv skatt overestimert 3–4 pp for inntekter 99 650–190 000 kr.
> ```js
> const nedreGr = 99650;
> const socRate = (kl==='self') ? 0.108 : 0.076;
> let soc = 0;
> if (b > nedreGr) {
>   soc = Math.min(b * socRate, (b - nedreGr) * 0.25);
> }
> ```
> **Kilde:** [Skatteetaten — Trygdeavgift 2026](https://www.skatteetaten.no/en/rates/national-insurance-contributions/)

### H2. OTP beregnes på hele lønn i stedet for lønn mellom 1G og 12G

> [!bug] Høy — calcAga + calcPensjon
> **Filer:** `core.js:3986` (`calcAga`), `core.js:4179` (`calcPensjon`)
> **Problem:** OTP = `sal * 0.02` — hele lønn. Innskuddspensjonsloven § 4-7 krever 2 % av lønn **mellom 1G og 12G**. For 600 000 kr lønn: kode 12 000 kr, lovminimum ~9 400 kr. Overvurderer arbeidsgiverkostnad/pensjonspott 20–30 %. UI-hint på index.html:158 sier faktisk korrekt "over 1G" — tekst og kode er ute av sync.
> ```js
> const G_2026 = 130160;
> const otpBase = Math.max(0, Math.min(sal, 12*G_2026) - G_2026);
> const otpAmt = otpBase * otp;
> ```

### H3. Drivstoffpriser utdaterte

> [!bug] Høy — Bilkalkulator
> **Fil:** `core.js:3311–3313`
> **Problem:** Bensin 20 kr/l, diesel 19 kr/l, strøm 2,0 kr/kWh. April 2026: bensin ~22,5 / diesel ~24,0 / strøm ~1,77. Diesel er nå *dyrere* enn bensin — koden antar motsatt.
> **Fix:** Endre konstantene til 22,5 / 24,0 / 1,8.

### H4. NaN-krasj ved `start = 0`

> [!bug] Høy — Sparekalkulator
> **Fil:** `core.js:4883`
> **Problem:** `Math.pow(totalVal / 0, 1/(y*12))` = `NaN`/`Infinity`. Kalkulatoren viser "NaN %" når bruker kun sparer månedlig uten startbeløp — helt vanlig scenario.
> ```js
> const effMonthly = (start > 0 && totalVal > 0)
>   ? ((Math.pow(totalVal/start, 1/(years*12)) - 1) * 100)
>   : (rateAnnual / 12);
> ```

### H5. Attestgebyr 172 kr finnes ikke i 2026-prislisten

> [!bug] Høy — Dokumentavgift-kalkulator
> **Fil:** `core.js:3033` (`calcDok`)
> **Problem:** Legger til 172 kr "attestgebyr". Kartverkets prisliste 2026 viser kun tinglysingsgebyr (545 kr) — ingen attestgebyr. Brukeren får et fiktivt gebyr.
> **Fix:** Fjern `attest = 172`, sett `total = avgift + tinglyse`. Fjern også `dokRlAttestgebyr` i lang-filer.
> **Kilde:** kartverket.no (oppdatert 2026-01-05)

### H6. Null-reference i `uttakToggleFields`

> [!bug] Høy — Avgift-seksjonen
> **Fil:** `core.js:3553`
> **Problem:** Kaller `document.getElementById('uttak-res').classList.add('hidden')` uten null-check. Kaster `TypeError` hvis element mangler.
> **Fix:** Wrap alle tre `getElementById`-kall i `if(el)`-guards.

---

## MEDIUM prioritet

### M1. morCsv() ignorerer månedlige omkostninger (fees)

> [!warning] Medium — Boliglån CSV-eksport
> **Fil:** `core.js:2771` + `core.js:5582–5609`
> **Problem:** `_mor`-objektet lagres *før* fees-logikken oppdaterer displayet. CSV-nedlastingen bruker opprinnelige verdier uten fees → stemmer ikke med skjerm.
> **Fix:** Lagre `_mor` etter fees-beregning, eller inkluder `feesPerMonth` i objektet.

### M2. Arabisk oversettelse: "Kairo" i stedet for "Oslo"

> [!warning] Medium — ar.js
> **Fil:** `shared/lang/ar.js:17`
> **Problem:** `morReqRows` inneholder "في القاهرة: بحد أقصى 8%" — القاهرة betyr Kairo. Skal være "في أوسلو" (Oslo). Klassisk auto-oversetter-feil.

### M3. calcLvu dead code + forvirrende sammenligning

> [!warning] Medium — Lønn vs Utbytte
> **Fil:** `core.js:3967–3982`
> **Problem 1:** `divTax` og `divNet` beregnes men vises ikke — dead code.
> **Problem 2:** Sammenligner `salCost` (selskapskostnad for lønn) mot `divPreTax` (overskudd før selskapsskatt for utbytte). Ikke feil matematisk, men gir ikke svaret de fleste brukere tror de får ("hva får jeg mest av?" — netto personlig).
> **Fix:** Legg til "netto til personen"-sammenligning, eller slett dead code.

### M4. UI-hint "1G (124 028 kr i 2025)" er utdatert

> [!warning] Medium — kalkulator/index.html:158
> **Problem:** 124 028 er 1G per 2024-05-01, ikke 2025. Per 2025-05-01 er 1G = 130 160 kr. Skal oppdateres ved neste G-justering 2026-05-01.
> **Fix:** "1G (130 160 kr per 2025-05-01)" eller dynamisk referanse.

### M5. calcFerie 60+ bonus mangler 6G-tak

> [!warning] Medium — Feriepenge-kalkulator
> **Fil:** `core.js:4093`
> **Problem:** Over-60-bonusen (+2,3 %) beregnes på hele lønnen. Ferieloven § 10 nr 2 begrenser bonusen til feriepengegrunnlag opp til 6G.
> ```js
> const G_2026 = 130160;
> const grunnlag60 = Math.min(sal, 6*G_2026);
> const bonus = over60 ? grunnlag60 * 0.023 : 0;
> ```

### M6. Abonnements-defaults bør oppdateres

> [!warning] Medium — personlig/Abonnement
> Disney+ 109 → 119 · Netflix 129 → 149 · Viaplay 799 → 199 (default urealistisk) · Apple Music 99 → 119 · HBO Max 149 → ~179

### M7. Manglende input-validering i `calcAdj()`

> [!warning] Medium — Avgift justeringskalkulator
> **Fil:** `core.js:3478–3510`
> **Problem:** `parseInt(...) || 0` gjør at ugyldig input silent blir 0 uten feilmelding.

### M8. Ingen null-check på `setEl`-anrop

> [!warning] Medium — Avgift
> **Fil:** `core.js:3477+`
> **Problem:** Hvis HTML-id-er endres vil `setEl` feile stille. Legg til `console.warn` for manglende elementer under dev.

---

## LAV prioritet

| Nr | Seksjon | Fil:linje | Kort |
|---|---|---|---|
| L1 | boliglan | `no.js:18` + alle lang | "jan 2026"-dato-referanse i `morCostRows` blir utdatert |
| L2 | boliglan | inputs | Ingen Enter-tastehandler |
| L3 | kalkulator | `core.js:4093` | `daily = amt/220` er grov tilnærming |
| L4 | kalkulator | `core.js:4265` | Fallback-valutakurser mangler "offline"-indikator |
| L5 | kalkulator | `cm-opt` | `<div onclick>` burde vært `<button>` |
| L6 | avgift | `core.js:3489–3525` | Dupliserte `getElementById('adj-rh')` — cache en gang |
| L7 | avgift | `index.html:100+` | `<div onclick>` burde vært `<button>` |
| L8 | selskap | `index.html:171` | Samme a11y-issue |
| L9 | selskap | info-cards | Mangler `aria-expanded` på toggle-knapper |

---

## Bekreftet korrekt (2026-satser)

> [!success] Verifisert mot Skatteetaten, Kartverket, Lånekassen, NAV, KPMG, SSB

**Skatt:**
- Trinnskatt alle 5 intervaller (226 100 / 318 300 / 725 050 / 980 100 / 1 467 200 kr @ 1,7 / 4,0 / 13,7 / 16,8 / 17,8 %)
- Alminnelig inntektsskatt 22 % (18,5 % Finnmark/Nord-Troms)
- Minstefradrag 46 %, maks 95 700 kr
- Personfradrag 114 540 kr
- Formuesskatt: bunnfradrag 1,9 M (3,8 M par), 1,0 % base, 1,1 % over 21,5 M
- Verdsettelsesrabatter primær/sekundær bolig, aksjer/fond 80 %, etc.
- Oppjusteringsfaktor utbytte 1,72 (effektiv 37,84 %)
- Selskapsskatt 22 %
- Utsatt skatt-sats 22 %
- BSU: 27 500 kr/år, 300 000 kr totalt, 10 % fradrag, t.o.m. 33 år
- Reisefradrag 1,90 kr/km, egenandel 12 000, tak 120 000

**Avgift:**
- MVA 25 % / 15 % / 12 % / 0 %
- AGA-soner: Sone I 14,1 % / Ia-II 10,6 % / III 6,4 % / IV 5,1 % / V 0 %
- Justeringsregler mval. § 9-5, bagatellgrense 10 pp, kapitalvare-terskler 50 k / 100 k
- Dokumentavgift 2,5 %, tinglysingsgebyr 545 kr

**Saldoavskrivningsgrupper (a–j):** 30 / 20 / **24** / 20 / 14 / 12 / 5 / 4 / 2 / 10 % (verifisert core.js:2312)

**Bolig:**
- Gjeldsgrad maks 5×, egenkapital 10 %, stresstest maks(7 %, rente+3pp)
- Avdragskrav 2,5 % over 60 % belåning
- Rentefradrag 22 %

**Feriepenger:** 10,2 % (4 uker) / 12 % (5 uker), +2,3 % over 60 (MEN 6G-tak mangler — se M5)

**Studielån Lånekassen 2025–26:**
- Basisstøtte borteboer 15 169 / hjemmeboer 7 682 kr/mnd
- Stipend: 15 % uten grad, 40 % med grad

**Matematikk (verifisert):**
- NPV, IRR (Newton-Raphson med safeguards), payback, PI
- Annuitetslån, serielån, avdragsfri, effektiv rente (bisection)
- Saldo- og lineær avskrivning + midlertidige forskjeller (NRS 13 / IAS 12)
- ENK/AS skatt-modell (double-layer, skjermingsfradrag)
- Compound, break-even, valutagevinst
- Pensjon compound (med OTP-bug notert over)

**Språk & a11y:**
- 100 % nøkkel-dekning i alle 10 språk (no, en, zh, fr, pl, uk, ar, lt, so, ti) — unntatt "Kairo"-feilen
- RTL (arabisk) fungerer korrekt
- Ingen event-listener-lekkasjer
- `parseNum` håndterer NaN/null konsekvent

---

## Prioritert fix-rekkefølge

1. **H1** — Fiks trygdeavgift i `calcLonn` og `calcSal` samtidig (delt logikk anbefalt)
2. **H2** — Fiks OTP-grunnlag i `calcAga` + `calcPensjon` (bruk felles `G_2026`-konstant)
3. **H4** — Sparekalkulator NaN-guard
4. **H3** — Bump drivstoffpriser
5. **H5** — Fjern attestgebyr (kryssverifiser med kartverket.no først)
6. **H6** — Null-check i `uttakToggleFields`
7. **M2** — Arabisk Oslo-fiks (trivielt, én linje)
8. **M4** — 1G-hint oppdatering
9. **M5** — 6G-tak for 60+ feriepenger
10. **M1** — morCsv fees-fix
11. **M3** — calcLvu rydding
12. **M6** — Abonnements-defaults
13. **M7 + M8** — Avgift-hygiene
14. **L1–L9** — Kosmetikk/a11y senere

---

## Kilder (konsolidert)

| Kilde | URL | Dato |
|---|---|---|
| Skatteetaten — Satser 2026 | https://www.skatteetaten.no/satser/ | 2026-04-10 |
| Skatteetaten — Trygdeavgift | https://www.skatteetaten.no/en/rates/national-insurance-contributions/ | 2026-04-10 |
| Skatteetaten — MVA | https://www.skatteetaten.no/en/rates/value-added-tax/ | 2026-04-10 |
| Skatteetaten — AGA-soner | https://www.skatteetaten.no/en/rates/employers-national-insurance-contributions/ | 2026-04-10 |
| Skatteetaten — Formueskatt | https://www.skatteetaten.no/en/rates/wealth-tax/ | 2026-04-10 |
| Skatteetaten — Reisefradrag | https://www.skatteetaten.no/satser/reisefradrag/ | 2026-04-10 |
| Skatteetaten — Avskrivningssatser | https://www.skatteetaten.no/en/rates/depreciation-rates/ | 2026-04-10 |
| Skatteetaten — Oppjustering utbytte | https://www.skatteetaten.no/.../upward-adjustment-factors-on-dividends-and-other-owner-income/ | 2026-04-10 |
| Skatteetaten — BSU | https://www.skatteetaten.no/en/person/taxes/get-the-taxes-right/bank-and-loans/bsu | 2026-04-10 |
| Forskuddsutskrivingen 2026 | https://www.skatteetaten.no/en/rettskilder/type/uttalelser/uttalelser/forskuddsutskrivingen-2026/ | 2026-04-10 |
| Statsbudsjett 2026 | https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skatte-og-avgiftssatser/skattesatser-2026/id3121978/ | 2026-04-10 |
| Lovdata — Stortingsvedtak Skatt 2026 | https://lovdata.no/STV/forskrift/2025-12-18-2747 | 2026-04-10 |
| Lovdata — Dokumentavgift 2026 | https://lovdata.no/dokument/STV/forskrift/2025-12-18-2777 | 2026-04-10 |
| Kartverket — Tinglysingsgebyr | https://www.kartverket.no/eiendom/dokumentavgift-og-gebyr/tinglysingsgebyr | 2026-04-10 |
| Regjeringen — Utlånsforskriften | https://www.regjeringen.no/no/tema/okonomi-og-budsjett/finansmarkedene/utlansforskriften2/id3077676/ | 2026-04-10 |
| Lånekassen — Basisstøtte 2025-26 | https://lanekassen.no/nb-NO/stipend-og-lan/satser-og-betingelser/ | 2026-04-10 |
| NAV Grunnbeløpet (1G) | https://www.nav.no/grunnbelopet | 2026-04-10 |
| SSB — Renter banker | https://www.ssb.no/en/bank-og-finansmarked/statistikk/renter-i-banker-og-kredittforetak | 2026-04-10 |
| KPMG — Saldogruppene | https://verdtavite.kpmg.no/saldogruppene-avskrivingssatser/ | 2026-04-10 |
| GlobalPetrolPrices — Norway | https://www.globalpetrolprices.com/Norway/ | 2026-04-10 |
| Azets — HR- og lønnsregler 2026 | https://www.azets.com/no-no/ressurser/artikler/nye-regler-pa-hr-og-lonnsomradet-i-2026/ | 2026-04-10 |
| Lovdata — Ferieloven § 10 | https://lovdata.no/lov/1988-04-29-21/§10 | 2026-04-10 |
| Lovdata — Innskuddspensjonsloven § 4-7 | https://lovdata.no/lov/2000-11-24-81/§4-7 | 2026-04-10 |
| Lovdata — Skatteloven § 14-43 | https://lovdata.no/lov/1999-03-26-14/§14-43 | 2026-04-10 |

---

## Metodenotater

- Audit gjennomført i én dag via en kombinasjon av manuelle gjennomganger og tre sub-agent-delegeringer (skatt, avgift, selskap)
- Kalkulator-auditen flagget først saldogruppe c=22 %, men ved krysssjekking mot core.js:2312 og alle 10 lang-filer ble dette verifisert som en lese-feil. Koden har alltid vært korrekt (c=24 %). Funnet er markert som falsk positiv i delrapporten
- Trygdeavgift-bugen ble oppdaget uavhengig i to seksjoner (personlig + skatt), som indikerer at fiksen bør gjøres i én felles hjelpefunksjon for å unngå drift
- Sub-agentenes `Write`-kall til filsystemet feilet i ett tilfelle (første avgift-kjøring) — må verifiseres eksplisitt med `ls` etter delegering

---

**Neste revisjon:** Etter at H1–H6 er fikset bør det kjøres en `v2`-audit for å (a) verifisere at fix'ene fungerer mot testscenarioene i skatt-rapporten, (b) re-verifisere priser/satser som endrer seg kvartalsvis (abonnementspriser, drivstoff, SSB-renter).
