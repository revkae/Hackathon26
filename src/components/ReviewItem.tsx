import { Card, Text, Badge, Group, Rating } from '@mantine/core';

interface ReviewItemProps {
  rating: number;
  body: string;
  language?: string | null;
  channel: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  postedAt?: string | null;
}

export function ReviewItem({ rating, body, language, channel, sentiment, postedAt }: ReviewItemProps) {
  const sentimentColor =
    sentiment === 'positive' ? 'teal' :
    sentiment === 'negative' ? 'red' :
    'dimmed';

  return (
    <Card>
      <Group justify="space-between">
        <Rating value={rating} readOnly size="sm" />
        <Group gap={4}>
          {language && <Badge variant="outline" size="sm">{language.toUpperCase()}</Badge>}
          <Badge variant="light" size="sm">{channel}</Badge>
        </Group>
      </Group>
      <Text size="sm" c={sentimentColor} mt="xs">{body}</Text>
      {postedAt && (
        <Text size="xs" c="dimmed" mt={4}>{new Date(postedAt).toLocaleDateString()}</Text>
      )}
    </Card>
  );
}
