---
date: 2026-04-11
tags: [research, kalkulator, avgift, mva, otp, aga, 1g, 2026]
triggered-by: /audit v12 R-kalk-1 + R-avgift
bundle: 3
status: complete
scope: 9 konstanter i shared/core.js og shared/lang/no.js
---

# Research: Kalkulator + avgift-satser 2026

Verifisering av 9 konstanter i `shared/core.js` og `shared/lang/no.js` mot offisielle 2026-kilder (NAV, Skatteetaten, Lovdata, Stortinget).

## Sammendrag (tabell)

| # | Konstant | Kode-verdi | Offisiell verdi 2026 | Status | Kilde |
|---|----------|------------|----------------------|--------|-------|
| 1 | 1G (grunnbeløpet) | 130 160 kr (`_HVT_G`) | 130 160 kr (gjelder 1.5.2025–30.4.2026) | OK (t.o.m. 30.4.2026) | NAV grunnbeløpet |
| 2 | AGA sone I–V | 14,1/10,6/6,4/7,9/5,1/0 % | 14,1/10,6/6,4/7,9/5,1/0 % (identisk) | OK | Skatteetaten AGA |
| 3 | Selskapsskatt 22 % | 0,22 | 22 % | OK | Regjeringen Prop.1 LS 2025–2026 |
| 3b | Utbytte oppjustering 1,72 | 1.72 | 1,72 (effektiv 37,84 %) | OK | Skatteetaten oppjusteringsfaktor |
| 4 | OTP minimum 2 % | `pensjon-otp` input, default | 2 % av lønn mellom 1G og 12G | OK | Innskuddspensjonsloven § 5-2 (ikke § 4-7, se note) |
| 5 | Feriepenger 10,2 % / 12 % / +2,3 % | 0.102 / 0.12 / 0.023 | 10,2 % (lov) / 12 % (tariff 5 uker) / +2,3 pp (60+) m/6G-tak | OK | Ferieloven § 10 nr. 2 og 3 |
| 6 | MVA 25/15/12/0 % | 25/15/12/0 | 25 (§ 5-1), 15 (§ 5-2, § 5-3 næringsmidler), 12 (persontransport/kino/hotell), 0 (§ 6-1 ff.) | OK — med merknad | Skatteetaten MVA-satser |
| 7 | Justeringsperiode 10 år (eiendom) / 5 år (maskiner) | 10 / 5 | 10 år (§ 9-4 andre ledd) / 5 år (§ 9-4 første ledd) | OK | Mval. § 9-4 |
| 8 | Terskel 100 000 (eiendom) / 50 000 (maskiner) | 100 000 / 50 000 | 100 000 kr (§ 9-1 andre ledd bokstav b) / 50 000 kr (§ 9-1 andre ledd bokstav a) | OK | Mval. § 9-1 |
| 9 | Bagatellgrense 10 pp | 10 pp | 10 pp | OK VERDI — **FEIL PARAGRAF** i kommentar | Mval. **§ 9-5 tredje ledd** (ikke § 9-2 tredje ledd) |

## Detaljerte funn per konstant

### 1. Grunnbeløpet (1G) = 130 160 kr — OK per 2026-04-11

- `shared/core.js:260` `var _HVT_G = 130160;`
- Fastsatt av Stortinget etter trygdeoppgjøret 2025, gjelder fra 1.5.2025 til 30.4.2026.
- Verifisert på NAV: "1G = 130 160 kroner fra 1. mai 2025", økning 4,94 % fra 124 028 kr.
- Snitt-G 2025: 128 116 kr; justeringsfaktor 1,049440.
- Kilde: <https://www.nav.no/grunnbelopet>

**Ny verdi 1. mai 2026 — status:**
- Ingen offisiell verdi for 2026-05-01 publisert per 2026-04-11. Trygdeoppgjøret 2026 gjennomføres normalt i **medio mai 2026**, basert på TBU-tall fra reviderte nasjonalbudsjett.
- Nytt G vil typisk varsles rundt 15.-25. mai 2026 (tilsvarende 2024 og 2025).
- **Actionable:** Oppdater `_HVT_G` rundt 20. mai 2026 — mest sannsynlig ny verdi i intervallet 134 500 – 137 000 kr (forutsatt 3–5 % lønnsvekst, men dette er KUN et estimat basert på historisk mønster, IKKE et offisielt anslag).
- Det er allerede en TODO-kommentar i koden (`core.js:259`): "NB: Oppdater 1. mai 2026 til ny verdi (varslet justering på vårparten)." — den er korrekt plassert.

### 2. AGA-soner — OK uendret 2026

| Sone | Kode | Skatteetaten 2026 |
|------|------|-------------------|
| I | 0.141 | 14,1 % |
| Ia / II | 0.106 | 10,6 % (sone Ia har fribeløp 850 000 kr før 14,1 %) |
| III | 0.064 | 6,4 % |
| IVa | 0.079 | 7,9 % |
| IV | 0.051 | 5,1 % |
| V (Finnmark/Nord-Troms) | 0 | 0 % |

