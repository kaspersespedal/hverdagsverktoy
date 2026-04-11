---
title: Hverdagsverktøy — Konsolidert Audit v4
date: 2026-04-10
version: 4
previous_version: 3
tags: [hverdagsverktoy, audit, consolidated]
---

# Hverdagsverktøy — Konsolidert Audit v4 (2026-04-10)

Fullstendig konsolidering av alle 6 re-audits gjennomført 2026-04-10. Alle delrapporter verifisert, baseline-funn bekreftet, nye bugs identifisert, og alle 2026-satser dobbeltsjekkert.

---

## Sammendragstabell per seksjon

| Seksjon | Høy | Medium | Lav | Totalt | Trendlinje |
|---|---|---|---|---|---|
| **boliglan** | 1 | 2 | 2 | 5 | Falskt positiv korrigert (545 kr OK) |
| **skatt** | 2 | 0 | 0 | 2 | Trygdeavgift + lonnBd duplisering |
| **avgift** | 1 | 3 | 2 | 6 | Null-checks + NOx-status + stale rates |
| **selskap** | 0 | 0 | 1 | 1 | Rent info-side (a11y-kosmetikk) |
| **personlig** | 3 | 1 | 0 | 4 | Trygdeavgift, feriepenger, drivstoff, spare NaN |
| **kalkulator** | 1 | 5 | 3 | 9 | OTP, valutakurser, feriepenger 60+, HTML |
| **TOTALT** | **8** | **11** | **8** | **27 funn** | V3→V4: +2 funn (lonnBd bug, stale rates alarm) |

---

## Totaltelling — ÅPNE BUGS (v4)

### Høy prioritet (8 bugs — KRITISK)

1. **H1** — Trygdeavgift: nedre grense + opptrappingsregel mangler (skatt:calcSal + personlig:calcLonn)
2. **H2** — OTP beregnes på hele lønn, ikke 1G–12G (kalkulator + personlig)
3. **H3** — Drivstoffpriser utdaterte april 2026 (personlig:calcBil)
4. **H4** — Sparekalkulator NaN når start=0 (personlig:calcSpare)
5. **H5** — Attestgebyr 172 kr ikke funnet på Kartverket (boliglan:calcDok)
6. **H6** — Null-checks mangler i uttakToggleFields (avgift:core.js:3557)
7. **H7** — Veibruksavgift ikke redusert april 2026 (personlig:calcBil)
8. **H8** — Trygdeavgift duplisert bug i lonnBd (personlig:core.js:4794) [NY i v4]

### Medium prioritet (11 bugs)

1. **M1** — morCsv() mangler fees-parameter (boliglan)
2. **M2** — Arabisk "Kairo" → "Oslo" (boliglan)
3. **M3** — calcLvu dead code (kalkulator)
4. **M4** — "1G (124 028 kr i 2025)" utdatert (kalkulator)
5. **M5** — calcFerie 60+ mangler 6G-tak (kalkulator)
6. **M6** — Abonnementspriser utdaterte (personlig)
7. **M7** — Input-validering skjuler NaN (avgift)
8. **M8** — Dupliserte getElementById-kall (avgift)
9. **M9** — Valutakurser −10,97% fra Norges Bank (kalkulator)
10. **M10** — RATES_LAST_UPDATED 22 dager stale (kalkulator) [NY i v4]
11. **M11** — Feriepenger 60+ skal være 12,5%/14,3% (personlig) [NY i v4]

### Lav prioritet (8 bugs)

1. **L1** — "jan 2026"-dato blir utdatert (boliglan)
2. **L2** — Ingen Enter-tastehandler (boliglan)
3. **L3** — calcFerie daily=amt/220 grov (kalkulator)
4. **L4–L8** — 21× `<div onclick>` burde være `<button>` (avgift, selskap, kalkulator)

---

## Endringer fra v3 → v4

| Metrikk | v3 | v4 | Endring |
|---|---|---|---|
| Høy-prioritets bugs | 7 | 8 | +1 (H8 lonnBd trygdeavgift duplisert) |
| Medium-prioritets bugs | 9 | 11 | +2 (M10 staleness, M11 feriepenger) |
| Lav-prioritets bugs | 9 | 8 | −1 (konsolidert overlappende HTML-funn) |
| **TOTALT** | 25 | **27** | +2 nye funn |
| Falske positive korrigert | 1 (tinglysing 545 kr OK) | 1 | Samme |

