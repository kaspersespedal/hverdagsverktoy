---
tags: [research, personlig, abo, priskatalog, 2025, 2026]
triggered-by: /audit v12 R-pers-1
date: 2026-04-11
scope: ABO_OLD (ca. 2025-04) og ABO_DEFAULTS (2026-04) i shared/core.js:5529-5541
confidence: medium (prisdata, sekundære kilder, priser endres hyppig)
---

# Research: Abonnement-priskatalog (ABO_OLD vs ABO_DEFAULTS)

## Sammendrag

V12-audit flagget Viaplay 149→799 kr/mnd (+436 %) som mistenkelig i `ABO_OLD`→`ABO_DEFAULTS`.

**Funn:** Viaplay-hoppet er en sammenligningsfeil — ikke en reell prisøkning. ABO_OLD brukte Viaplay Film & Serier (grunnpakke uten sport), mens ABO_DEFAULTS bruker Viaplay Total (med Premier League/sport). To forskjellige produkter.

**Utover Viaplay** er ABO_OLD priskatalog stort sett *for lav* ift. faktisk 2025-04-prisnivå, noe som gjør at calcAbo overdriver prisøkningen for flere tjenester.

---

## Full tabell: 17 tjenester

| Tjeneste | ABO_OLD (kode) | Faktisk ca. 2025-04 | ABO_DEFAULTS (kode) | Faktisk 2026-04 | Status |
|---|---|---|---|---|---|
| **Spotify Premium Individual** | 119 | 129 | 139 | 139 | ABO_OLD for lav (119→129). ABO_DEFAULTS OK. Økning skjedde august 2025. |
| **Netflix Standard** | 119 | 129 | 159 | 159 | ABO_OLD for lav (var 109 høst 2024, 129 våren 2025). ABO_DEFAULTS OK. |
| **HBO Max Standard** | 99 | 109 | 149 | 149 | ABO_OLD for lav. HBO gikk 89→109→125→149 (nov 2025). ABO_DEFAULTS OK. |
| **Disney+ Standard** | 109 | 109 | 109 | 109 | Begge OK — Disney+ har holdt 109 kr stabilt. |
| **YouTube Premium** | 129 | 139 | 169 | 169 | ABO_OLD for lav. Var ca. 139 våren 2025, nå 169. ABO_DEFAULTS OK. |
| **Viaplay (se merknad)** | 149 | 149 (Film&Serier) | 799 | 799 (Total m/sport) | **Sammenligningsfeil** — to ulike produkter. Se forklaring nedenfor. |
| **Apple Music Individual** | 119 | 109 | 99 | 139 | **ABO_DEFAULTS 99 er feil** — Apple Music NO er 139 kr/mnd. ABO_OLD 119 litt høy (var 109 i 2024). |
| **Apple iCloud+ 50 GB** | 12 | 12 | 29 | 12 | **ABO_DEFAULTS 29 er feil** — offisiell Apple-pris 12 kr/mnd (50 GB-trinnet). ABO_OLD OK. |
| **Treningssenter (generisk)** | 399 | 399 | 449 | 449 | Begge rimelige snitt (Fresh Basic 349, Flex 399, Smart 549; SATS høyere). Medium confidence. |
| **Mobilabonnement (generisk)** | 399 | 399 | 349 | 350 | Rimelige gjennomsnittsverdier. Markedssnitt ca. 250-400 kr. Medium confidence. |
| **Bredbånd (generisk)** | 499 | 499 | 699 | 650-700 | ABO_DEFAULTS noe høyt — typisk 100 Mbit ligger 399-700. 500-700 er snitt. Medium confidence. |
| **VG+** | 199 | 99 | 99 | 99 | **ABO_OLD 199 er for høy** — VG+ standardabonnement har vært 99 kr/mnd. 199 kan stamme fra Full tilgang. ABO_DEFAULTS OK. |
| **Aftenposten digital** | 399 | 379 | 379 | 379 | ABO_OLD litt høy, ABO_DEFAULTS 379 matcher "Full tilgang 30 dager". OK. |
| **Adobe Creative Cloud (alle apper)** | 659 | 659 | 619 | ~659-720 | Adobe omdøpte All Apps → Creative Cloud Pro august 2025. Offisiell NO-pris ikke verifisert direkte (Adobe-siden timet ut). Medium confidence. |
| **Microsoft 365 Personal** | 99 | 85 | 119 | 121 | ABO_OLD for høy (var 85 før januar 2025). ABO_DEFAULTS 119 matcher offisielle 121 kr. Stort hopp: Microsoft økte 85→121 i januar 2025 pga. AI (Copilot). |
| **PlayStation Plus Essential** | 69 | 85 | 85 | 105 | ABO_OLD for lav. Korrigert historikk: var 85 før 24. mai 2025, økte til 105 kr. ABO_DEFAULTS 85 er *for lav for 2026*. |
| **Xbox Game Pass Ultimate** | 119 | 179 | 149 | 309 | **Begge er feil**. Ultimate var 179 kr i 2024-2025, økte til 309 kr i oktober 2025. Game Pass PC 119→169. ABO_DEFAULTS 149 treffer ingen reell variant. |

