'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { IconLink, IconArrowRight } from '@tabler/icons-react';

export function ConnectionRequired({
  feature,
  platforms,
}: {
  feature: string;          // e.g. "Ürünler" / "Products"
  platforms?: string[];     // e.g. ["Shopify"] — informational only
}) {
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'tr';
  const isTr = locale === 'tr';

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '60px auto',
        padding: 28,
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 14,
      }}
    >
      <span
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'color-mix(in srgb, var(--c-amber) 14%, transparent)',
          color: 'var(--c-amber)',
          border: '1px solid var(--border)',
        }}
      >
        <IconLink size={18} stroke={2} />
      </span>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
        {isTr ? `${feature} için bir mağaza bağlamalısın` : `${feature} needs a connected store`}
      </h2>
      <p style={{ margin: 0, color: 'var(--fg-mute)', fontSize: 14, lineHeight: 1.55 }}>
        {isTr
          ? 'Gerçek modda bu sayfa için en az bir mağaza bağlı olmalı. Demo modunu da seçebilirsin — örnek veriyle çalışır.'
          : 'Real mode requires at least one connected store. You can switch to Demo mode to use seeded data.'}
        {platforms && platforms.length > 0 && (
          <>
            {' '}
            <strong style={{ color: 'var(--fg)' }}>
              {isTr ? 'Önerilen: ' : 'Recommended: '}
              {platforms.join(', ')}
            </strong>
          </>
        )}
      </p>
      <Link href={`/${locale}/dashboard/settings`} className="btn-primary btn-small">
        {isTr ? 'Ayarlara Git' : 'Open Settings'}
        <IconArrowRight size={13} stroke={2.4} />
      </Link>
    </div>
  );
}
