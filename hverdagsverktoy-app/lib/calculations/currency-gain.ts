/**
 * Currency gain/loss calculator
 * Exact port of calcValgevinst() from the web version.
 */

export interface CurrencyGainResult {
  costNok: number;
  saleNok: number;
  gain: number;
  tax: number;       // 22% on gains
  netAfterTax: number;
  isGain: boolean;
}

export function calcCurrencyGain(
  units: number,
  buyRate: number,    // NOK per unit at purchase
  sellRate: number    // NOK per unit at sale
): CurrencyGainResult | null {
  if (units <= 0 || buyRate <= 0 || sellRate <= 0) return null;

  const costNok = units * buyRate;
  const saleNok = units * sellRate;
  const gain = saleNok - costNok;
  const tax = gain > 0 ? gain * 0.22 : 0;
  const netAfterTax = gain - tax;

  return {
    costNok,
    saleNok,
    gain,
    tax,
    netAfterTax,
    isGain: gain >= 0,
  };
}
