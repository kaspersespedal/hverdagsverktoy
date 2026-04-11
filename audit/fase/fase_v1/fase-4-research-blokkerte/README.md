---
title: Fase 4 — /research-blokkerte fixes
date: 2026-04-11
tags: [audit, fase, fase-4, v12, research]
status: completed
commit: 68fcd32
parent: ../README.md
---

# Fase 4 — /research-blokkerte (~2-4 timer)

14 funn fra V12 som krever ekstern primærkilde-verifikasjon før fix. Hver bundle: kjør `/research`, skriv research-rapport til `research/`, deretter implementer.

## Bundles

### Bundle 1 — Boliglan §-referanser (KRITISK, blokkerer H5)
| Funn | Filer |
|---|---|
| **R-bol-1** Utlånsforskriften §-referanser (22 steder) | HTML + core.js + 10 lang |
| → Lukker også H5 Boliglan a750990 partial fix |

### Bundle 2 — Skatt 7 satser
| Funn | Sats | Filer |
|---|---|---|
| R-skatt-1 | Minstefradrag-tak 95 700 | `core.js:2762` |
| R-skatt-2 | Personfradrag 114 540 | `core.js:2761,3851` |
| R-skatt-3 | Trinnskatt 5-trinn 2026 | `core.js:2773-2779` |
| R-skatt-4 | Formue 1.9M + 21.5M | `core.js:3081` |
| R-skatt-5 | Reisefradrag 1,90/km | `core.js:3136` |
| R-skatt-6 | Fagforening 8 700 | `core.js:2765` |
| R-skatt-7 | BSU 27 500 + 33 år | `core.js:2769` |

### Bundle 3 — Kalkulator + Avgift satser
| Funn | Sats |
|---|---|
| R-kalk-1 | G=130160, AGA-soner, OTP 2%, ferie 10.2/12% |
| R-avgift | MVA-satser, kapitalvarer-terskel, justeringsperiode |

### Bundle 4 — Selskap rettskilder
| Funn | Lov |
|---|---|
| R-sel-1 | Aksjeloven § 6-2 DL-krav (post-2020-endring) |
| R-sel-2 | Stiftelsesloven § 14 100k vs 200k |
| R-sel-3 | asl. § 13-3 og § 13-14 fusjonskreditorvarsel |

### Bundle 5 — Personlig
| Funn | Sats |
|---|---|
| R-pers-1 | ABO_OLD priskatalog (Viaplay 149→799) |

## Workflow per bundle

1. Trigger `/research` med kontekst fra V12-funn
2. Skriv research-rapport til `research/YYYY-MM-DD_research_[bundle].md`
3. Verifiser via primærkilde-triangulering (3 kilder, høy confidence)
4. Implementer fix basert på verifiserte verdier
5. Kryssreferer audit-rapport med `> [!success] Verifisert via /research`-markør
6. Commit + push

Status: **✅ Ferdig** — commit `68fcd32` (2026-04-11).

## Verifiseringsresultater (11 testcases via preview_eval)

| Fix | Test | Resultat |
|---|---|---|
| **Boliglan H5 stress-note** | runtime + HTML-fallback + lang-file | Alle 3 konsistente "§ 5 ... høyeste av 7 % og rente + 3 prosentpoeng" |
| **Boliglan H5 max-years** | runtime + HTML-fallback + lang-file | "Maks løpetid 30 år (bankpraksis). Lån over 60 % belåningsgrad krever avdrag — § 9" |
| **Bagatellgrense § 9-5** | calcAdj runtime med endring=5 pp | `adj-r-lbl` = "Under bagatellgrensen (§ 9-5 tredje ledd)" |
| **ABO_CATALOG** | `Object.keys(ABO_CATALOG).length` | 27 varianter |
| **ABO optgroups** | dropdown struktur | 8 grupper (Musikk, Streaming, Sport, iCloud+, Gaming, Software, Nyheter, Annet) |
| **Viaplay varianter** | katalog | F&S [169, 149], Total [799, 749] |
| **PS Plus 3 tier** | Essential/Extra/Premium | [105, 85] / [149, 119] / [179, 139] |
| **iCloud+ 3 sizes** | 50GB/200GB/2TB | [12, 12] / [29, 29] / [109, 109] |
| **Apple Music 2 tier** | Individual/Family | [139, 109] / [229, 199] |
| Console errors | preview | 0 |
| Alle Fase 1-3 fixes | regresjonscheck | ingen brudd |

## Åpne funn etter Fase 4 (utsatt til Fase 5)

- Stiftelsesloven § 22 presisering for 8 andre språk (ar, zh, fr, pl, uk, lt, so, ti) — krever per-språk oversettelse
- Skatt R-skatt-1..7 (0 avvik) — bare lukk flagg i V12 consolidated uten kode-endring
- 1G oppdatering — vent til 20. mai 2026 trygdeoppgjør
- M-rest + L-tier fra V12 audit (~50 items)

**Alle H-tier i V12 er nå adressert.**
