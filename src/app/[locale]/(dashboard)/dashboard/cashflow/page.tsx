import { Stack } from '@mantine/core';
import { computeCashFlowBase } from '@/agents/tools/cashflow-compute';
import { CashFlowClient } from './CashFlowClient';
import type { CashFlowForecast } from '@/agents/schemas';
import { RealModeGate } from '@/components/RealModeGate';
import { SourceErrorBanner } from '@/components/SourceErrorBanner';
import { createClient } from '@/lib/supabase/server';
import { getAppMode } from '@/lib/app-mode';
import { getShopifyConnection } from '@/lib/store-connections';
import { fetchShopifyOrders } from '@/lib/shopify';
import { mapShopifyOrdersToSales } from '@/lib/shopify-map';

export const dynamic = 'force-dynamic';

export default async function CashFlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const mode = await getAppMode(supabase);

  let salesHistory: { date: string; revenue: number }[] | undefined;
  let sourceError = false;

  const shopify = mode === 'real' ? await getShopifyConnection(supabase) : null;
  if (shopify) {
    try {
      const orders = await fetchShopifyOrders({ ...shopify, sinceDays: 90 });
      salesHistory = mapShopifyOrdersToSales(orders);
    } catch {
      sourceError = true;
    }
  }

  // Fast SSR: deterministic projection only (no LLM). When salesHistory is
  // undefined (mock mode / no connection / failed fetch) computeCashFlowBase
  // falls back to seeded Supabase sales.
  const base = await computeCashFlowBase({ scenario: 'current', days: 90, salesHistory });
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
      <Stack gap="md">
        {sourceError && <SourceErrorBanner locale={locale} />}
        <CashFlowClient initial={initial} locale={locale} />
      </Stack>
    </RealModeGate>
  );
}
