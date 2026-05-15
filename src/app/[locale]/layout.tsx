import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { locales, type Locale } from '@/i18n';
import { mantineTheme } from '@/lib/mantine-theme';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <MantineProvider theme={mantineTheme} defaultColorScheme="auto">
          <NextIntlClientProvider messages={messages}>
            <Notifications position="top-right" />
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
