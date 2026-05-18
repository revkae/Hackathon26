'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { IconArrowRight } from '@tabler/icons-react';
import { signup } from './actions';

export default function SignupPage() {
  const t = useTranslations('auth');
  const params = useParams<{ locale: string }>();
  const [pending, startTransition] = useTransition();

  const locale = params.locale ?? 'tr';
  const loginHref = `/${locale}/login`;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) {
        notifications.show({ color: 'red', message: result.error });
      }
    });
  }

  return (
    <div className="auth-card reveal reveal-1">
      <h2>{t('signup')}</h2>
      <p className="lead">
        {locale === 'tr'
          ? 'Bir dakikada içeride. Kredi kartı gerekmez.'
          : "You're in within a minute. No credit card needed."}
      </p>

      <form action={handleSubmit}>
        <label htmlFor="businessName">{t('businessName')}</label>
        <input
          id="businessName"
          name="businessName"
          required
          placeholder={locale === 'tr' ? 'Şirket adı' : 'Company name'}
          className="auth-input"
        />

        <label htmlFor="email">{t('email')}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ornek@sirket.com"
          className="auth-input"
        />

        <label htmlFor="password">{t('password')}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="••••••••"
          className="auth-input"
        />

        <button type="submit" className="auth-submit" disabled={pending}>
          {pending ? '…' : t('signup')}
          {!pending && <IconArrowRight size={15} stroke={2.4} />}
        </button>
      </form>

      <p className="auth-foot">
        {t('haveAccount')} <a href={loginHref}>{t('login')}</a>
      </p>
    </div>
  );
}
