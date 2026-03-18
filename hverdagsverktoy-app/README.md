# Hverdagsverktoy - React Native (Expo) App

Mobile version of [hverdagsverktoy.com](https://hverdagsverktoy.com) - a Norwegian financial calculator suite.

## Setup

```bash
cd hverdagsverktoy-app
npm install
npx expo start
```

## Features

### 18 Calculators
1. **Tax/Salary** - Norwegian 2026 tax rules with trinnskatt (bracket tax)
2. **Mortgage** - Annuity and serial loan calculations
3. **Interest-only Mortgage** - Compare with standard annuity
4. **NPV/IRR** - Net present value and internal rate of return
5. **VAT** - Calculate amounts with/without MVA
6. **VAT Adjustment** - Capital asset adjustment (mval. kap. 9)
7. **Finance: TVM** - Present/future value calculations
8. **Finance: Margin** - Profit margin and markup
9. **Finance: Break-even** - Break-even point analysis
10. **Finance: Compound** - Compound interest calculator
11. **Finance: Discount** - Price after discount
12. **Salary vs Dividend** - Compare company cost
13. **Employee Cost** - AGA, holiday pay, OTP
14. **Depreciation** - Declining balance (saldoavskrivning)
15. **Holiday Pay** - Feriepenger calculator
16. **Effective Interest** - True cost of a loan
17. **Percentage** - Three calculation modes
18. **Currency Gain** - Foreign exchange gain/loss + tax
19. **Liquidity Budget** - 6-month cash flow projection
20. **Pension** - OTP pension estimate

### 10 Languages
Norwegian, English, Polish, Ukrainian, Arabic, Lithuanian, Somali, Tigrinya, Chinese, French

### 10 Themes
Standard, Blue, Dark, Glass, Sharp, Pink, Purple, Green, Peach, Minimal

## Architecture

- **Expo Router** for tab-based navigation
- **AsyncStorage** for theme/language persistence
- **TypeScript** throughout
- All calculation logic extracted into `lib/calculations/`
- Full i18n system in `lib/i18n/`

## Tax Rates (2026)

- Personfradrag: 114 540 kr
- Minstefradrag: 46% (max 95 700 kr)
- Trinnskatt: 1.7% / 4.0% / 13.7% / 16.8% / 17.8%
- Trygdeavgift: 7.6%
- Alminnelig skatt: 22%
