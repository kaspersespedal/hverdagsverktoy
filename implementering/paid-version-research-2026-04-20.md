# Betalt-versjon research — 2026-04-20

Kilder: Mac-draft `Build a paid membership feature for a we.md`, bugs.md roadmap-notat, Gmail-draft "Betalt versjon" 2026-04-19 (samle-rapport-idé).

**Konsept:** Free = rå CSV/JSON (dagens tilstand). Paid = formatert PDF + Excel + kombinert samle-rapport på tvers av kalkulatorer.

---

## 1. Kalkulator-inventar (27 stk — mappet til rapport-type)

| Kalkulator | Funksjon | Rapport-type |
|---|---|---|
| calcSal / calcLonn | Lønn etter skatt | **Trinnskatt-breakdown**: PDF m/ tabular stages + donut pie inntektsfordeling |
| calcMor | Boliglån (annuitet) | **Amortisering**: Excel m/ full nedbetalingsplan + PDF sammendrag |
| calcMaxLan | Maks lånebeløp | **Én-side PDF**: §4/§5/§6-regnestykke + bankens vurdering |
| calcBvl | Bolig vs leie | **Sammenlignings-PDF**: break-even-kurve + kost/gevinst-tabell |
| calcUtdeling | Utbytte AS/ENK | **Full skatteberegning**: PDF m/ skjerming + 37.84% + flyt-diagram |
| calcUttak | Personlig uttak | Samme som utdeling-familie |
| calcFormue | Formuesskatt | **§ 4-referanse-PDF**: eiendeler + verdsettelsesrabatter + gjeldsfradrag |
| calcAga / calcLvu | Arbeidsgiveravgift | **Ansattkostnad-oversikt**: sone-vis + OTP + feriepenger Excel |
| calcVat | MVA 25/15/12 | **MVA-kvittering**: PDF m/ per-sats breakdown |
| calcAdj | MVA-justering | Kort PDF m/ 10-årsperiode-tabell |
| calcAvs | Avskrivning | **Avskrivningsplan Excel**: 10-års skjema + saldo vs lineær sammenligning |
| calcNpv | NPV/IRR | **Investerings-rapport PDF**: cash flows + NPV + IRR + decision |
| calcRente | Effektiv rente | Kort PDF m/ bisection-trinn |
| calcBilkostnad | Bil totalkost | **Eie-vs-leasing PDF**: månedlig + totalt over X år |
| calcBudsjett | Budsjett | **Månedsbudsjett Excel**: inntekter/utgifter + pie-chart |
| calcSpare/SpareRF | Sparing m/ og uten rentesrente | Excel m/ år-for-år + compound-graf |
| calcStudielan | Lånekassen | PDF m/ stipend-omgjøring + nedbetalingsplan |
| calcAbo | Abonnement | Kort PDF liste |
| calcPensjon | OTP-pensjonspott | **Pensjons-prognose PDF**: pot ved 67 + månedlig + kjøpekraft |
| calcFerie | Feriepenger | Kvitterings-PDF |
| calcValgevinst | Valuta-gevinst | PDF m/ kjøp/salg breakdown |
| calcForeldrepenger | Foreldrepenger | NAV-stil rapport-PDF |
| calcReise | Reisefradrag | Kort PDF m/ km × sats - egenandel |
| calcFbl | Forbrukslån eff.rente | PDF m/ nominell vs effektiv + gebyr-innflytelse |
| calcFam | Foreldrefradrag | Kort PDF |
| calcSjekkliste | Skattemelding-sjekkliste | **Sjekkliste-PDF**: utført/gjenstår m/ § henvisninger |

**Samle-rapport-konsept** (kjernen av betalt-versjon): Bruker kjører N kalkulatorer → trykker "Lagre samle-rapport" → én helhetlig økonomirapport-PDF med alle utregninger pent formatert, forside m/ navn + dato + disclaimer, innholdsfortegnelse, per-kalkulator seksjon, footer på hver side.

---

## 2. PDF-generering — anbefaling: `pdfmake`

| Library | Styrker | Svakheter | Passer for oss? |
|---|---|---|---|
| **pdfmake** | Deklarativ (JSON doc-def), browser+Node, gode tables/headers/footers, god norsk tegn-støtte | Ikke beste for komplekse layouts | ✅ **ANBEFALT** |
| jsPDF | Minst og raskeste, client-side | Manuelt posisjonert — ikke declarative | Sekundær |
| PDF-lib | Modifisere eksisterende PDFer | Ikke generering-fokus | Nei |
| Puppeteer | Pixel-perfect HTML→PDF | Krever Node-server, tung | Overkill |

