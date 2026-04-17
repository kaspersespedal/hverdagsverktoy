# Nye kalkulatorer — brainstorm og specs
**Kilde:** Gmail-draft fra Mac, 13. april 2026
**Status:** Specs klare, ikke implementert

## Prioritert rekkefølge

### 1. AKSJEBESKATNING-KALKULATOR (HOEY)
- Seksjon: /kalkulator
- Konkurrenter har dette (Smartepenger)
- Input: Kjoepspris, salgspris, antall aksjer, eiertid, skjermingsrente, type (gevinst/utbytte)
- Formler:
  - Skjermingsfradrag = kostpris x skjermingsrente (akkumuleres aarlig)
  - Skattepliktig = (gevinst - skjermingsfradrag) x 1.72
  - Skatt = skattepliktig x 22%
  - Effektiv sats ~37.84% uten skjermingsfradrag
- Kilder: skatteetaten.no/satser/risikofri-rente, oppjusteringsfaktor 1.72

### 2. BIL KJOP VS LEASING (HOEY)
- Seksjon: /personlig
- Stort soekevolum (If, NAF, bilhjelpen har dette)
- Input: Bilpris, restverdi, eierperiode, laanrente, leasingpris/mnd, forsikring, vedlikehold
- Formler:
  - Kjoep: laanekostnad + forsikring + vedlikehold + verditap - restverdi
  - Leasing: maanedlig x maaneder + etablering + forsikring
  - Break-even punkt

### 3. FORBRUKSLAN-KALKULATOR (MEDIUM)
- Seksjon: /personlig eller /boliglan
- Input: Laanebeloep, nominell rente, gebyrer, nedbetalingstid
- Formler: Annuitet, total rentekostnad, effektiv rente inkl gebyrer
- Ekstra: "Hva koster det aa bare betale minimum paa kredittkort?"

### 4. PENSJONSKALKULATOR UTVIDET (MEDIUM)
- Seksjon: /personlig
- Vi har enkel OTP — mangler full pensjonsoversikt
- Input: Alder, pensjonsalder, aarsloenn, aar i arbeid, OTP-sats, egen sparing, avkastning
- Formler: Folketrygd (18.1% av inntekt opp til 7.1G), OTP akkumulert, samlet pensjon
- Dekningsgrad: pensjon / naavaerent loenn (maal 66%)

### 5. ARV/GAVE-KALKULATOR (MEDIUM — UNIK)
- Seksjon: /personlig
- Ingen konkurrent har god versjon
- Input: Type (arv/gave), eiendel (bolig/aksjer/kontanter), verdi, kostpris, antall arvinger
- Logikk: Ingen arveavgift (avskaffet 2014), MEN kontinuitetsprinsippet
  - Arving overtar skattemessig inngangsverdi
  - Bolig med botid: arver markedsverdi
  - Aksjer: arver kostpris + skjermingsfradrag
  - Dokumentavgift: 0 kr for arv i rett linje

### 6. ABONNEMENT-UTVIDELSE (LAV)
- Bygger paa eksisterende abonnement-tracker
- Forhaaandsutfylte norske tjenester (Netflix, Viaplay, Spotify etc. med 2026-priser)
- Kategorisering + "Hva om du kuttet X?" scenario-modus
