import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LANDING_COPY } from '@/components/landing/copy';
import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { LogoStrip } from '@/components/landing/LogoStrip';
import { AgentGallery } from '@/components/landing/AgentGallery';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Stats } from '@/components/landing/Stats';
import { Pricing } from '@/components/landing/Pricing';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(`/${locale}/dashboard`);

  const c = LANDING_COPY[locale] ?? LANDING_COPY.tr;
  const loginHref = `/${locale}/login`;
  const signupHref = `/${locale}/signup`;

  return (
    <div className="landing-root">
      <LandingNav
        copy={c.nav}
        locale={locale}
        loginHref={loginHref}
        signupHref={signupHref}
      />
      <main>
        <Hero copy={c.hero} signupHref={signupHref} loginHref={loginHref} />
        <LogoStrip copy={c.logoStrip} />
        <AgentGallery copy={c.agents} />
        <HowItWorks copy={c.how} />
        <Stats copy={c.stats} />
        <Pricing copy={c.pricing} signupHref={signupHref} />
        <FinalCTA copy={c.cta} signupHref={signupHref} />
      </main>
      <LandingFooter copy={c.footer} locale={locale} />
    </div>
  );
}
