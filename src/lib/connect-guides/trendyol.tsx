import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Trendyol bağlantısı', en: 'Connect Trendyol' },
  blurb: {
    tr: 'Pazaryeri sıralaması ve rakip fiyat takibi için.',
    en: 'For marketplace ranking and competitor price tracking.',
  },
  adminUrl: 'https://partner.trendyol.com',
  steps: [
    {
      tr: 'Trendyol Partner Paneli → Entegrasyonlar → API Bilgileri.',
      en: 'Trendyol Partner Panel → Integrations → API Information.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Supplier ID\'ni not et (sağ üst köşede ya da sözleşmende yazıyor).',
      en: 'Note your Supplier ID (shown top-right or in your contract).',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'API Key ve API Secret üret → ikisini de kopyala.',
      en: 'Generate API Key and API Secret → copy both.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Bu ekranda Supplier ID\'yi URL alanına, "key:secret" formatını anahtar alanına yapıştır.',
      en: 'Paste the Supplier ID into URL field and "key:secret" into the key field.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
