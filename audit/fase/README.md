---
title: Audit Fase-tracker
date: 2026-04-11
tags: [audit, fase, tracker, v12]
status: active
---

# Audit Fase-tracker

Organisering av V12-funn i 5 faser etter kompleksitet og dependencies. Hver fase er en commit-bar batch.

## Oversikt

| Fase | Beskrivelse | Estimert tid | Antall fixes | Status |
|---|---|---|---|---|
| **Fase 1** | Quick wins (1-8 linjer hver) | ~30 min | 7 | ✅ Ferdig (`a1c9cc9`) |
| **Fase 2** | Mellomstore (verdict-logikk, formler) | 30-90 min | 5 + bonus | ✅ Ferdig (`a1395d9`) |
| **Fase 3** | Strukturelle (helpers, refactor) | 1-3 timer | 5 + bonus | ✅ Ferdig (`e942378`) |
| **Fase 4** | /research-blokkerte | 2-4 timer | 4 bundles | 🟡 Neste |
| **Fase 5** | Cleanup batch (M-rest + L-tier) | 3-5 timer | 50+ | ⏸️ Venter |

## Mappestruktur

```
audit/fase/
├── README.md                       (denne fila)
├── fase-1-quick-wins/
│   └── README.md                   (7 fixes, status, commit-refs)
├── fase-2-mellomstore/
│   └── README.md
├── fase-3-strukturelle/
│   └── README.md
├── fase-4-research-blokkerte/
│   └── README.md
└── fase-5-cleanup/
    └── README.md
```

## Workflow per fase

1. Les fase-mappens README for full liste over fixes
2. Kjør fixes i rekkefølge (eller parallelt der mulig)
3. Verifiser via preview
4. Commit + push som én batch (én commit per fase)
5. Oppdater fase-README med commit-ref + ✅ status
6. Oppdater V12 consolidated med "Verifisert lukket"-markører
7. Oppdater Brain_HV aktiv-todo

## Kilde

Faser er definert i [[../consolidated/hverdagsverktoy-audit-consolidated-v12#anbefalt-fix-rekkefølge-v12--v13]] (V12 audit, anbefalt fix-rekkefølge).
