'use client';
import { useState, useTransition, useRef, useEffect, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { notifications } from '@mantine/notifications';
import { IconArrowUp, IconAnchor, IconMicrophone, IconSparkles } from '@tabler/icons-react';
import { AgentChip } from './AgentChip';
import { StatusIcon } from './StatusIcon';
import { useVoiceInput } from './landing/useVoiceInput';
import type { CaptainBrief } from '@/agents/schemas';

interface Message {
  role: 'user' | 'captain';
  text: string;
  brief?: CaptainBrief;
}

const SUGGESTIONS = [
  'Vazo X için Instagram lansman planı çıkar',
  'Son 7 günde olumsuz yorum alan ürünleri listele',
  'Rakip fiyatlarını analiz et',
  '60 günlük nakit projeksiyonu göster',
];

export function ChatPanel({ locale }: { locale: string }) {
  const t = useTranslations('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Web Speech API
  const voice = useVoiceInput({
    lang: locale === 'tr' ? 'tr-TR' : 'en-US',
    onFinalTranscript: (chunk) => {
      setInput((prev) => (prev ? `${prev} ${chunk}`.trim() : chunk));
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  async function send(query?: string) {
    const q = (query ?? input).trim();
    if (!q) return;
    const userMsg: Message = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    startTransition(async () => {
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, locale }),
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

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const showEmpty = messages.length === 0 && !pending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Scrollable message stream */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: showEmpty ? 0 : '24px 28px',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          // When empty: center children vertically.  When messages exist:
          // top-aligned scrolling stream.
          justifyContent: showEmpty ? 'center' : 'flex-start',
        }}
      >
        {showEmpty && (
          <EmptyState onSuggest={(q) => send(q)} locale={locale} />
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {pending && <ThinkingIndicator />}
      </div>

      {/* Input footer — same chat-mock aesthetic. Centered horizontally
          so the composer sits under the empty-state suggestions on wide
          panes instead of left-aligning against the conversation gutter. */}
      <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
        <form
          className="chat-mock"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            className="chat-textarea"
            placeholder={t('placeholder')}
            value={voice.listening && voice.transcript ? `${input} ${voice.transcript}`.trim() : input}
            onChange={handleChange}
            onKeyDown={handleKey}
            autoComplete="off"
          />
          <div className="chat-mock-row">
            <span className="chat-pill">
              <IconSparkles size={12} stroke={2.2} />
              Kaptan Modu
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className={`chat-send${voice.listening ? ' is-active' : ''}`}
                style={{ width: 32, height: 32 }}
                aria-label={voice.listening ? 'Kaydı durdur' : 'Sesli komut'}
                aria-pressed={voice.listening}
                title={
                  !voice.supported
                    ? 'Tarayıcı sesli komutu desteklemiyor'
                    : voice.listening
                    ? 'Kaydı durdur'
                    : 'Sesli komut'
                }
                disabled={!voice.supported}
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
              >
                <IconMicrophone size={15} stroke={2.2} />
              </button>
              <button
                type="submit"
                className="chat-send is-primary"
                aria-label="Gönder"
                title="Gönder"
                disabled={pending || !input.trim()}
              >
                <IconArrowUp size={17} stroke={2.4} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onSuggest, locale }: { onSuggest: (q: string) => void; locale: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        width: '100%',
      }}
    >
      <span className="brand-mark" style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 20 }}>
        <IconAnchor size={28} stroke={2} />
      </span>
      <h2
        className="landing-display"
        style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: 0 }}
      >
        <em>{locale === 'tr' ? 'Kaptan' : 'The Captain'}</em>{' '}
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {locale === 'tr' ? 'hazır.' : 'is ready.'}
        </span>
      </h2>
      <p style={{ marginTop: 14, maxWidth: 460, fontSize: 14.5, lineHeight: 1.6, color: 'var(--fg-mute)' }}>
        {locale === 'tr'
          ? 'İstediğini doğal dilde yaz. Doğru uzmanları çağırırım.'
          : 'Tell me in plain language. I\'ll dispatch the right specialists.'}
      </p>
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          maxWidth: 500,
        }}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggest(s)}
            className="chat-suggestion"
          >
            <IconSparkles size={13} stroke={2.2} style={{ color: 'var(--c-emerald)' }} />
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div className="chat-bubble-user">{message.text}</div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <AgentChip agent="captain" />
      </div>
      <div className="chat-bubble-captain">
        <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
        {message.brief?.items && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {message.brief.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: 2, lineHeight: 0 }}>
                  <StatusIcon status={item.status} size={14} />
                </div>
                <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg)' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <AgentChip agent="captain" />
      <div className="thinking-dots">
        <span /><span /><span />
      </div>
      <span style={{ fontSize: 13.5, color: 'var(--fg-mute)' }}>
        Ajanlar düşünüyor…
      </span>
    </div>
  );
}
