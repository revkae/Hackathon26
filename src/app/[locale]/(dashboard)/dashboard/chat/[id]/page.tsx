import { redirect, notFound } from 'next/navigation';
import { ChatPanel, type InitialMessage } from '@/components/ChatPanel';
import { ChatList } from '@/components/chat/ChatList';
import { A2AGraph } from '@/components/A2AGraph';
import { createClient } from '@/lib/supabase/server';
import { IconRoute2 } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function ChatByIdPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: convo } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('id', id)
    .single();
  if (!convo) notFound();

  const { data: rows } = await supabase
    .from('messages')
    .select('role, text, brief_json')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  const initial: InitialMessage[] = (rows ?? []).map((r) => ({
    role: r.role as 'user' | 'captain',
    text: r.text,
    brief: (r.brief_json as InitialMessage['brief']) ?? undefined,
  }));

  return (
    <div
      className="chat-page"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px minmax(0, 2.1fr) minmax(280px, 1fr)',
        gap: 20,
        height: 'calc(100vh - 8rem)',
        margin: '-1rem -0.5rem',
      }}
    >
      <ChatList activeId={id} />

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
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="brand-mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 14, color: 'white' }}>K</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
            {convo.title}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatPanel locale={locale} conversationId={id} initialMessages={initial} />
        </div>
      </section>

      <aside
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 20,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'color-mix(in srgb, var(--c-emerald) 12%, transparent)',
              color: 'var(--c-emerald)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)',
            }}
          >
            <IconRoute2 size={15} stroke={2} />
          </span>
          <span className="section-eyebrow" style={{ margin: 0, color: 'var(--c-amber)' }}>
            {locale === 'tr' ? 'Canlı Trace' : 'Live Trace'}
          </span>
        </div>
        <A2AGraph locale={locale} />
      </aside>
    </div>
  );
}
