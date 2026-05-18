import './globals.css';
import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kobikaptani.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'KOBİ Kaptanı — Beş asistan, bir kaptan, sıfır endişe',
    template: '%s · KOBİ Kaptanı',
  },
  description:
    'Çok kanallı satıcılar için altı yapay zeka uzmanı: SEO, pazarlama, fiyatlama, yorum analizi, nakit akışı — hepsi tek panelde, Kaptan tarafından orkestralanıyor.',
  applicationName: 'KOBİ Kaptanı',
  keywords: [
    'AI agent',
    'multi-agent',
    'Shopify',
    'Trendyol',
    'Hepsiburada',
    'SEO',
    'KOBİ',
    'Türkçe AI',
    'Gemini',
    'e-ticaret',
  ],
  authors: [{ name: 'KOBİ Kaptanı' }],
  creator: 'KOBİ Kaptanı',
  openGraph: {
    type: 'website',
    siteName: 'KOBİ Kaptanı',
    title: 'KOBİ Kaptanı — Beş asistan, bir kaptan, sıfır endişe',
    description:
      'Çok kanallı satıcılar için altı yapay zeka uzmanı, tek panel. Gemini AI Hackathon 2026.',
    locale: 'tr_TR',
    alternateLocale: ['en_US'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KOBİ Kaptanı — Beş asistan, bir kaptan, sıfır endişe',
    description:
      'Çok kanallı satıcılar için altı yapay zeka uzmanı, tek panel.',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
