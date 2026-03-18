/**
 * Mortgage calculator — exact port of calcMor() and calcIo()
 */

export interface MortgageResult {
  monthly: number;
  total: number;
  totalInterest: number;
  effectiveRate: number;
  year1Interest: number;
  year1Principal: number;
  firstPayment: number;
  lastPayment: number;
  loanType: 'annuity' | 'serial';
}

export function calcMortgage(
  principal: number,
  yearlyRate: number,
  years: number,
  loanType: 'annuity' | 'serial' = 'annuity'
): MortgageResult | null {
  if (principal <= 0 || years <= 0) return null;

  const mRate = yearlyRate / 100 / 12;
  const n = years * 12;

  let monthly: number;
  let total: number;
  let totalInterest: number;
  let r1 = 0;
  let a1 = 0;
  let firstPayment: number;
  let lastPayment: number;

  if (loanType === 'serial') {
    const avdrag = principal / n;
    let bal = principal;
    total = 0;
    totalInterest = 0;
    firstPayment = avdrag + bal * mRate;

    for (let i = 0; i < n; i++) {
      const renteIMnd = bal * mRate;
      const betaling = avdrag + renteIMnd;
      total += betaling;
      totalInterest += renteIMnd;
      if (i < 12) {
        r1 += renteIMnd;
        a1 += avdrag;
      }
      bal -= avdrag;
    }
    const lastBal = Math.max(principal - avdrag * (n - 1), 0);
    lastPayment = lastBal + lastBal * mRate;
    monthly = firstPayment;
  } else {
    // Annuity
    monthly = mRate === 0
      ? principal / n
      : (principal * mRate * Math.pow(1 + mRate, n)) / (Math.pow(1 + mRate, n) - 1);
    total = monthly * n;
    totalInterest = total - principal;

    let bal = principal;
    for (let i = 0; i < 12; i++) {
      const ri = bal * mRate;
      r1 += ri;
      a1 += monthly - ri;
      bal -= (monthly - ri);
    }
    firstPayment = monthly;
    lastPayment = monthly;
  }

  const effectiveRate = mRate === 0 ? 0 : (Math.pow(1 + mRate, 12) - 1) * 100;

  return {
    monthly,
    total,
    totalInterest,
    effectiveRate,
    year1Interest: r1,
    year1Principal: a1,
    firstPayment,
    lastPayment,
    loanType,
  };
}

export interface IoResult {
  mthFree: number;
  totFreePeriodInt: number;
  mthAfter: number;
  intAfterPeriod: number;
  totIntIo: number;
  totIntAnn: number;
  diff: number;
  annMth: number;
}

export function calcInterestOnly(
  principal: number,
  yearlyRate: number,
  ioYears: number,
  totalYears: number
): IoResult | null {
  if (principal <= 0 || ioYears >= totalYears) return null;

  const mRate = yearlyRate / 100 / 12;
  const ioMonths = ioYears * 12;
  const totalMonths = totalYears * 12;
  const remainMonths = totalMonths - ioMonths;

  const mthFree = principal * mRate;
  const totFreePeriodInt = mthFree * ioMonths;

  const mthAfter = mRate === 0
    ? principal / remainMonths
    : (principal * mRate * Math.pow(1 + mRate, remainMonths)) / (Math.pow(1 + mRate, remainMonths) - 1);
  const totAfterPeriod = mthAfter * remainMonths;
  const intAfterPeriod = totAfterPeriod - principal;

  const totIntIo = totFreePeriodInt + intAfterPeriod;

  const annMth = mRate === 0
    ? principal / totalMonths
    : (principal * mRate * Math.pow(1 + mRate, totalMonths)) / (Math.pow(1 + mRate, totalMonths) - 1);
  const totAnn = annMth * totalMonths;
  const totIntAnn = totAnn - principal;

  const diff = totIntIo - totIntAnn;

  return {
    mthFree,
    totFreePeriodInt,
    mthAfter,
    intAfterPeriod,
    totIntIo,
    totIntAnn,
    diff,
    annMth,
  };
}
