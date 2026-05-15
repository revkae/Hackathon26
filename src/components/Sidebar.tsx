'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NavLink, Stack } from '@mantine/core';
import {
  IconHome,
  IconMessage,
  IconPackage,
  IconMessageCircle,
  IconChartBar,
  IconActivity,
  IconSettings,
} from '@tabler/icons-react';

const items = [
  { key: 'today', href: 'dashboard', icon: IconHome },
  { key: 'chat', href: 'dashboard/chat', icon: IconMessage },
  { key: 'products', href: 'dashboard/products', icon: IconPackage },
  { key: 'reviews', href: 'dashboard/reviews', icon: IconMessageCircle },
  { key: 'cashflow', href: 'dashboard/cashflow', icon: IconChartBar },
  { key: 'trace', href: 'dashboard/trace', icon: IconActivity },
];

export function SidebarNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <Stack gap={4} justify="space-between" h="100%">
      <Stack gap={4}>
        {items.map(({ key, href, icon: Icon }) => {
          const fullHref = `/${locale}/${href}`;
          const active = pathname === fullHref;
          return (
            <NavLink
              key={key}
              component={Link}
              href={fullHref}
              label={t(key)}
              leftSection={<Icon size={18} />}
              active={active}
              variant="light"
            />
          );
        })}
      </Stack>
      <NavLink
        component={Link}
        href={`/${locale}/dashboard/settings`}
        label={t('settings')}
        leftSection={<IconSettings size={18} />}
      />
    </Stack>
  );
}
