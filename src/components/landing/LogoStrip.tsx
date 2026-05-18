import type { LandingCopy } from './copy';

interface LogoStripProps {
  copy: LandingCopy['logoStrip'];
}

export function LogoStrip({ copy }: LogoStripProps) {
  return (
    <section
      style={{
        position: 'relative',
        padding: '32px 24px 56px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--fg-dim)',
            marginBottom: 28,
            fontWeight: 600,
          }}
        >
          {copy.label}
        </p>
        <div className="logo-strip">
          {copy.items.map((item) => (
            <span key={item} className="logo-strip-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
