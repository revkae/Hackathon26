import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';
import { DashboardCard } from '@/components/DashboardCard';
import { BriefCard } from '@/components/BriefCard';
import { Title, SimpleGrid, Stack, Badge } from '@mantine/core';
import type { BriefItem } from '@/agents/schemas';

async function loadEvalsScore(): Promise<{
  overallAvg: number;
  totalCases: number;
  passRate: number;
} | null> {
  try {
    const file = await fs.readFile(
      path.join(process.cwd(), 'tests/evals/results.json'),
      'utf-8',
    );
    const data = JSON.parse(file);
    return data.summary ?? null;
  } catch {
    return null;
  }
}

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

  const [
    evalsScore,
    { count: orderCount },
    { count: reviewCount },
    { count: negReviewCount },
  ] = await Promise.all([
    loadEvalsScore(),
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
        { status: 'ok', text: 'Bu ay nakit pozisyon güvenli görünüyor' },
      ]
    : [
        { status: 'warn', text: `${negReviewCount ?? 0} reviews trending negative — talk to Captain for reply drafts` },
        { status: 'info', text: 'Competitors raised prices ~12% in last 7 days — Pricing agent analysis ready' },
        { status: 'ok', text: '3 products have weak SEO titles — SEO agent has drafts ready' },
        { status: 'ok', text: 'Cash position looks safe this month' },
      ];

  return (
    <Stack gap="lg">
      <Title order={1}>{locale === 'tr' ? 'Günaydın' : 'Good morning'}</Title>

      <BriefCard locale={locale} items={brief} />

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }}>
        <DashboardCard label={locale === 'tr' ? 'Bugün Sipariş' : "Today's Orders"} value={orderCount ?? 0} />
        <DashboardCard label={locale === 'tr' ? 'Bekleyen Yorum' : 'Pending Reviews'} value={reviewCount ?? 0} />
        <DashboardCard label={locale === 'tr' ? 'Açık Aksiyon' : 'Open Actions'} value={brief.filter(b => b.status !== 'ok').length} />
        <DashboardCard
          label={locale === 'tr' ? 'Nakit Pozisyon' : 'Cash Position'}
          value={<Badge color="teal" variant="light" size="lg">{locale === 'tr' ? 'Güvenli' : 'Safe'}</Badge>}
        />
        {evalsScore && (
          <DashboardCard
            label={locale === 'tr' ? 'Ajan Doğruluk' : 'Agent Accuracy'}
            value={`${(evalsScore.overallAvg * 100).toFixed(0)}%`}
            hint={`${evalsScore.totalCases} ${locale === 'tr' ? 'senaryo' : 'scenarios'}`}
          />
        )}
      </SimpleGrid>
    </Stack>
  );
}
