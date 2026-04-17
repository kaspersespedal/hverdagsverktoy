# Knowledge Harvest -- Website Relevant/
**Dato:** 2026-04-13
**Formaal:** Kartlegge innhold i Website Relevant/ som kan bli nye features paa hverdagsverktoy.com

---

## TIER 1 -- Hoey verdi, direkte implementerbare

### 1. Nokkeltallskalkulator (Financial Ratios Calculator)
- **Fil:** `Excel/Mal for nokkeltall.xlsx`
- **Innhold:** Template med 6 sentrale norske nokkeltall beregnet kvartalsvis med ekte formler
- **Nokkeltall med formler:**
  - **Likviditetsgrad** = Sum omlopsmidler / Sum kortsiktig gjeld
  - **Totalkapitalrentabilitet (RTK)** = (Ordinaert resultat for skatt + Finanskostnad) / Gj.snitt totalkapital
  - **Finansieringsgrad** = Sum anleggsmidler / (Sum langsiktig gjeld + Egenkapital)
  - **Soliditet** = Egenkapital / Totalkapital
  - **Egenkapitalrentabilitet** = Ordinaert resultat for skatt / Gj.snitt egenkapital
- **Ekstra nokkeltall fra Revisjon.xlsx:**
  - Bruttofortjeneste = (Salg - Varekost) / Salg
  - Varekost i % av SI
  - Omlopshastighet varelager = SI / Gj.snitt varelager
  - Omlopshastighet kundefordringer = SI / Gj.snitt kundefordringer
- **Feature:** Interaktiv kalkulator der bruker legger inn regnskapstall og faar alle nokkeltall beregnet automatisk med forklaring
- **Seksjon:** /selskap eller /kalkulator
- **Estimert innsats:** MEDIUM (8-12 timer)
- **Prioritet:** HOEY -- unikt norskspraaklig verktoy, lav konkurranse

---

### 2. Lonnsberegning og Arbeidsgiverkostnad-kalkulator
- **Fil:** `Excel/Lonn - foring regnskap.xlsx`
- **Innhold:** Flere oppgaver med lonnsberegning inkl. arbeidsgiveravgift, feriepenger, skattetrekk
- **Formler:**
  - Feriepenger = Bruttlonn * 12% (evt. 14.3% over 60 aar)
  - Arbeidsgiveravgift = Bruttlonn * 14.1% (soneavhengig)
  - Paloppt arbeidsgiveravgift paa feriepenger = Feriepenger * 14.1%
  - Skattetrekk = Bruttlonn * skatteprosent
  - Total arbeidsgiverkostnad = Lonn + Feriepenger + AGA + AGA paa feriepenger
- **Kontoforing inkludert:** Konto 5000, 5180, 5400, 5480, 2600, 2770, 2780, 2940
- **Feature:** Kalkulator: "Hva koster en ansatt?" -- bruker skriver inn bruttlonn, faar ut total kostnad med alle paalagg
- **Seksjon:** /selskap (bedrift/arbeidsgiver) eller /kalkulator
- **Estimert innsats:** LITEN (4-6 timer)
- **Prioritet:** HOEY -- svarer paa et veldig vanlig sporsmaal

---

### 3. Personlig Budsjett-kalkulator
- **Fil:** `Fornuftig Mappe/Leilighet Kaspdrea.xlsx`
- **Innhold:** Komplett personlig budsjett med inntekter (lonn, stipend, studielaan) og kostnader (lan, mat, forsikring, bensin, bom, trening, mobil, internett, felleskostnader, innboforsikring)
- **Struktur:**
  - Inntekter: Sumpert per kilde
  - Kostnader: Kategorisert per post
  - Maanedlig sparing = Inntekter - Kostnader
  - Maanedlig budsjett per maaned (Mai-Desember)
- **Feature:** Personlig budsjett-verktoy: bruker legger inn sine inntekter og kostnader, faar ut sparerate, oversikt, og maanedlig oppsett
- **Seksjon:** /personlig
- **Estimert innsats:** MEDIUM (6-10 timer)
- **Prioritet:** HOEY -- veldig relevant for maalgruppen

---

### 4. Verdsettelse-kalkulator (Residual Earnings Model)
- **Filer:**
  - `Verdsettelse/Verdsettelse.xlsx` (16 ark med eksamensolosninger)
  - `Verdsettelse/Innlevering/Hand In Spring 2025.xlsx`
  - `Verdsettelse/Eksamener og Make-Up/Kronologisk ned fra 2024.xlsx`
  - `Excel/Verdsettelse innlevering regneark.xlsx` (beta-beregning med regresjon)
