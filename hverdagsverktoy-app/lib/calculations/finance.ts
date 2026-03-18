/**
 * Finance calculators: TVM, Margin, Break-even, Compound interest, Discount
 * Exact port of fcCalc() from the web version.
 */

export interface TvmResult {
  futureValue: number;
  startingAmount: number;
  totalPayments: number;
  interestEarned: number;
  totalReturn: number; // percentage
  years: number;
}

export function calcTvm(
  pv: number,
  ratePercent: number,
  years: number,
  annualPayment: number
): TvmResult {
  const rate = ratePercent / 100;
  const factor = Math.pow(1 + rate, years);
  const fv = annualPayment === 0
    ? pv * factor
    : rate === 0
      ? pv + annualPayment * years
      : pv * factor + annualPayment * (factor - 1) / rate;
  const totalPmt = annualPayment * years;
  const interest = fv - pv - totalPmt;
  const totalReturn = pv !== 0 ? (fv / pv - 1) * 100 : 0;

  return { futureValue: fv, startingAmount: pv, totalPayments: totalPmt, interestEarned: interest, totalReturn, years };
}

export interface MarginResult {
  profit: number;
  margin: number;   // percentage
  markup: number;    // percentage
  cost: number;
  sell: number;
}

export function calcMargin(cost: number, sell: number): MarginResult {
  const profit = sell - cost;
  const margin = sell !== 0 ? (profit / sell) * 100 : 0;
  const markup = cost !== 0 ? (profit / cost) * 100 : 0;
  return { profit, margin, markup, cost, sell };
}

export interface BreakevenResult {
  units: number;
  revenue: number;
  contribution: number;
  contributionMargin: number;
  fixedCosts: number;
}

export function calcBreakeven(fixed: number, pricePerUnit: number, varCostPerUnit: number): BreakevenResult {
  const contribution = pricePerUnit - varCostPerUnit;
  const units = contribution > 0 ? Math.ceil(fixed / contribution) : Infinity;
  const revenue = units * pricePerUnit;
  const contributionMargin = pricePerUnit !== 0 ? (contribution / pricePerUnit) * 100 : 0;
  return { units, revenue, contribution, contributionMargin, fixedCosts: fixed };
}

export interface CompoundResult {
  finalValue: number;
  interestEarned: number;
  totalReturn: number;
  doublingYears: number;
  startingAmount: number;
  years: number;
}

export function calcCompound(principal: number, ratePercent: number, years: number, frequency: number): CompoundResult {
  const rate = ratePercent / 100;
  const freq = frequency || 1;
  const total = principal * Math.pow(1 + rate / freq, freq * years);
  const interest = total - principal;
  const logBase = Math.log(1 + rate / freq);
  const doublingYears = logBase > 0 ? Math.log(2) / logBase / freq : Infinity;
  const totalReturn = principal !== 0 ? (total / principal - 1) * 100 : 0;

  return { finalValue: total, interestEarned: interest, totalReturn, doublingYears, startingAmount: principal, years };
}

export interface DiscountResult {
  finalPrice: number;
  saved: number;
  originalPrice: number;
  discountPercent: number;
}

export function calcDiscount(originalPrice: number, discountPercent: number): DiscountResult {
  const disc = Math.min(Math.max(discountPercent, 0), 100);
  const saved = originalPrice * disc / 100;
  const finalPrice = originalPrice - saved;
  return { finalPrice, saved, originalPrice, discountPercent: disc };
}
