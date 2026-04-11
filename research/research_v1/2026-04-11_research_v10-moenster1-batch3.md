---
title: V10 Mønster #1 batch 3 — primærkilde-verifikasjon (4 klynger)
date: 2026-04-11
type: research
tags: [research, verifisert, hverdagsverktoy, v10, moenster-1, batch-3, skatt, selskap, avgift, boliglan]
status: verified
triggered-by: /audit v10 M1 (skatt H1, skatt H3, selskap H1, avgift H2)
confidence: høy
scope: 4 klynger, 82 stale strings i 9 ikke-norske lang-filer
---

# V10 Mønster #1 batch 3 — primærkilde-verifikasjon

`/research`-kjøring utløst av V10-audit (2026-04-11) som flagget ~92 stale strings i 9 ikke-norske lang-filer under Mønster #1 (stale satser i search.js/lang mens core.js er korrekt). Commit `3f75052` lukket 10 av disse (avgift H1 5 % ekstra AGA). Gjenstående 82 strings er fordelt på 4 klynger verifisert her.

Kjørt som batch-dispatch av 4 parallelle sub-agenter, hver med full 6-fase `/research`-pipeline. Ved konsolidering ble 2 kritiske korrigeringer oppdaget i møte med faktisk kode-tilstand.

---

## Sammendrag

| Klynge | Seksjon | Funn | Strings | Confidence |
|---|---|---|---|---|
| **A** | skatt H1 | BSU 10 %, egenkapital 10 %, trygdeavgift 7,6 % | 27 (3 keys × 9 lang) | høy |
| **B** | skatt H3 | Trinnskatt: 5 trinn (226k/318k/725k/980k/1467k) | 10 (1 key × 9 lang + search.js) | høy |
| **C** | selskap H1 | AS/ASA 6 825 kr; andre former 3 883 kr (Lovdata FOR-2025-12-16-2819, ikraft 1.1.2026) | 36 (4 rader × 9 lang) | høy |
| **D** | avgift H2 | AGA fribeløp sektorunntak 850 000 kr/år (Stortingsvedtak 2025-12-18-2748 § 4) | 9 (1 key × 9 lang) | høy |
| **TOTAL** | — | — | **82** | — |

**Tidsbruk:** ~3 min parallell kjøring. **Tool-kall:** 25 totalt (sub-agentene).

---

## Kritiske korrigeringer oppdaget under post-pass verifikasjon

> [!danger] Korrigering 1 — V10 audit feilklassifiserte KS reg.gebyr
> V10 Mønster #1-rapporten antok at KS (Kommandittselskap) hadde samme reg.gebyr som AS/ASA (6 825 kr). **Dette er feil.** Lovdata FOR-2015-12-11-1668 § 5 viser at "begrenset ansvar"-kategorien kun omfatter AS og ASA. KS faller i den andre kategorien (3 883 kr) fordi komplementæren har ubegrenset personlig ansvar.
>
> **Implikasjon:** Hvis batch 3-fixen hadde fulgt V10 blindt, ville `selskapKsBody` blitt satt til 6 825 kr — en ny C1-type regresjon. Denne research-rapporten erstatter V10-claimet om KS med det korrekte tallet.
>
> **Action:** Oppdater `audit/consolidated/hverdagsverktoy-audit-consolidated-v10.md` selskap H1 så fremtidige audits ikke gjentar feilen.

> [!warning] Korrigering 2 — Sub-agent D tok feil om NO-tilstand for AGA fribeløp
> Sub-agent D (klynge D) rapporterte at også `shared/lang/no.js` var stale (500 000 kr). Lest direkte av `no.js:91` (`salAgaRows`):
>
> > "Sone Ia/II/III/IVa bruker redusert sats til differansen mot sone I-sats (14,1 %) når 850 000 kr/år er nådd (2026). Kilde: Skatteetaten — AGA-satser 2026."
>
> NO er allerede korrekt. Batch 3 skal kun oppdatere de 9 ikke-norske lang-filene, ikke NO.

---

## Klynge A — skatt H1 stale satser (3 keys × 9 lang = 27 strings)

