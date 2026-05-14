import { createClient } from '@supabase/supabase-js';
import { env } from '../src/lib/env';

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function seed() {
  const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
    email: 'ayse@seramik.com',
    password: 'AyseDemo2026!',
    email_confirm: true,
    user_metadata: { business_name: 'Ayşe Seramik Atölyesi' },
  });
  if (signUpError) throw signUpError;
  if (!user) throw new Error('User not created');
  console.log('Created demo user:', user.id);

  const productTemplates = [
    { name: 'El Yapımı Mavi Vazo', category: 'vazo', price: 280, cost: 120 },
    { name: 'Seramik Türk Kahvesi Fincanı', category: 'fincan', price: 95, cost: 35 },
    { name: 'Dekoratif Duvar Tabağı Set', category: 'tabak', price: 420, cost: 180 },
    { name: 'El Yapımı Beyaz Vazo', category: 'vazo', price: 260, cost: 115 },
    { name: 'Seramik Espresso Fincanı', category: 'fincan', price: 75, cost: 28 },
    { name: "Yemek Tabağı 4'lü Set", category: 'tabak', price: 380, cost: 160 },
    { name: 'Çiçek Vazosu Büyük', category: 'vazo', price: 340, cost: 145 },
    { name: 'Cappuccino Fincan Seti', category: 'fincan', price: 145, cost: 55 },
    { name: 'Servis Tabağı Tek', category: 'tabak', price: 220, cost: 95 },
    { name: 'Minyatür Vazo Set', category: 'vazo', price: 195, cost: 85 },
    { name: "Çay Fincanı 6'lı Set", category: 'fincan', price: 165, cost: 70 },
    { name: 'Antika Görünümlü Tabak', category: 'tabak', price: 290, cost: 125 },
    { name: 'Tek Çiçek Vazosu', category: 'vazo', price: 175, cost: 75 },
    { name: 'Sürahi ve Bardak Seti', category: 'fincan', price: 280, cost: 120 },
    { name: 'Dekoratif Şamdan', category: 'tabak', price: 240, cost: 100 },
  ];

  const products = productTemplates.map(tpl => ({
    profile_id: user.id,
    name: tpl.name,
    description: `Atölyede el yapımı ${tpl.category}, tek tek üretilir.`,
    current_price: tpl.price,
    cost_basis: tpl.cost,
    category: tpl.category,
    channels: ['shopify', 'trendyol', 'hepsiburada'],
  }));

  const { data: insertedProducts, error: pErr } = await supabase
    .from('products').insert(products).select();
  if (pErr) throw pErr;
  console.log(`Inserted ${insertedProducts.length} products`);

  const reviewBodies = [
    { lang: 'tr', rating: 5, body: 'Harika bir ürün, çok kaliteli. Doğum günü hediyesi olarak aldım, çok beğenildi.' },
    { lang: 'tr', rating: 4, body: 'Güzel ama paketleme biraz daha iyi olabilirdi.' },
    { lang: 'tr', rating: 2, body: 'Kargo sırasında kırıldı, paketleme yetersizdi.' },
    { lang: 'en', rating: 5, body: 'Beautiful handcrafted piece. Love the quality.' },
    { lang: 'en', rating: 3, body: 'Nice but smaller than I expected.' },
  ];

  const reviews = [];
  for (const product of insertedProducts) {
    for (const r of reviewBodies) {
      reviews.push({
        product_id: product.id,
        channel: 'shopify',
        language: r.lang,
        rating: r.rating,
        body: r.body,
        posted_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }
  await supabase.from('reviews').insert(reviews);
  console.log(`Inserted ${reviews.length} reviews`);

  const sales = [];
  const now = Date.now();
  for (let day = 0; day < 180; day++) {
    const date = new Date(now - day * 24 * 60 * 60 * 1000);
    const dailyCount = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < dailyCount; i++) {
      const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      sales.push({
        profile_id: user.id,
        product_id: product.id,
        channel: ['shopify', 'trendyol', 'hepsiburada'][Math.floor(Math.random() * 3)],
        quantity,
        unit_price: product.current_price,
        total_revenue: product.current_price * quantity,
        occurred_at: date.toISOString(),
      });
    }
  }
  await supabase.from('sales').insert(sales);
  console.log(`Inserted ${sales.length} sales`);

  const expenses = [
    { description: 'Hammadde alımı (kil + sır)', amount: 8500, category: 'hammadde', due_at_days: 12 },
    { description: 'Atölye kirası', amount: 6000, category: 'kira', due_at_days: 22 },
    { description: 'Elektrik faturası', amount: 1200, category: 'fatura', due_at_days: 18 },
    { description: 'Vergi (3 aylık)', amount: 4500, category: 'vergi', due_at_days: 45 },
    { description: 'Kargo anlaşması', amount: 2200, category: 'lojistik', due_at_days: 30 },
  ];
  await supabase.from('expenses').insert(
    expenses.map(e => ({
      profile_id: user.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      due_at: new Date(now + e.due_at_days * 24 * 60 * 60 * 1000).toISOString(),
      paid: false,
    }))
  );
  console.log('Inserted expenses');

  console.log('\n Done! Seed complete!');
  console.log('Login: ayse@seramik.com / AyseDemo2026!');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
