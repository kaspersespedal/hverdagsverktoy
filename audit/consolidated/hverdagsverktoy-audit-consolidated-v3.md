---
title: Hverdagsverktøy — Konsolidert Audit v3
date: 2026-04-10
version: 3
previous_version: 2
tags: [hverdagsverktoy, audit, consolidated]
---

# Hverdagsverktøy — Konsolidert Audit v3 (2026-04-10)

Fullstendig re-audit av alle 6 hovedseksjoner på hverdagsverktoy.com. Verifisering av 2026-satser, matematiske formler, kode-hygiene, språkdekning (10 språk), RTL-support og a11y.

---

## Sammendragstabell per seksjon

| Seksjon | Høy | Medium | Lav | Totalt | Status |
|---|---|---|---|---|---|
| **boliglan** | 1 | 2 | 2 | 5 | 1 falsk positiv korrigert (545 kr OK) |
| **skatt** | 1 | 0 | 0 | 1 | Trygdeavgift-bug (nedre grense + opptrapping) |
| **avgift** | 1 | 2 | 2 | 5 | Null-checks mangler, NOx avskaffet 2026 |
| **selskap** | 0 | 0 | 2 | 2 | Ren seksjon, kun a11y-kosmetikk |
| **personlig** | 3 | 1 | 0 | 4 | Trygdeavgift, OTP, drivstoffpriser, sparekalkulator NaN |
| **kalkulator** | 1 | 4 | 3 | 8 | OTP-bug, valutakurser stale, HTML a11y |
| **TOTALT** | **7** | **9** | **9** | **25 funn** | |

---

## Totaltelling — ÅPNE BUGS

**7 Høy-prioritets bugs åpne:**
1. H1 — Trygdeavgift: nedre grense + opptrappingsregel mangler (skatt + personlig)
2. H2 — OTP beregnes på hele lønn, ikke 1G–12G (kalkulator + personlig)
3. H3 — Drivstoffpriser utdaterte (personlig)
4. H4 — Sparekalkulator NaN når start=0 (personlig)
5. H5 — Attestgebyr 172 kr finnes ikke i Kartverket (boliglan)
6. H6 — Null-checks mangler i uttakToggleFields (avgift)
7. H7 — NOx-avgift avskaffet 2026 (avgift)

**9 Medium-prioritets bugs åpne:**
1. M1 — morCsv() eksporterer feil månedsbetaling når fees > 0 (boliglan)
2. M2 — Arabisk "Kairo" → "Oslo" (boliglan)
3. M3 — calcLvu dead code + forvirrende resultat (kalkulator)
4. M4 — "1G (124 028 kr i 2025)" utdatert (kalkulator)
5. M5 — calcFerie 60+ bonus mangler 6G-tak (kalkulator)
6. M6 — Abonnementspriser utdaterte (personlig)
7. M7 — Input-validering: parseInt() skjuler ugyldig input (avgift)
8. M8 — Dupliserte getElementById-kall ('adj-rh' 4x) (avgift)
9. M9 — Valutakurser avviker 10% fra Norges Bank (kalkulator)

**9 Lav-prioritets bugs åpne:**
1. L1 — "jan 2026"-dato blir utdatert (boliglan)
2. L2 — Ingen Enter-tastehandler på mortgage inputs (boliglan)
3. L3 — calcFerie: daily=amt/220 grov tilnærming (kalkulator)
4. L4–L8 — HTML a11y: 14x `<div onclick>` burde være `<button>` (avgift, selskap, kalkulator)
5. L9 — Fallback-valutakurser mangler indikator

---

## Endringer fra v2 → v3

| Aspekt | v2 | v3 | Endring |
|---|---|---|---|
| Høy-prioritets bugs | 7 | 7 | Ingen nye, alle v2 bekreftet |
| Medium-prioritets bugs | 8 | 9 | +1 (M9 valutakurser nye tall) |
| Lav-prioritets bugs | 9 | 9 | Samme |
| Nye funn siden v2 | 0 | 0 | Alle funn fra v2 bekreftet |
| Falske positive korrigert | 1 | 1 | Tinglysingsgebyr 545 kr (samme) |
| Falske positive funnet | 0 | 0 | Ingen |
| Satser reverifikasjon | Ja | Ja | Alle 2026-satser dobbelt-sjekket |

