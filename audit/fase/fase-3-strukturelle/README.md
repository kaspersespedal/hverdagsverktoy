---
title: Fase 3 — Strukturelle fixes
date: 2026-04-11
tags: [audit, fase, fase-3, v12]
status: completed
parent: ../README.md
---

# Fase 3 — Strukturelle fixes (~1-3 timer)

Refactors som adresserer cross-cutting patterns og krever koordinert endring.

## Fixes

| # | ID | Tier | Fil:linje | Beskrivelse | Status | Commit |
|---|---|---|---|---|---|---|
| 1 | **H4 Kalkulator** | H | `core.js:654-697` | autoRecalc leak fix — idempotent binding via `__hvtRecalcBound`-flag | ✅ | e942378 |
| 2 | **Pattern B** | — | flere | Null-check helpers (`getVal/getChk/setEl`) + refactor 7 calc-funksjoner i kalkulator + 17 DOM-gets i skatt + 3 i boliglan | ✅ | e942378 |
| 3 | **H10 Avgift** | H | `core.js:1931-2089` | updateAll VAT-blokk null-check sweep (8+ steder) | ✅ | e942378 |
| 4 | **P12-M8 Personlig** | M | alle 10 lang-filer | 13 i18n-keys + `Belop`-typo (Python-script `add_personlig_translations.py`) | ✅ | e942378 |
| 5 | **K12-M5 Kalkulator** | M | `core.js:3017,4147,4283,4387` | G=130160 DRY — sentral konstant `_HVT_G` | ✅ | e942378 |

## Verifisert via preview (empirisk)

| Fix | Test | Resultat |
|---|---|---|
| **H4** autoRecalc leak | 5× updateAll på /kalkulator/, count change-listeners på lvu-zone | **1 listener** ✅ (var 5 → lineær vekst) |
| **H4** | 5× updateAll på /boliglan/, count keydown på m-a/m-r/m-y/m-fees/m-io-yrs | **1 keydown hver** ✅ |
| **H4** | __hvtRecalcBound flag på lvu-zone etter updateAll | true ✅ |
| **K12-M5** | `typeof _HVT_G` runtime | 130160 ✅ |
| **Pattern B helpers** | typeof getVal/getChk/setEl | function ✅ |
| **calcLvu** | brutto 500k → salCost/divCost/diff | 650 370 / 641 026 / 9 344 ✅ |
| **calcAga** | salary 500k → total/pct | 637 131 / 27.4% ✅ |
| **calcMor** | P=3M, 5,5%, 25yr → mth/tot/stress | 18 423 / 5 526 787 / 24 157 ✅ |
| **P12-M8** | NO budCsvTipLabel | "Tips" ✅ |
| **P12-M8** | EN budCsvTipLabel | "Tip" ✅ |
| **P12-M8** | EN aboPriceChangeTitle | "Price changes last year" ✅ |
| **P12-M8** | EN budDefaultExpense | "Item" ✅ |
| **H10 Avgift** | updateAll VAT-blokk på non-/avgift/ siden | Ingen TypeError ✅ |

Detaljer i V12 consolidated under H4, H10, og Pattern B.
