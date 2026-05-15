import { createTheme, type MantineColorsTuple } from '@mantine/core';

const shopifyGreen: MantineColorsTuple = [
  '#e6f3ed',
  '#bfe1d0',
  '#97cfb3',
  '#6ebd95',
  '#46ab78',
  '#008060',
  '#006e52',
  '#005c43',
  '#004a35',
  '#003827',
];

export const mantineTheme = createTheme({
  primaryColor: 'shopifyGreen',
  colors: { shopifyGreen },
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, ui-monospace, monospace',
  defaultRadius: 'sm',
  headings: {
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '1.75rem', lineHeight: '1.3' },
      h2: { fontSize: '1.25rem', lineHeight: '1.4' },
      h3: { fontSize: '1.125rem', lineHeight: '1.4' },
    },
  },
  components: {
    Card: {
      defaultProps: { withBorder: true, padding: 'md', radius: 'sm' },
    },
    Button: {
      defaultProps: { radius: 'sm' },
    },
    Paper: {
      defaultProps: { withBorder: true, radius: 'sm' },
    },
    Badge: {
      defaultProps: { radius: 'sm' },
    },
  },
});
