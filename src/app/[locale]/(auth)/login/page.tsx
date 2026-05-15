'use client';
import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TextInput, PasswordInput, Button, Title, Text, Stack, Anchor, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMail } from '@tabler/icons-react';
import { loginWithPassword, loginWithMagicLink } from './actions';

export default function LoginPage() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState('');

  function handlePasswordLogin(formData: FormData) {
    startTransition(async () => {
      const result = await loginWithPassword(formData);
      if (result?.error) {
        notifications.show({
          color: 'red',
          message: result.error,
        });
      }
    });
  }

  function handleMagicLink() {
    const formData = new FormData();
    formData.append('email', email);
    startTransition(async () => {
      const result = await loginWithMagicLink(formData);
      if (result?.error) {
        notifications.show({
          color: 'red',
          message: result.error,
        });
      } else {
        notifications.show({
          color: 'green',
          message: 'Magic link gönderildi — e-postanı kontrol et',
        });
      }
    });
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>{t('login')}</Title>
        <Text size="sm" c="dimmed" mt={4}>{t('tagline')}</Text>
      </div>

      <form action={handlePasswordLogin}>
        <Stack gap="md">
          <TextInput
            name="email"
            type="email"
            required
            label={t('email')}
            placeholder="ornek@sirket.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            name="password"
            required
            label={t('password')}
          />
          <Button type="submit" fullWidth loading={pending} mt="xs">
            {t('login')}
          </Button>
        </Stack>
      </form>

      <Divider label="veya" labelPosition="center" />

      <Button
        variant="default"
        fullWidth
        leftSection={<IconMail size={16} />}
        onClick={handleMagicLink}
        disabled={pending || !email}
      >
        {t('magicLink')}
      </Button>

      <Text size="sm" ta="center" c="dimmed">
        {t('noAccount')}{' '}
        <Anchor href="/tr/signup" c="shopifyGreen">
          {t('signup')}
        </Anchor>
      </Text>
    </Stack>
  );
}
