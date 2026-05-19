'use client';

import { useState } from 'react';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';

// Shown when a real-mode page failed to reach Shopify and fell back to
// seeded data — so the seeded data is never mistaken for live data.
export function SourceErrorBanner({ locale }: { locale: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const isTr = locale === 'tr';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 12,
        background: 'color-mix(in srgb, var(--c-amber) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--c-amber) 35%, var(--border))',
        color: 'var(--fg)',
        fontSize: 13.5,
      }}
    >
      <IconAlertTriangle
        size={16}
        stroke={2}
        style={{ color: 'var(--c-amber)', flexShrink: 0 }}
      />
      <span style={{ flex: 1 }}>
        {isTr
          ? "Shopify'a ulaşılamadı — bağlantını kontrol et. Şimdilik örnek veri gösteriliyor."
          : 'Could not reach Shopify — check your connection. Showing seeded data for now.'}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={isTr ? 'Kapat' : 'Dismiss'}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--fg-mute)',
          cursor: 'pointer',
          display: 'inline-flex',
        }}
      >
        <IconX size={15} stroke={2.2} />
      </button>
    </div>
  );
}
