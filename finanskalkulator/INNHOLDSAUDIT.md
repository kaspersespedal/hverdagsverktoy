# Innholdsaudit — hverdagsverktoy.com

**Dato:** 22. mars 2026
**Gjennomgang av:** Kasper Espedal (via Claude)
**Omfang:** Alle 6 HTML-sider + shared/ (core.js, regions.js, style.css) — kildekode + live-site i Chrome
**Tidligere rapporter:** FEILRAPPORT.md (18. mars 2026), KALKULATOR-VERIFISERING.md (18. mars 2026)

---

## SAMMENDRAG

Nettsiden hverdagsverktoy.com er en imponerende samling av 20+ finanskalkulatorer fordelt over 6 sider med 10-språksstøtte. Den overordnede kvaliteten er høy — beregningene er verifisert korrekte (17/18 kalkulatorer, se tidligere rapport), designet er konsistent og profesjonelt, og personvernhåndteringen er solid. Denne auditen dekker alt innhold: tekst, struktur, SEO, tilgjengelighet, juridisk, og innholdslogikk.

---

## 1. SIDESTRUKTUR OG INNHOLD

### 1.1 index.html — Forsiden
**Status:** God
**Innhold:** Hero-seksjon, temavalgbar, 5 verktøykort, footer med personvern + kontakt.

Funn:
- Hero-undertittel sier «Praktiske verktøy for privatøkonomi» men nettsiden dekker også bedriftsøkonomi (MVA-justering, AGA-soner, saldoavskrivning, uttaksbeskatning, LVU). Undertittelen i `<h1>` sier «Praktiske verktøy for bedrift og privat», mens hero-p teksten og meta description kun nevner privatøkonomi. **Vurder å konsistentgjøre budskapet.**
- Dashboard-kortet for «Personlig økonomi» har id `dash-t-npv` og `dash-t-npv-d` — arv fra da det var NPV-kalkulatoren. Ikke en bruker-synlig bug, men forvirrende i koden.
- Forsiden mangler en `<nav>` — den er eneste side uten navigasjonsbar. Dette er bevisst (dashboard-layout), men betyr at en bruker som lander her ikke ser at det finnes undersider med mer innhold uten å scrolle til verktøykortene.

### 1.2 kalkulator.html — Kalkulator
**Status:** God
**Innhold:** Hovedkalkulator (enkel/vitenskapelig), valutaomregner, finansiell kalkulator, + 8 fagkalkulatorer i sidebar (NPV/IRR, avskrivning, feriepenger, ansattkostnad, pensjon, effektiv rente, valutagevinst, likviditet).

Funn:
- Fagkalkulatormeny i høyre kolonne er svært lang — brukeren må scrolle forbi Enkel/Valuta/Finansiell/Vitenskapelig + 8 fagkalkulatorer. Vurder gruppering eller søkefelt.
- «Lønn vs Utbytte»-kalkulatoren vises ikke i sidebar-menyen på kalkulator.html, selv om den finnes i core.js. Sjekk om den skal vises her eller kun under skatt.
- Fokus-modus fungerer bra på desktop. Mobil-fokusmodus har egen bar med «Bytt kalkulator»-knapp.

### 1.3 boliglan.html — Boliglån
**Status:** God
**Innhold:** Boliglånskalkulator, dokumentavgiftkalkulator, hjelp-kort, + boligguide (krav, kostnader, BSU).

Funn:
- BSU-kortet har tittel «Boligsparing for ungdom (13–33 år)». **Aldersgrensen for BSU ble endret til 34 år fra 2024.** Sjekk at regions.js-innholdet reflekterer dette korrekt.
- Dokumentavgiftkalkulatoren er et godt tillegg. Sjekk at borettslagsopsjonen (0 kr avgift) er tydelig forklart for brukeren.
- Boligguide-innholdet genereres via JS fra regions.js. Kvaliteten er avhengig av oversettelseskvaliteten i de 10 språkene.

### 1.4 skatt.html — Skatt
**Status:** Svært god — mest innholdsrik side
**Innhold:** 5 kalkulatorer (lønn etter skatt, uttak, utdeling, formue, reisefradrag) + skatteguide + skatteloven (11 kapitler) + skattemelding-sjekkliste.

