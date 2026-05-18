import {
  IconSearch,
  IconSpeakerphone,
  IconCoin,
  IconMessageCircle,
  IconChartBar,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';
import { AGENT_ORDER, AGENT_VARIANT, type AgentKey, type LandingCopy } from './copy';

const AGENT_ICON: Record<AgentKey, ComponentType<IconProps>> = {
  seo: IconSearch,
  marketing: IconSpeakerphone,
  pricing: IconCoin,
  reviews: IconMessageCircle,
  cashflow: IconChartBar,
};

interface AgentGalleryProps {
  copy: LandingCopy['agents'];
}

export function AgentGallery({ copy }: AgentGalleryProps) {
  return (
    <section
      id="mürettebat"
      style={{
        position: 'relative',
        padding: 'clamp(72px, 10vw, 128px) 24px',
        scrollMarginTop: 100,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'left', maxWidth: 760, marginBottom: 56 }}>
          <span className="section-eyebrow">{copy.eyebrow}</span>
          <h2
            className="landing-sans-display"
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
              margin: 0,
            }}
          >
            <span>{copy.title}</span>{' '}
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
              maxWidth: 560,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--fg-mute)',
            }}
          >
            {copy.subtitle}
          </p>
        </div>

        {/* Grid: 3 across on top row, 2 centered on bottom — asymmetric per Lovable */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {AGENT_ORDER.map((key, i) => {
            const Icon = AGENT_ICON[key];
            const variant = AGENT_VARIANT[key];
            const agent = copy.items[key];
            return (
              <article
                key={key}
                className={`agent-card agent-card-${variant} reveal reveal-${Math.min(i + 1, 6)}`}
              >
                <span className="agent-icon">
                  <Icon size={22} stroke={1.8} />
                </span>
                <h3>{agent.name}</h3>
                <p>{agent.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
