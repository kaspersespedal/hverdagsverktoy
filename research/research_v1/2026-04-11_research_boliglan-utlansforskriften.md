---
title: Utlånsforskriften §-referanser for boliglan
date: 2026-04-11
type: research
tags: [research, boliglan, utlansforskriften, lovdata, 2026]
status: verified
triggered-by: /audit v12 H5 (boliglan §-referanser, V11 carry)
confidence: høy
scope: 22 steder i koden (HTML:2, core.js:2, lang-filer:10x2)
---

# Utlånsforskriften §-referanser for boliglan

## TL;DR

Både **koden** (som bruker "§ 4-4" og "§ 4-5") OG **V10-claimen** (som hevdet § 5 og § 9) er delvis feil. Korrekte paragrafer er:

| Regel | Kodens § | V10 hevdet § | **Korrekt §** | Status |
| :--- | :---: | :---: | :---: | :---: |
| Stresstest (7% / +3pp) | § 4-4 | § 5 | **§ 5** | V10 rett, kode feil |
| Maks løpetid 30 år | § 4-5 | § 9 | **Finnes ikke som maks** | Begge feil |
| Egenkapital / belåningsgrad (90%) | — | — | **§ 7** | — |
| Gjeldsgrad (5× brutto årsinntekt) | — | — | **§ 6** | — |
| Fleksibilitetskvote (10% / 8% Oslo) | — | — | **§ 12** | — |

**Rødt flagg:** 30-års maks løpetid finnes IKKE som et lovfestet krav i Utlånsforskriften. De 30 år refererer til en beregningsmetode (annuitetslån med 30 års nedbetalingstid) brukt i § 9 for å beregne minimumsavdrag på boliglån med belåningsgrad over 60%. Dette er en referanse-verdi, ikke en maks-grense.

**Forskriftens status per 2026-04-11:** FOR-2020-12-09-2648 "Forskrift om finansforetakenes utlånspraksis (utlånsforskriften)" er **gjeldende**. Sist endret 2024-12-04 (ikrafttredelse 2024-12-31). Ingen erstatning planlagt.

---

## Spørsmål 1: Stresstest-paragrafen

**Spørsmål:** Hvilken paragraf regulerer kravet om at banken skal stresse-teste låntakerens betjeningsevne mot "høyeste av 7 % og rente + 3 prosentpoeng"?

**Svar:** **§ 5 — Betjeningsevne**

**Eksakt ordlyd (Lovdata, verifisert 2026-04-11):**
> "Finansforetaket skal ikke yte lån dersom kunden ikke vil ha tilstrekkelige midler til å dekke normale utgifter til livsopphold ved en renteøkning på 3 prosentpoeng på kundens samlede gjeld, men slik at finansforetaket uansett skal legge til grunn en rente på minst 7 prosent."

**Kilde:** [Lovdata — Utlånsforskriften § 5](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648)

