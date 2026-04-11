---
title: Fase 3 — Strukturelle fixes
date: 2026-04-11
tags: [audit, fase, fase-3, v12]
status: planlagt
parent: ../README.md
---

# Fase 3 — Strukturelle fixes (~1-3 timer)

Refactors som adresserer cross-cutting patterns og krever koordinert endring.

## Fixes

| # | ID | Tier | Fil:linje | Beskrivelse | Status | Commit |
|---|---|---|---|---|---|---|
| 1 | **H4 Kalkulator** | H | `core.js:654-697` | autoRecalc leak fix — idempotent binding via `__hvtRecalcBound`-flag | ⏸️ | — |
| 2 | **Pattern B** | — | flere | Null-check helpers (`getVal/getChk/setEl`) + refactor 7 calc-funksjoner i kalkulator + 17 DOM-gets i skatt + 3 i boliglan | ⏸️ | — |
| 3 | **H10 Avgift** | H | `core.js:1931-2089` | updateAll VAT-blokk null-check sweep (8+ steder) | ⏸️ | — |
| 4 | **P12-M8 Personlig** | M | alle 10 lang-filer | 13 i18n-keys + `Belop`-typo (Python-script `add_personlig_translations.py`) | ⏸️ | — |
| 5 | **K12-M5 Kalkulator** | M | `core.js:3017,4147,4283,4387` | G=130160 DRY — sentral konstant `_HVT_G` | ⏸️ | — |

Detaljer i V12 consolidated under H4, H10, og Pattern B.
