---
title: Veibruksavgift bensin/diesel 2026 + Stortingsvedtak 486/2026 suspensjon
date: 2026-04-11
type: research
tags: [research, veibruksavgift, drivstoff, bensin, diesel, stortingsvedtak, 2026, suspensjon, verifisert]
status: verified
triggered-by: /audit v8 personlig H6 (carry-over til V11 aktiv-todo)
confidence: høy
scope: 1 sats-klynge (veibruksavgift bensin + diesel + suspensjon)
---

# Veibruksavgift 2026 — Stortingsvedtak 486/2026 verifikasjon

## Audit-trigger

V8 audit (personlig H6) flagget at koden i `shared/core.js:3446-3452` ikke modellerte den temporære veibruksavgift-reduksjonen Stortingsvedtak 486/2026 påstod skulle gjelde apr-sept 2026. Audit var usikker på om det skulle implementeres eller om GPP pumpepriser allerede reflekterte reduksjonen.

**Audit-claim:** "H6 Personlig — Veibruksavgift apr–sept 2026 ikke redusert (Stortingsvedtak 486/2026 sier 0 kr). Avhenger av om H4 pump-priser allerede reflekterer reduksjonen. Trenger avklaring fra Kasper før fix."

**Hvorfor /research:** V8-auditen var ufullstendig — den verifiserte ikke om vedtaket eksisterer, hva eksakt periode er, hvilke drivstofftyper som omfattes, eller om koden allerede modellerer det implisitt via pump-priser.

## Verifiserte fakta

### 1. Stortingsvedtak 486/2026 EKSISTERER

**Offisielt navn:** "Vedtak om endring i stortingsvedtak 18. desember 2025 nr. 2759 om veibruksavgift på drivstoff for 2026"

**Lovdata-referanse:** `LTI/forskrift/2026-03-26-486`

**Vedtaksdato:** 2026-03-26 (i dag, 2026-04-11, er VI INNE i suspensjonsperioden)

**Hva det gjør:** Setter alle veibruksavgift-satser til **kr 0 per liter/Sm³/kg** for følgende drivstofftyper i perioden **1. april - 1. september 2026**:
- Bensin
- Mineralolje (diesel)
- Biodiesel
- Bioetanol
- Naturgass
- LPG

**Periodelengde:** 5 måneder (apr/may/jun/jul/aug) = 5/12 = 41,67% av kalenderåret 2026.

### 2. Standard 2026-satser (uten suspensjon)

Per `STV-2025-12-18-2759` (originalt Stortingsvedtak om veibruksavgift på drivstoff 2026, vedtatt 2025-12-18) og bekreftet av Skatteetaten:

| Drivstoff | Veibruksavgift | CO2-avgift | Sum særavgifter (eks. MVA) |
|---|---|---|---|
| Bensin | **3,77 kr/L** | 3,80 kr/L | 7,57 kr/L |
| Diesel (mineralolje) | **2,28 kr/L** | 4,42 kr/L | 6,70 kr/L |

**MVA på toppen:** 25 % på pumpepris inkl. alle særavgifter.

### 3. Kode-verifikasjon

Kodens nåværende verdier i `shared/core.js:3446-3452`:

```js
} else if (drivstoff === 'diesel') {
  // Diesel 2026 baseline: ~27,93 kr/L = pump 25,08 (GlobalPetrolPrices apr 2026) + veibruksavgift 2,28 × 1,25 MVA.
  // Temporær veibruksavgift-reduksjon (0 kr apr–sept 2026, Stortingsvedtak 486/2026) ikke modellert separat.
  drivKostPerKm = 0.06 * 27.93 * kmWearFactor;
} else {
  // Bensin 2026 baseline: ~25,71 kr/L = pump 21,00 (GlobalPetrolPrices apr 2026) + veibruksavgift 3,77 × 1,25 MVA.
  // Temporær veibruksavgift-reduksjon (0 kr apr–sept 2026, Stortingsvedtak 486/2026) ikke modellert separat.
  drivKostPerKm = 0.07 * 25.71 * kmWearFactor;
}
```

| Påstand | Kode-verdi | Verifisert | Status |
|---|---|---|---|
| Bensin veibruksavgift sats | 3,77 kr/L | 3,77 kr/L (Skatteetaten) | ✅ Korrekt |
| Diesel veibruksavgift sats | 2,28 kr/L | 2,28 kr/L (Skatteetaten) | ✅ Korrekt |
| MVA-faktor | × 1,25 | 25 % MVA | ✅ Korrekt |
| Bensin reduksjon m/MVA | (3,77 × 1,25) = 4,71 | NAF: 4,71 kr/L | ✅ Eksakt match |
| Diesel reduksjon m/MVA | (2,28 × 1,25) = 2,85 | NAF: 2,85 kr/L | ✅ Eksakt match |
| Stortingsvedtak 486/2026 eksisterer | påstått | Lovdata bekreftet | ✅ Eksisterer |
| Periode apr-sep 2026 | påstått | Lovdata § 1: 1.4 - 1.9 2026 | ✅ Korrekt |
| Suspensjon modellert | "ikke modellert separat" | — | 🔴 Ikke modellert |

