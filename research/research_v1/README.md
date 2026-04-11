---
title: Research v1 — indeks
date: 2026-04-11
tags: [research, indeks, v1]
status: active
---

# Research v1 — indeks (2026-04-11)

Første versjons-arkiv av `/research`-rapporter for hverdagsverktoy.com. Alle rapporter kjørt på sesjonen 2026-04-11 i forbindelse med V10/V11/V12 audit-ryddingen.

## Rapporter

| # | Fil | Trigger | Status | Confidence | Nøkkelfunn |
|---|---|---|---|---|---|
| 1 | [[2026-04-11_research_v10-moenster1-batch3]] | `/audit v10 Mønster #1 batch 3` | ✅ Verified | Høy | 82 stale strings verifisert + KS reg.gebyr 6825→3883 korrigering (hindret ny C1-regresjon) |
| 2 | [[2026-04-11_research_veibruksavgift-suspensjon]] | `/audit v8 H6 Personlig` | ✅ Verified | Høy | Stortingsvedtak 486/2026 bekreftet, årsgjennomsnitt 2026: bensin 23,75 / diesel 26,74 kr/L (commit `bba7fd9`) |
| 3 | [[2026-04-11_research_boliglan-utlansforskriften]] | `/audit v12 H5 boliglan §-ref` | ✅ Verified | Høy | **BÅDE kode OG V10 feil.** Stresstest = § 5 (ikke § 4-4/§ 9), maks 30 år IKKE lovfestet |
| 4 | [[2026-04-11_research_skatt-7-satser]] | `/audit v12 R-skatt-1..7` | ✅ Verified | Høy (95 %) | **0 avvik** — alle 19 verdier matcher Stortingsvedtak 2025-12-18-2747 eksakt |
| 5 | [[2026-04-11_research_kalkulator-avgift-satser]] | `/audit v12 R-kalk-1 + R-avgift` | ✅ Verified | Høy | Tall OK, men 2 paragraf-feil: bagatellgrense § 9-5 tredje ledd (ikke § 9-2), OTP innskuddspensjonsloven § 5-2 (ikke § 4-7) |
| 6 | [[2026-04-11_research_personlig-abo-priskatalog]] | `/audit v12 R-pers-1` | ✅ Verified | Medium | Viaplay 149→799 = **feilsammenligning** (F&S vs Total). 6 andre stale priser: Apple Music, iCloud+, VG+, PS Plus, Xbox GP, Microsoft 365 |
| 7 | [[2026-04-11_research_selskap-rettskilder]] | `/audit v12 R-sel-1..3` | ✅ Verified | Høy | Bare R-sel-2 trenger fix (stiftelseslov § 22 200k næring). R-sel-1 (DL § 6-2) og R-sel-3 (fusjon) var korrekte i kodebasen. |

---

## Sammendrag per research-bundle

### 1. V10 Mønster #1 batch 3 (morgen)

**Omfang:** 82 stale strings i 9 lang-filer + search.js (BSU, egenkapital, trygdeavgift, trinnskatt, reg.gebyr, AGA fribeløp).

**Kritisk funn:** KS reg.gebyr skulle være 3 883 kr (ikke 6 825 kr som V10 audit foreslo). Skulle blitt en ny C1-type regresjon hvis jeg fulgte V10 blindt.

**Commits:** `de4046e` deploy, `ca67aec` + `3f75052` C1 rollback + AGA.

### 2. Veibruksavgift-suspensjon

**Omfang:** `shared/core.js:3445-3462` (calcBilkostnad drivstoffpris).

**Funn:** Stortingsvedtak 486/2026 bekreftet via Lovdata `LTI/forskrift/2026-03-26-486`. Suspenderer veibruksavgift (0 kr/L) for 1. april - 1. september 2026 på bensin, diesel, biodiesel, bioetanol, naturgass, LPG. Standard 2026-satser: bensin 3,77 kr/L, diesel 2,28 kr/L matcher koden eksakt.

