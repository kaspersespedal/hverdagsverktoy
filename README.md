# Hverdagsverktøy

Gratis norske finanskalkulatorer — skatt, boliglån, MVA, avgifter, regnskap og privatøkonomi. Tilgjengelig på 10 språk.

**[hverdagsverktoy.com](https://hverdagsverktoy.com)**

Et uavhengig, ikke-kommersielt hobbyprosjekt utviklet av en privatperson på fritiden. Ingen reklame, ingen sporing, ingen analyseverktøy.

## Hva det er

Rundt 50 kalkulatorer og informasjonssider som forklarer norske skatteregler, boliglånsforskrifter og avgifter. Prosjektet startet som et personlig verktøy for å forstå norsk skatt og økonomi.

Innholdet finnes på norsk, engelsk, arabisk, kinesisk, fransk, polsk, ukrainsk, litauisk, somali og tigrinja. Alle språkversjoner viser de samme norske satsene og reglene — bare oversatt.

| Seksjon | Innhold |
|---|---|
| `skatt/` | Inntektsskatt, formuesskatt, utbytte, uttak, reisefradrag |
| `boliglan/` | Maks lån, boligsparing, refinansiering, dokumentavgift |
| `personlig/` | Budsjett, lønn, sparing, pensjon, studielån, sykepenger |
| `avgift/` | MVA, arbeidsgiveravgift, engangsavgift |
| `regnskap/` | Resultat, balanse, kontantstrøm, MVA-melding, kontoplan |
| `kalkulator/` | Generelle kalkulatorer — annuitet, nåverdi, dekningsbidrag |
| `kalkyle/` | Margin, selvkost, food cost, landed cost |
| `lov/` | Søkbare oversikter over skatteloven, aksjeloven, mval., bfl. |

## Teknisk

Statisk nettsted uten byggesystem. Ren HTML, CSS og JavaScript — filene serveres som de er via GitHub Pages. Progressiv web-app (PWA) som kan installeres og fungerer offline.

```
shared/          Delt CSS og JS — lastes av alle sider
shared/lang/     Språkfiler (10 stk)
<seksjon>/       Landingsside per seksjon
<seksjon>/<x>/   Én kalkulator eller artikkel per mappe
```

Alle beregninger skjer lokalt i nettleseren. Det finnes ingen server som tar imot tall brukeren taster inn. Se [personvernerklæringen](https://hverdagsverktoy.com/personvern/) for hvilke eksterne tjenester som brukes.

## Kilder

Satser og terskler bygger på offentlige primærkilder: Skatteetaten, Lovdata, NAV, Kartverket, Lånekassen, Brønnøysundregistrene og regjeringen.no. Offentlige satser og lovtekst kan gjengis fritt etter [åndsverkloven § 14](https://lovdata.no/lov/2018-06-15-40/§14).

## Forbehold

Beregningene er veiledende. Satser oppdateres manuelt og kan avvike fra gjeldende regler — sjekk alltid [skatteetaten.no](https://www.skatteetaten.no) for offisielle satser. Innholdet utgjør ikke profesjonell finansiell, juridisk eller skattemessig rådgivning.

Fant du en feil? [Meld fra som issue](https://github.com/kaspersespedal/hverdagsverktoy/issues).

## Lisens

Proprietær, kildekode-tilgjengelig. Se [LICENSE](LICENSE).
