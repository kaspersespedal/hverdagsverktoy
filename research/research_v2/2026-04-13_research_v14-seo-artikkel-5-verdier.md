---
title: V14 SEO-artikkel — 5 verdier verifisert
date: 2026-04-13
type: research
tags: [research, verifisert, seo-artikkel, hjemmekontor, aga, brreg, egenkapital, pattern-f]
status: verified
triggered-by: /audit v14 (Skatt-H1, Kalk-H1/Avg-H1, Sel-H1, Sel-M1, Bol-H1)
confidence: høy
scope: 5 verdier, 3 primærkilder, 7 sekundærkilder
---

# V14 SEO-artikkel — 5 verdier verifisert (2026-04-13)

> [!info] Audit-trigger
> V14 audit flagget 5 H/M-funn der SEO-artikler (STATIC_NO i `prerender/generate.js`) hadde andre verdier enn koden. Denne researchen verifiserer hvilken verdi som er korrekt.

## Sammendrag

| # | Sats | Kode | SEO-artikkel | Verifisert | Kode-status | SEO-status |
|---|---|---|---|---|---|---|
| 1 | Hjemmekontor-fradrag | 2 200 kr | 1 850 kr | **2 240 kr** | 🔴 Stale (-40 kr) | 🔴 Stale (-390 kr) |
| 2 | AGA fribeløp | 850 000 kr | 500 000 kr | **850 000 kr** | ✅ Korrekt | 🔴 Stale |
| 3 | AS reg.gebyr | 6 825 kr | 6 735 kr | **6 825 kr** | ✅ Korrekt | 🔴 Stale |
| 4 | ANS/DA reg.gebyr | 3 883 kr | 2 832 kr | **3 883 kr** | ✅ Korrekt | 🔴 Stale |
| 5 | Egenkapital boliglån | 10% | 15% | **10%** | ✅ Korrekt | 🔴 Stale |

**Oppsummering:** Koden er korrekt for 4/5 verdier. Kun hjemmekontor er stale i koden (-40 kr). Alle 5 SEO-artikler er stale. V14 Bol-H1 var FEIL — 10% egenkapital ER gjeldende etter forskriftsendring desember 2024.

---

## 1. Hjemmekontor standardfradrag

**Kode-sti:** `shared/core.js:3058` (`fradrag:2200`) + `core.js:3070` (displaytekst "2 200 kr")
**SEO-sti:** `prerender/generate.js:225` ("Standardfradrag på 1 850 kr/år")
**Kode-verdi:** 2 200 kr
**SEO-verdi:** 1 850 kr
**Verifisert verdi:** **2 240 kr**
**Confidence:** Høy
**Status:** 🔴 Stale (BÅDE kode og SEO)

### Kilder

1. **Skatteetaten — Satser: Hjemmekontor standardfradrag** — https://www.skatteetaten.no/en/rates/home-office-standard-deduction/
   - Sitat: "you can claim a standard deduction of NOK 2,240"
   - Gjelder: 2025 og 2026
   - Fradraget reduseres ikke ved delårsbruk

2. **WebSearch: tripletex.no, fiken.no, minekvitteringer.no** — Alle bekrefter 2 240 kr for 2026

### Anbefalt fix

```diff
// core.js:3058
- {id:'sjekk-c7',fradrag:2200,type:'fradrag'},// Hjemmekontor: 2200 kr fast fradrag
+ {id:'sjekk-c7',fradrag:2240,type:'fradrag'},// Hjemmekontor: 2240 kr fast fradrag

// core.js:3070
- 'Hjemmekontor: Fast fradrag på 2 200 kr/år uten dokumentasjon, eller faktiske kostnader med dokumentasjon.',
+ 'Hjemmekontor: Fast fradrag på 2 240 kr/år uten dokumentasjon, eller faktiske kostnader med dokumentasjon.',

// prerender/generate.js:225 (STATIC_NO skatt)
- <li><strong>Hjemmekontor:</strong> Standardfradrag på 1 850 kr/år eller faktiske kostnader</li>
+ <li><strong>Hjemmekontor:</strong> Standardfradrag på 2 240 kr/år eller faktiske kostnader</li>
```

