import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';
import { Title, Stack, SimpleGrid } from '@mantine/core';
import { RealModeGate } from '@/components/RealModeGate';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, current_price, category, channels, images');

  return (
    <RealModeGate
      feature={locale === 'tr' ? 'Ürünler' : 'Products'}
      platforms={['Shopify', 'Trendyol']}
    >
      <Stack gap="lg">
        <Title order={1}>Ürünler</Title>
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
          {(products ?? []).map(p => (
            <ProductCard
              key={p.id}
              name={p.name}
              price={p.current_price}
              category={p.category}
              channels={(p.channels as string[]) ?? []}
              imageUrl={(p.images as string[])?.[0]}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </RealModeGate>
  );
}
