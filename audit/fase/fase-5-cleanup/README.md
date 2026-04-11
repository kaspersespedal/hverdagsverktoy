---
title: Fase 5 — Cleanup batch
date: 2026-04-11
tags: [audit, fase, fase-5, v12, cleanup]
status: planlagt
parent: ../README.md
---

# Fase 5 — Cleanup batch (~3-5 timer)

50+ M-rest + L-tier funn batched for én lengre cleanup-økt.

## M-tier rest (etter Fase 1-3)

### Skatt
- M2 Næring-hobby 8 lang EN-fallback
- M3 utdeling ENK skjerming-label
- M4 utdeling minstefradrag-gap

### Kalkulator
- K12-M1 calcLvu urettferdig sammenligning + dead code
- K12-M3 calcNpv pay cf=0 edge case
- K12-M4 CSV-eksport hardkodet norsk

### Boliglan
- B12-M1 so.js/ti.js morReqRows duplikat (manuell rettelse)
- B12-M2 morCsv ignorerer avdragsfri
- B12-M3 morCsv hardkodet norsk + locale
- B12-M5 30-år flash ved clamp

### Personlig
- P12-M3 spare-r-effektiv villedende beregning
- P12-M5 calcBilkostnad silent km/aar clamp
- P12-M6 calcBilkostnad pris<=0 silent no-op
- P12-M9 dead frikortgrense (delvis i Fase 2)
- P12-M10 dead mndEtterSkatt
- P12-M11 V8 M9 små lang-filer 13-21 keys

### Avgift
- A12-M1 2× div-onclick a11y (vat-law-group + Justering-toggle)
- A12-M2 calcAdj tidlig return uten å skjule stale
- A12-M3 updateAll engelske JS-fallbacks (samme klasse som a750990)
- A12-M4 manglende autoRecalcInput

### Selskap
- S12-M1 search.js mangler selskap-andre-card

## L-tier (29 funn)

| Seksjon | Antall | Hovedtemaer |
|---|---:|---|
| Skatt | 5 | HTML defaults, formue ektefelle, primærbolig label, kl dead, reise-dager |
| Kalkulator | 4 | calcLvu uten fortegn, calcFerie over60, switchCalc race |
| Boliglan | 6 | "5,1%" statisk, _mor.tot navn, m-io-yrs max, null-checks, button type, kort-titler |
| Personlig | 7 | aria-live, aria-labels, bil intro motsier H6, "(40 %)" label, "0"-override |
| Avgift | 4 | navne-drift vat-aga, calcVat silent s=0, arrow hardkodet, scope-notat |
| Selskap | 3 | cmp-table caption/scope, sel. § 1-2 format, ansatte-30+ nyanser |

## Workflow

Cleanup-batch er 50+ små fixes. Anbefalt:
1. Gjør i 2-3 sub-batches (M-tier først, L-tier sist)
2. Én commit per sub-batch
3. Kryssreferer V12-funn for hver
4. Oppdater V12 consolidated med ✅-markører fortløpende

Status: **⏸️ Avventer Fase 1-4**.