Funn:
- Skattesiden er den mest omfattende og har svært godt innhold. Skatteloven-referansen med 11 underkapitler er imponerende.
- Skattemelding-sjekklisten med interaktive avhakinger og estimert besparelse er et godt verktøy.
- Reisefradrag-kalkulatoren bruker `1,70 kr/km` som standardsats. **Sjekk at dette er oppdatert for 2026** (1,70 kr/km gjelder for avstand over 50 000 km, 1,76 kr/km for de første 50 000 km for 2025 — kontroller 2026-satser).
- Formueskattekalkulatoren inkluderer verdsettelsesrabatter og bunnfradrag — solid implementering.

### 1.5 personlig.html — Personlig økonomi
**Status:** God — mest brukervennlig for yngre målgruppe
**Innhold:** 6 kalkulatorer (budsjett, bil, sparing, studielån, lønn etter skatt for unge, abonnement) + veiledningsseksjon med steg-for-steg guider.

Funn:
- Studielånskalkulatoren bruker «satser 2025–2026». **Verifiser at basisstøttebeløpet (p.t. ~13 940 kr/mnd) og stipendandeler er korrekt for studieåret 2025–2026.**
- Sparekalkulator med graf (canvas-basert) er visuelt effektiv. God formidling av rentes rente-effekten.
- Abonnementskalkulatoren har forhåndsvalgte norske tjenester (Spotify, Netflix, VG+, osv.) — godt lokalisert.
- Lønnskalkulatoren for unge har frikortgrense satt til 70 000 kr. **Sjekk om dette er korrekt for 2026** (var 70 000 kr i 2025).
- Duplikat `id`-attributt på linje 534: `id="lonn-frikort-hint"` finnes to ganger (en som id, en inline). Kun kosmetisk, men HTML-validator vil klage.

### 1.6 avgift.html — Avgift
**Status:** God
**Innhold:** MVA-kalkulator, justeringskalkulator (mval. kap. 9), hjelp, AGA-soner, + avgiftsguide (intro, avgiftspliktig, satser, merverdiavgiftsloven med 7 kapitler).

Funn:
- Justeringskalkulatoren med detaljert forklaring av mval. kap. 9 er et unikt verktøy — ikke vanlig å finne gratis.
- Merverdiavgiftsloven-referansen med 7 underkapitler (definisjoner, registrering, unntak, beregning, fritak, fradrag, justering) er svært grundig.
- AGA-soner vises som et eget kort — god separasjon fra MVA-innholdet.

---

## 2. SEO OG METADATA

### 2.1 Metadata-konsistens

| Side | title | description | keywords | OG | Twitter | canonical | robots |
|------|-------|-------------|----------|-----|---------|-----------|--------|
| index.html | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| kalkulator.html | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| boliglan.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| skatt.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| personlig.html | ✅ | ✅ | — | — | — | — | — |
| avgift.html | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Funn:
- **personlig.html mangler**: keywords, Open Graph, Twitter Card, canonical og robots-meta. Dette er den eneste siden uten full SEO-markup. Bør legges til.
- index.html og kalkulator.html mangler Twitter Card-tags (har OG, men ikke Twitter). Mindre viktig, men kan forbedres for konsistens.
- Alle `og:locale` er korrekt satt til `nb_NO`.
- Alle canonical-URL-er ender med `/` (f.eks. `/boliglan/`) — konsistent og riktig for directory-baserte URL-er.

### 2.2 Titler og beskrivelser

Alle sider følger mønsteret `[Sidenavn] – Hverdagsverktøy`. Beskrivelsene er relevante og inneholder norske søkeord. Ingen title er over 60 tegn, og ingen description er over 160 tegn.

### 2.3 Strukturerte data

Ingen JSON-LD eller schema.org markup er implementert. For en finanskalkulator-side kan `WebApplication`-, `SoftwareApplication`- eller `FAQPage`-schema være nyttige for synlighet i Google.

---

## 3. INNHOLDSKVALITET

### 3.1 Språk og tone
- Norsk innhold er gjennomgående godt skrevet — klart, enkelt og informativt.
- Konsistent «du»-form (uformelt, men profesjonelt).
- Fagterminologi er korrekt brukt med forklaringer der det trengs.

### 3.2 Juridiske referanser
Nettsiden refererer hyppig til norsk lovverk. Sjekkliste for korrekthet:

