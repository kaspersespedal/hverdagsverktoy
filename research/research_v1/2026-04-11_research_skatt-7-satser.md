---
tags: [research, skatt, satser, 2026, skatteetaten, lovdata]
triggered-by: /audit v12 R-skatt-1..7
date: 2026-04-11
bundle: 2
status: complete
confidence: high
---

# Research: 7 norske skattesatser 2026 — verifisering mot primærkilder

Verifisert 7 satser flagget av V12-audit i `shared/core.js` mot Skatteetaten satser-sider og Lovdata (Stortingsvedtak STV-2025-12-18-2747 for inntektsåret 2026).

## Oversiktstabell

| # | Sats | Kode-verdi | Verifisert verdi | Status | Primærkilde |
|---|------|------------|------------------|--------|-------------|
| 1 | Minstefradrag lønn (tak) | 95 700 kr (46 %) | 95 700 kr (46 %) | Korrekt | Skatteetaten + STV § 6-X |
| 2 | Personfradrag klasse 1 | 114 540 kr | 114 540 kr | Korrekt | Skatteetaten + STV § 6-X |
| 3a | Trinnskatt trinn 1 | 226 100 / 1,7 % | 226 100 / 1,7 % | Korrekt | STV § 3-1 |
| 3b | Trinnskatt trinn 2 | 318 300 / 4,0 % | 318 300 / 4,0 % | Korrekt | STV § 3-1 |
| 3c | Trinnskatt trinn 3 | 725 050 / 13,7 % | 725 050 / 13,7 % | Korrekt | STV § 3-1 |
| 3d | Trinnskatt trinn 4 | 980 100 / 16,8 % | 980 100 / 16,8 % | Korrekt | STV § 3-1 |
| 3e | Trinnskatt trinn 5 | 1 467 200 / 17,8 % | 1 467 200 / 17,8 % | Korrekt | STV § 3-1 |
| 4a | Formueskatt bunnfradrag | 1 900 000 kr | 1 900 000 kr | Korrekt | Skatteetaten + STV kap 2 |
| 4b | Formueskatt trinn 2 | 21 500 000 kr | 21 500 000 kr | Korrekt | Skatteetaten + STV kap 2 |
| 4c | Sats kommunal | 0,35 % | 0,35 % | Korrekt | Skatteetaten + STV kap 2 |
| 4d | Sats stat under 21,5M | 0,65 % | 0,65 % | Korrekt | Skatteetaten + STV kap 2 |
| 4e | Sats stat over 21,5M | 0,75 % | 0,75 % | Korrekt | Skatteetaten + STV kap 2 |
| 5a | Reisefradrag sats/km | 1,90 kr | 1,90 kr | Korrekt | Skatteetaten satser |
| 5b | Reisefradrag egenandel | 12 000 kr | 12 000 kr | Korrekt | Skatteetaten satser |
| 5c | Reisefradrag øvre grense | 120 000 kr | 120 000 kr | Korrekt | Skatteetaten satser |
| 6 | Fagforeningstak | 8 700 kr | 8 700 kr | Korrekt | Skatteetaten satser |
| 7a | BSU maks/år | 27 500 kr | 27 500 kr | Korrekt | Skatteetaten BSU |
| 7b | BSU skattefradragsprosent | 10 % | 10 % | Korrekt | Skatteetaten BSU |
| 7c | BSU maks skattefradrag | 2 750 kr | 2 750 kr | Korrekt | Skatteetaten BSU |
| 7d | BSU aldersgrense | 33 år | 33 år (t.o.m.) | Korrekt | Skatteetaten BSU |

**Total: 19 verdier verifisert · 0 avvik · 0 stale · 0 usikre**

## Detaljer per sats

### 1. Minstefradrag — `core.js:2787`
- **Kode**: `Math.min(Math.max(b*0.46,0),95700)` — 46 %, maks 95 700 kr
- **Primærkilde**: Skatteetaten satser-side + Stortingsvedtak STV-2025-12-18-2747 § 6 ("skal ikke settes høyere enn 95 700 kroner")
- **URL**: https://www.skatteetaten.no/satser/minstefradrag/ · https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747/KAPITTEL_6

### 2. Personfradrag — `core.js:2786, 3851`
- **Kode**: `const pf = 114540;`
- **Primærkilde**: Stortingsvedtak § 6: "Fradrag etter skatteloven § 15-4 er 114 540 kroner i klasse 1"
- **URL**: https://www.skatteetaten.no/satser/personfradrag/

### 3. Trinnskatt — `core.js:2798-2803`
- **Kode**: `[226100, 318300, 725050, 980100, 1467200]` med satser `[0.017, 0.040, 0.137, 0.168, 0.178]`
- **Primærkilde**: Stortingsvedtak STV-2025-12-18-2747 § 3-1 (kapittel 3)
- **URL**: https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747/KAPITTEL_3
- **Match**: Alle 5 innslagspunkter og alle 5 satser er identiske med Lovdata.

