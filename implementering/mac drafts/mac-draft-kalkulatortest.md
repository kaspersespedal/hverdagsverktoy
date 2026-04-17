# Kalkulatortest — 4 verifisert + UI-bugs
**Kilde:** Gmail-draft fra Mac, 13. april 2026
**Status:** Bugs apen, kalkulatorer verifisert

## Kalkulator-verifisering

### 1. Skattekalkulator (/skatt) — KORREKT
- Input: 800 000 kr brutto, Klasse 1, Standard, 0 rentefradrag
- Netto: 581 347 kr (48 446 kr/mnd), total skatt 218 653 kr, effektiv 27.3%
- Breakdown: Trinn1 1 567, Trinn2 16 270, Trinn3 10 268, Trygd 60 800, Alm. 129 747

### 2. Boliglanskalkulator (/boliglan) — KORREKT
- Input: 3 000 000 kr, 5% rente, 25 aar, annuitet
- Maanedlig: 17 538 kr, totalt 5 261 310 kr, renter 2 261 310 kr

### 3. MVA-kalkulator (/avgift) — KORREKT
- Input: 1 000 kr eks MVA, 25%
- Inkl: 1 250 kr, MVA: 250 kr

### 4. Ansattkostnad (/kalkulator) — KORREKT
- Input: 500 000 kr, Sone I 14.1%, ferie 10.2%, OTP 2%
- Total: 637 131 kr (AGA 78 734, ferie 51 000, OTP 7 397)
- NB: AGA beregnes pa full base (lonn+ferie+OTP)

## UI-bugs funnet

### [HIGH] Blankt omraade etter "Beregn"
- Paa /skatt, /boliglan, /avgift (to-kolonne layout)
- Venstre kolonne pusher resultatene langt ned
- Brukeren maa scrolle mye — kan tro kalkulatoren ikke fungerer
- /kalkulator har IKKE bugen (en-kolonne layout)

### [MEDIUM] Spraak persisterer ikke mellom sidenavigasjoner
- Bytte til norsk paa en side kan revertere ved ny sidelasting
- Spraakvalg upaalitelig mellom sider

### [MEDIUM] Tab-renderer fryser sporadisk
- Ved utvidelse av kalkulatorseksjoner paa /avgift
- Mulig tung DOM-manipulering eller animasjon
- Skjedde ved aapning av baade MVA og AGA samtidig

### [LOW] Ingen standalone AGA-kalkulator
- /avgift viser kun sone-satser
- Brukere maa gaa til Ansattkostnad paa /kalkulator for aa beregne AGA
- Forslag: Enkel AGA-kalkulator (lonn * sone%) paa /avgift

## Komplett bugliste (alle Mac-funn samlet)
1. ~~[CRITICAL] 1G 130 034->130 160~~ FIKSET (core.js har 130160)
2. [HIGH] Blankt omraade etter Beregn (to-kolonne sider)
3. [MEDIUM] "OM DENNE SIDEN" ikke oversatt
4. [MEDIUM] "Business or hobby?" ikke oversatt til arabisk
5. [MEDIUM] Spraak persisterer ikke mellom sider
6. [MEDIUM] Tab-renderer fryser /avgift
7. [LOW] Dark mode-knapp blanding norsk/engelsk paa arabisk
8. [LOW] title-tag ikke oversatt
9. [LOW] Header speiles ikke for RTL
10. [LOW] Ingen standalone AGA-kalkulator
