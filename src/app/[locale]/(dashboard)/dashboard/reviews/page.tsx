import { createClient } from '@/lib/supabase/server';
import { ReviewItem } from '@/components/ReviewItem';
import { reviewsAgent } from '@/agents/reviews';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, language, channel, posted_at')
    .order('posted_at', { ascending: false })
    .limit(30);

  let analysis;
  try {
    analysis = await reviewsAgent({ daysBack: 90, userLanguage: locale });
  } catch (e) {
    console.error('Reviews agent failed:', e);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yorumlar</h1>

      {analysis && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-4">Genel Duygu</h2>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-emerald-500/10 rounded p-3 text-center">
                <div className="text-2xl font-bold text-emerald-500">{analysis.sentiment.positive}</div>
                <div className="text-xs text-muted-foreground">Olumlu</div>
              </div>
              <div className="bg-muted rounded p-3 text-center">
                <div className="text-2xl font-bold">{analysis.sentiment.neutral}</div>
                <div className="text-xs text-muted-foreground">Nötr</div>
              </div>
              <div className="bg-red-500/10 rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-500">{analysis.sentiment.negative}</div>
                <div className="text-xs text-muted-foreground">Olumsuz</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Öne Çıkan Temalar</h3>
              <div className="flex gap-2 flex-wrap">
                {analysis.topThemes.slice(0, 5).map(t => (
                  <span key={t.theme} className="px-2 py-1 bg-muted rounded text-xs">
                    {t.theme} ({t.count})
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {(reviews ?? []).map(r => (
          <ReviewItem
            key={r.id}
            rating={r.rating ?? 0}
            body={r.body}
            language={r.language}
            channel={r.channel}
            postedAt={r.posted_at}
          />
        ))}
      </div>
    </div>
  );
}