**Implementering:** Årsgjennomsnitt 2026 bensin 23,75 / diesel 26,74 kr/L. Commit `bba7fd9` 2026-04-11.

### 3. Boliglan Utlånsforskriften §-referanser (V12 H5)

**Omfang:** 23 steder i kodebasen (HTML + core.js + 10 lang-filer) for `morStressNote` + `morNoteMaxYears`.

**Funn (KRITISK):**
- **Stresstest** = Utlånsforskriften (FOR-2020-12-09-2648) **§ 5** (ikke § 4-4 som koden sier, ikke § 9 som V10 hevdet)
- **Maks 30 år løpetid** = **FINNES IKKE LOVFESTET.** Det er bankpraksis + § 9 avdragskrav for belåningsgrad > 60 %. Teksten må omformuleres, ikke bare få ny paragraf.
- Egenkapital 10 % = **§ 7** (endret fra 15 % til 10 % per 2024-12-31)
- Gjeldsgrad 5× = **§ 6**
- Fleksibilitetskvoter = **§ 12** (10 % generelt, 8 %/15 mill Oslo)

**Status:** Klart til å implementere (blokkerer ikke lenger V12 H5).

### 4. Skatt 7 satser (V12 R-skatt-1..7)

**Omfang:** 19 verdier (minstefradrag, personfradrag, 5 trinnskatt-punkter, formue bunnfradrag+trinn+3 satser, reisefradrag sats/egenandel/tak, fagforening, BSU sats/tak/alder).

**Funn:** **0 avvik.** Alle 19 verdier verifisert mot Stortingsvedtak `STV-2025-12-18-2747` (Lovdata) + Skatteetaten satser-sider. Ingen fix nødvendig.

**Spesielt:** Reisefradrag er endret fra 2025 til 2026 (1,83→1,90 kr/km · 15 250→12 000 egenandel · 100 880→120 000 tak) — koden er allerede oppdatert korrekt.

### 5. Kalkulator + Avgift satser (V12 R-kalk-1 + R-avgift)

**Omfang:** 9 konstanter (1G, AGA-soner × 6, selskapsskatt, oppjustering, OTP min, feriepenger 4+5 uker + 60+, MVA 25/15/12/0, justeringsperiode 10/5, justering-terskel 100k/50k, bagatellgrense 10 pp).

**Funn (tall):** Alle 9 numeriske verdier er korrekte for 2026. Ingen fix på tall.

**Funn (paragrafer — NYE FEIL):**
1. **Bagatellgrense § 9-2 tredje ledd → § 9-5 tredje ledd.** Koden har feil paragraf. Må rettes i `shared/core.js` + alle 10 lang-filer.
2. **OTP § 4-7 → innskuddspensjonsloven § 5-2.** Koden refererer til § 4-7 som ikke eksisterer i innskuddspensjonsloven. Korrekt er § 5-2 (kap. 5 Innskuddsplanen).

**1G-status per 2026-04-11:** Ingen ny verdi publisert. Trygdeoppgjøret fastsetter nytt G ~20. mai 2026. Gjeldende `_HVT_G = 130160` er korrekt til 2026-04-30. Kode-kommentar har korrekt TODO.

### 6. Personlig ABO priskatalog (V12 R-pers-1)

**Omfang:** 17 abonnement-tjenester i `ABO_OLD` + `ABO_DEFAULTS` / `ABO`-objekter i `shared/core.js:5529-5541`.

**Funn:** Viaplay-hoppet (149→799, +436 %) er IKKE reell prisøkning — ABO_OLD bruker Viaplay Film & Serier (149 kr), ABO_DEFAULTS bruker Viaplay Total (799 kr med sport/Premier League). To helt forskjellige produkter. Selve Viaplay Total økte fra 749 til 799 (~7 %) i samme periode.