**Filer:** `shared/core.js` (2 steder), `prerender/generate.js` (STATIC_NO skatt), alle 10 lang-filer (hvis displaytekst finnes der)

---

## 2. AGA fribeløp

**Kode-sti:** `shared/lang/no.js:92` (salAgaRows: "850 000 kr/år")
**SEO-sti:** `prerender/generate.js:281` ("de første 500 000 kr")
**Kode-verdi:** 850 000 kr
**SEO-verdi:** 500 000 kr
**Verifisert verdi:** **850 000 kr**
**Confidence:** Høy
**Status:** ✅ Kode korrekt, 🔴 SEO stale

### Kilder

1. **Skatteetaten — Arbeidsgiveravgift satser** — https://www.skatteetaten.no/en/rates/employers-national-insurance-contributions/
   - Sitat: fribeløp 850 000 kr per foretak (2026)

2. **Skatteetaten — Fribeløp for arbeidsgiver** — https://www.skatteetaten.no/en/business-and-organisation/employer/employers-national-insurance-contributions/zones-calculation-codes-and-rates-for-employers-national-insurance-contributions/rates-and-calculation/the-employers-contribution-free-amount/
   - Sitat: "The contribution-free amount is NOK 850,000 per year"

### Anbefalt fix (kun SEO)

```diff
// prerender/generate.js STATIC_NO kalkulator
- Fribeløpsordningen gir redusert sats for de første 500 000 kr i lønnskostnader.
+ Fribeløpsordningen gir redusert sats inntil differansen mot sone I-sats når 850 000 kr per foretak.
```

**Filer:** `prerender/generate.js` (STATIC_NO kalkulator + avgift)

---

## 3. AS registreringsgebyr (Brønnøysund)

**Kode-sti:** `shared/lang/no.js:558,643,683` ("6 825 kr")
**SEO-sti:** `prerender/generate.js:185` ("gebyr 6 735 kr elektronisk")
**Kode-verdi:** 6 825 kr
**SEO-verdi:** 6 735 kr
**Verifisert verdi:** **6 825 kr**
**Confidence:** Høy
**Status:** ✅ Kode korrekt, 🔴 SEO stale

### Kilder

1. **Brønnøysundregistrene — Gebyroversikt** — https://www.brreg.no/en/how-can-we-help-you/fees-for-registration/
   - Oppdatert: 20. mars 2026
   - Sitat: elektronisk registrering AS: 6 825 kr (fra 1. januar 2026)

2. **Lovdata — Endringsforskrift FOR-2025-12-16-2819** — https://lovdata.no/dokument/LTI/forskrift/2025-12-16-2819
   - Sitat: "foretak hvor alle eller enkelte deltakere, eiere eller tilsvarende har begrenset ansvar, skal det betales gebyr med 6 825 kroner ved elektronisk innsendelse"
   - Ikrafttredelse: 1. januar 2026

### Anbefalt fix (kun SEO)

```diff
// prerender/generate.js STATIC_NO index + selskap
- registrering i Brønnøysundregistrene (gebyr 6 735 kr elektronisk)
+ registrering i Brønnøysundregistrene (gebyr 6 825 kr elektronisk)
```

---

## 4. ANS/DA registreringsgebyr

**Kode-sti:** `shared/lang/no.js:588,619,643,683` ("3 883 kr")
**SEO-verdi:** 2 832 kr (i selskap SEO-artikkel)
**Verifisert verdi:** **3 883 kr**
**Confidence:** Høy
**Status:** ✅ Kode korrekt, 🔴 SEO stale

### Kilder

1. **Brønnøysundregistrene** — https://www.brreg.no/en/how-can-we-help-you/fees-for-registration/
   - Sitat: ANS/DA elektronisk: 3 883 kr (fra 1. januar 2026)

2. **Lovdata — FOR-2025-12-16-2819** — https://lovdata.no/dokument/LTI/forskrift/2025-12-16-2819
   - Sitat: "Andre foretak skal betale gebyr med 3 883 kroner ved elektronisk innsendelse"

### Anbefalt fix (kun SEO)

```diff
// prerender/generate.js STATIC_NO selskap — finn og erstatt 2 832 med 3 883
```

