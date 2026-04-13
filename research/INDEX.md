---
title: Research INDEX
date: 2026-04-11
tags: [research, indeks, oversikt]
status: active
ferdig: research_v1
klar: research_v2
---

# Research INDEX — hverdagsverktoy.com

Samle-indeks over alle `/research`-versjoner. Hver versjon er en ferdig research-runde. Det skal alltid finnes ÉN klar tom mappe (`vN+1`) opprettet ved slutten av forrige runde — den er destinasjon for neste `/research`-kall.

## Versjoner

| Versjon | Dato | Antall rapporter | Status | Indeks |
|---|---|---:|---|---|
| **v1** | 2026-04-11 | 7 | ✅ Ferdig | [[research_v1/README]] |
| **v2** | 2026-04-13 | 1 | ✅ Ferdig | [[research_v2/README]] |
| **v3** | — | 0 | 🟢 Klar (venter på neste runde) | [[research_v3/README]] |

## Klar mappe for neste runde: `research_v3/`

🟢 **Tom og klar.** Opprettet 2026-04-13 ved slutten av v2-runden. Neste `/research`-kall skriver hit.

## Forrige ferdige versjon: `research_v2/`

Opprettet 2026-04-13. V14 SEO-artikkel verifisering — 5 verdier sjekket. Hjemmekontor stale i kode (2200→2240). V14 Bol-H1 avkreftet (10% egenkapital korrekt etter forskriftsendring des 2024).

## Forrige ferdige versjon: `research_v1/`

Opprettet 2026-04-11 under V10/V11/V12 audit-rydderunden. Dekker:

- **V10 Mønster #1 batch 3** — 82 stale strings + KS reg.gebyr-korrigering
- **V8 H6 veibruksavgift-suspensjon** — Stortingsvedtak 486/2026
- **V12 H5 boliglan Utlånsforskriften §-referanser** — § 5 stresstest, maks 30 år ikke lovfestet
- **V12 R-skatt-1..7** — 19 skattesatser 2026 verifisert mot Stortingsvedtak
- **V12 R-kalk-1 + R-avgift** — 9 konstanter + 2 paragraf-feil oppdaget
- **V12 R-pers-1** — ABO-priskatalog (Viaplay-sammenligningsfeil avslørt)
- **V12 R-sel-1..3** — Aksjeloven + stiftelsesloven rettskilder

Se [[research_v1/README]] for full oversikt over hver rapport.

## Versjons-policy (v1.4 — "alltid klar mappe")

**Hovedregel:** når en research-runde er ferdig, opprettes umiddelbart en ny tom `vN+1`-mappe som "klar". Dette gjør at det alltid er én synlig "neste destinasjon" for kommende research.

**Workflow:**
```
[research_v1/ ferdig — README oppdatert med status: verified]
   ↓
[opprett research_v2/ med tom README + status: ready]
   ↓
[neste /research-kall] → skriv rapporter til research_v2/
   ↓
[research_v2/ ferdig]
   ↓
[opprett research_v3/ tom + klar]
```

**Når kjøres ny research?** Tilsvarende v1.2-reglene:
1. **Ny skatteår** (januar hvert år) — alle sats-rapporter må re-verifiseres
2. **Større lovendring** — f.eks. ny Utlånsforskrift, ny aksjelov-revisjon
3. **Vesentlig kritikk av eksisterende rapport** — ekstern kilde motsier verifisert rapport
4. **Minst 6 måneder siden sist** — generell oppfriskning
5. **/audit flagger ny "needs research"** — handoff fra audit til research

**Policy:** gamle versjoner **slettes aldri**. De er historiske referansepunkter som viser når kunnskap ble verifisert + hvilken kilde-datering ble brukt. Dette er C1-lærdommen fra V10.

## Format + regler

Se [[CLAUDE.md]] for research-format, filnavn-konvensjoner, og primærkilde-hierarki.