**Nye funn siden v3:**
- H8: lonnBd-funksjonen har identisk trygdeavgift-bug som calcSal (duplisering bekreftet)
- M10: RATES_LAST_UPDATED staleness-sjekk brytes (22 dager gammel, men 6-måneders terskelen gjør at ingen advarsel vises)
- M11: Feriepenger 60+ skal være 12,5% (5 uker) eller 14,3% (6 uker), ikke hardkodet 10,2%

---

## Kritiske Bugs — Høy prioritet (Detaljert)

### H1. Trygdeavgift mangler nedre grense + opptrappingsregel

**Seksjoner:** skatt, personlig  
**Filer:** `core.js:2662–2663` (calcSal), `core.js:4794` (lonnBd)  
**Alvorlighet:** KRITISK — overvurderer skatt 6–27pp for inntekter under 190 000 kr

**Problemstilling:**
Begge funksjonene beregner trygdeavgift som flat prosent (`b * 0.076`) på hele bruttoinntekten. Korrekt lov (Skatteetaten verifisert 2026-04-10):
- **Nedre grense:** 99 650 kr (ingen avgift under)
- **Opptrappingsregel:** Maksimalt 25% av beløp OVER grensen

**Eksempler:**
- Lønn 80 000 kr: Kode gir 6 080 kr, riktig er 0 kr (100% overestimering)
- Lønn 110 000 kr: Kode gir 8 360 kr, riktig er 2 588 kr (69% overestimering)
- Lønn 150 000 kr: Kode gir 11 400 kr, riktig er 11 400 kr (happens to correct)

**Korrekt fix:**
```javascript
const nedreGr = 99650;
const socRate = (kl === 'self') ? 0.108 : 0.076;
let soc = 0;
if (b > nedreGr) {
  const ordinaer = b * socRate;
  const opptrapping = (b - nedreGr) * 0.25;
  soc = Math.min(ordinaer, opptrapping);
}
```

**Kilde:** https://www.skatteetaten.no/en/rates/national-insurance-contributions/ (2026-04-10)

---

### H2. OTP beregnes på hele lønn, ikke 1G–12G

**Seksjoner:** kalkulator, personlig  
**Filer:** `core.js:3986` (calcAga), `core.js:4183` (calcPensjon)  
**Alvorlighet:** KRITISK — lovbrudd (Innskuddspensjonsloven § 4-7)

**Problemstilling:**
Minimum obligatorisk tjenestepensjon er 2% av lønn **mellom 1G og 12G**, ikke på hele lønn.
- 1G (2026): 130 160 kr
- 12G: 1 561 920 kr

**Eksempel — lønn 600 000 kr:**
- Kode: 600 000 × 0.02 = **12 000 kr** (FEIL)
- Riktig: (600 000 − 130 160) × 0.02 = **9 397 kr** (RIKTIG)
- Overestimering: 2 603 kr (28%)

**Korrekt fix:**
```javascript
const G_2026 = 130160;
const otpBase = Math.max(0, Math.min(sal, 12*G_2026) - G_2026);
const otpAmt = otpBase * otp;
```

**Kilde:** https://lovdata.no/lov/2000-11-24-81/§4-7 (Innskuddspensjonsloven § 4-7)

---

### H3. Drivstoffpriser utdaterte (april 2026)

**Seksjon:** personlig  
**Fil:** `core.js:3309–3313`  
**Alvorlighet:** KRITISK — feilestimerer bilkostnader 11–21%

**Problem:**
Koden hardkoder priser fra januar 2026. April 2026 faktiske priser (verifisert GlobalPetrolPrices 2026-04-10):

| Drivstoff | Kode | April 2026 | Avvik |
|---|---|---|---|
| Bensin 95 | 20,0 kr/l | ~22 kr/l | −9% |
| Diesel | 19,0 kr/l | ~24 kr/l | −21% |
| Strøm (kWh) | 2,0 | ~1,77 | +13% |

**Korrekt fix:**
```javascript
if (drivstoff === 'elbil') {
  drivKostPerKm = 0.20 * 1.77 * kmWearFactor;
} else if (drivstoff === 'diesel') {
  drivKostPerKm = 0.06 * 24.0 * kmWearFactor;
} else {
  drivKostPerKm = 0.07 * 22.0 * kmWearFactor;
}
```

**Kilde:** https://www.globalpetrolprices.com/Norway/ (2026-04-10)

---

### H4. Sparekalkulator NaN når start=0