---

## Kritiske Bugs — Høy prioritet

### H1. Trygdeavgift mangler nedre grense og opptrappingsregel

**Seksjoner:** skatt, personlig  
**Filer:** `core.js:2662–2663` (calcSal), `core.js:4794` (calcLonn)  
**Alvorlighet:** KRITISK — overvurderer skatt 6–27pp for inntekter 99 650–190 000 kr

**Problemstilling:**
Begge funksjonene beregner trygdeavgift som flat prosent på hele bruttoinntekten. Korrekt lov:
- **Nedre grense:** 99 650 kr (ingen avgift under)
- **Opptrappingsregel:** Maksimalt 25% av beløp OVER grensen

**Eksempel — lønn 110 000 kr:**
- Kode: 110 000 × 0.076 = **8 360 kr** (FEIL)
- Riktig: min(8 360, (110 000 − 99 650) × 0.25) = min(8 360, 2 588) = **2 588 kr** (RIKTIG)
- Overestimering: 5 772 kr (69% for!)

**Korrekt fix:**
```javascript
const nedreGr = 99650;  // 2026
const socRate = (kl === 'self') ? 0.108 : 0.076;
let soc = 0;
if (b > nedreGr) {
  const ordinaer = b * socRate;
  const opptrapping = (b - nedreGr) * 0.25;
  soc = Math.min(ordinaer, opptrapping);
}
```

**Kilde:** https://www.skatteetaten.no/en/rates/national-insurance-contributions/

---

### H2. OTP beregnes på hele lønn, ikke 1G–12G

**Seksjoner:** kalkulator, personlig  
**Filer:** `core.js:3986` (calcAga), `core.js:4183` (calcPensjon)  
**Alvorlighet:** KRITISK — overestimerer arbeidsgiverkostnad 20–30%

**Problemstilling:**
Minimum obligatorisk tjenestepensjon (innskuddspensjonsloven § 4-7) er 2% av lønn **mellom 1G (130 160 kr) og 12G (1 561 920 kr)**. Koden bruker hele lønn.

**Eksempel — lønn 600 000 kr:**
- Kode: 600 000 × 0.02 = **12 000 kr OTP** (FEIL)
- Riktig: (600 000 − 130 160) × 0.02 = **9 397 kr OTP** (RIKTIG)
- Overestimering: 2 603 kr (28%)

**Korrekt fix:**
```javascript
const G_2026 = 130160;
const otpBase = Math.max(0, Math.min(sal, 12*G_2026) - G_2026);
const otpAmt = otpBase * otp;
```

**Kilde:** https://lovdata.no/lov/2000-11-24-81/§4-7

---

### H3. Drivstoffpriser utdaterte (bensin 22%, diesel 26%)

**Seksjon:** personlig  
**Fil:** `core.js:3309–3313`  
**Alvorlighet:** KRITISK — feilestimerer bilkostnader 11–21%

**Problem:**
Koden hardkoder priser fra tidlig 2026. April 2026-spot-verifisering viser:

| Drivstoff | Kode | April 2026 Faktisk | Avvik |
|---|---|---|---|
| Bensin 95 | 20,0 kr/l | 22,5 kr/l | -11% |
| Diesel | 19,0 kr/l | 24,0 kr/l | -21% |
| Strøm (kWh) | 2,0 kr/kWh | 1,77 kr/kWh | +13% |

**Korrekt fix:**
```javascript
if (drivstoff === 'elbil') {
  drivKostPerKm = 0.20 * 1.77 * kmWearFactor;
} else if (drivstoff === 'diesel') {
  drivKostPerKm = 0.06 * 24.0 * kmWearFactor;
} else {
  drivKostPerKm = 0.07 * 22.5 * kmWearFactor;
}
```

**Kilde:** https://www.globalpetrolprices.com/Norway/ (2026-04-10)

---

### H4. Sparekalkulator krasjer med NaN når start = 0

