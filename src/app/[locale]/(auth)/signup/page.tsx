'use client';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { TextInput, PasswordInput, Button, Title, Text, Stack, Anchor } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { signup } from './actions';

export default function SignupPage() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) {
        notifications.show({
          color: 'red',
          message: result.error,
        });
      }
    });
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>{t('signup')}</Title>
      </div>

      <form action={handleSubmit}>
        <Stack gap="md">
          <TextInput
            name="businessName"
            required
            label={t('businessName')}
            placeholder="Şirket adı"
          />
          <TextInput
            name="email"
            type="email"
            required
            label={t('email')}
            placeholder="ornek@sirket.com"
          />
          <PasswordInput
            name="password"
            required
            label={t('password')}
            minLength={8}
          />
          <Button type="submit" fullWidth loading={pending} mt="xs">
            {t('signup')}
          </Button>
        </Stack>
      </form>

      <Text size="sm" ta="center" c="dimmed">
        {t('haveAccount')}{' '}
        <Anchor href="/tr/login" c="shopifyGreen">
          {t('login')}
        </Anchor>
      </Text>
    </Stack>
  );
}
