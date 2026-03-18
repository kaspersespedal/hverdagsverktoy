# Feilrapport — hverdagsverktoy.com

**Dato:** 18. mars 2026
**Gjennomgang av:** Kasper Espedal (via Claude)
**Omfang:** Alle 6 HTML-sider, core.js, regions.js, style.css + live-testing i Chrome

---

## KRITISKE FEIL (bør fikses først)

### 1. JavaScript TypeError på ALLE sider — `buildCalcKeys` krasjer

**Fil:** `shared/core.js` linje 2824 + 2287
**Feil:** `TypeError: Cannot set properties of null (setting 'innerHTML')`
**Forklaring:** `buildCalcKeys('basic')` kalles på linje 2824 som en del av init-koden som kjøres på alle sider. Men `bc-keys`-elementet (`bcKeys`) finnes bare på `kalkulator.html`. På alle andre sider (index, boliglan, skatt, avgift, personlig) er elementet `null`, og `innerHTML`-tilordningen feiler.
**Fix:** Legg til en null-check øverst i `buildCalcKeys()`:
```js
function buildCalcKeys(mode) {
  if (!bcKeys) return;  // Element finnes bare på kalkulator.html
  // ... resten av funksjonen
}
```
Alternativt: flytt kallet `buildCalcKeys('basic')` (linje 2824) inn i en guard:
```js
if(document.getElementById('bc-keys')) buildCalcKeys('basic');
```

---

### 2. JavaScript TypeError — `morPopulateType` krasjer på kalkulator.html

**Fil:** `shared/core.js` linje 2832 + 229–230
**Feil:** `TypeError: Cannot read properties of null (reading 'value')`
**Forklaring:** `morPopulateType()` kalles ubetinget på linje 2832, men `m-type`-selecten finnes bare på `boliglan.html`. På `kalkulator.html` krasjer den fordi `document.getElementById('m-type')` er `null`.
**Fix:** Linje 2832 har allerede en guard på linje 225 (`if(document.getElementById('m-type')) morPopulateType()`), men linje 2832 mangler denne guarden:
```js
// Linje 2832 — endre fra:
morPopulateType();
// til:
if(document.getElementById('m-type')) morPopulateType();
```

---

### 3. `boliglan.html` — «Avdragsfritt lån»-kortet er UTENFOR grid-layouten

**Fil:** `boliglan.html` linje 141
**Feil:** `mor-io-card` er plassert som et søsken-element til `calc-mortgage`-gridet i stedet for inne i venstre kolonne eller `right-col`.
**Konsekvens:** Kortet rendres som en full-bredde blokk under hele to-kolonne-gridet, noe som bryter den visuelle konsistensen. Det ser ut som en misplassert element.
**Fix:** Flytt `<div class="info-card collapsed" id="mor-io-card">` inn i enten left-col (etter main card-body) eller `right-col`-divven.

---

## MIDDELS ALVORLIGE FEIL

### 4. `personlig.html` — `<nav>` er plassert INNE I `<main>`

**Fil:** `personlig.html` linje 57–65
**Feil:** På alle andre sider (kalkulator, boliglan, skatt, avgift) er `<nav class="calc-nav">` plassert mellom `</header>` og `<main>`. På `personlig.html` er den inne i `<main> > .container`, som betyr at `sticky`-oppførselen kan påvirkes (sticky forholder seg til sin nærmeste scrollable ancestor).
**Fix:** Flytt `<nav class="calc-nav">...</nav>` ut av `<main>`, mellom `</header>` og `<main>` — som de andre sidene.

---

### 5. `index.html` — CSS-path til stylesheet er relativ uten leading `/`

**Fil:** `index.html` linje 15
**Feil:** `href="shared/style.css"` (relativ) vs. alle andre sider som bruker `href="/shared/style.css"` (absolutt fra rot).
**Konsekvens:** Fungerer når du er på `/`, men kan knekke hvis URL-routing endres (f.eks. `/no/` prefix). Ikke konsistent med resten av codebasen.
**Fix:** Endre til `href="/shared/style.css"` for konsistens.