**Andre stale priser funnet:**
- Apple Music: ABO_DEFAULTS 99 → faktisk 139 (FEIL)
- iCloud+: ABO_DEFAULTS 29 → faktisk 12 (FEIL, motsatt retning)
- VG+: ABO_OLD 199 → faktisk 99 (FEIL, overvurdert)
- PlayStation Plus Ess.: 85 → faktisk 105 (24. mai 2025-hopp)
- Xbox Game Pass Ultimate: 149 → faktisk 309 (oktober 2025 179→309)
- Microsoft 365: 99 → faktisk 121

**Status:** Prisdata, medium confidence per natur. Bruker må bestemme om ABO skal oppdateres eller om vi dropper sammenligningen til vi har bedre kilde.

### 7. Selskap rettskilder (V12 R-sel-1..3)

**R-sel-1 (aksjeloven § 6-2 DL-krav):** KORREKT som er. 3-millioners-terskelen er fortsatt gjeldende per 2026-04-11. Lovdata-ordlyd: "Selskapet skal ha en daglig leder. I selskaper med aksjekapital på mindre enn tre millioner kroner kan styret likevel bestemme at selskapet ikke skal ha daglig leder." Ingen fix.

**R-sel-2 (stiftelsesloven § 14):** UFULLSTENDIG. § 14 = 100 000 kr (alminnelige stiftelser), men § 22 setter 200 000 kr for næringsdrivende stiftelser. Må presiseres i alle 10 språkfiler: "Krav: minst 100 000 kr grunnkapital (200 000 kr for næringsdrivende stiftelser)".

**R-sel-3 (asl. § 13-3 og § 13-14):** KORREKT. § 13-3 regulerer fusjonsplan OG 2/3-flertall (via § 5-18-henvisning). § 13-14 regulerer 6-ukers kreditorvarsel. Ingen fix.

---

## Cross-cutting funn (research-batch → audit-implikasjoner)

1. **V12 H5 boliglan er KLAR** — research har avklart at stresstest = § 5, maks 30 år er ikke lovfestet. Fix-plan er strukturert men ikke-triviell (må omformulere `morNoteMaxYears`, ikke bare bytte paragraf).

2. **2 nye paragraf-feil oppdaget** som IKKE var flagget i V12 audit:
   - Bagatellgrense § 9-2 → § 9-5 tredje ledd
   - OTP § 4-7 → innskuddspensjonsloven § 5-2
   Disse bør legges inn i Fase 4 implementering.

3. **Viaplay-sammenligningsfeil** er mer fundamental enn bare "stale pris". ABO_OLD bruker Viaplay F&S mens ABO_DEFAULTS bruker Viaplay Total. Hele sammenligningen er ugyldig. Må enten (a) konsistent produkt, eller (b) fjernes.

4. **Alle skattesatser (bundle 2) er korrekte.** Research bekrefter at Fase 1-3-implementeringen ikke introduserte regresjoner på sats-nivå. 7 /research-flagg kan lukkes uten kode-endring.

5. **1G (130 160) er fortsatt korrekt.** Ny verdi kommer ~20. mai 2026. Sett påminnelse om å oppdatere `_HVT_G` når trygdeoppgjøret 2026 er publisert.

---

## Neste steg

Research v1 er komplett. Klart for Fase 4 implementering som bør inkludere:

- **Boliglan H5 §-fix** (22 steder × morStressNote + morNoteMaxYears omformulering)
- **Bagatellgrense § 9-5 fix** (core.js + 10 lang-filer)
- **OTP § 5-2 fix** (core.js kommentar + relevante lang-keys)
- **R-sel-2 stiftelse § 22 presisering** (10 lang-filer)
- **ABO-oppdateringer** (brukerens valg: oppdater eller fjern Viaplay-mismatch)
- **Skatt 7 satser** → lukk /research-flagg i V12 consolidated (ingen kode-endring)
- **1G** → ingen fix, men sett reminder for 20. mai 2026

Estimert total: 3-4 timer (avhenger av Viaplay-beslutning + morNoteMaxYears-omformulering).
