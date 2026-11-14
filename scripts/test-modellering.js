/* Tester regnemotoren i modellering/modellering.js mot svar som er kjent på forhånd.
   Kjør fra repo-rota:  node scripts/test-modellering.js
   Avslutter med kode 1 hvis en test feiler. */
'use strict';
const M = require('../modellering/modellering.js');

let pass = 0, fail = 0;
function near(navn, fikk, ventet, tol){
  tol = tol == null ? 1e-6 : tol;
  const ok = Math.abs(fikk - ventet) <= tol;
  console.log((ok ? 'OK   ' : 'FEIL ') + navn + ' — fikk ' + fikk + ', ventet ' + ventet);
  ok ? pass++ : fail++;
}
function sann(navn, v){ console.log((v ? 'OK   ' : 'FEIL ') + navn); v ? pass++ : fail++; }

// 1. Nåverdi av ett beløp: 100 om ett år til 10 % = 100 / 1,1
near('Nåverdi 100 om 1 år, 10 %', M.pv(100, 0.10, 1), 90.9090909, 1e-6);
// 2. Nåverdi av 1 000 om 5 år til 8 % = 1000 / 1,08^5 = 680,583
near('Nåverdi 1 000 om 5 år, 8 %', M.pv(1000, 0.08, 5), 680.5832, 1e-4);
// 3. Annuitet: 100 i tre år til 10 % = 100 × (1 − 1,1^−3) / 0,1 = 248,685
const ann = M.dcf({ fcf:[100, 100, 100], r:0.10, g:0 });
near('Annuitet 3 × 100, 10 % (sum nåverdi år 1–3)', ann.pvSum, 248.6852, 1e-4);
// 4. Evig rente uten vekst: 100 per år til 10 % = 1 000
near('Evig 100 per år, 10 %, ingen vekst', M.dcf({ fcf:[100], r:0.10, g:0 }).ev, 1000, 1e-9);
// 5. Gordon: 100 neste år, 10 % krav, 2 % vekst = 100 / 0,08 = 1 250
near('Gordon 100 / (10 % − 2 %)', M.dcf({ fcf:[100], r:0.10, g:0.02 }).ev, 1250, 1e-9);
// 6. Samme strøm, men med tre eksplisitte år som vokser 2 %: verdien skal fortsatt bli 1 250
near('Tre år med 2 % vekst + terminalverdi = 1 250', M.dcf({ fcf:[100, 102, 104.04], r:0.10, g:0.02 }).ev, 1250, 1e-9);
// 7. Terminalverdien alene: 104,04 × 1,02 / 0,08 = 1 326,51, nåverdi / 1,1^3 = 996,63
const tv = M.dcf({ fcf:[100, 102, 104.04], r:0.10, g:0.02 });
near('Terminalverdi etter år 3', tv.tv, 1326.51, 1e-9);
near('Nåverdi av terminalverdien', tv.pvTv, 1326.51 / 1.331, 1e-9);
// 8. Fra selskapsverdi til verdi per aksje: 1 250 − (300 gjeld − 50 kontanter) = 1 000; 10 aksjer = 100 per aksje
const ps = M.dcf({ fcf:[100], r:0.10, g:0.02, debt:300, cash:50, shares:10, unit:1 });
near('Egenkapitalverdi', ps.equity, 1000, 1e-9);
near('Verdi per aksje', ps.perShare, 100, 1e-9);
// 9. Samme i millioner kroner: 1 000 MNOK fordelt på 10 millioner aksjer = 100 kr
near('Verdi per aksje når tallene er i MNOK', M.dcf({ fcf:[100], r:0.10, g:0.02, debt:300, cash:50, shares:10e6, unit:1e6 }).perShare, 100, 1e-9);
// 10. Krav lavere enn eller lik vekst skal gi feilmelding, ikke et tall
sann('WACC lik vekst gir feilmelding', M.dcf({ fcf:[100], r:0.03, g:0.03 }).ok === false);
// 11. CAPM: 4 % + 1,2 × 5 % = 10 %
near('CAPM 4 % + 1,2 × 5 %', M.capm(0.04, 1.2, 0.05), 0.10, 1e-12);
// 12. WACC: 60 % EK til 10 %, 40 % gjeld til 5 % før 22 % skatt = 6 % + 1,56 % = 7,56 %
near('WACC 60/40, 10 % og 5 %, skatt 22 %', M.wacc({ E:600, D:400, re:0.10, rd:0.05, tax:0.22 }), 0.0756, 1e-12);
// 13. Følsomhetstabellen: midtcellen er basisverdien, og cellen der WACC = vekst er tom
const sens = M.sensitivity({ fcf:[100], r:0.10, g:0.02, debt:300, cash:50, shares:10, unit:1 }, [-0.08, 0, 0.01], [-0.01, 0, 0.01]);
near('Følsomhet: midtcellen = basis', sens[1][1], 100, 1e-9);
sann('Følsomhet: WACC 2 % mot vekst 2 % er tom', isNaN(sens[0][1]));
near('Følsomhet: WACC 11 %, vekst 3 %: 100 / 0,08 − 250 = 1 000 / 10 = 100', sens[2][2], 100, 1e-9);