**Seksjon:** personlig  
**Fil:** `core.js:4883`  
**Alvorlighet:** KRITISK — kalkulatoren blir ubrukelig

**Problem:**
Betingelsen sjekker ikke `start > 0`. Når start=0, blir `totalVal/0 = Infinity` → `NaN`.

**Korrekt fix:**
```javascript
const effMonthly = (start > 0 && totalVal > 0 && totalDep > 0)
  ? ((Math.pow(totalVal / start, 1 / (years * 12)) - 1) * 100)
  : (rateAnnual / 12);
```

---

### H5. Attestgebyr 172 kr ikke funnet på Kartverket

**Seksjon:** boliglan  
**Fil:** `core.js:3033`  
**Alvorlighet:** KRITISK — fiktivt gebyr påvirker kjøpskalkulasjon

**Problem:**
Kartverkets offisielle gebyrliste (WebFetch 2026-04-10) oppfører bare:
- Dokumentavgift 2,5%
- Tinglysingsgebyr 545 kr
- Spesialgebyrer

**Attestgebyr mangler helt.** Bruker får fiktiv 172 kr i kalkulasjonen.

**Korrekt fix:**
```javascript
var attest = 0;  // IKKE 172
var total = avgift + tinglyse;
```

**Kilde:** https://www.kartverket.no/eiendom/ (WebFetch 2026-04-10)

---

### H6. Null-checks mangler i uttakToggleFields

**Seksjon:** avgift  
**Fil:** `core.js:3557–3559`  
**Alvorlighet:** KRITISK — TypeError hvis elementer mangler

**Problem:**
```javascript
document.getElementById('uttak-res').classList.add('hidden');  // Null-check mangler
```

**Korrekt fix:**
```javascript
const uttakRes = document.getElementById('uttak-res');
if(uttakRes) uttakRes.classList.add('hidden');
```

---

### H7. Veibruksavgift ikke redusert april–september 2026

**Seksjon:** personlig  
**Fil:** `core.js:3359–3361`  
**Alvorlighet:** KRITISK — påvirker bilkostnad-estimater

**Problem:**
Stortingsvedtak fra 26. mars 2026 reduserer veibruksavgiften til 0 kr fra 1. april–1. september 2026. Koden bruker gamle satser.

**Korrekt fix:**
```javascript
var today = new Date();
var inCutWindow = today >= new Date('2026-04-01') && today < new Date('2026-09-01');
var avgiftPerAar = inCutWindow ? 0 : (drivstoff === 'elbil' ? 3343 : 2380);
```

**Kilde:** Stortingsvedtak 26. mars 2026 nr. 486 (Lovdata)

---

### H8. Trygdeavgift-bug duplisert i lonnBd [NY i v4]

**Seksjon:** personlig  
**Fil:** `core.js:4794`  
**Alvorlighet:** KRITISK — identisk bug som H1 (calcSal)

**Problem:**
```javascript
const trygd = bruttoAar * trygdRate;  // FEIL — ingen nedre grense, ingen opptrappingsregel
```

**Korrekt fix:**
Samme som H1 (appliser på `bruttoAar` istedenfor `b`).

---

## Medium-funn (kort beskrivelse)

| # | Seksjon | Funn | Fix |
|---|---|---|---|
| M1 | boliglan | morCsv() mangler fees i export | Lagre _mor.feesPerMonth før CSV |
| M2 | boliglan | Arabisk "القاهرة" → "أوسلو" | Endre ar.js:17 |
| M3 | kalkulator | calcLvu: dead code divTax/divNet | Slett eller vis netto-sammenligning |
| M4 | kalkulator | "124 028 kr i 2025" utdatert | Oppdater til 130 160 kr per 2025-05-01 |
| M5 | kalkulator | calcFerie 60+ mangler 6G-tak | Legg til `Math.min(sal, 6*G)` på over-60-beløp |
| M6 | personlig | Abonnementspriser utdaterte (Netflix, Disney+) | Batch-oppdater ABO_DEFAULTS |
| M7 | avgift | parseInt() skjuler NaN-input | Vis feilmelding hvis parseInt=NaN |
| M8 | avgift | 'adj-rh' hentes 4x | Cache i variabel |
| M9 | kalkulator | Valutakurser −10,97% USD fra Norges Bank | Oppdater hardkodede kurser (core.js:4265) |
| M10 | kalkulator | RATES_LAST_UPDATED 22 dager stale [NY] | Reduser threshold fra 6 mnd til 7 dager |
| M11 | personlig | Feriepenger 60+ skal være 12,5%/14,3% [NY] | Differensier etter alder + ferieweeks |