---

## 5. Boliglån egenkapital — V14 Bol-H1 var FEIL

**Kode-sti:** `shared/lang/no.js:17` (morReqRows: "Minst 10%")
**SEO-sti:** `prerender/generate.js:254` ("Minimum 15 %")
**Kode-verdi:** 10%
**SEO-verdi:** 15%
**Verifisert verdi:** **10% (fra 31. desember 2024)**
**Confidence:** Høy
**Status:** ✅ Kode korrekt, 🔴 SEO stale

> [!success] V14 Bol-H1 AVKREFTET
> V14 audit hevdet at morReqRows "10%" var feil fordi "Utlånsforskriften § 3 krever 15%". Dette var basert på den GAMLE forskriftsteksten. Utlånsforskriften ble endret 4. desember 2024 (FOR-2024-12-04-2925, ikraft 31. desember 2024) og senket kravet fra 15% til 10%.

### Kilder

1. **Lovdata — Utlånsforskriften FOR-2020-12-09-2648 (gjeldende)** — https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648
   - Sist endret: FOR-2024-12-04-2925 (ikraft 31. desember 2024)
   - § 7 første ledd: "Nedbetalingslån med pant i bolig skal på innvilgelsestidspunktet ikke overstige 90 prosent av et forsvarlig verdigrunnlag for boligen"
   - 90% belåning = 10% egenkapital

2. **Regjeringen.no — Endringer i utlånsforskriften** — https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/
   - Sitat: belåningsgrad endret fra 85% til 90%, ikraft 31. desember 2024

3. **Finanstilsynet — Boliglånsundersøkelsen 2025** — https://www.finanstilsynet.no/publikasjoner-og-analyser/boliglansundersokelser/2025/boliglansundersokelsen-2025/informasjon-om-utlansforskriften/
   - Bekrefter ny forskriftstekst

### Historisk kontekst

- **2015–2024:** 85% belåning / 15% egenkapital (boliglånsforskriften/utlånsforskriften § 3/§ 7)
- **Fra 31. des 2024:** 90% belåning / 10% egenkapital (FOR-2024-12-04-2925)

### Anbefalt fix (kun SEO)

```diff
// prerender/generate.js STATIC_NO boliglan:254
- <li><strong>Egenkapital:</strong> Minimum 15 % av boligens verdi (40 % for sekundærbolig i Oslo)</li>
+ <li><strong>Egenkapital:</strong> Minimum 10 % av boligens verdi (40 % for sekundærbolig i Oslo)</li>
```

**Merknad:** Sekundærbolig i Oslo har fortsatt 60% maks belåning (40% egenkapital). Denne ble IKKE endret i desember 2024-endringen.

---

## Konsolidert fix-oversikt

### Kode-fix (core.js)
- `core.js:3058` — hjemmekontor fradrag 2200 → 2240
- `core.js:3070` — displaytekst "2 200 kr" → "2 240 kr"

### SEO-fix (prerender/generate.js STATIC_NO)
- **index:** AS reg.gebyr 6 735 → 6 825
- **skatt:** hjemmekontor 1 850 → 2 240
- **boliglan:** egenkapital 15% → 10%
- **kalkulator:** AGA fribeløp 500 000 → 850 000
- **avgift:** AGA fribeløp 500 000 → 850 000 (hvis nevnt)
- **selskap:** AS 6 735 → 6 825, ANS/DA 2 832 → 3 883

### V14 audit-korreksjon
- **Bol-H1 AVKREFTET** — 10% egenkapital er korrekt etter forskriftsendring des 2024
- **Skatt-H1 DELVIS** — SEO stale (1 850), men kode er OGSÅ stale (2 200 → 2 240)
- Resterende H/M (AGA, AS, ANS/DA) bekreftet: kode korrekt, kun SEO stale

## Relasjoner

- V14 audit: `audit/consolidated/` (mangler — kun i Brain_HV `wiki/bugs/2026-04-12_audit-konsolidert-v14.md`)
- V14 aktiv-todo: `wiki/notater/2026-04-12_aktiv-todo-v14.md`
- Research v1: `research/research_v1/` (7 rapporter, verifisert)
