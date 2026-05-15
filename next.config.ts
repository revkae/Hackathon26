import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // Genkit needs Node.js runtime, not Edge
  serverExternalPackages: ['@genkit-ai/vertexai', 'genkit'],
};

export default withNextIntl(nextConfig);
