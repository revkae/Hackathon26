import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import type { LandingCopy } from './copy';

interface FinalCTAProps {
  copy: LandingCopy['cta'];
  signupHref: string;
}

export function FinalCTA({ copy, signupHref }: FinalCTAProps) {
  return (
    <section
      style={{
        position: 'relative',
        padding: 'clamp(56px, 8vw, 96px) 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="cta-panel">
          <h2
            className="landing-sans-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.6rem)',
              margin: 0,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {copy.title}{' '}
            <em
              className="landing-display"
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                background:
                  'linear-gradient(115deg, var(--c-amber) 0%, var(--c-emerald) 50%, var(--c-teal) 100%)',
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
              maxWidth: 480,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {copy.text}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 32,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href={signupHref} className="btn-primary">
              {copy.primary}
              <IconArrowRight size={16} stroke={2.4} />
            </Link>
            <button type="button" className="btn-ghost">
              {copy.ghost}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
