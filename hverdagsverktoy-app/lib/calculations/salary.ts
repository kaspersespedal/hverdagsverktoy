/**
 * Norwegian salary/tax calculator — 2026 tax rules
 * Exact port of calcSal() from the web version.
 */

export interface TrinnItem {
  label: string;
  rate: number;
  amount: number;
}

export interface SalaryResult {
  gross: number;
  net: number;
  totalTax: number;
  effectiveRate: number;
  socialSecurity: number;
  daily: number;
  monthly: number;
  trinnBreakdown: TrinnItem[];
}

export function calcSalary(
  gross: number,
  taxClass: string,   // '1', '2', or 'self'
  almRate: number,     // 0.22 standard, 0.185 Finnmark
  region: string,      // 'no', 'en', etc.
  labels: { trinn1: string; trinn2: string; trinn3: string; trinn4: string; trinn5: string; almSkatt: string }
): SalaryResult | null {
  if (gross <= 0) return null;

  let totalTax = 0;
  const trinnBreakdown: TrinnItem[] = [];

  if (region === 'no' || region === 'en' || true) {
    // 2026 Norwegian tax rules (apply to all regions since all use Norwegian tax)
    const personfradrag = taxClass === '2' ? 229200 : 114540;
    const minstefradrag = Math.min(Math.max(gross * 0.46, 0), 95700);
    const almInntekt = Math.max(gross - minstefradrag - personfradrag, 0);

    // Trinnskatt 2026 (5 brackets)
    const trinnSteps: [number, number, number, string][] = [
      [226100, 318300, 0.017, labels.trinn1],
      [318300, 725050, 0.040, labels.trinn2],
      [725050, 980100, 0.137, labels.trinn3],
      [980100, 1467200, 0.168, labels.trinn4],
      [1467200, Infinity, 0.178, labels.trinn5],
    ];

    trinnSteps.forEach(([lo, hi, rate, lbl]) => {
      const amt = gross > lo ? (Math.min(gross, hi) - lo) * rate : 0;
      totalTax += amt;
      trinnBreakdown.push({ label: lbl, rate, amount: amt });
    });

    // Alminnelig inntektsskatt
    const almSkatt = almInntekt * almRate;
    totalTax += almSkatt;
    trinnBreakdown.push({ label: labels.almSkatt, rate: almRate, amount: almSkatt });
  }

  // Trygdeavgift 2026: 7.6%
  const socialSecurity = gross * 0.076;
  const total = totalTax + socialSecurity;
  const net = gross - total;

  return {
    gross,
    net,
    totalTax: total,
    effectiveRate: (total / gross) * 100,
    socialSecurity,
    daily: net / 260,
    monthly: net / 12,
    trinnBreakdown,
  };
}