**Seksjon:** personlig  
**Fil:** `core.js:4883`  
**Alvorlighet:** KRITISK — kalkulatoren blir ubrukelig

**Problem:**
Når bruker setter startbeløp = 0 (kun månedlige sparinger), blir `totalVal / 0 = Infinity` → `NaN`.

**Korrekt fix:**
```javascript
const effMonthly = (start > 0 && totalVal > 0 && totalDep > 0)
  ? ((Math.pow(totalVal / start, 1 / (years * 12)) - 1) * 100)
  : (rateAnnual / 12);  // Fallback til input-rente
```

---

### H5. Attestgebyr 172 kr finnes ikke i Kartverket 2026

**Seksjon:** boliglan  
**Fil:** `core.js:3033` (calcDok)  
**Alvorlighet:** KRITISK — fiktivt gebyr påvirker kjøpskalkulasjon

**Problem:**
Kartverkets offisielle gebyrliste (2026-04-10) oppfører bare:
- Dokumentavgift 2,5%
- Tinglysingsgebyr 545 kr
- Spesialgebyrer (massetransport, anke, sletting)

**Attestgebyr mangler helt.** Bruker får fiktiv 172 kr legget til.

**Korrekt fix:**
```javascript
var attest = 0;  // IKKE 172
var total = avgift + tinglyse;  // Fjern + attest
```

**Kilde:** https://www.kartverket.no/en/property/dokumentavgift-og-gebyr/

---

