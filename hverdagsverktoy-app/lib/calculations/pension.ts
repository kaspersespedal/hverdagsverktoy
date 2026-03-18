/**
 * Pension calculator
 * Exact port of calcPensjon() from the web version.
 */

export interface PensionResult {
  pot: number;
  annualPension: number;
  monthlyPension: number;
  realMonthly: number; // adjusted for 2% inflation
}

export function calcPension(
  currentAge: number,
  retireAge: number,
  annualSalary: number,
  otpRate: number,     // e.g. 0.02
  returnRate: number   // e.g. 7 for 7%
): PensionResult | null {
  const years = retireAge - currentAge;
  if (years <= 0 || annualSalary <= 0) return null;

  const retRate = returnRate / 100;
  let pot = 0;
  for (let y = 0; y < years; y++) {
    pot = (pot + annualSalary * otpRate) * (1 + retRate);
  }

  const annualPension = pot / 20;
  const monthlyPension = annualPension / 12;

  // Inflation-adjusted purchasing power (2% inflation)
  const inflation = 0.02;
  const realMonthly = monthlyPension / Math.pow(1 + inflation, years);

  return { pot, annualPension, monthlyPension, realMonthly };
}
