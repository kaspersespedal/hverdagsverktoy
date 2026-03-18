/**
 * NPV / IRR calculator — exact port of calcNpv()
 */

export interface NpvResult {
  npv: number;
  irr: number | null;
  payback: number | null;
  sum: number;
  pi: number;
  isProfitable: boolean;
}

export function calcNpv(
  investment: number,
  discountRate: number, // e.g. 10 for 10%
  cashFlows: number[]   // array of 5 year cash flows
): NpvResult | null {
  if (investment <= 0) return null;

  const rate = discountRate / 100;

  // NPV
  let npv = -investment;
  cashFlows.forEach((cf, i) => {
    npv += cf / Math.pow(1 + rate, i + 1);
  });

  // Payback period (simple, undiscounted)
  let cum = -investment;
  let payback: number | null = null;
  cashFlows.forEach((cf, i) => {
    const prevCum = cum;
    cum += cf;
    if (payback === null && cum >= 0 && cf !== 0) {
      payback = i + (-prevCum) / cf;
    }
  });

  // IRR via Newton-Raphson
  let irr = 0.1;
  let irrValid = true;
  for (let j = 0; j < 300; j++) {
    let f = -investment;
    let df = 0;
    cashFlows.forEach((cf, i) => {
      const p = Math.pow(1 + irr, i + 1);
      if (Math.abs(p) < 1e-15) return;
      f += cf / p;
      df -= (i + 1) * cf / Math.pow(1 + irr, i + 2);
    });
    if (Math.abs(df) < 1e-12) break;
    const step = f / df;
    irr -= step;
    if (irr < -0.99) irr = -0.99;
    if (irr > 10) irr = 10;
    if (isNaN(irr) || !isFinite(irr)) { irrValid = false; break; }
    if (Math.abs(f) < 0.01) break;
  }
  if (isNaN(irr) || !isFinite(irr)) irrValid = false;

  const sum = cashFlows.reduce((a, b) => a + b, 0);
  const pi = investment > 0 ? (npv + investment) / investment : 0;

  return {
    npv,
    irr: irrValid ? irr * 100 : null,
    payback,
    sum,
    pi,
    isProfitable: npv >= 0,
  };
}
