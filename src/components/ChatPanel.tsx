'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { AgentChip } from './AgentChip';
import { Send } from 'lucide-react';
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
              setMessages(prev => [...prev, { role: 'captain', text: `Hata: ${event.message}` }]);
            }
          }
        }
      } catch (e) {
        setMessages(prev => [...prev, { role: 'captain', text: 'Bağlantı hatası' }]);
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {pending && <ThinkingIndicator />}
        </div>
      </ScrollArea>
      <div className="border-t p-4 flex gap-2">
        <Input
          placeholder={t('placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <Button onClick={send} disabled={pending || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-emerald-500/10 rounded-lg px-4 py-2 max-w-[80%]">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AgentChip agent="captain" />
      </div>
      <Card>
        <CardContent className="pt-4">
          <p className="whitespace-pre-wrap">{message.text}</p>
          {message.brief?.items && (
            <ul className="mt-3 space-y-1">
              {message.brief.items.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span>{item.status === 'critical' ? '🔴' : item.status === 'warn' ? '⚠' : item.status === 'ok' ? '✓' : 'ℹ'}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <AgentChip agent="captain" />
      <span className="animate-pulse">Ajanlar düşünüyor...</span>
    </div>
  );
}
