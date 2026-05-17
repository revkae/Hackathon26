'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  ScrollArea,
  TextInput,
  ActionIcon,
  Paper,
  Card,
  Stack,
  Group,
  Text,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { AgentChip } from './AgentChip';
import { StatusIcon } from './StatusIcon';
import type { CaptainBrief } from '@/agents/schemas';

interface Message {
  role: 'user' | 'captain';
  text: string;
  brief?: CaptainBrief;
}

export function ChatPanel({ locale }: { locale: string }) {
  const t = useTranslations('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, startTransition] = useTransition();

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput('');

    startTransition(async () => {
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, locale }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.type === 'final') {
              setMessages(prev => [
                ...prev,
                {
                  role: 'captain',
                  text: event.data.greeting + '\n\n' + (event.data.topPriority ?? ''),
                  brief: event.data,
                },
              ]);
            } else if (event.type === 'error') {
              notifications.show({ color: 'red', message: event.message });
            }
          }
        }
      } catch {
        notifications.show({ color: 'red', message: 'Bağlantı hatası' });
      }
    });
  }

  return (
    <Stack gap={0} style={{ height: '100%', overflow: 'hidden' }}>
      <ScrollArea style={{ flex: 1 }} p="md">
        <Stack gap="md" py="md">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {pending && <ThinkingIndicator />}
        </Stack>
      </ScrollArea>
      <Group
        gap="sm"
        p="md"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
      >
        <TextInput
          style={{ flex: 1 }}
          placeholder={t('placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <ActionIcon
          onClick={send}
          disabled={pending || !input.trim()}
          size="lg"
          aria-label="Gönder"
          color="shopifyGreen"
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <Group justify="flex-end">
        <Paper
          px="md"
          py="sm"
          style={{
            maxWidth: '80%',
            background: 'var(--mantine-color-shopifyGreen-0)',
          }}
        >
          <Text>{message.text}</Text>
        </Paper>
      </Group>
    );
  }
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <AgentChip agent="captain" />
      </Group>
      <Card>
        <Text className="whitespace-pre-wrap">{message.text}</Text>
        {message.brief?.items && (
          <Stack gap="xs" mt="sm">
            {message.brief.items.map((item, i) => (
              <Group key={i} gap="xs" align="flex-start" wrap="nowrap">
                <div style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>
                  <StatusIcon status={item.status} size={16} />
                </div>
                <Text size="sm">{item.text}</Text>
              </Group>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

function ThinkingIndicator() {
  return (
    <Group gap="sm">
      <AgentChip agent="captain" />
      <Loader size="xs" />
      <Text size="sm" c="dimmed">Ajanlar düşünüyor...</Text>
    </Group>
  );
}
