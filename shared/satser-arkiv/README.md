# Satsarkiv

Gamle satser fra `shared/satser.js` flyttes hit når de byttes ut, i stedet for
å slettes. Ingen side leser fra denne mappa — den er bare historikk.

## Når

- **Årsskiftet (1.1.):** før `skatt` i `satser.js` får nye verdier, kopier hele
  `skatt`-blokken (med `aar`, `kontrollert`, `kilde` og `url`) til
  `skatt-<aar>.js`, for eksempel `skatt-2026.js`.
- **Nytt grunnbeløp (1.5.):** før `g` får ny verdi, kopier hele `g`-blokken til
  `g-<år i g.fra>.js`, for eksempel `g-2026.js`.

Satser som bare står på én side (formue, aga, engangsavgift osv.) arkiveres på
samme måte når de oppdateres: `<side>-<aar>.js`, for eksempel `formue-2026.js`.

## Format

Kopier blokken uendret og legg den i en variabel, så fila er gyldig JavaScript
(`Infinity` i trinnskatten tåler ikke JSON):

```js
/* Arkiv: skatt fra shared/satser.js, inntektsåret 2026. Erstattet <dato>. */
var skatt2026 = {
  aar:         2026,
  kontrollert: '2026-11-19',
  // … resten av blokken som den sto
};
```

Endre aldri en arkivfil etterpå. Hvis en arkivert verdi viser seg å ha vært
feil, skriv det i en kommentar i fila i stedet for å rette tallet.