- Fribeløp sone Ia: 850 000 kr per foretak for 2026 (uendret).
- Ekstra AGA 5 % over 850 000 kr for høye lønninger: **avviklet** fra 1.1.2025. Sjekk at kalkulatoren IKKE fortsatt legger til denne — men dette er utenfor scope for bundle 3 (krever /audit på lvu/aga-kalkulator).
- Kilde: <https://www.skatteetaten.no/satser/arbeidsgiveravgift/>

### 3. Selskapsskatt 22 % + utbytte oppjustering 1,72 — OK

- Selskapsskatt 22 % uendret for 2026. Bekreftet av Prop. 1 LS (2025–2026).
- Oppjusteringsfaktor 1,72 for aksjegevinst/utbytte for personlige aksjonærer. Effektiv marginalskatt: 22 % × 1,72 = 37,84 %.
- `core.js:3861` og `core.js:3945` bruker begge 1.72 korrekt.
- Kilder:
  - <https://www.skatteetaten.no/en/rates/factor-for-upward-adjustment-of-gainloss-or-dividend-on-shares/>
  - <https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skatte-og-avgiftssatser/skattesatser-2026/id3121978/>

### 4. OTP minimum 2 % — OK, men paragraf-referanse i bruker-feedback

- `core.js:4450` OTP-grunnlag: `Math.max(0, Math.min(sal, 12*G) - 1*G)` — korrekt iht. innskuddspensjonsloven.
- Minimumssats 2 % av lønn mellom 1G og 12G, fra første krone — uendret for 2026.
- **Merk:** Kode-kommentar (`core.js:4448`) sier "Innskuddspensjonsloven § 4-7". Dette er **feil paragraf**: § 4-7 eksisterer ikke i loven (kap. 4 går fra § 4-1 til § 4-5, § 4-5 er opphevet). Korrekt paragraf er **§ 5-2 (Innskuddets størrelse)** eller § 5-3, kapittel 5 "Innskuddsplanen".
- **Ikke kritisk** (bare kommentar, ingen brukervisning), men hvis det eksponeres i tooltip bør det fikses til § 5-2.
- Kilde: <https://lovdata.no/lov/2000-11-24-81> + <https://arbinn.nho.no/arbeidsliv/pensjon/tjenestepensjoner/artikler/otp/>

### 5. Feriepenger 10,2 % / 12 % / +2,3 pp — OK

- Ferieloven § 10 nr. 2: "Arbeidstaker har rett til feriepenger fra arbeidsgiver med 10,2 prosent av feriepengegrunnlaget" — OK.
- 12 % ved 5 ukers ferie gjelder for arbeidstakere på tariffavtale (ikke lovfestet, men etablert tariff-standard). Kode behandler dette korrekt som valgbar sats i `ferie-type`.
- § 10 nr. 3: "For arbeidstaker over 60 år med rett til ekstraferie … forhøyes prosentsatsen med 2,3 prosentpoeng". Gjelder kun inntil 6 × folketrygdens grunnbeløp = 6 × 130 160 = 780 960 kr. Kode (`core.js:4342`) implementerer 6G-tak korrekt via `Math.min(sal, sixG)`.
- Kilde: <https://lovdata.no/lov/1988-04-29-21>

### 6. MVA-satser 25/15/12/0 % — OK

- **25 %** alminnelig sats — Mval. § 5-1 annet ledd (Stortingsvedtak)
- **15 %** næringsmidler — Mval. § 5-2 (samt vann/avløp)
- **12 %** redusert sats — persontransport, kino/kulturarrangementer, overnatting, kringkasting (NRK-lisens: opphevet 2020). Mval. § 5-3 til § 5-10.
- **0 %** (nullsats, fradragsrett) — aviser, bøker, elbiler (visse), utførsel. Mval. kap. 6.
- **Ingen endringer** i satsene for 2026. Regjeringen Prop. 1 LS holder alle MVA-satser uendret.
- Merk: "12 %" er faktisk henvist til flere paragrafer i § 5-3 ff. — kode-kommentaren om "§ 5-3" i en linje og "§ 5-7" for 0-sats er forenkling, men pedagogisk akseptabelt.
- Kilde: <https://www.skatteetaten.no/satser/merverdiavgift/>

### 7. Justeringsperiode 10 år (eiendom) / 5 år (maskiner) — OK

- Mval. **§ 9-4 første ledd**: Maskiner/inventar — 5 år ("de fem første regnskapsårene etter anskaffelsen").
- Mval. **§ 9-4 andre ledd**: Fast eiendom — 10 år ("ti år etter fullføringen").
- `core.js:3687`: `const periode = type === 'eiendom' ? 10 : 5;` — OK.
- **Merk paragraf:** Kode-kommentaren (`core.js:3676`) sier "mval. kap. 9" generelt og "§ 9-1". Det er riktig at § 9-1 definerer *kapitalvarene*, men *justeringsperioden* står i § 9-4. Ingen feil i seg selv, bare unøyaktig henvisning.

