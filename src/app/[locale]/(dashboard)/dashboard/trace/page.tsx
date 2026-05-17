import { createClient } from '@/lib/supabase/server';
import { Title, Stack, Card, Text, Group, Divider, ThemeIcon, Paper } from '@mantine/core';
import { IconRoute2, IconClock, IconQuote, IconArrowRight, IconMessage2 } from '@tabler/icons-react';
import { StatusIcon } from '@/components/StatusIcon';
import type { CaptainBrief } from '@/agents/schemas';

export const dynamic = 'force-dynamic';

export default async function TracePage() {
  const supabase = await createClient();
  const { data: traces } = await supabase
    .from('agent_traces')
    .select('id, query, trace_json, duration_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const rows = traces ?? [];

  return (
    <Stack gap="lg">
      <Group gap="sm">
        <ThemeIcon variant="light" size="lg" radius="md">
          <IconRoute2 size={20} />
        </ThemeIcon>
        <Title order={1}>Ajan İzi</Title>
      </Group>

      {rows.length === 0 && (
        <Card>
          <Stack align="center" gap="xs" py="xl">
            <ThemeIcon variant="light" color="gray" size={56} radius="xl">
              <IconRoute2 size={30} />
            </ThemeIcon>
            <Text fw={600}>Henüz ajan çalışması yok</Text>
            <Text c="dimmed" size="sm" ta="center" maw={360}>
              Kaptan sekmesinde bir soru sor — ajan zinciri ve sonuçları burada görselleşecek.
            </Text>
          </Stack>
        </Card>
      )}

      {rows.map(trace => {
        const brief = (trace.trace_json ?? {}) as unknown as Partial<CaptainBrief>;
        const items = brief.items ?? [];
        return (
          <Card key={trace.id}>
            <Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <ThemeIcon variant="light" color="gray" size="md" radius="md">
                  <IconQuote size={14} />
                </ThemeIcon>
                <Text fw={600} lineClamp={1}>{trace.query}</Text>
              </Group>
              <Group gap={6} wrap="nowrap" c="dimmed" style={{ flexShrink: 0 }}>
                <IconClock size={14} />
                <Text size="xs">{trace.duration_ms}ms</Text>
                <Text size="xs">·</Text>
                <Text size="xs">{new Date(trace.created_at).toLocaleString('tr-TR')}</Text>
              </Group>
            </Group>

            <Divider my="md" />

            {brief.greeting && (
              <Group gap="xs" align="flex-start" wrap="nowrap" mb="sm">
                <ThemeIcon variant="light" color="teal" size="md" radius="xl">
                  <IconMessage2 size={14} />
                </ThemeIcon>
                <Text size="sm">{brief.greeting}</Text>
              </Group>
            )}

            {items.length > 0 && (
              <Stack gap={8}>
                {items.map((item, i) => (
                  <Group key={i} gap="xs" align="flex-start" wrap="nowrap">
                    <div style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>
                      <StatusIcon status={item.status} size={16} />
                    </div>
                    <Text size="sm">{item.text}</Text>
                  </Group>
                ))}
              </Stack>
            )}

            {brief.topPriority && (
              <Paper mt="md" p="sm" radius="sm" withBorder bg="var(--mantine-color-default-hover)">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon color="shopifyGreen" size="md" radius="xl">
                    <IconArrowRight size={14} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">Öncelik</Text>
                    <Text size="sm" fw={500}>{brief.topPriority}</Text>
                  </div>
                </Group>
              </Paper>
            )}
          </Card>
        );
      })}
    </Stack>
  );
}
