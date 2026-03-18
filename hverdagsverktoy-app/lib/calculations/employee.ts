/**
 * Employee cost calculators: AGA, Holiday pay, Salary vs Dividend
 * Exact port of calcAga(), calcFerie(), calcLvu() from the web version.
 */

export interface AgaResult {
  totalCost: number;
  agaAmount: number;
  ferieAmount: number;
  otpAmount: number;
  percentOfGross: number;
  monthlyTotal: number;
}

export function calcAga(
  salary: number,
  agaRate: number,     // e.g. 0.141
  ferieRate: number,   // e.g. 0.102 or 0.12
  otpRate: number      // e.g. 0.02
): AgaResult | null {
  if (salary <= 0) return null;

  const agaAmount = salary * agaRate;
  const ferieAmount = salary * ferieRate;
  const otpAmount = salary * otpRate;
  const totalCost = salary + agaAmount + ferieAmount + otpAmount;
  const percentOfGross = ((agaAmount + ferieAmount + otpAmount) / salary) * 100;

  return {
    totalCost,
    agaAmount,
    ferieAmount,
    otpAmount,
    percentOfGross,
    monthlyTotal: totalCost / 12,
  };
}

export interface FerieResult {
  amount: number;
  dailyRate: number;
  withBonus: number | null;
}

export function calcFerie(
  annualSalary: number,
  ferieRate: number,  // 0.102 or 0.12
  isOver60: boolean
): FerieResult | null {
  if (annualSalary <= 0) return null;

  const amount = annualSalary * ferieRate;
  const dailyRate = amount / 220;
  let withBonus: number | null = null;

  if (isOver60) {
    const bonusRate = ferieRate + 0.023;
    withBonus = annualSalary * bonusRate;
  }

  return { amount, dailyRate, withBonus };
}

export interface LvuResult {
  salaryCost: number;
  dividendCost: number;
  difference: number;
  cheaperOption: 'salary' | 'dividend';
}

export function calcLvu(
  grossAmount: number,
  agaRate: number     // e.g. 0.141
): LvuResult | null {
  if (grossAmount <= 0) return null;

  // Salary: company pays gross + AGA + holiday pay + OTP
  const salaryCost = grossAmount * (1 + agaRate + 0.12 + 0.02);

  // Dividend: company needs enough pre-tax profit to distribute grossAmount
  const dividendCost = grossAmount / (1 - 0.22);

  const difference = Math.abs(salaryCost - dividendCost);
  const cheaperOption: 'salary' | 'dividend' = salaryCost < dividendCost ? 'salary' : 'dividend';

  return { salaryCost, dividendCost, difference, cheaperOption };
}
