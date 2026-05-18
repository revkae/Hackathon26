'use client';

import { useTransition, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { IconMail, IconArrowRight } from '@tabler/icons-react';
import { loginWithPassword, loginWithMagicLink } from './actions';

export default function LoginPage() {
  const t = useTranslations('auth');
  const params = useParams<{ locale: string }>();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState('');

  const locale = params.locale ?? 'tr';
  const signupHref = `/${locale}/signup`;

  // If user came from the landing chat input we get ?q=...; surface it as a hint.
  const seedQuery = search.get('q');

  useEffect(() => {
    if (seedQuery) {
      notifications.show({
        color: 'green',
        title: locale === 'tr' ? 'Sorgun kaydedildi' : 'Your query is saved',
        message:
          locale === 'tr'
            ? `Giriş yaptıktan sonra Kaptan şununla başlayacak: "${seedQuery}"`
            : `After you sign in, the Captain will start with: "${seedQuery}"`,
        autoClose: 6000,
      });
    }
  }, [seedQuery, locale]);

  function handlePasswordLogin(formData: FormData) {
    startTransition(async () => {
      const result = await loginWithPassword(formData);
      if (result?.error) {
        notifications.show({ color: 'red', message: result.error });
      }
    });
  }

  function handleMagicLink() {
    const formData = new FormData();
    formData.append('email', email);
    startTransition(async () => {
      const result = await loginWithMagicLink(formData);
      if (result?.error) {
        notifications.show({ color: 'red', message: result.error });
      } else {
        notifications.show({
          color: 'green',
          message:
            locale === 'tr'
              ? 'Magic link gönderildi — e-postanı kontrol et'
              : 'Magic link sent — check your inbox',
        });
      }
    });
  }

  return (
    <div className="auth-card reveal reveal-1">
      <h2>{t('login')}</h2>
      <p className="lead">{t('tagline')}</p>

      <form action={handlePasswordLogin}>
        <label htmlFor="email">{t('email')}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ornek@sirket.com"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />

        <label htmlFor="password">{t('password')}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="auth-input"
        />

        <button type="submit" className="auth-submit" disabled={pending}>
          {pending ? '…' : t('login')}
          {!pending && <IconArrowRight size={15} stroke={2.4} />}
        </button>
      </form>

      <div className="auth-divider">
        <span>{locale === 'tr' ? 'veya' : 'or'}</span>
      </div>

      <button
        type="button"
        className="auth-ghost"
        onClick={handleMagicLink}
        disabled={pending || !email}
      >
        <IconMail size={15} stroke={2.2} />
        {t('magicLink')}
      </button>

      <p className="auth-foot">
        {t('noAccount')} <a href={signupHref}>{t('signup')}</a>
      </p>
    </div>
  );
}