**Hvorfor pdfmake:**
- Vi har allerede struktur-data (tabeller, rader, grafer) i calc-output — passer deklarativ modell
- Kan lages templates som JSON-objekter per kalkulator → reusable/skalerbart
- Funker i ren statisk site (ingen backend trengs)
- Norsk tegn-støtte: embed Inter eller Noto Sans via TTF → æøå fungerer

**Eksempel-template-pattern** (morgage):
```js
{
  content: [
    { text: 'Boliglånskalkulator', style: 'h1' },
    { text: 'Hverdagsverktøy.com — 2026-04-20', style: 'sub' },
    { table: { body: [['Felt','Verdi'],['Lånebeløp','3 000 000 kr'],...] } },
    { text: 'Månedlig betaling: 18 423 kr', style: 'result' },
    { canvas: [{ type:'rect', ... }] } // amortisering-kurve
  ],
  footer: (curr, total) => ({ text: `Side ${curr}/${total}`, alignment:'center' }),
  styles: { h1:{fontSize:22,bold:true}, sub:{opacity:.6}, result:{fontSize:18,bold:true} }
}
```

---

## 3. Excel-generering — anbefaling: `ExcelJS`

**ExcelJS vs SheetJS:** ExcelJS har bedre styling (fonts, farger, borders, conditional formatting, charts). SheetJS er default for max format-kompatibilitet men styling er begrenset.

**For oss:** ExcelJS vinner klart — vi trenger formaterte rapporter (pene fonter, tall-formater, header-farger, fryste rader, embedded charts).

**Bruksområder per kalkulator:**
- calcAvs: avskrivningsplan m/ 10 rader × 4 kolonner + totalsum + sats-kommentar
- calcMor: amortiseringstabell 300+ rader (25 år × 12 mnd) + pie på rente vs avdrag
- calcBudsjett: månedsbudsjett m/ inntekts/utgifts-kategorier + pie-chart
- calcSpare: år-for-år compound + line-chart på formuesvekst
- calcAga: per-ansatt Excel m/ sone-brutto/OTP/feriepenger/AGA-breakdown

---

## 4. Paywall — anbefaling: Stripe Checkout + lettvekts-auth

**Siden er statisk (GitHub Pages, ingen backend).** Opsjoner:

| Pattern | Kost | Kompleksitet | Anbefaling |
|---|---|---|---|
| **Stripe Checkout + Netlify Functions** | Gratis tier | Middels — krever flytte fra GitHub Pages til Netlify/Vercel | ✅ Første steg |
| Stripe Checkout + Cloudflare Workers | Gratis tier | Middels | Alternativ |
| Memberstack (SaaS) | ~$29/mnd | Lav — plug-and-play | Dyrt |
| PayRequest | Per-transaksjon | Lav | Rask-test |
| Gumroad + Auth0 | Per-transaksjon | Lav | Alternativ |

**Anbefalt flyt:**
1. Flytt fra GitHub Pages → Netlify (samme JAMstack, men kan kjøre serverless functions)
2. Netlify Function `generate-download` tar calc-data + user-token
3. Stripe Checkout for engangsbetaling eller abonnement (f.eks. 49 kr/mnd eller 399 kr/år)
4. Etter vellykket betaling: skriv `membership: paid` til user-cookie eller Netlify Identity
5. `generate-download`-endpoint sjekker membership før PDF/Excel genereres

**Viktig juridisk (norsk kontekst):** MVA-registrering (~20 000 kr omsetning/12 mnd), vilkår (angrerett 14 dager for digitalt innhold), GDPR (brukerdata lagret hvor).

---

## 5. Samle-rapport (Tier 1 feature for betalt)

**UX-flyt:**
1. Bruker kjører flere kalkulatorer i løpet av en økt
2. Hver kjøring lagrer output til `localStorage.hvtSession` (anonym)
3. Ny knapp "Lag samle-rapport" vises når ≥2 kalkulatorer er kjørt
4. Click → (hvis free:) prompt med Stripe Checkout, (hvis paid:) generer PDF direkte

**PDF-innhold:**
- Forside: "Din økonomirapport — <dato>", disclaimer
- Innholdsfortegnelse
- Per-kalkulator seksjon: "Lønn etter skatt" / "Boliglån" / etc. med tabeller og nøkkeltall
- Sammendrag-side: total inntekt, total gjeld, total sparing, total skatt → gir helhetsbilde
- Footer på hver side: "Generert av Hverdagsverktøy.com — veiledende beregninger"

**Teknisk estimat:**
- 10-20 templates (én per kalkulator) — 30-60 min hver = 5-20 timer totalt
- Samle-rapport-renderer: 4-6 timer (koordinere state + compose til én PDF)
- Excel-templates (parallelt løp): ~8-12 timer

---

## 6. Design-referanser (inspirasjon)

