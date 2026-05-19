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
      tr: 'Shopify yönetim panelini aç ve sol alttaki "Ayarlar"a gir.',
      en: 'Open your Shopify admin and click "Settings" at the bottom-left.',
    },
    {
      tr: 'Ayarlar içinde "Uygulamalar" sekmesine geç, sağ üstteki "Uygulama geliştirin" düğmesine tıkla.',
      en: 'In Settings open the "Apps" tab, then click "Develop apps" at the top-right.',
    },
    {
      tr: '"Uygulama oluştur" → uygulama adı: "KOBİ Kaptanı" → oluştur.',
      en: 'Click "Create an app" → name it "KOBI Kaptani" → create.',
      copySnippet: 'KOBİ Kaptanı',
    },
    {
      tr: '"Yapılandırma" sekmesinde "Admin API kapsamlarını yapılandırın"a gir; read_products, read_orders ve read_customers kapsamlarını işaretle ve "Kaydet"e bas.',
      en: 'On the "Configuration" tab open "Configure Admin API scopes"; tick read_products, read_orders and read_customers, then "Save".',
    },
    {
      tr: '"API kimlik bilgileri" sekmesine geç, "Uygulamayı yükle"ye tıkla ve açılan pencerede "Yükle"yi onayla.',
      en: 'Switch to the "API credentials" tab, click "Install app" and confirm "Install" in the dialog.',
    },
    {
      tr: 'Oluşan "Admin API erişim belirteci"ni kopyala. Mağaza URL\'si (magaza-adin.myshopify.com) ile birlikte bu ekrana yapıştır.',
      en: 'Copy the generated "Admin API access token". Paste it with your store URL (your-store.myshopify.com) into this app.',
    },
  ],
};
