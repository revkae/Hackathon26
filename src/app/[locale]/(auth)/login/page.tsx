'use client';
import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { loginWithPassword, loginWithMagicLink } from './actions';

export default function LoginPage() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState('');

  function handlePasswordLogin(formData: FormData) {
    startTransition(async () => {
      const result = await loginWithPassword(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleMagicLink() {
    const formData = new FormData();
    formData.append('email', email);
    startTransition(async () => {
      const result = await loginWithMagicLink(formData);
      if (result?.error) toast.error(result.error);
      else toast.success('Magic link gönderildi — e-postanı kontrol et');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('login')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('tagline')}</p>
      </div>
      <form action={handlePasswordLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email" name="email" type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {t('login')}
        </Button>
      </form>
      <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={pending || !email}>
        ✉ {t('magicLink')}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        {t('noAccount')} <a href="/tr/signup" className="text-emerald-500 underline">{t('signup')}</a>
      </p>
    </div>
  );
}
