import Link from 'next/link';
import { IconAnchor, IconArrowRight } from '@tabler/icons-react';

export default function NotFound() {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased">
        <div
          className="landing-root"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="hero-blob" />
          <div className="noise-overlay" />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              padding: '32px 24px',
              maxWidth: 560,
            }}
          >
            <span
              className="brand-mark"
              style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 28px' }}
            >
              <IconAnchor size={28} stroke={2.2} />
            </span>

            <div
              className="landing-display"
              style={{
                fontSize: 'clamp(5rem, 14vw, 9rem)',
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              <em>404</em>
            </div>

            <h1
              className="landing-sans-display"
              style={{
                fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
                margin: '8px 0 14px',
              }}
            >
              Kaptan bu rotayı tanımıyor.
            </h1>

            <p
              style={{
                color: 'var(--fg-mute)',
                fontSize: 15.5,
                lineHeight: 1.55,
                marginBottom: 28,
                maxWidth: 420,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Aradığın sayfa hiç var olmadı, ya da kayboldu. Sorun yok — limanı sapasağlam duruyor.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/" className="btn-primary">
                Anasayfa
                <IconArrowRight size={15} stroke={2.4} />
              </Link>
              <Link href="/tr/docs" className="btn-ghost">
                Dokümanlar
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
