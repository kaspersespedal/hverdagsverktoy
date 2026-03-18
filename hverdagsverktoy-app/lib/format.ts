/**
 * Format a number as Norwegian currency string (space-separated thousands, comma decimal).
 * e.g. 1234567.89 => "1 234 568 kr"
 */
export function fmt(n: number, decimals: number = 0): string {
  if (isNaN(n) || !isFinite(n)) return '0 kr';
  const rounded = Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const parts = rounded.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const formatted = decimals > 0 ? parts.join(',') : parts[0];
  return formatted + ' kr';
}

/**
 * Format a number without currency suffix.
 */
export function fmtNum(n: number, decimals: number = 0): string {
  if (isNaN(n) || !isFinite(n)) return '0';
  const rounded = Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const parts = rounded.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimals > 0 ? parts.join(',') : parts[0];
}

/**
 * Format a percentage.
 */
export function pct(n: number, decimals: number = 1): string {
  if (isNaN(n) || !isFinite(n)) return '0 %';
  return n.toFixed(decimals).replace('.', ',') + ' %';
}

/**
 * Parse a formatted number string back to a number.
 * Handles spaces, commas, "kr" suffix, etc.
 */
export function parseNum(val: string): number {
  if (!val) return 0;
  const cleaned = val
    .replace(/\s/g, '')
    .replace(/kr/gi, '')
    .replace(/%/g, '')
    .replace(/,/g, '.')
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
