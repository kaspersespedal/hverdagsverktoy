---
title: Fase 2 — Mellomstore fixes
date: 2026-04-11
tags: [audit, fase, fase-2, v12]
status: planlagt
parent: ../README.md
---

# Fase 2 — Mellomstore fixes (~30-90 min)

5 fixes som krever litt mer logikk enn Fase 1, men ikke strukturelle refactors.

## Fixes

| # | ID | Tier | Fil:linje | Beskrivelse | Status | Commit |
|---|---|---|---|---|---|---|
| 1 | **H7 Personlig** | H | `core.js:5057-5064` | calcLonn frikort-verdict mismatch ved 100k brutto + kobl inn dead `frikortgrense` | ⏸️ | — |
| 2 | **H9 Avgift** | H | `core.js:3638-3640` | calcAdj input clamp på `aarBrukt`/`gammelAndel`/`nyAndel` | ⏸️ | — |
| 3 | **B12-M4 Boliglan** | M | `core.js:2952-2960` | Stresstest IO-aware formel + nytt resultatfelt | ⏸️ | — |
| 4 | **H1+H3 Skatt** | H+H | `skatt/index.html:180-212` + `core.js:1292,2969-2978` | Atomic sjekkliste fix: 9 checkboxes, 9 SJEKK_DATA-entries, applyLang-loop til 9 | ⏸️ | — |
| 5 | **B12-M6 Boliglan** | M | `core.js:_initPageReady` | Enter-handler på 5 boliglan-inputs | ⏸️ | — |

Detaljer i V12 consolidated-rapporten under H1, H3, H7, H9, og M-tier-listene.
