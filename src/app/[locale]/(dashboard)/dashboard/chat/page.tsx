import { ChatPanel } from '@/components/ChatPanel';
import { Title, Text } from '@mantine/core';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 8rem)', margin: '-2rem', overflow: 'hidden' }}>
      <div
        style={{
          flex: '0 0 67%',
          borderRight: '1px solid var(--mantine-color-default-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--mantine-color-default-border)',
            flexShrink: 0,
          }}
        >
          <Title order={1} fz="lg">Kaptan ile Sohbet</Title>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <ChatPanel locale={locale} />
        </div>
      </div>
      <div style={{ flex: '0 0 33%', padding: '1rem' }}>
        <Text fw={600} size="xs" tt="uppercase" c="dimmed" mb="xs">
          Canlı Trace
        </Text>
        <Text size="sm" c="dimmed">
          Sorunu gönder, ajan zinciri burada görünür.
        </Text>
      </div>
    </div>
  );
}
