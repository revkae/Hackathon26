import Link from 'next/link';
import { IconAnchor } from '@tabler/icons-react';

export default function SignupAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 20px',
        background: 'var(--bg)',
      }}
    >
      <div className="hero-blob" style={{ position: 'fixed', opacity: 0.7 }} />
      <div className="noise-overlay" style={{ position: 'fixed' }} />

      <Link
        href="/"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--fg)',
          textDecoration: 'none',
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

      <main
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 440,
        }}
      >
        {children}
      </main>
    </div>
  );
}
