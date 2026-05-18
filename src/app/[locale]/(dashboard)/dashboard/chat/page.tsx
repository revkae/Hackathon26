import { ChatPanel } from '@/components/ChatPanel';
import { A2AGraph } from '@/components/A2AGraph';
import { IconRoute2 } from '@tabler/icons-react';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div
      className="chat-page"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.1fr) minmax(280px, 1fr)',
        gap: 20,
        height: 'calc(100vh - 8rem)',
        margin: '-1rem -0.5rem',
      }}
    >
      {/* Conversation pane */}
      <section
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span className="brand-mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 14, color: 'white' }}>K</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
            {locale === 'tr' ? 'Kaptan ile Sohbet' : 'Chat with the Captain'}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatPanel locale={locale} />
        </div>
      </section>

      {/* Live trace pane */}
      <aside
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 20,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'color-mix(in srgb, var(--c-emerald) 12%, transparent)',
              color: 'var(--c-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
            }}
          >
            <IconRoute2 size={15} stroke={2} />
          </span>
          <span className="section-eyebrow" style={{ margin: 0, color: 'var(--c-amber)' }}>
            {locale === 'tr' ? 'Canlı Trace' : 'Live Trace'}
          </span>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-mute)', margin: 0 }}>
          {locale === 'tr'
            ? 'Sorunu gönder, Kaptan\'ın hangi uzmanları çağırdığı ve neyi sorduğu burada adım adım görünür.'
            : "Send a query — you'll see which specialists the Captain calls and what it asks, step by step."}
        </p>

        <div className="soft-divider" style={{ margin: '18px 0 8px' }} />

        <A2AGraph locale={locale} />
      </aside>
    </div>
  );
}
