# Språk-audit: "Vanskelig norsk" på hverdagsverktoy.com

**Dato:** 2026-04-20
**Prinsipp:** UTROLIG ENKELT. Folk som føler seg dumme skal føle seg smarte.
**Scope:** 8 sider (7 hoved + /om) + no.js + relevante deler av generate.js STATIC_NO
**Metode:** 3 parallelle Explore-agenter (tax/finance/consumer) — 60+ funn totalt

---

## TL;DR — 5 mest kritiske

1. **Akronymer uten forklaring ved første bruk** — AGA, OTP, BSU, NOKUS, ASK, SIFO, NPV, IRR. Alle er normale for fagfolk, ukjente for brukeren. Fix: første omtale må spille ut og/eller gi parentes-forklaring.
2. **Lovhenvisninger som "kap. 9" / "§ 5-1" / "Utlånsforskriften § 5"** før innholdet er forklart. Fix: forklar først hva regelen er, så paragrafnr i parentes/fotnote.
3. **Card-descriptions på /skatt er bare jargong-lister** — "Realisasjon · Bolig · Arv/gave · Utflytting". Leseren skal umiddelbart skjønne hva som står i kortet.
4. **/selskap** bombarderer med AS/ASA/ENK/ANS/DA/KS/NUF/SA i tittelen til hvert kort — uten å stave ut noe i descriptions.
5. **/personlig studielan + aksjer/fond/ASK** — bruker flagget spesifikt "FULL REVISJON AV ENKELHETEN". Studielan bruker "stipend-omgjøring", "borteboer-lån", "tilleggslån 30+" uten kontekst.

---

## /skatt — 10 funn

| Lokasjon | Nå | Hvorfor vanskelig | Forslag |
|---|---|---|---|
| `sal-wealth-desc` | "Verdsettelse · Bolig · Aksjer · Rabatter · Bunnfradrag" | "Verdsettelse" + "Bunnfradrag" jargong | "Hva eiendelene dine er verdt · bolig · aksjer · hva du kan trekke fra" |
| `sal-ded-desc` | "Minstefradrag · Gjeldsrenter · Særfradrag" | Ukjente termer | "Utgifter du trekker fra · rentekostnader · spesielle fradrag" |
| `sal-real-desc` | "Realisasjon · Bolig · Arv/gave · Utflytting" | "Realisasjon" ikke hverdagsnorsk | "Når du selger noe · bolig · arv og gaver · ved utflytting fra Norge" |
| `sal-corp-desc` | "Utbytte · Aksjegevinst · Konsernbidrag · NOKUS" | NOKUS aldri forklart | "Penger fra aksjer · verdistigning · overføringer mellom selskaper · norske selskap med utenlandske datterselskap (NOKUS)" |
| `sal-reorg-desc` | "Fusjon · Fisjon · Aksjebytte · Omdanning" | Alle uklare | "Når selskaper slår seg sammen · når de deles · når aksjer byttes · når selskapsformen endres" |
| `sal-anti-desc` | "Armlengdeprinsippet · Omgåelsesnormen · Skatteposisjoner" | Ren legal jargong | "Normalpris-regel mellom nærstående · grensen for kunstig skatteplanlegging · hva slags skattefordeler som følger et selskap" |
| `sal-time-desc` | "Inntektsperioder · Realisasjon · Kontantprinsippet · Underskudd" | Jargong | "Hvilket år inntekten/utgiften teller i · når den regnes · 'betalt-prinsippet' · minus-år" |
| `sal-depr-desc` | "Saldoavskrivning (kap. 14, §§ 14-40 til 14-48)" | Lang ordkjede + lovref | "Slik skriver du av maskiner og bygg år for år (skatteloven § 14-40 flg.)" |
| `sal-credit-desc` | "BSU · Pensjon · Kreditfradrag · SkatteFUNN" | BSU + SkatteFUNN uforklart | "Boligsparing for ungdom (BSU) · pensjonsfradrag · skatt betalt i utlandet · SkatteFUNN (skattefradrag for forskning)" |
| `sal-princ-desc` | "Skatteevne · Nøytralitet · Legalitet · Sentrale høyesterettsdommer" | Fagfilosofiske begreper | "Hvem tåler å betale · at skatten ikke vrir atferd · at skatter trenger lov · viktige dommer" |

---

## /avgift — 7 funn