Samme gjelder script-taggene på `index.html` linje 200–201:
```html
<!-- Nå: -->
<script src="shared/regions.js"></script>
<script src="shared/core.js"></script>
<!-- Bør være: -->
<script src="/shared/regions.js"></script>
<script src="/shared/core.js"></script>
```

---

### 6. Enter-tasten blokkerer all normal input på ikke-kalkulatorsider

**Fil:** `shared/core.js` linje 2837–2849
**Feil:** `e.preventDefault()` kjøres på ALLE Enter-trykk, uansett kontekst. Hvis brukeren er i kontaktskjemaet (`<form id="contact-form">`) og trykker Enter, forhindres standard form-submit. Textarea-feltet får heller ikke linjeskift.
**Fix:** Sjekk om brukeren er i et skjema eller textarea:
```js
document.addEventListener('keydown', function(e){
  if(e.key==='Enter'){
    const tag = e.target.tagName;
    if(tag === 'TEXTAREA' || tag === 'INPUT' || e.target.closest('form')) return;
    e.preventDefault();
    // ... resten
  }
});
```

---

### 7. Footer-copyright sier «© 2024» — mangler dynamisk år

**Fil:** Alle HTML-filer
**Feil:** `© 2024 Hverdagsverktøy` er hardkodet. Nå er det 2026.
**Fix:** Enten oppdater til `© 2024–2026` eller generer dynamisk med JS.

---

### 8. `<html lang="no">` bør være `lang="nb"`

**Fil:** Alle HTML-filer
**Feil:** `lang="no"` er en makrospråk-kode. For bokmål (som brukes her) er den korrekte koden `nb` (ISO 639-1). Søkemotorer og skjermlesere forstår `nb` bedre.
**Fix:** Endre `<html lang="no">` til `<html lang="nb">` i alle filer.

---

## MINDRE FEIL / FORBEDRINGER

### 9. Manglende `<label for="">` på skjemaelementer

**Fil:** Alle sider med kalkulatorer
**Feil:** `<label>`-elementer mangler `for`-attributt koblet til tilhørende `<input>`. Eksempel: `<label class="flbl" id="mor-l-amount">` har ingen `for="m-a"`. Dette reduserer tilgjengeligheten — klikk på labelen fokuserer ikke inputfeltet.
**Fix:** Legg til `for`-attributt på alle labels, f.eks. `<label class="flbl" for="m-a">`.

---

### 10. Manglende SEO-metadata på index.html og kalkulator.html

**Fil:** `index.html` og `kalkulator.html`
**Feil:** `boliglan.html`, `skatt.html` og `avgift.html` har Open Graph, Twitter Card, canonical og robots-tags. Men `index.html` og `kalkulator.html` mangler alt dette (bare `<meta name="description">`).
**Fix:** Legg til OG-tags, Twitter Card, canonical og robots på index og kalkulator.

---

### 11. PWA-manifest referert men mangler på flere sider

**Fil:** `skatt.html` og `avgift.html` (linje 34–41)
**Feil:** Disse sidene refererer til `manifest.json` og `icons/icon-192.png`, men filene finnes ikke i mappen. Dessuten har `index.html`, `kalkulator.html`, `boliglan.html` og `personlig.html` IKKE manifest-referanse. Enten fjern PWA-referansene eller implementer det konsistent.

---

### 12. Live-format for nummer-inputs stripper desimaltegn

**Fil:** `shared/core.js` linje 121–133
**Feil:** Live-formateringen kjører på alle inputs med `inputMode="numeric"` og fjerner alt unntatt `[0-9\-]`. Men noen felter (f.eks. valutakurs-inputs som `valgevinst-buy-rate`) bruker desimaltall med komma (`10,50`). Regex-en `replace(/[^0-9\-]/g,'')` fjerner kommaet.
**Konsekvens:** Brukere som skriver `10,50` får `1050`.
**Fix:** Disse feltene bruker `inputmode="decimal"` som allerede ekskluderer dem (guarden sjekker `inputMode !== 'numeric'`). Men verifiser at alle desimalfelter bruker `inputmode="decimal"` og ikke `inputmode="numeric"`.