**Kode-sti:** `shared/lang/{ar,en,fr,lt,pl,so,ti,uk,zh}.js` — `searchDs`-objektet
**Bekreftet stale-tilstand:** `en.js:836-837` — alle 4 keys (bsu, egenkapital, trygdeavgift, trinnskatt) har utdaterte verdier

### A1 — BSU (Boligsparing for ungdom)

| Felt | Verdi |
|---|---|
| **Kode-verdi (NO korrekt)** | 10 % skattefradrag, maks 27 500 kr/år |
| **Stale i 9 lang** | 20 % |
| **Verifisert for 2026** | **10 % skattefradrag, maks 27 500 kr/år, maks 300 000 kr totalt** |
| **Confidence** | Høy |
| **Status** | 🔴 Stale i 9 lang |

**Kilder:**
1. [Skatteetaten — BSU rates](https://www.skatteetaten.no/en/rates/deduction-for-young-peoples-housing-savings-bsu/) — 2026 valgt i year-selector, bekrefter 10 % / 27 500 / 300 000
2. [Lovdata § 16-10](https://lovdata.no/forskrift/1999-11-19-1158/§16-10-5) — Forskrift til utfylling av skatteloven, bekrefter paragrafen
3. [Skatteetaten forskuddsutskrivingen 2026](https://www.skatteetaten.no/en/rettskilder/type/uttalelser/uttalelser/forskuddsutskrivingen-2026/)

**Historisk kontekst:**
- t.o.m. 2022: 20 % (stale-verdien stammer herfra)
- 2023: redusert til 10 % (Prop. 1 LS 2022-2023)
- 2024-2026: 10 % videreført uendret

**Anbefalt fix:** Bytt `20%` → `10%` i `searchDs.bsu` × 9 filer

### A2 — Egenkapital (boliglån)

| Felt | Verdi |
|---|---|
| **Kode-verdi (NO korrekt)** | 10 % egenkapital (= 90 % LTV) |
| **Stale i 9 lang** | 15 % |
| **Verifisert for 2026** | **10 % egenkapital** per Utlånsforskriften § 7 (1) |
| **Confidence** | Høy |
| **Status** | 🔴 Stale i 9 lang |

**Kilder:**
1. [Lovdata — Utlånsforskriften FOR-2020-12-09-2648](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648) — § 7 (1): *"Nedbetalingslån med pant i bolig skal på innvilgelsestidspunktet ikke overstige 90 prosent"*. Sist endret FOR-2024-12-04-2925, gjeldende fra 1.1.2025
2. [Regjeringen.no — Senker kravet til egenkapital for boliglån](https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/) — bekrefter 15→10 % endring
3. [Finanstilsynet — Boliglånsundersøkelsen 2025](https://www.finanstilsynet.no/publikasjoner-og-analyser/boliglansundersokelser/2025/boliglansundersokelsen-2025/informasjon-om-utlansforskriften/)

**Historisk kontekst:**
- 2017-2024: 15 % egenkapital (= 85 % LTV) per tidligere boliglånsforskrift
- **1.1.2025**: senket til 10 % egenkapital via FOR-2024-12-04-2925
- 2026: uendret

**Øvrige uendrede krav (for kontekst, ikke fix):**
- Fleksibilitetskvote: 10 % av utlån kan avvike (8 % for Oslo)
- Gjeldsgrad: maks 5x årsinntekt
- Stresstest: maks(rente+3 pp, 7 %)

**Anbefalt fix:** Bytt `15%` → `10%` i `searchDs.egenkapital` × 9 filer. Oppdater evt. `85%` LTV → `90%`.

### A3 — Trygdeavgift på lønn

| Felt | Verdi |
|---|---|
| **Kode-verdi (NO korrekt)** | 7,6 % |
| **Stale i 9 lang** | 7,9 % |
| **Verifisert for 2026** | **7,6 % trygdeavgift på lønn** (personer 17-69 år) |
| **Confidence** | Høy |
| **Status** | 🔴 Stale i 9 lang |

**Kilder:**
1. [Skatteetaten — National Insurance Contributions](https://www.skatteetaten.no/en/rates/national-insurance-contributions/) — 2026 valgt, viser 7,6 % for lønnsinntekt
2. [Regjeringen — Prop. 1 LS (2025-2026)](https://www.regjeringen.no/en/documents/prop.-1-ls-20252026/id3124192/) — statsbudsjett 2026 inneholder trygdeavgift-endringer
3. [Stortinget — Innst. 3 S (2025-2026)](https://www.stortinget.no/no/Saker-og-publikasjoner/Publikasjoner/Innstillinger/Stortinget/2025-2026/inns-202526-003s/) — finanskomiteens innstilling

**Historisk kontekst (0,1 pp årlig reduksjon-trend):**
- 2023: 7,9 % (stale-verdien stammer herfra)
- 2024: 7,8 %
- 2025: 7,7 %
- **2026: 7,6 %**

**NB:** Næringsinntekt er separat (2026 = 10,8 %) — ikke rør det feltet i `searchDs`.

**Anbefalt fix:** Bytt `7.9%` / `7,9 %` → `7.6%` / `7,6 %` i `searchDs.trygdeavgift` × 9 filer. Sjekk også om noen er delvis oppdatert til 7,7 eller 7,8 — disse må også til 7,6.

---

## Klynge B — skatt H3 trinnskatt (10 strings)

**Kode-sti:** `shared/search.js:64` desc + 9 lang-filer `searchDs.trinnskatt`
**Bekreftet stale-tilstand:** `en.js:836-837` — `trinnskatt:'Progressive tax that rises with income — 4 brackets'`

| Felt | Verdi |
|---|---|
| **Stale i 9 lang + search.js** | "4 trinn / 4 brackets" |
| **Verifisert for 2026** | **5 trinn** (over fribeløp 226 100 kr personinntekt) |
| **Confidence** | Høy |
| **Status** | 🔴 Stale |

### Trinn-tabell 2026

| Trinn | Grense (kr personinntekt) | Sats |
|---|---|---|
| 1 | 226 100 → 318 300 | 1,7 % |
| 2 | 318 300 → 725 050 | 4,0 % |
| 3 | 725 050 → 980 100 | 13,7 % |
| 4 | 980 100 → 1 467 200 | 16,8 % |
| 5 | 1 467 200 → ∞ | 17,8 % |

**Kilder:**
1. [Skatteetaten — Trinnskatt](https://www.skatteetaten.no/satser/trinnskatt/) — 2026 valgt i year-selector, bekrefter alle 5 trinn + terskler + satser
2. [Stortingsvedtak 2025-12-18-2747 § 3-9](https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747/%C2%A73-9) — autoritativ primærkilde, vedtaksdato 18.12.2025, bekrefter identiske tall
3. [Prop. 1 LS (2025-2026)](https://www.regjeringen.no/en/documents/prop.-1-ls-20252026/id3124192/) — regjeringen foreslo uendrede satser med lønnsjusterte terskler

**Historisk kontekst:**
- Pre-2016: Toppskatt (2 trinn over et bunnfradrag)
- 2016 innføring: Trinnskatt erstattet toppskatt, 4 trinn
- 2022+: Utvidet til 5 trinn (splittet toppsegmentet)
- 2026: 5 trinn, uendret fra 2025 med lønnsjusterte terskler

**NB:** `shared/lang/no.js:450` har allerede `trinnLabel1` til `trinnLabel5` (5 labels) — inkonsistensen er kun i `searchDs`-beskrivelsene.

**Anbefalt fix:** Bytt `4 brackets` / `4 trinn` → `5 trinn` i `searchDs.trinnskatt` × 9 filer + oppdater `search.js:64` desc.

---

## Klynge C — selskap H1 Brønnøysund reg.gebyr (36 strings)

**Kode-sti:** 9 lang-filer — `selskapAnsBody`, `selskapKsBody`, `selskapCompareBody`, `selskapRegBody` (+ evt. andre hardkodede strenger som `selskapStartBody`)
**Bekreftet stale-tilstand:** `en.js:671` — *"ENK: free, AS: 6,825 kr, ANS/DA/KS: 2,250 kr"* — AS er korrekt, men ANS/DA/KS=2 250 er STALE

### Autoritativ gebyr-tabell 2026

Kilde: Lovdata FOR-2015-12-11-1668 § 5, sist endret FOR-2025-12-16-2819, ikraft 1.1.2026

| Selskapsform | Foretaksreg. elektronisk | Foretaksreg. papir | Enhetsreg. elektronisk |
|---|---|---|---|
| **AS** — Aksjeselskap | **6 825** | 7 912 | — (Foretaksreg. obligatorisk) |
| **ASA** — Allmennaksjeselskap | **6 825** | 7 912 | — |
| **ANS** — Ansvarlig selskap | **3 883** | 4 398 | — |
| **DA** — Delt ansvar | **3 883** | 4 398 | — |
| **KS** — Kommandittselskap | **3 883** ⚠️ | 4 398 | — |
| **SA** — Samvirkeforetak | **3 883** | 4 398 | — |
| **NUF** — Utenl. foretak | **3 883** | 4 398 | — |
| **ENK** (Foretaksreg.) | 3 883 | 4 398 | — |
| **ENK** (Enhetsreg. kun) | — | — | **2 181** (papir: 2 746) |

⚠️ **KS er IKKE 6 825** — se Korrigering 1 over. V10 Mønster #1-rapporten er feil på dette punktet.

**Papir-delta:**
- AS/ASA: papir er 1 087 kr høyere (7 912 − 6 825)
- Andre Foretaksreg.-former: papir er 515 kr høyere (4 398 − 3 883)
- ENK (kun Enhetsreg.): papir er 565 kr høyere (2 746 − 2 181)

**Kilder:**
1. [Lovdata — Forskrift om gebyr til Brønnøysundregistrene (FOR-2015-12-11-1668)](https://lovdata.no/dokument/SF/forskrift/2015-12-11-1668) — § 5 (Foretaksregisteret) + § 5a (Enhetsregisteret)
2. [Lovdata — Endringsforskrift FOR-2025-12-16-2819](https://lovdata.no/dokument/LTI/forskrift/2025-12-16-2819) — vedtatt 16.12.2025, ikraft 1.1.2026, bekrefter alle 2026-beløp
3. [Brønnøysundregistrene — Fees for registration](https://www.brreg.no/en/how-can-we-help-you/fees-for-registration/)

**Historisk kontekst:**
- Pre-2024: 2 250 kr var en tidligere sats for mindre selskapsformer
- 2025-2026: 3 883 kr / 6 825 kr gjeldende, rekonfirmert i desember 2025 via endringsforskriften

**Anbefalt fix:**
- 4 rader × 9 lang = 36 strings
- Bytt `2,250` / `2 250` → `3,883` / `3 883` for ANS/DA/KS
- Verifiser at AS/ASA allerede er 6 825 (sub-agent bekreftet i en.js — andre lang-filer ukjent)

---

## Klynge D — avgift H2 AGA fribeløp for sektorunntak (9 strings)

**Kode-sti:** 9 lang-filer — `salAgaRows` fribeløp-rad
**Bekreftet stale-tilstand:** `en.js:321` — *"approx. 500,000 kr/year"*
**NO-tilstand:** `no.js:91` allerede korrekt med 850 000 kr/år (se Korrigering 2)

| Felt | Verdi |
|---|---|
| **Kode-verdi (NO korrekt)** | 850 000 kr/år |
| **Stale i 9 lang** | 500 000 kr/år |
| **Verifisert for 2026** | **850 000 kr/år** |
| **Confidence** | Høy |
| **Status** | 🔴 Stale i 9 lang |

**Kilder:**
1. [Stortingsvedtak 2025-12-18-2748 § 4 fjerde ledd](https://lovdata.no/dokument/STV/forskrift/2025-12-18-2748/KAPITTEL_1) — primærkilde for 2026, vedtatt 18.12.2025. Sitat: *"så lenge differansen mellom den avgift som ville følge av satsen i lokaliseringssonen, og satsen i sone I ikke overstiger 850 000 kroner"*
2. [Skatteetaten — AGA-satser 2026](https://www.skatteetaten.no/satser/arbeidsgiveravgift/) — *"I 2026 er fribeløpet 850 000 kroner per foretak"*
3. [Skatteetaten — Fribeløp for arbeidsgiver](https://www.skatteetaten.no/en/business-and-organisation/employer/employers-national-insurance-contributions/zones-calculation-codes-and-rates-for-employers-national-insurance-contributions/rates-and-calculation/the-employers-contribution-free-amount/) — *"The contribution-free amount is NOK 850,000 per year"*

**Historisk kontekst:**
- Før 2020: 500 000 kr
- 2020-2023: 500 000 kr
- **2024: økt til 850 000 kr** — IKKE en 2026-endring, men en 2024-endring som stale 9 lang aldri fikk med seg
- 2025-2026: 850 000 kr, uendret

**Cross-reference (unngå forveksling):**
- Ikke forveksle med bagatellmessig støtte / de minimis (€300 000 / 3 år fra 2024, tidligere €200 000)
- Ikke forveksle med AGA sone-satser (14,1 / 10,6 / 6,4 / 5,1 / 0 %)
- Ikke forveksle med "5 % ekstra AGA på lønn >850 000 kr" (innført 2023, opphevet 1.1.2025, allerede fikset i commit `3f75052`)
- **Tilfeldig konvergens:** Fribeløpet (850 000 kr AGA-differanse) er samme tall som den gamle ekstra-AGA-grensen (850 000 kr lønn), men de er to helt ulike konsepter

**Anbefalt fix:** Bytt `500,000 kr` / `500 000 kr` → `850,000 kr` / `850 000 kr` i `salAgaRows` fribeløp-rad × 9 filer.

---

## Anbefalt batch 3 eksekvering

### Fremgangsmåte
1. **Skriv** `scripts/fix_v10_batch3_stale_satser.py` — samme BS4 + surgical-replace-pattern som `fix_v10_aga_extra.py` og `add_search_translations.py`
2. **Targeter** 9 ikke-norske lang-filer: `ar.js`, `en.js`, `fr.js`, `lt.js`, `pl.js`, `so.js`, `ti.js`, `uk.js`, `zh.js`
3. **Per klynge** bruk eksplisitte søk/erstatnings-par (bygge på de eksakte mønstre grep-scanningen viser — en ekstra grep-runde per fil før scriptet kjøres)
4. **Idempotent** — NOOP hvis allerede fikset
5. **Diff-rapport** per fil før commit
6. **Verifiser** via `preview_eval` på minst 2 ikke-norske språk etter commit

### Commit-strategi (forslag — trenger Kasper-avklaring)

**Alternativ 1 — 4 separate commits per klynge** (lavest risiko, lettest å rulle tilbake delvis):
1. `Fix V10 C batch3: selskap reg.gebyr 9 lang (KS=3883 ikke 6825)` — mest kompleks, høyest risiko → først
2. `Fix V10 A batch3: skatt searchDs BSU/egenkapital/trygdeavgift 9 lang`
3. `Fix V10 B batch3: skatt searchDs trinnskatt 4→5 9 lang + search.js`
4. `Fix V10 D batch3: avgift salAgaRows fribeløp 500k→850k 9 lang`

**Alternativ 2 — 1 atomisk commit** (raskt, vanskeligere å rulle tilbake):
- `Fix V10 Mønster #1 batch 3: 82 stale strings i 9 lang-filer (4 klynger)`

Anbefaler Alternativ 1 pga Korrigering 1 (KS-feilen) — isolering reduserer blast radius hvis noe slipper gjennom.

---

## Oppfølging etter commit

1. **Oppdater V10-rapporten** i `audit/consolidated/hverdagsverktoy-audit-consolidated-v10.md` med Korrigering 1 (KS=3 883) så fremtidige audits ikke gjentar feilen
2. **Push sesjonslogg** via `/push-w` til Brain_HV som `wiki/notater/2026-04-11_research_v10-moenster1-batch3.md`
3. **Merk V10 Mønster #1 som ~90 % lukket** i ny aktiv-todo (fra V10 baseline 49 åpne → estimert ~10 åpne etter batch 3)
4. **Første reell test av `/research`-skillen fullført** — arkitektur-noten fra 2026-04-11 flagget "ingen tester ennå" som åpent spørsmål. Denne kjøringen validerer 6-fase-pipeline, primærkilde-katalog, og handoff-mønsteret /audit → /research → fix

---

## Metodenotater

- **Parallell dispatch:** 4 sub-agenter i ett message gav ~3 min total, vs ~15 min sekvensielt. Ingen sub-agent brukte mer enn 10 tool-kall.
- **Post-pass verifikasjon** (lesing av faktisk kode-tilstand etter sub-agent-returer) avdekket 2 kritiske korrigeringer som ingen av sub-agentene fanget alene. Dette er et argument for at en post-pass-fase (uoffisiell "Fase 7") bør innlemmes i skill v2.
- **V10 C1-preventiv fungerer:** Datum-sjekk-fasen stoppet ingen funn denne gang, men to av tre skatt-funn (trygdeavgift, egenkapital) hadde 2025 som sist-endret-dato. Uten datum-verifikasjon kunne vi ha citert 2023-kilder for 2026-verdier.
- **V10 audit-kvaliteten:** 3 av 4 klynger var korrekt identifisert med korrekte verdier. Klynge C (selskap) hadde feil KS-classification — flagget og korrigert her.

---

## Kilder (komplett liste)

### Primærkilder
- [Skatteetaten — BSU](https://www.skatteetaten.no/en/rates/deduction-for-young-peoples-housing-savings-bsu/)
- [Skatteetaten — National Insurance Contributions](https://www.skatteetaten.no/en/rates/national-insurance-contributions/)
- [Skatteetaten — Trinnskatt](https://www.skatteetaten.no/satser/trinnskatt/)
- [Skatteetaten — Arbeidsgiveravgift](https://www.skatteetaten.no/satser/arbeidsgiveravgift/)
- [Skatteetaten — Contribution-free amount](https://www.skatteetaten.no/en/business-and-organisation/employer/employers-national-insurance-contributions/zones-calculation-codes-and-rates-for-employers-national-insurance-contributions/rates-and-calculation/the-employers-contribution-free-amount/)
- [Skatteetaten — Forskuddsutskrivingen 2026](https://www.skatteetaten.no/en/rettskilder/type/uttalelser/uttalelser/forskuddsutskrivingen-2026/)
- [Lovdata — § 16-10 BSU forskrift](https://lovdata.no/forskrift/1999-11-19-1158/§16-10-5)
- [Lovdata — Utlånsforskriften FOR-2020-12-09-2648](https://lovdata.no/dokument/SF/forskrift/2020-12-09-2648)
- [Lovdata — Stortingsvedtak 2025-12-18-2747 § 3-9 (trinnskatt 2026)](https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747/%C2%A73-9)
- [Lovdata — Stortingsvedtak 2025-12-18-2748 § 4 (AGA 2026)](https://lovdata.no/dokument/STV/forskrift/2025-12-18-2748/KAPITTEL_1)
- [Lovdata — Forskrift om gebyr til Brønnøysundregistrene (FOR-2015-12-11-1668)](https://lovdata.no/dokument/SF/forskrift/2015-12-11-1668)
- [Lovdata — Endringsforskrift FOR-2025-12-16-2819](https://lovdata.no/dokument/LTI/forskrift/2025-12-16-2819)
- [Brønnøysundregistrene — Fees for registration](https://www.brreg.no/en/how-can-we-help-you/fees-for-registration/)

### Sekundærkilder
- [Regjeringen — Prop. 1 LS (2025-2026)](https://www.regjeringen.no/en/documents/prop.-1-ls-20252026/id3124192/)
- [Regjeringen — Senker kravet til egenkapital for boliglån](https://www.regjeringen.no/en/whats-new/amendments-to-the-lending-regulation/id3077641/)
- [Finanstilsynet — Boliglånsundersøkelsen 2025](https://www.finanstilsynet.no/publikasjoner-og-analyser/boliglansundersokelser/2025/boliglansundersokelsen-2025/informasjon-om-utlansforskriften/)
- [Stortinget — Innst. 3 S (2025-2026)](https://www.stortinget.no/no/Saker-og-publikasjoner/Publikasjoner/Innstillinger/Stortinget/2025-2026/inns-202526-003s/)