- **Kjernformler:**
  - **ROCE** = EPS / BPS(t-1)
  - **RE (Residual Earnings)** = EPS - (BPS(t-1) * r)
  - **PV av RE** = RE / (1+r)^t
  - **Terminal Value** = RE(T+1) / (r - g)
  - **Aksjeverdi** = BPS + Sum PV(RE) + PV(TV)
  - **Implisert vekst** fra P/B: g = r - RE/((P - BV) * (1+r)^T)
  - **Free Cash Flow** = Net Income + Depreciation +/- WC changes - CapEx
  - **Enterprise Value** = Equity MV + Net Debt
  - **RNOA** = Operating Income After Tax / Avg NOA
  - **Comparable Valuation:** P/E, P/B, P/S multipler
  - **Beta-beregning:** Regresjon av aksje vs. indeks, kovarians/varians-metode
  - **Levered Beta** = Unlevered Beta * (1 + (1-t) * D/E)
  - **WACC-input:** Beta, risikofri rente, markedspremie
- **Feature:** Steg-for-steg aksjeverdsettelse: bruker legger inn EPS, DPS, BPS, r, g -- faar verdibeslag
- **Seksjon:** /selskap eller /kalkulator
- **Estimert innsats:** STOR (15-20 timer)
- **Prioritet:** MEDIUM-HOEY -- avansert men hoey verdi for studenter/investorer

---

## TIER 2 -- Referansekort og guider

### 5. Revisjon Referansekort (Audit Reference Guide)
- **Filer:**
  - `Revisjon/Chat forslag til losning av Revisjon.docx` (36+ avsnitt, fullstendig revisjonsmetodikk)
  - `Revisjon/Revisjon.xlsx` (komplett saldobalanse med nokkeltall)
  - `Revisjon/Revisjon Oppgave 3.docx`
  - `Revisjon/Obligatorisk oppgave 2.docx` (hvitvasking/okokrim)
- **Innhold dekker:**
  - Vesentlighet (materiality): referanseverdier, arbeidsvesentlighet (50-75% av total)
  - Revisjonspaastandene: forekomst, fullstendighet, verdsettelse, eksistens, noyaktighet, avgrensning
  - Risikostyrt tilnaerming per regnskapslinje
  - ISA 200, ISA 240 (svindel), ISA 315 (risikoidentifikasjon)
  - Revisjonsberetning: ren, modifisert, forbehold
  - Avvikshaandtering: individuell vs. kumulativ vurdering
- **Feature:** Interaktivt oppslagskort: "Hvilken revisjonspaastand er viktigst for [regnskapslinje]?" med forklaringer
- **Seksjon:** /selskap (ny underseksjon for revisjon/kontroll)
- **Estimert innsats:** MEDIUM (8-12 timer)
- **Prioritet:** MEDIUM -- nisje men verdifullt for revisjonsstudenter

---

### 6. Regnskapsmal / Bilagsforing (Norwegian Bookkeeping Template Guide)
- **Filer:**
  - `Excel/Regnskap mal.xlsx` (blank T-konto mal med alle kontoer)
  - `Excel/Regnskap.xlsx` (utfylt eksempel med ekte tall)
  - `Excel/Mal til gruppeprosjekt regnskap (AAPEN FOR ENDRING).xlsx` (28 bilag med forklaringer + aarsavslutning)
- **Kontostruktur som er mappet:**
  - 1xxx Eiendeler: 1242 Trucker, 1250 Inventar, 1460 Varebeholdning, 1500 Kundefordring, 1580 Avs. tap, 1710 Forskuddsbetaling, 1920 Bank, 1950 Skattetrekkkonto, 1100 Bygninger, 1280 Kontormaskiner
  - 2xxx Gjeld/EK: 2000 EK/Aksjekapital, 2050 Annen EK, 2240 Laan, 2381 Kassakreditt, 2400 Leverandorgjeld, 2600 Skattetrekk, 2700/2710/2740 MVA, 2770 Skyldig AGA, 2780 Paloppt AGA, 2940 Feriepenger, 2960 Palopte renter
  - 3xxx Inntekter: 3000 Salgsinntekt
  - 4xxx Varekjop: 4300 Varekjop, 4360 Frakt/toll
  - 5xxx Lonn: 5000 Lonn, 5180 Ferielonn, 5252 Ulykkesforsikring, 5400 AGA, 5480 AGA feriepenger
  - 6xxx Driftskostnader: 6010 Avskrivninger, 6190 Transport, 6300 Husleie, 6800 Kontorrekvisita
  - 7xxx Andre: 7790 Andre driftskostnader, 7830 Tap paa fordringer
  - 8xxx Finans: 8150 Rentekostnader, 8961 Overf. resultat