| Referanse | Brukt i | Korrekt? |
|-----------|---------|----------|
| Skatteloven (sktl.) | skatt.html | ✅ Kapittelreferanser er korrekte |
| Merverdiavgiftsloven (mval.) | avgift.html | ✅ §§ 9-1 til 9-7 korrekt referert |
| Regnskapsloven (rskl.) § 5-3 | kalkulator.html (avskrivning) | ✅ |
| Aksjonærmodellen | skatt.html (utdeling) | ✅ Oppjusteringsfaktor 1.72 |
| Foretaksmodellen | skatt.html (utdeling) | ✅ |
| Sktl. § 5-2 (uttak) | skatt.html | ✅ |

### 3.3 Tallverdier og satser som bør verifiseres for 2026

| Sats | Verdi i koden | Kilde | Status |
|------|---------------|-------|--------|
| Trinnskatt trinn 1–5 | Se VERIFISERING.md | Statsbudsjettet 2026 | ✅ Verifisert |
| Personfradrag kl. 1 | 114 540 kr | Statsbudsjettet 2026 | ✅ Verifisert |
| Minstefradrag sats/maks | 46% / 95 700 kr | Statsbudsjettet 2026 | ✅ Verifisert |
| Trygdeavgift | 7,6% lønn / 10,8% næring | Statsbudsjettet 2026 | ✅ Verifisert |
| Oppjusteringsfaktor utbytte | 1,72 | Statsbudsjettet 2026 | ✅ |
| Formueskatt bunnfradrag | Sjekk i regions.js | Statsbudsjettet 2026 | ⚠️ Bør verifiseres |
| Frikortgrense | 70 000 kr | Skatteetaten | ⚠️ Bør verifiseres for 2026 |
| BSU aldersgrense | 34 år (evt. 33?) | Skatteetaten | ⚠️ HTML sier 13–33, sjekk |
| Reisefradrag km-sats | 1,70 kr/km | Skatteetaten | ⚠️ Sjekk 2026-satser |
| Studielån basisstøtte | regions.js | Lånekassen | ⚠️ Bør sjekkes for 2025–26 |
| Trafikkforsikringsavgift | 2329/3270 kr | Skatteetaten | ⚠️ Sjekk 2026-satser |
| G (grunnbeløpet) | 124 028 kr (nevnt i AGA-hint) | NAV | ⚠️ 2025-verdi, sjekk 2026 |
| Dokumentavgift | 2,5% | Kartverket | ✅ Uendret |
| Tinglysingsgebyr | Sjekk i core.js | Kartverket | ⚠️ Sjekk |

---

## 4. HTML-STRUKTUR OG TILGJENGELIGHET

### 4.1 Semantisk HTML
- Alle sider bruker `<header>`, `<nav>`, `<main>`, `<footer>` — god semantisk struktur.
- Overskriftshierarki er generelt godt (`<h1>` → `<h2>` → underoverskrifter i kort).
- `<html lang="nb">` er nå korrekt på alle sider (var `lang="no"` tidligere, nå fikset).

### 4.2 Tilgjengelighet (a11y)

| Problem | Alvorlighet | Omfang |
|---------|-------------|--------|
| Mange `<label>` mangler `for`-attributt i kalkulator-inputs | Middels | Alle sider med kalkulatorer |
| Kontaktskjema-labels har korrekt `for` | ✅ OK | Alle sider |
| Fargekontrastforhold ikke sjekket systematisk | Lav | Varierer med tema |
| `onclick` på `<div>`-elementer uten `role="button"` og `tabindex` | Middels | Region-selector, card-headers |
| Kalkulator-knapper (bc-keys) mangler `aria-label` | Middels | kalkulator.html |
| Tema-velger ikke keyboard-navigerbar | Lav | index.html |

### 4.3 Duplikat-IDer
- `sec-calculators` brukes som id på flere sider (boliglan, skatt, avgift, personlig). Ikke en funksjonell bug (ulike sider), men innenfor kalkulator.html finnes bare én forekomst.
- `lonn-frikort-hint` har duplikat id-attributt på personlig.html linje 534.

---

## 5. KONSISTENS PÅ TVERS AV SIDER

