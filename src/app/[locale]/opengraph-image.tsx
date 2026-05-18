import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'KOBİ Kaptanı — Beş asistan, bir kaptan, sıfır endişe.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tr = locale === 'tr';
  const titleLead = tr ? 'Beş' : 'Five';
  const titleRest = tr ? ' asistan, bir kaptan,' : ' assistants, one captain,';
  const titleEnd = tr ? 'sıfır endişe.' : 'zero worries.';
  const sub = tr
    ? 'Çok kanallı satıcılar için altı yapay zeka uzmanı, tek panel.'
    : 'Six AI specialists for multi-channel sellers, one panel.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          fontFamily: 'system-ui, sans-serif',
          color: '#ECFDF5',
          backgroundColor: '#06120E',
          backgroundImage:
            'radial-gradient(circle at 22% 28%, rgba(0,196,106,0.65), transparent 55%),' +
            'radial-gradient(circle at 78% 60%, rgba(13,148,136,0.55), transparent 55%),' +
            'radial-gradient(circle at 50% 100%, rgba(245,158,11,0.45), transparent 55%)',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'linear-gradient(135deg, #F59E0B 0%, #00C46A 55%, #0D9488 100%)',
              color: 'white',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            ⚓
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em' }}>
            KOBİ Kaptanı
          </div>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              fontWeight: 600,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontStyle: 'italic',
                backgroundImage:
                  'linear-gradient(115deg, #F59E0B 0%, #4ADE80 50%, #14B8A6 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                marginRight: 16,
              }}
            >
              {titleLead}
            </span>
            <span>{titleRest}</span>
          </div>
          <div style={{ fontSize: 92, fontWeight: 600, letterSpacing: '-0.03em' }}>
            {titleEnd}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              color: 'rgba(236, 253, 245, 0.7)',
              lineHeight: 1.4,
              maxWidth: 880,
            }}
          >
            {sub}
          </div>
        </div>

        {/* Footer chips */}
        <div style={{ display: 'flex', gap: 12, fontSize: 16 }}>
          {['SEO', tr ? 'Pazarlama' : 'Marketing', tr ? 'Fiyat' : 'Pricing', tr ? 'Yorum' : 'Reviews', tr ? 'Nakit' : 'Cash Flow'].map(
            (chip, i) => (
              <div
                key={chip}
                style={{
                  padding: '8px 16px',
                  border: '1px solid rgba(236, 253, 245, 0.18)',
                  borderRadius: 999,
                  color: 'rgba(236, 253, 245, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background:
                      ['#14B8A6', '#F59E0B', '#00C46A', '#FB7185', '#84CC16'][i] ?? '#00C46A',
                  }}
                />
                {chip}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    size,
  );
}
