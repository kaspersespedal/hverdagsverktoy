---
title: Selskap rettskilder — aksjeloven + stiftelsesloven
date: 2026-04-11
type: research
tags: [research, selskap, aksjeloven, stiftelsesloven, lovdata, 2026]
status: verified
triggered-by: /audit v12 R-sel-1..3
confidence: høy
scope: 3 rettskilde-claims i 10 lang-filer
---

# Selskap rettskilder — verifikasjon mot Lovdata (2026-04-11)

Bundle 4 (siste i V12 research-runden). Verifiserer 3 rettskilde-påstander i `shared/lang/*.js` for selskap-seksjonen mot Lovdata (aksjeloven og stiftelsesloven), per 2026-04-11.

---

## R-sel-1: Aksjeloven § 6-2 — Daglig leder-krav

**Fil:** `shared/lang/no.js:758` (selAslLedelseRows)

**Kode-påstand (eksakt sitat):**
> "Daglig leder — Ikke påkrevd hvis aksjekapitalen er under 3 mill. kr. Kan velges av styret."
> Henvisning: `asl. § 6-2`

**Verifisert mot Lovdata § 6-2 (gjeldende ordlyd):**
> "Selskapet skal ha en daglig leder. I selskaper med aksjekapital på mindre enn tre millioner kroner kan styret likevel bestemme at selskapet ikke skal ha daglig leder."

**Status:** Korrekt (KEEP).

**Detaljer:**
- Hovedregel: AS skal ha daglig leder.
- Unntak: AS med aksjekapital under 3 millioner kroner — styret kan beslutte å ikke ha DL.
- 3-millioners-terskelen er **fortsatt gjeldende** per 2026-04-11.
- Den påståtte 2019-lovendringen (LOV-2019-12-20-88) endret IKKE § 6-2. Endringen i 2019 berørte § 6-14 (klargjøring av at styret står for daglig ledelse når selskapet ikke har DL) og § 6-15 (rapporteringskrav, ikraft 2019-01-01).
- Kodens påstand "Ikke påkrevd hvis aksjekapitalen er under 3 mill. kr" er korrekt — men kan presiseres for tydelighet (jf. forslag under).

**Kilder:**
- Lovdata: https://lovdata.no/dokument/NL/lov/1997-06-13-44/KAPITTEL_6
- Debet.no (verifiserer ordlyd): https://www.debet.no/artikkel/sjekkliste-styrets-organisering
- Orgbrain.no (verifiserer at 2019-endringene IKKE rørte § 6-2): https://orgbrain.no/styrebloggen/endringer-i-aksjeloven-fra-2019-berorer-styret-og-daglig-leder

**Fix-forslag:** Ingen lovendring nødvendig. Valgfri presisering for klarhet:

```diff
- ['Daglig leder','Ikke påkrevd hvis aksjekapitalen er under 3 mill. kr. Kan velges av styret.','asl. § 6-2'],
+ ['Daglig leder','Hovedregel: skal ha daglig leder. Unntak: aksjekapital under 3 mill. kr — styret kan beslutte å ikke ha DL.','asl. § 6-2'],
```

(Begge formuleringer er teknisk korrekte; den første er kortere, den andre mer presis. Beholder kortere formulering siden den ikke er feil.)

---

## R-sel-2: Stiftelsesloven § 14 — Grunnkapital 100 000 vs 200 000 kr

**Fil:** `shared/lang/no.js:716` (selskapAndreBody) + 9 andre språkfiler

**Kode-påstand (eksakt sitat):**
> "Krav: minst 100 000 kr grunnkapital"
> (i Stiftelse-kortet under "Andre selskapsformer")

**Verifisert mot Lovdata stiftelsesloven § 14:**
> "Stiftelser skal ved opprettelsen ha en grunnkapital på minst 100.000 kroner. Stiftelsestilsynet kan gjøre unntak fra første punktum."
> "Hvis grunnkapitalen ikke fyller vilkåret i første ledd, er det ikke opprettet noen stiftelse..."

**Verifisert mot Lovdata stiftelsesloven § 22 (næringsdrivende stiftelser):**
> Næringsdrivende stiftelser (definert i § 4 (2) bokstav a og b) skal ha grunnkapital på **minst 200 000 kroner**.

**Status:** Trenger omformulering (UPDATE).

**Detaljer:**
- § 14 er korrekt for ALMINNELIGE stiftelser: 100 000 kr grunnkapital.
- Men næringsdrivende stiftelser har et høyere krav: 200 000 kr (jf. § 22).
- Kodens nåværende formulering nevner kun 100 000 og er ufullstendig — den er ikke direkte feil, men misvisende fordi den implisitt antyder at 100k gjelder ALLE stiftelser.
- Påvirker 10 språkfiler (no.js + 9 oversettelser), siden teksten er translatert til alle 10 språk.

**Fix-forslag (no.js, og tilsvarende i alle 10 språkfiler):**

```diff
- ['Stiftelse','En selvstendig formuesmasse uten eiere — stiftet for et bestemt formål (veldedighet, forskning, kultur). Ingen kan ta ut overskudd. Styres av et styre i henhold til vedtektene. Krav: minst 100 000 kr grunnkapital. Regulert av stiftelsesloven (LOV-2001-06-15-59).']
+ ['Stiftelse','En selvstendig formuesmasse uten eiere — stiftet for et bestemt formål (veldedighet, forskning, kultur). Ingen kan ta ut overskudd. Styres av et styre i henhold til vedtektene. Krav: minst 100 000 kr grunnkapital (200 000 kr for næringsdrivende stiftelser). Regulert av stiftelsesloven (LOV-2001-06-15-59).']
```

