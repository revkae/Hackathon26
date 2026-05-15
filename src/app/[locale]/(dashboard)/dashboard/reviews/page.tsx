import { createClient } from '@/lib/supabase/server';
import { ReviewItem } from '@/components/ReviewItem';
import { reviewsAgent } from '@/agents/reviews';
import { Title, Stack, Card, Text, SimpleGrid, Paper, Group, Badge } from '@mantine/core';

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
    <Stack gap="lg">
      <Title order={1}>Yorumlar</Title>

      {analysis && (
        <Card>
          <Text fw={600} size="lg" mb="md">Genel Duygu</Text>
          <SimpleGrid cols={3} mb="lg">
            <Paper
              p="md"
              ta="center"
              style={{ background: 'var(--mantine-color-shopifyGreen-0)' }}
            >
              <Text fz="2xl" fw={700} c="shopifyGreen">{analysis.sentiment.positive}</Text>
              <Text size="xs" c="dimmed">Olumlu</Text>
            </Paper>
            <Paper p="md" ta="center">
              <Text fz="2xl" fw={700}>{analysis.sentiment.neutral}</Text>
              <Text size="xs" c="dimmed">Nötr</Text>
            </Paper>
            <Paper
              p="md"
              ta="center"
              style={{ background: 'var(--mantine-color-red-0)' }}
            >
              <Text fz="2xl" fw={700} c="red">{analysis.sentiment.negative}</Text>
              <Text size="xs" c="dimmed">Olumsuz</Text>
            </Paper>
          </SimpleGrid>
          <div>
            <Text size="sm" fw={500} mb="xs">Öne Çıkan Temalar</Text>
            <Group gap="xs" wrap="wrap">
              {analysis.topThemes.slice(0, 5).map(t => (
                <Badge key={t.theme} variant="light" color="gray">
                  {t.theme} ({t.count})
                </Badge>
              ))}
            </Group>
          </div>
        </Card>
      )}

      <Stack gap="sm">
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
      </Stack>
    </Stack>
  );
}
