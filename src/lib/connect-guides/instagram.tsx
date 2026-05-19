import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Instagram bağlantısı', en: 'Connect Instagram' },
  blurb: {
    tr: 'İşletme hesabını bağla — paylaşımlar @kullanici_adin altında görünsün.',
    en: 'Connect your business account so posts attribute to @yourhandle.',
  },
  adminUrl: 'https://business.facebook.com',
  steps: [
    {
      tr: 'Instagram hesabının "Business" türüne dönüştürülmüş olmalı (Settings → Account type).',
      en: 'Your Instagram account must be a "Business" account (Settings → Account type).',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Facebook Business Suite → Settings → "Business Assets" → Instagram hesabını bağla.',
      en: 'Facebook Business Suite → Settings → "Business Assets" → link the Instagram account.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Meta for Developers → My Apps → "Create App" → "Business" tipi → Instagram Graph API ekle.',
      en: 'Meta for Developers → My Apps → "Create App" → "Business" type → add Instagram Graph API.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Graph API Explorer\'dan uzun-ömürlü bir kullanıcı token\'ı üret.',
      en: 'Generate a long-lived user access token from the Graph API Explorer.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Kullanıcı adını (@handle) ve token\'ı bu ekrandaki Instagram formuna yapıştır.',
      en: 'Paste the username (@handle) and token into the Instagram form here.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
