'use client';
import { ActionIcon, Menu, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceLaptop } from '@tabler/icons-react';

export function ColorSchemeToggle() {
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const icon = computed === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />;

  return (
    <Menu position="bottom-end" withArrow shadow="md">
      <Menu.Target>
        <ActionIcon variant="subtle" size="lg" aria-label="Toggle color scheme">
          {icon}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconSun size={16} />}
          onClick={() => setColorScheme('light')}
          color={colorScheme === 'light' ? 'shopifyGreen' : undefined}
        >
          Light
        </Menu.Item>
        <Menu.Item
          leftSection={<IconMoon size={16} />}
          onClick={() => setColorScheme('dark')}
          color={colorScheme === 'dark' ? 'shopifyGreen' : undefined}
        >
          Dark
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDeviceLaptop size={16} />}
          onClick={() => setColorScheme('auto')}
          color={colorScheme === 'auto' ? 'shopifyGreen' : undefined}
        >
          System
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