### 5.1 Header/Footer
- Header er identisk på alle sider ✅
- Region-selector (10 språk) er identisk på alle sider ✅
- Footer-tekst er identisk ✅ — copyright 2026 er oppdatert
- Personvern-overlay er identisk på alle sider ✅
- Kontakt-overlay er identisk på alle sider ✅

### 5.2 Navigasjonsbar
- Alle sider unntatt index.html har identisk `<nav>` med 6 tabs ✅
- Riktig tab er markert `active` på hver side ✅
- Alle lenker bruker absolutte paths (`/boliglan/`, `/skatt/`, etc.) ✅

### 5.3 Favicon
- Alle sider bruker nå identisk blå favicon (inline SVG) ✅ — tidligere rapport nevnte grønn-piksel-inkonsistens, dette ser ut til å være fikset.

### 5.4 Font-loading
- Alle sider bruker Bunny Fonts (GDPR-kompatibel) for Inter, Plus Jakarta Sans, Playfair Display og Crimson Pro ✅
- Identisk font-link på alle sider ✅

### 5.5 Script-versjonering
- `regions.js?v=20260320d` og `core.js?v=v5` er konsistent på alle sider ✅
- `style.css?v=v5` er konsistent ✅

---

## 6. PERSONVERN OG JURIDISK

### 6.1 Personvernerklæring
- Tilgjengelig via footer-lenke på alle sider ✅
- Dekker: ingen datainnsamling, ingen cookies, ingen tredjeparter, minimal localStorage, barn, endringer, kontakt ✅
- «Sist oppdatert: mars 2026» ✅
- Kontaktepost: kontakt@hverdagsverktoy.com ✅

### 6.2 Tredjepartsressurser
Faktiske eksterne kall:
1. **Bunny Fonts** (fonts.bunny.net) — GDPR-kompatibelt alternativ til Google Fonts ✅
2. **Open Exchange Rates API** (open.er-api.com) — kun for valutaomregneren, med fallback ✅
3. Ingen analytics, ingen tracking pixels, ingen reklame ✅

Personvernerklæringen sier «Eneste eksterne ressurs er Bunny Fonts» — **dette er teknisk sett feil, da valutaomregneren også kaller open.er-api.com.** Bør oppdateres.

### 6.3 Cookie/localStorage-bruk
- localStorage brukes kun for tema og språk — som beskrevet i personvernerklæringen ✅
- Ingen cookies ✅

### 6.4 Disclaimer
Footer-tekst: «Veiledende beregninger basert på kjente satser per mars 2026. Satser oppdateres manuelt og kan avvike fra gjeldende regler. Sjekk alltid skatteetaten.no for offisielle satser. Ikke profesjonell finansiell eller juridisk rådgivning.» — Svært god disclaimer ✅

---

## 7. LIVE-SITE OBSERVASJONER

### 7.1 Ytelse og funksjonalitet
- Alle sider lastes raskt — ingen synlige venteperioder
- Ingen JavaScript-feil i konsollen på noen sider ✅ (de kritiske feilene fra FEILRAPPORT.md ser ut til å være fikset)
- Kalkulatorer åpnes som collapsed cards — brukeren klikker for å utvide. God UX for sider med mange kalkulatorer.
- Fokus-modus fungerer på desktop ✅

### 7.2 Visuelt design
- Konsistent fargetema (Hendrix-tema aktiv på live-site)
- Tema-velger fungerer ✅
- Gradientbar i nav-baren er visuelt tiltalende
- Dekorative elementer (blyant-ikoner, snøfnugg) virker noe tilfeldige — vurder om de tilfører noe

### 7.3 Layout
- To-kolonners grid (kalkulatorer venstre, guide/referanse høyre) fungerer godt på desktop
- Alle sider har konsistent layout ✅
- «Hjelp med kalkulatoren»-kort finnes nå på boliglan, skatt og avgift — god brukerservice

---

## 8. STATUS FOR TIDLIGERE RAPPORTERTE FEIL

Fra FEILRAPPORT.md (18. mars 2026):