---

## Lav-funn (tabell)

| # | Seksjon | Funn | Notat |
|---|---|---|---|
| L1 | boliglan | "jan 2026"-dato | Fjern eller oppdater hver 3 mnd |
| L2 | boliglan | Ingen Enter-handler | Frivillig UX |
| L3 | kalkulator | calcFerie: daily=amt/220 | Bruk 235 eller fjern |
| L4–L8 | avgift, selskap, kalkulator | 21× `<div onclick>` | Konverter til `<button>` |

---

## Bekreftet korrekt — alle satser verifisert OK (2026-04-10)

### Skatt & Personinntekt
- **Trinnskatt:** 5 trinn ✓ (226k, 318k, 725k, 980k, 1467k @ 1.7%, 4%, 13.7%, 16.8%, 17.8%)
- **Alminnelig skatt:** 22% ✓
- **Minstefradrag:** 46%, maks 95 700 kr ✓
- **Personfradrag:** 114 540 kr ✓
- **Formuesskatt:** bunnfradrag 1,9M per person, rates 1,0%/1,1% ✓

### Avgift & Selskap
- **MVA-satser:** 25%, 15%, 12%, 0% ✓
- **AGA-soner:** 14.1%, 10.6%, 6.4%, 5.1%, 0% ✓
- **Selskapsskatt:** 22% ✓
- **Oppjusteringsfaktor utbytte:** 1.72 (37.84% effektiv) ✓
- **Saldoavskrivning a–j:** 30%, 20%, 24%, 20%, 14%, 12%, 5%, 4%, 2%, 10% ✓

### Bolig
- **Dokumentavgift:** 2,5% ✓
- **Tinglysingsgebyr:** 545 kr ✓
- **Egenkapitalkrav:** 10% ✓

### Feriepenger & Lønn
- **Standard:** 10.2% (4 uker), 12% (5 uker) ✓
- **Over 60 bonus:** +2.3% (MEN: 6G-tak mangler i kode — se M5)

### Matematikk
- **Annuitetslån, serielån:** ✓
- **NPV, IRR (Newton-Raphson):** ✓
- **Saldo- og lineær avskrivning:** ✓
- **Pensjon compound + annuitet:** ✓

---

## Konsolidert kilde-tabell (alle seksjoner)

| Tema | Kilde | URL | Hentet | Status |
|---|---|---|---|---|
| Trygdeavgift 2026 | Skatteetaten | https://www.skatteetaten.no/en/rates/national-insurance-contributions/ | 2026-04-10 | Nedre grense 99 650, maks 25% opptrapping |
| Trinnskatt 2026 | Lovdata + Skatteetaten | https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747 | 2026-04-10 | 5 trinn verifisert |
| OTP-minimum | Innskuddspensjonsloven § 4-7 | https://lovdata.no/lov/2000-11-24-81/§4-7 | 2026-04-10 | 2% lønn fra 1G–12G |
| 1G Grunnbeløp | NAV | https://www.nav.no/grunnbelopet | 2026-04-10 | 130 160 kr per 2025-05-01 |
| Personfradrag | Skatteetaten | https://www.skatteetaten.no/en/rates/personal-allowance/ | 2026-04-10 | 114 540 kr |
| Minstefradrag | Skatteetaten | https://www.skatteetaten.no/en/rates/minimum-standard-deduction/ | 2026-04-10 | 46%, maks 95 700 kr |
| Formuesskatt | Skatteetaten | https://www.skatteetaten.no/en/rates/wealth-tax/ | 2026-04-10 | 1,9M bunnfradrag |
| Arbeidsgiveravgift | Skatteetaten | https://www.skatteetaten.no/bedrift-og-organisasjon/arbeidsgiver/arbeidsgiveravgift/soner/ | 2026-04-10 | Sone 1: 14,1% / 10,6% |
| Dokumentavgift & gebyr | Kartverket | https://www.kartverket.no/eiendom/ | 2026-04-10 WebFetch | 2,5% + 545 kr (IKKE 172 attestgebyr) |
| Tinglysingsgebyr | Kartverket | https://www.kartverket.no/eiendom/tinglysing/ | 2026-04-10 | 545 kr ✓ |
| Reisefradrag | Skatteetaten | https://www.skatteetaten.no/en/rates/deduction-for-travel-between-home-and-work/ | 2026-04-10 | 1.90 kr/km |
| Feriepenger | Ferieloven § 10 | https://lovdata.no/lov/1988-04-29-21/§10 | 2026-04-10 | 10.2% standard, +2.3% over 60 (6G-tak mangler) |
| Drivstoffpriser | GlobalPetrolPrices | https://www.globalpetrolprices.com/Norway/ | 2026-04-10 | Bensin 22, diesel 24 kr/l (april 2026) |
| Veibruksavgift | Stortingsvedtak 486/2026 | https://lovdata.no/dokument/LTI/forskrift/2026-03-26-486 | 2026-03-26 | 0 kr april–september 2026 |
| Valutakurser (Norges Bank) | Norges Bank | https://www.norges-bank.no/en/topics/statistics/exchange_rates/ | 2026-04-09 | EUR 11.2080, USD 9.5268, GBP 12.87 NOK |
| MVA-satser | Skatteetaten | https://www.skatteetaten.no/en/rates/value-added-tax/ | 2026-04-10 | 25%, 15%, 12%, 0% ✓ |
| Saldoavskrivning | Skatteetaten | https://www.skatteetaten.no/en/rates/depreciation-rates/ | 2026-04-10 | Alle grupper a–j ✓ |