| Lokasjon | Nå | Hvorfor vanskelig | Forslag |
|---|---|---|---|
| `vat-adj-desc` | "Mval. kap. 9 — justering av inngående MVA ved bruksendring" | "Mval." + "inngående MVA" | "Juster MVA-fradraget hvis du bruker ting annerledes enn du først tenkte (MVA-loven kap. 9)" |
| `adj-opt-prop` / `adj-opt-mach` | "Fast eiendom (§ 9-1 b) — 10 år" | Lovref først | "Bygg og tomter — justerings-periode 10 år" |
| `adj-ex-mach` | "Inkl. driftsmidler — ikke fritatte kjøretøy (§ 6-7)" | "Driftsmidler" + lovref | "Gjelder: maskiner, biler, utstyr til bedriften. UNNTATT: personbil som ikke brukes i drift" |
| `aga-hint-otp` | "OTP = obligatorisk tjenestepensjon. Arbeidsgiver må spare minst 2% av lønn over 1G til pensjon." | "1G" uforklart | "OTP (pensjon som arbeidsgiveren sparer til deg). Minst 2% av lønn over grunnbeløpet (130 160 kr i 2026) går inn." |
| `aga-hint-zone` | "AGA = arbeidsgiveravgift. Satsen avhenger av hvor bedriften holder til." | Trenger konkret eksempel | Tillegg: "f.eks. 14,1% i Oslo, 0% i Finnmark" |
| `adj-ex-whatdesc` | "Når du har fradragsført inngående MVA på en kapitalvare, og bruken endres i justeringsperioden..." | 24-ords setning | Del: "Du fikk MVA-fradrag da du kjøpte f.eks. bygget. Endrer du hvordan du bruker det senere, må du justere fradraget — enten tilbake eller mer." |
| `vat-aga-title` | "Arbeidsgiveravgift (AGA-soner)" | "Soner" uforklart | "Arbeidsgiveravgift — satsen er lavere i distriktene" |

---

## /kalkulator — 2 funn (få card-descs)

| Lokasjon | Nå | Hvorfor vanskelig | Forslag |
|---|---|---|---|
| `npv-howto-desc` | "Steg-for-steg guide til NPV og IRR" | NPV/IRR uforklart | "Steg-for-steg: regn ut om investeringen lønner seg (NPV/IRR)" |
| `npv-intro-desc` | "Nåverdi, rentabilitet, break-even" | Tre jargong-ord | "Er investeringen verdt det? Hvor lang tid før pengene kommer tilbake?" |

---

## /boliglan — 11 funn

| Lokasjon | Nå | Hvorfor vanskelig | Forslag |
|---|---|---|---|
| `mor-req-desc` | "Egenkapital, gjeldsgrad, stresstest, avdrag" | 4 fagbegreper på rad | "Hvor mye du selv må ha · hvor mye lån du tåler · kan du klare høyere rente · hvor ofte du betaler ned" |
| `mor-cost-desc` | "Renter, skattefradrag, dokumentavgift" | "Dokumentavgift" uforklart | "Rentene du betaler · pengene staten gir tilbake · statlig kjøpsavgift (2,5%)" |
| `mor-note-maxyears` | "Maks løpetid 30 år (bankpraksis). Har du lånt mer enn 60% av boligens verdi må du betale avdrag — Utlånsforskriften § 9." | Lov-ref uten kontekst | "Låner du mer enn 60% av boligens pris, må du betale ned hvert år (Utlånsforskriften § 9). Maks tilbakebetalingstid er 30 år." |
| `mor-tax-hdr` | "Skattefradrag (22%)" | 22% av hva? | "Pengene staten gir tilbake (22% av rentene du betalte)" |
| `mor-stress-hdr` | "Stresstest (+3 prosentpoeng)" | Finansjargong | "Tåler du renten å øke? (banken sjekker +3%)" |
| `mor-stress-note` | "Utlånsforskriften § 5: banken må sjekke at du tåler høyeste av 7% og rente + 3 prosentpoeng." | 27-ord, passiv | "Banken må vise at du klarer renten hvis den blir 7% eller dagens rente + 3 prosentpoeng — strengeste av de to." |
| `maxlan-desc` | "Maks lånebeløp basert på inntekt og egenkapital" | "Egenkapital" jargong | "Det meste du kan låne basert på inntekten og sparepengene dine" |
| `bvl-title` | "Bolig vs leie" | "vs" litt stivt | "Bolig eller leie — hva lønner seg?" |

---

## /selskap — 10 funn

