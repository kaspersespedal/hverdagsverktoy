/**
 * Depreciation calculator (declining balance method)
 * Exact port of calcAvs() from the web version.
 */

export interface DepreciationRow {
  year: number;
  startValue: number;
  depreciation: number;
  endValue: number;
}

export const DEPRECIATION_RATES: Record<string, number> = {
  a: 0.30,
  b: 0.20,
  c: 0.24,
  d: 0.20,
  e: 0.14,
  f: 0.12,
  g: 0.05,
  h: 0.04,
  i: 0.02,
  j: 0.10,
};

export function calcDepreciation(
  purchasePrice: number,
  rate: number,       // e.g. 0.30
  years: number = 10
): DepreciationRow[] {
  if (purchasePrice <= 0) return [];

  const rows: DepreciationRow[] = [];
  let remaining = purchasePrice;

  for (let i = 1; i <= years; i++) {
    const depr = remaining * rate;
    const newRemaining = remaining - depr;
    rows.push({
      year: i,
      startValue: remaining,
      depreciation: depr,
      endValue: newRemaining,
    });
    remaining = newRemaining;
  }

  return rows;
}
