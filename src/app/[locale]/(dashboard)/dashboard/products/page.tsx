import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';
import { Title, Stack, SimpleGrid } from '@mantine/core';
import { RealModeGate } from '@/components/RealModeGate';
import { SourceErrorBanner } from '@/components/SourceErrorBanner';
import { getAppMode } from '@/lib/app-mode';
import { getShopifyConnection } from '@/lib/store-connections';
import { fetchShopifyProducts } from '@/lib/shopify';
import { mapShopifyProduct, type MappedProduct } from '@/lib/shopify-map';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const mode = await getAppMode(supabase);

  let items: MappedProduct[] = [];
  let sourceError = false;

  const shopify = mode === 'real' ? await getShopifyConnection(supabase) : null;
  if (shopify) {
    try {
      const products = await fetchShopifyProducts(shopify);
      items = products.map(mapShopifyProduct);
    } catch {
      sourceError = true;
    }
  }

  // Seeded fallback: mock mode, no connection, or a failed Shopify fetch.
  if (!shopify || sourceError) {
    const { data } = await supabase
      .from('products')
      .select('id, name, current_price, category, channels, images');
    items = (data ?? []).map((p) => ({
      name: p.name,
      price: p.current_price,
      category: p.category,
      channels: (p.channels as string[]) ?? [],
      imageUrl: (p.images as string[])?.[0],
    }));
  }

  return (
    <RealModeGate
      feature={locale === 'tr' ? 'Ürünler' : 'Products'}
      platforms={['Shopify', 'Trendyol']}
    >
      <Stack gap="lg">
        <Title order={1}>Ürünler</Title>
        {sourceError && <SourceErrorBanner locale={locale} />}
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
          {items.map((p, i) => (
            <ProductCard
              key={i}
              name={p.name}
              price={p.price}
              category={p.category}
              channels={p.channels}
              imageUrl={p.imageUrl}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </RealModeGate>
  );
}
