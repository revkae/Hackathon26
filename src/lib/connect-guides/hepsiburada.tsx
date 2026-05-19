import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Hepsiburada bağlantısı', en: 'Connect Hepsiburada' },
  blurb: {
    tr: 'Stok ve fiyat yönetimi için Merchant ID + API erişimi.',
    en: 'Merchant ID + API access for inventory and pricing.',
  },
  adminUrl: 'https://merchant.hepsiburada.com',
  steps: [
    {
      tr: 'Hepsiburada Mağaza Paneli → Hesap Yönetimi → Entegrasyon → "API Anahtarı".',
      en: 'Merchant Panel → Account → Integration → "API Key".',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Merchant ID\'ni not et (Hesap Bilgileri sayfasında).',
      en: 'Copy your Merchant ID from the Account Info page.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Yeni API Anahtarı talep et → onaylanınca kopyala.',
      en: 'Request a new API Key → copy it once approved.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Bu ekranda Merchant ID\'yi URL alanına, API Anahtarını anahtar alanına yapıştır.',
      en: 'Paste Merchant ID into URL field and API Key into the key field.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