| # | Feil | Status |
|---|------|--------|
| 1 | buildCalcKeys krasjer på alle sider | ✅ Ser ut til å være fikset (ingen konsollfeil) |
| 2 | morPopulateType krasjer på kalkulator.html | ✅ Fikset |
| 3 | Avdragsfritt lån-kort utenfor grid | ⚠️ Ikke verifisert (kortet er nå integrert i boliglån-kalkulatoren som checkbox) |
| 4 | Nav inne i main på personlig.html | ⚠️ Ikke sjekket i detalj |
| 5 | Relativ CSS-path på index.html | ✅ Fikset — bruker nå `/shared/style.css` |
| 6 | Enter blokkerer all input | ⚠️ Ikke testet |
| 7 | Copyright © 2024 | ✅ Fikset — nå © 2026 |
| 8 | lang="no" → lang="nb" | ✅ Fikset — alle sider har nå lang="nb" |
| 9 | Manglende label for-attributter | ❌ Fortsatt delvis manglende |
| 10 | Manglende SEO på index/kalkulator | ✅ Fikset — begge har nå OG + canonical + robots |
| 11 | PWA-manifest inkonsistens | ⚠️ Ikke sjekket |
| 12 | Desimaltegn strippes | ⚠️ Ikke testet |
| 13 | region variabel-shadowing | ⚠️ Kodeforbedring, ikke funksjonell bug |
| 14 | Ubrukt ccCurrencies const | ⚠️ Kodeforbedring |
| 15 | Budsjett-kategori mangler | ⚠️ Ikke sjekket om fikset |
| 16 | submitContact() mangler | ⚠️ Ikke testet |
| 17 | Inkonsistent favicon | ✅ Ser ut til å være fikset |

Fra KALKULATOR-VERIFISERING.md:

| Feil | Status |
|------|--------|
| LVU: AGA beregnes på feil grunnlag | ⚠️ Ikke verifisert om fikset |

---

## 9. ANBEFALINGER PRIORITERT

### Høy prioritet
1. **personlig.html mangler SEO-metadata** — Legg til keywords, OG, Twitter, canonical, robots
2. **Verifiser 2026-satser** — Frikortgrense, BSU-aldersgrense, reisefradrag km-sats, G (grunnbeløpet), trafikkforsikringsavgift, formuesskatt bunnfradrag
3. **Oppdater personvernerklæringen** — Nevn open.er-api.com som ekstern ressurs (valutadata)
4. **LVU-beregningsfeil** — Verifiser at AGA nå beregnes på brutto + feriepenger + OTP

### Middels prioritet
5. **Tilgjengelighet** — Legg til `for`-attributt på alle kalkulator-labels
6. **Tilgjengelighet** — Legg til `role="button"` og `tabindex="0"` på klikkbare div-elementer
7. **submitContact()** — Sjekk at kontaktskjemaet fungerer
8. **Strukturerte data (JSON-LD)** — Vurder schema.org markup for bedre Google-synlighet
9. **BSU aldersgrense** — Tittel sier «13–33 år», men grensen ble hevet til 34 år i 2024

### Lav prioritet
10. **Twitter Card-tags** — Legg til på index.html og kalkulator.html
11. **Hero-budskap** — Konsistentgjør «privatøkonomi» vs «bedrift og privat»
12. **Duplikat HTML-id** — Fiks duplikat `lonn-frikort-hint` på personlig.html
13. **Enter-tast-blokkering** — Verifiser at Enter fungerer normalt i skjemaer

---

## 10. OPPSUMMERING

| Kategori | Vurdering |
|----------|-----------|
| Innholdskvalitet | ⭐⭐⭐⭐⭐ Utmerket — grundig, korrekt, godt skrevet |
| Beregningskorrekthet | ⭐⭐⭐⭐½ 17/18 kalkulatorer verifisert korrekte |
| SEO | ⭐⭐⭐⭐ Bra — personlig.html mangler metadata |
| Tilgjengelighet | ⭐⭐⭐ Greit — label/role-attributter bør forbedres |
| Personvern | ⭐⭐⭐⭐⭐ Utmerket — minimalt datafotavtrykk |
| Visuelt design | ⭐⭐⭐⭐⭐ Profesjonelt og konsistent |
| Konsistens | ⭐⭐⭐⭐½ Svært god — noen småfeil |
| Juridiske referanser | ⭐⭐⭐⭐⭐ Nøyaktige lovhenvisninger |
| **Totalt** | **⭐⭐⭐⭐½ Svært god kvalitet** |
