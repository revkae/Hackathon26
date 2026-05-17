import { createClient } from '@/lib/supabase/server';
import { fetchSalesHistory, fetchPendingExpenses, movingAverage, projectCashFlow } from './forecast';

export type Scenario = 'current' | 'discount15' | 'campaign';

export interface CashFlowBase {
  scenario: Scenario;
  days: number;
  projection: { date: string; balance: number }[];
  riskScore: 'green' | 'yellow' | 'red';
  currentBalance: number;
  adjustedRevenue: number;
  dailyAvgExpense: number;
  minBalance: number;
  projectedEnd: number;
}

// Deterministic cash-flow projection — no LLM call. Fast enough to run during
// SSR so the page (and chart) render instantly. The Gemini commentary is added
// separately by cashFlowAgent / fetched client-side.
export async function computeCashFlowBase(
  { scenario, days }: { scenario: Scenario; days: number },
): Promise<CashFlowBase> {
  const sales = await fetchSalesHistory(days);
  const expenses = await fetchPendingExpenses(days);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let currentBalance = 0;
  if (user) {
    const { data: salesAll } = await supabase
      .from('sales').select('total_revenue').eq('profile_id', user.id);
    currentBalance = (salesAll ?? []).reduce((s: number, r: { total_revenue: number }) => s + r.total_revenue, 0)
      - expenses.reduce((s, e) => s + e.amount, 0) * 0.3;
  }

  const dailyAvgRevenue = movingAverage(sales.map(s => s.revenue), 30);
  const dailyAvgExpense = expenses.reduce((s, e) => s + e.amount, 0) / days;

  let adjustedRevenue = dailyAvgRevenue;
  if (scenario === 'discount15') adjustedRevenue = dailyAvgRevenue * 1.05; // ~5% volume bump, 15% margin loss
  if (scenario === 'campaign') adjustedRevenue = dailyAvgRevenue * 1.25;

  const projection = projectCashFlow({
    currentBalance,
    dailyAvgRevenue: adjustedRevenue,
    dailyAvgExpense,
    days,
  });

  const minBalance = Math.min(...projection.map(p => p.balance));
  const riskScore: 'green' | 'yellow' | 'red' =
    minBalance < 0 ? 'red' :
    minBalance < currentBalance * 0.3 ? 'yellow' : 'green';

  return {
    scenario,
    days,
    projection,
    riskScore,
    currentBalance,
    adjustedRevenue,
    dailyAvgExpense,
    minBalance,
    projectedEnd: projection[projection.length - 1].balance,
  };
}