**Triangulering:** Bekreftet av [Finanstilsynet — Informasjon om utlånsforskriften (30. oktober 2025)](https://www.finanstilsynet.no/publikasjoner-og-analyser/boliglansundersokelser/2025/boliglansundersokelsen-2025/informasjon-om-utlansforskriften/).

**Kodens nåværende feil:** Lang-filene bruker "§ 4-4" i `morStressNote` (alle 10 språk). HTML-filen `boliglan/index.html:228` bruker korrekt "§ 5" i fallback — så det er en inkonsistens mellom HTML-fallback og i18n-strings.

---

## Spørsmål 2: Maksimal løpetid 30 år

**Spørsmål:** Hvilken paragraf regulerer kravet om maksimal løpetid på 30 år for boliglån?

**Svar:** **Det finnes ikke et slikt lovfestet krav.**

Utlånsforskriften inneholder ingen maksimal løpetid på 30 år for boliglån. § 9 regulerer avdrag (nedbetaling) for lån med belåningsgrad over 60%, og bruker "annuitetslån med 30 års nedbetalingstid" som en **referanse-beregning** for minimums-avdrag, ikke som en maks-grense.

**Eksakt ordlyd § 9 (Lovdata, verifisert 2026-04-11):**
> "For lån med belåningsgrad høyere enn 60 prosent skal det kreves årlig nedbetaling som er den laveste av 2,5 prosent av innvilget lån og det nedbetalingen ville vært på et annuitetslån med 30 års nedbetalingstid."

**Kilde:** [Lovdata — Utlånsforskriften § 9](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648)

**Triangulering:** Bekreftet av WebSearch-resultater som eksplisitt sier at § 9 "does not set a maximum loan term of 30 years, but rather uses a 30-year annuity loan as a reference calculation for determining the minimum required annual principal payments."

**Rødt flagg:** Nåværende tekst i koden sier "Maks løpetid er 30 år (Utlånsforskriften § 4-5)" — dette er **dobbeltfeil**:
1. Paragrafen § 4-5 regulerer faktisk forbrukslån (kapittel 4), ikke boliglån
2. Det finnes ingen lovfestet 30-års maks-grense i forskriften i det hele tatt

**Praktisk virkelighet:** Norske banker tilbyr typisk 25-30 års løpetid på boliglån som standard policy, men dette er ikke et forskriftsfestet krav. Teksten må omformuleres.

**Anbefalt fix-tekst:** "Banker tilbyr normalt inntil 30 års løpetid. Boliglån over 60 % belåningsgrad må ha avdrag beregnet som laveste av 2,5 % av innvilget lån og et annuitetslån over 30 år (Utlånsforskriften § 9)."

---

## Spørsmål 3: Egenkapital / belåningsgrad

**Spørsmål:** Hvilken paragraf regulerer egenkapital-kravet (10% / 15%)?

**Svar:** **§ 7 — Belåningsgrad**

**Eksakt ordlyd (Lovdata, verifisert 2026-04-11):**
> "Nedbetalingslån med pant i bolig skal ikke overstige 90 prosent av et forsvarlig verdigrunnlag for boligen. Hvis lånet er gitt som rammekreditt, skal det ikke overstige 60 prosent av boligens verdi."

**Kilde:** [Lovdata — Utlånsforskriften § 7](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648/kap3)

**Endring per 2024-12-31:** Belåningsgrad ble hevet fra 85% til **90%** (dvs. egenkapital-krav senket fra 15% til **10%**) per ikrafttredelse 2024-12-31 (FOR-2024-12-04-2925). Dette er gjeldende i 2026.

**Triangulering:** [Regjeringen.no — "Utlånsforskriften: Senker kravet til egenkapital for boliglån"](https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/) og [Huseierne — "Ny utlånsforskrift: Du trenger mindre egenkapital for å låne til bolig i 2025!"](https://www.huseierne.no/nyheter/ny-utlansforskrift-du-trenger-mindre-egenkapital-for-a-lane-til-bolig-i-2025/).

---

## Spørsmål 4: Gjeldsgrad 5× brutto årsinntekt

**Spørsmål:** Hvilken paragraf regulerer gjeldsgrad-kravet?

**Svar:** **§ 6 — Gjeldsgrad**

**Eksakt ordlyd (Lovdata, verifisert 2026-04-11):**
> "Finansforetaket skal ikke yte lån dersom kundens samlede gjeld overstiger fem ganger årsinntekt."

**Kilde:** [Lovdata — Utlånsforskriften § 6](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648)

**Triangulering:** Finanstilsynet, regjeringen.no og Nordea bruker alle "§ 6" konsistent.

---

## Spørsmål 5: Fleksibilitetskvoter (10% / 8% Oslo)

**Spørsmål:** Hvilken paragraf regulerer 10 %-kvoten utenfor Oslo og 8 %-kvoten i Oslo?

**Svar:** **§ 12 — Fleksibilitet**

**Eksakt ordlyd (Lovdata, verifisert 2026-04-11):**
> "Finansforetaket kan hvert kvartal innvilge lån med pant i bolig som ikke oppfyller ett eller flere av kravene i § 5, § 6, § 7 og § 9, for inntil 10 prosent av verdien av innvilgede lån med pant i bolig. [...] Finansforetaket kan hvert kvartal innvilge lån med pant i bolig i Oslo kommune som ikke oppfyller ett eller flere av kravene i § 5, § 6, § 7 og § 9, for inntil 8 prosent av verdien av innvilgede lån med pant i bolig i Oslo kommune eller inntil 15 millioner kroner."

**Kilde:** [Lovdata — Utlånsforskriften § 12](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648)

**Merknad:** § 12 viser eksplisitt tilbake til § 5, § 6, § 7 og § 9 — dette er en ekstra bekreftelse på at § 5 (stresstest), § 6 (gjeldsgrad), § 7 (belåningsgrad) og § 9 (avdrag) er de korrekte paragrafene.

---

## Spørsmål 6: Status — er forskriften fortsatt gjeldende?

**Svar:** **Ja, gjeldende per 2026-04-11.**

- **Forskrift:** FOR-2020-12-09-2648 "Forskrift om finansforetakenes utlånspraksis (utlånsforskriften)"
- **Ikrafttredelse:** 2021-01-01
- **Siste endring:** FOR-2024-12-04-2925, ikrafttredelse 2024-12-31
- **Erstatter:** Boliglånsforskriften (FOR-2016-12-14-1581) og forbrukslånsforskriften
- **Status per 2026-04-11:** Gjeldende, ingen erstatning planlagt, ingen pending høring
- **Debatt:** Eiendom Norge har kampanjet for avskaffelse ("Utlånsforskriften har utspilt sin rolle"), men dette er en politisk debatt og forskriften er fortsatt i kraft

**Kilder:**
- [Lovdata — FOR-2020-12-09-2648](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648)
- [Finanstilsynet — Informasjon om utlånsforskriften](https://www.finanstilsynet.no/publikasjoner-og-analyser/boliglansundersokelser/2025/boliglansundersokelsen-2025/informasjon-om-utlansforskriften/)
- [Regjeringen.no — Amendments to the lending regulation](https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/)

---

## Fix-strategi for de 22 stedene

### Steder som må endres:

**HTML (1 sted):**
- `boliglan/index.html:188` — `id="mor-note-maxyears"` — fallback tekst må omformuleres (30 år er ikke lovfestet maks; anbefalt å referere § 9 om avdrag eller droppe §-referansen)
- `boliglan/index.html:228` — `id="mor-stress-note"` — **allerede korrekt** med "§ 5" (ingen endring nødvendig i HTML-fallback)

**JavaScript (2 steder):**
- `shared/core.js:1530` — `morNoteMaxYears` fallback: "Maks løpetid er 30 år (Utlånsforskriften § 4-5)" → må omformuleres
- `shared/core.js:1534` — `morStressNote` fallback: "Utlånsforskriften § 5: ..." → **allerede korrekt**

**Lang-filer (10 filer × 2 strings = 20 steder):**
Alle 10 språkfiler (`no, en, fr, pl, lt, so, uk, ar, zh, ti`) må oppdateres for:
1. `morStressNote`: "§ 4-4" → **"§ 5"** (stresstest)
2. `morNoteMaxYears`: "§ 4-5" → **omformuleres** (fjern §-referanse, eller referer til § 9 om avdrag, eller endre tekst til "Norske banker tilbyr normalt inntil 30 års løpetid. Lån over 60 % belåningsgrad har avdragskrav (§ 9).")

### Anbefalt tekst per nøkkel:

**morStressNote (norsk):**
```
Utlånsforskriften § 5: banken må sjekke at du tåler høyeste av 7 % og rente + 3 prosentpoeng.
```

**morNoteMaxYears (norsk) — Alternativ A (faktakorrekt, beholder §-referanse):**
```
Banker tilbyr normalt inntil 30 års løpetid. For lån over 60 % belåningsgrad kreves avdrag (Utlånsforskriften § 9).
```

**morNoteMaxYears (norsk) — Alternativ B (enklere, uten §-referanse):**
```
Norske banker tilbyr normalt inntil 30 års løpetid på boliglån.
```

Alternativ A anbefales fordi det beholder jurid­isk presisjon og forklarer avdragskravet. Alternativ B er enklere for lekfolk men mister juridisk kontekst.

---

## Confidence: HØY

- Lovdata direkte verifisert (WebFetch mot primærkilde)
- Finanstilsynet triangulert (sekundærkilde, oppdatert 2025-10-30)
- Regjeringen.no triangulert
- WebSearch bekrefter alle paragrafer uavhengig
- Ingen motstridende kilder funnet
- Kryssreferanse § 12 → § 5, § 6, § 7, § 9 er internt konsistent

## Oppsummert funn — kritisk for V12 H5

1. **Koden (§ 4-4 / § 4-5) er feil** — dette er forbrukslån-paragrafer (kapittel 4)
2. **V10s § 5 (stresstest) er riktig**
3. **V10s § 9 (maks løpetid) er feil** — § 9 handler om avdrag, ikke løpetid
4. **30-års maks løpetid er ikke lovfestet i det hele tatt** — det er en referanse-beregning i § 9 eller en frivillig bank-policy
5. **HTML-fallback (index.html:228) bruker allerede § 5 korrekt** — inkonsistens med lang-filer
6. **Fix må dekke 20 lang-strings + 2 JS-fallbacks + 1 HTML-fallback = 23 steder** (ikke 22 som V12 oppga — V12 mistet én fallback)

## Referanser

- [Lovdata — Utlånsforskriften (hoveddokument)](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648)
- [Lovdata — Kapittel 3. Utlån med pant i bolig](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648/kap3)
- [Finanstilsynet — Informasjon om utlånsforskriften (2025-10-30)](https://www.finanstilsynet.no/publikasjoner-og-analyser/boliglansundersokelser/2025/boliglansundersokelsen-2025/informasjon-om-utlansforskriften/)
- [Regjeringen.no — Amendments to the lending regulation](https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/)
- [Huseierne — Ny utlånsforskrift 2025](https://www.huseierne.no/nyheter/ny-utlansforskrift-du-trenger-mindre-egenkapital-for-a-lane-til-bolig-i-2025/)
- [Nordea — Nye regler for boliglån](https://www.nordea.no/privat/vare-produkter/lan-og-kreditt/boliglan/nye-regler-for-boliglan.html)
- [Store norske leksikon — utlånsforskriften](https://snl.no/utl%C3%A5nsforskriften)
