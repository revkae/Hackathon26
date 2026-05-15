'use client';
import { Group, Menu, ActionIcon, Text } from '@mantine/core';
import { IconUser, IconLogout } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LanguageToggle } from './LanguageToggle';
import { ColorSchemeToggle } from './ColorSchemeToggle';

export function TopbarContent({ businessName, locale }: { businessName: string; locale: string }) {
  const t = useTranslations('nav');
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  return (
    <Group gap="sm">
      <Text size="sm" c="dimmed" visibleFrom="sm">{businessName}</Text>
      <LanguageToggle currentLocale={locale} />
      <ColorSchemeToggle />
      <Menu position="bottom-end" withArrow shadow="md">
        <Menu.Target>
          <ActionIcon variant="subtle" size="lg" aria-label="User menu">
            <IconUser size={18} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconLogout size={16} />} onClick={logout}>
            {t('logout')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
