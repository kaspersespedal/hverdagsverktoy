/**
 * VAT calculator — exact port of calcVat() and calcAdj()
 */

export interface VatResult {
  inclusive: number;
  exclusive: number;
  vatAmount: number;
  rate: number;
  inputType: 'ex' | 'inc';
}

export function calcVat(
  amount: number,
  vatRatePercent: number, // e.g. 25
  inputType: 'ex' | 'inc'
): VatResult | null {
  if (amount <= 0) return null;

  const s = vatRatePercent / 100;
  let ex: number, vt: number, inc: number;

  if (inputType === 'ex') {
    ex = amount;
    vt = ex * s;
    inc = ex + vt;
  } else {
    inc = amount;
    ex = inc / (1 + s);
    vt = inc - ex;
  }

  return {
    inclusive: inc,
    exclusive: ex,
    vatAmount: vt,
    rate: vatRatePercent,
    inputType,
  };
}

export interface AdjResult {
  status: 'under' | 'expired' | 'bagatell' | 'repay' | 'increase';
  adjustmentAmount: number;
  annualBase: number;
  annualAdjustment: number;
  remainingYears: number;
  shareChange: number;
  threshold: number;
  period: number;
}

export function calcAdjustment(
  assetType: 'eiendom' | 'maskin',
  totalMva: number,
  yearsUsed: number,
  oldShare: number,  // 0-100
  newShare: number   // 0-100
): AdjResult | null {
  if (totalMva <= 0) return null;

  const period = assetType === 'eiendom' ? 10 : 5;
  const threshold = assetType === 'eiendom' ? 100000 : 50000;

  const gammelAndel = oldShare / 100;
  const nyAndel = newShare / 100;

  if (totalMva < threshold) {
    return {
      status: 'under',
      adjustmentAmount: 0,
      annualBase: 0,
      annualAdjustment: 0,
      remainingYears: 0,
      shareChange: 0,
      threshold,
      period,
    };
  }

  if (yearsUsed >= period) {
    return {
      status: 'expired',
      adjustmentAmount: 0,
      annualBase: totalMva / period,
      annualAdjustment: 0,
      remainingYears: 0,
      shareChange: (nyAndel - gammelAndel) * 100,
      threshold,
      period,
    };
  }

  const endring = nyAndel - gammelAndel;
  if (Math.round(Math.abs(endring) * 100) < 10) {
    return {
      status: 'bagatell',
      adjustmentAmount: 0,
      annualBase: totalMva / period,
      annualAdjustment: 0,
      remainingYears: period - yearsUsed,
      shareChange: endring * 100,
      threshold,
      period,
    };
  }

  const gjenstaende = period - yearsUsed;
  const arligBeloep = totalMva / period;
  const justering = arligBeloep * endring * gjenstaende;
  const arligJustering = arligBeloep * Math.abs(endring);

  return {
    status: justering < 0 ? 'repay' : 'increase',
    adjustmentAmount: Math.abs(justering),
    annualBase: arligBeloep,
    annualAdjustment: arligJustering,
    remainingYears: gjenstaende,
    shareChange: endring * 100,
    threshold,
    period,
  };
}
