import { createClient } from '@/lib/supabase/server';
import { DashboardCard } from '@/components/DashboardCard';
import { BriefCard } from '@/components/BriefCard';
import { captainAgent } from '@/agents/captain';
import type { BriefItem } from '@/agents/schemas';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const sinceYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: orderCount } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .gte('occurred_at', sinceYesterday);

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  // Real captain brief
  let brief: BriefItem[];
  try {
    const captainResult = await captainAgent({
      query: locale === 'tr'
        ? 'Bu sabah için kısa brief: en kritik 4 madde, durum işaretlerini kullan (ok/warn/critical/info).'
        : 'Morning brief for today: top 4 critical items, with status flags (ok/warn/critical/info).',
      userLanguage: locale,
    });
    brief = captainResult.items.slice(0, 4);
  } catch (e) {
    console.error('Captain brief failed:', e);
    brief = [
      { status: 'info', text: 'Kaptan brief üretemedi, dashboard sınırlı modda' },
    ];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Günaydın 👋</h1>

      <BriefCard locale={locale} items={brief} />

      <div className="grid grid-cols-4 gap-4">
        <DashboardCard label="Bugün Sipariş" value={orderCount ?? 0} />
        <DashboardCard label="Bekleyen Yorum" value={reviewCount ?? 0} />
        <DashboardCard label="Açık Aksiyon" value={brief.filter(b => b.status !== 'ok').length} />
        <DashboardCard label="Nakit Pozisyon" value="🟢 OK" />
      </div>
    </div>
  );
}
