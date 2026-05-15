'use client';
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700}>⚓ KOBİ Kaptanı</Text>
          </Group>
          <TopbarContent businessName={businessName} locale={locale} />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <SidebarNav locale={locale} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
