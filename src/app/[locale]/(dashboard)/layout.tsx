import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { AppModeProvider } from '@/components/AppModeProvider';
import {
  StoreConnectionsProvider,
  type MarketplaceConnMap,
} from '@/components/StoreConnectionsProvider';
import { getAppMode } from '@/lib/app-mode';
import { getStoreConnections } from '@/lib/store-connections';
import type { MarketplaceId } from '@/lib/connections';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [profileResult, mode, storeConns] = await Promise.all([
    supabase
      .from('profiles')
      .select('business_name, preferred_language')
      .eq('id', user.id)
      .single(),
    getAppMode(supabase),
    getStoreConnections(supabase),
  ]);

  const marketplaces: MarketplaceConnMap = {};
  for (const c of storeConns) {
    marketplaces[c.platform as MarketplaceId] = {
      domain: c.domain,
      storeName: c.storeName,
    };
  }

  return (
    <AppModeProvider initialMode={mode}>
      <StoreConnectionsProvider initial={marketplaces}>
        <DashboardShell
          locale={locale}
          businessName={profileResult.data?.business_name ?? 'KOBİ Sahibi'}
        >
          {children}
        </DashboardShell>
      </StoreConnectionsProvider>
    </AppModeProvider>
  );
}