---

### 13. `region` variabel-shadowing i `setRegion()`

**Fil:** `shared/core.js` linje 138
**Feil:** Catch-parameteren heter `e`, som skygger for event-parameteren `e`:
```js
function setRegion(r, e) {
  region = r;
  try { localStorage.setItem('hvt-lang', r); } catch(e){}
  //                                               ^^^ skygger event-parameteren
```
**Konsekvens:** Ikke en funksjonell bug per nå, men forvirrende og potensielt farlig ved fremtidige endringer.
**Fix:** Rename catch-parameteren til `_e` eller `ex`.

---

### 14. `ccCurrencies` const lages én gang, oppdateres aldri ved språkbytte

**Fil:** `shared/core.js` linje 2598
**Feil:** `const ccCurrencies = getCcCurrencies();` kjøres ved load og lagres som en const. Men `getCcCurrencies()` bruker `R()` for oversatte valutanavn. Når brukeren bytter språk, oppdateres ikke denne variabelen. Selve select-populasjonen kalles via `ccPopulate()` (som kaller `getCcCurrencies()` på nytt), så dette er mest et ubrukt artefakt, men det er forvirrende kode.
**Fix:** Fjern `const ccCurrencies`-linjen siden den aldri brukes etter init.

---

### 15. Budsjett-kategori-dropdown mangler i HTML

**Fil:** `personlig.html` linje 84–105 + `core.js` linje 2896
**Feil:** `budsjettCalc()` ser etter `.budsjett-cat` (en select for kategori), men HTML-radene for inntekter og utgifter inneholder bare navn + beløp. Det er ingen `.budsjett-cat` select i HTML-en. `budsjettAddRow()` lager heller ingen slik select.
**Konsekvens:** `catEl` er alltid `null`, `cat` blir alltid tom streng, og alle utgifter faller i kategori `'annet'`. Kategorifordelingen i resultatet viser bare "Annet: 100%", som er meningsløst.
**Fix:** Enten legg til kategori-select i `budsjettAddRow('expense')` og i standard-HTML, eller fjern kategori-logikken og bar-chartet fra `budsjettCalc()`.

---

### 16. Kontaktskjema — suksessmelding vises aldri

**Fil:** Alle sider — `<div class="contact-success" id="con-success">`
**Feil:** Suksessmeldingen styres av class `.show`, men `submitContact()` funksjonen er ikke definert i `core.js`.
**Konsekvens:** Skjemaet har `onsubmit="submitContact(event)"`, men funksjonen mangler. Form-submit vil krasje med `ReferenceError: submitContact is not defined`.
**Fix:** Implementer `submitContact()` i core.js (eller regions.js).

---

### 17. Boliglan.html favicon har grønn piksel, resten har standard blå

**Fil:** `boliglan.html`, `skatt.html`, `avgift.html` (linje 33)
**Feil:** Disse sidene har en favicon med en grønn piksel (`fill='%2368b5a0'`), mens `index.html`, `kalkulator.html` og `personlig.html` bruker det originale helblå-ikonet. Gir inkonsistent tab-utseende.
**Fix:** Bruk samme favicon-SVG på alle sider.

---

## OPPSUMMERING

| Alvorlighet | Antall | Beskrivelse |
|---|---|---|
| Kritisk | 3 | JS-krasjer på alle sider, layout-feil boliglån |
| Middels | 5 | Nav-plassering, Enter-blokkering, copyright, lang-kode, inkonsistent paths |
| Mindre | 9 | SEO, tilgjengelighet, kategori-bug, favicon, ubrukt kode |
| **Totalt** | **17** | |

De tre kritiske feilene (1, 2, 3) bør prioriteres — de genererer konsollfeill på hvert eneste sidebesøk.
