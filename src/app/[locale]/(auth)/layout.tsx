import { useTranslations } from 'next-intl';
import { Stack, Title, Text, Center } from '@mantine/core';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="hidden lg:flex flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, var(--mantine-color-shopifyGreen-9) 0%, var(--mantine-color-shopifyGreen-7) 50%, var(--mantine-color-dark-7, #1a1b1e) 100%)',
        }}
      >
        <div style={{ fontSize: '2.5rem' }}>⚓</div>

        <Stack gap="md">
          <Title order={1} style={{ fontSize: '3.5rem', lineHeight: 1.15, color: 'white' }}>
            KOBİ<br />Kaptanı
          </Title>
          <Text
            size="lg"
            fs="italic"
            style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '320px' }}
          >
            &ldquo;{t('tagline')}&rdquo;
          </Text>
        </Stack>

        <Text size="sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          © 2026 KOBİ Kaptanı
        </Text>
      </aside>

      <main className="flex items-center justify-center p-8">
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
