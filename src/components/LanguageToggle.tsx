'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Button } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';

const localesList = [
  { code: 'tr', label: '🇹🇷 Türkçe' },
  { code: 'en', label: '🇬🇧 English' },
];

export function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    const newPath = pathname.replace(/^\/(tr|en)/, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <Menu position="bottom-end" withArrow shadow="md">
      <Menu.Target>
        <Button variant="subtle" size="sm" leftSection={<IconWorld size={16} />}>
          {currentLocale === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {localesList.map((l) => (
          <Menu.Item key={l.code} onClick={() => switchLocale(l.code)}>
            {l.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
