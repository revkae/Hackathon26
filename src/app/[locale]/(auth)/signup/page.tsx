'use client';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { signup } from './actions';

export default function SignupPage() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('signup')}</h2>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="businessName">{t('businessName')}</Label>
          <Input id="businessName" name="businessName" required />
        </div>
        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {t('signup')}
        </Button>
      </form>
      <p className="text-sm text-center text-muted-foreground">
        {t('haveAccount')} <a href="/tr/login" className="text-emerald-500 underline">{t('login')}</a>
      </p>
    </div>
  );
}
