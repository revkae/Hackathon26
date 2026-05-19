import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import type { LandingCopy } from './copy';
import { ChatInput } from './ChatInput';

interface HeroProps {
  copy: LandingCopy['hero'];
  signupHref: string;
  loginHref: string;
}

export function Hero({ copy, signupHref, loginHref }: HeroProps) {
  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 'clamp(64px, 10vw, 140px)',
        paddingBottom: 'clamp(80px, 12vw, 160px)',
        overflow: 'hidden',
      }}
    >
      {/* atmosphere */}
      <div className="hero-blob" />
      <div className="noise-overlay" />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Pill badge */}
        <Link
          href="#akis"
          className="pill-badge reveal reveal-1"
          style={{ textDecoration: 'none' }}
        >
          <span className="pill-badge-tag">{copy.badgeTag}</span>
          <span>{copy.badgeText}</span>
        </Link>

        {/* Headline */}
        <h1
          className="landing-display reveal reveal-2"
          style={{
            fontSize: 'clamp(2.6rem, 7.5vw, 5.6rem)',
            margin: '28px 0 0',
            maxWidth: 980,
          }}
        >
          <em>{copy.titleLead}</em>{' '}
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.04em' }}>
            {copy.titleRest}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="reveal reveal-3"
          style={{
            marginTop: 22,
            maxWidth: 620,
            fontSize: 'clamp(15px, 1.5vw, 17px)',
            lineHeight: 1.55,
            color: 'var(--fg-mute)',
          }}
        >
          {copy.subtitle}
        </p>

        {/* Chat input (interactive) */}
        <ChatInput
          placeholder={copy.chatPlaceholder}
          modes={copy.chatModes}
          signupHref={signupHref}
          rotatingPlaceholders={copy.chatRotating}
        />

        {/* CTAs */}
        <div
          className="reveal reveal-5"
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 32,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link href={signupHref} className="btn-primary">
            {copy.primaryCta}
            <IconArrowRight size={16} stroke={2.4} />
          </Link>
          <Link href="#akis" className="btn-ghost">
            {copy.ghostCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
