# Verifiseringsrapport — Alle kalkulatorer

**Dato:** 18. mars 2026
**Metode:** Alle beregningsformler i `core.js` reprodusert med Python og kryssjekket mot live-site i Chrome. Skattesatser verifisert mot offisielle 2026-kilder.

---

## RESULTAT: 1 beregningsfeil funnet, resten er korrekt

---

## FEIL

### LVU (Lønn vs Utbytte) — AGA beregnes på feil grunnlag

**Fil:** `shared/core.js` linje 2315
**Kode:**
```js
const salCost = g * (1 + aga + 0.12 + 0.02);
```

**Problem:** Formelen beregner arbeidsgiveravgift (AGA) kun på bruttolønnen. I virkeligheten beregnes AGA av brutto + feriepenger + OTP (hele lønnskostnadsgrunnlaget). Din egen Ansattkostnad-kalkulator (`calcAga`) gjør dette riktig.

**Eksempel med 600,000 kr, sone 1 (14.1%):**

| | LVU (feil) | Ansattkostnad (riktig) |
|---|---|---|
| AGA-grunnlag | 600,000 | 684,000 (600k + 72k ferie + 12k OTP) |
| AGA-beløp | 84,600 | 96,444 |
| **Total lønnskostnad** | **768,600** | **780,444** |
| Differanse | | **+11,844 kr** |

**Konsekvens:** LVU-kalkulatoren undervurderer lønnskostnaden med ~1.5–2%, noe som kan gi feil konklusjon om hva som er billigst (lønn vs. utbytte). Med AGA-soner over 14% og høye lønninger øker feilen.

**Fix:**
```js
// Nåværende (feil):
const salCost = g * (1 + aga + 0.12 + 0.02);

// Korrekt:
const ferie = g * 0.12;
const otp = g * 0.02;
const agaBase = g + ferie + otp;
const agaAmt = agaBase * aga;
const salCost = g + ferie + otp + agaAmt;
```

---

## VERIFISERT KORREKT

### Skattkalkulator (calcSal)

Testet med 600,000 kr brutto, klasse 1, standard sone:

| Komponent | Verdi | Korrekt? |
|---|---|---|
| Minstefradrag (46%, maks 95,700) | 95,700 kr | ✓ |
| Personfradrag kl. 1 | 114,540 kr | ✓ |
| Alminnelig inntekt | 389,760 kr | ✓ |
| Trinnskatt | 12,835 kr | ✓ |
| Alminnelig skatt (22%) | 85,747 kr | ✓ |
| Trygdeavgift (7.6%) | 45,600 kr | ✓ |
| Total skatt | 144,183 kr | ✓ |
| Netto | 455,817 kr | ✓ |
| Effektiv skattesats | 24.0% | ✓ |

**Skattesatser 2026 verifisert mot offisielle kilder:**

| Parameter | I koden | Offisielt 2026 | Status |
|---|---|---|---|
| Trinnskatt trinn 1 | 1.7% fra 226,100 | 1.7% fra 226,100 | ✓ |
| Trinnskatt trinn 2 | 4.0% fra 318,300 | 4.0% fra 318,300 | ✓ |
| Trinnskatt trinn 3 | 13.7% fra 725,050 | 13.7% fra 725,050 | ✓ |
| Trinnskatt trinn 4 | 16.8% fra 980,100 | 16.8% fra 980,100 | ✓ |
| Trinnskatt trinn 5 | 17.8% fra 1,467,200 | 17.8% fra 1,467,200 | ✓ |
| Trygdeavgift lønn | 7.6% | 7.6% | ✓ |
| Trygdeavgift selvstendig | 10.8% | 10.8% | ✓ |
| Personfradrag kl. 1 | 114,540 | 114,540 | ✓ |
| Personfradrag kl. 2 | 229,200 | 229,200 | ✓ |
| Minstefradrag sats | 46% | 46% | ✓ |
| Minstefradrag maks | 95,700 | 95,700 | ✓ |

### Boliglånskalkulator (calcMor)

Testet med 3,000,000 kr, 5.5%, 25 år:

| Type | Formel | Resultat | Korrekt? |
|---|---|---|---|
| Annuitet | P×r(1+r)^n / ((1+r)^n - 1) | 18,423 kr/mnd | ✓ |
| Total betaling | 5,526,787 kr | | ✓ |
| Total rente | 2,526,787 kr | | ✓ |
| Effektiv rente | (1+r_m)^12 - 1 | 5.64% | ✓ |
| Serielån | Fast avdrag + synkende rente | ✓ | ✓ |
| Siste betaling (serie) | lastBal × (1 + mRate) | Korrekt | ✓ |

### Avdragsfritt lån (calcIo)

- Kun rente i avdragsfri periode ✓
- Full annuitet på resterende periode ✓
- Sammenligning med annuitet fra dag 1 ✓

### NPV/IRR (calcNpv)

| Komponent | Formel | Korrekt? |
|---|---|---|
| NPV | Standard DCF: Σ CF_t/(1+r)^t - I | ✓ |
| IRR | Newton-Raphson med safeguards | ✓ |
| Payback | Enkel (ikke diskontert) | ✓ |
| PI | (NPV + Inv) / Inv | ✓ |

