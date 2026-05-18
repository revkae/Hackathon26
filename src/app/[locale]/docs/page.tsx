import { LANDING_COPY } from '@/components/landing/copy';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { DocsContent } from '@/components/landing/DocsContent';

export const dynamic = 'force-static';

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = LANDING_COPY[locale] ?? LANDING_COPY.tr;
  const loginHref = `/${locale}/login`;
  const signupHref = `/${locale}/signup`;

  return (
    <div className="landing-root">
      <LandingNav copy={c.nav} locale={locale} loginHref={loginHref} signupHref={signupHref} />
      <main>
        <DocsContent locale={locale} />
      </main>
      <LandingFooter copy={c.footer} locale={locale} />
    </div>
  );
}