---

## Viaplay 149 → 799 (+436 %) — forklaring

**Dette er IKKE en reell prisøkning.** To helt forskjellige produkter blir sammenlignet:

- **Viaplay Film & Serier (grunnpakke)**: 149-169 kr/mnd. Kun film og serier, ingen sport. Prisen her har vært stabil — gikk fra 149 til 169 kr/mnd i løpet av 2025.
- **Viaplay Total**: 799 kr/mnd. Inkluderer Premier League og all sport. Dette har alltid vært et dyrt produkt — 749 kr i 2024-sesongen, 799 kr i 2025-sesongen.

**Hvorfor ble ABO_DEFAULTS satt til 799?** Sannsynligvis fordi `ABO_DEFAULTS` ble oppdatert til Viaplay Total (det brukeren typisk tenker på som "Viaplay" når de ser PL-priser i media), mens `ABO_OLD` ble satt ut fra gamle Film & Serier-priser.

**Reell prisutvikling Viaplay Total**: ~749 kr/mnd (våren 2025) → 799 kr/mnd (høst 2025). Altså ~7 % reell økning, ikke 436 %.

**Anbefaling:** Enten endre ABO_OLD['Viaplay'] = 749 (eller 699), ELLER endre ABO_DEFAULTS['Viaplay'] = 169 for å matche grunnpakke. Velg ett produkt konsistent. Sluttbrukeren forventer sannsynligvis grunnpakken — anbefaler å standardisere på Film & Serier (169 nå, 149 før).

---

## Anbefalte oppdateringer

### ABO_OLD (ca. 2025-04, "forrige år")

```js
var ABO_OLD={
  'Spotify':129,        // var 119 → oppdater til 129 (økning august 2025)
  'Netflix':129,        // var 119 → oppdater til 129 (var 109 høst 2024, 129 fra vinter)
  'HBO Max':109,        // var 99 → oppdater til 109 (prisøkning kom senere i 2025)
  'Disney+':109,        // behold — stabilt
  'YouTube Premium':139,// var 129 → oppdater til 139
  'Viaplay':149,        // behold HVIS grunnpakken er intensjonen (se merknad)
  'Apple Music':109,    // var 119 → oppdater til 109 (faktisk lavere før 2026-hopp til 139)
  'Apple iCloud+':12,   // behold — korrekt
  'Treningssenter':399, // behold — rimelig snitt
  'Mobilabonnement':399,// behold — rimelig snitt
  'Bredbånd':499,       // behold — rimelig snitt
  'VG+':99,             // var 199 → oppdater til 99 (199 var feil — VG+ standard er 99)
  'Aftenposten':379,    // var 399 → oppdater til 379
  'Adobe Creative Cloud':659, // behold — stabilt
  'Microsoft 365':85,   // var 99 → oppdater til 85 (stor jan 2025-økning 85→121)
  'PlayStation Plus':85,// var 69 → oppdater til 85 (PS Plus Essential var 85 kr før 24. mai 2025)
  'Xbox Game Pass':179  // var 119 → oppdater til 179 (Ultimate). Eller bytt til Game Pass PC=119.
};
```

