'use client';
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAnchor } from '@tabler/icons-react';
import { SidebarNav } from './Sidebar';
import { TopbarContent } from './Topbar';

export function DashboardShell({
  locale,
  businessName,
  children,
}: {
  locale: string;
  businessName: string;
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <div className="dash-root">
      <div className="dash-ambient" />
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 232, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="lg"
        styles={{
          root: { background: 'transparent', position: 'relative', zIndex: 1 },
          header: {
            background: 'color-mix(in srgb, var(--bg-deep) 70%, transparent)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            borderBottom: '1px solid var(--border)',
          },
          navbar: {
            background: 'color-mix(in srgb, var(--bg-deep) 65%, transparent)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            borderRight: '1px solid var(--border)',
          },
          main: { background: 'transparent', color: 'var(--fg)' },
        }}
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="xs">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <span className="brand-mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
                <IconAnchor size={15} stroke={2.4} />
              </span>
              <Text fw={700} style={{ letterSpacing: '-0.01em' }}>
                KOBİ Kaptanı
              </Text>
            </Group>
            <TopbarContent businessName={businessName} locale={locale} />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <SidebarNav locale={locale} />
        </AppShell.Navbar>

        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </div>
  );
}
