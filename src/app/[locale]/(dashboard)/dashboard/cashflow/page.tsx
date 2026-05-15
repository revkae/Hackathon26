import { cashFlowAgent } from '@/agents/cashflow';
import { CashFlowClient } from './CashFlowClient';

export const dynamic = 'force-dynamic';

export default async function CashFlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const initial = await cashFlowAgent({ scenario: 'current', days: 90, userLanguage: locale });
  return <CashFlowClient initial={initial} locale={locale} />;
}
