import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
export { movingAverage, projectCashFlow } from './forecast-math';

// ---------------------------------------------------------------------------
// Supabase data helpers (lazy — only call inside a Genkit flow / server context)
// ---------------------------------------------------------------------------

export async function fetchSalesHistory(days: number): Promise<{ date: string; revenue: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('sales').select('total_revenue, occurred_at')
    .eq('profile_id', user.id)
    .gte('occurred_at', since);

  const byDay: Record<string, number> = {};
  for (const sale of data ?? []) {
    const day = sale.occurred_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + sale.total_revenue;
  }
  return Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchPendingExpenses(days: number): Promise<{ description: string; amount: number; category: string | null; dueAt: string }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('expenses').select('description, amount, category, due_at')
    .eq('profile_id', user.id)
    .eq('paid', false)
    .lte('due_at', until);
  return (data ?? []).map(e => ({
    description: e.description, amount: e.amount, category: e.category, dueAt: e.due_at,
  }));
}

// ---------------------------------------------------------------------------
// Genkit tool registrations (lazy factory — import ai at call site)
// ---------------------------------------------------------------------------

export function registerForecastTools(ai: { defineTool: Function }) {
  const getSalesHistoryTool = ai.defineTool(
    {
      name: 'getSalesHistory',
      description: 'Returns sales for the last N days.',
      inputSchema: z.object({ days: z.number().default(90) }),
      outputSchema: z.array(z.object({
        date: z.string(),
        revenue: z.number(),
      })),
    },
    async ({ days }: { days: number }) => fetchSalesHistory(days)
  );

  const getPendingExpensesTool = ai.defineTool(
    {
      name: 'getPendingExpenses',
      description: 'Returns upcoming unpaid expenses in next N days.',
      inputSchema: z.object({ days: z.number().default(90) }),
      outputSchema: z.array(z.object({
        description: z.string(),
        amount: z.number(),
        category: z.string().nullable(),
        dueAt: z.string(),
      })),
    },
    async ({ days }: { days: number }) => fetchPendingExpenses(days)
  );

  return { getSalesHistoryTool, getPendingExpensesTool };
}
