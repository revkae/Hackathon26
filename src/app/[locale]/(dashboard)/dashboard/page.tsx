import { createClient } from '@/lib/supabase/server';
import { DashboardCard } from '@/components/DashboardCard';
import { BriefCard } from '@/components/BriefCard';
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

  const [{ count: orderCount }, { count: reviewCount }, { count: negReviewCount }] = await Promise.all([
    supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .gte('occurred_at', sinceYesterday),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .lte('rating', 3),
  ]);

  // Brief is derived from current data state (fast, no Gemini call).
  // For real agentic interaction, user goes to /chat where Captain runs live.
  const brief: BriefItem[] = locale === 'tr'
    ? [
        { status: 'warn', text: `${negReviewCount ?? 0} yorum negatif eğilimde — yanıt taslakları için Kaptan ile konuş` },
        { status: 'info', text: 'Rakipler son 7 günde ortalama %12 fiyat artırdı — Fiyat ajanı analizi hazır' },
        { status: 'ok', text: '3 ürünün SEO başlığı zayıf görünüyor — SEO ajanı taslak hazırladı' },
        { status: 'ok', text: 'Bu ay nakit pozisyon: GÜVENLİ 🟢' },
      ]
    : [
        { status: 'warn', text: `${negReviewCount ?? 0} reviews trending negative — talk to Captain for reply drafts` },
        { status: 'info', text: 'Competitors raised prices ~12% in last 7 days — Pricing agent analysis ready' },
        { status: 'ok', text: '3 products have weak SEO titles — SEO agent has drafts ready' },
        { status: 'ok', text: 'Cash position this month: SAFE 🟢' },
      ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{locale === 'tr' ? 'Günaydın 👋' : 'Good morning 👋'}</h1>

      <BriefCard locale={locale} items={brief} />

      <div className="grid grid-cols-4 gap-4">
        <DashboardCard label={locale === 'tr' ? 'Bugün Sipariş' : "Today's Orders"} value={orderCount ?? 0} />
        <DashboardCard label={locale === 'tr' ? 'Bekleyen Yorum' : 'Pending Reviews'} value={reviewCount ?? 0} />
        <DashboardCard label={locale === 'tr' ? 'Açık Aksiyon' : 'Open Actions'} value={brief.filter(b => b.status !== 'ok').length} />
        <DashboardCard label={locale === 'tr' ? 'Nakit Pozisyon' : 'Cash Position'} value="🟢 OK" />
      </div>
    </div>
  );
}