- **Feature:** Norsk kontoplan-referanse med forklaringer + interaktiv bilagsforing (velg type transaksjon, se korrekte kontoer)
- **Seksjon:** /selskap
- **Estimert innsats:** STOR (12-16 timer)
- **Prioritet:** MEDIUM -- studenter/grundere leter etter dette

---

### 7. Selvkost- og Normalkalkulasjon (Cost Accounting Calculator)
- **Filer:**
  - `Excel/Fasit omfattende oppgave!.xlsx` (standardkostregnskap)
  - `Excel/Oppgave normalkalkulasjon.xlsx` (normalkostregnskap selvkostprinsipp)
- **Formler:**
  - Normalsats materialavdeling = Ind. kostn. / Direkte material
  - Normalsats maskinavdeling = Ind. kostn. / Maskintimer
  - Normalsats foredlingsavdeling = Ind. kostn. / Arbeidstimer
  - Normalsats S&A = Ind. kostn. S&A / Solgte varers tilvirkningskost
  - Tilvirkningskost = Direkte kostnader + Indirekte tilvirkningskostnader
  - Selvkost = Tilvirkningskost + S&A
  - Dekningsdifferanse = Standard - Virkelig (for indirekte kostnader)
  - Produksjonsresultat = Produktresultat - Dekningsdifferanser - Direkte avvik
- **Feature:** Selvkost-kalkulator der bruker legger inn direkte og indirekte kostnader, faar ut normalsatser og produktresultat
- **Seksjon:** /selskap eller /kalkulator
- **Estimert innsats:** STOR (12-16 timer)
- **Prioritet:** LAV-MEDIUM -- akademisk nisje

---

### 8. 3-Statement Financial Model Guide
- **Filer:**
  - `Excel/3-Statement Model.xlsx` (Otis Elevator-basert modell 2019-2026)
  - `Excel/Balanse.Regnskap.Kontantstrom.xlsx` (Career Principles kursopplegg)
- **Innhold:**
  - Komplett Income Statement med drivere (vekst, markedsandel, marginer)
  - Balance Sheet med koblet arbeidskapital (AR, Inventory, AP via dager)
  - Cash Flow Statement: Indirekte metode med WC-justeringer
  - Drivers: vekstrate, markedsandel, COGS%, SGA%, skattesats, capex, avskrivning
  - Balance Sheet Check (Assets = L + E)
  - Retained Earnings-kobling mellom perioder
- **Feature:** Interaktiv guide/referansekort som forklarer sammenhengen mellom resultat, balanse og kontantstrom
- **Seksjon:** /selskap
- **Estimert innsats:** MEDIUM (8-12 timer)
- **Prioritet:** MEDIUM -- nyttig for finansstudenter

---

### 9. Konsernregnskap / Konsolidering Guide
- **Filer:**
  - `Rapportering/Forsoek paa Oppgaver/Selskapsrapportering.xlsx` (8 ark: konsolidering, PURP, goodwill, NCI, mixed groups)
  - `Rapportering/Forsoek paa Oppgaver/T-konto illustrasjon av kontantstrom.xlsx` (konsern-CF med oppkjop/salg)
  - `Rapportering/Forsoek paa Oppgaver/Profit-or-Loss.xlsx` (konsolidert resultat med PURP/IFRS 15)
  - `Rapportering/Assignment/Til-eksamen.xlsx` (full konsolidering med workings)
- **Sentrale konsepter med formler:**
  - **Goodwill** = Purchase Consideration + FV NCI - Net Assets at Acquisition
  - **NCI** = NCI% * Net Assets + Post-acq retained earnings% - Impairment%
  - **Retained Earnings (konsern)** = Parent RE + Parent% * Subsidiary post-acq RE - Impairment% - PURP
  - **PURP (Unrealised Profit)** = Goods sold between companies * Markup rate * % still in inventory
  - **Net Assets at Acquisition** = Equity Capital + Retained Earnings + FV Adjustments
  - **Cash Flow fra konsolidering:** Justere for oppkjop/avhendelse av datterselskap