### 8. Terskel 100 000 / 50 000 — OK

- Mval. **§ 9-1 andre ledd bokstav b**: fast eiendom ved ny-, på- eller ombygging hvor inngående mva utgjør **minst 100 000 kroner**.
- Mval. **§ 9-1 andre ledd bokstav a**: maskiner, inventar og andre driftsmidler hvor inngående mva av kostpris utgjør **minst 50 000 kroner**.
- `core.js:3688`: `const terskel = type === 'eiendom' ? 100000 : 50000;` — OK.

### 9. Bagatellgrense 10 prosentpoeng — OK verdi, **FEIL paragraf**

**KRITISK FUNN for R-avgift:**

- Verdi 10 pp er korrekt og uendret 2026.
- Sitat fra Mval. **§ 9-5 tredje ledd**: *"Det skal ikke foretas justering dersom endringen i fradragsprosenten er mindre enn ti prosentpoeng i forhold til fradragsprosenten ved justeringsperiodens begynnelse."*
- **Kode sier feil paragraf:** V12-auditrapporten rapporterer at kode-kommentar/tooltip henviser til "Mval. § 9-2 tredje ledd". Dette er **feil** — bagatellgrensen står i **§ 9-5 tredje ledd**. § 9-2 omhandler "når inngående mva skal justeres" (bruksendringer), mens § 9-5 omhandler "beregning av justeringsbeløpet" og inneholder bagatellregelen.
- **Fix:** Bytt alle strenger "§ 9-2 tredje ledd" → "§ 9-5 tredje ledd" i `shared/core.js` og `shared/lang/*.js`.
- Kilder:
  - Skatteetaten MVA-håndboken 9-5.5: <https://www.skatteetaten.no/en/rettskilder/type/handboker/merverdiavgiftshandboken/gjeldende/M-9/M-9-5/M-9-5.5/>
  - Lovdata Mval. kap. 9: <https://lovdata.no/nav/lov/2009-06-19-58/kap9>

## Oppsummering: stale satser og fix-forslag

| ID | Problem | Fix |
|----|---------|-----|
| K-1G-2026 | 1G oppdateres ved trygdeoppgjøret mai 2026 (forventet ~20. mai) | **Planlagt TODO:** oppdater `_HVT_G` ca. 20.-25. mai 2026 |
| K-OTP-par | Kode-kommentar `core.js:4448` henviser til "§ 4-7" — finnes ikke | Endre til "§ 5-2 innskuddspensjonsloven" |
| K-adj-par | Tooltip/kommentar for justering refererer til "§ 9-1" som hjemmel for periode (rett: § 9-4) | Kosmetisk, kan presiseres til "§ 9-1/§ 9-4" |
| **K-bag-par** | **Kode sier "§ 9-2 tredje ledd" for bagatellgrense — feil paragraf** | **Endre til "§ 9-5 tredje ledd"** i alle språk-filer + core.js |

## Hovedpunkter for brukeren

1. **Alle 9 numeriske verdier er korrekte for 2026** per dagens status (2026-04-11).
2. **1G vil endres ca. 20. mai 2026** — sett opp en reminder for dette.
3. **Én reell feil funnet:** paragraf-henvisning for bagatellgrensen (§ 9-5 tredje ledd, ikke § 9-2 tredje ledd). Dette er den viktigste enkelt-fixen å gjennomføre.
4. **Mindre kommentar-presisering:** OTP-paragraf (§ 5-2 i stedet for ikke-eksisterende § 4-7) og justeringsperiode (§ 9-4 i stedet for kun § 9-1).

## Primærkilder (komplett liste)

- NAV grunnbeløpet: <https://www.nav.no/grunnbelopet>
- Skatteetaten arbeidsgiveravgift 2026: <https://www.skatteetaten.no/satser/arbeidsgiveravgift/>
- Skatteetaten merverdiavgift: <https://www.skatteetaten.no/satser/merverdiavgift/>
- Skatteetaten oppjusteringsfaktor aksjer: <https://www.skatteetaten.no/en/rates/factor-for-upward-adjustment-of-gainloss-or-dividend-on-shares/>
- Skattesatser 2026 (regjeringen): <https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skatte-og-avgiftssatser/skattesatser-2026/id3121978/>
- Prop. 1 LS (2025–2026) Taxes 2026: <https://www.regjeringen.no/en/documents/prop.-1-ls-20252026/id3124192/>
- Ferieloven (Lovdata): <https://lovdata.no/lov/1988-04-29-21>
- Innskuddspensjonsloven (Lovdata): <https://lovdata.no/lov/2000-11-24-81>
- Merverdiavgiftsloven kap. 9 (Lovdata): <https://lovdata.no/nav/lov/2009-06-19-58/kap9>
- MVA-håndboken § 9-5.5 (bagatellgrense): <https://www.skatteetaten.no/en/rettskilder/type/handboker/merverdiavgiftshandboken/gjeldende/M-9/M-9-5/M-9-5.5/>
</content>
</invoke>