import Link from 'next/link';
import { IconCheck } from '@tabler/icons-react';
import type { LandingCopy } from './copy';

interface PricingProps {
  copy: LandingCopy['pricing'];
  signupHref: string;
}

export function Pricing({ copy, signupHref }: PricingProps) {
  return (
    <section
      id="fiyatlandirma"
      style={{
        position: 'relative',
        padding: 'clamp(72px, 10vw, 128px) 24px',
        scrollMarginTop: 100,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <span className="section-eyebrow">{copy.eyebrow}</span>
          <h2
            className="landing-sans-display"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', margin: 0 }}
          >
            {copy.title}{' '}
            <em
              className="landing-display"
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                background:
                  'linear-gradient(115deg, var(--c-emerald) 0%, var(--c-mint) 50%, var(--c-amber) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {copy.titleEm}
            </em>
          </h2>
          <p
            style={{
              marginTop: 18,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--fg-mute)',
            }}
          >
            {copy.subtitle}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 22,
            alignItems: 'stretch',
          }}
        >
          {copy.tiers.map((t, i) => (
            <article
              key={t.tier}
              className={`pricing-card${t.featured ? ' pricing-card-featured' : ''} reveal reveal-${i + 1}`}
            >
              {t.featured && <span className="pricing-featured-flag">{copy.featuredFlag}</span>}

              <span className="pricing-tier">{t.tier}</span>

              <div className="pricing-price">
                <span className="pricing-price-num">{t.price}</span>
                <span className="pricing-price-unit">{t.unit}</span>
              </div>

              <p className="pricing-blurb">{t.blurb}</p>

              <Link
                href={signupHref}
                className={t.featured ? 'btn-primary' : 'btn-ghost'}
                style={{ justifyContent: 'center' }}
              >
                {t.cta}
              </Link>

              <ul className="pricing-features">
                {t.features.map((f) => (
                  <li key={f} className="pricing-feature">
                    <span className="pricing-feature-icon">
                      <IconCheck size={11} stroke={3} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
