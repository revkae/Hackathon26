import Link from 'next/link';
import { IconAnchor } from '@tabler/icons-react';
import type { LandingCopy } from './copy';

interface LandingFooterProps {
  copy: LandingCopy['footer'];
  locale: string;
}

export function LandingFooter({ copy, locale }: LandingFooterProps) {
  return (
    <footer className="landing-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1.4fr) repeat(auto-fit, minmax(140px, 1fr))',
            gap: 40,
            paddingBottom: 48,
          }}
        >
          {/* Brand column */}
          <div>
            <Link
              href={`/${locale}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <span className="brand-mark">
                <IconAnchor size={17} stroke={2.4} />
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
                KOBİ Kaptanı
              </span>
            </Link>
            <p
              style={{
                marginTop: 16,
                maxWidth: 280,
                fontSize: 14,
                lineHeight: 1.55,
                color: 'var(--fg-mute)',
              }}
            >
              {copy.tagline}
            </p>
          </div>

          {/* Link groups */}
          {copy.groups.map((group) => (
            <div key={group.heading} className="footer-link-group">
              <h4>{group.heading}</h4>
              {group.links.map((link) => (
                <Link key={link} href="#" className="footer-link">
                  {link}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="soft-divider" />

        <div
          style={{
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--fg-dim)' }}>{copy.legal}</span>
          <span style={{ fontSize: 12, color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>
            v0.1 • {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
