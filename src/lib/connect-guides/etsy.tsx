import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Etsy bağlantısı', en: 'Connect Etsy' },
  blurb: {
    tr: 'Uluslararası satış için yorum ve sıralama analizi.',
    en: 'For international reviews and ranking analysis.',
  },
  adminUrl: 'https://www.etsy.com/your/account/apps',
  steps: [
    {
      tr: 'Etsy → Your account → Apps → "Register an app".',
      en: 'Etsy → Your account → Apps → "Register an app".',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Uygulama adı: "KOBİ Kaptanı" → "Listings_r, shops_r, transactions_r" scope\'larını seç.',
      en: 'App name: "KOBI Kaptani" → select scopes "listings_r, shops_r, transactions_r".',
      copySnippet: 'KOBİ Kaptanı',
    },
    {
      tr: 'OAuth flow ile bir Personal Token üret.',
      en: 'Generate a Personal Token via the OAuth flow.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Mağaza adresini (shop-name.etsy.com) URL alanına, token\'ı anahtar alanına yapıştır.',
      en: 'Paste shop URL (shop-name.etsy.com) into URL field and the token into the key field.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
