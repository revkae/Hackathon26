import { createClient } from '@/lib/supabase/server';
import { ReviewsClient } from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // SSR loads only the raw review list — fast SQL, no LLM in the critical path.
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, language, channel, posted_at')
    .order('posted_at', { ascending: false })
    .limit(30);

  return (
    <ReviewsClient
      locale={locale}
      reviews={(reviews ?? []).map(r => ({
        id: r.id,
        rating: r.rating ?? 0,
        body: r.body,
        language: r.language,
        channel: r.channel,
        postedAt: r.posted_at,
      }))}
    />
  );
}
