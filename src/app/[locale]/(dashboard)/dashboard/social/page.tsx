import { createClient } from '@/lib/supabase/server';
import { getAppMode } from '@/lib/app-mode';
import { getShopifyConnection } from '@/lib/store-connections';
import { fetchShopifyProducts } from '@/lib/shopify';
import { SocialClient } from './SocialClient';

export const dynamic = 'force-dynamic';

interface SocialProduct {
  id: string;
  name: string;
  category: string;
  price: number | null;
  imageUrl: string | null;
}

export default async function SocialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const mode = await getAppMode(supabase);

  let products: SocialProduct[] = [];
  let usedShopify = false;

  // Real mode + connected Shopify → live catalog, same source as /products.
  const shopify = mode === 'real' ? await getShopifyConnection(supabase) : null;
  if (shopify) {
    try {
      const shopifyProducts = await fetchShopifyProducts(shopify);
      products = shopifyProducts.map((p) => {
        const raw = p.variants[0]?.price;
        const price = raw != null ? Number.parseFloat(raw) : Number.NaN;
        return {
          id: String(p.id),
          name: p.title,
          category: p.product_type || '',
          price: Number.isFinite(price) ? price : null,
          imageUrl: p.images[0]?.src ?? null,
        };
      });
      usedShopify = true;
    } catch {
      usedShopify = false;
    }
  }

  // Seeded fallback: demo mode, no connection, or a failed Shopify fetch.
  if (!usedShopify) {
    const { data } = await supabase
      .from('products')
      .select('id, name, category, current_price, images')
      .limit(20);
    products = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ?? '',
      price: p.current_price ?? null,
      imageUrl: (p.images as string[])?.[0] ?? null,
    }));
  }

  return <SocialClient locale={locale} products={products} />;
}
