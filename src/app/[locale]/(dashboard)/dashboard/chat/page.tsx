import { ChatPanel } from '@/components/ChatPanel';
import { ChatList } from '@/components/chat/ChatList';
import { A2AGraph } from '@/components/A2AGraph';
import { IconRoute2 } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import { getAppMode } from '@/lib/app-mode';
import { getShopifyConnection } from '@/lib/store-connections';
import { fetchShopifyProducts } from '@/lib/shopify';

// Re-runs on every visit so the suggestion chips are fresh each time.
export const dynamic = 'force-dynamic';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Live Shopify catalog in real mode, seeded products otherwise — names only.
async function loadProductNames(): Promise<string[]> {
  const supabase = await createClient();
  const mode = await getAppMode(supabase);
  const shopify = mode === 'real' ? await getShopifyConnection(supabase) : null;
  if (shopify) {
    try {
      const products = await fetchShopifyProducts(shopify);
      const names = products.map((p) => p.title).filter(Boolean);
      if (names.length) return names;
    } catch {
      /* fall through to seeded products */
    }
  }
  const { data } = await supabase.from('products').select('name').limit(30);
  return (data ?? []).map((p) => p.name as string).filter(Boolean);
}

// Builds 4 starter prompts — mostly tied to real products, one general —
// reshuffled on every call so the Captain greets you differently each visit.
function buildSuggestions(productNames: string[], locale: string): string[] {
  const isTr = locale === 'tr';
  const pool = shuffle(productNames);
  let cursor = 0;
  const nextProduct = () =>
    pool.length > 0
      ? pool[cursor++ % pool.length]
      : isTr ? 'ürünlerinden biri' : 'one of your products';

  const productTemplates: Array<(p: string) => string> = isTr
    ? [
        (p) => `${p} için Instagram lansman planı çıkar`,
        (p) => `${p} için rakip fiyatlarını analiz et`,
        (p) => `${p} için daha güçlü bir SEO başlığı yaz`,
        (p) => `${p} için ideal satış fiyatını öner`,
        (p) => `${p} ürününün son yorumlarını özetle`,
      ]
    : [
        (p) => `Draft an Instagram launch plan for ${p}`,
        (p) => `Analyze competitor prices for ${p}`,
        (p) => `Write a stronger SEO title for ${p}`,
        (p) => `Suggest an ideal selling price for ${p}`,
        (p) => `Summarize the latest reviews for ${p}`,
      ];

  const generalTemplates: string[] = isTr
    ? [
        'Son 7 günde olumsuz yorum alan ürünleri listele',
        '60 günlük nakit projeksiyonu göster',
        'Bu hafta hangi ürüne odaklanmalıyım?',
      ]
    : [
        'List products with negative reviews in the last 7 days',
        'Show me a 60-day cash projection',
        'Which product should I focus on this week?',
      ];

  const productPicks = shuffle(productTemplates)
    .slice(0, 3)
    .map((t) => t(nextProduct()));
  const generalPick = shuffle(generalTemplates).slice(0, 1);

  return shuffle([...productPicks, ...generalPick]);
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const productNames = await loadProductNames();
  const suggestions = buildSuggestions(productNames, locale);

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
      <ChatList />

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
            {locale === 'tr' ? 'Kaptan ile Sohbet' : 'Chat with the Captain'}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatPanel locale={locale} suggestions={suggestions} />
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
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-mute)', margin: 0 }}>
          {locale === 'tr'
            ? "Sorunu gönder, Kaptan'ın hangi uzmanları çağırdığı ve neyi sorduğu burada adım adım görünür."
            : "Send a query — you'll see which specialists the Captain calls and what it asks, step by step."}
        </p>
        <div className="soft-divider" style={{ margin: '18px 0 8px' }} />
        <A2AGraph locale={locale} />
      </aside>
    </div>
  );
}