| Lokasjon | Nå | Hvorfor vanskelig | Forslag |
|---|---|---|---|
| `selskap-enk-title` | "Enkeltpersonforetak (ENK)" | Akronym uten forklaring | "Enkeltpersonforetak (ENK) — når du driver alene i eget navn" |
| `selskap-as-title` | "Aksjeselskap (AS)" | Akronym uten kontekst | "Aksjeselskap (AS) — eget selskap, begrenset privat ansvar" |
| `selskap-ans-title` | "Ansvarlig selskap (ANS / DA)" | DA uforklart | "Ansvarlig selskap (ANS = delt ansvar, DA = alle hefter helt)" |
| `selskap-ks-title` | "Kommandittselskap (KS)" | Ord + akronym | "Kommandittselskap (KS) — to typer eiere, én med begrenset og én med fullt ansvar" |
| `selskap-andre-title` | "Andre selskapsformer" | Vagt | "Andre former (ASA, NUF, SA, stiftelse)" |
| `sel-asl-stift-title` | "Stiftelse (kap. 2)" | "asl" skjult, "kap." forkortet | "Hvordan starte et AS (aksjeloven kapittel 2)" |
| `sel-asl-kapital-title` | "Aksjekapital og utdeling (kap. 3 og 8)" | Jargong | "Pengene i selskapet og utbytte til eierne (aksjeloven kap. 3 og 8)" |
| `sel-asl-ledelse-title` | "Ledelse og organisering (kap. 6)" | For bredt | "Styre, daglig leder og møter (aksjeloven kap. 6)" |
| `sel-law-label-sel` | "Selskapsloven" | Ren tittel | "Selskapsloven — regler for ANS, DA og KS" |
| `sel-sel-ks-title` | "Kommandittselskap (kap. 3)" | Jargong | "Kommandittselskap — komplementar + kommandittist (selskapsloven kap. 3)" |

**ASK+AS skjema-redesign (bruker flagget som H):** Tenk "Lag ditt AS steg-for-steg" i stedet for fagterm-liste. Hvert felt med plain-language spørsmål:
- "Hva skal selskapet hete?" (ikke "Foretaksnavn")
- "Hvor skal det ligge?" (ikke "Kommune")
- "Hvor mye penger starter du med? (minst 30 000 kr)" (ikke "Aksjekapital")
- "Hvem skal sitte i styret? (minimum 1)" (ikke "Styremedlemmer")

---

## /personlig — 15 funn (HØYEST PRIORITET — bruker-flagget)

| Lokasjon | Nå | Hvorfor vanskelig | Forslag |
|---|---|---|---|
| Studielan `#stud-title` | "Studielån" | Knappet, gir ikke forventning | "Studielån — hvor mye må du betale tilbake (og hvor mye blir gratis)" |
| Studielan desc | "Stipend vs. lån, nedbetalingsplan og månedskostnad fra Lånekassen" | "Stipend-omgjøring" uklar | "Hvor mye må du betale tilbake · hvor mye blir stipend hvis du fullfører" |
| Studielan info | "...inntil 40% av borteboer-lånet ditt til stipend..." | "Borteboer-lån" ukjent | "Bor du hjemmefra: 40% av lånet blir gratis. Bor du hjemme: 15%. Resten må du betale tilbake." |
| Studielan label | "Lån til skolepenger (kr/år)" | Når brukes dette? | "Lån til skoleavgift (privatskole/utland, kr/år)" |
| Studielan label | "Tilleggslån, 30+" | Tallgate uforklart | "Ekstra lån hvis du er over 30 år eller har barn (kr/år)" |
| Studielan label | "Nedbetalingstid (år)" | Annuitet?| "Nedbetalingstid i år (vanligvis 20, fast terminbeløp)" |
| Sparekalk-desc | "Se kraften i rentes rente" | Blomstrende uten forklaring | "Regn ut hvor mye pengene dine vokser på rente + rente på renten" |
| Aksjer-veiledning | Introducerer "volatil", "indeksfond", "skjermingsfradrag" uten kontekst | Fagord bygges ikke opp | Forklar hver før bruk: "Aksjer svinger i verdi (volatile). Et indeksfond sprer pengene på mange selskaper — tryggere." |
| Fond-blokk | "Fondskonto (vanlig)" | "Vanlig" vs hva? | "Vanlig fondskonto — du betaler skatt hver gang du tar ut penger" |
| ASK-blokk | "ASK" | Akronym uten forklaring | "Aksjesparekonto (ASK) — skattefri sparing i aksjer og aksjefond" |
| Ordliste: IPS | "Individuell pensjonssparing" | Kort hjelpetekst | Tillegg: "Pensjonssparing med skattefradrag — pengene er låst til du er 62." |
| Ordliste: Call-opsjon | "...rett til å kjøpe aksje..." | "Strike" brukt uten forklaring | "Call-opsjon = rett til å kjøpe aksje til avtalt pris. Tjener penger hvis aksjen stiger over denne prisen." |
| Ordliste: Skjermingsfradrag | "skatteparaply" | Metafor uklar | "Skjermingsfradrag = en liten del av aksjeavkastningen er skattefri hvert år (ca. 3,25% av kjøpspris)" |
| Ordliste: Gearing | "Gearing (belåning)" | Engelskord | "Gearing = lån fra megleren for å kjøpe flere aksjer. Dobler både gevinst og tap." |
| Sykepenger — hele seksjonen | diverse | "6G-tak" forklart kun én gang | Gjenta "6G (ca. 781 000 kr i 2026)" ved hver forekomst |

