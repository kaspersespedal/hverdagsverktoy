---
title: Fase 2 — Mellomstore fixes
date: 2026-04-11
tags: [audit, fase, fase-2, v12]
status: completed
parent: ../README.md
---

# Fase 2 — Mellomstore fixes (~30-90 min)

5 fixes som krever litt mer logikk enn Fase 1, men ikke strukturelle refactors.

## Fixes

| # | ID | Tier | Fil:linje | Beskrivelse | Status | Commit |
|---|---|---|---|---|---|---|
| 1 | **H7 Personlig** | H | `core.js:5057-5064` | calcLonn frikort-verdict mismatch ved 100k brutto + kobl inn dead `frikortgrense` | ✅ | a1395d9 |
| 2 | **H9 Avgift** | H | `core.js:3638-3640` | calcAdj input clamp på `aarBrukt`/`gammelAndel`/`nyAndel` | ✅ | a1395d9 |
| 3 | **B12-M4 Boliglan** | M | `core.js:2952-2960` | Stresstest IO-aware formel + nytt resultatfelt | ✅ | a1395d9 |
| 4 | **H1+H3 Skatt** | H+H | `skatt/index.html:180-212` + `core.js:1292,2969-2978` | Atomic sjekkliste fix: 9 checkboxes, 9 SJEKK_DATA-entries, applyLang-loop til 9 | ✅ | a1395d9 |
| 5 | **B12-M6 Boliglan** | M | `core.js:_initPageReady` | Enter-handler på 5 boliglan-inputs | ✅ | a1395d9 |

## Verifisert via preview

| Fix | Test | Resultat |
|---|---|---|
| **H7** | brutto 100 000 kr | "Du tjener under frikortgrensen" ✅ (var "Lav skattesats") |
| **H7** | brutto 99 000 kr | "Du tjener under frikortgrensen" ✅ |
| **H7** | brutto 150 000 kr | "Lav skattesats" (uendret) ✅ |
| **H9** | aarBrukt=15, gammelAndel=200%, nyAndel=-50% | Clampet til 10/100/0% (utløpt) ✅ |
| **H9** | sanity 4yr, 100→60% | -600 000 kr tilbakebetaling ✅ |
| **B12-M4** | P=3M, 5,5%, 25yr, no IO | stress = 24 157 kr |
| **B12-M4** | + IO=5 | stress = 26 035 kr (+1 878) ✅ var identisk 24 157 |
| **B12-M4** | + IO=10 | stress = 29 542 kr (+5 385) ✅ |
| **H1+H3** | sjekkliste-q9 i DOM | exists ✅ |
| **H1+H3** | c7 hjemmekontor checked | 484 kr besparelse ✅ (var 0) |
| **H1+H3** | c1+c7 checked | 3 784 kr (15 000 + 2 200) × 0.22 ✅ |
| **B12-M6** | keydown Enter på m-a | calcMor fyrer ✅ |
| **Bonus** | sjekk-total format | "3 784 kr" (single suffix) ✅ var "kr kr" |

Detaljer i V12 consolidated-rapporten under H1, H3, H7, H9, og M-tier-listene.
