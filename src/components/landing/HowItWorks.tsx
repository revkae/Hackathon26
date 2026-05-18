import type { LandingCopy } from './copy';

interface HowItWorksProps {
  copy: LandingCopy['how'];
}

export function HowItWorks({ copy }: HowItWorksProps) {
  return (
    <section
      id="akis"
      style={{
        position: 'relative',
        padding: 'clamp(72px, 10vw, 128px) 24px',
        scrollMarginTop: 100,
        borderTop: '1px solid var(--border)',
        background:
          'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.012) 50%, transparent 100%)',
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
                  'linear-gradient(115deg, var(--c-emerald) 0%, var(--c-teal) 55%, var(--c-amber) 100%)',
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

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {copy.steps.map((step, i) => (
            <div key={i} className={`step-card reveal reveal-${i + 1}`}>
              <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
