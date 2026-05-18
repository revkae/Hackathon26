import Link from 'next/link';
import { IconAnchor, IconArrowRight } from '@tabler/icons-react';
import type { LandingCopy } from './copy';
import { ThemeToggle } from './ThemeToggle';

interface LandingNavProps {
  copy: LandingCopy['nav'];
  locale: string;
  loginHref: string;
  signupHref: string;
}

export function LandingNav({ copy, locale, loginHref, signupHref }: LandingNavProps) {
  const otherLocale = locale === 'tr' ? 'en' : 'tr';

  return (
    <header className="landing-nav">
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <Link
          href={`/${locale}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span className="brand-mark">
            <IconAnchor size={17} stroke={2.4} />
          </span>
          <span className="brand-wordmark" style={{ fontSize: 16, fontWeight: 600 }}>
            KOBİ Kaptanı
          </span>
        </Link>

        {/* Center nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
          }}
          className="nav-center"
        >
          <Link href={`/${locale}#mürettebat`} className="nav-link">{copy.solutions}</Link>
          <Link href={`/${locale}#fiyatlandirma`} className="nav-link">{copy.pricing}</Link>
          <Link href={`/${locale}/docs`} className="nav-link">{copy.docs}</Link>
          <Link href={`/${locale}#akis`} className="nav-link">{copy.community}</Link>
        </nav>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href={`/${otherLocale}`}
            className="nav-link"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              padding: '6px 10px',
              border: '1px solid var(--border)',
              borderRadius: 999,
            }}
          >
            {otherLocale.toUpperCase()}
          </Link>
          <ThemeToggle />
          <Link href={loginHref} className="btn-ghost btn-small">
            {copy.signIn}
          </Link>
          <Link href={signupHref} className="btn-primary btn-small">
            {copy.getStarted}
            <IconArrowRight size={14} stroke={2.4} />
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .nav-center { display: none !important; }
        }
      `}</style>
    </header>
  );
}
