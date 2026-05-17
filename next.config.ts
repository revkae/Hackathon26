import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // Pin the workspace root — a stray lockfile in the home dir otherwise makes
  // Turbopack infer the wrong root directory.
  turbopack: {
    root: import.meta.dirname,
  },
  // Genkit needs Node.js runtime, not Edge
  serverExternalPackages: ['@genkit-ai/google-genai', 'genkit'],
};

export default withNextIntl(nextConfig);