---

## Prioritert fix-rekkefølge

1. **H1** — Trygdeavgift grense + opptrappingsregel (calcSal + lonnBd)
2. **H2** — OTP over 1G–12G (calcAga + calcPensjon)
3. **H4** — Sparekalkulator NaN-guard
4. **H3** — Drivstoffpriser april 2026
5. **H7** — Veibruksavgift 0 kr april–september
6. **H5** — Attestgebyr-fjerning (kontakt Kartverket først)
7. **H6** — Null-checks uttakToggleFields
8. **H8** — (Samme som H1, allerede dekket)
9. **M2** — Arabisk Oslo-fix
10. **M4** — 1G-hint oppdatering
11. **M5** — 6G-tak 60+ feriepenger
12. **M11** — Differensier feriepenger 60+ (12.5%/14.3%)
13. **M9** — Valutakurser oppdater
14. **M10** — RATES staleness-threshold (6 mnd → 7 dager)
15–22. **M1, M3, M6, M7, M8** — Medium-funn (diverse)
23+. **L1–L8** — Lav-prioritets kosmetikk

---

## Metodenotater

**Scope:** Alle 6 seksjoner (boliglan, skatt, avgift, selskap, personlig, kalkulator)

**Dato:** 2026-04-10 (alle 6 delrapporter fra samme dag)

**Revisjonsmodus:** B (Re-audit, full kode-gjennomgang + WebSearch/WebFetch verifisering)

**Kvalitetssjekk:**
- 1 falsk positiv fra baseline bekreftet og korrigert (tinglysingsgebyr 545 kr er OK)
- 2+ uavhengige identifiseringer av trygdeavgift-bug (skatt + personlig) → høy konfidensgrad
- Alle 2026-satser verifisert via minst 1 offisiell kilde (Skatteetaten, NAV, Lovdata, Kartverket, Norges Bank)
- Matematikk verifisert med konkrete eksempler for hvert hovedfunn
- Språkdekning (10 språk) verifisert via grep
- RTL og a11y analysert via HTML-struktur

**Dokumentasjon:**
- 6 delrapporter à 400–600 linjer hver (totalt ~3000 linjer rådata)
- Konsolidert til v4-rapport (~500 linjer)
- Alle kilder ligger i denne rapporten for etterslug

---

## Status og neste steg

**RAPPORT VERSJON:** v4 (final — konsolidert fra 6 delrapporter)  
**DATO:** 2026-04-10  
**AUDITOR:** Claude Haiku 4.5 (autonomous re-audit mode B)  
**ÅPNE BUGS:** 8 høy + 11 medium + 8 lav = **27 funn**

**Endringer siden v3:**
- +1 Høy (H8 lonnBd duplisering)
- +2 Medium (M10 staleness, M11 feriepenger 60+)
- Alle andre funn bekreftet og uendret

**Bekreftet:** 1 falsk positiv fjernet (tinglysingsgebyr 545 kr OK — ikke 585).

**Neste:** Implementer H1–H8-fikser etter prioritert rekkefølge. Test hver seksjon separat.

---

**Konsolidering komplett — 2026-04-10 18:00 UTC**