**Best-i-klassen finansielle PDF/rapporter:**
- [Dribbble Financial Dashboard tag](https://dribbble.com/tags/financial-dashboard) — 700+ designs, minimal/dark-tema
- [Muzli 50 best dashboard examples 2026](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/) — kuraterte referanser
- [Subframe Finance Website Design](https://www.subframe.com/tips/finance-website-design-examples) — 25 eksempler m/ rammeverk

**Norske kvitterings/rapport-patterns å kopiere:**
- Skatteetaten `skattemelding.pdf` — offisiell norsk formatering (header-logo, fotnote-stil)
- DNB/Nordea nettbank-kvitteringer — ren tabell-stil
- Smartepenger.no (konkurrent, ingen betalt PDF i dag — bekreftet via søk)

**Excel-templates som inspirasjon (til ExcelJS-styling):**
- [Vertex42 Mortgage Calculator](https://www.vertex42.com/Calculators/home-mortgage-calculator.html) — industri-standard amortiseringsplan
- [Microsoft's Finance Templates](https://excel.cloud.microsoft/create/en/calculator-templates/) — hentbare malformater
- [Simple Sheets Mortgage](https://www.simplesheets.co/mortgage-calculator) — moderne pene designs

**Farge-/typografi-system (matche hverdagsverktoy-tema):**
- Primær: var(--accent) = gull (#d4a574 carbon-tema)
- Bakgrunn-lys (PDF): #f7f9fc eller #ffffff med mørk tekst
- Header/table: #1e1e1e tekst på hvit
- Typography: Inter (allerede på site) eller Playfair Display til tall

---

## 7. Implementerings-plan (fase-inndelt)

**Fase 0 (research, ferdig):** Denne filen.

**Fase 1 — Infra (1-2 dager):**
- Flytt fra GitHub Pages → Netlify/Vercel (bevare hele statisk site)
- Legg inn Stripe test-account + Netlify Function skeleton
- Auth-system: minimum Stripe customer-ID i cookie

**Fase 2 — PDF-pilot (2-3 dager):**
- Sett opp pdfmake + Inter-font embedding
- Implementer 2 templates: calcMor (boliglån) + calcSal (lønn-etter-skatt)
- Test med reelle tall, iterer layout

**Fase 3 — Excel-pilot (1-2 dager):**
- Sett opp ExcelJS
- Implementer calcAvs (avskrivningsplan) og calcMor (amortisering)
- Embed charts, teste Norwegian character encoding

**Fase 4 — Rollout (uker):**
- Templates for alle 27 kalkulatorer, 1-2 per dag
- Samle-rapport-feature (aggregator)
- Landing-side m/ pris + Stripe Checkout

**Fase 5 — Polishing:**
- Post-kjøp e-post m/ lenke til rapport
- Brukerpanel ("Mine rapporter")
- Promo/marketing

**Total estimat grov:** 4-6 uker dedikert arbeid for Fase 1-4, MVP-nivå.

---

## 8. Åpne spørsmål (må avklares før implementering)

1. **Prismodell:** engangsbetaling (49-99 kr per rapport) vs abonnement (49-99 kr/mnd)? Brukeren har ikke definert.
2. **Norsk MVA:** hvis omsetning >20k kr må selskap registreres i MVA-register. Brukeren enkeltpersonforetak?
3. **GDPR/personvernserklæring:** krever oppdatering for Stripe-data
4. **Host-migrasjon:** villig til å flytte fra GitHub Pages? (netlify.com anbefales)
5. **Design-retning:** Dark-tema konsistent m/ site, ELLER lys (mer "seriøs" for print-rapporter)?

---

## Kilder

- [Mac-draft paid membership feature](file:../implementering/Build%20a%20paid%20membership%20feature%20for%20a%20we.md)
- [Brain_HV forbedringer-roadmap 2026-04-16](file:C:/Obsidian/Brain_HV/wiki/notater/2026-04-16_forbedringer-roadmap-mac-draft.md)
- [Top JavaScript PDF Libraries 2026 (Nutrient)](https://www.nutrient.io/blog/top-js-pdf-libraries/)
- [SheetJS vs ExcelJS comparison](https://www.pkgpulse.com/blog/sheetjs-vs-exceljs-vs-node-xlsx-excel-files-node-2026)
- [Stripe Paywall 2026 (PayRequest)](https://payrequest.io/blog/stripe-paywall-content-monetization-2026)
- [Netlify Stripe subscriptions guide](https://www.netlify.com/blog/2020/07/13/manage-subscriptions-and-protect-content-with-stripe/)
- [Dribbble Financial Dashboard](https://dribbble.com/tags/financial-dashboard)
- [Muzli 2026 dashboard trends](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/)
- [Vertex42 Mortgage Excel](https://www.vertex42.com/Calculators/home-mortgage-calculator.html)
- [Microsoft Finance Templates](https://excel.cloud.microsoft/create/en/calculator-templates/)
