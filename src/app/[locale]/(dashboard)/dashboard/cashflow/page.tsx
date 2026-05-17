import { computeCashFlowBase } from '@/agents/tools/cashflow-compute';
import { CashFlowClient } from './CashFlowClient';
import type { CashFlowForecast } from '@/agents/schemas';

export const dynamic = 'force-dynamic';

export default async function CashFlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fast SSR: deterministic projection only (no LLM). The chart renders
  // instantly; the Gemini commentary is fetched client-side after mount.
  const base = await computeCashFlowBase({ scenario: 'current', days: 90 });
  const initial: CashFlowForecast = {
    scenario: base.scenario,
    days: base.days,
    projection: base.projection,
    riskScore: base.riskScore,
    commentary: '',
  };

  return <CashFlowClient initial={initial} locale={locale} />;
}