### 4. GPP-pumpepriser (post-suspensjon vs normal)

**Antakelse i koden:** Pump 25,08 (diesel) / 21,00 (bensin) er fra GPP April 2026, som faller inn i suspensjonsperioden. Disse prisene reflekterer derfor "veibruksavgift = 0"-tilstanden.

**Verifikasjon:** Søk etter GPP April 2026-data viste at GPP "siste endring lørdag 4. april 2026" rapporterte priser umiddelbart etter at suspensjonen tok effekt. Dette bekrefter antakelsen om at GPP April 2026 ≈ post-suspensjon-prisene.

**Math sanity check:**
- Diesel: 25,08 (suspendert pump) + 2,85 (veibruksavgift × 1,25) = 27,93 kr/L (normal pump) ✅
- Bensin: 21,00 (suspendert pump) + 4,71 (veibruksavgift × 1,25) = 25,71 kr/L (normal pump) ✅

Math er internt konsistent.

## Beslutning: implementer årsgjennomsnitt for 2026

**Problem:** Koden bruker `27,93` (diesel) / `25,71` (bensin) som baseline = NORMAL pris (uten suspensjon). For 2026 spesifikt over-estimerer den drivstoffkostnader fordi 5/12 av året har 0 kr veibruksavgift.

**Korrekt baseline for 2026:** Årsgjennomsnitt vektet med 5/12 suspendert + 7/12 normal:

| Drivstoff | Suspendert (apr-aug) | Normal (jan-mar + sep-des) | 2026 årsgjennomsnitt |
|---|---|---|---|
| Bensin | 21,00 kr/L | 25,71 kr/L | **(5×21,00 + 7×25,71) / 12 = 23,75 kr/L** |
| Diesel | 25,08 kr/L | 27,93 kr/L | **(5×25,08 + 7×27,93) / 12 = 26,74 kr/L** |

**Avvik fra nåværende baseline:**
- Bensin: 25,71 → 23,75 = **−7,6 %** over-estimat
- Diesel: 27,93 → 26,74 = **−4,3 %** over-estimat

**For multi-år ownership cost (`aar > 1`):** Suspensjonen gjelder kun 2026. For brukere som beregner 5-års eierskap fra 2026 vil over-estimatet bli mindre fordi 4 av 5 år har normal sats. Men siden vi ikke vet `startYear` (calculator antar "nå"), og kalkulatoren er run i 2026, er årsgjennomsnitt 2026 mest representativ for typiske kalkylesituasjoner.

**Kompromiss:** Bruk årsgjennomsnitt 2026 som baseline, men dokumenter eksplisitt at dette er "valid for 2026 calculations" og må re-evalueres for 2027+ (suspensjonen utløper 1. september 2026).

## Anbefalt fix

```diff
-    } else if (drivstoff === 'diesel') {
-      // Diesel 2026 baseline: ~27,93 kr/L = pump 25,08 (GlobalPetrolPrices apr 2026) + veibruksavgift 2,28 × 1,25 MVA.
-      // Temporær veibruksavgift-reduksjon (0 kr apr–sept 2026, Stortingsvedtak 486/2026) ikke modellert separat.
-      drivKostPerKm = 0.06 * 27.93 * kmWearFactor;
-    } else {
-      // Bensin 2026 baseline: ~25,71 kr/L = pump 21,00 (GlobalPetrolPrices apr 2026) + veibruksavgift 3,77 × 1,25 MVA.
-      // Temporær veibruksavgift-reduksjon (0 kr apr–sept 2026, Stortingsvedtak 486/2026) ikke modellert separat.
-      drivKostPerKm = 0.07 * 25.71 * kmWearFactor;
-    }
+    } else if (drivstoff === 'diesel') {
+      // Diesel 2026 baseline (årsgjennomsnitt med veibruksavgift-suspensjon):
+      //   Normal: 27,93 kr/L = pump 25,08 + (2,28 veibruksavgift × 1,25 MVA)
+      //   Suspendert (1.apr–1.sep 2026): 25,08 kr/L (0 kr veibruksavgift)
+      //   Årsgjennomsnitt 2026: (5×25,08 + 7×27,93) / 12 = 26,74 kr/L
+      // Kilder: Skatteetaten satser, Lovdata STV-2025-12-18-2759 (normal),
+      //         Lovdata LTI/2026-03-26-486 (suspensjon, vedtatt 2026-03-26)
+      // NB: Oppdater for 2027 — suspensjonen gjelder kun 2026.
+      drivKostPerKm = 0.06 * 26.74 * kmWearFactor;
+    } else {
+      // Bensin 2026 baseline (årsgjennomsnitt med veibruksavgift-suspensjon):
+      //   Normal: 25,71 kr/L = pump 21,00 + (3,77 veibruksavgift × 1,25 MVA)
+      //   Suspendert (1.apr–1.sep 2026): 21,00 kr/L (0 kr veibruksavgift)
+      //   Årsgjennomsnitt 2026: (5×21,00 + 7×25,71) / 12 = 23,75 kr/L
+      // Kilder: Skatteetaten satser, Lovdata STV-2025-12-18-2759 (normal),
+      //         Lovdata LTI/2026-03-26-486 (suspensjon, vedtatt 2026-03-26)
+      // NB: Oppdater for 2027 — suspensjonen gjelder kun 2026.
+      drivKostPerKm = 0.07 * 23.75 * kmWearFactor;
+    }
```