### ABO_DEFAULTS (2026-04, "nå")

```js
var ABO_DEFAULTS={
  'Spotify':139,        // OK
  'Netflix':159,        // OK
  'HBO Max':149,        // OK
  'Disney+':109,        // OK
  'YouTube Premium':169,// OK
  'Viaplay':799,        // KONSIDERER: endre til 169 (Film&Serier) for å være konsistent med ABO_OLD 149
  'Apple Music':139,    // var 99 → FIKS til 139 (offisiell Apple NO-pris)
  'Apple iCloud+':12,   // var 29 → FIKS til 12 (offisiell Apple NO-pris 50 GB)
  'Treningssenter':449, // OK (Fresh Flex)
  'Mobilabonnement':349,// OK (rimelig)
  'Bredbånd':699,       // OK men i øvre sjikt
  'VG+':99,             // OK
  'Aftenposten':379,    // OK
  'Adobe Creative Cloud':619, // Trolig for lav — stikkprøve tyder på 659-720. Medium confidence.
  'Microsoft 365':121,  // var 119 → mindre korrigering fra 119 til 121 (offisiell)
  'PlayStation Plus':105,// var 85 → FIKS til 105 (økning 24. mai 2025 fra 85 til 105)
  'Xbox Game Pass':309  // var 149 → FIKS til 309 (Ultimate) ELLER 169 (PC). Avhengig av produktvalg.
};
```

---

## Kilder

- Apple Music Norge: https://www.apple.com/no/apple-music/ (139 kr/mnd, verifisert direkte)
- Apple iCloud+: https://support.apple.com/en-us/108047 (50 GB = 12 kr/mnd, verifisert direkte)
- Microsoft 365 Norge: https://www.microsoft.com/nb-no/microsoft-365/buy/compare-all-microsoft-365-products (121 kr/mnd, verifisert direkte)
- Viaplay Sport Norge: https://viaplay.no/no-nb/get-sport (Total 799, Film&Serier 169, verifisert direkte)
- Spotify prisøkning august 2025: https://itavisen.no/2025/08/04/spotify-prisokning-norge-2025/
- Netflix prishistorikk: https://www.nettavisen.no/livsstil/netflix-oker-prisen-i-norge/s/12-95-3423910557
- HBO Max prishistorikk: https://itavisen.no/2025/10/06/hbo-max-prisokning-norge/
- YouTube Premium Norge: https://www.tek.no/nyheter/nyhet/i/eM5xla/enorm-prisoekning-for-youtube-premium-i-norge
- PlayStation Plus prishopp mai 2025: https://www.tek.no/nyheter/nyhet/i/Q7Akqx/saa-mye-dyrere-blir-playstation-plus-i-norge
- Xbox Game Pass prishopp oktober 2025: https://www.purexbox.com/news/2025/10/heres-a-breakdown-of-all-the-new-prices-for-xbox-game-pass-as-of-october-2025
- VG+ priser: https://support.pluss.vg.no/hc/no/articles/215044986-Priser-i-VG-
- Fresh Fitness priser: https://www.freshfitness.no/medlemskap-og-priser
- Aftenposten Full tilgang 379 kr: https://kundeservice.aftenposten.no/s/article/Abonnementspriser-og-bestilling-ap
- Bredbåndspriser: https://www.bytt.no/bredband/fiber-bredband/billigste-fiber-bredband

## Confidence

**High**: Apple Music, Apple iCloud+, Microsoft 365, Viaplay Total, Viaplay Film&Serier (verifisert direkte mot offisielle produktsider).

**Medium**: Spotify, Netflix, HBO Max, YouTube Premium, Disney+, PS Plus, Xbox Game Pass (verifisert via pålitelig norsk tech-presse, men priser endres hyppig).

**Low-medium**: Treningssenter, Mobilabonnement, Bredbånd (generiske kategorier — vanskelig å verifisere "snittpris"; eksempelverdier er rimelige).

**Low**: Adobe Creative Cloud (Adobe-siden timet ut; priser endret seg med rebranding All Apps → Pro i august 2025; tall stammer fra sekundære kilder og er usikre).
