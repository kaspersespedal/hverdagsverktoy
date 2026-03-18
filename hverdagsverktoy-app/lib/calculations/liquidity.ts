/**
 * Liquidity budget calculator
 * Exact port of calcLikvid() from the web version.
 */

export interface LiquidityRow {
  month: number;
  startBalance: number;
  income: number;
  expense: number;
  endBalance: number;
}

export function calcLiquidity(
  startBalance: number,
  monthlyIncome: number,
  monthlyExpense: number,
  months: number = 6
): LiquidityRow[] {
  const rows: LiquidityRow[] = [];
  let balance = startBalance;

  for (let i = 1; i <= months; i++) {
    const endBal = balance + monthlyIncome - monthlyExpense;
    rows.push({
      month: i,
      startBalance: balance,
      income: monthlyIncome,
      expense: monthlyExpense,
      endBalance: endBal,
    });
    balance = endBal;
  }

  return rows;
}