Testet: Inv=1M, CF=[300k,350k,400k,400k,500k], r=10% → NPV=446,175, IRR=24.84%, PI=1.45x ✓

### MVA/Avgift (calcVat)

- Ekskl → Inkl: a × (1 + sats) ✓
- Inkl → Ekskl: a / (1 + sats) ✓

### Justeringsregler MVA (calcAdj)

- Terskelverdi: 100,000 (eiendom) / 50,000 (annet) ✓
- Justeringsperiode: 10 år (eiendom) / 5 år (annet) ✓
- Bagatellgrense < 10 prosentpoeng (§ 9-2) ✓
- Beregning: (MVA/periode) × endring × gjenståendePeriode ✓

### Uttakskalkulator (calcUttak)

- ENK: alminnelig inntekt 22% + trygd 10.8% + trinnskatt ✓
- AS: selskapsskatt 22% + oppjustert utbytte ×1.72 × 22% ✓
- Effektiv utbyttesats uten skjerming: 51.5% ✓ (kjent standard)

### Utdelingskalkulator (calcUtdeling)

- Aksjonærmodellen (AS): identisk med uttakskalkulator ✓
- Foretaksmodellen (ENK): personfradrag + alminnelig + trygd + trinnskatt ✓

### Ansattkostnad (calcAga)

- AGA beregnes av brutto + feriepenger + OTP ✓
- Alle komponenter riktig summert ✓
- Testet: 600k → total 780,444 kr ✓

### Bilkostnad (calcBilkostnad)

- Verditap: degressiv avskrivning med merkejustering ✓
- Drivstoffkostnad: riktig per-km estimat ✓
- Trafikkforsikringsavgift: 2,329 kr (fossil) / 3,270 kr (elbil) — rimelige 2026-verdier ✓
- Alle kostnadsposter summeres korrekt ✓

### Avskrivningskalkulator (calcAvs)

- Skattemessig: saldoavskrivning (degressiv) ✓
- Regnskapsmessig: lineær avskrivning med restverdi ✓
- Sammenligning: midlertidige forskjeller og utsatt skatt (22%) ✓
- Bokført vs skattemessig verdi-tabell ✓

### Feriepenger (calcFerie)

- Vanlig sats: 10.2% ✓
- Over 60: ekstra 2.3 prosentpoeng ✓

### Effektiv Rente (calcRente)

- Bisection-metode for å finne effektiv rente ✓
- Inkluderer etableringsgebyr og månedlige gebyrer ✓
- Testet: 3M, 5%, 5000 est., 50/mnd → 5.05% (> nominell, som forventet) ✓

### Valutagevinst (calcValgevinst)

- Enkel gevinst/tap = (salg - kjøp) i NOK ✓
- Skatt 22% på gevinst ✓

### Likviditetsbudsjett (calcLikvid)

- 6 måneders fremskriving med fast inntekt/utgift ✓
- Negativ balanse markeres ✓

### Pensjon OTP (calcPensjon)

- Rentes rente med årlig innskudd ✓
- Utbetaling over 20 år ✓
- Inflasjonsjustering med 2% ✓

### Finanskalkulatorer (kalkulator.html)

| Kalkulator | Formel | Korrekt? |
|---|---|---|
| TVM | FV = PV(1+r)^n + PMT×((1+r)^n-1)/r | ✓ |
| Margin/Markup | margin = profit/sell, markup = profit/cost | ✓ |
| Break-even | fixed / (price - variable_cost) | ✓ |
| Rentes rente | P × (1 + r/f)^(f×y) | ✓ |
| Rabatt | original × (1 - discount%) | ✓ |

### Valutaomregner

- Riktig krysskonvertering via NOK-base ✓
- Live-rater fra open.er-api.com med fallback ✓

---

## OPPSUMMERING

| Kalkulator | Status |
|---|---|
| Skattkalkulator | ✅ Korrekt |
| Boliglånskalkulator | ✅ Korrekt |
| Avdragsfritt lån | ✅ Korrekt |
| NPV/IRR | ✅ Korrekt |
| MVA/Avgift | ✅ Korrekt |
| Justeringsregler MVA | ✅ Korrekt |
| Uttakskalkulator | ✅ Korrekt |
| Utdelingskalkulator | ✅ Korrekt |
| Ansattkostnad | ✅ Korrekt |
| Bilkostnad | ✅ Korrekt |
| Avskrivning | ✅ Korrekt |
| Feriepenger | ✅ Korrekt |
| Effektiv Rente | ✅ Korrekt |
| Valutagevinst | ✅ Korrekt |
| Likviditet | ✅ Korrekt |
| Pensjon | ✅ Korrekt |
| Finanskalkulatorer | ✅ Korrekt |
| Valutaomregner | ✅ Korrekt |
| **Lønn vs Utbytte** | **❌ FEIL — AGA beregnes på feil grunnlag** |

**Totalt: 18 kalkulatorer verifisert. 17 korrekte. 1 feil (LVU).**
