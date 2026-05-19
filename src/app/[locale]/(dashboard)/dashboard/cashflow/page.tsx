import { computeCashFlowBase } from '@/agents/tools/cashflow-compute';
import { CashFlowClient } from './CashFlowClient';
import type { CashFlowForecast } from '@/agents/schemas';
import { RealModeGate } from '@/components/RealModeGate';

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

  return (
    <RealModeGate
      feature={locale === 'tr' ? 'Nakit Akışı' : 'Cash Flow'}
      platforms={['Shopify']}
    >
      <CashFlowClient initial={initial} locale={locale} />
    </RealModeGate>
  );
}