- **Feature:** Konsolideringsguide med steg-for-steg workings (W1-W7 metode), eller en enkel kalkulator for goodwill/NCI
- **Seksjon:** /selskap
- **Estimert innsats:** STOR (15-20 timer)
- **Prioritet:** LAV-MEDIUM -- avansert fagstoff

---

## TIER 3 -- Begrenset verdi / for generelt

### 10. Lineaer Regresjon (Excel tutorial)
- **Fil:** `Excel/Lineaer regresjon.xlsx`
- **Innhold:** Generisk scatter plot og regresjonsovelse (slides vs. lines of code). Ikke norsk finans-spesifikt.
- **Vurdering:** SKIP -- for generelt, ingen norsk domene-kunnskap

### 11. Excel Kurs-filer
- **Filer:** `Excel Kurs/`, `Nyttig Excel/Funksjoner_30_3_26.xlsx`
- **Innhold:** Pivot tables, REGEX, GROUPBY, XLOOKUP etc. Generisk Excel-opplaering.
- **Vurdering:** SKIP -- ingen norsk finans-domene

### 12. Data PowerBI Course
- **Fil:** `Data PowerBI Course/` (job postings data)
- **Innhold:** Kursdata for Power BI. Ingen norsk finansinnhold.
- **Vurdering:** SKIP

### 13. SQL kurs/prosjekter
- **Filer:** `SQL/`, `sql-data-warehouse-project/`, `sql-ultimate-course/`
- **Innhold:** Generiske SQL-ovelser og kursopplegg.
- **Vurdering:** SKIP

### 14. Skills-mapper
- **Fil:** `Skills/*.zip`
- **Innhold:** Claude Code skills og plugins. Ikke website-innhold.
- **Vurdering:** SKIP

### 15. Diverse personlige filer
- **Filer:** `Fornuftig Mappe/Sivert Tale.docx`, `Fornuftig Mappe/kinobilett.pdf`, `Fornuftig Mappe/tjenestebevis ke.pdf`
- **Vurdering:** SKIP -- personlige dokumenter

### 16. Metode-oppgave (R-prosjekt)
- **Fil:** `Metode_Oppgave/` (R-prosjekt med CSV-data)
- **Vurdering:** SKIP -- statistisk metode-ovelse, ikke relevant

### 17. Baerekraftsrapportering
- **Fil:** `Levering Term Paper/MRR260_25H_Baerekraftsrapportering.pdf`
- **Innhold:** Term paper om sustainability reporting. Mulig fremtidig guide, men ikke prioritert.
- **Vurdering:** LAV PRIORITET -- kan bli referansekort i fremtiden

---

## Oppsummering: Anbefalte implementeringer

| # | Feature | Seksjon | Innsats | Prioritet |
|---|---------|---------|---------|-----------|
| 1 | Nokkeltallskalkulator | /kalkulator | Medium | HOEY |
| 2 | "Hva koster en ansatt?" kalkulator | /kalkulator | Liten | HOEY |
| 3 | Personlig budsjett-verktoy | /personlig | Medium | HOEY |
| 4 | Aksjeverdsettelse (RE-modell) | /kalkulator | Stor | Medium-Hoey |
| 5 | Revisjon referansekort | /selskap | Medium | Medium |
| 6 | Norsk kontoplan-referanse | /selskap | Stor | Medium |
| 7 | Selvkost/normalkalkulasjon | /kalkulator | Stor | Lav-Medium |
| 8 | 3-Statement modell guide | /selskap | Medium | Medium |
| 9 | Konsolidering guide/kalkulator | /selskap | Stor | Lav-Medium |

**Quick wins (under 1 dag):** #2 Arbeidsgiverkostnad-kalkulator
**Beste ROI:** #1 Nokkeltallskalkulator + #2 Arbeidsgiverkostnad + #3 Personlig budsjett
**Hoeyest faglig verdi:** #4 Verdsettelse-kalkulator + #5 Revisjon-referanse

---

## Neste steg

1. Prioriter #2 (Arbeidsgiverkostnad) som foerste implementering -- liten innsats, hoey soekeverdi
2. Deretter #1 (Nokkeltall) og #3 (Budsjett) som medium-prosjekter
3. #4 (Verdsettelse) som et storre prosjekt naar de andre er paa plass
4. Vurder #5-#6 som innholdsprosjekter for /selskap-seksjonen