// 14. Prognosen, regnet for hånd for ett år
const start = { revenue:1000, fixed:500, nwc:100, cash:50, debt:300, equity:400 };
const a = { growth:[0.10], ebitdaMargin:[0.20], depr:[0.05], capex:[0.06], nwcPct:[0.10], rate:[0.05], tax:[0.22], payout:[0.5], debtChange:[-50] };
const p = M.forecast(start, a, 1), y = p.years[0];
near('Prognose: omsetning 1 000 × 1,1', y.revenue, 1100);
near('Prognose: driftsresultat 220 − 55', y.ebit, 165);
near('Prognose: renter 300 × 5 %', y.interest, 15);
near('Prognose: skatt 150 × 22 %', y.tax, 33);
near('Prognose: årsresultat', y.net, 117);
near('Prognose: utbytte 50 %', y.dividend, 58.5);
near('Prognose: kontantstrøm fra drift 117 + 55 − 10', y.cfo, 162);
near('Prognose: endring i bank 162 − 66 − 108,5', y.dCash, -12.5);
near('Prognose: bank ved slutten av året', y.cash, 37.5);
near('Prognose: anleggsmidler 500 + 66 − 55', y.fixed, 511);
near('Prognose: egenkapital 400 + 117 − 58,5', y.equity, 458.5);
near('Prognose: sum eiendeler', y.assets, 708.5);
near('Prognose: balansen går opp (differanse 0)', y.diff, 0, 1e-9);
near('Prognose: fri kontantstrøm 165 × 0,78 + 55 − 66 − 10', y.fcff, 107.7, 1e-9);

// 15. Tre år med skiftende forutsetninger og underskudd: balansen går fortsatt opp hvert år
const a3 = { growth:[0.25, -0.40, 0.05], ebitdaMargin:[0.15, -0.05, 0.10], depr:[0.04, 0.06, 0.05], capex:[0.10, 0.02, 0.05],
  nwcPct:[0.12, 0.20, 0.08], rate:[0.06, 0.07, 0.05], tax:[0.22, 0.22, 0.22], payout:[0.3, 0.3, 0], debtChange:[200, 0, -100] };
const p3 = M.forecast({ revenue:5000, fixed:2000, nwc:600, cash:300, debt:1500, equity:1200 }, a3, 3);
p3.years.forEach(function(yy, i){
  near('Tre år: balansen går opp i år ' + (i + 1), yy.diff, 0, 1e-6);
});
sann('Tre år: underskudd gir null skatt og null utbytte', p3.years[1].tax === 0 && p3.years[1].dividend === 0);
near('Tre år: bank = forrige bank + kontantstrøm (år 3)', p3.years[2].cash, p3.years[1].cash + p3.years[2].dCash, 1e-9);

// 16. Tall fra skjemafelt
near('Tolker «1 234,5»', M.parseNum('1 234,5'), 1234.5);
near('Tolker «−12» med typografisk minus', M.parseNum('−12'), -12);
sann('Avviser «12a»', isNaN(M.parseNum('12a')));
sann('Viser 1234567,8 som «1 234 567,8»', M.fmt(1234567.8, 1) === '1 234 567,8');

console.log('\n' + pass + ' bestått, ' + fail + ' feilet');
process.exit(fail ? 1 : 0);
