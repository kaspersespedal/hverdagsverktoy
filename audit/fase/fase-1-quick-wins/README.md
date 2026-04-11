---
title: Fase 1 — Quick wins
date: 2026-04-11
tags: [audit, fase, fase-1, quick-wins, v12]
status: active
parent: ../README.md
---

# Fase 1 — Quick wins

7 fixes, hver på 1-8 linjer kode. Estimert ~30 min total. Kan commits som én batch.

## Fixes

| # | ID | Tier | Fil:linje | Beskrivelse | Status | Commit |
|---|---|---|---|---|---|---|
| 1 | **H6 Personlig** | H | `shared/core.js:3539` | `bil-r-total` dobbelt-teller verditap (1 044 650→744 650) | ⏳ | — |
| 2 | **H2 Skatt** | H | `shared/core.js:308-331` | Legg til `'formue-res':'calcFormue'` i `_RESULT_RECALC_MAP` | ⏳ | — |
| 3 | **H8 Avgift** | H | `shared/core.js:323` | `'vat-res'`→`'v-res'` + legg til `'adj-res':'calcAdj'` | ⏳ | — |
| 4 | **P12-M1** | M | `shared/core.js:5339` | Fjern dobbel `' kr'` suffix på `studie-r-mnd` | ⏳ | — |
| 5 | **P12-M2** | M | `personlig/index.html:680` | Fjern duplisert `id="lonn-frikort-note"` | ⏳ | — |
| 6 | **A12-M5** | M | `avgift/index.html:272` | Typo "gjenståend" → "gjenstående" | ⏳ | — |
| 7 | **P12-M4** | M | `shared/core.js:5107` | Wrap `years` med `Math.max(1, ...)` | ⏳ | — |

## Detaljer per fix

### Fix 1 — H6 Personlig bil-r-total

**Problem:** `fmt(totalKostnad + pris)` der `totalKostnad` allerede inneholder `verditap = pris - restverdi`. Dobbelt-tellingen gir `2·pris - restverdi + drift` i stedet for `pris + drift`.

**Runtime-bevis:** pris=500 000, restverdi=200 000 → bil-r-total viser 1 044 650 i stedet for 744 650 (300 000 for høyt).

**Fix:**
```diff
- document.getElementById('bil-r-total').textContent = fmt(totalKostnad + pris);
+ document.getElementById('bil-r-total').textContent = fmt(pris + (totalKostnad - verditap));
```

### Fix 2 — H2 Skatt formue-res

**Problem:** `_RESULT_RECALC_MAP` mangler `'formue-res':'calcFormue'`. Bruker bytter språk med formue-resultat synlig → mixed-language UI.

**Fix:** Legg til linje i map (etter `'reise-res':'calcReise'`).

### Fix 3 — H8 Avgift vat-res

**Problem:** Map har `'vat-res':'calcVat'` men HTML-elementet heter `<div id="v-res">`. Map mangler også `'adj-res':'calcAdj'`.

**Fix:**
```diff
- 'vat-res':'calcVat',
+ 'v-res':'calcVat',
+ 'adj-res':'calcAdj',
```

### Fix 4 — P12-M1 studie-r-mnd

**Problem:** `fmt()` returnerer allerede `"3 304 kr"`, så `fmt(...) + ' kr'` gir `"3 304 kr kr"`.

**Fix:**
```diff
- document.getElementById('studie-r-mnd').textContent = fmt(mndBetaling) + ' kr';
+ document.getElementById('studie-r-mnd').textContent = fmt(mndBetaling);
```

### Fix 5 — P12-M2 duplisert id

**Problem:** Samme element har både `id="lonn-frikort-hint"` og `id="lonn-frikort-note"` (V10 carry-over ×3).

**Fix:** Fjern den andre id-attributten.

### Fix 6 — A12-M5 typo

**Problem:** "gjenståend år" mangler 'e' (skal være "gjenstående").

**Fix:**
```diff
- = (MVA ÷ periode) × endring i andel × gjenståend år
+ = (MVA ÷ periode) × endring i andel × gjenstående år
```

### Fix 7 — P12-M4 calcSpare negativ years

**Problem:** `+(...).value || 1` fanger 0 (falsy → 1) men ikke negative tall (truthy → bevares). `years=-5` → loop kjører aldri → viser startverdi stilltiende.

**Fix:**
```diff
- const years = +(document.getElementById('spare-years').value) || 1;
+ const years = Math.max(1, +(document.getElementById('spare-years').value) || 1);
```

## Verifikasjon

- Preview-test for hver fix etter implementasjon
- Runtime-test H6: pris=500 000, restverdi=200 000 → forventer bil-r-total=744 650 (ikke 1 044 650)
- Runtime-test H2: bytt språk med formue-kort åpent → labels skal oppdateres
- Runtime-test H8: bytt språk med MVA-resultat åpent → labels skal oppdateres
- Runtime-test P12-M1: studielan-beregning → studie-r-mnd skal vise "X kr" (ikke "X kr kr")
- Runtime-test P12-M4: spare-years=-5 → forventer error eller minst 1 års beregning

## Commit-melding (utkast)

```
Fix V12 Fase 1 — 7 quick wins (3H + 4M)

H6 Personlig: bil-r-total dobbelt-teller (core.js:3539) — fmt(pris + drift)
H2 Skatt: legg til formue-res i _RESULT_RECALC_MAP
H8 Avgift: vat-res → v-res + legg til adj-res:calcAdj
P12-M1: fjern dobbel "kr" suffix på studie-r-mnd
P12-M2: fjern duplisert id="lonn-frikort-note"
A12-M5: rett typo "gjenståend" → "gjenstående"
P12-M4: clamp calcSpare years til Math.max(1, ...)

Alle verifisert via preview. Adresserer 3 av 10 H-tier + 4 av 33 M-tier
fra V12 audit.
```
