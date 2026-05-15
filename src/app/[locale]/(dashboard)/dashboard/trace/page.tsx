import { createClient } from '@/lib/supabase/server';
import { Title, Stack, Card, Text, Code, Group } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default async function TracePage() {
  const supabase = await createClient();
  const { data: traces } = await supabase
    .from('agent_traces')
    .select('id, query, trace_json, duration_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <Stack gap="lg">
      <Title order={1}>🔬 Agent Trace</Title>
      {(traces ?? []).length === 0 && (
        <Text c="dimmed" size="sm">
          Henüz ajan çalışması yok. Kaptan sekmesinde bir soru sor, sonra buraya dön.
        </Text>
      )}
      {(traces ?? []).map(trace => (
        <Card key={trace.id}>
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed" fs="italic">"{trace.query}"</Text>
            <Text size="xs" c="dimmed">
              {trace.duration_ms}ms • {new Date(trace.created_at).toLocaleString('tr-TR')}
            </Text>
          </Group>
          <Code block mah={320} style={{ overflowX: 'auto' }}>
            {JSON.stringify(trace.trace_json, null, 2)}
          </Code>
        </Card>
      ))}
    </Stack>
  );
}