**Lang-filer som må oppdateres (10 stk):**
- `shared/lang/no.js`
- `shared/lang/en.js`
- `shared/lang/ar.js`
- `shared/lang/zh.js`
- `shared/lang/fr.js`
- `shared/lang/pl.js`
- `shared/lang/uk.js`
- `shared/lang/lt.js`
- `shared/lang/so.js`
- `shared/lang/ti.js`

Hver oversettelse må få en passende parallell-formulering på sitt språk (eks. EN: "minimum 100,000 NOK foundation capital (200,000 NOK for commercial foundations)").

**Kilde:** Lovdata: https://lovdata.no/dokument/NL/lov/2001-06-15-59 (stiftelsesloven §§ 14 og 22)

---

## R-sel-3: Aksjeloven § 13-3 og § 13-14 — Fusjon

**Fil:** `shared/lang/no.js:780` (selAslFusjonRows)

**Kode-påstand (eksakt sitat):**
> "Fusjon — sammenslåing — Et selskap overtar et annet. Krever fusjonsplan, 2/3 flertall i begge selskap og 6 ukers kreditorvarsel."
> Henvisning: `asl. § 13-3 og § 13-14`

**Verifisert mot Lovdata aksjeloven § 13-3:**
> "Styrene i de selskapene som skal fusjonere, skal utarbeide en felles fusjonsplan ... generalforsamlingen godkjenner fusjonsplanen med flertall som for vedtektsendring."

**Verifisert mot Lovdata aksjeloven § 13-14:**
> "Foretaksregisteret skal kunngjøre beslutningene om fusjon ... og varsle selskapenes kreditorer om at innsigelse mot fusjonen må meldes til selskapet innen seks uker fra kunngjøringen."

**Status:** Korrekt (KEEP).

**Detaljer:**
- § 13-3 regulerer både **fusjonsplan** (utarbeidelse av styret) og **vedtaksflertall** ("flertall som for vedtektsendring" = 2/3, jf. § 5-18).
- § 13-14 regulerer **6 ukers kreditorvarsel**.
- Kodens henvisning "asl. § 13-3 og § 13-14" dekker korrekt begge regelområder:
  - § 13-3 → fusjonsplan + 2/3 flertall (én paragraf for to elementer)
  - § 13-14 → 6 ukers kreditorvarsel
- Tre elementer er nevnt i koden (fusjonsplan, 2/3 flertall, 6 ukers kreditorvarsel), og to paragrafer dekker dem korrekt.

**Fix-forslag:** Ingen endring nødvendig. Påstanden og henvisningen er korrekt.

**Kilde:** Lovdata: https://lovdata.no/dokument/NL/lov/1997-06-13-44/KAPITTEL_13

---

## Oversikt — 3 spørsmål × status

| ID | Spørsmål | Status | Lang-filer påvirket | Kommentar |
|----|----------|--------|---------------------|-----------|
| R-sel-1 | asl. § 6-2 — Daglig leder-krav | Korrekt | 0 | 3M-terskelen er fortsatt gjeldende. Ingen lovendring siden 2017/2019 påvirket § 6-2. |
| R-sel-2 | stiftelseslov. § 14 — Grunnkapital | Trenger omformulering | 10 | Mangler at § 22 setter 200k for næringsdrivende stiftelser. |
| R-sel-3 | asl. § 13-3 og § 13-14 — Fusjon | Korrekt | 0 | Paragrafhenvisningene matcher rettskildene. |

---

## Lovendringer 2020-2026 oppdaget under verifikasjonen

- **LOV-2017-04-21-15** (ikraft 2017-07-01): Forenklinger i aksjeloven kap. 6, men ikke § 6-2 (DL-krav uendret).
- **LOV-2018-06-22-77** og **Prop. 100 L (2017-2018)**: Endringer i avvikling, mellombalanser m.m. — ikke § 6-2.
- **LOV-2019-12-20-88**: Endringer i § 6-14 og § 6-15 (styret står for daglig ledelse når DL mangler; rapporteringskrav teknologinøytralt). Ikraft 2019-01-01. Påvirket IKKE § 6-2.
- **LOV-2023-12-20-114** (ikraft 2024-01-01): Innførte krav om kjønnssammensetning i styrer (§§ 6-11a og 6-11b). Påvirker ikke noen av de 3 verifiserte påstandene.
- **Stiftelsesloven §§ 14 og 22**: Ingen kjente lovendringer 2020-2026 som har endret grunnkapital-tersklene.

Konklusjon: Ingen kritiske bugs avdekket. Eneste reelle fix er R-sel-2 (presisering av § 22-tilfellet for næringsdrivende stiftelser).

---

## Konfidens-vurdering

**Konfidens:** Høy.

- R-sel-1: Verifisert mot 4 uavhengige kilder (Lovdata, debet.no, orgbrain.no, og søk via Web Search). Den første WebFetch-responsen var feilaktig (sa "kan ha en daglig leder") men er motbevist av påfølgende verifikasjoner.
- R-sel-2: Verifisert mot Lovdata. § 14 og § 22 er klart definert.
- R-sel-3: Verifisert mot Lovdata kap. 13. To paragrafer dekker tre elementer korrekt.

---

## Endelig fix-anbefaling

**Må fikses i alle 10 språkfiler (R-sel-2):**
- Legg til "(200 000 kr for næringsdrivende stiftelser)" eller tilsvarende i Stiftelse-kortet.

**Kan beholdes som er (R-sel-1, R-sel-3):**
- Ingen endring nødvendig. Kodens påstander er korrekte.
