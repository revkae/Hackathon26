import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconAnchor } from '@tabler/icons-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');
  return (
    <div className="auth-root">
      {/* Atmosphere */}
      <div className="hero-blob" style={{ position: 'fixed', opacity: 0.7 }} />
      <div className="noise-overlay" style={{ position: 'fixed' }} />

      <aside className="auth-aside">
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--fg)',
            textDecoration: 'none',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span className="brand-mark">
            <IconAnchor size={17} stroke={2.4} />
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
            KOBİ Kaptanı
          </span>
        </Link>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1
            className="landing-display"
            style={{
              fontSize: 'clamp(2.6rem, 4.5vw, 3.6rem)',
              lineHeight: 1.02,
              margin: 0,
            }}
          >
            <em>Beş</em>{' '}
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.04em' }}>
              asistan,<br />bir kaptan.
            </span>
          </h1>
          <p
            style={{
              marginTop: 18,
              maxWidth: 360,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--fg-mute)',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{t('tagline')}&rdquo;
          </p>
        </div>

        <p style={{ fontSize: 13, color: 'var(--fg-dim)', position: 'relative', zIndex: 2 }}>
          © 2026 KOBİ Kaptanı · Gemini AI Hackathon
        </p>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}
