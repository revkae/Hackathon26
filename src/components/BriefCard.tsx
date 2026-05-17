import { Card, Text, Title, Badge, Group, Stack, Button } from '@mantine/core';
import Link from 'next/link';
import { StatusIcon } from './StatusIcon';
import type { BriefItem } from '@/agents/schemas';

export function BriefCard({
  locale,
  items,
}: {
  locale: string;
  items: BriefItem[];
}) {
  return (
    <Card>
      <Group justify="space-between" mb="md">
        <Title order={2} size="h5">Günün Brief&apos;i</Title>
        <Badge variant="outline">5 ajan</Badge>
      </Group>
      <Stack gap="xs">
        {items.map((item, i) => (
          <Group key={i} align="flex-start" gap="xs" wrap="nowrap">
            <div style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>
              <StatusIcon status={item.status} size={16} />
            </div>
            <Text size="sm">{item.text}</Text>
          </Group>
        ))}
      </Stack>
      <Group gap="sm" mt="lg">
        <Button component={Link} href={`/${locale}/dashboard/chat`}>
          Kaptanla Konuş →
        </Button>
        <Button variant="default">Detayları Gör</Button>
      </Group>
    </Card>
  );
}