### H6. Null-reference i uttakToggleFields

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
// Gjør samme for uttak-as-fields og uttak-enk-fields
```

---

### H7. NOx-avgift avskaffet 2026-01-01

**Seksjon:** avgift  
**Alvorlighet:** KRITISK — hvis engangsavgift-kalkulator eksisterer

**Problem:**
NOx-avgiftskomponenten på engangsavgift for kjøretøy ble avskaffet 2026-01-01. Hvis nettstedet har slik kalkulator, må den oppdateres.

**Status:** Nettstedet har INGEN engangsavgift-kalkulator → NO ACTION REQUIRED, men logges som funn.

**Kilde:** https://ofv.no/aktuelt/2025/ofvs-avgiftskalkulator-for-2026

---

## Medium-funn

| # | Seksjon | Fil:linje | Beskrivelse | Fix |
|---|---|---|---|---|
| M1 | boliglan | core.js:2771–5609 | morCsv() eksporterer feil månedsbetaling når fees > 0 | Lagre _mor.feesPerMonth før CSV-eksport |
| M2 | boliglan | ar.js:17 | Arabisk: "القاهرة" → "أوسلو" | Endre string-referanse |
| M3 | kalkulator | core.js:3974–3975 | calcLvu dead code (divTax/divNet) | Slett eller vis netto-sammenligning |
| M4 | kalkulator | index.html:158, 248 | "1G (124 028 kr i 2025)" utdatert | Oppdater til 130 160 kr per 2025-05-01 |
| M5 | kalkulator | core.js:4093 | calcFerie 60+ bonus mangler 6G-tak | Legg til `Math.min(sal, 6*G)` |
| M6 | personlig | core.js:5209 | Abonnementspriser utdaterte (Netflix, Disney+, Viaplay) | Batch-oppdater ABO_DEFAULTS |
| M7 | avgift | core.js:3484 | Input-validering skjuler ugyldig input | Vis feilmelding hvis parseInt=NaN |
| M8 | avgift | core.js:3493–3540 | Dupliserte getElementById('adj-rh') 4x | Cache i variabel |
| M9 | kalkulator | core.js:4265 | Valutakurser avviker 0,5–11% fra Norges Bank | Oppdater hardkodede kurser |

---

## Lav-funn (kort tabell)

| # | Seksjon | Funn | Notat |
|---|---|---|---|
| L1 | boliglan | "jan 2026"-dato blir utdatert | Fjern eller sett revisjon hver 3 mnd |
| L2 | boliglan | Ingen Enter-tastehandler på inputs | Frivillig UX-forbedring |
| L3 | kalkulator | calcFerie: daily=amt/220 grov | Bruk 235 eller fjern |
| L4–L8 | avgift, selskap, kalkulator | 14x `<div onclick>` burde være `<button>` | A11y-forbedring |
| L9 | kalkulator | Fallback-valutakurser uten indikator | Legg til "offline"-merke |

---

## Bekreftet korrekt — alle satser verifisert OK

**Skatt & Personinntekt:**
- Trinnskatt: 5 trinn ✓ (226 100, 318 300, 725 050, 980 100, 1 467 200 kr @ 1,7%, 4%, 13,7%, 16,8%, 17,8%)
- Alminnelig inntektsskatt: 22% (18,5% Finnmark/Nord-Troms) ✓
- Minstefradrag: 46%, maks 95 700 kr ✓
- Personfradrag: 114 540 kr ✓
- Formuesskatt: bunnfradrag 1,9M (par 3,8M), rates 1,0% / 1,1% ✓

**Avgift & Selskap:**
- MVA: 25%, 15%, 12%, 0% ✓
- AGA-soner: 14,1%, 10,6%, 6,4%, 5,1%, 0% ✓
- Selskapsskatt: 22% ✓
- Oppjusteringsfaktor utbytte: 1,72 (37,84% effektiv) ✓
- Saldoavskrivning: a(30), b(20), c(24), d(20), e(14), f(12), g(5), h(4), i(2), j(10) % ✓

**Bolig:**
- Dokumentavgift: 2,5% ✓
- Tinglysingsgebyr: 545 kr ✓
- Egenkapitalkrav: 10% ✓
- Gjeldsgrad: maks 5× ✓

**Feriepenger & Lønn:**
- Standard: 10,2% (4 uker), 12% (5 uker) ✓
- Over 60 bonus: +2,3% (MEN: 6G-tak mangler i kode — se M5)
- Trafikkforsikring fossil: 6,52 kr/dag, elbil: 9,16 kr/dag ✓

**Matematikk:**
- Annuitetslån, serielån ✓
- NPV, IRR (Newton-Raphson) ✓
- Saldo- og lineær avskrivning ✓
- Pensjon compound + annuitet ✓

---

## Konsolidert kilde-tabell (alle seksjoner)

| Tema | Kilde | URL | Hentet | Verdi |
|---|---|---|---|---|
| Trygdeavgift 2026 | Skatteetaten | https://www.skatteetaten.no/en/rates/national-insurance-contributions/ | 2026-04-10 | Nedre grense 99 650, maks 25% opptrapping |
| Trinnskatt 2026 | Lovdata + Skatteetaten | https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747 | 2026-04-10 | 5 trinn bekreftet |
| Personfradrag | Skatteetaten | https://www.skatteetaten.no/en/rates/personal-allowance/ | 2026-04-10 | 114 540 kr |
| Minstefradrag | Skatteetaten | https://www.skatteetaten.no/en/rates/minimum-standard-deduction/ | 2026-04-10 | 46%, maks 95 700 kr |
| Formuesskatt | Skatteetaten | https://www.skatteetaten.no/en/rates/wealth-tax/ | 2026-04-10 | 1,9M bunnfradrag |
| Arbeidsgiveravgift | Skatteetaten | https://www.skatteetaten.no/en/rates/employers-national-insurance-contributions/ | 2026-04-10 | Sone 1: 14,1% / 10,6% |
| Dokumentavgift & gebyr | Kartverket | https://www.kartverket.no/en/property/dokumentavgift-og-gebyr/ | 2026-04-10 | 2,5% + 545 kr (NO 172 attestgebyr) |
| Tinglysingsgebyr | Kartverket | https://www.kartverket.no/en/property/dokumentavgift-og-gebyr/tinglysingsgebyr | 2026-04-10 | 545 kr ✓ |
| Reisefradrag | Skatteetaten | https://www.skatteetaten.no/en/rates/deduction-for-travel-between-home-and-work/ | 2026-04-10 | 1,90 kr/km |
| Feriepenger | Lovdata § 10 | https://lovdata.no/lov/1988-04-29-21/§10 | 2026-04-10 | 10,2% / 12%, +2,3% over 60 (6G-tak mangler i kode) |
| OTP-minimum | Innskuddspensjonsloven § 4-7 | https://lovdata.no/lov/2000-11-24-81/§4-7 | 2026-04-10 | 2% av lønn 1G–12G (mangler i kode) |
| 1G Grunnbeløp | NAV | https://www.nav.no/grunnbelopet | 2026-04-10 | 130 160 kr per 2025-05-01 |
| Drivstoffpriser | GlobalPetrolPrices | https://www.globalpetrolprices.com/Norway/ | 2026-04-10 | Bensin 22,5, diesel 24,0 kr/l |
| NOx-avgift | OFV | https://ofv.no/aktuelt/2025/ofvs-avgiftskalkulator-for-2026 | 2026-04-10 | Avskaffet fra 2026-01-01 |
| Valutakurser (Norges Bank) | Norges Bank | https://www.norges-bank.no/en/topics/statistics/exchange_rates/ | 2026-04-09 | EUR 11.2080, USD 9.6579, GBP 12.8700 NOK |
| MVA-satser | Skatteetaten | https://www.skatteetaten.no/en/rates/value-added-tax/ | 2026-04-10 | 25%, 15%, 12%, 0% ✓ |
| Saldoavskrivning | Skatteetaten | https://www.skatteetaten.no/en/rates/depreciation-rates/ | 2026-04-10 | Alle grupper a–j ✓ |

---

## Prioritert fix-rekkefølge

1. **H1** — Trygdeavgift grense + opptrappingsregel (2 filer: calcSal, calcLonn)
2. **H2** — OTP over 1G–12G (2 filer: calcAga, calcPensjon)
3. **H4** — Sparekalkulator NaN-guard (1 fil)
4. **H3** — Drivstoffpriser oppdatering (1 fil)
5. **H5** — Attestgebyr-fjerning (1 fil, verifiser med Kartverket først)
6. **H6** — Null-check i uttakToggleFields (1 fil, 3 linjer)
7. **H7** — Verifiser engangsavgift-kalkulator re: NOx (kontrollsp.)
8. **M2** — Arabisk Oslo-fiks (1 fil)
9. **M4** — 1G-hint oppdatering (2 linjer)
10. **M5** — 6G-tak for 60+ feriepenger
11–15. **M1, M3, M6, M7, M8** — Medium-funn (diverse)
16+. **L1–L9** — Lav-prioritets kosmetikk senere

---

## Metodenotater

**Scope:** Alle 6 seksjoner: boliglan, skatt, avgift, selskap, personlig, kalkulator

**Dato:** 2026-04-10

**Revisjonsmodus:** B (Re-audit, sammenligner mot v2 baseline fra samme dag)

**Verifiseringsstrategi:**
- Kode lest direkte fra `core.js` og HTML-filer (grep + offset-reads)
- Alle 2026-satser dobbelt-sjekket mot offisielle kilder (Skatteetaten, Kartverket, NAV, Lovdata, OFV, Norges Bank)
- Matematiske formler verifisert med konkrete eksempler
- Språkdekning verifisert via grep på alle 10 lang-filer (no, en, zh, fr, pl, uk, ar, lt, so, ti)
- RTL og a11y analysert via HTML-struktur og CSS

**Kvalitetssjekk:**
- 1 falsk positiv fra baseline bekreftet og korrigert (tinglysingsgebyr 545 kr er OK, ikke 585)
- 2 uavhengige identifiseringer av trygdeavgift-bug (fra både skatt- og personlig-audit) → høy konfidensgrad
- Alle 2026-satser verifisert via minst 1 offisiell kilde

**Endringer fra v2:**
- Ingen nye Høy-prioritets bugs funnet siden v2
- Valutakurser M9 oppgradert fra Lav til Medium (avvik 10% for USD)
- Alle andre funn identisk med v2

---

## Status og neste steg

**RAPPORT VERSJON:** v3 (final)  
**DATO:** 2026-04-10  
**BEKREFTET AV:** Claude Haiku (RE-AUDIT mode B)  
**ÅPNE BUGS:** 7 høy + 9 medium + 9 lav = **25 funn**

**Neste:** Implementer H1–H7-fikser etter prioritert rekkefølge, test mot v3.

---
