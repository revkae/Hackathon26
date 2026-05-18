'use client';

import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

/**
 * Both icons render in the DOM; CSS picks which one is visible based on
 * the html-level data-mantine-color-scheme attribute. This sidesteps the
 * classic SSR/CSR mismatch where the server doesn't know the user's scheme.
 */
export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light');

  const toggle = () => setColorScheme(computed === 'dark' ? 'light' : 'dark');

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label="Toggle color scheme"
      title="Toggle theme"
    >
      <IconSun size={15} stroke={2} className="theme-toggle-sun" />
      <IconMoon size={15} stroke={2} className="theme-toggle-moon" />
    </button>
  );
}