---

## / (root) — 5 funn (SEO-artikkel STATIC_NO)

| Lokasjon | Nå | Forslag |
|---|---|---|
| Trinnskatt-setning | "trinnskatt-trinn (1,7%, 4,0%, 13,7%, 16,8% og 17,8%), trygdeavgift på 7,6%..." | "Lønnsskatten har 5 nivåer: jo mer du tjener, jo høyere prosent (fra 1,7% til 17,8%). Pluss trygdeavgift på 7,6% for alle lønnstakere." |
| Boliglan-seksjon | "krav til egenkapital (10% / 40% sekundærbolig)" | "Minst 10% egenkapital på første bolig, 40% på hytte eller ekstra bolig" |
| Kalkulator-seksjon | "OTP-pensjon (2-7%), saldoavskrivning for alle 10 grupper (a-j)" | "OTP (pensjon fra arbeidsgiver, 2-7%) · avskrivning år-for-år på 10 typer ting (gruppe A-J)" |
| Personlig-seksjon | "SIFO-referansebudsjett" | "SIFO-budsjett (standard husholdningsbudsjett fra SIFO-senteret)" |
| Selskap-seksjon | "registrering i Brønnøysundregistrene (gebyr 6 825 kr)" | "Registrering hos Brønnøysund (der alle bedrifter får organisasjonsnummer, gebyr 6 825 kr)" |

---

## /om — 2 funn

| Lokasjon | Nå | Forslag |
|---|---|---|
| Kvalitetssikring-liste | "Stortingets skattevedtak av 18. desember 2025 (STV-2025-12-18-2747)" | "Satsene er fra Stortingets vedtak 18. desember 2025 — oppdateres årlig" |
| Siste setning | "...norske lover, forskrifter og offentlige satser er unntatt fra opphavsrett etter åndsverkloven § 14..." | "Offentlige satser og lover kan gjengis fritt (åndsverkloven § 14)" |

---

## Prioritert fix-rekkefølge

1. **H — Card-descriptions på /skatt + /selskap** (20 funn). Mest trafikk, mest jargong-konsentrasjon. 1-2 timer sitework.
2. **H — /personlig studielan + aksjer/fond/ASK** (6-8 funn). Bruker eksplisitt flagget "FULL REVISJON".
3. **H — ASK/AS skjema på /selskap** (bruker-quote: "skjønner ikke jeg engang"). Krever UX-rewrite, ikke bare tekst.
4. **M — Lovhenvisninger** — snu rekkefølgen (forklaring først, paragraf etter) på /boliglan + /avgift + /skatt.
5. **M — /personlig teknisk ordliste** — gearing, skjermingsfradrag, call-opsjon, IPS.
6. **L — /om + / SEO** — mindre trafikk, men raske fikser.

---

## Anti-patterns som dukker opp gjennomgående

- **Akronymer uten forklaring ved første bruk** (AGA, OTP, BSU, NOKUS, ASK, SIFO, NPV, IRR, ENK, ANS, DA, KS)
- **Lovref før forklaring** ("§ 5-1" før leseren vet hva regelen er)
- **Lange substantivkjeder** (arbeidsgiveravgiftsgrunnlag, saldoavskrivning)
- **Byråkratisk passiv** ("skal fastsettes", "kan kreves") — erstatt med "du må" / "banken skal"
- **Tall uten enhet/ankre** ("22%" uten å si "av hva", "1G" uten beløp)
- **Metaforer uten bakgrunn** ("skatteparaply", "kraften i rentes rente")
- **Card-descriptions som rene jargong-lister** uten setning rundt