### 4. Formueskatt — `core.js:3129-3137`
- **Kode**: bunnfradrag 1 900 000, trinn 2 ved 21 500 000, kommunal 0,0035, stat 0,0065 / 0,0075
- **Primærkilde**: Stortingsvedtak kapittel 2 + Skatteetaten satser
- **URL**: https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747/KAPITTEL_2 · https://www.skatteetaten.no/satser/formuesskatt/
- **Merknad**: Beløp er uendret fra 2025; STV 2026 bekrefter eksakt 1,9M / 21,5M / 0,35 % / 0,65 % / 0,75 %.

### 5. Reisefradrag — `core.js:3136-3138` (note: reise-konstanter i samme range)
- **Kode**: 1,90 kr/km · egenandel 12 000 · tak 120 000
- **Primærkilde**: Skatteetaten satser reisefradrag
- **Merknad**: **Store endringer fra 2025** (1,83/km · 15 250 egenandel · 100 880 tak). Kodebasen har allerede oppdatert til 2026-verdiene. Bondelaget og Azets bekrefter de samme 2026-tallene som ledd i statsbudsjettet.
- **URL**: https://www.skatteetaten.no/en/rates/deduction-for-travel-between-home-and-work/ · https://www.bondelaget.no/rjr/skatt-regnskap-og-trygd/fagartikler/skatt-og-avgift/statsbudsjett-for-2026-endringer-pa-skatte-og-avgiftsrettens-omrade

### 6. Fagforeningskontingent — `core.js:2790`
- **Kode**: `Math.min(parseNum('s-fagforening')||0, 8700)`
- **Primærkilde**: Skatteetaten satser fagforeningskontingent
- **URL**: https://www.skatteetaten.no/en/rates/deduction-for-trade-union-fees/
- **Merknad**: 8 700 kr videreført fra 2025 — ingen endring i statsbudsjett 2026.

### 7. BSU — `core.js:2794`
- **Kode**: `Math.min(parseNum('s-bsu')||0, 27500)` — taket er korrekt brukt på innskudd. Skattefradrag 10 % og aldersgrense 33 år håndteres ikke direkte i lønnsskatt-kalkulator, men brukes i i18n-tekster.
- **Primærkilde**: Skatteetaten BSU satser
- **URL**: https://www.skatteetaten.no/en/rates/deduction-for-young-peoples-housing-savings-bsu/
- **Merknad**: Aldersgrensen er t.o.m. inntektsåret man fyller 33 år (dvs. ikke lenger fradrag f.o.m. året man fyller 34). Koden bruker "33 år" som korrekt grense.

## Triangulering

- **Primær**: Lovdata Stortingsvedtak STV-2025-12-18-2747 (gjeldende fra 01.01.2026) — bekrefter trinnskatt, formueskatt, personfradrag, minstefradrag.
- **Sekundær**: Skatteetaten satser-sider — bekrefter reisefradrag, fagforening, BSU (som ikke er i STV).
- **Tertiær**: Forskrift FOR-2025-11-07-2216 bekrefter 2026-år for satsforskriften, men dekker kun godtgjørelser (bil, kost, representasjon) — ikke de 7 satsene i denne rapporten.
- **Kryssjekk**: PwC, Azets, Bondelaget sine statsbudsjett-artikler bekrefter alle satser i tabellen.

## Diff-funn

**Ingen avvik funnet.** Alle 19 verifiserte verdier matcher primærkildene eksakt.

## Confidence

**Samlet: HIGH (95 %)**

- Trinnskatt og formueskatt er direkte verifisert mot Lovdata primær-kilde (Stortingsvedtak), ingen tvil.
- Personfradrag og minstefradrag direkte sitert fra STV § 6.
- Reisefradrag, fagforening og BSU er verifisert via Skatteetaten satser + kryssjekk mot Azets/Bondelaget statsbudsjett-oversikter (ikke direkte STV-sitering, men Skatteetaten-siden er offisiell kilde).
- Ingen manuelle tall-konverteringer; alle verdier lest direkte fra primærkildene.

## Konklusjon

Alle 7 V12-flagger kan lukkes. `core.js` har korrekte 2026-verdier for:
1. Minstefradrag 95 700 kr (46 %)
2. Personfradrag 114 540 kr
3. Trinnskatt 5 trinn (226 100 / 318 300 / 725 050 / 980 100 / 1 467 200)
4. Formueskatt 1,9M bunnfradrag + 21,5M trinn 2 (0,35 / 0,65 / 0,75 %)
5. Reisefradrag 1,90 kr/km · 12 000 egenandel · 120 000 tak (oppdatert korrekt fra 2025-verdier)
6. Fagforening 8 700 kr
7. BSU 27 500/år · 10 % · maks 2 750 · 33 år

Ingen fix-forslag. Alle 7 audit-flagger kan merkes som verifisert/lukket.
