// ---------------------------------------------------------------------------
// Pure math utilities (zero external dependencies — safe to unit-test)
// ---------------------------------------------------------------------------

export function movingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-Math.min(window, values.length));
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

interface ProjectInput {
  currentBalance: number;
  dailyAvgRevenue: number;
  dailyAvgExpense: number;
  days: number;
}

export function projectCashFlow({ currentBalance, dailyAvgRevenue, dailyAvgExpense, days }: ProjectInput) {
  const dailyNet = dailyAvgRevenue - dailyAvgExpense;
  const result: { date: string; balance: number }[] = [];
  const startDate = Date.now();
  for (let d = 1; d <= days; d++) {
    const balance = currentBalance + dailyNet * d;
    const date = new Date(startDate + d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    result.push({ date, balance: Math.round(balance * 100) / 100 });
  }
  return result;
}
