import type { LandingCopy } from './copy';

interface StatsProps {
  copy: LandingCopy['stats'];
}

export function Stats({ copy }: StatsProps) {
  return (
    <section
      style={{
        position: 'relative',
        padding: 'clamp(72px, 10vw, 128px) 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ maxWidth: 720, marginBottom: 56 }}>
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
                  'linear-gradient(115deg, var(--c-lime) 0%, var(--c-emerald) 55%, var(--c-amber) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {copy.titleEm}
            </em>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {copy.items.map((item, i) => (
            <div key={i} className={`stat-card reveal reveal-${i + 1}`}>
              <div className="stat-number">{item.value}</div>
              <p className="stat-label">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
