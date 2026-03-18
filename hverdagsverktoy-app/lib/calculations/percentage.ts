/**
 * Percentage calculator — 3 modes
 */

export type PercentMode = 'xOfY' | 'xIsWhatOfY' | 'change';

export interface PercentResult {
  mode: PercentMode;
  result: number;
  label: string;
}

/**
 * Mode 1: What is X% of Y?
 */
export function percentOfAmount(percent: number, amount: number): number {
  return (percent / 100) * amount;
}

/**
 * Mode 2: X is what % of Y?
 */
export function whatPercentOf(x: number, y: number): number {
  if (y === 0) return 0;
  return (x / y) * 100;
}

/**
 * Mode 3: Percentage change from X to Y
 */
export function percentChange(start: number, end: number): number {
  if (start === 0) return 0;
  return ((end - start) / Math.abs(start)) * 100;
}