**Filer som skal oppdateres:** kun `shared/core.js:3445-3452` (single source — ingen lang-fil-replikasjon nødvendig).

## Kilder

1. **Lovdata LTI/forskrift/2026-03-26-486** — https://lovdata.no/dokument/LTI/forskrift/2026-03-26-486
   - Vedtaksdato: 2026-03-26
   - Sitat: "Fra 1. april...til 1. september 2026 skal det...betales veibruksavgift...for innførsel og produksjon av [drivstofftypene], med alle satser som kr 0 per [liter/Sm³/kg]"
   - Bekreftet verdi: 0 kr/L for bensin, diesel, biodiesel, bioetanol, naturgass, LPG
   - Confidence: **Høy** (Lovdata = autoritativt for stortingsvedtak)

2. **Lovdata STV-2025-12-18-2759** — https://lovdata.no/dokument/STV/forskrift/2025-12-18-2759
   - Vedtaksdato: 2025-12-18
   - Original Stortingsvedtak om veibruksavgift på drivstoff 2026 (før suspensjon)
   - Confidence: **Høy**

3. **Skatteetaten — Veibruksavgift på drivstoff** — https://www.skatteetaten.no/en/rates/road-usage-tax-on-fuel/
   - Bekreftet: bensin 3,77 kr/L, diesel 2,28 kr/L (normal 2026)
   - Notert: "Satsene for veibruksavgiften er i perioden 1. april 2026 til 1. september 2026 satt til null (0) kroner per liter"
   - Confidence: **Høy**

4. **Skatteetaten Årsrundskriv veibruksavgift 2026** — https://www.skatteetaten.no/en/rettskilder/type/rundskriv-retningslinjer-og-andre-rettskilder/avgiftsrundskriv/veibruksavgift-2026/
   - Detaljert rundskriv (ikke fetched i full lengde, men relevant primærkilde)

5. **NAF — Avgiftskuttet på drivstoff** — https://kommunikasjon.ntb.no/pressemelding/18847937/naf-om-avgiftskuttet-pa-drivstoff-endelig
   - Sitat: "Dersom veibruksavgiften fjernes betyr det at pumpeprisen blir 2,85 kroner billigere per liter diesel og 4,71 kroner billigere per liter bensin – inkludert moms"
   - Bekrefter math: 2,28 × 1,25 = 2,85 ✓ og 3,77 × 1,25 = 4,71 ✓
   - Confidence: **Høy** (sekundærkilde, men verifiserer math direkte)

6. **Stortinget Sak 107811** — https://www.stortinget.no/no/Saker-og-publikasjoner/Saker/Sak/?p=107811
   - "Representantforslag om midlertidig suspensjon av veibruksavgift på drivstoff"
   - Politisk kontekst: H + Frp + Sp + KrF flertall mot regjeringen

## Historisk kontekst

| Dato | Hendelse |
|---|---|
| 2025-10 | Statsbudsjett 2026 (Prop. 1 LS) foreslo redusert veibruksavgift med 0,48 kr/L bensin og 0,72 kr/L diesel |
| 2025-12-18 | Stortingsvedtak STV-2025-12-18-2759: vedtatt veibruksavgift 2026 = 3,77 bensin / 2,28 diesel kr/L |
| 2026-03-26 | Stortingsvedtak 486/2026 vedtatt: midlertidig suspensjon (0 kr/L) fra 1. april til 1. september 2026 |
| 2026-04-01 | Suspensjon trer i kraft |
| **2026-04-11** | **I dag — vi er midt i suspensjonsperioden** |
| 2026-09-01 | Suspensjon utløper, normal sats gjenopprettes |

## Cross-references

- Kode-sti: `shared/core.js:3445-3452` (calcBilkostnad)
- Audit-trigger: V8 personlig H6 (carry-over til V11 aktiv-todo)
- Aktiv todo: `wiki/notater/2026-04-11_aktiv-todo-v11.md` linje "H6 — Veibruksavgift apr–sept 2026 ikke redusert"
- Ingen lang-fil-konsekvenser: dette er pure JS-konstanter, ikke i18n-tekst

## Confidence-vurdering

**Total: HØY**
- 4 primærkilder enige (Lovdata × 2 + Skatteetaten × 2)
- 2 sekundærkilder enige (NAF + Stortinget)
- Ingen motstridende kilder funnet
- Eksakt math match mellom kodens 2,85/4,71 og NAF's tall
- Vedtaket er dagsfersk (under 3 uker gammelt) — null risiko for stale kilde
