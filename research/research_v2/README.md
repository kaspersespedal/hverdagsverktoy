---
title: Research v2 — klar for neste runde
date: 2026-04-11
tags: [research, v2, ready]
status: ready
parent: ../INDEX.md
---

# Research v2 — klar for neste runde

Denne mappa er **opprettet, men tom**. Den ble klargjort av `/research`-skillen ved slutten av v1 (commit `68fcd32`, 2026-04-11).

## Status

🟢 **Klar** — venter på neste `/research`-kall.

Når neste research kjøres, lagres rapporten(e) HER i `research_v2/`, og deretter opprettes `research_v3/` som ny tom klargjort mappe.

## Workflow (v1.4 — "alltid klar mappe")

```
[research_v1/ ferdig] → opprett research_v2/ (tom) som "klar"
                              ↓
[neste /research-kall] → skriv rapporter til research_v2/
                              ↓
[research_v2/ ferdig] → opprett research_v3/ (tom) som "klar"
```

## Hva skal være her etter neste runde?

Når denne mappa fylles:
- Én eller flere `YYYY-MM-DD_research_[slug].md`-rapporter
- Oppdatert `README.md` (denne fila) med indeks over rapportene + status `verified`
- Push av oppdatering til `research/INDEX.md`
- Opprettelse av `research_v3/` som ny klar tom mappe

## Hvis ingen ny research blir kjørt

Mappa kan bli stående tom. Det er OK — det betyr bare at det ikke har vært behov for verifikasjon mot offisielle kilder siden v1.

## Hvordan triggere ny research?

Kjør `/research [bundle eller spesifikk sats]` — eller la `/audit` flagge en sats som "needs research verification" og handoff følger.

Forrige versjon: [[../research_v1/README]]
