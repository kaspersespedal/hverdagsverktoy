/**
 * Effective interest rate calculator
 * Exact port of calcRente() from the web version (bisection method).
 */

export interface EffectiveRateResult {
  effectiveRate: number;  // percentage
  totalCost: number;
  totalFees: number;
}

export function calcEffectiveRate(
  loanAmount: number,
  nominalRatePercent: number,
  setupFee: number,
  monthlyFee: number,
  years: number
): EffectiveRateResult | null {
  if (loanAmount <= 0 || years <= 0) return null;

  const nom = nominalRatePercent / 100;
  const n = years * 12;

  // Monthly annuity payment at nominal rate
  const mr = nom / 12;
  const annuity = mr > 0
    ? loanAmount * mr / (1 - Math.pow(1 + mr, -n))
    : loanAmount / n;
  const totalPayment = annuity + monthlyFee;
  const netProceeds = loanAmount - setupFee;

  // PV function
  function pvAtRate(r: number): number {
    if (r < 1e-10) return totalPayment * n;
    const rm = r / 12;
    return totalPayment * (1 - Math.pow(1 + rm, -n)) / rm;
  }

  // Bisection: find r where pvAtRate(r) = netProceeds
  let lo = 0.0001;
  let hi = 2.0;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pvAtRate(mid) > netProceeds) lo = mid;
    else hi = mid;
  }

  const eff = ((lo + hi) / 2) * 100;
  const totalFees = setupFee + monthlyFee * n;
  const totalCost = annuity * n + monthlyFee * n + setupFee;

  return { effectiveRate: eff, totalCost, totalFees };
}
