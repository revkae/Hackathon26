import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Shopify mağazanı bağla', en: 'Connect your Shopify store' },
  blurb: {
    tr: 'Ürünler, siparişler ve müşteri verisi anlık senkron olsun diye.',
    en: 'So products, orders, and customer data sync in real time.',
  },
  adminUrl: 'https://admin.shopify.com',
  steps: [
    {
      tr: 'Shopify yöneticine gir → Settings → Apps and sales channels → "Develop apps".',
      en: 'In your Shopify admin → Settings → Apps and sales channels → "Develop apps".',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: '"Create an app" → uygulama adı: "KOBİ Kaptanı" → Create.',
      en: 'Click "Create an app" → name it "KOBI Kaptani" → Create.',
      screenshot: '/connect-guides/placeholder.svg',
      copySnippet: 'KOBİ Kaptanı',
    },
    {
      tr: 'Configuration → "Configure Admin API scopes": read_products, read_orders, read_customers.',
      en: 'Configuration → "Configure Admin API scopes": read_products, read_orders, read_customers.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'API credentials → "Install app" → Admin API access token\'ı kopyala.',
      en: 'API credentials → "Install app" → copy the Admin API access token.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Bu ekranda Mağaza URL\'si (magaza-adin.myshopify.com) ve token\'ı yapıştır.',
      en: 'Paste the store URL (your-store.myshopify.com) and the token into this app.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
